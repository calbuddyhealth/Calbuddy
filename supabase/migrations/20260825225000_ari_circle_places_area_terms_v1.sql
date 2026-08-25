-- ARI Circle V6 — Place Area Terms V1
-- Make the no-GPS Explore path honor comma-separated general areas such as
-- "Mission Valley, San Diego" without persisting or inferring user location.

begin;

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
  area_terms text[] := '{}'::text[];
  safe_radius integer := coalesce(requested_radius_miles, 25);
  cap integer := greatest(1, least(coalesce(result_limit, 30), 50));
  use_location boolean := false;
begin
  perform public.ari_circle_assert_adult_access();

  if safe_radius not in (5,10,25,50,100) then
    raise exception 'Unsupported Explore radius';
  end if;

  if clean_area is not null then
    select coalesce(array_agg(term order by ordinality), '{}'::text[])
    into area_terms
    from (
      select lower(btrim(piece)) as term, ordinality
      from unnest(regexp_split_to_array(clean_area, '\s*,\s*')) with ordinality as split(piece, ordinality)
      where char_length(btrim(piece)) >= 2
    ) normalized;
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
      end as distance_value,
      case
        when clean_area is null then 0
        else coalesce((
          select max(
            case
              when lower(p.area) like ('%' || term || '%') then 3
              when lower(coalesce(p.city, '')) like ('%' || term || '%') then 2
              when lower(coalesce(p.region, '')) like ('%' || term || '%') then 1
              else 0
            end
          )
          from unnest(area_terms) as requested(term)
        ), 0)
      end as area_match_score
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
        or exists (
          select 1
          from unnest(area_terms) as requested(term)
          where lower(p.area) like ('%' || term || '%')
             or lower(coalesce(p.city, '')) like ('%' || term || '%')
             or lower(coalesce(p.region, '')) like ('%' || term || '%')
        )
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
    c.area_match_score desc,
    lower(c.name) asc,
    c.id asc
  limit cap;
end;
$$;

revoke all on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer)
  from public, anon, authenticated;
grant execute on function public.ari_circle_list_places(text,text,numeric,numeric,integer,integer)
  to authenticated, service_role;

commit;
