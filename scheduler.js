/* ============================================================
   Car2Buy — Meeting Scheduler
   Opens from header "לתיאום פגישה". Pick day + time from a
   calendar, fill details, get a confirmation with prep list.
   (Static demo: confirmation is shown + emails are simulated —
   wire to a real backend/calendar API for production.)
   ============================================================ */
(function () {
  const ADVISOR_EMAIL = 'car2buy2@gmail.com'; // second recipient
  const BRANCHES = ['נצרת — הר הקפיצה', 'ראשון לציון — פלוטיצקי 6'];
  const PREP = [
    'תעודת זהות + רישיון נהיגה בתוקף',
    'שלושת תלושי השכר האחרונים (או אישור רו״ח לעצמאים)',
    'אם יש טריד-אין — רישיון הרכב הקיים ופרטי הקילומטראז׳',
    'רשימת הדגמים שמעניינים אתכם (אפשר מהקטלוג שלנו)',
  ];
  const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  let selDate = null, selTime = null, presetCar = '';
  const escAttr = (s) => String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function fmtDate(d) { return `${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

  // build the next N available days (skip Saturday)
  function availableDays(n) {
    const days = [], d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
    while (days.length < n) { if (d.getDay() !== 6) days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return days;
  }
  function slotsFor(d) {
    // Fri shorter hours
    const end = d.getDay() === 5 ? 13 : 18;
    const out = [];
    for (let h = 9; h <= end; h++) { out.push(`${String(h).padStart(2, '0')}:00`); if (h < end) out.push(`${String(h).padStart(2, '0')}:30`); }
    return out;
  }

  const root = document.createElement('div');
  root.id = 'scheduler';
  root.className = 'sched-overlay';
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);

  function shell(inner) {
    return `<div class="sched-modal" role="dialog" aria-label="תיאום פגישה">
      <button class="sched-close" id="schedClose" aria-label="סגור">×</button>${inner}</div>`;
  }

  function renderForm() {
    const days = availableDays(12);
    const dayBtns = days.map((d, i) =>
      `<button type="button" class="sched-day${selDate && selDate.toDateString() === d.toDateString() ? ' active' : ''}" data-i="${i}">
        <span class="sd-dow">${HE_DAYS[d.getDay()]}</span><span class="sd-num">${d.getDate()}</span><span class="sd-mon">${HE_MONTHS[d.getMonth()].slice(0, 3)}</span>
      </button>`).join('');
    const times = selDate ? slotsFor(selDate).map((t) =>
      `<button type="button" class="sched-time${selTime === t ? ' active' : ''}" data-t="${t}">${t}</button>`).join('') : '<p class="sched-hint">בחרו תאריך כדי לראות שעות פנויות</p>';

    root.querySelector('.sched-modal').innerHTML = `
      <button class="sched-close" id="schedClose" aria-label="סגור">×</button>
      <div class="sched-head">
        <div class="sched-eyebrow">תיאום פגישה</div>
        <h2>קבעו פגישה עם יועץ</h2>
        <p>בחרו יום ושעה שנוחים לכם — נשלח אישור למייל עם כל הפרטים ומה להכין.</p>
      </div>
      <form id="schedForm" class="sched-body">
        <div class="sched-step"><span class="sched-step-n">1</span> בחרו תאריך</div>
        <div class="sched-days">${dayBtns}</div>
        <div class="sched-step"><span class="sched-step-n">2</span> בחרו שעה</div>
        <div class="sched-times" id="schedTimes">${times}</div>
        <div class="sched-step"><span class="sched-step-n">3</span> הפרטים שלכם</div>
        <div class="sched-fields">
          <input type="text" id="sName" placeholder="שם מלא" required>
          <input type="tel" id="sPhone" placeholder="טלפון" required>
          <input type="email" id="sEmail" placeholder="אימייל (לשליחת האישור)" required>
          <input type="text" id="sCar" placeholder="הרכב שמעניין אתכם" value="${escAttr(presetCar)}">
          <select id="sType">
            <option value="פגישה בסניף">פגישה בסניף</option>
            <option value="שיחת טלפון">שיחת טלפון</option>
            <option value="פגישת וידאו">פגישת וידאו (זום)</option>
          </select>
          <select id="sBranch">${BRANCHES.map((b) => `<option>${b}</option>`).join('')}</select>
          <textarea id="sNote" placeholder="הערה / רכב שמעניין אתכם (לא חובה)"></textarea>
        </div>
        <div class="sched-err" id="sErr"></div>
        ${window.C2B_consentHTML ? window.C2B_consentHTML() : ''}
        <button type="submit" class="btn btn-gold sched-submit">אשרו ושלחו</button>
        <p class="sched-legal">בלחיצה על "אשרו ושלחו" יישלח אישור פגישה למייל שלכם וליועץ. ניתן לשנות או לבטל בכל עת.</p>
      </form>`;
    bindForm();
  }

  function renderSuccess(data) {
    root.querySelector('.sched-modal').innerHTML = `
      <button class="sched-close" id="schedClose" aria-label="סגור">×</button>
      <div class="sched-success">
        <div class="sched-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></div>
        <h2>הפגישה נקבעה!</h2>
        <p class="sched-sub">שלחנו אישור עם כל הפרטים אל <b>${data.email}</b>.<br>היועץ שלנו (${ADVISOR_EMAIL}) קיבל עותק וייצור קשר לאישור סופי.</p>
        <div class="sched-card">
          <div class="sched-card-row"><span>מתי</span><b>${data.date} · ${data.time}</b></div>
          <div class="sched-card-row"><span>סוג פגישה</span><b>${data.type}</b></div>
          <div class="sched-card-row"><span>מיקום</span><b>${data.branch}</b></div>
          ${data.car ? `<div class="sched-card-row"><span>רכב</span><b>${escAttr(data.car)}</b></div>` : ''}
          <div class="sched-card-row"><span>על שם</span><b>${data.name}</b></div>
        </div>
        <div class="sched-prep">
          <div class="sched-prep-h">מה להכין לפני הפגישה</div>
          <ul>${PREP.map((p) => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="sched-success-actions">
          <a class="btn btn-gold" id="schedIcs">הוספה ליומן (.ics)</a>
          <button type="button" class="btn btn-ghost" id="schedDone">סגירה</button>
        </div>
      </div>`;
    root.querySelector('#schedClose').addEventListener('click', close);
    root.querySelector('#schedDone').addEventListener('click', close);
    root.querySelector('#schedIcs').addEventListener('click', () => downloadIcs(data));
  }

  function downloadIcs(data) {
    // build a simple .ics from selDate + selTime
    const [h, mi] = selTime.split(':').map(Number);
    const start = new Date(selDate); start.setHours(h, mi, 0, 0);
    const end = new Date(start); end.setHours(start.getHours() + 1);
    const z = (n) => String(n).padStart(2, '0');
    const f = (d) => `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Car2Buy//Meeting//HE', 'BEGIN:VEVENT',
      `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:פגישת ייעוץ — Car2Buy`,
      `DESCRIPTION:${data.type} · ${data.branch}`, `LOCATION:${data.branch}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'car2buy-meeting.ics'; a.click();
  }

  function bindForm() {
    root.querySelector('#schedClose').addEventListener('click', close);
    const days = availableDays(12);
    root.querySelectorAll('.sched-day').forEach((b) => b.addEventListener('click', () => {
      selDate = days[+b.dataset.i]; selTime = null;
      root.querySelectorAll('.sched-day').forEach((x) => x.classList.toggle('active', x === b));
      const tw = root.querySelector('#schedTimes');
      tw.innerHTML = slotsFor(selDate).map((t) => `<button type="button" class="sched-time" data-t="${t}">${t}</button>`).join('');
      bindTimes();
    }));
    bindTimes();
    root.querySelector('#schedForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const err = root.querySelector('#sErr');
      const name = root.querySelector('#sName').value.trim();
      const phone = root.querySelector('#sPhone').value.trim();
      const email = root.querySelector('#sEmail').value.trim();
      if (!selDate || !selTime) { err.textContent = 'בחרו תאריך ושעה לפגישה.'; return; }
      if (!name || !phone || !email) { err.textContent = 'מלאו שם, טלפון ואימייל.'; return; }
      if (window.C2B_consentOK && !window.C2B_consentOK(root.querySelector('#schedForm'))) { err.textContent = 'יש לאשר את מדיניות הפרטיות.'; return; }
      err.textContent = '';
      const carVal = (root.querySelector('#sCar') && root.querySelector('#sCar').value.trim()) || '';
      const data = { name, phone, email, car: carVal, type: root.querySelector('#sType').value, branch: root.querySelector('#sBranch').value, note: root.querySelector('#sNote').value.trim(), date: fmtDate(selDate), time: selTime };
      try { const _ap = new Date(selDate); const _t = String(selTime).split(':'); _ap.setHours(+_t[0] || 0, +_t[1] || 0, 0, 0); data.appt_at = _ap.toISOString(); } catch (e) {}
      if (window.c2bTrack) c2bTrack('meeting_scheduled', { date: data.date, time: data.time, type: data.type });
      if (window.submitLead) submitLead({ name: data.name, phone: data.phone, email: data.email, message: data.note, car: data.car || data.type, source: 'scheduler', meta: { branch: data.branch, date: data.date, time: data.time, type: data.type, car: data.car } });
      // persist the appointment (triggers the email-notification webhook server-side)
      if (window.submitAppointment) submitAppointment(data);
      renderSuccess(data);
    });
  }
  function bindTimes() {
    root.querySelectorAll('.sched-time').forEach((b) => b.addEventListener('click', () => {
      selTime = b.dataset.t;
      root.querySelectorAll('.sched-time').forEach((x) => x.classList.toggle('active', x === b));
    }));
  }

  function open(car) {
    selDate = null; selTime = null;
    presetCar = car || window.__c2bCar || '';
    root.innerHTML = shell('');
    renderForm();
    root.classList.add('open'); root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    root.classList.remove('open'); root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });

  // open triggers: header button + any [data-open-scheduler] / ?meeting handled elsewhere
  document.addEventListener('click', (e) => {
    const t = e.target.closest('#openScheduler, [data-open-scheduler]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-car') || ''); }
  });
  window.c2bOpenScheduler = open;
})();
