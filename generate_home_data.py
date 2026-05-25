#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generira male JSON datoteke za brzo učitavanje naslovnice i status svih modula."""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NOW = datetime.now(timezone.utc).isoformat()


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


def date_key(value):
    return str(value or '')


def source_quality():
    stats = read('data/source_stats.json', {})
    rows = stats.get('feed_results') or []
    out = []
    for r in rows:
        status = r.get('status') or 'unknown'
        count = int(r.get('count') or 0)
        if status == 'ok' and count > 0:
            score, label = 100, 'radi'
        elif status == 'empty':
            score, label = 55, 'prazan feed'
        else:
            score, label = 20, 'problem'
        out.append({'id': r.get('id'), 'name': r.get('name'), 'category': r.get('category'), 'url': r.get('url'), 'status': status, 'label': label, 'count': count, 'score': score, 'error': r.get('error', '')})
    out.sort(key=lambda x: (-x['score'], -(x['count'] or 0), str(x.get('name') or '')))
    return out


def main():
    news = [n for n in read('data/news.json', []) if isinstance(n, dict)]
    events = [e for e in read('data/events_calendar.json', []) if isinstance(e, dict)]
    manual_events = [e for e in read('data/manual_events.json', []) if isinstance(e, dict)]
    editions = [e for e in read('data/editions.json', []) if isinstance(e, dict)]
    generated = read('data/generated_at.json', {})
    source_stats = read('data/source_stats.json', {})
    gallery_status = read('data/gallery_status.json', {})
    events_status = read('data/events_status.json', {})
    video_status = read('data/video_status.json', {})
    automation_status = read('data/automation_status.json', {})

    home_news = sorted(news, key=lambda n: date_key(n.get('published_at') or n.get('fetched_at')), reverse=True)[:72]
    write('data/home_news.json', home_news)

    today = datetime.now(timezone.utc).date()
    clean_events = []
    for e in events + manual_events:
        d = str(e.get('date') or e.get('datetime') or '')[:10]
        try:
            if datetime.fromisoformat(d + 'T00:00:00+00:00').date() >= today - timedelta(days=1):
                clean_events.append(e)
        except Exception:
            clean_events.append(e)
    clean_events.sort(key=lambda e: (str(e.get('date') or ''), str(e.get('country') or ''), str(e.get('city') or ''), str(e.get('title') or '')))
    write('data/home_events.json', clean_events[:80])

    symbol = [e for e in editions if e.get('category') == 'symbol']
    symbol8 = next((e for e in symbol if e.get('id') == 'symbol-8'), None)
    write('data/home_symbol.json', symbol8 or (symbol[0] if symbol else {}))

    quality = source_quality()
    write('data/source_quality.json', {'updated_at': NOW, 'sources': len(quality), 'ok': sum(1 for x in quality if x.get('label') == 'radi'), 'problem': sum(1 for x in quality if x.get('label') == 'problem'), 'items': quality})

    module_updates = {
        'vijesti': generated.get('generated_at') or source_stats.get('updated_at') or '',
        'galerija': gallery_status.get('updated_at') or '',
        'dogadjanja': events_status.get('updated_at') or '',
        'video': video_status.get('updated_at') or '',
        'symbol': (symbol8 or {}).get('date', '')
    }
    write('data/home_status.json', {
        'updated_at': NOW,
        'generated_at': module_updates['vijesti'] or NOW,
        'news_count': generated.get('news_count') or len(news),
        'sources': source_stats.get('sources') or 0,
        'ok_sources': source_stats.get('ok_sources') or 0,
        'events_count': int(events_status.get('events_count') or len(clean_events)),
        'gallery_count': int(gallery_status.get('count') or 0),
        'video_categories': len(video_status.get('categories') or {}),
        'symbol': (symbol8 or {}).get('title', 'Symbol'),
        'module_updates': module_updates,
        'automation': automation_status.get('status', 'provjera u tijeku')
    })
    print(f'HOME DATA OK: {len(home_news)} vijesti, {len(clean_events[:80])} događanja, {len(quality)} izvora; moduli={module_updates}')


if __name__ == '__main__':
    main()
