-- ============================================================
-- Car2Buy — Supabase Row Level Security (RLS) hardening.
-- Run in the Supabase SQL editor. Idempotent (safe to re-run).
--
-- Model:
--   * Public forms use the ANON key and may only INSERT into
--     leads / events / appointments (no read).
--   * Everything else (CRM) requires an authenticated session.
--   * The service_role key bypasses RLS and must NEVER ship to the
--     browser — keep it server-side / in Supabase Vault only.
-- ============================================================

-- 1) Enable RLS on every table (denies all access until a policy allows it).
alter table if exists public.leads           enable row level security;
alter table if exists public.events          enable row level security;
alter table if exists public.appointments    enable row level security;
alter table if exists public.profiles        enable row level security;
alter table if exists public.activities      enable row level security;
alter table if exists public.tasks           enable row level security;
alter table if exists public.deals           enable row level security;
alter table if exists public.payments        enable row level security;
alter table if exists public.lead_documents  enable row level security;
alter table if exists public.field_options   enable row level security;

-- 2) Public tables: anon may INSERT only; authenticated may read/write.
do $$
declare t text;
begin
  foreach t in array array['leads','events','appointments'] loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists %I on public.%I', t||'_anon_insert', t);
      execute format('drop policy if exists %I on public.%I', t||'_auth_all', t);
      -- anon (and authenticated) may insert new rows, but cannot read them back
      execute format($p$create policy %I on public.%I for insert to anon, authenticated with check (true)$p$, t||'_anon_insert', t);
      -- only signed-in staff may select / update / delete
      execute format($p$create policy %I on public.%I for all to authenticated using (true) with check (true)$p$, t||'_auth_all', t);
    end if;
  end loop;
end $$;

-- NOTE: the "for all to authenticated" policy above also grants insert to
-- authenticated; the anon policy is what lets public forms write. Because no
-- SELECT policy exists for anon, the anon key CANNOT read any lead/event/appointment.

-- 3) CRM tables: authenticated only (no anon access at all).
do $$
declare t text;
begin
  foreach t in array array['profiles','activities','tasks','deals','payments','lead_documents','field_options'] loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists %I on public.%I', t||'_auth_all', t);
      execute format($p$create policy %I on public.%I for all to authenticated using (true) with check (true)$p$, t||'_auth_all', t);
    end if;
  end loop;
end $$;

-- 4) (Optional, stricter) scope profiles to the owner only:
--    drop policy if exists profiles_auth_all on public.profiles;
--    create policy profiles_self on public.profiles for all to authenticated
--      using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5) Verify: this should show rowsecurity = true for every table.
--    select relname, relrowsecurity from pg_class
--    where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname;
