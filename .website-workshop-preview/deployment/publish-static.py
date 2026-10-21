"""Prepare and activate the two reviewed static frontends; never modify the API."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile

ROOT = Path('/home/abarry/musicgen')
mode, release_id = sys.argv[1:3]
if not re.fullmatch(r'studio-\d{8}T\d{6}Z', release_id):
    raise SystemExit('Invalid release id')
release = ROOT / 'frontend-releases' / release_id
links = {
    'website-workshop': ROOT / 'build/website-workshop',
    'manage-servers': ROOT / 'build/manage-servers',
    'manage_servers': ROOT / 'build/manage_servers',
}

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

def verify_files(manifest):
    for item in manifest['files']:
        file = release / item['path']
        if not file.is_relative_to(release) or digest(file) != item['sha256']:
            raise RuntimeError('Release checksum mismatch: ' + item['path'])

def replace_link(link, target):
    temporary = link.with_name('.' + link.name + '-' + release_id)
    os.symlink(target, temporary)
    os.replace(temporary, link)

if mode == 'prepare':
    archive = Path(sys.argv[3])
    if release.exists():
        raise SystemExit('Release already exists')
    previous = {}
    for name, link in links.items():
        if not link.is_symlink() or not link.resolve().is_dir():
            raise SystemExit('Expected an existing frontend symlink: ' + str(link))
        previous[name] = os.readlink(link)
    expected = {
        links['website-workshop'] / 'index.html': 'a8681384d2d2ab16a97fec269b65aa3309ae4bcc75334d0843dbd7d8cc481bd4',
        links['website-workshop'] / 'assets/index-fkdtBi_i.js': '6e73eb40790a277b40b8fdfa1c3986488b534c7e20376c5a61f5307057dab9b6',
        links['manage-servers'] / 'static/js/main.7e1f137c.js': '9723911f724eac14931d4662e3536ae7011f4ae8a3a09e4a5e762f9023089d56',
    }
    for file, value in expected.items():
        if digest(file) != value:
            raise SystemExit('Production changed since inspection: ' + str(file))
    backup_dir = ROOT / 'backups/frontend-releases' / release_id
    backup_dir.mkdir(parents=True, exist_ok=True)
    with tarfile.open(backup_dir / 'frontends.tar.gz', 'w:gz', dereference=False) as backup:
        backup.add(links['website-workshop'].resolve(), arcname='website-workshop')
        backup.add(links['manage-servers'].resolve(), arcname='manage-servers')
    print('Previous frontends backed up', flush=True)
    sessions = ROOT / 'api/website_workshop_sessions'
    if sessions.is_dir():
        sessions_backup = backup_dir / 'website_workshop_sessions.tar.gz'
        subprocess.run(['tar', '-czf', str(sessions_backup), '-C', str(sessions.parent), sessions.name], check=True)
        print('Student sessions backed up', flush=True)
    release.mkdir(parents=True)
    # Keep existing immutable chunks and manifest icons so older open tabs work.
    shutil.copytree(links['website-workshop'].resolve(), release / 'website-workshop', dirs_exist_ok=True, symlinks=True)
    shutil.copytree(links['manage-servers'].resolve(), release / 'manage-servers', dirs_exist_ok=True, symlinks=True)
    with tarfile.open(archive, 'r:gz') as package:
        for member in package.getmembers():
            candidate = (release / member.name).resolve()
            if not candidate.is_relative_to(release) or member.issym() or member.islnk():
                raise RuntimeError('Unsafe archive entry')
        package.extractall(release)
    manifest = json.loads((release / 'release.json').read_text())
    if manifest['releaseId'] != release_id:
        raise RuntimeError('Release id mismatch')
    verify_files(manifest)
    asset_manifest = release / 'manage-servers/asset-manifest.json'
    if asset_manifest.exists():
        old, new = manifest['renamed']['manage-servers'].values()
        asset_manifest.write_text(asset_manifest.read_text().replace(old, new))
    record = {'releaseId': release_id, 'previousLinks': previous, 'backup': str(backup_dir), 'status': 'prepared'}
    (release / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record), flush=True)
elif mode in ('activate', 'rollback'):
    record = json.loads((release / 'deployment.json').read_text())
    manifest = json.loads((release / 'release.json').read_text())
    if mode == 'activate':
        verify_files(manifest)
        for name, link in links.items():
            if os.readlink(link) != record['previousLinks'][name]:
                raise RuntimeError('Frontend symlink changed since preparation')
    changed = []
    try:
        for name, link in links.items():
            target = str(release / ('manage-servers' if name == 'manage_servers' else name)) if mode == 'activate' else record['previousLinks'][name]
            replace_link(link, target)
            changed.append(name)
    except Exception:
        for name in changed:
            replace_link(links[name], record['previousLinks'][name])
        raise
    record['status'] = 'active' if mode == 'activate' else 'rolled-back'
    (release / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record), flush=True)
else:
    raise SystemExit('Expected prepare, activate, or rollback')
