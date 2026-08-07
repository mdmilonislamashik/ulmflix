-- Run this only after you have created the intended admin account.
-- Replace the UUID with the auth.users.id for your account.
update public.profiles
set role='admin', updated_at=now()
where id='REPLACE_WITH_AUTH_USER_UUID';
