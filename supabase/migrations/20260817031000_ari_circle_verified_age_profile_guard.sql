-- ARI Circle Build 5 — verified-age profile guard
-- 2026-08-17

begin;

create or replace function public.ari_circle_enforce_teen_profile_privacy()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  band text;
begin
  select public.ari_circle_age_band_for_date(s.date_of_birth)
    into band
  from public.ari_account_state s
  where s.user_id = new.user_id;

  if band not in ('teen','adult') then
    raise exception 'Verify an age of 13 or older before creating an ARI Circle profile';
  end if;

  if band = 'teen' then
    -- Exact birthday/location are not part of the visible Teen Circle profile.
    new.birthday := null;
    new.location := null;

    if new.avatar_url is not null
       and new.avatar_url not like 'ari-private://ari-circle-teen-media/%' then
      raise exception 'Teen Circle profile photos must use private Teen Circle media';
    end if;

    if new.cover_url is not null
       and new.cover_url not like 'ari-private://ari-circle-teen-media/%' then
      raise exception 'Teen Circle background photos must use private Teen Circle media';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_circle_enforce_teen_profile_privacy() from public, anon, authenticated;

-- Recreate the trigger without an UPDATE OF column list so the verified-age
-- requirement applies to every profile insert/update, not only media changes.
drop trigger if exists ari_circle_profiles_teen_private_media_guard on public.ari_circle_profiles;
create trigger ari_circle_profiles_teen_private_media_guard
before insert or update
on public.ari_circle_profiles
for each row execute function public.ari_circle_enforce_teen_profile_privacy();

commit;
