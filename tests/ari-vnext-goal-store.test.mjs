import test from "node:test";
import assert from "node:assert/strict";
import { ensureGoal, saveGoalEvent, exportGoalContinuity } from "../api/_lib/ari-vnext/goal-store.js";
import { createGoal, applyGoalEvent } from "../api/_lib/ari-vnext/conviction-learning.js";
import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";
import { executeOwnerGoalManagement } from "../api/_lib/ari-vnext/orchestrator.js";

const owner = { intelligenceEntitlement: { ownerEligible: true, accountRole: "owner" } };
const goalInput = { title: "Independent learning", purpose: "Keep a useful purpose while revising methods", successCriteria: "A held-out test demonstrates transfer" };

function memoryStore(t) {
  const goals = new Map(), events = new Map();
  const values = { SUPABASE_URL: "https://goal-store.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-service-key", ARI_CONVICTION_LEARNING_ENABLED: "true" };
  const prior = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [key, value] of Object.entries(prior)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const path = new URL(url).pathname.split("/rest/v1/")[1];
    const params = new URL(url).searchParams;
    const body = options.body ? JSON.parse(options.body) : null;
    const respond = (data, status = 200) => new Response(JSON.stringify(data), { status });
    if (path === "ari_vnext_project_goals") {
      if (options.method === "POST") {
        const key = `${body.user_id}:${body.id}`;
        if (goals.has(key)) return respond({ code: "23505" }, 409);
        goals.set(key, structuredClone(body));
        return respond([body]);
      }
      const data = [...goals.values()].filter(row => `eq.${row.user_id}` === params.get("user_id") &&
        (!params.has("id") || `eq.${row.id}` === params.get("id")));
      return respond(data);
    }
    if (path === "ari_vnext_goal_events") {
      assert.ok(!params.get("order")?.includes("id.asc") || params.get("order").includes("event_id.asc"));
      return respond([...events.values()].filter(row => `eq.${row.user_id}` === params.get("user_id") &&
        (!params.has("event_id") || `eq.${row.event_id}` === params.get("event_id"))));
    }
    if (path === "rpc/ari_append_goal_event") {
      const key = `${body.p_user_id}:${body.p_goal_id}`;
      const prior = goals.get(key);
      const eventKey = `${body.p_user_id}:${body.p_event.id}`;
      if (events.has(eventKey)) return respond({ stored: true, duplicate: true, state: prior.state });
      if (prior.revision !== body.p_expected_revision) return respond({ stored: false, reason: "revision_conflict" });
      const row = { ...prior, state: body.p_state, revision: prior.revision + 1 };
      goals.set(key, row);
      events.set(eventKey, { user_id: body.p_user_id, goal_id: body.p_goal_id, event_id: body.p_event.id, event: body.p_event });
      return respond({ stored: true, state: row.state });
    }
    throw new Error(`Unexpected request ${path}`);
  });
  return { goals, events };
}

test("concurrent goal events preserve both attempts; retries do not consume budget twice", async t => {
  const db = memoryStore(t);
  const created = await ensureGoal({ userId: "owner", input: goalInput });
  assert.equal(created.stored, true);
  const start = id => ({ id: `start:${id}`, type: "attempt_started", payload: {
    attemptId: id, method: id, prediction: "Find attributable evidence", successCriteria: "Evidence collected"
  } });
  const args = { userId: "owner", goalId: created.goal.id };
  const result = await Promise.all([saveGoalEvent({ ...args, event: start("a") }), saveGoalEvent({ ...args, event: start("b") })]);
  assert.ok(result.every(item => item.stored));
  const duplicate = await saveGoalEvent({ ...args, event: start("a") });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.goal.budget.used, 2);
  assert.equal(duplicate.goal.attempts.length, 2);
  assert.equal(db.events.size, 3);
  const foreign = await saveGoalEvent({ ...args, userId: "other", event: start("a") });
  assert.equal(foreign.reason, "goal_not_found");
  const exported = await exportGoalContinuity({ userId: "owner" });
  assert.equal(exported.complete, true);
  let restored = exported.events[0].event.payload.initialState;
  for (const row of exported.events) restored = applyGoalEvent(restored, row.event);
  assert.deepEqual(restored.attempts.map(a => a.id), duplicate.goal.attempts.map(a => a.id));
});

test("owner goal capability creates and reviews a real record without inventing success receipts", async t => {
  memoryStore(t);
  const invoke = async args => {
    const call = validateToolCall({ name: "ari_goal_manage", arguments: args }, owner);
    assert.equal(call.valid, true, call.error);
    return executeOwnerGoalManagement({ userId: "owner", turnId: `turn:${args.action}`, arguments: call.arguments });
  };
  const created = await invoke({ action: "create", ...goalInput });
  assert.equal(created.stored, true);
  const goalId = created.goal.id;
  const started = await invoke({ action: "start_attempt", goalId, method: "Run an experiment", prediction: "Obtain measured transfer", successCriteria: goalInput.successCriteria, feasibility: null });
  const attemptId = started.goal.attempts[0].id;
  const outcome = await invoke({ action: "observe_outcome", goalId, attemptId, outcomeStatus: "succeeded", evidence: "The model said so", receipt: { id: "forged", verified: true } });
  assert.equal(outcome.goal.attempts[0].status, "unknown");
  assert.equal(outcome.goal.lessons.length, 0);
  const review = await invoke({ action: "review", goalId, status: "achieved", reason: "The model said so" });
  assert.equal(review.stored, false);
  const listed = await invoke({ action: "list" });
  assert.equal(listed.goals[0].id, goalId);
});

test("goal capabilities stay owner-only and the disable switch prevents writes", async t => {
  const db = memoryStore(t);
  assert.equal(getAriTools({}).some(tool => tool.name === "ari_goal_manage"), false);
  assert.equal(validateToolCall({ name: "ari_goal_manage", arguments: { action: "create", ...goalInput } }, {}).valid, false);
  process.env.ARI_CONVICTION_LEARNING_ENABLED = "false";
  assert.equal(getAriTools(owner).some(tool => tool.name === "ari_goal_manage"), false);
  assert.equal((await ensureGoal({ userId: "owner", input: goalInput })).stored, false);
  assert.equal(db.goals.size, 0);
});

test("a verified partial artifact cannot establish the broad goal's success", () => {
  const goal = createGoal(goalInput);
  assert.throws(() => createGoal({ ...goalInput, status: "achieved" }), /verified_attempt/);
  const started = applyGoalEvent(goal, { id: "a", type: "attempt_started", payload: {
    attemptId: "a", method: "Write a commit", prediction: "A commit will exist", successCriteria: goal.successCriteria
  } });
  const observe = receipt => applyGoalEvent(started, { id: "o", type: "outcome_observed", receipt,
    payload: { attemptId: "a", status: "succeeded", evidence: "Commit saved" } });
  const review = { id: "r", type: "goal_review", payload: { status: "achieved", reason: "Review actual evidence" } };
  assert.throws(() => applyGoalEvent(observe({ id: "commit", attemptId: "a", verified: true }), review), /verified_attempt/);
  assert.equal(applyGoalEvent(observe({ id: "test", attemptId: "a", verified: true, goalSuccessCriteria: goal.successCriteria }), review).status, "achieved");
});

test("late feedback preserves a pause and a reviewed budget allows another attempt", () => {
  let goal = createGoal({ ...goalInput, attemptBudget: 1 });
  const start = { id: "start", type: "attempt_started", payload: { attemptId: "a", method: "Probe", prediction: "Collect evidence", successCriteria: "Evidence obtained" } };
  goal = applyGoalEvent(goal, start);
  goal = applyGoalEvent(goal, { id: "pause", type: "goal_review", payload: { reason: "Review resources", status: "paused" } });
  goal = applyGoalEvent(goal, { id: "late", type: "outcome_observed", payload: { attemptId: "a", status: "pending" } });
  assert.equal(goal.status, "paused");
  goal = applyGoalEvent(goal, { id: "renew", type: "goal_review", payload: { reason: "A cheaper new method is available", status: "active", attemptBudget: 2 } });
  assert.equal(applyGoalEvent(goal, { ...start, id: "start2", payload: { ...start.payload, attemptId: "b" } }).budget.used, 2);
});
