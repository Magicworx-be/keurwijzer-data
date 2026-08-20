# Scope of Work — Apify Scraper Automation (n8n)

**For:** Elisha · **Platform:** n8n + Apify

## Goal
I enter a **niche** and a **list of cities**. The automation does the rest and emails me
**two JSON files**.

## Input — Google Sheet (2 columns)

| Column | Content | Example |
|---|---|---|
| `niche` | the trade | `dakwerker` |
| `cities` | cities, comma-separated | `Dendermonde, Lebbeke, Hamme, Zele, Berlare` |

One row = one run.

## What the automation does

1. **Trigger** on a new/edited row in the sheet.
2. **Build search terms:** combine the niche with each city → `"niche city"` (one per city).
3. **Apify Actor 1 — business list** (`compass/crawler-google-places`): run the search terms,
   get a JSON list of businesses. → **File 1: `apify-places.json`**
4. **Extract the business links** from Actor 1's output (each record already contains its Google
   Maps `url` / `placeId`). Remove duplicates.
5. **Apify Actor 2 — reviews** (`compass/google-maps-reviews-scraper`): feed it those links, get
   a JSON of the reviews. → **File 2: `apify-export.json`**
6. **Email me both JSON files** as attachments when the run finishes.

## Output
Two JSON files by email, named exactly:
- `apify-places.json` — the businesses (from Actor 1)
- `apify-export.json` — their reviews (from Actor 2)

## Requirements
- **Apify runs are async** — use Apify **webhooks** back into n8n, not a chain that waits (it
  will time out on big runs).
- **Deduplicate** businesses on `placeId` after step 3, before step 5 (saves scraping cost).
- **`apify-places.json` must include GPS coordinates** (`location.lat` / `location.lng`) per business.
- Basic retries on Apify calls; log per run: cities, businesses found, reviews scraped, cost.

## To decide before building
1. How to name the files (add a `region` column to the sheet, or auto-name by niche + date?).
2. Max results per city search + a per-run cost cap.
