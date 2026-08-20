# Werkproces — nieuwe Keurwijzer directory-pagina (niche × regio)

Dit is het **volledige, canonieke werkproces** om één nieuwe directory-pagina te
bouwen voor niche **{{NICHE}}** in **regio {{REGIO}}**, slug `{{SLUG}}`. Werk exact
zoals bij de bestaande dakwerkers-pagina's (Gent, Aalst, Meetjesland, Dendermonde).

**Sla geen stap over, raad nooit, en stop en vraag bij elke twijfel.** Volg de
fasen in volgorde. Lees ook `METHODIEK.md` (de leesbare uitleg van selectie en
ranking) en `prompts/scoring-prompt.md` (de rubrieken voor de LLM-beoordeling).

## Vaste projectregels (niet opnieuw ter discussie stellen)
- **URL-structuur:** detailpagina's plat in de root (`/{{SLUG}}/`), hubs in mappen. Niet nesten.
- **Registry-gedreven:** alle navigatie/hubs/sitemap komen uit de configs via `lib/registry.js`. Het veilige eindcommando is altijd `node build-all.js`.
- **Deterministisch:** de LLM beoordeelt alleen tekst. Alle rekenwerk (Bayes, tijdsweging, selectie, Top 10/Top 5, volgorde) doet `build.js`. Vraag/geef nooit zelf een eindscore of ranking.
- **Zelfde data = zelfde resultaat:** `beoordeling.json` wordt één keer gemaakt en dan bevroren.

---

## Fase 0 — Pre-check + niche vaststellen

### 0a. Dekkingscheck (wat hebben we al, wat ontbreekt?)
Draai eerst dit overzicht en bepaal de hub-situatie **vóór** je begint:

```bash
node -e 'const R=require("./lib/registry");const g=R.loadRegistry(".");console.log("REGIO-HUBS:",R.regios(g).map(r=>r.regioSlug).join(", "));console.log("NICHE-HUBS:",R.niches(g).map(n=>n.niche).join(", "));console.log("PAGINAS:",g.map(p=>p.slug).join(", "))'
```

Classificeer dan deze pagina — dit bepaalt de GHL-acties in Fase 5:
- **Nieuwe regio** = geen bestaande config deelt deze `regioSlug` → er moet **eenmalig een regio-hub** in GHL aangemaakt worden.
- **Nieuwe niche** = geen bestaande config deelt deze `niche` → er moet **eenmalig een niche-hub** aangemaakt worden **én** het homepage-kaartje geactiveerd.
- **Bestaande regio + niche** = enkel de detailpagina; de niche-hub wordt enkel her-geplakt (JSON-LD).

Meld deze classificatie expliciet aan het begin, zodat de overdracht in Fase 5 compleet is.

### 0b. Niche vaststellen
Bestaat de niche al (`config/{{NICHE}}/*.json`)? Gebruik dan een bestaande config uit
**dezelfde niche** als model, zodat het `vak`-blok, de synoniemen en de hero-afbeelding
consistent blijven. Nieuwe niche? Gebruik `config/dakwerkers/dakwerkers-gent.json` als
structuurmodel en bepaal het `vak`-blok expliciet:
- `mv` (meervoud), `mvCap` (hoofdletter), `ev` (enkelvoud), `kort` (activiteit), en
  `syn` = één gangbaar synoniem `{ mv, ev }`. **Twijfel over term/synoniem → vraag het, verzin niets.**
- **Hero:** nieuwe niche = nog geen niche-hero → vraag een hero-URL (of expliciete toestemming om voorlopig een bestaande hero te hergebruiken).

---

## Fase 1 — Config aanmaken
Maak `config/{{NICHE}}/{{SLUG}}.json` naar het model uit Fase 0. Schema: `slug`, `vak`,
`regio` (naam "regio {{REGIO}}", kern "{{REGIO}}", juiste provincie), `gemeenten`,
`zoektermen` (drie varianten met de niche-term + {{REGIO}}), `peildatum`, `updateDatum`,
`hero` (`img` uit Fase 0; `alt` aangepast naar niche + {{REGIO}}).

> **Methodiek-versie.** Neem géén `methodiek`-veld op in een nieuwe config → `build.js`
> gebruikt automatisch de nieuwste versie (nu v2). Alleen de drie oorspronkelijke
> dakwerkers-pagina's staan bewust op `"methodiek": 1`. Zie METHODIEK.md § Methodiek-versies.

> **`peildatum` (JJJJ-MM-DD)** = de datum waarop de Apify-data gescrapet is (≈ het
> `scrapedAt`-veld in de export). Ankerpunt voor het 24-maanden-recentheidsvenster én
> voor relatieve review-datums in `normalize.js`. `build.js` faalt hard bij een
> ontbrekend/ongeldig verplicht veld.

**`gemeenten`-lijst — drie harde regels:**
1. **Regiostraal ~20 km:** {{REGIO}} zelf + buurgemeenten binnen die straal. **Dubbelcheck elke naam** (bestaat ze, ligt ze echt bij {{REGIO}}, geen naamverwarring).
2. **Gemeentefusie 1 jan 2025 — neem ALTIJD beide vormen op.** De matching is exact. Zet voor elke fusiegemeente **zowel de gefuseerde naam als elke losse deelnaam** in `gemeenten`.
3. **Geen overlap met bestaande regio's binnen dezelfde niche.** Lees eerst de andere `config/{{NICHE}}/*.json`. Ligt een grensgemeente al in een naburige regio, neem ze dan **standaard niet** op. Meld welke grensgemeenten dit betreft, met concreet gevolg, en laat de knoop doorhakken vóór je verder gaat.

---

## Fase 2 — Normaliseren
```bash
node scripts/normalize.js apify {{SLUG}} data/{{SLUG}}/apify-export.json data/{{SLUG}}/apify-places.json
```
Dit schrijft `data/{{SLUG}}/reviews.json`. **Lees élke waarschuwing** en handel af:
- `~ "…" ligt in "X" — niet in de gemeentelijst`: beslis bewust. 2025-fusiegemeente of
  buurgemeente binnen ~20 km die in de regio hoort → toevoegen (regels Fase 1) en opnieuw
  draaien. Zit X al in een andere regio → weglaten (overlapregel) en melden.
- `~ "…": gemeente afgeleid uit de pin-coördinaten → "X"`: **coördinaten-fallback.**
  Heeft een bedrijf geen adres/stad in de export maar wél Google's pin, dan leidt
  `normalize.js` de gemeente af uit die coördinaten (reverse-geocoding) en bevriest dat
  in `data/{{SLUG}}/geocache.json`. Dat is geen giswerk — het is de echte pin — en de
  afgeleide gemeente wordt daarna gewoon tegen de gemeentelijst getoetst. Commit
  `geocache.json` mee (dat is wat de fallback bevriest; na de eerste run: geen netwerk meer).
- `! "…": geen adres én reverse-geocoding gaf geen gemeente` (of geen coördinaten):
  bedrijf zonder locatiedata. **Harde regel: nooit de gemeente raden uit naam/website. Altijd laten vallen.**
- `~ "…": rankbaar maar geen website`: onthouden — in Fase 3 zoek je die site verplicht zelf op.

Herhaal Fase 1↔2 tot de gemeentelijst klopt en er geen onverklaarde `~`-waarschuwing meer is.
Rapporteer kort: aantal bedrijven, aantal binnen de gemeentelijst, aantal `rankbaar`.

---

## Fase 3 — Beoordeling (bevriezen)
Volg `prompts/scoring-prompt.md` letterlijk, met `data/{{SLUG}}/reviews.json` als input.
- Beoordeel **alle** bedrijven uit reviews.json (ook wachtlijstkandidaten).
- **Middel 2–3 onafhankelijke runs (v2):** scoor `reviewkwaliteit` en `vakfocus` in 2–3 losse runs (elk in 0,5-stappen) en bevries het **gemiddelde**. `synthese`, `chips` en `breuk` uit de meest representatieve run.
- **Vakfocus vereist de website effectief te bezoeken** (web search aan). Voor **elk** bedrijf met `rankbaar: true`: zoek de officiële site op als `website` leeg is, en **verifieer** dat naam én gemeente kloppen (naamverwarring, SEO-schijnsites). Geen betrouwbare site → `vakfocus: null`, `vakfocusBron: "geen-website"`. Nooit raden.
- Schrijf het JSON-antwoord exact volgens het schema weg als `data/{{SLUG}}/beoordeling.json`. Elk bedrijf komt **exact één keer** voor; `bedrijf` moet **letterlijk** matchen.
- **Bevries** het daarna: niet lichtvaardig opnieuw draaien.

---

## Fase 4 — Bouwen en controleren
```bash
node build.js {{SLUG}}      # snelle check van enkel deze pagina
node build-all.js           # ALLES herbouwen + consistentiecheck + registry.json push  ← eindcommando
```
> **Let op de GHL-diff van build-all.** De NIEUW/GEWIJZIGD-lijst vergelijkt met de lokale
> `output/`, niet met GHL. Heb je vooraf al `node build.js {{SLUG}}` gedraaid, dan zit die
> pagina al in `output/` en mist ze in de diff (en dus haar `ghl/`-bundel). Verwijder in
> dat geval de betrokken outputs en draai build-all opnieuw, zodat álle te plakken pagina's
> geflagd worden en hun bundel krijgen.

Controleer daarna en rapporteer:
- `output/{{SLUG}}/index.html` — Top 10 of Top 5, juiste volgorde, geen cijfer op 10.
- `reports/{{SLUG}}/…-rapport.txt` — controlerapport, incl. locatie-secties.
- `reports/{{SLUG}}/…-prospectie-dasslim.md` — plek 11–20 + niet-eligible (intern, niet publiceren).
- De **"in GHL bijwerken"-lijst** die build-all afdrukt.

### 4b. Registry-propagatie verifiëren (verplicht bij een nieuwe regio/niche)
`build-all` pusht `registry.json` en purge't jsDelivr, maar de CDN-edge én de
browsercache van bezoekers kunnen nahinken — waardoor een nieuw regio-/niche-kaartje
tijdelijk niet verschijnt. Controleer vóór je afsluit dat de **live CDN** de nieuwe
regio serveert (cache-bust omzeilt je eigen browsercache):

```bash
node -e 'require("https").get("https://cdn.jsdelivr.net/gh/Magicworx-be/keurwijzer-data/registry.json?cb="+Date.now(),r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>console.log("CDN regios:",JSON.parse(d).regios.map(x=>x.regioSlug).join(", ")))})'
```

Ontbreekt de nieuwe regio nog, her-purge dan en herhaal de check tot ze verschijnt:

```bash
curl -s https://purge.jsdelivr.net/gh/Magicworx-be/keurwijzer-data/registry.json
```

Meld expliciet dat de registry live staat. **Let op:** terugkerende bezoekers met een
gecachte registry zien de nieuwe kaart pas na het verlopen van hun browsercache (~12u) —
tenzij de hubs de `no-cache`-loader gebruiken (in `hub.html`/`homepage.html`), die de
registry bij elke lading revalideert. Zijn de hubs nog met de oude loader gepubliceerd,
vermeld dat dan in de overdracht.

---

## Fase 5 — Overdracht (GHL is jouw handwerk)
`build-all.js` pusht automatisch `registry.json`, waarna hub- en homepage-navigatie via
jsDelivr clientside de nieuwe kaartjes oppikt. Zet de kant-en-klare plakbestanden klaar in
`ghl/` en geef de **exacte** lijst van te plakken pagina's, met per pagina het pad. Doe zelf
**niets** in GHL.

Bepaal de lijst op basis van de classificatie uit Fase 0-a:

- **Altijd:** de nieuwe detailpagina `/{{SLUG}}/` aanmaken → `ghl/{{SLUG}}/`.
- **Nieuwe regio (eerste pagina in die regio):** ook de regio-hub `/regio/<regioSlug>/`
  **eenmalig aanmaken** → `ghl/regio-<regioSlug>/`. Zonder deze hub bestaat de
  regio-landingspagina niet. Technisch identiek aan een detailpagina: `body.html` in een
  Code-element, `header-code.html` in de header, `SEO-velden.txt` in de SEO-tab.
- **Nieuwe niche:** ook de niche-hub `/<niche>/` **eenmalig aanmaken** → `ghl/<niche>/`,
  én het niche-kaartje op de homepage activeren. De bestaande detailpagina's mogen **niet**
  wijzigen — meld het als dat wél gebeurt.
- **Niche-hub `/<niche>/` (bestaat al):** enkel de **header-code** her-plakken als build-all
  ze als gewijzigd flagt (de JSON-LD ItemList krijgt de nieuwe regio erbij).
- **Homepage:** niet aanraken (laadt de kaartjes automatisch uit registry.json).
- `output/sitemap.xml` publiceer je apart (zie WIJZIGINGEN.md).

Elke `ghl/…`-map bevat `SEO-velden.txt`, `header-code.html` en `body.html` (zie `ghl/_LEES-MIJ.txt`).

Vat aan het einde samen: gekozen gemeenten (met eventuele overlap-uitsluitingen), aantal
rankbare bedrijven, Top 10 of Top 5, en de exacte GHL-bijwerklijst met paden.

---

## Fase 6 — Outreach (apart gesprek)
Na publicatie in GHL: open een **nieuw** Claude Code-gesprek (met Gmail MCP verbonden) en
volg het outreach-werkproces. Dat leest het rapport en de pagina, zoekt per bedrijf een
e-mailadres op de website, en zet gepersonaliseerde Gmail-conceptmails klaar — nooit
automatisch verstuurd, enkel drafts die je zelf controleert en verstuurt.
