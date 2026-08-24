-- ARI Circle V5 — advisor hardening
-- Cover the two new foreign keys surfaced by the Supabase performance advisor.

begin;

create index if not exists ari_circle_quests_creator_idx
  on public.ari_circle_quests(creator_user_id, created_at desc);

create index if not exists ari_circle_quest_members_verified_by_idx
  on public.ari_circle_quest_members(verified_by, verified_at desc)
  where verified_by is not null;

commit;
