-- ============================================================
--  Car2Buy — Accounting (הנהלת חשבונות)
--  Payment/receipt/invoice ledger per deal + balances tracking.
--  Run once in SQL Editor (after deals-schema.sql). Gated by is_admin().
--  Note: legal e-invoices need an external provider (e.g. Green Invoice);
--  this is the internal ledger/collection tracking.
-- ============================================================

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  deal_id    uuid references public.deals(id) on delete cascade,
  lead_id    uuid,
  kind       text not null default 'payment',   -- invoice | receipt | payment
  amount     numeric not null default 0,
  method     text,        -- אשראי | מזומן | העברה | צ'ק
  ref_no     text,        -- מספר חשבונית/אסמכתא
  paid_at    date,
  notes      text
);
alter table public.payments enable row level security;

drop policy if exists "auth read payments" on public.payments;
create policy "auth read payments" on public.payments for select to authenticated using (public.is_admin());
drop policy if exists "auth write payments" on public.payments;
create policy "auth write payments" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists payments_deal_idx on public.payments (deal_id);
create index if not exists payments_created_idx on public.payments (created_at desc);
