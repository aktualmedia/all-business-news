#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Postprocess WEB VIJESTI after RSS update.
- active news limit: 1660 newest items
- older items go to archive
- category counts, source stats and 500-photo gallery are refreshed
- gallery gets thematic groups: museums, galleries, artists, artworks, film
"""
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
LIMIT = 1660
GALLERY_LIMIT = 500
CATEGORIES = ["poslovanje","ekonomija","financije","trzista","kultura","dizajn","tehnologija","znanost","lifestyle","hedonizam","satovi","nakit","pica","vijesti"]
LABELS = {"poslovanje":"POSLOVANJE","ekonomija":"EKONOMIJA","financije":"FINANCIJE","trzista":"TRŽIŠTA","kultura":"KULTURA","dizajn":"DIZAJN","tehnologija":"TEHNOLOGIJA","znanost":"ZNANOST","lifestyle":"LIFESTYLE","hedonizam":"HEDONIZAM","satovi":"SATOVI","nakit":"NAKIT","pica":"PIĆA","vijesti":"VIJESTI","muzeji":"MUZEJI","galerije":"GALERIJE","umjetnici":"UMJETNICI","umjetnine":"UMJETNINE","film":"FILM","arhitektura":"ARHITEKTURA","umjetnost":"UMJETNOST","putovanja":"PUTOVANJA","symbol":"SYMBOL"}
ART_SOURCES = {"the art newspaper","hyperallergic","artnet news","artforum","colossal","smithsonian magazine","museumnext"}
FILM_SOURCES = {"variety","deadline","hollywood reporter","indiewire","the film stage","collider","bfi"}

def read(path, default):
    p = ROOT / path
    if not p.exists(): return default
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception: return default

def write(path, obj):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def key(n):
    return (n.get('url') or n.get('id') or n.get('title') or '').strip().lower().rstrip('/')

def gallery_group(n):
    title = str(n.get('title') or '').lower()
    desc = str(n.get('description') or n.get('summary') or '').lower()
    source = str(n.get('source') or '').lower()
    text = title + ' ' + desc + ' ' + source
    if source in FILM_SOURCES or any(w in text for w in [' film ', ' movie ', ' cinema ', 'cannes', 'festival', 'director', 'actor', 'actress', 'screenplay']):
        return 'film'
    if any(w in text for w in ['museum', 'museums', 'muzej', 'moma', 'tate', 'smithsonian', 'exhibition', 'exhibitions', 'biennale']):
        return 'muzeji'
    if any(w in text for w in ['gallery', 'galleries', 'galerija', 'galerije', 'white cube', 'gagosian']):
        return 'galerije'
    if any(w in text for w in ['artist', 'artists', 'umjetnik', 'umjetnica', 'painter', 'sculptor', 'photographer']):
        return 'umjetnici'
    if source in ART_SOURCES or any(w in text for w in ['artwork', 'artworks', 'painting', 'sculpture', 'auction', 'contemporary art', 'visual art', 'umjetnina', 'umjetnine']):
        return 'umjetnine'
    return n.get('category','vijesti')

def main():
    now = datetime.now(timezone.utc).isoformat()
    news = [n for n in read('data/news.json', []) if isinstance(n, dict) and n.get('image')]
    archive = [n for n in read('data/archive.json', []) if isinstance(n, dict)]
    seen, merged = set(), []
    for n in sorted(news + archive, key=lambda x: x.get('published_at',''), reverse=True):
        k = key(n)
        if not k or k in seen: continue
        seen.add(k); merged.append(n)
    active, old = merged[:LIMIT], merged[LIMIT:]
    write('data/news.json', active)
    write('data/archive.json', old[:5000])
    counts = {c: 0 for c in CATEGORIES}
    by_cat = {c: [] for c in CATEGORIES}
    for n in active:
        c = n.get('category') if n.get('category') in CATEGORIES else 'vijesti'
        counts[c] += 1
        by_cat[c].append(n)
    for c, arr in by_cat.items(): write(f'data/category_news/{c}.json', arr)
    write('data/category_counts.json', {'updated_at': now, 'active_limit': LIMIT, 'counts': counts, 'labels': LABELS})
    admin = read('data/admin_gallery.json', [])
    gallery, img_seen = [], set()
    for g in admin if isinstance(admin, list) else []:
        img = str(g.get('image') or '').strip()
        if img and img not in img_seen:
            img_seen.add(img)
            g.setdefault('category', 'admin')
            g.setdefault('label', 'ADMIN')
            gallery.append(g)
    for n in active + old:
        img = str(n.get('image') or '').strip()
        if img and img not in img_seen:
            img_seen.add(img)
            gcat = gallery_group(n)
            gallery.append({'title': n.get('title'), 'description': f"{n.get('source','Izvor')} · fotografija iz vijesti", 'image': img, 'category': gcat, 'label': LABELS.get(gcat, str(gcat).upper()), 'source_url': n.get('url'), 'created_at': n.get('published_at'), 'auto_from_news': True})
        if len(gallery) >= GALLERY_LIMIT: break
    themes = ['muzeji','galerije','umjetnici','umjetnine','film','kultura','dizajn','tehnologija','znanost','poslovanje','financije','trzista','hedonizam','satovi','nakit','pica','lifestyle','arhitektura','umjetnost','putovanja','symbol']
    i = 1
    while len(gallery) < GALLERY_LIMIT:
        c = themes[(i-1) % len(themes)]
        img = f'https://picsum.photos/seed/wv-{c}-{i:03d}/1400/900'
        if img not in img_seen:
            img_seen.add(img)
            gallery.append({'title': f'{LABELS.get(c,c.upper())} · fotografija {i:03d}', 'description': 'Tematska fotografija za WEB VIJESTI galeriju', 'image': img, 'category': c, 'label': LABELS.get(c,c.upper()), 'source': 'Lorem Picsum public photo stream', 'source_url': 'https://picsum.photos/', 'created_at': now, 'auto_gallery': True})
        i += 1
    write('data/manual_gallery.json', gallery[:GALLERY_LIMIT])
    gen = read('data/generated_at.json', {})
    gen.update({'generated_at': now, 'news_count': len(active), 'archive_count': len(old), 'active_limit': LIMIT, 'gallery_count': GALLERY_LIMIT, 'category_counts': counts, 'gallery_groups': themes[:5]})
    write('data/generated_at.json', gen)
    stats = read('data/source_stats.json', {})
    stats.update({'updated_at': now, 'active_limit': LIMIT, 'archive_count': len(old), 'gallery_count': GALLERY_LIMIT})
    write('data/source_stats.json', stats)
    print(f'POSTPROCESS OK: active {len(active)}, archive {len(old)}, gallery {GALLERY_LIMIT}')

if __name__ == '__main__': main()
