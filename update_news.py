#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""WEB VIJESTI – ručni/automatski RSS update za GitHub Pages.
Ažurira data/news.json, data/category_news/*.json, data/generated_at.json i data/source_stats.json.
Ne dira HTML/CSS izgled stranice.
"""
from __future__ import annotations
import hashlib, html, json, re, socket, urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
TIMEOUT = 14
UA = "WEB-VIJESTI-Aktual-Media/7.0 (+https://aktualmedia.github.io/all-business-news/)"
MAX_PER_CATEGORY = 1000
MAX_ITEMS_PER_FEED = 12

CATEGORIES = ["poslovanje","ekonomija","financije","trzista","kultura","dizajn","tehnologija","znanost","lifestyle","hedonizam","satovi","nakit","pica","vijesti"]


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


def stable_id(link, title):
    raw = (link or "") + "|" + (title or "")
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()[:16]


def parse_date(value):
    if not value:
        return ""
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except Exception:
        return ""


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


def main():
    socket.setdefaulttimeout(TIMEOUT)
    feeds = [f for f in read_json("data/feeds.json", []) if f.get("enabled", True) and f.get("url")]
    old = read_json("data/news.json", []) + read_json("data/archive.json", [])
    found, ok, failed = [], 0, 0
    for feed in feeds:
        try:
            items = parse_feed(fetch(feed["url"]), feed)
            found.extend(items)
            ok += 1 if items else 0
        except Exception as e:
            failed += 1
            print("FEED ERROR:", feed.get("name") or feed.get("url"), e)
    seen, merged = set(), []
    for n in sorted(found + old, key=lambda x: x.get("published_at", ""), reverse=True):
        nid = n.get("id") or stable_id(n.get("url", ""), n.get("title", ""))
        if nid in seen or not n.get("image"):
            continue
        seen.add(nid)
        n["id"] = nid
        merged.append(n)
    by_cat = {c: [] for c in CATEGORIES}
    for n in merged:
        cat = n.get("category") or "vijesti"
        if cat not in by_cat:
            cat = "vijesti"
            n["category"] = cat
        if len(by_cat[cat]) < MAX_PER_CATEGORY:
            by_cat[cat].append(n)
    final = []
    for c in CATEGORIES:
        final.extend(by_cat[c])
    final.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    write_json("data/news.json", final)
    for c, items in by_cat.items():
        write_json(f"data/category_news/{c}.json", items)
    write_json("data/generated_at.json", {"generated_at": datetime.now(timezone.utc).isoformat(), "sources": len(feeds), "ok_sources": ok, "failed_sources": failed, "news_count": len(final)})
    write_json("data/source_stats.json", {"sources": len(feeds), "ok_sources": ok, "failed_sources": failed, "updated_at": datetime.now(timezone.utc).isoformat()})
    print(f"UPDATED: {len(final)} vijesti, izvori OK {ok}/{len(feeds)}, failed {failed}")

if __name__ == "__main__":
    main()
