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

  // cache-bust lightly so edits show within the CDN cache window
  fetch('cars.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      if (rows && rows.length) {
        C.LOAN_CARS = rows.map(function (row, i) {
          return {
            brand: clean(row.brand), name: clean(row.name), trim: clean(row.trim),
            m: int(row.m), p: int(row.p), img: cleanImg(row.img),
            id: 'sheet' + i
          };
        }).filter(function (c) { return c.brand && c.name; });
        if (C.rebuildModels) C.rebuildModels();
      }
      done();
    })
    .catch(function () { done(); });
})();
