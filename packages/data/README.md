# @petappro/data

Generated Supabase DB types for the CFG-1 operational schema (S1-5 in
`technical_architecture.md` §1a). Consumed by the app, portal, and packages so
queries are typed against the real schema.

`src/database.types.ts` is **generated — never hand-edit it** (CFG-1 spec §3).

## Regenerating

1. Build a database with every migration applied. The easiest way is the §6
   test suite, which constructs one from zero:

   ```bash
   cd supabase/tests && npm test
   ```

2. Generate:

   ```bash
   cd packages/data && npm install && npm run gen
   ```

   Point at a different database with `CFG1_TYPEGEN_DB_URL=postgres://…`.

Generation uses `@supabase/postgres-meta`'s typegen — the same generator the
`supabase gen types typescript` CLI command wraps — pinned exactly in
devDependencies so local and CI output are byte-identical without a Docker
dependency. CI regenerates and fails on drift, so a schema migration that
lands without refreshed types cannot merge.
