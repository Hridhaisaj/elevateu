-- ElevateU / Homeroom Schema v4 — admin moderation
-- Safe to re-run.

-- ─── Admin flag on profiles ────────────────────────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean default false not null;

-- Grant admin to the owner (matched by their auth email)
update public.profiles
set is_admin = true
where id in (
  select id from auth.users where lower(email) = 'hridhaisajinesh@gmail.com'
);

-- ─── Let admins delete ANY post ────────────────────────────────────────────────
-- (additive: the existing "Users delete own posts" policy still applies, and
--  Postgres OR's permissive policies together)
do $$ begin
  create policy "Admins can delete any post" on public.posts for delete
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
exception when duplicate_object then null; end $$;

-- Optional: let admins delete any comment too
do $$ begin
  create policy "Admins can delete any comment" on public.post_comments for delete
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
exception when duplicate_object then null; end $$;
