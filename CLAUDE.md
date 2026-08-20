# Keurwijzer — instructies voor Claude Code

Keurwijzer is een onafhankelijke kwaliteitsranking van vakbedrijven per
niche × regio, op basis van Google-reviews en de eigen website van het bedrijf.

**Lees `METHODIEK.md` voor de volledige uitleg van selectie en ranking.**
Dat document is ook wat Cowork leest.

## Vaste projectregels (niet opnieuw ter discussie stellen)

- **Deterministisch.** De LLM beoordeelt alleen tekst (reviewkwaliteit, vakfocus,
  synthese, chips). Álle rekenwerk — tijdsweging, Bayes, de vier dimensies,
  selectie, Top 10/Top 5, volgorde — gebeurt in `build.js`. Vraag of geef nooit
  zelf een eindscore, selectie of ranking.
- **Zelfde data = zelfde resultaat.** `data/<slug>/beoordeling.json` wordt één
  keer per regio gemaakt en dan bevroren. Draai de LLM-beoordeling niet
  lichtvaardig opnieuw.
- **Publieke gewichten en drempels zijn vast** (35/30/15/20, halveringstijd
  2 jaar, Bayes M=16, ≥10 reviews, ≥3 recent) en worden nooit per stad aangepast.
  Ze zijn identiek in élke methodiek-versie — dat is de publieke belofte "dezelfde
  methode voor elke regio".
- **Methodiek-versies.** Interne kalibratie die de publieke paginatekst niet noemt
  (vertrouwen-vloer, recentheid-anker, publicatiedrempel, LLM-run-middeling) staat
  in `METHODIEK_PARAMS` in `build.js`, per versie. Elke config draagt `"methodiek": N`;
  ontbreekt het veld → nieuwste versie. **Bestaande pagina's staan vastgepind (v1) en
  mogen nooit veranderen; nieuwe pagina's krijgen automatisch de nieuwste versie (v2).**
  Verhoog `METHODIEK_LATEST` en voeg een nieuw versieblok toe om de logica te
  verbeteren — pin bestaande configs nooit los. Zie METHODIEK.md § Methodiek-versies.
- **URL-structuur:** detailpagina's plat in de root (`/<slug>/`), hubs in mappen.
  Niet nesten.
- **Registry-gedreven:** navigatie, hubs en sitemap komen uit de configs via
  `lib/registry.js`. Het veilige eindcommando is altijd `node build-all.js`.
- **Dynamische navigatie:** hub- en homepage-navigatie wordt clientside geladen
  uit `registry.json` (gehost op GitHub via jsDelivr CDN). `build-all.js` genereert
  en pusht dit bestand automatisch. Daardoor hoeven hubs en homepage niet meer in
  GHL bijgewerkt te worden bij een nieuwe regio — enkel de nieuwe detailpagina zelf.
- **Geen gemeente in de data → bedrijf altijd weglaten.**

## Congruentieregel — METHODIEK.md meebijwerken

`METHODIEK.md` is de leesbare versie van de logica en wordt door Cowork gebruikt
om vragen te beantwoorden. Hij mag nooit uit elkaar lopen met de code.

**Wijzig je een van deze, werk dan in dezelfde beurt `METHODIEK.md` bij en zet de
datum "Laatst gelijkgezet met de code" bovenaan op vandaag:**

- de publieke constanten bovenaan `build.js`: `WEIGHTS`, `HALFLIFE_JAREN`,
  `BAYES_M`, `MIN_REVIEWS`, `MIN_RECENT`, `LISTED_FULL`, `LISTED_SMALL`,
  `SMALL_REGION_THRESHOLD`, `EXTRA_MAX`, `WATCHLIST_MAX`, `TRUST_CEIL`;
- het versie-blok `METHODIEK_PARAMS` / `METHODIEK_LATEST` (per versie:
  `TRUST_FLOOR`, `RECENCY_ANCHOR`, `PUBLISH_MIN_REVIEWS`, `EXPECT_HALF_STEPS`);
- de eligibility-, selectie- (`pickTop`, publicatiedrempel) of compositeberekening
  in `build.js`;
- een rubriek, ijkpunt of regel in `prompts/scoring-prompt.md`;
- het werkproces in `prompts/directory-pagina-prompt.md`.

Meld het expliciet in je antwoord als je `METHODIEK.md` hebt bijgewerkt — en ook
als je het bewust niet nodig vond.

Wijzigt de publieke formulering van de methodiek (`template.html` §methodiek,
`homepage.html`, de JSON-LD FAQ), controleer dan dat de percentages en drempels
daar gelijk lopen met `build.js` én `METHODIEK.md`. Die drie moeten altijd
hetzelfde zeggen.

## Bestanden in het kort

| Pad | Rol |
|---|---|
| `build.js` | Rekenmotor + paginagenerator. Bindende bron voor alle getallen. |
| `build-all.js` | Bouwt alles (pagina's, hubs, sitemap, GHL-blokken) + genereert en pusht `registry.json` én de badges. Veilig eindcommando. |
| `build-site.js` | Homepage/hubs (kaarten worden clientside geladen uit `registry.json`). |
| `lib/registry.js` | Leidt navigatie en sitemap af uit de configs. |
| `lib/push-registry.js` | Pusht `registry.json` naar GitHub (`Magicworx-be/keurwijzer-data`) + purget jsDelivr-cache. |
| `scripts/genereer-badges.js` | Rendert kwaliteitsbadges (PNG, donker/licht) per gepubliceerd bedrijf uit `badges/<slug>/badges.json` (sharp + opentype.js). Zegel: `assets/zegel.png` of `SEAL_MODE=vector`. |
| `lib/push-badges.js` | Pusht de badge-PNG's (`badges/`) naar dezelfde data-repo + purget jsDelivr per bestand. |
| `.env` | `GITHUB_TOKEN` en `GITHUB_REPO` voor de automatische push (niet in versiebeheer). |
| `scripts/normalize.js` | Apify-export → `data/<slug>/reviews.json` (+ `recent24`, `rankbaar`). |
| `prompts/scoring-prompt.md` | Rubrieken voor de LLM-beoordeling, incl. de website-/vakfocuscheck. |
| `prompts/directory-pagina-prompt.md` | Volledig werkproces voor een nieuwe niche × regio. |
| `new page - how to/outreach-email-prompt.md` | Gmail-conceptmails klaarzetten voor bedrijven in de selectie (incl. badge-embed). |
| `config/<niche>/<slug>.json` | Vak, regio, gemeentelijst, peildatum. De gemeentelijst is de eerste selectiefilter. |
| `METHODIEK.md` | Leesbare uitleg van selectie en ranking. Gedeeld met Cowork. |
| `WIJZIGINGEN.md` | Waarom-beslissingen (o.a. Top 10-concept i.p.v. score op 10). |
| `reports/<slug>/` | Controlerapport + intern prospectiedocument (niet publiceren). |

## Werkafspraken

- Bouwen: `node build.js <slug>` voor één pagina, `node build-all.js` voor alles
  (incl. registry.json push).
- Raak `data/<slug>/beoordeling.json` niet aan zonder expliciete vraag.
- Bij twijfel over een niche-term, synoniem of hero-afbeelding: vragen, niet
  verzinnen.
- **GHL per nieuwe pagina:** bij een nieuwe regio in een bestaande niche is er nog
  maar 1 GHL-actie nodig: de detailpagina zelf plakken. De hubs en homepage laden
  de nieuwe link automatisch uit `registry.json`.
