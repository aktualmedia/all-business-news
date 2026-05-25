#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Završna provjera integriteta javnih podatkovnih modula portala WEB VIJESTI."""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ACTIVE_LIMIT = 2000
ARCHIVE_LIMIT = 12000
GALLERY_LIMIT = 500


def read(path, default):
    try:
        return json.loads((ROOT / path).read_text(encoding='utf-8'))
    except Exception:
        return default


def write(path, obj):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')


def main():
    now = datetime.now(timezone.utc).isoformat()
    news = read('data/news.json', [])
    archive = read('data/archive.json', [])
    cats = read('data/category_counts.json', {})
    sources = read('data/source_stats.json', {})
    gallery = read('data/gallery_status.json', {})
    events = read('data/events_status.json', {})
    videos = read('data/video_status.json', {})
    home = read('data/home_status.json', {})
    errors = []
    notices = []

    if not isinstance(news, list) or not news:
        errors.append('Nema aktivnih vijesti.')
    if isinstance(news, list) and len(news) > ACTIVE_LIMIT:
        errors.append('Prekoračen limit aktivnih vijesti.')
    if not isinstance(archive, list) or len(archive) > ARCHIVE_LIMIT:
        errors.append('Neispravna arhiva vijesti.')
    if cats.get('active_limit') != ACTIVE_LIMIT or cats.get('active_count') != len(news):
        errors.append('Kategorije nisu usklađene s konačnim vijestima.')
    if sources.get('active_limit') != ACTIVE_LIMIT:
        errors.append('Status izvora nije usklađen s limitom vijesti.')
    if home.get('news_count') != len(news):
        errors.append('Naslovnica nije usklađena s brojem vijesti.')
    if int(gallery.get('count') or 0) > GALLERY_LIMIT:
        errors.append('Prekoračen limit galerije.')
    if gallery.get('source_policy') not in ('real_old_news_images_only_no_random_placeholders', 'real_images_only_no_random_placeholders'):
        notices.append('Potrebno provjeriti politiku fotografija galerije.')
    if not events.get('updated_at') or int(events.get('events_count') or 0) == 0:
        notices.append('Događanja nemaju potvrđeno svježe osvježavanje.')
    if not videos.get('updated_at') or not videos.get('categories'):
        notices.append('Video modul nema potvrđeno svježe osvježavanje.')

    status = {
        'updated_at': now,
        'status': 'problem' if errors else 'radi',
        'active_news': len(news) if isinstance(news, list) else 0,
        'active_limit': ACTIVE_LIMIT,
        'archive_news': len(archive) if isinstance(archive, list) else 0,
        'archive_limit': ARCHIVE_LIMIT,
        'gallery_count': int(gallery.get('count') or 0),
        'gallery_limit': GALLERY_LIMIT,
        'events_count': int(events.get('events_count') or 0),
        'video_categories': len(videos.get('categories') or {}),
        'sources': int(sources.get('sources') or 0),
        'ok_sources': int(sources.get('ok_sources') or 0),
        'module_updates': {
            'vijesti': sources.get('updated_at') or '',
            'galerija': gallery.get('updated_at') or '',
            'dogadjanja': events.get('updated_at') or '',
            'video': videos.get('updated_at') or ''
        },
        'checks': errors or ['Vijesti, limiti, galerija i naslovnica su usklađeni.'],
        'notices': notices
    }
    write('data/automation_status.json', status)
    if errors:
        raise SystemExit('PROVJERA NIJE PROŠLA: ' + ' '.join(errors))
    print('PROVJERA PROŠLA:', status)


if __name__ == '__main__':
    main()
