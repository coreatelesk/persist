-- Persist migration 005: Free plan allows 20 active habits, plus a feedback / feature-request
-- system that admins can review. Safe to run on a live database and safe to run twice.
-- Run it after 202610120004_admin_entitlements_limits.sql. No user data is changed or removed.

-- =============================================================================
-- 1. Free plan: 20 active habits
-- =============================================================================
-- Only changes the value if it is still the original default (10), so if you have already
-- customised the Free plan yourself your number is left alone.
update public.plans set max_active_habits = 20 where id = 'free' and max_active_habits = 10;

-- The built-in fallback (used only if the 'free' plan row were ever deleted) is raised to match.
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
      v_cap := case when v_plan.id is null then 20 else v_plan.max_active_habits end;
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
revoke all on function public.enforce_habit_limits() from public, anon, authenticated;

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
      'active_habits', case when p.id is null then 20 else p.max_active_habits end,
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
-- 2. Feedback: feature requests, improvement ideas and bug reports
-- =============================================================================
-- Users can send feedback and see their own submissions (with the team's status and reply).
-- They cannot edit or delete them, and cannot set the status or reply. Only admins can.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('feature', 'improvement', 'bug', 'other')),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'done', 'declined')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_status_created_idx on public.feedback (status, created_at desc);
create index if not exists feedback_user_created_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
-- Column-level insert: people can only supply who/what/message. Status and reply stay admin-only.
grant select on public.feedback to authenticated;
grant insert (user_id, category, message) on public.feedback to authenticated;

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Anti-spam: at most 5 submissions per person per 24 hours (race-safe), message trimmed.
create or replace function public.enforce_feedback_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if (select auth.uid()) is not null and new.user_id is distinct from (select auth.uid()) then
    raise exception 'new row violates row-level security policy' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('persist:feedback:' || new.user_id::text, 0));
  select count(*) into v_count from public.feedback
   where user_id = new.user_id and created_at > now() - interval '24 hours';
  if v_count >= 5 then
    raise exception 'rate_limited:feedback:5';
  end if;
  new.message := btrim(new.message);
  return new;
end;
$$;
revoke all on function public.enforce_feedback_limits() from public, anon, authenticated;

drop trigger if exists feedback_enforce_limits on public.feedback;
create trigger feedback_enforce_limits before insert on public.feedback
  for each row execute function public.enforce_feedback_limits();

-- =============================================================================
-- 3. Admin functions for feedback (all refuse non-admins)
-- =============================================================================
create or replace function public.admin_feedback_list(
  p_status text default null,
  p_category text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  category text,
  message text,
  status text,
  admin_note text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  display_name text,
  email text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if p_status is not null and p_status not in ('new', 'reviewing', 'planned', 'done', 'declined') then
    raise exception 'invalid_status';
  end if;
  if p_category is not null and p_category not in ('feature', 'improvement', 'bug', 'other') then
    raise exception 'invalid_category';
  end if;

  return query
  select f.id, f.category, f.message, f.status, f.admin_note, f.created_at, f.updated_at,
         f.user_id, p.display_name, u.email::text, count(*) over ()
  from public.feedback f
  join auth.users u on u.id = f.user_id
  left join public.profiles p on p.id = f.user_id
  where (p_status is null or f.status = p_status)
    and (p_category is null or f.category = p_category)
  order by f.created_at desc, f.id
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_feedback_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'total', (select count(*) from public.feedback),
    'new', (select count(*) from public.feedback where status = 'new'),
    'reviewing', (select count(*) from public.feedback where status = 'reviewing'),
    'planned', (select count(*) from public.feedback where status = 'planned'),
    'done', (select count(*) from public.feedback where status = 'done'),
    'declined', (select count(*) from public.feedback where status = 'declined')
  );
end;
$$;

create or replace function public.admin_feedback_update(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  if p_status not in ('new', 'reviewing', 'planned', 'done', 'declined') then
    raise exception 'invalid_status';
  end if;
  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'note_too_long';
  end if;
  update public.feedback
     set status = p_status,
         admin_note = nullif(btrim(coalesce(p_note, '')), ''),
         updated_at = now()
   where id = p_id;
  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

revoke all on function public.admin_feedback_list(text, text, integer, integer), public.admin_feedback_counts(),
  public.admin_feedback_update(uuid, text, text) from public, anon;
grant execute on function public.admin_feedback_list(text, text, integer, integer), public.admin_feedback_counts(),
  public.admin_feedback_update(uuid, text, text) to authenticated;

-- The overview now also reports feedback totals.
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
    ),
    'feedback', jsonb_build_object(
      'total', (select count(*) from public.feedback),
      'new', (select count(*) from public.feedback where status = 'new'),
      'last_7d', (select count(*) from public.feedback where created_at >= now() - interval '7 days')
    )
  );
end;
$$;
revoke all on function public.admin_overview(text) from public, anon;
grant execute on function public.admin_overview(text) to authenticated;
