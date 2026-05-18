#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dopunjava premium rubrike: nakit, pića, hrana, satovi i hedonizam.

Ovo je dodatni sigurnosni sloj nakon glavnog RSS updatea. Ako glavna skripta ne napuni
neku rubriku, ova skripta povlači ciljane izvore i upisuje ih u data/category_news/*.json
te spaja u data/news.json.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TIMEOUT = 12
UA = "WEB-VIJESTI-Premium-Categories/1.0 (+https://aktualmedia.github.io/all-business-news/)"
MAX_ITEMS_PER_FEED = 16
MAX_PER_CATEGORY = 1000

SOURCES = [
    # NAKIT
    ("nakit", "JCK Online", "https://www.jckonline.com/feed/"),
    ("nakit", "National Jeweler", "https://www.nationaljeweler.com/rss"),
    ("nakit", "The Jewellery Editor", "https://www.thejewelleryeditor.com/feed/"),
    ("nakit", "Professional Jeweller", "https://www.professionaljeweller.com/feed/"),
    ("nakit", "The Adventurine", "https://theadventurine.com/feed/"),
    ("nakit", "Rapaport News", "https://www.diamonds.net/rss/news.aspx"),
    ("nakit", "Gem-A", "https://gem-a.com/gem-hub/feed"),
    ("nakit", "Google News Jewelry", "https://news.google.com/rss/search?q=jewelry%20diamonds%20luxury%20design&hl=en&gl=US&ceid=US:en"),
    ("nakit", "Google News Jewellery", "https://news.google.com/rss/search?q=jewellery%20gems%20luxury%20design&hl=en&gl=US&ceid=US:en"),

    # PIĆA / VINA
    ("pica", "Decanter", "https://www.decanter.com/feed/"),
    ("pica", "Wine Enthusiast", "https://www.wineenthusiast.com/feed/"),
    ("pica", "VinePair", "https://vinepair.com/feed/"),
    ("pica", "The Drinks Business", "https://www.thedrinksbusiness.com/feed/"),
    ("pica", "Punch Drink", "https://punchdrink.com/feed/"),
    ("pica", "SevenFifty Daily", "https://daily.sevenfifty.com/feed/"),
    ("pica", "Whisky Advocate", "https://www.whiskyadvocate.com/feed/"),
    ("pica", "Good Beer Hunting", "https://www.goodbeerhunting.com/rss"),
    ("pica", "Imbibe Magazine", "https://imbibemagazine.com/feed/"),
    ("pica", "Google News Wine", "https://news.google.com/rss/search?q=wine%20spirits%20drinks%20hospitality&hl=en&gl=US&ceid=US:en"),

    # HRANA / GASTRONOMIJA
    ("hrana", "Eater", "https://www.eater.com/rss/index.xml"),
    ("hrana", "Serious Eats", "https://www.seriouseats.com/rss"),
    ("hrana", "Food52", "https://food52.com/blog.rss"),
    ("hrana", "Bon Appetit", "https://www.bonappetit.com/feed/rss"),
    ("hrana", "Saveur", "https://www.saveur.com/rss.xml"),
    ("hrana", "Food & Wine", "https://www.foodandwine.com/rss"),
    ("hrana", "The Kitchn", "https://www.thekitchn.com/main.rss"),
    ("hrana", "Taste", "https://www.tastecooking.com/feed/"),
    ("hrana", "Restaurant Business", "https://www.restaurantbusinessonline.com/rss.xml"),
    ("hrana", "Google News Gastronomy", "https://news.google.com/rss/search?q=food%20gastronomy%20restaurants%20fine%20dining&hl=en&gl=US&ceid=US:en"),

    # SATOVI
    ("satovi", "Hodinkee", "https://www.hodinkee.com/articles/rss"),
    ("satovi", "WatchTime", "https://www.watchtime.com/feed/"),
    ("satovi", "Monochrome Watches", "https://monochrome-watches.com/feed/"),
    ("satovi", "aBlogtoWatch", "https://www.ablogtowatch.com/feed/"),
    ("satovi", "Fratello Watches", "https://www.fratellowatches.com/feed/"),
    ("satovi", "Time and Tide", "https://timeandtidewatches.com/feed/"),
    ("satovi", "Quill & Pad", "https://quillandpad.com/feed/"),
    ("satovi", "Worn & Wound", "https://wornandwound.com/feed/"),
    ("satovi", "Google News Watches", "https://news.google.com/rss/search?q=luxury%20watches%20watchmaking%20horology&hl=en&gl=US&ceid=US:en"),

    # HEDONIZAM / LUKSUZ
    ("hedonizam", "Robb Report", "https://robbreport.com/feed/"),
    ("hedonizam", "Luxuo", "https://www.luxuo.com/feed"),
    ("hedonizam", "Elite Traveler", "https://elitetraveler.com/feed"),
    ("hedonizam", "Uncrate", "https://uncrate.com/feed/"),
    ("hedonizam", "Gear Patrol", "https://www.gearpatrol.com/rss/all.xml/"),
    ("hedonizam", "Google News Luxury", "https://news.google.com/rss/search?q=luxury%20lifestyle%20premium%20travel%20design&hl=en&gl=US&ceid=US:en"),
]

LABELS = {
    "nakit": "NAKIT",
    "pica": "PIĆA",
    "hrana": "HRANA",
    "satovi": "SATOVI",
    "hedonizam": "HEDONIZAM",
}

BLOCKED = ("politic", "politika", "election", "sport", "football", "tennis", "soccer")


def read_json(path, default):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path, value):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def textify(value):
    value = html.unescape(str(value or ""))
    value = re.sub(r"(?is)<(script|style).*?>.*?</\\1>", " ", value)
    value = re.sub(r"(?is)<.*?>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def stable_id(url, title):
    return hashlib.sha1((str(url or "") + "|" + str(title or "")).encode("utf-8", "ignore")).hexdigest()[:16]


def parse_date(value):
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return response.read()


def child_text(item, names):
    wanted = {n.lower() for n in names}
    for child in list(item):
        if child.tag.split("}")[-1].lower() in wanted:
            return "".join(child.itertext()).strip()
    return ""


def child_attr(item, names, attr):
    wanted = {n.lower() for n in names}
    for child in list(item):
        if child.tag.split("}")[-1].lower() in wanted and child.attrib.get(attr):
            return child.attrib.get(attr)
    return ""


def find_image(item, title, category):
    for child in item.iter():
        tag = child.tag.lower()
        url = child.attrib.get("url") or child.attrib.get("href")
        if url and ("thumbnail" in tag or "content" in tag or "enclosure" in tag):
            return url
    seed = hashlib.sha1((category + "|" + title).encode("utf-8", "ignore")).hexdigest()[:12]
    return f"https://picsum.photos/seed/wv-premium-{seed}/1200/750"


def parse_feed(category, source, url, raw):
    try:
        root = ET.fromstring(raw)
    except Exception:
        return []
    entries = list(root.findall(".//item")) or list(root.findall(".//{http://www.w3.org/2005/Atom}entry")) or [x for x in root.iter() if x.tag.split("}")[-1].lower() in ("item", "entry")]
    out = []
    for item in entries[:MAX_ITEMS_PER_FEED]:
        title = textify(child_text(item, ["title"]))
        link = textify(child_text(item, ["link"])) or child_attr(item, ["link"], "href")
        desc = textify(child_text(item, ["description", "summary", "content", "encoded"]))[:900]
        pub = child_text(item, ["pubDate", "published", "updated", "date"])
        if not title or not link:
            continue
        if any(b in title.lower() for b in BLOCKED):
            continue
        out.append({
            "id": stable_id(link, title),
            "title": title,
            "description": desc or f"Izvorni naslov/sažetak s portala {source}. Nastavak se čita kod izvornog izdavača.",
            "url": link,
            "image": find_image(item, title, category),
            "source": source,
            "source_id": "premium-" + category,
            "category": category,
            "published_at": parse_date(pub),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "premium_category_fill": True,
        })
    return out


def dedupe(items):
    out, seen = [], set()
    for item in items:
        key = item.get("url") or item.get("id") or item.get("title")
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def main():
    by_cat = {cat: read_json(f"data/category_news/{cat}.json", []) for cat in LABELS}
    all_news = read_json("data/news.json", [])

    added = {cat: 0 for cat in LABELS}
    for category, source, url in SOURCES:
        try:
            items = parse_feed(category, source, url, fetch(url))
        except Exception as exc:
            print(f"PREMIUM GREŠKA {category} / {source}: {exc}")
            continue
        if not items:
            continue
        existing = by_cat.setdefault(category, [])
        before = len(existing)
        by_cat[category] = dedupe(items + existing)[:MAX_PER_CATEGORY]
        added[category] += max(0, len(by_cat[category]) - before)

    for cat, items in by_cat.items():
        write_json(f"data/category_news/{cat}.json", items)

    merged = dedupe(sum((items for items in by_cat.values()), []) + all_news)
    merged.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    write_json("data/news.json", merged[:2200])

    counts = read_json("data/category_counts.json", {"counts": {}, "labels": {}})
    counts.setdefault("counts", {})
    counts.setdefault("labels", {})
    for cat, items in by_cat.items():
        counts["counts"][cat] = len(items)
        counts["labels"][cat] = LABELS[cat]
    counts["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json("data/category_counts.json", counts)

    print("PREMIUM CATEGORY FILL:", added)


if __name__ == "__main__":
    main()
