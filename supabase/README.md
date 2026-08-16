# Supabase — PetAppro

Project ref: `ecdmtldlqvkdvmyxgpzr` (URL: `https://ecdmtldlqvkdvmyxgpzr.supabase.co`)

Versioned, additive migrations live in `migrations/` (Supabase CLI naming:
`YYYYMMDDHHMMSS_description.sql`). Current scope is the pre-launch waitlist
table only — the CFG-1 tenancy foundation is parked and must not be built here
until it's unparked.

## Applying migrations

Preferred (repeatable): `supabase link --project-ref ecdmtldlqvkdvmyxgpzr`
then `supabase db push` (requires the Supabase CLI and an access token).
One-off fallback: paste the migration into the Supabase dashboard SQL editor.

## Environment

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL above (safe to expose).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon/publishable key (safe to expose;
  RLS is the security boundary — the waitlist table is anon-INSERT-only).

Both live in `apps/web/.env.local` locally (gitignored) and must be set in
Vercel project env for deploys.
