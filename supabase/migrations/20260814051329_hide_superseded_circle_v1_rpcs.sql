-- ARI XP App Store readiness
-- Retire direct Data API access to superseded V1 Circle RPCs while leaving the
-- functions in place for easy rollback/history. Current Feed/Profile/Challenges
-- use their V2 replacements, and profile flair/reward UI was retired with V3.

revoke execute on function public.ari_circle_feed_create_post(text,text,text,text)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_feed_list(integer,timestamp with time zone)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_profile_posts(uuid,integer)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_challenge_list(integer)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_profile_rewards(uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_set_profile_flair(text)
  from public, anon, authenticated, service_role;
