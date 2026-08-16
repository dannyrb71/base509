-- Waitlist signups from the marketing site (pre-launch, D-061 waitlist mode).
-- Scope deliberately minimal: ONLY this table. The CFG-1 tenancy foundation
-- (businesses, roles, RLS helpers) is parked and NOT part of this migration.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (position('@' in email) > 1),
  source text,
  created_at timestamptz not null default now()
);

-- One signup per address, case-insensitive.
create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

-- Auto-RLS is on for new tables; enable explicitly so this migration is
-- self-contained, then open exactly one path: anonymous INSERT from the
-- marketing site. No select/update/delete for anon — the list is write-only
-- from the public internet.
alter table public.waitlist enable row level security;

create policy "anon can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);
