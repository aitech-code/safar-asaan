# Phase 4: Connecting the app to Supabase

## How it works

```
Phone browser ──(publishable key)──> Supabase API ──> PostgreSQL + Row Level Security
                                        returns ONLY published routes,
                                        their stops and VERIFIED fares
```

1. On start, the app loads stops, published routes (with ordered stops) and verified fares in three requests.
2. The tested search logic (`src/lib/routeSearch.ts`) runs on the phone, so searching is instant and works with poor signal once loaded.
3. If `.env.local` is empty, the app uses the built-in fictional sample data instead (footer says "Data: built-in sample").
4. If the connection fails, the app says so and offers "Try again". It never silently switches to sample data.

## Decisions

| Decision | Reason |
|---|---|
| Load all public route data once, search on the phone | Peshawar's route list is small (hundreds of routes = tens of KB). One download, then instant searches. Revisit if data grows past a few thousand routes. |
| Small `postgrest-js` client for public pages | Full Supabase library made the app ~50 KB (compressed) heavier. Login code will load only on admin pages (Phase 5). |
| App refuses secret keys | A secret / service_role key in the browser would bypass all security. |
| App hides drafts and unverified fares again, even after RLS | Defence in depth: an admin browsing the public screens must see what the public sees. |

## Files

| File | Purpose |
|---|---|
| `src/lib/supabaseConfig.ts` | Reads and checks `.env.local` (refuses secret keys) |
| `src/lib/supabaseClient.ts` | Creates the lightweight public database client |
| `src/data/supabaseData.ts` | Loads rows and converts/validates them |
| `src/data/TransportDataProvider.tsx` | Loads data once for the whole app |
| `src/components/DataGate.tsx` | Loading and error screens |
| `src/data/supabase.integration.test.ts` | Optional test against a real database |

## Test results (in Claude's workspace)

- Unit tests: 58 passed (6 integration tests skipped unless a database is given).
- Integration tests against a local PostgreSQL + PostgREST (the same API engine Supabase uses), with the real migration and seed: **6/6 passed**.
- Browser tests at 360 px with the app connected to that database: **29/29 passed**, plus draft route hidden, unverified fare hidden, error screen on network failure, and recovery with "Try again".
- Not yet tested by Claude: your real Supabase project. Steps below.
