/* ============================================================
   Car2Buy — page interactions (all feature-guarded so the same
   file is safe to load on every page)
   ============================================================ */
(function () {
  'use strict';
  const fmt = (n) => '₪' + Math.round(n).toLocaleString('en-US');

  /* ---------- FAQ accordion ---------- */
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length && document.body.dataset.page === 'faq') {
    try {
      const qa = [...faqItems].map((it) => {
        const q = it.querySelector('.faq-q'); const a = it.querySelector('.faq-a');
        return q && a ? { "@type": "Question", "name": q.textContent.replace(/[+\-]\s*$/, '').trim(),
          "acceptedAnswer": { "@type": "Answer", "text": a.textContent.trim() } } : null;
      }).filter(Boolean);
      const f = document.createElement('script');
      f.type = 'application/ld+json';
      f.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": qa });
      document.head.appendChild(f);
    } catch (e) {}
  }
  faqItems.forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => {
        o.classList.remove('open');
        const oa = o.querySelector('.faq-a'); if (oa) oa.style.maxHeight = null;
      });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---------- calculator ---------- */
  const priceEl = document.getElementById('amount');
  if (priceEl) {
    const RATE = 0.039 / 12;
    const termToggle = document.getElementById('termToggle');
    let term = 60;

    const $ = (id) => document.getElementById(id);
    const amountVal = $('amountVal'), termVal = $('termVal'), monthlyEl = $('monthly'),
      brAmount = $('brAmount'), brTerm = $('brTerm'), brTotal = $('brTotal');

    function paintRange(el) {
      const min = +el.min, max = +el.max, v = +el.value;
      const pct = ((v - min) / (max - min)) * 100;
      el.style.background = `linear-gradient(90deg, var(--bg-3) 0 ${100 - pct}%, var(--gold-deep) ${100 - pct}% 100%)`;
    }
    function animateNumber(el, target, suffix) {
      const start = parseFloat(el.dataset.cur || '0');
      const dur = 420, t0 = performance.now();
      function frame(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = start + (target - start) * eased;
        el.dataset.cur = cur; el.innerHTML = fmt(cur) + (suffix || '');
        if (p < 1) requestAnimationFrame(frame);
        else { el.dataset.cur = target; el.innerHTML = fmt(target) + (suffix || ''); }
      }
      requestAnimationFrame(frame);
    }
    function calc() {
      const amount = +priceEl.value;
      const factor = RATE / (1 - Math.pow(1 + RATE, -term));
      const monthly = amount * factor;
      const total = monthly * term;
      amountVal.textContent = fmt(amount);
      termVal.textContent = term + ' תשלומים';
      animateNumber(monthlyEl, monthly, '<small> / חודש</small>');
      brAmount.textContent = fmt(amount);
      brTerm.textContent = term;
      brTotal.textContent = fmt(total);
      paintRange(priceEl);
    }
    priceEl.addEventListener('input', calc);
    let calcStarted = false;
    priceEl.addEventListener('change', () => {
      if (!calcStarted) { calcStarted = true; if (window.c2bTrack) c2bTrack('finance_calculator_start'); }
      if (window.c2bTrack) c2bTrack('finance_calculator_result', { monthly: monthlyEl.dataset.cur });
    });
    termToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-term]');
      if (!btn) return;
      term = +btn.dataset.term;
      termToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      calc();
      if (window.c2bTrack) c2bTrack('finance_calculator_result', { term: term });
    });
    calc();
  }

  /* ---------- lead form ---------- */
  const form = document.getElementById('leadForm');
  if (form) {
    // prefill car from ?car= query
    const params = new URLSearchParams(location.search);
    const carParam = params.get('car');
    const carSelect = document.getElementById('fcar');
    if (carParam && carSelect) {
      let opt = [...carSelect.options].find((o) => o.value === carParam || o.textContent === carParam);
      if (!opt) { opt = new Option(carParam, carParam); carSelect.add(opt, 1); }
      carSelect.value = opt.value;
    }
    if (params.get('trade')) { const msg = document.getElementById('fmsg'); if (msg && !msg.value) msg.value = 'מעוניין/ת בעסקת טריד-אין לרכב הקיים שלי.'; }
    if (params.get('import')) { const msg = document.getElementById('fmsg'); if (msg && !msg.value) msg.value = 'מעוניין/ת בבדיקת אפשרות יבוא מקביל של רכב.'; }
    if (params.get('meeting')) { const msg = document.getElementById('fmsg'); if (msg && !msg.value) msg.value = 'מעוניין/ת לתאם פגישה עם יועץ.'; }
    const success = document.getElementById('formSuccess');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fname'), phone = document.getElementById('fphone'),
        consent = document.getElementById('fconsent');
      let ok = true;
      [name, phone].forEach((f) => { if (!f.value.trim()) { f.style.borderColor = 'var(--gold-deep)'; ok = false; } else f.style.borderColor = ''; });
      if (consent && !consent.checked) { consent.style.color = 'var(--gold)'; ok = false; } else if (consent) consent.style.color = '';
      if (!ok) return;
      if (window.submitLead) submitLead(window.collectForm ? collectForm(form, { source: 'contact' }) : { name: name.value.trim(), phone: phone.value.trim(), source: 'contact' });
      if (window.c2bTrack) c2bTrack('lead_form_submit', { car: (carSelect && carSelect.value) || '' });
      form.style.display = 'none';
      if (success) success.classList.add('show');
    });
    form.addEventListener('focusin', function once() { if (window.c2bTrack) c2bTrack('lead_form_start'); form.removeEventListener('focusin', once); });
  }

  /* ---------- models gallery render + sidebar filter ---------- */
  function renderCatalog() {
    const grid = document.getElementById('modelGrid');
    if (!(grid && window.Car2Buy)) return;
    const { MODELS, CATS, BRANDS, FUELS, card, NIS } = window.Car2Buy;

    // real marketed inventory (from the ops sheet) — appended after demo models
    const LOAN = window.Car2Buy.LOAN_CARS || [];
    const FLAG = {};
    (window.Car2Buy.CARS || []).forEach((c) => { FLAG[c.brand + '|' + c.model] = c.slug; });
    const loanFuel = (c) => {
      const t = (c.type || '') + ' ' + (c.trim || '');
      if (/חשמלי|EV/i.test(t)) return 'חשמלי';
      if (/נטען|PHEV/i.test(t)) return 'היברידי נטען';
      if (/היבריד|HEV/i.test(t)) return 'היברידי';
      return 'בנזין';
    };
    const loanBody = (c) => {
      if (c.type) return c.type;
      const n = (c.name || '') + ' ' + (c.brand || '');
      if (/סדאן|סאלון|סליון|ספורטבק|סיל 5|סיל 6|A3|E5\b/i.test(n)) return 'סדאן';
      if (/קופה|קופיה|\bGT\b/i.test(n)) return 'קופה';
      if (/דולפין|יאריס קרוס|קליאו|פולו|קורסה|אטו 2|פיקנטו|i10|i20/i.test(n)) return 'סופרמיני';
      if (/דולפין סרף|טוראנו|MPV|קרניבל|טוראן/i.test(n)) return 'MPV';
      return 'רכב פנאי';
    };

    // group inventory rows into per-model cards (count trims, cheapest monthly)
    const GROUPS = (() => {
      const map = new Map();
      LOAN.forEach((c) => {
        const key = c.brand + '|' + c.name;
        if (!map.has(key)) {
          map.set(key, { brand: c.brand, name: c.name, type: c.type || '', cat: c.cat || '',
            img: c.img, hero: c.hero, fuel: loanFuel(c), year: c.year || 2026,
            minM: c.m, minP: c.p, trims: 0, slug: FLAG[key] || c.id });
        }
        const g = map.get(key);
        g.trims++;
        if (c.m < g.minM) g.minM = c.m;
        if (c.p < g.minP) g.minP = c.p;
        if (!g.img && c.img) g.img = c.img;
      });
      return [...map.values()];
    })();

    const loanCard = (g) => {
      const href = `car.html?car=${g.slug}`;
      const full = (window.Car2Buy.enName ? window.Car2Buy.enName(g) : g.brand + ' ' + g.name);
      const searchName = full + ' ' + g.brand + ' ' + g.name + ' ' + (g.trim || '');
      return `<article class="car ccard reveal" data-cat="${g.cat}" data-brand="${g.brand}" data-fuel="${g.fuel}" data-monthly="${g.minM}" data-name="${searchName}">
        <a class="car-hit" href="${href}">
          <div class="ccard-ph">
            <span class="ccard-fuel">${g.fuel}</span>
            <span class="ccard-year">${g.year}</span>
            <img loading="lazy" src="${g.img}" alt="${full}" onerror="this.style.display='none'">
          </div>
          <div class="ccard-body">
            <div class="ccard-name">${full}</div>
            <div class="ccard-pay">החזר חודשי החל מ- <b>${NIS(g.minM)}</b></div>
          </div>
        </a>
      </article>`;
    };

    grid.innerHTML = GROUPS.map(loanCard).join('');
    const cards = [...grid.querySelectorAll('.car')];
    const countEl = document.getElementById('shopCount');
    const sortEl = document.getElementById('shopSort');
    const filters = document.getElementById('filters');

    if (filters) {
      const prices = LOAN.map((c) => c.m);
      const minP = 0;
      const maxP = Math.ceil(Math.max(...prices) / 100) * 100;
      filters.innerHTML = `
        <div class="filter-group">
          <div class="filter-label">חיפוש</div>
          <input type="search" id="fSearch" class="filter-search" placeholder="דגם או יצרן…">
        </div>
        <div class="filter-group">
          <div class="filter-label">החזר חודשי עד <b id="fPriceVal">${NIS(maxP)}</b></div>
          <input type="range" id="fPrice" min="${minP}" max="${maxP}" step="100" value="${maxP}">
          <div class="calc-ticks"><span>${NIS(minP)}</span><span>${NIS(maxP)}</span></div>
        </div>
        <div class="filter-group">
          <div class="filter-label">קטגוריה</div>
          ${CATS.filter((c) => c.id !== 'all').map((c) =>
            `<label class="filter-chk"><input type="checkbox" name="cat" value="${c.id}"><span>${c.label}</span></label>`).join('')}
        </div>
        <div class="filter-group">
          <div class="filter-label">הנעה</div>
          ${FUELS.map((f) =>
            `<label class="filter-chk"><input type="checkbox" name="fuel" value="${f}"><span>${f}</span></label>`).join('')}
        </div>
        <div class="filter-group">
          <div class="filter-label">יצרן</div>
          <div class="filter-scroll">${[...new Set(LOAN.map((c) => c.brand))].sort((a,b)=>a.localeCompare(b,'he')).map((b) =>
            `<label class="filter-chk"><input type="checkbox" name="brand" value="${b}"><span>${b}</span></label>`).join('')}</div>
        </div>
        <button class="filter-reset" id="fReset">איפוס סינון</button>`;

      const getChecked = (name) => [...filters.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
      const priceEl2 = filters.querySelector('#fPrice');
      const priceVal2 = filters.querySelector('#fPriceVal');
      const search = filters.querySelector('#fSearch');
      let forcedBrand = null;

      const emptyEl = document.createElement('div');
      emptyEl.className = 'shop-empty'; emptyEl.hidden = true;
      emptyEl.innerHTML = `<div class="cmp-empty-ic">⌕</div><h3>אין כרגע דגמים תואמים</h3><p>היצרן או הסינון שבחרתם עדיין לא בקטלוג — אבל אנחנו משיגים <strong>כל רכב</strong>. השאירו פרטים ונאתר עבורכם.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="contact.html" class="btn btn-gold">השאירו פרטים</a><button class="btn btn-ghost" type="button" id="emptyReset">איפוס סינון</button></div>`;
      grid.after(emptyEl);
      emptyEl.querySelector('#emptyReset').addEventListener('click', () => filters.querySelector('#fReset').click());

      function apply() {
        const cats = getChecked('cat'), brands = getChecked('brand'), fuels = getChecked('fuel');
        const effBrands = brands.length ? brands : (forcedBrand ? [forcedBrand] : []);
        const maxPrice = +priceEl2.value;
        const q = (search.value || '').trim().toLowerCase();
        let shown = 0;
        cards.forEach((c) => {
          const ok = (!cats.length || cats.includes(c.dataset.cat))
            && (!effBrands.length || effBrands.includes(c.dataset.brand))
            && (!fuels.length || fuels.includes(c.dataset.fuel))
            && (+c.dataset.monthly <= maxPrice)
            && (!q || c.dataset.name.toLowerCase().includes(q));
          c.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        if (countEl) countEl.textContent = shown;
        emptyEl.hidden = shown !== 0;
        if (window.c2bTrack && !window.__catFilterTracked) { window.__catFilterTracked = true; c2bTrack('catalog_filter_use'); }
      }
      function sortCards() {
        const v = sortEl ? sortEl.value : 'default';
        const arr = [...cards];
        if (v === 'price-asc') arr.sort((a, b) => a.dataset.monthly - b.dataset.monthly);
        else if (v === 'price-desc') arr.sort((a, b) => b.dataset.monthly - a.dataset.monthly);
        else if (v === 'name') arr.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'he'));
        arr.forEach((c) => grid.appendChild(c));
      }
      filters.addEventListener('input', (e) => {
        if (e.target.id === 'fPrice') priceVal2.textContent = NIS(+priceEl2.value);
        if (e.target.name === 'brand') forcedBrand = null;
        apply();
      });
      filters.querySelector('#fReset').addEventListener('click', () => {
        filters.querySelectorAll('input[type=checkbox]').forEach((i) => (i.checked = false));
        priceEl2.value = maxP; priceVal2.textContent = NIS(maxP); search.value = ''; forcedBrand = null;
        apply();
      });
      if (sortEl) sortEl.addEventListener('change', sortCards);

      // custom-styled sort dropdown (replaces native OS list)
      if (sortEl && !sortEl.dataset.enhanced) {
        sortEl.dataset.enhanced = '1';
        sortEl.style.display = 'none';
        const opts = [...sortEl.options];
        const cs = document.createElement('div');
        cs.className = 'csel';
        cs.innerHTML = `<button type="button" class="csel-btn"><span class="csel-val">${opts.find((o) => o.selected).textContent}</span><span class="csel-caret">▾</span></button>
          <div class="csel-list">${opts.map((o) => `<button type="button" class="csel-opt${o.selected ? ' active' : ''}" data-v="${o.value}">${o.textContent}</button>`).join('')}</div>`;
        sortEl.after(cs);
        const btn = cs.querySelector('.csel-btn'), list = cs.querySelector('.csel-list'), valEl = cs.querySelector('.csel-val');
        btn.addEventListener('click', (e) => { e.stopPropagation(); cs.classList.toggle('open'); });
        cs.querySelectorAll('.csel-opt').forEach((o) => o.addEventListener('click', () => {
          sortEl.value = o.dataset.v; valEl.textContent = o.textContent;
          cs.querySelectorAll('.csel-opt').forEach((x) => x.classList.toggle('active', x === o));
          cs.classList.remove('open'); sortCards();
        }));
        document.addEventListener('click', () => cs.classList.remove('open'));
      }

      // mobile filter toggle
      const fToggle = document.getElementById('filterToggle');
      if (fToggle) fToggle.addEventListener('click', () => filters.classList.toggle('open'));

      // pre-apply filters coming from the hero search (?cat=&brand=&max=&q=)
      const params = new URLSearchParams(location.search);
      const qcat = params.get('cat'), qbrand = params.get('brand'), qmax = params.get('max'), qq = params.get('q');
      if (qcat && qcat !== 'all') { const c = filters.querySelector(`input[name="cat"][value="${qcat}"]`); if (c) c.checked = true; }
      if (qbrand) { const b = filters.querySelector(`input[name="brand"][value="${qbrand}"]`); if (b) b.checked = true; else forcedBrand = qbrand; }
      if (qmax) { const mx = Math.min(maxP, Math.max(minP, +qmax)); priceEl2.value = mx; priceVal2.textContent = NIS(mx); }
      if (qq) search.value = qq;

      window.__catFilterTracked = true; // suppress event on initial load
      apply();
      window.__catFilterTracked = false;
    }
    const filterBar = document.getElementById('modelFilter');
    if (filterBar) {
      filterBar.innerHTML = CATS.map((c, i) =>
        `<button data-cat="${c.id}"${i === 0 ? ' class="active"' : ''}>${c.label}</button>`).join('');
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-cat]');
        if (!btn) return;
        filterBar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
        const cat = btn.dataset.cat;
        cards.forEach((c) => { c.style.display = (cat === 'all' || c.dataset.cat === cat) ? '' : 'none'; });
      });
    }
  }
  // render now, or wait for DB-sourced cars to merge first (db-cars.js)
  if (window.Car2Buy && window.Car2Buy.carsLoading) document.addEventListener('c2b:cars-updated', renderCatalog, { once: true });
  else renderCatalog();

  /* ---------- featured models strip (home) ---------- */
  const feat = document.getElementById('featuredGrid');
  if (feat && window.Car2Buy) {
    const { MODELS, card } = window.Car2Buy;
    // 6 cars from 6 distinct brands, straight from the real inventory
    const seen = {}, picks = [];
    for (const m of MODELS) { if (!seen[m.brand]) { seen[m.brand] = 1; picks.push(m); } if (picks.length >= 6) break; }
    feat.innerHTML = picks.map(card).join('');
  }

  /* ---------- full brands directory (brands.html) ---------- */
  const dirGrid = document.getElementById('dirGrid');
  if (dirGrid && window.Car2Buy) {
    const { BRANDS_ALL, dirCard } = window.Car2Buy;
    const sorted = [...BRANDS_ALL].sort((a, b) => (a.he || a.name).localeCompare(b.he || b.name, 'he'));
    dirGrid.innerHTML = sorted.map(dirCard).join('');
  }

  /* ---------- brands strip (home) ---------- */
  const brandsStrip = document.getElementById('brandsStrip');
  if (brandsStrip && window.Car2Buy) {
    const { BRANDS_ALL, LOGO } = window.Car2Buy;
    brandsStrip.innerHTML = BRANDS_ALL.map((b) =>
      `<a class="brand-chip reveal" href="models.html?brand=${encodeURIComponent(b.name)}"><span class="brand-logo"><img loading="lazy" src="${LOGO(b.name)}" alt="${b.name}"></span>${b.name}</a>`).join('');
  }

  /* ---------- used cars grid (יד 2) + smart search ---------- */
  function renderUsed() {
    const usedGrid = document.getElementById('usedGrid');
    if (!(usedGrid && window.Car2Buy)) return;
    const { USED, usedCard, NIS } = window.Car2Buy;
    usedGrid.innerHTML = USED.map(usedCard).join('');
    const cards = [...usedGrid.querySelectorAll('.car')];

    const uSearch = document.getElementById('uSearch');
    const uBrand = document.getElementById('uBrand');
    const uModel = document.getElementById('uModel');
    const uType = document.getElementById('uType');
    const uMonthly = document.getElementById('uMonthly');
    const uKm = document.getElementById('uKm');

    if (uSearch && uMonthly && uKm && uBrand) {
      const uniq = (arr) => [...new Set(arr)];
      const brands = uniq(USED.map((u) => u.brand)).sort();
      const types = uniq(USED.map((u) => u.type));
      const hands = uniq(USED.map((u) => u.hand)).sort((a, b) => a - b);

      uBrand.innerHTML = '<option value="">כל היצרנים</option>' + brands.map((b) => `<option>${b}</option>`).join('');
      uType.innerHTML = '<option value="">כל סוגי הרכב</option>' + types.map((t) => `<option>${t}</option>`).join('');

      function fillModels() {
        const b = uBrand.value;
        const models = b ? uniq(USED.filter((u) => u.brand === b).map((u) => u.name)) : [];
        uModel.innerHTML = '<option value="">' + (b ? 'כל הדגמים של ' + b : 'בחרו יצרן תחילה') + '</option>'
          + models.map((m) => `<option>${m}</option>`).join('');
        uModel.disabled = !b;
      }

      const maxMonthly = Math.ceil(Math.max(...USED.map((u) => u.monthly)) / 100) * 100;
      const minMonthly = Math.floor(Math.min(...USED.map((u) => u.monthly)) / 100) * 100;
      uMonthly.min = minMonthly; uMonthly.max = maxMonthly; uMonthly.step = 50; uMonthly.value = maxMonthly;

      const monthlyVal = document.getElementById('uMonthlyVal');
      const kmVal = document.getElementById('uKmVal');
      const countEl = document.getElementById('uCount');

      const emptyEl = document.createElement('div');
      emptyEl.className = 'shop-empty'; emptyEl.hidden = true;
      emptyEl.innerHTML = `<div class="cmp-empty-ic">⌕</div><h3>אין כרגע רכב תואם</h3><p>נסו להרחיב את הסינון, או <a href="contact.html">השאירו פרטים</a> ונאתר עבורכם.</p>`;
      usedGrid.after(emptyEl);

      function paint(el) { const min = +el.min, max = +el.max, v = +el.value; const pct = ((v - min) / (max - min)) * 100; el.style.background = `linear-gradient(90deg, var(--bg-3) 0 ${100 - pct}%, var(--gold-deep) ${100 - pct}% 100%)`; }

      function applyU() {
        const q = uSearch.value.trim().toLowerCase();
        const b = uBrand.value, mdl = uModel.value, tp = uType.value;
        const mMax = +uMonthly.value, kMax = +uKm.value;
        monthlyVal.textContent = NIS(mMax) + ' / ח׳';
        kmVal.textContent = (+uKm.value).toLocaleString('en-US') + ' ק״מ';
        let shown = 0;
        cards.forEach((c) => {
          const ok = (+c.dataset.monthly <= mMax) && (+c.dataset.km <= kMax)
            && (!b || c.dataset.brand === b)
            && (!mdl || c.dataset.name === b + ' ' + mdl)
            && (!tp || c.dataset.type === tp)
            && (!q || c.dataset.name.toLowerCase().includes(q));
          c.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        countEl.textContent = shown;
        emptyEl.hidden = shown !== 0;
        [uMonthly, uKm].forEach(paint);
      }

      uBrand.addEventListener('change', () => { fillModels(); applyU(); });
      [uSearch, uModel, uType, uMonthly, uKm].forEach((el) => el.addEventListener('input', applyU));

      document.getElementById('uReset').addEventListener('click', () => {
        uSearch.value = ''; uBrand.value = ''; uType.value = '';
        uMonthly.value = maxMonthly; uKm.value = 500000;
        fillModels(); applyU();
      });

      fillModels(); applyU();
    }
  }
  if (window.Car2Buy && window.Car2Buy.carsLoading) document.addEventListener('c2b:cars-updated', renderUsed, { once: true });
  else renderUsed();

  /* ---------- magazine (featured + grid + sidebar) ---------- */
  const magGrid = document.getElementById('magGrid');
  if (magGrid && window.Car2Buy) {
    const { ARTICLES, articleCard } = window.Car2Buy;
    const readTime = (a) => Math.max(2, Math.round(a.body.join(' ').length / 900)) + ' דק׳ קריאה';

    // featured = first article, large
    const featuredWrap = document.getElementById('magFeatured');
    const f = ARTICLES[0];
    if (featuredWrap && f) {
      featuredWrap.innerHTML = `<a class="mag-feat" href="article.html?id=${f.id}">
        <div class="mag-feat-img"><img src="${f.img}" alt="${f.title}"><span class="post-cat">${f.cat}</span></div>
        <div class="mag-feat-body">
          <div class="post-date">${f.date} · ${readTime(f)}</div>
          <h3>${f.title}</h3>
          <p>${f.excerpt}</p>
          <span class="post-cta">קראו את הכתבה ←</span>
        </div>
      </a>`;
    }

    const rest = ARTICLES.slice(1);
    const renderGrid = (list) => { magGrid.innerHTML = list.map(articleCard).join('') || '<p class="mag-empty">לא נמצאו כתבות תואמות.</p>'; };
    renderGrid(rest);

    // category filter chips
    const cats = ['הכל', ...new Set(ARTICLES.map((a) => a.cat))];
    let activeCat = 'הכל', query = '';
    const filterBar = document.getElementById('magFilter');
    function applyFilter() {
      let list = activeCat === 'הכל' ? rest : ARTICLES.filter((a) => a.cat === activeCat);
      if (query) list = list.filter((a) => (a.title + ' ' + a.excerpt + ' ' + a.cat).toLowerCase().includes(query));
      renderGrid(list);
    }
    if (filterBar) {
      filterBar.innerHTML = cats.map((c, i) => `<button class="mag-chip${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('');
      filterBar.addEventListener('click', (e) => {
        const b = e.target.closest('.mag-chip'); if (!b) return;
        activeCat = b.dataset.cat;
        filterBar.querySelectorAll('.mag-chip').forEach((x) => x.classList.toggle('active', x === b));
        applyFilter();
      });
    }

    // sidebar: categories list
    const catList = document.getElementById('magCats');
    if (catList) {
      const counts = {};
      ARTICLES.forEach((a) => { counts[a.cat] = (counts[a.cat] || 0) + 1; });
      catList.innerHTML = Object.keys(counts).map((c) =>
        `<button class="mag-cat-row" data-cat="${c}"><span>${c}</span><b>${counts[c]}</b></button>`).join('');
      catList.addEventListener('click', (e) => {
        const b = e.target.closest('.mag-cat-row'); if (!b) return;
        activeCat = b.dataset.cat;
        if (filterBar) filterBar.querySelectorAll('.mag-chip').forEach((x) => x.classList.toggle('active', x.dataset.cat === activeCat));
        applyFilter();
        magGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // sidebar: popular
    const pop = document.getElementById('magPopular');
    if (pop) {
      pop.innerHTML = ARTICLES.slice(0, 4).map((a, i) =>
        `<a class="mag-pop" href="article.html?id=${a.id}"><span class="mag-pop-n">${i + 1}</span><span class="mag-pop-t">${a.title}</span></a>`).join('');
    }

    // sidebar: search
    const search = document.getElementById('magSearch');
    if (search) search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); activeCat = 'הכל'; if (filterBar) filterBar.querySelectorAll('.mag-chip').forEach((x, i) => x.classList.toggle('active', i === 0)); applyFilter(); });

    // newsletter
    const news = document.getElementById('magNews');
    if (news) news.addEventListener('submit', (e) => { e.preventDefault(); const em = news.querySelector('input'); if (window.submitLead && em && em.value.trim()) submitLead({ email: em.value.trim(), source: 'newsletter_magazine' }); news.querySelector('input').style.display = 'none'; news.querySelector('button').style.display = 'none'; const ok = document.getElementById('magNewsOk'); if (ok) ok.classList.add('show'); });
  }

  /* ---------- press strip ---------- */
  const press = document.getElementById('pressStrip');
  if (press && window.Car2Buy) {
    press.innerHTML = window.Car2Buy.PRESS.map((p) =>
      `<figure class="press-item reveal"><span class="press-logo press-${p.style}">${p.name}</span><figcaption class="press-quote">${p.quote}</figcaption></figure>`).join('');
  }

  /* ---------- video testimonials carousel ---------- */
  const vtest = document.getElementById('vtest');
  if (vtest && window.Car2Buy) {
    const items = window.Car2Buy.CUSTOMERS;
    const track = document.getElementById('vtTrack');
    const dotsWrap = document.getElementById('vtDots');
    track.innerHTML = items.map((c) => `
      <article class="vtest-slide">
        <div class="vtest-media">
          <img src="${c.img}" alt="${c.name}">
          <button class="vtest-play" aria-label="נגן סרטון"><span class="tri"></span></button>
          <span class="vtest-badge">▶ סרטון המלצה</span>
        </div>
        <div class="vtest-body">
          <div class="vtest-quote-mark">”</div>
          <p class="vtest-quote">${c.quote}</p>
          <div class="vtest-by"><div class="vtest-av">${c.name.charAt(0)}</div><div><div class="vtest-name">${c.name}</div><div class="vtest-car">${c.car}</div></div></div>
          <div class="vtest-stars">★★★★★</div>
        </div>
      </article>`).join('');
    dotsWrap.innerHTML = items.map((_, i) => `<button class="vtest-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="המלצה ${i + 1}"></button>`).join('');
    const dots = [...dotsWrap.children];
    let idx = 0, timer = null;
    function go(i) {
      idx = (i + items.length) % items.length;
      track.style.transform = `translateX(${idx * 100}%)`; // RTL: positive shifts correctly
      dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function play() { stop(); timer = setInterval(next, 5000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    document.getElementById('vtNext').addEventListener('click', () => { next(); play(); });
    document.getElementById('vtPrev').addEventListener('click', () => { prev(); play(); });
    dotsWrap.addEventListener('click', (e) => { const d = e.target.closest('.vtest-dot'); if (d) { go(+d.dataset.i); play(); } });
    vtest.addEventListener('mouseenter', stop);
    vtest.addEventListener('mouseleave', play);
    track.addEventListener('click', (e) => { const p = e.target.closest('.vtest-play'); if (p) { p.closest('.vtest-media').classList.add('playing'); } });
    go(0); play();
  }

  /* ---------- customer photo marquee (continuous) ---------- */
  const cmTrack = document.getElementById('custMarqueeTrack');
  if (cmTrack && window.Car2Buy) {
    const items = window.Car2Buy.CUSTOMERS;
    const cell = (c) => `<figure class="cm-cell"><img loading="lazy" src="${c.img}" alt="${c.name}"><figcaption class="cm-cap"><b>${c.name}</b><span>${c.car}</span></figcaption></figure>`;
    // duplicate the set so the loop is seamless
    cmTrack.innerHTML = items.map(cell).join('') + items.map(cell).join('');
  }

  /* ---------- article reader ---------- */
  const artView = document.getElementById('articleView');
  if (artView && window.Car2Buy) {
    const { ARTICLES, articleCard } = window.Car2Buy;
    const id = new URLSearchParams(location.search).get('id');
    const a = ARTICLES.find((x) => x.id === id);
    if (!a) {
      artView.innerHTML = `<section class="section" style="padding-top:160px;"><div class="wrap center"><h2 class="h-sec">הכתבה לא נמצאה</h2><div style="margin-top:24px;"><a href="magazine.html" class="btn btn-gold btn-lg">למגזין</a></div></div></section>`;
    } else {
      document.title = `${a.title} · מגזין Car2Buy`;
      if (a.desc) { let m = document.querySelector('meta[name="description"]'); if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); } m.content = a.desc; }
      try { window.C2B_setMeta && C2B_setMeta({ description: a.desc || a.excerpt, image: a.img, type: 'article' }); } catch (e) {}
      try {
        const old = document.getElementById('c2bArticleSchema'); if (old) old.remove();
        const as = document.createElement('script');
        as.type = 'application/ld+json'; as.id = 'c2bArticleSchema';
        as.textContent = JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          "headline": a.title,
          "description": a.desc || a.excerpt || '',
          "image": new URL(a.img, location.href).href,
          "articleSection": a.cat || undefined,
          "author": { "@type": "Organization", "name": "Car2Buy" },
          "publisher": { "@type": "Organization", "name": "Car2Buy" },
          "mainEntityOfPage": location.href
        });
        document.head.appendChild(as);
      } catch (e) {}
      const more = ARTICLES.filter((x) => x.id !== a.id && x.cat === a.cat).concat(ARTICLES.filter((x) => x.id !== a.id && x.cat !== a.cat)).slice(0, 3);
      const words = a.body.map((b) => typeof b === 'string' ? b : (b.p || b.h2 || (b.ul ? b.ul.join(' ') : ''))).join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).length;
      const readMin = Math.max(3, Math.round(words / 220));
      const blocks = a.body.map((b) => {
        if (typeof b === 'string') return `<p class="reveal">${b}</p>`;
        if (b.h2) return `<h2 class="art-h2 reveal">${b.h2}</h2>`;
        if (b.ul) return `<ul class="art-ul reveal">${b.ul.map((li) => `<li>${li}</li>`).join('')}</ul>`;
        if (b.quote) return `<blockquote class="art-quote reveal">${b.quote}</blockquote>`;
        if (b.p) return `<p class="reveal">${b.p}</p>`;
        return '';
      }).join('');
      // build a table of contents from h2 blocks
      const heads = a.body.filter((b) => typeof b === 'object' && b.h2).map((b) => b.h2);
      const toc = heads.length >= 3 ? `<nav class="art-toc reveal"><div class="art-toc-h">בכתבה זו</div><ol>${heads.map((h, i) => `<li><a href="#h${i}">${h}</a></li>`).join('')}</ol></nav>` : '';
      let hIdx = -1;
      const blocksWithIds = blocks.replace(/<h2 class="art-h2 reveal">/g, () => { hIdx++; return `<h2 id="h${hIdx}" class="art-h2 reveal">`; });
      artView.innerHTML = `
        <section class="media-hero page article-hero">
          <div class="mh-bg"><img src="${a.img}" alt="${a.title}"></div>
          <div class="mh-overlay"></div>
          <div class="wrap"><div class="mh-content">
            <a href="magazine.html" class="back-link reveal">← למגזין</a>
            <span class="eyebrow reveal">${a.cat} · ${a.date} · ${readMin} דק׳ קריאה</span>
            <h1 class="reveal" style="font-size:clamp(32px,4.4vw,56px);">${a.title}</h1>
          </div></div>
        </section>
        <section class="section"><div class="wrap article-body">
          ${a.excerpt ? `<p class="art-lead reveal">${a.excerpt}</p>` : ''}
          ${toc}
          ${blocksWithIds}
          <div class="article-cta reveal"><h3>מוכנים לרכב הבא שלכם?</h3><div class="mh-actions" style="justify-content:center;margin-top:20px;"><a href="models.html" class="btn btn-gold btn-lg">לקטלוג הדגמים</a><a href="contact.html" class="btn btn-ghost btn-lg">השארת פרטים</a></div></div>
        </div></section>
        <section class="section testi-section"><div class="wrap">
          <span class="eyebrow reveal">עוד במגזין</span>
          <h2 class="h-sec reveal">כתבות <span class="gold-text">נוספות</span></h2>
          <div class="posts" style="margin-top:44px;">${more.map(articleCard).join('')}</div>
        </div></section>`;
    }
  }

  /* ---------- pinned process (4 steps, scroll-driven) ---------- */
  const procTrack = document.getElementById('procTrack');
  if (procTrack && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const dots = [...procTrack.querySelectorAll('.proc-dot')];
    const cards = [...procTrack.querySelectorAll('.proc-card')];
    const fill = document.getElementById('procFill');
    const N = cards.length;
    const horiz = () => matchMedia('(max-width: 820px)').matches;
    procTrack.classList.add('ready');

    let active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      dots.forEach((d, k) => { d.classList.toggle('active', k === i); d.classList.toggle('done', k < i); });
      cards.forEach((c, k) => c.classList.toggle('active', k === i));
    }
    function onScroll() {
      const r = procTrack.getBoundingClientRect();
      const total = procTrack.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const idx = Math.min(N - 1, Math.floor(p * N));
      setActive(idx);
      if (fill) { const pct = (p * 100).toFixed(1) + '%'; if (horiz()) fill.style.width = pct; else fill.style.height = pct; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // dots clickable → scroll to that step's slice
    dots.forEach((d, i) => d.addEventListener('click', () => {
      const total = procTrack.offsetHeight - window.innerHeight;
      const y = procTrack.offsetTop + total * ((i + 0.5) / N);
      window.scrollTo({ top: y, behavior: 'smooth' });
    }));
  }

  /* ---------- quick contact strip (home) ---------- */
  const quickForm = document.getElementById('quickForm');
  if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('qcName');
      const phone = document.getElementById('qcPhone');
      const consent = document.getElementById('qcConsent');
      let ok = true;
      [name, phone].forEach((f) => { if (!f.value.trim()) { f.style.borderColor = 'var(--gold-deep)'; ok = false; } else f.style.borderColor = ''; });
      if (consent && !consent.checked) { consent.style.color = 'var(--gold)'; ok = false; } else if (consent) consent.style.color = '';
      if (!ok) return;
      if (window.submitLead) submitLead(window.collectForm ? collectForm(quickForm, { source: 'home_quick' }) : { name: name.value.trim(), phone: phone.value.trim(), source: 'home_quick' });
      quickForm.classList.add('sent');
      const s = document.getElementById('qcSuccess');
      if (s) s.classList.add('show');
    });
  }

  /* ---------- instant live search (home hero) ---------- */
  const instant = document.getElementById('instant');
  if (instant && window.Car2Buy) {
    const { MODELS, NIS, LOGO } = window.Car2Buy;
    const dB = window.Car2Buy.dispBrand || ((b) => b);
    const eM = window.Car2Buy.enModel || ((n) => n);
    const input = document.getElementById('instantInput');
    const out = document.getElementById('instantResults');

    function render(q) {
      const query = q.trim().toLowerCase();
      if (!query) { out.classList.remove('show'); out.innerHTML = ''; return; }
      const hits = MODELS.filter((m) =>
        (m.brand + ' ' + m.name + ' ' + (m.trim || '') + ' ' + m.type + ' ' + dB(m.brand) + ' ' + eM(m.name)).toLowerCase().includes(query)
      ).slice(0, 8);
      if (!hits.length) {
        out.innerHTML = `<div class="ir-empty">לא נמצא דגם תואם — <a href="contact.html">נאתר עבורכם כל רכב</a></div>`;
        out.classList.add('show');
        return;
      }
      out.innerHTML = hits.map((m) =>
        `<a class="ir-row" href="car.html?car=${m.id}">
          <img class="ir-thumb" loading="lazy" src="${m.img}" alt="${eM(m.name)}">
          <span class="brand-logo ir-logo"><img src="${LOGO(m.brand)}" alt="" onerror="this.closest('.ir-logo').style.display='none'"></span>
          <span class="ir-meta"><b>${dB(m.brand)} ${eM(m.name)}</b><span>${m.power} כ״ס · ${m.fuel}</span></span>
          <span class="ir-price">${NIS(m.monthly)}<small>/ח׳</small></span>
        </a>`).join('');
      out.classList.add('show');
    }
    input.addEventListener('input', () => render(input.value));
    input.addEventListener('focus', () => { if (input.value.trim()) render(input.value); });
    document.addEventListener('click', (e) => { if (!instant.contains(e.target)) out.classList.remove('show'); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = out.querySelector('.ir-row');
        if (first) location.href = first.getAttribute('href');
      }
    });
  }

  /* ---------- hero search-by-characteristics (home) ---------- */
  const heroSearch = document.getElementById('heroSearch');
  if (heroSearch && window.Car2Buy) {
    const { CATS, BRANDS } = window.Car2Buy;
    heroSearch.innerHTML = `
      <select class="hs-pill" id="hsCat"><option value="all">קטגוריה</option>${CATS.filter((c) => c.id !== 'all').map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}</select>
      <select class="hs-pill" id="hsBrand"><option value="">יצרן</option>${BRANDS.map((b) => `<option value="${b}">${b}</option>`).join('')}</select>
      <select class="hs-pill" id="hsMax"><option value="">החזר חודשי עד</option><option value="3000">₪3,000</option><option value="4000">₪4,000</option><option value="5000">₪5,000</option><option value="7000">₪7,000</option></select>
      <button class="btn btn-gold hs-btn" id="hsBtn">חיפוש רכב</button>`;
    document.getElementById('hsBtn').addEventListener('click', () => {
      const p = new URLSearchParams();
      const c = document.getElementById('hsCat').value, b = document.getElementById('hsBrand').value, mx = document.getElementById('hsMax').value;
      if (c && c !== 'all') p.set('cat', c);
      if (b) p.set('brand', b);
      if (mx) p.set('max', mx);
      location.href = 'models.html' + (p.toString() ? '?' + p.toString() : '');
    });
  }

  /* ---------- click-to-play video showcase ---------- */
  document.querySelectorAll('[data-video]').forEach((box) => {
    const btn = box.querySelector('.video-play');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const v = document.createElement('video');
      v.src = box.dataset.video; v.controls = true; v.autoplay = true; v.playsInline = true;
      v.className = 'video-el';
      box.classList.add('playing');
      box.appendChild(v);
      v.play().catch(() => {});
    });
  });

  /* ---------- model detail page ---------- */
  const detailEl = document.getElementById('modelDetail');
  if (detailEl && window.Car2Buy) {
    const { byId, gallery, NIS, MODELS, card, LOGO } = window.Car2Buy;
    const id = new URLSearchParams(location.search).get('id');
    const m = byId(id);
    if (!m) {
      detailEl.innerHTML = `<section class="section" style="padding-top:160px;"><div class="wrap center">
        <h2 class="h-sec">הדגם לא נמצא</h2><p class="lead" style="margin-inline:auto;">ייתכן שהקישור שגוי.</p>
        <div style="margin-top:30px;"><a href="models.html" class="btn btn-gold btn-lg">לכל הדגמים</a></div></div></section>`;
    } else {
      document.title = `${m.brand} ${m.name} · Car2Buy`;
      try { window.C2B_setMeta && C2B_setMeta({ description: `${m.brand} ${m.name} — מפרט, ביצועים והחזר חודשי מוערך של ${window.Car2Buy && Car2Buy.NIS ? Car2Buy.NIS(m.monthly) : m.monthly + '₪'} לחודש ב-Car2Buy.`, image: m.img }); } catch (e) {}
      if (window.c2bTrack) c2bTrack('car_page_view', { car: m.brand + ' ' + m.name, id: m.id });
      const FIT = {
        suv: ['משפחה שמחפשת רכב פנאי נוח ומרווח', 'נהגים שצריכים תא מטען גדול וישיבה גבוהה', 'מי שרוצה תחושת ביטחון ושדה ראייה רחב'],
        sedan: ['נהגים שעושים הרבה קילומטרים ומחפשים נוחות', 'מנהלים וקהל עסקי שמחפש נוכחות מכובדת', 'מי שרוצה איזון בין מרחב, שקט וחיסכון'],
        sport: ['מי שמחפש חוויית נהיגה וביצועים', 'נהגים שאוהבים עיצוב ספורטיבי ונוכחות', 'רכב שני או רכב לזוג ללא צורך במרחב גדול'],
        ev: ['מי שרוצה לחסוך בעלויות תפעול ודלק', 'נהגים עירוניים שיכולים לטעון בבית או בעבודה', 'מי שמחפש רכב חדש, שקט וטכנולוגי'],
      };
      const fit = FIT[m.cat] || FIT.sedan;
      // derived strengths + extra copy (scales to all models)
      const HL = {
        suv: ['ישיבה גבוהה ושדה ראייה רחב', 'תא מטען מרווח ונפח אחסון גדול', 'תחושת ביטחון ויציבות בכביש'],
        sedan: ['נוחות נסיעה ושקט בתא הנוסעים', 'איזון בין מרחב, ביצועים וחיסכון', 'נוכחות אלגנטית ומכובדת'],
        sport: ['ביצועים ותאוצה מרשימים', 'עיצוב ספורטיבי וקו גוף נמוך', 'חוויית נהיגה ממוקדת ומדויקת'],
        ev: ['עלויות תפעול נמוכות במיוחד', 'נסיעה שקטה וחלקה ללא רעש מנוע', 'טכנולוגיה מתקדמת וחווית נהיגה מודרנית'],
      };
      const highlights = HL[m.cat] || HL.sedan;
      const fuelLine = m.fuel === 'חשמלי' ? 'הנעה חשמלית מלאה — ללא דלק וללא פליטות מקומיות.'
        : m.fuel === 'היברידי' ? 'הנעה היברידית שמשלבת ביצועים עם חיסכון בצריכה.'
        : 'מנוע בנזין עתיר עוצמה עם תגובתיות גבוהה.';
      try {
        const vld = document.createElement('script');
        vld.type = 'application/ld+json';
        vld.textContent = JSON.stringify({
          "@context": "https://schema.org", "@type": "Vehicle",
          "name": m.brand + ' ' + m.name, "brand": { "@type": "Brand", "name": m.brand },
          "vehicleModelDate": m.year, "bodyType": m.body, "fuelType": m.fuel,
          "vehicleEngine": { "@type": "EngineSpecification", "enginePower": { "@type": "QuantitativeValue", "value": m.power, "unitText": "HP" } },
          "offers": { "@type": "Offer", "priceCurrency": "ILS", "price": m.list, "availability": "https://schema.org/InStock" }
        });
        document.head.appendChild(vld);
      } catch (e) {}
      const g = gallery(m);
      const carQ = encodeURIComponent(m.brand + ' ' + m.name);
      const similar = (() => {
        const diffBrand = MODELS.filter((x) => x.cat === m.cat && x.brand !== m.brand && x.id !== m.id);
        const fill = MODELS.filter((x) => x.brand !== m.brand && x.id !== m.id && !diffBrand.includes(x));
        return diffBrand.concat(fill).slice(0, 3);
      })();
      const ytQuery = encodeURIComponent(`${m.brand} ${m.name} ${m.year} סרטון רשמי`);
      const ytId = (window.C2B_VIDEOS || {})[m.id] || '';
      detailEl.innerHTML = `
      <section class="media-hero page detail-hero">
        <div class="mh-bg"><img src="${g[0]}" alt="${m.brand} ${m.name}"></div>
        <div class="mh-overlay"></div>
        <div class="wrap"><div class="mh-content">
          <a href="models.html" class="back-link reveal">← כל הדגמים</a>
          <span class="brand-logo detail-brand-logo reveal"><img src="${LOGO(m.brand)}" alt="${m.brand}"></span>
          <span class="eyebrow reveal">${m.brand} · ${m.type}</span>
          <h1 class="reveal">${m.name}</h1>
          <div class="detail-price reveal">${NIS(m.monthly)}<small> / חודש בליסינג מימוני</small></div>
          <div class="mh-actions reveal">
            <a href="contact.html?car=${carQ}" class="btn btn-gold btn-lg">קבלו הצעה</a>
            <a href="calculator.html" class="btn btn-ghost btn-lg">חשבו החזר</a>
          </div>
        </div></div>
      </section>
      <section class="section">
        <div class="wrap detail-body">
          <div class="detail-main">
            <div class="detail-figure"><img id="detailMain" src="${g[0]}" alt="${m.brand} ${m.name}"></div>
            <div class="detail-thumbs">${g.map((src, i) =>
              `<button class="thumb${i === 0 ? ' active' : ''}" data-src="${src}"><img src="${src}" alt=""></button>`).join('')}</div>
            <div class="detail-text">
              <div class="split-tag">על הדגם</div>
              <p class="detail-blurb">${m.blurb}</p>
              <p class="detail-extra">${m.brand} ${m.name} הוא ${m.body} בעל ${m.power} כ״ס, המאיץ מ‑0 ל‑100 קמ״ש ב‑${m.accel} שניות. ${fuelLine} מתאים ל‑${m.seats} נוסעים, עם הנעה ${m.drive}, משנתון ${m.year}.</p>
              <div class="detail-hl">
                <div class="detail-hl-h">יתרונות עיקריים</div>
                <ul class="detail-hl-list">${highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
              </div>
              <p class="detail-note">המחיר המוצג הוא החזר חודשי משוער בעסקת מימון, בכפוף לאישור גוף מימון ולזמינות הרכב במלאי. ההצעה הסופית נתפרת אישית בהתאם לתנאי העסקה.</p>
            </div>
          </div>
          <aside class="detail-side">
            <div class="spec-card">
              <h3>מפרט עיקרי</h3>
              <div class="spec-grid">
                <div class="spec"><span>הספק</span><b>${m.power} כ״ס</b></div>
                <div class="spec"><span>0–100 קמ״ש</span><b>${m.accel} שנ׳</b></div>
                <div class="spec"><span>סוג הנעה</span><b>${m.drive}</b></div>
                <div class="spec"><span>סוג מנוע</span><b>${m.fuel}</b></div>
                <div class="spec"><span>מושבים</span><b>${m.seats}</b></div>
                <div class="spec"><span>שנתון</span><b>${m.year}</b></div>
                <div class="spec"><span>מרכב</span><b>${m.body}</b></div>
                <div class="spec"><span>מחיר מחירון</span><b>${NIS(m.list)}</b></div>
              </div>
              <div class="spec-cta">
                <div class="spec-price">${NIS(m.monthly)}<small> / חודש</small></div>
                <a href="contact.html?car=${carQ}" class="btn btn-gold" style="width:100%;">כמה זה יעלה לי?</a>
                <a href="calculator.html" class="btn btn-ghost" style="width:100%;margin-top:10px;">למחשבון ההחזר</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <section class="section testi-section">
        <div class="wrap">
          <span class="eyebrow reveal">התאמה</span>
          <h2 class="h-sec reveal">למי הרכב <span class="gold-text">מתאים?</span></h2>
          <ul class="fit-list">${fit.map((x) => `<li class="reveal">${x}</li>`).join('')}</ul>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <span class="eyebrow reveal">אולי יתאים גם</span>
          <h2 class="h-sec reveal">דגמים <span class="gold-text">דומים</span></h2>
          <div class="gallery" style="margin-top:44px;">${similar.map(card).join('')}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <span class="eyebrow reveal">סרטון רשמי</span>
          <h2 class="h-sec reveal">${m.name} <span class="gold-text">במבחן דרכים</span></h2>
          <p class="lead reveal">צפו בסרטון על הדגם — עיצוב, פנים וביצועים.</p>
          ${ytId
            ? `<div class="detail-video reveal" data-yt="${ytId}" role="button" tabindex="0" aria-label="נגן סרטון של ${m.brand} ${m.name}">
            <img src="${g[0]}" alt="${m.brand} ${m.name}">
            <span class="dv-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></span>
            <span class="dv-label">צפייה בסרטון של ${m.brand} ${m.name}</span>
          </div>`
            : `<a class="detail-video reveal" href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" rel="noopener">
            <img src="${g[0]}" alt="${m.brand} ${m.name}">
            <span class="dv-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></span>
            <span class="dv-label">צפייה בסרטון של ${m.brand} ${m.name}</span>
          </a>`}
        </div>
      </section>
      <section class="section testi-section">
        <div class="wrap">
          <span class="eyebrow reveal">מהמגזין</span>
          <h2 class="h-sec reveal">כדאי <span class="gold-text">לדעת לפני שקונים</span></h2>
          <div class="posts" id="detailMag" style="margin-top:44px;"></div>
        </div>
      </section>`;
      // populate magazine strip
      const dmag = document.getElementById('detailMag');
      if (dmag && window.Car2Buy.ARTICLES) {
        dmag.innerHTML = window.Car2Buy.ARTICLES.slice(0, 3).map(window.Car2Buy.articleCard).join('');
      }
      // thumbnail swap
      const mainImg = document.getElementById('detailMain');
      detailEl.querySelectorAll('.thumb').forEach((t) => {
        t.addEventListener('click', () => {
          mainImg.src = t.dataset.src;
          detailEl.querySelectorAll('.thumb').forEach((x) => x.classList.toggle('active', x === t));
        });
      });
      // lite YouTube embed: load the iframe only on click (fast page, no external player until wanted)
      const vbox = detailEl.querySelector('.detail-video[data-yt]');
      if (vbox) {
        const play = () => {
          const id = vbox.dataset.yt;
          const f = document.createElement('iframe');
          f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
          f.title = 'סרטון הרכב';
          f.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
          f.setAttribute('allowfullscreen', '');
          f.className = 'dv-frame';
          vbox.innerHTML = '';
          vbox.appendChild(f);
        };
        vbox.addEventListener('click', play);
        vbox.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
      }
    }
  }
  /* ---------- trade-in wizard (plate → registry lookup → contact) ---------- */
  const wizard = document.getElementById('tradeWizard');
  if (wizard && window.Car2Buy) {
    const { MODELS, IMG } = window.Car2Buy;
    const $ = (id) => document.getElementById(id);
    const COLORS = ['שחור מטאלי', 'לבן פנינה', 'אפור גרפיט', 'כסף מטאלי', 'כחול כהה', 'אדום יין'];
    const TRIMS = ['Executive', 'Luxury', 'Sport', 'Premium', 'Dynamic', 'GT-Line'];

    let fetched = null;

    function goStep(n) {
      wizard.querySelectorAll('.wiz-step').forEach((s) => s.classList.toggle('active', +s.dataset.step === n));
      wizard.querySelectorAll('.wiz-dot').forEach((d) => d.classList.toggle('active', +d.dataset.dot <= n));
      $('wizNow').textContent = n;
      wizard.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    // REAL registry lookup — Ministry of Transport open data (data.gov.il, CORS-enabled)
    const PLATE_DS = [
      '053cea08-09bc-40ec-8f7a-156f0677aff3', // רכב פרטי ומסחרי
      '0866573c-40cd-4ca8-91d2-9dd2d7a492e5', // רכב שהוסר מהכביש
      'bf9df4e2-d90d-4c0a-a400-19e15af8e95f'  // דו-גלגלי / אחר
    ];
    function imgForBrand(brandHe) {
      const b = String(brandHe || '').toLowerCase();
      const map = { 'טסלה': 'teslaWhite', 'מרצדס': 'amgSilver', 'ב.מ.וו': 'bmwSedan', 'במוו': 'bmwSedan', 'אאודי': 'audiSilver', 'יונדאי': 'suvSilver', 'קיה': 'suvSilver', 'סובארו': 'suvSilver', 'מאזדה': 'suvSilver', 'פורד': 'mustang', 'שברולט': 'camaro', 'רנו': 'silverRoad', 'ג\'יפ': 'jeep', 'לנד': 'evoque', 'ריינג': 'evoque' };
      for (const k in map) { if (b.indexOf(k) >= 0 && IMG[map[k]]) return IMG[map[k]]; }
      return IMG.silverRoad || IMG.suvSilver || (MODELS[0] && MODELS[0].img);
    }
    function realLookup(plate, cb) {
      const digits = (plate.match(/\d/g) || []).join('');
      const base = 'https://data.gov.il/api/3/action/datastore_search';
      let i = 0;
      (function tryOne() {
        if (i >= PLATE_DS.length) { cb(null); return; }
        fetch(base + '?resource_id=' + PLATE_DS[i] + '&filters=' + encodeURIComponent(JSON.stringify({ mispar_rechev: +digits })))
          .then((r) => r.json()).then((j) => {
            const recs = (j && j.result && j.result.records) || [];
            if (recs.length) {
              const r = recs[0];
              cb({
                brand: String(r.tozeret_nm || '').replace(/\s+/g, ' ').trim()
                  .replace(/\s+(סין|יפן|קוריאה|דרום קוריאה|טורקיה|גרמניה|ספרד|צ['׳]כיה|אנגליה|בריטניה|צרפת|ארה"ב|ארהב|רומניה|הודו|סלובקיה|הונגריה|בלגיה|איטליה|מקסיקו|תאילנד|אוסטריה|אוסט|פולין|ברזיל|הולנד|שבדיה|סלובניה|ארה״ב)$/, ''),
                name: r.kinuy_mishari || r.degem_nm || '',
                year: r.shnat_yitzur || '', color: r.tzeva_rechev || '',
                trim: r.ramat_gimur || '', fuel: r.sug_delek_nm || '',
                img: imgForBrand(r.tozeret_nm)
              });
              return;
            }
            i++; tryOne();
          }).catch(() => { i++; tryOne(); });
      })();
    }

    function fmtPlate(v) {
      const d = (v.match(/\d/g) || []).join('').slice(0, 8);
      if (d.length <= 3) return d;
      if (d.length <= 5) return d.slice(0, 3) + '-' + d.slice(3);
      return d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5);
    }
    $('wizPlate').addEventListener('input', (e) => {
      const pos = e.target.value;
      e.target.value = fmtPlate(pos);
    });

    $('wizFetch').addEventListener('click', () => {
      const plate = $('wizPlate').value.trim();
      const digits = (plate.match(/\d/g) || []).join('');
      if (digits.length < 6) { $('wizPlate').style.borderColor = '#e25555'; return; }
      $('wizPlate').style.borderColor = '';
      $('wizFetch').hidden = true;
      $('wizLoading').hidden = false;
      $('wizDetails').hidden = true;
      realLookup(plate, (v) => {
        $('wizLoading').hidden = true;
        if (!v) {
          $('wizFetch').hidden = false;
          $('wizPlate').style.borderColor = '#e25555';
          let msg = document.getElementById('wizErr');
          if (!msg) { msg = document.createElement('p'); msg.id = 'wizErr'; msg.style.cssText = 'color:#e25555;font-size:13.5px;text-align:center;margin-top:10px'; $('wizFetch').insertAdjacentElement('afterend', msg); }
          msg.textContent = 'לא נמצא רכב עם מספר זה במאגר משרד התחבורה. בדקו את המספר ונסו שוב.';
          return;
        }
        const e2 = document.getElementById('wizErr'); if (e2) e2.remove();
        fetched = v;
        const meta = ['שנת ' + v.year, v.trim, v.color, v.fuel].filter(Boolean).join(' · ');
        $('wizCar').innerHTML = `
          <img class="wiz-car-img" src="${v.img}" alt="">
          <div class="wiz-car-info">
            <b>${v.brand} ${v.name}</b>
            <span>${meta}</span>
          </div>`;
        $('wizDetails').hidden = false;
      });
    });

    $('wizReset').addEventListener('click', () => {
      $('wizDetails').hidden = true;
      $('wizFetch').hidden = false;
      $('wizPlate').value = '';
      $('wizPlate').focus();
    });

    $('wizNext1').addEventListener('click', () => {
      const km = $('wizKm').value.trim();
      if (!km) { $('wizKm').style.borderColor = '#e25555'; return; }
      $('wizKm').style.borderColor = '';
      goStep(2);
    });

    // step 2 — next-car interest (nothing pre-selected)
    const want = { kind: '', decide: '', brand: '', model: '' };
    const wantModel = $('wizWantModel'), modelPick = $('wizModelPick'), modelField = $('wizModelField');
    const decideWrap = $('wizDecideWrap'), brandPick = $('wizBrandPick'), brandSearch = $('wizBrandSearch');
    const usedBrands = [...new Set(window.Car2Buy.USED.map((u) => u.brand))];
    const HE = window.Car2Buy.BRAND_HE || {};

    function brandList() {
      return want.kind === 'רכב יד שנייה'
        ? usedBrands.slice().sort()
        : window.Car2Buy.BRANDS_ALL.map((b) => b.name);
    }
    function renderBrands() {
      const q = (brandSearch && brandSearch.value || '').trim().toLowerCase();
      const list = brandList().filter((b) =>
        !q || b.toLowerCase().includes(q) || (HE[b] || '').includes(q));
      brandPick.innerHTML = list.length
        ? list.map((b) =>
            `<button type="button" class="wiz-brand${b === want.brand ? ' active' : ''}" data-b="${b}"><span class="brand-logo"><img loading="lazy" src="${window.Car2Buy.LOGO(b)}" alt=""></span><span class="wiz-brand-name">${b}${HE[b] ? ` <small>${HE[b]}</small>` : ''}</span></button>`).join('')
        : '<div class="wiz-nomatch">לא נמצא יצרן תואם</div>';
    }
    function fillWantModels() {
      const pool = want.kind === 'רכב יד שנייה' ? window.Car2Buy.USED : MODELS;
      const models = want.brand ? [...new Set(pool.filter((x) => x.brand === want.brand).map((x) => x.name))] : [];
      wantModel.innerHTML = '<option value="">כל הדגמים</option>' + models.map((m) => `<option>${m}</option>`).join('');
      modelField.hidden = !want.brand;
    }
    function updateVis() {
      // "לאיזה רכב מתקדמים?" only after choosing a NEW car
      decideWrap.hidden = want.kind !== 'רכב חדש';
      const showPick = want.kind === 'רכב חדש' && want.decide === 'specific';
      modelPick.hidden = !showPick;
    }

    renderBrands(); updateVis();

    $('wizKind').addEventListener('click', (e) => {
      const b = e.target.closest('.wiz-opt'); if (!b) return;
      $('wizKind').querySelectorAll('.wiz-opt').forEach((x) => x.classList.toggle('active', x === b));
      want.kind = b.dataset.v; want.brand = ''; want.model = '';
      showBrandList(); fillWantModels(); updateVis();
    });
    $('wizDecide').addEventListener('click', (e) => {
      const b = e.target.closest('.wiz-opt'); if (!b) return;
      $('wizDecide').querySelectorAll('.wiz-opt').forEach((x) => x.classList.toggle('active', x === b));
      want.decide = b.dataset.v; updateVis();
    });
    function showBrandList() {
      if (brandSearch) brandSearch.hidden = false;
      brandPick.classList.remove('chosen');
      renderBrands();
    }
    function showBrandChosen() {
      if (brandSearch) brandSearch.hidden = true;
      brandPick.classList.add('chosen');
      brandPick.innerHTML = `<div class="wiz-brand-sel"><span class="brand-logo"><img src="${window.Car2Buy.LOGO(want.brand)}" alt=""></span><span class="wiz-brand-name">${want.brand}${HE[want.brand] ? ` <small>${HE[want.brand]}</small>` : ''}</span><button type="button" class="wiz-brand-change" id="wizBrandChange">שנה</button></div>`;
      brandPick.querySelector('#wizBrandChange').addEventListener('click', () => { want.brand = ''; want.model = ''; modelField.hidden = true; showBrandList(); if (brandSearch) { brandSearch.value = ''; brandSearch.focus(); } });
    }
    if (brandSearch) brandSearch.addEventListener('input', renderBrands);
    brandPick.addEventListener('click', (e) => {
      const b = e.target.closest('.wiz-brand'); if (!b) return;
      want.brand = b.dataset.b; want.model = '';
      fillWantModels();
      showBrandChosen();
    });
    wantModel.addEventListener('change', () => { want.model = wantModel.value; });
    $('wizNext2').addEventListener('click', () => goStep(3));
    $('wizBack2').addEventListener('click', () => goStep(1));

    $('wizBack').addEventListener('click', () => goStep(2));

    $('wizSubmit').addEventListener('click', () => {
      const name = $('wizName'), phone = $('wizPhone');
      let ok = true;
      [name, phone].forEach((f) => { if (!f.value.trim()) { f.style.borderColor = '#e25555'; ok = false; } else f.style.borderColor = ''; });
      if (!ok) return;
      let interest = want.kind || 'טרם הוחלט';
      if (want.kind === 'רכב חדש' && want.decide === 'specific' && want.brand) interest += ' · ' + want.brand + (want.model ? ' ' + want.model : '');
      else if (want.kind === 'רכב חדש' && want.decide === 'browsing') interest += ' · עדיין מתלבט';
      const data = {
        car: fetched ? `${fetched.brand} ${fetched.name}` : '',
        year: fetched ? fetched.year : '',
        trim: fetched ? fetched.trim : '',
        color: fetched ? fetched.color : '',
        img: fetched ? fetched.img : '',
        plate: $('wizPlate').value.trim(),
        km: $('wizKm').value.trim(),
        interest,
        name: name.value.trim(),
        phone: phone.value.trim(),
      };
      try { sessionStorage.setItem('c2b_trade', JSON.stringify(data)); } catch (e) {}
      if (window.c2bTrack) c2bTrack('trade_in_submit', { car: data.car || '' });
      location.href = 'thank-you.html';
    });
  }

  /* ---------- trade-in thank-you page ---------- */
  const thankView = document.getElementById('thankView');
  if (thankView) {
    let d = null;
    try { d = JSON.parse(sessionStorage.getItem('c2b_trade')); } catch (e) {}
    if (!d) {
      thankView.innerHTML = `<div class="wiz-success" style="padding:40px 0;"><div class="check">✓</div><h3>תודה!</h3><p>קיבלנו את פנייתכם, נציג יחזור אליכם בהקדם.</p><div class="mh-actions" style="justify-content:center;"><a href="models.html" class="btn btn-gold">לקטלוג הדגמים</a></div></div>`;
    } else {
      const rows = [
        ['רכב לטרייד-אין', d.car ? `${d.car}${d.year ? ' · ' + d.year : ''}` : '—'],
        ['רמת גימור / צבע', [d.trim, d.color].filter(Boolean).join(' · ') || '—'],
        ['מספר רכב', d.plate || '—'],
        ['קילומטראז׳', d.km ? d.km + ' ק״מ' : '—'],
        ['מתעניינים ב', d.interest || '—'],
        ['שם', d.name || '—'],
        ['טלפון', d.phone || '—'],
      ];
      thankView.innerHTML = `
        <div class="thanks">
          <div class="thanks-head">
            <div class="check">✓</div>
            <h1>תודה, ${d.name ? d.name.split(' ')[0] : ''}! קיבלנו את הפרטים</h1>
            <p>נציג אישי של Car2Buy יחזור אליכם בהקדם עם הצעת טריד-אין מותאמת${d.interest ? ' והצעה ל' + d.interest.split(' · ')[0] : ''}.</p>
          </div>
          ${d.img ? `<div class="thanks-car"><img src="${d.img}" alt="${d.car}"></div>` : ''}
          <div class="thanks-card">
            <div class="thanks-card-h">סיכום הפנייה</div>
            ${rows.map(([k, v]) => `<div class="thanks-row"><span>${k}</span><b>${v}</b></div>`).join('')}
          </div>
          <div class="mh-actions" style="justify-content:center;">
            <a href="models.html" class="btn btn-gold btn-lg">בחרו את הרכב הבא</a>
            <a href="index.html" class="btn btn-ghost btn-lg">חזרה לדף הבית</a>
          </div>
          <p class="calc-disclaimer" style="text-align:center;">* הפרטים נשמרו לצורך ההדגמה בלבד. במערכת החיה הם נשלחים לצוות המכירות.</p>
        </div>`;
    }
  }

  /* ---------- car comparison ---------- */
  const CMP_KEY = 'c2b_compare', CMP_MAX = 3;
  const getCmp = () => { try { return JSON.parse(localStorage.getItem(CMP_KEY)) || []; } catch (e) { return []; } };
  const setCmp = (a) => { localStorage.setItem(CMP_KEY, JSON.stringify(a)); renderTray(); syncCards(); renderCompareView(); };
  function toggleCmp(id) {
    let a = getCmp();
    if (a.includes(id)) a = a.filter((x) => x !== id);
    else { if (a.length >= CMP_MAX) a.shift(); a.push(id); }
    setCmp(a);
  }
  function syncCards() {
    const ids = getCmp();
    document.querySelectorAll('.car-compare').forEach((b) => {
      const on = ids.includes(b.dataset.id);
      b.classList.toggle('active', on);
      b.textContent = on ? '✓ בהשוואה' : '+ השוואה';
    });
  }
  function renderTray() {
    const tray = document.getElementById('compareTray');
    if (!tray || !window.Car2Buy) return;
    const { byId, LOGO, NIS } = window.Car2Buy;
    const ids = getCmp();
    if (!ids.length) { tray.classList.remove('show'); document.body.classList.remove('tray-open'); tray.innerHTML = ''; return; }
    const items = ids.map((id) => {
      const m = byId(id); if (!m) return '';
      return `<div class="ct-item"><span class="brand-logo ct-logo"><img src="${LOGO(m.brand)}" alt=""></span><div class="ct-meta"><div class="ct-name">${m.name}</div><div class="ct-price">${NIS(m.monthly)} / ח׳</div></div><button class="ct-remove" data-compare-remove="${id}" aria-label="הסר">×</button></div>`;
    }).join('');
    tray.innerHTML = `<div class="wrap ct-inner"><div class="ct-head"><div class="ct-title">השוואת רכבים <span>${ids.length}/${CMP_MAX}</span></div><button class="ct-clear" data-compare-clear aria-label="נקה">נקה הכל</button></div><div class="ct-items">${items}</div><a class="btn btn-gold ct-go${ids.length < 2 ? ' disabled' : ''}" href="compare.html">השוו ${ids.length} רכבים ←</a></div>`;
    tray.classList.add('show');
    document.body.classList.add('tray-open');
  }
  function renderCompareView() {
    const view = document.getElementById('compareView');
    if (!view || !window.Car2Buy) return;
    const { byId, LOGO, NIS } = window.Car2Buy;
    const cars = getCmp().map(byId).filter(Boolean);
    if (cars.length < 1) {
      view.innerHTML = `<div class="cmp-empty"><div class="cmp-empty-ic">⇄</div><h3>עדיין לא בחרתם רכבים להשוואה</h3><p>עברו לקטלוג, לחצו "+ השוואה" על עד 3 רכבים, וחזרו לכאן.</p><a href="models.html" class="btn btn-gold btn-lg">לקטלוג הדגמים</a></div>`;
      return;
    }
    const specs = [
      { label: 'החזר חודשי', get: (m) => m.monthly, fmt: (v) => `<b class="cmp-hi">${NIS(v)}</b> / חודש`, dir: 'lower' },
      { label: 'מחיר מחירון', get: (m) => m.list, fmt: (v) => NIS(v), dir: 'lower' },
      { label: 'הספק', get: (m) => m.power, fmt: (v) => `${v} כ״ס`, dir: 'higher' },
      { label: '0–100 קמ״ש', get: (m) => m.accel, fmt: (v) => `${v} שנ׳`, dir: 'lower' },
      { label: 'סוג הנעה', get: (m) => m.drive, fmt: (v) => v, dir: null },
      { label: 'סוג מנוע', get: (m) => m.fuel, fmt: (v) => v, dir: null },
      { label: 'מושבים', get: (m) => m.seats, fmt: (v) => v, dir: 'higher' },
      { label: 'שנתון', get: (m) => m.year, fmt: (v) => v, dir: 'higher' },
      { label: 'מרכב', get: (m) => m.body, fmt: (v) => v, dir: null },
    ];
    const heads = cars.map((m) => `<th><div class="cmp-card"><a href="model.html?id=${m.id}" class="cmp-img"><img src="${m.img}" alt="${m.name}"><span class="brand-logo cmp-logo"><img src="${LOGO(m.brand)}" alt=""></span></a><div class="cmp-tier">${m.brand}</div><a href="model.html?id=${m.id}" class="cmp-name">${m.name}</a><button class="cmp-remove" data-compare-remove="${m.id}">הסר ×</button></div></th>`).join('');
    const rows = specs.map((s) => {
      const vals = cars.map(s.get);
      const same = vals.every((v) => v === vals[0]);
      let bestVal = null;
      if (s.dir && cars.length > 1 && !same) {
        bestVal = s.dir === 'lower' ? Math.min(...vals) : Math.max(...vals);
      }
      const tds = cars.map((m) => {
        const v = s.get(m);
        const best = bestVal !== null && v === bestVal;
        return `<td class="${best ? 'cmp-best' : ''}">${s.fmt(v)}${best ? '<span class="cmp-star">★</span>' : ''}</td>`;
      }).join('');
      return `<tr class="${same ? 'cmp-same' : ''}"><td class="cmp-lbl">${s.label}</td>${tds}</tr>`;
    }).join('');
    const ctaRow = `<tr><td class="cmp-lbl"></td>${cars.map((m) => `<td><a href="contact.html?car=${encodeURIComponent(m.brand + ' ' + m.name)}" class="btn btn-gold" style="width:100%;">קבלו הצעה</a></td>`).join('')}</tr>`;
    view.innerHTML = `<div class="cmp-bar"><label class="cmp-toggle"><input type="checkbox" id="cmpDiff"> הצג רק הבדלים</label><span class="cmp-hint">★ = הערך המשתלם ביותר</span></div><div class="cmp-wrap"><table class="cmp" id="cmpTable"><thead><tr><th class="cmp-corner"></th>${heads}</tr></thead><tbody>${rows}${ctaRow}</tbody></table></div>${cars.length < CMP_MAX ? `<p class="plans-note">אפשר להוסיף עוד רכב להשוואה — <a href="models.html">לקטלוג</a>.</p>` : ''}`;
    const diffBox = view.querySelector('#cmpDiff');
    if (diffBox) diffBox.addEventListener('change', () => view.querySelector('#cmpTable').classList.toggle('diff-only', diffBox.checked));
  }

  document.addEventListener('click', (e) => {
    const add = e.target.closest('.car-compare');
    if (add) { e.preventDefault(); e.stopPropagation(); toggleCmp(add.dataset.id); return; }
    const rm = e.target.closest('[data-compare-remove]');
    if (rm) { e.preventDefault(); toggleCmp(rm.dataset.compareRemove); return; }
    if (e.target.closest('[data-compare-clear]')) { e.preventDefault(); setCmp([]); }
  });

  renderTray(); syncCards(); renderCompareView();

  /* ---------- SEO/GEO landing pages (data-driven filtered grid) ---------- */
  const seoGrid = document.getElementById('seoGrid');
  if (seoGrid && window.Car2Buy) {
    const { MODELS, card } = window.Car2Buy;
    const d = document.body.dataset;
    let list = MODELS.slice();
    if (d.seoCat) list = list.filter((m) => m.cat === d.seoCat);
    if (d.seoFuel) list = list.filter((m) => m.fuel === d.seoFuel);
    if (d.seoMax) list = list.filter((m) => m.monthly <= +d.seoMax);
    if (d.seoMin) list = list.filter((m) => m.list >= +d.seoMin);
    if (d.seoSeats) list = list.filter((m) => m.seats >= +d.seoSeats);
    list.sort((a, b) => a.monthly - b.monthly);
    seoGrid.innerHTML = list.length ? list.map(card).join('')
      : '<p class="mag-empty">בקרוב דגמים נוספים בקטגוריה זו. <a href="contact.html">השאירו פרטים</a> ונאתר עבורכם.</p>';
    const cnt = document.getElementById('seoCount');
    if (cnt) cnt.textContent = list.length;
  }

  /* ---------- ✨ gold cursor spotlight in media heroes ---------- */
  if (!matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.media-hero').forEach((hero) => {
      const glow = document.createElement('div');
      glow.className = 'hero-spotlight';
      hero.appendChild(glow);
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        glow.style.setProperty('--my', (e.clientY - r.top) + 'px');
        glow.style.opacity = '1';
      });
      hero.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
    });
  }

  /* ---------- 🎴 3D tilt on cards ---------- */
  if (!matchMedia('(hover: none)').matches && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const tiltSel = '.car, .post, .value, .plan';
    let raf = 0;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest(tiltSel);
      document.querySelectorAll('.is-tilting').forEach((c) => { if (c !== card) { c.classList.remove('is-tilting'); c.style.transform = ''; } });
      if (!card) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('is-tilting');
        card.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-5px)`;
      });
    });
    document.addEventListener('pointerleave', () => {
      document.querySelectorAll('.is-tilting').forEach((c) => { c.classList.remove('is-tilting'); c.style.transform = ''; });
    });
  }
})();
