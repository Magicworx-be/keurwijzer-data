

### Stap 1
PROMPT Perplexity - Claude Sonnet 5 thinking - Zoektermen genereren

> Genereer een lijst zoektermen voor Apify (Google Maps Scraper)
> in het formaat "[NICHE] [STAD]", één per lijn.
>
> Niche: {dakwerker}
> Steden: {Oudenaarde, Ronse, Brakel, Horebeke, Kluisbergen, Kruisem, Lierde, Maarkedal, Wortegem-Petegem, Zwalm}


### Stap 2
Google Maps places scrapen

1. Open **Apify → Google Maps Scraper**
2. Plak de zoektermen via "Bulk edit"
3. Run de scraper
4. Sla het resultaat op als `data/{{SLUG}}/apify-places.json`


### Stap 3
PROMPT Perplexity - Claude Sonnet 5 thinking - Google Maps URLs extraheren

Kopieer `apify-places.json` naar een LLM met deze prompt:

> Please extract all companies from the Google Maps listing I'm pasting below,
> and output only a clean list of plain Google Maps URLs — one URL per line,
> no numbering, no company names, no extra text or formatting.


### Stap 4
Reviews scrapen

1. Open **Apify → Google Maps Reviews Scraper**
2. Plak de URLs uit stap 3
3. Run de scraper
4. Sla het resultaat op als `data/{{SLUG}}/apify-export.json`


### Stap 5
Start een Claude Code-gesprek (Opus, web search aan) en ga verder met Fase 0.


Prompt: 

Je bouwt een nieuwe **Keurwijzer** directory-pagina voor niche **{{dakwerkers}}** in **regio {{dendermonde}}**, slug `{{dakwerkers-dendermonde}}`. Werk exact zoals we eerder deden voor de dakwerkers-pagina's van Gent en Meetjesland. 
**Sla geen stap over, raad nooit, en stop en vraag mij bij elke twijfel.
** Volg deze fasen in volgorde.

## Vaste projectregels (niet opnieuw ter discussie stellen)
- **URL-structuur:** detailpagina's plat in de root (`/{{SLUG}}/`), hubs in mappen. Niet nesten.
- **Registry-gedreven:** alle navigatie/hubs/sitemap komen uit de configs via `lib/registry.js`. Het veilige eindcommando is altijd `node build-all.js`.
- **Deterministisch:** de LLM (jij) beoordeelt alleen tekst. Alle rekenwerk (Bayes, tijdsweging, selectie, Top 10/Top 5, volgorde) doet `build.js`. Vraag/geef nooit zelf een eindscore of ranking.
- **Zelfde data = zelfde resultaat:** `beoordeling.json` wordt één keer gemaakt en dan bevroren.

## Fase 0 — Niche vaststellen
Bestaat de niche al (er staat al een `config/{{NICHE}}/*.json`)? Gebruik dan een bestaande config uit **dezelfde niche** als model, zodat het `vak`-blok, de synoniemen en de hero-afbeelding consistent blijven. Is dit een **nieuwe niche** (nog geen map `config/{{NICHE}}/`), gebruik dan `config/dakwerkers/dakwerkers-gent.json` als structuurmodel en bepaal het `vak`-blok expliciet:
- `mv` (meervoud, bv. "schilders"), `mvCap` (met hoofdletter), `ev` (enkelvoud, "schilder"), `kort` (de activiteit, bv. "schilderwerk"), en `syn` = één gangbaar synoniem `{ mv, ev }` (bv. dakwerkers→dakdekkers). **Twijfel je over het juiste synoniem of de juiste term voor deze niche → vraag het mij eerst, verzin het niet.**
- **Hero:** bestaat de niche nog niet, dan is er nog geen niche-hero — vraag mij om een hero-afbeeldings-URL (of expliciete toestemming om voorlopig de dakwerkers-hero te hergebruiken).

## Fase 1 — Config aanmaken
Maak `config/{{NICHE}}/{{SLUG}}.json` naar het model uit Fase 0. Zelfde schema: `slug`, `vak` (zie Fase 0), `regio` (naam "regio {{REGIO}}", kern "{{REGIO}}", juiste provincie), `gemeenten`,
`zoektermen` (drie varianten met de niche-term + {{REGIO}}), `peildatum`, `updateDatum`,
`hero` (`img` uit Fase 0; `alt` aangepast naar niche + {{REGIO}}).

> **Methodiek-versie.** Neem géén `methodiek`-veld op in een nieuwe config: dan gebruikt
> `build.js` automatisch de nieuwste versie (nu v2 — hogere vertrouwen-vloer, publicatiedrempel
> ≥15 reviews, gemiddelde van 2–3 LLM-runs). Alleen de drie oorspronkelijke dakwerkers-pagina's
> staan bewust vastgepind op `"methodiek": 1`. Zie METHODIEK.md § Methodiek-versies.

> **`peildatum` (ISO, JJJJ-MM-DD)** = de datum waarop de Apify-data gescrapet is (≈ vandaag bij
> verse data). Het is het ankerpunt voor het 24-maanden-recentheidsvenster én voor relatieve
> review-datums in `normalize.js` — kies het bewust, niet lukraak "vandaag" als de scrape ouder is.
> `build.js` faalt hard bij een ontbrekend of ongeldig veld (`vak.mv`, `regio.naam/kern/provincie`,
> `gemeenten`, `peildatum`, `updateDatum` zijn verplicht).

Voor de **`gemeenten`-lijst** gelden drie harde regels:
1. **Regiostraal ~20 km:** een klant zoekt een vakspecialist binnen ~20 km. Neem {{REGIO}} zelf + de buurgemeenten binnen die straal op. **Dubbelcheck elke gemeentenaam** (bestaat ze, ligt ze echt bij {{REGIO}}, geen naamverwarring met een andere provincie of Nederland).
2. **Gemeentefusie 1 jan 2025 — neem ALTIJD beide vormen op.** Google Maps geeft nu de gefuseerde naam in adressen (bv. "Merelbeke-Melle", "Nazareth-De Pinte"). De matching in `build.js` / `normalize.js` is een *exacte* set-vergelijking, geen deel-matching. Zet voor elke fusiegemeente dus **zowel de gefuseerde naam als elke losse deelnaam** in `gemeenten`. Alleen losse namen laat de huidige data wegvallen; alleen de gefuseerde naam mist oudere records.
3. **Geen overlap met bestaande regio's binnen dezelfde niche.** Lees eerst de andere `config/{{NICHE}}/*.json`. Ligt een grensgemeente al in de gemeentelijst van een naburige regio (bv. Evergem/Deinze/Lochristi zitten in Gent), neem ze dan **standaard niet** op — ook al kost dat rankbare bedrijven. Meld me welke grensgemeenten dit betreft en met welk concreet gevolg (welke bedrijven, Top 10 vs Top 5), en laat mij de knoop doorhakken vóór je verder gaat.

## Fase 2 — Normaliseren
Draai:
```bash
node scripts/normalize.js apify {{SLUG}} data/{{SLUG}}/apify-export.json data/{{SLUG}}/apify-places.json
```
Dit schrijft `data/{{SLUG}}/reviews.json`. **Lees élke waarschuwing** en handel af:
- `~ "…" ligt in "X" — niet in de gemeentelijst`: beslis bewust. Is X een 2025-fusiegemeente
  (koppelteken-naam) of een buurgemeente binnen ~20 km die in de regio hoort → voeg toe aan de
  config (regels van Fase 1) en draai normalize opnieuw. Zit X al in een andere regio → weglaten
  (overlapregel) en aan mij melden.
- `! "…": geen gemeente gevonden`: bedrijf zonder locatiedata. **Harde regel: nooit de gemeente raden of afleiden uit naam/website. Altijd laten vallen.** Deze komen in de rapportsectie "GEEN LOCATIEDATA".
- `~ "…": rankbaar maar geen website`: onthouden — in Fase 3 zoek je die site verplicht zelf op.

Herhaal Fase 1↔2 tot de gemeentelijst klopt en er geen onverklaarde `~`-waarschuwing meer is.
Rapporteer me kort: aantal bedrijven, aantal binnen de gemeentelijst, aantal `rankbaar`.

## Fase 3 — Beoordeling (bevriezen)
Volg `prompts/scoring-prompt.md` letterlijk, met `data/{{SLUG}}/reviews.json` als input. Kernpunten:
- Beoordeel **alle** bedrijven uit reviews.json (ook wachtlijstkandidaten).
- **Middel 2–3 onafhankelijke runs (v2).** Scoor `reviewkwaliteit` en `vakfocus` in 2–3 losse runs (elk in 0,5-stappen) en bevries het **gemiddelde** — niet de eerste run. De gemiddelde waarde mag buiten de 0,5-stappen vallen; `build.js` aanvaardt dat. `synthese`,
  `chips` en `breuk` neem je uit de meest representatieve run.
- **Vakfocus (rubriek 2) vereist de website effectief te bezoeken** (web search aan). Voor **elk** bedrijf met `rankbaar: true` zoek je de officiële site op als `website` leeg is, en **verifieer** dat naam én gemeente kloppen (let op naamverwarring en SEO-schijnsites uit een andere regio). Vakfocus meet nichezuiverheid **voor deze niche** ({{NICHE}}): hoe zuiver het bedrijf hierin gespecialiseerd is. Geen betrouwbare site → `vakfocus: null`, `vakfocusBron: "geen-website"`. Nooit raden.
- Schrijf het JSON-antwoord exact volgens het schema weg als `data/{{SLUG}}/beoordeling.json`. Elk bedrijf uit reviews.json komt **exact één keer** voor; `bedrijf` moet **letterlijk** matchen (het script koppelt op die naam). `build.js` valideert dit en print waarschuwingen bij ontbrekende bedrijven of ongeldige scores — die lees en los je op in Fase 4.
- **Bevries** het daarna: niet lichtvaardig opnieuw draaien (elke nieuwe run is de enige bron van variatie in de uitkomst).

## Fase 4 — Bouwen en controleren
```bash
node build.js {{SLUG}}      # snelle check van enkel deze pagina
node build-all.js           # ALLES herbouwen + consistentiecheck + registry.json push  ← eindcommando
```
Controleer daarna en rapporteer aan mij:
- `output/{{SLUG}}/index.html` — de pagina zelf (Top 10 of Top 5, klopt de volgorde, geen cijfer op 10).
- `reports/{{SLUG}}/…-rapport.txt` — controlerapport, inclusief de sectie **"GEEN LOCATIEDATA"**.
- `reports/{{SLUG}}/…-prospectie-dasslim.md` — plek 11–20 + niet-eligible (intern, niet publiceren).
- De **"in GHL bijwerken"-lijst** die `build-all.js` afdrukt.

`build-all.js` pusht automatisch `registry.json` naar GitHub (`Magicworx-be/keurwijzer-data`),
waarna de hub- en homepage-navigatie via jsDelivr clientside de nieuwe pagina oppikt. De hubs en homepage hoeven **niet** opnieuw in GHL geplakt te worden — alleen de nieuwe detailpagina zelf.

Uitzonderingen die wél een GHL-paste vereisen:
- **Nieuwe regio (eerste pagina in die regio):** een nieuwe regio-hub moet éénmalig in GHL aangemaakt worden (SEO-velden + body uit `ghl/regio-<slug>/`). De kaarten erin zijn daarna automatisch.
- **Nieuwe niche:** een nieuwe niche-hub moet éénmalig in GHL aangemaakt worden, en het   niche-kaartje op de homepage moet handmatig geactiveerd worden (de `data-niche`-attribuut + icoon/beschrijving staan al in de template; het JS upgradet het automatisch naar "live" zodra de niche in registry.json verschijnt, maar het visuele kaartje moet er eerst staan). De honderden bestaande detailpagina's mogen **niet** wijzigen — meld het als dat wél gebeurt (dan is er iets mis).

## Fase 5 — Overdracht
GHL-publiceren blijft **mijn** handwerk. Zet de kant-en-klare plakbestanden klaar in `ghl/` (dat doet `build-all.js`) en geef me de beknopte lijst van welke pagina's ik in GoHighLevel moet aan-/bijwerken, met per pagina het pad. Doe zelf **niets** in GHL.

**Typisch voor een nieuwe regio in een bestaande niche:** er is nog maar **1 GHL-actie** nodig: de nieuwe detailpagina zelf plakken (uit `ghl/<slug>/`). De hubs en homepage laden de nieuwe link automatisch uit `registry.json`.

Vat aan het einde samen: gekozen gemeenten (met de eventuele overlap-uitsluitingen), aantal rankbare bedrijven, Top 10 of Top 5, en de exacte GHL-bijwerklijst.

## Fase 6 — Outreach (apart gesprek)
Na publicatie in GHL: open een **nieuw** Claude Code-gesprek (met Gmail MCP verbonden) en volg `prompts/outreach-prompt.md`. Dat script leest het rapport en de gegenereerde pagina, zoekt per bedrijf een e-mailadres op de website, en zet gepersonaliseerde Gmail-conceptmails klaar — nooit automatisch verstuurd, enkel drafts die je zelf controleert en verstuurt.
