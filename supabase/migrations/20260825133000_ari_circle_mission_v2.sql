-- ARI Circle — Mission V2
-- Evolve Quests into measurable real-world Missions without creating a second
-- reward system. Existing completion-style Quests remain unchanged.
--
-- Phase 1 policy:
--   - metric Missions support count, distance, and duration objectives;
--   - progress can be individual or collective;
--   - only VERIFIED contributions move progress;
--   - metric Missions are 0-XP until system-grade verification is built;
--   - contribution rows are server-authoritative and idempotent;
--   - no location, engagement, payment, or popularity signals are stored here.

begin;

alter table public.ari_circle_quests
  add column if not exists objective_type text not null default 'completion',
  add column if not exists progress_mode text not null default 'individual',
  add column if not exists target_value numeric(12,2),
  add column if not exists unit text,
  add column if not exists objective_reached_at timestamptz;

alter table public.ari_circle_quests
  drop constraint if exists ari_circle_quests_objective_type_check,
  drop constraint if exists ari_circle_quests_progress_mode_check,
  drop constraint if exists ari_circle_quests_metric_shape_check,
  drop constraint if exists ari_circle_quests_metric_xp_check,
  drop constraint if exists ari_circle_quests_collective_scope_check;

alter table public.ari_circle_quests
  add constraint ari_circle_quests_objective_type_check
    check (objective_type in ('completion','count','distance','duration')),
  add constraint ari_circle_quests_progress_mode_check
    check (progress_mode in ('individual','collective')),
  add constraint ari_circle_quests_metric_shape_check
    check (
      (
        objective_type = 'completion'
        and progress_mode = 'individual'
        and target_value is null
        and unit is null
      )
      or
      (
        objective_type <> 'completion'
        and target_value is not null
        and target_value > 0
        and target_value <= 1000000
        and unit is not null
        and char_length(btrim(unit)) between 1 and 24
      )
    ),
  add constraint ari_circle_quests_metric_xp_check
    check (objective_type = 'completion' or xp_reward = 0),
  add constraint ari_circle_quests_collective_scope_check
    check (not (progress_mode = 'collective' and scope = 'personal'));

create index if not exists ari_circle_quests_objective_idx
  on public.ari_circle_quests(status, objective_type, progress_mode, ends_at);

create table if not exists public.ari_circle_mission_contributions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.ari_circle_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_event_id uuid not null,
  amount numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  proof_note text,
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint ari_circle_mission_contributions_note_check
    check (proof_note is null or char_length(proof_note) <= 500),
  constraint ari_circle_mission_contributions_client_event_unique
    unique (quest_id, user_id, client_event_id)
);

create index if not exists ari_circle_mission_contributions_quest_status_idx
  on public.ari_circle_mission_contributions(quest_id, status, submitted_at);
create index if not exists ari_circle_mission_contributions_user_idx
  on public.ari_circle_mission_contributions(user_id, submitted_at desc);

alter table public.ari_circle_mission_contributions enable row level security;
revoke all on table public.ari_circle_mission_contributions from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_mission_contributions to service_role;

-- Internal settlement helper. It never awards XP. It converts VERIFIED metric
-- progress into objective/member state so all callers share one truth.
create or replace function public.ari_circle_refresh_metric_mission(
  requested_mission_id uuid,
  target_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.ari_circle_quests%rowtype;
  global_total numeric(12,2) := 0;
  user_total numeric(12,2) := 0;
  reached boolean := false;
begin
  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id
  for update;

  if not found or q.objective_type = 'completion' then
    return jsonb_build_object('updated', false, 'reason', 'not_metric_mission');
  end if;

  select coalesce(sum(c.amount), 0)::numeric(12,2)
  into global_total
  from public.ari_circle_mission_contributions c
  where c.quest_id = q.id and c.status = 'verified';

  if target_user_id is not null then
    select coalesce(sum(c.amount), 0)::numeric(12,2)
    into user_total
    from public.ari_circle_mission_contributions c
    where c.quest_id = q.id
      and c.user_id = target_user_id
      and c.status = 'verified';
  end if;

  if q.progress_mode = 'collective' then
    reached := global_total >= q.target_value;
    if reached then
      update public.ari_circle_quests
      set objective_reached_at = coalesce(objective_reached_at, now()),
          updated_at = now()
      where id = q.id;

      update public.ari_circle_quest_members qm
      set status = 'verified',
          verified_at = coalesce(qm.verified_at, now()),
          updated_at = now()
      where qm.quest_id = q.id
        and qm.status <> 'left'
        and exists (
          select 1
          from public.ari_circle_mission_contributions c
          where c.quest_id = q.id
            and c.user_id = qm.user_id
            and c.status = 'verified'
        );
    end if;
  elsif target_user_id is not null then
    reached := user_total >= q.target_value;
    if reached then
      update public.ari_circle_quest_members qm
      set status = 'verified',
          verified_at = coalesce(qm.verified_at, now()),
          updated_at = now()
      where qm.quest_id = q.id
        and qm.user_id = target_user_id
        and qm.status <> 'left';
    end if;
  end if;

  return jsonb_build_object(
    'updated', true,
    'progress_mode', q.progress_mode,
    'target_value', q.target_value,
    'global_verified_total', global_total,
    'user_verified_total', user_total,
    'objective_reached', reached
  );
end;
$$;

revoke all on function public.ari_circle_refresh_metric_mission(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_refresh_metric_mission(uuid,uuid)
  to service_role;

create or replace function public.ari_circle_create_mission_v2(
  requested_title text,
  requested_description text default null,
  requested_scope text default 'community',
  requested_category text default 'activity',
  requested_verification_mode text default 'self',
  requested_objective_type text default 'count',
  requested_progress_mode text default 'individual',
  requested_target_value numeric default 1,
  requested_unit text default 'activities',
  requested_ends_at timestamptz default null,
  requested_max_participants integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  mission_id uuid;
  clean_title text := btrim(coalesce(requested_title, ''));
  clean_description text := nullif(btrim(coalesce(requested_description, '')), '');
  clean_scope text := lower(btrim(coalesce(requested_scope, 'community')));
  clean_category text := lower(btrim(coalesce(requested_category, 'activity')));
  clean_verification text := lower(btrim(coalesce(requested_verification_mode, 'self')));
  clean_objective text := lower(btrim(coalesce(requested_objective_type, 'count')));
  clean_progress text := lower(btrim(coalesce(requested_progress_mode, 'individual')));
  clean_unit text := lower(btrim(coalesce(requested_unit, '')));
  target numeric(12,2) := round(coalesce(requested_target_value, 0)::numeric, 2);
  end_time timestamptz := coalesce(requested_ends_at, now() + interval '7 days');
  capacity integer := case
    when requested_max_participants is null then null
    else greatest(2, least(requested_max_participants, 500))
  end;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to create a Mission'; end if;
  if char_length(clean_title) not between 3 and 90 then raise exception 'Mission title must be 3-90 characters'; end if;
  if clean_description is not null and char_length(clean_description) > 1000 then raise exception 'Mission description is too long'; end if;
  if clean_scope not in ('personal','community','crew') then raise exception 'Unsupported Mission scope'; end if;
  if clean_category not in ('activity','walking','fitness','community','volunteer','wellness','other') then raise exception 'Unsupported Mission category'; end if;
  if clean_verification not in ('self','organizer','peer') then raise exception 'Unsupported Mission verification mode'; end if;
  if clean_objective not in ('count','distance','duration') then raise exception 'Unsupported Mission objective'; end if;
  if clean_progress not in ('individual','collective') then raise exception 'Unsupported Mission progress mode'; end if;
  if clean_progress = 'collective' and clean_scope = 'personal' then raise exception 'Personal Missions cannot use collective progress'; end if;
  if target <= 0 or target > 1000000 then raise exception 'Choose a valid Mission target'; end if;
  if char_length(clean_unit) not between 1 and 24 then raise exception 'Choose a valid Mission unit'; end if;
  if clean_objective = 'distance' and clean_unit not in ('miles','kilometers') then raise exception 'Distance Missions use miles or kilometers'; end if;
  if clean_objective = 'duration' and clean_unit not in ('minutes','hours') then raise exception 'Duration Missions use minutes or hours'; end if;
  if clean_objective = 'count' and clean_unit not in ('activities','sessions','visits','times','reps','items','people') then raise exception 'Unsupported count unit'; end if;
  if end_time <= now() + interval '30 minutes' or end_time > now() + interval '90 days' then raise exception 'Choose a valid Mission end time'; end if;

  insert into public.ari_circle_quests(
    creator_user_id,
    title,
    description,
    scope,
    category,
    verification_mode,
    xp_reward,
    ends_at,
    max_participants,
    objective_type,
    progress_mode,
    target_value,
    unit
  ) values (
    caller_id,
    clean_title,
    clean_description,
    clean_scope,
    clean_category,
    clean_verification,
    0,
    end_time,
    capacity,
    clean_objective,
    clean_progress,
    target,
    clean_unit
  ) returning id into mission_id;

  insert into public.ari_circle_quest_members(quest_id,user_id,status)
  values(mission_id, caller_id, 'joined')
  on conflict do nothing;

  return mission_id;
end;
$$;

revoke all on function public.ari_circle_create_mission_v2(text,text,text,text,text,text,text,numeric,text,timestamptz,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_create_mission_v2(text,text,text,text,text,text,text,numeric,text,timestamptz,integer)
  to authenticated, service_role;

create or replace function public.ari_circle_submit_mission_progress(
  requested_mission_id uuid,
  requested_amount numeric,
  requested_client_event_id uuid,
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
  contribution public.ari_circle_mission_contributions%rowtype;
  clean_note text := nullif(btrim(coalesce(requested_note, '')), '');
  clean_amount numeric(12,2) := round(coalesce(requested_amount, 0)::numeric, 2);
  contribution_status text;
  refreshed jsonb;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to contribute to a Mission'; end if;
  if requested_client_event_id is null then raise exception 'Mission contribution identity is required'; end if;
  if clean_amount <= 0 or clean_amount > 1000000 then raise exception 'Choose a valid Mission contribution'; end if;
  if clean_note is not null and char_length(clean_note) > 500 then raise exception 'Mission note is too long'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id
  for update;

  if not found
     or q.status <> 'active'
     or q.ends_at <= now()
     or q.objective_type = 'completion'
     or q.xp_reward <> 0 then
    raise exception 'Mission unavailable';
  end if;

  if public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id) then
    raise exception 'Mission unavailable';
  end if;

  if not exists (
    select 1
    from public.ari_circle_quest_members qm
    where qm.quest_id = q.id
      and qm.user_id = caller_id
      and qm.status <> 'left'
  ) then
    raise exception 'Join the Mission before contributing';
  end if;

  contribution_status := case when q.verification_mode = 'self' then 'verified' else 'submitted' end;

  insert into public.ari_circle_mission_contributions(
    quest_id,
    user_id,
    client_event_id,
    amount,
    status,
    proof_note,
    verified_at,
    verified_by,
    updated_at
  ) values (
    q.id,
    caller_id,
    requested_client_event_id,
    clean_amount,
    contribution_status,
    clean_note,
    case when contribution_status = 'verified' then now() else null end,
    case when contribution_status = 'verified' then caller_id else null end,
    now()
  )
  on conflict (quest_id,user_id,client_event_id) do nothing;

  select * into contribution
  from public.ari_circle_mission_contributions c
  where c.quest_id = q.id
    and c.user_id = caller_id
    and c.client_event_id = requested_client_event_id;

  if contribution.status = 'verified' then
    refreshed := public.ari_circle_refresh_metric_mission(q.id, caller_id);
  else
    refreshed := jsonb_build_object('updated', false, 'objective_reached', false);
  end if;

  return jsonb_build_object(
    'submitted', true,
    'contribution_id', contribution.id,
    'status', contribution.status,
    'amount', contribution.amount,
    'unit', q.unit,
    'needs_verification', contribution.status = 'submitted',
    'progress', refreshed
  );
end;
$$;

revoke all on function public.ari_circle_submit_mission_progress(uuid,numeric,uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_submit_mission_progress(uuid,numeric,uuid,text)
  to authenticated, service_role;

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
  peer_member boolean := false;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to review Mission progress'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id;

  if not found or q.objective_type = 'completion' then raise exception 'Mission unavailable'; end if;

  select exists (
    select 1 from public.ari_circle_quest_members qm
    where qm.quest_id = q.id and qm.user_id = caller_id and qm.status <> 'left'
  ) into peer_member;

  if caller_id <> q.creator_user_id and not (q.verification_mode = 'peer' and peer_member) then
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
  if not found or q.objective_type = 'completion' or q.verification_mode = 'self' then
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

  if q.verification_mode = 'organizer' and caller_id <> q.creator_user_id then
    raise exception 'Only the Mission organizer can verify this contribution';
  end if;
  if q.verification_mode = 'peer' and not reviewer_is_member then
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

create or replace function public.ari_circle_list_missions_v2(
  result_limit integer default 30
)
returns table (
  mission_id uuid,
  creator_user_id uuid,
  creator_display_name text,
  creator_handle text,
  creator_avatar_url text,
  title text,
  description text,
  scope text,
  category text,
  verification_mode text,
  objective_type text,
  progress_mode text,
  target_value numeric,
  unit text,
  starts_at timestamptz,
  ends_at timestamptz,
  member_count bigint,
  viewer_status text,
  verified_progress numeric,
  viewer_verified_progress numeric,
  viewer_pending_progress numeric,
  progress_percent numeric,
  objective_reached_at timestamptz
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
  if caller_id is null then raise exception 'Sign in to view Missions'; end if;

  return query
  with totals as (
    select
      c.quest_id,
      coalesce(sum(c.amount) filter (where c.status = 'verified'), 0)::numeric as global_verified,
      coalesce(sum(c.amount) filter (where c.status = 'verified' and c.user_id = caller_id), 0)::numeric as viewer_verified,
      coalesce(sum(c.amount) filter (where c.status = 'submitted' and c.user_id = caller_id), 0)::numeric as viewer_pending
    from public.ari_circle_mission_contributions c
    group by c.quest_id
  )
  select
    q.id,
    q.creator_user_id,
    p.display_name,
    p.handle::text,
    p.avatar_url,
    q.title,
    q.description,
    q.scope,
    q.category,
    q.verification_mode,
    q.objective_type,
    q.progress_mode,
    q.target_value,
    q.unit,
    q.starts_at,
    q.ends_at,
    (select count(*) from public.ari_circle_quest_members qm where qm.quest_id = q.id and qm.status <> 'left'),
    (select qm.status from public.ari_circle_quest_members qm where qm.quest_id = q.id and qm.user_id = caller_id),
    case
      when q.objective_type = 'completion' then null
      when q.progress_mode = 'collective' then coalesce(t.global_verified, 0)
      else coalesce(t.viewer_verified, 0)
    end as verified_progress,
    case when q.objective_type = 'completion' then null else coalesce(t.viewer_verified, 0) end,
    case when q.objective_type = 'completion' then null else coalesce(t.viewer_pending, 0) end,
    case
      when q.objective_type = 'completion' or q.target_value is null then null
      else least(
        100::numeric,
        round(
          100 * (
            case when q.progress_mode = 'collective' then coalesce(t.global_verified, 0) else coalesce(t.viewer_verified, 0) end
          ) / q.target_value,
          1
        )
      )
    end as progress_percent,
    q.objective_reached_at
  from public.ari_circle_quests q
  join public.ari_circle_profiles p on p.user_id = q.creator_user_id
  left join totals t on t.quest_id = q.id
  where q.status = 'active'
    and q.ends_at > now()
    and public.ari_circle_user_is_adult(q.creator_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id)
  order by
    case when q.objective_reached_at is null then 0 else 1 end,
    q.ends_at asc,
    q.created_at desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_missions_v2(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_missions_v2(integer)
  to authenticated, service_role;

commit;
