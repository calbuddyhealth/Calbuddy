-- ARI Circle Hiking Destination Search V1
-- Store a public hiking destination separately from the host's private/coarse search origin.
-- Hiking discovery uses the selected destination for mileage and allows a wider 100-mile day-trip radius.

begin;

alter table public.ari_circle_meetups
  add column if not exists destination_label text,
  add column if not exists destination_latitude numeric(6,3),
  add column if not exists destination_longitude numeric(7,3),
  add column if not exists destination_source text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_destination_label_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_destination_label_check
      check (destination_label is null or char_length(btrim(destination_label)) between 2 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_destination_lat_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_destination_lat_check
      check (destination_latitude is null or destination_latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_destination_lon_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_destination_lon_check
      check (destination_longitude is null or destination_longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_destination_pair_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_destination_pair_check
      check ((destination_latitude is null) = (destination_longitude is null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_destination_complete_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_destination_complete_check
      check (
        (destination_label is null and destination_latitude is null and destination_longitude is null)
        or (destination_label is not null and destination_latitude is not null and destination_longitude is not null)
      );
  end if;
end $$;

comment on column public.ari_circle_meetups.destination_label is
  'Public trail/place label selected by the host for destination activities such as hiking.';
comment on column public.ari_circle_meetups.destination_latitude is
  'Public destination latitude rounded to 3 decimals; never a member home/device coordinate.';
comment on column public.ari_circle_meetups.destination_longitude is
  'Public destination longitude rounded to 3 decimals; never a member home/device coordinate.';

create or replace function public.ari_circle_set_meetup_destination(
  requested_meetup_id uuid,
  requested_destination_label text default null,
  requested_destination_latitude numeric default null,
  requested_destination_longitude numeric default null,
  requested_destination_source text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  meetup_row public.ari_circle_meetups%rowtype;
  clean_label text := nullif(btrim(coalesce(requested_destination_label,'')), '');
  clean_source text := nullif(lower(btrim(coalesce(requested_destination_source,''))), '');
  safe_lat numeric(6,3) := null;
  safe_lon numeric(7,3) := null;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to manage a meetup destination'; end if;

  select * into meetup_row
  from public.ari_circle_meetups
  where id = requested_meetup_id
  for update;

  if not found or meetup_row.status <> 'scheduled' then raise exception 'Meetup unavailable'; end if;
  if meetup_row.host_user_id <> caller_id then raise exception 'Only the host can change the meetup destination'; end if;
  if meetup_row.starts_at <= now() then raise exception 'Meetup destinations cannot be changed after the meetup starts'; end if;

  if clean_label is null then
    update public.ari_circle_meetups
    set destination_label = null,
        destination_latitude = null,
        destination_longitude = null,
        destination_source = null,
        updated_at = now()
    where id = requested_meetup_id;
    return true;
  end if;

  if meetup_row.activity <> 'hiking' then
    raise exception 'Trail destination search is available for hiking meetups';
  end if;
  if char_length(clean_label) < 2 or char_length(clean_label) > 180 then
    raise exception 'Choose a valid hiking destination';
  end if;
  if requested_destination_latitude is null or requested_destination_longitude is null
     or requested_destination_latitude < -90 or requested_destination_latitude > 90
     or requested_destination_longitude < -180 or requested_destination_longitude > 180 then
    raise exception 'A valid hiking destination is required';
  end if;

  safe_lat := round(requested_destination_latitude, 3);
  safe_lon := round(requested_destination_longitude, 3);

  update public.ari_circle_meetups
  set destination_label = clean_label,
      destination_latitude = safe_lat,
      destination_longitude = safe_lon,
      destination_source = left(coalesce(clean_source, 'place_search'), 40),
      updated_at = now()
  where id = requested_meetup_id;

  return true;
end;
$function$;

revoke all on function public.ari_circle_set_meetup_destination(uuid,text,numeric,numeric,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_set_meetup_destination(uuid,text,numeric,numeric,text)
  to authenticated, service_role;

-- Destination-aware meetup discovery. Hiking uses the selected public destination
-- for mileage and expands the effective discovery radius to at least 100 miles.
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
         and search_location.approximate_longitude is not null
         and (
           case when m.activity='hiking' and m.destination_latitude is not null
             then m.destination_latitude else m.approximate_latitude end
         ) is not null
         and (
           case when m.activity='hiking' and m.destination_longitude is not null
             then m.destination_longitude else m.approximate_longitude end
         ) is not null
        then 3958.7613 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(sin(radians(((case when m.activity='hiking' and m.destination_latitude is not null then m.destination_latitude else m.approximate_latitude end) - search_location.approximate_latitude)::double precision) / 2.0), 2)
              + cos(radians(search_location.approximate_latitude::double precision))
                * cos(radians((case when m.activity='hiking' and m.destination_latitude is not null then m.destination_latitude else m.approximate_latitude end)::double precision))
                * power(sin(radians(((case when m.activity='hiking' and m.destination_longitude is not null then m.destination_longitude else m.approximate_longitude end) - search_location.approximate_longitude)::double precision) / 2.0), 2)
            )
          )
        )
        else null::double precision
      end as distance_value,
      case
        when search_location.area_label is null then false
        when (
          regexp_replace(lower(coalesce(m.discovery_area,'')), '[^a-z0-9]+', ' ', 'g') like
            '%' || regexp_replace(lower(search_location.area_label), '[^a-z0-9]+', ' ', 'g') || '%'
          or regexp_replace(lower(search_location.area_label), '[^a-z0-9]+', ' ', 'g') like
            '%' || regexp_replace(lower(coalesce(m.discovery_area,'')), '[^a-z0-9]+', ' ', 'g') || '%'
          or regexp_replace(lower(m.area), '[^a-z0-9]+', ' ', 'g') like
            '%' || regexp_replace(lower(search_location.area_label), '[^a-z0-9]+', ' ', 'g') || '%'
          or regexp_replace(lower(search_location.area_label), '[^a-z0-9]+', ' ', 'g') like
            '%' || regexp_replace(lower(m.area), '[^a-z0-9]+', ' ', 'g') || '%'
          or regexp_replace(lower(coalesce(m.destination_label,'')), '[^a-z0-9]+', ' ', 'g') like
            '%' || regexp_replace(lower(search_location.area_label), '[^a-z0-9]+', ' ', 'g') || '%'
        ) then true
        else false
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
    c.id,
    c.title,
    c.activity,
    c.description,
    c.area,
    c.starts_at,
    c.ends_at,
    c.max_participants,
    c.host_user_id,
    c.host_display_name,
    c.host_handle,
    c.host_avatar_url,
    c.participant_count,
    c.viewer_joined,
    c.viewer_completed,
    c.viewer_is_host,
    c.participant_xp,
    c.host_total_xp,
    c.host_leadership_tier,
    c.join_mode,
    c.viewer_request_status,
    c.pending_request_count
  from candidates c
  where
    search_location.user_id is null
    or c.viewer_joined
    or c.viewer_is_host
    or c.area_matches
    or (
      c.distance_value is not null
      and c.distance_value <= (
        case when c.activity='hiking'
          then greatest(search_location.radius_miles::double precision, 100.0)
          else search_location.radius_miles::double precision
        end
      )
    )
  order by
    case when c.ends_at <= now() and c.viewer_joined and not c.viewer_completed then 0 else 1 end,
    case
      when c.distance_value is not null
       and c.distance_value <= (
         case when c.activity='hiking'
           then greatest(search_location.radius_miles::double precision, 100.0)
           else search_location.radius_miles::double precision
         end
       ) then 0
      when c.area_matches then 1
      else 2
    end,
    c.distance_value asc nulls last,
    c.starts_at asc
  limit cap;
end;
$function$;

revoke all on function public.ari_circle_list_meetups(text,text,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_meetups(text,text,integer)
  to authenticated, service_role;

commit;
