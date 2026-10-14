# Persist

**Show up. Leave proof.** A calm habit and challenge tracker built with Next.js (App Router), React, TypeScript, Tailwind CSS v4, Supabase (Auth + Postgres + Row Level Security) and Zod.

## Contents
1. [Quick start](#quick-start) · 2. [Database setup and migrations](#database-setup-and-migrations) · 3. [Admin dashboard](#admin-dashboard) · 4. [Limits and plans](#limits-and-plans-entitlements) · 5. [Ads](#ads) · 6. [Policies, support and account deletion](#policies-support-and-account-deletion) · 7. [Configuration reference](#configuration-reference) · 8. [Deploying](#deploying) · 9. [Testing](#testing) · 10. [Limitations](#known-limitations)

## Quick start
Requires Node.js 20.9+ and pnpm.
```bash
cp .env.example .env.local     # fill in the two Supabase values
pnpm install
pnpm dev                       # http://localhost:3000
```
Scripts: `pnpm dev | build | start | lint | typecheck | test`.

> `pnpm install` may print "Ignored build scripts: unrs-resolver" and exit non-zero. This is pnpm's safety notice about an optional native helper used only by the linter; dependencies are installed and everything works. Run `pnpm approve-builds` if you want the notice gone.

## Database setup and migrations
Run these in the Supabase SQL Editor (or `supabase db push`), **in order**. Skip any you have already run. Every migration is safe to run twice.

| # | File | What it does |
|---|------|--------------|
| 1 | `202610100001_initial_schema.sql` | Tables (profiles, habits, habit_completions, challenges, challenge_completions), Row Level Security, signup trigger. |
| 2 | `202610100002_production_hardening.sql` | API grants, constraints, one check-in per day, date-range rules. |
| 3 | `202610110003_usage_limits.sql` | The old **monthly** creation quotas. Replaced by migration 4. |
| 4 | `202610120004_admin_entitlements_limits.sql` | Removes the monthly quotas; adds plans/entitlements, active and archived limits (concurrency-safe), activity tracking, admin role and analytics functions, profile fields (optional mobile number), account deletion. |

**Migration 4 on a live database.** It preserves all habits, challenges, check-ins and profiles. It deletes only the two bookkeeping tables of the old monthly quota (`usage_counters`, `app_limits`), which held counters and settings, no user content. It also trims any display name longer than 60 characters, and back-fills the new activity log once from existing history so admin charts are not empty on day one. **Take a backup first** (Supabase dashboard -> Database -> Backups), since this change is not meant to be undone.

## Admin dashboard
`/admin` (overview) and `/admin/users`, separate from the user dashboard, with no ads.

**What it shows (all live database values):** registered users; new registrations today / 7 / 30 days and per day, week or month; DAU, WAU, MAU; active trends; total, active and archived habits and challenges (plus finished challenges); total check-ins and recent counts; recent platform activity; per-user last-active time, status (active / unconfirmed / suspended), join date and item counts. Filters: 7 days, 30 days, 90 days, 12 months, grouped by day, week or month. Day boundaries follow the admin's browser time zone.

**"Active user"** means meaningful activity only: creating, editing, archiving or restoring a habit, managing a challenge (create, complete, end, archive, restore), or completing a check-in. Having an account or opening a page does not count. Each such action stores one row in `activity_events` (user id, event type, item id, time; never names, notes or phone numbers).

**Privacy:** the admin pages never show habit or challenge names, notes, or mobile numbers.

### Make yourself the admin (secure setup)
Nobody is an admin by default, and the app has no way to grant the role. Sign up normally, then run `supabase/scripts/grant-admin.sql` in the Supabase SQL Editor after replacing the email:
```sql
insert into public.admins (user_id, note)
select id, 'owner' from auth.users where email = 'you@yourdomain.com'
on conflict (user_id) do nothing;
```
An "Admin" link then appears in your sidebar (it is only a shortcut). Remove access with `delete from public.admins where ...`.

**How it is protected (defence in depth):**
1. `public.admins` has Row Level Security on and **no** policies and no grants: nobody can read or change it through the API.
2. Every analytics function (`admin_overview`, `admin_timeseries`, `admin_users`, `admin_recent_activity`) starts with `assert_admin()` and raises `forbidden` for everyone else. Calling them directly with any user's token is refused.
3. Every admin page calls `requireAdmin()` on the server and returns a plain 404 to non-admins; signed-out visitors are redirected to sign in.
4. No service-role key exists anywhere in the app or browser.

## Limits and plans (entitlements)
**Free plan limits (live now):**
- 10 active habits · 10 active challenges
- 20 archived habits · 20 archived challenges

There are no monthly creation quotas any more.

| Action | Rule |
|---|---|
| Create | Blocked if the category's *active* limit is reached. |
| Archive | Moves an item from active to archived; blocked if the *archived* limit is full. |
| Restore | Moves it back to active; blocked if the *active* limit is full. |
| Anything that doesn't add to a full category | Always allowed: editing, check-ins, ending, deleting. |

A challenge counts as **active** while its status is active and it has not run out; finished (completed/ended) challenges are neither active nor archived.

**Existing data is never touched.** If someone already exceeds a limit, every record is kept and they can continue using and tidying it; only additions that would increase an over-limit category are refused. Nothing is ever deleted or overwritten to make room.

**Where it is enforced:** in the database (`enforce_habit_limits` and `enforce_challenge_limits` triggers, migration 4), so the API cannot bypass it. A per-user advisory lock makes simultaneous requests safe (tested with 25 parallel creates, which produced exactly 10). The app shows the same numbers and explains next steps (the allowance meter, disabled buttons with reasons, plain error messages); it reads them from the same database function (`my_limits()`), so UI and enforcement cannot disagree.

**Entitlement layer (for future plans).** Plans are rows in `public.plans` (limits + a `features` JSON of flags such as `ad_free` and `reminders`); `public.user_plans` assigns a user to a plan, and everyone without a row is on `free`. A `NULL` limit means unlimited. In code, `lib/entitlements.ts` exposes `getEntitlements`, `hasRoom` and `hasFeature`. Adding a plan needs only SQL, for example:
```sql
insert into plans (id, name, max_active_habits, max_active_challenges, max_archived_habits, max_archived_challenges, features)
values ('plus', 'Persist Plus', 30, 30, 100, 100, '{"ad_free": true, "reminders": true}');
-- assign (e.g. from a future billing webhook using a trusted server connection):
insert into user_plans (user_id, plan_id) values ('<user uuid>', 'plus')
on conflict (user_id) do update set plan_id = excluded.plan_id;
```
Nothing about payments, subscriptions, checkout, or billing frequency is implemented, and there are no upgrade buttons. Only `ad_free` is wired to behaviour today (it hides the banner). `reminders` is a stored flag only; no reminder feature exists yet.

## Ads
One banner on the signed-in **user dashboard only**, never in the admin dashboard or other pages. Provider code lives in `components/ads/providers.ts`; config in `lib/ads/config.ts`.

**Behaviour:** off unless `NEXT_PUBLIC_ADS_ENABLED=true` **and** a valid publisher ID and slot ID are set; loads asynchronously after the browser is idle; takes no space until an ad actually fills (no layout shift); removes itself if the provider is blocked, offline, or has nothing to show; never breaks the app; hidden for plans with the `ad_free` feature. To disable: set `NEXT_PUBLIC_ADS_ENABLED=false` and redeploy. To replace the provider: add a case in `providers.ts` and `config.ts`.

**Provider policy (Google AdSense).** Google's AdSense Help states that ads on login-protected pages are allowed, but only after you set up crawler access so Google can review those pages (Google's article: "Display ads on login-protected pages", `support.google.com/adsense/answer/161351`). I have not enabled anything for you. To go live:
1. Get your AdSense account approved and verify your site.
2. Create a dedicated, ordinary test account in your app for Google's crawler and give its credentials to AdSense in the login-protected-pages setup. Confirm AdSense shows the setup as complete.
3. Create a responsive display ad unit; copy the publisher ID (`ca-pub-...`) and slot ID.
4. Set `NEXT_PUBLIC_ADS_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT`, then **rebuild and redeploy**.
5. Add `public/ads.txt` using the line AdSense gives you.
6. If you serve users in the EEA, UK or Switzerland, Google's current consent requirements apply; this app has **no consent banner**, so add a consent platform before enabling ads for those regions. Check Google's current rules.

The Advertising and Cookies page automatically says "Ads are not currently shown" until ads are enabled, then describes AdSense.

## Policies, support and account deletion
Public pages: `/privacy`, `/terms`, `/cookies` (advertising and cookie disclosure), `/support`. They are linked in the app footer, the landing and sign-in pages, and the Account page. Their text was written to match what the app actually does (data collected, cookies, providers, admin visibility) and adapts to your config (support email, whether ads are enabled). **They are templates, not legal advice**: have them reviewed for your jurisdiction and operator details. They make no compliance-certification claims and invent no company name, address, or email. Update `POLICY_UPDATED` in `lib/site.ts` when you edit them.

**Account management:** `/account` lets users edit their name and an optional mobile number (validated, stored privately, not shown to admins, not used to send messages), and shows their plan and usage.

**Account deletion:** `/account/delete` (sign-in required). The user must type their account email. The server calls `delete_my_account()`, a database function that deletes **only `auth.uid()`**, with no parameter to name anyone else, and the delete cascades to profile, habits, challenges, check-ins, activity events, plan assignment and admin role. The user is then signed out and sent to a confirmation. Provider backups may retain copies until they expire. There is no data-export feature; the page tells users to contact support for a copy.

## Configuration reference
All variables are in `.env.example`. **Every `NEXT_PUBLIC_*` value is baked in at build time: change it, then redeploy.** No variable here is a secret.

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (required) | `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key (required) | `sb_publishable_...` |
| `NEXT_PUBLIC_APP_NAME` / `_APP_TAGLINE` | Product name and tagline | `Persist` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (metadata base) | `https://app.example.com` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support address shown on Support and the policies | *(yours)* |
| `NEXT_PUBLIC_OPERATOR_NAME` / `_OPERATOR_ADDRESS` | Optional operator details for policies | *(yours)* |
| `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | Show Google sign-in | `false` |
| `NEXT_PUBLIC_ADS_ENABLED` | Master ad switch | `false` |
| `NEXT_PUBLIC_ADS_PROVIDER` | Ad provider | `adsense` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `_ADSENSE_SLOT` | AdSense publisher and slot IDs | *(yours)* |

Admin access is configured in the database (see above), not by an environment variable. Plan limits are configured in the `plans` table.

## Deploying
1. **Back up** the production database.
2. Run any migrations you have not yet applied, **in order** (see the table). For an existing live app that is `202610120004_admin_entitlements_limits.sql`. Confirm: `select id, max_active_habits from public.plans;` returns the `free` row.
3. Make yourself admin with `supabase/scripts/grant-admin.sql`.
4. In your host's environment settings, set the variables above. Leave ads disabled for now.
5. **Build and deploy** (any change to `NEXT_PUBLIC_*` requires a new build).
6. In Supabase -> Authentication -> URL Configuration, set the Site URL and add `<your-url>/auth/callback` to the redirect allow-list.
7. Smoke test: sign in; create, archive and restore a habit; open `/account`; open `/admin` with the admin account and confirm it 404s for a regular account; open `/privacy`, `/support`.
8. **Test account deletion on a throwaway account in staging first.** It deletes the user from Supabase's `auth.users` from inside a database function, which is standard but depends on your project's setup.

## Testing
`pnpm lint`, `pnpm typecheck`, `pnpm test` (32 unit tests: dates and time zones, streaks, challenges, validation, limit messages, ad configuration), `pnpm build`.

## Known limitations
- Reminders and payments/plans-upgrade flows are intentionally not built; `reminders` is only a stored flag.
- Ads are off until you complete the AdSense steps; no consent banner is included.
- Check-ins are for today only, by design.
- Auth rate limiting / CAPTCHA are Supabase settings, not part of this repo.
- Activity events grow with use; if needed, prune old rows (`delete from activity_events where created_at < now() - interval '2 years'`), which only reduces the age of historical charts.
