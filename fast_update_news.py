#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Brzo i otporno osvjezavanje portala WEB VIJESTI.

Koristi postojece parsere i pravila iz update_news.py, ali izvore dohvaca
paralelno kako nedostupni RSS/HTML izvori ne bi zaustavili cijeli GitHub
Actions ciklus. Pad pojedinog izvora zapisuje se u source_stats, a preostali
izvori i prethodno valjani sadrzaj ostaju dostupni portalu.

Svaki izvrseni ciklus zapisuje i status sinkronizacije kako bi bilo jasno je li
portal dohvatio nove stavke iz zivih izvora ili je zadrzao ranije valjani skup.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import socket

import update_news as base

REQUEST_TIMEOUT = 8
MAX_WORKERS = 16
SYNC_MODE = "automatic_hourly_parallel"


def load_feeds():
    base_feeds = [
        feed for feed in base.read_json("data/feeds.json", [])
        if feed.get("enabled", True) and feed.get("url")
    ]
    seen_urls = {feed.get("url") for feed in base_feeds}
    return base_feeds + [
        feed for feed in base.EXTRA_FEEDS
        if feed.get("url") not in seen_urls
    ]


def fetch_one(feed):
    row = {
        "id": feed.get("id"),
        "name": feed.get("name"),
        "category": feed.get("category"),
        "url": feed.get("url"),
        "kind": feed.get("kind", "rss"),
        "count": 0,
        "status": "failed",
    }
    try:
        items = base.parse_source(base.fetch(feed["url"]), feed)
        row["count"] = len(items)
        row["status"] = "ok" if items else "empty"
        return items, row
    except Exception as exc:
        row["error"] = str(exc)[:160]
        return [], row


def main():
    base.TIMEOUT = REQUEST_TIMEOUT
    socket.setdefaulttimeout(REQUEST_TIMEOUT)
    feeds = load_feeds()
    found = []
    source_rows = []

    worker_count = min(MAX_WORKERS, max(1, len(feeds)))
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = [executor.submit(fetch_one, feed) for feed in feeds]
        for future in as_completed(futures):
            items, row = future.result()
            found.extend(items)
            source_rows.append(row)

    ok = sum(1 for row in source_rows if row.get("status") == "ok")
    failed = sum(1 for row in source_rows if row.get("status") == "failed")
    empty = sum(1 for row in source_rows if row.get("status") == "empty")
    fresh_items = len(found)
    sync_status = "ok" if fresh_items and ok else "degraded_retaining_valid_archive"
    candidates = [
        item for raw in found + base.read_old_items()
        if (item := base.normalize_item(raw))
    ]
    best = {}
    for item in sorted(candidates, key=lambda value: value.get("published_at", ""), reverse=True):
        key = base.dedupe_key(item)
        if key not in best:
            best[key] = item

    merged = list(best.values())
    merged.sort(key=lambda value: value.get("published_at", ""), reverse=True)
    by_category = {category: [] for category in base.CATEGORIES}
    title_seen = {category: set() for category in base.CATEGORIES}
    for item in merged:
        category = item.get("category") or "vijesti"
        if category not in by_category:
            category = "vijesti"
            item["category"] = category
        title_key = base.norm_title(item.get("title"))
        if title_key in title_seen[category] or len(by_category[category]) >= base.MAX_PER_CATEGORY:
            continue
        title_seen[category].add(title_key)
        by_category[category].append(item)

    final = []
    for category in base.CATEGORIES:
        final.extend(by_category[category])
    final.sort(key=lambda value: value.get("published_at", ""), reverse=True)

    base.write_json("data/news.json", final)
    for category, items in by_category.items():
        base.write_json(f"data/category_news/{category}.json", items)
    counts = {category: len(items) for category, items in by_category.items()}
    now = datetime.now(timezone.utc).isoformat()
    base.write_json("data/category_counts.json", {
        "updated_at": now,
        "counts": counts,
        "labels": base.CATEGORY_LABELS,
    })

    by_source = {}
    for item in final:
        source = item.get("source") or "Nepoznato"
        by_source[source] = by_source.get(source, 0) + 1
    source_rows.sort(key=lambda row: (
        row.get("status") != "ok",
        -(row.get("count") or 0),
        row.get("name") or "",
    ))
    base.write_json("data/source_stats.json", {
        "updated_at": now,
        "sync_mode": SYNC_MODE,
        "sync_status": sync_status,
        "fresh_items_found": fresh_items,
        "sources": len(feeds),
        "ok_sources": ok,
        "empty_sources": empty,
        "failed_sources": failed,
        "items_by_source": by_source,
        "feed_results": source_rows,
        "fetch_mode": "parallel",
        "workers": worker_count,
        "request_timeout_seconds": REQUEST_TIMEOUT,
    })
    base.write_json("data/generated_at.json", {
        "generated_at": now,
        "sync_mode": SYNC_MODE,
        "sync_status": sync_status,
        "fresh_items_found": fresh_items,
        "sources": len(feeds),
        "ok_sources": ok,
        "empty_sources": empty,
        "failed_sources": failed,
        "news_count": len(final),
        "category_counts": counts,
        "gallery_count": base.GALLERY_LIMIT,
        "fetch_mode": "parallel",
        "workers": worker_count,
        "request_timeout_seconds": REQUEST_TIMEOUT,
    })
    base.build_gallery(final)
    print(
        f"UPDATED PARALLEL: {len(final)} vijesti, galerija {base.GALLERY_LIMIT}, "
        f"svjeze {fresh_items}, izvori OK {ok}/{len(feeds)}, prazni {empty}, "
        f"neuspjeli {failed}, status {sync_status}, radnici {worker_count}, timeout {REQUEST_TIMEOUT}s"
    )


if __name__ == "__main__":
    main()
