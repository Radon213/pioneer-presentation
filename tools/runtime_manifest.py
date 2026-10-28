#!/usr/bin/env python3
"""Record or verify the public runtime without importing local research archives."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'runtime-manifest.json'
AUTHORING_FILES = {'build-deck.mjs', 'slides-manifest.json'}


def inventory():
    rows = []
    for path in sorted((ROOT / 'examples').rglob('*')):
        if not path.is_file() or path.name in AUTHORING_FILES:
            continue
        if any(part in {'tests', '__pycache__'} for part in path.relative_to(ROOT).parts):
            continue
        body = path.read_bytes()
        rows.append({'path': path.relative_to(ROOT).as_posix(),
                     'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
    return {'schema': 'pioneer-runtime-package-v1',
            'runtimeBytes': sum(row['bytes'] for row in rows), 'files': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    current = inventory()
    if args.check:
        saved = json.loads(MANIFEST.read_text())
        if saved != current:
            raise SystemExit('Runtime inventory changed. Run npm run manifest and review the diff.')
        print(f"Runtime integrity verified: {len(current['files'])} files, {current['runtimeBytes']:,} bytes")
    else:
        MANIFEST.write_text(json.dumps(current, indent=2) + '\n')
        print(f"Updated runtime-manifest.json: {len(current['files'])} files, {current['runtimeBytes']:,} bytes")


if __name__ == '__main__':
    main()
