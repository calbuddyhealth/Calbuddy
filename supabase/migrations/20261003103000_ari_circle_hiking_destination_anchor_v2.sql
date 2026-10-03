-- ARI Circle Hiking Destination Anchor V2
-- Keep member search GPS separate from the public destination of a hiking meetup.
-- This is intentionally additive: it does not change the canonical create/list RPC signatures.

begin;

create or replace function public.ari_circle_set_hiking_destination_v2(
  requested_meetup_id uuid,
  requested_destination_label text,
  requested_latitude double precision,
  requested_longitude double precision
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  clean_label text := btrim(coalesce(requested_destination_label, ''));
  safe_lat numeric(6,2);
  safe_lon numeric(7,2);
begin
  perform public.ari_circle_assert_adult_access();

  if caller_id is null then
    raise exception 'Sign in to update a meetup destination';
  end if;

  if requested_meetup_id is null then
    raise exception 'Meetup is required';
  end if;

  if char_length(clean_label) < 2 or char_length(clean_label) > 100 then
    raise exception 'Destination must be 2-100 characters';
  end if;

  if requested_latitude is null
     or requested_longitude is null
     or requested_latitude < -90
     or requested_latitude > 90
     or requested_longitude < -180
     or requested_longitude > 180 then
    raise exception 'Destination coordinates are invalid';
  end if;

  -- Preserve the same privacy precision already used by Circle discovery.
  safe_lat := round(requested_latitude::numeric, 2);
  safe_lon := round(requested_longitude::numeric, 2);

  update public.ari_circle_meetups
  set area = clean_label,
      discovery_area = clean_label,
      approximate_latitude = safe_lat,
      approximate_longitude = safe_lon
  where id = requested_meetup_id
    and host_user_id = caller_id
    and status = 'scheduled'
    and activity = 'hiking';

  if not found then
    raise exception 'Only the host can set a destination for a scheduled hiking meetup';
  end if;

  return true;
end;
$function$;

revoke all on function public.ari_circle_set_hiking_destination_v2(uuid,text,double precision,double precision)
  from public, anon, authenticated;
grant execute on function public.ari_circle_set_hiking_destination_v2(uuid,text,double precision,double precision)
  to authenticated, service_role;

comment on function public.ari_circle_set_hiking_destination_v2(uuid,text,double precision,double precision) is
  'Host-only additive destination anchor for hiking meetups. Replaces the meetup discovery coordinates with a selected public destination without changing the member search origin.';

commit;
