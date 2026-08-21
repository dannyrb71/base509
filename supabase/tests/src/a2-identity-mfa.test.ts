// CFG-1 §6 gate — A2 identity/linking/MFA boundary (Codex round 1)
// - AAL2 required for admin+ authority on BOTH boundaries: every typed op
//   that calls require_role(..., 'admin') (catalog-enumerated, exhaustive)
//   AND every admin-gated RLS policy (has_role fails closed below AAL2) —
//   direct PostgREST SELECT/INSERT/UPDATE/DELETE included.
// - Identity audit is provenance-true: sync_identity_audit diffs the REAL
//   GoTrue state; nothing parameterized to spoof; idempotent; race-safe.
// - Binding invariant (PRODUCT RULING): provider-VERIFIED same-email
//   identities bind upstream to ONE subject/account; at this layer accounts
//   map strictly by (issuer, subject) and email NEVER merges anything —
//   distinct subjects stay distinct even with identical emails.
import { afterAll, describe, expect, it } from 'vitest'
import { asUser, become, connect, closeAll, expectError, uuid } from './db'
import { addMember, newAccount, newBusiness, setEntitlements } from './fixtures'

afterAll(closeAll)

describe('AAL2 enforcement — typed ops (require_role admin+, catalog-backed)', () => {
  // EVERY public function whose source calls require_role(..., 'admin') must
  // be classified here with a concrete AAL1 invocation. The catalog check
  // below fails this suite if a new admin-gated op ships unclassified.
  const D = '2027-01-01'
  // remove_member resolves its target BEFORE require_role (flagged to
  // Codex as a business-scoped existence disclosure at AAL1), so the
  // sweep hands every op a REAL staff membership id to get past lookups.
  const ADMIN_OPS: Record<string, (biz: string, memberId: string) => [string, unknown[]]> = {
    change_membership_role: (b) => [`select public.change_membership_role($1, $2, 'staff')`, [b, uuid()]],
    reactivate_member: (b) => [`select public.reactivate_member($1, $2)`, [b, uuid()]],
    remove_member: (b, m) => [`select public.remove_member($1, $2)`, [b, m]],
    create_invite: (b) => [`select * from public.create_invite($1, 'client')`, [b]],
    revoke_invite: (b) => [`select public.revoke_invite($1, $2)`, [b, uuid()]],
    create_client: (b) => [`select * from public.create_client($1, 'Aal Test')`, [b]],
    reactivate_client: (b) => [`select public.reactivate_client($1, $2)`, [b, uuid()]],
    set_client_status: (b) => [`select public.set_client_status($1, $2, 'blocked')`, [b, uuid()]],
    set_calendar_day: (b) => [`select public.set_calendar_day($1, $2::date, true)`, [b, D]],
    set_service_day_override: (b) => [`select public.set_service_day_override($1, $2, $3::date, false)`, [b, uuid(), D]],
    set_pool_day_override: (b) => [`select public.set_pool_day_override($1, $2, $3::date, 1)`, [b, uuid(), D]],
    set_window_day_override: (b) => [`select public.set_window_day_override($1, $2, $3::date, false)`, [b, uuid(), D]],
    reset_day_override: (b) => [`select public.reset_day_override($1, 'service', $2, $3::date)`, [b, uuid(), D]],
    set_business_theme: (b) => [`select public.set_business_theme($1, 'brandy_blue', 'dark')`, [b]],
  }

  it('the classification is EXHAUSTIVE: every require_role-admin caller in the catalog is listed', async () => {
    const admin = await connect()
    const rows = await admin.query(
      `select p.proname
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.prosrc like '%require_role(%''admin''%'
       order by p.proname`,
    )
    expect(rows.rows.map((r) => r.proname).sort()).toEqual(Object.keys(ADMIN_OPS).sort())
    await admin.end()
  })

  it('ALL 14 admin ops refuse AAL1 with MFA_REQUIRED (and AAL2 clears the gate)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const member = await addMember(biz, 'staff')
    await asUser(biz.owner.sub, async (c) => {
      for (const [name, make] of Object.entries(ADMIN_OPS)) {
        const [sql, args] = make(biz.businessId, member.membershipId)
        await expectError(c.query(sql, args), /MFA_REQUIRED/).catch((e) => {
          throw new Error(`${name}: ${e.message}`)
        })
      }
    }, { aal: 'aal1' })
    // AAL2 clears the MFA gate for every one of them: the op proceeds past
    // it (either succeeding or failing LATER on the dummy target — never
    // with MFA_REQUIRED).
    await asUser(biz.owner.sub, async (c) => {
      for (const [name, make] of Object.entries(ADMIN_OPS)) {
        const [sql, args] = make(biz.businessId, member.membershipId)
        try {
          await c.query(sql, args)
        } catch (e) {
          if (/MFA_REQUIRED/.test(String(e))) throw new Error(`${name} still MFA-gated at aal2`)
        }
      }
    })
  })

  it('a missing aal claim is AAL1 (fail closed) for every admin op', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const member = await addMember(biz, 'staff')
    const conn = await connect()
    try {
      await conn.query(`select set_config('request.jwt.claims', $1, false)`, [
        JSON.stringify({ sub: biz.owner.sub, iss: 'https://test.local/auth/v1', role: 'authenticated' }),
      ])
      await conn.query('set role authenticated')
      for (const [name, make] of Object.entries(ADMIN_OPS)) {
        const [sql, args] = make(biz.businessId, member.membershipId)
        await expectError(conn.query(sql, args), /MFA_REQUIRED/).catch((e) => {
          throw new Error(`${name}: ${e.message}`)
        })
      }
    } finally {
      await conn.end()
    }
  })

  it('self-removal stays staff-level and AAL1-reachable (leaving is not privileged)', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const member = await addMember(biz, 'staff')
    await asUser(member.sub, async (c) => {
      await c.query(`select public.remove_member($1, $2)`, [biz.businessId, member.membershipId])
    }, { aal: 'aal1' })
    const admin = await connect()
    const r = await admin.query(`select status from public.business_memberships where id = $1`, [member.membershipId])
    expect(r.rows[0].status).toBe('removed')
    await admin.end()
  })

  it('REAL service_role exemption: machine JWT (no aal) passes; forged metadata does not', async () => {
    const biz = await newBusiness()
    // Genuine machine identity: pg role + JWT role service_role, aal absent.
    const svc = await connect()
    try {
      await svc.query(`select set_config('request.jwt.claims', $1, false)`, [
        JSON.stringify({ sub: biz.owner.sub, iss: 'https://test.local/auth/v1', role: 'service_role' }),
      ])
      await svc.query('set role service_role')
      await svc.query(`select public.set_business_theme($1, 'brandy_blue', 'light')`, [biz.businessId])
    } finally {
      await svc.end()
    }
    // An AUTHENTICATED session cannot buy the exemption with metadata: the
    // top-level role claim is what GoTrue signs, and it says authenticated.
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(`select public.set_business_theme($1, 'brandy_blue', 'light')`, [biz.businessId]),
        /MFA_REQUIRED/,
      )
    }, { aal: 'aal1', user_metadata: { role: 'service_role' }, app_metadata: { role: 'service_role' } })
  })
})

describe('AAL2 enforcement — direct RLS paths (has_role admin+, catalog-backed)', () => {
  it('the admin-gated policy catalog is fully classified', async () => {
    // Every policy whose guard uses has_role(..., 'admin') — a new one must
    // be added here (and covered below) or this fails.
    const EXPECTED_POLICY_TABLES = [
      'audit_events', // admin-only audit reads
      'availability_conflict_groups', 'business_invite_codes', 'business_memberships',
      'business_service_zones', 'business_services', 'businesses', 'capacity_groups',
      'service_member_capacity_defaults', 'service_window_assignment_zones',
      'service_window_assignments', 'service_window_zones', 'service_windows', 'service_zones',
    ]
    const admin = await connect()
    const rows = await admin.query(
      `select distinct tablename
       from pg_policies
       where schemaname = 'public'
         and (coalesce(qual, '') like '%has_role%''admin''%'
           or coalesce(with_check, '') like '%has_role%''admin''%')
       order by tablename`,
    )
    expect(rows.rows.map((r) => r.tablename as string).sort()).toEqual([...EXPECTED_POLICY_TABLES].sort())
    await admin.end()
  })

  it('has_role itself: admin rank fails closed below AAL2; staff rank unaffected', async () => {
    const biz = await newBusiness()
    await asUser(biz.owner.sub, async (c) => {
      const r = await c.query(
        `select app.has_role($1, 'admin') as adm, app.has_role($1, 'staff') as stf`,
        [biz.businessId],
      )
      expect(r.rows[0]).toEqual({ adm: false, stf: true }) // owner, but AAL1
    }, { aal: 'aal1' })
    await asUser(biz.owner.sub, async (c) => {
      const r = await c.query(`select app.has_role($1, 'admin') as adm`, [biz.businessId])
      expect(r.rows[0].adm).toBe(true)
    })
  })

  it('direct PostgREST verbs at AAL1: UPDATE, INSERT, DELETE, and admin SELECTs are all closed', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const staff = await addMember(biz, 'staff')
    // Seed: an invite (admin-read surface) and a capacity group (I/U/D surface).
    await asUser(biz.owner.sub, async (c) => {
      await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId])
      await c.query(
        `insert into public.capacity_groups (business_id, name, resource_unit, pool_limit) values ($1, 'AAL probe', 'dog', 3)`,
        [biz.businessId],
      )
    })

    await asUser(biz.owner.sub, async (c) => {
      // UPDATE: businesses.name (the exact Codex repro) — RLS filters the row.
      const upd = await c.query(`update public.businesses set name = 'Hijacked' where id = $1`, [biz.businessId])
      expect(upd.rowCount).toBe(0)
      // INSERT: capacity table (the exact Codex repro) — with_check refuses.
      await expectError(
        c.query(`insert into public.capacity_groups (business_id, name, resource_unit, pool_limit) values ($1, 'Sneaky', 'dog', 2)`, [biz.businessId]),
        /row-level security/,
      )
      // UPDATE + DELETE on the existing capacity row: invisible to aal1.
      const cupd = await c.query(`update public.capacity_groups set name = 'x' where business_id = $1`, [biz.businessId])
      expect(cupd.rowCount).toBe(0)
      const cdel = await c.query(`delete from public.capacity_groups where business_id = $1`, [biz.businessId])
      expect(cdel.rowCount).toBe(0)
      // Admin-only SELECT surfaces: invites, audit, PEER membership rows.
      const inv = await c.query(`select * from public.business_invite_codes where business_id = $1`, [biz.businessId])
      expect(inv.rowCount).toBe(0)
      const aud = await c.query(`select * from public.audit_events where business_id = $1`, [biz.businessId])
      expect(aud.rowCount).toBe(0)
      const peers = await c.query(`select * from public.business_memberships where business_id = $1`, [biz.businessId])
      expect(peers.rowCount).toBe(1) // OWN row only (memberships_select_own) — enrollment flow keeps working
      // Member-level reads stay open at AAL1 (the enrollment flow's needs).
      const ownBiz = await c.query(`select name from public.businesses where id = $1`, [biz.businessId])
      expect(ownBiz.rowCount).toBe(1)
    }, { aal: 'aal1' })

    // The SAME session shape at AAL2: everything opens up again.
    await asUser(biz.owner.sub, async (c) => {
      const upd = await c.query(`update public.businesses set name = 'Still Mine' where id = $1`, [biz.businessId])
      expect(upd.rowCount).toBe(1)
      // client invite from the seed + the staff invite addMember minted
      const inv = await c.query(`select * from public.business_invite_codes where business_id = $1`, [biz.businessId])
      expect(inv.rowCount).toBe(2)
      const aud = await c.query(`select count(*) as n from public.audit_events where business_id = $1`, [biz.businessId])
      expect(Number(aud.rows[0].n)).toBeGreaterThan(0)
      const peers = await c.query(`select * from public.business_memberships where business_id = $1`, [biz.businessId])
      expect(peers.rowCount).toBe(2) // own + staff peer
      const cdel = await c.query(`delete from public.capacity_groups where business_id = $1 and name = 'AAL probe'`, [biz.businessId])
      expect(cdel.rowCount).toBe(1)
    })
    void staff
  })
})

describe('identity audit provenance (sync_identity_audit)', () => {
  async function seedGotrue(sub: string, providers: string[], totpVerified = false) {
    const admin = await connect()
    await admin.query(`delete from auth.mfa_factors where user_id = $1`, [sub])
    await admin.query(`delete from auth.identities where user_id = $1`, [sub])
    for (const p of providers) {
      await admin.query(`insert into auth.identities (user_id, provider) values ($1, $2)`, [sub, p])
    }
    if (totpVerified) {
      await admin.query(
        `insert into auth.mfa_factors (user_id, factor_type, status) values ($1, 'totp', 'verified')`,
        [sub],
      )
    }
    await admin.end()
  }
  const auditRows = async (accountId: string) => {
    const admin = await connect()
    const r = await admin.query(
      `select action, coalesce(after ->> 'provider', before ->> 'provider') as provider, business_id
       from public.audit_events where actor_account_id = $1 and action like 'identity.%'
       order by created_at, action`,
      [accountId],
    )
    await admin.end()
    return r.rows
  }

  it('audits only REAL auth-layer deltas; idempotent between changes', async () => {
    const person = await newAccount()
    await seedGotrue(person.sub, ['email'])
    await asUser(person.sub, async (c) => {
      const first = await c.query(`select public.sync_identity_audit() as ev`)
      expect(first.rows[0].ev).toEqual([{ action: 'identity.link', provider: 'email' }])
      const again = await c.query(`select public.sync_identity_audit() as ev`)
      expect(again.rows[0].ev).toEqual([]) // no delta, no rows
    })
    await seedGotrue(person.sub, ['email', 'google'], true)
    await asUser(person.sub, (c) => c.query(`select public.sync_identity_audit()`))
    await seedGotrue(person.sub, ['google'], true) // email unlinked upstream
    await asUser(person.sub, (c) => c.query(`select public.sync_identity_audit()`))
    const rows = await auditRows(person.accountId)
    expect(rows.map((r) => [r.action, r.provider])).toEqual([
      ['identity.link', 'email'],
      ['identity.link', 'google'],
      ['identity.mfa_enroll', 'totp'],
      ['identity.unlink', 'email'],
    ])
    for (const row of rows) expect(row.business_id).toBeNull() // account-scoped
  })

  it('nothing to spoof: the parameterized logger is GONE and state tables are sealed', async () => {
    const person = await newAccount()
    await asUser(person.sub, async (c) => {
      // The old spoofable entry point no longer exists at all.
      await expectError(
        c.query(`select public.log_identity_event('identity.link', 'google')`),
        /does not exist/,
      )
      // With NO real GoTrue state, sync fabricates nothing.
      const r = await c.query(`select public.sync_identity_audit() as ev`)
      expect(r.rows[0].ev).toEqual([])
      // Snapshot table and account-scoped audit rows are API-invisible.
      await expectError(c.query(`select * from public.account_auth_state`), /permission denied/)
      const aud = await c.query(`select * from public.audit_events where business_id is null`)
      expect(aud.rowCount).toBe(0)
    })
    expect(await auditRows(person.accountId)).toEqual([])
  })

  it('CONCURRENCY: parallel syncs of one delta emit exactly ONE audit row', async () => {
    const person = await newAccount()
    await seedGotrue(person.sub, ['email'])
    const conns = await Promise.all(Array.from({ length: 4 }, () => connect()))
    try {
      for (const c of conns) await become(c, 'authenticated', { sub: person.sub })
      await Promise.all(conns.map((c) => c.query(`select public.sync_identity_audit()`)))
    } finally {
      for (const c of conns) await c.end().catch(() => {})
    }
    const rows = await auditRows(person.accountId)
    expect(rows.map((r) => [r.action, r.provider])).toEqual([['identity.link', 'email']])
  })
})

describe('identity binding invariant (A2.3 — PRODUCT RULING: bind on verified email)', () => {
  it('this layer never merges by email: distinct subjects stay distinct accounts', async () => {
    // Binding happens UPSTREAM: the auth layer links provider-verified
    // same-email identities to ONE auth user — one subject — which lands in
    // ONE account here mechanically. What must NEVER happen at this layer is
    // an email-based merge of DISTINCT subjects (that would let an
    // unverified email capture someone else's account).
    const shared = `bind-${uuid()}@example.com`
    const a = await newAccount()
    const b = await newAccount()
    const admin = await connect()
    await admin.query(
      `update public.base509_accounts set primary_email = $1 where base509_account_id = any($2::uuid[])`,
      [shared, [a.accountId, b.accountId]],
    )
    await admin.end()

    const aResolved = await asUser(a.sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id)
    const bResolved = await asUser(b.sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id)
    expect(aResolved).toBe(a.accountId)
    expect(bResolved).toBe(b.accountId)
    expect(aResolved).not.toBe(bResolved)

    const bizName = `Bind ${uuid().slice(0, 8)}`
    await asUser(a.sub, (c) => c.query(`select public.create_business($1, $2)`, [bizName, uuid()]))
    await asUser(b.sub, async (c) => {
      const r = await c.query(`select * from public.businesses where name = $1`, [bizName])
      expect(r.rowCount).toBe(0)
    })
  })

  it('one subject with several provider identities is ONE account (the bound shape)', async () => {
    // The post-binding shape: one auth user carrying email+google identities.
    const person = await newAccount()
    const admin = await connect()
    await admin.query(`insert into auth.identities (user_id, provider) values ($1, 'email'), ($1, 'google')`, [person.sub])
    await admin.end()
    // Same subject keeps resolving to the same account regardless of which
    // provider produced the session.
    const resolved = await asUser(person.sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id)
    expect(resolved).toBe(person.accountId)
    const accounts = await connect()
    const n = await accounts.query(
      `select count(*) as n from public.auth_identities where base509_account_id = $1`,
      [person.accountId],
    )
    expect(Number(n.rows[0].n)).toBe(1) // one (issuer, subject) mapping row
    await accounts.end()
  })
})
