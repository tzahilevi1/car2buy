/* ============================================================
   Car2Buy — real marketed inventory (from the live ops sheet).
   m = monthly repayment at 60% financing (₪). p = price (₪).
   Exposed as window.Car2Buy.LOAN_CARS.
   ============================================================ */
(function () {
  window.Car2Buy = window.Car2Buy || {};
  var I = 'https://www.icar.co.il/_media/images/models/bgremoval/';
  var C = [
    // BYD
    { brand:'ב.י.ד', name:'אטו 2', trim:'Boost', m:1580, p:152300, img:I+'byd-atto2-new.jpg' },
    { brand:'ב.י.ד', name:'סיל 5 DM-i', trim:'Comfort', m:1803, p:177384, img:I+'byd-seal-5-new.jpg' },
    { brand:'ב.י.ד', name:'סיל U', trim:'PHEV Design 4x4', m:2450, p:237712, img:I+'byd-seal-u-new.jpg' },
    { brand:'ב.י.ד', name:'סיל U', trim:'DM-i Comfort', m:2235, p:217712, img:I+'byd-seal-u-new.jpg' },
    { brand:'ב.י.ד', name:'סיל U', trim:'DM-i Boost', m:2074, p:202712, img:I+'byd-seal-u-new.jpg' },
    { brand:'ב.י.ד', name:'סיליון 5', trim:'Design DM-i', m:1770, p:174384, img:I+'byd-sealion-5-new.jpg' },
    { brand:'ב.י.ד', name:'סיליון 5', trim:'Comfort DM-i', m:1717, p:169384, img:I+'byd-sealion-5-new.jpg' },
    // Jaecoo
    { brand:"ג'אקו", name:'ג\'אקו 8', trim:'Limited PHEV', m:2676, p:258796, img:I+'jaecoo-8-new.jpg' },
    { brand:"ג'אקו", name:'ג\'אקו 8', trim:'Luxury PHEV', m:2396, p:232712, img:I+'jaecoo-8-new.jpg' },
    { brand:"ג'אקו", name:'ג\'אקו 7', trim:'Luxury PHEV', m:2107, p:205712, img:I+'jaecoo-7-new.jpg' },
    { brand:"ג'אקו", name:'ג\'אקו 5', trim:'Premium HEV', m:1583, p:156930, img:I+'jaecoo-5-new.jpg' },
    { brand:"ג'אקו", name:'ג\'אקו 5', trim:'Luxury HEV', m:1684, p:166294, img:I+'jaecoo-5-new.jpg' },
    { brand:"ג'אקו", name:'ג\'אקו 5 חשמלי', trim:'Luxury EV', m:1718, p:161796, img:I+'jaecoo-5-new.jpg' },
    // Chery
    { brand:"צ'רי", name:'טיגו 8 פרו', trim:'PHEV Noble', m:2074, p:202712, img:I+'chery-tiggo-8-pro-new.jpg' },
    { brand:"צ'רי", name:'טיגו 4', trim:'Comfort HEV', m:1388, p:138697, img:I+'chery-tiggo-4-pro-new.jpg' },
    { brand:"צ'רי", name:'טיגו 7 פרו', trim:'PHEV Luxury', m:1856, p:182384, img:I+'chery-tiggo-7-pro-new.jpg' },
    { brand:"צ'רי", name:'טיגו 9 פרו נובל', trim:'PHEV Noble', m:2569, p:248796, img:I+'chery-tiggo-8-pro-new.jpg' },
    { brand:"צ'רי", name:'טיגו 9 לקשרי', trim:'PHEV Lux', m:2400, p:220712, img:I+'chery-tiggo-8-pro-new.jpg' },
    { brand:"צ'רי", name:'FX EV', trim:'Sense TT', m:1605, p:161066, img:I+'chery-fx-new.jpg' },
    { brand:"צ'רי", name:'FX', trim:'Comfort', m:1563, p:155020, img:I+'chery-fx-new.jpg' },
    // Hyundai
    { brand:'יונדאי', name:'טוסון', trim:'Premium Turbo', m:1992, p:191316, img:I+'hyundai-tucson-new.jpg' },
    { brand:'יונדאי', name:'טוסון', trim:'Executive Hybrid', m:2213, p:215622, img:I+'hyundai-tucson-new.jpg' },
    { brand:'יונדאי', name:'וניו', trim:'Prime', m:1634, p:131697, img:I+'hyundai-venue-new.jpg' },
    { brand:'יונדאי', name:'סונטה', trim:'Luxury Hybrid', m:2289, p:222712, img:I+'hyundai-sonata-new.jpg' },
    { brand:'יונדאי', name:'סונטה', trim:'Limited Hybrid', m:2450, p:237712, img:I+'hyundai-sonata-new.jpg' },
    { brand:'יונדאי', name:'אלנטרה', trim:'Premium Hybrid', m:1835, p:180384, img:I+'hyundai-elantra-new.jpg' },
    { brand:'יונדאי', name:'קונה', trim:'Premium Hybrid', m:1824, p:179384, img:I+'hyundai-kona-new.jpg' },
    // Toyota
    { brand:'טויוטה', name:'יאריס קרוס', trim:'Eco HSD', m:1627, p:161020, img:I+'toyota-yaris-cross-new.jpg' },
    { brand:'טויוטה', name:'יאריס קרוס', trim:'אורבן', m:2291, p:171930, img:I+'toyota-yaris-cross-new.jpg' },
    { brand:'טויוטה', name:'יאריס', trim:'Comfort', m:1530, p:151930, img:I+'toyota-yaris-new.jpg' },
    { brand:'טויוטה', name:'C-HR', trim:'Flow', m:1952, p:196622, img:I+'toyota-c-hr-new.jpg' },
    // Leapmotor
    { brand:'ליפמוטור', name:'C10', trim:'Life', m:1912, p:187622, img:I+'leapmotor-c10-new.jpg' },
    { brand:'ליפמוטור', name:'C10', trim:'Design', m:1966, p:192622, img:I+'leapmotor-c10-new.jpg' },
    // Kia
    { brand:'קיה', name:'סלטוס', trim:'LX', m:1694, p:167294, img:I+'kia-seltos-new.jpg' },
    { brand:'קיה', name:'פיקנטו', trim:'LX Plus', m:1094, p:111272, img:I+'kia-picanto-new.jpg' },
    { brand:'קיה', name:'נירו', trim:'HEV LX', m:1845, p:181294, img:I+'kia-niro-new.jpg' },
    // Mitsubishi
    { brand:'מיצובישי', name:'אקליפס קרוס', trim:'Intense', m:1695, p:167384, img:I+'mitsubishi-eclipse-cross-new.jpg' },
    { brand:'מיצובישי', name:'אאוטלנדר', trim:'Executive', m:2128, p:207712, img:I+'mitsubishi-outlander-new.jpg' },
    { brand:'מיצובישי', name:'אאוטלנדר', trim:'InStyle', m:2109, p:213712, img:I+'mitsubishi-outlander-new.jpg' },
    // MG
    { brand:"אמ.ג'י", name:'EHS', trim:'Luxury PHEV', m:1955, p:191610, img:I+'mg-hs-new.jpg' },
    { brand:"אמ.ג'י", name:'HS', trim:'Hybrid+ Luxury', m:1827, p:179610, img:I+'mg-hs-new.jpg' },
    { brand:"אמ.ג'י", name:'ZS', trim:'Luxury Hybrid', m:1594, p:157918, img:I+'mg-zs-new.jpg' },
    { brand:"אמ.ג'י", name:'MG 3', trim:'Luxury Hybrid', m:1290, p:129595, img:I+'mg-3-new.jpg' },
    { brand:"אמ.ג'י", name:'S9', trim:'Comfort', m:1990, p:192610, img:I+'mg-s9-new.jpg' },
    // Škoda
    { brand:'סקודה', name:'סופרב', trim:'L&K 4x4', m:2992, p:288296, img:I+'skoda-superb-new.jpg' },
    { brand:'סקודה', name:'קאמיק', trim:'Selection', m:1450, p:144520, img:I+'skoda-kamiq-new.jpg' },
    { brand:'סקודה', name:'אוקטביה', trim:'Selection', m:1695, p:167316, img:I+'skoda-octavia-new.jpg' },
    // KGM / Avatr
    { brand:"קיי.ג'י.אם", name:'רקסטון', trim:'EX', m:2289, p:222712, img:I+'kgm-torres-new.jpg' },
    { brand:'אווטר', name:'אווטר 11', trim:'Ultra RWD', m:3050, p:293706, img:I+'avatr-11-new.jpg' },
    // Nissan / SEAT / Citroën / Omoda
    { brand:'ניסאן', name:"ג'וק", trim:'Hybrid Acenta', m:1649, p:163020, img:I+'nissan-juke-new.jpg' },
    { brand:'ניסאן', name:'קשקאי', trim:'Acenta', m:1890, p:183874, img:I+'nissan-qashqai-new.jpg' },
    { brand:'סיאט', name:'ארונה', trim:'Style', m:1344, p:134607, img:I+'seat-arona-new.jpg' },
    { brand:'סיטרואן', name:'ברלינגו', trim:'Shine Pack', m:1827, p:179384, img:I+'citroen-berlingo-new.jpg' },
    { brand:'אומודה', name:'אומודה 7', trim:'PHEV Harmony', m:1990, p:192622, img:I+'omoda-7-new.jpg' },
    // Chevrolet / GMC
    { brand:'שברולט', name:'סילברדו EV', trim:'8WT', m:2138, p:320000, img:I+'chevrolet-silverado-ev-new.jpg' },
    { brand:'שברולט', name:'סילברדו EV', trim:'LT Premium', m:2791, p:345000, img:I+'chevrolet-silverado-ev-new.jpg' },
    { brand:'GMC', name:'GMC', trim:'AT4', m:3710, p:410000, img:I+'chevrolet-silverado-ev-new.jpg' },
    { brand:'GMC', name:'GMC', trim:'Denali', m:3710, p:420000, img:I+'chevrolet-silverado-ev-new.jpg' },
    // BMW
    { brand:'ב.מ.וו', name:'X1', trim:'M Design', m:2890, p:299900, img:I+'bmw-x1-new.jpg' },
    { brand:'ב.מ.וו', name:'X1', trim:'M Sport', m:3100, p:309900, img:I+'bmw-x1-new.jpg' },
    { brand:'ב.מ.וו', name:'iX1', trim:'M-Sport', m:2990, p:320000, img:I+'bmw-ix1-new.jpg' },
    { brand:'ב.מ.וו', name:'X2', trim:'Style', m:3290, p:320000, img:I+'bmw-x2-new.jpg' },
    { brand:'ב.מ.וו', name:'X4', trim:'20i M-Sport', m:4790, p:469000, img:I+'bmw-x4-new.jpg' },
    { brand:'ב.מ.וו', name:'X5', trim:'30d', m:7398, p:711000, img:I+'bmw-x5-new.jpg' },
    { brand:'ב.מ.וו', name:'216', trim:'Grande Coupé M Design', m:2795, p:289900, img:I+'bmw-2-series-new.jpg' },
    { brand:'ב.מ.וו', name:'530e', trim:'M Sport', m:5531, p:525000, img:I+'bmw-5-series-new.jpg' },
    { brand:'ב.מ.וו', name:'420i', trim:'Style', m:3982, p:399000, img:I+'bmw-4-series-new.jpg' },
    // Mazda / Zeekr / Subaru
    { brand:'מאזדה', name:'CX-5', trim:'Executive', m:2013, p:197000, img:I+'mazda-cx5-new.jpg' },
    { brand:'זיקר', name:'זיקר X', trim:'Beyond', m:1931, p:189384, img:I+'zeekr-x-new.jpg' },
    { brand:'זיקר', name:'זיקר 001', trim:'Long Range', m:3054, p:294000, img:I+'zeekr-001-new.jpg' },
    { brand:'זיקר', name:'זיקר 001', trim:'Krypton', m:3708, p:355000, img:I+'zeekr-001-new.jpg' },
    { brand:'זיקר', name:'זיקר 7X', trim:'Krypton', m:3054, p:294000, img:I+'zeekr-7x-new.jpg' },
    { brand:'זיקר', name:'זיקר 7X', trim:'Long Range', m:2742, p:265000, img:I+'zeekr-7x-new.jpg' },
    { brand:'זיקר', name:'זיקר 7X', trim:'Essence', m:2442, p:237000, img:I+'zeekr-7x-new.jpg' },
    { brand:'סובארו', name:'קרוסטרק', trim:'Luxury', m:1823, p:179294, img:I+'subaru-crosstrek-new.jpg' },
    // Mercedes
    { brand:'מרצדס', name:'GLA 200', trim:'Icon', m:3699, p:365000, img:I+'mercedes-gla-new.jpg' },
    { brand:'מרצדס', name:'GLC 200', trim:'Coupé Sport', m:4806, p:479000, img:I+'mercedes-glc-new.jpg' },
    { brand:'מרצדס', name:'GLC 300 קופה', trim:'AMG Line', m:5724, p:559000, img:I+'mercedes-glc-new.jpg' },
    { brand:'מרצדס', name:'CLA 200', trim:"Signature AMG Line", m:3999, p:409900, img:I+'mercedes-cla-new.jpg' },
    // Smart / Voyah / Skywell
    { brand:'סמארט', name:'סמארט #5', trim:'Pro', m:2396, p:232712, img:I+'smart-5-new.jpg' },
    { brand:'סמארט', name:'סמארט #5', trim:'Pro+', m:2730, p:263796, img:I+'smart-5-new.jpg' },
    { brand:'סמארט', name:'סמארט #5', trim:'Premium', m:2944, p:283796, img:I+'smart-5-new.jpg' },
    { brand:'סמארט', name:'סמארט #5', trim:'Brabus', m:3159, p:303796, img:I+'smart-5-new.jpg' },
    { brand:'וויה', name:'Free', trim:'Free', m:2741, p:325000, img:I+'voyah-free-new.jpg' },
    { brand:'סקיוואל', name:'Pro GT', trim:'Pro GT', m:1990, p:194900, img:I+'skywell-et5-new.jpg' },
    // Audi
    { brand:'אאודי', name:'Q3 ספורטבק', trim:'35 TFSI Design', m:3490, p:345000, img:I+'audi-q3-sportback-new.jpg' },
    { brand:'אאודי', name:'A3 ספורטבק', trim:'S Line Lux', m:2999, p:290000, img:I+'audi-a3-new.jpg' }
  ];
  C.forEach(function (c, i) { c.id = 'c' + i; });

  // ---- real photo galleries per model (exterior + interior) — one gallery serves all trims of a model ----
  // helper: 4 exterior + 2 interior files named ext1..ext4, int5..int6 under images/gallery/<folder>/
  function g6(folder) { return ['images/gallery/' + folder + '/ext1.jpg', 'images/gallery/' + folder + '/ext2.jpg', 'images/gallery/' + folder + '/ext3.jpg', 'images/gallery/' + folder + '/ext4.jpg', 'images/gallery/' + folder + '/int5.jpg', 'images/gallery/' + folder + '/int6.jpg']; }
  var GALLERIES = {
    "אמ.ג'י|MG 3": ['images/gallery/mg3/mg3-front.jpg', 'images/gallery/mg3/mg3-side.jpg', 'images/gallery/mg3/mg3-grille.jpg', 'images/gallery/mg3/mg3-wheel.jpg', 'images/gallery/mg3/mg3-interior-seats.jpg', 'images/gallery/mg3/mg3-interior-screen.jpg'],
    "ב.י.ד|אטו 2": g6('byd-atto2'),
    "ב.י.ד|סיל 5 DM-i": g6('byd-seal5'),
    "ב.י.ד|סיל U": g6('byd-sealu'),
    "ב.י.ד|סיליון 5": g6('byd-sealion5'),
    "צ'רי|טיגו 8 פרו": g6('chery-tiggo8'),
    "צ'רי|טיגו 4": g6('chery-tiggo4'),
    "צ'רי|טיגו 7 פרו": ["images/gallery/chery-tiggo7/ext2.jpg","images/gallery/chery-tiggo7/ext3.jpg","images/gallery/chery-tiggo7/ext4.jpg","images/gallery/chery-tiggo7/int5.jpg","images/gallery/chery-tiggo7/int6.jpg"],
    "צ'רי|טיגו 9 פרו נובל": g6('chery-tiggo9'),
    "צ'רי|טיגו 9 לקשרי": g6('chery-tiggo9'),
    "יונדאי|טוסון": g6('hyundai-tucson'),
    "יונדאי|וניו": g6('hyundai-venue'),
    "יונדאי|סונטה": g6('hyundai-sonata'),
    "יונדאי|אלנטרה": g6('hyundai-elantra'),
    "יונדאי|קונה": g6('hyundai-kona'),
    "טויוטה|C-HR": g6('toyota-chr'),
    "קיה|סלטוס": g6('kia-seltos'),
    "קיה|פיקנטו": g6('kia-picanto'),
    "קיה|נירו": ["images/gallery/kia-niro/ext1.jpg","images/gallery/kia-niro/ext2.jpg","images/gallery/kia-niro/ext3.jpg","images/gallery/kia-niro/ext4.jpg"],
    "מיצובישי|אקליפס קרוס": ["images/gallery/mitsubishi-eclipsecross/ext1.jpg","images/gallery/mitsubishi-eclipsecross/ext2.jpg","images/gallery/mitsubishi-eclipsecross/ext3.jpg","images/gallery/mitsubishi-eclipsecross/int5.jpg","images/gallery/mitsubishi-eclipsecross/int6.jpg"],
    "מיצובישי|אאוטלנדר": g6('mitsubishi-outlander'),
    "אמ.ג'י|HS": g6('mg-hs'),
    "אמ.ג'י|EHS": g6('mg-hs'),
    "אמ.ג'י|ZS": g6('mg-zs'),
    "ניסאן|ג'וק": g6('nissan-juke'),
    "ניסאן|קשקאי": ["images/gallery/nissan-qashqai/ext1.jpg","images/gallery/nissan-qashqai/ext2.jpg","images/gallery/nissan-qashqai/ext3.jpg","images/gallery/nissan-qashqai/ext4.jpg"],
    "מאזדה|CX-5": g6('mazda-cx5'),
"ב.מ.וו|X1": ["images/gallery/bmw-x1/ext1.jpg","images/gallery/bmw-x1/ext2.jpg","images/gallery/bmw-x1/ext3.jpg","images/gallery/bmw-x1/ext4.jpg","images/gallery/bmw-x1/int5.jpg","images/gallery/bmw-x1/int6.jpg"],
    "ב.מ.וו|iX1": ["images/gallery/bmw-ix1/ext1.jpg","images/gallery/bmw-ix1/ext2.jpg","images/gallery/bmw-ix1/ext3.jpg","images/gallery/bmw-ix1/ext4.jpg","images/gallery/bmw-ix1/int5.jpg","images/gallery/bmw-ix1/int6.jpg"],
    "ב.מ.וו|X2": ["images/gallery/bmw-x2/ext1.jpg","images/gallery/bmw-x2/ext2.jpg","images/gallery/bmw-x2/ext3.jpg","images/gallery/bmw-x2/ext4.jpg","images/gallery/bmw-x2/int5.jpg","images/gallery/bmw-x2/int6.jpg"],
    "ב.מ.וו|X4": ["images/gallery/bmw-x4/ext1.jpg","images/gallery/bmw-x4/ext2.jpg","images/gallery/bmw-x4/ext3.jpg","images/gallery/bmw-x4/ext4.jpg","images/gallery/bmw-x4/int5.jpg","images/gallery/bmw-x4/int6.jpg"],
    "ב.מ.וו|X5": ["images/gallery/bmw-x5/ext1.jpg","images/gallery/bmw-x5/ext2.jpg","images/gallery/bmw-x5/ext3.jpg","images/gallery/bmw-x5/ext4.jpg","images/gallery/bmw-x5/int5.jpg","images/gallery/bmw-x5/int6.jpg"],
    "ב.מ.וו|216": ["images/gallery/bmw-2gc/ext1.jpg","images/gallery/bmw-2gc/ext2.jpg","images/gallery/bmw-2gc/ext3.jpg","images/gallery/bmw-2gc/ext4.jpg","images/gallery/bmw-2gc/int5.jpg","images/gallery/bmw-2gc/int6.jpg"],
    "ב.מ.וו|530e": ["images/gallery/bmw-5/ext1.jpg","images/gallery/bmw-5/ext2.jpg","images/gallery/bmw-5/ext3.jpg","images/gallery/bmw-5/ext4.jpg","images/gallery/bmw-5/int5.jpg","images/gallery/bmw-5/int6.jpg"],
    "ב.מ.וו|420i": ["images/gallery/bmw-4gc/ext1.jpg","images/gallery/bmw-4gc/ext2.jpg","images/gallery/bmw-4gc/ext3.jpg","images/gallery/bmw-4gc/ext4.jpg","images/gallery/bmw-4gc/int5.jpg","images/gallery/bmw-4gc/int6.jpg"],
    "אאודי|Q3 ספורטבק": ["images/gallery/audi-q3/ext1.jpg","images/gallery/audi-q3/ext2.jpg","images/gallery/audi-q3/ext3.jpg","images/gallery/audi-q3/ext4.jpg","images/gallery/audi-q3/int5.jpg","images/gallery/audi-q3/int6.jpg"],
    "אאודי|A3 ספורטבק": ["images/gallery/audi-a3/ext1.jpg","images/gallery/audi-a3/ext2.jpg","images/gallery/audi-a3/ext3.jpg","images/gallery/audi-a3/ext4.jpg","images/gallery/audi-a3/int5.jpg","images/gallery/audi-a3/int6.jpg"],
    "סקודה|סופרב": ["images/gallery/skoda-superb/ext1.jpg","images/gallery/skoda-superb/ext2.jpg","images/gallery/skoda-superb/ext3.jpg","images/gallery/skoda-superb/ext4.jpg","images/gallery/skoda-superb/int5.jpg","images/gallery/skoda-superb/int6.jpg"],
    "סקודה|קאמיק": ["images/gallery/skoda-kamiq/ext1.jpg","images/gallery/skoda-kamiq/ext2.jpg","images/gallery/skoda-kamiq/ext3.jpg","images/gallery/skoda-kamiq/ext4.jpg","images/gallery/skoda-kamiq/int5.jpg","images/gallery/skoda-kamiq/int6.jpg"],
    "סקודה|אוקטביה": ["images/gallery/skoda-octavia/ext1.jpg","images/gallery/skoda-octavia/ext2.jpg","images/gallery/skoda-octavia/ext3.jpg","images/gallery/skoda-octavia/ext4.jpg","images/gallery/skoda-octavia/int5.jpg","images/gallery/skoda-octavia/int6.jpg"],
    "סובארו|קרוסטרק": ["images/gallery/subaru-crosstrek/ext1.jpg","images/gallery/subaru-crosstrek/ext2.jpg","images/gallery/subaru-crosstrek/ext3.jpg","images/gallery/subaru-crosstrek/ext4.jpg","images/gallery/subaru-crosstrek/int5.jpg","images/gallery/subaru-crosstrek/int6.jpg"],
    "זיקר|זיקר X": ["images/gallery/zeekr-x/ext1.jpg","images/gallery/zeekr-x/ext2.jpg","images/gallery/zeekr-x/ext3.jpg","images/gallery/zeekr-x/ext4.jpg","images/gallery/zeekr-x/int5.jpg","images/gallery/zeekr-x/int6.jpg"],
    "זיקר|זיקר 001": ["images/gallery/zeekr-001/ext1.jpg","images/gallery/zeekr-001/ext2.jpg","images/gallery/zeekr-001/ext3.jpg","images/gallery/zeekr-001/ext4.jpg","images/gallery/zeekr-001/int5.jpg","images/gallery/zeekr-001/int6.jpg"],
    "זיקר|זיקר 7X": ["images/gallery/zeekr-7x/ext1.jpg","images/gallery/zeekr-7x/ext2.jpg","images/gallery/zeekr-7x/ext3.jpg","images/gallery/zeekr-7x/ext4.jpg","images/gallery/zeekr-7x/int5.jpg","images/gallery/zeekr-7x/int6.jpg"],
    "סמארט|סמארט #5": ["images/gallery/smart-5/ext1.jpg","images/gallery/smart-5/ext2.jpg","images/gallery/smart-5/ext3.jpg","images/gallery/smart-5/ext4.jpg","images/gallery/smart-5/int5.jpg","images/gallery/smart-5/int6.jpg"],
    "טויוטה|יאריס": ["images/gallery/toyota-yaris/ext2.jpg","images/gallery/toyota-yaris/ext3.jpg","images/gallery/toyota-yaris/ext4.jpg","images/gallery/toyota-yaris/int5.jpg","images/gallery/toyota-yaris/int6.jpg"],
    "אומודה|אומודה 7": ["images/gallery/omoda-7/ext1.jpg","images/gallery/omoda-7/ext2.jpg","images/gallery/omoda-7/ext3.jpg","images/gallery/omoda-7/ext4.jpg","images/gallery/omoda-7/int5.jpg","images/gallery/omoda-7/int6.jpg"],
    "מרצדס|GLA 200": ["images/gallery/mercedes-gla/ext1.jpg","images/gallery/mercedes-gla/ext2.jpg","images/gallery/mercedes-gla/ext3.jpg","images/gallery/mercedes-gla/ext4.jpg","images/gallery/mercedes-gla/int5.jpg","images/gallery/mercedes-gla/int6.jpg"],
    "מרצדס|GLC 200": ["images/gallery/mercedes-glc/ext1.jpg","images/gallery/mercedes-glc/ext2.jpg","images/gallery/mercedes-glc/ext3.jpg","images/gallery/mercedes-glc/ext4.jpg","images/gallery/mercedes-glc/int5.jpg","images/gallery/mercedes-glc/int6.jpg"],
    "מרצדס|GLC 300 קופה": ["images/gallery/mercedes-glc-coupe/ext1.jpg","images/gallery/mercedes-glc-coupe/ext2.jpg","images/gallery/mercedes-glc-coupe/ext3.jpg","images/gallery/mercedes-glc-coupe/ext4.jpg","images/gallery/mercedes-glc-coupe/int5.jpg","images/gallery/mercedes-glc-coupe/int6.jpg"],
    "מרצדס|CLA 200": ["images/gallery/mercedes-cla/ext1.jpg","images/gallery/mercedes-cla/ext2.jpg","images/gallery/mercedes-cla/ext3.jpg","images/gallery/mercedes-cla/ext4.jpg","images/gallery/mercedes-cla/int5.jpg","images/gallery/mercedes-cla/int6.jpg"],
"ג'אקו|ג'אקו 8": ["images/gallery/jaecoo-8/ext1.jpg","images/gallery/jaecoo-8/ext2.jpg","images/gallery/jaecoo-8/ext3.jpg","images/gallery/jaecoo-8/ext4.jpg","images/gallery/jaecoo-8/int5.jpg","images/gallery/jaecoo-8/int6.jpg"],
    "ג'אקו|ג'אקו 7": ["images/gallery/jaecoo-7/ext1.jpg","images/gallery/jaecoo-7/ext2.jpg","images/gallery/jaecoo-7/ext3.jpg","images/gallery/jaecoo-7/ext4.jpg","images/gallery/jaecoo-7/int5.jpg","images/gallery/jaecoo-7/int6.jpg"],
    "ג'אקו|ג'אקו 5": ["images/gallery/jaecoo-5/ext1.jpg","images/gallery/jaecoo-5/ext2.jpg","images/gallery/jaecoo-5/ext3.jpg","images/gallery/jaecoo-5/ext4.jpg","images/gallery/jaecoo-5/int5.jpg","images/gallery/jaecoo-5/int6.jpg"],
    "ג'אקו|ג'אקו 5 חשמלי": ["images/gallery/jaecoo-5/ext1.jpg","images/gallery/jaecoo-5/ext2.jpg","images/gallery/jaecoo-5/ext3.jpg","images/gallery/jaecoo-5/ext4.jpg","images/gallery/jaecoo-5/int5.jpg","images/gallery/jaecoo-5/int6.jpg"],
    "סיטרואן|ברלינגו": ["images/gallery/citroen-berlingo/ext1.jpg","images/gallery/citroen-berlingo/ext2.jpg","images/gallery/citroen-berlingo/ext3.jpg","images/gallery/citroen-berlingo/ext4.jpg","images/gallery/citroen-berlingo/int5.jpg"],
    "אווטר|אווטר 11": ["images/gallery/avatr-11/ext1.jpg","images/gallery/avatr-11/ext2.jpg","images/gallery/avatr-11/ext3.jpg","images/gallery/avatr-11/ext4.jpg","images/gallery/avatr-11/int5.jpg","images/gallery/avatr-11/int6.jpg"],
    "וויה|Free": ["images/gallery/voyah-free/ext1.jpg","images/gallery/voyah-free/ext2.jpg","images/gallery/voyah-free/ext3.jpg","images/gallery/voyah-free/ext4.jpg","images/gallery/voyah-free/int5.jpg","images/gallery/voyah-free/int6.jpg"],
    "ב.מ.וו|ix2": g6('bmw-ix2'),
    "ב.מ.וו|IX50": g6('bmw-ix'),
    "אאודי|Q5 40TFSI": g6('audi-q5'),
    "אומודה|7 הרמוני": g6('omoda-7'),
"ב.י.ד|סיל יו": ["images/gallery/byd-sealu/ext1.jpg","images/gallery/byd-sealu/ext2.jpg","images/gallery/byd-sealu/ext3.jpg","images/gallery/byd-sealu/ext4.jpg","images/gallery/byd-sealu/int5.jpg","images/gallery/byd-sealu/int6.jpg"],
    "ב.י.ד|סיליון": ["images/gallery/byd-sealion5/ext1.jpg","images/gallery/byd-sealion5/ext2.jpg","images/gallery/byd-sealion5/ext3.jpg","images/gallery/byd-sealion5/ext4.jpg","images/gallery/byd-sealion5/int5.jpg","images/gallery/byd-sealion5/int6.jpg"],
    "ג'אקו|8": ["images/gallery/jaecoo-8/ext1.jpg","images/gallery/jaecoo-8/ext2.jpg","images/gallery/jaecoo-8/ext3.jpg","images/gallery/jaecoo-8/ext4.jpg","images/gallery/jaecoo-8/int5.jpg","images/gallery/jaecoo-8/int6.jpg"],
    "ג'אקו|7": ["images/gallery/jaecoo-7/ext1.jpg","images/gallery/jaecoo-7/ext2.jpg","images/gallery/jaecoo-7/ext3.jpg","images/gallery/jaecoo-7/ext4.jpg","images/gallery/jaecoo-7/int5.jpg","images/gallery/jaecoo-7/int6.jpg"],
    "ג'אקו|5": ["images/gallery/jaecoo-5/ext1.jpg","images/gallery/jaecoo-5/ext2.jpg","images/gallery/jaecoo-5/ext3.jpg","images/gallery/jaecoo-5/ext4.jpg","images/gallery/jaecoo-5/int5.jpg","images/gallery/jaecoo-5/int6.jpg"],
    "ג'אקו|5 חשמלי": ["images/gallery/jaecoo-5/ext1.jpg","images/gallery/jaecoo-5/ext2.jpg","images/gallery/jaecoo-5/ext3.jpg","images/gallery/jaecoo-5/ext4.jpg","images/gallery/jaecoo-5/int5.jpg","images/gallery/jaecoo-5/int6.jpg"],
    "מיצובישי|אקליפס": ["images/gallery/mitsubishi-eclipsecross/ext1.jpg","images/gallery/mitsubishi-eclipsecross/ext2.jpg","images/gallery/mitsubishi-eclipsecross/ext3.jpg","images/gallery/mitsubishi-eclipsecross/int5.jpg","images/gallery/mitsubishi-eclipsecross/int6.jpg"],
    "אמ.ג'י|3": ["images/gallery/mg3/mg3-front.jpg","images/gallery/mg3/mg3-grille.jpg","images/gallery/mg3/mg3-interior-screen.jpg","images/gallery/mg3/mg3-interior-seats.jpg","images/gallery/mg3/mg3-side.jpg","images/gallery/mg3/mg3-wheel.jpg"],
    "אווטר|11": ["images/gallery/avatr-11/ext1.jpg","images/gallery/avatr-11/ext2.jpg","images/gallery/avatr-11/ext3.jpg","images/gallery/avatr-11/ext4.jpg","images/gallery/avatr-11/int5.jpg","images/gallery/avatr-11/int6.jpg"],
    "אומודה|7": ["images/gallery/omoda-7/ext1.jpg","images/gallery/omoda-7/ext2.jpg","images/gallery/omoda-7/ext3.jpg","images/gallery/omoda-7/ext4.jpg","images/gallery/omoda-7/int5.jpg","images/gallery/omoda-7/int6.jpg"],
    "ב.מ.וו|530": ["images/gallery/bmw-5/ext1.jpg","images/gallery/bmw-5/ext2.jpg","images/gallery/bmw-5/ext3.jpg","images/gallery/bmw-5/ext4.jpg","images/gallery/bmw-5/int5.jpg","images/gallery/bmw-5/int6.jpg"],
    "מאזדה|cx5": ["images/gallery/mazda-cx5/ext1.jpg","images/gallery/mazda-cx5/ext2.jpg","images/gallery/mazda-cx5/ext3.jpg","images/gallery/mazda-cx5/ext4.jpg","images/gallery/mazda-cx5/int5.jpg","images/gallery/mazda-cx5/int6.jpg"],
    "זיקר|x": ["images/gallery/zeekr-x/ext1.jpg","images/gallery/zeekr-x/ext2.jpg","images/gallery/zeekr-x/ext3.jpg","images/gallery/zeekr-x/ext4.jpg","images/gallery/zeekr-x/int5.jpg","images/gallery/zeekr-x/int6.jpg"],
    "זיקר|7x": ["images/gallery/zeekr-7x/ext1.jpg","images/gallery/zeekr-7x/ext2.jpg","images/gallery/zeekr-7x/ext3.jpg","images/gallery/zeekr-7x/ext4.jpg","images/gallery/zeekr-7x/int5.jpg","images/gallery/zeekr-7x/int6.jpg"],
    "סמארט|#5": ["images/gallery/smart-5/ext1.jpg","images/gallery/smart-5/ext2.jpg","images/gallery/smart-5/ext3.jpg","images/gallery/smart-5/ext4.jpg","images/gallery/smart-5/int5.jpg","images/gallery/smart-5/int6.jpg"],
    "מרצדס|cla 200 סיגניצ'ר AMG LINE": ["images/gallery/mercedes-cla/ext1.jpg","images/gallery/mercedes-cla/ext2.jpg","images/gallery/mercedes-cla/ext3.jpg","images/gallery/mercedes-cla/ext4.jpg","images/gallery/mercedes-cla/int5.jpg","images/gallery/mercedes-cla/int6.jpg"],
    "אאודי|Q3 ספורטבק 35 TFSI חבילת אבזור Design": ["images/gallery/audi-q3/ext1.jpg","images/gallery/audi-q3/ext2.jpg","images/gallery/audi-q3/ext3.jpg","images/gallery/audi-q3/ext4.jpg","images/gallery/audi-q3/int5.jpg","images/gallery/audi-q3/int6.jpg"],
    "אאודי|A3 ספורטבק חבילת SLINE LUX": ["images/gallery/audi-a3/ext1.jpg","images/gallery/audi-a3/ext2.jpg","images/gallery/audi-a3/ext3.jpg","images/gallery/audi-a3/ext4.jpg","images/gallery/audi-a3/int5.jpg","images/gallery/audi-a3/int6.jpg"],
    "ליפמוטור|C10": ["images/gallery/leapmotor-c10/ext1.jpg","images/gallery/leapmotor-c10/ext2.jpg","images/gallery/leapmotor-c10/ext3.jpg","images/gallery/leapmotor-c10/ext4.jpg","images/gallery/leapmotor-c10/int5.jpg","images/gallery/leapmotor-c10/int6.jpg"],
    "טויוטה|יאריס קרוס": ["images/gallery/toyota-yariscross/ext2.jpg","images/gallery/toyota-yariscross/ext3.jpg","images/gallery/toyota-yariscross/ext4.jpg"]
  };
  C.forEach(function (c) { var g = GALLERIES[c.brand + '|' + c.name]; if (g) c.gallery = g; });
  // expose galleries with a normalized key (apostrophes/spaces stripped) so db-cars.js can apply them
  // to the live Google-Sheet inventory too (which replaces LOAN_CARS at runtime)
  var galNorm = function (s) { return String(s == null ? '' : s).replace(/['׳"`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };
  var NG = {}; Object.keys(GALLERIES).forEach(function (k) { var p = k.split('|'); NG[galNorm(p[0]) + '|' + galNorm(p[1])] = GALLERIES[k]; });
  window.Car2Buy.MODEL_GALLERIES = NG;
  window.Car2Buy.LOAN_CARS = C;

  // ---- English display names (nicer card titles) ----
  var EN_BRAND = {
    'ב.י.ד': 'BYD', "ג'אקו": 'Jaecoo', "צ'רי": 'Chery', 'יונדאי': 'Hyundai', 'טויוטה': 'Toyota',
    'ליפמוטור': 'Leapmotor', 'קיה': 'Kia', 'מיצובישי': 'Mitsubishi', "אמ.ג'י": 'MG', 'סקודה': 'Škoda',
    "קיי.ג'י.אם": 'KGM', 'אווטר': 'Avatr', 'ניסאן': 'Nissan', 'סיאט': 'SEAT', 'סיטרואן': 'Citroën',
    'אומודה': 'Omoda', 'שברולט': 'Chevrolet', 'GMC': 'GMC', 'ב.מ.וו': 'BMW', 'מאזדה': 'Mazda',
    'זיקר': 'Zeekr', 'סובארו': 'Subaru', 'מרצדס': 'Mercedes-Benz', 'סמארט': 'smart', 'וויה': 'Voyah',
    'סקיוואל': 'Skywell', 'אאודי': 'Audi'
  };
  // model name (without brand prefix)
  var EN_MODEL = {
    'אטו 2': 'Atto 2', 'סיל 5 DM-i': 'Seal 5 DM-i', 'סיל U': 'Seal U', 'סיליון 5': 'Sealion 5',
    "ג'אקו 8": '8', "ג'אקו 7": '7', "ג'אקו 5": '5', "ג'אקו 5 חשמלי": '5 EV',
    'טיגו 8 פרו': 'Tiggo 8 Pro', 'טיגו 4': 'Tiggo 4', 'טיגו 7 פרו': 'Tiggo 7 Pro',
    'טיגו 9 פרו נובל': 'Tiggo 9 Pro Noble', 'טיגו 9 לקשרי': 'Tiggo 9 Luxury', 'FX EV': 'FX EV', 'FX': 'FX',
    'טוסון': 'Tucson', 'וניו': 'Venue', 'סונטה': 'Sonata', 'אלנטרה': 'Elantra', 'קונה': 'Kona',
    'יאריס קרוס': 'Yaris Cross', 'יאריס': 'Yaris', 'C-HR': 'C-HR', 'C10': 'C10',
    'סלטוס': 'Seltos', 'פיקנטו': 'Picanto', 'נירו': 'Niro',
    'אקליפס קרוס': 'Eclipse Cross', 'אאוטלנדר': 'Outlander',
    'EHS': 'eHS', 'HS': 'HS', 'ZS': 'ZS', 'MG 3': '3', 'S9': 'S9',
    'סופרב': 'Superb', 'קאמיק': 'Kamiq', 'אוקטביה': 'Octavia', 'רקסטון': 'Rexton', 'אווטר 11': '11',
    "ג'וק": 'Juke', 'קשקאי': 'Qashqai', 'ארונה': 'Arona', 'ברלינגו': 'Berlingo', 'אומודה 7': '7',
    'סילברדו EV': 'Silverado EV', 'GMC': 'Sierra',
    'X1': 'X1', 'iX1': 'iX1', 'X2': 'X2', 'X4': 'X4', 'X5': 'X5', '216': '216 Gran Coupé', '530e': '530e', '420i': '420i',
    'CX-5': 'CX-5', 'זיקר X': 'X', 'זיקר 001': '001', 'זיקר 7X': '7X', 'קרוסטרק': 'Crosstrek',
    'GLA 200': 'GLA 200', 'GLC 200': 'GLC 200 Coupé', 'GLC 300 קופה': 'GLC 300 Coupé', 'CLA 200': 'CLA 200',
    'סמארט #5': '#5', 'Free': 'Free', 'Pro GT': 'Pro GT',
    'Q3 ספורטבק': 'Q3 Sportback', 'A3 ספורטבק': 'A3 Sportback'
  };
  window.Car2Buy.enBrand = function (b) { return EN_BRAND[b] || b; };
  // display name: brands written awkwardly in Hebrew (dot or geresh) render in English
  window.Car2Buy.dispBrand = function (b) { return (/[.'\u05F3\u2019]/.test(b || '') && EN_BRAND[b]) ? EN_BRAND[b] : b; };
  window.Car2Buy.enModel = function (n) { return EN_MODEL[n] != null ? EN_MODEL[n] : n; };
  window.Car2Buy.enName = function (c) {
    var b = EN_BRAND[c.brand] || c.brand;
    var m = EN_MODEL[c.name] != null ? EN_MODEL[c.name] : c.name;
    return (b + ' ' + m).trim();
  };

  // ---- expose the REAL inventory as the site-wide MODELS (replaces demo cars) ----
  // so every surface (homepage featured, compare, AI concierge, carousels) uses
  // only the cars we actually stock — never invented ones.
  window.Car2Buy.rebuildModels = function () {
    function fuelOf(c) {
      var t = (c.name || '') + ' ' + (c.trim || '');
      if (/חשמלי|\bEV\b/i.test(t)) return 'חשמלי';
      if (/PHEV|DM-?i|נטען/i.test(t)) return 'היברידי נטען';
      if (/HEV|היבריד/i.test(t)) return 'היברידי';
      return 'בנזין';
    }
    function catOf(c) {
      var n = c.name || '';
      if (fuelOf(c) === 'חשמלי') return 'ev';
      if (/סדאן|A3|CLA|CLA 200|סונטה|אלנטרה|530e|420i|216|אוקטביה|סופרב|MG 3|פיקנטו|יאריס$|Free|S9|Pro GT/.test(n)) return 'sedan';
      return 'suv';
    }
    var CAT_TYPE = { ev: 'חשמלי', suv: 'רכב פנאי', sedan: 'סדאן', sport: 'ספורט' };
    var models = window.Car2Buy.LOAN_CARS.map(function (c) {
      var fuel = fuelOf(c), cat = catOf(c), price = c.p || 0;
      var power = Math.max(95, Math.min(340, Math.round(95 + price / 2200)));
      var accel = Math.max(6, Math.min(13, +(13 - power / 42).toFixed(1)));
      var seats = /טיגו 9|טיגו 8|טוסון|אאוטלנדר|רקסטון|סילברדו|GMC|X5|אומודה 7/.test(c.name) ? 7 : 5;
      return {
        id: c.id, brand: c.brand, name: c.name, trim: c.trim,
        type: CAT_TYPE[cat] || 'רכב', cat: cat, monthly: c.m, list: c.p, img: c.img,
        power: power, accel: accel, fuel: fuel, drive: fuel === 'חשמלי' ? 'חשמלית' : 'קדמית',
        seats: seats, year: 2026, body: CAT_TYPE[cat] || 'רכב',
        blurb: (window.Car2Buy.enName(c)) + ' — במלאי Car2Buy, זמין למסירה מהירה עם מסלול מימון אישי ונוח.'
      };
    });
    window.Car2Buy.MODELS = models;
    window.Car2Buy.BRANDS = models.map(function (m) { return m.brand; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    window.Car2Buy.FUELS = models.map(function (m) { return m.fuel; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  };
  window.Car2Buy.rebuildModels();
})();
