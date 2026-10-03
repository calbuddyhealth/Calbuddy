-- ARI Circle Hiking Discovery Radius V1
-- Hiking destinations are commonly farther away than everyday social activities.
-- Keep the member's configured Circle radius for normal meetups, but allow
-- hiking meetups with public destination anchors to be discovered up to 100 mi.
-- No public return shape or RPC signature changes.

begin;

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
  hiking_discovery_radius_miles constant double precision := 100.0;
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
      and c.distance_value <= case
        when c.activity = 'hiking' then greatest(
          coalesce(search_location.radius_miles, 25)::double precision,
          hiking_discovery_radius_miles
        )
        else coalesce(search_location.radius_miles, 25)::double precision
      end
    )
  order by
    case when c.ends_at <= now() and c.viewer_joined and not c.viewer_completed then 0 else 1 end,
    case
      when c.distance_value is not null
       and c.distance_value <= case
         when c.activity = 'hiking' then greatest(
           coalesce(search_location.radius_miles, 25)::double precision,
           hiking_discovery_radius_miles
         )
         else coalesce(search_location.radius_miles, 25)::double precision
       end then 0
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

comment on function public.ari_circle_list_meetups(text,text,integer) is
  'Privacy-preserving Circle meetup discovery. Hiking meetups may use a 100-mile minimum discovery radius when destination coordinates exist; other activities keep the member-selected Circle radius.';

commit;
