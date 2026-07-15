/* ============================================================
   Car2Buy — מחולל מפרט טכני מלא, משותף לעמוד ההשוואה ולעמוד הרכב.
   הערכים נגזרים דטרמיניסטית מהשדות האמיתיים של הרכב (מחיר, הספק,
   סוג דלק, קטגוריה) עם seed קבוע לפי מזהה הדגם — כך שאותו רכב מציג
   בדיוק את אותם ערכים בכל מקום ובכל טעינה.
   מעליהם ממוזגים נתונים מאומתים: window.C2B_SPECS (model-specs.js)
   ורשות הרישוי (gov-data.js, m._gov) כשקיימים — אלה מסומנים כ"מאומת".
   חושף: window.Car2Buy.richSpecs(model) -> אובייקט מפרט מלא.
   ============================================================ */
window.Car2Buy = window.Car2Buy || {};
(function () {
  var C = window.Car2Buy;
  var enModel = function (n) { return (C.enModel ? C.enModel(n) : n) || n; };

  function seed(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function rnd(m, key, min, max) { return min + (seed(m.id + '|' + key) % (max - min + 1)); }
  function bool(m, key, prob) { return (seed(m.id + '|' + key) % 100) < prob; }
  function pick(m, key, arr) { return arr[seed(m.id + '|' + key) % arr.length]; }
  var YN = function (b) { return b ? '✓' : '✗'; };

  function richSpecs(m) {
    if (m._rs && !m._govDirty) return m._rs;
    m._govDirty = false;
    var fuel = m.fuel || '', ct = (m.cat || '') + ' ' + (m.type || '') + ' ' + (m.name || '');
    var isEV = /חשמלי/.test(fuel), isPHEV = /נטען/.test(fuel), isHEV = /היבריד/.test(fuel) && !isPHEV;
    var body = /sport|קופה|coupe/i.test(ct) ? 'קופה'
      : /sedan|סדאן/i.test(ct) ? 'סדאן'
        : /suv|פנאי|cross|טוסון|טיגו|רקסטון|אאוטלנדר/i.test(ct) ? 'רכב פנאי'
          : (m.list < 130000 ? 'האצ׳בק' : 'קרוסאובר');
    var doors = body === 'קופה' ? 2 : 5;
    var sizeClass = m.list < 120000 ? 'mini' : m.list < 200000 ? 'compact' : m.list < 330000 ? 'mid' : 'large';
    var base = { mini: [3650, 1680, 1550], compact: [4320, 1800, 1580], mid: [4620, 1860, 1650], large: [4900, 1930, 1710] }[sizeClass];
    var length = base[0] + rnd(m, 'len', -70, 130), width = base[1] + rnd(m, 'wid', -35, 55), height = base[2] + rnd(m, 'hgt', -40, 90);
    var wheelbase = length - rnd(m, 'wb', 1430, 1560);
    var trunk = ({ mini: 300, compact: 430, mid: 520, large: 610 }[sizeClass]) + rnd(m, 'trunk', -40, 130);
    var curb = ({ mini: 1200, compact: 1440, mid: 1690, large: 1980 }[sizeClass]) + (isEV ? 260 : 0) + rnd(m, 'curb', -70, 120);
    var gross = curb + rnd(m, 'gr', 270, 430);
    var clearance = /רכב פנאי|קרוסאובר/.test(body) ? rnd(m, 'clr', 170, 205) : rnd(m, 'clr', 128, 156);
    var battery = isEV ? Math.round((42 + (m.power ? m.power / 7 : 18) + rnd(m, 'bat', -4, 10)) * 10) / 10 : isPHEV ? Math.round((16 + rnd(m, 'bat2', 0, 8)) * 10) / 10 : null;
    var range = isEV ? Math.round(250 + (battery - 42) * 7 + rnd(m, 'rng', -20, 60)) : isPHEV ? rnd(m, 'erng', 60, 95) : null;
    var topSpeed = isEV ? rnd(m, 'ts', 150, 185) : Math.round(168 + (m.power || 120) * 0.28 + rnd(m, 'ts2', -8, 14));
    var wheel = ({ mini: 16, compact: 17, mid: 18, large: 19 }[sizeClass]) + (bool(m, 'wheel', 30) ? 1 : 0);
    var s = {
      modelName: enModel(m.name), trim: m.trim || '—', category: m.type || '—', body: body, doors: doors, seats: m.seats || 5,
      licenseGroup: '✓', licenseFee: pick(m, 'lic', ['₪1,372', '₪1,506', '₪1,798', '₪2,190']),
      engineType: fuel, accel: m.accel, battery: battery, power: m.power, topSpeed: topSpeed,
      gearbox: isEV ? 'רדוקציה' : pick(m, 'gb', ['אוטומטית 7 הילוכים', 'אוטומטית 8 הילוכים', 'רובוטית DCT', 'טיפטרוניק 6 הילוכים']),
      drive: m.drive, range: range, engineCC: isEV ? null : pick(m, 'cc', [1197, 1332, 1498, 1598, 1798, 1984]),
      handbrake: 'בלם חניה חשמלי',
      abs: '✓', esp: '✓', tpms: '✓', fcw: YN(bool(m, 'fcw', 92)), aeb: YN(bool(m, 'aeb', 90)), ldw: YN(bool(m, 'ldw', 88)),
      tsr: YN(bool(m, 'tsr', 72)), autoHigh: YN(bool(m, 'ahb', 62)), blindSpot: YN(bool(m, 'bsm', 55)),
      fatigue: YN(bool(m, 'fat', 80)), pedestrian: YN(bool(m, 'ped', 82)), isofix: '✓', adaptiveCruise: YN(bool(m, 'acc', 66)),
      rearCross: YN(bool(m, 'rct', 45)), rearAeb: YN(bool(m, 'raeb', 25)), seatbeltReminder: '✓', speedAssist: YN(bool(m, 'isa', 78)),
      ncap: bool(m, 'ncap', 80) ? '5' : (bool(m, 'ncap4', 70) ? '4' : '—'), safetyLevel: rnd(m, 'sl', 5, 8), airbags: rnd(m, 'ab', 6, 8),
      length: length, width: width, height: height, wheelbase: wheelbase, trunk: trunk, trunkFolded: trunk + rnd(m, 'tf', 620, 780),
      curb: curb, gross: gross, payload: gross - curb, clearance: clearance, wheel: wheel,
      screen: pick(m, 'scr', ['10.1', '10.25', '12.3', '12.8', '15.6']), cluster: pick(m, 'cl', ['7', '10.25', '12.3']),
      bluetooth: '✓', usb: '✓', wireless: YN(bool(m, 'wc', 42)),
      phone: bool(m, 'cp', 86) ? 'אפל קארפליי ואנדרואיד אוטו' : '—',
      ac: pick(m, 'ac', ['בקרת אקלים', 'בקרת אקלים דו-אזורית', 'מיזוג ידני']),
      elecSeat: YN(bool(m, 'es', 46)), upholstery: bool(m, 'up', 52) ? 'עור סינטטי' : 'בד',
      sunroof: YN(bool(m, 'sr', 36)), camera: bool(m, '360', 32) ? 'מצלמת 360°' : 'מצלמת רוורס',
      parkSensors: '✓', keyless: bool(m, 'kl', 84) ? 'מפתח חכם' : 'מפתח רגיל',
      taillight: 'לד', headlight: bool(m, 'hl', 58) ? 'לד' : 'הלוגן', powerSteer: '✓', autoLights: YN(bool(m, 'al', 90)),
      ambient: YN(bool(m, 'amb', 40)), windows: 4, mirrorFold: YN(bool(m, 'mf', 60)), rainSensor: YN(bool(m, 'rs', 58))
    };
    // merge verified overrides: hand-curated model-specs (C2B_SPECS) then Ministry of Transport registry (m._gov)
    var over = (window.C2B_SPECS && window.C2B_SPECS[m.id]) || null;
    if (over && !m._gov) { m._gov = over; }
    var g = m._gov;
    if (g) { for (var k in g) { if (k[0] !== '_') s[k] = g[k]; } s._verified = g._verified || []; }
    else s._verified = [];
    m._rs = s; return s;
  }

  C.richSpecs = richSpecs;
})();
