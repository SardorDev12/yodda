# Yodda

Cross-platform spaced-repetition flashcards (Expo / React Native + Expo Router; iOS, Android, web).
Library = **Book → Subject → Card**; reviews use a swappable SM-2-derived scheduler. Supabase is the sole backend.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor (tables, RLS, realtime, `app_config`).
2. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. `npm install`, then `npm run web` / `npm run ios` / `npm run android`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript check |
| `npm test` | Scheduler + version-compare unit tests |
| `npm run build:web` | Static web export to `dist/` |
| `npm run deploy` | Build and deploy to Cloudflare Workers (`wrangler.jsonc`) |

## Layout

- `app/` – Expo Router routes (`(tabs)` Home/Library/Settings, `book/[id]`, `subject/[id]`, `edit-card/[id]`, `review`, `about`)
- `src/components/` – `AuthGate`, `VersionGate`/`UpdatePrompt`, `WebSidebar`, custom `RenameModal`/`ConfirmModal`/`RowMenu`, UI kit
- `src/data/` – Supabase access, backup/restore, settings
- `src/lib/` – scheduler, version compare, reminders, Supabase client
- `src/i18n/translations.ts` – Uzbek (default), Russian, English

Cross-platform notes: `Alert.alert/prompt` and `Link asChild` are avoided (unreliable on web); use the custom modals and `Pressable` + `router.push()`.
Version gate: edit the `app_config` row for a platform to change `min_version` / `latest_version` without a new build.
