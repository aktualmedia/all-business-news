#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'data' / 'gallery_groups'
ORDER = ['symbol','umjetnost','kultura','arhitektura','dizajn','hedonizam','hrana','pica','vina','putovanja','satovi','nakit','lifestyle','tehnologija','znanost','poslovanje','financije','trzista','vijesti']
LABELS = {'symbol':'SYMBOL','umjetnost':'UMJETNOST','kultura':'KULTURA','arhitektura':'ARHITEKTURA','dizajn':'DIZAJN','hedonizam':'HEDONIZAM','hrana':'HRANA','pica':'PIĆA','vina':'VINA','putovanja':'PUTOVANJA','satovi':'SATOVI','nakit':'NAKIT','lifestyle':'LIFESTYLE','tehnologija':'TEHNOLOGIJA','znanost':'ZNANOST','poslovanje':'POSLOVANJE','financije':'FINANCIJE','trzista':'TRŽIŠTA','vijesti':'VIJESTI'}

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

def clean_old_group_files():
    OUT.mkdir(parents=True, exist_ok=True)
    for fp in OUT.glob('*.json'):
        fp.unlink()

def slug(cat):
    c = str(cat or 'vijesti').lower().strip()
    aliases = {'muzeji':'umjetnost','art':'umjetnost','arts':'umjetnost','markets':'trzista','tržišta':'trzista','pića':'pica','drinks':'pica','wine':'vina','wines':'vina','food':'hrana','travel':'putovanja','architecture':'arhitektura','finance':'financije','business':'poslovanje','technology':'tehnologija','science':'znanost','jewelry':'nakit','jewellery':'nakit','watches':'satovi'}
    c = aliases.get(c, c)
    return c if c in ORDER else 'vijesti'

def main():
    gallery = read('data/manual_gallery.json', [])
    clean_old_group_files()
    grouped = {c: [] for c in ORDER}
    seen = set()
    for item in gallery if isinstance(gallery, list) else []:
        if not isinstance(item, dict):
            continue
        image = item.get('image') or item.get('cover') or item.get('thumbnail') or ''
        if not image or image in seen:
            continue
        seen.add(image)
        cat = slug(item.get('group') or item.get('category'))
        row = dict(item)
        row['category'] = cat
        row['group'] = cat
        row['label'] = LABELS.get(cat, cat.upper())
        grouped[cat].append(row)
    summary = {'updated_at': datetime.now(timezone.utc).isoformat(), 'source_policy': 'manual_gallery_real_old_news_only', 'groups': []}
    home = []
    for cat in ORDER:
        items = grouped.get(cat, [])
        if not items:
            continue
        write(f'data/gallery_groups/{cat}.json', items)
        summary['groups'].append({'id': cat, 'label': LABELS.get(cat, cat.upper()), 'count': len(items), 'cover': items[0].get('image','')})
        home.extend(items[:8])
    write('data/gallery_groups/index.json', summary)
    write('data/home_gallery_groups.json', home[:96])
    write('data/gallery_groups_status.json', {'updated_at': summary['updated_at'], 'groups': len(summary['groups']), 'items': sum(g['count'] for g in summary['groups']), 'source_policy': summary['source_policy']})
    print('GALLERY GROUPS REAL OK:', sum(g['count'] for g in summary['groups']))

if __name__ == '__main__':
    main()
