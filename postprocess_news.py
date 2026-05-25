#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ujednačena završna obrada vijesti za WEB VIJESTI.

Pravila:
- 2.000 najnovijih aktivnih članaka;
- do 12.000 arhivskih članaka;
- vijesti se ne odbacuju samo zato što nemaju fotografiju;
- galerijska priprema koristi samo stvarne slike iz sadržaja, bez nasumičnih zamjena.
Konačnu galeriju iz stare arhive dodatno izgrađuje build_gallery_from_archive.py.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ACTIVE_LIMIT = 2000
ARCHIVE_LIMIT = 12000
GALLERY_LIMIT = 500
CATEGORIES = [
    'poslovanje','ekonomija','financije','trzista','kultura','dizajn','tehnologija','znanost',
    'lifestyle','hedonizam','satovi','nakit','pica','hrana','vijesti'
]
LABELS = {
    'poslovanje':'POSLOVANJE','ekonomija':'EKONOMIJA','financije':'FINANCIJE','trzista':'TRŽIŠTA',
    'kultura':'KULTURA','dizajn':'DIZAJN','tehnologija':'TEHNOLOGIJA','znanost':'ZNANOST',
    'lifestyle':'LIFESTYLE','hedonizam':'HEDONIZAM','satovi':'SATOVI','nakit':'NAKIT',
    'pica':'PIĆA','hrana':'HRANA','vijesti':'VIJESTI'
}
PLACEHOLDER_MARKERS = ('picsum.photos', 'placeholder', 'placehold.co', 'dummyimage', 'data:image')


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


def key(item):
    url = str(item.get('url') or item.get('link') or item.get('source_url') or '').strip().lower().split('#', 1)[0].rstrip('/')
    if url:
        return 'url:' + url
    raw = '|'.join(str(item.get(x) or '') for x in ('category', 'source', 'title')).lower()
    return 'title:' + hashlib.sha1(raw.encode('utf-8', 'ignore')).hexdigest()


def date_key(item):
    return str(item.get('published_at') or item.get('fetched_at') or item.get('created_at') or '')


def normalize(item):
    if not isinstance(item, dict):
        return None
    title = str(item.get('title') or '').strip()
    url = str(item.get('url') or item.get('link') or item.get('source_url') or '').strip()
    if not title or not url:
        return None
    item = dict(item)
    category = str(item.get('category') or 'vijesti').strip().lower()
    item['category'] = category if category in CATEGORIES else 'vijesti'
    image = str(item.get('image') or '').strip()
    if any(marker in image.lower() for marker in PLACEHOLDER_MARKERS):
        item['image'] = ''
        item['image_policy'] = 'bez_izvorne_fotografije'
    return item


def gallery_row(item):
    image = str(item.get('image') or '').strip()
    if not image or any(marker in image.lower() for marker in PLACEHOLDER_MARKERS):
        return None
    category = item.get('category') if item.get('category') in CATEGORIES else 'vijesti'
    return {
        'title': item.get('title'),
        'description': f"{item.get('source', 'Izvor')} · fotografija uz objavljeni sadržaj",
        'image': image,
        'category': category,
        'label': LABELS.get(category, str(category).upper()),
        'source_url': item.get('url'),
        'created_at': item.get('published_at') or item.get('fetched_at') or '',
        'from_news': True
    }


def main():
    now = datetime.now(timezone.utc).isoformat()
    candidates = []
    for source in ('data/news.json', 'data/archive.json'):
        for item in read(source, []):
            normalized = normalize(item)
            if normalized:
                candidates.append(normalized)
    seen, merged = set(), []
    for item in sorted(candidates, key=date_key, reverse=True):
        unique = key(item)
        if unique in seen:
            continue
        seen.add(unique)
        merged.append(item)
    active = merged[:ACTIVE_LIMIT]
    archive = merged[ACTIVE_LIMIT:ACTIVE_LIMIT + ARCHIVE_LIMIT]
    write('data/news.json', active)
    write('data/archive.json', archive)

    counts = {category: 0 for category in CATEGORIES}
    by_category = {category: [] for category in CATEGORIES}
    for item in active:
        category = item.get('category', 'vijesti')
        counts[category] += 1
        by_category[category].append(item)
    for category, rows in by_category.items():
        write(f'data/category_news/{category}.json', rows)
    write('data/category_counts.json', {
        'updated_at': now,
        'active_limit': ACTIVE_LIMIT,
        'archive_limit': ARCHIVE_LIMIT,
        'active_count': len(active),
        'archive_count': len(archive),
        'counts': counts,
        'labels': LABELS
    })

    real_gallery, images_seen = [], set()
    for item in active + archive:
        row = gallery_row(item)
        if not row or row['image'] in images_seen:
            continue
        images_seen.add(row['image'])
        real_gallery.append(row)
        if len(real_gallery) >= GALLERY_LIMIT:
            break
    write('data/manual_gallery.json', real_gallery)

    generated = read('data/generated_at.json', {})
    generated.update({
        'generated_at': now,
        'news_count': len(active),
        'active_limit': ACTIVE_LIMIT,
        'archive_count': len(archive),
        'archive_limit': ARCHIVE_LIMIT,
        'gallery_count': len(real_gallery),
        'gallery_limit': GALLERY_LIMIT,
        'gallery_policy': 'real_images_only_no_random_placeholders',
        'category_counts': counts
    })
    write('data/generated_at.json', generated)
    stats = read('data/source_stats.json', {})
    stats.update({
        'updated_at': now,
        'active_limit': ACTIVE_LIMIT,
        'archive_limit': ARCHIVE_LIMIT,
        'active_count': len(active),
        'archive_count': len(archive),
        'gallery_count': len(real_gallery),
        'gallery_limit': GALLERY_LIMIT,
        'gallery_policy': 'real_images_only_no_random_placeholders'
    })
    write('data/source_stats.json', stats)
    print(f'POSTPROCESS OK: active={len(active)} archive={len(archive)} real_gallery={len(real_gallery)} limit={ACTIVE_LIMIT}')


if __name__ == '__main__':
    main()
