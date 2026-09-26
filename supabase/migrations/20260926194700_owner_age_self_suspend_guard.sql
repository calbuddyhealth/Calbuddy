-- ARI XP — prevent owner birthday changes from self-suspending owner access
-- 2026-09-26
--
-- Owner accounts are privileged adult accounts. A malformed birthday request
-- (for example, selecting today's date) must never be able to demote an owner
-- into teen/under-13 authorization or trigger suspended_by_admin. Keep the
-- normal under-13 fail-safe for non-owner accounts.

begin;

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

  if requested_age < 18 and exists (
    select 1
    from public.ari_app_admins a
    where a.user_id = caller_id
      and a.role = 'owner'
  ) then
    raise exception 'Owner accounts must remain 18+. Enter an adult birthday or remove owner access before changing to a minor birthday.';
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

create or replace function public.ari_owner_review_age_correction(
  requested_request_id uuid,
  requested_decision text,
  requested_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  reviewer_id uuid := auth.uid();
  request_row public.ari_age_correction_requests%rowtype;
  requested_age integer;
  resulting_status text;
begin
  if reviewer_id is null or not exists (
    select 1 from public.ari_app_admins a where a.user_id = reviewer_id and a.role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  if requested_decision not in ('approved','denied') then
    raise exception 'Decision must be approved or denied.';
  end if;

  select * into request_row
  from public.ari_age_correction_requests r
  where r.id = requested_request_id
  for update;

  if request_row.id is null then raise exception 'Age correction request not found.'; end if;
  if request_row.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;

  requested_age := public.ari_account_age_years(request_row.requested_date_of_birth);

  if requested_decision = 'approved'
     and requested_age < 18
     and exists (
       select 1
       from public.ari_app_admins a
       where a.user_id = request_row.user_id
         and a.role = 'owner'
     ) then
    raise exception 'Owner accounts must remain 18+. Remove owner access before approving a minor birthday.';
  end if;

  if requested_decision = 'approved' then
    update public.ari_account_state
    set
      date_of_birth = request_row.requested_date_of_birth,
      age_verified_at = now(),
      age_gate_version = 'account_dob_owner_review_v1',
      status = case when requested_age < 13 then 'suspended_by_admin' else status end,
      updated_at = now()
    where user_id = request_row.user_id
    returning status into resulting_status;

    if requested_age between 13 and 17 then
      update public.profiles
      set age = requested_age
      where id = request_row.user_id;
    end if;
  else
    select status into resulting_status
    from public.ari_account_state
    where user_id = request_row.user_id;
  end if;

  update public.ari_age_correction_requests
  set
    status = requested_decision,
    reviewed_at = now(),
    reviewed_by = reviewer_id,
    review_notes = nullif(left(btrim(coalesce(requested_notes, '')), 2000), ''),
    updated_at = now()
  where id = request_row.id;

  return jsonb_build_object(
    'success', true,
    'request_id', request_row.id,
    'decision', requested_decision,
    'account_status', resulting_status,
    'age_band', case
      when requested_decision <> 'approved' then null
      when requested_age < 13 then 'under_13'
      when requested_age < 18 then 'teen'
      else 'adult'
    end
  );
end;
$$;

revoke all on function public.ari_owner_review_age_correction(uuid,text,text) from public, anon;
grant execute on function public.ari_owner_review_age_correction(uuid,text,text) to authenticated;

commit;
