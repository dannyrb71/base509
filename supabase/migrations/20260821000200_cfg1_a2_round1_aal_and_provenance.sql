-- CFG-1 A2 — Codex round-1 corrections (P1-1, P1-5, invariant text P1-3).
--
-- P1-1  AAL1 bypassed MFA via direct RLS writes: require_role gained the
--       AAL2 backstop but app.has_role (the guard inside every admin-gated
--       RLS policy) did not, so an Owner JWT at aal1 could still UPDATE
--       businesses, INSERT capacity rows, and read admin-only surfaces
--       (peer memberships, invites, audit) straight through PostgREST.
--       has_role now fails CLOSED for admin-or-above checks below AAL2
--       (missing claim = aal1; JWT role service_role exempt). Member/staff/
--       manager-rank checks are untouched, so the enrollment flow's own
--       reads (own membership row, member-level business/entitlement
--       selects) keep working at AAL1.
--
-- P1-5  Identity audit provenance: log_identity_event let any session
--       write "identity.link google" without any linking having happened.
--       It is DROPPED. Its replacement, public.sync_identity_audit(), takes
--       NO parameters: it reads the caller's REAL GoTrue state (identities
--       + verified TOTP factors, via postgres-owned passthrough views —
--       cfg1_owner cannot read auth.* directly), diffs it against the
--       stored per-account snapshot, appends audit rows only for actual
--       deltas, and updates the snapshot. Nothing to spoof; repeat calls
--       are no-ops (idempotent); concurrent calls serialize on the
--       snapshot row.
--
-- Invariant text (P1-3, PRODUCT RULING — Danny): identities that share a
-- PROVIDER-VERIFIED email BIND to one account (Supabase links them to one
-- auth user, one subject, one base509_account). An UNVERIFIED email must
-- never cause a merge. At this layer the rule is unchanged mechanically —
-- accounts map strictly by (issuer, subject) and nothing here consults
-- email — binding happens upstream at the auth layer, and only on
-- provider-verified email (email confirmation stays ON).

-- ── P1-1: has_role fails closed below AAL2 for admin+ checks ────────────────
create or replace function app.has_role(p_business_id uuid, p_min_role public.membership_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.role_rank(app.current_membership(p_business_id)) >= app.role_rank(p_min_role)
    and (
      -- Admin-or-above authority additionally requires an AAL2 session
      -- (A2.4). Machine identities are exempt; a missing aal claim is aal1.
      app.role_rank(p_min_role) < app.role_rank('admin')
      or coalesce(app.jwt() ->> 'role', '') = 'service_role'
      or coalesce(app.jwt() ->> 'aal', 'aal1') = 'aal2'
    ),
    false
  );
$$;

alter function app.has_role(uuid, public.membership_role) owner to cfg1_owner;
revoke all on function app.has_role(uuid, public.membership_role) from public;
grant execute on function app.has_role(uuid, public.membership_role) to authenticated, service_role;

-- ── P1-1b: remove_member bypassed the AAL2 backstop ─────────────────────────
-- Found by the new exhaustive sweep: remove_member gates at 'staff' (so a
-- member can remove THEMSELVES) and hand-rolled the admin check for removing
-- someone else with raw role_rank comparisons — which skipped require_role's
-- AAL2 gate. The remove-someone-else branch now goes through
-- require_role(..., 'admin') (inheriting the MFA backstop) before the
-- strict-outrank ceiling. Self-removal stays staff-level and AAL1-reachable
-- on purpose: leaving a business is not privileged authority.
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
    -- Removing someone else is privileged: admin+ WITH the AAL2 backstop,
    -- then strictly outranking the target.
    perform app.require_role(p_business_id, 'admin');
    if app.role_rank(v_actor_role) <= app.role_rank(v_target.role) then
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

alter function public.remove_member(uuid, uuid) owner to cfg1_owner;
revoke all on function public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.remove_member(uuid, uuid) to authenticated, service_role;

-- ── P1-5: provenance-true identity audit ────────────────────────────────────
drop function if exists public.log_identity_event(text, text);

-- Passthrough views stay owned by the migration role (postgres), which can
-- read auth.*; cfg1_owner gets SELECT on the views only. Never exposed to
-- API roles.
create view app.gotrue_identities as
  select i.user_id, i.provider from auth.identities i;
create view app.gotrue_verified_totp as
  select f.user_id from auth.mfa_factors f
  where f.factor_type = 'totp' and f.status = 'verified';
revoke all on app.gotrue_identities, app.gotrue_verified_totp from public, anon, authenticated, service_role;
grant select on app.gotrue_identities, app.gotrue_verified_totp to cfg1_owner;

create table public.account_auth_state (
  base509_account_id uuid primary key references public.base509_accounts (base509_account_id),
  providers jsonb not null default '[]'::jsonb,
  totp_verified boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.account_auth_state enable row level security;
alter table public.account_auth_state owner to cfg1_owner;
-- Definer-only surface: no API-role access (default privileges would grant
-- it — revoke explicitly), no policies. Only sync_identity_audit touches it.
revoke all on public.account_auth_state from public, anon, authenticated, service_role;

create or replace function public.sync_identity_audit()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_sub uuid := (app.jwt() ->> 'sub')::uuid;
  v_now_providers jsonb;
  v_now_totp boolean;
  v_prev record;
  v_added text;
  v_removed text;
  v_events jsonb := '[]'::jsonb;
begin
  -- REAL auth-layer state for the CALLER's subject only — the sub comes
  -- from the session JWT, so an account can only ever sync itself.
  select coalesce(jsonb_agg(distinct gi.provider), '[]'::jsonb)
  into v_now_providers
  from app.gotrue_identities gi
  where gi.user_id = v_sub;
  v_now_totp := exists (select 1 from app.gotrue_verified_totp t where t.user_id = v_sub);

  -- Serialize concurrent syncs of the same account on the snapshot row.
  insert into public.account_auth_state (base509_account_id, providers, totp_verified)
  values (v_actor, '[]'::jsonb, false)
  on conflict (base509_account_id) do nothing;
  select * into v_prev from public.account_auth_state
  where base509_account_id = v_actor for update;

  for v_added in
    select value #>> '{}' from jsonb_array_elements(v_now_providers)
    except
    select value #>> '{}' from jsonb_array_elements(v_prev.providers)
  loop
    perform app.append_audit(
      null, v_actor, 'user', 'identity.link', 'account', v_actor::text,
      'observed in the auth layer', null, jsonb_build_object('provider', v_added));
    v_events := v_events || jsonb_build_object('action', 'identity.link', 'provider', v_added);
  end loop;

  for v_removed in
    select value #>> '{}' from jsonb_array_elements(v_prev.providers)
    except
    select value #>> '{}' from jsonb_array_elements(v_now_providers)
  loop
    perform app.append_audit(
      null, v_actor, 'user', 'identity.unlink', 'account', v_actor::text,
      'observed in the auth layer', jsonb_build_object('provider', v_removed), null);
    v_events := v_events || jsonb_build_object('action', 'identity.unlink', 'provider', v_removed);
  end loop;

  if v_now_totp and not v_prev.totp_verified then
    perform app.append_audit(
      null, v_actor, 'user', 'identity.mfa_enroll', 'account', v_actor::text,
      'observed in the auth layer', null, jsonb_build_object('provider', 'totp'));
    v_events := v_events || jsonb_build_object('action', 'identity.mfa_enroll', 'provider', 'totp');
  elsif v_prev.totp_verified and not v_now_totp then
    perform app.append_audit(
      null, v_actor, 'user', 'identity.mfa_unenroll', 'account', v_actor::text,
      'observed in the auth layer', jsonb_build_object('provider', 'totp'), null);
    v_events := v_events || jsonb_build_object('action', 'identity.mfa_unenroll', 'provider', 'totp');
  end if;

  update public.account_auth_state
  set providers = v_now_providers, totp_verified = v_now_totp, updated_at = now()
  where base509_account_id = v_actor;

  return v_events;
end;
$$;

alter function public.sync_identity_audit() owner to cfg1_owner;
revoke all on function public.sync_identity_audit() from public, anon;
grant execute on function public.sync_identity_audit() to authenticated, service_role;
