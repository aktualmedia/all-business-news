#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GROUPS = ['symbol','kultura','muzeji','hedonizam','hrana','pica','vina','satovi','nakit','dizajn','tehnologija','znanost','poslovanje','financije','trzista','vijesti','lifestyle']
LABELS = {'symbol':'SYMBOL','kultura':'KULTURA','muzeji':'MUZEJI','hedonizam':'HEDONIZAM','hrana':'HRANA','pica':'PIĆA','vina':'VINA','satovi':'SATOVI','nakit':'NAKIT','dizajn':'DIZAJN','tehnologija':'TEHNOLOGIJA','znanost':'ZNANOST','poslovanje':'POSLOVANJE','financije':'FINANCIJE','trzista':'TRŽIŠTA','vijesti':'VIJESTI','lifestyle':'LIFESTYLE'}

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

def item_from_gallery(x):
    if not isinstance(x, dict):
        return None
    image = x.get('image') or x.get('path') or x.get('cover')
    if not image:
        return None
    cat = str(x.get('category') or 'vijesti').lower()
    if cat not in GROUPS:
        cat = 'vijesti'
    return {'id': x.get('id') or image, 'title': x.get('title') or LABELS.get(cat, cat.upper()), 'description': x.get('description') or '', 'image': image, 'category': cat, 'source': x.get('source') or '', 'source_url': x.get('source_url') or x.get('url') or '', 'created_at': x.get('created_at') or x.get('published_at') or ''}

def main():
    pool = []
    for e in read('data/editions.json', []):
        if isinstance(e, dict) and e.get('category') == 'symbol' and e.get('cover'):
            pool.append({'id': e.get('id'), 'title': e.get('title'), 'description': e.get('description') or '', 'image': e.get('cover'), 'category': 'symbol', 'source': 'SYMBOL', 'source_url': e.get('url') or '', 'created_at': e.get('created_at') or ''})
    for x in read('data/manual_gallery.json', []):
        y = item_from_gallery(x)
        if y:
            pool.append(y)
    for x in read('data/home_news.json', []):
        y = item_from_gallery(x)
        if y:
            pool.append(y)
    seen = set()
    grouped = {g: [] for g in GROUPS}
    for x in pool:
        image = x.get('image')
        if not image or image in seen:
            continue
        seen.add(image)
        cat = x.get('category') if x.get('category') in GROUPS else 'vijesti'
        if len(grouped[cat]) < 120:
            grouped[cat].append(x)
    summary = {'updated_at': datetime.now(timezone.utc).isoformat(), 'groups': []}
    for cat in GROUPS:
        items = grouped.get(cat, [])
        write('data/gallery_groups/%s.json' % cat, items)
        summary['groups'].append({'id': cat, 'label': LABELS.get(cat, cat.upper()), 'count': len(items), 'cover': items[0]['image'] if items else ''})
    home = []
    for cat in GROUPS:
        home.extend(grouped.get(cat, [])[:12])
    write('data/gallery_groups/index.json', summary)
    write('data/home_gallery_groups.json', home[:96])
    write('data/gallery_groups_status.json', {'updated_at': summary['updated_at'], 'groups': len(summary['groups']), 'items': sum(g['count'] for g in summary['groups'])})
    print('GALLERY GROUPS OK')

if __name__ == '__main__':
    main()
