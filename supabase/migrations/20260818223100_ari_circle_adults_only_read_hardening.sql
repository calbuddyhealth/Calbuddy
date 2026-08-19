-- ARI XP — adults-only ARI Circle residual SECURITY DEFINER read hardening
-- Complements 20260818223000_ari_circle_adults_only.sql.

begin;

create or replace function public.ari_circle_can_read_media_path(requested_path text)
returns boolean
language sql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
  select public.ari_circle_current_user_is_adult()
    and exists (
      select 1
      from public.ari_circle_feed_posts p
      where p.media_path = requested_path
        and public.ari_circle_user_is_adult(p.author_user_id)
        and (p.author_user_id = auth.uid() or public.ari_circle_can_view_user(p.author_user_id))
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
    );
$$;

revoke all on function public.ari_circle_can_read_media_path(text) from public, anon;
grant execute on function public.ari_circle_can_read_media_path(text) to authenticated;

-- Preserve the existing public RPC row contract (including bio) so current
-- Circle clients do not experience a PostgREST schema/signature break while
-- the body is hardened to adults-only authorization.
create or replace function public.ari_circle_profile_friends(requested_user_id uuid, result_limit integer default 100)
returns table(user_id uuid, display_name text, handle text, avatar_url text, bio text)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  safe_limit integer := least(greatest(coalesce(result_limit,100),1),200);
begin
  perform public.ari_circle_assert_adult_access();
  if requested_user_id is null or not public.ari_circle_user_is_adult(requested_user_id) then
    raise exception 'Profile unavailable';
  end if;
  if requested_user_id <> caller_id and not public.ari_circle_can_view_user(requested_user_id) then
    raise exception 'Profile unavailable';
  end if;

  return query
  with friend_ids as (
    select case
      when c.requester_user_id = requested_user_id then c.addressee_user_id
      else c.requester_user_id
    end as friend_user_id
    from public.ari_circle_connections c
    where c.status = 'accepted'
      and c.blocked_by_user_id is null
      and (c.requester_user_id = requested_user_id or c.addressee_user_id = requested_user_id)
  )
  select p.user_id,p.display_name,p.handle::text,p.avatar_url,p.bio
  from friend_ids f
  join public.ari_circle_profiles p on p.user_id = f.friend_user_id
  where public.ari_circle_user_is_adult(p.user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,p.user_id)
  order by lower(coalesce(p.display_name,'')),p.user_id
  limit safe_limit;
end;
$$;

revoke all on function public.ari_circle_profile_friends(uuid,integer) from public, anon;
grant execute on function public.ari_circle_profile_friends(uuid,integer) to authenticated;

commit;
