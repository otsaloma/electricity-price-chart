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
        return read_url(asset)
    return read_file(directory, asset)

def read_file(directory, fname):
    print("READ: {}".format(fname))
    path = directory / fname
    return path.read_text("utf-8").strip()

def read_url(url):
    print("GET: {}".format(url))
    response = requests.get(url)
    response.raise_for_status()
    return response.text

for path in map(Path, sys.argv[1:]):
    print(f"Processing {path!s}...")
    directory = path.parent
    lines = path.read_text("utf-8").splitlines()
    for i, line in enumerate(lines):
        for pattern, replacement in ASSET_PATTERNS.items():
            match = re.search(pattern, line)
            if match is None: continue
            asset = match.group(1).split("?")[0]
            content = read_asset(directory, asset)
            content = replacement.format(content)
            a, z = match.span()
            lines[i] = line[:a] + content + line[z:]
    text = "\n".join(lines) + "\n"
    path.write_text(text, "utf-8")
