-- ============================================================================
-- Theme persistence boundary (Codex CHANGES-REQUIRED, 2026-08-20, item 2).
--
-- The open boundary: authenticated Owner/Admin held direct UPDATE(settings)
-- on businesses, and the DB never re-read theme_allowlist — a Starter Owner
-- could persist a Crew city theme by writing settings directly, violating
-- the endpoint+database invariant (pricing-tiers-and-features.md:52).
--
-- Corrections:
--   a. set_business_theme: authenticated, transactional, session-derived
--      actor, Owner/Admin, tenant row LOCKED, entitlements RE-READ inside
--      the transaction, key validated against known keys AND the effective
--      theme_allowlist, mode validated, unrelated settings keys preserved,
--      audit appended.
--   b. Direct path CLOSED by revoking the settings column from the
--      authenticated UPDATE grant (chosen over a validation trigger: every
--      legitimate settings write becomes a typed op per CFG-1 §5, instead of
--      leaving a broad jsonb surface each future key must re-defend;
--      approach for Codex confirmation). service_role never had UPDATE.
--   c. Downgrade serialization: sync_entitlements and set_business_theme
--      both lock the SAME businesses row FOR UPDATE; after a projection
--      write, a stored theme outside the new allowlist falls back to the
--      always-safe default (brandy_blue) with an audit record — a Crew city
--      theme cannot remain persisted/effective after a downgrade.
-- ============================================================================

-- ── b. Close the direct settings write path ─────────────────────────────────
revoke update on public.businesses from authenticated;
grant update (name, slug, currency, timezone) on public.businesses to authenticated;

-- ── a. The typed theme op ────────────────────────────────────────────────────
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
  -- Owner/Admin only (business config, roles matrix).
  perform app.require_role(p_business_id, 'admin');

  if p_theme_mode not in ('light', 'dark') then
    raise exception 'VALIDATION_FAILED: theme mode must be light or dark' using errcode = '22023';
  end if;
  if not (p_theme_key = any (app.known_theme_keys())) then
    raise exception 'VALIDATION_FAILED: unknown theme key' using errcode = '22023';
  end if;

  -- Serialize with entitlement sync on the tenant row (both lock here).
  select * into v_business from public.businesses b where b.id = p_business_id for update;
  if not found then
    raise exception 'NOT_FOUND: business does not exist' using errcode = 'P0002';
  end if;

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

-- ── c. Downgrade fallback inside the sync op (same lock, same tx) ───────────
create or replace function public.sync_entitlements(p_envelope jsonb)
returns table (status text, applied_version bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text := p_envelope ->> 'source_system';
  v_event text := p_envelope ->> 'event_id';
  v_business uuid;
  v_version bigint;
  v_existing public.business_entitlements%rowtype;
  v_outcome text;
  v_inserted integer;
  v_settings jsonb;
  v_stored_theme text;
  v_new_allowlist jsonb;
begin
  -- Machine ops authenticate a workload identity, never a human in payload.
  if (app.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'FORBIDDEN: entitlement sync requires the internal sync identity'
      using errcode = '42501';
  end if;

  if v_source is null or v_source not in ('bootstrap_stub', 'base509_master') then
    raise exception 'VALIDATION_FAILED: unknown source_system' using errcode = '22023';
  end if;
  if v_event is null or length(v_event) = 0 then
    raise exception 'VALIDATION_FAILED: event_id required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_envelope -> 'source_version') <> 'number' then
    raise exception 'VALIDATION_FAILED: numeric source_version required' using errcode = '22023';
  end if;
  v_version := (p_envelope ->> 'source_version')::bigint;
  if jsonb_typeof(p_envelope -> 'capabilities') <> 'object' then
    raise exception 'VALIDATION_FAILED: capabilities object required' using errcode = '22023';
  end if;
  if p_envelope ->> 'tier_key' is null then
    raise exception 'VALIDATION_FAILED: tier_key required' using errcode = '22023';
  end if;

  -- Malformed envelope fields are rejected outright (Codex correction #7):
  -- a bad projection must never be persisted for the read side to trip over.
  if p_envelope ? 'theme_allowlist'
     and not app.valid_theme_allowlist(p_envelope -> 'theme_allowlist') then
    raise exception 'VALIDATION_FAILED: theme_allowlist must be an array of known stable theme-key strings'
      using errcode = '22023';
  end if;
  if p_envelope ? 'projection_version'
     and (jsonb_typeof(p_envelope -> 'projection_version') <> 'number'
          or (p_envelope ->> 'projection_version')::numeric not in (1, 2)) then
    raise exception 'VALIDATION_FAILED: unsupported projection_version' using errcode = '22023';
  end if;
  if p_envelope ? 'client_limit'
     and jsonb_typeof(p_envelope -> 'client_limit') not in ('number', 'null') then
    raise exception 'VALIDATION_FAILED: client_limit must be a number or null' using errcode = '22023';
  end if;
  if p_envelope ? 'seat_limit'
     and jsonb_typeof(p_envelope -> 'seat_limit') not in ('number', 'null') then
    raise exception 'VALIDATION_FAILED: seat_limit must be a number or null' using errcode = '22023';
  end if;
  begin
    perform (p_envelope ->> 'effective_at')::timestamptz,
            (p_envelope ->> 'expires_at')::timestamptz;
  exception when others then
    raise exception 'VALIDATION_FAILED: effective_at/expires_at must be timestamps'
      using errcode = '22023';
  end;

  -- The stub may seed ONLY the safe Starter set (spec §2.2).
  if v_source = 'bootstrap_stub' then
    if (p_envelope ->> 'tier_key') is distinct from 'starter'
       or exists (
         select 1 from jsonb_each(p_envelope -> 'capabilities') kv
         where kv.value <> 'false'::jsonb and kv.value <> '0'::jsonb
       )
       or (p_envelope ->> 'client_limit')::integer is distinct from 5
       or (p_envelope ->> 'seat_limit')::integer is distinct from 1 then
      raise exception 'VALIDATION_FAILED: the bootstrap stub may only seed the safe Starter set'
        using errcode = '22023';
    end if;
  end if;

  select b.id into v_business
  from public.businesses b
  where b.id = (p_envelope ->> 'operational_business_id')::uuid;
  if not found then
    raise exception 'NOT_FOUND: operational_business_id does not resolve to a business'
      using errcode = 'P0002';
  end if;

  -- Serialize per business — the SAME lock set_business_theme takes, so a
  -- concurrent theme selection and a downgrade can never interleave.
  perform 1 from public.businesses b where b.id = v_business for update;

  select * into v_existing
  from public.business_entitlements e
  where e.business_id = v_business
  for update;

  -- Decide the outcome BEFORE writing the immutable receipt.
  v_outcome := 'applied';
  if v_existing.id is not null then
    if v_existing.source_system = 'base509_master' and v_source = 'bootstrap_stub' then
      v_outcome := 'rejected_stub_after_master';
    elsif v_existing.source_system = v_source and v_version <= v_existing.source_version then
      v_outcome := 'rejected_out_of_order';
    end if;
  end if;

  insert into public.entitlement_sync_receipts (source_system, event_id, business_id, source_version, outcome)
  values (v_source, v_event, v_business, v_version, v_outcome)
  on conflict (source_system, event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return query select 'duplicate_ignored'::text, null::bigint;
    return;
  end if;

  if v_outcome <> 'applied' then
    return query select v_outcome, null::bigint;
    return;
  end if;

  insert into public.business_entitlements as e (
    business_id, tier_key, capabilities, client_limit, seat_limit, theme_allowlist,
    source_system, source_version, effective_at, expires_at, projection_version,
    last_synced_at, sync_status
  ) values (
    v_business,
    p_envelope ->> 'tier_key',
    p_envelope -> 'capabilities',
    (p_envelope ->> 'client_limit')::integer,
    (p_envelope ->> 'seat_limit')::integer,
    coalesce(p_envelope -> 'theme_allowlist', '["brandy_blue"]'::jsonb),
    v_source, v_version,
    coalesce((p_envelope ->> 'effective_at')::timestamptz, now()),
    (p_envelope ->> 'expires_at')::timestamptz,
    coalesce((p_envelope ->> 'projection_version')::integer, 1),
    now(), 'active'
  )
  on conflict (business_id) do update set
    tier_key = excluded.tier_key,
    capabilities = excluded.capabilities,
    client_limit = excluded.client_limit,
    seat_limit = excluded.seat_limit,
    theme_allowlist = excluded.theme_allowlist,
    source_system = excluded.source_system,
    source_version = excluded.source_version,
    effective_at = excluded.effective_at,
    expires_at = excluded.expires_at,
    projection_version = excluded.projection_version,
    last_synced_at = excluded.last_synced_at,
    sync_status = excluded.sync_status;

  perform app.append_audit(
    v_business, null, 'system', 'entitlements.sync', 'business_entitlements',
    v_business::text, null,
    case when v_existing.id is not null then
      jsonb_build_object('tier_key', v_existing.tier_key,
                         'source_system', v_existing.source_system,
                         'source_version', v_existing.source_version)
    end,
    jsonb_build_object('tier_key', p_envelope ->> 'tier_key',
                       'source_system', v_source, 'source_version', v_version),
    v_event
  );

  -- Downgrade fallback (item 2c): a stored theme outside the NEW effective
  -- allowlist cannot remain persisted — fall back to the always-safe default
  -- and audit. Runs under the same tenant lock as theme selection.
  select b.settings into v_settings from public.businesses b where b.id = v_business;
  v_stored_theme := v_settings ->> 'theme_key';
  if v_stored_theme is not null then
    v_new_allowlist := app.effective_entitlements(v_business) -> 'theme_allowlist';
    if not (v_new_allowlist ? v_stored_theme) then
      update public.businesses
      set settings = coalesce(settings, '{}'::jsonb)
        || jsonb_build_object('theme_key', 'brandy_blue')
      where id = v_business;
      perform app.append_audit(
        v_business, null, 'system', 'business.theme_fallback', 'business',
        v_business::text,
        'stored theme no longer in the entitlement allowlist after sync',
        jsonb_build_object('theme_key', v_stored_theme),
        jsonb_build_object('theme_key', 'brandy_blue')
      );
    end if;
  end if;

  return query select 'applied'::text, v_version;
end;
$$;

alter function public.sync_entitlements(jsonb) owner to cfg1_owner;
revoke all on function public.sync_entitlements(jsonb) from public, anon, authenticated;
grant execute on function public.sync_entitlements(jsonb) to service_role;
