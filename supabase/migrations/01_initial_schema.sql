-- Persist initial schema. Apply with Supabase CLI or SQL editor.
-- Every user-owned row is scoped by auth.uid() through RLS. Do not disable RLS in production.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 240),
  schedule jsonb not null default '{"kind":"daily"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint habits_schedule_kind check (schedule ->> 'kind' in ('daily', 'weekdays', 'custom', 'weekly_target')),
  constraint habits_weekly_target check (
    schedule ->> 'kind' <> 'weekly_target'
    or ((schedule ->> 'target') ~ '^[1-7]$')
  )
);

create index if not exists habits_user_active_idx on public.habits(user_id, created_at desc) where archived_at is null;

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);
create index if not exists habit_completions_user_date_idx on public.habit_completions(user_id, completed_on desc);
create index if not exists habit_completions_habit_date_idx on public.habit_completions(habit_id, completed_on desc);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  starts_on date not null,
  ends_on date not null,
  schedule jsonb not null default '{"kind":"daily"}'::jsonb,
  status text not null default 'active' check (status in ('active', 'completed', 'ended', 'archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_date_order check (ends_on >= starts_on)
);
create index if not exists challenges_user_status_dates_idx on public.challenges(user_id, status, starts_on, ends_on);

create table if not exists public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  completed_on date not null,
  task_label text check (task_label is null or char_length(task_label) <= 160),
  created_at timestamptz not null default now(),
  unique (challenge_id, completed_on, task_label)
);
create index if not exists challenge_completions_user_date_idx on public.challenge_completions(user_id, completed_on desc);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_completions enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "habits_select_own" on public.habits for select to authenticated using ((select auth.uid()) = user_id);
create policy "habits_insert_own" on public.habits for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "habits_update_own" on public.habits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "habits_delete_own" on public.habits for delete to authenticated using ((select auth.uid()) = user_id);

create policy "habit_completions_select_own" on public.habit_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "habit_completions_insert_own" on public.habit_completions for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
);
create policy "habit_completions_delete_own" on public.habit_completions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "challenges_select_own" on public.challenges for select to authenticated using ((select auth.uid()) = user_id);
create policy "challenges_insert_own" on public.challenges for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "challenges_update_own" on public.challenges for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "challenges_delete_own" on public.challenges for delete to authenticated using ((select auth.uid()) = user_id);

create policy "challenge_completions_select_own" on public.challenge_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "challenge_completions_insert_own" on public.challenge_completions for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = (select auth.uid()))
);
create policy "challenge_completions_delete_own" on public.challenge_completions for delete to authenticated using ((select auth.uid()) = user_id);

-- Note: service-role keys bypass RLS. Never put them in NEXT_PUBLIC_* or client bundles.
