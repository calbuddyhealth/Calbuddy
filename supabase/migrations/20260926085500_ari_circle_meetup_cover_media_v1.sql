-- ARI Circle — Meetup Cover Media V1
-- Optional host-supplied invitation photos for Connect cards.
-- Photos stay in the existing adult ari-circle-media bucket under the
-- authenticated host's user-id/cover/meetups/<meetup-id>/ namespace.

begin;

alter table public.ari_circle_meetups
  add column if not exists cover_image_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.ari_circle_meetups'::regclass
      and conname = 'ari_circle_meetups_cover_image_path_check'
  ) then
    alter table public.ari_circle_meetups
      add constraint ari_circle_meetups_cover_image_path_check
      check (
        cover_image_path is null
        or (
          char_length(cover_image_path) between 10 and 500
          and cover_image_path not like '%..%'
          and cover_image_path ~ '^[0-9a-fA-F-]+/cover/meetups/[0-9a-fA-F-]+/[A-Za-z0-9._-]+[.]jpg$'
        )
      );
  end if;
end $$;

comment on column public.ari_circle_meetups.cover_image_path is
  'Optional moderated meetup cover object path in the public ari-circle-media bucket.';

create or replace function public.ari_circle_set_meetup_cover(
  requested_meetup_id uuid,
  requested_cover_image_path text default null
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  meetup_row public.ari_circle_meetups%rowtype;
  clean_path text := nullif(btrim(coalesce(requested_cover_image_path,'')), '');
  expected_prefix text;
begin
  perform public.ari_circle_assert_adult_access();

  if caller_id is null then
    raise exception 'Sign in to manage a meetup photo';
  end if;

  select *
  into meetup_row
  from public.ari_circle_meetups
  where id = requested_meetup_id
  for update;

  if not found then
    raise exception 'Meetup unavailable';
  end if;

  if meetup_row.host_user_id <> caller_id then
    raise exception 'Only the host can change the meetup photo';
  end if;

  if meetup_row.status = 'cancelled' then
    raise exception 'Cancelled meetups cannot change photos';
  end if;

  if clean_path is null then
    update public.ari_circle_meetups
    set cover_image_path = null,
        updated_at = now()
    where id = requested_meetup_id;
    return null;
  end if;

  expected_prefix :=
    caller_id::text || '/cover/meetups/' || requested_meetup_id::text || '/';

  if char_length(clean_path) > 500
     or clean_path like '%..%'
     or left(clean_path, char_length(expected_prefix)) <> expected_prefix
     or clean_path !~ '[.]jpg$' then
    raise exception 'Invalid meetup photo path';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'ari-circle-media'
      and o.name = clean_path
      and (o.owner = caller_id or o.owner_id = caller_id::text)
  ) then
    raise exception 'Meetup photo upload was not found';
  end if;

  update public.ari_circle_meetups
  set cover_image_path = clean_path,
      updated_at = now()
  where id = requested_meetup_id;

  return clean_path;
end;
$function$;

revoke all on function public.ari_circle_set_meetup_cover(uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_circle_set_meetup_cover(uuid,text)
  to authenticated, service_role;

create or replace function public.ari_circle_list_meetups_with_media(
  requested_activity text default null,
  requested_window text default 'upcoming',
  result_limit integer default 30
)
returns table(
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
  pending_request_count bigint,
  cover_image_path text
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select
    listed.meetup_id,
    listed.title,
    listed.activity,
    listed.description,
    listed.area,
    listed.starts_at,
    listed.ends_at,
    listed.max_participants,
    listed.host_user_id,
    listed.host_display_name,
    listed.host_handle,
    listed.host_avatar_url,
    listed.participant_count,
    listed.viewer_joined,
    listed.viewer_completed,
    listed.viewer_is_host,
    listed.participant_xp,
    listed.host_total_xp,
    listed.host_leadership_tier,
    listed.join_mode,
    listed.viewer_request_status,
    listed.pending_request_count,
    meetup.cover_image_path
  from public.ari_circle_list_meetups(
    requested_activity,
    requested_window,
    result_limit
  ) listed
  join public.ari_circle_meetups meetup
    on meetup.id = listed.meetup_id;
$function$;

revoke all on function public.ari_circle_list_meetups_with_media(text,text,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_meetups_with_media(text,text,integer)
  to authenticated, service_role;

commit;
