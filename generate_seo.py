#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generira SEO datoteke za WEB VIJESTI / GitHub Pages.

Izlaz:
- sitemap.xml s lastmod/changefreq/priority
- sitemap-news.xml za najnovije vijesti
- urllist.txt kao jednostavni popis URL-ova
- site.webmanifest
- llms.txt
- data/seo_index.json
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
SITE = "https://aktualmedia.github.io/all-business-news/"
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

STATIC_URLS = [
    ("", "hourly", "1.00"),
    ("vijesti/index.html", "hourly", "0.95"),
    ("objave/index.html", "daily", "0.92"),
    ("symbol/index.html", "weekly", "0.88"),
    ("digitalna-izdanja/index.html", "weekly", "0.84"),
    ("galerija/index.html", "daily", "0.82"),
    ("video/index.html", "daily", "0.80"),
    ("radio/index.html", "weekly", "0.70"),
    ("dogadjanja/index.html", "daily", "0.78"),
    ("izvori/index.html", "daily", "0.78"),
    ("poslovanje/index.html", "hourly", "0.86"),
    ("ekonomija/index.html", "hourly", "0.86"),
    ("financije/index.html", "hourly", "0.86"),
    ("trzista/index.html", "hourly", "0.86"),
    ("kultura/index.html", "hourly", "0.84"),
    ("dizajn/index.html", "daily", "0.82"),
    ("tehnologija/index.html", "hourly", "0.84"),
    ("znanost/index.html", "daily", "0.80"),
    ("lifestyle/index.html", "daily", "0.80"),
    ("hedonizam/index.html", "daily", "0.78"),
    ("satovi/index.html", "daily", "0.76"),
    ("nakit/index.html", "daily", "0.76"),
    ("pica/index.html", "daily", "0.76"),
]


def read_json(path: str, default):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default


def write(path: str, content: str):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def write_json(path: str, obj):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def textify(v: str) -> str:
    v = re.sub(r"<[^>]+>", " ", str(v or ""))
    return re.sub(r"\s+", " ", v).strip()


def slugify(title: str) -> str:
    title = textify(title).lower()
    repl = str.maketrans({"č":"c","ć":"c","š":"s","ž":"z","đ":"d"})
    title = title.translate(repl)
    title = re.sub(r"[^a-z0-9]+", "-", title).strip("-")
    return title[:92] or "vijest"


def url(path: str) -> str:
    return SITE + quote(path.lstrip("/"), safe="/:?=&%#.-_")


def parse_date(value: str) -> str:
    if not value:
        return NOW
    s = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s).astimezone(timezone.utc).replace(microsecond=0).isoformat()
    except Exception:
        return NOW


def sitemap_entry(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
    return (
        "  <url>\n"
        f"    <loc>{escape(loc)}</loc>\n"
        f"    <lastmod>{escape(lastmod)}</lastmod>\n"
        f"    <changefreq>{escape(changefreq)}</changefreq>\n"
        f"    <priority>{escape(priority)}</priority>\n"
        "  </url>"
    )


def main():
    news = read_json("data/news.json", [])
    editions = read_json("data/editions.json", [])
    posts = read_json("data/ai_posts.json", [])

    entries = []
    simple_urls = []
    seen = set()

    def add(path: str, lastmod: str = NOW, changefreq: str = "weekly", priority: str = "0.60"):
        loc = url(path)
        if loc in seen:
            return
        seen.add(loc)
        simple_urls.append(loc)
        entries.append(sitemap_entry(loc, lastmod, changefreq, priority))

    for path, freq, prio in STATIC_URLS:
        add(path, NOW, freq, prio)

    for p in posts if isinstance(posts, list) else []:
        path = str(p.get("url") or p.get("local_url") or "").lstrip("/")
        if path and not path.startswith("http"):
            add(path, parse_date(p.get("published_at") or p.get("date")), "monthly", "0.78")

    for e in editions if isinstance(editions, list) else []:
        path = str(e.get("url") or "").lstrip("/")
        if path and not path.startswith("http"):
            add(path, parse_date(e.get("updated_at") or e.get("date")), "monthly", "0.74")

    for idx, n in enumerate(news[:1200], start=1):
        title = textify(n.get("title"))
        if not title:
            continue
        path = str(n.get("local_url") or n.get("local_path") or "").lstrip("/")
        if not path or path.startswith("http"):
            path = f"citaj/index.html?u={quote(str(n.get('url') or ''), safe='')}&t={quote(title, safe='')}&s={quote(str(n.get('source') or ''), safe='')}&c={quote(str(n.get('category') or 'vijesti'), safe='')}"
        prio = "0.72" if idx <= 80 else "0.58"
        add(path, parse_date(n.get("published_at") or n.get("fetched_at")), "hourly" if idx <= 80 else "daily", prio)

    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + "\n".join(entries) + "\n</urlset>\n"
    write("sitemap.xml", sitemap)

    news_entries = []
    for idx, n in enumerate(news[:200], start=1):
        title = textify(n.get("title"))
        if not title:
            continue
        path = str(n.get("local_url") or n.get("local_path") or "").lstrip("/")
        if not path or path.startswith("http"):
            path = f"citaj/index.html?u={quote(str(n.get('url') or ''), safe='')}&t={quote(title, safe='')}&s={quote(str(n.get('source') or ''), safe='')}&c={quote(str(n.get('category') or 'vijesti'), safe='')}"
        news_entries.append(sitemap_entry(url(path), parse_date(n.get("published_at") or n.get("fetched_at")), "hourly", "0.76" if idx <= 50 else "0.64"))
    write("sitemap-news.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + "\n".join(news_entries) + "\n</urlset>\n")

    write("urllist.txt", "\n".join(simple_urls) + "\n")
    write("site.webmanifest", json.dumps({
        "name": "WEB VIJESTI / All Business News",
        "short_name": "WEB VIJESTI",
        "start_url": "/all-business-news/",
        "scope": "/all-business-news/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#111111",
        "description": "Pregled poslovnih, ekonomskih, tehnoloških, kulturnih i autorskih vijesti.",
        "lang": "hr-HR"
    }, ensure_ascii=False, indent=2))

    write("llms.txt", "# WEB VIJESTI / All Business News\n\nSlužbena stranica: https://aktualmedia.github.io/all-business-news/\n\nGlavne rubrike:\n- Vijesti: poslovanje, ekonomija, financije, tržišta, tehnologija, kultura, dizajn, znanost, lifestyle, hedonizam, satovi, nakit i pića.\n- Objave: autorski tekstovi Nermina Sefića.\n- Symbol: digitalna izdanja i PDF pregled.\n\nSitemap: https://aktualmedia.github.io/all-business-news/sitemap.xml\nNews sitemap: https://aktualmedia.github.io/all-business-news/sitemap-news.xml\n")

    write_json("data/seo_index.json", {
        "generated_at": NOW,
        "site": SITE,
        "total_urls": len(simple_urls),
        "news_urls": len(news_entries),
        "sitemap": SITE + "sitemap.xml",
        "news_sitemap": SITE + "sitemap-news.xml",
        "robots": SITE + "robots.txt",
    })
    print(f"SEO OK: {len(simple_urls)} URL-ova, news sitemap {len(news_entries)} URL-ova")


if __name__ == "__main__":
    main()
