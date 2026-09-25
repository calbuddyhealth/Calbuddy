-- Fix PL/pgSQL output-column ambiguity in the async agent queue claim RPC.
-- Applied to production through Supabase migration 20260925084329.

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

      select t.* into task_row
      from public.ari_vnext_agent_task_sessions t
      where t.id = parsed_task_id
        and t.user_id = parsed_user_id;

      select w.* into worker_row
      from public.ari_vnext_agent_task_workers w
      where w.task_id = parsed_task_id
        and w.worker_key = parsed_worker_key;

      if task_row.id is null
         or worker_row.id is null
         or task_row.status in ('completed','failed','abandoned')
         or worker_row.status in ('completed','failed','skipped')
         or worker_row.queue_message_id is distinct from queue_message.msg_id then
        perform pgmq.delete('ari_vnext_agent_jobs', queue_message.msg_id);
        continue;
      end if;

      update public.ari_vnext_agent_task_workers w
      set status = 'running',
          retry_count = greatest(w.retry_count, greatest(0, queue_message.read_ct - 1)),
          next_retry_at = null,
          last_error = null,
          error_code = null,
          started_at = coalesce(w.started_at, now()),
          updated_at = now()
      where w.id = worker_row.id;

      update public.ari_vnext_agent_task_sessions t
      set status = case when t.status in ('planning','waiting') then 'running' else t.status end,
          background_enabled = true,
          background_started_at = coalesce(t.background_started_at, now()),
          background_last_run_at = now(),
          updated_at = now()
      where t.id = task_row.id;

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
