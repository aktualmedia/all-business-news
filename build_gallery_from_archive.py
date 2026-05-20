#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GALLERY_LIMIT = 500
SKIP_ACTIVE_LATEST = 200
ORDER = ['symbol','umjetnost','kultura','arhitektura','dizajn','hedonizam','hrana','pica','vina','putovanja','satovi','nakit','lifestyle','tehnologija','znanost','poslovanje','financije','trzista','vijesti']
LABELS = {'symbol':'SYMBOL','umjetnost':'UMJETNOST','kultura':'KULTURA','arhitektura':'ARHITEKTURA','dizajn':'DIZAJN','hedonizam':'HEDONIZAM','hrana':'HRANA','pica':'PIĆA','vina':'VINA','putovanja':'PUTOVANJA','satovi':'SATOVI','nakit':'NAKIT','lifestyle':'LIFESTYLE','tehnologija':'TEHNOLOGIJA','znanost':'ZNANOST','poslovanje':'POSLOVANJE','financije':'FINANCIJE','trzista':'TRŽIŠTA','vijesti':'VIJESTI'}
RULES = [
    (r'watch|watches|horology|timepiece|rolex|patek|omega|seiko', 'satovi'),
    (r'jewelry|jewellery|diamond|gemstone|gem|cartier|tiffany|necklace|ring', 'nakit'),
    (r'wine|winery|vineyard|sommelier|champagne', 'vina'),
    (r'cocktail|spirits|whisky|whiskey|bar culture|drinks|beer|vodka|rum|gin', 'pica'),
    (r'food|chef|restaurant|gastronomy|dining|culinary|cuisine|menu', 'hrana'),
    (r'travel|destination|hotel|resort|journey|tourism|luxury travel', 'putovanja'),
    (r'museum|gallery|artist|art fair|exhibition|artwork|painting|sculpture|biennale', 'umjetnost'),
    (r'architecture|architect|building|urban|space|interior architecture', 'arhitektura'),
    (r'design|interior|furniture|decor|product design|graphic', 'dizajn'),
    (r'culture|theatre|theater|film|music|literature|book|cinema|festival', 'kultura'),
    (r'technology|tech|ai|software|startup|cloud|cyber|data center|robot', 'tehnologija'),
    (r'science|research|space|nasa|laboratory|study|nature|physics|biology', 'znanost'),
    (r'market|stocks|trading|exchange|commodity|commodities|oil|gold|mining', 'trzista'),
    (r'finance|bank|banking|investor|investment|fund|fintech|insurance|payment', 'financije'),
    (r'business|company|companies|industry|executive|management|entrepreneur', 'poslovanje'),
    (r'lifestyle|style|living|fashion|beauty|wellness', 'lifestyle'),
    (r'luxury|private jet|yacht|supercar|fine living|hedonism', 'hedonizam'),
]
MAP = {'symbol':'symbol','kultura':'kultura','muzeji':'umjetnost','umjetnost':'umjetnost','arhitektura':'arhitektura','dizajn':'dizajn','hedonizam':'hedonizam','hrana':'hrana','pica':'pica','pića':'pica','vina':'vina','satovi':'satovi','nakit':'nakit','putovanja':'putovanja','lifestyle':'lifestyle','tehnologija':'tehnologija','znanost':'znanost','poslovanje':'poslovanje','business':'poslovanje','financije':'financije','trzista':'trzista','tržišta':'trzista','vijesti':'vijesti'}

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

def bad_image(url):
    u = str(url or '').lower()
    return (not u) or any(x in u for x in ['picsum.photos','placeholder','placehold.co','dummyimage','data:image'])

def infer(n):
    raw = str(n.get('category') or '').strip().lower()
    if raw in MAP:
        return MAP[raw]
    blob = ' '.join([str(n.get(k) or '') for k in ['title','description','summary','url','source']]).lower()
    for pattern, group in RULES:
        if re.search(pattern, blob, re.I):
            return group
    return 'vijesti'

def make(n, source_type):
    image = n.get('image') or n.get('cover') or n.get('thumbnail') or ''
    if bad_image(image):
        return None
    cat = infer(n)
    title = str(n.get('title') or LABELS.get(cat, cat.upper())).strip()
    return {'id':'gal-'+str(abs(hash(str(image)+title)))[:14],'title':title,'description':str(n.get('description') or n.get('summary') or '').strip(),'image':image,'category':cat,'group':cat,'label':LABELS.get(cat, cat.upper()),'source':n.get('source') or '','source_url':n.get('url') or n.get('source_url') or '','created_at':n.get('published_at') or n.get('fetched_at') or n.get('created_at') or '','gallery_source':source_type,'from_old_news':source_type in ['archive_news','older_active_news']}

def main():
    archive = read('data/archive.json', [])
    active = read('data/news.json', [])
    editions = read('data/editions.json', [])
    pool = []
    for e in editions if isinstance(editions, list) else []:
        if isinstance(e, dict) and e.get('category') == 'symbol' and e.get('cover'):
            pool.append({'id':e.get('id'),'title':e.get('title'),'description':e.get('description') or '','image':e.get('cover'),'category':'symbol','group':'symbol','label':'SYMBOL','source':'SYMBOL','source_url':e.get('url') or '','created_at':e.get('created_at') or '','gallery_source':'symbol','from_old_news':False})
    old_news = sorted([x for x in archive if isinstance(x, dict)], key=date_key, reverse=True)
    older_active = sorted([x for x in active if isinstance(x, dict)], key=date_key, reverse=True)[SKIP_ACTIVE_LATEST:]
    for n in old_news:
        item = make(n, 'archive_news')
        if item:
            pool.append(item)
    for n in older_active:
        item = make(n, 'older_active_news')
        if item:
            pool.append(item)
    seen = set(); clean = []
    for item in pool:
        key = item.get('image') or ''
        if not key or key in seen:
            continue
        seen.add(key); clean.append(item)
    clean.sort(key=lambda x: str(x.get('created_at') or ''), reverse=True)
    final = clean[:GALLERY_LIMIT]
    write('data/manual_gallery.json', final)
    counts = {c:sum(1 for x in final if x.get('category')==c) for c in ORDER}
    write('data/gallery_status.json', {'updated_at':datetime.now(timezone.utc).isoformat(),'count':len(final),'limit':GALLERY_LIMIT,'source_policy':'real_old_news_images_only_no_random_placeholders','skip_active_latest':SKIP_ACTIVE_LATEST,'group_counts':counts})
    print('GALLERY REAL OLD NEWS OK:', len(final))

if __name__ == '__main__':
    main()
