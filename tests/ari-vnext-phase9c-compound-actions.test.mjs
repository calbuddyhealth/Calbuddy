import assert from "node:assert/strict";
import test from "node:test";

import {
  findFunctionCalls,
  prepareCompoundActionBatch,
  splitCompoundActionClauses
} from "../api/_lib/ari-vnext/compound-actions.js";

function tool(name) {
  return { type: "function", name };
}

function mealRef(id, name, ordinal = 1) {
  return {
    referenceId: id,
    state: "persisted",
    domain: "nutrition",
    entityType: "meal",
    label: name,
    canonical: { id },
    details: { collection: "meals_today", ordinal, name, mealCategory: ordinal === 1 ? "lunch" : "dinner" },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

function workoutRef(id, title, ordinal = 1) {
  return {
    referenceId: id,
    state: "persisted",
    domain: "training",
    entityType: "workout",
    label: title,
    canonical: { id, date: "2026-08-27" },
    details: { collection: "recent_workouts", ordinal, title, date: "2026-08-27" },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };
}

function call(name, callId, args) {
  return { type: "function_call", name, call_id: callId, arguments: JSON.stringify(args) };
}

const updateWorkoutArgs = (referenceId, overrides = {}) => ({
  referenceId,
  operation: "update",
  exercise: "Bench Press",
  replacementExercise: "",
  sets: 4,
  reps: null,
  restSeconds: null,
  position: null,
  durationMinutes: null,
  title: "",
  instruction: "Increase Bench Press to 4 sets.",
  ...overrides
});

const moveWorkoutArgs = (referenceId) => ({
  referenceId,
  operation: "move",
  exercise: "Squats",
  replacementExercise: "",
  sets: null,
  reps: null,
  restSeconds: null,
  position: 1,
  durationMinutes: null,
  title: "",
  instruction: "Move Squats before Leg Press."
});

test("Phase 9C finds every model function call instead of silently taking the first", () => {
  const output = [
    { type: "message", content: [] },
    call("propose_update_nutrition_meal", "call_1", { referenceId: "ref_live_meal_a", changes: [] }),
    call("propose_update_weight_log", "call_2", { referenceId: "ref_live_weight_log_a", value: 185, unit: "lb" })
  ];
  assert.equal(findFunctionCalls(output).length, 2);
});

test("Phase 9C splits then/and-verb compound language without splitting ordinary noun phrases", () => {
  assert.deepEqual(
    splitCompoundActionClauses("Change that workout, then move squats before leg press", 2),
    ["Change that workout", "move squats before leg press"]
  );
  assert.deepEqual(
    splitCompoundActionClauses("Change the chicken and rice bowl to 650 calories and update the serving size", 2),
    ["Change the chicken and rice bowl to 650 calories", "update the serving size"]
  );
});

test("Phase 9C prepares two independently authorized edits against the same authoritative workout", () => {
  const referenceId = "ref_live_workout_chest";
  const result = prepareCompoundActionBatch({
    turn: {
      message: "Change that workout to 4 bench sets, then move squats before leg press",
      context: { referenceState: { references: [workoutRef(referenceId, "Chest Day")] } }
    },
    route: { training: true },
    tools: [tool("propose_edit_referenced_workout")],
    functionCalls: [
      call("propose_edit_referenced_workout", "call_1", updateWorkoutArgs(referenceId)),
      call("propose_edit_referenced_workout", "call_2", moveWorkoutArgs(referenceId))
    ]
  });

  assert.equal(result.valid, true);
  assert.equal(result.actions.length, 2);
  assert.equal(result.actions[0].name, "edit_referenced_workout");
  assert.equal(result.actions[1].name, "edit_referenced_workout");
  assert.equal(result.actions[0].referenceResolution.selectedReferenceId, referenceId);
  assert.equal(result.actions[1].referenceResolution.selectedReferenceId, referenceId);
  assert.equal(result.policy.allSubactionsIndependentlyAuthorized, true);
});

test("Phase 9C blocks the whole batch when one clause has an ambiguous target", () => {
  const refs = [
    workoutRef("ref_live_workout_a", "Chest Day", 1),
    workoutRef("ref_live_workout_b", "Leg Day", 2)
  ];
  const result = prepareCompoundActionBatch({
    turn: {
      message: "Change the first workout to 4 bench sets, then move squats in that workout",
      context: { referenceState: { references: refs } }
    },
    route: { training: true },
    tools: [tool("propose_edit_referenced_workout")],
    functionCalls: [
      call("propose_edit_referenced_workout", "call_1", updateWorkoutArgs("ref_live_workout_a")),
      call("propose_edit_referenced_workout", "call_2", moveWorkoutArgs("ref_live_workout_a"))
    ]
  });

  assert.equal(result.valid, false);
  assert.equal(result.requiresClarification, true);
  assert.equal(result.failedIndex, 1);
  assert.equal(result.error, "reference_target_ambiguous");
});

test("Phase 9C refuses a model-selected reference that does not match that clause's deterministic target", () => {
  const refs = [
    mealRef("ref_live_meal_lunch", "Chicken Bowl", 1),
    mealRef("ref_live_meal_dinner", "Salmon Bowl", 2)
  ];
  const result = prepareCompoundActionBatch({
    turn: {
      message: "Change the lunch to 650 calories, then change the dinner to 700 calories",
      context: { referenceState: { references: refs } }
    },
    route: { nutrition: true },
    tools: [tool("propose_update_nutrition_meal")],
    functionCalls: [
      call("propose_update_nutrition_meal", "call_1", {
        referenceId: "ref_live_meal_dinner",
        changes: [{ field: "calories", numberValue: 650, textValue: null }]
      }),
      call("propose_update_nutrition_meal", "call_2", {
        referenceId: "ref_live_meal_dinner",
        changes: [{ field: "calories", numberValue: 700, textValue: null }]
      })
    ]
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, "reference_target_mismatch");
  assert.equal(result.failedIndex, 0);
});

test("Phase 9C rejects update+delete conflicts against the same target before confirmation", () => {
  const referenceId = "ref_live_meal_lunch";
  const result = prepareCompoundActionBatch({
    turn: {
      message: "Change that meal to 650 calories, then delete that meal",
      context: { referenceState: { references: [mealRef(referenceId, "Chicken Bowl")] } }
    },
    route: { nutrition: true },
    tools: [tool("propose_update_nutrition_meal"), tool("propose_undo_nutrition_mutation")],
    functionCalls: [
      call("propose_update_nutrition_meal", "call_1", {
        referenceId,
        changes: [{ field: "calories", numberValue: 650, textValue: null }]
      }),
      call("propose_undo_nutrition_mutation", "call_2", { referenceId })
    ]
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, "compound_destructive_conflict");
  assert.equal(result.requiresClarification, true);
});

test("Phase 9C does not batch unsupported non-deterministic mutations", () => {
  const result = prepareCompoundActionBatch({
    turn: { message: "Create a meetup, then update my goal", context: { referenceState: { references: [] } } },
    route: { social: true, circleAllowed: true, goals: true },
    tools: [tool("propose_create_circle_meetup"), tool("propose_update_goal")],
    functionCalls: [
      call("propose_create_circle_meetup", "call_1", {}),
      call("propose_update_goal", "call_2", {})
    ]
  });
  assert.equal(result.valid, false);
  assert.equal(result.error, "compound_subaction_not_explicit");
});
