begin;

alter table public.ari_conversation_turns
  add column if not exists turn_id text;

create unique index if not exists ari_conversation_turns_user_turn_uidx
  on public.ari_conversation_turns (user_id, turn_id)
  where turn_id is not null;

create table if not exists public.ari_request_dedup (
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_id text not null check (char_length(turn_id) between 1 and 200),
  status text not null default 'processing'
    check (status in ('processing', 'completed')),
  response_payload jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  primary key (user_id, turn_id)
);

create index if not exists ari_request_dedup_expiry_idx
  on public.ari_request_dedup (expires_at);

alter table public.ari_request_dedup enable row level security;

-- This is a server-only trust/cost ledger. Browser roles receive no table
-- privileges; Vercel accesses it with the service role after authenticating the
-- user and derives the user_id from that verified session.
revoke all on table public.ari_request_dedup from public, anon, authenticated;
grant select, insert, update, delete on table public.ari_request_dedup to service_role;

commit;
