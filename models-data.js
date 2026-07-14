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
  const LOGO_LOCAL = { KGM: 'images/brands/kgm.svg', Jaecoo: 'images/brands/jaecoo.svg', Skywell: 'images/brands/skywell.png' };
  const LOGO = (brand) => LOGO_LOCAL[brand] || `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/${LOGO_SLUG[brand] || ''}.png`;

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
    { brand:'BMW',        name:'320i M-Sport',     year:2021, km:62000,  hand:2, price:165000, monthly:1890, cat:'sedan', type:'סדאן',     img:IMG.bmwGT },
    { brand:'BMW',        name:'X3 xDrive',        year:2020, km:84000,  hand:2, price:178000, monthly:2090, cat:'suv',   type:'רכב פנאי', img:IMG.bmwBlack },
    { brand:'BMW',        name:'430i Coupé',       year:2022, km:38000,  hand:1, price:215000, monthly:2490, cat:'sport', type:'קופה',     img:IMG.bmw4 },
    { brand:'Audi',       name:'A5 Sportback',     year:2020, km:78000,  hand:1, price:172000, monthly:1990, cat:'sedan', type:'סדאן',     img:IMG.audiSilver },
    { brand:'Audi',       name:'Q5 quattro',       year:2021, km:69000,  hand:1, price:198000, monthly:2290, cat:'suv',   type:'רכב פנאי', img:IMG.suvSilver },
    { brand:'Audi',       name:'A3 Sedan',         year:2019, km:112000, hand:2, price:128000, monthly:1540, cat:'sedan', type:'סדאן',     img:IMG.audiBlack },
    { brand:'Tesla',      name:'Model 3 LR',       year:2021, km:54000,  hand:1, price:175000, monthly:1990, cat:'ev',    type:'חשמלי',    img:IMG.teslaFront },
    { brand:'Tesla',      name:'Model Y',          year:2022, km:41000,  hand:1, price:198000, monthly:2290, cat:'ev',    type:'חשמלי',    img:IMG.teslaWhite },
    { brand:'Lexus',      name:'NX 300h',          year:2020, km:88000,  hand:2, price:168000, monthly:1940, cat:'suv',   type:'היברידי',  img:IMG.suvSilver },
    { brand:'Lexus',      name:'ES 300h',          year:2019, km:124000, hand:3, price:142000, monthly:1690, cat:'sedan', type:'היברידי',  img:IMG.silverRoad },
    { brand:'Toyota',     name:'Corolla Hybrid',   year:2022, km:41000,  hand:1, price:118000, monthly:1420, cat:'sedan', type:'היברידי',  img:IMG.silverRoad },
    { brand:'Toyota',     name:'RAV4 Hybrid',      year:2021, km:73000,  hand:2, price:158000, monthly:1860, cat:'suv',   type:'היברידי',  img:IMG.suvSilver },
    { brand:'Toyota',     name:'C-HR',             year:2020, km:96000,  hand:2, price:112000, monthly:1360, cat:'suv',   type:'קרוסאובר', img:IMG.jeep },
    { brand:'Volkswagen', name:'Golf GTI',         year:2021, km:59000,  hand:1, price:138000, monthly:1640, cat:'sport', type:'ספורט',    img:IMG.blackCoupe },
    { brand:'Volkswagen', name:'Tiguan',           year:2020, km:91000,  hand:2, price:132000, monthly:1580, cat:'suv',   type:'רכב פנאי', img:IMG.jeep },
    { brand:'Kia',        name:'Sportage GT',      year:2021, km:67000,  hand:2, price:132000, monthly:1580, cat:'suv',   type:'רכב פנאי', img:IMG.jeep },
    { brand:'Kia',        name:'Niro EV',          year:2022, km:48000,  hand:1, price:126000, monthly:1520, cat:'ev',    type:'חשמלי',    img:IMG.teslaFront },
    { brand:'Mazda',      name:'6 Signature',      year:2019, km:96000,  hand:2, price:108000, monthly:1320, cat:'sedan', type:'סדאן',     img:IMG.bmwSedan },
    { brand:'Mazda',      name:'CX-5',             year:2020, km:134000, hand:3, price:118000, monthly:1420, cat:'suv',   type:'רכב פנאי', img:IMG.suvSilver },
    { brand:'Genesis',    name:'G70',              year:2021, km:61000,  hand:1, price:158000, monthly:1860, cat:'sedan', type:'מנהלים',   img:IMG.genesis },
    { brand:'Mercedes-AMG',name:'C 200 Coupé',     year:2019, km:142000, hand:3, price:152000, monthly:1790, cat:'sport', type:'קופה',     img:IMG.amgSilver },
    { brand:'Porsche',    name:'Macan',            year:2019, km:118000, hand:2, price:268000, monthly:3090, cat:'suv',   type:'רכב פנאי', img:IMG.exotic },
  ];

  // magazine / blog
  const ARTICLES = [
    { id:'mimuni-vs-tifuli', cat:'מדריך', date:'מאי 2026', img:IMG.panamera, title:'ליסינג מימוני מול ליסינג תפעולי — מה ההבדל?',
      excerpt:'שני המונחים נשמעים דומה אבל ההבדל מהותי. הסברנו מה מתאים למי, ומתי הרכב באמת נשאר אצלכם.',
      body:['ליסינג הוא אחת הדרכים הפופולריות לנהוג ברכב חדש בלי לשלם את מלוא מחירו מראש — אבל לא כל ליסינג זהה. ההבדל המרכזי הוא בשאלה של הבעלות בתום התקופה.',
        'בליסינג מימוני פרטי אתם בעצם רוכשים את הרכב בתשלומים: ההחזר החודשי מכסה את הרכב, ובסוף התקופה (לעיתים אחרי תשלום בלון) הרכב עובר לבעלותכם המלאה. זו האפשרות הנכונה למי שרוצה רכב חדש בלי הון התחלתי, אך עדיין לצבור נכס.',
        'בליסינג תפעולי, לעומת זאת, אתם משלמים על השימוש ברכב ומחזירים אותו בתום התקופה. אין בעלות, אך לרוב יש מעטפת שירות מלאה. זה מתאים יותר לעסקים שמעדיפים הוצאה קבועה ולא נכס.',
        'בשורה התחתונה: אם המטרה שלכם היא שהרכב יהיה שלכם בסוף הדרך — ליסינג מימוני הוא הבחירה. צוות Car2Buy ישמח לעזור לכם לבחור את המסלול הנכון עבורכם.'] },
    { id:'5-mistakes', cat:'טיפים', date:'מאי 2026', img:IMG.audiBlack, title:'5 טעויות שכדאי להימנע מהן בליסינג רכב',
      excerpt:'מההחזר החודשי ועד תשלום הבלון — הטעויות הנפוצות שעולות ללקוחות כסף, ואיך להימנע מהן.',
      body:['ליסינג חכם מתחיל בהבנה של מה שאתם חותמים עליו. ריכזנו את חמש הטעויות הנפוצות ביותר שראינו לאורך השנים.',
        'הטעות הראשונה: להסתכל רק על ההחזר החודשי. החזר נמוך עם תשלום בלון גבוה בסוף עלול להפתיע. תמיד בדקו את העלות הכוללת.',
        'הטעות השנייה: להזניח את הביטוח והאחזקה. ודאו מה כלול בעסקה — ב‑Car2Buy הכל במעטפת אחת. הטעות השלישית: לא להתאים את התקופה ליכולת. הרביעית: להתעלם מירידת הערך. והחמישית: לא להשוות הצעות.',
        'עם ליווי אישי ושקיפות מלאה, כל הטעויות האלה נמנעות מראש.'] },
    { id:'ev-worth-it', cat:'חשמלי', date:'אפריל 2026', img:IMG.teslaWhite, title:'רכב חשמלי בליסינג — האם זה משתלם?',
      excerpt:'עלויות הטעינה, ירידת הערך והטבות המס. בדקנו האם רכב חשמלי בליסינג מימוני באמת חוסך לכם כסף.',
      body:['רכבים חשמליים הפכו לבחירה מרכזית בשוק הישראלי, והשילוב עם ליסינג מימוני יכול להיות משתלם במיוחד.',
        'היתרון הראשון הוא עלות התפעול: טעינה חשמלית זולה משמעותית מדלק, והאחזקה פשוטה יותר בזכות פחות חלקים נעים. בנוסף, מס הקנייה המופחת על רכבים חשמליים משפיע על המחיר ועל ההחזר החודשי.',
        'מנגד, חשוב לקחת בחשבון את ירידת הערך של הסוללה ואת תשתית הטעינה. כאן בדיוק נכנס היתרון של ליסינג מימוני עם תשלום בלון — שמאפשר לכם גמישות בסוף התקופה.',
        'בקטלוג שלנו תמצאו מגוון דגמים חשמליים, ובמחשבון תוכלו לראות בדיוק כמה זה יעלה לכם בחודש.'] },
    { id:'monthly-explained', cat:'מימון', date:'אפריל 2026', img:IMG.amgSilver, title:'איך נקבע ההחזר החודשי שלכם?',
      excerpt:'מחיר הרכב, המקדמה, תשלום הבלון, התקופה והריבית — פירקנו את הנוסחה שמאחורי ההחזר.',
      body:['ההחזר החודשי בליסינג מימוני אינו מספר אקראי — הוא תוצאה של כמה משתנים שאתם שולטים בהם.',
        'מחיר הרכב הוא נקודת הפתיחה. מתוכו מורידים את המקדמה (שיכולה להתחיל מ‑0 ₪) ואת תשלום הבלון שנדחה לסוף. היתרה מתחלקת על פני תקופת ההחזר, בתוספת ריבית.',
        'ככל שתגדילו את המקדמה או הבלון, ההחזר החודשי יקטן — אך העלות הכוללת עשויה להשתנות. תקופה ארוכה יותר מקטינה את ההחזר אך מאריכה את ההתחייבות.',
        'הדרך הטובה ביותר להבין זאת היא לשחק עם המחשבון שלנו ולראות איך כל שינוי משפיע בזמן אמת.'] },
    { id:'tradein-tips', cat:'טריד-אין', date:'מרץ 2026', img:IMG.silverRoad, title:'טריד-אין: איך לקבל את המחיר הטוב ביותר',
      excerpt:'הכנה נכונה של הרכב, תיעוד טיפולים ותזמון — כך תמקסמו את שווי הטריד-אין של הרכב הישן.',
      body:['עסקת טריד-אין טובה יכולה להוריד משמעותית את העלות של הרכב הבא שלכם. הנה איך להתכונן.',
        'ראשית, תעדו את היסטוריית הטיפולים. רכב עם רישום מסודר שווה יותר. שנית, טפלו בתיקונים קוסמטיים קטנים — הם משפיעים על הרושם ועל המחיר.',
        'תזמון חשוב: שווי הרכב יורד עם הגיל והקילומטראז׳, אז ככל שתחליפו מוקדם יותר, כך תקבלו יותר. השתמשו במחשבון הטריד-אין שלנו לקבלת הערכה ראשונית מיידית.',
        'ב‑Car2Buy אנחנו מקזזים את שווי הרכב הישן ישירות מהעסקה החדשה — בלי טרחה ובלי מודעות יד 2.'] },
    { id:'first-car', cat:'מדריך', date:'מרץ 2026', img:IMG.evoque, title:'מדריך לרכב הראשון שלכם בליסינג',
      excerpt:'צעירים ונהגים חדשים — כל מה שצריך לדעת כדי לצאת לכביש ברכב חדש בלי להסתבך.',
      body:['הרכב הראשון הוא רגע מרגש, וליסינג מימוני יכול להפוך אותו לנגיש גם בלי חיסכון גדול.',
        'התחילו בהגדרת תקציב חודשי ריאלי — כולל ביטוח, דלק ואחזקה, לא רק ההחזר. בחרו רכב שמתאים לצרכים האמיתיים שלכם ולא רק לחלום.',
        'נהגים חדשים נהנים מ‑Car2Buy ממעטפת מלאה שכוללת ביטוח ורישוי, כך שאין הפתעות. אישור עקרוני ניתן תוך 24 שעות, גם ללא היסטוריית אשראי ארוכה.',
        'מוכנים? עברו לקטלוג, בחרו דגם, וקבלו הצעה אישית.'] },
  ];

  window.Car2Buy = {
    IMG, MODELS, CATS, BRANDS, BRANDS_ALL, BRAND_HE, FUELS, USED, ARTICLES, PRESS, CUSTOMERS, NIS, LOGO,
    gallery,
    byId: (id) => MODELS.find((m) => m.id === id),
    card(m) {
      const waMsg = encodeURIComponent(`היי, אשמח לפרטים על ${m.brand} ${m.name} ולכמה יעלה לי החזר חודשי 🚗`);
      const C2B = (typeof window !== 'undefined' && window.Car2Buy) || {};
      const dispB = C2B.dispBrand ? C2B.dispBrand(m.brand) : m.brand;
      const dispM = C2B.enModel ? C2B.enModel(m.name) : m.name;
      const dispFull = C2B.enName ? C2B.enName(m) : (m.brand + ' ' + m.name);
      return `<article class="car reveal" data-cat="${m.cat}" data-brand="${m.brand}" data-fuel="${m.fuel}" data-monthly="${m.monthly}" data-name="${dispFull}">
        <button class="car-compare" type="button" data-id="${m.id}">+ השוואה</button>
        <a class="car-hit" href="car.html?car=${m.id}">
          <div class="car-ph"><img loading="lazy" src="${m.img}" alt="${dispFull}">
            ${m.tag ? `<span class="car-badge">${m.tag}</span>` : ''}
            ${LOGO_SLUG[m.brand] ? `<span class="brand-logo car-logo-badge"><img loading="lazy" src="${LOGO(m.brand)}" alt="${dispB}" onerror="this.closest('.brand-logo').style.display='none'"></span>` : ''}
            ${FAST.has(m.id) ? '<span class="car-fast">⚡ אספקה מהירה</span>' : ''}</div>
          <div class="car-body">
            <div class="car-tier">${dispB} · ${m.type}</div>
            <h3>${dispM}</h3>
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
          <div class="car-act-row">
            <a class="car-act wa" href="https://wa.me/972584700706?text=${waMsg}" target="_blank" rel="noopener" data-track="whatsapp_click"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3z" transform="scale(0.83)"></path></svg> וואטסאפ</a>
            <a class="car-act contact" href="contact.html?car=${encodeURIComponent(dispFull)}">יצירת קשר</a>
          </div>
        </div>
      </article>`;
    },
    usedCard(u, i) {
      const pad = (n) => String(n).padStart(2, '0');
      const testDate = pad((u.km % 27) + 1) + '/' + pad(((u.hand + (u.km % 9)) % 12) + 1) + '/2027';
      const photos = (u.km % 8) + 5;
      const isEV = u.type === 'חשמלי', isHyb = u.type === 'היברידי';
      const fuelCls = isEV ? 'ev' : isHyb ? 'hyb' : 'gas';
      const fuelTxt = isEV ? 'חשמלי' : isHyb ? 'היברידי' : 'בנזין';
      const fuelIc = isEV
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>'
        : isHyb
          ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11z"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z"/></svg>';
      const href = 'used-car.html?car=u' + i;
      return `<article class="car ucard reveal" data-brand="${u.brand}" data-monthly="${u.monthly}" data-km="${u.km}" data-name="${u.brand} ${u.name}" data-cat="${u.cat}" data-hand="${u.hand}" data-type="${u.type}">
        <a class="uc-hit" href="${href}">
          <div class="uc-ph">
            <img loading="lazy" src="${u.img}" alt="${u.brand} ${u.name}">
            <span class="uc-fuel ${fuelCls}">${fuelIc}${fuelTxt}</span>
            <span class="uc-media">
              <span class="uc-chip">וידאו <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
              <span class="uc-chip">${photos} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 17-5-5-9 7"/></svg></span>
            </span>
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
      return `<a class="dir-item" href="models.html?brand=${encodeURIComponent(b.name)}">
        <span class="dir-name">${b.he || b.name}</span>
        <span class="dir-logo">${img}<b class="dir-mono">${mono}</b></span>
      </a>`;
    }
  };
})();
