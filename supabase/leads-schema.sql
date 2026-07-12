-- ============================================================
--  Car2Buy — טבלת לידים + אבטחת RLS
--  להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query →
--  להדביק את כל הקובץ → Run.
-- ============================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  phone       text,
  email       text,
  car         text,          -- הרכב שעניין את הליד
  message     text,
  source      text,          -- מזהה הטופס/העמוד ממנו הגיע הליד
  page_url    text,          -- כתובת מלאה של העמוד
  meta        jsonb          -- שדות נוספים לפי צורך
);

-- מפעילים Row Level Security
alter table public.leads enable row level security;

-- מדיניות: משתמש אנונימי (האתר) יכול רק להוסיף ליד — לא לקרוא/לערוך/למחוק.
-- כך ה-anon key בטוח לחלוטין בקוד הציבורי: אי אפשר לשלוף לידים דרכו.
drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads"
  on public.leads
  for insert
  to anon
  with check (true);

-- אינדקס לפי תאריך לצפייה נוחה בלידים האחרונים
create index if not exists leads_created_at_idx on public.leads (created_at desc);
