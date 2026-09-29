/* ============================================================
   MOVE ON / Car2Buy — REAL car-page specs. Overrides the demo
   generator: window.Car2Buy.richSpecs now returns real values from the
   MoT WLTP registry (window.MoveOn.govLookup) mapped to the car page's
   field names. Fields the registry lacks return '—' (dropped by the UI).
   Async: returns '—' until the registry answers, then triggers
   window.__c2bRerender() to repaint with real data. Load AFTER
   car-specs.js (to override) and with cmp-gov.js present.
   ============================================================ */
window.Car2Buy = window.Car2Buy || {};
(function () {
  var C = window.Car2Buy;
  var GOV = {}, FETCHING = {};
  var EN_BRAND = { "ב.מ.וו": "BMW", "ב.י.ד": "BYD", "צ'רי": "Chery", "יונדאי": "Hyundai", "ג'אקו": "Jaecoo", "אמ.ג'י": "MG", "שברולט": "Chevrolet", "טויוטה": "Toyota", "מרצדס": "Mercedes", "סמארט": "smart", "קיה": "Kia", "מיצובישי": "Mitsubishi", "סקודה": "Skoda", "זיקר": "Zeekr", "ליפמוטור": "Leapmotor", "אאודי": "Audi", "אווטר": "Avatr", "ניסאן": "Nissan", "סיאט": "Seat", "סיטרואן": "Citroen", "אומודה": "Omoda", "מאזדה": "Mazda", "סקיוואל": "Skywell", "דונפנג": "Dongfeng" };
  function enModel(m) {
    // prefer the site's own Hebrew->English model resolver (car pages pass a Hebrew m.name)
    if (C.enModel && m.name) { var e = C.enModel(m.name); if (e && /[A-Za-z0-9]/.test(e)) return e; }
    var s = (m.nameEn || '').replace(/[֐-׿"'׳״]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    var b = EN_BRAND[m.brand] || ''; if (b) s = s.replace(new RegExp('^' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
    return s.trim();
  }
  var D = '—';
  function richSpecs(m) {
    var key = m.id || m.nameEn || (m.brand + '|' + m.name);
    var g = GOV[key];
    if (g === undefined && !FETCHING[key] && window.MoveOn && window.MoveOn.govLookup) {
      FETCHING[key] = 1;
      var modelEn = enModel(m) || m.name;
      window.MoveOn.govLookup(m.brand, modelEn, m.trim, m.fuel || m.engine || '').then(function (r) {
        GOV[key] = r || null;
        if (typeof window.__c2bRerender === 'function') window.__c2bRerender();
      });
    }
    g = g || {};
    var s = {
      modelName: (m.nameEn ? enModel(m) || m.nameEn : m.name) || m.name, trim: g.trim || m.trim || D,
      category: m.type || D, body: g.body || D, doors: g.doors || D, seats: g.seats || m.seats || D,
      licenseGroup: g.agra ? '✓' : D, licenseFee: D,
      engineType: g.fuel || m.fuel || D, power: g.power || D, engineCC: g.engineCC || D,
      gearbox: g.gearbox || D, drive: D, handbrake: D,
      accel: D, battery: D, range: D, topSpeed: D,
      gross: g.weight || D, curb: D, payload: D,
      length: D, width: D, height: D, wheelbase: D, trunk: D, trunkFolded: D, clearance: D, wheel: D,
      safetyLevel: g.safetyLevel || D, ncap: (g.safetyScore != null ? g.safetyScore : D), airbags: g.airbags || D,
      abs: g.abs || D, esp: g.esp || D, tpms: g.tpms || D, fcw: g.fcw || D, aeb: g.aeb || D, ldw: g.ldw || D,
      tsr: g.tsr || D, autoHigh: g.autoHigh || D, blindSpot: g.blindSpot || D, fatigue: D,
      pedestrian: g.pedestrian || D, isofix: D, adaptiveCruise: g.adaptiveCruise || D, rearCross: D,
      rearAeb: g.rearAeb || D, seatbeltReminder: g.seatbeltReminder || D, speedAssist: g.isa || D,
      pollution: g.pollution || D, co2: g.co2 || D,
      screen: D, cluster: D, bluetooth: D, usb: D, wireless: D, phone: D,
      ac: g.ac || D, windows: g.powerWindows || D, elecSeat: D, upholstery: D, sunroof: D,
      camera: (g.reverseCam === '✓' ? 'מצלמת רוורס' : (g.reverseCam === '✗' ? '✗' : D)), parkSensors: D,
      keyless: D, headlight: D, taillight: D, powerSteer: g.powerSteer || D, autoLights: D, ambient: D, mirrorFold: D, rainSensor: D,
      _verified: g && (g.power || g.safetyLevel || g.abs) ? true : false
    };
    return s;
  }
  C.richSpecs = richSpecs;
})();
