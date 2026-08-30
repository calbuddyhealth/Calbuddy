import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makePending(id = "meal-plan-1", overrides = {}) {
  return {
    id,
    name: "plan_meal",
    sourceTurnId: `turn-${id}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    sourceMessage: "Plan me lunch today",
    arguments: {
      budgetBasis: "daily_goal",
      targetCalories: null,
      meals: [
        {
          mealSlot: "lunch",
          name: "Chicken rice bowl",
          calories: 620,
          proteinG: 52,
          carbsG: 68,
          fatG: 14,
          servingSize: "1 bowl",
          items: []
        }
      ],
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
      return { id: "legacy-meal-plan", ...action };
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
        ? { success: true, planned: action.payload.meals.length }
        : { success: false, message: "Meal Plan write failed." };
    }
  };

  const adapter = {
    async prepareCalBuddyAction(pending) {
      prepared.push(pending);
      if (!prepareSuccess) {
        return {
          success: false,
          code: "meal_plan_slot_already_active",
          message: "Today’s lunch already has an active Meal Plan."
        };
      }

      return {
        success: true,
        action: {
          action_type: "plan_meal",
          payload: {
            meals: [
              {
                plan_date: "2026-08-30",
                meal_slot: "lunch",
                name: "Chicken rice bowl",
                calories: 620,
                protein_g: 52,
                carbs_g: 68,
                fat_g: 14,
                serving_size: "1 bowl",
                items: [
                  {
                    id: "whole-meal-0",
                    name: "Chicken rice bowl",
                    amount: "1 bowl",
                    calories: 620,
                    protein_g: 52,
                    carbs_g: 68,
                    fat_g: 14
                  }
                ],
                notes: ""
              }
            ],
            plan_date: "2026-08-30",
            source: "ari_vnext_meal_plan_adapter",
            requested_from_message: pending.sourceMessage,
            vnext_action_id: pending.id
          },
          confirmation_text: "Add Chicken rice bowl — about 620 kcal — to today’s lunch Meal Plan?"
        },
        resolution: {
          todayOnly: true,
          budgetBasis: "daily_goal",
          targetCalories: null,
          totalCalories: 620,
          mealSlots: ["lunch"]
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

test("registry owns plan_meal while preserving canonical Meal Plan preparation", async () => {
  const harness = makeHarness();
  const registry = harness.window.AriVNextOperationRegistry;
  assert.equal(registry.version, "1.7.0");
  assert.equal(registry.hasOperation("plan_meal"), true);

  const pending = makePending();
  const mapped = await harness.adapter.createCalBuddyPendingAction(pending);

  assert.equal(mapped.success, true);
  assert.equal(mapped.action.action_type, "plan_meal");
  assert.equal(mapped.action.payload.meals.length, 1);
  assert.equal(mapped.action.payload.meals[0].meal_slot, "lunch");
  assert.equal(mapped.action.payload.meals[0].calories, 620);
  assert.equal(mapped.action.vnext_action_id, pending.id);
  assert.equal(mapped.action.vnext_source_turn_id, pending.sourceTurnId);
  assert.equal(mapped.resolution.operation, "plan_meal");
  assert.equal(mapped.resolution.budgetBasis, "daily_goal");
  assert.equal(mapped.resolution.totalCalories, 620);
  assert.equal(harness.prepared.length, 1);
  assert.equal(harness.fallbackCreates, 0);
});

test("Meal Plan preparation failure cannot create an executable pending action", async () => {
  const harness = makeHarness({ prepareSuccess: false });
  const result = await harness.adapter.createCalBuddyPendingAction(makePending("meal-plan-conflict"));

  assert.equal(result.success, false);
  assert.equal(result.code, "meal_plan_slot_already_active");
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.executed.length, 0);
  assert.equal(harness.fallbackCreates, 0);
});

test("confirmed Meal Plan executes exactly once with original vNext identity", async () => {
  const harness = makeHarness();
  const pending = makePending("meal-plan-success");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({
    vnextPendingAction: pending,
    currentTurnId: "confirm-meal-plan"
  });

  assert.equal(execution.success, true);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.executed[0].action_type, "plan_meal");
  assert.equal(harness.executed[0].payload.meals[0].meal_slot, "lunch");
  assert.equal(harness.executed[0].vnext_action_id, pending.id);
  assert.equal(harness.executed[0].vnext_confirmation_turn_id, "confirm-meal-plan");
  assert.equal(harness.bridgePending, null);
  assert.equal(harness.legacyPending, null);
  assert.equal(harness.fallbackExecutes, 0);
});

test("failed Meal Plan execution preserves matching pending state for retry", async () => {
  const harness = makeHarness({ executeSuccess: false });
  const pending = makePending("meal-plan-failure");
  harness.setBridgePending(pending);
  await harness.adapter.createCalBuddyPendingAction(pending);

  const execution = await harness.adapter.executeConfirmed({ vnextPendingAction: pending });

  assert.equal(execution.success, false);
  assert.equal(harness.executed.length, 1);
  assert.equal(harness.bridgePending.id, pending.id);
  assert.equal(harness.legacyPending.vnext_action_id, pending.id);
});
