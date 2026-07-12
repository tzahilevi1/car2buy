-- ============================================================
--  Car2Buy — סכימת מערכת הניהול (Admin)
--  טבלאות: admins, appointments, cars, events  +  הרשאת קריאת leads.
--  להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query →
--  להדביק את כל הקובץ → Run.
--
--  אחרי יצירת משתמש המנהל (Authentication → Users), הרץ גם את
--  שורת ה-INSERT שבסוף הקובץ כדי לסמן אותו כמנהל.
-- ============================================================

-- ---------- 0) רשימת מנהלים + פונקציית בדיקה ----------
-- רק user_id שמופיע כאן מקבל גישת-על. מגן על נתוני הלקוחות גם אם
-- בטעות תישאר הרשמה ציבורית פתוחה.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;  -- ללא policies: נגיש רק ל-service_role

-- SECURITY DEFINER → עוקף RLS כדי לבדוק חברות בבטחה
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;


-- ---------- 1) פגישות ----------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  phone       text,
  email       text,
  type        text,
  branch      text,
  note        text,
  appt_date   text,
  appt_time   text,
  status      text not null default 'new'
);
alter table public.appointments enable row level security;

drop policy if exists "anon insert appointments" on public.appointments;
create policy "anon insert appointments"
  on public.appointments for insert to anon with check (true);

drop policy if exists "auth read appointments" on public.appointments;
create policy "auth read appointments"
  on public.appointments for select to authenticated using (public.is_admin());

drop policy if exists "auth update appointments" on public.appointments;
create policy "auth update appointments"
  on public.appointments for update to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists appointments_created_at_idx on public.appointments (created_at desc);


-- ---------- 2) רכבים (הוספה ידנית מהפאנל) ----------
create table if not exists public.cars (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  brand       text not null,
  name        text not null,
  trim        text,
  monthly     integer,
  price       integer,
  img         text,
  cat         text,
  fuel        text,
  year        integer,
  active      boolean not null default true,
  extra       jsonb
);
alter table public.cars enable row level security;

-- האתר הציבורי קורא רק רכבים פעילים
drop policy if exists "public read active cars" on public.cars;
create policy "public read active cars"
  on public.cars for select to anon using (active = true);

-- המנהל רואה/מנהל הכל
drop policy if exists "auth read all cars" on public.cars;
create policy "auth read all cars"
  on public.cars for select to authenticated using (public.is_admin());

drop policy if exists "auth write cars" on public.cars;
create policy "auth write cars"
  on public.cars for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists cars_active_idx on public.cars (active);


-- ---------- 3) אירועי אנליטיקס ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  session_id  text,
  type        text,
  page        text,
  referrer    text,
  duration_ms integer,
  ua          text
);
alter table public.events enable row level security;

drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon with check (true);

drop policy if exists "auth read events" on public.events;
create policy "auth read events"
  on public.events for select to authenticated using (public.is_admin());

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_session_idx on public.events (session_id);


-- ---------- 4) הרשאת קריאת לידים למנהל ----------
drop policy if exists "auth read leads" on public.leads;
create policy "auth read leads"
  on public.leads for select to authenticated using (public.is_admin());


-- ============================================================
--  אחרי יצירת משתמש המנהל ב-Authentication → Users, הרץ את זה
--  (מחליף את המייל אם צריך) כדי להעניק לו גישת-על:
-- ============================================================
insert into public.admins (user_id)
select id from auth.users where email = 'zahcilevi111@gmail.com'
on conflict (user_id) do nothing;
