-- ARI Circle Local Discovery V2 — active meetup backfill
-- Bring already-scheduled meetups onto the host's current Circle market so the
-- new discovery behavior applies immediately instead of only to newly published events.

begin;

update public.ari_circle_meetups m
set discovery_area = coalesce(nullif(btrim(s.area_label), ''), m.area),
    approximate_latitude = coalesce(m.approximate_latitude, s.approximate_latitude),
    approximate_longitude = coalesce(m.approximate_longitude, s.approximate_longitude),
    updated_at = now()
from private.ari_circle_search_locations s
where s.user_id = m.host_user_id
  and m.status = 'scheduled'
  and m.ends_at > now();

commit;
