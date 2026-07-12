/* ============================================================
   Car2Buy — lightweight first-party analytics.
   Logs a pageview on load and a session_end (dwell time) on leave,
   into the public.events table (anon INSERT, RLS-protected).
   No cookies, no third parties. Skips the admin page.
   ============================================================ */
(function () {
  if (/\/admin\.html?$/.test(location.pathname)) return; // never track the admin panel

  var URL = 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeGhxcGF1dXFhd2NvaXZqbm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTE4MjgsImV4cCI6MjA5OTQyNzgyOH0.bKtres24IyE4IjyZ4h9y9Wtyhgacqw37ya5s9vNDltI';

  var now = Date.now();
  var sid = localStorage.getItem('c2b_sid');
  var ts = parseInt(localStorage.getItem('c2b_sid_ts') || '0', 10);
  if (!sid || (now - ts) > 30 * 60 * 1000) { // new session after 30 min idle
    sid = 's' + now + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('c2b_sid', sid);
  }
  localStorage.setItem('c2b_sid_ts', String(now));

  function send(body) {
    body.session_id = sid;
    body.page = location.pathname;
    body.ua = (navigator.userAgent || '').slice(0, 300);
    try {
      fetch(URL + '/rest/v1/events', {
        method: 'POST',
        keepalive: true, // lets the request complete during page unload
        headers: {
          'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (e) {}
  }

  // pageview
  send({ type: 'pageview', referrer: document.referrer || null });

  // dwell time on leave (once)
  var t0 = now, sent = false;
  function end() {
    if (sent) return; sent = true;
    send({ type: 'session_end', duration_ms: Date.now() - t0 });
  }
  window.addEventListener('pagehide', end);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') end(); });
})();
