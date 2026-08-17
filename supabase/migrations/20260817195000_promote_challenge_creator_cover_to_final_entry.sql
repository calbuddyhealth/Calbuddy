create or replace function public.ari_circle_challenge_create_v3(
  requested_title text,
  requested_description text default null::text,
  requested_mode text default 'participate'::text,
  requested_hours integer default 24,
  requested_entry_media_type text default 'image'::text,
  requested_video_max_seconds integer default null::integer,
  requested_cover_media_path text default null::text,
  requested_cover_media_type text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'storage'
as $function$
declare
  caller_id uuid := auth.uid();
  dob date;
  band text;
  clean_title text := btrim(coalesce(requested_title,''));
  clean_description text := nullif(btrim(coalesce(requested_description,'')), '');
  clean_mode text := lower(btrim(coalesce(requested_mode,'participate')));
  clean_entry_type text := lower(btrim(coalesce(requested_entry_media_type,'image')));
  clean_cover_path text := nullif(btrim(coalesce(requested_cover_media_path,'')), '');
  clean_cover_type text := nullif(lower(btrim(coalesce(requested_cover_media_type,''))), '');
  safe_hours integer := least(greatest(coalesce(requested_hours,24),1),168);
  safe_video_seconds smallint := null;
  new_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select date_of_birth into dob
  from public.ari_account_state
  where user_id = caller_id;

  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then
    raise exception 'Verify your age before creating a challenge';
  end if;

  if char_length(clean_title) < 3 or char_length(clean_title) > 80 then
    raise exception 'Challenge title must be 3 to 80 characters';
  end if;
  if clean_description is not null and char_length(clean_description) > 360 then
    raise exception 'Challenge description is too long';
  end if;
  if clean_mode not in ('participate','reaction','vote') then
    raise exception 'Choose how this challenge ends';
  end if;
  if clean_entry_type not in ('image','video') then
    raise exception 'Choose a photo or video challenge';
  end if;

  if clean_entry_type = 'video' then
    if requested_video_max_seconds not in (10,15,30) then
      raise exception 'Video challenges must be 10, 15, or 30 seconds';
    end if;
    safe_video_seconds := requested_video_max_seconds::smallint;
  end if;

  if band = 'teen' and (
    clean_title ~* '(https?://|www\\.|@[a-z0-9_.-]{2,})'
    or clean_title ~ '[0-9][0-9 ()+.-]{6,}[0-9]'
    or coalesce(clean_description,'') ~* '(https?://|www\\.|@[a-z0-9_.-]{2,})'
    or coalesce(clean_description,'') ~ '[0-9][0-9 ()+.-]{6,}[0-9]'
  ) then
    raise exception 'Teen challenges cannot include contact details or external handles';
  end if;

  if clean_cover_path is not null then
    if split_part(clean_cover_path,'/',1) <> band
       or split_part(clean_cover_path,'/',2) <> caller_id::text then
      raise exception 'Challenge media path is invalid';
    end if;
    if clean_cover_type <> clean_entry_type then
      raise exception 'Challenge cover must match the photo or video challenge type';
    end if;
  else
    clean_cover_type := null;
  end if;

  insert into public.ari_circle_challenges(
    creator_user_id,
    age_band,
    title,
    description,
    metric,
    goal_value,
    unit_label,
    starts_at,
    ends_at,
    challenge_mode,
    cover_media_path,
    cover_media_type,
    entry_media_type,
    video_max_seconds
  ) values (
    caller_id,
    band,
    clean_title,
    clean_description,
    'custom',
    1,
    'entry',
    now(),
    now() + make_interval(hours => safe_hours),
    clean_mode,
    clean_cover_path,
    clean_cover_type,
    clean_entry_type,
    safe_video_seconds
  ) returning id into new_id;

  insert into public.ari_circle_challenge_members(challenge_id,user_id)
  values(new_id,caller_id)
  on conflict do nothing;

  -- Media supplied during creation is the creator's one final entry too.
  -- The same already-moderated object is reused, so there is no duplicate
  -- upload and no redundant post-create entry prompt.
  if clean_cover_path is not null then
    insert into public.ari_circle_challenge_entries(
      challenge_id,
      user_id,
      caption,
      media_path,
      media_type,
      media_duration_seconds
    ) values (
      new_id,
      caller_id,
      null,
      clean_cover_path,
      clean_cover_type,
      null
    )
    on conflict (challenge_id,user_id) do nothing;

    update public.ari_circle_challenge_members
    set progress = 1,
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where challenge_id = new_id
      and user_id = caller_id;
  end if;

  insert into public.ari_circle_user_rewards(user_id,reward_key,metadata)
  values(caller_id,'challenge_creator',jsonb_build_object('title','Challenge Maker','challenge_id',new_id))
  on conflict (user_id,reward_key) do nothing;

  return new_id;
end;
$function$;
