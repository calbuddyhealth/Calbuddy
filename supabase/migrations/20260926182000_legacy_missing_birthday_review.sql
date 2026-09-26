-- ARI XP — allow legacy accounts without a protected birthday to enter owner review
-- 2026-09-26
--
-- New registrations always capture DOB, but pre-age-gate accounts can still
-- have ari_account_state.date_of_birth = null. Those accounts must be able to
-- submit an initial protected birthday without bypassing password reauth or
-- owner review.

begin;

alter table public.ari_age_correction_requests
  alter column current_date_of_birth drop not null,
  alter column current_age_at_request drop not null;

create or replace function public.ari_request_my_age_correction(
  requested_date_of_birth date,
  requested_explanation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  account_status text;
  existing_dob date;
  existing_age integer;
  requested_age integer;
  password_auth_at timestamptz;
  pending_id uuid;
  new_id uuid;
  initial_birthday_setup boolean := false;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select s.status, s.date_of_birth
    into account_status, existing_dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  if not found then
    insert into public.ari_account_state (user_id, status)
    values (caller_id, 'active')
    on conflict (user_id) do nothing;

    account_status := 'active';
    existing_dob := null;
  end if;

  if account_status <> 'active' then
    raise exception 'Account must be active before requesting a birthday change.';
  end if;

  if requested_date_of_birth is null or requested_date_of_birth > current_date then
    raise exception 'Enter a valid birthday.';
  end if;

  requested_age := public.ari_account_age_years(requested_date_of_birth);
  if requested_age is null or requested_age > 120 then
    raise exception 'Enter a valid birthday.';
  end if;

  existing_age := public.ari_account_age_years(existing_dob);
  initial_birthday_setup := existing_dob is null;

  if not initial_birthday_setup and requested_date_of_birth = existing_dob then
    raise exception 'The requested birthday matches the current account birthday.';
  end if;

  password_auth_at := public.ari_recent_password_auth_at();
  if password_auth_at is null or password_auth_at < now() - interval '5 minutes' then
    raise exception 'Re-enter your current email and password before submitting this request.';
  end if;

  select r.id into pending_id
  from public.ari_age_correction_requests r
  where r.user_id = caller_id and r.status = 'pending'
  limit 1;

  if pending_id is not null then
    raise exception 'A birthday request is already pending owner review.';
  end if;

  insert into public.ari_age_correction_requests (
    user_id,
    current_date_of_birth,
    requested_date_of_birth,
    current_age_at_request,
    requested_age_at_request,
    crosses_adult_boundary,
    explanation,
    reauthenticated_at,
    reauthentication_method
  ) values (
    caller_id,
    existing_dob,
    requested_date_of_birth,
    existing_age,
    requested_age,
    case
      when existing_age is null then false
      else (existing_age < 18 and requested_age >= 18)
        or (existing_age >= 18 and requested_age < 18)
    end,
    left(btrim(coalesce(requested_explanation, '')), 2000),
    password_auth_at,
    'password'
  ) returning id into new_id;

  return jsonb_build_object(
    'success', true,
    'request_id', new_id,
    'status', 'pending',
    'initial_birthday_setup', initial_birthday_setup,
    'message', case
      when initial_birthday_setup then 'Birthday submitted for owner review.'
      else 'Birthday correction submitted for owner review.'
    end
  );
end;
$$;

revoke all on function public.ari_request_my_age_correction(date,text) from public, anon;
grant execute on function public.ari_request_my_age_correction(date,text) to authenticated;

commit;
