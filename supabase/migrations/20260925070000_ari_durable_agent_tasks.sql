-- Durable multi-agent task orchestration for ARI vNext.
-- Coordination metadata is server-only. Specialist conclusions are stored in the
-- append-only agent mailbox, not duplicated as raw worker transcripts here.

create table if not exists public.ari_vnext_agent_task_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_session_id text not null,
  conversation_id text,
  root_turn_id text,
  last_turn_id text,
  goal text not null,
  success_criteria text,
  status text not null default 'planning',
  plan jsonb not null default '{}'::jsonb,
  verification jsonb not null default '{}'::jsonb,
  synthesis text,
  next_step text,
  round_count smallint not null default 0,
  max_rounds smallint not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint ari_vnext_agent_task_sessions_user_execution_uidx
    unique (user_id, execution_session_id),
  constraint ari_vnext_agent_task_sessions_execution_len
    check (char_length(execution_session_id) between 8 and 180),
  constraint ari_vnext_agent_task_sessions_conversation_len
    check (conversation_id is null or char_length(conversation_id) <= 180),
  constraint ari_vnext_agent_task_sessions_turn_len
    check (
      (root_turn_id is null or char_length(root_turn_id) <= 180) and
      (last_turn_id is null or char_length(last_turn_id) <= 180)
    ),
  constraint ari_vnext_agent_task_sessions_goal_len
    check (char_length(goal) between 3 and 900),
  constraint ari_vnext_agent_task_sessions_success_len
    check (success_criteria is null or char_length(success_criteria) <= 1200),
  constraint ari_vnext_agent_task_sessions_status_chk
    check (status in ('planning','running','verifying','waiting','completed','failed','abandoned')),
  constraint ari_vnext_agent_task_sessions_synthesis_len
    check (synthesis is null or char_length(synthesis) <= 9000),
  constraint ari_vnext_agent_task_sessions_next_step_len
    check (next_step is null or char_length(next_step) <= 1200),
  constraint ari_vnext_agent_task_sessions_round_chk
    check (round_count between 0 and 4 and max_rounds between 1 and 4)
);

comment on table public.ari_vnext_agent_task_sessions is
  'Server-only durable Ari multi-agent coordination sessions. Stores plans, bounded verification summaries, and resume state; never hidden chain-of-thought.';

create index if not exists ari_vnext_agent_task_sessions_user_status_idx
  on public.ari_vnext_agent_task_sessions (user_id, status, updated_at desc);

create index if not exists ari_vnext_agent_task_sessions_conversation_idx
  on public.ari_vnext_agent_task_sessions (user_id, conversation_id, updated_at desc);

create table if not exists public.ari_vnext_agent_task_workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.ari_vnext_agent_task_sessions(id) on delete cascade,
  worker_key text not null,
  role text not null,
  objective text not null,
  round smallint not null default 0,
  followup boolean not null default false,
  status text not null default 'planned',
  mailbox_message_id uuid references public.ari_agent_mailbox_messages(id) on delete set null,
  provider_model text,
  error_code text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint ari_vnext_agent_task_workers_task_key_uidx
    unique (task_id, worker_key),
  constraint ari_vnext_agent_task_workers_key_len
    check (char_length(worker_key) between 2 and 80),
  constraint ari_vnext_agent_task_workers_role_len
    check (char_length(role) between 2 and 120),
  constraint ari_vnext_agent_task_workers_objective_len
    check (char_length(objective) between 3 and 1600),
  constraint ari_vnext_agent_task_workers_round_chk
    check (round between 0 and 4),
  constraint ari_vnext_agent_task_workers_status_chk
    check (status in ('planned','running','completed','failed','skipped')),
  constraint ari_vnext_agent_task_workers_model_len
    check (provider_model is null or char_length(provider_model) <= 160),
  constraint ari_vnext_agent_task_workers_error_len
    check (error_code is null or char_length(error_code) <= 240)
);

comment on table public.ari_vnext_agent_task_workers is
  'Server-only worker assignment/status ledger for durable Ari multi-agent tasks. Raw worker conclusions live in ari_agent_mailbox_messages.';

create index if not exists ari_vnext_agent_task_workers_task_round_idx
  on public.ari_vnext_agent_task_workers (task_id, round, created_at asc);

create index if not exists ari_vnext_agent_task_workers_user_status_idx
  on public.ari_vnext_agent_task_workers (user_id, status, updated_at desc);

alter table public.ari_vnext_agent_task_sessions enable row level security;
alter table public.ari_vnext_agent_task_workers enable row level security;

revoke all on table public.ari_vnext_agent_task_sessions from public, anon, authenticated, service_role;
revoke all on table public.ari_vnext_agent_task_workers from public, anon, authenticated, service_role;

grant select, insert, update on table public.ari_vnext_agent_task_sessions to service_role;
grant select, insert, update on table public.ari_vnext_agent_task_workers to service_role;
