/* ============================================================
   Car2Buy — load the car inventory from Supabase (public.cars) and
   make it the source of truth for the catalog. Split by `condition`:
     'new'  → Car2Buy.LOAN_CARS  (catalog / car-loan)
     'used' → Car2Buy.USED       (yad2 / used-car)
   When the DB returns cars they REPLACE the in-code arrays (so the
   admin panel fully controls the inventory); if the fetch fails or
   is empty, the in-code arrays remain as a fallback.
   Loaded AFTER loan-cars.js and BEFORE app.js on inventory pages.
   ============================================================ */
(function () {
  var C = window.Car2Buy;
  if (!C || !C.LOAN_CARS) return;

  var URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

  C.carsLoading = true; // tells app.js to defer inventory render until we merge

  function done() {
    C.carsLoading = false;
    var ev;
    try { ev = new Event('c2b:cars-updated'); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('c2b:cars-updated', true, true); }
    document.dispatchEvent(ev);
  }

  // sanitize DB-sourced values (renderer interpolates them into HTML)
  function clean(s) { return String(s == null ? '' : s).replace(/[<>"'`]/g, '').slice(0, 120); }
  function cleanImg(u) {
    try { var url = new URL(String(u || ''), location.href); return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : ''; }
    catch (e) { return ''; }
  }
  function int(v, d) { var n = parseInt(v, 10); return isNaN(n) ? (d || 0) : n; }

  // stable order (sort_order) so yad2 list and used-car detail resolve the same index
  fetch(URL + '/rest/v1/cars?select=*&active=eq.true&order=sort_order.asc.nullslast,id.asc', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      if (rows && rows.length) {
        var news = [], used = [];
        rows.forEach(function (row) {
          if ((row.condition || 'new') === 'used') {
            var ex = row.extra || {};
            used.push({
              brand: clean(row.brand), name: clean(row.name), year: int(row.year, 2026),
              km: int(ex.km, 0), hand: int(ex.hand, 1), price: int(row.price, 0),
              monthly: int(row.monthly, 0), cat: clean(row.cat), type: clean(ex.type) || 'רכב',
              img: cleanImg(row.img)
            });
          } else {
            news.push({
              brand: clean(row.brand), name: clean(row.name), trim: clean(row.trim),
              m: int(row.monthly, 0), p: int(row.price, 0), img: cleanImg(row.img),
              cat: clean(row.cat), year: int(row.year, 2026), id: row.id
            });
          }
        });
        if (news.length) { C.LOAN_CARS = news; if (C.rebuildModels) C.rebuildModels(); }
        if (used.length) { C.USED = used; }
      }
      done();
    })
    .catch(function () { done(); });
})();
