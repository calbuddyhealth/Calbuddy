alter table public.ari_circle_partner_intents
  add column if not exists approximate_latitude numeric(6,2),
  add column if not exists approximate_longitude numeric(7,2),
  add column if not exists location_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_partner_intents'::regclass
      and conname = 'ari_circle_partner_intents_approx_latitude_check'
  ) then
    alter table public.ari_circle_partner_intents
      add constraint ari_circle_partner_intents_approx_latitude_check
      check (approximate_latitude is null or approximate_latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_partner_intents'::regclass
      and conname = 'ari_circle_partner_intents_approx_longitude_check'
  ) then
    alter table public.ari_circle_partner_intents
      add constraint ari_circle_partner_intents_approx_longitude_check
      check (approximate_longitude is null or approximate_longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_partner_intents'::regclass
      and conname = 'ari_circle_partner_intents_location_pair_check'
  ) then
    alter table public.ari_circle_partner_intents
      add constraint ari_circle_partner_intents_location_pair_check
      check ((approximate_latitude is null) = (approximate_longitude is null));
  end if;
end $$;

create index if not exists ari_circle_partner_intents_lat_active_idx
  on public.ari_circle_partner_intents (approximate_latitude)
  where status = 'looking' and approximate_latitude is not null;

create index if not exists ari_circle_partner_intents_lon_active_idx
  on public.ari_circle_partner_intents (approximate_longitude)
  where status = 'looking' and approximate_longitude is not null;

create or replace function public.ari_circle_set_my_partner_location_v1(
  requested_latitude numeric,
  requested_longitude numeric
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_dob date;
  caller_band text;
  safe_lat numeric(6,2);
  safe_lon numeric(7,2);
  changed integer := 0;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select s.date_of_birth into caller_dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  caller_band := public.ari_circle_age_band_for_date(caller_dob);
  if caller_band <> 'adult' then
    raise exception 'Location-based Buddies is only available to adults';
  end if;

  if requested_latitude is null or requested_longitude is null
     or requested_latitude < -90 or requested_latitude > 90
     or requested_longitude < -180 or requested_longitude > 180 then
    raise exception 'A valid approximate location is required';
  end if;

  safe_lat := round(requested_latitude, 2);
  safe_lon := round(requested_longitude, 2);

  update public.ari_circle_partner_intents i
  set approximate_latitude = safe_lat,
      approximate_longitude = safe_lon,
      location_updated_at = now(),
      updated_at = now()
  where i.user_id = caller_id
    and i.status = 'looking'
    and i.expires_at > now();

  get diagnostics changed = row_count;
  return changed;
end;
$function$;

create or replace function public.ari_circle_upsert_partner_intent_v2(
  requested_activity text,
  requested_mode text,
  requested_experience_level text,
  requested_area text,
  requested_time_preferences text[],
  requested_note text default null::text,
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
  dob date;
  band text;
  clean_activity text := lower(btrim(coalesce(requested_activity,'')));
  clean_mode text := lower(btrim(coalesce(requested_mode,'one_on_one')));
  clean_experience text := lower(btrim(coalesce(requested_experience_level,'any')));
  clean_area text := btrim(coalesce(requested_area,''));
  clean_note text := nullif(btrim(coalesce(requested_note,'')), '');
  clean_times text[] := coalesce(requested_time_preferences, '{}');
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
  result_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select s.date_of_birth into dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then raise exception 'Verify your age before using Buddies'; end if;

  if clean_activity not in (
    'gym','hiking','running','cycling','sports','walking','accountability',
    'coffee','food','movies','gaming','events','concerts','drinks','other'
  ) then raise exception 'Unsupported Buddy activity'; end if;

  if band = 'teen' and clean_activity = 'drinks' then
    raise exception 'Drinks discovery is only available to adults';
  end if;

  if clean_mode not in ('one_on_one','group','accountability') then
    raise exception 'Unsupported Buddy mode';
  end if;

  if band = 'teen' and clean_mode = 'one_on_one' then
    raise exception 'Teen Buddies supports group activities and accountability only';
  end if;

  if clean_experience not in ('beginner','intermediate','advanced','any') then
    raise exception 'Unsupported experience level';
  end if;

  if char_length(clean_area) < 2 or char_length(clean_area) > 80 then
    raise exception 'Use a general city or area';
  end if;

  if band = 'teen' and clean_area ~ '[0-9]' then
    raise exception 'Teen Buddies only allows a general city or area, not an address';
  end if;

  if clean_note is not null and char_length(clean_note) > 280 then
    raise exception 'Buddy note is too long';
  end if;

  if band = 'teen' and clean_note is not null and (
    clean_note ~* '(https?://|www\\.|@[a-z0-9_.-]{2,})'
    or clean_note ~ '[0-9][0-9 ()+.-]{6,}[0-9]'
  ) then
    raise exception 'Teen Buddies does not allow contact details or external handles in public notes';
  end if;

  if exists (
    select 1 from unnest(clean_times) as t(value)
    where value not in ('morning','afternoon','evening','weekdays','weekends','flexible')
  ) then raise exception 'Unsupported time preference'; end if;

  if band = 'adult' and (requested_latitude is not null or requested_longitude is not null) then
    if requested_latitude is null or requested_longitude is null
       or requested_latitude < -90 or requested_latitude > 90
       or requested_longitude < -180 or requested_longitude > 180 then
      raise exception 'A valid approximate location is required';
    end if;
    safe_lat := round(requested_latitude, 2);
    safe_lon := round(requested_longitude, 2);
  end if;

  insert into public.ari_circle_partner_intents (
    user_id,activity,mode,experience_level,area,time_preferences,note,status,expires_at,
    approximate_latitude,approximate_longitude,location_updated_at
  ) values (
    caller_id,clean_activity,clean_mode,clean_experience,clean_area,clean_times,clean_note,
    'looking',now()+interval '30 days',safe_lat,safe_lon,
    case when safe_lat is not null then now() else null end
  )
  on conflict (user_id, activity) do update
  set mode=excluded.mode,
      experience_level=excluded.experience_level,
      area=excluded.area,
      time_preferences=excluded.time_preferences,
      note=excluded.note,
      status='looking',
      expires_at=now()+interval '30 days',
      approximate_latitude=coalesce(excluded.approximate_latitude, public.ari_circle_partner_intents.approximate_latitude),
      approximate_longitude=coalesce(excluded.approximate_longitude, public.ari_circle_partner_intents.approximate_longitude),
      location_updated_at=case
        when excluded.approximate_latitude is not null then now()
        else public.ari_circle_partner_intents.location_updated_at
      end,
      updated_at=now()
  returning id into result_id;

  return result_id;
end;
$function$;

create or replace function public.ari_circle_find_partners_v2(
  requested_activity text default null::text,
  requested_area text default null::text,
  requested_latitude numeric default null,
  requested_longitude numeric default null,
  requested_radius_miles integer default 25,
  result_limit integer default 40
)
returns table(
  intent_id uuid,
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  bio text,
  activity text,
  mode text,
  experience_level text,
  area text,
  time_preferences text[],
  note text,
  updated_at timestamptz,
  distance_miles numeric
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_dob date;
  caller_band text;
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity,''))), '');
  clean_area text := nullif(lower(btrim(coalesce(requested_area,''))), '');
  safe_limit integer := least(greatest(coalesce(result_limit,40),1),60);
  safe_radius integer := case when requested_radius_miles in (25,50,100) then requested_radius_miles else 25 end;
  safe_lat numeric(6,2) := null;
  safe_lon numeric(7,2) := null;
  has_location boolean := false;
  lat_delta double precision := 0;
  lon_delta double precision := 0;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select s.date_of_birth into caller_dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  caller_band := public.ari_circle_age_band_for_date(caller_dob);
  if caller_band not in ('teen','adult') then
    raise exception 'Verify your age before using Buddies';
  end if;

  if caller_band = 'teen' then
    clean_area := null;
  elsif requested_latitude is not null or requested_longitude is not null then
    if requested_latitude is null or requested_longitude is null
       or requested_latitude < -90 or requested_latitude > 90
       or requested_longitude < -180 or requested_longitude > 180 then
      raise exception 'A valid approximate location is required';
    end if;
    safe_lat := round(requested_latitude, 2);
    safe_lon := round(requested_longitude, 2);
    has_location := true;
    lat_delta := safe_radius::double precision / 69.0;
    lon_delta := safe_radius::double precision /
      (69.0 * greatest(abs(cos(radians(safe_lat::double precision))), 0.10));
  end if;

  return query
  with candidates as (
    select
      i.id as intent_id,
      i.user_id,
      p.display_name,
      p.handle::text as handle,
      p.avatar_url,
      p.bio,
      i.activity,
      i.mode,
      i.experience_level,
      case when caller_band='teen' then 'Teen Circle'::text else i.area end as area,
      i.time_preferences,
      i.note,
      i.updated_at,
      case
        when has_location
         and i.approximate_latitude is not null
         and i.approximate_longitude is not null
        then 3958.7613 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(sin(radians((i.approximate_latitude - safe_lat)::double precision) / 2.0), 2)
              + cos(radians(safe_lat::double precision))
                * cos(radians(i.approximate_latitude::double precision))
                * power(sin(radians((i.approximate_longitude - safe_lon)::double precision) / 2.0), 2)
            )
          )
        )
        else null
      end as raw_distance
    from public.ari_circle_partner_intents i
    join public.ari_circle_profiles p on p.user_id=i.user_id
    join public.ari_account_state s on s.user_id=i.user_id
    where i.user_id<>caller_id
      and i.status='looking'
      and i.expires_at>now()
      and public.ari_circle_age_band_for_date(s.date_of_birth)=caller_band
      and (caller_band<>'teen' or i.mode in ('group','accountability'))
      and (caller_band<>'teen' or i.activity<>'drinks')
      and (clean_activity is null or i.activity=clean_activity)
      and not public.ari_circle_social_pair_is_blocked(caller_id,i.user_id)
      and (
        caller_band='teen'
        or not has_location
        or (
          (
            i.approximate_latitude between safe_lat::double precision-lat_delta and safe_lat::double precision+lat_delta
            and i.approximate_longitude between safe_lon::double precision-lon_delta and safe_lon::double precision+lon_delta
          )
          or (
            i.approximate_latitude is null
            and clean_area is not null
            and lower(i.area) like '%'||clean_area||'%'
          )
        )
      )
      and (
        has_location
        or clean_area is null
        or lower(i.area) like '%'||clean_area||'%'
      )
  ), filtered as (
    select * from candidates c
    where not has_location
       or c.raw_distance is null
       or c.raw_distance <= safe_radius::double precision
  )
  select
    f.intent_id,
    f.user_id,
    f.display_name,
    f.handle,
    f.avatar_url,
    f.bio,
    f.activity,
    f.mode,
    f.experience_level,
    f.area,
    f.time_preferences,
    f.note,
    f.updated_at,
    case when caller_band='adult' and f.raw_distance is not null then round(f.raw_distance::numeric,1) else null end
  from filtered f
  order by
    case when f.raw_distance is null then 1 else 0 end,
    f.raw_distance asc nulls last,
    f.updated_at desc
  limit safe_limit;
end;
$function$;

revoke all on function public.ari_circle_set_my_partner_location_v1(numeric,numeric) from public, anon;
revoke all on function public.ari_circle_upsert_partner_intent_v2(text,text,text,text,text[],text,numeric,numeric) from public, anon;
revoke all on function public.ari_circle_find_partners_v2(text,text,numeric,numeric,integer,integer) from public, anon;
grant execute on function public.ari_circle_set_my_partner_location_v1(numeric,numeric) to authenticated;
grant execute on function public.ari_circle_upsert_partner_intent_v2(text,text,text,text,text[],text,numeric,numeric) to authenticated;
grant execute on function public.ari_circle_find_partners_v2(text,text,numeric,numeric,integer,integer) to authenticated;
