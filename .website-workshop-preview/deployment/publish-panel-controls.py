"""Publish the panel module fix without changing management, the API, or student data."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tarfile

ROOT = Path('/home/abarry/musicgen')
previous_id, release_id, archive_name = sys.argv[1:]
for name in (previous_id, release_id):
    if not re.fullmatch(r'studio-\d{8}T\d{6}Z', name):
        raise SystemExit('Invalid release ID')
previous = ROOT / 'frontend-releases' / previous_id
release = ROOT / 'frontend-releases' / release_id
link = ROOT / 'build/website-workshop'
if not link.is_symlink() or link.resolve() != previous / 'website-workshop':
    raise SystemExit('The live workshop release changed; inspect it before publishing.')
if release.exists():
    raise SystemExit('Release already exists.')

def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

old_manifest = json.loads((previous / 'release.json').read_text())
for item in old_manifest['files']:
    if item['path'].startswith('website-workshop/') and digest(previous / item['path']) != item['sha256']:
        raise SystemExit('Live workshop files changed: ' + item['path'])

release.mkdir()
# Retain prior content-hashed assets for already-open tabs. The old release
# remains untouched and is the rollback copy.
shutil.copytree(previous / 'website-workshop', release / 'website-workshop', symlinks=True)
with tarfile.open(archive_name, 'r:gz') as archive:
    for member in archive.getmembers():
        candidate = (release / member.name).resolve()
        if not candidate.is_relative_to(release) or member.issym() or member.islnk():
            raise SystemExit('Unsafe archive entry')
    archive.extractall(release)
manifest = json.loads((release / 'release.json').read_text())
assert manifest['releaseId'] == release_id
for item in manifest['files']:
    if digest(release / item['path']) != item['sha256']:
        raise SystemExit('Staged checksum failed: ' + item['path'])
assert "'./panel-order.js'" in (release / 'website-workshop/panel-layout.js').read_text()
record = {'releaseId': release_id, 'previousLink': os.readlink(link), 'scope': 'website-workshop only', 'status': 'prepared'}
(release / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
temporary = link.with_name('.website-workshop-' + release_id)
os.symlink(str(release / 'website-workshop'), temporary)
os.replace(temporary, link)
record['status'] = 'active'
(release / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
