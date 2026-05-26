#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dodatno povlači sadržaj s engleske Symbol Quorum stranice.

Skripta je dopunska: nedostupan pojedini izvor ne smije zaustaviti osvježavanje
cijelog WEB VIJESTI portala.
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
UA = "WEB-VIJESTI-Symbol-Quorum-EN/1.1 (+https://aktualmedia.github.io/all-business-news/)"
TIMEOUT = 8
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
    target = ROOT / path
    if not target.exists():
        return default
    try:
        return json.loads(target.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def textify(value):
    value = html.unescape(str(value or ""))
    value = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", value)
    value = re.sub(r"(?is)<.*?>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def stable_id(url, title):
    raw = f"{url or ''}|{title or ''}"
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()[:16]


def placeholder_image(source, title, category):
    seed = hashlib.sha1(f"{source}|{title}|{category}".encode("utf-8", "ignore")).hexdigest()[:12]
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
    if any(word in low for word in SKIP_WORDS):
        return ""
    url = urllib.parse.urljoin(base_url, href)
    host = urllib.parse.urlsplit(url).netloc.lower().replace("www.", "")
    if host != "symbol-quorum.com":
        return ""
    path = urllib.parse.urlsplit(url).path.lower()
    if not path.startswith("/en/") and path != "/en":
        return ""
    return url.split("#", 1)[0]


def find_image(base_url, fragment):
    patterns = [
        r"<img[^>]+(?:data-src|data-lazy-src|src)=[\"']([^\"']+)[\"']",
        r"<source[^>]+srcset=[\"']([^\"']+)[\"']",
        r"<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']",
    ]
    for pattern in patterns:
        match = re.search(pattern, fragment, re.I | re.S)
        if match:
            image = html.unescape(match.group(1)).split(",", 1)[0].strip().split(" ", 1)[0]
            return urllib.parse.urljoin(base_url, image)
    return ""


def parse_page(category, source_name, url, raw):
    output, seen = [], set()
    pattern = r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>"
    for match in re.finditer(pattern, raw, re.I | re.S):
        link = allowed_link(url, match.group(1))
        if not link or link in seen:
            continue
        title = textify(match.group(2))
        title = re.sub(r"^(Read more|More|Continue reading)\s*", "", title, flags=re.I).strip()
        if len(title) < 20 or len(title) > 190:
            continue
        if any(word in title.lower() for word in BLOCKED_TITLE_WORDS):
            continue
        seen.add(link)
        around = raw[max(0, match.start() - 1800): min(len(raw), match.end() + 1800)]
        description = textify(re.sub(r"(?is).*?</a>", "", around, count=1))[:650]
        if len(description) < 30:
            description = f"Izvorni naslov/sažetak s portala {source_name}. Nastavak se čita kod izvornog izdavača."
        image = find_image(url, around) or placeholder_image(source_name, title, category)
        output.append({
            "id": stable_id(link, title),
            "title": title,
            "description": description,
            "url": link,
            "image": image,
            "source": source_name,
            "source_id": "symbol-quorum-en",
            "category": category,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "symbol_quorum_en": True,
        })
        if len(output) >= MAX_ITEMS_PER_PAGE:
            break
    return output


def dedupe(items):
    output, seen = [], set()
    for item in items:
        key = item.get("url") or item.get("id") or item.get("title")
        if key in seen:
            continue
        seen.add(key)
        output.append(item)
    return output


def main():
    by_category = {category: read_json(f"data/category_news/{category}.json", []) for category in LABELS}
    all_news = read_json("data/news.json", [])
    added = {category: 0 for category in LABELS}
    source_rows = []

    for category, source_name, url in SOURCES:
        try:
            items = parse_page(category, source_name, url, fetch(url))
        except Exception as exc:
            print(f"SYMBOL EN GREŠKA {source_name}: {exc}")
            source_rows.append({"name": source_name, "category": category, "url": url, "status": "failed", "count": 0, "error": str(exc)[:160]})
            continue
        source_rows.append({"name": source_name, "category": category, "url": url, "status": "ok" if items else "empty", "count": len(items)})
        if items:
            existing = by_category.setdefault(category, [])
            previous_count = len(existing)
            by_category[category] = dedupe(items + existing)[:MAX_PER_CATEGORY]
            added[category] += max(0, len(by_category[category]) - previous_count)

    for category, items in by_category.items():
        write_json(f"data/category_news/{category}.json", items)

    merged = dedupe(sum((items for items in by_category.values()), []) + all_news)
    merged.sort(key=lambda item: item.get("published_at", ""), reverse=True)
    write_json("data/news.json", merged[:2500])

    counts = read_json("data/category_counts.json", {"counts": {}, "labels": {}})
    counts.setdefault("counts", {})
    counts.setdefault("labels", {})
    for category, items in by_category.items():
        counts["counts"][category] = len(items)
        counts["labels"][category] = LABELS[category]
    counts["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json("data/category_counts.json", counts)

    stats = read_json("data/source_stats.json", {})
    if isinstance(stats, dict):
        rows = [row for row in stats.get("feed_results", []) if not str(row.get("name", "")).startswith("Symbol Quorum EN")]
        rows.extend(source_rows)
        stats["feed_results"] = rows
        stats["sources"] = max(int(stats.get("sources") or 0), len(rows))
        stats["updated_at"] = datetime.now(timezone.utc).isoformat()
        write_json("data/source_stats.json", stats)

    print("SYMBOL QUORUM EN FILL:", added)


if __name__ == "__main__":
    main()
