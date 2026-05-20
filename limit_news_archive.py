#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ACTIVE_LIMIT = 2000
ARCHIVE_LIMIT = 12000
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
    raw = '|'.join([str(item.get('category') or ''), str(item.get('source') or ''), str(item.get('title') or '')]).lower()
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
    cat = str(item.get('category') or 'vijesti').strip().lower()
    if cat not in CATEGORIES:
        cat = 'vijesti'
    item['category'] = cat
    return item

def main():
    candidates = []
    for source in ['data/news.json', 'data/archive.json']:
        for item in read(source, []):
            clean = normalize(item)
            if clean:
                candidates.append(clean)
    seen = set()
    merged = []
    for item in sorted(candidates, key=date_key, reverse=True):
        k = key(item)
        if k in seen:
            continue
        seen.add(k)
        merged.append(item)
    active = merged[:ACTIVE_LIMIT]
    archive = merged[ACTIVE_LIMIT:ACTIVE_LIMIT + ARCHIVE_LIMIT]
    write('data/news.json', active)
    write('data/archive.json', archive)
    counts = {}
    for cat in CATEGORIES:
        rows = [x for x in active if x.get('category') == cat]
        counts[cat] = len(rows)
        write(f'data/category_news/{cat}.json', rows)
    write('data/category_counts.json', {
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'active_limit': ACTIVE_LIMIT,
        'archive_limit': ARCHIVE_LIMIT,
        'active_count': len(active),
        'archive_count': len(archive),
        'counts': counts,
        'labels': LABELS
    })
    status = read('data/generated_at.json', {}) if isinstance(read('data/generated_at.json', {}), dict) else {}
    status.update({
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'news_count': len(active),
        'active_limit': ACTIVE_LIMIT,
        'archive_count': len(archive),
        'archive_limit': ARCHIVE_LIMIT,
        'category_counts': counts
    })
    write('data/generated_at.json', status)
    print(f'NEWS LIMIT OK: active={len(active)} archive={len(archive)} limit={ACTIVE_LIMIT}')

if __name__ == '__main__':
    main()
