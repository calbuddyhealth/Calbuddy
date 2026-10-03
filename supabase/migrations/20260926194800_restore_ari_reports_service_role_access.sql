-- ARI XP — restore backend Help & Safety access
-- 2026-09-26
--
-- api/profile.js uses the service role to rate-limit and create support
-- reports. The table had authenticated grants but lacked SELECT/INSERT/UPDATE
-- grants for service_role, causing the public support form to fail with 403.

begin;

grant select, insert, update on table public.ari_reports to service_role;

commit;
