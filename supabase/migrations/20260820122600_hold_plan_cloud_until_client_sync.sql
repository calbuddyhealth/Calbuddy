-- ARI XP deployment-order guard.
-- Production may contain active Meal Plans that currently exist only in local
-- device storage because earlier authenticated table grants were missing.
-- Keep the browser on its existing local fallback until the client-side
-- migration/merge logic ships. Service-role access can remain available.

revoke select, insert, update, delete
  on table public.nutrition_plan_items
  from authenticated;
