-- ARI XP Nutrition Trust Layer P0
-- The table already has owner-scoped RLS policies, but its DML privileges were
-- missing. Without these grants the signed-in browser silently falls back to
-- device storage and server-side Ari context can miss the active plan.

grant select, insert, update, delete
  on table public.nutrition_plan_items
  to authenticated;

grant select, insert, update, delete
  on table public.nutrition_plan_items
  to service_role;

-- Keep anonymous clients out. Authenticated rows remain constrained by the
-- existing auth.uid() = user_id RLS policies.
revoke all
  on table public.nutrition_plan_items
  from anon;
