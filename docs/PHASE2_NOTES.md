# Phase 2: Frontend with fictional sample data

Status: complete. 40 unit tests, 29 browser checks at 360 px, build and lint clean.

## What was added

| File | Purpose |
|---|---|
| `src/types/transport.ts` | Data shapes (mirror the future database tables) |
| `src/data/sampleData.ts` | FICTIONAL demo stops/routes/fares, all names end in "(demo)" / "(نمونہ)" |
| `src/data/useTransportData.ts` | One place screens get data from (Phase 4 swaps in Supabase) |
| `src/lib/textMatch.ts` | Turns typed text into a stop (English, Urdu, aliases, Arabic-keyboard letters) |
| `src/lib/routeSearch.ts` | Direct-route search, fare lookup, data checks |
| `src/pages/ResultsPage.tsx` | Verified routes, then a separate "not yet verified" section |
| `src/pages/RouteDetailsPage.tsx` | Directions, trip stops, full route, source notes |
| `src/components/VerificationBadge.tsx`, `FareDisplay.tsx` | Status and fare display |

## Search rules (all tested)

1. Origin and destination must both be on the route, origin first.
2. Boarding only where `boardingAllowed`; getting off only where `alightingAllowed`.
3. Loop routes that visit a stop twice: the shortest valid ride is used.
4. Verified routes are listed first; unverified/outdated routes appear in a separate, labelled section.
5. Only verified fares are shown. Segment fare first, then flat route fare, otherwise "Fare not verified".
6. No result → "No verified direct route was found", never "no transport exists".
7. Typed text that matches several stops → user chooses; the app never guesses.

## Demo searches to try

| From | To | Expected |
|---|---|---|
| Sitara | Noor | R1, verified, Rs 50 |
| Noor | Sitara | R2 (opposite direction), fare not verified |
| Sitara | Pahari | No verified route; R3 shown as not verified |
| Lal Pul | Chashma | R4 loop route, segment fare not verified |
| Chashma | Lal Pul | R4 using the second visit to Lal Pul |
| Noor | Overpass | R5 chingchi (drop-off-only stop) |
| Pahari | Chashma | No verified direct route |
| ma | (anything) | "Several stops match", choose one |

## Known limitations

- Source notes are stored in one language only (shown as written).
- Search is direct routes only; transfers are not planned.
- Data is fictional and built into the app; the database arrives in Phases 3–4.
