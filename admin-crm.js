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
      '<button class="btn btn-sm" id="bulkApply">החל על הנבחרים</button><button class="btn btn-ghost btn-sm" id="bulkClear">בטל בחירה</button></div>';
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
    { k: 'call_log', icon: '📒', label: 'תיעוד שיחה', roles: ['admin', 'sales', 'files'] },
    { k: 'task', icon: '✅', label: 'משימה', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'doc', icon: '📎', label: 'מסמך', roles: ['admin', 'sales', 'files', 'accounting'] },
    { k: 'meeting', icon: '📅', label: 'קבע פגישה', roles: ['admin', 'sales', 'files'] },
    { k: 'car', icon: '🚗', label: 'בחר רכב', roles: ['admin', 'sales'] },
    { k: 'deal', icon: '💰', label: 'סגירת עסקה', roles: ['admin', 'sales', 'files'] },
    { k: 'contract', icon: '✍', label: 'הסכם', roles: ['admin', 'sales', 'files'] }
  ];
  function roleShort(role) { return { sales: 'מכירות', files: 'תיקי לקוחות', accounting: 'הנה״ח' }[role] || ''; }
  function docIsImage(name) { return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || ''); }
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
    if ((C.role || '') === 'files') return openFileView(id);   // file manager → file view
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
    var actBtns = LEAD_ACTIONS.filter(function (a) { return a.roles.indexOf(role) >= 0; }).map(function (a) {
      if (a.k === 'call') return lead.phone ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(lead.phone) + '">' + a.icon + ' ' + a.label + '</a>' : '';
      if (a.k === 'wa') return wa ? '<a class="btn btn-ghost btn-sm" href="' + wa + '" target="_blank" rel="noopener">' + a.icon + ' ' + a.label + '</a>' : '';
      if (a.k === 'mail') return lead.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(lead.email) + '">' + a.icon + ' ' + a.label + '</a>' : '';
      return '<button class="btn btn-ghost btn-sm" data-act2="' + a.k + '">' + a.icon + ' ' + a.label + '</button>';
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
          '<div class="card"><div class="row-between"><h3 style="margin:0">עסקאות</h3>' + (role !== 'accounting' ? '<button class="btn btn-sm" id="lpNewDeal">+ עסקה</button>' : '') + '</div><div id="lpDeals">' + dealList(deals) + '</div></div>' +
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
        html: '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-wrap:wrap"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '>' + title + ' ' + flag + due + created + '</label>' });
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
        var file = this.files[0]; if (!file) return; var path = lead.id + '/' + Date.now() + '_' + file.name;
        box.innerHTML = '<p class="muted">מעלה…</p>';
        db.storage.from('lead-docs').upload(path, file).then(function (u) { if (u.error) { box.innerHTML = ''; return alert('העלאה נכשלה: ' + u.error.message); } db.from('lead_documents').insert({ lead_id: lead.id, name: file.name, storage_path: path }).then(function () { logActivity(lead.id, 'document', 'הועלה מסמך: ' + file.name); window.C2B_openLeadCard(lead.id); }); });
      });
      return;
    }
    if (k === 'task') {
      box.innerHTML = '<form id="lpTaskForm"><input class="inp" name="title" placeholder="משימה חדשה…" style="width:100%;margin-bottom:6px"><div style="display:flex;gap:6px"><input class="inp" name="due" type="datetime-local" style="flex:1"><button class="btn btn-sm">הוסף</button></div></form>';
      $('lpTaskForm').addEventListener('submit', function (e) {
        e.preventDefault(); var title = this.title.value.trim(); if (!title) return;
        var due = this.due.value ? new Date(this.due.value).toISOString() : null;
        db.from('tasks').insert({ lead_id: lead.id, title: title, due_at: due }).then(function () { logActivity(lead.id, 'task', 'נפתחה משימה: ' + title); C.refreshBadges && C.refreshBadges(); window.C2B_openLeadCard(lead.id); });
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
      '<button class="btn btn-sm">קבע ושלח אישור</button><button type="button" class="btn btn-ghost btn-sm" id="mCancel">ביטול</button></form></div>';
    C.$('mCancel').addEventListener('click', function () { C.$('lpForm').innerHTML = ''; });
    C.$('mForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = this.date.value, t = this.time.value; if (!d || !t) return;
      var appt_at = new Date(d + 'T' + t).toISOString();
      var disp = new Date(d + 'T' + t).toLocaleDateString('he-IL');
      db.from('appointments').insert({ name: lead.name, phone: lead.phone, email: lead.email, type: lead.car || 'פגישה', branch: '', note: '', appt_date: disp, appt_time: t, appt_at: appt_at, status: 'new' }).then(function (r) {
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
    return deals.map(function (d) { return '<div data-deal-id="' + d.id + '" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer"><b>#' + esc(d.order_no) + '</b> · ' + esc(dealStatusLabel(d.status)) + ' · ' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + ' · ' + nis(d.total) + (d.signature ? ' · <span style="color:var(--ok);font-weight:700">✅ נחתם</span>' : '') + '</div>'; }).join('');
  }
  function dealForm(lead, deal, fileMode) {
    deal = deal || {}; var ad = deal.addons || {};
    var curStage = deal.stage || 'initial';
    var checklist = {}; CHECKLIST_ITEMS.forEach(function (it) { checklist[it] = !!(deal.checklist || {})[it]; });
    var G = function (label, name, val, type) { return '<div class="field" style="margin:0"><label>' + label + '</label><input class="inp" id="dl_' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" style="width:100%"></div>'; };
    var grid = function (inner) { return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + inner + '</div>'; };
    var statusSel = '<div class="field" style="margin:0"><label>סטטוס הזמנה</label><select class="inp" id="dl_status" style="width:100%">' + [['quote', 'הצעת מחיר'], ['ordered', 'הזמנה'], ['cancelled', 'בוטל']].map(function (s) { return '<option value="' + s[0] + '"' + ((deal.status || 'quote') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>';
    var fin = deal.financing || {}, ti = deal.tradein || {};
    function gearboxSel(v) { return '<div class="field" style="margin:0"><label>תיבת הילוכים</label><select class="inp" id="dl_car_gearbox" style="width:100%"><option value="">— בחר —</option>' + ['אוטומט', 'ידני', 'רובוטית', 'טיפטרוניק'].map(function (g) { return '<option' + (v === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div>'; }
    // --- cards (grouped into tabs matching the reference layout) ---
    var clientCard = '<div class="card"><h3>👤 פרטי הלקוח</h3>' + grid(G('שם לקוח', 'client_name', deal.client_name || lead.name) + G('טלפון נייד', 'client_phone', deal.client_phone || lead.phone) + G('דוא"ל', 'client_email', deal.client_email || lead.email) + G('כתובת', 'client_address', deal.client_address || lead.city) + G('ת.ז / ח.פ', 'client_id', deal.client_id) + G('שם לחשבונית', 'invoice_name', deal.invoice_name || lead.name)) + '</div>';
    var formCard = '<div class="card"><h3>בחירת טופס</h3>' + grid(G('סוג טופס', 'form_type', deal.form_type || 'חוזה קאר פלוס') + statusSel + G('מנהל מכירות / נציג משוייך', 'salesperson', deal.salesperson || '')) + '</div>';
    var carCard = '<div class="card ac-box"><h3>🚗 פרטי הרכב המוזמן</h3>' +
      '<input class="inp" id="dl_carSearch" placeholder="🔎 חפש רכב מהקטלוג (עברית/אנגלית) — ימלא אוטומטית" style="width:100%;margin-bottom:10px"><div class="ac-res hidden" id="dl_carRes"></div>' +
      grid(G('יצרן', 'car_make', deal.car_make) + G('דגם', 'car_model', deal.car_model) + G('שנת ייצור', 'car_year', deal.car_year || 2026, 'number') + G('רמת גימור', 'car_trim', deal.car_trim) + G('נפח מנוע', 'car_engine', deal.car_engine) + gearboxSel(deal.car_gearbox) + G('צבע מבוקש', 'car_color', deal.car_color) + G('מחיר הרכב ₪', 'car_price', deal.car_price, 'number') + G('עמלת סוכן ₪ (אוטומטי מהקטלוג)', 'commission', deal.commission, 'number')) + '</div>';
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
    var tradeCard = '<div class="card"><h3>🔁 מקטע טרייד-אין</h3>' + grid(G('יצרן טרייד-אין', 'ti_make', ti.make) + G('דגם', 'ti_model', ti.model) + G('רמת גימור', 'ti_trim', ti.trim) + G('שנת דגם', 'ti_year', ti.year, 'number') + G('יד', 'ti_hand', ti.hand) + G('מחיר מחירון ₪', 'ti_list', ti.list, 'number') + G('מחיר קנייה ₪', 'ti_buy', ti.buy, 'number') + G('סכום שעבוד ₪', 'ti_lien', ti.lien, 'number') + G('גורם משעבד', 'ti_holder', ti.holder) + G('תאריך מסירה בפועל', 'ti_delivery', ti.delivery, 'date')) +
      '<label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" id="dl_ti_liened"' + (ti.liened ? ' checked' : '') + '> הרכב משועבד</label></div>';
    var checklistCard = '<div class="card"><h3>צ\'קליסט תיק</h3><div id="dlChecklist">' + CHECKLIST_ITEMS.map(function (it) { return '<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" data-chk="' + esc(it) + '"' + (checklist[it] ? ' checked' : '') + '> ' + esc(it) + '</label>'; }).join('') + '</div></div>';
    var recordCard = '<div class="card"><h3>פרטי רשומה</h3>' + grid(row('מספר הזמנה', esc(deal.order_no || '—')) + row('נוצר', deal.created_at ? fmt(deal.created_at) : '—') + row('שלב תיק', stageBadge(curStage)) + row('מזהה עסקה', '<span class="muted" style="font-size:11px">' + esc(deal.id || '—') + '</span>')) + '</div>' +
      '<div class="card"><h3>📁 מסמכי הלקוח (שהעלה הסוכן)</h3><p class="muted" style="font-size:12px;margin:-6px 0 10px">ת"ז · תלושים · דפי בנק · הסכם חתום וכו\'</p><div id="dlDocs">' + (lead.id ? 'טוען…' : '—') + '</div></div>';
    var paymentsCard = '<div class="card"><h3>תשלומים / קבלות / חשבוניות</h3><div id="dlPayList">' + (deal.id ? 'טוען…' : '<p class="muted">שמרו את העסקה כדי לנהל תשלומים</p>') + '</div>' +
      (deal.id ? '<form id="dlPayForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><select class="inp" name="kind"><option value="payment">תשלום</option><option value="receipt">קבלה</option><option value="invoice">חשבונית</option></select><input class="inp" name="amount" type="number" placeholder="סכום ₪" style="width:120px"><input class="inp" name="method" placeholder="אמצעי (מזומן/אשראי)" style="width:150px"><input class="inp" name="ref" placeholder="אסמכתא" style="width:130px"><button class="btn btn-sm">+ הוסף</button></form>' : '') + '</div>';
    function dTab(k, label, active) { return '<button data-dtab="' + k + '"' + (active ? ' class="active"' : '') + '>' + label + '</button>'; }
    function dPanel(k, active, inner) { return '<div class="dl-panel' + (active ? '' : ' hidden') + '" data-dpanel="' + k + '">' + inner + '</div>'; }
    view(
      '<div class="lead-top"><div style="display:flex;align-items:center;gap:8px"><button class="btn btn-ghost btn-sm" id="dlBack">' + ((C.role || '') === 'files' ? '→ לרשימת התיקים' : '→ לכרטיס') + '</button><h3 style="margin:0">' + (deal.id ? 'עסקה #' + esc(deal.order_no) : 'עסקה חדשה') + '</h3></div>' +
        '<div><button class="btn btn-ghost btn-sm" id="dlContract">✍ הסכם לחתימה</button> <button class="btn btn-ghost btn-sm" id="dlSubmitFin">🏦 הגש למימון</button> <button class="btn btn-sm" id="dlSave">💾 שמירה</button></div></div>' +
      (fileMode ? '<div class="card" style="padding:12px"><h3 style="margin:0 0 8px;font-size:13px">שלב התיק (מנהלת תיקי לקוחות)</h3><div class="flow" id="dlStageBar">' + stageBar(curStage) + '</div></div>' : '') +
      '<nav class="tabs" id="dlTabs" style="margin-bottom:14px;flex-wrap:wrap">' +
        dTab('client', '👤 פרטי הלקוח', true) + dTab('deal', '📋 פרטי העסקה') + dTab('car', '🚗 פרטי הרכב המוזמן') + dTab('fin', '🏦 מקטע מימון') + dTab('trade', '🔁 מקטע טרייד-אין') + dTab('record', '🗂️ פרטי רשומה') +
      '</nav>' +
      dPanel('client', true, '<div class="grid2">' + clientCard + formCard + '</div>') +
      dPanel('deal', false, '<div class="grid2">' + pricingCard + addonsCard + '</div>' + summaryCard) +
      dPanel('car', false, carCard + specCard) +
      dPanel('fin', false, finCard) +
      dPanel('trade', false, tradeCard) +
      dPanel('record', false, '<div class="grid2">' + checklistCard + recordCard + '</div>' + paymentsCard)
    );
    var $ = C.$;
    $('dlBack').addEventListener('click', function () { if ((C.role || '') === 'files') return window.C2B_renderFiles(); window.C2B_openLeadCard(lead.id); });
    $('dlTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-dtab]'); if (!b) return; $('dlTabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); }); C.$('view').querySelectorAll('[data-dpanel]').forEach(function (p) { p.classList.toggle('hidden', p.dataset.dpanel !== b.dataset.dtab); }); });
    // stage bar (shown to file manager / admin only)
    if ($('dlStageBar')) $('dlStageBar').addEventListener('click', function (e) { var st = e.target.closest('[data-stage]'); if (!st) return; curStage = st.dataset.stage; $('dlStageBar').innerHTML = stageBar(curStage); if (deal.id) { db.from('deals').update({ stage: curStage }).eq('id', deal.id); logActivity(lead.id, 'system', 'שלב עסקה: ' + stageDef(curStage).label); syncLeadFromStage(lead, curStage); } });
    // load the client's documents into the record tab (uploaded by the sales agent)
    if (lead.id) {
      db.from('lead_documents').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).then(function (dr) {
        var docs = (dr && dr.data) || [];
        if (!$('dlDocs')) return;
        if (!docs.length) { $('dlDocs').innerHTML = '<p class="muted">אין מסמכים שהועלו</p>'; return; }
        var paths = docs.map(function (x) { return x.storage_path; }), sf = db.storage.from('lead-docs');
        (sf.createSignedUrls ? sf.createSignedUrls(paths, 3600) : Promise.resolve({ data: [] })).then(function (sr) {
          var urls = {}; ((sr && sr.data) || []).forEach(function (s) { if (s && s.signedUrl) urls[s.path] = s.signedUrl; });
          if (!$('dlDocs')) return;
          $('dlDocs').innerHTML = docs.map(function (x) {
            var u = urls[x.storage_path], ic = /\.pdf$/i.test(x.name || '') ? '📄' : (/\.(png|jpe?g|gif|webp)$/i.test(x.name || '') ? '🖼️' : '📎');
            return '<div style="padding:7px 0;border-bottom:1px solid var(--line)">' + (u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + ic + ' ' + esc(x.name) + '</a>' : ic + ' ' + esc(x.name)) + ' <span class="muted" style="font-size:11px">· ' + fmt(x.created_at) + '</span></div>';
          }).join('');
        });
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
      curStage = 'submitted'; if ($('dlStageBar')) $('dlStageBar').innerHTML = stageBar(curStage);
      logActivity(lead.id, 'system', 'התיק הוגש למימון');
      $('dlSave').click();
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
        res.querySelectorAll('.ai[data-i]').forEach(function (el) { el.addEventListener('click', function () { var c = cars[+el.dataset.i]; $('dl_car_make').value = c.brand || ''; $('dl_car_model').value = c.name || ''; $('dl_car_trim').value = c.trim || ''; $('dl_car_engine').value = c.engine || ''; $('dl_car_color').value = c.colors || ''; $('dl_car_price').value = c.p || ''; $('dl_monthly').value = c.m || ''; if ($('dl_commission')) $('dl_commission').value = c.commission || ''; res.classList.add('hidden'); inp.value = ''; compute(); }); });
      });
    });
    // read the current form into a deal object (reused by save + contract)
    function readForm() {
      var c = compute();
      return {
        lead_id: lead.id, form_type: $('dl_form_type').value, status: $('dl_status').value, salesperson: $('dl_salesperson').value,
        client_name: $('dl_client_name').value, client_phone: $('dl_client_phone').value, client_email: $('dl_client_email').value, client_address: $('dl_client_address').value, client_id: $('dl_client_id').value, invoice_name: $('dl_invoice_name').value,
        car_make: $('dl_car_make').value, car_model: $('dl_car_model').value, car_year: num('dl_car_year') || null, car_trim: $('dl_car_trim').value, car_engine: $('dl_car_engine').value, car_gearbox: $('dl_car_gearbox').value, car_color: $('dl_car_color').value,
        car_price: num('dl_car_price'), commission: num('dl_commission') || null, down_total: num('dl_down_total'), down_initial: num('dl_down_initial'), down_balance: c.downBal, monthly: num('dl_monthly'), delivery_days: num('dl_delivery_days') || null, balance_to_pay: c.balPay,
        addons: { charging: $('dl_charging').checked, armor: $('dl_armor').checked, accessories: $('dl_accessories').checked, addons_amount: num('dl_addons_amount') },
        vat_included: $('dl_vat').checked, discount_pct: num('dl_discount_pct') || null, discount_amt: c.disc, total: c.total, paid: num('dl_paid') || null, spec: $('dl_spec').value,
        stage: curStage, checklist: checklist,
        financing: { amount: num('dl_fin_amount') || null, approved: num('dl_fin_approved') || null, payments: num('dl_fin_payments') || null, monthly: num('dl_fin_monthly') || null, track: $('dl_fin_track').value, offer: $('dl_fin_offer').value, balloon: num('dl_fin_balloon') || null, status: $('dl_fin_status').value, transferred: $('dl_fin_transferred').checked },
        tradein: { make: $('dl_ti_make').value, model: $('dl_ti_model').value, trim: $('dl_ti_trim').value, year: num('dl_ti_year') || null, hand: $('dl_ti_hand').value, list: num('dl_ti_list') || null, buy: num('dl_ti_buy') || null, lien: num('dl_ti_lien') || null, holder: $('dl_ti_holder').value, delivery: $('dl_ti_delivery').value || null, liened: $('dl_ti_liened').checked }
      };
    }
    $('dlSave').addEventListener('click', function () {
      var payload = readForm();
      var q = deal.id ? db.from('deals').update(payload).eq('id', deal.id) : db.from('deals').insert(payload);
      q.then(function (r) {
        if (r.error) return alert('שגיאה: ' + r.error.message);
        var newStatus = payload.status === 'ordered' ? 'won' : (payload.status === 'cancelled' ? 'lost' : 'quote_sent');
        logActivity(lead.id, 'quote', (deal.id ? 'עודכנה' : 'נוצרה') + ' עסקה: ' + (payload.car_make + ' ' + payload.car_model) + ' · ' + nis(payload.total));
        changeStatus(lead.id, newStatus, lead, function () { window.C2B_openLeadCard(lead.id); });
      });
    });
    $('dlContract').addEventListener('click', function () { contractView(lead, Object.assign({ id: deal.id, order_no: deal.order_no }, readForm())); });
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

  // ---------- ACCOUNTING (payments ledger + balances) ----------
  window.C2B_renderAccounting = function () {
    loading();
    Promise.all([db.from('deals').select('*'), db.from('payments').select('*')]).then(function (res) {
      if (res[0].error) return errBox(res[0].error.message);
      var deals = res[0].data || [], pays = (res[1] && res[1].data) || [];
      var paidByDeal = {}; pays.forEach(function (p) { if (p.kind !== 'invoice') paidByDeal[p.deal_id] = (paidByDeal[p.deal_id] || 0) + (+p.amount || 0); });
      var revenue = 0, collected = 0, open = 0;
      var rows = deals.map(function (d) {
        var tot = +d.total || 0, paid = paidByDeal[d.id] || 0, bal = tot - paid;
        revenue += tot; collected += paid; open += Math.max(0, bal);
        return '<tr' + (d.lead_id ? ' data-lead="' + d.lead_id + '" style="cursor:pointer"' : '') + '><td><b>#' + esc(d.order_no) + '</b></td><td>' + esc(d.client_name) + '</td><td>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + '</td><td>' + nis(tot) + '</td><td>' + nis(paid) + '</td><td style="color:' + (bal > 0 ? 'var(--danger)' : 'var(--ok)') + '">' + nis(bal) + '</td></tr>';
      }).join('');
      view('<div class="cards">' + C.stat('שווי עסקאות', nis(revenue), true) + C.stat('נגבה בפועל', nis(collected)) + C.stat('יתרה פתוחה', nis(open)) + C.stat('מספר עסקאות', deals.length) + '</div>' +
        '<div class="card"><h3>מצב כספי לפי עסקה</h3><div class="table-scroll"><table><thead><tr><th>#</th><th>לקוח</th><th>רכב</th><th>סכום</th><th>שולם</th><th>יתרה</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">אין עסקאות</td></tr>') + '</tbody></table></div></div>');
      C.$('view').querySelectorAll('tr[data-lead]').forEach(function (tr) { tr.addEventListener('click', function () { window.C2B_openLeadCard(tr.dataset.lead); }); });
    });
  };

  // ---------- CONTRACT (auto-filled + browser signature) ----------
  function contractHTML(d, sig) {
    var today = new Date().toLocaleDateString('he-IL');
    function tr(k, v) { return '<tr><td style="padding:6px;border-bottom:1px solid #eee">' + k + '</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:left"><b>' + v + '</b></td></tr>'; }
    return '<div style="font-family:Arial,sans-serif;line-height:1.7;max-width:720px;margin:auto;color:#111">' +
      '<h2 style="text-align:center;color:#F5691E;margin:0">הסכם הזמנת רכב — Car2Buy</h2>' +
      '<p style="text-align:center;color:#555">מספר הזמנה: ' + esc(d.order_no || '—') + ' · תאריך: ' + today + '</p><hr>' +
      '<h3 style="color:#F5691E">פרטי הלקוח</h3><p>שם: <b>' + esc(d.client_name) + '</b> · ת.ז: ' + esc(d.client_id) + '<br>טלפון: ' + esc(d.client_phone) + ' · דוא"ל: ' + esc(d.client_email) + '<br>כתובת: ' + esc(d.client_address) + '</p>' +
      '<h3 style="color:#F5691E">פרטי הרכב</h3><p>יצרן/דגם: <b>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + '</b> ' + esc(d.car_trim || '') + '<br>שנה: ' + esc(d.car_year || '') + ' · צבע: ' + esc(d.car_color || '') + ' · מנוע: ' + esc(d.car_engine || '') + ' · גיר: ' + esc(d.car_gearbox || '') + '</p>' +
      '<h3 style="color:#F5691E">תנאי העסקה</h3><table style="width:100%;border-collapse:collapse">' +
        tr('מחיר הרכב', nis(d.car_price)) + tr('מקדמה כוללת', nis(d.down_total)) + tr('החזר חודשי משוער', nis(d.monthly)) + tr('זמן אספקה משוער', (d.delivery_days || '—') + ' ימים') + tr('סכום כולל', nis(d.total)) + tr('יתרה לתשלום', nis(d.balance_to_pay)) +
      '</table>' + (d.spec ? '<h3 style="color:#F5691E">מפרט והערות</h3><p>' + esc(d.spec) + '</p>' : '') +
      '<p style="font-size:12px;color:#777;margin-top:16px">ההחזר החודשי משוער בלבד וכפוף לאישור גוף מימון, נתוני הלקוח וזמינות הרכב במלאי. חתימת הלקוח מהווה אישור להזמנה בכפוף לתנאים.</p>' +
      '<div style="margin-top:34px;display:flex;justify-content:space-between;align-items:flex-end"><div>חתימת הלקוח:<br>' + (sig ? '<img src="' + sig + '" style="height:72px">' : '________________________') + '</div><div>תאריך: ' + today + '</div></div></div>';
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
    view(
      '<div class="lead-top"><button class="btn btn-ghost btn-sm" id="cBack">→ לעסקה</button><h3 style="margin:0">הסכם — ' + esc(deal.client_name || '') + (signed ? ' <span class="tag" style="border-color:var(--ok);color:var(--ok);background:rgba(22,163,74,.1)">✅ נחתם</span>' : '') + '</h3>' +
        '<div><button class="btn btn-ghost btn-sm" id="cPrint">🖨️ הדפס / PDF</button>' + (signed ? '' : ' <button class="btn btn-ghost btn-sm" id="cSend">📤 שלח ושמור PDF</button> <button class="btn btn-sm" id="cSign">✍ חתום ושמור</button>') + '</div></div>' +
      (signed ? '<div class="card" style="border:1px solid var(--ok);background:rgba(22,163,74,.06)"><b style="color:var(--ok)">✅ ההסכם נחתם על ידי הלקוח' + (deal.signed_at ? ' בתאריך ' + fmt(deal.signed_at) : '') + '</b><span class="muted"> — למטה ההסכם המלא עם חתימת הלקוח.</span></div>' : '') +
      '<div class="card" id="cDoc" style="background:#fff;color:#111">' + contractHTML(deal, deal.signature || null) + '</div>' +
      (signed ? '' :
        '<div class="card"><h3>חתימה במקום (צייר עם העכבר / אצבע)</h3><canvas id="sig" width="480" height="150" style="border:1px dashed var(--line);border-radius:10px;background:#fff;touch-action:none;max-width:100%"></canvas><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" id="cClear">נקה חתימה</button></div></div>' +
        '<div class="card"><h3>📨 שליחה לחתימה מרחוק</h3>' +
          (deal.id ? '<p class="muted" style="font-size:13px;margin:-6px 0 12px">הלקוח מקבל קישור, חותם מהטלפון — וברגע שחתם זה מתעדכן כאן ומגיעה התראה במייל.</p>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input class="inp" id="cLinkEmail" value="' + esc(deal.client_email || '') + '" placeholder="אימייל הלקוח" style="flex:1;min-width:170px"><button class="btn btn-sm" id="cSendMail">📧 שלח במייל</button></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="cWa">💬 וואטסאפ</button><button class="btn btn-ghost btn-sm" id="cSms">✉️ SMS</button><button class="btn btn-ghost btn-sm" id="cCopy">🔗 העתק קישור</button></div>' +
            '<div id="cLinkMsg" style="font-size:13px;margin-top:10px"></div>'
            : '<p class="muted">שמרו את העסקה תחילה (💾) כדי לשלוח לחתימה מרחוק.</p>') + '</div>')
    );
    var $ = C.$;
    $('cBack').addEventListener('click', function () { dealForm(lead, deal); });
    $('cPrint').addEventListener('click', function () { var w = window.open('', '_blank'); if (!w) return; w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>הסכם</title></head><body>' + $('cDoc').innerHTML + '</body></html>'); w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 250); });
    if (signed) return;   // signed → view/print only, no signing controls
    var cv = $('sig'), ctx = cv.getContext('2d'), drawing = false, hasSig = false;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    function pos(e) { var r = cv.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    function start(e) { drawing = true; hasSig = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); if (e.cancelable) e.preventDefault(); }
    function move(e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (e.cancelable) e.preventDefault(); }
    function end() { drawing = false; }
    cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    cv.addEventListener('touchstart', start); cv.addEventListener('touchmove', move); cv.addEventListener('touchend', end);
    $('cClear').addEventListener('click', function () { ctx.clearRect(0, 0, cv.width, cv.height); hasSig = false; });
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
          linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '✅ נשלח ל-' + to; logActivity(lead.id, 'contract', 'נשלח הסכם לחתימה: ' + to);
        });
      });
      $('cWa').addEventListener('click', function () { withUrl(function (u) { var p = waIntl(deal.client_phone); window.open('https://wa.me/' + p + '?text=' + encodeURIComponent('שלום, לחתימה על ההסכם: ' + u), '_blank'); }); });
      $('cSms').addEventListener('click', function () { withUrl(function (u) { window.location.href = 'sms:' + (deal.client_phone || '') + '?body=' + encodeURIComponent('לחתימה על ההסכם: ' + u); }); });
      $('cCopy').addEventListener('click', function () { withUrl(function (u) { (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { linkMsg.style.color = 'var(--ok)'; linkMsg.textContent = '🔗 הקישור הועתק'; }).catch(function () { linkMsg.style.color = 'var(--txt)'; linkMsg.textContent = u; }); }); });
    }
    $('cSend').addEventListener('click', function () { $('cSend').disabled = true; $('cSend').textContent = 'שומר…'; finishContract(lead, deal, $('cDoc'), 'נשלח הסכם ללקוח', 'הסכם שנשלח', deal.stage); });
    $('cSign').addEventListener('click', function () {
      if (!hasSig) { alert('נא לחתום באזור החתימה קודם.'); return; }
      var sig = cv.toDataURL('image/png');
      $('cSign').disabled = true; $('cSign').textContent = 'שומר…';
      $('cDoc').innerHTML = contractHTML(deal, sig);   // embed the signature into the document
      finishContract(lead, deal, $('cDoc'), 'נחתם הסכם', 'הסכם חתום', 'signed');
    });
  }
  // render a contract element to a PDF (fallback: HTML), save it to the lead file + timeline
  function finishContract(lead, deal, docEl, activityText, docTitle, stage) {
    var suffix = deal.order_no ? ' #' + deal.order_no : '';
    function afterSave(path) {
      db.from('lead_documents').insert({ lead_id: lead.id, name: docTitle + suffix, storage_path: path });
      if (deal.id) { var chk = deal.checklist || {}; if (stage === 'signed') chk['התקבל הסכם'] = true; db.from('deals').update({ checklist: chk, stage: stage || deal.stage }).eq('id', deal.id); }
      logActivity(lead.id, 'contract', activityText + suffix).then(function () {
        alert('ההסכם נשמר בתיק הלקוח כ-PDF! ✅');
        if (stage === 'signed') changeStatus(lead.id, 'underwriting', lead, function () { window.C2B_openLeadCard(lead.id); });
        else window.C2B_openLeadCard(lead.id);
      });
    }
    if (window.html2pdf) {
      var path = lead.id + '/contract_' + Date.now() + '.pdf';
      window.html2pdf().set({ margin: 8, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(docEl).outputPdf('blob').then(function (blob) {
        db.storage.from('lead-docs').upload(path, blob, { contentType: 'application/pdf' }).then(function (u) { if (u.error) { alert('שמירה נכשלה: ' + u.error.message); return; } afterSave(path); });
      }).catch(function (e) { alert('יצירת PDF נכשלה: ' + (e.message || e)); });
    } else {
      var full = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"></head><body>' + docEl.innerHTML + '</body></html>';
      var hpath = lead.id + '/contract_' + Date.now() + '.html';
      db.storage.from('lead-docs').upload(hpath, new Blob([full], { type: 'text/html' })).then(function (u) { if (u.error) { alert('שמירה נכשלה: ' + u.error.message); return; } afterSave(hpath); });
    }
  }

  // ---------- FILES (client file manager) ----------
  var fileFilter = null;
  window.C2B_renderFiles = function (stageFilter) {
    loading();
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
          return '<tr data-deal="' + d.id + '" style="cursor:pointer"><td><b>#' + esc(d.order_no) + '</b></td><td>' + esc(d.client_name) + '</td><td>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + '</td><td>' + nis(d.total) + '</td><td style="color:var(--ok);font-weight:700">' + nis(d.commission) + '</td><td>' + stageBadge(d.stage || 'initial') + '</td><td><div class="bar" style="width:80px;display:inline-block;vertical-align:middle"><span style="width:' + Math.round(done / tot * 100) + '%"></span></div> ' + done + '/' + tot + '</td></tr>';
        }).join('');
        C.$('filesBody').innerHTML = fileFilter.render() +
          '<div class="table-scroll"><table><thead><tr><th>#</th><th>לקוח</th><th>רכב</th><th>סכום</th><th>עמלת סוכן</th><th>שלב</th><th>צ\'קליסט</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">אין תיקים</td></tr>') + '</tbody></table></div>';
        fileFilter.bind();
        C.$('filesBody').querySelectorAll('tr[data-deal]').forEach(function (tr) { tr.addEventListener('click', function () { window.C2B_openDeal(tr.dataset.deal); }); });
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
})();
