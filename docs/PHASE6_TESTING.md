# Phase 6: Polish and final testing

## Changes
- Wording: "Ride 1 stop" / "Ride 3 stops"; "Board the minibus" (lower case inside sentences); same fixes in Urdu.
- Offline: the app saves the last downloaded route data (max 30 days old). Without a signal it shows that copy with a clear notice and date, and refreshes automatically when the connection returns.
- Installable (PWA): manifest, app icons (including Android "maskable"), and a service worker that lets the app screens open offline. Route data is never served silently from the service worker.
- Accessibility: fixed low-contrast footer text; demo-data banner moved inside the page header landmark.

## Final test results (Claude's workspace)

| Suite | Result |
|---|---|
| Unit + integration tests (`npx vitest run` with a test database) | 91 / 91 passed, 3 runs in a row |
| Database security tests (`supabase/tests/rls_tests.sql`) | ALL TESTS PASSED |
| Browser: search, ordering, directions, fares, invalid input, empty results, broken links, Urdu RTL | 29 / 29 |
| Browser: reports, cooldown, honeypot, admin login, non-admin blocked, publish, fares reach public | 22 / 22 |
| Browser: wording, offline, auto-refresh, installability, accessibility scans of 6 screens (EN + UR), slow 3G + slow CPU, 320 px Urdu | 20 / 20, 3 runs in a row |

Brief requirements covered by tests: search ordering, invalid input, unknown fares, duplicate stops (loop route), Urdu layout, database permissions, empty results.

- Slow-network result: on emulated slow 3G (400 ms latency, ~50 KB/s) with a 4× slower CPU, the search form was usable after about 4 seconds on first visit, ~106 KB downloaded.
- Accessibility: automated axe-core scan finds no serious or critical issues. Automated scans do not catch everything; testing with a real screen reader (Android TalkBack) is still recommended.

## Not tested by Claude
- The real Cloudflare deployment and real Supabase login from the internet (follow `docs/DEPLOY.md` Part C).
- Real Android phones and real mobile networks in Peshawar.
