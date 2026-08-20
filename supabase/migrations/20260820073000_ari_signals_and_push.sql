-- ARI Signals: server-owned preferences and native push device registration.
-- Initiative events remain the canonical signal/event record. These tables only
-- control how Ari may reach a user and which native devices are eligible.

create table if not exists public.ari_signal_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  quiet_hours_enabled boolean not null default true,
  quiet_start time without time zone not null default '22:00',
  quiet_end time without time zone not null default '07:00',
  timezone text not null default 'America/Los_Angeles',
  push_categories text[] not null default array['insight','question','experiment_result','change','approval']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ari_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  token text not null,
  app_id text not null default 'com.arixp.app',
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ari_push_devices_platform_check check (platform in ('ios')),
  constraint ari_push_devices_user_token_unique unique (user_id, token)
);

create index if not exists ari_push_devices_user_enabled_idx
  on public.ari_push_devices (user_id, enabled, updated_at desc);

alter table public.ari_signal_preferences enable row level security;
alter table public.ari_push_devices enable row level security;

revoke all on table public.ari_signal_preferences from public, anon, authenticated;
revoke all on table public.ari_push_devices from public, anon, authenticated;
grant all on table public.ari_signal_preferences to service_role;
grant all on table public.ari_push_devices to service_role;
