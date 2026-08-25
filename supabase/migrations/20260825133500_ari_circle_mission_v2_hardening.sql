-- ARI Circle — Mission V2 hardening
-- Centralize count-unit integer semantics and make organizer verification
-- workable for the organizer's own contribution without allowing self-review.

begin;

alter table public.ari_circle_quests
  drop constraint if exists ari_circle_quests_count_target_integer_check;

alter table public.ari_circle_quests
  add constraint ari_circle_quests_count_target_integer_check
    check (objective_type <> 'count' or target_value = trunc(target_value));

create or replace function public.ari_circle_validate_mission_contribution_shape()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  q public.ari_circle_quests%rowtype;
begin
  select * into q
  from public.ari_circle_quests
  where id = new.quest_id;

  if not found or q.objective_type = 'completion' or q.xp_reward <> 0 then
    raise exception 'Mission contribution target is invalid';
  end if;

  if q.objective_type = 'count' and new.amount <> trunc(new.amount) then
    raise exception 'Count Mission contributions must be whole numbers';
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_validate_mission_contribution_shape()
  from public, anon, authenticated;
grant execute on function public.ari_circle_validate_mission_contribution_shape()
  to service_role;

drop trigger if exists ari_circle_mission_contribution_shape_guard
  on public.ari_circle_mission_contributions;
create trigger ari_circle_mission_contribution_shape_guard
before insert or update of quest_id, amount
on public.ari_circle_mission_contributions
for each row execute function public.ari_circle_validate_mission_contribution_shape();

-- Review visibility follows the same authority as review itself. For
-- organizer-verified Missions, the organizer reviews member contributions.
-- If the organizer contributes, another joined established leader may review
-- only that organizer's submitted contribution; this avoids both self-review
-- and unnecessary exposure of every member's proof/evidence.
create or replace function public.ari_circle_list_mission_contributions(
  requested_mission_id uuid,
  result_limit integer default 50
)
returns table (
  contribution_id uuid,
  contributor_user_id uuid,
  contributor_display_name text,
  contributor_handle text,
  amount numeric,
  unit text,
  contribution_status text,
  proof_note text,
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit, 50), 100));
  reviewer_is_member boolean := false;
  reviewer_is_leader boolean := false;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to review Mission progress'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id;

  if not found
     or q.objective_type = 'completion'
     or q.status <> 'active'
     or now() > q.ends_at + interval '48 hours' then
    raise exception 'Mission unavailable';
  end if;

  select exists (
    select 1 from public.ari_circle_quest_members qm
    where qm.quest_id = q.id and qm.user_id = caller_id and qm.status <> 'left'
  ) into reviewer_is_member;

  reviewer_is_leader := public.ari_circle_can_create_xp_quest(caller_id);

  if caller_id <> q.creator_user_id
     and not (q.verification_mode = 'peer' and reviewer_is_member)
     and not (q.verification_mode = 'organizer' and reviewer_is_member and reviewer_is_leader) then
    raise exception 'Mission progress review unavailable';
  end if;

  return query
  select
    c.id,
    c.user_id,
    p.display_name,
    p.handle::text,
    c.amount,
    q.unit,
    c.status,
    c.proof_note,
    c.submitted_at,
    c.verified_at,
    c.verified_by
  from public.ari_circle_mission_contributions c
  join public.ari_circle_profiles p on p.user_id = c.user_id
  where c.quest_id = q.id
    and public.ari_circle_user_is_adult(c.user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id, c.user_id)
    and (
      caller_id = q.creator_user_id
      or q.verification_mode = 'peer'
      or (
        q.verification_mode = 'organizer'
        and reviewer_is_member
        and reviewer_is_leader
        and c.user_id = q.creator_user_id
        and c.status = 'submitted'
      )
    )
  order by
    case c.status when 'submitted' then 0 when 'verified' then 1 else 2 end,
    c.submitted_at asc,
    c.id asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_mission_contributions(uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_mission_contributions(uuid,integer)
  to authenticated, service_role;

create or replace function public.ari_circle_review_mission_contribution(
  requested_contribution_id uuid,
  requested_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  c public.ari_circle_mission_contributions%rowtype;
  q public.ari_circle_quests%rowtype;
  clean_decision text := lower(btrim(coalesce(requested_decision, '')));
  reviewer_is_member boolean := false;
  reviewer_is_leader boolean := false;
  refreshed jsonb;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to review Mission progress'; end if;
  if clean_decision not in ('verify','reject') then raise exception 'Unsupported Mission review decision'; end if;

  select * into c
  from public.ari_circle_mission_contributions
  where id = requested_contribution_id
  for update;
  if not found then raise exception 'Mission contribution unavailable'; end if;

  select * into q
  from public.ari_circle_quests
  where id = c.quest_id
  for update;
  if not found
     or q.objective_type = 'completion'
     or q.verification_mode = 'self'
     or q.status <> 'active'
     or now() > q.ends_at + interval '48 hours' then
    raise exception 'Mission contribution unavailable';
  end if;

  if caller_id = c.user_id then raise exception 'You cannot verify your own Mission contribution'; end if;
  if public.ari_circle_social_pair_is_blocked(caller_id, c.user_id)
     or public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id) then
    raise exception 'Mission contribution unavailable';
  end if;

  select exists (
    select 1
    from public.ari_circle_quest_members qm
    where qm.quest_id = q.id and qm.user_id = caller_id and qm.status <> 'left'
  ) into reviewer_is_member;

  reviewer_is_leader := public.ari_circle_can_create_xp_quest(caller_id);

  if q.verification_mode = 'organizer' then
    if c.user_id = q.creator_user_id then
      if not reviewer_is_member or not reviewer_is_leader then
        raise exception 'A joined Community Leader must verify the organizer contribution';
      end if;
    elsif caller_id <> q.creator_user_id then
      raise exception 'Only the Mission organizer can verify this contribution';
    end if;
  elsif q.verification_mode = 'peer' and not reviewer_is_member then
    raise exception 'Join the Mission before verifying peer progress';
  end if;

  if c.status in ('verified','rejected') then
    return jsonb_build_object(
      'reviewed', true,
      'already_reviewed', true,
      'status', c.status,
      'contribution_id', c.id
    );
  end if;

  update public.ari_circle_mission_contributions
  set status = case when clean_decision = 'verify' then 'verified' else 'rejected' end,
      verified_at = case when clean_decision = 'verify' then now() else null end,
      verified_by = caller_id,
      updated_at = now()
  where id = c.id;

  if clean_decision = 'verify' then
    refreshed := public.ari_circle_refresh_metric_mission(q.id, c.user_id);
  else
    refreshed := jsonb_build_object('updated', false, 'objective_reached', false);
  end if;

  return jsonb_build_object(
    'reviewed', true,
    'already_reviewed', false,
    'status', case when clean_decision = 'verify' then 'verified' else 'rejected' end,
    'contribution_id', c.id,
    'progress', refreshed
  );
end;
$$;

revoke all on function public.ari_circle_review_mission_contribution(uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_review_mission_contribution(uuid,text)
  to authenticated, service_role;

commit;
