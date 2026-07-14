/* ============================================================
   Car2Buy — מפרטים מאומתים ידנית לדגמי הראווה (עמוד השוואה).
   ערכים עובדתיים מפורסמים של היצרנים (כוח, תאוצה, מהירות מרבית,
   סוללה/טווח לחשמליים, מושבים, דלתות, הנעה). מחליפים את הערכים
   המשוערים בעמוד ההשוואה כדי שהמדדים המרכזיים יהיו מדויקים.
   כל שדה המופיע כאן מסומן כ"מאומת" (✓) בעמוד ההשוואה.
   ============================================================ */
window.C2B_SPECS = (function () {
  // helper: build an entry and auto-fill its _verified list from the keys provided
  function v(o) { o._verified = Object.keys(o).filter(function (k) { return k[0] !== '_'; }); return o; }
  return {
    'amg-gt':      v({ power: 585, accel: 3.2, topSpeed: 315, seats: 4, doors: 2, drive: 'כפולה' }),
    'amg-c63':     v({ power: 680, accel: 3.4, topSpeed: 280, seats: 5, doors: 4, drive: 'כפולה', battery: 6.1, range: 13 }),
    'amg-e53':     v({ power: 449, accel: 4.5, topSpeed: 250, seats: 5, doors: 4, drive: 'כפולה' }),
    'bmw-m5':      v({ power: 625, accel: 3.3, topSpeed: 305, seats: 5, doors: 4, drive: 'כפולה' }),
    'bmw-m3':      v({ power: 510, accel: 3.5, topSpeed: 290, seats: 5, doors: 4, drive: 'כפולה' }),
    'bmw-m8':      v({ power: 625, accel: 3.2, topSpeed: 305, seats: 4, doors: 2, drive: 'כפולה' }),
    'bmw-i7':      v({ power: 544, accel: 4.7, topSpeed: 240, seats: 5, doors: 4, drive: 'כפולה', battery: 101.7, range: 625 }),
    'bmw-3gt':     v({ power: 258, accel: 6.3, topSpeed: 250, seats: 5, doors: 5, drive: 'אחורית' }),
    'bmw-4':       v({ power: 374, accel: 4.5, topSpeed: 250, seats: 4, doors: 2, drive: 'כפולה' }),
    'audi-rs7':    v({ power: 600, accel: 3.6, topSpeed: 305, seats: 5, doors: 5, drive: 'כפולה' }),
    'audi-rs6':    v({ power: 600, accel: 3.6, topSpeed: 305, seats: 5, doors: 5, drive: 'כפולה' }),
    'etron-gt':    v({ power: 530, accel: 4.1, topSpeed: 245, seats: 4, doors: 4, drive: 'כפולה', battery: 93.4, range: 488 }),
    'tt-rs':       v({ power: 400, accel: 3.7, topSpeed: 280, seats: 4, doors: 2, drive: 'כפולה' }),
    'panamera':    v({ power: 460, accel: 4.4, topSpeed: 295, seats: 4, doors: 4, drive: 'כפולה' }),
    'porsche-911': v({ power: 385, accel: 4.2, topSpeed: 293, seats: 4, doors: 2, drive: 'אחורית' }),
    'model-s':     v({ power: 1020, accel: 2.1, topSpeed: 322, seats: 5, doors: 4, drive: 'כפולה', battery: 100, range: 600 }),
    'model-x':     v({ power: 670, accel: 3.8, topSpeed: 250, seats: 6, doors: 4, drive: 'כפולה', battery: 100, range: 543 }),
    'model-3':     v({ power: 283, accel: 6.1, topSpeed: 201, seats: 5, doors: 4, drive: 'אחורית', battery: 60, range: 513 }),
    'evoque':      v({ power: 249, accel: 7.0, topSpeed: 230, seats: 5, doors: 5, drive: 'כפולה' }),
    'g80':         v({ power: 380, accel: 4.9, topSpeed: 250, seats: 5, doors: 4, drive: 'כפולה' }),
    'giulia':      v({ power: 510, accel: 3.9, topSpeed: 307, seats: 5, doors: 4, drive: 'אחורית' }),
    'mustang':     v({ power: 450, accel: 4.3, topSpeed: 250, seats: 4, doors: 2, drive: 'אחורית' }),
    'camaro':      v({ power: 455, accel: 4.0, topSpeed: 290, seats: 4, doors: 2, drive: 'אחורית' }),
    'ferrari':     v({ power: 620, accel: 3.4, topSpeed: 320, seats: 2, doors: 2, drive: 'אחורית' }),
    'ferrari-sf90':v({ power: 1000, accel: 2.5, topSpeed: 340, seats: 2, doors: 2, drive: 'כפולה', battery: 7.9, range: 25 }),
    'amg-gtr':     v({ power: 585, accel: 3.6, topSpeed: 318, seats: 2, doors: 2, drive: 'אחורית' }),
    'grand-cher':  v({ power: 286, accel: 8.3, topSpeed: 210, seats: 5, doors: 5, drive: 'כפולה' }),
    'lexus-rx':    v({ power: 250, accel: 7.9, topSpeed: 200, seats: 5, doors: 5, drive: 'כפולה' }),
    'granturismo': v({ power: 550, accel: 3.5, topSpeed: 320, seats: 4, doors: 2, drive: 'כפולה' })
  };
})();
