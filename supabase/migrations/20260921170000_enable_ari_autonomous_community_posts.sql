alter table public.ari_vnext_community_interactions
  drop constraint if exists ari_vnext_community_interactions_action_check;

alter table public.ari_vnext_community_interactions
  add constraint ari_vnext_community_interactions_action_check
  check (action in ('scan','learn','reply','post','skip'));
