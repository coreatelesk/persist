-- Make ONE existing account an administrator. Run this in the Supabase SQL Editor
-- (it runs as the database owner). The app cannot grant or remove admin rights itself.
--
-- 1. The person must have signed up first.
-- 2. Replace the email below, then run the statement.
insert into public.admins (user_id, note)
select id, 'owner'
from auth.users
where email = 'REPLACE_WITH_YOUR_EMAIL@example.com'
on conflict (user_id) do nothing;

-- Check who is an admin:
--   select u.email, a.created_at from public.admins a join auth.users u on u.id = a.user_id;
--
-- Remove admin rights:
--   delete from public.admins where user_id = (select id from auth.users where email = 'someone@example.com');
