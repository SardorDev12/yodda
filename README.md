# Yodda

**Learn once. Remember longer.**

Yodda is a minimalist spaced-repetition learning app. Add anything worth
remembering as a question/answer pair, and Yodda schedules it for review
using an SM-2-derived algorithm — no configuration required.

All data lives in **Supabase** (Postgres + Realtime + Auth) and nowhere
else — there is no local/offline mode. Every screen reads and writes the
cloud directly, and a realtime subscription keeps every signed-in device
(phone, tablet, web) in sync within moments of any change, with no manual
export/import step needed to move between devices. Signing in with an
email + password is required before the app does anything; see
[Cloud setup](#cloud-setup-required) below — **without it, the app
cannot run.**

A manual JSON export/import still exists in Settings → Data, but it's a
portable backup/migration tool (e.g. moving into a different account),
not how data gets from one device to another day-to-day — that's what
the automatic sync is for.

## Stack

- **App**: React Native + Expo (SDK 57) + TypeScript, Expo Router for navigation
- **Data**: Supabase (Postgres + Realtime + Row Level Security), the app's only store — see [Cloud setup](#cloud-setup-required)
- **Auth**: Supabase email/password, required to use the app
- **Scheduler**: SM-2-derived, implemented behind a `Scheduler` interface (`src/scheduler`) so it can be swapped for FSRS later without touching callers
- **Notifications**: `expo-notifications` for a daily review reminder

## Project structure

```
src/
  app/               Expo Router routes (screens)
    (tabs)/          Home, Library, Settings tabs
    subject/[id].tsx Subject detail
    review.tsx        Review flow (modal)
    add.tsx            Add knowledge (modal)
  db/                Supabase-backed queries (no local database)
  scheduler/         Scheduling algorithm (SM-2 today)
  lib/               Notifications, Supabase client, backup export/import
  components/        AuthGate (the mandatory sign-in screen) and others
  store/             Auth, settings, and realtime-refresh React contexts
  types/             Shared types
```

## Cloud setup (required)

The app has no local database — these steps are not optional, unlike an
earlier version of this project where sync was opt-in:

1. Create a free project at [supabase.com](https://supabase.com).
2. In its SQL editor, run `supabase/schema.sql` from this repo (creates
   `books`/`subjects`/`cards`/`user_settings` tables, row-level security,
   and enables Realtime on the content tables).
3. Copy `.env.example` to `.env` and fill in your project's URL and anon
   key (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Build the app (`npx expo start`, or a full `eas build` for a store
   release — these are build-time env vars, so they must be set wherever
   the build actually runs, including CI).

Without those env vars, `isSupabaseConfigured` is `false` and the app
shows a "cloud sync not configured" screen instead of starting — there's
nothing else for it to fall back to.

## Running it

```bash
npm install
npx expo start        # then press i / a / w, or scan the QR code with Expo Go
```

Or, to build native binaries in the cloud (no Xcode/Android Studio needed):

```bash
npx eas-cli@latest build --platform ios
npx eas-cli@latest build --platform android
```

See [Publishing](#publishing) below for the full path from here to the
App Store / Play Store.

### Deploying the web build to GitHub Pages

`app.config.js`'s `expo.experiments.baseUrl` is driven by an
`EXPO_WEB_BASE_URL` env var at export time, so the same codebase can
target both a GitHub Pages repo subpath (set to `/yodda`, matching this
repo's name) and a root-hosted platform like Cloudflare Pages (left
unset, giving root-relative asset paths). If you fork this repo under a
different name, update the value the GitHub Pages workflow passes.
`public/.nojekyll` is also required — GitHub Pages' Jekyll processing
otherwise drops the `_expo` directory (leading underscore).

`.github/workflows/gh-pages.yml` builds and publishes `dist/` to GitHub
Pages automatically on every push to `main` that touches app code (or via
"Run workflow" on demand), using the `EXPO_PUBLIC_SUPABASE_URL`/
`EXPO_PUBLIC_SUPABASE_ANON_KEY` repository secrets — the deployed site
needs real credentials to do anything past the sign-in screen. One-time
setup: repo **Settings → Pages → Source → GitHub Actions**, plus adding
those two secrets under **Settings → Secrets and variables → Actions**.

### Deploying the web build to Cloudflare Workers

`wrangler.toml` configures this as a Workers Static Assets site (the
current recommended way to serve a static build from a Worker, replacing
the older "Workers Sites"): `[assets] directory = "./dist"`, with
`not_found_handling = "single-page-application"` so direct navigation to
a dynamic route like `/book/<id>` — which only exists client-side, since
Expo's static export produces one shell HTML file per *route pattern*,
not per id — falls back to `index.html` and lets Expo Router's client
code take over instead of 404ing.

Workers serves from its own `*.workers.dev` subdomain or a custom domain
at the root, so this build intentionally does **not** set
`EXPO_WEB_BASE_URL` (unlike the GitHub Pages one, which needs `/yodda`)
— leaving it unset gives root-relative asset paths, correct here.

One-time setup, all via the Cloudflare dashboard:

1. **Create an API token**: dashboard → click your profile icon (top
   right) → **My Profile** → **API Tokens** → **Create Token** → use the
   **Edit Cloudflare Workers** template → scope it to your account →
   **Continue to summary** → **Create Token**. Copy it immediately (it's
   shown once).
2. **Find your Account ID**: dashboard → **Workers & Pages** → it's
   listed in the right-hand sidebar of that page (or under **Account
   Home** → copy the Account ID shown there).
3. **Add both as GitHub repo secrets**: this repo's GitHub page →
   **Settings → Secrets and variables → Actions → New repository
   secret** → add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
   with the values from steps 1–2. The `EXPO_PUBLIC_SUPABASE_URL` /
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` secrets from the GitHub Pages setup
   above are reused here too, if already added.

After that, `.github/workflows/cloudflare-worker.yml` builds and deploys
on every push to `main` that touches app code (or via "Run workflow" on
demand) — no further manual steps. The Worker's URL
(`https://yodda.<your-subdomain>.workers.dev`, or a custom domain you
attach to it afterward in **Workers & Pages → yodda → Settings →
Domains & Routes**) is shown in the Cloudflare dashboard once the first
deploy completes.

## Scheduler

Every review calls `scheduler.scheduleNextReview()` (`src/scheduler/index.ts`).
The current implementation (`src/scheduler/sm2.ts`) is an Anki-style
four-button variant of SM-2: **Again / Hard / Good / Easy**. Swapping in a
different algorithm (e.g. FSRS) means implementing the `Scheduler`
interface and changing one export — no other code changes.

## Publishing

`eas.json` (build profiles: `development`, `preview`, `production`) is
already in the repo. Everything past this point needs your own Apple/Google
accounts and an interactive login, so it's manual:

1. **Create accounts** (one-time, real money):
   - [Apple Developer Program](https://developer.apple.com/programs/) — $99/year
   - [Google Play Console](https://play.google.com/console) — $25 one-time

2. **Create a free Expo account** at [expo.dev](https://expo.dev), then log in:
   ```bash
   npx eas-cli@latest login
   ```

3. **Link this project to your Expo account** (writes an `extra.eas.projectId`
   into `app.config.js` — don't hand-edit that field):
   ```bash
   npx eas-cli@latest build:configure
   ```

4. **Set the Supabase env vars for EAS builds** (see
   [Cloud setup](#cloud-setup-required)) — on
   [expo.dev](https://expo.dev), your project → **Environment variables**
   → add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   for the build profiles you use. A build made without these will show
   the "cloud sync not configured" screen to every user.

5. **First production builds:**
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest build --platform android --profile production
   ```
   iOS will prompt to generate/upload signing credentials — let EAS manage
   them unless you already have certificates. This produces a `.ipa` and an
   `.aab` you can download from the EAS dashboard.

6. **Submit:**
   ```bash
   npx eas-cli@latest submit --platform ios
   npx eas-cli@latest submit --platform android
   ```
   iOS submission needs an App Store Connect API key (or Apple ID + app-specific
   password) when prompted. Android submission needs a Play Console service
   account JSON key the first time — `eas submit` walks you through generating one.
   Both can also just be uploaded manually through App Store Connect / Play
   Console instead of `eas submit`, if you'd rather not create those service
   credentials.

7. **Store listing, for both stores:**
   - Screenshots (a few required device sizes each — `assets/appicon.png` and
     screenshots from `expo start --web` or a simulator work for this)
   - Short + long description
   - **Privacy policy URL** — `docs/privacy.html` in this repo (hosted via
     GitHub Pages) discloses the account/email + content data collection;
     update it if your deployment differs
   - Play Store's **Data Safety** form needs real answers now: this app
     collects an email address (authentication) and user-generated content
     (the cards/books/reviews you create), both required to use the app at
     all — answer accordingly, not "no data collected"

8. **Review**: Apple review is typically 1–3 days; Google's is usually
   faster.

## OTA updates (EAS Update)

`expo-updates` is installed and configured (`app.config.js`'s `updates.url` +
`runtimeVersion: { policy: "appVersion" }`, and a `channel` per build
profile in `eas.json`). This means **JS/asset-only changes** — new
screens, copy, translations, most bug fixes — can ship instantly to
already-installed builds without going through the app stores or a new
native build:

```bash
npx eas-cli@latest update --channel preview --message "what changed"
```

Or trigger it from GitHub Actions (`.github/workflows/eas-update.yml`,
same `EXPO_TOKEN` secret as the build workflow) — pick a channel and it
publishes.

**This does not replace native builds.** Anything touching native code
or config — new native dependencies, `app.config.js` permissions/icons/plugins,
upgrading the Expo SDK — still needs a full `eas build` and, for
already-published apps, a new store submission. `runtimeVersion` is tied
to `version` in `app.config.js`: as long as that doesn't change, installed
builds keep pulling OTA updates from their channel; bumping it (as you
would for a new store release) requires a matching new build before
updates apply again.

## What's intentionally not built yet

Per the product plan, the MVP stays deliberately small: no AI card
generation, no PDF/article import, no gamification, no social features.
