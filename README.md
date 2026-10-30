# Safar Asaan — Peshawar Local Transport Finder

Mobile-first, installable web app to find local van, wagon, minibus and chingchi routes in Peshawar, in English and Urdu.

> **Prototype.** All route, stop and fare data currently in this project is FICTIONAL sample data and must not be used for real travel.

## Features
- Direct-route search (origin before destination, boarding/alighting rules, loop routes)
- Ordered stops, plain-language directions, verified fares or "Fare not verified"
- Verified and unverified routes shown separately; never invents routes or fares
- English / Urdu with right-to-left layout
- Correction reports (no location collected)
- Protected admin dashboard (Supabase Auth + Row Level Security)
- Works offline with clearly labelled saved data; installable on Android

## Requirements
- Node.js 20.19+ (22 LTS recommended)
- A free Supabase project (optional: without it the app uses built-in sample data)

## Run it
```bash
npm install
npm run dev -- --host
```

## Commands
| Command | What it does |
|---|---|
| `npm test` | Runs automated tests (database tests skip unless configured) |
| `npm run lint` | Checks code for common mistakes |
| `npm run build` | Type-checks and builds the production site into `dist/` |
| `npm run preview` | Serves the built site locally (offline mode works only here and online) |

## Documentation
| File | Topic |
|---|---|
| `docs/PHASE1_PLAN.md` | Requirements and structure |
| `docs/PHASE2_NOTES.md` | Search rules and demo searches |
| `docs/PHASE3_DATABASE.md` | Tables, security rules, tests |
| `docs/PHASE4_CONNECT.md` | Connecting to Supabase |
| `docs/PHASE5_ADMIN.md` | Reports and admin dashboard |
| `docs/PHASE6_TESTING.md` | Polish and final test results |
| `docs/DEPLOY.md` | Putting the app online for free |
| `docs/LAUNCH_CHECKLIST.md` | Before using real data and real users |

## Security rules
- Never commit `.env.local` or any file with keys.
- Only the Supabase **publishable** (or legacy anon) key may be used in the frontend. The app refuses secret keys.
