/* ============================================================
   Car2Buy — shared data: real image pool + models w/ specs
   Photos: free stock (Unsplash / Pexels). Brand emblems:
   filippofilip95/car-logos-dataset via jsDelivr CDN.
   Swap any `img` URL for the client's real model photography.
   ============================================================ */
(function () {
  const U = (id, w) => `https://images.unsplash.com/photo-${id}?w=${w || 1200}&q=80&auto=format&fit=crop`;
  const P = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w || 1200}`;

  const IMG = {
    panamera:   U('1503376780353-7e6692767b70'),
    bmwM5:      U('1555215695-3004980ad54e'),
    silverRoad: U('1568605117036-5fe5e7bab0b7'),
    teslaWhite: U('1560958089-b8a1929cea89'),
    amgSilver:  U('1618843479313-40f8afb4b4d8'),
    audiBlack:  U('1606664515524-ed2f786a0bd6'),
    ferrariYel: U('1503736334956-4c8f8e92946d'),
    mustang:    U('1494976388531-d1058494cdd8'),
    camaro:     U('1552519507-da3b142c6e3d'),
    teslaFront: U('1561580125-028ee3bd62eb'),
    laferrari:  U('1583121274602-3e2820c69888'),
    audiSilver: U('1606152421802-db97b9c7a11b'),
    bmwBlack:   U('1556189250-72ba954cfc2b'),
    suvSilver:  U('1617469767053-d3b523a0b982'),
    amgYellow:  U('1605559424843-9e4c228bf1c2'),
    evoque:     P('116675'),
    bmwGT:      P('170811'),
    bmwSedan:   P('100656'),
    alfa:       P('210019'),
    jeep:       P('119435'),
    amgSilver2: P('112460'),
    exotic:     P('358070'),
    bmw4:       P('892522'),
    audiTT:     P('1149831'),
    genesis:    P('3786091'),
    amgRed:     P('3729464'),
    blackCoupe: P('919073'),
    mercRow:    P('164634'),
  };
  const ALT = [IMG.silverRoad, IMG.bmwBlack, IMG.mercRow, IMG.amgRed, IMG.exotic];

  // brand → car-logos-dataset slug (full manufacturer directory).
  // slug:'' = no dataset logo → monogram fallback renders.
  const BRANDS_ALL = [
    { name:'Mercedes-AMG', slug:'mercedes-benz', he:'מרצדס' }, { name:'BMW', slug:'bmw', he:'ב.מ.וו' },
    { name:'Audi', slug:'audi', he:'אאודי' }, { name:'Porsche', slug:'porsche', he:'פורשה' },
    { name:'Tesla', slug:'tesla', he:'טסלה' }, { name:'Range Rover', slug:'land-rover', he:'ריינג׳ רובר' },
    { name:'Genesis', slug:'genesis', he:'ג׳נסיס' }, { name:'Alfa Romeo', slug:'alfa-romeo', he:'אלפא רומיאו' },
    { name:'Ford', slug:'ford', he:'פורד' }, { name:'Chevrolet', slug:'chevrolet', he:'שברולט' },
    { name:'Ferrari', slug:'ferrari', he:'פרארי' }, { name:'Jeep', slug:'jeep', he:'ג׳יפ' },
    { name:'Lexus', slug:'lexus', he:'לקסוס' }, { name:'Maserati', slug:'maserati', he:'מזראטי' },
    { name:'Toyota', slug:'toyota', he:'טויוטה' }, { name:'Volkswagen', slug:'volkswagen', he:'פולקסווגן' },
    { name:'Hyundai', slug:'hyundai', he:'יונדאי' }, { name:'Kia', slug:'kia', he:'קיה' },
    { name:'Skoda', slug:'skoda', he:'סקודה' }, { name:'Mazda', slug:'mazda', he:'מאזדה' },
    { name:'Honda', slug:'honda', he:'הונדה' }, { name:'Nissan', slug:'nissan', he:'ניסאן' },
    { name:'Suzuki', slug:'suzuki', he:'סוזוקי' }, { name:'Mitsubishi', slug:'mitsubishi', he:'מיצובישי' },
    { name:'Peugeot', slug:'peugeot', he:'פיג׳ו' }, { name:'Renault', slug:'renault', he:'רנו' },
    { name:'Citroen', slug:'citroen', he:'סיטרואן' }, { name:'Opel', slug:'opel', he:'אופל' },
    { name:'SEAT', slug:'seat', he:'סיאט' }, { name:'Volvo', slug:'volvo', he:'וולוו' },
    { name:'MINI', slug:'mini', he:'מיני' }, { name:'Jaguar', slug:'jaguar', he:'יגואר' },
    { name:'Fiat', slug:'fiat', he:'פיאט' }, { name:'Subaru', slug:'subaru', he:'סובארו' },
    { name:'Dacia', slug:'dacia', he:'דאצ׳יה' }, { name:'Cadillac', slug:'cadillac', he:'קאדילק' },
    { name:'Land Rover', slug:'land-rover', he:'לנד רובר' }, { name:'Bentley', slug:'bentley', he:'בנטלי' },
    { name:'Lamborghini', slug:'lamborghini', he:'למבורגיני' }, { name:'Aston Martin', slug:'aston-martin', he:'אסטון מרטין' },
    { name:'Cupra', slug:'cupra', he:'קופרה' }, { name:'Smart', slug:'smart', he:'סמארט' },
    { name:'RAM', slug:'ram', he:'ראם' }, { name:'Abarth', slug:'abarth', he:'אברת׳' },
    { name:'Infiniti', slug:'infiniti', he:'אינפיניטי' }, { name:'Isuzu', slug:'isuzu', he:'איסוזו' },
    { name:'MG', slug:'mg', he:'MG' }, { name:'BYD', slug:'byd', he:'BYD' },
    { name:'GMC', slug:'gmc', he:'GMC' }, { name:'DS', slug:'ds', he:'DS' },
    { name:'Geely', slug:'geely', he:'ג׳ילי' }, { name:'Chery', slug:'chery', he:'צ׳רי' },
    { name:'Changan', slug:'changan', he:'צ׳אנגאן' }, { name:'Leapmotor', slug:'leapmotor', he:'ליפמוטור' },
    { name:'Maxus', slug:'maxus', he:'מקסוס' }, { name:'MAN', slug:'man', he:'מאן' },
    { name:'Foton', slug:'foton', he:'פוטון' }, { name:'JAC', slug:'jac', he:'ג׳אק' },
    { name:'Dongfeng', slug:'dongfeng', he:'דונגפנג' }, { name:'Hongqi', slug:'hongqi', he:'הונצ׳י' },
    { name:'Zeekr', slug:'zeekr', he:'זיקר' }, { name:'NIO', slug:'nio', he:'NIO' },
    { name:'Omoda', slug:'omoda', he:'אומודה' }, { name:'Aiways', slug:'aiways', he:'אוטאר' },
  ];
  const BRAND_HE = Object.fromEntries(BRANDS_ALL.map((b) => [b.name, b.he]));
  const LOGO_SLUG = Object.fromEntries(BRANDS_ALL.map((b) => [b.name, b.slug]));
  // brands missing from the CDN logo dataset — served from our own transparent assets
  const LOGO_LOCAL = { KGM: 'images/brands/kgm.png', Jaecoo: 'images/brands/jaecoo.svg', Skywell: 'images/brands/skywell.png', Voyah: 'images/brands/voyah.png' };
  const LOGO = (brand) => LOGO_LOCAL[brand] || `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/${LOGO_SLUG[brand] || ''}.png`;
  // Hebrew inventory brand → logo URL (covers brands missing from BRANDS_ALL too).
  // Normalize away apostrophes/geresh/dots/spaces so spelling variants still match.
  const heNorm = (s) => String(s || '').replace(/['"׳״.׳״\s]/g, '');
  const LOGO_ALIAS_HE = { 'וויה': 'Voyah', 'ואייה': 'Voyah', "קיי.ג'י.אם": 'KGM', 'קיי ג׳י אם': 'KGM', "ג'אקו": 'Jaecoo', 'סקיוואל': 'Skywell', 'סקייוול': 'Skywell', 'אומודה': 'Omoda', 'אווטר': 'Aiways', 'אוטאר': 'Aiways', 'ליפמוטור': 'Leapmotor', 'זיקר': 'Zeekr', "אמ.ג'י": 'MG', 'דונפנג': 'Dongfeng', 'דונגפנג': 'Dongfeng', 'ב.י.ד': 'BYD', 'ביד': 'BYD' };
  const HE_TO_EN_N = {};
  BRANDS_ALL.forEach((b) => { HE_TO_EN_N[heNorm(b.he)] = b.name; });
  Object.keys(LOGO_ALIAS_HE).forEach((he) => { HE_TO_EN_N[heNorm(he)] = LOGO_ALIAS_HE[he]; });
  const LOGO_HE = (he) => { const en = HE_TO_EN_N[heNorm(he)] || ''; return en ? LOGO(en) : ''; };
  // canonical English name for any Hebrew/variant brand string (for matching across sources)
  const brandEn = (he) => HE_TO_EN_N[heNorm(he)] || '';

  const NIS = (n) => '₪' + n.toLocaleString('en-US');

  const MODELS = [
    { id:'amg-gt',    brand:'Mercedes-AMG', name:'GT 63 Coupé',    type:'ספורט',  cat:'sport', monthly:5490, list:1150000, img:IMG.amgSilver,  tag:'הכי מבוקש', power:585, accel:3.2, fuel:'בנזין',  drive:'כפולה', seats:4, year:2024, body:'קופה ספורט',
      blurb:'איקון של ביצועים בעטיפה אלגנטית — מנוע V8 ביטורבו ותא נהג שנבנה סביב הנהג.' },
    { id:'amg-c63',   brand:'Mercedes-AMG', name:'C 63 S E',       type:'ספורט',  cat:'sport', monthly:5290, list:720000, img:IMG.amgRed,    power:680, accel:3.4, fuel:'היברידי',drive:'כפולה', seats:5, year:2024, body:'סדאן ספורט',
      blurb:'הדור החדש — הנעה היברידית בעוצמת על, ביצועים שמטשטשים את הגבול בין סלון למסלול.' },
    { id:'amg-e53',   brand:'Mercedes-AMG', name:'E 53 Hybrid',    type:'מנהלים', cat:'sedan', monthly:4190, list:640000, img:IMG.amgSilver2,power:449, accel:4.5, fuel:'היברידי',drive:'כפולה', seats:5, year:2024, body:'סדאן יוקרה',
      blurb:'נוכחות מנהלים עם נשמת AMG. שילוב מושלם של נוחות, יוקרה וביצועים.' },
    { id:'bmw-m5',    brand:'BMW',          name:'M5 Competition', type:'סדאן',   cat:'sedan', monthly:4890, list:980000, img:IMG.bmwM5,      power:625, accel:3.3, fuel:'בנזין',  drive:'כפולה', seats:5, year:2024, body:'סדאן ספורט',
      blurb:'הסדאן שמשלב נוחות מנהלים עם נשמה של מכונית מרוץ. הספורטיביות המושלמת ליום-יום.' },
    { id:'bmw-m3',    brand:'BMW',          name:'M3 Competition', type:'ספורט',  cat:'sport', monthly:4290, list:720000, img:IMG.bmwBlack,   power:510, accel:3.5, fuel:'בנזין',  drive:'כפולה', seats:5, year:2024, body:'סדאן ספורט',
      blurb:'ה‑M האולטימטיבי — תגובתיות חדה, איזון מושלם ואופי שלא מתפשר.' },
    { id:'bmw-m8',    brand:'BMW',          name:'M8 Competition', type:'יוקרה',  cat:'sport', monthly:5490, list:1100000, img:IMG.blackCoupe, power:625, accel:3.2, fuel:'בנזין',  drive:'כפולה', seats:4, year:2024, body:'קופה יוקרה',
      blurb:'הדגל של ביצועי BMW — גראן קופה מפואר עם עוצמה אדירה ונוחות נדיבה.' },
    { id:'bmw-i7',    brand:'BMW',          name:'i7 xDrive60',    type:'חשמלי',  cat:'ev',    monthly:4990, list:850000, img:IMG.bmwSedan,   tag:'חשמלי',    power:544, accel:4.5, fuel:'חשמלי', drive:'כפולה', seats:5, year:2024, body:'סדאן חשמלי',
      blurb:'לימוזינה חשמלית מהעתיד — שקט מוחלט, מסכי ענק ויוקרה ללא פשרות.' },
    { id:'bmw-3gt',   brand:'BMW',          name:'3 Series GT',    type:'סדאן',   cat:'sedan', monthly:2790, list:320000, img:IMG.bmwGT,      power:258, accel:6.3, fuel:'בנזין',  drive:'כפולה', seats:5, year:2023, body:'סדאן',
      blurb:'מרחב פנים נדיב, תא מטען ענק ונוחות נסיעה — סדאן משפחתי מפנק.' },
    { id:'bmw-4',     brand:'BMW',          name:'4 Series Coupé', type:'קופה',   cat:'sport', monthly:3150, list:430000, img:IMG.bmw4,       power:374, accel:4.5, fuel:'בנזין',  drive:'אחורית', seats:4, year:2024, body:'קופה',
      blurb:'פרופורציות קופה קלאסיות וטכנולוגיה עדכנית. ספורטיביות בכל יום.' },
    { id:'audi-rs7',  brand:'Audi',         name:'RS7 Sportback',  type:'סדאן',   cat:'sedan', monthly:4750, list:940000, img:IMG.audiBlack,  power:600, accel:3.6, fuel:'בנזין',  drive:'כפולה', seats:5, year:2024, body:'ספורטבק',
      blurb:'קו גג קופה, אחיזת כביש quattro ונוכחות שלא מתפשרת. עוצמה בלבוש זוקן.' },
    { id:'audi-rs6',  brand:'Audi',         name:'RS6 Avant',      type:'ספורט',  cat:'sport', monthly:4690, list:920000, img:IMG.audiSilver, power:600, accel:3.6, fuel:'בנזין',  drive:'כפולה', seats:5, year:2024, body:'סטיישן ספורט',
      blurb:'הסטיישן הכי מהיר בעולם — שילוב לא הגיוני של פרקטיות וביצועי על.' },
    { id:'etron-gt',  brand:'Audi',         name:'e-tron GT',      type:'חשמלי',  cat:'ev',    monthly:4420, list:690000, img:IMG.audiTT,     tag:'חשמלי',    power:530, accel:4.1, fuel:'חשמלי', drive:'כפולה', seats:4, year:2024, body:'סדאן חשמלי',
      blurb:'גראן טוריזמו חשמלי עוצר נשימה — שקט, עוצמה ועיצוב פיסולי.' },
    { id:'tt-rs',     brand:'Audi',         name:'TT RS',          type:'קופה',   cat:'sport', monthly:3120, list:430000, img:IMG.audiTT,     power:400, accel:3.7, fuel:'בנזין',  drive:'כפולה', seats:4, year:2023, body:'קופה',
      blurb:'מנוע חמשת הצילינדרים האייקוני בגוף קומפקטי ומדויק. כיף נהיגה זיקוקי.' },
    { id:'panamera',  brand:'Porsche',      name:'Panamera',       type:'יוקרה',  cat:'sedan', monthly:5120, list:870000, img:IMG.panamera,   power:460, accel:4.4, fuel:'בנזין',  drive:'אחורית', seats:4, year:2024, body:'סדאן יוקרה',
      blurb:'גראן טוריזמו אמיתי — DNA של פורשה בארבע דלתות, לנסיעות ארוכות בסטייל.' },
    { id:'porsche-911',brand:'Porsche',     name:'911 Carrera',    type:'ספורט',  cat:'sport', monthly:5890, list:980000, img:IMG.silverRoad, tag:'אייקון',   power:385, accel:4.2, fuel:'בנזין',  drive:'אחורית', seats:4, year:2024, body:'קופה ספורט',
      blurb:'מכונית הספורט המושלמת בעולם, כבר 60 שנה. אייקון שאין שני לו.' },
    { id:'model-s',   brand:'Tesla',        name:'Model S Plaid',  type:'חשמלי',  cat:'ev',    monthly:3980, list:560000, img:IMG.teslaWhite, tag:'חשמלי',    power:1020, accel:2.1, fuel:'חשמלי', drive:'כפולה', seats:5, year:2024, body:'סדאן חשמלי',
      blurb:'התאוצה המהירה בעולם בייצור סדרתי, טווח ענק וטכנולוגיה שמקדימה את זמנה.' },
    { id:'model-x',   brand:'Tesla',        name:'Model X',        type:'פנאי',   cat:'suv',   monthly:4290, list:620000, img:IMG.teslaWhite, power:670, accel:3.8, fuel:'חשמלי', drive:'כפולה', seats:6, year:2024, body:'רכב פנאי חשמלי',
      blurb:'SUV חשמלי עם דלתות פלקון מרהיבות, מרחב לכל המשפחה וביצועי על.' },
    { id:'model-3',   brand:'Tesla',        name:'Model 3',        type:'חשמלי',  cat:'ev',    monthly:2690, list:280000, img:IMG.teslaFront, tag:'הכי משתלם', power:283, accel:6.1, fuel:'חשמלי', drive:'אחורית', seats:5, year:2024, body:'סדאן חשמלי',
      blurb:'הכניסה המושלמת לעולם החשמלי — חכם, חסכוני ומהנה לנהיגה.' },
    { id:'evoque',    brand:'Range Rover',  name:'Evoque',         type:'פנאי',   cat:'suv',   monthly:3540, list:410000, img:IMG.evoque,     power:249, accel:7.0, fuel:'בנזין',  drive:'4X4', seats:5, year:2024, body:'רכב פנאי',
      blurb:'עיצוב אורבני יוקרתי עם יכולת שטח אמיתית. נוכחות בכל פינת רחוב.' },
    { id:'g80',       brand:'Genesis',      name:'G80',            type:'מנהלים', cat:'sedan', monthly:3290, list:430000, img:IMG.genesis,    power:380, accel:4.9, fuel:'בנזין',  drive:'אחורית', seats:5, year:2024, body:'סדאן מנהלים',
      blurb:'יוקרה קוריאנית ששוברת את הכללים — גימור עשיר ושקט נסיעה יוצא דופן.' },
    { id:'giulia',    brand:'Alfa Romeo',   name:'Giulia QV',      type:'ספורט',  cat:'sport', monthly:3680, list:520000, img:IMG.alfa,       power:510, accel:3.9, fuel:'בנזין',  drive:'אחורית', seats:5, year:2024, body:'סדאן ספורט',
      blurb:'תשוקה איטלקית טהורה — מנוע בהשראת פרארי וכוונון שאסי שמדבר אל הידיים.' },
    { id:'mustang',   brand:'Ford',         name:'Mustang GT',     type:'קופה',   cat:'sport', monthly:2990, list:380000, img:IMG.mustang,    power:450, accel:4.3, fuel:'בנזין',  drive:'אחורית', seats:4, year:2024, body:'קופה אמריקאית',
      blurb:'שריר אמריקאי קלאסי עם פסקול V8 שלא משאיר אדיש. אגדה על הכביש.' },
    { id:'camaro',    brand:'Chevrolet',    name:'Camaro SS',      type:'קופה',   cat:'sport', monthly:2940, list:360000, img:IMG.camaro,     power:455, accel:4.0, fuel:'בנזין',  drive:'אחורית', seats:4, year:2023, body:'קופה',
      blurb:'עיצוב אגרסיבי וביצועים ישירים — מאסל-קאר במיטבו.' },
    { id:'ferrari',   brand:'Ferrari',      name:'Roma',           type:'אקזוטי', cat:'sport', monthly:9800, list:2400000, img:IMG.laferrari,  tag:'אקסקלוסיבי', power:620, accel:3.4, fuel:'בנזין', drive:'אחורית', seats:2, year:2024, body:'קופה אקזוטית',
      blurb:'La Nuova Dolce Vita — אלגנטיות איטלקית וביצועי על. אובייקט תשוקה.' },
    { id:'ferrari-sf90',brand:'Ferrari',    name:'SF90 Stradale',  type:'אקזוטי', cat:'sport', monthly:12800, list:3200000, img:IMG.ferrariYel, tag:'אקסקלוסיבי', power:1000, accel:2.5, fuel:'היברידי', drive:'כפולה', seats:2, year:2024, body:'סופר-קאר',
      blurb:'הפרארי הסדרתי החזק אי פעם — היברידי בעוצמת 1,000 כ״ס. פיסת הנדסה טהורה.' },
    { id:'amg-gtr',   brand:'Mercedes-AMG', name:'GT R',           type:'ספורט',  cat:'sport', monthly:6200, list:1300000, img:IMG.amgYellow,  power:585, accel:3.6, fuel:'בנזין',  drive:'אחורית', seats:2, year:2023, body:'קופה ספורט',
      blurb:'"החיה מהגיהינום הירוק" — טראק-קאר אמיתי לכביש הפתוח.' },
    { id:'grand-cher',brand:'Jeep',         name:'Grand Cherokee', type:'פנאי',   cat:'suv',   monthly:3360, list:470000, img:IMG.jeep,       power:286, accel:8.3, fuel:'בנזין',  drive:'4X4', seats:5, year:2024, body:'רכב פנאי',
      blurb:'יוקרה אמריקאית עם יכולת שטח אגדית. נוחות וביטחון למשפחה.' },
    { id:'lexus-rx',  brand:'Lexus',        name:'RX 450h',        type:'היברידי',cat:'suv',   monthly:3540, list:480000, img:IMG.suvSilver,  power:250, accel:7.9, fuel:'היברידי',drive:'כפולה', seats:5, year:2024, body:'רכב פנאי היברידי',
      blurb:'שקט יפני אגדי, אמינות ללא פשרות והנעה היברידית חסכונית.' },
    { id:'granturismo',brand:'Maserati',    name:'GranTurismo',    type:'יוקרה',  cat:'sport', monthly:7400, list:1250000, img:IMG.exotic,     tag:'אקסקלוסיבי', power:550, accel:3.5, fuel:'בנזין', drive:'אחורית', seats:4, year:2024, body:'קופה יוקרה',
      blurb:'הקול האיטלקי המפורסם בעולם, עוטף בעיצוב פיסולי ובד יוקרה.' },
  ];

  const CATS = [
    { id:'all', label:'הכל' }, { id:'suv', label:'רכבי פנאי' },
    { id:'sedan', label:'סדאן' }, { id:'sport', label:'ספורט וקופה' }, { id:'ev', label:'חשמלי' },
  ];
  const BRANDS = [...new Set(MODELS.map((m) => m.brand))].sort();
  const FUELS = [...new Set(MODELS.map((m) => m.fuel))];

  function gallery(m) { return [m.img, ...ALT.filter((a) => a !== m.img).slice(0, 3)]; }

  // models available for fast delivery (אספקה מהירה)
  const FAST = new Set(['model-3','model-s','evoque','bmw-3gt','g80','lexus-rx','etron-gt','panamera']);

  // press mentions (placeholder — swap for real coverage logos/links)
  const PRESS = [
    { name:'mako',      style:'mako',    quote:'"הדרך החכמה לנהוג ברכב חדש בלי לרוקן את החשבון"' },
    { name:'TheMarker', style:'marker',  quote:'"שירות שמנגיש ליסינג מימוני בשקיפות מלאה"' },
    { name:'Bizportal', style:'biz',     quote:'"מודל מימון שמתאים גם לעצמאים ובעלי עסקים"' },
    { name:'מעריב',     style:'maariv',  quote:'"לקוחות מקבלים רכב יוקרה בהחזר חודשי נוח"' },
    { name:'גלובס',     style:'globes',  quote:'"ליווי אישי לאורך כל הדרך, מהבחירה ועד המפתח"' },
  ];

  // real customer photos (drop-in stock; swap for the client's own)
  const CUSTOMERS = [
    { img:'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=900&q=80&auto=format&fit=crop', name:'משפחת לוי', car:'Range Rover Evoque', quote:'תהליך פשוט ומהיר, ויועץ שליווה אותנו עד הסוף. יצאנו עם רכב חלומות בלי לגעת בחסכונות.' },
    { img:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&q=80&auto=format&fit=crop', name:'דנה א׳', car:'Audi Q7', quote:'חלמתי על Q7 שנים. ב‑Car2Buy תפרו לי החזר חודשי הגיוני ושירות ברמה אחרת.' },
    { img:'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&q=80&auto=format&fit=crop', name:'יואב ש׳', car:'Tesla Model 3', quote:'כעצמאי חשוב לי לשמור על תזרים. קיבלתי רכב חדש בלי לפגוע בהון של העסק.' },
    { img:'https://images.unsplash.com/photo-1557862921-37829c790f19?w=900&q=80&auto=format&fit=crop', name:'רוני ב׳', car:'BMW M5', quote:'השוויתי מול הלוואה בבנק וזה פשוט לא היה דומה — שקיפות מלאה וליווי אישי.' },
    { img:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80&auto=format&fit=crop', name:'מאיה כ׳', car:'Mercedes GLE', quote:'הצוות ענה על כל שאלה בסבלנות והתאים לי בדיוק את מבנה התשלומים. מושלם.' },
    { img:'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=900&q=80&auto=format&fit=crop', name:'אורי ל׳', car:'Porsche Panamera', quote:'מסלול הבלון הוריד לי את ההחזר ואיפשר לשדרג לדגם שלא חלמתי עליו.' },
  ];

  // second-hand inventory (יד 2)
  const USED = [
    { brand:'JAC', name:'90', trim:'PRIME 4WD', year:2026, km:7500, hand:2, price:275900, monthly:3200, cat:'ev', type:'חשמלי', color:'אפור', plate:'192-83-304', slug:'jac', img:'' },
    { brand:'Toyota', name:'קורולה קרוס', trim:'ACTIVE', year:2026, km:500, hand:2, price:175900, monthly:2040, cat:'sedan', type:'בנזין', color:'לבן', plate:'504-51-004', slug:'toyota', img:'' },
    { brand:'Chery', name:'FX', trim:'COMFORT', year:2026, km:400, hand:2, price:125000, monthly:1450, cat:'sedan', type:'בנזין', color:'כסף מטלי', plate:'617-34-004', slug:'chery', img:'' },
    { brand:'Mercedes', name:'EQC', trim:'AMG LINE', year:2024, km:18000, hand:2, price:319900, monthly:3710, cat:'ev', type:'חשמלי', color:'שחור', plate:'711-87-303', slug:'mercedes-benz', img:'' },
    { brand:'Isuzu', name:'2X4 D-MAX', trim:'LSE PREMIUM', year:2024, km:119634, hand:2, price:249900, monthly:2900, cat:'suv', type:'דיזל', color:'שחור', plate:'368-69-203', slug:'isuzu', img:'' },
    { brand:'Xpeng', name:'G6', trim:'PERF TB', year:2024, km:43800, hand:1, price:199900, monthly:2320, cat:'ev', type:'חשמלי', color:'כסף מטלי', plate:'114-97-204', slug:'xpeng', img:'' },
    { brand:'Hyundai', name:'טוסון', trim:'CREATIVE', year:2024, km:53910, hand:1, price:179900, monthly:2090, cat:'suv', type:'היברידי', color:'כחול', plate:'603-17-503', slug:'hyundai', img:'' },
    { brand:'Xpeng', name:'P7', trim:'LONG RANGE', year:2024, km:34205, hand:1, price:154900, monthly:1800, cat:'ev', type:'חשמלי', color:'שנהב לבן', plate:'594-72-303', slug:'xpeng', img:'' },
    { brand:'Nissan', name:'אקס טרייל', trim:'ACENTA TOP', year:2024, km:29000, hand:2, price:139900, monthly:1620, cat:'suv', type:'בנזין', color:'לבן', plate:'703-05-503', slug:'nissan', img:'' },
    { brand:'Lynk & Co', name:'01', trim:'LOUDER', year:2024, km:56400, hand:3, price:139900, monthly:1620, cat:'sedan', type:'היברידי', color:'שנהב לבן', plate:'314-11-403', slug:'lynk-co', img:'' },
    { brand:'Renault', name:'מגאן I', trim:'ICONIC', year:2024, km:81000, hand:2, price:92900, monthly:1080, cat:'sedan', type:'דיזל', color:'שנהב לבן', plate:'703-38-303', slug:'renault', img:'' },
    { brand:'Mercedes', name:'GLE', trim:'AMG', year:2023, km:130000, hand:1, price:310000, monthly:3600, cat:'suv', type:'בנזין', color:'שחור', plate:'418-14-603', slug:'mercedes-benz', img:'' },
    { brand:'Isuzu', name:'4X4 D-MAX', trim:'LSE PREMIUM', year:2023, km:161014, hand:2, price:239900, monthly:2780, cat:'suv', type:'דיזל', color:'אפור כהה', plate:'368-18-003', slug:'isuzu', img:'' },
    { brand:'Tesla', name:'דגם 3', trim:'LONG RANGE', year:2023, km:51671, hand:1, price:138850, monthly:1610, cat:'ev', type:'חשמלי', color:'אפור כהה מטלי', plate:'579-94-603', slug:'tesla', img:'' },
    { brand:'Chery', name:'TIGGO 7 Pro', trim:'NOBEL', year:2023, km:90000, hand:1, price:119900, monthly:1390, cat:'suv', type:'בנזין', color:'לבן', plate:'508-90-603', slug:'chery', img:'' },
    { brand:'BYD', name:'ATTO 3', trim:'COMFORT', year:2023, km:52900, hand:1, price:110000, monthly:1280, cat:'ev', type:'חשמלי', color:'אפור כהה', plate:'408-74-303', slug:'byd', img:'' },
    { brand:'BYD', name:'ATTO 3', trim:'DESIGN', year:2023, km:116950, hand:1, price:109900, monthly:1270, cat:'ev', type:'חשמלי', color:'שנהב לבן', plate:'402-85-403', slug:'byd', img:'' },
    { brand:'BYD', name:'ATTO 3', trim:'COMFORT', year:2023, km:80451, hand:1, price:109900, monthly:1270, cat:'ev', type:'חשמלי', color:'שנהב לבן', plate:'521-99-103', slug:'byd', img:'' },
    { brand:'BYD', name:'ATTO 3', trim:'COMFORT', year:2023, km:70000, hand:2, price:85000, monthly:990, cat:'ev', type:'חשמלי', color:'אפור כהה', plate:'613-87-103', slug:'byd', img:'' },
    { brand:'Mercedes', name:'S-Class', trim:'PLATINUM LON S580', year:2022, km:73000, hand:2, price:610000, monthly:7080, cat:'sedan', type:'היברידי', color:'לבן', plate:'426-18-402', slug:'mercedes-benz', img:'' },
    { brand:'Isuzu', name:'4X4 D-MAX', trim:'LS PREMIUM', year:2022, km:160015, hand:1, price:214900, monthly:2490, cat:'suv', type:'דיזל', color:'שחור', plate:'518-19-402', slug:'isuzu', img:'' },
    { brand:'Kia', name:'סורנטו', trim:'URBAN', year:2022, km:132800, hand:2, price:159900, monthly:1850, cat:'suv', type:'בנזין', color:'אפור', plate:'857-13-002', slug:'kia', img:'' },
    { brand:'Kia', name:'סורנטו', trim:'EX', year:2022, km:121615, hand:2, price:159900, monthly:1850, cat:'suv', type:'בנזין', color:'שנהב לבן', plate:'864-64-802', slug:'kia', img:'' },
    { brand:'Mitsubishi', name:'אאוטלנדר', trim:'INSTYLE', year:2022, km:53600, hand:2, price:139900, monthly:1620, cat:'suv', type:'בנזין', color:'אפור', plate:'161-40-003', slug:'mitsubishi', img:'' },
    { brand:'Skoda', name:'קודיאק', trim:'AMBITION', year:2022, km:137000, hand:2, price:129900, monthly:1510, cat:'suv', type:'בנזין', color:'שחור מטלי', plate:'891-29-802', slug:'skoda', img:'' },
    { brand:'Tesla', name:'דגם 3', trim:'RWD', year:2022, km:135080, hand:1, price:125900, monthly:1460, cat:'ev', type:'חשמלי', color:'אפור כהה מטלי', plate:'853-97-502', slug:'tesla', img:'' },
    { brand:'Hyundai', name:'טוסון', trim:'PANORAMIC', year:2022, km:85000, hand:2, price:119900, monthly:1390, cat:'suv', type:'בנזין', color:'אפור כהה מטלי', plate:'760-05-202', slug:'hyundai', img:'' },
    { brand:'Peugeot', name:'3008', trim:'PREMIUM', year:2022, km:138478, hand:2, price:77900, monthly:900, cat:'suv', type:'בנזין', color:'אפור כהה', plate:'683-01-602', slug:'peugeot', img:'' },
    { brand:'Kia', name:'פיקנטו', trim:'LX', year:2022, km:0, hand:2, price:60900, monthly:710, cat:'sedan', type:'בנזין', color:'שנהב לבן', plate:'857-01-502', slug:'kia', img:'' },
    { brand:'BMW', name:'X2', trim:'M-SPORT', year:2021, km:79919, hand:3, price:174900, monthly:2030, cat:'suv', type:'היברידי', color:'שנהב לבן', plate:'452-88-502', slug:'bmw', img:'' },
    { brand:'BMW', name:'X2', trim:'M-SPORT', year:2021, km:45222, hand:2, price:174900, monthly:2030, cat:'suv', type:'היברידי', color:'אפור כהה מטלי', plate:'452-90-702', slug:'bmw', img:'' },
    { brand:'Toyota', name:'RAV4 ארוך', trim:'E-VOLVE', year:2021, km:198000, hand:2, price:149900, monthly:1740, cat:'suv', type:'בנזין', color:'אפור כהה מטלי', plate:'437-06-702', slug:'toyota', img:'' },
    { brand:'Tesla', name:'דגם 3', trim:'LONG RANGE', year:2021, km:100145, hand:2, price:135900, monthly:1580, cat:'ev', type:'חשמלי', color:'שחור', plate:'775-59-002', slug:'tesla', img:'' },
    { brand:'Hyundai', name:'טוסון', trim:'PRESTIGE', year:2021, km:58000, hand:2, price:118900, monthly:1380, cat:'suv', type:'בנזין', color:'לבן', plate:'630-65-002', slug:'hyundai', img:'' },
    { brand:'Skoda', name:'קודיאק', trim:'AMBITION', year:2021, km:131506, hand:2, price:85000, monthly:990, cat:'suv', type:'בנזין', color:'כסף מטלי', plate:'589-02-102', slug:'skoda', img:'' },
    { brand:'SEAT', name:'ארונה', trim:'STYLE', year:2021, km:104000, hand:2, price:79900, monthly:930, cat:'suv', type:'בנזין', color:'לבן', plate:'602-14-602', slug:'seat', img:'' },
    { brand:'Jeep', name:'קומפאס', trim:'LIMITED', year:2021, km:118000, hand:2, price:60000, monthly:700, cat:'sedan', type:'בנזין', color:'שנהב לבן', plate:'267-84-602', slug:'jeep', img:'' },
    { brand:'Peugeot', name:'2008', trim:'ACTIVE', year:2021, km:215000, hand:3, price:45000, monthly:520, cat:'suv', type:'דיזל', color:'שנהב לבן', plate:'305-34-302', slug:'peugeot', img:'' },
    { brand:'Toyota', name:'RAV4 ארוך', trim:'E-XPERIENCE', year:2020, km:115000, hand:3, price:159900, monthly:1850, cat:'suv', type:'בנזין', color:'שנהב לבן', plate:'218-50-002', slug:'toyota', img:'' },
    { brand:'Skoda', name:'קודיאק', trim:'BUSINESS', year:2020, km:42084, hand:3, price:109900, monthly:1270, cat:'suv', type:'בנזין', color:'אפור מטל', plate:'317-99-102', slug:'skoda', img:'' },
    { brand:'Chevrolet', name:'בלייזר', trim:'PREMIER', year:2020, km:114000, hand:2, price:105900, monthly:1230, cat:'sedan', type:'בנזין', color:'שנהב לבן', plate:'718-24-301', slug:'chevrolet', img:'' },
    { brand:'Hyundai', name:'טוסון', trim:'PRIME PLUS', year:2020, km:105000, hand:2, price:90900, monthly:1050, cat:'suv', type:'בנזין', color:'שנהב לבן', plate:'849-01-601', slug:'hyundai', img:'' },
    { brand:'Nissan', name:'קשקאי', trim:'ACENTA', year:2020, km:201000, hand:3, price:55900, monthly:650, cat:'sedan', type:'בנזין', color:'שחור מטלי', plate:'155-86-202', slug:'nissan', img:'' },
    { brand:'BMW', name:'X5', trim:'EXECUTIVE', year:2019, km:285000, hand:4, price:149900, monthly:1740, cat:'suv', type:'דיזל', color:'שחור מטלי', plate:'342-68-101', slug:'bmw', img:'' },
    { brand:'Peugeot', name:'2008', trim:'ACTIVE GO', year:2019, km:126600, hand:2, price:30900, monthly:360, cat:'suv', type:'בנזין', color:'אפור כהה', plate:'489-08-101', slug:'peugeot', img:'' },
    { brand:'Nissan', name:'אינפיניטי', trim:'GT PR', year:2018, km:103000, hand:5, price:75000, monthly:870, cat:'sport', type:'בנזין', color:'שנהב לבן', plate:'215-88-101', slug:'nissan', img:'' },
    { brand:'Mitsubishi', name:'אאוטלנדר', trim:'INSTYLE', year:2018, km:165000, hand:2, price:50000, monthly:580, cat:'suv', type:'בנזין', color:'כחול', plate:'168-08-901', slug:'mitsubishi', img:'' },
    { brand:'Volkswagen', name:'פאסאט', trim:'COMFORTLINE', year:2018, km:257000, hand:3, price:33000, monthly:380, cat:'sedan', type:'בנזין', color:'שחור מטלי', plate:'387-12-501', slug:'volkswagen', img:'' },
    { brand:'Volvo', name:'V40', trim:'KINETIC', year:2018, km:213482, hand:2, price:25000, monthly:300, cat:'sedan', type:'בנזין', color:'שחור', plate:'570-82-701', slug:'volvo', img:'' },
    { brand:'BMW', name:'סדרה 3', trim:'EXCLUSIVE', year:2016, km:130000, hand:3, price:92900, monthly:1080, cat:'sedan', type:'היברידי', color:'לבן', plate:'26-661-30', slug:'bmw', img:'' },
    { brand:'Toyota', name:'לנד קרוזר ארוך', trim:'LUXURY', year:2015, km:350300, hand:3, price:179900, monthly:2090, cat:'sedan', type:'דיזל', color:'שנהב לבן', plate:'44-093-32', slug:'toyota', img:'' },
    { brand:'Audi', name:'A3', trim:'SHARP-SPORT', year:2015, km:146156, hand:2, price:45900, monthly:530, cat:'sedan', type:'בנזין', color:'שנהב לבן', plate:'75-247-53', slug:'audi', img:'' },
    { brand:'Mitsubishi', name:'אאוטלנדר', trim:'INSTYLE', year:2015, km:242300, hand:3, price:31000, monthly:360, cat:'suv', type:'בנזין', color:'שנהב לבן', plate:'37-713-37', slug:'mitsubishi', img:'' },
    { brand:'Chevrolet', name:'אימפלה', trim:'LTZ', year:2014, km:133000, hand:4, price:35000, monthly:410, cat:'sedan', type:'בנזין', color:'אפור כהה מטלי', plate:'30-238-32', slug:'chevrolet', img:'' },
    { brand:'Citroen', name:'ברלינגו החדשה', trim:'COMFORT', year:2013, km:345000, hand:3, price:8000, monthly:300, cat:'sedan', type:'דיזל', color:'שנהב לבן', plate:'75-636-12', slug:'citroen', img:'' },
    { brand:'Hyundai', name:'i25', trim:'INSPIRE', year:2013, km:0, hand:2, price:2000, monthly:300, cat:'sedan', type:'בנזין', color:'כסף', plate:'12-177-11', slug:'hyundai', img:'' },
  ];

  // magazine / blog
  const ARTICLES = [
    { id:'mimuni-vs-tifuli', cat:'מדריך', date:'מאי 2026', img:IMG.panamera, title:'ליסינג מימוני מול ליסינג תפעולי — מה ההבדל ומה מתאים לכם?',
      excerpt:'שני המונחים נשמעים דומה אבל ההבדל ביניהם משפיע על הכיס, על הבעלות ועל הגמישות שלכם. פירקנו הכול לגורמים כדי שתדעו בדיוק במה לבחור.',
      desc:'ליסינג מימוני מול ליסינג תפעולי: השוואה מלאה — בעלות, החזר חודשי, מס, גמישות ודוגמאות מספריות. המדריך המקצועי של Car2Buy.',
      body:[
        'אחת ההחלטות הראשונות שכל מי ששוקל רכב חדש נתקל בה היא הבחירה בין ליסינג מימוני לליסינג תפעולי. שני המונחים נשמעים כמעט זהים, אך מאחורי השמות הדומים מסתתרים שני מודלים שונים לחלוטין מבחינת בעלות, עלות חודשית, התחייבות ומס. בחירה לא נכונה עלולה לעלות עשרות אלפי שקלים לאורך התקופה — ולכן חשוב להבין את ההבדל לעומק לפני שחותמים.',
        'בשוק הישראלי, רוב הלקוחות הפרטיים למעשה מחפשים מסלול שבסופו הרכב יהיה שלהם — כלומר ליסינג מימוני — בעוד שהליסינג התפעולי נותר פופולרי בעיקר בקרב חברות וציי רכב. במדריך הזה נפרק את שני המסלולים לגורמים, עם דוגמה מספרית וטבלת השוואה מהירה.',
        { h2:'מה זה ליסינג מימוני פרטי?' },
        'ליסינג מימוני הוא למעשה מסלול רכישה בתשלומים. אתם בוחרים רכב, משלמים החזר חודשי קבוע לאורך תקופה מוסכמת (בדרך כלל 24 עד 60 חודשים), ובסופה הרכב עובר לבעלותכם המלאה. לרוב יש בסוף התקופה "תשלום בלון" — סכום גדול יחסית שנדחה לסוף ומקטין משמעותית את ההחזר החודשי השוטף. המשמעות המרכזית: כל תשלום מקרב אתכם לבעלות, ובסוף הדרך הרכב שלכם — למכור, להחליף או להמשיך לנהוג בו.',
        { img:IMG.audiSilver, caption:'ליסינג מימוני: בסוף התקופה הרכב עובר לבעלותכם המלאה.' },
        { h2:'מה זה ליסינג תפעולי?' },
        'בליסינג תפעולי אתם משלמים על השימוש ברכב, לא על הרכב עצמו. בתום התקופה מחזירים את הרכב לחברת הליסינג ולא נשארת בידיכם בעלות. בתמורה מקבלים לרוב מעטפת שירות רחבה: ביטוח, טיפולים, רכב חלופי וטיפול בתקלות — הכול בתשלום חודשי אחד. המודל פופולרי בעיקר בקרב עסקים, כי הוא הופך את הרכב להוצאה תפעולית קבועה וצפויה בלי להחזיק נכס שמאבד מערכו.',
        { h2:'ההבדלים המרכזיים — טבלה מהירה' },
        { table:{ head:['פרמטר','ליסינג מימוני','ליסינג תפעולי'], rows:[
          ['בעלות בסוף התקופה','הרכב שלכם','מחזירים את הרכב'],
          ['החזר חודשי','נמוך יותר (עם בלון)','כולל שירות מלא'],
          ['גמישות למכירה/החלפה','גבוהה — בכל שלב','כבול לחוזה'],
          ['מגבלת קילומטראז׳','אין','לרוב יש'],
          ['מתאים ל','מי שרוצה נכס בסוף','מי שרוצה ראש שקט']
        ]}},
        { h2:'דוגמה מספרית' },
        'נניח רכב במחיר 200,000 ₪. בליסינג מימוני עם מקדמה של 10% ותשלום בלון של 30% ל‑60 חודשים, ההחזר החודשי המשוער נמוך יחסית — כי חלק ניכר מהעלות נדחה לבלון בסוף. בליסינג תפעולי ההחזר עשוי להיראות דומה או גבוה יותר, אך הוא כולל ביטוח וטיפולים — ובסוף התקופה אין בידיכם רכב. הגרף ממחיש את החלוקה העקרונית של עלות חודשית טיפוסית בכל מסלול:',
        { chart:{ title:'חלוקת עלות חודשית עקרונית (המחשה, ₪ לחודש)', unit:' ₪', bars:[
          { label:'מימוני — הרכב', value:2300, hl:true },
          { label:'תפעולי — שימוש', value:1700 },
          { label:'תפעולי — שירות וביטוח', value:900 }
        ], note:'המחשה בלבד. הנתונים לדוגמה ומשתנים לפי הרכב, התקופה, המקדמה והריבית בפועל.' }},
        { h2:'שיקולי מס — נקודה קריטית לעצמאים' },
        'עבור עצמאים ובעלי עסקים יש להבדל בין המסלולים גם השלכות מס. בליסינג תפעולי ההוצאה החודשית מוכרת לרוב כהוצאה שוטפת, בעוד שבליסינג מימוני הרכב נרשם כנכס ומופחת לאורך זמן. הבחירה תלויה במבנה העסק ובהיקף השימוש העסקי — ולכן תמיד מומלץ להתייעץ עם רואה החשבון לפני שמחליטים.',
        { quote:'הכלל הפשוט: רוצים נכס בסוף הדרך — מימוני. רוצים ראש שקט בלי בעלות — תפעולי.' },
        'ב‑Car2Buy אנחנו מתמחים בליסינג מימוני פרטי ומלווים אתכם אישית בבחירת המסלול, התקופה, המקדמה ותשלום הבלון שמתאימים בדיוק לכם. השתמשו במחשבון ההחזר החודשי כדי לראות בזמן אמת איך כל פרמטר משפיע — או השאירו פרטים ויועץ אישי יחזור אליכם.'
      ] },
    { id:'5-mistakes', cat:'טיפים', date:'מאי 2026', img:IMG.audiBlack, title:'5 טעויות שכדאי להימנע מהן בליסינג רכב',
      excerpt:'מההחזר החודשי ועד תשלום הבלון — הטעויות הנפוצות שעולות ללקוחות כסף, ואיך להימנע מכל אחת מהן.',
      desc:'5 הטעויות הנפוצות בליסינג רכב ואיך להימנע מהן: החזר חודשי, תשלום בלון, ביטוח ואחזקה, התאמת תקופה וירידת ערך. מדריך Car2Buy.',
      body:[
        'ליסינג חכם מתחיל בהבנה של מה בדיוק אתם חותמים עליו. עסקת רכב היא אחת ההתחייבויות הפיננסיות הגדולות של משק בית, וטעות קטנה בשלב החתימה עלולה להצטבר לאלפי שקלים לאורך התקופה. ריכזנו את חמש הטעויות הנפוצות ביותר שאנחנו רואים — ואיך להימנע מהן בקלות.',
        { h2:'טעות 1: להסתכל רק על ההחזר החודשי' },
        'החזר חודשי נמוך נראה מפתה, אבל הוא לא מספר את כל הסיפור. החזר נמוך שמושג באמצעות תשלום בלון גבוה בסוף התקופה עלול להפתיע אתכם בהמשך. תמיד בדקו את העלות הכוללת של העסקה — סך כל התשלומים לאורך התקופה בתוספת הבלון — ולא רק את המספר החודשי.',
        { h2:'טעות 2: להזניח את הביטוח והאחזקה' },
        'רכב עולה כסף גם אחרי החתימה: ביטוח חובה ומקיף, טסט, טיפולים ובלאי. לקוחות רבים מתמקדים רק בהחזר ושוכחים לתקצב את המעטפת. ב‑Car2Buy אפשר לאגד את הכול בתשלום חודשי אחד וברור — כך אין הפתעות באמצע הדרך.',
        { img:IMG.silverRoad, caption:'עלות אמיתית של רכב = החזר + ביטוח + אחזקה + דלק/טעינה.' },
        { h2:'טעות 3: לא להתאים את התקופה ליכולת' },
        'תקופה ארוכה מדי מקטינה את ההחזר אבל מאריכה את ההתחייבות ומגדילה את הריבית המצטברת; תקופה קצרה מדי מכבידה על התזרים החודשי. ההתאמה הנכונה היא כזו שמשאירה לכם אוויר לנשום בתקציב החודשי בלי לשלם ריבית מיותרת.',
        { h2:'טעות 4: להתעלם מירידת הערך' },
        'כל רכב מאבד מערכו עם הזמן, והקצב הגבוה ביותר הוא בשנים הראשונות. התעלמות מכך פוגעת בעסקת ההחלפה או המכירה הבאה. הבנה של עקומת ירידת הערך עוזרת לתזמן נכון את ההחלפה ולבחור דגם ששומר על ערכו.',
        { chart:{ title:'ירידת ערך טיפוסית של רכב חדש (המחשה, % מהמחיר)', unit:'%', bars:[
          { label:'לאחר שנה','value':82 },
          { label:'לאחר שנתיים','value':70 },
          { label:'לאחר 3 שנים','value':60 },
          { label:'לאחר 4 שנים','value':52 },
          { label:'לאחר 5 שנים','value':45 }
        ], note:'המחשה כללית. הקצב משתנה משמעותית לפי דגם, ביקוש, קילומטראז׳ ומצב הרכב.' }},
        { h2:'טעות 5: לא להשוות הצעות' },
        'ההצעה הראשונה כמעט אף פעם אינה האחרונה. ריבית, מקדמה, מבנה בלון ומעטפת שירות משתנים בין הגופים — והפרש של אחוז בריבית מצטבר לסכום ניכר. השוואה מסודרת (או ליווי של גורם שעושה אותה עבורכם) מבטיחה שאתם לא משלמים יותר מהנדרש.',
        { h2:'בונוס: איך מזהים עסקה באמת טובה' },
        'עסקה טובה מזוהה בכמה סימנים ברורים: הצעה שקופה שמפרטת את כל הרכיבים (מחיר, מקדמה, בלון, ריבית ועלות כוללת) בלי כוכביות; ריבית שמשקפת את דירוג האשראי שלכם ולא מנופחת; מעטפת שירות שכתובה במפורש בחוזה; וגמישות לצאת או להחליף בעתיד. אם מוכר לוחץ עליכם לחתום "רק היום" בלי לתת לכם לקרוא — זה דגל אדום. עסקה נכונה מרגישה ברורה, לא לחוצה.',
        'עוד עצה מעשית: לפני החתימה, בקשו לראות את לוח הסילוקין המלא — פירוט של כל תשלום חודשי לאורך התקופה. הוא חושף מיד את העלות האמיתית ומונע הפתעות. לקוח שמבין את המספרים הוא לקוח ששולט בעסקה.',
        { quote:'עסקה טובה נמדדת בעלות הכוללת ובגמישות — לא רק במספר שמופיע בשורת ההחזר החודשי.' },
        'ב‑Car2Buy אנחנו עובדים מול כל היבואנים וכל גופי המימון, משווים עבורכם את התנאים ומתחייבים להחזר ולריבית הטובים ביותר שאפשר — בשקיפות מלאה ובליווי אישי לאורך כל הדרך.'
      ] },
    { id:'ev-worth-it', cat:'חשמלי', date:'אפריל 2026', img:IMG.teslaWhite, title:'רכב חשמלי בליסינג — האם זה באמת משתלם?',
      excerpt:'עלויות הטעינה, האחזקה, ירידת הערך והטבות המס. בדקנו לעומק האם רכב חשמלי בליסינג מימוני חוסך לכם כסף.',
      desc:'האם רכב חשמלי בליסינג משתלם? השוואת עלות תפעול חשמלי מול בנזין, אחזקה, ירידת ערך והטבות מס — עם דוגמאות. מדריך Car2Buy.',
      body:[
        'רכבים חשמליים הפכו בשנים האחרונות לאחת הקטגוריות הצומחות ביותר בשוק הישראלי, ודגמים חדשים — בעיקר מהיצרנים הסיניים — הורידו את מחיר הכניסה משמעותית. השילוב עם ליסינג מימוני יכול להיות משתלם במיוחד, אבל כדאי להבין את התמונה המלאה לפני שמחליטים.',
        { h2:'היתרון הגדול: עלות תפעול נמוכה' },
        'היתרון הבולט של רכב חשמלי הוא עלות התפעול. טעינה חשמלית, במיוחד בבית ובשעות הזול, זולה משמעותית מתדלוק בבנזין. בנוסף, למנוע חשמלי יש הרבה פחות חלקים נעים — אין החלפות שמן, פחות בלאי מכני ובלימה רגנרטיבית ששומרת על הבלמים. התוצאה: חשבון אחזקה שנתי נמוך יותר.',
        { chart:{ title:'עלות תפעול שנתית משוערת — חשמלי מול בנזין (המחשה, ₪)', unit:' ₪', bars:[
          { label:'חשמלי — טעינה','value':3500, hl:true },
          { label:'בנזין — דלק','value':11000 },
          { label:'חשמלי — אחזקה','value':1200, hl:true },
          { label:'בנזין — אחזקה','value':3000 }
        ], note:'המחשה ל‑15,000 ק"מ בשנה. תלוי בסוג הטעינה (בית/ציבורי), במחיר הדלק וברכב.' }},
        { h2:'הטבות המס — יתרון שהולך ומצטמצם' },
        'רכבים חשמליים נהנו לאורך השנים ממס קנייה מופחת, מה שהוזיל את מחירם ואת ההחזר החודשי. ההטבה הזו הולכת ומצטמצמת בהדרגה לפי מדיניות המדינה, ולכן חשוב לבדוק מה בדיוק חל בזמן הרכישה. גם אחרי הצמצום, סך העלות של רכב חשמלי לאורך תקופת הליסינג נותר לרוב תחרותי מאוד.',
        { img:IMG.teslaFront, caption:'טעינה ביתית בשעות הזול היא המפתח לחיסכון האמיתי ברכב חשמלי.' },
        { h2:'הדברים שחשוב לקחת בחשבון' },
        { ul:[
          'תשתית טעינה — האם יש לכם אפשרות להתקין עמדת טעינה ביתית? זה משנה את כדאיות העסקה.',
          'ירידת ערך הסוללה — טכנולוגיה מתקדמת מהר, ודגמים חדשים עשויים להשפיע על ערך המכירה.',
          'טווח אמיתי מול מוצהר — הטווח יורד בנסיעה מהירה ובחורף; בדקו את הטווח הריאלי לצרכים שלכם.',
          'זמני טעינה — טעינה מהירה חוסכת זמן אך יקרה יותר מטעינה ביתית.'
        ]},
        { h2:'איפה ליסינג מימוני נכנס לתמונה' },
        'דווקא בגלל אי‑הוודאות סביב ירידת ערך הסוללה ותשתית הטעינה, ליסינג מימוני עם תשלום בלון נותן יתרון: הוא מקטין את ההחזר החודשי ומשאיר לכם גמישות בסוף התקופה — להחליט אם לרכוש את הרכב סופית, למחזר את הבלון או להחליף לדגם חדש יותר. כך אתם נהנים מהחיסכון התפעולי בלי להתחייב מראש לטווח הארוך.',
        { h2:'צפו: מבחן דרכים לרכב חשמלי' },
        'כדי לראות איך זה מרגיש בפועל — הנה סקירה בעברית של אחד הדגמים החשמליים הפופולריים בשוק, עם התייחסות לטווח, לחוויית הנהיגה ולתא הפנימי:',
        { video:'GDuSYGjHJa8', caption:'מבחן דרכים בעברית לרכב חשמלי — טווח, ביצועים ותא פנימי.' },
        { h2:'למי רכב חשמלי הכי משתלם?' },
        'רכב חשמלי מגיע לשיא הכדאיות שלו אצל שלושה פרופילים: מי שיכול להתקין עמדת טעינה ביתית ולטעון בשעות הזול; מי שנוסע הרבה קילומטרים בשנה, כך שההפרש בעלות ה"דלק" מצטבר במהירות; ומי שנוהג בעיקר בעיר, שם הבלימה הרגנרטיבית והשקט של המנוע החשמלי בולטים במיוחד. לעומת זאת, למי שנוסע מעט מאוד, אין גישה לטעינה ביתית, או עושה בעיקר נסיעות בין‑עירוניות ארוכות ורצופות — כדאי לשקול היברידי כפשרה מצוינת.',
        'שאלה שחוזרת הרבה היא "מה עם החורף?". בטמפרטורות נמוכות הטווח אכן יורד, ולכן חשוב לבחור דגם עם מרווח טווח נוח מעל הצורך היומיומי שלכם, ולא לתכנן על הקצה. תכנון נכון של הטווח הופך את החוויה לחלקה גם בימים קרים.',
        { quote:'רכב חשמלי חוסך הכי הרבה למי שטוען בבית ונוסע הרבה — שם ההפרש מול בנזין מצטבר במהירות.' },
        'בקטלוג של Car2Buy תמצאו מגוון רחב של דגמים חשמליים בכל טווח מחירים, ובמחשבון תוכלו לראות בדיוק כמה יעלה לכם ההחזר החודשי — כולל קיזוז הרכב הישן בטרייד‑אין.'
      ] },
    { id:'monthly-explained', cat:'מימון', date:'אפריל 2026', img:IMG.amgSilver, title:'איך נקבע ההחזר החודשי שלכם? פירוק מלא של הנוסחה',
      excerpt:'מחיר הרכב, המקדמה, תשלום הבלון, התקופה והריבית — חמישה פרמטרים שקובעים את ההחזר. נסביר איך כל אחד עובד, עם דוגמאות.',
      desc:'איך מחושב ההחזר החודשי בליסינג מימוני? הסבר מלא על מקדמה, תשלום בלון, תקופה וריבית — כולל דוגמאות מספריות. Car2Buy.',
      body:[
        'ההחזר החודשי בליסינג מימוני אינו מספר אקראי — הוא תוצאה של חמישה משתנים שאתם שולטים ברובם. כשמבינים איך כל אחד מהם משפיע, אפשר לבנות החזר שמתאים בדיוק ליכולת ולסגנון החיים. נפרק את הנוסחה שלב אחר שלב.',
        { h2:'1. מחיר הרכב — נקודת הפתיחה' },
        'הבסיס לכל חישוב הוא מחיר הרכב. ככל שהרכב יקר יותר, הסכום שצריך לממן גדול יותר וההחזר עולה בהתאם. שימו לב שלמחיר המחירון מתווספות לעיתים עלויות נלוות (רישוי ראשוני, אבזור), ולכן כדאי לקבל הצעה שקופה שכוללת את הכול.',
        { h2:'2. המקדמה — כמה משלמים בכניסה' },
        'המקדמה היא הסכום ההתחלתי. ב‑Car2Buy אפשר להתחיל גם ממקדמה של 0 ₪. ככל שהמקדמה גבוהה יותר, הסכום שנותר לממן קטן וההחזר יורד — אך אתם מוציאים יותר כסף מראש. מקדמה נמוכה שומרת על הנזילות שלכם אך מעלה את ההחזר.',
        { h2:'3. תשלום הבלון (הערך השיורי)' },
        'תשלום הבלון הוא סכום גדול שנדחה לסוף התקופה, והוא המנוף המרכזי להקטנת ההחזר החודשי. הגרף הבא מראה איך אותו רכב בדיוק — במחיר 200,000 ₪, ל‑60 חודשים — משנה את ההחזר החודשי לפי גובה הבלון:',
        { chart:{ title:'החזר חודשי לפי גובה הבלון (רכב 200 אלף ₪, 60 חודשים)', unit:' ₪', bars:[
          { label:'בלי בלון','value':3700 },
          { label:'בלון 20%','value':3050 },
          { label:'בלון 30%','value':2750, hl:true },
          { label:'בלון 40%','value':2450 }
        ], note:'המחשה בריבית משוערת. בסוף התקופה יש להסדיר את סכום הבלון (רכישה, מחזור או החלפה).' }},
        { h2:'4. תקופת ההחזר' },
        'התקופה נעה בדרך כלל בין 24 ל‑60 חודשים. תקופה ארוכה יותר פורסת את הסכום על יותר תשלומים ולכן מקטינה את ההחזר החודשי — אך מאריכה את ההתחייבות ומגדילה את הריבית המצטברת. תקופה קצרה עושה את ההפך: החזר גבוה יותר אך עלות כוללת נמוכה יותר.',
        { h2:'5. הריבית' },
        'הריבית נקבעת לפי דירוג האשראי שלכם, סוג הרכב ותנאי המימון. היא מתווספת לסכום שמממנים ומשפיעה ישירות על ההחזר ועל העלות הכוללת. דירוג אשראי טוב יכול להוזיל משמעותית את העסקה — ולכן שווה לבדוק את מצבכם מראש ולתת לנו למקסם עבורכם את התנאים.',
        { h2:'איך מורידים את ההחזר בלי לפגוע בעצמכם' },
        'יש כמה מנופים לגיטימיים להורדת ההחזר החודשי, וכדאי להכיר את המחיר של כל אחד. הגדלת המקדמה מורידה את ההחזר אך דורשת יותר כסף מראש. הגדלת הבלון מורידה את ההחזר השוטף אך משאירה סכום גדול לסוף. הארכת התקופה מקטינה את ההחזר אך מגדילה את הריבית המצטברת. שיפור דירוג האשראי לפני העסקה — למשל סגירת הלוואות קטנות פתוחות — יכול להוזיל את הריבית בלי שום פשרה. השילוב הנכון הוא אישי, ותלוי בשאלה האם חשוב לכם יותר תזרים חודשי נוח או עלות כוללת נמוכה.',
        'טעות נפוצה היא "לרדוף" אחרי ההחזר הנמוך ביותר בלי לשים לב לעלות הכוללת. לפעמים תוספת קטנה בהחזר החודשי חוסכת אלפי שקלים בסוף הדרך. לכן שווה תמיד להסתכל על שני המספרים יחד — החודשי והכולל.',
        { quote:'שני אנשים שקונים את אותו רכב יכולים לשלם החזר חודשי שונה לגמרי — הכול תלוי בהרכב שבניתם.' },
        'הדרך הטובה ביותר להבין את זה היא פשוט לנסות: היכנסו למחשבון ההחזר החודשי שלנו, שחקו עם המקדמה, הבלון והתקופה, וראו איך כל שינוי משפיע בזמן אמת. וכשתהיו מוכנים — יועץ אישי יבנה אתכם את התמהיל המדויק.'
      ] },
    { id:'tradein-tips', cat:'טריד-אין', date:'מרץ 2026', img:IMG.silverRoad, title:'טריד-אין: איך לקבל את המחיר הטוב ביותר על הרכב הישן',
      excerpt:'הכנה נכונה, תיעוד טיפולים ותזמון חכם — כך תמקסמו את שווי הטרייד‑אין ותורידו את עלות הרכב הבא.',
      desc:'איך למקסם את שווי הטרייד‑אין: הכנת הרכב, תיעוד היסטוריית טיפולים, תזמון החלפה והערכת שווי מיידית. מדריך Car2Buy.',
      body:[
        'עסקת טרייד‑אין טובה יכולה להוריד עשרות אלפי שקלים מעלות הרכב הבא שלכם — בלי הטרחה של פרסום מודעה, מפגשים עם קונים ומשא ומתן מתיש. אבל השווי שתקבלו תלוי בכמה דברים שבשליטתכם. הנה איך להתכונן נכון.',
        { h2:'1. תעדו את היסטוריית הטיפולים' },
        'רכב עם רישום טיפולים מסודר במוסך מורשה שווה יותר, כי הוא משדר אמינות ומפחית את הסיכון לקונה הבא. אספו את חשבוניות הטיפולים, ספר הרכב וכל תיעוד של תיקונים והחלפות. שקיפות מלאה על מצב הרכב כמעט תמיד עובדת לטובתכם בהערכת השווי.',
        { h2:'2. טפלו בפגמים הקוסמטיים הקטנים' },
        'שריטות, פנסים עמומים, כתמים בריפוד או צמיגים שחוקים משפיעים על הרושם הראשוני — ולכן על המחיר. פוליש בסיסי, ניקוי פנים יסודי ותיקון פגמים קטנים הם השקעה קטנה שמחזירה את עצמה. רכב שנראה מטופל נתפס כמטופל.',
        { img:IMG.bmwSedan, caption:'רכב נקי, מטופל ומתועד מקבל הערכת שווי גבוהה יותר.' },
        { h2:'3. הבינו את השפעת התזמון' },
        'שווי הרכב יורד עם הגיל, הקילומטראז׳ ולעיתים עם החלפת דור בדגם. ככל שתחליפו מוקדם יותר — לפני קפיצת קילומטראז׳ משמעותית או לפני שהדגם מתחדש — כך תשמרו על יותר ערך. גם עונתיות משפיעה: ביקוש לרכבי פנאי, למשל, משתנה לאורך השנה. הגרף ממחיש כמה מהר נשחק הערך בשנים הראשונות — ולמה תזמון ההחלפה הוא כסף:',
        { chart:{ title:'שווי משוער של רכב לאורך זמן (המחשה, % מהמחיר המקורי)', unit:'%', bars:[
          { label:'חדש','value':100 },
          { label:'שנה','value':82, hl:true },
          { label:'שנתיים','value':70 },
          { label:'3 שנים','value':60 },
          { label:'5 שנים','value':45 }
        ], note:'המחשה כללית. הקצב משתנה לפי דגם, ביקוש, קילומטראז׳ ומצב הרכב.' }},
        'הנקודה החשובה: מרבית ירידת הערך מתרחשת בשנים הראשונות. מי שמחזיק ברכב "עד הסוף" סופג את מלוא השחיקה, בעוד שהחלפה מתוזמנת נכון — למשל בשילוב עם עסקת ליסינג חדשה — ממקסמת את הערך שנשאר ומגלגלת אותו קדימה לרכב הבא.',
        { h2:'4. קבלו הערכת שווי אובייקטיבית' },
        'לפני שאתם ניגשים לעסקה, כדאי לדעת את טווח השווי הריאלי של הרכב. מחשבון הטרייד‑אין של Car2Buy מבוסס על נתוני רשות הרישוי ונותן הערכה ראשונית מיידית לפי מספר הרישוי — כך אתם מגיעים למשא ומתן מתוך ידע, לא מתוך ניחוש.',
        { table:{ head:['מה משפיע על השווי','כיוון ההשפעה'], rows:[
          ['היסטוריית טיפולים מסודרת','מעלה'],
          ['קילומטראז׳ נמוך','מעלה'],
          ['מצב חיצוני ופנימי','מעלה'],
          ['יד ראשונה','מעלה'],
          ['גיל הרכב ודור ישן','מוריד']
        ]}},
        { h2:'מתי טרייד-אין עדיף על מכירה עצמאית?' },
        'מכירה עצמאית ביד 2 עשויה להניב לעיתים מחיר גבוה מעט יותר, אבל היא כרוכה בזמן, בטרחה ובסיכון: צילום ופרסום מודעה, שיחות עם קונים, מפגשים, מיקוח, טיפול בהעברת בעלות ולעיתים גם בעיות תשלום. טרייד‑אין, לעומת זאת, פוטר אתכם מכל זה — השווי מקוזז ישירות מהעסקה החדשה, ההעברה מטופלת עבורכם, והכול נסגר במקום אחד. עבור רוב האנשים, ההפרש הקטן במחיר שווה בהחלט את החיסכון בזמן ובעוגמת הנפש.',
        'עוד יתרון שפחות חושבים עליו: בטרייד‑אין אתם ממירים את הרכב הישן ל"מקדמה" מבלי להוציא כסף מהכיס. זה מוריד את הסכום שצריך לממן, ובכך מקטין ישירות את ההחזר החודשי על הרכב החדש — יתרון תזרימי משמעותי.',
        { quote:'הרכב הישן הוא חלק מהמקדמה של הרכב החדש — כל שקל בשווי שלו יורד ישירות מההחזר החודשי הבא.' },
        'ב‑Car2Buy אנחנו מקזזים את שווי הרכב הישן ישירות מהעסקה החדשה — בלי טרחה, בלי מודעות יד 2 ובלי אנשים זרים שמגיעים לבדוק את הרכב. בדקו את השווי במחשבון הטרייד‑אין והתחילו את הדרך לרכב הבא.'
      ] },
    { id:'first-car', cat:'מדריך', date:'מרץ 2026', img:IMG.evoque, title:'מדריך לרכב הראשון שלכם בליסינג מימוני',
      excerpt:'צעירים ונהגים חדשים — כל מה שצריך לדעת כדי לצאת לכביש ברכב חדש בלי להסתבך ובלי הון התחלתי.',
      desc:'מדריך לרכב הראשון בליסינג מימוני: הגדרת תקציב חודשי מלא, בחירת רכב מתאים, ביטוח לנהג חדש ואישור מימון. Car2Buy.',
      body:[
        'הרכב הראשון הוא רגע מרגש — עצמאות, גמישות והרבה כביש פתוח. ליסינג מימוני יכול להפוך את החלום הזה לנגיש גם בלי חיסכון גדול, אבל כדי לצאת לדרך בראש שקט חשוב להיערך נכון. ריכזנו את כל מה שנהג חדש צריך לדעת.',
        { h2:'1. הגדירו תקציב חודשי מלא — לא רק ההחזר' },
        'הטעות הנפוצה ביותר של נהגים חדשים היא לחשב רק את ההחזר החודשי ולשכוח את שאר ההוצאות. רכב עולה כסף גם מעבר לתשלום החודשי: ביטוח (שיקר יותר לנהג צעיר), דלק או טעינה, טסט, טיפולים ובלאי. הנה חלוקה טיפוסית של תקציב חודשי לרכב ראשון:',
        { chart:{ title:'תקציב חודשי טיפוסי לרכב ראשון (המחשה, ₪)', unit:' ₪', bars:[
          { label:'החזר חודשי','value':1500, hl:true },
          { label:'ביטוח','value':650 },
          { label:'דלק/טעינה','value':550 },
          { label:'אחזקה ובלאי','value':300 }
        ], note:'המחשה בלבד. ביטוח לנהג חדש וצעיר עשוי להיות גבוה יותר; הסכומים משתנים לפי הרכב והשימוש.' }},
        { h2:'2. בחרו רכב שמתאים לצרכים — לא רק לחלום' },
        'רכב ראשון כדאי שיהיה חסכוני, אמין וקל לתחזוקה. רכב קומפקטי או קרוסאובר קטן עם צריכת דלק נמוכה (או חשמלי לטעינה ביתית) יחסוך לכם כסף בכל חודש. מערכות בטיחות מתקדמות — בלימת חירום, התרעת סטייה מנתיב ובקרת שיוט — חשובות במיוחד לנהג חדש.',
        { img:IMG.suvSilver, caption:'קרוסאובר קומפקטי: איזון טוב בין נוחות, בטיחות ועלות תפעול לנהג חדש.' },
        { h2:'3. ביטוח לנהג חדש' },
        'ביטוח לנהג צעיר וחדש יקר יותר, אך יש דרכים להוזיל: מגבלת גיל נהגים בפוליסה, השתתפות עצמית מותאמת ובחירת רכב בקבוצת ביטוח נמוכה. ב‑Car2Buy אפשר לאגד את הביטוח והרישוי לתוך מעטפת אחת וברורה — כך אין הפתעות ואתם יודעים בדיוק מה ההוצאה החודשית הכוללת.',
        { h2:'4. אישור מימון — גם בלי היסטוריית אשראי' },
        'נהגים צעירים חוששים לעיתים שלא יאושרו למימון בגלל היעדר היסטוריית אשראי. בפועל, אישור עקרוני ניתן במקרים רבים תוך 24 שעות, ולעיתים בעזרת ערב או מקדמה מותאמת. הצוות שלנו יודע לבנות מסלול שמתאים גם למי שרק בתחילת הדרך הפיננסית.',
        { h2:'טעויות נפוצות של נהגים חדשים' },
        'שלוש טעויות חוזרות אצל נהגים ראשונים: הראשונה — לבחור רכב "חלומי" גדול וחזק מדי, שגורר ביטוח יקר, צריכת דלק גבוהה ועלות אחזקה מכבידה. השנייה — להתעלם מקבוצת הביטוח של הרכב; שני דגמים במחיר דומה יכולים להוביל לפרמיות שונות מאוד. השלישית — לחתום על עסקה בלי לקרוא את הסעיפים הקטנים, כמו מגבלות קילומטראז׳ או עלויות יציאה מוקדמת. מודעות פשוטה לשלוש הנקודות האלה חוסכת כסף ועוגמת נפש כבר מהחודש הראשון.',
        'טיפ אחרון: התחילו בצניעות. רכב ראשון אמין וחסכוני בונה לכם היסטוריית נהיגה וביטוח נקייה, שמוזילה את העסקאות הבאות שלכם. אפשר תמיד לשדרג בהמשך — ודווקא ליסינג מימוני עם גמישות בסוף התקופה הופך את השדרוג הזה לפשוט.',
        { quote:'רכב ראשון חכם הוא כזה שאתם יכולים להרשות לעצמכם בכל חודש — לא רק ביום הקנייה.' },
        'מוכנים לצאת לדרך? עברו לקטלוג הדגמים, בחרו רכב שמתאים לתקציב ולסגנון שלכם, וקבלו הצעה אישית עם החזר חודשי ברור. יועץ של Car2Buy ילווה אתכם צעד אחר צעד — מהבחירה ועד המפתח.'
      ] },
  ];

  window.Car2Buy = {
    IMG, MODELS, CATS, BRANDS, BRANDS_ALL, BRAND_HE, FUELS, USED, ARTICLES, PRESS, CUSTOMERS, TESTIMONIALS: CUSTOMERS, NIS, LOGO, LOGO_HE, brandEn,
    gallery,
    byId: (id) => MODELS.find((m) => m.id === id),
    card(m) {
      const C2B = (typeof window !== 'undefined' && window.Car2Buy) || {};
      const dispB = C2B.dispBrand ? C2B.dispBrand(m.brand) : m.brand;
      const dispM = C2B.enModel ? C2B.enModel(m.name) : m.name;
      const dispFull = C2B.enName ? C2B.enName(m) : (m.brand + ' ' + m.name);
      return `<article class="car reveal" data-cat="${m.cat}" data-brand="${m.brand}" data-fuel="${m.fuel}" data-monthly="${m.monthly}" data-name="${dispFull}">
        <button class="car-compare" type="button" data-id="${m.id}">+ השוואה</button>
        <a class="car-hit" href="car.html?car=${m.id}">
          <div class="car-ph car-ph-shot"><img loading="lazy" src="${m.img}" alt="${dispFull}">
            ${m.tag ? `<span class="car-badge">${m.tag}</span>` : ''}
            ${LOGO_SLUG[m.brand] ? `<span class="brand-logo car-logo-badge"><img loading="lazy" src="${LOGO(m.brand)}" alt="${dispB}" onerror="this.closest('.brand-logo').style.display='none'"></span>` : ''}
            ${FAST.has(m.id) ? '<span class="car-fast">⚡ אספקה מהירה</span>' : ''}</div>
          <div class="car-body">
            <div class="car-tier">${m.type}</div>
            <h3>${dispB} ${dispM}</h3>
            <div class="car-spec">
              <span><b>${m.power}</b> כ״ס</span><span class="dot"></span>
              <span>הנעה ${m.drive}</span><span class="dot"></span>
              <span>${m.fuel}</span>
            </div>
            <div class="car-meta">
              <div class="car-price"><span class="cp-lbl">החזר חודשי משוער החל מ‑</span>${NIS(m.monthly)}</div>
              <div class="car-list">מחירון ${NIS(m.list)}</div>
            </div>
          </div>
        </a>
        <div class="car-actions">
          <a class="car-cta-main" href="car.html?car=${m.id}">כמה יעלה לי להפוך את זה למציאות?</a>
        </div>
      </article>`;
    },
    usedCard(u, i) {
      const pad = (n) => String(n).padStart(2, '0');
      const testDate = pad((u.km % 27) + 1) + '/' + pad(((u.hand + (u.km % 9)) % 12) + 1) + '/2027';
      const photos = (u.km % 8) + 5;
      const isEV = u.type === 'חשמלי', isHyb = u.type === 'היברידי', isDsl = u.type === 'דיזל';
      const fuelCls = isEV ? 'ev' : isHyb ? 'hyb' : 'gas';
      const fuelTxt = isEV ? 'חשמלי' : isHyb ? 'היברידי' : isDsl ? 'דיזל' : 'בנזין';
      const fuelIc = isEV
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>'
        : isHyb
          ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z"/></svg>';
      const href = 'used-car.html?car=u' + i;
      return `<article class="car ucard reveal" data-brand="${u.brand}" data-monthly="${u.monthly}" data-km="${u.km}" data-name="${u.brand} ${u.name}" data-cat="${u.cat}" data-hand="${u.hand}" data-type="${u.type}">
        <a class="uc-hit" href="${href}">
          <div class="uc-ph${u.img ? '' : ' uc-ph-empty'}">
            ${u.img
              ? `<img loading="lazy" src="${u.img}" alt="${u.brand} ${u.name}">`
              : `${u.slug ? `<img class="uc-ph-logo" loading="lazy" src="https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/${u.slug}.png" alt="${u.brand}" onerror="this.remove()">` : ''}<span class="uc-ph-model">${u.brand} ${u.name}</span><span class="uc-ph-soon">📷 תמונות בקרוב</span>`}
            <span class="uc-fuel ${fuelCls}">${fuelIc}${fuelTxt}</span>
            ${u.img ? `<span class="uc-media">
              <span class="uc-chip">וידאו <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
              <span class="uc-chip">${photos} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 17-5-5-9 7"/></svg></span>
            </span>` : ''}
          </div>
          <div class="uc-name">${u.brand} ${u.name}</div>
        </a>
        <a class="uc-immediate" href="${href}">מסירה מידית!</a>
        <div class="uc-specs">
          <div class="uc-row"><span class="rk">שנתון</span><span class="rv">${u.year}</span></div>
          <div class="uc-row"><span class="rk">ק״מ</span><span class="rv">${u.km.toLocaleString('en-US')}</span></div>
          <div class="uc-row"><span class="rk">יד</span><span class="rv">${pad(u.hand)}</span></div>
          <div class="uc-row"><span class="rk">טסט עד</span><span class="rv">${testDate}</span></div>
        </div>
        <div class="uc-foot">
          <a class="uc-pay" href="${href}">החזר חודשי החל מ- ${NIS(u.monthly)}</a>
          <button type="button" class="uc-fav" aria-label="אהבתי"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>אהבתי!</button>
        </div>
      </article>`;
    },
    articleCard(a) {
      return `<a class="post reveal" href="article.html?id=${a.id}">
        <div class="post-img"><img loading="lazy" src="${a.img}" alt="${a.title}"><span class="post-cat">${a.cat}</span></div>
        <div class="post-body">
          <div class="post-date">${a.date}</div>
          <h3>${a.title}</h3>
          <p>${a.excerpt}</p>
          <span class="post-cta">קראו עוד ←</span>
        </div>
      </a>`;
    },
    dirCard(b) {
      const mono = (b.he || b.name).replace(/[^A-Za-z\u0590-\u05FF]/g, '').charAt(0) || '•';
      const img = b.slug ? `<img loading="lazy" src="${LOGO(b.name)}" alt="${b.name}" onerror="this.remove()">` : '';
      return `<a class="dir-item" href="brand.html?brand=${encodeURIComponent(b.he || b.name)}">
        <span class="dir-name">${b.he || b.name}</span>
        <span class="dir-logo">${img}<b class="dir-mono">${mono}</b></span>
      </a>`;
    }
  };
})();
