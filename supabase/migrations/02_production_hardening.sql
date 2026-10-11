-- Persist: production hardening. Safe to run more than once.
-- Run this AFTER 202610100001_initial_schema.sql (Supabase SQL Editor or `supabase db push`).

-- 1. Table privileges -------------------------------------------------------
-- Newer Supabase projects no longer expose new public tables to the API
-- automatically, which makes inserts fail with "permission denied". Grant
-- exactly what signed-in users need; Row Level Security still limits every
-- row to its owner.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, delete on public.habit_completions to authenticated;
grant select, insert, update, delete on public.challenges to authenticated;
grant select, insert, delete on public.challenge_completions to authenticated;

-- Signed-out visitors never need these tables.
revoke all on public.profiles, public.habits, public.habit_completions,
              public.challenges, public.challenge_completions from anon;

-- 2. Profiles for accounts created before the signup trigger existed -----------
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 3. Challenges get an explicit goal ------------------------------------------
alter table public.challenges add column if not exists target_days integer;
update public.challenges set target_days = (ends_on - starts_on) + 1 where target_days is null;
alter table public.challenges alter column target_days set not null;

alter table public.challenges drop constraint if exists challenges_target_days_range;
alter table public.challenges add constraint challenges_target_days_range
  check (target_days between 1 and (ends_on - starts_on) + 1);

alter table public.challenges drop constraint if exists challenges_max_duration;
alter table public.challenges add constraint challenges_max_duration
  check (ends_on - starts_on <= 364);

-- 4. One check-in per challenge per day ---------------------------------------
-- The original unique key included a nullable label, so NULL labels never
-- collided and duplicates were possible.
delete from public.challenge_completions a
using public.challenge_completions b
where a.challenge_id = b.challenge_id
  and a.completed_on = b.completed_on
  and a.ctid > b.ctid;

alter table public.challenge_completions
  drop constraint if exists challenge_completions_challenge_id_completed_on_task_label_key;
create unique index if not exists challenge_completions_one_per_day
  on public.challenge_completions (challenge_id, completed_on);

-- 5. Validate custom-day schedules --------------------------------------------
alter table public.habits drop constraint if exists habits_custom_days;
alter table public.habits add constraint habits_custom_days check (
  case
    when schedule ->> 'kind' = 'custom' then
      case
        when jsonb_typeof(schedule -> 'days') = 'array'
          then jsonb_array_length(schedule -> 'days') between 1 and 7
        else false
      end
    else true
  end
);

-- 6. Keep updated_at honest ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();
drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- 7. Tighter check-in policies -------------------------------------------------
-- Habit check-ins cannot be dated more than a day ahead (covers every time zone).
drop policy if exists "habit_completions_insert_own" on public.habit_completions;
create policy "habit_completions_insert_own" on public.habit_completions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and completed_on <= current_date + 1
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

-- Challenge check-ins must fall inside the challenge's own dates.
drop policy if exists "challenge_completions_insert_own" on public.challenge_completions;
create policy "challenge_completions_insert_own" on public.challenge_completions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_id
        and c.user_id = (select auth.uid())
        and completed_on between c.starts_on and c.ends_on
    )
  );
