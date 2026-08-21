-- CFG-1 A2 — identity/linking/MFA DB boundary (spec A2.3/A2.4).
--
-- 1. AAL2 enforcement for privileged typed ops (A2.4): any op whose minimum
--    role is admin-or-above now also requires an AAL2 session (a second
--    factor verified this session). The portal enforces AAL2 for Owner/Admin
--    sessions; this is the DB's fail-closed backstop — a stolen AAL1 session
--    (or a hand-rolled request) cannot reach admin-gated ops even if the
--    portal layer is bypassed. Staff/Manager-gated ops are unchanged.
--    Machine identities (JWT role = service_role) are exempt: they carry no
--    human MFA and already bypass RLS as trusted infrastructure.
--
-- 2. Account-scoped identity audit (A2.3): public.log_identity_event
--    records sign-in-method changes (link/unlink, TOTP enroll/unenroll)
--    against the CALLER's own account as business_id-NULL audit rows. The
--    existing audit read policy exposes only business-scoped rows, so these
--    are deliberately API-invisible (ops/forensics surface). The actor is
--    session-derived — an account can only ever write its own trail, and
--    the action/provider vocabulary is a closed set.
--
-- NOTE (never-merge-by-email): CFG-1 identity mapping is strictly
-- (issuer, provider_subject) → account (bootstrap_account). Nothing in this
-- schema links or merges accounts by email, and no such path is added here;
-- the gate suite now pins that with an explicit same-email test.

-- ── 1. require_role: admin+ ops demand AAL2 ─────────────────────────────────
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
  -- A2.4: privileged (admin+) ops require a second factor. The aal claim is
  -- stamped by auth: 'aal2' only after MFA verification this session.
  -- coalesce treats a missing claim as aal1 — fail closed, never open.
  if app.role_rank(p_min_role) >= app.role_rank('admin')
     and coalesce(app.jwt() ->> 'role', '') <> 'service_role'
     and coalesce(app.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'MFA_REQUIRED: % actions need a second factor (AAL2 session)', p_min_role
      using errcode = '42501';
  end if;
  return v_role;
end;
$$;

alter function app.require_role(uuid, public.membership_role) owner to cfg1_owner;
revoke all on function app.require_role(uuid, public.membership_role) from public;
grant execute on function app.require_role(uuid, public.membership_role) to authenticated, service_role;

-- ── 2. Account-scoped identity audit ────────────────────────────────────────
create or replace function public.log_identity_event(
  p_action text,
  p_provider text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
begin
  if p_action is null
     or p_action not in ('identity.link', 'identity.unlink', 'identity.mfa_enroll', 'identity.mfa_unenroll') then
    raise exception 'VALIDATION_FAILED: unknown identity event action' using errcode = '22023';
  end if;
  if p_provider is null
     or p_provider not in ('google', 'apple', 'email', 'totp') then
    raise exception 'VALIDATION_FAILED: unknown identity provider' using errcode = '22023';
  end if;

  perform app.append_audit(
    null, v_actor, 'user', p_action, 'account',
    v_actor::text, null, null,
    jsonb_build_object('provider', p_provider)
  );
end;
$$;

alter function public.log_identity_event(text, text) owner to cfg1_owner;
revoke all on function public.log_identity_event(text, text) from public, anon;
grant execute on function public.log_identity_event(text, text) to authenticated, service_role;
