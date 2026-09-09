-- Pulse Rhumato backend schema (Supabase/Postgres)
create extension if not exists pgcrypto;

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
  attempts int not null default 0,
  correct_attempts int not null default 0,
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
  unique_questions int not null default 0,
  covered_courses int not null default 0,
  xp int not null default 0,
  streak int not null default 0,
  today_new_questions int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.question_progress enable row level security;
alter table public.review_schedule enable row level security;
alter table public.user_stats enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "question progress own rows" on public.question_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "review schedule own rows" on public.review_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stats own row" on public.user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists trg_review_touch on public.review_schedule;
create trigger trg_review_touch before update on public.review_schedule for each row execute function public.touch_updated_at();
drop trigger if exists trg_stats_touch on public.user_stats;
create trigger trg_stats_touch before update on public.user_stats for each row execute function public.touch_updated_at();
