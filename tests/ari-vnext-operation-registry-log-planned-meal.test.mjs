import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makePending(id = "planned-meal-1", overrides = {}) {
  return {
    id,
    name: "log_planned_meal",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sourceMessage: "Log my planned lunch",
    arguments: {
      mealSlot: "lunch",
      dateText: "today",
      ...(overrides.arguments || {})
    },
    ...overrides
  };
}

function makeHarness({ executeSuccess = true, prepareSuccess = true } = {}) {
  let bridgePending = null;
  let legacyPending = null;
  const executed = [];
  const prepared = [];
  let fallbackCreates = 0;
  let fallbackExecutes = 0;

  const CalBuddy = {
    async createPendingAction(action) {
      return { id: "legacy-planned-meal", ...action };
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
        ? { success: true, logged: action.payload.meal_slot }
        : { success: false, message: "Meal Plan write failed." };
    }
  };

  const adapter = {
    async prepareCalBuddyAction(pending) {
      prepared.push(pending);
      if (!prepareSuccess) {
        return {
          success: false,
          code: "planned_meal_slot_required",
          message: "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan."
        };
      }

      const slot = String(pending?.arguments?.mealSlot || "").trim().toLowerCase();
      return {
        success: true,
        action: {
          action_type: "log_planned_meal",
          payload: {
            meal_slot: slot,
            source: "ari_vnext_meal_plan_adapter",
            requested_from_message: pending.sourceMessage,
            vnext_action_id: pending.id
          },
          confirmation_text: `Log today’s planned ${slot} as eaten?`
        },
        resolution: {
          todayOnly: true,
          mealSlot: slot
        }
      };
    },
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
    prepared,
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

test("registry owns log_planned_meal while preserving the canonical Meal Plan preparer", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;

  assert.equal(registry.version, "1.4.0");
  assert.equal(registry.hasOperation("log_planned_meal"), true);
  assert.equal(registry.hasOperation("plan_meal"), false);

  const pending = makePending();
  const mapped = await harness.adapter.createCalBuddyPendingAction(pending);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "log_planned_meal");
  assert.equal(mapped.action.payload.meal_slot, "lunch");
  assert.equal(mapped.action.vnext_action_id, "planned-meal-1");
  assert.equal(mapped.action.vnext_source_turn_id, "turn-planned-meal-1");
  assert.equal(mapped.resolution.operation, "log_planned_meal");
  assert.equal(mapped.resolution.todayOnly, true);
  assert.equal(harness.prepared.length, 1);
  assert.equal(harness.fallbackCreates, 0);
});

test("planned meal preparation failure cannot create an executable pending action", async () => {
  const harness = makeHarness({ prepareSuccess: false });
  const result = await harness.adapter.createCalBuddyPendingAction(makePending("planned-invalid"));

  assert.equal(result.success, false);
  assert.equal(result.code, "planned_meal_slot_required");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.executed.length, 0);
  assert.equal(harness.fallbackCreates, 0);
});

test("confirmed planned meal executes once with the original vNext identity", async () => {
  const harness = makeHarness();
  const pending = makePending("planned-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-planned-meal"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.executed[0].action_type, "log_planned_meal");
  assert.equal(harness.executed[0].payload.meal_slot, "lunch");
  assert.equal(harness.executed[0].vnext_action_id, "planned-success");
  assert.equal(harness.executed[0].vnext_confirmation_turn_id, "confirm-planned-meal");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackExecutes, 0);
});

test("failed planned meal execution preserves matching pending state for retry", async () => {
  const harness = makeHarness({ executeSuccess: false });
  const pending = makePending("planned-failure");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.bridgePending.id, "planned-failure");
  assert.equal(harness.legacyPending.vnext_action_id, "planned-failure");
});

test("full Meal Plan creation remains on compatibility fallback", async () => {
  const harness = makeHarness();
  await harness.adapter.createCalBuddyPendingAction({
    id: "plan-meal-1",
    name: "plan_meal",
    sourceTurnId: "turn-plan-meal-1",
    arguments: { meals: [] }
  });

  assert.equal(harness.fallbackCreates, 1);
});
