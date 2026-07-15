/* ============================================================
   Car2Buy — shared loan-questionnaire modal.
   Self-injects styles + markup, wires the 3-step wizard, and
   opens on any [data-open-loan] click. Reuses LOAN_CARS data.
   Include after models-data.js / loan-cars.js.
   ============================================================ */
(function () {
  if (window.__c2bLoanModal) return;
  window.__c2bLoanModal = true;

  var CSS = ''
    + '.lnm{position:fixed;inset:0;z-index:240;display:none}'
    + '.lnm.open{display:block}'
    + '.lnm-ov{position:absolute;inset:0;background:rgba(10,10,12,.55);backdrop-filter:blur(3px)}'
    + '.lnm-card{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow-y:auto;background:#fff;border-radius:24px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);animation:lnmPop .3s ease}'
    + '@keyframes lnmPop{from{opacity:0;transform:translate(-50%,-46%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}'
    + '.lnm-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:center;padding:20px;background:#fff;border-bottom:1px solid var(--line-2)}'
    + '.lnm-x{position:absolute;inset-inline-start:16px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:14px;cursor:pointer;display:grid;place-items:center;transition:.2s}'
    + '.lnm-x:hover{background:var(--bg-2)}'
    + '.lnm-brand{font-family:var(--display);font-weight:900;font-size:22px;letter-spacing:-.02em;color:var(--ink);direction:ltr}'
    + '.lnm-brand b{color:var(--gold)}'
    + '.lnm-body{padding:clamp(24px,4vw,40px)}'
    + '.lnm-note{font-size:11.5px;color:var(--muted-2);text-align:center;padding:0 26px 24px;line-height:1.5}'
    + '.lnm-step{display:none}.lnm-step.active{display:block;animation:revealIn .4s ease both}'
    + '.lnm-head{display:flex;align-items:center;gap:14px}'
    + '.lnm-head-t{flex:1}'
    + '.lnm-badge{flex-shrink:0;width:60px;height:60px;border-radius:50%;background:#fff;border:1px solid var(--line-2);box-shadow:0 12px 26px -14px rgba(0,0,0,.45);display:grid;place-items:center;font-size:28px}'
    + '.lnm-k{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}'
    + '.lnm-step h3{font-size:clamp(20px,2.6vw,26px);margin-top:6px;color:var(--ink)}'
    + '.lnm-sub{color:var(--muted);font-size:14.5px;margin-top:10px}'
    + '.lnm-field{margin-top:22px}'
    + '.lnm-field .row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px}'
    + '.lnm-field label{font-size:15px;color:var(--ink-soft);font-weight:600}'
    + '.lnm-field .value{font-family:var(--display);font-size:24px;color:var(--gold);font-weight:700}'
    + '.lnm-ticks{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px;color:var(--muted-2);margin-top:8px}'
    + '.lnm-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:6px}'
    + '.lnm-opt{padding:20px 12px;border:1.5px solid var(--line);background:var(--bg);border-radius:14px;cursor:pointer;text-align:center;transition:.25s}'
    + '.lnm-opt:hover{border-color:var(--gold-line)}'
    + '.lnm-opt.active{border-color:var(--gold);background:color-mix(in oklab,var(--gold) 8%, var(--bg))}'
    + '.lnm-opt .oic{font-size:24px}.lnm-opt b{display:block;margin-top:8px;font-size:14.5px;color:var(--ink)}'
    + '.lnm-selects{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}'
    + '.lnm-sel,.lnm-in{width:100%;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;text-align:right}'
    + '.lnm-sel:focus,.lnm-in:focus{outline:none;border-color:var(--gold)}'
    + '.lnm-carcard{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:16px;border:1px solid var(--line-2);border-radius:16px;padding:16px 18px;background:var(--bg-1)}'
    + '.lnm-carcard-name{font-weight:700;font-size:16px;color:var(--ink)}'
    + '.lnm-carcard-trim{font-size:12px;color:var(--muted);margin-top:3px}'
    + '.lnm-cc-monthly{font-family:var(--display);font-weight:800;font-size:22px;color:var(--gold-deep);line-height:1}'
    + '.lnm-cc-monthly small{font-family:var(--body);font-size:11px;color:var(--muted);font-weight:400}'
    + '.lnm-cc-tag{display:inline-block;margin-top:5px;font-size:11px;font-weight:600;color:var(--gold-deep);background:color-mix(in oklab,var(--gold) 13%, #fff);border:1px solid var(--gold-line);border-radius:999px;padding:3px 10px}'
    + '.lnm-uploads{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}'
    + '.lnm-up{position:relative;border:1.5px dashed var(--line);border-radius:14px;padding:20px 16px;text-align:center;cursor:pointer;transition:.25s}'
    + '.lnm-up:hover{border-color:var(--gold-line)}'
    + '.lnm-up.filled{border-style:solid;border-color:var(--gold);background:color-mix(in oklab,var(--gold) 7%, var(--bg))}'
    + '.lnm-up input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer}'
    + '.lnm-up .uic{width:40px;height:40px;margin:0 auto 8px;border-radius:12px;display:grid;place-items:center;background:var(--bg-2);color:var(--gold)}'
    + '.lnm-up .uic svg{width:20px;height:20px}'
    + '.lnm-up b{display:block;font-size:14px;color:var(--ink)}.lnm-up span{display:block;font-size:12px;color:var(--muted);margin-top:3px}'
    + '.lnm-consent{display:flex;gap:10px;align-items:flex-start;margin-top:18px;font-size:13px;color:var(--muted);line-height:1.5}'
    + '.lnm-consent input{margin-top:3px;accent-color:var(--gold)}'
    + '.lnm-actions{display:flex;gap:12px;margin-top:26px}.lnm-actions .btn{flex:1}.lnm-back{flex:0 0 auto!important}'
    + '.lnm-success{text-align:center;padding:16px 8px}'
    + '.lnm-check{width:68px;height:68px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(150deg,var(--gold-bright),var(--gold-deep));color:#fff;font-size:34px}'
    + '.lnm-success h3{font-size:24px;color:var(--ink)}.lnm-success p{color:var(--muted);margin-top:10px;font-size:15px}'
    + '.lnm-sum{text-align:start;max-width:420px;margin:22px auto 0;border:1px solid var(--line-2);border-radius:14px;overflow:hidden}'
    + '.lnm-sum-row{display:flex;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--line-2);font-size:14px}'
    + '.lnm-sum-row:last-child{border-bottom:0}.lnm-sum-row span{color:var(--muted)}.lnm-sum-row b{color:var(--ink)}'
    + '@media (max-width:560px){.lnm-opts{grid-template-columns:1fr}.lnm-selects,.lnm-uploads{grid-template-columns:1fr}}';

  var HTML = ''
    + '<div class="lnm-ov" data-lnm-close></div>'
    + '<div class="lnm-card" role="dialog" aria-modal="true" aria-label="בקשת הלוואה לרכב">'
    +   '<div class="lnm-top"><button class="lnm-x" type="button" data-lnm-close aria-label="סגור">✕</button><div class="lnm-brand">Car<b>2</b>Buy</div></div>'
    +   '<div class="lnm-body">'
    +     '<div class="lnm-step active" data-step="1">'
    +       '<div class="lnm-head"><div class="lnm-badge">💰</div><div class="lnm-head-t"><div class="lnm-k">שלב 1 מתוך 3</div><h3>מה גובה המימון הנדרש?</h3></div></div>'
    +       '<p class="lnm-sub">הזיזו את המחוון ובחרו את סכום המימון המבוקש.</p>'
    +       '<div class="lnm-field"><div class="row"><label for="lnmAmount">סכום המימון</label><div class="value" id="lnmAmountVal">₪150,000</div></div>'
    +         '<input type="range" id="lnmAmount" min="20000" max="600000" step="5000" value="150000">'
    +         '<div class="lnm-ticks"><span>₪20,000</span><span>₪600,000</span></div></div>'
    +       '<div class="lnm-actions"><button type="button" class="btn btn-gold btn-lg" id="lnmNext1">המשך לבחירת רכב ←</button></div>'
    +     '</div>'
    +     '<div class="lnm-step" data-step="2">'
    +       '<div class="lnm-head"><div class="lnm-badge">🚗</div><div class="lnm-head-t"><div class="lnm-k">שלב 2 מתוך 3</div><h3>איזה רכב מעניין אתכם?</h3></div></div>'
    +       '<p class="lnm-sub">כבר יודעים מה אתם רוצים, או שעדיין מתלבטים? שתי האפשרויות מצוינות.</p>'
    +       '<div class="lnm-opts" id="lnmKind" style="margin-top:18px">'
    +         '<div class="lnm-opt" data-v="רכב חדש"><div class="oic">🚗</div><b>רכב חדש</b></div>'
    +         '<div class="lnm-opt" data-v="רכב יד 2"><div class="oic">🔑</div><b>רכב יד 2</b></div>'
    +         '<div class="lnm-opt" data-v="עדיין מתלבט/ת"><div class="oic">💭</div><b>עדיין מתלבט/ת</b></div></div>'
    +       '<div id="lnmCarPick" hidden><div class="lnm-selects">'
    +         '<select class="lnm-sel" id="lnmBrand"><option value="">בחרו יצרן</option></select>'
    +         '<select class="lnm-sel" id="lnmModel" disabled><option value="">בחרו יצרן תחילה</option></select></div>'
    +         '<div class="lnm-carcard" id="lnmCarCard" hidden><div><div class="lnm-carcard-name" id="lnmCarName"></div><div class="lnm-carcard-trim" id="lnmCarTrim"></div></div>'
    +           '<div style="text-align:start"><div class="lnm-cc-monthly"><span id="lnmCarMonthly">₪0</span><small> / חודש</small></div><span class="lnm-cc-tag">החזר חודשי</span></div></div></div>'
    +       '<div class="lnm-actions"><button type="button" class="btn btn-ghost btn-lg lnm-back" id="lnmBack2">→ חזרה</button><button type="button" class="btn btn-gold btn-lg" id="lnmNext2">המשך לפרטים ←</button></div>'
    +     '</div>'
    +     '<div class="lnm-step" data-step="3">'
    +       '<div class="lnm-head"><div class="lnm-badge">📄</div><div class="lnm-head-t"><div class="lnm-k">שלב 3 מתוך 3</div><h3>מסמכים ופרטים</h3></div></div>'
    +       '<p class="lnm-sub">תעודת זהות ורישיון נהיגה בתוקף מזרזים את האישור. הכל מאובטח ומשמש את ועדת האשראי בלבד.</p>'
    +       '<div class="lnm-uploads">'
    +         '<label class="lnm-up" id="lnmUpId"><input type="file" accept="image/*,.pdf" id="lnmFileId"><div class="uic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><path d="M15 9h3M15 13h3M5 17c1.5-2 5-2 6.5 0"></path></svg></div><b>תעודת זהות</b><span>צילום או PDF · לחצו לצירוף</span></label>'
    +         '<label class="lnm-up" id="lnmUpLic"><input type="file" accept="image/*,.pdf" id="lnmFileLic"><div class="uic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20M6 15h5"></path></svg></div><b>רישיון נהיגה</b><span>צילום או PDF · לחצו לצירוף</span></label></div>'
    +       '<div class="lnm-selects" style="margin-top:14px"><input class="lnm-in" type="text" id="lnmName" placeholder="שם מלא"><input class="lnm-in" type="tel" id="lnmPhone" placeholder="טלפון נייד"></div>'
    +       '<label class="lnm-consent"><input type="checkbox" id="lnmConsent" checked>אני מאשר/ת קבלת פנייה מ-Car2Buy ושימוש במסמכים שצורפו לצורך בדיקת זכאות למימון בלבד.</label>'
    +       '<div class="lnm-actions"><button type="button" class="btn btn-ghost btn-lg lnm-back" id="lnmBack3">→ חזרה</button><button type="button" class="btn btn-gold btn-lg" id="lnmSubmit">שליחת הבקשה</button></div>'
    +     '</div>'
    +     '<div class="lnm-step" data-step="4"><div class="lnm-success"><div class="lnm-check">✓</div><h3>הבקשה נשלחה!</h3><p>יועץ מימון אישי של Car2Buy יחזור אליכם תוך כ-30 דקות עם הצעה מוכנה.</p><div class="lnm-sum" id="lnmSummary"></div></div></div>'
    +   '</div>'
    +   '<p class="lnm-note">ההחזר החודשי המוצג הוא משוער בלבד ואינו מהווה הצעה מחייבת. תנאי העסקה כפופים לאישור גוף מימון ולנתוני הלקוח. * הפרטים נשמרים לצורך ההדגמה בלבד.</p>'
    + '</div>';

  function boot() {
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var modal = document.createElement('div'); modal.className = 'lnm'; modal.id = 'lnmModal'; modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = HTML; document.body.appendChild(modal);

    var fmt = function (n) { return '₪' + Math.round(n).toLocaleString('en-US'); };
    var $ = function (id) { return document.getElementById(id); };

    var amount = $('lnmAmount'), amountVal = $('lnmAmountVal');
    function paint() { var min = +amount.min, max = +amount.max, v = +amount.value, pct = ((v - min) / (max - min)) * 100; amount.style.background = 'linear-gradient(90deg, var(--bg-3) 0 ' + (100 - pct) + '%, var(--gold-deep) ' + (100 - pct) + '% 100%)'; }
    function calc() { amountVal.textContent = fmt(+amount.value); paint(); }
    amount.addEventListener('input', calc); calc();

    function goStep(n) {
      [].forEach.call(modal.querySelectorAll('.lnm-step'), function (s) { s.classList.toggle('active', +s.dataset.step === n); });
      var card = modal.querySelector('.lnm-card'); if (card) card.scrollTop = 0;
    }
    function open() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    window.openLoanModal = open;
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-loan]')) { e.preventDefault(); open(); }
      else if (e.target.closest('[data-lnm-close]')) { close(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    $('lnmNext1').addEventListener('click', function () { goStep(2); });
    $('lnmBack2').addEventListener('click', function () { goStep(1); });
    $('lnmBack3').addEventListener('click', function () { goStep(2); });

    var want = { kind: '', brand: '', model: '', car: null };
    var kindWrap = $('lnmKind'), carPick = $('lnmCarPick'), brandSel = $('lnmBrand'), modelSel = $('lnmModel'), carCard = $('lnmCarCard');
    var CARS = (window.Car2Buy && window.Car2Buy.LOAN_CARS) || [];
    function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
    function carLabel(c) { var mdl = (window.Car2Buy && window.Car2Buy.enModel) ? window.Car2Buy.enModel(c.name) : c.name; return mdl + (c.trim ? ' · ' + c.trim : ''); }
    if (CARS.length) {
      var brands = uniq(CARS.map(function (c) { return c.brand; }));
      var dB = (window.Car2Buy && window.Car2Buy.dispBrand) ? window.Car2Buy.dispBrand : function (b) { return b; };
      brandSel.innerHTML = '<option value="">בחרו יצרן</option>' + brands.map(function (b) { return '<option value="' + b + '">' + dB(b) + '</option>'; }).join('');
    }
    brandSel.addEventListener('change', function () {
      want.brand = brandSel.value; want.model = ''; want.car = null; if (carCard) carCard.hidden = true;
      var list = want.brand ? CARS.filter(function (c) { return c.brand === want.brand; }) : [];
      modelSel.innerHTML = '<option value="">' + (want.brand ? 'בחרו דגם' : 'בחרו יצרן תחילה') + '</option>' + list.map(function (c, i) { return '<option value="' + i + '">' + carLabel(c) + '</option>'; }).join('');
      modelSel.disabled = !want.brand; modelSel._list = list;
    });
    modelSel.addEventListener('change', function () {
      var list = modelSel._list || [], c = list[+modelSel.value];
      if (!c) { want.model = ''; want.car = null; if (carCard) carCard.hidden = true; return; }
      want.model = carLabel(c); want.car = c;
      $('lnmCarName').textContent = (window.Car2Buy && window.Car2Buy.enName) ? window.Car2Buy.enName(c) : c.brand + ' ' + c.name;
      $('lnmCarTrim').textContent = c.trim ? 'רמת גימור: ' + c.trim : '';
      $('lnmCarMonthly').textContent = fmt(c.m);
      if (carCard) carCard.hidden = false;
    });
    kindWrap.addEventListener('click', function (e) {
      var o = e.target.closest('.lnm-opt'); if (!o) return;
      [].forEach.call(kindWrap.children, function (x) { x.classList.toggle('active', x === o); });
      want.kind = o.dataset.v; carPick.hidden = (want.kind === 'עדיין מתלבט/ת');
    });
    $('lnmNext2').addEventListener('click', function () {
      if (!want.kind) { kindWrap.style.animation = 'revealIn .3s'; setTimeout(function () { kindWrap.style.animation = ''; }, 320); return; }
      goStep(3);
    });

    function bindUpload(wrapId, inputId) {
      var wrap = $(wrapId), input = $(inputId);
      input.addEventListener('change', function () {
        if (input.files && input.files.length) { wrap.classList.add('filled'); wrap.querySelector('span').textContent = input.files[0].name; }
        else wrap.classList.remove('filled');
      });
    }
    bindUpload('lnmUpId', 'lnmFileId'); bindUpload('lnmUpLic', 'lnmFileLic');

    $('lnmSubmit').addEventListener('click', function () {
      var name = $('lnmName'), phone = $('lnmPhone'), consent = $('lnmConsent'), ok = true;
      [name, phone].forEach(function (f) { if (!f.value.trim()) { f.style.borderColor = '#e25555'; ok = false; } else f.style.borderColor = ''; });
      if (!consent.checked) { consent.parentNode.style.color = 'var(--gold)'; ok = false; } else consent.parentNode.style.color = '';
      if (!ok) return;
      var carLine = want.kind || '—';
      if (want.kind === 'רכב חדש' || want.kind === 'רכב יד 2') { if (want.brand) carLine += ' · ' + want.brand + (want.model ? ' ' + want.model : ''); }
      var rows = [['סכום מבוקש', fmt(+amount.value)]];
      if (want.car) rows.push(['החזר חודשי', fmt(want.car.m) + ' / חודש']);
      rows.push(['מתעניינ/ת ב', carLine]); rows.push(['שם', name.value.trim()]); rows.push(['טלפון', phone.value.trim()]);
      $('lnmSummary').innerHTML = rows.map(function (r) { return '<div class="lnm-sum-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
      if (window.c2bTrack) window.c2bTrack('car_loan_submit', { amount: +amount.value, car: carLine });
      if (window.submitLead) submitLead({ name: name.value.trim(), phone: phone.value.trim(), car: carLine, message: 'סכום מבוקש: ' + fmt(+amount.value), source: 'car_loan', meta: { amount: +amount.value, kind: want.kind, brand: want.brand, model: want.model } });
      goStep(4);
    });

    // open pre-filled for a specific inventory car (by id)
    window.openLoanModalWithCar = function (carId) {
      open();
      var c = null;
      for (var i = 0; i < CARS.length; i++) { if (CARS[i].id === carId) { c = CARS[i]; break; } }
      if (!c) { goStep(1); return; }
      [].forEach.call(kindWrap.children, function (x) { x.classList.toggle('active', x.dataset.v === 'רכב חדש'); });
      want.kind = 'רכב חדש'; carPick.hidden = false;
      brandSel.value = c.brand; brandSel.dispatchEvent(new Event('change'));
      var list = modelSel._list || [];
      var idx = list.indexOf(c);
      if (idx < 0) { for (var j = 0; j < list.length; j++) { if (list[j].id === c.id) { idx = j; break; } } }
      if (idx >= 0) { modelSel.value = String(idx); modelSel.dispatchEvent(new Event('change')); }
      goStep(2);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
