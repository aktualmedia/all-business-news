#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generira čiste SEO karte za WEB VIJESTI / GitHub Pages.

Pravila:
- sitemap.xml je sitemap index;
- indeksiraju se stvarne javne rubrike i originalne autorske objave;
- ne izlažu se prolazni agregatorski URL-ovi s query parametrima kao glavni SEO URL-ovi;
- koristi se samo vjerodostojan lastmod, bez priority/changefreq elemenata.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
SITE = "https://aktualmedia.github.io/all-business-news/"
TODAY = datetime.now(timezone.utc).date().isoformat()

PUBLIC_PAGES = [
    "", "vijesti/index.html", "objave/index.html", "autor/nermin-sefic.html",
    "poslovanje/index.html", "ekonomija/index.html", "financije/index.html",
    "trzista/index.html", "tehnologija/index.html", "kultura/index.html",
    "dizajn/index.html", "znanost/index.html", "lifestyle/index.html",
    "hedonizam/index.html", "satovi/index.html", "nakit/index.html",
    "pica/index.html", "galerija-real/index.html", "symbol/index.html",
    "video/index.html", "radio/index.html", "dogadjanja/index.html",
    "app/index.html"
]

PRESERVED_ORIGINAL_POSTS = [
    {
        "url": "objave/2026-05-18-vjerodostojnost-kao-poslovna-valuta.html",
        "created_at": "2026-05-18",
        "title": "Vjerodostojnost kao poslovna valuta"
    },
    {
        "url": "objave/2026-05-18-digitalna-imovina-i-reputacija.html",
        "created_at": "2026-05-18",
        "title": "Digitalna imovina i reputacija"
    }
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


def absolute(path: str) -> str:
    return SITE + str(path or "").lstrip("/")


def date_only(value: str | None) -> str:
    value = str(value or "")
    return value[:10] if len(value) >= 10 else TODAY


def url_entry(path: str, modified: str) -> str:
    return f"  <url>\n    <loc>{escape(absolute(path))}</loc>\n    <lastmod>{escape(date_only(modified))}</lastmod>\n  </url>"


def write_urlset(path: str, entries: list[str]):
    write(path, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(entries) + '\n</urlset>\n')


def unique_original_posts():
    validated = read_json("data/nermin_seo_posts.json", [])
    items = list(validated if isinstance(validated, list) else []) + PRESERVED_ORIGINAL_POSTS
    clean, urls, topics, titles = [], set(), set(), set()
    for p in items:
        if not isinstance(p, dict):
            continue
        path = str(p.get("url") or p.get("local_url") or "").lstrip("/")
        title = str(p.get("title") or "").strip().lower()
        topic = str(p.get("topic_key") or title).strip().lower()
        if not path or not title or path in urls or title in titles or topic in topics:
            continue
        if p.get("validated_original_article") and int(p.get("word_count") or 0) < 300:
            continue
        urls.add(path); titles.add(title); topics.add(topic); clean.append(p)
    clean.sort(key=lambda p: str(p.get("created_at") or ""), reverse=True)
    return clean


def main():
    posts = unique_original_posts()
    pages_entries = [url_entry(path, TODAY) for path in PUBLIC_PAGES]
    post_entries = [url_entry(str(p.get("url") or p.get("local_url")), str(p.get("created_at") or TODAY)) for p in posts]
    author_entries = [url_entry("autor/nermin-sefic.html", TODAY)]

    write_urlset("sitemap-pages.xml", pages_entries)
    write_urlset("sitemap-posts.xml", post_entries)
    write_urlset("sitemap-authors.xml", author_entries)

    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          f'  <sitemap>\n    <loc>{SITE}sitemap-pages.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>\n'
          f'  <sitemap>\n    <loc>{SITE}sitemap-posts.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>\n'
          f'  <sitemap>\n    <loc>{SITE}sitemap-authors.xml</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>\n'
          '</sitemapindex>\n')

    write("robots.txt", 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + 'sitemap.xml\n')
    write("data/seo_index.json", json.dumps({
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "site": SITE,
        "primary_sitemap": SITE + "sitemap.xml",
        "pages_sitemap": SITE + "sitemap-pages.xml",
        "posts_sitemap": SITE + "sitemap-posts.xml",
        "authors_sitemap": SITE + "sitemap-authors.xml",
        "indexable_pages": len(PUBLIC_PAGES),
        "indexable_original_posts": len(posts),
        "policy": "canonical public pages and original numbered articles only"
    }, ensure_ascii=False, indent=2))
    print(f"SEO OK: {len(PUBLIC_PAGES)} javnih stranica, {len(posts)} originalnih objava")


if __name__ == "__main__":
    main()
