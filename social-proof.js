/* ============================================================
   Car2Buy — Exit-intent / idle lead popup
   Centered modal that fires when the visitor is about to leave
   (cursor exits toward the top) OR after 90s of inactivity.
   Shows once per session. Captures name + phone.
   ============================================================ */
(function () {
  if (sessionStorage.getItem('c2b_exit_done')) return;

  const IDLE_MS = 90000; // 1.5 minutes
  let fired = false, idleT;

  const el = document.createElement('div');
  el.className = 'exit-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="exit-modal" role="dialog" aria-label="הצעה מיוחדת">
      <button class="exit-close" aria-label="סגור">×</button>
      <div class="exit-grid">
        <div class="exit-media"><img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format&fit=crop" alt="רכב חדש"></div>
        <div class="exit-body">
          <div class="exit-eyebrow">רגע לפני שאתם הולכים</div>
          <h2 class="exit-title">קבלו הצעת מימון<br>אישית — בלי התחייבות</h2>
          <p class="exit-sub">השאירו פרטים ויועץ יחזור אליכם עם החזר חודשי מותאם בדיוק לכם, על הרכב שתבחרו.</p>
          <form class="exit-form" id="exitForm" novalidate>
            <input type="text" id="exitName" placeholder="שם מלא" required>
            <input type="tel" id="exitPhone" placeholder="טלפון" required>
            <button type="submit" class="btn btn-gold">קבלו הצעה</button>
            <div class="exit-err" id="exitErr"></div>
          </form>
          <button type="button" class="exit-dismiss" id="exitDismiss">לא תודה, אמשיך לגלוש</button>
        </div>
      </div>
      <div class="exit-success" id="exitSuccess">
        <div class="exit-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></div>
        <h2>תודה! קיבלנו את הפרטים</h2>
        <p>יועץ אישי יחזור אליכם בהקדם עם הצעה מותאמת.</p>
        <button type="button" class="btn btn-gold" id="exitSuccessClose">סגירה</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  const modal = el.querySelector('.exit-modal');
  function open() {
    if (fired || sessionStorage.getItem('c2b_exit_done')) return;
    fired = true;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.c2bTrack) c2bTrack('exit_popup_view');
    cleanup();
  }
  function close() {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    sessionStorage.setItem('c2b_exit_done', '1');
  }
  function cleanup() {
    document.removeEventListener('mouseout', onMouseOut);
    clearTimeout(idleT);
    document.removeEventListener('mousemove', resetIdle);
    document.removeEventListener('keydown', resetIdle);
    document.removeEventListener('scroll', resetIdle);
    document.removeEventListener('touchstart', resetIdle);
  }

  // exit intent: cursor leaves through the top of the viewport
  function onMouseOut(e) {
    if (e.clientY <= 0 && !e.relatedTarget) open();
  }
  // idle timer
  function resetIdle() {
    clearTimeout(idleT);
    idleT = setTimeout(open, IDLE_MS);
  }

  // arm triggers (give the visitor a few seconds first)
  setTimeout(() => {
    if (fired) return;
    document.addEventListener('mouseout', onMouseOut);
    ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach((ev) =>
      document.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle();
  }, 4000);

  // interactions
  el.querySelector('.exit-close').addEventListener('click', close);
  el.querySelector('#exitDismiss').addEventListener('click', close);
  el.querySelector('#exitSuccessClose').addEventListener('click', close);
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) close(); });

  el.querySelector('#exitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.querySelector('#exitName');
    const phone = el.querySelector('#exitPhone');
    const err = el.querySelector('#exitErr');
    if (!name.value.trim() || !phone.value.trim()) { err.textContent = 'מלאו שם וטלפון.'; return; }
    err.textContent = '';
    if (window.submitLead) submitLead({ name: name.value.trim(), phone: phone.value.trim(), source: 'exit_popup' });
    if (window.c2bTrack) c2bTrack('lead_submit', { source: 'exit_popup' });
    modal.querySelector('.exit-grid').style.display = 'none';
    el.querySelector('#exitSuccess').classList.add('show');
    sessionStorage.setItem('c2b_exit_done', '1');
  });
})();
