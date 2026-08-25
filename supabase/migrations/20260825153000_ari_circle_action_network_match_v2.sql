-- ARI Circle Action Network — Match Engine V2
-- Rank Opportunities with grounded public-Place proximity and verified prior
-- real-world activity with the organizer. Missing signals remain neutral.
--
-- Privacy / product rules:
--   - only the caller's own active private Action Intent can drive matching;
--   - distance applies only to curated public Places attached to Missions;
--   - Meetup/private meeting-point location is never read or inferred here;
--   - relationship history comes only from verified completed Meetups;
--   - XP, payment, premium status, popularity, followers, and engagement are
--     never ranking inputs;
--   - raw match_score is retained only for backward-compatible ordering. UI
--     should explain reasons rather than present a fake precision percentage.

begin;

create or replace function public.ari_circle_match_opportunities(
  requested_intent_id uuid,
  result_limit integer default 12
)
returns table(
  opportunity_key text,
  opportunity_type text,
  opportunity_id uuid,
  title text,
  activity text,
  description text,
  area text,
  starts_at timestamptz,
  ends_at timestamptz,
  organizer_user_id uuid,
  organizer_display_name text,
  organizer_handle text,
  organizer_avatar_url text,
  participant_count bigint,
  capacity integer,
  spots_remaining integer,
  viewer_state text,
  verification_mode text,
  join_mode text,
  reward_xp integer,
  match_score integer,
  match_reasons text[],
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  intent public.ari_circle_action_intents%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit, 12), 30));
begin
  perform public.ari_circle_assert_adult_access();

  if requested_intent_id is null then
    raise exception 'Action intent is required';
  end if;

  select i.*
  into intent
  from public.ari_circle_action_intents i
  where i.id = requested_intent_id
    and i.user_id = caller_id
    and i.status = 'active'
    and i.expires_at > now();

  if not found then
    raise exception 'Active action intent unavailable';
  end if;

  return query
  with candidates as (
    select *
    from public.ari_circle_list_opportunities(
      array['meetup','mission']::text[],
      null,
      'upcoming',
      50
    ) o
    where o.viewer_state = 'available'
      and o.starts_at < intent.time_window_end
      and o.ends_at > intent.time_window_start
      and (o.spots_remaining is null or o.spots_remaining > 0)
  ),
  -- Reuse the existing safe Place projection. Approximate caller coordinates
  -- stay inside this server-side call and are never returned by Match V2.
  nearby_public_places as (
    select
      p.place_id,
      p.distance_miles
    from public.ari_circle_list_places(
      requested_activity => null,
      requested_area => null,
      requested_latitude => intent.approximate_latitude,
      requested_longitude => intent.approximate_longitude,
      requested_radius_miles => intent.radius_miles,
      result_limit => 50
    ) p
    where intent.approximate_latitude is not null
      and intent.approximate_longitude is not null
      and p.distance_miles is not null
  ),
  mission_distance as (
    select
      mp.mission_id,
      min(np.distance_miles)::numeric as distance_miles
    from public.ari_circle_mission_places mp
    join nearby_public_places np
      on np.place_id = mp.place_id
    group by mp.mission_id
  ),
  -- Action Graph is already adult-gated, caller-derived, block-aware, and
  -- based only on verified completed Meetups. It is evidence of prior shared
  -- action, not a rating or inferred personality compatibility score.
  organizer_history as (
    select
      ar.other_user_id,
      ar.completed_together,
      ar.repeat_count,
      ar.last_completed_at
    from public.ari_circle_list_action_relationships(100) ar
  ),
  scored as (
    select
      o.*,
      md.distance_miles,
      oh.completed_together as organizer_completed_together,
      oh.repeat_count as organizer_repeat_count,
      case
        when intent.activity = 'any' then 25
        when o.activity = intent.activity then 45
        when intent.activity = 'outdoor'
          and o.activity in ('walking','running','hiking','cycling','sports','community') then 35
        when intent.activity = 'wellness'
          and o.activity in ('wellness','walking','yoga') then 35
        when intent.activity in ('gym','running','cycling','sports','yoga')
          and o.activity = 'fitness' then 32
        when intent.activity = 'community'
          and o.activity in ('community','volunteer') then 32
        when intent.activity = 'volunteer'
          and o.activity = 'community' then 24
        else 0
      end as activity_score,
      case
        when o.opportunity_type = 'meetup'
          and o.starts_at >= intent.time_window_start
          and o.starts_at < intent.time_window_end then 30
        else 24
      end as time_score,
      case
        when intent.area is not null and o.area is not null and (
          lower(o.area) like '%' || lower(intent.area) || '%'
          or lower(intent.area) like '%' || lower(o.area) || '%'
        ) then 10
        else 0
      end as area_score,
      case
        when o.capacity is null then 5
        when o.capacity between intent.desired_group_min and intent.desired_group_max then 10
        when (o.participant_count + 1) between intent.desired_group_min and intent.desired_group_max then 8
        when o.capacity >= intent.desired_group_min
          and (o.participant_count + 1) <= intent.desired_group_max then 6
        else 2
      end as group_score,
      case
        -- Distance is intentionally available only for Missions attached to a
        -- curated public Place. Meetups keep their private location boundary.
        when o.opportunity_type <> 'mission' or md.distance_miles is null then 0
        when md.distance_miles <= 2 then 12
        when md.distance_miles <= 5 then 10
        when md.distance_miles <= 10 then 8
        when md.distance_miles <= 25 then 5
        when md.distance_miles <= 50 then 3
        else 1
      end as distance_score,
      case
        -- Prior shared action is a modest tie-breaker, never a gate. A user
        -- with no history is not penalized, preserving discovery/cold start.
        when coalesce(oh.completed_together, 0) >= 3 then 8
        when coalesce(oh.completed_together, 0) = 2 then 6
        when coalesce(oh.completed_together, 0) = 1 then 4
        else 0
      end as organizer_history_score
    from candidates o
    left join mission_distance md
      on o.opportunity_type = 'mission'
     and md.mission_id = o.opportunity_id
    left join organizer_history oh
      on oh.other_user_id = o.organizer_user_id
  ),
  ranked as (
    select
      s.*,
      (
        s.activity_score
        + s.time_score
        + s.area_score
        + s.group_score
        + s.distance_score
        + s.organizer_history_score
      )::integer as internal_match_score,
      array_remove(array[
        case
          when intent.activity = 'any' then 'Fits your open activity intent'
          when s.activity = intent.activity then 'Matches the activity you want'
          when s.activity_score >= 30 then 'Fits the kind of activity you want'
          when s.activity_score > 0 then 'Related to what you want to do'
          else null
        end,
        case
          when s.opportunity_type = 'meetup' and s.time_score = 30 then 'Starts inside your available time window'
          else 'Available during your time window'
        end,
        case when s.area_score > 0 then 'Matches your general area' else null end,
        case when s.group_score >= 8 then 'Fits your preferred group size' else null end,
        case
          when s.distance_score >= 12 then 'At a public Place within about 2 miles of your search area'
          when s.distance_score >= 10 then 'At a public Place within about 5 miles of your search area'
          when s.distance_score >= 8 then 'At a public Place within about 10 miles of your search area'
          when s.distance_score >= 5 then 'At a public Place within about 25 miles of your search area'
          when s.distance_score > 0 then 'At a public Place inside your selected search radius'
          else null
        end,
        case
          when s.organizer_history_score >= 6 then 'You have repeatedly completed activities with this organizer'
          when s.organizer_history_score > 0 then 'You have completed an activity with this organizer before'
          else null
        end
      ]::text[], null) as reasons
    from scored s
  )
  select
    r.opportunity_key,
    r.opportunity_type,
    r.opportunity_id,
    r.title,
    r.activity,
    r.description,
    r.area,
    r.starts_at,
    r.ends_at,
    r.organizer_user_id,
    r.organizer_display_name,
    r.organizer_handle,
    r.organizer_avatar_url,
    r.participant_count,
    r.capacity,
    r.spots_remaining,
    r.viewer_state,
    r.verification_mode,
    r.join_mode,
    -- Reward XP remains display metadata only. It is intentionally excluded
    -- from internal_match_score so reward size cannot purchase attention.
    r.reward_xp,
    r.internal_match_score,
    r.reasons,
    coalesce(r.metadata, '{}'::jsonb) || jsonb_build_object(
      'match_version', 'action_match_v2',
      'distance_scored', r.distance_miles is not null,
      'public_place_distance_miles', r.distance_miles,
      'experience_scored', r.organizer_completed_together is not null,
      'organizer_history_level', case
        when coalesce(r.organizer_completed_together, 0) >= 3 then 'repeat'
        when coalesce(r.organizer_completed_together, 0) > 0 then 'prior'
        else null
      end,
      'intensity_scored', false
    )
  from ranked r
  where r.activity_score > 0
    and r.internal_match_score >= 45
  order by
    r.internal_match_score desc,
    r.starts_at asc,
    r.opportunity_key asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_match_opportunities(uuid,integer) from public, anon;
grant execute on function public.ari_circle_match_opportunities(uuid,integer) to authenticated, service_role;

commit;
