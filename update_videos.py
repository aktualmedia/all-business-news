#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dnevno ažuriranje YouTube previewa bez API ključa.

Generira:
- data/videos.json
- data/home_videos.json
- data/video_status.json

Skripta pokušava pročitati javne YouTube rezultate pretrage za odabrane teme.
Ako YouTube ne vrati dovoljno rezultata, zadržava stare zapise i dodaje sigurne
fallback kartice koje vode na YouTube pretragu po kategoriji.
"""
from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
UA = "Mozilla/5.0 (compatible; WEB-VIJESTI-VideoPreview/1.0; +https://aktualmedia.github.io/all-business-news/)"
TIMEOUT = 15
MAX_PER_CATEGORY = 12
HOME_PER_CATEGORY = 3

VIDEO_QUERIES = [
    ("hedonizam", "luxury lifestyle travel hotels fine dining"),
    ("kultura", "culture art festival theatre exhibition"),
    ("muzeji", "museum exhibition gallery art tour"),
    ("vina", "wine sommelier vineyard winery documentary"),
    ("hrana", "fine dining restaurant gastronomy chef food culture"),
    ("pica", "cocktails spirits bar culture premium drinks"),
    ("satovi", "luxury watches horology collectors design"),
    ("nakit", "high jewelry gemstones luxury craftsmanship"),
    ("dizajn", "design architecture interiors Dezeen"),
    ("tehnologija", "technology artificial intelligence innovation documentary"),
    ("poslovanje", "business markets entrepreneurship Bloomberg"),
    ("ekonomija", "economy financial times business news"),
    ("financije", "finance markets CNBC investing"),
    ("znanost", "science NASA TED technology"),
]

CATEGORY_LABELS = {
    "hedonizam": "HEDONIZAM", "kultura": "KULTURA", "muzeji": "MUZEJI", "vina": "VINA",
    "hrana": "HRANA", "pica": "PIĆA", "satovi": "SATOVI", "nakit": "NAKIT", "dizajn": "DIZAJN",
    "tehnologija": "TEHNOLOGIJA", "poslovanje": "POSLOVANJE", "ekonomija": "EKONOMIJA",
    "financije": "FINANCIJE", "znanost": "ZNANOST",
}

FALLBACK_DESCRIPTIONS = {
    "hedonizam": "Odabrani YouTube pregled za hedonizam, luksuz, putovanja, hotele, restorane i lifestyle.",
    "kultura": "Video pregled kulturnih tema, umjetnosti, kazališta, festivala i suvremene scene.",
    "muzeji": "Pregled muzejskih izložbi, galerija, kustoskih priča i kulturnih institucija.",
    "vina": "Video pregled vina, vinarija, sommelier kulture i enogastronomije.",
    "hrana": "Gastronomija, restorani, chefovi, kuhinje svijeta i premium food priče.",
    "pica": "Pića, kokteli, premium bar scena i kultura posluživanja.",
    "satovi": "Horologija, luksuzni satovi, kolekcionarstvo i dizajnerski detalji.",
    "nakit": "Nakit, dragulji, haute joaillerie i majstorstvo izrade.",
}


def read_json(path: str, default):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: str, obj):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "hr,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode("utf-8", "ignore")


def youtube_search_url(query: str) -> str:
    # sp=CAISAhAB pokušava dati svježije video rezultate; ako YouTube promijeni format, fallback ostaje aktivan.
    return "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(query) + "&sp=CAISAhAB"


def extract_video_ids(raw: str) -> list[str]:
    ids = []
    for vid in re.findall(r'"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"', raw):
        if vid not in ids:
            ids.append(vid)
    return ids[:10]


def oembed(video_id: str) -> dict:
    url = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote("https://www.youtube.com/watch?v=" + video_id, safe="")
    try:
        data = json.loads(fetch_text(url))
        return {"title": html.unescape(data.get("title") or "YouTube video"), "source": data.get("author_name") or "YouTube"}
    except Exception:
        return {"title": "YouTube video preview", "source": "YouTube"}


def fallback_item(category: str, query: str) -> dict:
    label = CATEGORY_LABELS.get(category, category.upper())
    title_map = {
        "hedonizam": "Hedonizam, luksuzni životni stil i premium putovanja",
        "kultura": "Kultura, umjetnost i suvremena scena",
        "muzeji": "Muzeji, izložbe i svjetske galerije",
        "vina": "Vina, vinarije i sommelier kultura",
        "hrana": "Hrana, restorani i gastronomija",
        "pica": "Pića, kokteli i premium bar kultura",
        "satovi": "Satovi, kolekcionarstvo i luksuzni dizajn",
        "nakit": "Nakit, dragulji i visoka izrada",
    }
    return {
        "category": category,
        "title": title_map.get(category, f"{label} video pregled"),
        "source": "YouTube Search",
        "url": "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(query),
        "video_id": "",
        "thumbnail": f"https://picsum.photos/seed/wv-video-{category}/1200/675",
        "published": datetime.now(timezone.utc).isoformat(),
        "description": FALLBACK_DESCRIPTIONS.get(category, f"Dnevni YouTube pregled za kategoriju {label}.")
    }


def collect_category(category: str, query: str) -> list[dict]:
    out = []
    try:
        raw = fetch_text(youtube_search_url(query))
        for video_id in extract_video_ids(raw):
            meta = oembed(video_id)
            out.append({
                "category": category,
                "title": meta["title"],
                "source": meta["source"],
                "url": "https://www.youtube.com/watch?v=" + video_id,
                "video_id": video_id,
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "published": datetime.now(timezone.utc).isoformat(),
                "description": "Dnevno ažurirani YouTube video preview za WEB VIJESTI."
            })
            if len(out) >= MAX_PER_CATEGORY:
                break
            time.sleep(0.15)
    except Exception:
        out = []
    return out


def normalize_old_items(items: list[dict]) -> list[dict]:
    out = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        if not item.get("category") or not item.get("title") or not item.get("url"):
            continue
        out.append(item)
    return out


def main():
    old = normalize_old_items(read_json("data/videos.json", []))
    old_by_cat = {}
    for item in old:
        old_by_cat.setdefault(item.get("category"), []).append(item)

    final = []
    status = {"updated_at": datetime.now(timezone.utc).isoformat(), "categories": {}, "mode": "youtube-search-with-fallback"}
    seen = set()

    for category, query in VIDEO_QUERIES:
        fresh = collect_category(category, query)
        pool = fresh + old_by_cat.get(category, []) + [fallback_item(category, query)]
        selected = []
        for item in pool:
            key = item.get("video_id") or item.get("url") or item.get("title")
            if not key or key in seen:
                continue
            seen.add(key)
            selected.append(item)
            if len(selected) >= MAX_PER_CATEGORY:
                break
        final.extend(selected)
        status["categories"][category] = {"fresh": len(fresh), "selected": len(selected)}
        time.sleep(0.25)

    # Home feed: prvo premium/lifestyle kategorije, zatim poslovno-tehnološke.
    home = []
    home_order = ["hedonizam", "kultura", "muzeji", "vina", "hrana", "pica", "satovi", "nakit", "dizajn", "poslovanje", "ekonomija", "financije", "tehnologija", "znanost"]
    for category in home_order:
        cat_items = [x for x in final if x.get("category") == category][:HOME_PER_CATEGORY]
        home.extend(cat_items)

    write_json("data/videos.json", final[:180])
    write_json("data/home_videos.json", home[:42])
    write_json("data/video_status.json", status)
    print(f"VIDEOS OK: {len(final[:180])} total, {len(home[:42])} home")


if __name__ == "__main__":
    main()
