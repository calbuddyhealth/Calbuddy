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

function makeWeightPending(id = "weight-action-1", overrides = {}) {
  return {
    id,
    name: "log_weight",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: {
      value: 185.6,
      unit: "lb",
      dateText: "today",
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
        ? { success: true, reply: "Saved." }
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
    Set,
    Array,
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

test("registry owns migrated logging operations while preserving fallback for unmigrated operations", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;
  assert.equal(registry.ready, true);
  assert.equal(registry.hasOperation("log_meal"), true);
  assert.equal(registry.hasOperation("log_weight"), true);
  assert.equal(registry.hasOperation("update_goal"), true);

  const meal = await harness.adapter.createCalBuddyPendingAction(makePending());
  assert.equal(meal.success, true);
  assert.equal(meal.action.action_type, "log_meal");
  assert.equal(meal.action.payload.calories, 540);
  assert.equal(meal.action.payload.protein_g, 48);
  assert.equal(meal.action.vnext_action_id, "meal-action-1");

  const weight = await harness.adapter.createCalBuddyPendingAction(makeWeightPending());
  assert.equal(weight.success, true);
  assert.equal(weight.action.action_type, "log_weight");
  assert.equal(weight.action.payload.weight, 185.6);
  assert.equal(weight.action.vnext_action_id, "weight-action-1");
  assert.equal(harness.fallbackCreates, 0);

  await harness.adapter.createCalBuddyPendingAction({
    id: "workout-edit-1",
    name: "edit_workout",
    sourceTurnId: "turn-workout-edit-1",
    arguments: { dateText: "today", editType: "move" }
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

test("weight registry preserves pounds and normalizes kilograms before execution", async () => {
  const harness = makeHarness();

  const pounds = harness.window.AriVNextOperationRegistry.prepare(makeWeightPending("weight-lb"));
  assert.equal(pounds.success, true);
  assert.equal(pounds.action.payload.weight, 185.6);
  assert.equal(pounds.action.confirmation_text, "Log your weight as 185.6 lb?");

  const kilograms = harness.window.AriVNextOperationRegistry.prepare(
    makeWeightPending("weight-kg", { arguments: { value: 84.2, unit: "kg" } })
  );
  assert.equal(kilograms.success, true);
  assert.equal(kilograms.action.payload.weight, 185.6);
  assert.equal(kilograms.action.payload.notes, "Entered as 84.2 kg by Ari vNext.");
  assert.equal(kilograms.action.confirmation_text, "Log your weight as 84.2 kg?");
});

test("invalid weight is rejected before a pending action is created", async () => {
  const harness = makeHarness();
  const result = await harness.adapter.createCalBuddyPendingAction(
    makeWeightPending("weight-invalid", { arguments: { value: 0 } })
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "weight_out_of_range");
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

test("successful weight execution uses the registry lifecycle and keeps exact action identity", async () => {
  const harness = makeHarness();
  const pending = makeWeightPending("weight-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-weight"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.executed[0].action_type, "log_weight");
  assert.equal(harness.executed[0].payload.weight, 185.6);
  assert.equal(harness.executed[0].vnext_action_id, "weight-success");
  assert.equal(harness.executed[0].vnext_confirmation_turn_id, "confirm-weight");
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
  for (const pending of [makePending("meal-failure"), makeWeightPending("weight-failure")]) {
    const harness = makeHarness({ executeSuccess: false });
    harness.setBridgePending(pending);
    await harness.adapter.createCalBuddyPendingAction(pending);

    const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

    assert.equal(execution.success, false);
    assert.equal(harness.executed.length, 1);
    assert.equal(harness.bridgePending.id, pending.id);
    assert.equal(harness.legacyPending.vnext_action_id, pending.id);
  }
});
