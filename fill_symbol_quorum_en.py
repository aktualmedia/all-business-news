#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dodatno povlači sadržaj s engleske Symbol Quorum stranice.

Izvor: https://symbol-quorum.com/en/
Skripta je odvojena od glavnog updatea kako bi se engleski Symbol Quorum mogao
nadopunjavati bez diranja osnovne logike agregatora.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UA = "WEB-VIJESTI-Symbol-Quorum-EN/1.0 (+https://aktualmedia.github.io/all-business-news/)"
TIMEOUT = 14
MAX_ITEMS_PER_PAGE = 24
MAX_PER_CATEGORY = 1000

SOURCES = [
    ("kultura", "Symbol Quorum EN - home", "https://symbol-quorum.com/en/"),
    ("kultura", "Symbol Quorum EN - culture art", "https://symbol-quorum.com/en/category/culture-art/"),
    ("poslovanje", "Symbol Quorum EN - entrepreneurship", "https://symbol-quorum.com/en/category/entrepreneurship/"),
    ("pica", "Symbol Quorum EN - gastronomy", "https://symbol-quorum.com/en/category/gastronomy/"),
    ("lifestyle", "Symbol Quorum EN - lifestyle", "https://symbol-quorum.com/en/category/lifestyle/"),
]

LABELS = {
    "kultura": "KULTURA",
    "poslovanje": "POSLOVANJE",
    "pica": "PIĆA",
    "lifestyle": "LIFESTYLE",
}

SKIP_WORDS = (
    "facebook.com", "instagram.com", "youtube.com", "linkedin.com", "twitter.com", "x.com",
    "privacy", "cookie", "contact", "impressum", "login", "wp-admin", "#", "mailto:", "tel:"
)
BLOCKED_TITLE_WORDS = ("politics", "election", "sport", "football", "soccer", "tennis", "basketball")


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


def placeholder_image(source, title, category):
    seed = hashlib.sha1((source + "|" + title + "|" + category).encode("utf-8", "ignore")).hexdigest()[:12]
    return f"https://picsum.photos/seed/wv-symbol-en-{seed}/1200/750"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return response.read().decode("utf-8", "ignore")


def allowed_link(base_url, href):
    if not href:
        return ""
    href = html.unescape(href).strip()
    low = href.lower()
    if any(w in low for w in SKIP_WORDS):
        return ""
    url = urllib.parse.urljoin(base_url, href)
    host = urllib.parse.urlsplit(url).netloc.lower().replace("www.", "")
    if host != "symbol-quorum.com":
        return ""
    path = urllib.parse.urlsplit(url).path.lower()
    if not path.startswith("/en/") and path != "/en":
        return ""
    return url.split("#", 1)[0]


def find_image(base_url, html_fragment):
    for pat in [
        r'<img[^>]+(?:data-src|data-lazy-src|src)=["\\']([^"\\']+)["\\']',
        r'<source[^>]+srcset=["\\']([^"\\']+)["\\']',
        r'<meta[^>]+property=["\\']og:image["\\'][^>]+content=["\\']([^"\\']+)["\\']',
    ]:
        m = re.search(pat, html_fragment, re.I | re.S)
        if m:
            img = html.unescape(m.group(1)).split(",", 1)[0].strip().split(" ", 1)[0]
            return urllib.parse.urljoin(base_url, img)
    return ""


def parse_page(category, source_name, url, raw):
    out, seen = [], set()
    # širi kontekst oko linka hvata sliku i eventualni excerpt
    for m in re.finditer(r'<a\\b[^>]*href=["\\']([^"\\']+)["\\'][^>]*>(.*?)</a>', raw, re.I | re.S):
        link = allowed_link(url, m.group(1))
        if not link or link in seen:
            continue
        title = textify(m.group(2))
        title = re.sub(r"^(Read more|More|Continue reading)\s*", "", title, flags=re.I).strip()
        if len(title) < 20 or len(title) > 190:
            continue
        low = title.lower()
        if any(w in low for w in BLOCKED_TITLE_WORDS):
            continue
        seen.add(link)
        around = raw[max(0, m.start() - 1800): min(len(raw), m.end() + 1800)]
        desc = textify(re.sub(r"(?is).*?</a>", "", around, count=1))[:650]
        if len(desc) < 30:
            desc = f"Izvorni naslov/sažetak s portala {source_name}. Nastavak se čita kod izvornog izdavača."
        img = find_image(url, around) or placeholder_image(source_name, title, category)
        out.append({
            "id": stable_id(link, title),
            "title": title,
            "description": desc,
            "url": link,
            "image": img,
            "source": source_name,
            "source_id": "symbol-quorum-en",
            "category": category,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "symbol_quorum_en": True,
        })
        if len(out) >= MAX_ITEMS_PER_PAGE:
            break
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
    source_rows = []

    for category, source_name, url in SOURCES:
        try:
            items = parse_page(category, source_name, url, fetch(url))
        except Exception as exc:
            print(f"SYMBOL EN GREŠKA {source_name}: {exc}")
            source_rows.append({"name": source_name, "category": category, "url": url, "status": "failed", "count": 0, "error": str(exc)[:160]})
            continue
        source_rows.append({"name": source_name, "category": category, "url": url, "status": "ok" if items else "empty", "count": len(items)})
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

    stats = read_json("data/source_stats.json", {})
    rows = stats.get("feed_results", []) if isinstance(stats, dict) else []
    rows = [r for r in rows if not str(r.get("name", "")).startswith("Symbol Quorum EN")]
    rows.extend(source_rows)
    if isinstance(stats, dict):
        stats["feed_results"] = rows
        stats["sources"] = max(int(stats.get("sources") or 0), len(rows))
        stats["updated_at"] = datetime.now(timezone.utc).isoformat()
        write_json("data/source_stats.json", stats)

    print("SYMBOL QUORUM EN FILL:", added)


if __name__ == "__main__":
    main()
