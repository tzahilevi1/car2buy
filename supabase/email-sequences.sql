-- ============================================================
--  Car2Buy — client email sequences (Phase 2b)
--  Instant confirmations + scheduled nurture tips + appointment
--  reminders, via pg_net + pg_cron + Resend. Sends from the verified
--  domain. Run once in SQL Editor (after email-notify.sql).
--  Requires Vault secret 'resend_key' (already set).
-- ============================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- 0) real appointment timestamp for reminders
alter table public.appointments add column if not exists appt_at timestamptz;

-- 1) scheduled email queue (server-only; RLS with no policies)
create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid,
  to_email text not null,
  subject text not null,
  html text not null,
  send_at timestamptz not null,
  sent boolean not null default false,
  kind text
);
alter table public.scheduled_emails enable row level security;
create index if not exists sched_due_idx on public.scheduled_emails (send_at) where sent = false;

-- 2) sender now uses the VERIFIED domain
create or replace function public.c2b_send_email(p_to text, p_subject text, p_html text)
returns void language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_key' limit 1;
  if k is null then raise notice 'c2b: resend_key missing'; return; end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', 'Car2Buy <noreply@electric-group.co.il>', 'to', p_to, 'subject', p_subject, 'html', p_html)
  );
end $$;

-- 3) branded wrapper + valid-email helper
create or replace function public.c2b_wrap(inner_html text) returns text language sql immutable as $$
  select '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">'
    || '<div style="background:#F5691E;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-size:20px;font-weight:800">Car2Buy</div>'
    || '<div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:22px">'
    || inner_html
    || '<hr style="border:none;border-top:1px solid #eee;margin:18px 0"><p style="color:#888;font-size:13px">Car2Buy · ליסינג מימוני פרטי · 054-470-0706</p></div></div>'
$$;
create or replace function public.c2b_valid_email(e text) returns boolean language sql immutable as $$
  select e is not null and e ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
$$;

-- 4) tip content
create or replace function public.c2b_tip_html(n int) returns text language sql immutable as $$
  select public.c2b_wrap(case n
    when 1 then '<h2 style="color:#F5691E">טיפ: ליסינג מימוני מול תפעולי</h2><p>בליסינג מימוני פרטי הרכב הופך לשלכם בסוף התקופה — אתם צוברים נכס, לא רק משלמים על שימוש. זו הבחירה הנכונה למי שרוצה רכב חדש בלי הון התחלתי.</p><p>רוצים לבדוק מה מתאים לכם? נשמח לעזור.</p>'
    when 2 then '<h2 style="color:#F5691E">טיפ: איך בוחרים החזר חודשי נכון</h2><p>אל תסתכלו רק על ההחזר החודשי — בדקו את העלות הכוללת ותשלום הבלון בסוף. אצלנו הכל שקוף ומותאם אישית ליכולת שלכם.</p>'
    else '<h2 style="color:#F5691E">טיפ: טרייד-אין חכם</h2><p>הרכב הישן שלכם שווה כסף. ב-Car2Buy אנחנו מקזזים את שוויו ישירות מהעסקה החדשה — בלי טרחה ובלי מודעות יד 2.</p>'
  end)
$$;

-- 5) new lead → instant confirmation + queued tips (day 1/3/7)
create or replace function public.c2b_seq_lead() returns trigger language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if not public.c2b_valid_email(NEW.email) then return NEW; end if;
  nm := coalesce(NEW.name, 'לקוח יקר');
  perform public.c2b_send_email(NEW.email, 'קיבלנו את פנייתך — Car2Buy',
    public.c2b_wrap('<h2 style="color:#F5691E">היי ' || public.c2b_esc(nm) || ', תודה שפנית! 🚗</h2><p>קיבלנו את פנייתך ונציג אישי יחזור אליך בקרוב עם הצעה מותאמת — בלי התחייבות ובלי עלות.</p><p>בינתיים נשלח לך כמה טיפים שיעזרו לבחור נכון. לכל שאלה: 054-470-0706.</p>'));
  insert into public.scheduled_emails (lead_id, to_email, subject, html, send_at, kind) values
    (NEW.id, NEW.email, 'טיפ מ-Car2Buy: ליסינג מימוני', public.c2b_tip_html(1), now() + interval '1 day', 'tip1'),
    (NEW.id, NEW.email, 'טיפ מ-Car2Buy: החזר חודשי חכם', public.c2b_tip_html(2), now() + interval '3 day', 'tip2'),
    (NEW.id, NEW.email, 'טיפ מ-Car2Buy: טרייד-אין', public.c2b_tip_html(3), now() + interval '7 day', 'tip3');
  return NEW;
end $$;
drop trigger if exists trg_c2b_seq_lead on public.leads;
create trigger trg_c2b_seq_lead after insert on public.leads for each row execute function public.c2b_seq_lead();

-- 6) new appointment → instant confirmation + reminders (day before, 2h before)
create or replace function public.c2b_seq_appointment() returns trigger language plpgsql security definer set search_path = public as $$
declare nm text; whenstr text; body text;
begin
  if not public.c2b_valid_email(NEW.email) then return NEW; end if;
  nm := coalesce(NEW.name, 'לקוח יקר');
  whenstr := coalesce(NEW.appt_date, '') || ' בשעה ' || coalesce(NEW.appt_time, '');
  body := '<h2 style="color:#F5691E">הפגישה שלך נקבעה! 📅</h2><p>היי ' || public.c2b_esc(nm) || ', שמחים לאשר את פגישתך:</p>'
    || '<p style="font-size:17px"><b>' || public.c2b_esc(whenstr) || '</b><br>סניף: ' || public.c2b_esc(coalesce(NEW.branch, '')) || '</p><p>נתראה! לשינוי/ביטול: 054-470-0706.</p>';
  perform public.c2b_send_email(NEW.email, 'אישור פגישה — Car2Buy', public.c2b_wrap(body));
  if NEW.appt_at is not null then
    if NEW.appt_at - interval '1 day' > now() then
      insert into public.scheduled_emails (lead_id, to_email, subject, html, send_at, kind) values
        (null, NEW.email, 'תזכורת: פגישה מחר — Car2Buy', public.c2b_wrap('<h2 style="color:#F5691E">תזכורת לפגישה מחר ⏰</h2><p>היי ' || public.c2b_esc(nm) || ', מזכירים שפגישתך מחר: <b>' || public.c2b_esc(whenstr) || '</b>, סניף ' || public.c2b_esc(coalesce(NEW.branch, '')) || '. נתראה!</p>'), NEW.appt_at - interval '1 day', 'remind_day');
    end if;
    if NEW.appt_at - interval '2 hour' > now() then
      insert into public.scheduled_emails (lead_id, to_email, subject, html, send_at, kind) values
        (null, NEW.email, 'הפגישה שלך היום — Car2Buy', public.c2b_wrap('<h2 style="color:#F5691E">נתראה בקרוב 🚗</h2><p>היי ' || public.c2b_esc(nm) || ', פגישתך היום בשעה <b>' || public.c2b_esc(coalesce(NEW.appt_time, '')) || '</b>, סניף ' || public.c2b_esc(coalesce(NEW.branch, '')) || '.</p>'), NEW.appt_at - interval '2 hour', 'remind_2h');
    end if;
  end if;
  return NEW;
end $$;
drop trigger if exists trg_c2b_seq_appointment on public.appointments;
create trigger trg_c2b_seq_appointment after insert on public.appointments for each row execute function public.c2b_seq_appointment();

-- 7) cron processor — sends due queued emails every 5 minutes
create or replace function public.c2b_process_emails() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from public.scheduled_emails where sent = false and send_at <= now() order by send_at limit 50 loop
    perform public.c2b_send_email(r.to_email, r.subject, r.html);
    update public.scheduled_emails set sent = true where id = r.id;
  end loop;
end $$;

do $$ begin perform cron.unschedule('c2b-emails'); exception when others then null; end $$;
select cron.schedule('c2b-emails', '*/5 * * * *', $$ select public.c2b_process_emails(); $$);
