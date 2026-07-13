-- ============================================================
--  Car2Buy — allow deleting leads (bulk delete in the panel).
--  Admin only (destructive — cascades to activities/tasks/docs/deals).
--  Deleting deals is already permitted by the existing deals policies.
--  Run once in SQL Editor. Safe to re-run.
-- ============================================================
drop policy if exists "admin delete leads" on public.leads;
create policy "admin delete leads" on public.leads for delete to authenticated
  using (public.is_admin());
