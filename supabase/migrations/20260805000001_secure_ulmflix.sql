-- ULMFlix Production Security Migration
-- Secure roles, Admin authorization and RLS

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Prevent normal users from changing their own role.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
      raise exception 'Only the server can change user roles';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;

create trigger protect_profile_role
before update on public.profiles
for each row
execute function public.prevent_role_change();


-- =========================================================
-- PROFILES
-- =========================================================

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_admin()
);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.is_admin()
)
with check (
  auth.uid() = id
  or public.is_admin()
);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
);


-- =========================================================
-- INCOME PLANS
-- =========================================================

drop policy if exists "Users can read their own income plan" on public.income_plans;
drop policy if exists "Users can insert their own income plan" on public.income_plans;
drop policy if exists "Users can update their own income plan" on public.income_plans;

create policy "Users can read their own income plan"
on public.income_plans
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

create policy "Users can insert their own income plan"
on public.income_plans
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Users can update their own income plan"
on public.income_plans
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);


-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

drop policy if exists "users read own subscriptions" on public.subscriptions;

create policy "users read own subscriptions"
on public.subscriptions
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

create policy "admins manage subscriptions"
on public.subscriptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- PAYMENTS
-- =========================================================

drop policy if exists "users read own payments" on public.payments;

create policy "users read own payments"
on public.payments
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

create policy "admins manage payments"
on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- REVIEWS
-- =========================================================

drop policy if exists "public read published reviews" on public.reviews;
drop policy if exists "users create own reviews" on public.reviews;
drop policy if exists "users update own reviews" on public.reviews;

create policy "public read published reviews"
on public.reviews
for select
using (
  status = 'published'
  or auth.uid() = user_id
  or public.is_admin()
);

create policy "users create own reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "users update own reviews"
on public.reviews
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

create policy "users delete own reviews"
on public.reviews
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);


-- =========================================================
-- BLOG POSTS
-- =========================================================

drop policy if exists "public read published posts" on public.blog_posts;

create policy "public read published posts"
on public.blog_posts
for select
using (
  status = 'published'
  or author_id = auth.uid()
  or public.is_admin()
);

create policy "admins manage blog posts"
on public.blog_posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- AD SLOTS
-- =========================================================

drop policy if exists "public read enabled ads" on public.ad_slots;

create policy "public read enabled ads"
on public.ad_slots
for select
using (
  enabled = true
  or public.is_admin()
);

create policy "admins manage ad slots"
on public.ad_slots
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- REVENUE EVENTS
-- =========================================================

drop policy if exists "public read revenue disabled" on public.revenue_events;

create policy "admins read revenue"
on public.revenue_events
for select
to authenticated
using (public.is_admin());

create policy "admins manage revenue"
on public.revenue_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- Ensure RLS remains enabled
-- =========================================================

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.blog_posts enable row level security;
alter table public.ad_slots enable row level security;
alter table public.revenue_events enable row level security;
alter table public.income_plans enable row level security;
