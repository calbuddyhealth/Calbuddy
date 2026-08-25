-- ARI Circle Action Network — Places V1
-- Public activity destinations create real-world discovery gravity without
-- exposing live individual locations. Place coordinates describe public places;
-- user location remains private/coarse and is never written by these read RPCs.

begin;

create table if not exists public.ari_circle_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  place_type text not null check (place_type in (
    'park','trail','beach','court','recreation_center','gym','campus',
    'community_space','route','other'
  )),
  description text,
  area text not null check (char_length(btrim(area)) between 2 and 120),
  city text,
  region text,
  country_code text not null default 'US' check (char_length(country_code) between 2 and 3),
  latitude numeric(8,5) not null check (latitude between -90 and 90),
  longitude numeric(9,5) not null check (longitude between -180 and 180),
  activity_tags text[] not null default '{}'::text[],
  safe_public_place boolean not null default true,
  verification_state text not null default 'curated' check (verification_state in (
    'candidate','curated','partner_verified'
  )),
  status text not null default 'active' check (status in ('active','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_circle_places_description_check
    check (description is null or char_length(description) <= 1000),
  constraint ari_circle_places_city_check
    check (city is null or char_length(btrim(city)) between 1 and 100),
  constraint ari_circle_places_region_check
    check (region is null or char_length(btrim(region)) between 1 and 100),
  constraint ari_circle_places_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists ari_circle_places_active_area_idx
  on public.ari_circle_places(status, lower(area), lower(name));
create index if not exists ari_circle_places_active_lat_idx
  on public.ari_circle_places(latitude)
  where status = 'active' and safe_public_place;
create index if not exists ari_circle_places_active_lon_idx
  on public.ari_circle_places(longitude)
  where status = 'active' and safe_public_place;
create index if not exists ari_circle_places_activity_tags_gin
  on public.ari_circle_places using gin(activity_tags);

alter table public.ari_circle_places enable row level security;
revoke all on table public.ari_circle_places from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_circle_places to service_role;

-- Only curated/public locations are discoverable. This is a read projection,
-- not a place-editing surface and not a live-presence API.
create or replace function public.ari_circle_list_places(
  requested_activity text default null,
  requested_area text default null,
  requested_latitude numeric default null,
  requested_longitude numeric default null,
  requested_radius_miles integer default 25,
  result_limit integer default 30
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
  verification_state text,
  distance_miles numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  clean_activity text := nullif(lower(btrim(coalesce(requested_activity, ''))), '');
  clean_area text := nullif(lower(btrim(coalesce(requested_area, ''))), '');
  safe_radius integer := coalesce(requested_radius_miles, 25);
  cap integer := greatest(1, least(coalesce(result_limit, 30), 50));
  use_location boolean := false;
begin
  perform public.ari_circle_assert_adult_access();

  if safe_radius not in (5,10,25,50,100) then
    raise exception 'Unsupported Explore radius';
  end if;

  if requested_latitude is null and requested_longitude is null then
    use_location := false;
  elsif requested_latitude is null or requested_longitude is null
     or requested_latitude < -90 or requested_latitude > 90
     or requested_longitude < -180 or requested_longitude > 180 then
    raise exception 'A valid approximate Explore location is required';
  else
    use_location := true;
  end if;

  return query
  with candidates as (
    select
      p.*,
      case
        when use_location then (
          3958.7613 * 2 * asin(
            least(1::double precision, sqrt(
              power(sin(radians((p.latitude::double precision - requested_latitude::double precision) / 2)), 2)
              + cos(radians(requested_latitude::double precision))
                * cos(radians(p.latitude::double precision))
                * power(sin(radians((p.longitude::double precision - requested_longitude::double precision) / 2)), 2)
            ))
          )
        )
        else null::double precision
      end as distance_value
    from public.ari_circle_places p
    where p.status = 'active'
      and p.safe_public_place = true
      and p.verification_state in ('curated','partner_verified')
      and (
        clean_activity is null
        or clean_activity = 'any'
        or clean_activity = any(p.activity_tags)
      )
      and (
        clean_area is null
        or lower(p.area) like ('%' || clean_area || '%')
        or lower(coalesce(p.city, '')) like ('%' || clean_area || '%')
        or lower(coalesce(p.region, '')) like ('%' || clean_area || '%')
      )
  )
  select
    c.id,
    c.name,
    c.place_type,
    c.description,
    c.area,
    c.city,
    c.region,
    c.country_code,
    c.latitude,
    c.longitude,
    c.activity_tags,
    c.verification_state,
    case when c.distance_value is null then null else round(c.distance_value::numeric, 1) end
  from candidates c
  where not use_location or c.distance_value <= safe_radius
  order by
    case when c.distance_value is null then 1 else 0 end,
    c.distance_value asc nulls last,
    lower(c.name) asc,
    c.id asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer)
  to authenticated, service_role;

-- Resolve Places from the caller's own private Action Intent. The intent's
-- coarse coordinates never leave this RPC and are not copied into Places.
create or replace function public.ari_circle_list_places_for_intent(
  requested_intent_id uuid,
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
  verification_state text,
  distance_miles numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  intent public.ari_circle_action_intents%rowtype;
begin
  perform public.ari_circle_assert_adult_access();
  if caller_id is null then raise exception 'Sign in to explore places'; end if;

  select * into intent
  from public.ari_circle_action_intents ai
  where ai.id = requested_intent_id
    and ai.user_id = caller_id
    and ai.status = 'active'
    and ai.expires_at > now();

  if not found then raise exception 'Action intent unavailable'; end if;

  return query
  select *
  from public.ari_circle_list_places(
    requested_activity => intent.activity,
    requested_area => intent.area,
    requested_latitude => intent.approximate_latitude,
    requested_longitude => intent.approximate_longitude,
    requested_radius_miles => intent.radius_miles,
    result_limit => result_limit
  );
end;
$$;

revoke all on function public.ari_circle_list_places_for_intent(uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_places_for_intent(uuid,integer)
  to authenticated, service_role;

commit;
