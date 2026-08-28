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
  let plans = [{
    id: "plan-1",
    plan_date: "2026-08-27",
    meal_slot: "lunch",
    name: "Chicken bowl",
    calories: 620,
    protein_g: 48,
    carbs_g: 61,
    fat_g: 19,
    serving_size: "1 bowl",
    status: "planned",
    items: []
  }];

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
      clearPendingAction() { legacyPending = null; },
      async getUserContext() {
        return { dailyGoal: 2400, caloriesConsumed: 500, plannedCalories: 620, caloriesRemainingAfterPlan: 1280, plannedMeals: plans };
      },
      async getConsumedCalories() { return 500; }
    },
    AriVNextStructuredReferenceCapabilities: {
      ready: true,
      planReferenceId(plan) { return plan?.id === "plan-1" ? "plan-ref" : ""; },
      componentReferenceId(plan, item, index) { return `${plan?.id}:component:${index}:${item?.id || item?.name}`; }
    },
    AriVNextAuthoritativeReferenceRehydration: {
      ready: true,
      resolveReference(referenceId) {
        return referenceId === liveReference?.referenceId ? liveReference : null;
      }
    },
    AriVNextActivityAdapter: {
      version: "1.1.0",
      async updateReferencedActivity() { return { success: true, activity: { id: "activity-1", log_date: "2026-08-27" } }; },
      async deleteReferencedActivity() { return { success: true, deleted: true }; }
    },
    AriVNextWeightAdapter: {
      ready: true,
      async updateReferencedWeight() { return { success: true, weight: { log_date: "2026-08-27", weight_lbs: 185 } }; },
      async deleteReferencedWeight() { return { success: true, deleted: true }; }
    },
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
    AriNutritionPlanSync: {
      async loadToday() { return plans.filter((plan) => plan.status === "planned"); },
      async pushRecords(records) {
        for (const record of records) {
          const current = plans.find((plan) => plan.id === record.id || plan.id === record.cloud_id);
          if (current) Object.assign(current, record);
        }
        plans = plans.filter((plan) => plan.status === "planned");
        return records;
      }
    },
    calbuddySupabase: { async rpc() { return { data: {}, error: null }; } },
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

test("Phase 8B registers Circle prepare and application execution ahead of compatibility fallbacks", async () => {
  const harness = await makeHarness();
  assert.equal(harness.window.AriVNextOperationRegistryPhase8B?.ready, true);

  const prepared = await harness.actionAdapter.prepareCalBuddyAction({
    id: "circle-action",
    sourceTurnId: "turn-circle",
    name: "join_circle_meetup",
    arguments: { meetupId: "meetup-1" }
  });
  assert.equal(prepared.success, true);
  assert.equal(harness.counters.circlePrepare, 1);
  assert.equal(harness.counters.basePrepare, 0);

  const executed = await harness.window.CalBuddy.executeAction({ action_type: "circle_join_meetup", payload: { meetupId: "meetup-1" } });
  assert.equal(executed.success, true);
  assert.equal(harness.counters.circleExecute, 1);
  assert.equal(harness.counters.baseApplicationExecute, 0);
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