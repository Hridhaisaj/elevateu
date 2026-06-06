-- Homeroom Schema v5 — reliable profile creation
-- Fixes "some users can't create an account / can't post".
--
-- Root cause: profiles were inserted from the browser right after signUp().
-- When email confirmation is on there is no session yet, so RLS blocks the
-- insert; and the random-suffix username could collide. Either way the user
-- ended up with NO profile row, which breaks posting (posts.user_id -> profiles)
-- and onboarding (which only UPDATEs an existing row).
--
-- This moves profile creation into a SECURITY DEFINER trigger on auth.users so
-- it always runs with elevated privileges the moment an auth user is created,
-- independent of the client session. Safe to re-run.

-- ─── Username generator: derive a unique handle, de-duping with a counter ──────
create or replace function public.generate_username(seed text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(seed, ''), '[^a-zA-Z0-9]', '', 'g'));
  if base = '' then base := 'user'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  return candidate;
end;
$$;

-- ─── Auto-create a profile whenever an auth user is created ────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'New User'
  );

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    public.generate_username(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))),
    display_name
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Backfill: create profiles for existing users who never got one ────────────
do $$
declare
  r record;
begin
  for r in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
  loop
    insert into public.profiles (id, username, full_name)
    values (
      r.id,
      public.generate_username(coalesce(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1))),
      coalesce(
        nullif(trim(r.raw_user_meta_data->>'full_name'), ''),
        nullif(split_part(r.email, '@', 1), ''),
        'New User'
      )
    )
    on conflict (id) do nothing;
  end loop;
end $$;
