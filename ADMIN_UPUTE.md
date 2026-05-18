# ADMIN UPUTE — WEB VIJESTI

Ovaj dokument služi kao kratki operativni standard za dodavanje novih sadržaja u repozitorij.

## 1. Pravilo imenovanja datoteka

Nazivi datoteka moraju biti tehnički čisti:

- koristiti mala slova
- koristiti crtice umjesto razmaka
- ne koristiti znak `#`
- ne koristiti hrvatske znakove u nazivu datoteke
- ne koristiti zagrade, navodnike ili znakove `?`, `&`, `%`, `+`

Dobro:

```text
symbol-4.pdf
symbol-4.jpg
nova-objava-naslov.html
```

Loše:

```text
Symbol#4.pdf
Symbol 4.pdf
časopis broj 4.pdf
```

## 2. Symbol PDF izdanja

PDF datoteka ide u:

```text
assets/editions/
```

Naslovnica ide u:

```text
assets/editions/covers/
```

Primjer za Symbol #4:

```text
assets/editions/symbol-4.pdf
assets/editions/covers/symbol-4.jpg
```

Zapis se unosi u:

```text
data/editions.json
```

Minimalni zapis:

```json
{
  "id": "symbol-4",
  "title": "Symbol #4",
  "category": "symbol",
  "issue": "4",
  "date": "July 2024",
  "pages": 138,
  "pdf": "assets/editions/symbol-4.pdf",
  "url": "symbol/reader.html?id=symbol-4",
  "status": "published",
  "cover": "assets/editions/covers/symbol-4.jpg"
}
```

## 3. Autorske objave

HTML objave idu u:

```text
objave/
```

Popis objava vodi se u:

```text
data/ai_posts.json
```

Svaka objava treba imati:

- naslov
- sažetak
- autora
- URL
- ključne riječi
- canonical URL

## 4. Ručna događanja

Ručna događanja idu u:

```text
data/manual_events.json
```

Automatski povučena događanja idu u:

```text
data/events_calendar.json
```

Izvori događanja uređuju se u:

```text
data/events_sources.json
```

## 5. Vijesti i izvori

RSS/HTML izvori uređuju se u:

```text
data/feeds.json
```

Statistika izvora generira se u:

```text
data/source_stats.json
data/source_quality.json
```

## 6. SEO datoteke

Automatski se generiraju:

```text
sitemap.xml
sitemap-news.xml
sitemap-posts.xml
sitemap-authors.xml
sitemap-events.xml
urllist.txt
llms.txt
site.webmanifest
data/seo_index.json
```

## 7. Brzo učitavanje početne

Početna stranica koristi manje JSON datoteke:

```text
data/home_news.json
data/home_events.json
data/home_symbol.json
data/home_status.json
```

Ne mijenjati ih ručno, jer ih generira:

```text
generate_home_data.py
```

## 8. Nakon dodavanja datoteka

Nakon dodavanja PDF-a, objave ili izvora, GitHub Actions automatski pokreće update. Ako treba odmah provjeriti, pokrenuti workflow ručno preko GitHub Actions.
