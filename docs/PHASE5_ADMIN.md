# Phase 5: Correction reports and admin dashboard

## Public: "Report a problem"

- Link on every route-details page, and "Know a route we are missing?" on empty results.
- Fields: what is wrong (5 types), description (5–1000 chars, English or Urdu), correct fare (only for fare reports; Urdu digits accepted), optional contact.
- No location, IP or device data is collected.
- Spam protection (basic): 60-second cooldown per browser, a hidden "honeypot" field that silently discards bot submissions, and database length limits. Not a CAPTCHA: a determined attacker can still send many reports. If spam appears, add Cloudflare Turnstile (free).
- The public can send reports but cannot read them (enforced by the database).

## Admin: /admin

- Email + password login (Supabase Auth). The full login library is downloaded only on /admin, so public pages stay light (~101 KB compressed).
- Non-admin accounts see "not an administrator". Every change is also checked by the database, and the dashboard reports "Nothing was changed" if the database refuses.
- **Correction reports:** filter by status, mark reviewing/resolved/rejected, add admin notes.
- **Routes & fares:** publish/unpublish, set verified (with date) / unverified / outdated, set or remove the flat fare (verified needs a date).
- English only for now.
- **Not yet in the dashboard:** creating routes, editing stops and their order, segment fares. Use `supabase/templates/add_route_template.sql` in the SQL Editor for now.

## One-time Supabase setup

1. **Turn off public sign-ups:** Authentication → Sign In / Providers → turn off "Allow new users to sign up" → Save.
2. **Create your admin user:** Authentication → Users → Add user → Create new user → your email + a strong password → tick "Auto Confirm User" → Create.
3. **Copy the user's UID** from the Users list.
4. **Make it an admin:** SQL Editor → `insert into public.admin_users (user_id) values ('PASTE-UID-HERE');` → Run.
5. Open `http://localhost:5173/admin` and sign in.

## Test results (Claude's workspace: local PostgreSQL + PostgREST + a stand-in for Supabase login)

- Unit tests: 68 passed; with a database all 86 pass (18 integration tests are skipped without one).
- Integration tests with real sign-in: **18/18 passed** (public data, admin powers, non-admin blocked and told so).
- Browser tests at 360 px: **22/22 passed** (report form validation, database storage, cooldown, honeypot, Urdu RTL form, missing-route link, wrong password, non-admin blocked, resolve report, publish route, verified fare reaches the public, changes reverted, no console errors, admin code not downloaded by public pages).
- Not tested by Claude: the real Supabase login service (the local stand-in only imitates password login). Confirm with the steps above.
