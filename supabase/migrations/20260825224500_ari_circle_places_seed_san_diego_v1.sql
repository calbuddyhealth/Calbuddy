-- ARI Circle V6 — San Diego Place Seed V1
-- Small first-party-curated launch inventory for Explore.
-- These rows describe public City of San Diego park destinations only.
-- They do not represent live user location, presence, popularity, or paid rank.

begin;

with seeds(
  name,
  place_type,
  description,
  area,
  city,
  region,
  country_code,
  latitude,
  longitude,
  activity_tags,
  source_url
) as (
  values
    (
      'Balboa Park',
      'park',
      'Large central urban park with walking paths, gardens, open lawns, trails, and recreation areas.',
      'Balboa Park / Central',
      'San Diego',
      'CA',
      'US',
      32.73172::numeric,
      -117.14698::numeric,
      array['walking','running','outdoor','wellness','community']::text[],
      'https://www.sandiego.gov/park-and-recreation/parks/regional/balboa'
    ),
    (
      'Mission Bay Park',
      'park',
      'Large waterfront park with walking and cycling paths, beaches, open lawns, and recreation areas.',
      'Mission Bay',
      'San Diego',
      'CA',
      'US',
      32.76986::numeric,
      -117.24725::numeric,
      array['walking','running','cycling','outdoor','sports','wellness']::text[],
      'https://www.sandiego.gov/park-and-recreation/parks/regional/missionbay'
    ),
    (
      'Mission Trails Regional Park',
      'park',
      'Large urban open-space park with extensive routes for hiking, walking, trail running, and cycling.',
      'Mission Trails / Navajo',
      'San Diego',
      'CA',
      'US',
      32.81988::numeric,
      -117.05658::numeric,
      array['hiking','walking','running','cycling','outdoor']::text[],
      'https://www.sandiego.gov/park-and-recreation/parks/osp/mtrails'
    ),
    (
      'Tecolote Canyon Natural Park',
      'park',
      'Urban canyon natural park with trails used for walking, jogging, hiking, and mountain biking.',
      'Tecolote Canyon / Clairemont',
      'San Diego',
      'CA',
      'US',
      32.80140::numeric,
      -117.18844::numeric,
      array['walking','running','hiking','cycling','outdoor']::text[],
      'https://www.sandiego.gov/park-and-recreation/parks/osp/tecolote'
    )
)
insert into public.ari_circle_places(
  name,
  place_type,
  description,
  area,
  city,
  region,
  country_code,
  latitude,
  longitude,
  activity_tags,
  safe_public_place,
  verification_state,
  status,
  metadata
)
select
  s.name,
  s.place_type,
  s.description,
  s.area,
  s.city,
  s.region,
  s.country_code,
  s.latitude,
  s.longitude,
  s.activity_tags,
  true,
  'curated',
  'active',
  jsonb_build_object(
    'source_kind', 'city_of_san_diego',
    'source_url', s.source_url,
    'curation_version', 'san-diego-v1'
  )
from seeds s
where not exists (
  select 1
  from public.ari_circle_places existing
  where lower(existing.name) = lower(s.name)
    and lower(coalesce(existing.city, '')) = lower(s.city)
);

commit;
