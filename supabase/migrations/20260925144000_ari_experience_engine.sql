-- Ari Experience Engine
-- Durable, server-only experience lifecycle records. Stores compact conclusions,
-- predictions, observed outcomes, and learning updates; never hidden chain-of-thought.

create table if not exists public.ari_vnext_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_key text not null,
  status text not null default 'awaiting_outcome',
  source_type text not null,
  domain text not null default 'general',
  trigger_ref text,
  trigger_summary text not null default '',
  attention_reason text not null default '',
  prior_belief text not null default '',
  prediction jsonb not null default '{}'::jsonb,
  investigation jsonb not null default '{}'::jsonb,
  observed_outcome jsonb not null default '{}'::jsonb,
  prediction_error double precision,
  surprise double precision,
  information_gain double precision,
  affect_update jsonb not null default '{}'::jsonb,
  belief_update jsonb not null default '{}'::jsonb,
  strategy_update jsonb not null default '{}'::jsonb,
  unresolved_questions jsonb not null default '[]'::jsonb,
  related_refs jsonb not null default '[]'::jsonb,
  follow_up_at timestamptz,
  started_at timestamptz not null default now(),
  observed_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, experience_key),
  constraint ari_vnext_experiences_status_check
    check (status in ('candidate','pursuing','awaiting_outcome','resolved','abandoned')),
  constraint ari_vnext_experiences_source_type_check
    check (source_type in ('curiosity','dream','world_event','decision','goal','experiment','communication','community','manual','experience_followup')),
  constraint ari_vnext_experiences_prediction_object_check
    check (jsonb_typeof(prediction) = 'object'),
  constraint ari_vnext_experiences_investigation_object_check
    check (jsonb_typeof(investigation) = 'object'),
  constraint ari_vnext_experiences_outcome_object_check
    check (jsonb_typeof(observed_outcome) = 'object'),
  constraint ari_vnext_experiences_affect_object_check
    check (jsonb_typeof(affect_update) = 'object'),
  constraint ari_vnext_experiences_belief_object_check
    check (jsonb_typeof(belief_update) = 'object'),
  constraint ari_vnext_experiences_strategy_object_check
    check (jsonb_typeof(strategy_update) = 'object'),
  constraint ari_vnext_experiences_questions_array_check
    check (jsonb_typeof(unresolved_questions) = 'array'),
  constraint ari_vnext_experiences_refs_array_check
    check (jsonb_typeof(related_refs) = 'array'),
  constraint ari_vnext_experiences_prediction_error_check
    check (prediction_error is null or (prediction_error >= 0 and prediction_error <= 1)),
  constraint ari_vnext_experiences_surprise_check
    check (surprise is null or (surprise >= 0 and surprise <= 1)),
  constraint ari_vnext_experiences_information_gain_check
    check (information_gain is null or (information_gain >= 0 and information_gain <= 1)),
  constraint ari_vnext_experiences_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists ari_vnext_experiences_user_updated_idx
  on public.ari_vnext_experiences (user_id, updated_at desc);

create index if not exists ari_vnext_experiences_user_status_followup_idx
  on public.ari_vnext_experiences (user_id, status, follow_up_at)
  where status = 'awaiting_outcome';

create index if not exists ari_vnext_experiences_user_domain_idx
  on public.ari_vnext_experiences (user_id, domain, updated_at desc);

alter table public.ari_vnext_experiences enable row level security;

revoke all on table public.ari_vnext_experiences from public, anon, authenticated;
grant select, insert, update on table public.ari_vnext_experiences to service_role;

comment on table public.ari_vnext_experiences is
  'Server-only Ari Experience Engine ledger. Stores compact encounter/prediction/outcome/learning records and never hidden chain-of-thought.';
