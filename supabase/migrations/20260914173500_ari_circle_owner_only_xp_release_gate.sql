-- ARI Circle Build 7 — keep experimental XP/reputation owner-only.
-- Public Circle members keep Meetups and Mission V2, but XP awards and
-- XP-bearing Classic Quest creation remain paused until the system is ready.

begin;

create or replace function public.ari_circle_xp_owner_enabled(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and coalesce(p.owner_access, false) = true
  );
$$;

revoke all on function public.ari_circle_xp_owner_enabled(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_xp_owner_enabled(uuid) to service_role;

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

  -- Build 7 release gate: only the verified owner account may accrue XP.
  if not public.ari_circle_xp_owner_enabled(target_user_id) then return 0; end if;

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

create or replace function public.ari_circle_can_create_xp_quest(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_xp_owner_enabled(target_user_id);
$$;

revoke all on function public.ari_circle_can_create_xp_quest(uuid) from public, anon;
grant execute on function public.ari_circle_can_create_xp_quest(uuid) to authenticated, service_role;

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
  caller_xp_enabled boolean := false;
begin
  perform public.ari_circle_assert_adult_access();
  caller_xp_enabled := public.ari_circle_xp_owner_enabled(caller_id);

  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.status='cancelled' then raise exception 'Meetup unavailable'; end if;
  if m.status='completed' then
    return jsonb_build_object(
      'settled',true,
      'already_settled',true,
      'xp_awarded',0,
      'waiting_on',0,
      'message','Meetup already verified.'
    );
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
      'message',case
        when caller_xp_enabled then 'XP releases after every participant presses Complete.'
        else 'Completion saved. Waiting for everyone to confirm.'
      end
    );
  end if;

  update public.ari_circle_meetups
  set status='completed',completed_at=now(),updated_at=now()
  where id=m.id;

  if participant_count < 2 then
    return jsonb_build_object(
      'settled',true,
      'xp_awarded',0,
      'waiting_on',0,
      'participant_count',participant_count,
      'message',case
        when caller_xp_enabled then 'Meetup completed. At least two verified participants are required for XP.'
        else 'Meetup completed.'
      end
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
    'settled',true,
    'xp_awarded',caller_award,
    'waiting_on',0,
    'participant_count',participant_count,
    'message',case
      when caller_xp_enabled then 'Meetup verified. XP was released within the daily and weekly caps.'
      else 'Meetup verified.'
    end
  );
end;
$$;

revoke all on function public.ari_circle_complete_meetup(uuid) from public, anon;
grant execute on function public.ari_circle_complete_meetup(uuid) to authenticated;

commit;
