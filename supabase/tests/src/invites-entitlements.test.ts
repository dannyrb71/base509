// CFG-1 §6 gate — Invites (§3.2) + Entitlements (D-050 §2.2/§3.5)
// - Hashed, typed invite codes; type-specific use policy; atomic redemption
// - Redemption concurrency ≤ max_uses; seat concurrency ≤ entitlement;
//   parallel client creation ≤ Starter 5
// - Endpoint + DB negative gates; sync duplicate/out-of-order/stub-vs-master;
//   paid→Starter over-limit; fail-closed
import { afterAll, describe, expect, it } from 'vitest'
import { asService, asUser, closeAll, connect, expectError, race, uuid } from './db'
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
