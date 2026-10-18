// Self-host every hotlinked image (launch audit 15.10.26: 128 pages loaded icar.co.il photos, plus jsdelivr brand logos,
// unsplash / pexels / wikimedia / Google-Drive photos — 30 broken on car-bmw-ix1-m-sport-2025). Ported from
// center-lease/scripts/localize-ext-images.mjs. Each image is downloaded ONCE and the site points at the local copy:
//   - icar.co.il bgremoval photos   → images/loan/<file>.jpg (+ .webp twin)   (loan-cars.js, cars-data.js, *.html, cars.json rows)
//   - jsdelivr car-logos-dataset    → images/brands-cdn/<slug>.png            (models-data.js, brand.js, recommended-page.js)
//   - unsplash / pexels / wikimedia / Drive / youtube thumbs → images/ext/<name>.webp
//   - db-cars.js /*EXT-LOCAL*/ map  (sheet Drive ids + wikimedia URLs → local files) is regenerated
// Runs in the sync-cars GitHub Action BEFORE the prerender (new sheet photos), and locally:
//   node scripts/localize-ext-images.mjs [--dry]        (SHARP=<path to sharp> if it is not installed next to the repo)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const DRY = process.argv.includes('--dry');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
let sharp = null;
try { sharp = (await import(process.env.SHARP ? pathToFileURL(process.env.SHARP).href : 'sharp')).default; } catch (e) { console.warn('sharp not available — webp conversion skipped (jpg/png kept as-is)'); }
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, s) => { if (!DRY) fs.writeFileSync(path.join(ROOT, f), s); };
for (const d of ['images/ext', 'images/loan', 'images/brands-cdn']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });

// wrong-content sheet images: never shown (1894 London map sheet "IX.50" was the BMW iX50 photo)
const BLOCK = [/London_Sheet_IX\.50/i];
const ICAR = /https?:\/\/(?:www\.)?icar\.co\.il\/_media\/images\/models\/bgremoval\//g;
const LOGO_CDN = /https:\/\/cdn\.jsdelivr\.net\/gh\/filippofilip95\/car-logos-dataset(?:@master)?\/logos\/optimized\//g;

async function fetchBuf(urls) {
  for (const u of [].concat(urls)) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', Referer: 'https://www.icar.co.il/' } });
      const ct = r.headers.get('content-type') || '';
      if (!r.ok || !/^image\//.test(ct)) continue;
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length > 1000) return b;
    } catch (e) { /* try next */ }
  }
  return null;
}
const failed = [];
const cache = {};
// raw copy (jpg/png kept) + optional webp twin
async function saveRaw(rel, urls, webpTwin) {
  if (cache[rel] !== undefined) return cache[rel];
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) return (cache[rel] = rel);
  if (DRY) return (cache[rel] = rel);
  const buf = await fetchBuf(urls);
  if (!buf) { failed.push(rel + ' ← ' + [].concat(urls)[0]); return (cache[rel] = null); }
  fs.writeFileSync(abs, buf);
  if (webpTwin && sharp) { try { await sharp(buf).webp({ quality: 82 }).toFile(abs.replace(/\.(jpe?g|png)$/i, '.webp')); } catch (e) {} }
  return (cache[rel] = rel);
}
async function saveWebp(name, urls) {
  const rel = 'images/ext/' + name + '.webp', abs = path.join(ROOT, rel);
  if (cache[rel] !== undefined) return cache[rel];
  if (fs.existsSync(abs)) return (cache[rel] = rel);
  if (DRY) return (cache[rel] = rel);
  const buf = await fetchBuf(urls);
  if (!buf) { failed.push(rel + ' ← ' + [].concat(urls)[0]); return (cache[rel] = null); }
  if (sharp) await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(abs);
  else fs.writeFileSync(abs, buf); // browsers sniff the real type
  return (cache[rel] = rel);
}

const URL_RE = /https?:\/\/(?:images\.unsplash\.com\/photo-[\w-]+|images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpe?g|upload\.wikimedia\.org\/[^\s"'<>)\\]+\.(?:jpe?g|png|webp)|lh3\.googleusercontent\.com\/d\/[\w-]{20,}|img\.youtube\.com\/vi\/[\w-]{6,}\/\w+\.jpg|i\.ytimg\.com\/vi\/[\w-]{6,}\/\w+\.jpg)(?:\?[^\s"'<>)\\]*)?/g;
function ytKey(id) { return { name: 'yt-' + id, urls: [`https://img.youtube.com/vi/${id}/maxresdefault.jpg`, `https://img.youtube.com/vi/${id}/hqdefault.jpg`] }; }
function keyOf(u) {
  let m;
  if ((m = u.match(/images\.unsplash\.com\/photo-([\w-]+)/))) return { name: 'unsplash-' + m[1], urls: [`https://images.unsplash.com/photo-${m[1]}?w=1600&q=80&auto=format&fit=crop`] };
  if ((m = u.match(/images\.pexels\.com\/photos\/(\d+)\//))) return { name: 'pexels-' + m[1], urls: [`https://images.pexels.com/photos/${m[1]}/pexels-photo-${m[1]}.jpeg?auto=compress&cs=tinysrgb&w=1600`] };
  if ((m = u.match(/lh3\.googleusercontent\.com\/d\/([\w-]{20,})/))) return { name: 'drive-' + m[1], urls: [`https://lh3.googleusercontent.com/d/${m[1]}=w1600`, `https://drive.google.com/uc?export=download&id=${m[1]}`] };
  if ((m = u.match(/(?:img\.youtube\.com|i\.ytimg\.com)\/vi\/([\w-]{6,})\//))) return ytKey(m[1]);
  if ((m = u.match(/upload\.wikimedia\.org\/.*\/([^/?]+?)\.(?:jpe?g|png|webp)/i))) {
    if (BLOCK.some((re) => re.test(u))) return null;
    return { name: 'wm-' + decodeURIComponent(m[1]).replace(/^\d+px-/, '').replace(/[^\w.-]+/g, '_').slice(0, 80), urls: [u.replace(/&amp;/g, '&')] };
  }
  return null;
}

const SRC = fs.readdirSync(ROOT).filter((f) => /\.(html|js)$/.test(f) && f !== 'sign.html' && f !== 'reset.html');

// ---------- 1) icar.co.il photos (code + pages + sheet rows) ----------
{
  const files = new Set();
  for (const f of SRC) for (const m of rd(f).matchAll(/icar\.co\.il\/_media\/images\/models\/bgremoval\/([A-Za-z0-9._-]+\.(?:jpe?g|png|webp))/g)) files.add(m[1]);
  // loan-cars.js builds its seed paths as I + 'file.jpg' (I = the icar prefix, now 'images/loan/')
  for (const m of rd('loan-cars.js').matchAll(/\bI\s*\+\s*'([A-Za-z0-9._-]+\.(?:jpe?g|png))'/g)) files.add(m[1]);
  try { for (const r of JSON.parse(rd('cars.json'))) for (const k of ['img', 'imgL', 'imgB', 'imgR']) { const m = String(r[k] || '').match(/icar\.co\.il\/_media\/images\/models\/bgremoval\/([A-Za-z0-9._-]+)/); if (m) files.add(m[1]); } } catch (e) {}
  for (const f of files) await saveRaw('images/loan/' + f, ['https://www.icar.co.il/_media/images/models/bgremoval/' + f], true);
  let n = 0;
  for (const f of SRC) { const s = rd(f); if (!ICAR.test(s)) continue; ICAR.lastIndex = 0; const o = s.replace(ICAR, 'images/loan/'); if (o !== s) { wr(f, o); n++; } }
  console.log('icar photos', files.size, '· files rewritten', n);
}

// ---------- 2) jsdelivr brand logos ----------
{
  const slugs = new Set();
  for (const f of ['models-data.js', 'brand.js', 'recommended-page.js', 'used-cars.js', 'cars-data.js']) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    const s = rd(f);
    for (const m of s.matchAll(/\bslug\s*:\s*'([a-z0-9-]+)'/g)) slugs.add(m[1]);
    const lm = s.match(/var LOGO_SLUG = \{([\s\S]*?)\};/); if (lm) for (const m of lm[1].matchAll(/:\s*'([a-z0-9-]+)'/g)) slugs.add(m[1]);
  }
  for (const f of SRC) for (const m of rd(f).matchAll(/car-logos-dataset(?:@master)?\/logos\/optimized\/([a-z0-9-]+)\.png/g)) slugs.add(m[1]);
  let ok = 0;
  for (const sl of slugs) if (await saveRaw('images/brands-cdn/' + sl + '.png', ['https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/' + sl + '.png'], false)) ok++;
  let n = 0;
  for (const f of SRC) { const s = rd(f); const o = s.replace(LOGO_CDN, 'images/brands-cdn/'); if (o !== s) { wr(f, o); n++; } }
  console.log('logo slugs', slugs.size, 'saved', ok, '· files rewritten', n);
}

// ---------- 3) literal unsplash / pexels / wikimedia / drive / youtube URLs in pages + data files ----------
{
  let n = 0;
  for (const f of SRC) {
    if (f === 'db-cars.js') continue; // its EXT_LOCAL map is keyed by the original sheet URLs (step 4)
    const s = rd(f); const found = [...new Set(s.match(URL_RE) || [])];
    if (!found.length) continue;
    let o = s;
    for (const u of found) {
      const k = keyOf(u); if (!k) continue;
      const rel = await saveWebp(k.name, k.urls); if (!rel) continue;
      // og/twitter image meta must stay absolute
      o = o.split(`content="${u}"`).join(`content="https://car2buy.co.il/${rel}"`).split(u).join(rel);
    }
    if (o !== s) { wr(f, o); n++; }
  }
  // stock-photo builders in models-data.js
  let s = rd('models-data.js');
  for (const m of s.matchAll(/\bU\('([\w-]+)'/g)) await saveWebp('unsplash-' + m[1], keyOf('https://images.unsplash.com/photo-' + m[1]).urls);
  for (const m of s.matchAll(/\bP\('(\d+)'/g)) await saveWebp('pexels-' + m[1], keyOf(`https://images.pexels.com/photos/${m[1]}/pexels-photo-${m[1]}.jpeg`).urls);
  const o = s
    .replace(/const U = \(id, w\) => `https:\/\/images\.unsplash\.com\/photo-\$\{id\}\?w=\$\{w \|\| 1200\}&q=80&auto=format&fit=crop`;/, 'const U = (id) => `images/ext/unsplash-${id}.webp`; // self-hosted copies (scripts/localize-ext-images.mjs)')
    .replace(/const P = \(id, w\) => `https:\/\/images\.pexels\.com\/photos\/\$\{id\}\/pexels-photo-\$\{id\}\.jpeg\?auto=compress&cs=tinysrgb&w=\$\{w \|\| 1200\}`;/, 'const P = (id) => `images/ext/pexels-${id}.webp`;');
  if (o !== s) wr('models-data.js', o);
  // youtube posters used by brand.js
  if (fs.existsSync(path.join(ROOT, 'car-videos.js'))) {
    const sb = { window: {} }; try { vm.runInNewContext(rd('car-videos.js'), sb); } catch (e) {}
    const ids = [...new Set(Object.values(sb.window.C2B_CAR_VIDEOS || {}))];
    for (const id of ids) { const k = ytKey(id); await saveWebp(k.name, k.urls); }
    const b = rd('brand.js');
    const ob = b.replace("var bvPoster = brandVideo ? 'https://img.youtube.com/vi/' + brandVideo + '/maxresdefault.jpg'",
      "var bvPoster = brandVideo ? 'images/ext/yt-' + brandVideo + '.webp' // self-hosted (scripts/localize-ext-images.mjs)");
    if (ob !== b) wr('brand.js', ob);
  }
  console.log('pages/data rewritten (ext photos)', n);
}

// ---------- 3b) repair: local paths already rewritten by an earlier run whose file is missing ----------
{
  const want = new Set();
  for (const f of SRC) for (const m of rd(f).matchAll(/images\/(ext\/(?:unsplash|pexels|drive|yt)-[\w-]+\.webp|loan\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp))/g)) want.add(m[1]);
  let fixed = 0;
  for (const w of want) {
    if (fs.existsSync(path.join(ROOT, 'images', w))) continue;
    let m;
    if ((m = w.match(/^loan\/(.+)\.(jpe?g|png|webp)$/))) {
      const base = m[1], jpg = 'images/loan/' + base + '.jpg';
      const r = await saveRaw(jpg, ['https://www.icar.co.il/_media/images/models/bgremoval/' + base + '.jpg'], true);
      if (r) fixed++;
    } else if ((m = w.match(/^ext\/unsplash-([\w-]+)\.webp$/))) { if (await saveWebp('unsplash-' + m[1], keyOf('https://images.unsplash.com/photo-' + m[1]).urls)) fixed++; }
    else if ((m = w.match(/^ext\/pexels-(\d+)\.webp$/))) { if (await saveWebp('pexels-' + m[1], keyOf(`https://images.pexels.com/photos/${m[1]}/pexels-photo-${m[1]}.jpeg`).urls)) fixed++; }
    else if ((m = w.match(/^ext\/drive-([\w-]+)\.webp$/))) { if (await saveWebp('drive-' + m[1], keyOf('https://lh3.googleusercontent.com/d/' + m[1]).urls)) fixed++; }
    else if ((m = w.match(/^ext\/yt-([\w-]+)\.webp$/))) { const k = ytKey(m[1]); if (await saveWebp(k.name, k.urls)) fixed++; }
  }
  console.log('repaired missing local images', fixed);
}

// ---------- 4) sheet images (cars.json) → db-cars.js EXT-LOCAL map ----------
{
  const rows = JSON.parse(rd('cars.json'));
  const map = {}, dead = [];
  for (const r of rows) {
    for (const v of [r.img, r.imgL, r.imgB, r.imgR]) {
      const s = String(v || '').trim(); if (!s) continue;
      if (BLOCK.some((re) => re.test(s))) continue;
      if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(s)) continue;
      const d = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/) || s.match(/lh3\.googleusercontent\.com\/d\/([\w-]{20,})/);
      if (d) { const rel = await saveWebp('drive-' + d[1], keyOf('https://lh3.googleusercontent.com/d/' + d[1]).urls); if (rel) map[d[1]] = rel; else dead.push(d[1]); continue; }
      if (/^https?:\/\/(upload\.wikimedia\.org|images\.unsplash\.com|images\.pexels\.com)\//.test(s)) { const k = keyOf(s); if (k) { const rel = await saveWebp(k.name, k.urls); if (rel) map[s] = rel; } }
    }
  }
  const block = '/*EXT-LOCAL*/ var EXT_LOCAL = ' + JSON.stringify(map) + '; var EXT_DEAD = ' + JSON.stringify([...new Set(dead)]) + '; var EXT_BLOCK = [' + BLOCK.map(String).join(', ') + ']; /*/EXT-LOCAL*/';
  const s = rd('db-cars.js');
  const o = s.replace(/\/\*EXT-LOCAL\*\/[\s\S]*?\/\*\/EXT-LOCAL\*\//, block);
  if (o === s && !s.includes(block)) console.warn('db-cars.js: /*EXT-LOCAL*/ marker not found — map not written');
  else wr('db-cars.js', o);
  console.log('sheet images mapped', Object.keys(map).length, '· dead (private) Drive files', new Set(dead).size);
}

console.log({ saved: Object.values(cache).filter(Boolean).length, failed: failed.length, dry: DRY });
if (failed.length) console.log('FAILED:\n' + failed.join('\n'));
