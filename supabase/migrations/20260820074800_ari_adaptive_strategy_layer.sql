-- Ari Adaptive Strategy Layer — owner-first persistent reasoning strategy evolution.
-- Stores compact reusable strategy instructions and outcome counters only.
-- Never stores hidden chain-of-thought or raw model reasoning traces.

create table if not exists public.ari_vnext_adaptive_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_key text not null,
  title text not null,
  instruction text not null,
  rationale text not null default '',
  domains text[] not null default array['general']::text[],
  status text not null default 'testing'
    check (status in ('testing', 'adopted', 'retired')),
  confidence numeric(5,4) not null default 0.6500
    check (confidence >= 0 and confidence <= 1),
  trials integer not null default 0 check (trials >= 0),
  positive_outcomes integer not null default 0 check (positive_outcomes >= 0),
  negative_outcomes integer not null default 0 check (negative_outcomes >= 0),
  neutral_outcomes integer not null default 0 check (neutral_outcomes >= 0),
  source_model text,
  replaces_strategy_key text,
  user_visible_summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  first_proposed_at timestamptz not null default now(),
  last_used_at timestamptz,
  adopted_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, strategy_key)
);

create table if not exists public.ari_vnext_strategy_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_id uuid not null references public.ari_vnext_adaptive_strategies(id) on delete cascade,
  turn_id text not null,
  outcome text not null default 'pending'
    check (outcome in ('pending', 'positive', 'negative', 'neutral')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (user_id, strategy_id, turn_id)
);

create index if not exists ari_vnext_adaptive_strategies_user_status_idx
  on public.ari_vnext_adaptive_strategies (user_id, status, confidence desc, updated_at desc);

create index if not exists ari_vnext_strategy_uses_pending_idx
  on public.ari_vnext_strategy_uses (user_id, outcome, created_at desc);

alter table public.ari_vnext_adaptive_strategies enable row level security;
alter table public.ari_vnext_strategy_uses enable row level security;

revoke all on table public.ari_vnext_adaptive_strategies from public, anon, authenticated;
revoke all on table public.ari_vnext_strategy_uses from public, anon, authenticated;
grant all on table public.ari_vnext_adaptive_strategies to service_role;
grant all on table public.ari_vnext_strategy_uses to service_role;

comment on table public.ari_vnext_adaptive_strategies is
  'Server-only reusable Ari reasoning/communication strategy hypotheses. Stores compact strategy instructions and outcome statistics, never hidden chain-of-thought.';
comment on table public.ari_vnext_strategy_uses is
  'Server-only strategy usage/outcome ledger used to test, adopt, and retire Ari adaptive strategies.';
