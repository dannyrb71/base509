-- CFG-1 theme boundary hardening (Codex round-5 blockers on adaf2be).
--
-- P1-1  NULL validation bypass: SQL three-valued logic let a NULL theme_key
--       or theme_mode slip past `not in (...)` / `= any(...)` (both evaluate
--       to NULL, which does not raise) and persist JSON nulls into settings.
--       Both parameters are now rejected IS NULL explicitly, before anything
--       else runs.
-- P1-2  Authorization TOCTOU: require_role ran BEFORE the FOR UPDATE tenant
--       lock, so an Admin demoted/removed while the RPC waited on the lock
--       proceeded on stale authorization. The role check now RE-RUNS after
--       the lock is acquired — READ COMMITTED gives that statement a fresh
--       snapshot, so a demotion committed while we waited is seen. The
--       pre-lock check stays only as a cheap early rejection.
--
-- Additive follow-up (never edit an applied migration): full CREATE OR
-- REPLACE of set_business_theme; grants/ownership unchanged from
-- 20260820000100. sync_entitlements is untouched.

create or replace function public.set_business_theme(
  p_business_id uuid,
  p_theme_key text,
  p_theme_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_business public.businesses%rowtype;
  v_allowlist jsonb;
  v_before jsonb;
begin
  -- NULLs are rejected outright: `not in` / `= any` are NULL (not true) for
  -- NULL inputs and would otherwise fall through every check below.
  if p_business_id is null or p_theme_key is null or p_theme_mode is null then
    raise exception 'VALIDATION_FAILED: business, theme key and theme mode are all required'
      using errcode = '22023';
  end if;
  if p_theme_mode not in ('light', 'dark') then
    raise exception 'VALIDATION_FAILED: theme mode must be light or dark' using errcode = '22023';
  end if;
  if not (p_theme_key = any (app.known_theme_keys())) then
    raise exception 'VALIDATION_FAILED: unknown theme key' using errcode = '22023';
  end if;

  -- Cheap early rejection only — NOT the authoritative check (see below).
  perform app.require_role(p_business_id, 'admin');

  -- Serialize with entitlement sync on the tenant row (both lock here).
  select * into v_business from public.businesses b where b.id = p_business_id for update;
  if not found then
    raise exception 'NOT_FOUND: business does not exist' using errcode = 'P0002';
  end if;

  -- AUTHORITATIVE role check, re-run under the lock: a caller demoted or
  -- removed while this transaction waited must not proceed on the stale
  -- pre-lock answer.
  perform app.require_role(p_business_id, 'admin');

  -- RE-READ effective entitlements inside the transaction (fail-closed
  -- Starter on anything malformed/expired) and enforce the allowlist.
  v_allowlist := app.effective_entitlements(p_business_id) -> 'theme_allowlist';
  if not (v_allowlist ? p_theme_key) then
    raise exception 'THEME_NOT_ALLOWED: % is not in this business''s entitlement allowlist', p_theme_key
      using errcode = '42501';
  end if;

  v_before := jsonb_build_object(
    'theme_key', v_business.settings ->> 'theme_key',
    'theme_mode', v_business.settings ->> 'theme_mode'
  );

  -- Merge: unrelated settings keys are preserved.
  update public.businesses
  set settings = coalesce(settings, '{}'::jsonb)
    || jsonb_build_object('theme_key', p_theme_key, 'theme_mode', p_theme_mode)
  where id = p_business_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'business.theme_change', 'business',
    p_business_id::text, null, v_before,
    jsonb_build_object('theme_key', p_theme_key, 'theme_mode', p_theme_mode)
  );
end;
$$;

alter function public.set_business_theme(uuid, text, text) owner to cfg1_owner;
revoke all on function public.set_business_theme(uuid, text, text) from public, anon;
grant execute on function public.set_business_theme(uuid, text, text) to authenticated, service_role;
