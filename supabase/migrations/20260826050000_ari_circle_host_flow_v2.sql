-- ARI Circle — Host Flow V2
-- Make Host status reflect verified real-world hosting and expose bounded
-- self-only progress for the Meet Up surface.

begin;

create or replace function public.ari_circle_leadership_tier(target_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  hosted_count integer := 0;
begin
  select count(*)::integer
    into hosted_count
  from public.ari_circle_meetups m
  where m.host_user_id = target_user_id
    and m.status = 'completed'
    and exists (
      select 1
      from public.ari_circle_meetup_participants p
      where p.meetup_id = m.id
        and p.user_id <> m.host_user_id
        and p.status = 'joined'
        and p.completed_at is not null
    );

  return case
    when hosted_count >= 50 then 'community_builder'
    when hosted_count >= 25 then 'community_leader'
    when hosted_count >= 10 then 'active_host'
    when hosted_count >= 3 then 'organizer'
    else 'new_host'
  end;
end;
$$;

revoke all on function public.ari_circle_leadership_tier(uuid) from public, anon;
grant execute on function public.ari_circle_leadership_tier(uuid) to authenticated, service_role;

create or replace function public.ari_circle_my_host_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  hosted_count integer := 0;
  current_tier text := 'new_host';
  next_tier text := 'organizer';
  next_threshold integer := 3;
  remaining integer := 3;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then
    raise exception 'Sign in to view Host progress';
  end if;

  select count(*)::integer
    into hosted_count
  from public.ari_circle_meetups m
  where m.host_user_id = caller_id
    and m.status = 'completed'
    and exists (
      select 1
      from public.ari_circle_meetup_participants p
      where p.meetup_id = m.id
        and p.user_id <> m.host_user_id
        and p.status = 'joined'
        and p.completed_at is not null
    );

  current_tier := case
    when hosted_count >= 50 then 'community_builder'
    when hosted_count >= 25 then 'community_leader'
    when hosted_count >= 10 then 'active_host'
    when hosted_count >= 3 then 'organizer'
    else 'new_host'
  end;

  if hosted_count >= 50 then
    next_tier := null;
    next_threshold := null;
    remaining := 0;
  elsif hosted_count >= 25 then
    next_tier := 'community_builder';
    next_threshold := 50;
    remaining := 50 - hosted_count;
  elsif hosted_count >= 10 then
    next_tier := 'community_leader';
    next_threshold := 25;
    remaining := 25 - hosted_count;
  elsif hosted_count >= 3 then
    next_tier := 'active_host';
    next_threshold := 10;
    remaining := 10 - hosted_count;
  else
    next_tier := 'organizer';
    next_threshold := 3;
    remaining := 3 - hosted_count;
  end if;

  return jsonb_build_object(
    'verified_hosted_meetups', hosted_count,
    'tier', current_tier,
    'next_tier', next_tier,
    'next_threshold', next_threshold,
    'remaining_to_next', greatest(remaining, 0),
    'participant_xp', 4,
    'host_bonus_xp', 2,
    'verified_host_xp', 6
  );
end;
$$;

revoke all on function public.ari_circle_my_host_summary() from public, anon;
grant execute on function public.ari_circle_my_host_summary() to authenticated, service_role;

commit;
