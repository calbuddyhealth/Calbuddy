-- ARI XP — ARI Circle basic database safety fallback
-- 2026-08-13
--
-- This is deliberately narrow. The primary pre-publication moderation layer
-- uses OpenAI moderation for contextual text/image screening. These triggers
-- only block a few unmistakable high-risk patterns if a client bypasses the
-- normal ARI XP publishing flow.

create or replace function public.ari_circle_basic_content_safety_reason(input_text text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  normalized text := lower(regexp_replace(coalesce(input_text, ''), '[[:space:]]+', ' ', 'g'));
begin
  if normalized = '' then
    return null;
  end if;

  -- Direct harassment encouraging suicide/self-harm.
  if normalized ~ E'\\m(kill yourself|go kill yourself|kys|go die)\\M' then
    return 'self_harm_harassment';
  end if;

  -- Direct first-person violent threats toward another person. This avoids
  -- harmless phrases such as "I am going to kill this workout."
  if normalized ~ E'\\m(i will|i''ll|i am going to|i''m going to|im going to|gonna)[ ]+(kill|murder|shoot|stab)[ ]+(you|him|her|them)\\M' then
    return 'direct_violent_threat';
  end if;

  -- Narrow child-sexual-exploitation language. General health/education
  -- discussion about minors is intentionally not blocked by this fallback.
  if (
    normalized ~ E'\\m(child|kid|minor|underage)\\M.{0,40}\\m(porn|nudes?|naked[ ]+(pics?|photos?|videos?)|sexual[ ]+(pics?|photos?|videos?))\\M'
    or normalized ~ E'\\m(porn|nudes?|naked[ ]+(pics?|photos?|videos?)|sexual[ ]+(pics?|photos?|videos?))\\M.{0,40}\\m(child|kid|minor|underage)\\M'
  ) then
    return 'sexual_exploitation_of_minors';
  end if;

  return null;
end;
$$;

create or replace function public.ari_circle_enforce_basic_content_safety()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  content_to_check text;
  rejection_reason text;
begin
  case tg_table_name
    when 'ari_circle_feed_posts' then
      content_to_check := new.body;
    when 'ari_circle_feed_comments' then
      content_to_check := new.body;
    when 'ari_circle_moments' then
      content_to_check := new.caption;
    when 'ari_messages' then
      content_to_check := new.body;
    when 'ari_circle_profiles' then
      content_to_check := concat_ws(
        ' ',
        new.display_name,
        new.handle::text,
        new.bio,
        new.location,
        new.goal,
        new.bucket_list,
        new.favorite_song,
        new.favorite_food,
        new.favorite_movie,
        new.favorite_hobby,
        new.icebreakers::text
      );
    else
      return new;
  end case;

  rejection_reason := public.ari_circle_basic_content_safety_reason(content_to_check);

  if rejection_reason is not null then
    raise exception 'That content cannot be shared in ARI Circle. Please edit it and try again.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists ari_circle_basic_safety_feed_posts on public.ari_circle_feed_posts;
create trigger ari_circle_basic_safety_feed_posts
before insert or update of body
on public.ari_circle_feed_posts
for each row
execute function public.ari_circle_enforce_basic_content_safety();

drop trigger if exists ari_circle_basic_safety_feed_comments on public.ari_circle_feed_comments;
create trigger ari_circle_basic_safety_feed_comments
before insert or update of body
on public.ari_circle_feed_comments
for each row
execute function public.ari_circle_enforce_basic_content_safety();

drop trigger if exists ari_circle_basic_safety_moments on public.ari_circle_moments;
create trigger ari_circle_basic_safety_moments
before insert or update of caption
on public.ari_circle_moments
for each row
execute function public.ari_circle_enforce_basic_content_safety();

drop trigger if exists ari_circle_basic_safety_messages on public.ari_messages;
create trigger ari_circle_basic_safety_messages
before insert or update of body
on public.ari_messages
for each row
execute function public.ari_circle_enforce_basic_content_safety();

drop trigger if exists ari_circle_basic_safety_profiles on public.ari_circle_profiles;
create trigger ari_circle_basic_safety_profiles
before insert or update of display_name, handle, bio, location, goal, bucket_list,
  favorite_song, favorite_food, favorite_movie, favorite_hobby, icebreakers
on public.ari_circle_profiles
for each row
execute function public.ari_circle_enforce_basic_content_safety();

comment on function public.ari_circle_basic_content_safety_reason(text) is
  'Narrow ARI Circle database fallback for unmistakable high-risk UGC. Primary contextual moderation occurs before publication in the application layer.';
