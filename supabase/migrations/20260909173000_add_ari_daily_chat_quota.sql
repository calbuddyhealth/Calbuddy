create table if not exists public.ari_daily_chat_quota_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  timezone_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ari_daily_chat_quota_reservations (
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null,
  local_date date not null,
  timezone text not null,
  status text not null default 'reserved' check (status in ('reserved','consumed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, turn_id)
);

create index if not exists ari_daily_chat_quota_user_day_idx
  on public.ari_daily_chat_quota_reservations (user_id, local_date, status);

alter table public.ari_daily_chat_quota_settings enable row level security;
alter table public.ari_daily_chat_quota_reservations enable row level security;

revoke all on table public.ari_daily_chat_quota_settings from anon, authenticated, public;
revoke all on table public.ari_daily_chat_quota_reservations from anon, authenticated, public;
grant select, insert, update, delete on table public.ari_daily_chat_quota_settings to service_role;
grant select, insert, update, delete on table public.ari_daily_chat_quota_reservations to service_role;

create or replace function public.ari_reserve_daily_chat_quota(
  requested_user_id uuid,
  requested_turn_id text,
  requested_timezone text,
  requested_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  effective_timezone text;
  valid_requested_timezone boolean := false;
  timezone_changed_at timestamptz;
  local_day date;
  reset_at timestamptz;
  used_count integer;
  daily_limit integer := greatest(1, least(coalesce(requested_daily_limit, 10), 100));
  existing_status text;
begin
  if requested_user_id is null or nullif(btrim(requested_turn_id), '') is null then
    raise exception 'invalid_quota_identity';
  end if;

  if nullif(btrim(requested_timezone), '') is not null then
    select exists(
      select 1 from pg_catalog.pg_timezone_names() z where z.name = requested_timezone
    ) into valid_requested_timezone;
  end if;

  select s.timezone, s.timezone_updated_at
    into effective_timezone, timezone_changed_at
    from public.ari_daily_chat_quota_settings s
    where s.user_id = requested_user_id;

  if effective_timezone is null then
    effective_timezone := case when valid_requested_timezone then requested_timezone else 'UTC' end;
    insert into public.ari_daily_chat_quota_settings (user_id, timezone)
    values (requested_user_id, effective_timezone)
    on conflict (user_id) do nothing;

    select s.timezone, s.timezone_updated_at
      into effective_timezone, timezone_changed_at
      from public.ari_daily_chat_quota_settings s
      where s.user_id = requested_user_id;
  elsif valid_requested_timezone
    and requested_timezone <> effective_timezone
    and timezone_changed_at <= now() - interval '7 days' then
    update public.ari_daily_chat_quota_settings
      set timezone = requested_timezone,
          timezone_updated_at = now(),
          updated_at = now()
      where user_id = requested_user_id;
    effective_timezone := requested_timezone;
  end if;

  local_day := (now() at time zone effective_timezone)::date;
  reset_at := ((local_day + 1)::timestamp at time zone effective_timezone);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(requested_user_id::text || ':' || local_day::text, 0)
  );

  select r.status into existing_status
    from public.ari_daily_chat_quota_reservations r
    where r.user_id = requested_user_id and r.turn_id = requested_turn_id;

  select count(*)::integer into used_count
    from public.ari_daily_chat_quota_reservations r
    where r.user_id = requested_user_id
      and r.local_date = local_day
      and r.status in ('reserved','consumed');

  if existing_status is not null then
    return jsonb_build_object(
      'allowed', true,
      'replayed', true,
      'used', used_count,
      'remaining', greatest(0, daily_limit - used_count),
      'dailyLimit', daily_limit,
      'timezone', effective_timezone,
      'localDate', local_day,
      'resetAt', reset_at
    );
  end if;

  if used_count >= daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'replayed', false,
      'used', used_count,
      'remaining', 0,
      'dailyLimit', daily_limit,
      'timezone', effective_timezone,
      'localDate', local_day,
      'resetAt', reset_at
    );
  end if;

  insert into public.ari_daily_chat_quota_reservations
    (user_id, turn_id, local_date, timezone, status)
  values
    (requested_user_id, requested_turn_id, local_day, effective_timezone, 'reserved');

  used_count := used_count + 1;
  return jsonb_build_object(
    'allowed', true,
    'replayed', false,
    'used', used_count,
    'remaining', greatest(0, daily_limit - used_count),
    'dailyLimit', daily_limit,
    'timezone', effective_timezone,
    'localDate', local_day,
    'resetAt', reset_at
  );
end;
$$;

revoke execute on function public.ari_reserve_daily_chat_quota(uuid, text, text, integer) from anon, authenticated, public;
grant execute on function public.ari_reserve_daily_chat_quota(uuid, text, text, integer) to service_role;
