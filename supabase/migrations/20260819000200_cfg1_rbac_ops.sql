-- ============================================================================
-- CFG-1 §7.2 — RBAC matrix operations
-- Spec: docs/specs/cfg-1-foundation-build-spec.md v2.1 §4–§5;
-- matrix: docs/planning/user_roles_and_permissions.md (nested levels, 2026-07-07).
--
-- Typed, transactional membership ops (grant ceilings, last-Owner protection)
-- and the membership-validated team directory. All user ops derive the actor
-- from the authenticated session (spec §5 actor-authority): a supplied
-- business_id is a SELECTOR whose access is proven independently.
-- ============================================================================

-- ── Actor/authorization helpers ──────────────────────────────────────────────
create or replace function app.require_account()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_account uuid := app.current_base509_account_id();
begin
  if v_account is null then
    raise exception 'AUTH_REQUIRED: no bootstrapped account for this session'
      using errcode = '28000';
  end if;
  return v_account;
end;
$$;

-- Proves the caller holds >= p_min_role in p_business_id. Tenant-safe:
-- a non-member gets the same stable error whether or not the business exists.
create or replace function app.require_role(p_business_id uuid, p_min_role public.membership_role)
returns public.membership_role
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role public.membership_role := app.current_membership(p_business_id);
begin
  if v_role is null or app.role_rank(v_role) < app.role_rank(p_min_role) then
    raise exception 'FORBIDDEN: requires % or higher in the active business', p_min_role
      using errcode = '42501';
  end if;
  return v_role;
end;
$$;

alter function app.require_account() owner to cfg1_owner;
alter function app.require_role(uuid, public.membership_role) owner to cfg1_owner;
revoke all on function app.require_account() from public;
revoke all on function app.require_role(uuid, public.membership_role) from public;
grant execute on function app.require_account() to authenticated, service_role;
grant execute on function app.require_role(uuid, public.membership_role) to authenticated, service_role;

-- ── Role change (grant ceilings + last-Owner protection) ─────────────────────
-- Owner may set admin/manager/staff; Admin may set manager/staff (never
-- admin); nobody grants owner (spec §3.2/§5). Actor must outrank the target.
create or replace function public.change_membership_role(
  p_business_id uuid,
  p_membership_id uuid,
  p_new_role public.membership_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_actor_role public.membership_role;
  v_target public.business_memberships%rowtype;
begin
  v_actor_role := app.require_role(p_business_id, 'admin');

  -- Serialize membership mutations per business (deterministic lock order:
  -- business row first, then targets).
  perform 1 from public.businesses b where b.id = p_business_id for update;

  select * into v_target
  from public.business_memberships m
  where m.id = p_membership_id and m.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: membership does not exist in this business'
      using errcode = 'P0002';
  end if;

  if p_new_role = 'owner' then
    raise exception 'GRANT_CEILING: the Owner role is never grantable'
      using errcode = '42501';
  end if;

  -- Actor must outrank both the target's current role and the granted role.
  if app.role_rank(v_actor_role) <= app.role_rank(v_target.role)
     or app.role_rank(v_actor_role) <= app.role_rank(p_new_role) then
    raise exception 'GRANT_CEILING: cannot manage a role at or above your own'
      using errcode = '42501';
  end if;

  update public.business_memberships
  set role = p_new_role
  where id = v_target.id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'membership.role_change', 'business_membership',
    v_target.id::text, null,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', p_new_role)
  );
end;
$$;

-- ── Removal (self-leave allowed; last-Owner protected) ───────────────────────
create or replace function public.remove_member(
  p_business_id uuid,
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_actor_role public.membership_role;
  v_target public.business_memberships%rowtype;
begin
  perform app.require_role(p_business_id, 'staff');
  v_actor_role := app.current_membership(p_business_id);

  perform 1 from public.businesses b where b.id = p_business_id for update;

  select * into v_target
  from public.business_memberships m
  where m.id = p_membership_id and m.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: membership does not exist in this business'
      using errcode = 'P0002';
  end if;

  if v_target.base509_account_id <> v_actor then
    -- Removing someone else requires admin+ and strictly outranking them.
    if app.role_rank(v_actor_role) < app.role_rank('admin')
       or app.role_rank(v_actor_role) <= app.role_rank(v_target.role) then
      raise exception 'GRANT_CEILING: cannot remove a member at or above your own role'
        using errcode = '42501';
    end if;
  end if;

  if v_target.status = 'removed' then
    return; -- idempotent
  end if;

  -- The membership trigger independently guarantees LAST_OWNER; checked here
  -- too for a stable, intentional error before the write.
  if v_target.role = 'owner' and not exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business_id and m.role = 'owner'
      and m.status = 'active' and m.id <> v_target.id
  ) then
    raise exception 'LAST_OWNER: a business must retain at least one active Owner'
      using errcode = '23514';
  end if;

  update public.business_memberships
  set status = 'removed'
  where id = v_target.id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'membership.remove', 'business_membership',
    v_target.id::text, null,
    jsonb_build_object('status', v_target.status, 'role', v_target.role),
    jsonb_build_object('status', 'removed')
  );
end;
$$;

-- ── Seat activation / reactivation (entitlement-capped, spec §5) ─────────────
create or replace function public.reactivate_member(
  p_business_id uuid,
  p_membership_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_actor_role public.membership_role;
  v_target public.business_memberships%rowtype;
  v_seat_limit integer;
  v_active_seats integer;
begin
  v_actor_role := app.require_role(p_business_id, 'admin');

  -- Seat-limit transactions serialize on the business row (spec §5, D-050).
  perform 1 from public.businesses b where b.id = p_business_id for update;

  select * into v_target
  from public.business_memberships m
  where m.id = p_membership_id and m.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: membership does not exist in this business'
      using errcode = 'P0002';
  end if;

  if v_target.status = 'active' then
    return; -- idempotent
  end if;

  if app.role_rank(v_actor_role) <= app.role_rank(v_target.role) then
    raise exception 'GRANT_CEILING: cannot reactivate a member at or above your own role'
      using errcode = '42501';
  end if;

  v_seat_limit := app.seat_limit(p_business_id);
  if v_seat_limit is not null then
    select count(*) into v_active_seats
    from public.business_memberships m
    where m.business_id = p_business_id and m.status = 'active';
    if v_active_seats + 1 > v_seat_limit then
      raise exception 'LIMIT_EXCEEDED: seat limit (%) reached', v_seat_limit
        using errcode = '23514';
    end if;
  end if;

  update public.business_memberships
  set status = 'active'
  where id = v_target.id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'membership.reactivate', 'business_membership',
    v_target.id::text, null,
    jsonb_build_object('status', v_target.status),
    jsonb_build_object('status', 'active')
  );
end;
$$;

-- ── Team directory (membership-validated; no global account reads, spec §4) ──
create or replace function public.team_directory(p_business_id uuid)
returns table (
  membership_id uuid,
  base509_account_id uuid,
  role public.membership_role,
  status public.membership_status,
  display_name text,
  primary_email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.require_account();
  perform app.require_role(p_business_id, 'staff');

  return query
  select m.id, m.base509_account_id, m.role, m.status, a.display_name, a.primary_email
  from public.business_memberships m
  join public.base509_accounts a on a.base509_account_id = m.base509_account_id
  where m.business_id = p_business_id
    and m.status = 'active'
  order by app.role_rank(m.role) desc, a.display_name nulls last;
end;
$$;

alter function public.change_membership_role(uuid, uuid, public.membership_role) owner to cfg1_owner;
alter function public.remove_member(uuid, uuid) owner to cfg1_owner;
alter function public.reactivate_member(uuid, uuid) owner to cfg1_owner;
alter function public.team_directory(uuid) owner to cfg1_owner;

revoke all on function public.change_membership_role(uuid, uuid, public.membership_role) from public, anon;
revoke all on function public.remove_member(uuid, uuid) from public, anon;
revoke all on function public.reactivate_member(uuid, uuid) from public, anon;
revoke all on function public.team_directory(uuid) from public, anon;

grant execute on function public.change_membership_role(uuid, uuid, public.membership_role) to authenticated, service_role;
grant execute on function public.remove_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.reactivate_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.team_directory(uuid) to authenticated, service_role;
