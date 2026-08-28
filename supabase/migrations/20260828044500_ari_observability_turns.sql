-- ARI vNext Phase 11B — sanitized server-only observability ledger.
-- Stores decision codes/counters only. Prompt text, user/reply text, tool arguments,
-- raw app state, memory payloads, secrets, and hidden reasoning are forbidden by
-- the application serializer and are not modeled as first-class columns here.

create table if not exists public.ari_observability_turns (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null,
  turn_id text not null,
  conversation_id text,
  trace_version text not null,
  store_version text not null,
  outcome text not null,
  outcome_source text,
  error_code text,
  active_domains text[] not null default '{}'::text[],
  follow_up boolean not null default false,
  current_info boolean not null default false,
  high_stakes boolean not null default false,
  developer_route boolean not null default false,
  casual_conversation boolean not null default false,
  nutrition_logging boolean not null default false,
  coaching_state boolean not null default false,
  model text,
  routing_class text,
  model_mode text,
  reasoning_effort text,
  fast_eligible boolean not null default false,
  context_profile text,
  history_before integer not null default 0 check (history_before >= 0),
  history_after integer not null default 0 check (history_after >= 0),
  reference_status text,
  reference_reason text,
  reference_candidate_count integer not null default 0 check (reference_candidate_count >= 0),
  clarification_required boolean not null default false,
  authorization_mode text,
  authorization_decision text,
  authorization_confidence numeric(5,4) not null default 0 check (authorization_confidence >= 0 and authorization_confidence <= 1),
  application_action text,
  action_type text,
  confirmation_state text,
  compound_mode text,
  compound_action_count integer not null default 0 check (compound_action_count >= 0),
  compound_blocked boolean not null default false,
  performance_status text,
  performance_turn_class text,
  model_call_count integer not null default 0 check (model_call_count >= 0),
  avoided_model_call_count integer not null default 0 check (avoided_model_call_count >= 0),
  failed_model_call_count integer not null default 0 check (failed_model_call_count >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  model_latency_ms integer not null default 0 check (model_latency_ms >= 0),
  estimated_cost_usd numeric(14,8),
  trace jsonb not null default '{}'::jsonb,
  constraint ari_observability_turns_user_turn_uidx unique (user_id, turn_id),
  constraint ari_observability_turns_outcome_check check (outcome in ('reply','proposal','execute_pending','cancelled','blocked','error','unknown'))
);

create index if not exists ari_observability_turns_created_idx
  on public.ari_observability_turns (created_at desc);
create index if not exists ari_observability_turns_user_created_idx
  on public.ari_observability_turns (user_id, created_at desc);
create index if not exists ari_observability_turns_outcome_created_idx
  on public.ari_observability_turns (outcome, created_at desc);
create index if not exists ari_observability_turns_performance_created_idx
  on public.ari_observability_turns (performance_status, created_at desc);

alter table public.ari_observability_turns enable row level security;

-- The ledger is intentionally not a client-facing Data API surface.
revoke all on table public.ari_observability_turns from public, anon, authenticated;
grant select, insert on table public.ari_observability_turns to service_role;

comment on table public.ari_observability_turns is
  'Server-only sanitized Ari decision/outcome telemetry. Never store prompt/reply text, tool arguments, memory payloads, app state, secrets, or hidden reasoning.';
