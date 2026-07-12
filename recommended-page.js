/* ============================================================
   Car2Buy — recommended cars page (Capital-style grid).
   Renders the real inventory as recommended cards + banners,
   brand cloud, content columns, and the Google reviews popup.
   ============================================================ */
(function () {
  var C2B = window.Car2Buy;
  if (!C2B || !document.getElementById('rcGrid')) return;
  var MODELS = C2B.MODELS || [];
  var NIS = C2B.NIS || function (n) { return '₪' + Number(n).toLocaleString('en-US'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var dispBrand = C2B.dispBrand || function (b) { return b; };
  var enModel = C2B.enModel || function (n) { return n; };
  var LOGO = C2B.LOGO || function () { return ''; };
  var POOL = MODELS.map(function (m) { return m.img; }).filter(Boolean);
  var at = function (i) { return POOL.length ? POOL[i % POOL.length] : ''; };

  // brand → logo dataset slug (via BRANDS_ALL name match on Hebrew he)
  var SLUG = {};
  (C2B.BRANDS_ALL || []).forEach(function (b) { if (b.he) SLUG[b.he] = b.slug; SLUG[b.name] = b.slug; });
  function brandLogo(he) {
    var slug = SLUG[he];
    return slug ? 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/' + slug + '.png' : '';
  }

  function card(m) {
    var logo = brandLogo(m.brand);
    var bn = dispBrand(m.brand);
    var mdl = enModel(m.name);
    var drive = m.drive || 'קדמית';
    var powerLine = m.power ? m.power + ' כ״ס' : '';
    return '<article class="rc-card">' +
      '<a class="rc-img" href="#" data-loan="' + m.id + '">' +
        (m.img ? '<img loading="lazy" src="' + esc(m.img) + '" alt="' + esc(bn + ' ' + mdl) + '" onerror="this.style.visibility=\'hidden\'">' : '') +
        '<span class="rc-fast-tag">אספקה מהירה</span>' +
      '</a>' +
      '<div class="rc-body">' +
        '<div class="rc-card-top">' +
          '<div>' +
            '<div class="rc-brandline">' +
              (logo ? '<img class="logo" src="' + logo + '" alt="' + esc(bn) + '" onerror="this.remove()">' : '') +
              '<span class="bn">' + esc(bn) + ' ' + esc(mdl) + '</span>' +
            '</div>' +
            '<div class="rc-trim">' + esc(m.trim || m.type || '') + '</div>' +
          '</div>' +
          '<button type="button" class="rc-spec-btn" data-spec="' + m.id + '">מפרט טכני</button>' +
        '</div>' +
        '<div class="rc-attrs" data-loan="' + m.id + '" style="cursor:pointer;">' +
          '<span>' + esc(m.type || '') + '</span>' + (powerLine ? '<span class="sep"></span><span>' + powerLine + '</span>' : '') +
          '<span class="sep"></span><span>הנעה ' + esc(drive) + '</span>' +
        '</div>' +
        '<a class="rc-pay" href="#" data-loan="' + m.id + '"><span class="lbl">החזר חודשי החל מ-</span><span class="amt">' + NIS(m.monthly) + '</span></a>' +
        '<div class="rc-list" data-loan="' + m.id + '" style="cursor:pointer;">מחיר מחירון: <b>' + NIS(m.list) + '</b></div>' +
      '</div>' +
    '</article>';
  }

  var tradeBanner = '<div class="rc-banner"><div class="bt"><h3>רוצים להחליף את הרכב הישן?</h3><p>לקבלת הצעת מחיר בעסקת טרייד-אין</p></div><a class="btn btn-gold btn-lg" href="trade-in.html">התחילו כאן ←</a></div>';
  var helpBanner = '<div class="rc-banner help"><div class="bt"><h3>לא מצאתם את הרכב המושלם?</h3><p>תמיד אפשר לבקש ייעוץ אישי</p></div><div class="rc-banner-btns"><a class="btn btn-gold btn-lg" href="https://wa.me/97237777777" target="_blank" rel="noopener">דברו איתנו בוואטסאפ</a><button type="button" class="btn btn-ghost btn-lg" data-open-appt style="color:#fff;border-color:rgba(255,255,255,.4);">קובעים פגישה בקליק</button></div></div>';

  // build grid: cards with banners interspersed every ~6 cards
  var grid = document.getElementById('rcGrid');
  var html = '', banners = [tradeBanner, helpBanner], bi = 0;
  MODELS.forEach(function (m, i) {
    html += card(m);
    if ((i + 1) % 6 === 0 && i < MODELS.length - 1) { html += banners[bi % banners.length]; bi++; }
  });
  grid.innerHTML = html;

  // content columns
  var COLS = [
    { t: 'איך לבחור את הרכב הבא שלכם?', b: 'ב-Car2Buy אנחנו מבינים שרכישת רכב היא החלטה משמעותית הדורשת מחשבה, השוואה ובחינה מעמיקה. לכן הקפדנו לבחור ולהציג בפניכם את הרכבים המומלצים בשוק הישראלי, תוך התחשבות מלאה בצרכים המגוונים של כל נהג ונהגת. הרשימה נבנתה בקפידה על ידי צוות מומחים שבחנו מאות דגמים ובחרו רק את המובילים בקטגוריה — לפי <a href="finance-electric.html">חיסכון בדלק</a>, עלויות תחזוקה, בטיחות, נוחות ויחס מחיר-תמורה.', img: at(3) },
    { t: 'מגוון רחב לכל צורך ותקציב', b: 'בין אם אתם משפחה המחפשת רכב מרווח ובטוח, זוג צעיר המעוניין ברכב עירוני חסכוני, או נהג שמחפש רכב שטח מתקדם — תמצאו כאן את המענה המושלם. אנחנו מציעים פתרונות מימון גמישים המותאמים לכל תקציב, ליווי צמוד לאורך כל תהליך הרכישה ו<a href="contact.html">ייעוץ מקצועי</a> ללא התחייבות.', img: at(9) },
    { t: 'שירות אישי ומקצועי', b: 'Car2Buy מתחייבת לשקיפות מלאה ולשירות אמין. כל רכב בקטגוריית הרכבים המומלצים עבר סקירה, ואנחנו מספקים אותו 0 ק״מ עם אחריות יצרן מלאה. אנחנו מאמינים שלקוח מרוצה הוא הפרסום הטוב ביותר שלנו — <a href="contact.html">צרו איתנו קשר</a> עוד היום וגלו מדוע אלפי לקוחות בחרו בנו.', img: at(15) }
  ];
  var cols = document.getElementById('rcCols');
  if (cols) cols.innerHTML = COLS.map(function (c) {
    return '<div class="rc-col"><h3>' + c.t + '</h3><p>' + c.b + '</p><div class="pic"><img loading="lazy" src="' + esc(c.img) + '" alt="' + esc(c.t) + '" onerror="this.closest(\'.pic\').style.display=\'none\'"></div></div>';
  }).join('');

  // Google reviews popup
  var pop = document.getElementById('rcGrevPop'), list = document.getElementById('rcGrevList');
  if (pop && list) {
    var AV = ['#1A73E8', '#E8453C', '#34A853', '#9334E6', '#F9AB00', '#00897B'];
    var gsvg = '<svg viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>';
    var reviews = [
      { n: 'Shahar As', c: 5, t: 'לפני שבוע', b: 'רכב שני שאני קונה דרך Car2Buy, מספר 1 בשירות. ליווי צמוד מההתחלה ועד מסירת הרכב. תודה לכל הצוות!' },
      { n: 'אפרים גניש', c: 6, t: 'לפני שבועיים', b: 'מספר אחת! אלופי העולם. שירות מקצועי, יחס אישי וסבלנות אינסופית. ממליץ בחום.' },
      { n: 'דניאל מזרחי', c: 3, t: 'לפני חודש', b: 'תהליך חכם ונוח. הסוכן היה בקשר תמידי בכל שלב. תוך ימים קיבלתי את רכב החלומות שלי!' },
      { n: 'שירה לוי', c: 8, t: 'לפני חודש', b: 'חיפשתי רכב בצבע ספציפי ולא מצאתי בשום מקום. ב-Car2Buy סידרו לי בדיוק את מה שרציתי בתנאי מימון מעולים.' },
      { n: 'Avi Cohen', c: 2, t: 'לפני חודשיים', b: 'שירות מעולה ואדיב, תוך מספר ימים קיבלתי את הרכב המושלם שלי. בהחלט אחזור.' },
      { n: 'מאיה ברק', c: 4, t: 'לפני חודשיים', b: 'תשלומים גמישים והחזר חודשי קבוע, בדיוק מה שחיפשתי. הכל שקוף ובלי הפתעות.' },
      { n: 'יוסי אברהם', c: 1, t: 'לפני 3 חודשים', b: 'עברתי לרכב חשמלי דרך Car2Buy והחוויה הייתה מושלמת. צוות מקצועי שמבין עניין.' },
      { n: 'Noa Friedman', c: 7, t: 'לפני 3 חודשים', b: 'אחרי שהשוויתי המון מקומות, Car2Buy נתנו לי את ההצעה הכי משתלמת. ממליצה לכולם.' }
    ];
    list.innerHTML = reviews.map(function (r, i) {
      return '<div class="rc-grev-item"><div class="rc-grev-top"><div class="rc-grev-av" style="background:' + AV[i % AV.length] + '">' + (r.n.replace(/[^\u05D0-\u05EAA-Za-z]/g, '').charAt(0) || 'G') + '</div>' +
        '<div><div class="rc-grev-name">' + r.n + '</div><div class="rc-grev-sub">' + r.c + ' ביקורות</div></div></div>' +
        '<div class="rc-grev-meta"><span class="gstars">★★★★★</span><span class="rc-grev-time">' + r.t + '</span></div>' +
        '<div class="rc-grev-body">' + r.b + '</div></div>';
    }).join('');
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-grev]')) { pop.classList.add('open'); pop.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
      else if (e.target.closest('[data-grev-close]')) { pop.classList.remove('open'); pop.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pop.classList.remove('open'); document.body.style.overflow = ''; } });
  }

  // ============================================================
  // SPEC POPUP + APPOINTMENT POPUP + card click wiring
  // ============================================================
  function seed(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function rnd(id, k, a, b) { return a + (seed(id + '|' + k) % (b - a + 1)); }
  function pk(id, k, arr) { return arr[seed(id + '|' + k) % arr.length]; }
  function specData(m) {
    var fuel = m.fuel || '', isEV = /חשמלי/.test(fuel), isPHEV = /נטען/.test(fuel);
    var sz = m.list < 120000 ? 'mini' : m.list < 200000 ? 'compact' : m.list < 330000 ? 'mid' : 'large';
    var base = { mini: [3900, 1730, 1550], compact: [4350, 1810, 1580], mid: [4620, 1860, 1650], large: [4900, 1930, 1710] }[sz];
    var trunk = ({ mini: 320, compact: 440, mid: 520, large: 610 }[sz]) + rnd(m.id, 't', -30, 120);
    var curb = ({ mini: 1250, compact: 1450, mid: 1690, large: 1980 }[sz]) + (isEV ? 250 : 0) + rnd(m.id, 'c', -60, 110);
    var battery = isEV ? (48 + Math.round((m.power || 150) / 6) + rnd(m.id, 'b', -4, 8)) : isPHEV ? (16 + rnd(m.id, 'b2', 0, 6)) : null;
    var range = isEV ? Math.round(250 + (battery - 48) * 6 + rnd(m.id, 'r', -20, 50)) : isPHEV ? rnd(m.id, 'er', 60, 90) : null;
    return {
      'כללי': [['יצרן', dispBrand(m.brand)], ['דגם', enModel(m.name)], ['רמת גימור', m.trim || '—'], ['קטגוריה', m.type || '—'], ['שנתון', m.year || 2026], ['מספר מושבים', m.seats || 5]],
      'מנוע וביצועים': [['סוג מנוע', fuel], ['הספק', (m.power || '—') + ' כ״ס'], ['תאוצה 0-100', (m.accel || '—') + ' שנ׳'], ['תיבת הילוכים', isEV ? 'רדוקציה' : pk(m.id, 'g', ['אוטומטית 7 הילוכים', 'אוטומטית 8 הילוכים', 'רובוטית DCT'])], ['הנעה', m.drive || 'קדמית']].concat(
        battery ? [['קיבולת סוללה', battery + ' קוט״ש'], ['טווח נסיעה', range + ' ק״מ']] : []),
      'מידות ותא מטען': [['אורך', (base[0] + rnd(m.id, 'l', -60, 120)) + ' מ״מ'], ['רוחב', (base[1] + rnd(m.id, 'w', -30, 50)) + ' מ״מ'], ['גובה', (base[2] + rnd(m.id, 'h', -40, 80)) + ' מ״מ'], ['נפח תא מטען', trunk + ' ליטר'], ['משקל עצמי', curb + ' ק״ג']],
      'בטיחות ואבזור': [['רמת בטיחות', rnd(m.id, 'sl', 5, 8) + ' מתוך 8'], ['כריות אוויר', rnd(m.id, 'ab', 6, 8)], ['בלימת חירום אוטומטית', '✓'], ['בקרת שיוט אדפטיבית', (seed(m.id + 'acc') % 100 < 66) ? '✓' : '✗'], ['מסך מולטימדיה', pk(m.id, 's', ['10.1', '12.3', '12.8', '15.6']) + ' אינץ׳'], ['חיבור לנייד', (seed(m.id + 'cp') % 100 < 86) ? 'CarPlay / Android Auto' : '—']]
    };
  }

  // inject popups
  var wrapDiv = document.createElement('div');
  wrapDiv.innerHTML =
    '<div class="rc-spec-pop" id="rcSpecPop" aria-hidden="true"><div class="rc-grev-ov" data-spec-close></div>' +
      '<div class="rc-spec-card" role="dialog" aria-modal="true"><div class="rc-spec-head"><span id="rcSpecTitle"></span><button type="button" class="rc-grev-x" data-spec-close aria-label="סגור">✕</button></div>' +
      '<div class="rc-spec-body" id="rcSpecBody"></div>' +
      '<div class="rc-spec-foot"><button type="button" class="btn btn-gold btn-lg" id="rcSpecLoan">בדקו מסלול מימון לרכב זה ←</button></div></div></div>' +
    '<div class="rc-appt-pop" id="rcApptPop" aria-hidden="true"><div class="rc-grev-ov" data-appt-close></div>' +
      '<div class="rc-appt-card" role="dialog" aria-modal="true"><button type="button" class="rc-grev-x" data-appt-close aria-label="סגור" style="inset-inline-start:16px;inset-inline-end:auto;">✕</button>' +
      '<div class="rc-appt-head"><div class="rc-appt-ic">📅</div><h3>קובעים פגישה בקליק</h3><p>השאירו פרטים ונחזור אליכם לתיאום פגישה במתחם הקרוב אליכם.</p></div>' +
      '<form id="rcApptForm" class="rc-appt-form">' +
        '<input type="text" placeholder="שם מלא" required>' +
        '<input type="tel" placeholder="טלפון נייד" required>' +
        '<select required><option value="">מתי נוח לכם?</option><option>בבוקר (9:00-12:00)</option><option>בצהריים (12:00-16:00)</option><option>אחר הצהריים (16:00-19:00)</option></select>' +
        '<label class="rc-appt-consent"><input type="checkbox" required> אני מאשר/ת קבלת פנייה מ-Car2Buy לתיאום הפגישה.</label>' +
        '<button type="submit" class="btn btn-gold btn-lg">קביעת פגישה</button>' +
      '</form></div></div>';
  document.body.appendChild(wrapDiv);

  var specPop = document.getElementById('rcSpecPop'), specBody = document.getElementById('rcSpecBody'), specTitle = document.getElementById('rcSpecTitle');
  var apptPop = document.getElementById('rcApptPop');
  var specCarId = null;

  function byId(id) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i]; return null; }
  function openSpec(id) {
    var m = byId(id); if (!m) return;
    specCarId = id;
    specTitle.textContent = dispBrand(m.brand) + ' ' + enModel(m.name);
    var groups = specData(m), html = '';
    for (var g in groups) {
      html += '<div class="rc-spec-grp">' + g + '</div>';
      groups[g].forEach(function (r) {
        var cls = r[1] === '✓' ? ' class="yes"' : r[1] === '✗' ? ' class="no"' : '';
        html += '<div class="rc-spec-row"><span class="k">' + esc(r[0]) + '</span><span class="v"' + cls + '>' + esc(r[1]) + '</span></div>';
      });
    }
    specBody.innerHTML = html;
    specPop.classList.add('open'); specPop.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  function closeSpec() { specPop.classList.remove('open'); specPop.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  function closeAppt() { apptPop.classList.remove('open'); apptPop.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

  document.addEventListener('click', function (e) {
    var spec = e.target.closest('[data-spec]');
    if (spec) { e.preventDefault(); openSpec(spec.getAttribute('data-spec')); return; }
    var loan = e.target.closest('[data-loan]');
    if (loan) { e.preventDefault(); if (window.openLoanModalWithCar) window.openLoanModalWithCar(loan.getAttribute('data-loan')); return; }
    if (e.target.closest('[data-spec-close]')) { closeSpec(); return; }
    if (e.target.closest('[data-open-appt]')) { e.preventDefault(); apptPop.classList.add('open'); apptPop.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; return; }
    if (e.target.closest('[data-appt-close]')) { closeAppt(); return; }
    if (e.target.closest('#rcSpecLoan')) { closeSpec(); if (specCarId && window.openLoanModalWithCar) window.openLoanModalWithCar(specCarId); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSpec(); closeAppt(); } });
  var apptForm = document.getElementById('rcApptForm');
  if (apptForm) apptForm.addEventListener('submit', function (e) {
    e.preventDefault();
    apptForm.innerHTML = '<div style="text-align:center;color:#1f8a4c;font-weight:700;padding:20px 0;">תודה! ניצור קשר בהקדם לתיאום הפגישה ✓</div>';
  });
})();
