import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { buildReferencePacket } from "../api/_lib/ari-vnext/reference-context.js";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-authoritative-reference-rehydration.js", import.meta.url),
  "utf8"
);

function makeSandbox(context) {
  const events = [];
  const window = {
    Ari: {},
    CalBuddy: {
      createPendingAction: async (action) => ({ ...action, stored: true }),
      setPendingAction: () => {},
      cancelPendingAction: () => {},
      undoNutritionMutation: async (mutationId) => ({ success: true, mutationId })
    },
    AriVNextBridge: {
      buildContext: async () => structuredClone(context)
    },
    AriVNextActionAdapter: {
      createCalBuddyPendingAction: async () => ({ success: false, code: "base_should_not_handle_live_reference" }),
      executeConfirmed: async () => ({ success: false, code: "base_should_not_execute_live_reference" }),
      prepareCalBuddyAction: async () => ({ success: false }),
      getWorkoutController: async () => null
    },
    AriVNextNutritionReferenceAdapter: {
      updateReferencedMeal: async ({ mealId, changes }) => ({
        success: true,
        meal: { id: mealId, name: "Chicken Burrito Bowl", calories: changes?.[0]?.numberValue ?? 650 }
      })
    },
    AriVNextWeightAdapter: {
      updateReferencedWeight: async ({ logDate, value, unit }) => ({ success: true, logDate, value, unit }),
      deleteReferencedWeight: async ({ logDate }) => ({ success: true, logDate, deleted: true })
    },
    AriVNextActivityAdapter: {
      updateReferencedActivity: async ({ activityId, logDate }) => ({ success: true, activity: { id: activityId, log_date: logDate } }),
      deleteReferencedActivity: async ({ activityId, logDate }) => ({ success: true, activityId, logDate, deleted: true })
    },
    dispatchEvent: (event) => events.push(event),
    setInterval: () => 1,
    clearInterval: () => {}
  };

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const sandbox = {
    window,
    CustomEvent,
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    JSON,
    Promise,
    structuredClone
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "ari-vnext-authoritative-reference-rehydration.js" });
  return { sandbox, window, events };
}

function canonicalContext() {
  return {
    mealsToday: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Chicken Burrito Bowl",
        calories: 720,
        category: "Lunch",
        nutrition_date: "2026-08-27",
        mutation_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Greek Yogurt",
        calories: 180,
        category: "Snack",
        nutrition_date: "2026-08-27"
      }
    ],
    recentMeals: [],
    recentWeights: [
      { id: "weight-row", log_date: "2026-08-27", weight: 185.2, unit: "lb" }
    ],
    trainingToday: {
      type: "workout",
      date: "2026-08-27",
      title: "Chest Day",
      completed: false,
      exercises: [{ id: "bench", name: "Bench Press" }]
    },
    recentTraining: [],
    training: {
      activityLogs: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          activity_name: "Walk",
          log_date: "2026-08-27",
          duration_minutes: 30,
          calories_burned: 150
        }
      ]
    },
    referenceState: { references: [] }
  };
}

test("authoritative rehydration is a pointer layer with no durable reference store or second model call", () => {
  new vm.Script(source, { filename: "ari-vnext-authoritative-reference-rehydration.js" });
  assert.match(source, /rehydratedFromAuthoritativeState: true/);
  assert.match(source, /staleCheckRequiredBeforeWrite: true/);
  assert.match(source, /verifiedByTrustedContext: true/);
  assert.match(source, /currentContextRead: true/);
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem|removeItem)/);
  assert.doesNotMatch(source, /sessionStorage\.(?:getItem|setItem|removeItem)/);
  assert.doesNotMatch(source, /\/v1\/responses|OPENAI_API_KEY|\/api\/ari-vnext["'`]/);
});

test("canonical meals, weights, workouts, and manual activities rehydrate after empty browser reference state", async () => {
  const { window } = makeSandbox(canonicalContext());
  const context = await window.AriVNextBridge.buildContext({
    message: "What did I eat and train today?",
    history: []
  });
  const refs = context.referenceState.references;

  assert.equal(context.referenceState.authoritativeRehydrationVersion, "1.0.0");
  for (const type of ["meal", "weight_log", "workout", "activity_log"]) {
    assert.ok(refs.some((reference) => reference.entityType === type), type);
  }

  const meals = refs.filter((reference) => reference.entityType === "meal");
  assert.equal(meals[0].details.collection, "meals_today");
  assert.equal(meals[0].details.ordinal, 1);
  assert.equal(meals[1].details.ordinal, 2);
  assert.equal(meals[0].verification.rehydratedFromAuthoritativeState, true);
  assert.equal(meals[0].verification.staleCheckRequiredBeforeWrite, true);
});

test("rehydrated references keep canonical identity stable across a fresh capability instance", async () => {
  const first = makeSandbox(canonicalContext());
  const firstContext = await first.window.AriVNextBridge.buildContext({ message: "Show my meals", history: [] });
  const firstId = firstContext.referenceState.references.find((reference) => reference.label === "Chicken Burrito Bowl")?.referenceId;

  const second = makeSandbox(canonicalContext());
  const secondContext = await second.window.AriVNextBridge.buildContext({ message: "Show my meals", history: [] });
  const secondId = secondContext.referenceState.references.find((reference) => reference.label === "Chicken Burrito Bowl")?.referenceId;

  assert.ok(firstId?.startsWith("ref_live_meal_"));
  assert.equal(secondId, firstId);
});

test("live meal correction maps the opaque reference to the exact canonical meal and uses the trusted executor", async () => {
  const { window } = makeSandbox(canonicalContext());
  const context = await window.AriVNextBridge.buildContext({ message: "What did I eat today?", history: [] });
  const meal = context.referenceState.references.find((reference) => reference.label === "Chicken Burrito Bowl");
  assert.ok(meal);

  const pending = {
    id: "turn-action-1",
    sourceTurnId: "turn-1",
    name: "update_nutrition_meal",
    arguments: {
      referenceId: meal.referenceId,
      changes: [{ field: "calories", numberValue: 650 }]
    }
  };

  const mapped = await window.AriVNextActionAdapter.createCalBuddyPendingAction(pending);
  assert.equal(mapped.success, true);
  assert.equal(mapped.action.payload.meal_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(mapped.action.payload.reference_id, meal.referenceId);

  const execution = await window.AriVNextActionAdapter.executeConfirmed({ vnextPendingAction: pending, currentTurnId: "turn-2" });
  assert.equal(execution.success, true);
  assert.equal(execution.authoritativeReference.referenceId, meal.referenceId);
  assert.equal(execution.authoritativeReference.staleCheckedByTrustedExecutor, true);
  assert.equal(execution.result.meal.id, "11111111-1111-4111-8111-111111111111");
});

test("trusted executor stale-target failure is propagated instead of falling back to a guessed object", async () => {
  const { window } = makeSandbox(canonicalContext());
  const context = await window.AriVNextBridge.buildContext({ message: "What did I eat today?", history: [] });
  const meal = context.referenceState.references.find((reference) => reference.label === "Chicken Burrito Bowl");
  window.AriVNextNutritionReferenceAdapter.updateReferencedMeal = async () => ({
    success: false,
    code: "nutrition_reference_not_found",
    message: "That meal no longer exists."
  });

  const pending = {
    id: "turn-action-stale",
    sourceTurnId: "turn-stale",
    name: "update_nutrition_meal",
    arguments: {
      referenceId: meal.referenceId,
      changes: [{ field: "calories", numberValue: 650 }]
    }
  };
  const execution = await window.AriVNextActionAdapter.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(execution.success, false);
  assert.equal(execution.code, "nutrition_reference_not_found");
});

test("server reference packet treats rehydrated current objects as authoritative targets but never write permission", () => {
  const references = [1, 2].map((ordinal) => ({
    referenceId: `ref_live_meal_${ordinal}`,
    actionName: "current_nutrition_meal",
    domain: "nutrition",
    entityType: "meal",
    label: ordinal === 1 ? "Chicken Burrito Bowl" : "Greek Yogurt",
    state: "persisted",
    canonical: { id: `meal-${ordinal}` },
    details: { collection: "meals_today", ordinal },
    verification: {
      verifiedByTrustedContext: true,
      currentContextRead: true,
      rehydratedFromAuthoritativeState: true,
      staleCheckRequiredBeforeWrite: true
    }
  }));

  const packet = buildReferencePacket({
    message: "Change the second one.",
    history: [{ role: "assistant", content: "You have a burrito bowl and Greek yogurt today." }],
    context: { referenceState: { references } }
  }, { nutrition: true });

  assert.equal(packet?.active, true);
  assert.equal(packet?.candidates?.[0]?.authoritative, true);
  assert.equal(packet?.candidates?.[1]?.authoritative, true);
  assert.equal(packet?.candidates?.[0]?.details?.collection, "meals_today");
  assert.equal(packet?.policy?.useExplicitOrdinalWithinSameCollection, true);
  assert.equal(packet?.policy?.clarifyWhenAmbiguous, true);
  assert.equal(packet?.policy?.currentTrustedContextNeverGrantsWritePermission, true);
});