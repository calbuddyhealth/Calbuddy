-- ARI Circle Build 5 — Challenge video preview playback
-- 2026-08-17
--
-- A challenge card should stay visual even when the creator did not upload a
-- separate cover. Prefer the challenge cover, then fall back to the creator's
-- first entry (or the first available entry). This lets submitted challenge
-- videos appear and autoplay in the existing card renderer without loading
-- every entry in the feed.

begin;

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
set search_path to 'public', 'auth'
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
      coalesce(ch.cover_media_path, preview.media_path) as cover_media_path,
      coalesce(ch.cover_media_type, preview.media_type) as cover_media_type,
      (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id) as member_count,
      (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id) as entry_count,
      (select count(*)::int from public.ari_circle_challenge_entry_reactions r join public.ari_circle_challenge_entries e on e.id = r.entry_id where e.challenge_id = ch.id and r.reaction_key = 'hype') as hype_count,
      (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id) as vote_count,
      exists(select 1 from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id) as viewer_joined,
      (select m.completed_at from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id) as viewer_completed_at,
      exists(select 1 from public.ari_circle_connections c where c.status = 'accepted' and ((c.requester_user_id = caller_id and c.addressee_user_id = ch.creator_user_id) or (c.addressee_user_id = caller_id and c.requester_user_id = ch.creator_user_id))) as creator_is_friend,
      (select count(distinct m.user_id)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id and exists(select 1 from public.ari_circle_connections c where c.status = 'accepted' and ((c.requester_user_id = caller_id and c.addressee_user_id = m.user_id) or (c.addressee_user_id = caller_id and c.requester_user_id = m.user_id)))) as friend_member_count,
      exists(select 1 from public.ari_circle_challenge_entries e where e.challenge_id = ch.id and e.user_id = caller_id) as viewer_has_entry
    from public.ari_circle_challenges ch
    join public.ari_circle_profiles p on p.user_id = ch.creator_user_id
    left join lateral (
      select e.media_path, e.media_type
      from public.ari_circle_challenge_entries e
      where e.challenge_id = ch.id
        and e.media_path is not null
      order by (e.user_id = ch.creator_user_id) desc, e.created_at asc
      limit 1
    ) preview on true
    where ch.age_band = band
      and ch.status = 'active'
      and ch.ends_at > now()
      and ch.challenge_mode <> 'goal'
      and ch.entry_media_type = clean_media
      and not public.ari_circle_feed_is_blocked(ch.creator_user_id)
  ), scored as (
    select ranked.*, (ranked.entry_count * 5 + ranked.hype_count * 2 + ranked.vote_count * 3 + ranked.member_count + ranked.friend_member_count * 4)::bigint as engagement_score
    from ranked
    where clean_filter <> 'friends' or ranked.creator_is_friend or ranked.friend_member_count > 0
  )
  select s.challenge_id,s.creator_user_id,s.creator_display_name,s.creator_handle,s.creator_avatar_url,s.title,s.description,s.challenge_mode,s.entry_media_type,s.video_max_seconds,s.starts_at,s.ends_at,s.cover_media_path,s.cover_media_type,s.member_count,s.entry_count,s.hype_count,s.vote_count,s.viewer_joined,s.viewer_completed_at,s.creator_is_friend,s.friend_member_count,s.viewer_has_entry
  from scored s
  order by
    case when clean_filter = 'trending' then s.engagement_score else 0 end desc,
    case when clean_filter = 'friends' then s.friend_member_count else 0 end desc,
    case when clean_filter = 'for-you' then (case when s.creator_is_friend then 12 else 0 end) + s.friend_member_count * 4 + s.engagement_score else 0 end desc,
    s.starts_at desc
  limit safe_limit offset safe_offset;
end;
$$;

create or replace function public.ari_circle_challenge_get_v1(requested_challenge_id uuid)
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
set search_path to 'public', 'auth'
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
    coalesce(ch.cover_media_path, preview.media_path),
    coalesce(ch.cover_media_type, preview.media_type),
    (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entry_reactions r join public.ari_circle_challenge_entries e on e.id = r.entry_id where e.challenge_id = ch.id and r.reaction_key = 'hype'),
    (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id),
    exists(select 1 from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id),
    (select m.completed_at from public.ari_circle_challenge_members m where m.challenge_id = ch.id and m.user_id = caller_id),
    exists(select 1 from public.ari_circle_connections c where c.status='accepted' and ((c.requester_user_id=caller_id and c.addressee_user_id=ch.creator_user_id) or (c.addressee_user_id=caller_id and c.requester_user_id=ch.creator_user_id))),
    (select count(distinct m.user_id)::int from public.ari_circle_challenge_members m where m.challenge_id=ch.id and exists(select 1 from public.ari_circle_connections c where c.status='accepted' and ((c.requester_user_id=caller_id and c.addressee_user_id=m.user_id) or (c.addressee_user_id=caller_id and c.requester_user_id=m.user_id)))),
    exists(select 1 from public.ari_circle_challenge_entries e where e.challenge_id=ch.id and e.user_id=caller_id)
  from public.ari_circle_challenges ch
  join public.ari_circle_profiles p on p.user_id=ch.creator_user_id
  left join lateral (
    select e.media_path, e.media_type
    from public.ari_circle_challenge_entries e
    where e.challenge_id = ch.id
      and e.media_path is not null
    order by (e.user_id = ch.creator_user_id) desc, e.created_at asc
    limit 1
  ) preview on true
  where ch.id=requested_challenge_id
    and ch.age_band=band
    and ch.status<>'canceled'
    and ch.challenge_mode<>'goal'
    and ch.ends_at>now()-interval '48 hours'
    and not public.ari_circle_feed_is_blocked(ch.creator_user_id)
  limit 1;
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
set search_path to 'public', 'auth'
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
    coalesce(ch.cover_media_path, preview.media_path),
    coalesce(ch.cover_media_type, preview.media_type),
    (select count(*)::int from public.ari_circle_challenge_members m where m.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entries e where e.challenge_id = ch.id),
    (select count(*)::int from public.ari_circle_challenge_entry_reactions r join public.ari_circle_challenge_entries e on e.id = r.entry_id where e.challenge_id = ch.id and r.reaction_key = 'hype'),
    (select count(*)::int from public.ari_circle_challenge_votes v where v.challenge_id = ch.id)
  from public.ari_circle_challenges ch
  join public.ari_circle_profiles p on p.user_id = ch.creator_user_id
  left join lateral (
    select e.media_path, e.media_type
    from public.ari_circle_challenge_entries e
    where e.challenge_id = ch.id
      and e.media_path is not null
    order by (e.user_id = ch.creator_user_id) desc, e.created_at asc
    limit 1
  ) preview on true
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

commit;
