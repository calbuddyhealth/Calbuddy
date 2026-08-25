-- ARI Circle V6 — foreign-key index hardening
-- Cover new V6 foreign keys identified by the Supabase performance advisor.
-- These indexes do not change product behavior or authorization semantics.

begin;

create index if not exists ari_circle_crew_members_invited_by_idx
  on public.ari_circle_crew_members(invited_by)
  where invited_by is not null;

create index if not exists ari_circle_mission_contributions_verified_by_idx
  on public.ari_circle_mission_contributions(verified_by)
  where verified_by is not null;

create index if not exists ari_circle_mission_places_created_by_idx
  on public.ari_circle_mission_places(created_by);

commit;
