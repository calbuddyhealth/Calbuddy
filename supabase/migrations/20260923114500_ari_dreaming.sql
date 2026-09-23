-- Ari Dreaming & Consolidation
-- Stores compact evidence-linked insights; raw conversation evidence is not persisted here.

create table if not exists public.ari_vnext_dream_runs (
  user_id uuid not null,
  id text not null,
  status text not null default 'started',
  evidence_fingerprint text not null,
  evidence_counts jsonb not null default '{}'::jsonb,
  model text,
  summary text,
  insight_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint ari_vnext_dream_runs_status_check
    check (status in ('started', 'completed', 'failed', 'skipped')),
  constraint ari_vnext_dream_runs_counts_object_check
    check (jsonb_typeof(evidence_counts) = 'object'),
  constraint ari_vnext_dream_runs_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists ari_vnext_dream_runs_user_started_idx
  on public.ari_vnext_dream_runs (user_id, started_at desc);

create table if not exists public.ari_vnext_dream_insights (
  user_id uuid not null,
  id text not null,
  insight_key text not null,
  run_id text not null,
  kind text not null,
  domain text not null default 'general',
  title text not null,
  summary text not null,
  confidence double precision not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  evidence_basis text,
  action text not null default 'observe',
  transfer_conditions jsonb not null default '[]'::jsonb,
  disconfirmers jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, insight_key),
  constraint ari_vnext_dream_insights_run_fk
    foreign key (user_id, run_id)
    references public.ari_vnext_dream_runs(user_id, id)
    on delete cascade,
  constraint ari_vnext_dream_insights_kind_check
    check (kind in ('communication','relationship','belief','goal','strategy','contradiction','curiosity','capability')),
  constraint ari_vnext_dream_insights_status_check
    check (status in ('active','superseded','rejected')),
  constraint ari_vnext_dream_insights_action_check
    check (action in ('observe','apply','investigate','review')),
  constraint ari_vnext_dream_insights_confidence_check
    check (confidence >= 0 and confidence <= 1),
  constraint ari_vnext_dream_insights_evidence_array_check
    check (jsonb_typeof(evidence_refs) = 'array'),
  constraint ari_vnext_dream_insights_transfer_array_check
    check (jsonb_typeof(transfer_conditions) = 'array'),
  constraint ari_vnext_dream_insights_disconfirmers_array_check
    check (jsonb_typeof(disconfirmers) = 'array'),
  constraint ari_vnext_dream_insights_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists ari_vnext_dream_insights_user_status_idx
  on public.ari_vnext_dream_insights (user_id, status, confidence desc, updated_at desc);

alter table public.ari_vnext_dream_runs enable row level security;
alter table public.ari_vnext_dream_insights enable row level security;

revoke all on table public.ari_vnext_dream_runs from public, anon, authenticated;
revoke all on table public.ari_vnext_dream_insights from public, anon, authenticated;

grant select, insert, update on table public.ari_vnext_dream_runs to service_role;
grant select, insert, update on table public.ari_vnext_dream_insights to service_role;

comment on table public.ari_vnext_dream_runs is
  'Server-only Ari Dreaming consolidation runs. Raw conversation evidence is intentionally not stored here.';
comment on table public.ari_vnext_dream_insights is
  'Provisional evidence-linked consolidation insights used to improve future Ari reasoning and relationship continuity.';
