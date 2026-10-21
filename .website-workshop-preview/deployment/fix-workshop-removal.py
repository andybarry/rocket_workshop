"""Apply only the legacy workshop removal validation fix, preserving all other code."""
import argparse
import hashlib
from pathlib import Path
import os
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--stage', type=Path)
parser.add_argument('--expected-sha256')
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
original = args.source.read_bytes()
original_hash = hashlib.sha256(original).hexdigest()
if args.expected_sha256 and original_hash != args.expected_sha256:
    raise SystemExit('Source changed since inspection; refusing to overwrite it.')
old = b"        if secure_filename(workshop) != workshop:"
new = b"        if action == 'add' and secure_filename(workshop) != workshop:"
if original.count(old) != 1:
    raise SystemExit('Expected exactly one matching workshop validation rule.')
updated = original.replace(old, new, 1)
compile(updated, str(args.source), 'exec')
if args.stage:
    args.stage.write_bytes(updated)
if args.apply:
    backup = args.source.with_name(args.source.name + '.before-workshop-removal-' + original_hash[:12])
    if not backup.exists():
        shutil.copy2(args.source, backup)
    temporary = args.source.with_name('.' + args.source.name + '.workshop-removal.tmp')
    temporary.write_bytes(updated)
    shutil.copymode(args.source, temporary)
    os.replace(temporary, args.source)
    print('Applied workshop removal fix. Backup:', backup)
print('Updated SHA256:', hashlib.sha256(updated).hexdigest())
