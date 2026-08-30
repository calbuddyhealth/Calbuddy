import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makePending(id = "meal-action-1", overrides = {}) {
  return {
    id,
    name: "log_meal",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: {
      name: "Chicken and rice",
      quantity: 1,
      unit: "meal",
      servingSize: "1 plate",
      mealCategory: "Lunch",
      calories: 540,
      proteinG: 48,
      carbsG: 58,
      fatG: 12,
      notes: "Nutrition estimated by Ari.",
      ...(overrides.arguments || {})
    },
    ...overrides
  };
}

function makeHarness({ executeSuccess = true } = {}) {
  let bridgePending = makePending();
  let legacyPending = null;
  const executed = [];
  let fallbackCreates = 0;
  let fallbackExecutes = 0;

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "legacy-pending", ...action };
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
      return executeSuccess
        ? { success: true, reply: "Meal logged." }
        : { success: false, message: "Write failed." };
    }
  };

  const adapter = {
    async createCalBuddyPendingAction() {
      fallbackCreates += 1;
      return { success: true, action: { action_type: "fallback" } };
    },
    async executeConfirmed() {
      fallbackExecutes += 1;
      return { success: true, result: { reply: "fallback" } };
    }
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter: adapter,
    AriVNextBridge: {
      getPendingAction() {
        return bridgePending;
      },
      setPendingAction(action) {
        bridgePending = action;
      },
      clearPendingAction() {
        bridgePending = null;
      }
    },
    dispatchEvent() {},
    setInterval,
    clearInterval
  };

  const context = vm.createContext({
    window,
    console,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    Date,
    Number,
    String,
    Object,
    Math,
    Promise,
    setInterval,
    clearInterval
  });

  vm.runInContext(source, context, { filename: "ari-vnext-operation-registry.js" });

  return {
    window,
    adapter,
    executed,
    setBridgePending(value) {
      bridgePending = value;
    },
    get bridgePending() {
      return bridgePending;
    },
    get legacyPending() {
      return legacyPending;
    },
    get fallbackCreates() {
      return fallbackCreates;
    },
    get fallbackExecutes() {
      return fallbackExecutes;
    }
  };
}

test("registry owns log_meal while preserving fallback for unmigrated operations", async () => {
  const harness = makeHarness();
  assert.equal(harness.window.AriVNextOperationRegistry.ready, true);
  assert.equal(harness.window.AriVNextOperationRegistry.hasOperation("log_meal"), true);
  assert.equal(harness.window.AriVNextOperationRegistry.hasOperation("log_weight"), false);

  const mapped = await harness.adapter.createCalBuddyPendingAction(makePending());
  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "log_meal");
  assert.equal(mapped.action.payload.calories, 540);
  assert.equal(mapped.action.payload.protein_g, 48);
  assert.equal(mapped.action.vnext_action_id, "meal-action-1");
  assert.equal(harness.fallbackCreates, 0);

  await harness.adapter.createCalBuddyPendingAction({
    id: "weight-1",
    name: "log_weight",
    sourceTurnId: "turn-weight-1",
    arguments: { value: 180 }
  });
  assert.equal(harness.fallbackCreates, 1);
});

test("unresolved meal nutrition is rejected before a pending action is created", async () => {
  const harness = makeHarness();
  const result = await harness.adapter.createCalBuddyPendingAction(
    makePending("meal-unresolved", { arguments: { calories: null } })
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "meal_nutrition_required");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackCreates, 0);
});

test("successful meal execution writes once and clears only matching pending copies", async () => {
  const harness = makeHarness();
  const pending = makePending("meal-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-turn"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.executed[0].action_type, "log_meal");
  assert.equal(harness.executed[0].vnext_action_id, "meal-success");
  assert.equal(harness.executed[0].vnext_confirmation_turn_id, "confirm-turn");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackExecutes, 0);
});

test("completed meal does not block a new meal with a new action identity", async () => {
  const harness = makeHarness();
  const first = makePending("meal-first");
  harness.setBridgePending(first);
  await harness.adapter.createCalBuddyPendingAction(first);
  await harness.adapter.executeConfirmed({ vnextPendingAction: first, currentTurnId: "confirm-first" });

  const second = makePending("meal-second", {
    arguments: {
      name: "Banana",
      calories: 105,
      proteinG: 1.3,
      carbsG: 27,
      fatG: 0.4,
      servingSize: "1 medium banana"
    }
  });
  harness.setBridgePending(second);
  const mapped = await harness.adapter.createCalBuddyPendingAction(second);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.vnext_action_id, "meal-second");
  assert.equal(mapped.action.payload.name, "Banana");
  assert.equal(harness.executed.length, 1);
});

test("failed execution preserves pending state inside the operation registry", async () => {
  const harness = makeHarness({ executeSuccess: false });
  const pending = makePending("meal-failure");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.bridgePending.id, "meal-failure");
  assert.equal(harness.legacyPending.vnext_action_id, "meal-failure");
});
