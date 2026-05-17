#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""WEB VIJESTI - dnevna sinkronizacija kalendara događanja.

Cilj: probati javno dostupne stranice muzeja, kazališta, galerija i filmskih izvora,
izvući buduće događaje ako postoji strukturirani podatak ili prepoznatljiv datum,
napraviti data/events_calendar.json i data/events_status.json.
Bez vanjskih Python paketa.
"""
from __future__ import annotations
import json, re, html, hashlib, urllib.request, socket
from pathlib import Path
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
TIMEOUT = 16
UA = 'WEB-VIJESTI-Aktual-Media-Events/1.0 (+https://aktualmedia.github.io/all-business-news/)'

MONTHS = {
    'siječnja':1,'sijecnja':1,'siječanj':1,'sijecanj':1,
    'veljače':2,'veljace':2,'veljača':2,'veljaca':2,
    'ožujka':3,'ozujka':3,'ožujak':3,'ozujak':3,
    'travnja':4,'travanj':4,
    'svibnja':5,'svibanj':5,
    'lipnja':6,'lipanj':6,
    'srpnja':7,'srpanj':7,
    'kolovoza':8,'kolovoz':8,
    'rujna':9,'rujan':9,
    'listopada':10,'listopad':10,
    'studenoga':11,'studenog':11,'studeni':11,
    'prosinca':12,'prosinac':12
}

KEYWORDS = {
    'kazalište':['predstava','drama','opera','balet','repertoar','kazalište','kazaliste'],
    'izložba':['izložba','izlozba','exhibition','galerija','muzej','museum'],
    'film':['film','kino','projekcija','festival','cinema'],
    'koncert':['koncert','concert','glazba','music'],
    'predavanje':['predavanje','radionica','tribina','talk','lecture','workshop']
}

class LinkTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.stack=[]
        self.current=None
        self.title=''
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag.lower()=='title':
            self.stack.append('title')
        if tag.lower()=='a' and attrs.get('href'):
            self.current={'href':attrs.get('href'),'text':''}
    def handle_endtag(self, tag):
        if tag.lower()=='title' and self.stack and self.stack[-1]=='title':
            self.stack.pop()
        if tag.lower()=='a' and self.current:
            txt=clean(self.current.get('text',''))
            if txt:
                self.current['text']=txt
                self.links.append(self.current)
            self.current=None
    def handle_data(self, data):
        if self.stack and self.stack[-1]=='title':
            self.title += data
        if self.current is not None:
            self.current['text'] += ' ' + data

def read_json(path, default):
    p=ROOT/path
    if not p.exists(): return default
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception: return default

def write_json(path, obj):
    p=ROOT/path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')

def clean(s):
    s=html.unescape(str(s or ''))
    s=re.sub(r'<[^>]+>',' ',s)
    s=re.sub(r'\s+',' ',s).strip()
    return s

def abs_url(base, href):
    try:
        import urllib.parse
        return urllib.parse.urljoin(base, href)
    except Exception:
        return href

def fetch(url):
    req=urllib.request.Request(url, headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        raw=r.read()
    try: return raw.decode('utf-8')
    except UnicodeDecodeError:
        return raw.decode('latin-1','ignore')

def stable_id(*parts):
    return hashlib.sha1('|'.join(str(p or '') for p in parts).encode('utf-8','ignore')).hexdigest()[:16]

def parse_date(text):
    text=clean(text).lower()
    now=datetime.now(timezone.utc)
    # ISO-ish dates: 2026-05-17 / 17.05.2026 / 17/05/2026
    m=re.search(r'(20\d{2})[-./](\d{1,2})[-./](\d{1,2})', text)
    if m:
        y,mo,d=map(int,m.groups())
        return safe_date(y,mo,d)
    m=re.search(r'(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2})', text)
    if m:
        d,mo,y=map(int,m.groups())
        return safe_date(y,mo,d)
    # Croatian textual: 17. svibnja 2026
    m=re.search(r'(\d{1,2})\.?\s+([a-zčćšžđ]+)\s+(20\d{2})', text)
    if m:
        d=int(m.group(1)); mo=MONTHS.get(m.group(2)); y=int(m.group(3))
        if mo: return safe_date(y,mo,d)
    # if no year, assume current or next year
    m=re.search(r'(\d{1,2})\.?\s+([a-zčćšžđ]+)', text)
    if m:
        d=int(m.group(1)); mo=MONTHS.get(m.group(2)); y=now.year
        if mo:
            dt=safe_date(y,mo,d)
            if dt and dt < now - timedelta(days=2):
                dt=safe_date(y+1,mo,d)
            return dt
    return None

def safe_date(y,m,d):
    try: return datetime(y,m,d,tzinfo=timezone.utc)
    except Exception: return None

def classify(text, fallback='događanje'):
    low=text.lower()
    for typ, words in KEYWORDS.items():
        if any(w in low for w in words): return typ
    return fallback

def extract_jsonld_events(text, source):
    events=[]
    for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.I|re.S):
        raw=html.unescape(m.group(1).strip())
        try:
            data=json.loads(raw)
        except Exception:
            continue
        nodes=data if isinstance(data,list) else [data]
        expanded=[]
        for node in nodes:
            if isinstance(node,dict) and '@graph' in node and isinstance(node['@graph'],list): expanded.extend(node['@graph'])
            else: expanded.append(node)
        for node in expanded:
            if not isinstance(node,dict): continue
            typ=node.get('@type')
            if isinstance(typ,list): is_event='Event' in typ
            else: is_event=str(typ).lower()=='event'
            if not is_event: continue
            title=clean(node.get('name'))
            start=node.get('startDate') or node.get('startdate')
            dt=parse_date(str(start))
            if not title or not dt: continue
            loc=node.get('location') or {}
            place=''
            if isinstance(loc,dict): place=clean(loc.get('name') or loc.get('address'))
            url=node.get('url') or source.get('url')
            events.append(make_event(title,dt,source,place,url,node.get('description') or '', node.get('image')))
    return events

def make_event(title, dt, source, place='', url='', desc='', image=None):
    city=source.get('city') or 'Zagreb'
    typ=classify(title+' '+desc+' '+source.get('type',''), source.get('type','događanje'))
    return {
        'id': stable_id(title, dt.date().isoformat(), source.get('id')),
        'title': title,
        'date': dt.date().isoformat(),
        'datetime': dt.isoformat(),
        'city': city,
        'venue': place or source.get('name'),
        'institution': source.get('name'),
        'type': typ,
        'source': source.get('name'),
        'url': url or source.get('url'),
        'description': clean(desc)[:500],
        'image': image[0] if isinstance(image,list) and image else image,
        'fetched_at': datetime.now(timezone.utc).isoformat()
    }

def extract_link_events(text, source):
    parser=LinkTextParser(); parser.feed(text)
    events=[]
    today=datetime.now(timezone.utc).date()
    for link in parser.links[:300]:
        txt=link['text']
        dt=parse_date(txt)
        if not dt: continue
        if dt.date() < today - timedelta(days=1): continue
        # avoid tiny links and menus
        if len(txt) < 8 or txt.lower() in ['home','program','repertoar','izložbe','izlozbe']: continue
        title=re.sub(r'\b\d{1,2}[.\-/]\d{1,2}([.\-/]20\d{2})?\b','',txt)
        title=re.sub(r'\b\d{1,2}\.?\s+('+'|'.join(MONTHS.keys())+r')(\s+20\d{2})?\b','',title, flags=re.I)
        title=clean(title) or txt
        events.append(make_event(title,dt,source,url=abs_url(source.get('url'),link['href'])))
    return events

def main():
    socket.setdefaulttimeout(TIMEOUT)
    sources=[s for s in read_json('data/events_sources.json', []) if s.get('enabled', True)]
    all_events=[]; status=[]
    for src in sources:
        row={'id':src.get('id'),'name':src.get('name'),'url':src.get('url'),'city':src.get('city'),'type':src.get('type'),'status':'failed','count':0}
        try:
            html_text=fetch(src['url'])
            events=extract_jsonld_events(html_text,src)
            if not events:
                events=extract_link_events(html_text,src)
            # de-duplicate per source
            seen=set(); clean_events=[]
            for e in events:
                if e['id'] not in seen:
                    seen.add(e['id']); clean_events.append(e)
            row['count']=len(clean_events); row['status']='ok' if clean_events else 'empty'
            all_events.extend(clean_events)
        except Exception as e:
            row['error']=str(e)[:180]
        status.append(row)
    # global de-dup and future sort
    today=datetime.now(timezone.utc).date()
    seen=set(); future=[]
    for e in all_events:
        k=(e.get('title','').lower(), e.get('date'), e.get('institution'))
        if k in seen: continue
        seen.add(k)
        try:
            if datetime.fromisoformat(e['datetime']).date() >= today - timedelta(days=1):
                future.append(e)
        except Exception:
            pass
    future.sort(key=lambda x:(x.get('date',''), x.get('city',''), x.get('venue',''), x.get('title','')))
    write_json('data/events_calendar.json', future[:500])
    write_json('data/events_status.json', {'updated_at':datetime.now(timezone.utc).isoformat(),'sources':len(sources),'ok_sources':sum(1 for r in status if r['status']=='ok'),'events_count':len(future),'results':status})
    print(f'EVENTS OK: {len(future)} događaja, izvori OK {sum(1 for r in status if r["status"]=="ok")}/{len(sources)}')

if __name__=='__main__': main()
