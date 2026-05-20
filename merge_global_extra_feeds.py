#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def read(path, default):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return default

def write(path, obj):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def main():
    base = read('data/feeds.json', [])
    extra = read('data/global_extra_feeds.json', [])
    urls = {x.get('url') for x in base if isinstance(x, dict)}
    ids = {x.get('id') for x in base if isinstance(x, dict)}
    added = 0
    for item in extra:
        if not isinstance(item, dict):
            continue
        if not item.get('url') or item.get('url') in urls or item.get('id') in ids:
            continue
        base.append(item)
        urls.add(item.get('url'))
        ids.add(item.get('id'))
        added += 1
    write('data/feeds.json', base)
    print('GLOBAL EXTRA FEEDS MERGED:', added, 'added, total', len(base))

if __name__ == '__main__':
    main()
