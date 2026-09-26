begin;

create table if not exists public.ari_chatgpt_browser_threads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  status text not null default 'pending'
    check (status in ('pending','active','paused','ended','failed')),
  chatgpt_conversation_url text,
  turn_count integer not null default 0 check (turn_count >= 0 and turn_count <= 12),
  last_error text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ari_chatgpt_browser_threads_owner_updated_idx
  on public.ari_chatgpt_browser_threads (owner_user_id, updated_at desc);

create table if not exists public.ari_chatgpt_browser_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.ari_chatgpt_browser_threads(id) on delete cascade,
  operation text not null check (operation in ('start','continue')),
  message text not null check (char_length(message) between 2 and 8000),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed')),
  response_text text,
  chatgpt_conversation_url text,
  worker_id text,
  lease_token uuid,
  lease_expires_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 10),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists ari_chatgpt_browser_jobs_queue_idx
  on public.ari_chatgpt_browser_jobs (owner_user_id, status, created_at asc);

create index if not exists ari_chatgpt_browser_jobs_thread_idx
  on public.ari_chatgpt_browser_jobs (thread_id, created_at asc);

create table if not exists public.ari_chatgpt_browser_workers (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  worker_id text not null,
  version text not null default '',
  session_state text not null default 'unknown'
    check (session_state in ('authenticated','login_required','unknown')),
  status text not null default 'offline',
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_user_id, worker_id)
);

alter table public.ari_chatgpt_browser_threads enable row level security;
alter table public.ari_chatgpt_browser_jobs enable row level security;
alter table public.ari_chatgpt_browser_workers enable row level security;

revoke all on table public.ari_chatgpt_browser_threads from public, anon, authenticated;
revoke all on table public.ari_chatgpt_browser_jobs from public, anon, authenticated;
revoke all on table public.ari_chatgpt_browser_workers from public, anon, authenticated;

grant select, insert, update, delete on table public.ari_chatgpt_browser_threads to service_role;
grant select, insert, update, delete on table public.ari_chatgpt_browser_jobs to service_role;
grant select, insert, update, delete on table public.ari_chatgpt_browser_workers to service_role;

comment on table public.ari_chatgpt_browser_threads is
  'Server-only owner ChatGPT discussion metadata. No ChatGPT credentials or cookies are stored here.';
comment on table public.ari_chatgpt_browser_jobs is
  'Server-only bounded text discussion queue for the owner browser worker.';
comment on table public.ari_chatgpt_browser_workers is
  'Server-only heartbeat/status for owner-controlled ChatGPT browser workers.';

commit;
