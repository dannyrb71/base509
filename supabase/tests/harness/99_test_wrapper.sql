-- ============================================================================
-- Privileged capacity test wrapper — TEST HARNESS ONLY, never a migration.
--
-- Spec §5: "CFG-1 concurrency tests exercise the primitive through a
-- privileged test wrapper that performs the fixture reservation while holding
-- those locks (since no public reserve path exists yet)."
--
-- The wrapper calls the internal primitive (which takes the deterministic
-- service → conflict → pool locks) and inserts the booking + occurrences in
-- the SAME transaction while those locks are held — exactly the shape the
-- future booking transaction will use. Executable by service_role only.
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
  p_status text default 'confirmed',
  p_allow_over_capacity boolean default false,
  p_actor uuid default null,
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

  -- Non-reserving statuses skip the capacity gate (requested never reserves).
  if p_status in ('approved', 'confirmed') then
    perform app.capacity_check(
      p_business_id, p_business_service_id, p_start_date, p_end_date, p_pet_count,
      p_service_window_id, p_service_zone_id, null, true,
      p_allow_over_capacity, p_actor, p_reason
    );
  end if;

  insert into public.bookings (
    business_id, client_id, business_service_id, status, start_date, end_date,
    over_capacity_ack, over_capacity_reason, created_by_account_id
  ) values (
    p_business_id, p_client_id, p_business_service_id, p_status, p_start_date, p_end_date,
    p_allow_over_capacity, p_reason, p_actor
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

alter function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text, boolean, uuid, text) owner to cfg1_owner;
revoke all on function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text, boolean, uuid, text) from public;
grant usage on schema test_harness to service_role;
grant execute on function test_harness.reserve_fixture(uuid, uuid, uuid, date, date, integer, uuid, uuid, text, boolean, uuid, text) to service_role;

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
