-- Homeroom Schema v6 — allow deleting opportunities
-- The base schema never defined a DELETE policy for opportunities, so nobody
-- could remove them. Add: creators can delete their own, and admins (you) can
-- delete any. Safe to re-run.

do $$ begin
  create policy "Users delete own opportunities" on public.opportunities for delete
    using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can delete any opportunity" on public.opportunities for delete
    using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
exception when duplicate_object then null; end $$;
