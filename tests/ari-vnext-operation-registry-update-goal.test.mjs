import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);
const orchestratorSource = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

function pending(goalType, value, overrides = {}) {
  const { arguments: argumentOverrides = {}, ...restOverrides } = overrides;
  return {
    id: `goal-${goalType}`,
    name: "update_goal",
    sourceTurnId: `turn-${goalType}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: {
      goalType,
      value,
      unit: "lb",
      instruction: "",
      ...argumentOverrides
    },
    ...restOverrides
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function harness({ executeSuccess = true } = {}) {
  let bridgePending = null;
  let legacyPending = null;
  const executed = [];
  let fallbackCreates = 0;
  let fallbackExecutes = 0;

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "stored-goal", ...action };
    },
    setPendingAction(action) {
      legacyPending = action;
    },
    getPendingAction() {
      return legacyPending;
    },
    clearPendingAction() {
      legacyPending = null;
    },
    async executeAction(action) {
      executed.push(action);
      return executeSuccess ? { success: true } : { success: false, message: "write failed" };
    }
  };

  const adapter = {
    async createCalBuddyPendingAction() {
      fallbackCreates += 1;
      return { success: true, action: { action_type: "fallback" } };
    },
    async executeConfirmed() {
      fallbackExecutes += 1;
      return { success: true };
    }
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter: adapter,
    AriVNextBridge: {
      getPendingAction: () => bridgePending,
      clearPendingAction: () => { bridgePending = null; }
    },
    dispatchEvent() {},
    setInterval,
    clearInterval
  };

  vm.runInContext(registrySource, vm.createContext({
    window,
    console,
    CustomEvent: class CustomEvent {},
    Date,
    Number,
    String,
    Object,
    Math,
    Promise,
    Set,
    Array,
    setInterval,
    clearInterval
  }));

  return {
    window,
    adapter,
    executed,
    setBridgePending(value) { bridgePending = value; },
    get bridgePending() { return bridgePending; },
    get legacyPending() { return legacyPending; },
    get fallbackCreates() { return fallbackCreates; },
    get fallbackExecutes() { return fallbackExecutes; }
  };
}

test("registry owns update_goal without adding it to the low-risk semantic-verifier bypass", () => {
  const h = harness();
  assert.equal(h.window.AriVNextOperationRegistry.hasOperation("update_goal"), true);
  assert.doesNotMatch(
    orchestratorSource,
    /LOW_RISK_PRIMARY_FAST_PATHS = new Set\([\s\S]*?propose_update_goal/
  );
});

test("goal registry preserves all four existing trusted profile mappings", () => {
  const registry = harness().window.AriVNextOperationRegistry;

  const calories = registry.prepare(pending("daily_calorie_goal", 2200));
  assert.equal(calories.success, true);
  assert.deepEqual(plain(calories.action.payload), { daily_calorie_goal: 2200 });

  const targetKg = registry.prepare(pending("target_weight", 82, { arguments: { unit: "kg" } }));
  assert.equal(targetKg.success, true);
  assert.equal(targetKg.action.payload.target_weight_lbs, 180.8);

  const weekly = registry.prepare(pending("weekly_weight_change", -1.5));
  assert.equal(weekly.success, true);
  assert.deepEqual(plain(weekly.action.payload), { weekly_weight_change_goal: 1.5 });

  const mode = registry.prepare(pending("goal_mode", null, { arguments: { instruction: "I want to maintain" } }));
  assert.equal(mode.success, true);
  assert.deepEqual(plain(mode.action.payload), { goal: "maintain" });
});

test("goal registry rejects invalid values before pending creation", async () => {
  const h = harness();
  for (const [action, code] of [
    [pending("daily_calorie_goal", 500), "calorie_goal_out_of_range"],
    [pending("target_weight", 0), "target_weight_out_of_range"],
    [pending("weekly_weight_change", 11), "weekly_change_out_of_range"],
    [pending("goal_mode", null, { arguments: { instruction: "do something different" } }), "goal_mode_required"]
  ]) {
    const result = await h.adapter.createCalBuddyPendingAction(action);
    assert.equal(result.success, false);
    assert.equal(result.code, code);
  }
  assert.equal(h.legacyPending, null);
  assert.equal(h.fallbackCreates, 0);
});

test("confirmed goal update executes exactly once with original vNext identity", async () => {
  const h = harness();
  const action = pending("target_weight", 180);
  h.setBridgePending(action);
  const created = await h.adapter.createCalBuddyPendingAction(action);
  assert.equal(created.success, true);
  assert.equal(created.action.action_type, "update_goal_profile");
  assert.equal(created.action.vnext_action_id, action.id);

  const result = await h.adapter.executeConfirmed({
    vnextPendingAction: action,
    currentTurnId: "confirm-goal"
  });

  assert.equal(result.success, true);
  assert.equal(h.executed.length, 1);
  assert.equal(h.executed[0].action_type, "update_goal_profile");
  assert.equal(h.executed[0].payload.target_weight_lbs, 180);
  assert.equal(h.executed[0].vnext_action_id, action.id);
  assert.equal(h.executed[0].vnext_confirmation_turn_id, "confirm-goal");
  assert.equal(h.bridgePending, null);
  assert.equal(h.legacyPending, null);
  assert.equal(h.fallbackExecutes, 0);
});

test("failed goal execution preserves pending copies", async () => {
  const h = harness({ executeSuccess: false });
  const action = pending("daily_calorie_goal", 2300);
  h.setBridgePending(action);
  await h.adapter.createCalBuddyPendingAction(action);

  const result = await h.adapter.executeConfirmed({ vnextPendingAction: action });
  assert.equal(result.success, false);
  assert.equal(h.executed.length, 1);
  assert.equal(h.bridgePending.id, action.id);
  assert.equal(h.legacyPending.vnext_action_id, action.id);
});
