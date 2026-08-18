// Regenerates src/database.types.ts from a database that has every
// supabase/migrations file applied (spec §3: generate DB types, never
// hand-write them).
//
// Uses @supabase/postgres-meta's official typegen mode — the exact generator
// `supabase gen types typescript` wraps — pinned in devDependencies so local
// and CI output are byte-identical, with no Docker requirement.
//
//   CFG1_TYPEGEN_DB_URL=postgres://… npm run gen
//
// Default target is the local test database the §6 suite leaves behind
// (supabase/tests: npm test builds it from zero).
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const dbUrl =
  process.env.CFG1_TYPEGEN_DB_URL ?? 'postgres://postgres@127.0.0.1:55432/cfg1_test'

const server = path.join(
  HERE,
  '..',
  'node_modules',
  '@supabase',
  'postgres-meta',
  'dist',
  'server',
  'server.js',
)

const out = execFileSync(process.execPath, [server], {
  env: {
    ...process.env,
    PG_META_GENERATE_TYPES: 'typescript',
    PG_META_DB_URL: dbUrl,
    PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS: 'public',
  },
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})

const target = path.join(HERE, '..', 'src', 'database.types.ts')
writeFileSync(target, out)
console.log(`wrote ${target} (${out.split('\n').length} lines) from ${dbUrl}`)
