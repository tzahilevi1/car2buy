// sitemap.xml from what is actually indexable (SEO audit 7.10.26: only 23 URLs were listed — 48 model landing pages
// and every brand page were missing). Pages: own canonical, no noindex, templates skipped. Brand pages: one per
// inventory brand (brand.html?brand=X — the canonical keeps ?brand= since 7.10.26). Re-run after adding pages.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const BASE = 'https://car2buy.co.il';
const SKIP = new Set(['car.html', 'brand.html', 'article.html', 'brand-article.html', 'used-car.html', 'model.html', 'thank-you.html', 'thanks.html', '404.html', 'sign.html', 'reset.html', 'lp-studio.html', 'landings.html']);
const today = new Date().toISOString().slice(0, 10);
const urls = [];
const add = (loc, pr) => urls.push(`  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`);
for (const f of fs.readdirSync(ROOT).sort()) {
  if (!f.endsWith('.html') || SKIP.has(f)) continue;
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/<meta[^>]+noindex/i.test(s)) continue;
  const c = s.match(/<link rel="canonical" href="([^"]+)"/);
  if (!c || !c[1].startsWith(BASE)) continue;
  add(c[1], f === 'index.html' ? '1.0' : f.startsWith('lp-') ? '0.7' : '0.8');
}
// campaign landing folders (/jaecoo7/ …) with their own canonical
for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
  const p = path.join(ROOT, d.name, 'index.html');
  if (!d.isDirectory() || !fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes('העמוד עבר · Car2Buy') || /<meta[^>]+noindex/i.test(s)) continue;
  const c = s.match(/<link rel="canonical" href="([^"]+)"/); if (c && c[1].startsWith(BASE)) add(c[1], '0.6');
}
// prerendered /brand-<slug> pages (listed above via their canonical) replace the ?brand= URLs
const staticBrands = fs.readdirSync(ROOT).some((f) => /^brand-(?!article\.html)[a-z0-9-]+\.html$/.test(f));
const brands = staticBrands ? [] : [...new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'cars.json'), 'utf8')).map((c) => c.brand).filter(Boolean))];
for (const b of brands) add(`${BASE}/brand?brand=${encodeURIComponent(b)}`, '0.7');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].join('\n')}\n</urlset>\n`);
console.log('sitemap urls', new Set(urls).size, 'brands', brands.length);
