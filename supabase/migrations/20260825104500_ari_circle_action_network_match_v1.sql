-- ARI Circle Action Network V6 — Match Engine V1
-- Deterministic, explainable Opportunity matching over private Action Intents.
-- V1 deliberately does not score XP, payment, popularity, followers, or engagement.

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
  ), scored as (
    select
      o.*,
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
      end as group_score
    from candidates o
  ), ranked as (
    select
      s.*,
      (s.activity_score + s.time_score + s.area_score + s.group_score)::integer as internal_match_score,
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
        case when s.group_score >= 8 then 'Fits your preferred group size' else null end
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
      'match_version', 'action_match_v1',
      'distance_scored', false,
      'experience_scored', false,
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
