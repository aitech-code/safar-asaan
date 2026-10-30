-- =====================================================================
-- TEMPLATE: add ONE real route (one direction) with its ordered stops.
-- Until the admin screen has a route editor, use this in the SQL Editor.
--
-- 1. Replace every <...> value. Keep the quotes.
-- 2. Stops that already exist are reused (matched by English name).
-- 3. The route is created as a DRAFT (is_published = false).
--    Check it, then publish it from the admin dashboard.
-- 4. Add the opposite direction as a SEPARATE route.
-- =====================================================================
begin;

-- Stops (skip any that already exist)
insert into public.stops (name_en, name_ur)
values
  ('<Stop 1 English>', '<Stop 1 Urdu>'),
  ('<Stop 2 English>', '<Stop 2 Urdu>'),
  ('<Stop 3 English>', '<Stop 3 Urdu>')
on conflict do nothing;

-- Route (draft)
insert into public.routes
  (code, name_en, name_ur, vehicle_type, direction_en, direction_ur, verification_status, source_notes, is_published)
values
  ('<CODE e.g. P1>', '<Route name English>', '<Route name Urdu>',
   '<suzuki_van | wagon | minibus | chingchi>',
   '<Towards ...>', '<... کی طرف>',
   'unverified', '<Who checked it, how, when>', false);

-- Ordered stops: list names in travel order. boarding/alighting default to allowed.
insert into public.route_stops (route_id, stop_id, stop_sequence)
select r.id, s.id, v.seq
from (values
  (1, '<Stop 1 English>'),
  (2, '<Stop 2 English>'),
  (3, '<Stop 3 English>')
) as v (seq, stop_name)
join public.stops s on lower(btrim(s.name_en)) = lower(btrim(v.stop_name))
join public.routes r on r.code = '<CODE e.g. P1>';

-- Safety check: every listed stop must have been found.
do $$
begin
  if (select count(*) from public.route_stops rs join public.routes r on r.id = rs.route_id
      where r.code = '<CODE e.g. P1>') <> 3 then   -- <- change 3 to your number of stops
    raise exception 'Not all stops were matched. Check the stop names. Nothing was saved.';
  end if;
end $$;

commit;
