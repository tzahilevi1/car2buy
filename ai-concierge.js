/* ============================================================
   Car2Buy — AI Concierge (חכמת רכב)
   Floating assistant that recommends cars from the catalog
   via window.claude.complete. Injected site-wide by site.js.
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

  // compact catalog for the model
  const catalog = MODELS.map((m) =>
    `${m.id} | ${dB(m.brand)} ${eM(m.name)} (${m.brand} ${m.name}) | קטגוריה:${m.cat} | ${m.fuel} | ${m.power}כ״ס | 0-100:${m.accel}שנ | ${m.seats}מושבים | החזר:${m.monthly}₪ | מחירון:${m.list}₪`
  ).join('\n');

  async function ask(q) {
    addMsg('user', `<p>${q.replace(/</g, '&lt;')}</p>`);
    text.value = '';
    chips.style.display = 'none';
    const load = typing();

    const prompt = `אתה יועץ מכירות מקצועי, חם ואדיב של חברת "Car2Buy" לליסינג מימoני פרטי. ענה בעברית בלבד, בקצרה (2-4 משפטים), בגוף ראשון.

הקטלוג שלנו (id | דגם | מאפיינים):
${catalog}

בקשת הלקוח: "${q}"

המלץ על 1-3 דגמים מהקטלוג שהכי מתאימים לבקשה. הסבר במשפט קצר למה הם מתאימים. אל תמציא דגמים שלא ברשימה.
החזר JSON תקין בלבד בפורמט הזה (בלי טקסט נוסף, בלי markdown):
{"reply":"תשובה חמה ואישית ללקוח","ids":["id1","id2"]}`;

    let data = null;
    try {
      const raw = await window.claude.complete(prompt);
      const match = raw.match(/\{[\s\S]*\}/);
      data = JSON.parse(match ? match[0] : raw);
    } catch (e) {
      data = null;
    }
    load.remove();

    if (!data || !data.reply) {
      addMsg('bot', `<p>סליחה, נתקלתי בתקלה קטנה. אפשר לנסות שוב, או <a href="contact.html" style="color:var(--gold);text-decoration:underline;">להשאיר פרטים</a> ויועץ אנושי יחזור אליכם.</p>`);
      return;
    }
    const cars = (data.ids || []).map((id) => MODELS.find((m) => m.id === id)).filter(Boolean);
    let html = `<p>${data.reply}</p>`;
    if (cars.length) html += `<div class="ai-recs">${cars.map(carChip).join('')}</div>`;
    addMsg('bot', html);
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
