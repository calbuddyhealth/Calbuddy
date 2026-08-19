create table if not exists public.nutrition_label_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  barcode text,
  product_name text not null,
  brand text,
  serving_label text,
  serving_grams numeric,
  servings_per_container numeric,
  calories_per_serving numeric not null default 0,
  protein_g_per_serving numeric not null default 0,
  carbs_g_per_serving numeric not null default 0,
  fat_g_per_serving numeric not null default 0,
  sugar_g_per_serving numeric not null default 0,
  sodium_mg_per_serving numeric not null default 0,
  confidence numeric not null default 0.5,
  user_confirmed boolean not null default true,
  scan_day date not null default current_date,
  source text not null default 'nutrition_label_scan',
  status text not null default 'evidence',
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  promoted_at timestamptz
);

create index if not exists nutrition_label_evidence_barcode_idx
  on public.nutrition_label_evidence (barcode, created_at desc)
  where barcode is not null;

create index if not exists nutrition_label_evidence_user_day_idx
  on public.nutrition_label_evidence (user_id, scan_day desc, created_at desc);

alter table public.nutrition_label_evidence enable row level security;

drop policy if exists nutrition_label_evidence_select_own on public.nutrition_label_evidence;
create policy nutrition_label_evidence_select_own
  on public.nutrition_label_evidence
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists nutrition_label_evidence_insert_own on public.nutrition_label_evidence;
create policy nutrition_label_evidence_insert_own
  on public.nutrition_label_evidence
  for insert
  to authenticated
  with check (auth.uid() = user_id and user_confirmed = true and status = 'evidence');

create table if not exists public.ari_nutrition_vision_usage (
  user_id uuid not null,
  nutrition_day date not null,
  used_count integer not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, nutrition_day)
);

alter table public.ari_nutrition_vision_usage enable row level security;

drop policy if exists ari_nutrition_vision_usage_select_own on public.ari_nutrition_vision_usage;
create policy ari_nutrition_vision_usage_select_own
  on public.ari_nutrition_vision_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.claim_nutrition_label_scan(
  p_user_id uuid,
  p_nutrition_day date,
  p_limit integer default 3
)
returns table(allowed boolean, used_count integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  if p_user_id is null or p_nutrition_day is null or p_limit < 1 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.ari_nutrition_vision_usage(user_id, nutrition_day, used_count, updated_at)
  values (p_user_id, p_nutrition_day, 1, now())
  on conflict (user_id, nutrition_day) do nothing;

  get diagnostics v_used = row_count;
  if v_used = 1 then
    return query select true, 1, greatest(p_limit - 1, 0);
    return;
  end if;

  update public.ari_nutrition_vision_usage
  set used_count = used_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and nutrition_day = p_nutrition_day
    and used_count < p_limit
  returning ari_nutrition_vision_usage.used_count into v_used;

  if found then
    return query select true, v_used, greatest(p_limit - v_used, 0);
    return;
  end if;

  select u.used_count
  into v_used
  from public.ari_nutrition_vision_usage u
  where u.user_id = p_user_id
    and u.nutrition_day = p_nutrition_day;

  return query select false, coalesce(v_used, p_limit), 0;
end;
$$;

create or replace function public.release_nutrition_label_scan(
  p_user_id uuid,
  p_nutrition_day date
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ari_nutrition_vision_usage
  set used_count = greatest(used_count - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and nutrition_day = p_nutrition_day;
$$;

revoke all on function public.claim_nutrition_label_scan(uuid, date, integer) from public;
revoke all on function public.release_nutrition_label_scan(uuid, date) from public;
grant execute on function public.claim_nutrition_label_scan(uuid, date, integer) to service_role;
grant execute on function public.release_nutrition_label_scan(uuid, date) to service_role;