/* ============================================================
   Car2Buy — live data enrichment from the Israeli Ministry of
   Transport open database (data.gov.il / CKAN datastore_search).
   Real fields per model: fuel type, safety-equipment level,
   pollution group, tires, engine code, trim, year.
   Best-effort match by manufacturer + model token; results are
   cached in localStorage. Fails gracefully (keeps estimates)
   when offline / blocked / no match.
   Exposes: window.Car2Buy.govLookup(brandHe, modelHe) -> Promise
   ============================================================ */
window.Car2Buy = window.Car2Buy || {};
(function () {
  var BASE = 'https://data.gov.il/api/3/action/datastore_search';
  var RES = '053cea08-09bc-40ec-8f7a-156f0677aff3'; // כלי רכב פרטיים ומסחריים (משרד התחבורה)
  var mem = {};

  // our Hebrew/dotted brand → the spelling(s) the MoT registry uses
  var BRAND_Q = {
    'ב.י.ד': 'בי.ווי.די', "צ'רי": "צ'רי", 'יונדאי': 'יונדאי', 'טויוטה': 'טויוטה',
    'ב.מ.וו': 'ב.מ.וו', 'מרצדס': 'מרצדס', 'אאודי': 'אאודי', 'קיה': 'קיה', 'קיא': 'קיה',
    'אמ.ג׳י': 'אם.ג׳י', "אם.ג'י": "אם.ג'י", 'MG': 'אם.ג׳י', 'סקודה': 'סקודה',
    "ג'אקו": "ג'אקו", 'אומודה': 'אומודה', 'ליפמוטור': 'ליפמוטור', 'זיקר': 'זיקר',
    'וויה': 'וויה', 'סמארט': 'סמארט', 'ניסאן': 'ניסאן', 'סיאט': 'סיאט', 'סיטרואן': 'סיטרואן',
    'שברולט': 'שברולט', 'GMC': "ג'י.אמ.סי", 'מאזדה': 'מאזדה', 'סובארו': 'סובארו',
    'סקיוואל': 'סקייוול', 'מיצובישי': 'מיצובישי', "קיי.ג'י.אם": "קיי.ג'י.אם", 'אווטר': 'אווטר'
  };

  function lsGet(k) { try { return JSON.parse(localStorage.getItem('c2b_gov_' + k)); } catch (e) { return undefined; } }
  function lsSet(k, v) { try { localStorage.setItem('c2b_gov_' + k, JSON.stringify(v)); } catch (e) {} }

  // pull comparable Latin/Hebrew tokens out of a model name for matching
  function tokens(s) {
    return String(s || '').toLowerCase()
      .replace(/[^0-9a-zא-ת\u05d0-\u05ea ]/g, ' ')
      .split(/\s+/).filter(function (t) { return t.length >= 2; });
  }

  function scoreRecord(rec, modelHe, modelEn) {
    var hay = ((rec.degem_nm || '') + ' ' + (rec.kinuy_mishari || '') + ' ' + (rec.ramat_gimur || '')).toLowerCase();
    var toks = tokens(modelHe).concat(tokens(modelEn));
    var hit = 0;
    toks.forEach(function (t) { if (hay.indexOf(t) !== -1) hit++; });
    return hit;
  }

  // record → normalized spec overrides we trust from the registry
  function normalize(rec) {
    if (!rec) return null;
    var out = {};
    if (rec.sug_delek_nm) out.engineType = rec.sug_delek_nm;
    if (rec.ramat_eivzur_betihuty != null && rec.ramat_eivzur_betihuty !== '') out.safetyLevel = Number(rec.ramat_eivzur_betihuty);
    if (rec.kvutzat_zihum != null && rec.kvutzat_zihum !== '') out.pollution = Number(rec.kvutzat_zihum);
    if (rec.zmig_kidmi) out.tiresF = rec.zmig_kidmi;
    if (rec.zmig_ahori) out.tiresR = rec.zmig_ahori;
    if (rec.degem_manoa) out.engineCode = rec.degem_manoa;
    if (rec.ramat_gimur) out.govTrim = rec.ramat_gimur;
    if (rec.shnat_yitzur) out.govYear = Number(rec.shnat_yitzur);
    if (rec.kinuy_mishari) out.govModel = rec.kinuy_mishari;
    out._verified = Object.keys(out).filter(function (k) { return k[0] !== '_'; });
    return out;
  }

  window.Car2Buy.govLookup = function (brandHe, modelHe, modelEn) {
    var key = (brandHe || '') + '|' + (modelHe || '');
    if (mem[key] !== undefined) return Promise.resolve(mem[key]);
    var cached = lsGet(key);
    if (cached !== undefined && cached !== null) { mem[key] = cached; return Promise.resolve(cached); }

    var q = (BRAND_Q[brandHe] || brandHe || '') + ' ' + (modelHe || '');
    var url = BASE + '?resource_id=' + RES + '&q=' + encodeURIComponent(q.trim()) + '&limit=120';

    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (ctrl) setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 7000);

    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var recs = (j && j.result && j.result.records) || [];
        if (!recs.length) { mem[key] = null; lsSet(key, null); return null; }
        // choose the record whose model text best matches ours
        var best = null, bestScore = 0;
        recs.forEach(function (rec) {
          var sc = scoreRecord(rec, modelHe, modelEn);
          if (sc > bestScore) { bestScore = sc; best = rec; }
        });
        // require at least one token match to trust it
        var norm = bestScore >= 1 ? normalize(best) : null;
        mem[key] = norm; lsSet(key, norm);
        return norm;
      })
      .catch(function () { mem[key] = null; return null; });
  };
})();
