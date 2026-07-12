/* ============================================================
   Car2Buy — calculator page content (self-contained).
   Populates why-cards, affect-columns, tips image, FAQ + CTA
   imagery from the real inventory image pool.
   ============================================================ */
(function () {
  var C2B = window.Car2Buy;
  if (!C2B || !document.getElementById('cxFaqList')) return;
  var MODELS = C2B.MODELS || [];
  var POOL = MODELS.map(function (m) { return m.img; }).filter(Boolean);
  var at = function (i) { return POOL.length ? POOL[i % POOL.length] : ''; };
  function bg(id, i) { var el = document.getElementById(id); if (el && at(i)) el.style.backgroundImage = 'url(' + at(i) + ')'; }
  bg('cxBand1Bg', 5); bg('cxBand2Bg', 17); bg('cxTipsBg', 24); bg('cxCtaBg', 31);

  var WHY = [
    { t: 'תכנון תקציב חכם', b: 'המחשבון מאפשר לכם לדעת מראש כמה תשלמו בכל חודש, כדי שתוכלו לתכנן את התקציב המשפחתי בביטחון ולבחור רכב שמתאים ליכולת ההחזר שלכם — בלי הפתעות.' },
    { t: 'שקיפות מלאה', b: 'תוכלו לראות בבירור את סכום המימון, מספר התשלומים וסך כל ההחזרים לאורך כל התקופה. הכול גלוי ומחושב מראש, כדי שתקבלו החלטה מושכלת.' },
    { t: 'השוואה חכמה בין תרחישים', b: 'הזיזו את המחוונים ובדקו איך תקופת מימון קצרה או ארוכה יותר משפיעה על ההחזר החודשי — וכך תבחרו את <a href="car-loan.html">מסלול המימון</a> שהכי משתלם עבורכם.' }
  ];
  var whyList = document.getElementById('cxWhyList');
  if (whyList) whyList.innerHTML = WHY.map(function (w, i) {
    return '<div class="cx-why-card"><div><h3>' + w.t + '</h3><p>' + w.b + '</p></div>' +
      '<div class="cx-why-img"><img loading="lazy" src="' + at(i * 6 + 2) + '" alt="' + w.t + '" onerror="this.closest(\'.cx-why-img\').style.display=\'none\'"></div></div>';
  }).join('');

  var COLS = [
    { ic: '<path d="M4 15a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4M6 15v3M18 15v3"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/>', t: 'סכום המימון', b: 'ככל שסכום המימון מתוך מחיר הרכב גבוה יותר, כך יגדל ההחזר החודשי. מקדמה גבוהה מקטינה אותו.' },
    { ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', t: 'מספר התשלומים', b: 'פריסה על יותר תשלומים מקטינה את ההחזר החודשי, אך מגדילה את סך הריבית שתשלמו לאורך התקופה.' },
    { ic: '<path d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5"/>', t: 'גובה הריבית', b: 'הריבית השנתית נקבעת לפי גוף המימון ונתוני הלקוח. במחשבון מוצגת ריבית משוערת של 3.9% לצורך הדגמה.' },
    { ic: '<path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5M5 13h14v5H5zM7.5 16h.01M16.5 16h.01"/>', t: 'מקדמה / טרייד-אין', b: '<a href="trade-in.html">עסקת טרייד-אין</a> על הרכב הישן או מקדמה מקטינות את סכום המימון ואת ההחזר החודשי.' }
  ];
  var cols = document.getElementById('cxCols');
  if (cols) cols.innerHTML = COLS.map(function (c) {
    return '<div class="cx-col"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + c.ic + '</svg></div>' +
      '<h3>' + c.t + '</h3><p>' + c.b + '</p></div>';
  }).join('');

  var tipsImg = document.getElementById('cxTipsImg');
  if (tipsImg) tipsImg.innerHTML = '<img loading="lazy" src="' + at(12) + '" alt="טיפים למימון רכב" onerror="this.closest(\'.cx-tips-img\').style.display=\'none\'">';

  var FAQ = [
    { q: 'האם ההחזר החודשי שמוצג הוא סופי?', a: 'לא. ההחזר החודשי במחשבון הוא הערכה בלבד לצורך התרשמות. ההצעה הסופית נתפרת אישית מולכם וכפופה לאישור גוף מימון, נתוני הלקוח וזמינות הרכב במלאי.' },
    { q: 'לפי איזו ריבית מחושב ההחזר?', a: 'המחשבון מציג חישוב לפי ריבית שנתית משוערת של 3.9%. הריבית בפועל עשויה להשתנות בהתאם לגוף המימון, לפרופיל הלקוח ולתקופת ההחזר.' },
    { q: 'מהי תקופת המימון המומלצת?', a: 'אין תשובה אחת — תקופה קצרה חוסכת בריבית הכוללת אך מייקרת את ההחזר החודשי, ותקופה ארוכה עושה את ההפך. בחרו את האיזון שנוח לתקציב שלכם.' },
    { q: 'האם אפשר לממן 100% ממחיר הרכב?', a: 'במקרים רבים כן, בכפוף לאישור גוף המימון. מקדמה או עסקת טרייד-אין יכולות לשפר את תנאי העסקה ולהקטין את ההחזר החודשי.' },
    { q: 'האם אפשר לסלק את ההלוואה מוקדם?', a: 'ברוב מסלולי המימון ניתן לפרוע את יתרת ההלוואה בפירעון מוקדם. ייתכנו עמלות בהתאם לתנאי גוף המימון — נשמח להסביר לכם את כל הפרטים.' },
    { q: 'מה ההבדל בין מימון רגיל למימון בלון?', a: 'במימון רגיל משלמים החזר חודשי קבוע עד סילוק מלא. במימון בלון ההחזר החודשי נמוך יותר ובסוף התקופה נותר תשלום גדול אחד. יועצי Car2Buy יעזרו לכם לבחור את המסלול המתאים.' }
  ];
  var faqList = document.getElementById('cxFaqList');
  if (faqList) {
    faqList.innerHTML = FAQ.map(function (f) {
      return '<div class="cx-faq-item"><button class="cx-faq-q">' + f.q + '<span class="pm"></span></button>' +
        '<div class="cx-faq-a"><p>' + f.a + '</p></div></div>';
    }).join('');
    faqList.addEventListener('click', function (e) {
      var q = e.target.closest('.cx-faq-q'); if (!q) return;
      var item = q.parentNode, a = item.querySelector('.cx-faq-a');
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
  }
})();
