/* ============================================================
   Car2Buy — shared site chrome: header + footer, injected on
   every page. Set <body data-page="models"> to mark the active
   nav item. Keeps nav/footer edits in one place.
   ============================================================ */
(function () {
  const PAGES = [
    { id: 'models',   href: 'models.html',       label: 'דגמים' },
    { id: 'recommended', href: 'recommended.html', label: 'רכבים מומלצים' },
    { id: 'yad2',     href: 'yad2.html',         label: 'יד 2' },
    { id: 'tradein',  href: 'trade-in.html',     label: 'טרייד-אין' },
    { id: 'compare',  href: 'compare.html',      label: 'השוואה' },
    { id: 'calc',     href: 'calculator.html',   label: 'מחשבון' },
    { id: 'finance',  href: 'financing.html',    label: 'השיטה שלנו' },
    { id: 'magazine', href: 'magazine.html',     label: 'מגזין' },
    { id: 'contact',  href: 'contact.html',      label: 'צור קשר' },
  ];
  const active = document.body.dataset.page || 'home';

  const PRICE_RANGES = [
    { label: 'עד ₪3,000 בחודש', max: 3000 },
    { label: 'עד ₪4,000 בחודש', max: 4000 },
    { label: 'עד ₪5,000 בחודש', max: 5000 },
    { label: 'עד ₪7,000 בחודש', max: 7000 },
    { label: 'כל הטווחים', max: null },
  ];

  function buildMega() {
    const C = window.Car2Buy;
    if (!C) return `<a href="models.html"${active === 'models' ? ' class="active"' : ''}>קטלוג רכבים</a>`;
    const cats = C.CATS.filter((c) => c.id !== 'all')
      .map((c) => `<a href="models.html?cat=${c.id}">${c.label}</a>`).join('');
    const prices = PRICE_RANGES
      .map((r) => `<a href="models.html${r.max ? '?max=' + r.max : ''}">${r.label}</a>`).join('');
    const inv = C.LOAN_CARS || [];
    let brands;
    if (inv.length) {
      // show only manufacturers we actually stock; link with the Hebrew name the catalog filters on
      const heToBA = {};
      (C.BRANDS_ALL || []).forEach((b) => { heToBA[b.he] = b; });
      const alias = { 'ב.י.ד': 'BYD', "צ'רי": 'Chery', "ג'אקו": 'Jaecoo', "אמ.ג'י": 'MG', 'אווטר': 'Aiways', 'וויה': 'Voyah', 'זיקר': 'Zeekr', 'ליפמוטור': 'Leapmotor', "קיי.ג'י.אם": 'KGM', 'סקיוואל': 'Skywell' };
      const uniq = [...new Set(inv.map((c) => c.brand))].sort((a, b) => a.localeCompare(b, 'he'));
      brands = uniq.map((he) => {
        const ba = heToBA[he];
        const engName = ba ? ba.name : (alias[he] || '');
        const mono = he.replace(/[^A-Za-z\u0590-\u05FF]/g, '').charAt(0) || '•';
        const img = engName ? `<img loading="lazy" src="${C.LOGO(engName)}" alt="${he}" onerror="this.remove()">` : '';
        const disp = C.dispBrand ? C.dispBrand(he) : he;
        return `<a href="brand.html?brand=${encodeURIComponent(he)}"><span class="mega-logo">${img}<b class="mega-mono">${mono}</b></span><span class="mega-name">${disp}</span></a>`;
      }).join('');
    } else {
      brands = C.BRANDS_ALL
        .map((b) => {
          const mono = (b.he || b.name).replace(/[^A-Za-z\u0590-\u05FF]/g, '').charAt(0) || '•';
          const img = b.slug ? `<img loading="lazy" src="${C.LOGO(b.name)}" alt="${b.he || b.name}" onerror="this.remove()">` : '';
          return `<a href="models.html?brand=${encodeURIComponent(b.name)}"><span class="mega-logo">${img}<b class="mega-mono">${mono}</b></span><span class="mega-name">${b.he || b.name}</span></a>`;
        }).join('');
    }
    const needs = [
      ['finance-budget.html', 'רכבים עד ₪3,000 לחודש'],
      ['finance-electric.html', 'רכבים חשמליים'],
      ['finance-family.html', 'רכבי משפחה'],
      ['finance-business.html', 'רכב לעסק'],
      ['finance-luxury.html', 'רכבי יוקרה'],
    ].map(([h, l]) => `<a href="${h}">${l}</a>`).join('');
    return `<div class="nav-mega" id="navMega">
      <a href="models.html" class="mega-trigger${active === 'models' ? ' active' : ''}">קטלוג רכבים <span class="caret">▾</span></a>
      <div class="mega-panel"><div class="wrap mega-inner">
        <a class="mega-promo" href="car-loan.html"><img src="promo-finance.jpg" alt="הלוואה לרכב — מימון עד 100% בהחזר חודשי נוח"></a>
        <div class="mega-grid">
          <div class="mega-col mega-brands">
            <div class="mega-h">יצרנים</div>
            <div class="mega-brand-grid">${brands}</div>
            <a class="mega-all" href="brands.html">לכל היצרנים «</a>
          </div>
          <div class="mega-col">
            <div class="mega-h">סוג רכב</div>
            ${cats}
            <a class="mega-all" href="models.html">לכל הקטגוריות «</a>
          </div>
          <div class="mega-col">
            <div class="mega-h">טווח החזר חודשי</div>
            ${prices}
            <a class="btn btn-gold mega-col-btn" href="models.html">לכל הרכבים</a>
          </div>
        </div>
      </div>
      </div>
    </div>`;
  }

  const links = PAGES.map((p) =>
    p.id === 'models'
      ? buildMega()
      : `<a href="${p.href}"${p.id === active ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');

  const header = `
  <header class="nav" id="nav">
    <div class="nav-top">
      <div class="wrap nav-top-inner">
        <form class="nav-search" action="models.html" role="search">
          <button type="submit" aria-label="חיפוש"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
          <input type="search" name="q" placeholder="חיפוש דגם" aria-label="חיפוש דגם" id="navSearchInput" autocomplete="off">
          <div class="nav-search-results" id="navSearchResults"></div>
        </form>
        <a href="index.html" class="brand nav-logo" aria-label="Car2Buy"><img class="brand-img" src="logo.png" alt="Car2Buy — רכב חדש, קל ופשוט"></a>
        <div class="nav-cta">
          <a href="tel:+97237777777" class="nav-phone-pill">חייגו *3580</a>
          <button type="button" class="btn nav-meeting" id="openScheduler">לתיאום פגישה</button>
          <button class="burger" id="burger" aria-label="תפריט"><span></span><span></span><span></span></button>
        </div>
      </div>
    </div>
    <div class="nav-bar">
      <div class="wrap nav-bar-inner">
        <nav class="nav-links" id="navLinks">${links}</nav>
      </div>
    </div>
  </header>`;

  const footer = `
  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brandcol">
          <div class="brand footer-brand"><img class="brand-img" src="logo.png" alt="Car2Buy"></div>
          <p class="footer-about">עסקאות מימון לרכב חדש ויד שנייה — מבחר רחב ממותגים מובילים, החזר חודשי מותאם אישית, טרייד-אין ושירות אישי עד קבלת הרכב.</p>
        </div>
        <div class="footer-col">
          <h5>ניווט</h5>
          <a href="models.html">קטלוג רכבים</a>
          <a href="yad2.html">רכבי יד 2</a>
          <a href="how-it-works.html">איך זה עובד</a>
          <a href="financing.html">השיטה שלנו</a>
          <a href="about.html">אודות</a>
        </div>
        <div class="footer-col">
          <h5>כלים ושירותים</h5>
          <a href="calculator.html">מחשבון החזר</a>
          <a href="trade-in.html">טרייד-אין</a>
          <a href="compare.html">השוואת רכבים</a>
          <a href="personal-import.html">יבוא מקביל</a>
          <a href="magazine.html">מגזין</a>
          <a href="faq.html">שאלות נפוצות</a>
        </div>
        <div class="footer-col">
          <h5>לפי צורך</h5>
          <a href="finance-budget.html">רכבים עד ₪3,000</a>
          <a href="finance-electric.html">רכבים חשמליים</a>
          <a href="finance-family.html">רכבי משפחה</a>
          <a href="finance-business.html">רכב לעסק</a>
          <a href="finance-luxury.html">רכבי יוקרה</a>
        </div>
        <div class="footer-col">
          <h5>צרו קשר</h5>
          <a href="tel:+97237777777">03-777-7777</a>
          <a href="mailto:hello@car2buy.co.il">hello@car2buy.co.il</a>
          <p>רח׳ הרכב 12, תל אביב</p>
          <p>א׳–ה׳ · 09:00–19:00</p>
          <div class="footer-social">
            <a href="contact.html" aria-label="Instagram">Instagram</a>
            <a href="contact.html" aria-label="Facebook">Facebook</a>
            <a href="https://wa.me/97237777777" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a>
          </div>
        </div>
      </div>
      <div class="footer-seo">
        <h2 class="footer-seo-h">ליסינג מימוני, מימון רכב וטרייד-אין — הכל ב-Car2Buy</h2>
        <p class="footer-seo-p">Car2Buy מציעה <a href="financing.html">עסקאות מימון לרכב</a> חדש ויד שנייה ממגוון <a href="models.html">יצרנים ומותגים מובילים</a>, עם <a href="calculator.html">מחשבון החזר חודשי</a> שקוף, <a href="trade-in.html">הערכת טרייד-אין אונליין</a> ו<a href="compare.html">השוואת רכבים</a> חכמה. מחפשים <a href="finance-budget.html">רכב בהחזר חודשי נמוך</a>, <a href="finance-electric.html">רכב חשמלי במימון</a>, <a href="finance-family.html">רכב משפחתי</a>, <a href="finance-business.html">רכב לעסק</a> או <a href="finance-luxury.html">רכב יוקרה</a> — נבנה לכם החזר חודשי מותאם אישית. רוצים להעמיק? קראו את <a href="magazine.html">המגזין שלנו</a> או בדקו את <a href="faq.html">השאלות הנפוצות</a>.</p>
      </div>
      <div class="footer-bottom">
        <p class="footer-legal">© 2026 Car2Buy. כל הזכויות שמורות. ההחזר החודשי המוצג באתר הינו משוער בלבד ואינו מהווה הצעה מחייבת. תנאי העסקה כפופים לאישור גוף מימון, נתוני הלקוח וזמינות הרכב במלאי. טרייד-אין בהתאם לבדיקה ולתנאי העסקה. אי‑עמידה בהחזרים עלולה לגרור עלויות נוספות. תמונות הרכבים להמחשה. <a href="privacy.html" style="color:inherit;text-decoration:underline;">מדיניות פרטיות ותנאי שימוש</a>.</p>
        <p>עוצב ונבנה עבור Car2Buy</p>
      </div>
    </div>
  </footer>`;

  const hSlot = document.getElementById('site-header');
  if (hSlot) hSlot.outerHTML = header; else document.body.insertAdjacentHTML('afterbegin', header);
  const fSlot = document.getElementById('site-footer');
  if (fSlot) fSlot.outerHTML = footer; else document.body.insertAdjacentHTML('beforeend', footer);

  // floating compare tray (populated by app.js)
  if (!document.getElementById('compareTray')) {
    document.body.insertAdjacentHTML('beforeend', '<div id="compareTray" class="compare-tray"></div>');
  }

  // WhatsApp float
  if (!document.getElementById('waFloat')) {
    document.body.insertAdjacentHTML('beforeend',
      '<a id="waFloat" class="wa-float" href="https://wa.me/97237777777" target="_blank" rel="noopener" aria-label="וואטסאפ" data-track="whatsapp_click"><svg viewBox="0 0 32 32" fill="#fff"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7.7.7-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.3 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.6.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg></a>');
  }

  // ===== accessibility widget =====
  if (!document.getElementById('a11yFab')) {
    const A11Y_CSS =
      '#a11yFab{position:fixed;inset-block-end:90px;inset-inline-end:24px;z-index:1200;width:52px;height:52px;border-radius:50%;border:0;background:#1668e3;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 26px -8px rgba(0,0,0,.5);transition:.2s;}' +
      '#a11yFab:hover{transform:scale(1.06);}' +
      '#a11yFab svg{width:28px;height:28px;}' +
      '#a11yPanel{position:fixed;inset-block-end:152px;inset-inline-end:24px;z-index:1200;width:290px;max-width:calc(100vw - 36px);background:#fff;color:#1a1a1a;border-radius:16px;box-shadow:0 30px 70px -30px rgba(0,0,0,.55);border:1px solid #e5e5e5;padding:16px;display:none;font-family:inherit;direction:rtl;}' +
      '#a11yPanel.open{display:block;}' +
      '#a11yPanel h3{font-size:16px;font-weight:800;margin:0 0 4px;color:#111;}' +
      '#a11yPanel .a11y-sub{font-size:12px;color:#777;margin:0 0 12px;}' +
      '.a11y-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}' +
      '.a11y-opt{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;background:#f4f6fa;border:1.5px solid transparent;border-radius:12px;padding:12px 8px;font-family:inherit;font-size:12.5px;font-weight:600;color:#333;cursor:pointer;transition:.15s;}' +
      '.a11y-opt:hover{background:#e9eef7;}' +
      '.a11y-opt.on{border-color:#1668e3;background:#e7f0ff;color:#1668e3;}' +
      '.a11y-opt svg{width:22px;height:22px;}' +
      '.a11y-reset{margin-top:12px;width:100%;background:#101013;color:#fff;border:0;border-radius:10px;padding:11px;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;}' +
      '.a11y-reset:hover{background:#2a2a2f;}' +
      /* effect classes on <html> */
      'html.a11y-contrast body{background:#000!important;}' +
      'html.a11y-contrast body,html.a11y-contrast body *{background-color:#000!important;color:#fff!important;border-color:#fff!important;}' +
      'html.a11y-contrast a,html.a11y-contrast a *{color:#ffdf3d!important;}' +
      'html.a11y-contrast img,html.a11y-contrast svg{filter:grayscale(1) contrast(1.2);}' +
      'html.a11y-gray{filter:grayscale(1);}' +
      'html.a11y-links a{text-decoration:underline!important;outline:2px solid #1668e3!important;outline-offset:2px;}' +
      'html.a11y-readable body,html.a11y-readable body *{font-family:Arial,"Helvetica Neue",sans-serif!important;letter-spacing:.02em!important;}' +
      'html.a11y-nomotion *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}' +
      'html.a11y-bigcursor,html.a11y-bigcursor *{cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23000\' stroke=\'%23fff\' stroke-width=\'1.5\' d=\'m5 3 15 9-6 1.5L17 20l-3 1-3-6.5L7 18z\'/%3E%3C/svg%3E") 4 4,auto!important;}';
    const st = document.createElement('style'); st.id = 'a11yStyle'; st.textContent = A11Y_CSS; document.head.appendChild(st);

    const wheel = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="3.2" r="2.2"/><path d="M12 6.5c-1 0-4.5.5-6.5 1-.8.2-1.1 1.2-.4 1.7.9.6 2.6 1.3 3.9 1.6v3.1L6.7 20c-.3.9.8 1.5 1.4.8L12 16.7 15.9 20.8c.6.7 1.7.1 1.4-.8l-2.3-6.1v-3.1c1.3-.3 3-1 3.9-1.6.7-.5.4-1.5-.4-1.7-2-.5-5.5-1-6.5-1z"/></svg>';
    document.body.insertAdjacentHTML('beforeend',
      '<button id="a11yFab" aria-label="תפריט נגישות" aria-expanded="false">' + wheel + '</button>' +
      '<div id="a11yPanel" role="dialog" aria-label="הגדרות נגישות">' +
        '<h3>נגישות</h3><p class="a11y-sub">התאמת האתר לצרכים שלך</p>' +
        '<div class="a11y-grid">' +
          '<button class="a11y-opt" data-a11y="font-up">' + icoTxt('A+') + 'הגדלת טקסט</button>' +
          '<button class="a11y-opt" data-a11y="font-down">' + icoTxt('A-') + 'הקטנת טקסט</button>' +
          '<button class="a11y-opt" data-a11y="contrast">' + icoSvg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/>') + 'ניגודיות גבוהה</button>' +
          '<button class="a11y-opt" data-a11y="gray">' + icoSvg('<circle cx="12" cy="12" r="9"/>') + 'גווני אפור</button>' +
          '<button class="a11y-opt" data-a11y="links">' + icoSvg('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>') + 'הדגשת קישורים</button>' +
          '<button class="a11y-opt" data-a11y="readable">' + icoTxt('Aa') + 'גופן קריא</button>' +
          '<button class="a11y-opt" data-a11y="nomotion">' + icoSvg('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>') + 'עצירת אנימציות</button>' +
          '<button class="a11y-opt" data-a11y="bigcursor">' + icoSvg('<path d="m5 3 15 9-6 1.5L17 20l-3 1-3-6.5L7 18z"/>') + 'סמן גדול</button>' +
        '</div>' +
        '<button class="a11y-reset" data-a11y="reset">איפוס הגדרות נגישות</button>' +
      '</div>');

    function icoSvg(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }
    function icoTxt(t) { return '<span style="font-weight:900;font-size:18px;line-height:1;">' + t + '</span>'; }

    const html = document.documentElement;
    const TOGGLES = { contrast: 'a11y-contrast', gray: 'a11y-gray', links: 'a11y-links', readable: 'a11y-readable', nomotion: 'a11y-nomotion', bigcursor: 'a11y-bigcursor' };
    let state = {};
    try { state = JSON.parse(localStorage.getItem('c2b_a11y') || '{}'); } catch (e) { state = {}; }

    function apply() {
      Object.keys(TOGGLES).forEach((k) => html.classList.toggle(TOGGLES[k], !!state[k]));
      const fs = state.font || 0;
      html.style.fontSize = fs ? (100 + fs * 10) + '%' : '';
      document.querySelectorAll('#a11yPanel .a11y-opt[data-a11y]').forEach((b) => {
        const k = b.getAttribute('data-a11y');
        if (TOGGLES[k]) b.classList.toggle('on', !!state[k]);
      });
      try { localStorage.setItem('c2b_a11y', JSON.stringify(state)); } catch (e) {}
    }

    const fab = document.getElementById('a11yFab');
    const panel = document.getElementById('a11yPanel');
    fab.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
        panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false');
      }
    });
    panel.querySelectorAll('[data-a11y]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-a11y');
        if (k === 'reset') { state = {}; }
        else if (k === 'font-up') { state.font = Math.min((state.font || 0) + 1, 4); }
        else if (k === 'font-down') { state.font = Math.max((state.font || 0) - 1, -2); }
        else { state[k] = !state[k]; }
        apply();
      });
    });
    apply();
  }


  // AI concierge (loads after data + this chrome are ready)
  if (!document.getElementById('aiConciergeScript')) {
    const s = document.createElement('script');
    s.id = 'aiConciergeScript';
    s.src = 'ai-concierge.js';
    document.body.appendChild(s);
  }

  // meeting scheduler
  if (!document.getElementById('schedulerScript')) {
    const s = document.createElement('script');
    s.id = 'schedulerScript';
    s.src = 'scheduler.js';
    document.body.appendChild(s);
  }

  // social-proof popups
  if (!document.getElementById('socialProofScript')) {
    const s = document.createElement('script');
    s.id = 'socialProofScript';
    s.src = 'social-proof.js';
    document.body.appendChild(s);
  }

  // ===== measurement layer (dataLayer) =====
  window.dataLayer = window.dataLayer || [];
  window.c2bTrack = function (event, params) {
    window.dataLayer.push(Object.assign({ event: event, page: location.pathname }, params || {}));
  };
  c2bTrack('page_view', { title: document.title });
  // auto-track whatsapp / phone / explicit data-track clicks
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.dataset && a.dataset.track) { c2bTrack(a.dataset.track); return; }
    const href = a.getAttribute && a.getAttribute('href');
    if (!href) return;
    if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp') > -1) c2bTrack('whatsapp_click');
    else if (href.indexOf('tel:') === 0) c2bTrack('phone_click');
  });

  // ===== mobile sticky CTA bar =====
  if (!document.getElementById('mobileBar')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div id="mobileBar" class="mbar">' +
        '<a class="mbar-btn wa" href="https://wa.me/97237777777" target="_blank" rel="noopener" data-track="whatsapp_click"><span class="mbar-ic">✆</span>וואטסאפ</a>' +
        '<a class="mbar-btn primary" href="contact.html" data-track="finance_offer_click"><span class="mbar-ic">₪</span>הצעת מימון</a>' +
        '<a class="mbar-btn" href="contact.html" data-track="schedule_meeting_click"><span class="mbar-ic">☕</span>פגישה</a>' +
      '</div>');
  }

  // ===== SEO: JSON-LD structured data =====
  if (!document.getElementById('c2bSchema')) {
    const ld = {
      "@context": "https://schema.org",
      "@type": "AutoDealer",
      "name": "Car2Buy",
      "description": "עסקאות מימון לרכב — מבחר רחב ממותגים מובילים, החזר חודשי מותאם אישית, טרייד-אין ושירות אישי.",
      "url": location.origin,
      "telephone": "+972-3-777-7777",
      "email": "hello@car2buy.co.il",
      "address": { "@type": "PostalAddress", "streetAddress": "רח׳ הרכב 12", "addressLocality": "תל אביב", "addressCountry": "IL" },
      "openingHours": "Su-Th 09:00-19:00",
      "areaServed": "IL",
      "priceRange": "₪₪"
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = 'c2bSchema';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  // ===== cookie consent (Consent Mode friendly) =====
  if (!localStorage.getItem('c2b_consent') && !document.getElementById('cookieBar')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div id="cookieBar" class="cookie-bar">' +
        '<p>אנו משתמשים בעוגיות לשיפור החוויה ולמדידה שיווקית. המשך הגלישה מהווה הסכמה. <a href="privacy.html">למדיניות הפרטיות</a>.</p>' +
        '<div class="cookie-actions"><button class="btn btn-ghost" id="cookieDecline">דחייה</button><button class="btn btn-gold" id="cookieOk">אישור</button></div>' +
      '</div>');
    const close = (v) => { localStorage.setItem('c2b_consent', v); const b = document.getElementById('cookieBar'); if (b) b.remove(); window.c2bTrack && c2bTrack('consent_' + v); };
    document.getElementById('cookieOk').addEventListener('click', () => close('granted'));
    document.getElementById('cookieDecline').addEventListener('click', () => close('denied'));
  }

  // nav scroll state
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.addEventListener('click', (e) => { if (e.target.tagName === 'A') navLinks.classList.remove('open'); });

  // catalog mega menu — JS-controlled (hover + click) for reliability
  const navMega = document.getElementById('navMega');
  if (navMega) {
    let t;
    const open = () => { clearTimeout(t); navMega.classList.add('open'); };
    const close = () => { t = setTimeout(() => navMega.classList.remove('open'), 160); };
    navMega.addEventListener('mouseenter', open);
    navMega.addEventListener('mouseleave', close);
    const trig = navMega.querySelector('.mega-trigger');
    if (trig) trig.addEventListener('click', () => { navMega.classList.remove('open'); });
    document.addEventListener('click', (e) => { if (!navMega.contains(e.target)) navMega.classList.remove('open'); });
  }

  // global nav search dropdown (live results from real inventory)
  var nsInput = document.getElementById('navSearchInput');
  var nsOut = document.getElementById('navSearchResults');
  var nsForm = nsInput ? nsInput.closest('form') : null;
  if (nsInput && nsOut && window.Car2Buy) {
    var C = window.Car2Buy;
    var MODELS = C.MODELS || [];
    var NIS = C.NIS || function (n) { return '₪' + Number(n).toLocaleString('en-US'); };
    var dB = C.dispBrand || function (b) { return b; };
    var eM = C.enModel || function (n) { return n; };
    var LG = C.LOGO || function () { return ''; };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function nsRender(q) {
      q = (q || '').trim().toLowerCase();
      if (!q) { nsOut.classList.remove('open'); nsOut.innerHTML = ''; return; }
      var hits = MODELS.filter(function (m) {
        return (m.brand + ' ' + m.name + ' ' + (m.trim || '') + ' ' + m.type + ' ' + dB(m.brand) + ' ' + eM(m.name)).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      if (!hits.length) {
        nsOut.innerHTML = '<div class="ns-empty">לא נמצא דגם תואם — <a href="contact.html">נאתר עבורכם כל רכב</a></div>';
        nsOut.classList.add('open'); return;
      }
      nsOut.innerHTML = hits.map(function (m) {
        return '<a class="ns-row" href="car.html?car=' + m.id + '">' +
          '<img class="ns-thumb" loading="lazy" src="' + esc(m.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
          '<span class="ns-meta"><b>' + esc(dB(m.brand)) + ' ' + esc(eM(m.name)) + '</b><span>' + (m.power ? m.power + ' כ״ס · ' : '') + esc(m.fuel) + '</span></span>' +
          '<span class="ns-price">' + NIS(m.monthly) + '<small> /ח׳</small></span></a>';
      }).join('');
      nsOut.classList.add('open');
    }
    nsInput.addEventListener('input', function () { nsRender(nsInput.value); });
    nsInput.addEventListener('focus', function () { if (nsInput.value.trim()) nsRender(nsInput.value); });
    if (nsForm) nsForm.addEventListener('submit', function (e) {
      var first = nsOut.querySelector('.ns-row');
      if (first) { e.preventDefault(); location.href = first.getAttribute('href'); }
    });
    document.addEventListener('click', function (e) { if (nsForm && !nsForm.contains(e.target)) nsOut.classList.remove('open'); });
  }
})();
