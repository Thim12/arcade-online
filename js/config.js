/**
 * config.js – Supabase configuration + demo mode flag
 *
 * To connect a real Supabase project:
 *   1. Create a project at https://supabase.com
 *   2. Paste your Project URL and anon key below
 *   3. Run the SQL schema from the comment block at the bottom
 */

const SUPABASE_URL  = 'https://bvuoidvssqfgzfllwthx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dW9pZHZzc3FmZ3pmbGx3dGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODU0ODcsImV4cCI6MjA5MDU2MTQ4N30.oMRUti6FeMwq09R83SNpS71Qva7yZp2BhNM2znRru3E';

/**
 * True when no Supabase keys are configured.
 * All data is then stored in localStorage.
 */
const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON;

/**
 * Supabase client (only initialised when keys are present).
 * We load the Supabase CDN lazily to avoid network errors in demo mode.
 */
let supabase = null;

async function initSupabase() {
  if (DEMO_MODE) return null;
  try {
    const { createClient } = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
    );
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
    return supabase;
  } catch (e) {
    console.warn('Supabase konnte nicht geladen werden – Demo-Modus aktiv.', e);
    return null;
  }
}

/*
  ============================================================
  SUPABASE SQL SCHEMA
  (Run this in the Supabase SQL editor once)
  ============================================================

  -- Profiles (extends auth.users)
  create table public.profiles (
    id          uuid references auth.users on delete cascade primary key,
    name        text not null,
    sport       text not null default 'fussball',
    level       text not null default 'anfanger',
    location    text,
    bio         text,
    avatar_url  text,
    xp          int  not null default 0,
    matches     int  not null default 0,
    wins        int  not null default 0,
    trainings   int  not null default 0,
    club_status text default 'suche',
    created_at  timestamptz not null default now()
  );

  alter table public.profiles enable row level security;

  create policy "Profiles are viewable by everyone"
    on public.profiles for select using (true);

  create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);

  -- Follows
  create table public.follows (
    follower_id uuid references public.profiles(id) on delete cascade,
    following_id uuid references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, following_id)
  );

  alter table public.follows enable row level security;

  create policy "Follows viewable by everyone"
    on public.follows for select using (true);

  create policy "Users manage own follows"
    on public.follows for all using (auth.uid() = follower_id);

  -- Messages
  create table public.messages (
    id          uuid primary key default gen_random_uuid(),
    from_id     uuid references public.profiles(id) on delete cascade,
    to_id       uuid references public.profiles(id) on delete cascade,
    body        text not null,
    created_at  timestamptz not null default now()
  );

  alter table public.messages enable row level security;

  create policy "Users see own messages"
    on public.messages for select
    using (auth.uid() = from_id or auth.uid() = to_id);

  create policy "Users send messages"
    on public.messages for insert with check (auth.uid() = from_id);

  ============================================================
*/
