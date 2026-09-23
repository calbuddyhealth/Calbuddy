-- ARI Circle profile photo moderation queue + controlled worker
-- Uploads enter private/pending state first. PGMQ absorbs bursts and the
-- server-side worker controls calls to the moderation provider.

begin;

create extension if not exists pgmq;

select pgmq.create('ari_circle_profile_moderation');

alter table public.ari_circle_profile_photos
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_decision text,
  add column if not exists moderation_policy_version text,
  add column if not exists moderation_review_recommended boolean not null default false,
  add column if not exists moderation_review_categories text[] not null default '{}'::text[],
  add column if not exists moderation_blocked_categories text[] not null default '{}'::text[],
  add column if not exists moderation_retry_count integer not null default 0,
  add column if not exists moderation_next_retry_at timestamptz,
  add column if not exists moderation_last_error text,
  add column if not exists moderated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ari_circle_profile_photos_moderation_status_check'
      and conrelid = 'public.ari_circle_profile_photos'::regclass
  ) then
    alter table public.ari_circle_profile_photos
      add constraint ari_circle_profile_photos_moderation_status_check
      check (moderation_status in ('pending','approved','rejected'));
  end if;
end;
$$;

create index if not exists ari_circle_profile_photos_moderation_idx
  on public.ari_circle_profile_photos(moderation_status, moderation_next_retry_at, updated_at);

-- Existing gallery rows predate asynchronous moderation and were already
-- published through the legacy synchronous safety path.
update public.ari_circle_profile_photos
set moderation_status = 'approved',
    moderation_decision = coalesce(moderation_decision, 'legacy_approved'),
    moderated_at = coalesce(moderated_at, updated_at)
where moderation_status is null
   or moderation_status not in ('pending','approved','rejected');

drop function if exists public.ari_circle_profile_photos_list(uuid);

create function public.ari_circle_profile_photos_list(requested_user_id uuid)
returns table(
  "position" smallint,
  media_path text,
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

create or replace function public.ari_circle_profile_photo_set(
  requested_position integer,
  requested_media_path text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_path text := btrim(coalesce(requested_media_path, ''));
  previous_path text := null;
  photo_id uuid;
  queued_message_id bigint := null;
  pending_upload boolean := false;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_position not between 1 and 4 then
    raise exception 'Profile photo slot must be between 1 and 4';
  end if;

  pending_upload := clean_path like caller_id::text || '/profile-gallery-pending/%';

  if clean_path = ''
     or (
       clean_path not like caller_id::text || '/profile-gallery/%'
       and clean_path not like caller_id::text || '/profile-gallery-pending/%'
     )
     or clean_path like '%..%' then
    raise exception 'Invalid profile photo path';
  end if;

  select p.media_path into previous_path
  from public.ari_circle_profile_photos p
  where p.user_id = caller_id and p.position = requested_position
  for update;

  insert into public.ari_circle_profile_photos(
    user_id,
    position,
    media_path,
    moderation_status,
    moderation_decision,
    moderation_policy_version,
    moderation_review_recommended,
    moderation_review_categories,
    moderation_blocked_categories,
    moderation_retry_count,
    moderation_next_retry_at,
    moderation_last_error,
    moderated_at,
    updated_at
  )
  values(
    caller_id,
    requested_position,
    clean_path,
    case when pending_upload then 'pending' else 'approved' end,
    case when pending_upload then null else 'legacy_client_approved' end,
    null,
    false,
    '{}'::text[],
    '{}'::text[],
    0,
    null,
    null,
    case when pending_upload then null else now() end,
    now()
  )
  on conflict(user_id, position)
  do update set
    media_path = excluded.media_path,
    moderation_status = excluded.moderation_status,
    moderation_decision = excluded.moderation_decision,
    moderation_policy_version = null,
    moderation_review_recommended = false,
    moderation_review_categories = '{}'::text[],
    moderation_blocked_categories = '{}'::text[],
    moderation_retry_count = 0,
    moderation_next_retry_at = null,
    moderation_last_error = null,
    moderated_at = excluded.moderated_at,
    updated_at = now()
  returning id into photo_id;

  if pending_upload then
    select q into queued_message_id
    from pgmq.send(
      'ari_circle_profile_moderation',
      jsonb_build_object(
        'photo_id', photo_id,
        'user_id', caller_id,
        'position', requested_position,
        'media_path', clean_path,
        'scope', 'profile_gallery_photo'
      )
    ) as q
    limit 1;
  end if;

  return jsonb_build_object(
    'photo_id', photo_id,
    'position', requested_position,
    'media_path', clean_path,
    'moderation_status', case when pending_upload then 'pending' else 'approved' end,
    'queue_message_id', queued_message_id,
    'replaced_path', previous_path
  );
end;
$$;

revoke all on function public.ari_circle_profile_photo_set(integer,text) from public, anon;
grant execute on function public.ari_circle_profile_photo_set(integer,text) to authenticated;

create or replace function public.ari_circle_can_read_media_path(requested_path text)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select (
    public.ari_circle_current_user_is_adult()
    and exists (
      select 1
      from public.ari_circle_feed_posts p
      where p.media_path = requested_path
        and public.ari_circle_user_is_adult(p.author_user_id)
        and (p.author_user_id = auth.uid() or public.ari_circle_can_view_user(p.author_user_id))
    )
  )
  or (
    public.ari_circle_current_user_is_adult()
    and exists (
      select 1
      from public.ari_circle_moments m
      where m.media_path = requested_path
        and m.expires_at > now()
        and public.ari_circle_user_is_adult(m.author_user_id)
        and (m.author_user_id = auth.uid() or public.ari_circle_can_view_user(m.author_user_id))
    )
  )
  or (
    public.ari_circle_current_user_is_adult()
    and exists (
      select 1
      from public.ari_circle_profile_photos p
      where p.media_path = requested_path
        and public.ari_circle_user_is_adult(p.user_id)
        and (
          p.user_id = auth.uid()
          or (
            p.moderation_status = 'approved'
            and public.ari_circle_can_view_user(p.user_id)
          )
        )
    )
  );
$$;

drop policy if exists ari_circle_post_media_insert_own on storage.objects;
create policy ari_circle_post_media_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ari-circle-post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = any (
    array['posts'::text, 'moments'::text, 'profile-gallery'::text, 'profile-gallery-pending'::text]
  )
);

drop policy if exists ari_circle_post_media_delete_own on storage.objects;
create policy ari_circle_post_media_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ari-circle-post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = any (
    array['posts'::text, 'moments'::text, 'profile-gallery'::text, 'profile-gallery-pending'::text]
  )
);

-- Service-role-only queue consumer. Stale queue messages are discarded here so
-- the worker never spends moderation capacity on a photo that has been replaced.
create or replace function public.ari_circle_profile_moderation_claim(
  requested_limit integer default 8,
  requested_visibility_seconds integer default 120
)
returns table(
  msg_id bigint,
  read_ct integer,
  photo_id uuid,
  user_id uuid,
  "position" smallint,
  media_path text,
  scope text
)
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  queue_message record;
  current_photo public.ari_circle_profile_photos%rowtype;
  parsed_photo_id uuid;
  parsed_path text;
  take_count integer := greatest(1, least(coalesce(requested_limit, 8), 50));
  visibility_seconds integer := greatest(30, least(coalesce(requested_visibility_seconds, 120), 900));
begin
  for queue_message in
    select *
    from pgmq.read('ari_circle_profile_moderation', visibility_seconds, take_count)
  loop
    begin
      parsed_photo_id := nullif(queue_message.message->>'photo_id', '')::uuid;
      parsed_path := btrim(coalesce(queue_message.message->>'media_path', ''));

      select p.* into current_photo
      from public.ari_circle_profile_photos p
      where p.id = parsed_photo_id;

      if not found
         or current_photo.moderation_status <> 'pending'
         or current_photo.media_path <> parsed_path then
        perform pgmq.delete('ari_circle_profile_moderation', queue_message.msg_id);
        continue;
      end if;

      msg_id := queue_message.msg_id;
      read_ct := queue_message.read_ct;
      photo_id := current_photo.id;
      user_id := current_photo.user_id;
      "position" := current_photo.position;
      media_path := current_photo.media_path;
      scope := coalesce(nullif(queue_message.message->>'scope', ''), 'profile_gallery_photo');
      return next;
    exception
      when others then
        perform pgmq.delete('ari_circle_profile_moderation', queue_message.msg_id);
    end;
  end loop;
end;
$$;

revoke all on function public.ari_circle_profile_moderation_claim(integer,integer) from public, anon, authenticated;
grant execute on function public.ari_circle_profile_moderation_claim(integer,integer) to service_role;

create or replace function public.ari_circle_profile_moderation_complete(
  requested_msg_id bigint,
  requested_photo_id uuid,
  requested_media_path text,
  requested_allowed boolean,
  requested_decision text,
  requested_policy_version text default null,
  requested_review_recommended boolean default false,
  requested_review_categories text[] default '{}'::text[],
  requested_blocked_categories text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  affected integer := 0;
  final_status text := case when requested_allowed then 'approved' else 'rejected' end;
begin
  update public.ari_circle_profile_photos
  set moderation_status = final_status,
      moderation_decision = left(btrim(coalesce(requested_decision, 'unknown')), 120),
      moderation_policy_version = nullif(left(btrim(coalesce(requested_policy_version, '')), 120), ''),
      moderation_review_recommended = coalesce(requested_review_recommended, false),
      moderation_review_categories = coalesce(requested_review_categories, '{}'::text[]),
      moderation_blocked_categories = coalesce(requested_blocked_categories, '{}'::text[]),
      moderation_next_retry_at = null,
      moderation_last_error = null,
      moderated_at = now(),
      updated_at = now()
  where id = requested_photo_id
    and media_path = btrim(coalesce(requested_media_path, ''))
    and moderation_status = 'pending';

  get diagnostics affected = row_count;
  perform pgmq.delete('ari_circle_profile_moderation', requested_msg_id);

  return jsonb_build_object(
    'photo_id', requested_photo_id,
    'updated', affected = 1,
    'moderation_status', final_status
  );
end;
$$;

revoke all on function public.ari_circle_profile_moderation_complete(bigint,uuid,text,boolean,text,text,boolean,text[],text[]) from public, anon, authenticated;
grant execute on function public.ari_circle_profile_moderation_complete(bigint,uuid,text,boolean,text,text,boolean,text[],text[]) to service_role;

create or replace function public.ari_circle_profile_moderation_retry(
  requested_msg_id bigint,
  requested_photo_id uuid,
  requested_media_path text,
  requested_delay_seconds integer,
  requested_error text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  delay_seconds integer := greatest(15, least(coalesce(requested_delay_seconds, 60), 3600));
  affected integer := 0;
begin
  update public.ari_circle_profile_photos
  set moderation_retry_count = moderation_retry_count + 1,
      moderation_next_retry_at = now() + make_interval(secs => delay_seconds),
      moderation_last_error = left(btrim(coalesce(requested_error, 'provider_unavailable')), 500),
      updated_at = now()
  where id = requested_photo_id
    and media_path = btrim(coalesce(requested_media_path, ''))
    and moderation_status = 'pending';

  get diagnostics affected = row_count;
  perform pgmq.set_vt('ari_circle_profile_moderation', requested_msg_id, delay_seconds);

  return jsonb_build_object(
    'photo_id', requested_photo_id,
    'updated', affected = 1,
    'retry_in_seconds', delay_seconds
  );
end;
$$;

revoke all on function public.ari_circle_profile_moderation_retry(bigint,uuid,text,integer,text) from public, anon, authenticated;
grant execute on function public.ari_circle_profile_moderation_retry(bigint,uuid,text,integer,text) to service_role;

create or replace function public.ari_circle_profile_moderation_metrics()
returns jsonb
language sql
stable
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
  select to_jsonb(m)
  from pgmq.metrics('ari_circle_profile_moderation') m;
$$;

revoke all on function public.ari_circle_profile_moderation_metrics() from public, anon, authenticated;
grant execute on function public.ari_circle_profile_moderation_metrics() to service_role;

commit;
