/* ============================================================
   MOVE ON — spec mapper for the compare tool. NO fabricated data:
   every technical field comes from the real MoT WLTP catalog
   (window.MoveOn.govLookup → m._gov). Price/monthly/down come from the
   real inventory. Fields with no registry match render "—".
   Exposes window.MoveOn.richSpecs(model).
   ============================================================ */
window.MoveOn = window.MoveOn || {};
(function () {
  function richSpecs(m) {
    var g = m._gov || {};
    var s = {
      body: g.body || '—', doors: g.doors, seats: g.seats || m.seats || null, trim: g.trim || m.trim || '—', agra: g.agra || null,
      fuel: g.fuel || m.fuel || '—', power: g.power || null, engineCC: g.engineCC || null, weight: g.weight || null,
      gearbox: g.gearbox || '—', tow: g.tow || null,
      safetyLevel: g.safetyLevel || null, safetyScore: (g.safetyScore != null ? g.safetyScore : null), airbags: g.airbags || null,
      abs: g.abs || '—', esp: g.esp || '—', tpms: g.tpms || '—', ldw: g.ldw || '—', fcw: g.fcw || '—', blindSpot: g.blindSpot || '—',
      adaptiveCruise: g.adaptiveCruise || '—', pedestrian: g.pedestrian || '—', brakeAssist: g.brakeAssist || '—', aeb: g.aeb || '—',
      twoWheel: g.twoWheel || '—', tsr: g.tsr || '—', autoHigh: g.autoHigh || '—', fcwAlert: g.fcwAlert || '—',
      seatbeltReminder: g.seatbeltReminder || '—', rearAeb: g.rearAeb || '—', isa: g.isa || '—',
      pollution: g.pollution || null, green: (g.green != null ? g.green : null), co2: g.co2 || null,
      ac: g.ac || '—', powerWindows: g.powerWindows || null, reverseCam: g.reverseCam || '—', powerSteer: g.powerSteer || '—', alloy: g.alloy || '—',
      govYear: g.govYear || null,
      _verified: g._verified ? true : false
    };
    return s;
  }
  window.MoveOn.richSpecs = richSpecs;
})();
