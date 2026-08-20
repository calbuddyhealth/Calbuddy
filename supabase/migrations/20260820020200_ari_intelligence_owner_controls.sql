create table if not exists public.ari_intelligence_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  advanced_enabled boolean not null default false,
  reasoning_profile text not null default 'adaptive' check (reasoning_profile in ('adaptive','economy','balanced','deep')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ari_intelligence_controls enable row level security;

revoke all on table public.ari_intelligence_controls from anon, authenticated;
grant all on table public.ari_intelligence_controls to service_role;

comment on table public.ari_intelligence_controls is
  'Server-only ARI intelligence tier controls. Owner beta now; premium entitlement can reuse the same resolver later.';
comment on column public.ari_intelligence_controls.advanced_enabled is
  'User opt-in request. Server entitlement still decides whether advanced access is allowed.';
comment on column public.ari_intelligence_controls.reasoning_profile is
  'Owner/premium reasoning preference: adaptive, economy, balanced, or deep.';
