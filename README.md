# Persist

**Show up. Leave proof.** A minimal habit and challenge tracker built with Next.js App Router, Supabase Auth/Postgres, and Tailwind CSS v4.

This ZIP is a clean, security-conscious starter—not a claim that a deployed production service or cloud project has already been configured. It includes a working sample dashboard, email/password + Google OAuth UI, protected-by-RLS data model, habit creation/check-ins, and an initial challenges schema. Challenge CRUD, email/password recovery UX, and end-date automation are deliberately listed as follow-up work instead of being represented as complete.

## Requirements

- Node.js 20.9+ (use the current supported LTS)
- A Supabase project
- npm

## Run locally

```bash
cp .env.example .env.local
# Fill in the Supabase project URL and publishable key.
npm install
npm run dev
```

Open `http://localhost:3000`.

The dashboard can show sample data without Supabase configured. Authentication, database writes, and real user data require the Supabase setup below.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and **publishable key** into `.env.local`.
3. Run `supabase/migrations/202610100001_initial_schema.sql` in the Supabase SQL Editor, or apply it with the Supabase CLI.
4. In Supabase **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000`. Add the production URL when deployed. Allow the callback URL `http://localhost:3000/auth/callback` and your production equivalent.
5. In **Authentication → Providers → Google**, enable Google and configure the OAuth client in Google Cloud. Add the redirect URI shown by Supabase to the Google OAuth client. Keep the Google client secret in Supabase only.
6. For production, configure your exact production origin in `NEXT_PUBLIC_SITE_URL` and in Supabase redirect allowlists. Avoid broad wildcard redirects.
7. In Supabase Auth settings, choose email-confirmation and password policies appropriate for your audience.

## Environment variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only the public/publishable key belongs in the browser. **Never add a Supabase service-role key to `NEXT_PUBLIC_*`, client code, or this repository.** Server-side authorization still depends on verified user identity and RLS.

## Included routes

- `/dashboard` — sample dashboard for guests; live habits and check-ins for signed-in users.
- `/login` — Google OAuth and email/password sign-in/sign-up.
- `/habits` and `/habits/new` — list and create habits.
- `/challenges` — challenge milestone screen; database schema is included, UI CRUD is not yet implemented.
- `/history` — recent check-ins and date-linked history.
- `/auth/callback` — exchanges the OAuth/email confirmation code for a session.

## Security and production checklist

- [x] Supabase SSR cookie sessions and auth refresh proxy.
- [x] `auth.getUser()` used for server-side identity checks rather than trusting `getSession()` data.
- [x] Row Level Security enabled on all user-owned tables with owner policies.
- [x] Server action validates inputs with Zod; user identity is taken from the verified session, not form data.
- [x] Same-origin relative redirect validation on auth return paths.
- [x] Security headers and no `X-Powered-By`.
- [x] Unique constraint prevents duplicate habit completion for the same habit/date.
- [ ] Configure real Supabase project, OAuth credentials, production domain, and secrets.
- [ ] Add automated tests, dependency scanning, CI, monitoring, backups, and deployment smoke tests.
- [ ] Implement password reset / email change flows and rate-limit/auth abuse controls in provider settings.
- [ ] Add challenge create/edit/check-in UI and a scheduled job to transition expired challenges to `completed` or `ended` based on explicit user progress. Never mark every expired challenge completed automatically.
- [ ] Implement full timezone-aware date handling using each profile's IANA timezone. Current UI uses the server/runtime local date; do not treat this as final for users across time zones.
- [ ] Add weekly-target streak/progress calculations and custom-day schedule editor.
- [ ] Add profile update policies/validation and audit operational settings before production launch.

## Data model

- `profiles` — timezone and profile metadata.
- `habits` / `habit_completions` — ongoing routines and date-based check-ins.
- `challenges` / `challenge_completions` — time-bounded commitments and retained history.

All user-owned records include `user_id`; RLS policies enforce ownership. Deleting a habit cascades its completions, so the intended long-term product behavior should archive habits rather than delete them if you need immutable history. The starter currently has no delete UI.

## Useful commands

```bash
npm run typecheck
npm run lint
npm run build
```

These commands should be run after installing dependencies and before merging or deploying. Exact package versions should be pinned via the generated `package-lock.json` once you install.
