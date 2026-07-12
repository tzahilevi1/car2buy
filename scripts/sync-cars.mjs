// ============================================================
//  Car2Buy — sync NEW-car inventory from the Google Sheet into
//  cars.json (committed to the repo). Run by GitHub Actions on a
//  schedule so the site auto-updates whenever the Sheet changes.
//  Server-side fetch → no CORS. No credentials needed (Sheet is
//  shared "anyone with the link can view").
// ============================================================
import { writeFileSync, readFileSync } from 'node:fs';

const SHEET_ID = '1LiK--j3BCPnHO4rZQj7N2RetdnExEmwimWTwn7kmWe8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const OUT = new URL('../cars.json', import.meta.url);

// Hebrew brand tokens (longest-match first) to split "ב.י.ד אטו 2" → brand + model.
// Includes spelling variants seen in the sheet; NORM canonicalises them.
const BRANDS = [
  'ב.י.ד', "ג'אקו", "צ'רי", 'יונדאי', 'טויוטה', 'ליפמוטור', 'קיה', 'מיצובישי', "אמ.ג'י", "אמ. ג'י",
  'סקודה', "קיי.ג'י.אם", 'אווטר', 'ניסאן', 'סיאט', 'סיטרואן', 'אומודה', 'שברולט', 'GMC', "ג'י.אם.סי",
  'ב.מ.וו', 'במוו', 'מאזדה', 'זיקר', 'סובארו', 'מרצדס', 'סמארט', 'וויה', 'סקיוואל', 'אאודי', 'אוודי',
  'טסלה', 'פורשה', 'לקסוס', 'וולוו', 'פולקסווגן', 'רנו', 'פיג\'ו', 'אופל', 'הונדה', 'לאנצ\'יה', 'דונפנג'
].sort((a, b) => b.length - a.length);
// canonical spelling for consistent brand filtering on the site
const NORM = { 'במוו': 'ב.מ.וו', 'אוודי': 'אאודי', "אמ. ג'י": "אמ.ג'י", "ג'י.אם.סי": 'GMC' };

function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (c !== '\r') cur += c; }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const numOf = (s) => { const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };
function splitBrand(heb) {
  heb = (heb || '').replace(/\s+/g, ' ').trim();
  // 1) brand as a prefix
  for (const b of BRANDS) if (heb === b || heb.startsWith(b + ' ')) return finalize(b, heb.slice(b.length));
  // 2) brand appearing anywhere (sheet sometimes puts it mid-string)
  for (const b of BRANDS) { const idx = heb.indexOf(b); if (idx >= 0) return finalize(b, (heb.slice(0, idx) + ' ' + heb.slice(idx + b.length))); }
  // 3) fallback: first token is the brand
  const sp = heb.indexOf(' ');
  return sp > 0 ? finalize(heb.slice(0, sp), heb.slice(sp + 1)) : finalize(heb, heb);
}
function finalize(brand, name) {
  brand = (brand || '').trim();
  return { brand: NORM[brand] || brand, name: (name || '').replace(/\s+/g, ' ').trim() };
}

const res = await fetch(CSV_URL, { redirect: 'follow' });
if (!res.ok) { console.error('sheet fetch failed', res.status); process.exit(1); }
const rows = parseCSV(await res.text());
let h = rows.findIndex((r) => r.some((c) => /החזר חודשי 60/.test(c)));
if (h < 0) { console.error('header row not found'); process.exit(1); }

const cars = [];
for (let i = h + 1; i < rows.length; i++) {
  const r = rows[i];
  const heb = (r[18] || '').trim();
  if (!heb) continue;
  const { brand, name } = splitBrand(heb);
  const m = numOf(r[9]);      // החזר חודשי 60%
  const p = numOf(r[21]) || numOf(r[19]); // מחירון מימון ישיר / מחירון
  const img = (r[22] || '').trim(); // תמונה ראשית
  if (!name || (!m && !p)) continue; // skip incomplete rows
  cars.push({ brand, name, trim: (r[16] || '').trim(), m, p, img,
    seats: numOf(r[14]) || 5, engine: (r[12] || '').trim() });
}

const json = JSON.stringify(cars, null, 0);
let prev = '';
try { prev = readFileSync(OUT, 'utf8'); } catch {}
if (prev.trim() === json.trim()) { console.log('no change (' + cars.length + ' cars)'); process.exit(0); }
writeFileSync(OUT, json + '\n');
console.log('wrote cars.json —', cars.length, 'cars');
