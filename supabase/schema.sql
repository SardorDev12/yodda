-- Yodda cloud data schema.
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`).
-- Supabase is the app's only data store — every build needs a project
-- configured with this schema; there is no offline/local-only mode.

create extension if not exists "pgcrypto";

create table if not exists public.books (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id text not null,
  question text not null,
  answer text not null,
  status text not null default 'new',
  interval_days integer not null default 0,
  ease_factor real not null default 2.5,
  repetitions integer not null default 0,
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_user_id on public.books (user_id);
create index if not exists idx_subjects_user_id on public.subjects (user_id);
create index if not exists idx_subjects_book_id on public.subjects (book_id);
create index if not exists idx_cards_user_id on public.cards (user_id);
create index if not exists idx_cards_updated_at on public.cards (updated_at);
create index if not exists idx_cards_subject_id on public.cards (subject_id);

alter table public.books enable row level security;
alter table public.subjects enable row level security;
alter table public.cards enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "books_owner_all" on public.books;
create policy "books_owner_all" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subjects_owner_all" on public.subjects;
create policy "subjects_owner_all" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cards_owner_all" on public.cards;
create policy "cards_owner_all" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: let clients subscribe to postgres_changes on these tables.
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.cards;

-- App version gate: lets the app check "is this build too old" without a
-- store API or a new native build. One row per platform.
--   min_version    — below this, the app blocks with a forced-update modal.
--   latest_version — below this (but >= min_version), the app shows a
--                    dismissible "update available" modal.
-- Versions compare as dot-separated integers (e.g. "1.2.0"), left to right.
create table if not exists public.app_config (
  platform text primary key check (platform in ('ios', 'android')),
  min_version text not null,
  latest_version text not null,
  update_url text,
  message text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- Readable by anyone, including signed-out clients — there's no user to
-- scope this to, and the app needs it before/without auth too.
drop policy if exists "app_config_public_read" on public.app_config;
create policy "app_config_public_read" on public.app_config
  for select using (true);

-- No insert/update/delete policy is defined on purpose: RLS defaults to
-- deny, so only editing via the Supabase SQL editor / service role (which
-- bypasses RLS) can change these rows — never the app itself.

-- iOS update_url stays null until the app is live on the App Store — fill
-- it in (and bump min_version/latest_version as needed) once it ships.
insert into public.app_config (platform, min_version, latest_version, update_url)
values
  ('ios', '1.0.0', '1.0.0', null),
  ('android', '1.0.0', '1.0.0', 'https://play.google.com/store/apps/details?id=uz.yodda.app')
on conflict (platform) do nothing;
