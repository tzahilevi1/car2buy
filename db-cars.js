/* ============================================================
   Car2Buy — merge admin-managed cars (Supabase `cars` table) into
   the catalog. Loaded AFTER loan-cars.js and BEFORE app.js on
   catalog pages. Pushes active DB cars into Car2Buy.LOAN_CARS,
   rebuilds MODELS/BRANDS/FUELS, and signals app.js to render.
   ============================================================ */
(function () {
  var C = window.Car2Buy;
  if (!C || !C.LOAN_CARS) return;

  var URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

  C.carsLoading = true; // tells app.js to defer catalog render until we merge

  function done() {
    C.carsLoading = false;
    var ev;
    try { ev = new Event('c2b:cars-updated'); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('c2b:cars-updated', true, true); }
    document.dispatchEvent(ev);
  }

  // sanitize DB-sourced values (defense-in-depth: the renderer interpolates
  // these into HTML/attributes without escaping)
  function clean(s) { return String(s == null ? '' : s).replace(/[<>"'`]/g, '').slice(0, 120); }
  function cleanImg(u) {
    try { var url = new URL(String(u || ''), location.href); return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : ''; }
    catch (e) { return ''; }
  }

  fetch(URL + '/rest/v1/cars?select=*&active=eq.true&order=created_at.desc', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      if (rows && rows.length) {
        rows.forEach(function (row, i) {
          C.LOAN_CARS.push({
            brand: clean(row.brand),
            name: clean(row.name),
            trim: clean(row.trim),
            m: parseInt(row.monthly, 10) || 0,
            p: parseInt(row.price, 10) || 0,
            img: cleanImg(row.img),
            cat: clean(row.cat),
            year: parseInt(row.year, 10) || 2026,
            id: 'db' + i
          });
        });
        if (C.rebuildModels) C.rebuildModels();
      }
      done();
    })
    .catch(function () { done(); });
})();
