# Supabase — PetAppro

Project ref: `ecdmtldlqvkdvmyxgpzr` (URL: `https://ecdmtldlqvkdvmyxgpzr.supabase.co`)

Versioned, additive migrations live in `migrations/` (Supabase CLI naming:
`YYYYMMDDHHMMSS_description.sql`). Two layers exist:

1. **Waitlist** (`20260815*`/`20260816*`) — the pre-launch marketing-site
   waitlist. Applied + verified on the live project 2026-08-16. This is the
   ONLY thing on the production database today.
2. **CFG-1 operational foundation** (`20260819*`) — the multi-tenant schema
   (identity/tenancy, RBAC, RLS, invites, services + capacity/zones/overrides,
   booking shells, entitlement projection, immutable audit) built per
   `docs/specs/cfg-1-foundation-build-spec.md` (v2.1, Codex-ratified).
   **Built and tested locally/CI only — NOT yet applied to the live project.**
   Deploying it to prod requires Codex review + Danny's explicit approval
   (spec §9 routing).

## CFG-1 gate (§6) — how to run

The go/no-go suite builds a fresh Postgres 15 from zero (Supabase-shim +
every migration) and runs the full RLS/RBAC/entitlement/capacity/identity/
concurrency gate:

```bash
cd supabase/tests && npm install && npm test
```

Locally it expects Postgres **with PostGIS available** at
`postgres://postgres@127.0.0.1:55432` (override with `CFG1_TEST_ADMIN_URL`).
PostGIS backs the zone-geometry validation trigger; Homebrew's `postgis`
formula only ships extensions for `postgresql@17`+, so local runs use PG17
while CI runs `postgis/postgis:15-3.4` (PG15 = prod parity — CI is the gate
of record). CI runs the same suite plus the `packages/data` generated-type
drift check on every PR (`db-tests` job).

Generated DB types: see `packages/data/README.md` (`npm run gen`).

## Applying migrations (prod — approval-gated)

Preferred (repeatable): `supabase link --project-ref ecdmtldlqvkdvmyxgpzr`
then `supabase db push` (requires the Supabase CLI and an access token).
One-off fallback: paste the migration into the Supabase dashboard SQL editor.

## Environment

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL above (safe to expose).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon/publishable key (safe to expose;
  RLS is the security boundary — the waitlist table is anon-INSERT-only).

Both live in `apps/web/.env.local` locally (gitignored) and must be set in
Vercel project env for deploys.
