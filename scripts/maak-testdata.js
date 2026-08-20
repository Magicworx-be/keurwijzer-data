#!/usr/bin/env node
// Genereert synthetische testdata (deterministisch) om de pijplijn te testen.
//   node scripts/maak-testdata.js [slug] [--force]
// Standaard-slug: dakdekkers-test — de bijhorende testconfig wordt automatisch
// aangemaakt als die nog niet bestaat.
//
// VEILIGHEID: als data/<slug>/reviews.json al bestaat en er NIET uitziet als
// testdata (dus echte productiedata is), weigert het script te overschrijven.
// Alleen met een bewuste --force kan dat toch.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const force = process.argv.includes('--force');
const args = process.argv.slice(2).filter(a => a !== '--force');
const slug = args[0] || 'dakdekkers-test';

const dir = path.join(ROOT, 'data', slug);
const outReviews = path.join(dir, 'reviews.json');

// ---- guard: overschrijf nooit stilzwijgend echte data -------------------
if (fs.existsSync(outReviews) && !force) {
  let looksLikeTest = false;
  try {
    const existing = JSON.parse(fs.readFileSync(outReviews, 'utf8'));
    looksLikeTest = Array.isArray(existing) && existing.length > 0 &&
      existing.every(b => (b.reviews || []).every(r => /^Testreview \d+$/.test(r.tekst || '')));
  } catch { /* onleesbaar → behandel als echte data */ }
  if (!looksLikeTest) {
    console.error('GEWEIGERD: data/' + slug + '/reviews.json bevat geen testdata — dit lijkt echte productiedata.');
    console.error('Gebruik de test-slug (node scripts/maak-testdata.js dakdekkers-test) of voeg bewust --force toe.');
    process.exit(1);
  }
}

// ---- testconfig aanmaken als die ontbreekt ------------------------------
const cfgPath = path.join(ROOT, 'config', slug + '.json');
if (!fs.existsSync(cfgPath)) {
  const cfg = {
    slug,
    vak: { mv: 'dakdekkers', mvCap: 'Dakdekkers', ev: 'dakdekker', kort: 'dakwerken' },
    regio: { naam: 'regio Gent', kern: 'Gent', provincie: 'Oost-Vlaanderen' },
    gemeenten: [
      'Gent', 'Merelbeke', 'Deinze', 'Lochristi', 'Destelbergen',
      'Evergem', 'Melle', 'De Pinte', 'Sint-Martens-Latem', 'Wondelgem',
      'Gentbrugge', 'Ledeberg', 'Mariakerke', 'Drongen', 'Zwijnaarde',
      'Oostakker', 'Sint-Amandsberg', 'Wetteren', 'Laarne', 'Lovendegem'
    ],
    zoektermen: ['dakdekker Gent', 'dakwerken Gent'],
    peildatum: '2026-07-14',
    updateDatum: 'juli 2026'
  };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log('✓ config/' + slug + '.json aangemaakt (testconfig)');
}
const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

// simpele deterministische pseudo-random
let seed = 42;
function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

const PEIL = new Date(config.peildatum + 'T00:00:00Z');
function daysAgo(n) {
  const d = new Date(PEIL); d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
function mkReviews(n, avgScore, maxAgeDays, minAgeDays) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const age = Math.floor(minAgeDays + rnd() * (maxAgeDays - minAgeDays));
    let s = Math.round(avgScore + (rnd() - 0.5) * 1.6);
    s = Math.max(1, Math.min(5, s));
    out.push({ score: s, datum: daysAgo(age), tekst: 'Testreview ' + (i + 1), auteur: 'Klant ' + (i + 1) });
  }
  return out;
}

const bedrijven = [
  { bedrijf: 'Dakwerken Ivens & Zonen', gemeente: 'Gent', website: 'https://dakwerken-ivens.be', googleScore: 4.9, reviews: mkReviews(87, 4.9, 2800, 10) },
  { bedrijf: 'Verlinden Dakwerken', gemeente: 'Merelbeke', website: 'https://verlinden-dak.be', googleScore: 4.8, reviews: mkReviews(64, 4.8, 2200, 20) },
  { bedrijf: 'Roofline Gent', gemeente: 'Gent', website: 'https://roofline.be', googleScore: 4.9, reviews: mkReviews(52, 4.9, 1400, 5) },
  { bedrijf: 'Dakwerken De Clercq', gemeente: 'Deinze', website: 'https://declercq-dak.be', googleScore: 4.7, reviews: mkReviews(41, 4.7, 2600, 30) },
  { bedrijf: 'Van Hecke Dak & Gevel', gemeente: 'Lochristi', website: null, googleScore: 4.8, reviews: mkReviews(38, 4.8, 1800, 15) },
  { bedrijf: 'Platdak Pro', gemeente: 'Evergem', website: 'https://platdakpro.be', googleScore: 4.6, reviews: mkReviews(29, 4.6, 1200, 8) },
  { bedrijf: 'Gents Dakhuis', gemeente: 'Gent', website: 'https://gentsdakhuis.be', googleScore: 4.5, reviews: mkReviews(55, 4.5, 3000, 40) },
  // breuk-case: oude zwakke reviews, recente sterke
  { bedrijf: 'Dakteam Nova', gemeente: 'Wetteren', website: 'https://dakteamnova.be', googleScore: 4.2,
    reviews: mkReviews(18, 3.4, 3200, 900).concat(mkReviews(22, 4.9, 700, 5)) },
  // alleen oude reviews → faalt op recentheid
  { bedrijf: 'Dakcentrale Oost', gemeente: 'Melle', website: 'https://dakcentrale.be', googleScore: 4.7, reviews: mkReviews(31, 4.7, 3400, 1100) },
  // te weinig reviews → wachtlijst
  { bedrijf: 'Dakwerken Nieuwenhove', gemeente: 'Gent', website: 'https://dakwerken-nieuwenhove.be', googleScore: 5.0, reviews: mkReviews(7, 5.0, 500, 10) },
  { bedrijf: 'Top Dak Vlaanderen', gemeente: 'Merelbeke', website: null, googleScore: 4.9, reviews: mkReviews(8, 4.9, 400, 20) },
  // buiten de gemeentelijst → volledig weggelaten
  { bedrijf: 'Dakwerken Kust', gemeente: 'Oostende', website: 'https://dakkust.be', googleScore: 4.8, reviews: mkReviews(45, 4.8, 1500, 10) },
  { bedrijf: 'EPDM Express', gemeente: 'Drongen', website: 'https://epdm-express.be', googleScore: 4.4, reviews: mkReviews(26, 4.4, 1600, 12) },
  { bedrijf: 'Zinkatelier Gent', gemeente: 'Gent', website: 'https://zinkatelier.be', googleScore: 4.9, reviews: mkReviews(33, 4.9, 1000, 3) }
];

// zelfde afgeleide velden als normalize.js (spiegel van build.js — daar is de bron van waarheid)
const MIN_REVIEWS = 10, MIN_RECENT = 3;
const MS_JAAR = 365.25 * 24 * 3600 * 1000;
const gemeentenNorm = new Set((config.gemeenten || []).map(g => String(g).toLowerCase().trim()));
bedrijven.forEach(b => {
  b.googleReviews = b.reviews.length;
  b.recent24 = b.reviews.filter(r => (PEIL - new Date(r.datum + 'T00:00:00Z')) / MS_JAAR <= 2).length;
  const inLijst = gemeentenNorm.has(String(b.gemeente).toLowerCase().trim());
  b.rankbaar = inLijst && b.googleReviews >= MIN_REVIEWS && b.recent24 >= MIN_RECENT;
});

const RQ = [4.5, 4.0, 4.5, 3.5, 4.0, 3.5, 3.0, 4.0, 3.5, 4.5, 4.0, 4.0, 3.0, 4.5];
const VF = [4.5, 4.0, 5.0, 3.5, null, 4.0, 3.0, 4.0, 3.5, 4.5, null, 4.5, 4.0, 5.0];
const beo = { bedrijven: bedrijven.map((b, i) => {
  const vf = b.website ? VF[i] : null;
  return {
    bedrijf: b.bedrijf,
    reviewkwaliteit: RQ[i],
    vakfocus: vf,
    vakfocusBron: vf != null ? 'website' : 'geen-website',
    websiteBezocht: vf != null ? b.website : null,
    actiefSinds: 2000 + (i % 20),
    specialties: ['hellende-daken', 'platte-daken', 'dakrenovatie'].slice(0, 2 + (i % 2)),
    chipsSite: vf != null ? ['Erkend aannemer'] : [],
    chipsReview: ['Stipt nagekomen', 'Nette werf'],
    synthese: 'Testsynthese voor ' + b.bedrijf + ': klanten vermelden consequent vakkundig werk en duidelijke communicatie.',
    breuk: b.bedrijf === 'Dakteam Nova' ? 'Reviews vóór 2024 waren gemengd; de laatste twee jaar tonen een duidelijk sterkere lijn.' : null
  };
}) };

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(outReviews, JSON.stringify(bedrijven, null, 2));
fs.writeFileSync(path.join(dir, 'beoordeling.json'), JSON.stringify(beo, null, 2));
console.log('✓ testdata geschreven voor ' + slug + ' (' + bedrijven.length + ' bedrijven)');
console.log('  volgende stap: node build.js ' + slug);
