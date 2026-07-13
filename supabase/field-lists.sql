-- ============================================================
--  Car2Buy — admin-managed dropdown lists (field_options).
--  The admin defines allowed values for מותג / מקור הגעה /
--  חברת שיווק / utm_source in "הגדרות ורשימות"; these power the
--  dropdowns in the lead edit form and the filter bars.
--  Run once in SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.field_options (
  id      bigint generated always as identity primary key,
  field   text not null,           -- brand | source | marketing_company | utm_source
  value   text not null,
  created_at timestamptz not null default now(),
  unique (field, value)
);
alter table public.field_options enable row level security;

-- any active staff may read the lists; only admin may edit them
drop policy if exists "staff read field_options" on public.field_options;
create policy "staff read field_options" on public.field_options for select to authenticated
  using (public.is_admin() or public.is_staff());
drop policy if exists "admin write field_options" on public.field_options;
create policy "admin write field_options" on public.field_options for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create index if not exists field_options_field_idx on public.field_options (field);
