-- Server-only summaries for the controlled synthetic Isolation Discovery Lab.
create table if not exists public.ari_vnext_isolation_lab_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  protocol_version text not null,
  subject_model text not null,
  status text not null default 'completed' check (status in ('completed','failed')),
  condition_order text[] not null default '{}'::text[],
  metrics jsonb not null default '{}'::jsonb,
  scenario_summary jsonb not null default '{}'::jsonb,
  safety jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_vnext_isolation_lab_runs_user_run_uidx unique (user_id, run_id)
);

comment on table public.ari_vnext_isolation_lab_runs is
  'Server-only summaries of synthetic Ari coordination/isolation discovery experiments. Stores no raw model outputs, prompts, private fragments, credentials, or hidden reasoning.';

create index if not exists ari_vnext_isolation_lab_runs_user_created_idx
  on public.ari_vnext_isolation_lab_runs (user_id, created_at desc);

alter table public.ari_vnext_isolation_lab_runs enable row level security;

revoke all on table public.ari_vnext_isolation_lab_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_vnext_isolation_lab_runs to service_role;
