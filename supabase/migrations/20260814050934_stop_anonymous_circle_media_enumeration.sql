-- ARI XP App Store readiness
-- The legacy profile-media bucket remains public for existing avatar/cover URL
-- compatibility, but anonymous callers should not be able to enumerate its
-- storage.objects rows through the Data API.

drop policy if exists "ARI Circle media is publicly readable"
  on storage.objects;
