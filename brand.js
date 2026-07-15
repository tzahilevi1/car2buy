/* ============================================================
   Car2Buy — dedicated manufacturer page.
   Reads ?brand=<hebrew>, renders: hero + models grid +
   long organic SEO content (per-model), video band, articles.
   ============================================================ */
(function () {
  var root = document.getElementById('brandPage');
  if (!root || !window.Car2Buy) return;
  var C = window.Car2Buy;
  var NIS = C.NIS || function (n) { return '₪' + (n || 0).toLocaleString('he-IL'); };
  var params = new URLSearchParams(location.search);
  var brand = params.get('brand') || '';
  var brandDisp = C.dispBrand ? C.dispBrand(brand) : brand;

  var LOGO_SLUG = {
    'ב.י.ד': 'byd', "צ'רי": 'chery', 'יונדאי': 'hyundai', 'טויוטה': 'toyota', 'ב.מ.וו': 'bmw',
    'קיה': 'kia', 'מאזדה': 'mazda', 'מרצדס': 'mercedes-benz', 'אאודי': 'audi', 'סקודה': 'skoda',
    'ניסאן': 'nissan', 'סיאט': 'seat', 'סובארו': 'subaru', 'סיטרואן': 'citroen', 'מיצובישי': 'mitsubishi',
    'שברולט': 'chevrolet', 'GMC': 'gmc', "אמ.ג'י": 'mg', 'סמארט': 'smart'
  };

  // match inventory rows for this brand — direct, or via canonical English name (handles spelling variants)
  var enOf = C.brandEn || function () { return ''; };
  var wantEn = enOf(brand);
  var inv = (C.LOAN_CARS || []).filter(function (l) { return l.brand === brand || (wantEn && enOf(l.brand) === wantEn); });
  // if the incoming brand resolves to a stocked brand, use the exact inventory spelling for display/logo
  if (inv.length && inv[0].brand && inv[0].brand !== brand) brand = inv[0].brand;
  var brandDisp2 = C.dispBrand ? C.dispBrand(brand) : brand;
  brandDisp = brandDisp2;
  var wrap = root;

  if (!brand) { location.href = 'models.html'; return; }

  document.title = brandDisp + ' · קטלוג רכבים · Car2Buy';
  try { window.C2B_setMeta && C2B_setMeta({ description: brandDisp + ' — כל הדגמים, המחירים וההחזר החודשי של ' + brandDisp + ' ב-Car2Buy. מצאו את הרכב המתאים לכם בליסינג מימוני.' }); } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fuelOf(c) {
    var t = (c.type || '') + ' ' + (c.trim || '') + ' ' + (c.name || '');
    if (/חשמלי|EV/i.test(t) || ['זיקר', 'אווטר', 'ליפמוטור', 'וויה', 'סקיוואל', 'סמארט'].indexOf(brand) >= 0 && !/DM-?i|נטען|PHEV/i.test(t)) return 'חשמלי';
    if (/נטען|PHEV|DM-?i/i.test(t)) return 'היברידי נטען';
    if (/היבריד|HEV/i.test(t)) return 'היברידי';
    return 'בנזין';
  }

  function loanBody(c) {
    if (c.type) return c.type;
    var n = (c.name || '') + ' ' + (c.brand || '');
    if (/סדאן|סאלון|סליון|ספורטבק|סיל 5|סיל 6|A3|E5\b/i.test(n)) return 'סדאן';
    if (/קופה|קופיה|\bGT\b/i.test(n)) return 'קופה';
    if (/דולפין|יאריס קרוס|קליאו|פולו|קורסה|אטו 2|פיקנטו|i10|i20/i.test(n)) return 'סופרמיני';
    if (/MPV|קרניבל|טוראן/i.test(n)) return 'MPV';
    return 'רכב פנאי';
  }

  // group inventory rows into per-model cards
  var FLAG = {};
  (C.CARS || []).forEach(function (c) { FLAG[c.brand + '|' + c.model] = c.slug; });
  var map = new Map();
  inv.forEach(function (c) {
    var key = c.name;
    if (!map.has(key)) {
      map.set(key, { brand: c.brand, name: c.name, type: c.type || '', cat: c.cat || '',
        img: c.img, fuel: fuelOf(c), year: c.year || 2026, minM: c.m, minP: c.p, trims: 0,
        slug: FLAG[c.brand + '|' + c.name] || c.id });
    }
    var g = map.get(key);
    g.trims++;
    if (c.m < g.minM) { g.minM = c.m; g.minP = c.p; g.slug = FLAG[c.brand + '|' + c.name] || c.id; }
    if (!g.img && c.img) g.img = c.img;
  });
  var models = [...map.values()].sort(function (a, b) { return a.minM - b.minM; });

  var logoUrl = (C.LOGO_HE && C.LOGO_HE(brand)) || (LOGO_SLUG[brand] ? 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset/logos/optimized/' + LOGO_SLUG[brand] + '.png' : '');
  if (!models.length) {
    var binfo = (window.C2B_BRAND_INFO || {})[brand];
    var intro0 = (binfo && binfo.intro) || (brandDisp + ' היא יצרנית רכב מבוקשת, ו-Car2Buy יכולה להשיג עבורכם כל דגם שלה בעסקת מימון עם החזר חודשי נוח. אנחנו עובדים מול כל היבואנים ומתחייבים לתנאים ולריביות הטובים ביותר בשוק.');
    wrap.innerHTML =
      '<section class="brand-hero"><div class="wrap">'
      + '<nav class="brand-crumb"><a href="index.html">ראשי</a> <span>›</span> <a href="models.html">קטלוג רכבים</a> <span>›</span> <b>' + esc(brandDisp) + '</b></nav>'
      + '<div class="brand-head">' + (logoUrl ? '<div class="brand-logo-big"><img src="' + esc(logoUrl) + '" alt="' + esc(brand) + '" onerror="this.style.display=\'none\'"></div>' : '') + '<h1 class="brand-title">' + esc(brandDisp) + '</h1>'
      + '<div class="brand-count">משיגים לכם כל דגם של ' + esc(brandDisp) + '</div></div></div></section>'
      + '<section class="section brand-content-sec"><div class="wrap" style="max-width:860px;">'
      + '<div class="cd-section-k">אודות היצרן</div><h2 class="brand-content-h">' + esc(brandDisp) + ' ב-Car2Buy</h2>'
      + '<div class="brand-content"><p>' + esc(intro0) + '</p>'
      + '<p>גם אם דגם מסוים אינו מופיע כרגע בקטלוג המלאי שלנו — אנחנו נאתר ונשיג אותו עבורכם, בליווי אישי מלא ובמסלול מימון של עד 100% בהחזר חודשי מותאם. יש לכם רכב קיים? עסקת טרייד-אין תקזז את שוויו ותקטין עוד יותר את ההחזר.</p></div>'
      + '<div class="mh-actions" style="margin-top:26px;"><a href="contact.html" class="btn btn-gold btn-lg">השאירו פרטים לרכב ' + esc(brandDisp) + '</a> <a href="https://wa.me/972584700706" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">שיחה בוואטסאפ</a></div>'
      + '</div></section>';
    document.title = brandDisp + ' · Car2Buy';
    return;
  }
  var initials = (brand || '').replace(/[^\u05D0-\u05EAA-Za-z]/g, '').slice(0, 3) || '•';
  var logoImg = logoUrl
    ? '<img src="' + esc(logoUrl) + '" alt="' + esc(brand) + '" onerror="this.style.display=\'none\'">'
    : '';

  // ---------- models grid ----------
  var cards = models.map(function (g) {
    var href = 'car.html?car=' + g.slug;
    var full = (C.enName ? C.enName(g) : g.brand + ' ' + g.name);
    return '<article class="car ccard reveal">'
      + '<a class="car-hit" href="' + href + '">'
      + '<div class="ccard-ph"><span class="ccard-fuel">' + g.fuel + '</span><span class="ccard-year">' + g.year + '</span>'
      + '<img loading="lazy" src="' + esc(g.img) + '" alt="' + esc(full) + '" onerror="this.style.display=\'none\'"></div>'
      + '<div class="ccard-body"><div class="ccard-name">' + esc(full) + '</div>'
      + '<div class="ccard-pay">החזר חודשי החל מ- <b>' + NIS(g.minM) + '</b></div></div>'
      + '</a></article>';
  }).join('');

  // ---------- organic SEO content (1000–1200 words) ----------
  var content = window.C2B_BRAND_CONTENT ? window.C2B_BRAND_CONTENT(brand, models, { NIS: NIS, esc: esc, fuelOf: fuelOf }) : '';

  // ---------- video band ----------
  var ytQuery = encodeURIComponent(brand + ' רכב מבחן דרכים 2026');

  // ---------- articles (3 per model) ----------
  // ---------- articles (3 original SEO articles per brand) ----------
  var brandArticles = (window.C2B_BRAND_ARTICLES ? window.C2B_BRAND_ARTICLES(brand, models, { esc: esc, NIS: NIS, fuelOf: fuelOf }) : []);
  var artCards = brandArticles.map(function (a, i) {
    return '<a class="ba-card reveal" href="brand-article.html?brand=' + encodeURIComponent(brand) + '&a=' + i + '">'
      + '<div class="ba-ph"><img loading="lazy" src="' + esc(a.heroImg) + '" alt="' + esc(a.title) + '" onerror="this.style.display=\'none\'"></div>'
      + '<div class="ba-body"><span class="ba-tag">' + esc(a.tag) + '</span>'
      + '<h4>' + esc(a.title) + '</h4><p>' + esc(a.dek) + '</p>'
      + '<span class="ba-more">קראו את המאמר · ' + a.readMin + ' דק׳ ‹</span></div></a>';
  }).join('');

  // ---------- assemble ----------
  wrap.innerHTML =
    '<section class="brand-hero">'
    + '<div class="wrap">'
    + '<nav class="brand-crumb"><a href="index.html">ראשי</a> <span>›</span> <a href="models.html">קטלוג רכבים</a> <span>›</span> <b>' + esc(brandDisp) + '</b></nav>'
    + '<div class="brand-head">'
    + (logoImg ? '<div class="brand-logo-big">' + logoImg + '</div>' : '')
    + '<h1 class="brand-title">' + esc(brandDisp) + '</h1>'
    + '<div class="brand-count">מציג ' + models.length + ' דגמים</div>'
    + '<a href="models.html" class="brand-back">חזרה לקטלוג ‹</a>'
    + '</div>'
    + '</div>'
    + '</section>'

    + '<section class="section brand-grid-sec"><div class="wrap"><div class="gallery brand-grid">' + cards + '</div>'
    + '<p class="cat-disclaimer">ההחזר החודשי המוצג הוא משוער בלבד ואינו מהווה הצעה מחייבת. תנאי העסקה כפופים לאישור גוף מימון, נתוני הלקוח וזמינות הרכב במלאי.</p>'
    + '</div></section>'

    + '<section class="section brand-content-sec" id="about"><div class="wrap" style="max-width:860px;">'
    + '<div class="cd-section-k">אודות היצרן</div>'
    + '<h2 class="brand-content-h">' + esc(brandDisp) + ' — הכל על היצרן והדגמים</h2>'
    + '<div class="brand-content">' + content + '</div>'
    + '</div></section>'

    + '<section class="brand-video" id="video">'
    + '<div class="bv-bg"></div><div class="bv-ov"></div>'
    + '<div class="wrap bv-inner">'
    + '<div class="bv-k">וידאו</div>'
    + '<h2 class="bv-title">' + esc(brandDisp) + ' בתנועה</h2>'
    + '<p class="bv-sub">צפו בסרטוני מבחני הדרכים והסקירות של דגמי ' + esc(brandDisp) + ' לפני שאתם מחליטים.</p>'
    + '<button class="bv-play" id="bvPlay" aria-label="נגן וידאו"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></button>'
    + '</div></section>'

    + '<section class="section brand-articles-sec" id="articles"><div class="wrap">'
    + '<div class="cd-section-k" style="text-align:center;">מגזין</div>'
    + '<h2 class="brand-art-h">מאמרים על דגמי ' + esc(brandDisp) + '</h2>'
    + '<div class="brand-articles">' + artCards + '</div>'
    + '</div></section>'

    // video popup
    + '<div class="bv-pop" id="bvPop" aria-hidden="true"><div class="bv-pop-ov" data-bv-close></div>'
    + '<div class="bv-pop-box"><button class="bv-pop-x" data-bv-close aria-label="סגור">✕</button>'
    + '<div class="bv-pop-frame" id="bvFrame"></div></div></div>';

  // ---------- video popup wiring ----------
  var pop = document.getElementById('bvPop');
  var frame = document.getElementById('bvFrame');
  function openVid() {
    frame.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed?listType=search&list=' + ytQuery + '&autoplay=1" title="' + esc(brand) + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    pop.classList.add('open'); pop.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  function closeVid() { frame.innerHTML = ''; pop.classList.remove('open'); pop.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  var play = document.getElementById('bvPlay');
  if (play) play.addEventListener('click', openVid);
  pop.addEventListener('click', function (e) { if (e.target.closest('[data-bv-close]')) closeVid(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('open')) closeVid(); });

  // reveal on scroll
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  root.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
