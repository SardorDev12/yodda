# Yodda

**Learn once. Remember longer.**

Yodda is a minimalist spaced-repetition learning app. Add anything worth
remembering as a question/answer pair, and Yodda schedules it for review
using an SM-2-derived algorithm — no configuration required.

All data is **local-only**: everything is stored on-device in SQLite.
There is no account, no backend, and nothing is ever sent to the cloud.
Moving to a new phone? Settings → Data → **Export data** writes a JSON
backup and opens the share sheet (save it anywhere — Drive, email,
Bluetooth); **Import data** on the new device reads that file back in.
It's a Yodda-only format, not meant for other apps.

## Stack

- **App**: React Native + Expo (SDK 57) + TypeScript, Expo Router for navigation
- **Storage**: SQLite (`expo-sqlite`), entirely on-device
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
  db/                SQLite schema + queries
  scheduler/         Scheduling algorithm (SM-2 today)
  lib/               Notifications
  types/             Shared types
```

## Running it

This app was built entirely in a cloud session with no local device
available, so it has **not** been visually verified in a simulator or
browser yet. It has been verified to typecheck (`tsc --noEmit`), lint
clean (`expo lint`), and successfully export a static web build
(`expo export -p web`) covering every screen/route.

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

### Web caveat

`expo-sqlite`'s web backend uses WebAssembly (wa-sqlite) and needs
`Cross-Origin-Opener-Policy: same-origin` / `Cross-Origin-Embedder-Policy:
require-corp` response headers to work at runtime in a browser. The
bundler config for this (`metro.config.js`) is in place and the static
export builds successfully, but if you serve `expo start --web` locally
and the database fails to open, add those headers via your dev-server or
hosting config.

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
   into `app.json` — don't hand-edit that field):
   ```bash
   npx eas-cli@latest build:configure
   ```

4. **First production builds:**
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest build --platform android --profile production
   ```
   iOS will prompt to generate/upload signing credentials — let EAS manage
   them unless you already have certificates. This produces a `.ipa` and an
   `.aab` you can download from the EAS dashboard.

5. **Submit:**
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

6. **Store listing, for both stores:**
   - Screenshots (a few required device sizes each — `assets/appicon.png` and
     screenshots from `expo start --web` or a simulator work for this)
   - Short + long description
   - **Privacy policy URL** — required even though Yodda stores nothing
     remotely; a one-line hosted page ("Yodda does not collect or transmit
     any data; everything stays on your device.") satisfies this
   - Play Store also requires a content rating questionnaire and a Data
     Safety form — answer "no data collected" throughout, since that's true

7. **Review**: Apple review is typically 1–3 days; Google's is usually
   faster. Once approved, both stores handle distribution — no further
   infrastructure needed since the app has no backend.

## OTA updates (EAS Update)

`expo-updates` is installed and configured (`app.json`'s `updates.url` +
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
or config — new native dependencies, `app.json` permissions/icons/plugins,
upgrading the Expo SDK — still needs a full `eas build` and, for
already-published apps, a new store submission. `runtimeVersion` is tied
to `version` in `app.json`: as long as that doesn't change, installed
builds keep pulling OTA updates from their channel; bumping it (as you
would for a new store release) requires a matching new build before
updates apply again.

## What's intentionally not built yet

Per the product plan, the MVP stays deliberately small: no AI card
generation, no PDF/article import, no gamification, no social features,
no cloud sync. Those are natural future additions once the core recall
loop is validated.
