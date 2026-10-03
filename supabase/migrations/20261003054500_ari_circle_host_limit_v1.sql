-- ARI Circle Host Limit V1
-- Prevent one account from flooding Connect with unlimited active/upcoming meetups.
-- The limit is enforced inside the canonical create RPC and serialized per host
-- so concurrent requests cannot race past the cap.

begin;

create or replace function public.ari_circle_create_meetup(
  requested_title text,
  requested_activity text,
  requested_area text,
  requested_starts_at timestamptz,
  requested_duration_minutes integer default 60,
  requested_max_participants integer default 8,
  requested_description text default null,
  requested_join_mode text default 'instant'
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  meetup_id uuid;
  clean_title text := btrim(coalesce(requested_title,''));
  clean_activity text := lower(btrim(coalesce(requested_activity,'')));
  clean_area text := btrim(coalesce(requested_area,''));
  clean_join_mode text := lower(btrim(coalesce(requested_join_mode,'instant')));
  duration_minutes integer := greatest(30, least(coalesce(requested_duration_minutes,60),480));
  capacity integer := greatest(2, least(coalesce(requested_max_participants,8),50));
  active_hosted_count integer := 0;
  search_location private.ari_circle_search_locations%rowtype;
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to host a meetup'; end if;
  if char_length(clean_title) < 3 or char_length(clean_title) > 90 then raise exception 'Meetup title must be 3-90 characters'; end if;
  if clean_activity not in ('walking','gym','running','hiking','sports','cycling','yoga','coffee','food','community','volunteer','other') then raise exception 'Unsupported meetup activity'; end if;
  if char_length(clean_area) < 2 or char_length(clean_area) > 100 then raise exception 'Use a broad city or area'; end if;
  if clean_join_mode not in ('instant','approval') then raise exception 'Unsupported joining mode'; end if;
  if requested_starts_at is null or requested_starts_at < now() + interval '10 minutes' then raise exception 'Meetup must start at least 10 minutes from now'; end if;
  if requested_starts_at > now() + interval '60 days' then raise exception 'Meetup is too far in the future'; end if;

  -- Serialize create attempts for this host before counting. Without this lock,
  -- parallel requests could both observe four meetups and create a sixth.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ari_circle_host_limit:' || caller_id::text, 0)
  );

  select count(*)::integer into active_hosted_count
  from public.ari_circle_meetups m
  where m.host_user_id = caller_id
    and m.status = 'scheduled'
    and m.ends_at > now();

  if active_hosted_count >= 5 then
    raise exception 'You can host up to 5 active or upcoming events at a time.';
  end if;

  select * into search_location
  from private.ari_circle_search_locations s
  where s.user_id = caller_id;

  if search_location.approximate_latitude is not null
     and search_location.area_label is not null
     and (
       lower(clean_area) like '%' || lower(search_location.area_label) || '%'
       or lower(search_location.area_label) like '%' || lower(clean_area) || '%'
     ) then
    safe_lat := search_location.approximate_latitude;
    safe_lon := search_location.approximate_longitude;
  end if;

  insert into public.ari_circle_meetups (
    host_user_id, title, activity, description, area, starts_at, ends_at,
    max_participants, join_mode, approximate_latitude, approximate_longitude
  ) values (
    caller_id, clean_title, clean_activity,
    nullif(btrim(coalesce(requested_description,'')),''), clean_area,
    requested_starts_at, requested_starts_at + make_interval(mins => duration_minutes),
    capacity, clean_join_mode, safe_lat, safe_lon
  ) returning id into meetup_id;

  insert into public.ari_circle_meetup_participants(meetup_id,user_id,role,status)
  values (meetup_id,caller_id,'host','joined');

  return meetup_id;
end;
$function$;

revoke all on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text)
  to authenticated, service_role;

commit;
