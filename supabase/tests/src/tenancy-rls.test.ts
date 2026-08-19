// CFG-1 §6 gate — Tenancy / RLS (exhaustive, registry-driven — Codex #1)
// - Anonymous access denied across the entire foundation
// - EVERY table driven through cross-tenant SELECT/INSERT/UPDATE/DELETE from
//   a table registry (no sampling)
// - business_id reassignment attempted on EVERY business-scoped table, both
//   as the superuser path (trigger, not RLS invisibility) and as a user
//   authorized in BOTH tenants (RLS would pass — the trigger must block)
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
  newAccount,
  newBusiness,
  reserve,
  setEntitlements,
  validBoundary,
  type BusinessFixture,
} from './fixtures'

// ── Table registry ───────────────────────────────────────────────────────────
// Every CFG-1 table (waitlist is the separate, pre-launch anon surface).
// `insert` builds a validly-shaped row aimed at tenant B using B's real ids —
// tables without an entry have no INSERT grant for authenticated at all.
interface TenantIds {
  client: string
  pet: string
  svc: string
  pool: string
  conflict: string
  window: string
  zone: string
  membership: string
  assignment: string
  booking: string
}

interface TableSpec {
  name: string
  businessScoped: boolean
  insert?: (b: TenantIds, bizB: string) => { sql: string; params: unknown[] }
}

const REGISTRY: TableSpec[] = [
  { name: 'base509_accounts', businessScoped: false },
  { name: 'auth_identities', businessScoped: false },
  { name: 'businesses', businessScoped: false },
  { name: 'business_memberships', businessScoped: true },
  { name: 'clients', businessScoped: true },
  {
    name: 'pets', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.pets (business_id, client_id, name) values ($1, $2, 'evil')`,
      params: [biz, b.client],
    }),
  },
  { name: 'business_entitlements', businessScoped: true },
  { name: 'audit_events', businessScoped: true },
  { name: 'business_invite_codes', businessScoped: true },
  {
    name: 'availability_conflict_groups', businessScoped: true,
    insert: (_b, biz) => ({
      sql: `insert into public.availability_conflict_groups (business_id, name) values ($1, 'evil-' || gen_random_uuid())`,
      params: [biz],
    }),
  },
  {
    name: 'capacity_groups', businessScoped: true,
    insert: (_b, biz) => ({
      sql: `insert into public.capacity_groups (business_id, name, resource_unit, pool_limit) values ($1, 'evil-' || gen_random_uuid(), 'dogs', 4)`,
      params: [biz],
    }),
  },
  {
    name: 'business_services', businessScoped: true,
    insert: (_b, biz) => ({
      sql: `insert into public.business_services (business_id, service_type_key, name, capacity_model, capacity_config, duration_model)
            values ($1, 'boarding', 'evil-' || gen_random_uuid(), 'bounded', '{"version":1,"slot_unit":"dogs","service_limit":3}', 'overnight')`,
      params: [biz],
    }),
  },
  {
    name: 'service_zones', businessScoped: true,
    insert: (_b, biz) => ({
      sql: `insert into public.service_zones (business_id, name, boundary) values ($1, 'evil-' || gen_random_uuid(), $2)`,
      params: [biz, JSON.stringify(validBoundary(1))],
    }),
  },
  {
    name: 'business_service_zones', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.business_service_zones (business_id, business_service_id, service_zone_id) values ($1, $2, $3)`,
      params: [biz, b.svc, b.zone],
    }),
  },
  {
    name: 'service_windows', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.service_windows (business_id, business_service_id, name, start_time, end_time) values ($1, $2, 'evil', '08:00', '09:00')`,
      params: [biz, b.svc],
    }),
  },
  {
    name: 'service_window_zones', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.service_window_zones (business_id, service_window_id, service_zone_id) values ($1, $2, $3)`,
      params: [biz, b.window, b.zone],
    }),
  },
  {
    name: 'service_member_capacity_defaults', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.service_member_capacity_defaults (business_id, business_service_id, business_membership_id, capacity) values ($1, $2, $3, 4)`,
      params: [biz, b.svc, b.membership],
    }),
  },
  {
    name: 'service_window_assignments', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.service_window_assignments (business_id, service_window_id, business_membership_id) values ($1, $2, $3)`,
      params: [biz, b.window, b.membership],
    }),
  },
  {
    name: 'service_window_assignment_zones', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.service_window_assignment_zones (business_id, service_window_assignment_id, service_zone_id)
            values ($1, $2, $3)`,
      params: [biz, b.assignment, b.zone],
    }),
  },
  { name: 'business_calendar_days', businessScoped: true },
  { name: 'business_service_day_overrides', businessScoped: true },
  { name: 'capacity_group_day_overrides', businessScoped: true },
  { name: 'service_window_day_overrides', businessScoped: true },
  { name: 'service_window_day_override_assignments', businessScoped: true },
  { name: 'service_window_day_override_assignment_zones', businessScoped: true },
  {
    name: 'bookings', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.bookings (business_id, client_id, business_service_id, start_date, end_date)
            values ($1, $2, $3, '2027-05-01', '2027-05-02')`,
      params: [biz, b.client, b.svc],
    }),
  },
  {
    name: 'booking_pets', businessScoped: true,
    insert: (b, biz) => ({
      sql: `insert into public.booking_pets (business_id, booking_id, pet_id) values ($1, $2, $3)`,
      params: [biz, b.booking, b.pet],
    }),
  },
  { name: 'booking_occurrences', businessScoped: true },
  { name: 'entitlement_sync_receipts', businessScoped: true },
]

const ALL_TABLES = REGISTRY.map((t) => t.name)
const BUSINESS_SCOPED = REGISTRY.filter((t) => t.businessScoped).map((t) => t.name)

let bizA: BusinessFixture
let bizB: BusinessFixture
let idsA: TenantIds
let idsB: TenantIds
let dualAdminSub: string

async function seedTenant(biz: BusinessFixture): Promise<TenantIds> {
  let assignmentId = ''
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
  // A pool requires 2+ participating services (conditional-pool rule).
  await createService(biz, {
    type: 'daycare',
    durationModel: 'open_ended',
    config: { version: 1, slot_unit: 'dogs', service_limit: 3 },
    capacityGroupId: pool,
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
    assignmentId = a.rows[0].id
    await c.query(
      `insert into public.service_window_assignment_zones
         (business_id, service_window_assignment_id, service_zone_id) values ($1, $2, $3)`,
      [biz.businessId, assignmentId, zone],
    )
    await c.query(`select public.set_calendar_day($1, '2027-03-01', false, 'holiday')`, [
      biz.businessId,
    ])
    await c.query(`select public.set_service_day_override($1, $2, '2027-03-02', true, 4)`, [
      biz.businessId, svc,
    ])
    await c.query(`select public.set_pool_day_override($1, $2, '2027-03-02', 9)`, [
      biz.businessId, pool,
    ])
    await c.query(
      `select public.set_window_day_override($1, $2, '2027-03-03', true, $3) as id`,
      [
        biz.businessId, windowId,
        JSON.stringify([
          { membership_id: staff.membershipId, capacity_override: 3, zone_ids: [zone] },
        ]),
      ],
    )
    await c.query(`select * from public.create_invite($1, 'client')`, [biz.businessId])
  })

  // Client-owned rows: a pet + a booking with occurrences + booking_pet.
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
  const admin = await connect()
  const pet = await admin.query(`select id from public.pets where business_id = $1 limit 1`, [
    biz.businessId,
  ])
  await admin.end()
  await asUser(biz.owner.sub, async (c) => {
    await c.query(
      `insert into public.booking_pets (business_id, booking_id, pet_id) values ($1, $2, $3)`,
      [biz.businessId, bookingId, pet.rows[0].id],
    )
  })

  return {
    client: client.clientId,
    pet: pet.rows[0].id,
    svc,
    pool,
    conflict,
    window: windowId,
    zone,
    membership: staff.membershipId,
    assignment: assignmentId,
    booking: bookingId,
  }
}

beforeAll(async () => {
  bizA = await newBusiness('Tenant A')
  bizB = await newBusiness('Tenant B')
  await setEntitlements(bizA.businessId)
  await setEntitlements(bizB.businessId)
  idsA = await seedTenant(bizA)
  idsB = await seedTenant(bizB)

  // A single account holding Admin in BOTH tenants (multi-business is legal;
  // the rekey trigger — not RLS invisibility — must block cross-tenant moves).
  const dual = await newAccount()
  dualAdminSub = dual.sub
  for (const biz of [bizA, bizB]) {
    const token = await asUser(biz.owner.sub, async (c) =>
      (await c.query(`select * from public.create_invite($1, 'staff', 'admin')`, [
        biz.businessId,
      ])).rows[0].token as string,
    )
    await asUser(dual.sub, (c) => c.query('select * from public.redeem_invite($1)', [token]))
  }

  // Sanity: every business-scoped table has at least one row per tenant, so
  // the cross-tenant zero-row results below prove isolation, not emptiness.
  const admin = await connect()
  for (const t of BUSINESS_SCOPED) {
    for (const biz of [bizA, bizB]) {
      const r = await admin.query(
        `select 1 from public.${t} where business_id = $1 limit 1`,
        [biz.businessId],
      )
      expect(r.rowCount, `${t} has no fixture row for a tenant`).toBe(1)
    }
  }
  await admin.end()
}, 240_000)

afterAll(closeAll)

describe('anonymous access', () => {
  it('is denied on every CFG-1 table for select/insert/update/delete', async () => {
    const c = await connect()
    await become(c, 'anon')
    for (const t of ALL_TABLES) {
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

describe('cross-tenant isolation — every table, every operation (registry-driven)', () => {
  it('SELECT: zero rows of B visible to A (and own rows ARE visible)', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      for (const t of BUSINESS_SCOPED) {
        if (t === 'entitlement_sync_receipts') {
          await expectError(
            c.query(`select * from public.${t} limit 1`),
            /permission denied/,
          )
          continue
        }
        const cross = await c.query(`select * from public.${t} where business_id = $1`, [
          bizB.businessId,
        ])
        expect(cross.rowCount, `${t} leaked cross-tenant rows`).toBe(0)
        const own = await c.query(`select * from public.${t} where business_id = $1`, [
          bizA.businessId,
        ])
        expect(own.rowCount, `${t}: owner cannot see own tenant rows`).toBeGreaterThan(0)
      }
      // Global projections: only the caller's own account/identity rows.
      const accounts = await c.query(`select * from public.base509_accounts`)
      expect(accounts.rowCount).toBe(1)
      const identities = await c.query(`select * from public.auth_identities`)
      expect(identities.rowCount).toBe(1)
      const businesses = await c.query(`select * from public.businesses where id = $1`, [
        bizB.businessId,
      ])
      expect(businesses.rowCount).toBe(0)
    })
  })

  it('INSERT into B is rejected for every table', async () => {
    await asUser(bizA.owner.sub, async (c) => {
      for (const spec of REGISTRY.filter((t) => t.businessScoped)) {
        if (spec.insert) {
          const { sql, params } = spec.insert(idsB, bizB.businessId)
          await expectError(
            c.query(sql, params),
            /row-level security/,
          )
        } else {
          // No INSERT grant for authenticated at all.
          await expectError(
            c.query(`insert into public.${spec.name} default values`),
            /permission denied/,
          )
        }
      }
      // RPC path: a supplied business_id selector is proven independently.
      await expectError(
        c.query(`select public.create_client($1, 'evil')`, [bizB.businessId]),
        /FORBIDDEN/,
      )
      await expectError(
        c.query(`select public.set_calendar_day($1, '2027-03-09', true)`, [bizB.businessId]),
        /FORBIDDEN/,
      )
    })
  })

  it('UPDATE against B affects zero rows (or is denied outright)', async () => {
    const admin = await connect()
    const updatable = new Set(
      (
        await admin.query(
          `select distinct table_name from (
             select table_name, privilege_type from information_schema.role_table_grants
             where grantee = 'authenticated' and table_schema = 'public'
             union all
             select table_name, privilege_type from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public'
           ) g where g.privilege_type = 'UPDATE'`,
        )
      ).rows.map((r: any) => r.table_name as string),
    )
    // Pick a concretely-granted column per table for the no-op update.
    const grantedCol = new Map<string, string>()
    for (const t of BUSINESS_SCOPED) {
      const r = await admin.query(
        `select column_name from information_schema.column_privileges
         where grantee = 'authenticated' and table_schema = 'public'
           and table_name = $1 and privilege_type = 'UPDATE'
         order by column_name limit 1`,
        [t],
      )
      if (r.rowCount) grantedCol.set(t, r.rows[0].column_name)
      else if (updatable.has(t)) grantedCol.set(t, 'id')
    }
    await admin.end()

    await asUser(bizA.owner.sub, async (c) => {
      for (const t of BUSINESS_SCOPED) {
        if (!updatable.has(t)) {
          await expectError(
            c.query(`update public.${t} set id = id where business_id = $1`, [bizB.businessId]),
            /permission denied/,
          )
          continue
        }
        const col = grantedCol.get(t)!
        const r = await c.query(
          `update public.${t} set ${col} = ${col} where business_id = $1`,
          [bizB.businessId],
        )
        expect(r.rowCount, `${t}: cross-tenant update touched rows`).toBe(0)
      }
    })
  })

  it('DELETE against B affects zero rows (or is denied outright)', async () => {
    const admin = await connect()
    const deletable = new Set(
      (
        await admin.query(
          `select table_name from information_schema.role_table_grants
           where grantee = 'authenticated' and table_schema = 'public'
             and privilege_type = 'DELETE'`,
        )
      ).rows.map((r: any) => r.table_name as string),
    )
    await admin.end()
    await asUser(bizA.owner.sub, async (c) => {
      for (const t of BUSINESS_SCOPED) {
        if (!deletable.has(t)) {
          await expectError(
            c.query(`delete from public.${t} where business_id = $1`, [bizB.businessId]),
            /permission denied/,
          )
          continue
        }
        const r = await c.query(`delete from public.${t} where business_id = $1`, [
          bizB.businessId,
        ])
        expect(r.rowCount, `${t}: cross-tenant delete touched rows`).toBe(0)
      }
    })
  })
})

describe('business_id reassignment — every business-scoped table (Codex #1)', () => {
  it('the tenant-rekey trigger blocks even the privileged/superuser path', async () => {
    const admin = await connect()
    for (const t of BUSINESS_SCOPED) {
      const row = await admin.query(
        `select id from public.${t} where business_id = $1 limit 1`,
        [bizB.businessId],
      )
      expect(row.rowCount, `${t}: no fixture row`).toBe(1)
      await expectError(
        admin.query(`update public.${t} set business_id = $1 where id = $2`, [
          bizA.businessId,
          row.rows[0].id,
        ]),
        /TENANT_REKEY_FORBIDDEN|IMMUTABLE_ROW/,
      )
    }
    await admin.end()
  })

  it('a user authorized in BOTH tenants is still blocked — by the trigger, not invisibility', async () => {
    const admin = await connect()
    const rekeyGranted = new Set(
      (
        await admin.query(
          `select table_name from information_schema.column_privileges
           where grantee = 'authenticated' and table_schema = 'public'
             and column_name = 'business_id' and privilege_type = 'UPDATE'`,
        )
      ).rows.map((r: any) => r.table_name as string),
    )
    const rowIds = new Map<string, string>()
    for (const t of BUSINESS_SCOPED) {
      const r = await admin.query(
        `select id from public.${t} where business_id = $1 limit 1`,
        [bizA.businessId],
      )
      rowIds.set(t, r.rows[0].id)
    }
    await admin.end()

    expect(rekeyGranted.size, 'expected some full-row update grants (config tables)')
      .toBeGreaterThan(0)

    await asUser(dualAdminSub, async (c) => {
      for (const t of BUSINESS_SCOPED) {
        if (rekeyGranted.has(t)) {
          // RLS USING and WITH CHECK both pass for this dual-tenant admin —
          // ONLY the trigger stands between the row and the other tenant.
          await expectError(
            c.query(`update public.${t} set business_id = $1 where id = $2`, [
              bizB.businessId,
              rowIds.get(t)!,
            ]),
            /TENANT_REKEY_FORBIDDEN/,
          )
        } else {
          await expectError(
            c.query(`update public.${t} set business_id = $1 where id = $2`, [
              bizB.businessId,
              rowIds.get(t)!,
            ]),
            /permission denied/,
          )
        }
      }
    })
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
    await expectError(
      c.query(
        `insert into public.business_service_zones (business_id, business_service_id, service_zone_id)
         values ($1, $2, $3)`,
        [bizA.businessId, idsA.svc, idsB.zone],
      ),
      /foreign key/,
    )
    await expectError(
      c.query(
        `insert into public.service_window_assignments
           (business_id, service_window_id, business_membership_id) values ($1, $2, $3)`,
        [bizA.businessId, idsA.window, idsB.membership],
      ),
      /foreign key/,
    )
    await expectError(
      c.query(
        `insert into public.bookings (business_id, client_id, business_service_id, start_date, end_date)
         values ($1, $2, $3, '2027-06-01', '2027-06-02')`,
        [bizA.businessId, idsB.client, idsA.svc],
      ),
      /foreign key/,
    )
    await expectError(
      c.query(
        `insert into public.booking_pets (business_id, booking_id, pet_id) values ($1, $2, $3)`,
        [bizA.businessId, idsA.booking, idsB.pet],
      ),
      /foreign key/,
    )
    await c.end()
  })

  it('rejects a capacity/conflict group from another tenant on a service', async () => {
    const c = await connect()
    await expectError(
      c.query(
        `insert into public.business_services
           (business_id, service_type_key, name, capacity_model, capacity_config, duration_model, capacity_group_id)
         values ($1, 'daycare', 'x-' || gen_random_uuid(), 'bounded', '{"version":1,"slot_unit":"dogs","service_limit":3}', 'open_ended', $2)`,
        [bizA.businessId, idsB.pool],
      ),
      /foreign key/,
    )
    await expectError(
      c.query(
        `insert into public.business_services
           (business_id, service_type_key, name, capacity_model, capacity_config, duration_model, conflict_group_id)
         values ($1, 'daycare', 'x-' || gen_random_uuid(), 'bounded', '{"version":1,"slot_unit":"dogs","service_limit":3}', 'open_ended', $2)`,
        [bizA.businessId, idsB.conflict],
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

    // Blocked: still related (can read the business) but cannot create
    // bookings or pets (active-only helper).
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

    // Ended: relationship gone; nothing but their own historical row visible.
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
      await expectError(
        c.query(
          `select * from public.effective_availability($1, $2, '2027-04-01', '2027-04-02')`,
          [bizA.businessId, idsA.svc],
        ),
        /FORBIDDEN/,
      )
    })
  })
})
