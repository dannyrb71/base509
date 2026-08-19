-- ============================================================================
-- CFG-1 §7.4 — Services, capacity/zones (relational), per-day overrides,
--              booking shells, and the internal capacity primitive
-- Spec: docs/specs/cfg-1-foundation-build-spec.md v2.1 §3.3, §5, §5A;
-- canonical model: docs/specs/capacity-model.md (ratified contract + walking/
-- zones 2026-08-18); table detail: docs/planning/data_model_draft.md (ratified
-- schema deltas).
--
-- Binding rules implemented here:
--   * capacity_group_id and conflict_group_id: two tables, two columns, two
--     tenant-composite FKs — never inferred from each other (spec §8).
--   * Occupancy is DATE-BASED: boarding [arrival, departure) half-open in the
--     business timezone; daycare exactly one service_date (never empty).
--   * Summed walking: window capacity = Σ distinct assigned walkers' effective
--     caps; zones constrain coverage; one walker never counts twice.
--   * Precedence: day assignment override → window/member override →
--     service/member default → service fallback (capacity_config).
--   * A capacity pool is required ONLY when 2+ co-located services share a
--     finite resource (capacity-model.md line 178 restored).
--   * Booking vocabulary: requested = non-reserving; approved/confirmed =
--     reserve; cancellation = release. No public booking/approve RPC exists —
--     the internal primitive checks+locks only (spec §3.3/§5).
-- ============================================================================

-- PostGIS backs server-side zone-geometry VALIDATION only (Codex re-review
-- #2); the stored canonical value remains the JSONB GeoJSON per the
-- service-area-maps.md guardrail.
create extension if not exists postgis with schema extensions;

-- ── Conflict + capacity groups (orthogonal; spec §8) ────────────────────────
create table public.availability_conflict_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  name text not null,
  overlap_policy text not null default 'exclusive'
    check (overlap_policy in ('exclusive', 'overlap_allowed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

create table public.capacity_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  name text not null,
  resource_unit text not null,
  pool_limit integer not null check (pool_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

-- ── Services (generic engine instances, D-022; pricing shell only, §3.4) ─────
create table public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_type_key text not null,
  name text not null,
  enabled boolean not null default true,
  capacity_model text not null check (capacity_model in ('bounded', 'unlimited')),
  capacity_config jsonb not null default '{}'::jsonb,
  capacity_group_id uuid,
  conflict_group_id uuid,
  duration_model text not null
    check (duration_model in ('overnight', 'fixed_window', 'slot', 'open_ended')),
  duration_config jsonb not null default '{}'::jsonb,
  visibility text not null default 'visible' check (visibility in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  -- Two independent tenant-composite FKs (never infer one from the other).
  foreign key (business_id, capacity_group_id)
    references public.capacity_groups (business_id, id),
  foreign key (business_id, conflict_group_id)
    references public.availability_conflict_groups (business_id, id)
);

create index business_services_capacity_group_idx
  on public.business_services (business_id, capacity_group_id);
create index business_services_conflict_group_idx
  on public.business_services (business_id, conflict_group_id);

-- ── Zones: reusable per-tenant pool (Zone Manager source list) ───────────────
-- Geometry contract per docs/specs/service-area-maps.md ("Guardrail — store
-- GeoJSON only", Codex 2026-08-15): each zone row persists ONE validated
-- GeoJSON Polygon/MultiPolygon (Terra Draw output; never a FeatureCollection,
-- never a provider-proprietary shape). Server-side validation below covers
-- coordinate ranges, ring closure, polygon validity/self-intersection,
-- geometry size, and max service-area extent.
create table public.service_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  name text not null,
  boundary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

-- Server-authoritative GeoJSON validation (service-area-maps.md guardrail).
-- Limits: ≤ 1000 vertices per zone (geometry size), bounding box ≤ 5.0° in
-- either axis (max service-area extent — generous for a local service area).
create or replace function app.validate_zone_boundary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_polys jsonb;
  v_poly jsonb;
  v_ring jsonb;
  v_pt jsonb;
  v_n integer;
  v_total_vertices integer := 0;
  v_lon numeric;
  v_lat numeric;
  v_min_lon numeric;
  v_max_lon numeric;
  v_min_lat numeric;
  v_max_lat numeric;
  v_area numeric;
  i integer;
  v_geom extensions.geometry;
begin
  -- A missing boundary is the NOT NULL constraint's report, not this one's.
  if new.boundary is null then
    return new;
  end if;
  if jsonb_typeof(new.boundary) <> 'object' then
    raise exception 'ZONE_BOUNDARY_INVALID: boundary must be a GeoJSON geometry object'
      using errcode = '23514';
  end if;
  v_type := new.boundary ->> 'type';
  if v_type = 'Polygon' then
    v_polys := jsonb_build_array(new.boundary -> 'coordinates');
  elsif v_type = 'MultiPolygon' then
    v_polys := new.boundary -> 'coordinates';
  else
    raise exception 'ZONE_BOUNDARY_INVALID: boundary must be a Polygon or MultiPolygon (got %)',
      coalesce(v_type, 'nothing') using errcode = '23514';
  end if;
  if v_polys is null or jsonb_typeof(v_polys) <> 'array' or jsonb_array_length(v_polys) = 0 then
    raise exception 'ZONE_BOUNDARY_INVALID: coordinates missing' using errcode = '23514';
  end if;

  for v_poly in select * from jsonb_array_elements(v_polys) loop
    if jsonb_typeof(v_poly) <> 'array' or jsonb_array_length(v_poly) = 0 then
      raise exception 'ZONE_BOUNDARY_INVALID: polygon must contain at least one ring'
        using errcode = '23514';
    end if;
    for v_ring in select * from jsonb_array_elements(v_poly) loop
      if jsonb_typeof(v_ring) <> 'array' then
        raise exception 'ZONE_BOUNDARY_INVALID: ring must be an array' using errcode = '23514';
      end if;
      v_n := jsonb_array_length(v_ring);
      -- Ring closure needs first = last, and a closed triangle needs 4 points.
      if v_n < 4 then
        raise exception 'ZONE_BOUNDARY_INVALID: ring needs at least 4 positions'
          using errcode = '23514';
      end if;
      v_total_vertices := v_total_vertices + v_n;
      if v_total_vertices > 1000 then
        raise exception 'ZONE_BOUNDARY_INVALID: geometry too large (max 1000 vertices)'
          using errcode = '23514';
      end if;

      -- Coordinate-range + shape checks.
      for i in 0 .. v_n - 1 loop
        v_pt := v_ring -> i;
        if jsonb_typeof(v_pt) <> 'array' or jsonb_array_length(v_pt) < 2
           or jsonb_typeof(v_pt -> 0) <> 'number' or jsonb_typeof(v_pt -> 1) <> 'number' then
          raise exception 'ZONE_BOUNDARY_INVALID: positions must be [lon, lat] number pairs'
            using errcode = '23514';
        end if;
        v_lon := (v_pt ->> 0)::numeric;
        v_lat := (v_pt ->> 1)::numeric;
        if v_lon < -180 or v_lon > 180 or v_lat < -90 or v_lat > 90 then
          raise exception 'ZONE_BOUNDARY_INVALID: coordinates out of range ([%, %])', v_lon, v_lat
            using errcode = '23514';
        end if;
        v_min_lon := least(coalesce(v_min_lon, v_lon), v_lon);
        v_max_lon := greatest(coalesce(v_max_lon, v_lon), v_lon);
        v_min_lat := least(coalesce(v_min_lat, v_lat), v_lat);
        v_max_lat := greatest(coalesce(v_max_lat, v_lat), v_lat);
      end loop;

      -- Ring closure.
      if (v_ring -> 0 ->> 0)::numeric is distinct from (v_ring -> (v_n - 1) ->> 0)::numeric
         or (v_ring -> 0 ->> 1)::numeric is distinct from (v_ring -> (v_n - 1) ->> 1)::numeric then
        raise exception 'ZONE_BOUNDARY_INVALID: ring is not closed (first != last position)'
          using errcode = '23514';
      end if;

      -- Non-degenerate: shoelace area must be non-zero.
      v_area := 0;
      for i in 0 .. v_n - 2 loop
        v_area := v_area
          + (v_ring -> i ->> 0)::numeric * (v_ring -> (i + 1) ->> 1)::numeric
          - (v_ring -> (i + 1) ->> 0)::numeric * (v_ring -> i ->> 1)::numeric;
      end loop;
      if v_area = 0 then
        raise exception 'ZONE_BOUNDARY_INVALID: ring has zero area' using errcode = '23514';
      end if;

    end loop;
  end loop;

  -- Max service-area extent.
  if (v_max_lon - v_min_lon) > 5.0 or (v_max_lat - v_min_lat) > 5.0 then
    raise exception 'ZONE_BOUNDARY_INVALID: service area exceeds the maximum extent (5.0 degrees)'
      using errcode = '23514';
  end if;

  -- Full geometric validity via PostGIS (Codex re-review #2): catches ring
  -- self-intersection including touching/collinear cases, holes outside the
  -- exterior ring, and invalid MultiPolygon member relationships — cases a
  -- pairwise proper-crossing check cannot. Validation only: the JSONB
  -- GeoJSON above remains the stored canonical value.
  begin
    v_geom := extensions.st_geomfromgeojson(new.boundary::text);
  exception when others then
    raise exception 'ZONE_BOUNDARY_INVALID: not a parseable GeoJSON geometry (%)', sqlerrm
      using errcode = '23514';
  end;
  if not extensions.st_isvalid(v_geom) then
    raise exception 'ZONE_BOUNDARY_INVALID: invalid geometry — %',
      extensions.st_isvalidreason(v_geom)
      using errcode = '23514';
  end if;

  return new;
end;
$$;
alter function app.validate_zone_boundary() owner to cfg1_owner;

create trigger service_zones_validate_boundary
  before insert or update of boundary on public.service_zones
  for each row execute function app.validate_zone_boundary();

-- Zone attachment level (a): the whole service.
create table public.business_service_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  business_service_id uuid not null,
  service_zone_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  foreign key (business_id, service_zone_id)
    references public.service_zones (business_id, id),
  unique (business_id, business_service_id, service_zone_id)
);

-- ── Named service windows (first-class sub-service; walking = fixed_window) ──
create table public.service_windows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  business_service_id uuid not null,
  name text not null,
  weekdays smallint[] not null default '{0,1,2,3,4,5,6}'
    check (weekdays <@ '{0,1,2,3,4,5,6}'::smallint[] and array_length(weekdays, 1) > 0),
  start_time time not null,
  end_time time not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  unique (business_id, id),
  check (end_time > start_time)
);

create index service_windows_service_idx
  on public.service_windows (business_id, business_service_id);

-- Zone attachment level (b): the named window.
create table public.service_window_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_id uuid not null,
  service_zone_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (business_id, service_window_id)
    references public.service_windows (business_id, id),
  foreign key (business_id, service_zone_id)
    references public.service_zones (business_id, id),
  unique (business_id, service_window_id, service_zone_id)
);

-- ── Per-member default caps (spec §5A explicit binding key) ──────────────────
create table public.service_member_capacity_defaults (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  business_service_id uuid not null,
  business_membership_id uuid not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  foreign key (business_id, business_membership_id)
    references public.business_memberships (business_id, id),
  unique (business_id, business_service_id, business_membership_id)
);

-- ── Window assignments (+ optional per-window member capacity override) ──────
create table public.service_window_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_id uuid not null,
  business_membership_id uuid not null,
  member_capacity_override integer check (member_capacity_override is null or member_capacity_override > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, service_window_id)
    references public.service_windows (business_id, id),
  foreign key (business_id, business_membership_id)
    references public.business_memberships (business_id, id),
  -- One member counted once per window (spec §5A).
  unique (business_id, service_window_id, business_membership_id),
  unique (business_id, id)
);

-- Zone attachment level (c): per-walker coverage within a window.
-- An assignment with NO zone rows covers every zone of the window/service.
create table public.service_window_assignment_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_assignment_id uuid not null,
  service_zone_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (business_id, service_window_assignment_id)
    references public.service_window_assignments (business_id, id) on delete cascade,
  foreign key (business_id, service_zone_id)
    references public.service_zones (business_id, id),
  unique (business_id, service_window_assignment_id, service_zone_id)
);

-- ── Per-day override tables (target-specific; capacity-model.md D-076) ───────
create table public.business_calendar_days (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_date date not null,
  all_services_blocked boolean not null default false,
  holiday_pricing text,
  note text,
  created_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, service_date),
  unique (business_id, id)
);

create table public.business_service_day_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  business_service_id uuid not null,
  service_date date not null,
  is_available boolean,
  service_limit_override integer
    check (service_limit_override is null or service_limit_override > 0),
  created_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  unique (business_id, business_service_id, service_date),
  unique (business_id, id),
  check (is_available is not null or service_limit_override is not null)
);

create table public.capacity_group_day_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  capacity_group_id uuid not null,
  service_date date not null,
  pool_limit_override integer not null check (pool_limit_override > 0),
  created_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, capacity_group_id)
    references public.capacity_groups (business_id, id),
  unique (business_id, capacity_group_id, service_date),
  unique (business_id, id)
);

create table public.service_window_day_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_id uuid not null,
  service_date date not null,
  is_available boolean not null default true,
  created_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, service_window_id)
    references public.service_windows (business_id, id),
  unique (business_id, service_window_id, service_date),
  unique (business_id, id)
);

-- A present window-day override REPLACES that date's assignment set;
-- absence falls back to the recurring assignments (capacity-model.md).
create table public.service_window_day_override_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_day_override_id uuid not null,
  business_membership_id uuid not null,
  member_capacity_override integer
    check (member_capacity_override is null or member_capacity_override > 0),
  created_at timestamptz not null default now(),
  foreign key (business_id, service_window_day_override_id)
    references public.service_window_day_overrides (business_id, id) on delete cascade,
  foreign key (business_id, business_membership_id)
    references public.business_memberships (business_id, id),
  -- Same uniqueness + tenant constraints as the recurring rows (spec §5A).
  unique (business_id, service_window_day_override_id, business_membership_id),
  unique (business_id, id)
);

create table public.service_window_day_override_assignment_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  service_window_day_override_assignment_id uuid not null,
  service_zone_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (business_id, service_window_day_override_assignment_id)
    references public.service_window_day_override_assignments (business_id, id) on delete cascade,
  foreign key (business_id, service_zone_id)
    references public.service_zones (business_id, id),
  unique (business_id, service_window_day_override_assignment_id, service_zone_id)
);

-- ── Booking shells (minimal; the seam only — spec §3.3) ──────────────────────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  client_id uuid not null,
  business_service_id uuid not null,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'confirmed', 'cancelled', 'completed')),
  start_date date not null,
  end_date date,
  -- Human over-capacity approvals require an explicit flag + immutable audit
  -- (spec §5); auto-book never sets it.
  over_capacity_ack boolean not null default false,
  over_capacity_reason text,
  created_by_account_id uuid references public.base509_accounts (base509_account_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, client_id) references public.clients (business_id, id),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  unique (business_id, id),
  check (end_date is null or end_date > start_date)
);

create index bookings_service_idx on public.bookings (business_id, business_service_id, status);
create index bookings_client_idx on public.bookings (business_id, client_id);

create table public.booking_pets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  booking_id uuid not null,
  pet_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (business_id, booking_id) references public.bookings (business_id, id),
  foreign key (business_id, pet_id) references public.pets (business_id, id),
  unique (business_id, booking_id, pet_id)
);

create table public.booking_occurrences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  booking_id uuid not null,
  business_service_id uuid not null,
  service_window_id uuid,
  service_zone_id uuid,
  unit_kind text not null check (unit_kind in ('night', 'day', 'visit', 'session')),
  service_date date not null,
  pet_count integer not null default 1 check (pet_count > 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'checked_in', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, booking_id) references public.bookings (business_id, id),
  foreign key (business_id, business_service_id)
    references public.business_services (business_id, id),
  foreign key (business_id, service_window_id)
    references public.service_windows (business_id, id),
  foreign key (business_id, service_zone_id)
    references public.service_zones (business_id, id),
  unique (business_id, id)
);

-- §6 hardening: date-bucket counting must be index-backed.
create index booking_occurrences_capacity_idx
  on public.booking_occurrences (business_id, business_service_id, service_date);
create index booking_occurrences_window_idx
  on public.booking_occurrences (business_id, service_window_id, service_date);
create index booking_occurrences_booking_idx
  on public.booking_occurrences (business_id, booking_id);

-- ── Ownership ────────────────────────────────────────────────────────────────
alter table public.availability_conflict_groups owner to cfg1_owner;
alter table public.capacity_groups owner to cfg1_owner;
alter table public.business_services owner to cfg1_owner;
alter table public.service_zones owner to cfg1_owner;
alter table public.business_service_zones owner to cfg1_owner;
alter table public.service_windows owner to cfg1_owner;
alter table public.service_window_zones owner to cfg1_owner;
alter table public.service_member_capacity_defaults owner to cfg1_owner;
alter table public.service_window_assignments owner to cfg1_owner;
alter table public.service_window_assignment_zones owner to cfg1_owner;
alter table public.business_calendar_days owner to cfg1_owner;
alter table public.business_service_day_overrides owner to cfg1_owner;
alter table public.capacity_group_day_overrides owner to cfg1_owner;
alter table public.service_window_day_overrides owner to cfg1_owner;
alter table public.service_window_day_override_assignments owner to cfg1_owner;
alter table public.service_window_day_override_assignment_zones owner to cfg1_owner;
alter table public.bookings owner to cfg1_owner;
alter table public.booking_pets owner to cfg1_owner;
alter table public.booking_occurrences owner to cfg1_owner;

-- ── Standard triggers: touch + tenant-rekey block on every table ────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'availability_conflict_groups', 'capacity_groups', 'business_services',
    'service_zones', 'business_service_zones', 'service_windows',
    'service_window_zones', 'service_member_capacity_defaults',
    'service_window_assignments', 'service_window_assignment_zones',
    'business_calendar_days', 'business_service_day_overrides',
    'capacity_group_day_overrides', 'service_window_day_overrides',
    'service_window_day_override_assignments',
    'service_window_day_override_assignment_zones',
    'bookings', 'booking_pets', 'booking_occurrences'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function app.prevent_tenant_rekey()',
      t || '_no_rekey', t
    );
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'updated_at'
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function app.touch_updated_at()',
        t || '_touch', t
      );
    end if;
  end loop;
end
$$;

-- ── capacity_config validation + pool resource-unit compatibility ────────────
create or replace function app.validate_service_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unit text;
begin
  -- Full V1 contract (capacity-model.md §6C ratified persistence contract;
  -- Codex correction #6a): supported version, every scalar field validated,
  -- positive fallback capacity.
  if new.capacity_model = 'bounded' then
    if jsonb_typeof(new.capacity_config) <> 'object' then
      raise exception 'VALIDATION_FAILED: bounded capacity_config must be an object'
        using errcode = '23514';
    end if;
    if not (new.capacity_config ? 'version')
       or jsonb_typeof(new.capacity_config -> 'version') <> 'number'
       or (new.capacity_config ->> 'version')::numeric <> 1 then
      raise exception 'VALIDATION_FAILED: capacity_config.version must be the supported version (1)'
        using errcode = '23514';
    end if;
    if coalesce(new.capacity_config ->> 'slot_unit', '') = '' then
      raise exception 'VALIDATION_FAILED: capacity_config.slot_unit is required'
        using errcode = '23514';
    end if;
    if new.capacity_config ? 'scales_with'
       and new.capacity_config ->> 'scales_with' not in ('fixed_resource', 'team') then
      raise exception 'VALIDATION_FAILED: capacity_config.scales_with must be fixed_resource or team'
        using errcode = '23514';
    end if;
    if new.capacity_config ? 'counting_basis'
       and new.capacity_config ->> 'counting_basis' not in ('concurrent', 'daily_throughput') then
      raise exception 'VALIDATION_FAILED: capacity_config.counting_basis must be concurrent or daily_throughput'
        using errcode = '23514';
    end if;
    if new.capacity_config ? 'binding_window'
       and new.capacity_config ->> 'binding_window' <> 'date_bucket' then
      raise exception 'VALIDATION_FAILED: capacity_config.binding_window must be date_bucket (V1)'
        using errcode = '23514';
    end if;
    if new.capacity_config ? 'overlap_tolerance'
       and new.capacity_config ->> 'overlap_tolerance' <> 'departure_day' then
      raise exception 'VALIDATION_FAILED: capacity_config.overlap_tolerance must be departure_day (V1)'
        using errcode = '23514';
    end if;
    if new.capacity_config ? 'service_limit' then
      if jsonb_typeof(new.capacity_config -> 'service_limit') <> 'number'
         or (new.capacity_config ->> 'service_limit')::numeric <> floor((new.capacity_config ->> 'service_limit')::numeric)
         or (new.capacity_config ->> 'service_limit')::numeric <= 0 then
        raise exception 'VALIDATION_FAILED: capacity_config.service_limit must be a positive integer'
          using errcode = '23514';
      end if;
    end if;
    -- The per-walker fallback capacity ("service fallback" in the §5A
    -- precedence chain) must be a positive integer when present.
    if new.capacity_config ? 'member_cap_default' then
      if jsonb_typeof(new.capacity_config -> 'member_cap_default') <> 'number'
         or (new.capacity_config ->> 'member_cap_default')::numeric <> floor((new.capacity_config ->> 'member_cap_default')::numeric)
         or (new.capacity_config ->> 'member_cap_default')::numeric <= 0 then
        raise exception 'VALIDATION_FAILED: capacity_config.member_cap_default must be a positive integer'
          using errcode = '23514';
      end if;
    end if;
    -- service_limit REQUIRED & positive unless staff/window-derived (team).
    if coalesce(new.capacity_config ->> 'scales_with', 'fixed_resource') <> 'team'
       and not (new.capacity_config ? 'service_limit') then
      raise exception 'VALIDATION_FAILED: bounded occupancy services require a positive capacity_config.service_limit'
        using errcode = '23514';
    end if;
  end if;

  if new.capacity_group_id is not null then
    select g.resource_unit into v_unit
    from public.capacity_groups g
    where g.business_id = new.business_id and g.id = new.capacity_group_id;
    -- A missing pool row is a (cross-tenant) reference error — leave it to
    -- the composite FK so the violation is reported as such.
    if found and v_unit is distinct from (new.capacity_config ->> 'slot_unit') then
      raise exception 'POOL_UNIT_MISMATCH: capacity_config.slot_unit must match the pool resource_unit (%)', v_unit
        using errcode = '23514';
    end if;
  end if;

  return new;
exception
  when invalid_text_representation then
    raise exception 'VALIDATION_FAILED: capacity_config numeric fields must be integers'
      using errcode = '23514';
end;
$$;
alter function app.validate_service_capacity() owner to cfg1_owner;

create trigger business_services_validate_capacity
  before insert or update on public.business_services
  for each row execute function app.validate_service_capacity();

-- ── Config-change audit (spec §5: capacity config mutations with audit) ──────
create or replace function app.audit_config_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record := coalesce(new, old);
begin
  perform app.append_audit(
    v_row.business_id,
    app.current_base509_account_id(),
    'user',
    'config.' || tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    (v_row.id)::text,
    null,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;
alter function app.audit_config_change() owner to cfg1_owner;

do $$
declare
  t text;
begin
  foreach t in array array[
    'availability_conflict_groups', 'capacity_groups', 'business_services',
    'service_zones', 'business_service_zones', 'service_windows',
    'service_window_zones', 'service_member_capacity_defaults',
    'service_window_assignments', 'service_window_assignment_zones'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function app.audit_config_change()',
      t || '_audit', t
    );
  end loop;
end
$$;

-- ── RLS + grants ─────────────────────────────────────────────────────────────
-- Config tables: staff+ read (operational visibility); Admin+ write; clients
-- never read capacity configuration, assignments, or demand (spec §4) — their
-- availability comes only from the tenant-safe RPC below.
do $$
declare
  t text;
begin
  foreach t in array array[
    'availability_conflict_groups', 'capacity_groups', 'business_services',
    'service_zones', 'business_service_zones', 'service_windows',
    'service_window_zones', 'service_member_capacity_defaults',
    'service_window_assignments', 'service_window_assignment_zones',
    'business_calendar_days', 'business_service_day_overrides',
    'capacity_group_day_overrides', 'service_window_day_overrides',
    'service_window_day_override_assignments',
    'service_window_day_override_assignment_zones',
    'bookings', 'booking_pets', 'booking_occurrences'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated, service_role', t);
  end loop;
end
$$;

-- Plain config tables: direct Admin writes (validated + audited by triggers).
do $$
declare
  t text;
begin
  foreach t in array array[
    'availability_conflict_groups', 'capacity_groups', 'business_services',
    'service_zones', 'business_service_zones', 'service_windows',
    'service_window_zones', 'service_member_capacity_defaults',
    'service_window_assignments', 'service_window_assignment_zones'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    -- Service-role/internal tooling gets NO direct DML on capacity config
    -- (Codex correction #7): it must go through the same audited,
    -- invariant-enforcing operations (the admin RLS path with its validation
    -- + audit triggers, and the typed override RPCs). RLS-bypass is not
    -- permission to bypass validation.
    execute format('grant select on public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (app.has_role(business_id, ''staff''))',
      t || '_select_staff', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app.has_role(business_id, ''admin''))',
      t || '_insert_admin', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (app.has_role(business_id, ''admin'')) with check (app.has_role(business_id, ''admin''))',
      t || '_update_admin', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (app.has_role(business_id, ''admin''))',
      t || '_delete_admin', t
    );
  end loop;
end
$$;

-- Override tables: staff+ read; NO direct writes for any API role — typed
-- server ops only (capacity-model.md CFG-1 fit), so every mutation is audited.
do $$
declare
  t text;
begin
  foreach t in array array[
    'business_calendar_days', 'business_service_day_overrides',
    'capacity_group_day_overrides', 'service_window_day_overrides',
    'service_window_day_override_assignments',
    'service_window_day_override_assignment_zones'
  ] loop
    execute format('grant select on public.%I to authenticated, service_role', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (app.has_role(business_id, ''staff''))',
      t || '_select_staff', t
    );
  end loop;
end
$$;

-- Bookings: staff+ read all; clients read their own. Staff+ create bookings;
-- clients create their own — both only in the non-reserving 'requested'
-- state (reserving transitions exist only inside the future approval
-- transaction, which calls the capacity primitive). Manager+ edit (matrix:
-- Staff cannot edit/delete); clients may cancel their own.
grant select, insert on public.bookings to authenticated;
grant update (status, start_date, end_date) on public.bookings to authenticated;
grant select on public.bookings to service_role;

create policy bookings_select_staff on public.bookings
  for select to authenticated
  using (app.has_role(business_id, 'staff'));

create policy bookings_select_client on public.bookings
  for select to authenticated
  using (client_id = app.current_client_id(business_id));

create policy bookings_insert_staff on public.bookings
  for insert to authenticated
  with check (
    app.has_role(business_id, 'staff')
    and status = 'requested'
    and over_capacity_ack = false
  );

create policy bookings_insert_client on public.bookings
  for insert to authenticated
  with check (
    client_id = app.current_client_id(business_id)
    and status = 'requested'
    and over_capacity_ack = false
  );

create policy bookings_update_manager on public.bookings
  for update to authenticated
  using (app.has_role(business_id, 'manager'))
  with check (
    app.has_role(business_id, 'manager')
    and status in ('requested', 'cancelled')
  );

create policy bookings_update_client_cancel on public.bookings
  for update to authenticated
  using (client_id = app.current_client_id(business_id))
  with check (
    client_id = app.current_client_id(business_id)
    and status = 'cancelled'
  );

-- booking_pets: staff+ or the owning client attach pets; manager+ detach.
grant select, insert, delete on public.booking_pets to authenticated;
grant select on public.booking_pets to service_role;

create policy booking_pets_select_staff on public.booking_pets
  for select to authenticated
  using (app.has_role(business_id, 'staff'));

create policy booking_pets_select_client on public.booking_pets
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.business_id = booking_pets.business_id
      and b.id = booking_pets.booking_id
      and b.client_id = app.current_client_id(b.business_id)
  ));

create policy booking_pets_insert_staff on public.booking_pets
  for insert to authenticated
  with check (app.has_role(business_id, 'staff'));

create policy booking_pets_insert_client on public.booking_pets
  for insert to authenticated
  with check (exists (
    select 1 from public.bookings b
    where b.business_id = booking_pets.business_id
      and b.id = booking_pets.booking_id
      and b.client_id = app.current_client_id(b.business_id)
      and b.status = 'requested'
  ));

create policy booking_pets_delete_manager on public.booking_pets
  for delete to authenticated
  using (app.has_role(business_id, 'manager'));

-- booking_occurrences: generated only inside the server transaction (no
-- direct writes; care-status mutations go through the typed RPC below).
grant select on public.booking_occurrences to authenticated, service_role;

create policy occurrences_select_staff on public.booking_occurrences
  for select to authenticated
  using (app.has_role(business_id, 'staff'));

create policy occurrences_select_client on public.booking_occurrences
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.business_id = booking_occurrences.business_id
      and b.id = booking_occurrences.booking_id
      and b.client_id = app.current_client_id(b.business_id)
  ));

-- ── Staff care-status mutations (distinct op; spec §4) ───────────────────────
create or replace function public.set_occurrence_care_status(
  p_business_id uuid,
  p_occurrence_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_occ public.booking_occurrences%rowtype;
begin
  perform app.require_role(p_business_id, 'staff');

  if p_status not in ('checked_in', 'completed') then
    raise exception 'VALIDATION_FAILED: care status must be checked_in or completed'
      using errcode = '22023';
  end if;

  select * into v_occ
  from public.booking_occurrences o
  where o.id = p_occurrence_id and o.business_id = p_business_id
  for update;
  if not found then
    raise exception 'NOT_FOUND: occurrence does not exist in this business' using errcode = 'P0002';
  end if;
  if v_occ.status = 'cancelled' then
    raise exception 'VALIDATION_FAILED: cancelled occurrences cannot change care status'
      using errcode = '22023';
  end if;

  update public.booking_occurrences set status = p_status where id = p_occurrence_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'occurrence.care_status', 'booking_occurrence',
    p_occurrence_id::text, null,
    jsonb_build_object('status', v_occ.status), jsonb_build_object('status', p_status)
  );
end;
$$;

-- ── Effective assignment resolution for one (window, date) ──────────────────
-- The §5A precedence chain, per walker: day-assignment override → window/
-- member (recurring) override → service/member default → service fallback
-- (capacity_config.member_cap_default). A present window-day override row
-- REPLACES the date's assignment set. Removed/inactive members contribute
-- zero (they are filtered out entirely). Used by the capacity core for the
-- per-window, per-zone, and overlapping-window sums.
create or replace function app.window_effective_assignments(
  p_business_id uuid,
  p_business_service_id uuid,
  p_service_window_id uuid,
  p_date date
)
returns table (
  business_membership_id uuid,
  assignment_id uuid,
  from_day_override boolean,
  cap integer
)
language sql
stable
security definer
set search_path = ''
rows 10
as $$
  with override_row as (
    select o.id
    from public.service_window_day_overrides o
    where o.business_id = p_business_id
      and o.service_window_id = p_service_window_id
      and o.service_date = p_date
  ),
  svc as (
    select s.capacity_config
    from public.business_services s
    where s.business_id = p_business_id and s.id = p_business_service_id
  ),
  raw as (
    -- Recurring assignments apply only when no day override replaces them.
    select a.business_membership_id,
           a.id as assignment_id,
           false as from_day_override,
           a.member_capacity_override as override_cap
    from public.service_window_assignments a
    where a.business_id = p_business_id
      and a.service_window_id = p_service_window_id
      and not exists (select 1 from override_row)
    union all
    -- Day-override assignments: an absent per-day cap falls back to the
    -- walker's RECURRING window override first (full precedence), never
    -- straight to the service default.
    select da.business_membership_id,
           da.id,
           true,
           coalesce(da.member_capacity_override, ra.member_capacity_override)
    from public.service_window_day_override_assignments da
    join override_row o on da.service_window_day_override_id = o.id
    left join public.service_window_assignments ra
      on ra.business_id = p_business_id
     and ra.service_window_id = p_service_window_id
     and ra.business_membership_id = da.business_membership_id
    where da.business_id = p_business_id
  )
  select r.business_membership_id,
         r.assignment_id,
         r.from_day_override,
         coalesce(
           r.override_cap,
           d.capacity,
           (s.capacity_config ->> 'member_cap_default')::integer
         ) as cap
  from raw r
  cross join svc s
  join public.business_memberships m
    on m.business_id = p_business_id
   and m.id = r.business_membership_id
   and m.status = 'active'
  left join public.service_member_capacity_defaults d
    on d.business_id = p_business_id
   and d.business_service_id = p_business_service_id
   and d.business_membership_id = r.business_membership_id
$$;
alter function app.window_effective_assignments(uuid, uuid, uuid, date) owner to cfg1_owner;
revoke all on function app.window_effective_assignments(uuid, uuid, uuid, date) from public;

-- ── The internal capacity primitive core (spec §5 — the ONLY capacity code) ──
-- Computes effective capacity for the requested date buckets and either
-- returns or raises a stable conflict. With p_lock, takes invariant locks in
-- deterministic order (service → conflict group → pool) so concurrent
-- reservations serialize; the same core runs lock-free for read-only
-- availability. It does NOT approve, cancel, reschedule, or invoice.
--
-- p_skip_capacity_limits is reachable ONLY through the authenticated human
-- override operation below (Codex correction #3): the core takes no actor
-- input of any kind, so the ordinary/auto path cannot bypass capacity at
-- all. Availability blocks (Block All, day/window closures, exclusive
-- conflict groups) are enforced in EVERY mode.
create or replace function app.capacity_check_core(
  p_business_id uuid,
  p_business_service_id uuid,
  p_start_date date,
  p_end_date date,
  p_pet_count integer,
  p_service_window_id uuid,
  p_service_zone_id uuid,
  p_exclude_booking_id uuid,
  p_lock boolean,
  p_skip_capacity_limits boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_svc public.business_services%rowtype;
  v_conflict public.availability_conflict_groups%rowtype;
  v_dates date[];
  v_d date;
  v_limit integer;
  v_used integer;
  v_pool_limit integer;
  v_window public.service_windows%rowtype;
  v_day_override public.business_service_day_overrides%rowtype;
  v_window_override public.service_window_day_overrides%rowtype;
  v_window_cap integer;
  v_zone_cap integer;
  v_cluster_cap integer;
  v_cluster_used integer;
  v_scales_team boolean;
begin
  if p_pet_count is null or p_pet_count <= 0 then
    raise exception 'VALIDATION_FAILED: pet_count must be positive' using errcode = '22023';
  end if;

  select * into v_svc
  from public.business_services s
  where s.id = p_business_service_id and s.business_id = p_business_id;
  if not found then
    raise exception 'NOT_FOUND: service does not exist in this business' using errcode = 'P0002';
  end if;

  -- A day override can never revive a globally disabled service.
  if not v_svc.enabled then
    raise exception 'CAPACITY_CONFLICT: service is disabled' using errcode = 'P0004';
  end if;

  -- Date buckets (business-timezone local dates; capacity-model.md ruling):
  -- overnight = [arrival, departure) half-open — same-day boarding invalid;
  -- everything else = exactly one service_date (never an empty interval).
  if v_svc.duration_model = 'overnight' then
    if p_end_date is null or p_end_date <= p_start_date then
      raise exception 'VALIDATION_FAILED: overnight stays need departure after arrival (same-day boarding is invalid — use daycare)'
        using errcode = '22023';
    end if;
    select array_agg(d::date) into v_dates
    from generate_series(p_start_date, p_end_date - 1, interval '1 day') d;
  else
    v_dates := array[p_start_date];
  end if;

  v_scales_team := coalesce(v_svc.capacity_config ->> 'scales_with', 'fixed_resource') = 'team';

  if p_service_window_id is not null then
    select * into v_window
    from public.service_windows w
    where w.id = p_service_window_id
      and w.business_id = p_business_id
      and w.business_service_id = p_business_service_id;
    if not found then
      raise exception 'NOT_FOUND: window does not belong to this service' using errcode = 'P0002';
    end if;
    if not v_window.enabled then
      raise exception 'CAPACITY_CONFLICT: window is disabled' using errcode = 'P0004';
    end if;
  elsif v_scales_team and v_svc.capacity_model = 'bounded'
        and (v_svc.capacity_config ->> 'service_limit') is null then
    raise exception 'VALIDATION_FAILED: staff/window-derived services require a service window'
      using errcode = '22023';
  end if;

  -- Zone selections bind at ALL three levels (Codex correction #2): the
  -- requested zone must exist, and where the service or the window carries
  -- an explicit zone selection, the zone must be in it (no rows at a level
  -- means that level is unrestricted). Assignment-level coverage is applied
  -- in the sums below.
  if p_service_zone_id is not null then
    if not exists (
      select 1 from public.service_zones z
      where z.business_id = p_business_id and z.id = p_service_zone_id
    ) then
      raise exception 'NOT_FOUND: zone does not exist in this business' using errcode = 'P0002';
    end if;
    if exists (
      select 1 from public.business_service_zones z
      where z.business_id = p_business_id and z.business_service_id = p_business_service_id
    ) and not exists (
      select 1 from public.business_service_zones z
      where z.business_id = p_business_id
        and z.business_service_id = p_business_service_id
        and z.service_zone_id = p_service_zone_id
    ) then
      raise exception 'CAPACITY_CONFLICT: zone is not served by this service' using errcode = 'P0004';
    end if;
    if p_service_window_id is not null and exists (
      select 1 from public.service_window_zones z
      where z.business_id = p_business_id and z.service_window_id = p_service_window_id
    ) and not exists (
      select 1 from public.service_window_zones z
      where z.business_id = p_business_id
        and z.service_window_id = p_service_window_id
        and z.service_zone_id = p_service_zone_id
    ) then
      raise exception 'CAPACITY_CONFLICT: zone is not served by this window' using errcode = 'P0004';
    end if;
  end if;

  -- Conditional pool (capacity-model.md line 178; Codex correction #5): a
  -- capacity group exists ONLY when 2+ co-located services consume the same
  -- finite resource. A lone service attached to a pool is a configuration
  -- error, rejected here in the evaluator.
  if v_svc.capacity_group_id is not null then
    if (select count(*)
        from public.business_services s2
        where s2.business_id = p_business_id
          and s2.capacity_group_id = v_svc.capacity_group_id) < 2 then
      raise exception 'POOL_MISCONFIGURED: a capacity pool requires 2+ participating services'
        using errcode = '23514';
    end if;
  end if;

  -- Deterministic lock order: service → conflict group → capacity pool.
  if p_lock then
    perform pg_advisory_xact_lock(
      hashtextextended('cfg1:cap:svc:' || p_business_id::text || ':' || p_business_service_id::text, 0)
    );
    if v_svc.conflict_group_id is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('cfg1:cap:cfl:' || p_business_id::text || ':' || v_svc.conflict_group_id::text, 0)
      );
    end if;
    if v_svc.capacity_group_id is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('cfg1:cap:pool:' || p_business_id::text || ':' || v_svc.capacity_group_id::text, 0)
      );
    end if;
  end if;

  if v_svc.conflict_group_id is not null then
    select * into v_conflict
    from public.availability_conflict_groups g
    where g.business_id = p_business_id and g.id = v_svc.conflict_group_id;
  end if;

  foreach v_d in array v_dates loop
    -- 1. Block All precedence: one flag blocks every service, including
    --    services created after the block; no override can revive the day.
    if exists (
      select 1 from public.business_calendar_days cd
      where cd.business_id = p_business_id
        and cd.service_date = v_d
        and cd.all_services_blocked
    ) then
      raise exception 'CAPACITY_CONFLICT: business is blocked on %', v_d using errcode = 'P0004';
    end if;

    -- 2. Service-day availability override (closure = is_available=false,
    --    never capacity 0).
    select * into v_day_override
    from public.business_service_day_overrides o
    where o.business_id = p_business_id
      and o.business_service_id = p_business_service_id
      and o.service_date = v_d;
    if found and v_day_override.is_available = false then
      raise exception 'CAPACITY_CONFLICT: service is unavailable on %', v_d using errcode = 'P0004';
    end if;

    -- 3. Window availability on this date (weekday schedule + day override).
    if p_service_window_id is not null then
      if not (extract(dow from v_d)::smallint = any (v_window.weekdays)) then
        raise exception 'CAPACITY_CONFLICT: window does not run on %', v_d using errcode = 'P0004';
      end if;
      select * into v_window_override
      from public.service_window_day_overrides o
      where o.business_id = p_business_id
        and o.service_window_id = p_service_window_id
        and o.service_date = v_d;
      if found and not v_window_override.is_available then
        raise exception 'CAPACITY_CONFLICT: window is unavailable on %', v_d using errcode = 'P0004';
      end if;
    end if;

    -- 4. Conflict-group exclusivity (scheduling, independent of capacity).
    if v_conflict.id is not null and v_conflict.overlap_policy = 'exclusive' then
      if exists (
        select 1
        from public.booking_occurrences o
        join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
        join public.business_services s2
          on s2.business_id = o.business_id and s2.id = o.business_service_id
        where o.business_id = p_business_id
          and s2.conflict_group_id = v_conflict.id
          and o.service_date = v_d
          and o.status <> 'cancelled'
          and b.status in ('approved', 'confirmed')
          and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      ) then
        raise exception 'CAPACITY_CONFLICT: exclusive conflict group already engaged on %', v_d
          using errcode = 'P0004';
      end if;
    end if;

    if not p_skip_capacity_limits then
      -- 5. Service limit (date-bucket occupancy). Fixed-resource: scalar
      --    limit with day override; team: summed distinct walkers.
      if v_svc.capacity_model = 'bounded' then
        if not v_scales_team or p_service_window_id is null then
          v_limit := coalesce(
            v_day_override.service_limit_override,
            (v_svc.capacity_config ->> 'service_limit')::integer
          );
          if v_limit is not null then
            select coalesce(sum(o.pet_count), 0) into v_used
            from public.booking_occurrences o
            join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
            where o.business_id = p_business_id
              and o.business_service_id = p_business_service_id
              and o.service_date = v_d
              and o.status <> 'cancelled'
              and b.status in ('approved', 'confirmed')
              and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id);
            if v_used + p_pet_count > v_limit then
              raise exception 'CAPACITY_CONFLICT: service capacity %/% on %', v_used, v_limit, v_d
                using errcode = 'P0004';
            end if;
          end if;
        end if;

        if v_scales_team and p_service_window_id is not null then
          -- Effective walking capacity = Σ distinct assigned walkers'
          -- effective caps, resolved via app.window_effective_assignments
          -- (full §5A precedence; inactive members contribute zero).
          select
            coalesce(sum(ea.cap), 0),
            coalesce(sum(ea.cap) filter (where
              p_service_zone_id is null
              or case when ea.from_day_override then
                not exists (
                  select 1 from public.service_window_day_override_assignment_zones z
                  where z.business_id = p_business_id
                    and z.service_window_day_override_assignment_id = ea.assignment_id
                )
                or exists (
                  select 1 from public.service_window_day_override_assignment_zones z
                  where z.business_id = p_business_id
                    and z.service_window_day_override_assignment_id = ea.assignment_id
                    and z.service_zone_id = p_service_zone_id
                )
              else
                not exists (
                  select 1 from public.service_window_assignment_zones z
                  where z.business_id = p_business_id
                    and z.service_window_assignment_id = ea.assignment_id
                )
                or exists (
                  select 1 from public.service_window_assignment_zones z
                  where z.business_id = p_business_id
                    and z.service_window_assignment_id = ea.assignment_id
                    and z.service_zone_id = p_service_zone_id
                )
              end
            ), 0)
          into v_window_cap, v_zone_cap
          from app.window_effective_assignments(
            p_business_id, p_business_service_id, p_service_window_id, v_d
          ) ea
          where ea.cap is not null;

          -- Window total demand vs summed capacity.
          select coalesce(sum(o.pet_count), 0) into v_used
          from public.booking_occurrences o
          join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
          where o.business_id = p_business_id
            and o.service_window_id = p_service_window_id
            and o.service_date = v_d
            and o.status <> 'cancelled'
            and b.status in ('approved', 'confirmed')
            and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id);
          if v_used + p_pet_count > v_window_cap then
            raise exception 'CAPACITY_CONFLICT: window capacity %/% on %', v_used, v_window_cap, v_d
              using errcode = 'P0004';
          end if;

          -- Zone-filtered demand vs the caps of walkers covering that zone.
          if p_service_zone_id is not null then
            select coalesce(sum(o.pet_count), 0) into v_used
            from public.booking_occurrences o
            join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
            where o.business_id = p_business_id
              and o.service_window_id = p_service_window_id
              and o.service_zone_id = p_service_zone_id
              and o.service_date = v_d
              and o.status <> 'cancelled'
              and b.status in ('approved', 'confirmed')
              and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id);
            if v_used + p_pet_count > v_zone_cap then
              raise exception 'CAPACITY_CONFLICT: zone capacity %/% on %', v_used, v_zone_cap, v_d
                using errcode = 'P0004';
            end if;
          end if;

          -- Overlapping-window constraint (ratified: "a staff member on
          -- overlapping windows/zones is counted ONCE"): across every window
          -- of this service that overlaps this one in time on this date,
          -- each distinct walker contributes at most one effective cap (the
          -- largest of their per-window caps), and total demand across the
          -- overlap cluster must fit under that de-duplicated sum.
          select coalesce(sum(x.walker_cap), 0) into v_cluster_cap
          from (
            select ea.business_membership_id, max(ea.cap) as walker_cap
            from public.service_windows w2
            cross join lateral app.window_effective_assignments(
              p_business_id, p_business_service_id, w2.id, v_d
            ) ea
            where w2.business_id = p_business_id
              and w2.business_service_id = p_business_service_id
              and w2.enabled
              and extract(dow from v_d)::smallint = any (w2.weekdays)
              and w2.start_time < v_window.end_time
              and w2.end_time > v_window.start_time
              and not exists (
                select 1 from public.service_window_day_overrides o
                where o.business_id = p_business_id
                  and o.service_window_id = w2.id
                  and o.service_date = v_d
                  and o.is_available = false
              )
              and ea.cap is not null
            group by ea.business_membership_id
          ) x;

          select coalesce(sum(o.pet_count), 0) into v_cluster_used
          from public.booking_occurrences o
          join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
          join public.service_windows w2
            on w2.business_id = o.business_id and w2.id = o.service_window_id
          where o.business_id = p_business_id
            and o.business_service_id = p_business_service_id
            and o.service_date = v_d
            and o.status <> 'cancelled'
            and b.status in ('approved', 'confirmed')
            and w2.start_time < v_window.end_time
            and w2.end_time > v_window.start_time
            and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id);
          if v_cluster_used + p_pet_count > v_cluster_cap then
            raise exception 'CAPACITY_CONFLICT: overlapping windows share walkers (%/% on %)',
              v_cluster_used, v_cluster_cap, v_d
              using errcode = 'P0004';
          end if;
        end if;
      end if;

      -- 6. Shared pool (conditional: exists only when 2+ services share it).
      --    Service and pool limits are independent and jointly enforced.
      if v_svc.capacity_group_id is not null then
        select coalesce(
          (select o.pool_limit_override
           from public.capacity_group_day_overrides o
           where o.business_id = p_business_id
             and o.capacity_group_id = v_svc.capacity_group_id
             and o.service_date = v_d),
          g.pool_limit
        ) into v_pool_limit
        from public.capacity_groups g
        where g.business_id = p_business_id and g.id = v_svc.capacity_group_id;

        select coalesce(sum(o.pet_count), 0) into v_used
        from public.booking_occurrences o
        join public.bookings b on b.business_id = o.business_id and b.id = o.booking_id
        join public.business_services s2
          on s2.business_id = o.business_id and s2.id = o.business_service_id
        where o.business_id = p_business_id
          and s2.capacity_group_id = v_svc.capacity_group_id
          and o.service_date = v_d
          and o.status <> 'cancelled'
          and b.status in ('approved', 'confirmed')
          and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id);
        if v_used + p_pet_count > v_pool_limit then
          raise exception 'CAPACITY_CONFLICT: pool capacity %/% on %', v_used, v_pool_limit, v_d
            using errcode = 'P0004';
        end if;
      end if;
    end if;
  end loop;

end;
$$;
alter function app.capacity_check_core(uuid, uuid, date, date, integer, uuid, uuid, uuid, boolean, boolean) owner to cfg1_owner;
revoke all on function app.capacity_check_core(uuid, uuid, date, date, integer, uuid, uuid, uuid, boolean, boolean) from public;

-- The ordinary primitive: full enforcement, no override input of any kind.
-- Machine/auto callers cannot bypass capacity at all (Codex correction #3).
create or replace function app.capacity_check(
  p_business_id uuid,
  p_business_service_id uuid,
  p_start_date date,
  p_end_date date,
  p_pet_count integer,
  p_service_window_id uuid default null,
  p_service_zone_id uuid default null,
  p_exclude_booking_id uuid default null,
  p_lock boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.capacity_check_core(
    p_business_id, p_business_service_id, p_start_date, p_end_date, p_pet_count,
    p_service_window_id, p_service_zone_id, p_exclude_booking_id, p_lock, false
  );
end;
$$;
alter function app.capacity_check(uuid, uuid, date, date, integer, uuid, uuid, uuid, boolean) owner to cfg1_owner;
revoke all on function app.capacity_check(uuid, uuid, date, date, integer, uuid, uuid, uuid, boolean) from public;

-- ── Human over-capacity approval (distinct authenticated op; spec §5) ────────
-- The ONLY path that may relax capacity limits. The actor is DERIVED FROM THE
-- AUTHENTICATED SESSION — never accepted as input — and must hold an
-- authorized scheduling role (Manager+ per the roles doc: managers run
-- day-to-day booking approval; over-capacity is the "Approve anyway" human
-- decision, capacity-model.md §6). Requires an explicit reason; appends the
-- mandatory immutable audit event atomically with the check, while the
-- invariant locks are held. Availability blocks (Block All, closures,
-- exclusive conflict groups) still bind — only numeric capacity is relaxed.
-- Machine identities (service_role and other workload sessions) resolve no
-- account and are refused before any check runs.
create or replace function app.capacity_check_human_override(
  p_business_id uuid,
  p_business_service_id uuid,
  p_start_date date,
  p_end_date date,
  p_pet_count integer,
  p_service_window_id uuid default null,
  p_service_zone_id uuid default null,
  p_exclude_booking_id uuid default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := app.require_account();
  perform app.require_role(p_business_id, 'manager');

  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'VALIDATION_FAILED: over-capacity approval requires an explicit reason'
      using errcode = '22023';
  end if;

  perform app.capacity_check_core(
    p_business_id, p_business_service_id, p_start_date, p_end_date, p_pet_count,
    p_service_window_id, p_service_zone_id, p_exclude_booking_id, true, true
  );

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'capacity.over_capacity_override',
    'business_service', p_business_service_id::text, p_reason,
    null,
    jsonb_build_object(
      'start_date', p_start_date, 'end_date', p_end_date,
      'pet_count', p_pet_count, 'service_window_id', p_service_window_id
    )
  );
end;
$$;
alter function app.capacity_check_human_override(uuid, uuid, date, date, integer, uuid, uuid, uuid, text) owner to cfg1_owner;
revoke all on function app.capacity_check_human_override(uuid, uuid, date, date, integer, uuid, uuid, uuid, text) from public;
grant execute on function app.capacity_check_human_override(uuid, uuid, date, date, integer, uuid, uuid, uuid, text) to authenticated;

-- ── Tenant-safe effective availability for clients (spec §4) ─────────────────
-- Returns only per-date availability — no capacity configuration, staff
-- assignments, or other-client demand.
create or replace function public.effective_availability(
  p_business_id uuid,
  p_business_service_id uuid,
  p_start_date date,
  p_end_date date,
  p_service_window_id uuid default null,
  p_service_zone_id uuid default null,
  p_pet_count integer default 1
)
returns table (service_date date, available boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_d date;
  v_is_member boolean;
  v_is_client boolean;
  v_overnight boolean;
begin
  perform app.require_account();
  v_is_member := app.current_membership(p_business_id) is not null;
  v_is_client := app.current_client_id(p_business_id) is not null;
  if not v_is_member and not v_is_client then
    raise exception 'FORBIDDEN: no relationship with this business' using errcode = '42501';
  end if;

  if p_end_date < p_start_date or p_end_date - p_start_date > 366 then
    raise exception 'VALIDATION_FAILED: invalid date range' using errcode = '22023';
  end if;

  select s.duration_model = 'overnight' into v_overnight
  from public.business_services s
  where s.id = p_business_service_id and s.business_id = p_business_id;
  if not found then
    raise exception 'NOT_FOUND: service does not exist in this business' using errcode = 'P0002';
  end if;

  for v_d in select d::date from generate_series(p_start_date, p_end_date, interval '1 day') d loop
    begin
      perform app.capacity_check(
        p_business_id, p_business_service_id,
        v_d, case when v_overnight then v_d + 1 else null end,
        p_pet_count, p_service_window_id, p_service_zone_id,
        null, false
      );
      service_date := v_d; available := true;
    exception
      when sqlstate 'P0004' then
        service_date := v_d; available := false;
    end;
    return next;
  end loop;
end;
$$;

-- ── Override mutation ops (typed, audited; spec §5) ──────────────────────────
create or replace function public.set_calendar_day(
  p_business_id uuid,
  p_service_date date,
  p_all_services_blocked boolean,
  p_holiday_pricing text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_before jsonb;
  v_id uuid;
begin
  perform app.require_role(p_business_id, 'admin');
  perform 1 from public.businesses b where b.id = p_business_id for update;

  select to_jsonb(cd) into v_before
  from public.business_calendar_days cd
  where cd.business_id = p_business_id and cd.service_date = p_service_date;

  insert into public.business_calendar_days as cd (
    business_id, service_date, all_services_blocked, holiday_pricing, note, created_by_account_id
  ) values (
    p_business_id, p_service_date, p_all_services_blocked, p_holiday_pricing, p_note, v_actor
  )
  on conflict (business_id, service_date) do update
    set all_services_blocked = excluded.all_services_blocked,
        holiday_pricing = excluded.holiday_pricing,
        note = excluded.note
  returning cd.id into v_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'override.calendar_day.set', 'business_calendar_days',
    v_id::text, null, v_before,
    jsonb_build_object('service_date', p_service_date,
                       'all_services_blocked', p_all_services_blocked,
                       'holiday_pricing', p_holiday_pricing, 'note', p_note)
  );
  return v_id;
end;
$$;

create or replace function public.set_service_day_override(
  p_business_id uuid,
  p_business_service_id uuid,
  p_service_date date,
  p_is_available boolean default null,
  p_service_limit_override integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_before jsonb;
  v_id uuid;
begin
  perform app.require_role(p_business_id, 'admin');
  perform 1 from public.businesses b where b.id = p_business_id for update;

  if p_is_available is null and p_service_limit_override is null then
    raise exception 'VALIDATION_FAILED: an override must set availability or a limit'
      using errcode = '22023';
  end if;

  select to_jsonb(o) into v_before
  from public.business_service_day_overrides o
  where o.business_id = p_business_id
    and o.business_service_id = p_business_service_id
    and o.service_date = p_service_date;

  -- Lowering below booked occupancy is allowed: it marks the day
  -- over-capacity and blocks further approvals; it never cancels bookings.
  insert into public.business_service_day_overrides as o (
    business_id, business_service_id, service_date, is_available,
    service_limit_override, created_by_account_id
  ) values (
    p_business_id, p_business_service_id, p_service_date, p_is_available,
    p_service_limit_override, v_actor
  )
  on conflict (business_id, business_service_id, service_date) do update
    set is_available = excluded.is_available,
        service_limit_override = excluded.service_limit_override
  returning o.id into v_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'override.service_day.set', 'business_service_day_overrides',
    v_id::text, null, v_before,
    jsonb_build_object('business_service_id', p_business_service_id,
                       'service_date', p_service_date, 'is_available', p_is_available,
                       'service_limit_override', p_service_limit_override)
  );
  return v_id;
end;
$$;

create or replace function public.set_pool_day_override(
  p_business_id uuid,
  p_capacity_group_id uuid,
  p_service_date date,
  p_pool_limit_override integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_before jsonb;
  v_id uuid;
begin
  perform app.require_role(p_business_id, 'admin');
  perform 1 from public.businesses b where b.id = p_business_id for update;

  select to_jsonb(o) into v_before
  from public.capacity_group_day_overrides o
  where o.business_id = p_business_id
    and o.capacity_group_id = p_capacity_group_id
    and o.service_date = p_service_date;

  insert into public.capacity_group_day_overrides as o (
    business_id, capacity_group_id, service_date, pool_limit_override, created_by_account_id
  ) values (
    p_business_id, p_capacity_group_id, p_service_date, p_pool_limit_override, v_actor
  )
  on conflict (business_id, capacity_group_id, service_date) do update
    set pool_limit_override = excluded.pool_limit_override
  returning o.id into v_id;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'override.pool_day.set', 'capacity_group_day_overrides',
    v_id::text, null, v_before,
    jsonb_build_object('capacity_group_id', p_capacity_group_id,
                       'service_date', p_service_date,
                       'pool_limit_override', p_pool_limit_override)
  );
  return v_id;
end;
$$;

-- Assignments payload: [{"membership_id": uuid, "capacity_override": int|null,
-- "zone_ids": [uuid, …]}]. A present override REPLACES the date's assignment
-- set; membership/zone references are tenant-composite-FK validated.
create or replace function public.set_window_day_override(
  p_business_id uuid,
  p_service_window_id uuid,
  p_service_date date,
  p_is_available boolean,
  p_assignments jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_before jsonb;
  v_id uuid;
  v_assignment jsonb;
  v_assignment_id uuid;
  v_zone jsonb;
begin
  perform app.require_role(p_business_id, 'admin');
  perform 1 from public.businesses b where b.id = p_business_id for update;

  if not exists (
    select 1 from public.service_windows w
    where w.id = p_service_window_id and w.business_id = p_business_id
  ) then
    raise exception 'NOT_FOUND: window does not exist in this business' using errcode = 'P0002';
  end if;

  select to_jsonb(o) into v_before
  from public.service_window_day_overrides o
  where o.business_id = p_business_id
    and o.service_window_id = p_service_window_id
    and o.service_date = p_service_date;

  insert into public.service_window_day_overrides as o (
    business_id, service_window_id, service_date, is_available, created_by_account_id
  ) values (
    p_business_id, p_service_window_id, p_service_date, p_is_available, v_actor
  )
  on conflict (business_id, service_window_id, service_date) do update
    set is_available = excluded.is_available
  returning o.id into v_id;

  -- Replace the override's assignment set (cascade clears zone links).
  delete from public.service_window_day_override_assignments da
  where da.business_id = p_business_id
    and da.service_window_day_override_id = v_id;

  if p_assignments is not null then
    if jsonb_typeof(p_assignments) <> 'array' then
      raise exception 'VALIDATION_FAILED: assignments must be an array' using errcode = '22023';
    end if;
    for v_assignment in select * from jsonb_array_elements(p_assignments) loop
      insert into public.service_window_day_override_assignments (
        business_id, service_window_day_override_id, business_membership_id, member_capacity_override
      ) values (
        p_business_id, v_id,
        (v_assignment ->> 'membership_id')::uuid,
        (v_assignment ->> 'capacity_override')::integer
      )
      returning id into v_assignment_id;

      if v_assignment ? 'zone_ids' then
        for v_zone in select * from jsonb_array_elements(v_assignment -> 'zone_ids') loop
          insert into public.service_window_day_override_assignment_zones (
            business_id, service_window_day_override_assignment_id, service_zone_id
          ) values (
            p_business_id, v_assignment_id, (v_zone #>> '{}')::uuid
          );
        end loop;
      end if;
    end loop;
  end if;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'override.window_day.set', 'service_window_day_overrides',
    v_id::text, null, v_before,
    jsonb_build_object('service_window_id', p_service_window_id,
                       'service_date', p_service_date, 'is_available', p_is_available,
                       'assignments', p_assignments)
  );
  return v_id;
end;
$$;

-- Reset = delete the active override row AND append the mandatory audit event
-- (spec §5). Falls back to defaults; raises if there is nothing to reset.
create or replace function public.reset_day_override(
  p_business_id uuid,
  p_kind text,
  p_target_id uuid,
  p_service_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app.require_account();
  v_before jsonb;
begin
  perform app.require_role(p_business_id, 'admin');
  perform 1 from public.businesses b where b.id = p_business_id for update;

  if p_kind = 'calendar_day' then
    delete from public.business_calendar_days cd
    where cd.business_id = p_business_id and cd.service_date = p_service_date
    returning to_jsonb(cd) into v_before;
  elsif p_kind = 'service_day' then
    delete from public.business_service_day_overrides o
    where o.business_id = p_business_id
      and o.business_service_id = p_target_id
      and o.service_date = p_service_date
    returning to_jsonb(o) into v_before;
  elsif p_kind = 'pool_day' then
    delete from public.capacity_group_day_overrides o
    where o.business_id = p_business_id
      and o.capacity_group_id = p_target_id
      and o.service_date = p_service_date
    returning to_jsonb(o) into v_before;
  elsif p_kind = 'window_day' then
    delete from public.service_window_day_overrides o
    where o.business_id = p_business_id
      and o.service_window_id = p_target_id
      and o.service_date = p_service_date
    returning to_jsonb(o) into v_before;
  else
    raise exception 'VALIDATION_FAILED: unknown override kind %', p_kind using errcode = '22023';
  end if;

  if v_before is null then
    raise exception 'NOT_FOUND: no override to reset' using errcode = 'P0002';
  end if;

  perform app.append_audit(
    p_business_id, v_actor, 'user', 'override.' || p_kind || '.reset', p_kind,
    p_target_id::text, null, v_before,
    jsonb_build_object('service_date', p_service_date)
  );
end;
$$;

alter function public.set_occurrence_care_status(uuid, uuid, text) owner to cfg1_owner;
alter function public.effective_availability(uuid, uuid, date, date, uuid, uuid, integer) owner to cfg1_owner;
alter function public.set_calendar_day(uuid, date, boolean, text, text) owner to cfg1_owner;
alter function public.set_service_day_override(uuid, uuid, date, boolean, integer) owner to cfg1_owner;
alter function public.set_pool_day_override(uuid, uuid, date, integer) owner to cfg1_owner;
alter function public.set_window_day_override(uuid, uuid, date, boolean, jsonb) owner to cfg1_owner;
alter function public.reset_day_override(uuid, text, uuid, date) owner to cfg1_owner;

revoke all on function public.set_occurrence_care_status(uuid, uuid, text) from public, anon;
revoke all on function public.effective_availability(uuid, uuid, date, date, uuid, uuid, integer) from public, anon;
revoke all on function public.set_calendar_day(uuid, date, boolean, text, text) from public, anon;
revoke all on function public.set_service_day_override(uuid, uuid, date, boolean, integer) from public, anon;
revoke all on function public.set_pool_day_override(uuid, uuid, date, integer) from public, anon;
revoke all on function public.set_window_day_override(uuid, uuid, date, boolean, jsonb) from public, anon;
revoke all on function public.reset_day_override(uuid, text, uuid, date) from public, anon;

grant execute on function public.set_occurrence_care_status(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.effective_availability(uuid, uuid, date, date, uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.set_calendar_day(uuid, date, boolean, text, text) to authenticated, service_role;
grant execute on function public.set_service_day_override(uuid, uuid, date, boolean, integer) to authenticated, service_role;
grant execute on function public.set_pool_day_override(uuid, uuid, date, integer) to authenticated, service_role;
grant execute on function public.set_window_day_override(uuid, uuid, date, boolean, jsonb) to authenticated, service_role;
grant execute on function public.reset_day_override(uuid, text, uuid, date) to authenticated, service_role;
