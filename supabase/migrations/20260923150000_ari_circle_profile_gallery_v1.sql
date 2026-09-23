-- ARI Circle Profile Gallery V1
-- Avatar remains the primary profile photo. Four supporting gallery slots
-- create a hard maximum of five visible personal photos per profile.

begin;

create table if not exists public.ari_circle_profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  media_path text not null check (char_length(btrim(media_path)) between 3 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, position)
);

create index if not exists ari_circle_profile_photos_user_idx
  on public.ari_circle_profile_photos(user_id, position);

alter table public.ari_circle_profile_photos enable row level security;
revoke all on table public.ari_circle_profile_photos from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_profile_photos to service_role;

create or replace function public.ari_circle_profile_photos_list(requested_user_id uuid)
returns table(position smallint, media_path text, updated_at timestamptz)
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
  select p.position, p.media_path, p.updated_at
  from public.ari_circle_profile_photos p
  where p.user_id = requested_user_id
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
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_path text := btrim(coalesce(requested_media_path, ''));
  previous_path text := null;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_position not between 1 and 4 then
    raise exception 'Profile photo slot must be between 1 and 4';
  end if;

  if clean_path = ''
     or clean_path not like caller_id::text || '/profile-gallery/%'
     or clean_path like '%..%' then
    raise exception 'Invalid profile photo path';
  end if;

  select p.media_path into previous_path
  from public.ari_circle_profile_photos p
  where p.user_id = caller_id and p.position = requested_position
  for update;

  insert into public.ari_circle_profile_photos(user_id, position, media_path, updated_at)
  values(caller_id, requested_position, clean_path, now())
  on conflict(user_id, position)
  do update set media_path = excluded.media_path, updated_at = now();

  return jsonb_build_object(
    'position', requested_position,
    'media_path', clean_path,
    'replaced_path', previous_path
  );
end;
$$;

revoke all on function public.ari_circle_profile_photo_set(integer,text) from public, anon;
grant execute on function public.ari_circle_profile_photo_set(integer,text) to authenticated;

create or replace function public.ari_circle_profile_photo_remove(requested_position integer)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  removed_path text := null;
begin
  perform public.ari_circle_assert_adult_access();

  if requested_position not between 1 and 4 then
    raise exception 'Profile photo slot must be between 1 and 4';
  end if;

  delete from public.ari_circle_profile_photos
  where user_id = caller_id and position = requested_position
  returning media_path into removed_path;

  return jsonb_build_object(
    'position', requested_position,
    'removed_path', removed_path
  );
end;
$$;

revoke all on function public.ari_circle_profile_photo_remove(integer) from public, anon;
grant execute on function public.ari_circle_profile_photo_remove(integer) to authenticated;

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
        and (p.user_id = auth.uid() or public.ari_circle_can_view_user(p.user_id))
    )
  );
$$;

revoke all on function public.ari_circle_can_read_media_path(text) from public, anon;
grant execute on function public.ari_circle_can_read_media_path(text) to authenticated;

drop policy if exists "ari_circle_post_media_insert_own" on storage.objects;
create policy "ari_circle_post_media_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ari-circle-post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = any (array['posts'::text,'moments'::text,'profile-gallery'::text])
);

drop policy if exists "ari_circle_post_media_delete_own" on storage.objects;
create policy "ari_circle_post_media_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ari-circle-post-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] = any (array['posts'::text,'moments'::text,'profile-gallery'::text])
);

commit;
