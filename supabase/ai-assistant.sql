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
