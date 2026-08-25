-- ARI Circle — Mission V2 Opportunity projection
-- Keep Opportunity as the read contract while sourcing Mission progress from
-- the authoritative Mission V2 RPC. No contribution proof/reviewer data leaks.

begin;

create or replace function public.ari_circle_list_opportunities(
  requested_types text[] default array['meetup','mission']::text[],
  requested_activity text default null::text,
  requested_window text default 'upcoming'::text,
  result_limit integer default 30
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
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity, ''))), '');
  clean_window text := lower(btrim(coalesce(requested_window, 'upcoming')));
  clean_types text[];
  cap integer := greatest(1, least(coalesce(result_limit, 30), 50));
begin
  perform public.ari_circle_assert_adult_access();

  if clean_window not in ('upcoming', 'today', 'weekend') then
    raise exception 'Unsupported opportunity window';
  end if;

  select coalesce(array_agg(distinct normalized_type order by normalized_type), '{}'::text[])
  into clean_types
  from (
    select lower(btrim(value)) as normalized_type
    from unnest(coalesce(requested_types, array['meetup','mission']::text[])) as input(value)
    where nullif(btrim(value), '') is not null
  ) normalized;

  if cardinality(clean_types) = 0 then
    clean_types := array['meetup','mission']::text[];
  end if;

  if exists (
    select 1
    from unnest(clean_types) as requested(value)
    where requested.value not in ('meetup', 'mission')
  ) then
    raise exception 'Unsupported opportunity type';
  end if;

  return query
  with meetup_rows as (
    select
      ('meetup:' || m.meetup_id::text)::text as opportunity_key,
      'meetup'::text as opportunity_type,
      m.meetup_id as opportunity_id,
      m.title,
      m.activity,
      m.description,
      m.area,
      m.starts_at,
      m.ends_at,
      m.host_user_id as organizer_user_id,
      m.host_display_name as organizer_display_name,
      m.host_handle as organizer_handle,
      m.host_avatar_url as organizer_avatar_url,
      m.participant_count,
      m.max_participants::integer as capacity,
      greatest(m.max_participants::integer - m.participant_count::integer, 0) as spots_remaining,
      case
        when m.viewer_is_host then 'host'
        when m.viewer_completed then 'completed'
        when m.viewer_joined then 'joined'
        when nullif(m.viewer_request_status, '') is not null then m.viewer_request_status
        else 'available'
      end::text as viewer_state,
      'mutual_completion'::text as verification_mode,
      m.join_mode::text as join_mode,
      m.participant_xp::integer as reward_xp,
      jsonb_build_object(
        'source', 'ari_circle_meetups',
        'host_leadership_tier', m.host_leadership_tier,
        'host_total_xp', m.host_total_xp,
        'pending_request_count', m.pending_request_count,
        'viewer_request_status', m.viewer_request_status,
        'completion_required', (m.ends_at <= now() and m.viewer_joined and not m.viewer_completed)
      ) as metadata,
      case
        when m.ends_at <= now() and m.viewer_joined and not m.viewer_completed then 0
        when m.viewer_is_host then 1
        when m.viewer_joined then 2
        when m.viewer_request_status in ('pending','waitlisted') then 3
        else 4
      end as state_rank,
      m.starts_at as sort_at
    from public.ari_circle_list_meetups(clean_activity, clean_window, cap) m
    where 'meetup' = any(clean_types)
  ),
  mission_rows as (
    select
      ('mission:' || listed.mission_id::text)::text as opportunity_key,
      'mission'::text as opportunity_type,
      listed.mission_id as opportunity_id,
      listed.title,
      listed.category::text as activity,
      listed.description,
      null::text as area,
      listed.starts_at,
      listed.ends_at,
      listed.creator_user_id as organizer_user_id,
      listed.creator_display_name as organizer_display_name,
      listed.creator_handle as organizer_handle,
      listed.creator_avatar_url as organizer_avatar_url,
      listed.member_count as participant_count,
      source.max_participants as capacity,
      case
        when source.max_participants is null then null
        else greatest(source.max_participants - listed.member_count::integer, 0)
      end as spots_remaining,
      case
        when listed.creator_user_id = caller_id then 'creator'
        when nullif(listed.viewer_status, '') is not null then listed.viewer_status
        else 'available'
      end::text as viewer_state,
      listed.verification_mode::text as verification_mode,
      'open'::text as join_mode,
      source.xp_reward::integer as reward_xp,
      jsonb_build_object(
        'source', 'ari_circle_quests',
        'scope', listed.scope,
        'category', listed.category,
        'creator_leadership_tier', public.ari_circle_leadership_tier(listed.creator_user_id),
        'objective_type', listed.objective_type,
        'progress_mode', listed.progress_mode,
        'target_value', listed.target_value,
        'unit', listed.unit,
        'verified_progress', listed.verified_progress,
        'viewer_verified_progress', listed.viewer_verified_progress,
        'viewer_pending_progress', listed.viewer_pending_progress,
        'progress_percent', listed.progress_percent,
        'objective_reached_at', listed.objective_reached_at
      ) as metadata,
      case
        when listed.creator_user_id = caller_id then 1
        when listed.viewer_status in ('joined','submitted') then 2
        when listed.viewer_status = 'verified' then 3
        else 4
      end as state_rank,
      listed.ends_at as sort_at
    from public.ari_circle_list_missions_v2(50) listed
    join public.ari_circle_quests source on source.id = listed.mission_id
    where 'mission' = any(clean_types)
      and (clean_activity is null or listed.category = clean_activity)
      and (
        clean_window = 'upcoming'
        or (
          clean_window = 'today'
          and listed.starts_at < date_trunc('day', now()) + interval '1 day'
          and listed.ends_at > date_trunc('day', now())
        )
        or (
          clean_window = 'weekend'
          and listed.starts_at < date_trunc('week', now()) + interval '7 days'
          and listed.ends_at > date_trunc('week', now()) + interval '5 days'
        )
      )
  ),
  normalized as (
    select * from meetup_rows
    union all
    select * from mission_rows
  )
  select
    n.opportunity_key,
    n.opportunity_type,
    n.opportunity_id,
    n.title,
    n.activity,
    n.description,
    n.area,
    n.starts_at,
    n.ends_at,
    n.organizer_user_id,
    n.organizer_display_name,
    n.organizer_handle,
    n.organizer_avatar_url,
    n.participant_count,
    n.capacity,
    n.spots_remaining,
    n.viewer_state,
    n.verification_mode,
    n.join_mode,
    n.reward_xp,
    n.metadata
  from normalized n
  order by n.state_rank asc, n.sort_at asc, n.opportunity_key asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_opportunities(text[],text,text,integer) from public, anon;
grant execute on function public.ari_circle_list_opportunities(text[],text,text,integer) to authenticated, service_role;

commit;
