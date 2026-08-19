-- ============================================================================
-- Privileged capacity test wrappers — TEST HARNESS ONLY, never a migration.
--
-- Spec §5: "CFG-1 concurrency tests exercise the primitive through a
-- privileged test wrapper that performs the fixture reservation while holding
-- those locks (since no public reserve path exists yet)."
--
-- Two wrappers mirror the two future booking-transaction shapes:
--   * reserve_fixture — the ordinary path. Calls app.capacity_check (which
--     accepts NO override input of any kind) and inserts the booking +
--     occurrences in the same transaction. service_role only.
--   * reserve_fixture_over_capacity — the human path. Calls
--     app.capacity_check_human_override, which derives the actor from the
--     AUTHENTICATED SESSION, verifies Manager+, requires a reason, and audits
--     atomically. authenticated only — a machine identity cannot invoke it.
-- ============================================================================

create schema if not exists test_harness;
alter schema test_harness owner to cfg1_owner;

create or replace function test_harness.reserve_fixture(
  p_business_id uuid,
  p_business_service_id uuid,
  p_client_id uuid,
  p_start_date date,
  p_end_date date default null,
  p_pet_count integer default 1,
  p_service_window_id uuid default null,
  p_service_zone_id uuid default null,
  p_status text default 'confirmed'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_svc public.business_services%rowtype;
  v_booking uuid;
  v_dates date[];
  v_d date;
  v_unit text;
begin
  select * into v_svc
  from public.business_services s
  where s.id = p_business_service_id and s.business_id = p_business_id;
  if not found then
    raise exception 'NOT_FOUND: service does not exist in this business' using errcode = 'P0002';
  end if;

  -- Non-reserving statuses skip the capacity gate (requested never reserves).
  if p_status in ('approved', 'confirmed') then
    perform app.capacity_check(
      p_business_id, p_business_service_id, p_start_date, p_end_date, p_pet_count,
      p_service_window_id, p_service_zone_id, null, true
    );
  end if;

  insert into public.bookings (
    business_id, client_id, business_service_id, status, start_date, end_date
  ) values (
    p_business_id, p_client_id, p_business_service_id, p_status, p_start_date, p_end_date
  )
  returning id into v_booking;

  if v_svc.duration_model = 'overnight' then
    v_unit := 'night';
    select array_agg(d::date) into v_dates
    from generate_series(p_start_date, p_end_date - 1, interval '1 day') d;
  else
    v_unit := case when v_svc.duration_model = 'fixed_window' then 'session' else 'day' end;
    v_dates := array[p_start_date];
  end if;

  foreach v_d in array v_dates loop
    insert into public.booking_occurrences (
      business_id, booking_id, business_service_id, service_window_id,
      service_zone_id, unit_kind, service_date, pet_count
    ) values (
      p_business_id, v_booking, p_business_service_id, p_service_window_id,
      p_service_zone_id, v_unit, v_d, p_pet_count
    );
  end loop;

  return v_booking;
end;
$$;

alter function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) owner to cfg1_owner;
revoke all on function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) from public;
grant usage on schema test_harness to service_role, authenticated;
grant execute on function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) to service_role;

-- Human over-capacity reservation: authenticated sessions only. The actor and
-- role come from app.capacity_check_human_override's own session derivation —
-- this wrapper passes NO actor.
create or replace function test_harness.reserve_fixture_over_capacity(
  p_business_id uuid,
  p_business_service_id uuid,
  p_client_id uuid,
  p_start_date date,
  p_end_date date default null,
  p_pet_count integer default 1,
  p_service_window_id uuid default null,
  p_service_zone_id uuid default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_svc public.business_services%rowtype;
  v_booking uuid;
  v_dates date[];
  v_d date;
  v_unit text;
begin
  select * into v_svc
  from public.business_services s
  where s.id = p_business_service_id and s.business_id = p_business_id;
  if not found then
    raise exception 'NOT_FOUND: service does not exist in this business' using errcode = 'P0002';
  end if;

  perform app.capacity_check_human_override(
    p_business_id, p_business_service_id, p_start_date, p_end_date, p_pet_count,
    p_service_window_id, p_service_zone_id, null, p_reason
  );

  insert into public.bookings (
    business_id, client_id, business_service_id, status, start_date, end_date,
    over_capacity_ack, over_capacity_reason, created_by_account_id
  ) values (
    p_business_id, p_client_id, p_business_service_id, 'confirmed', p_start_date, p_end_date,
    true, p_reason, app.current_base509_account_id()
  )
  returning id into v_booking;

  if v_svc.duration_model = 'overnight' then
    v_unit := 'night';
    select array_agg(d::date) into v_dates
    from generate_series(p_start_date, p_end_date - 1, interval '1 day') d;
  else
    v_unit := case when v_svc.duration_model = 'fixed_window' then 'session' else 'day' end;
    v_dates := array[p_start_date];
  end if;

  foreach v_d in array v_dates loop
    insert into public.booking_occurrences (
      business_id, booking_id, business_service_id, service_window_id,
      service_zone_id, unit_kind, service_date, pet_count
    ) values (
      p_business_id, v_booking, p_business_service_id, p_service_window_id,
      p_service_zone_id, v_unit, v_d, p_pet_count
    );
  end loop;

  return v_booking;
end;
$$;

alter function test_harness.reserve_fixture_over_capacity(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) owner to cfg1_owner;
revoke all on function test_harness.reserve_fixture_over_capacity(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) from public;
grant execute on function test_harness.reserve_fixture_over_capacity(uuid, uuid, uuid, date, date, integer, uuid, uuid, text) to authenticated;

-- Cancel helper so release semantics are testable through the same seam.
create or replace function test_harness.cancel_booking(p_business_id uuid, p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bookings set status = 'cancelled'
  where business_id = p_business_id and id = p_booking_id;
  update public.booking_occurrences set status = 'cancelled'
  where business_id = p_business_id and booking_id = p_booking_id;
end;
$$;

alter function test_harness.cancel_booking(uuid, uuid) owner to cfg1_owner;
revoke all on function test_harness.cancel_booking(uuid, uuid) from public;
grant execute on function test_harness.cancel_booking(uuid, uuid) to service_role;
