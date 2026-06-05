-- ElevateU Schema v3 — logo image storage + schools as shared entities
-- Safe to re-run.

-- ─── Storage bucket for logos / images ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Logos are publicly readable" on storage.objects
    for select using (bucket_id = 'logos');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated users can upload logos" on storage.objects
    for insert to authenticated with check (bucket_id = 'logos');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Authenticated users can update logos" on storage.objects
    for update to authenticated using (bucket_id = 'logos');
exception when duplicate_object then null; end $$;

-- ─── Schools (shared entity, mirrors companies) ────────────────────────────────
create table if not exists public.schools (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  logo_url text,
  location text,
  website text,
  description text,
  created_at timestamptz default now() not null
);

alter table public.schools enable row level security;
do $$ begin
  create policy "Schools viewable by everyone" on public.schools for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth users can create schools" on public.schools for insert with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;
-- Logos are collaborative: any signed-in user can set/replace a school logo
do $$ begin
  create policy "Auth users can update schools" on public.schools for update to authenticated using (true);
exception when duplicate_object then null; end $$;

create unique index if not exists schools_name_lower_idx on public.schools (lower(name));

-- ─── Link education rows to a school for shared logos ──────────────────────────
alter table public.education add column if not exists school_id uuid references public.schools(id) on delete set null;

-- ─── Make company logos collaborative too ──────────────────────────────────────
-- (v2 only let the creator update a company; relax so anyone signed in can add a logo)
drop policy if exists "Creators can update companies" on public.companies;
do $$ begin
  create policy "Auth users can update companies" on public.companies for update to authenticated using (true);
exception when duplicate_object then null; end $$;
