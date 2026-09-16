-- Ari Blind Reasoning Arena — server-only pairwise benchmark evidence.
-- Stores compact judgments, score summaries, and content hashes only.
-- Raw prompts, candidate answers, and hidden reasoning traces are never stored here.

create table if not exists public.ari_vnext_reasoning_arena_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null,
  arena_version text not null default '1.0.0',
  domains text[] not null default array['general']::text[],
  ari_model text,
  challenger_model text not null,
  judge_model text not null,
  winner text not null check (winner in ('ari', 'challenger', 'tie', 'invalid')),
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_weight numeric(6,4) not null default 0 check (evidence_weight >= 0 and evidence_weight <= 2),
  judge_independent boolean not null default false,
  ari_blind_label text check (ari_blind_label in ('A', 'B')),
  challenger_blind_label text check (challenger_blind_label in ('A', 'B')),
  scores jsonb not null default '{}'::jsonb,
  decisive_reasons jsonb not null default '[]'::jsonb,
  uncertainty text,
  problem_hash text,
  ari_answer_hash text,
  challenger_answer_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, turn_id, challenger_model)
);

create index if not exists ari_vnext_reasoning_arena_user_created_idx
  on public.ari_vnext_reasoning_arena_results (user_id, created_at desc);

create index if not exists ari_vnext_reasoning_arena_user_challenger_idx
  on public.ari_vnext_reasoning_arena_results (user_id, challenger_model, winner, created_at desc);

alter table public.ari_vnext_reasoning_arena_results enable row level security;
revoke all on table public.ari_vnext_reasoning_arena_results from public, anon, authenticated;
grant all on table public.ari_vnext_reasoning_arena_results to service_role;

comment on table public.ari_vnext_reasoning_arena_results is
  'Server-only blind Ari-vs-challenger benchmark evidence. Stores compact evaluator outcomes and hashes, never raw candidate answers or hidden chain-of-thought.';
