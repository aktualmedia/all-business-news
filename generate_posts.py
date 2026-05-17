#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Automatske uredničke objave za WEB VIJESTI.

Generira do 3 objave dnevno na teme ekonomije, businessa, poduzetništva,
tržišta, kapitala, produktivnosti i globalnih trendova.
"""
from __future__ import annotations

import json
import re
import html
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OBJAVE = ROOT / "objave"
AUTHOR = "Nermin Sefić"
BASE = "https://aktualmedia.github.io/all-business-news/"
MAX_DAILY = 3

TOPICS = [
    {
        "slug": "ekonomija-i-cijena-vremena",
        "title": "Ekonomija i cijena vremena: zašto brzina odluke postaje nova valuta",
        "category": "ekonomija",
        "summary": "U poslovanju se sve češće pokazuje da vrijeme nije samo operativni trošak nego strateška imovina. Tko sporije odlučuje, skuplje plaća promjenu.",
        "body": [
            "U ekonomiji se obično govori o kapitalu, marži, kamati i riziku. Međutim, u stvarnom poslovanju sve više vrijedi još jedna mjera: vrijeme potrebno da se odluka donese i provede.",
            "Poduzetnik koji brzo prepoznaje promjenu ne mora uvijek imati veći kapital od konkurencije. Dovoljno je da ranije vidi smjer, ranije prilagodi trošak i ranije promijeni ponudu. U takvom okruženju brzina nije površnost, nego oblik discipline.",
            "Najskuplje odluke često nisu one koje su donesene pogrešno, nego one koje su odgađane dok je tržište već otišlo dalje. Zato moderna tvrtka mora imati jednostavne podatke, jasnu odgovornost i mogućnost da se promjena provede bez velikog unutarnjeg otpora.",
            "To vrijedi za male poduzetnike jednako kao i za velike sustave. U svijetu u kojem se cijena novca, energenata, rada i tehnologije brzo mijenja, statično poslovanje postaje prikriveni rizik. Tko ne računa vrijeme, zapravo ne računa ukupni trošak odluke."
        ],
        "keywords": ["ekonomija", "poduzetništvo", "poslovne odluke", "vrijeme", "kapital", "rizik"]
    },
    {
        "slug": "business-u-svijetu-manjih-marzi",
        "title": "Business u svijetu manjih marži: vrijednost se više ne dokazuje samo prometom",
        "category": "business",
        "summary": "Velik promet više nije dovoljan argument. Investitori, banke i partneri sve više gledaju kvalitetu prihoda, stabilnost troška i sposobnost prilagodbe.",
        "body": [
            "Dugo se u javnosti poslovni uspjeh najlakše mjerio prometom. Veći prihod značio je veću vidljivost, a veća vidljivost često se tumačila kao veća sigurnost. Danas to više nije dovoljno.",
            "U svijetu skupljeg financiranja i opreznijeg kapitala pitanje nije samo koliko tvrtka prodaje, nego koliko je taj prihod održiv. Ako rast prometa dolazi uz slabu kontrolu troškova, ovisnost o jednom kupcu ili prevelik operativni pritisak, tržište to više ne nagrađuje automatski.",
            "Zato se vrijednost sve više traži u strukturi: u kvaliteti ugovora, naplativosti, ponovljivosti prihoda, digitalnoj imovini, brendu, sposobnosti upravljanja rizikom i brzini kojom se model može prilagoditi.",
            "Poduzetništvo u takvom okruženju traži manje improvizacije, a više sustava. Dobar business više nije samo onaj koji brzo raste, nego onaj koji zna objasniti zašto taj rast može izdržati pritisak tržišta."
        ],
        "keywords": ["business", "marže", "prihodi", "troškovi", "investitori", "poduzetništvo"]
    },
    {
        "slug": "poduzetnistvo-i-globalna-neizvjesnost",
        "title": "Poduzetništvo u globalnoj neizvjesnosti: zašto mala tvrtka mora misliti međunarodno",
        "category": "poduzetništvo",
        "summary": "Granice tržišta više nisu iste kao administrativne granice države. I mala tvrtka mora razumjeti globalne cijene, dobavne lance i digitalne kanale prodaje.",
        "body": [
            "Mala tvrtka danas ne posluje samo u svom gradu ili državi, čak i kada joj se to na prvi pogled čini. Cijena opreme, softvera, oglašavanja, energije i rada često se formira globalno.",
            "Zato poduzetnik mora razumjeti širu sliku. Ako se promijeni cijena kapitala u SAD-u, ako Europa mijenja regulativu ili ako se poremeti dobavni lanac u Aziji, posljedice se mogu osjetiti i u lokalnom poslovanju.",
            "Istodobno, digitalni kanali omogućuju da mala tvrtka dođe do kupca izvan svog neposrednog okruženja. To ne znači da svatko mora izvoziti, ali znači da se vrijednost proizvoda i usluge sve više uspoređuje s globalnim standardom.",
            "Prednost malih sustava može biti brzina. Nemaju složenu hijerarhiju i mogu brzo testirati novu ideju. No ta prednost postoji samo ako vlasnik ima podatke, jasnu ponudu i spremnost da poslovanje ne promatra lokalno, nego tržišno."
        ],
        "keywords": ["poduzetništvo", "globalno tržište", "mala tvrtka", "digitalni kanali", "izvoz", "strategija"]
    },
    {
        "slug": "kapital-i-povjerenje",
        "title": "Kapital prati povjerenje: zašto su transparentnost i ritam objave važni za poslovanje",
        "category": "financije",
        "summary": "Tržište lakše razumije tvrtku koja redovito i jasno komunicira. Transparentnost ne znači otkrivanje svega, nego dosljedno objašnjavanje bitnog.",
        "body": [
            "Kapital rijetko dolazi samo zato što postoji dobra ideja. On traži povjerenje. A povjerenje se ne gradi jednom objavom, nego ritmom, dosljednošću i sposobnošću da se složene stvari objasne jednostavno.",
            "U poslovnom svijetu transparentnost ne znači da se svaka interna odluka mora iznijeti javno. Ona znači da se partnerima, tržištu i javnosti jasno pokaže što je poslovni model, odakle dolazi prihod, koji su rizici i kako se njima upravlja.",
            "Tvrtke koje komuniciraju samo kada moraju često ostavljaju prostor za tuđa tumačenja. Tvrtke koje komuniciraju redovito lakše grade okvir u kojem se njihovo poslovanje razumije. To je posebno važno kod brzorastućih sustava i novih digitalnih modela.",
            "Zato objave, analize i javno dostupni materijali nisu samo PR. Oni su dio poslovne infrastrukture. U ekonomiji povjerenja, način na koji se poslovanje objašnjava postaje gotovo jednako važan kao i brojke koje ga prate."
        ],
        "keywords": ["kapital", "povjerenje", "transparentnost", "poslovna komunikacija", "investitori", "financije"]
    },
    {
        "slug": "svjetska-ekonomija-i-lokalni-poduzetnik",
        "title": "Svjetska ekonomija i lokalni poduzetnik: veza je bliža nego što izgleda",
        "category": "ekonomija",
        "summary": "Lokalni poduzetnik sve teže može ignorirati globalne trendove. Cijene, kamate, valuta, tehnologija i potrošačke navike prelijevaju se brže nego prije.",
        "body": [
            "Nekada je lokalno poslovanje moglo funkcionirati s relativno malo interesa za globalna tržišta. Danas je ta udaljenost gotovo nestala. Promjena kamatnih stopa, cijena energenata ili tehnološkog standarda brzo se prelije u svakodnevne odluke.",
            "Poduzetnik koji kupuje opremu, koristi softver, oglašava se online ili zapošljava stručne ljude već je dio šire ekonomije. Čak i ako prodaje lokalno, njegovi troškovi i konkurencija često nisu lokalni.",
            "Zato je važno pratiti širi kontekst, ali ga prevoditi na praktične odluke. Nije cilj da svaki poduzetnik postane makroekonomist. Cilj je da razumije kako globalni trend može promijeniti njegovu cijenu, rok, maržu ili potražnju.",
            "Najbolji poslovni modeli nisu oni koji znaju sve predvidjeti, nego oni koji se mogu brzo prilagoditi kada se uvjeti promijene. U tome je razlika između preživljavanja i razvoja."
        ],
        "keywords": ["svjetska ekonomija", "lokalni poduzetnik", "kamate", "inflacija", "tržište", "strategija"]
    }
]


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


def slugify(text):
    repl = str.maketrans("čćšžđČĆŠŽĐ", "ccszdCCSZD")
    text = str(text or "").translate(repl).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:90] or "objava"


def esc(s):
    return html.escape(str(s or ""), quote=True)


def post_url(slug):
    return f"objave/{slug}.html"


def build_post(topic, index):
    now = datetime.now(timezone.utc)
    date = now.date().isoformat()
    slug = f"{date}-{topic['slug']}-{index}"
    return {
        "id": slug,
        "title": topic["title"],
        "author": AUTHOR,
        "summary": topic["summary"],
        "body": "\n\n".join(topic["body"]),
        "category": topic["category"],
        "keywords": topic["keywords"],
        "created_at": now.isoformat(),
        "url": post_url(slug),
        "local_url": post_url(slug),
        "seo_title": topic["title"] + " | Objave | WEB VIJESTI",
        "seo_description": topic["summary"][:155],
        "canonical": BASE + post_url(slug),
        "image": "https://picsum.photos/seed/objave-" + slugify(topic["category"]) + "/1400/900"
    }


def layout(title, description, body, canonical):
    return f'''<!doctype html>
<html lang="hr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{esc(canonical)}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="WEB VIJESTI / All Business News">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../assets/style.css">
  <style>.objave-article{{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:24px;padding:22px;box-shadow:0 14px 38px rgba(15,23,42,.06)}}.objave-article p{{font-size:1.06rem;line-height:1.75}}.objave-meta{{color:#64748b;font-weight:900;text-transform:uppercase;font-size:.78rem}}.objave-tags{{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}}.objave-tags span{{background:#eef2ff;color:#1f3c88;border-radius:999px;padding:7px 10px;font-weight:900;font-size:.75rem;text-transform:uppercase}}.share-mini{{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:18px}}.share-mini a{{display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 9px;border:1px solid var(--line,#dbe3ef);border-radius:999px;background:#fff;color:#1f3c88;text-decoration:none;font-size:.72rem;font-weight:900}}</style>
</head>
<body>
<header class="site-header"><a class="brand" href="../index.html"><span class="brand-mark">WV</span><span><strong>WEB VIJESTI</strong><small>AKTUAL MEDIA D.O.O.</small></span></a><nav class="top-nav"><a href="../index.html">HOME</a><a href="../vijesti/index.html">VIJESTI</a><a href="../objave/index.html">OBJAVE</a><a href="../galerija/index.html">GALERIJA</a><a href="../radio/index.html">RADIO</a><a href="../admin/index.html">ADMIN</a></nav></header>
<main class="page-shell">{body}</main>
<nav class="mobile-bottom-nav"><a href="../index.html">HOME</a><a href="../vijesti/index.html">VIJESTI</a><a href="../objave/index.html">OBJAVE</a><a href="../galerija/index.html">GALERIJA</a></nav>
<footer class="site-footer"><p><strong>WEB VIJESTI / ALL BUSINESS NEWS</strong></p></footer>
</body>
</html>'''


def share(title, url):
    return f'''<div class="share-mini"><strong>DIJELI</strong><a target="_blank" href="https://wa.me/?text={esc(title)}%20{esc(url)}">WHATSAPP</a><a target="_blank" href="https://twitter.com/intent/tweet?text={esc(title)}&url={esc(url)}">X</a><a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u={esc(url)}">FACEBOOK</a><a target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url={esc(url)}">LINKEDIN</a></div>'''


def write_pages(posts):
    OBJAVE.mkdir(exist_ok=True)
    cards = []
    for p in posts:
        url = p.get("local_url") or p.get("url") or "objave/index.html"
        if not url.startswith("objave/") or url.endswith("index.html"):
            continue
        paragraphs = "".join(f"<p>{esc(x)}</p>" for x in str(p.get("body", "")).split("\n\n") if x.strip())
        tags = "".join(f"<span>{esc(k)}</span>" for k in p.get("keywords", [])[:8])
        article = f'''<a class="home-button" href="../objave/index.html">OBJAVE – POVRATAK</a><article class="objave-article"><p class="objave-meta">OBJAVE · Autor: {esc(p.get('author', AUTHOR))} · {esc(p.get('category','business'))}</p><h1>{esc(p.get('title'))}</h1><p><strong>{esc(p.get('summary'))}</strong></p>{paragraphs}<div class="objave-tags">{tags}</div>{share(p.get('title'), BASE + url)}</article>'''
        (ROOT / url).write_text(layout(p.get("seo_title") or p.get("title"), p.get("seo_description") or p.get("summary"), article, BASE + url), encoding="utf-8")
        cards.append(f'''<article class="post-card"><div class="card-body"><p class="meta">OBJAVE · Autor: {esc(p.get('author', AUTHOR))}</p><h3><a href="../{esc(url)}">{esc(p.get('title'))}</a></h3><p>{esc(p.get('summary'))}</p><a class="button small" href="../{esc(url)}">PROČITAJ</a></div></article>''')
    index_body = f'''<section class="hero compact"><p class="eyebrow">OBJAVE</p><h1>OBJAVE</h1><p class="lead">Autorski tekstovi o ekonomiji, businessu, poduzetništvu, tržištima, kapitalu i globalnim poslovnim trendovima. Autor tekstova: Nermin Sefić.</p></section><section class="news-grid">{''.join(cards)}</section>'''
    (OBJAVE / "index.html").write_text(layout("Objave | WEB VIJESTI", "Autorski tekstovi o ekonomiji, businessu, poduzetništvu i globalnim tržištima.", index_body, BASE + "objave/"), encoding="utf-8")


def main():
    posts = read_json("data/ai_posts.json", [])
    if not isinstance(posts, list):
        posts = []
    today = datetime.now(timezone.utc).date().isoformat()
    today_count = sum(1 for p in posts if str(p.get("created_at", "")).startswith(today) and p.get("auto_generated"))
    if today_count < MAX_DAILY:
        existing_titles = {p.get("title") for p in posts}
        for topic in TOPICS:
            if topic["title"] not in existing_titles:
                posts.insert(0, build_post(topic, today_count + 1))
                break
    posts = posts[:120]
    write_json("data/ai_posts.json", posts)
    write_pages(posts)
    print(f"OBJAVE OK: {len(posts)} tekstova")

if __name__ == "__main__":
    main()
