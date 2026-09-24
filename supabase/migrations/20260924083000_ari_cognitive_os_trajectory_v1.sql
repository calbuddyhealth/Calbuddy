-- ARI Cognitive OS — sanitized trajectory/evaluation ledger v1
-- Server-only learning evidence. Never stores prompt/reply text, tool arguments,
-- raw app state, secrets, memory payloads, or hidden chain-of-thought.

begin;

create table if not exists public.ari_vnext_cognitive_trajectories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null,
  conversation_id text,
  surface text,
  domain text not null default 'general',
  plan_mode text not null default 'direct',
  route jsonb not null default '{}'::jsonb,
  sources jsonb not null default '{}'::jsonb,
  planner jsonb not null default '{}'::jsonb,
  verification jsonb not null default '{}'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  outcome jsonb not null default '{}'::jsonb,
  learning jsonb not null default '{}'::jsonb,
  trajectory_version text not null default '1.0.0',
  created_at timestamptz not null default now(),

  constraint ari_vnext_cognitive_trajectories_user_turn_uidx
    unique (user_id, turn_id),
  constraint ari_vnext_cognitive_trajectories_route_object_check
    check (jsonb_typeof(route) = 'object'),
  constraint ari_vnext_cognitive_trajectories_sources_object_check
    check (jsonb_typeof(sources) = 'object'),
  constraint ari_vnext_cognitive_trajectories_planner_object_check
    check (jsonb_typeof(planner) = 'object'),
  constraint ari_vnext_cognitive_trajectories_verification_object_check
    check (jsonb_typeof(verification) = 'object'),
  constraint ari_vnext_cognitive_trajectories_evaluation_object_check
    check (jsonb_typeof(evaluation) = 'object'),
  constraint ari_vnext_cognitive_trajectories_outcome_object_check
    check (jsonb_typeof(outcome) = 'object'),
  constraint ari_vnext_cognitive_trajectories_learning_object_check
    check (jsonb_typeof(learning) = 'object'),
  constraint ari_vnext_cognitive_trajectories_domain_len_check
    check (char_length(domain) between 1 and 60),
  constraint ari_vnext_cognitive_trajectories_plan_mode_check
    check (plan_mode in ('direct', 'deliberative', 'hierarchical'))
);

create index if not exists ari_vnext_cognitive_trajectories_user_created_idx
  on public.ari_vnext_cognitive_trajectories (user_id, created_at desc);

create index if not exists ari_vnext_cognitive_trajectories_user_domain_created_idx
  on public.ari_vnext_cognitive_trajectories (user_id, domain, created_at desc);

alter table public.ari_vnext_cognitive_trajectories enable row level security;

revoke all on table public.ari_vnext_cognitive_trajectories from anon, authenticated;
grant select, insert, update, delete on table public.ari_vnext_cognitive_trajectories to service_role;

comment on table public.ari_vnext_cognitive_trajectories is
  'Server-only sanitized Ari Cognitive OS trajectory/evaluation ledger. Never stores prompts, replies, tool arguments, raw app state, secrets, memory payloads, or hidden chain-of-thought.';

comment on column public.ari_vnext_cognitive_trajectories.evaluation is
  'Deterministic observable outcome checks such as verification discipline, action grounding, calibration, and completion evidence.';

commit;
