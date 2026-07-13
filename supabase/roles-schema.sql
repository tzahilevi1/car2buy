-- ============================================================
--  Car2Buy — Roles & permissions (הרשאות לפי סוג עובד)
--  Roles: admin | sales | files | accounting
--  Run once in SQL Editor (after all previous schemas).
--  The owner stays full-access via the admins table (is_admin()).
-- ============================================================

-- ---------- role helpers ----------
create or replace function public.is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and active = true)
$$;

create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and active = true limit 1
$$;

-- let every user read their OWN profile (so the panel can fetch the role)
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (user_id = auth.uid());

-- ---------- shared CRM tables → any active staff (admin always included) ----------
-- leads
drop policy if exists "auth read leads" on public.leads;
create policy "staff read leads" on public.leads for select to authenticated using (public.is_admin() or public.is_staff());
drop policy if exists "auth update leads" on public.leads;
create policy "staff update leads" on public.leads for update to authenticated using (public.is_admin() or public.is_staff()) with check (public.is_admin() or public.is_staff());

-- appointments
drop policy if exists "auth read appointments" on public.appointments;
create policy "staff read appointments" on public.appointments for select to authenticated using (public.is_admin() or public.is_staff());
drop policy if exists "auth update appointments" on public.appointments;
create policy "staff update appointments" on public.appointments for update to authenticated using (public.is_admin() or public.is_staff()) with check (public.is_admin() or public.is_staff());

-- activities / tasks / lead_documents / deals → staff full
do $$
declare t text;
begin
  foreach t in array array['activities','tasks','lead_documents','deals'] loop
    execute format('drop policy if exists "auth read %1$s" on public.%1$s', t);
    execute format('drop policy if exists "auth write %1$s" on public.%1$s', t);
    execute format('create policy "staff read %1$s" on public.%1$s for select to authenticated using (public.is_admin() or public.is_staff())', t);
    execute format('create policy "staff write %1$s" on public.%1$s for all to authenticated using (public.is_admin() or public.is_staff()) with check (public.is_admin() or public.is_staff())', t);
  end loop;
end $$;

-- events → staff read (analytics)
drop policy if exists "auth read events" on public.events;
create policy "staff read events" on public.events for select to authenticated using (public.is_admin() or public.is_staff());

-- ---------- payments → read for staff, write only admin/accounting ----------
drop policy if exists "auth read payments" on public.payments;
create policy "staff read payments" on public.payments for select to authenticated using (public.is_admin() or public.is_staff());
drop policy if exists "auth write payments" on public.payments;
create policy "acct write payments" on public.payments for all to authenticated using (public.is_admin() or public.my_role() = 'accounting') with check (public.is_admin() or public.my_role() = 'accounting');

-- ---------- new auth user → auto profile (default role 'sales') ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email), 'sales')
  on conflict (user_id) do nothing;
  return NEW;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ensure the owner is admin
update public.profiles set role = 'admin', active = true
where user_id in (select id from auth.users where email = 'zahcilevi111@gmail.com');
