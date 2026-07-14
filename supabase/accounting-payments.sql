-- ============================================================
--  Car2Buy — פירוט תשלומים לפי שלב (עבור הנהלת חשבונות).
--  הפרדה בין: מקדמה ראשונית / השלמת מקדמה / תשלום רכישת הרכב / אחר.
--  Run once in SQL Editor. Safe to re-run.
-- ============================================================
alter table public.payments add column if not exists purpose text;  -- deposit1 / deposit2 / purchase / other

-- שדות פרטי-חשבונית מרוכזים על העסקה (אם עדיין לא קיימים)
alter table public.deals add column if not exists invoice_name    text;  -- שם על החשבונית/קבלה
alter table public.deals add column if not exists client_id       text;  -- ת.ז / ח.פ
alter table public.deals add column if not exists client_address  text;  -- כתובת לחיוב
alter table public.deals add column if not exists charge_amount   numeric; -- סכום לחיוב (נקבע ידנית ע"י הנה"ח, אחרת נגזר מהיתרה)
