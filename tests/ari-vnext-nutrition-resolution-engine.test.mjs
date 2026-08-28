import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools-core.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const adapter = await read("ari/vnext/ari-vnext-nutrition-resolution-adapter.js");
const initiative = await read("ari/vnext/ari-vnext-initiative.js");
const migration = await read("supabase/migrations/20260827131500_nutrition_resolution_engine.sql");
const correctionMigration = await read("supabase/migrations/20260827145000_nutrition_resolution_correction_consistency.sql");

function mealArgs(overrides = {}) {
  return {
    name: "Chicken and rice",
    mealCategory: "Lunch",
    items: [
      {
        userPhrase: "6 oz grilled chicken",
        foodText: "chicken breast",
        brand: "",
        state: "cooked",
        preparation: "grilled",
        measurementState: "cooked",
        quantity: 6,
        unit: "oz",
        servingHint: "6 oz cooked",
        fallbackCaloriesLow: 250,
        fallbackCaloriesMid: 285,
        fallbackCaloriesHigh: 320,
        fallbackProteinG: 52,
        fallbackCarbsG: 0,
        fallbackFatG: 7,
        fallbackAlcoholG: 0,
        fallbackConfidence: 0.75,
        fallbackReason: "Fallback for the requested portion only."
      }
    ],
    notes: "",
    ...overrides
  };
}

test("meal logging tool asks the model for food identity and bounded fallback, not final aggregate nutrition", () => {
  const tool = getAriTools({ nutrition: true }).find((entry) => entry?.name === "propose_log_meal");
  assert.ok(tool, "Nutrition route must expose propose_log_meal");
  const properties = tool.parameters?.properties || {};
  assert.ok(properties.items, "meal proposal must contain itemized foods");
  assert.equal(properties.calories, undefined);
  assert.equal(properties.proteinG, undefined);
  assert.equal(properties.carbsG, undefined);
  assert.equal(properties.fatG, undefined);

  const item = properties.items?.items?.properties || {};
  assert.deepEqual(item.measurementState?.enum, ["unknown", "raw", "cooked", "not_applicable"]);
  assert.ok(item.fallbackCaloriesLow && item.fallbackCaloriesMid && item.fallbackCaloriesHigh);
  assert.ok(item.fallbackAlcoholG);
});

test("resolved meal proposal validation keeps raw/cooked state explicit and maps to the existing trusted action", () => {
  const valid = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(mealArgs())
  }, { nutrition: true });
  assert.equal(valid.valid, true);
  assert.equal(valid.arguments.items[0].measurementState, "cooked");
  assert.equal(toolToApplicationAction("propose_log_meal"), "log_meal");

  const invalidArgs = mealArgs();
  invalidArgs.items[0].measurementState = "probably cooked";
  const invalid = validateToolCall({
    name: "propose_log_meal",
    arguments: JSON.stringify(invalidArgs)
  }, { nutrition: true });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, "meal_item_measurement_state_invalid");
});

test("dedicated nutrition model is used for logging only, not ordinary nutrition advice", () => {
  const logRoute = routeContext({ message: "Please log this meal: 6 oz chicken and 200 g rice." });
  assert.equal(logRoute.nutrition, true);
  assert.equal(logRoute.nutritionLogging, true);
  const loggingPolicy = resolveModelPolicy(logRoute);
  assert.equal(loggingPolicy.model, process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna");
  assert.equal(loggingPolicy.costTier, "nutrition_economy");
  assert.equal(loggingPolicy.nutritionResolutionModel, true);

  const adviceRoute = routeContext({ message: "How much protein should I eat at breakfast?" });
  assert.equal(adviceRoute.nutrition, true);
  assert.equal(adviceRoute.nutritionLogging, false);
  const advicePolicy = resolveModelPolicy(adviceRoute);
  assert.equal(advicePolicy.nutritionResolutionModel, false);
});

test("advanced accounts keep advanced nutrition advice but use Luna for routine meal logging", () => {
  const entitlement = {
    advancedEnabled: true,
    ownerEligible: true,
    accessClass: "owner",
    intelligenceTier: "owner_experimental",
    reasoningProfile: "adaptive"
  };

  const logging = resolveModelPolicy({
    nutrition: true,
    nutritionLogging: true,
    training: false,
    goals: false,
    social: false,
    health: false,
    developer: false,
    currentInfo: false,
    coachingState: false,
    complexity: "fast",
    intelligenceEntitlement: entitlement
  });
  assert.equal(logging.model, process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna");
  assert.equal(logging.costTier, "nutrition_economy");

  const advice = resolveModelPolicy({
    nutrition: true,
    nutritionLogging: false,
    training: false,
    goals: false,
    social: false,
    health: false,
    developer: false,
    currentInfo: false,
    coachingState: false,
    complexity: "fast",
    intelligenceEntitlement: entitlement
  });
  assert.equal(advice.model, process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6");
  assert.notEqual(advice.costTier, "nutrition_economy");
});

test("trusted browser resolver performs no second OpenAI request and uses the existing food search/calculator stack", () => {
  assert.match(adapter, /AriFoodRegistry/);
  assert.match(adapter, /AriFoodSearch/);
  assert.match(adapter, /AriFoodCalculator/);
  assert.match(adapter, /\/api\/ari-food-search/);
  assert.doesNotMatch(adapter, /\/v1\/responses/);
  assert.doesNotMatch(adapter, /OPENAI_API_KEY/);
});

test("resolver preserves serving basis, alcohol energy, and asks before raw/cooked weighted ambiguity", () => {
  assert.match(adapter, /nutrition_basis/);
  assert.match(adapter, /requested_portion_estimate/);
  assert.match(adapter, /protein \* 4 \+ carbs \* 4 \+ fat \* 9 \+ alcohol \* 7/);
  assert.match(adapter, /requiresMeasurementClarification/);
  assert.match(adapter, /raw_cooked_weight_ambiguous/);
  assert.match(adapter, /weighed before or after cooking/);
});

test("resolved executor uses Ari's Nutrition day and stable action-scoped mutation id for idempotent retry", () => {
  assert.match(adapter, /CalBuddy\?\.getNutritionWindow/);
  assert.match(adapter, /nutrition_date: nutritionDate/);
  assert.match(adapter, /mutationIdForAction\(action\)/);
  assert.match(adapter, /sessionStorage\.setItem\(key, id\)/);
  assert.match(adapter, /Keep the action-scoped mutation UUID for retry/);
  assert.match(adapter, /ari_log_resolved_nutrition_meal/);
});

test("resolved Nutrition schema stores item provenance and personal mappings behind RLS and one atomic RPC", () => {
  assert.match(migration, /create table if not exists public\.nutrition_meal_components/);
  assert.match(migration, /create table if not exists public\.nutrition_resolution_events/);
  assert.match(migration, /create table if not exists public\.ari_user_food_mappings/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /using \(auth\.uid\(\) = user_id\)/);
  assert.match(migration, /create or replace function public\.ari_log_resolved_nutrition_meal/);
  assert.match(migration, /security definer/);
  assert.match(migration, /ari_nutrition_mutations/);
  assert.match(migration, /identity_confidence >= 0\.90/);
  assert.match(migration, /nutrition_confidence >= 0\.90/);
});

test("manual nutrition corrections invalidate stale resolved evidence without deleting provenance", () => {
  assert.match(correctionMigration, /add column if not exists invalidated_at timestamptz null/);
  assert.match(correctionMigration, /invalidated_by_mutation_id uuid null/);
  assert.match(correctionMigration, /using \(auth\.uid\(\) = user_id and invalidated_at is null\)/);
  assert.match(correctionMigration, /set invalidated_at = now\(\),\s*invalidated_by_mutation_id = p_mutation_id/);
  assert.match(correctionMigration, /invalidation_reason = 'meal_nutrition_manually_corrected'/);
  assert.match(correctionMigration, /'resolutionMaterialChange', v_resolution_material_change/);
  assert.match(correctionMigration, /'resolutionInvalidated', \(v_components_invalidated > 0 or v_resolution_events_invalidated > 0\)/);
  assert.doesNotMatch(correctionMigration, /delete from public\.nutrition_meal_components/);

  const materialFields = correctionMigration.match(/v_resolution_material_change := p_changes \?\| array\[([\s\S]*?)\];/)?.[1] || "";
  for (const field of ["calories", "protein_g", "carbs_g", "fat_g", "serving_size", "multiplier"]) {
    assert.match(materialFields, new RegExp(`'${field}'`));
  }
  assert.doesNotMatch(materialFields, /'name'|'category'/);
});

test("Undo is newest-first and restores provenance only after material corrections are gone", () => {
  assert.match(correctionMigration, /create or replace function public\.ari_restore_nutrition_resolution_after_undo/);
  assert.match(correctionMigration, /old\.status = 'applied'/);
  assert.match(correctionMigration, /new\.status = 'undone'/);
  assert.match(correctionMigration, /later\.status = 'applied'/);
  assert.match(correctionMigration, /later\.created_at > new\.created_at/);
  assert.match(correctionMigration, /raise exception 'Undo the newest meal correction first\.'/);
  assert.match(correctionMigration, /v_has_applied_material_correction/);
  assert.match(correctionMigration, /resolutionMaterialChange/);
  assert.match(correctionMigration, /and invalidated_at is not null/);
  assert.match(correctionMigration, /set invalidated_at = null,\s*invalidated_by_mutation_id = null/);
  assert.doesNotMatch(correctionMigration, /invalidated_by_mutation_id = new\.id/);
  assert.match(correctionMigration, /after update of status on public\.ari_nutrition_mutations/);
});

test("final capability bootstrap requires Nutrition, Phase 8C, and Phase 9B trust layers", () => {
  assert.match(initiative, /const VERSION = "1\.5\.0"/);
  assert.match(initiative, /ari-vnext-nutrition-resolution-adapter\.js\?v=1\.1\.0/);
  assert.match(initiative, /AriVNextNutritionResolutionAdapter\?\.ready === true/);
  assert.match(initiative, /ari-vnext-operation-registry-phase8c\.js\?v=1\.0\.0/);
  assert.match(initiative, /AriVNextOperationRegistryPhase8C\?\.ready === true/);
  assert.match(initiative, /ari-vnext-phase9b-correction-continuity\.js\?v=1\.0\.0/);
  assert.match(initiative, /AriVNextPhase9BCorrectionContinuity\?\.ready === true/);
});
