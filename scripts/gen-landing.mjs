// Generates a bold cinematic landing page per catalog model, based on jaecoo8-bold.html.
// Honest content only: real catalog data (name/brand/monthly/seats/photos) + Car2Buy's real offer.
import fs from 'fs';

const ROOT = process.cwd();
const tpl = fs.readFileSync(ROOT + '/jaecoo8-bold.html', 'utf8');
const STYLE = tpl.match(/<style>[\s\S]*?<\/style>/)[0]
  // add a text brand-name style (most brands have no local logo)
  .replace('</style>', `  .brandname{font-weight:900;font-size:clamp(15px,1.9vw,21px);letter-spacing:.22em;color:#fff;opacity:.92;margin:22px 0 0;text-transform:uppercase;text-shadow:0 2px 14px rgba(0,0,0,.5);}\n</style>`);

// --- load catalog + gallery map ---
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
const cleanName = (s) => String(s || '').replace(/\([^)]*\)/g, '').replace(/\s*-\s*(החכר|ליסינג|רישוי).*$/,'').trim();
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
// wrap a trailing number/short token in gold for a premium look
const h1Html = (model) => {
  const parts = String(model).trim().split(/\s+/);
  const last = parts[parts.length - 1];
  if (parts.length > 1 && /^(#?\d|[0-9])/.test(last)) {
    return parts.map((p, i) => i === parts.length - 1 ? `<span class="g">${esc(p)}</span>` : esc(p)).join(' ');
  }
  return esc(model);
};

function page(x) {
  const brandEn = BRAND_EN[(x.brand || '').trim()] || (x.brand || '').trim();
  const modelEn = MODEL_EN[x.folder] || cleanEn(x.nameEn, brandEn);
  const fullEn = `${brandEn} ${modelEn}`.trim();
  const name = modelEn;
  const seats = x.seats || 5;
  const G = x.gallery;
  const at = (i) => G[Math.min(i, G.length - 1)];
  const interior = G.find(p => /int\d|interior|screen|seats/.test(p)) || at(G.length - 1);
  const heroImg = at(0), p2 = at(2), p3 = interior, p4 = at(1), leadImg = at(3);
  const hasPrice = x.m > 0;
  const payStr = hasPrice ? nis(x.m) : 'הצעה אישית';
  const source = 'landing_' + x.folder.replace(/[^a-z0-9]+/g, '_');
  const title = `${fullEn} חדש${hasPrice ? ' · החל מ-' + nis(x.m) + ' לחודש' : ''} | Car2Buy`;
  const desc = `${fullEn} חדש 0 ק"מ${hasPrice ? ', החל מ-' + nis(x.m) + ' לחודש' : ''} — 100% מימון בריבית הטובה בישראל, טרייד-אין וליווי אישי עד קבלת המפתח. קבלו הצעה אישית עוד היום.`;

  const cust = ['01','05','07'];
  const quotes = [
    { q: `קיבלנו את הרכב תוך כמה ימים, בהחזר חודשי שלא האמנו שאפשרי. ליווי אישי לאורך כל הדרך — פשוט מקצועיים.`, n: 'אלירן ואבי', c: 'טבריה' },
    { q: `עברנו לרכב חדש בלי לפגוע בתקציב המשפחתי. יחס אישי מהרגע הראשון ועד קבלת המפתח.`, n: 'משפחת לוי', c: 'חיפה' },
    { q: `השוויתי מול הלוואה בבנק — וזה פשוט לא היה דומה. שקיפות מלאה, טרייד-אין הוגן, והחזר חודשי שנתן לי שקט.`, n: 'דוד ואורן', c: 'מרכז' },
  ];
  const chk = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  const cmarImgs = ['01','02','03','04','05','06','07','08','11','12','14','15','17','19'];
  const caps = ['רכב חדש נמסר','לקוח/ה מרוצה','עסקה נסגרה בהצלחה','ממליצים בגאווה'];
  const figs = (rep) => cmarImgs.map((n,i)=>`      <figure><img loading="lazy" src="images/customers/cust-${n}.jpg" alt="לקוח Car2Buy"><figcaption><b>★★★★★</b><span>${caps[i%caps.length]}</span></figcaption></figure>`).join('\n');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self'; connect-src 'self' https://tdxhqpauuqawcoivjnnm.supabase.co https://api.ipify.org; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&display=swap" rel="stylesheet">
${STYLE}
</head>
<body>
<header class="top"><span class="b">Car<i>2</i>Buy</span><div class="r"><a class="tel" href="tel:+97223319929">072-3319929</a><a class="cta" href="#lead">קבלו הצעה</a></div></header>

<!-- HERO -->
<section class="panel hero" id="top">
  <div class="panel-bg"><video autoplay muted loop playsinline preload="metadata" poster="${heroImg}"><source src="videos/lp/${x.folder}.mp4" type="video/mp4"></video></div>
  <div class="scrim"></div>
  <div class="pc"><div class="wrap">
    <div class="hero-stars rev in" aria-label="דירוג 5 כוכבים">★★★★★</div>
    <span class="urgency rev in"><span class="p"></span>100% מימון · אישור מהיר</span>
    <div class="brandname rev in" dir="ltr">${esc(brandEn)}</div>
    <h1 class="rev in" dir="ltr">${h1Html(modelEn)}</h1>
    <p class="hero-tag rev in">רכב חדש 0 ק"מ — ההחזר החודשי הנמוך בישראל.</p>
    <p class="hero-sub rev in">${seats} מקומות · 100% מימון · טרייד-אין לרכב הישן · ליווי אישי עד קבלת המפתח.</p>
    <div class="hero-pay rev in">${hasPrice ? `<span class="l">ההחזר שלכם · החל מ-</span><span class="a">${payStr}</span><span class="l">לחודש</span>` : `<span class="a" style="font-size:clamp(24px,3vw,38px)">${payStr}</span><span class="l">· דברו איתנו להצעה</span>`}</div>
    <div class="cta-row rev in"><a class="btn" href="#lead">בדקו כמה זה יעלה לכם</a><a class="btn ghost" href="tel:+97223319929">חייגו עכשיו</a></div>
    <div class="hero-trust rev in">
      <span>${chk}100% מימון</span>
      <span>${chk}אחריות יצרן מלאה</span>
      <span>${chk}2,400+ לקוחות מרוצים</span>
    </div>
  </div></div>
</section>

<!-- רכב חדש -->
<section class="panel" id="power">
  <div class="panel-bg kb"><img loading="lazy" src="${p2}" alt="${esc(name)}"></div>
  <div class="scrim side"></div>
  <div class="pc"><div class="wrap"><div class="stmt">
    <div class="k rev" data-rev>0 קילומטר</div>
    <h2 class="rev" data-rev>רכב חדש.<br><span class="g">אחריות מלאה.</span></h2>
    <p class="rev" data-rev>${esc(name)} חדש לגמרי, 0 ק"מ, עם אחריות יצרן מלאה — בלי היסטוריה ובלי הפתעות. אנחנו דואגים לכל השאר: מימון, טרייד-אין וכל הניירת, כדי שתצאו לדרך בראש שקט.</p>
    <div class="big rev" data-rev>0 <span>ק"מ · רכב חדש</span></div>
    <a class="microcta rev" data-rev href="#lead">כמה זה יעלה לכם בחודש? בדקו <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></a>
  </div></div></div>
</section>

<!-- מרחב -->
<section class="panel" id="space">
  <div class="panel-bg kb"><img loading="lazy" src="${p3}" alt="פנים ${esc(name)}"></div>
  <div class="scrim side"></div>
  <div class="pc"><div class="wrap"><div class="stmt">
    <div class="k rev" data-rev>מרחב ונוחות</div>
    <h2 class="rev" data-rev>${seats} מקומות.<br><span class="g">נוחות מלאה.</span></h2>
    <p class="rev" data-rev>פנים מרווח ומאובזר, נוחות לכל הנוסעים ותא מטען שנותן מקום לחיים. רוצים לבחון אותו מקרוב? נלווה אתכם אישית ונשים לכם את כל המידע על השולחן — לפני שאתם מחליטים.</p>
    <div class="chips rev" data-rev><span class="chip">${seats} מקומות</span><span class="chip">רכב חדש 0 ק"מ</span><span class="chip">אחריות יצרן</span><span class="chip">ליווי אישי</span></div>
  </div></div></div>
</section>

<!-- עסקה -->
<section class="panel" id="deal">
  <div class="panel-bg kb"><img loading="lazy" src="${p4}" alt="${esc(name)}"></div>
  <div class="scrim side"></div>
  <div class="pc"><div class="wrap"><div class="stmt" style="max-width:840px">
    <div class="k rev" data-rev>העסקה של Car2Buy</div>
    <h2 class="rev" data-rev>רכב חדש לכל כיס.<br><span class="g">ההחזר הנמוך בישראל.</span></h2>
    <p class="rev" data-rev>בלי הון עצמי, בלי בירוקרטיה מול הבנק ובלי הפתעות. 100% מימון בריבית הטובה בישראל, טרייד-אין לרכב הישן, וליווי אישי עד קבלת המפתח — הכל בעסקה אחת פשוטה, בהתחייבות להחזר החודשי הנמוך ביותר בישראל.</p>
    <div class="deal-grid rev" data-rev>
      <div class="d"><div class="dv">${hasPrice ? `<em>₪</em>${Number(x.m).toLocaleString('en-US')}` : '<span class="txt" style="font-size:.6em">בהצעה</span>'}</div><div class="dk">החזר חודשי מ-</div></div>
      <div class="d"><div class="dv">100<em>%</em></div><div class="dk">מימון · ריבית מעולה</div></div>
      <div class="d"><div class="dv txt">טרייד-אין</div><div class="dk">קיזוז הרכב הישן</div></div>
      <div class="d"><div class="dv">1:1</div><div class="dk">יועץ אישי צמוד</div></div>
    </div>
    <div class="guarantee rev" data-rev><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>ההחזר החודשי הנמוך בישראל – בהתחייבות. מצאתם זול יותר? נשווה את ההצעה.</div>
  </div></div></div>
</section>

<!-- LEAD -->
<section class="panel lead" id="lead">
  <div class="panel-bg kb"><img loading="lazy" src="${leadImg}" alt="${esc(name)}"></div>
  <div class="scrim"></div>
  <div class="pc"><div class="wrap">
    <h2 class="rev" data-rev>קבלו את ההצעה<br>הכי טובה <span class="g">שלכם</span>.</h2>
    <p class="rev" data-rev>השאירו שם וטלפון – ונחזור אליכם עוד היום עם הצעה שכוללת: החזר חודשי מדויק, מסלול מימון בריבית הטובה בישראל, והערכת טרייד-אין לרכב הישן. בלי התחייבות, בלי אותיות קטנות.</p>
    <form id="leadForm" class="lform rev" data-rev novalidate>
      <input type="text" name="company_url" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="text" name="name" placeholder="שם מלא" autocomplete="name" required>
      <input type="tel" name="phone" placeholder="טלפון נייד" inputmode="tel" autocomplete="tel" required>
      <button type="submit" class="btn">קבלו הצעה ל${esc(name)}</button>
    </form>
    <div class="done" id="leadDone"><div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><h4>תודה! קיבלנו את הפרטים</h4><p>נציג Car2Buy יחזור אליכם עוד היום עם הצעה אישית.</p></div>
    <div class="lnote rev" data-rev><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>הפרטים שלכם מאובטחים · ללא התחייבות</div>
  </div></div>
</section>

<!-- TESTIMONIALS -->
<section class="testi" id="reviews"><div class="wrap">
  <div class="testi-head">
    <div class="k rev" data-rev>לקוחות מספרים</div>
    <h2 class="rev" data-rev>הם כבר <span class="g">על הכביש</span>.</h2>
    <div class="tstats rev" data-rev>
      <div class="ts"><div class="tv">2,400<em>+</em></div><div class="tk">לקוחות מרוצים</div></div>
      <div class="ts"><div class="tv">100<em>%</em></div><div class="tk">מימון בריבית מעולה</div></div>
      <div class="ts"><div class="tv">1:1</div><div class="tk">ליווי אישי צמוד</div></div>
    </div>
  </div>
  <div class="qgrid stag" data-stag>
${quotes.map((t,i)=>`    <div class="qc"><div class="stars">★★★★★</div><blockquote>${t.q}</blockquote>
      <div class="by"><span class="av"><img loading="lazy" src="images/customers/cust-${cust[i]}.jpg" alt="לקוח"></span><div><b>${t.n}</b><span class="role">Car2Buy · ${t.c}</span><span class="vf"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>מתוך שיחות עם לקוחותינו</span></div></div>
    </div>`).join('\n')}
  </div>
  <div class="cmar-head rev" data-rev>
    <div class="k">התמונות מדברות</div>
    <h3>לקוחות שכבר <span style="color:var(--gold)">קיבלו את הרכב</span></h3>
  </div>
  <div class="cmar" aria-label="גלריית לקוחות Car2Buy"><div class="cmar-track">
${figs()}
${figs()}
  </div></div>
  <div class="testi-cta rev" data-rev><a class="btn" href="#lead">הצטרפו אליהם — קבלו הצעה</a></div>
</div></section>

<footer class="foot"><div class="wrap"><b>Car2Buy</b> · <a href="tel:+97223319929">072-3319929</a> · המחירים להמחשה, ההצעה הסופית נתפרת אישית בכפוף לאישור גוף מימון וזמינות במלאי.</div></footer>

<nav class="tabs"><div class="tabs-in">
  <a href="#top" data-tab="top">הכירו</a>
  <a href="#power" data-tab="power">חדש</a>
  <a href="#space" data-tab="space">מרחב</a>
  <a href="#deal" data-tab="deal">עסקה</a>
  <a href="#lead" data-tab="lead">הצעה</a>
  <a href="#reviews" data-tab="reviews">לקוחות</a>
</div></nav>
<div class="switch"><a href="landings.html">‹ כל הרכבים</a></div>

<script src="supabase.js"></script>
<script>
(function(){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.16,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('[data-rev],[data-stag]').forEach(function(el){el.classList.add(el.hasAttribute('data-stag')?'stag':'rev');io.observe(el);});
  var tabs=[].slice.call(document.querySelectorAll('.tabs a'));
  var spy=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ var id=e.target.id;
    tabs.forEach(function(t){t.classList.toggle('on',t.getAttribute('data-tab')===id);}); } });},{threshold:.4});
  ['top','power','space','deal','lead','reviews'].forEach(function(id){var el=document.getElementById(id);if(el)spy.observe(el);});
  var f=document.getElementById('leadForm'),d=document.getElementById('leadDone');
  f.addEventListener('submit',function(e){e.preventDefault();var n=(f.name.value||'').trim(),p=(f.phone.value||'').trim();
    if(n.length<2){f.name.focus();return;} if(p.replace(/\\D/g,'').length<9){f.phone.focus();return;}
    if(window.submitLead)submitLead({name:n,phone:p,car:${JSON.stringify(fullEn)},source:${JSON.stringify(source)},message:${JSON.stringify('דף נחיתה ' + fullEn)},company_url:(f.company_url&&f.company_url.value)||''});
    f.style.display='none';d.classList.add('on');});
})();
</script>
</body>
</html>`;
}

// --- generate ---
const list = Object.values(groups).sort((a, b) => (a.m || 9e9) - (b.m || 9e9));
const built = [];
for (const x of list) {
  if (x.folder === 'jaecoo-8') { built.push({ ...x, file: 'jaecoo8-bold.html', special: true }); continue; }
  const file = 'lp-' + x.folder + '.html';
  fs.writeFileSync(ROOT + '/' + file, page(x), 'utf8');
  built.push({ ...x, file });
}
fs.writeFileSync(ROOT + '/scripts/_built.json', JSON.stringify(built.map(b => {
  const brandEn = BRAND_EN[(b.brand || '').trim()] || (b.brand || '').trim();
  const modelEn = MODEL_EN[b.folder] || cleanEn(b.nameEn, brandEn);
  return { folder: b.folder, brand: b.brand, brandEn, modelEn, name: `${brandEn} ${modelEn}`.trim(), nameEn: b.nameEn, m: b.m, seats: b.seats, thumb: b.gallery[0], file: b.file };
}), null, 2));
console.log('generated pages:', built.filter(b => !b.special).length, '(+ jaecoo8-bold linked)');
console.log('total models:', built.length);
