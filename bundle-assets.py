#!/usr/bin/env python3

import re
import requests
import sys

from pathlib import Path

ASSET_PATTERNS = {
    '<link rel="stylesheet" href="(.*?)">': '<style>{}</style>',
    '<script src="(.*?)"></script>': '<script>{}</script>',
}

def read_asset(directory, asset):
    if asset.startswith("https://"):
        print("GET: {}".format(asset))
        response = requests.get(asset)
        response.raise_for_status()
        return response.text
    print("READ: {}".format(asset))
    path = directory / asset
    return path.read_text("utf-8").strip()

for path in map(Path, sys.argv[1:]):
    print(f"Processing {path!s}...")
    lines = path.read_text("utf-8").splitlines()
    for i, line in enumerate(lines):
        for pattern, replacement in ASSET_PATTERNS.items():
            match = re.search(pattern, line)
            if match is None: continue
            asset = match.group(1).split("?")[0]
            content = read_asset(path.parent, asset)
            content = replacement.format(content)
            a, z = match.span()
            lines[i] = line[:a] + content + line[z:]
    text = "\n".join(lines) + "\n"
    path.write_text(text, "utf-8")
