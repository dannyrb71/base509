-- ============================================================================
-- CFG-1 §7.3 — Hashed invite codes, business+Owner bootstrap, client onboarding
-- Spec: docs/specs/cfg-1-foundation-build-spec.md v2.1 §3.2, §5, §8;
-- roles doc §9 (invite-code behavior); D-002/D-003; capacity-model N/A here.
--
-- Invite defaults (spec §8, ratified): team invites single-use + 7-day expiry;
-- client booking codes reusable until revoked. Cryptographically random bearer
-- tokens; only the SHA-256 hash is stored; rate limiting lives OUTSIDE the DB.
-- ============================================================================

create table public.business_invite_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  code_hash text not null unique,
  display_prefix text,
  type text not null check (type in ('staff', 'client')),
  -- Enforced, not a hint; can never be Owner (spec §3.2).
  target_role public.membership_role
    check (target_role is distinct from 'owner'),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by_account_id uuid not null references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  -- staff invites carry a role; client invites never do
  check ((type = 'staff') = (target_role is not null))
);

create index business_invite_codes_business_idx on public.business_invite_codes (business_id);

alter table public.business_invite_codes owner to cfg1_owner;
alter table public.business_invite_codes enable row level security;

revoke all on public.business_invite_codes from public, anon, authenticated, service_role;
grant select on public.business_invite_codes to authenticated, service_role;

-- Owner/Admin manage invites (roles matrix). No direct reads by invitees —
-- non-members simply match no row. All writes via typed RPCs.
create policy invites_select_admin on public.business_invite_codes
  for select to authenticated
  using (app.has_role(business_id, 'admin'));

-- ── Business + first Owner bootstrap (one idempotent tx, spec §3.1/§5) ───────
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

  insert into public.businesses (name, owner_account_id, timezone, currency, bootstrap_key)
  values (p_name, v_actor, p_timezone, p_currency, p_idempotency_key)
  returning * into v_business;

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
    jsonb_build_object('name', p_name),
    p_idempotency_key::text
  );

  return v_business.id;
end;
$$;

-- ── Invite creation (grant ceilings; type-specific use policy, spec §3.2/§8) ─
create or replace function public.create_invite(
  p_business_id uuid,
  p_type text,
  p_target_role public.membership_role default null,
  p_max_uses integer default null,
  p_expires_at timestamptz default null
)
returns table (invite_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_actor_role public.membership_role;
  v_token text;
  v_id uuid;
  v_max_uses integer;
  v_expires timestamptz;
begin
  v_actor_role := app.require_role(p_business_id, 'admin');

  if p_type not in ('staff', 'client') then
    raise exception 'VALIDATION_FAILED: invite type must be staff or client'
      using errcode = '22023';
  end if;

  if p_type = 'staff' then
    if p_target_role is null then
      raise exception 'VALIDATION_FAILED: staff invites require a target role'
        using errcode = '22023';
    end if;
    -- Owner invites Admin/Manager/Staff; Admin invites Manager/Staff.
    -- target_role can never be Owner (also a table CHECK).
    if p_target_role = 'owner'
       or app.role_rank(v_actor_role) <= app.role_rank(p_target_role) then
      raise exception 'GRANT_CEILING: cannot invite at or above your own role'
        using errcode = '42501';
    end if;
    -- Ratified defaults: single-use, 7-day expiry.
    v_max_uses := coalesce(p_max_uses, 1);
    v_expires := coalesce(p_expires_at, now() + interval '7 days');
  else
    if p_target_role is not null then
      raise exception 'VALIDATION_FAILED: client invites carry no role'
        using errcode = '22023';
    end if;
    -- Ratified defaults: reusable until revoked (optional caps allowed).
    v_max_uses := p_max_uses;
    v_expires := p_expires_at;
  end if;

  -- 160-bit random bearer secret; plaintext returned exactly once.
  v_token := encode(extensions.gen_random_bytes(20), 'hex');

  insert into public.business_invite_codes (
    business_id, code_hash, display_prefix, type, target_role,
    max_uses, expires_at, created_by_account_id
  ) values (
    p_business_id,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    left(v_token, 6),
    p_type, p_target_role, v_max_uses, v_expires, v_actor
  )
  returning id into v_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'invite.create', 'business_invite_code',
    v_id::text, null, null,
    jsonb_build_object('type', p_type, 'target_role', p_target_role,
                       'max_uses', v_max_uses, 'expires_at', v_expires)
  );

  return query select v_id, v_token;
end;
$$;

create or replace function public.revoke_invite(
  p_business_id uuid,
  p_invite_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_invite public.business_invite_codes%rowtype;
begin
  perform app.require_role(p_business_id, 'admin');

  select * into v_invite
  from public.business_invite_codes i
  where i.id = p_invite_id and i.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: invite does not exist in this business' using errcode = 'P0002';
  end if;

  if v_invite.revoked_at is not null then
    return; -- idempotent
  end if;

  update public.business_invite_codes set revoked_at = now() where id = p_invite_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'invite.revoke', 'business_invite_code',
    p_invite_id::text, null, null, null
  );
end;
$$;

-- ── Atomic redemption (spec §3.2/§5) ─────────────────────────────────────────
-- The invite itself is the authority to establish the relationship. One tx:
-- lock business → lock code → recheck expiry/revocation/uses → D-003 both
-- directions (trigger + same lock) → seat/client caps → create → increment.
create or replace function public.redeem_invite(p_token text)
returns table (relationship text, business_id uuid, relationship_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_invite public.business_invite_codes%rowtype;
  v_membership_id uuid;
  v_client public.clients%rowtype;
  v_seat_limit integer;
  v_client_limit integer;
  v_count integer;
begin
  v_actor := public.bootstrap_account();

  select * into v_invite
  from public.business_invite_codes i
  where i.code_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then
    raise exception 'INVITE_INVALID: code not recognized' using errcode = 'P0002';
  end if;

  -- Deterministic lock order: business row, then the code row.
  perform 1 from public.businesses b where b.id = v_invite.business_id for update;

  select * into v_invite
  from public.business_invite_codes i
  where i.id = v_invite.id
  for update;

  if v_invite.revoked_at is not null then
    raise exception 'INVITE_REVOKED: code has been revoked' using errcode = 'P0002';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'INVITE_EXPIRED: code has expired' using errcode = 'P0002';
  end if;
  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    raise exception 'INVITE_EXHAUSTED: code has no remaining uses' using errcode = 'P0002';
  end if;

  perform app.lock_business_account(v_invite.business_id, v_actor);

  if v_invite.type = 'staff' then
    if exists (
      select 1 from public.business_memberships m
      where m.business_id = v_invite.business_id
        and m.base509_account_id = v_actor
        and m.status <> 'removed'
    ) then
      raise exception 'ALREADY_MEMBER: account already belongs to this business'
        using errcode = '23505';
    end if;

    -- Seat activation is entitlement-capped (spec §5; D-050 seat pattern).
    v_seat_limit := app.seat_limit(v_invite.business_id);
    if v_seat_limit is not null then
      select count(*) into v_count
      from public.business_memberships m
      where m.business_id = v_invite.business_id and m.status = 'active';
      if v_count + 1 > v_seat_limit then
        raise exception 'LIMIT_EXCEEDED: seat limit (%) reached', v_seat_limit
          using errcode = '23514';
      end if;
    end if;

    -- target_role is enforced (never a hint); D-003 re-checked by trigger
    -- under the same (business, account) lock.
    insert into public.business_memberships (
      business_id, base509_account_id, role, status, invited_by_account_id
    ) values (
      v_invite.business_id, v_actor, v_invite.target_role, 'active', v_invite.created_by_account_id
    )
    returning id into v_membership_id;

    update public.business_invite_codes
    set uses_count = uses_count + 1
    where id = v_invite.id;

    perform app.append_audit(
      v_invite.business_id, v_actor, 'user', 'invite.redeem', 'business_membership',
      v_membership_id::text, null, null,
      jsonb_build_object('invite_id', v_invite.id, 'role', v_invite.target_role)
    );

    return query select 'membership'::text, v_invite.business_id, v_membership_id;
    return;
  end if;

  -- Client invite: create or reactivate the caller's client relationship.
  select * into v_client
  from public.clients c
  where c.business_id = v_invite.business_id
    and c.base509_account_id = v_actor
  for update;

  if found and v_client.status = 'active' then
    raise exception 'ALREADY_CLIENT: account is already an active client'
      using errcode = '23505';
  end if;
  if found and v_client.status = 'blocked' then
    raise exception 'CLIENT_BLOCKED: relationship is blocked by the business'
      using errcode = '42501';
  end if;

  -- Starter client cap (D-050): count active relationships under the
  -- business lock; refuse an over-limit create/reactivate.
  v_client_limit := app.client_limit(v_invite.business_id);
  if v_client_limit is not null then
    select count(*) into v_count
    from public.clients c
    where c.business_id = v_invite.business_id and c.status = 'active';
    if v_count + 1 > v_client_limit then
      raise exception 'LIMIT_EXCEEDED: client limit (%) reached', v_client_limit
        using errcode = '23514';
    end if;
  end if;

  if found then
    perform set_config('app.privileged_op', 'on', true);
    update public.clients
    set status = 'active', ended_at = null
    where id = v_client.id;
    perform set_config('app.privileged_op', 'off', true);
  else
    insert into public.clients (business_id, base509_account_id, display_name, status)
    values (
      v_invite.business_id, v_actor,
      coalesce(
        (select a.display_name from public.base509_accounts a where a.base509_account_id = v_actor),
        'New client'
      ),
      'active'
    )
    returning * into v_client;
  end if;

  update public.business_invite_codes
  set uses_count = uses_count + 1
  where id = v_invite.id;

  perform app.append_audit(
    v_invite.business_id, v_actor, 'user', 'invite.redeem', 'client',
    v_client.id::text, null, null,
    jsonb_build_object('invite_id', v_invite.id)
  );

  return query select 'client'::text, v_invite.business_id, v_client.id;
end;
$$;

-- ── Client create / import / lifecycle (Starter cap + D-003, spec §5) ────────
-- Never accepts a target account id: imported rows are unlinked; linking
-- happens only through invite redemption.
create or replace function public.create_client(
  p_business_id uuid,
  p_display_name text,
  p_emergency_contact jsonb default null,
  p_vet_info jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_client_limit integer;
  v_count integer;
  v_id uuid;
begin
  perform app.require_role(p_business_id, 'admin');

  -- Serialize the cap on the business row (read-count-then-insert is unsafe).
  perform 1 from public.businesses b where b.id = p_business_id for update;

  v_client_limit := app.client_limit(p_business_id);
  if v_client_limit is not null then
    select count(*) into v_count
    from public.clients c
    where c.business_id = p_business_id and c.status = 'active';
    if v_count + 1 > v_client_limit then
      raise exception 'LIMIT_EXCEEDED: client limit (%) reached', v_client_limit
        using errcode = '23514';
    end if;
  end if;

  insert into public.clients (business_id, display_name, emergency_contact, vet_info, status)
  values (p_business_id, p_display_name, p_emergency_contact, p_vet_info, 'active')
  returning id into v_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'client.create', 'client', v_id::text,
    null, null, jsonb_build_object('display_name', p_display_name)
  );

  return v_id;
end;
$$;

create or replace function public.reactivate_client(
  p_business_id uuid,
  p_client_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_client public.clients%rowtype;
  v_client_limit integer;
  v_count integer;
begin
  perform app.require_role(p_business_id, 'admin');

  perform 1 from public.businesses b where b.id = p_business_id for update;

  select * into v_client
  from public.clients c
  where c.id = p_client_id and c.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: client does not exist in this business' using errcode = 'P0002';
  end if;

  if v_client.status = 'active' then
    return; -- idempotent
  end if;

  v_client_limit := app.client_limit(p_business_id);
  if v_client_limit is not null then
    select count(*) into v_count
    from public.clients c
    where c.business_id = p_business_id and c.status = 'active';
    if v_count + 1 > v_client_limit then
      raise exception 'LIMIT_EXCEEDED: client limit (%) reached', v_client_limit
        using errcode = '23514';
    end if;
  end if;

  perform set_config('app.privileged_op', 'on', true);
  update public.clients
  set status = 'active', ended_at = null, blocked_reason = null, blocked_by_account_id = null
  where id = p_client_id;
  perform set_config('app.privileged_op', 'off', true);

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'client.reactivate', 'client', p_client_id::text,
    null, jsonb_build_object('status', v_client.status), jsonb_build_object('status', 'active')
  );
end;
$$;

-- Block / unblock / end (owner-admin per matrix defaults; unblock→active goes
-- through reactivate_client so the cap is re-checked).
create or replace function public.set_client_status(
  p_business_id uuid,
  p_client_id uuid,
  p_status public.client_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_client public.clients%rowtype;
begin
  perform app.require_role(p_business_id, 'admin');

  if p_status = 'active' then
    raise exception 'VALIDATION_FAILED: use reactivate_client to restore an active relationship'
      using errcode = '22023';
  end if;

  perform 1 from public.businesses b where b.id = p_business_id for update;

  select * into v_client
  from public.clients c
  where c.id = p_client_id and c.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: client does not exist in this business' using errcode = 'P0002';
  end if;

  if v_client.status = p_status then
    return; -- idempotent
  end if;

  perform set_config('app.privileged_op', 'on', true);
  update public.clients
  set status = p_status,
      ended_at = case when p_status = 'ended' then now() else ended_at end,
      blocked_reason = case when p_status = 'blocked' then p_reason else null end,
      blocked_by_account_id = case when p_status = 'blocked' then v_actor else null end
  where id = p_client_id;
  perform set_config('app.privileged_op', 'off', true);

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'client.status_change', 'client', p_client_id::text,
    p_reason, jsonb_build_object('status', v_client.status), jsonb_build_object('status', p_status)
  );
end;
$$;

alter function public.create_business(text, uuid, text, text) owner to cfg1_owner;
alter function public.create_invite(uuid, text, public.membership_role, integer, timestamptz) owner to cfg1_owner;
alter function public.revoke_invite(uuid, uuid) owner to cfg1_owner;
alter function public.redeem_invite(text) owner to cfg1_owner;
alter function public.create_client(uuid, text, jsonb, jsonb) owner to cfg1_owner;
alter function public.reactivate_client(uuid, uuid) owner to cfg1_owner;
alter function public.set_client_status(uuid, uuid, public.client_status, text) owner to cfg1_owner;

revoke all on function public.create_business(text, uuid, text, text) from public, anon;
revoke all on function public.create_invite(uuid, text, public.membership_role, integer, timestamptz) from public, anon;
revoke all on function public.revoke_invite(uuid, uuid) from public, anon;
revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.create_client(uuid, text, jsonb, jsonb) from public, anon;
revoke all on function public.reactivate_client(uuid, uuid) from public, anon;
revoke all on function public.set_client_status(uuid, uuid, public.client_status, text) from public, anon;

grant execute on function public.create_business(text, uuid, text, text) to authenticated, service_role;
grant execute on function public.create_invite(uuid, text, public.membership_role, integer, timestamptz) to authenticated, service_role;
grant execute on function public.revoke_invite(uuid, uuid) to authenticated, service_role;
grant execute on function public.redeem_invite(text) to authenticated, service_role;
grant execute on function public.create_client(uuid, text, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.reactivate_client(uuid, uuid) to authenticated, service_role;
grant execute on function public.set_client_status(uuid, uuid, public.client_status, text) to authenticated, service_role;
