import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-phase9c-compound-actions.js", import.meta.url),
  "utf8"
);

function authoritative(referenceId, { domain = "nutrition", entityType = "meal" } = {}) {
  return {
    referenceId,
    state: "persisted",
    domain,
    entityType,
    canonical: { id: referenceId },
    verification: {
      verifiedByTrustedContext: true,
      currentContextRead: true,
      rehydratedFromAuthoritativeState: true,
      staleCheckRequiredBeforeWrite: true
    }
  };
}

function sandbox({
  contexts = {},
  supportedOperations = ["update_nutrition_meal", "edit_referenced_workout"],
  executions = []
} = {}) {
  let registered = null;
  let storedLegacyPending = null;
  let bridgePending = null;
  const executionCalls = [];
  const events = [];

  const registry = {
    ready: true,
    registerOperation(name, handlers) {
      registered = { name, handlers };
      return () => {};
    },
    snapshot() {
      return { operationNames: [...supportedOperations, "compound_action_batch"] };
    },
    async executeConfirmed(input) {
      executionCalls.push(input);
      const configured = executions[executionCalls.length - 1];
      return configured || { success: true, result: { reply: "done" } };
    }
  };

  const window = {
    Ari: {},
    location: { pathname: "/home.html" },
    AriVNextOperationRegistry: registry,
    AriVNextBridge: {
      async buildContext({ message }) {
        const refs = contexts[message] || [];
        return { referenceState: { references: refs } };
      },
      getPendingAction() { return bridgePending; },
      clearPendingAction() { bridgePending = null; }
    },
    CalBuddy: {
      async getUserContext() { return {}; },
      async createPendingAction(action) { return { ...action, id: "legacy-pending" }; },
      setPendingAction(action) { storedLegacyPending = action; },
      getPendingAction() { return storedLegacyPending; },
      clearPendingAction() { storedLegacyPending = null; }
    },
    dispatchEvent(event) { events.push(event); },
    setInterval() { return 1; },
    clearInterval() {}
  };

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const context = {
    window,
    CustomEvent,
    console,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    JSON,
    Promise
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "ari-vnext-phase9c-compound-actions.js" });

  return {
    window,
    registry,
    getRegistered: () => registered,
    getLegacyPending: () => storedLegacyPending,
    setBridgePending: (value) => { bridgePending = value; },
    executionCalls,
    events
  };
}

function batch(actions) {
  return {
    id: "batch-action-1",
    sourceTurnId: "turn-source-1",
    name: "compound_action_batch",
    arguments: { actions },
    createdAt: "2026-08-27T20:00:00.000Z",
    expiresAt: "2099-08-27T20:10:00.000Z"
  };
}

function action(name, clause, args = {}) {
  return { name, toolName: "", clause, arguments: args };
}

test("Phase 9C registers one compound operation on the canonical operation registry", () => {
  const env = sandbox();
  const registered = env.getRegistered();
  assert.equal(env.window.AriVNextPhase9CCompoundActions.ready, true);
  assert.equal(env.window.AriVNextPhase9CCompoundActions.version, "1.1.0");
  assert.equal(registered.name, "compound_action_batch");
  assert.equal(typeof registered.handlers.createPending, "function");
  assert.equal(typeof registered.handlers.executeConfirmed, "function");
});

test("Phase 9C creates one confirmation surface for the whole batch", async () => {
  const env = sandbox();
  const pending = batch([
    action("update_nutrition_meal", "change lunch", { referenceId: "ref_live_meal_a" }),
    action("edit_referenced_workout", "move squats", { referenceId: "ref_live_workout_a" })
  ]);

  const mapped = await env.getRegistered().handlers.createPending(pending);
  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "compound_action_batch");
  assert.equal(mapped.action.payload.count, 2);
  assert.deepEqual(Array.from(mapped.action.payload.operations), ["update_nutrition_meal", "edit_referenced_workout"]);
  assert.match(mapped.action.confirmation_text, /Apply these 2 changes together/);
  assert.equal(mapped.action.vnext_action_id, pending.id);
  assert.equal(env.getLegacyPending().vnext_action_id, pending.id);
});

test("Phase 9C stale reference preflight blocks the whole batch before any write", async () => {
  const env = sandbox({
    contexts: {
      "change lunch": [],
      "move squats": [authoritative("ref_live_workout_a", { domain: "training", entityType: "workout" })]
    }
  });
  const pending = batch([
    action("update_nutrition_meal", "change lunch", { referenceId: "ref_live_meal_a" }),
    action("edit_referenced_workout", "move squats", { referenceId: "ref_live_workout_a" })
  ]);

  const result = await env.getRegistered().handlers.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(result.success, false);
  assert.equal(result.code, "compound_reference_stale");
  assert.equal(result.failedIndex, 0);
  assert.equal(env.executionCalls.length, 0);
});

test("Phase 9C preflights every target first, then delegates sub-actions through OperationRegistry in order", async () => {
  const env = sandbox({
    contexts: {
      "change lunch": [authoritative("ref_live_meal_a")],
      "move squats": [authoritative("ref_live_workout_a", { domain: "training", entityType: "workout" })]
    },
    executions: [
      { success: true, result: { reply: "meal updated" } },
      { success: true, result: { reply: "workout updated" } }
    ]
  });
  const pending = batch([
    action("update_nutrition_meal", "change lunch", { referenceId: "ref_live_meal_a" }),
    action("edit_referenced_workout", "move squats", { referenceId: "ref_live_workout_a" })
  ]);

  const result = await env.getRegistered().handlers.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "confirm-turn" });
  assert.equal(result.success, true);
  assert.equal(result.completedCount, 2);
  assert.equal(env.executionCalls.length, 2);
  assert.equal(env.executionCalls[0].vnextPendingAction.name, "update_nutrition_meal");
  assert.equal(env.executionCalls[1].vnextPendingAction.name, "edit_referenced_workout");
  assert.equal(env.executionCalls[0].vnextPendingAction.compoundBatchId, pending.id);
  assert.equal(env.executionCalls[1].currentTurnId, "confirm-turn");
});

test("Phase 9C closes a partially completed batch so confirmation cannot repeat earlier successes", async () => {
  const env = sandbox({
    contexts: {
      "change lunch": [authoritative("ref_live_meal_a")],
      "move squats": [authoritative("ref_live_workout_a", { domain: "training", entityType: "workout" })]
    },
    executions: [
      { success: true, result: { reply: "meal updated" } },
      { success: false, code: "workout_reference_not_found", message: "Workout changed." }
    ]
  });
  const pending = batch([
    action("update_nutrition_meal", "change lunch", { referenceId: "ref_live_meal_a" }),
    action("edit_referenced_workout", "move squats", { referenceId: "ref_live_workout_a" })
  ]);
  env.setBridgePending(pending);
  await env.getRegistered().handlers.createPending(pending);

  const result = await env.getRegistered().handlers.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(result.success, false);
  assert.equal(result.code, "compound_partial_execution");
  assert.equal(result.completedCount, 1);
  assert.equal(result.retryable, false);
  assert.equal(env.executionCalls.length, 2);
  assert.equal(env.window.AriVNextBridge.getPendingAction(), null);
  assert.equal(env.getLegacyPending(), null);
});

test("Phase 9C blocks an unregistered sub-operation before executing anything", async () => {
  const env = sandbox({ supportedOperations: ["update_nutrition_meal"] });
  const pending = batch([
    action("update_nutrition_meal", "change lunch", {}),
    action("made_up_operation", "do something unknown", {})
  ]);
  const result = await env.getRegistered().handlers.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(result.success, false);
  assert.equal(result.code, "compound_operation_unregistered");
  assert.equal(result.failedIndex, 1);
  assert.equal(env.executionCalls.length, 0);
});

test("Phase 9C capability contains no model, database, or standalone network executor", () => {
  assert.doesNotMatch(source, /OPENAI_API_KEY|\/v1\/responses/);
  assert.doesNotMatch(source, /\.from\(|\.rpc\(|supabase/i);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /AriVNextActionAdapter/);
  assert.match(source, /AriVNextOperationRegistry/);
  assert.match(source, /registry\.executeConfirmed/);
});
