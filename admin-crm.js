/* ============================================================
   Car2Buy — CRM module (Phase 1). Lead list, lead card with
   timeline / statuses / pipeline / tasks / notes / documents, and
   a manager dashboard. Reuses the client + helpers from admin.js
   via window.C2B. All data access gated by Supabase Auth + RLS.
   ============================================================ */
(function () {
  'use strict';
  var C = window.C2B;
  if (!C) return;
  var db = C.db, esc = C.esc, fmt = C.fmt, nis = C.nis, view = C.view, loading = C.loading, errBox = C.errBox;

  // ---------- status model ----------
  var STATUSES = [
    { k: 'new',          label: 'חדש',              icon: '🆕', color: '#3b82f6', flow: true },
    { k: 'in_progress',  label: 'בטיפול',           icon: '📞', color: '#6366f1', flow: true },
    { k: 'meeting_set',  label: 'פגישה נקבעה',      icon: '📅', color: '#8b5cf6', flow: true },
    { k: 'quote_sent',   label: 'הצעת מחיר נשלחה',  icon: '💰', color: '#f5691e', flow: true },
    { k: 'underwriting', label: 'בתהליך חיתום',     icon: '📝', color: '#eab308', flow: true },
    { k: 'won',          label: 'עסקה נסגרה',        icon: '✅', color: '#2ec46b', flow: true, terminal: true },
    { k: 'lost',         label: 'לא רלוונטי',        icon: '❌', color: '#e2555a', terminal: true },
    { k: 'no_answer',    label: 'אין מענה',          icon: '🚫', color: '#f5b642' }
  ];
  var FLOW = STATUSES.filter(function (s) { return s.flow; });
  function stDef(k) { for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].k === k) return STATUSES[i]; return STATUSES[0]; }
  var CLOSE_REASONS = ['רכש במקום אחר', 'לא מעוניין', 'מחיר גבוה', 'לא עומד בתנאים', 'טעות בפרטים', 'כפילות ליד', 'סיבה אחרת'];

  var ACT_ICON = { note: '🗒️', call: '📞', whatsapp: '💬', email: '📧', sms: '✉️', status_change: '🔄', task: '✔️', meeting: '📅', document: '📎', system: '⚙️' };

  function badge(k) { var s = stDef(k); return '<span class="tag" style="border-color:' + s.color + ';color:' + s.color + '">' + s.icon + ' ' + esc(s.label) + '</span>'; }

  // ---------- LEAD LIST ----------
  var cache = [];
  window.C2B_renderLeads = function () {
    loading();
    db.from('leads').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      cache = r.data || [];
      var sources = Object.keys(cache.reduce(function (a, l) { if (l.source) a[l.source] = 1; return a; }, {}));
      var stOpts = '<option value="">כל הסטטוסים</option>' + STATUSES.map(function (s) { return '<option value="' + s.k + '">' + s.icon + ' ' + esc(s.label) + '</option>'; }).join('');
      var srcOpts = '<option value="">כל המקורות</option>' + sources.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
      view(
        '<div class="card"><div class="row-between"><h3>לידים (' + cache.length + ')</h3>' +
        '<div><input class="inp" id="lq" placeholder="חיפוש שם/טלפון/רכב" style="width:200px"> ' +
        '<select id="lst">' + stOpts + '</select> <select id="lsrc">' + srcOpts + '</select> ' +
        '<button class="btn btn-sm" id="lcsv">CSV</button></div></div>' +
        '<div class="table-scroll" id="ltbl"></div></div>'
      );
      ['lq', 'lst', 'lsrc'].forEach(function (id) { C.$(id).addEventListener('input', draw); });
      C.$('lcsv').addEventListener('click', function () { window.C2B_exportLeads && window.C2B_exportLeads(filtered()); });
      draw();
    });
  };
  function filtered() {
    var q = (C.$('lq') && C.$('lq').value || '').trim().toLowerCase();
    var st = C.$('lst') && C.$('lst').value, src = C.$('lsrc') && C.$('lsrc').value;
    return cache.filter(function (l) {
      if (st && (l.status || 'new') !== st) return false;
      if (src && l.source !== src) return false;
      if (q && !((l.name || '') + ' ' + (l.phone || '') + ' ' + (l.car || '')).toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function draw() {
    var rows = filtered().map(function (l) {
      return '<tr style="cursor:pointer" data-lead="' + l.id + '"><td>' + fmt(l.created_at) + '</td><td><b>' + esc(l.name) + '</b></td><td>' +
        esc(l.phone) + '</td><td>' + esc(l.car) + '</td><td><span class="tag">' + esc(l.source) + '</span></td><td>' + badge(l.status || 'new') + '</td></tr>';
    }).join('');
    C.$('ltbl').innerHTML = '<table><thead><tr><th>תאריך</th><th>שם</th><th>טלפון</th><th>רכב</th><th>מקור</th><th>סטטוס</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="muted">אין לידים תואמים</td></tr>') + '</tbody></table>';
    C.$('ltbl').querySelectorAll('tr[data-lead]').forEach(function (tr) {
      tr.addEventListener('click', function () { window.C2B_openLeadCard(tr.dataset.lead); });
    });
  }

  // ---------- LEAD CARD ----------
  window.C2B_openLeadCard = function (id) {
    loading();
    Promise.all([
      db.from('leads').select('*').eq('id', id).single(),
      db.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('tasks').select('*').eq('lead_id', id).order('due_at', { ascending: true }),
      db.from('lead_documents').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var lead = res[0].data, acts = res[1].data || [], tasks = res[2].data || [], docs = res[3].data || [];
      view(
        '<button class="btn btn-ghost btn-sm" id="backList">← חזרה לרשימה</button>' +
        '<div class="card" style="margin-top:12px"><div class="row-between"><div><h3 style="margin:0">' + esc(lead.name || 'ליד') + '</h3>' +
        '<div class="muted" style="font-size:14px">' + esc(lead.phone) + (lead.email ? ' · ' + esc(lead.email) : '') + (lead.car ? ' · ' + esc(lead.car) : '') + '</div></div>' +
        '<div>' + badge(lead.status || 'new') + '</div></div>' + pipeline(lead.status || 'new') + '</div>' +
        '<div class="grid2">' +
          '<div>' +
            '<div class="card"><h3>סטטוס ופעולות</h3>' + statusControls(lead) + '</div>' +
            '<div class="card"><div class="row-between"><h3>משימות ותזכורות</h3></div><div id="taskList">' + taskList(tasks) + '</div>' +
              '<form id="taskForm" style="display:flex;gap:8px;margin-top:10px"><input class="inp" name="title" placeholder="משימה חדשה…" style="flex:1"><input class="inp" name="due" type="datetime-local" style="width:180px"><button class="btn btn-sm">הוסף</button></form></div>' +
            '<div class="card"><h3>מסמכים</h3><div id="docList">' + docList(docs) + '</div>' +
              '<input type="file" id="docUp" style="margin-top:10px"></div>' +
          '</div>' +
          '<div class="card"><h3>ציר זמן</h3>' +
            '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">' +
              actBtn('note', 'הערה') + actBtn('call', 'תיעוד שיחה') + actBtn('whatsapp', 'WhatsApp') + actBtn('email', 'מייל') +
            '</div><form id="actForm" style="display:none;margin-bottom:12px"><textarea class="inp" name="body" rows="2" style="width:100%" placeholder="תוכן…"></textarea><input type="hidden" name="type"><div style="margin-top:6px"><button class="btn btn-sm">שמור</button> <button type="button" class="btn btn-ghost btn-sm" id="actCancel">ביטול</button></div></form>' +
            '<div id="timeline">' + timeline(acts) + '</div>' +
          '</div>' +
        '</div>'
      );
      C.$('backList').addEventListener('click', window.C2B_renderLeads);
      bindCard(lead);
    });
  };

  function pipeline(cur) {
    var idx = FLOW.map(function (s) { return s.k; }).indexOf(cur);
    var lost = cur === 'lost' || cur === 'no_answer';
    return '<div style="display:flex;gap:6px;overflow-x:auto;margin-top:16px;padding-bottom:4px">' + FLOW.map(function (s, i) {
      var state = lost ? (i === 0 ? 'red' : 'gray') : (i < idx ? 'green' : i === idx ? 'blue' : 'gray');
      var bg = { gray: 'var(--panel2)', blue: s.color, green: '#2ec46b', red: '#e2555a' }[state];
      var fg = state === 'gray' ? 'var(--muted)' : '#fff';
      return '<div style="flex:1;min-width:96px;text-align:center;background:' + bg + ';color:' + fg + ';border-radius:8px;padding:8px 6px;font-size:12px;font-weight:600">' + s.icon + '<br>' + esc(s.label) + '</div>';
    }).join('<div style="align-self:center;color:var(--muted)">›</div>') + '</div>';
  }

  function statusControls(lead) {
    var opts = STATUSES.map(function (s) { return '<option value="' + s.k + '"' + ((lead.status || 'new') === s.k ? ' selected' : '') + '>' + s.icon + ' ' + esc(s.label) + '</option>'; }).join('');
    var reason = (lead.status === 'lost') ? '<div class="field" style="margin-top:10px"><label>סיבת סגירה</label><select class="inp" id="stReason" style="width:100%"><option value="">בחר…</option>' +
      CLOSE_REASONS.map(function (r) { return '<option' + (lead.close_reason === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') + '</select></div>' : '';
    return '<div class="field"><label>שינוי סטטוס</label><select class="inp" id="stSel" style="width:100%">' + opts + '</select></div>' + reason;
  }

  function timeline(acts) {
    if (!acts.length) return '<p class="muted">אין עדיין פעולות</p>';
    return acts.map(function (a) {
      return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><div style="font-size:18px">' + (ACT_ICON[a.type] || '•') +
        '</div><div style="flex:1"><div style="font-size:12px;color:var(--muted)">' + fmt(a.created_at) + '</div>' +
        (a.body ? '<div>' + esc(a.body) + '</div>' : '') + '</div></div>';
    }).join('');
  }
  function taskList(tasks) {
    if (!tasks.length) return '<p class="muted">אין משימות</p>';
    return tasks.map(function (t) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '>' +
        '<span style="flex:1' + (t.done ? ';text-decoration:line-through;color:var(--muted)' : '') + '">' + esc(t.title) + '</span>' +
        (t.due_at ? '<span class="muted" style="font-size:12px">' + fmt(t.due_at) + '</span>' : '') + '</div>';
    }).join('');
  }
  function docList(docs) {
    if (!docs.length) return '<p class="muted">אין מסמכים</p>';
    return docs.map(function (d) { return '<div style="padding:5px 0"><a href="#" data-doc="' + esc(d.storage_path) + '">📎 ' + esc(d.name) + '</a></div>'; }).join('');
  }
  function actBtn(type, label) { return '<button class="btn btn-ghost btn-sm" data-act="' + type + '">' + (ACT_ICON[type] || '') + ' ' + label + '</button>'; }

  function logActivity(leadId, type, body, meta) {
    return db.from('activities').insert({ lead_id: leadId, type: type, body: body || null, meta: meta || null });
  }

  function bindCard(lead) {
    // status change
    C.$('stSel').addEventListener('change', function () {
      var to = this.value, s = stDef(to);
      var patch = { status: to, status_changed_at: new Date().toISOString() };
      if (to === 'in_progress' && !lead.first_response_at) patch.first_response_at = new Date().toISOString();
      db.from('leads').update(patch).eq('id', lead.id).then(function (u) {
        if (u.error) return alert('שגיאה: ' + u.error.message);
        logActivity(lead.id, 'status_change', 'סטטוס שונה ל: ' + s.label).then(function () { window.C2B_openLeadCard(lead.id); });
      });
    });
    // add activity (note/call/whatsapp/email)
    C.$('view').querySelectorAll('button[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = C.$('actForm'); f.style.display = 'block'; f.querySelector('[name=type]').value = b.dataset.act;
        f.querySelector('[name=body]').focus();
      });
    });
    C.$('actCancel').addEventListener('click', function () { C.$('actForm').style.display = 'none'; });
    C.$('actForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var type = this.type.value, body = this.body.value.trim();
      if (!body) return;
      logActivity(lead.id, type, body).then(function (r) {
        if (r.error) return alert('שגיאה: ' + r.error.message);
        window.C2B_openLeadCard(lead.id);
      });
    });
    // tasks
    C.$('taskForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = this.title.value.trim(); if (!title) return;
      db.from('tasks').insert({ lead_id: lead.id, title: title, due_at: this.due.value ? new Date(this.due.value).toISOString() : null }).then(function (r) {
        if (r.error) return alert('שגיאה: ' + r.error.message);
        logActivity(lead.id, 'task', 'נפתחה משימה: ' + title);
        window.C2B_openLeadCard(lead.id);
      });
    });
    C.$('taskList').querySelectorAll('input[data-task]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        db.from('tasks').update({ done: cb.checked }).eq('id', cb.dataset.task);
      });
    });
    // documents
    C.$('docUp').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      var path = lead.id + '/' + Date.now() + '_' + file.name;
      db.storage.from('lead-docs').upload(path, file).then(function (u) {
        if (u.error) return alert('העלאה נכשלה: ' + u.error.message);
        db.from('lead_documents').insert({ lead_id: lead.id, name: file.name, storage_path: path }).then(function () {
          logActivity(lead.id, 'document', 'הועלה מסמך: ' + file.name);
          window.C2B_openLeadCard(lead.id);
        });
      });
    });
    C.$('docList').querySelectorAll('a[data-doc]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        db.storage.from('lead-docs').createSignedUrl(a.dataset.doc, 300).then(function (r) {
          if (r.data && r.data.signedUrl) window.open(r.data.signedUrl, '_blank');
        });
      });
    });
    // close reason
    var rs = C.$('stReason');
    if (rs) rs.addEventListener('change', function () { db.from('leads').update({ close_reason: rs.value }).eq('id', lead.id); });
  }

  // ---------- MANAGER DASHBOARD ----------
  window.C2B_renderDashboard = function () {
    loading();
    Promise.all([
      db.from('leads').select('status,source,created_at,first_response_at'),
      db.from('tasks').select('title,due_at,done'),
      db.from('appointments').select('appt_date,status')
    ]).then(function (res) {
      var leads = res[0].data || [], tasks = res[1].data || [], appts = res[2].data || [];
      var by = {}; STATUSES.forEach(function (s) { by[s.k] = 0; });
      leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var won = by.won || 0, lost = by.lost || 0;
      var conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
      // avg response time (min) from created→first_response
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
      var openTasks = tasks.filter(function (t) { return !t.done; }).length;
      var bySource = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; bySource[s] = (bySource[s] || 0) + 1; });
      var topSrc = Object.keys(bySource).sort(function (a, b) { return bySource[b] - bySource[a]; }).slice(0, 6);
      var stat = C.stat;

      view(
        '<div class="cards">' +
          stat('סה"כ לידים', leads.length, true) +
          stat('חדשים', by.new || 0) +
          stat('בטיפול', by.in_progress || 0) +
          stat('פגישות נקבעו', by.meeting_set || 0) +
          stat('נסגרו', won) +
          stat('יחס המרה', conv + '%') +
          stat('זמן תגובה ממוצע', avgRt ? avgRt + ' דק\'' : '—') +
          stat('משימות פתוחות', openTasks) +
        '</div>' +
        '<div class="grid2">' +
          '<div class="card"><h3>לידים לפי סטטוס</h3><div class="table-scroll"><table><tbody>' +
            STATUSES.map(function (s) { return '<tr><td>' + badge(s.k) + '</td><td>' + (by[s.k] || 0) + '</td></tr>'; }).join('') +
          '</tbody></table></div></div>' +
          '<div class="card"><h3>מקורות מובילים</h3><div class="table-scroll"><table><tbody>' +
            (topSrc.map(function (s) { return '<tr><td>' + esc(s) + '</td><td>' + bySource[s] + '</td></tr>'; }).join('') || '<tr><td class="muted">אין נתונים</td></tr>') +
          '</tbody></table></div></div>' +
        '</div>'
      );
    }).catch(function (e) { errBox(e.message || e); });
  };

  // CSV export for leads (extends the base one with CRM fields)
  window.C2B_exportLeads = function (rows) {
    if (!rows.length) { alert('אין נתונים לייצוא'); return; }
    var cols = ['created_at', 'name', 'phone', 'email', 'car', 'source', 'status', 'message'];
    function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
    var csv = cols.join(',') + '\n' + rows.map(function (r) {
      return cols.map(function (c) { return cell(r[c]); }).join(',');
    }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'car2buy-leads-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  };
})();
