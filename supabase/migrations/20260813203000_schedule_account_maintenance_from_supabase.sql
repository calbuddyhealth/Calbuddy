-- ARI XP — reliable daily account maintenance scheduler
-- 2026-08-13
--
-- Vercel Cron calls the generated production deployment URL, which is behind
-- Deployment Protection for this project. Supabase Cron instead calls the
-- public production domain (arixp.com) and authenticates with a Vault secret.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

-- Create the maintenance secret once. The plaintext value remains in Vault;
-- it is not stored in the repository or exposed to application users.
do $$
begin
  if not exists (
    select 1
    from vault.decrypted_secrets
    where name = 'ari_maintenance_http_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'ari_maintenance_http_secret',
      'ARI XP daily account maintenance authentication'
    );
  end if;
end;
$$;

-- The Vercel function uses its service-role credential to verify the incoming
-- Supabase Cron token without ever learning the stored secret independently.
create or replace function public.verify_ari_maintenance_secret(candidate text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'ari_maintenance_http_secret'
      and decrypted_secret = candidate
  );
$$;

revoke all on function public.verify_ari_maintenance_secret(text) from public;
revoke all on function public.verify_ari_maintenance_secret(text) from anon;
revoke all on function public.verify_ari_maintenance_secret(text) from authenticated;
grant execute on function public.verify_ari_maintenance_secret(text) to service_role;

create or replace function private.ari_invoke_daily_account_maintenance()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  maintenance_secret text;
  request_id bigint;
begin
  select decrypted_secret
  into maintenance_secret
  from vault.decrypted_secrets
  where name = 'ari_maintenance_http_secret'
  limit 1;

  if maintenance_secret is null or maintenance_secret = '' then
    raise exception 'ARI maintenance secret is unavailable';
  end if;

  select net.http_get(
    url := 'https://arixp.com/api/profile',
    headers := jsonb_build_object(
      'x-ari-maintenance-secret', maintenance_secret,
      'User-Agent', 'ari-supabase-cron/1.0'
    ),
    timeout_milliseconds := 15000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function private.ari_invoke_daily_account_maintenance() from public;
revoke all on function private.ari_invoke_daily_account_maintenance() from anon;
revoke all on function private.ari_invoke_daily_account_maintenance() from authenticated;

-- Replace any prior Supabase job with the canonical daily maintenance job.
do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'ari-daily-account-maintenance'
  order by jobid desc
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'ari-daily-account-maintenance',
    '17 3 * * *',
    $cron$select private.ari_invoke_daily_account_maintenance();$cron$
  );
end;
$$;
