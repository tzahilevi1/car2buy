-- ============================================================
--  Car2Buy — סכימת מערכת הניהול (Admin)
--  טבלאות: appointments, cars, events  +  הרשאת קריאת leads למנהל.
--  להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query →
--  להדביק את כל הקובץ → Run.
-- ============================================================

-- ---------- 1) פגישות ----------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  phone       text,
  email       text,
  type        text,            -- סוג הפגישה
  branch      text,            -- סניף
  note        text,
  appt_date   text,            -- תאריך (כפי שמוצג בטופס)
  appt_time   text,            -- שעה HH:MM
  status      text not null default 'new'   -- new | handled | cancelled
);
alter table public.appointments enable row level security;

drop policy if exists "anon insert appointments" on public.appointments;
create policy "anon insert appointments"
  on public.appointments for insert to anon with check (true);

drop policy if exists "auth read appointments" on public.appointments;
create policy "auth read appointments"
  on public.appointments for select to authenticated using (true);

drop policy if exists "auth update appointments" on public.appointments;
create policy "auth update appointments"
  on public.appointments for update to authenticated using (true) with check (true);

create index if not exists appointments_created_at_idx on public.appointments (created_at desc);


-- ---------- 2) רכבים (הוספה ידנית מהפאנל) ----------
create table if not exists public.cars (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  brand       text not null,          -- מותג (עברית, כפי שבקטלוג)
  name        text not null,          -- דגם
  trim        text,                   -- גרסה/רמת גימור
  monthly     integer,                -- החזר חודשי (₪) = m
  price       integer,                -- מחיר (₪) = p
  img         text,                   -- כתובת תמונה
  cat         text,                   -- קטגוריה (suv/sedan/ev...)
  fuel        text,                   -- סוג דלק
  year        integer,
  active      boolean not null default true,
  extra       jsonb                   -- שדות נוספים חופשיים
);
alter table public.cars enable row level security;

-- האתר הציבורי קורא רק רכבים פעילים
drop policy if exists "public read active cars" on public.cars;
create policy "public read active cars"
  on public.cars for select to anon using (active = true);

-- המנהל המאומת רואה/מנהל הכל
drop policy if exists "auth read all cars" on public.cars;
create policy "auth read all cars"
  on public.cars for select to authenticated using (true);

drop policy if exists "auth write cars" on public.cars;
create policy "auth write cars"
  on public.cars for all to authenticated using (true) with check (true);

create index if not exists cars_active_idx on public.cars (active);


-- ---------- 3) אירועי אנליטיקס ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  session_id  text,
  type        text,            -- pageview | session_end
  page        text,            -- pathname
  referrer    text,
  duration_ms integer,         -- לאירוע session_end
  ua          text
);
alter table public.events enable row level security;

drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon with check (true);

drop policy if exists "auth read events" on public.events;
create policy "auth read events"
  on public.events for select to authenticated using (true);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_session_idx on public.events (session_id);


-- ---------- 4) הרשאת קריאת לידים למנהל ----------
-- (טבלת leads כבר קיימת עם INSERT ל-anon בלבד; מוסיפים SELECT למנהל מאומת)
drop policy if exists "auth read leads" on public.leads;
create policy "auth read leads"
  on public.leads for select to authenticated using (true);
