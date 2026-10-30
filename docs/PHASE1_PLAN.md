# Safar Asaan — Phase 1: Requirements review and project structure

Status: Milestone 1 complete (scaffold builds, tests pass, lint clean, checked in a 360 px browser in English and Urdu).

## 1. Requirements as understood

| Area | Requirement | Phase |
|---|---|---|
| Search | Origin + destination search, direct routes only | 2 (UI), 4 (real) |
| Results | Ordered stops, boarding/destination stop, plain-language directions | 2 |
| Fares | Verified fare, otherwise "Fare not verified" | 2, 4 |
| Trust | Verification status, source notes, last-verified date; never show unverified as verified | 3, 4 |
| Reports | Public correction reports, no edit rights for public | 5 |
| Language | English + Urdu with correct right-to-left layout | 1 (done) |
| Admin | Protected dashboard; only admins publish/modify | 5 |
| Data | Demo data clearly fictional | 1 (banner), 2 |
| Privacy | No location unless user explicitly chooses | all |
| Cost | Zero budget: free tiers only, no paid AI/map APIs | all |

## 2. Key technical decisions (plain language)

1. **Vite + React + TypeScript.** Vite gives a fast dev server. TypeScript catches mistakes (e.g. a missing Urdu translation) before the app runs.
2. **Tailwind CSS v4** via its Vite plugin — no separate config file needed. Colours live in `src/index.css`.
3. **RTL done with logical classes.** We use `text-start`, `ms-`/`me-`, `start-` instead of `left`/`right`, so the layout flips automatically when `<html dir="rtl">`.
4. **Homemade translation system** (one file, ~60 lines) instead of a library like i18next — two languages don't need the extra download.
5. **No web fonts.** Android phones already have Noto fonts that render Urdu. Saves 200–500 KB on slow connections. We can add a Nastaliq font later as an optional enhancement.
6. **No map in the first release.** The core value is the stop list. A map (Leaflet + OpenStreetMap, free) can come later, loaded only on the route-details page so it never slows the home screen.
7. **Supabase free tier** for PostgreSQL + login. Only the public *anon* key ever goes in the browser; Row Level Security (RLS) decides what that key may do.
8. **Route search runs in the database** (a SQL function, Phase 4), so the browser never downloads the whole route table.
9. **Free hosting** options for later: Cloudflare Pages, Netlify or Vercel free tiers.
10. **Vitest** for automated tests (already set up).

## 3. Folder structure (target — items marked * exist now)

```
safar-asaan/
├─ docs/
│  └─ PHASE1_PLAN.md*            this file
├─ public/
│  └─ favicon.svg*
├─ supabase/
│  ├─ migrations/*               Phase 3: SQL schema + RLS policies
│  └─ seed_fictional.sql         Phase 3: clearly fictional demo data
├─ src/
│  ├─ main.tsx*                  app entry
│  ├─ App.tsx*                   page map (routes)
│  ├─ index.css*                 Tailwind + colours + Urdu typography
│  ├─ i18n/*                     translations + language switching
│  ├─ components/*               Layout, LanguageSwitcher, DemoDataBanner…
│  ├─ pages/*                    Home, NotFound; later RouteDetails, Report, Admin
│  ├─ lib/                       Phase 4: supabase client, search helpers
│  ├─ data/                      Phase 2: fictional sample data (TypeScript)
│  └─ types/                     Phase 2: Route, Stop, Fare types
├─ .env.example*                 template; real keys go in .env.local (git-ignored)
└─ package.json*
```

## 4. Schema review — what I will check in Phase 3

The SQL schema from your project brief was **not attached** to this conversation. Please paste or attach it before Phase 3. I will review it against these common problems:

- `route_stops` needs `UNIQUE (route_id, stop_sequence)` so two stops cannot share a position.
- Decide whether the same stop may appear twice on one route (loop routes). If yes, uniqueness must be on `(route_id, stop_sequence)` only, and the search must pick the correct occurrence (first boarding before last alighting).
- Route **direction**: either one row per direction (recommended: "Hayatabad → Saddar" and "Saddar → Hayatabad" are separate routes with their own ordered stops) or a direction column — not both.
- `verification_status` should be a CHECK-constrained value (e.g. `unverified`, `verified`, `outdated`) and `verified` should require `last_verified_at`.
- Fares: amount in whole rupees as `integer` with `CHECK (amount_pkr > 0)`, plus `is_verified` and `verified_at`; fares may depend on segment (from-stop → to-stop), not just route.
- `route_reports` must be insert-only for the public, with length limits on free text, and never readable by the public (it may contain contact details).
- Timestamps `created_at` / `updated_at` with a trigger to maintain `updated_at`.
- Indexes on every foreign key and on stop names for search (`pg_trgm` for typo-tolerant matching in English and Urdu).
- Stop names in both languages (`name_en`, `name_ur`) plus aliases (local people use many names for the same stop).

## 5. Milestone 1 — what was built and tested

- Vite React-TS scaffold with Tailwind v4, React Router, Supabase client library installed (not yet used).
- Bilingual shell: header, language switcher, fictional-data warning banner, search form (layout only), safety note, 404 page.
- `<html lang>` and `<html dir>` switch between `en/ltr` and `ur/rtl`; choice is remembered (fails safely if browser storage is blocked).
- Verified: `npm run build` ✔, `npm test` 5/5 ✔, `npm run lint` 0 warnings ✔, headless browser at 360 px wide: no console errors, no horizontal scroll, RTL applied, language remembered after reload, unknown URL shows 404.

**Not yet working (by design):** search, results, route details, fares, reports, admin, database.

## 6. Next: Phase 2

Route types, fictional sample data (with invented stop names so nobody mistakes them for real Peshawar routes), direct-route search over sample data, results list and route-details page, unit tests for stop ordering and boarding/alighting rules.
