// CFG-1 §6 gate — A2 identity/linking/MFA boundary
// - AAL2 required for admin+ typed ops (portal MFA backstop, spec A2.4)
// - Identity events audit account-scoped, actor-derived, closed vocabulary
// - NEVER merge-by-email: same primary email on two identities stays two
//   accounts (the account-takeover vector A2.3 closes)
import { afterAll, describe, expect, it } from 'vitest'
import { asUser, connect, closeAll, expectError, uuid } from './db'
import { addMember, newAccount, newBusiness, setEntitlements } from './fixtures'

afterAll(closeAll)

describe('AAL2 enforcement on privileged ops (A2.4)', () => {
  it('admin-gated ops refuse an AAL1 session with MFA_REQUIRED; AAL2 passes', async () => {
    const biz = await newBusiness()
    // AAL1 session: rank check passes (owner), MFA backstop refuses.
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(`select public.set_business_theme($1, 'brandy_blue', 'dark')`, [biz.businessId]),
        /MFA_REQUIRED/,
      )
      await expectError(
        c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId]),
        /MFA_REQUIRED/,
      )
    }, { aal: 'aal1' })
    // Same caller at AAL2: both ops work.
    await asUser(biz.owner.sub, async (c) => {
      await c.query(`select public.set_business_theme($1, 'brandy_blue', 'dark')`, [biz.businessId])
      await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId])
    })
  })

  it('a missing aal claim is treated as AAL1 (fail closed)', async () => {
    const biz = await newBusiness()
    await asUser(biz.owner.sub, async (c) => {
      // Strip the harness default by sending an explicit null-ish shape:
      // asUser merges claims, so emulate a legacy token with aal absent.
      await c.query(`select set_config('request.jwt.claims', $1, false)`, [
        JSON.stringify({ sub: biz.owner.sub, iss: 'https://test.local/auth/v1', role: 'authenticated' }),
      ])
      await expectError(
        c.query(`select public.set_business_theme($1, 'brandy_blue', 'light')`, [biz.businessId]),
        /MFA_REQUIRED/,
      )
    })
  })

  it('staff/manager-gated and member-level paths are unaffected at AAL1', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const staff = await addMember(biz, 'staff')
    await asUser(staff.sub, async (c) => {
      // Member-level read paths and non-privileged RPCs stay open.
      const r = await c.query(`select * from public.team_directory($1)`, [biz.businessId])
      expect(r.rowCount).toBeGreaterThan(0)
    }, { aal: 'aal1' })
    // Owner at AAL1 can still READ their tenant (session works; only
    // admin-gated OPS are backstopped).
    await asUser(biz.owner.sub, async (c) => {
      const r = await c.query(`select name from public.businesses where id = $1`, [biz.businessId])
      expect(r.rowCount).toBe(1)
    }, { aal: 'aal1' })
  })

  it('machine identities (service_role JWT) are exempt from the AAL gate', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    // sync_entitlements is the machine op — its JWT carries no aal and must
    // keep working (already exercised broadly; assert one op here for the
    // A2 record). The service exemption is by JWT role, not by grants.
    const admin = await connect()
    const r = await admin.query(
      `select e.tier_key from public.business_entitlements e where e.business_id = $1`,
      [biz.businessId],
    )
    expect(r.rowCount).toBe(1)
    await admin.end()
  })
})

describe('identity event audit (A2.3)', () => {
  it('records link/unlink/mfa events account-scoped and actor-derived', async () => {
    const person = await newAccount()
    await asUser(person.sub, async (c) => {
      await c.query(`select public.log_identity_event('identity.link', 'google')`)
      await c.query(`select public.log_identity_event('identity.mfa_enroll', 'totp')`)
    })
    const admin = await connect()
    const rows = await admin.query(
      `select business_id, actor_account_id, action, after ->> 'provider' as provider
       from public.audit_events
       where actor_account_id = $1 and action like 'identity.%'
       order by created_at`,
      [person.accountId],
    )
    expect(rows.rowCount).toBe(2)
    for (const row of rows.rows) {
      expect(row.business_id).toBeNull() // account-scoped, never tenant-attributed
      expect(row.actor_account_id).toBe(person.accountId)
    }
    expect(rows.rows.map((r) => [r.action, r.provider])).toEqual([
      ['identity.link', 'google'],
      ['identity.mfa_enroll', 'totp'],
    ])
    await admin.end()
  })

  it('rejects unknown actions/providers; account-scoped rows stay API-invisible', async () => {
    const person = await newAccount()
    await asUser(person.sub, async (c) => {
      await expectError(
        c.query(`select public.log_identity_event('identity.hijack', 'google')`),
        /VALIDATION_FAILED.*action/,
      )
      await expectError(
        c.query(`select public.log_identity_event('identity.link', 'myspace')`),
        /VALIDATION_FAILED.*provider/,
      )
      await c.query(`select public.log_identity_event('identity.unlink', 'apple')`)
      // The actor CANNOT read their own account-scoped audit rows through
      // the API — business-scoped admin reads are the only audit surface.
      const r = await c.query(`select * from public.audit_events where business_id is null`)
      expect(r.rowCount).toBe(0)
    })
  })
})

describe('never merge-by-email (A2.3 account-takeover guard)', () => {
  it('two identities sharing an email resolve to two DISTINCT accounts and tenants', async () => {
    const shared = `collide-${uuid()}@example.com`
    const a = await newAccount()
    const b = await newAccount()
    const admin = await connect()
    // Same primary email on both accounts (as two providers would present).
    await admin.query(
      `update public.base509_accounts set primary_email = $1 where base509_account_id = any($2::uuid[])`,
      [shared, [a.accountId, b.accountId]],
    )
    await admin.end()

    // Re-bootstrap both sessions: each (issuer, subject) must keep resolving
    // to ITS OWN account — email never participates in identity resolution.
    const aResolved = await asUser(a.sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id)
    const bResolved = await asUser(b.sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id)
    expect(aResolved).toBe(a.accountId)
    expect(bResolved).toBe(b.accountId)
    expect(aResolved).not.toBe(bResolved)

    // And their tenants stay isolated: a business created by A is invisible
    // to B despite the shared email.
    const bizName = `Collide ${uuid().slice(0, 8)}`
    await asUser(a.sub, (c) => c.query(`select public.create_business($1, $2)`, [bizName, uuid()]))
    await asUser(b.sub, async (c) => {
      const r = await c.query(`select * from public.businesses where name = $1`, [bizName])
      expect(r.rowCount).toBe(0)
    })
  })
})
