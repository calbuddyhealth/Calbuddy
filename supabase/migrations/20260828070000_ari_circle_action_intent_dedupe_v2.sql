-- ARI Circle Action Intent V2 — duplicate-safe creation.
-- Repeated taps / repeated equivalent Ask Ari submissions should resolve to the
-- already-active private intent instead of creating another matched-plan card.

begin;

create or replace function public.ari_circle_create_action_intent(
  requested_activity text,
  requested_time_window_start timestamptz,
  requested_time_window_end timestamptz,
  requested_experience_level text default 'any'::text,
  requested_intensity text default 'any'::text,
  requested_group_min integer default 1,
  requested_group_max integer default 8,
  requested_area text default null::text,
  requested_radius_miles integer default 25,
  requested_note text default null::text,
  requested_latitude numeric default null,
  requested_longitude numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
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
  end if;

  -- Treat a near-identical active request as the same user intent. The 15-minute
  -- tolerance covers repeated taps and free-text resubmissions whose rolling
  -- "next few hours" window moves by seconds, while still allowing a genuinely
  -- different time request to create another intent.
  select i.id
    into result_id
  from public.ari_circle_action_intents i
  where i.user_id = caller_id
    and i.status = 'active'
    and i.expires_at > now()
    and i.activity = clean_activity
    and i.experience_level = clean_experience
    and i.intensity = clean_intensity
    and i.desired_group_min = safe_group_min
    and i.desired_group_max = safe_group_max
    and i.area is not distinct from clean_area
    and i.approximate_latitude is not distinct from safe_lat
    and i.approximate_longitude is not distinct from safe_lon
    and i.radius_miles = safe_radius
    and i.note is not distinct from clean_note
    and abs(extract(epoch from (i.time_window_start - requested_time_window_start))) <= 900
    and abs(extract(epoch from (i.time_window_end - requested_time_window_end))) <= 900
  order by i.created_at desc
  limit 1;

  if result_id is not null then
    return result_id;
  end if;

  insert into public.ari_circle_action_intents (
    user_id,
    activity,
    experience_level,
    intensity,
    desired_group_min,
    desired_group_max,
    area,
    approximate_latitude,
    approximate_longitude,
    radius_miles,
    time_window_start,
    time_window_end,
    note,
    status,
    expires_at
  ) values (
    caller_id,
    clean_activity,
    clean_experience,
    clean_intensity,
    safe_group_min,
    safe_group_max,
    clean_area,
    safe_lat,
    safe_lon,
    safe_radius,
    requested_time_window_start,
    requested_time_window_end,
    clean_note,
    'active',
    requested_time_window_end
  )
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) from public, anon;
grant execute on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) to authenticated, service_role;

commit;
