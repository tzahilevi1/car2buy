-- ============================================================
--  Car2Buy — CRM core schema (Phase 1)
--  Extends leads + adds profiles, activities, tasks, lead_documents
--  and a private Storage bucket. All gated by public.is_admin().
--  Run once in Supabase SQL Editor (after admin-schema.sql).
-- ============================================================

-- ---------- 1) extend leads with CRM fields ----------
alter table public.leads add column if not exists status text not null default 'new';
alter table public.leads add column if not exists assigned_to uuid;
alter table public.leads add column if not exists close_reason text;
alter table public.leads add column if not exists status_changed_at timestamptz;
alter table public.leads add column if not exists first_response_at timestamptz;
alter table public.leads add column if not exists city text;

drop policy if exists "auth update leads" on public.leads;
create policy "auth update leads"
  on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_assigned_idx on public.leads (assigned_to);


-- ---------- 2) profiles (salespeople / managers) ----------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'agent',   -- admin | manager | agent
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "auth read profiles" on public.profiles;
create policy "auth read profiles" on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists "auth write profiles" on public.profiles;
create policy "auth write profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------- 3) activities (unified timeline) ----------
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  type       text not null,   -- note | call | whatsapp | email | sms | status_change | task | meeting | document | system
  body       text,
  meta       jsonb,
  created_by uuid
);
alter table public.activities enable row level security;

drop policy if exists "auth read activities" on public.activities;
create policy "auth read activities" on public.activities for select to authenticated using (public.is_admin());
drop policy if exists "auth write activities" on public.activities;
create policy "auth write activities" on public.activities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists activities_lead_idx on public.activities (lead_id, created_at desc);


-- ---------- 4) tasks / reminders ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  lead_id     uuid references public.leads(id) on delete cascade,
  title       text not null,
  due_at      timestamptz,
  assigned_to uuid,
  done        boolean not null default false
);
alter table public.tasks enable row level security;

drop policy if exists "auth read tasks" on public.tasks;
create policy "auth read tasks" on public.tasks for select to authenticated using (public.is_admin());
drop policy if exists "auth write tasks" on public.tasks;
create policy "auth write tasks" on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists tasks_lead_idx on public.tasks (lead_id);
create index if not exists tasks_due_idx on public.tasks (due_at) where done = false;


-- ---------- 5) lead documents (metadata; files in Storage) ----------
create table if not exists public.lead_documents (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  name         text,
  storage_path text
);
alter table public.lead_documents enable row level security;

drop policy if exists "auth read docs" on public.lead_documents;
create policy "auth read docs" on public.lead_documents for select to authenticated using (public.is_admin());
drop policy if exists "auth write docs" on public.lead_documents;
create policy "auth write docs" on public.lead_documents for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------- 6) private Storage bucket for documents ----------
insert into storage.buckets (id, name, public) values ('lead-docs', 'lead-docs', false)
on conflict (id) do nothing;

drop policy if exists "admin manage lead-docs" on storage.objects;
create policy "admin manage lead-docs" on storage.objects
  for all to authenticated
  using (bucket_id = 'lead-docs' and public.is_admin())
  with check (bucket_id = 'lead-docs' and public.is_admin());


-- ---------- 7) seed the owner as an admin profile ----------
insert into public.profiles (user_id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', email), 'admin'
from auth.users where email = 'zahcilevi111@gmail.com'
on conflict (user_id) do nothing;
