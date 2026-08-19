import type pg from 'pg'
import { asService, asUser, uuid } from './db'

export interface Account {
  sub: string
  accountId: string
}

/** First-login bootstrap: mint (or resolve) an account for a fresh subject. */
export async function newAccount(sub: string = uuid()): Promise<Account> {
  const accountId = await asUser(sub, async (c) => {
    const r = await c.query('select public.bootstrap_account() as id')
    return r.rows[0].id as string
  })
  return { sub, accountId }
}

export interface BusinessFixture {
  businessId: string
  owner: Account
}

export async function newBusiness(name = 'Test Business'): Promise<BusinessFixture> {
  const owner = await newAccount()
  const businessId = await asUser(owner.sub, async (c) => {
    const r = await c.query('select public.create_business($1, $2) as id', [name, uuid()])
    return r.rows[0].id as string
  })
  return { businessId, owner }
}

let syncVersion = 1000
/** Push a master-authoritative entitlement projection (service_role machine op). */
export async function setEntitlements(
  businessId: string,
  overrides: Record<string, unknown> = {},
  opts: { source?: string; version?: number; eventId?: string } = {},
): Promise<{ status: string; version: number }> {
  const version = opts.version ?? ++syncVersion
  const envelope = {
    source_system: opts.source ?? 'base509_master',
    event_id: opts.eventId ?? uuid(),
    source_version: version,
    operational_business_id: businessId,
    tier_key: 'crew',
    capabilities: {},
    client_limit: null,
    seat_limit: 10,
    theme_allowlist: ['brandy_blue', 'husky'],
    projection_version: 2,
    ...overrides,
  }
  const status = await asService(async (c) => {
    const r = await c.query('select * from public.sync_entitlements($1)', [
      JSON.stringify(envelope),
    ])
    return r.rows[0].status as string
  })
  return { status, version }
}

/** Invite + redeem a new team member at the given role. */
export async function addMember(
  biz: BusinessFixture,
  role: 'admin' | 'manager' | 'staff',
  inviterSub: string = biz.owner.sub,
): Promise<Account & { membershipId: string }> {
  const token = await asUser(inviterSub, async (c) => {
    const r = await c.query(`select * from public.create_invite($1, 'staff', $2)`, [
      biz.businessId,
      role,
    ])
    return r.rows[0].token as string
  })
  const member = await newAccount()
  const membershipId = await asUser(member.sub, async (c) => {
    const r = await c.query('select * from public.redeem_invite($1)', [token])
    return r.rows[0].relationship_id as string
  })
  return { ...member, membershipId }
}

/** Invite + redeem a new client relationship. */
export async function addClient(
  biz: BusinessFixture,
): Promise<Account & { clientId: string }> {
  const token = await asUser(biz.owner.sub, async (c) => {
    const r = await c.query(`select * from public.create_invite($1, 'client')`, [
      biz.businessId,
    ])
    return r.rows[0].token as string
  })
  const client = await newAccount()
  const clientId = await asUser(client.sub, async (c) => {
    const r = await c.query('select * from public.redeem_invite($1)', [token])
    return r.rows[0].relationship_id as string
  })
  return { ...client, clientId }
}

export interface ServiceSpec {
  type?: string
  name?: string
  durationModel?: 'overnight' | 'fixed_window' | 'slot' | 'open_ended'
  capacityModel?: 'bounded' | 'unlimited'
  config?: Record<string, unknown>
  capacityGroupId?: string | null
  conflictGroupId?: string | null
  enabled?: boolean
}

/** Owner/admin creates a service by direct (RLS-authorized) insert. */
export async function createService(
  biz: BusinessFixture,
  spec: ServiceSpec = {},
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const config = spec.config ?? { version: 1, slot_unit: 'dogs', service_limit: 5 }
    const r = await c.query(
      `insert into public.business_services
         (business_id, service_type_key, name, enabled, capacity_model, capacity_config,
          capacity_group_id, conflict_group_id, duration_model)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [
        biz.businessId,
        spec.type ?? 'boarding',
        spec.name ?? `${spec.type ?? 'boarding'}-${uuid().slice(0, 8)}`,
        spec.enabled ?? true,
        spec.capacityModel ?? 'bounded',
        JSON.stringify(config),
        spec.capacityGroupId ?? null,
        spec.conflictGroupId ?? null,
        spec.durationModel ?? 'overnight',
      ],
    )
    return r.rows[0].id as string
  })
}

export async function createCapacityGroup(
  biz: BusinessFixture,
  poolLimit: number,
  resourceUnit = 'dogs',
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `insert into public.capacity_groups (business_id, name, resource_unit, pool_limit)
       values ($1, $2, $3, $4) returning id`,
      [biz.businessId, `pool-${uuid().slice(0, 8)}`, resourceUnit, poolLimit],
    )
    return r.rows[0].id as string
  })
}

export async function createConflictGroup(
  biz: BusinessFixture,
  policy: 'exclusive' | 'overlap_allowed' = 'exclusive',
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `insert into public.availability_conflict_groups (business_id, name, overlap_policy)
       values ($1, $2, $3) returning id`,
      [biz.businessId, `conflict-${uuid().slice(0, 8)}`, policy],
    )
    return r.rows[0].id as string
  })
}

export async function createWindow(
  biz: BusinessFixture,
  serviceId: string,
  name = 'Midday',
  startTime = '11:00',
  endTime = '13:00',
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `insert into public.service_windows
         (business_id, business_service_id, name, start_time, end_time)
       values ($1, $2, $3, $4, $5) returning id`,
      [biz.businessId, serviceId, name, startTime, endTime],
    )
    return r.rows[0].id as string
  })
}

/** A small valid GeoJSON polygon (SF-ish square) satisfying the zone guardrail. */
export function validBoundary(offset = 0): Record<string, unknown> {
  const lon = -122.45 + offset * 0.02
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon, 37.75],
        [lon + 0.01, 37.75],
        [lon + 0.01, 37.76],
        [lon, 37.76],
        [lon, 37.75],
      ],
    ],
  }
}

let zoneOffset = 0
export async function createZone(
  biz: BusinessFixture,
  name: string,
  boundary?: Record<string, unknown>,
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `insert into public.service_zones (business_id, name, boundary)
       values ($1, $2, $3) returning id`,
      [biz.businessId, name, JSON.stringify(boundary ?? validBoundary(++zoneOffset % 100))],
    )
    return r.rows[0].id as string
  })
}

export async function assignWalker(
  biz: BusinessFixture,
  windowId: string,
  membershipId: string,
  opts: { capOverride?: number; zoneIds?: string[] } = {},
): Promise<string> {
  return asUser(biz.owner.sub, async (c) => {
    const r = await c.query(
      `insert into public.service_window_assignments
         (business_id, service_window_id, business_membership_id, member_capacity_override)
       values ($1, $2, $3, $4) returning id`,
      [biz.businessId, windowId, membershipId, opts.capOverride ?? null],
    )
    const assignmentId = r.rows[0].id as string
    for (const zoneId of opts.zoneIds ?? []) {
      await c.query(
        `insert into public.service_window_assignment_zones
           (business_id, service_window_assignment_id, service_zone_id)
         values ($1, $2, $3)`,
        [biz.businessId, assignmentId, zoneId],
      )
    }
    return assignmentId
  })
}

export async function setMemberDefaultCap(
  biz: BusinessFixture,
  serviceId: string,
  membershipId: string,
  capacity: number,
): Promise<void> {
  await asUser(biz.owner.sub, async (c) => {
    await c.query(
      `insert into public.service_member_capacity_defaults
         (business_id, business_service_id, business_membership_id, capacity)
       values ($1, $2, $3, $4)
       on conflict (business_id, business_service_id, business_membership_id)
       do update set capacity = excluded.capacity`,
      [biz.businessId, serviceId, membershipId, capacity],
    )
  })
}

export interface ReserveArgs {
  businessId: string
  serviceId: string
  clientId: string
  start: string
  end?: string | null
  petCount?: number
  windowId?: string | null
  zoneId?: string | null
  status?: string
}

export function reserveSql(c: pg.Client, a: ReserveArgs): Promise<pg.QueryResult> {
  return c.query(
    `select test_harness.reserve_fixture($1,$2,$3,$4,$5,$6,$7,$8,$9) as booking_id`,
    [
      a.businessId,
      a.serviceId,
      a.clientId,
      a.start,
      a.end ?? null,
      a.petCount ?? 1,
      a.windowId ?? null,
      a.zoneId ?? null,
      a.status ?? 'confirmed',
    ],
  )
}

/** Reserve through the privileged wrapper (service_role, ordinary path). */
export async function reserve(a: ReserveArgs): Promise<string> {
  return asService(async (c) => {
    const r = await reserveSql(c, a)
    return r.rows[0].booking_id as string
  })
}

/**
 * Human over-capacity reservation: runs as the given AUTHENTICATED subject —
 * the override op derives the actor and verifies the role from the session.
 */
export async function reserveOverCapacity(
  actorSub: string,
  a: ReserveArgs & { reason?: string | null },
): Promise<string> {
  return asUser(actorSub, async (c) => {
    const r = await c.query(
      `select test_harness.reserve_fixture_over_capacity($1,$2,$3,$4,$5,$6,$7,$8,$9) as booking_id`,
      [
        a.businessId,
        a.serviceId,
        a.clientId,
        a.start,
        a.end ?? null,
        a.petCount ?? 1,
        a.windowId ?? null,
        a.zoneId ?? null,
        a.reason ?? null,
      ],
    )
    return r.rows[0].booking_id as string
  })
}
