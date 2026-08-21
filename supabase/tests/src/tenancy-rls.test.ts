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
  /** No API-role access at all — only definer functions touch it. */
  definerOnly?: boolean
  /** The marketing waitlist: anon INSERT is the one sanctioned anon write. */
  anonInsert?: boolean
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
  // A2: per-account GoTrue snapshot behind sync_identity_audit — sealed.
  { name: 'account_auth_state', businessScoped: false, definerOnly: true },
  // Pre-launch marketing waitlist (2026-08-15 layer): anon INSERT only.
  { name: 'waitlist', businessScoped: false, anonInsert: true },
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
    for (const spec of REGISTRY) {
      const t = spec.name
      const pk = t === 'base509_accounts' || t === 'account_auth_state' ? 'base509_account_id' : 'id'
      await expectError(c.query(`select * from public.${t} limit 1`), /permission denied/)
      if (!spec.anonInsert) {
        await expectError(c.query(`insert into public.${t} default values`), /permission denied/)
      }
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
    // Write-only from the public internet in the STRICTEST sense: anon has
    // no SELECT grant at all (the hardened project defaults — the old
    // 0-rows expectation encoded a local-shim over-grant, not prod).
    await expectError(c.query('select * from public.waitlist'), /permission denied/)
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

// ─────────────────────────────────────────────────────────────────────────────
// A2 Codex round-2: the RLS POLICY REGISTRY. Every policy in the public
// schema registered by exact (table, policy, command, roles) identity with
// an authority class; the equality test fails if a policy is added,
// removed, renamed, re-scoped, or re-roled without classification here —
// a weakened policy can no longer hide behind its table name. Every
// admin-classified policy then gets a same-tenant AAL1 AND missing-claim
// probe per command (has_role fails closed below AAL2).
// ─────────────────────────────────────────────────────────────────────────────

type PolicyClass = 'admin' | 'staff' | 'manager' | 'member' | 'self' | 'client' | 'anon-insert'
const CAPACITY_TABLES = [
  'availability_conflict_groups', 'capacity_groups', 'business_services',
  'service_zones', 'business_service_zones', 'service_windows',
  'service_window_zones', 'service_member_capacity_defaults',
  'service_window_assignments', 'service_window_assignment_zones',
] as const

const POLICY_REGISTRY: Array<{ table: string; policy: string; cmd: string; roles: string; cls: PolicyClass }> = [
  { table: 'audit_events', policy: 'audit_select_admin', cmd: 'SELECT', roles: '{authenticated}', cls: 'admin' },
  { table: 'auth_identities', policy: 'identities_select_self', cmd: 'SELECT', roles: '{authenticated}', cls: 'self' },
  { table: 'base509_accounts', policy: 'accounts_select_self', cmd: 'SELECT', roles: '{authenticated}', cls: 'self' },
  { table: 'base509_accounts', policy: 'accounts_update_self', cmd: 'UPDATE', roles: '{authenticated}', cls: 'self' },
  { table: 'booking_occurrences', policy: 'occurrences_select_client', cmd: 'SELECT', roles: '{authenticated}', cls: 'client' },
  { table: 'booking_occurrences', policy: 'occurrences_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'booking_pets', policy: 'booking_pets_delete_manager', cmd: 'DELETE', roles: '{authenticated}', cls: 'manager' },
  { table: 'booking_pets', policy: 'booking_pets_insert_client', cmd: 'INSERT', roles: '{authenticated}', cls: 'client' },
  { table: 'booking_pets', policy: 'booking_pets_insert_staff', cmd: 'INSERT', roles: '{authenticated}', cls: 'staff' },
  { table: 'booking_pets', policy: 'booking_pets_select_client', cmd: 'SELECT', roles: '{authenticated}', cls: 'client' },
  { table: 'booking_pets', policy: 'booking_pets_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'bookings', policy: 'bookings_insert_client', cmd: 'INSERT', roles: '{authenticated}', cls: 'client' },
  { table: 'bookings', policy: 'bookings_insert_staff', cmd: 'INSERT', roles: '{authenticated}', cls: 'staff' },
  { table: 'bookings', policy: 'bookings_select_client', cmd: 'SELECT', roles: '{authenticated}', cls: 'client' },
  { table: 'bookings', policy: 'bookings_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'bookings', policy: 'bookings_update_client_cancel', cmd: 'UPDATE', roles: '{authenticated}', cls: 'client' },
  { table: 'bookings', policy: 'bookings_update_manager', cmd: 'UPDATE', roles: '{authenticated}', cls: 'manager' },
  { table: 'business_calendar_days', policy: 'business_calendar_days_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'business_entitlements', policy: 'entitlements_select_member', cmd: 'SELECT', roles: '{authenticated}', cls: 'member' },
  { table: 'business_invite_codes', policy: 'invites_select_admin', cmd: 'SELECT', roles: '{authenticated}', cls: 'admin' },
  { table: 'business_memberships', policy: 'memberships_select_admin', cmd: 'SELECT', roles: '{authenticated}', cls: 'admin' },
  { table: 'business_memberships', policy: 'memberships_select_own', cmd: 'SELECT', roles: '{authenticated}', cls: 'self' },
  { table: 'business_service_day_overrides', policy: 'business_service_day_overrides_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'businesses', policy: 'businesses_select_related', cmd: 'SELECT', roles: '{authenticated}', cls: 'member' },
  { table: 'businesses', policy: 'businesses_update_admin', cmd: 'UPDATE', roles: '{authenticated}', cls: 'admin' },
  { table: 'capacity_group_day_overrides', policy: 'capacity_group_day_overrides_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'clients', policy: 'clients_select_member', cmd: 'SELECT', roles: '{authenticated}', cls: 'member' },
  { table: 'clients', policy: 'clients_select_self', cmd: 'SELECT', roles: '{authenticated}', cls: 'self' },
  { table: 'clients', policy: 'clients_update_self', cmd: 'UPDATE', roles: '{authenticated}', cls: 'self' },
  { table: 'clients', policy: 'clients_update_staff_ops', cmd: 'UPDATE', roles: '{authenticated}', cls: 'staff' },
  { table: 'pets', policy: 'pets_insert_own', cmd: 'INSERT', roles: '{authenticated}', cls: 'client' },
  { table: 'pets', policy: 'pets_insert_staff', cmd: 'INSERT', roles: '{authenticated}', cls: 'staff' },
  { table: 'pets', policy: 'pets_select_member', cmd: 'SELECT', roles: '{authenticated}', cls: 'member' },
  { table: 'pets', policy: 'pets_select_own', cmd: 'SELECT', roles: '{authenticated}', cls: 'client' },
  { table: 'pets', policy: 'pets_update_own', cmd: 'UPDATE', roles: '{authenticated}', cls: 'client' },
  { table: 'pets', policy: 'pets_update_staff', cmd: 'UPDATE', roles: '{authenticated}', cls: 'staff' },
  { table: 'service_window_day_override_assignment_zones', policy: 'service_window_day_override_assignment_zones_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'service_window_day_override_assignments', policy: 'service_window_day_override_assignments_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'service_window_day_overrides', policy: 'service_window_day_overrides_select_staff', cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
  { table: 'waitlist', policy: 'anon can join waitlist', cmd: 'INSERT', roles: '{anon}', cls: 'anon-insert' },
  // The ten capacity-config tables share one generated policy shape:
  // staff SELECT + admin INSERT/UPDATE/DELETE.
  ...CAPACITY_TABLES.flatMap((t): Array<{ table: string; policy: string; cmd: string; roles: string; cls: PolicyClass }> => [
    { table: t, policy: `${t}_select_staff`, cmd: 'SELECT', roles: '{authenticated}', cls: 'staff' },
    { table: t, policy: `${t}_insert_admin`, cmd: 'INSERT', roles: '{authenticated}', cls: 'admin' },
    { table: t, policy: `${t}_update_admin`, cmd: 'UPDATE', roles: '{authenticated}', cls: 'admin' },
    { table: t, policy: `${t}_delete_admin`, cmd: 'DELETE', roles: '{authenticated}', cls: 'admin' },
  ]),
]

describe('RLS policy registry (A2 round-2 — exact identities, not table names)', () => {
  // The behavioral probe surface, DERIVED from the same CAPACITY_TABLES
  // source the probes iterate, plus the four singleton probes below. The
  // coupling test asserts this equals the admin-classified registry
  // exactly — classify a new policy 'admin' and the suite fails until a
  // probe covers it (Codex round-2 re-review #2, item 1).
  const ADMIN_PROBE_COVERAGE: string[] = [
    ...CAPACITY_TABLES.flatMap((t) => ['INSERT', 'UPDATE', 'DELETE'].map((cmd) => `${t}|${cmd}`)),
    'businesses|UPDATE',
    'audit_events|SELECT',
    'business_invite_codes|SELECT',
    'business_memberships|SELECT',
  ]

  it('every admin-classified policy has a behavioral probe (coverage == registry)', () => {
    const adminPolicies = POLICY_REGISTRY.filter((r) => r.cls === 'admin').map(
      (r) => `${r.table}|${r.cmd}`,
    )
    expect([...adminPolicies].sort()).toEqual([...ADMIN_PROBE_COVERAGE].sort())
  })

  it('REGISTRY == pg_policies on (table, policy, command, roles)', async () => {
    const admin = await connect()
    const rows = await admin.query(
      `select tablename, policyname, cmd, roles::text as roles
       from pg_policies where schemaname = 'public'`,
    )
    const key = (r: { tablename?: string; table?: string; policyname?: string; policy?: string; cmd: string; roles: string }) =>
      `${r.tablename ?? r.table}|${r.policyname ?? r.policy}|${r.cmd}|${r.roles}`
    expect(rows.rows.map((r) => key(r)).sort()).toEqual(POLICY_REGISTRY.map((r) => key(r)).sort())
    await admin.end()
  })

  // Same-tenant probes for EVERY admin-classified policy, run under BOTH
  // sub-AAL2 session shapes: explicit aal1 and missing claim entirely.
  const SUB_AAL2_SHAPES: Array<[string, Record<string, unknown> | 'missing']> = [
    ['aal1 claim', { aal: 'aal1' }],
    ['missing aal claim', 'missing'],
  ]

  async function ownerConn(shape: Record<string, unknown> | 'missing') {
    const c = await connect()
    if (shape === 'missing') {
      await c.query(`select set_config('request.jwt.claims', $1, false)`, [
        JSON.stringify({ sub: bizA.owner.sub, iss: 'https://test.local/auth/v1', role: 'authenticated' }),
      ])
      await c.query('set role authenticated')
    } else {
      await become(c, 'authenticated', { sub: bizA.owner.sub, ...shape })
    }
    return c
  }

  for (const [label, shape] of SUB_AAL2_SHAPES) {
    it(`every admin WRITE policy is closed and every admin READ policy is empty at ${label}`, async () => {
      // Fresh probe fixtures at AAL2 (a zone that collides with nothing, the
      // owner's own membership id, one throwaway row per capacity table).
      const probeZone = await createZone(bizA, 'aalpz-' + uuid().slice(0, 8))
      const admin = await connect()
      const ownerMembershipId = (
        await admin.query(
          `select id from public.business_memberships where business_id = $1 and role = 'owner'`,
          [bizA.businessId],
        )
      ).rows[0].id as string
      await admin.end()

      const INSERTS: Record<(typeof CAPACITY_TABLES)[number], { sql: string; params: unknown[] }> = {
        availability_conflict_groups: {
          sql: `insert into public.availability_conflict_groups (business_id, name) values ($1, 'aalp-' || gen_random_uuid()) returning id`,
          params: [bizA.businessId],
        },
        capacity_groups: {
          sql: `insert into public.capacity_groups (business_id, name, resource_unit, pool_limit) values ($1, 'aalp-' || gen_random_uuid(), 'dogs', 4) returning id`,
          params: [bizA.businessId],
        },
        business_services: {
          sql: `insert into public.business_services (business_id, service_type_key, name, capacity_model, capacity_config, duration_model)
                values ($1, 'boarding', 'aalp-' || gen_random_uuid(), 'bounded', '{"version":1,"slot_unit":"dogs","service_limit":3}', 'overnight') returning id`,
          params: [bizA.businessId],
        },
        service_zones: {
          sql: `insert into public.service_zones (business_id, name, boundary) values ($1, 'aalp-' || gen_random_uuid(), $2) returning id`,
          params: [bizA.businessId, JSON.stringify(validBoundary(55))],
        },
        business_service_zones: {
          sql: `insert into public.business_service_zones (business_id, business_service_id, service_zone_id) values ($1, $2, $3) returning id`,
          params: [bizA.businessId, idsA.svc, probeZone],
        },
        service_windows: {
          sql: `insert into public.service_windows (business_id, business_service_id, name, start_time, end_time) values ($1, $2, 'aalp-' || gen_random_uuid(), '03:00', '04:00') returning id`,
          params: [bizA.businessId, idsA.svc],
        },
        service_window_zones: {
          sql: `insert into public.service_window_zones (business_id, service_window_id, service_zone_id) values ($1, $2, $3) returning id`,
          params: [bizA.businessId, idsA.window, probeZone],
        },
        service_member_capacity_defaults: {
          sql: `insert into public.service_member_capacity_defaults (business_id, business_service_id, business_membership_id, capacity) values ($1, $2, $3, 2) returning id`,
          params: [bizA.businessId, idsA.svc, ownerMembershipId],
        },
        service_window_assignments: {
          sql: `insert into public.service_window_assignments (business_id, service_window_id, business_membership_id) values ($1, $2, $3) returning id`,
          params: [bizA.businessId, idsA.window, ownerMembershipId],
        },
        service_window_assignment_zones: {
          sql: `insert into public.service_window_assignment_zones (business_id, service_window_assignment_id, service_zone_id) values ($1, $2, $3) returning id`,
          params: [bizA.businessId, idsA.assignment, probeZone],
        },
      }

      // Cleanup order matters (FKs): children before parents.
      const CLEANUP_ORDER: Array<(typeof CAPACITY_TABLES)[number]> = [
        'service_window_assignment_zones', 'service_window_assignments',
        'service_member_capacity_defaults', 'service_window_zones', 'service_windows',
        'business_service_zones', 'service_zones', 'business_services',
        'capacity_groups', 'availability_conflict_groups',
      ]

      const sub = await ownerConn(shape)
      try {
        const throwaway: Partial<Record<string, string>> = {}
        // Seed one row per capacity table at AAL2 (the real admin session).
        await asUser(bizA.owner.sub, async (c) => {
          for (const t of CAPACITY_TABLES) {
            const spec = INSERTS[t]
            throwaway[t] = (await c.query(spec.sql, spec.params)).rows[0].id as string
          }
        })

        // WRITE policies at sub-AAL2: INSERT refused by with_check; UPDATE
        // and DELETE see zero rows (using-clause fails closed).
        for (const t of CAPACITY_TABLES) {
          const spec = INSERTS[t]
          await expectError(sub.query(spec.sql, spec.params), /row-level security/)
          const upd = await sub.query(
            `update public.${t} set business_id = business_id where id = $1`,
            [throwaway[t]],
          )
          expect(upd.rowCount).toBe(0)
          const del = await sub.query(`delete from public.${t} where id = $1`, [throwaway[t]])
          expect(del.rowCount).toBe(0)
        }
        // businesses_update_admin.
        const bupd = await sub.query(
          `update public.businesses set name = name where id = $1`,
          [bizA.businessId],
        )
        expect(bupd.rowCount).toBe(0)
        // Admin READ policies: audit + invites empty; memberships collapse
        // to the caller's own row.
        expect((await sub.query(`select id from public.audit_events where business_id = $1`, [bizA.businessId])).rowCount).toBe(0)
        expect((await sub.query(`select id from public.business_invite_codes where business_id = $1`, [bizA.businessId])).rowCount).toBe(0)
        const own = await sub.query(`select base509_account_id from public.business_memberships where business_id = $1`, [bizA.businessId])
        expect(own.rowCount).toBe(1)

        // The SAME rows open at AAL2 — update each, then clean up in FK order.
        await asUser(bizA.owner.sub, async (c) => {
          for (const t of CAPACITY_TABLES) {
            const upd = await c.query(
              `update public.${t} set business_id = business_id where id = $1`,
              [throwaway[t]],
            )
            expect(upd.rowCount).toBe(1)
          }
          for (const t of CLEANUP_ORDER) {
            const del = await c.query(`delete from public.${t} where id = $1`, [throwaway[t]])
            expect(del.rowCount).toBe(1)
          }
          expect((await c.query(`update public.businesses set name = name where id = $1`, [bizA.businessId])).rowCount).toBe(1)
          expect((await c.query(`select id from public.business_invite_codes where business_id = $1`, [bizA.businessId])).rowCount).toBeGreaterThan(0)
          expect((await c.query(`select id from public.audit_events where business_id = $1 limit 1`, [bizA.businessId])).rowCount).toBe(1)
          expect((await c.query(`select id from public.business_memberships where business_id = $1`, [bizA.businessId])).rowCount).toBeGreaterThan(1)
        })
      } finally {
        await sub.end()
      }
    }, 120_000)
  }
})

describe('public-table registry (A2 round-2 — catalog equality + sealed tables)', () => {
  it('REGISTRY == pg_tables: every public table must be classified', async () => {
    const admin = await connect()
    const rows = await admin.query(
      `select tablename from pg_tables where schemaname = 'public' order by tablename`,
    )
    expect(rows.rows.map((r) => r.tablename as string).sort()).toEqual(
      REGISTRY.map((t) => t.name).sort(),
    )
    await admin.end()
  })

  it('definer-only tables refuse anon, authenticated, AND service_role on every verb', async () => {
    for (const spec of REGISTRY.filter((t) => t.definerOnly)) {
      const t = spec.name
      for (const role of ['anon', 'authenticated', 'service_role'] as const) {
        const c = await connect()
        await become(c, role, role === 'anon' ? {} : { sub: uuid() })
        await expectError(c.query(`select * from public.${t} limit 1`), /permission denied/)
        await expectError(c.query(`insert into public.${t} default values`), /permission denied/)
        await expectError(c.query(`update public.${t} set updated_at = updated_at`), /permission denied/)
        await expectError(c.query(`delete from public.${t}`), /permission denied/)
        await c.end()
      }
    }
  })
})
