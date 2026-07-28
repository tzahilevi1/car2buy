/* ============================================================
   Car2Buy — AI Concierge (חכמת רכב)
   Floating assistant that recommends cars from the catalog using a
   local, backend-free matcher (budget + intent keywords) and hands
   off to a human via WhatsApp. Injected site-wide by site.js.
   ============================================================ */
(function () {
  if (!window.Car2Buy) return;
  const { MODELS, NIS, LOGO } = window.Car2Buy;
  const dB = window.Car2Buy.dispBrand || ((b) => b);
  const eM = window.Car2Buy.enModel || ((n) => n);

  // build launcher + panel
  const root = document.createElement('div');
  root.id = 'ai-concierge';
  root.innerHTML = `
    <button class="ai-fab" id="aiFab" aria-label="יועץ חכם">
      <span class="ai-fab-ic">✦</span>
      <span class="ai-fab-txt">יועץ חכם</span>
    </button>
    <div class="ai-panel" id="aiPanel" role="dialog" aria-label="יועץ הרכב החכם">
      <div class="ai-head">
        <div class="ai-head-l">
          <span class="ai-orb"></span>
          <div><div class="ai-title">חכמת רכב</div><div class="ai-sub">היועץ החכם של Car2Buy</div></div>
        </div>
        <button class="ai-close" id="aiClose" aria-label="סגור">×</button>
      </div>
      <div class="ai-body" id="aiBody">
        <div class="ai-msg bot">
          <p>שלום! ספרו לי מה אתם מחפשים — תקציב חודשי, סוג רכב, מי נוסע, מה חשוב לכם — ואמליץ על הרכב המושלם מהקטלוג שלנו. 🚗</p>
        </div>
      </div>
      <div class="ai-chips" id="aiChips">
        <button>SUV משפחתי עד ₪4,000</button>
        <button>רכב חשמלי משתלם</button>
        <button>ספורט יוקרתי לרווקים</button>
      </div>
      <form class="ai-input" id="aiForm">
        <input type="text" id="aiText" placeholder="כתבו כאן מה אתם מחפשים…" autocomplete="off">
        <button type="submit" aria-label="שלח" id="aiSend">➤</button>
      </form>
    </div>`;
  document.body.appendChild(root);

  const fab = root.querySelector('#aiFab');
  const panel = root.querySelector('#aiPanel');
  const body = root.querySelector('#aiBody');
  const form = root.querySelector('#aiForm');
  const text = root.querySelector('#aiText');
  const chips = root.querySelector('#aiChips');

  const open = () => { panel.classList.add('open'); fab.classList.add('hidden'); setTimeout(() => text.focus(), 300); };
  const close = () => { panel.classList.remove('open'); fab.classList.remove('hidden'); };
  fab.addEventListener('click', open);
  root.querySelector('#aiClose').addEventListener('click', close);

  function addMsg(role, html) {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + role;
    el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }
  function typing() {
    const el = addMsg('bot', '<div class="ai-typing"><span></span><span></span><span></span></div>');
    return el;
  }

  function carChip(m) {
    return `<a class="ai-rec" href="car.html?car=${m.id}">
      <span class="brand-logo ai-rec-logo"><img src="${LOGO(m.brand)}" alt="" onerror="this.closest('.ai-rec-logo').style.display='none'"></span>
      <span class="ai-rec-meta"><b>${dB(m.brand)} ${eM(m.name)}</b><span>${NIS(m.monthly)} / חודש · ${m.power} כ״ס · ${m.fuel}</span></span>
      <span class="ai-rec-go">←</span></a>`;
  }

  // WhatsApp handoff button — pre-filled with the customer's request.
  const WA = '972723319929';
  function waBtn(q) {
    const href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('היי, אני מחפש/ת רכב: ' + q);
    return `<a class="ai-wa" href="${href}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;margin-top:12px;background:#25D366;color:#fff;font-weight:700;padding:10px 16px;border-radius:10px;text-decoration:none;">💬 ייעוץ אישי בוואטסאפ</a>`;
  }

  // Local, backend-free recommender: score the live catalog by budget + intent keywords.
  function recommend(q) {
    const MODELS = (window.Car2Buy && window.Car2Buy.MODELS) || [];
    const t = (q || '').toLowerCase();
    let budget = 0;
    const nums = (q.replace(/,/g, '').match(/\d{3,6}/g) || []).map(Number).filter((n) => n >= 500 && n <= 20000);
    if (nums.length) budget = Math.max.apply(null, nums);
    const wantEV = /חשמל|electric|\bev\b/.test(t);
    const wantHybrid = /היבריד|hybrid|נטען|phev|hev/.test(t);
    const wantSUV = /suv|שטח|פנאי|ג׳יפ|גיפ|גבוה|קרוסאובר/.test(t);
    const wantFamily = /משפח|ילדים|7 |שבעה|מרווח/.test(t);
    const wantSport = /ספורט|יוקר|מהיר|רווק|צעיר|sport|luxury/.test(t);
    const wantCity = /עיר|קטן|חסכ|קומפקט|city|ראשון|זול/.test(t);
    const scored = MODELS.map((m) => {
      let s = 0;
      const cat = ((m.cat || '') + ' ' + (m.type || '') + ' ' + (m.body || '')).toLowerCase();
      const fuel = (m.fuel || '');
      if (budget && m.monthly > 0) { if (m.monthly <= budget) s += 3; else if (m.monthly <= budget * 1.15) s += 1; else s -= 3; }
      if (wantEV) { if (/חשמל/.test(fuel)) s += 3; else s -= 1; }
      if (wantHybrid && /היבריד|נטען/.test(fuel)) s += 3;
      if (wantSUV && /suv|פנאי|קרוסאובר|שטח/.test(cat)) s += 2;
      if (wantFamily) { if (m.seats >= 7) s += 3; else if (m.seats >= 5) s += 1; }
      if (wantSport && /ספורט|יוקר|קופה|קופ/.test(cat)) s += 2;
      if (wantCity && /עיר|קומפקט|מיני|קטן|סופרמיני/.test(cat)) s += 2;
      return { m, s };
    }).filter((x) => x.s > 0 && x.m.monthly > 0)
      .sort((a, b) => b.s - a.s || a.m.monthly - b.m.monthly);
    return scored.slice(0, 3).map((x) => x.m);
  }

  async function ask(q) {
    addMsg('user', `<p>${q.replace(/</g, '&lt;')}</p>`);
    text.value = '';
    chips.style.display = 'none';
    const load = typing();
    await new Promise((r) => setTimeout(r, 450)); // תחושת "חשיבה" טבעית
    load.remove();

    const cars = recommend(q);
    if (cars.length) {
      const reply = 'הנה כמה דגמים מהקטלוג שנראים מתאימים לכם 👇 רוצים שנתפור הצעת מימון אישית? דברו איתנו בוואטסאפ ונחזור אליכם.';
      addMsg('bot', `<p>${reply}</p><div class="ai-recs">${cars.map(carChip).join('')}</div>${waBtn(q)}`);
    } else {
      const reply = 'בשמחה נעזור למצוא בדיוק את מה שמתאים לכם. יועץ אנושי שלנו ימליץ בהתאמה אישית — דברו איתנו בוואטסאפ ונחזור אליכם במהירות. 🚗';
      addMsg('bot', `<p>${reply}</p>${waBtn(q)}`);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = text.value.trim();
    if (q) ask(q);
  });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) ask(b.textContent.trim());
  });
})();
