#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""WEB VIJESTI – RSS update bez duplikata.

Popravak:
- deduplikacija više nije samo po `id`, nego prvenstveno po normaliziranom URL-u;
- čita i stare `data/category_news/*.json` datoteke, pa čisti duplikate koji su već ušli u rubrike;
- isti naslov iz istog izvora više se ne ponavlja u istoj kategoriji;
- čuva do 1000 vijesti po kategoriji.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import socket
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
TIMEOUT = 14
UA = "WEB-VIJESTI-Aktual-Media/7.5 (+https://aktualmedia.github.io/all-business-news/)"
MAX_PER_CATEGORY = 1000
MAX_ITEMS_PER_FEED = 12

CATEGORIES = [
    "poslovanje", "ekonomija", "financije", "trzista", "kultura", "dizajn",
    "tehnologija", "znanost", "lifestyle", "hedonizam", "satovi", "nakit", "pica", "vijesti"
]

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src"
}


def read_json(path, default):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default


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
    if not url:
        return ""
    try:
        p = urllib.parse.urlsplit(url)
        scheme = (p.scheme or "https").lower()
        netloc = p.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = re.sub(r"/+", "/", p.path or "/").rstrip("/") or "/"
        query_pairs = []
        for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True):
            if k.lower() not in TRACKING_PARAMS:
                query_pairs.append((k, v))
        query = urllib.parse.urlencode(query_pairs, doseq=True)
        return urllib.parse.urlunsplit((scheme, netloc, path, query, ""))
    except Exception:
        return url.lower().split("#", 1)[0].rstrip("/")


def stable_id(link, title):
    raw = canonical_url(link) or norm_title(title)
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()[:16]


def dedupe_key(item):
    url = canonical_url(item.get("url") or item.get("link") or item.get("source_url"))
    if url:
        return "url:" + url
    title = norm_title(item.get("title"))
    source = textify(item.get("source") or item.get("source_id") or "").lower()
    cat = item.get("category") or "vijesti"
    return "title:" + hashlib.sha1(f"{cat}|{source}|{title}".encode("utf-8", "ignore")).hexdigest()


def item_score(item):
    score = 0
    if item.get("image"):
        score += 10
    if item.get("local_url") or item.get("local_path"):
        score += 4
    if item.get("description") or item.get("summary"):
        score += 2
    if item.get("published_at"):
        score += 1
    return score


def parse_date(value):
    if not value:
        return ""
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except Exception:
        return str(value or "")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def attr_image(el):
    for child in list(el.iter()):
        tag = child.tag.lower()
        url = child.attrib.get("url") or child.attrib.get("href")
        typ = (child.attrib.get("type") or "").lower()
        if not url:
            continue
        if "thumbnail" in tag or "content" in tag or "enclosure" in tag:
            if typ.startswith("image/") or re.search(r"\.(jpg|jpeg|png|webp|gif)(\?|$)", url, re.I):
                return url
    return ""


def html_image(*texts):
    joined = " ".join(str(t or "") for t in texts)
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', joined, re.I)
    return html.unescape(m.group(1)) if m else ""


def child_text(el, names):
    wanted = {n.lower() for n in names}
    for ch in list(el):
        local = ch.tag.split("}")[-1].lower()
        if local in wanted:
            return "".join(ch.itertext()).strip()
    return ""


def child_attr(el, names, attr):
    wanted = {n.lower() for n in names}
    for ch in list(el):
        local = ch.tag.split("}")[-1].lower()
        if local in wanted and ch.attrib.get(attr):
            return ch.attrib.get(attr)
    return ""


def parse_feed(xml_bytes, feed):
    out = []
    try:
        root = ET.fromstring(xml_bytes)
    except Exception:
        return out
    entries = list(root.findall(".//item")) or list(root.findall(".//{http://www.w3.org/2005/Atom}entry")) or [e for e in root.iter() if e.tag.split("}")[-1].lower() in ("item", "entry")]
    for el in entries[:MAX_ITEMS_PER_FEED]:
        title = child_text(el, ["title"])
        link = child_text(el, ["link"])
        if not link:
            link = child_attr(el, ["link"], "href")
        desc = child_text(el, ["description", "summary", "content", "encoded"])
        pub = child_text(el, ["pubDate", "published", "updated", "dc:date"])
        img = attr_image(el) or html_image(desc)
        if not title or not link or not img:
            continue
        item = {
            "id": stable_id(link, title),
            "title": textify(title),
            "description": textify(desc)[:900],
            "url": link.strip(),
            "image": img.strip(),
            "source": feed.get("name") or feed.get("id") or "RSS",
            "category": feed.get("category") or "vijesti",
            "published_at": parse_date(pub) or datetime.now(timezone.utc).isoformat(),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        out.append(item)
    return out


def read_old_items():
    items = []
    items.extend(read_json("data/news.json", []))
    items.extend(read_json("data/archive.json", []))
    folder = DATA / "category_news"
    if folder.exists():
        for fp in folder.glob("*.json"):
            items.extend(read_json(str(fp.relative_to(ROOT)), []))
    return items


def normalize_item(n):
    if not isinstance(n, dict):
        return None
    if not n.get("image"):
        return None
    n = dict(n)
    n["title"] = textify(n.get("title"))
    if not n["title"]:
        return None
    n["url"] = str(n.get("url") or n.get("link") or n.get("source_url") or "").strip()
    if not n["url"]:
        return None
    if not n.get("description") and n.get("summary"):
        n["description"] = n.get("summary")
    n["description"] = textify(n.get("description"))[:900]
    n["category"] = n.get("category") if n.get("category") in CATEGORIES else "vijesti"
    n["published_at"] = parse_date(n.get("published_at")) or datetime.now(timezone.utc).isoformat()
    n["id"] = stable_id(n.get("url"), n.get("title"))
    return n


def main():
    socket.setdefaulttimeout(TIMEOUT)
    feeds = [f for f in read_json("data/feeds.json", []) if f.get("enabled", True) and f.get("url")]
    found, ok, failed = [], 0, 0
    for feed in feeds:
        try:
            items = parse_feed(fetch(feed["url"]), feed)
            found.extend(items)
            if items:
                ok += 1
        except Exception as e:
            failed += 1
            print("FEED ERROR:", feed.get("name") or feed.get("url"), e)

    candidates = []
    for item in found + read_old_items():
        n = normalize_item(item)
        if n:
            candidates.append(n)

    # Najvažnije: deduplikacija po URL-u + fallback po naslovu/izvoru/kategoriji.
    best = {}
    for n in sorted(candidates, key=lambda x: x.get("published_at", ""), reverse=True):
        key = dedupe_key(n)
        if key not in best or item_score(n) > item_score(best[key]):
            best[key] = n

    merged = list(best.values())
    merged.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    by_cat = {c: [] for c in CATEGORIES}
    title_seen_by_cat = {c: set() for c in CATEGORIES}
    for n in merged:
        cat = n.get("category") or "vijesti"
        title_key = norm_title(n.get("title"))
        if title_key in title_seen_by_cat[cat]:
            continue
        if len(by_cat[cat]) >= MAX_PER_CATEGORY:
            continue
        title_seen_by_cat[cat].add(title_key)
        by_cat[cat].append(n)

    final = []
    for c in CATEGORIES:
        final.extend(by_cat[c])
    final.sort(key=lambda x: x.get("published_at", ""), reverse=True)

    write_json("data/news.json", final)
    for c, items in by_cat.items():
        write_json(f"data/category_news/{c}.json", items)

    write_json("data/generated_at.json", {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sources": len(feeds),
        "ok_sources": ok,
        "failed_sources": failed,
        "news_count": len(final),
        "dedupe": "url + title/source/category"
    })
    write_json("data/source_stats.json", {
        "sources": len(feeds),
        "ok_sources": ok,
        "failed_sources": failed,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "dedupe": "enabled"
    })
    print(f"UPDATED WITHOUT DUPLICATES: {len(final)} vijesti, izvori OK {ok}/{len(feeds)}, failed {failed}")


if __name__ == "__main__":
    main()
