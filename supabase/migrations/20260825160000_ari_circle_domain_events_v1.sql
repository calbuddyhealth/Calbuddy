-- ARI Circle — Domain Events V1
-- A short-lived server-authoritative coordination ledger for Ari and future
-- Circle group intelligence. This is not a notification feed, analytics log,
-- engagement stream, or durable social-personalization history.
--
-- V1 records only meaningful Action Network state transitions. Source tables
-- remain authoritative; events are pointers/facts that let future consumers
-- react without polling private chats or inventing social state.

begin;

create table if not exists public.ari_circle_domain_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'meetup.created',
    'meetup.requested',
    'meetup.waitlisted',
    'meetup.declined',
    'meetup.withdrawn',
    'meetup.joined',
    'meetup.left',
    'meetup.spot_opened',
    'meetup.cancelled',
    'meetup.completed',
    'mission.created',
    'mission.joined',
    'mission.progress_submitted',
    'mission.progress_verified',
    'mission.progress_rejected',
    'mission.objective_reached'
  )),
  subject_type text not null check (subject_type in ('meetup','mission')),
  subject_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  affected_user_id uuid references auth.users(id) on delete set null,
  source_key text not null unique,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint ari_circle_domain_events_expiry_check
    check (expires_at > occurred_at and expires_at <= occurred_at + interval '30 days')
);

create index if not exists ari_circle_domain_events_recent_idx
  on public.ari_circle_domain_events(occurred_at desc);
create index if not exists ari_circle_domain_events_subject_idx
  on public.ari_circle_domain_events(subject_type, subject_id, occurred_at desc);
create index if not exists ari_circle_domain_events_actor_idx
  on public.ari_circle_domain_events(actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index if not exists ari_circle_domain_events_affected_idx
  on public.ari_circle_domain_events(affected_user_id, occurred_at desc)
  where affected_user_id is not null;
create index if not exists ari_circle_domain_events_expiry_idx
  on public.ari_circle_domain_events(expires_at);

alter table public.ari_circle_domain_events enable row level security;
revoke all on table public.ari_circle_domain_events from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_domain_events to service_role;

-- Internal writer used by trusted database triggers only. Browser/authenticated
-- callers receive no EXECUTE grant. Metadata is deliberately bounded and must
-- not become a side-channel for private Circle content or ranking signals.
create or replace function public.ari_circle_record_domain_event(
  requested_event_type text,
  requested_subject_type text,
  requested_subject_id uuid,
  requested_actor_user_id uuid default null,
  requested_affected_user_id uuid default null,
  requested_source_key text default null,
  requested_metadata jsonb default '{}'::jsonb,
  requested_ttl interval default interval '30 days'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
  clean_event_type text := lower(btrim(coalesce(requested_event_type, '')));
  clean_subject_type text := lower(btrim(coalesce(requested_subject_type, '')));
  clean_source_key text := nullif(btrim(coalesce(requested_source_key, '')), '');
  clean_metadata jsonb := coalesce(requested_metadata, '{}'::jsonb);
  ttl interval := least(interval '30 days', greatest(interval '1 hour', coalesce(requested_ttl, interval '30 days')));
begin
  if clean_event_type not in (
    'meetup.created','meetup.requested','meetup.waitlisted','meetup.declined','meetup.withdrawn',
    'meetup.joined','meetup.left','meetup.spot_opened','meetup.cancelled','meetup.completed',
    'mission.created','mission.joined','mission.progress_submitted','mission.progress_verified',
    'mission.progress_rejected','mission.objective_reached'
  ) then
    raise exception 'Unsupported Circle domain event';
  end if;

  if clean_subject_type not in ('meetup','mission') or requested_subject_id is null then
    raise exception 'Circle domain event subject is required';
  end if;

  if jsonb_typeof(clean_metadata) <> 'object' then
    raise exception 'Circle domain event metadata must be an object';
  end if;

  if clean_metadata ?| array[
    'meeting_point','latitude','longitude','approximate_latitude','approximate_longitude',
    'message','message_body','body','proof_note','email','phone','phone_number',
    'xp','reward_xp','payment','premium','subscription','popularity','engagement'
  ] then
    raise exception 'Private or ranking data cannot enter Circle domain events';
  end if;

  clean_source_key := coalesce(
    clean_source_key,
    concat(clean_event_type, ':', clean_subject_type, ':', requested_subject_id, ':', gen_random_uuid())
  );

  insert into public.ari_circle_domain_events(
    event_type,
    subject_type,
    subject_id,
    actor_user_id,
    affected_user_id,
    source_key,
    metadata,
    occurred_at,
    expires_at
  ) values (
    clean_event_type,
    clean_subject_type,
    requested_subject_id,
    requested_actor_user_id,
    requested_affected_user_id,
    clean_source_key,
    clean_metadata,
    now(),
    now() + ttl
  )
  on conflict (source_key) do nothing
  returning id into event_id;

  if event_id is null then
    select e.id into event_id
    from public.ari_circle_domain_events e
    where e.source_key = clean_source_key;
  end if;

  return event_id;
end;
$$;

revoke all on function public.ari_circle_record_domain_event(text,text,uuid,uuid,uuid,text,jsonb,interval)
  from public, anon, authenticated;
grant execute on function public.ari_circle_record_domain_event(text,text,uuid,uuid,uuid,text,jsonb,interval)
  to service_role;

-- ---------------------------------------------------------------------------
-- Meetup source transitions
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_emit_meetup_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.ari_circle_record_domain_event(
      'meetup.created','meetup',new.id,new.host_user_id,new.host_user_id,
      concat('meetup.created:', new.id),
      '{}'::jsonb
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    if new.status = 'cancelled' then
      perform public.ari_circle_record_domain_event(
        'meetup.cancelled','meetup',new.id,new.host_user_id,null,
        concat('meetup.cancelled:', new.id),
        '{}'::jsonb
      );
    elsif new.status = 'completed' then
      perform public.ari_circle_record_domain_event(
        'meetup.completed','meetup',new.id,null,null,
        concat('meetup.completed:', new.id),
        '{}'::jsonb
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_meetup_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_meetup_event() to service_role;

drop trigger if exists ari_circle_domain_event_meetup on public.ari_circle_meetups;
create trigger ari_circle_domain_event_meetup
after insert or update of status on public.ari_circle_meetups
for each row execute function public.ari_circle_emit_meetup_event();

create or replace function public.ari_circle_emit_meetup_request_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  host_id uuid;
  next_event text;
  actor_id uuid;
  affected_id uuid;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then
    return new;
  end if;

  select m.host_user_id into host_id
  from public.ari_circle_meetups m
  where m.id = new.meetup_id;

  if host_id is null then return new; end if;

  next_event := case new.status
    when 'pending' then 'meetup.requested'
    when 'waitlisted' then 'meetup.waitlisted'
    when 'declined' then 'meetup.declined'
    when 'withdrawn' then 'meetup.withdrawn'
    else null
  end;
  if next_event is null then return new; end if;

  actor_id := case
    when new.status = 'declined' then coalesce(new.reviewed_by, host_id)
    when new.status = 'waitlisted' and new.reviewed_by is not null then new.reviewed_by
    else new.user_id
  end;
  affected_id := case
    when new.status in ('declined','waitlisted') and actor_id = host_id then new.user_id
    else host_id
  end;

  perform public.ari_circle_record_domain_event(
    next_event,'meetup',new.meetup_id,actor_id,affected_id,
    concat(next_event, ':', new.meetup_id, ':', new.user_id, ':', new.updated_at),
    jsonb_build_object('request_status', new.status)
  );

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_meetup_request_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_meetup_request_event() to service_role;

drop trigger if exists ari_circle_domain_event_meetup_request on public.ari_circle_meetup_requests;
create trigger ari_circle_domain_event_meetup_request
after insert or update of status on public.ari_circle_meetup_requests
for each row execute function public.ari_circle_emit_meetup_request_event();

create or replace function public.ari_circle_emit_meetup_participant_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.ari_circle_meetups%rowtype;
  joined_count integer := 0;
  spots_remaining integer := 0;
begin
  if new.role = 'host' then return new; end if;
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;

  select * into m
  from public.ari_circle_meetups
  where id = new.meetup_id;
  if not found then return new; end if;

  if new.status = 'joined' and (tg_op = 'INSERT' or old.status = 'left') then
    perform public.ari_circle_record_domain_event(
      'meetup.joined','meetup',new.meetup_id,new.user_id,m.host_user_id,
      concat('meetup.joined:', new.meetup_id, ':', new.user_id, ':', new.updated_at),
      '{}'::jsonb
    );
  elsif tg_op = 'UPDATE' and old.status = 'joined' and new.status = 'left' then
    perform public.ari_circle_record_domain_event(
      'meetup.left','meetup',new.meetup_id,new.user_id,m.host_user_id,
      concat('meetup.left:', new.meetup_id, ':', new.user_id, ':', new.updated_at),
      '{}'::jsonb
    );

    if m.status = 'scheduled' and m.starts_at > now() then
      select count(*)::integer into joined_count
      from public.ari_circle_meetup_participants p
      where p.meetup_id = new.meetup_id and p.status = 'joined';

      spots_remaining := greatest(0, m.max_participants - joined_count);
      -- A public "spot opened" signal is emitted only when this departure took
      -- the Meetup from full to one available spot. Departures from an already
      -- open Meetup do not manufacture urgency.
      if spots_remaining = 1 then
        perform public.ari_circle_record_domain_event(
          'meetup.spot_opened','meetup',new.meetup_id,null,m.host_user_id,
          concat('meetup.spot_opened:', new.meetup_id, ':', new.updated_at),
          jsonb_build_object('spots_remaining', spots_remaining)
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_meetup_participant_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_meetup_participant_event() to service_role;

drop trigger if exists ari_circle_domain_event_meetup_participant on public.ari_circle_meetup_participants;
create trigger ari_circle_domain_event_meetup_participant
after insert or update of status on public.ari_circle_meetup_participants
for each row execute function public.ari_circle_emit_meetup_participant_event();

-- ---------------------------------------------------------------------------
-- Mission source transitions
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_emit_mission_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.objective_type = 'completion' then return new; end if;

  if tg_op = 'INSERT' then
    perform public.ari_circle_record_domain_event(
      'mission.created','mission',new.id,new.creator_user_id,new.creator_user_id,
      concat('mission.created:', new.id),
      '{}'::jsonb
    );
  elsif old.objective_reached_at is null and new.objective_reached_at is not null then
    perform public.ari_circle_record_domain_event(
      'mission.objective_reached','mission',new.id,null,new.creator_user_id,
      concat('mission.objective_reached:', new.id),
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_mission_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_mission_event() to service_role;

drop trigger if exists ari_circle_domain_event_mission on public.ari_circle_quests;
create trigger ari_circle_domain_event_mission
after insert or update of objective_reached_at on public.ari_circle_quests
for each row execute function public.ari_circle_emit_mission_event();

create or replace function public.ari_circle_emit_mission_member_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.ari_circle_quests%rowtype;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;
  if new.status = 'left' then return new; end if;

  select * into q
  from public.ari_circle_quests
  where id = new.quest_id;

  if not found or q.objective_type = 'completion' or new.user_id = q.creator_user_id then
    return new;
  end if;

  if new.status = 'joined' and (tg_op = 'INSERT' or old.status = 'left') then
    perform public.ari_circle_record_domain_event(
      'mission.joined','mission',new.quest_id,new.user_id,q.creator_user_id,
      concat('mission.joined:', new.quest_id, ':', new.user_id, ':', new.updated_at),
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_mission_member_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_mission_member_event() to service_role;

drop trigger if exists ari_circle_domain_event_mission_member on public.ari_circle_quest_members;
create trigger ari_circle_domain_event_mission_member
after insert or update of status on public.ari_circle_quest_members
for each row execute function public.ari_circle_emit_mission_member_event();

create or replace function public.ari_circle_emit_mission_progress_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.ari_circle_quests%rowtype;
  next_event text;
  actor_id uuid;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;

  select * into q
  from public.ari_circle_quests
  where id = new.quest_id;
  if not found or q.objective_type = 'completion' then return new; end if;

  next_event := case new.status
    when 'submitted' then 'mission.progress_submitted'
    when 'verified' then 'mission.progress_verified'
    when 'rejected' then 'mission.progress_rejected'
    else null
  end;
  if next_event is null then return new; end if;

  actor_id := case
    when new.status in ('verified','rejected') and new.verified_by is not null then new.verified_by
    else new.user_id
  end;

  perform public.ari_circle_record_domain_event(
    next_event,'mission',new.quest_id,actor_id,
    case when new.status = 'submitted' then q.creator_user_id else new.user_id end,
    concat(next_event, ':', new.id, ':', new.updated_at),
    jsonb_build_object('contribution_amount', new.amount, 'unit', q.unit)
  );

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_mission_progress_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_mission_progress_event() to service_role;

drop trigger if exists ari_circle_domain_event_mission_progress on public.ari_circle_mission_contributions;
create trigger ari_circle_domain_event_mission_progress
after insert or update of status on public.ari_circle_mission_contributions
for each row execute function public.ari_circle_emit_mission_progress_event();

-- ---------------------------------------------------------------------------
-- Safe adult read model for future Ari/event consumers
-- ---------------------------------------------------------------------------
create or replace function public.ari_circle_list_domain_events(
  requested_since timestamptz default (now() - interval '24 hours'),
  result_limit integer default 50
)
returns table(
  event_id uuid,
  event_type text,
  subject_type text,
  subject_id uuid,
  actor_user_id uuid,
  actor_display_name text,
  actor_handle text,
  metadata jsonb,
  occurred_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  since_time timestamptz := greatest(
    coalesce(requested_since, now() - interval '24 hours'),
    now() - interval '30 days'
  );
  cap integer := greatest(1, least(coalesce(result_limit, 50), 100));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to view Circle events'; end if;

  return query
  select
    e.id,
    e.event_type,
    e.subject_type,
    e.subject_id,
    e.actor_user_id,
    p.display_name,
    p.handle::text,
    e.metadata,
    e.occurred_at
  from public.ari_circle_domain_events e
  left join public.ari_circle_profiles p
    on p.user_id = e.actor_user_id
   and public.ari_circle_user_is_adult(e.actor_user_id)
  where e.occurred_at >= since_time
    and e.expires_at > now()
    and (e.actor_user_id is null or e.actor_user_id = caller_id or not public.ari_circle_social_pair_is_blocked(caller_id, e.actor_user_id))
    and (e.affected_user_id is null or e.affected_user_id = caller_id or not public.ari_circle_social_pair_is_blocked(caller_id, e.affected_user_id))
    and (
      -- Public, actionable Opportunity signals. Current source visibility is
      -- rechecked so stale/cancelled/blocked Opportunities do not leak through.
      (
        e.event_type in ('meetup.created','meetup.spot_opened')
        and exists (
          select 1 from public.ari_circle_meetups m
          where m.id = e.subject_id
            and m.status = 'scheduled'
            and m.ends_at > now()
            and public.ari_circle_user_is_adult(m.host_user_id)
            and not public.ari_circle_social_pair_is_blocked(caller_id, m.host_user_id)
        )
      )
      or
      (
        e.event_type = 'mission.created'
        and exists (
          select 1 from public.ari_circle_quests q
          where q.id = e.subject_id
            and q.objective_type <> 'completion'
            and q.status = 'active'
            and q.ends_at > now()
            and public.ari_circle_user_is_adult(q.creator_user_id)
            and not public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id)
        )
      )
      -- Request/join/leave events are visible only to the people directly
      -- involved. They never become public social activity telemetry.
      or
      (
        e.event_type in (
          'meetup.requested','meetup.waitlisted','meetup.declined','meetup.withdrawn',
          'meetup.joined','meetup.left'
        )
        and caller_id in (e.actor_user_id, e.affected_user_id)
      )
      -- Cancellation/completion matters to the host and people who remained
      -- joined. Someone who already left is not retained as an audience.
      or
      (
        e.event_type in ('meetup.cancelled','meetup.completed')
        and exists (
          select 1 from public.ari_circle_meetups m
          where m.id = e.subject_id
            and (
              m.host_user_id = caller_id
              or exists (
                select 1 from public.ari_circle_meetup_participants mp
                where mp.meetup_id = m.id
                  and mp.user_id = caller_id
                  and mp.status = 'joined'
              )
            )
        )
      )
      -- Mission member/progress events stay between the contributor/reviewer
      -- and organizer/member directly affected by the transition.
      or
      (
        e.event_type in (
          'mission.joined','mission.progress_submitted','mission.progress_verified','mission.progress_rejected'
        )
        and caller_id in (e.actor_user_id, e.affected_user_id)
      )
      -- Collective objective completion is visible to current Mission members,
      -- not broadcast as engagement content to unrelated users.
      or
      (
        e.event_type = 'mission.objective_reached'
        and exists (
          select 1 from public.ari_circle_quests q
          where q.id = e.subject_id
            and q.objective_type <> 'completion'
            and (
              q.creator_user_id = caller_id
              or exists (
                select 1 from public.ari_circle_quest_members qm
                where qm.quest_id = q.id
                  and qm.user_id = caller_id
                  and qm.status <> 'left'
              )
            )
        )
      )
    )
  order by e.occurred_at desc, e.id desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_domain_events(timestamptz,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_domain_events(timestamptz,integer)
  to authenticated, service_role;

-- Retention cleanup is intentionally service-only. The 30-day expiry also
-- prevents future reads even if physical cleanup has not run yet.
create or replace function public.ari_circle_prune_domain_events()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer := 0;
begin
  delete from public.ari_circle_domain_events
  where expires_at <= now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.ari_circle_prune_domain_events() from public, anon, authenticated;
grant execute on function public.ari_circle_prune_domain_events() to service_role;

commit;
