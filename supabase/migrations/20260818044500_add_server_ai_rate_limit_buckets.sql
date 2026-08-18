-- ARI XP server-side AI abuse protection.
-- This bucket table is server-only: client roles receive no table access.

create table if not exists public.ari_api_rate_limit_buckets (
  bucket_key text not null,
  endpoint text not null,
  window_seconds integer not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, endpoint, window_seconds, window_started_at),
  constraint ari_api_rate_limit_window_bounds check (window_seconds between 10 and 3600),
  constraint ari_api_rate_limit_count_nonnegative check (request_count >= 0)
);

alter table public.ari_api_rate_limit_buckets enable row level security;
revoke all on table public.ari_api_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_api_rate_limit_buckets to service_role;

create or replace function public.ari_server_rate_limit(
  requested_bucket_key text,
  requested_endpoint text,
  requested_window_seconds integer,
  requested_max_requests integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  safe_key text := left(btrim(coalesce(requested_bucket_key, '')), 200);
  safe_endpoint text := left(btrim(coalesce(requested_endpoint, '')), 180);
  safe_window integer := least(greatest(coalesce(requested_window_seconds, 60), 10), 3600);
  safe_max integer := least(greatest(coalesce(requested_max_requests, 60), 1), 100000);
  bucket_start timestamptz;
  next_count integer;
  retry_after integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if safe_key = '' or safe_endpoint = '' then
    raise exception 'Rate limit key and endpoint are required';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / safe_window) * safe_window
  );

  insert into public.ari_api_rate_limit_buckets (
    bucket_key, endpoint, window_seconds, window_started_at, request_count, updated_at
  ) values (
    safe_key, safe_endpoint, safe_window, bucket_start, 1, now()
  )
  on conflict (bucket_key, endpoint, window_seconds, window_started_at)
  do update set
    request_count = public.ari_api_rate_limit_buckets.request_count + 1,
    updated_at = now()
  returning request_count into next_count;

  retry_after := greatest(
    1,
    ceil(extract(epoch from ((bucket_start + make_interval(secs => safe_window)) - now())))::integer
  );

  return jsonb_build_object(
    'allowed', next_count <= safe_max,
    'count', next_count,
    'limit', safe_max,
    'window_seconds', safe_window,
    'retry_after_seconds', retry_after
  );
end;
$function$;

revoke execute on function public.ari_server_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.ari_server_rate_limit(text, text, integer, integer) to service_role;
