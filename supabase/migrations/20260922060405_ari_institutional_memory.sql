-- Server-only durable Ari institutional memory for verified multi-agent lessons.
-- Applied to production through Supabase migration 20260922060405.

create table if not exists public.ari_vnext_institutional_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null,
  domain text not null default 'general',
  title text not null,
  summary text not null,
  lesson text not null,
  tags text[] not null default '{}'::text[],
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  novelty numeric(5,4) not null default 0 check (novelty >= 0 and novelty <= 1),
  reusability numeric(5,4) not null default 0 check (reusability >= 0 and reusability <= 1),
  usefulness numeric(5,4) not null default 0 check (usefulness >= 0 and usefulness <= 1),
  retrieval_priority numeric(5,4) not null default 0 check (retrieval_priority >= 0 and retrieval_priority <= 1),
  evidence_basis text,
  source_turn_id text,
  source_model text,
  retrieval_count integer not null default 0 check (retrieval_count >= 0),
  reinforcement_count integer not null default 0 check (reinforcement_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  active boolean not null default true,
  needs_review boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  last_retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_vnext_institutional_memory_user_lesson_uidx unique (user_id, lesson_key),
  constraint ari_vnext_institutional_memory_lesson_key_len check (char_length(lesson_key) between 8 and 120),
  constraint ari_vnext_institutional_memory_title_len check (char_length(title) between 3 and 220),
  constraint ari_vnext_institutional_memory_summary_len check (char_length(summary) between 3 and 700),
  constraint ari_vnext_institutional_memory_lesson_len check (char_length(lesson) between 3 and 1200)
);

comment on table public.ari_vnext_institutional_memory is
  'Server-only durable Ari institutional lessons distilled from verified multi-agent councils. Stores compact reusable lessons and outcome counters, never raw council transcripts or hidden chain-of-thought.';

create index if not exists ari_vnext_institutional_memory_retrieval_idx
  on public.ari_vnext_institutional_memory (user_id, active, needs_review, retrieval_priority desc, updated_at desc);

create index if not exists ari_vnext_institutional_memory_domain_idx
  on public.ari_vnext_institutional_memory (user_id, domain, active, retrieval_priority desc);

alter table public.ari_vnext_institutional_memory enable row level security;

revoke all on table public.ari_vnext_institutional_memory from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_vnext_institutional_memory to service_role;
