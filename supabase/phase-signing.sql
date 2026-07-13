-- ============================================================
--  Car2Buy — יצירת ליד מהפאנל + חתימה על הסכם מרחוק
--  שולחים ללקוח קישור (מייל/וואטסאפ/SMS), הוא חותם בעמוד ציבורי,
--  והחתימה חוזרת אלינו: העסקה מסומנת "נחתם", נרשם בציר הזמן, ונשלח
--  מייל התראה לבעלים. Run once. Safe to re-run.
-- ============================================================

-- ---------- 1) staff can create leads from the panel ----------
drop policy if exists "staff insert leads" on public.leads;
create policy "staff insert leads" on public.leads for insert to authenticated
  with check (public.is_admin() or public.is_staff());

-- ---------- 2) signing columns on deals ----------
alter table public.deals add column if not exists sign_token uuid;
alter table public.deals add column if not exists signature  text;         -- data URL of the client signature
alter table public.deals add column if not exists signed_at  timestamptz;

-- ---------- 3) create/refresh a signing token (staff) ----------
create or replace function public.make_sign_token(p_deal uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not (public.is_admin() or public.is_staff()) then raise exception 'לא מורשה'; end if;
  select sign_token into t from public.deals where id = p_deal;
  if t is null then t := gen_random_uuid(); update public.deals set sign_token = t where id = p_deal; end if;
  return t;
end $$;
grant execute on function public.make_sign_token(uuid) to authenticated;

-- ---------- 4) PUBLIC: fetch a contract for signing (token-gated) ----------
create or replace function public.get_contract(p_deal uuid, p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d record;
begin
  select * into d from public.deals where id = p_deal and sign_token = p_token;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'signed', d.signed_at is not null,
    'order_no', d.order_no, 'client_name', d.client_name, 'client_id', d.client_id,
    'client_phone', d.client_phone, 'client_email', d.client_email, 'client_address', d.client_address,
    'car_make', d.car_make, 'car_model', d.car_model, 'car_trim', d.car_trim, 'car_year', d.car_year,
    'car_color', d.car_color, 'car_engine', d.car_engine, 'car_gearbox', d.car_gearbox,
    'car_price', d.car_price, 'down_total', d.down_total, 'monthly', d.monthly,
    'delivery_days', d.delivery_days, 'total', d.total, 'balance_to_pay', d.balance_to_pay, 'spec', d.spec);
end $$;
grant execute on function public.get_contract(uuid, uuid) to anon, authenticated;

-- ---------- 5) PUBLIC: submit a signature (token-gated) ----------
create or replace function public.submit_signature(p_deal uuid, p_token uuid, p_sig text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d record; rk text;
begin
  select * into d from public.deals where id = p_deal and sign_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'error', 'קישור לא תקין'); end if;
  if d.signed_at is not null then return jsonb_build_object('ok', false, 'error', 'ההסכם כבר נחתם'); end if;
  if p_sig is null or length(p_sig) < 100 then return jsonb_build_object('ok', false, 'error', 'חתימה חסרה'); end if;

  -- signing hands the file to the file manager (→ שיחת שיקוף), unless already further
  update public.deals set signature = p_sig, signed_at = now(),
     stage = case when coalesce(stage, 'initial') = 'initial' then 'screening' else stage end,
     checklist = coalesce(checklist, '{}'::jsonb) || jsonb_build_object('התקבל הסכם', true)
   where id = p_deal;

  -- after signing → move the sales lead to "בתהליך חיתום"
  update public.leads set status = 'underwriting', status_changed_at = now()
   where id = d.lead_id and status not in ('won', 'lost');

  insert into public.activities (lead_id, type, body)
    values (d.lead_id, 'contract', 'הלקוח חתם על ההסכם' || case when d.order_no is not null then ' #' || d.order_no else '' end);
  insert into public.activities (lead_id, type, body)
    values (d.lead_id, 'status_change', 'סטטוס עודכן ל: בתהליך חיתום (לאחר חתימה)');

  select decrypted_secret into rk from vault.decrypted_secrets where name = 'resend_key';
  if rk is not null then
    -- notify the owner
    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || rk),
      body := jsonb_build_object('from', 'Car2Buy <noreply@electric-group.co.il>',
        'to', jsonb_build_array('zahcilevi111@gmail.com'),
        'subject', '✅ לקוח חתם על הסכם',
        'html', '<div dir="rtl" style="font-family:Arial">הלקוח <b>' || coalesce(d.client_name, '') || '</b> חתם על ההסכם' ||
                case when d.order_no is not null then ' #' || d.order_no else '' end || '.</div>'));

    -- official thank-you email to the client
    if d.client_email is not null and position('@' in d.client_email) > 0 then
      perform net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || rk),
        body := jsonb_build_object('from', 'Car2Buy <noreply@electric-group.co.il>',
          'to', jsonb_build_array(d.client_email),
          'subject', 'תודה על חתימתך — Car2Buy',
          'html',
            '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:0 0 24px">' ||
            '<div style="background:linear-gradient(135deg,#F5691E,#D14E0C);padding:28px 20px;text-align:center">' ||
              '<div style="color:#fff;font-size:30px;font-weight:900;letter-spacing:.5px">Car<span style="opacity:.85">2</span>Buy</div>' ||
              '<div style="color:#ffe;opacity:.9;font-size:13px;margin-top:4px">ליווי אישי לרכב הבא שלך</div></div>' ||
            '<div style="background:#fff;margin:0 16px;border-radius:0 0 14px 14px;padding:30px 26px;color:#1c2430;line-height:1.9;box-shadow:0 6px 20px rgba(16,24,40,.06)">' ||
              '<h2 style="color:#16a34a;margin:0 0 6px;font-size:22px">✅ תודה שחתמת!</h2>' ||
              '<p>שלום ' || coalesce(d.client_name, 'לקוח יקר') || ',</p>' ||
              '<p>קיבלנו את חתימתך על ההסכם' || case when d.order_no is not null then ' (מספר ' || d.order_no || ')' else '' end ||
              '. תודה שבחרת ב-<b>Car2Buy</b> — אנחנו נרגשים ללוות אותך עד לרכב החדש.</p>' ||
              '<div style="background:#fff6f0;border-right:4px solid #F5691E;border-radius:10px;padding:14px 16px;margin:18px 0">' ||
                '<b style="color:#D14E0C">מה הלאה?</b><br>אשת המימון שלנו מ-<b>Car2Buy</b> תיצור איתך קשר בקרוב, לליווי אישי בהמשך התהליך ועד לקבלת הרכב.</div>' ||
              '<p style="margin:16px 0 4px">אנחנו כאן לכל שאלה:</p>' ||
              '<p style="margin:0"><b>📞 058-470-0706</b></p>' ||
              '<p style="margin-top:22px">בברכה,<br><b>צוות Car2Buy</b></p></div>' ||
            '<div style="text-align:center;color:#98a0ae;font-size:11px;margin-top:16px">הודעה זו נשלחה אוטומטית · Car2Buy</div></div>'));
    end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.submit_signature(uuid, uuid, text) to anon, authenticated;

-- ---------- 6) send the signing link to the client by email (Resend) ----------
create or replace function public.send_contract_email(p_deal uuid, p_to text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d record; t uuid; rk text; url text; req bigint;
begin
  if not (public.is_admin() or public.is_staff()) then raise exception 'לא מורשה'; end if;
  if p_to is null or position('@' in p_to) = 0 then raise exception 'אימייל לא תקין'; end if;
  select * into d from public.deals where id = p_deal;
  if not found then raise exception 'עסקה לא נמצאה'; end if;
  t := coalesce(d.sign_token, gen_random_uuid());
  update public.deals set sign_token = t where id = p_deal;
  url := 'https://tzahilevi1.github.io/car2buy/sign.html?d=' || p_deal || '&t=' || t;

  select decrypted_secret into rk from vault.decrypted_secrets where name = 'resend_key';
  if rk is null then raise exception 'חסר resend_key ב-Vault'; end if;
  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || rk),
    body := jsonb_build_object('from', 'Car2Buy <noreply@electric-group.co.il>',
      'to', jsonb_build_array(p_to),
      'subject', 'הסכם רכב לחתימה — Car2Buy',
      'html', '<div dir="rtl" style="font-family:Arial;line-height:1.7">שלום ' || coalesce(d.client_name, '') ||
              ',<br>מצורף הסכם ההזמנה לחתימה דיגיטלית:<br><br><a href="' || url ||
              '" style="background:#F5691E;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">לצפייה וחתימה על ההסכם »</a><br><br>' ||
              '<span style="color:#777;font-size:13px">אם הכפתור לא עובד, העתיקו את הקישור: ' || url || '</span></div>')
  ) into req;
  insert into public.activities (lead_id, type, body) values (d.lead_id, 'contract', 'נשלח הסכם לחתימה במייל: ' || p_to);
  return jsonb_build_object('ok', true, 'url', url, 'email_req', req);
end $$;

-- ---------- file manager (role 'files') manages ALL files across the business ----------
do $$
declare t text;
begin
  foreach t in array array['activities','tasks','lead_documents','deals'] loop
    execute format('drop policy if exists "files all %1$s" on public.%1$s', t);
    execute format($f$create policy "files all %1$s" on public.%1$s for all to authenticated
      using (public.my_role() = 'files') with check (public.my_role() = 'files')$f$, t);
  end loop;
end $$;
drop policy if exists "files read leads" on public.leads;
create policy "files read leads" on public.leads for select to authenticated using (public.my_role() = 'files');
drop policy if exists "files update leads" on public.leads;
create policy "files update leads" on public.leads for update to authenticated using (public.my_role() = 'files') with check (public.my_role() = 'files');

-- storage: any active staff (agent / file manager / accounting) can upload/view/delete lead docs
drop policy if exists "staff manage lead-docs" on storage.objects;
create policy "staff manage lead-docs" on storage.objects for all to authenticated
  using (bucket_id = 'lead-docs' and (public.is_admin() or public.is_staff()))
  with check (bucket_id = 'lead-docs' and (public.is_admin() or public.is_staff()));
grant execute on function public.send_contract_email(uuid, text) to authenticated;
