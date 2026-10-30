-- =====================================================================
-- Safar Asaan: security (RLS) and constraint tests
-- Run AFTER the migration and the fictional seed.
-- Everything happens inside one transaction that is ROLLED BACK at the
-- end, so the test users and test rows are never kept.
--
-- Result: the last line shows "ALL TESTS PASSED".
-- If a test fails, you get an error that starts with "FAIL:".
-- =====================================================================

begin;

-- ---------- Test users (rolled back at the end) ----------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-admin@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'test-user@example.invalid');
insert into public.admin_users (user_id) values ('11111111-1111-4111-8111-111111111111');

-- =====================================================================
-- A. PUBLIC VISITOR (anon)
-- =====================================================================
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

do $$
declare n integer;
begin
  -- A1 sees only published routes (R1-R5), never the draft R6
  select count(*) into n from public.routes where is_fictional;
  if n <> 5 then raise exception 'FAIL: A1 anon should see 5 published routes, saw %', n; end if;
  if exists (select 1 from public.routes where code = 'R6') then
    raise exception 'FAIL: A1 anon can see unpublished route R6';
  end if;

  -- A2 cannot see stops of the draft route
  if exists (select 1 from public.route_stops where route_id = '00000000-0000-4000-b000-000000000006') then
    raise exception 'FAIL: A2 anon can see route_stops of unpublished route';
  end if;

  -- A3 sees verified fares only (R3's unverified Rs 60 must be hidden)
  if exists (select 1 from public.route_fares where amount_pkr = 60) then
    raise exception 'FAIL: A3 anon can see an unverified fare';
  end if;
  select count(*) into n from public.route_fares;
  if n <> 3 then raise exception 'FAIL: A3 anon should see 3 verified fares, saw %', n; end if;

  -- A4 cannot read reports or the admin list
  begin
    perform 1 from public.route_reports;
    raise exception 'FAIL: A4 anon can read route_reports';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.admin_users;
    raise exception 'FAIL: A4 anon can read admin_users';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A5 cannot create, change or delete routes / stops / fares
do $$
begin
  begin
    insert into public.routes (code, name_en, name_ur, vehicle_type, direction_en, direction_ur)
    values ('HACK', 'Hack route', 'ہیک', 'wagon', 'Nowhere', 'کہیں نہیں');
    raise exception 'FAIL: A5 anon inserted a route';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.routes set verification_status = 'verified', last_verified_at = current_date where code = 'R3';
    raise exception 'FAIL: A5 anon updated a route';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.stops;
    raise exception 'FAIL: A5 anon deleted stops';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.route_fares set amount_pkr = 1;
    raise exception 'FAIL: A5 anon changed a fare';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A6 CAN submit a correction report
insert into public.route_reports (route_id, report_type, message, language)
values ('00000000-0000-4000-b000-000000000001', 'wrong_fare', 'Fare is now higher than shown.', 'en');

-- A7 cannot mark own report as resolved or add admin notes
do $$
begin
  begin
    insert into public.route_reports (report_type, message, status)
    values ('other', 'Trying to set status myself', 'resolved');
    raise exception 'FAIL: A7 anon set report status';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.route_reports (report_type, message, admin_notes)
    values ('other', 'Trying to add admin notes', 'hacked');
    raise exception 'FAIL: A7 anon wrote admin_notes';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A8 report input validation
do $$
begin
  begin
    insert into public.route_reports (report_type, message) values ('other', 'hi');
    raise exception 'FAIL: A8 too-short message accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.route_reports (report_type, message) values ('other', repeat('x', 1001));
    raise exception 'FAIL: A8 too-long message accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.route_reports (report_type, message) values ('spam', 'Unknown report type');
    raise exception 'FAIL: A8 invalid report_type accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.route_reports (report_type, message, suggested_fare_pkr) values ('wrong_fare', 'Negative fare test', -5);
    raise exception 'FAIL: A8 negative suggested fare accepted';
  exception when check_violation then null;
  end;
end $$;

-- =====================================================================
-- B. SIGNED-IN, NOT ADMIN
-- =====================================================================
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $$
declare n integer;
begin
  if public.is_admin() then raise exception 'FAIL: B1 normal user is treated as admin'; end if;

  if exists (select 1 from public.routes where code = 'R6') then
    raise exception 'FAIL: B2 normal user can see unpublished route';
  end if;

  select count(*) into n from public.route_reports;
  if n <> 0 then raise exception 'FAIL: B3 normal user can read % reports', n; end if;

  begin
    insert into public.routes (code, name_en, name_ur, vehicle_type, direction_en, direction_ur)
    values ('HACK2', 'Hack route', 'ہیک', 'wagon', 'Nowhere', 'کہیں نہیں');
    raise exception 'FAIL: B4 normal user inserted a route';
  exception when insufficient_privilege then null;
  end;

  update public.routes set is_published = false where code = 'R1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B5 normal user updated % route(s)', n; end if;

  delete from public.route_stops;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B6 normal user deleted % route_stops', n; end if;

  begin
    insert into public.admin_users (user_id) values ('22222222-2222-4222-8222-222222222222');
    raise exception 'FAIL: B7 normal user made themselves admin';
  exception when insufficient_privilege then null;
  end;
end $$;

-- =====================================================================
-- C. ADMIN
-- =====================================================================
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'FAIL: C1 admin not recognised'; end if;

  if not exists (select 1 from public.routes where code = 'R6') then
    raise exception 'FAIL: C2 admin cannot see draft route';
  end if;

  select count(*) into n from public.route_reports;
  if n < 1 then raise exception 'FAIL: C3 admin cannot read reports'; end if;

  update public.route_reports set status = 'reviewing', admin_notes = 'Checking with driver' where status = 'new';
  get diagnostics n = row_count;
  if n < 1 then raise exception 'FAIL: C4 admin cannot update reports'; end if;

  update public.routes set is_published = true where code = 'R6';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: C5 admin cannot publish a route'; end if;

  insert into public.stops (name_en, name_ur, is_fictional) values ('Admin Test Stop (demo)', 'ایڈمن ٹیسٹ اسٹاپ (نمونہ)', true);
end $$;

-- =====================================================================
-- D. DATA RULES (constraints), run as admin
-- =====================================================================
do $$
begin
  -- D1 two stops in the same position on one route
  begin
    insert into public.route_stops (route_id, stop_id, stop_sequence)
    values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000007', 3);
    raise exception 'FAIL: D1 duplicate stop_sequence accepted';
  exception when unique_violation then null;
  end;

  -- D2 the same STOP twice on a route IS allowed (loop routes) - R4 already has it
  if (select count(*) from public.route_stops
      where route_id = '00000000-0000-4000-b000-000000000004'
        and stop_id = '00000000-0000-4000-a000-000000000003') <> 2 then
    raise exception 'FAIL: D2 loop route should contain Lal Pul twice';
  end if;

  -- D3 verified route without a verification date
  begin
    update public.routes set verification_status = 'verified', last_verified_at = null where code = 'R3';
    raise exception 'FAIL: D3 verified route without date accepted';
  exception when check_violation then null;
  end;

  -- D4 invalid vehicle type
  begin
    insert into public.routes (code, name_en, name_ur, vehicle_type, direction_en, direction_ur)
    values ('X1', 'Bad vehicle', 'غلط', 'rickshaw_jet', 'Nowhere', 'کہیں نہیں');
    raise exception 'FAIL: D4 invalid vehicle_type accepted';
  exception when check_violation then null;
  end;

  -- D5 zero / negative fare
  begin
    insert into public.route_fares (route_id, amount_pkr) values ('00000000-0000-4000-b000-000000000002', 0);
    raise exception 'FAIL: D5 zero fare accepted';
  exception when check_violation then null;
  end;

  -- D6 verified fare without a date
  begin
    insert into public.route_fares (route_id, amount_pkr, is_verified) values ('00000000-0000-4000-b000-000000000002', 40, true);
    raise exception 'FAIL: D6 verified fare without date accepted';
  exception when check_violation then null;
  end;

  -- D7 segment fare with only one end
  begin
    insert into public.route_fares (route_id, from_stop_id, amount_pkr)
    values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 40);
    raise exception 'FAIL: D7 half-specified segment fare accepted';
  exception when check_violation then null;
  end;

  -- D8 second flat fare for the same route
  begin
    insert into public.route_fares (route_id, amount_pkr) values ('00000000-0000-4000-b000-000000000001', 70);
    raise exception 'FAIL: D8 second flat fare accepted';
  exception when unique_violation then null;
  end;

  -- D9 stop with neither boarding nor alighting
  begin
    insert into public.route_stops (route_id, stop_id, stop_sequence, boarding_allowed, alighting_allowed)
    values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000007', 9, false, false);
    raise exception 'FAIL: D9 unusable stop accepted';
  exception when check_violation then null;
  end;

  -- D10 duplicate stop name (case-insensitive)
  begin
    insert into public.stops (name_en, name_ur) values ('SITARA CHOWK (DEMO)', 'دوسرا نام');
    raise exception 'FAIL: D10 duplicate stop name accepted';
  exception when unique_violation then null;
  end;

  -- D11 deleting a stop that a route still uses is blocked
  begin
    delete from public.stops where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'FAIL: D11 stop in use was deleted';
  exception when foreign_key_violation then null;
  end;
end $$;

-- D12 updated_at changes automatically
do $$
declare before_ts timestamptz;
begin
  select updated_at into before_ts from public.routes where code = 'R2';
  perform pg_sleep(0.01);
  update public.routes set source_notes = 'Fictional sample record for testing (edited).' where code = 'R2';
  -- the seed ran in an earlier transaction, so the new timestamp must be later
  if (select updated_at from public.routes where code = 'R2') <= before_ts then
    raise exception 'FAIL: D12 updated_at did not change';
  end if;
end $$;

reset role;
rollback;

select 'ALL TESTS PASSED (all test changes were rolled back)' as result;
