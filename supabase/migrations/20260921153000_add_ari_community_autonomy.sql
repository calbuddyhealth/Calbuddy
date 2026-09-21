create table if not exists public.ari_vnext_community_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  thread_id text not null,
  action text not null check (action in ('scan','learn','reply','skip')),
  thread_reply_count integer not null default 0 check (thread_reply_count >= 0),
  reply_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ari_vnext_community_interactions_user_created_idx
  on public.ari_vnext_community_interactions (user_id, created_at desc);

create index if not exists ari_vnext_community_interactions_thread_idx
  on public.ari_vnext_community_interactions (user_id, thread_id, created_at desc);

create unique index if not exists ari_vnext_community_interactions_reply_id_uidx
  on public.ari_vnext_community_interactions (reply_id)
  where reply_id is not null;

alter table public.ari_vnext_community_interactions enable row level security;

revoke all on public.ari_vnext_community_interactions from anon, authenticated;
grant select, insert on public.ari_vnext_community_interactions to service_role;
