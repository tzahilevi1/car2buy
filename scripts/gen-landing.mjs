// Generates a bold cinematic landing page per catalog model (lp-<folder>.html) from scripts/lp-template.html.
// Honest content only: real catalog data (name/brand/monthly/seats/photos) + Car2Buy's real offer.
//
// 15.10.26 (launch audit): the generator had drifted from the live pages — it read a template file that no longer
// existed (jaecoo8-bold) and still emitted the fake-success form, the hard-coded Meta Pixel, no consent default /
// cookie bar and the red-line claims. The page markup now lives in scripts/lp-template.html (built from the fully
// patched live page), so regenerating keeps: success only after submitLead resolves true (C2B_formSend), the unchecked
// consent box, Consent Mode default before GTM, cookie-bar.js, CSP incl. the GTM OpenAI tag host, "עד 100% מימון*"
// wording + footnote, and ?v= cache-busting (same stamp as index.html / site.js).
// Campaign URLs that ads point at are generated under their own slug (CAMPAIGN) — never as lp-<folder>.
//   node scripts/gen-landing.mjs            (run from the repo root)
import fs from 'fs';

const ROOT = process.cwd();
const TPL = fs.readFileSync(ROOT + '/scripts/lp-template.html', 'utf8');
// cache-bust stamp shared with the rest of the site (index.html → site.js?v=<stamp>)
const V = ((fs.readFileSync(ROOT + '/index.html', 'utf8').match(/site\.js\?v=(\d+)/) || [])[1]) || String(Math.floor(Date.now() / 1000));
// live ad campaigns land on these exact paths (with and without trailing slash — the folder/index.html stubs redirect)
const CAMPAIGN = { 'jaecoo-7': 'jaecoo7', 'byd-sealu': 'byd-seal-u-ev', 'zeekr-x': 'zeekrx' };

// --- load catalog + gallery map ---
// (loan-cars.js is a repo file; its GALLERIES literal uses the g6() helper below)
const g6 = (folder) => ['ext1','ext2','ext3','ext4','int5','int6'].map(n => `images/gallery/${folder}/${n}.jpg`);
const src = fs.readFileSync(ROOT + '/loan-cars.js', 'utf8');
const GALLERIES = eval('(' + src.match(/var GALLERIES = (\{[\s\S]*?\n  \});/)[1] + ')');
const cars = JSON.parse(fs.readFileSync(ROOT + '/cars.json', 'utf8'));

const folderOf = (g) => { if (!g || !g.length) return null; const m = g[0].match(/images\/gallery\/([^/]+)\//); return m ? m[1] : null; };
const groups = {};
for (const c of cars) {
  const g = GALLERIES[(c.brand || '') + '|' + (c.name || '')];
  const f = folderOf(g);
  if (!f) continue;
  if (!groups[f]) groups[f] = { folder: f, brand: c.brand, name: c.name, nameEn: c.nameEn, m: c.m || 0, seats: c.seats || 5, gallery: g };
  const cm = c.m || 0;
  if (cm > 0 && (groups[f].m === 0 || cm < groups[f].m)) { groups[f].m = cm; groups[f].name = c.name; groups[f].nameEn = c.nameEn; groups[f].seats = c.seats || groups[f].seats; }
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nis = (n) => '₪' + Number(n).toLocaleString('en-US');

// English brand + clean English model display names (nice typography for the hero)
const BRAND_EN = { 'אאודי':'Audi','אווטר':'Avatr','אומודה':'Omoda',"אמ.ג'י":'MG','ב.י.ד':'BYD','ב.מ.וו':'BMW',"ג'אקו":'Jaecoo','דונפנג':'Dongfeng','זיקר':'Zeekr','טויוטה':'Toyota','יונדאי':'Hyundai','ליפמוטור':'Leapmotor','מאזדה':'Mazda','מיצובישי':'Mitsubishi','מרצדס':'Mercedes-Benz','ניסאן':'Nissan','סיטרואן':'Citroën','סמארט':'smart','סקודה':'Škoda',"צ'רי":'Chery','קיה':'Kia' };
const MODEL_EN = {
  'audi-a3':'A3 Sportback','audi-q3':'Q3 Sportback','audi-q5':'Q5 Sportback',
  'bmw-2gc':'216 Gran Coupé','bmw-4gc':'420i Gran Coupé','bmw-5':'530e','bmw-ix':'iX','bmw-ix2':'iX2',
  'byd-atto2':'Atto 2','byd-seal5':'Seal 5 DM-i','byd-sealion5':'Sealion 5','byd-sealu':'Seal U',
  'chery-tiggo4':'Tiggo 4','chery-tiggo7':'Tiggo 7 Pro','chery-tiggo8':'Tiggo 8 Pro','chery-tiggo9':'Tiggo 9 Pro',
  'citroen-berlingo':'Berlingo','dongfeng-box':'Box',
  'hyundai-elantra':'Elantra','hyundai-kona':'Kona','hyundai-sonata':'Sonata','hyundai-tucson':'Tucson','hyundai-venue':'Venue',
  'jaecoo-5':'5','jaecoo-7':'7',
  'kia-niro':'Niro','kia-picanto':'Picanto','kia-seltos':'Seltos',
  'leapmotor-c10':'C10','mazda-cx5':'CX-5',
  'mercedes-cla':'CLA 200','mercedes-gla':'GLA 200','mercedes-glc':'GLC 200',
  'mg-hs':'HS','mg-zs':'ZS','mg3':'3',
  'mitsubishi-eclipsecross':'Eclipse Cross','mitsubishi-outlander':'Outlander',
  'nissan-juke':'Juke','nissan-qashqai':'Qashqai','omoda-7':'7',
  'skoda-kamiq':'Kamiq','skoda-octavia':'Octavia','skoda-superb':'Superb',
  'smart-5':'#5','toyota-chr':'C-HR','toyota-yaris':'Yaris','toyota-yariscross':'Yaris Cross',
  'zeekr-7x':'7X','zeekr-x':'X','avatr-11':'11','jaecoo-8':'8',
};
const cleanEn = (nameEn, brandEn) => {
  let s = String(nameEn || '').replace(/[֐-׿]+/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/\s*-\s*\d+\s*$/, '').trim();
  if (brandEn) s = s.replace(new RegExp('^' + brandEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim();
  return s.replace(/\s+/g, ' ').trim() || nameEn;
};
// size the hero title to the name length so long model names don't overflow / dominate
const h1Style = (model) => {
  const n = String(model).trim().length;
  if (n <= 4) return 'font-size:clamp(56px,13vw,168px);line-height:.82;';
  if (n <= 8) return 'font-size:clamp(46px,10vw,118px);line-height:.9;';
  if (n <= 13) return 'font-size:clamp(38px,7vw,86px);line-height:.96;';
  return 'font-size:clamp(30px,5.4vw,66px);line-height:1.02;';
};
// wrap a trailing number/short token in gold for a premium look
const h1Html = (model) => {
  const parts = String(model).trim().split(/\s+/);
  const last = parts[parts.length - 1];
  if (parts.length > 1 && /^(#?\d|[0-9])/.test(last)) {
    return parts.map((p, i) => i === parts.length - 1 ? `<span class="g">${esc(p)}</span>` : esc(p)).join(' ');
  }
  return esc(model);
};
// brand → logo slug (files in images/brands/)
const BRAND_SLUG = { 'Audi':'audi','Avatr':'avatr','Omoda':'omoda','MG':'mg','BYD':'byd','BMW':'bmw','Jaecoo':'jaecoo','Dongfeng':'dongfeng','Zeekr':'zeekr','Toyota':'toyota','Hyundai':'hyundai','Leapmotor':'leapmotor','Mazda':'mazda','Mitsubishi':'mitsubishi','Mercedes-Benz':'mercedes','Nissan':'nissan','Citroën':'citroen','smart':'smart','Škoda':'skoda','Chery':'chery','Kia':'kia' };
function logoFor(brandEn) { const s = BRAND_SLUG[brandEn]; if (!s) return null; for (const e of ['svg', 'webp', 'png']) if (fs.existsSync(ROOT + '/images/brands/' + s + '.' + e)) return 'images/brands/' + s + '.' + e; return null; }
// prefer HD press photos (images/gallery/<folder>-hd/) when available
function hdSet(folder) { const dir = ROOT + '/images/gallery/' + folder + '-hd'; try { const f = fs.readdirSync(dir).filter(x => /\.(jpe?g|png)$/i.test(x)).sort(); if (f.length >= 3) return f.map(n => 'images/gallery/' + folder + '-hd/' + n); } catch (e) {} return null; }
// every local jpg/png has a .webp twin (speed 7.10.26) — serve it on the page (og:image stays jpg for scrapers)
const jpgOf = (p) => { const j = String(p).replace(/\.webp$/i, '.jpg'); return j !== p && fs.existsSync(ROOT + '/' + j) ? j : p; };
const webp = (p) => { const w = String(p).replace(/\.(jpe?g|png)$/i, '.webp'); return w !== p && fs.existsSync(ROOT + '/' + w) ? w : p; };

function page(x, slug) {
  const brandEn = BRAND_EN[(x.brand || '').trim()] || (x.brand || '').trim();
  const modelEn = MODEL_EN[x.folder] || cleanEn(x.nameEn, brandEn);
  const fullEn = `${brandEn} ${modelEn}`.trim();
  const name = modelEn;
  const seats = x.seats || 5;
  const logo = logoFor(brandEn);
  const G = hdSet(x.folder) || x.gallery;
  const at = (i) => G[Math.min(i, G.length - 1)];
  const interior = G.find(p => /int[-_]?\d|interior|screen|seats/.test(p)) || at(G.length - 1);
  const heroImg = at(0), p2 = at(2), p3 = interior, p4 = at(1), leadImg = at(3);
  const hasPrice = x.m > 0;
  const payStr = hasPrice ? nis(x.m) : 'הצעה אישית';
  const source = 'landing_' + x.folder.replace(/[^a-z0-9]+/g, '_');
  const title = `${fullEn} חדש${hasPrice ? ' · החל מ-' + nis(x.m) + ' לחודש' : ''} | Car2Buy`;
  const desc = `${fullEn} חדש 0 ק"מ${hasPrice ? ', החל מ-' + nis(x.m) + ' לחודש' : ''} — עד 100% מימון, טרייד-אין וליווי אישי עד קבלת המפתח. קבלו הצעה אישית עוד היום.`;
  const SITE = 'https://car2buy.co.il/';
  const canon = SITE + slug;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: fullEn, image: SITE + webp(heroImg), description: desc, brand: { '@type': 'Brand', name: brandEn } };
  const T = {
    TITLE: esc(title), DESC: esc(desc), CANON: canon, OGIMG: SITE + jpgOf(heroImg), LD: JSON.stringify(ld).replace(/</g, '\\u003c'),
    HERO: webp(heroImg), FOLDER: x.folder,
    LOGO: logo ? `<img class="brandlogo rev in" src="${logo}" alt="${esc(brandEn)}" onerror="this.style.display='none'">` : `<div class="brandname rev in" dir="ltr">${esc(brandEn)}</div>`,
    H1STYLE: h1Style(modelEn), H1: h1Html(modelEn), SEATS: String(seats),
    HEROPAY: hasPrice ? `<span class="l">ההחזר שלכם · החל מ-</span><span class="a">${payStr}</span><span class="l">לחודש</span>` : `<span class="a" style="font-size:clamp(24px,3vw,38px)">${payStr}</span><span class="l">· דברו איתנו להצעה</span>`,
    P2: webp(p2), P3: webp(p3), P4: webp(p4), LEADIMG: webp(leadImg), NAME: esc(name),
    DEALPRICE: hasPrice ? `<em>₪</em>${Number(x.m).toLocaleString('en-US')}` : '<span class="txt" style="font-size:.6em">בהצעה</span>',
    J_FULL: JSON.stringify(fullEn), J_SOURCE: JSON.stringify(source), J_MSG: JSON.stringify('דף נחיתה ' + fullEn), V,
  };
  return TPL.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => { if (!(k in T)) throw new Error('template token without value: ' + k); return T[k]; });
}

// --- generate ---
const list = Object.values(groups).sort((a, b) => (a.m || 9e9) - (b.m || 9e9));
const built = [];
for (const x of list) {
  if (x.folder === 'jaecoo-8') { built.push({ ...x, file: 'jaecoo8-bold.html', special: true }); continue; }
  const slug = CAMPAIGN[x.folder] || ('lp-' + x.folder);
  const file = slug + '.html';
  fs.writeFileSync(ROOT + '/' + file, page(x, slug), 'utf8');
  built.push({ ...x, file });
}
fs.writeFileSync(ROOT + '/scripts/_built.json', JSON.stringify(built.map(b => {
  const brandEn = BRAND_EN[(b.brand || '').trim()] || (b.brand || '').trim();
  const modelEn = MODEL_EN[b.folder] || cleanEn(b.nameEn, brandEn);
  return { folder: b.folder, brand: b.brand, brandEn, modelEn, name: `${brandEn} ${modelEn}`.trim(), nameEn: b.nameEn, m: b.m, seats: b.seats, thumb: b.gallery[0], file: b.file };
}), null, 2));
console.log('generated pages:', built.filter(b => !b.special).length, '(+ jaecoo8-bold linked) · campaign slugs:', Object.values(CAMPAIGN).join(', '), '· v=' + V);
console.log('total models:', built.length);
