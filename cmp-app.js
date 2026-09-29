/* ============================================================
   MOVE ON — car comparison tool. Search & add up to 4 models from the
   inventory (cars.json) and compare ~55 spec points across categories,
   with "show only differences", per-row best-value highlighting and %
   deltas. Rich specs from car-specs.js; verified fields from gov-data.js.
   ============================================================ */
(function () {
  var MO = window.MoveOn = window.MoveOn || {};
  if (!document.getElementById('cmpMain')) return;
  var EN_BRAND = { "ב.מ.וו": "BMW", "ב.י.ד": "BYD", "צ'רי": "Chery", "יונדאי": "Hyundai", "ג'אקו": "Jaecoo", "אמ.ג'י": "MG", "שברולט": "Chevrolet", "טויוטה": "Toyota", "מרצדס": "Mercedes", "סמארט": "smart", "קיה": "Kia", "מיצובישי": "Mitsubishi", "סקודה": "Skoda", "זיקר": "Zeekr", "ליפמוטור": "Leapmotor", "אאודי": "Audi", "אווטר": "Avatr", "ניסאן": "Nissan", "סיאט": "Seat", "סיטרואן": "Citroen", "אומודה": "Omoda", "מאזדה": "Mazda", "סקיוואל": "Skywell", "דונפנג": "Dongfeng" };
  function NIS(n) { return '₪' + (Math.round(+n) || 0).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dispBrand(b) { return EN_BRAND[b] || b; }
  function enModel(c) { var s = (c.nameEn || '').replace(/[֐-׿"'׳״]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); var b = EN_BRAND[c.brand] || ''; if (b) s = s.replace(new RegExp('^' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), ''); return s.trim() || c.name; }
  function slug(c) { return (c.nameEn || (c.brand + '-' + c.name) + '-' + (c.trim || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var richSpecs = MO.richSpecs;

  var MODELS = [];
  var KEY = 'mo_compare2', MAX = 4;
  var get = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  var setC = function (a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} render(); };
  var byId = function (id) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i]; return null; };
  function add(id) { var a = get(); if (a.indexOf(id) !== -1) return; if (a.length >= MAX) a.shift(); a.push(id); setC(a); }
  function remove(id) { setC(get().filter(function (x) { return x !== id; })); }

  var input = document.getElementById('cmpSearch');
  var results = document.getElementById('cmpResults');
  function renderResults(q) {
    q = (q || '').trim().toLowerCase();
    var chosen = get();
    var list = MODELS.filter(function (m) {
      if (chosen.indexOf(m.id) !== -1) return false;
      if (!q) return true;
      return (m.disp + ' ' + m.brand + ' ' + dispBrand(m.brand) + ' ' + (m.trim || '')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 40);
    if (!list.length) { results.innerHTML = '<div class="cmp-res-empty">לא נמצאו דגמים תואמים.</div>'; results.classList.add('open'); return; }
    results.innerHTML = list.map(function (m) {
      return '<div class="cmp-res" data-add="' + esc(m.id) + '">' +
        (m.img ? '<img src="' + esc(/^https?:/.test(m.img) ? m.img : '/' + m.img) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : '<span class="cmp-res-ph"></span>') +
        '<div class="cmp-res-t"><b>' + esc(m.disp) + '</b><span>' + esc(m.trim || '') + '</span></div>' +
        '<span class="cmp-res-p">' + NIS(m.monthly) + ' / חודש</span></div>';
    }).join('');
    results.classList.add('open');
  }
  if (input) {
    input.addEventListener('focus', function () { renderResults(input.value); });
    input.addEventListener('input', function () { renderResults(input.value); });
    document.addEventListener('click', function (e) { if (e.target.closest('.cmp-search')) return; results.classList.remove('open'); });
    results.addEventListener('click', function (e) {
      var r = e.target.closest('[data-add]');
      if (r) { add(r.getAttribute('data-add')); input.value = ''; renderResults(''); input.focus(); }
    });
  }

  // grouped spec model — n: numeric (enables highlight + %); t: text/bool getter
  var N = function (getter, unit, dir, fmt) { return { num: getter, unit: unit, dir: dir, fmt: fmt }; };
  var GROUPS = [
    { title: 'כללי', rows: [
      { k: 'מרכב', t: function (s) { return s.body; } },
      { k: 'מספר דלתות', n: N(function (m) { return richSpecs(m).doors; }, '', null) },
      { k: 'מספר מושבים', n: N(function (m) { return richSpecs(m).seats; }, '', null) },
      { k: 'רמת גימור', t: function (s) { return s.trim; } },
      { k: 'קבוצת אגרת רישוי', vkey: 1, t: function (s) { return s.agra || '—'; } }
    ] },
    { title: 'מחיר ומימון', rows: [
      { k: 'החזר חודשי', n: N(function (m) { return m.monthly; }, '', 'min', NIS) },
      { k: 'מחיר מחירון', n: N(function (m) { return m.list; }, '', 'min', NIS) },
      { k: 'מקדמה', n: N(function (m) { return m.down || 0; }, '', 'min', NIS) }
    ] },
    { title: 'מנוע וביצועים', rows: [
      { k: 'סוג מנוע', vkey: 1, t: function (s) { return s.fuel; } },
      { k: 'הספק מנוע', vkey: 1, n: N(function (m) { return richSpecs(m).power; }, 'כ״ס', 'max') },
      { k: 'נפח מנוע', vkey: 1, n: N(function (m) { return richSpecs(m).engineCC; }, 'סמ״ק', null) },
      { k: 'תיבת הילוכים', vkey: 1, t: function (s) { return s.gearbox; } },
      { k: 'משקל כולל', vkey: 1, n: N(function (m) { return richSpecs(m).weight; }, 'ק״ג', null) },
      { k: 'כושר גרירה', vkey: 1, n: N(function (m) { return richSpecs(m).tow; }, 'ק״ג', 'max') }
    ] },
    { title: 'זיהום וסביבה', rows: [
      { k: 'קבוצת זיהום אוויר', vkey: 1, n: N(function (m) { return richSpecs(m).pollution; }, '', 'min') },
      { k: 'פליטת CO₂ (WLTP)', vkey: 1, n: N(function (m) { return richSpecs(m).co2; }, 'גר׳/ק״מ', 'min') }
    ] },
    { title: 'מערכות בטיחות', rows: [
      { k: 'רמת אבזור בטיחותי', vkey: 1, n: N(function (m) { return richSpecs(m).safetyLevel; }, 'מתוך 8', 'max') },
      { k: 'ציון בטיחות', vkey: 1, t: function (s) { return s.safetyScore == null ? '—' : s.safetyScore; } },
      { k: 'מספר כריות אוויר', vkey: 1, n: N(function (m) { return richSpecs(m).airbags; }, '', 'max') },
      { k: 'מערכת ABS', vkey: 1, t: function (s) { return s.abs; } },
      { k: 'בקרת יציבות אלקטרונית', vkey: 1, t: function (s) { return s.esp; } },
      { k: 'בקרת לחץ אוויר בצמיגים', vkey: 1, t: function (s) { return s.tpms; } },
      { k: 'התראת סטייה מנתיב', vkey: 1, t: function (s) { return s.ldw; } },
      { k: 'ניטור מרחק מלפנים', vkey: 1, t: function (s) { return s.fcw; } },
      { k: 'התראת התנגשות מלפנים', vkey: 1, t: function (s) { return s.fcwAlert; } },
      { k: 'בלימת חירום אוטומטית', vkey: 1, t: function (s) { return s.aeb; } },
      { k: 'זיהוי הולכי רגל', vkey: 1, t: function (s) { return s.pedestrian; } },
      { k: 'מערכת שטח מת', vkey: 1, t: function (s) { return s.blindSpot; } },
      { k: 'בקרת שיוט אדפטיבית', vkey: 1, t: function (s) { return s.adaptiveCruise; } },
      { k: 'עזר לבלימה', vkey: 1, t: function (s) { return s.brakeAssist; } },
      { k: 'זיהוי דו-גלגלי', vkey: 1, t: function (s) { return s.twoWheel; } },
      { k: 'זיהוי תמרורים', vkey: 1, t: function (s) { return s.tsr; } },
      { k: 'אור גבוה אוטומטי', vkey: 1, t: function (s) { return s.autoHigh; } },
      { k: 'חיישני חגורות', vkey: 1, t: function (s) { return s.seatbeltReminder; } },
      { k: 'בלימה בנסיעה לאחור', vkey: 1, t: function (s) { return s.rearAeb; } },
      { k: 'סיוע מהירות חכם', vkey: 1, t: function (s) { return s.isa; } }
    ] },
    { title: 'נוחות ואבזור', rows: [
      { k: 'מזגן', vkey: 1, t: function (s) { return s.ac; } },
      { k: 'חלונות חשמל', vkey: 1, n: N(function (m) { return richSpecs(m).powerWindows; }, '', 'max') },
      { k: 'מצלמת רוורס', vkey: 1, t: function (s) { return s.reverseCam; } },
      { k: 'הגה כוח', vkey: 1, t: function (s) { return s.powerSteer; } },
      { k: 'גלגלי סגסוגת קלה', vkey: 1, t: function (s) { return s.alloy; } }
    ] }
  ];

  var diffOnly = false;
  var wrap = document.getElementById('cmpTableWrap');
  function cellClass(v) { return v === '✓' ? ' class="cc-yes"' : v === '✗' ? ' class="cc-no"' : ''; }

  function render() {
    var ids = get();
    var cnt = document.getElementById('cmpCount'); if (cnt) cnt.textContent = ids.length;
    if (input && results && results.classList.contains('open')) renderResults(input.value);
    if (!wrap) return;
    if (!ids.length) {
      wrap.innerHTML = '<div class="cmp-empty"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 7h11m0 0-3-3m3 3-3 3M16 17H5m0 0 3-3m-3 3 3 3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>עדיין לא בחרתם דגמים.</span><em>חפשו יצרן או דגם למעלה כדי להוסיף להשוואה.</em></div>';
      return;
    }
    var cars = ids.map(byId).filter(Boolean);
    if (MO.govLookup) {
      cars.forEach(function (m) {
        if (m._govFetched) return; m._govFetched = true;
        MO.govLookup(m.brand, m.modelEn, m.trim, m.fuel).then(function (ov) { if (ov) { m._gov = ov; m._govDirty = true; render(); } });
      });
    }
    var anyVerified = cars.some(function (m) { return richSpecs(m)._verified; });
    var body = '';
    GROUPS.forEach(function (g) {
      var rowsHtml = '';
      g.rows.forEach(function (r) {
        var cells, allSame;
        if (r.n) {
          var nums = cars.map(r.n.num);
          var fmt = r.n.fmt || function (v) { return v + (r.n.unit ? ' ' + r.n.unit : ''); };
          var disp = nums.map(function (v) { return (v == null || isNaN(v)) ? '—' : fmt(v); });
          allSame = disp.every(function (d) { return d === disp[0]; });
          if (diffOnly && allSame) return;
          var valid = nums.filter(function (n) { return typeof n === 'number' && !isNaN(n); });
          var best = null, worst = null;
          if (r.n.dir && valid.length > 1) { best = r.n.dir === 'min' ? Math.min.apply(null, valid) : Math.max.apply(null, valid); worst = r.n.dir === 'min' ? Math.max.apply(null, valid) : Math.min.apply(null, valid); }
          cells = nums.map(function (v, i) {
            if (v == null || isNaN(v)) return '<td>—</td>';
            var isBest = best !== null && v === best && best !== worst;
            var badge = '';
            if (isBest) { var pct = r.n.dir === 'min' ? Math.round((worst - best) / worst * 100) : Math.round((best - worst) / worst * 100); if (pct > 0) badge = '<span class="cmp-delta ' + (r.n.dir === 'min' ? 'down' : 'up') + '">' + pct + '%' + (r.n.dir === 'min' ? '−' : '+') + '</span>'; }
            return '<td' + (isBest ? ' class="cmp-hi"' : '') + '>' + esc(disp[i]) + badge + '</td>';
          });
        } else {
          var vals = cars.map(function (m) { return r.t(richSpecs(m)); });
          allSame = vals.every(function (v) { return String(v) === String(vals[0]); });
          if (diffOnly && allSame) return;
          cells = vals.map(function (v) { return '<td' + cellClass(v) + '>' + esc(v) + '</td>'; });
        }
        var vmark = (r.vkey && cars.some(function (m) { return richSpecs(m)._verified; })) ? '<span class="cmp-vf" title="נתון רשמי ממשרד התחבורה">✓</span>' : '';
        rowsHtml += '<tr><td class="cmp-rk">' + esc(r.k) + vmark + '</td>' + cells.join('') + '</tr>';
      });
      if (rowsHtml) body += '<tr class="cmp-grp"><td class="cmp-grp-h" colspan="' + (cars.length + 1) + '">' + esc(g.title) + '</td></tr>' + rowsHtml;
    });
    var heads = cars.map(function (m) {
      return '<th><div class="cmp-card"><div class="cmp-cimg">' + (m.img ? '<img src="' + esc(/^https?:/.test(m.img) ? m.img : '/' + m.img) + '" alt="' + esc(m.disp) + '" onerror="this.style.visibility=\'hidden\'">' : '') + '</div>' +
        '<span class="cmp-cbrand">' + esc(dispBrand(m.brand)) + '</span><strong class="cmp-cname">' + esc(enModel(m)) + '</strong>' +
        '<div class="cmp-cmonthly">' + NIS(m.monthly) + '<em>/ חודש</em></div>' +
        '<button class="cmp-rm" data-remove="' + esc(m.id) + '">הסר ✕</button></div></th>';
    }).join('');
    var note = '<p class="cmp-src">✓ הנתונים הטכניים נמשכים ממאגר הדגמים הרשמי של משרד התחבורה (WLTP) — הספק מנוע, נפח, משקל, מערכות בטיחות, זיהום ואבזור. מחיר, החזר חודשי ומקדמה מתוך המלאי שלנו. "—" = לא נמצאה התאמה לדגם/גרסה במאגר. המפרט המדויק לגרסה הספציפית נמסר מול היבואן לפני החתימה.</p>';
    wrap.innerHTML =
      '<div class="cmp-toolbar"><label class="cmp-diff"><input type="checkbox" id="cmpDiff"' + (diffOnly ? ' checked' : '') + '> הצג רק הבדלים</label>' +
      '<button class="cmp-clear" id="cmpClearAll">נקה הכל</button></div>' +
      '<div class="cmp-wrap"><table class="cmp-table"><thead><tr><th class="cmp-corner"></th>' + heads + '</tr></thead><tbody>' + body + '</tbody></table></div>' + note;
  }

  if (wrap) {
    wrap.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-remove]');
      if (rm) { remove(rm.getAttribute('data-remove')); return; }
      if (e.target.closest('#cmpClearAll')) { setC([]); return; }
      var d = e.target.closest('#cmpDiff');
      if (d) { diffOnly = d.checked; render(); }
    });
  }

  fetch('cars.json?v=2').then(function (r) { return r.json(); }).then(function (d) {
    var seen = {};
    MODELS = (d || []).filter(function (c) { return c && c.img && c.m; }).map(function (c) {
      var id = slug(c); while (seen[id]) id += 'x'; seen[id] = 1;
      return { id: id, brand: c.brand, name: c.name, disp: (c.nameEn || '').replace(/[֐-׿"'׳״]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || (dispBrand(c.brand) + ' ' + c.name), modelEn: enModel(c), trim: c.trim, type: c.name, monthly: c.m, list: c.listPrice || c.p, down: c.down, img: c.img, seats: c.seats, fuel: c.engine };
    }).sort(function (a, b) { return a.disp.localeCompare(b.disp, 'en'); });
    // default: two different-brand mainstream cars (that match the MoT registry well) on first visit
    if (!get().length) {
      var MAIN = { 'יונדאי': 1, 'טויוטה': 1, 'קיה': 1, "צ'רי": 1, 'ב.י.ד': 1, 'ב.מ.וו': 1, 'סקודה': 1, 'מאזדה': 1, 'מרצדס': 1, 'ניסאן': 1, 'מיצובישי': 1, "אמ.ג'י": 1, 'אאודי': 1 };
      var mains = MODELS.filter(function (m) { return MAIN[m.brand]; });
      var pool = mains.length >= 2 ? mains : MODELS;
      var c0 = pool[0], c1 = pool.filter(function (m) { return m.brand !== c0.brand; })[0] || pool[1];
      var pre = [c0 && c0.id, c1 && c1.id].filter(Boolean);
      try { localStorage.setItem(KEY, JSON.stringify(pre)); } catch (e) {}
    }
    render();
  }).catch(function (e) { console.warn('[MOVE ON] compare load failed', e); if (wrap) wrap.innerHTML = '<div class="cmp-empty"><span>לא הצלחנו לטעון את המלאי כרגע.</span><em><a href="/inventory.html" style="color:var(--lime)">עברו לכל הדגמים</a></em></div>'; });
})();
