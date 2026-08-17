-- ARI XP — Build 5 ARI Circle photo/video challenge contract
-- 2026-08-17
--
-- New social challenge model:
-- - Every new challenge is PHOTO or VIDEO.
-- - Video challenges choose a hard app contract of 10, 15, or 30 seconds.
-- - One final entry per participant remains authoritative at the database layer.
-- - Active feeds are paged by media type; recently ended results are queried separately.
-- - Legacy V2 RPCs remain available for compatibility, but typed video challenges
--   require the V3 submission RPC so the selected duration is supplied.

alter table public.ari_circle_challenges
  add column if not exists entry_media_type text,
  add column if not exists video_max_seconds smallint;

alter table public.ari_circle_challenge_entries
  add column if not exists media_duration_seconds numeric(6,2);

update public.ari_circle_challenges
set
  entry_media_type = case when cover_media_type = 'video' then 'video' else 'image' end,
  video_max_seconds = case when cover_media_type = 'video' then 30 else null end
where challenge_mode <> 'goal'
  and entry_media_type is null;

update public.ari_circle_challenges
set video_max_seconds = 30
where entry_media_type = 'video'
  and video_max_seconds is null;

alter table public.ari_circle_challenges
  drop constraint if exists ari_circle_challenges_entry_media_type_check,
  add constraint ari_circle_challenges_entry_media_type_check
    check (entry_media_type is null or entry_media_type in ('image','video')),
  drop constraint if exists ari_circle_challenges_video_max_seconds_check,
  add constraint ari_circle_challenges_video_max_seconds_check
    check (
      (entry_media_type = 'video' and video_max_seconds in (10,15,30))
      or (entry_media_type = 'image' and video_max_seconds is null)
      or entry_media_type is null
    );

alter table public.ari_circle_challenge_entries
  drop constraint if exists ari_circle_challenge_entries_media_duration_check,
  add constraint ari_circle_challenge_entries_media_duration_check
    check (media_duration_seconds is null or (media_duration_seconds > 0 and media_duration_seconds <= 30.5));

create index if not exists ari_circle_challenges_live_media_idx
  on public.ari_circle_challenges(age_band, entry_media_type, status, ends_at desc, created_at desc);

create index if not exists ari_circle_challenges_recent_media_idx
  on public.ari_circle_challenges(age_band, entry_media_type, ends_at desc)
  where status = 'active';

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
set search_path = public, auth, storage
as $$
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

  insert into public.ari_circle_user_rewards(user_id,reward_key,metadata)
  values(caller_id,'challenge_creator',jsonb_build_object('title','Challenge Maker','challenge_id',new_id))
  on conflict (user_id,reward_key) do nothing;

  return new_id;
end;
$$;

create or replace function public.ari_circle_challenge_list_v3(
  requested_media_type text default 'image'::text,
  requested_filter text default 'for-you'::text,
  result_limit integer default 10,
  result_offset integer default 0
)
returns table(
  challenge_id uuid,
  creator_user_id uuid,
  creator_display_name text,
  creator_handle text,
  creator_avatar_url text,
  title text,
  description text,
  challenge_mode text,
  entry_media_type text,
  video_max_seconds smallint,
  starts_at timestamptz,
  ends_at timestamptz,
  cover_media_path text,
  cover_media_type text,
  member_count integer,
  entry_count integer,
  hype_count integer,
  vote_count integer,
  viewer_joined boolean,
  viewer_completed_at timestamptz,
  creator_is_friend boolean,
  friend_member_count integer,
  viewer_has_entry boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  dob date;
  band text;
  clean_media text := lower(btrim(coalesce(requested_media_type,'image')));
  clean_filter text := lower(btrim(coalesce(requested_filter,'for-you')));
  safe_limit integer := least(greatest(coalesce(result_limit,10),1),20);
  safe_offset integer := least(greatest(coalesce(result_offset,0),0),2000);
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if clean_media not in ('image','video') then raise exception 'Choose photo or video challenges'; end if;
  if clean_filter not in ('for-you','friends','trending') then clean_filter := 'for-you'; end if;

  select date_of_birth into dob
  from public.ari_account_state
  where user_id = caller_id;

  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then
    raise exception 'Verify your age before opening Challenges';
  end if;

  return query
  with ranked as (
    select
      ch.id as challenge_id,
      ch.creator_user_id,
      p.display_name as creator_display_name,
      p.handle::text as creator_handle,
      p.avatar_url as creator_avatar_url,
      ch.title,
      ch.description,
      ch.challenge_mode,
      ch.entry_media_type,
      ch.video_max_seconds,
      ch.starts_at,
      ch.ends_at,
      ch.cover_media_path,
      ch.cover_media_type,
      (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id) as member_count,
      (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id) as entry_count,
      (select count(*)::int
         from public.ari_circle_challenge_entry_reactions r
         join public.ari_circle_challenge_entries e on e.id = r.entry_id
        where e.challenge_id = ch.id and r.reaction_key = 'hype') as hype_count,
      (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id) as vote_count,
      exists(select 1 from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id) as viewer_joined,
      (select m.completed_at from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id) as viewer_completed_at,
      exists(
        select 1 from public.ari_circle_connections c
        where c.status = 'accepted' and (
          (c.requester_user_id = caller_id and c.addressee_user_id = ch.creator_user_id)
          or (c.addressee_user_id = caller_id and c.requester_user_id = ch.creator_user_id)
        )
      ) as creator_is_friend,
      (
        select count(distinct m.user_id)::int
        from public.ari_circle_challenge_members m
        where m.challenge_id = ch.id
          and exists(
            select 1 from public.ari_circle_connections c
            where c.status = 'accepted' and (
              (c.requester_user_id = caller_id and c.addressee_user_id = m.user_id)
              or (c.addressee_user_id = caller_id and c.requester_user_id = m.user_id)
            )
          )
      ) as friend_member_count,
      exists(select 1 from public.ari_circle_challenge_entries e where e.challenge_id = ch.id and e.user_id = caller_id) as viewer_has_entry
    from public.ari_circle_challenges ch
    join public.ari_circle_profiles p on p.user_id = ch.creator_user_id
    where ch.age_band = band
      and ch.status = 'active'
      and ch.ends_at > now()
      and ch.challenge_mode <> 'goal'
      and ch.entry_media_type = clean_media
      and not public.ari_circle_feed_is_blocked(ch.creator_user_id)
  ), scored as (
    select
      ranked.*,
      (
        ranked.entry_count * 5
        + ranked.hype_count * 2
        + ranked.vote_count * 3
        + ranked.member_count
        + ranked.friend_member_count * 4
      )::bigint as engagement_score
    from ranked
    where clean_filter <> 'friends'
       or ranked.creator_is_friend
       or ranked.friend_member_count > 0
  )
  select
    s.challenge_id,
    s.creator_user_id,
    s.creator_display_name,
    s.creator_handle,
    s.creator_avatar_url,
    s.title,
    s.description,
    s.challenge_mode,
    s.entry_media_type,
    s.video_max_seconds,
    s.starts_at,
    s.ends_at,
    s.cover_media_path,
    s.cover_media_type,
    s.member_count,
    s.entry_count,
    s.hype_count,
    s.vote_count,
    s.viewer_joined,
    s.viewer_completed_at,
    s.creator_is_friend,
    s.friend_member_count,
    s.viewer_has_entry
  from scored s
  order by
    case when clean_filter = 'trending' then s.engagement_score else 0 end desc,
    case when clean_filter = 'friends' then s.friend_member_count else 0 end desc,
    case when clean_filter = 'for-you'
      then (case when s.creator_is_friend then 12 else 0 end) + s.friend_member_count * 4 + s.engagement_score
      else 0 end desc,
    s.starts_at desc
  limit safe_limit
  offset safe_offset;
end;
$$;

create or replace function public.ari_circle_challenge_recent_v1(
  requested_media_type text default 'image'::text,
  result_limit integer default 4
)
returns table(
  challenge_id uuid,
  creator_user_id uuid,
  creator_display_name text,
  title text,
  challenge_mode text,
  entry_media_type text,
  video_max_seconds smallint,
  ends_at timestamptz,
  cover_media_path text,
  cover_media_type text,
  member_count integer,
  entry_count integer,
  hype_count integer,
  vote_count integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  dob date;
  band text;
  clean_media text := lower(btrim(coalesce(requested_media_type,'image')));
  safe_limit integer := least(greatest(coalesce(result_limit,4),1),8);
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if clean_media not in ('image','video') then raise exception 'Choose photo or video challenges'; end if;

  select date_of_birth into dob from public.ari_account_state where user_id = caller_id;
  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then raise exception 'Verify your age before opening Challenges'; end if;

  return query
  select
    ch.id,
    ch.creator_user_id,
    p.display_name,
    ch.title,
    ch.challenge_mode,
    ch.entry_media_type,
    ch.video_max_seconds,
    ch.ends_at,
    ch.cover_media_path,
    ch.cover_media_type,
    (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id),
    (select count(*)::int
       from public.ari_circle_challenge_entry_reactions r
       join public.ari_circle_challenge_entries e on e.id = r.entry_id
      where e.challenge_id = ch.id and r.reaction_key = 'hype'),
    (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id)
  from public.ari_circle_challenges ch
  join public.ari_circle_profiles p on p.user_id = ch.creator_user_id
  where ch.age_band = band
    and ch.status = 'active'
    and ch.challenge_mode <> 'goal'
    and ch.entry_media_type = clean_media
    and ch.ends_at <= now()
    and ch.ends_at > now() - interval '48 hours'
    and not public.ari_circle_feed_is_blocked(ch.creator_user_id)
  order by ch.ends_at desc
  limit safe_limit;
end;
$$;

create or replace function public.ari_circle_challenge_get_v1(
  requested_challenge_id uuid
)
returns table(
  challenge_id uuid,
  creator_user_id uuid,
  creator_display_name text,
  creator_handle text,
  creator_avatar_url text,
  title text,
  description text,
  challenge_mode text,
  entry_media_type text,
  video_max_seconds smallint,
  starts_at timestamptz,
  ends_at timestamptz,
  cover_media_path text,
  cover_media_type text,
  member_count integer,
  entry_count integer,
  hype_count integer,
  vote_count integer,
  viewer_joined boolean,
  viewer_completed_at timestamptz,
  creator_is_friend boolean,
  friend_member_count integer,
  viewer_has_entry boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  dob date;
  band text;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select date_of_birth into dob from public.ari_account_state where user_id = caller_id;
  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then raise exception 'Verify your age before opening Challenges'; end if;

  return query
  select
    ch.id,
    ch.creator_user_id,
    p.display_name,
    p.handle::text,
    p.avatar_url,
    ch.title,
    ch.description,
    ch.challenge_mode,
    ch.entry_media_type,
    ch.video_max_seconds,
    ch.starts_at,
    ch.ends_at,
    ch.cover_media_path,
    ch.cover_media_type,
    (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id),
    (select count(*)::int
       from public.ari_circle_challenge_entry_reactions r
       join public.ari_circle_challenge_entries e on e.id = r.entry_id
      where e.challenge_id = ch.id and r.reaction_key = 'hype'),
    (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id),
    exists(select 1 from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id),
    (select m.completed_at from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id),
    exists(
      select 1 from public.ari_circle_connections c
      where c.status = 'accepted' and (
        (c.requester_user_id = caller_id and c.addressee_user_id = ch.creator_user_id)
        or (c.addressee_user_id = caller_id and c.requester_user_id = ch.creator_user_id)
      )
    ),
    (
      select count(distinct m.user_id)::int
      from public.ari_circle_challenge_members m
      where m.challenge_id = ch.id and exists(
        select 1 from public.ari_circle_connections c
        where c.status = 'accepted' and (
          (c.requester_user_id = caller_id and c.addressee_user_id = m.user_id)
          or (c.addressee_user_id = caller_id and c.requester_user_id = m.user_id)
        )
      )
    ),
    exists(select 1 from public.ari_circle_challenge_entries e where e.challenge_id = ch.id and e.user_id = caller_id)
  from public.ari_circle_challenges ch
  join public.ari_circle_profiles p on p.user_id = ch.creator_user_id
  where ch.id = requested_challenge_id
    and ch.age_band = band
    and ch.status <> 'canceled'
    and ch.challenge_mode <> 'goal'
    and ch.ends_at > now() - interval '48 hours'
    and not public.ari_circle_feed_is_blocked(ch.creator_user_id)
  limit 1;
end;
$$;

create or replace function public.ari_circle_challenge_submit_entry_v3(
  requested_challenge_id uuid,
  requested_caption text default null::text,
  requested_media_path text default null::text,
  requested_media_type text default null::text,
  requested_media_duration_seconds numeric default null::numeric
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
  clean_duration numeric := requested_media_duration_seconds;
  entry_id uuid;
  actor_name text;
  prior_completion timestamptz;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select date_of_birth into dob from public.ari_account_state where user_id = caller_id;
  band := public.ari_circle_age_band_for_date(dob);
  if band not in ('teen','adult') then raise exception 'Verify your age before posting an entry'; end if;

  select * into target
  from public.ari_circle_challenges
  where id = requested_challenge_id
    and status = 'active'
    and ends_at > now();

  if not found then raise exception 'Challenge is no longer available'; end if;
  if target.age_band <> band then raise exception 'This challenge is outside your age group'; end if;
  if public.ari_circle_feed_is_blocked(target.creator_user_id) then raise exception 'This challenge is unavailable'; end if;

  if target.challenge_mode <> 'goal' then
    if exists (
      select 1 from public.ari_circle_challenge_entries e
      where e.challenge_id = target.id and e.user_id = caller_id
    ) then
      raise exception 'You can only submit one entry per challenge';
    end if;

    select m.completed_at into prior_completion
    from public.ari_circle_challenge_members m
    where m.challenge_id = target.id and m.user_id = caller_id;

    if prior_completion is not null then
      raise exception 'You already submitted your entry for this challenge';
    end if;
  end if;

  if clean_caption is not null and char_length(clean_caption) > 360 then
    raise exception 'Entry caption is too long';
  end if;

  if target.entry_media_type in ('image','video') then
    if clean_path is null then raise exception 'This challenge requires a media entry'; end if;
    if clean_type <> target.entry_media_type then
      raise exception case when target.entry_media_type = 'video'
        then 'This is a video-only challenge'
        else 'This is a photo-only challenge' end;
    end if;
  elsif clean_caption is null and clean_path is null then
    raise exception 'Add a photo, video, or a few words';
  end if;

  if band = 'teen' and clean_caption is not null and (
    clean_caption ~* '(https?://|www\\.|@[a-z0-9_.-]{2,})'
    or clean_caption ~ '[0-9][0-9 ()+.-]{6,}[0-9]'
  ) then
    raise exception 'Teen challenge entries cannot include contact details or external handles';
  end if;

  if clean_path is not null then
    if split_part(clean_path,'/',1) <> band
       or split_part(clean_path,'/',2) <> caller_id::text then
      raise exception 'Challenge media path is invalid';
    end if;
    if clean_type not in ('image','video') then raise exception 'Choose a valid photo or video'; end if;
  else
    clean_type := null;
  end if;

  if target.entry_media_type = 'video' then
    if clean_duration is null or clean_duration <= 0 then
      raise exception 'Video duration is required';
    end if;
    if clean_duration > coalesce(target.video_max_seconds,30) + 0.5 then
      raise exception 'Video is longer than this challenge allows';
    end if;
  else
    clean_duration := null;
  end if;

  insert into public.ari_circle_challenge_members(challenge_id,user_id)
  values(target.id,caller_id)
  on conflict do nothing;

  insert into public.ari_circle_challenge_entries(
    challenge_id,
    user_id,
    caption,
    media_path,
    media_type,
    media_duration_seconds
  ) values (
    target.id,
    caller_id,
    clean_caption,
    clean_path,
    clean_type,
    clean_duration
  ) returning id into entry_id;

  if target.challenge_mode <> 'goal' then
    update public.ari_circle_challenge_members
    set progress = 1,
        completed_at = coalesce(completed_at,now()),
        updated_at = now()
    where challenge_id = target.id and user_id = caller_id;
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

-- Keep the legacy RPC for old image/goal flows, but force typed video
-- challenges through V3 so their 10/15/30 second contract cannot be skipped.
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
  target_type text;
begin
  select entry_media_type into target_type
  from public.ari_circle_challenges
  where id = requested_challenge_id;

  if target_type = 'video' then
    raise exception 'Refresh ARI XP before submitting this video challenge';
  end if;

  return public.ari_circle_challenge_submit_entry_v3(
    requested_challenge_id,
    requested_caption,
    requested_media_path,
    requested_media_type,
    null
  );
end;
$$;

revoke all on function public.ari_circle_challenge_create_v3(text,text,text,integer,text,integer,text,text) from public, anon;
revoke all on function public.ari_circle_challenge_list_v3(text,text,integer,integer) from public, anon;
revoke all on function public.ari_circle_challenge_recent_v1(text,integer) from public, anon;
revoke all on function public.ari_circle_challenge_get_v1(uuid) from public, anon;
revoke all on function public.ari_circle_challenge_submit_entry_v3(uuid,text,text,text,numeric) from public, anon;

grant execute on function public.ari_circle_challenge_create_v3(text,text,text,integer,text,integer,text,text) to authenticated;
grant execute on function public.ari_circle_challenge_list_v3(text,text,integer,integer) to authenticated;
grant execute on function public.ari_circle_challenge_recent_v1(text,integer) to authenticated;
grant execute on function public.ari_circle_challenge_get_v1(uuid) to authenticated;
grant execute on function public.ari_circle_challenge_submit_entry_v3(uuid,text,text,text,numeric) to authenticated;
