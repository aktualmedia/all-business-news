#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Paralelna dopuna rubrika portala WEB VIJESTI.

Zamjenjuje višestruke serijske prolaze dodatnih izvora. Pojedinačni nedostupni
izvor bilježi se kao neuspješan, ali ne ruši cijeli ciklus ažuriranja.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
from pathlib import Path

import fill_symbol_quorum_en as symbol
import fill_premium_categories as premium
import fill_core_business_science as core
import fill_missing_core_categories as missing

ROOT = Path(__file__).resolve().parent
MAX_WORKERS = 18
MAX_PER_CATEGORY = 1000
NEWS_LIMIT_BEFORE_POSTPROCESS = 3500

LABELS = {
    "poslovanje": "POSLOVANJE", "ekonomija": "EKONOMIJA", "financije": "FINANCIJE",
    "trzista": "TRŽIŠTA", "kultura": "KULTURA", "dizajn": "DIZAJN",
    "tehnologija": "TEHNOLOGIJA", "znanost": "ZNANOST", "lifestyle": "LIFESTYLE",
    "hedonizam": "HEDONIZAM", "satovi": "SATOVI", "nakit": "NAKIT",
    "pica": "PIĆA", "hrana": "HRANA", "vijesti": "VIJESTI"
}


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


def dedupe(items):
    output, seen = [], set()
    for item in items:
        if not isinstance(item, dict):
            continue
        key = item.get("url") or item.get("id") or item.get("title")
        if not key or key in seen:
            continue
        seen.add(key)
        output.append(item)
    return output


def tasks():
    jobs = []
    for category, source_name, url in symbol.SOURCES:
        jobs.append(("symbol-en", category, source_name, url))
    for category, source_name, url in premium.SOURCES:
        jobs.append(("premium", category, source_name, url))
    for category, source_name, url in core.SOURCES:
        jobs.append(("core", category, source_name, url))
    for category, source_name, url in missing.SOURCES:
        jobs.append(("missing", category, source_name, url))
    return jobs


def fetch_task(job):
    kind, category, source_name, url = job
    row = {"name": source_name, "category": category, "url": url, "kind": kind, "status": "failed", "count": 0}
    try:
        if kind == "symbol-en":
            items = symbol.parse_page(category, source_name, url, symbol.fetch(url))
        elif kind == "premium":
            items = premium.parse_feed(category, source_name, url, premium.fetch(url))
        elif kind == "core":
            items = core.parse_feed(category, source_name, core.fetch(url))
        else:
            items = missing.parse_feed(category, source_name, url, missing.fetch(url))
        row["count"] = len(items)
        row["status"] = "ok" if items else "empty"
        return items, row
    except Exception as exc:
        row["error"] = str(exc)[:160]
        return [], row


def main():
    # Kraći timeouti su sigurniji za satni agregator; prethodni valjani sadržaj ostaje sačuvan.
    symbol.TIMEOUT = 8
    premium.TIMEOUT = 8
    core.TIMEOUT = 8
    missing.TIMEOUT = 8

    jobs = tasks()
    by_category = {category: read_json(f"data/category_news/{category}.json", []) for category in LABELS}
    old_news = read_json("data/news.json", [])
    source_rows = []
    fetched_items = []

    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(jobs))) as executor:
        futures = [executor.submit(fetch_task, job) for job in jobs]
        for future in as_completed(futures):
            items, row = future.result()
            source_rows.append(row)
            fetched_items.extend(items)

    for item in fetched_items:
        category = item.get("category") if item.get("category") in LABELS else "vijesti"
        by_category.setdefault(category, []).insert(0, item)

    for category in LABELS:
        by_category[category] = dedupe(by_category.get(category, []))[:MAX_PER_CATEGORY]
        write_json(f"data/category_news/{category}.json", by_category[category])

    merged = dedupe(fetched_items + old_news)
    merged.sort(key=lambda item: str(item.get("published_at") or item.get("fetched_at") or ""), reverse=True)
    write_json("data/news.json", merged[:NEWS_LIMIT_BEFORE_POSTPROCESS])

    now = datetime.now(timezone.utc).isoformat()
    counts = read_json("data/category_counts.json", {"counts": {}, "labels": {}})
    counts.setdefault("counts", {})
    counts.setdefault("labels", {})
    for category in LABELS:
        counts["counts"][category] = len(by_category[category])
        counts["labels"][category] = LABELS[category]
    counts["updated_at"] = now
    write_json("data/category_counts.json", counts)

    stats = read_json("data/source_stats.json", {})
    if not isinstance(stats, dict):
        stats = {}
    existing = [row for row in stats.get("feed_results", []) if str(row.get("kind", "")) not in {"symbol-en", "premium", "core", "missing"}]
    source_rows.sort(key=lambda row: (row.get("status") != "ok", -(row.get("count") or 0), row.get("name") or ""))
    stats["feed_results"] = existing + source_rows
    stats["updated_at"] = now
    stats["parallel_category_fill"] = True
    stats["category_fill_sources"] = len(jobs)
    stats["category_fill_ok"] = sum(1 for row in source_rows if row.get("status") == "ok")
    stats["category_fill_failed"] = sum(1 for row in source_rows if row.get("status") == "failed")
    write_json("data/source_stats.json", stats)

    print(
        "PARALLEL CATEGORY FILL:", len(jobs), "izvora,",
        stats["category_fill_ok"], "OK,", stats["category_fill_failed"], "neuspješno,",
        len(fetched_items), "novih zapisa"
    )


if __name__ == "__main__":
    main()
