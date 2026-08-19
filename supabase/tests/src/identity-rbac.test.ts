// CFG-1 §6 gate — Identity / RBAC
// - Concurrent first-login bootstrap creates exactly one account
// - Email collision never merges accounts
// - D-003 races cannot create dual relationships
// - Last Owner cannot be removed/demoted
// - Grant ceilings (Admin ≠ Admin/Owner granter; Manager/Staff cannot invite)
// - RBAC matrix per user_roles_and_permissions.md
import { afterAll, describe, expect, it } from 'vitest'
import { asUser, closeAll, connect, expectError, race, uuid } from './db'
import {
  addClient,
  addMember,
  createService,
  newAccount,
  newBusiness,
  setEntitlements,
} from './fixtures'

afterAll(closeAll)

describe('identity bootstrap (spec §2.1)', () => {
  it('concurrent first-login creates exactly one durable account', async () => {
    const sub = uuid()
    const { ok, errors } = await race(
      Array.from({ length: 8 }, () => async (c: any) => {
        const r = await c.query('select public.bootstrap_account() as id')
        return r.rows[0].id
      }),
      { sub },
    )
    expect(errors).toEqual([])
    expect(ok).toBe(8)

    const admin = await connect()
    const r = await admin.query(
      `select count(distinct ai.base509_account_id) as n
       from public.auth_identities ai where ai.provider_subject = $1`,
      [sub],
    )
    expect(Number(r.rows[0].n)).toBe(1)
    await admin.end()
  })

  it('bootstrap is idempotent and returns the same id', async () => {
    const sub = uuid()
    const first = await asUser(sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id,
    )
    const second = await asUser(sub, async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id,
    )
    expect(second).toBe(first)
  })

  it('email collision never merges accounts', async () => {
    const email = `${uuid()}@example.com`
    const a = await asUser(uuid(), async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id,
    { email })
    const b = await asUser(uuid(), async (c) =>
      (await c.query('select public.bootstrap_account() as id')).rows[0].id,
    { email })
    expect(a).not.toBe(b)
  })

  it('rejects an untrusted issuer', async () => {
    const c = await connect()
    await c.query(`select set_config('request.jwt.claims', $1, false)`, [
      JSON.stringify({ sub: uuid(), iss: 'https://evil.example.com/auth/v1', role: 'authenticated' }),
    ])
    await c.query('set role authenticated')
    await expectError(c.query('select public.bootstrap_account()'), /ISSUER_NOT_TRUSTED/)
    await c.end()
  })

  it('denies direct writes to both identity tables (spec §2.1)', async () => {
    const me = await newAccount()
    await asUser(me.sub, async (c) => {
      await expectError(
        c.query(`insert into public.base509_accounts default values`),
        /permission denied/,
      )
      await expectError(
        c.query(
          `insert into public.auth_identities (base509_account_id, issuer, provider_subject)
           values ($1, 'https://test.local/auth/v1', $2)`,
          [me.accountId, uuid()],
        ),
        /permission denied/,
      )
      await expectError(
        c.query(`delete from public.auth_identities where base509_account_id = $1`, [
          me.accountId,
        ]),
        /permission denied/,
      )
    })
  })

  it('prohibits global reads of base509_accounts (own row only)', async () => {
    const a = await newAccount()
    await newAccount() // someone else
    await asUser(a.sub, async (c) => {
      const r = await c.query('select base509_account_id from public.base509_accounts')
      expect(r.rowCount).toBe(1)
      expect(r.rows[0].base509_account_id).toBe(a.accountId)
    })
  })
})

describe('D-003: no dual relationship on one business', () => {
  it('member cannot redeem a client invite; client cannot redeem a staff invite', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)

    const clientToken = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId]))
        .rows[0].token,
    )
    // The owner is a member → client redemption must fail.
    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [clientToken]),
        /DUAL_RELATIONSHIP/,
      )
    })

    const client = await addClient(biz)
    const staffToken = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'staff', 'staff')`, [
        biz.businessId,
      ])).rows[0].token,
    )
    await asUser(client.sub, async (c) => {
      await expectError(
        c.query('select * from public.redeem_invite($1)', [staffToken]),
        /DUAL_RELATIONSHIP/,
      )
    })
  })

  it('a same-business client/member race cannot violate D-003', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const person = await newAccount()

    const staffToken = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'staff', 'staff')`, [
        biz.businessId,
      ])).rows[0].token,
    )
    const clientToken = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId]))
        .rows[0].token,
    )

    // Same person redeems both invite types concurrently, several times.
    const runners = [
      ...Array.from({ length: 4 }, () => async (c: any) =>
        c.query('select * from public.redeem_invite($1)', [staffToken])),
      ...Array.from({ length: 4 }, () => async (c: any) =>
        c.query('select * from public.redeem_invite($1)', [clientToken])),
    ]
    await race(runners, { sub: person.sub })

    const admin = await connect()
    const m = await admin.query(
      `select count(*) as n from public.business_memberships
       where business_id = $1 and base509_account_id = $2 and status <> 'removed'`,
      [biz.businessId, person.accountId],
    )
    const cl = await admin.query(
      `select count(*) as n from public.clients
       where business_id = $1 and base509_account_id = $2 and status <> 'ended'`,
      [biz.businessId, person.accountId],
    )
    await admin.end()
    // At most one relationship, and never both kinds.
    expect(Number(m.rows[0].n) + Number(cl.rows[0].n)).toBeLessThanOrEqual(1)
  })
})

describe('last-Owner protection + grant ceilings', () => {
  it('the last Owner cannot be removed or demoted through any path', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)

    const ownerMembership = await asUser(biz.owner.sub, async (c) =>
      (await c.query(
        `select id from public.business_memberships
         where business_id = $1 and base509_account_id = $2`,
        [biz.businessId, biz.owner.accountId],
      )).rows[0].id,
    )

    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query('select public.remove_member($1, $2)', [biz.businessId, ownerMembership]),
        /LAST_OWNER/,
      )
      await expectError(
        c.query(`select public.change_membership_role($1, $2, 'admin')`, [
          biz.businessId,
          ownerMembership,
        ]),
        /GRANT_CEILING|LAST_OWNER/,
      )
    })

    // Even direct privileged DML hits the trigger.
    const admin = await connect()
    await expectError(
      admin.query(`update public.business_memberships set status = 'removed' where id = $1`, [
        ownerMembership,
      ]),
      /LAST_OWNER/,
    )
    await expectError(
      admin.query(`update public.business_memberships set role = 'staff' where id = $1`, [
        ownerMembership,
      ]),
      /LAST_OWNER/,
    )
    await expectError(
      admin.query(`delete from public.business_memberships where id = $1`, [ownerMembership]),
      /LAST_OWNER/,
    )
    await admin.end()
  })

  it('Owner is never grantable; Admin cannot grant Admin; Manager/Staff cannot invite', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const admin = await addMember(biz, 'admin')
    const manager = await addMember(biz, 'manager')
    const staff = await addMember(biz, 'staff')

    await asUser(biz.owner.sub, async (c) => {
      await expectError(
        c.query(`select * from public.create_invite($1, 'staff', 'owner')`, [biz.businessId]),
        /GRANT_CEILING|violates check/,
      )
      await expectError(
        c.query(`select public.change_membership_role($1, $2, 'owner')`, [
          biz.businessId,
          admin.membershipId,
        ]),
        /GRANT_CEILING/,
      )
    })

    await asUser(admin.sub, async (c) => {
      await expectError(
        c.query(`select * from public.create_invite($1, 'staff', 'admin')`, [biz.businessId]),
        /GRANT_CEILING/,
      )
      await expectError(
        c.query(`select public.change_membership_role($1, $2, 'admin')`, [
          biz.businessId,
          staff.membershipId,
        ]),
        /GRANT_CEILING/,
      )
      // Admin CAN grant manager/staff.
      await c.query(`select public.change_membership_role($1, $2, 'manager')`, [
        biz.businessId,
        staff.membershipId,
      ])
      await c.query(`select public.change_membership_role($1, $2, 'staff')`, [
        biz.businessId,
        staff.membershipId,
      ])
    })

    for (const who of [manager, staff]) {
      await asUser(who.sub, async (c) => {
        await expectError(
          c.query(`select * from public.create_invite($1, 'staff', 'staff')`, [biz.businessId]),
          /FORBIDDEN/,
        )
        await expectError(
          c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId]),
          /FORBIDDEN/,
        )
      })
    }
  })

  it('an Admin cannot manage a peer Admin', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const admin1 = await addMember(biz, 'admin')
    const admin2 = await addMember(biz, 'admin')
    await asUser(admin1.sub, async (c) => {
      await expectError(
        c.query('select public.remove_member($1, $2)', [biz.businessId, admin2.membershipId]),
        /GRANT_CEILING/,
      )
      await expectError(
        c.query(`select public.change_membership_role($1, $2, 'staff')`, [
          biz.businessId,
          admin2.membershipId,
        ]),
        /GRANT_CEILING/,
      )
    })
  })
})

describe('RBAC matrix (nested levels, roles doc)', () => {
  it('Manager runs ops (booking edits) but cannot touch config; Staff cannot edit bookings', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const manager = await addMember(biz, 'manager')
    const staff = await addMember(biz, 'staff')
    const client = await addClient(biz)
    const svc = await createService(biz)

    // Staff creates a booking (allowed: Ops "Add a booking").
    const bookingId = await asUser(staff.sub, async (c) =>
      (await c.query(
        `insert into public.bookings (business_id, client_id, business_service_id, start_date, end_date, created_by_account_id)
         values ($1, $2, $3, '2027-07-01', '2027-07-03', $4) returning id`,
        [biz.businessId, client.clientId, svc, staff.accountId],
      )).rows[0].id,
    )

    // Staff cannot edit or delete bookings.
    await asUser(staff.sub, async (c) => {
      const u = await c.query(
        `update public.bookings set start_date = '2027-07-02' where id = $1`,
        [bookingId],
      )
      expect(u.rowCount).toBe(0)
      await expectError(
        c.query(`delete from public.bookings where id = $1`, [bookingId]),
        /permission denied/,
      )
    })

    // Manager edits bookings (non-reserving states only).
    await asUser(manager.sub, async (c) => {
      const u = await c.query(
        `update public.bookings set start_date = '2027-07-02' where id = $1`,
        [bookingId],
      )
      expect(u.rowCount).toBe(1)
      // But cannot flip a booking into a reserving state (no approval op in CFG-1).
      await expectError(
        c.query(`update public.bookings set status = 'confirmed' where id = $1`, [bookingId]),
        /row-level security/,
      )
    })

    // Neither Manager nor Staff may change service config.
    for (const who of [manager, staff]) {
      await asUser(who.sub, async (c) => {
        const u = await c.query(
          `update public.business_services set name = 'nope' where id = $1`,
          [svc],
        )
        expect(u.rowCount).toBe(0)
        await expectError(
          c.query(
            `insert into public.service_zones (business_id, name, boundary) values ($1, 'nope-' || $2, $3)`,
            [biz.businessId, uuid(),
             '{"type":"Polygon","coordinates":[[[0,0],[0.01,0],[0.01,0.01],[0,0]]]}'],
          ),
          /row-level security/,
        )
        await expectError(
          c.query(`select public.set_calendar_day($1, '2027-07-04', true)`, [biz.businessId]),
          /FORBIDDEN/,
        )
      })
    }

    // Staff care-status mutation (distinct op) works on occurrences.
    const admin = await connect()
    const occ = await admin.query(
      `insert into public.booking_occurrences
         (business_id, booking_id, business_service_id, unit_kind, service_date)
       values ($1, $2, $3, 'night', '2027-07-02') returning id`,
      [biz.businessId, bookingId, svc],
    )
    await admin.end()
    await asUser(staff.sub, async (c) => {
      await c.query(`select public.set_occurrence_care_status($1, $2, 'checked_in')`, [
        biz.businessId,
        occ.rows[0].id,
      ])
    })

    // Clients cannot use the team directory; members can.
    await asUser(client.sub, async (c) => {
      await expectError(
        c.query('select * from public.team_directory($1)', [biz.businessId]),
        /FORBIDDEN/,
      )
    })
    await asUser(staff.sub, async (c) => {
      const r = await c.query('select * from public.team_directory($1)', [biz.businessId])
      expect(r.rowCount).toBeGreaterThanOrEqual(3)
    })
  })

  it('clients cannot read capacity config, assignments, demand, audit, or entitlements', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const client = await addClient(biz)
    await createService(biz)

    await asUser(client.sub, async (c) => {
      for (const t of [
        'business_services',
        'capacity_groups',
        'service_windows',
        'service_window_assignments',
        'service_member_capacity_defaults',
        'business_service_day_overrides',
        'audit_events',
        'business_entitlements',
        'business_invite_codes',
      ]) {
        const r = await c.query(`select * from public.${t} where business_id = $1`, [
          biz.businessId,
        ])
        expect(r.rowCount, `client can read ${t}`).toBe(0)
      }
      await expectError(
        c.query('select public.get_effective_entitlements($1)', [biz.businessId]),
        /FORBIDDEN/,
      )
    })
  })

  it('a client can manage own profile/pets but not other clients', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const c1 = await addClient(biz)
    const c2 = await addClient(biz)

    await asUser(c1.sub, async (c) => {
      await c.query(`update public.clients set display_name = 'Me' where id = $1`, [
        c1.clientId,
      ])
      const others = await c.query(`select * from public.clients where id = $1`, [c2.clientId])
      expect(others.rowCount).toBe(0)
      await c.query(
        `insert into public.pets (business_id, client_id, name) values ($1, $2, 'Fido')`,
        [biz.businessId, c1.clientId],
      )
      await expectError(
        c.query(
          `insert into public.pets (business_id, client_id, name) values ($1, $2, 'Evil')`,
          [biz.businessId, c2.clientId],
        ),
        /row-level security/,
      )
      // Lifecycle columns are op-only even for the row owner.
      await expectError(
        c.query(`update public.clients set status = 'active' where id = $1`, [c1.clientId]),
        /permission denied/,
      )
    })
  })
})
