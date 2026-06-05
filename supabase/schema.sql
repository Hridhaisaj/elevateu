-- ElevateU Database Schema
-- Safe to re-run: uses IF NOT EXISTS throughout

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Types ─────────────────────────────────────────────────────────────────────
do $$ begin
  create type experience_type as enum ('club','volunteer','internship','job','research','sport','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type opportunity_type as enum ('internship','volunteer','scholarship','competition','program','job','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pay_type as enum ('paid','unpaid','stipend');
exception when duplicate_object then null; end $$;

do $$ begin
  create type connection_status as enum ('pending','accepted','declined');
exception when duplicate_object then null; end $$;

-- ─── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  bio text,
  grade_level text,
  graduation_year integer,
  school_name text,
  school_location text,
  city text,
  state text,
  zip_code text,
  avatar_url text,
  cover_photo_url text,
  gpa numeric(3,2),
  headline text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
do $$ begin
  create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ─── Experiences ───────────────────────────────────────────────────────────────
create table if not exists public.experiences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  organization text not null,
  description text,
  start_date date not null,
  end_date date,
  type experience_type not null default 'other',
  created_at timestamptz default now() not null
);

alter table public.experiences enable row level security;
do $$ begin
  create policy "Experiences viewable by everyone" on public.experiences for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users manage own experiences" on public.experiences for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Achievements ──────────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  date_received date,
  category text,
  created_at timestamptz default now() not null
);

alter table public.achievements enable row level security;
do $$ begin
  create policy "Achievements viewable by everyone" on public.achievements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users manage own achievements" on public.achievements for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Skills ────────────────────────────────────────────────────────────────────
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  created_at timestamptz default now() not null
);

alter table public.skills enable row level security;
do $$ begin
  create policy "Skills viewable by everyone" on public.skills for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users manage own skills" on public.skills for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Opportunities ─────────────────────────────────────────────────────────────
create table if not exists public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  organization text not null,
  description text not null,
  type opportunity_type not null,
  location text,
  city text,
  state text,
  zip_code text,
  is_remote boolean default false not null,
  deadline date,
  application_url text,
  pay_type pay_type,
  grade_levels text[] default '{}',
  tags text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.opportunities enable row level security;
do $$ begin
  create policy "Opportunities viewable by everyone" on public.opportunities for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can post opportunities" on public.opportunities for insert with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own opportunities" on public.opportunities for update using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

-- ─── Connections ───────────────────────────────────────────────────────────────
create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status connection_status default 'pending' not null,
  created_at timestamptz default now() not null,
  unique(requester_id, recipient_id)
);

alter table public.connections enable row level security;
do $$ begin
  create policy "Users see their connections" on public.connections for select using (auth.uid() = requester_id or auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users create connections" on public.connections for insert with check (auth.uid() = requester_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Recipient can update status" on public.connections for update using (auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;

-- ─── Posts ─────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.posts enable row level security;
do $$ begin
  create policy "Posts viewable by everyone" on public.posts for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can post" on public.posts for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users manage own posts" on public.posts for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users delete own posts" on public.posts for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Post Likes ────────────────────────────────────────────────────────────────
create table if not exists public.post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

alter table public.post_likes enable row level security;
do $$ begin
  create policy "Post likes viewable by everyone" on public.post_likes for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can like" on public.post_likes for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can unlike" on public.post_likes for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Post Comments ─────────────────────────────────────────────────────────────
create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.post_comments enable row level security;
do $$ begin
  create policy "Comments viewable by everyone" on public.post_comments for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can comment" on public.post_comments for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users delete own comments" on public.post_comments for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Saved Opportunities ───────────────────────────────────────────────────────
create table if not exists public.saved_opportunities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique(user_id, opportunity_id)
);

alter table public.saved_opportunities enable row level security;
do $$ begin
  create policy "Users see own saved" on public.saved_opportunities for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users save opportunities" on public.saved_opportunities for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users unsave opportunities" on public.saved_opportunities for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;
do $$ begin
  create policy "Users see their messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Recipients can mark read" on public.messages for update using (auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;

-- ─── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
