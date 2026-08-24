-- ARI Circle V5 — hard database guards for XP-bearing Quests.

begin;

alter table public.ari_circle_quests
  add constraint ari_circle_quests_xp_not_personal
  check (xp_reward = 0 or scope <> 'personal');

alter table public.ari_circle_quests
  add constraint ari_circle_quests_xp_requires_external_verification
  check (xp_reward = 0 or verification_mode <> 'self');

commit;
