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
    body := jsonb_build_object('from', 'Car2Buy <onboarding@resend.dev>', 'to', p_to, 'subject', p_subject, 'html', p_html)
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
