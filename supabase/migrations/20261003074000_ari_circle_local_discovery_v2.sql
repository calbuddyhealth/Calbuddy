-- ARI Circle Local Discovery V2
-- Treat the host's current Circle search area as the meetup's discovery market,
-- while still matching the meetup's typed public area and coarse distance.
-- The public meetup area remains display-only context; discovery_area is not
-- returned by the canonical list RPC.

begin;

alter table public.ari_circle_meetups
  add column if not exists discovery_area text;

update public.ari_circle_meetups
set discovery_area = area
where discovery_area is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_discovery_area_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_discovery_area_check
      check (
        discovery_area is null
        or char_length(btrim(discovery_area)) between 2 and 100
      );
  end if;
end $$;

create index if not exists ari_circle_meetups_discovery_area_starts_idx
  on public.ari_circle_meetups (lower(discovery_area), starts_at)
  where status = 'scheduled';

comment on column public.ari_circle_meetups.discovery_area is
  'Private discovery market copied from the host Circle search area at publish time; not returned by meetup list RPCs.';

-- Keep the five-active-meetup protection and 60-day scheduling window, but
-- anchor new meetups to the host's current Circle discovery market. Hosts who
-- are organizing in another city should change their Connect search area first.
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
  safe_discovery_area text := null;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to host a meetup'; end if;
  if char_length(clean_title) < 3 or char_length(clean_title) > 90 then raise exception 'Meetup title must be 3-90 characters'; end if;
  if clean_activity not in ('walking','gym','running','hiking','sports','cycling','yoga','coffee','food','community','volunteer','other') then raise exception 'Unsupported meetup activity'; end if;
  if char_length(clean_area) < 2 or char_length(clean_area) > 100 then raise exception 'Use a broad city or area'; end if;
  if clean_join_mode not in ('instant','approval') then raise exception 'Unsupported joining mode'; end if;
  if requested_starts_at is null or requested_starts_at < now() + interval '10 minutes' then raise exception 'Meetup must start at least 10 minutes from now'; end if;
  if requested_starts_at > now() + interval '60 days' then raise exception 'Meetup is too far in the future'; end if;

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

  safe_discovery_area := coalesce(
    nullif(btrim(search_location.area_label), ''),
    clean_area
  );

  -- A host's current Circle search origin is coarse and already privacy-rounded.
  -- It represents the market where the event is being published. The typed
  -- public area can be a venue/neighborhood such as "AMC Mission Valley".
  if search_location.approximate_latitude is not null
     and search_location.approximate_longitude is not null then
    safe_lat := search_location.approximate_latitude;
    safe_lon := search_location.approximate_longitude;
  end if;

  insert into public.ari_circle_meetups (
    host_user_id, title, activity, description, area, discovery_area,
    starts_at, ends_at, max_participants, join_mode,
    approximate_latitude, approximate_longitude
  ) values (
    caller_id, clean_title, clean_activity,
    nullif(btrim(coalesce(requested_description,'')),''),
    clean_area, safe_discovery_area,
    requested_starts_at,
    requested_starts_at + make_interval(mins => duration_minutes),
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

-- Hybrid discovery rules:
--   1) always keep meetups the viewer hosts or joined;
--   2) show meetups within the viewer's selected radius when coarse coordinates exist;
--   3) also show meetups in the same discovery market / typed public area;
--   4) rank radius matches before broader same-area matches.
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
         and m.approximate_latitude is not null
         and m.approximate_longitude is not null
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
      and c.distance_value <= search_location.radius_miles::double precision
    )
  order by
    case when c.ends_at <= now() and c.viewer_joined and not c.viewer_completed then 0 else 1 end,
    case
      when c.distance_value is not null
       and c.distance_value <= search_location.radius_miles::double precision then 0
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
