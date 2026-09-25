-- Durable Communication Closure Engine ledger.
-- Server-only, compact lifecycle records; no hidden chain-of-thought.

create table if not exists public.ari_vnext_communication_closures (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text,
  root_turn_id text,
  last_turn_id text,
  level smallint not null check (level between 1 and 3),
  status text not null check (status in (
    'received','interpreted','contracted','planned','executing','observed',
    'verified','outcome_pending','closed','blocked','failed','partial',
    'superseded','rejected','unknown'
  )),
  terminal_state text not null default 'open' check (terminal_state in (
    'open','verified','partial','blocked','failed','rejected','superseded'
  )),
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists ari_vnext_communication_closures_user_updated_idx
  on public.ari_vnext_communication_closures (user_id, updated_at desc);

create index if not exists ari_vnext_communication_closures_user_status_idx
  on public.ari_vnext_communication_closures (user_id, status, updated_at desc);

alter table public.ari_vnext_communication_closures enable row level security;

revoke all on table public.ari_vnext_communication_closures from anon, authenticated;
grant select, insert, update, delete on table public.ari_vnext_communication_closures to service_role;

comment on table public.ari_vnext_communication_closures is
  'Server-only Ari communication closure lifecycle ledger. Stores compact intent, acceptance criteria, evidence, corrections, dependency invalidations, and observed outcomes; never hidden chain-of-thought.';

comment on column public.ari_vnext_communication_closures.record is
  'Bounded closure record including literal request, selected interpretation, acceptance criteria, evidence, corrections, claim dependencies, and outcome delta.';
