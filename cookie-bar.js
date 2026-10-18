/* Car2Buy — cookie consent bar for pages that do not load site.js (landing pages, campaign pages).
   Google Consent Mode v2: every page sets consent 'default' = denied (inline, before GTM) unless the visitor
   already accepted (localStorage c2b_consent === 'granted'). This bar records the choice and sends
   gtag('consent','update'). No "continued browsing = consent" — only the accept button grants. */
(function () {
  var KEY = 'c2b_consent';
  var v = null;
  try { v = localStorage.getItem(KEY); } catch (e) {}
  if (v === 'granted' || v === 'denied') return;
  function gtagU(g) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'update', { ad_storage: g, analytics_storage: g, ad_user_data: g, ad_personalization: g });
  }
  function build() {
    if (document.getElementById('cookieBar')) return;
    var st = document.createElement('style');
    st.textContent = '#cookieBar{position:fixed;inset-inline:12px;bottom:12px;z-index:2147483000;max-width:620px;margin-inline:auto;background:#121417;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:14px 16px;box-shadow:0 18px 50px -12px rgba(0,0,0,.6);font:500 14px/1.6 "Heebo",system-ui,sans-serif;direction:rtl;display:flex;gap:12px;align-items:center;flex-wrap:wrap}' +
      '#cookieBar p{margin:0;flex:1 1 260px}#cookieBar a{color:#ffb27f;text-decoration:underline}' +
      '#cookieBar .cb-act{display:flex;gap:8px}#cookieBar button{font:700 14px "Heebo",system-ui,sans-serif;border-radius:999px;padding:9px 18px;cursor:pointer;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff}' +
      '#cookieBar button.cb-ok{background:#c74e12;border-color:#c74e12}#cookieBar button:focus-visible{outline:2px solid #ffb27f;outline-offset:2px}';
    document.head.appendChild(st);
    var bar = document.createElement('div');
    bar.id = 'cookieBar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'הסכמה לעוגיות');
    bar.innerHTML = '<p>אנו משתמשים בעוגיות למדידה ולשיווק — רק אם תאשרו. אפשר לדחות, והאתר ימשיך לעבוד כרגיל. <a href="/cookies">מדיניות עוגיות</a> · <a href="/privacy">פרטיות</a></p>' +
      '<div class="cb-act"><button type="button" class="cb-no" id="cookieDecline">דחייה</button><button type="button" class="cb-ok" id="cookieOk">אישור</button></div>';
    document.body.appendChild(bar);
    function close(val) {
      try { localStorage.setItem(KEY, val); } catch (e) {}
      gtagU(val === 'granted' ? 'granted' : 'denied');
      bar.remove();
    }
    bar.querySelector('#cookieOk').addEventListener('click', function () { close('granted'); });
    bar.querySelector('#cookieDecline').addEventListener('click', function () { close('denied'); });
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
