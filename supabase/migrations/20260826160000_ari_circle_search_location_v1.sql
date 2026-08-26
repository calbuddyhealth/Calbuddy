-- ARI Circle Search Location V1
-- One private, user-controlled coarse search origin for For You, Explore, and Meet Up.
-- Exact device location is never stored: coordinates are rounded to 2 decimals server-side.

begin;

create table if not exists private.ari_circle_search_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  area_label text,
  approximate_latitude numeric(6,2),
  approximate_longitude numeric(7,2),
  radius_miles smallint not null default 25 check (radius_miles in (5,10,25,50,100)),
  source text not null check (source in ('manual_area','current_location')),
  updated_at timestamptz not null default now(),
  constraint ari_circle_search_locations_area_check
    check (area_label is null or char_length(btrim(area_label)) between 2 and 100),
  constraint ari_circle_search_locations_lat_check
    check (approximate_latitude is null or approximate_latitude between -90 and 90),
  constraint ari_circle_search_locations_lon_check
    check (approximate_longitude is null or approximate_longitude between -180 and 180),
  constraint ari_circle_search_locations_pair_check
    check ((approximate_latitude is null) = (approximate_longitude is null)),
  constraint ari_circle_search_locations_basis_check
    check (area_label is not null or approximate_latitude is not null)
);

alter table private.ari_circle_search_locations enable row level security;
revoke all on table private.ari_circle_search_locations from public, anon, authenticated;
grant select, insert, update, delete on table private.ari_circle_search_locations to service_role;

create or replace function public.ari_circle_get_my_search_location()
returns table (
  area_label text,
  approximate_latitude numeric,
  approximate_longitude numeric,
  radius_miles integer,
  source text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to use Circle location'; end if;

  return query
  select
    s.area_label,
    s.approximate_latitude::numeric,
    s.approximate_longitude::numeric,
    s.radius_miles::integer,
    s.source,
    s.updated_at
  from private.ari_circle_search_locations s
  where s.user_id = caller_id;
end;
$$;

create or replace function public.ari_circle_set_my_search_location(
  requested_area_label text default null,
  requested_latitude numeric default null,
  requested_longitude numeric default null,
  requested_radius_miles integer default 25,
  requested_source text default 'manual_area'
)
returns table (
  area_label text,
  approximate_latitude numeric,
  approximate_longitude numeric,
  radius_miles integer,
  source text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_area text := nullif(btrim(coalesce(requested_area_label, '')), '');
  clean_source text := lower(btrim(coalesce(requested_source, 'manual_area')));
  safe_radius integer := coalesce(requested_radius_miles, 25);
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to use Circle location'; end if;

  if safe_radius not in (5,10,25,50,100) then
    raise exception 'Unsupported Circle search radius';
  end if;

  if clean_source not in ('manual_area','current_location') then
    raise exception 'Unsupported Circle location source';
  end if;

  if clean_area is not null and (char_length(clean_area) < 2 or char_length(clean_area) > 100) then
    raise exception 'Use a city, ZIP code, or general neighborhood up to 100 characters';
  end if;

  if clean_source = 'manual_area' then
    if clean_area is null then
      raise exception 'Enter a city, ZIP code, or general neighborhood';
    end if;
  else
    if requested_latitude is null or requested_longitude is null
       or requested_latitude < -90 or requested_latitude > 90
       or requested_longitude < -180 or requested_longitude > 180 then
      raise exception 'A valid location is required';
    end if;
    -- Privacy boundary: never persist device precision.
    safe_lat := round(requested_latitude, 2);
    safe_lon := round(requested_longitude, 2);
  end if;

  insert into private.ari_circle_search_locations (
    user_id, area_label, approximate_latitude, approximate_longitude,
    radius_miles, source, updated_at
  ) values (
    caller_id, clean_area, safe_lat, safe_lon,
    safe_radius, clean_source, now()
  )
  on conflict (user_id) do update
  set area_label = excluded.area_label,
      approximate_latitude = excluded.approximate_latitude,
      approximate_longitude = excluded.approximate_longitude,
      radius_miles = excluded.radius_miles,
      source = excluded.source,
      updated_at = now();

  return query
  select
    s.area_label,
    s.approximate_latitude::numeric,
    s.approximate_longitude::numeric,
    s.radius_miles::integer,
    s.source,
    s.updated_at
  from private.ari_circle_search_locations s
  where s.user_id = caller_id;
end;
$$;

create or replace function public.ari_circle_clear_my_search_location()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to use Circle location'; end if;

  delete from private.ari_circle_search_locations s
  where s.user_id = caller_id;

  return found;
end;
$$;

revoke all on function public.ari_circle_get_my_search_location() from public, anon, authenticated;
revoke all on function public.ari_circle_set_my_search_location(text,numeric,numeric,integer,text) from public, anon, authenticated;
revoke all on function public.ari_circle_clear_my_search_location() from public, anon, authenticated;
grant execute on function public.ari_circle_get_my_search_location() to authenticated, service_role;
grant execute on function public.ari_circle_set_my_search_location(text,numeric,numeric,integer,text) to authenticated, service_role;
grant execute on function public.ari_circle_clear_my_search_location() to authenticated, service_role;

-- Allow Meet Up discovery to carry a coarse discovery origin that is separate
-- from the private meeting_point. These coordinates are not returned by meetup reads.
alter table public.ari_circle_meetups
  add column if not exists approximate_latitude numeric(6,2),
  add column if not exists approximate_longitude numeric(7,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_approx_lat_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_approx_lat_check
      check (approximate_latitude is null or approximate_latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_approx_lon_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_approx_lon_check
      check (approximate_longitude is null or approximate_longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_approx_pair_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_approx_pair_check
      check ((approximate_latitude is null) = (approximate_longitude is null));
  end if;
end $$;

create index if not exists ari_circle_meetups_area_starts_idx
  on public.ari_circle_meetups (lower(area), starts_at)
  where status = 'scheduled';

-- Existing canonical Action Intent mutation now falls back to the caller's
-- private Circle search location only when the caller did not provide a
-- different explicit area/location. Per-intent distance remains authoritative.
create or replace function public.ari_circle_create_action_intent(
  requested_activity text,
  requested_time_window_start timestamptz,
  requested_time_window_end timestamptz,
  requested_experience_level text default 'any',
  requested_intensity text default 'any',
  requested_group_min integer default 1,
  requested_group_max integer default 8,
  requested_area text default null,
  requested_radius_miles integer default 25,
  requested_note text default null,
  requested_latitude numeric default null,
  requested_longitude numeric default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  clean_activity text := lower(btrim(coalesce(requested_activity, '')));
  clean_experience text := lower(btrim(coalesce(requested_experience_level, 'any')));
  clean_intensity text := lower(btrim(coalesce(requested_intensity, 'any')));
  clean_area text := nullif(btrim(coalesce(requested_area, '')), '');
  clean_note text := nullif(btrim(coalesce(requested_note, '')), '');
  safe_group_min integer := coalesce(requested_group_min, 1);
  safe_group_max integer := coalesce(requested_group_max, 8);
  safe_radius integer := coalesce(requested_radius_miles, 25);
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
  search_location private.ari_circle_search_locations%rowtype;
  result_id uuid;
begin
  perform public.ari_circle_assert_adult_access();

  if clean_activity not in (
    'any','walking','gym','running','hiking','sports','cycling','yoga',
    'coffee','food','community','volunteer','wellness','outdoor','other'
  ) then
    raise exception 'Unsupported action intent activity';
  end if;

  if clean_experience not in ('any','beginner','intermediate','advanced') then
    raise exception 'Unsupported experience level';
  end if;

  if clean_intensity not in ('any','easy','moderate','hard') then
    raise exception 'Unsupported activity intensity';
  end if;

  if safe_group_min < 1 or safe_group_min > 50
     or safe_group_max < 1 or safe_group_max > 50
     or safe_group_max < safe_group_min then
    raise exception 'Choose a valid group-size range';
  end if;

  if safe_radius not in (5,10,25,50,100) then
    raise exception 'Unsupported discovery radius';
  end if;

  if requested_time_window_start is null or requested_time_window_end is null then
    raise exception 'Choose when you are available';
  end if;

  if requested_time_window_start < now() - interval '15 minutes' then
    raise exception 'Action intent cannot start in the past';
  end if;

  if requested_time_window_start > now() + interval '30 days' then
    raise exception 'Action intent is too far in the future';
  end if;

  if requested_time_window_end <= greatest(requested_time_window_start, now()) then
    raise exception 'Action intent needs a future end time';
  end if;

  if requested_time_window_end > requested_time_window_start + interval '30 days' then
    raise exception 'Action intent window is too long';
  end if;

  if clean_area is not null and (char_length(clean_area) < 2 or char_length(clean_area) > 100) then
    raise exception 'Use a general area up to 100 characters';
  end if;

  if clean_note is not null and char_length(clean_note) > 280 then
    raise exception 'Action intent note is too long';
  end if;

  if requested_latitude is not null or requested_longitude is not null then
    if requested_latitude is null or requested_longitude is null
       or requested_latitude < -90 or requested_latitude > 90
       or requested_longitude < -180 or requested_longitude > 180 then
      raise exception 'A valid approximate location is required';
    end if;
    safe_lat := round(requested_latitude, 2);
    safe_lon := round(requested_longitude, 2);
  else
    select * into search_location
    from private.ari_circle_search_locations s
    where s.user_id = caller_id;

    if search_location.user_id is not null then
      if clean_area is null and search_location.area_label is not null then
        clean_area := search_location.area_label;
      end if;

      if search_location.approximate_latitude is not null
         and (
           requested_area is null
           or nullif(btrim(coalesce(requested_area, '')), '') is null
           or (
             search_location.area_label is not null
             and (
               lower(clean_area) like '%' || lower(search_location.area_label) || '%'
               or lower(search_location.area_label) like '%' || lower(clean_area) || '%'
             )
           )
         ) then
        safe_lat := search_location.approximate_latitude;
        safe_lon := search_location.approximate_longitude;
      end if;
    end if;
  end if;

  insert into public.ari_circle_action_intents (
    user_id, activity, experience_level, intensity,
    desired_group_min, desired_group_max, area,
    approximate_latitude, approximate_longitude, radius_miles,
    time_window_start, time_window_end, note, status, expires_at
  ) values (
    caller_id, clean_activity, clean_experience, clean_intensity,
    safe_group_min, safe_group_max, clean_area,
    safe_lat, safe_lon, safe_radius,
    requested_time_window_start, requested_time_window_end, clean_note,
    'active', requested_time_window_end
  )
  returning id into result_id;

  return result_id;
end;
$function$;

-- Explore falls back to the same private search location only when the caller
-- did not explicitly provide an area or coordinates.
create or replace function public.ari_circle_list_places(
  requested_activity text default null,
  requested_area text default null,
  requested_latitude numeric default null,
  requested_longitude numeric default null,
  requested_radius_miles integer default 25,
  result_limit integer default 30
)
returns table (
  place_id uuid,
  place_name text,
  place_type text,
  description text,
  area text,
  city text,
  region text,
  country_code text,
  latitude numeric,
  longitude numeric,
  activity_tags text[],
  verification_state text,
  distance_miles numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity, ''))), '');
  clean_area text := nullif(lower(btrim(coalesce(requested_area, ''))), '');
  safe_radius integer := coalesce(requested_radius_miles, 25);
  cap integer := greatest(1, least(coalesce(result_limit, 30), 50));
  location_lat numeric := requested_latitude;
  location_lon numeric := requested_longitude;
  use_location boolean := false;
  search_location private.ari_circle_search_locations%rowtype;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_latitude is null and requested_longitude is null and clean_area is null then
    select * into search_location
    from private.ari_circle_search_locations s
    where s.user_id = caller_id;

    if search_location.user_id is not null then
      clean_area := nullif(lower(btrim(coalesce(search_location.area_label, ''))), '');
      location_lat := search_location.approximate_latitude;
      location_lon := search_location.approximate_longitude;
      safe_radius := search_location.radius_miles;
    end if;
  end if;

  if safe_radius not in (5,10,25,50,100) then
    raise exception 'Unsupported Explore radius';
  end if;

  if location_lat is null and location_lon is null then
    use_location := false;
  elsif location_lat is null or location_lon is null
     or location_lat < -90 or location_lat > 90
     or location_lon < -180 or location_lon > 180 then
    raise exception 'A valid approximate Explore location is required';
  else
    use_location := true;
  end if;

  return query
  with candidates as (
    select
      p.*,
      case
        when use_location then (
          3958.7613 * 2 * asin(
            least(1::double precision, sqrt(
              power(sin(radians((p.latitude::double precision - location_lat::double precision) / 2)), 2)
              + cos(radians(location_lat::double precision))
                * cos(radians(p.latitude::double precision))
                * power(sin(radians((p.longitude::double precision - location_lon::double precision) / 2)), 2)
            ))
          )
        )
        else null::double precision
      end as distance_value
    from public.ari_circle_places p
    where p.status = 'active'
      and p.safe_public_place = true
      and p.verification_state in ('curated','partner_verified')
      and (
        clean_activity is null
        or clean_activity = 'any'
        or clean_activity = any(p.activity_tags)
      )
      and (
        clean_area is null
        or lower(p.area) like ('%' || clean_area || '%')
        or lower(coalesce(p.city, '')) like ('%' || clean_area || '%')
        or lower(coalesce(p.region, '')) like ('%' || clean_area || '%')
      )
  )
  select
    c.id, c.name, c.place_type, c.description, c.area, c.city, c.region,
    c.country_code, c.latitude, c.longitude, c.activity_tags,
    c.verification_state,
    case when c.distance_value is null then null else round(c.distance_value::numeric, 1) end
  from candidates c
  where not use_location or c.distance_value <= safe_radius
  order by
    case when c.distance_value is null then 1 else 0 end,
    c.distance_value asc nulls last,
    lower(c.name) asc,
    c.id asc
  limit cap;
end;
$$;

-- Meet Up hosting reuses the canonical mutation. Coarse coordinates are copied
-- only when the host's broad meetup area matches the label attached to their
-- private Circle search location; the private meeting point remains separate.
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

-- Canonical Meet Up read applies the shared search preference. Known coarse
-- locations are radius-filtered; manual area preferences use broad area text.
-- Legacy/area-only meetup rows remain visible as a compatibility fallback and
-- are ordered after location-grounded matches rather than falsely assigned miles.
create or replace function public.ari_circle_list_meetups(
  requested_activity text default null,
  requested_window text default 'upcoming',
  result_limit integer default 30
)
returns table(
  meetup_id uuid,
  title text,
  activity text,
  description text,
  area text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_participants smallint,
  host_user_id uuid,
  host_display_name text,
  host_handle text,
  host_avatar_url text,
  participant_count bigint,
  viewer_joined boolean,
  viewer_completed boolean,
  viewer_is_host boolean,
  participant_xp smallint,
  host_total_xp integer,
  host_leadership_tier text,
  join_mode text,
  viewer_request_status text,
  pending_request_count bigint
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity,''))), '');
  cap integer := greatest(1, least(coalesce(result_limit,30),50));
  search_location private.ari_circle_search_locations%rowtype;
begin
  perform public.ari_circle_assert_adult_access();

  select * into search_location
  from private.ari_circle_search_locations s
  where s.user_id = caller_id;

  return query
  with candidates as (
    select
      m.id,
      m.title,
      m.activity,
      m.description,
      m.area,
      m.starts_at,
      m.ends_at,
      m.max_participants,
      m.host_user_id,
      cp.display_name as host_display_name,
      cp.handle::text as host_handle,
      cp.avatar_url as host_avatar_url,
      (select count(*) from public.ari_circle_meetup_participants pc where pc.meetup_id=m.id and pc.status='joined') as participant_count,
      exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.status='joined') as viewer_joined,
      exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.completed_at is not null) as viewer_completed,
      (m.host_user_id = caller_id) as viewer_is_host,
      m.participant_xp,
      coalesce((select sum(x.xp_amount)::integer from public.ari_circle_xp_events x where x.user_id=m.host_user_id),0) as host_total_xp,
      public.ari_circle_leadership_tier(m.host_user_id) as host_leadership_tier,
      m.join_mode,
      (select r.status from public.ari_circle_meetup_requests r where r.meetup_id=m.id and r.user_id=caller_id) as viewer_request_status,
      case when m.host_user_id=caller_id then (
        select count(*) from public.ari_circle_meetup_requests r
        where r.meetup_id=m.id and r.status in ('pending','waitlisted')
      ) else 0 end as pending_request_count,
      case
        when search_location.approximate_latitude is not null
         and m.approximate_latitude is not null
        then 3958.7613 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(sin(radians((m.approximate_latitude - search_location.approximate_latitude)::double precision) / 2.0), 2)
              + cos(radians(search_location.approximate_latitude::double precision))
                * cos(radians(m.approximate_latitude::double precision))
                * power(sin(radians((m.approximate_longitude - search_location.approximate_longitude)::double precision) / 2.0), 2)
            )
          )
        )
        else null::double precision
      end as distance_value,
      case
        when search_location.area_label is not null and (
          lower(m.area) like '%' || lower(search_location.area_label) || '%'
          or lower(search_location.area_label) like '%' || lower(m.area) || '%'
        ) then true else false
      end as area_matches
    from public.ari_circle_meetups m
    join public.ari_circle_profiles cp on cp.user_id = m.host_user_id
    where m.status='scheduled'
      and (
        m.ends_at > now()
        or (
          m.ends_at > now() - interval '48 hours'
          and exists (
            select 1 from public.ari_circle_meetup_participants mine
            where mine.meetup_id=m.id and mine.user_id=caller_id and mine.status='joined'
          )
        )
      )
      and (clean_activity is null or m.activity=clean_activity)
      and public.ari_circle_user_is_adult(m.host_user_id)
      and not public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id)
      and (
        m.ends_at <= now()
        or requested_window not in ('today','weekend')
        or (requested_window='today' and m.starts_at < date_trunc('day',now()) + interval '1 day')
        or (requested_window='weekend' and extract(isodow from m.starts_at) in (6,7))
      )
  )
  select
    c.id, c.title, c.activity, c.description, c.area, c.starts_at, c.ends_at,
    c.max_participants, c.host_user_id, c.host_display_name, c.host_handle,
    c.host_avatar_url, c.participant_count, c.viewer_joined, c.viewer_completed,
    c.viewer_is_host, c.participant_xp, c.host_total_xp, c.host_leadership_tier,
    c.join_mode, c.viewer_request_status, c.pending_request_count
  from candidates c
  where
    search_location.user_id is null
    or c.viewer_joined
    or c.viewer_is_host
    or (
      c.distance_value is not null
      and c.distance_value <= search_location.radius_miles::double precision
    )
    or (
      c.distance_value is null
      and (
        search_location.area_label is null
        or c.area_matches
        or search_location.source = 'current_location'
      )
    )
  order by
    case when c.ends_at <= now() and c.viewer_joined and not c.viewer_completed then 0 else 1 end,
    case
      when c.distance_value is not null and c.distance_value <= search_location.radius_miles::double precision then 0
      when c.area_matches then 1
      else 2
    end,
    c.distance_value asc nulls last,
    c.starts_at asc
  limit cap;
end;
$function$;

-- Reassert the existing public API grants after function replacement.
revoke all on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) from public, anon, authenticated;
revoke all on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer) from public, anon, authenticated;
revoke all on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text) from public, anon, authenticated;
revoke all on function public.ari_circle_list_meetups(text,text,integer) from public, anon, authenticated;
grant execute on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) to authenticated, service_role;
grant execute on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer) to authenticated, service_role;
grant execute on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text) to authenticated, service_role;
grant execute on function public.ari_circle_list_meetups(text,text,integer) to authenticated, service_role;

commit;
