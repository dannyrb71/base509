// CFG-1 §6 gate — Capacity + capacity/conflict concurrency
// Canonical semantics: docs/specs/capacity-model.md (ratified contract).
import { afterAll, describe, expect, it } from 'vitest'
import { asService, asUser, closeAll, connect, expectError, race } from './db'
import {
  addClient,
  addMember,
  assignWalker,
  createCapacityGroup,
  createConflictGroup,
  createService,
  createWindow,
  createZone,
  newBusiness,
  reserve,
  reserveSql,
  setEntitlements,
  setMemberDefaultCap,
  type BusinessFixture,
} from './fixtures'

afterAll(closeAll)

async function boardingBiz(limit = 1): Promise<{
  biz: BusinessFixture
  svc: string
  clientId: string
}> {
  const biz = await newBusiness()
  await setEntitlements(biz.businessId)
  const svc = await createService(biz, {
    type: 'boarding',
    durationModel: 'overnight',
    config: { version: 1, slot_unit: 'dogs', service_limit: limit },
  })
  const client = await addClient(biz)
  return { biz, svc, clientId: client.clientId }
}

describe('date-bucket occupancy (Danny’s ruling)', () => {
  it('boarding occupies [arrival, departure): departure day is free, arrival counts', async () => {
    const { biz, svc, clientId } = await boardingBiz(1)
    await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-08-10', end: '2027-08-12',
    })
    // The 11th is occupied.
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-08-11', end: '2027-08-13' }),
      /CAPACITY_CONFLICT/,
    )
    // Arriving ON the departure date is fine (departure-day tolerance).
    await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-08-12', end: '2027-08-13',
    })
  })

  it('same-day boarding is invalid (use daycare)', async () => {
    const { biz, svc, clientId } = await boardingBiz(5)
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-08-20', end: '2027-08-20' }),
      /VALIDATION_FAILED/,
    )
  })

  it('daycare occupies exactly its single service_date — never an empty interval', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const daycare = await createService(biz, {
      type: 'daycare',
      durationModel: 'open_ended',
      config: { version: 1, slot_unit: 'dogs', service_limit: 1 },
    })
    const client = await addClient(biz)
    await reserve({
      businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
      start: '2027-08-15',
    })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
        start: '2027-08-15' }),
      /CAPACITY_CONFLICT/,
    )
    // Another day is free.
    await reserve({
      businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
      start: '2027-08-16',
    })
  })

  it('requested bookings do NOT reserve; cancellation releases', async () => {
    const { biz, svc, clientId } = await boardingBiz(1)
    await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-09-01', end: '2027-09-02', status: 'requested',
    })
    // The requested booking holds nothing.
    const confirmed = await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-09-01', end: '2027-09-02',
    })
    // Now full…
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-09-01', end: '2027-09-02' }),
      /CAPACITY_CONFLICT/,
    )
    // …until released.
    await asService((c) =>
      c.query('select test_harness.cancel_booking($1, $2)', [biz.businessId, confirmed]),
    )
    await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-09-01', end: '2027-09-02',
    })
  })
})

describe('per-day overrides + precedence', () => {
  it('Block All beats everything; covers services created after the block; overrides cannot revive it', async () => {
    const { biz, svc, clientId } = await boardingBiz(5)
    await asUser(biz.owner.sub, async (c) => {
      await c.query(`select public.set_calendar_day($1, '2027-10-01', true, null, 'closed')`, [
        biz.businessId,
      ])
      // A service override trying to force the day open changes nothing.
      await c.query(`select public.set_service_day_override($1, $2, '2027-10-01', true, 99)`, [
        biz.businessId, svc,
      ])
    })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-10-01', end: '2027-10-02' }),
      /CAPACITY_CONFLICT.*blocked/,
    )
    // A service created AFTER the block is still blocked that day.
    const late = await createService(biz, {
      type: 'daycare', durationModel: 'open_ended',
      config: { version: 1, slot_unit: 'dogs', service_limit: 3 },
    })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: late, clientId, start: '2027-10-01' }),
      /CAPACITY_CONFLICT.*blocked/,
    )
  })

  it('a day override cannot revive a globally disabled service', async () => {
    const { biz, svc, clientId } = await boardingBiz(5)
    await asUser(biz.owner.sub, async (c) => {
      await c.query(`update public.business_services set enabled = false where id = $1`, [svc])
      await c.query(`select public.set_service_day_override($1, $2, '2027-10-05', true, 10)`, [
        biz.businessId, svc,
      ])
    })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-10-05', end: '2027-10-06' }),
      /CAPACITY_CONFLICT.*disabled/,
    )
  })

  it('service and pool overrides are independent and jointly enforced', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const pool = await createCapacityGroup(biz, 4)
    const boarding = await createService(biz, {
      type: 'boarding', durationModel: 'overnight',
      config: { version: 1, slot_unit: 'dogs', service_limit: 5 },
      capacityGroupId: pool,
    })
    const daycare = await createService(biz, {
      type: 'daycare', durationModel: 'open_ended',
      config: { version: 1, slot_unit: 'dogs', service_limit: 5 },
      capacityGroupId: pool,
    })
    const client = await addClient(biz)
    const D = '2027-11-10'

    // 2 boarding + 2 daycare fills the 4-dog pool even though each service
    // has its own headroom.
    await reserve({ businessId: biz.businessId, serviceId: boarding, clientId: client.clientId,
      start: D, end: '2027-11-11', petCount: 2 })
    await reserve({ businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
      start: D, petCount: 2 })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
        start: D }),
      /CAPACITY_CONFLICT.*pool/,
    )

    // Pool day override raises the ceiling for that date only.
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_pool_day_override($1, $2, $3, 6)`, [biz.businessId, pool, D]),
    )
    await reserve({ businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
      start: D })

    // Service override lowers boarding below its base; daycare unaffected.
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_service_day_override($1, $2, $3, null, 2)`, [
        biz.businessId, boarding, D,
      ]),
    )
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: boarding, clientId: client.clientId,
        start: D, end: '2027-11-11' }),
      /CAPACITY_CONFLICT.*service capacity/,
    )
    await reserve({ businessId: biz.businessId, serviceId: daycare, clientId: client.clientId,
      start: D })
  })

  it('lowering a limit below booked occupancy never cancels bookings', async () => {
    const { biz, svc, clientId } = await boardingBiz(5)
    const D = '2027-11-20'
    const booking = await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: D, end: '2027-11-21', petCount: 3,
    })
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_service_day_override($1, $2, $3, null, 1)`, [
        biz.businessId, svc, D,
      ]),
    )
    const admin = await connect()
    const status = await admin.query(`select status from public.bookings where id = $1`, [booking])
    expect(status.rows[0].status).toBe('confirmed') // untouched
    await admin.end()
    // But the over-capacity day blocks further approvals.
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: D, end: '2027-11-21' }),
      /CAPACITY_CONFLICT/,
    )
  })

  it('reset deletes the override AND appends the mandatory audit event', async () => {
    const { biz, svc } = await boardingBiz(5)
    const D = '2027-11-25'
    await asUser(biz.owner.sub, async (c) => {
      await c.query(`select public.set_service_day_override($1, $2, $3, false, null)`, [
        biz.businessId, svc, D,
      ])
      await c.query(`select public.reset_day_override($1, 'service_day', $2, $3)`, [
        biz.businessId, svc, D,
      ])
      // Resetting again: nothing to reset.
      await expectError(
        c.query(`select public.reset_day_override($1, 'service_day', $2, $3)`, [
          biz.businessId, svc, D,
        ]),
        /NOT_FOUND/,
      )
    })
    const admin = await connect()
    const gone = await admin.query(
      `select 1 from public.business_service_day_overrides
       where business_id = $1 and business_service_id = $2 and service_date = $3`,
      [biz.businessId, svc, D],
    )
    expect(gone.rowCount).toBe(0)
    const audit = await admin.query(
      `select before from public.audit_events
       where business_id = $1 and action = 'override.service_day.reset'`,
      [biz.businessId],
    )
    expect(audit.rowCount).toBe(1)
    expect(audit.rows[0].before.is_available).toBe(false)
    await admin.end()
  })
})

describe('summed walking + zones (ratified 2026-08-18)', () => {
  async function walkingFixture() {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const svc = await createService(biz, {
      type: 'walking',
      durationModel: 'fixed_window',
      config: { version: 1, slot_unit: 'dogs', scales_with: 'team' },
    })
    const windowId = await createWindow(biz, svc, 'Midday')
    const morgan = await addMember(biz, 'staff')
    const casey = await addMember(biz, 'staff')
    await setMemberDefaultCap(biz, svc, morgan.membershipId, 6)
    await setMemberDefaultCap(biz, svc, casey.membershipId, 4)
    const client = await addClient(biz)
    return { biz, svc, windowId, morgan, casey, clientId: client.clientId }
  }

  it('window capacity = Σ unequal walker caps (6 + 4 = 10), not a product', async () => {
    const f = await walkingFixture()
    await assignWalker(f.biz, f.windowId, f.morgan.membershipId)
    await assignWalker(f.biz, f.windowId, f.casey.membershipId)
    const D = '2027-12-06' // a Monday
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: D, windowId: f.windowId, petCount: 10 })
    await expectError(
      reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
        start: D, windowId: f.windowId }),
      /CAPACITY_CONFLICT.*window/,
    )
  })

  it('zone capacity = Σ caps of walkers whose coverage includes that zone', async () => {
    const f = await walkingFixture()
    const noe = await createZone(f.biz, 'Noe Valley')
    const mission = await createZone(f.biz, 'Mission')
    await assignWalker(f.biz, f.windowId, f.morgan.membershipId, { zoneIds: [mission] })
    await assignWalker(f.biz, f.windowId, f.casey.membershipId, { zoneIds: [noe] })
    const D = '2027-12-07'
    // Noe Valley = 4 (only Casey covers it).
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: D, windowId: f.windowId, zoneId: noe, petCount: 4 })
    await expectError(
      reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
        start: D, windowId: f.windowId, zoneId: noe }),
      /CAPACITY_CONFLICT.*zone/,
    )
    // Mission still has Morgan's 6.
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: D, windowId: f.windowId, zoneId: mission, petCount: 6 })
    // But the window total (10) is exhausted now.
    await expectError(
      reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
        start: D, windowId: f.windowId, zoneId: mission }),
      /CAPACITY_CONFLICT.*window/,
    )
  })

  it('one member cannot be assigned twice to the same window (counted once)', async () => {
    const f = await walkingFixture()
    await assignWalker(f.biz, f.windowId, f.morgan.membershipId)
    await expectError(
      assignWalker(f.biz, f.windowId, f.morgan.membershipId),
      /duplicate key/,
    )
  })

  it('a window-day override REPLACES the assignment set; reset falls back', async () => {
    const f = await walkingFixture()
    await assignWalker(f.biz, f.windowId, f.morgan.membershipId)
    await assignWalker(f.biz, f.windowId, f.casey.membershipId)
    const D = '2027-12-08'
    await asUser(f.biz.owner.sub, (c) =>
      c.query(`select public.set_window_day_override($1, $2, $3, true, $4)`, [
        f.biz.businessId, f.windowId, D,
        JSON.stringify([{ membership_id: f.casey.membershipId, capacity_override: 2 }]),
      ]),
    )
    // Replaced: only Casey at 2 for that date.
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: D, windowId: f.windowId, petCount: 2 })
    await expectError(
      reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
        start: D, windowId: f.windowId }),
      /CAPACITY_CONFLICT.*window/,
    )
    // Other dates keep the recurring 10.
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: '2027-12-09', windowId: f.windowId, petCount: 10 })
    // Reset → fallback to recurring assignments (but the date already carries
    // 2 dogs, so 8 remain).
    await asUser(f.biz.owner.sub, (c) =>
      c.query(`select public.reset_day_override($1, 'window_day', $2, $3)`, [
        f.biz.businessId, f.windowId, D,
      ]),
    )
    await reserve({ businessId: f.biz.businessId, serviceId: f.svc, clientId: f.clientId,
      start: D, windowId: f.windowId, petCount: 8 })
  })
})

describe('pools vs conflict groups', () => {
  it('capacity_group_id and conflict_group_id differ without interference', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const pool = await createCapacityGroup(biz, 10)
    const conflict = await createConflictGroup(biz, 'exclusive')
    const sitting = await createService(biz, {
      type: 'sitting', durationModel: 'overnight',
      config: { version: 1, slot_unit: 'dogs', service_limit: 5 },
      capacityGroupId: pool, conflictGroupId: conflict,
    })
    const client = await addClient(biz)
    const D = '2027-12-13'
    await reserve({ businessId: biz.businessId, serviceId: sitting, clientId: client.clientId,
      start: D, end: '2027-12-14' })
    // The pool has room for 9 more, but the EXCLUSIVE conflict group blocks
    // a second engagement that date.
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: sitting, clientId: client.clientId,
        start: D, end: '2027-12-14' }),
      /CAPACITY_CONFLICT.*conflict group/,
    )
  })

  it('a single-service business needs no capacity_group (conditional pool)', async () => {
    const { biz, svc, clientId } = await boardingBiz(2)
    // No pool row anywhere; the service limit alone is the ceiling.
    await reserve({ businessId: biz.businessId, serviceId: svc, clientId,
      start: '2027-12-15', end: '2027-12-16', petCount: 2 })
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: '2027-12-15', end: '2027-12-16' }),
      /CAPACITY_CONFLICT.*service capacity/,
    )
    const admin = await connect()
    const pools = await admin.query(
      `select count(*) as n from public.capacity_groups where business_id = $1`,
      [biz.businessId],
    )
    expect(Number(pools.rows[0].n)).toBe(0)
    await admin.end()
  })
})

describe('human over-capacity override (explicit flag + immutable audit)', () => {
  it('auto-book (no human actor/reason) can NEVER go over; a human with both can', async () => {
    const { biz, svc, clientId } = await boardingBiz(1)
    const D = '2028-01-10'
    await reserve({ businessId: biz.businessId, serviceId: svc, clientId,
      start: D, end: '2028-01-11' })

    // The machine path cannot invoke the override (missing actor/reason).
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: D, end: '2028-01-11', allowOver: true }),
      /VALIDATION_FAILED.*over-capacity/,
    )
    // Plain over-capacity approval without the flag conflicts as usual.
    await expectError(
      reserve({ businessId: biz.businessId, serviceId: svc, clientId,
        start: D, end: '2028-01-11' }),
      /CAPACITY_CONFLICT/,
    )

    // Explicit human override: flag + actor + reason → allowed + audited.
    await reserve({
      businessId: biz.businessId, serviceId: svc, clientId,
      start: D, end: '2028-01-11',
      allowOver: true, actor: biz.owner.accountId, reason: 'Holiday crunch, owner approved',
    })
    const admin = await connect()
    const audit = await admin.query(
      `select id, reason from public.audit_events
       where business_id = $1 and action = 'capacity.over_capacity_override'`,
      [biz.businessId],
    )
    expect(audit.rowCount).toBe(1)
    expect(audit.rows[0].reason).toContain('owner approved')
    // The audit row is immutable.
    await expectError(
      admin.query(`update public.audit_events set reason = 'scrubbed' where id = $1`, [
        audit.rows[0].id,
      ]),
      /IMMUTABLE_ROW/,
    )
    await admin.end()
  })
})

describe('concurrency gates', () => {
  it('parallel approvals cannot exceed the service cap', async () => {
    const { biz, svc, clientId } = await boardingBiz(3)
    const runners = Array.from({ length: 8 }, () => (c: any) =>
      reserveSql(c, { businessId: biz.businessId, serviceId: svc, clientId,
        start: '2028-02-01', end: '2028-02-02' }))
    const { ok, errors } = await race(runners)
    expect(ok).toBe(3)
    for (const e of errors) expect(e).toMatch(/CAPACITY_CONFLICT/)
  })

  it('parallel approvals across pooled services cannot exceed the pool', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const pool = await createCapacityGroup(biz, 4)
    const boarding = await createService(biz, {
      type: 'boarding', durationModel: 'overnight',
      config: { version: 1, slot_unit: 'dogs', service_limit: 8 },
      capacityGroupId: pool,
    })
    const daycare = await createService(biz, {
      type: 'daycare', durationModel: 'open_ended',
      config: { version: 1, slot_unit: 'dogs', service_limit: 8 },
      capacityGroupId: pool,
    })
    const client = await addClient(biz)
    const runners = Array.from({ length: 10 }, (_, i) => (c: any) =>
      reserveSql(c, {
        businessId: biz.businessId,
        serviceId: i % 2 === 0 ? boarding : daycare,
        clientId: client.clientId,
        start: '2028-02-10',
        end: i % 2 === 0 ? '2028-02-11' : null,
      }))
    const { ok, errors } = await race(runners)
    expect(ok).toBe(4)
    for (const e of errors) expect(e).toMatch(/CAPACITY_CONFLICT.*pool/)
  })

  it('conflict-group concurrency: exactly one exclusive engagement wins', async () => {
    const biz = await newBusiness()
    await setEntitlements(biz.businessId)
    const conflict = await createConflictGroup(biz, 'exclusive')
    const sitting = await createService(biz, {
      type: 'sitting', durationModel: 'overnight',
      config: { version: 1, slot_unit: 'dogs', service_limit: 9 },
      conflictGroupId: conflict,
    })
    const client = await addClient(biz)
    const runners = Array.from({ length: 6 }, () => (c: any) =>
      reserveSql(c, { businessId: biz.businessId, serviceId: sitting, clientId: client.clientId,
        start: '2028-02-20', end: '2028-02-21' }))
    const { ok, errors } = await race(runners)
    expect(ok).toBe(1)
    for (const e of errors) expect(e).toMatch(/CAPACITY_CONFLICT.*conflict group/)
  })
})

describe('tenant-safe effective availability (clients)', () => {
  it('serves availability to clients without leaking config or demand', async () => {
    const { biz, svc, clientId } = await boardingBiz(1)
    const admin = await connect()
    const client = await admin.query(
      `select base509_account_id from public.clients where id = $1`,
      [clientId],
    )
    const clientAccount = client.rows[0].base509_account_id as string
    const sub = (
      await admin.query(
        `select provider_subject from public.auth_identities where base509_account_id = $1`,
        [clientAccount],
      )
    ).rows[0].provider_subject as string
    await admin.end()

    await reserve({ businessId: biz.businessId, serviceId: svc, clientId,
      start: '2028-03-02', end: '2028-03-03' })
    await asUser(biz.owner.sub, (c) =>
      c.query(`select public.set_calendar_day($1, '2028-03-04', true)`, [biz.businessId]),
    )

    await asUser(sub, async (c) => {
      const r = await c.query(
        `select * from public.effective_availability($1, $2, '2028-03-01', '2028-03-04')
         order by service_date`,
        [biz.businessId, svc],
      )
      expect(r.rows.map((x: any) => x.available)).toEqual([true, false, true, false])
      // and that is ALL a client can see: no direct capacity reads.
      const cfg = await c.query(
        `select * from public.business_services where business_id = $1`,
        [biz.businessId],
      )
      expect(cfg.rowCount).toBe(0)
    })

    // Unrelated account: tenant-safe denial.
    const outsider = await asUser(crypto.randomUUID(), async (c) => {
      await c.query('select public.bootstrap_account()')
      await expectError(
        c.query(`select * from public.effective_availability($1, $2, '2028-03-01', '2028-03-02')`, [
          biz.businessId, svc,
        ]),
        /FORBIDDEN/,
      )
      return true
    })
    expect(outsider).toBe(true)
  })
})
