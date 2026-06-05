-- ElevateU Schema v2 — companies, education, richer experiences
-- Safe to re-run.

-- ─── Companies ─────────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  logo_url text,
  industry text,
  location text,
  website text,
  description text,
  created_at timestamptz default now() not null
);

alter table public.companies enable row level security;
do $$ begin
  create policy "Companies viewable by everyone" on public.companies for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can create companies" on public.companies for insert with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Creators can update companies" on public.companies for update using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

-- Case-insensitive unique name so we don't get duplicate companies
create unique index if not exists companies_name_lower_idx on public.companies (lower(name));

-- ─── Experiences: link to company + employment type ────────────────────────────
alter table public.experiences add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.experiences add column if not exists location text;
alter table public.experiences add column if not exists is_current boolean default false not null;

-- ─── Education ─────────────────────────────────────────────────────────────────
create table if not exists public.education (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_name text not null,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  grade text,
  activities text,
  description text,
  created_at timestamptz default now() not null
);

alter table public.education enable row level security;
do $$ begin
  create policy "Education viewable by everyone" on public.education for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users manage own education" on public.education for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ─── Achievements: add issuer for award-style display ──────────────────────────
alter table public.achievements add column if not exists issuer text;
