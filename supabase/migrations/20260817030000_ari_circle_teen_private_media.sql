-- ARI Circle Build 5 — private Teen Circle profile media
-- 2026-08-17
--
-- Adult legacy profile media remains in ari-circle-media for compatibility.
-- Teen accounts are prevented from writing profile/wall media there and use
-- ari-circle-teen-media, a private bucket resolved with short-lived signed URLs.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ari-circle-teen-media',
  'ari-circle-teen-media',
  false,
  6291456,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.ari_circle_my_age_band()
returns text
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_age_band_for_date(s.date_of_birth)
  from public.ari_account_state s
  where s.user_id = auth.uid();
$$;

revoke all on function public.ari_circle_my_age_band() from public, anon;
grant execute on function public.ari_circle_my_age_band() to authenticated;

-- Teen accounts may not use the legacy PUBLIC profile-media bucket.
drop policy if exists "Users can upload their own ARI Circle media" on storage.objects;
create policy "Users can upload their own ARI Circle media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
  and (
    (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
    or (
      (storage.foldername(name))[2] = 'love'
      and (storage.foldername(name))[3] is not null
    )
  )
);

drop policy if exists "ari_circle_media_insert_own" on storage.objects;
create policy "ari_circle_media_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
  and (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
);

drop policy if exists "Users can update their own ARI Circle media" on storage.objects;
create policy "Users can update their own ARI Circle media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
)
with check (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
  and (
    (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
    or (
      (storage.foldername(name))[2] = 'love'
      and (storage.foldername(name))[3] is not null
    )
  )
);

drop policy if exists "ari_circle_media_update_own" on storage.objects;
create policy "ari_circle_media_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
)
with check (
  bucket_id = 'ari-circle-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'adult'
  and (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
);

-- Private Teen Circle bucket. Canonical paths are:
--   <teen-user-id>/avatar/<file>
--   <teen-user-id>/cover/<file>
--   <teen-user-id>/love/<profile-user-id>/<file>
drop policy if exists "Teen Circle media insert own" on storage.objects;
create policy "Teen Circle media insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ari-circle-teen-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'teen'
  and (
    (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
    or (
      (storage.foldername(name))[2] = 'love'
      and exists (
        select 1
        from public.ari_circle_profiles p
        where p.user_id::text = (storage.foldername(name))[3]
          and public.ari_circle_can_view_user(p.user_id)
      )
    )
  )
);

drop policy if exists "Teen Circle media read cohort" on storage.objects;
create policy "Teen Circle media read cohort"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ari-circle-teen-media'
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'teen'
  and exists (
    select 1
    from public.ari_circle_profiles owner_profile
    where owner_profile.user_id::text = (storage.foldername(name))[1]
      and public.ari_circle_can_view_user(owner_profile.user_id)
  )
  and (
    (storage.foldername(name))[2] = any (array['avatar'::text,'cover'::text])
    or (
      (storage.foldername(name))[2] = 'love'
      and exists (
        select 1
        from public.ari_circle_profiles target_profile
        where target_profile.user_id::text = (storage.foldername(name))[3]
          and public.ari_circle_can_view_user(target_profile.user_id)
      )
    )
  )
);

drop policy if exists "Teen Circle media update own" on storage.objects;
create policy "Teen Circle media update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ari-circle-teen-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'ari-circle-teen-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.ari_circle_age_band_for_date((
    select s.date_of_birth
    from public.ari_account_state s
    where s.user_id = auth.uid()
  )) = 'teen'
);

drop policy if exists "Teen Circle media delete own" on storage.objects;
create policy "Teen Circle media delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ari-circle-teen-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.ari_circle_enforce_teen_profile_privacy()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  band text;
begin
  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into band
  from public.ari_account_state s
  where s.user_id = new.user_id;

  if band = 'teen' then
    -- Exact birthday/location are not part of the public Teen Circle profile.
    new.birthday := null;
    new.location := null;

    if new.avatar_url is not null
       and new.avatar_url not like 'ari-private://ari-circle-teen-media/%' then
      raise exception 'Teen Circle profile photos must use private Teen Circle media';
    end if;

    if new.cover_url is not null
       and new.cover_url not like 'ari-private://ari-circle-teen-media/%' then
      raise exception 'Teen Circle background photos must use private Teen Circle media';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_enforce_teen_profile_privacy() from public, anon, authenticated;

drop trigger if exists ari_circle_profiles_teen_private_media_guard on public.ari_circle_profiles;
create trigger ari_circle_profiles_teen_private_media_guard
before insert or update of avatar_url, cover_url, location, birthday
on public.ari_circle_profiles
for each row execute function public.ari_circle_enforce_teen_profile_privacy();

create or replace function public.ari_circle_enforce_teen_wall_media_privacy()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  band text;
  has_media boolean;
begin
  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into band
  from public.ari_account_state s
  where s.user_id = new.author_user_id;

  if band = 'teen' then
    has_media := new.image_url is not null or new.image_path is not null;
    if has_media and (
      coalesce(new.image_url, '') not like 'ari-private://ari-circle-teen-media/%'
      or coalesce(new.image_path, '') not like 'ari-private://ari-circle-teen-media/%'
    ) then
      raise exception 'Teen Circle wall photos must use private Teen Circle media';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_enforce_teen_wall_media_privacy() from public, anon, authenticated;

drop trigger if exists ari_circle_comments_teen_private_media_guard on public.ari_circle_comments;
create trigger ari_circle_comments_teen_private_media_guard
before insert or update of image_url, image_path
on public.ari_circle_comments
for each row execute function public.ari_circle_enforce_teen_wall_media_privacy();

commit;
