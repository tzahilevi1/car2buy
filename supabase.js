/* ============================================================
   Car2Buy — Supabase lead capture (client-side).
   Exposes window.submitLead(payload) which saves a lead into the
   public.leads table. Uses only the PUBLIC anon key — safe to ship:
   RLS on the table allows INSERT only (no read) for anon.
   ============================================================ */
(function () {
  var SUPABASE_URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

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
  window.submitLead = function (payload) {
    payload = payload || {};
    var body = {
      name: payload.name || null,
      phone: payload.phone || null,
      email: payload.email || null,
      car: payload.car || null,
      message: payload.message || null,
      source: payload.source || (document.body && document.body.dataset ? document.body.dataset.page : null) || null,
      page_url: location.href,
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
    }).catch(function (e) {
      console.warn('[Car2Buy] lead save error', e);
      return false;
    });
  };
})();
