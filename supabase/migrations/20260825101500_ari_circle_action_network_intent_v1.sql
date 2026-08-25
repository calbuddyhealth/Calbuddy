-- ARI Circle Action Network V6 — Action Intent V1
-- Private, expiring statements of what the current adult user is open to doing.
-- Intents are matching inputs, not public profiles and not XP-bearing actions.

begin;

create table if not exists public.ari_circle_action_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity text not null check (activity in (
    'any','walking','gym','running','hiking','sports','cycling','yoga',
    'coffee','food','community','volunteer','wellness','outdoor','other'
  )),
  experience_level text not null default 'any' check (experience_level in (
    'any','beginner','intermediate','advanced'
  )),
  intensity text not null default 'any' check (intensity in (
    'any','easy','moderate','hard'
  )),
  desired_group_min smallint not null default 1 check (desired_group_min between 1 and 50),
  desired_group_max smallint not null default 8 check (desired_group_max between 1 and 50),
  area text,
  approximate_latitude numeric(6,2),
  approximate_longitude numeric(7,2),
  radius_miles smallint not null default 25 check (radius_miles in (5,10,25,50,100)),
  time_window_start timestamptz not null,
  time_window_end timestamptz not null,
  note text,
  status text not null default 'active' check (status in ('active','fulfilled','cancelled','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint ari_circle_action_intents_group_range_check
    check (desired_group_max >= desired_group_min),
  constraint ari_circle_action_intents_time_window_check
    check (time_window_end > time_window_start),
  constraint ari_circle_action_intents_location_pair_check
    check ((approximate_latitude is null) = (approximate_longitude is null)),
  constraint ari_circle_action_intents_latitude_check
    check (approximate_latitude is null or approximate_latitude between -90 and 90),
  constraint ari_circle_action_intents_longitude_check
    check (approximate_longitude is null or approximate_longitude between -180 and 180),
  constraint ari_circle_action_intents_area_check
    check (area is null or char_length(btrim(area)) between 2 and 100),
  constraint ari_circle_action_intents_note_check
    check (note is null or char_length(note) <= 280)
);

create index if not exists ari_circle_action_intents_user_active_idx
  on public.ari_circle_action_intents(user_id, time_window_start, expires_at)
  where status = 'active';

create index if not exists ari_circle_action_intents_activity_active_idx
  on public.ari_circle_action_intents(activity, time_window_start, expires_at)
  where status = 'active';

create index if not exists ari_circle_action_intents_lat_active_idx
  on public.ari_circle_action_intents(approximate_latitude)
  where status = 'active' and approximate_latitude is not null;

create index if not exists ari_circle_action_intents_lon_active_idx
  on public.ari_circle_action_intents(approximate_longitude)
  where status = 'active' and approximate_longitude is not null;

alter table public.ari_circle_action_intents enable row level security;
revoke all on table public.ari_circle_action_intents from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_action_intents to service_role;

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
    -- Deliberately coarse. Intent coordinates are matching inputs and are never
    -- a substitute for the accepted-only exact Meetup Room meeting point.
    safe_lat := round(requested_latitude, 2);
    safe_lon := round(requested_longitude, 2);
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

create or replace function public.ari_circle_list_my_action_intents(
  include_inactive boolean default false,
  result_limit integer default 20
)
returns table(
  intent_id uuid,
  activity text,
  experience_level text,
  intensity text,
  desired_group_min smallint,
  desired_group_max smallint,
  area text,
  approximate_latitude numeric,
  approximate_longitude numeric,
  radius_miles smallint,
  time_window_start timestamptz,
  time_window_end timestamptz,
  note text,
  status text,
  effective_status text,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  perform public.ari_circle_assert_adult_access();

  return query
  select
    i.id,
    i.activity,
    i.experience_level,
    i.intensity,
    i.desired_group_min,
    i.desired_group_max,
    i.area,
    i.approximate_latitude,
    i.approximate_longitude,
    i.radius_miles,
    i.time_window_start,
    i.time_window_end,
    i.note,
    i.status,
    case
      when i.status = 'active' and i.expires_at <= now() then 'expired'
      else i.status
    end::text,
    i.created_at,
    i.updated_at,
    i.expires_at
  from public.ari_circle_action_intents i
  where i.user_id = caller_id
    and (
      include_inactive
      or (i.status = 'active' and i.expires_at > now())
    )
  order by
    case when i.status = 'active' and i.expires_at > now() then 0 else 1 end,
    i.time_window_start asc,
    i.created_at desc
  limit cap;
end;
$$;

create or replace function public.ari_circle_cancel_action_intent(
  requested_intent_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  changed integer := 0;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_intent_id is null then
    raise exception 'Action intent is required';
  end if;

  update public.ari_circle_action_intents i
  set status = 'cancelled',
      updated_at = now()
  where i.id = requested_intent_id
    and i.user_id = caller_id
    and i.status = 'active';

  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) from public, anon;
revoke all on function public.ari_circle_list_my_action_intents(boolean,integer) from public, anon;
revoke all on function public.ari_circle_cancel_action_intent(uuid) from public, anon;

grant execute on function public.ari_circle_create_action_intent(text,timestamptz,timestamptz,text,text,integer,integer,text,integer,text,numeric,numeric) to authenticated, service_role;
grant execute on function public.ari_circle_list_my_action_intents(boolean,integer) to authenticated, service_role;
grant execute on function public.ari_circle_cancel_action_intent(uuid) to authenticated, service_role;

commit;
