-- ARI Circle Find Friends Local V1 hardening
-- Prevent blank candidate area strings from matching every viewer area.

begin;

create or replace function public.ari_circle_find_friends_v1(
  search_text text default null,
  result_limit integer default 80
)
returns table (
  user_id uuid,
  display_name text,
  handle text,
  bio text,
  avatar_url text,
  profile_location text,
  distance_miles numeric,
  mutual_count integer,
  is_nearby boolean,
  is_suggested boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_query text := lower(regexp_replace(coalesce(nullif(btrim(search_text), ''), ''), '^@+', ''));
  safe_limit integer := least(greatest(coalesce(result_limit, 80), 1), 100);
  viewer_area text;
  viewer_lat numeric;
  viewer_lon numeric;
  viewer_radius integer := 25;
begin
  perform public.ari_circle_assert_adult_access();

  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select
    nullif(btrim(s.area_label), ''),
    s.approximate_latitude,
    s.approximate_longitude,
    case when s.radius_miles in (5,10,25,50,100) then s.radius_miles::integer else 25 end
  into
    viewer_area,
    viewer_lat,
    viewer_lon,
    viewer_radius
  from private.ari_circle_search_locations s
  where s.user_id = caller_id;

  if viewer_area is null then
    select nullif(btrim(p.location), '')
    into viewer_area
    from public.ari_circle_profiles p
    where p.user_id = caller_id;
  end if;

  return query
  with viewer_friends as (
    select distinct
      case
        when c.requester_user_id = caller_id then c.addressee_user_id
        else c.requester_user_id
      end as friend_id
    from public.ari_circle_connections c
    where c.status = 'accepted'
      and (c.requester_user_id = caller_id or c.addressee_user_id = caller_id)
  ),
  candidates as (
    select
      p.user_id,
      p.display_name,
      p.handle::text as handle,
      p.bio,
      p.avatar_url,
      p.location as profile_location,
      s.area_label as private_area,
      s.approximate_latitude as candidate_lat,
      s.approximate_longitude as candidate_lon,
      (
        select count(*)::integer
        from viewer_friends vf
        where exists (
          select 1
          from public.ari_circle_connections mc
          where mc.status = 'accepted'
            and (
              (mc.requester_user_id = vf.friend_id and mc.addressee_user_id = p.user_id)
              or
              (mc.requester_user_id = p.user_id and mc.addressee_user_id = vf.friend_id)
            )
        )
      ) as mutual_count
    from public.ari_circle_profiles p
    left join private.ari_circle_search_locations s
      on s.user_id = p.user_id
    where p.user_id <> caller_id
      and public.ari_circle_user_is_adult(p.user_id)
      and not public.ari_circle_social_pair_is_blocked(caller_id, p.user_id)
      and not exists (
        select 1
        from public.ari_circle_connections existing
        where
          (existing.requester_user_id = caller_id and existing.addressee_user_id = p.user_id)
          or
          (existing.requester_user_id = p.user_id and existing.addressee_user_id = caller_id)
      )
      and (
        clean_query = ''
        or position(clean_query in lower(coalesce(p.handle::text, ''))) > 0
        or position(clean_query in lower(coalesce(p.display_name, ''))) > 0
      )
  ),
  scored as (
    select
      c.*,
      case
        when viewer_lat is not null
         and viewer_lon is not null
         and c.candidate_lat is not null
         and c.candidate_lon is not null
        then round((
          3958.7613 * 2.0 * asin(
            sqrt(
              least(
                1.0,
                power(sin(radians((c.candidate_lat - viewer_lat)::double precision) / 2.0), 2)
                + cos(radians(viewer_lat::double precision))
                  * cos(radians(c.candidate_lat::double precision))
                  * power(sin(radians((c.candidate_lon - viewer_lon)::double precision) / 2.0), 2)
              )
            )
          )
        )::numeric, 1)
        else null
      end as distance_miles
    from candidates c
  ),
  classified as (
    select
      s.*,
      case
        when viewer_lat is not null
         and viewer_lon is not null
         and s.distance_miles is not null
          then s.distance_miles <= viewer_radius::numeric
        when viewer_area is not null
          then (
            (
              nullif(btrim(s.profile_location), '') is not null
              and (
                position(lower(viewer_area) in lower(s.profile_location)) > 0
                or position(lower(s.profile_location) in lower(viewer_area)) > 0
              )
            )
            or
            (
              nullif(btrim(s.private_area), '') is not null
              and (
                position(lower(viewer_area) in lower(s.private_area)) > 0
                or position(lower(s.private_area) in lower(viewer_area)) > 0
              )
            )
          )
        else false
      end as is_nearby
    from scored s
  )
  select
    c.user_id,
    c.display_name,
    c.handle,
    c.bio,
    c.avatar_url,
    c.profile_location,
    c.distance_miles,
    c.mutual_count,
    c.is_nearby,
    (c.mutual_count > 0) as is_suggested
  from classified c
  where
    clean_query <> ''
    or c.is_nearby
    or c.mutual_count > 0
  order by
    case
      when clean_query <> '' and lower(coalesce(c.handle, '')) = clean_query then 0
      when clean_query <> '' and lower(coalesce(c.display_name, '')) = clean_query then 1
      else 2
    end,
    case when c.is_nearby then 0 else 1 end,
    c.mutual_count desc,
    c.distance_miles asc nulls last,
    c.display_name asc nulls last
  limit safe_limit;
end;
$$;

revoke all on function public.ari_circle_find_friends_v1(text, integer) from public, anon;
grant execute on function public.ari_circle_find_friends_v1(text, integer) to authenticated;

commit;
