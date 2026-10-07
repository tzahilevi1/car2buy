/* ============================================================
   Car2Buy — load the NEW-car catalog from cars.json (synced from the
   Google Sheet by a GitHub Action). Same-origin fetch → no CORS.
   Replaces Car2Buy.LOAN_CARS with the live sheet inventory and
   rebuilds MODELS/BRANDS/FUELS, then signals app.js to render.
   Loaded AFTER loan-cars.js and BEFORE app.js on catalog pages.
   Used cars (יד 2) are unaffected — the sheet holds new cars only.
   ============================================================ */
(function () {
  var C = window.Car2Buy;
  if (!C || !C.LOAN_CARS) return;

  // תיקוני תמונה עמידים-לסנכרון: הגיליון מתעדכן אוטומטית ודורס עריכות ידניות ב-cars.json,
  // לכן לרשומות עם תמונה שגויה/שבורה בגיליון נגדיר כאן תמונה נכונה. מפתח = "brand|name" מנורמל.
  var IMG_OVERRIDE = {
    // "האמר 2X" (GMC Hummer EV) — בגיליון הוגדרה בטעות תמונת שברולט סילברדו.
    'האמר|2x': 'images/cars/gmc-hummer-ev-2x.webp',
    // "אומודה 9 וויזיין" — בגיליון אין תמונה כלל.
    'אומודה|9 וויזיין': 'images/cars/omoda-9.webp'
  };

  C.carsLoading = true; // app.js defers the catalog render until we merge

  function done() {
    C.carsLoading = false;
    var ev;
    try { ev = new Event('c2b:cars-updated'); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('c2b:cars-updated', true, true); }
    document.dispatchEvent(ev);
  }

  function clean(s) { return String(s == null ? '' : s).replace(/[<>"'`]/g, '').slice(0, 120); }
  function cleanImg(u) {
    try { var url = new URL(String(u || ''), location.href); return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : ''; }
    catch (e) { return ''; }
  }
  function int(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  // Google-Drive share link -> embeddable direct image URL; plain image URLs pass through
  function driveUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    var m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1];
    return /^https?:\/\//i.test(s) ? cleanImg(s) : '';
  }

  C.seoSlug = function (c) {
    var s = String((c.nameEn || '') + ' ' + (c.trim || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'model';
  };
  // stable slug ('byd-atto-2-boost') or legacy id → the current internal id (sheetN / cN)
  C.idForSlug = function (s) {
    if (!s) return null;
    var L = C.LOAN_CARS || [];
    for (var i = 0; i < L.length; i++) if (L[i].seo === s) return L[i].id;
    return null;
  };
  C.carUrl = function (c) { return c && c.seo ? 'car-' + c.seo : 'car.html?car=' + encodeURIComponent(c ? c.id : ''); };
  // stable brand slug ('byd', 'chery') from the English model name of a stocked car — static page /brand-<slug>
  // fixed map first (sheet English names start with a model for some brands — "IX2" for BMW — or carry typos/accents)
  var BRAND_EN = { 'ב.י.ד': 'byd', "ג'אקו": 'jaecoo', 'טיגו': 'tiggo', "צ'רי": 'chery', 'יונדאי': 'hyundai', 'טויוטה': 'toyota',
    'ליפמוטור': 'leapmotor', 'קיה': 'kia', 'מיצובישי': 'mitsubishi', "אמ.ג'י": 'mg', 'סקודה': 'skoda', 'אווטר': 'avatr',
    'ניסאן': 'nissan', 'סיאט': 'seat', 'סיטרואן': 'citroen', 'אומודה': 'omoda', 'שברולט': 'chevrolet', 'ב.מ.וו': 'bmw',
    'מאזדה': 'mazda', 'זיקר': 'zeekr', 'מרצדס': 'mercedes', 'סמארט': 'smart', 'סקיוואל': 'skywell', 'אאודי': 'audi',
    'דונפנג': 'dongfeng', 'האמר': 'gmc', 'מקסוס': 'maxus', 'לינק': 'lynk-co' };
  C.brandSlug = function (b) {
    if (BRAND_EN[b]) return BRAND_EN[b];
    var L = C.LOAN_CARS || [];
    for (var i = 0; i < L.length; i++) {
      if (L[i].brand !== b) continue;
      var en = String(L[i].nameEn || '').normalize ? String(L[i].nameEn || '').normalize('NFD').replace(/[̀-ͯ]/g, '') : String(L[i].nameEn || '');
      if (/^[A-Za-z]/.test(en)) return en.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return null;
  };
  // internal links: the prerendered static page when the id is a live-sheet car, else the query URL
  C.urlForId = function (id) {
    var L = C.LOAN_CARS || [];
    for (var i = 0; i < L.length; i++) if (L[i].id === id && L[i].seo) return 'car-' + L[i].seo;
    return 'car.html?car=' + encodeURIComponent(id || '');
  };

  // cache-bust lightly so edits show within the CDN cache window
  fetch('cars.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      if (rows && rows.length) {
        // keep the seed (loan-cars.js) inventory so pages still resolve the original cN ids
        if (!C.LOAN_CARS_SEED) C.LOAN_CARS_SEED = C.LOAN_CARS;
        // ⚠️ עמודות הגיליון שנצרכות בפועל: brand, name, trim, nameEn, engine, seats, m (החזר חודשי),
        // p (מחיר), img, imgL/imgB/imgR (גלריה). שאר העמודות (salePrice, listPrice, directPrice,
        // m50, down, commission, colors, code, notes) אינן נקראות — עריכתן בגיליון לא תשפיע על האתר.
        C.LOAN_CARS = rows.map(function (row, i) {
          // gallery priority (per user): the bundled rich gallery (6 photos incl. interior) FIRST,
          // then fall back to the sheet's own Drive photos where we don't have one.
          var _n = function (s) { return String(s == null ? '' : s).replace(/['׳"`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };
          var _mine = C.MODEL_GALLERIES && C.MODEL_GALLERIES[_n(row.brand) + '|' + _n(row.name)];
          var gallery = (_mine && _mine.length) ? _mine.slice() : [row.imgL, row.imgB, row.imgR].map(driveUrl).filter(Boolean);
          var _ov = IMG_OVERRIDE[_n(row.brand) + '|' + _n(row.name)];
          if (_ov && !gallery.length) gallery = [_ov];
          return {
            brand: clean(row.brand), name: clean(row.name), trim: clean(row.trim),
            nameEn: clean(row.nameEn), engine: clean(row.engine), seats: int(row.seats),
            m: int(row.m), p: int(row.p),
            img: _ov || cleanImg(row.img) || gallery[0] || '',
            gallery: gallery,
            id: 'sheet' + i
          };
        }).filter(function (c) { return c.brand && c.name; });
        // stable SEO slug per car (nameEn + trim) — sheetN ids shift when the sheet is reordered, so static
        // pages (/car-<slug>) and their links resolve through this instead (SEO 7.10.26). Same rule as scripts/prerender.mjs.
        var _seen = {};
        C.LOAN_CARS.forEach(function (c) {
          var s = C.seoSlug(c), base = s, k = 2; while (_seen[s]) s = base + '-' + (k++); _seen[s] = 1; c.seo = s;
        });
        if (C.rebuildModels) C.rebuildModels();
      }
      done();
    })
    .catch(function (e) { console.warn('[Car2Buy] cars.json load/parse failed — showing seed inventory', e); done(); });
})();
