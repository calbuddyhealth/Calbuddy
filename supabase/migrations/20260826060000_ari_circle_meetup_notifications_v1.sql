-- ARI Circle — Meetup Notifications V1
-- Reuse the existing Circle notification inbox. Meetup state changes remain
-- authoritative in ari_circle_domain_events; this fanout only creates user-facing
-- notification rows and never changes meetup membership or approval state.

create unique index if not exists ari_circle_notifications_domain_event_user_uidx
  on public.ari_circle_notifications (user_id, ((data ->> 'circle_domain_event_id')))
  where data ? 'circle_domain_event_id';

create unique index if not exists ari_circle_notifications_meetup_reminder_user_uidx
  on public.ari_circle_notifications (user_id, ((data ->> 'meetup_reminder_key')))
  where data ? 'meetup_reminder_key';

create or replace function private.ari_circle_insert_meetup_notification(
  target_user_id uuid,
  requested_meetup_id uuid,
  requested_kind text,
  requested_title text,
  requested_body text,
  requested_href text,
  requested_actor_user_id uuid default null,
  requested_domain_event_id uuid default null,
  requested_reminder_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
  actor_row public.ari_circle_profiles%rowtype;
begin
  if target_user_id is null or requested_meetup_id is null then
    return null;
  end if;

  -- Circle Activity notifications are opt-out. Missing preference rows preserve
  -- the historical enabled-by-default behavior.
  if exists (
    select 1
    from public.ari_notification_preferences pref
    where pref.user_id = target_user_id
      and pref.circle_activity_enabled = false
  ) then
    return null;
  end if;

  if requested_actor_user_id is not null then
    select * into actor_row
    from public.ari_circle_profiles
    where user_id = requested_actor_user_id;
  end if;

  insert into public.ari_circle_notifications (
    user_id,
    type,
    title,
    body,
    actor_user_id,
    actor_display_name,
    actor_handle,
    actor_avatar_url,
    is_read,
    data
  )
  values (
    target_user_id,
    'system',
    left(coalesce(nullif(btrim(requested_title), ''), 'ARI Circle Meet Up'), 120),
    left(nullif(btrim(coalesce(requested_body, '')), ''), 500),
    requested_actor_user_id,
    actor_row.display_name,
    actor_row.handle::text,
    actor_row.avatar_url,
    false,
    jsonb_strip_nulls(jsonb_build_object(
      'kind', nullif(btrim(coalesce(requested_kind, '')), ''),
      'meetup_id', requested_meetup_id,
      'href', nullif(btrim(coalesce(requested_href, '')), ''),
      'circle_domain_event_id', requested_domain_event_id,
      'meetup_reminder_key', nullif(btrim(coalesce(requested_reminder_key, '')), '')
    ))
  )
  on conflict do nothing
  returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke all on function private.ari_circle_insert_meetup_notification(uuid,uuid,text,text,text,text,uuid,uuid,text) from public;
revoke all on function private.ari_circle_insert_meetup_notification(uuid,uuid,text,text,text,text,uuid,uuid,text) from anon;
revoke all on function private.ari_circle_insert_meetup_notification(uuid,uuid,text,text,text,text,uuid,uuid,text) from authenticated;

create or replace function public.ari_circle_fanout_meetup_domain_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meetup_row public.ari_circle_meetups%rowtype;
  target_id uuid;
  kind text;
  title_text text;
  body_text text;
  href_text text;
  participant_row record;
begin
  if new.subject_type <> 'meetup' then
    return new;
  end if;

  select * into meetup_row
  from public.ari_circle_meetups
  where id = new.subject_id;

  if not found then
    return new;
  end if;

  href_text := 'ari-circle-v6.html';

  case new.event_type
    when 'meetup.requested' then
      target_id := coalesce(new.affected_user_id, meetup_row.host_user_id);
      if target_id = new.actor_user_id then return new; end if;
      kind := 'meetup_request';
      title_text := 'New meetup request';
      body_text := 'Someone asked to join “' || meetup_row.title || '”. Open Circle to review the request.';

    when 'meetup.waitlisted' then
      if new.actor_user_id = meetup_row.host_user_id
         and new.affected_user_id is not null
         and new.affected_user_id <> meetup_row.host_user_id then
        target_id := new.affected_user_id;
        kind := 'meetup_waitlisted';
        title_text := 'You’re on the waitlist';
        body_text := 'The host kept your request for “' || meetup_row.title || '” on the waitlist.';
      else
        target_id := meetup_row.host_user_id;
        if target_id = new.actor_user_id then return new; end if;
        kind := 'meetup_request';
        title_text := 'New waitlist request';
        body_text := 'Someone asked for a spot in “' || meetup_row.title || '”. The meetup is currently full.';
      end if;

    when 'meetup.accepted' then
      target_id := new.affected_user_id;
      kind := 'meetup_accepted';
      title_text := 'Meetup request accepted';
      body_text := 'You’re in for “' || meetup_row.title || '”. Open Circle to review the plan.';

    when 'meetup.declined' then
      target_id := new.affected_user_id;
      kind := 'meetup_declined';
      title_text := 'Meetup request update';
      body_text := 'Your request for “' || meetup_row.title || '” was not selected.';

    when 'meetup.joined' then
      target_id := meetup_row.host_user_id;
      if target_id = new.actor_user_id then return new; end if;
      kind := 'meetup_joined';
      title_text := 'Someone joined your meetup';
      body_text := 'A guest joined “' || meetup_row.title || '”.';

    when 'meetup.spot_opened' then
      target_id := meetup_row.host_user_id;
      kind := 'meetup_spot_opened';
      title_text := 'A meetup spot opened';
      body_text := 'A spot opened in “' || meetup_row.title || '”. Open Circle to choose someone from the waitlist.';

    when 'meetup.cancelled' then
      for participant_row in
        select p.user_id
        from public.ari_circle_meetup_participants p
        where p.meetup_id = meetup_row.id
          and p.status = 'joined'
          and p.user_id <> meetup_row.host_user_id
      loop
        perform private.ari_circle_insert_meetup_notification(
          participant_row.user_id,
          meetup_row.id,
          'meetup_cancelled',
          'Meetup cancelled',
          '“' || meetup_row.title || '” was cancelled by the host.',
          href_text,
          meetup_row.host_user_id,
          new.id,
          null
        );
      end loop;
      return new;

    when 'meetup.completed' then
      for participant_row in
        select p.user_id
        from public.ari_circle_meetup_participants p
        where p.meetup_id = meetup_row.id
          and p.status = 'joined'
          and p.completed_at is not null
      loop
        perform private.ari_circle_insert_meetup_notification(
          participant_row.user_id,
          meetup_row.id,
          'meetup_verified',
          'Meetup verified',
          '“' || meetup_row.title || '” was verified. Any earned XP has been released within your caps.',
          href_text,
          null,
          new.id,
          null
        );
      end loop;
      return new;

    else
      return new;
  end case;

  if target_id is not null then
    perform private.ari_circle_insert_meetup_notification(
      target_id,
      meetup_row.id,
      kind,
      title_text,
      body_text,
      href_text,
      new.actor_user_id,
      new.id,
      null
    );
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_fanout_meetup_domain_notification() from public;
revoke all on function public.ari_circle_fanout_meetup_domain_notification() from anon;
revoke all on function public.ari_circle_fanout_meetup_domain_notification() from authenticated;

drop trigger if exists ari_circle_domain_events_meetup_notification_fanout
  on public.ari_circle_domain_events;
create trigger ari_circle_domain_events_meetup_notification_fanout
after insert on public.ari_circle_domain_events
for each row execute function public.ari_circle_fanout_meetup_domain_notification();

create or replace function private.ari_circle_materialize_meetup_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder_row record;
  inserted_count integer := 0;
  inserted_id uuid;
  reminder_key text;
begin
  -- First reminder: once when a joined meetup enters the next-24-hour window.
  for reminder_row in
    select m.id as meetup_id, m.title, m.host_user_id, m.starts_at, p.user_id
    from public.ari_circle_meetups m
    join public.ari_circle_meetup_participants p
      on p.meetup_id = m.id
     and p.status = 'joined'
    where m.status = 'scheduled'
      and m.starts_at > now() + interval '12 hours'
      and m.starts_at <= now() + interval '24 hours'
  loop
    reminder_key := '24h:' || reminder_row.meetup_id::text;
    inserted_id := private.ari_circle_insert_meetup_notification(
      reminder_row.user_id,
      reminder_row.meetup_id,
      'meetup_reminder',
      'Meetup tomorrow',
      '“' || reminder_row.title || '” is coming up within 24 hours.',
      'ari-circle-v6.html',
      case when reminder_row.user_id = reminder_row.host_user_id then null else reminder_row.host_user_id end,
      null,
      reminder_key
    );
    if inserted_id is not null then inserted_count := inserted_count + 1; end if;
  end loop;

  -- Second reminder: once when a joined meetup enters the two-hour window.
  for reminder_row in
    select m.id as meetup_id, m.title, m.host_user_id, m.starts_at, p.user_id
    from public.ari_circle_meetups m
    join public.ari_circle_meetup_participants p
      on p.meetup_id = m.id
     and p.status = 'joined'
    where m.status = 'scheduled'
      and m.starts_at > now() + interval '45 minutes'
      and m.starts_at <= now() + interval '2 hours'
  loop
    reminder_key := '2h:' || reminder_row.meetup_id::text;
    inserted_id := private.ari_circle_insert_meetup_notification(
      reminder_row.user_id,
      reminder_row.meetup_id,
      'meetup_reminder',
      'Meetup starts soon',
      '“' || reminder_row.title || '” starts in about two hours.',
      'ari-circle-v6.html',
      case when reminder_row.user_id = reminder_row.host_user_id then null else reminder_row.host_user_id end,
      null,
      reminder_key
    );
    if inserted_id is not null then inserted_count := inserted_count + 1; end if;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function private.ari_circle_materialize_meetup_reminders() from public;
revoke all on function private.ari_circle_materialize_meetup_reminders() from anon;
revoke all on function private.ari_circle_materialize_meetup_reminders() from authenticated;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'ari-circle-meetup-reminders-v1'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'ari-circle-meetup-reminders-v1',
    '*/15 * * * *',
    'select private.ari_circle_materialize_meetup_reminders();'
  );
end;
$$;
