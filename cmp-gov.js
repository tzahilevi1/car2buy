/* ============================================================
   MOVE ON — REAL per-model specs from the Israeli Ministry of
   Transport WLTP model catalog (data.gov.il resource 142afde2).
   Matches by English model name + manufacturer + fuel + trim, returns
   the real technical spec (power, engine, weight, seats, doors, body,
   full safety-systems set, emissions). Cached in localStorage. Fails
   gracefully → unmatched fields render "—" (never fabricated).
   Exposes window.MoveOn.govLookup(brandHe, modelEn, trim, fuelHe).
   ============================================================ */
window.MoveOn = window.MoveOn || {};
(function () {
  var BASE = 'https://data.gov.il/api/3/action/datastore_search';
  var RES = '142afde2-6228-49f9-8a29-9b6c3a0cbe40'; // תוצרים ודגמים WLTP
  var mem = {};
  // Move On Hebrew brand → a token that appears in the registry's tozeret_nm
  var BRAND_TOK = {
    'ב.י.ד': 'בי ווי די', "צ'רי": "צ'רי", 'יונדאי': 'יונדאי', 'טויוטה': 'טויוטה', 'ב.מ.וו': 'ב מ וו',
    'מרצדס': 'מרצדס', 'אאודי': 'אאודי', 'קיה': 'קיה', "אמ.ג'י": 'אם ג', 'סקודה': 'סקודה', "ג'אקו": "ג'אקו",
    'אומודה': 'אומודה', 'ליפמוטור': 'ליפ', 'זיקר': 'זיקר', 'סמארט': 'סמארט', 'ניסאן': 'ניסאן', 'סיאט': 'סיאט',
    'סיטרואן': 'סיטרו', 'שברולט': 'שברולט', 'מאזדה': 'מאזדה', 'סקיוואל': 'סקייוול', 'מיצובישי': 'מיצובישי',
    'אווטר': 'אווטר', 'דונפנג': 'דונג'
  };
  function lsGet(k) { try { return JSON.parse(localStorage.getItem('mo_wltp_' + k)); } catch (e) { return undefined; } }
  function lsSet(k, v) { try { localStorage.setItem('mo_wltp_' + k, JSON.stringify(v)); } catch (e) {} }
  function toks(s) { return String(s || '').toUpperCase().replace(/[^0-9A-Z֐-׿ ]/g, ' ').split(/\s+/).filter(function (t) { return t.length >= 1; }); }
  function num(v) { v = Number(v); return (!isNaN(v) && v !== 0) ? v : null; }
  function yn(v) { return (v === 1 || v === '1') ? '✓' : (v === 0 || v === '0') ? '✗' : '—'; }

  function score(rec, brandTok, mToks, fuelHe, trimToks) {
    var s = 0;
    var man = String(rec.tozeret_nm || '').toUpperCase();
    if (brandTok && man.indexOf(brandTok.toUpperCase()) !== -1) s += 4; else s -= 2;
    var name = String(rec.kinuy_mishari || '').toUpperCase();
    mToks.forEach(function (t) { if (name.indexOf(t) !== -1) s += 2; });
    if (fuelHe && rec.delek_nm) { var f = fuelHe, r = rec.delek_nm; if ((/חשמל/.test(f) && /חשמל/.test(r)) || (/בנזין/.test(f) && /בנזין/.test(r)) || (/דיזל/.test(f) && /דיזל/.test(r)) || (/היבריד|נטען/.test(f) && /היבריד|חשמל/.test(r))) s += 2; }
    var gim = String(rec.ramat_gimur || '').toUpperCase();
    trimToks.forEach(function (t) { if (t.length >= 2 && gim.indexOf(t) !== -1) s += 1; });
    if (rec.koah_sus) s += 0.5; // prefer records that actually carry specs
    return s;
  }

  function normalize(rec) {
    return {
      body: rec.merkav || null, doors: num(rec.mispar_dlatot), seats: num(rec.mispar_moshavim),
      trim: rec.ramat_gimur || null, agra: (rec.kvuzat_agra_cd != null && rec.kvuzat_agra_cd !== '') ? String(rec.kvuzat_agra_cd) : null,
      fuel: rec.delek_nm || null, power: num(rec.koah_sus), engineCC: num(rec.nefah_manoa), weight: num(rec.mishkal_kolel),
      gearbox: rec.automatic_ind == 1 ? 'אוטומטית' : (rec.automatic_ind == 0 ? 'ידנית' : null), tow: num(rec.kosher_grira_im_blamim),
      safetyLevel: num(rec.ramat_eivzur_betihuty), safetyScore: (rec.nikud_betihut != null && rec.nikud_betihut !== '') ? Number(rec.nikud_betihut) : null, airbags: num(rec.mispar_kariot_avir),
      abs: yn(rec.abs_ind), esp: yn(rec.bakarat_yatzivut_ind), tpms: yn(rec.hayshaney_lahatz_avir_batzmigim_ind),
      ldw: yn(rec.bakarat_stiya_menativ_ind), fcw: yn(rec.nitur_merhak_milfanim_ind), blindSpot: yn(rec.zihuy_beshetah_nistar_ind),
      adaptiveCruise: yn(rec.bakarat_shyut_adaptivit_ind), pedestrian: yn(rec.zihuy_holchey_regel_ind), brakeAssist: yn(rec.maarechet_ezer_labalam_ind),
      aeb: yn(rec.blimat_hirum_lifnei_holhei_regel_ofanaim), twoWheel: yn(rec.zihuy_rechev_do_galgali), tsr: yn(rec.zihuy_tamrurey_tnua_ind),
      autoHigh: yn(rec.shlita_automatit_beorot_gvohim_ind), fcwAlert: yn(rec.teura_automatit_benesiya_kadima_ind), seatbeltReminder: yn(rec.hayshaney_hagorot_ind),
      rearAeb: yn(rec.blima_otomatit_nesia_leahor), isa: yn(rec.bakarat_mehirut_isa),
      pollution: num(rec.kvutzat_zihum), green: (rec.madad_yarok != null && rec.madad_yarok !== '') ? Number(rec.madad_yarok) : null, co2: num(rec.CO2_WLTP),
      ac: yn(rec.mazgan_ind), powerWindows: num(rec.mispar_halonot_hashmal), reverseCam: yn(rec.matzlemat_reverse_ind), powerSteer: yn(rec.hege_koah_ind), alloy: yn(rec.galgaley_sagsoget_kala_ind),
      govModel: rec.kinuy_mishari || null, govYear: num(rec.shnat_yitzur), _verified: true
    };
  }

  window.MoveOn.govLookup = function (brandHe, modelEn, trim, fuelHe) {
    var key = (brandHe || '') + '|' + (modelEn || '') + '|' + (trim || '');
    if (mem[key] !== undefined) return Promise.resolve(mem[key]);
    var cached = lsGet(key);
    if (cached !== undefined && cached !== null) { mem[key] = cached; return Promise.resolve(cached); }
    var mToks = toks(modelEn), trimToks = toks(trim), brandTok = BRAND_TOK[brandHe] || '';
    // query with only the first 1-2 model tokens (data.gov.il free-text needs ALL words present);
    // the full model + trim tokens are used for scoring the candidates.
    var q = mToks.slice(0, 2).join(' ').trim();
    if (!q) { mem[key] = null; return Promise.resolve(null); }
    var url = BASE + '?resource_id=' + RES + '&q=' + encodeURIComponent(q) + '&limit=90';
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (ctrl) setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 8000);
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var recs = (j && j.result && j.result.records) || [];
        if (!recs.length) { mem[key] = null; lsSet(key, null); return null; }
        var best = null, bestScore = 1.5;
        recs.forEach(function (rec) { var sc = score(rec, brandTok, mToks, fuelHe, trimToks); if (sc > bestScore) { bestScore = sc; best = rec; } });
        var norm = best ? normalize(best) : null;
        mem[key] = norm; lsSet(key, norm);
        return norm;
      })
      .catch(function () { mem[key] = null; return null; });
  };
})();
