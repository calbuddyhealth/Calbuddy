import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url), "utf8");
const phase8bSource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry-phase8b.js", import.meta.url), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

async function makeHarness({ failedBaseExecution = false, liveReference = null } = {}) {
  const counters = {
    basePrepare: 0,
    baseExecute: 0,
    baseApplicationExecute: 0,
    circlePrepare: 0,
    circleExecute: 0,
    referenceCommits: 0,
    bridgeClears: 0,
    bridgeSets: 0
  };
  let bridgePending = null;
  let legacyPending = null;

  const actionAdapter = {
    async prepareCalBuddyAction(pending) {
      counters.basePrepare += 1;
      return { success: true, action: { action_type: pending?.name || "base" } };
    },
    async createCalBuddyPendingAction() {
      return { success: true, action: { action_type: "base_pending" } };
    },
    async executeConfirmed() {
      counters.baseExecute += 1;
      return failedBaseExecution
        ? { success: false, code: "test_failure", message: "Retry me." }
        : { success: true, result: { via: "base" } };
    },
    async getWorkoutController() { return null; }
  };

  const window = {
    Ari: {},
    AriVNextActionAdapter: actionAdapter,
    AriVNextBridge: {
      getPendingAction() { return bridgePending; },
      setPendingAction(value) { counters.bridgeSets += 1; bridgePending = value; },
      clearPendingAction() { counters.bridgeClears += 1; bridgePending = null; }
    },
    CalBuddy: {
      async executeAction(action) {
        counters.baseApplicationExecute += 1;
        return { success: true, result: { action } };
      },
      async createPendingAction(action) { return { ...action, id: "legacy-pending" }; },
      setPendingAction(action) { legacyPending = action; },
      getPendingAction() { return legacyPending; },
      clearPendingAction() { legacyPending = null; }
    },
    AriVNextStructuredReferenceCapabilities: { ready: true },
    AriVNextAuthoritativeReferenceRehydration: {
      ready: true,
      resolveReference(referenceId) {
        return referenceId === liveReference?.referenceId ? liveReference : null;
      }
    },
    AriVNextActivityAdapter: {},
    AriVNextWeightAdapter: { ready: true },
    AriVNextReferenceState: {
      snapshot() { return { references: [] }; },
      rememberPending() {},
      commit() { counters.referenceCommits += 1; return { state: "persisted" }; }
    },
    AriVNextCircleActionAdapter: {
      ready: true,
      async prepare(pending) {
        counters.circlePrepare += 1;
        return { success: true, action: { action_type: `circle_${pending.name.replace("_circle_", "_")}`, payload: pending.arguments } };
      },
      async execute(action) {
        counters.circleExecute += 1;
        return { success: true, result: { id: action?.payload?.meetupId || "circle-result" }, reply: "Circle action complete." };
      }
    },
    dispatchEvent() {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  window.window = window;

  const sandbox = {
    window,
    sessionStorage: storage(),
    localStorage: storage(),
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Promise,
    Object,
    Map,
    Set,
    Uint8Array,
    crypto: globalThis.crypto
  };
  vm.createContext(sandbox);
  vm.runInContext(registrySource, sandbox, { filename: "ari-vnext-operation-registry.js" });
  vm.runInContext(phase8bSource, sandbox, { filename: "ari-vnext-operation-registry-phase8b.js" });

  for (let attempt = 0; attempt < 20 && window.AriVNextOperationRegistryPhase8B?.ready !== true; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  return { window, counters, actionAdapter, getBridgePending: () => bridgePending, setBridgePending: (value) => { bridgePending = value; } };
}

test("Phase 8B no longer owns Circle routing", async () => {
  const harness = await makeHarness();
  assert.equal(harness.window.AriVNextOperationRegistryPhase8B?.ready, true);
  assert.deepEqual(Array.from(harness.window.AriVNextOperationRegistryPhase8B?.migratedOperations || []), []);
  assert.deepEqual(Array.from(harness.window.AriVNextOperationRegistryPhase8B?.migratedApplicationActions || []), []);
  assert.equal(harness.counters.circlePrepare, 0);
  assert.equal(harness.counters.circleExecute, 0);
});

test("Phase 8B no longer owns superseded Nutrition reference mutations", async () => {
  const liveReference = {
    referenceId: "live-meal-ref",
    domain: "nutrition",
    entityType: "meal",
    canonical: { id: "meal-1" },
    verification: {
      verifiedByTrustedContext: true,
      currentContextRead: true,
      rehydratedFromAuthoritativeState: true,
      staleCheckRequiredBeforeWrite: true
    }
  };
  const harness = await makeHarness({ liveReference });

  const execution = await harness.actionAdapter.executeConfirmed({
    vnextPendingAction: {
      id: "edit-meal",
      sourceTurnId: "turn-edit-meal",
      name: "update_nutrition_meal",
      arguments: { referenceId: "live-meal-ref", changes: [{ field: "calories", numberValue: 650 }] }
    }
  });
  assert.equal(execution.success, true);
  assert.equal(harness.counters.baseExecute, 1, "Phase 8B must not intercept Nutrition meal edits anymore");

  const pending = await harness.window.AriVNextActionAdapter.createCalBuddyPendingAction({
    id: "discard-plan",
    sourceTurnId: "turn-discard-plan",
    name: "discard_referenced_meal_plan",
    arguments: { referenceId: "plan-ref" }
  });
  assert.equal(pending.action.action_type, "base_pending", "Phase 8B must not prepare referenced Meal Plan mutations anymore");
});

test("failed trusted execution restores vNext pending state and blocks the runtime's immediate clear once", async () => {
  const harness = await makeHarness({ failedBaseExecution: true });
  const pending = { id: "retry-action", sourceTurnId: "turn-retry", name: "update_goal", arguments: {} };
  harness.setBridgePending(null);

  const execution = await harness.actionAdapter.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(execution.success, false);
  assert.equal(harness.getBridgePending()?.id, pending.id);
  assert.equal(harness.counters.bridgeSets, 1);

  harness.window.AriVNextBridge.clearPendingAction();
  assert.equal(harness.getBridgePending()?.id, pending.id, "typed-confirmation clear should be suppressed after failure");

  await new Promise((resolve) => setTimeout(resolve, 1));
  harness.window.AriVNextBridge.clearPendingAction();
  assert.equal(harness.getBridgePending(), null, "a later explicit clear/cancel must still work");
});