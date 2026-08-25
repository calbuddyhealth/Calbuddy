-- ARI Circle — Crews V1 Domain Events
-- Extend the existing short-lived coordination ledger with private Crew facts.
-- Crew lifecycle events are never public discovery or engagement telemetry.

begin;

alter table public.ari_circle_domain_events
  drop constraint if exists ari_circle_domain_events_event_type_check;

alter table public.ari_circle_domain_events
  add constraint ari_circle_domain_events_event_type_check
  check (event_type in (
    'meetup.created','meetup.requested','meetup.waitlisted','meetup.accepted','meetup.declined','meetup.withdrawn',
    'meetup.joined','meetup.left','meetup.spot_opened','meetup.cancelled','meetup.completed',
    'mission.created','mission.joined','mission.progress_submitted','mission.progress_verified',
    'mission.progress_rejected','mission.objective_reached',
    'crew.created','crew.invited','crew.joined','crew.declined','crew.left','crew.activated','crew.archived'
  ));

alter table public.ari_circle_domain_events
  drop constraint if exists ari_circle_domain_events_subject_type_check;

alter table public.ari_circle_domain_events
  add constraint ari_circle_domain_events_subject_type_check
  check (subject_type in ('meetup','mission','crew'));

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
    'meetup.created','meetup.requested','meetup.waitlisted','meetup.accepted','meetup.declined','meetup.withdrawn',
    'meetup.joined','meetup.left','meetup.spot_opened','meetup.cancelled','meetup.completed',
    'mission.created','mission.joined','mission.progress_submitted','mission.progress_verified',
    'mission.progress_rejected','mission.objective_reached',
    'crew.created','crew.invited','crew.joined','crew.declined','crew.left','crew.activated','crew.archived'
  ) then
    raise exception 'Unsupported Circle domain event';
  end if;

  if clean_subject_type not in ('meetup','mission','crew') or requested_subject_id is null then
    raise exception 'Circle domain event subject is required';
  end if;

  if jsonb_typeof(clean_metadata) <> 'object' then
    raise exception 'Circle domain event metadata must be an object';
  end if;

  if clean_metadata::text ~* '"(meeting_point|latitude|longitude|approximate_latitude|approximate_longitude|message|message_body|body|proof_note|email|phone|phone_number|xp|reward_xp|payment|premium|subscription|popularity|engagement)"[[:space:]]*:' then
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

create or replace function public.ari_circle_emit_crew_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event text;
begin
  if tg_op = 'INSERT' then
    perform public.ari_circle_record_domain_event(
      'crew.created','crew',new.id,new.owner_user_id,new.owner_user_id,
      concat('crew.created:', new.id),
      jsonb_build_object('crew_status', new.status)
    );
    return new;
  end if;

  if old.status is not distinct from new.status then return new; end if;

  next_event := case new.status
    when 'active' then 'crew.activated'
    when 'archived' then 'crew.archived'
    else null
  end;
  if next_event is null then return new; end if;

  perform public.ari_circle_record_domain_event(
    next_event,'crew',new.id,
    case when new.status = 'archived' then new.owner_user_id else null end,
    new.owner_user_id,
    concat(next_event, ':', new.id, ':', new.updated_at),
    jsonb_build_object('crew_status', new.status)
  );

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_crew_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_crew_event() to service_role;

drop trigger if exists ari_circle_domain_event_crew on public.ari_circle_crews;
create trigger ari_circle_domain_event_crew
after insert or update of status on public.ari_circle_crews
for each row execute function public.ari_circle_emit_crew_event();

create or replace function public.ari_circle_emit_crew_member_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event text;
  owner_id uuid;
  actor_id uuid;
  affected_id uuid;
begin
  if new.role = 'owner' then return new; end if;
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;

  select c.owner_user_id into owner_id
  from public.ari_circle_crews c
  where c.id = new.crew_id;
  if owner_id is null then return new; end if;

  next_event := case new.status
    when 'invited' then 'crew.invited'
    when 'active' then 'crew.joined'
    when 'declined' then 'crew.declined'
    when 'left' then 'crew.left'
    else null
  end;
  if next_event is null then return new; end if;

  actor_id := case when new.status = 'invited' then coalesce(new.invited_by, owner_id) else new.user_id end;
  affected_id := case when new.status = 'invited' then new.user_id else owner_id end;

  perform public.ari_circle_record_domain_event(
    next_event,'crew',new.crew_id,actor_id,affected_id,
    concat(next_event, ':', new.crew_id, ':', new.user_id, ':', new.updated_at),
    jsonb_build_object('member_status', new.status)
  );

  return new;
end;
$$;

revoke all on function public.ari_circle_emit_crew_member_event() from public, anon, authenticated;
grant execute on function public.ari_circle_emit_crew_member_event() to service_role;

drop trigger if exists ari_circle_domain_event_crew_member on public.ari_circle_crew_members;
create trigger ari_circle_domain_event_crew_member
after insert or update of status on public.ari_circle_crew_members
for each row execute function public.ari_circle_emit_crew_member_event();

-- Recreate the bounded event read model. Crew events are private: direct member
-- changes stay between the affected member and owner, while activation/archive
-- is visible only to people with a current invited/active membership row.
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
      or
      (
        e.event_type in (
          'meetup.requested','meetup.waitlisted','meetup.accepted','meetup.declined','meetup.withdrawn',
          'meetup.joined','meetup.left'
        )
        and caller_id in (e.actor_user_id, e.affected_user_id)
      )
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
      or
      (
        e.event_type in (
          'mission.joined','mission.progress_submitted','mission.progress_verified','mission.progress_rejected'
        )
        and caller_id in (e.actor_user_id, e.affected_user_id)
      )
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
      or
      (
        e.event_type in ('crew.created','crew.invited','crew.joined','crew.declined','crew.left')
        and caller_id in (e.actor_user_id, e.affected_user_id)
      )
      or
      (
        e.event_type in ('crew.activated','crew.archived')
        and exists (
          select 1 from public.ari_circle_crew_members cm
          where cm.crew_id = e.subject_id
            and cm.user_id = caller_id
            and cm.status in ('invited','active')
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

commit;
