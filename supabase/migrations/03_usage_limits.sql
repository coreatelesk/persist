-- Usage limits: stop accounts from creating unlimited habits/challenges.
-- Enforced in the database (not just the UI), so calling the API directly cannot bypass it.
-- Counts NEW items created per calendar month (UTC). Deleting an item does not give the
-- allowance back, so create-delete loops can't be used to get around the cap.
-- Safe to run more than once. Run after 202610100002_production_hardening.sql.

-- 1. Limits live in a table so you can change them with SQL, without redeploying:
--      update public.app_limits set value = 30 where key = 'habits_per_month';
create table if not exists public.app_limits (
  key text primary key,
  value integer not null check (value >= 0)
);
insert into public.app_limits (key, value) values
  ('habits_per_month', 20),
  ('challenges_per_month', 10)
on conflict (key) do nothing;

alter table public.app_limits enable row level security;
drop policy if exists "app_limits_read" on public.app_limits;
create policy "app_limits_read" on public.app_limits for select to authenticated using (true);
grant select on public.app_limits to authenticated;
revoke all on public.app_limits from anon;

-- 2. Per-user, per-month counters. Only the trigger below writes to it.
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  habits_created integer not null default 0,
  challenges_created integer not null default 0,
  primary key (user_id, month)
);

alter table public.usage_counters enable row level security;
drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own" on public.usage_counters
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.usage_counters to authenticated;
revoke all on public.usage_counters from anon;

-- 3. Count what was already created this month, so existing accounts start accurate.
insert into public.usage_counters (user_id, month, habits_created, challenges_created)
select u, m, sum(h)::integer, sum(c)::integer
from (
  select user_id as u, to_char(created_at at time zone 'utc', 'YYYY-MM') as m, 1 as h, 0 as c
  from public.habits
  where created_at >= date_trunc('month', timezone('utc', now())) at time zone 'utc'
  union all
  select user_id, to_char(created_at at time zone 'utc', 'YYYY-MM'), 0, 1
  from public.challenges
  where created_at >= date_trunc('month', timezone('utc', now())) at time zone 'utc'
) x
group by u, m
on conflict (user_id, month) do nothing;

-- 4. The enforcement trigger. A failed insert rolls the counter back with it.
create or replace function public.enforce_creation_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind text := tg_argv[0];
  m text := to_char(timezone('utc', now()), 'YYYY-MM');
  cap integer;
  used integer;
begin
  select value into cap from public.app_limits where key = kind || '_per_month';

  if kind = 'habits' then
    insert into public.usage_counters (user_id, month, habits_created)
    values (new.user_id, m, 1)
    on conflict (user_id, month)
      do update set habits_created = public.usage_counters.habits_created + 1
    returning habits_created into used;
  else
    insert into public.usage_counters (user_id, month, challenges_created)
    values (new.user_id, m, 1)
    on conflict (user_id, month)
      do update set challenges_created = public.usage_counters.challenges_created + 1
    returning challenges_created into used;
  end if;

  if cap is not null and used > cap then
    raise exception 'limit_reached:%:%', kind, cap;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_creation_limit() from public, anon, authenticated;

drop trigger if exists habits_enforce_limit on public.habits;
create trigger habits_enforce_limit before insert on public.habits
  for each row execute function public.enforce_creation_limit('habits');

drop trigger if exists challenges_enforce_limit on public.challenges;
create trigger challenges_enforce_limit before insert on public.challenges
  for each row execute function public.enforce_creation_limit('challenges');
