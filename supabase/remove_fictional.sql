-- Removes ALL fictional demo data. Real records (is_fictional = false) are untouched.
-- Run before launch with real data.
begin;
delete from public.routes where is_fictional;   -- also deletes their route_stops and route_fares
delete from public.stops  where is_fictional and not exists (
  select 1 from public.route_stops rs where rs.stop_id = stops.id
);
commit;
