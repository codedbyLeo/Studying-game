-- StudyQuest cloud database
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  password_hash text not null default '',
  avatar_url text,
  bio text,
  xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_study_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null,
  weekly_goal_hours numeric not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text references public.subjects(id) on delete set null,
  name text not null default 'Study session',
  studied_on date not null,
  minutes integer not null check (minutes >= 0),
  xp_earned integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

create index if not exists study_sessions_user_date_idx on public.study_sessions(user_id, studied_on);
create index if not exists subjects_user_idx on public.subjects(user_id);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles for select using (true);
drop policy if exists "profiles_own_insert" on public.profiles;
create policy "profiles_own_insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "subjects_own_all" on public.subjects;
create policy "subjects_own_all" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions_own_all" on public.study_sessions;
create policy "sessions_own_all" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "achievements_own_all" on public.user_achievements;
create policy "achievements_own_all" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The browser calls this function for the leaderboard. It returns only public
-- profile/score data, so private study-session rows never need public SELECT.
create or replace function public.get_leaderboard(p_period text default 'all')
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  xp bigint,
  minutes bigint
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.avatar_url,
    case
      when p_period = 'all' then p.xp::bigint
      else coalesce(sum(s.xp_earned) filter (
        where s.studied_on >= case
          when p_period = 'week' then date_trunc('week', current_date)::date
          when p_period = 'month' then date_trunc('month', current_date)::date
          else '1970-01-01'::date
        end
      ), 0)::bigint
    end as xp,
    case
      when p_period = 'all' then coalesce(sum(s.minutes), 0)::bigint
      else coalesce(sum(s.minutes) filter (
        where s.studied_on >= case
          when p_period = 'week' then date_trunc('week', current_date)::date
          when p_period = 'month' then date_trunc('month', current_date)::date
          else '1970-01-01'::date
        end
      ), 0)::bigint
    end as minutes
  from public.profiles p
  left join public.study_sessions s on s.user_id = p.id
  group by p.id, p.username, p.avatar_url, p.xp
  order by xp desc, minutes desc, p.username asc
  limit 100;
$$;

grant execute on function public.get_leaderboard(text) to anon, authenticated;

-- =========================================================
-- Live events + playful admin controls
-- Run this section too if you already ran the original setup.
-- Add your email to app_admins once, then use admin.html.
-- =========================================================
create table if not exists public.app_admins (
  email text primary key
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  multiplier numeric(6,2) not null default 2 check (multiplier >= 1 and multiplier <= 10),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.xp_effects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.game_events enable row level security;
alter table public.xp_effects enable row level security;

drop policy if exists "events_public_read" on public.game_events;
create policy "events_public_read" on public.game_events for select using (true);

drop policy if exists "xp_effects_own_read" on public.xp_effects;
create policy "xp_effects_own_read" on public.xp_effects for select using (auth.uid() = user_id);

create or replace function public.get_active_event()
returns table (id uuid, name text, multiplier numeric, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, multiplier, starts_at, ends_at
  from public.game_events
  where now() >= starts_at and now() < ends_at
  order by multiplier desc, starts_at desc
  limit 1;
$$;
grant execute on function public.get_active_event() to anon, authenticated;

create or replace function public.admin_create_event(
  p_name text, p_multiplier numeric, p_starts_at timestamptz, p_ends_at timestamptz
)
returns setof public.game_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.app_admins where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'Admin access required';
  end if;
  return query insert into public.game_events(name,multiplier,starts_at,ends_at)
  values (trim(p_name), p_multiplier, p_starts_at, p_ends_at)
  returning *;
end;
$$;
grant execute on function public.admin_create_event(text,numeric,timestamptz,timestamptz) to authenticated;

create or replace function public.admin_delete_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.app_admins where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'Admin access required';
  end if;
  delete from public.game_events where id=p_event_id;
end;
$$;
grant execute on function public.admin_delete_event(uuid) to authenticated;

create or replace function public.admin_adjust_xp(p_user_id uuid, p_amount integer, p_reason text)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare v_amount integer := greatest(-1000000, least(1000000, p_amount));
begin
  if not exists (select 1 from public.app_admins where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) then
    raise exception 'Admin access required';
  end if;
  update public.profiles set xp=greatest(0,xp+v_amount), updated_at=now() where id=p_user_id;
  insert into public.xp_effects(user_id,amount,reason) values (p_user_id,v_amount,coalesce(nullif(trim(p_reason),''),'Admin game effect'));
  return query select * from public.profiles where id=p_user_id;
end;
$$;
grant execute on function public.admin_adjust_xp(uuid,integer,text) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where lower(email)=lower(coalesce(auth.jwt()->>'email','')));
$$;
grant execute on function public.is_admin() to authenticated;

-- Make monthly/all-time leaderboard include admin game effects without inventing study sessions.
create or replace function public.get_leaderboard(p_period text default 'all')
returns table (user_id uuid, username text, avatar_url text, xp bigint, minutes bigint)
language sql security definer set search_path = public
as $$
  select p.id, p.username, p.avatar_url,
    case when p_period='all' then greatest(0,p.xp)::bigint
      else greatest(0, coalesce((select sum(s.xp_earned) from public.study_sessions s where s.user_id=p.id and s.studied_on >= case when p_period='week' then date_trunc('week',current_date)::date when p_period='month' then date_trunc('month',current_date)::date else '1970-01-01'::date end),0) + coalesce((select sum(e.amount) from public.xp_effects e where e.user_id=p.id and e.created_at >= case when p_period='week' then date_trunc('week',now()) when p_period='month' then date_trunc('month',now()) else '1970-01-01'::timestamptz end),0))::bigint end as xp,
    coalesce((select sum(s.minutes) from public.study_sessions s where s.user_id=p.id and (p_period='all' or s.studied_on >= case when p_period='week' then date_trunc('week',current_date)::date when p_period='month' then date_trunc('month',current_date)::date else '1970-01-01'::date end)),0)::bigint as minutes
  from public.profiles p
  order by xp desc, minutes desc, p.username asc limit 100;
$$;
grant execute on function public.get_leaderboard(text) to anon, authenticated;

-- Server-side XP for sessions follows the active event multiplier.
create or replace function public.apply_event_xp()
returns trigger language plpgsql security definer set search_path=public
as $$
declare m numeric := 1;
begin
  select multiplier into m from public.game_events where now() >= starts_at and now() < ends_at order by multiplier desc, starts_at desc limit 1;
  new.xp_earned := round(greatest(0,new.minutes) * m);
  return new;
end;
$$;
drop trigger if exists study_sessions_event_xp on public.study_sessions;
create trigger study_sessions_event_xp before insert or update of minutes on public.study_sessions
for each row execute function public.apply_event_xp();
