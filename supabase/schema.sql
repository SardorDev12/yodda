-- Yodda schema. Run in the Supabase SQL editor.
-- Every user-scoped table is protected by RLS: auth.uid() = user_id.

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  question text not null,
  answer text not null,
  status text not null default 'new' check (status in ('new', 'learning', 'review', 'mature')),
  interval_days integer not null default 0,
  ease_factor real not null default 2.5,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per platform; public-read, no write policy (edit via SQL editor / service role only).
create table if not exists public.app_config (
  platform text primary key check (platform in ('ios', 'android', 'web')),
  min_version text not null default '1.0.0',
  latest_version text not null default '1.0.0',
  update_url text,
  message text
);

create index if not exists subjects_book_idx on public.subjects (book_id);
create index if not exists cards_subject_idx on public.cards (subject_id);
create index if not exists cards_user_due_idx on public.cards (user_id, deleted, due_at);

alter table public.books enable row level security;
alter table public.subjects enable row level security;
alter table public.cards enable row level security;
alter table public.user_settings enable row level security;
alter table public.app_config enable row level security;

create policy "own books" on public.books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subjects" on public.subjects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cards" on public.cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public read app_config" on public.app_config for select
  using (true);

-- Realtime: screens refetch when these change.
alter publication supabase_realtime add table public.books, public.subjects, public.cards;

insert into public.app_config (platform, min_version, latest_version)
values ('ios', '1.0.0', '1.0.0'), ('android', '1.0.0', '1.0.0'), ('web', '1.0.0', '1.0.0')
on conflict (platform) do nothing;
