alter policy "Users can manage own activity logs" on public.activity_logs to authenticated;

alter policy "Users can insert own app actions" on public.ai_app_actions to authenticated;
alter policy "Users can update own app actions" on public.ai_app_actions to authenticated;
alter policy "Users can view own app actions" on public.ai_app_actions to authenticated;

alter policy "Users can insert own AI usage" on public.ai_usage_logs to authenticated;
alter policy "Users can view own AI usage" on public.ai_usage_logs to authenticated;

alter policy "Users create their own Ari chat sessions" on public.ari_chat_sessions to authenticated;
alter policy "Users delete their own Ari chat sessions" on public.ari_chat_sessions to authenticated;
alter policy "Users read their own Ari chat sessions" on public.ari_chat_sessions to authenticated;
alter policy "Users update their own Ari chat sessions" on public.ari_chat_sessions to authenticated;

alter policy "Users update their own recent Ari conversations" on public.ari_conversation_turns to authenticated;

alter policy "Users can create own heart rate readings" on public.ari_workout_heart_rate_readings to authenticated;
alter policy "Users can delete own heart rate readings" on public.ari_workout_heart_rate_readings to authenticated;
alter policy "Users can update own heart rate readings" on public.ari_workout_heart_rate_readings to authenticated;
alter policy "Users can view own heart rate readings" on public.ari_workout_heart_rate_readings to authenticated;

alter policy "Users can create own workout exercises" on public.ari_workout_session_exercises to authenticated;
alter policy "Users can delete own workout exercises" on public.ari_workout_session_exercises to authenticated;
alter policy "Users can update own workout exercises" on public.ari_workout_session_exercises to authenticated;
alter policy "Users can view own workout exercises" on public.ari_workout_session_exercises to authenticated;

alter policy "Users can create own workout sets" on public.ari_workout_session_sets to authenticated;
alter policy "Users can delete own workout sets" on public.ari_workout_session_sets to authenticated;
alter policy "Users can update own workout sets" on public.ari_workout_session_sets to authenticated;
alter policy "Users can view own workout sets" on public.ari_workout_session_sets to authenticated;

alter policy "Users can create own workout sessions" on public.ari_workout_sessions to authenticated;
alter policy "Users can delete own workout sessions" on public.ari_workout_sessions to authenticated;
alter policy "Users can update own workout sessions" on public.ari_workout_sessions to authenticated;
alter policy "Users can view own workout sessions" on public.ari_workout_sessions to authenticated;

alter policy "Users can insert own actions" on public.calbuddy_actions to authenticated;
alter policy "Users can update own actions" on public.calbuddy_actions to authenticated;
alter policy "Users can view own actions" on public.calbuddy_actions to authenticated;

alter policy "Users can insert own chat history" on public.chat_history to authenticated;
alter policy "Users can view own chat history" on public.chat_history to authenticated;

alter policy "Users can insert own conversation summaries" on public.conversation_summaries to authenticated;
alter policy "Users can view own conversation summaries" on public.conversation_summaries to authenticated;

alter policy "Users can insert own food recognition" on public.food_recognition_history to authenticated;
alter policy "Users can view own food recognition" on public.food_recognition_history to authenticated;

alter policy "Users can insert own photo analysis" on public.photo_analysis_cache to authenticated;
alter policy "Users can update own photo analysis" on public.photo_analysis_cache to authenticated;
alter policy "Users can view own photo analysis" on public.photo_analysis_cache to authenticated;

alter policy "Users can manage own profile" on public.profiles to authenticated;

alter policy "Users can insert own scan usage" on public.scan_usage_logs to authenticated;
alter policy "Users can view own scan usage" on public.scan_usage_logs to authenticated;

alter policy "Users can view own subscriptions" on public.subscriptions to authenticated;

alter policy "Users can insert own uploaded files" on public.uploaded_files to authenticated;
alter policy "Users can update own uploaded files" on public.uploaded_files to authenticated;
alter policy "Users can view own uploaded files" on public.uploaded_files to authenticated;

alter policy "Users can insert own common meals" on public.user_common_meals to authenticated;
alter policy "Users can update own common meals" on public.user_common_meals to authenticated;
alter policy "Users can view own common meals" on public.user_common_meals to authenticated;

alter policy "Users can insert own memory" on public.user_memory to authenticated;
alter policy "Users can update own memory" on public.user_memory to authenticated;
alter policy "Users can view own memory" on public.user_memory to authenticated;

alter policy "Users can insert own patterns" on public.user_patterns to authenticated;
alter policy "Users can update own patterns" on public.user_patterns to authenticated;
alter policy "Users can view own patterns" on public.user_patterns to authenticated;

alter policy "Users can delete own weight logs" on public.weight_logs to authenticated;
alter policy "Users can insert own weight logs" on public.weight_logs to authenticated;
alter policy "Users can manage own weight logs" on public.weight_logs to authenticated;
alter policy "Users can update own weight logs" on public.weight_logs to authenticated;
alter policy "Users can view own weight logs" on public.weight_logs to authenticated;

alter policy "Users manage their own workouts" on public.workout_logs to authenticated;
