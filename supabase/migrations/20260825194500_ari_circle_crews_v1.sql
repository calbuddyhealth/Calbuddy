-- ARI Circle — Crews V1
-- Persistent private groups that emerge from repeated verified real-world action.
-- A Crew is not a public group-discovery object and cannot be created from an
-- arbitrary friend/follower list. V1 founding candidacy requires the same exact
-- group of 3–8 adults to have completed at least two Meetups together.
--
-- Product/trust rules:
--   - creation never awards XP;
--   - invitees must explicitly accept; nobody is silently enrolled;
--   - a Crew becomes active only after at least three active members;
--   - no exact location, DM content, ratings, follower counts, payment/premium,
--     popularity, or engagement signals are stored here;
--   - direct table access is service-only; authenticated users use guarded RPCs;
--   - creation is retry-safe through a caller-supplied operation UUID;
--   - founding evidence comes only from verified completed Meetup participation.

begin;

create table if not exists public.ari_circle_crews (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 60),
  status text not null default 'forming' check (status in ('forming','active','archived')),
  origin text not null default 'repeated_activity' check (origin = 'repeated_activity'),
  member_fingerprint text not null check (member_fingerprint ~ '^[0-9a-f]{32}$'),
  creation_operation_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  archived_at timestamptz
);

create unique index if not exists ari_circle_crews_active_member_fingerprint_idx
  on public.ari_circle_crews(member_fingerprint)
  where status in ('forming','active');
create index if not exists ari_circle_crews_owner_idx
  on public.ari_circle_crews(owner_user_id, created_at desc);

create table if not exists public.ari_circle_crew_members (
  crew_id uuid not null references public.ari_circle_crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  status text not null default 'invited' check (status in ('invited','active','declined','left')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  responded_at timestamptz,
  left_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (crew_id, user_id),
  constraint ari_circle_crew_owner_active_check
    check (role <> 'owner' or status = 'active')
);

create unique index if not exists ari_circle_crew_single_owner_idx
  on public.ari_circle_crew_members(crew_id)
  where role = 'owner';
create index if not exists ari_circle_crew_members_user_idx
  on public.ari_circle_crew_members(user_id, status, invited_at desc);

create table if not exists public.ari_circle_crew_activity_history (
  crew_id uuid not null references public.ari_circle_crews(id) on delete cascade,
  meetup_id uuid not null references public.ari_circle_meetups(id) on delete cascade,
  source text not null default 'founding_evidence' check (source in ('founding_evidence','crew_activity')),
  recorded_at timestamptz not null default now(),
  primary key (crew_id, meetup_id)
);

create index if not exists ari_circle_crew_activity_history_meetup_idx
  on public.ari_circle_crew_activity_history(meetup_id);

alter table public.ari_circle_crews enable row level security;
alter table public.ari_circle_crew_members enable row level security;
alter table public.ari_circle_crew_activity_history enable row level security;

revoke all on table public.ari_circle_crews from public, anon, authenticated;
revoke all on table public.ari_circle_crew_members from public, anon, authenticated;
revoke all on table public.ari_circle_crew_activity_history from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_crews to service_role;
grant select, insert, update, delete on table public.ari_circle_crew_members to service_role;
grant select, insert, update, delete on table public.ari_circle_crew_activity_history to service_role;

-- ---------------------------------------------------------------------------
-- Read-only Crew candidacy derived from exact repeated group completion.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_list_crew_candidates(
  result_limit integer default 8
)
returns table (
  candidate_key text,
  member_ids uuid[],
  member_count integer,
  completed_together bigint,
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  top_activity text,
  members jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1, least(coalesce(result_limit, 8), 20));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then
    raise exception 'Sign in to view Crew candidates';
  end if;

  return query
  with completed_groups as (
    select
      m.id as meetup_id,
      m.activity,
      coalesce(m.completed_at, m.ends_at) as completed_at,
      array_agg(mp.user_id order by mp.user_id) as member_ids
    from public.ari_circle_meetups m
    join public.ari_circle_meetup_participants mp
      on mp.meetup_id = m.id
    where m.status = 'completed'
      and mp.status = 'joined'
      and mp.completed_at is not null
    group by m.id, m.activity, m.completed_at, m.ends_at
    having count(*) between 3 and 8
      and bool_or(mp.user_id = caller_id)
      and bool_and(public.ari_circle_user_is_adult(mp.user_id))
  ),
  safe_groups as (
    select cg.*
    from completed_groups cg
    where not exists (
      select 1
      from unnest(cg.member_ids) with ordinality a(user_id, position_a)
      cross join unnest(cg.member_ids) with ordinality b(user_id, position_b)
      where a.position_a < b.position_b
        and public.ari_circle_social_pair_is_blocked(a.user_id, b.user_id)
    )
  ),
  group_stats as (
    select
      sg.member_ids,
      md5(array_to_string(sg.member_ids, ',')) as candidate_key,
      count(distinct sg.meetup_id)::bigint as completed_together,
      min(sg.completed_at) as first_completed_at,
      max(sg.completed_at) as last_completed_at
    from safe_groups sg
    group by sg.member_ids
    having count(distinct sg.meetup_id) >= 2
  ),
  activity_counts as (
    select
      sg.member_ids,
      sg.activity,
      count(distinct sg.meetup_id)::bigint as activity_count
    from safe_groups sg
    join group_stats gs on gs.member_ids = sg.member_ids
    group by sg.member_ids, sg.activity
  ),
  top_activities as (
    select distinct on (ac.member_ids)
      ac.member_ids,
      ac.activity as top_activity
    from activity_counts ac
    order by ac.member_ids, ac.activity_count desc, ac.activity asc
  )
  select
    gs.candidate_key,
    gs.member_ids,
    cardinality(gs.member_ids)::integer as member_count,
    gs.completed_together,
    gs.first_completed_at,
    gs.last_completed_at,
    ta.top_activity,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'display_name', cp.display_name,
          'handle', cp.handle,
          'avatar_url', cp.avatar_url,
          'is_viewer', cp.user_id = caller_id
        )
        order by array_position(gs.member_ids, cp.user_id)
      )
      from unnest(gs.member_ids) as candidate_user(user_id)
      join public.ari_circle_profiles cp
        on cp.user_id = candidate_user.user_id
      where public.ari_circle_user_is_adult(cp.user_id)
    ), '[]'::jsonb) as members
  from group_stats gs
  left join top_activities ta on ta.member_ids = gs.member_ids
  where not exists (
    select 1
    from public.ari_circle_crews existing
    where existing.member_fingerprint = gs.candidate_key
      and existing.status in ('forming','active')
  )
  order by
    gs.completed_together desc,
    gs.last_completed_at desc,
    gs.candidate_key asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_crew_candidates(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_crew_candidates(integer)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Create a private Crew from a currently valid repeated-group candidate.
-- The creator is active immediately; all other founding members are invitations.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_create_crew(
  requested_candidate_key text,
  requested_name text,
  requested_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_key text := lower(btrim(coalesce(requested_candidate_key, '')));
  clean_name text := btrim(coalesce(requested_name, ''));
  candidate record;
  existing_id uuid;
  crew_id uuid;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to create a Crew'; end if;
  if requested_operation_id is null then raise exception 'Crew operation identity is required'; end if;
  if clean_key !~ '^[0-9a-f]{32}$' then raise exception 'Crew candidate is invalid'; end if;
  if char_length(clean_name) < 3 or char_length(clean_name) > 60 then
    raise exception 'Crew name must be 3 to 60 characters';
  end if;

  select c.id into existing_id
  from public.ari_circle_crews c
  where c.creation_operation_id = requested_operation_id
    and c.owner_user_id = caller_id;
  if existing_id is not null then
    return jsonb_build_object('crew_id', existing_id, 'replayed', true);
  end if;

  perform pg_advisory_xact_lock(hashtextextended(concat(caller_id, ':crew:', clean_key), 0));

  select * into candidate
  from public.ari_circle_list_crew_candidates(20) cc
  where cc.candidate_key = clean_key
  limit 1;

  if not found then
    raise exception 'Crew candidate is no longer available';
  end if;
  if cardinality(candidate.member_ids) < 3 or cardinality(candidate.member_ids) > 8 then
    raise exception 'Crew candidate size is invalid';
  end if;
  if not (caller_id = any(candidate.member_ids)) then
    raise exception 'Crew candidate is unavailable';
  end if;

  insert into public.ari_circle_crews(
    owner_user_id,
    name,
    status,
    origin,
    member_fingerprint,
    creation_operation_id
  ) values (
    caller_id,
    clean_name,
    'forming',
    'repeated_activity',
    clean_key,
    requested_operation_id
  )
  returning id into crew_id;

  insert into public.ari_circle_crew_members(
    crew_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at,
    responded_at
  )
  select
    crew_id,
    candidate_user.user_id,
    case when candidate_user.user_id = caller_id then 'owner' else 'member' end,
    case when candidate_user.user_id = caller_id then 'active' else 'invited' end,
    caller_id,
    now(),
    case when candidate_user.user_id = caller_id then now() else null end,
    case when candidate_user.user_id = caller_id then now() else null end
  from unnest(candidate.member_ids) as candidate_user(user_id);

  -- Preserve only the verified completed Meetups that prove this exact founding
  -- group repeatedly acted together. This creates history, not XP or ranking.
  insert into public.ari_circle_crew_activity_history(crew_id, meetup_id, source)
  select crew_id, evidence.meetup_id, 'founding_evidence'
  from (
    select
      m.id as meetup_id,
      array_agg(mp.user_id order by mp.user_id) as member_ids
    from public.ari_circle_meetups m
    join public.ari_circle_meetup_participants mp
      on mp.meetup_id = m.id
    where m.status = 'completed'
      and mp.status = 'joined'
      and mp.completed_at is not null
    group by m.id
    having count(*) between 3 and 8
      and bool_and(public.ari_circle_user_is_adult(mp.user_id))
  ) evidence
  where evidence.member_ids = candidate.member_ids
  on conflict do nothing;

  return jsonb_build_object(
    'crew_id', crew_id,
    'status', 'forming',
    'invited_count', cardinality(candidate.member_ids) - 1,
    'founding_completed_together', candidate.completed_together,
    'replayed', false
  );
end;
$$;

revoke all on function public.ari_circle_create_crew(text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_create_crew(text,text,uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Accept or decline a founding Crew invitation.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_respond_crew_invite(
  requested_crew_id uuid,
  requested_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  membership public.ari_circle_crew_members%rowtype;
  crew public.ari_circle_crews%rowtype;
  active_count integer := 0;
  next_status text;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to respond to a Crew invite'; end if;
  if requested_crew_id is null or requested_accept is null then raise exception 'Crew response is required'; end if;

  select * into membership
  from public.ari_circle_crew_members cm
  where cm.crew_id = requested_crew_id and cm.user_id = caller_id
  for update;
  if not found then raise exception 'Crew invitation unavailable'; end if;

  select * into crew from public.ari_circle_crews c where c.id = requested_crew_id for update;
  if not found or crew.status = 'archived' then raise exception 'Crew invitation unavailable'; end if;
  if membership.role = 'owner' then raise exception 'Crew owner does not respond to an invitation'; end if;

  next_status := case when requested_accept then 'active' else 'declined' end;
  if membership.status = next_status then
    select count(*)::integer into active_count
    from public.ari_circle_crew_members cm
    where cm.crew_id = requested_crew_id and cm.status = 'active';
    return jsonb_build_object('crew_id', requested_crew_id, 'member_status', next_status, 'crew_status', crew.status, 'active_member_count', active_count, 'replayed', true);
  end if;
  if membership.status <> 'invited' then raise exception 'Crew invitation is no longer pending'; end if;

  if requested_accept and exists (
    select 1
    from public.ari_circle_crew_members other
    where other.crew_id = requested_crew_id
      and other.user_id <> caller_id
      and other.status = 'active'
      and public.ari_circle_social_pair_is_blocked(caller_id, other.user_id)
  ) then
    raise exception 'Crew invitation is unavailable';
  end if;

  update public.ari_circle_crew_members
  set
    status = next_status,
    joined_at = case when requested_accept then coalesce(joined_at, now()) else joined_at end,
    responded_at = now(),
    updated_at = now()
  where crew_id = requested_crew_id and user_id = caller_id;

  select count(*)::integer into active_count
  from public.ari_circle_crew_members cm
  where cm.crew_id = requested_crew_id and cm.status = 'active';

  if active_count >= 3 and crew.status = 'forming' then
    update public.ari_circle_crews
    set status = 'active', activated_at = coalesce(activated_at, now()), updated_at = now()
    where id = requested_crew_id;
    crew.status := 'active';
  end if;

  return jsonb_build_object(
    'crew_id', requested_crew_id,
    'member_status', next_status,
    'crew_status', crew.status,
    'active_member_count', active_count,
    'replayed', false
  );
end;
$$;

revoke all on function public.ari_circle_respond_crew_invite(uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.ari_circle_respond_crew_invite(uuid,boolean)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Members may leave; owners archive instead of orphaning a Crew.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_leave_crew(requested_crew_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  membership public.ari_circle_crew_members%rowtype;
  active_count integer := 0;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to leave a Crew'; end if;

  select * into membership
  from public.ari_circle_crew_members cm
  where cm.crew_id = requested_crew_id and cm.user_id = caller_id
  for update;
  if not found then raise exception 'Crew membership unavailable'; end if;
  if membership.role = 'owner' then raise exception 'Crew owners archive the Crew instead of leaving it'; end if;
  if membership.status = 'left' then
    return jsonb_build_object('crew_id', requested_crew_id, 'member_status', 'left', 'replayed', true);
  end if;
  if membership.status <> 'active' then raise exception 'Active Crew membership required'; end if;

  update public.ari_circle_crew_members
  set status = 'left', left_at = now(), updated_at = now()
  where crew_id = requested_crew_id and user_id = caller_id;

  select count(*)::integer into active_count
  from public.ari_circle_crew_members cm
  where cm.crew_id = requested_crew_id and cm.status = 'active';

  -- If a Crew falls below three active people it returns to forming rather than
  -- deleting history or coercing anyone to remain.
  if active_count < 3 then
    update public.ari_circle_crews
    set status = 'forming', updated_at = now()
    where id = requested_crew_id and status = 'active';
  end if;

  return jsonb_build_object('crew_id', requested_crew_id, 'member_status', 'left', 'active_member_count', active_count, 'replayed', false);
end;
$$;

revoke all on function public.ari_circle_leave_crew(uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_leave_crew(uuid)
  to authenticated, service_role;

create or replace function public.ari_circle_archive_crew(requested_crew_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  crew public.ari_circle_crews%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to archive a Crew'; end if;

  select * into crew
  from public.ari_circle_crews c
  where c.id = requested_crew_id
  for update;
  if not found or crew.owner_user_id <> caller_id then raise exception 'Crew unavailable'; end if;

  if crew.status = 'archived' then
    return jsonb_build_object('crew_id', requested_crew_id, 'status', 'archived', 'replayed', true);
  end if;

  update public.ari_circle_crews
  set status = 'archived', archived_at = now(), updated_at = now()
  where id = requested_crew_id;

  return jsonb_build_object('crew_id', requested_crew_id, 'status', 'archived', 'replayed', false);
end;
$$;

revoke all on function public.ari_circle_archive_crew(uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_archive_crew(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Private caller-scoped Crew projection. There is no public Crew directory.
-- Blocked member identities are omitted from the roster at read time.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_list_my_crews(result_limit integer default 20)
returns table (
  crew_id uuid,
  name text,
  crew_status text,
  viewer_role text,
  viewer_status text,
  active_member_count integer,
  invited_member_count integer,
  completed_activity_count integer,
  last_activity_at timestamptz,
  created_at timestamptz,
  members jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to view Crews'; end if;

  return query
  select
    c.id,
    c.name,
    c.status,
    mine.role,
    mine.status,
    (select count(*)::integer from public.ari_circle_crew_members cm where cm.crew_id = c.id and cm.status = 'active'),
    (select count(*)::integer from public.ari_circle_crew_members cm where cm.crew_id = c.id and cm.status = 'invited'),
    (select count(*)::integer from public.ari_circle_crew_activity_history h where h.crew_id = c.id),
    (select max(coalesce(m.completed_at, m.ends_at)) from public.ari_circle_crew_activity_history h join public.ari_circle_meetups m on m.id = h.meetup_id where h.crew_id = c.id),
    c.created_at,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', cm.user_id,
          'display_name', cp.display_name,
          'handle', cp.handle,
          'avatar_url', cp.avatar_url,
          'role', cm.role,
          'status', cm.status,
          'is_viewer', cm.user_id = caller_id
        )
        order by case when cm.role = 'owner' then 0 else 1 end, lower(coalesce(cp.display_name, '')), cm.user_id
      )
      from public.ari_circle_crew_members cm
      join public.ari_circle_profiles cp on cp.user_id = cm.user_id
      where cm.crew_id = c.id
        and cm.status in ('invited','active')
        and public.ari_circle_user_is_adult(cm.user_id)
        and (
          cm.user_id = caller_id
          or not public.ari_circle_social_pair_is_blocked(caller_id, cm.user_id)
        )
    ), '[]'::jsonb)
  from public.ari_circle_crew_members mine
  join public.ari_circle_crews c on c.id = mine.crew_id
  where mine.user_id = caller_id
    and mine.status in ('invited','active')
  order by
    case c.status when 'active' then 0 when 'forming' then 1 else 2 end,
    c.updated_at desc,
    c.id asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_my_crews(integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_my_crews(integer)
  to authenticated, service_role;

commit;
