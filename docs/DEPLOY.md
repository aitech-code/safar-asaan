# Putting Safar Asaan online (free): GitHub + Cloudflare Pages

Result: a public `https://<name>.pages.dev` address. Every time you push changes to GitHub, Cloudflare rebuilds the site automatically.

Cost: free (GitHub free plan, Cloudflare Pages free plan). Dashboard wording may change slightly over time.

## Part A: Save the project to GitHub (one time)

1. Install **Git for Windows** from https://git-scm.com (keep all default options). Close and reopen VS Code.
2. In the VS Code terminal, check it works: `git --version`
3. Tell Git who you are (once):
   ```
   git config --global user.name "Zeeshan Ahmad"
   git config --global user.email "your-github-email@example.com"
   ```
4. Create the local history:
   ```
   git init
   git add .
   git status
   ```
   **Check the list:** `.env.local` and `node_modules` must NOT appear. (`.gitignore` excludes them.) If `.env.local` appears, stop and ask.
   ```
   git commit -m "Safar Asaan prototype (phases 1-6)"
   ```
5. On github.com: **+ → New repository** → name `safar-asaan` → **Private** → do NOT add a README → **Create repository**.
6. Connect and upload (replace YOUR-USERNAME):
   ```
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/safar-asaan.git
   git push -u origin main
   ```
   A browser window asks you to sign in to GitHub the first time. Approve it.

## Part B: Publish with Cloudflare Pages

1. Create a free account at https://dash.cloudflare.com.
2. **Workers & Pages → Create application → Pages → Connect to Git** (may be shown as "Import an existing Git repository").
3. Authorise GitHub, choose **only** the `safar-asaan` repository, then select it.
4. Build settings:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `React (Vite)` (or `None`) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

5. **Environment variables** (same values as your `.env.local`):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://wmdmitxtaeuihbimqbsf.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_…` key (NEVER the secret key) |
   | `NODE_VERSION` | `22` |

6. **Save and Deploy**. The first build takes 1–3 minutes. You get an address like `https://safar-asaan.pages.dev`.

## Part C: Check the live site

- Open the address on your phone (mobile data, not Wi-Fi, is a good test).
- Footer says **Data: online database**.
- Search sitara → noor → R1, Rs 50.
- `/admin` → sign in works.
- Chrome menu (⋮) → **Add to Home screen / Install app** → the Safar Asaan icon appears.
- Turn on aeroplane mode, open the app from the icon → it opens and says it is showing saved data.

## Updating the site later

```
git add .
git commit -m "Describe the change"
git push
```
Cloudflare rebuilds automatically in about 2 minutes.

## Notes

- Cloudflare Pages serves the app for every address (e.g. `/route/...`, `/admin`) because there is no `404.html` (single-page app mode).
- The publishable key ends up inside the website files. That is expected and safe: Row Level Security controls what it can do.
