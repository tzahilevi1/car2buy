/* ============================================================
   Car2Buy — Admin panel logic.
   Auth (Supabase) + dashboards for leads, appointments, analytics,
   and car management. Uses ONLY the public anon key; every data
   access is gated by Supabase Auth session + RLS policies.
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---------- tiny helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }
  function nis(n) { return n == null || n === '' ? '—' : '₪' + Number(n).toLocaleString('en-US'); }
  function view(html) { $('view').innerHTML = html; }
  function loading() { view('<div class="loading">טוען…</div>'); }
  function errBox(msg) { view('<div class="card"><p class="err">שגיאה: ' + esc(msg) + '</p></div>'); }

  // ---------- auth ----------
  function showLogin() { $('login').classList.remove('hidden'); $('app').classList.add('hidden'); }
  function showApp(session) {
    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('whoami').textContent = session.user.email;
    route('overview');
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('loginErr').textContent = '';
    db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value })
      .then(function (r) {
        if (r.error) { $('loginErr').textContent = 'התחברות נכשלה: ' + r.error.message; return; }
        showApp(r.data.session);
      });
  });
  $('logout').addEventListener('click', function () { db.auth.signOut().then(showLogin); });

  // ---------- routing ----------
  var TABS = { overview: renderOverview, leads: renderLeads, appointments: renderAppointments, analytics: renderAnalytics, cars: renderCars };
  function route(tab) {
    var btns = $('tabs').querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.tab === tab);
    loading();
    (TABS[tab] || renderOverview)();
  }
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]'); if (b) route(b.dataset.tab);
  });

  // ---------- OVERVIEW ----------
  function renderOverview() {
    Promise.all([
      db.from('leads').select('source', { count: 'exact' }),
      db.from('appointments').select('status', { count: 'exact' }),
      db.from('events').select('type,duration_ms', { count: 'exact' })
    ]).then(function (res) {
      var leads = res[0].data || [], appts = res[1].data || [], events = res[2].data || [];
      // leads by source
      var bySource = {};
      leads.forEach(function (l) { var s = l.source || 'לא ידוע'; bySource[s] = (bySource[s] || 0) + 1; });
      var srcRows = Object.keys(bySource).sort(function (a, b) { return bySource[b] - bySource[a]; })
        .map(function (s) {
          var pct = leads.length ? Math.round(bySource[s] / leads.length * 100) : 0;
          return '<tr><td>' + esc(s) + '</td><td>' + bySource[s] + '</td><td style="width:40%"><div class="bar"><span style="width:' + pct + '%"></span></div></td><td>' + pct + '%</td></tr>';
        }).join('');
      var pageviews = events.filter(function (e) { return e.type === 'pageview'; }).length;
      var durs = events.filter(function (e) { return e.type === 'session_end' && e.duration_ms; }).map(function (e) { return e.duration_ms; });
      var avgSec = durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length / 1000) : 0;
      var newAppts = appts.filter(function (a) { return a.status === 'new'; }).length;

      view(
        '<div class="cards">' +
          stat('סה"כ לידים', leads.length, true) +
          stat('פגישות', appts.length) +
          stat('פגישות חדשות', newAppts) +
          stat('צפיות בעמודים', pageviews) +
          stat('זמן שהייה ממוצע', avgSec ? avgSec + ' שנ\'' : '—') +
        '</div>' +
        '<div class="card"><h3>לידים לפי טופס/מקור</h3><div class="table-scroll"><table><thead><tr><th>מקור</th><th>כמות</th><th>יחס</th><th></th></tr></thead><tbody>' +
        (srcRows || '<tr><td colspan="4" class="muted">אין עדיין לידים</td></tr>') + '</tbody></table></div></div>'
      );
    }).catch(function (e) { errBox(e.message || e); });
  }
  function stat(k, v, gold) { return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v' + (gold ? ' gold' : '') + '">' + esc(v) + '</div></div>'; }

  // ---------- LEADS ----------
  var leadsCache = [];
  function renderLeads() {
    db.from('leads').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      leadsCache = r.data || [];
      var sources = [''].concat(Object.keys(leadsCache.reduce(function (a, l) { if (l.source) a[l.source] = 1; return a; }, {})));
      var opts = sources.map(function (s) { return '<option value="' + esc(s) + '">' + (s ? esc(s) : 'כל המקורות') + '</option>'; }).join('');
      view(
        '<div class="card"><div class="row-between"><h3>לידים (' + leadsCache.length + ')</h3>' +
        '<div><select id="leadFilter">' + opts + '</select> <button class="btn btn-sm" id="leadCsv">ייצוא CSV</button></div></div>' +
        '<div class="table-scroll" id="leadTable"></div></div>'
      );
      $('leadFilter').addEventListener('change', drawLeads);
      $('leadCsv').addEventListener('click', function () { exportCsv(filteredLeads(), 'car2buy-leads'); });
      drawLeads();
    });
  }
  function filteredLeads() {
    var f = $('leadFilter') ? $('leadFilter').value : '';
    return f ? leadsCache.filter(function (l) { return l.source === f; }) : leadsCache;
  }
  function drawLeads() {
    var rows = filteredLeads().map(function (l) {
      return '<tr><td>' + fmtDateTime(l.created_at) + '</td><td>' + esc(l.name) + '</td><td>' + esc(l.phone) +
        '</td><td>' + esc(l.email) + '</td><td>' + esc(l.car) + '</td><td><span class="tag">' + esc(l.source) +
        '</span></td><td class="wrap-cell">' + esc(l.message) + '</td></tr>';
    }).join('');
    $('leadTable').innerHTML = '<table><thead><tr><th>תאריך</th><th>שם</th><th>טלפון</th><th>אימייל</th><th>רכב</th><th>מקור</th><th>הערה</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="7" class="muted">אין לידים</td></tr>') + '</tbody></table>';
  }

  // ---------- APPOINTMENTS ----------
  function renderAppointments() {
    db.from('appointments').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var data = r.data || [];
      var rows = data.map(function (a) {
        var st = a.status || 'new';
        var tagCls = st === 'handled' ? 'handled' : 'new';
        var label = st === 'handled' ? 'טופל' : (st === 'cancelled' ? 'בוטל' : 'חדש');
        var action = st === 'handled'
          ? '<button class="btn btn-ghost btn-sm" data-appt="' + a.id + '" data-to="new">החזר</button>'
          : '<button class="btn btn-sm" data-appt="' + a.id + '" data-to="handled">סמן כטופל</button>';
        return '<tr><td>' + fmtDateTime(a.created_at) + '</td><td>' + esc(a.name) + '</td><td>' + esc(a.phone) +
          '</td><td>' + esc(a.email) + '</td><td>' + esc(a.appt_date) + ' ' + esc(a.appt_time) + '</td><td>' + esc(a.branch) +
          '</td><td>' + esc(a.type) + '</td><td><span class="tag ' + tagCls + '">' + label + '</span></td><td>' + action + '</td></tr>';
      }).join('');
      view('<div class="card"><h3>פגישות (' + data.length + ')</h3><div class="table-scroll"><table><thead><tr>' +
        '<th>נקבע ב-</th><th>שם</th><th>טלפון</th><th>אימייל</th><th>מועד</th><th>סניף</th><th>סוג</th><th>סטטוס</th><th></th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="9" class="muted">אין פגישות</td></tr>') + '</tbody></table></div></div>');
      $('view').querySelectorAll('button[data-appt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.disabled = true;
          db.from('appointments').update({ status: btn.dataset.to }).eq('id', btn.dataset.appt).then(function (u) {
            if (u.error) { alert('שגיאה: ' + u.error.message); btn.disabled = false; return; }
            renderAppointments();
          });
        });
      });
    });
  }

  // ---------- ANALYTICS ----------
  function renderAnalytics() {
    db.from('events').select('*').order('created_at', { ascending: false }).limit(5000).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var ev = r.data || [];
      var pv = ev.filter(function (e) { return e.type === 'pageview'; });
      var sessions = {};
      ev.forEach(function (e) { if (e.session_id) sessions[e.session_id] = 1; });
      var durs = ev.filter(function (e) { return e.type === 'session_end' && e.duration_ms; }).map(function (e) { return e.duration_ms; });
      var avgSec = durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length / 1000) : 0;
      // top pages
      var byPage = {};
      pv.forEach(function (e) { var p = e.page || '/'; byPage[p] = (byPage[p] || 0) + 1; });
      var topPages = Object.keys(byPage).sort(function (a, b) { return byPage[b] - byPage[a]; }).slice(0, 12);
      var maxPv = topPages.length ? byPage[topPages[0]] : 1;
      var pageRows = topPages.map(function (p) {
        return '<tr><td class="wrap-cell">' + esc(p) + '</td><td>' + byPage[p] + '</td><td style="width:45%"><div class="bar"><span style="width:' + Math.round(byPage[p] / maxPv * 100) + '%"></span></div></td></tr>';
      }).join('');
      // views per day (last 14)
      var byDay = {};
      pv.forEach(function (e) { var d = (e.created_at || '').slice(0, 10); if (d) byDay[d] = (byDay[d] || 0) + 1; });
      var days = Object.keys(byDay).sort().slice(-14);
      var maxDay = days.reduce(function (m, d) { return Math.max(m, byDay[d]); }, 1);
      var dayRows = days.map(function (d) {
        return '<tr><td>' + esc(d) + '</td><td>' + byDay[d] + '</td><td style="width:55%"><div class="bar"><span style="width:' + Math.round(byDay[d] / maxDay * 100) + '%"></span></div></td></tr>';
      }).join('');

      view(
        '<div class="cards">' +
          stat('צפיות בעמודים', pv.length, true) +
          stat('מבקרים (sessions)', Object.keys(sessions).length) +
          stat('זמן שהייה ממוצע', avgSec ? avgSec + ' שנ\'' : '—') +
        '</div>' +
        '<div class="grid2">' +
          '<div class="card"><h3>עמודים מובילים</h3><div class="table-scroll"><table><thead><tr><th>עמוד</th><th>צפיות</th><th></th></tr></thead><tbody>' + (pageRows || '<tr><td colspan="3" class="muted">אין נתונים עדיין</td></tr>') + '</tbody></table></div></div>' +
          '<div class="card"><h3>צפיות לפי יום</h3><div class="table-scroll"><table><thead><tr><th>יום</th><th>צפיות</th><th></th></tr></thead><tbody>' + (dayRows || '<tr><td colspan="3" class="muted">אין נתונים עדיין</td></tr>') + '</tbody></table></div></div>' +
        '</div>' +
        '<p class="muted" style="font-size:13px">המעקב מתחיל לצבור נתונים מרגע ההטמעה. נתונים מוגבלים ל-5000 האירועים האחרונים בתצוגה.</p>'
      );
    });
  }

  // ---------- CARS ----------
  var carFilter = 'all';
  function renderCars() {
    db.from('cars').select('*').order('condition', { ascending: true }).order('sort_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var all = r.data || [];
      var cnt = { all: all.length, new: 0, used: 0 };
      all.forEach(function (c) { (c.condition === 'used') ? cnt.used++ : cnt.new++; });
      var cars = carFilter === 'all' ? all : all.filter(function (c) { return (c.condition || 'new') === carFilter; });
      var rows = cars.map(function (c) {
        var cond = c.condition === 'used' ? '<span class="tag">יד 2</span>' : '<span class="tag handled">חדש</span>';
        var extra = c.extra || {};
        var sub = c.condition === 'used' ? (esc(c.year) + ' · ' + (extra.km ? Number(extra.km).toLocaleString('en-US') + ' ק״מ' : '') + (extra.hand ? ' · יד ' + esc(extra.hand) : '')) : esc(c.trim);
        return '<tr><td>' + (c.img ? '<img src="' + esc(c.img) + '" style="width:54px;height:36px;object-fit:cover;border-radius:6px">' : '') +
          '</td><td>' + cond + '</td><td>' + esc(c.brand) + '</td><td>' + esc(c.name) + '</td><td class="muted">' + sub + '</td><td>' + nis(c.monthly) +
          '</td><td>' + nis(c.price) + '</td><td>' + (c.active ? '<span class="tag handled">פעיל</span>' : '<span class="tag">מוסתר</span>') +
          '</td><td><button class="btn btn-ghost btn-sm" data-edit="' + c.id + '">עריכה</button> ' +
          '<button class="btn btn-ghost btn-sm" data-del="' + c.id + '" style="border-color:var(--danger);color:var(--danger)">מחיקה</button></td></tr>';
      }).join('');
      function tabBtn(v, label) { return '<button data-cf="' + v + '"' + (carFilter === v ? ' class="active"' : '') + '>' + label + '</button>'; }
      view(
        '<div class="card"><div class="row-between"><h3>ניהול רכבים</h3><button class="btn btn-sm" id="carAdd">+ הוספת רכב</button></div>' +
        '<nav class="tabs" id="carTabs" style="margin-bottom:14px">' + tabBtn('all', 'הכל (' + cnt.all + ')') + tabBtn('new', 'חדשים (' + cnt.new + ')') + tabBtn('used', 'יד 2 (' + cnt.used + ')') + '</nav>' +
        '<div class="table-scroll"><table><thead><tr><th>תמונה</th><th>סוג</th><th>מותג</th><th>דגם</th><th>פרטים</th><th>החזר</th><th>מחיר</th><th>סטטוס</th><th></th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="9" class="muted">אין רכבים בקבוצה זו.</td></tr>') + '</tbody></table></div></div>' +
        '<div id="carFormWrap"></div>'
      );
      $('carTabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-cf]'); if (b) { carFilter = b.dataset.cf; renderCars(); } });
      $('carAdd').addEventListener('click', function () { carForm(null); });
      $('view').querySelectorAll('button[data-edit]').forEach(function (b) {
        b.addEventListener('click', function () { carForm(all.filter(function (c) { return c.id === b.dataset.edit; })[0]); });
      });
      $('view').querySelectorAll('button[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('למחוק את הרכב?')) return;
          db.from('cars').delete().eq('id', b.dataset.del).then(function (d) {
            if (d.error) return alert('שגיאה: ' + d.error.message);
            renderCars();
          });
        });
      });
    });
  }
  function carForm(car) {
    car = car || {};
    var extra = car.extra || {};
    var isUsed = car.condition === 'used';
    var f = function (label, key, type, val) {
      return '<div class="field"><label>' + label + '</label><input class="inp" style="width:100%" name="' + key + '" type="' + (type || 'text') + '" value="' + esc(car[key] != null ? car[key] : (val || '')) + '"></div>';
    };
    var fx = function (label, key, val) { // used-specific (from extra)
      return '<div class="field"><label>' + label + '</label><input class="inp" style="width:100%" name="' + key + '" type="number" value="' + esc(extra[key] != null ? extra[key] : (val || '')) + '"></div>';
    };
    $('carFormWrap').innerHTML =
      '<div class="card"><h3>' + (car.id ? 'עריכת רכב' : 'רכב חדש') + '</h3>' +
      '<form id="carForm"><div class="form-grid">' +
      '<div class="field"><label>סוג</label><select class="inp" style="width:100%" name="condition" id="condSel"><option value="new"' + (isUsed ? '' : ' selected') + '>רכב חדש</option><option value="used"' + (isUsed ? ' selected' : '') + '>יד 2 (משומש)</option></select></div>' +
      f('מותג (עברית)', 'brand') + f('דגם', 'name') + f('גרסה/גימור', 'trim') +
      f('החזר חודשי ₪', 'monthly', 'number') + f('מחיר ₪', 'price', 'number') + f('שנה', 'year', 'number') +
      f('קטגוריה (suv/sedan/ev)', 'cat') + f('סוג דלק', 'fuel') +
      '<div id="usedFields" style="display:' + (isUsed ? 'contents' : 'none') + '">' + fx('קילומטראז\'', 'km') + fx('יד', 'hand') + '</div>' +
      '<div class="field" style="grid-column:1/-1"><label>כתובת תמונה (URL)</label><input class="inp" style="width:100%" name="img" type="url" value="' + esc(car.img || '') + '"></div>' +
      '<label class="field" style="grid-column:1/-1;display:flex;align-items:center;gap:8px"><input type="checkbox" name="active" ' + (car.active === false ? '' : 'checked') + '> פעיל (מוצג באתר)</label>' +
      '</div><div style="margin-top:14px;display:flex;gap:10px"><button type="submit" class="btn">שמירה</button><button type="button" class="btn btn-ghost" id="carCancel">ביטול</button></div>' +
      '<div class="err" id="carErr"></div></form></div>';
    $('carFormWrap').scrollIntoView({ behavior: 'smooth' });
    $('condSel').addEventListener('change', function () { $('usedFields').style.display = this.value === 'used' ? 'contents' : 'none'; });
    $('carCancel').addEventListener('click', function () { $('carFormWrap').innerHTML = ''; });
    $('carForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var cond = fd.get('condition') || 'new';
      var payload = {
        condition: cond,
        brand: (fd.get('brand') || '').trim(),
        name: (fd.get('name') || '').trim(),
        trim: (fd.get('trim') || '').trim() || null,
        monthly: fd.get('monthly') ? parseInt(fd.get('monthly'), 10) : null,
        price: fd.get('price') ? parseInt(fd.get('price'), 10) : null,
        year: fd.get('year') ? parseInt(fd.get('year'), 10) : null,
        cat: (fd.get('cat') || '').trim() || null,
        fuel: (fd.get('fuel') || '').trim() || null,
        img: (fd.get('img') || '').trim() || null,
        active: fd.get('active') === 'on',
        extra: cond === 'used' ? { km: fd.get('km') ? parseInt(fd.get('km'), 10) : null, hand: fd.get('hand') ? parseInt(fd.get('hand'), 10) : null, type: (fd.get('cat') || '') } : (car.extra || null)
      };
      if (!payload.brand || !payload.name) { $('carErr').textContent = 'מותג ודגם הם שדות חובה.'; return; }
      var q = car.id ? db.from('cars').update(payload).eq('id', car.id) : db.from('cars').insert(payload);
      q.then(function (res) {
        if (res.error) { $('carErr').textContent = 'שגיאה: ' + res.error.message; return; }
        carFilter = cond; renderCars();
      });
    });
  }

  // ---------- CSV export ----------
  function exportCsv(rows, name) {
    if (!rows.length) { alert('אין נתונים לייצוא'); return; }
    var cols = ['created_at', 'name', 'phone', 'email', 'car', 'source', 'message', 'page_url'];
    var csv = cols.join(',') + '\n' + rows.map(function (r) {
      return cols.map(function (c) { return '"' + String(r[c] == null ? '' : r[c]).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }

  // ---------- boot ----------
  db.auth.getSession().then(function (r) {
    if (r.data.session) showApp(r.data.session); else showLogin();
  });
})();
