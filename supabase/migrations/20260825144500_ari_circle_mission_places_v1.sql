-- ARI Circle Action Network — Mission ↔ Place V1
-- A Mission may be associated with one or more curated public destinations.
-- This creates real-world social gravity without storing or exposing live-user location.

begin;

create table if not exists public.ari_circle_mission_places (
  mission_id uuid not null references public.ari_circle_quests(id) on delete cascade,
  place_id uuid not null references public.ari_circle_places(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mission_id, place_id)
);

create index if not exists ari_circle_mission_places_place_idx
  on public.ari_circle_mission_places(place_id, created_at desc);

alter table public.ari_circle_mission_places enable row level security;
revoke all on table public.ari_circle_mission_places from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_mission_places to service_role;

create or replace function public.ari_circle_attach_mission_place(
  requested_mission_id uuid,
  requested_place_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  p public.ari_circle_places%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to update a Mission'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id
  for update;

  if not found
     or q.creator_user_id <> caller_id
     or q.status <> 'active'
     or q.ends_at <= now()
     or q.objective_type = 'completion' then
    raise exception 'Mission unavailable';
  end if;

  select * into p
  from public.ari_circle_places
  where id = requested_place_id;

  if not found
     or p.status <> 'active'
     or p.safe_public_place is not true
     or p.verification_state not in ('curated','partner_verified') then
    raise exception 'Public Place unavailable';
  end if;

  insert into public.ari_circle_mission_places(mission_id, place_id, created_by)
  values (q.id, p.id, caller_id)
  on conflict (mission_id, place_id) do nothing;

  return true;
end;
$$;

revoke all on function public.ari_circle_attach_mission_place(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_attach_mission_place(uuid,uuid)
  to authenticated, service_role;

create or replace function public.ari_circle_detach_mission_place(
  requested_mission_id uuid,
  requested_place_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to update a Mission'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id;

  if not found or q.creator_user_id <> caller_id then
    raise exception 'Mission unavailable';
  end if;

  delete from public.ari_circle_mission_places mp
  where mp.mission_id = q.id
    and mp.place_id = requested_place_id;

  return found;
end;
$$;

revoke all on function public.ari_circle_detach_mission_place(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.ari_circle_detach_mission_place(uuid,uuid)
  to authenticated, service_role;

create or replace function public.ari_circle_list_mission_places(
  requested_mission_id uuid,
  result_limit integer default 20
)
returns table (
  place_id uuid,
  place_name text,
  place_type text,
  description text,
  area text,
  city text,
  region text,
  country_code text,
  latitude numeric,
  longitude numeric,
  activity_tags text[],
  verification_state text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  q public.ari_circle_quests%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to view Mission Places'; end if;

  select * into q
  from public.ari_circle_quests
  where id = requested_mission_id;

  if not found
     or q.status <> 'active'
     or q.ends_at <= now()
     or q.objective_type = 'completion'
     or not public.ari_circle_user_is_adult(q.creator_user_id)
     or public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id) then
    raise exception 'Mission unavailable';
  end if;

  return query
  select
    p.id,
    p.name,
    p.place_type,
    p.description,
    p.area,
    p.city,
    p.region,
    p.country_code,
    p.latitude,
    p.longitude,
    p.activity_tags,
    p.verification_state
  from public.ari_circle_mission_places mp
  join public.ari_circle_places p on p.id = mp.place_id
  where mp.mission_id = q.id
    and p.status = 'active'
    and p.safe_public_place = true
    and p.verification_state in ('curated','partner_verified')
  order by lower(p.name), p.id
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_mission_places(uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_mission_places(uuid,integer)
  to authenticated, service_role;

create or replace function public.ari_circle_list_place_missions(
  requested_place_id uuid,
  result_limit integer default 20
)
returns table (
  mission_id uuid,
  title text,
  category text,
  objective_type text,
  progress_mode text,
  target_value numeric,
  unit text,
  verified_progress numeric,
  viewer_verified_progress numeric,
  progress_percent numeric,
  member_count bigint,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  p public.ari_circle_places%rowtype;
  cap integer := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to view Place Missions'; end if;

  select * into p
  from public.ari_circle_places
  where id = requested_place_id;

  if not found
     or p.status <> 'active'
     or p.safe_public_place is not true
     or p.verification_state not in ('curated','partner_verified') then
    raise exception 'Public Place unavailable';
  end if;

  return query
  with totals as (
    select
      c.quest_id,
      coalesce(sum(c.amount) filter (where c.status = 'verified'), 0)::numeric as global_verified,
      coalesce(sum(c.amount) filter (where c.status = 'verified' and c.user_id = caller_id), 0)::numeric as viewer_verified
    from public.ari_circle_mission_contributions c
    group by c.quest_id
  )
  select
    q.id,
    q.title,
    q.category,
    q.objective_type,
    q.progress_mode,
    q.target_value,
    q.unit,
    case when q.progress_mode = 'collective' then coalesce(t.global_verified, 0) else coalesce(t.viewer_verified, 0) end,
    coalesce(t.viewer_verified, 0),
    least(
      100::numeric,
      round(
        100 * (case when q.progress_mode = 'collective' then coalesce(t.global_verified, 0) else coalesce(t.viewer_verified, 0) end) / q.target_value,
        1
      )
    ),
    (select count(*) from public.ari_circle_quest_members qm where qm.quest_id = q.id and qm.status <> 'left'),
    q.starts_at,
    q.ends_at
  from public.ari_circle_mission_places mp
  join public.ari_circle_quests q on q.id = mp.mission_id
  left join totals t on t.quest_id = q.id
  where mp.place_id = p.id
    and q.status = 'active'
    and q.ends_at > now()
    and q.objective_type <> 'completion'
    and public.ari_circle_user_is_adult(q.creator_user_id)
    and not public.ari_circle_social_pair_is_blocked(caller_id, q.creator_user_id)
  order by q.ends_at asc, q.created_at desc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_place_missions(uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_place_missions(uuid,integer)
  to authenticated, service_role;

commit;