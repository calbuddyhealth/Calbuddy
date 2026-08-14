-- Internal ARI Circle helper functions are called only by privileged parent RPCs
-- or triggers. They should not be independently callable through the Data API.

revoke execute on function public.ari_circle_feed_assert_same_cohort(uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_feed_is_blocked(uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_same_verified_cohort(uuid,uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.ari_circle_social_pair_is_blocked(uuid,uuid)
  from public, anon, authenticated, service_role;
