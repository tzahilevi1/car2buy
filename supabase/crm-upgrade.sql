-- ============================================================
--  Car2Buy — CRM upgrade (July 2026)
--  1) more lead fields (IP, UTM, marketing company, ad group, brand)
--  2) leads.updated_at (auto-touched on any activity)
--  3) profiles.views (which screens a user may open)
--  4) permissions: admin sees all; other staff see only THEIR assigned
--     leads + related activities/tasks/docs/deals
--  5) new-user trigger reads role/views from invite metadata
--  6) 3 demo profiles so the roles are visible in the panel
--  Run once in SQL Editor (after roles-schema.sql). Safe to re-run.
-- ============================================================

-- ---------- 1) extra lead fields ----------
alter table public.leads add column if not exists ip                text;
alter table public.leads add column if not exists marketing_company text;   -- חברת שיווק
alter table public.leads add column if not exists utm_source        text;
alter table public.leads add column if not exists utm_campaign      text;
alter table public.leads add column if not exists utm_medium        text;
alter table public.leads add column if not exists utm_content       text;
alter table public.leads add column if not exists utm_term          text;
alter table public.leads add column if not exists ad_group          text;
alter table public.leads add column if not exists brand             text;   -- מותג מבוקש
alter table public.leads add column if not exists updated_at        timestamptz;

-- ---------- 2) touch leads.updated_at whenever an activity is logged ----------
create or replace function public.touch_lead_updated() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if NEW.lead_id is not null then
    update public.leads set updated_at = now() where id = NEW.lead_id;
  end if;
  return NEW;
end $$;
drop trigger if exists activities_touch_lead on public.activities;
create trigger activities_touch_lead after insert on public.activities
  for each row execute function public.touch_lead_updated();

-- ---------- 3) profiles.views + email (email lets admin trigger a reset) ----------
alter table public.profiles add column if not exists views text[];
alter table public.profiles add column if not exists email text;

-- agent commission on a deal (auto-filled from the car catalog)
alter table public.deals add column if not exists commission numeric;

-- ---------- 4) helper: is this lead assigned to me? ----------
create or replace function public.owns_lead(l uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.leads where id = l and assigned_to = auth.uid())
$$;

-- leads: admin=all, accounting=all (needs full financial picture), others=assigned only
drop policy if exists "staff read leads" on public.leads;
create policy "staff read leads" on public.leads for select to authenticated
  using (public.is_admin() or public.my_role() = 'accounting' or (public.is_staff() and assigned_to = auth.uid()));
drop policy if exists "staff update leads" on public.leads;
create policy "staff update leads" on public.leads for update to authenticated
  using (public.is_admin() or (public.is_staff() and assigned_to = auth.uid()))
  with check (public.is_admin() or (public.is_staff() and assigned_to = auth.uid()));

-- activities / tasks / lead_documents / deals: assigned-lead scoped (accounting sees all)
do $$
declare t text;
begin
  foreach t in array array['activities','tasks','lead_documents','deals'] loop
    execute format('drop policy if exists "staff read %1$s" on public.%1$s', t);
    execute format('drop policy if exists "staff write %1$s" on public.%1$s', t);
    execute format($f$create policy "staff read %1$s" on public.%1$s for select to authenticated
      using (public.is_admin() or public.my_role() = 'accounting' or (public.is_staff() and public.owns_lead(lead_id)))$f$, t);
    execute format($f$create policy "staff write %1$s" on public.%1$s for all to authenticated
      using (public.is_admin() or (public.is_staff() and public.owns_lead(lead_id)))
      with check (public.is_admin() or (public.is_staff() and public.owns_lead(lead_id)))$f$, t);
  end loop;
end $$;

-- payments: admin + accounting full; other staff only on their assigned leads
drop policy if exists "staff read payments" on public.payments;
create policy "staff read payments" on public.payments for select to authenticated
  using (public.is_admin() or public.my_role() = 'accounting' or (public.is_staff() and public.owns_lead(lead_id)));

-- ---------- 5) new user → profile with role + views from invite metadata ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(NEW.raw_user_meta_data->>'role', 'sales');
  v text[];
begin
  begin
    v := array(select jsonb_array_elements_text(NEW.raw_user_meta_data->'views'));
  exception when others then v := null;
  end;
  insert into public.profiles (user_id, full_name, role, views, email)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email), r, v, NEW.email)
  on conflict (user_id) do update set role = excluded.role, email = excluded.email,
    views = coalesce(excluded.views, public.profiles.views);
  return NEW;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- backfill email for existing profiles (needed for admin-triggered reset)
update public.profiles p set email = u.email from auth.users u
where u.id = p.user_id and (p.email is null or p.email = '');

-- keep the owner an admin
update public.profiles set role = 'admin', active = true
where user_id in (select id from auth.users where email in ('zahcilevi111@gmail.com','zahcilevi20@gmail.com'));

-- Note: real users (with a login) are created from the panel via "הוסף משתמש",
-- which invites them by email (see user-admin.sql). A profile row cannot exist
-- without a matching auth user (foreign key), so there are no fake demo rows.
