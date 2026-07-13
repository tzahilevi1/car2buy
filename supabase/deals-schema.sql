-- ============================================================
--  Car2Buy — Deals / order forms (סגירת לקוח)
--  Full quote/order per lead: client, car, pricing, add-ons, totals.
--  Run once in SQL Editor (after crm-schema.sql). Gated by is_admin().
-- ============================================================

create sequence if not exists public.deals_order_seq start 3377;

create table if not exists public.deals (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  lead_id       uuid references public.leads(id) on delete set null,
  order_no      text not null default nextval('public.deals_order_seq')::text,
  form_type     text default 'חוזה קאר פלוס',
  status        text not null default 'quote',   -- quote | ordered | cancelled
  salesperson   text,
  -- client
  client_name   text,
  client_phone  text,
  client_email  text,
  client_address text,
  client_id     text,          -- ת.ז / ח.פ
  invoice_name  text,
  -- car
  car_make      text,
  car_model     text,
  car_year      integer,
  car_trim      text,
  car_engine    text,
  car_gearbox   text,
  car_color     text,
  -- pricing
  car_price     numeric,
  down_total    numeric,       -- סכום מקדמה כולל
  down_initial  numeric,       -- מקדמה ראשונית
  down_balance  numeric,       -- יתרת מקדמה
  monthly       numeric,       -- החזר חודשי משוער
  delivery_days integer,       -- זמן אספקה
  balance_to_pay numeric,      -- יתרה לתשלום
  -- add-ons + summary
  addons        jsonb,         -- {charging:bool, armor:bool, accessories:bool, addons_amount:num}
  vat_included  boolean default true,
  discount_pct  numeric,
  discount_amt  numeric,
  total         numeric,
  paid          numeric,
  spec          text,          -- מפרט רכב (טקסט חופשי)
  notes         text
);
alter table public.deals enable row level security;

drop policy if exists "auth read deals" on public.deals;
create policy "auth read deals" on public.deals for select to authenticated using (public.is_admin());
drop policy if exists "auth write deals" on public.deals;
create policy "auth write deals" on public.deals for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists deals_lead_idx on public.deals (lead_id);
create index if not exists deals_created_idx on public.deals (created_at desc);
