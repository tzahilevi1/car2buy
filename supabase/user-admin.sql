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
