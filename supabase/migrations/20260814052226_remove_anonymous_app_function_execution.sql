revoke execute on function public.ari_circle_age_band_for_date(date) from public, anon;
grant execute on function public.ari_circle_age_band_for_date(date) to authenticated, service_role;

revoke execute on function public.ari_circle_basic_content_safety_reason(text) from public, anon;
grant execute on function public.ari_circle_basic_content_safety_reason(text) to authenticated, service_role;

revoke execute on function public.ari_circle_enforce_basic_content_safety() from public, anon;
grant execute on function public.ari_circle_enforce_basic_content_safety() to authenticated, service_role;

revoke execute on function public.ari_circle_partner_touch_updated_at() from public, anon;
grant execute on function public.ari_circle_partner_touch_updated_at() to authenticated, service_role;

revoke execute on function public.ari_circle_touch_updated_at() from public, anon;
grant execute on function public.ari_circle_touch_updated_at() to authenticated, service_role;

revoke execute on function public.ari_prepare_user_preference_update() from public, anon;
grant execute on function public.ari_prepare_user_preference_update() to authenticated, service_role;

revoke execute on function public.ari_set_updated_at() from public, anon;
grant execute on function public.ari_set_updated_at() to authenticated, service_role;

revoke execute on function public.ari_training_progress_set_completed_at() from public, anon;
grant execute on function public.ari_training_progress_set_completed_at() to authenticated, service_role;

revoke execute on function public.ari_training_set_updated_at() from public, anon;
grant execute on function public.ari_training_set_updated_at() to authenticated, service_role;

revoke execute on function public.match_ari_knowledge_nodes(vector, integer) from public, anon;
grant execute on function public.match_ari_knowledge_nodes(vector, integer) to authenticated, service_role;

revoke execute on function public.match_ari_knowledge_nodes(vector, text[], integer, double precision) from public, anon;
grant execute on function public.match_ari_knowledge_nodes(vector, text[], integer, double precision) to authenticated, service_role;

revoke execute on function public.reset_my_ari_preferences() from public, anon;
grant execute on function public.reset_my_ari_preferences() to authenticated, service_role;
