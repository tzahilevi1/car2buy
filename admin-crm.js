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
  var CHECKLIST_ITEMS = ['התקבל הסכם', 'התקבלה ת"ז', 'התקבל רישיון נהיגה', 'התקבלו תלושי שכר', 'התקבלו דפי בנק', 'נבדקו מסמכים', 'נשלח למימון', 'התקבל אישור מימון', 'נשלחה פוליסה', 'הוזמן רכב', 'תואמה מסירה'];
  function stageBar(cur) {
    var idx = DEAL_STAGES.map(function (s) { return s.k; }).indexOf(cur);
    return DEAL_STAGES.map(function (s, i) {
      var state = i < idx ? 'green' : i === idx ? 'cur' : 'gray';
      var bg = { gray: 'var(--surface-2)', cur: s.color, green: '#16a34a' }[state];
      return '<div class="st" data-stage="' + s.k + '" style="cursor:pointer;background:' + bg + ';color:' + (state === 'gray' ? 'var(--muted)' : '#fff') + '">' + esc(s.label) + '</div>';
    }).join('');
  }
  function stageBadge(k) { var s = stageDef(k); return '<span class="tag" style="border-color:' + s.color + ';color:' + s.color + ';background:' + s.color + '18">' + esc(s.label) + '</span>'; }
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
  function changeStatus(leadId, to, lead, after) {
    var from = lead && lead.status;
    var patch = { status: to, status_changed_at: new Date().toISOString() };
    if (to === 'in_progress' && (!lead || !lead.first_response_at)) patch.first_response_at = new Date().toISOString();
    db.from('leads').update(patch).eq('id', leadId).then(function (u) {
      if (u.error) return alert('שגיאה: ' + u.error.message);
      logActivity(leadId, 'status_change', from ? ('סטטוס: ' + stDef(from).label + ' → ' + stDef(to).label) : ('סטטוס שונה ל: ' + stDef(to).label)).then(function () { if (after) after(); });
    });
  }

  // ---- car catalog cache (for the deal / car picker) ----
  var carsCache = null;
  function loadCars(cb) { if (carsCache) return cb(carsCache); fetch('cars.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (c) { carsCache = c || []; cb(carsCache); }).catch(function () { cb([]); }); }

  // ---------- LEADS TABLE ----------
  var cache = [], profiles = {}, orderIds = [], curFilter = null, curDeals = [];
  window.C2B_renderLeads = function (statusFilter) {
    curFilter = statusFilter || null;
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
        '<div class="table-scroll"><table><thead><tr><th>שם</th><th>טלפון</th><th>וואטסאפ</th><th>מקור</th><th>רכב</th><th>איש מכירות</th><th>סטטוס</th><th>עדכון</th></tr></thead><tbody id="ltbl"></tbody></table></div></div>');
      C.$('lq').addEventListener('input', draw);
      C.$('lcsv').addEventListener('click', function () { C.exportCsv(listRows(), ['created_at', 'name', 'phone', 'email', 'car', 'source', 'status', 'message'], 'car2buy-leads'); });
      draw();
    });
  };
  function listRows() {
    var q = (C.$('lq') && C.$('lq').value || '').trim().toLowerCase();
    return cache.filter(function (l) {
      if (curFilter && (l.status || 'new') !== curFilter) return false;
      if (q && !((l.name || '') + ' ' + (l.phone || '') + ' ' + (l.car || '')).toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function draw() {
    var rows = listRows();
    orderIds = rows.map(function (l) { return l.id; });
    if (C.$('lcount')) C.$('lcount').textContent = '(' + rows.length + ')';
    C.$('ltbl').innerHTML = rows.map(function (l) {
      var wa = waLink(l.phone);
      return '<tr data-lead="' + l.id + '"><td style="cursor:pointer"><span class="avatar" style="margin-inline-end:8px">' + esc(initials(l.name)) + '</span><b>' + esc(l.name) + '</b></td>' +
        '<td>' + esc(l.phone) + '</td><td>' + (wa ? '<a class="wa-ic" href="' + wa + '" target="_blank" rel="noopener" title="פתח וואטסאפ" onclick="event.stopPropagation()">💬</a>' : '—') + '</td>' +
        '<td><span class="tag">' + esc(l.source) + '</span></td><td>' + esc(l.car) + '</td>' +
        '<td class="muted">' + esc(profiles[l.assigned_to] || '—') + '</td><td>' + badge(l.status || 'new', true, l.id) + '</td><td class="muted">' + fmt(l.status_changed_at || l.created_at) + '</td></tr>';
    }).join('') || '<tr><td colspan="8" class="empty">אין לידים</td></tr>';
    C.$('ltbl').querySelectorAll('td[style]').forEach(function (td) { td.addEventListener('click', function () { window.C2B_openLeadCard(td.parentNode.dataset.lead); }); });
    C.$('ltbl').querySelectorAll('.tag.click').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); openStatusMenu(el, el.dataset.cur, function (to) { changeStatus(el.dataset.stLead, to, { status: el.dataset.cur }, function () { window.C2B_renderLeads(curFilter); }); }); });
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

  window.C2B_openLeadCard = function (id) {
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
      '<div class="card" style="padding:14px"><div class="flow">' + flowBar(lead.status || 'new') + '</div></div>' +
      '<div class="lead-grid">' +
        '<div><div class="card"><h3>פרטי לקוח' + (role !== 'admin' && roleShort(role) ? ' · ' + roleShort(role) : '') + '</h3>' + leadDetails(lead, deals, pays) +
          (lead.status === 'lost' ? '<div style="margin-top:10px"><label class="muted" style="font-size:12px">סיבת סגירה</label><select class="inp" id="lpReason" style="width:100%;margin-top:4px"><option value="">בחר…</option>' + CLOSE_REASONS.map(function (x) { return '<option' + (lead.close_reason === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' : '') +
          (lead.message ? '<div style="margin-top:10px;font-size:14px">🗒️ ' + esc(lead.message) + '</div>' : '') + '</div>' +
          '<div class="card"><div class="row-between"><h3 style="margin:0">עסקאות</h3>' + (role !== 'accounting' ? '<button class="btn btn-sm" id="lpNewDeal">+ עסקה</button>' : '') + '</div><div id="lpDeals">' + dealList(deals) + '</div></div>' +
        '</div>' +
        '<div>' +
          '<div class="card"><h3>ציר זמן — הכל במקום אחד</h3><p class="muted" style="font-size:12px;margin:-4px 0 10px">הערות · שיחות · WhatsApp · מיילים · משימות · מסמכים · עסקאות · תשלומים</p><div class="tl" id="lpTimeline">' + feedHtml(feed) + '</div></div>' +
          '<div class="card" id="lpActions"><h3>פעולות</h3><div class="qa2" style="display:flex;gap:8px;flex-wrap:wrap">' + actBtns + '</div><div id="lpForm" style="margin-top:12px"></div></div>' +
        '</div>' +
      '</div>'
    );
    bindLead(lead, prev, next);
  }
  // ---- role-tailored details (each role sees its own fields) ----
  function leadDetails(lead, deals, pays) {
    var role = C.role || 'admin', deal = deals[0], html = '';
    html += row('טלפון', lead.phone ? '<a href="tel:' + esc(lead.phone) + '">' + esc(lead.phone) + '</a>' : '—');
    html += row('אימייל', esc(lead.email) || '—');
    if (role === 'accounting') {
      var total = deals.reduce(function (s, d) { return s + (Number(d.total) || 0); }, 0);
      var paid = pays.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
      html += row('רכב', esc(lead.car) || '—');
      html += row('שווי עסקאות', nis(total));
      html += row('נגבה', nis(paid));
      html += row('יתרה פתוחה', nis(total - paid));
    } else if (role === 'files') {
      html += row('רכב', deal && deal.car_make ? esc(deal.car_make + ' ' + (deal.car_model || '')) : (esc(lead.car) || '—'));
      html += row('שלב תיק', deal ? stageBadge(deal.stage || 'initial') : '—');
      if (deal) { var cl = deal.checklist || {}; var done = CHECKLIST_ITEMS.filter(function (i) { return cl[i]; }).length; html += row('צ׳קליסט', done + '/' + CHECKLIST_ITEMS.length); }
      html += row('מקור', esc(lead.source) || '—');
    } else {
      html += row('רכב', esc(lead.car) || '—');
      html += row('מקור', esc(lead.source) || '—');
      html += row('איש מכירות', esc(profiles[lead.assigned_to]) || '—');
      html += row('נוצר', fmt(lead.created_at));
    }
    return html;
  }
  // ---- unified timeline feed (everything, newest first) ----
  var FEED_TAG = { note: 'הערה', call: 'שיחה', whatsapp: 'WhatsApp', email: 'מייל', status: 'סטטוס', task: 'משימה', document: 'מסמך', meeting: 'פגישה', deal: 'עסקה', contract: 'הסכם' };
  function buildFeed(acts, tasks, docs, deals, pays, urls) {
    var items = [];
    acts.forEach(function (a) { items.push({ ts: a.created_at, icon: ACT_ICON[a.type] || '•', who: profiles[a.created_by], html: a.body ? esc(a.body) : '', tag: FEED_TAG[a.type] || a.type }); });
    docs.forEach(function (d) {
      var u = urls[d.storage_path], body;
      if (u && docIsImage(d.name)) body = '<div style="margin:2px 0 4px">' + esc(d.name) + '</div><a href="' + u + '" target="_blank" rel="noopener"><img src="' + u + '" alt="' + esc(d.name) + '" style="max-width:100%;max-height:280px;border-radius:10px;border:1px solid var(--line);display:block"></a>';
      else if (u) body = '<a href="' + u + '" target="_blank" rel="noopener">📎 ' + esc(d.name) + '</a>';
      else body = '<a href="#" data-doc="' + esc(d.storage_path) + '">📎 ' + esc(d.name) + '</a>';
      items.push({ ts: d.created_at, icon: '📎', who: profiles[d.created_by], html: body, tag: 'מסמך' });
    });
    tasks.forEach(function (t) {
      var over = !t.done && t.due_at && new Date(t.due_at) < new Date();
      var due = t.due_at ? '<span style="font-size:12px;color:' + (over ? 'var(--danger)' : 'var(--muted)') + '"> · יעד ' + fmt(t.due_at) + '</span>' : '';
      items.push({ ts: t.created_at || t.due_at, icon: '✅', who: profiles[t.created_by], html: '<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '><span' + (t.done ? ' style="text-decoration:line-through;color:var(--muted)"' : '') + '>' + esc(t.title) + '</span>' + due + '</label>', tag: 'משימה' });
    });
    deals.forEach(function (d) { items.push({ ts: d.created_at, icon: '💰', who: profiles[d.created_by], html: 'עסקה #' + esc(d.order_no || String(d.id).slice(0, 6)) + (d.car_make ? ' · ' + esc(d.car_make + ' ' + (d.car_model || '')) : '') + (d.total ? ' · ' + nis(d.total) : '') + ' — <a href="#" data-open-deal="' + d.id + '">פתח</a>', tag: 'עסקה' }); });
    pays.forEach(function (p) { items.push({ ts: p.created_at, icon: '🧾', who: profiles[p.created_by], html: ({ invoice: 'חשבונית', receipt: 'קבלה', payment: 'תשלום' }[p.kind] || 'תשלום') + ' · ' + nis(p.amount) + (p.method ? ' · ' + esc(p.method) : '') + (p.ref_no ? ' · ' + esc(p.ref_no) : ''), tag: 'כספים' }); });
    items.sort(function (a, b) { return new Date(b.ts || 0) - new Date(a.ts || 0); });
    return items;
  }
  function feedHtml(items) {
    return items.length ? items.map(function (a) {
      return '<div class="ev"><div class="dot">' + a.icon + '</div><div style="flex:1"><div class="tm">' + fmt(a.ts) + (a.tag ? ' · ' + esc(a.tag) : '') + (a.who ? ' · ' + esc(a.who) : '') + '</div>' + (a.html ? '<div>' + a.html + '</div>' : '') + '</div></div>';
    }).join('') : '<p class="empty">אין עדיין פעילות</p>';
  }
  function row(k, v) { return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:13px">' + k + '</span><span>' + v + '</span></div>'; }
  function flowBar(cur) {
    var idx = FLOW.map(function (s) { return s.k; }).indexOf(cur), lost = cur === 'lost' || cur === 'no_answer';
    return FLOW.map(function (s, i) {
      var state = lost ? (i === 0 ? 'red' : 'gray') : (i < idx ? 'green' : i === idx ? 'cur' : 'gray');
      var bg = { gray: 'var(--surface-2)', cur: s.color, green: '#16a34a', red: '#e2555a' }[state];
      return '<div class="st" style="background:' + bg + ';color:' + (state === 'gray' ? 'var(--muted)' : '#fff') + '">' + s.icon + '<br>' + esc(s.label) + '</div>';
    }).join('');
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
    // clickable status
    var stEl = $('lpStatus').querySelector('.tag.click');
    if (stEl) stEl.addEventListener('click', function (e) { e.stopPropagation(); openStatusMenu(stEl, lead.status || 'new', function (to) { changeStatus(lead.id, to, lead, function () { window.C2B_openLeadCard(lead.id); }); }); });
    var rs = $('lpReason'); if (rs) rs.addEventListener('change', function () { db.from('leads').update({ close_reason: rs.value }).eq('id', lead.id); });
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
    if (k === 'contract') { logActivity(lead.id, 'contract', 'סומן: נשלח הסכם').then(function () { window.C2B_openLeadCard(lead.id); }); alert('מילוי + חתימה על ההסכם זמינים דרך כרטיס העסקה. הפעולה תועדה בציר הזמן.'); return; }
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
    C.$('qaArea').innerHTML = '<div class="card" style="box-shadow:none;margin:10px 0 0"><h3>קביעת פגישה</h3><form id="mForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">' +
      '<div class="field" style="margin:0"><label>תאריך</label><input class="inp" type="date" name="date" required></div>' +
      '<div class="field" style="margin:0"><label>שעה</label><input class="inp" type="time" name="time" required></div>' +
      '<button class="btn btn-sm">קבע ושלח אישור</button><button type="button" class="btn btn-ghost btn-sm" id="mCancel">ביטול</button></form></div>';
    C.$('mCancel').addEventListener('click', function () { C.$('qaArea').innerHTML = ''; });
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
    C.$('qaArea').innerHTML = '<div class="card ac-box" style="box-shadow:none;margin:10px 0 0"><h3>בחירת רכב לעסקה</h3><input class="inp" id="carSearch" placeholder="הקלד מותג / דגם (עברית או אנגלית)…" style="width:100%"><div class="ac-res hidden" id="carRes"></div></div>';
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
    return deals.map(function (d) { return '<div data-deal-id="' + d.id + '" style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer"><b>#' + esc(d.order_no) + '</b> · ' + esc(dealStatusLabel(d.status)) + ' · ' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + ' · ' + nis(d.total) + '</div>'; }).join('');
  }
  function dealForm(lead, deal) {
    deal = deal || {}; var ad = deal.addons || {};
    var curStage = deal.stage || 'initial';
    var checklist = {}; CHECKLIST_ITEMS.forEach(function (it) { checklist[it] = !!(deal.checklist || {})[it]; });
    var G = function (label, name, val, type) { return '<div class="field" style="margin:0"><label>' + label + '</label><input class="inp" id="dl_' + name + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" style="width:100%"></div>'; };
    var grid = function (inner) { return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + inner + '</div>'; };
    var statusSel = '<div class="field" style="margin:0"><label>סטטוס הזמנה</label><select class="inp" id="dl_status" style="width:100%">' + [['quote', 'הצעת מחיר'], ['ordered', 'הזמנה'], ['cancelled', 'בוטל']].map(function (s) { return '<option value="' + s[0] + '"' + ((deal.status || 'quote') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>';
    view(
      '<div class="lead-top"><div style="display:flex;align-items:center;gap:8px"><button class="btn btn-ghost btn-sm" id="dlBack">→ לכרטיס</button><h3 style="margin:0">' + (deal.id ? 'עסקה #' + esc(deal.order_no) : 'עסקה חדשה') + '</h3></div>' +
        '<div><button class="btn btn-ghost btn-sm" id="dlContract">✍ הסכם לחתימה</button> <button class="btn btn-ghost btn-sm" id="dlSubmitFin">🏦 הגש למימון</button> <button class="btn btn-sm" id="dlSave">💾 שמירה</button></div></div>' +
      '<div class="card" style="padding:12px"><div class="flow" id="dlStageBar">' + stageBar(curStage) + '</div></div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>בחירת טופס</h3>' + grid(G('סוג טופס', 'form_type', deal.form_type || 'חוזה קאר פלוס') + statusSel + G('מנהל מכירות', 'salesperson', deal.salesperson || '')) + '</div>' +
        '<div class="card"><h3>פרטי לקוח</h3>' + grid(G('שם לקוח', 'client_name', deal.client_name || lead.name) + G('טלפון נייד', 'client_phone', deal.client_phone || lead.phone) + G('דוא"ל', 'client_email', deal.client_email || lead.email) + G('כתובת', 'client_address', deal.client_address || lead.city) + G('ת.ז / ח.פ', 'client_id', deal.client_id) + G('שם לחשבונית', 'invoice_name', deal.invoice_name || lead.name)) + '</div>' +
      '</div>' +
      '<div class="card ac-box"><h3>הצעת מחיר והזמנת רכב</h3>' +
        '<input class="inp" id="dl_carSearch" placeholder="🔎 חפש רכב מהקטלוג (עברית/אנגלית) — ימלא אוטומטית" style="width:100%;margin-bottom:10px"><div class="ac-res hidden" id="dl_carRes"></div>' +
        grid(G('יצרן', 'car_make', deal.car_make) + G('דגם', 'car_model', deal.car_model) + G('שנת ייצור', 'car_year', deal.car_year || 2026, 'number') + G('רמת גימור', 'car_trim', deal.car_trim) + G('נפח מנוע', 'car_engine', deal.car_engine) + G('תיבת הילוכים', 'car_gearbox', deal.car_gearbox) + G('צבע הרכב', 'car_color', deal.car_color) + G('מחיר הרכב ₪', 'car_price', deal.car_price, 'number')) + '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>תמחור ומקדמה</h3>' + grid(G('סכום מקדמה כולל ₪', 'down_total', deal.down_total, 'number') + G('מקדמה ראשונית ₪', 'down_initial', deal.down_initial, 'number') + G('החזר חודשי משוער ₪', 'monthly', deal.monthly, 'number') + G('זמן אספקה (ימים)', 'delivery_days', deal.delivery_days, 'number')) + '</div>' +
        '<div class="card"><h3>תוספות</h3><label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_charging"' + (ad.charging ? ' checked' : '') + '> עמדת טעינה</label>' +
          '<label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_armor"' + (ad.armor ? ' checked' : '') + '> מיגון לפי דרישת ביטוח</label>' +
          '<label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="dl_accessories"' + (ad.accessories ? ' checked' : '') + '> אביזרים נלווים</label>' +
          '<div class="field" style="margin-top:6px"><label>סכום תוספות ₪</label><input class="inp" id="dl_addons_amount" type="number" value="' + esc(ad.addons_amount == null ? '' : ad.addons_amount) + '" style="width:100%"></div></div>' +
      '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>צ\'קליסט תיק</h3><div id="dlChecklist">' + CHECKLIST_ITEMS.map(function (it) { return '<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" data-chk="' + esc(it) + '"' + (checklist[it] ? ' checked' : '') + '> ' + esc(it) + '</label>'; }).join('') + '</div></div>' +
        '<div class="card"><h3>מקטע מימון</h3>' + grid(G('גובה מימון מבוקש ₪', 'fin_amount', (deal.financing || {}).amount, 'number') + G('מספר תשלומים', 'fin_payments', (deal.financing || {}).payments, 'number') + G('מסלול מימון', 'fin_track', (deal.financing || {}).track) + G('סטטוס מימון', 'fin_status', (deal.financing || {}).status)) + '</div>' +
      '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>סיכום הזמנה</h3>' + grid(G('הנחה (%)', 'discount_pct', deal.discount_pct, 'number') + G('הנחה (סכום) ₪', 'discount_amt', deal.discount_amt, 'number') + G('שולם ₪', 'paid', deal.paid, 'number')) +
          '<label style="display:flex;gap:8px;align-items:center;padding:8px 0"><input type="checkbox" id="dl_vat"' + (deal.vat_included !== false ? ' checked' : '') + '> כולל מע"מ</label>' +
          '<div id="dlSummary" style="margin-top:8px"></div></div>' +
        '<div class="card"><h3>מפרט רכב</h3><textarea class="inp" id="dl_spec" rows="6" style="width:100%" placeholder="מפרט / הערות לחוזה…">' + esc(deal.spec || '') + '</textarea></div>' +
      '</div>' +
      '<div class="card"><h3>תשלומים / קבלות / חשבוניות</h3><div id="dlPayList">' + (deal.id ? 'טוען…' : '<p class="muted">שמרו את העסקה כדי לנהל תשלומים</p>') + '</div>' +
        (deal.id ? '<form id="dlPayForm" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><select class="inp" name="kind"><option value="payment">תשלום</option><option value="receipt">קבלה</option><option value="invoice">חשבונית</option></select><input class="inp" name="amount" type="number" placeholder="סכום ₪" style="width:120px"><input class="inp" name="method" placeholder="אמצעי (מזומן/אשראי)" style="width:150px"><input class="inp" name="ref" placeholder="אסמכתא" style="width:130px"><button class="btn btn-sm">+ הוסף</button></form>' : '') + '</div>'
    );
    var $ = C.$;
    $('dlBack').addEventListener('click', function () { window.C2B_openLeadCard(lead.id); });
    // stage bar
    $('dlStageBar').addEventListener('click', function (e) { var st = e.target.closest('[data-stage]'); if (!st) return; curStage = st.dataset.stage; $('dlStageBar').innerHTML = stageBar(curStage); if (deal.id) { db.from('deals').update({ stage: curStage }).eq('id', deal.id); logActivity(lead.id, 'system', 'שלב עסקה: ' + stageDef(curStage).label); } });
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
      curStage = 'submitted'; $('dlStageBar').innerHTML = stageBar(curStage);
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
        res.querySelectorAll('.ai[data-i]').forEach(function (el) { el.addEventListener('click', function () { var c = cars[+el.dataset.i]; $('dl_car_make').value = c.brand || ''; $('dl_car_model').value = c.name || ''; $('dl_car_trim').value = c.trim || ''; $('dl_car_price').value = c.p || ''; $('dl_monthly').value = c.m || ''; res.classList.add('hidden'); inp.value = ''; compute(); }); });
      });
    });
    // read the current form into a deal object (reused by save + contract)
    function readForm() {
      var c = compute();
      return {
        lead_id: lead.id, form_type: $('dl_form_type').value, status: $('dl_status').value, salesperson: $('dl_salesperson').value,
        client_name: $('dl_client_name').value, client_phone: $('dl_client_phone').value, client_email: $('dl_client_email').value, client_address: $('dl_client_address').value, client_id: $('dl_client_id').value, invoice_name: $('dl_invoice_name').value,
        car_make: $('dl_car_make').value, car_model: $('dl_car_model').value, car_year: num('dl_car_year') || null, car_trim: $('dl_car_trim').value, car_engine: $('dl_car_engine').value, car_gearbox: $('dl_car_gearbox').value, car_color: $('dl_car_color').value,
        car_price: num('dl_car_price'), down_total: num('dl_down_total'), down_initial: num('dl_down_initial'), down_balance: c.downBal, monthly: num('dl_monthly'), delivery_days: num('dl_delivery_days') || null, balance_to_pay: c.balPay,
        addons: { charging: $('dl_charging').checked, armor: $('dl_armor').checked, accessories: $('dl_accessories').checked, addons_amount: num('dl_addons_amount') },
        vat_included: $('dl_vat').checked, discount_pct: num('dl_discount_pct') || null, discount_amt: c.disc, total: c.total, paid: num('dl_paid') || null, spec: $('dl_spec').value,
        stage: curStage, checklist: checklist, financing: { amount: num('dl_fin_amount') || null, payments: num('dl_fin_payments') || null, track: $('dl_fin_track').value, status: $('dl_fin_status').value }
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
    view(
      '<div class="lead-top"><button class="btn btn-ghost btn-sm" id="cBack">→ לעסקה</button><h3 style="margin:0">הסכם — ' + esc(deal.client_name || '') + '</h3>' +
        '<div><button class="btn btn-ghost btn-sm" id="cPrint">🖨️ הדפס / PDF</button> <button class="btn btn-sm" id="cSign">✍ חתום ושמור</button></div></div>' +
      '<div class="card" id="cDoc" style="background:#fff;color:#111">' + contractHTML(deal) + '</div>' +
      '<div class="card"><h3>חתימת לקוח (צייר עם העכבר / אצבע)</h3><canvas id="sig" width="480" height="150" style="border:1px dashed var(--line);border-radius:10px;background:#fff;touch-action:none;max-width:100%"></canvas><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" id="cClear">נקה חתימה</button></div></div>'
    );
    var $ = C.$;
    $('cBack').addEventListener('click', function () { dealForm(lead, deal); });
    var cv = $('sig'), ctx = cv.getContext('2d'), drawing = false, hasSig = false;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    function pos(e) { var r = cv.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    function start(e) { drawing = true; hasSig = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); if (e.cancelable) e.preventDefault(); }
    function move(e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (e.cancelable) e.preventDefault(); }
    function end() { drawing = false; }
    cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    cv.addEventListener('touchstart', start); cv.addEventListener('touchmove', move); cv.addEventListener('touchend', end);
    $('cClear').addEventListener('click', function () { ctx.clearRect(0, 0, cv.width, cv.height); hasSig = false; });
    $('cPrint').addEventListener('click', function () { var w = window.open('', '_blank'); if (!w) return; w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>הסכם</title></head><body>' + $('cDoc').innerHTML + '</body></html>'); w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 250); });
    $('cSign').addEventListener('click', function () {
      if (!hasSig) { alert('נא לחתום באזור החתימה קודם.'); return; }
      var sig = cv.toDataURL('image/png');
      var full = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>הסכם חתום ' + esc(deal.order_no || '') + '</title></head><body>' + contractHTML(deal, sig) + '</body></html>';
      var path = lead.id + '/contract_' + Date.now() + '.html';
      db.storage.from('lead-docs').upload(path, new Blob([full], { type: 'text/html' })).then(function (u) {
        if (u.error) { alert('שמירה נכשלה: ' + u.error.message); return; }
        db.from('lead_documents').insert({ lead_id: lead.id, name: 'הסכם חתום #' + (deal.order_no || ''), storage_path: path });
        if (deal.id) { var chk = deal.checklist || {}; chk['התקבל הסכם'] = true; db.from('deals').update({ checklist: chk, stage: 'signed' }).eq('id', deal.id); }
        logActivity(lead.id, 'contract', 'נחתם הסכם' + (deal.order_no ? ' #' + deal.order_no : ''));
        alert('ההסכם נחתם ונשמר בתיק הלקוח! ✅');
        window.C2B_openLeadCard(lead.id);
      });
    });
  }

  // ---------- FILES (client file manager) ----------
  window.C2B_renderFiles = function (stageFilter) {
    loading();
    db.from('deals').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return errBox(r.error.message);
      var deals = r.data || [];
      var counts = { all: deals.length }; DEAL_STAGES.forEach(function (s) { counts[s.k] = 0; });
      deals.forEach(function (d) { var st = d.stage || 'initial'; counts[st] = (counts[st] || 0) + 1; });
      var f = stageFilter || 'all';
      var lst = f === 'all' ? deals : deals.filter(function (d) { return (d.stage || 'initial') === f; });
      function tab(k, label, n) { return '<button data-fstage="' + k + '"' + (f === k ? ' class="active"' : '') + '>' + label + ' (' + n + ')</button>'; }
      var rows = lst.map(function (d) {
        var chk = d.checklist || {}, done = CHECKLIST_ITEMS.filter(function (k) { return chk[k]; }).length, tot = CHECKLIST_ITEMS.length;
        return '<tr' + (d.lead_id ? ' data-lead="' + d.lead_id + '" style="cursor:pointer"' : '') + '><td><b>#' + esc(d.order_no) + '</b></td><td>' + esc(d.client_name) + '</td><td>' + esc(((d.car_make || '') + ' ' + (d.car_model || '')).trim()) + '</td><td>' + nis(d.total) + '</td><td>' + stageBadge(d.stage || 'initial') + '</td><td><div class="bar" style="width:80px;display:inline-block;vertical-align:middle"><span style="width:' + Math.round(done / tot * 100) + '%"></span></div> ' + done + '/' + tot + '</td></tr>';
      }).join('');
      view('<div class="card"><h3>תיקי לקוחות</h3><nav class="tabs" id="fTabs" style="margin-bottom:12px;flex-wrap:wrap">' + tab('all', 'הכל', counts.all) + DEAL_STAGES.map(function (s) { return tab(s.k, s.label, counts[s.k] || 0); }).join('') + '</nav>' +
        '<div class="table-scroll"><table><thead><tr><th>#</th><th>לקוח</th><th>רכב</th><th>סכום</th><th>שלב</th><th>צ\'קליסט</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="empty">אין תיקים</td></tr>') + '</tbody></table></div></div>');
      C.$('fTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-fstage]'); if (b) window.C2B_renderFiles(b.dataset.fstage === 'all' ? null : b.dataset.fstage); });
      C.$('view').querySelectorAll('tr[data-lead]').forEach(function (tr) { tr.addEventListener('click', function () { window.C2B_openLeadCard(tr.dataset.lead); }); });
    });
  };

  // ---------- DASHBOARD ----------
  window.C2B_renderDashboard = function () {
    loading();
    Promise.all([
      db.from('leads').select('status,source,created_at,first_response_at'),
      db.from('tasks').select('done'),
      db.from('appointments').select('appt_date,status')
    ]).then(function (res) {
      var leads = res[0].data || [], tasks = res[1].data || [];
      var by = {}; STATUSES.forEach(function (s) { by[s.k] = 0; });
      leads.forEach(function (l) { by[l.status || 'new'] = (by[l.status || 'new'] || 0) + 1; });
      var won = by.won || 0, lost = by.lost || 0, conv = (won + lost) ? Math.round(won / (won + lost) * 100) : 0;
      var today = new Date().toISOString().slice(0, 10);
      var todayN = leads.filter(function (l) { return (l.created_at || '').slice(0, 10) === today; }).length;
      var rts = leads.filter(function (l) { return l.first_response_at; }).map(function (l) { return (new Date(l.first_response_at) - new Date(l.created_at)) / 60000; });
      var avgRt = rts.length ? Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length) : 0;
      var openTasks = tasks.filter(function (t) { return !t.done; }).length;
      var byDay = {}; leads.forEach(function (l) { var d = (l.created_at || '').slice(0, 10); if (d) byDay[d] = (byDay[d] || 0) + 1; });
      var days = []; for (var i = 13; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push({ d: d, v: byDay[d] || 0 }); }
      var bySource = {}; leads.forEach(function (l) { var s = l.source || 'לא ידוע'; bySource[s] = (bySource[s] || 0) + 1; });
      var topSrc = Object.keys(bySource).sort(function (a, b) { return bySource[b] - bySource[a]; }).slice(0, 6);
      var maxSrc = topSrc.length ? bySource[topSrc[0]] : 1;
      view(
        '<div class="cards">' +
          C.stat('לידים חדשים היום', todayN, true) + C.stat('סה"כ לידים', leads.length) +
          C.stat('חדשים (סטטוס)', by.new || 0) + C.stat('בטיפול', by.in_progress || 0) +
          C.stat('פגישות נקבעו', by.meeting_set || 0) + C.stat('עסקאות', won) +
          C.stat('אחוז סגירה', conv + '%') + C.stat('זמן תגובה', avgRt ? avgRt + ' דק\'' : '—') +
          C.stat('משימות פתוחות', openTasks) +
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
    var max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.v; }))), W = 100 / days.length;
    var bars = days.map(function (d, i) { var h = d.v / max * 90; return '<rect x="' + (i * W + W * 0.15) + '" y="' + (100 - h) + '" width="' + (W * 0.7) + '" height="' + h + '" rx="1.5" fill="var(--brand)"><title>' + d.d + ': ' + d.v + '</title></rect>'; }).join('');
    var labels = days.map(function (d, i) { return i % 2 === 0 ? '<text x="' + (i * W + W / 2) + '" y="99" font-size="3" fill="var(--muted)" text-anchor="middle">' + d.d.slice(5) + '</text>' : ''; }).join('');
    return '<svg viewBox="0 0 100 108" preserveAspectRatio="none" style="width:100%;height:180px">' + bars + labels + '</svg>';
  }

  // expose the status model for admin.js (bell, reports)
  window.C2B_STATUSES = STATUSES;
  window.C2B_badge = badge;
})();
