-- =====================================================================
-- Safar Asaan: initial database schema + security (Row Level Security)
-- Run ONCE in Supabase: Dashboard -> SQL Editor -> New query -> Run.
--
-- Who can do what:
--   Public visitors (anon)        read PUBLISHED routes, their stops and VERIFIED fares;
--                                 submit correction reports (cannot read them back).
--   Signed-in non-admin users     same as public.
--   Administrators                full read/write. An admin is a user listed in
--                                 public.admin_users (added manually, see bottom).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helper: keep updated_at current automatically
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Administrators (extra table: needed to decide who may edit routes)
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER lets policies check admin_users without exposing that table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------
-- 2. stops
-- ---------------------------------------------------------------------
create table public.stops (
  id           uuid primary key default gen_random_uuid(),
  name_en      text not null check (char_length(btrim(name_en)) between 2 and 120),
  name_ur      text not null check (char_length(btrim(name_ur)) between 2 and 120),
  aliases      text[] not null default '{}',
  -- Optional map position of the STOP (never of a user).
  latitude     numeric(9, 6) check (latitude between -90 and 90),
  longitude    numeric(9, 6) check (longitude between -180 and 180),
  is_fictional boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint stops_lat_lng_together check ((latitude is null) = (longitude is null)),
  constraint stops_aliases_limit check (cardinality(aliases) <= 20)
);

-- No two stops with the same English or Urdu name (case-insensitive).
create unique index stops_name_en_unique on public.stops (lower(btrim(name_en)));
create unique index stops_name_ur_unique on public.stops (btrim(name_ur));

create trigger stops_set_updated_at
  before update on public.stops
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. routes  (one row per DIRECTION of travel)
-- ---------------------------------------------------------------------
create table public.routes (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[A-Za-z0-9-]{1,20}$'),
  name_en             text not null check (char_length(btrim(name_en)) between 2 and 150),
  name_ur             text not null check (char_length(btrim(name_ur)) between 2 and 150),
  vehicle_type        text not null check (vehicle_type in ('suzuki_van', 'wagon', 'minibus', 'chingchi')),
  direction_en        text not null check (char_length(btrim(direction_en)) between 2 and 150),
  direction_ur        text not null check (char_length(btrim(direction_ur)) between 2 and 150),
  verification_status text not null default 'unverified'
                      check (verification_status in ('unverified', 'verified', 'outdated')),
  last_verified_at    date,
  source_notes        text not null default '' check (char_length(source_notes) <= 2000),
  is_published        boolean not null default false,
  is_fictional        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- A route cannot be called verified without saying when it was verified.
  constraint routes_verified_needs_date
    check (verification_status <> 'verified' or last_verified_at is not null)
);

create index routes_published_idx on public.routes (is_published, verification_status);

create trigger routes_set_updated_at
  before update on public.routes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. route_stops  (ordered stops of a route)
-- ---------------------------------------------------------------------
create table public.route_stops (
  id                uuid primary key default gen_random_uuid(),
  route_id          uuid not null references public.routes (id) on delete cascade,
  stop_id           uuid not null references public.stops (id) on delete restrict,
  stop_sequence     integer not null check (stop_sequence between 1 and 500),
  boarding_allowed  boolean not null default true,
  alighting_allowed boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Two stops can never share a position. DEFERRABLE lets an admin
  -- re-number stops inside one transaction without temporary clashes.
  constraint route_stops_unique_sequence
    unique (route_id, stop_sequence) deferrable initially immediate,
  -- A stop where you can neither board nor alight is pointless.
  constraint route_stops_some_access check (boarding_allowed or alighting_allowed)
  -- NOTE: the same stop MAY appear twice on one route (loop routes).
);

create index route_stops_stop_idx on public.route_stops (stop_id);
create index route_stops_route_seq_idx on public.route_stops (route_id, stop_sequence);

create trigger route_stops_set_updated_at
  before update on public.route_stops
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. route_fares
--    from/to both NULL  = flat fare for any trip on the route
--    from/to both set   = fare for that specific segment
-- ---------------------------------------------------------------------
create table public.route_fares (
  id           uuid primary key default gen_random_uuid(),
  route_id     uuid not null references public.routes (id) on delete cascade,
  from_stop_id uuid references public.stops (id) on delete cascade,
  to_stop_id   uuid references public.stops (id) on delete cascade,
  amount_pkr   integer not null check (amount_pkr between 1 and 100000),
  is_verified  boolean not null default false,
  verified_at  date,
  source_notes text not null default '' check (char_length(source_notes) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint route_fares_both_or_neither check ((from_stop_id is null) = (to_stop_id is null)),
  constraint route_fares_different_stops check (from_stop_id is null or from_stop_id <> to_stop_id),
  constraint route_fares_verified_needs_date check (not is_verified or verified_at is not null)
);

-- At most one flat fare per route, and one fare per segment.
create unique index route_fares_one_flat on public.route_fares (route_id) where from_stop_id is null;
create unique index route_fares_one_segment on public.route_fares (route_id, from_stop_id, to_stop_id)
  where from_stop_id is not null;
create index route_fares_from_idx on public.route_fares (from_stop_id);
create index route_fares_to_idx on public.route_fares (to_stop_id);

create trigger route_fares_set_updated_at
  before update on public.route_fares
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. route_reports  (public corrections; insert-only for the public)
--    No IP address, device data or location is stored.
-- ---------------------------------------------------------------------
create table public.route_reports (
  id                 uuid primary key default gen_random_uuid(),
  route_id           uuid references public.routes (id) on delete set null,
  stop_id            uuid references public.stops (id) on delete set null,
  report_type        text not null
                     check (report_type in ('wrong_route', 'wrong_stop', 'wrong_fare', 'missing_route', 'other')),
  message            text not null check (char_length(btrim(message)) between 5 and 1000),
  suggested_fare_pkr integer check (suggested_fare_pkr between 1 and 100000),
  contact            text check (char_length(contact) <= 120),
  language           text not null default 'en' check (language in ('en', 'ur')),
  status             text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  admin_notes        text check (char_length(admin_notes) <= 2000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index route_reports_status_idx on public.route_reports (status, created_at desc);
create index route_reports_route_idx on public.route_reports (route_id);
create index route_reports_stop_idx on public.route_reports (stop_id);

create trigger route_reports_set_updated_at
  before update on public.route_reports
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 7. PERMISSIONS
--    Layer 1: GRANTs say which operations each role may attempt.
--    Layer 2: RLS policies say which ROWS those operations may touch.
-- =====================================================================

-- Start from nothing, then grant only what is needed.
revoke all on public.admin_users, public.stops, public.routes, public.route_stops,
              public.route_fares, public.route_reports
  from anon, authenticated;

grant select on public.stops, public.routes, public.route_stops, public.route_fares
  to anon, authenticated;

-- Public may INSERT reports, and only these columns (not status/admin_notes).
grant insert (route_id, stop_id, report_type, message, suggested_fare_pkr, contact, language)
  on public.route_reports to anon, authenticated;

-- Signed-in users get write rights at the GRANT level; RLS below limits them to admins.
grant insert, update, delete on public.stops, public.routes, public.route_stops, public.route_fares
  to authenticated;
grant select, update, delete on public.route_reports to authenticated;
grant select on public.admin_users to authenticated;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Turn on Row Level Security everywhere. With RLS on and no matching
-- policy, access is DENIED by default.
alter table public.admin_users   enable row level security;
alter table public.stops         enable row level security;
alter table public.routes        enable row level security;
alter table public.route_stops   enable row level security;
alter table public.route_fares   enable row level security;
alter table public.route_reports enable row level security;

-- admin_users: a signed-in user can only check their own row. No API writes.
create policy "admin_users: read own row"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

-- stops: everyone may read; only admins write.
create policy "stops: public read"
  on public.stops for select to anon, authenticated
  using (true);
create policy "stops: admin insert" on public.stops for insert to authenticated with check ((select public.is_admin()));
create policy "stops: admin update" on public.stops for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "stops: admin delete" on public.stops for delete to authenticated using ((select public.is_admin()));

-- routes: public sees only published routes; admins see all.
create policy "routes: read published or admin"
  on public.routes for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "routes: admin insert" on public.routes for insert to authenticated with check ((select public.is_admin()));
create policy "routes: admin update" on public.routes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "routes: admin delete" on public.routes for delete to authenticated using ((select public.is_admin()));

-- route_stops: visible only when their route is published.
create policy "route_stops: read published or admin"
  on public.route_stops for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.routes r where r.id = route_id and r.is_published)
  );
create policy "route_stops: admin insert" on public.route_stops for insert to authenticated with check ((select public.is_admin()));
create policy "route_stops: admin update" on public.route_stops for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "route_stops: admin delete" on public.route_stops for delete to authenticated using ((select public.is_admin()));

-- route_fares: the public sees only VERIFIED fares of published routes.
create policy "route_fares: read verified or admin"
  on public.route_fares for select to anon, authenticated
  using (
    (select public.is_admin())
    or (is_verified and exists (select 1 from public.routes r where r.id = route_id and r.is_published))
  );
create policy "route_fares: admin insert" on public.route_fares for insert to authenticated with check ((select public.is_admin()));
create policy "route_fares: admin update" on public.route_fares for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "route_fares: admin delete" on public.route_fares for delete to authenticated using ((select public.is_admin()));

-- route_reports: anyone may submit a NEW report; only admins read/manage.
create policy "route_reports: anyone can submit"
  on public.route_reports for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null);
create policy "route_reports: admin read" on public.route_reports for select to authenticated using ((select public.is_admin()));
create policy "route_reports: admin update" on public.route_reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "route_reports: admin delete" on public.route_reports for delete to authenticated using ((select public.is_admin()));

-- =====================================================================
-- HOW TO MAKE YOURSELF AN ADMIN (later, after creating your login):
--   1. Dashboard -> Authentication -> Users -> copy your user's UID
--   2. SQL Editor:  insert into public.admin_users (user_id) values ('<your-uid>');
-- =====================================================================
