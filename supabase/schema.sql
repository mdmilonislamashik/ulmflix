-- StreamFlix Pro production data model for Supabase/Postgres
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','editor','admin')),
  country_code text,
  currency_code text default 'USD',
  skills jsonb not null default '[]'::jsonb,
  platforms jsonb not null default '[]'::jsonb,
  target_income numeric(12,2) not null default 0,
  income_goal_period text not null default 'monthly' check (income_goal_period in ('weekly','monthly','yearly')),
  income_preferences jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, provider text not null, provider_customer_id text, provider_subscription_id text unique, plan_id text not null, status text not null default 'inactive', current_period_end timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.payments (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, provider text not null, provider_payment_id text unique, amount numeric(12,2) not null, currency text not null default 'USD', status text not null, type text not null default 'subscription', metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists public.reviews (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, movie_id bigint, movie_title text not null, rating int not null check (rating between 1 and 5), body text not null check (char_length(body) between 20 and 3000), status text not null default 'published' check(status in ('pending','published','rejected')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.blog_posts (id uuid primary key default gen_random_uuid(), author_id uuid references auth.users(id) on delete set null, slug text unique not null, title text not null, excerpt text, body text not null, cover_url text, status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.ad_slots (id uuid primary key default gen_random_uuid(), slot_key text unique not null, label text not null, enabled boolean not null default true, provider text not null default 'adsense', ad_unit_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.revenue_events (id uuid primary key default gen_random_uuid(), source text not null, amount numeric(12,2) not null, currency text not null default 'USD', external_id text unique, note text, occurred_at timestamptz not null default now(), created_at timestamptz not null default now());
alter table public.profiles enable row level security; alter table public.subscriptions enable row level security; alter table public.payments enable row level security; alter table public.reviews enable row level security; alter table public.blog_posts enable row level security; alter table public.ad_slots enable row level security; alter table public.revenue_events enable row level security;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(
    id, display_name, country_code, currency_code, skills, platforms,
    target_income, income_goal_period, income_preferences, onboarding_complete
  )
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    null,
    coalesce(new.raw_user_meta_data->>'currency_code','USD'),
    '[]'::jsonb,
    '[]'::jsonb,
    0,
    'monthly',
    '{}'::jsonb,
    false
  )
  on conflict(id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create policy "public read published reviews" on public.reviews for select using(status='published'); create policy "users create own reviews" on public.reviews for insert with check(auth.uid()=user_id); create policy "users update own reviews" on public.reviews for update using(auth.uid()=user_id);
create policy "public read published posts" on public.blog_posts for select using(status='published');
create policy "users read own subscriptions" on public.subscriptions for select using(auth.uid()=user_id);
create policy "users read own payments" on public.payments for select using(auth.uid()=user_id);
create policy "public read enabled ads" on public.ad_slots for select using(enabled=true);
create policy "public read revenue disabled" on public.revenue_events for select using(false);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Admin writes should be performed server-side using the Supabase service role after verifying profiles.role='admin'.


-- ULMFlix Income Center: secure cloud-synced personal income plans.
create table if not exists public.income_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.income_plans enable row level security;

drop policy if exists "Users can read their own income plan" on public.income_plans;
create policy "Users can read their own income plan" on public.income_plans
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own income plan" on public.income_plans;
create policy "Users can insert their own income plan" on public.income_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own income plan" on public.income_plans;
create policy "Users can update their own income plan" on public.income_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
﻿-- ULMFlix Production Security Migration
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
-- ULMFlix Production OTT upgrade
-- Run after the existing migrations.

create extension if not exists pgcrypto;

-- ============================================================
-- CATALOG
-- ============================================================
create table if not exists public.movies (
  id bigint generated by default as identity primary key,
  title text not null,
  slug text unique,
  description text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  video_url text,
  release_year int,
  duration_minutes int,
  language text,
  country text,
  age_rating text,
  is_premium boolean not null default false,
  status text not null default 'Draft' check (status in ('Draft','Published','Hidden')),
  genres text[] not null default '{}',
  tags text[] not null default '{}',
  view_count bigint not null default 0,
  featured boolean not null default false,
  trending boolean not null default false,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movies_status_idx on public.movies(status);
create index if not exists movies_featured_idx on public.movies(featured) where featured = true;
create index if not exists movies_trending_idx on public.movies(trending) where trending = true;

create table if not exists public.series (
  id bigint generated by default as identity primary key,
  title text not null,
  slug text unique,
  description text,
  poster_url text,
  backdrop_url text,
  release_year int,
  language text,
  country text,
  age_rating text,
  is_premium boolean not null default false,
  status text not null default 'Draft' check (status in ('Draft','Published','Hidden')),
  genres text[] not null default '{}',
  featured boolean not null default false,
  trending boolean not null default false,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id bigint generated by default as identity primary key,
  series_id bigint not null references public.series(id) on delete cascade,
  season_number int not null,
  title text,
  description text,
  unique(series_id, season_number)
);

create table if not exists public.episodes (
  id bigint generated by default as identity primary key,
  series_id bigint not null references public.series(id) on delete cascade,
  season_id bigint not null references public.seasons(id) on delete cascade,
  episode_number int not null,
  title text not null,
  description text,
  thumbnail_url text,
  video_url text,
  duration_minutes int,
  is_premium boolean not null default false,
  status text not null default 'Draft' check (status in ('Draft','Published','Hidden')),
  added_at timestamptz not null default now(),
  unique(season_id, episode_number)
);

-- ============================================================
-- USER LIBRARY / PROGRESS
-- ============================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, movie_id)
);

create table if not exists public.watch_later (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, movie_id)
);

create table if not exists public.watch_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  position_seconds numeric(12,3) not null default 0,
  duration_seconds numeric(12,3),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id, movie_id)
);

create index if not exists watch_progress_recent_idx on public.watch_progress(user_id, updated_at desc);

-- One review per user/movie, with the existing reviews table kept compatible.
alter table public.reviews add column if not exists movie_slug text;
alter table public.reviews add constraint reviews_movie_id_fk
  foreign key (movie_id) references public.movies(id) on delete cascade;

create unique index if not exists reviews_user_movie_unique
  on public.reviews(user_id, movie_id)
  where movie_id is not null;

-- ============================================================
-- SUBSCRIPTIONS / ENTITLEMENTS
-- ============================================================
alter table public.subscriptions add column if not exists plan_name text;
alter table public.subscriptions add column if not exists metadata jsonb not null default '{}';

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  description text,
  price numeric(12,2) not null,
  currency text not null default 'USD',
  interval text not null check(interval in ('month','year')),
  provider_price_ids jsonb not null default '{}',
  features jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans(id,name,description,price,currency,interval,features)
values
  ('premium_monthly','Premium Monthly','Ad-free premium access',9.99,'USD','month','["Premium movies","Ad-free playback","Watch history sync"]'),
  ('premium_yearly','Premium Yearly','Best value annual plan',49.99,'USD','year','["Premium movies","Ad-free playback","Watch history sync"]')
on conflict(id) do nothing;

-- ============================================================
-- ANALYTICS
-- ============================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  movie_id bigint references public.movies(id) on delete set null,
  path text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_movie_idx on public.analytics_events(movie_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.movies enable row level security;
alter table public.series enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_later enable row level security;
alter table public.watch_progress enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.analytics_events enable row level security;

-- Public catalog reads; admin writes are protected by is_admin().
drop policy if exists "public read published movies" on public.movies;
create policy "public read published movies" on public.movies for select
using (status = 'Published' or public.is_admin());
create policy "admins manage movies" on public.movies for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read published series" on public.series;
create policy "public read published series" on public.series for select
using (status = 'Published' or public.is_admin());
create policy "admins manage series" on public.series for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public read published seasons" on public.seasons for select
using (exists(select 1 from public.series s where s.id=series_id and (s.status='Published' or public.is_admin())));
create policy "admins manage seasons" on public.seasons for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "public read published episodes" on public.episodes for select
using (status='Published' or public.is_admin());
create policy "admins manage episodes" on public.episodes for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "users manage own favorites" on public.favorites for all to authenticated
using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users manage own watch later" on public.watch_later for all to authenticated
using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users manage own progress" on public.watch_progress for all to authenticated
using (auth.uid()=user_id) with check (auth.uid()=user_id);

create policy "public read active plans" on public.subscription_plans for select
using (active=true or public.is_admin());
create policy "admins manage plans" on public.subscription_plans for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "users insert own analytics" on public.analytics_events for insert to authenticated
with check (auth.uid()=user_id);
create policy "admins read analytics" on public.analytics_events for select to authenticated
using (public.is_admin());

-- ============================================================
-- STORAGE
-- ============================================================
-- Create the buckets in Supabase Dashboard if they do not exist yet:
-- avatars (public), media (private), posters (public).
-- The policies below assume those buckets exist.

drop policy if exists "avatar owner upload" on storage.objects;
create policy "avatar owner upload" on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "avatar owner update" on storage.objects;
create policy "avatar owner update" on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select
using (bucket_id='avatars');

drop policy if exists "admin media upload" on storage.objects;
create policy "admin media upload" on storage.objects for insert to authenticated
with check (bucket_id='media' and public.is_admin());
drop policy if exists "admin media update" on storage.objects;
create policy "admin media update" on storage.objects for update to authenticated
using (bucket_id='media' and public.is_admin()) with check (bucket_id='media' and public.is_admin());
drop policy if exists "admin media delete" on storage.objects;
create policy "admin media delete" on storage.objects for delete to authenticated
using (bucket_id='media' and public.is_admin());

-- Updated-at helper for new catalog tables.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists movies_updated_at on public.movies;
create trigger movies_updated_at before update on public.movies for each row execute function public.set_updated_at();
drop trigger if exists series_updated_at on public.series;
create trigger series_updated_at before update on public.series for each row execute function public.set_updated_at();
drop trigger if exists plans_updated_at on public.subscription_plans;
create trigger plans_updated_at before update on public.subscription_plans for each row execute function public.set_updated_at();

-- Profile fields used by the account settings UI.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists dob date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists language text default 'en';
alter table public.profiles add column if not exists timezone text default 'Asia/Dhaka';
alter table public.profiles add column if not exists email_notifications boolean not null default true;
alter table public.profiles add column if not exists login_alerts boolean not null default true;
alter table public.profiles add column if not exists security_alerts boolean not null default true;
alter table public.profiles add column if not exists watchlist_privacy boolean not null default true;
alter table public.profiles add column if not exists profile_visibility boolean not null default true;
alter table public.profiles add column if not exists online_status boolean not null default true;
alter table public.profiles add column if not exists show_activity boolean not null default true;
alter table public.profiles add column if not exists recommendations boolean not null default true;
alter table public.profiles add column if not exists adult_filter boolean not null default true;
alter table public.profiles add column if not exists data_saving boolean not null default false;

-- Optional convenience: create the buckets automatically. If your project forbids
-- bucket DDL in migrations, create these three buckets manually in Storage.
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true), ('media','media',true)
on conflict (id) do update set public=excluded.public;

-- Harden premium media: posters remain public, video media is private.
insert into storage.buckets (id,name,public)
values ('posters','posters',true),('media','media',false)
on conflict(id) do update set public=excluded.public;

drop policy if exists "admin poster upload" on storage.objects;
create policy "admin poster upload" on storage.objects for insert to authenticated
with check (bucket_id='posters' and public.is_admin());
drop policy if exists "admin poster update" on storage.objects;
create policy "admin poster update" on storage.objects for update to authenticated
using (bucket_id='posters' and public.is_admin()) with check (bucket_id='posters' and public.is_admin());
drop policy if exists "public poster read" on storage.objects;
create policy "public poster read" on storage.objects for select
using (bucket_id='posters');

-- RLS policies for public catalog reads call is_admin() in an OR expression;
-- the function itself reveals only a boolean and is safe to expose to anon.
grant execute on function public.is_admin() to anon, authenticated;
