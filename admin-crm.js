/* ============================================================
   Car2Buy — CRM module: clean leads table, full-page lead view
   (prev/next, clickable status, quick actions, car picker, timeline),
   manager dashboard, and a status menu reusable anywhere. window.C2B.
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
  var DEAL_STAGES = [
    { k: 'initial', label: 'עסקה ראשונית', color: '#3b82f6' },
    { k: 'screening', label: 'שיחת שיקוף', color: '#6366f1' },
    { k: 'submitted', label: 'הוגש למימון', color: '#8b5cf6' },
    { k: 'approved', label: 'אושר מימון', color: '#0ea5e9' },
    { k: 'signed', label: 'נחתם מימון', color: '#f5691e' },
    { k: 'collection', label: 'שיחת גבייה', color: '#eab308' },
    { k: 'ordered', label: 'הזמנת רכב', color: '#14b8a6' },
    { k: 'delivered', label: 'רכב נמסר', color: '#16a34a' }
  ];
  function stageDef(k) { for (var i = 0; i < DEAL_STAGES.length; i++) if (DEAL_STAGES[i].k === k) return DEAL_STAGES[i]; return DEAL_STAGES[0]; }
  // sync ONLY the closing of the deal to the sales lead status — intermediate
  // file-manager stages do NOT auto-change the sales agent's status.
  var STAGE_TO_STATUS = { delivered: 'won' };
  function syncLeadFromStage(lead, stage) {
    var target = STAGE_TO_STATUS[stage];
    if (!target || lead.status === target) return;
    var from = lead.status;
    changeStatus(lead.id, target, { status: from }, function () {
      if (stage === 'delivered') logActivity(lead.id, 'system', '🎉 העסקה נסגרה — הרכב נמסר ללקוח');
    });
    lead.status = target;
  }
  var CHECKLIST_ITEMS = ['התקבל הסכם', 'התקבלה ת"ז', 'התקבל רישיון נהיגה', 'התקבלו תלושי שכר', 'התקבלו דפי בנק', 'נבדקו מסמכים', 'נשלח למימון', 'התקבל אישור מימון', 'נשלחה פוליסה', 'הוזמן רכב', 'תואמה מסירה'];
  // מנהלת תיקי לקוחות מטפלת רק באיסוף המסמכים — שלבי המימון/פוליסה/הזמנה/מסירה מוסתרים מהתצוגה שלה
  var FILE_CHECKLIST_ITEMS = ['התקבל הסכם', 'התקבלה ת"ז', 'התקבל רישיון נהיגה', 'התקבלו תלושי שכר', 'התקבלו דפי בנק', 'נבדקו מסמכים'];
  function stageBar(cur) {
    var idx = DEAL_STAGES.map(function (s) { return s.k; }).indexOf(cur);
    return DEAL_STAGES.map(function (s, i) {
      var state = i < idx ? 'green' : i === idx ? 'cur' : 'gray';
      var bg = { gray: 'var(--surface-2)', cur: s.color, green: '#16a34a' }[state];
      return '<div class="st" data-stage="' + s.k + '" style="cursor:pointer;background:' + bg + ';color:' + (state === 'gray' ? 'var(--muted)' : '#fff') + '">' + esc(s.label) + '</div>';
    }).join('');
  }
  function stageBadge(k) { var s = stageDef(k); return '<span class="stage-pill" style="border-color:' + s.color + ';color:' + s.color + ';background:' + s.color + '14"><span class="sd" style="background:' + s.color + '"></span>' + esc(s.label) + '</span>'; }
  var ACT_ICON = { note: '🗒️', call: '📞', whatsapp: '💬', email: '📧', sms: '✉️', status_change: '🔄', task: '✔️', meeting: '📅', document: '📎', quote: '📄', contract: '✍️', car: '🚗', system: '⚙️' };

  function badge(k, clickable, leadId) { var s = stDef(k); return '<span class="tag' + (clickable ? ' click" data-st-lead="' + leadId + '" data-cur="' + k : '') + '" style="border-color:' + s.color + ';color:' + s.color + ';background:' + s.color + '18">' + s.icon + ' ' + esc(s.label) + (clickable ? ' ▾' : '') + '</span>'; }
  function initials(name) { return String(name || '?').trim().split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('') || '?'; }
  function waIntl(phone) { var p = String(phone || '').replace(/\D/g, ''); if (p.charAt(0) === '0') p = '972' + p.slice(1); return p; }
  function waLink(phone) { var p = waIntl(phone); return p ? 'https://wa.me/' + p : null; }
  function logActivity(id, type, body, meta) { return db.from('activities').insert({ lead_id: id, type: type, body: body || null, meta: meta || null, created_by: C.userId || null }); }

  // ---- reusable status menu (status changeable from anywhere) ----
  function closeStMenu() { var m = document.getElementById('stmenu'); if (m) m.remove(); }
  function openStatusMenu(anchor, current, onPick) {
    closeStMenu();
    var m = document.createElement('div'); m.className = 'stmenu'; m.id = 'stmenu';
    m.innerHTML = STATUSES.map(function (s) { return '<div class="si" data-k="' + s.k + '" style="color:' + s.color + '">' + s.icon + ' ' + esc(s.label) + (s.k === current ? ' ✓' : '') + '</div>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 4) + 'px';
    m.style.left = Math.max(8, r.left + window.scrollX - 60) + 'px';
    m.querySelectorAll('.si').forEach(function (si) { si.addEventListener('click', function (e) { e.stopPropagation(); onPick(si.dataset.k); closeStMenu(); }); });
    setTimeout(function () { document.addEventListener('click', closeStMenu, { once: true }); }, 0);
  }
  // ---- quick-assign a lead to a salesperson (from the leads table) ----
  function closeAssignMenu() { var m = document.getElementById('assignmenu'); if (m) m.remove(); }
  function openAssignMenu(anchor, leadId, current, onPick) {
    closeAssignMenu();
    var m = document.createElement('div'); m.className = 'stmenu'; m.id = 'assignmenu'; m.style.minWidth = '190px';
    var uids = Object.keys(profiles);
    m.innerHTML = '<div class="si" data-uid="" style="color:var(--muted)">— בטל שיוך —</div>' +
      (uids.length ? uids.map(function (uid) { return '<div class="si" data-uid="' + uid + '"><span class="avatar" style="width:22px;height:22px;font-size:11px;margin-inline-end:7px">' + esc(initials(profiles[uid])) + '</span>' + esc(profiles[uid]) + (uid === current ? ' ✓' : '') + '</div>'; }).join('') : '<div class="si muted">אין סוכנים זמינים</div>');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 4) + 'px';
    m.style.left = Math.max(8, r.left + window.scrollX - 40) + 'px';
    m.querySelectorAll('.si[data-uid]').forEach(function (si) { si.addEventListener('click', function (e) { e.stopPropagation(); onPick(si.dataset.uid); closeAssignMenu(); }); });
    setTimeout(function () { document.addEventListener('click', closeAssignMenu, { once: true }); }, 0);
  }
  function assignChip(l) {
    var name = profiles[l.assigned_to];
    var inner = name ? '<span class="avatar">' + esc(initials(name)) + '</span> ' + esc(name) : '<span class="muted">🔗 שייך לסוכן</span>';
    return '<span class="assign-chip" data-assign="' + l.id + '" data-cur="' + (l.assigned_to || '') + '" title="שיוך לסוכן מכירות">' + inner + ' <span class="muted">▾</span></span>';
  }
  function assignLead(leadId, uid) {
    db.from('leads').update({ assigned_to: uid || null }).eq('id', leadId).then(function (r) {
      if (r.error) return alert('שגיאה בשיוך: ' + r.error.message);
      logActivity(leadId, 'system', uid ? ('שויך לסוכן: ' + (profiles[uid] || '')) : 'בוטל שיוך הסוכן');
      window.C2B_renderLeads(curFilter);
    });
  }
  function changeStatus(leadId, to, lead, after) {
    var from = lead && lead.status;
    var patch = { status: to, status_changed_at: new Date().toISOString() };
    if (to === 'in_progress' && (!lead || !lead.first_response_at)) patch.first_response_at = new Date().toISOString();
    db.from('leads').update(patch).eq('id', leadId).then(function (u) {
      if (u.error) return alert('שגיאה: ' + u.error.message);
      logActivity(leadId, 'status_change', from ? ('סטטוס: ' + stDef(from).label + ' → ' + stDef(to).label) : ('סטטוס שונה ל: ' + stDef(to).label)).then(function () { if (after) after(); });
    });
  }

  // admin-managed dropdown options for a field (or null → free-text filter)
  function listOpts(field) { var vs = (C.lists && C.lists[field]) || []; return vs.length ? [{ v: '', l: '— הכל —' }].concat(vs.map(function (v) { return { v: v, l: v }; })) : null; }

  // ---- car catalog cache (for the deal / car picker) ----
  var carsCache = null;
  function loadCars(cb) { if (carsCache) return cb(carsCache); fetch('cars.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (c) { carsCache = c || []; cb(carsCache); }).catch(function () { cb([]); }); }

  // ---------- LEADS TABLE ----------
  var cache = [], profiles = {}, orderIds = [], curFilter = null, curDeals = [], leadFilter = null, selectedLeads = {};
  window.C2B_renderLeads = function (statusFilter) {
    curFilter = statusFilter || null; selectedLeads = {};
    loading();
    Promise.all([
      db.from('leads').select('*').order('created_at', { ascending: false }),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      cache = res[0].data || [];
      profiles = {}; (res[1].data || []).forEach(function (p) { profiles[p.user_id] = p.full_name; });
      leadFilter = C.makeFilter([
        { key: 'name', label: 'שם לקוח' }, { key: 'phone', label: 'טלפון' }, { key: 'email', label: 'אימייל' },
        { key: 'car', label: 'רכב' }, { key: 'brand', label: 'מותג', options: listOpts('brand') },
        { key: 'status', label: 'סטטוס', options: STATUSES.map(function (s) { return { v: s.k, l: s.label }; }) },
        { key: 'source', label: 'מקור הגעה', options: listOpts('source') }, { key: 'marketing_company', label: 'חברת שיווק', options: listOpts('marketing_company') },
        { key: 'utm_source', label: 'utm_source', options: listOpts('utm_source') }, { key: 'utm_campaign', label: 'utm_campaign' }, { key: 'utm_medium', label: 'utm_medium' },
        { key: 'ad_group', label: 'ad_group' }, { key: 'city', label: 'עיר' },
        { key: 'assigned', label: 'איש מכירות', get: function (l) { return profiles[l.assigned_to] || ''; } }
      ], draw);
      var title = statusFilter ? stDef(statusFilter).label : 'כל הלידים';
      view('<div class="card"><div class="row-between"><h3>' + esc(title) + ' <span class="muted" id="lcount"></span></h3>' +
        '<div><input class="inp" id="lq" placeholder="חיפוש חופשי…" style="width:170px"> <button class="btn btn-sm" id="lnew">+ ליד חדש</button> <button class="btn btn-ghost btn-sm" id="lcsv">CSV</button></div></div>' +
        '<div id="leadsBody"></div></div>');
      C.$('lnew').addEventListener('click', newLeadForm);
      C.$('lq').addEventListener('input', draw);
      C.$('lcsv').addEventListener('click', function () { C.exportCsv(listRows(), ['created_at', 'name', 'phone', 'email', 'car', 'source', 'status', 'city', 'brand', 'marketing_company', 'utm_source', 'utm_campaign', 'message'], 'car2buy-leads'); });
      draw();
    });
  };
  function listRows() {
    var q = (C.$('lq') && C.$('lq').value || '').trim().toLowerCase();
    return cache.filter(function (l) {
      if (curFilter && (l.status || 'new') !== curFilter) return false;
      if (q && !((l.name || '') + ' ' + (l.phone || '') + ' ' + (l.car || '')).toLowerCase().includes(q)) return false;
      if (leadFilter && !leadFilter.match(l)) return false;
      return true;
    });
  }
  function draw() {
    var rows = listRows();
    orderIds = rows.map(function (l) { return l.id; });
    if (C.$('lcount')) C.$('lcount').textContent = '(' + rows.length + ')';
    var body = rows.map(function (l) {
      var wa = waLink(l.phone);
      return '<tr data-lead="' + l.id + '"><td style="width:30px;text-align:center"><input type="checkbox" data-sel="' + l.id + '"' + (selectedLeads[l.id] ? ' checked' : '') + '></td>' +
        '<td style="cursor:pointer" data-open="1"><span class="avatar" style="margin-inline-end:8px">' + esc(initials(l.name)) + '</span><b>' + esc(l.name) + '</b></td>' +
        '<td>' + esc(l.phone) + '</td><td>' + (wa ? '<a class="wa-ic" href="' + wa + '" target="_blank" rel="noopener" title="פתח וואטסאפ" onclick="event.stopPropagation()">💬</a>' : '—') + '</td>' +
        '<td><span class="tag">' + esc(l.source) + '</span></td><td>' + esc(l.car) + '</td>' +
        '<td>' + assignChip(l) + '</td><td>' + badge(l.status || 'new', true, l.id) + '</td><td class="muted">' + fmt(l.updated_at || l.status_changed_at || l.created_at) + '</td></tr>';
    }).join('') || '<tr><td colspan="9" class="empty">אין לידים</td></tr>';
    var agentOpts = Object.keys(profiles).map(function (uid) { return '<option value="' + uid + '">' + esc(profiles[uid]) + '</option>'; }).join('');
    var srcList = ((C.lists && C.lists.source) || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('');
    var brandList = ((C.lists && C.lists.brand) || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('');
    var bulkBar = '<div id="bulkBar" class="filterbar" style="display:none;background:var(--brand-soft);align-items:center">' +
      '<b id="bulkCount" style="color:var(--brand)">נבחרו 0</b>' +
      '<select id="bulkAgent"><option value="">👤 שייך לסוכן…</option>' + agentOpts + '</select>' +
      '<select id="bulkStatus"><option value="">🏷️ שנה סטטוס…</option>' + STATUSES.map(function (s) { return '<option value="' + s.k + '">' + esc(s.label) + '</option>'; }).join('') + '</select>' +
      '<input id="bulkSource" list="bulkSrcL" placeholder="📍 מקור הגעה" style="width:130px"><datalist id="bulkSrcL">' + srcList + '</datalist>' +
      '<input id="bulkBrand" list="bulkBrandL" placeholder="🚗 מותג" style="width:120px"><datalist id="bulkBrandL">' + brandList + '</datalist>' +
      '<button class="btn btn-sm" id="bulkApply">החל</button><button class="btn btn-ghost btn-sm" id="bulkDel" style="color:var(--danger);border-color:var(--danger)">🗑️ מחק</button><button class="btn btn-ghost btn-sm" id="bulkClear">בטל בחירה</button></div>';
    C.$('leadsBody').innerHTML = (leadFilter ? leadFilter.render() : '') + bulkBar +
      '<div class="table-scroll"><table><thead><tr><th style="width:30px;text-align:center"><input type="checkbox" id="selAll" title="בחר הכל"></th><th>שם</th><th>טלפון</th><th>וואטסאפ</th><th>מקור</th><th>רכב</th><th>איש מכירות</th><th>סטטוס</th><th>עדכון</th></tr></thead><tbody id="ltbl">' + body + '</tbody></table></div>';
    if (leadFilter) leadFilter.bind();
    bindBulk();
    C.$('ltbl').querySelectorAll('td[data-open]').forEach(function (td) { td.addEventListener('click', function () { window.C2B_openLeadCard(td.parentNode.dataset.lead); }); });
    C.$('ltbl').querySelectorAll('.tag.click').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); openStatusMenu(el, el.dataset.cur, function (to) { changeStatus(el.dataset.stLead, to, { status: el.dataset.cur }, function () { window.C2B_renderLeads(curFilter); }); }); });
    });
    C.$('ltbl').querySelectorAll('.assign-chip').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); openAssignMenu(el, el.dataset.assign, el.dataset.cur, function (uid) { assignLead(el.dataset.assign, uid); }); });
    });
  }
  // ---- bulk selection + actions (assign / status / source / brand) ----
  function bindBulk() {
    var $ = C.$;
    function ids() { return Object.keys(selectedLeads).filter(function (k) { return selectedLeads[k]; }); }
    function update() {
      var n = ids().length, bar = $('bulkBar'); if (!bar) return;
      bar.style.display = n ? 'flex' : 'none';
      if ($('bulkCount')) $('bulkCount').textContent = 'נבחרו ' + n;
      var sa = $('selAll'); if (sa) { var boxes = $('ltbl').querySelectorAll('input[data-sel]'), checked = $('ltbl').querySelectorAll('input[data-sel]:checked'); sa.checked = boxes.length && checked.length === boxes.length; sa.indeterminate = checked.length > 0 && checked.length < boxes.length; }
    }
    $('ltbl').querySelectorAll('input[data-sel]').forEach(function (cb) { cb.addEventListener('change', function () { if (cb.checked) selectedLeads[cb.dataset.sel] = true; else delete selectedLeads[cb.dataset.sel]; update(); }); });
    if ($('selAll')) $('selAll').addEventListener('change', function () { var on = this.checked; $('ltbl').querySelectorAll('input[data-sel]').forEach(function (cb) { cb.checked = on; if (on) selectedLeads[cb.dataset.sel] = true; else delete selectedLeads[cb.dataset.sel]; }); update(); });
    if ($('bulkClear')) $('bulkClear').addEventListener('click', function () { selectedLeads = {}; $('ltbl').querySelectorAll('input[data-sel]').forEach(function (cb) { cb.checked = false; }); update(); });
    if ($('bulkDel')) $('bulkDel').addEventListener('click', function () {
      var list = ids(); if (!list.length) return;
      if (!confirm('למחוק ' + list.length + ' לידים? כולל כל הפעילות, המסמכים והעסקאות שלהם. פעולה בלתי הפיכה.')) return;
      db.from('leads').delete().in('id', list).then(function (r) {
        if (r.error) { alert('שגיאה במחיקה: ' + r.error.message); return; }
        selectedLeads = {}; C.refreshBadges && C.refreshBadges(); window.C2B_renderLeads(curFilter);
      });
    });
    if ($('bulkApply')) $('bulkApply').addEventListener('click', function () {
      var list = ids(); if (!list.length) return;
      var patch = {};
      if ($('bulkAgent').value) patch.assigned_to = $('bulkAgent').value;
      if ($('bulkStatus').value) { patch.status = $('bulkStatus').value; patch.status_changed_at = new Date().toISOString(); }
      if ($('bulkSource').value.trim()) patch.source = $('bulkSource').value.trim();
      if ($('bulkBrand').value.trim()) patch.brand = $('bulkBrand').value.trim();
      if (!Object.keys(patch).length) { alert('בחרו פעולה: סוכן / סטטוס / מקור / מותג'); return; }
      if (!confirm('להחיל את השינוי על ' + list.length + ' לידים?')) return;
      $('bulkApply').disabled = true;
      db.from('leads').update(patch).in('id', list).then(function (r) {
        if (r.error) { $('bulkApply').disabled = false; alert('שגיאה: ' + r.error.message); return; }
        var summ = []; if (patch.assigned_to) summ.push('שויך ל-' + (profiles[patch.assigned_to] || '')); if (patch.status) summ.push('סטטוס: ' + stDef(patch.status).label); if (patch.source) summ.push('מקור: ' + patch.source); if (patch.brand) summ.push('מותג: ' + patch.brand);
        db.from('activities').insert(list.map(function (id) { return { lead_id: id, type: 'system', body: 'עדכון קבוצתי — ' + summ.join(', '), created_by: C.userId || null }; }));
        selectedLeads = {}; window.C2B_renderLeads(curFilter);
      });
    });
    update();
  }

  // ---------- NEW LEAD (create from scratch) ----------
  function newLeadForm() {
    var lists = (C.lists || {});
    function dl(id, arr) { return '<datalist id="' + id + '">' + (arr || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('') + '</datalist>'; }
    function fld(label, id, type, list) { return '<div class="field"><label>' + label + '</label><input class="inp" id="' + id + '" type="' + (type || 'text') + '"' + (list ? ' list="' + list + '"' : '') + ' style="width:100%">' + (list ? dl(list, lists[id.replace('nl_', '')]) : '') + '</div>'; }
    view('<div class="lead-top"><button class="btn btn-ghost btn-sm" id="nlBack">→ לרשימה</button><h3 style="margin:0">➕ ליד חדש</h3></div>' +
      '<div class="card" style="max-width:640px"><div class="grid2">' +
        fld('שם לקוח', 'nl_name') + fld('טלפון ראשי', 'nl_phone', 'tel') + fld('דואר אלקטרוני', 'nl_email', 'email') + fld('באיזה רכב מתעניין', 'nl_car') +
        fld('מותג', 'nl_brand', 'text', 'dlB') + fld('מקור הגעה', 'nl_source', 'text', 'dlS') + fld('כתובת - עיר', 'nl_city') +
      '</div><div style="margin-top:14px"><button class="btn" id="nlSave">צור ליד ופתח כרטיס</button> <span id="nlMsg" class="muted" style="font-size:13px;margin-inline-start:8px"></span></div></div>');
    C.$('nlBack').addEventListener('click', function () { window.C2B_renderLeads(curFilter); });
    C.$('nlSave').addEventListener('click', function () {
      var name = C.$('nl_name').value.trim(), phone = C.$('nl_phone').value.trim(), msg = C.$('nlMsg');
      if (!name && !phone) { msg.style.color = 'var(--danger)'; msg.textContent = 'נא למלא לפחות שם או טלפון'; return; }
      msg.style.color = 'var(--muted)'; msg.textContent = 'יוצר…';
      var payload = { name: name || null, phone: phone || null, email: C.$('nl_email').value.trim() || null, car: C.$('nl_car').value.trim() || null, brand: C.$('nl_brand').value.trim() || null, source: C.$('nl_source').value.trim() || 'ידני', city: C.$('nl_city').value.trim() || null, status: 'new', assigned_to: C.userId || null };
      db.from('leads').insert(payload).select('id').single().then(function (r) {
        if (r.error) { msg.style.color = 'var(--danger)'; msg.textContent = 'שגיאה: ' + r.error.message; return; }
        C.refreshBadges && C.refreshBadges();
        window.C2B_openLeadCard(r.data.id);
      });
    });
  }

  // ---------- FULL LEAD PAGE ----------
  // ---- consolidated, role-tailored action set (all actions in ONE bar) ----
  var LEAD_ACTIONS = [
    { k: 'call', icon: '📞', label: 'התקשר', roles: ['admin', 'sales', 'files'] },
    { k: 'wa', icon: '💬', label: 'WhatsApp', roles: ['admin', 'sales', 'files'] },
    { k: 'mail', icon: '📧', label: 'מייל', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'note', icon: '📝', label: 'הערה', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'task', icon: '✅', label: 'משימה', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'doc', icon: '📎', label: 'מסמך', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'meeting', icon: '📅', label: 'קבע פגישה', roles: ['admin', 'sales', 'files'] },
    { k: 'car', icon: '🚗', label: 'בחר רכב', roles: ['admin', 'sales'] },
    { k: 'deal', icon: '💰', label: 'סגירת עסקה', roles: ['admin', 'sales', 'files'] },
    { k: 'contract', icon: '✍', label: 'הסכם', roles: ['admin', 'sales', 'files'] }
  ];
  function roleShort(role) { return { sales: 'מכירות', files: 'תיקי לקוחות', accounting: 'הנה״ח' }[role] || ''; }
  // customizable action bar (order / labels / visibility) — stored per browser
  function getActionCfg() {
    var def = LEAD_ACTIONS.map(function (a) { return { k: a.k, label: a.label, on: true }; });
    try {
      var saved = JSON.parse(localStorage.getItem('c2b_lead_actions') || 'null');
      if (!saved || !saved.length) return def;
      var byK = {}; saved.forEach(function (s) { byK[s.k] = s; });
      var merged = saved.filter(function (s) { return LEAD_ACTIONS.some(function (a) { return a.k === s.k; }); });
      def.forEach(function (d) { if (!byK[d.k]) merged.push(d); });   // append newly-added actions
      return merged;
    } catch (e) { return def; }
  }
  C.leadActionsMeta = LEAD_ACTIONS.map(function (a) { return { k: a.k, icon: a.icon, label: a.label }; });
  C.getActionCfg = getActionCfg;
  C.saveActionCfg = function (cfg) { try { localStorage.setItem('c2b_lead_actions', JSON.stringify(cfg)); } catch (e) {} };
  C.resetActionCfg = function () { try { localStorage.removeItem('c2b_lead_actions'); } catch (e) {} };
  function docIsImage(name) { return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || ''); }
  // Supabase storage keys must be ASCII-safe — sanitize the filename (Hebrew/spaces → _)
  function safeStoragePath(leadId, name) {
    var safe = String(name || 'file').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'file';
    return leadId + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + safe;
  }
  // only allow http(s) links — page_url comes from anon lead inserts (untrusted),
  // so reject javascript:/data:/vbscript: before it reaches an href sink.
  function safeHttpUrl(u) { try { var p = new URL(u); return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : ''; } catch (e) { return ''; } }

  // מנהלת תיקי לקוחות נכנסת ישר לתצוגת התיק (הלשוניות), לא לכרטיס הסוכן
  function openFileView(id) {
    loading();
    Promise.all([
      db.from('leads').select('*').eq('id', id).single(),
      db.from('deals').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (r) {
      if (r[0].error) return errBox(r[0].error.message);
      var lead = r[0].data, deals = (r[1] && r[1].data) || [];
      if (r[2] && r[2].data) { profiles = {}; r[2].data.forEach(function (p) { profiles[p.user_id] = p.full_name; }); }
      curDeals = deals;
      dealForm(lead, deals[0] || null, true);   // אם אין עסקה — טופס תיק חדש למילוי
      deals.forEach(function (dd) { if (dd.signature) ensureSignedPdf(lead, dd, function () { openFileView(id); }); });
    });
  }
  // open a specific deal's file view (used from the file-manager list)
  window.C2B_openDeal = function (dealId) {
    loading();
    db.from('deals').select('*').eq('id', dealId).single().then(function (r) {
      if (r.error || !r.data) return errBox((r.error && r.error.message) || 'עסקה לא נמצאה');
      var deal = r.data;
      Promise.all([
        db.from('leads').select('*').eq('id', deal.lead_id).single(),
        db.from('deals').select('*').eq('lead_id', deal.lead_id).order('created_at', { ascending: false }),
        db.from('profiles').select('user_id,full_name')
      ]).then(function (rr) {
        if (rr[2] && rr[2].data) { profiles = {}; rr[2].data.forEach(function (p) { profiles[p.user_id] = p.full_name; }); }
        curDeals = (rr[1] && rr[1].data) || [deal];
        dealForm((rr[0] && rr[0].data) || { id: deal.lead_id }, deal, true);
      });
    });
  };

  window.C2B_openLeadCard = function (id) {
    if ((C.role || '') === 'files') return openFileView(id);        // file manager → file view
    if ((C.role || '') === 'accounting') return openAcctLeadView(id); // accountant → accounting file
    loading();
    Promise.all([
      db.from('leads').select('*').eq('id', id).single(),
      db.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('tasks').select('*').eq('lead_id', id).order('due_at', { ascending: true }),
      db.from('lead_documents').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('deals').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('profiles').select('user_id,full_name'),
      db.from('payments').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    ]).then(function (r) {
      if (r[0].error) return errBox(r[0].error.message);
      var lead = r[0].data, acts = r[1].data || [], tasks = r[2].data || [], docs = r[3].data || [], deals = (r[4] && r[4].data) || [], pays = (r[6] && r[6].data) || [];
      if (r[5] && r[5].data) { profiles = {}; r[5].data.forEach(function (p) { profiles[p.user_id] = p.full_name; }); }
      curDeals = deals;
      // signed URLs → inline preview of uploaded documents/images inside the timeline
      var paths = docs.map(function (d) { return d.storage_path; });
      var st = db.storage.from('lead-docs');
      var signer = (paths.length && st.createSignedUrls) ? st.createSignedUrls(paths, 3600) : Promise.resolve({ data: [] });
      signer.then(function (sres) {
        var urls = {};
        ((sres && sres.data) || []).forEach(function (s) { if (s && s.signedUrl) urls[s.path] = s.signedUrl; });
        renderLeadCard(lead, acts, tasks, docs, deals, pays, urls);
      });
    });
  };
  function renderLeadCard(lead, acts, tasks, docs, deals, pays, urls) {
    var role = C.role || 'admin';
    var wa = waLink(lead.phone);
    var idx = orderIds.indexOf(lead.id);
    var prev = idx > 0 ? orderIds[idx - 1] : null, next = idx >= 0 && idx < orderIds.length - 1 ? orderIds[idx + 1] : null;
    var feed = buildFeed(acts, tasks, docs, deals, pays, urls);
    var metaByK = {}; LEAD_ACTIONS.forEach(function (a) { metaByK[a.k] = a; });
    var actBtns = getActionCfg().filter(function (c) { var a = metaByK[c.k]; return c.on !== false && a && a.roles.indexOf(role) >= 0; }).map(function (c) {
      var a = metaByK[c.k], lbl = esc(c.label || a.label);
      if (a.k === 'call') return lead.phone ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(lead.phone) + '">' + a.icon + ' ' + lbl + '</a>' : '';
      if (a.k === 'wa') return wa ? '<a class="btn btn-ghost btn-sm" href="' + wa + '" target="_blank" rel="noopener">' + a.icon + ' ' + lbl + '</a>' : '';
      if (a.k === 'mail') return lead.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(lead.email) + '">' + a.icon + ' ' + lbl + '</a>' : '';
      return '<button class="btn btn-ghost btn-sm" data-act2="' + a.k + '">' + a.icon + ' ' + lbl + '</button>';
    }).join('');
    view(
      '<div class="lead-top">' +
        '<div style="display:flex;align-items:center;gap:8px"><button class="btn btn-ghost btn-sm" id="lpBack">→ לרשימה</button>' +
        '<div class="lead-nav"><button class="btn btn-ghost btn-sm" id="lpPrev"' + (prev ? '' : ' disabled') + '>‹ הקודם</button><button class="btn btn-ghost btn-sm" id="lpNext"' + (next ? '' : ' disabled') + '>הבא ›</button></div>' +
        (idx >= 0 ? '<span class="muted" style="font-size:13px">' + (idx + 1) + ' / ' + orderIds.length + '</span>' : '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="width:44px;height:44px;font-size:17px">' + esc(initials(lead.name)) + '</span><div><h3 style="margin:0">' + esc(lead.name || 'ליד') + '</h3><div class="muted" style="font-size:13px">' + esc(lead.phone) + (lead.car ? ' · ' + esc(lead.car) : '') + '</div></div><span id="lpStatus">' + badge(lead.status || 'new', true, lead.id) + '</span></div>' +
      '</div>' +
      '<div class="card" style="padding:14px"><div class="flow" id="leadFlow">' + flowBar(lead.status || 'new') + '</div></div>' +
      '<div class="lead-grid">' +
        '<div><div class="card"><div class="row-between" style="margin-bottom:12px"><h3 style="margin:0">פרטי לקוח' + (role !== 'admin' && roleShort(role) ? ' · ' + roleShort(role) : '') + '</h3><span class="muted" style="font-size:11px">✏️ לחצו על שדה לעריכה</span></div>' +
          '<div class="tabs2" id="ldTabs"><button class="active" data-ld="info">📋 פרטים</button><button data-ld="mkt">📣 שיווק ומקורות</button></div>' +
          '<div id="ldInfo">' + leadInfo(lead, deals, pays, feed.length ? feed[0].ts : null) +
            (lead.message ? '<div style="margin-top:10px;font-size:14px">🗒️ ' + esc(lead.message) + '</div>' : '') + '</div>' +
          '<div id="ldMkt" class="hidden">' + leadMkt(lead) + '</div>' + '</div>' +
          '<div class="card"><div class="row-between"><h3 style="margin:0">הצעות / הסכמים לחתימה</h3>' + (role !== 'accounting' ? '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="lpBrandDeals">📄 הצעות לפי מותג</button><button class="btn btn-sm" id="lpNewDeal">+ הצעה</button></div>' : '') + '</div><div id="lpBrandPick"></div><div id="lpDeals">' + dealList(deals) + '</div></div>' +
        '</div>' +
        '<div>' +
          '<div class="card">' +
            '<div class="qa2">' + actBtns + '</div><div id="lpForm" style="margin-top:10px"></div>' +
            '<h3 style="margin:18px 0 4px">ציר זמן — הכל במקום אחד</h3><p class="muted" style="font-size:12px;margin:0 0 10px">הערות · שיחות · WhatsApp · מיילים · משימות · מסמכים · עסקאות · תשלומים</p>' +
            '<div class="tl" id="lpTimeline">' + feedHtml(feed) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    bindLead(lead, prev, next);
    // ensure signed contracts have a saved PDF (shows in timeline + documents); reload once when created
    deals.forEach(function (dd) { if (dd.signature) ensureSignedPdf(lead, dd, function () { window.C2B_openLeadCard(lead.id); }); });
  }
  // ---- lead details in two tabs: business info + marketing/attribution ----
  function lf(k, v) { return '<div class="lf"><span class="k">' + k + '</span><span class="v">' + (v == null || v === '' ? '—' : v) + '</span></div>'; }
  // TAB 1 — customer + car + owner (business fields are edited inline, no button)
  function leadInfo(lead, deals, pays, lastTs) {
    var role = C.role || 'admin', deal = deals[0];
    var brandOpts = ((C.lists && C.lists.brand) || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('');
    var staff = '<option value="">— לא שויך —</option>' + Object.keys(profiles).map(function (uid) { return '<option value="' + uid + '"' + (lead.assigned_to === uid ? ' selected' : '') + '>' + esc(profiles[uid]) + '</option>'; }).join('');
    function ei(label, field, val, type) { return '<div class="lf"><span class="k">' + label + '</span><input class="lf-edit" type="' + (type || 'text') + '" data-field="' + field + '" data-label="' + esc(label) + '" value="' + esc(val == null ? '' : val) + '"></div>'; }
    var html = '<div class="lead-fields">';
    html += '<div class="lf"><span class="k">סטטוס לקוח</span><span class="v" id="lpStatusInline">' + badge(lead.status || 'new', true, lead.id) + '</span></div>';
    html += '</div>';                                  // close the top field group
    if (lead.status === 'lost') html += reasonSelect(lead);   // reason opens right under the status
    html += '<div class="lead-fields">';
    html += lf('עודכן בתאריך', fmt(lastTs || lead.updated_at || lead.status_changed_at || lead.created_at));
    html += ei('שם לקוח', 'name', lead.name);
    html += ei('טלפון ראשי', 'phone', lead.phone, 'tel');
    html += ei('דואר אלקטרוני', 'email', lead.email, 'email');
    html += '<div class="lf"><span class="k">באיזה רכב מתעניין</span><div id="carPick" style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-start;max-width:64%"><span class="muted" style="font-size:12px">טוען מלאי…</span></div></div>';
    html += '<div class="lf"><span class="k">מותג</span><input class="lf-edit" data-field="brand" data-label="מותג" list="ld_brandOpts" value="' + esc(lead.brand || '') + '"><datalist id="ld_brandOpts">' + brandOpts + '</datalist></div>';
    html += ei('כתובת - עיר', 'city', lead.city);
    html += '<div class="lf"><span class="k">איש מכירות</span><select class="lf-edit" data-field="assigned_to" data-label="איש מכירות">' + staff + '</select></div>';
    if (role === 'accounting') {
      var total = deals.reduce(function (s, d) { return s + (Number(d.total) || 0); }, 0);
      var paid = pays.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
      html += lf('שווי עסקאות', nis(total)) + lf('נגבה בפועל', nis(paid)) + lf('יתרה פתוחה', nis(total - paid));
    } else if (role === 'files') {
      html += lf('שלב תיק', deal ? stageBadge(deal.stage || 'initial') : '—');
      if (deal) { var cl = deal.checklist || {}; var done = CHECKLIST_ITEMS.filter(function (i) { return cl[i]; }).length; html += lf('צ׳קליסט תיק', done + '/' + CHECKLIST_ITEMS.length); }
      if (deal && deal.commission) html += lf('עמלת סוכן', nis(deal.commission));
    }
    html += lf('נוצר', fmt(lead.created_at));
    return html + '</div>';
  }
  // TAB 2 — marketing / source attribution (opens on the "שיווק" tab)
  function leadMkt(lead) {
    var pageUrl = safeHttpUrl(lead.page_url);
    return '<div class="lead-fields">' +
      lf('מקור הגעה', esc(lead.source)) +
      lf('חברת שיווק', esc(lead.marketing_company)) +
      lf('utm_source', esc(lead.utm_source)) +
      lf('utm_campaign', esc(lead.utm_campaign)) +
      lf('utm_medium', esc(lead.utm_medium)) +
      lf('utm_content', esc(lead.utm_content)) +
      lf('utm_term', esc(lead.utm_term)) +
      lf('ad_group', esc(lead.ad_group)) +
      lf('IP', esc(lead.ip)) +
      lf('קישור לעמוד', pageUrl ? '<a href="' + esc(pageUrl) + '" target="_blank" rel="noopener noreferrer" title="' + esc(pageUrl) + '">פתח »</a>' : '') +
      lf('lead_id', '<span class="muted" style="font-size:10.5px">' + esc(lead.id) + '</span>') +
      '</div>';
  }
  // single car search from inventory → fills the car + the existing מותג field
  function setupCarPicker(lead) {
    var box = C.$('carPick'); if (!box) return;
    loadCars(function (cars) {
      if (!C.$('carPick')) return;
      box.innerHTML = '<div class="ac-box" style="position:relative;width:100%"><input class="lf-edit" id="carSearch2" value="' + esc(lead.car || '') + '" placeholder="🔎 חפש רכב מהמלאי…" style="max-width:none;width:100%"><div class="ac-res hidden" id="carRes2"></div></div>';
      var inp = C.$('carSearch2'), res = C.$('carRes2');
      inp.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase(); if (!q) { res.classList.add('hidden'); return; }
        var m = cars.filter(function (c) { return ((c.brand || '') + ' ' + (c.name || '') + ' ' + (c.trim || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
        res.innerHTML = m.map(function (c) { return '<div class="ai" data-i="' + cars.indexOf(c) + '">' + (c.img ? '<img src="' + esc(c.img) + '" style="width:40px;height:26px;object-fit:cover;border-radius:5px">' : '') + '<span><b>' + esc(c.brand) + ' ' + esc(c.name) + '</b> ' + esc(c.trim || '') + '</span></div>'; }).join('') || '<div class="ai muted">אין תוצאות</div>';
        res.classList.remove('hidden');
        res.querySelectorAll('.ai[data-i]').forEach(function (el) {
          el.addEventListener('mousedown', function () {   // mousedown fires before blur
            var c = cars[+el.dataset.i], label = (c.brand + ' ' + c.name + (c.trim ? ' ' + c.trim : '')).trim();
            inp.value = label; res.classList.add('hidden');
            var bf = C.$('view').querySelector('[data-field="brand"]'); if (bf) bf.value = c.brand || '';
            db.from('leads').update({ car: label, brand: c.brand || null }).eq('id', lead.id).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); return; } lead.car = label; lead.brand = c.brand; logActivity(lead.id, 'system', 'רכב מבוקש: ' + label); });
          });
        });
      });
      inp.addEventListener('blur', function () { setTimeout(function () { res.classList.add('hidden'); }, 150); });
    });
  }
  // ---- unified timeline feed (everything, newest first) ----
  var FEED_TAG = { note: 'הערה', call: 'שיחה', whatsapp: 'WhatsApp', email: 'מייל', status: 'סטטוס', task: 'משימה', document: 'מסמך', meeting: 'פגישה', deal: 'עסקה', contract: 'הסכם' };
  function buildFeed(acts, tasks, docs, deals, pays, urls) {
    var items = [];
    acts.forEach(function (a) { items.push({ ts: a.created_at, icon: ACT_ICON[a.type] || '•', who: profiles[a.created_by], html: a.body ? esc(a.body) : '', tag: FEED_TAG[a.type] || a.type }); });
    docs.forEach(function (d) {
      var u = urls[d.storage_path], body, isPdf = /\.pdf$/i.test(d.name || '') || /\.pdf$/i.test(d.storage_path || '');
      if (u && docIsImage(d.name)) body = '<div style="margin:2px 0 4px">' + esc(d.name) + '</div><a href="' + u + '" target="_blank" rel="noopener"><img src="' + u + '" alt="' + esc(d.name) + '" style="max-width:100%;max-height:280px;border-radius:10px;border:1px solid var(--line);display:block"></a>';
      else if (u && isPdf) body = '<div style="margin:2px 0 6px">📄 ' + esc(d.name) + ' · <a href="' + u + '" target="_blank" rel="noopener noreferrer">פתח במסך מלא »</a></div><iframe src="' + u + '" title="' + esc(d.name) + '" style="width:100%;height:360px;border:1px solid var(--line);border-radius:10px"></iframe>';
      else if (u) body = '<a href="' + u + '" target="_blank" rel="noopener">📎 ' + esc(d.name) + '</a>';
      else body = '<a href="#" data-doc="' + esc(d.storage_path) + '">📎 ' + esc(d.name) + '</a>';
      items.push({ ts: d.created_at, icon: isPdf ? '📄' : '📎', who: profiles[d.created_by], html: body, tag: isPdf ? 'PDF' : 'מסמך' });
    });
    tasks.forEach(function (t) {
      var over = !t.done && t.due_at && new Date(t.due_at) < new Date();
      var due = t.due_at ? '<span style="font-size:12px;color:' + (over ? 'var(--danger)' : 'var(--muted)') + '"> · יעד ' + fmt(t.due_at) + '</span>' : '';
      var created = t.created_at ? '<span class="muted" style="font-size:11px"> · נוצרה ' + fmt(t.created_at) + '</span>' : '';
      var flag = t.done ? '<span class="done-badge">✓ בוצע</span>' : '<span class="task-open">● פתוחה</span>';
      var title = '<span' + (t.done ? ' style="text-decoration:line-through;color:var(--muted)"' : '') + '>' + esc(t.title) + '</span>';
      items.push({ ts: t.created_at || t.due_at, icon: t.done ? '✅' : '🔲', who: profiles[t.created_by], cls: t.done ? 'done' : '', tag: 'משימה',
        html: '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-wrap:wrap"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '>' + title + ' ' + flag + due + created + '</label>' + (t.notes ? '<div class="muted" style="font-size:12.5px;margin-top:3px">🗒️ ' + esc(t.notes) + '</div>' : '') });
    });
    deals.forEach(function (d) { items.push({ ts: d.created_at, icon: '💰', who: profiles[d.created_by], html: 'עסקה #' + esc(d.order_no || String(d.id).slice(0, 6)) + (d.car_make ? ' · ' + esc(d.car_make + ' ' + (d.car_model || '')) : '') + (d.total ? ' · ' + nis(d.total) : '') + ' — <a href="#" data-open-deal="' + d.id + '">פתח</a>', tag: 'עסקה' }); });
    pays.forEach(function (p) { items.push({ ts: p.created_at, icon: '🧾', who: profiles[p.created_by], html: ({ invoice: 'חשבונית', receipt: 'קבלה', payment: 'תשלום' }[p.kind] || 'תשלום') + ' · ' + nis(p.amount) + (p.method ? ' · ' + esc(p.method) : '') + (p.ref_no ? ' · ' + esc(p.ref_no) : ''), tag: 'כספים' }); });
    items.sort(function (a, b) { return new Date(b.ts || 0) - new Date(a.ts || 0); });
    return items;
  }
  function feedHtml(items) {
    return items.length ? items.map(function (a) {
      return '<div class="ev' + (a.cls ? ' ' + a.cls : '') + '"><div class="dot">' + a.icon + '</div><div style="flex:1"><div class="tm">' + fmt(a.ts) + (a.tag ? ' · ' + esc(a.tag) : '') + (a.who ? ' · ' + esc(a.who) : '') + '</div>' + (a.html ? '<div>' + a.html + '</div>' : '') + '</div></div>';
    }).join('') : '<p class="empty">אין עדיין פעילות</p>';
  }
  function row(k, v) { return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:13px">' + k + '</span><span>' + v + '</span></div>'; }
  function flowBar(cur) {
    var idx = FLOW.map(function (s) { return s.k; }).indexOf(cur), lost = cur === 'lost' || cur === 'no_answer';
    var html = FLOW.map(function (s, i) {
      var state = lost ? 'gray' : (i < idx ? 'green' : i === idx ? 'cur' : 'gray');
      var bg = { gray: 'var(--surface-2)', cur: s.color, green: '#16a34a' }[state];
      return '<div class="st clk" data-status="' + s.k + '" title="לחצו כדי לעדכן סטטוס" style="background:' + bg + ';color:' + (state === 'gray' ? 'var(--muted)' : '#fff') + '">' + s.icon + '<br>' + esc(s.label) + '</div>';
    }).join('');
    // "לא רלוונטי" always visible at the end of the funnel (red when active)
    var ls = stDef('lost');
    html += '<div class="st clk" data-status="lost" title="סמן כלא רלוונטי" style="background:' + (cur === 'lost' ? '#e2555a' : 'var(--surface-2)') + ';color:' + (cur === 'lost' ? '#fff' : 'var(--muted)') + '">' + ls.icon + '<br>' + esc(ls.label) + '</div>';
    return html;
  }
  function reasonSelect(lead) {
    var need = !lead.close_reason;
    return '<div id="lpReasonWrap" style="margin:4px 0 10px;padding:10px;border-radius:10px;background:' + (need ? 'rgba(226,85,90,.08)' : 'var(--surface-2)') + ';border:1px solid ' + (need ? 'var(--danger)' : 'var(--line)') + '">' +
      '<label class="muted" style="font-size:12px;font-weight:700;color:' + (need ? 'var(--danger)' : 'var(--muted)') + '">סיבת "לא רלוונטי" ' + (need ? '· חובה לבחור' : '') + '</label>' +
      '<select class="inp" id="lpReason" style="width:100%;margin-top:4px"><option value="">בחר סיבה…</option>' +
      CLOSE_REASONS.map(function (x) { return '<option' + (lead.close_reason === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>';
  }
  // ---------- ACTIVITY (global feed: who did what) ----------
  window.C2B_renderActivity = function () {
    loading();
    Promise.all([
      db.from('activities').select('*').order('created_at', { ascending: false }).limit(300),
      db.from('leads').select('id,name'),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var acts = res[0].data || [], lmap = {}, pmap = {};
      (res[1].data || []).forEach(function (l) { lmap[l.id] = l.name; });
      (res[2].data || []).forEach(function (p) { pmap[p.user_id] = p.full_name; });
      var rows = acts.map(function (a) {
        var who = pmap[a.created_by] || 'מערכת';
        var leadLink = a.lead_id ? ' · <a href="#" data-lead="' + a.lead_id + '">' + esc(lmap[a.lead_id] || 'ליד') + '</a>' : '';
        return '<div class="ev"><div class="dot">' + (ACT_ICON[a.type] || '•') + '</div><div style="flex:1"><div class="tm">' + fmt(a.created_at) + ' · <b>' + esc(who) + '</b>' + leadLink + '</div>' + (a.body ? '<div>' + esc(a.body) + '</div>' : '') + '</div></div>';
      }).join('');
      view('<div class="card"><h3>מסך פעילות — כל הפעולות במערכת</h3><p class="muted" style="font-size:13px">מי ביצע · מתי · מה השתנה (300 האחרונות)</p><div class="tl">' + (rows || '<p class="empty">אין פעילות עדיין</p>') + '</div></div>');
      C.$('view').querySelectorAll('a[data-lead]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); window.C2B_openLeadCard(a.dataset.lead); }); });
    });
  };
  function bindLead(lead, prev, next) {
    var $ = C.$;
    $('lpBack').addEventListener('click', function () { window.C2B_renderLeads(curFilter); });
    if (prev) $('lpPrev').addEventListener('click', function () { window.C2B_openLeadCard(prev); });
    if (next) $('lpNext').addEventListener('click', function () { window.C2B_openLeadCard(next); });
    // clickable status — both the header badge and the inline "סטטוס לקוח" row
    $('view').querySelectorAll('.tag.click').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); openStatusMenu(el, el.dataset.cur || lead.status || 'new', function (to) { changeStatus(lead.id, to, lead, function () { window.C2B_openLeadCard(lead.id); }); }); });
    });
    // clickable funnel — move the lead through statuses straight from the flow bar
    var lfb = $('leadFlow');
    if (lfb) lfb.addEventListener('click', function (e) { var st = e.target.closest('[data-status]'); if (!st) return; changeStatus(lead.id, st.dataset.status, lead, function () { window.C2B_openLeadCard(lead.id); }); });
    var rs = $('lpReason'); if (rs) { if (!lead.close_reason) rs.focus(); rs.addEventListener('change', function () { db.from('leads').update({ close_reason: rs.value }).eq('id', lead.id).then(function () { logActivity(lead.id, 'system', 'סיבת אי-רלוונטיות: ' + rs.value); window.C2B_openLeadCard(lead.id); }); }); }
    // inline field editing — save each business field on change (no edit button)
    var ldInfoEl = $('ldInfo');
    if (ldInfoEl) ldInfoEl.addEventListener('change', function (e) {
      var el = e.target.closest('[data-field]'); if (!el) return;
      var field = el.dataset.field, val = (el.value || '').trim(), patch = {};
      patch[field] = val || null;
      db.from('leads').update(patch).eq('id', lead.id).then(function (r) {
        if (r.error) { alert('שגיאה בשמירה: ' + r.error.message); return; }
        lead[field] = patch[field];
        var shown = field === 'assigned_to' ? (profiles[val] || '—') : val;
        logActivity(lead.id, 'system', 'עודכן ' + (el.dataset.label || field) + (shown ? ': ' + shown : ''));
        el.style.borderColor = 'var(--ok)'; setTimeout(function () { el.style.borderColor = ''; }, 900);
      });
    });
    setupCarPicker(lead);   // cascading brand→model→trim from inventory
    // details tabs: פרטים ⇄ שיווק ומקורות
    var ldt = $('ldTabs');
    if (ldt) ldt.addEventListener('click', function (e) { var b = e.target.closest('[data-ld]'); if (!b) return; ldt.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); }); $('ldInfo').classList.toggle('hidden', b.dataset.ld !== 'info'); $('ldMkt').classList.toggle('hidden', b.dataset.ld !== 'mkt'); });
    // deals list
    if ($('lpNewDeal')) $('lpNewDeal').addEventListener('click', function () { dealForm(lead, null); });
    // create one price-offer form per brand (from the managed brand list), each tagged with the brand name
    if ($('lpBrandDeals')) $('lpBrandDeals').addEventListener('click', function () {
      var brands = (C.lists && C.lists.brand) || [], pick = $('lpBrandPick');
      if (!brands.length) { pick.innerHTML = '<p class="muted" style="font-size:12px;margin:8px 0">לא הוגדרו מותגים. הוסיפו אותם ב"הגדרות → רשימות שדות → מותג".</p>'; return; }
      if (pick.dataset.open === '1') { pick.innerHTML = ''; pick.dataset.open = '0'; return; }
      pick.dataset.open = '1';
      pick.innerHTML = '<div class="card" style="box-shadow:none;border:1px solid var(--line);margin:8px 0"><p class="muted" style="font-size:12px;margin:0 0 8px">בחרו מותגים — לכל מותג ייווצר טופס הצעת מחיר נפרד עם שם המותג:</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">' + brands.map(function (b) { return '<label class="tag" style="cursor:pointer;display:inline-flex;gap:5px;align-items:center"><input type="checkbox" class="lpBrandCb" value="' + esc(b) + '"' + (lead.brand === b ? ' checked' : '') + '> ' + esc(b) + '</label>'; }).join('') + '</div><button class="btn btn-sm" id="lpBrandCreate">✍ צור הצעות לנבחרים</button></div>';
      $('lpBrandCreate').addEventListener('click', function () {
        var sel = Array.prototype.slice.call(pick.querySelectorAll('.lpBrandCb:checked')).map(function (c) { return c.value; });
        if (!sel.length) { alert('בחרו לפחות מותג אחד'); return; }
        this.disabled = true; this.textContent = 'יוצר…';
        var rows = sel.map(function (b) { return { lead_id: lead.id, status: 'quote', brand: b, form_type: 'הצעת מחיר — ' + b, salesperson: '', client_name: lead.name || null, client_phone: lead.phone || null, client_email: lead.email || null, client_address: lead.city || null }; });
        db.from('deals').insert(rows).then(function (r) {
          if (r.error) { alert('שגיאה: ' + r.error.message); return; }
          logActivity(lead.id, 'quote', 'נוצרו ' + sel.length + ' הצעות מחיר לפי מותג: ' + sel.join(', ')).then(function () { window.C2B_openLeadCard(lead.id); });
        });
      });
    });
    $('lpDeals').querySelectorAll('[data-deal-id]').forEach(function (el) { el.addEventListener('click', function () { var dd = curDeals.filter(function (x) { return x.id === el.dataset.dealId; })[0]; dealForm(lead, dd); }); });
    // timeline interactions: task toggle, open deal, fallback doc link
    var tl = $('lpTimeline');
    tl.querySelectorAll('input[data-task]').forEach(function (cb) { cb.addEventListener('change', function () { db.from('tasks').update({ done: cb.checked }).eq('id', cb.dataset.task).then(function () { C.refreshBadges && C.refreshBadges(); }); }); });
    tl.querySelectorAll('a[data-open-deal]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); var dd = curDeals.filter(function (x) { return x.id === a.dataset.openDeal; })[0]; if (dd) dealForm(lead, dd); }); });
    tl.querySelectorAll('a[data-doc]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); db.storage.from('lead-docs').createSignedUrl(a.dataset.doc, 300).then(function (r) { if (r.data && r.data.signedUrl) window.open(r.data.signedUrl, '_blank'); }); }); });
    // consolidated action bar (role-tailored)
    $('view').querySelectorAll('button[data-act2]').forEach(function (b) { b.addEventListener('click', function () { leadAction(lead, b.dataset.act2); }); });
  }
  function leadAction(lead, k) {
    var $ = C.$;
    if (k === 'deal') return dealForm(lead, null);
    if (k === 'meeting') return meetingForm(lead);
    if (k === 'car') return carPicker(lead);
    if (k === 'contract') { var dd = curDeals[0]; if (!dd) { alert('אין עדיין עסקה. צרו עסקה תחילה, ואז אפשר לשלוח/לחתום על ההסכם.'); return; } return contractView(lead, dd); }
    var box = $('lpForm');
    if (k === 'doc') {
      box.innerHTML = '<label class="muted" style="font-size:12px">העלה מסמך / תמונה — תוצג מיד פתוחה בציר הזמן</label><input type="file" id="lpUp" style="margin-top:6px;display:block">';
      $('lpUp').addEventListener('change', function () {
        var file = this.files[0]; if (!file) return; var path = safeStoragePath(lead.id, file.name);
        box.innerHTML = '<p class="muted">מעלה…</p>';
        db.storage.from('lead-docs').upload(path, file).then(function (u) { if (u.error) { box.innerHTML = ''; return alert('העלאה נכשלה: ' + u.error.message); } db.from('lead_documents').insert({ lead_id: lead.id, name: file.name, storage_path: path }).then(function () { logActivity(lead.id, 'document', 'הועלה מסמך: ' + file.name); window.C2B_openLeadCard(lead.id); }); });
      });
      return;
    }
    if (k === 'task') {
      box.innerHTML = '<form id="lpTaskForm"><input class="inp" name="title" placeholder="משימה חדשה…" style="width:100%;margin-bottom:6px"><textarea class="inp" name="notes" rows="2" placeholder="הערות למשימה (אופציונלי)…" style="width:100%;margin-bottom:6px"></textarea><div style="display:flex;gap:6px"><input class="inp" name="due" type="datetime-local" style="flex:1"><button class="btn btn-sm">הוסף</button></div></form>';
      $('lpTaskForm').addEventListener('submit', function (e) {
        e.preventDefault(); var title = this.title.value.trim(); if (!title) return;
        var due = this.due.value ? new Date(this.due.value).toISOString() : null, notes = this.notes.value.trim() || null;
        db.from('tasks').insert({ lead_id: lead.id, title: title, due_at: due, notes: notes }).then(function () { logActivity(lead.id, 'task', 'נפתחה משימה: ' + title); C.refreshBadges && C.refreshBadges(); window.C2B_openLeadCard(lead.id); });
      });
      $('lpTaskForm').querySelector('[name=title]').focus();
      return;
    }
    // note / call_log → activity entry in the timeline
    var type = k === 'call_log' ? 'call' : 'note';
    var ph = k === 'call_log' ? 'סיכום השיחה…' : 'הערה…';
    box.innerHTML = '<form id="lpActForm"><textarea class="inp" name="body" rows="2" style="width:100%" placeholder="' + ph + '"></textarea><div style="margin-top:6px"><button class="btn btn-sm">שמור</button></div></form>';
    $('lpActForm').addEventListener('submit', function (e) { e.preventDefault(); var body = this.body.value.trim(); if (!body) return; logActivity(lead.id, type, body).then(function () { window.C2B_openLeadCard(lead.id); }); });
    $('lpActForm').querySelector('[name=body]').focus();
  }

  // ---- appointment: date + time only ----
  function meetingForm(lead) {
    C.$('lpForm').innerHTML = '<div class="card" style="box-shadow:none;margin:6px 0 0;border:1px solid var(--line)"><h3>קביעת פגישה</h3><form id="mForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">' +
      '<div class="field" style="margin:0"><label>תאריך</label><input class="inp" type="date" name="date" required></div>' +
      '<div class="field" style="margin:0"><label>שעה</label><input class="inp" type="time" name="time" required></div>' +
      '<div class="field" style="margin:0"><label>אופן</label><select class="inp" name="mode"><option>פרונטלי</option><option>טלפוני</option><option>וידאו</option><option>בסניף</option></select></div>' +
      '<div class="field" style="margin:0;flex-basis:100%"><label>הערות לפגישה</label><textarea class="inp" name="note" rows="2" placeholder="הערות (מיקום, נושא, מה להכין…)…" style="width:100%"></textarea></div>' +
      '<button class="btn btn-sm">קבע ושלח אישור</button><button type="button" class="btn btn-ghost btn-sm" id="mCancel">ביטול</button></form></div>';
    C.$('mCancel').addEventListener('click', function () { C.$('lpForm').innerHTML = ''; });
    C.$('mForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = this.date.value, t = this.time.value; if (!d || !t) return;
      var appt_at = new Date(d + 'T' + t).toISOString();
      var disp = new Date(d + 'T' + t).toLocaleDateString('he-IL');
      db.from('appointments').insert({ lead_id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, type: lead.car || 'פגישה', brand: lead.brand || null, appt_mode: this.mode.value, branch: '', note: this.note.value.trim() || null, appt_date: disp, appt_time: t, appt_at: appt_at, status: 'new' }).then(function (r) {
        if (r.error) return alert('שגיאה: ' + r.error.message);
        logActivity(lead.id, 'meeting', 'נקבעה פגישה: ' + disp + ' ' + t);
        changeStatus(lead.id, 'meeting_set', lead, function () { window.C2B_openLeadCard(lead.id); });
      });
    });
  }

  // ---- deal / car picker (autocomplete over cars.json, HE + EN) ----
  function carPicker(lead) {
    C.$('lpForm').innerHTML = '<div class="card ac-box" style="box-shadow:none;margin:6px 0 0;border:1px solid var(--line)"><h3>בחירת רכב לעסקה</h3><input class="inp" id="carSearch" placeholder="הקלד מותג / דגם (עברית או אנגלית)…" style="width:100%"><div class="ac-res hidden" id="carRes"></div></div>';
    loadCars(function (cars) {
      var inp = C.$('carSearch'), res = C.$('carRes');
      inp.focus();
      inp.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase(); if (q.length < 1) { res.classList.add('hidden'); return; }
        var m = cars.filter(function (c) { return ((c.brand || '') + ' ' + (c.name || '') + ' ' + (c.trim || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
        res.innerHTML = m.map(function (c, i) { return '<div class="ai" data-i="' + cars.indexOf(c) + '">' + (c.img ? '<img src="' + esc(c.img) + '" style="width:40px;height:26px;object-fit:cover;border-radius:5px">' : '') + '<span><b>' + esc(c.brand) + ' ' + esc(c.name) + '</b> ' + esc(c.trim || '') + ' · ' + nis(c.m) + '/ח\'</span></div>'; }).join('') || '<div class="ai muted">אין תוצאות</div>';
        res.classList.remove('hidden');
        res.querySelectorAll('.ai[data-i]').forEach(function (el) {
          el.addEventListener('click', function () {
            var c = cars[+el.dataset.i]; var label = c.brand + ' ' + c.name + (c.trim ? ' ' + c.trim : '');
            db.from('leads').update({ car: label }).eq('id', lead.id).then(function () { logActivity(lead.id, 'car', 'נבחר רכב לעסקה: ' + label); window.C2B_openLeadCard(lead.id); });
          });
        });
      });
    });
  }

  // ---------- DEALS (order / quote form) ----------
  function dealStatusLabel(s) { return { quote: 'הצעת מחיר', ordered: 'הזמנה', cancelled: 'בוטל' }[s] || s; }
  function dealList(deals) {
    if (!deals.length) return '<p class="muted" style="margin:6px 0">אין עסקאות</p>';
    return deals.map(function (d) { return '<div data-deal-id="' + d.id + '" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer"><b>#' + esc(d.order_no) + '</b>' + (d.brand ? ' <span class="tag" style="font-size:10px">' + esc(d.brand) + '</span>' : '') + ' · ' + esc(dealStatusLabel(d.status)) + ' · ' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + ' · ' + nis(d.total) + (d.signature ? '<div style="margin-top:6px;display:flex;align-items:center;gap:8px"><span style="color:var(--ok);font-weight:700">✅ נחתם</span><img src="' + d.signature + '" alt="חתימה" style="height:40px;background:#fff;border:1px solid var(--line);border-radius:6px;padding:2px"></div>' : '') + '</div>'; }).join('');
  }
  // Ministry of Transport open vehicle registry (data.gov.il, CORS-enabled) — lookup by plate number
  function normalizeVehicle(r) {
    return {
      plate: r.mispar_rechev, make: String(r.tozeret_nm || '').replace(/\s+/g, ' ').trim(),
      model: r.kinuy_mishari || r.degem_nm || '', trim: r.ramat_gimur || '', year: r.shnat_yitzur || '',
      color: r.tzeva_rechev || '', fuel: r.sug_delek_nm || '', vin: r.misgeret || '', engine: r.degem_manoa || ''
    };
  }
  var PLATE_DATASETS = [
    '053cea08-09bc-40ec-8f7a-156f0677aff3', // רכב פרטי ומסחרי
    '0866573c-40cd-4ca8-91d2-9dd2d7a492e5', // רכב שהוסר מהכביש (deregistered)
    'bf9df4e2-d90d-4c0a-a400-19e15af8e95f'  // דו-גלגלי / אחר
  ];
  function plateLookup(plate, cb) {
    var base = 'https://data.gov.il/api/3/action/datastore_search', i = 0;
    (function tryOne() {
      if (i >= PLATE_DATASETS.length) { cb(null, 'לא נמצא רכב עם מספר זה'); return; }
      var url = base + '?resource_id=' + PLATE_DATASETS[i] + '&filters=' + encodeURIComponent(JSON.stringify({ mispar_rechev: +plate }));
      fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var recs = (j && j.result && j.result.records) || [];
        if (recs.length) { cb(normalizeVehicle(recs[0])); return; }
        i++; tryOne();
      }).catch(function () { i++; tryOne(); });
    })();
  }
  window.C2B_plateLookup = plateLookup;

  function dealForm(lead, deal, fileMode) {
    deal = deal || {}; var ad = deal.addons || {};
    var curStage = deal.stage || 'initial';
    var checklist = {}; CHECKLIST_ITEMS.forEach(function (it) { checklist[it] = !!(deal.checklist || {})[it]; });
    if (deal.checklist && deal.checklist._ownership) checklist._ownership = deal.checklist._ownership;
    var G = function (label, name, val, type) { return '<div class="field" style="margin:0"><label>' + label + '</label><input class="inp" id="dl_' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" style="width:100%"></div>'; };
    var grid = function (inner) { return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + inner + '</div>'; };
    var statusSel = '<div class="field" style="margin:0"><label>סטטוס הזמנה</label><select class="inp" id="dl_status" style="width:100%">' + [['quote', 'הצעת מחיר'], ['ordered', 'הזמנה'], ['cancelled', 'בוטל']].map(function (s) { return '<option value="' + s[0] + '"' + ((deal.status || 'quote') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>';
    var fin = deal.financing || {}, ti = deal.tradein || {};
    function gearboxSel(v) { return '<div class="field" style="margin:0"><label>תיבת הילוכים</label><select class="inp" id="dl_car_gearbox" style="width:100%"><option value="">— בחר —</option>' + ['אוטומט', 'ידני', 'רובוטית', 'טיפטרוניק'].map(function (g) { return '<option' + (v === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div>'; }
    // --- cards (grouped into tabs matching the reference layout) ---
    var clientCard = '<div class="card"><h3>👤 פרטי הלקוח</h3>' + grid(G('שם לקוח', 'client_name', deal.client_name || lead.name) + G('טלפון נייד', 'client_phone', deal.client_phone || lead.phone) + G('דוא"ל', 'client_email', deal.client_email || lead.email) + G('כתובת', 'client_address', deal.client_address || lead.city) + G('ת.ז / ח.פ', 'client_id', deal.client_id) + G('שם לחשבונית', 'invoice_name', deal.invoice_name || lead.name)) + '</div>';
    var brandDl = ((C.lists && C.lists.brand) || []).map(function (v) { return '<option value="' + esc(v) + '">'; }).join('');
    var brandField = '<div class="field" style="margin:0"><label>מותג</label><input class="inp" id="dl_brand" list="dl_brandOpts" value="' + esc(deal.brand || lead.brand || '') + '" placeholder="שם המותג" style="width:100%"><datalist id="dl_brandOpts">' + brandDl + '</datalist></div>';
    var formCard = '<div class="card"><h3>בחירת טופס</h3>' + grid(G('סוג טופס', 'form_type', deal.form_type || 'חוזה קאר פלוס') + statusSel + brandField + G('מנהל מכירות / נציג משוייך', 'salesperson', deal.salesperson || '')) + '</div>';
    var carCard = '<div class="card ac-box"><h3>🚗 פרטי הרכב המוזמן</h3>' +
      '<input class="inp" id="dl_carSearch" placeholder="🔎 חפש רכב מהקטלוג (עברית/אנגלית) — ימלא אוטומטית" style="width:100%;margin-bottom:10px"><div class="ac-res hidden" id="dl_carRes"></div>' +
      grid(G('יצרן', 'car_make', deal.car_make) + G('דגם', 'car_model', deal.car_model) + G('שנת ייצור', 'car_year', deal.car_year || 2026, 'number') + G('רמת גימור', 'car_trim', deal.car_trim) + G('נפח מנוע', 'car_engine', deal.car_engine) + gearboxSel(deal.car_gearbox) + G('צבע מבוקש', 'car_color', deal.car_color) + G('מחיר הרכב ₪', 'car_price', deal.car_price, 'number') + '<div class="field" style="margin:0"><label>עמלת סוכן ₪ (אוטומטי · קריאה בלבד)</label><input class="inp" id="dl_commission" type="number" value="' + esc(deal.commission == null ? '' : deal.commission) + '" readonly tabindex="-1" style="width:100%;background:var(--surface-2);cursor:not-allowed;color:var(--muted)"></div>') + '</div>';
    var specCard = '<div class="card"><h3>מפרט / הערות</h3><textarea class="inp" id="dl_spec" rows="5" style="width:100%" placeholder="מפרט / הערות לחוזה…">' + esc(deal.spec || '') + '</textarea></div>';
    var pricingCard = '<div class="card"><h3>תמחור ומקדמה</h3>' + grid(G('סכום מקדמה כולל ₪', 'down_total', deal.down_total, 'number') + G('מקדמה ראשונית ₪', 'down_initial', deal.down_initial, 'number') + G('החזר חודשי משוער ₪', 'monthly', deal.monthly, 'number') + G('זמן אספקה (ימים)', 'delivery_days', deal.delivery_days, 'number')) + '</div>';
    var addonsCard = '<div class="card"><h3>תוספות</h3><label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_charging"' + (ad.charging ? ' checked' : '') + '> עמדת טעינה</label>' +
      '<label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_armor"' + (ad.armor ? ' checked' : '') + '> מיגון לפי דרישת ביטוח</label>' +
      '<label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_accessories"' + (ad.accessories ? ' checked' : '') + '> אביזרים נלווים</label>' +
      '<div class="field" style="margin-top:6px"><label>סכום תוספות ₪</label><input class="inp" id="dl_addons_amount" type="number" value="' + esc(ad.addons_amount == null ? '' : ad.addons_amount) + '" style="width:100%"></div></div>';
    var summaryCard = '<div class="card"><h3>סיכום הזמנה ורווחיות</h3>' + grid(G('הנחה (%)', 'discount_pct', deal.discount_pct, 'number') + G('הנחה (סכום) ₪', 'discount_amt', deal.discount_amt, 'number') + G('שולם ₪', 'paid', deal.paid, 'number')) +
      '<label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" id="dl_vat"' + (deal.vat_included !== false ? ' checked' : '') + '> כולל מע"מ</label><div id="dlSummary" style="margin-top:8px"></div></div>';
    var finCard = '<div class="card"><h3>🏦 מקטע מימון</h3>' + grid(G('גובה מימון מבוקש ₪', 'fin_amount', fin.amount, 'number') + G('מימון מאושר ₪', 'fin_approved', fin.approved, 'number') + G('מספר תשלומים', 'fin_payments', fin.payments, 'number') + G('החזר חודשי ₪', 'fin_monthly', fin.monthly, 'number') + G('מסלול / סוג עסקת מימון', 'fin_track', fin.track) + G('מספר הצעה', 'fin_offer', fin.offer) + G('יתרת בלון ₪', 'fin_balloon', fin.balloon, 'number') + G('סטטוס מימון', 'fin_status', fin.status)) +
      '<label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" id="dl_fin_transferred"' + (fin.transferred ? ' checked' : '') + '> עברו כספים מגוף המימון</label></div>';
    var tradeCard = '<div class="card"><h3>🔁 מקטע טרייד-אין</h3>' +
      '<div class="ac-box" style="box-shadow:none;border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:14px;background:var(--brand-soft)">' +
        '<label style="font-size:12px;font-weight:700;color:var(--brand);display:block;margin-bottom:6px">🔎 שליפת פרטי רכב לפי מספר רישוי (משרד התחבורה)</label>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="inp" id="dl_ti_plate" value="' + esc(ti.plate || '') + '" placeholder="מספר רכב (ספרות בלבד)" inputmode="numeric" style="max-width:200px"><button type="button" class="btn btn-sm" id="dlPlateLookup">שלוף פרטים</button><span id="dlPlateMsg" style="font-size:12.5px"></span></div>' +
      '</div>' +
      grid(G('יצרן טרייד-אין', 'ti_make', ti.make) + G('דגם', 'ti_model', ti.model) + G('רמת גימור', 'ti_trim', ti.trim) + G('שנת דגם', 'ti_year', ti.year, 'number') + G('יד', 'ti_hand', ti.hand) + G('צבע', 'ti_color', ti.color) + G('סוג דלק', 'ti_fuel', ti.fuel) + G('מספר שלדה (VIN)', 'ti_vin', ti.vin) + G('מחיר מחירון ₪', 'ti_list', ti.list, 'number') + G('מחיר קנייה ₪', 'ti_buy', ti.buy, 'number') + G('סכום שעבוד ₪', 'ti_lien', ti.lien, 'number') + G('גורם משעבד', 'ti_holder', ti.holder) + G('תאריך מסירה בפועל', 'ti_delivery', ti.delivery, 'date')) +
      '<label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" id="dl_ti_liened"' + (ti.liened ? ' checked' : '') + '> הרכב משועבד</label></div>';
    var chkItems = fileMode ? FILE_CHECKLIST_ITEMS : CHECKLIST_ITEMS;
    var checklistCard = '<div class="card"><h3>צ\'קליסט תיק</h3><div id="dlChecklist">' + chkItems.map(function (it) { return '<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" data-chk="' + esc(it) + '"' + (checklist[it] ? ' checked' : '') + '> ' + esc(it) + '</label>'; }).join('') + '</div></div>';
    var recordCard = '<div class="card"><h3>פרטי רשומה</h3>' + grid(row('מספר הזמנה', esc(deal.order_no || '—')) + row('נוצר', deal.created_at ? fmt(deal.created_at) : '—') + row('שלב תיק', '<span id="dlRecStage">' + stageBadge(curStage) + '</span>') + row('מזהה עסקה', '<span class="muted" style="font-size:11px">' + esc(deal.id || '—') + '</span>')) +
      '<hr style="border:none;border-top:1px solid var(--line);margin:16px 0">' +
      '<div class="row-between"><h3 style="margin:0">📁 מסמכי הלקוח</h3>' + (lead.id ? '<label class="btn btn-sm" style="cursor:pointer">⬆ העלה מסמכים<input type="file" id="dlDocUp" multiple style="display:none"></label>' : '') + '</div><p class="muted" style="font-size:12px;margin:4px 0 10px">ת"ז · תלושים · דפי בנק · הסכם חתום · כל פורמט (תמונות/PDF/מסמכים)</p><div id="dlDocs">' + (lead.id ? 'טוען…' : 'שמרו את התיק תחילה כדי לצרף מסמכים') + '</div></div>';
    var paymentsCard = '<div class="card"><h3>תשלומים / קבלות / חשבוניות</h3><div id="dlPayList">' + (deal.id ? 'טוען…' : '<p class="muted">שמרו את העסקה כדי לנהל תשלומים</p>') + '</div>' +
      (deal.id ? '<form id="dlPayForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><select class="inp" name="kind"><option value="payment">תשלום</option><option value="receipt">קבלה</option><option value="invoice">חשבונית</option></select><input class="inp" name="amount" type="number" placeholder="סכום ₪" style="width:120px"><input class="inp" name="method" placeholder="אמצעי (מזומן/אשראי)" style="width:150px"><input class="inp" name="ref" placeholder="אסמכתא" style="width:130px"><button class="btn btn-sm">+ הוסף</button></form>' : '') + '</div>';
    function dTab(k, label, active) { return '<button data-dtab="' + k + '"' + (active ? ' class="active"' : '') + '>' + label + '</button>'; }
    function dPanel(k, active, inner) { return '<div class="dl-panel' + (active ? '' : ' hidden') + '" data-dpanel="' + k + '">' + inner + '</div>'; }
    view(
      '<div class="lead-top"><div style="display:flex;align-items:center;gap:8px"><button class="btn btn-ghost btn-sm" id="dlBack">' + ((C.role || '') === 'files' ? '→ לרשימת התיקים' : '→ לכרטיס') + '</button><h3 style="margin:0">' + (deal.id ? 'עסקה #' + esc(deal.order_no) : 'עסקה חדשה') + '</h3></div>' +
        '<div style="display:flex;align-items:center;gap:10px"><button class="btn btn-ghost btn-sm" id="dlContract">✍ הסכם לחתימה</button> <button class="btn btn-ghost btn-sm" id="dlSubmitFin">🏦 הגש למימון</button> <span id="dlSaveState" style="font-size:12.5px;color:var(--muted);white-space:nowrap">💾 נשמר אוטומטית</span></div></div>' +
      (fileMode ? '<div class="card" style="padding:12px"><h3 style="margin:0 0 8px;font-size:13px">שלב התיק (מנהלת תיקי לקוחות)</h3><div class="flow" id="dlStageBar">' + stageBar(curStage) + '</div></div>' : '') +
      '<nav class="tabs" id="dlTabs" style="margin-bottom:14px;flex-wrap:wrap">' +
        dTab('client', '👤 פרטי הלקוח', true) + dTab('deal', '📋 פרטי העסקה') + dTab('car', '🚗 פרטי הרכב המוזמן') + dTab('fin', '🏦 מקטע מימון') + dTab('trade', '🔁 מקטע טרייד-אין') + dTab('record', '🗂️ פרטי רשומה') +
      '</nav>' +
      dPanel('client', true, '<div class="grid2">' + clientCard + formCard + '</div>') +
      dPanel('deal', false, '<div class="grid2">' + pricingCard + addonsCard + '</div>' + summaryCard) +
      dPanel('car', false, carCard + specCard) +
      dPanel('fin', false, finCard) +
      dPanel('trade', false, tradeCard) +
      dPanel('record', false, '<div class="grid2">' + checklistCard + recordCard + '</div>' + (fileMode ? '' : paymentsCard))
    );
    var $ = C.$;
    $('dlBack').addEventListener('click', function () { if ((C.role || '') === 'files') return window.C2B_renderFiles(); window.C2B_openLeadCard(lead.id); });
    $('dlTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-dtab]'); if (!b) return; $('dlTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); }); C.$('view').querySelectorAll('[data-dpanel]').forEach(function (p) { p.classList.toggle('hidden', p.dataset.dpanel !== b.dataset.dtab); }); });
    // stage bar (shown to file manager / admin only)
    if ($('dlStageBar')) $('dlStageBar').addEventListener('click', function (e) { var st = e.target.closest('[data-stage]'); if (!st) return; curStage = st.dataset.stage; $('dlStageBar').innerHTML = stageBar(curStage); if ($('dlRecStage')) $('dlRecStage').innerHTML = stageBadge(curStage); if (deal.id) { deal.stage = curStage; db.from('deals').update({ stage: curStage }).eq('id', deal.id); logActivity(lead.id, 'system', 'שלב עסקה: ' + stageDef(curStage).label); syncLeadFromStage(lead, curStage); } });
    // client documents in the record tab: view / upload (any format) / delete
    if (lead.id) {
      var loadDocs = function () {
        db.from('lead_documents').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).then(function (dr) {
          var docs = (dr && dr.data) || [];
          if (!$('dlDocs')) return;
          if (!docs.length) { $('dlDocs').innerHTML = '<p class="muted">אין מסמכים עדיין — לחצו "העלה מסמכים".</p>'; return; }
          var paths = docs.map(function (x) { return x.storage_path; }), sf = db.storage.from('lead-docs');
          (sf.createSignedUrls ? sf.createSignedUrls(paths, 3600) : Promise.resolve({ data: [] })).then(function (sr) {
            var urls = {}; ((sr && sr.data) || []).forEach(function (s) { if (s && s.signedUrl) urls[s.path] = s.signedUrl; });
            if (!$('dlDocs')) return;
            $('dlDocs').innerHTML = docs.map(function (x) {
              var u = urls[x.storage_path], ic = /\.pdf$/i.test(x.name || '') ? '📄' : (/\.(png|jpe?g|gif|webp)$/i.test(x.name || '') ? '🖼️' : '📎');
              return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)"><div style="flex:1">' + (u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + ic + ' ' + esc(x.name) + '</a>' : ic + ' ' + esc(x.name)) + ' <span class="muted" style="font-size:11px">· ' + fmt(x.created_at) + '</span></div><button class="btn btn-ghost btn-sm" data-deldoc="' + x.id + '" data-delpath="' + esc(x.storage_path) + '" title="מחק">🗑️</button></div>';
            }).join('');
            $('dlDocs').querySelectorAll('[data-deldoc]').forEach(function (b) {
              b.addEventListener('click', function () {
                if (!confirm('למחוק את המסמך?')) return;
                db.storage.from('lead-docs').remove([b.dataset.delpath]).then(function () {
                  db.from('lead_documents').delete().eq('id', b.dataset.deldoc).then(function () { logActivity(lead.id, 'document', 'נמחק מסמך'); loadDocs(); });
                });
              });
            });
          });
        });
      };
      loadDocs();
      if ($('dlDocUp')) $('dlDocUp').addEventListener('change', function () {
        var files = Array.prototype.slice.call(this.files); if (!files.length) return;
        $('dlDocs').innerHTML = '<p class="muted">מעלה ' + files.length + ' קבצים…</p>';
        var done = 0, ok = 0, errs = [];
        function finish() { if (++done === files.length) { if (ok) logActivity(lead.id, 'document', 'הועלו ' + ok + ' מסמכים'); if (errs.length) alert('חלק מהקבצים נכשלו:\n• ' + errs.join('\n• ')); loadDocs(); } }
        files.forEach(function (file) {
          var path = safeStoragePath(lead.id, file.name);
          db.storage.from('lead-docs').upload(path, file, { contentType: file.type || undefined, upsert: false }).then(function (u) {
            if (u.error) { errs.push(file.name + ': ' + u.error.message); finish(); return; }
            db.from('lead_documents').insert({ lead_id: lead.id, name: file.name, storage_path: path }).then(function (ir) {
              if (ir.error) errs.push(file.name + ' (רשומה): ' + ir.error.message); else ok++;
              finish();
            });
          }).catch(function (e) { errs.push(file.name + ': ' + (e.message || e)); finish(); });
        });
        this.value = '';
      });
    }
    // checklist
    $('dlChecklist').addEventListener('change', function (e) { var cb = e.target.closest('input[data-chk]'); if (!cb) return; checklist[cb.dataset.chk] = cb.checked; if (deal.id) db.from('deals').update({ checklist: checklist }).eq('id', deal.id); });
    // submit to financing (validation)
    $('dlSubmitFin').addEventListener('click', function () {
      var miss = [];
      if (!$('dl_client_id').value.trim()) miss.push('ת.ז לקוח');
      if (!$('dl_car_make').value.trim()) miss.push('רכב');
      if (!num('dl_car_price')) miss.push('מחיר רכב');
      if (!checklist['התקבל הסכם']) miss.push('הסכם חתום');
      if (!checklist['התקבלה ת"ז']) miss.push('צילום ת"ז');
      if (miss.length) { alert('לא ניתן להגיש למימון — חסר:\n• ' + miss.join('\n• ')); return; }
      curStage = 'submitted'; if ($('dlStageBar')) $('dlStageBar').innerHTML = stageBar(curStage); if ($('dlRecStage')) $('dlRecStage').innerHTML = stageBadge(curStage);
      logActivity(lead.id, 'system', 'התיק הוגש למימון');
      doSave();
    });
    function num(id) { var v = parseFloat(($(id) && $(id).value) || ''); return isNaN(v) ? 0 : v; }
    function compute() {
      var price = num('dl_car_price'), addons = num('dl_addons_amount');
      var subtotal = price + addons;
      var disc = num('dl_discount_amt') || (subtotal * num('dl_discount_pct') / 100);
      var total = Math.max(0, subtotal - disc);
      var downBal = num('dl_down_total') - num('dl_down_initial');
      var balPay = total - num('dl_down_total');
      $('dlSummary').innerHTML = row2('סכום מוצרים', nis(price)) + row2('תוספות', nis(addons)) + row2('הנחה', nis(disc)) + row2('יתרת מקדמה', nis(downBal)) +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid var(--brand);margin-top:6px;font-weight:800;font-size:17px"><span>סכום כולל</span><span style="color:var(--brand)">' + nis(total) + '</span></div>' + row2('יתרה לתשלום', nis(balPay));
      return { subtotal: subtotal, disc: disc, total: total, downBal: downBal, balPay: balPay };
    }
    function row2(k, v) { return '<div style="display:flex;justify-content:space-between;padding:5px 0"><span class="muted">' + k + '</span><span>' + v + '</span></div>'; }
    ['dl_car_price', 'dl_addons_amount', 'dl_discount_amt', 'dl_discount_pct', 'dl_down_total', 'dl_down_initial'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', compute); });
    compute();
    // car search fills fields
    loadCars(function (cars) {
      var inp = $('dl_carSearch'), res = $('dl_carRes');
      inp.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase(); if (!q) { res.classList.add('hidden'); return; }
        var m = cars.filter(function (c) { return ((c.brand || '') + ' ' + (c.name || '') + ' ' + (c.trim || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
        res.innerHTML = m.map(function (c) { return '<div class="ai" data-i="' + cars.indexOf(c) + '">' + (c.img ? '<img src="' + esc(c.img) + '" style="width:40px;height:26px;object-fit:cover;border-radius:5px">' : '') + '<span><b>' + esc(c.brand) + ' ' + esc(c.name) + '</b> ' + esc(c.trim || '') + ' · ' + nis(c.p) + '</span></div>'; }).join('') || '<div class="ai muted">אין תוצאות</div>';
        res.classList.remove('hidden');
        res.querySelectorAll('.ai[data-i]').forEach(function (el) { el.addEventListener('click', function () { var c = cars[+el.dataset.i]; $('dl_car_make').value = c.brand || ''; $('dl_car_model').value = c.name || ''; $('dl_car_trim').value = c.trim || ''; $('dl_car_engine').value = c.engine || ''; $('dl_car_color').value = c.colors || ''; $('dl_car_price').value = c.p || ''; $('dl_monthly').value = c.m || ''; if ($('dl_commission') && !deal.id) $('dl_commission').value = c.commission || ''; res.classList.add('hidden'); inp.value = ''; compute(); autoSave(); }); });
      });
    });
    // read the current form into a deal object (reused by save + contract)
    function readForm() {
      var c = compute();
      return {
        lead_id: lead.id, form_type: $('dl_form_type').value, status: $('dl_status').value, salesperson: $('dl_salesperson').value, brand: $('dl_brand') ? $('dl_brand').value : null,
        client_name: $('dl_client_name').value, client_phone: $('dl_client_phone').value, client_email: $('dl_client_email').value, client_address: $('dl_client_address').value, client_id: $('dl_client_id').value, invoice_name: $('dl_invoice_name').value,
        car_make: $('dl_car_make').value, car_model: $('dl_car_model').value, car_year: num('dl_car_year') || null, car_trim: $('dl_car_trim').value, car_engine: $('dl_car_engine').value, car_gearbox: $('dl_car_gearbox').value, car_color: $('dl_car_color').value,
        car_price: num('dl_car_price'), commission: num('dl_commission') || null, down_total: num('dl_down_total'), down_initial: num('dl_down_initial'), down_balance: c.downBal, monthly: num('dl_monthly'), delivery_days: num('dl_delivery_days') || null, balance_to_pay: c.balPay,
        addons: { charging: $('dl_charging').checked, armor: $('dl_armor').checked, accessories: $('dl_accessories').checked, addons_amount: num('dl_addons_amount') },
        vat_included: $('dl_vat').checked, discount_pct: num('dl_discount_pct') || null, discount_amt: c.disc, total: c.total, paid: num('dl_paid') || null, spec: $('dl_spec').value,
        stage: curStage, checklist: checklist,
        financing: { amount: num('dl_fin_amount') || null, approved: num('dl_fin_approved') || null, payments: num('dl_fin_payments') || null, monthly: num('dl_fin_monthly') || null, track: $('dl_fin_track').value, offer: $('dl_fin_offer').value, balloon: num('dl_fin_balloon') || null, status: $('dl_fin_status').value, transferred: $('dl_fin_transferred').checked },
        tradein: { plate: $('dl_ti_plate') ? $('dl_ti_plate').value : null, make: $('dl_ti_make').value, model: $('dl_ti_model').value, trim: $('dl_ti_trim').value, year: num('dl_ti_year') || null, hand: $('dl_ti_hand').value, color: $('dl_ti_color') ? $('dl_ti_color').value : null, fuel: $('dl_ti_fuel') ? $('dl_ti_fuel').value : null, vin: $('dl_ti_vin') ? $('dl_ti_vin').value : null, list: num('dl_ti_list') || null, buy: num('dl_ti_buy') || null, lien: num('dl_ti_lien') || null, holder: $('dl_ti_holder').value, delivery: $('dl_ti_delivery').value || null, liened: $('dl_ti_liened').checked }
      };
    }
    // ---- auto-save: persist every change (debounced), no button, no page refresh ----
    var saveTimer = null, inFlight = false, dirtyAgain = false, dealLogged = !!deal.id, lastStatus = deal.status || 'quote';
    function setState(txt) { var ind = $('dlSaveState'); if (ind) ind.textContent = txt; }
    function doSave() {
      if (inFlight) { dirtyAgain = true; return; }
      inFlight = true; setState('💾 שומר…');
      var payload = readForm();
      var q = deal.id ? db.from('deals').update(payload).eq('id', deal.id)
                      : db.from('deals').insert(payload).select('id,order_no').single();
      q.then(function (r) {
        inFlight = false;
        if (r.error) { setState('⚠ שגיאת שמירה'); console.warn('[deal auto-save]', r.error); return; }
        if (!deal.id && r.data) {
          deal.id = r.data.id; deal.order_no = r.data.order_no;
          var h = C.$('view') && C.$('view').querySelector('.lead-top h3'); if (h) h.textContent = 'עסקה #' + (deal.order_no || '');
        }
        if (!dealLogged) { dealLogged = true; logActivity(lead.id, 'quote', 'נוצרה עסקה: ' + (payload.car_make + ' ' + payload.car_model)); }
        // keep the lead status in sync when the order status changes — silently, no re-render
        if (payload.status !== lastStatus) {
          lastStatus = payload.status;
          var ns = payload.status === 'ordered' ? 'won' : (payload.status === 'cancelled' ? 'lost' : 'quote_sent');
          db.from('leads').update({ status: ns }).eq('id', lead.id).then(function () { if (C.refreshBadges) C.refreshBadges(); });
        }
        setState('✓ נשמר');
        if (dirtyAgain) { dirtyAgain = false; doSave(); }
      });
    }
    function autoSave() { clearTimeout(saveTimer); setState('…'); saveTimer = setTimeout(doSave, 700); }
    C.$('view').addEventListener('input', function (e) { if (e.target.id && e.target.id.indexOf('dl_') === 0) autoSave(); });
    C.$('view').addEventListener('change', function (e) { if (e.target.id && e.target.id.indexOf('dl_') === 0) autoSave(); });
    $('dlContract').addEventListener('click', function () { contractView(lead, Object.assign({ id: deal.id, order_no: deal.order_no }, readForm())); });
    // trade-in: pull vehicle details by plate number from the Ministry of Transport open dataset
    if ($('dlPlateLookup')) $('dlPlateLookup').addEventListener('click', function () {
      var plate = ($('dl_ti_plate').value || '').replace(/\D/g, ''); var msg = $('dlPlateMsg');
      if (!plate) { msg.style.color = 'var(--danger)'; msg.textContent = 'הזינו מספר רכב'; return; }
      msg.style.color = 'var(--muted)'; msg.textContent = 'מחפש…'; this.disabled = true;
      var btn = this;
      plateLookup(plate, function (v, err) {
        btn.disabled = false;
        if (err || !v) { msg.style.color = 'var(--danger)'; msg.textContent = err || 'לא נמצא רכב עם מספר זה'; return; }
        if (v.make && $('dl_ti_make')) $('dl_ti_make').value = v.make;
        if (v.model && $('dl_ti_model')) $('dl_ti_model').value = v.model;
        if (v.trim && $('dl_ti_trim')) $('dl_ti_trim').value = v.trim;
        if (v.year && $('dl_ti_year')) $('dl_ti_year').value = v.year;
        if (v.color && $('dl_ti_color')) $('dl_ti_color').value = v.color;
        if (v.fuel && $('dl_ti_fuel')) $('dl_ti_fuel').value = v.fuel;
        if (v.vin && $('dl_ti_vin')) $('dl_ti_vin').value = v.vin;
        msg.style.color = 'var(--ok)'; msg.textContent = '✅ ' + [v.make, v.model, v.year].filter(Boolean).join(' · ');
      });
    });
    // payments ledger
    if (deal.id) {
      var KIND = { payment: 'תשלום', receipt: 'קבלה', invoice: 'חשבונית' };
      var loadPayments = function () {
        db.from('payments').select('*').eq('deal_id', deal.id).order('created_at', { ascending: false }).then(function (r) {
          var ps = r.data || [];
          var paid = ps.filter(function (p) { return p.kind !== 'invoice'; }).reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
          $('dlPayList').innerHTML = (ps.length ? ps.map(function (p) { return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line)"><span>' + (KIND[p.kind] || p.kind) + (p.method ? ' · ' + esc(p.method) : '') + (p.ref_no ? ' · ' + esc(p.ref_no) : '') + '</span><b>' + nis(p.amount) + '</b></div>'; }).join('') : '<p class="muted">אין תשלומים</p>') +
            '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:800"><span>סה"כ שולם</span><span style="color:var(--ok)">' + nis(paid) + '</span></div>';
        });
      };
      loadPayments();
      $('dlPayForm').addEventListener('submit', function (e) {
        e.preventDefault(); var amt = parseFloat(this.amount.value) || 0; if (!amt) return; var kind = this.kind.value;
        db.from('payments').insert({ deal_id: deal.id, lead_id: lead.id, kind: kind, amount: amt, method: this.method.value, ref_no: this.ref.value, paid_at: new Date().toISOString().slice(0, 10) }).then(function (r) {
          if (r.error) return alert('שגיאה: ' + r.error.message);
          logActivity(lead.id, 'system', 'נרשם ' + (KIND[kind] || 'תשלום') + ': ' + nis(amt)); loadPayments();
        });
        this.reset();
      });
    }
  }

  // ---------- ACCOUNTING WORKSPACE (מנהלת חשבונות) ----------
  var ACCT_STATUSES = [
    { k: 'pending', label: 'ממתין לטיפול', color: '#6b7280' },
    { k: 'receipt', label: 'הופקה קבלה', color: '#16a34a' },
    { k: 'invoice', label: 'הופקה חשבונית', color: '#0ea5e9' },
    { k: 'partial', label: 'תשלום חלקי', color: '#eab308' },
    { k: 'paid', label: 'שולם ונסגר', color: '#16a34a' }
  ];
  var acctTab = 'deals', selectedAcct = {};
  window.C2B_renderAccounting = function () {
    selectedAcct = {};
    loading();
    Promise.all([
      db.from('deals').select('*').order('created_at', { ascending: false }),
      db.from('payments').select('*'),
      db.from('profiles').select('user_id,full_name'),
      db.from('lead_documents').select('*').order('created_at', { ascending: false }).limit(500),
      db.from('leads').select('id,name')
    ]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var deals = res[0].data || [], pays = (res[1] && res[1].data) || [], docs = (res[3] && res[3].data) || [];
      var prof = {}; ((res[2] && res[2].data) || []).forEach(function (p) { prof[p.user_id] = p.full_name; });
      var lname = {}; ((res[4] && res[4].data) || []).forEach(function (l) { lname[l.id] = l.name; });
      var paths = docs.map(function (d) { return d.storage_path; }), sf = db.storage.from('lead-docs');
      (paths.length && sf.createSignedUrls ? sf.createSignedUrls(paths, 3600) : Promise.resolve({ data: [] })).then(function (sr) {
        var urls = {}; ((sr && sr.data) || []).forEach(function (s) { if (s && s.signedUrl) urls[s.path] = s.signedUrl; });
        acctWorkspace(deals, pays, prof, lname, docs, urls);
      });
    }).catch(function (e) { errBox(e.message || e); });
  };
  function acctStatusSel(id, cur) { return '<select class="inp acct-st" data-acct="' + id + '" style="width:auto;font-size:12.5px">' + ACCT_STATUSES.map(function (s) { return '<option value="' + s.k + '"' + ((cur || 'pending') === s.k ? ' selected' : '') + '>' + esc(s.label) + '</option>'; }).join('') + '</select>'; }
  function acctWorkspace(deals, pays, prof, lname, docs, urls) {
    var paidByDeal = {}; pays.forEach(function (p) { if (p.kind !== 'invoice') paidByDeal[p.deal_id] = (paidByDeal[p.deal_id] || 0) + (+p.amount || 0); });
    var revenue = 0, collected = 0, open = 0, commTotal = 0;
    deals.forEach(function (d) { var tot = +d.total || 0, paid = paidByDeal[d.id] || 0; revenue += tot; collected += paid; open += Math.max(0, tot - paid); commTotal += (+d.commission || 0); });

    // TAB 1 — deals + receipts (what bought, invoice name, balance, commission, status, issue)
    var dealRows = deals.map(function (d) {
      var tot = +d.total || 0, paid = paidByDeal[d.id] || 0, bal = tot - paid;
      return '<tr data-lead="' + (d.lead_id || '') + '"><td style="width:28px;text-align:center"><input type="checkbox" data-asel="' + d.id + '"' + (selectedAcct[d.id] ? ' checked' : '') + '></td><td><b>#' + esc(d.order_no) + '</b></td>' +
        '<td>' + esc(d.client_name) + (d.signature ? ' <span style="color:var(--ok)" title="נחתם">✅</span>' : '') + '</td>' +
        '<td>' + esc(d.invoice_name || d.client_name || '—') + '</td>' +
        '<td>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim() || '—') + '</td>' +
        '<td>' + nis(tot) + '</td><td>' + nis(paid) + '</td><td style="color:' + (bal > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + nis(bal) + '</td>' +
        '<td>' + esc(d.salesperson || '—') + '</td><td style="color:var(--ok);font-weight:700">' + nis(d.commission) + '</td>' +
        '<td>' + acctStatusSel(d.id, d.acct_status) + '</td></tr>';
    }).join('');
    var aBulk = '<div id="aBulk" class="filterbar" style="display:none;background:var(--brand-soft);align-items:center"><b id="aBulkCount" style="color:var(--brand)">נבחרו 0</b><select id="aBulkStatus"><option value="">🏷️ שנה סטטוס…</option>' + ACCT_STATUSES.map(function (s) { return '<option value="' + s.k + '">' + esc(s.label) + '</option>'; }).join('') + '</select><button class="btn btn-sm" id="aBulkApply">החל על הנבחרים</button><button class="btn btn-ghost btn-sm" id="aBulkClear">בטל בחירה</button></div>';
    var dealsPanel = '<div class="card"><h3>עסקאות · קבלות · חשבוניות <span class="muted" style="font-size:12px">(סמנו לפעולה גורפת · לחצו על שורה לפתיחת תיק החשבונות)</span></h3>' + aBulk + '<div class="table-scroll"><table><thead><tr><th style="width:28px;text-align:center"><input type="checkbox" id="aSelAll"></th><th>#</th><th>לקוח</th><th>קבלה על שם</th><th>מה נקנה</th><th>סכום</th><th>שולם</th><th>יתרה</th><th>סוכן</th><th>עמלה</th><th>סטטוס</th></tr></thead><tbody>' + (dealRows || '<tr><td colspan="11" class="empty">אין עסקאות</td></tr>') + '</tbody></table></div></div>';

    // TAB 2 — commission per agent (frozen values)
    var byAgent = {}; deals.forEach(function (d) { var a = d.salesperson || 'לא שויך'; byAgent[a] = byAgent[a] || { n: 0, comm: 0, total: 0 }; byAgent[a].n++; byAgent[a].comm += (+d.commission || 0); byAgent[a].total += (+d.total || 0); });
    var agents = Object.keys(byAgent).sort(function (a, b) { return byAgent[b].comm - byAgent[a].comm; });
    var commRows = agents.map(function (a) { var o = byAgent[a]; return '<tr><td><b>' + esc(a) + '</b></td><td>' + o.n + '</td><td>' + nis(o.total) + '</td><td style="color:var(--ok);font-weight:800">' + nis(o.comm) + '</td></tr>'; }).join('');
    var commPanel = '<div class="cards">' + C.stat('סה"כ עמלות לתשלום', nis(commTotal), true) + C.stat('מספר סוכנים', agents.length) + '</div>' +
      '<div class="card"><h3>💸 עמלות לפי סוכן <span class="muted" style="font-size:12px">(ערכים מוקפאים — לא משתנים עם עדכון הקטלוג)</span></h3><div class="table-scroll"><table><thead><tr><th>סוכן</th><th>עסקאות</th><th>שווי עסקאות</th><th>עמלה מצטברת</th></tr></thead><tbody>' + (commRows || '<tr><td colspan="4" class="empty">אין נתונים</td></tr>') + '</tbody></table></div></div>';

    // TAB 3 — documents (signed contracts + uploads)
    var docRows = docs.map(function (x) {
      var u = urls[x.storage_path], ic = /\.pdf$/i.test(x.name || '') ? '📄' : (/\.(png|jpe?g|gif|webp)$/i.test(x.name || '') ? '🖼️' : '📎');
      return '<tr><td>' + esc(lname[x.lead_id] || '—') + '</td><td>' + (u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + ic + ' ' + esc(x.name) + '</a>' : ic + ' ' + esc(x.name)) + '</td><td class="muted">' + fmt(x.created_at) + '</td></tr>';
    }).join('');
    var docsPanel = '<div class="card"><h3>📁 כל המסמכים (הסכמים חתומים ומסמכי לקוח)</h3><div class="table-scroll"><table><thead><tr><th>לקוח</th><th>מסמך</th><th>תאריך</th></tr></thead><tbody>' + (docRows || '<tr><td colspan="3" class="empty">אין מסמכים</td></tr>') + '</tbody></table></div></div>';

    var panels = { deals: dealsPanel, commissions: commPanel, documents: docsPanel };
    function tab(k, l) { return '<button data-atab="' + k + '"' + (acctTab === k ? ' class="active"' : '') + '>' + l + '</button>'; }
    view('<h2 style="margin:0 0 12px">🧮 מרכז הנהלת חשבונות</h2>' +
      '<div class="cards">' + C.stat('שווי עסקאות', nis(revenue), true) + C.stat('נגבה בפועל', nis(collected)) + C.stat('יתרה פתוחה', nis(open)) + C.stat('סה"כ עמלות סוכנים', nis(commTotal)) + '</div>' +
      '<nav class="tabs" id="acctTabs" style="margin-bottom:14px;flex-wrap:wrap">' + tab('deals', '🧾 עסקאות וקבלות') + tab('commissions', '💸 עמלות סוכנים') + tab('documents', '📁 מסמכים') + '</nav><div id="acctPanel">' + panels[acctTab] + '</div>');

    function bindPanel() {
      var P = C.$('acctPanel');
      P.querySelectorAll('tr[data-lead]').forEach(function (tr) { tr.addEventListener('click', function (e) { if (e.target.closest('select,button,a,input')) return; if (tr.dataset.lead) openAcctLeadView(tr.dataset.lead); }); });
      P.querySelectorAll('.acct-st').forEach(function (s) { s.addEventListener('change', function () { db.from('deals').update({ acct_status: s.value }).eq('id', s.dataset.acct); }); });
      // bulk selection + status change
      function ids() { return Object.keys(selectedAcct).filter(function (k) { return selectedAcct[k]; }); }
      function upd() { var n = ids().length, bar = C.$('aBulk'); if (!bar) return; bar.style.display = n ? 'flex' : 'none'; if (C.$('aBulkCount')) C.$('aBulkCount').textContent = 'נבחרו ' + n; var sa = C.$('aSelAll'); if (sa) { var b = P.querySelectorAll('input[data-asel]'), c = P.querySelectorAll('input[data-asel]:checked'); sa.checked = b.length && c.length === b.length; sa.indeterminate = c.length > 0 && c.length < b.length; } }
      P.querySelectorAll('input[data-asel]').forEach(function (cb) { cb.addEventListener('change', function () { if (cb.checked) selectedAcct[cb.dataset.asel] = true; else delete selectedAcct[cb.dataset.asel]; upd(); }); });
      if (C.$('aSelAll')) C.$('aSelAll').addEventListener('change', function () { var on = this.checked; P.querySelectorAll('input[data-asel]').forEach(function (cb) { cb.checked = on; if (on) selectedAcct[cb.dataset.asel] = true; else delete selectedAcct[cb.dataset.asel]; }); upd(); });
      if (C.$('aBulkClear')) C.$('aBulkClear').addEventListener('click', function () { selectedAcct = {}; P.querySelectorAll('input[data-asel]').forEach(function (cb) { cb.checked = false; }); upd(); });
      if (C.$('aBulkApply')) C.$('aBulkApply').addEventListener('click', function () { var list = ids(); if (!list.length) return; var st = C.$('aBulkStatus').value; if (!st) { alert('בחרו סטטוס'); return; } db.from('deals').update({ acct_status: st }).in('id', list).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); return; } selectedAcct = {}; window.C2B_renderAccounting(); }); });
      upd();
    }
    C.$('acctTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-atab]'); if (!b) return; acctTab = b.dataset.atab; C.$('acctTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x.dataset.atab === acctTab); }); C.$('acctPanel').innerHTML = panels[acctTab]; bindPanel(); });
    bindPanel();
  }

  // accounting manager's dedicated per-lead view (only what's critical for her)
  var PAY_PURPOSES = [
    { k: 'deposit1', label: 'מקדמה ראשונית' },
    { k: 'deposit2', label: 'השלמת מקדמה' },
    { k: 'purchase', label: 'תשלום רכישת הרכב' },
    { k: 'other', label: 'אחר / התאמה' }
  ];
  function purposeLabel(k) { for (var i = 0; i < PAY_PURPOSES.length; i++) if (PAY_PURPOSES[i].k === k) return PAY_PURPOSES[i].label; return 'תשלום'; }
  var PKIND = { payment: 'תשלום', receipt: 'קבלה', invoice: 'חשבונית' };
  function acctPayList(ps) {
    return ps.length ? ps.map(function (p) {
      var head = p.purpose ? esc(purposeLabel(p.purpose)) : (PKIND[p.kind] || p.kind);
      var doc = (p.kind && p.kind !== 'payment') ? ' <span class="tag" style="font-size:10px">' + esc(PKIND[p.kind] || p.kind) + '</span>' : '';
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line)"><span>' + head + doc + (p.method ? ' · ' + esc(p.method) : '') + (p.ref_no ? ' · ' + esc(p.ref_no) : '') + ' <span class="muted" style="font-size:11px">' + fmt(p.created_at) + '</span></span><b>' + nis(p.amount) + '</b></div>';
    }).join('') : '<p class="muted" style="margin:4px 0">אין תשלומים</p>';
  }
  function openAcctLeadView(id) {
    loading();
    Promise.all([
      db.from('leads').select('*').eq('id', id).single(),
      db.from('deals').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('payments').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      db.from('lead_documents').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    ]).then(function (r) {
      if (r[0].error) return errBox(r[0].error.message);
      var lead = r[0].data, deals = (r[1] && r[1].data) || [], pays = (r[2] && r[2].data) || [], docs = (r[3] && r[3].data) || [];
      var paths = docs.map(function (d) { return d.storage_path; }), sf = db.storage.from('lead-docs');
      (paths.length && sf.createSignedUrls ? sf.createSignedUrls(paths, 3600) : Promise.resolve({ data: [] })).then(function (sr) {
        var urls = {}; ((sr && sr.data) || []).forEach(function (s) { if (s && s.signedUrl) urls[s.path] = s.signedUrl; });
        var paidByDeal = {}; pays.forEach(function (p) { if (p.kind !== 'invoice') paidByDeal[p.deal_id] = (paidByDeal[p.deal_id] || 0) + (+p.amount || 0); });
        function lf2(k, v) { return '<div class="lf"><span class="k">' + k + '</span><span class="v">' + (v == null || v === '' ? '—' : v) + '</span></div>'; }
        function fld(lbl, name, val, ph) { return '<label class="lf" style="align-items:center"><span class="k">' + lbl + '</span><input class="inp" name="' + name + '" value="' + esc(val || '') + '" placeholder="' + (ph || '') + '" style="max-width:190px"></label>'; }

        var dealCards = deals.length ? deals.map(function (d) {
          var dp = pays.filter(function (p) { return p.deal_id === d.id; });
          var tot = +d.total || 0, paid = paidByDeal[d.id] || 0, bal = tot - paid;
          var charge = (d.charge_amount != null && d.charge_amount !== '') ? +d.charge_amount : bal;
          // הפרדת תשלומים לפי שלב (ללא חשבוניות)
          var byPurpose = {}; dp.forEach(function (p) { if (p.kind === 'invoice') return; var k = p.purpose || 'other'; byPurpose[k] = (byPurpose[k] || 0) + (+p.amount || 0); });
          var breakdown = PAY_PURPOSES.map(function (pp) { var v = byPurpose[pp.k] || 0; return '<div class="lf"><span class="k">' + pp.label + '</span><span class="v"><b style="color:' + (v > 0 ? 'var(--ok)' : 'var(--muted)') + '">' + nis(v) + '</b></span></div>'; }).join('');

          return '<div class="card"><div class="row-between"><h3 style="margin:0">עסקה #' + esc(d.order_no) + (d.signature ? ' <span class="tag" style="border-color:var(--ok);color:var(--ok)">✅ נחתם</span>' : '') + '</h3>' + acctStatusSel(d.id, d.acct_status) + '</div>' +
            '<div class="grid2">' +
              // פרטי חשבונית מרוכזים — ניתנים לעריכה ע"י הנה"ח
              '<form class="aef lead-fields" data-deal="' + d.id + '"><div class="muted" style="font-size:12px;font-weight:700;margin-bottom:4px">🧾 פרטים לחשבונית / קבלה</div>' +
                fld('שם על החשבונית', 'invoice_name', d.invoice_name || d.client_name, 'שם מלא / חברה') +
                fld('ת.ז / ח.פ', 'client_id', d.client_id, 'מספר מזהה') +
                fld('טלפון', 'client_phone', d.client_phone || lead.phone) +
                fld('דוא"ל', 'client_email', d.client_email || lead.email) +
                fld('כתובת לחיוב', 'client_address', d.client_address, 'רחוב, עיר') +
                fld('סכום לחיוב ₪', 'charge_amount', (d.charge_amount != null ? d.charge_amount : ''), 'ברירת מחדל: היתרה') +
                '<button class="btn btn-sm" style="margin-top:6px">💾 שמור פרטי חשבונית</button></form>' +
              // סיכום כספי
              '<div class="lead-fields"><div class="muted" style="font-size:12px;font-weight:700;margin-bottom:4px">💰 סיכום כספי</div>' +
                lf2('מה נקנה', esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim())) +
                lf2('מחיר הרכב', nis(d.car_price)) +
                lf2('מקדמה נדרשת', nis(d.down_total)) +
                lf2('סכום העסקה', '<b>' + nis(tot) + '</b>') +
                lf2('סכום לחיוב', '<b style="color:var(--brand)">' + nis(charge) + '</b>') +
                lf2('שולם עד כה', '<b style="color:var(--ok)">' + nis(paid) + '</b>') +
                lf2('יתרה לתשלום', '<b style="color:' + (bal > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + nis(bal) + '</b>') +
                lf2('עמלת סוכן (מוקפאת)', '<b style="color:var(--ok)">' + nis(d.commission) + '</b>') +
                lf2('סוכן מכירות', esc(d.salesperson)) +
              '</div></div>' +
            '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-receipt="' + d.id + '">📄 הפק קבלה</button><button class="btn btn-ghost" data-invoice="' + d.id + '">🧾 הפק חשבונית</button></div>' +
            '<h3 style="margin:18px 0 8px">📊 פירוט תשלומים לפי שלב</h3><div class="lead-fields">' + breakdown + '</div>' +
            '<h3 style="margin:18px 0 8px">רישום תשלומים / קבלות</h3><div>' + acctPayList(dp) + '</div>' +
            '<form class="apf" data-deal="' + d.id + '" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px">' +
              '<select class="inp" name="purpose" style="min-width:150px">' + PAY_PURPOSES.map(function (pp) { return '<option value="' + pp.k + '">' + esc(pp.label) + '</option>'; }).join('') + '</select>' +
              '<select class="inp" name="kind"><option value="payment">תשלום</option><option value="receipt">קבלה</option><option value="invoice">חשבונית</option></select>' +
              '<input class="inp" name="amount" type="number" placeholder="סכום ₪" style="width:120px"><input class="inp" name="method" placeholder="אמצעי (מזומן/אשראי)" style="width:150px"><input class="inp" name="ref" placeholder="אסמכתא" style="width:120px"><button class="btn btn-sm">+ רשום</button></form>' +
          '</div>';
        }).join('') : '<div class="card"><p class="muted">אין עסקה/הצעה לליד זה עדיין.</p></div>';
        var docRows = docs.map(function (x) { var u = urls[x.storage_path], ic = /\.pdf$/i.test(x.name || '') ? '📄' : (/\.(png|jpe?g|gif|webp)$/i.test(x.name || '') ? '🖼️' : '📎'); return '<div style="padding:7px 0;border-bottom:1px solid var(--line)">' + (u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + ic + ' ' + esc(x.name) + '</a>' : ic + ' ' + esc(x.name)) + ' <span class="muted" style="font-size:11px">· ' + fmt(x.created_at) + '</span></div>'; }).join('') || '<p class="muted">אין מסמכים</p>';
        view('<div class="lead-top"><button class="btn btn-ghost btn-sm" id="alBack">→ להנהלת חשבונות</button><h3 style="margin:0">🧮 תיק חשבונות — ' + esc(lead.name || 'לקוח') + '</h3></div>' + dealCards + '<div class="card"><h3>📁 מסמכים</h3>' + docRows + '</div>');
        var $ = C.$;
        $('alBack').addEventListener('click', function () { window.C2B_renderAccounting(); });
        $('view').querySelectorAll('.acct-st').forEach(function (s) { s.addEventListener('change', function () { db.from('deals').update({ acct_status: s.value }).eq('id', s.dataset.acct); }); });
        $('view').querySelectorAll('.aef').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var upd = { invoice_name: this.invoice_name.value.trim() || null, client_id: this.client_id.value.trim() || null, client_phone: this.client_phone.value.trim() || null, client_email: this.client_email.value.trim() || null, client_address: this.client_address.value.trim() || null, charge_amount: this.charge_amount.value === '' ? null : (parseFloat(this.charge_amount.value) || 0) }; var btn = this.querySelector('button'); btn.textContent = 'שומר…'; db.from('deals').update(upd).eq('id', this.dataset.deal).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); btn.textContent = '💾 שמור פרטי חשבונית'; return; } btn.textContent = '✅ נשמר'; setTimeout(function () { btn.textContent = '💾 שמור פרטי חשבונית'; }, 1500); }); }); });
        $('view').querySelectorAll('[data-receipt]').forEach(function (b) { b.addEventListener('click', function () { db.from('deals').update({ acct_status: 'receipt' }).eq('id', b.dataset.receipt).then(function () { alert('סומן "הופקה קבלה". חיבור לחשבונית ירוקה יאפשר הפקה אוטומטית. 🧾'); openAcctLeadView(lead.id); }); }); });
        $('view').querySelectorAll('[data-invoice]').forEach(function (b) { b.addEventListener('click', function () { db.from('deals').update({ acct_status: 'invoice' }).eq('id', b.dataset.invoice).then(function () { alert('סומן "הופקה חשבונית". חיבור לחשבונית ירוקה יאפשר הפקה אוטומטית. 🧾'); openAcctLeadView(lead.id); }); }); });
        $('view').querySelectorAll('.apf').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var amt = parseFloat(this.amount.value) || 0; if (!amt) return; db.from('payments').insert({ deal_id: this.dataset.deal, lead_id: lead.id, kind: this.kind.value, purpose: this.purpose.value, amount: amt, method: this.method.value, ref_no: this.ref.value, paid_at: new Date().toISOString().slice(0, 10) }).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); return; } logActivity(lead.id, 'system', 'נרשם ' + purposeLabel(f.purpose.value) + ': ' + nis(amt)); openAcctLeadView(lead.id); }); }); });
      });
    });
  }

  // ---------- CONTRACT (auto-filled + browser signature) ----------
  function contractHTML(d, sig, ownership) {
    var today = new Date().toLocaleDateString('he-IL');
    var own = ownership || (d.checklist && d.checklist._ownership) || '01';
    var ad = d.addons || {};
    var addTxt = [ad.charging ? 'עמדת טעינה' : '', ad.armor ? 'מיגון' : '', ad.accessories ? 'אביזרים' : '', ad.addons_amount ? nis(ad.addons_amount) : ''].filter(Boolean).join(', ') || '—';
    var owner = (window.C2B && C2B.userName) || '';
    function row(k, v) { return '<tr><td style="padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;color:#555">' + k + '</td><td style="padding:5px 8px;border-bottom:1px solid #eee"><b>' + (v == null || v === '' ? '—' : esc(v)) + '</b></td></tr>'; }
    var C = [
      '10. הרכב ירשם ברישיון הרכב על שם הלקוח כבעלים ' + own + '.',
      'המחיר הנקוב לעיל הינו לפי המחירון התקף של היבואן נכון למועד ההזמנה, והינו המחיר למשלם במועד ביצוע ההזמנה. המחיר למשלם בכל מועד לאחר מועד ההזמנה ובתוך 7 ימים לכל היותר מיום קבלת הודעה כי הרכב מוכן לשחרור מהמכס יהיה בהתאם למחיר הרכב במחירון התקף של היבואן ביום התשלום.',
      'הזמנה זו מהווה את התנאים הכלליים לרכישת הרכב בלבד.',
      'מחיר הרכב — תשומת לב המזמין מופנית לכך שהמחיר עשוי להשתנות בין מועד ההזמנה לבין מועד מסירת הרכב למזמין. כל שינוי במחיר הרכב, בין לאור שינוי במיסוי ובין לאור שינוי מחיר מכל סיבה שהיא, יחול על המזמין בלבד וישולם על ידו. מחירו הסופי של רכב חשמלי יהיה בהתאמה לאחוז המיסוי לתאריך הרישוי של הרכב ועלול להשתנות לפי שינוי אחוזי המס.',
      'עם חתימתו על הסכם זה הלקוח מאשר בזאת לחברה לבצע הזמנה בשמו אצל היבואן המורשה.',
      'זמן אספקת הרכב בהתאם ובכפוף למועדי אספקת הרכב על ידי היבואנים/חברות הליסינג. כל איחור במועד האספקה אינו באחריותה של החברה ולא יקנה למזמין כל פיצוי. תאריך משוער לאספקת הרכב הנו 30 ימי עסקים מיום פירעון התשלום המלא על הרכב.',
      'הלקוח מאשר בזאת לחברה ו/או מי מטעמה לפנות בשמו לבנקים ו/או כל גורם מימון אחר בכדי לסייע בידו ולקדם את הלוואת המימון הנדרשת לרכישת הרכב, ככל ונדרשת. לשם כך, יחתום הלקוח על כל מסמך אשר יידרש ע"י החברה ו/או מי מטעמה ו/או ע"י הבנק ו/או הגוף המממן. במידה ומסיבה אשר אינה תלויה בחברה לא אושרה ללקוח ההלוואה, החברה תשיב ללקוח את תשלום המקדמה המלא וללקוח ולחברה לא תהיה כל טענה ו/או דרישה ו/או תביעה האחד כנגד משנהו.',
      'עמלת הקמת הלוואה ו/או פתיחת תיק ו/או כל עמלה בנקאית אחרת, ככל ויחולו, ישולמו ע"י הלקוח ישירות לבנק או לאותו גוף. תוכנית המימון הבנקאי וגובה ההחזר הכולל ו/או החודשי ו/או התשלומים הנלווים יקבעו סופית ע"י הבנק או גוף המימון והם אינם באחריותה של החברה. כל מידע הנמסר ללקוח במועד ההזמנה ו/או הפגישה הנו בגדר השערה בלבד וכפוף להחלטת הבנק ו/או הגוף המממן.',
      'המזמין יישא בשינויי מיסים עקיפים המוטלים על-ידי רשויות המדינה אשר אינם בשליטת היבואן ו/או החברה, שיחולו, אם יחולו, אם יוטלו ו/או יועלו בין יום ההזמנה ליום מסירת הרכב למזמין ויחולו על עסקת רכישת הרכב.',
      'המזמין רשאי לבטל את ההזמנה תוך ארבעה עשר (14) יום מיום ההזמנה, וזאת ככל וטרם אושר במסגרת חברת מימון ו/או ככל וטרם שילם את מלוא התשלום על הרכב ו/או ככל שהרכב טרם נרשם על שמו במרשם המתנהל על פי פקודת התעבורה (נוסח חדש), ואם הזמין תוספות מיוחדות לרכב — טרם הרכבת התוספות המיוחדות, לפי המוקדם, ולקבל את התמורה ששילם למוכר בחזרה בניכוי דמי הביטול בסך 5,000 ש"ח.',
      'ככל ובוטל ההסכם ע"י המזמין במועד ו/או מסיבה אשר אינה מנויה לעיל, יהא חייב המזמין בתשלום מלוא המקדמה כפיצוי מוסכם מוערך מראש, וזאת מבלי לגרוע מזכאותה של החברה לדרוש ו/או להיפרע מנזקיה עפ"י כל דין.',
      'מסירת הרכב למזמין תהא בהתאם להוראות היבואן. טרם מסירת הרכב למזמין וכתנאי לכך, יבטח המזמין את הרכב כנדרש על-פי דין ויציג מסמכים המאשרים זאת בפני החברה ו/או היבואן (לכל הפחות תעודת ביטוח חובה תקפה לרכב).',
      'לצורך קיום התחייבויות החברה במסגרת הסכם זה ובכדי לשמר את טיב ורמת הטיפול ברכב אשר יאפשר קבלתו בתום התקופה, פוליסות הביטוח כאמור לעיל ירכשו ע"י הלקוח אך ורק מאת החברה/סוכנות הביטוח מטעמה ובאישורה בלבד וכתנאי בלתו אין לתוקפו של ההסכם.',
      'הצהרת פרטיות: ידוע לי כי הפרטים שמסרתי בהזמנה זו לעיל יכללו במאגרי המידע של החברה ו/או היבואן הרשומים כדין וזאת בהתאם למדיניות הפרטיות של החברה.'
    ];
    var gen = [
      'הזמנה זו ממצה את יחסי הצדדים בכל הנוגע לנושאם, וכל הסכמה, התחייבות, הבטחה ומצג שנעשו בין הצדדים טרם חתימתם, בין בעל פה ובין בכתב, ככל שנעשו, בטלים בזאת. כל שינוי ו/או תיקון של ההזמנה יחייבו רק אם נערכו בכתב ונחתמו על-ידי כל הצדדים.',
      'בכל מקרה לפיו הוראה כלשהי בהזמנה ו/או בהסכם המקורי תהפוך לבלתי חוקית, בלתי תקפה או בלתי אכיפה, לא יהיה בכך כדי למנוע ו/או לגרוע מתקפות ו/או חוקיות ההוראות האחרות.',
      'כל שיהוי, ויתור, ארכה, איחור או הימנעות של צד להזמנה זו למימוש זכויותיו ו/או בדרישת קיום ו/או הסכמתו לסטות מתנאי הצהרה זו לא יהוו תקדים, לא יחשבו לוויתור ו/או הסכמה של אותו צד ואין להסיק מהן גזירה שווה למקרה אחר. מובהר, כי שום דבר האמור בהצהרה זו לא יתפרש כמקנה זכות כלשהי לטובת צד שלישי.',
      'המזמין מאשר ומצהיר כי קרא בעיון את הצהרה זו על כל סעיפיה, וכי הוא חותם עליהם מתוך הבנה מלאה של תוכנם ומשמעותם.',
      'על הצהרה זו ו/או ההסכם המקורי, פרשנותם ו/או ביצועם יחולו אך ורק דיני מדינת ישראל. סמכות השיפוט הבלעדית בכל הקשור ו/או הנובע מהם תהא נתונה לבית המשפט המוסמך במחוז המרכז.',
      'כתובות הצדדים להזמנה זאת הן כקבוע במבוא לה, זאת כל עוד לא הודיע צד למשנהו על שינוי בכתובת. כל הודעה או התראה שתישלח על-ידי צד למשנהו על פי כתובתו כאמור בדואר רשום, תיחשב כאילו התקבלה על-ידי הנמען 72 שעות לאחר מסירתה למשרד הדואר; אם נמסרה ביד — מעת מסירתה. הודעה שנשלחה בפקס תחשב כאילו התקבלה בשעה הרשומה על גבי אישור העברת הפקס בתנאי שנשלחה ביום עבודה (א׳–ה׳) בין השעות 09:00–17:00 (זמן ישראל).'
    ];
    return '<div style="font-family:Arial,sans-serif;line-height:1.65;max-width:760px;margin:auto;color:#111;font-size:13.5px">' +
      '<h2 style="text-align:center;color:#F5691E;margin:0 0 2px">הסכם הזמנת רכב' + (d.brand ? ' — ' + esc(d.brand) : '') + '</h2>' +
      '<p style="text-align:center;color:#555;margin:0 0 4px">buy 2 Car באמצעות גלובל דרייב ח.פ 516685898 (להלן: "גלובל דרייב")</p>' +
      '<p style="text-align:center;color:#888;margin:0 0 10px;font-size:12.5px">מספר הזמנה: ' + esc(d.order_no || '—') + ' · תאריך: ' + today + '</p><hr>' +
      '<table style="width:100%;border-collapse:collapse;margin:10px 0">' +
        row('שם המזמין', d.client_name) + row('ת.ז / ח.פ', d.client_id) + row('כתובת', d.client_address) + row('טלפון', d.client_phone) +
        row('סוג הרכב', d.car_make) + row('דגם', d.car_model) + row('רמת גימור', d.car_trim) + row('נפח מנוע', d.car_engine) +
        row('צבע הרכב', d.car_color) + row('שנת ייצור', d.car_year) + row('תוספות', addTxt) +
        row('מקדמה', nis(d.down_total) + ' *') + row('יתרה לתשלום', nis(d.balance_to_pay) + ' **') +
      '</table>' +
      '<ol style="padding-inline-start:20px;margin:8px 0">' + C.map(function (t) { return '<li style="margin-bottom:7px">' + t + '</li>'; }).join('') + '</ol>' +
      '<p style="font-weight:700;margin:12px 0 4px">כללי:</p>' +
      '<ol style="padding-inline-start:20px;margin:0" type="a">' + gen.map(function (t, i) { return '<li style="margin-bottom:7px">' + t + '</li>'; }).join('') + '</ol>' +
      '<p style="font-size:12px;color:#555;margin-top:12px">* הקונה מצהיר בזאת כי קרא את סעיפי ההסכם והבין את משמעותם ותוכנם.</p>' +
      '<div style="margin-top:30px;display:flex;justify-content:space-between;align-items:flex-end">' +
        '<div>חתימת הרוכש:<br>' + (sig ? '<img src="' + sig + '" style="height:70px">' : '________________________') + '</div>' +
        '<div style="text-align:left">בברכה,<br><b>צוות Car2Buy</b><br>' + esc(owner || '054-470-0706') + '</div>' +
      '</div></div>';
  }
  function contractView(lead, deal) {
    // pull the latest signature (esp. after a remote sign) so we can show it
    if (deal.id && !deal._sigLoaded) {
      db.from('deals').select('signature,signed_at').eq('id', deal.id).single().then(function (r) {
        deal._sigLoaded = true;
        if (r.data) { deal.signature = deal.signature || r.data.signature; deal.signed_at = r.data.signed_at; }
        contractView(lead, deal);
      });
      return;
    }
    var signed = !!deal.signature;
    var curOwn = (deal.checklist && deal.checklist._ownership) || '01';
    view(
      '<div class="lead-top"><button class="btn btn-ghost btn-sm" id="cBack">→ לעסקה</button><h3 style="margin:0">הסכם' + (deal.brand ? ' · ' + esc(deal.brand) : '') + ' — ' + esc(deal.client_name || '') + (signed ? ' <span class="tag" style="border-color:var(--ok);color:var(--ok);background:rgba(22,163,74,.1)">✅ נחתם</span>' : '') + '</h3>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (signed ? '' : '<label style="font-size:12.5px;color:var(--muted)">בעלות:</label><select class="inp" id="cOwnership" style="width:auto;padding:5px 8px"><option value="01"' + (curOwn === '01' ? ' selected' : '') + '>בעלים 01</option><option value="00"' + (curOwn === '00' ? ' selected' : '') + '>בעלים 00</option></select>') +
          '<button class="btn btn-ghost btn-sm" id="cPrint">🖨️ הדפס</button>' + (signed ? '<button class="btn btn-sm" id="cPdf">📄 הורד PDF חתום</button>' : '<button class="btn btn-sm" id="cSend">💾 שמור הסכם</button>') + '</div></div>' +
      (signed ? '<div class="card" style="border:1px solid var(--ok);background:rgba(22,163,74,.06)"><b style="color:var(--ok)">✅ ההסכם נחתם על ידי הלקוח' + (deal.signed_at ? ' בתאריך ' + fmt(deal.signed_at) : '') + '</b><span class="muted"> — למטה ההסכם המלא עם חתימת הלקוח.</span></div>' : '') +
      '<div class="card" id="cDoc" style="background:#fff;color:#111">' + contractHTML(deal, deal.signature || null) + '</div>' +
      (signed ? '' :
        '<div class="card"><h3>📨 שליחה לחתימה מרחוק</h3><p class="muted" style="font-size:12px;margin:-6px 0 12px">רק הלקוח חותם — דרך הקישור שנשלח אליו. אין חתימה במקום כדי למנוע זיופים.</p>' +
          (deal.id ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input class="inp" id="cLinkEmail" value="' + esc(deal.client_email || '') + '" placeholder="אימייל הלקוח" style="flex:1;min-width:170px"><button class="btn btn-sm" id="cSendMail">📧 שלח במייל</button></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="cWa">💬 וואטסאפ</button><button class="btn btn-ghost btn-sm" id="cSms">✉️ SMS</button><button class="btn btn-ghost btn-sm" id="cCopy">🔗 העתק קישור</button></div>' +
            '<div id="cLinkMsg" style="font-size:13px;margin-top:10px"></div>'
            : '<p class="muted">לחצו <b>💾 שמור הסכם</b> תחילה — לאחר השמירה יופיעו כאן דרכי השליחה ללקוח (מייל / וואטסאפ / SMS / העתקת קישור).</p>') + '</div>')
    );
    var $ = C.$;
    $('cBack').addEventListener('click', function () { dealForm(lead, deal); });
    if ($('cOwnership')) $('cOwnership').addEventListener('change', function () {
      deal.checklist = deal.checklist || {}; deal.checklist._ownership = this.value;
      $('cDoc').innerHTML = contractHTML(deal, deal.signature || null);
      if (deal.id) db.from('deals').update({ checklist: deal.checklist }).eq('id', deal.id);
    });
    $('cPrint').addEventListener('click', function () { var w = window.open('', '_blank'); if (!w) return; w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>הסכם</title></head><body>' + $('cDoc').innerHTML + '</body></html>'); w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 250); });
    if (signed) {
      if ($('cPdf')) $('cPdf').addEventListener('click', function () { if (!window.html2pdf) return alert('הורדת PDF אינה זמינה'); genContractPdf(deal, function (blob) { if (!blob) return alert('יצירת PDF נכשלה'); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'הסכם_' + (deal.order_no || deal.id) + '.pdf'; a.click(); }); });
      ensureSignedPdf(lead, deal);   // persist the signed PDF once → visible in both views
      return;   // signed → view/print/download only
    }
    // ---- remote signing: build link + send via email / WhatsApp / SMS ----
    if (deal.id) {
      var signBase = location.href.split('#')[0].replace(/[^/]*$/, 'sign.html');
      var signUrl = null;
      function withUrl(cb) {
        if (signUrl) return cb(signUrl);
        db.rpc('make_sign_token', { p_deal: deal.id }).then(function (r) {
          if (r.error || !r.data) { alert('שגיאה ביצירת קישור: ' + ((r.error && r.error.message) || '')); return; }
          signUrl = signBase + '?d=' + deal.id + '&t=' + r.data; cb(signUrl);
        });
      }
      var linkMsg = $('cLinkMsg');
      $('cSendMail').addEventListener('click', function () {
        var to = ($('cLinkEmail').value || '').trim();
        if (!to || to.indexOf('@') < 0) { linkMsg.style.color = 'var(--danger)'; linkMsg.textContent = 'הזינו אימייל תקין'; return; }
        linkMsg.style.color = 'var(--muted)'; linkMsg.textContent = 'שולח…';
        db.rpc('send_contract_email', { p_deal: deal.id, p_to: to }).then(function (r) {
          if (r.error) { linkMsg.style.color = 'var(--danger)'; linkMsg.textContent = 'שגיאה: ' + r.error.message; return; }
          logActivity(lead.id, 'contract', 'נשלח הסכם לחתימה: ' + to);
          var req = r.data && r.data.email_req;
          if (!req) { linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '✅ נשלח ל-' + to; return; }
          linkMsg.style.color = 'var(--muted)'; linkMsg.textContent = 'נשלח — בודק אישור מ-Resend…';
          var tries = 0, poll = setInterval(function () {
            if (++tries > 8) { clearInterval(poll); linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '✅ נשלח ל-' + to; return; }
            db.rpc('admin_net_result', { p_id: req }).then(function (g) {
              if (g.error || !g.data) return;   // still pending / not admin → keep the optimistic result
              clearInterval(poll);
              var st = g.data.status, b = null; try { b = JSON.parse(g.data.content); } catch (e) {}
              if (st >= 200 && st < 300) { linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '✅ נשלח בהצלחה ל-' + to; }
              else { linkMsg.style.color = 'var(--danger)'; linkMsg.textContent = '✖ Resend דחה (' + st + '): ' + ((b && b.message) || String(g.data.content || '').slice(0, 160)); }
            });
          }, 1500);
        });
      });
      $('cWa').addEventListener('click', function () { withUrl(function (u) { var p = waIntl(deal.client_phone); window.open('https://wa.me/' + p + '?text=' + encodeURIComponent('שלום, לחתימה על ההסכם: ' + u), '_blank'); }); });
      $('cSms').addEventListener('click', function () { withUrl(function (u) { window.location.href = 'sms:' + (deal.client_phone || '') + '?body=' + encodeURIComponent('לחתימה על ההסכם: ' + u); }); });
      $('cCopy').addEventListener('click', function () { withUrl(function (u) { (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '🔗 הקישור הועתק'; }).catch(function () { linkMsg.style.color = 'var(--txt)'; linkMsg.textContent = u; }); }); });
    }
    // "שמור הסכם" — persist the deal (so it shows in "הצעות / הסכמים לחתימה"), then reload so the send options appear
    if ($('cSend')) $('cSend').addEventListener('click', function () {
      var btn = $('cSend'); btn.disabled = true; btn.textContent = 'שומר…';
      var payload = Object.assign({}, deal);
      ['id', 'order_no', 'created_at', 'updated_at', '_sigLoaded', 'signature', 'signed_at'].forEach(function (k) { delete payload[k]; });
      var q = deal.id ? db.from('deals').update(payload).eq('id', deal.id).select().single() : db.from('deals').insert(payload).select().single();
      q.then(function (r) {
        if (r.error || !r.data) { alert('שמירה נכשלה: ' + ((r.error && r.error.message) || 'שגיאה')); btn.disabled = false; btn.textContent = '💾 שמור הסכם'; return; }
        var wasNew = !deal.id, saved = r.data; saved._sigLoaded = true;
        logActivity(lead.id, 'contract', (wasNew ? 'נוצר' : 'עודכן') + ' הסכם לחתימה' + (saved.order_no ? ' #' + saved.order_no : ''));
        if (wasNew) changeStatus(lead.id, 'quote_sent', lead, function () { contractView(lead, saved); });
        else contractView(lead, saved);
      });
    });
  }
  // Reliable contract → PDF (verified in a real browser): the capture element MUST be
  // in normal document flow (position:static — absolute/fixed → 0-height blank), and the
  // page MUST be scrolled to 0 (a scrolled page → white blank). A height:0/overflow:hidden
  // wrapper hides it, and a white overlay masks the brief scroll reset.
  function genContractPdf(deal, onBlob) {
    if (!window.html2pdf) { onBlob(null); return; }
    var sx = window.scrollX, sy = window.scrollY;
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,.97);z-index:99999;display:flex;align-items:center;justify-content:center;color:#F5691E;font-weight:800;font-size:18px';
    ov.textContent = 'מכין מסמך…';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'height:0;overflow:hidden';   // static (in-flow), hidden — do NOT use absolute/fixed
    var holder = document.createElement('div');
    holder.style.cssText = 'width:760px;background:#fff;color:#111;padding:16px';
    holder.innerHTML = contractHTML(deal, deal.signature || null);
    wrap.appendChild(holder); document.body.appendChild(wrap); document.body.appendChild(ov);
    window.scrollTo(0, 0);
    function done(blob) { window.scrollTo(sx, sy); [wrap, ov].forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); }); onBlob(blob); }
    window.html2pdf().set({ margin: 8, image: { type: 'jpeg', quality: 0.96 }, html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true }, jsPDF: { unit: 'mm', format: 'a4' } }).from(holder).outputPdf('blob').then(done).catch(function () { done(null); });
  }
  // generate + save the signed contract PDF ONCE → shows in documents + timeline (both views)
  var pdfGenerating = {};
  function ensureSignedPdf(lead, deal, onSaved) {
    if (!window.html2pdf || !deal || !deal.id || !deal.signature || pdfGenerating[deal.id]) return;
    var path = lead.id + '/signed_' + deal.id + '_v2.pdf';       // v2 = the fixed generator
    var oldPath = lead.id + '/signed_' + deal.id + '.pdf';       // v1 could be a blank PDF from old code
    pdfGenerating[deal.id] = true;
    db.from('lead_documents').select('id').eq('storage_path', path).then(function (chk) {
      if (chk.error || (chk.data && chk.data.length)) { pdfGenerating[deal.id] = false; return; }  // already saved (v2)
      // clean up a possible blank v1 once, then generate the correct v2
      db.from('lead_documents').delete().eq('storage_path', oldPath);
      db.storage.from('lead-docs').remove([oldPath]);
      genContractPdf(deal, function (blob) {
        if (!blob) { pdfGenerating[deal.id] = false; return; }
        db.storage.from('lead-docs').upload(path, blob, { contentType: 'application/pdf', upsert: true }).then(function (u) {
          pdfGenerating[deal.id] = false;
          if (u.error) return;
          db.from('lead_documents').insert({ lead_id: lead.id, name: 'הסכם חתום' + (deal.order_no ? ' #' + deal.order_no : ''), storage_path: path }).then(function () {
            logActivity(lead.id, 'contract', 'נשמר הסכם חתום (PDF) בתיק').then(function () { if (onSaved) onSaved(); });
          });
        });
      });
    });
  }
  // save the contract as a PDF to the lead file + timeline (used by "שלח ושמור PDF")
  function finishContract(lead, deal, docEl, activityText, docTitle, signedContract) {
    var suffix = deal.order_no ? ' #' + deal.order_no : '';
    var newStage = signedContract ? ((deal.stage && deal.stage !== 'initial') ? deal.stage : 'screening') : deal.stage;
    function afterSave(path) {
      db.from('lead_documents').insert({ lead_id: lead.id, name: docTitle + suffix, storage_path: path });
      if (deal.id) { var chk = deal.checklist || {}; if (signedContract) chk['התקבל הסכם'] = true; db.from('deals').update({ checklist: chk, stage: newStage }).eq('id', deal.id); }
      logActivity(lead.id, 'contract', activityText + suffix).then(function () {
        alert(signedContract ? 'ההסכם נחתם ונשמר! התיק הועבר למנהלת תיקי הלקוחות ✅' : 'ההסכם נשמר כ-PDF! ✅');
        if (signedContract) changeStatus(lead.id, 'underwriting', lead, function () { window.C2B_openLeadCard(lead.id); });
        else window.C2B_openLeadCard(lead.id);
      });
    }
    genContractPdf(deal, function (blob) {
      if (blob) {
        var path = lead.id + '/contract_' + Date.now() + '.pdf';
        db.storage.from('lead-docs').upload(path, blob, { contentType: 'application/pdf' }).then(function (u) { if (u.error) { alert('שמירה נכשלה: ' + u.error.message); return; } afterSave(path); });
      } else {
        var full = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"></head><body>' + docEl.innerHTML + '</body></html>';
        var hpath = lead.id + '/contract_' + Date.now() + '.html';
        db.storage.from('lead-docs').upload(hpath, new Blob([full], { type: 'text/html' })).then(function (u) { if (u.error) { alert('שמירה נכשלה: ' + u.error.message); return; } afterSave(hpath); });
      }
    });
  }

  // ---------- FILES (client file manager) ----------
  var fileFilter = null, selectedDeals = {};
  function bindFilesBulk(stageFilter) {
    var $ = C.$;
    function ids() { return Object.keys(selectedDeals).filter(function (k) { return selectedDeals[k]; }); }
    function reRender() { selectedDeals = {}; window.C2B_renderFiles(stageFilter); }
    function update() {
      var n = ids().length, bar = $('fBulk'); if (!bar) return;
      bar.style.display = n ? 'flex' : 'none'; if ($('fBulkCount')) $('fBulkCount').textContent = 'נבחרו ' + n;
      var sa = $('fSelAll'); if (sa) { var b = $('filesBody').querySelectorAll('input[data-fsel]'), c = $('filesBody').querySelectorAll('input[data-fsel]:checked'); sa.checked = b.length && c.length === b.length; sa.indeterminate = c.length > 0 && c.length < b.length; }
    }
    $('filesBody').querySelectorAll('input[data-fsel]').forEach(function (cb) { cb.addEventListener('change', function () { if (cb.checked) selectedDeals[cb.dataset.fsel] = true; else delete selectedDeals[cb.dataset.fsel]; update(); }); });
    if ($('fSelAll')) $('fSelAll').addEventListener('change', function () { var on = this.checked; $('filesBody').querySelectorAll('input[data-fsel]').forEach(function (cb) { cb.checked = on; if (on) selectedDeals[cb.dataset.fsel] = true; else delete selectedDeals[cb.dataset.fsel]; }); update(); });
    if ($('fBulkClear')) $('fBulkClear').addEventListener('click', function () { selectedDeals = {}; $('filesBody').querySelectorAll('input[data-fsel]').forEach(function (cb) { cb.checked = false; }); update(); });
    if ($('fBulkApply')) $('fBulkApply').addEventListener('click', function () { var list = ids(); if (!list.length) return; var st = $('fBulkStage').value; if (!st) { alert('בחרו שלב'); return; } db.from('deals').update({ stage: st }).in('id', list).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); return; } reRender(); }); });
    if ($('fBulkDel')) $('fBulkDel').addEventListener('click', function () { var list = ids(); if (!list.length) return; if (!confirm('למחוק ' + list.length + ' תיקים/הסכמים? פעולה בלתי הפיכה.')) return; db.from('deals').delete().in('id', list).then(function (r) { if (r.error) { alert('שגיאה: ' + r.error.message); return; } reRender(); }); });
    update();
  }
  window.C2B_renderFiles = function (stageFilter) {
    loading(); selectedDeals = {};
    db.from('deals').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var deals = r.data || [];
      var counts = { all: deals.length }; DEAL_STAGES.forEach(function (s) { counts[s.k] = 0; });
      deals.forEach(function (d) { var st = d.stage || 'initial'; counts[st] = (counts[st] || 0) + 1; });
      var f = stageFilter || 'all';
      fileFilter = C.makeFilter([
        { key: 'order_no', label: 'מס\' הזמנה' }, { key: 'client_name', label: 'לקוח' },
        { key: 'car', label: 'רכב', get: function (d) { return ((d.car_make || '') + ' ' + (d.car_model || '')).trim(); } },
        { key: 'stage', label: 'שלב', options: DEAL_STAGES.map(function (s) { return { v: s.k, l: s.label }; }) },
        { key: 'total', label: 'סכום עסקה' }, { key: 'commission', label: 'עמלת סוכן' }, { key: 'salesperson', label: 'איש מכירות' }
      ], function () { drawF(); });
      function tab(k, label, n) { return '<button data-fstage="' + k + '"' + (f === k ? ' class="active"' : '') + '>' + label + ' (' + n + ')</button>'; }
      view('<div class="card"><h3>תיקי לקוחות</h3><nav class="tabs" id="fTabs" style="margin-bottom:12px;flex-wrap:wrap">' + tab('all', 'הכל', counts.all) + DEAL_STAGES.map(function (s) { return tab(s.k, s.label, counts[s.k] || 0); }).join('') + '</nav><div id="filesBody"></div></div>');
      function drawF() {
        var lst = (f === 'all' ? deals : deals.filter(function (d) { return (d.stage || 'initial') === f; })).filter(function (d) { return fileFilter.match(d); });
        var rows = lst.map(function (d) {
          var chk = d.checklist || {}, done = CHECKLIST_ITEMS.filter(function (k) { return chk[k]; }).length, tot = CHECKLIST_ITEMS.length;
          return '<tr data-deal="' + d.id + '"><td style="width:30px;text-align:center"><input type="checkbox" data-fsel="' + d.id + '"' + (selectedDeals[d.id] ? ' checked' : '') + ' onclick="event.stopPropagation()"></td><td data-open="1" style="cursor:pointer"><b>#' + esc(d.order_no) + '</b></td><td data-open="1" style="cursor:pointer">' + esc(d.client_name) + (d.signature ? ' <span style="color:var(--ok)" title="נחתם">✅</span>' : '') + '</td><td>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + '</td><td>' + nis(d.total) + '</td><td style="color:var(--ok);font-weight:700">' + nis(d.commission) + '</td><td>' + stageBadge(d.stage || 'initial') + '</td><td><div class="bar" style="width:80px;display:inline-block;vertical-align:middle"><span style="width:' + Math.round(done / tot * 100) + '%"></span></div> ' + done + '/' + tot + '</td></tr>';
        }).join('');
        var bulk = '<div id="fBulk" class="filterbar" style="display:none;background:var(--brand-soft);align-items:center"><b id="fBulkCount" style="color:var(--brand)">נבחרו 0</b>' +
          '<select id="fBulkStage"><option value="">🏷️ שנה שלב…</option>' + DEAL_STAGES.map(function (s) { return '<option value="' + s.k + '">' + esc(s.label) + '</option>'; }).join('') + '</select>' +
          '<button class="btn btn-sm" id="fBulkApply">החל</button><button class="btn btn-ghost btn-sm" id="fBulkDel" style="color:var(--danger);border-color:var(--danger)">🗑️ מחק נבחרים</button><button class="btn btn-ghost btn-sm" id="fBulkClear">בטל בחירה</button></div>';
        C.$('filesBody').innerHTML = fileFilter.render() + bulk +
          '<div class="table-scroll"><table><thead><tr><th style="width:30px;text-align:center"><input type="checkbox" id="fSelAll"></th><th>#</th><th>לקוח</th><th>רכב</th><th>סכום</th><th>עמלת סוכן</th><th>שלב</th><th>צ\'קליסט</th></tr></thead><tbody>' + (rows || '<tr><td colspan="8" class="empty">אין תיקים</td></tr>') + '</tbody></table></div>';
        fileFilter.bind();
        C.$('filesBody').querySelectorAll('td[data-open]').forEach(function (td) { td.addEventListener('click', function () { window.C2B_openDeal(td.parentNode.dataset.deal); }); });
        bindFilesBulk(stageFilter);
      }
      C.$('fTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-fstage]'); if (b) window.C2B_renderFiles(b.dataset.fstage === 'all' ? null : b.dataset.fstage); });
      drawF();
    });
  };

  // ---------- DASHBOARD ----------
  var dashPeriod = 'all';
  var PERIODS = [['today', 'היום'], ['7', '7 ימים'], ['30', '30 יום'], ['month', 'החודש'], ['all', 'הכל']];
  function periodStart(p) { var d = new Date(); d.setHours(0, 0, 0, 0); if (p === 'today') return d.getTime(); if (p === '7') return Date.now() - 7 * 864e5; if (p === '30') return Date.now() - 30 * 864e5; if (p === 'month') { var m = new Date(); m.setDate(1); m.setHours(0, 0, 0, 0); return m.getTime(); } return 0; }
  // ---- per-block date filters (each dashboard card filters independently) ----
  var blockR = {}, dashAll = null;
  function inRange(ts, r) {
    if (!r || r.preset === 'all' || (!r.preset && !r.from && !r.to)) return true;
    var t = new Date(ts || 0).getTime();
    if (r.preset) return t >= periodStart(r.preset);
    if (r.from && t < new Date(r.from + 'T00:00:00').getTime()) return false;
    if (r.to && t > new Date(r.to + 'T23:59:59').getTime()) return false;
    return true;
  }
  function fltLabel(r) {
    if (!r || r.preset === 'all' || (!r.preset && !r.from && !r.to)) return '📅 הכל';
    if (r.preset) { var p = PERIODS.filter(function (x) { return x[0] === r.preset; })[0]; return '📅 ' + (p ? p[1] : r.preset); }
    return '📅 ' + (r.from || '…') + ' – ' + (r.to || '…');
  }
  function closeDatePopup() { var m = document.getElementById('datepop'); if (m) m.remove(); }
  function dateFilterPopup(anchor, cur, onApply) {
    closeDatePopup();
    var m = document.createElement('div'); m.className = 'stmenu'; m.id = 'datepop'; m.style.minWidth = '250px'; m.style.padding = '12px';
    m.innerHTML = '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">' + PERIODS.map(function (p) { return '<button class="btn btn-ghost btn-sm" data-dp="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<label class="muted" style="font-size:12px">טווח תאריכים מותאם</label>' +
      '<div style="display:flex;gap:6px;align-items:center;margin:5px 0 10px"><input type="date" class="inp" id="dpFrom" value="' + ((cur && cur.from) || '') + '"><span class="muted">–</span><input type="date" class="inp" id="dpTo" value="' + ((cur && cur.to) || '') + '"></div>' +
      '<div style="display:flex;gap:6px"><button class="btn btn-sm" id="dpApply">החל טווח</button><button class="btn btn-ghost btn-sm" id="dpClear">נקה</button></div>';
    document.body.appendChild(m);
    var rc = anchor.getBoundingClientRect();
    m.style.top = (rc.bottom + window.scrollY + 4) + 'px'; m.style.left = Math.max(8, rc.left + window.scrollX - 140) + 'px';
    m.querySelectorAll('[data-dp]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); onApply({ preset: b.dataset.dp }); closeDatePopup(); }); });
    m.querySelector('#dpApply').addEventListener('click', function (e) { e.stopPropagation(); onApply({ from: m.querySelector('#dpFrom').value, to: m.querySelector('#dpTo').value }); closeDatePopup(); });
    m.querySelector('#dpClear').addEventListener('click', function (e) { e.stopPropagation(); onApply({ preset: 'all' }); closeDatePopup(); });
    setTimeout(function () { document.addEventListener('click', closeDatePopup, { once: true }); }, 0);
  }
  // drawer popup listing leads → click opens the lead card
  function leadsPopup(title, list) {
    C.openDrawer('<div class="dw-head"><h3 style="margin:0">' + esc(title) + ' <span class="muted" style="font-size:13px">(' + list.length + ')</span></h3></div>' +
      '<div class="dw-body">' + (list.length ? list.map(function (l) {
        return '<div data-lead="' + l.id + '" style="padding:11px 12px;border-bottom:1px solid var(--line);cursor:pointer;border-radius:8px" onmouseover="this.style.background=\'var(--surface-2)\'" onmouseout="this.style.background=\'\'">' +
          '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(l.name || 'ליד') + '</b>' + (l.status ? badge(l.status) : '') + '</div>' +
          '<div class="muted" style="font-size:12.5px;margin-top:3px">' + esc(l.phone || '') + (l.car ? ' · ' + esc(l.car) : '') + (l.brand ? ' · ' + esc(l.brand) : '') + (l._extra ? ' · ' + esc(l._extra) : '') + '</div></div>';
      }).join('') : '<p class="empty">אין רשומות</p>') + '</div>');
    document.getElementById('drawer').querySelectorAll('[data-lead]').forEach(function (el) { el.addEventListener('click', function () { C.closeDrawer(); window.C2B_openLeadCard(el.dataset.lead); }); });
  }
  window.C2B_renderDashboard = function () {
    loading();
    Promise.all([
      db.from('leads').select('id,name,phone,car,brand,status,source,created_at,first_response_at,assigned_to'),
      db.from('tasks').select('done'),
      db.from('appointments').select('status'),
      db.from('deals').select('id,lead_id,client_name,car_make,car_model,total,stage,created_at'),
      db.from('profiles').select('user_id,full_name')
    ]).then(function (res) {
      var prof = {}; ((res[4] && res[4].data) || []).forEach(function (p) { prof[p.user_id] = p.full_name; });
      dashAll = { leads: res[0].data || [], tasks: res[1].data || [], deals: (res[3] && res[3].data) || [], prof: prof };
      drawDashboard();
    }).catch(function (e) { errBox(e.message || e); });
  };
  function fbtn(k) { return '<button class="btn btn-ghost btn-sm" id="flt_' + k + '">' + fltLabel(blockR[k]) + '</button>'; }
  function drawDashboard() {
    var allLeads = dashAll.leads, allDeals = dashAll.deals, tasks = dashAll.tasks;
    var gStart = periodStart(dashPeriod);
    var leads = allLeads.filter(function (l) { return new Date(l.created_at || 0).getTime() >= gStart; });
    var deals = allDeals.filter(function (d) { return new Date(d.created_at || 0).getTime() >= gStart; });
    var todayS = periodStart('today');
    var todayN = allLeads.filter(function (l) { return new Date(l.created_at || 0).getTime() >= todayS; }).length;
    var dealsTodayN = allDeals.filter(function (d) { return new Date(d.created_at || 0).getTime() >= todayS; }).length;
    var by = {}; STATUSES.forEach(function (s) { by[s.k] = 0; }); leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
    var won = by.won || 0, lost = by.lost || 0, conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
    var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
    var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
    var openTasks = tasks.filter(function (t) { return !t.done; }).length;

    var pTabs = '<div class="row-between" style="margin-bottom:2px"><div class="tabs" id="dashPeriod">' + PERIODS.map(function (p) { return '<button data-p="' + p[0] + '"' + (dashPeriod === p[0] ? ' class="active"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div><span class="muted" style="font-size:12px">מסנן ראשי (KPI)</span></div>';
    function hdr(title, k, hint) { return '<div class="row-between"><h3 style="margin:0">' + title + (hint ? ' <span class="muted" style="font-size:12px">' + hint + '</span>' : '') + '</h3>' + fbtn(k) + '</div>'; }
    view(
      pTabs +
      '<div class="cards" style="margin-top:14px">' +
        C.stat('לידים חדשים היום', todayN, true) + C.stat('עסקאות היום', dealsTodayN, true) +
        C.stat('סה"כ לידים', leads.length) + C.stat('סה"כ עסקאות', deals.length) +
        C.stat('בטיפול', by.in_progress || 0) + C.stat('פגישות נקבעו', by.meeting_set || 0) +
        C.stat('עסקאות שנסגרו', won) + C.stat('אחוז סגירה', conv + '%') +
        C.stat('זמן תגובה', avgRt ? avgRt + ' דק\'' : '—') + C.stat('משימות פתוחות', openTasks) +
      '</div>' +
      '<div class="grid2">' +
        '<div class="card">' + hdr('לידים לאורך זמן', 'chart') + '<div id="dashChart"></div></div>' +
        '<div class="card">' + hdr('פילוח לפי סטטוס', 'status', '(לחצו לפתיחת הלידים)') + '<div class="table-scroll"><table><tbody id="dashStatus"></tbody></table></div></div>' +
      '</div>' +
      '<div class="card">' + hdr('🗂️ משפך תיקי לקוחות', 'stage', '(לחצו על שלב לצפייה בלקוחות)') + '<div class="table-scroll"><table><tbody id="dashStage"></tbody></table></div></div>' +
      '<div class="grid2">' +
        '<div class="card">' + hdr('לידים לפי מותג', 'brand', '(לחצו לפתיחה)') + '<div class="table-scroll"><table><tbody id="dashBrand"></tbody></table></div></div>' +
        '<div class="card">' + hdr('לידים לפי סוכן מכירות', 'agent', '(לחצו לפתיחה)') + '<div class="table-scroll"><table><thead><tr><th>סוכן</th><th>לידים</th><th>עסקאות</th></tr></thead><tbody id="dashAgent"></tbody></table></div></div>' +
      '</div>' +
      '<div class="card">' + hdr('מקורות מובילים', 'source') + '<div class="table-scroll"><table><tbody id="dashSource"></tbody></table></div></div>'
    );
    C.$('dashPeriod').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; dashPeriod = b.dataset.p; drawDashboard(); });
    ['chart', 'status', 'stage', 'brand', 'agent', 'source'].forEach(function (k) {
      drawBlock(k);
      var btn = C.$('flt_' + k);
      if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); dateFilterPopup(btn, blockR[k], function (r) { blockR[k] = r; btn.innerHTML = fltLabel(r); drawBlock(k); }); });
    });
  }
  function drawBlock(k) {
    var prof = dashAll.prof, allLeads = dashAll.leads, allDeals = dashAll.deals, r = blockR[k];
    var leads = allLeads.filter(function (l) { return inRange(l.created_at, r); });
    var deals = allDeals.filter(function (d) { return inRange(d.created_at, r); });
    var leadById = {}; allLeads.forEach(function (l) { leadById[l.id] = l; });
    if (k === 'chart') {
      var byDay = {}; leads.forEach(function (l) { var dd = (l.created_at || '').slice(0, 10); if (dd) byDay[dd] = (byDay[dd] || 0) + 1; });
      var days = []; for (var i = 13; i >= 0; i--) { var dz = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push({ d: dz, v: byDay[dz] || 0 }); }
      C.$('dashChart').innerHTML = svgBars(days);
    } else if (k === 'status') {
      var by = {}; leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      C.$('dashStatus').innerHTML = STATUSES.filter(function (s) { return by[s.k]; }).map(function (s) { var pct = leads.length ? Math.round(by[s.k] / leads.length * 100) : 0; return '<tr data-status="' + s.k + '" style="cursor:pointer"><td>' + badge(s.k) + '</td><td>' + by[s.k] + '</td><td style="width:45%"><div class="bar"><span style="width:' + pct + '%;background:' + s.color + '"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>';
      C.$('dashStatus').querySelectorAll('[data-status]').forEach(function (tr) { tr.addEventListener('click', function () { var kk = tr.dataset.status; leadsPopup(stDef(kk).label, leads.filter(function (l) { return (l.status || 'new') === kk; })); }); });
    } else if (k === 'stage') {
      var byStage = {}; DEAL_STAGES.forEach(function (s) { byStage[s.k] = 0; }); deals.forEach(function (d) { byStage[d.stage || 'initial'] = (byStage[d.stage || 'initial'] || 0) + 1; });
      var maxStage = Math.max(1, Math.max.apply(null, DEAL_STAGES.map(function (s) { return byStage[s.k] || 0; })));
      C.$('dashStage').innerHTML = DEAL_STAGES.map(function (s) { var n = byStage[s.k] || 0; return '<tr data-stage="' + s.k + '" style="cursor:pointer"><td>' + stageBadge(s.k) + '</td><td>' + n + '</td><td style="width:55%"><div class="bar"><span style="width:' + Math.round(n / maxStage * 100) + '%;background:' + s.color + '"></span></div></td></tr>'; }).join('');
      C.$('dashStage').querySelectorAll('[data-stage]').forEach(function (tr) { tr.addEventListener('click', function () { var kk = tr.dataset.stage; var list = deals.filter(function (d) { return (d.stage || 'initial') === kk; }).map(function (d) { var l = leadById[d.lead_id] || {}; return { id: d.lead_id, name: d.client_name || l.name, phone: l.phone, car: ((d.car_make || '') + ' ' + (d.car_model || '')).trim() || l.car, brand: l.brand, status: l.status, _extra: d.total ? nis(d.total) : '' }; }); leadsPopup('שלב תיק: ' + stageDef(kk).label, list); }); });
    } else if (k === 'brand') {
      var byBrand = {}; leads.forEach(function (l) { var b = l.brand || 'לא ידוע'; byBrand[b] = (byBrand[b] || 0) + 1; });
      var brands = Object.keys(byBrand).sort(function (a, b) { return byBrand[b] - byBrand[a]; }).slice(0, 10);
      var maxBrand = brands.length ? byBrand[brands[0]] : 1;
      C.$('dashBrand').innerHTML = brands.map(function (b) { return '<tr data-brand="' + esc(b) + '" style="cursor:pointer"><td>' + esc(b) + '</td><td>' + byBrand[b] + '</td><td style="width:50%"><div class="bar"><span style="width:' + Math.round(byBrand[b] / maxBrand * 100) + '%"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>';
      C.$('dashBrand').querySelectorAll('[data-brand]').forEach(function (tr) { tr.addEventListener('click', function () { var b = tr.dataset.brand; leadsPopup('מותג: ' + b, leads.filter(function (l) { return (l.brand || 'לא ידוע') === b; })); }); });
    } else if (k === 'agent') {
      var byAgent = {}; leads.forEach(function (l) { var n = prof[l.assigned_to] || 'לא שויך'; byAgent[n] = byAgent[n] || { t: 0, w: 0 }; byAgent[n].t++; if (l.status === 'won') byAgent[n].w++; });
      var agents = Object.keys(byAgent).sort(function (a, b) { return byAgent[b].t - byAgent[a].t; });
      C.$('dashAgent').innerHTML = agents.map(function (n) { return '<tr data-agent="' + esc(n) + '" style="cursor:pointer"><td>' + esc(n) + '</td><td>' + byAgent[n].t + '</td><td>' + byAgent[n].w + '</td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>';
      C.$('dashAgent').querySelectorAll('[data-agent]').forEach(function (tr) { tr.addEventListener('click', function () { var n = tr.dataset.agent; leadsPopup('סוכן: ' + n, leads.filter(function (l) { return (prof[l.assigned_to] || 'לא שויך') === n; })); }); });
    } else if (k === 'source') {
      var bySource = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; bySource[s] = (bySource[s] || 0) + 1; });
      var topSrc = Object.keys(bySource).sort(function (a, b) { return bySource[b] - bySource[a]; }).slice(0, 8);
      var maxSrc = topSrc.length ? bySource[topSrc[0]] : 1;
      C.$('dashSource').innerHTML = topSrc.map(function (s) { return '<tr data-source="' + esc(s) + '" style="cursor:pointer"><td>' + esc(s) + '</td><td>' + bySource[s] + '</td><td style="width:55%"><div class="bar"><span style="width:' + Math.round(bySource[s] / maxSrc * 100) + '%"></span></div></td></tr>'; }).join('') || '<tr><td class="empty">אין נתונים</td></tr>';
      C.$('dashSource').querySelectorAll('[data-source]').forEach(function (tr) { tr.addEventListener('click', function () { var s = tr.dataset.source; leadsPopup('מקור: ' + s, leads.filter(function (l) { return (l.source || 'לא ידוע') === s; })); }); });
    }
  }
  function svgBars(days) {
    var max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.v; }))), W = 100 / days.length;
    var bars = days.map(function (d, i) { var h = d.v / max * 90; return '<rect x="' + (i * W + W * 0.15) + '" y="' + (100 - h) + '" width="' + (W * 0.7) + '" height="' + h + '" rx="1.5" fill="var(--brand)"><title>' + d.d + ': ' + d.v + '</title></rect>'; }).join('');
    var labels = days.map(function (d, i) { return i % 2 === 0 ? '<text x="' + (i * W + W / 2) + '" y="99" font-size="3" fill="var(--muted)" text-anchor="middle">' + d.d.slice(5) + '</text>' : ''; }).join('');
    return '<svg viewBox="0 0 100 108" preserveAspectRatio="none" style="width:100%;height:180px">' + bars + labels + '</svg>';
  }

  // expose the status model for admin.js (bell, reports)
  window.C2B_STATUSES = STATUSES;
  window.C2B_badge = badge;
  window.C2B_stageDef = stageDef;
})();
