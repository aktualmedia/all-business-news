#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GALLERY_LIMIT = 500
SKIP_ACTIVE_LATEST = 200
CATEGORIES = ['symbol','kultura','muzeji','hedonizam','hrana','pica','vina','satovi','nakit','dizajn','tehnologija','znanost','poslovanje','financije','trzista','vijesti','lifestyle']
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


def date_key(item):
    return str(item.get('published_at') or item.get('fetched_at') or item.get('created_at') or '')


def is_bad_image(url):
    u = str(url or '').lower()
    if not u:
        return True
    bad = ['picsum.photos', 'placeholder', 'placehold.co', 'dummyimage', 'data:image']
    return any(x in u for x in bad)


def make_item(n, source_type):
    image = n.get('image') or n.get('cover') or n.get('thumbnail') or ''
    if is_bad_image(image):
        return None
    cat = str(n.get('category') or 'vijesti').lower().strip()
    if cat not in CATEGORIES:
        cat = 'vijesti'
    title = str(n.get('title') or LABELS.get(cat, cat.upper())).strip()
    return {
        'id': 'gal-' + str(abs(hash(str(image) + title)))[:14],
        'title': title,
        'description': (str(n.get('source') or '') + ' · fotografija iz ranije vijesti').strip(' ·'),
        'image': image,
        'category': cat,
        'source': n.get('source') or '',
        'source_url': n.get('url') or n.get('source_url') or '',
        'created_at': n.get('published_at') or n.get('fetched_at') or n.get('created_at') or '',
        'gallery_source': source_type,
        'from_old_news': True
    }


def main():
    admin = read('data/admin_gallery.json', [])
    archive = read('data/archive.json', [])
    active = read('data/news.json', [])
    editions = read('data/editions.json', [])

    pool = []
    for e in editions if isinstance(editions, list) else []:
        if isinstance(e, dict) and e.get('category') == 'symbol' and e.get('cover'):
            pool.append({'title': e.get('title'), 'description': e.get('description'), 'image': e.get('cover'), 'category': 'symbol', 'source': 'SYMBOL', 'url': e.get('url'), 'created_at': e.get('created_at'), 'gallery_source': 'symbol'})
    for a in admin if isinstance(admin, list) else []:
        item = make_item(a, 'admin')
        if item:
            pool.append(item)

    old_news = sorted([x for x in archive if isinstance(x, dict)], key=date_key, reverse=True)
    older_active = sorted([x for x in active if isinstance(x, dict)], key=date_key, reverse=True)[SKIP_ACTIVE_LATEST:]
    for n in old_news:
        item = make_item(n, 'archive_news')
        if item:
            pool.append(item)
    for n in older_active:
        item = make_item(n, 'older_active_news')
        if item:
            pool.append(item)

    seen = set()
    grouped = {c: [] for c in CATEGORIES}
    ordered = []
    for item in pool:
        image = item.get('image') or ''
        if image in seen:
            continue
        seen.add(image)
        cat = item.get('category') if item.get('category') in CATEGORIES else 'vijesti'
        grouped.setdefault(cat, []).append(item)

    while len(ordered) < GALLERY_LIMIT:
        added = False
        for cat in CATEGORIES:
            if grouped.get(cat):
                ordered.append(grouped[cat].pop(0))
                added = True
                if len(ordered) >= GALLERY_LIMIT:
                    break
        if not added:
            break

    write('data/manual_gallery.json', ordered[:GALLERY_LIMIT])
    write('data/gallery_status.json', {
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'limit': GALLERY_LIMIT,
        'count': len(ordered[:GALLERY_LIMIT]),
        'source_policy': 'archive_news_first_no_random_placeholders',
        'skip_active_latest': SKIP_ACTIVE_LATEST,
        'categories': {c: sum(1 for x in ordered[:GALLERY_LIMIT] if x.get('category') == c) for c in CATEGORIES}
    })
    print('GALLERY FROM ARCHIVE OK:', len(ordered[:GALLERY_LIMIT]))


if __name__ == '__main__':
    main()
