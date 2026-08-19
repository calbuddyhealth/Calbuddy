-- ARI XP manual activity ledger now supports multiple completed activities per day.
-- The legacy unique constraint limited each user to one activity row per log date,
-- which caused Quick Log / Ari confirmations to fail with HTTP 409 after the
-- first activity on that date.

alter table public.activity_logs
  drop constraint if exists activity_logs_user_date_unique;

create index if not exists activity_logs_user_date_created_idx
  on public.activity_logs (user_id, log_date desc, created_at desc);
