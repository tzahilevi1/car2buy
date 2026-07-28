/* ============================================================
   Car2Buy — model galleries for the יד 2 (used) inventory.
   Real exterior+interior photos (scraped per MODEL) used as a
   fallback when a specific car has no photos of its own in the
   Google Sheet ("תמונת הרכב 1/2/3").
   Render priority:  the car's sheet photos → this model gallery → branded placeholder.
   Key = "<English brand>|<model name exactly as in the sheet>".
   Only folders that actually exist are listed here.
   ============================================================ */
(function () {
  if (!window.Car2Buy) return;
  var P = 'images/gallery/';
  // full set: 4 exterior + 2 interior
  function g(folder) {
    return [P + folder + '/ext1.jpg', P + folder + '/ext2.jpg', P + folder + '/ext3.jpg',
            P + folder + '/ext4.jpg', P + folder + '/int5.jpg', P + folder + '/int6.jpg'];
  }
  // partial set: explicit file list (model had fewer usable shots)
  function gp(folder, files) { return files.map(function (f) { return P + folder + '/' + f; }); }

  var G = {
    'Audi|A3': g('used-audi-a3'),
    'BMW|X2': g('used-bmw-x2'),
    'BMW|X5': g('used-bmw-x5'),
    'BMW|סדרה 3': g('used-bmw-3'),
    'BYD|ATTO 3': g('used-byd-atto3'),
    'Chery|TIGGO 7 Pro': g('used-chery-tiggo7'),
    'Chevrolet|בלייזר': g('used-chevy-blazer'),
    'Citroen|ברלינגו החדשה': g('used-citroen-berlingo'),
    'Hyundai|טוסון': g('used-hyundai-tucson'),
    'Jeep|קומפאס': g('used-jeep-compass'),
    'Kia|סורנטו': g('used-kia-sorento'),
    'Kia|פיקנטו': g('used-kia-picanto'),
    'Mercedes|S-Class': g('used-mercedes-s'),
    'Mitsubishi|אאוטלנדר': g('used-mitsu-outlander'),
    'Nissan|אקס טרייל': g('used-nissan-xtrail'),
    'Peugeot|2008': g('used-peugeot-2008'),
    'Skoda|קודיאק': g('used-skoda-kodiaq'),
    'Tesla|דגם 3': g('used-tesla-3'),
    'Toyota|לנד קרוזר ארוך': g('used-toyota-landcruiser'),
    'Toyota|קורולה קרוס': g('used-toyota-corolla-cross'),
    'Volkswagen|פאסאט': g('used-vw-passat'),
    // partial galleries
    'Isuzu|2X4 D-MAX': gp('used-isuzu-dmax', ['ext1.jpg', 'ext2.jpg', 'ext3.jpg', 'ext4.jpg']),
    'Isuzu|4X4 D-MAX': gp('used-isuzu-dmax', ['ext1.jpg', 'ext2.jpg', 'ext3.jpg', 'ext4.jpg']),
    'Mercedes|EQC': gp('used-mercedes-eqc', ['ext2.jpg', 'ext3.jpg', 'ext4.jpg']),
    'Nissan|קשקאי': gp('used-nissan-qashqai', ['ext1.jpg', 'ext2.jpg', 'ext3.jpg', 'ext4.jpg']),
    'Peugeot|3008': gp('used-peugeot-3008', ['ext1.jpg', 'ext2.jpg', 'ext4.jpg', 'int5.jpg', 'int6.jpg'])
  };

  window.Car2Buy.USED_GALLERIES = G;

  // ===== תמונות אמיתיות פר-רכב, לפי מספר רישוי (plate) =====
  // מקור: תיקיות Drive לפי רישוי → הורדו והוקטנו ל-images/used/<רישוי>/.
  // סדר מוקפד: hero חיצוני קדמי → זוויות חוץ → פנים.
  var UP = 'images/used/';
  var PLATE_PHOTOS = {
    '510-75-503': ['510-75-503/2.webp', '510-75-503/4.webp', '510-75-503/3.webp', '510-75-503/1.webp'],           // מאזדה 6
    '60-555-81':  ['60-555-81/3.webp', '60-555-81/5.webp', '60-555-81/1.webp', '60-555-81/4.webp', '60-555-81/6.webp', '60-555-81/2.webp'], // מרצדס S500
    '636-96-803': ['636-96-803/1.webp', '636-96-803/7.webp', '636-96-803/2.webp', '636-96-803/3.webp', '636-96-803/4.webp', '636-96-803/5.webp', '636-96-803/6.webp', '636-96-803/8.webp', '636-96-803/9.webp'] // BYD Tang
  };
  Object.keys(PLATE_PHOTOS).forEach(function (k) { PLATE_PHOTOS[k] = PLATE_PHOTOS[k].map(function (f) { return UP + f; }); });
  window.Car2Buy.USED_PLATE_PHOTOS = PLATE_PHOTOS;

  // gallery for a used car: real per-car photos (by plate) → its own sheet photos → model gallery
  window.Car2Buy.usedGallery = function (u) {
    if (u && u.plate && PLATE_PHOTOS[u.plate]) return PLATE_PHOTOS[u.plate];
    if (u && u.gallery && u.gallery.length) return u.gallery;
    return (u && G[u.brand + '|' + u.name]) || [];
  };
})();
