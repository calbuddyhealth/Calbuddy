-- Server-only evidence attribution and bounded post-response reflection receipts.
alter table public.ari_vnext_strategy_uses
  add column if not exists conversation_id text,
  add column if not exists response_hash text,
  add column if not exists application_evidence jsonb,
  add column if not exists feedback_turn_id text;
create index if not exists ari_strategy_uses_response_idx on public.ari_vnext_strategy_uses
  (user_id, conversation_id, response_hash, created_at desc) where outcome = 'pending';
create unique index if not exists ari_strategy_feedback_once_idx on public.ari_vnext_strategy_uses
  (user_id, feedback_turn_id) where feedback_turn_id is not null;

create or replace function public.ari_apply_strategy_feedback(
  p_user_id uuid, p_use_id uuid, p_feedback_turn_id text,
  p_outcome text, p_expected_trials integer, p_next jsonb
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare u public.ari_vnext_strategy_uses; s public.ari_vnext_adaptive_strategies;
begin
  if p_outcome not in ('positive','negative') or nullif(p_feedback_turn_id,'') is null then return false; end if;
  select * into u from public.ari_vnext_strategy_uses
    where id=p_use_id and user_id=p_user_id for update;
  if not found or u.outcome <> 'pending' or u.application_evidence->>'source' is distinct from 'model_assessed_visible_application' then return false; end if;
  select * into s from public.ari_vnext_adaptive_strategies
    where id=u.strategy_id and user_id=p_user_id for update;
  if not found or s.trials <> p_expected_trials then return false; end if;
  if exists (select 1 from public.ari_vnext_strategy_uses where user_id=p_user_id and feedback_turn_id=p_feedback_turn_id) then return false; end if;
  update public.ari_vnext_adaptive_strategies set
    status=p_next->>'status', confidence=(p_next->>'confidence')::numeric,
    maturity_score=(p_next->>'maturityScore')::numeric,
    trials=trials+1, positive_outcomes=positive_outcomes+(p_outcome='positive')::integer,
    negative_outcomes=negative_outcomes+(p_outcome='negative')::integer,
    adopted_at=(p_next->>'adoptedAt')::timestamptz,
    matured_at=(p_next->>'maturedAt')::timestamptz,
    retired_at=(p_next->>'retiredAt')::timestamptz, updated_at=now()
    where id=s.id;
  update public.ari_vnext_strategy_uses set outcome=p_outcome, feedback_turn_id=p_feedback_turn_id, resolved_at=now() where id=u.id;
  if s.status='testing' and p_next->>'status' in ('adopted','practical_prior') and s.replaces_strategy_key is not null then
    update public.ari_vnext_adaptive_strategies set status='retired', retired_at=now(), updated_at=now()
      where user_id=p_user_id and strategy_key=s.replaces_strategy_key;
  end if;
  return true;
exception when unique_violation then return false;
end $$;
revoke all on function public.ari_apply_strategy_feedback(uuid,uuid,text,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.ari_apply_strategy_feedback(uuid,uuid,text,text,integer,jsonb) to service_role;

create table if not exists public.ari_vnext_reflection_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','skipped')),
  input jsonb not null default '{}'::jsonb,
  receipt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), started_at timestamptz, completed_at timestamptz,
  unique(user_id,turn_id)
);
alter table public.ari_vnext_reflection_jobs enable row level security;
revoke all on public.ari_vnext_reflection_jobs from public, anon, authenticated;
grant all on public.ari_vnext_reflection_jobs to service_role;
create index if not exists ari_reflection_jobs_pending_idx on public.ari_vnext_reflection_jobs(user_id,created_at) where status='queued';

create or replace function public.ari_claim_reflection_job(p_user_id uuid)
returns setof public.ari_vnext_reflection_jobs language plpgsql security invoker set search_path='' as $$
begin
  -- Never repeat a model request of unknown completion: interrupted jobs retain
  -- a truthful failure receipt and have their private input removed.
  update public.ari_vnext_reflection_jobs set status='failed', input='{}',
    receipt='{"reason":"interrupted_no_automatic_model_retry"}', completed_at=now()
    where user_id=p_user_id and status='running' and started_at < now()-interval '10 minutes';
  update public.ari_vnext_reflection_jobs set status='skipped', input='{}',
    receipt='{"reason":"expired"}', completed_at=now()
    where user_id=p_user_id and status='queued' and created_at < now()-interval '7 days';
  delete from public.ari_vnext_reflection_jobs where user_id=p_user_id and completed_at < now()-interval '30 days';
  -- One in-flight learning job per user, even across concurrent chat requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 731));
  if exists(select 1 from public.ari_vnext_reflection_jobs where user_id=p_user_id and status='running') then return; end if;
  return query update public.ari_vnext_reflection_jobs set status='running', started_at=now()
    where id=(select id from public.ari_vnext_reflection_jobs where user_id=p_user_id and status='queued' order by created_at limit 1 for update skip locked)
    returning *;
end $$;
revoke all on function public.ari_claim_reflection_job(uuid) from public, anon, authenticated;
grant execute on function public.ari_claim_reflection_job(uuid) to service_role;
