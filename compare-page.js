/* ============================================================
   Car2Buy — compare page logic (self-contained).
   Search-to-add + rich grouped comparison table + sections + FAQ.
   Rich per-car specs are derived deterministically from the real
   inventory fields (price, power, fuel, category…) so every model
   compares consistently across ~50 data points like the leaders.
   ============================================================ */
(function () {
  var C2B = window.Car2Buy;
  if (!C2B || !document.getElementById('cmpMain')) return;

  var MODELS = C2B.MODELS || [];
  var NIS = C2B.NIS || function (n) { return '₪' + Number(n).toLocaleString('en-US'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var dispBrand = C2B.dispBrand || function (b) { return b; };
  var enModel = C2B.enModel || function (n) { return n; };
  var enName = function (m) { return dispBrand(m.brand) + ' ' + enModel(m.name); };

  var IMG_POOL = MODELS.map(function (m) { return m.img; }).filter(Boolean);
  var poolAt = function (i) { return IMG_POOL.length ? IMG_POOL[i % IMG_POOL.length] : ''; };

  function bg(id, src) { var el = document.getElementById(id); if (el && src) el.style.backgroundImage = 'url(' + src + ')'; }
  bg('cmpHeroBg', poolAt(3)); bg('cmpBand1Bg', poolAt(11)); bg('cmpBand2Bg', poolAt(19)); bg('cmpTipsBg', poolAt(27));

  // ============================================================
  // DETERMINISTIC RICH SPEC GENERATOR
  // ============================================================
  // המחולל הדטרמיניסטי חולץ ל-car-specs.js ומשותף עם עמוד הרכב (זהות מלאה בין ההשוואה לעמוד הרכב).
  var richSpecs = C2B.richSpecs;

  // ============================================================
  // COMPARE STATE (localStorage, shared with catalog "+ השוואה")
  // ============================================================
  var KEY = 'c2b_compare', MAX = 4;
  var get = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  var setC = function (a) { localStorage.setItem(KEY, JSON.stringify(a)); render(); };
  var byId = function (id) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i]; return null; };
  function add(id) { var a = get(); if (a.indexOf(id) !== -1) return; if (a.length >= MAX) a.shift(); a.push(id); setC(a); }
  function remove(id) { setC(get().filter(function (x) { return x !== id; })); }

  // ============================================================
  // SEARCH-TO-ADD
  // ============================================================
  var input = document.getElementById('cmpSearch');
  var results = document.getElementById('cmpResults');
  function renderResults(q) {
    q = (q || '').trim().toLowerCase();
    var chosen = get();
    var list = MODELS.filter(function (m) {
      if (chosen.indexOf(m.id) !== -1) return false;
      if (!q) return true;
      var hay = (m.brand + ' ' + m.name + ' ' + (m.trim || '') + ' ' + dispBrand(m.brand) + ' ' + enModel(m.name)).toLowerCase();
      return hay.indexOf(q) !== -1;
    }).slice(0, 40);
    if (!list.length) { results.innerHTML = '<div class="cmp-res-empty">לא נמצאו רכבים תואמים.</div>'; results.classList.add('open'); return; }
    results.innerHTML = list.map(function (m) {
      return '<div class="cmp-res" data-add="' + m.id + '">' +
        (m.img ? '<img src="' + esc(m.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '<span style="width:56px"></span>') +
        '<div><div class="rn">' + esc(enName(m)) + '</div><div class="rt">' + esc(m.trim || m.type || '') + '</div></div>' +
        '<span class="rp">' + NIS(m.monthly) + ' / חודש</span></div>';
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

  // ============================================================
  // GROUPED SPEC MODEL
  // ============================================================
  // n: numeric getter (enables highlight + %); f: format; t: text/bool getter
  var N = function (getter, unit, dir, fmt) { return { num: getter, unit: unit, dir: dir, fmt: fmt }; };
  var GROUPS = [
    { title: 'כללי', rows: [
      { k: 'שם מודל', t: function (s) { return s.modelName; } },
      { k: 'רמת גימור', t: function (s) { return s.trim; } },
      { k: 'קטגוריה', t: function (s) { return s.category; } },
      { k: 'מרכב', t: function (s) { return s.body; } },
      { k: 'מספר דלתות', vkey: 'doors', t: function (s) { return s.doors; } },
      { k: 'מספר מושבים', vkey: 'seats', t: function (s) { return s.seats; } },
      { k: 'קבוצת אגרת רישוי', t: function (s) { return s.licenseGroup; } },
      { k: 'מחיר אגרת רישוי', t: function (s) { return s.licenseFee; } }
    ] },
    { title: 'מחיר ומימון', rows: [
      { k: 'החזר חודשי', n: N(function (m) { return m.monthly; }, '', 'min', function (v) { return NIS(v); }) },
      { k: 'מחיר מחירון', n: N(function (m) { return m.list; }, '', 'min', function (v) { return NIS(v); }) }
    ] },
    { title: 'מנוע וביצועים', rows: [
      { k: 'סוג מנוע', vkey: 'engineType', t: function (s) { return s.engineType; } },
      { k: 'תאוצה 0-100', vkey: 'accel', n: N(function (m) { return richSpecs(m).accel; }, 'שנ׳', 'min') },
      { k: 'הספק מנוע', vkey: 'power', n: N(function (m) { return richSpecs(m).power; }, 'כ״ס', 'max') },
      { k: 'קיבולת סוללה (kWh)', vkey: 'battery', n: N(function (m) { return richSpecs(m).battery; }, 'קוט״ש', 'max') },
      { k: 'טווח נסיעה', vkey: 'range', n: N(function (m) { return richSpecs(m).range; }, 'ק״מ', 'max') },
      { k: 'נפח מנוע', n: N(function (m) { return richSpecs(m).engineCC; }, 'סמ״ק', null) },
      { k: 'מהירות מרבית', vkey: 'topSpeed', n: N(function (m) { return richSpecs(m).topSpeed; }, 'קמ״ש', 'max') },
      { k: 'סוג תיבת הילוכים', t: function (s) { return s.gearbox; } },
      { k: 'הנעה', vkey: 'drive', t: function (s) { return s.drive; } },
      { k: 'סוג בלם יד', t: function (s) { return s.handbrake; } }
    ] },
    { title: 'מערכות בטיחות', rows: [
      { k: 'רמת בטיחות', vkey: 'safetyLevel', n: N(function (m) { return richSpecs(m).safetyLevel; }, 'מתוך 8', 'max') },
      { k: 'ציון מבחן ריסוק', t: function (s) { return s.ncap; } },
      { k: 'מספר כריות אוויר', n: N(function (m) { return richSpecs(m).airbags; }, '', 'max') },
      { k: 'מערכת ABS', t: function (s) { return s.abs; } },
      { k: 'בקרת יציבות אלקטרונית', t: function (s) { return s.esp; } },
      { k: 'בקרת לחץ אוויר בצמיגים', t: function (s) { return s.tpms; } },
      { k: 'התראת התנגשות מלפנים', t: function (s) { return s.fcw; } },
      { k: 'בלימת חירום אוטומטית', t: function (s) { return s.aeb; } },
      { k: 'התראת סטייה מנתיב', t: function (s) { return s.ldw; } },
      { k: 'זיהוי תמרורים', t: function (s) { return s.tsr; } },
      { k: 'אור גבוה אוטומטי', t: function (s) { return s.autoHigh; } },
      { k: 'מערכת שטח מת', t: function (s) { return s.blindSpot; } },
      { k: 'התראת עייפות', t: function (s) { return s.fatigue; } },
      { k: 'זיהוי הולכי רגל', t: function (s) { return s.pedestrian; } },
      { k: 'בקרת שיוט אדפטיבית', t: function (s) { return s.adaptiveCruise; } },
      { k: 'התראת תנועה חוצה מאחור', t: function (s) { return s.rearCross; } },
      { k: 'עיגון ISOFIX', t: function (s) { return s.isofix; } },
      { k: 'סיוע מהירות חכם', t: function (s) { return s.speedAssist; } }
    ] },
    { title: 'מידות ומשקל', rows: [
      { k: 'אורך', n: N(function (m) { return richSpecs(m).length; }, 'מ״מ', 'max') },
      { k: 'רוחב', n: N(function (m) { return richSpecs(m).width; }, 'מ״מ', 'max') },
      { k: 'גובה', n: N(function (m) { return richSpecs(m).height; }, 'מ״מ', null) },
      { k: 'בסיס גלגלים', n: N(function (m) { return richSpecs(m).wheelbase; }, 'מ״מ', 'max') },
      { k: 'נפח תא מטען', n: N(function (m) { return richSpecs(m).trunk; }, 'ליטר', 'max') },
      { k: 'תא מטען מושבים מקופלים', n: N(function (m) { return richSpecs(m).trunkFolded; }, 'ליטר', 'max') },
      { k: 'משקל עצמי', n: N(function (m) { return richSpecs(m).curb; }, 'ק״ג', null) },
      { k: 'משקל כולל', n: N(function (m) { return richSpecs(m).gross; }, 'ק״ג', null) },
      { k: 'מרווח גחון', n: N(function (m) { return richSpecs(m).clearance; }, 'מ״מ', 'max') },
      { k: 'צמיגים קדמיים', vkey: 'tiresF', t: function (s) { return s.tiresF || '—'; } },
      { k: 'צמיגים אחוריים', vkey: 'tiresR', t: function (s) { return s.tiresR || '—'; } },
      { k: 'קוטר גלגלים', n: N(function (m) { return richSpecs(m).wheel; }, 'אינץ׳', 'max') }
    ] },
    { title: 'מולטימדיה וקישוריות', rows: [
      { k: 'מסך מולטימדיה', t: function (s) { return s.screen + ' אינץ׳'; } },
      { k: 'לוח מחוונים דיגיטלי', t: function (s) { return s.cluster + ' אינץ׳'; } },
      { k: 'Bluetooth', t: function (s) { return s.bluetooth; } },
      { k: 'חיבור USB', t: function (s) { return s.usb; } },
      { k: 'חיבוריות לנייד', t: function (s) { return s.phone; } },
      { k: 'טעינה אלחוטית', t: function (s) { return s.wireless; } }
    ] },
    { title: 'נוחות ואבזור', rows: [
      { k: 'סוג מזגן', t: function (s) { return s.ac; } },
      { k: 'ריפוד', t: function (s) { return s.upholstery; } },
      { k: 'מושב נהג חשמלי', t: function (s) { return s.elecSeat; } },
      { k: 'גג שמש', t: function (s) { return s.sunroof; } },
      { k: 'מצלמה', t: function (s) { return s.camera; } },
      { k: 'חיישני חניה', t: function (s) { return s.parkSensors; } },
      { k: 'נעילת דלתות', t: function (s) { return s.keyless; } },
      { k: 'פנסים קדמיים', t: function (s) { return s.headlight; } },
      { k: 'תאורה אחורית', t: function (s) { return s.taillight; } },
      { k: 'הדלקת אורות אוטומטית', t: function (s) { return s.autoLights; } },
      { k: 'תאורת אווירה', t: function (s) { return s.ambient; } },
      { k: 'קיפול מראות צד חשמלי', t: function (s) { return s.mirrorFold; } },
      { k: 'חיישן מגבים', t: function (s) { return s.rainSensor; } }
    ] }
  ];

  // ============================================================
  // TABLE RENDER
  // ============================================================
  var diffOnly = false;
  var wrap = document.getElementById('cmpTableWrap');
  var countEl = document.getElementById('cmpCount');

  function cellClass(v) { return v === '✓' ? ' class="yes"' : v === '✗' ? ' class="no"' : ''; }

  function render() {
    var ids = get();
    if (countEl) countEl.textContent = ids.length;
    if (input && results.classList.contains('open')) renderResults(input.value);
    if (!wrap) return;
    if (!ids.length) {
      wrap.innerHTML = '<div class="cmp-empty">⇄ עדיין לא בחרתם רכבים להשוואה.<br>חפשו יצרן או דגם למעלה כדי להוסיף לטבלה.</div>';
      return;
    }
    var cars = ids.map(byId).filter(Boolean);
    // apply manually-verified specs (accurate manufacturer figures) — take precedence
    var SPECS = window.C2B_SPECS || {};
    cars.forEach(function (m) { if (SPECS[m.id] && !m._gov) { m._gov = SPECS[m.id]; m._govDirty = true; } });
    // for models WITHOUT verified specs, fall back to live enrichment from the MoT registry
    if (window.Car2Buy.govLookup) {
      cars.forEach(function (m) {
        if (m._govFetched || SPECS[m.id]) return;
        m._govFetched = true;
        window.Car2Buy.govLookup(m.brand, m.name, enModel(m.name)).then(function (ov) {
          if (ov && ov._verified && ov._verified.length) { m._gov = ov; m._govDirty = true; render(); }
        });
      });
    }
    var anyVerified = cars.some(function (m) { return (richSpecs(m)._verified || []).length; });
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
          if (r.n.dir && valid.length > 1) {
            best = r.n.dir === 'min' ? Math.min.apply(null, valid) : Math.max.apply(null, valid);
            worst = r.n.dir === 'min' ? Math.max.apply(null, valid) : Math.min.apply(null, valid);
          }
          cells = nums.map(function (v, i) {
            if (v == null || isNaN(v)) return '<td>—</td>';
            var isBest = best !== null && v === best && best !== worst;
            var badge = '';
            if (isBest) {
              var pct = r.n.dir === 'min' ? Math.round((worst - best) / worst * 100) : Math.round((best - worst) / worst * 100);
              if (pct > 0) badge = '<span class="cmp-delta ' + (r.n.dir === 'min' ? 'down' : 'up') + '">(' + pct + '%' + (r.n.dir === 'min' ? '-' : '+') + ')</span>';
            }
            return '<td' + (isBest ? ' class="hi"' : '') + '>' + esc(disp[i]) + badge + '</td>';
          });
        } else {
          var vals = cars.map(function (m) { return r.t(richSpecs(m)); });
          allSame = vals.every(function (v) { return String(v) === String(vals[0]); });
          if (diffOnly && allSame) return;
          cells = vals.map(function (v) { return '<td' + cellClass(v) + '>' + esc(v) + '</td>'; });
        }
        var vmark = (r.vkey && cars.some(function (m) { return (richSpecs(m)._verified || []).indexOf(r.vkey) !== -1; })) ? '<span class="vf" title="מאומת ממשרד התחבורה">✓</span>' : '';
        rowsHtml += '<tr><td class="cmp-rk">' + esc(r.k) + vmark + '</td>' + cells.join('') + '</tr>';
      });
      if (rowsHtml) body += '<tr class="cmp-grp"><td class="cmp-grp-h" colspan="' + (cars.length + 1) + '">' + esc(g.title) + '</td></tr>' + rowsHtml;
    });

    var heads = cars.map(function (m) {
      return '<th><div class="cmp-card"><a href="car.html?car=' + m.id + '">' +
        (m.img ? '<img src="' + esc(m.img) + '" alt="' + esc(enName(m)) + '" onerror="this.style.visibility=\'hidden\'">' : '') + '</a>' +
        '<div class="br">' + esc(dispBrand(m.brand)) + '</div><div class="nm">' + esc(enModel(m.name)) + '</div>' +
        '<button class="rm" data-remove="' + m.id + '">הסר ✕</button></div></th>';
    }).join('');

    var note = anyVerified
      ? '<p class="cmp-src">✓ שדות מסומנים הם מפרט מאומת של היצרן (כוח, תאוצה, מהירות מרבית, סוללה/טווח, מושבים). שאר הנתונים המורחבים מוערכים לפי קטגוריה ומחיר.</p>'
      : '<p class="cmp-src">הנתונים המורחבים מוערכים לפי קטגוריה ומחיר ומיועדים להמחשה.</p>';
    wrap.innerHTML =
      '<div class="cmp-toolbar"><label class="cmp-diff"><input type="checkbox" id="cmpDiff"' + (diffOnly ? ' checked' : '') + '> הצג רק הבדלים</label>' +
      '<button class="cmp-clear" id="cmpClearAll">נקה הכל</button></div>' +
      '<table class="cmp-table"><thead><tr><th></th>' + heads + '</tr></thead><tbody>' + body + '</tbody></table>' + note;
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

  // ============================================================
  // FAQ CHIPS — smooth anchor scroll
  // ============================================================
  document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.getAttribute('data-goto'));
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
    });
  });

  // ============================================================
  // SECTION CONTENT
  // ============================================================
  var WHY = [
    { t: 'ביצועים', b: 'השוואת רכבים לפני קניה משווה גם ביצועים, נתוני צריכת דלק וטווח נסיעה חשמלי. ככה תוכלו לראות איזה דגם חסכוני יותר, לאיזו גרסה של רכב חשמלי יש סוללה גדולה יותר ואיזה הספק מנוע יספק לכם ביצועים ותחושת ביטחון בכביש.' },
    { t: 'רמת גימור ובטיחות', b: 'ב<a href="index.html">Car2Buy</a> אתם יכולים להשוות את אותו דגם רכב לגרסאות השונות שיש לו. ככה תוכלו לראות איזו רמת גימור בטיחותית יותר ובאיזו גרסה יש את התוספות שאתם מחפשים (תא מטען בפתיחה חשמלית, גג שמש פנורמי, מושב נהג בכוונון חשמלי ועוד).' },
    { t: 'חיסכון בכסף', b: 'הדבר הראשון שתשימו לב אליו בהשוואת רכבים לפני קניה אלה המחירים של הרכבים שאתם משווים. ההשוואה חכמה יכולה לגלות לכם איזה רכב אתם יכולים לקנות מבלי להתפשר ולוודא שזאת <a href="car-loan.html">האפשרות המשתלמת</a> עבורכם.' }
  ];
  var whyList = document.getElementById('cmpWhyList');
  if (whyList) whyList.innerHTML = WHY.map(function (w, i) {
    return '<div class="cmp-why-card"><div><h3>' + w.t + '</h3><p>' + w.b + '</p></div>' +
      '<div class="cmp-why-img"><img loading="lazy" src="' + esc(poolAt(i * 5 + 1)) + '" alt="' + esc(w.t) + '" onerror="this.closest(\'.cmp-why-img\').style.display=\'none\'"></div></div>';
  }).join('');

  var DATA = [
    { ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', t: 'נתונים טכניים', b: 'השוו סוגי מנועים, הספק כוח, תיבות הילוכים וסוגי הנעה (קדמית/אחורית/4X4).' },
    { ic: '<path d="M3 22h13M5 22V8l6-4 5 3v15M8 11h3M8 15h3"/><path d="M16 10l3 1v9a1.5 1.5 0 0 1-3 0V6"/>', t: 'צריכת דלק', b: 'כחלק מההשוואה בדקו איזה <a href="finance-electric.html">רכב חסכוני</a> יותר, וברכבים חשמליים את טווח הנסיעה וקצב הטעינה.' },
    { ic: '<path d="M3 8v8M21 8v8M3 12h18M7 10v4M17 10v4"/>', t: 'מידות ומרחב פנימי', b: 'בהשוואת רכבים ניתן לראות בקלות איזה רכב גדול יותר לפי מידות אורך, גובה, רוחב ובסיס גלגלים.' },
    { ic: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"/><path d="m9 12 2 2 4-4"/>', t: 'מערכות בטיחות', b: 'השוו את רמות האבזור הבטיחותי בין הרכבים ואת ציון מבחן הריסוק של EURO NCAP.' },
    { ic: '<path d="M4 15a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4M6 15v3M18 15v3M9 7a3 3 0 0 1 6 0"/>', t: 'נוחות ואבזור', b: 'השוואת רכבים לפני קניה לא שלמה בלי בדיקה מלאה של האבזור והתוספות שמקבלים בכל דגם.' }
  ];
  var dataCols = document.getElementById('cmpDataCols');
  if (dataCols) dataCols.innerHTML = DATA.map(function (d) {
    return '<div class="cmp-dc"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d.ic + '</svg></div><h3>' + d.t + '</h3><p>' + d.b + '</p></div>';
  }).join('');

  var HOW = [
    { t: 'שלב 1: בחרו את הרכבים', b: 'בחרו את הדגמים שאתם רוצים להשוות לפי דגמים ורמות גימור.' },
    { t: 'שלב 2: צפו בהשוואה', b: 'הסתכלו על נתונים כלליים כמו מחיר, ציון מבחן ריסוק וביצועים.' },
    { t: 'שלב 3: התמקדו רק בהבדלים', b: 'לחצו על כפתור "הצג רק הבדלים" להצגת הנתונים השונים.' },
    { t: 'שלב 4: נתחו את הנתונים', b: 'הסתכלו מה מתאים לכם יותר לפי הפרמטרים השונים.' },
    { t: 'שלב 5: קבלו החלטה', b: 'הגיעו מוכנים <a href="models.html">לרכישת הרכב החדש שלכם</a>.' }
  ];
  var howGrid = document.getElementById('cmpHowGrid');
  if (howGrid) {
    var cards = HOW.map(function (h) { return '<div class="cmp-how-card"><h3>' + h.t + '</h3><p>' + h.b + '</p></div>'; });
    cards.splice(5, 0, '<div class="cmp-how-photo"><img loading="lazy" src="' + esc(poolAt(8)) + '" alt="השוואת רכבים" onerror="this.style.display=\'none\'"><button class="go" id="cmpStartBtn">התחילו להשוות</button></div>');
    howGrid.innerHTML = cards.join('');
    var startBtn = document.getElementById('cmpStartBtn');
    if (startBtn) startBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(function () { if (input) input.focus(); }, 500); });
  }

  var tipsImg = document.getElementById('cmpTipsImg');
  if (tipsImg) tipsImg.innerHTML = '<img loading="lazy" src="' + esc(poolAt(14)) + '" alt="טיפים להשוואת רכבים" onerror="this.closest(\'.cmp-tips-img\').style.display=\'none\'">';

  var FAQ = [
    { q: 'כמה רכבים אפשר להשוות במקביל?', a: 'מומלץ עד 3-4 רכבים כדי לא להעמיס על עצמכם במידע ולשמור על השוואה ברורה וממוקדת. אצלנו תוכלו להוסיף רכבים בקלות דרך תיבת החיפוש בראש העמוד.' },
    { q: 'האם הנתונים מעודכנים?', a: 'הנתונים מבוססים על המלאי הפעיל שלנו ומתעדכנים באופן שוטף. מומלץ תמיד לאמת את המפרט המדויק מול נציג לפני הרכישה, שכן ייתכנו הבדלים בין רמות גימור.' },
    { q: 'איך נמדדת צריכת הדלק?', a: 'צריכת הדלק נמדדת במעבדה לפי מחזור נסיעה תקני (WLTP) ומבטאת ליטרים ל-100 ק״מ. ברכבים חשמליים מוצגים טווח נסיעה וצריכת חשמל במקום צריכת דלק.' },
    { q: 'האם כדאי להשוות רכבים מאותה קטגוריה בלבד?', a: 'לרוב כן — השוואה בין רכבים מאותה קטגוריה (למשל שני רכבי פנאי) נותנת תמונה מדויקת יותר. עם זאת, אפשר להשוות גם בין קטגוריות כדי לבחון חלופות שונות לתקציב שלכם.' },
    { q: 'מה עדיף - מנוע בנזין או דיזל?', a: 'תלוי בשימוש: בנזין מתאים לנסיעות עירוניות וקצרות, דיזל משתלם לנוסעים הרבה בכביש הבין-עירוני. כיום רבים בוחרים בהיברידי או חשמלי לחיסכון מרבי.' },
    { q: 'האם כדאי לקנות רכב היברידי?', a: 'רכב היברידי חוסך דלק משמעותית בעיר, שקט יותר ובעל ערך מכירה חוזר טוב. אם רוב הנסיעה שלכם עירונית — זו בחירה משתלמת מאוד.' },
    { q: 'מה ההבדל בין תיבת הילוכים אוטומטית לרובוטית?', a: 'תיבה אוטומטית קלאסית חלקה ואמינה; תיבה רובוטית (DCT) מעבירה הילוכים מהר יותר וחסכונית, אך עשויה להיות פחות חלקה בנסיעה איטית. שתיהן אינן דורשות תפעול ידני.' },
    { q: 'איך יודעים אם יש מספיק מקום בתא המטען?', a: 'בטבלת ההשוואה מוצג נפח תא המטען בליטרים. כלל אצבע: עד 400 ליטר מתאים לזוג, 400-500 למשפחה קטנה, ומעל 500 ליטר למשפחה גדולה או נסיעות עם ציוד רב.' }
  ];
  var faqList = document.getElementById('cmpFaqList');
  if (faqList) {
    faqList.innerHTML = FAQ.map(function (f) {
      return '<div class="cmp-faq-item"><button class="cmp-faq-q">' + f.q + '<span class="pm"></span></button><div class="cmp-faq-a"><p>' + f.a + '</p></div></div>';
    }).join('');
    faqList.addEventListener('click', function (e) {
      var q = e.target.closest('.cmp-faq-q'); if (!q) return;
      var item = q.parentNode, a = item.querySelector('.cmp-faq-a');
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
  }

  render();
})();
