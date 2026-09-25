import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  claimAgentJobs,
  completeAgentJob,
  enqueueAgentJob,
  retryAgentJob,
  retryDelaySeconds
} from "../api/_lib/ari-vnext/agent-queue.js";
import {
  publicAgentTaskSession
} from "../api/_lib/ari-vnext/agent-task-store.js";
import agentWorkerHandler from "../api/ari-agent-worker.js";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const TASK_ID = "11111111-1111-4111-8111-111111111111";
const MAILBOX_ID = "33333333-3333-4333-8333-333333333333";

function configureQueue() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_async_test";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    headers: { get: () => null },
    json: async () => data
  };
}

function mockRes() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    }
  };
}

test("async worker migration uses PGMQ visibility, retry, archive, and service-role-only RPCs", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260925084128_ari_async_agent_worker_fabric.sql", import.meta.url),
    "utf8"
  );

  assert.match(sql, /pgmq\.create\('ari_vnext_agent_jobs'\)/i);
  assert.match(sql, /pgmq\.read\('ari_vnext_agent_jobs',\s*visibility_seconds,\s*take_count\)/i);
  assert.match(sql, /pgmq\.set_vt\('ari_vnext_agent_jobs'/i);
  assert.match(sql, /pgmq\.archive\('ari_vnext_agent_jobs'/i);
  assert.match(sql, /idempotency_key text/i);
  assert.match(sql, /unique index[\s\S]*ari_agent_mailbox_user_idempotency_uidx/i);

  for (const fn of [
    "ari_vnext_agent_job_enqueue",
    "ari_vnext_agent_job_claim",
    "ari_vnext_agent_job_complete",
    "ari_vnext_agent_job_retry",
    "ari_vnext_agent_job_deadletter",
    "ari_vnext_agent_job_metrics"
  ]) {
    assert.match(
      sql,
      new RegExp(`revoke all on function public\\.${fn}\\([\\s\\S]*?from public, anon, authenticated`, "i"),
      fn
    );
    assert.match(
      sql,
      new RegExp(`grant execute on function public\\.${fn}\\([\\s\\S]*?to service_role`, "i"),
      fn
    );
  }
});

test("agent queue client uses modern server key and normalizes claimed jobs", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    configureQueue();
    const calls = [];
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith("/rpc/ari_vnext_agent_job_enqueue")) {
        return response(200, {
          queued: true,
          reason: "queued",
          task_id: TASK_ID,
          worker_key: "agent_1",
          queue_message_id: 42
        });
      }
      if (String(url).endsWith("/rpc/ari_vnext_agent_job_claim")) {
        return response(200, [{
          msg_id: 42,
          read_ct: 2,
          user_id: USER_ID,
          task_id: TASK_ID,
          execution_session_id: "exec-async-1",
          worker_key: "agent_1",
          job_type: "specialist",
          role: "implementation_analyst",
          objective: "Inspect the repository.",
          round: 1,
          followup: false,
          tool_scope: "developer_read",
          max_attempts: 3,
          input: { request: "Investigate this." },
          task_goal: "Fix the architecture.",
          success_criteria: "Evidence-backed result.",
          task_plan: { background: true },
          task_verification: {},
          task_round_count: 1,
          task_max_rounds: 2
        }]);
      }
      if (String(url).endsWith("/rpc/ari_vnext_agent_job_retry")) {
        return response(200, { retried: true, retry_in_seconds: 60 });
      }
      if (String(url).endsWith("/rpc/ari_vnext_agent_job_complete")) {
        return response(200, { completed: true });
      }
      return response(404, { message: "unexpected" });
    };

    const queued = await enqueueAgentJob({
      userId: USER_ID,
      taskId: TASK_ID,
      workerKey: "agent_1",
      jobType: "specialist",
      role: "implementation_analyst",
      objective: "Inspect the repository.",
      round: 1,
      toolScope: "developer_read",
      input: { request: "Investigate this." }
    });
    assert.equal(queued.queued, true);

    const jobs = await claimAgentJobs({ limit: 2, visibilitySeconds: 300 });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].msgId, 42);
    assert.equal(jobs[0].readCount, 2);
    assert.equal(jobs[0].toolScope, "developer_read");
    assert.equal(jobs[0].taskGoal, "Fix the architecture.");

    await retryAgentJob({
      msgId: 42,
      taskId: TASK_ID,
      workerKey: "agent_1",
      delaySeconds: 60,
      error: "temporary"
    });
    await completeAgentJob({
      msgId: 42,
      taskId: TASK_ID,
      workerKey: "agent_1",
      mailboxMessageId: MAILBOX_ID,
      providerModel: "gpt-5.6"
    });

    assert.equal(calls.length, 4);
    for (const call of calls) {
      assert.equal(call.options.headers.apikey, "sb_secret_async_test");
      assert.equal(Object.hasOwn(call.options.headers, "Authorization"), false);
    }
    assert.equal(retryDelaySeconds({ readCount: 1 }, { status: 500 }), 30);
    assert.equal(retryDelaySeconds({ readCount: 2 }, { status: 429 }), 120);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
});

test("background task diagnostics expose queue state without worker transcripts", () => {
  const value = publicAgentTaskSession({
    id: TASK_ID,
    userId: USER_ID,
    executionSessionId: "exec-async-1",
    status: "running",
    goal: "Fix the architecture.",
    successCriteria: "Evidence-backed result.",
    plan: { background: true },
    verification: {},
    roundCount: 1,
    maxRounds: 2,
    backgroundEnabled: true,
    backgroundStartedAt: "2026-09-25T09:00:00.000Z",
    backgroundLastRunAt: null,
    updatedAt: "2026-09-25T09:00:00.000Z"
  }, [
    {
      id: "22222222-2222-4222-8222-222222222222",
      taskId: TASK_ID,
      workerKey: "agent_1",
      role: "implementation_analyst",
      objective: "Inspect the repository.",
      status: "planned",
      jobType: "specialist",
      toolScope: "developer_read",
      queueMessageId: 42
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      taskId: TASK_ID,
      workerKey: "agent_2",
      role: "critic",
      objective: "Challenge the finding.",
      status: "running",
      jobType: "specialist",
      toolScope: "developer_read",
      queueMessageId: 43
    }
  ]);

  assert.equal(value.backgroundEnabled, true);
  assert.equal(value.queuedWorkers, 1);
  assert.equal(value.runningWorkers, 1);
  assert.equal(value.rawWorkerTextStoredInTaskLedger, false);
  assert.equal(Object.hasOwn(value, "content"), false);
});

test("background specialists expose read-only evidence tools and no mutation tools", async () => {
  const source = await readFile(
    new URL("../api/_lib/ari-vnext/background-specialist.js", import.meta.url),
    "utf8"
  );

  for (const tool of [
    "worker_repo_search",
    "worker_repo_read",
    "worker_repo_ci_status",
    "worker_memory_search"
  ]) {
    assert.match(source, new RegExp(tool));
  }

  assert.doesNotMatch(source, /propose_owner_github_edit/);
  assert.doesNotMatch(source, /owner_agent_mailbox_send/);
  assert.doesNotMatch(source, /execute_pending_action/);
  assert.match(source, /No external tool use is authorized|read-only/i);
  assert.match(source, /MAX_TOOL_STEPS = 5/);
});

test("developer councils enqueue background jobs while ordinary council path remains available", async () => {
  const source = await readFile(
    new URL("../api/_lib/ari-vnext/multi-agent-orchestrator.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /shouldQueueBackgroundCouncil/);
  assert.match(source, /route\?\.developer === true/);
  assert.match(source, /enqueueAgentJob\(/);
  assert.match(source, /toolScope: "developer_read"/);
  assert.match(source, /backgroundExecution: true/);
  assert.match(source, /const firstWave = await Promise\.all/);
});

test("background worker endpoint requires CRON_SECRET and can safely drain an empty queue", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    configureQueue();
    process.env.CRON_SECRET = "cron-test-secret";
    process.env.ARI_DURABLE_AGENT_ASYNC_ENABLED = "true";

    const unauthorized = mockRes();
    await agentWorkerHandler(
      { method: "GET", headers: { authorization: "Bearer wrong" } },
      unauthorized
    );
    assert.equal(unauthorized.statusCode, 401);
    assert.equal(unauthorized.payload.code, "ARI_AGENT_WORKER_UNAUTHORIZED");

    globalThis.fetch = async (url) => {
      if (String(url).endsWith("/rpc/ari_vnext_agent_job_claim")) {
        return response(200, []);
      }
      return response(404, { message: "unexpected" });
    };

    const authorized = mockRes();
    await agentWorkerHandler(
      { method: "GET", headers: { authorization: "Bearer cron-test-secret" } },
      authorized
    );
    assert.equal(authorized.statusCode, 200);
    assert.equal(authorized.payload.success, true);
    assert.equal(authorized.payload.claimed, 0);
    assert.equal(authorized.headers["X-ARI-Agent-Worker"], "pgmq-v1");
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
});

test("Vercel schedules the background agent worker every minute", async () => {
  const config = JSON.parse(await readFile(
    new URL("../vercel.json", import.meta.url),
    "utf8"
  ));
  const cron = config.crons.find(item => item.path === "/api/ari-agent-worker");
  assert.ok(cron);
  assert.equal(cron.schedule, "* * * * *");
});
