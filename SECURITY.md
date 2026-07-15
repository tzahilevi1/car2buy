# Car2Buy — Security Policy & Posture

אתר סטטי (HTML/CSS/Vanilla JS) המתארח ב-GitHub Pages, עם Supabase כ-backend ללכידת לידים ולפאנל ה-CRM. מסמך זה מרכז את שכבות ההגנה שממומשות באתר ואת פעולות ההקשחה שיש לוודא בצד ה-Supabase.

## Reporting a Vulnerability
מצאתם בעיית אבטחה? אנא כתבו ל־**security@car2buy.co.il** (או צרו קשר דרך העמוד ליצירת קשר) עם תיאור, שלבי שחזור והשפעה. אנא אל תפרסמו את הפרצה בטרם תוקנה (responsible disclosure). נגיב בהקדם.

## מה ממומש בקוד (client-side)
- **Content-Security-Policy (CSP)** — מוגדר ב-`<meta http-equiv>` בכל עמוד. מגביל מאיפה נטענים scripts/styles/images/frames/connections:
  - `script-src 'self' 'unsafe-inline'` בעמודים הציבוריים (אין סקריפטים חיצוניים); עמודי האדמין/auth מוסיפים `https://cdn.jsdelivr.net` (+`'unsafe-eval'` ל-html2pdf) בלבד.
  - `connect-src` נעול ל-`self`, Supabase, `data.gov.il` ו-`api.ipify.org` בלבד — מונע דליפת נתונים ליעדים לא מורשים.
  - `frame-src` — YouTube בלבד. `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- **Referrer-Policy** — `strict-origin-when-cross-origin` (meta) בכל עמוד.
- **הגנת Clickjacking** — `frame-ancestors` מתעלמים ב-meta CSP, לכן `site.js` מבצע frame-buster: שבירה החוצה מ-iframe חוצה-origin.
- **Tabnabbing** — כל קישור `target="_blank"` כולל `rel="noopener noreferrer"`.
- **Subresource Integrity (SRI)** — כל הסקריפטים החיצוניים (Supabase-JS, html2pdf) נטענים עם `integrity` + `crossorigin` + גרסה מוצמדת (pinned).
- **Anti-spam / abuse** — `submitLead` כולל: שדה honeypot, ולידציית ערוץ-קשר, ו-rate-limit לכל דפדפן.
- **XSS** — קלט משתמש נשלח ל-Supabase דרך `fetch` (JSON), לא מוזרק ל-DOM; ערכים דינמיים (שמות דגמים, נתוני שיטס) עוברים `esc()`/escaping לפני הזרקה ל-`innerHTML`.
- **HTTPS** — GitHub Pages מגיש ב-HTTPS; `upgrade-insecure-requests` מכריח שדרוג של בקשות.

## פעולות חובה בצד Supabase (backend)
ה-**anon key** חשוף בקוד — זה תקין ומתוכנן ב-Supabase **בתנאי** ש-Row Level Security (RLS) מוגדר נכון. **חובה** לוודא/להריץ את `security/supabase-rls.sql`:
- `leads`, `events`, `appointments` — **INSERT בלבד** ל-`anon` (טפסים ציבוריים). קריאה/עדכון/מחיקה — רק ל-`authenticated`.
- `profiles`, `activities`, `tasks`, `deals`, `payments`, `lead_documents`, `field_options` — **רק `authenticated`** (פאנל CRM מאחורי Supabase Auth).
- ללא זה, בעל ה-anon key יכול לקרוא את כל הלידים — לכן זו הנקודה הקריטית ביותר.

המלצות נוספות ב-Supabase:
- הגבילו את **Auth → URL Configuration** ל-origin של האתר בלבד.
- הפעילו **email confirmations** ו-**leaked-password protection**.
- אחסנו סודות (service_role, מפתחות webhook) ב-**Vault** בלבד — לעולם לא בקוד הלקוח.
- הפעילו **rate limiting** ב-Supabase Auth ו-API.

## כותרות HTTP אמיתיות (כשעוברים מאחורי CDN)
GitHub Pages אינו מאפשר כותרות HTTP מותאמות. אם האתר יוגש מאחורי Cloudflare/Netlify, החילו את הכותרות שב-`security/http-headers.md` (HSTS, X-Content-Type-Options, Permissions-Policy, X-Frame-Options, CSP כ-header).

## תלויות
- אין build step ואין npm dependencies בצד הלקוח. הסקריפטים החיצוניים היחידים (Supabase-JS, html2pdf) מוצמדים לגרסה עם SRI. בעדכון גרסה — יש לחשב מחדש את ה-`integrity`.
