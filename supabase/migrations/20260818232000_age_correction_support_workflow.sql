-- ARI XP — protected account birthday correction workflow
-- 2026-08-18
--
-- Account DOB is protected authorization data. It is not the editable adult
-- fitness-profile age. Requests never write DOB directly; they enter an
-- owner-review queue. Passwords are verified by Supabase Auth and are never
-- stored in this table.

begin;

create or replace function public.ari_account_age_years(date_of_birth date)
returns integer
language sql
stable
set search_path = 'pg_catalog'
as $$
  select case
    when date_of_birth is null or date_of_birth > current_date then null
    else extract(year from age(current_date, date_of_birth))::integer
  end;
$$;

revoke all on function public.ari_account_age_years(date) from public, anon;
grant execute on function public.ari_account_age_years(date) to authenticated;

create table if not exists public.ari_age_correction_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_date_of_birth date not null,
  requested_date_of_birth date not null,
  current_age_at_request integer not null,
  requested_age_at_request integer not null,
  crosses_adult_boundary boolean not null default false,
  explanation text not null,
  status text not null default 'pending',
  reauthenticated_at timestamptz not null,
  reauthentication_method text not null default 'password',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  updated_at timestamptz not null default now(),
  constraint ari_age_correction_explanation_length check (char_length(btrim(explanation)) between 20 and 2000),
  constraint ari_age_correction_status_check check (status in ('pending','approved','denied','cancelled')),
  constraint ari_age_correction_dob_change check (requested_date_of_birth <> current_date_of_birth),
  constraint ari_age_correction_reauth_method_check check (reauthentication_method = 'password')
);

create unique index if not exists ari_age_correction_one_pending_per_user
  on public.ari_age_correction_requests(user_id)
  where status = 'pending';

create index if not exists ari_age_correction_status_requested_idx
  on public.ari_age_correction_requests(status, requested_at desc);

alter table public.ari_age_correction_requests enable row level security;
revoke all on table public.ari_age_correction_requests from anon, authenticated;

create or replace function public.ari_recent_password_auth_at()
returns timestamptz
language sql
stable
security definer
set search_path = 'pg_catalog'
as $$
  select to_timestamp(max((item->>'timestamp')::bigint))
  from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) item
  where item->>'method' = 'password'
    and (item->>'timestamp') ~ '^[0-9]+$';
$$;

revoke all on function public.ari_recent_password_auth_at() from public, anon;
grant execute on function public.ari_recent_password_auth_at() to authenticated;

create or replace function public.ari_request_my_age_correction(
  requested_date_of_birth date,
  requested_explanation text
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

  if char_length(btrim(coalesce(requested_explanation, ''))) < 20 then
    raise exception 'Explain why the birthday needs to be corrected.';
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
    left(btrim(requested_explanation), 2000),
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

create or replace function public.ari_my_age_correction_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  account_dob date;
  latest public.ari_age_correction_requests%rowtype;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;

  select s.date_of_birth into account_dob
  from public.ari_account_state s
  where s.user_id = caller_id;

  select * into latest
  from public.ari_age_correction_requests r
  where r.user_id = caller_id
  order by r.requested_at desc
  limit 1;

  return jsonb_build_object(
    'date_of_birth', account_dob,
    'derived_age', public.ari_account_age_years(account_dob),
    'latest_request', case
      when latest.id is null then null
      else jsonb_build_object(
        'id', latest.id,
        'requested_date_of_birth', latest.requested_date_of_birth,
        'status', latest.status,
        'requested_at', latest.requested_at,
        'reviewed_at', latest.reviewed_at,
        'review_notes', latest.review_notes
      )
    end
  );
end;
$$;

revoke all on function public.ari_my_age_correction_status() from public, anon;
grant execute on function public.ari_my_age_correction_status() to authenticated;

create or replace function public.ari_owner_age_correction_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  caller_id uuid := auth.uid();
  pending_count integer;
  boundary_count integer;
begin
  if caller_id is null or not exists (
    select 1 from public.ari_app_admins a where a.user_id = caller_id and a.role = 'owner'
  ) then
    return jsonb_build_object('authorized', false);
  end if;

  select count(*)::integer,
         count(*) filter (where crosses_adult_boundary)::integer
    into pending_count, boundary_count
  from public.ari_age_correction_requests
  where status = 'pending';

  return jsonb_build_object(
    'authorized', true,
    'pending', pending_count,
    'age_boundary_changes', boundary_count
  );
end;
$$;

revoke all on function public.ari_owner_age_correction_summary() from public, anon;
grant execute on function public.ari_owner_age_correction_summary() to authenticated;

create or replace function public.ari_owner_age_correction_requests(
  requested_status text default 'pending',
  result_limit integer default 100
)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  current_date_of_birth date,
  requested_date_of_birth date,
  current_age_at_request integer,
  requested_age_at_request integer,
  crosses_adult_boundary boolean,
  explanation text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text
)
language plpgsql
stable
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.ari_app_admins a where a.user_id = auth.uid() and a.role = 'owner'
  ) then
    raise exception 'Owner access required';
  end if;

  return query
  select
    r.id,
    r.user_id,
    u.email::text,
    r.current_date_of_birth,
    r.requested_date_of_birth,
    r.current_age_at_request,
    r.requested_age_at_request,
    r.crosses_adult_boundary,
    r.explanation,
    r.status,
    r.requested_at,
    r.reviewed_at,
    r.reviewed_by,
    r.review_notes
  from public.ari_age_correction_requests r
  left join auth.users u on u.id = r.user_id
  where requested_status = 'all' or r.status = requested_status
  order by
    case when r.status = 'pending' and r.crosses_adult_boundary then 0
         when r.status = 'pending' then 1
         else 2 end,
    r.requested_at asc
  limit greatest(1, least(coalesce(result_limit, 100), 200));
end;
$$;

revoke all on function public.ari_owner_age_correction_requests(text,integer) from public, anon;
grant execute on function public.ari_owner_age_correction_requests(text,integer) to authenticated;

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

    -- For minors, the fitness-profile age is not independent account data.
    -- Keep it synchronized immediately. Adults retain the current editable
    -- Goals behavior and are intentionally not rewritten here.
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
