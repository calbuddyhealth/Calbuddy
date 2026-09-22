-- Server-only Ari specialist/team performance learning.
-- Applied to the Ari Rebirth Supabase project as migration 20260922105631.

create table if not exists public.ari_vnext_agent_performance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_key text not null,
  role text not null,
  model text not null,
  domain text not null default 'general',
  trials integer not null default 0 check (trials >= 0),
  positive_trials integer not null default 0 check (positive_trials >= 0),
  negative_trials integer not null default 0 check (negative_trials >= 0),
  neutral_trials integer not null default 0 check (neutral_trials >= 0),
  decisive_contributions integer not null default 0 check (decisive_contributions >= 0),
  contradiction_catches integer not null default 0 check (contradiction_catches >= 0),
  mean_contribution numeric(5,4) not null default 0 check (mean_contribution between 0 and 1),
  mean_evidence_quality numeric(5,4) not null default 0 check (mean_evidence_quality between 0 and 1),
  mean_correction_value numeric(5,4) not null default 0 check (mean_correction_value between 0 and 1),
  mean_novelty numeric(5,4) not null default 0 check (mean_novelty between 0 and 1),
  mean_redundancy numeric(5,4) not null default 0 check (mean_redundancy between 0 and 1),
  mean_unsupported_risk numeric(5,4) not null default 0 check (mean_unsupported_risk between 0 and 1),
  reliability_score numeric(5,4) not null default 0 check (reliability_score between 0 and 1),
  last_score numeric(5,4) not null default 0 check (last_score between 0 and 1),
  last_verdict text not null default 'neutral' check (last_verdict in ('positive','neutral','negative')),
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_vnext_agent_performance_profiles_user_key_uidx unique (user_id, profile_key)
);

comment on table public.ari_vnext_agent_performance_profiles is
  'Server-only task-specific Ari specialist performance statistics. Stores compact outcome metrics by role/model/domain, never raw worker outputs or hidden chain-of-thought.';

create index if not exists ari_vnext_agent_performance_domain_idx
  on public.ari_vnext_agent_performance_profiles (user_id, domain, reliability_score desc, trials desc);

create table if not exists public.ari_vnext_team_performance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_key text not null,
  domain text not null default 'general',
  roles text[] not null default '{}'::text[],
  models text[] not null default '{}'::text[],
  worker_count integer not null default 0 check (worker_count between 0 and 5),
  trials integer not null default 0 check (trials >= 0),
  positive_trials integer not null default 0 check (positive_trials >= 0),
  negative_trials integer not null default 0 check (negative_trials >= 0),
  neutral_trials integer not null default 0 check (neutral_trials >= 0),
  mean_team_score numeric(5,4) not null default 0 check (mean_team_score between 0 and 1),
  mean_delegation_value numeric(5,4) not null default 0 check (mean_delegation_value between 0 and 1),
  mean_redundancy numeric(5,4) not null default 0 check (mean_redundancy between 0 and 1),
  mean_verifier_helpfulness numeric(5,4) not null default 0 check (mean_verifier_helpfulness between 0 and 1),
  reliability_score numeric(5,4) not null default 0 check (reliability_score between 0 and 1),
  last_score numeric(5,4) not null default 0 check (last_score between 0 and 1),
  last_verdict text not null default 'neutral' check (last_verdict in ('positive','neutral','negative')),
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_vnext_team_performance_profiles_user_key_uidx unique (user_id, team_key)
);

comment on table public.ari_vnext_team_performance_profiles is
  'Server-only Ari council team-composition performance statistics used for evidence-based worker-count and role selection.';

create index if not exists ari_vnext_team_performance_domain_idx
  on public.ari_vnext_team_performance_profiles (user_id, domain, reliability_score desc, trials desc);

create table if not exists public.ari_vnext_council_performance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null,
  domain text not null default 'general',
  team_key text not null,
  roles text[] not null default '{}'::text[],
  models text[] not null default '{}'::text[],
  worker_count integer not null default 0 check (worker_count between 0 and 5),
  team_score numeric(5,4) not null default 0 check (team_score between 0 and 1),
  delegation_value numeric(5,4) not null default 0 check (delegation_value between 0 and 1),
  redundancy numeric(5,4) not null default 0 check (redundancy between 0 and 1),
  verifier_helpfulness numeric(5,4) not null default 0 check (verifier_helpfulness between 0 and 1),
  verdict text not null default 'neutral' check (verdict in ('positive','neutral','negative')),
  evaluator_model text,
  contributions jsonb not null default '[]'::jsonb,
  outcome_status text not null default 'unresolved' check (outcome_status in ('unresolved','positive','neutral','negative','mixed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_vnext_council_performance_events_user_turn_uidx unique (user_id, turn_id)
);

comment on table public.ari_vnext_council_performance_events is
  'Server-only idempotent ledger of compact verified council contribution scores. Does not store prompts, raw specialist text, final answers, or hidden reasoning.';

create index if not exists ari_vnext_council_performance_events_user_time_idx
  on public.ari_vnext_council_performance_events (user_id, created_at desc);

create index if not exists ari_vnext_council_performance_events_domain_idx
  on public.ari_vnext_council_performance_events (user_id, domain, created_at desc);

alter table public.ari_vnext_agent_performance_profiles enable row level security;
alter table public.ari_vnext_team_performance_profiles enable row level security;
alter table public.ari_vnext_council_performance_events enable row level security;

revoke all on table public.ari_vnext_agent_performance_profiles from public, anon, authenticated;
revoke all on table public.ari_vnext_team_performance_profiles from public, anon, authenticated;
revoke all on table public.ari_vnext_council_performance_events from public, anon, authenticated;

grant select, insert, update, delete on table public.ari_vnext_agent_performance_profiles to service_role;
grant select, insert, update, delete on table public.ari_vnext_team_performance_profiles to service_role;
grant select, insert, update, delete on table public.ari_vnext_council_performance_events to service_role;
