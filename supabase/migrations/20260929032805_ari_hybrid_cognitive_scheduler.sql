-- ARI hybrid cognitive scheduler: durable decisions, urgent triggers, and atomic background AI budget reservations.
-- Applied to production Supabase as migration 20260929032805.

create table if not exists public.ari_vnext_cognitive_schedule_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lane text,
  decision_mode text not null,
  reason text,
  score numeric(12,6),
  candidates jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  trigger_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists ari_vnext_cognitive_schedule_events_user_created_idx
  on public.ari_vnext_cognitive_schedule_events (user_id, created_at desc);

create table if not exists public.ari_vnext_cognitive_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lane text not null check (lane in ('repair','autonomy','experience','community','dreaming','theory')),
  reason text not null,
  priority text not null default 'urgent' check (priority in ('normal','high','urgent')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','cancelled')),
  not_before timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ari_vnext_cognitive_triggers_pending_idx
  on public.ari_vnext_cognitive_triggers (user_id, status, priority, not_before, created_at);

create table if not exists public.ari_background_ai_budget_counters (
  user_id uuid not null,
  period_kind text not null check (period_kind in ('day','month')),
  period_start date not null,
  committed_usd numeric(14,8) not null default 0 check (committed_usd >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_kind, period_start)
);

create table if not exists public.ari_background_ai_budget_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_category text not null,
  model text not null,
  estimated_cost_usd numeric(14,8) not null check (estimated_cost_usd >= 0),
  actual_cost_usd numeric(14,8),
  daily_period_start date not null,
  monthly_period_start date not null,
  status text not null default 'reserved' check (status in ('reserved','settled','released')),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists ari_background_ai_budget_reservations_user_status_idx
  on public.ari_background_ai_budget_reservations (user_id, status, expires_at);

alter table public.ari_vnext_cognitive_schedule_events enable row level security;
alter table public.ari_vnext_cognitive_triggers enable row level security;
alter table public.ari_background_ai_budget_counters enable row level security;
alter table public.ari_background_ai_budget_reservations enable row level security;

revoke all on table public.ari_vnext_cognitive_schedule_events from public, anon, authenticated;
revoke all on table public.ari_vnext_cognitive_triggers from public, anon, authenticated;
revoke all on table public.ari_background_ai_budget_counters from public, anon, authenticated;
revoke all on table public.ari_background_ai_budget_reservations from public, anon, authenticated;

grant select, insert, update, delete on table public.ari_vnext_cognitive_schedule_events to service_role;
grant select, insert, update, delete on table public.ari_vnext_cognitive_triggers to service_role;
grant select, insert, update, delete on table public.ari_background_ai_budget_counters to service_role;
grant select, insert, update, delete on table public.ari_background_ai_budget_reservations to service_role;

create or replace function public.ari_reserve_background_ai_budget(
  p_user_id uuid,
  p_request_category text,
  p_model text,
  p_estimated_cost_usd numeric,
  p_daily_limit_usd numeric,
  p_monthly_limit_usd numeric,
  p_seed_daily_spend_usd numeric default 0,
  p_seed_monthly_spend_usd numeric default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_month date := date_trunc('month', now() at time zone 'utc')::date;
  v_daily numeric(14,8);
  v_monthly numeric(14,8);
  v_reservation_id uuid;
  v_expired record;
  v_estimate numeric(14,8) := greatest(coalesce(p_estimated_cost_usd, 0), 0);
begin
  if p_user_id is null or v_estimate <= 0 or p_daily_limit_usd <= 0 or p_monthly_limit_usd <= 0 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_reservation_input');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 946341));

  for v_expired in
    select *
    from public.ari_background_ai_budget_reservations
    where user_id = p_user_id
      and status = 'reserved'
      and expires_at <= now()
    for update
  loop
    update public.ari_background_ai_budget_counters
       set committed_usd = greatest(0, committed_usd - v_expired.estimated_cost_usd), updated_at = now()
     where user_id = p_user_id and period_kind = 'day' and period_start = v_expired.daily_period_start;

    update public.ari_background_ai_budget_counters
       set committed_usd = greatest(0, committed_usd - v_expired.estimated_cost_usd), updated_at = now()
     where user_id = p_user_id and period_kind = 'month' and period_start = v_expired.monthly_period_start;

    update public.ari_background_ai_budget_reservations
       set status = 'released', updated_at = now()
     where id = v_expired.id;
  end loop;

  insert into public.ari_background_ai_budget_counters(user_id, period_kind, period_start, committed_usd)
  values (p_user_id, 'day', v_day, greatest(coalesce(p_seed_daily_spend_usd, 0), 0))
  on conflict (user_id, period_kind, period_start) do nothing;

  insert into public.ari_background_ai_budget_counters(user_id, period_kind, period_start, committed_usd)
  values (p_user_id, 'month', v_month, greatest(coalesce(p_seed_monthly_spend_usd, 0), 0))
  on conflict (user_id, period_kind, period_start) do nothing;

  select committed_usd into v_daily
  from public.ari_background_ai_budget_counters
  where user_id = p_user_id and period_kind = 'day' and period_start = v_day
  for update;

  select committed_usd into v_monthly
  from public.ari_background_ai_budget_counters
  where user_id = p_user_id and period_kind = 'month' and period_start = v_month
  for update;

  if v_daily + v_estimate > p_daily_limit_usd then
    return jsonb_build_object('allowed', false, 'reason', 'daily_budget_reservation_rejected',
      'dailyCommittedUsd', v_daily, 'monthlyCommittedUsd', v_monthly, 'estimatedCostUsd', v_estimate);
  end if;

  if v_monthly + v_estimate > p_monthly_limit_usd then
    return jsonb_build_object('allowed', false, 'reason', 'monthly_budget_reservation_rejected',
      'dailyCommittedUsd', v_daily, 'monthlyCommittedUsd', v_monthly, 'estimatedCostUsd', v_estimate);
  end if;

  insert into public.ari_background_ai_budget_reservations(
    user_id, request_category, model, estimated_cost_usd, daily_period_start, monthly_period_start
  )
  values (
    p_user_id, left(coalesce(p_request_category, 'background'), 200),
    left(coalesce(p_model, 'unknown'), 160), v_estimate, v_day, v_month
  )
  returning id into v_reservation_id;

  update public.ari_background_ai_budget_counters
     set committed_usd = committed_usd + v_estimate, updated_at = now()
   where user_id = p_user_id and period_kind = 'day' and period_start = v_day;

  update public.ari_background_ai_budget_counters
     set committed_usd = committed_usd + v_estimate, updated_at = now()
   where user_id = p_user_id and period_kind = 'month' and period_start = v_month;

  return jsonb_build_object('allowed', true, 'reason', 'reserved', 'reservationId', v_reservation_id,
    'estimatedCostUsd', v_estimate, 'dailyCommittedUsd', v_daily + v_estimate,
    'monthlyCommittedUsd', v_monthly + v_estimate);
end;
$$;

create or replace function public.ari_settle_background_ai_budget(
  p_reservation_id uuid,
  p_actual_cost_usd numeric
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.ari_background_ai_budget_reservations%rowtype;
  v_actual numeric(14,8) := greatest(coalesce(p_actual_cost_usd, 0), 0);
  v_delta numeric(14,8);
begin
  select * into v_row
  from public.ari_background_ai_budget_reservations
  where id = p_reservation_id;

  if not found then
    return jsonb_build_object('settled', false, 'reason', 'reservation_not_found');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_row.user_id::text, 946341));

  select * into v_row
  from public.ari_background_ai_budget_reservations
  where id = p_reservation_id
  for update;

  if v_row.status <> 'reserved' then
    return jsonb_build_object('settled', true, 'reason', 'already_final', 'status', v_row.status);
  end if;

  v_delta := v_actual - v_row.estimated_cost_usd;

  update public.ari_background_ai_budget_counters
     set committed_usd = greatest(0, committed_usd + v_delta), updated_at = now()
   where user_id = v_row.user_id and period_kind = 'day' and period_start = v_row.daily_period_start;

  update public.ari_background_ai_budget_counters
     set committed_usd = greatest(0, committed_usd + v_delta), updated_at = now()
   where user_id = v_row.user_id and period_kind = 'month' and period_start = v_row.monthly_period_start;

  update public.ari_background_ai_budget_reservations
     set status = 'settled', actual_cost_usd = v_actual, settled_at = now(), updated_at = now()
   where id = p_reservation_id;

  return jsonb_build_object('settled', true, 'reason', 'settled', 'actualCostUsd', v_actual);
end;
$$;

create or replace function public.ari_release_background_ai_budget(p_reservation_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.ari_background_ai_budget_reservations%rowtype;
begin
  select * into v_row
  from public.ari_background_ai_budget_reservations
  where id = p_reservation_id;

  if not found then
    return jsonb_build_object('released', false, 'reason', 'reservation_not_found');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_row.user_id::text, 946341));

  select * into v_row
  from public.ari_background_ai_budget_reservations
  where id = p_reservation_id
  for update;

  if v_row.status <> 'reserved' then
    return jsonb_build_object('released', true, 'reason', 'already_final', 'status', v_row.status);
  end if;

  update public.ari_background_ai_budget_counters
     set committed_usd = greatest(0, committed_usd - v_row.estimated_cost_usd), updated_at = now()
   where user_id = v_row.user_id and period_kind = 'day' and period_start = v_row.daily_period_start;

  update public.ari_background_ai_budget_counters
     set committed_usd = greatest(0, committed_usd - v_row.estimated_cost_usd), updated_at = now()
   where user_id = v_row.user_id and period_kind = 'month' and period_start = v_row.monthly_period_start;

  update public.ari_background_ai_budget_reservations
     set status = 'released', updated_at = now()
   where id = p_reservation_id;

  return jsonb_build_object('released', true, 'reason', 'released');
end;
$$;

create or replace function public.ari_claim_cognitive_trigger(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trigger public.ari_vnext_cognitive_triggers%rowtype;
begin
  update public.ari_vnext_cognitive_triggers
     set status = 'cancelled', updated_at = now()
   where user_id = p_user_id and status = 'pending' and expires_at <= now();

  select * into v_trigger
  from public.ari_vnext_cognitive_triggers
  where user_id = p_user_id
    and status = 'pending'
    and not_before <= now()
    and expires_at > now()
  order by case priority when 'urgent' then 3 when 'high' then 2 else 1 end desc, created_at asc
  limit 1
  for update skip locked;

  if not found then
    return jsonb_build_object('claimed', false, 'reason', 'no_pending_trigger');
  end if;

  update public.ari_vnext_cognitive_triggers
     set status = 'running', claimed_at = now(), updated_at = now()
   where id = v_trigger.id;

  return jsonb_build_object('claimed', true, 'trigger', jsonb_build_object(
    'id', v_trigger.id, 'userId', v_trigger.user_id, 'lane', v_trigger.lane,
    'reason', v_trigger.reason, 'priority', v_trigger.priority, 'payload', v_trigger.payload
  ));
end;
$$;

revoke execute on function public.ari_reserve_background_ai_budget(uuid,text,text,numeric,numeric,numeric,numeric,numeric)
  from public, anon, authenticated;
revoke execute on function public.ari_settle_background_ai_budget(uuid,numeric)
  from public, anon, authenticated;
revoke execute on function public.ari_release_background_ai_budget(uuid)
  from public, anon, authenticated;
revoke execute on function public.ari_claim_cognitive_trigger(uuid)
  from public, anon, authenticated;

grant execute on function public.ari_reserve_background_ai_budget(uuid,text,text,numeric,numeric,numeric,numeric,numeric)
  to service_role;
grant execute on function public.ari_settle_background_ai_budget(uuid,numeric)
  to service_role;
grant execute on function public.ari_release_background_ai_budget(uuid)
  to service_role;
grant execute on function public.ari_claim_cognitive_trigger(uuid)
  to service_role;
