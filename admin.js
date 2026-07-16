/* ============================================================
   Car2Buy — CRM shell: auth, sidebar routing, theme, global search,
   side drawer, and the cars/appointments/tasks/analytics screens.
   Dashboard, leads table and lead drawer live in admin-crm.js.
   Public anon key only; all access gated by Supabase Auth + RLS.
   ============================================================ */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDateTime(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); }
  function nis(n) { return n == null || n === '' ? '—' : '₪' + Number(n).toLocaleString('en-US'); }
  function view(html) { $('view').innerHTML = html; }
  function loading() { view('<div class="loading">טוען…</div>'); }
  function errBox(msg) { view('<div class="card"><p class="err">שגיאה: ' + esc(msg) + '</p></div>'); }
  function stat(k, v, trend) {
    var t = trend ? '<div class="t ' + (trend[0] === '-' ? 'down' : 'up') + '">' + (trend[0] === '-' ? '▼ ' : '▲ ') + esc(trend) + '</div>' : '';
    return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div>' + t + '</div>';
  }

  // ---------- drawer ----------
  function openDrawer(html) { $('drawer').innerHTML = html; $('drawer').classList.add('open'); $('overlay').classList.add('open'); }
  function closeDrawer() { $('drawer').classList.remove('open'); $('overlay').classList.remove('open'); }
  $('overlay').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  window.C2B = { db: db, $: $, esc: esc, fmt: fmtDateTime, nis: nis, view: view, loading: loading, errBox: errBox, stat: stat, openDrawer: openDrawer, closeDrawer: closeDrawer, go: function (n, o) { return go(n, o); } };

  // ---------- theme ----------
  (function () {
    var t = localStorage.getItem('c2b_admin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
    $('themeToggle').textContent = t === 'dark' ? '☀️' : '🌙';
  })();
  $('themeToggle').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('c2b_admin_theme', cur);
    this.textContent = cur === 'dark' ? '☀️' : '🌙';
  });
  $('burger').addEventListener('click', function () { $('side').classList.toggle('open'); });

  // ---------- tasks bell ----------
  function loadBell() {
    db.from('tasks').select('id,title,due_at,done,lead_id').eq('done', false).order('due_at', { ascending: true }).then(function (r) {
      var tasks = r.data || [], now = Date.now();
      var over = tasks.filter(function (t) { return t.due_at && new Date(t.due_at).getTime() < now; });
      var b = $('bellBadge');
      if (tasks.length) { b.textContent = tasks.length; b.classList.remove('hidden'); b.style.background = over.length ? 'var(--danger)' : 'var(--ok)'; } else b.classList.add('hidden');
      $('bellMenu').innerHTML = tasks.map(function (t) {
        var isOver = t.due_at && new Date(t.due_at).getTime() < now;
        return '<div class="bt ' + (isOver ? 'over' : 'up') + '"' + (t.lead_id ? ' data-lead="' + t.lead_id + '"' : '') + '><span class="d"></span><div style="flex:1"><div>' + esc(t.title) + '</div><div class="muted" style="font-size:12px">' + (t.due_at ? fmtDateTime(t.due_at) : 'ללא מועד') + '</div></div></div>';
      }).join('') || '<div class="bt muted">אין משימות פתוחות 🎉</div>';
      $('bellMenu').querySelectorAll('.bt[data-lead]').forEach(function (el) { el.addEventListener('click', function () { $('bellMenu').classList.add('hidden'); window.C2B_openLeadCard(el.dataset.lead); }); });
    }).catch(function () {});
  }
  $('bell').addEventListener('click', function (e) { e.stopPropagation(); $('bellMenu').classList.toggle('hidden'); loadBell(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#bell') && !e.target.closest('#bellMenu')) $('bellMenu').classList.add('hidden'); });

  // ---------- auth ----------
  function showLogin() { $('login').classList.remove('hidden'); $('app').classList.add('hidden'); }
  function showApp(session) {
    $('login').classList.add('hidden'); $('app').classList.remove('hidden'); $('whoami').textContent = session.user.email;
    window.C2B.userId = session.user.id;
    window.C2B.userName = session.user.email;
    window.C2B.lists = {};
    loadLists();
    db.from('profiles').select('role,full_name,views').eq('user_id', session.user.id).single().then(function (r) {
      window.C2B.role = (r.data && r.data.role) || 'sales';
      window.C2B.views = (r.data && r.data.views && r.data.views.length) ? r.data.views : (DEFAULT_VIEWS[window.C2B.role] || ['dashboard']);
      if (r.data && r.data.full_name) { window.C2B.userName = r.data.full_name; $('whoami').textContent = r.data.full_name + ' · ' + roleLabel(window.C2B.role); }
      applyRole(window.C2B.role); refreshBadges(); go('dashboard');
    });
  }
  // admin-managed dropdown lists (brand / source / marketing_company / utm_source)
  var LIST_FIELDS = [['brand', 'מותג'], ['source', 'מקור הגעה'], ['marketing_company', 'חברת שיווק'], ['utm_source', 'utm_source']];
  function loadLists() {
    db.from('field_options').select('field,value').order('value', { ascending: true }).then(function (r) {
      var lists = {}; (r.data || []).forEach(function (o) { (lists[o.field] = lists[o.field] || []).push(o.value); });
      window.C2B.lists = lists;
    }).catch(function () { window.C2B.lists = {}; });
  }
  var ROLE_LABELS = { admin: 'מנהל מערכת', sales: 'סוכן מכירות', files: 'מנהלת תיקי לקוחות', accounting: 'מנהלת חשבונות' };
  function roleLabel(r) { return ROLE_LABELS[r] || r; }
  // views a user MAY open. Admin sees all; others see dashboard+activity always,
  // plus whatever the admin granted (profiles.views). These are the defaults.
  var DEFAULT_VIEWS = {
    sales: ['dashboard', 'leads', 'files', 'cars', 'appointments', 'tasks'],
    files: ['dashboard', 'files', 'leads', 'appointments', 'tasks'],
    accounting: ['dashboard', 'accounting', 'reports']
  };
  // screens the admin can grant when creating a user (label + key)
  var GRANTABLE_VIEWS = [
    ['dashboard', 'דשבורד'], ['leads', 'לידים'], ['files', 'תיקי לקוחות'], ['accounting', 'הנהלת חשבונות'],
    ['cars', 'רכבים'], ['appointments', 'יומן פגישות'], ['tasks', 'משימות'], ['analytics', 'אנליטיקס'], ['reports', 'דוחות'],
    ['quotes', 'הצעות מחיר'], ['documents', 'מסמכים והסכמים'], ['whatsapp', 'WhatsApp'], ['emails', 'מיילים'], ['sms', 'SMS']
  ];
  function navAllowed(nav, role) {
    if (role === 'admin' || !role) return true;
    if (nav === 'activity' || nav === 'dashboard') return true;   // always available
    if (nav === 'users' || (nav && nav.indexOf('soon:') === 0)) return false; // admin-only
    var views = (window.C2B && window.C2B.views) || DEFAULT_VIEWS[role] || ['dashboard'];
    return views.indexOf(nav) >= 0;
  }
  function applyRole(role) {
    $('nav').querySelectorAll('.nav-item, .nav-group-label').forEach(function (it) {
      if (it.classList.contains('nav-group-label')) { it.style.display = role === 'admin' ? '' : 'none'; return; }
      it.style.display = navAllowed(it.dataset.nav, role) ? '' : 'none';
    });
  }
  window.C2B.GRANTABLE_VIEWS = GRANTABLE_VIEWS;
  window.C2B.DEFAULT_VIEWS = DEFAULT_VIEWS;
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); $('loginErr').textContent = '';
    db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value }).then(function (r) {
      if (r.error) { $('loginErr').textContent = 'התחברות נכשלה: ' + r.error.message; return; }
      showApp(r.data.session);
    });
  });
  $('logout').addEventListener('click', function () { db.auth.signOut().then(showLogin); });
  // forgot password → Supabase recovery email → reset.html
  $('forgot').addEventListener('click', function (e) {
    e.preventDefault();
    var em = $('email').value.trim();
    if (!em) { $('loginErr').style.color = 'var(--danger)'; $('loginErr').textContent = 'הזינו אימייל למעלה ואז לחצו "שכחתי סיסמה".'; return; }
    var redirect = location.href.replace(/[^/]*$/, 'reset.html');
    db.auth.resetPasswordForEmail(em, { redirectTo: redirect }).then(function (r) {
      $('loginErr').style.color = r.error ? 'var(--danger)' : 'var(--ok)';
      $('loginErr').textContent = r.error ? ('שגיאה: ' + r.error.message) : 'נשלח מייל לאיפוס סיסמה (אם החשבון קיים). בדקו את תיבת הדואר.';
    });
  });
  // activity screen now lives in the header (next to the bell)
  $('activityBtn').addEventListener('click', function () { go('activity'); });

  // ---------- routing ----------
  function setActive(nav, status) {
    var items = $('nav').querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      it.classList.toggle('active', it.dataset.nav === nav && (status == null || it.dataset.status === status || (it.dataset.status === undefined && !it.dataset.status)));
    }
    var sub = $('leadSub'); if (sub) sub.classList.toggle('open', nav === 'leads');
  }
  function go(nav, opts) {
    opts = opts || {};
    if (window.C2B && window.C2B.role && !navAllowed(nav, window.C2B.role)) { nav = 'dashboard'; opts = {}; }
    if (nav === 'users') { setActive(nav); if (window.innerWidth <= 820) $('side').classList.remove('open'); return renderUsers(); }
    setActive(nav, opts.status);
    if (window.innerWidth <= 820) $('side').classList.remove('open');
    if (nav === 'dashboard') return window.C2B_renderDashboard && window.C2B_renderDashboard();
    if (nav === 'leads') return window.C2B_renderLeads && window.C2B_renderLeads(opts.status);
    if (nav === 'files') return window.C2B_renderFiles && window.C2B_renderFiles();
    if (nav === 'accounting') return window.C2B_renderAccounting && window.C2B_renderAccounting();
    if (nav === 'activity') return window.C2B_renderActivity && window.C2B_renderActivity();
    if (nav === 'cars') return renderCars();
    if (nav === 'appointments') return renderAppointments();
    if (nav === 'tasks') return renderTasks();
    if (nav === 'analytics') return renderAnalytics();
    if (nav === 'reports') return renderReports();
    if (nav === 'ai') return renderAI();
    if (nav === 'settings') return renderSettings();
    if (nav === 'quotes') return window.C2B_renderQuotes && window.C2B_renderQuotes();
    if (nav === 'documents') return window.C2B_renderDocuments && window.C2B_renderDocuments();
    if (nav === 'whatsapp') return window.C2B_renderComms && window.C2B_renderComms('whatsapp');
    if (nav === 'emails') return window.C2B_renderComms && window.C2B_renderComms('emails');
    if (nav === 'sms') return window.C2B_renderComms && window.C2B_renderComms('sms');
    if (nav === 'automations') return window.C2B_renderAutomations && window.C2B_renderAutomations();
    if (nav === 'branches') return window.C2B_renderBranches && window.C2B_renderBranches();
    if (nav.indexOf('soon:') === 0) return renderSoon(nav.slice(5));
    return window.C2B_renderDashboard && window.C2B_renderDashboard();
  }
  $('nav').addEventListener('click', function (e) {
    var it = e.target.closest('.nav-item'); if (!it) return;
    go(it.dataset.nav, { status: it.dataset.status });
  });

  function refreshBadges() {
    db.from('leads').select('id', { count: 'exact', head: true }).then(function (r) { if (r.count != null) $('bLeads').textContent = r.count; });
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false).then(function (r) { if (r.count != null) $('bTasks').textContent = r.count; }).catch(function () {});
    loadBell();
  }

  // ---------- global search ----------
  var gsT;
  $('gsearch').addEventListener('input', function () {
    var q = this.value.trim().replace(/[(),*]/g, ' ').trim(); clearTimeout(gsT);   // strip PostgREST filter-grammar chars
    if (q.length < 2) { $('gsres').classList.add('hidden'); return; }
    gsT = setTimeout(function () {
      db.from('leads').select('id,name,phone,car,status').or('name.ilike.%' + q + '%,phone.ilike.%' + q + '%,car.ilike.%' + q + '%').limit(8).then(function (r) {
        var rows = (r.data || []).map(function (l) { return '<div class="sr" data-lead="' + l.id + '"><b>' + esc(l.name) + '</b> <span class="muted">· ' + esc(l.phone) + (l.car ? ' · ' + esc(l.car) : '') + '</span></div>'; }).join('');
        $('gsres').innerHTML = rows || '<div class="sr muted">אין תוצאות</div>';
        $('gsres').classList.remove('hidden');
        $('gsres').querySelectorAll('.sr[data-lead]').forEach(function (el) { el.addEventListener('click', function () { $('gsres').classList.add('hidden'); $('gsearch').value = ''; window.C2B_openLeadCard(el.dataset.lead); }); });
      });
    }, 250);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) $('gsres').classList.add('hidden'); });

  // ---------- generic field filter (used on leads / files / cars) ----------
  var OPS = { contains: 'מכיל', eq: 'שווה ל', ne: 'שונה מ', gt: 'גדול מ', lt: 'קטן מ', empty: 'ריק', nempty: 'לא ריק' };
  // fields: [{key,label,options?:[{v,l}],get?:fn(row)}]  onApply: fn() → caller redraws
  function makeFilter(fields, onApply) {
    var byKey = {}; fields.forEach(function (f) { byKey[f.key] = f; });
    var state = [];
    function valCtl(f) {
      if (f && f.options) return '<select id="fbVal">' + f.options.map(function (o) { return '<option value="' + esc(o.v) + '">' + esc(o.l) + '</option>'; }).join('') + '</select>';
      return '<input id="fbVal" placeholder="ערך…" style="width:150px">';
    }
    function get(f, row) { var d = byKey[f.field]; return d && d.get ? d.get(row) : row[f.field]; }
    var api = {
      render: function () {
        var chips = state.map(function (f, i) {
          var d = byKey[f.field];
          var shown = d && d.options ? ((d.options.filter(function (o) { return String(o.v) === String(f.val); })[0] || {}).l || f.val) : f.val;
          return '<span class="chip">' + esc(d ? d.label : f.field) + ' ' + OPS[f.op] + ' ' + esc(shown || '') + ' <b data-rmf="' + i + '">✕</b></span>';
        }).join('');
        return '<div class="filterbar" id="fbar"><span class="muted" style="font-size:12px">🧲 סינון לפי שדה:</span>' +
          '<select id="fbField">' + fields.map(function (f) { return '<option value="' + f.key + '">' + esc(f.label) + '</option>'; }).join('') + '</select>' +
          '<select id="fbOp">' + Object.keys(OPS).map(function (k) { return '<option value="' + k + '">' + OPS[k] + '</option>'; }).join('') + '</select>' +
          valCtl(fields[0]) +
          '<button class="btn btn-sm" id="fbAdd">+ הוסף</button>' +
          (state.length ? '<button class="btn btn-ghost btn-sm" id="fbClear">נקה הכל</button>' : '') + chips + '</div>';
      },
      bind: function () {
        var add = $('fbAdd'); if (!add) return;
        $('fbField').addEventListener('change', function () { var f = byKey[this.value]; var holder = $('fbVal'); if (holder) holder.outerHTML = valCtl(f); });
        add.addEventListener('click', function () {
          var field = $('fbField').value, op = $('fbOp').value, val = ($('fbVal') && $('fbVal').value || '').trim();
          if (op !== 'empty' && op !== 'nempty' && !val) return;
          state.push({ field: field, op: op, val: val }); onApply();
        });
        if ($('fbClear')) $('fbClear').addEventListener('click', function () { state = []; onApply(); });
        $('fbar').querySelectorAll('[data-rmf]').forEach(function (b) { b.addEventListener('click', function () { state.splice(+b.dataset.rmf, 1); onApply(); }); });
      },
      match: function (row) {
        return state.every(function (f) {
          var raw = get(f, row); var s = (raw == null ? '' : String(raw)).toLowerCase(), q = String(f.val).toLowerCase();
          if (f.op === 'contains') return s.indexOf(q) >= 0;
          if (f.op === 'eq') return s === q;
          if (f.op === 'ne') return s !== q;
          if (f.op === 'gt') return parseFloat(raw) > parseFloat(f.val);
          if (f.op === 'lt') return parseFloat(raw) < parseFloat(f.val);
          if (f.op === 'empty') return !s;
          if (f.op === 'nempty') return !!s;
          return true;
        });
      },
      count: function () { return state.length; }
    };
    return api;
  }
  window.C2B.makeFilter = makeFilter;

  // ---- reusable column chooser (show/hide + reorder columns), persisted per view ----
  function closeColPanel() { var m = document.getElementById('colpickmenu'); if (m) m.remove(); }
  // cols: [{key,label,cell:fn(row)->'<td>..</td>',th:'attrs?',fixed:bool,def:false-to-hide-by-default}]
  window.C2B.colPicker = function (viewKey, cols, onChange) {
    var LSKEY = 'c2b_cols_' + viewKey, byKey = {}; cols.forEach(function (c) { byKey[c.key] = c; });
    function load() {
      var s = null; try { s = JSON.parse(localStorage.getItem(LSKEY)); } catch (e) {}
      if (!s || !s.order) return { order: cols.map(function (c) { return c.key; }), hidden: cols.filter(function (c) { return !c.fixed && c.def === false; }).map(function (c) { return c.key; }) };
      var order = s.order.filter(function (k) { return byKey[k]; });
      cols.forEach(function (c) { if (order.indexOf(c.key) < 0) order.push(c.key); });
      return { order: order, hidden: (s.hidden || []).filter(function (k) { return byKey[k] && !byKey[k].fixed; }) };
    }
    var state = load();
    function save() { try { localStorage.setItem(LSKEY, JSON.stringify(state)); } catch (e) {} }
    function visible() { return state.order.map(function (k) { return byKey[k]; }).filter(function (c) { return c && state.hidden.indexOf(c.key) < 0; }); }
    function openPanel(anchor) {
      closeColPanel();
      var m = document.createElement('div'); m.id = 'colpickmenu'; m.className = 'colpick-menu';
      m.innerHTML = '<div class="cp-head">בחירת עמודות · גררו בחצים לשינוי סדר</div><div class="cp-list">' +
        state.order.map(function (k) { var c = byKey[k], on = state.hidden.indexOf(k) < 0;
          return '<div class="cp-row" data-k="' + esc(k) + '"><span class="cp-mv"><button data-cpu aria-label="למעלה">▲</button><button data-cpd aria-label="למטה">▼</button></span><span class="cp-lbl">' + esc(c.label) + (c.fixed ? ' 🔒' : '') + '</span><label class="cp-sw"><input type="checkbox" data-cptg ' + (on ? 'checked' : '') + (c.fixed ? ' disabled' : '') + '><span class="cp-sl"></span></label></div>';
        }).join('') + '</div><button class="btn btn-ghost btn-sm" data-cpreset style="width:100%;margin-top:8px">איפוס לברירת מחדל</button>';
      document.body.appendChild(m);
      var r = anchor.getBoundingClientRect(); m.style.top = (r.bottom + 6) + 'px'; m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      m.addEventListener('click', function (e) { e.stopPropagation(); });
      m.querySelectorAll('[data-cptg]').forEach(function (cb) { cb.addEventListener('change', function () { var k = cb.closest('.cp-row').dataset.k, i = state.hidden.indexOf(k); if (cb.checked) { if (i >= 0) state.hidden.splice(i, 1); } else if (i < 0) state.hidden.push(k); save(); onChange(); }); });
      function move(k, d) { var i = state.order.indexOf(k), j = i + d; if (j < 0 || j >= state.order.length) return; var t = state.order[i]; state.order[i] = state.order[j]; state.order[j] = t; save(); onChange(); openPanel(anchor); }
      m.querySelectorAll('[data-cpu]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); move(b.closest('.cp-row').dataset.k, -1); }); });
      m.querySelectorAll('[data-cpd]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); move(b.closest('.cp-row').dataset.k, 1); }); });
      m.querySelector('[data-cpreset]').addEventListener('click', function () { try { localStorage.removeItem(LSKEY); } catch (e) {} state = load(); onChange(); openPanel(anchor); });
      setTimeout(function () { document.addEventListener('click', closeColPanel, { once: true }); }, 0);
    }
    return {
      visible: visible,
      thead: function () { return visible().map(function (c) { return '<th' + (c.th ? ' ' + c.th : '') + '>' + esc(c.label) + '</th>'; }).join(''); },
      cells: function (row) { return visible().map(function (c) { return c.cell(row); }).join(''); },
      colCount: function () { return visible().length; },
      button: function () { return '<button class="btn btn-ghost btn-sm" data-colpick="' + esc(viewKey) + '" title="בחירת עמודות"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-2px"><path d="M4 5h16M4 12h16M4 19h16"/></svg> עמודות</button>'; },
      bind: function () { var b = document.querySelector('[data-colpick="' + viewKey + '"]'); if (b) b.addEventListener('click', function (e) { e.stopPropagation(); openPanel(b); }); }
    };
  };

  // ---------- CARS (read-only from the Google Sheet → cars.json) ----------
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LiK--j3BCPnHO4rZQj7N2RetdnExEmwimWTwn7kmWe8/edit';
  var CAR_COLS = 12;
  var CAR_COL_DEFS = [
    { key: 'img', label: 'תמונה', cell: function (c) { return '<td>' + (c.img ? '<img src="' + esc(c.img) + '" style="width:52px;height:34px;object-fit:cover;border-radius:8px" onerror="this.style.display=\'none\'">' : '') + '</td>'; } },
    { key: 'brand', label: 'מותג', fixed: true, cell: function (c) { return '<td><b>' + esc(c.brand) + '</b></td>'; } },
    { key: 'name', label: 'דגם', fixed: true, cell: function (c) { return '<td>' + esc(c.name) + (c.nameEn ? '<div class="muted" style="font-size:11px">' + esc(c.nameEn) + '</div>' : '') + '</td>'; } },
    { key: 'trim', label: 'גרסה', cell: function (c) { return '<td class="muted">' + esc(c.trim || '—') + '</td>'; } },
    { key: 'engine', label: 'מנוע', cell: function (c) { return '<td class="muted">' + esc(c.engine || '—') + '</td>'; } },
    { key: 'seats', label: 'מושבים', cell: function (c) { return '<td>' + esc(c.seats || '—') + '</td>'; } },
    { key: 'colors', label: 'צבעים', cell: function (c) { return '<td class="muted" style="white-space:normal;max-width:120px">' + esc(c.colors || '—') + '</td>'; } },
    { key: 'm', label: 'החזר', cell: function (c) { return '<td>' + nis(c.m) + '</td>'; } },
    { key: 'p', label: 'מחיר', cell: function (c) { return '<td>' + nis(c.p) + '</td>'; } },
    { key: 'commission', label: 'עמלת סוכן', cell: function (c) { return '<td style="color:var(--ok);font-weight:700">' + nis(c.commission) + '</td>'; } },
    { key: 'down', label: 'מקדמה', cell: function (c) { return '<td class="muted">' + esc(c.down ? nis(c.down) : '—') + '</td>'; } },
    { key: 'code', label: 'קוד', cell: function (c) { return '<td class="muted">' + esc(c.code || '—') + '</td>'; } }
  ];
  var carCols = null;
  function carRows(list) {
    return list.map(function (c) {
      return '<tr><td>' + (c.img ? '<img src="' + esc(c.img) + '" style="width:52px;height:34px;object-fit:cover;border-radius:8px" onerror="this.style.display=\'none\'">' : '') +
        '</td><td><b>' + esc(c.brand) + '</b></td><td>' + esc(c.name) + (c.nameEn ? '<div class="muted" style="font-size:11px">' + esc(c.nameEn) + '</div>' : '') + '</td>' +
        '<td class="muted">' + esc(c.trim) + '</td><td class="muted">' + esc(c.engine) + '</td><td>' + esc(c.seats || '') + '</td>' +
        '<td class="muted" style="white-space:normal;max-width:120px">' + esc(c.colors) + '</td>' +
        '<td>' + nis(c.m) + '</td><td>' + nis(c.p) + '</td>' +
        '<td style="color:var(--ok);font-weight:700">' + nis(c.commission) + '</td>' +
        '<td class="muted">' + esc(c.down ? nis(c.down) : '—') + '</td><td class="muted">' + esc(c.code) + '</td></tr>';
    }).join('');
  }
  function renderCars() {
    loading();
    fetch('cars.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (cars) {
      cars = cars || [];
      var brands = Object.keys(cars.reduce(function (a, c) { if (c.brand) a[c.brand] = 1; return a; }, {})).sort();
      var filter = makeFilter([
        { key: 'brand', label: 'מותג', options: [{ v: '', l: 'הכל' }].concat(brands.map(function (b) { return { v: b, l: b }; })) },
        { key: 'name', label: 'דגם' }, { key: 'trim', label: 'גרסה' }, { key: 'engine', label: 'מנוע' },
        { key: 'colors', label: 'צבע' }, { key: 'code', label: 'קוד דגם' },
        { key: 'p', label: 'מחיר' }, { key: 'm', label: 'החזר חודשי' }, { key: 'commission', label: 'עמלת סוכן' }, { key: 'seats', label: 'מושבים' }
      ], draw);
      if (!carCols) carCols = window.C2B.colPicker('cars', CAR_COL_DEFS, draw);
      view('<div class="card"><div class="row-between"><h3>רכבים חדשים <span class="muted" id="ccount"></span></h3><div><input class="inp" id="cq" placeholder="חיפוש חופשי…" style="width:180px"> <a class="btn btn-sm" href="' + SHEET_URL + '" target="_blank" rel="noopener">✎ פתח את הגיליון</a> ' + carCols.button() + '</div></div>' +
        '<p class="muted" style="font-size:13px">מנוהל ב-Google Sheet, מתעדכן אוטומטית (~15 דק\'). כל הפרטים — כולל עמלת סוכן — נמשכים מהגיליון.</p>' +
        '<div id="carsBody"></div></div>');
      function list() {
        var q = ($('cq') && $('cq').value || '').trim().toLowerCase();
        return cars.filter(function (c) {
          if (q && ((c.brand || '') + ' ' + (c.name || '') + ' ' + (c.nameEn || '') + ' ' + (c.trim || '')).toLowerCase().indexOf(q) < 0) return false;
          return filter.match(c);
        });
      }
      function draw() {
        var rows = list();
        var body = rows.map(function (c) { return '<tr>' + carCols.cells(c) + '</tr>'; }).join('');
        $('carsBody').innerHTML = filter.render() +
          '<div class="table-scroll"><table><thead><tr>' + carCols.thead() + '</tr></thead><tbody>' +
          (body || '<tr><td colspan="' + carCols.colCount() + '" class="empty">אין תואמים</td></tr>') + '</tbody></table></div>';
        if ($('ccount')) $('ccount').textContent = '(' + rows.length + ')';
        filter.bind();
      }
      carCols.bind();
      $('cq').addEventListener('input', draw);
      draw();
    }).catch(function (e) { errBox(e.message || e); });
  }

  // ---------- APPOINTMENTS (calendar) ----------
  var APPT_MODES = ['פרונטלי', 'טלפוני', 'וידאו', 'בסניף'];
  var APPT_COLS = [
    { key: 'status', label: 'סטטוס', cell: function (a) { return '<td>' + (a._handled ? '<span class="done-badge">✓ בוצעה</span>' : a._soon ? '<span class="task-open">● עתידית</span>' : '<span class="tag">חדשה</span>') + '</td>'; } },
    { key: 'name', label: 'שם', fixed: true, cell: function (a) { return '<td><b>' + esc(a.name) + '</b>' + (a._lid ? ' <span class="muted" style="font-size:11px">→ לכרטיס</span>' : '') + '</td>'; } },
    { key: 'phone', label: 'טלפון', cell: function (a) { return '<td>' + esc(a.phone || '—') + '</td>'; } },
    { key: 'when', label: 'מועד', cell: function (a) { return '<td><input type="datetime-local" class="inp" data-appt-when="' + a.id + '" value="' + a._dt + '" onclick="event.stopPropagation()" style="font-size:12.5px"></td>'; } },
    { key: 'mode', label: 'אופן', cell: function (a) { return '<td><select class="inp" data-appt-mode="' + a.id + '" onclick="event.stopPropagation()" style="width:auto;font-size:12.5px"><option value="">אופן…</option>' + APPT_MODES.map(function (m) { return '<option' + (a.appt_mode === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></td>'; } },
    { key: 'brand', label: 'מותג', cell: function (a) { return '<td><input class="inp" data-appt-brand="' + a.id + '" list="apBrand" value="' + esc(a.brand || '') + '" placeholder="מותג" onclick="event.stopPropagation()" style="width:110px;font-size:12.5px"></td>'; } },
    { key: 'note', label: 'הערות', cell: function (a) { return '<td><input class="inp" data-appt-note="' + a.id + '" value="' + esc(a.note || '') + '" placeholder="הערות…" onclick="event.stopPropagation()" style="width:100%;min-width:150px;font-size:12.5px"></td>'; } },
    { key: 'type', label: 'עניין', def: false, cell: function (a) { return '<td>' + esc(a.type || '—') + '</td>'; } },
    { key: 'action', label: 'פעולה', cell: function (a) { return '<td><button class="btn btn-sm ' + (a._handled ? 'btn-ghost' : '') + '" data-appt="' + a.id + '" data-to="' + (a._handled ? 'new' : 'handled') + '" onclick="event.stopPropagation()">' + (a._handled ? 'החזר' : 'סמן כבוצעה') + '</button></td>'; } }
  ];
  var apptCols = null;
  var apptFilter = 'all';
  function renderAppointments() {
    loading();
    Promise.all([
      db.from('appointments').select('*').order('appt_at', { ascending: true }),
      db.from('leads').select('id,phone')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var appts = res[0].data || [], byPhone = {};
      (res[1].data || []).forEach(function (l) { if (l.phone) byPhone[String(l.phone).replace(/\D/g, '')] = l.id; });
      function leadOf(a) { return a.lead_id || byPhone[String(a.phone || '').replace(/\D/g, '')] || null; }
      function whenMs(a) { return a.appt_at ? new Date(a.appt_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0); }
      var now = Date.now();
      var upcoming = appts.filter(function (a) { return a.status !== 'handled' && whenMs(a) >= now; });
      var past = appts.filter(function (a) { return a.status === 'handled' || whenMs(a) < now; });
      var list = apptFilter === 'upcoming' ? upcoming : apptFilter === 'past' ? past : appts;
      function tab(k, label, n) { return '<button data-af="' + k + '"' + (apptFilter === k ? ' class="active"' : '') + '>' + label + ' (' + n + ')</button>'; }
      var brandOpts = ((window.C2B.lists && window.C2B.lists.brand) || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('');
      function dtLocal(a) { var t = a.appt_at ? new Date(a.appt_at) : null; if (!t || isNaN(t)) return ''; var p = function (n) { return ('0' + n).slice(-2); }; return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + 'T' + p(t.getHours()) + ':' + p(t.getMinutes()); }
      list.forEach(function (a) { a._handled = a.status === 'handled'; a._lid = leadOf(a); a._soon = !a._handled && whenMs(a) >= now; a._dt = dtLocal(a); });
      if (!apptCols) apptCols = window.C2B.colPicker('appointments', APPT_COLS, renderAppointments);
      var rows = list.map(function (a) {
        return '<tr' + (a._lid ? ' data-lead="' + a._lid + '" title="פתח כרטיס לקוח"' : '') + ' style="' + (a._lid ? 'cursor:pointer;' : '') + (a._handled ? 'background:rgba(22,163,74,.06)' : '') + '">' + apptCols.cells(a) + '</tr>';
      }).join('');
      view('<div class="card"><div class="row-between"><h3 style="margin:0">📅 יומן פגישות</h3>' + apptCols.button() + '</div><nav class="tabs" id="apptTabs" style="margin:10px 0 12px;flex-wrap:wrap">' + tab('all', 'הכל', appts.length) + tab('upcoming', 'עתידיות', upcoming.length) + tab('past', 'בוצעו / עברו', past.length) + '</nav>' +
        '<datalist id="apBrand">' + brandOpts + '</datalist>' +
        '<div class="table-scroll"><table><thead><tr>' + apptCols.thead() + '</tr></thead><tbody>' + (rows || '<tr><td colspan="' + apptCols.colCount() + '" class="empty">אין פגישות</td></tr>') + '</tbody></table></div></div>');
      apptCols.bind();
      $('apptTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-af]'); if (b) { apptFilter = b.dataset.af; renderAppointments(); } });
      $('view').querySelectorAll('tr[data-lead]').forEach(function (tr) { tr.addEventListener('click', function () { window.C2B_openLeadCard(tr.dataset.lead); }); });
      $('view').querySelectorAll('[data-appt-when]').forEach(function (inp) { inp.addEventListener('change', function () { var v = inp.value ? new Date(inp.value) : null; var patch = { appt_at: v ? v.toISOString() : null }; if (v) { patch.appt_date = v.toLocaleDateString('he-IL'); patch.appt_time = ('0' + v.getHours()).slice(-2) + ':' + ('0' + v.getMinutes()).slice(-2); } db.from('appointments').update(patch).eq('id', inp.dataset.apptWhen).then(renderAppointments); }); });
      $('view').querySelectorAll('[data-appt-mode]').forEach(function (s) { s.addEventListener('change', function () { db.from('appointments').update({ appt_mode: s.value || null }).eq('id', s.dataset.apptMode); }); });
      $('view').querySelectorAll('[data-appt-brand]').forEach(function (inp) { inp.addEventListener('change', function () { db.from('appointments').update({ brand: inp.value.trim() || null }).eq('id', inp.dataset.apptBrand); }); });
      $('view').querySelectorAll('[data-appt-note]').forEach(function (inp) { inp.addEventListener('change', function () { db.from('appointments').update({ note: inp.value.trim() || null }).eq('id', inp.dataset.apptNote); }); });
      $('view').querySelectorAll('button[data-appt]').forEach(function (b) { b.addEventListener('click', function () { db.from('appointments').update({ status: b.dataset.to }).eq('id', b.dataset.appt).then(renderAppointments); }); });
    });
  }

  // ---------- TASKS (all open) ----------
  var TASK_COLS = [
    { key: 'status', label: 'סטטוס', cell: function (t) { return '<td>' + (t.done ? '<span class="done-badge">✓ בוצע</span>' : '<span class="task-open">● פתוחה</span>') + '</td>'; } },
    { key: 'title', label: 'משימה', fixed: true, cell: function (t) { return '<td' + (t.done ? ' class="muted" style="text-decoration:line-through"' : '') + '>' + esc(t.title) + '</td>'; } },
    { key: 'client', label: 'לקוח', cell: function (t) { var l = t._lead; return '<td>' + (l ? '<b>' + esc(l.name || '—') + '</b>' + (l.phone ? '<div class="muted" style="font-size:11px">' + esc(l.phone) + (l.car ? ' · ' + esc(l.car) : '') + '</div>' : '') : '<span class="muted">—</span>') + '</td>'; } },
    { key: 'created', label: 'נוצרה', cell: function (t) { return '<td class="muted">' + (t.created_at ? fmtDateTime(t.created_at) : '—') + '</td>'; } },
    { key: 'due', label: 'מועד', cell: function (t) { var over = !t.done && t.due_at && new Date(t.due_at).getTime() < Date.now(); return '<td' + (over ? ' style="color:var(--danger);font-weight:600"' : ' class="muted"') + '>' + (t.due_at ? fmtDateTime(t.due_at) : '—') + '</td>'; } },
    { key: 'notes', label: 'הערות', cell: function (t) { return '<td><input class="inp" data-tnote="' + t.id + '" value="' + esc(t.notes || '') + '" placeholder="הוסף הערה…" style="width:100%;min-width:150px;font-size:13px"></td>'; } },
    { key: 'open', label: 'פעולות', cell: function (t) { return '<td>' + (t.lead_id ? '<a href="#" data-lead="' + t.lead_id + '">פתח ליד →</a>' : '') + '</td>'; } }
  ];
  var taskCols = null;
  var taskFilter = 'all';
  function renderTasks() {
    loading();
    Promise.all([
      db.from('tasks').select('*').order('due_at', { ascending: true }),
      db.from('leads').select('id,name,phone,car')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var tasks = res[0].data || [], lmap = {}, now = Date.now();
      (res[1].data || []).forEach(function (l) { lmap[l.id] = l; });
      var openList = tasks.filter(function (t) { return !t.done; });
      var doneList = tasks.filter(function (t) { return t.done; });
      var lst = taskFilter === 'open' ? openList : taskFilter === 'done' ? doneList : tasks;
      lst.forEach(function (t) { t._lead = lmap[t.lead_id]; });
      if (!taskCols) taskCols = window.C2B.colPicker('tasks', TASK_COLS, renderTasks);
      var rows = lst.map(function (t) {
        return '<tr' + (t.done ? ' style="background:rgba(22,163,74,.05)"' : '') + '><td><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '></td>' + taskCols.cells(t) + '</tr>';
      }).join('');
      function tab(k, label, n) { return '<button data-tf="' + k + '"' + (taskFilter === k ? ' class="active"' : '') + '>' + label + ' (' + n + ')</button>'; }
      view('<div class="card"><div class="row-between"><h3 style="margin:0">✅ משימות</h3>' + taskCols.button() + '</div><nav class="tabs" id="taskTabs" style="margin:10px 0 12px;flex-wrap:wrap">' + tab('all', 'הכל', tasks.length) + tab('open', 'פתוחות', openList.length) + tab('done', 'בוצעו', doneList.length) + '</nav>' +
        '<div class="table-scroll"><table><thead><tr><th></th>' + taskCols.thead() + '</tr></thead><tbody>' + (rows || '<tr><td colspan="' + (taskCols.colCount() + 1) + '" class="empty">אין משימות</td></tr>') + '</tbody></table></div></div>');
      taskCols.bind();
      $('taskTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tf]'); if (b) { taskFilter = b.dataset.tf; renderTasks(); } });
      $('view').querySelectorAll('input[data-tnote]').forEach(function (inp) { inp.addEventListener('change', function () { db.from('tasks').update({ notes: inp.value.trim() || null }).eq('id', inp.dataset.tnote); }); });
      $('view').querySelectorAll('input[data-task]').forEach(function (cb) { cb.addEventListener('change', function () { db.from('tasks').update({ done: cb.checked }).eq('id', cb.dataset.task).then(function () { refreshBadges(); renderTasks(); }); }); });
      $('view').querySelectorAll('a[data-lead]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); window.C2B_openLeadCard(a.dataset.lead); }); });
    });
  }

  // ---------- ANALYTICS ----------
  function refDomain(r) { if (!r) return '(ישיר / הקלדה)'; try { var h = new URL(r).hostname.replace(/^www\./, ''); if (/google\./.test(h)) return 'Google (אורגני)'; if (/facebook|fb\.com|instagram/.test(h)) return 'Meta (פייסבוק/אינסטגרם)'; if (/t\.co|twitter|x\.com/.test(h)) return 'X/Twitter'; if (/youtube/.test(h)) return 'YouTube'; if (h.indexOf('tzahilevi1.github.io') >= 0) return '(פנימי)'; return h; } catch (e) { return '(אחר)'; } }
  function deviceOf(ua) { ua = ua || ''; if (/iPad|Tablet/i.test(ua)) return 'טאבלט'; if (/Mobi|Android|iPhone/i.test(ua)) return 'מובייל'; return 'דסקטופ'; }
  function browserOf(ua) { ua = ua || ''; if (/Edg/i.test(ua)) return 'Edge'; if (/Chrome/i.test(ua)) return 'Chrome'; if (/Firefox/i.test(ua)) return 'Firefox'; if (/Safari/i.test(ua)) return 'Safari'; return 'אחר'; }
  function anBars(days) {
    var max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.v; }))), W = 100 / days.length;
    var bars = days.map(function (d, i) { var h = d.v / max * 90; return '<rect x="' + (i * W + W * 0.15) + '" y="' + (100 - h) + '" width="' + (W * 0.7) + '" height="' + h + '" rx="1.5" fill="var(--brand)"><title>' + d.d + ': ' + d.v + '</title></rect>'; }).join('');
    var labels = days.map(function (d, i) { return i % 2 === 0 ? '<text x="' + (i * W + W / 2) + '" y="99" font-size="3" fill="var(--muted)" text-anchor="middle">' + d.d.slice(5) + '</text>' : ''; }).join('');
    return '<svg viewBox="0 0 100 108" preserveAspectRatio="none" style="width:100%;height:180px">' + bars + labels + '</svg>';
  }
  function breakdown(title, obj, limit) {
    var keys = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).slice(0, limit || 10);
    var mx = keys.length ? obj[keys[0]] : 1, total = keys.reduce(function (s, k) { return s + obj[k]; }, 0);
    return '<div class="card"><h3>' + title + '</h3><div class="table-scroll"><table><tbody>' + (keys.map(function (k) { return '<tr><td class="wrap">' + esc(k) + '</td><td>' + obj[k] + '</td><td class="muted">' + (total ? Math.round(obj[k] / total * 100) : 0) + '%</td><td style="width:40%"><div class="bar"><span style="width:' + Math.round(obj[k] / mx * 100) + '%"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>') + '</tbody></table></div></div>';
  }
  function renderAnalytics() {
    loading();
    db.from('events').select('*').order('created_at', { ascending: false }).limit(8000).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var ev = r.data || [], pv = ev.filter(function (e) { return e.type === 'pageview'; });
      var STD = { pageview: 1, session_end: 1 };
      var sessions = {}, pvBySession = {}, firstUaBySession = {};
      ev.forEach(function (e) { if (!e.session_id) return; sessions[e.session_id] = 1; if (e.type === 'pageview') { pvBySession[e.session_id] = (pvBySession[e.session_id] || 0) + 1; if (!firstUaBySession[e.session_id]) firstUaBySession[e.session_id] = e.ua; } });
      var sessCount = Object.keys(sessions).length, pvCount = pv.length;
      var durs = ev.filter(function (e) { return e.type === 'session_end' && e.duration_ms; }).map(function (e) { return e.duration_ms; });
      var avg = durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length / 1000) : 0;
      var bounces = Object.keys(pvBySession).filter(function (s) { return pvBySession[s] === 1; }).length;
      var bounceRate = sessCount ? Math.round(bounces / sessCount * 100) : 0;
      var perSession = sessCount ? (pvCount / sessCount).toFixed(1) : 0;
      // breakdowns
      var byPage = {}, byRef = {}, byDev = {}, byBrowser = {}, byEvent = {}, byDay = {};
      pv.forEach(function (e) { var p = e.page || '/'; byPage[p] = (byPage[p] || 0) + 1; var dd = (e.created_at || '').slice(0, 10); if (dd) byDay[dd] = (byDay[dd] || 0) + 1; });
      Object.keys(firstUaBySession).forEach(function (s) { var ua = firstUaBySession[s]; byDev[deviceOf(ua)] = (byDev[deviceOf(ua)] || 0) + 1; byBrowser[browserOf(ua)] = (byBrowser[browserOf(ua)] || 0) + 1; });
      ev.forEach(function (e) { if (e.type === 'pageview') { var ref = refDomain(e.referrer); /* count referrer per pageview that has one, else direct */ } });
      // referrers: count sessions by their first pageview referrer
      var seenSessRef = {}; pv.slice().reverse().forEach(function (e) { if (e.session_id && !seenSessRef[e.session_id]) { seenSessRef[e.session_id] = 1; var k = refDomain(e.referrer); byRef[k] = (byRef[k] || 0) + 1; } });
      ev.forEach(function (e) { if (!STD[e.type]) byEvent[e.type || 'event'] = (byEvent[e.type || 'event'] || 0) + 1; });
      var conversions = (byEvent.whatsapp_click || 0) + (byEvent.phone_click || 0) + (byEvent.lead_saved || 0) + (byEvent.lead_form_submit || 0);
      var days = []; for (var i = 13; i >= 0; i--) { var dz = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push({ d: dz, v: byDay[dz] || 0 }); }

      view(
        '<h2 style="margin:0 0 12px">📊 אנליטיקס</h2>' +
        '<div class="cards">' +
          stat('צפיות בעמודים', pvCount) + stat('מבקרים (סשנים)', sessCount) +
          stat('זמן שהייה ממוצע', avg ? avg + ' שנ\'' : '—') + stat('אחוז נטישה', bounceRate + '%') +
          stat('עמודים לסשן', perSession) + stat('המרות (קליקים/לידים)', conversions, true) +
        '</div>' +
        '<div class="card"><h3>תנועה ב-14 הימים האחרונים</h3>' + anBars(days) + '</div>' +
        '<div class="grid2">' + breakdown('🔗 מקורות תנועה', byRef) + breakdown('📄 עמודים מובילים', byPage, 12) + '</div>' +
        '<div class="grid2">' + breakdown('📱 מכשירים', byDev) + breakdown('🌐 דפדפנים', byBrowser) + '</div>' +
        '<div class="card"><h3>⚡ אירועים והמרות</h3><div class="table-scroll"><table><thead><tr><th>אירוע</th><th>כמות</th></tr></thead><tbody>' +
          (Object.keys(byEvent).sort(function (a, b) { return byEvent[b] - byEvent[a]; }).map(function (k) { return '<tr><td>' + esc({ whatsapp_click: '💬 קליק וואטסאפ', phone_click: '📞 קליק טלפון', lead_saved: '✅ ליד נשמר', lead_form_submit: '📝 שליחת טופס', finance_calculator_start: '🧮 התחיל מחשבון', finance_calculator_result: '🧮 תוצאת מחשבון' }[k] || k) + '</td><td>' + byEvent[k] + '</td></tr>'; }).join('') || '<tr><td class="empty" colspan="2">אין אירועים עדיין — ייאספו מהאתר</td></tr>') +
        '</tbody></table></div><p class="muted" style="font-size:12px;margin-top:8px">נאסף first-party מהאתר (ללא עוגיות/צד ג\'). לפילוח קמפיינים לפי UTM — ראו "דוחות → שיווק" ושדות ה-UTM בלידים.</p></div>'
      );
    });
  }

  // ---------- REPORTS (marketing / sales / manager) ----------
  // ===== REPORTS — executive analytics (mirrors + improves the Electric-Lease dashboard, from our own data) =====
  var HEB_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  function M(n) { return '₪' + Math.round(+n || 0).toLocaleString('en-US'); }
  function P1(n) { return (Math.round((+n || 0) * 10) / 10) + '%'; }
  function repTop(obj, key, n) { return Object.keys(obj).map(function (k) { return { label: k, v: obj[k][key] || 0, o: obj[k] }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, n || 999); }
  function kpi(label, value, sub, accent) { return '<div class="kpi' + (accent ? ' accent' : '') + '"><div class="k">' + esc(label) + '</div><div class="v">' + value + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>'; }
  function secCard(title, inner) { return '<div class="card"><div class="sec-title">' + title + '</div>' + inner + '</div>'; }
  function barRows(items, fmt) { var mx = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1])); return items.length ? items.map(function (i) { var w = mx ? Math.round(i.v / mx * 100) : 0; return '<div class="mbar"><span class="lbl" title="' + esc(i.label) + '">' + esc(i.label) + '</span><span class="track"><span style="width:' + w + '%"></span></span><span class="val">' + fmt(i.v) + '</span></div>'; }).join('') : '<p class="empty">אין נתונים</p>'; }
  function rankRows(items, fmt, subFmt) { return items.length ? items.map(function (i, idx) { return '<div class="rk' + (idx < 3 ? ' top' + (idx + 1) : '') + '"><span class="n">' + (idx + 1) + '</span><span class="nm">' + esc(i.label) + (subFmt ? ' <span class="mt">' + subFmt(i) + '</span>' : '') + '</span><span class="amt">' + fmt(i.v) + '</span></div>'; }).join('') : '<p class="empty">אין נתונים</p>'; }
  function repTable(headers, rows) { return '<div class="table-scroll"><table><thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + (rows || '<tr><td class="empty" colspan="' + headers.length + '">אין נתונים</td></tr>') + '</tbody></table></div>'; }

  function renderReports() {
    loading();
    Promise.all([
      db.from('leads').select('id,name,status,source,created_at,first_response_at,assigned_to,brand,utm_campaign,utm_source,utm_content,marketing_company,city'),
      db.from('appointments').select('status'),
      db.from('events').select('type,session_id'),
      db.from('tasks').select('done'),
      db.from('profiles').select('user_id,full_name'),
      db.from('deals').select('*'),
      db.from('payments').select('amount,kind,deal_id')
    ]).then(function (res) {
      var leads = res[0].data || [], appts = res[1].data || [], events = res[2].data || [], tasks = res[3].data || [];
      var prof = {}; (res[4].data || []).forEach(function (p) { prof[p.user_id] = p.full_name; });
      var allDeals = res[5].data || [], pays = (res[6] && res[6].data) || [];
      var ST = window.C2B_STATUSES || [], bdg = window.C2B_badge || function (k) { return k; };
      var leadById = {}; leads.forEach(function (l) { leadById[l.id] = l; });

      // ---- lead-side aggregates ----
      var by = {}; ST.forEach(function (s) { by[s.k] = 0; });
      leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var wonL = by.won || 0, lostL = by.lost || 0;
      var pv = events.filter(function (e) { return e.type === 'pageview'; }).length;
      var sess = {}; events.forEach(function (e) { if (e.session_id) sess[e.session_id] = 1; });
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;

      // ---- deal-side aggregates ----
      var deals = allDeals.filter(function (d) { return d.status !== 'cancelled'; });
      var cancelled = allDeals.length - deals.length;
      function isDone(d) { return d.status === 'ordered' || !!d.signature; }
      var doneDeals = deals.filter(isDone);
      var revenue = deals.reduce(function (a, d) { return a + (+d.total || 0); }, 0);
      var profit = deals.reduce(function (a, d) { return a + (+d.commission || 0); }, 0);
      var doneProfit = doneDeals.reduce(function (a, d) { return a + (+d.commission || 0); }, 0);
      var collected = pays.filter(function (p) { return p.kind !== 'invoice'; }).reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
      var avgDeal = deals.length ? revenue / deals.length : 0;
      var avgProfit = doneDeals.length ? doneProfit / doneDeals.length : 0;   // avg over completed deals only (consistent numerator/denominator)
      var closeRate = leads.length ? doneDeals.length / leads.length * 100 : 0;
      // time-to-close (lead → deal) for done deals
      var ttc = doneDeals.map(function (d) { var l = leadById[d.lead_id]; return l && l.created_at ? (new Date(d.created_at) - new Date(l.created_at)) / 86400000 : null; }).filter(function (x) { return x != null && x >= 0; });
      var avgTtc = ttc.length ? (ttc.reduce(function (a, b) { return a + b; }, 0) / ttc.length) : 0;
      // financing / trade-in quality
      var finCount = deals.filter(function (d) { return d.financing && (+d.financing.amount > 0 || d.financing.status); }).length;
      var tiDeals = deals.filter(function (d) { return d.tradein && d.tradein.make; });
      var tiBuys = tiDeals.map(function (d) { return +d.tradein.buy || 0; }).filter(function (x) { return x > 0; });
      var avgTi = tiBuys.length ? tiBuys.reduce(function (a, b) { return a + b; }, 0) / tiBuys.length : 0;
      var discs = deals.map(function (d) { return +d.discount_amt || 0; });
      var avgDisc = discs.length ? discs.reduce(function (a, b) { return a + b; }, 0) / discs.length : 0;

      // dimensions
      var byBrand = {}, byAgent = {}, byMaker = {}, byModel = {}, byStage = {}, bySource = {}, byCompany = {}, byCampaign = {}, byMonth = {};
      function bump(map, k, f) { if (!k) k = '—'; map[k] = map[k] || { count: 0, revenue: 0, profit: 0, done: 0, leads: 0, values: [] }; f(map[k]); }
      deals.forEach(function (d) {
        var l = leadById[d.lead_id] || {};
        var brand = d.brand || l.brand || 'ללא מותג';
        var agent = (d.salesperson && d.salesperson.trim()) || prof[l.assigned_to] || 'לא שויך';
        var maker = d.car_make || '—';
        var model = ((d.car_make || '') + ' ' + (d.car_model || '')).trim() || '—';
        var company = d.brand || l.marketing_company || 'ללא';
        var mk = new Date(d.created_at); var mkey = mk.getFullYear() * 12 + mk.getMonth();
        var rev = +d.total || 0, pf = +d.commission || 0, dn = isDone(d) ? 1 : 0;
        bump(byBrand, brand, function (o) { o.count++; o.revenue += rev; o.profit += pf; o.done += dn; });
        bump(byAgent, agent, function (o) { o.count++; o.revenue += rev; o.profit += pf; o.done += dn; });
        bump(byMaker, maker, function (o) { o.count++; o.revenue += rev; });
        bump(byModel, model, function (o) { o.count++; o.revenue += rev; o.profit += pf; o.done += dn; o.values.push({ v: rev, disc: +d.discount_amt || 0, maker: maker }); });
        bump(byCompany, company, function (o) { o.revenue += rev; o.count++; });
        byStage[d.stage || 'initial'] = (byStage[d.stage || 'initial'] || 0) + 1;
        byMonth[mkey] = byMonth[mkey] || { revenue: 0, profit: 0, count: 0, done: 0, key: mkey };
        byMonth[mkey].revenue += rev; byMonth[mkey].profit += pf; byMonth[mkey].count++; byMonth[mkey].done += dn;
      });
      // lead-driven agent leads count + source/campaign
      leads.forEach(function (l) {
        var agent = prof[l.assigned_to] || 'לא שויך';
        bump(byAgent, agent, function (o) { o.leads++; });
        var s = l.source || 'לא ידוע'; bump(bySource, s, function (o) { o.leads++; if (l.status === 'won') o.done++; });
        var camp = l.utm_campaign || l.marketing_company; if (camp) bump(byCampaign, camp, function (o) { o.leads++; if (l.status === 'won') o.done++; });
      });
      // attribute deal revenue back to source / campaign
      deals.forEach(function (d) { var l = leadById[d.lead_id] || {}; var s = l.source || 'לא ידוע'; bump(bySource, s, function (o) { o.revenue += (+d.total || 0); o.count++; }); var camp = l.utm_campaign || l.marketing_company; if (camp) bump(byCampaign, camp, function (o) { o.revenue += (+d.total || 0); o.count++; }); });

      // monthly series (chronological, last 12 with data)
      var months = Object.keys(byMonth).map(Number).sort(function (a, b) { return a - b; }).slice(-12).map(function (k) { var o = byMonth[k]; o.label = HEB_MONTHS[k % 12] + ' ' + Math.floor(k / 12); return o; });

      // ---------- MANAGER (executive) ----------
      var mgrProfitMonths = barRows(months.map(function (m) { return { label: m.label, v: m.profit }; }), M);
      var mgrTopAgents = rankRows(repTop(byAgent, 'profit', 5), M, function (i) { return i.o.done + ' עסקאות'; });
      var mgrTopBrands = rankRows(repTop(byBrand, 'profit', 5), M, function (i) { return i.o.count + ' עסקאות'; });
      var managerPanel =
        '<div class="cards">' +
          kpi('רווחיות כוללת', M(profit), 'סכום עמלות/רווח מכל העסקאות', true) +
          kpi('רווח ממוצע לעסקה', M(avgProfit), doneDeals.length + ' עסקאות שהושלמו') +
          kpi('סה״כ עסקאות', deals.length, cancelled + ' בוטלו') +
          kpi('נגבה בפועל', M(collected), 'מתוך ' + M(revenue) + ' שווי עסקאות') +
        '</div>' +
        (profit === 0 ? '<div class="sec-note">💡 טיפ: כדי שהרווחיות תשקף את המציאות, ודאו שדה <b>עמלת סוכן</b> מלא בעסקאות (מתמלא אוטומטית מהמלאי בבחירת רכב).</div>' : '') +
        '<div class="rep-grid">' +
          secCard('📈 רווחיות לפי חודש', mgrProfitMonths) +
          secCard('🏆 הנציגים המובילים ברווחיות', mgrTopAgents) +
          secCard('🚗 המותגים המובילים ברווחיות', mgrTopBrands) +
          secCard('💰 תמונת מצב שיווק', '<div class="cards" style="margin:0">' + kpi('הכנסות מעסקאות', M(revenue)) + kpi('הוצאות שיווק', M(0), 'יתחבר עם Facebook Ads') + kpi('דלתא (רווח מול הוצאה)', M(revenue), null, true) + '</div>') +
        '</div>';

      // ---------- SALES — sub-tabs ----------
      // overview
      var salesOverview =
        '<div class="cards">' +
          kpi('סה״כ לידים', leads.length.toLocaleString('en-US'), null, true) +
          kpi('סה״כ עסקאות', deals.length) +
          kpi('עסקאות שהושלמו', doneDeals.length) +
          kpi('אחוז סגירה', P1(closeRate), doneDeals.length + ' / ' + leads.length + ' לידים') +
          kpi('רווח עסקה ממוצע', M(avgProfit)) +
          kpi('זמן ממוצע לסגירה', (Math.round(avgTtc * 10) / 10) + ' ימים') +
        '</div>' +
        '<div class="rep-grid">' +
          secCard('💵 הכנסות לפי חודש', barRows(months.map(function (m) { return { label: m.label, v: m.revenue }; }), M)) +
          secCard('📊 עסקאות לפי חודש', barRows(months.map(function (m) { return { label: m.label, v: m.count }; }), function (v) { return v; })) +
          secCard('🔀 עסקאות לפי שלב', barRows(Object.keys(byStage).map(function (k) { var sd = (window.C2B_stageDef && window.C2B_stageDef(k)) || { label: k }; return { label: sd.label || k, v: byStage[k] }; }).sort(function (a, b) { return b.v - a.v; }), function (v) { return v; })) +
          secCard('🏢 הכנסות לפי חברה/מותג', barRows(repTop(byCompany, 'revenue', 10), M)) +
          secCard('📥 לידים לפי מקור', barRows(repTop(bySource, 'leads', 12), function (v) { return v; })) +
        '</div>';
      // trends
      var salesTrends =
        '<div class="cards">' + kpi('סה״כ הכנסות', M(revenue), null, true) + kpi('סה״כ רווחיות', M(profit)) + kpi('עסקאות שהושלמו', doneDeals.length) + kpi('זמן ממוצע לסגירה', (Math.round(avgTtc * 10) / 10) + ' ימים') + '</div>' +
        '<div class="rep-grid">' +
          secCard('📈 הכנסות לפי חודש', barRows(months.map(function (m) { return { label: m.label, v: m.revenue }; }), M)) +
          secCard('💎 רווחיות לפי חודש', barRows(months.map(function (m) { return { label: m.label, v: m.profit }; }), M)) +
          secCard('✅ עסקאות שהושלמו לפי חודש', barRows(months.map(function (m) { return { label: m.label, v: m.done }; }), function (v) { return v; })) +
        '</div>';
      // agents
      var agentRows = repTop(byAgent, 'revenue', 200).map(function (i) { var o = i.o; var cr = o.leads ? Math.round(o.done / o.leads * 100) : 0; return '<tr><td><b>' + esc(i.label) + '</b></td><td>' + o.leads + '</td><td>' + o.done + '</td><td>' + M(o.revenue) + '</td><td style="color:var(--ok);font-weight:700">' + M(o.profit) + '</td><td>' + cr + '%</td></tr>'; }).join('');
      var salesAgents =
        secCard('👥 עסקאות והכנסות לפי מותג', barRows(repTop(byBrand, 'revenue', 12), M)) +
        secCard('🧑‍💼 ביצועי נציגים', repTable(['שם נציג', 'לידים', 'עסקאות שהושלמו', 'סה״כ הכנסות', 'רווחיות', 'אחוז סגירה'], agentRows));
      // cars
      var topModel = repTop(byModel, 'done', 1)[0] || repTop(byModel, 'count', 1)[0];
      var makerRows = repTop(byModel, 'revenue', 200).map(function (i) { var o = i.o; var av = o.values.length ? o.values.reduce(function (a, x) { return a + x.v; }, 0) / o.values.length : 0; var ad = o.values.length ? o.values.reduce(function (a, x) { return a + x.disc; }, 0) / o.values.length : 0; var mkr = o.values[0] ? o.values[0].maker : '—'; return '<tr><td>' + esc(mkr) + '</td><td><b>' + esc(i.label) + '</b></td><td>' + o.done + '</td><td>' + M(av) + '</td><td>' + M(ad) + '</td><td>' + M(o.revenue) + '</td><td style="color:var(--ok)">' + M(o.profit) + '</td></tr>'; }).join('');
      var salesCars =
        '<div class="cards">' + kpi('עסקאות שהושלמו', doneDeals.length, null, true) + kpi('הרכב הכי נמכר', topModel ? esc(topModel.label) : '—', topModel ? topModel.o.done + ' עסקאות' : '') + kpi('סכום טרייד-אין ממוצע', M(avgTi), tiDeals.length + ' עסקאות עם טרייד-אין') + '</div>' +
        '<div class="rep-grid">' +
          secCard('🚙 הכנסות לפי דגם', barRows(repTop(byModel, 'revenue', 10), M)) +
          secCard('🏭 עסקאות לפי יצרן', barRows(repTop(byMaker, 'count', 12), function (v) { return v; })) +
        '</div>' +
        secCard('📋 פירוט יצרן / דגם', repTable(['יצרן', 'דגם', 'עסקאות שהושלמו', 'ערך עסקה ממוצע', 'הנחה ממוצעת', 'סה״כ הכנסות', 'רווחיות'], makerRows));
      // quality
      var discBuckets = [{ l: '0%', a: 0, b: 0.0001 }, { l: '1-5%', a: 0.0001, b: 5 }, { l: '5-10%', a: 5, b: 10 }, { l: '10-15%', a: 10, b: 15 }, { l: '15-20%', a: 15, b: 20 }, { l: '20%+', a: 20, b: 1e9 }];
      var discDist = discBuckets.map(function (bk) { var c = deals.filter(function (d) { var pct = +d.discount_pct || (d.total ? (+d.discount_amt || 0) / (+d.total + (+d.discount_amt || 0)) * 100 : 0); return pct >= bk.a && pct < bk.b; }).length; return { label: bk.l, v: c }; });
      var finTracks = {}; deals.forEach(function (d) { if (d.financing && (d.financing.track || d.financing.status)) { var t = d.financing.track || d.financing.status || 'אחר'; finTracks[t] = (finTracks[t] || 0) + 1; } });
      var salesQuality =
        '<div class="cards">' + kpi('הנחה ממוצעת', M(avgDisc)) + kpi('אחוז מימון', P1(deals.length ? finCount / deals.length * 100 : 0), finCount + ' עסקאות במימון') + kpi('אחוז טרייד-אין', P1(deals.length ? tiDeals.length / deals.length * 100 : 0)) + kpi('סכום טרייד-אין ממוצע', M(avgTi)) + '</div>' +
        '<div class="rep-grid">' +
          secCard('🏷️ התפלגות עסקאות לפי טווח הנחה', barRows(discDist, function (v) { return v; })) +
          secCard('🏦 פילוח לפי סוג עסקת מימון', barRows(Object.keys(finTracks).map(function (k) { return { label: k, v: finTracks[k] }; }).sort(function (a, b) { return b.v - a.v; }), function (v) { return v; })) +
        '</div>';
      // targets
      var tgtRows = repTop(byAgent, 'revenue', 200).map(function (i) { var o = i.o; return '<tr><td><b>' + esc(i.label) + '</b></td><td>' + o.done + '</td><td class="muted">—</td><td class="muted">—</td><td>' + M(o.revenue) + '</td><td class="muted">—</td><td class="muted">—</td><td style="color:var(--ok)">' + M(o.profit) + '</td><td class="muted">—</td><td class="muted">—</td></tr>'; }).join('');
      var salesTargets =
        '<div class="cards">' + kpi('עסקאות בפועל', doneDeals.length) + kpi('הכנסות בפועל', M(revenue), null, true) + kpi('רווחיות בפועל', M(profit)) + '</div>' +
        '<div class="sec-note">🎯 יעדים לנציג טרם הוגדרו. אפשר להוסיף טבלת <b>יעדי נציג</b> (עסקאות/הכנסות/רווחיות) ואז עמודות ה-% יתמלאו אוטומטית. כרגע מוצגים הביצועים בפועל.</div>' +
        secCard('📊 ביצועים לפי נציג', repTable(['שם נציג', 'עסקאות', 'יעד עסקאות', '% עמידה', 'הכנסות', 'יעד הכנסות', '% עמידה', 'רווחיות', 'יעד רווחיות', '% עמידה'], tgtRows));

      var salesPanels = { overview: salesOverview, trends: salesTrends, agents: salesAgents, cars: salesCars, quality: salesQuality, targets: salesTargets };
      var salesSubs = [['overview', 'סקירה כללית'], ['trends', 'מגמות מכירות'], ['agents', 'חברה ונציגים'], ['cars', 'ניתוח רכבים'], ['quality', 'איכות עסקאות'], ['targets', 'יעדים']];
      function salesNav() { return '<nav class="tabs" id="repSalesTabs" style="margin-bottom:14px;flex-wrap:wrap">' + salesSubs.map(function (s) { return '<button data-ssub="' + s[0] + '"' + (salesSub === s[0] ? ' class="active"' : '') + '>' + s[1] + '</button>'; }).join('') + '</nav>'; }
      var salesPanel = salesNav() + '<div id="repSalesPanel">' + salesPanels[salesSub] + '</div>';

      // ---------- MARKETING ----------
      var netByBrand = repTop(byBrand, 'revenue', 5);
      var campRows = repTop(byCampaign, 'revenue', 60).map(function (i) { var o = i.o; var cr = o.leads ? Math.round(o.done / o.leads * 100) : 0; return '<tr><td><b>' + esc(i.label) + '</b></td><td>' + o.leads + '</td><td>' + (o.count || 0) + '</td><td>' + o.done + '</td><td>' + M(o.revenue) + '</td><td>' + cr + '%</td><td class="muted">—</td><td class="muted">—</td></tr>'; }).join('');
      var marketingPanel =
        '<div class="cards">' +
          kpi('הכנסה (מעסקאות)', M(revenue), 'כל ההיסטוריה ב-CRM', true) +
          kpi('הוצאה', M(0), 'יתחבר עם Facebook Ads') +
          kpi('נטו', M(revenue), 'הכנסה פחות הוצאה') +
          kpi('ROAS', '—', 'הכנסה / הוצאה') +
          kpi('אחוז המרה', P1(closeRate), doneDeals.length + ' סגירות') +
          kpi('לידים', leads.length.toLocaleString('en-US'), wonL + ' נסגרו') +
          kpi('עלות לפנייה (CPL)', '—', 'דורש חיבור הוצאות') +
          kpi('פגישות שנקבעו', appts.length) +
        '</div>' +
        '<div class="sec-note">📡 מדדי הפרסום (הוצאה, ROAS, CPL, CTR, CPC, CPM, קמפיינים פעילים) יתמלאו לאחר חיבור <b>Facebook Ads / Meta</b>. בינתיים מוצגים כל הנתונים מצד ה-CRM: הכנסות, לידים, המרות וייחוס לפי קמפיין.</div>' +
        '<div class="rep-grid">' +
          secCard('📣 לידים לפי מקור', barRows(repTop(bySource, 'leads', 12), function (v) { return v; })) +
          secCard('🏆 חמשת המותגים המובילים בהכנסות', rankRows(netByBrand, M, function (i) { return i.o.count + ' עסקאות'; })) +
          secCard('🌐 צפיות / מבקרים באתר', '<div class="cards" style="margin:0">' + kpi('צפיות בעמודים', pv.toLocaleString('en-US')) + kpi('מבקרים ייחודיים', Object.keys(sess).length.toLocaleString('en-US')) + '</div>') +
        '</div>' +
        secCard('📋 ביצועי קמפיינים (ייחוס מה-CRM)', repTable(['קמפיין', 'לידים', 'עסקאות', 'נסגרו', 'הכנסה', 'המרה', 'הוצאה', 'CPL'], campRows));

      var panels = { manager: managerPanel, sales: salesPanel, marketing: marketingPanel };
      function tab(k, label) { return '<button data-rep="' + k + '"' + (repTab === k ? ' class="active"' : '') + '>' + label + '</button>'; }
      view('<h2 style="margin:0 0 4px">📊 דוחות וניתוח</h2><p class="muted" style="margin:0 0 16px;font-size:13px">שלוש תצוגות: מנהל · מכירות · שיווק — מבוססות על נתוני ה-CRM שלכם</p>' +
        '<nav class="tabs" id="repTabs">' + tab('manager', '👔 מנהל') + tab('sales', '💼 מכירות') + tab('marketing', '📣 שיווק') + '</nav>' +
        '<div id="repPanel">' + panels[repTab] + '</div>');
      $('repTabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-rep]'); if (!b) return; repTab = b.dataset.rep; $('repTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x.dataset.rep === repTab); }); $('repPanel').innerHTML = panels[repTab]; });
      // sales sub-tab switching (delegated on the persistent repPanel)
      $('repPanel').addEventListener('click', function (e) { var b = e.target.closest('button[data-ssub]'); if (!b) return; salesSub = b.dataset.ssub; var nav = $('repSalesTabs'); if (nav) nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x.dataset.ssub === salesSub); }); var sp = $('repSalesPanel'); if (sp) sp.innerHTML = salesPanels[salesSub]; });
    }).catch(function (e) { errBox(e.message || e); });
  }
  var repTab = 'manager', salesSub = 'overview';

  // ---------- USERS & ROLES (admin only) ----------
  var ROLES = [['admin', 'מנהל מערכת'], ['sales', 'סוכן מכירות'], ['files', 'מנהלת תיקי לקוחות'], ['accounting', 'מנהלת חשבונות']];
  function roleName(k) { var x = ROLES.filter(function (r) { return r[0] === k; })[0]; return x ? x[1] : k; }
  function viewsLabel(v) { if (!v || !v.length) return '<span class="muted">ברירת מחדל</span>'; return v.map(function (k) { var g = GRANTABLE_VIEWS.filter(function (x) { return x[0] === k; })[0]; return '<span class="tag" style="margin:2px">' + esc(g ? g[1] : k) + '</span>'; }).join(''); }
  function viewChecks(idPrefix, checked) {
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + GRANTABLE_VIEWS.map(function (g) {
      return '<label style="display:flex;gap:5px;align-items:center;font-size:13px"><input type="checkbox" data-' + idPrefix + '="' + g[0] + '"' + (checked.indexOf(g[0]) >= 0 ? ' checked' : '') + '> ' + g[1] + '</label>';
    }).join('') + '</div>';
  }
  function renderUsers() {
    loading();
    db.from('profiles').select('*').order('created_at', { ascending: true }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var ps = r.data || [];
      var rows = ps.map(function (p) {
        var reset = p.email ? '<button class="btn btn-ghost btn-sm" data-reset="' + esc(p.email) + '">🔑 אפס סיסמה</button>' : '<span class="muted" style="font-size:12px">אין אימייל</span>';
        return '<tr><td><span class="avatar" style="margin-inline-end:8px">' + esc((p.full_name || '?').charAt(0)) + '</span>' + esc(p.full_name) + (p.email ? '<div class="muted" style="font-size:11px">' + esc(p.email) + '</div>' : '') + '</td>' +
          '<td><select class="inp" data-role="' + p.user_id + '">' + ROLES.map(function (x) { return '<option value="' + x[0] + '"' + (p.role === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></td>' +
          '<td style="white-space:normal;max-width:260px">' + viewsLabel(p.views) + ' <button class="btn btn-ghost btn-sm" data-editviews="' + p.user_id + '">✏️</button><div class="hidden" id="ev_' + p.user_id + '"></div></td>' +
          '<td><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-active="' + p.user_id + '"' + (p.active ? ' checked' : '') + '> פעיל</label></td>' +
          '<td>' + reset + '</td></tr>';
      }).join('');
      var addForm = '<div class="card"><h3>➕ הוספת משתמש</h3><p class="muted" style="font-size:13px">נשלח אליו מייל עם קישור, אימייל וסיסמה זמנית — הוא נכנס מיד ויכול לאפס סיסמה בעצמו.</p>' +
        '<div class="grid2"><div class="field" style="margin:0"><label>שם מלא</label><input class="inp" id="nuName" placeholder="למשל: דנה כהן"></div>' +
        '<div class="field" style="margin:0"><label>אימייל</label><input class="inp" id="nuEmail" type="email" placeholder="name@email.com"></div></div>' +
        '<div class="field" style="margin-top:12px"><label>תפקיד</label><select class="inp" id="nuRole">' + ROLES.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select></div>' +
        '<label style="font-size:13px;color:var(--muted);margin-top:12px;display:block">תצוגות שהמשתמש יראה (מוגדר לפי התפקיד — אפשר להוסיף/להוריד):</label><div id="nuViews">' + viewChecks('nv', DEFAULT_VIEWS.sales) + '</div>' +
        '<div style="margin-top:14px"><button class="btn" id="nuCreate">צור משתמש ושלח הזמנה</button> <span id="nuMsg" style="font-size:13px;margin-inline-start:10px"></span></div><div id="nuResult" style="margin-top:12px"></div></div>';
      view('<h2 style="margin:0 0 14px">משתמשים והרשאות</h2>' + addForm +
        '<div class="card"><h3>משתמשים קיימים (' + ps.length + ')</h3>' +
        '<div class="table-scroll"><table><thead><tr><th>שם</th><th>תפקיד</th><th>תצוגות מותרות</th><th>פעיל</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="empty">אין משתמשים</td></tr>') + '</tbody></table></div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:10px">מנהל מערכת רואה הכל. שאר המשתמשים רואים רק את הלידים <b>שהוקצו להם</b> ואת התצוגות שסומנו כאן.</div></div>');

      // add-user: role change → reset the view checkboxes to that role's defaults
      $('nuRole').addEventListener('change', function () { $('nuViews').innerHTML = viewChecks('nv', DEFAULT_VIEWS[this.value] || ['dashboard']); });
      $('nuCreate').addEventListener('click', function () {
        var name = $('nuName').value.trim(), email = $('nuEmail').value.trim(), role = $('nuRole').value;
        var views = []; $('nuViews').querySelectorAll('input[data-nv]:checked').forEach(function (c) { views.push(c.dataset.nv); });
        var msg = $('nuMsg');
        if (!email || email.indexOf('@') < 0) { msg.style.color = 'var(--danger)'; msg.textContent = 'הזינו אימייל תקין'; return; }
        msg.style.color = 'var(--muted)'; msg.textContent = 'יוצר…'; this.disabled = true;
        var btn = this;
        db.rpc('admin_create_user', { p_email: email, p_name: name || email, p_role: role, p_views: views }).then(function (res) {
          btn.disabled = false;
          if (res.error) { msg.style.color = 'var(--danger)'; msg.textContent = 'שגיאה: ' + res.error.message; return; }
          var d = res.data || {};
          msg.textContent = '';
          // always show the credentials (works even if email is blocked)
          $('nuResult').innerHTML = '<div class="card" style="box-shadow:none;border:1px solid var(--ok);background:rgba(22,163,74,.06);margin:0">' +
            '<b style="color:var(--ok)">✅ המשתמש נוצר.</b> נשלח מייל עם הפרטים. אם לא הגיע — מסרו ידנית:' +
            '<div style="margin-top:8px;font-family:monospace;font-size:13px;background:var(--surface);padding:10px;border-radius:8px">אימייל: ' + esc(d.email || email) + '<br>סיסמה זמנית: <b>' + esc(d.password || '') + '</b></div>' +
            '<div id="nuDiag" class="muted" style="font-size:12.5px;margin-top:8px">בודק סטטוס יצירה ושליחה…</div></div>';
          $('nuName').value = ''; $('nuEmail').value = '';
          diagnoseInvite(d);
        });
      });

      $('view').querySelectorAll('select[data-role]').forEach(function (s) { s.addEventListener('change', function () { db.from('profiles').update({ role: s.value }).eq('user_id', s.dataset.role).then(function (u) { if (u.error) alert('שגיאה: ' + u.error.message); }); }); });
      $('view').querySelectorAll('input[data-active]').forEach(function (c) { c.addEventListener('change', function () { db.from('profiles').update({ active: c.checked }).eq('user_id', c.dataset.active); }); });
      // edit views inline
      $('view').querySelectorAll('button[data-editviews]').forEach(function (b) {
        b.addEventListener('click', function () {
          var uid = b.dataset.editviews, box = $('ev_' + uid);
          var cur = (ps.filter(function (p) { return p.user_id === uid; })[0] || {}).views || [];
          if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
          box.classList.remove('hidden');
          box.innerHTML = viewChecks('vw_' + uid, cur) + '<button class="btn btn-sm" data-savev="' + uid + '" style="margin-top:8px">שמור תצוגות</button>';
          box.querySelector('[data-savev]').addEventListener('click', function () {
            var v = []; box.querySelectorAll('input[data-vw_' + uid + ']:checked').forEach(function (c) { v.push(c.getAttribute('data-vw_' + uid)); });
            db.from('profiles').update({ views: v }).eq('user_id', uid).then(function (u) { if (u.error) alert('שגיאה: ' + u.error.message); else renderUsers(); });
          });
        });
      });
      // password reset for a user
      $('view').querySelectorAll('button[data-reset]').forEach(function (b) {
        b.addEventListener('click', function () {
          var email = b.dataset.reset, redirect = location.href.replace(/[^/]*$/, 'reset.html');
          db.auth.resetPasswordForEmail(email, { redirectTo: redirect }).then(function (r) { alert(r.error ? ('שגיאה: ' + r.error.message) : ('נשלח מייל לאיפוס סיסמה אל ' + email)); });
        });
      });
    });
  }

  // ---------- AI ASSISTANT (managers) ----------
  var SUGGESTIONS = [
    'אילו לידים כדאי לתעדף השבוע ולמה?',
    'נתח את אחוז ההמרה ומה חוסם אותנו',
    'מהם המקורות הכי משתלמים ואיפה לבזבז פחות?',
    'סכם את מצב הכספים והגבייה הפתוחה',
    'תן לי סיכום מנהלים של השבוע ו-3 פעולות'
  ];
  function renderAI() {
    loading();
    Promise.all([
      db.from('leads').select('status,source,created_at,first_response_at,city,brand'),
      db.from('deals').select('total,commission,stage,status'),
      db.from('payments').select('amount,kind'),
      db.from('tasks').select('done,due_at'),
      db.from('appointments').select('status')
    ]).then(function (res) {
      var leads = res[0].data || [], deals = res[1].data || [], pays = res[2].data || [], tasks = res[3].data || [], appts = res[4].data || [];
      var ST = window.C2B_STATUSES || [];
      var by = {}; leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var won = by.won || 0, lost = by.lost || 0, conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
      var src = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; src[s] = src[s] || { t: 0, w: 0 }; src[s].t++; if (l.status === 'won') src[s].w++; });
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
      var revenue = deals.reduce(function (a, d) { return a + (+d.total || 0); }, 0);
      var commission = deals.reduce(function (a, d) { return a + (+d.commission || 0); }, 0);
      var collected = pays.filter(function (p) { return p.kind !== 'invoice'; }).reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
      var stageC = {}; deals.forEach(function (d) { stageC[d.stage || 'initial'] = (stageC[d.stage || 'initial'] || 0) + 1; });
      // compact Hebrew data summary the model reasons over
      var ctx = 'נתוני Car2Buy (' + new Date().toLocaleDateString('he-IL') + '):\n' +
        '- לידים: ' + leads.length + ' סה"כ. פילוח סטטוס: ' + ST.map(function (s) { return s.label + '=' + (by[s.k] || 0); }).join(', ') + '.\n' +
        '- אחוז סגירה: ' + conv + '% (נסגרו ' + won + ', אבודים ' + lost + '). זמן תגובה ממוצע: ' + (avgRt ? avgRt + ' דק\'' : 'לא ידוע') + '.\n' +
        '- לידים לפי מקור: ' + Object.keys(src).map(function (s) { return s + ' (' + src[s].t + ' לידים, ' + src[s].w + ' עסקאות)'; }).join('; ') + '.\n' +
        '- עסקאות: ' + deals.length + ', שווי כולל ' + nis(revenue) + ', עמלות סוכן ' + nis(commission) + ', נגבה ' + nis(collected) + ', יתרה פתוחה ' + nis(revenue - collected) + '.\n' +
        '- שלבי תיקים: ' + Object.keys(stageC).map(function (k) { return k + '=' + stageC[k]; }).join(', ') + '.\n' +
        '- משימות פתוחות: ' + tasks.filter(function (t) { return !t.done; }).length + '. פגישות: ' + appts.length + '.';
      view('<div class="card"><h3>🤖 עוזר AI למנהלים</h3><p class="muted" style="font-size:13px">שאל שאלה על העסק — המערכת מנתחת את נתוני ה-CRM (לידים, המרה, מקורות, כספים) ומחזירה תובנות והמלצות. הנתונים נשלחים ל-Claude; מפתח ה-API שמור במסד ואינו נחשף.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' + SUGGESTIONS.map(function (s) { return '<button class="btn btn-ghost btn-sm" data-sug="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>' +
        '<textarea class="inp" id="aiQ" rows="3" style="width:100%" placeholder="כתוב כאן שאלה…"></textarea>' +
        '<div style="margin-top:10px"><button class="btn" id="aiAsk">שאל את ה-AI</button> <span class="muted" id="aiState" style="font-size:13px;margin-inline-start:10px"></span></div>' +
        '<div id="aiAns" style="margin-top:16px"></div>' +
        '<details style="margin-top:16px"><summary class="muted" style="font-size:12px;cursor:pointer">הנתונים שנשלחים למודל</summary><pre style="white-space:pre-wrap;font-size:12px;color:var(--muted);margin-top:8px">' + esc(ctx) + '</pre></details></div>');
      $('view').querySelectorAll('[data-sug]').forEach(function (b) { b.addEventListener('click', function () { $('aiQ').value = b.dataset.sug; $('aiAsk').click(); }); });
      $('aiAsk').addEventListener('click', function () { askAI(ctx); });
    }).catch(function (e) { errBox(e.message || e); });
  }
  function askAI(ctx) {
    var q = ($('aiQ').value || '').trim(); if (!q) return;
    var state = $('aiState'), ans = $('aiAns'), btn = $('aiAsk');
    state.style.color = 'var(--muted)'; state.textContent = 'חושב… (עד ~30 שניות)'; ans.innerHTML = ''; btn.disabled = true;
    db.functions.invoke('ai-assistant', { body: { prompt: ctx + '\n\nשאלת המנהל: ' + q } }).then(function (r) {
      btn.disabled = false; state.textContent = '';
      var d = r.data || {};
      if (r.error || d.error) {
        state.style.color = 'var(--danger)';
        var msg = (d && d.error) || (r.error && r.error.message) || 'שגיאה';
        state.textContent = /unauthorized/i.test(msg) ? 'נדרשת התחברות מחדש.' : /ANTHROPIC_API_KEY/.test(msg) ? 'חסר מפתח Claude — יש להגדיר את הפונקציה (ראה הנחיות).' : 'שגיאה: ' + msg;
        return;
      }
      ans.innerHTML = '<div class="card" style="box-shadow:none;border:1px solid var(--line);background:var(--surface-2)"><div style="white-space:pre-wrap;line-height:1.7">' + esc(d.text || 'לא התקבלה תשובה.') + '</div></div>';
    }).catch(function (e) { btn.disabled = false; state.style.color = 'var(--danger)'; state.textContent = 'שגיאת רשת: ' + (e && e.message || e); });
  }

  // after creating a user, poll the real async results so failures aren't silent
  function netParse(c) { try { return typeof c === 'string' ? JSON.parse(c) : c; } catch (e) { return null; } }
  function diagnoseInvite(d) {
    if (!$('nuDiag')) return;
    var createDone = (d.create_req == null), emailDone = (d.email_req == null);
    var createTxt = 'ממתין…', emailTxt = d.emailed ? 'ממתין…' : 'לא נשלח (אין resend_key ב-Vault)';
    var tries = 0;
    function paint() { if ($('nuDiag')) $('nuDiag').innerHTML = 'יצירת משתמש: ' + createTxt + '<br>שליחת מייל: ' + emailTxt; }
    function addRefresh() { var el = $('nuDiag'); if (!el) return; var b = document.createElement('button'); b.className = 'btn btn-ghost btn-sm'; b.style.marginTop = '8px'; b.textContent = 'רענן רשימת משתמשים'; b.addEventListener('click', renderUsers); el.appendChild(document.createElement('br')); el.appendChild(b); }
    paint();
    var poll = setInterval(function () {
      tries++;
      if (tries > 10 || (createDone && emailDone)) { clearInterval(poll); paint(); addRefresh(); return; }
      if (!createDone) db.rpc('admin_net_result', { p_id: d.create_req }).then(function (r) {
        if (r.error || !r.data) return; createDone = true; var b = netParse(r.data.content) || {};
        createTxt = (r.data.status >= 200 && r.data.status < 300) ? '<span style="color:var(--ok)">✔ הצליחה</span>' : '<span style="color:var(--danger)">✖ נכשלה (' + r.data.status + '): ' + esc(b.msg || b.error_description || b.message || b.error || '') + '</span>'; paint();
      });
      if (!emailDone) db.rpc('admin_net_result', { p_id: d.email_req }).then(function (r) {
        if (r.error || !r.data) return; emailDone = true; var b = netParse(r.data.content) || {};
        emailTxt = (r.data.status >= 200 && r.data.status < 300) ? '<span style="color:var(--ok)">✔ נשלח בהצלחה</span>' : '<span style="color:var(--danger)">✖ נכשל (' + r.data.status + '): ' + esc(b.message || b.error || '') + '</span> — כנראה הדומיין ב-Resend לא מאומת'; paint();
      });
    }, 1500);
  }

  // ---------- SETTINGS: managed field lists (admin) ----------
  function renderSettings() {
    loading();
    db.from('field_options').select('*').order('field', { ascending: true }).order('value', { ascending: true }).then(function (r) {
      var opts = (r && r.data) || [], byField = {}, fieldErr = r && r.error;
      LIST_FIELDS.forEach(function (f) { byField[f[0]] = []; });
      opts.forEach(function (o) { (byField[o.field] = byField[o.field] || []).push(o); });
      var warn = fieldErr ? '<div class="card" style="border:1px solid var(--warn);background:rgba(245,158,11,.08)"><b style="color:var(--warn)">⚠️ רשימות השדות לא זמינות</b> — הריצו את <b>field-lists.sql</b> (הרשימות למטה יהיו ריקות עד אז). עורך סרגל הפעולות עובד בכל מקרה.</div>' : '';
      var cards = LIST_FIELDS.map(function (f) {
        var key = f[0], label = f[1];
        var chips = (byField[key] || []).map(function (o) { return '<span class="tag" style="margin:3px">' + esc(o.value) + ' <b data-del="' + o.id + '" style="cursor:pointer;color:var(--danger)">✕</b></span>'; }).join('') || '<span class="muted" style="font-size:13px">אין ערכים עדיין</span>';
        return '<div class="card"><div class="row-between"><h3 style="margin:0">' + esc(label) + '</h3>' + (key === 'brand' ? '<button class="btn btn-ghost btn-sm" id="impBrands">⬇ ייבא מותגים מהקטלוג</button>' : '') + '</div>' +
          '<div style="margin:10px 0;line-height:2.2">' + chips + '</div>' +
          '<div style="display:flex;gap:8px"><input class="inp" data-add="' + key + '" placeholder="ערך חדש…" style="flex:1"><button class="btn btn-sm" data-addbtn="' + key + '">+ הוסף</button></div></div>';
      }).join('');
      view('<h2 style="margin:0 0 6px">הגדרות ורשימות</h2><p class="muted" style="font-size:13px;margin-bottom:12px">ערכי הרשימות שמופיעים כאפשרויות בחירה בשדות (מותג, מקור הגעה, חברת שיווק, utm_source) — בטופס עריכת ליד ובסינון.</p><div style="margin-bottom:16px"><button class="btn btn-sm" id="seedSources">🎯 טען מקורות מומלצים (מצומצם — מקור הגעה + utm_source)</button></div>' + warn + actionEditorCard() + cards);
      bindActionEditor();
      $('view').querySelectorAll('[data-addbtn]').forEach(function (b) {
        b.addEventListener('click', function () {
          var key = b.dataset.addbtn, inp = $('view').querySelector('[data-add="' + key + '"]'), val = (inp.value || '').trim();
          if (!val) return;
          db.from('field_options').insert({ field: key, value: val }).then(function (u) { if (u.error) return alert('שגיאה: ' + u.error.message); loadLists(); renderSettings(); });
        });
      });
      $('view').querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { db.from('field_options').delete().eq('id', b.dataset.del).then(function () { loadLists(); renderSettings(); }); }); });
      if ($('seedSources')) $('seedSources').addEventListener('click', function () {
        if (!confirm('פעולה זו תחליף את הרשימות "מקור הגעה" ו-"utm_source" בערכים מומלצים ומצומצמים.\nהערכים הקיימים בשני השדות האלה יימחקו. להמשיך?')) return;
        // curated, most-relevant sources — Hebrew display sources + technical utm_source values
        var SRC = ['פייסבוק', 'אינסטגרם', 'טיקטוק', 'גוגל', 'וואטסאפ', 'טופס אתר', 'שיחה נכנסת', 'הפניה', 'יד2', 'ManyChat', 'ידני'];
        var UTM = ['facebook', 'instagram', 'tiktok', 'google', 'taboola', 'whatsapp', 'manychat', 'direct', 'referral'];
        var rows = SRC.map(function (v) { return { field: 'source', value: v }; }).concat(UTM.map(function (v) { return { field: 'utm_source', value: v }; }));
        db.from('field_options').delete().in('field', ['source', 'utm_source']).then(function (dr) {
          if (dr.error) return alert('שגיאה במחיקה: ' + dr.error.message);
          db.from('field_options').insert(rows).then(function (ir) {
            if (ir.error) return alert('שגיאה בהוספה: ' + ir.error.message);
            loadLists(); renderSettings();
          });
        });
      });
      if ($('impBrands')) $('impBrands').addEventListener('click', function () {
        fetch('cars.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (cars) {
          var brands = Object.keys((cars || []).reduce(function (a, c) { if (c.brand) a[c.brand] = 1; return a; }, {}));
          var existing = (byField.brand || []).map(function (o) { return o.value; });
          var rows = brands.filter(function (b) { return existing.indexOf(b) < 0; }).map(function (b) { return { field: 'brand', value: b }; });
          if (!rows.length) { alert('כל המותגים כבר קיימים ברשימה.'); return; }
          db.from('field_options').insert(rows).then(function (u) { if (u.error) return alert('שגיאה: ' + u.error.message); loadLists(); renderSettings(); });
        });
      });
    });
  }
  // ---- visual editor for the lead-card action bar (order / rename / show-hide) ----
  function actionEditorCard() {
    var cfg = (window.C2B.getActionCfg && window.C2B.getActionCfg()) || [], meta = {};
    (window.C2B.leadActionsMeta || []).forEach(function (m) { meta[m.k] = m; });
    var rows = cfg.map(function (c, i) {
      var m = meta[c.k] || { icon: '', label: c.k };
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">' +
        '<span style="font-size:18px;width:24px;text-align:center">' + m.icon + '</span>' +
        '<input class="inp ae-label" data-i="' + i + '" value="' + esc(c.label || m.label) + '" style="flex:1">' +
        '<label style="display:flex;gap:5px;align-items:center;font-size:12.5px;white-space:nowrap"><input type="checkbox" class="ae-on" data-i="' + i + '"' + (c.on !== false ? ' checked' : '') + '> מוצג</label>' +
        '<button class="btn btn-ghost btn-sm ae-up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button class="btn btn-ghost btn-sm ae-down" data-i="' + i + '"' + (i === cfg.length - 1 ? ' disabled' : '') + '>↓</button></div>';
    }).join('');
    return '<div class="card"><div class="row-between"><h3 style="margin:0">🎛️ עריכת סרגל הפעולות בכרטיס ליד</h3><button class="btn btn-ghost btn-sm" id="aeReset">↺ שחזר ברירת מחדל</button></div>' +
      '<p class="muted" style="font-size:12.5px;margin:4px 0 10px">סדר מחדש (↑↓), שנה שמות, והצג/הסתר את הכפתורים. השינוי נשמר לדפדפן זה ומשפיע על כרטיס הליד.</p>' + rows + '</div>';
  }
  function bindActionEditor() {
    var cfg = (window.C2B.getActionCfg && window.C2B.getActionCfg()) || [];
    function save() { window.C2B.saveActionCfg && window.C2B.saveActionCfg(cfg); }
    $('view').querySelectorAll('.ae-label').forEach(function (inp) { inp.addEventListener('change', function () { cfg[+inp.dataset.i].label = inp.value.trim(); save(); }); });
    $('view').querySelectorAll('.ae-on').forEach(function (cb) { cb.addEventListener('change', function () { cfg[+cb.dataset.i].on = cb.checked; save(); }); });
    $('view').querySelectorAll('.ae-up').forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.i; if (i <= 0) return; var t = cfg[i - 1]; cfg[i - 1] = cfg[i]; cfg[i] = t; save(); renderSettings(); }); });
    $('view').querySelectorAll('.ae-down').forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.i; if (i >= cfg.length - 1) return; var t = cfg[i + 1]; cfg[i + 1] = cfg[i]; cfg[i] = t; save(); renderSettings(); }); });
    if ($('aeReset')) $('aeReset').addEventListener('click', function () { if (!confirm('לשחזר את סדר ושמות הכפתורים לברירת מחדל?')) return; window.C2B.resetActionCfg && window.C2B.resetActionCfg(); renderSettings(); });
  }

  // ---------- SOON placeholders ----------
  var SOON = {
    quotes: ['📄 הצעות מחיר', 'יצירת הצעות מחיר, שליחה ללקוח ומעקב פתיחה/מענה. חלק מ-Phase 2.'],
    documents: ['✍️ מסמכים והסכמים', 'מילוי אוטומטי של תבנית ההסכם מנתוני הליד, חתימה דיגיטלית בדפדפן ומעקב חתימה. Phase 4.'],
    whatsapp: ['💬 WhatsApp', 'צ\'אט WhatsApp מובנה (הודעות/תמונות/PDF/תבניות) דרך Meta Cloud API. Phase 3.'],
    emails: ['📧 מיילים', 'שליחת מיילים ומעקב, דרך Resend. Phase 2.'],
    sms: ['📱 SMS', 'שליחת SMS עם שם-שולח דרך שער ישראלי. Phase 3.'],
    automations: ['🤖 אוטומציות', 'בונה חוקים ויזואלי: "אם סטטוס X → שלח WhatsApp/מייל/פתח משימה". Phase 2.'],
    reports: ['📈 דוחות', 'דוחות ביצועים מתקדמים וייצוא. Phase 2.'],
    sales: ['👤 אנשי מכירות', 'ניהול משתמשים, שיוך לידים והרשאות. Phase 2.'],
    branches: ['🏢 סניפים', 'ניהול סניפים ושיוך.'],
    settings: ['⚙️ הגדרות', 'הגדרות מערכת, אינטגרציות ומיתוג.']
  };
  function renderSoon(key) {
    var s = SOON[key] || ['בקרוב', ''];
    view('<div class="card" style="text-align:center;padding:60px 24px"><div style="font-size:44px">' + s[0].split(' ')[0] + '</div><h3 style="justify-content:center">' + esc(s[0].replace(/^\S+\s/, '')) + '</h3><p class="muted" style="max-width:520px;margin:0 auto">' + esc(s[1]) + '</p></div>');
  }

  // ---------- CSV export helper (shared) ----------
  window.C2B.exportCsv = function (rows, cols, name) {
    if (!rows.length) { alert('אין נתונים לייצוא'); return; }
    function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
    var csv = cols.join(',') + '\n' + rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name + '-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  };
  window.C2B.refreshBadges = refreshBadges;

  // ---------- boot ----------
  db.auth.getSession().then(function (r) { if (r.data.session) showApp(r.data.session); else showLogin(); });
})();
