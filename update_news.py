#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""WEB VIJESTI update: vijesti bez duplikata + statistika + galerija 500.

Ažurira:
- data/news.json
- data/category_news/*.json
- data/category_counts.json
- data/source_stats.json
- data/generated_at.json
- data/manual_gallery.json
"""
from __future__ import annotations
import hashlib, html, json, re, socket, urllib.parse, urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
TIMEOUT = 14
UA = "WEB-VIJESTI-Aktual-Media/7.6 (+https://aktualmedia.github.io/all-business-news/)"
MAX_PER_CATEGORY = 1000
MAX_ITEMS_PER_FEED = 12
GALLERY_LIMIT = 500
CATEGORIES = ["poslovanje","ekonomija","financije","trzista","kultura","dizajn","tehnologija","znanost","lifestyle","hedonizam","satovi","nakit","pica","vijesti"]
CATEGORY_LABELS = {"poslovanje":"POSLOVANJE","ekonomija":"EKONOMIJA","financije":"FINANCIJE","trzista":"TRŽIŠTA","kultura":"KULTURA","dizajn":"DIZAJN","tehnologija":"TEHNOLOGIJA","znanost":"ZNANOST","lifestyle":"LIFESTYLE","hedonizam":"HEDONIZAM","satovi":"SATOVI","nakit":"NAKIT","pica":"PIĆA","vijesti":"VIJESTI"}
TRACKING_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","fbclid","gclid","mc_cid","mc_eid","ref","ref_src"}
EXTRA_FEEDS = [
    {"id":"extra-beauty-001","category":"lifestyle","name":"Allure Beauty","url":"https://www.allure.com/feed/rss","enabled":True},
    {"id":"extra-beauty-002","category":"lifestyle","name":"Byrdie","url":"https://www.byrdie.com/rss","enabled":True},
    {"id":"extra-beauty-003","category":"lifestyle","name":"NewBeauty","url":"https://www.newbeauty.com/feed/","enabled":True},
    {"id":"extra-beauty-004","category":"lifestyle","name":"Beauty Packaging","url":"https://www.beautypackaging.com/rss/contents/view_breaking-news/","enabled":True},
    {"id":"extra-care-001","category":"lifestyle","name":"Well+Good","url":"https://www.wellandgood.com/feed/","enabled":True},
    {"id":"extra-care-002","category":"lifestyle","name":"MindBodyGreen","url":"https://www.mindbodygreen.com/rss.xml","enabled":True},
    {"id":"extra-pets-001","category":"lifestyle","name":"PetMD","url":"https://www.petmd.com/rss","enabled":True},
    {"id":"extra-pets-002","category":"lifestyle","name":"The Spruce Pets","url":"https://www.thesprucepets.com/rss","enabled":True},
    {"id":"extra-pets-003","category":"lifestyle","name":"Dogster","url":"https://www.dogster.com/feed","enabled":True},
    {"id":"extra-pets-004","category":"lifestyle","name":"Catster","url":"https://www.catster.com/feed","enabled":True}
]

def read_json(path, default):
    p = ROOT / path
    if not p.exists(): return default
    try: return json.loads(p.read_text(encoding="utf-8"))
    except Exception: return default

def write_json(path, obj):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def textify(value):
    value = re.sub(r"(?is)<(script|style).*?>.*?</\\1>", " ", str(value or ""))
    value = re.sub(r"(?is)<.*?>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()

def norm_title(title):
    title = textify(title).lower()
    title = re.sub(r"[^a-z0-9čćšžđ]+", " ", title, flags=re.I)
    return re.sub(r"\s+", " ", title).strip()

def canonical_url(url):
    url = html.unescape(str(url or "")).strip()
    if not url: return ""
    try:
        p = urllib.parse.urlsplit(url)
        scheme = (p.scheme or "https").lower()
        netloc = p.netloc.lower()[4:] if p.netloc.lower().startswith("www.") else p.netloc.lower()
        path = re.sub(r"/+", "/", p.path or "/").rstrip("/") or "/"
        q = [(k,v) for k,v in urllib.parse.parse_qsl(p.query, keep_blank_values=True) if k.lower() not in TRACKING_PARAMS]
        return urllib.parse.urlunsplit((scheme, netloc, path, urllib.parse.urlencode(q, doseq=True), ""))
    except Exception:
        return url.lower().split("#",1)[0].rstrip("/")

def stable_id(link, title):
    raw = canonical_url(link) or norm_title(title)
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()[:16]

def dedupe_key(item):
    url = canonical_url(item.get("url") or item.get("link") or item.get("source_url"))
    if url: return "url:" + url
    return "title:" + hashlib.sha1(f"{item.get('category','vijesti')}|{textify(item.get('source','')).lower()}|{norm_title(item.get('title'))}".encode()).hexdigest()

def parse_date(value):
    if not value: return ""
    try: return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception: pass
    try: return datetime.fromisoformat(str(value).replace("Z","+00:00")).astimezone(timezone.utc).isoformat()
    except Exception: return str(value or "")

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent":UA,"Accept":"application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r: return r.read()

def attr_image(el):
    for child in list(el.iter()):
        tag = child.tag.lower(); url = child.attrib.get("url") or child.attrib.get("href"); typ = (child.attrib.get("type") or "").lower()
        if url and ("thumbnail" in tag or "content" in tag or "enclosure" in tag) and (typ.startswith("image/") or re.search(r"\.(jpg|jpeg|png|webp|gif)(\?|$)", url, re.I)):
            return url
    return ""

def html_image(*texts):
    joined = " ".join(str(t or "") for t in texts)
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', joined, re.I)
    return html.unescape(m.group(1)) if m else ""

def child_text(el, names):
    wanted = {n.lower() for n in names}
    for ch in list(el):
        if ch.tag.split("}")[-1].lower() in wanted: return "".join(ch.itertext()).strip()
    return ""

def child_attr(el, names, attr):
    wanted = {n.lower() for n in names}
    for ch in list(el):
        if ch.tag.split("}")[-1].lower() in wanted and ch.attrib.get(attr): return ch.attrib.get(attr)
    return ""

def parse_feed(xml_bytes, feed):
    out=[]
    try: root=ET.fromstring(xml_bytes)
    except Exception: return out
    entries = list(root.findall(".//item")) or list(root.findall(".//{http://www.w3.org/2005/Atom}entry")) or [e for e in root.iter() if e.tag.split("}")[-1].lower() in ("item","entry")]
    for el in entries[:MAX_ITEMS_PER_FEED]:
        title=child_text(el,["title"]); link=child_text(el,["link"]) or child_attr(el,["link"],"href")
        desc=child_text(el,["description","summary","content","encoded"]); pub=child_text(el,["pubDate","published","updated","dc:date"])
        img=attr_image(el) or html_image(desc)
        if not title or not link or not img: continue
        out.append({"id":stable_id(link,title),"title":textify(title),"description":textify(desc)[:900],"url":link.strip(),"image":img.strip(),"source":feed.get("name") or feed.get("id") or "RSS","source_id":feed.get("id"),"category":feed.get("category") or "vijesti","published_at":parse_date(pub) or datetime.now(timezone.utc).isoformat(),"fetched_at":datetime.now(timezone.utc).isoformat()})
    return out

def read_old_items():
    items=[]; items.extend(read_json("data/news.json", [])); items.extend(read_json("data/archive.json", []))
    folder=DATA/"category_news"
    if folder.exists():
        for fp in folder.glob("*.json"): items.extend(read_json(str(fp.relative_to(ROOT)), []))
    return items

def normalize_item(n):
    if not isinstance(n, dict) or not n.get("image"): return None
    n=dict(n); n["title"]=textify(n.get("title")); n["url"]=str(n.get("url") or n.get("link") or n.get("source_url") or "").strip()
    if not n["title"] or not n["url"]: return None
    if not n.get("description") and n.get("summary"): n["description"]=n.get("summary")
    n["description"]=textify(n.get("description"))[:900]; n["category"]=n.get("category") if n.get("category") in CATEGORIES else "vijesti"
    n["published_at"]=parse_date(n.get("published_at")) or datetime.now(timezone.utc).isoformat(); n["id"]=stable_id(n.get("url"), n.get("title"))
    return n

def build_gallery(news_items):
    admin = read_json("data/admin_gallery.json", [])
    gallery=[]; seen=set()
    for g in admin if isinstance(admin, list) else []:
        img=str(g.get("image") or "").strip()
        if img and img not in seen:
            seen.add(img); gallery.append(g)
    for n in news_items:
        img=str(n.get("image") or "").strip()
        if img and img not in seen:
            seen.add(img); gallery.append({"title":n.get("title"),"description":f"{n.get('source','Izvor')} · fotografija iz vijesti", "image":img,"category":n.get("category","vijesti"),"source_url":n.get("url"),"created_at":n.get("published_at"),"auto_from_news":True})
        if len(gallery)>=GALLERY_LIMIT: break
    themes=["kultura","dizajn","tehnologija","znanost","poslovanje","financije","trzista","hedonizam","satovi","nakit","pica","lifestyle","arhitektura","umjetnost","putovanja","symbol"]
    i=1
    while len(gallery)<GALLERY_LIMIT:
        cat=themes[(i-1)%len(themes)]; img=f"https://picsum.photos/seed/wv-{cat}-{i:03d}/1400/900"
        if img not in seen:
            seen.add(img); gallery.append({"title":f"{CATEGORY_LABELS.get(cat,cat.upper())} · fotografija {i:03d}","description":"Tematska fotografija za WEB VIJESTI galeriju","image":img,"category":cat,"source":"Lorem Picsum public photo stream","source_url":"https://picsum.photos/","created_at":datetime.now(timezone.utc).isoformat(),"auto_gallery":True})
        i+=1
    write_json("data/manual_gallery.json", gallery[:GALLERY_LIMIT])

def main():
    socket.setdefaulttimeout(TIMEOUT)
    base_feeds = [f for f in read_json("data/feeds.json", []) if f.get("enabled", True) and f.get("url")]
    seen_urls={f.get("url") for f in base_feeds}
    feeds = base_feeds + [f for f in EXTRA_FEEDS if f.get("url") not in seen_urls]
    found=[]; source_rows=[]; ok=failed=0
    for feed in feeds:
        row={"id":feed.get("id"),"name":feed.get("name"),"category":feed.get("category"),"url":feed.get("url"),"count":0,"status":"failed"}
        try:
            items=parse_feed(fetch(feed["url"]), feed); found.extend(items); row["count"]=len(items); row["status"]="ok" if items else "empty"; ok += 1 if items else 0
        except Exception as e:
            row["error"]=str(e)[:160]; failed += 1
        source_rows.append(row)
    candidates=[n for item in found+read_old_items() if (n:=normalize_item(item))]
    best={}
    for n in sorted(candidates, key=lambda x:x.get("published_at",""), reverse=True):
        key=dedupe_key(n)
        if key not in best: best[key]=n
    merged=list(best.values()); merged.sort(key=lambda x:x.get("published_at",""), reverse=True)
    by_cat={c:[] for c in CATEGORIES}; title_seen={c:set() for c in CATEGORIES}
    for n in merged:
        cat=n.get("category") or "vijesti"; tk=norm_title(n.get("title"))
        if tk in title_seen[cat] or len(by_cat[cat])>=MAX_PER_CATEGORY: continue
        title_seen[cat].add(tk); by_cat[cat].append(n)
    final=[]
    for c in CATEGORIES: final.extend(by_cat[c])
    final.sort(key=lambda x:x.get("published_at",""), reverse=True)
    write_json("data/news.json", final)
    for c, items in by_cat.items(): write_json(f"data/category_news/{c}.json", items)
    counts={c:len(by_cat[c]) for c in CATEGORIES}
    write_json("data/category_counts.json", {"updated_at":datetime.now(timezone.utc).isoformat(),"counts":counts,"labels":CATEGORY_LABELS})
    by_source={}
    for n in final:
        s=n.get("source") or "Nepoznato"; by_source[s]=by_source.get(s,0)+1
    source_rows.sort(key=lambda r:(r.get("status")!="ok", -(r.get("count") or 0), r.get("name") or ""))
    write_json("data/source_stats.json", {"updated_at":datetime.now(timezone.utc).isoformat(),"sources":len(feeds),"ok_sources":ok,"failed_sources":failed,"items_by_source":by_source,"feed_results":source_rows})
    write_json("data/generated_at.json", {"generated_at":datetime.now(timezone.utc).isoformat(),"sources":len(feeds),"ok_sources":ok,"failed_sources":failed,"news_count":len(final),"category_counts":counts,"gallery_count":GALLERY_LIMIT})
    build_gallery(final)
    print(f"UPDATED: {len(final)} vijesti, galerija {GALLERY_LIMIT}, izvori OK {ok}/{len(feeds)}")
if __name__=="__main__": main()
