#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dodatno puni kategorije koje znaju ostati prazne ili slabo popunjene.

Fokus: satovi, nakit, znanost, tehnologija, hrana, pića i hedonizam.
Skripta se pokreće nakon glavnog updatea i nakon fill_premium_categories.py.
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
TIMEOUT = 14
UA = "WEB-VIJESTI-Missing-Core-Fill/1.0 (+https://aktualmedia.github.io/all-business-news/)"
MAX_ITEMS_PER_SOURCE = 24
MAX_PER_CATEGORY = 1000

SOURCES = [
    # TEHNOLOGIJA
    ("tehnologija", "Google News Technology Business", "https://news.google.com/rss/search?q=technology%20business%20AI%20software%20innovation&hl=en&gl=US&ceid=US:en"),
    ("tehnologija", "Google News AI Economy", "https://news.google.com/rss/search?q=artificial%20intelligence%20economy%20business%20technology&hl=en&gl=US&ceid=US:en"),
    ("tehnologija", "MIT Technology Review", "https://www.technologyreview.com/feed/"),
    ("tehnologija", "TechCrunch", "https://techcrunch.com/feed/"),
    ("tehnologija", "Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
    ("tehnologija", "The Verge", "https://www.theverge.com/rss/index.xml"),
    ("tehnologija", "VentureBeat", "https://venturebeat.com/feed/"),
    ("tehnologija", "IEEE Spectrum", "https://spectrum.ieee.org/feeds/feed.rss"),

    # ZNANOST
    ("znanost", "Google News Science Innovation", "https://news.google.com/rss/search?q=science%20research%20innovation%20technology%20development&hl=en&gl=US&ceid=US:en"),
    ("znanost", "Google News Health Science", "https://news.google.com/rss/search?q=health%20science%20research%20medicine%20innovation&hl=en&gl=US&ceid=US:en"),
    ("znanost", "ScienceDaily Top", "https://www.sciencedaily.com/rss/top.xml"),
    ("znanost", "Phys.org", "https://phys.org/rss-feed/"),
    ("znanost", "NASA Breaking News", "https://www.nasa.gov/rss/dyn/breaking_news.rss"),
    ("znanost", "Scientific American", "https://www.scientificamerican.com/feed/"),
    ("znanost", "Medical Xpress", "https://medicalxpress.com/rss-feed/"),
    ("znanost", "New Scientist", "https://www.newscientist.com/feed/home/"),

    # SATOVI
    ("satovi", "Google News Luxury Watches", "https://news.google.com/rss/search?q=luxury%20watches%20watchmaking%20horology%20watch%20industry&hl=en&gl=US&ceid=US:en"),
    ("satovi", "Google News Horology", "https://news.google.com/rss/search?q=horology%20watchmaking%20new%20watch%20release&hl=en&gl=US&ceid=US:en"),
    ("satovi", "Hodinkee", "https://www.hodinkee.com/articles/rss"),
    ("satovi", "WatchTime", "https://www.watchtime.com/feed/"),
    ("satovi", "Monochrome Watches", "https://monochrome-watches.com/feed/"),
    ("satovi", "aBlogtoWatch", "https://www.ablogtowatch.com/feed/"),
    ("satovi", "Fratello Watches", "https://www.fratellowatches.com/feed/"),
    ("satovi", "Worn & Wound", "https://wornandwound.com/feed/"),

    # NAKIT
    ("nakit", "Google News Jewelry Luxury", "https://news.google.com/rss/search?q=jewelry%20diamonds%20luxury%20jewellery%20design&hl=en&gl=US&ceid=US:en"),
    ("nakit", "Google News Diamonds Gems", "https://news.google.com/rss/search?q=diamonds%20gems%20jewelry%20market%20luxury&hl=en&gl=US&ceid=US:en"),
    ("nakit", "JCK Online", "https://www.jckonline.com/feed/"),
    ("nakit", "The Jewellery Editor", "https://www.thejewelleryeditor.com/feed/"),
    ("nakit", "The Adventurine", "https://theadventurine.com/feed/"),
    ("nakit", "Professional Jeweller", "https://www.professionaljeweller.com/feed/"),

    # HRANA
    ("hrana", "Google News Food Gastronomy", "https://news.google.com/rss/search?q=food%20gastronomy%20restaurants%20fine%20dining%20chef&hl=en&gl=US&ceid=US:en"),
    ("hrana", "Eater", "https://www.eater.com/rss/index.xml"),
    ("hrana", "Serious Eats", "https://www.seriouseats.com/rss"),
    ("hrana", "Food52", "https://food52.com/blog.rss"),
    ("hrana", "Bon Appetit", "https://www.bonappetit.com/feed/rss"),
    ("hrana", "Restaurant Business", "https://www.restaurantbusinessonline.com/rss.xml"),

    # PIĆA
    ("pica", "Google News Wine Drinks", "https://news.google.com/rss/search?q=wine%20spirits%20drinks%20whisky%20cocktails%20beverage&hl=en&gl=US&ceid=US:en"),
    ("pica", "Decanter", "https://www.decanter.com/feed/"),
    ("pica", "VinePair", "https://vinepair.com/feed/"),
    ("pica", "The Drinks Business", "https://www.thedrinksbusiness.com/feed/"),
    ("pica", "Whisky Advocate", "https://www.whiskyadvocate.com/feed/"),

    # HEDONIZAM
    ("hedonizam", "Google News Luxury Lifestyle", "https://news.google.com/rss/search?q=luxury%20lifestyle%20premium%20travel%20design%20hedonism&hl=en&gl=US&ceid=US:en"),
    ("hedonizam", "Robb Report", "https://robbreport.com/feed/"),
    ("hedonizam", "Luxuo", "https://www.luxuo.com/feed"),
    ("hedonizam", "Elite Traveler", "https://elitetraveler.com/feed"),
]

LABELS = {
    "tehnologija": "TEHNOLOGIJA",
    "znanost": "ZNANOST",
    "satovi": "SATOVI",
    "nakit": "NAKIT",
    "hrana": "HRANA",
    "pica": "PIĆA",
    "hedonizam": "HEDONIZAM",
}

BLOCKED = ("politic", "politika", "election", "sport", "football", "tennis", "soccer", "basketball")


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
    return f"https://picsum.photos/seed/wv-fill-{seed}/1200/750"


def parse_feed(category, source, url, raw):
    try:
        root = ET.fromstring(raw)
    except Exception:
        return []
    entries = list(root.findall(".//item")) or list(root.findall(".//{http://www.w3.org/2005/Atom}entry")) or [x for x in root.iter() if x.tag.split("}")[-1].lower() in ("item", "entry")]
    out = []
    for item in entries[:MAX_ITEMS_PER_SOURCE]:
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
            "source_id": "missing-core-" + category,
            "category": category,
            "published_at": parse_date(pub),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "missing_core_fill": True,
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
            print(f"MISSING CORE GREŠKA {category} / {source}: {exc}")
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
    write_json("data/news.json", merged[:2500])

    counts = read_json("data/category_counts.json", {"counts": {}, "labels": {}})
    counts.setdefault("counts", {})
    counts.setdefault("labels", {})
    for cat, items in by_cat.items():
        counts["counts"][cat] = len(items)
        counts["labels"][cat] = LABELS[cat]
    counts["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json("data/category_counts.json", counts)
    print("MISSING CORE CATEGORY FILL:", added)


if __name__ == "__main__":
    main()
