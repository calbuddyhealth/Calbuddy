-- ARI XP — minor Goals/profile age lock
-- 2026-08-18
--
-- Teen safety contract:
--   * ages 13-17: profiles.age is derived from protected account DOB
--   * ages 18+: profiles.age remains editable exactly as before
--   * Circle authorization never reads profiles.age

begin;

create or replace function public.ari_enforce_minor_profile_age()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  account_dob date;
  account_age integer;
begin
  select s.date_of_birth
    into account_dob
  from public.ari_account_state s
  where s.user_id = new.id;

  if account_dob is null then return new; end if;

  account_age := public.ari_account_age_years(account_dob);
  if account_age between 13 and 17 then
    new.age := account_age;
  end if;

  return new;
end;
$$;

revoke all on function public.ari_enforce_minor_profile_age() from public, anon, authenticated;

drop trigger if exists ari_profiles_minor_age_lock on public.profiles;
create trigger ari_profiles_minor_age_lock
before insert or update of age on public.profiles
for each row execute function public.ari_enforce_minor_profile_age();

-- Normalize any existing teen profile rows at activation time so a previously
-- edited fitness age cannot remain inconsistent with Teen Ari safety context.
update public.profiles p
set age = public.ari_account_age_years(s.date_of_birth)
from public.ari_account_state s
where s.user_id = p.id
  and public.ari_account_age_years(s.date_of_birth) between 13 and 17
  and p.age is distinct from public.ari_account_age_years(s.date_of_birth);

commit;
