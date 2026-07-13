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
  function showApp(session) { $('login').classList.add('hidden'); $('app').classList.remove('hidden'); $('whoami').textContent = session.user.email; refreshBadges(); go('dashboard'); }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); $('loginErr').textContent = '';
    db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value }).then(function (r) {
      if (r.error) { $('loginErr').textContent = 'התחברות נכשלה: ' + r.error.message; return; }
      showApp(r.data.session);
    });
  });
  $('logout').addEventListener('click', function () { db.auth.signOut().then(showLogin); });

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
    setActive(nav, opts.status);
    if (window.innerWidth <= 820) $('side').classList.remove('open');
    if (nav === 'dashboard') return window.C2B_renderDashboard && window.C2B_renderDashboard();
    if (nav === 'leads') return window.C2B_renderLeads && window.C2B_renderLeads(opts.status);
    if (nav === 'files') return window.C2B_renderFiles && window.C2B_renderFiles();
    if (nav === 'cars') return renderCars();
    if (nav === 'appointments') return renderAppointments();
    if (nav === 'tasks') return renderTasks();
    if (nav === 'analytics') return renderAnalytics();
    if (nav === 'reports') return renderReports();
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
    var q = this.value.trim(); clearTimeout(gsT);
    if (q.length < 2) { $('gsres').classList.add('hidden'); return; }
    gsT = setTimeout(function () {
      db.from('leads').select('id,name,phone,car,status').or('name.ilike.%' + q + '%,phone.ilike.%' + q + '%').limit(8).then(function (r) {
        var rows = (r.data || []).map(function (l) { return '<div class="sr" data-lead="' + l.id + '"><b>' + esc(l.name) + '</b> <span class="muted">· ' + esc(l.phone) + (l.car ? ' · ' + esc(l.car) : '') + '</span></div>'; }).join('');
        $('gsres').innerHTML = rows || '<div class="sr muted">אין תוצאות</div>';
        $('gsres').classList.remove('hidden');
        $('gsres').querySelectorAll('.sr[data-lead]').forEach(function (el) { el.addEventListener('click', function () { $('gsres').classList.add('hidden'); $('gsearch').value = ''; window.C2B_openLeadCard(el.dataset.lead); }); });
      });
    }, 250);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) $('gsres').classList.add('hidden'); });

  // ---------- CARS (read-only from the Google Sheet → cars.json) ----------
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LiK--j3BCPnHO4rZQj7N2RetdnExEmwimWTwn7kmWe8/edit';
  function carRows(list) {
    return list.map(function (c) {
      return '<tr><td>' + (c.img ? '<img src="' + esc(c.img) + '" style="width:52px;height:34px;object-fit:cover;border-radius:8px" onerror="this.style.display=\'none\'">' : '') +
        '</td><td>' + esc(c.brand) + '</td><td>' + esc(c.name) + '</td><td class="muted">' + esc(c.trim) + '</td><td>' + nis(c.m) + '</td><td>' + nis(c.p) + '</td></tr>';
    }).join('');
  }
  function renderCars() {
    loading();
    fetch('cars.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (cars) {
      cars = cars || [];
      view('<div class="card"><div class="row-between"><h3>רכבים חדשים (' + cars.length + ')</h3><div><input class="inp" id="cq" placeholder="חיפוש מותג/דגם" style="width:200px"> <a class="btn btn-sm" href="' + SHEET_URL + '" target="_blank" rel="noopener">✎ פתח את הגיליון</a></div></div>' +
        '<p class="muted" style="font-size:13px">מנוהל ב-Google Sheet, מתעדכן אוטומטית (~15 דק\'). להוספה/עריכה — ערוך את הגיליון.</p>' +
        '<div class="table-scroll"><table><thead><tr><th>תמונה</th><th>מותג</th><th>דגם</th><th>גרסה</th><th>החזר</th><th>מחיר</th></tr></thead><tbody id="crows">' + (carRows(cars) || '<tr><td colspan="6" class="empty">אין רכבים</td></tr>') + '</tbody></table></div></div>');
      $('cq').addEventListener('input', function () { var q = this.value.trim().toLowerCase(); $('crows').innerHTML = carRows(cars.filter(function (c) { return ((c.brand || '') + ' ' + (c.name || '')).toLowerCase().indexOf(q) >= 0; })) || '<tr><td colspan="6" class="empty">אין תואמים</td></tr>'; });
    }).catch(function (e) { errBox(e.message || e); });
  }

  // ---------- APPOINTMENTS ----------
  function renderAppointments() {
    loading();
    db.from('appointments').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var rows = (r.data || []).map(function (a) {
        var handled = a.status === 'handled';
        return '<tr><td>' + fmtDateTime(a.created_at) + '</td><td><b>' + esc(a.name) + '</b></td><td>' + esc(a.phone) + '</td><td>' + esc(a.appt_date) + ' ' + esc(a.appt_time) + '</td><td>' + esc(a.branch) + '</td><td><span class="tag">' + (handled ? 'טופל' : 'חדש') + '</span></td>' +
          '<td><button class="btn btn-sm ' + (handled ? 'btn-ghost' : '') + '" data-appt="' + a.id + '" data-to="' + (handled ? 'new' : 'handled') + '">' + (handled ? 'החזר' : 'סמן כטופל') + '</button></td></tr>';
      }).join('');
      view('<div class="card"><h3>יומן פגישות (' + (r.data || []).length + ')</h3><div class="table-scroll"><table><thead><tr><th>נקבע ב-</th><th>שם</th><th>טלפון</th><th>מועד</th><th>סניף</th><th>סטטוס</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">אין פגישות</td></tr>') + '</tbody></table></div></div>');
      $('view').querySelectorAll('button[data-appt]').forEach(function (b) { b.addEventListener('click', function () { db.from('appointments').update({ status: b.dataset.to }).eq('id', b.dataset.appt).then(renderAppointments); }); });
    });
  }

  // ---------- TASKS (all open) ----------
  function renderTasks() {
    loading();
    db.from('tasks').select('*').order('due_at', { ascending: true }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var tasks = r.data || [];
      var rows = tasks.map(function (t) {
        return '<tr><td><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '></td><td' + (t.done ? ' class="muted" style="text-decoration:line-through"' : '') + '>' + esc(t.title) + '</td><td class="muted">' + (t.due_at ? fmtDateTime(t.due_at) : '—') + '</td><td>' + (t.lead_id ? '<a href="#" data-lead="' + t.lead_id + '">פתח ליד →</a>' : '') + '</td></tr>';
      }).join('');
      view('<div class="card"><h3>משימות (' + tasks.filter(function (t) { return !t.done; }).length + ' פתוחות)</h3><div class="table-scroll"><table><thead><tr><th></th><th>משימה</th><th>מועד</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" class="empty">אין משימות</td></tr>') + '</tbody></table></div></div>');
      $('view').querySelectorAll('input[data-task]').forEach(function (cb) { cb.addEventListener('change', function () { db.from('tasks').update({ done: cb.checked }).eq('id', cb.dataset.task).then(refreshBadges); }); });
      $('view').querySelectorAll('a[data-lead]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); window.C2B_openLeadCard(a.dataset.lead); }); });
    });
  }

  // ---------- ANALYTICS ----------
  function renderAnalytics() {
    loading();
    db.from('events').select('*').order('created_at', { ascending: false }).limit(5000).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var ev = r.data || [], pv = ev.filter(function (e) { return e.type === 'pageview'; });
      var sessions = {}; ev.forEach(function (e) { if (e.session_id) sessions[e.session_id] = 1; });
      var durs = ev.filter(function (e) { return e.type === 'session_end' && e.duration_ms; }).map(function (e) { return e.duration_ms; });
      var avg = durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length / 1000) : 0;
      var byPage = {}; pv.forEach(function (e) { var p = e.page || '/'; byPage[p] = (byPage[p] || 0) + 1; });
      var top = Object.keys(byPage).sort(function (a, b) { return byPage[b] - byPage[a]; }).slice(0, 12);
      var mx = top.length ? byPage[top[0]] : 1;
      view('<div class="cards">' + stat('צפיות', pv.length) + stat('מבקרים', Object.keys(sessions).length) + stat('זמן שהייה ממוצע', avg ? avg + ' שנ\'' : '—') + '</div>' +
        '<div class="card"><h3>עמודים מובילים</h3><div class="table-scroll"><table><tbody>' + (top.map(function (p) { return '<tr><td class="wrap">' + esc(p) + '</td><td>' + byPage[p] + '</td><td style="width:45%"><div class="bar"><span style="width:' + Math.round(byPage[p] / mx * 100) + '%"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>') + '</tbody></table></div></div>');
    });
  }

  // ---------- REPORTS (marketing / sales / manager) ----------
  function renderReports() {
    loading();
    Promise.all([
      db.from('leads').select('status,source,created_at,first_response_at,assigned_to'),
      db.from('appointments').select('status'),
      db.from('events').select('type,session_id'),
      db.from('tasks').select('done'),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (res) {
      var leads = res[0].data || [], appts = res[1].data || [], events = res[2].data || [], tasks = res[3].data || [];
      var prof = {}; (res[4].data || []).forEach(function (p) { prof[p.user_id] = p.full_name; });
      var ST = window.C2B_STATUSES || [];
      var bdg = window.C2B_badge || function (k) { return k; };
      var by = {}; ST.forEach(function (s) { by[s.k] = 0; });
      leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var won = by.won || 0, lost = by.lost || 0, conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
      var pv = events.filter(function (e) { return e.type === 'pageview'; }).length;
      var sess = {}; events.forEach(function (e) { if (e.session_id) sess[e.session_id] = 1; });
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;

      // by source (with won)
      var src = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; src[s] = src[s] || { t: 0, w: 0 }; src[s].t++; if (l.status === 'won') src[s].w++; });
      var srcRows = Object.keys(src).sort(function (a, b) { return src[b].t - src[a].t; }).map(function (s) { var o = src[s]; return '<tr><td>' + esc(s) + '</td><td>' + o.t + '</td><td>' + o.w + '</td><td>' + (o.t ? Math.round(o.w / o.t * 100) : 0) + '%</td></tr>'; }).join('');
      // by salesperson
      var sp = {}; leads.forEach(function (l) { var n = prof[l.assigned_to] || 'לא שויך'; sp[n] = sp[n] || { t: 0, w: 0 }; sp[n].t++; if (l.status === 'won') sp[n].w++; });
      var spRows = Object.keys(sp).map(function (n) { var o = sp[n]; return '<tr><td>' + esc(n) + '</td><td>' + o.t + '</td><td>' + o.w + '</td><td>' + (o.t ? Math.round(o.w / o.t * 100) : 0) + '%</td></tr>'; }).join('');

      var panels = {
        marketing: '<div class="cards">' + stat('סה"כ לידים', leads.length, true) + stat('צפיות באתר', pv) + stat('מבקרים', Object.keys(sess).length) + stat('פגישות', appts.length) + '</div>' +
          '<div class="card"><h3>לידים והמרה לפי מקור</h3><div class="table-scroll"><table><thead><tr><th>מקור</th><th>לידים</th><th>עסקאות</th><th>המרה</th></tr></thead><tbody>' + (srcRows || '<tr><td class="empty">אין נתונים</td></tr>') + '</tbody></table></div></div>',
        sales: '<div class="cards">' + stat('עסקאות שנסגרו', won, true) + stat('אבודות', lost) + stat('אחוז סגירה', conv + '%') + stat('זמן תגובה ממוצע', avgRt ? avgRt + ' דק\'' : '—') + '</div>' +
          '<div class="card"><h3>משפך מכירות (לפי סטטוס)</h3><div class="table-scroll"><table><tbody>' + ST.map(function (s) { var pct = leads.length ? Math.round((by[s.k] || 0) / leads.length * 100) : 0; return '<tr><td>' + bdg(s.k) + '</td><td>' + (by[s.k] || 0) + '</td><td style="width:45%"><div class="bar"><span style="width:' + pct + '%;background:' + s.color + '"></span></div></td></tr>'; }).join('') + '</tbody></table></div></div>',
        manager: '<div class="cards">' + stat('סה"כ לידים', leads.length) + stat('עסקאות', won) + stat('בצנרת (פעילים)', (by.in_progress || 0) + (by.meeting_set || 0) + (by.quote_sent || 0) + (by.underwriting || 0), true) + stat('משימות פתוחות', tasks.filter(function (t) { return !t.done; }).length) + stat('אחוז סגירה', conv + '%') + '</div>' +
          '<div class="card"><h3>ביצועי אנשי מכירות</h3><div class="table-scroll"><table><thead><tr><th>איש מכירות</th><th>לידים</th><th>עסקאות</th><th>המרה</th></tr></thead><tbody>' + (spRows || '<tr><td class="empty">אין נתונים</td></tr>') + '</tbody></table></div></div>'
      };
      function tab(k, label) { return '<button data-rep="' + k + '"' + (repTab === k ? ' class="active"' : '') + '>' + label + '</button>'; }
      view('<nav class="tabs" id="repTabs">' + tab('marketing', '📣 שיווק') + tab('sales', '💼 מכירות') + tab('manager', '👔 מנהל') + '</nav><div id="repPanel">' + panels[repTab] + '</div>');
      $('repTabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-rep]'); if (!b) return; repTab = b.dataset.rep; $('repTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x.dataset.rep === repTab); }); $('repPanel').innerHTML = panels[repTab]; });
    }).catch(function (e) { errBox(e.message || e); });
  }
  var repTab = 'marketing';

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
