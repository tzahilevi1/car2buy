/* ============================================================
   Car2Buy — flagship car detail content (6 cars, phase 1).
   Original Hebrew marketing editorial + estimated spec fields.
   Specs are indicative; verify before publishing.
   window.Car2Buy.CARS  +  helper getCar(slug)
   Video: set yt to the importer's official YouTube ID when sent;
   null => page shows a "search official video" button.
   ============================================================ */
(function () {
  window.Car2Buy = window.Car2Buy || {};

  var CARS = [
    {
      slug: 'byd-seal-5',
      pollution: 2, safety: 7, rating: 4.6, ratingCount: 84,
      brand: 'ב.י.ד', model: 'סיל 5 DM-i', trim: 'Comfort',
      type: 'סדאן היברידי נטען', cat: 'family',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/byd-seal-5-new.jpg',
      imaginMake: 'byd', imaginModel: 'seal',
      price: 177384, monthly60: 1803, year: 2026,
      hero: 'linear-gradient(135deg,#1b2a4a,#2c4a7a)',
      tagline: 'הסדאן ההיברידי הנטען שמשנה את המשוואה',
      yt: null,
      highlights: ['טווח חשמלי לנסיעה יומית', 'צריכה נמוכה במיוחד', 'תא מטען נדיב', 'אחריות יצרן ארוכה'],
      editorial: [
        'ב.י.ד סיל 5 DM-i מביאה לשוק הישראלי בדיוק את מה שמשפחה מחפשת ב-2025: סדאן מרווח, שקט וחסכוני, שיודע לנסוע את רוב הנסועה היומית על חשמל בלבד — ולשמור את הדלק לנסיעות הארוכות. זו לא עוד הבטחה, זו טכנולוגיית DM-i שכבר הוכיחה את עצמה במיליוני כלי רכב ברחבי העולם.',
        'בתוך התא תקבלו מסך מגע מרכזי גדול שמסתובב, גימור נעים למגע ומערכות בטיחות אקטיביות בסטנדרט. ההאצה חלקה ושקטה, וברגעים שצריך — המנוע החשמלי נותן דחיפה מיידית. בזכות מצבר גדול יחסית, גם נסיעה עירונית שלמה יכולה לעבור כמעט בלי להתניע את מנוע הבנזין.',
        'במימון 60% דרך Car2Buy ההחזר החודשי נשאר נוח להפליא, וכך הסדאן ההיברידי-נטען הזה הופך לאחת העסקאות המשתלמות שתמצאו בקטגוריה. זה הרכב לאנשים שרוצים לחסוך בדלק בלי לוותר על נוחות, מקום ושקט.'
      ],
      specs: { power:160, accel:'8.9 שנ\'', engine:'1.5L בנזין + מנוע חשמלי', displacement:'1,498 סמ"ק', gearbox:'תיבת E-CVT', drive:'קדמית', fuel:'היברידי נטען (PHEV)', range:'עד ~80 ק"מ חשמלי', consumption:'~1.2 ל\'/100 ק"מ', seats:5, doors:'4', bodyType:'סדאן', trunk:'~450 ל\'', length:'4,780 מ"מ', width:'1,890 מ"מ', height:'1,495 מ"מ', weight:'~1,650 ק"ג' }
    },
    {
      slug: 'chery-tiggo-8-pro',
      pollution: 3, safety: 7, rating: 4.4, ratingCount: 63,
      brand: "צ'רי", model: 'טיגו 8 פרו', trim: 'PHEV Noble',
      type: 'פנאי-שטח 7 מקומות', cat: 'suv',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/chery-tiggo-8-pro-new.jpg',
      imaginMake: 'chery', imaginModel: 'tiggo 8',
      price: 202712, monthly60: 2074, year: 2026,
      hero: 'linear-gradient(135deg,#3a1f1f,#7a3a2c)',
      tagline: 'שבעה מקומות, נוכחות גדולה, החזר חכם',
      yt: null,
      highlights: ['7 מקומות אמיתיים', 'גימור Noble עשיר', 'מערכת PHEV חסכונית', 'תא נהג טכנולוגי'],
      editorial: [
        "צ'רי טיגו 8 פרו ברמת הגימור Noble היא הצהרה: פנאי-שטח גדול ל-7 נוסעים, עם נוכחות כביש מרשימה ותא פנימי שמרגיש הרבה מעל המחיר. מסכים גדולים, חומרים רכים, תאורת אווירה — הכל מתוכנן להרגיש כמו רכב יוקרה.",
        'הגרסה ההיברידית-נטענת (PHEV) נותנת את הטוב משני העולמות: שקט וחיסכון בעיר, וטווח ארוך וביטחון בכביש הפתוח. לשלוש שורות המושבים יש גמישות אמיתית — בין אם אתם מסיעים ילדים, חברים או מטען גדול לחופשה.',
        'עם מימון 60% ב-Car2Buy, רכב גדול ומאובזר כל כך הופך לנגיש מאוד בהחזר החודשי. אם חיפשתם SUV משפחתי גדול שלא מתפשר על אבזור — זה בדיוק הוא.'
      ],
      specs: { power:245, accel:'~8.0 שנ\'', engine:'1.5L טורבו + מנוע חשמלי', displacement:'1,498 סמ"ק', gearbox:'אוטומטית ייעודית (DHT)', drive:'קדמית', fuel:'היברידי נטען (PHEV)', range:'טווח משולב ארוך', consumption:'נמוכה מאוד בעיר', seats:7, doors:'5', bodyType:'פנאי-שטח', trunk:'גמיש (שורה 3 מתקפלת)', length:'4,720 מ"מ', width:'1,860 מ"מ', height:'1,705 מ"מ', weight:'~1,900 ק"ג' }
    },
    {
      slug: 'hyundai-tucson',
      pollution: 6, safety: 8, rating: 4.7, ratingCount: 212,
      brand: 'יונדאי', model: 'טוסון', trim: 'Executive Hybrid',
      type: 'קרוסאובר היברידי', cat: 'suv',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/hyundai-tucson-new.jpg',
      imaginMake: 'hyundai', imaginModel: 'tucson',
      price: 215622, monthly60: 2213, year: 2026,
      hero: 'linear-gradient(135deg,#1e2a2e,#3c5560)',
      tagline: 'העיצוב שמסובב ראשים, האמינות שכבר מוכרת',
      yt: null,
      highlights: ['עיצוב פרמטרי ייחודי', 'מערכת היברידית בשלה', 'בטיחות 5 כוכבים', 'אבזור Executive עשיר'],
      editorial: [
        'יונדאי טוסון היא כבר מזמן לא "עוד קרוסאובר". העיצוב הפרמטרי הנועז, עם פנסי ה-LED המוסתרים בחזית, הפך אותה לאחד הרכבים המזוהים ביותר על הכביש. וברמת Executive ההיברידית, גם הפנים מדביקים את הקצב: מסכים מחוברים, גימור איכותי ושפע מערכות נוחות.',
        'המערכת ההיברידית של יונדאי בשלה, חלקה וחסכונית — היא יודעת לעבור בין חשמל לבנזין בצורה כמעט בלתי מורגשת, ולתת חיסכון אמיתי בעיר בלי "חרדת טווח". מרחב הפנים נדיב, תא המטען שימושי, ורמת הבטיחות מהגבוהות בקטגוריה.',
        'דרך מימון 60% ב-Car2Buy, הטוסון ההיברידית נכנסת להחזר חודשי שקל לחיות איתו — קרוסאובר משפחתי שמרגיש פרימיום, בלי לשבור את התקציב.'
      ],
      specs: { power:230, accel:'~8.0 שנ\'', engine:'1.6L טורבו היברידי', displacement:'1,598 סמ"ק', gearbox:'אוטומטית 6 הילוכים', drive:'4x2 / 4x4', fuel:'היברידי (HEV)', range:'—', consumption:'~5.5 ל\'/100 ק"מ', seats:5, doors:'5', bodyType:'קרוסאובר', trunk:'~580 ל\'', length:'4,500 מ"מ', width:'1,865 מ"מ', height:'1,650 מ"מ', weight:'~1,650 ק"ג' }
    },
    {
      slug: 'toyota-c-hr',
      pollution: 5, safety: 8, rating: 4.8, ratingCount: 168,
      brand: 'טויוטה', model: 'C-HR', trim: 'Flow',
      type: 'קרוסאובר עירוני היברידי', cat: 'urban',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/toyota-c-hr-new.jpg',
      imaginMake: 'toyota', imaginModel: 'c-hr',
      price: 196622, monthly60: 1952, year: 2026,
      hero: 'linear-gradient(135deg,#2a1f33,#54386b)',
      tagline: 'סטייל חד, אמינות טויוטה, נשמה היברידית',
      yt: null,
      highlights: ['עיצוב קופה נועז', 'היברידי טויוטה אגדי', 'חסכוני להפליא בעיר', 'ערך מכירה חוזרת גבוה'],
      editorial: [
        'טויוטה C-HR החדשה לוקחת את הקו העיצובי הכי נועז של המותג ומחדדת אותו עוד: קווים חדים, גג קופה משופע ופנסים דמויי חץ. זה קרוסאובר עירוני שנראה כמו רכב קונספט שיצא לכביש — ומושך מבטים בכל פינת רחוב.',
        'מתחת למכסה פועם הלב ההיברידי של טויוטה, אולי המוכח והאמין בעולם. בעיר הוא נוסע חלק ושקט, צורך מעט מאוד דלק, ולא דורש שום שינוי הרגלים — פשוט מתדלקים ונוסעים. וכמו כל טויוטה, גם כאן ערך המכירה החוזרת בין הגבוהים בשוק.',
        'עם מימון 60% ב-Car2Buy, ה-C-HR Flow מציעה שילוב נדיר של עיצוב, חיסכון ושקט נפשי — בהחזר חודשי נוח. בחירה מצוינת למי שרוצה רכב עירוני מהמם שגם משתלם לאורך זמן.'
      ],
      specs: { power:140, accel:'~8.3 שנ\'', engine:'1.8L היברידי', displacement:'1,798 סמ"ק', gearbox:'תיבת E-CVT', drive:'קדמית', fuel:'היברידי (HEV)', range:'—', consumption:'~4.7 ל\'/100 ק"מ', seats:5, doors:'5', bodyType:'קרוסאובר עירוני', trunk:'~360 ל\'', length:'4,360 מ"מ', width:'1,830 מ"מ', height:'1,565 מ"מ', weight:'~1,450 ק"ג' }
    },
    {
      slug: 'jaecoo-7',
      pollution: 3, safety: 7, rating: 4.3, ratingCount: 47,
      brand: "ג'אקו", model: "ג'אקו 7", trim: 'Luxury PHEV',
      type: 'פנאי-שטח היברידי נטען', cat: 'suv',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/jaecoo-7-new.jpg',
      imaginMake: 'jaecoo', imaginModel: '7',
      price: 205712, monthly60: 2107, year: 2026,
      hero: 'linear-gradient(135deg,#23301f,#46603a)',
      tagline: 'שפה עיצובית בריטית, נשמה היברידית נטענת',
      yt: null,
      highlights: ['עיצוב חוץ יוקרתי', 'PHEV עם טווח ארוך', 'מסך ענק ותא דיגיטלי', 'יחס אבזור-מחיר מעולה'],
      editorial: [
        "ג'אקו 7 נכנסת לשוק עם נוכחות שמזכירה רכבי שטח בריטיים יוקרתיים — חזית זקופה ומכובדת, ידיות דלת חבויות וקווים נקיים. אבל מתחת לפנים המהודרות מסתתרת טכנולוגיה עדכנית לגמרי: מערכת היברידית נטענת (PHEV) שמשלבת חיסכון עירוני עם טווח נסיעה ארוך.",
        'בתא הנהג מחכה מסך מרכזי ענק, גימור עשיר ותחושת מרחב שמתאימה למשפחה. הנהיגה רגועה ומבוקרת, והמעבר בין מצב חשמלי להיברידי חלק. זה רכב שנבנה כדי להרגיש יקר יותר ממה שהוא — וברמת Luxury הוא עושה את זה במלואו.',
        "במימון 60% ב-Car2Buy, ג'אקו 7 Luxury PHEV היא אחת ההצעות המשתלמות בקטגוריית ה-SUV ההיברידי-נטען: הרבה רכב, הרבה אבזור, והחזר חודשי שנשאר הגיוני."
      ],
      specs: { power:204, accel:'~8.5 שנ\'', engine:'1.5L טורבו + מנוע חשמלי', displacement:'1,498 סמ"ק', gearbox:'אוטומטית ייעודית (DHT)', drive:'קדמית', fuel:'היברידי נטען (PHEV)', range:'טווח חשמלי לנסיעה יומית', consumption:'נמוכה מאוד', seats:5, doors:'5', bodyType:'פנאי-שטח', trunk:'~500 ל\'', length:'4,500 מ"מ', width:'1,865 מ"מ', height:'1,680 מ"מ', weight:'~1,750 ק"ג' }
    },
    {
      slug: 'bmw-x1',
      pollution: 9, safety: 8, rating: 4.7, ratingCount: 134,
      brand: 'ב.מ.וו', model: 'X1', trim: 'M Sport',
      type: 'פנאי-שטח פרימיום', cat: 'premium',
      img: 'https://www.icar.co.il/_media/images/models/bgremoval/bmw-x1-new.jpg',
      imaginMake: 'bmw', imaginModel: 'x1',
      price: 309900, monthly60: 3100, year: 2026,
      hero: 'linear-gradient(135deg,#101826,#26405f)',
      tagline: 'הכניסה לעולם ב.מ.וו, ברמת M Sport',
      yt: null,
      highlights: ['חבילת M Sport מלאה', 'תא נהג Curved Display', 'נהיגה ספורטיבית מדויקת', 'יוקרה גרמנית נגישה'],
      editorial: [
        'ב.מ.וו X1 ברמת M Sport היא נקודת הכניסה המושלמת לעולם הפרמיום הגרמני — אבל בלי שום תחושת פשרה. חבילת M Sport מוסיפה מַגֵּן קדמי ספורטיבי, חישוקים גדולים ותא נהג עם הדגשים הנכונים, כך שה-X1 נראית ומרגישה הרבה מעל הקטגוריה.',
        'מול הנהג משתרע ה-Curved Display המעוקל של ב.מ.וו, עם מערכת iDrive עדכנית ותחושת איכות שב.מ.וו יודעת לייצר. ההגה מדויק, ההיגוי חד, והרכב יודע להיות גם נוח ושקט בנסיעה יומיומית וגם מהנה כשרוצים. מרחב הפנים והמטען מתאימים בהחלט למשפחה פעילה.',
        'דרך מימון 60% ב-Car2Buy, גם רכב פרימיום כמו ה-X1 M Sport נכנס להחזר חודשי שאפשר לתכנן סביבו. זו הדרך החכמה להיכנס לעולם ב.מ.וו — עם הרכב הנכון ובתנאים הנכונים.'
      ],
      specs: { power:170, accel:'~7.0 שנ\'', engine:'טורבו בנזין', displacement:'1,499 סמ"ק', gearbox:'אוטומטית 7 הילוכים DCT', drive:'sDrive (קדמית)', fuel:'בנזין (מיקרו-היברידי)', range:'—', consumption:'יעילה לקטגוריה', seats:5, doors:'5', bodyType:'פנאי-שטח פרימיום', trunk:'~540 ל\'', length:'4,500 מ"מ', width:'1,845 מ"מ', height:'1,640 מ"מ', weight:'~1,600 ק"ג' }
    }
  ];

  window.Car2Buy.CARS = CARS;
  window.Car2Buy.getCar = function (slug) {
    for (var i = 0; i < CARS.length; i++) if (CARS[i].slug === slug) return CARS[i];
    return null;
  };
})();
