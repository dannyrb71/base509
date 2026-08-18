-- ============================================================================
-- Local Supabase-compatibility shim — TEST HARNESS ONLY, never a migration.
--
-- Recreates, on a plain Postgres 15 cluster, exactly the environment a
-- Supabase project provides before migrations run: the api roles, the `auth`
-- schema helpers (auth.uid()/auth.jwt()/auth.role() reading the request JWT
-- claims GUC, verbatim Supabase definitions), and the `extensions` schema.
-- Tests impersonate API callers with:
--   set role authenticated;
--   select set_config('request.jwt.claims', '{"sub":"…","iss":"…"}', true);
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login;
  end if;
end
$$;

grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;

create schema if not exists auth;
create schema if not exists extensions;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema extensions to anon, authenticated, service_role;

create extension if not exists pgcrypto with schema extensions;

-- Verbatim Supabase auth helper definitions (supabase/postgres image).
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text
$$;

grant execute on function auth.uid(), auth.jwt(), auth.role() to anon, authenticated, service_role;

-- Supabase's default privileges: api roles can use objects in public unless
-- migrations revoke them (CFG-1 revokes explicitly, which the tests verify).
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
