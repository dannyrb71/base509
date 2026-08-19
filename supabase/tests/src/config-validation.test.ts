// CFG-1 §6 gate — Schema boundary validation (Codex #6)
// (a) capacity_config: supported version + every V1 scalar field + positive
//     fallback capacity (capacity-model.md §6C persistence contract)
// (b) service_zones.boundary: one validated GeoJSON Polygon/MultiPolygon per
//     zone with server-side validation of coordinate ranges, ring closure,
//     validity/self-intersection, size, and max extent
//     (service-area-maps.md "Guardrail — store GeoJSON only")
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asUser, closeAll, expectError } from './db'
import { newBusiness, setEntitlements, validBoundary, type BusinessFixture } from './fixtures'

let biz: BusinessFixture

beforeAll(async () => {
  biz = await newBusiness('Config validation')
  await setEntitlements(biz.businessId)
}, 60_000)

afterAll(closeAll)

function insertService(config: unknown, model = 'bounded'): Promise<unknown> {
  return asUser(biz.owner.sub, (c) =>
    c.query(
      `insert into public.business_services
         (business_id, service_type_key, name, capacity_model, capacity_config, duration_model)
       values ($1, 'boarding', 'svc-' || gen_random_uuid(), $2, $3, 'overnight')`,
      [biz.businessId, model, JSON.stringify(config)],
    ),
  )
}

describe('capacity_config V1 validation (Codex #6a)', () => {
  it('accepts a fully-specified valid V1 config', async () => {
    await insertService({
      version: 1, slot_unit: 'dogs', counting_basis: 'concurrent',
      scales_with: 'fixed_resource', service_limit: 5,
      binding_window: 'date_bucket', overlap_tolerance: 'departure_day',
    })
  })

  it('rejects an unsupported version', async () => {
    await expectError(
      insertService({ version: 2, slot_unit: 'dogs', service_limit: 5 }),
      /VALIDATION_FAILED.*supported version/,
    )
    await expectError(
      insertService({ version: '1', slot_unit: 'dogs', service_limit: 5 }),
      /VALIDATION_FAILED.*supported version/,
    )
    await expectError(
      insertService({ slot_unit: 'dogs', service_limit: 5 }),
      /VALIDATION_FAILED.*supported version/,
    )
  })

  it('rejects a missing slot_unit', async () => {
    await expectError(
      insertService({ version: 1, service_limit: 5 }),
      /VALIDATION_FAILED.*slot_unit/,
    )
  })

  it('rejects unknown scalar values for every V1 field', async () => {
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 5, scales_with: 'banana' }),
      /VALIDATION_FAILED.*scales_with/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 5, counting_basis: 'sometimes' }),
      /VALIDATION_FAILED.*counting_basis/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 5, binding_window: 'hourly' }),
      /VALIDATION_FAILED.*binding_window/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 5, overlap_tolerance: 'minutes' }),
      /VALIDATION_FAILED.*overlap_tolerance/,
    )
  })

  it('service_limit must be a positive integer (required for occupancy services)', async () => {
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 0 }),
      /VALIDATION_FAILED.*service_limit/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: 2.5 }),
      /VALIDATION_FAILED.*service_limit/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', service_limit: '5' }),
      /VALIDATION_FAILED.*service_limit/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs' }),
      /VALIDATION_FAILED.*service_limit/,
    )
  })

  it('the per-walker fallback capacity must be a positive integer when present', async () => {
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', scales_with: 'team', member_cap_default: 0 }),
      /VALIDATION_FAILED.*member_cap_default/,
    )
    await expectError(
      insertService({ version: 1, slot_unit: 'dogs', scales_with: 'team', member_cap_default: '6' }),
      /VALIDATION_FAILED.*member_cap_default/,
    )
    await insertService({ version: 1, slot_unit: 'dogs', scales_with: 'team', member_cap_default: 6 })
  })

  it('unlimited services skip bounded validation', async () => {
    await insertService({}, 'unlimited')
  })
})

describe('service_zones GeoJSON boundary (Codex #6b)', () => {
  let n = 0
  function insertZone(boundary: unknown): Promise<unknown> {
    return asUser(biz.owner.sub, (c) =>
      c.query(
        `insert into public.service_zones (business_id, name, boundary)
         values ($1, $2, $3)`,
        [biz.businessId, `zone-${++n}-${Date.now()}`, JSON.stringify(boundary)],
      ),
    )
  }

  it('accepts a valid Polygon and a valid MultiPolygon', async () => {
    await insertZone(validBoundary(50))
    await insertZone({
      type: 'MultiPolygon',
      coordinates: [
        (validBoundary(51) as any).coordinates,
        (validBoundary(52) as any).coordinates,
      ],
    })
  })

  it('boundary is required (NOT NULL)', async () => {
    await expectError(
      asUser(biz.owner.sub, (c) =>
        c.query(
          `insert into public.service_zones (business_id, name) values ($1, 'nogeom')`,
          [biz.businessId],
        ),
      ),
      /null value|not-null/,
    )
  })

  it('rejects non-Polygon geometry types and malformed shapes', async () => {
    await expectError(
      insertZone({ type: 'Point', coordinates: [-122.4, 37.7] }),
      /ZONE_BOUNDARY_INVALID.*Polygon or MultiPolygon/,
    )
    await expectError(insertZone({ type: 'Polygon' }), /ZONE_BOUNDARY_INVALID/)
    await expectError(insertZone('not-an-object'), /ZONE_BOUNDARY_INVALID/)
    await expectError(
      insertZone({
        type: 'FeatureCollection',
        features: [],
      }),
      /ZONE_BOUNDARY_INVALID/,
    )
  })

  it('rejects out-of-range coordinates', async () => {
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[200, 37.75], [200.01, 37.75], [200.01, 37.76], [200, 37.75]]],
      }),
      /ZONE_BOUNDARY_INVALID.*out of range/,
    )
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[-122.4, 95], [-122.39, 95], [-122.39, 96], [-122.4, 95]]],
      }),
      /ZONE_BOUNDARY_INVALID.*out of range/,
    )
  })

  it('rejects unclosed and undersized rings', async () => {
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[-122.4, 37.75], [-122.39, 37.75], [-122.39, 37.76], [-122.4, 37.76]]],
      }),
      /ZONE_BOUNDARY_INVALID.*not closed/,
    )
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[-122.4, 37.75], [-122.39, 37.75], [-122.4, 37.75]]],
      }),
      /ZONE_BOUNDARY_INVALID.*at least 4/,
    )
  })

  it('rejects self-intersecting (bowtie) rings and zero-area rings', async () => {
    // Unequal-lobe bowtie: crossing segments, non-zero shoelace area — the
    // PostGIS validity check must catch it.
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[0, 0], [2, 2], [2, 0], [0, 1], [0, 0]]],
      }),
      /ZONE_BOUNDARY_INVALID.*[Ss]elf.?intersect/,
    )
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 1], [2, 2], [0, 0]]],
      }),
      /ZONE_BOUNDARY_INVALID.*zero area/,
    )
  })

  it('rejects a hole lying outside the exterior ring (Codex re-review #2)', async () => {
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [
          [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], // exterior unit square
          [[3, 3], [3.2, 3], [3.2, 3.2], [3, 3.2], [3, 3]], // hole far outside
        ],
      }),
      /ZONE_BOUNDARY_INVALID.*invalid geometry/,
    )
    // A hole INSIDE the shell is legitimate geometry.
    await insertZone({
      type: 'Polygon',
      coordinates: [
        [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
        [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6], [0.4, 0.4]],
      ],
    })
  })

  it('rejects overlapping MultiPolygon members (Codex re-review #2)', async () => {
    await expectError(
      insertZone({
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
          [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]], // overlaps the first
        ],
      }),
      /ZONE_BOUNDARY_INVALID.*invalid geometry/,
    )
  })

  it('rejects touching/collinear ring self-intersection (Codex re-review #2)', async () => {
    // Figure-eight passing twice through the same interior vertex (2,2):
    // no proper segment crossing, so only true validity checking catches it.
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[0, 0], [2, 2], [0, 4], [4, 4], [2, 2], [4, 0], [0, 0]]],
      }),
      /ZONE_BOUNDARY_INVALID.*invalid geometry/,
    )
  })

  it('rejects geometry over the size limit and over the max extent', async () => {
    // 1100-vertex ring (valid circle-ish shape, but too many vertices).
    const big: number[][] = []
    for (let i = 0; i < 1100; i++) {
      const a = (2 * Math.PI * i) / 1100
      big.push([-122.4 + 0.5 * Math.cos(a), 37.7 + 0.5 * Math.sin(a)])
    }
    big.push(big[0]!)
    await expectError(
      insertZone({ type: 'Polygon', coordinates: [big] }),
      /ZONE_BOUNDARY_INVALID.*too large/,
    )
    // A 10-degree square exceeds the max service-area extent.
    await expectError(
      insertZone({
        type: 'Polygon',
        coordinates: [[[-125, 30], [-115, 30], [-115, 40], [-125, 40], [-125, 30]]],
      }),
      /ZONE_BOUNDARY_INVALID.*maximum extent/,
    )
  })
})
