-- ============================================================
--  Car2Buy — accounting workspace fields.
--  Custom accounting status per deal + notes, and let the
--  accounting manager (role 'accounting') update deals.
--  Run once in SQL Editor. Safe to re-run.
-- ============================================================
alter table public.deals add column if not exists acct_status text;   -- pending|receipt|invoice|partial|paid
alter table public.deals add column if not exists acct_notes  text;

-- accounting manager can update deals (accounting fields) across all files
drop policy if exists "accounting write deals" on public.deals;
create policy "accounting write deals" on public.deals for all to authenticated
  using (public.my_role() = 'accounting') with check (public.my_role() = 'accounting');
