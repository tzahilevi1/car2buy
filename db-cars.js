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

  // cache-bust lightly so edits show within the CDN cache window
  fetch('cars.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      if (rows && rows.length) {
        // keep the seed (loan-cars.js) inventory so pages still resolve the original cN ids
        if (!C.LOAN_CARS_SEED) C.LOAN_CARS_SEED = C.LOAN_CARS;
        C.LOAN_CARS = rows.map(function (row, i) {
          // gallery priority (per user): the bundled rich gallery (6 photos incl. interior) FIRST,
          // then fall back to the sheet's own Drive photos where we don't have one.
          var _n = function (s) { return String(s == null ? '' : s).replace(/['׳"`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };
          var _mine = C.MODEL_GALLERIES && C.MODEL_GALLERIES[_n(row.brand) + '|' + _n(row.name)];
          var gallery = (_mine && _mine.length) ? _mine.slice() : [row.imgL, row.imgB, row.imgR].map(driveUrl).filter(Boolean);
          return {
            brand: clean(row.brand), name: clean(row.name), trim: clean(row.trim),
            nameEn: clean(row.nameEn), engine: clean(row.engine), seats: int(row.seats),
            m: int(row.m), p: int(row.p),
            img: cleanImg(row.img) || gallery[0] || '',
            gallery: gallery,
            id: 'sheet' + i
          };
        }).filter(function (c) { return c.brand && c.name; });
        if (C.rebuildModels) C.rebuildModels();
      }
      done();
    })
    .catch(function () { done(); });
})();
