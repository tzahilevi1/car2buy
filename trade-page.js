/* ============================================================
   Car2Buy — trade-in page content (self-contained).
   Populates process steps, service rows, fast-lane cards,
   FAQ + new-car service cards. Imagery from real inventory.
   ============================================================ */
(function () {
  var C2B = window.Car2Buy;
  if (!C2B || !document.getElementById('tpFaq')) return;
  var POOL = (C2B.MODELS || []).map(function (m) { return m.img; }).filter(Boolean);
  var CUST = (C2B.CUSTOMERS || []).map(function (c) { return c.img; }).filter(Boolean);
  var at = function (a, i) { return a.length ? a[i % a.length] : ''; };
  function img(src, alt, cls) { return '<div class="tp-img"><img loading="lazy" src="' + src + '" alt="' + alt + '" onerror="this.closest(\'.tp-img\').style.display=\'none\'"></div>'; }
  function bg(id, src) { var el = document.getElementById(id); if (el && src) el.style.backgroundImage = 'url(' + src + ')'; }
  bg('tpFastBg', at(POOL, 22));

  function rows(el, data) {
    if (!el) return;
    el.innerHTML = data.map(function (r, i) {
      var txt = '<div class="tp-txt">' + (r.num ? '<h3><span class="num">' + r.num + '.</span>' + r.t + '</h3>' : '<h3>' + r.t + '</h3>') +
        '<p>' + r.b + '</p>' + (r.cta ? '<a class="tp-cta" href="' + (r.href || '#') + '">' + r.cta + '</a>' : '') + '</div>';
      var pic = img(r.img, r.t);
      // alternate image side
      return '<div class="tp-row">' + (i % 2 === 0 ? pic + txt : txt + pic) + '</div>';
    }).join('');
  }

  rows(document.getElementById('tpProc'), [
    { num: 1, t: 'צלמו את הרכב שלכם', b: 'צלמו את הרכב מכל כיוון (חזית, אחור ולוחית רישוי גלויה) והכינו מראש את רישיון הרכב. התמונות יעזרו לנו לאמת את פרטי הרכב מול הרישיון ולהעריך את מצבו הקוסמטי בצורה המדויקת והמהירה ביותר.', img: at(POOL, 2) },
    { num: 2, t: 'הזינו פרטים', b: 'מלאו את טופס הפנייה הקצר שלנו עם פרטי הרכב הבסיסיים: מספר רישוי ומד אוץ (קילומטראז\'). צרפו לטופס את התמונות שצילמתם בשלב הקודם יחד עם רישיון הרכב, ושלחו אלינו בלחיצה אחת פשוטה.', img: at(POOL, 9) }
  ]);

  rows(document.getElementById('tpServe'), [
    { t: 'מפתח במפתח באותו יום', b: 'לא צריך להישאר בלי רכב אפילו ליום אחד. תמסרו את הרכב הישן ותקבלו את החדש באותו מועד, באותו מקום. המעבר הוא חלק, מתואם ומסודר — בלי תקופת ביניים ובלי צורך בהסדרים נוספים.', cta: 'מעבר רציף – מרכב ישן לרכב חדש בלי המתנה', href: '#', img: at(CUST.length ? CUST : POOL, 0) },
    { t: 'הערכת שווי מהבית תוך דקות', b: 'לא צריך להגיע לסוכנות כדי לקבל הצעת מחיר. מלאו טופס קצר באתר או באפליקציה, והנציגים שלנו יעריכו את שווי הרכב שלכם במהירות. תקבלו תשובה ברורה ומקצועית בלי לבזבז זמן על נסיעות מיותרות.', cta: 'הצעה מדויקת במהירות – הכל דיגיטלי ומרחוק', href: '#tradeWizard', img: at(POOL, 14) }
  ]);

  rows(document.getElementById('tpFast'), [
    { t: 'ראש שקט ממכירת הרכב', b: 'חסכו את כאב הראש, הטלפונים וההתעסקות מול קונים פרטיים. אנחנו נעריך את הרכב שלכם ונעניק לכם הצעת מחיר הוגנת ומשתלמת.', img: at(CUST.length ? CUST : POOL, 1) },
    { t: 'מלאי ענק של רכבים', b: 'אצלנו לא צריך להתפשר. סיימנו עם הרכב הישן? בואו לבחור את הרכב הבא שלכם מתוך מגוון עצום של דגמים ומותגים מובילים באספקה מהירה.', img: at(POOL, 5) },
    { t: 'משלמים רק את ההפרש', b: 'מעבירים אלינו את הרכב הישן, ואת היתרה על הרכב החדש משלמים בתנאי מימון גמישים, עם פריסת תשלומים נוחה בהתאמה אישית.', img: at(POOL, 12) },
    { t: 'הכל תחת קורת גג אחת', b: 'ממכירת הרכב הישן, דרך בחירת הרכב החדש ועד פתרונות מימון וביטוח – כל התהליך מתבצע במקום אחד, עם ליווי אישי של נציג מקצועי.', img: at(CUST.length ? CUST : POOL, 2) }
  ]);

  // FAQ
  var FAQ = [
    { q: 'כמה זמן לוקח כל תהליך ההחלפה?', a: 'תהליך ההחלפה עצמו מהיר ופשוט ומתבצע בשיטת "מפתח תמורת מפתח". ברגע שהרכב החדש שלכם יגיע אל מתחם המסירות שלנו (ישירות מהנמל או ממגרש היבואן), נזמין אתכם אלינו. תגיעו עם הרכב הישן ותצאו עם החדש באותו היום בדיוק – בלי להישאר אפילו רגע אחד ללא רכב.' },
    { q: 'אילו מסמכים אני צריך להכין מראש?', a: 'צריך רישיון רכב בתוקף, תעודת זהות של בעל הרכב הרשום, ואם קיים שעבוד או הלוואה – אישור יתרה לסילוק. אם יש מיופה כוח, נדרש ייפוי כוח חתום. הנציג שלנו ילווה אתכם ויעזור להשלים כל מסמך חסר.' },
    { q: 'איך אתם קובעים את שווי הרכב הישן שלי?', a: 'השווי נקבע לפי מחירון השוק, שנתון הרכב, הקילומטראז\', מצב מכני וקוסמטי, היסטוריית הטיפולים וביקוש בשוק לאותו דגם. אנחנו עובדים בשקיפות מלאה ומסבירים לכם בדיוק איך הגענו להצעה.' },
    { q: 'האם אפשר לקבל מחיר מחירון בעסקת טרייד-אין על הרכב שלי?', a: 'במקרים רבים כן. בעסקת טרייד-אין תקבלו הערכת שווי הוגנת, ולעיתים אף גבוהה יותר מהצעות שוק, כי החיסכון שלכם בא לידי ביטוי גם בתנאי הרכב החדש ובמימון.' },
    { q: 'האם אפשר לעשות טרייד-אין על רכב מסחרי, טנדר או ואן עבודה?', a: 'בהחלט. אנחנו מקבלים בטרייד-אין כל סוג רכב – פרטי, יוקרה, מסחרי, טנדר או ואן עבודה. הזינו את מספר הרישוי ונחזור אליכם עם הערכת שווי מותאמת.' },
    { q: 'עדיין יש לי הלוואה פעילה (או שעבוד) על הרכב הישן, אפשר לעשות טרייד-אין?', a: 'כן. נסלק את יתרת ההלוואה או השעבוד מול הגורם המממן כחלק מהעסקה, וההפרש יקוזז מול הרכב החדש. התהליך מתבצע אצלנו מקצה לקצה בלי שתצטרכו להתרוצץ.' },
    { q: 'האם המימון שתציעו לי תופס את מסגרת האשראי בבנק?', a: 'לא. המימון לרכב מתבצע דרך גופי מימון חוץ-בנקאיים ואינו תופס את מסגרת האשראי בחשבון הבנק שלכם. כך תשמרו על מסגרת האשראי פנויה לשימושים אחרים.' }
  ];
  var faq = document.getElementById('tpFaq');
  if (faq) {
    faq.innerHTML = FAQ.map(function (f) {
      return '<div class="tp-faq-item"><button class="tp-faq-q">' + f.q + '<span class="pm"></span></button><div class="tp-faq-a"><p>' + f.a + '</p></div></div>';
    }).join('');
    faq.addEventListener('click', function (e) {
      var q = e.target.closest('.tp-faq-q'); if (!q) return;
      var item = q.parentNode, a = item.querySelector('.tp-faq-a');
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
  }

  // new-car services
  var SERV = [
    { t: 'עסקת טרייד אין דיגיטלית', href: 'trade-in.html', ic: '<path d="M4 17l5-5-5-5M20 7l-5 5 5 5"/>' },
    { t: 'קבלו הלוואה לרכב חדש', href: 'car-loan.html', ic: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>' },
    { t: 'בואו אלינו לפגישה', href: 'contact.html', on: true, ic: '<path d="M4 19h16M6 19V9l6-4 6 4v10M9 13h1M14 13h1"/>' },
    { t: 'דברו איתנו בווטסאפ', href: 'https://wa.me/97237777777', on: true, ic: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/>' },
    { t: 'השוואת סוגי רכבים', href: 'compare.html', ic: '<path d="M12 3v18M6 8l-3 6h6l-3-6ZM18 8l-3 6h6l-3-6Z"/>' },
    { t: 'המומלצים של קפיטל', href: 'models.html', ic: '<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>' }
  ];
  var serv = document.getElementById('tpServices');
  if (serv) serv.innerHTML = SERV.map(function (s) {
    var ext = /^http/.test(s.href) ? ' target="_blank" rel="noopener"' : '';
    return '<a class="tp-serv' + (s.on ? ' on' : '') + '" href="' + s.href + '"' + ext + '>' +
      '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + s.ic + '</svg></span>' +
      '<h3>' + s.t + '</h3><span class="arr">←</span></a>';
  }).join('');

  // contact form
  var f = document.getElementById('tpForm');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    [].slice.call(f.querySelectorAll('input[required]')).forEach(function (inp) { if (!inp.value.trim()) ok = false; });
    if (!ok) return;
    var c = f.parentNode.querySelector('.tp-consent'); if (c) c.style.display = 'none';
    f.outerHTML = '<div class="tp-form-done">תודה! נציג יחזור אליכם בהקדם ✓</div>';
  });
})();
