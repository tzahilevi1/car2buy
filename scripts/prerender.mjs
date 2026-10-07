// Prerender one static page per inventory car: /car-<seo-slug> (SEO 7.10.26).
// Why: car.html?car=… is a JS shell — raw HTML had no title/H1/specs ("הרכב לא נמצא") and the ids (sheetN) moved
// whenever the sheet was reordered. This renders each car in headless Chrome with the site's own JS and bakes the
// result (#carDetail, title, description, canonical, og, JSON-LD) into car-<slug>.html. The page JS still boots
// (window.C2B_PAGE.car) and refreshes live prices; if the car can't be resolved live, the static content stays.
// Run before every deploy and after every inventory sync:  node scripts/prerender.mjs [--only=<slug>]
// Needs puppeteer-core + Chrome (PUPPETEER_CORE env or the scratchpad copy).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const ORIGIN = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<link rel="canonical" href="(https:\/\/[^/"]+)/) || [])[1];
if (!ORIGIN) { console.error('no canonical origin on index.html'); process.exit(1); }
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PUP = process.env.PUPPETEER_CORE || 'C:/Users/zahci/AppData/Local/Temp/claude/C--Users-zahci/9f0146d4-43c5-4fc1-8d1f-8c2959f5e7ee/scratchpad/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const puppeteer = (await import(pathToFileURL(PUP).href)).default;
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);

const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split(/[?#]/)[0]); let f = path.join(ROOT, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html'); else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(0);
const base = 'http://localhost:' + srv.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: process.env.CI ? ['--no-sandbox'] : [] });

async function page() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.setRequestInterception(true);
  // local files + the public registry API the page uses for specs; no analytics/ads/fonts/video
  p.on('request', (r) => { const u = r.url(); (u.startsWith(base) || /data\.gov\.il/.test(u)) && !/\.mp4/.test(u) ? r.continue() : r.abort(); });
  return p;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// 1) the live inventory with stable slugs
const p0 = await page();
await p0.goto(base + '/models', { waitUntil: 'domcontentloaded' });
await p0.waitForFunction(() => window.Car2Buy && !window.Car2Buy.carsLoading && (window.Car2Buy.LOAN_CARS || []).some((c) => c.seo), { timeout: 20000 });
const cars = await p0.evaluate(() => window.Car2Buy.LOAN_CARS.filter((c) => c.seo).map((c) => ({ id: c.id, seo: c.seo, name: c.brand + ' ' + c.name })));
await p0.close();
console.log('inventory', cars.length);

const TPL = fs.readFileSync(path.join(ROOT, 'car.html'), 'utf8');
if (!TPL.includes('<div id="carDetail"></div>')) { console.error('car.html: empty #carDetail anchor not found'); process.exit(1); }
const made = [], failed = [];
for (const c of cars) {
  if (only && c.seo !== only) continue;
  const p = await page();
  try {
    await p.goto(`${base}/car.html?car=${encodeURIComponent(c.id)}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => { const r = document.getElementById('carDetail'); return r && r.querySelector('h1') && /\S/.test(r.querySelector('h1').textContent) && !/לא נמצא/.test(r.textContent.slice(0, 400)); }, { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1800)); // registry specs + late sections
    const d = await p.evaluate((id) => {
      const lc = (window.Car2Buy.LOAN_CARS || []).filter((x) => x.id === id)[0] || {};
      const car = { brand: lc.brand, name: lc.name, trim: lc.trim, nameEn: lc.nameEn, p: lc.p, m: lc.m, img: lc.img };
      const r = document.getElementById('carDetail');
      const clone = r.cloneNode(true);
      clone.querySelectorAll('script:not([type="application/ld+json"])').forEach((s) => s.remove());
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).filter((t) => /"(Car|Vehicle|Product|BreadcrumbList|FAQPage)"/.test(t));
      return { car, html: clone.innerHTML, title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content || '', img: (document.querySelector('meta[property="og:image"]') || {}).content || '', ld };
    }, c.id);
    const url = `${ORIGIN}/car-${c.seo}`;
    // Car + Offer (real sheet price only — no ratings/reviews) and breadcrumbs
    const k = d.car, enBrand = /^[A-Za-z]/.test(k.nameEn || '') ? k.nameEn.split(/\s+/)[0] : k.brand;
    const name = (k.nameEn || (k.brand + ' ' + k.name)) + (k.trim ? ' ' + k.trim : '');
    const carLd = { '@context': 'https://schema.org', '@type': 'Car', name, brand: { '@type': 'Brand', name: enBrand }, model: k.name, url,
      ...(k.trim ? { vehicleConfiguration: k.trim } : {}), ...(k.img ? { image: new URL(k.img, ORIGIN + '/').href } : {}), description: d.desc, itemCondition: 'https://schema.org/NewCondition',
      ...(k.p > 0 ? { offers: { '@type': 'Offer', price: k.p, priceCurrency: 'ILS', availability: 'https://schema.org/InStock', url } } : {}) };
    const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ראשי', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'קטלוג רכבים', item: ORIGIN + '/models' },
      { '@type': 'ListItem', position: 3, name: k.brand, item: ORIGIN + '/brand?brand=' + encodeURIComponent(k.brand) },
      { '@type': 'ListItem', position: 4, name, item: url }] };
    d.ld = [JSON.stringify(carLd), JSON.stringify(crumbs)];
    const headAdd = `<meta name="description" content="${esc(d.desc)}">\n<link rel="canonical" href="${url}">\n` +
      `<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.desc)}">` +
      (d.img ? `<meta property="og:image" content="${esc(d.img)}">` : '') + '\n' +
      d.ld.map((t) => `<script type="application/ld+json">${t.replace(/</g, '\\u003c')}</script>`).join('\n') + '\n' +
      `<script>window.C2B_PAGE={car:${JSON.stringify(c.seo)}};</script>\n`;
    let out = TPL.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(d.title)}</title>`)
      .replace(/<meta name="description"[^>]*>\s*/g, '').replace(/<meta property="og:(url|title|description|image)"[^>]*>\s*/g, '')
      .replace('</title>', '</title>\n' + headAdd)
      .replace('<div id="carDetail"></div>', `<div id="carDetail">${d.html}</div>`);
    fs.writeFileSync(path.join(ROOT, `car-${c.seo}.html`), out);
    made.push(c.seo);
  } catch (e) { failed.push(c.seo + ' (' + c.id + '): ' + e.message.slice(0, 80)); }
  await p.close();
}
// remove pages of cars that left the inventory (full runs only)
if (!only) for (const f of fs.readdirSync(ROOT)) if (/^car-[a-z0-9-]+\.html$/.test(f) && f !== 'car-loan.html' && !made.includes(f.slice(4, -5))) { fs.unlinkSync(path.join(ROOT, f)); console.log('removed stale', f); }

// 2) one static page per stocked brand: /brand-<slug> (brand.html?brand=<hebrew> keeps working, canonical → static)
const BTPL = fs.readFileSync(path.join(ROOT, 'brand.html'), 'utf8');
const bAnchor = '<main id="brandPage"></main>';
const madeB = [];
if (!only && BTPL.includes(bAnchor)) {
  const pb = await page();
  await pb.goto(base + '/models', { waitUntil: 'domcontentloaded' });
  await pb.waitForFunction(() => window.Car2Buy && !window.Car2Buy.carsLoading && window.Car2Buy.brandSlug, { timeout: 20000 });
  const brands = await pb.evaluate(() => { const C = window.Car2Buy, seen = {}; return C.LOAN_CARS.map((c) => c.brand).filter((b) => b && !seen[b] && (seen[b] = 1)).map((b) => ({ b, slug: C.brandSlug(b), cars: C.LOAN_CARS.filter((c) => c.brand === b && c.seo).map((c) => ({ seo: c.seo, name: (c.nameEn || c.name) + (c.trim ? ' ' + c.trim : '') })) })).filter((x) => x.slug); });
  await pb.close();
  for (const B of brands) {
    const p = await page();
    try {
      await p.goto(`${base}/brand.html?brand=${encodeURIComponent(B.b)}`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => { const r = document.getElementById('brandPage'); return r && r.querySelector('h1') && /\S/.test(r.querySelector('h1').textContent); }, { timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1200));
      const d = await p.evaluate(() => {
        const clone = document.getElementById('brandPage').cloneNode(true);
        clone.querySelectorAll('script:not([type="application/ld+json"])').forEach((s) => s.remove());
        return { html: clone.innerHTML, title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content || '' };
      });
      const url = `${ORIGIN}/brand-${B.slug}`;
      const ld = [
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ראשי', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'קטלוג רכבים', item: ORIGIN + '/models' },
          { '@type': 'ListItem', position: 3, name: B.b, item: url }] },
        { '@context': 'https://schema.org', '@type': 'ItemList', name: d.title, itemListElement: B.cars.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: `${ORIGIN}/car-${c.seo}` })) }];
      const headAdd = `<meta name="description" content="${esc(d.desc)}">\n<link rel="canonical" href="${url}">\n` +
        `<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.desc)}">\n` +
        ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n') + '\n' +
        `<script>window.C2B_PAGE={brand:${JSON.stringify(B.b)}};</script>\n`;
      const out = BTPL.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(d.title)}</title>`)
        .replace(/<meta name="description"[^>]*>\s*/g, '').replace(/<link rel="canonical"[^>]*>\s*/g, '').replace(/<meta property="og:(url|title|description)"[^>]*>\s*/g, '')
        .replace('</title>', '</title>\n' + headAdd).replace(bAnchor, `<main id="brandPage">${d.html}</main>`);
      fs.writeFileSync(path.join(ROOT, `brand-${B.slug}.html`), out);
      madeB.push(B.slug);
    } catch (e) { failed.push('brand ' + B.b + ': ' + e.message.slice(0, 80)); }
    await p.close();
  }
  for (const f of fs.readdirSync(ROOT)) if (/^brand-[a-z0-9-]+\.html$/.test(f) && f !== 'brand-article.html' && !madeB.includes(f.slice(6, -5))) { fs.unlinkSync(path.join(ROOT, f)); console.log('removed stale', f); }
}
if (!only) fs.writeFileSync(path.join(ROOT, 'scripts', '_prerendered.json'), JSON.stringify({ at: new Date().toISOString(), cars: made, brands: madeB }, null, 1));
console.log({ cars: made.length, brands: madeB.length, failed });
await browser.close(); srv.close();
