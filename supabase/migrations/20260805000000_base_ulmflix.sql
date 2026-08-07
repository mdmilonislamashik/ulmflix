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
