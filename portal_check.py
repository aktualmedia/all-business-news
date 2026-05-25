#!/usr/bin/env python3
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
    news = read('data/news.json', [])
    archive = read('data/archive.json', [])
    cats = read('data/category_counts.json', {})
    sources = read('data/source_stats.json', {})
    gallery = read('data/gallery_status.json', {})
    home = read('data/home_status.json', {})
    errors = []
    if not isinstance(news, list) or not news: errors.append('Nema aktivnih vijesti.')
    if len(news) > ACTIVE_LIMIT: errors.append('Prekoračen limit aktivnih vijesti.')
    if not isinstance(archive, list) or len(archive) > ARCHIVE_LIMIT: errors.append('Neispravna arhiva vijesti.')
    if cats.get('active_limit') != ACTIVE_LIMIT or cats.get('active_count') != len(news): errors.append('Kategorije nisu usklađene.')
    if sources.get('active_limit') != ACTIVE_LIMIT: errors.append('Izvori nisu usklađeni.')
    if home.get('news_count') != len(news): errors.append('Naslovnica nije usklađena.')
    if int(gallery.get('count') or 0) > GALLERY_LIMIT: errors.append('Prekoračen limit galerije.')
    status = {
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'status': 'problem' if errors else 'radi',
        'active_news': len(news) if isinstance(news, list) else 0,
        'active_limit': ACTIVE_LIMIT,
        'archive_news': len(archive) if isinstance(archive, list) else 0,
        'archive_limit': ARCHIVE_LIMIT,
        'gallery_count': int(gallery.get('count') or 0),
        'gallery_limit': GALLERY_LIMIT,
        'sources': int(sources.get('sources') or 0),
        'ok_sources': int(sources.get('ok_sources') or 0),
        'checks': errors or ['Podatci portala su usklađeni.']
    }
    write('data/automation_status.json', status)
    if errors: raise SystemExit('PROVJERA NIJE PROŠLA: ' + ' '.join(errors))
    print('PROVJERA PROŠLA:', status)
if __name__ == '__main__': main()
