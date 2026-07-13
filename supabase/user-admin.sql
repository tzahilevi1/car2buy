-- ============================================================
--  Car2Buy — add users from the panel (invite by email).
--  "הוסף משתמש" in the CRM calls admin_create_user(), which:
--    1) creates a confirmed auth user (GoTrue admin API via pg_net)
--       with role + allowed views stored in user metadata, and
--    2) emails the person their login URL + a temporary password
--       (Resend), so they can sign in and later reset the password.
--
--  Prereq — store the SERVICE ROLE key in Vault ONCE (it never leaves
--  the DB; the panel never sees it). Replace the placeholder and run:
--
--     select vault.create_secret('PASTE_SERVICE_ROLE_KEY_HERE', 'service_role_key');
--
--  (resend_key is already in Vault from the email setup.)
--  Then run the rest of this file. Safe to re-run.
-- ============================================================

create or replace function public.admin_create_user(p_email text, p_name text, p_role text, p_views text[])
returns text
language plpgsql security definer set search_path = public as $$
declare
  svc text;
  rk  text;
  pw  text;
  base      text := 'https://tdxhqpauuqawcoivjnnm.supabase.co';
  login_url text := 'https://tzahilevi1.github.io/car2buy/admin.html';
  from_addr text := 'Car2Buy <noreply@electric-group.co.il>';
  html text;
begin
  if not public.is_admin() then raise exception 'לא מורשה'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'אימייל לא תקין'; end if;

  select decrypted_secret into svc from vault.decrypted_secrets where name = 'service_role_key';
  if svc is null then raise exception 'חסר service_role_key ב-Vault (ראה הוראות בקובץ)'; end if;

  -- temporary password: 3 upper + 7 hex + 2 digits (meets complexity)
  pw := upper(substr(md5(gen_random_uuid()::text), 1, 3))
        || substr(md5(gen_random_uuid()::text), 1, 7)
        || floor(random() * 90 + 10)::int::text;

  -- 1) create a confirmed auth user; role/views ride along in metadata
  --    (handle_new_user trigger turns that into the profile row)
  perform net.http_post(
    url     := base || '/auth/v1/admin/users',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', svc, 'Authorization', 'Bearer ' || svc),
    body    := jsonb_build_object(
      'email', p_email, 'password', pw, 'email_confirm', true,
      'user_metadata', jsonb_build_object('full_name', p_name, 'role', p_role, 'views', to_jsonb(p_views))
    )
  );

  -- 2) email the credentials (Resend)
  select decrypted_secret into rk from vault.decrypted_secrets where name = 'resend_key';
  if rk is not null then
    html := '<div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.7">'
         || '<h2 style="color:#F5691E;margin:0 0 8px">ברוך הבא ל-Car2Buy CRM</h2>'
         || '<p>נוצר עבורך חשבון במערכת. אלה פרטי ההתחברות שלך:</p>'
         || '<table style="border-collapse:collapse"><tr><td style="padding:4px 10px 4px 0">כתובת:</td><td><a href="' || login_url || '">' || login_url || '</a></td></tr>'
         || '<tr><td style="padding:4px 10px 4px 0">אימייל:</td><td><b>' || p_email || '</b></td></tr>'
         || '<tr><td style="padding:4px 10px 4px 0">סיסמה זמנית:</td><td><b>' || pw || '</b></td></tr></table>'
         || '<p style="color:#555;font-size:13px">מומלץ להחליף סיסמה אחרי הכניסה. שכחת סיסמה בעתיד? לחצו "שכחתי סיסמה" בעמוד הכניסה.</p></div>';
    perform net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || rk),
      body    := jsonb_build_object('from', from_addr, 'to', jsonb_build_array(p_email),
                  'subject', 'פרטי התחברות ל-Car2Buy CRM', 'html', html)
    );
  end if;

  return 'ok';
end $$;

grant execute on function public.admin_create_user(text, text, text, text[]) to authenticated;
