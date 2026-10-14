-- Persist migration 004: admin dashboard, entitlements, active/archived limits,
-- activity tracking, account management and account deletion.
--
-- Safe to run on a database that already has users and data, and safe to run twice.
-- Run it after 202610110003_usage_limits.sql. Nothing a user created is deleted or rewritten
-- (the only data edit is trimming any display name longer than 60 characters, see section 2).

-- =============================================================================
-- 1. Retire the monthly creation quotas from migration 003
-- =============================================================================
-- These were only counters and settings for the old quota rule (no user content), and they
-- would conflict with the new active/archived limits, so they are removed.
drop trigger if exists habits_enforce_limit on public.habits;
drop trigger if exists challenges_enforce_limit on public.challenges;
drop function if exists public.enforce_creation_limit();
drop table if exists public.usage_counters;
drop table if exists public.app_limits;

-- =============================================================================
-- 2. Profiles: optional mobile number, last-active timestamp
-- =============================================================================
alter table public.profiles add column if not exists mobile_number text;
alter table public.profiles add column if not exists last_active_at timestamptz;

update public.profiles set display_name = left(display_name, 60) where char_length(display_name) > 60;

alter table public.profiles drop constraint if exists profiles_display_name_len;
alter table public.profiles add constraint profiles_display_name_len
  check (display_name is null or char_length(display_name) <= 60);
alter table public.profiles drop constraint if exists profiles_mobile_format;
alter table public.profiles add constraint profiles_mobile_format
  check (mobile_number is null or mobile_number ~ '^\+?[0-9]{7,15}$');

-- Users may edit only their own profile details. last_active_at is maintained by the database.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, mobile_number, timezone) on public.profiles to authenticated;
grant update (display_name, mobile_number, timezone) on public.profiles to authenticated;

-- updated_at should change only when the person edits their profile, not on activity pings.
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name
        or old.mobile_number is distinct from new.mobile_number
        or old.timezone is distinct from new.timezone)
  execute function public.set_updated_at();

-- =============================================================================
-- 3. Activity tracking (minimal: user, event type, optional item id, time)
-- =============================================================================
-- No habit titles, notes, phone numbers or other content are stored here.
create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null check (char_length(event) between 1 and 40),
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_idx on public.activity_events (created_at desc);
create index if not exists activity_events_user_created_idx on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon, authenticated;
-- (No RLS policies: only the trigger functions below and the admin functions touch this table.)

create or replace function public.record_activity(p_user uuid, p_event text, p_entity uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_events (user_id, event, entity_id) values (p_user, p_event, p_entity);
  update public.profiles
     set last_active_at = now()
   where id = p_user
     and (last_active_at is null or last_active_at < now() - interval '1 minute');
end;
$$;
revoke all on function public.record_activity(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.log_habit_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.record_activity(new.user_id, 'habit_created', new.id);
  elsif old.archived_at is null and new.archived_at is not null then
    perform public.record_activity(new.user_id, 'habit_archived', new.id);
  elsif old.archived_at is not null and new.archived_at is null then
    perform public.record_activity(new.user_id, 'habit_restored', new.id);
  elsif (old.title, old.description, old.schedule) is distinct from (new.title, new.description, new.schedule) then
    perform public.record_activity(new.user_id, 'habit_updated', new.id);
  end if;
  return null;
end;
$$;

create or replace function public.log_challenge_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.record_activity(new.user_id, 'challenge_created', new.id);
  elsif old.status is distinct from new.status then
    perform public.record_activity(
      new.user_id,
      case
        when new.status = 'completed' then 'challenge_completed'
        when new.status = 'ended' then 'challenge_ended'
        when new.status = 'archived' then 'challenge_archived'
        when old.status = 'archived' then 'challenge_restored'
        else 'challenge_updated'
      end,
      new.id
    );
  end if;
  return null;
end;
$$;

create or replace function public.log_habit_checkin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.record_activity(new.user_id, 'checkin', new.habit_id);
  return null;
end;
$$;

create or replace function public.log_challenge_checkin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.record_activity(new.user_id, 'checkin', new.challenge_id);
  return null;
end;
$$;

revoke all on function public.log_habit_activity(), public.log_challenge_activity(),
  public.log_habit_checkin(), public.log_challenge_checkin() from public, anon, authenticated;

drop trigger if exists habits_log_activity on public.habits;
create trigger habits_log_activity after insert or update on public.habits
  for each row execute function public.log_habit_activity();
drop trigger if exists challenges_log_activity on public.challenges;
create trigger challenges_log_activity after insert or update on public.challenges
  for each row execute function public.log_challenge_activity();
drop trigger if exists habit_completions_log_activity on public.habit_completions;
create trigger habit_completions_log_activity after insert on public.habit_completions
  for each row execute function public.log_habit_checkin();
drop trigger if exists challenge_completions_log_activity on public.challenge_completions;
create trigger challenge_completions_log_activity after insert on public.challenge_completions
  for each row execute function public.log_challenge_checkin();

-- One-time backfill from history that already exists, so charts are not empty on day one.
-- Only runs while the table is empty, so re-running the migration never duplicates events.
do $$
begin
  if not exists (select 1 from public.activity_events limit 1) then
    insert into public.activity_events (user_id, event, entity_id, created_at)
    select user_id, 'habit_created', id, created_at from public.habits
    union all select user_id, 'challenge_created', id, created_at from public.challenges
    union all select user_id, 'checkin', habit_id, created_at from public.habit_completions
    union all select user_id, 'checkin', challenge_id, created_at from public.challenge_completions;

    update public.profiles p
       set last_active_at = e.last_seen
      from (select user_id, max(created_at) as last_seen from public.activity_events group by user_id) e
     where p.id = e.user_id and p.last_active_at is null;
  end if;
end;
$$;

-- Indexes used by the admin analytics.
create index if not exists habits_created_idx on public.habits (created_at);
create index if not exists challenges_created_idx on public.challenges (created_at);
create index if not exists habit_completions_created_idx on public.habit_completions (created_at);
create index if not exists challenge_completions_created_idx on public.challenge_completions (created_at);
create index if not exists habits_user_archived_idx on public.habits (user_id) where archived_at is not null;

-- =============================================================================
-- 4. Admin role
-- =============================================================================
-- Nobody is an admin by default. Grant it with SQL (see README), never from the app.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.assert_admin() from public, anon, authenticated;

-- =============================================================================
-- 5. Entitlements: plans and per-user plan assignment
-- =============================================================================
-- Every user is on the "free" plan unless a row in user_plans says otherwise.
-- A NULL limit means "unlimited". `features` holds on/off flags (ad_free, reminders, ...).
-- Future plans are added as rows here; no code change is needed for new limit values.
create table if not exists public.plans (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  max_active_habits integer check (max_active_habits is null or max_active_habits >= 0),
  max_active_challenges integer check (max_active_challenges is null or max_active_challenges >= 0),
  max_archived_habits integer check (max_archived_habits is null or max_archived_habits >= 0),
  max_archived_challenges integer check (max_archived_challenges is null or max_archived_challenges >= 0),
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, max_active_habits, max_active_challenges, max_archived_habits, max_archived_challenges, features)
values ('free', 'Free', 10, 10, 20, 20, '{"ad_free": false, "reminders": false}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.user_plans enable row level security;
revoke all on public.plans, public.user_plans from anon, authenticated;
grant select on public.plans, public.user_plans to authenticated;
drop policy if exists "plans_read" on public.plans;
create policy "plans_read" on public.plans for select to authenticated using (true);
drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.entitlements_for(p_user uuid)
returns public.plans
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.plans p
  where p.id = coalesce((select up.plan_id from public.user_plans up where up.user_id = p_user), 'free');
$$;
revoke all on function public.entitlements_for(uuid) from public, anon, authenticated;

-- A challenge counts as "active" while its status is active and it has not run out.
-- (One day of slack covers every time zone.) Finished challenges are neither active nor archived.
create or replace function public.is_challenge_active(p_status text, p_ends_on date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status = 'active' and p_ends_on >= (timezone('utc', now()))::date - 1;
$$;

-- What the app reads to show limits, usage and feature flags. Always about the signed-in user.
create or replace function public.my_limits()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  p public.plans;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into p from public.entitlements_for(uid);
  return jsonb_build_object(
    'plan', coalesce(p.id, 'free'),
    'plan_name', coalesce(p.name, 'Free'),
    'limits', jsonb_build_object(
      'active_habits', case when p.id is null then 10 else p.max_active_habits end,
      'active_challenges', case when p.id is null then 10 else p.max_active_challenges end,
      'archived_habits', case when p.id is null then 20 else p.max_archived_habits end,
      'archived_challenges', case when p.id is null then 20 else p.max_archived_challenges end
    ),
    'usage', jsonb_build_object(
      'active_habits', (select count(*) from public.habits h where h.user_id = uid and h.archived_at is null),
      'archived_habits', (select count(*) from public.habits h where h.user_id = uid and h.archived_at is not null),
      'active_challenges', (select count(*) from public.challenges c where c.user_id = uid and public.is_challenge_active(c.status, c.ends_on)),
      'archived_challenges', (select count(*) from public.challenges c where c.user_id = uid and c.status = 'archived')
    ),
    'features', coalesce(p.features, '{}'::jsonb)
  );
end;
$$;
revoke all on function public.my_limits() from public, anon;
grant execute on function public.my_limits() to authenticated;

-- =============================================================================
-- 6. Enforcing the limits (active and archived), concurrency-safe
-- =============================================================================
-- A trigger fires on every insert and on every status change. It only blocks a change that
-- would move an item INTO a category that is already at (or over) its limit. Changes that
-- reduce a count, or leave it unchanged, are always allowed, so someone who is already over a
-- limit keeps all their data and can still tidy up. A per-user advisory lock serialises the
-- check, so simultaneous requests cannot both slip under the limit.
create or replace function public.enforce_habit_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
  v_cap integer;
  v_count integer;
  v_to_active boolean := new.archived_at is null;
  v_to_archived boolean := new.archived_at is not null;
  v_was_active boolean := false;
  v_was_archived boolean := false;
begin
  -- Check ownership first. BEFORE triggers run ahead of row-level security, so without this a user
  -- inserting into someone else's account would see that account's limit error instead of "forbidden".
  if (select auth.uid()) is not null and new.user_id is distinct from (select auth.uid()) then
    raise exception 'new row violates row-level security policy' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    v_was_active := old.archived_at is null;
    v_was_archived := old.archived_at is not null;
  end if;

  if (v_to_active and not v_was_active) or (v_to_archived and not v_was_archived) then
    perform pg_advisory_xact_lock(hashtextextended('persist:limits:' || new.user_id::text, 0));
    select * into v_plan from public.entitlements_for(new.user_id);

    if v_to_active and not v_was_active then
      v_cap := case when v_plan.id is null then 10 else v_plan.max_active_habits end;
      if v_cap is not null then
        select count(*) into v_count from public.habits
         where user_id = new.user_id and archived_at is null and id <> new.id;
        if v_count >= v_cap then
          raise exception 'limit_reached:active_habits:%', v_cap;
        end if;
      end if;
    end if;

    if v_to_archived and not v_was_archived then
      v_cap := case when v_plan.id is null then 20 else v_plan.max_archived_habits end;
      if v_cap is not null then
        select count(*) into v_count from public.habits
         where user_id = new.user_id and archived_at is not null and id <> new.id;
        if v_count >= v_cap then
          raise exception 'limit_reached:archived_habits:%', v_cap;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_challenge_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
  v_cap integer;
  v_count integer;
  v_to_active boolean := public.is_challenge_active(new.status, new.ends_on);
  v_to_archived boolean := new.status = 'archived';
  v_was_active boolean := false;
  v_was_archived boolean := false;
begin
  -- Check ownership first. BEFORE triggers run ahead of row-level security, so without this a user
  -- inserting into someone else's account would see that account's limit error instead of "forbidden".
  if (select auth.uid()) is not null and new.user_id is distinct from (select auth.uid()) then
    raise exception 'new row violates row-level security policy' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    v_was_active := public.is_challenge_active(old.status, old.ends_on);
    v_was_archived := old.status = 'archived';
  end if;

  if (v_to_active and not v_was_active) or (v_to_archived and not v_was_archived) then
    perform pg_advisory_xact_lock(hashtextextended('persist:limits:' || new.user_id::text, 0));
    select * into v_plan from public.entitlements_for(new.user_id);

    if v_to_active and not v_was_active then
      v_cap := case when v_plan.id is null then 10 else v_plan.max_active_challenges end;
      if v_cap is not null then
        select count(*) into v_count from public.challenges c
         where c.user_id = new.user_id and c.id <> new.id and public.is_challenge_active(c.status, c.ends_on);
        if v_count >= v_cap then
          raise exception 'limit_reached:active_challenges:%', v_cap;
        end if;
      end if;
    end if;

    if v_to_archived and not v_was_archived then
      v_cap := case when v_plan.id is null then 20 else v_plan.max_archived_challenges end;
      if v_cap is not null then
        select count(*) into v_count from public.challenges c
         where c.user_id = new.user_id and c.id <> new.id and c.status = 'archived';
        if v_count >= v_cap then
          raise exception 'limit_reached:archived_challenges:%', v_cap;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_habit_limits(), public.enforce_challenge_limits() from public, anon, authenticated;

drop trigger if exists habits_enforce_limits on public.habits;
create trigger habits_enforce_limits before insert or update on public.habits
  for each row execute function public.enforce_habit_limits();
drop trigger if exists challenges_enforce_limits on public.challenges;
create trigger challenges_enforce_limits before insert or update on public.challenges
  for each row execute function public.enforce_challenge_limits();

-- =============================================================================
-- 7. Admin analytics (all functions refuse non-admins, so the data cannot be reached directly)
-- =============================================================================
create or replace function public.safe_tz(p text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  probe timestamp;
begin
  if p is null or btrim(p) = '' then
    return 'UTC';
  end if;
  -- Ask Postgres itself whether it can use the zone. This also accepts legacy aliases such as
  -- "Asia/Calcutta", which browsers still report, that pg_timezone_names may not list.
  begin
    probe := now() at time zone p;
    return p;
  exception when others then
    return 'UTC';
  end;
end;
$$;

create or replace function public.admin_overview(p_tz text default 'UTC')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_today date;
  v_day_start timestamptz;
begin
  perform public.assert_admin();
  v_tz := public.safe_tz(p_tz);
  v_today := (now() at time zone v_tz)::date;
  v_day_start := v_today::timestamp at time zone v_tz;

  return jsonb_build_object(
    'timezone', v_tz,
    'generated_at', now(),
    'users', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'confirmed', (select count(*) from auth.users where email_confirmed_at is not null),
      'new_today', (select count(*) from auth.users where created_at >= v_day_start),
      'new_7d', (select count(*) from auth.users where created_at >= now() - interval '7 days'),
      'new_30d', (select count(*) from auth.users where created_at >= now() - interval '30 days'),
      'never_active', (select count(*) from auth.users u where not exists (select 1 from public.activity_events e where e.user_id = u.id))
    ),
    'activity', jsonb_build_object(
      'dau', (select count(distinct user_id) from public.activity_events where created_at >= v_day_start),
      'dau_yesterday', (select count(distinct user_id) from public.activity_events
                          where created_at >= v_day_start - interval '1 day' and created_at < v_day_start),
      'wau', (select count(distinct user_id) from public.activity_events where created_at >= now() - interval '7 days'),
      'mau', (select count(distinct user_id) from public.activity_events where created_at >= now() - interval '30 days')
    ),
    'habits', jsonb_build_object(
      'total', (select count(*) from public.habits),
      'active', (select count(*) from public.habits where archived_at is null),
      'archived', (select count(*) from public.habits where archived_at is not null)
    ),
    'challenges', jsonb_build_object(
      'total', (select count(*) from public.challenges),
      'active', (select count(*) from public.challenges where public.is_challenge_active(status, ends_on)),
      'archived', (select count(*) from public.challenges where status = 'archived'),
      'finished', (select count(*) from public.challenges
                     where status <> 'archived' and not public.is_challenge_active(status, ends_on))
    ),
    'checkins', jsonb_build_object(
      'total', (select count(*) from public.habit_completions) + (select count(*) from public.challenge_completions),
      'today', (select count(*) from public.habit_completions where created_at >= v_day_start)
             + (select count(*) from public.challenge_completions where created_at >= v_day_start),
      'last_7d', (select count(*) from public.habit_completions where created_at >= now() - interval '7 days')
               + (select count(*) from public.challenge_completions where created_at >= now() - interval '7 days'),
      'last_30d', (select count(*) from public.habit_completions where created_at >= now() - interval '30 days')
                + (select count(*) from public.challenge_completions where created_at >= now() - interval '30 days')
    )
  );
end;
$$;

create or replace function public.admin_timeseries(
  p_from date,
  p_to date,
  p_bucket text default 'day',
  p_tz text default 'UTC'
)
returns table (
  bucket_start date,
  signups integer,
  active_users integer,
  checkins integer,
  habits_created integer,
  challenges_created integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_from date;
  v_start timestamptz;
  v_end timestamptz;
begin
  perform public.assert_admin();
  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid_bucket';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 800 then
    raise exception 'invalid_range';
  end if;
  v_tz := public.safe_tz(p_tz);
  v_from := date_trunc(p_bucket, p_from::timestamp)::date;
  v_start := v_from::timestamp at time zone v_tz;
  v_end := (p_to + 1)::timestamp at time zone v_tz;

  return query
  with buckets as (
    select g::date as b
    from generate_series(v_from::timestamp, date_trunc(p_bucket, p_to::timestamp), ('1 ' || p_bucket)::interval) g
  ),
  s as (
    select date_trunc(p_bucket, u.created_at at time zone v_tz)::date as b, count(*) as n
    from auth.users u where u.created_at >= v_start and u.created_at < v_end group by 1
  ),
  a as (
    select date_trunc(p_bucket, e.created_at at time zone v_tz)::date as b, count(distinct e.user_id) as n
    from public.activity_events e where e.created_at >= v_start and e.created_at < v_end group by 1
  ),
  c as (
    select date_trunc(p_bucket, x.created_at at time zone v_tz)::date as b, count(*) as n
    from (
      select created_at from public.habit_completions where created_at >= v_start and created_at < v_end
      union all
      select created_at from public.challenge_completions where created_at >= v_start and created_at < v_end
    ) x group by 1
  ),
  h as (
    select date_trunc(p_bucket, t.created_at at time zone v_tz)::date as b, count(*) as n
    from public.habits t where t.created_at >= v_start and t.created_at < v_end group by 1
  ),
  ch as (
    select date_trunc(p_bucket, t.created_at at time zone v_tz)::date as b, count(*) as n
    from public.challenges t where t.created_at >= v_start and t.created_at < v_end group by 1
  )
  select bk.b,
         coalesce(s.n, 0)::integer,
         coalesce(a.n, 0)::integer,
         coalesce(c.n, 0)::integer,
         coalesce(h.n, 0)::integer,
         coalesce(ch.n, 0)::integer
  from buckets bk
  left join s on s.b = bk.b
  left join a on a.b = bk.b
  left join c on c.b = bk.b
  left join h on h.b = bk.b
  left join ch on ch.b = bk.b
  order by bk.b;
end;
$$;

create or replace function public.admin_users(
  p_search text default null,
  p_sort text default 'created_desc',
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  last_active_at timestamptz,
  status text,
  active_habits integer,
  archived_habits integer,
  challenges integer,
  checkins bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_pattern text;
begin
  perform public.assert_admin();
  if p_sort not in ('created_desc', 'created_asc', 'active_desc', 'email_asc') then
    raise exception 'invalid_sort';
  end if;
  if v_search is not null then
    v_pattern := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return query
  with filtered as (
    select u.id as uid, u.email::text as em, p.display_name as dn, u.created_at as ca,
           u.last_sign_in_at as ls, p.last_active_at as la, u.banned_until as bu, u.email_confirmed_at as ec
    from auth.users u
    left join public.profiles p on p.id = u.id
    where v_search is null or u.email ilike v_pattern or p.display_name ilike v_pattern
  ),
  ranked as (
    select f.*,
           count(*) over () as tc,
           row_number() over (
             order by (case when p_sort = 'created_desc' then f.ca end) desc nulls last,
                      (case when p_sort = 'created_asc' then f.ca end) asc nulls last,
                      (case when p_sort = 'active_desc' then f.la end) desc nulls last,
                      (case when p_sort = 'email_asc' then f.em end) asc nulls last,
                      f.uid
           ) as rn
    from filtered f
  )
  select r.uid, r.em, r.dn, r.ca, r.ls, r.la,
         case
           when r.bu is not null and r.bu > now() then 'suspended'
           when r.ec is null then 'unconfirmed'
           else 'active'
         end,
         (select count(*)::integer from public.habits h where h.user_id = r.uid and h.archived_at is null),
         (select count(*)::integer from public.habits h where h.user_id = r.uid and h.archived_at is not null),
         (select count(*)::integer from public.challenges c where c.user_id = r.uid),
         (select count(*) from public.habit_completions hc where hc.user_id = r.uid)
           + (select count(*) from public.challenge_completions cc where cc.user_id = r.uid),
         r.tc
  from ranked r
  where r.rn > v_offset and r.rn <= v_offset + v_limit
  order by r.rn;
end;
$$;

create or replace function public.admin_recent_activity(p_limit integer default 30)
returns table (
  event text,
  created_at timestamptz,
  user_id uuid,
  display_name text,
  email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select e.event, e.created_at, e.user_id, p.display_name, u.email::text
  from public.activity_events e
  join auth.users u on u.id = e.user_id
  left join public.profiles p on p.id = e.user_id
  order by e.created_at desc, e.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;

revoke all on function public.safe_tz(text) from public, anon, authenticated;
revoke all on function public.admin_overview(text), public.admin_timeseries(date, date, text, text),
  public.admin_users(text, text, integer, integer), public.admin_recent_activity(integer) from public, anon;
grant execute on function public.admin_overview(text), public.admin_timeseries(date, date, text, text),
  public.admin_users(text, text, integer, integer), public.admin_recent_activity(integer) to authenticated;

-- =============================================================================
-- 8. Account deletion (the signed-in user can delete only their own account)
-- =============================================================================
-- Deleting the auth user cascades to the profile, habits, challenges, check-ins, activity
-- events, plan assignment and admin role through foreign keys.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
