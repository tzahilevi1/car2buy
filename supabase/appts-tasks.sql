-- ============================================================
--  Car2Buy — appointments link + timestamp, and task notes.
--  Run once in SQL Editor. Safe to re-run.
-- ============================================================
alter table public.appointments add column if not exists appt_at   timestamptz;  -- exact date+time (for upcoming/past filter + reschedule)
alter table public.appointments add column if not exists lead_id   uuid;         -- link to the sales lead
alter table public.appointments add column if not exists appt_mode text;         -- פרונטלי / טלפוני / וידאו / בסניף
alter table public.appointments add column if not exists brand     text;         -- מותג שהלקוח מתעניין בו
alter table public.tasks        add column if not exists notes     text;         -- notes / comments on a task
