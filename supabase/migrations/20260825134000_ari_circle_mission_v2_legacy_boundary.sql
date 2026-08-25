-- ARI Circle — Mission V2 legacy boundary
-- Metric Missions share ari_circle_quests for continuity, but the old Quest UI
-- and completion RPCs must never bypass measurable Mission progress.

begin;

create or replace function public.ari_circle_list_quests(result_limit integer default 30)
returns table (
  quest_id uuid,
  creator_user_id uuid,
  creator_display_name text,
  creator_handle text,
  title text,
  description text,
  scope text,
  category text,
  verification_mode text,
  xp_reward smallint,
  ends_at timestamptz,
  member_count bigint,
  viewer_status text,
  creator_leadership_tier text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1, least(coalesce(result_limit, 30), 50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to view Quests'; end if;

  return query
  select
    q.id,
    q.creator_user_id,
    p.display_name,
    p.handle::text,
    q.title,
    q.description,
    q.scope,
    q.category,
    q.verification_mode,
    q.xp_reward,
    q.ends_at,
    (select count(*) from public.ari_circle_quest_members qm where qm.quest_id = q.id and qm.status <> 'left'),
    (select qm.status from public.ari_circle_quest_members qm where qm.quest_id = q.id and qm.user_id = caller_id),
    public.ari_circle_leadership_tier(q.creator_user_id)
  from public.ari_circle_quests q
  join public.ari_circle_profiles p on p.user_id = q.creator_user_id
  where q.status = 'active'
    and q.ends_at > now()
    and q.objective_type = 'completion'
    and public.ari_circle_user_is_adult(q.creator_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id)
  order by q.created_at desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_quests(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_quests(integer)
  to authenticated, service_role;

create or replace function public.ari_circle_submit_quest_completion(
  requested_quest_id uuid,
  requested_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to complete a Quest'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_quest_id
    and status = 'active'
    and ends_at > now();

  if not found or q.objective_type <> 'completion' then
    raise exception 'Quest completion is unavailable for this Mission';
  end if;

  update public.ari_circle_quest_members
  set status = case when q.xp_reward = 0 and q.verification_mode = 'self' then 'verified' else 'submitted' end,
      submitted_at = now(),
      verified_at = case when q.xp_reward = 0 and q.verification_mode = 'self' then now() else null end,
      proof_note = nullif(btrim(coalesce(requested_note, '')), ''),
      updated_at = now()
  where quest_id = q.id
    and user_id = caller_id
    and status in ('joined','rejected');

  if not found then raise exception 'Join the Quest before completing it'; end if;

  return jsonb_build_object(
    'submitted', true,
    'needs_verification', not (q.xp_reward = 0 and q.verification_mode = 'self'),
    'xp_reward', q.xp_reward
  );
end;
$$;

revoke all on function public.ari_circle_submit_quest_completion(uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_submit_quest_completion(uuid,text)
  to authenticated, service_role;

create or replace function public.ari_circle_verify_quest_completion(
  requested_quest_id uuid,
  target_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  award integer := 0;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to verify a Quest'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_quest_id
  for update;

  if not found or q.status <> 'active' or q.objective_type <> 'completion' then
    raise exception 'Quest verification is unavailable for this Mission';
  end if;
  if caller_id = target_user_id then raise exception 'You cannot verify your own XP-bearing completion'; end if;
  if caller_id <> q.creator_user_id and not public.ari_circle_can_create_xp_quest(caller_id) then
    raise exception 'Organizer verification required';
  end if;

  update public.ari_circle_quest_members
  set status = 'verified',
      verified_at = now(),
      verified_by = caller_id,
      updated_at = now()
  where quest_id = q.id
    and user_id = target_user_id
    and status = 'submitted';

  if not found then raise exception 'No submitted completion to verify'; end if;

  if q.xp_reward > 0 then
    award := public.ari_circle_award_xp_capped(
      target_user_id,
      q.xp_reward,
      'quest',
      q.id,
      'verified_community_quest',
      'organizer_verified'
    );
  end if;

  return jsonb_build_object('verified', true, 'xp_awarded', award);
end;
$$;

revoke all on function public.ari_circle_verify_quest_completion(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_verify_quest_completion(uuid,uuid)
  to authenticated, service_role;

create or replace function public.ari_circle_quest_submissions(requested_quest_id uuid)
returns table (
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  member_status text,
  proof_note text,
  submitted_at timestamptz,
  verified_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to review Quest completions'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_quest_id;

  if not found or q.objective_type <> 'completion' then
    raise exception 'Quest review is unavailable for this Mission';
  end if;
  if caller_id <> q.creator_user_id and not public.ari_circle_can_create_xp_quest(caller_id) then
    raise exception 'Organizer access required';
  end if;

  return query
  select
    qm.user_id,
    p.display_name,
    p.handle::text,
    p.avatar_url,
    qm.status,
    qm.proof_note,
    qm.submitted_at,
    qm.verified_at
  from public.ari_circle_quest_members qm
  join public.ari_circle_profiles p on p.user_id = qm.user_id
  where qm.quest_id = q.id
    and qm.status in ('submitted','verified')
    and public.ari_circle_user_is_adult(qm.user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id, qm.user_id)
  order by qm.submitted_at asc nulls last;
end;
$$;

revoke all on function public.ari_circle_quest_submissions(uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_quest_submissions(uuid)
  to authenticated, service_role;

commit;
