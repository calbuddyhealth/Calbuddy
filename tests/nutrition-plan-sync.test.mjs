import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const client = fs.readFileSync(path.join(root, "js/nutrition-transaction-client.js"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820124500_nutrition_plan_sync_identity_conflicts.sql"),
  "utf8"
);

test("Meal Plan synchronization is decommissioned from the active browser client", () => {
  assert.doesNotThrow(() => new Function(client));
  assert.doesNotMatch(client, /AriNutritionPlanSync|ariNutritionMealPlanV1|ari_sync_nutrition_plans|synchronizeLocal|nutrition_plan_items/);
});

test("historical plan migration remains in schema history without an active client entry point", () => {
  assert.match(migration, /nutrition_plan_items/);
  assert.match(migration, /ari_sync_nutrition_plans/);
  assert.doesNotMatch(client, /ari_sync_nutrition_plans/);
});
