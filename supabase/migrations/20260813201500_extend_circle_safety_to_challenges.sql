-- ARI XP — extend ARI Circle database safety fallback to Challenges
-- 2026-08-13

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
    when 'ari_circle_challenges' then
      content_to_check := concat_ws(
        ' ',
        new.title,
        new.description,
        new.unit_label
      );
    when 'ari_circle_challenge_entries' then
      content_to_check := new.caption;
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

drop trigger if exists ari_circle_basic_safety_challenges on public.ari_circle_challenges;
create trigger ari_circle_basic_safety_challenges
before insert or update of title, description, unit_label
on public.ari_circle_challenges
for each row
execute function public.ari_circle_enforce_basic_content_safety();

drop trigger if exists ari_circle_basic_safety_challenge_entries on public.ari_circle_challenge_entries;
create trigger ari_circle_basic_safety_challenge_entries
before insert or update of caption
on public.ari_circle_challenge_entries
for each row
execute function public.ari_circle_enforce_basic_content_safety();
