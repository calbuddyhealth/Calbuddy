-- ARI XP — one challenge entry per participant
-- 2026-08-17
--
-- Build 5 challenge rule:
-- - Non-goal challenges accept one final entry per participant.
-- - Existing entries can no longer be replaced through the submit RPC.
-- - Deleting an entry does not restore eligibility because completed_at remains
--   on the challenge membership created by the first accepted submission.

create or replace function public.ari_circle_challenge_submit_entry(
  requested_challenge_id uuid,
  requested_caption text default null::text,
  requested_media_path text default null::text,
  requested_media_type text default null::text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  dob date;
  band text;
  target public.ari_circle_challenges%rowtype;
  clean_caption text := nullif(btrim(coalesce(requested_caption,'')), '');
  clean_path text := nullif(btrim(coalesce(requested_media_path,'')), '');
  clean_type text := nullif(lower(btrim(coalesce(requested_media_type,''))), '');
  entry_id uuid;
  actor_name text;
  prior_completion timestamptz;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select date_of_birth into dob
  from public.ari_account_state
  where user_id = caller_id;

  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then
    raise exception 'Verify your age before posting an entry';
  end if;

  select * into target
  from public.ari_circle_challenges
  where id = requested_challenge_id
    and status = 'active'
    and ends_at > now();

  if not found then raise exception 'Challenge is no longer available'; end if;
  if target.age_band <> band then raise exception 'This challenge is outside your age group'; end if;
  if public.ari_circle_feed_is_blocked(target.creator_user_id) then raise exception 'This challenge is unavailable'; end if;

  -- Build 5: a non-goal social challenge has one final entry per participant.
  -- The direct entry lookup blocks replacements while the row exists. The
  -- completed membership check also prevents delete-then-resubmit bypasses.
  if target.challenge_mode <> 'goal' then
    if exists (
      select 1
      from public.ari_circle_challenge_entries e
      where e.challenge_id = target.id
        and e.user_id = caller_id
    ) then
      raise exception 'You can only submit one entry per challenge';
    end if;

    select m.completed_at into prior_completion
    from public.ari_circle_challenge_members m
    where m.challenge_id = target.id
      and m.user_id = caller_id;

    if prior_completion is not null then
      raise exception 'You already submitted your entry for this challenge';
    end if;
  end if;

  if clean_caption is not null and char_length(clean_caption) > 360 then
    raise exception 'Entry caption is too long';
  end if;
  if clean_caption is null and clean_path is null then
    raise exception 'Add a photo, video, or a few words';
  end if;

  if band = 'teen' and clean_caption is not null and (
    clean_caption ~* '(https?://|www\.|@[a-z0-9_.-]{2,})'
    or clean_caption ~ '[0-9][0-9 ()+.-]{6,}[0-9]'
  ) then
    raise exception 'Teen challenge entries cannot include contact details or external handles';
  end if;

  if clean_path is not null then
    if split_part(clean_path,'/',1) <> band
       or split_part(clean_path,'/',2) <> caller_id::text then
      raise exception 'Challenge media path is invalid';
    end if;
    if clean_type not in ('image','video') then
      raise exception 'Choose a valid photo or video';
    end if;
  else
    clean_type := null;
  end if;

  insert into public.ari_circle_challenge_members(challenge_id,user_id)
  values(target.id,caller_id)
  on conflict do nothing;

  -- Insert only. The previous ON CONFLICT ... DO UPDATE path intentionally no
  -- longer exists, so a submitted entry cannot be swapped for another video.
  insert into public.ari_circle_challenge_entries(
    challenge_id,user_id,caption,media_path,media_type
  ) values (
    target.id,caller_id,clean_caption,clean_path,clean_type
  )
  returning id into entry_id;

  if target.challenge_mode <> 'goal' then
    update public.ari_circle_challenge_members
    set progress = 1,
        completed_at = coalesce(completed_at,now()),
        updated_at = now()
    where challenge_id = target.id
      and user_id = caller_id;
  end if;

  if target.creator_user_id <> caller_id then
    select coalesce(display_name,'Someone') into actor_name
    from public.ari_circle_profiles
    where user_id = caller_id;

    insert into public.ari_circle_notifications(
      user_id,type,title,body,actor_user_id,actor_display_name,profile_user_id,data
    ) values (
      target.creator_user_id,
      'challenge_entry',
      'New challenge entry',
      actor_name || ' joined “' || left(target.title,60) || '”.',
      caller_id,
      actor_name,
      caller_id,
      jsonb_build_object('challenge_id',target.id,'entry_id',entry_id)
    );
  end if;

  return entry_id;
end;
$$;
