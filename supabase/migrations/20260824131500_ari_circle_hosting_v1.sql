-- ARI Circle — Hosting V1
-- Fast meetup creation, explicit host POC, and optional host-approved joining.

begin;

alter table public.ari_circle_meetups
  add column if not exists join_mode text not null default 'instant';

alter table public.ari_circle_meetups
  drop constraint if exists ari_circle_meetups_join_mode_check;

alter table public.ari_circle_meetups
  add constraint ari_circle_meetups_join_mode_check
  check (join_mode in ('instant','approval'));

create table if not exists public.ari_circle_meetup_requests (
  meetup_id uuid not null references public.ari_circle_meetups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','waitlisted','declined','withdrawn')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

create index if not exists ari_circle_meetup_requests_meetup_status_idx
  on public.ari_circle_meetup_requests(meetup_id, status, requested_at);
create index if not exists ari_circle_meetup_requests_user_idx
  on public.ari_circle_meetup_requests(user_id, requested_at desc);
create index if not exists ari_circle_meetup_requests_reviewed_by_idx
  on public.ari_circle_meetup_requests(reviewed_by, reviewed_at desc);

alter table public.ari_circle_meetup_requests enable row level security;
revoke all on table public.ari_circle_meetup_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_meetup_requests to service_role;

-- PostgREST does not support overloaded RPC functions. Replace the existing
-- create function with one signature that keeps old callers working through a
-- defaulted final parameter.
drop function if exists public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text);

create function public.ari_circle_create_meetup(
  requested_title text,
  requested_activity text,
  requested_area text,
  requested_starts_at timestamptz,
  requested_duration_minutes integer default 60,
  requested_max_participants integer default 8,
  requested_description text default null,
  requested_join_mode text default 'instant'
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
  clean_join_mode text := lower(btrim(coalesce(requested_join_mode,'instant')));
  duration_minutes integer := greatest(30, least(coalesce(requested_duration_minutes,60),480));
  capacity integer := greatest(2, least(coalesce(requested_max_participants,8),50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to host a meetup'; end if;
  if char_length(clean_title) < 3 or char_length(clean_title) > 90 then raise exception 'Meetup title must be 3-90 characters'; end if;
  if clean_activity not in ('walking','gym','running','hiking','sports','cycling','yoga','coffee','food','community','volunteer','other') then raise exception 'Unsupported meetup activity'; end if;
  if char_length(clean_area) < 2 or char_length(clean_area) > 100 then raise exception 'Use a broad city or area'; end if;
  if clean_join_mode not in ('instant','approval') then raise exception 'Unsupported joining mode'; end if;
  if requested_starts_at is null or requested_starts_at < now() + interval '10 minutes' then raise exception 'Meetup must start at least 10 minutes from now'; end if;
  if requested_starts_at > now() + interval '60 days' then raise exception 'Meetup is too far in the future'; end if;

  insert into public.ari_circle_meetups (
    host_user_id, title, activity, description, area, starts_at, ends_at, max_participants, join_mode
  ) values (
    caller_id, clean_title, clean_activity, nullif(btrim(coalesce(requested_description,'')),''), clean_area,
    requested_starts_at, requested_starts_at + make_interval(mins => duration_minutes), capacity, clean_join_mode
  ) returning id into meetup_id;

  insert into public.ari_circle_meetup_participants(meetup_id,user_id,role,status)
  values (meetup_id,caller_id,'host','joined');

  return meetup_id;
end;
$$;

revoke all on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text) from public, anon, authenticated;
grant execute on function public.ari_circle_create_meetup(text,text,text,timestamptz,integer,integer,text,text) to authenticated, service_role;

-- Preserve the 48-hour completion queue while returning approval/request state.
drop function if exists public.ari_circle_list_meetups(text,text,integer);

create function public.ari_circle_list_meetups(
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
  host_leadership_tier text,
  join_mode text,
  viewer_request_status text,
  pending_request_count bigint
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
    public.ari_circle_leadership_tier(m.host_user_id),
    m.join_mode,
    (select r.status from public.ari_circle_meetup_requests r where r.meetup_id=m.id and r.user_id=caller_id),
    case when m.host_user_id=caller_id then (
      select count(*) from public.ari_circle_meetup_requests r
      where r.meetup_id=m.id and r.status in ('pending','waitlisted')
    ) else 0 end
  from public.ari_circle_meetups m
  join public.ari_circle_profiles cp on cp.user_id = m.host_user_id
  where m.status='scheduled'
    and (
      m.ends_at > now()
      or (
        m.ends_at > now() - interval '48 hours'
        and exists (
          select 1 from public.ari_circle_meetup_participants mine
          where mine.meetup_id=m.id and mine.user_id=caller_id and mine.status='joined'
        )
      )
    )
    and (clean_activity is null or m.activity=clean_activity)
    and public.ari_circle_user_is_adult(m.host_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id)
    and (
      m.ends_at <= now()
      or requested_window not in ('today','weekend')
      or (requested_window='today' and m.starts_at < date_trunc('day',now()) + interval '1 day')
      or (requested_window='weekend' and extract(isodow from m.starts_at) in (6,7))
    )
  order by
    case when m.ends_at <= now() and exists(
      select 1 from public.ari_circle_meetup_participants mine
      where mine.meetup_id=m.id and mine.user_id=caller_id and mine.status='joined' and mine.completed_at is null
    ) then 0 else 1 end,
    m.starts_at asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_meetups(text,text,integer) from public, anon, authenticated;
grant execute on function public.ari_circle_list_meetups(text,text,integer) to authenticated, service_role;

create or replace function public.ari_circle_request_meetup(requested_meetup_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  joined_count integer := 0;
  request_status text;
  existing_status text;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to request a meetup'; end if;

  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status <> 'scheduled' then raise exception 'Meetup unavailable'; end if;
  if m.join_mode <> 'approval' then raise exception 'This meetup uses instant joining'; end if;
  if m.starts_at <= now() then raise exception 'This meetup has already started'; end if;
  if caller_id=m.host_user_id then return jsonb_build_object('status','accepted','meetup_id',m.id); end if;
  if public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id) then raise exception 'Meetup unavailable'; end if;

  if exists(select 1 from public.ari_circle_meetup_participants p where p.meetup_id=m.id and p.user_id=caller_id and p.status='joined') then
    return jsonb_build_object('status','accepted','meetup_id',m.id);
  end if;

  select r.status into existing_status
  from public.ari_circle_meetup_requests r
  where r.meetup_id=m.id and r.user_id=caller_id;

  if existing_status='declined' then
    return jsonb_build_object('status','declined','meetup_id',m.id);
  end if;

  select count(*)::integer into joined_count
  from public.ari_circle_meetup_participants p
  where p.meetup_id=m.id and p.status='joined';

  request_status := case when joined_count >= m.max_participants then 'waitlisted' else 'pending' end;

  insert into public.ari_circle_meetup_requests(meetup_id,user_id,status,requested_at,reviewed_at,reviewed_by,updated_at)
  values(m.id,caller_id,request_status,now(),null,null,now())
  on conflict(meetup_id,user_id) do update set
    status=excluded.status,
    requested_at=now(),
    reviewed_at=null,
    reviewed_by=null,
    updated_at=now();

  return jsonb_build_object('status',request_status,'meetup_id',m.id);
end;
$$;

revoke all on function public.ari_circle_request_meetup(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_request_meetup(uuid) to authenticated, service_role;

create or replace function public.ari_circle_withdraw_meetup_request(requested_meetup_id uuid)
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
  select * into m from public.ari_circle_meetups where id=requested_meetup_id;
  if not found or m.status <> 'scheduled' then return false; end if;

  update public.ari_circle_meetup_requests
  set status='withdrawn', updated_at=now()
  where meetup_id=m.id and user_id=caller_id and status in ('pending','waitlisted');

  return found;
end;
$$;

revoke all on function public.ari_circle_withdraw_meetup_request(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_withdraw_meetup_request(uuid) to authenticated, service_role;

create or replace function public.ari_circle_list_meetup_requests(requested_meetup_id uuid)
returns table (
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  request_status text,
  requested_at timestamptz,
  verified_meetups bigint,
  leadership_tier text
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id;
  if not found or m.host_user_id<>caller_id then raise exception 'Only the host can review requests'; end if;

  return query
  select
    r.user_id,
    cp.display_name,
    cp.handle::text,
    cp.avatar_url,
    r.status,
    r.requested_at,
    (
      select count(*)
      from public.ari_circle_meetup_participants p
      join public.ari_circle_meetups completed on completed.id=p.meetup_id
      where p.user_id=r.user_id and p.status='joined' and p.completed_at is not null and completed.status='completed'
    ),
    public.ari_circle_leadership_tier(r.user_id)
  from public.ari_circle_meetup_requests r
  join public.ari_circle_profiles cp on cp.user_id=r.user_id
  where r.meetup_id=m.id
    and r.status in ('pending','waitlisted','accepted')
    and public.ari_circle_user_is_adult(r.user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,r.user_id)
  order by
    case r.status when 'pending' then 0 when 'waitlisted' then 1 else 2 end,
    r.requested_at asc;
end;
$$;

revoke all on function public.ari_circle_list_meetup_requests(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_list_meetup_requests(uuid) to authenticated, service_role;

create or replace function public.ari_circle_review_meetup_request(
  requested_meetup_id uuid,
  requested_user_id uuid,
  requested_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  clean_decision text := lower(btrim(coalesce(requested_decision,'')));
  joined_count integer := 0;
  remaining_spots integer := 0;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status <> 'scheduled' then raise exception 'Meetup unavailable'; end if;
  if m.host_user_id<>caller_id then raise exception 'Only the host can review requests'; end if;
  if m.join_mode<>'approval' then raise exception 'This meetup does not use host approval'; end if;
  if m.starts_at<=now() then raise exception 'This meetup has already started'; end if;
  if requested_user_id is null or requested_user_id=caller_id then raise exception 'Invalid request'; end if;
  if clean_decision not in ('accept','decline','waitlist') then raise exception 'Unsupported request decision'; end if;
  if public.ari_circle_social_pair_is_blocked(caller_id,requested_user_id) then raise exception 'Request unavailable'; end if;

  if not exists(
    select 1 from public.ari_circle_meetup_requests r
    where r.meetup_id=m.id and r.user_id=requested_user_id and r.status in ('pending','waitlisted','accepted')
  ) then raise exception 'Request unavailable'; end if;

  if clean_decision='accept' then
    select count(*)::integer into joined_count
    from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.status='joined';

    if joined_count>=m.max_participants and not exists(
      select 1 from public.ari_circle_meetup_participants p
      where p.meetup_id=m.id and p.user_id=requested_user_id and p.status='joined'
    ) then raise exception 'This meetup is full'; end if;

    insert into public.ari_circle_meetup_participants(meetup_id,user_id,role,status,completed_at,updated_at)
    values(m.id,requested_user_id,'participant','joined',null,now())
    on conflict(meetup_id,user_id) do update set status='joined', role='participant', completed_at=null, updated_at=now();

    update public.ari_circle_meetup_requests
    set status='accepted', reviewed_at=now(), reviewed_by=caller_id, updated_at=now()
    where meetup_id=m.id and user_id=requested_user_id;

    select (m.max_participants-count(*))::integer into remaining_spots
    from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.status='joined';

    if remaining_spots<=0 then
      update public.ari_circle_meetup_requests
      set status='waitlisted', updated_at=now()
      where meetup_id=m.id and status='pending' and user_id<>requested_user_id;
    end if;

    return jsonb_build_object('status','accepted','meetup_id',m.id,'user_id',requested_user_id,'remaining_spots',greatest(remaining_spots,0));
  end if;

  update public.ari_circle_meetup_requests
  set status=case when clean_decision='decline' then 'declined' else 'waitlisted' end,
      reviewed_at=now(), reviewed_by=caller_id, updated_at=now()
  where meetup_id=m.id and user_id=requested_user_id;

  return jsonb_build_object(
    'status',case when clean_decision='decline' then 'declined' else 'waitlisted' end,
    'meetup_id',m.id,
    'user_id',requested_user_id
  );
end;
$$;

revoke all on function public.ari_circle_review_meetup_request(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.ari_circle_review_meetup_request(uuid,uuid,text) to authenticated, service_role;

-- Instant joining remains one tap. Approval meetups must use the request RPC.
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
  if m.join_mode='approval' and caller_id<>m.host_user_id then raise exception 'Request to join this meetup'; end if;

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

revoke all on function public.ari_circle_join_meetup(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_join_meetup(uuid) to authenticated, service_role;

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

  update public.ari_circle_meetup_participants
  set status='left', completed_at=null, updated_at=now()
  where meetup_id=m.id and user_id=caller_id;

  if found and m.join_mode='approval' then
    update public.ari_circle_meetup_requests
    set status='withdrawn', updated_at=now()
    where meetup_id=m.id and user_id=caller_id and status='accepted';
  end if;

  return found;
end;
$$;

revoke all on function public.ari_circle_leave_meetup(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_leave_meetup(uuid) to authenticated, service_role;

commit;