-- ARI vNext asynchronous multi-agent worker fabric.
-- Applied to production through Supabase migration 20260925084128.
-- PGMQ provides durable delivery + visibility timeouts. The task/worker ledgers
-- remain the audit source of truth. All queue RPCs are service-role only.

begin;

create extension if not exists pgmq;

do $$
begin
  if not exists (
    select 1
    from pgmq.list_queues()
    where queue_name = 'ari_vnext_agent_jobs'
  ) then
    perform pgmq.create('ari_vnext_agent_jobs');
  end if;
end;
$$;

alter table public.ari_vnext_agent_task_sessions
  add column if not exists background_enabled boolean not null default false,
  add column if not exists background_started_at timestamptz,
  add column if not exists background_last_run_at timestamptz;

alter table public.ari_vnext_agent_task_workers
  add column if not exists job_type text not null default 'specialist',
  add column if not exists tool_scope text not null default 'analysis',
  add column if not exists queue_message_id bigint,
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_error text,
  add column if not exists queued_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ari_vnext_agent_task_workers_job_type_chk'
      and conrelid = 'public.ari_vnext_agent_task_workers'::regclass
  ) then
    alter table public.ari_vnext_agent_task_workers
      add constraint ari_vnext_agent_task_workers_job_type_chk
      check (job_type in ('specialist','resolver','verifier'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ari_vnext_agent_task_workers_tool_scope_chk'
      and conrelid = 'public.ari_vnext_agent_task_workers'::regclass
  ) then
    alter table public.ari_vnext_agent_task_workers
      add constraint ari_vnext_agent_task_workers_tool_scope_chk
      check (tool_scope in ('analysis','web','developer_read'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ari_vnext_agent_task_workers_retry_count_chk'
      and conrelid = 'public.ari_vnext_agent_task_workers'::regclass
  ) then
    alter table public.ari_vnext_agent_task_workers
      add constraint ari_vnext_agent_task_workers_retry_count_chk
      check (retry_count between 0 and 20);
  end if;
end;
$$;

create index if not exists ari_vnext_agent_task_workers_queue_idx
  on public.ari_vnext_agent_task_workers(task_id, round, job_type, status, updated_at);

alter table public.ari_agent_mailbox_messages
  add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ari_agent_mailbox_messages_idempotency_len_chk'
      and conrelid = 'public.ari_agent_mailbox_messages'::regclass
  ) then
    alter table public.ari_agent_mailbox_messages
      add constraint ari_agent_mailbox_messages_idempotency_len_chk
      check (idempotency_key is null or char_length(idempotency_key) between 1 and 180);
  end if;
end;
$$;

create unique index if not exists ari_agent_mailbox_user_idempotency_uidx
  on public.ari_agent_mailbox_messages(user_id, idempotency_key);

create or replace function public.ari_vnext_agent_job_enqueue(
  requested_user_id uuid,
  requested_task_id uuid,
  requested_worker_key text,
  requested_job_type text,
  requested_role text,
  requested_objective text,
  requested_round integer default 1,
  requested_followup boolean default false,
  requested_tool_scope text default 'analysis',
  requested_input jsonb default '{}'::jsonb,
  requested_max_attempts integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  task_row public.ari_vnext_agent_task_sessions%rowtype;
  worker_row public.ari_vnext_agent_task_workers%rowtype;
  clean_worker_key text := left(lower(btrim(coalesce(requested_worker_key, ''))), 80);
  clean_job_type text := lower(btrim(coalesce(requested_job_type, 'specialist')));
  clean_role text := left(btrim(coalesce(requested_role, 'specialist')), 120);
  clean_objective text := left(btrim(coalesce(requested_objective, 'Analyze the assigned task.')), 1600);
  clean_tool_scope text := lower(btrim(coalesce(requested_tool_scope, 'analysis')));
  clean_round integer := greatest(0, least(coalesce(requested_round, 1), 4));
  max_attempts integer := greatest(1, least(coalesce(requested_max_attempts, 3), 6));
  queued_message_id bigint := null;
begin
  if requested_user_id is null or requested_task_id is null then
    raise exception 'Agent queue identity is required';
  end if;
  if clean_worker_key !~ '^[a-z0-9][a-z0-9_-]{1,79}$' then
    raise exception 'Invalid worker key';
  end if;
  if clean_job_type not in ('specialist','resolver','verifier') then
    raise exception 'Invalid agent job type';
  end if;
  if clean_tool_scope not in ('analysis','web','developer_read') then
    raise exception 'Invalid agent tool scope';
  end if;
  if octet_length(coalesce(requested_input, '{}'::jsonb)::text) > 16000 then
    raise exception 'Agent job input is too large';
  end if;

  select * into task_row
  from public.ari_vnext_agent_task_sessions
  where id = requested_task_id
    and user_id = requested_user_id
  for update;

  if not found then
    raise exception 'Agent task not found';
  end if;
  if task_row.status in ('completed','failed','abandoned') then
    return jsonb_build_object(
      'queued', false,
      'reason', 'task_closed',
      'task_id', requested_task_id,
      'worker_key', clean_worker_key
    );
  end if;

  select * into worker_row
  from public.ari_vnext_agent_task_workers
  where task_id = requested_task_id
    and worker_key = clean_worker_key
  for update;

  if found and worker_row.status = 'completed' then
    return jsonb_build_object(
      'queued', false,
      'reason', 'already_completed',
      'task_id', requested_task_id,
      'worker_key', clean_worker_key,
      'mailbox_message_id', worker_row.mailbox_message_id
    );
  end if;

  if found
     and worker_row.status in ('planned','running')
     and worker_row.queue_message_id is not null then
    return jsonb_build_object(
      'queued', true,
      'reason', 'already_queued',
      'task_id', requested_task_id,
      'worker_key', clean_worker_key,
      'queue_message_id', worker_row.queue_message_id
    );
  end if;

  insert into public.ari_vnext_agent_task_workers(
    user_id,
    task_id,
    worker_key,
    role,
    objective,
    round,
    followup,
    status,
    job_type,
    tool_scope,
    queue_message_id,
    retry_count,
    next_retry_at,
    last_error,
    queued_at,
    updated_at
  )
  values(
    requested_user_id,
    requested_task_id,
    clean_worker_key,
    clean_role,
    clean_objective,
    clean_round,
    coalesce(requested_followup, false),
    'planned',
    clean_job_type,
    clean_tool_scope,
    null,
    0,
    null,
    null,
    now(),
    now()
  )
  on conflict(task_id, worker_key)
  do update set
    role = excluded.role,
    objective = excluded.objective,
    round = excluded.round,
    followup = excluded.followup,
    status = 'planned',
    job_type = excluded.job_type,
    tool_scope = excluded.tool_scope,
    queue_message_id = null,
    next_retry_at = null,
    last_error = null,
    queued_at = now(),
    completed_at = null,
    updated_at = now();

  select q into queued_message_id
  from pgmq.send(
    'ari_vnext_agent_jobs',
    jsonb_build_object(
      'user_id', requested_user_id,
      'task_id', requested_task_id,
      'worker_key', clean_worker_key,
      'job_type', clean_job_type,
      'role', clean_role,
      'objective', clean_objective,
      'round', clean_round,
      'followup', coalesce(requested_followup, false),
      'tool_scope', clean_tool_scope,
      'max_attempts', max_attempts,
      'input', coalesce(requested_input, '{}'::jsonb)
    )
  ) as q
  limit 1;

  update public.ari_vnext_agent_task_workers
  set queue_message_id = queued_message_id,
      queued_at = now(),
      updated_at = now()
  where task_id = requested_task_id
    and worker_key = clean_worker_key;

  update public.ari_vnext_agent_task_sessions
  set status = case when status = 'planning' then 'running' else status end,
      background_enabled = true,
      background_started_at = coalesce(background_started_at, now()),
      updated_at = now()
  where id = requested_task_id
    and user_id = requested_user_id;

  return jsonb_build_object(
    'queued', true,
    'reason', 'queued',
    'task_id', requested_task_id,
    'worker_key', clean_worker_key,
    'queue_message_id', queued_message_id
  );
end;
$$;

revoke all on function public.ari_vnext_agent_job_enqueue(uuid,uuid,text,text,text,text,integer,boolean,text,jsonb,integer)
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_enqueue(uuid,uuid,text,text,text,text,integer,boolean,text,jsonb,integer)
  to service_role;

create or replace function public.ari_vnext_agent_job_claim(
  requested_limit integer default 2,
  requested_visibility_seconds integer default 300
)
returns table(
  msg_id bigint,
  read_ct integer,
  user_id uuid,
  task_id uuid,
  execution_session_id text,
  worker_key text,
  job_type text,
  role text,
  objective text,
  round integer,
  followup boolean,
  tool_scope text,
  max_attempts integer,
  input jsonb,
  task_goal text,
  success_criteria text,
  task_plan jsonb,
  task_verification jsonb,
  task_round_count integer,
  task_max_rounds integer
)
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  queue_message record;
  task_row public.ari_vnext_agent_task_sessions%rowtype;
  worker_row public.ari_vnext_agent_task_workers%rowtype;
  parsed_user_id uuid;
  parsed_task_id uuid;
  parsed_worker_key text;
  take_count integer := greatest(1, least(coalesce(requested_limit, 2), 6));
  visibility_seconds integer := greatest(60, least(coalesce(requested_visibility_seconds, 300), 900));
begin
  for queue_message in
    select *
    from pgmq.read('ari_vnext_agent_jobs', visibility_seconds, take_count)
  loop
    begin
      parsed_user_id := nullif(queue_message.message->>'user_id', '')::uuid;
      parsed_task_id := nullif(queue_message.message->>'task_id', '')::uuid;
      parsed_worker_key := left(lower(btrim(coalesce(queue_message.message->>'worker_key', ''))), 80);

      select * into task_row
      from public.ari_vnext_agent_task_sessions
      where id = parsed_task_id
        and user_id = parsed_user_id;

      select * into worker_row
      from public.ari_vnext_agent_task_workers
      where task_id = parsed_task_id
        and worker_key = parsed_worker_key;

      if task_row.id is null
         or worker_row.id is null
         or task_row.status in ('completed','failed','abandoned')
         or worker_row.status in ('completed','failed','skipped')
         or worker_row.queue_message_id is distinct from queue_message.msg_id then
        perform pgmq.delete('ari_vnext_agent_jobs', queue_message.msg_id);
        continue;
      end if;

      update public.ari_vnext_agent_task_workers
      set status = 'running',
          retry_count = greatest(retry_count, greatest(0, queue_message.read_ct - 1)),
          next_retry_at = null,
          last_error = null,
          error_code = null,
          started_at = coalesce(started_at, now()),
          updated_at = now()
      where id = worker_row.id;

      update public.ari_vnext_agent_task_sessions
      set status = case when status in ('planning','waiting') then 'running' else status end,
          background_enabled = true,
          background_started_at = coalesce(background_started_at, now()),
          background_last_run_at = now(),
          updated_at = now()
      where id = task_row.id;

      msg_id := queue_message.msg_id;
      read_ct := queue_message.read_ct;
      user_id := parsed_user_id;
      task_id := parsed_task_id;
      execution_session_id := task_row.execution_session_id;
      worker_key := parsed_worker_key;
      job_type := lower(btrim(coalesce(queue_message.message->>'job_type', worker_row.job_type)));
      role := left(btrim(coalesce(queue_message.message->>'role', worker_row.role)), 120);
      objective := left(btrim(coalesce(queue_message.message->>'objective', worker_row.objective)), 1600);
      round := greatest(0, least(coalesce(nullif(queue_message.message->>'round','')::integer, worker_row.round), 4));
      followup := coalesce((queue_message.message->>'followup')::boolean, worker_row.followup);
      tool_scope := lower(btrim(coalesce(queue_message.message->>'tool_scope', worker_row.tool_scope)));
      max_attempts := greatest(1, least(coalesce(nullif(queue_message.message->>'max_attempts','')::integer, 3), 6));
      input := coalesce(queue_message.message->'input', '{}'::jsonb);
      task_goal := task_row.goal;
      success_criteria := task_row.success_criteria;
      task_plan := task_row.plan;
      task_verification := task_row.verification;
      task_round_count := task_row.round_count;
      task_max_rounds := task_row.max_rounds;
      return next;
    exception
      when others then
        perform pgmq.archive('ari_vnext_agent_jobs', queue_message.msg_id);
    end;
  end loop;
end;
$$;

revoke all on function public.ari_vnext_agent_job_claim(integer,integer)
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_claim(integer,integer)
  to service_role;

create or replace function public.ari_vnext_agent_job_complete(
  requested_msg_id bigint,
  requested_task_id uuid,
  requested_worker_key text,
  requested_mailbox_message_id uuid default null,
  requested_provider_model text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  affected integer := 0;
begin
  update public.ari_vnext_agent_task_workers
  set status = 'completed',
      mailbox_message_id = requested_mailbox_message_id,
      provider_model = nullif(left(btrim(coalesce(requested_provider_model, '')), 160), ''),
      next_retry_at = null,
      last_error = null,
      error_code = null,
      completed_at = now(),
      updated_at = now()
  where task_id = requested_task_id
    and worker_key = left(lower(btrim(coalesce(requested_worker_key, ''))), 80)
    and queue_message_id = requested_msg_id;

  get diagnostics affected = row_count;
  perform pgmq.delete('ari_vnext_agent_jobs', requested_msg_id);

  update public.ari_vnext_agent_task_sessions
  set background_last_run_at = now(),
      updated_at = now()
  where id = requested_task_id;

  return jsonb_build_object(
    'completed', affected = 1,
    'task_id', requested_task_id,
    'worker_key', requested_worker_key
  );
end;
$$;

revoke all on function public.ari_vnext_agent_job_complete(bigint,uuid,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_complete(bigint,uuid,text,uuid,text)
  to service_role;

create or replace function public.ari_vnext_agent_job_retry(
  requested_msg_id bigint,
  requested_task_id uuid,
  requested_worker_key text,
  requested_delay_seconds integer,
  requested_error text,
  requested_error_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  delay_seconds integer := greatest(15, least(coalesce(requested_delay_seconds, 60), 3600));
  affected integer := 0;
begin
  update public.ari_vnext_agent_task_workers
  set status = 'planned',
      retry_count = retry_count + 1,
      next_retry_at = now() + make_interval(secs => delay_seconds),
      last_error = left(btrim(coalesce(requested_error, 'worker_failed')), 1000),
      error_code = nullif(left(btrim(coalesce(requested_error_code, '')), 240), ''),
      updated_at = now()
  where task_id = requested_task_id
    and worker_key = left(lower(btrim(coalesce(requested_worker_key, ''))), 80)
    and queue_message_id = requested_msg_id;

  get diagnostics affected = row_count;
  perform pgmq.set_vt('ari_vnext_agent_jobs', requested_msg_id, delay_seconds);

  return jsonb_build_object(
    'retried', affected = 1,
    'task_id', requested_task_id,
    'worker_key', requested_worker_key,
    'retry_in_seconds', delay_seconds
  );
end;
$$;

revoke all on function public.ari_vnext_agent_job_retry(bigint,uuid,text,integer,text,text)
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_retry(bigint,uuid,text,integer,text,text)
  to service_role;

create or replace function public.ari_vnext_agent_job_deadletter(
  requested_msg_id bigint,
  requested_task_id uuid,
  requested_worker_key text,
  requested_error text,
  requested_error_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
declare
  affected integer := 0;
  archived boolean := false;
begin
  update public.ari_vnext_agent_task_workers
  set status = 'failed',
      last_error = left(btrim(coalesce(requested_error, 'worker_failed')), 1000),
      error_code = nullif(left(btrim(coalesce(requested_error_code, '')), 240), ''),
      next_retry_at = null,
      completed_at = now(),
      updated_at = now()
  where task_id = requested_task_id
    and worker_key = left(lower(btrim(coalesce(requested_worker_key, ''))), 80)
    and queue_message_id = requested_msg_id;

  get diagnostics affected = row_count;
  select pgmq.archive('ari_vnext_agent_jobs', requested_msg_id) into archived;

  update public.ari_vnext_agent_task_sessions
  set background_last_run_at = now(),
      updated_at = now()
  where id = requested_task_id;

  return jsonb_build_object(
    'deadlettered', affected = 1,
    'archived', archived,
    'task_id', requested_task_id,
    'worker_key', requested_worker_key
  );
end;
$$;

revoke all on function public.ari_vnext_agent_job_deadletter(bigint,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_deadletter(bigint,uuid,text,text,text)
  to service_role;

create or replace function public.ari_vnext_agent_job_metrics()
returns jsonb
language sql
stable
security definer
set search_path = 'public', 'pgmq', 'pg_temp'
as $$
  select jsonb_build_object(
    'queue', to_jsonb(m),
    'open_tasks', (
      select count(*)
      from public.ari_vnext_agent_task_sessions
      where background_enabled = true
        and status in ('planning','running','verifying','waiting')
    ),
    'running_workers', (
      select count(*)
      from public.ari_vnext_agent_task_workers
      where status = 'running'
    ),
    'failed_workers', (
      select count(*)
      from public.ari_vnext_agent_task_workers
      where status = 'failed'
    )
  )
  from pgmq.metrics('ari_vnext_agent_jobs') m;
$$;

revoke all on function public.ari_vnext_agent_job_metrics()
  from public, anon, authenticated;
grant execute on function public.ari_vnext_agent_job_metrics()
  to service_role;

commit;
