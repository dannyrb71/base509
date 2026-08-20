-- CFG-1 allowlist fail-closed hardening (Codex round-6 P1).
--
-- app.valid_theme_allowlist accepted [] (the not-exists element check is
-- vacuously true on an empty array) and arrays missing 'brandy_blue'. An
-- empty stored allowlist therefore stayed EFFECTIVE as [] — denying every
-- theme including the safe default — instead of failing closed to Starter.
--
-- A valid allowlist must now be a non-empty array that CONTAINS
-- 'brandy_blue' (the always-available default every tier includes; the `?`
-- containment check also implies non-emptiness). Every element must still
-- be a known stable theme-key string. Because BOTH boundaries share this
-- one predicate, the fix lands on both sides at once:
--   - write side: sync_entitlements rejects such envelopes outright
--     (VALIDATION_FAILED), so they are never persisted;
--   - read side: app.effective_entitlements resolves any already-stored
--     invalid allowlist to app.starter_entitlements() — theme_allowlist
--     ['brandy_blue'] — never to the raw stored value.
--
-- Additive follow-up (never amend the applied 20260819000100): full CREATE
-- OR REPLACE, same signature/volatility/ownership.

create or replace function app.valid_theme_allowlist(p_allowlist jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_allowlist is not null
    and jsonb_typeof(p_allowlist) = 'array'
    and p_allowlist ? 'brandy_blue'
    and not exists (
      select 1
      from jsonb_array_elements(p_allowlist) e
      where jsonb_typeof(e.value) <> 'string'
         or not ((e.value #>> '{}') = any (app.known_theme_keys()))
    );
$$;

alter function app.valid_theme_allowlist(jsonb) owner to cfg1_owner;
revoke all on function app.valid_theme_allowlist(jsonb) from public, anon, authenticated, service_role;
