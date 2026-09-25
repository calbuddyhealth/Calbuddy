-- ARI Circle profile showcase upload capacity
-- Keep the four-slot model bounded, but allow ordinary short camera videos
-- without rejecting them for a tiny upload cap. The app still enforces a
-- 30-second duration limit.

begin;

update storage.buckets
set file_size_limit = 52428800
where id = 'ari-circle-post-media'
  and (file_size_limit is null or file_size_limit < 52428800);

commit;
