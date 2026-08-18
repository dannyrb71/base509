import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '..', '..', '..')
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations')
const HARNESS_DIR = path.join(REPO_ROOT, 'supabase', 'tests', 'harness')

export const ADMIN_URL =
  process.env.CFG1_TEST_ADMIN_URL ?? 'postgres://postgres@127.0.0.1:55432/postgres'
export const DB_NAME = process.env.CFG1_TEST_DB_NAME ?? 'cfg1_test'

export default async function globalSetup(): Promise<void> {
  const admin = new pg.Client({ connectionString: ADMIN_URL })
  await admin.connect()
  await admin.query(`drop database if exists ${DB_NAME} with (force)`)
  await admin.query(`create database ${DB_NAME}`)
  await admin.end()

  const dbUrl = ADMIN_URL.replace(/\/[^/]*$/, `/${DB_NAME}`)
  const db = new pg.Client({ connectionString: dbUrl })
  await db.connect()

  // §6 hardening gate: a fresh database must migrate from zero.
  // Order: Supabase shim → every migration in filename order → test wrapper.
  await db.query(readFileSync(path.join(HARNESS_DIR, '00_supabase_shim.sql'), 'utf8'))

  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of migrations) {
    try {
      await db.query(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
    } catch (err) {
      await db.end()
      throw new Error(`migration ${file} failed: ${(err as Error).message}`)
    }
  }

  await db.query(readFileSync(path.join(HARNESS_DIR, '99_test_wrapper.sql'), 'utf8'))

  // Test-only trusted issuer for the bootstrap contract.
  await db.query(
    `insert into app.trusted_issuers (issuer, note)
     values ('https://test.local/auth/v1', 'test harness')
     on conflict do nothing`,
  )

  await db.end()
}
