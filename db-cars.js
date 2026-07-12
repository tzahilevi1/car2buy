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

  fetch(URL + '/rest/v1/cars?select=*&active=eq.true&order=created_at.desc', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      if (rows && rows.length) {
        rows.forEach(function (row, i) {
          C.LOAN_CARS.push({
            brand: row.brand,
            name: row.name,
            trim: row.trim || '',
            m: row.monthly || 0,
            p: row.price || 0,
            img: row.img || '',
            cat: row.cat || '',
            year: row.year || 2026,
            id: 'db' + i
          });
        });
        if (C.rebuildModels) C.rebuildModels();
      }
      done();
    })
    .catch(function () { done(); });
})();
