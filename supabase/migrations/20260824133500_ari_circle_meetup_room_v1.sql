-- ARI Circle — Meetup Room V1
-- Private logistics, accepted-attendee roster, exact meeting point, and meetup-scoped chat.

begin;

alter table public.ari_circle_meetups
  add column if not exists meeting_point text;

alter table public.ari_circle_meetups
  drop constraint if exists ari_circle_meetups_meeting_point_check;

alter table public.ari_circle_meetups
  add constraint ari_circle_meetups_meeting_point_check
  check (meeting_point is null or (char_length(btrim(meeting_point)) between 2 and 180));

create table if not exists public.ari_circle_meetup_messages (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.ari_circle_meetups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists ari_circle_meetup_messages_meetup_created_idx
  on public.ari_circle_meetup_messages(meetup_id, created_at desc);
create index if not exists ari_circle_meetup_messages_user_created_idx
  on public.ari_circle_meetup_messages(user_id, created_at desc);

alter table public.ari_circle_meetup_messages enable row level security;
revoke all on table public.ari_circle_meetup_messages from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_meetup_messages to service_role;

create or replace function public.ari_circle_get_meetup_room(requested_meetup_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  host_profile public.ari_circle_profiles%rowtype;
  attendees jsonb := '[]'::jsonb;
  is_member boolean := false;
  is_host boolean := false;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to open this meetup room'; end if;

  select * into m from public.ari_circle_meetups where id=requested_meetup_id;
  if not found then raise exception 'Meetup room unavailable'; end if;

  is_host := m.host_user_id=caller_id;
  is_member := is_host or exists(
    select 1 from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.user_id=caller_id and p.status='joined'
  );
  if not is_member then raise exception 'Join this meetup to open the room'; end if;
  if not is_host and public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id) then raise exception 'Meetup room unavailable'; end if;
  if m.ends_at < now() - interval '48 hours' then raise exception 'This meetup room is archived'; end if;

  select * into host_profile from public.ari_circle_profiles where user_id=m.host_user_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', p.user_id,
      'role', p.role,
      'display_name', cp.display_name,
      'handle', cp.handle::text,
      'avatar_url', cp.avatar_url,
      'leadership_tier', public.ari_circle_leadership_tier(p.user_id),
      'verified_meetups', (
        select count(*)
        from public.ari_circle_meetup_participants vp
        join public.ari_circle_meetups vm on vm.id=vp.meetup_id
        where vp.user_id=p.user_id
          and vp.status='joined'
          and vp.completed_at is not null
          and vm.status='completed'
      )
    ) order by case when p.role='host' then 0 else 1 end, p.joined_at asc
  ), '[]'::jsonb)
  into attendees
  from public.ari_circle_meetup_participants p
  join public.ari_circle_profiles cp on cp.user_id=p.user_id
  where p.meetup_id=m.id
    and p.status='joined'
    and public.ari_circle_user_is_adult(p.user_id)
    and (p.user_id=caller_id or not public.ari_circle_social_pair_is_blocked(caller_id,p.user_id));

  return jsonb_build_object(
    'meetup_id', m.id,
    'title', m.title,
    'activity', m.activity,
    'description', m.description,
    'area', m.area,
    'meeting_point', m.meeting_point,
    'starts_at', m.starts_at,
    'ends_at', m.ends_at,
    'status', m.status,
    'max_participants', m.max_participants,
    'join_mode', m.join_mode,
    'viewer_is_host', is_host,
    'host_user_id', m.host_user_id,
    'host_display_name', coalesce(host_profile.display_name,'ARI User'),
    'host_handle', host_profile.handle::text,
    'host_avatar_url', host_profile.avatar_url,
    'host_leadership_tier', public.ari_circle_leadership_tier(m.host_user_id),
    'attendees', attendees,
    'chat_open', (m.status='scheduled' and now() <= m.ends_at + interval '2 hours'),
    'room_archives_at', m.ends_at + interval '48 hours'
  );
end;
$$;

revoke all on function public.ari_circle_get_meetup_room(uuid) from public, anon, authenticated;
grant execute on function public.ari_circle_get_meetup_room(uuid) to authenticated, service_role;

create or replace function public.ari_circle_set_meetup_point(
  requested_meetup_id uuid,
  requested_meeting_point text
)
returns text
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  clean_point text := nullif(btrim(coalesce(requested_meeting_point,'')), '');
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id for update;
  if not found or m.host_user_id<>caller_id then raise exception 'Only the host can update the meeting point'; end if;
  if m.status<>'scheduled' or now()>m.ends_at + interval '2 hours' then raise exception 'This meetup can no longer be edited'; end if;
  if clean_point is not null and (char_length(clean_point)<2 or char_length(clean_point)>180) then raise exception 'Meeting point must be 2-180 characters'; end if;

  update public.ari_circle_meetups
  set meeting_point=clean_point, updated_at=now()
  where id=m.id;

  return clean_point;
end;
$$;

revoke all on function public.ari_circle_set_meetup_point(uuid,text) from public, anon, authenticated;
grant execute on function public.ari_circle_set_meetup_point(uuid,text) to authenticated, service_role;

create or replace function public.ari_circle_list_meetup_messages(
  requested_meetup_id uuid,
  result_limit integer default 100
)
returns table (
  message_id uuid,
  user_id uuid,
  display_name text,
  handle text,
  avatar_url text,
  member_role text,
  body text,
  created_at timestamptz,
  viewer_is_sender boolean
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit,100),200));
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id;
  if not found then raise exception 'Meetup room unavailable'; end if;
  if not exists(
    select 1 from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.user_id=caller_id and p.status='joined'
  ) then raise exception 'Join this meetup to read the room chat'; end if;
  if m.ends_at < now() - interval '48 hours' then raise exception 'This meetup room is archived'; end if;
  if caller_id<>m.host_user_id and public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id) then raise exception 'Meetup room unavailable'; end if;

  return query
  select ordered.message_id, ordered.user_id, ordered.display_name, ordered.handle,
         ordered.avatar_url, ordered.member_role, ordered.body, ordered.created_at, ordered.viewer_is_sender
  from (
    select msg.id as message_id,
           msg.user_id,
           cp.display_name,
           cp.handle::text as handle,
           cp.avatar_url,
           p.role as member_role,
           msg.body,
           msg.created_at,
           msg.user_id=caller_id as viewer_is_sender
    from public.ari_circle_meetup_messages msg
    join public.ari_circle_meetup_participants p
      on p.meetup_id=msg.meetup_id and p.user_id=msg.user_id
    join public.ari_circle_profiles cp on cp.user_id=msg.user_id
    where msg.meetup_id=m.id
      and public.ari_circle_user_is_adult(msg.user_id)
      and (msg.user_id=caller_id or not public.ari_circle_social_pair_is_blocked(caller_id,msg.user_id))
    order by msg.created_at desc
    limit cap
  ) ordered
  order by ordered.created_at asc;
end;
$$;

revoke all on function public.ari_circle_list_meetup_messages(uuid,integer) from public, anon, authenticated;
grant execute on function public.ari_circle_list_meetup_messages(uuid,integer) to authenticated, service_role;

create or replace function public.ari_circle_send_meetup_message(
  requested_meetup_id uuid,
  requested_body text
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  m public.ari_circle_meetups%rowtype;
  clean_body text := btrim(coalesce(requested_body,''));
  new_message_id uuid;
begin
  perform public.ari_circle_assert_adult_access();
  select * into m from public.ari_circle_meetups where id=requested_meetup_id;
  if not found then raise exception 'Meetup room unavailable'; end if;
  if not exists(
    select 1 from public.ari_circle_meetup_participants p
    where p.meetup_id=m.id and p.user_id=caller_id and p.status='joined'
  ) then raise exception 'Join this meetup to use the room chat'; end if;
  if caller_id<>m.host_user_id and public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id) then raise exception 'Meetup room unavailable'; end if;
  if m.status<>'scheduled' or now()>m.ends_at + interval '2 hours' then raise exception 'This meetup chat is read-only'; end if;
  if char_length(clean_body)<1 or char_length(clean_body)>1000 then raise exception 'Message must be 1-1000 characters'; end if;
  if exists(
    select 1 from public.ari_circle_meetup_messages recent
    where recent.meetup_id=m.id and recent.user_id=caller_id and recent.created_at>now()-interval '1 second'
  ) then raise exception 'Slow down for a moment'; end if;

  insert into public.ari_circle_meetup_messages(meetup_id,user_id,body)
  values(m.id,caller_id,clean_body)
  returning id into new_message_id;

  return new_message_id;
end;
$$;

revoke all on function public.ari_circle_send_meetup_message(uuid,text) from public, anon, authenticated;
grant execute on function public.ari_circle_send_meetup_message(uuid,text) to authenticated, service_role;

commit;
