create or replace function public.ari_circle_challenge_submit_entry(
  requested_challenge_id uuid,
  requested_caption text default null::text,
  requested_media_path text default null::text,
  requested_media_type text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  target_type text;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if requested_challenge_id is null then
    raise exception 'Challenge required';
  end if;

  select entry_media_type
    into target_type
  from public.ari_circle_challenges
  where id = requested_challenge_id;

  if target_type is null then
    raise exception 'Challenge not found';
  end if;

  if target_type = 'video' then
    raise exception 'Refresh ARI XP before submitting this video challenge';
  end if;

  return public.ari_circle_challenge_submit_entry_v3(
    requested_challenge_id,
    requested_caption,
    requested_media_path,
    requested_media_type,
    null
  );
end;
$function$;

revoke execute on function public.ari_circle_challenge_submit_entry(uuid, text, text, text) from anon, public;
grant execute on function public.ari_circle_challenge_submit_entry(uuid, text, text, text) to authenticated;
