-- ============================================================
--  Car2Buy — הרצה אחת של כל העדכונים (idempotent, אפשר להריץ שוב)
--  Supabase → SQL Editor → הדבק הכל → Run.
--  דרישות Vault (רק אם עוד לא): service_role_key, resend_key,
--  ואופציונלי anthropic_key לעוזר ה-AI.
-- ============================================================


-- ========================= crm-upgrade.sql =========================

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

-- ========================= field-lists.sql =========================

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

-- ========================= email-notify.sql =========================

-- ============================================================
--  Car2Buy — התראות מייל אוטומטיות (Phase 2)
--  שולח מייל לבעלים בכל פגישה/ליד חדש, ישירות מהדאטהבייס דרך
--  pg_net + Resend. המפתח נשמר ב-Vault (ראה שלב "אחסון המפתח").
--  להריץ פעם אחת: SQL Editor → הדבק הכל → Run.
-- ============================================================

create extension if not exists pg_net with schema extensions;

-- בריחת תווי HTML מערכים של המשתמש (הליד ממקור ציבורי)
create or replace function public.c2b_esc(t text)
returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- שליחת מייל דרך Resend (קורא את המפתח מ-Vault)
create or replace function public.c2b_send_email(p_to text, p_subject text, p_html text)
returns void language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_key' limit 1;
  if k is null then raise notice 'c2b: resend_key missing in Vault'; return; end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', 'Car2Buy <noreply@electric-group.co.il>', 'to', p_to, 'subject', p_subject, 'html', p_html)
  );
end $$;

-- טריגר: פגישה חדשה → מייל לבעלים
create or replace function public.c2b_notify_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare html text;
begin
  html := '<div dir="rtl" style="font-family:Arial,sans-serif">'
    || '<h2 style="color:#F5691E">פגישה חדשה נקבעה באתר</h2>'
    || '<p><b>שם:</b> ' || public.c2b_esc(NEW.name) || '</p>'
    || '<p><b>טלפון:</b> ' || public.c2b_esc(NEW.phone) || '</p>'
    || '<p><b>אימייל:</b> ' || public.c2b_esc(NEW.email) || '</p>'
    || '<p><b>מועד:</b> ' || public.c2b_esc(NEW.appt_date) || ' ' || public.c2b_esc(NEW.appt_time) || '</p>'
    || '<p><b>סניף:</b> ' || public.c2b_esc(NEW.branch) || '</p>'
    || '<p><b>סוג:</b> ' || public.c2b_esc(NEW.type) || '</p>'
    || '<p><b>הערה:</b> ' || public.c2b_esc(NEW.note) || '</p></div>';
  perform public.c2b_send_email('zahcilevi111@gmail.com', '📅 פגישה חדשה מהאתר — ' || coalesce(NEW.name, ''), html);
  return NEW;
end $$;

drop trigger if exists trg_c2b_notify_appointment on public.appointments;
create trigger trg_c2b_notify_appointment after insert on public.appointments for each row execute function public.c2b_notify_appointment();

-- טריגר: ליד חדש (עם טלפון) → מייל לבעלים
create or replace function public.c2b_notify_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare html text;
begin
  if NEW.phone is null or NEW.phone = '' then return NEW; end if;  -- מדלג על הרשמות ניוזלטר בלבד
  html := '<div dir="rtl" style="font-family:Arial,sans-serif">'
    || '<h2 style="color:#F5691E">ליד חדש נכנס</h2>'
    || '<p><b>שם:</b> ' || public.c2b_esc(NEW.name) || '</p>'
    || '<p><b>טלפון:</b> ' || public.c2b_esc(NEW.phone) || '</p>'
    || '<p><b>רכב:</b> ' || public.c2b_esc(NEW.car) || '</p>'
    || '<p><b>מקור:</b> ' || public.c2b_esc(NEW.source) || '</p></div>';
  perform public.c2b_send_email('zahcilevi111@gmail.com', '🆕 ליד חדש — ' || coalesce(NEW.name, ''), html);
  return NEW;
end $$;

drop trigger if exists trg_c2b_notify_lead on public.leads;
create trigger trg_c2b_notify_lead after insert on public.leads for each row execute function public.c2b_notify_lead();

-- ========================= user-admin.sql =========================

-- ============================================================
--  Car2Buy — add users from the panel (invite by email).
--  "הוסף משתמש" calls admin_create_user(), which:
--    1) creates a confirmed auth user (GoTrue admin API via pg_net)
--       with role + allowed views in user metadata, and
--    2) emails the person their login URL + a temporary password
--       (Resend), so they can sign in and later reset the password.
--  It RETURNS the temp password to the panel so onboarding works even
--  if the email is delayed/blocked. admin_net_result() lets the panel
--  see the real outcome of each async call (so failures aren't silent).
--
--  Prereqs in Vault (run once each):
--     select vault.create_secret('SERVICE_ROLE_KEY', 'service_role_key');
--     select vault.create_secret('re_...RESEND_KEY', 'resend_key');   -- already set
--
--  IMPORTANT: emails reach ANY recipient only from a VERIFIED Resend
--  domain. onboarding@resend.dev (sandbox) sends ONLY to the account
--  owner. This file sends from noreply@electric-group.co.il — make sure
--  that domain is verified in Resend (Domains → Verify). Change the
--  from_addr below if you use a different verified domain.
--  Run this whole file. Safe to re-run.
-- ============================================================

create or replace function public.admin_create_user(p_email text, p_name text, p_role text, p_views text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  svc text; rk text; pw text;
  base      text := 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  login_url text := 'https://tzahilevi1.github.io/car2buy/admin.html';
  from_addr text := 'Car2Buy <noreply@electric-group.co.il>';   -- must be a VERIFIED Resend domain
  html text; create_req bigint; email_req bigint := null;
begin
  if not public.is_admin() then raise exception 'לא מורשה'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'אימייל לא תקין'; end if;

  select decrypted_secret into svc from vault.decrypted_secrets where name = 'service_role_key';
  if svc is null then raise exception 'חסר service_role_key ב-Vault'; end if;

  pw := upper(substr(md5(gen_random_uuid()::text), 1, 3))
        || substr(md5(gen_random_uuid()::text), 1, 7)
        || floor(random() * 90 + 10)::int::text;

  -- 1) create a confirmed auth user; role/views ride along in metadata
  select net.http_post(
    url     := base || '/auth/v1/admin/users',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', svc, 'Authorization', 'Bearer ' || svc),
    body    := jsonb_build_object(
      'email', p_email, 'password', pw, 'email_confirm', true,
      'user_metadata', jsonb_build_object('full_name', p_name, 'role', p_role, 'views', to_jsonb(p_views))
    )
  ) into create_req;

  -- 2) email the credentials (Resend) — only if a key is present
  select decrypted_secret into rk from vault.decrypted_secrets where name = 'resend_key';
  if rk is not null then
    html := '<div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.7">'
         || '<h2 style="color:#F5691E;margin:0 0 8px">ברוך הבא ל-Car2Buy CRM</h2>'
         || '<p>נוצר עבורך חשבון במערכת. אלה פרטי ההתחברות שלך:</p>'
         || '<table style="border-collapse:collapse"><tr><td style="padding:4px 10px 4px 0">כתובת:</td><td><a href="' || login_url || '">' || login_url || '</a></td></tr>'
         || '<tr><td style="padding:4px 10px 4px 0">אימייל:</td><td><b>' || p_email || '</b></td></tr>'
         || '<tr><td style="padding:4px 10px 4px 0">סיסמה זמנית:</td><td><b>' || pw || '</b></td></tr></table>'
         || '<p style="color:#555;font-size:13px">מומלץ להחליף סיסמה אחרי הכניסה. שכחת סיסמה? לחצו "שכחתי סיסמה" בעמוד הכניסה.</p></div>';
    select net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || rk),
      body    := jsonb_build_object('from', from_addr, 'to', jsonb_build_array(p_email),
                  'subject', 'פרטי התחברות ל-Car2Buy CRM', 'html', html)
    ) into email_req;
  end if;

  return jsonb_build_object('password', pw, 'email', p_email,
    'create_req', create_req, 'email_req', email_req, 'emailed', rk is not null);
end $$;

-- read the real async result of a pg_net request (so failures aren't silent)
create or replace function public.admin_net_result(p_id bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.is_admin() then raise exception 'לא מורשה'; end if;
  if p_id is null then return null; end if;
  begin
    select status_code, content, error_msg into r from net._http_response where id = p_id;
  exception when others then return null;
  end;
  if not found then return null; end if;
  return jsonb_build_object('status', r.status_code, 'content', r.content, 'error', r.error_msg);
end $$;

grant execute on function public.admin_create_user(text, text, text, text[]) to authenticated;
grant execute on function public.admin_net_result(bigint) to authenticated;

-- ========================= ai-assistant.sql =========================

-- ============================================================
--  Car2Buy — AI assistant for managers (Claude via pg_net).
--  The panel gathers a compact data summary (client-side, under RLS),
--  sends it + the manager's question to Claude through ai_ask(); the
--  Anthropic key stays in the DB (Vault) and is never exposed to the
--  browser. ai_get() polls for the async response.
--
--  Prereq — store the Anthropic API key in Vault ONCE:
--     select vault.create_secret('sk-ant-...', 'anthropic_key');
--
--  Then run this file. Admin only. Safe to re-run.
-- ============================================================

-- submit a prompt → returns the pg_net request id
create or replace function public.ai_ask(p_prompt text)
returns bigint
language plpgsql security definer set search_path = public as $$
declare k text; rid bigint;
begin
  if not public.is_admin() then raise exception 'לא מורשה'; end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'anthropic_key' limit 1;
  if k is null then raise exception 'חסר anthropic_key ב-Vault (ראה הוראות בקובץ)'; end if;

  select net.http_post(
    url     := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('content-type', 'application/json', 'x-api-key', k, 'anthropic-version', '2023-06-01'),
    body    := jsonb_build_object(
      'model', 'claude-sonnet-5',            -- אם תתקבל שגיאת model, עדכן כאן
      'max_tokens', 1200,
      'system', 'אתה יועץ עסקי בכיר לסוכנות ליסינג ומימון רכב בשם Car2Buy. ענה בעברית, תמציתי, מעשי וברור, עם המלצות פעולה ממוקדות ומספרים. התבסס אך ורק על הנתונים שסופקו; אם חסר מידע — ציין זאת.',
      'messages', jsonb_build_array(jsonb_build_object('role', 'user', 'content', p_prompt))
    )
  ) into rid;
  return rid;
end $$;

-- poll for the response: null = still pending; else {status, content, error}
create or replace function public.ai_get(p_id bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.is_admin() then raise exception 'לא מורשה'; end if;
  begin
    select status_code, content, error_msg into r from net._http_response where id = p_id;
  exception when others then
    return null;   -- table not ready / transient → treat as pending
  end;
  if not found then return null; end if;   -- response hasn't arrived yet
  return jsonb_build_object('status', r.status_code, 'content', r.content, 'error', r.error_msg);
end $$;

grant execute on function public.ai_ask(text) to authenticated;
grant execute on function public.ai_get(bigint) to authenticated;
