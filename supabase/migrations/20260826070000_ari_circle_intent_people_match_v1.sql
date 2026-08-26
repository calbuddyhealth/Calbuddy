-- ARI Circle Action Network — people match v1
-- Matches adults with overlapping private action intents without exposing raw
-- intent windows, notes, or coordinates. Read-only discovery only: this RPC
-- never creates invitations, meetup membership, requests, or connections.

create or replace function public.ari_circle_match_people_for_intent(
  requested_intent_id uuid,
  result_limit integer default 6
)
returns table(
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  match_score integer,
  match_reasons text[],
  distance_miles numeric,
  completed_together bigint
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  caller_id uuid := auth.uid();
  viewer_intent public.ari_circle_action_intents%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit, 6), 12));
begin
  perform public.ari_circle_assert_adult_access();

  if requested_intent_id is null then
    raise exception 'Action intent is required';
  end if;

  select i.*
  into viewer_intent
  from public.ari_circle_action_intents i
  where i.id = requested_intent_id
    and i.user_id = caller_id
    and i.status = 'active'
    and i.expires_at > now();

  if not found then
    raise exception 'Active action intent unavailable';
  end if;

  return query
  with relationship_history as (
    select
      r.other_user_id,
      r.completed_together
    from public.ari_circle_list_action_relationships(100) r
  ),
  raw_candidates as (
    select
      candidate.user_id,
      profile.display_name,
      profile.handle::text as handle,
      profile.avatar_url,
      candidate.activity,
      candidate.experience_level,
      candidate.intensity,
      candidate.desired_group_min,
      candidate.desired_group_max,
      candidate.area,
      candidate.approximate_latitude,
      candidate.approximate_longitude,
      candidate.radius_miles,
      candidate.time_window_start,
      candidate.time_window_end,
      coalesce(history.completed_together, 0::bigint) as completed_together,
      case
        when viewer_intent.approximate_latitude is not null
         and viewer_intent.approximate_longitude is not null
         and candidate.approximate_latitude is not null
         and candidate.approximate_longitude is not null
        then 3958.7613 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(
                sin(
                  radians(
                    (candidate.approximate_latitude - viewer_intent.approximate_latitude)::double precision
                  ) / 2.0
                ),
                2
              )
              + cos(radians(viewer_intent.approximate_latitude::double precision))
                * cos(radians(candidate.approximate_latitude::double precision))
                * power(
                    sin(
                      radians(
                        (candidate.approximate_longitude - viewer_intent.approximate_longitude)::double precision
                      ) / 2.0
                    ),
                    2
                  )
            )
          )
        )
        else null
      end as raw_distance
    from public.ari_circle_action_intents candidate
    join public.ari_circle_profiles profile
      on profile.user_id = candidate.user_id
    left join relationship_history history
      on history.other_user_id = candidate.user_id
    where candidate.user_id <> caller_id
      and candidate.status = 'active'
      and candidate.expires_at > now()
      and public.ari_circle_user_is_adult(candidate.user_id)
      and not public.ari_circle_social_pair_is_blocked(caller_id, candidate.user_id)
      and candidate.time_window_start < viewer_intent.time_window_end
      and candidate.time_window_end > viewer_intent.time_window_start
  ),
  eligible as (
    select c.*
    from raw_candidates c
    where (
      c.raw_distance is null
      or c.raw_distance <= least(
        viewer_intent.radius_miles::double precision,
        c.radius_miles::double precision
      )
    )
  ),
  scored as (
    select
      c.*,
      case
        when viewer_intent.activity = 'any' or c.activity = 'any' then 24
        when c.activity = viewer_intent.activity then 38
        when viewer_intent.activity = 'outdoor'
          and c.activity in ('walking','running','hiking','cycling','sports','community') then 30
        when c.activity = 'outdoor'
          and viewer_intent.activity in ('walking','running','hiking','cycling','sports','community') then 30
        when viewer_intent.activity = 'wellness'
          and c.activity in ('walking','yoga') then 28
        when c.activity = 'wellness'
          and viewer_intent.activity in ('walking','yoga') then 28
        when viewer_intent.activity = 'community' and c.activity = 'volunteer' then 28
        when viewer_intent.activity = 'volunteer' and c.activity = 'community' then 28
        else 0
      end as activity_score,
      30 as time_score,
      case
        when viewer_intent.experience_level = 'any' or c.experience_level = 'any' then 5
        when c.experience_level = viewer_intent.experience_level then 10
        when (viewer_intent.experience_level, c.experience_level) in (
          ('beginner','intermediate'),
          ('intermediate','beginner'),
          ('intermediate','advanced'),
          ('advanced','intermediate')
        ) then 6
        else 2
      end as experience_score,
      case
        when viewer_intent.intensity = 'any' or c.intensity = 'any' then 4
        when c.intensity = viewer_intent.intensity then 8
        when (viewer_intent.intensity, c.intensity) in (
          ('easy','moderate'),
          ('moderate','easy'),
          ('moderate','hard'),
          ('hard','moderate')
        ) then 4
        else 1
      end as intensity_score,
      case
        when greatest(viewer_intent.desired_group_min, c.desired_group_min)
             <= least(viewer_intent.desired_group_max, c.desired_group_max)
        then 8
        else 0
      end as group_score,
      case
        when c.raw_distance is not null and c.raw_distance <= 2 then 10
        when c.raw_distance is not null and c.raw_distance <= 5 then 8
        when c.raw_distance is not null and c.raw_distance <= 10 then 6
        when c.raw_distance is not null and c.raw_distance <= 25 then 4
        when viewer_intent.area is not null
         and c.area is not null
         and (
           lower(c.area) like '%' || lower(viewer_intent.area) || '%'
           or lower(viewer_intent.area) like '%' || lower(c.area) || '%'
         ) then 6
        when viewer_intent.approximate_latitude is null
         and viewer_intent.area is null then 2
        else 0
      end as location_score,
      case
        when c.completed_together >= 3 then 8
        when c.completed_together = 2 then 6
        when c.completed_together = 1 then 4
        else 0
      end as history_score
    from eligible c
  ),
  ranked as (
    select
      s.*,
      least(
        100,
        s.activity_score
        + s.time_score
        + s.experience_score
        + s.intensity_score
        + s.group_score
        + s.location_score
        + s.history_score
      )::integer as internal_match_score,
      array_remove(array[
        case
          when viewer_intent.activity = 'any' or s.activity = 'any'
            then 'Open to the activity you want'
          when s.activity = viewer_intent.activity
            then 'Wants the same activity'
          when s.activity_score >= 28
            then 'Wants a compatible kind of activity'
          else null
        end,
        'Available during your time window',
        case
          when s.experience_score = 10 then 'Similar experience level'
          when s.experience_score >= 5 then 'Experience preference is compatible'
          else null
        end,
        case
          when s.intensity_score = 8 then 'Similar intensity'
          when s.intensity_score >= 4 then 'Intensity preference is compatible'
          else null
        end,
        case when s.group_score = 8 then 'Compatible group-size preference' else null end,
        case
          when s.raw_distance is not null and s.raw_distance <= 2 then 'Within about 2 miles of your intent area'
          when s.raw_distance is not null and s.raw_distance <= 5 then 'Within about 5 miles of your intent area'
          when s.raw_distance is not null and s.raw_distance <= 10 then 'Within about 10 miles of your intent area'
          when s.raw_distance is not null and s.raw_distance <= 25 then 'Inside your selected search radius'
          when s.location_score >= 6 then 'Matches your general area'
          else null
        end,
        case
          when s.completed_together >= 3 then 'You have repeatedly completed activities together'
          when s.completed_together > 0 then 'You have completed an activity together before'
          else null
        end
      ]::text[], null) as reasons
    from scored s
  ),
  best_per_person as (
    select distinct on (r.user_id)
      r.*
    from ranked r
    where r.activity_score > 0
      and r.internal_match_score >= 55
    order by
      r.user_id,
      r.internal_match_score desc,
      r.time_window_start asc
  )
  select
    b.user_id,
    b.display_name,
    b.handle,
    b.avatar_url,
    b.internal_match_score,
    b.reasons,
    case when b.raw_distance is not null then round(b.raw_distance::numeric, 1) else null end,
    b.completed_together
  from best_per_person b
  order by
    b.internal_match_score desc,
    b.completed_together desc,
    lower(coalesce(b.display_name, '')) asc,
    b.user_id asc
  limit cap;
end;
$function$;

revoke all on function public.ari_circle_match_people_for_intent(uuid, integer) from public;
revoke all on function public.ari_circle_match_people_for_intent(uuid, integer) from anon;
grant execute on function public.ari_circle_match_people_for_intent(uuid, integer) to authenticated;
