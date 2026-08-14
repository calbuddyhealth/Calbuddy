-- ARI XP App Store readiness
-- Restrict legacy SECURITY DEFINER functions to the minimum roles that need them.
--
-- Internal trigger/event-trigger functions are implementation details and must not
-- be exposed as callable Data API RPCs.

revoke execute on function public.ari_audit_user_preference_change() from public, anon, authenticated, service_role;
revoke execute on function public.ari_circle_award_received_reaction_rewards() from public, anon, authenticated, service_role;
revoke execute on function public.ari_circle_connection_age_guard() from public, anon, authenticated, service_role;
revoke execute on function public.ari_circle_message_request_age_guard() from public, anon, authenticated, service_role;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

-- Signed-in ARI Circle RPCs: authenticated clients only.
-- Remove legacy PUBLIC, anon, and service-role grants, then explicitly preserve
-- EXECUTE for authenticated callers.

revoke execute on function public.ari_circle_challenge_reaction_summary(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_challenge_reaction_summary(uuid) to authenticated;

revoke execute on function public.ari_circle_challenge_set_reaction(uuid,text) from public, anon, service_role;
grant execute on function public.ari_circle_challenge_set_reaction(uuid,text) to authenticated;

revoke execute on function public.ari_circle_feed_delete_comment(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_feed_delete_comment(uuid) to authenticated;

revoke execute on function public.ari_circle_feed_delete_post(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_feed_delete_post(uuid) to authenticated;

revoke execute on function public.ari_circle_feed_hide_post(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_feed_hide_post(uuid) to authenticated;

revoke execute on function public.ari_circle_feed_post_options_context(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_feed_post_options_context(uuid) to authenticated;

revoke execute on function public.ari_circle_friend_request_respond(uuid,boolean) from public, anon, service_role;
grant execute on function public.ari_circle_friend_request_respond(uuid,boolean) to authenticated;

revoke execute on function public.ari_circle_friend_requests_list() from public, anon, service_role;
grant execute on function public.ari_circle_friend_requests_list() to authenticated;

revoke execute on function public.ari_circle_messages_delete(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_messages_delete(uuid) to authenticated;

revoke execute on function public.ari_circle_messages_edit(uuid,text) from public, anon, service_role;
grant execute on function public.ari_circle_messages_edit(uuid,text) to authenticated;

revoke execute on function public.ari_circle_messages_hide_conversation(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_messages_hide_conversation(uuid) to authenticated;

revoke execute on function public.ari_circle_messages_list(integer) from public, anon, service_role;
grant execute on function public.ari_circle_messages_list(integer) to authenticated;

revoke execute on function public.ari_circle_messages_open_direct(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_messages_open_direct(uuid) to authenticated;

revoke execute on function public.ari_circle_messages_send(uuid,text) from public, anon, service_role;
grant execute on function public.ari_circle_messages_send(uuid,text) to authenticated;

revoke execute on function public.ari_circle_messages_thread(uuid,integer) from public, anon, service_role;
grant execute on function public.ari_circle_messages_thread(uuid,integer) to authenticated;

revoke execute on function public.ari_circle_moment_delete(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_moment_delete(uuid) to authenticated;

revoke execute on function public.ari_circle_mute_state(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_mute_state(uuid) to authenticated;

revoke execute on function public.ari_circle_notifications_clear() from public, anon, service_role;
grant execute on function public.ari_circle_notifications_clear() to authenticated;

revoke execute on function public.ari_circle_profile_friends(uuid,integer) from public, anon, service_role;
grant execute on function public.ari_circle_profile_friends(uuid,integer) to authenticated;

revoke execute on function public.ari_circle_relationship_state(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_relationship_state(uuid) to authenticated;

revoke execute on function public.ari_circle_remove_partner_intent(uuid) from public, anon, service_role;
grant execute on function public.ari_circle_remove_partner_intent(uuid) to authenticated;

revoke execute on function public.ari_circle_set_mute(uuid,boolean) from public, anon, service_role;
grant execute on function public.ari_circle_set_mute(uuid,boolean) to authenticated;
