-- ARI Circle — retire experimental XP and meetup completion
-- These concepts were exploratory and are not part of the Circle product.
-- Historical columns/tables remain only for migration compatibility; no new
-- awards are issued and the client completion RPC is no longer executable.

begin;

alter table if exists public.ari_circle_meetups
  alter column participant_xp set default 0,
  alter column host_bonus_xp set default 0;

update public.ari_circle_meetups
set participant_xp = 0,
    host_bonus_xp = 0
where participant_xp <> 0 or host_bonus_xp <> 0;

alter table if exists public.ari_circle_quests
  alter column xp_reward set default 0;

update public.ari_circle_quests
set xp_reward = 0
where xp_reward <> 0;

create or replace function public.ari_circle_award_xp_capped(
  target_user_id uuid,
  requested_amount integer,
  requested_source_type text,
  requested_source_id uuid,
  requested_reason text,
  requested_verification_level text default 'verified'
)
returns integer
language sql
security definer
set search_path = 'public', 'pg_temp'
as $$
  select 0::integer;
$$;

revoke all on function public.ari_circle_award_xp_capped(uuid,integer,text,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_award_xp_capped(uuid,integer,text,uuid,text,text)
  to service_role;

create or replace function public.ari_circle_can_create_xp_quest(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select false;
$$;

revoke all on function public.ari_circle_can_create_xp_quest(uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_can_create_xp_quest(uuid)
  to service_role;

revoke all on function public.ari_circle_complete_meetup(uuid)
  from public, anon, authenticated;

revoke all on function public.ari_circle_xp_summary(uuid)
  from public, anon, authenticated;

revoke all on function public.ari_circle_profile_xp_activity(uuid,integer)
  from public, anon, authenticated;

revoke all on function public.ari_circle_my_host_summary()
  from public, anon, authenticated;

commit;
