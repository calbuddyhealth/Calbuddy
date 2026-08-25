-- ARI Circle Action Network — Action Graph V1
-- Derive repeated real-world relationships from verified completed meetups.
-- This is a read model only: it does not create social edges, award XP, expose
-- room content, or store a subjective compatibility/reputation score.

begin;

create or replace function public.ari_circle_list_action_relationships(
  result_limit integer default 40
)
returns table (
  other_user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  completed_together bigint,
  repeat_count bigint,
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  hosted_by_me bigint,
  hosted_by_them bigint,
  unique_activities bigint,
  top_activity text,
  shared_activity_counts jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1, least(coalesce(result_limit, 40), 100));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then
    raise exception 'Sign in to view activity relationships';
  end if;

  return query
  with shared as (
    select
      other.user_id as other_user_id,
      m.id as meetup_id,
      m.activity,
      coalesce(m.completed_at, greatest(mine.completed_at, other.completed_at), m.ends_at) as completed_at,
      case when m.host_user_id = caller_id then 1 else 0 end as hosted_by_me,
      case when m.host_user_id = other.user_id then 1 else 0 end as hosted_by_them
    from public.ari_circle_meetup_participants mine
    join public.ari_circle_meetups m
      on m.id = mine.meetup_id
    join public.ari_circle_meetup_participants other
      on other.meetup_id = m.id
     and other.user_id <> caller_id
    where mine.user_id = caller_id
      and mine.status = 'joined'
      and mine.completed_at is not null
      and other.status = 'joined'
      and other.completed_at is not null
      and m.status = 'completed'
      and public.ari_circle_user_is_adult(other.user_id)
      and not public.ari_circle_social_pair_is_blocked(caller_id, other.user_id)
  ),
  relationship_stats as (
    select
      s.other_user_id,
      count(distinct s.meetup_id)::bigint as completed_together,
      greatest(count(distinct s.meetup_id)::bigint - 1, 0::bigint) as repeat_count,
      min(s.completed_at) as first_completed_at,
      max(s.completed_at) as last_completed_at,
      sum(s.hosted_by_me)::bigint as hosted_by_me,
      sum(s.hosted_by_them)::bigint as hosted_by_them,
      count(distinct s.activity)::bigint as unique_activities
    from shared s
    group by s.other_user_id
  ),
  activity_counts as (
    select
      s.other_user_id,
      s.activity,
      count(distinct s.meetup_id)::bigint as activity_count
    from shared s
    group by s.other_user_id, s.activity
  ),
  activity_maps as (
    select
      ac.other_user_id,
      jsonb_object_agg(ac.activity, ac.activity_count order by ac.activity) as shared_activity_counts
    from activity_counts ac
    group by ac.other_user_id
  ),
  top_activities as (
    select distinct on (ac.other_user_id)
      ac.other_user_id,
      ac.activity as top_activity
    from activity_counts ac
    order by ac.other_user_id, ac.activity_count desc, ac.activity asc
  )
  select
    cp.user_id as other_user_id,
    cp.display_name,
    cp.handle::text,
    cp.avatar_url,
    rs.completed_together,
    rs.repeat_count,
    rs.first_completed_at,
    rs.last_completed_at,
    rs.hosted_by_me,
    rs.hosted_by_them,
    rs.unique_activities,
    ta.top_activity,
    coalesce(am.shared_activity_counts, '{}'::jsonb)
  from relationship_stats rs
  join public.ari_circle_profiles cp
    on cp.user_id = rs.other_user_id
  left join activity_maps am
    on am.other_user_id = rs.other_user_id
  left join top_activities ta
    on ta.other_user_id = rs.other_user_id
  order by
    rs.completed_together desc,
    rs.last_completed_at desc,
    lower(coalesce(cp.display_name, '')) asc,
    cp.user_id asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_action_relationships(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_action_relationships(integer)
  to authenticated, service_role;

commit;
