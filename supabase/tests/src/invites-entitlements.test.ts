// CFG-1 §6 gate — Invites (§3.2) + Entitlements (D-050 §2.2/§3.5)
// - Hashed, typed invite codes; type-specific use policy; atomic redemption
// - Redemption concurrency ≤ max_uses; seat concurrency ≤ entitlement;
//   parallel client creation ≤ Starter 5
// - Endpoint + DB negative gates; sync duplicate/out-of-order/stub-vs-master;
//   paid→Starter over-limit; fail-closed
import { afterAll, describe, expect, it } from 'vitest'
import { asService, asUser, become, closeAll, connect, expectError, race, uuid } from './db'
import {
  addClient,
  addMember,
  newAccount,
  newBusiness,
  setEntitlements,
} from './fixtures'

afterAll(closeAll)

async function makeInvite(
  biz: Awaited<ReturnType<typeof newBusiness>>,
  type: 'staff' | 'client',
  opts: { role?: string; maxUses?: number | null; expiresAt?: string | null } = {},
): Promise<{ id: string; token: string }> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `select * from public.create_invite($1, $2, $3, $4, $5)`,
      [biz.businessId, type, opts.role ?? (type === 'staff' ? 'staff' : null),
       opts.maxUses ?? null, opts.expiresAt ?? null],
    )
    return { id: r.rows[0].invite_id, token: r.rows[0].token }
  })
}

describe('invite codes (§3.2, §8 defaults)', () => {
  it('stores only a hash; the plaintext token never lands in the table or audit', async () => {
    const biz = await newBusiness()
    const { id, token } = await makeInvite(biz, 'client')
    const admin = await connect()
    const row = await admin.query(
      `select * from public.business_invite_codes where id = $1`,
      [id],
    )
    expect(row.rows[0].code_hash).not.toBe(token)
    expect(JSON.stringify(row.rows[0])).not.toContain(token)
    const audit = await admin.query(
      `select after, reason from public.audit_events where action = 'invite.create' and target_id = $1`,
      [id],
    )
    expect(audit.rowCount).toBe(1)
    expect(JSON.stringify(audit.rows[0])).not.toContain(token)
    await admin.end()
  })

  it('team invites default to single-use + expiring; client codes reusable until revoked', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId) // room for seats
    const admin = await connect()

    const staffInvite = await makeInvite(biz, 'staff')
    const s = await admin.query(
      `select max_uses, expires_at from public.business_invite_codes where id = $1`,
      [staffInvite.id],
    )
    expect(s.rows[0].max_uses).toBe(1)
    expect(s.rows[0].expires_at).not.toBeNull()

    const clientInvite = await makeInvite(biz, 'client')
    const cl = await admin.query(
      `select max_uses, expires_at from public.business_invite_codes where id = $1`,
      [clientInvite.id],
    )
    expect(cl.rows[0].max_uses).toBeNull()
    expect(cl.rows[0].expires_at).toBeNull()
    await admin.end()

    // Single-use staff code: second redemption is refused.
    const m1 = await newAccount()
    await asUser(m1.sub, (c) => c.query('select * from public.redeem_invite($1)', [staffInvite.token]))
    const m2 = await newAccount()
    await asUser(m2.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [staffInvite.token]),
        /INVITE_EXHAUSTED/,
      )
    })

    // Client code: reusable by many accounts…
    for (let i = 0; i < 2; i++) {
      const p = await newAccount()
      await asUser(p.sub, (c) => c.query('select * from public.redeem_invite($1)', [clientInvite.token]))
    }
    // …until revoked.
    await asUser(biz.owner.sub, (c) =>
      c.query('select public.revoke_invite($1, $2)', [biz.businessId, clientInvite.id]),
    )
    const p = await newAccount()
    await asUser(p.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [clientInvite.token]),
        /INVITE_REVOKED/,
      )
    })
  })

  it('expired and unknown codes are refused with stable errors', async () => {
    const biz = await newBusiness()
    const expired = await makeInvite(biz, 'client', { expiresAt: '2020-01-01T00:00:00Z' })
    const p = await newAccount()
    await asUser(p.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [expired.token]),
        /INVITE_EXPIRED/,
      )
      await expectError(
        c.query('select * from public.redeem_invite($1)', ['not-a-real-token']),
        /INVITE_INVALID/,
      )
    })
  })

  it('target_role is enforced, not a hint', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const invite = await makeInvite(biz, 'staff', { role: 'manager' })
    const m = await newAccount()
    const rel = await asUser(m.sub, async (c) =>
      (await c.query('select * from public.redeem_invite($1)', [invite.token])).rows[0],
    )
    const admin = await connect()
    const row = await admin.query(
      `select role from public.business_memberships where id = $1`,
      [rel.relationship_id],
    )
    expect(row.rows[0].role).toBe('manager')
    await admin.end()
  })

  it('invitees cannot read the invite table at all', async () => {
    const biz = await newBusiness()
    await makeInvite(biz, 'client')
    const outsider = await newAccount()
    await asUser(outsider.sub, async (c) => {
      const r = await c.query(`select * from public.business_invite_codes`)
      expect(r.rowCount).toBe(0)
    })
  })

  it('CONCURRENCY: redemption cannot exceed max_uses', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const invite = await makeInvite(biz, 'client', { maxUses: 3 })

    // 8 different pre-bootstrapped accounts race to redeem.
    const people = await Promise.all(Array.from({ length: 8 }, () => newAccount()))
    const clients = await Promise.all(people.map(() => connect()))
    try {
      for (let i = 0; i < clients.length; i++) {
        await clients[i]!.query(`select set_config('request.jwt.claims', $1, false)`, [
          JSON.stringify({ sub: people[i]!.sub, iss: 'https://test.local/auth/v1', role: 'authenticated' }),
        ])
        await clients[i]!.query('set role authenticated')
      }
      const results = await Promise.allSettled(
        clients.map((c) => c.query('select * from public.redeem_invite($1)', [invite.token])),
      )
      const ok = results.filter((r) => r.status === 'fulfilled').length
      expect(ok).toBe(3)
      for (const r of results) {
        if (r.status === 'rejected') {
          expect(String(r.reason)).toMatch(/INVITE_EXHAUSTED|LIMIT_EXCEEDED/)
        }
      }
    } finally {
      for (const c of clients) await c.end().catch(() => {})
    }

    const admin = await connect()
    const uses = await admin.query(
      `select uses_count from public.business_invite_codes where id = $1`,
      [invite.id],
    )
    expect(uses.rows[0].uses_count).toBe(3)
    await admin.end()
  })
})

describe('business bootstrap slug + multi-business (Phase A 0a)', () => {
  it('two businesses may share a display name; slugs stay unique and routable', async () => {
    const a = await newBusiness('Happy Paws');
    const b = await newBusiness('Happy Paws');
    const admin = await connect()
    const rows = await admin.query(
      `select id, name, slug from public.businesses where id = any($1::uuid[]) order by created_at`,
      [[a.businessId, b.businessId]],
    )
    expect(rows.rowCount).toBe(2)
    expect(rows.rows[0].name).toBe('Happy Paws')
    expect(rows.rows[1].name).toBe('Happy Paws')
    for (const r of rows.rows) {
      expect(r.slug).toMatch(/^happy-paws-[0-9a-f]{6}$/)
    }
    expect(rows.rows[0].slug).not.toBe(rows.rows[1].slug)
    await admin.end()
  })

  it('slugs sanitize messy names and never collide with authorization (routing only)', async () => {
    const biz = await newBusiness('  Émile & Co — Dogs!!  ')
    const admin = await connect()
    const r = await admin.query(`select slug from public.businesses where id = $1`, [
      biz.businessId,
    ])
    expect(r.rows[0].slug).toMatch(/^[a-z0-9][a-z0-9-]*-[0-9a-f]{6}$/)
    await admin.end()
  })

  it('bootstrap is idempotent: same key returns the same business and slug', async () => {
    const owner = await newAccount()
    const key = uuid()
    const first = await asUser(owner.sub, async (c) =>
      (await c.query(`select public.create_business('Retry Kennel', $1) as id`, [key])).rows[0].id,
    )
    const second = await asUser(owner.sub, async (c) =>
      (await c.query(`select public.create_business('Retry Kennel', $1) as id`, [key])).rows[0].id,
    )
    expect(second).toBe(first)
    const admin = await connect()
    const n = await admin.query(
      `select count(*) as n from public.businesses where bootstrap_key = $1`, [key],
    )
    expect(Number(n.rows[0].n)).toBe(1)
    await admin.end()
  })

  it('one account can own multiple businesses (many-to-many, no schema conflict)', async () => {
    const owner = await newAccount()
    const ids: string[] = []
    for (const name of ['First Location', 'Second Location']) {
      ids.push(
        await asUser(owner.sub, async (c) =>
          (await c.query(`select public.create_business($1, $2) as id`, [name, uuid()])).rows[0].id,
        ),
      )
    }
    expect(new Set(ids).size).toBe(2)
    const admin = await connect()
    const m = await admin.query(
      `select count(*) as n from public.business_memberships
       where base509_account_id = $1 and role = 'owner' and status = 'active'`,
      [owner.accountId],
    )
    expect(Number(m.rows[0].n)).toBe(2)
    // Each business got its own Starter entitlement row.
    const e = await admin.query(
      `select count(*) as n from public.business_entitlements where business_id = any($1::uuid[])`,
      [ids],
    )
    expect(Number(e.rows[0].n)).toBe(2)
    await admin.end()
  })
})

describe('business bootstrap hardening (Codex re-review, permanent gate)', () => {
  it('CONCURRENT same-account/same-key bootstrap: exactly 1 business, 1 Owner membership, 1 Starter entitlement', async () => {
    const owner = await newAccount()
    const key = uuid()
    const { ok, errors } = await race(
      Array.from({ length: 6 }, () => async (c: any) =>
        c.query(`select public.create_business('Race Kennel', $1) as id`, [key])),
      { sub: owner.sub },
    )
    expect(errors).toEqual([])
    expect(ok).toBe(6) // idempotent: every call returns the same business
    const admin = await connect()
    const counts = await admin.query(
      `select
         (select count(*) from public.businesses where bootstrap_key = $1) as businesses,
         (select count(*) from public.business_memberships m
            join public.businesses b on b.id = m.business_id
          where b.bootstrap_key = $1 and m.role = 'owner' and m.status = 'active') as owners,
         (select count(*) from public.business_entitlements e
            join public.businesses b on b.id = e.business_id
          where b.bootstrap_key = $1 and e.tier_key = 'starter') as starter_rows`,
      [key],
    )
    expect(counts.rows[0]).toEqual({ businesses: '1', owners: '1', starter_rows: '1' })
    await admin.end()
  })

  it('a DIFFERENT account reusing the same idempotency key is DENIED', async () => {
    const owner = await newAccount()
    const key = uuid()
    await asUser(owner.sub, (c) =>
      c.query(`select public.create_business('Mine', $1)`, [key]),
    )
    const intruder = await newAccount()
    await asUser(intruder.sub, async (c) => {
      await expectError(
        c.query(`select public.create_business('Not mine', $1)`, [key]),
        /FORBIDDEN.*idempotency key/,
      )
    })
    const admin = await connect()
    const n = await admin.query(
      `select count(*) as n from public.businesses where bootstrap_key = $1`, [key],
    )
    expect(Number(n.rows[0].n)).toBe(1)
    await admin.end()
  })
})

describe('theme persistence boundary (Codex item 2)', () => {
  const CITY = 'san_fursisco'
  const FULL = ['brandy_blue', 'husky', 'irish_setter', 'bichon_frise', 'blue_heeler', 'chessie',
    'bark_avenue_ny', 'south_bark_miami', 'hollywoowoowood', 'san_fursisco']

  it('allowed selection persists via the RPC (merge-preserving, audited)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, { theme_allowlist: FULL })
    const admin = await connect()
    // Pre-seed an unrelated settings key to prove merge preservation.
    await admin.query(
      `update public.businesses set settings = '{"beta_flag": true}'::jsonb where id = $1`,
      [biz.businessId],
    )
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_business_theme($1, $2, 'dark')`, [biz.businessId, CITY]),
    )
    const row = await admin.query(`select settings from public.businesses where id = $1`, [
      biz.businessId,
    ])
    expect(row.rows[0].settings.theme_key).toBe(CITY)
    expect(row.rows[0].settings.theme_mode).toBe('dark')
    expect(row.rows[0].settings.beta_flag).toBe(true) // unrelated key preserved
    const audit = await admin.query(
      `select count(*) as n from public.audit_events
       where business_id = $1 and action = 'business.theme_change'`,
      [biz.businessId],
    )
    expect(Number(audit.rows[0].n)).toBe(1)
    await admin.end()
  })

  it('disallowed selection is refused at the DB (Starter picking a city theme)', async () => {
    const biz = await newBusiness() // Starter: allowlist [brandy_blue]
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(`select public.set_business_theme($1, $2, 'dark')`, [biz.businessId, CITY]),
        /THEME_NOT_ALLOWED/,
      )
      await expectError(
        c.query(`select public.set_business_theme($1, 'not_a_theme', 'dark')`, [biz.businessId]),
        /VALIDATION_FAILED.*unknown theme/,
      )
      await expectError(
        c.query(`select public.set_business_theme($1, 'brandy_blue', 'sepia')`, [biz.businessId]),
        /VALIDATION_FAILED.*mode/,
      )
      // The safe default IS allowed on Starter.
      await c.query(`select public.set_business_theme($1, 'brandy_blue', 'dark')`, [biz.businessId])
    })
  })

  it('the direct settings write path is CLOSED for authenticated roles', async () => {
    const biz = await newBusiness()
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(
          `update public.businesses set settings = '{"theme_key":"san_fursisco","theme_mode":"dark"}'::jsonb
           where id = $1`,
          [biz.businessId],
        ),
        /permission denied/,
      )
      // The legit profile columns still work.
      await c.query(`update public.businesses set name = 'Still Mine' where id = $1`, [
        biz.businessId,
      ])
    })
  })

  it('cross-tenant theme writes are refused (RPC selector proven, direct denied)', async () => {
    const a = await newBusiness()
    const b = await newBusiness()
    await setEntitlements(b.businessId, { theme_allowlist: FULL })
    await asUser(a.owner.sub, async (c) => {
      await expectError(
        c.query(`select public.set_business_theme($1, 'brandy_blue', 'light')`, [b.businessId]),
        /FORBIDDEN/,
      )
      await expectError(
        c.query(`update public.businesses set settings = '{}'::jsonb where id = $1`, [b.businessId]),
        /permission denied/,
      )
    })
  })

  it('downgrade falls back a now-disallowed stored theme (same lock, audited)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, { theme_allowlist: FULL })
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_business_theme($1, $2, 'dark')`, [biz.businessId, CITY]),
    )
    // Downgrade to Starter's allowlist.
    await setEntitlements(biz.businessId, {
      tier_key: 'starter', client_limit: 5, seat_limit: 1, theme_allowlist: ['brandy_blue'],
    })
    const admin = await connect()
    const row = await admin.query(`select settings from public.businesses where id = $1`, [
      biz.businessId,
    ])
    expect(row.rows[0].settings.theme_key).toBe('brandy_blue') // fell back
    expect(row.rows[0].settings.theme_mode).toBe('dark') // mode untouched
    const audit = await admin.query(
      `select count(*) as n from public.audit_events
       where business_id = $1 and action = 'business.theme_fallback'`,
      [biz.businessId],
    )
    expect(Number(audit.rows[0].n)).toBe(1)
    await admin.end()
  })

  it('CONCURRENT selection-vs-downgrade always lands in an allowed state', async () => {
    for (let round = 0; round < 3; round++) {
      const biz = await newBusiness()
      await setEntitlements(biz.businessId, { theme_allowlist: FULL })
      const downgradeEnvelope = {
        source_system: 'base509_master',
        event_id: uuid(),
        source_version: 5000 + round,
        operational_business_id: biz.businessId,
        tier_key: 'starter',
        capabilities: {},
        client_limit: 5,
        seat_limit: 1,
        theme_allowlist: ['brandy_blue'],
      }
      const clients = await Promise.all([connect(), connect()])
      try {
        await become(clients[0]!, 'authenticated', { sub: biz.owner.sub })
        await become(clients[1]!, 'service_role')
        await Promise.allSettled([
          clients[0]!.query(`select public.set_business_theme($1, $2, 'dark')`, [
            biz.businessId, CITY,
          ]),
          clients[1]!.query(`select * from public.sync_entitlements($1)`, [
            JSON.stringify(downgradeEnvelope),
          ]),
        ])
      } finally {
        for (const c of clients) await c.end().catch(() => {})
      }
      // Invariant regardless of interleaving: the stored theme is in the
      // FINAL effective allowlist.
      const admin = await connect()
      const check = await admin.query(
        `select (app.effective_entitlements($1) -> 'theme_allowlist')
                  ? coalesce(b.settings ->> 'theme_key', 'brandy_blue') as allowed,
                b.settings ->> 'theme_key' as stored
         from public.businesses b where b.id = $1`,
        [biz.businessId],
      )
      expect(check.rows[0].allowed, `round ${round}: stored=${check.rows[0].stored}`).toBe(true)
      await admin.end()
    }
  })
})

describe('entitlements (D-050)', () => {
  it('CONCURRENCY: seat activation cannot exceed the seat limit (separate single-use invites)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, { seat_limit: 3 }) // owner + 2 more
    // Team invites are strictly single-use, so the race uses 8 DISTINCT
    // invites — the seat limit, not invite exhaustion, must be the gate.
    const invites: Array<{ id: string; token: string }> = []
    for (let i = 0; i < 8; i++) invites.push(await makeInvite(biz, 'staff'))
    const people = await Promise.all(Array.from({ length: 8 }, () => newAccount()))
    const clients = await Promise.all(people.map(() => connect()))
    try {
      for (let i = 0; i < clients.length; i++) {
        await clients[i]!.query(`select set_config('request.jwt.claims', $1, false)`, [
          JSON.stringify({ sub: people[i]!.sub, iss: 'https://test.local/auth/v1', role: 'authenticated' }),
        ])
        await clients[i]!.query('set role authenticated')
      }
      const results = await Promise.allSettled(
        clients.map((c, i) =>
          c.query('select * from public.redeem_invite($1)', [invites[i]!.token]),
        ),
      )
      const ok = results.filter((r) => r.status === 'fulfilled').length
      expect(ok).toBe(2)
      for (const r of results) {
        if (r.status === 'rejected') expect(String(r.reason)).toMatch(/LIMIT_EXCEEDED/)
      }
    } finally {
      for (const c of clients) await c.end().catch(() => {})
    }
    const admin = await connect()
    const n = await admin.query(
      `select count(*) as n from public.business_memberships where business_id = $1 and status = 'active'`,
      [biz.businessId],
    )
    expect(Number(n.rows[0].n)).toBe(3)
    await admin.end()
  })

  it('staff invites are single-use at BOTH the RPC and the table (Codex #4)', async () => {
    const biz = await newBusiness()
    // RPC layer: requesting a multi-use team invite is an error, not a default.
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(`select * from public.create_invite($1, 'staff', 'staff', 5)`, [biz.businessId]),
        /VALIDATION_FAILED.*single-use/,
      )
      // max_uses = 1 explicitly is fine.
      await c.query(`select * from public.create_invite($1, 'staff', 'staff', 1)`, [biz.businessId])
    })
    // Table layer: even a privileged direct insert cannot mint one.
    const admin = await connect()
    await expectError(
      admin.query(
        `insert into public.business_invite_codes
           (business_id, code_hash, type, target_role, max_uses, created_by_account_id)
         values ($1, encode(extensions.digest(gen_random_uuid()::text, 'sha256'), 'hex'),
                 'staff', 'staff', 3, $2)`,
        [biz.businessId, biz.owner.accountId],
      ),
      /check constraint/,
    )
    await admin.end()
  })

  it('CONCURRENCY: parallel client creation cannot exceed Starter 5', async () => {
    const biz = await newBusiness() // Starter by bootstrap seed
    const runners = Array.from({ length: 10 }, (_, i) => async (c: any) =>
      c.query(`select public.create_client($1, $2)`, [biz.businessId, `Client ${i}`]))
    // Owner performs all creations concurrently.
    const { ok, errors } = await race(runners, { sub: biz.owner.sub })
    expect(ok).toBe(5)
    for (const e of errors) expect(e).toMatch(/LIMIT_EXCEEDED/)
    const admin = await connect()
    const n = await admin.query(
      `select count(*) as n from public.clients where business_id = $1 and status = 'active'`,
      [biz.businessId],
    )
    expect(Number(n.rows[0].n)).toBe(5)
    await admin.end()
  })

  it('negative gate: Starter refuses the 6th client at endpoint AND database layers', async () => {
    const biz = await newBusiness()
    for (let i = 0; i < 5; i++) {
      await asUser(biz.owner.sub, (c) =>
        c.query(`select public.create_client($1, $2)`, [biz.businessId, `C${i}`]),
      )
    }
    await asUser(biz.owner.sub, async (c) => {
      // Endpoint layer: the typed RPC refuses.
      await expectError(
        c.query(`select public.create_client($1, 'Sixth')`, [biz.businessId]),
        /LIMIT_EXCEEDED/,
      )
      // DB layer: a tampered direct insert is refused outright (no grant).
      await expectError(
        c.query(
          `insert into public.clients (business_id, display_name) values ($1, 'Sneaky')`,
          [biz.businessId],
        ),
        /permission denied/,
      )
    })
  })

  it('negative gate: seat limit refuses at endpoint AND database layers', async () => {
    const biz = await newBusiness() // Starter: seat_limit 1 (owner holds it)
    const invite = await makeInvite(biz, 'staff')
    const p = await newAccount()
    await asUser(p.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [invite.token]),
        /LIMIT_EXCEEDED/,
      )
      await expectError(
        c.query(
          `insert into public.business_memberships (business_id, base509_account_id, role)
           values ($1, $2, 'staff')`,
          [biz.businessId, p.accountId],
        ),
        /permission denied/,
      )
    })
  })

  it('capability checks fail closed; tampered/unknown keys are denied', async () => {
    const biz = await newBusiness()
    const admin = await connect()
    // Unknown capability on Starter → denied.
    const r1 = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(r1.rows[0].ok).toBe(false)
    await expectError(
      admin.query(`select app.require_entitlement($1, 'gps')`, [biz.businessId]),
      /ENTITLEMENT_REQUIRED/,
    )
    // Grant it via master sync → allowed.
    await setEntitlements(biz.businessId, { capabilities: { gps: true } })
    const r2 = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(r2.rows[0].ok).toBe(true)
    // Malformed projection (capabilities not an object) → fail closed.
    await admin.query(
      `update public.business_entitlements set capabilities = '[]'::jsonb where business_id = $1`,
      [biz.businessId],
    )
    const r3 = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(r3.rows[0].ok).toBe(false)
    // Expired projection → fail closed to Starter.
    await setEntitlements(biz.businessId, {
      capabilities: { gps: true },
      expires_at: '2020-01-01T00:00:00Z',
    })
    const r4 = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(r4.rows[0].ok).toBe(false)
    const eff = await admin.query(`select app.effective_entitlements($1) as e`, [biz.businessId])
    expect(eff.rows[0].e.tier_key).toBe('starter')
    await admin.end()
  })

  it('app roles cannot write the projection; only the workload identity syncs', async () => {
    const biz = await newBusiness()
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(
          `update public.business_entitlements set tier_key = 'crew' where business_id = $1`,
          [biz.businessId],
        ),
        /permission denied/,
      )
      // The sync RPC is not even executable by app roles.
      await expectError(
        c.query(`select * from public.sync_entitlements('{}')`),
        /permission denied/,
      )
    })
  })

  it('sync: duplicates deduped, out-of-order rejected, receipts immutable', async () => {
    const biz = await newBusiness()
    const eventId = uuid()
    const first = await setEntitlements(biz.businessId, {}, { version: 50, eventId })
    expect(first.status).toBe('applied')

    // Same event replayed → harmless duplicate.
    const dup = await setEntitlements(biz.businessId, {}, { version: 50, eventId })
    expect(dup.status).toBe('duplicate_ignored')

    // Older version, new event id → out-of-order rejection, projection intact.
    const old = await setEntitlements(biz.businessId, { tier_key: 'stale' }, { version: 49 })
    expect(old.status).toBe('rejected_out_of_order')

    const admin = await connect()
    const row = await admin.query(
      `select tier_key, source_version from public.business_entitlements where business_id = $1`,
      [biz.businessId],
    )
    expect(row.rows[0].tier_key).toBe('crew')
    expect(Number(row.rows[0].source_version)).toBe(50)

    // Immutable sync receipts.
    await expectError(
      admin.query(`update public.entitlement_sync_receipts set outcome = 'applied'`),
      /IMMUTABLE_ROW/,
    )
    await expectError(
      admin.query(`delete from public.entitlement_sync_receipts`),
      /IMMUTABLE_ROW/,
    )
    await admin.end()
  })

  it('sync: the stub can never overwrite a master-authoritative projection', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, {}, { version: 10 }) // master
    const stub = await setEntitlements(
      biz.businessId,
      {
        tier_key: 'starter',
        capabilities: {},
        client_limit: 5,
        seat_limit: 1,
        theme_allowlist: ['brandy_blue'],
      },
      { source: 'bootstrap_stub', version: 99 },
    )
    expect(stub.status).toBe('rejected_stub_after_master')
    const admin = await connect()
    const row = await admin.query(
      `select tier_key, source_system from public.business_entitlements where business_id = $1`,
      [biz.businessId],
    )
    expect(row.rows[0].source_system).toBe('base509_master')
    expect(row.rows[0].tier_key).toBe('crew')
    await admin.end()
  })

  it('sync: the stub may only seed the safe Starter set', async () => {
    const biz = await newBusiness()
    await asService(async (c) => {
      await expectError(
        c.query(`select * from public.sync_entitlements($1)`, [
          JSON.stringify({
            source_system: 'bootstrap_stub',
            event_id: uuid(),
            source_version: 1,
            operational_business_id: biz.businessId,
            tier_key: 'crew',
            capabilities: { gps: true },
            client_limit: null,
            seat_limit: 10,
          }),
        ]),
        /VALIDATION_FAILED/,
      )
    })
  })

  it('paid→Starter over-limit: reads keep working, new/reactivated clients are refused', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, { client_limit: null })
    for (let i = 0; i < 7; i++) {
      await asUser(biz.owner.sub, (c) =>
        c.query(`select public.create_client($1, $2)`, [biz.businessId, `Paid ${i}`]),
      )
    }
    // Downgrade to Starter limits while 7 active relationships remain.
    await setEntitlements(biz.businessId, {
      tier_key: 'starter',
      client_limit: 5,
      seat_limit: 1,
    })

    await asUser(biz.owner.sub, async (c) => {
      // Existing records stay readable.
      const r = await c.query(
        `select count(*) as n from public.clients where business_id = $1 and status = 'active'`,
        [biz.businessId],
      )
      expect(Number(r.rows[0].n)).toBe(7)
      // No new clients while over limit.
      await expectError(
        c.query(`select public.create_client($1, 'Over')`, [biz.businessId]),
        /LIMIT_EXCEEDED/,
      )
      // Archive one, then reactivation is still refused (7 > 5 either way).
      const one = await c.query(
        `select id from public.clients where business_id = $1 and status = 'active' limit 1`,
        [biz.businessId],
      )
      await c.query(`select public.set_client_status($1, $2, 'ended')`, [
        biz.businessId,
        one.rows[0].id,
      ])
      await expectError(
        c.query(`select public.reactivate_client($1, $2)`, [biz.businessId, one.rows[0].id]),
        /LIMIT_EXCEEDED/,
      )
    })
  })

  it('the complete Crew/Team city-theme projection syncs and stays effective (Codex #3 round)', async () => {
    const CREW_THEMES = [
      'brandy_blue',
      'husky', 'irish_setter', 'bichon_frise', 'blue_heeler', 'chessie',
      'bark_avenue_ny', 'south_bark_miami', 'hollywoowoowood', 'san_fursisco',
    ]
    const biz = await newBusiness()
    // Sync side: the full locked roster is a VALID allowlist, not a rejection.
    const applied = await setEntitlements(biz.businessId, {
      tier_key: 'crew',
      theme_allowlist: CREW_THEMES,
      capabilities: { gps: true },
      client_limit: null,
      seat_limit: 10,
    })
    expect(applied.status).toBe('applied')
    // Read side: it stays effective — no Starter downgrade for city themes.
    const admin = await connect()
    const eff = await admin.query(`select app.effective_entitlements($1) as e`, [
      biz.businessId,
    ])
    expect(eff.rows[0].e.tier_key).toBe('crew')
    expect(eff.rows[0].e.theme_allowlist).toEqual(CREW_THEMES)
    const gps = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(gps.rows[0].ok).toBe(true)
    await admin.end()
  })

  it('Duo’s projection carries all breeds and excludes the city keys', async () => {
    const DUO_THEMES = [
      'brandy_blue', 'husky', 'irish_setter', 'bichon_frise', 'blue_heeler', 'chessie',
    ]
    const biz = await newBusiness()
    const applied = await setEntitlements(biz.businessId, {
      tier_key: 'duo',
      theme_allowlist: DUO_THEMES,
      seat_limit: 2,
      client_limit: null,
    })
    expect(applied.status).toBe('applied')
    const admin = await connect()
    const eff = await admin.query(`select app.effective_entitlements($1) as e`, [
      biz.businessId,
    ])
    expect(eff.rows[0].e.tier_key).toBe('duo')
    expect(eff.rows[0].e.theme_allowlist).toEqual(DUO_THEMES)
    for (const cityKey of ['bark_avenue_ny', 'south_bark_miami', 'hollywoowoowood', 'san_fursisco']) {
      expect(eff.rows[0].e.theme_allowlist).not.toContain(cityKey)
    }
    await admin.end()
  })

  it('sync rejects malformed envelope fields outright (Codex #7)', async () => {
    const biz = await newBusiness()
    const base = {
      source_system: 'base509_master',
      operational_business_id: biz.businessId,
      tier_key: 'crew',
      capabilities: {},
    }
    await asService(async (c) => {
      const attempt = (extra: Record<string, unknown>) =>
        c.query(`select * from public.sync_entitlements($1)`, [
          JSON.stringify({ ...base, event_id: uuid(), source_version: 500, ...extra }),
        ])
      // theme_allowlist: non-array, array-with-object, empty-string element,
      // and unknown stable key are all refused (Codex re-review #1).
      await expectError(attempt({ theme_allowlist: 'pink' }), /VALIDATION_FAILED.*theme_allowlist/)
      await expectError(
        attempt({ theme_allowlist: ['brandy_blue', { sneaky: true }] }),
        /VALIDATION_FAILED.*theme_allowlist/,
      )
      await expectError(
        attempt({ theme_allowlist: ['brandy_blue', ''] }),
        /VALIDATION_FAILED.*theme_allowlist/,
      )
      await expectError(
        attempt({ theme_allowlist: ['neon_zebra'] }),
        /VALIDATION_FAILED.*theme_allowlist/,
      )
      await expectError(
        attempt({ theme_allowlist: ['brandy_blue', 42] }),
        /VALIDATION_FAILED.*theme_allowlist/,
      )
      await expectError(
        attempt({ projection_version: 99 }),
        /VALIDATION_FAILED.*projection_version/,
      )
      await expectError(
        attempt({ projection_version: 'two' }),
        /VALIDATION_FAILED.*projection_version/,
      )
      await expectError(attempt({ client_limit: 'abc' }), /VALIDATION_FAILED.*client_limit/)
      await expectError(attempt({ seat_limit: [3] }), /VALIDATION_FAILED.*seat_limit/)
      await expectError(
        attempt({ effective_at: 'not-a-date' }),
        /VALIDATION_FAILED.*timestamps/,
      )
      await expectError(
        attempt({ expires_at: 'tomorrow-ish' }),
        /VALIDATION_FAILED.*timestamps/,
      )
    })
    // Nothing malformed was persisted; the business still holds its seed.
    const admin = await connect()
    const row = await admin.query(
      `select source_system from public.business_entitlements where business_id = $1`,
      [biz.businessId],
    )
    expect(row.rows[0].source_system).toBe('bootstrap_stub')
    await admin.end()
  })

  it('read side fails closed to Starter on malformed theme_allowlist or unsupported projection_version (Codex #7)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId, { capabilities: { gps: true }, client_limit: null })
    const admin = await connect()
    const effective = async () =>
      (await admin.query(`select app.effective_entitlements($1) as e`, [biz.businessId]))
        .rows[0].e

    expect((await effective()).tier_key).toBe('crew')

    // Corrupt the projection out-of-band: every malformed allowlist shape
    // must resolve to the safe Starter envelope, never paid entitlements.
    for (const corrupt of [
      `'"solo_pink"'`, // bare string, not an array
      `'["brandy_blue", {"k": 1}]'`, // array with an object element
      `'["brandy_blue", ""]'`, // empty-string element
      `'["neon_zebra"]'`, // unknown stable key
      `'[42]'`, // numeric element
    ]) {
      await admin.query(
        `update public.business_entitlements set theme_allowlist = ${corrupt}::jsonb
         where business_id = $1`,
        [biz.businessId],
      )
      const e = await effective()
      expect(e.tier_key, `allowlist ${corrupt} must fail closed`).toBe('starter')
      expect(e.client_limit).toBe(5)
      expect(e.theme_allowlist).toEqual(['brandy_blue'])
      const cap = await admin.query(`select app.has_capability($1, 'gps') as ok`, [
        biz.businessId,
      ])
      expect(cap.rows[0].ok, `allowlist ${corrupt} must not leak paid capabilities`).toBe(false)
    }
    let e: any

    // Restore, then corrupt the projection version instead.
    await setEntitlements(biz.businessId, { capabilities: { gps: true }, client_limit: null })
    await admin.query(
      `update public.business_entitlements set projection_version = 99 where business_id = $1`,
      [biz.businessId],
    )
    e = await effective()
    expect(e.tier_key).toBe('starter')
    const cap = await admin.query(`select app.has_capability($1, 'gps') as ok`, [biz.businessId])
    expect(cap.rows[0].ok).toBe(false)
    await admin.end()
  })

  it('get_effective_entitlements proves membership and reports fail-closed state', async () => {
    const biz = await newBusiness()
    const outsider = await newAccount()
    await asUser(outsider.sub, async (c) => {
      await expectError(
        c.query('select public.get_effective_entitlements($1)', [biz.businessId]),
        /FORBIDDEN/,
      )
    })
    // Remove the projection entirely (fail-closed path).
    const admin = await connect()
    await admin.query(`delete from public.business_entitlements where business_id = $1`, [
      biz.businessId,
    ])
    await admin.end()
    const eff = await asUser(biz.owner.sub, async (c) =>
      (await c.query('select public.get_effective_entitlements($1) as e', [biz.businessId]))
        .rows[0].e,
    )
    expect(eff.tier_key).toBe('starter')
    expect(eff.client_limit).toBe(5)
    expect(eff.seat_limit).toBe(1)
    expect(eff.theme_allowlist).toEqual(['brandy_blue'])
  })
})
