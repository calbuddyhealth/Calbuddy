-- ARI Rebirth: keep profiles.owner_access exclusive to the configured owner.
-- Run once in the Supabase SQL Editor after deploying the server owner lock.

begin;

alter table public.profiles
  add column if not exists owner_access boolean not null default false;

alter table public.profiles enable row level security;

update public.profiles
set owner_access = (id = '0b3b0f56-676f-4859-a9f4-b377dd73544f'::uuid)
where owner_access is distinct from
  (id = '0b3b0f56-676f-4859-a9f4-b377dd73544f'::uuid);

create or replace function public.enforce_ari_owner_access()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  request_role text := coalesce(auth.jwt() ->> 'role', '');
  request_user_id uuid := auth.uid();
  ari_owner_id constant uuid :=
    '0b3b0f56-676f-4859-a9f4-b377dd73544f'::uuid;
begin
  -- Trusted server operations remain available for deliberate administration.
  if request_role = 'service_role'
     or session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if request_user_id = ari_owner_id then
    new.owner_access := true;
    return new;
  end if;

  if coalesce(new.owner_access, false) then
    raise exception 'owner_access is restricted to the ARI owner'
      using errcode = '42501';
  end if;

  new.owner_access := false;
  return new;
end;
$$;

revoke all on function public.enforce_ari_owner_access() from public;

drop trigger if exists protect_ari_owner_access on public.profiles;

create trigger protect_ari_owner_access
before insert or update on public.profiles
for each row
execute function public.enforce_ari_owner_access();

commit;
