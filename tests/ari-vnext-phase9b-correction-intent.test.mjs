import assert from "node:assert/strict";
import test from "node:test";

import {
  reviewDeterministicRoutineLogIntent,
  reviewExplicitApplicationIntent
} from "../api/_lib/ari-vnext/action-intent-verifier.js";
import { resolveReferenceTarget } from "../api/_lib/ari-vnext/reference-context.js";
import { validateToolCall } from "../api/_lib/ari-vnext/tools.js";

function meal({ id, name, category = "lunch", date = "2026-08-26", ordinal = 1 }) {
  return {
    referenceId: id,
    state: "persisted",
    domain: "nutrition",
    entityType: "meal",
    label: name,
    canonical: { id, nutritionDate: date },
    details: {
      collection: "recent_meals",
      ordinal,
      name,
      mealCategory: category,
      nutritionDate: date
    },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

function superseded(operation = "update_nutrition_meal", previousReferenceId = "ref_live_meal_dinner") {
  return {
    state: "superseded",
    operation,
    previousReferenceId,
    executable: false,
    supersededAt: new Date().toISOString()
  };
}

test("Phase 9B no-I-meant can prepare a corrected proposal only for the same superseded operation", async () => {
  const references = [
    meal({ id: "ref_live_meal_lunch", name: "Chicken Wrap", category: "lunch", ordinal: 1 }),
    meal({ id: "ref_live_meal_dinner", name: "Salmon Dinner", category: "dinner", ordinal: 2 })
  ];
  const turn = {
    message: "No, I meant the lunch.",
    context: {
      referenceState: {
        references,
        supersededPendingAction: superseded("update_nutrition_meal", "ref_live_meal_dinner")
      }
    }
  };
  const route = { nutrition: true };
  const functionCall = {
    name: "propose_update_nutrition_meal",
    arguments: JSON.stringify({
      referenceId: "ref_live_meal_lunch",
      changes: [{ field: "calories", numberValue: 500, textValue: null }]
    })
  };

  const review = await reviewExplicitApplicationIntent({
    turn,
    route,
    tools: [{ type: "function", name: "propose_update_nutrition_meal" }],
    functionCall
  });
  const validation = validateToolCall(functionCall, route);

  assert.equal(review?.decision, "propose_update_nutrition_meal");
  assert.equal(review?.source, "deterministic_reference_correction_supersession");
  assert.equal(review?.model, null);
  assert.equal(route.referenceResolution?.selectedReferenceId, "ref_live_meal_lunch");
  assert.equal(validation.valid, true, validation.error);
});

test("Phase 9B correction context cannot switch an update proposal into a delete", () => {
  const turn = {
    message: "No, I meant the lunch.",
    context: {
      referenceState: {
        supersededPendingAction: superseded("update_nutrition_meal")
      }
    }
  };

  const review = reviewDeterministicRoutineLogIntent({
    turn,
    route: { nutrition: true },
    functionCall: {
      name: "propose_undo_nutrition_mutation",
      arguments: JSON.stringify({ referenceId: "ref_live_meal_lunch" })
    },
    availableTools: ["propose_undo_nutrition_mutation"]
  });

  assert.equal(review, null);
});

test("Phase 9B executable or malformed superseded context never authorizes a correction", () => {
  for (const supersededPendingAction of [
    { state: "pending_confirmation", operation: "update_nutrition_meal", executable: false },
    { state: "superseded", operation: "update_nutrition_meal", executable: true },
    { state: "superseded", operation: "delete_activity_log", executable: false }
  ]) {
    const review = reviewDeterministicRoutineLogIntent({
      turn: {
        message: "No, I meant the lunch.",
        context: { referenceState: { supersededPendingAction } }
      },
      route: { nutrition: true },
      functionCall: { name: "propose_update_nutrition_meal" },
      availableTools: ["propose_update_nutrition_meal"]
    });
    assert.equal(review, null);
  }
});

test("Phase 9B edit to edit to undo keeps the same authoritative reference target", () => {
  const references = [
    meal({ id: "ref_live_meal_chicken", name: "Chicken Burrito Bowl", category: "lunch", ordinal: 1 })
  ];

  const firstEdit = resolveReferenceTarget({
    message: "Actually change the chicken to 8 ounces.",
    referenceState: { references },
    route: { nutrition: true }
  });
  const secondEdit = resolveReferenceTarget({
    message: "Actually make the chicken 10 ounces instead.",
    referenceState: { references },
    route: { nutrition: true }
  });
  const undo = resolveReferenceTarget({
    message: "Undo that.",
    referenceState: { references },
    route: { nutrition: true }
  });

  assert.equal(firstEdit.selectedReferenceId, "ref_live_meal_chicken");
  assert.equal(secondEdit.selectedReferenceId, "ref_live_meal_chicken");
  assert.equal(undo.selectedReferenceId, "ref_live_meal_chicken");
});

test("Phase 9B long correction chains stop on ambiguity and resume only after an exact selector", () => {
  const references = [
    meal({ id: "ref_live_meal_lunch_26", name: "Chicken Wrap", category: "lunch", date: "2026-08-26", ordinal: 1 }),
    meal({ id: "ref_live_meal_lunch_27", name: "Turkey Wrap", category: "lunch", date: "2026-08-27", ordinal: 2 }),
    meal({ id: "ref_live_meal_dinner", name: "Salmon Dinner", category: "dinner", date: "2026-08-27", ordinal: 3 })
  ];

  const ambiguous = resolveReferenceTarget({
    message: "No, I meant the lunch.",
    referenceState: { references },
    route: { nutrition: true }
  });
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.requiresClarification, true);
  assert.equal(ambiguous.selectedReferenceId, null);

  const corrected = resolveReferenceTarget({
    message: "No, I meant the 2026-08-26 lunch.",
    referenceState: { references },
    route: { nutrition: true }
  });
  assert.equal(corrected.status, "resolved");
  assert.equal(corrected.selectedReferenceId, "ref_live_meal_lunch_26");
});
