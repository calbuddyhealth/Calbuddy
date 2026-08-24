-- Restore the server-side privileges required by Ari vNext continuity.
-- RLS still protects browser/authenticated access; these grants allow the
-- trusted Vercel backend using SUPABASE_SERVICE_ROLE_KEY to read/write the
-- continuity tables it already owns logically.

grant select, insert, update, delete on table public.ari_conversation_turns to service_role;
grant select, insert, update, delete on table public.ari_user_memory to service_role;
grant select, insert, update, delete on table public.ari_user_preferences to service_role;
grant select, insert, update, delete on table public.ari_account_state to service_role;
