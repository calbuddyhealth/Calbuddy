-- ARI Circle V5 — Real World Social
-- Server-authoritative Meet Up + Quests + conservative Real World XP.
-- XP policy: 10 XP/day, 70 XP/week. Intent/social engagement never earns XP.

begin;

-- ---------------------------------------------------------------------------
-- Real World XP ledger
-- ---------------------------------------------------------------------------
create table if not exists public.ari_circle_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_amount smallint not null check (xp_amount > 0 and xp_amount <= 10),
  source_type text not null check (source_type in ('meetup','quest','community_mission','admin_adjustment')),
  source_id uuid,
  reason text not null,
  verification_level text not null default 'verified' check (verification_level in ('verified','organizer_verified','system_verified')),
  idempotency_key text not null unique,
  xp_day date not null default (timezone('UTC', now())::date),
  xp_week_start date not null default (date_trunc('week', timezone('UTC', now()))::date),
  awarded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ari_circle_xp_events_user_awarded_idx
  on public.ari_circle_xp_events(user_id, awarded_at desc);
create index if not exists ari_circle_xp_events_user_day_idx
  on public.ari_circle_xp_events(user_id, xp_day);
create index if not exists ari_circle_xp_events_user_week_idx
  on public.ari_circle_xp_events(user_id, xp_week_start);

alter table public.ari_circle_xp_events enable row level security;
revoke all on table public.ari_circle_xp_events from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_xp_events to service_role;

-- ---------------------------------------------------------------------------
-- Meet Ups
-- ---------------------------------------------------------------------------
create table if not exists public.ari_circle_meetups (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 90),
  activity text not null check (activity in (
    'walking','gym','running','hiking','sports','cycling','yoga',
    'coffee','food','community','volunteer','other'
  )),
  description text,
  area text not null check (char_length(btrim(area)) between 2 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_participants smallint not null default 8 check (max_participants between 2 and 50),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  participant_xp smallint not null default 4 check (participant_xp between 0 and 4),
  host_bonus_xp smallint not null default 2 check (host_bonus_xp between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ari_circle_meetups_valid_window check (ends_at > starts_at),
  constraint ari_circle_meetups_duration_cap check (ends_at <= starts_at + interval '8 hours')
);

create index if not exists ari_circle_meetups_upcoming_idx
  on public.ari_circle_meetups(status, starts_at);
create index if not exists ari_circle_meetups_host_idx
  on public.ari_circle_meetups(host_user_id, starts_at desc);
create index if not exists ari_circle_meetups_activity_idx
  on public.ari_circle_meetups(activity, starts_at);

create table if not exists public.ari_circle_meetup_participants (
  meetup_id uuid not null references public.ari_circle_meetups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'participant' check (role in ('host','participant')),
  status text not null default 'joined' check (status in ('joined','left')),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

create index if not exists ari_circle_meetup_participants_user_idx
  on public.ari_circle_meetup_participants(user_id, joined_at desc);

alter table public.ari_circle_meetups enable row level security;
alter table public.ari_circle_meetup_participants enable row level security;
revoke all on table public.ari_circle_meetups from public, anon, authenticated;
revoke all on table public.ari_circle_meetup_participants from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_meetups to service_role;
grant select, insert, update, delete on table public.ari_circle_meetup_participants to service_role;

-- ---------------------------------------------------------------------------
-- Quests / community missions. XP-bearing quests are intentionally restricted.
-- ---------------------------------------------------------------------------
create table if not exists public.ari_circle_quests (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 90),
  description text,
  scope text not null default 'community' check (scope in ('personal','community','crew')),
  category text not null default 'activity' check (category in ('activity','walking','fitness','community','volunteer','wellness','other')),
  verification_mode text not null default 'organizer' check (verification_mode in ('self','organizer','peer')),
  xp_reward smallint not null default 0 check (xp_reward between 0 and 3),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  max_participants integer check (max_participants is null or max_participants between 2 and 500),
  status text not null default 'active' check (status in ('active','ended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_circle_quests_valid_window check (ends_at > starts_at)
);

create table if not exists public.ari_circle_quest_members (
  quest_id uuid not null references public.ari_circle_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'joined' check (status in ('joined','submitted','verified','rejected','left')),
  joined_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  proof_note text,
  updated_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);

create index if not exists ari_circle_quests_active_idx
  on public.ari_circle_quests(status, ends_at);
create index if not exists ari_circle_quest_members_user_idx
  on public.ari_circle_quest_members(user_id, joined_at desc);

alter table public.ari_circle_quests enable row level security;
alter table public.ari_circle_quest_members enable row level security;
revoke all on table public.ari_circle_quests from public, anon, authenticated;
revoke all on table public.ari_circle_quest_members from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_quests to service_role;
grant select, insert, update, delete on table public.ari_circle_quest_members to service_role;

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_award_xp_capped(
  target_user_id uuid,
  requested_amount integer,
  requested_source_type text,
  requested_source_id uuid,
  requested_reason text,
  requested_verification_level text default 'verified'
)
returns integer
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  desired integer := greatest(0, least(coalesce(requested_amount, 0), 10));
  day_total integer := 0;
  week_total integer := 0;
  award integer := 0;
  today_utc date := timezone('UTC', now())::date;
  week_utc date := date_trunc('week', timezone('UTC', now()))::date;
  key_text text;
begin
  if target_user_id is null or desired <= 0 or requested_source_id is null then return 0; end if;
  if requested_source_type not in ('meetup','quest','community_mission','admin_adjustment') then return 0; end if;

  key_text := concat(target_user_id, ':', requested_source_type, ':', requested_source_id, ':', requested_reason);
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 0));

  if exists (select 1 from public.ari_circle_xp_events x where x.idempotency_key = key_text) then
    return 0;
  end if;

  select coalesce(sum(xp_amount),0)::integer into day_total
  from public.ari_circle_xp_events
  where user_id = target_user_id and xp_day = today_utc;

  select coalesce(sum(xp_amount),0)::integer into week_total
  from public.ari_circle_xp_events
  where user_id = target_user_id and xp_week_start = week_utc;

  award := least(desired, greatest(0, 10 - day_total), greatest(0, 70 - week_total));
  if award <= 0 then return 0; end if;

  insert into public.ari_circle_xp_events (
    user_id, xp_amount, source_type, source_id, reason, verification_level,
    idempotency_key, xp_day, xp_week_start
  ) values (
    target_user_id, award, requested_source_type, requested_source_id, requested_reason,
    case when requested_verification_level in ('verified','organizer_verified','system_verified')
      then requested_verification_level else 'verified' end,
    key_text, today_utc, week_utc
  );

  return award;
end;
$$;

revoke all on function public.ari_circle_award_xp_capped(uuid,integer,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.ari_circle_award_xp_capped(uuid,integer,text,uuid,text,text) to service_role;

create or replace function public.ari_circle_leadership_tier(target_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  hosted_count integer := 0;
begin
  select count(*)::integer into hosted_count
  from public.ari_circle_meetups m
  where m.host_user_id = target_user_id and m.status = 'completed';

  return case
    when hosted_count >= 50 then 'community_builder'
    when hosted_count >= 25 then 'community_leader'
    when hosted_count >= 10 then 'active_host'
    when hosted_count >= 3 then 'organizer'
    else 'new_host'
  end;
end;
$$;

revoke all on function public.ari_circle_leadership_tier(uuid) from public, anon;
grant execute on function public.ari_circle_leadership_tier(uuid) to authenticated, service_role;

create or replace function public.ari_circle_xp_summary(target_user_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  subject_id uuid := coalesce(target_user_id, auth.uid());
  total_xp integer := 0;
  today_xp integer := 0;
  week_xp integer := 0;
  verified_meetups integer := 0;
  hosted_meetups integer := 0;
  today_utc date := timezone('UTC', now())::date;
  week_utc date := date_trunc('week', timezone('UTC', now()))::date;
  active_hosted jsonb := null;
  tier text;
begin
  perform public.ari_circle_assert_adult_access();
  if subject_id is null or not public.ari_circle_user_is_adult(subject_id) then
    raise exception 'ARI Circle profile unavailable';
  end if;
  if caller_id <> subject_id and not public.ari_circle_can_view_user(subject_id) then
    raise exception 'ARI Circle profile unavailable';
  end if;

  select
    coalesce(sum(xp_amount),0)::integer,
    coalesce(sum(xp_amount) filter (where xp_day = today_utc),0)::integer,
    coalesce(sum(xp_amount) filter (where xp_week_start = week_utc),0)::integer
  into total_xp, today_xp, week_xp
  from public.ari_circle_xp_events
  where user_id = subject_id;

  select count(*)::integer into verified_meetups
  from public.ari_circle_meetup_participants p
  join public.ari_circle_meetups m on m.id = p.meetup_id
  where p.user_id = subject_id
    and p.status = 'joined'
    and p.completed_at is not null
    and m.status = 'completed';

  select count(*)::integer into hosted_meetups
  from public.ari_circle_meetups m
  where m.host_user_id = subject_id and m.status = 'completed';

  tier := public.ari_circle_leadership_tier(subject_id);

  select jsonb_build_object(
    'id', m.id,
    'title', m.title,
    'activity', m.activity,
    'area', m.area,
    'starts_at', m.starts_at,
    'ends_at', m.ends_at,
    'max_participants', m.max_participants,
    'participant_count', (
      select count(*) from public.ari_circle_meetup_participants p
      where p.meetup_id = m.id and p.status = 'joined'
    )
  ) into active_hosted
  from public.ari_circle_meetups m
  where m.host_user_id = subject_id
    and m.status = 'scheduled'
    and m.ends_at > now()
  order by m.starts_at asc
  limit 1;

  return jsonb_build_object(
    'total_xp', total_xp,
    'today_xp', today_xp,
    'week_xp', week_xp,
    'daily_cap', 10,
    'weekly_cap', 70,
    'level', 1 + floor(total_xp / 100.0)::integer,
    'level_progress_xp', mod(total_xp, 100),
    'level_size_xp', 100,
    'verified_meetups', verified_meetups,
    'successful_hosts', hosted_meetups,
    'leadership_tier', tier,
    'active_hosted_meetup', active_hosted
  );
end;
$$;

revoke all on function public.ari_circle_xp_summary(uuid) from public, anon;
grant execute on function public.ari_circle_xp_summary(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Meet Up RPCs
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_create_meetup(
  requested_title text,
  requested_activity text,
  requested_area text,
  requested_starts_at timestamptz,
  requested_duration_minutes integer default 60,
  requested_max_participants integer default 8,
  requested_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  meetup_id uuid;
  clean_title text := btrim(coalesce(requested_title,''));
  clean_activity text := lower(btrim(coalesce(requested_activity,'')));
  clean_area text := btrim(coalesce(requested_area,''));
  duration_minutes integer := greatest(30, least(coalesce(requested_duration_minutes,60),480));
  capacity integer := greatest(2, least(coalesce(requested_max_participants,8),50));
begin
  perform public.ari_circle_assert_adult_access();
  if char_length(clean_title) < 3 or char_length(clean_title) > 90 then raise exception 'Meetup title must be 3-90 characters'; end if;
  if clean_activity not in ('walking','gym','running','hiking','sports','cycling','yoga','coffee','food','community','volunteer','other') then raise exception 'Unsupported meetup activity'; end if;
  if char_length(clean_area) < 2 or char_length(clean_area) > 100 then raise exception 'Use a broad city or area'; end if;
  if requested_starts_at is null or requested_starts_at < now() + interval '10 minutes' then raise exception 'Meetup must start at least 10 minutes from now'; end if;
  if requested_starts_at > now() + interval '60 days' then raise exception 'Meetup is too far in the future'; end if;

  insert into public.ari_circle_meetups (
    host_user_id, title, activity, description, area, starts_at, ends_at, max_participants
  ) values (
    caller_id, clean_title, clean_activity, nullif(btrim(coalesce(requested_description,'')),''), clean_area,
    requested_starts_at, requested_starts_at + make_interval(mins => duration_minutes), capacity
  ) returning id into meetup_id;

  insert into public.ari_circle_meetup_participants(meetup_id,user_id,role,status)
  values (meetup_id,caller_id,'host','joined');

  return meetup_id;
end;
$$;

revoke all on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text) from public, anon;
grant execute on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text) to authenticated;

create or replace function public.ari_circle_list_meetups(
  requested_activity text default null,
  requested_window text default 'upcoming',
  result_limit integer default 30
)
returns table (
  meetup_id uuid,
  title text,
  activity text,
  description text,
  area text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_participants smallint,
  host_user_id uuid,
  host_display_name text,
  host_handle text,
  host_avatar_url text,
  participant_count bigint,
  viewer_joined boolean,
  viewer_completed boolean,
  viewer_is_host boolean,
  participant_xp smallint,
  host_total_xp integer,
  host_leadership_tier text
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity,''))), '');
  cap integer := greatest(1, least(coalesce(result_limit,30),50));
begin
  perform public.ari_circle_assert_adult_access();

  return query
  select
    m.id,
    m.title,
    m.activity,
    m.description,
    m.area,
    m.starts_at,
    m.ends_at,
    m.max_participants,
    m.host_user_id,
    cp.display_name,
    cp.handle::text,
    cp.avatar_url,
    (select count(*) from public.ari_circle_meetup_participants pc where pc.meetup_id=m.id and pc.status='joined'),
    exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.status='joined'),
    exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.completed_at is not null),
    m.host_user_id = caller_id,
    m.participant_xp,
    coalesce((select sum(x.xp_amount)::integer from public.ari_circle_xp_events x where x.user_id=m.host_user_id),0),
    public.ari_circle_leadership_tier(m.host_user_id)
  from public.ari_circle_meetups m
  join public.ari_circle_profiles cp on cp.user_id = m.host_user_id
  where m.status='scheduled'
    and m.ends_at > now()
    and (clean_activity is null or m.activity=clean_activity)
    and public.ari_circle_user_is_adult(m.host_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id)
    and (
      requested_window not in ('today','weekend')
      or (requested_window='today' and m.starts_at < date_trunc('day',now()) + interval '1 day')
      or (requested_window='weekend' and extract(isodow from m.starts_at) in (6,7))
    )
  order by m.starts_at asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_meetups(text,text,integer) from public, anon;
grant execute on function public.ari_circle_list_meetups(text,text,integer) to authenticated;

create or replace function public.ari_circle_join_meetup(requested_meetup_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  joined_count integer;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status <> 'scheduled' then raise exception 'Meetup unavailable'; end if;
  if m.starts_at <= now() then raise exception 'This meetup has already started'; end if;
  if public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id) then raise exception 'Meetup unavailable'; end if;

  select count(*)::integer into joined_count from public.ari_circle_meetup_participants where meetup_id=m.id and status='joined';
  if joined_count >= m.max_participants and not exists(
    select 1 from public.ari_circle_meetup_participants where meetup_id=m.id and user_id=caller_id and status='joined'
  ) then raise exception 'This meetup is full'; end if;

  insert into public.ari_circle_meetup_participants(meetup_id,user_id,role,status,completed_at,updated_at)
  values(m.id,caller_id,case when caller_id=m.host_user_id then 'host' else 'participant' end,'joined',null,now())
  on conflict(meetup_id,user_id) do update set status='joined', completed_at=null, updated_at=now();

  return jsonb_build_object('joined',true,'meetup_id',m.id,'xp_on_verified_completion',case when caller_id=m.host_user_id then m.participant_xp+m.host_bonus_xp else m.participant_xp end);
end;
$$;

revoke all on function public.ari_circle_join_meetup(uuid) from public, anon;
grant execute on function public.ari_circle_join_meetup(uuid) to authenticated;

create or replace function public.ari_circle_leave_meetup(requested_meetup_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status <> 'scheduled' then return false; end if;
  if caller_id=m.host_user_id then raise exception 'Hosts must cancel the meetup instead'; end if;
  if m.starts_at <= now() then raise exception 'You cannot leave after the meetup starts'; end if;
  update public.ari_circle_meetup_participants set status='left', completed_at=null, updated_at=now()
  where meetup_id=m.id and user_id=caller_id;
  return found;
end;
$$;

revoke all on function public.ari_circle_leave_meetup(uuid) from public, anon;
grant execute on function public.ari_circle_leave_meetup(uuid) to authenticated;

create or replace function public.ari_circle_cancel_meetup(requested_meetup_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
begin
  perform public.ari_circle_assert_adult_access();
  update public.ari_circle_meetups
  set status='cancelled',updated_at=now()
  where id=requested_meetup_id and host_user_id=caller_id and status='scheduled' and starts_at>now();
  return found;
end;
$$;

revoke all on function public.ari_circle_cancel_meetup(uuid) from public, anon;
grant execute on function public.ari_circle_cancel_meetup(uuid) to authenticated;

create or replace function public.ari_circle_complete_meetup(requested_meetup_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  participant_count integer := 0;
  incomplete_count integer := 0;
  row_item record;
  awarded integer := 0;
  caller_award integer := 0;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status='cancelled' then raise exception 'Meetup unavailable'; end if;
  if m.status='completed' then
    return jsonb_build_object('settled',true,'already_settled',true,'xp_awarded',0,'waiting_on',0);
  end if;
  if now() < m.ends_at then raise exception 'Completion opens after the meetup ends'; end if;
  if now() > m.ends_at + interval '48 hours' then raise exception 'The completion window has closed'; end if;

  update public.ari_circle_meetup_participants
  set completed_at=coalesce(completed_at,now()),updated_at=now()
  where meetup_id=m.id and user_id=caller_id and status='joined';
  if not found then raise exception 'Join this meetup before completing it'; end if;

  select count(*)::integer,
         count(*) filter (where completed_at is null)::integer
  into participant_count,incomplete_count
  from public.ari_circle_meetup_participants
  where meetup_id=m.id and status='joined';

  if incomplete_count > 0 then
    return jsonb_build_object(
      'settled',false,
      'xp_awarded',0,
      'waiting_on',incomplete_count,
      'participant_count',participant_count,
      'message','XP releases after every participant presses Complete.'
    );
  end if;

  update public.ari_circle_meetups
  set status='completed',completed_at=now(),updated_at=now()
  where id=m.id;

  if participant_count < 2 then
    return jsonb_build_object(
      'settled',true,'xp_awarded',0,'waiting_on',0,'participant_count',participant_count,
      'message','Meetup completed. At least two verified participants are required for XP.'
    );
  end if;

  for row_item in
    select p.user_id,p.role from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.status='joined' and p.completed_at is not null
  loop
    awarded := public.ari_circle_award_xp_capped(
      row_item.user_id,
      m.participant_xp + case when row_item.role='host' then m.host_bonus_xp else 0 end,
      'meetup',m.id,
      case when row_item.role='host' then 'verified_meetup_host' else 'verified_meetup_participant' end,
      'verified'
    );
    if row_item.user_id=caller_id then caller_award := awarded; end if;
  end loop;

  return jsonb_build_object(
    'settled',true,'xp_awarded',caller_award,'waiting_on',0,'participant_count',participant_count,
    'message','Meetup verified. XP was released within the daily and weekly caps.'
  );
end;
$$;

revoke all on function public.ari_circle_complete_meetup(uuid) from public, anon;
grant execute on function public.ari_circle_complete_meetup(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Quest RPCs
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_can_create_xp_quest(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select
    public.ari_circle_leadership_tier(target_user_id) in ('active_host','community_leader','community_builder')
    or exists (
      select 1 from public.profiles p
      where p.id=target_user_id and (coalesce(p.owner_access,false) or coalesce(p.is_admin,false))
    );
$$;

revoke all on function public.ari_circle_can_create_xp_quest(uuid) from public, anon;
grant execute on function public.ari_circle_can_create_xp_quest(uuid) to authenticated, service_role;

create or replace function public.ari_circle_create_quest(
  requested_title text,
  requested_description text,
  requested_scope text default 'community',
  requested_category text default 'activity',
  requested_verification_mode text default 'organizer',
  requested_xp_reward integer default 0,
  requested_ends_at timestamptz default null,
  requested_max_participants integer default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  quest_id uuid;
  reward integer := greatest(0,least(coalesce(requested_xp_reward,0),3));
  end_time timestamptz := coalesce(requested_ends_at,now()+interval '7 days');
begin
  perform public.ari_circle_assert_adult_access();
  if char_length(btrim(coalesce(requested_title,''))) not between 3 and 90 then raise exception 'Quest title must be 3-90 characters'; end if;
  if requested_scope not in ('personal','community','crew') then raise exception 'Unsupported quest scope'; end if;
  if requested_category not in ('activity','walking','fitness','community','volunteer','wellness','other') then raise exception 'Unsupported quest category'; end if;
  if requested_verification_mode not in ('self','organizer','peer') then raise exception 'Unsupported verification mode'; end if;
  if end_time <= now()+interval '30 minutes' or end_time > now()+interval '90 days' then raise exception 'Choose a valid quest end time'; end if;
  if reward > 0 and not public.ari_circle_can_create_xp_quest(caller_id) then
    raise exception 'XP-bearing Community Quests unlock for established Community Leaders';
  end if;
  if reward > 0 and requested_verification_mode='self' then
    raise exception 'XP-bearing quests require another person to verify completion';
  end if;

  insert into public.ari_circle_quests(
    creator_user_id,title,description,scope,category,verification_mode,xp_reward,ends_at,max_participants
  ) values (
    caller_id,btrim(requested_title),nullif(btrim(coalesce(requested_description,'')),''),requested_scope,
    requested_category,requested_verification_mode,reward,end_time,
    case when requested_max_participants is null then null else greatest(2,least(requested_max_participants,500)) end
  ) returning id into quest_id;

  insert into public.ari_circle_quest_members(quest_id,user_id,status)
  values(quest_id,caller_id,'joined') on conflict do nothing;
  return quest_id;
end;
$$;

revoke all on function public.ari_circle_create_quest(text,text,text,text,text,integer,timestamptz,integer) from public, anon;
grant execute on function public.ari_circle_create_quest(text,text,text,text,text,integer,timestamptz,integer) to authenticated;

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
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1,least(coalesce(result_limit,30),50));
begin
  perform public.ari_circle_assert_adult_access();
  return query
  select q.id,q.creator_user_id,p.display_name,p.handle::text,q.title,q.description,q.scope,q.category,
         q.verification_mode,q.xp_reward,q.ends_at,
         (select count(*) from public.ari_circle_quest_members qm where qm.quest_id=q.id and qm.status<>'left'),
         (select qm.status from public.ari_circle_quest_members qm where qm.quest_id=q.id and qm.user_id=caller_id),
         public.ari_circle_leadership_tier(q.creator_user_id)
  from public.ari_circle_quests q
  join public.ari_circle_profiles p on p.user_id=q.creator_user_id
  where q.status='active' and q.ends_at>now()
    and public.ari_circle_user_is_adult(q.creator_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,q.creator_user_id)
  order by q.created_at desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_quests(integer) from public, anon;
grant execute on function public.ari_circle_list_quests(integer) to authenticated;

create or replace function public.ari_circle_join_quest(requested_quest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  member_count integer;
begin
  perform public.ari_circle_assert_adult_access();
  select * into q from public.ari_circle_quests where id=requested_quest_id and status='active' and ends_at>now() for update;
  if not found then raise exception 'Quest unavailable'; end if;
  if q.max_participants is not null then
    select count(*)::integer into member_count from public.ari_circle_quest_members where quest_id=q.id and status<>'left';
    if member_count>=q.max_participants and not exists(select 1 from public.ari_circle_quest_members where quest_id=q.id and user_id=caller_id and status<>'left') then raise exception 'Quest is full'; end if;
  end if;
  insert into public.ari_circle_quest_members(quest_id,user_id,status,submitted_at,verified_at,verified_by,updated_at)
  values(q.id,caller_id,'joined',null,null,null,now())
  on conflict(quest_id,user_id) do update set status='joined',submitted_at=null,verified_at=null,verified_by=null,updated_at=now();
  return true;
end;
$$;

revoke all on function public.ari_circle_join_quest(uuid) from public, anon;
grant execute on function public.ari_circle_join_quest(uuid) to authenticated;

create or replace function public.ari_circle_submit_quest_completion(requested_quest_id uuid, requested_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  select * into q from public.ari_circle_quests where id=requested_quest_id and status='active' and ends_at>now();
  if not found then raise exception 'Quest unavailable'; end if;
  update public.ari_circle_quest_members
  set status=case when q.xp_reward=0 and q.verification_mode='self' then 'verified' else 'submitted' end,
      submitted_at=now(),
      verified_at=case when q.xp_reward=0 and q.verification_mode='self' then now() else null end,
      proof_note=nullif(btrim(coalesce(requested_note,'')),''),updated_at=now()
  where quest_id=q.id and user_id=caller_id and status in ('joined','rejected');
  if not found then raise exception 'Join the quest before completing it'; end if;
  return jsonb_build_object(
    'submitted',true,
    'needs_verification',not (q.xp_reward=0 and q.verification_mode='self'),
    'xp_reward',q.xp_reward
  );
end;
$$;

revoke all on function public.ari_circle_submit_quest_completion(uuid,text) from public, anon;
grant execute on function public.ari_circle_submit_quest_completion(uuid,text) to authenticated;

create or replace function public.ari_circle_verify_quest_completion(requested_quest_id uuid, target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  award integer := 0;
begin
  perform public.ari_circle_assert_adult_access();
  select * into q from public.ari_circle_quests where id=requested_quest_id for update;
  if not found or q.status<>'active' then raise exception 'Quest unavailable'; end if;
  if caller_id=target_user_id then raise exception 'You cannot verify your own XP-bearing completion'; end if;
  if caller_id<>q.creator_user_id and not public.ari_circle_can_create_xp_quest(caller_id) then raise exception 'Organizer verification required'; end if;

  update public.ari_circle_quest_members
  set status='verified',verified_at=now(),verified_by=caller_id,updated_at=now()
  where quest_id=q.id and user_id=target_user_id and status='submitted';
  if not found then raise exception 'No submitted completion to verify'; end if;

  if q.xp_reward>0 then
    award := public.ari_circle_award_xp_capped(target_user_id,q.xp_reward,'quest',q.id,'verified_community_quest','organizer_verified');
  end if;
  return jsonb_build_object('verified',true,'xp_awarded',award);
end;
$$;

revoke all on function public.ari_circle_verify_quest_completion(uuid,uuid) from public, anon;
grant execute on function public.ari_circle_verify_quest_completion(uuid,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Profile activity feed — public facts, not a mysterious trust score.
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_profile_xp_activity(target_user_id uuid, result_limit integer default 20)
returns table (
  event_id uuid,
  xp_amount smallint,
  source_type text,
  source_id uuid,
  reason text,
  awarded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  cap integer := greatest(1,least(coalesce(result_limit,20),50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id<>target_user_id and not public.ari_circle_can_view_user(target_user_id) then raise exception 'Profile unavailable'; end if;
  return query
  select x.id,x.xp_amount,x.source_type,x.source_id,x.reason,x.awarded_at
  from public.ari_circle_xp_events x
  where x.user_id=target_user_id
  order by x.awarded_at desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_profile_xp_activity(uuid,integer) from public, anon;
grant execute on function public.ari_circle_profile_xp_activity(uuid,integer) to authenticated;

commit;
