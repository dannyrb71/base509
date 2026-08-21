import pg from 'pg'

export const ISS = 'https://test.local/auth/v1'

const ADMIN_URL =
  process.env.CFG1_TEST_ADMIN_URL ?? 'postgres://postgres@127.0.0.1:55432/postgres'
const DB_NAME = process.env.CFG1_TEST_DB_NAME ?? 'cfg1_test'
export const DB_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${DB_NAME}`)

const openClients = new Set<pg.Client>()

/** Superuser connection (the migration/admin identity — bypasses RLS). */
export async function connect(): Promise<pg.Client> {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  openClients.add(c)
  return c
}

export async function closeAll(): Promise<void> {
  for (const c of openClients) {
    await c.end().catch(() => {})
  }
  openClients.clear()
}

export type ApiRole = 'anon' | 'authenticated' | 'service_role'

/** Impersonate an API caller the way PostgREST does: set role + JWT claims. */
export async function become(
  c: pg.Client,
  role: ApiRole,
  claims: Record<string, unknown> = {},
): Promise<void> {
  await c.query('reset role')
  // Authenticated sessions default to aal2 — the portal enforces AAL2 for
  // Owner/Admin (A2.4), so that is the realistic session shape. MFA tests
  // pass { aal: 'aal1' } explicitly to probe the DB backstop.
  const jwt = role === 'anon' ? { role, ...claims } : { role, iss: ISS, aal: 'aal2', ...claims }
  await c.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(jwt)])
  await c.query(`set role ${role}`)
}

export async function becomeAdmin(c: pg.Client): Promise<void> {
  await c.query('reset role')
  await c.query(`select set_config('request.jwt.claims', '', false)`)
}

/** Run fn on a fresh connection impersonating an authenticated user. */
export async function asUser<T>(
  sub: string,
  fn: (c: pg.Client) => Promise<T>,
  extraClaims: Record<string, unknown> = {},
): Promise<T> {
  const c = await connect()
  try {
    await become(c, 'authenticated', { sub, ...extraClaims })
    return await fn(c)
  } finally {
    await c.end()
    openClients.delete(c)
  }
}

/** Run fn as the internal workload identity (service_role). */
export async function asService<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = await connect()
  try {
    await become(c, 'service_role')
    return await fn(c)
  } finally {
    await c.end()
    openClients.delete(c)
  }
}

/** Assert a promise rejects with a message matching `re`; returns the error. */
export async function expectError(p: Promise<unknown>, re: RegExp): Promise<Error> {
  try {
    await p
  } catch (err) {
    const e = err as Error
    if (!re.test(e.message)) {
      throw new Error(`expected error matching ${re}, got: ${e.message}`)
    }
    return e
  }
  throw new Error(`expected error matching ${re}, but the call succeeded`)
}

/**
 * Concurrency harness: run `n` closures at once, each on its own connection
 * (one statement = one transaction), and report successes/failures.
 */
export async function race(
  runners: Array<(c: pg.Client) => Promise<unknown>>,
  role: ApiRole | { sub: string } = 'service_role',
): Promise<{ ok: number; errors: string[] }> {
  const clients = await Promise.all(runners.map(() => connect()))
  try {
    for (const c of clients) {
      if (typeof role === 'string') await become(c, role)
      else await become(c, 'authenticated', { sub: role.sub })
    }
    const results = await Promise.allSettled(runners.map((r, i) => r(clients[i]!)))
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason?.message ?? r.reason))
    return { ok: results.filter((r) => r.status === 'fulfilled').length, errors }
  } finally {
    for (const c of clients) {
      await c.end().catch(() => {})
      openClients.delete(c)
    }
  }
}

export function uuid(): string {
  return crypto.randomUUID()
}
