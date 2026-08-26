-- ARI Circle — Native Meetup Push V1
-- Circle Activity rows remain the user-facing source of truth. This adds a
-- server-only delivery outbox so native APNs delivery cannot mutate meetup state
-- or accept arbitrary notification content from clients.

create table if not exists public.ari_circle_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.ari_circle_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  requested_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_circle_push_deliveries_notification_unique unique (notification_id),
  constraint ari_circle_push_deliveries_status_check check (status in ('pending','sending','sent','skipped','failed')),
  constraint ari_circle_push_deliveries_attempt_count_check check (attempt_count >= 0 and attempt_count <= 20)
);

create index if not exists ari_circle_push_deliveries_pending_idx
  on public.ari_circle_push_deliveries (status, next_attempt_at, requested_at)
  where status = 'pending';

alter table public.ari_circle_push_deliveries enable row level security;
revoke all on table public.ari_circle_push_deliveries from public, anon, authenticated;
grant all on table public.ari_circle_push_deliveries to service_role;

create or replace function private.ari_circle_request_native_push(delivery_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id bigint;
begin
  if delivery_id is null then return null; end if;

  select net.http_post(
    url := 'https://www.calbuddyhealth.com/api/ari-circle-push-dispatch',
    body := jsonb_build_object('deliveryId', delivery_id),
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-ARI-Delivery', 'circle-meetup-v1'),
    timeout_milliseconds := 5000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.ari_circle_request_native_push(uuid) from public;
revoke all on function private.ari_circle_request_native_push(uuid) from anon;
revoke all on function private.ari_circle_request_native_push(uuid) from authenticated;

create or replace function private.ari_circle_enqueue_native_meetup_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delivery_id uuid;
  notification_kind text;
begin
  notification_kind := nullif(btrim(coalesce(new.data ->> 'kind', '')), '');

  if notification_kind is null or notification_kind <> all(array[
    'meetup_request',
    'meetup_waitlisted',
    'meetup_accepted',
    'meetup_declined',
    'meetup_joined',
    'meetup_spot_opened',
    'meetup_cancelled',
    'meetup_reminder',
    'meetup_verified'
  ]::text[]) then
    return new;
  end if;

  if not (new.data ? 'meetup_id') then
    return new;
  end if;

  insert into public.ari_circle_push_deliveries (
    notification_id,
    user_id,
    status,
    requested_at,
    next_attempt_at
  )
  values (
    new.id,
    new.user_id,
    'pending',
    now(),
    now()
  )
  on conflict (notification_id) do nothing
  returning id into delivery_id;

  if delivery_id is not null then
    perform private.ari_circle_request_native_push(delivery_id);
  end if;

  return new;
end;
$$;

revoke all on function private.ari_circle_enqueue_native_meetup_push() from public;
revoke all on function private.ari_circle_enqueue_native_meetup_push() from anon;
revoke all on function private.ari_circle_enqueue_native_meetup_push() from authenticated;

drop trigger if exists ari_circle_notifications_native_meetup_push
  on public.ari_circle_notifications;
create trigger ari_circle_notifications_native_meetup_push
after insert on public.ari_circle_notifications
for each row execute function private.ari_circle_enqueue_native_meetup_push();

create or replace function private.ari_circle_retry_pending_native_pushes(result_limit integer default 20)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  delivery_row record;
  requested_count integer := 0;
begin
  for delivery_row in
    select d.id
    from public.ari_circle_push_deliveries d
    where d.status = 'pending'
      and d.next_attempt_at <= now()
      and d.attempt_count < 5
    order by d.next_attempt_at asc, d.requested_at asc
    limit greatest(1, least(coalesce(result_limit, 20), 50))
  loop
    perform private.ari_circle_request_native_push(delivery_row.id);
    requested_count := requested_count + 1;
  end loop;

  return requested_count;
end;
$$;

revoke all on function private.ari_circle_retry_pending_native_pushes(integer) from public;
revoke all on function private.ari_circle_retry_pending_native_pushes(integer) from anon;
revoke all on function private.ari_circle_retry_pending_native_pushes(integer) from authenticated;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'ari-circle-native-push-v1-retry'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'ari-circle-native-push-v1-retry',
    '*/5 * * * *',
    'select private.ari_circle_retry_pending_native_pushes(20);'
  );
end;
$$;
