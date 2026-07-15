/* ============================================================
   Car2Buy — Supabase lead capture (client-side).
   Exposes window.submitLead(payload) which saves a lead into the
   public.leads table. Uses only the PUBLIC anon key — safe to ship:
   RLS on the table allows INSERT only (no read) for anon.
   ============================================================ */
(function () {
  var SUPABASE_URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

  // shared low-level POST helper for a Supabase table (anon, insert-only tables)
  function sbInsert(table, body) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) { return res.text().then(function (t) { console.warn('[Car2Buy] ' + table + ' insert failed', res.status, t); return false; }); }
      return true;
    }).catch(function (e) { console.warn('[Car2Buy] ' + table + ' insert error', e); return false; });
  }

  /**
   * Save a scheduled appointment. Fires the email-notification webhook.
   * @param {{name,phone,email,type,branch,note,date,time}} d
   */
  window.submitAppointment = function (d) {
    d = d || {};
    return sbInsert('appointments', {
      name: d.name || null, phone: d.phone || null, email: d.email || null,
      type: d.type || null, branch: d.branch || null, note: d.note || null,
      appt_date: d.date || null, appt_time: d.time || null, appt_at: d.appt_at || null
    });
  };

  /**
   * Scan a <form> and normalise its fields into a lead payload.
   * Classifies by input type + name/id keywords (Hebrew & English).
   * @param {HTMLFormElement} form
   * @param {object} [extra] fields to merge/override (e.g. { source })
   */
  window.collectForm = function (form, extra) {
    var out = { meta: {} };
    if (form && form.querySelectorAll) {
      var els = form.querySelectorAll('input, select, textarea');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.name && !el.id) continue;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
        var v = (el.value || '').trim();
        if (!v) continue;
        var key = (el.name || el.id || '').toLowerCase();
        if (el.type === 'tel' || /phone|tel|נייד|טלפון/.test(key)) out.phone = out.phone || v;
        else if (el.type === 'email' || /mail|אימייל/.test(key)) out.email = out.email || v;
        else if (/name|שם|fname|fullname/.test(key)) out.name = out.name || v;
        else if (el.tagName === 'TEXTAREA' || /msg|message|note|הערה/.test(key)) out.message = out.message || v;
        else if (/car|רכב|model|דגם/.test(key)) out.car = out.car || v;
        out.meta[el.name || el.id] = v;
      }
    }
    if (extra) { for (var k in extra) { if (extra[k] != null) out[k] = extra[k]; } }
    return out;
  };

  /**
   * Save a lead. Returns a Promise<boolean> (true = saved).
   * Never throws — a failure must not block the user's "thank you" UX.
   * @param {{name?,phone?,email?,car?,message?,source?,meta?}} payload
   */
  // marketing attribution from the URL query (utm_* + ad ids), persisted per
  // session so it survives navigation between the landing page and the form.
  function qp(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function attribution() {
    var keys = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term', 'ad_group', 'adgroup', 'gclid'];
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('c2b_attr') || '{}'); } catch (e) {}
    var found = false, cur = {};
    keys.forEach(function (k) { var v = qp(k); if (v) { cur[k] = v; found = true; } });
    if (found) { try { sessionStorage.setItem('c2b_attr', JSON.stringify(cur)); } catch (e) {} return cur; }
    return stored;
  }
  // best-effort public IP (never blocks the save for more than ~1.2s)
  function getIp() {
    return new Promise(function (resolve) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 1200);
      fetch('https://api.ipify.org?format=json').then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (!done) { done = true; clearTimeout(t); resolve(j && j.ip || null); } })
        .catch(function () { if (!done) { done = true; clearTimeout(t); resolve(null); } });
    });
  }

  window.submitLead = function (payload) {
    payload = payload || {};
    // ---- anti-spam / abuse guards (defense-in-depth; forms also validate) ----
    // 1) honeypot — bots fill hidden fields real users never see; drop silently.
    if (payload.hp || payload._hp || payload.website || payload.company_url) return Promise.resolve(true);
    // 2) require a plausible contact channel (phone / email / message).
    var digits = String(payload.phone || '').replace(/\D/g, '');
    var hasEmail = /.+@.+\..+/.test(String(payload.email || ''));
    if (digits.length < 7 && !hasEmail && !payload.message) return Promise.resolve(false);
    // 3) per-session rate limit — cap bursts from one browser.
    try {
      var _now = Date.now(), _win = 600000, _cap = 8;
      var _hist = JSON.parse(localStorage.getItem('c2b_lead_rl') || '[]').filter(function (t) { return _now - t < _win; });
      if (_hist.length >= _cap) return Promise.resolve(true);
      _hist.push(_now); localStorage.setItem('c2b_lead_rl', JSON.stringify(_hist));
    } catch (e) {}
    var attr = attribution(), meta = payload.meta || {};
    return getIp().then(function (ip) {
      var body = {
        name: payload.name || null,
        phone: payload.phone || null,
        email: payload.email || null,
        car: payload.car || null,
        message: payload.message || null,
        source: payload.source || (document.body && document.body.dataset ? document.body.dataset.page : null) || null,
        page_url: location.href,
        ip: ip,
        city: payload.city || meta.city || meta['עיר'] || null,
        brand: payload.brand || meta.brand || meta['מותג'] || null,
        marketing_company: payload.marketing_company || attr.utm_source || null,
        utm_source: attr.utm_source || null,
        utm_campaign: attr.utm_campaign || null,
        utm_medium: attr.utm_medium || null,
        utm_content: attr.utm_content || null,
        utm_term: attr.utm_term || null,
        ad_group: attr.ad_group || attr.adgroup || null,
        meta: payload.meta || null
      };
      return fetch(SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) { console.warn('[Car2Buy] lead save failed', res.status, t); return false; });
        }
        if (window.c2bTrack) { try { c2bTrack('lead_saved', { source: body.source }); } catch (e) {} }
        return true;
      });
    }).catch(function (e) {
      console.warn('[Car2Buy] lead save error', e);
      return false;
    });
  };
})();
