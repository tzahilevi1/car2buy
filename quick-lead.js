/* ============================================================
   Car2Buy — פופאפ ליד מהיר (השארת פרטים) לכתבות ולפוסטים.
   שדה הרכב נשאב אוטומטית כשנמצאים בדף רכב (window.__c2bCar) וניתן
   לעריכה; אחרת בוחרים דגם מהקטלוג באמצעות השלמה אוטומטית (datalist).
   חושף: window.C2B_openLead({ car, source }).
   כל אלמנט עם [data-open-lead] (ו-data-car / data-source אופציונליים)
   פותח את הפופאפ אוטומטית.
   ============================================================ */
(function () {
  var built = false, modal, els = {};

  function catalogNames() {
    var C = window.Car2Buy; if (!C) return [];
    var list = (C.MODELS && C.MODELS.length) ? C.MODELS : (C.LOAN_CARS || []);
    var seen = {}, out = [];
    list.forEach(function (m) {
      var n = (C.enName ? C.enName(m) : ((m.brand || '') + ' ' + (m.name || ''))).trim();
      if (n && !seen[n]) { seen[n] = 1; out.push(n); }
    });
    return out.sort();
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function build() {
    if (built) return; built = true;
    var opts = catalogNames().map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('');
    modal = document.createElement('div');
    modal.className = 'ql-modal';
    modal.id = 'qlModal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="ql-ov" data-ql-close></div>' +
      '<div class="ql-box" role="dialog" aria-modal="true" aria-label="השארת פרטים">' +
        '<button class="ql-x" type="button" data-ql-close aria-label="סגור">✕</button>' +
        '<div class="ql-head">' +
          '<div class="ql-eyebrow">הצעה אישית · מהיר וללא התחייבות</div>' +
          '<h3 class="ql-title">קבלו את ההחזר החודשי <span>הכי משתלם בישראל</span></h3>' +
          '<p class="ql-sub">משאירים פרטים ויועץ חוזר אליכם עם ההצעה הטובה ביותר — כולל טרייד־אין לרכב הישן.</p>' +
        '</div>' +
        '<form class="ql-form" id="qlForm" novalidate>' +
          '<input type="text" id="qlHp" name="company_url" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;">' +
          '<label class="ql-field"><span>הרכב שמעניין אתכם</span>' +
            '<input type="text" id="qlCar" list="qlCarList" placeholder="הקלידו או בחרו דגם מהקטלוג" autocomplete="off">' +
            '<datalist id="qlCarList">' + opts + '</datalist>' +
          '</label>' +
          '<div class="ql-row">' +
            '<label class="ql-field"><span>שם מלא</span><input type="text" id="qlName" required placeholder="השם שלכם"></label>' +
            '<label class="ql-field"><span>טלפון</span><input type="tel" id="qlPhone" required inputmode="tel" placeholder="050-0000000"></label>' +
          '</div>' +
          '<button type="submit" class="ql-submit">שלחו לי הצעה אישית ←</button>' +
          '<div class="ql-note">🔒 הפרטים נשמרים בבטחה. אין התחייבות — רק הצעה שתשוו בעצמכם.</div>' +
        '</form>' +
        '<div class="ql-ok" id="qlOk">' +
          '<div class="ql-ok-ic">✓</div>' +
          '<h3>קיבלנו את הפרטים!</h3>' +
          '<p>יועץ אישי מ־Car2Buy יחזור אליכם בהקדם עם ההצעה המשתלמת ביותר עבורכם.</p>' +
          '<button type="button" class="ql-submit" data-ql-close>סגירה</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    els.car = modal.querySelector('#qlCar');
    els.name = modal.querySelector('#qlName');
    els.phone = modal.querySelector('#qlPhone');
    els.form = modal.querySelector('#qlForm');
    els.ok = modal.querySelector('#qlOk');
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-ql-close]')) close(); });
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nm = els.name.value.trim(), ph = els.phone.value.trim();
      if (!nm) { els.name.focus(); return; }
      if (ph.replace(/\D/g, '').length < 8) { els.phone.focus(); return; }
      var hp = (modal.querySelector('#qlHp') || {}).value || '';
      if (window.submitLead) {
        window.submitLead({ name: nm, phone: ph, car: els.car.value.trim(), source: modal._source || 'article_cta', hp: hp });
      }
      els.form.style.display = 'none';
      els.ok.classList.add('show');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }

  function open(o) {
    build(); o = o || {};
    modal._source = o.source || 'article_cta';
    els.form.style.display = '';
    els.ok.classList.remove('show');
    var preset = o.car || window.__c2bCar || '';
    els.car.value = preset;
    els.name.value = ''; els.phone.value = '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { (preset ? els.name : els.car).focus(); }, 60);
  }
  function close() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.C2B_openLead = open;
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-lead]');
    if (!t) return;
    e.preventDefault();
    open({ car: t.getAttribute('data-car') || '', source: t.getAttribute('data-source') || 'article_cta' });
  });
})();
