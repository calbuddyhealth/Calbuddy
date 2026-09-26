-- ARI Circle — Meetup Edit Actions V1
-- Adds the host-only mutation used by Connect's Edit meetup action.
-- Delete in the UI continues to call the existing cancel mutation so domain
-- history and participant notifications remain auditable.

begin;

create or replace function public.ari_circle_update_meetup(
  requested_meetup_id uuid,
  requested_title text,
  requested_activity text,
  requested_area text,
  requested_starts_at timestamptz,
  requested_duration_minutes integer default 60,
  requested_max_participants integer default 8,
  requested_description text default null,
  requested_join_mode text default 'instant'
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  meetup_row public.ari_circle_meetups%rowtype;
  clean_title text := btrim(coalesce(requested_title,''));
  clean_activity text := lower(btrim(coalesce(requested_activity,'')));
  clean_area text := btrim(coalesce(requested_area,''));
  clean_join_mode text := lower(btrim(coalesce(requested_join_mode,'instant')));
  duration_minutes integer := greatest(30, least(coalesce(requested_duration_minutes,60),480));
  capacity integer := greatest(2, least(coalesce(requested_max_participants,8),50));
  joined_count integer := 0;
  search_location private.ari_circle_search_locations%rowtype;
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to edit a meetup'; end if;

  select * into meetup_row
  from public.ari_circle_meetups
  where id=requested_meetup_id
  for update;

  if not found or meetup_row.status <> 'scheduled' then raise exception 'Meetup unavailable'; end if;
  if meetup_row.host_user_id <> caller_id then raise exception 'Only the host can edit this meetup'; end if;
  if meetup_row.starts_at <= now() then raise exception 'Meetups cannot be edited after they start'; end if;
  if char_length(clean_title) < 3 or char_length(clean_title) > 90 then raise exception 'Meetup title must be 3-90 characters'; end if;
  if clean_activity not in ('walking','gym','running','hiking','sports','cycling','yoga','coffee','food','community','volunteer','other') then raise exception 'Unsupported meetup activity'; end if;
  if char_length(clean_area) < 2 or char_length(clean_area) > 100 then raise exception 'Use a broad city or area'; end if;
  if clean_join_mode not in ('instant','approval') then raise exception 'Unsupported joining mode'; end if;
  if requested_starts_at is null or requested_starts_at < now() + interval '10 minutes' then raise exception 'Meetup must start at least 10 minutes from now'; end if;
  if requested_starts_at > now() + interval '60 days' then raise exception 'Meetup is too far in the future'; end if;

  select count(*)::integer into joined_count
  from public.ari_circle_meetup_participants
  where meetup_id=requested_meetup_id and status='joined';

  if capacity < joined_count then
    raise exception 'Open spots cannot be reduced below the number of people already going';
  end if;

  select * into search_location
  from private.ari_circle_search_locations s
  where s.user_id=caller_id;

  if search_location.approximate_latitude is not null
     and search_location.area_label is not null
     and (
       lower(clean_area) like '%' || lower(search_location.area_label) || '%'
       or lower(search_location.area_label) like '%' || lower(clean_area) || '%'
     ) then
    safe_lat := search_location.approximate_latitude;
    safe_lon := search_location.approximate_longitude;
  end if;

  update public.ari_circle_meetups
  set title=clean_title,
      activity=clean_activity,
      description=nullif(btrim(coalesce(requested_description,'')),''),
      area=clean_area,
      starts_at=requested_starts_at,
      ends_at=requested_starts_at + make_interval(mins => duration_minutes),
      max_participants=capacity,
      join_mode=clean_join_mode,
      approximate_latitude=safe_lat,
      approximate_longitude=safe_lon,
      updated_at=now()
  where id=requested_meetup_id;

  return true;
end;
$function$;

revoke all on function public.ari_circle_update_meetup(uuid,text,text,text,timestamptz,integer,integer,text,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_update_meetup(uuid,text,text,text,timestamptz,integer,integer,text,text)
  to authenticated, service_role;

commit;
