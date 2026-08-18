-- ============================================================================
-- CFG-1 §7.1 — Identity / tenancy foundation
-- Spec: docs/specs/cfg-1-foundation-build-spec.md (v2.1, ratified @ 2f1fb15)
-- Canonical inputs: docs/planning/technical_architecture.md (§2–§4),
--   docs/planning/user_roles_and_permissions.md, docs/planning/data_model_draft.md.
--
-- Lands (spec §2 Option A — staged local projection):
--   base509_accounts, auth_identities (local identity projection),
--   businesses, business_memberships, clients, pets (tenancy),
--   business_entitlements + starter defaults (D-050 projection table; sync RPC
--   arrives in the entitlements migration), audit_events (immutable),
--   security-definer helpers (app schema), baseline operation-specific RLS,
--   and the trusted account-bootstrap RPC (spec §2.1).
--
-- Conventions:
--   * All CFG-1 objects are owned by the non-login role `cfg1_owner`
--     (spec §4 security-definer hygiene). Ownership is what lets the
--     security-definer helpers read membership rows without recursive RLS.
--   * Helpers live in schema `app` (NOT exposed through PostgREST).
--   * Typed RPCs live in `public` and are the only write path for
--     invariant-bearing tables; table grants enforce that structurally.
--   * Every function pins `search_path = ''` and fully qualifies objects.
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions;

-- ── Non-login owner role ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'cfg1_owner') then
    create role cfg1_owner nologin;
  end if;
end
$$;

grant cfg1_owner to current_user;
grant usage on schema extensions to cfg1_owner;

-- ── app schema (internal helpers; never exposed via PostgREST) ───────────────
create schema if not exists app authorization cfg1_owner;
grant usage on schema app to authenticated, service_role;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type public.membership_role as enum ('owner', 'admin', 'manager', 'staff');
create type public.membership_status as enum ('active', 'invited', 'removed');
create type public.client_status as enum ('active', 'blocked', 'ended');
create type public.actor_kind as enum ('user', 'system', 'bootstrap');

alter type public.membership_role owner to cfg1_owner;
alter type public.membership_status owner to cfg1_owner;
alter type public.client_status owner to cfg1_owner;
alter type public.actor_kind owner to cfg1_owner;

-- ── Identity tables (global projections — NOT business-scoped; spec §3) ─────
create table public.base509_accounts (
  base509_account_id uuid primary key default gen_random_uuid(),
  display_name text,
  primary_email text,
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auth_identities (
  id uuid primary key default gen_random_uuid(),
  base509_account_id uuid not null references public.base509_accounts (base509_account_id),
  issuer text not null,
  provider text not null default 'supabase',
  provider_subject text not null,
  created_at timestamptz not null default now(),
  -- Spec §2.1 / architecture §3.1: unique by (issuer, provider_subject),
  -- never (provider, provider_subject), never email.
  unique (issuer, provider_subject)
);

-- §6 hardening: identity resolution must be index-backed (covered by the
-- unique constraint above); account -> identities lookup for linking/audit.
create index auth_identities_account_idx on public.auth_identities (base509_account_id);

-- Server-side issuer allowlist (spec §2.1: allowlisted, server-derived issuer).
-- Internal: no app role may read or write it.
create table app.trusted_issuers (
  issuer text primary key,
  note text,
  created_at timestamptz not null default now()
);

-- PetAppro production Supabase issuer (supabase/README.md project ref).
insert into app.trusted_issuers (issuer, note)
values ('https://ecdmtldlqvkdvmyxgpzr.supabase.co/auth/v1', 'PetAppro Supabase Auth (prod)');

-- ── Tenancy tables ───────────────────────────────────────────────────────────
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text unique,
  owner_account_id uuid not null references public.base509_accounts (base509_account_id),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'America/Los_Angeles',
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'closing', 'closed')),
  -- Idempotency key for the business+owner bootstrap transaction (spec §3.1).
  bootstrap_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  base509_account_id uuid not null references public.base509_accounts (base509_account_id),
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  invited_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Spec §3.1 invariant: one provider-side relationship per account per business.
  unique (business_id, base509_account_id),
  -- Tenant-composite FK target for business-scoped references to a membership.
  unique (business_id, id)
);

-- §6 hardening index: (business_id, base509_account_id, status) resolution.
create index business_memberships_lookup_idx
  on public.business_memberships (business_id, base509_account_id, status);
create index business_memberships_account_idx
  on public.business_memberships (base509_account_id, status);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  -- Nullable: imported client records exist before any app account is linked.
  -- Linking an account happens ONLY through invite redemption (spec §5:
  -- the invite is the authority; no op accepts a target account in payload).
  base509_account_id uuid references public.base509_accounts (base509_account_id),
  display_name text not null check (length(btrim(display_name)) > 0),
  emergency_contact jsonb,
  vet_info jsonb,
  status public.client_status not null default 'active',
  ended_at timestamptz,
  blocked_reason text,
  blocked_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Spec §3.1 invariant (linked accounts; imported NULL accounts are distinct).
  unique (business_id, base509_account_id),
  unique (business_id, id)
);

create index clients_lookup_idx on public.clients (business_id, base509_account_id, status);
create index clients_account_idx on public.clients (base509_account_id, status);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  client_id uuid not null,
  name text not null check (length(btrim(name)) > 0),
  species text,
  breed text,
  dob date,
  care_notes text,
  photo_path text,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Per-business pets (D-005), tenant-composite FK to the owning client.
  foreign key (business_id, client_id) references public.clients (business_id, id),
  unique (business_id, id)
);

create index pets_client_idx on public.pets (business_id, client_id, status);

-- ── Entitlement projection (D-050, spec §3.5 — table now, sync RPC in §7.5) ──
create table public.business_entitlements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id),
  tier_key text not null,
  capabilities jsonb not null default '{}'::jsonb,
  client_limit integer check (client_limit is null or client_limit >= 0),
  seat_limit integer check (seat_limit is null or seat_limit >= 0),
  theme_allowlist jsonb not null default '["brandy_blue"]'::jsonb,
  source_system text not null check (source_system in ('bootstrap_stub', 'base509_master')),
  source_version bigint not null default 0,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  projection_version integer not null default 1,
  last_synced_at timestamptz not null default now(),
  sync_status text not null default 'active' check (sync_status in ('active', 'stale', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Immutable audit (spec §3.6) ──────────────────────────────────────────────
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id),
  actor_account_id uuid references public.base509_accounts (base509_account_id),
  actor_kind public.actor_kind not null default 'user',
  action text not null,
  target_type text not null,
  target_id text,
  reason text,
  before jsonb,
  after jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index audit_events_business_idx on public.audit_events (business_id, created_at);

-- ── Ownership: all CFG-1 tables belong to the non-login owner ────────────────
alter table public.base509_accounts owner to cfg1_owner;
alter table public.auth_identities owner to cfg1_owner;
alter table app.trusted_issuers owner to cfg1_owner;
alter table public.businesses owner to cfg1_owner;
alter table public.business_memberships owner to cfg1_owner;
alter table public.clients owner to cfg1_owner;
alter table public.pets owner to cfg1_owner;
alter table public.business_entitlements owner to cfg1_owner;
alter table public.audit_events owner to cfg1_owner;

-- ── Generic trigger functions ────────────────────────────────────────────────
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Spec §4: UPDATE must block reassignment of business_id (tenant rekey).
-- Enforced as a trigger for every path (RLS WITH CHECK cannot see OLD).
create or replace function app.prevent_tenant_rekey()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'TENANT_REKEY_FORBIDDEN: business_id is immutable'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Audit rows are immutable for every role, owner included (spec §3.6).
create or replace function app.raise_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'IMMUTABLE_ROW: % rows cannot be modified or deleted', tg_table_name
    using errcode = '42501';
end;
$$;

alter function app.touch_updated_at() owner to cfg1_owner;
alter function app.prevent_tenant_rekey() owner to cfg1_owner;
alter function app.raise_immutable() owner to cfg1_owner;

create trigger audit_events_immutable
  before update or delete on public.audit_events
  for each row execute function app.raise_immutable();
create trigger audit_events_no_truncate
  before truncate on public.audit_events
  for each statement execute function app.raise_immutable();

create trigger base509_accounts_touch before update on public.base509_accounts
  for each row execute function app.touch_updated_at();
create trigger businesses_touch before update on public.businesses
  for each row execute function app.touch_updated_at();
create trigger business_memberships_touch before update on public.business_memberships
  for each row execute function app.touch_updated_at();
create trigger clients_touch before update on public.clients
  for each row execute function app.touch_updated_at();
create trigger pets_touch before update on public.pets
  for each row execute function app.touch_updated_at();
create trigger business_entitlements_touch before update on public.business_entitlements
  for each row execute function app.touch_updated_at();

create trigger business_memberships_no_rekey before update on public.business_memberships
  for each row execute function app.prevent_tenant_rekey();
create trigger clients_no_rekey before update on public.clients
  for each row execute function app.prevent_tenant_rekey();
create trigger pets_no_rekey before update on public.pets
  for each row execute function app.prevent_tenant_rekey();
create trigger business_entitlements_no_rekey before update on public.business_entitlements
  for each row execute function app.prevent_tenant_rekey();

-- Protected business columns: the owner FK and bootstrap key change only
-- inside privileged ops (none in CFG-1 — ownership transfer is post-CFG-1).
create or replace function app.protect_business_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_setting('app.privileged_op', true) is distinct from 'on' then
    if new.owner_account_id is distinct from old.owner_account_id
       or new.bootstrap_key is distinct from old.bootstrap_key
       or new.status is distinct from old.status then
      raise exception 'PROTECTED_COLUMN: owner/bootstrap/status change requires a typed server op'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
alter function app.protect_business_columns() owner to cfg1_owner;

create trigger businesses_protect_columns before update on public.businesses
  for each row execute function app.protect_business_columns();

-- Client lifecycle columns mutate only via typed ops (block/end/reactivate),
-- so the Starter cap and D-003 cannot be dodged by a profile UPDATE.
create or replace function app.protect_client_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_setting('app.privileged_op', true) is distinct from 'on' then
    if new.status is distinct from old.status
       or new.base509_account_id is distinct from old.base509_account_id
       or new.ended_at is distinct from old.ended_at
       or new.blocked_reason is distinct from old.blocked_reason
       or new.blocked_by_account_id is distinct from old.blocked_by_account_id then
      raise exception 'PROTECTED_COLUMN: client lifecycle changes require a typed server op'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
alter function app.protect_client_columns() owner to cfg1_owner;

create trigger clients_protect_columns before update on public.clients
  for each row execute function app.protect_client_columns();

-- ── D-003: no dual client+member on one business, enforced in BOTH creation
--    directions under the same lock (spec §3.1). Trigger-level so no path —
--    including service tooling — can violate it.
create or replace function app.lock_business_account(p_business_id uuid, p_account_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select pg_advisory_xact_lock(
    hashtextextended('cfg1:d003:' || p_business_id::text || ':' || p_account_id::text, 0)
  );
$$;
alter function app.lock_business_account(uuid, uuid) owner to cfg1_owner;

create or replace function app.enforce_no_dual_relationship_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'removed' then
    perform app.lock_business_account(new.business_id, new.base509_account_id);
    if exists (
      select 1 from public.clients c
      where c.business_id = new.business_id
        and c.base509_account_id = new.base509_account_id
        and c.status <> 'ended'
    ) then
      raise exception 'DUAL_RELATIONSHIP: account is already a client of this business (D-003)'
        using errcode = '23505';
    end if;
  end if;
  return new;
end;
$$;

create or replace function app.enforce_no_dual_relationship_client()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.base509_account_id is not null and new.status <> 'ended' then
    perform app.lock_business_account(new.business_id, new.base509_account_id);
    if exists (
      select 1 from public.business_memberships m
      where m.business_id = new.business_id
        and m.base509_account_id = new.base509_account_id
        and m.status <> 'removed'
    ) then
      raise exception 'DUAL_RELATIONSHIP: account is already a provider member of this business (D-003)'
        using errcode = '23505';
    end if;
  end if;
  return new;
end;
$$;

alter function app.enforce_no_dual_relationship_membership() owner to cfg1_owner;
alter function app.enforce_no_dual_relationship_client() owner to cfg1_owner;

create trigger business_memberships_d003
  before insert or update of status, base509_account_id on public.business_memberships
  for each row execute function app.enforce_no_dual_relationship_membership();

create trigger clients_d003
  before insert or update of status, base509_account_id on public.clients
  for each row execute function app.enforce_no_dual_relationship_client();

-- Spec §3.1: at least one active Owner must always remain (any write path).
create or replace function app.enforce_owner_remains()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active') then
    if not exists (
      select 1 from public.business_memberships m
      where m.business_id = old.business_id
        and m.role = 'owner'
        and m.status = 'active'
        and m.id <> old.id
    ) then
      raise exception 'LAST_OWNER: a business must retain at least one active Owner'
        using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
alter function app.enforce_owner_remains() owner to cfg1_owner;

create trigger business_memberships_owner_remains
  before update or delete on public.business_memberships
  for each row execute function app.enforce_owner_remains();

-- ── Security-definer helpers (spec §4) ───────────────────────────────────────

-- The verified JWT issuer — server-derived, never from request payload.
create or replace function app.jwt_issuer()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'iss', '');
$$;

create or replace function app.current_base509_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ai.base509_account_id
  from public.auth_identities ai
  join public.base509_accounts a on a.base509_account_id = ai.base509_account_id
  where ai.issuer = app.jwt_issuer()
    and ai.provider_subject = auth.uid()::text
    and a.status = 'active';
$$;

-- Role for an ACTIVE membership resolved through an ACTIVE identity, else null.
create or replace function app.current_membership(p_business_id uuid)
returns public.membership_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.business_memberships m
  where m.business_id = p_business_id
    and m.base509_account_id = app.current_base509_account_id()
    and m.status = 'active';
$$;

-- Nested hierarchy Staff ⊂ Manager ⊂ Admin ⊂ Owner (roles doc, D-033).
create or replace function app.role_rank(p_role public.membership_role)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'staff' then 1
    when 'manager' then 2
    when 'admin' then 3
    when 'owner' then 4
  end;
$$;

create or replace function app.has_role(p_business_id uuid, p_min_role public.membership_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.role_rank(app.current_membership(p_business_id)) >= app.role_rank(p_min_role),
    false
  );
$$;

-- Set-returning helpers so RLS SELECT policies hash once per statement.
create or replace function app.member_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.business_id
  from public.business_memberships m
  where m.base509_account_id = app.current_base509_account_id()
    and m.status = 'active';
$$;

-- Businesses where the caller is a live (active or blocked — not ended) client.
create or replace function app.client_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.business_id
  from public.clients c
  where c.base509_account_id = app.current_base509_account_id()
    and c.status <> 'ended';
$$;

-- The caller's client row in a business (active only).
create or replace function app.current_client_id(p_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.clients c
  where c.business_id = p_business_id
    and c.base509_account_id = app.current_base509_account_id()
    and c.status = 'active';
$$;

-- ── Entitlement helpers (D-050; fail closed, spec §4) ────────────────────────

-- The lowest safe capability set: Starter, Brandy Blue only, no paid actions.
create or replace function app.starter_entitlements()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'tier_key', 'starter',
    'capabilities', '{}'::jsonb,
    'client_limit', 5,
    'seat_limit', 1,
    'theme_allowlist', jsonb_build_array('brandy_blue')
  );
$$;

-- Effective entitlements for a business, resolved fail-closed:
-- missing / expired / not-yet-effective / error-status / malformed → Starter.
create or replace function app.effective_entitlements(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row public.business_entitlements%rowtype;
begin
  select * into v_row
  from public.business_entitlements e
  where e.business_id = p_business_id;

  if not found
     or v_row.sync_status <> 'active'
     or v_row.effective_at > now()
     or (v_row.expires_at is not null and v_row.expires_at <= now())
     or v_row.capabilities is null
     or jsonb_typeof(v_row.capabilities) <> 'object' then
    return app.starter_entitlements();
  end if;

  return jsonb_build_object(
    'tier_key', v_row.tier_key,
    'capabilities', v_row.capabilities,
    'client_limit', v_row.client_limit,
    'seat_limit', v_row.seat_limit,
    'theme_allowlist', v_row.theme_allowlist
  );
exception
  when others then
    return app.starter_entitlements();
end;
$$;

-- Boolean capability gate for RLS. Unknown/malformed keys are DENIED.
create or replace function app.has_capability(p_business_id uuid, p_capability text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_val jsonb;
begin
  v_val := app.effective_entitlements(p_business_id) -> 'capabilities' -> p_capability;
  if v_val is null then
    return false;
  end if;
  if jsonb_typeof(v_val) = 'boolean' then
    return v_val = 'true'::jsonb;
  end if;
  if jsonb_typeof(v_val) = 'number' then
    return (v_val::text)::numeric > 0;
  end if;
  return false;
exception
  when others then
    return false;
end;
$$;

-- Server-op gate with stable errors (spec §4).
create or replace function app.require_entitlement(
  p_business_id uuid,
  p_capability text,
  p_amount numeric default null
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_val jsonb;
begin
  v_val := app.effective_entitlements(p_business_id) -> 'capabilities' -> p_capability;
  if v_val is null or jsonb_typeof(v_val) not in ('boolean', 'number')
     or (jsonb_typeof(v_val) = 'boolean' and v_val <> 'true'::jsonb) then
    raise exception 'ENTITLEMENT_REQUIRED: % is not enabled for this business', p_capability
      using errcode = '42501';
  end if;
  if p_amount is not null then
    if jsonb_typeof(v_val) <> 'number' or (v_val::text)::numeric < p_amount then
      raise exception 'LIMIT_EXCEEDED: % limit reached', p_capability
        using errcode = '23514';
    end if;
  end if;
end;
$$;

-- Numeric limits (null = unlimited on paid tiers; fail-closed to Starter).
create or replace function app.client_limit(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when app.effective_entitlements(p_business_id) -> 'client_limit' = 'null'::jsonb then null
    else (app.effective_entitlements(p_business_id) ->> 'client_limit')::integer
  end;
$$;

create or replace function app.seat_limit(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when app.effective_entitlements(p_business_id) -> 'seat_limit' = 'null'::jsonb then null
    else (app.effective_entitlements(p_business_id) ->> 'seat_limit')::integer
  end;
$$;

-- ── Internal audit appender (sole insert path into audit_events) ─────────────
create or replace function app.append_audit(
  p_business_id uuid,
  p_actor_account_id uuid,
  p_actor_kind public.actor_kind,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_reason text default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_correlation_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.audit_events (
    business_id, actor_account_id, actor_kind, action, target_type, target_id,
    reason, before, after, correlation_id
  ) values (
    p_business_id, p_actor_account_id, p_actor_kind, p_action, p_target_type, p_target_id,
    p_reason, p_before, p_after, p_correlation_id
  )
  returning id into v_id;
  return v_id;
end;
$$;

alter function app.jwt_issuer() owner to cfg1_owner;
alter function app.current_base509_account_id() owner to cfg1_owner;
alter function app.current_membership(uuid) owner to cfg1_owner;
alter function app.role_rank(public.membership_role) owner to cfg1_owner;
alter function app.has_role(uuid, public.membership_role) owner to cfg1_owner;
alter function app.member_business_ids() owner to cfg1_owner;
alter function app.client_business_ids() owner to cfg1_owner;
alter function app.current_client_id(uuid) owner to cfg1_owner;
alter function app.starter_entitlements() owner to cfg1_owner;
alter function app.effective_entitlements(uuid) owner to cfg1_owner;
alter function app.has_capability(uuid, text) owner to cfg1_owner;
alter function app.require_entitlement(uuid, text, numeric) owner to cfg1_owner;
alter function app.client_limit(uuid) owner to cfg1_owner;
alter function app.seat_limit(uuid) owner to cfg1_owner;
alter function app.append_audit(uuid, uuid, public.actor_kind, text, text, text, text, jsonb, jsonb, text) owner to cfg1_owner;

-- Helper execution: narrowly granted (spec §4). Policies run as the querying
-- role, so authenticated needs EXECUTE on the helpers policies reference.
-- anon gets nothing.
revoke all on all functions in schema app from public;
grant execute on function app.current_base509_account_id() to authenticated, service_role;
grant execute on function app.current_membership(uuid) to authenticated, service_role;
grant execute on function app.role_rank(public.membership_role) to authenticated, service_role;
grant execute on function app.has_role(uuid, public.membership_role) to authenticated, service_role;
grant execute on function app.member_business_ids() to authenticated, service_role;
grant execute on function app.client_business_ids() to authenticated, service_role;
grant execute on function app.current_client_id(uuid) to authenticated, service_role;
grant execute on function app.has_capability(uuid, text) to authenticated, service_role;

-- ── Account bootstrap RPC (spec §2.1 trusted contract) ───────────────────────
-- Atomic + idempotent; issuer allowlisted + server-derived; subject from the
-- authenticated session; serializes concurrent first logins per (issuer, sub);
-- one durable base509_account_id; never merges by email.
create or replace function public.bootstrap_account()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_iss text := app.jwt_issuer();
  v_sub text := auth.uid()::text;
  v_provider text;
  v_account uuid;
begin
  if v_iss is null or v_sub is null then
    raise exception 'AUTH_REQUIRED: no authenticated identity' using errcode = '28000';
  end if;

  if not exists (select 1 from app.trusted_issuers t where t.issuer = v_iss) then
    raise exception 'ISSUER_NOT_TRUSTED: % is not an allowlisted issuer', v_iss
      using errcode = '28000';
  end if;

  -- Concurrent first-login calls serialize here and return the same account.
  perform pg_advisory_xact_lock(hashtextextended('cfg1:bootstrap:' || v_iss || '|' || v_sub, 0));

  select ai.base509_account_id into v_account
  from public.auth_identities ai
  where ai.issuer = v_iss and ai.provider_subject = v_sub;
  if found then
    return v_account;
  end if;

  v_provider := coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', 'supabase');

  insert into public.base509_accounts (primary_email)
  values (nullif(auth.jwt() ->> 'email', ''))
  returning base509_account_id into v_account;

  insert into public.auth_identities (base509_account_id, issuer, provider, provider_subject)
  values (v_account, v_iss, v_provider, v_sub);

  perform app.append_audit(
    null, v_account, 'bootstrap', 'account.bootstrap', 'base509_account',
    v_account::text, null, null, jsonb_build_object('issuer', v_iss, 'provider', v_provider)
  );

  return v_account;
end;
$$;

alter function public.bootstrap_account() owner to cfg1_owner;
revoke all on function public.bootstrap_account() from public, anon;
grant execute on function public.bootstrap_account() to authenticated;

-- ── RLS + grants ─────────────────────────────────────────────────────────────
alter table public.base509_accounts enable row level security;
alter table public.auth_identities enable row level security;
alter table app.trusted_issuers enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.business_entitlements enable row level security;
alter table public.audit_events enable row level security;

-- Anon is denied on the entire foundation (spec §4). Table grants are the
-- first wall; RLS is the second.
revoke all on public.base509_accounts,
           public.auth_identities,
           public.businesses,
           public.business_memberships,
           public.clients,
           public.pets,
           public.business_entitlements,
           public.audit_events
  from public, anon, authenticated, service_role;
revoke all on app.trusted_issuers from public, anon, authenticated, service_role;

-- base509_accounts: own row only — global reads prohibited (spec §4).
grant select, update (display_name) on public.base509_accounts to authenticated;
grant select on public.base509_accounts to service_role;

create policy accounts_select_self on public.base509_accounts
  for select to authenticated
  using (base509_account_id = app.current_base509_account_id());

create policy accounts_update_self on public.base509_accounts
  for update to authenticated
  using (base509_account_id = app.current_base509_account_id())
  with check (base509_account_id = app.current_base509_account_id());

-- auth_identities: own rows only; writes only via the bootstrap function.
grant select on public.auth_identities to authenticated, service_role;

create policy identities_select_self on public.auth_identities
  for select to authenticated
  using (base509_account_id = app.current_base509_account_id());

-- businesses: members and live clients read; owner/admin update safe columns;
-- creation only via the bootstrap RPC.
grant select on public.businesses to authenticated, service_role;
grant update (name, slug, currency, timezone, settings) on public.businesses to authenticated;

create policy businesses_select_related on public.businesses
  for select to authenticated
  using (
    id in (select app.member_business_ids())
    or id in (select app.client_business_ids())
  );

create policy businesses_update_admin on public.businesses
  for update to authenticated
  using (app.has_role(id, 'admin'))
  with check (app.has_role(id, 'admin'));

-- business_memberships: own rows anywhere; owner/admin see the whole team.
-- No direct writes for anyone (typed RPCs only).
grant select on public.business_memberships to authenticated, service_role;

create policy memberships_select_own on public.business_memberships
  for select to authenticated
  using (base509_account_id = app.current_base509_account_id());

create policy memberships_select_admin on public.business_memberships
  for select to authenticated
  using (app.has_role(business_id, 'admin'));

-- clients: provider roles read all (matrix: household directory Y/Y/Y);
-- clients read their own row; profile-field updates per matrix; lifecycle
-- columns locked by trigger; INSERT/DELETE only via typed RPCs.
grant select on public.clients to authenticated, service_role;
grant update (display_name, emergency_contact, vet_info) on public.clients to authenticated;

create policy clients_select_member on public.clients
  for select to authenticated
  using (business_id in (select app.member_business_ids()));

create policy clients_select_self on public.clients
  for select to authenticated
  using (base509_account_id = app.current_base509_account_id());

create policy clients_update_self on public.clients
  for update to authenticated
  using (
    base509_account_id = app.current_base509_account_id()
    and status = 'active'
  )
  with check (base509_account_id = app.current_base509_account_id());

create policy clients_update_staff_ops on public.clients
  for update to authenticated
  using (app.has_role(business_id, 'staff'))
  with check (app.has_role(business_id, 'staff'));

-- pets: provider roles read + operational writes; owning client manages own.
grant select on public.pets to authenticated, service_role;
grant insert on public.pets to authenticated;
grant update (name, species, breed, dob, care_notes, photo_path, status) on public.pets to authenticated;

create policy pets_select_member on public.pets
  for select to authenticated
  using (business_id in (select app.member_business_ids()));

create policy pets_select_own on public.pets
  for select to authenticated
  using (client_id = app.current_client_id(business_id));

create policy pets_insert_own on public.pets
  for insert to authenticated
  with check (client_id = app.current_client_id(business_id));

create policy pets_insert_staff on public.pets
  for insert to authenticated
  with check (
    app.has_role(business_id, 'staff')
    and exists (
      select 1 from public.clients c
      where c.business_id = pets.business_id and c.id = pets.client_id
    )
  );

create policy pets_update_own on public.pets
  for update to authenticated
  using (client_id = app.current_client_id(business_id))
  with check (client_id = app.current_client_id(business_id));

create policy pets_update_staff on public.pets
  for update to authenticated
  using (app.has_role(business_id, 'staff'))
  with check (app.has_role(business_id, 'staff'));

-- business_entitlements: provider members read the effective projection;
-- clients never see entitlement source metadata; only the sync path writes.
grant select on public.business_entitlements to authenticated, service_role;

create policy entitlements_select_member on public.business_entitlements
  for select to authenticated
  using (business_id in (select app.member_business_ids()));

-- audit_events: owner/admin read their business's log; nobody reads global
-- (business_id is null) rows through the API; no direct writes for anyone.
grant select on public.audit_events to authenticated, service_role;

create policy audit_select_admin on public.audit_events
  for select to authenticated
  using (business_id is not null and app.has_role(business_id, 'admin'));
