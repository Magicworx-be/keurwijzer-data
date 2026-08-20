# Keurwijzer — variant "Top 10-concept"

Deze map is een **zelfstandige kopie** van het project met één grote wijziging:
de site toont **geen cijfer op 10 meer per bedrijf**, maar een **Top 10** (of
**Top 5** in een dunne regio) als vignet. Je originele project (één map hoger)
is volledig ongemoeid gelaten.

> Alles hier is testbaar zonder je echte project aan te raken. De zware ruwe
> Apify-bestanden (`apify-export.json`, `apify-places.json`) zijn bewust **niet**
> mee gekopieerd; de genormaliseerde `reviews.json` + `beoordeling.json` van
> `dakwerkers-gent` zitten er wél in, zodat `node build.js dakwerkers-gent`
> meteen werkt.

---

## Wat is er veranderd?

### 1. Geen score op 10 → Top 10 / Top 5-medaille
- De ring met een cijfer (7,0–9,5) is vervangen door een **nummerloze groene
  medaille met lauwerkrans**: "TOP" boven het aantal (10 of 5). Rechtsboven op
  de kaart staat een understated **"Geverifieerd"-badge** als trust-cue.
- De medaille is op elke kaart identiek (geen rangnummer meer); de lauwerkrans
  wordt wiskundig gegenereerd in `build.js` (`laurelSVG()`), dus perfect
  symmetrisch en meeschalend met het aantal.
- **De volgorde blijft behouden** (op de gecombineerde beoordeling), zoals je
  vroeg — dus géén alfabetische lijst; de volgorde is zichtbaar via de
  lijstpositie.
- De volledige rekenmethode (Bayes, tijdsweging, 4 dimensies) draait nog steeds
  onder de motorkap; ze bepaalt nu **de selectie en de volgorde**, niet langer
  een gepubliceerd cijfer.

### 2. Dynamisch: Top 10 of Top 5
- Voldoende **eligible** bedrijven → **Top 10**; een dunne regio → **Top 5**.
- De grens ligt op het aantal **eligible** bedrijven, **niet** op het aantal
  ruwe Apify-resultaten. Reden: dat laatste zegt weinig over de echte diepgang
  (een regio kan 200 bedrijven opleveren met 6 echte specialisten, of 40 met 15).
  Dit is bewust anders dan het ">100 Apify → Top 10"-idee — het is eerlijker.
- Instelbaar bovenaan `build.js`: `SMALL_REGION_THRESHOLD = 10`
  (< 10 eligible → Top 5), `LISTED_FULL = 10`, `LISTED_SMALL = 5`.
- Bij minder dan 5 eligible wordt het netjes "Top 3" e.d. (nooit meer tonen dan
  er zijn).

### 3. 11–20 en niet-eligible: niet meer op de site
- De inklapbare blokken "ook opgenomen (11–20)" en "wachtlijst" zijn **van de
  pagina verwijderd**. De site toont enkel de Top N.
- Ze blijven wél in het **controlerapport**, en komen in een **nieuw
  prospectiedocument**.

### 4. Nieuw: prospectiedocument voor dasslim.be
- `build.js` schrijft nu ook `output/<niche>/<slug>-prospectie-dasslim.md`.
- **Sectie A** = plek 11–20 (warme leads, eligible, net buiten de Top N) met
  gemeente, website, Google-cijfers, interne kwaliteitsindex, specialiteiten en
  synthese — plus een kant-en-klare openingszin.
- **Sectie B** = nog-niet-eligible bedrijven (langeretermijnprospects) met de
  reden waarom ze nog niet opgenomen zijn.
- Dit bestand is **intern** — het staat bovenaan gemarkeerd als "niet publiceren".

### 5. Teksten aangepast (site + homepage)
Overal waar "score op 10" / "Keurwijzer-score" / "gerangschikt op score" stond,
is dat vervangen door de nieuwe taal ("selectie en volgorde", "Top 10", "geen
cijfer op 10"). Aangepast in: `template.html`, `homepage.html`
(incl. de zichtbare FAQ én de JSON-LD, die gelijk lopen), de methodiek-uitleg,
het samenvattingsblok, de footer-transparantietekst en een **nieuwe FAQ**
"Waarom tonen jullie geen score op 10 per bedrijf?".

### 6. Prompt: één belangrijke toevoeging
In `prompts/scoring-prompt.md` staat nu expliciet dat `beoordeling.json`
**één keer gemaakt en dan bevroren** wordt. Dat is de echte oplossing voor de
fluctuatie die je opmerkte: zolang `beoordeling.json` + `reviews.json` gelijk
blijven, geeft `build.js` altijd exact dezelfde Top 10. Draai de LLM-stap dus
niet lichtvaardig opnieuw.

---

## Wat is NIET veranderd
- De rekenmethode, gewichten en drempels (35/30/15/20, halveringstijd 2 jaar,
  Bayes M=16, ≥10 reviews, ≥3 recent).
- `scripts/normalize.js` en `scripts/maak-testdata.js` (raken geen gepubliceerde
  score aan).
- De data zelf.

---

## Zelf testen
```bash
cd top10-concept
node build.js dakwerkers-gent
```
Bekijk daarna:
- `output/dakwerkers/dakwerkers-gent.html` — de pagina (Top 10, geen cijfer)
- `output/dakwerkers/dakwerkers-gent-rapport.txt` — controlerapport
- `output/dakwerkers/dakwerkers-gent-prospectie-dasslim.md` — prospectielijst

De Top 5-tak testen (dunne regio) kan met een eigen kleine config, of met de
synthetische testdata via een beperkte gemeentelijst.

---

## Navigatie-architectuur (niche × regio) — nieuw

De site is een matrix van **niche × regio**. De navigatie is een hub-and-spoke
opzet die automatisch meegroeit (doel: 1000+ pagina's) en volledig uit de
configs wordt gegenereerd — geen enkele link wordt handmatig onderhouden.

### URL-schema (detailpagina's bewust plat in de root)
| Type | URL | Bestand |
|---|---|---|
| Homepage | `/` | `output/index.html` |
| Niche-hub | `/dakwerkers/` | `output/dakwerkers/index.html` |
| Regio-hub | `/regio/gent/` | `output/regio/gent/index.html` |
| Detailpagina | `/dakwerkers-gent/` | `output/dakwerkers-gent/index.html` |

`output/` spiegelt nu **exact** de live-URL-structuur → upload je 1-op-1 naar de
root. Folder-diepte is geen rankingfactor; de silo ontstaat door de interne
links, niet door de mappen.

### Interne rapporten verhuisd
`…-rapport.txt` en `…-prospectie-dasslim.md` staan nu in **`reports/<slug>/`**
(buiten `output/`) — die map upload je bewust **niet**. Vroeger stonden ze in
`output/` en waren ze dus publiek opvraagbaar.

### Bouwstenen
- `lib/registry.js` — leest alle `config/<niche>/*.json` en is de enige bron voor
  hubs, kruislinks, broodkruimels en sitemap. Naburige regio's worden afgeleid
  uit gedeelde gemeenten (grensoverlap) + provincie.
- `hub.html` — template voor zowel niche- als regio-hubs.
- `build-site.js` — genereert de hubs, `output/index.html` (uit `homepage.html`,
  met `{{REGIO_INDEX}}`) en `output/sitemap.xml`.
- `template.html` — detailpagina, nu met broodkruimel (zichtbaar + `BreadcrumbList`)
  en een "Verder kijken"-blok (naburige regio's + andere vakgebieden in de regio).

### Buildflow
```bash
node build.js dakwerkers-gent        # snel: één detailpagina (her)bouwen
node build-site.js                   # enkel hubs + homepage + sitemap
node build-all.js                    # ALLES herbouwen + consistentiecheck  ← gebruik dit
```

**Waarom `build-all.js` het veiligste is:** de kruislinks (naburige regio's,
andere vakgebieden) zitten gebakken in élke detailpagina. `build-site.js` alleen
vernieuwt die niet — een bestaande buurpagina blijft dan naar de oude situatie
wijzen. `build-all.js` herbouwt alle detailpagina's + hubs + homepage + sitemap,
**ruimt weespagina's op** (output die niet meer bij een config hoort) en toont
op het einde een **"in GHL bijwerken"-lijst**: welke pagina's nieuw, gewijzigd
of verwijderd zijn. Alleen díe hoef je in GHL aan te passen.

**Een niche/regio toevoegen:**
1. `config/<niche>/<slug>.json` + `data/<slug>/{reviews,beoordeling}.json` aanmaken.
2. `node build-all.js` draaien.
3. In GHL enkel de pagina's uit de "bijwerken"-lijst aanpassen.

De nieuwe pagina verschijnt daarna automatisch in de hubs, in de homepage-regio-
index en in de sitemap.

### Detailpagina's zijn "write-once" (belangrijk voor het werk)
Detailpagina's linken **niet** naar hun zusterpagina's, maar enkel naar hun twee
hubs (`/niche/` en `/regio/kern/`). Die hub-links hangen alleen af van de eigen
niche/regio van de pagina. Gevolg: **een detailpagina verandert nooit wanneer je
elders een regio of niche toevoegt** — je hoeft ze dus niet te heruploaden. Ze
wijzigen enkel als hun éígen reviewdata verandert. De actuele lijst van
zusterpagina's staat op de hubs (die je toch al bijwerkt, en dat zijn er weinig).

Wat er dus verandert bij een toevoeging (nooit de honderden detailpagina's):
- **Nieuwe regio in een niche** → nieuw: detail + regio-hub · bijwerken: niche-hub, homepage, sitemap.
- **Nieuwe niche in een regio** → nieuw: detail + niche-hub · bijwerken: regio-hub, sitemap (homepage handmatig).

> GHL publiceert niet vanzelf: de build maakt de HTML, maar het overzetten naar
> GHL blijft handwerk. De "bijwerken"-lijst vertelt je precies wélke pagina's.

### GHL-plakhelper (`ghl/`)
Na `build-all.js` staat in **`ghl/`**:
- `_METADATA-overzicht.txt` → de SEO-velden (Path, title, meta-description, canonical,
  OG-titel/-beschrijving/-afbeelding) van **álle** live pagina's — altijd actueel,
  ook na een no-op build. Handig naslag terwijl je in GHL werkt.
- per pagina die je moet aan-/bijwerken een **mapje** met drie kant-en-klare bestanden:
  - `SEO-velden.txt` → in de **SEO-tab** van de pagina (title/description/canonical/OG)
  - `header-code.html` → in de **Header/Tracking-code** (JSON-LD schema)
  - `body.html` → in **één Custom HTML/Code-element** (bevat ook de CSS + fonts)

Belangrijk: title/description/canonical **moeten** in de SEO-tab — in de body leest
GHL ze niet (getest op de live site: die stonden in de body en werden genegeerd).
JSON-LD mag wél in de body. `ghl/` wordt bij elke `build-all` opnieuw opgebouwd en is
een **werkmap — niet uploaden** (net als `reports/`).

### robots.txt + sitemap.xml
`build-site.js`/`build-all.js` schrijven `output/robots.txt` (verwijst naar de
sitemap) en `output/sitemap.xml`. Let op: GHL beheert soms zelf robots/sitemap —
controleer of je deze losse bestanden op de root kan hosten; zo niet, gebruik
GHL's eigen sitemap-instelling.

> Aandachtspunt (nog te beslissen): kies sitebreed **mét of zonder `www`**.
> Canonicals gebruiken nu `https://keurwijzer.be` (zonder www); één plek in het
> `WebSite`-schema van `template.html` staat nog op `www`.

## Designdetails die je makkelijk kan bijstellen
- **Grafisch element:** nu een lauwerkrans. Wil je iets anders (ster, zegel-rand,
  lint), dan pas je `laurelSVG()` in `build.js` aan.
- **Kleur/afmeting medaille:** in `template.html` onder `.seal` (gradient,
  grootte, schaduw) en de responsive varianten.
- **"Geverifieerd"-badge:** in `articleHTML` (`build.js`); weglaten of hernoemen
  kan in één regel.
