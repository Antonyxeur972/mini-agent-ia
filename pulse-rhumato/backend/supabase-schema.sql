-- Pulse Rhumato production backend schema
-- Project: ngveomdzvlzuawsvouck (eu-west-3)

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  course_id text,
  course_title text,
  attempts integer not null default 0 check (attempts >= 0),
  correct_attempts integer not null default 0 check (correct_attempts >= 0),
  last_answer jsonb,
  last_correct boolean,
  is_hard boolean not null default false,
  excluded boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(user_id, question_id)
);

create table if not exists public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  course_id text,
  stage text check (stage in ('J1','J2','J7','J10')),
  due_date date,
  status text not null default 'scheduled' check (status in ('scheduled','done','skipped','excluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unique_questions integer not null default 0,
  covered_courses integer not null default 0,
  xp integer not null default 0,
  streak integer not null default 0,
  today_new_questions integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

-- Canonical cloud snapshot used by the static web client.
-- Normalized tables above remain available for future analytics.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.question_progress enable row level security;
alter table public.review_schedule enable row level security;
alter table public.user_stats enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "question progress own rows" on public.question_progress;
create policy "question progress own rows" on public.question_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "review schedule own rows" on public.review_schedule;
create policy "review schedule own rows" on public.review_schedule for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "stats own row" on public.user_stats;
create policy "stats own row" on public.user_stats for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "app state own row" on public.app_state;
create policy "app state own row" on public.app_state for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists trg_review_touch on public.review_schedule;
create trigger trg_review_touch before update on public.review_schedule for each row execute function public.touch_updated_at();
drop trigger if exists trg_stats_touch on public.user_stats;
create trigger trg_stats_touch before update on public.user_stats for each row execute function public.touch_updated_at();
drop trigger if exists trg_app_state_touch on public.app_state;
create trigger trg_app_state_touch before update on public.app_state for each row execute function public.touch_updated_at();

-- Explicit grants are required for new Supabase projects where public tables
-- are not automatically exposed to the Data API.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.question_progress, public.review_schedule, public.user_stats, public.app_state to authenticated;
revoke all on public.profiles, public.question_progress, public.review_schedule, public.user_stats, public.app_state from anon;