-- ============================================================================
-- CFG-1 §7.5 — Entitlement projection sync (versioned envelope stub) + reads
-- Spec: docs/specs/cfg-1-foundation-build-spec.md v2.1 §2.2, §3.5, §5;
-- architecture: technical_architecture.md §4.1 (D-050).
--
-- The stub speaks the SAME envelope the eventual Base509 master will send:
--   source_system, event_id, source_version (monotonic per (business_id,
--   source_system)), operational_business_id, tier_key, capabilities,
--   client_limit/seat_limit/theme_allowlist, effective_at/expires_at,
--   projection_version.
-- Rules: idempotent; duplicates deduplicated via an immutable sync receipt;
-- out-of-order versions rejected; once a business holds a master-authoritative
-- projection the bootstrap stub can NEVER overwrite it; every applied change
-- appends an audit event. The future contract is strictly one-way
-- (master → projection); PetAppro never derives tier authority locally.
-- ============================================================================

-- Immutable receipt = the (source_system, event_id) dedupe record (spec §2.2).
create table public.entitlement_sync_receipts (
  id uuid primary key default gen_random_uuid(),
  source_system text not null check (source_system in ('bootstrap_stub', 'base509_master')),
  event_id text not null,
  business_id uuid not null references public.businesses (id),
  source_version bigint not null,
  outcome text not null check (outcome in ('applied', 'rejected_out_of_order', 'rejected_stub_after_master')),
  received_at timestamptz not null default now(),
  unique (source_system, event_id)
);

alter table public.entitlement_sync_receipts owner to cfg1_owner;
alter table public.entitlement_sync_receipts enable row level security;
revoke all on public.entitlement_sync_receipts from public, anon, authenticated, service_role;
grant select on public.entitlement_sync_receipts to service_role;

create trigger entitlement_sync_receipts_immutable
  before update or delete on public.entitlement_sync_receipts
  for each row execute function app.raise_immutable();
create trigger entitlement_sync_receipts_no_truncate
  before truncate on public.entitlement_sync_receipts
  for each statement execute function app.raise_immutable();

-- ── Machine op: entitlement projection sync (spec §5 actor-authority) ────────
-- Authenticates a workload identity (service_role — the signed internal sync
-- path's DB identity); records actor_kind = system. Never callable by app
-- roles. The envelope's operational_business_id RESOLVES to the local
-- business_id selector; it is not persisted as a second identifier.
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

  -- The stub may seed ONLY the safe Starter set (spec §2.2): Starter tier,
  -- no truthy capability, Starter limits. Anything richer must come from the
  -- master.
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

  -- Serialize per business.
  perform 1 from public.businesses b where b.id = v_business for update;

  select * into v_existing
  from public.business_entitlements e
  where e.business_id = v_business
  for update;

  -- Decide the outcome BEFORE writing the immutable receipt.
  v_outcome := 'applied';
  if v_existing.id is not null then
    -- Authority handoff is permanent: the stub can never overwrite a
    -- master-authoritative projection.
    if v_existing.source_system = 'base509_master' and v_source = 'bootstrap_stub' then
      v_outcome := 'rejected_stub_after_master';
    -- Monotonicity is scoped per (business_id, source_system).
    elsif v_existing.source_system = v_source and v_version <= v_existing.source_version then
      v_outcome := 'rejected_out_of_order';
    end if;
  end if;

  -- Dedupe on (source_system, event_id): a replay is a harmless no-op.
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

  return query select 'applied'::text, v_version;
end;
$$;

alter function public.sync_entitlements(jsonb) owner to cfg1_owner;
revoke all on function public.sync_entitlements(jsonb) from public, anon, authenticated;
grant execute on function public.sync_entitlements(jsonb) to service_role;

-- ── Effective entitlements read (architecture §4.1 step 3) ───────────────────
-- Proves membership first, then returns the server-resolved capability set
-- (fail-closed to Starter) plus freshness metadata.
create or replace function public.get_effective_entitlements(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_meta record;
begin
  perform app.require_account();
  perform app.require_role(p_business_id, 'staff');

  select e.source_version, e.projection_version, e.last_synced_at, e.expires_at
  into v_meta
  from public.business_entitlements e
  where e.business_id = p_business_id;

  return app.effective_entitlements(p_business_id)
    || jsonb_build_object(
         'source_version', v_meta.source_version,
         'projection_version', v_meta.projection_version,
         'last_synced_at', v_meta.last_synced_at,
         'expires_at', v_meta.expires_at
       );
end;
$$;

alter function public.get_effective_entitlements(uuid) owner to cfg1_owner;
revoke all on function public.get_effective_entitlements(uuid) from public, anon;
grant execute on function public.get_effective_entitlements(uuid) to authenticated, service_role;
