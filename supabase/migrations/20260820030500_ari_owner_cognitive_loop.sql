create table if not exists public.ari_vnext_cognitive_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_version text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ari_vnext_cognitive_states enable row level security;

-- Defense in depth: this table is never a client-facing API surface. Existing
-- Supabase projects may inherit grants for PUBLIC/anon/authenticated, so revoke
-- them explicitly and allow only the server-side service role.
revoke all on table public.ari_vnext_cognitive_states from public, anon, authenticated;
grant all on table public.ari_vnext_cognitive_states to service_role;

comment on table public.ari_vnext_cognitive_states is
  'Server-only persistent working state for the owner Advanced Ari cognitive-loop experiment. It stores functional continuity, not hidden chain-of-thought.';
comment on column public.ari_vnext_cognitive_states.state is
  'Compact functional state: attention, salience, value signals, epistemic status, continuity, and unresolved loops. Never raw hidden reasoning.';
