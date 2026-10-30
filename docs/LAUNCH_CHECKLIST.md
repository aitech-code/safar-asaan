# Before telling real people about Safar Asaan

The app currently shows FICTIONAL demo data. Do not promote it until these are done.

## Data
- [ ] Collect real routes yourself or with trusted helpers: stops in travel order, each direction separately, vehicle type, fare paid, date, and who checked.
- [ ] Start small: 5–10 well-checked routes in one area are better than 100 guesses.
- [ ] Add routes with `supabase/templates/add_route_template.sql` (they start as drafts), check them, then publish and verify from `/admin`.
- [ ] Only mark a route or fare **verified** when someone actually rode it / paid it, and record the date.
- [ ] Run `supabase/remove_fictional.sql` to delete the demo data.
- [ ] Then remove the "Prototype / fictional data" banner text (ask Claude to make this change safely).

## Security
- [ ] Public sign-ups are OFF in Supabase (Authentication → Sign In / Providers).
- [ ] Only your account is in `admin_users`.
- [ ] Your admin password is strong and not reused elsewhere.
- [ ] The secret / service_role key has never been put in the code, `.env.local`, Cloudflare or GitHub.
- [ ] Re-run `supabase/tests/rls_tests.sql` after any database change: it must say ALL TESTS PASSED.

## Running costs and limits (free plans)
- [ ] Supabase free projects pause after about a week without activity. Open the app or dashboard regularly, or resume it from the dashboard if paused.
- [ ] Download a database backup now and then (Supabase → Database → Backups, or SQL Editor → export tables as CSV).

## Legal and honest communication
- [ ] Add a short "About / Disclaimer" page: data may be incomplete; confirm with drivers; how to report errors.
- [ ] Add a simple privacy notice: what is collected (report text, optional contact) and what is not (location).
- [ ] As a government employee, check your department's rules about running a public service or side project before launching publicly.

## Known limitations (future work)
- Direct routes only (no transfers).
- Route creation and stop order are edited in Supabase, not yet in the admin screen.
- Admin screen is English only.
- Route source notes are stored in one language.
- Report spam protection is basic (cooldown + honeypot). Add Cloudflare Turnstile if spam appears.
- No map yet (Leaflet + OpenStreetMap can be added later, free).
