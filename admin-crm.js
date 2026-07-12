/* ============================================================
   Car2Buy — CRM module: clean leads table, manager dashboard with
   KPI cards + inline-SVG graphs, and a side-drawer lead card with
   quick actions, flow bar and timeline feed. Uses window.C2B.
   ============================================================ */
(function () {
  'use strict';
  var C = window.C2B;
  if (!C) return;
  var db = C.db, esc = C.esc, fmt = C.fmt, nis = C.nis, view = C.view, loading = C.loading, errBox = C.errBox;

  var STATUSES = [
    { k: 'new', label: 'חדש', icon: '🆕', color: '#3b82f6', flow: true },
    { k: 'in_progress', label: 'בטיפול', icon: '📞', color: '#6366f1', flow: true },
    { k: 'meeting_set', label: 'פגישה נקבעה', icon: '📅', color: '#8b5cf6', flow: true },
    { k: 'quote_sent', label: 'הצעת מחיר', icon: '💰', color: '#F5691E', flow: true },
    { k: 'underwriting', label: 'בתהליך חיתום', icon: '📝', color: '#eab308', flow: true },
    { k: 'won', label: 'עסקה נסגרה', icon: '✅', color: '#16a34a', flow: true, terminal: true },
    { k: 'lost', label: 'לא רלוונטי', icon: '❌', color: '#e2555a', terminal: true },
    { k: 'no_answer', label: 'אין מענה', icon: '🚫', color: '#f59e0b' }
  ];
  var FLOW = STATUSES.filter(function (s) { return s.flow; });
  function stDef(k) { for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].k === k) return STATUSES[i]; return STATUSES[0]; }
  var CLOSE_REASONS = ['רכש במקום אחר', 'לא מעוניין', 'מחיר גבוה', 'לא עומד בתנאים', 'טעות בפרטים', 'כפילות ליד', 'סיבה אחרת'];
  var ACT_ICON = { note: '🗒️', call: '📞', whatsapp: '💬', email: '📧', sms: '✉️', status_change: '🔄', task: '✔️', meeting: '📅', document: '📎', quote: '📄', contract: '✍️', system: '⚙️' };

  function badge(k) { var s = stDef(k); return '<span class="tag" style="border-color:' + s.color + ';color:' + s.color + ';background:' + s.color + '18">' + s.icon + ' ' + esc(s.label) + '</span>'; }
  function initials(name) { return (String(name || '?').trim().split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('') || '?'); }
  function waLink(phone) { var p = String(phone || '').replace(/\D/g, ''); if (p.charAt(0) === '0') p = '972' + p.slice(1); return p ? 'https://wa.me/' + p : null; }
  function logActivity(id, type, body, meta) { return db.from('activities').insert({ lead_id: id, type: type, body: body || null, meta: meta || null }); }

  // ---------- LEADS TABLE ----------
  var cache = [], profiles = {};
  window.C2B_renderLeads = function (statusFilter) {
    loading();
    Promise.all([
      db.from('leads').select('*').order('created_at', { ascending: false }),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      cache = res[0].data || [];
      profiles = {}; (res[1].data || []).forEach(function (p) { profiles[p.user_id] = p.full_name; });
      var title = statusFilter ? stDef(statusFilter).label : 'כל הלידים';
      view('<div class="card"><div class="row-between"><h3>' + esc(title) + ' <span class="muted" id="lcount"></span></h3>' +
        '<div><input class="inp" id="lq" placeholder="חיפוש…" style="width:190px"> <button class="btn btn-sm" id="lcsv">CSV</button></div></div>' +
        '<div class="table-scroll"><table><thead><tr><th>שם</th><th>טלפון</th><th>מקור</th><th>רכב</th><th>איש מכירות</th><th>סטטוס</th><th>עדכון אחרון</th></tr></thead><tbody id="ltbl"></tbody></table></div></div>');
      C.$('lq').addEventListener('input', function () { draw(statusFilter); });
      C.$('lcsv').addEventListener('click', function () { C.exportCsv(list(statusFilter), ['created_at', 'name', 'phone', 'email', 'car', 'source', 'status', 'message'], 'car2buy-leads'); });
      draw(statusFilter);
    });
  };
  function list(statusFilter) {
    var q = (C.$('lq') && C.$('lq').value || '').trim().toLowerCase();
    return cache.filter(function (l) {
      if (statusFilter && (l.status || 'new') !== statusFilter) return false;
      if (q && !((l.name || '') + ' ' + (l.phone || '') + ' ' + (l.car || '')).toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function draw(statusFilter) {
    var rows = list(statusFilter);
    if (C.$('lcount')) C.$('lcount').textContent = '(' + rows.length + ')';
    C.$('ltbl').innerHTML = rows.map(function (l) {
      return '<tr style="cursor:pointer" data-lead="' + l.id + '"><td><span class="avatar" style="margin-inline-end:8px">' + esc(initials(l.name)) + '</span><b>' + esc(l.name) + '</b></td>' +
        '<td>' + esc(l.phone) + '</td><td><span class="tag">' + esc(l.source) + '</span></td><td>' + esc(l.car) + '</td>' +
        '<td class="muted">' + esc(profiles[l.assigned_to] || '—') + '</td><td>' + badge(l.status || 'new') + '</td><td class="muted">' + fmt(l.status_changed_at || l.created_at) + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="empty">אין לידים</td></tr>';
    C.$('ltbl').querySelectorAll('tr[data-lead]').forEach(function (tr) { tr.addEventListener('click', function () { window.C2B_openLeadCard(tr.dataset.lead); }); });
  }

  // ---------- LEAD CARD (drawer) ----------
  window.C2B_openLeadCard = function (id) {
    Promise.all([
      db.from('leads').select('*').eq('id', id).single(),
      db.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('tasks').select('*').eq('lead_id', id).order('due_at', { ascending: true }),
      db.from('lead_documents').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    ]).then(function (r) {
      if (r[0].error) { alert('שגיאה: ' + r[0].error.message); return; }
      var lead = r[0].data, acts = r[1].data || [], tasks = r[2].data || [], docs = r[3].data || [];
      var wa = waLink(lead.phone);
      var stOpts = STATUSES.map(function (s) { return '<option value="' + s.k + '"' + ((lead.status || 'new') === s.k ? ' selected' : '') + '>' + s.icon + ' ' + esc(s.label) + '</option>'; }).join('');
      C.openDrawer(
        '<div class="dw-head"><div class="row-between" style="margin:0"><div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="width:44px;height:44px;font-size:17px">' + esc(initials(lead.name)) + '</span><div><h3 style="margin:0">' + esc(lead.name || 'ליד') + '</h3><div class="muted" style="font-size:13px">' + esc(lead.phone) + (lead.car ? ' · ' + esc(lead.car) : '') + '</div></div></div>' +
        '<button class="icon-btn" id="dwClose">✕</button></div>' +
        '<div class="qa">' +
          (lead.phone ? '<a href="tel:' + esc(lead.phone) + '">📞 התקשר</a>' : '') +
          (wa ? '<a href="' + wa + '" target="_blank" rel="noopener">💬 WhatsApp</a>' : '') +
          (lead.email ? '<a href="mailto:' + esc(lead.email) + '">📧 מייל</a>' : '') +
          '<button data-qa="quote">📄 הצעת מחיר</button><button data-qa="contract">✍ הסכם</button>' +
          '<button data-qa="meeting">📅 פגישה</button><button data-qa="won">💰 סגור עסקה</button>' +
        '</div>' +
        '<div class="flow">' + flowBar(lead.status || 'new') + '</div></div>' +
        '<div class="dw-body">' +
          '<div class="card" style="box-shadow:none;margin-bottom:14px"><div class="row-between" style="margin:0"><div><label class="muted" style="font-size:12px">סטטוס</label><br><select class="inp" id="dwStatus" style="margin-top:4px">' + stOpts + '</select></div>' +
          '<div style="text-align:left"><div class="muted" style="font-size:12px">מקור</div><div>' + esc(lead.source || '—') + '</div></div></div>' +
          (lead.status === 'lost' ? '<div style="margin-top:10px"><label class="muted" style="font-size:12px">סיבת סגירה</label><select class="inp" id="dwReason" style="width:100%;margin-top:4px"><option value="">בחר…</option>' + CLOSE_REASONS.map(function (x) { return '<option' + (lead.close_reason === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' : '') +
          (lead.email ? '<div class="muted" style="font-size:13px;margin-top:8px">📧 ' + esc(lead.email) + '</div>' : '') +
          (lead.message ? '<div style="font-size:13px;margin-top:8px">🗒️ ' + esc(lead.message) + '</div>' : '') + '</div>' +

          '<div class="card" style="box-shadow:none"><div class="row-between"><h3 style="margin:0">משימות</h3></div><div id="dwTasks">' + taskList(tasks) + '</div>' +
          '<form id="dwTaskForm" style="display:flex;gap:8px;margin-top:10px"><input class="inp" name="title" placeholder="משימה חדשה…" style="flex:1"><button class="btn btn-sm">+</button></form></div>' +

          '<div class="card" style="box-shadow:none"><div class="row-between"><h3 style="margin:0">מסמכים</h3></div><div id="dwDocs">' + docList(docs) + '</div><input type="file" id="dwUp" style="margin-top:10px"></div>' +

          '<div class="card" style="box-shadow:none;margin-bottom:0"><h3>ציר זמן</h3>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + ['note', 'call', 'whatsapp', 'email'].map(function (t) { return '<button class="btn btn-ghost btn-sm" data-act="' + t + '">' + ACT_ICON[t] + ' ' + ({ note: 'הערה', call: 'שיחה', whatsapp: 'WhatsApp', email: 'מייל' }[t]) + '</button>'; }).join('') + '</div>' +
          '<form id="dwActForm" style="display:none;margin-bottom:12px"><textarea class="inp" name="body" rows="2" style="width:100%" placeholder="תוכן…"></textarea><input type="hidden" name="type"><div style="margin-top:6px"><button class="btn btn-sm">שמור</button> <button type="button" class="btn btn-ghost btn-sm" id="dwActCancel">ביטול</button></div></form>' +
          '<div class="tl" id="dwTimeline">' + timeline(acts) + '</div></div>' +
        '</div>'
      );
      bind(lead);
    });
  };

  function flowBar(cur) {
    var idx = FLOW.map(function (s) { return s.k; }).indexOf(cur);
    var lost = cur === 'lost' || cur === 'no_answer';
    return FLOW.map(function (s, i) {
      var state = lost ? (i === 0 ? 'red' : 'gray') : (i < idx ? 'green' : i === idx ? 'cur' : 'gray');
      var bg = { gray: 'var(--surface-2)', cur: s.color, green: '#16a34a', red: '#e2555a' }[state];
      var fg = state === 'gray' ? 'var(--muted)' : '#fff';
      return '<div class="st" style="background:' + bg + ';color:' + fg + '">' + s.icon + '<br>' + esc(s.label) + '</div>';
    }).join('');
  }
  function timeline(acts) {
    if (!acts.length) return '<p class="empty">אין עדיין פעולות</p>';
    return acts.map(function (a) { return '<div class="ev"><div class="dot">' + (ACT_ICON[a.type] || '•') + '</div><div style="flex:1"><div class="tm">' + fmt(a.created_at) + '</div>' + (a.body ? '<div>' + esc(a.body) + '</div>' : '') + '</div></div>'; }).join('');
  }
  function taskList(tasks) {
    if (!tasks.length) return '<p class="muted" style="margin:6px 0">אין משימות</p>';
    return tasks.map(function (t) { return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '><span style="flex:1' + (t.done ? ';text-decoration:line-through;color:var(--muted)' : '') + '">' + esc(t.title) + '</span>' + (t.due_at ? '<span class="muted" style="font-size:12px">' + fmt(t.due_at) + '</span>' : '') + '</div>'; }).join('');
  }
  function docList(docs) {
    if (!docs.length) return '<p class="muted" style="margin:6px 0">אין מסמכים</p>';
    return docs.map(function (d) { return '<div style="padding:4px 0"><a href="#" data-doc="' + esc(d.storage_path) + '">📎 ' + esc(d.name) + '</a></div>'; }).join('');
  }

  function setStatus(lead, to, reload) {
    var patch = { status: to, status_changed_at: new Date().toISOString() };
    if (to === 'in_progress' && !lead.first_response_at) patch.first_response_at = new Date().toISOString();
    db.from('leads').update(patch).eq('id', lead.id).then(function (u) {
      if (u.error) return alert('שגיאה: ' + u.error.message);
      logActivity(lead.id, 'status_change', 'סטטוס שונה ל: ' + stDef(to).label).then(function () { if (reload) window.C2B_openLeadCard(lead.id); });
    });
  }

  function bind(lead) {
    var $ = C.$;
    $('dwClose').addEventListener('click', C.closeDrawer);
    $('dwStatus').addEventListener('change', function () { setStatus(lead, this.value, true); });
    var rs = $('dwReason'); if (rs) rs.addEventListener('change', function () { db.from('leads').update({ close_reason: rs.value }).eq('id', lead.id); });

    $('drawer').querySelectorAll('button[data-qa]').forEach(function (b) {
      b.addEventListener('click', function () {
        var qa = b.dataset.qa;
        if (qa === 'won') return setStatus(lead, 'won', true);
        if (qa === 'meeting') return setStatus(lead, 'meeting_set', true);
        if (qa === 'quote') { setStatus(lead, 'quote_sent', false); logActivity(lead.id, 'quote', 'סומן: הצעת מחיר נשלחה'); alert('מודול הצעות המחיר מגיע ב-Phase 2. הסטטוס עודכן ותועד.'); return window.C2B_openLeadCard(lead.id); }
        if (qa === 'contract') { logActivity(lead.id, 'contract', 'סומן: נשלח הסכם'); alert('מודול ההסכמים (מילוי + חתימה) מגיע ב-Phase 4. הפעולה תועדה.'); return window.C2B_openLeadCard(lead.id); }
      });
    });
    // activity feed
    $('drawer').querySelectorAll('button[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { var f = $('dwActForm'); f.style.display = 'block'; f.querySelector('[name=type]').value = b.dataset.act; f.querySelector('[name=body]').focus(); });
    });
    $('dwActCancel').addEventListener('click', function () { $('dwActForm').style.display = 'none'; });
    $('dwActForm').addEventListener('submit', function (e) {
      e.preventDefault(); var body = this.body.value.trim(); if (!body) return;
      logActivity(lead.id, this.type.value, body).then(function () { window.C2B_openLeadCard(lead.id); });
    });
    // tasks
    $('dwTaskForm').addEventListener('submit', function (e) {
      e.preventDefault(); var title = this.title.value.trim(); if (!title) return;
      db.from('tasks').insert({ lead_id: lead.id, title: title }).then(function () { logActivity(lead.id, 'task', 'נפתחה משימה: ' + title); C.refreshBadges && C.refreshBadges(); window.C2B_openLeadCard(lead.id); });
    });
    $('dwTasks').querySelectorAll('input[data-task]').forEach(function (cb) { cb.addEventListener('change', function () { db.from('tasks').update({ done: cb.checked }).eq('id', cb.dataset.task).then(function () { C.refreshBadges && C.refreshBadges(); }); }); });
    // documents
    $('dwUp').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      var path = lead.id + '/' + Date.now() + '_' + file.name;
      db.storage.from('lead-docs').upload(path, file).then(function (u) {
        if (u.error) return alert('העלאה נכשלה: ' + u.error.message);
        db.from('lead_documents').insert({ lead_id: lead.id, name: file.name, storage_path: path }).then(function () { logActivity(lead.id, 'document', 'הועלה מסמך: ' + file.name); window.C2B_openLeadCard(lead.id); });
      });
    });
    $('dwDocs').querySelectorAll('a[data-doc]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); db.storage.from('lead-docs').createSignedUrl(a.dataset.doc, 300).then(function (r) { if (r.data && r.data.signedUrl) window.open(r.data.signedUrl, '_blank'); }); }); });
  }

  // ---------- DASHBOARD ----------
  window.C2B_renderDashboard = function () {
    loading();
    Promise.all([
      db.from('leads').select('status,source,created_at,first_response_at'),
      db.from('tasks').select('done'),
      db.from('appointments').select('appt_date,status')
    ]).then(function (res) {
      var leads = res[0].data || [], tasks = res[1].data || [], appts = res[2].data || [];
      var by = {}; STATUSES.forEach(function (s) { by[s.k] = 0; });
      leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var won = by.won || 0, lost = by.lost || 0, conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
      var openTasks = tasks.filter(function (t) { return !t.done; }).length;
      // leads over last 14 days
      var byDay = {}; leads.forEach(function (l) { var d = (l.created_at || '').slice(0, 10); if (d) byDay[d] = (byDay[d] || 0) + 1; });
      var days = []; for (var i = 13; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push({ d: d, v: byDay[d] || 0 }); }
      var bySource = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; bySource[s] = (bySource[s] || 0) + 1; });
      var topSrc = Object.keys(bySource).sort(function (a, b) { return bySource[b] - bySource[a]; }).slice(0, 6);
      var maxSrc = topSrc.length ? bySource[topSrc[0]] : 1;

      view(
        '<div class="cards">' +
          C.stat('לידים חדשים', by.new || 0) + C.stat('בטיפול', by.in_progress || 0) +
          C.stat('פגישות נקבעו', by.meeting_set || 0) + C.stat('הצעות מחיר', by.quote_sent || 0) +
          C.stat('עסקאות', won) + C.stat('אחוז סגירה', conv + '%') +
          C.stat('זמן תגובה', avgRt ? avgRt + ' דק\'' : '—') + C.stat('משימות פתוחות', openTasks) +
        '</div>' +
        '<div class="grid2">' +
          '<div class="card"><h3>לידים ב-14 הימים האחרונים</h3>' + svgBars(days) + '</div>' +
          '<div class="card"><h3>פילוח לפי סטטוס</h3><div class="table-scroll"><table><tbody>' +
            STATUSES.filter(function (s) { return by[s.k]; }).map(function (s) { var pct = leads.length ? Math.round(by[s.k] / leads.length * 100) : 0; return '<tr><td>' + badge(s.k) + '</td><td>' + by[s.k] + '</td><td style="width:45%"><div class="bar"><span style="width:' + pct + '%;background:' + s.color + '"></span></div></td></tr>'; }).join('') +
          '</tbody></table></div></div>' +
        '</div>' +
        '<div class="card"><h3>מקורות מובילים</h3><div class="table-scroll"><table><tbody>' +
          (topSrc.map(function (s) { return '<tr><td>' + esc(s) + '</td><td>' + bySource[s] + '</td><td style="width:55%"><div class="bar"><span style="width:' + Math.round(bySource[s] / maxSrc * 100) + '%"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>') +
        '</tbody></table></div></div>'
      );
    }).catch(function (e) { errBox(e.message || e); });
  };

  function svgBars(days) {
    var max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.v; })));
    var W = 100 / days.length;
    var bars = days.map(function (d, i) {
      var h = d.v / max * 90;
      return '<g><rect x="' + (i * W + W * 0.15) + '" y="' + (100 - h) + '" width="' + (W * 0.7) + '" height="' + h + '" rx="1.5" fill="var(--brand)"><title>' + d.d + ': ' + d.v + '</title></rect></g>';
    }).join('');
    var labels = days.map(function (d, i) { return i % 2 === 0 ? '<text x="' + (i * W + W / 2) + '" y="99" font-size="3" fill="var(--muted)" text-anchor="middle">' + d.d.slice(5) + '</text>' : ''; }).join('');
    return '<svg viewBox="0 0 100 108" preserveAspectRatio="none" style="width:100%;height:180px">' + bars + labels + '</svg>';
  }
})();
