-- ARI XP — optional age-correction explanation
-- 2026-09-26
--
-- Users may submit a protected birthday correction without providing a reason.
-- Password re-authentication and owner review remain required.

begin;

alter table public.ari_age_correction_requests
  drop constraint if exists ari_age_correction_explanation_length;

alter table public.ari_age_correction_requests
  alter column explanation set default '';

update public.ari_age_correction_requests
set explanation = ''
where explanation is null;

alter table public.ari_age_correction_requests
  alter column explanation set not null;

alter table public.ari_age_correction_requests
  add constraint ari_age_correction_explanation_length
  check (char_length(explanation) <= 2000);

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
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select s.status, s.date_of_birth
    into account_status, existing_dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  if existing_dob is null then
    raise exception 'A protected account birthday is required before requesting a correction.';
  end if;

  if account_status <> 'active' then
    raise exception 'Account must be active before requesting a birthday correction.';
  end if;

  if requested_date_of_birth is null or requested_date_of_birth > current_date then
    raise exception 'Enter a valid birthday.';
  end if;

  existing_age := public.ari_account_age_years(existing_dob);
  requested_age := public.ari_account_age_years(requested_date_of_birth);

  if requested_age is null or requested_age > 120 then
    raise exception 'Enter a valid birthday.';
  end if;

  if requested_date_of_birth = existing_dob then
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
    raise exception 'A birthday correction request is already pending owner review.';
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
    (existing_age < 18 and requested_age >= 18) or (existing_age >= 18 and requested_age < 18),
    left(btrim(coalesce(requested_explanation, '')), 2000),
    password_auth_at,
    'password'
  ) returning id into new_id;

  return jsonb_build_object(
    'success', true,
    'request_id', new_id,
    'status', 'pending',
    'message', 'Birthday correction submitted for owner review.'
  );
end;
$$;

revoke all on function public.ari_request_my_age_correction(date,text) from public, anon;
grant execute on function public.ari_request_my_age_correction(date,text) to authenticated;

commit;
