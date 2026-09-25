-- Server-only append-only Ari/SOL agent mailbox backed by Supabase Postgres.
-- Applied to production through Supabase migration 20260925062934.

create table if not exists public.ari_agent_mailbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version text not null default 'ari.agent.mailbox.v2',
  thread_id text not null,
  reply_to text,
  sender text not null,
  recipient text not null,
  kind text not null,
  subject text not null default '',
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  message_bytes integer not null,
  content_sha256 text not null,
  created_at timestamptz not null default now(),

  constraint ari_agent_mailbox_schema_version_chk
    check (schema_version = 'ari.agent.mailbox.v2'),
  constraint ari_agent_mailbox_thread_id_len_chk
    check (char_length(thread_id) between 1 and 120),
  constraint ari_agent_mailbox_reply_to_len_chk
    check (reply_to is null or char_length(reply_to) between 1 and 120),
  constraint ari_agent_mailbox_sender_chk
    check (sender ~ '^[a-z0-9][a-z0-9_-]{1,47}$'),
  constraint ari_agent_mailbox_recipient_chk
    check (recipient ~ '^[a-z0-9][a-z0-9_-]{1,47}$'),
  constraint ari_agent_mailbox_kind_chk
    check (kind in ('finding','question','answer','experiment_result','handoff','ack','status')),
  constraint ari_agent_mailbox_subject_len_chk
    check (char_length(subject) <= 240),
  constraint ari_agent_mailbox_message_bytes_chk
    check (message_bytes between 1 and 24000),
  constraint ari_agent_mailbox_sha256_chk
    check (content_sha256 ~ '^[0-9a-f]{64}$')
);

comment on table public.ari_agent_mailbox_messages is
  'Server-only append-only Ari/SOL agent mailbox. Stores bounded structured handoffs and experiment messages, never credentials or hidden chain-of-thought.';

create index if not exists ari_agent_mailbox_user_created_idx
  on public.ari_agent_mailbox_messages (user_id, created_at desc);

create index if not exists ari_agent_mailbox_recipient_idx
  on public.ari_agent_mailbox_messages (user_id, recipient, created_at desc);

create index if not exists ari_agent_mailbox_sender_idx
  on public.ari_agent_mailbox_messages (user_id, sender, created_at desc);

create index if not exists ari_agent_mailbox_thread_idx
  on public.ari_agent_mailbox_messages (user_id, thread_id, created_at asc);

create index if not exists ari_agent_mailbox_kind_idx
  on public.ari_agent_mailbox_messages (user_id, kind, created_at desc);

alter table public.ari_agent_mailbox_messages enable row level security;

revoke all on table public.ari_agent_mailbox_messages from public, anon, authenticated, service_role;
grant select, insert on table public.ari_agent_mailbox_messages to service_role;
