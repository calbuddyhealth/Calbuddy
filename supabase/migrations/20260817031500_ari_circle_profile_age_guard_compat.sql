-- ARI Circle Build 5 — profile age-guard compatibility
-- Existing profiles that predate the age gate may still load/edit their own
-- profile, but they cannot enter verified social cohorts until age verification.
-- A verified under-13 state remains blocked.

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

  if band = 'under_13' then
    raise exception 'ARI Circle is available only to people age 13 or older';
  end if;

  if band = 'teen' then
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

commit;
