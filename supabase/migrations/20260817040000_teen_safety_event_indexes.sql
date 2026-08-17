-- ARI Circle Build 5 — Teen Safety review queue indexes
-- 2026-08-17

begin;

create index if not exists ari_teen_safety_events_related_user_idx
  on public.ari_teen_safety_events (related_user_id)
  where related_user_id is not null;

create index if not exists ari_teen_safety_events_reviewed_by_idx
  on public.ari_teen_safety_events (reviewed_by)
  where reviewed_by is not null;

commit;
