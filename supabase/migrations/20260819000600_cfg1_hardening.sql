-- ============================================================================
-- CFG-1 §7.6 — Hardening sweep
-- Spec: docs/specs/cfg-1-foundation-build-spec.md v2.1 §6 "Hardening".
--
-- Belt-and-braces closure over the whole CFG-1 surface: anon fully revoked
-- from every CFG-1 object, no stray PUBLIC grants on app helpers, and the
-- §6-mandated performance indexes verified in one place. Individual
-- migrations already grant narrowly; this sweep makes the posture auditable
-- and protects against a later migration accidentally relying on Supabase's
-- permissive default privileges.
-- ============================================================================

-- anon holds nothing on CFG-1 objects (the waitlist INSERT policy from the
-- pre-launch migration is the single sanctioned anon surface and is untouched).
do $$
declare
  t text;
begin
  foreach t in array array[
    'base509_accounts', 'auth_identities', 'businesses', 'business_memberships',
    'clients', 'pets', 'business_entitlements', 'audit_events',
    'business_invite_codes', 'availability_conflict_groups', 'capacity_groups',
    'business_services', 'service_zones', 'business_service_zones',
    'service_windows', 'service_window_zones', 'service_member_capacity_defaults',
    'service_window_assignments', 'service_window_assignment_zones',
    'business_calendar_days', 'business_service_day_overrides',
    'capacity_group_day_overrides', 'service_window_day_overrides',
    'service_window_day_override_assignments',
    'service_window_day_override_assignment_zones',
    'bookings', 'booking_pets', 'booking_occurrences',
    'entitlement_sync_receipts'
  ] loop
    execute format('revoke all on public.%I from public, anon', t);
  end loop;
end
$$;

-- No PUBLIC execute on any app-schema helper or public CFG-1 function.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app'
       or (n.nspname = 'public' and p.proowner = (select oid from pg_roles where rolname = 'cfg1_owner'))
  loop
    execute format('revoke all on function %s from public, anon', fn.sig);
  end loop;
end
$$;

-- anon keeps no usage on the internal schema.
revoke all on schema app from public, anon;

-- §6 performance indexes (created with their tables; asserted here so a
-- future refactor cannot silently drop them — migration fails if missing).
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'auth_identities'
      and indexdef like '%issuer%provider_subject%'
  ) then
    raise exception 'CFG-1 hardening: (issuer, provider_subject) index missing';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'business_memberships'
      and indexdef like '%business_id%base509_account_id%status%'
  ) then
    raise exception 'CFG-1 hardening: (business_id, base509_account_id, status) index missing';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'booking_occurrences'
      and indexdef like '%business_service_id%service_date%'
  ) then
    raise exception 'CFG-1 hardening: occurrence date-bucket index missing';
  end if;
end
$$;
