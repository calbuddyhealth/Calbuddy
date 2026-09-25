import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  createAgentTaskSession,
  loadAgentTaskSession,
  loadAgentTaskWorkers,
  publicAgentTaskSession,
  updateAgentTaskSession,
  upsertAgentTaskWorker
} from "../api/_lib/ari-vnext/agent-task-store.js";
import {
  multiAgentCouncilToInstruction,
  publicMultiAgentCouncil
} from "../api/_lib/ari-vnext/multi-agent-orchestrator.js";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const TASK_ID = "11111111-1111-4111-8111-111111111111";
const WORKER_ID = "22222222-2222-4222-8222-222222222222";
const MAILBOX_ID = "33333333-3333-4333-8333-333333333333";

function configure() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  };
}

function sessionRow(overrides = {}) {
  return {
    id: TASK_ID,
    user_id: USER_ID,
    execution_session_id: "exec_durable_test",
    conversation_id: "conv-1",
    root_turn_id: "turn-1",
    last_turn_id: "turn-1",
    goal: "Make a durable multi-agent task.",
    success_criteria: "Specialists can resume and reconcile evidence.",
    status: "planning",
    plan: { tasks: [{ id: "agent_1", role: "analyst", objective: "Inspect the architecture." }] },
    verification: {},
    synthesis: null,
    next_step: "Run specialists.",
    round_count: 0,
    max_rounds: 2,
    created_at: "2026-09-25T07:00:00.000Z",
    updated_at: "2026-09-25T07:00:00.000Z",
    completed_at: null,
    ...overrides
  };
}

function workerRow(overrides = {}) {
  return {
    id: WORKER_ID,
    user_id: USER_ID,
    task_id: TASK_ID,
    worker_key: "agent_1",
    role: "analyst",
    objective: "Inspect the architecture.",
    round: 1,
    followup: false,
    status: "completed",
    mailbox_message_id: MAILBOX_ID,
    provider_model: "gpt-5.6-sol",
    error_code: null,
    created_at: "2026-09-25T07:00:00.000Z",
    started_at: "2026-09-25T07:00:01.000Z",
    completed_at: "2026-09-25T07:00:02.000Z",
    updated_at: "2026-09-25T07:00:02.000Z",
    ...overrides
  };
}

test("durable agent task migration is server-only and worker results stay in mailbox", () => {
  const migration = fs.readFileSync(
    "supabase/migrations/20260925081234_ari_durable_agent_tasks.sql",
    "utf8"
  );

  for (const table of [
    "ari_vnext_agent_task_sessions",
    "ari_vnext_agent_task_workers"
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"));
    assert.match(migration, new RegExp(`grant select, insert, update on table public\\.${table} to service_role`, "i"));
  }

  assert.match(migration, /mailbox_message_id uuid references public\.ari_agent_mailbox_messages/i);
  assert.match(migration, /never hidden chain-of-thought/i);
  assert.doesNotMatch(migration, /raw_worker_output|chain_of_thought\s+text/i);
});

test("task store creates and resumes by execution session without exposing a bearer secret key", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    configure();
    const seen = [];
    globalThis.fetch = async (url, options = {}) => {
      seen.push({ url: String(url), options });
      if (options.method === "POST") return response(201, [sessionRow()]);
      return response(200, [sessionRow({ status: "waiting" })]);
    };

    const created = await createAgentTaskSession({
      userId: USER_ID,
      executionSessionId: "exec_durable_test",
      conversationId: "conv-1",
      rootTurnId: "turn-1",
      goal: "Make a durable multi-agent task.",
      successCriteria: "Specialists can resume and reconcile evidence.",
      plan: { tasks: [{ id: "agent_1", role: "analyst", objective: "Inspect the architecture." }] },
      maxRounds: 2
    });

    assert.equal(created.stored, true);
    assert.equal(created.session.id, TASK_ID);
    assert.equal(seen[0].options.headers.apikey, "sb_secret_test");
    assert.equal(Object.hasOwn(seen[0].options.headers, "Authorization"), false);

    const loaded = await loadAgentTaskSession({
      userId: USER_ID,
      executionSessionId: "exec_durable_test"
    });
    assert.equal(loaded.status, "waiting");
    assert.equal(loaded.executionSessionId, "exec_durable_test");
    assert.match(seen[1].url, /execution_session_id=eq\.exec_durable_test/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
});

test("task and worker state updates contain metadata only and preserve mailbox linkage", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    configure();
    const calls = [];
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).includes("ari_vnext_agent_task_workers") && options.method === "POST") {
        return response(201, [workerRow()]);
      }
      if (String(url).includes("ari_vnext_agent_task_workers")) {
        return response(200, [workerRow()]);
      }
      return response(200, [sessionRow({
        status: "waiting",
        verification: { ready: true, confidence: 0.82 },
        synthesis: "Reconciled evidence.",
        next_step: "Use the evidence.",
        round_count: 1
      })]);
    };

    const worker = await upsertAgentTaskWorker({
      userId: USER_ID,
      taskId: TASK_ID,
      worker: {
        workerKey: "agent_1",
        role: "analyst",
        objective: "Inspect the architecture.",
        round: 1,
        status: "completed",
        mailboxMessageId: MAILBOX_ID,
        providerModel: "gpt-5.6-sol"
      }
    });
    assert.equal(worker.stored, true);
    assert.equal(worker.worker.mailboxMessageId, MAILBOX_ID);

    const workers = await loadAgentTaskWorkers({ userId: USER_ID, taskId: TASK_ID });
    assert.equal(workers.length, 1);
    assert.equal(workers[0].status, "completed");

    const updated = await updateAgentTaskSession({
      userId: USER_ID,
      taskId: TASK_ID,
      patch: {
        status: "waiting",
        verification: { ready: true, confidence: 0.82 },
        synthesis: "Reconciled evidence.",
        nextStep: "Use the evidence.",
        roundCount: 1
      }
    });
    assert.equal(updated.stored, true);
    assert.equal(updated.session.verification.ready, true);

    const workerPayload = JSON.parse(calls[0].options.body);
    assert.equal(Object.hasOwn(workerPayload, "result_text"), false);
    assert.equal(Object.hasOwn(workerPayload, "chain_of_thought"), false);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
});

test("public task diagnostics show resumability without raw specialist text", () => {
  const publicTask = publicAgentTaskSession(
    {
      ...sessionRow({
        status: "waiting",
        verification: { ready: true },
        round_count: 1
      }),
      resumed: true
    },
    [workerRow()]
  );

  assert.equal(publicTask.id, TASK_ID);
  assert.equal(publicTask.resumed, true);
  assert.equal(publicTask.workerCount, 1);
  assert.equal(publicTask.completedWorkers, 1);
  assert.equal(publicTask.mailboxThreadId, TASK_ID);
  assert.equal(publicTask.rawWorkerTextStoredInTaskLedger, false);
});

test("multi-agent diagnostics and model instruction expose durable coordination state", () => {
  const council = {
    version: "2.0.0",
    active: true,
    plan: { reason: "complexity_earned_delegation", targetWorkers: 2 },
    workspace: [
      { id: "agent_1", role: "implementation_analyst", objective: "Inspect code.", success: true, text: "Finding one." },
      { id: "agent_2", role: "adversarial_critic", objective: "Challenge it.", success: true, text: "Finding two." }
    ],
    synthesis: "The two findings were reconciled.",
    durableTask: {
      id: TASK_ID,
      executionSessionId: "exec_durable_test",
      status: "waiting",
      roundCount: 1,
      maxRounds: 2,
      resumed: true,
      workerCount: 2,
      completedWorkers: 2,
      failedWorkers: 0,
      mailboxThreadId: TASK_ID,
      readyForAriSynthesis: true,
      unresolvedCount: 0,
      nextStep: "Use the reconciled evidence."
    }
  };

  const diagnostics = publicMultiAgentCouncil(council);
  assert.equal(diagnostics.durableTask.id, TASK_ID);
  assert.equal(diagnostics.durableTask.resumed, true);
  assert.equal(diagnostics.durableTask.readyForAriSynthesis, true);
  assert.equal(diagnostics.hiddenChainOfThoughtStored, false);

  const instruction = multiAgentCouncilToInstruction(council);
  assert.match(instruction, /durable task session/i);
  assert.match(instruction, /resumed durable worker evidence/i);
  assert.match(instruction, /does not prove the user's overall task is complete/i);
});
