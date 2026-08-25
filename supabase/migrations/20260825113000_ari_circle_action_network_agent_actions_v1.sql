-- ARI Circle Action Network V6 — trusted lifecycle wrappers for Ari vNext.
-- These functions do not grant Ari new authority. They resolve ambiguous user
-- lifecycle intent into existing guarded Circle RPCs while executing as auth.uid().

begin;

create or replace function public.ari_circle_apply_join_intent(
  requested_meetup_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  meetup public.ari_circle_meetups%rowtype;
  result jsonb;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Authentication required'; end if;
  if requested_meetup_id is null then raise exception 'Meetup is required'; end if;

  select * into meetup
  from public.ari_circle_meetups
  where id = requested_meetup_id;

  if not found or meetup.status <> 'scheduled' then
    raise exception 'Meetup unavailable';
  end if;
  if meetup.host_user_id = caller_id then
    return jsonb_build_object('resolution','already_host','meetup_id',meetup.id);
  end if;
  if public.ari_circle_social_pair_is_blocked(caller_id, meetup.host_user_id) then
    raise exception 'Meetup unavailable';
  end if;

  if meetup.join_mode = 'approval' then
    result := public.ari_circle_request_meetup(meetup.id);
    return coalesce(result, '{}'::jsonb) || jsonb_build_object(
      'resolution', case
        when result->>'status' = 'waitlisted' then 'waitlisted'
        when result->>'status' = 'declined' then 'declined'
        when result->>'status' = 'accepted' then 'already_joined'
        else 'requested'
      end,
      'join_mode', 'approval',
      'meetup_id', meetup.id
    );
  end if;

  result := public.ari_circle_join_meetup(meetup.id);
  return coalesce(result, '{}'::jsonb) || jsonb_build_object(
    'resolution', 'joined',
    'join_mode', 'instant',
    'meetup_id', meetup.id
  );
end;
$$;

create or replace function public.ari_circle_apply_leave_intent(
  requested_meetup_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  meetup public.ari_circle_meetups%rowtype;
  participant_status text;
  request_status text;
  changed boolean := false;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Authentication required'; end if;
  if requested_meetup_id is null then raise exception 'Meetup is required'; end if;

  select * into meetup
  from public.ari_circle_meetups
  where id = requested_meetup_id;

  if not found or meetup.status <> 'scheduled' then
    raise exception 'Meetup unavailable';
  end if;
  if meetup.host_user_id = caller_id then
    raise exception 'Hosts must cancel the meetup instead';
  end if;

  select p.status into participant_status
  from public.ari_circle_meetup_participants p
  where p.meetup_id = meetup.id and p.user_id = caller_id;

  if participant_status = 'joined' then
    changed := public.ari_circle_leave_meetup(meetup.id);
    return jsonb_build_object(
      'resolution', case when changed then 'left' else 'unchanged' end,
      'meetup_id', meetup.id
    );
  end if;

  select r.status into request_status
  from public.ari_circle_meetup_requests r
  where r.meetup_id = meetup.id and r.user_id = caller_id;

  if request_status in ('pending','waitlisted') then
    changed := public.ari_circle_withdraw_meetup_request(meetup.id);
    return jsonb_build_object(
      'resolution', case when changed then 'withdrawn' else 'unchanged' end,
      'meetup_id', meetup.id
    );
  end if;

  return jsonb_build_object('resolution','unchanged','meetup_id',meetup.id);
end;
$$;

revoke all on function public.ari_circle_apply_join_intent(uuid) from public, anon;
revoke all on function public.ari_circle_apply_leave_intent(uuid) from public, anon;
grant execute on function public.ari_circle_apply_join_intent(uuid) to authenticated, service_role;
grant execute on function public.ari_circle_apply_leave_intent(uuid) to authenticated, service_role;

commit;
