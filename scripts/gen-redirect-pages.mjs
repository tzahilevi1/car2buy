// car2buy.co.il is on GitHub Pages, which IGNORES _redirects (a Cloudflare Pages file) — so all ~500 old WordPress
// URLs returned 404 while they still held ~76% of the site's Google impressions (SEO audit 7.10.26).
// GitHub Pages cannot send a real 301, so each old path gets a static page with an instant meta refresh +
// rel=canonical + JS replace — Google treats an instant meta refresh as a permanent redirect.
// Source of truth stays _redirects (+ EXTRA below). Re-run after editing it:  node scripts/gen-redirect-pages.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const ORIGIN = 'https://car2buy.co.il';
const dry = process.argv.includes('--dry');
const enc = (s) => encodeURIComponent(s);
// old URLs with Google impressions that had no rule
const EXTRA = [
  ['/car-catalog/citroen-jumpy/', '/brand.html?brand=' + enc('סיטרואן')],
  ['/cars_manufacturer/opel/', '/brands.html'],
  ['/cars_manufacturer/fiat/', '/brands.html'],
  ['/car-catalog/' + enc('לנד-קררוזר') + '/', '/brand.html?brand=' + enc('טויוטה')],
  ['/car_type/' + enc('מיןי') + '/', '/models.html'],
];
// never send ranking equity to a noindex page
const RETARGET = { '/thank-you.html': '/', '/testimonials.html': '/customers.html' };
const rules = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)
  .filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.trim().split(/\s+/)).filter((r) => r.length >= 2 && r[0] !== '/');
const all = [...rules.map((r) => [r[0], r[1]]), ...EXTRA];
const html = (to) => {
  const abs = ORIGIN + to, a = abs.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>העמוד עבר · Car2Buy</title>` +
    `<link rel="canonical" href="${a}"><meta http-equiv="refresh" content="0; url=${a}">` +
    `<script>location.replace(${JSON.stringify(abs)}+location.hash)</script></head>` +
    `<body><p>העמוד עבר לכתובת חדשה: <a href="${a}">${a}</a></p></body></html>\n`;
};
let made = 0, skipped = [], seen = new Set();
for (let [from, to] of all) {
  to = RETARGET[to.split('?')[0]] ? RETARGET[to.split('?')[0]] : to;
  let rel; try { rel = decodeURIComponent(from).replace(/^\/+/, ''); } catch { skipped.push(from + ' (bad encoding)'); continue; }
  if (!rel || /[<>:"|?*\\]/.test(rel)) { skipped.push(from + ' (unsafe path)'); continue; }
  const dir = path.join(ROOT, rel), file = path.join(dir, 'index.html');
  const key = rel.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
  if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes('העמוד עבר · Car2Buy')) { skipped.push(from + ' (real page exists)'); continue; }
  // /about/ /contact/ /trade-in/ sit next to about.html etc. — GitHub Pages does not serve x.html for 'x/', so the
  // trailing-slash form 404s today; a folder redirect page fixes it (x.html itself is untouched).
  if (!dry) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, html(to)); }
  made++;
}
console.log({ rules: all.length, made, skipped: skipped.length, dry });
if (skipped.length) console.log(skipped.join('\n'));
