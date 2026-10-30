# Phase 3: Database and security (Supabase)

## Files

| File | What it does | Run in Supabase? |
|---|---|---|
| `supabase/migrations/20261029000001_initial_schema.sql` | Creates tables, rules, indexes and security policies | Yes, once |
| `supabase/seed_fictional.sql` | Adds the FICTIONAL demo routes (same as the app's sample data) | Yes |
| `supabase/tests/rls_tests.sql` | Tests security and data rules, then undoes all test changes | Yes, any time |
| `supabase/remove_fictional.sql` | Deletes all demo data before real launch | Later |

## Tables

| Table | Purpose | Key rules |
|---|---|---|
| `stops` | Named places (English + Urdu + aliases) | Names unique; optional stop coordinates |
| `routes` | One row per direction of travel | Vehicle type limited to 4 values; "verified" requires a date; drafts hidden until `is_published` |
| `route_stops` | Ordered stops of a route | No two stops in the same position; the same stop may appear twice (loops); each stop allows boarding and/or alighting |
| `route_fares` | Flat route fare or segment fare | Fare > 0; "verified" requires a date; one flat fare per route |
| `route_reports` | Public corrections | Message 5–1000 chars; no IP or location stored |
| `admin_users` | Who is an administrator (extra table) | Can only be changed in the SQL Editor |

## Who can do what (Row Level Security)

| Action | Public | Signed-in user | Admin |
|---|---|---|---|
| Read published routes, stops | ✅ | ✅ | ✅ |
| Read draft (unpublished) routes | ❌ | ❌ | ✅ |
| Read fares | Verified only | Verified only | All |
| Create / edit / delete routes, stops, fares | ❌ | ❌ | ✅ |
| Submit a correction report | ✅ | ✅ | ✅ |
| Read or manage reports | ❌ | ❌ | ✅ |
| Set report status / admin notes | ❌ | ❌ | ✅ |

## Design decisions (and why)

1. **Each direction is its own route.** "A → B" and "B → A" can use different roads and stops.
2. **Loop routes allowed.** Uniqueness is on *position*, not stop, so a stop can appear twice.
3. **Two layers of security.** GRANTs limit which operations a role may try; RLS policies limit which rows. Tests showed that breaking one layer alone was still caught by the other.
4. **Unverified fares never leave the database for the public**, not just hidden in the app.
5. **Admin list in its own table**, checked by a `SECURITY DEFINER` function so it is never exposed.
6. **Times stored as `timestamptz`; verification dates as `date`.** `updated_at` is set automatically by a trigger.
7. **No user location or IP stored.** Stop coordinates are optional and describe stops only.

## Known limits (to handle later)

- Report spam: no rate limit or CAPTCHA yet (Phase 5/6 options: Cloudflare Turnstile, free).
- A fare's from/to stops are not yet checked to belong to that route (admin screen will enforce it).
- Stop-name search across languages will be added as a database function in Phase 4.

## Test results (local PostgreSQL 16 with a Supabase-style auth setup)

- Migration and seed run without errors; seed can run twice without duplicates.
- `rls_tests.sql`: **ALL TESTS PASSED** (anon, signed-in user, admin, and 12 data-rule checks).
- Deliberate holes (RLS disabled on routes; a policy leaking fares) were detected by the tests.
- Still to confirm: the same tests on **your** Supabase project (steps below).
