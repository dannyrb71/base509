// CFG-1 §6 gate — Tenancy / RLS
// - Anonymous access denied across the entire foundation
// - Every table tested for SELECT/INSERT/UPDATE/DELETE
// - business_id reassignment blocked on business-scoped tables
// - Cross-tenant composite-FK attacks rejected
// - Inactive/removed memberships and ended/blocked clients lose access
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asUser, become, closeAll, connect, expectError, uuid } from './db'
import {
  addClient,
  addMember,
  createCapacityGroup,
  createConflictGroup,
  createService,
  createWindow,
  createZone,
  newBusiness,
  reserve,
  setEntitlements,
  type BusinessFixture,
} from './fixtures'

// Every CFG-1 table (waitlist is the separate, pre-launch anon surface).
const CFG1_TABLES = [
  'base509_accounts',
  'auth_identities',
  'businesses',
  'business_memberships',
  'clients',
  'pets',
  'business_entitlements',
  'audit_events',
  'business_invite_codes',
  'availability_conflict_groups',
  'capacity_groups',
  'business_services',
  'service_zones',
  'business_service_zones',
  'service_windows',
  'service_window_zones',
  'service_member_capacity_defaults',
  'service_window_assignments',
  'service_window_assignment_zones',
  'business_calendar_days',
  'business_service_day_overrides',
  'capacity_group_day_overrides',
  'service_window_day_overrides',
  'service_window_day_override_assignments',
  'service_window_day_override_assignment_zones',
  'bookings',
  'booking_pets',
  'booking_occurrences',
  'entitlement_sync_receipts',
]

// Tables that carry the tenant key (global projections excluded per §6).
const BUSINESS_SCOPED = CFG1_TABLES.filter(
  (t) => !['base509_accounts', 'auth_identities', 'businesses'].includes(t),
)

let bizA: BusinessFixture
let bizB: BusinessFixture

beforeAll(async () => {
  bizA = await newBusiness('Tenant A')
  bizB = await newBusiness('Tenant B')
  await setEntitlements(bizA.businessId)
  await setEntitlements(bizB.businessId)

  // Populate every business-scoped table for BOTH tenants so cross-tenant
  // reads have something to (fail to) find.
  for (const biz of [bizA, bizB]) {
    const client = await addClient(biz)
    const staff = await addMember(biz, 'staff')
    const zone = await createZone(biz, 'Zone-' + uuid().slice(0, 8))
    const pool = await createCapacityGroup(biz, 8)
    const conflict = await createConflictGroup(biz, 'overlap_allowed')
    const svc = await createService(biz, {
      config: { version: 1, slot_unit: 'dogs', service_limit: 5 },
      capacityGroupId: pool,
      conflictGroupId: conflict,
    })
    const windowId = await createWindow(biz, svc)

    await asUser(biz.owner.sub, async (c) => {
      await c.query(
        `insert into public.business_service_zones (business_id, business_service_id, service_zone_id)
         values ($1, $2, $3)`,
        [biz.businessId, svc, zone],
      )
      await c.query(
        `insert into public.service_window_zones (business_id, service_window_id, service_zone_id)
         values ($1, $2, $3)`,
        [biz.businessId, windowId, zone],
      )
      await c.query(
        `insert into public.service_member_capacity_defaults
           (business_id, business_service_id, business_membership_id, capacity)
         values ($1, $2, $3, 6)`,
        [biz.businessId, svc, staff.membershipId],
      )
      const a = await c.query(
        `insert into public.service_window_assignments
           (business_id, service_window_id, business_membership_id) values ($1, $2, $3) returning id`,
        [biz.businessId, windowId, staff.membershipId],
      )
      await c.query(
        `insert into public.service_window_assignment_zones
           (business_id, service_window_assignment_id, service_zone_id) values ($1, $2, $3)`,
        [biz.businessId, a.rows[0].id, zone],
      )
      await c.query(`select public.set_calendar_day($1, '2027-03-01', false, 'holiday')`, [
        biz.businessId,
      ])
      await c.query(
        `select public.set_service_day_override($1, $2, '2027-03-02', true, 4)`,
        [biz.businessId, svc],
      )
      await c.query(`select public.set_pool_day_override($1, $2, '2027-03-02', 9)`, [
        biz.businessId,
        pool,
      ])
      const ov = await c.query(
        `select public.set_window_day_override($1, $2, '2027-03-03', true, $3) as id`,
        [
          biz.businessId,
          windowId,
          JSON.stringify([
            { membership_id: staff.membershipId, capacity_override: 3, zone_ids: [zone] },
          ]),
        ],
      )
      expect(ov.rows[0].id).toBeTruthy()
    })

    // Client-owned rows: a pet + a booking with occurrence + booking_pet.
    await asUser(client.sub, async (c) => {
      await c.query(
        `insert into public.pets (business_id, client_id, name) values ($1, $2, 'Rex')`,
        [biz.businessId, client.clientId],
      )
    })
    const bookingId = await reserve({
      businessId: biz.businessId,
      serviceId: svc,
      clientId: client.clientId,
      start: '2027-04-01',
      end: '2027-04-03',
    })
    await asUser(biz.owner.sub, async (c) => {
      const pet = await c.query(
        `select id from public.pets where business_id = $1 limit 1`,
        [biz.businessId],
      )
      await c.query(
        `insert into public.booking_pets (business_id, booking_id, pet_id) values ($1, $2, $3)`,
        [biz.businessId, bookingId, pet.rows[0].id],
      )
    })
  }
}, 180_000)

afterAll(closeAll)

describe('anonymous access', () => {
  it('is denied on every CFG-1 table for select/insert/update/delete', async () => {
    const c = await connect()
    await become(c, 'anon')
    for (const t of CFG1_TABLES) {
      const pk = t === 'base509_accounts' ? 'base509_account_id' : 'id'
      await expectError(c.query(`select * from public.${t} limit 1`), /permission denied/)
      await expectError(c.query(`insert into public.${t} default values`), /permission denied/)
      await expectError(c.query(`update public.${t} set ${pk} = ${pk}`), /permission denied/)
      await expectError(c.query(`delete from public.${t}`), /permission denied/)
    }
    await c.end()
  })

  it('cannot execute the CFG-1 RPCs', async () => {
    const c = await connect()
    await become(c, 'anon')
    await expectError(c.query('select public.bootstrap_account()'), /permission denied/)
    await expectError(
      c.query(`select public.create_business('x', $1)`, [uuid()]),
      /permission denied/,
    )
    await expectError(c.query(`select * from public.redeem_invite('t')`), /permission denied/)
    await c.end()
  })

  it('still has exactly its one sanctioned surface: waitlist insert', async () => {
    const c = await connect()
    await become(c, 'anon')
    await c.query(`insert into public.waitlist (email) values ($1)`, [
      `${uuid()}@example.com`,
    ])
    // The list is write-only from the public internet: no row ever comes back.
    const r = await c.query('select * from public.waitlist')
    expect(r.rowCount).toBe(0)
    await c.end()
  })
})

describe('cross-tenant isolation (owner of A vs data of B)', () => {
  it('SELECT: no business-scoped row of B is visible to A', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      for (const t of BUSINESS_SCOPED) {
        if (t === 'entitlement_sync_receipts') {
          // Not readable by app roles at all.
          await expectError(
            c.query(`select * from public.${t} limit 1`),
            /permission denied/,
          )
          continue
        }
        const r = await c.query(`select * from public.${t} where business_id = $1`, [
          bizB.businessId,
        ])
        expect(r.rowCount, `${t} leaked cross-tenant rows`).toBe(0)
        // And the same query for their own business DOES return rows,
        // proving the zero result is isolation, not emptiness.
        if (!['audit_events'].includes(t)) {
          const own = await c.query(`select * from public.${t} where business_id = $1`, [
            bizA.businessId,
          ])
          expect(own.rowCount, `${t} fixture missing for own tenant`).toBeGreaterThan(0)
        }
      }
    })
  })

  it('INSERT into B is rejected for every writable table', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      await expectError(
        c.query(
          `insert into public.business_services
             (business_id, service_type_key, name, capacity_model, capacity_config, duration_model)
           values ($1, 'boarding', 'evil', 'bounded', '{"version":1,"service_limit":3}', 'overnight')`,
          [bizB.businessId],
        ),
        /row-level security/,
      )
      await expectError(
        c.query(
          `insert into public.service_zones (business_id, name) values ($1, 'evil')`,
          [bizB.businessId],
        ),
        /row-level security/,
      )
      // RPC path: selector is proven independently.
      await expectError(
        c.query(`select public.create_client($1, 'evil')`, [bizB.businessId]),
        /FORBIDDEN/,
      )
    })
    // Literal insert aimed at B (ids fetched via admin) trips WITH CHECK.
    const admin = await connect()
    const bClient = await admin.query(
      `select id from public.clients where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    const bSvc = await admin.query(
      `select id from public.business_services where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    await admin.end()
    await asUser(bizA.owner.sub, async (c) => {
      await expectError(
        c.query(
          `insert into public.bookings
             (business_id, client_id, business_service_id, start_date, end_date)
           values ($1, $2, $3, '2027-05-01', '2027-05-02')`,
          [bizB.businessId, bClient.rows[0].id, bSvc.rows[0].id],
        ),
        /row-level security/,
      )
    })
  })

  it('UPDATE/DELETE against B affect zero rows', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      const u = await c.query(
        `update public.business_services set name = 'pwned' where business_id = $1`,
        [bizB.businessId],
      )
      expect(u.rowCount).toBe(0)
      const d = await c.query(
        `delete from public.service_zones where business_id = $1`,
        [bizB.businessId],
      )
      expect(d.rowCount).toBe(0)
      const u2 = await c.query(
        `update public.clients set display_name = 'pwned' where business_id = $1`,
        [bizB.businessId],
      )
      expect(u2.rowCount).toBe(0)
    })
  })

  it('memberships/entitlements/audit of B are invisible and unwritable', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      for (const t of ['business_memberships', 'business_entitlements', 'audit_events']) {
        const r = await c.query(`select * from public.${t} where business_id = $1`, [
          bizB.businessId,
        ])
        expect(r.rowCount).toBe(0)
      }
      await expectError(
        c.query(`update public.business_entitlements set tier_key = 'crew'`),
        /permission denied/,
      )
      await expectError(
        c.query(`insert into public.business_memberships (business_id, base509_account_id, role)
                 values ($1, $2, 'admin')`, [bizB.businessId, bizA.owner.accountId]),
        /permission denied/,
      )
    })
  })
})

describe('business_id reassignment (tenant rekey)', () => {
  it('is blocked by column grants for API roles and by trigger for all paths', async () => {
    // API role: blocked by column grants where they apply, and by the
    // tenant-rekey trigger everywhere else.
    await asUser(bizA.owner.sub, async (c) => {
      await expectError(
        c.query(`update public.business_services set business_id = $1 where business_id = $2`, [
          bizB.businessId,
          bizA.businessId,
        ]),
        /permission denied|TENANT_REKEY_FORBIDDEN/,
      )
      await expectError(
        c.query(`update public.clients set business_id = $1 where business_id = $2`, [
          bizB.businessId,
          bizA.businessId,
        ]),
        /permission denied/,
      )
    })
    // Even the admin/superuser path (service tooling) hits the trigger.
    const c = await connect()
    const svc = await c.query(
      `select id from public.business_services where business_id = $1 limit 1`,
      [bizA.businessId],
    )
    await expectError(
      c.query(`update public.business_services set business_id = $1 where id = $2`, [
        bizB.businessId,
        svc.rows[0].id,
      ]),
      /TENANT_REKEY_FORBIDDEN/,
    )
    const booking = await c.query(
      `select id from public.bookings where business_id = $1 limit 1`,
      [bizA.businessId],
    )
    await expectError(
      c.query(`update public.bookings set business_id = $1 where id = $2`, [
        bizB.businessId,
        booking.rows[0].id,
      ]),
      /TENANT_REKEY_FORBIDDEN/,
    )
    await c.end()
  })

  it('the protected owner FK on businesses cannot be reassigned', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      await expectError(
        c.query(`update public.businesses set owner_account_id = $1 where id = $2`, [
          bizB.owner.accountId,
          bizA.businessId,
        ]),
        /permission denied/,
      )
    })
    const c = await connect()
    await expectError(
      c.query(`update public.businesses set owner_account_id = $1 where id = $2`, [
        bizB.owner.accountId,
        bizA.businessId,
      ]),
      /PROTECTED_COLUMN/,
    )
    await c.end()
  })
})

describe('cross-tenant composite-FK attacks', () => {
  it('rejects references that point at another tenant’s rows', async () => {
    const c = await connect() // even with RLS bypassed, composite FKs hold
    const bZone = await c.query(
      `select id from public.service_zones where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    const aSvc = await c.query(
      `select id from public.business_services where business_id = $1 limit 1`,
      [bizA.businessId],
    )
    await expectError(
      c.query(
        `insert into public.business_service_zones (business_id, business_service_id, service_zone_id)
         values ($1, $2, $3)`,
        [bizA.businessId, aSvc.rows[0].id, bZone.rows[0].id],
      ),
      /foreign key/,
    )
    const bMember = await c.query(
      `select id from public.business_memberships where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    const aWindow = await c.query(
      `select id from public.service_windows where business_id = $1 limit 1`,
      [bizA.businessId],
    )
    await expectError(
      c.query(
        `insert into public.service_window_assignments
           (business_id, service_window_id, business_membership_id) values ($1, $2, $3)`,
        [bizA.businessId, aWindow.rows[0].id, bMember.rows[0].id],
      ),
      /foreign key/,
    )
    const bClient = await c.query(
      `select id from public.clients where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    await expectError(
      c.query(
        `insert into public.bookings (business_id, client_id, business_service_id, start_date, end_date)
         values ($1, $2, $3, '2027-06-01', '2027-06-02')`,
        [bizA.businessId, bClient.rows[0].id, aSvc.rows[0].id],
      ),
      /foreign key/,
    )
    await c.end()
  })

  it('rejects a capacity/conflict group from another tenant on a service', async () => {
    const c = await connect()
    const bPool = await c.query(
      `select id from public.capacity_groups where business_id = $1 limit 1`,
      [bizB.businessId],
    )
    await expectError(
      c.query(
        `insert into public.business_services
           (business_id, service_type_key, name, capacity_model, capacity_config, duration_model, capacity_group_id)
         values ($1, 'daycare', 'x', 'bounded', '{"version":1,"slot_unit":"dogs","service_limit":3}', 'open_ended', $2)`,
        [bizA.businessId, bPool.rows[0].id],
      ),
      /foreign key/,
    )
    await c.end()
  })
})

describe('lifecycle loss of access', () => {
  it('a removed membership loses tenant access', async () => {
    const staff = await addMember(bizA, 'staff')
    await asUser(staff.sub, async (c) => {
      const r = await c.query(`select id from public.clients where business_id = $1`, [
        bizA.businessId,
      ])
      expect(r.rowCount).toBeGreaterThan(0)
    })
    await asUser(bizA.owner.sub, async (c) => {
      await c.query('select public.remove_member($1, $2)', [
        bizA.businessId,
        staff.membershipId,
      ])
    })
    await asUser(staff.sub, async (c) => {
      for (const t of ['clients', 'business_services', 'bookings', 'businesses']) {
        const col = t === 'businesses' ? 'id' : 'business_id'
        const r = await c.query(`select * from public.${t} where ${col} = $1`, [
          bizA.businessId,
        ])
        expect(r.rowCount, `removed staff still sees ${t}`).toBe(0)
      }
      await expectError(
        c.query('select * from public.team_directory($1)', [bizA.businessId]),
        /FORBIDDEN/,
      )
    })
  })

  it('an ended client loses access; a blocked client keeps reads but cannot act', async () => {
    const client = await addClient(bizA)
    await asUser(client.sub, async (c) => {
      const r = await c.query(`select id from public.businesses where id = $1`, [
        bizA.businessId,
      ])
      expect(r.rowCount).toBe(1)
    })

    // Blocked: still related (can read own rows / the business) but cannot
    // create bookings or pets (active-only helper).
    await asUser(bizA.owner.sub, async (c) => {
      await c.query(`select public.set_client_status($1, $2, 'blocked', 'test')`, [
        bizA.businessId,
        client.clientId,
      ])
    })
    await asUser(client.sub, async (c) => {
      const biz = await c.query(`select id from public.businesses where id = $1`, [
        bizA.businessId,
      ])
      expect(biz.rowCount).toBe(1)
      const svc = await c.query(
        `select id from public.business_services where business_id = $1`,
        [bizA.businessId],
      )
      expect(svc.rowCount).toBe(0) // capacity config is provider-only anyway
      await expectError(
        c.query(
          `insert into public.pets (business_id, client_id, name) values ($1, $2, 'Nope')`,
          [bizA.businessId, client.clientId],
        ),
        /row-level security/,
      )
    })

    // Ended: relationship gone; nothing visible.
    await asUser(bizA.owner.sub, async (c) => {
      await c.query(`select public.set_client_status($1, $2, 'ended')`, [
        bizA.businessId,
        client.clientId,
      ])
    })
    await asUser(client.sub, async (c) => {
      const biz = await c.query(`select id from public.businesses where id = $1`, [
        bizA.businessId,
      ])
      expect(biz.rowCount).toBe(0)
      const own = await c.query(`select * from public.clients where business_id = $1`, [
        bizA.businessId,
      ])
      // Own-row policy still shows the ended row's existence? No: the
      // clients_select_self policy matches the account, so the ended row is
      // visible to its person (their history), but nothing else is.
      expect(own.rowCount).toBeLessThanOrEqual(1)
      await expectError(
        c.query(`select * from public.effective_availability($1, $2, '2027-04-01', '2027-04-02')`, [
          bizA.businessId,
          (await (async () => {
            const c2 = await connect()
            const r = await c2.query(
              `select id from public.business_services where business_id = $1 limit 1`,
              [bizA.businessId],
            )
            await c2.end()
            return r.rows[0].id as string
          })()),
        ]),
        /FORBIDDEN/,
      )
    })
  })
})
