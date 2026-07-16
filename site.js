/* ============================================================
   Car2Buy — shared site chrome: header + footer, injected on
   every page. Set <body data-page="models"> to mark the active
   nav item. Keeps nav/footer edits in one place.
   ============================================================ */
/* ⬇️⬇️⬇️  גלריית זוויות מרובות (imagin.studio)  ⬇️⬇️⬇️
   הדביקו כאן את מפתח הלקוח (customer) שקיבלתם מ-imagin.studio בתשלום —
   וכל האתר יציג אוטומטית 6-8 זוויות נקיות (חזית/צד/אחור/3-4) באותו צבע, ללא סימן מים.
   השאירו ריק ('') = תמונה נקייה אחת לכל רכב (המצב הנוכחי, ללא עלות וללא סימן מים). */
window.C2B_IMAGIN_KEY = '';

(function () {
  // anti-clickjacking: CSP frame-ancestors is ignored in <meta>, so break out of a
  // cross-origin frame here (a same-origin embed is left intact).
  try {
    if (window.top !== window.self) {
      var parentOrigin = null;
      try { parentOrigin = window.top.location.origin; } catch (e) { parentOrigin = null; }
      if (parentOrigin !== window.location.origin) { window.top.location = window.self.location.href; }
    }
  } catch (e) {}
})();
// shared consent checkbox — pre-checked by default; leads can't be sent while unchecked.
window.C2B_consentHTML = function () {
  return '<label class="c2b-consent"><input type="checkbox" class="c2b-consent-cb" checked>' +
    '<span>אני מאשר/ת יצירת קשר וקבלת מידע מ-Car2Buy בהתאם ל<a href="privacy.html" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a></span></label>';
};
// visual car picker: attaches an image+name autocomplete dropdown to a text input.
window.C2B_carPicker = function (input, opts) {
  if (!input || input._c2bCp) return; input._c2bCp = 1;
  opts = opts || {};
  var C = window.Car2Buy || {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  function catalog() {
    var L = (C.MODELS && C.MODELS.length) ? C.MODELS : (C.LOAN_CARS || []);
    var seen = {}, out = [];
    L.forEach(function (m) {
      var name = ((C.enName ? C.enName(m) : ((m.brand || '') + ' ' + (m.name || ''))) || '').trim();
      if (name && !seen[name]) { seen[name] = 1; out.push({ name: name, img: m.img || '', brand: m.brand }); }
    });
    return out;
  }
  var list = catalog();
  input.setAttribute('autocomplete', 'off');
  input.removeAttribute('list');
  var box = document.createElement('div'); box.className = 'c2b-cp-res'; box.hidden = true;
  if (getComputedStyle(input.parentNode).position === 'static') input.parentNode.style.position = 'relative';
  input.parentNode.appendChild(box);
  function render(q) {
    if (!list.length) list = catalog();
    q = (q || '').trim().toLowerCase();
    var m = (q ? list.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0; }) : list).slice(0, 8);
    if (!m.length) { box.hidden = true; return; }
    box.innerHTML = m.map(function (c) {
      return '<div class="c2b-cp-item" data-i="' + list.indexOf(c) + '">' +
        (c.img ? '<img src="' + esc(c.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '<span class="c2b-cp-ph"></span>') +
        '<span>' + esc(c.name) + '</span></div>';
    }).join('');
    box.hidden = false;
  }
  input.addEventListener('focus', function () { render(input.value); });
  input.addEventListener('input', function () { render(input.value); });
  box.addEventListener('mousedown', function (e) {
    var it = e.target.closest('.c2b-cp-item'); if (!it) return;
    e.preventDefault();
    var c = list[+it.dataset.i];
    input.value = c.name; box.hidden = true;
    if (opts.onPick) opts.onPick(c);
  });
  input.addEventListener('blur', function () { setTimeout(function () { box.hidden = true; }, 160); });
};

window.C2B_consentOK = function (scope) {
  var cb = (scope && scope.querySelector) ? scope.querySelector('.c2b-consent-cb') : null;
  if (cb && !cb.checked) {
    var l = cb.closest('.c2b-consent'); if (l) { l.style.color = '#d24b4b'; setTimeout(function () { l.style.color = ''; }, 2200); }
    return false;
  }
  return true;
};

(function () {
  const PAGES = [
    { id: 'models',   href: 'models.html',       label: 'דגמים' },
    { id: 'recommended', href: 'recommended.html', label: 'רכבים מומלצים' },
    { id: 'yad2',     href: 'yad2.html',         label: 'יד 2' },
    { id: 'tradein',  href: 'trade-in.html',     label: 'טרייד-אין' },
    { id: 'compare',  href: 'compare.html',      label: 'השוואה' },
    { id: 'calc',     href: 'calculator.html',   label: 'מחשבון' },
    { id: 'finance',  href: 'financing.html',    label: 'השיטה שלנו' },
    { id: 'customers', href: 'customers.html',   label: 'לקוחות' },
    { id: 'magazine', href: 'magazine.html',     label: 'מגזין' },
    { id: 'contact',  href: 'contact.html',      label: 'צור קשר' },
  ];
  const active = document.body.dataset.page || 'home';

  // load Supabase lead-capture helper (defines window.submitLead) on every page
  if (!window.submitLead && !document.getElementById('c2bSupabase')) {
    const sb = document.createElement('script');
    sb.src = 'supabase.js'; sb.id = 'c2bSupabase';
    document.head.appendChild(sb);
  }
  // load first-party analytics tracker
  if (!document.getElementById('c2bAnalytics')) {
    const an = document.createElement('script');
    an.src = 'analytics.js'; an.id = 'c2bAnalytics'; an.async = true;
    document.head.appendChild(an);
  }

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
        <div class="nav-top-start">
          <div class="nav-lang" id="navLang">
            <button type="button" class="nav-lang-btn" id="navLangBtn" aria-haspopup="true" aria-expanded="false" aria-label="שפה / Language" title="שפה / Language">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
            </button>
            <div class="nav-lang-menu" id="navLangMenu" hidden>
              <button type="button" data-lang="he">🇮🇱 עברית</button>
              <button type="button" data-lang="en">🇬🇧 English</button>
              <button type="button" data-lang="ar">🇸🇦 العربية</button>
              <button type="button" data-lang="ru">🇷🇺 Русский</button>
            </div>
          </div>
          <form class="nav-search" action="models.html" role="search">
            <button type="submit" aria-label="חיפוש"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
            <input type="search" name="q" placeholder="חיפוש דגם" aria-label="חיפוש דגם" id="navSearchInput" autocomplete="off">
            <div class="nav-search-results" id="navSearchResults"></div>
          </form>
        </div>
        <a href="index.html" class="brand nav-logo" aria-label="Car2Buy"><img class="brand-img" src="logo.png" alt="Car2Buy — רכב חדש, קל ופשוט"></a>
        <div class="nav-cta">
          <a href="tel:+972723319929" class="nav-phone-pill">חייגו 072-3319929</a>
          <button type="button" class="btn nav-meeting" id="openScheduler">לתיאום פגישה</button>
          <button type="button" class="nav-fav" id="navFav" aria-label="רכבים ששמרתי"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg><span class="nav-fav-badge" id="navFavBadge" hidden>0</span></button>
          <button class="burger" id="burger" aria-label="תפריט"><span></span><span></span><span></span></button>
        </div>
        <div class="fav-panel" id="favPanel" hidden></div>
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
          <a href="tel:+972723319929">072-3319929</a>
          <a href="mailto:car2buy2@gmail.com">car2buy2@gmail.com</a>
          <p>הר הקפיצה, נצרת</p>
          <p>א׳–ה׳ · 09:00–18:00</p>
          <div class="footer-social">
            <a href="https://www.instagram.com/car2buy.il/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a>
            <a href="https://www.facebook.com/2car2buy" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a>
            <a href="https://wa.me/972723319929" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a>
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

  // ---- language switcher + free on-the-fly translation (cached; no external scripts) ----
  (function () {
    var st = document.createElement('style');
    st.textContent =
      '.nav,#nav{direction:rtl!important}' +   // header layout stays fixed regardless of the page language
      '.nav-top-start{justify-self:start;display:flex;align-items:center;gap:8px;min-width:0}' +
      '.nav-lang{position:relative;display:flex;align-items:center;flex:none}' +
      '.nav-lang-btn{display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);border-radius:999px;width:38px;height:38px;padding:0;color:#ECE7DE;cursor:pointer;line-height:1}' +
      '.nav-lang-btn:hover{background:rgba(255,255,255,0.12)}.nav-lang-btn svg{width:18px;height:18px;opacity:.9}' +
      '.nav-lang-menu{position:fixed;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;box-shadow:0 18px 44px -14px rgba(0,0,0,.4);padding:6px;z-index:2147483000;width:172px;direction:rtl}' +
      '.nav-lang-menu[hidden]{display:none}' +
      '.nav-lang-menu button{display:flex;align-items:center;gap:9px;width:100%;text-align:start;background:none;border:0;border-radius:8px;padding:10px 12px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;color:#1c2430;white-space:nowrap}' +
      '.nav-lang-menu button:hover{background:#f0f1f4}';
    document.head.appendChild(st);

    function curLang() { return localStorage.getItem('c2b_lang') || 'he'; }
    function applyDir(l) { document.documentElement.setAttribute('dir', (l === 'he' || l === 'ar') ? 'rtl' : 'ltr'); document.documentElement.setAttribute('lang', l); }
    function setLang(l) { localStorage.setItem('c2b_lang', l); location.reload(); }

    // --- translation engine: free Google endpoint, results cached in localStorage per language ---
    var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
    function collect() {
      var out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
        var v = n.nodeValue; if (!v || v.trim().length < 2 || !/[֐-׿]/.test(v)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode; if (!p || SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('#navLang,.notranslate,[translate="no"]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      } });
      var n; while (n = w.nextNode()) out.push(n); return out;
    }
    function gtx(texts, target) {
      return fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=' + target + '&dt=t', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: 'q=' + encodeURIComponent(texts.join('\n'))
      }).then(function (r) { return r.json(); }).then(function (d) {
        var parts = ((d[0] || []).map(function (s) { return s[0] || ''; }).join('')).split('\n');
        return parts.length === texts.length ? parts : null;
      }).catch(function () { return null; });
    }
    function translatePage(target) {
      if (target === 'he') return;
      var ckey = 'c2b_tr_' + target, cache = {};
      try { cache = JSON.parse(localStorage.getItem(ckey) || '{}'); } catch (e) {}
      var pending = [], pendNodes = [];
      collect().forEach(function (node) { var raw = node.nodeValue, key = raw.trim(); if (cache[key] != null) { node.nodeValue = raw.replace(key, cache[key]); } else { pending.push(key); pendNodes.push(node); } });
      if (!pending.length) return;
      var uniq = [], seen = {}; pending.forEach(function (t) { if (!seen[t]) { seen[t] = 1; uniq.push(t); } });
      var chunks = [], cur = [], len = 0;
      uniq.forEach(function (t) { if (len + t.length > 1400 && cur.length) { chunks.push(cur); cur = []; len = 0; } cur.push(t); len += t.length + 1; });
      if (cur.length) chunks.push(cur);
      (function next(i) {
        if (i >= chunks.length) { try { localStorage.setItem(ckey, JSON.stringify(cache)); } catch (e) {} return; }
        gtx(chunks[i], target).then(function (res) {
          if (res) chunks[i].forEach(function (src, j) { cache[src] = res[j]; });
          pendNodes.forEach(function (node, k) { var key = pending[k], t = cache[key]; if (t != null && node.nodeValue.indexOf(t) < 0) node.nodeValue = node.nodeValue.replace(key, t); });
          next(i + 1);
        });
      })(0);
    }

    var lang = curLang();
    applyDir(lang);
    if (lang !== 'he') {
      var run = function () { translatePage(lang); var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { translatePage(lang); }, 450); }).observe(document.body, { childList: true, subtree: true }); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    }
    var btn = document.getElementById('navLangBtn'), menu = document.getElementById('navLangMenu');
    if (btn && menu) {
      // mark the active language
      menu.querySelectorAll('[data-lang]').forEach(function (b) { if (b.dataset.lang === lang) { b.style.background = '#f0f1f4'; b.insertAdjacentHTML('beforeend', ' ✓'); } });
      // fixed dropdown positioned under the button — never clipped by header ancestors
      function place() { var r = btn.getBoundingClientRect(); menu.style.top = (r.bottom + 8) + 'px'; menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; menu.style.left = 'auto'; }
      btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hasAttribute('hidden'); if (open) { place(); menu.removeAttribute('hidden'); } else { menu.setAttribute('hidden', ''); } btn.setAttribute('aria-expanded', String(open)); });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      menu.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
      document.addEventListener('click', function () { if (!menu.hasAttribute('hidden')) { menu.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); } });
      window.addEventListener('resize', function () { if (!menu.hasAttribute('hidden')) place(); });
    }
  })();

  // ---- favorites (saved cars): heart on cards + header badge + saved panel ----
  (function () {
    const KEY = 'c2b_favs';
    const $ = (id) => document.getElementById(id);
    const getF = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    const setF = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} render(); };
    const has = (id) => getF().some((f) => f.id === id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function carFrom(btn) {
      const card = btn.closest('.ucard, .car, article'); if (!card) return null;
      const link = card.querySelector('a.uc-hit, a.car-hit, a[href*="used-car.html"], a[href*="car.html"]');
      const img = card.querySelector('img');
      const pay = card.querySelector('.uc-pay, .ccard-pay');
      const nm = card.dataset.name || (card.querySelector('.uc-name, .ccard-name') || {}).textContent || '';
      const href = link ? link.getAttribute('href') : '';
      return { id: href || nm, name: nm, href: href || '#', img: img ? img.getAttribute('src') : '', pay: pay ? pay.textContent.replace(/לחצו.*/, '').trim() : '' };
    }
    function updateButtons() { document.querySelectorAll('.uc-fav').forEach((b) => { const c = carFrom(b); if (c) b.classList.toggle('is-fav', has(c.id)); }); }
    function badge() { const el = $('navFavBadge'); if (!el) return; const n = getF().length; el.textContent = n; el.hidden = n === 0; const f = $('navFav'); if (f) f.classList.toggle('has-favs', n > 0); }
    function renderPanel() {
      const p = $('favPanel'); if (!p || p.hidden) return;
      const favs = getF();
      p.innerHTML = '<div class="fav-panel-h">רכבים ששמרתי <span>(' + favs.length + ')</span></div>' +
        (favs.length ? '<div class="fav-list">' + favs.map((f) => '<div class="fav-item"><a class="fav-item-link" href="' + esc(f.href) + '">' + (f.img ? '<img src="' + esc(f.img) + '" alt="">' : '') + '<span><b>' + esc(f.name) + '</b>' + (f.pay ? '<small>' + esc(f.pay) + '</small>' : '') + '</span></a><button type="button" class="fav-rm" data-rm="' + esc(f.id) + '" aria-label="הסר">✕</button></div>').join('') + '</div>'
          : '<p class="fav-empty">עדיין לא שמרתם רכבים.<br>לחצו על ♥ "אהבתי" בכל רכב יד 2 כדי לשמור אותו כאן.</p>');
    }
    function togglePanel(force) { const p = $('favPanel'); if (!p) return; const open = force != null ? force : p.hidden; p.hidden = !open; if (open) renderPanel(); }
    function render() { updateButtons(); badge(); renderPanel(); }
    document.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.uc-fav');
      if (favBtn) { e.preventDefault(); const c = carFrom(favBtn); if (!c || !c.id) return; const add = !has(c.id); favBtn.classList.toggle('is-fav', add); const list = add ? [c].concat(getF()) : getF().filter((f) => f.id !== c.id); setF(list); return; }
      if (e.target.closest('#navFav')) { e.preventDefault(); togglePanel(); return; }
      const rm = e.target.closest('[data-rm]');
      if (rm) { e.preventDefault(); setF(getF().filter((f) => f.id !== rm.getAttribute('data-rm'))); return; }
      const p = $('favPanel'); if (p && !p.hidden && !e.target.closest('#favPanel, #navFav')) togglePanel(false);
    });
    badge(); updateButtons();
    window.addEventListener('load', updateButtons);
    document.addEventListener('c2b:cars-updated', updateButtons);
    window.C2B_updateFavButtons = updateButtons;
  })();

  // WhatsApp float
  if (!document.getElementById('waFloat')) {
    document.body.insertAdjacentHTML('beforeend',
      '<a id="waFloat" class="wa-float" href="https://wa.me/972723319929" target="_blank" rel="noopener" aria-label="וואטסאפ" data-track="whatsapp_click"><svg viewBox="0 0 32 32" fill="#fff"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7.7.7-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.3 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.6.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg></a>');
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
        '<a class="mbar-btn wa" href="https://wa.me/972723319929" target="_blank" rel="noopener" data-track="whatsapp_click"><span class="mbar-ic">✆</span>וואטסאפ</a>' +
        '<a class="mbar-btn primary" href="contact.html" data-track="finance_offer_click"><span class="mbar-ic">₪</span>הצעת מימון</a>' +
        '<a class="mbar-btn" href="contact.html" data-track="schedule_meeting_click"><span class="mbar-ic">☕</span>פגישה</a>' +
      '</div>');
  }

  // ===== SEO: JSON-LD structured data =====
  if (!document.getElementById('c2bSchema')) {
    const BASE = new URL('.', location.href).href; // site root (handles the /car2buy/ subpath)
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": BASE + "#website",
          "name": "Car2Buy",
          "url": BASE,
          "inLanguage": "he-IL",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": BASE + "models.html?q={search_term_string}" },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "AutoDealer",
          "@id": BASE + "#dealer",
          "name": "Car2Buy",
          "description": "עסקאות מימון לרכב — מבחר רחב ממותגים מובילים, החזר חודשי מותאם אישית, טרייד-אין ושירות אישי.",
          "url": BASE,
          "telephone": "+972-72-3319929",
          "email": "car2buy2@gmail.com",
          "address": { "@type": "PostalAddress", "streetAddress": "הר הקפיצה", "addressLocality": "נצרת", "postalCode": "1600971", "addressCountry": "IL" },
          "openingHours": "Su-Th 09:00-18:00",
          "areaServed": "IL",
          "priceRange": "₪₪"
        }
      ]
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.id = 'c2bSchema';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  // ===== SEO: favicon, manifest, theme-color, canonical, Open Graph, Twitter =====
  (function seoHead() {
    const head = document.head;
    if (!head.querySelector('link[rel="icon"]')) {
      head.insertAdjacentHTML('beforeend',
        '<link rel="icon" href="favicon.svg" type="image/svg+xml">' +
        '<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">' +
        '<link rel="icon" href="favicon-16.png" sizes="16x16" type="image/png">' +
        '<link rel="apple-touch-icon" href="apple-touch-icon.png">' +
        '<link rel="manifest" href="site.webmanifest">');
    }
    if (!head.querySelector('meta[name="theme-color"]')) {
      head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#F5691E">');
    }
    function meta(attr, key) {
      let el = head.querySelector('meta[' + attr + '="' + key + '"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); head.appendChild(el); }
      return el;
    }
    function link(rel) {
      let el = head.querySelector('link[rel="' + rel + '"]');
      if (!el) { el = document.createElement('link'); el.rel = rel; head.appendChild(el); }
      return el;
    }
    const DEFAULT_DESC = 'ליסינג מימוני פרטי, מימון והשוואת רכבים — רכב חדש בקלות ובפשטות, בהחזר חודשי מותאם אישית. Car2Buy.';
    // exposed so dynamic template pages (car/model/brand/article) can refresh meta after rendering an item
    window.C2B_setMeta = function (opts) {
      opts = opts || {};
      if (opts.title) document.title = opts.title;
      const title = opts.title || document.title;
      const descEl = meta('name', 'description');
      const desc = opts.description || descEl.getAttribute('content') || DEFAULT_DESC;
      descEl.setAttribute('content', desc);
      const canonical = location.origin + location.pathname + location.search;
      link('canonical').setAttribute('href', canonical);
      const image = new URL(opts.image || 'og-default.jpg', location.href).href;
      const og = { 'og:site_name': 'Car2Buy', 'og:type': opts.type || 'website', 'og:title': title, 'og:description': desc, 'og:url': canonical, 'og:image': image, 'og:locale': 'he_IL' };
      Object.keys(og).forEach((k) => meta('property', k).setAttribute('content', og[k]));
      const tw = { 'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': desc, 'twitter:image': image };
      Object.keys(tw).forEach((k) => meta('name', k).setAttribute('content', tw[k]));
    };
    window.C2B_setMeta();
  })();

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
