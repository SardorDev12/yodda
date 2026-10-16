-- Yodda cloud sync schema.
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`).
-- The app works fully offline without this; it only enables cross-device sync.

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

create index if not exists idx_books_user_id on public.books (user_id);
create index if not exists idx_subjects_user_id on public.subjects (user_id);
create index if not exists idx_subjects_book_id on public.subjects (book_id);
create index if not exists idx_cards_user_id on public.cards (user_id);
create index if not exists idx_cards_updated_at on public.cards (updated_at);

alter table public.books enable row level security;
alter table public.subjects enable row level security;
alter table public.cards enable row level security;

drop policy if exists "books_owner_all" on public.books;
create policy "books_owner_all" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subjects_owner_all" on public.subjects;
create policy "subjects_owner_all" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cards_owner_all" on public.cards;
create policy "cards_owner_all" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: let clients subscribe to postgres_changes on these tables.
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.cards;
