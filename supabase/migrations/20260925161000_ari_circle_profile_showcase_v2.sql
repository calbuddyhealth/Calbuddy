-- ARI Circle Profile Showcase V2
-- Four fixed profile slots. Each slot can hold one image, one short text card,
-- or one video up to 30 seconds. Avatar remains separate.
--
-- Images keep the existing asynchronous moderation queue. Text and short video
-- publish without a pre-publication AI gate so normal adult profile sharing is
-- not unnecessarily blocked; existing adult access, visibility, reporting, and
-- storage authorization boundaries still apply.

begin;

alter table public.ari_circle_profile_photos
  alter column media_path drop not null,
  add column if not exists content_type text not null default 'image',
  add column if not exists text_content text,
  add column if not exists media_mime text,
  add column if not exists duration_seconds numeric;

alter table public.ari_circle_profile_photos
  drop constraint if exists ari_circle_profile_showcase_content_type_check,
  drop constraint if exists ari_circle_profile_showcase_payload_check,
  drop constraint if exists ari_circle_profile_showcase_video_duration_check;

alter table public.ari_circle_profile_photos
  add constraint ari_circle_profile_showcase_content_type_check
    check (content_type in ('image','video','text')),
  add constraint ari_circle_profile_showcase_payload_check
    check (
      (
        content_type = 'text'
        and media_path is null
        and char_length(btrim(coalesce(text_content,''))) between 1 and 600
      )
      or
      (
        content_type in ('image','video')
        and char_length(btrim(coalesce(media_path,''))) between 3 and 500
        and text_content is null
      )
    ),
  add constraint ari_circle_profile_showcase_video_duration_check
    check (
      content_type <> 'video'
      or (
        duration_seconds is not null
        and duration_seconds > 0
        and duration_seconds <= 30.5
      )
    );

update public.ari_circle_profile_photos
set content_type = 'image'
where content_type is null;

drop function if exists public.ari_circle_profile_photos_list(uuid);

create function public.ari_circle_profile_photos_list(requested_user_id uuid)
returns table(
  "position" smallint,
  media_path text,
  content_type text,
  text_content text,
  media_mime text,
  duration_seconds numeric,
  updated_at timestamptz,
  moderation_status text,
  moderation_decision text,
  moderation_review_recommended boolean
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
begin
  perform public.ari_circle_assert_adult_access();

  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then
    raise exception 'Profile unavailable';
  end if;

  if caller_id <> requested_user_id and not public.ari_circle_can_view_user(requested_user_id) then
    raise exception 'Profile unavailable';
  end if;

  return query
  select
    p.position,
    p.media_path,
    p.content_type,
    p.text_content,
    p.media_mime,
    p.duration_seconds,
    p.updated_at,
    p.moderation_status,
    p.moderation_decision,
    p.moderation_review_recommended
  from public.ari_circle_profile_photos p
  where p.user_id = requested_user_id
    and (
      caller_id = requested_user_id
      or p.moderation_status = 'approved'
    )
  order by p.position asc;
end;
$$;

revoke all on function public.ari_circle_profile_photos_list(uuid) from public, anon;
grant execute on function public.ari_circle_profile_photos_list(uuid) to authenticated;

create or replace function public.ari_circle_profile_showcase_set(
  requested_position integer,
  requested_content_type text,
  requested_media_path text default null,
  requested_text_content text default null,
  requested_media_mime text default null,
  requested_duration_seconds numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_type text := lower(btrim(coalesce(requested_content_type,'')));
  clean_path text := nullif(btrim(coalesce(requested_media_path,'')), '');
  clean_text text := nullif(btrim(coalesce(requested_text_content,'')), '');
  clean_mime text := lower(nullif(btrim(coalesce(requested_media_mime,'')), ''));
  clean_duration numeric := requested_duration_seconds;
  previous_path text := null;
  item_id uuid;
  queued_message_id bigint := null;
  next_status text;
  next_decision text;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_position not between 1 and 4 then
    raise exception 'Profile showcase slot must be between 1 and 4';
  end if;

  if clean_type not in ('image','video','text') then
    raise exception 'Unsupported profile showcase type';
  end if;

  select p.media_path into previous_path
  from public.ari_circle_profile_photos p
  where p.user_id = caller_id
    and p.position = requested_position
  for update;

  if clean_type = 'text' then
    if clean_text is null or char_length(clean_text) > 600 then
      raise exception 'Profile text must be between 1 and 600 characters';
    end if;

    clean_path := null;
    clean_mime := null;
    clean_duration := null;
    next_status := 'approved';
    next_decision := 'profile_showcase_text';
  else
    if clean_path is null
       or clean_path not like caller_id::text || '/profile-gallery-pending/%'
       or clean_path like '%..%' then
      raise exception 'Invalid profile showcase media path';
    end if;

    clean_text := null;

    if clean_type = 'image' then
      if clean_mime is null or clean_mime not like 'image/%' then
        raise exception 'Profile image type is invalid';
      end if;
      clean_duration := null;
      next_status := 'pending';
      next_decision := null;
    else
      if clean_mime is null or clean_mime not like 'video/%' then
        raise exception 'Profile video type is invalid';
      end if;
      if clean_duration is null or clean_duration <= 0 or clean_duration > 30.5 then
        raise exception 'Profile videos must be 30 seconds or shorter';
      end if;
      next_status := 'approved';
      next_decision := 'profile_showcase_video';
    end if;
  end if;

  insert into public.ari_circle_profile_photos(
    user_id,
    position,
    media_path,
    content_type,
    text_content,
    media_mime,
    duration_seconds,
    moderation_status,
    moderation_decision,
    moderation_policy_version,
    moderation_review_recommended,
    moderation_review_categories,
    moderation_blocked_categories,
    moderation_retry_count,
    moderation_next_retry_at,
    moderation_last_error,
    moderation_source,
    moderated_by_user_id,
    moderated_at,
    updated_at
  )
  values(
    caller_id,
    requested_position,
    clean_path,
    clean_type,
    clean_text,
    clean_mime,
    clean_duration,
    next_status,
    next_decision,
    case when clean_type = 'image' then null else 'profile-showcase-v2' end,
    false,
    '{}'::text[],
    '{}'::text[],
    0,
    null,
    null,
    case when clean_type = 'image' then null else 'showcase_direct' end,
    null,
    case when clean_type = 'image' then null else now() end,
    now()
  )
  on conflict(user_id, position)
  do update set
    media_path = excluded.media_path,
    content_type = excluded.content_type,
    text_content = excluded.text_content,
    media_mime = excluded.media_mime,
    duration_seconds = excluded.duration_seconds,
    moderation_status = excluded.moderation_status,
    moderation_decision = excluded.moderation_decision,
    moderation_policy_version = excluded.moderation_policy_version,
    moderation_review_recommended = false,
    moderation_review_categories = '{}'::text[],
    moderation_blocked_categories = '{}'::text[],
    moderation_retry_count = 0,
    moderation_next_retry_at = null,
    moderation_last_error = null,
    moderation_source = excluded.moderation_source,
    moderated_by_user_id = null,
    moderated_at = excluded.moderated_at,
    updated_at = now()
  returning id into item_id;

  if clean_type = 'image' then
    select q into queued_message_id
    from pgmq.send(
      'ari_circle_profile_moderation',
      jsonb_build_object(
        'photo_id', item_id,
        'user_id', caller_id,
        'position', requested_position,
        'media_path', clean_path,
        'scope', 'profile_gallery_photo'
      )
    ) as q
    limit 1;
  end if;

  return jsonb_build_object(
    'item_id', item_id,
    'position', requested_position,
    'content_type', clean_type,
    'media_path', clean_path,
    'text_content', clean_text,
    'media_mime', clean_mime,
    'duration_seconds', clean_duration,
    'moderation_status', next_status,
    'queue_message_id', queued_message_id,
    'replaced_path', previous_path
  );
end;
$$;

revoke all on function public.ari_circle_profile_showcase_set(integer,text,text,text,text,numeric)
  from public, anon;
grant execute on function public.ari_circle_profile_showcase_set(integer,text,text,text,text,numeric)
  to authenticated;

comment on function public.ari_circle_profile_showcase_set(integer,text,text,text,text,numeric)
  is 'Writes one of four adult ARI Circle profile showcase slots. Images use queued moderation; text and <=30s video publish directly.';

commit;
