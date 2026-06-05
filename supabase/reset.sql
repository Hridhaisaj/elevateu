-- Drop everything in reverse dependency order
drop table if exists public.messages cascade;
drop table if exists public.saved_opportunities cascade;
drop table if exists public.post_comments cascade;
drop table if exists public.post_likes cascade;
drop table if exists public.posts cascade;
drop table if exists public.connections cascade;
drop table if exists public.opportunities cascade;
drop table if exists public.skills cascade;
drop table if exists public.achievements cascade;
drop table if exists public.experiences cascade;
drop table if exists public.profiles cascade;

drop type if exists connection_status cascade;
drop type if exists pay_type cascade;
drop type if exists opportunity_type cascade;
drop type if exists experience_type cascade;
