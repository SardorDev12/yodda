# Yodda

**Learn once. Remember longer.**

Yodda is a minimalist spaced-repetition learning app. Add anything worth
remembering as a question/answer pair, and Yodda schedules it for review
using an SM-2-derived algorithm — no configuration required.

All data is **local-only**: everything is stored on-device in SQLite.
There is no account, no backend, and nothing is ever sent to the cloud.

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

## What's intentionally not built yet

Per the product plan, the MVP stays deliberately small: no AI card
generation, no PDF/article import, no gamification, no social features,
no cloud sync. Those are natural future additions once the core recall
loop is validated.
