-- Ari Practical Priors — mature proven adaptive strategies into default judgment.
-- Preserves lessons and evidence without storing hidden chain-of-thought or raw reasoning traces.

alter table public.ari_vnext_adaptive_strategies
  add column if not exists lesson_summary text not null default '',
  add column if not exists maturity_score numeric(5,4) not null default 0.0000
    check (maturity_score >= 0 and maturity_score <= 1),
  add column if not exists matured_at timestamptz;

alter table public.ari_vnext_adaptive_strategies
  drop constraint if exists ari_vnext_adaptive_strategies_status_check;

alter table public.ari_vnext_adaptive_strategies
  add constraint ari_vnext_adaptive_strategies_status_check
  check (status in ('testing', 'adopted', 'practical_prior', 'retired'));

alter table public.ari_vnext_strategy_uses
  add column if not exists context_domains text[] not null default array['conversation']::text[];

create index if not exists ari_vnext_adaptive_strategies_maturity_idx
  on public.ari_vnext_adaptive_strategies (user_id, status, maturity_score desc, confidence desc, updated_at desc);

comment on column public.ari_vnext_adaptive_strategies.lesson_summary is
  'Compact reusable causal lesson retained from experience; never raw hidden reasoning or transcript content.';
comment on column public.ari_vnext_adaptive_strategies.maturity_score is
  'Bounded evidence score used to decide when an adopted strategy is mature enough to act as a practical prior.';
comment on column public.ari_vnext_adaptive_strategies.matured_at is
  'When repeated evidence promoted the strategy into a practical prior.';
comment on column public.ari_vnext_strategy_uses.context_domains is
  'Bounded route-domain context for measuring whether a strategy generalizes beyond a single narrow situation.';
