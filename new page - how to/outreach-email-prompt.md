# Prompt — outreach-mails klaarzetten in Gmail (na publicatie)

Kopieer alles **onder de streep** in een Claude Code-gesprek met de Gmail MCP
verbonden. Vul `[SLUG]` in (bv. `dakwerkers-aalst`).

---

Ik heb net de Keurwijzer-pagina voor **"[SLUG]"** gegenereerd (config,
`data/[SLUG]/`, `output/[SLUG]/index.html` en het rapport bestaan al).
Zet voor mij gepersonaliseerde **Gmail-conceptmails** klaar voor elk bedrijf in
de gepubliceerde selectie van deze pagina. **Nooit automatisch versturen — enkel
drafts.**

Ga zo te werk:

## 1 — Lijst ophalen
Lees `reports/[SLUG]/…-rapport.txt`, blok **"TOP N (dit staat op de site…)"**.
Dat is de exacte lijst + volgorde van bedrijven die nu op de site staan.
Onthoud het werkelijke aantal **N** (kan 10 of 5 zijn, afhankelijk van de regio)
— gebruik dat aantal, nooit standaard "10".

## 2 — Website ophalen
Haal per bedrijf de website op uit `data/[SLUG]/reviews.json`.

## 3 — E-mailadres zoeken
Bezoek elke website en zoek een e-mailadres:
- Check `<a href="mailto:…">` links.
- Regex over de volledige paginatekst (voor adressen die niet als link staan).
- Kijk zo nodig ook op de contactpagina.

Vind je **geen** bruikbaar adres (geparkeerd domein, enkel contactformulier,
site offline): **sla dat bedrijf over, verzin niets**, en meld het apart aan
het einde.

## 4 — Gegevens ophalen (uit gegenereerde output, niet ruwe data)
- `{niche}` = `config.vak.mv` (bv. "dakwerkers")
- `{regio}` = `config.regio.naam`
- `{aantal gecontroleerde bedrijven}` = het getal "… van X {niche} in …" uit de
  Samenvatting-alinea in `output/[SLUG]/index.html`
- `{landingspagina url}` = de `<link rel="canonical">` uit datzelfde
  `output/[SLUG]/index.html`
- `{jaar}` = het jaartal van `config.peildatum`

### Badge-velden (uit `badges/[SLUG]/badges.json`)
Dit bestand wordt door `build.js` gemaakt en bevat per gepubliceerd bedrijf de
badge-gegevens. Zoek het bedrijf op via het `naam`-veld en lees:
- `{tier}` = het `tier`-veld (bv. `#1`, `Top 3`, `Top 5`, `Top 10`) — volgt de
  rang, niet het paginalabel.
- `{bedrijf-slug}` = het `bedrijfSlug`-veld (voor de badge-bestandsnaam).

De badges staan op jsDelivr (dezelfde CDN als `registry.json`). Bouw de URL's:
- `{badge url donker}` = `https://cdn.jsdelivr.net/gh/Magicworx-be/keurwijzer-data/badges/[SLUG]/{bedrijf-slug}--donker.png`
- `{badge url licht}`  = `https://cdn.jsdelivr.net/gh/Magicworx-be/keurwijzer-data/badges/[SLUG]/{bedrijf-slug}--licht.png`

(Donkere tekst = voor lichte site-achtergrond; witte tekst = voor donkere.)

## 5 — URL opschonen
Zorg ervoor dat `{landingspagina url}` er zo uitziet:
`https://www.keurwijzer.be/[SLUG]` — zo kort en proper mogelijk.

## 6 — Gmail-concepten aanmaken
Maak voor elk bedrijf met een gevonden e-mailadres een Gmail-concept aan met
exact deze template:

**Onderwerp:** `{naam bedrijf} in top {N} {niche} {regio} {jaar}`

**Mail:**

```
Goedemiddag,

Keurwijzer.be geeft een overzicht van de beste {niche} in {regio}.

We controleerden {aantal gecontroleerde bedrijven} {niche}. {naam bedrijf} staat in de top {N}. Knap!

Om zeker te zijn dat alles klopt, vraag ik je om je gegevens op onze site na te kijken.

Check hier: {landingspagina url}

Als alles klopt, mag je onderstaande kwaliteitsbadge gratis op je website of social media zetten. Zet je hem op je website, link hem dan naar je pagina bij ons: {landingspagina url}

Badge met donkere tekst (voor een lichte achtergrond):
{badge url donker}

Badge met witte tekst (voor een donkere achtergrond):
{badge url licht}

Laat me iets weten, aub.

Groeten, Olivier

-
Olivier Muys
Keurwijzer.be - 0470 12 44 61
```

> **Let op — badge-blok:** we leveren de badge als **kale PNG-links** (geen HTML-
> embedcode), zodat het bedrijf de afbeelding gewoon kan opslaan en plaatsen. De
> backlink naar Keurwijzer regelt het bedrijf zelf: we *vragen* in de mail om de
> badge op de website naar `{landingspagina url}` te laten linken. Maak het
> concept bij voorkeur als **HTML-mail** aan (`htmlBody`), met de donkere badge
> `<img>` inline getoond zodat de ontvanger hem meteen ziet, en de twee PNG-URL's
> eronder als downloadlinks; de witte variant niet inline tonen (wit-op-
> transparant is onzichtbaar op een lichte mailachtergrond). `{tier}` mag je ook
> in het onderwerp of de openingszin gebruiken ("staat op **{tier}**") als je dat
> sterker vindt dan "top {N}".

## 7 — Rapporteer
Rapporteer aan het einde:
- Een tabel (**bedrijf** | **gebruikt e-mailadres**) van de aangemaakte drafts.
- Een aparte lijst van bedrijven **zonder vindbaar e-mailadres**.
