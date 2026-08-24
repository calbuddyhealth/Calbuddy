-- ARI Circle V5 — keep a user's joined meetup visible after it ends so
-- every participant can press Complete and release verified XP.

begin;

create or replace function public.ari_circle_list_meetups(
  requested_activity text default null,
  requested_window text default 'upcoming',
  result_limit integer default 30
)
returns table (
  meetup_id uuid,
  title text,
  activity text,
  description text,
  area text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_participants smallint,
  host_user_id uuid,
  host_display_name text,
  host_handle text,
  host_avatar_url text,
  participant_count bigint,
  viewer_joined boolean,
  viewer_completed boolean,
  viewer_is_host boolean,
  participant_xp smallint,
  host_total_xp integer,
  host_leadership_tier text
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity,''))), '');
  cap integer := greatest(1, least(coalesce(result_limit,30),50));
begin
  perform public.ari_circle_assert_adult_access();

  return query
  select
    m.id,
    m.title,
    m.activity,
    m.description,
    m.area,
    m.starts_at,
    m.ends_at,
    m.max_participants,
    m.host_user_id,
    cp.display_name,
    cp.handle::text,
    cp.avatar_url,
    (select count(*) from public.ari_circle_meetup_participants pc where pc.meetup_id=m.id and pc.status='joined'),
    exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.status='joined'),
    exists(select 1 from public.ari_circle_meetup_participants vp where vp.meetup_id=m.id and vp.user_id=caller_id and vp.completed_at is not null),
    m.host_user_id = caller_id,
    m.participant_xp,
    coalesce((select sum(x.xp_amount)::integer from public.ari_circle_xp_events x where x.user_id=m.host_user_id),0),
    public.ari_circle_leadership_tier(m.host_user_id)
  from public.ari_circle_meetups m
  join public.ari_circle_profiles cp on cp.user_id = m.host_user_id
  where m.status='scheduled'
    and (
      m.ends_at > now()
      or (
        m.ends_at > now() - interval '48 hours'
        and exists (
          select 1 from public.ari_circle_meetup_participants mine
          where mine.meetup_id=m.id and mine.user_id=caller_id and mine.status='joined'
        )
      )
    )
    and (clean_activity is null or m.activity=clean_activity)
    and public.ari_circle_user_is_adult(m.host_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id,m.host_user_id)
    and (
      m.ends_at <= now()
      or requested_window not in ('today','weekend')
      or (requested_window='today' and m.starts_at < date_trunc('day',now()) + interval '1 day')
      or (requested_window='weekend' and extract(isodow from m.starts_at) in (6,7))
    )
  order by
    case when m.ends_at <= now() and exists(
      select 1 from public.ari_circle_meetup_participants mine
      where mine.meetup_id=m.id and mine.user_id=caller_id and mine.status='joined' and mine.completed_at is null
    ) then 0 else 1 end,
    m.starts_at asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_meetups(text,text,integer) from public, anon;
grant execute on function public.ari_circle_list_meetups(text,text,integer) to authenticated;

commit;
