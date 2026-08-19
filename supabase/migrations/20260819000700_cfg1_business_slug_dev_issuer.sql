-- ============================================================================
-- Phase A / A1 sub-task 0a — business slug + dev issuer
-- (phase-a build hand-off, 2026-08-19. Tenancy-op change: FLAGGED FOR CODEX
-- REVIEW like all CFG-1 ops; gate tests added in supabase/tests.)
--
-- 1. `create_business` now mints a UNIQUE slug for the portal's business
--    route. Business display names are deliberately NOT unique (two
--    providers may both be "Happy Paws"); the tenant key stays business_id.
--    The slug is name-derived for readability plus an opaque random suffix
--    for uniqueness — never used for authorization, only routing; the server
--    resolves slug → business_id and independently proves membership
--    (architecture §3.4). Signature and return type are UNCHANGED (the app
--    reads the slug back through member-scoped RLS).
--
-- 2. The trusted-issuer allowlist (spec §2.1) gains the petappro-dev
--    project's issuer — migration 01 seeded only prod, which would make
--    every dev-project sign-in fail ISSUER_NOT_TRUSTED. The allowlist
--    remains a closed set of OUR Supabase projects.
-- ============================================================================

insert into app.trusted_issuers (issuer, note)
values ('https://mojlntsnaxvyjidqqach.supabase.co/auth/v1', 'petappro-dev Supabase Auth')
on conflict do nothing;

create or replace function public.create_business(
  p_name text,
  p_idempotency_key uuid,
  p_timezone text default 'America/Los_Angeles',
  p_currency text default 'USD'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_business public.businesses%rowtype;
  v_slug_base text;
  v_slug text;
  v_attempt integer := 0;
begin
  -- First-login bootstrap has no business (spec §5); mint/resolve the account.
  v_actor := public.bootstrap_account();

  if p_idempotency_key is null then
    raise exception 'VALIDATION_FAILED: idempotency key required' using errcode = '22023';
  end if;

  -- Idempotent retry: same key returns the same business (only for its owner).
  select * into v_business from public.businesses b where b.bootstrap_key = p_idempotency_key;
  if found then
    if v_business.owner_account_id <> v_actor then
      raise exception 'FORBIDDEN: idempotency key belongs to another account'
        using errcode = '42501';
    end if;
    return v_business.id;
  end if;

  -- Unique routing slug: readable name-derived stem + opaque suffix. Names
  -- collide by design; slugs never do (random suffix + retry loop belt).
  v_slug_base := left(
    coalesce(nullif(btrim(regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'business'),
    40
  );
  loop
    v_attempt := v_attempt + 1;
    v_slug := v_slug_base || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
    begin
      insert into public.businesses (name, owner_account_id, timezone, currency, bootstrap_key, slug)
      values (p_name, v_actor, p_timezone, p_currency, p_idempotency_key, v_slug)
      returning * into v_business;
      exit;
    exception when unique_violation then
      -- bootstrap_key collision must re-raise (idempotency conflict, not slug)
      if exists (select 1 from public.businesses b where b.bootstrap_key = p_idempotency_key) then
        raise;
      end if;
      if v_attempt >= 3 then raise; end if;
    end;
  end loop;

  -- Owner membership is created only here — never invite-assignable.
  insert into public.business_memberships (business_id, base509_account_id, role, status)
  values (v_business.id, v_actor, 'owner', 'active');

  -- Safe Starter entitlement seed (spec §2.2: bootstrap stub, same shape the
  -- master envelope will use; version 0 so any master projection supersedes).
  insert into public.business_entitlements (
    business_id, tier_key, capabilities, client_limit, seat_limit,
    theme_allowlist, source_system, source_version, projection_version, sync_status
  )
  select
    v_business.id,
    s ->> 'tier_key',
    s -> 'capabilities',
    (s ->> 'client_limit')::integer,
    (s ->> 'seat_limit')::integer,
    s -> 'theme_allowlist',
    'bootstrap_stub', 0, 1, 'active'
  from app.starter_entitlements() s;

  perform app.append_audit(
    v_business.id, v_actor, 'user', 'business.bootstrap', 'business',
    v_business.id::text, null, null,
    jsonb_build_object('name', p_name, 'slug', v_slug),
    p_idempotency_key::text
  );

  return v_business.id;
end;
$$;

alter function public.create_business(text, uuid, text, text) owner to cfg1_owner;
revoke all on function public.create_business(text, uuid, text, text) from public, anon;
grant execute on function public.create_business(text, uuid, text, text) to authenticated, service_role;
