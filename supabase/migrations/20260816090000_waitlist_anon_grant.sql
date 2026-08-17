-- The project's secure defaults don't grant table privileges to anon, so the
-- RLS insert policy alone isn't reachable (PostgREST: 42501 permission denied).
-- Grant exactly the one privilege the waitlist route needs: INSERT, nothing else.

grant usage on schema public to anon;
grant insert on public.waitlist to anon;

-- The project's default privileges also handed anon/authenticated TRUNCATE,
-- REFERENCES, and TRIGGER on new tables. The waitlist needs none of these from
-- either role; keep the public surface at exactly anon INSERT (RLS-gated).
revoke truncate, references, trigger on public.waitlist from anon, authenticated;
