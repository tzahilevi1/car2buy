# Car2Buy — אתר סטטי

אתר תדמית/לידים בעברית (RTL) לתחום רכב — מימון, השוואת רכבים, מותגים, יבוא אישי, טרייד-אין ועוד.
יובא מייצוא של כלי עיצוב (Claude) והועבר לפרויקט מקומי זה.

## סטאק
- **אתר סטטי טהור**: HTML + CSS + JavaScript (Vanilla). אין framework, אין build step, אין package.json.
- שפה: עברית, כיווניות RTL.
- גיליון סגנון יחיד: `styles.css`.
- נקודת כניסה: `index.html`.

## איך מריצים מקומית
צריך שרת סטטי (פתיחת קובץ ישירות מה-`file://` תשבור נתיבים ו-fetch). מתוך תיקיית הפרויקט:

```bash
python -m http.server 8000
# ואז לפתוח בדפדפן:  http://localhost:8000/
```

חלופה ללא Python: `npx serve` או תוסף "Live Server" ב-VS Code.

## מבנה
```
index.html          נקודת כניסה (עמוד הבית)
styles.css          כל העיצוב (גיליון יחיד)
*.html              ~31 עמודי תוכן (ראה למטה)
*.js                לוגיקה + קבצי דאטה (ראה למטה)
images/             נכסי האתר (כולל images/customers/)
```

### עמודי HTML מרכזיים
- `index.html` — בית
- `car.html`, `car-loan.html`, `used-car.html`, `model.html`, `models.html` — רכבים/דגמים
- `compare.html`, `recommended.html` — השוואה והמלצות
- `calculator.html`, `financing.html`, `finance-*.html` (budget/business/electric/family/luxury) — מימון ומחשבונים
- `brand.html`, `brands.html`, `brand-article.html` — מותגים
- `magazine.html`, `article.html`, `testimonials.html`, `customers.html` — תוכן/חברתי
- `personal-import.html`, `trade-in.html`, `yad2.html` — שירותים
- `about.html`, `contact.html`, `faq.html`, `how-it-works.html`, `privacy.html`, `thank-you.html` — כלליים

### קבצי JavaScript
- **לוגיקה משותפת**: `site.js`, `app.js`, `support.js`, `social-proof.js`, `scheduler.js`, `ai-concierge.js`
- **לוגיקת עמוד**: `compare-page.js`, `calc-page.js`, `recommended-page.js`, `trade-page.js`, `loan-modal.js`, `brand.js`
- **קבצי דאטה** (מקור התוכן — לרוב כאן עורכים תוכן): `cars-data.js`, `models-data.js`, `loan-cars.js`, `articles-data.js`, `brand-articles.js`, `brand-content.js`, `customers-data.js`, `gov-data.js`

## הערות תחזוקה
- **פאנל עריכה של כלי העיצוב**: כמעט כל עמוד טוען `tweaks-panel.jsx` + `tweaks-app.jsx` יחד עם React+Babel מ-unpkg CDN
  (`<script type="text/babel" ...>` לפני `</body>`). זה overlay עריכה של כלי העיצוב, **רדום** בדפדפן רגיל (מחכה להודעת
  `__activate_edit_mode` מהכלי המארח) ואינו חלק מהאתר הסופי. מומלץ להסיר לפני העלאה לפרודקשן: למחוק את שני קבצי ה-jsx
  ואת תגיות ה-`<script>` שטוענות React/Babel/tweaks מכל עמודי ה-HTML. (לא הוסר עדיין כדי לא לגעת ב-~31 קבצים ללא אישור.)
- הנכסים הגולמיים של כלי העיצוב (`uploads/` — צילומי מסך, תמונות WhatsApp, דוחות `.docx`) **אינם** בפרויקט; הועברו ל-
  `C:\Users\zahci\Downloads\Car2Buy-uploads-backup`. הם לא היו מקושרים מאף עמוד.
- קובצי ייצוא זמניים (`*-print-*.html`, `Canvas*.dc.html`, `.thumbnail`) הוסרו בייבוא.
