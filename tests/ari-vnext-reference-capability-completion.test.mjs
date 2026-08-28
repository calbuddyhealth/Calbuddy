import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { getAriTools, validateToolCall, toolToApplicationAction } from "../api/_lib/ari-vnext/tools.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const extension = read("ari/vnext/ari-vnext-reference-capability-extension.js");
const nutritionAdapter = read("ari/vnext/ari-vnext-nutrition-reference-adapter.js");
const nutritionService = read("js/nutrition/nutrition-service.js");
const weightAdapter = read("ari/vnext/ari-vnext-weight-adapter.js");
const initiative = read("ari/vnext/ari-vnext-initiative.js");
const migration = read("supabase/migrations/20260827010000_nutrition_reference_meal_update.sql");

function names(route) {
  return getAriTools(route).map((tool) => tool.name);
}

test("reference tools expose meal, weight, activity, and workout mutation symmetry", () => {
  const nutrition = names({ nutrition: true });
  assert.ok(nutrition.includes("propose_update_nutrition_meal"));
  assert.ok(nutrition.includes("propose_undo_nutrition_mutation"));

  const training = names({ training: true });
  assert.ok(training.includes("propose_update_activity_log"));
  assert.ok(training.includes("propose_delete_activity_log"));
  assert.ok(training.includes("propose_edit_referenced_workout"));
  assert.ok(training.includes("propose_delete_workout"));

  const goals = names({ goals: true });
  assert.ok(goals.includes("propose_update_weight_log"));
  assert.ok(goals.includes("propose_delete_weight_log"));
});

test("meal reference edits accept only explicit bounded fields", () => {
  const valid = validateToolCall({
    name: "propose_update_nutrition_meal",
    arguments: JSON.stringify({
      referenceId: "ref_action_abc123",
      changes: [
        { field: "calories", numberValue: 450, textValue: null },
        { field: "protein_g", numberValue: 40, textValue: null }
      ]
    })
  }, { nutrition: true });
  assert.equal(valid.valid, true, valid.error || "valid meal edit rejected");

  const invalid = validateToolCall({
    name: "propose_update_nutrition_meal",
    arguments: JSON.stringify({
      referenceId: "ref_action_abc123",
      changes: [{ field: "user_id", numberValue: null, textValue: "other-user" }]
    })
  }, { nutrition: true });
  assert.equal(invalid.valid, false);
});

test("weight and workout reference tools never accept canonical database identity from the model", () => {
  const weight = validateToolCall({
    name: "propose_update_weight_log",
    arguments: JSON.stringify({ referenceId: "ref_action_weight1", value: 185.8, unit: "lb" })
  }, { goals: true });
  assert.equal(weight.valid, true, weight.error || "valid weight edit rejected");
  assert.deepEqual(Object.keys(weight.arguments).sort(), ["referenceId", "unit", "value"]);

  const workout = validateToolCall({
    name: "propose_edit_referenced_workout",
    arguments: JSON.stringify({
      referenceId: "ref_action_workout1",
      operation: "update",
      exercise: "",
      replacementExercise: "",
      sets: null,
      reps: null,
      restSeconds: null,
      position: null,
      durationMinutes: 45,
      title: "",
      instruction: "Make it 45 minutes"
    })
  }, { training: true });
  assert.equal(workout.valid, true, workout.error || "valid referenced workout edit rejected");
  assert.equal(workout.arguments.dateText, undefined);
});

test("current-turn language deterministically authorizes reference corrections but facts do not", () => {
  const route = { nutrition: true };
  const availableTools = ["propose_update_nutrition_meal"];
  const direct = reviewDeterministicRoutineLogIntent({
    turn: { message: "Actually make that 450 calories." },
    route,
    functionCall: { name: "propose_update_nutrition_meal" },
    availableTools
  });
  assert.equal(direct?.decision, "propose_update_nutrition_meal");
  assert.equal(direct?.source, "deterministic_reference_meal_update");

  const fact = reviewDeterministicRoutineLogIntent({
    turn: { message: "That meal was 450 calories." },
    route,
    functionCall: { name: "propose_update_nutrition_meal" },
    availableTools
  });
  assert.equal(fact, null);
});

test("reference application action mapping stays explicit", () => {
  assert.equal(toolToApplicationAction("propose_update_nutrition_meal"), "update_nutrition_meal");
  assert.equal(toolToApplicationAction("propose_update_weight_log"), "update_weight_log");
  assert.equal(toolToApplicationAction("propose_delete_weight_log"), "delete_weight_log");
  assert.equal(toolToApplicationAction("propose_edit_referenced_workout"), "edit_referenced_workout");
  assert.equal(toolToApplicationAction("propose_delete_workout"), "delete_workout");
});

test("meal edits are journaled and Undo restores edits instead of deleting the meal", () => {
  assert.match(migration, /create or replace function public\.ari_update_nutrition_meal/);
  assert.match(migration, /'update_meal'/);
  assert.match(migration, /previousMutationId/);
  assert.match(migration, /elsif v_mutation\.action_type = 'update_meal'/);
  assert.match(migration, /returning \* into v_meal/);
  assert.match(migration, /grant execute on function public\.ari_update_nutrition_meal/);
});

test("browser extension resolves canonical pointers and delegates to trusted adapters", () => {
  assert.match(extension, /verified\(reference, \{ domain: "nutrition", entityType: "meal" \}\)/);
  assert.match(extension, /AriVNextNutritionReferenceAdapter\?\.updateReferencedMeal/);
  assert.match(extension, /AriVNextWeightAdapter/);
  assert.match(extension, /prepareCalBuddyAction\?\.\(synthetic\)/);
  assert.match(extension, /executeValidatedWorkoutEdit/);
  assert.match(extension, /controller\.clearDate/);
  assert.match(extension, /restoreReferenceAfterEditUndo/);
  assert.doesNotMatch(extension, /localStorage\.setItem\([^)]*reference/i);
});

test("trusted meal and weight persistence remains user-scoped after service consolidation", () => {
  assert.match(nutritionAdapter, /NutritionService/);
  assert.match(nutritionAdapter, /service\.updateMeal/);
  assert.doesNotMatch(nutritionAdapter, /\.rpc\(/);
  assert.match(nutritionService, /ari_update_nutrition_meal/);
  assert.match(nutritionService, /currentSession/);
  assert.match(weightAdapter, /\.eq\("user_id", auth\.userId\)/);
  assert.match(weightAdapter, /\.eq\("user_id", resolved\.userId\)/);
});

test("runtime's last dependency does not report ready until reference capabilities load", () => {
  assert.match(initiative, /ari-vnext-nutrition-reference-adapter\.js\?v=1\.0\.0/);
  assert.match(initiative, /ari-vnext-weight-adapter\.js\?v=1\.0\.0/);
  assert.match(initiative, /ari-vnext-reference-capability-extension\.js\?v=1\.0\.0/);
  assert.match(initiative, /installCapabilities\(\)\s*\.then/);
  assert.match(initiative, /window\.AriVNextInitiative = createClient\(\)/);
});
