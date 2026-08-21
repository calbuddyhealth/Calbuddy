import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const trust = fs.readFileSync(path.join(root, "js/nutrition-trust-layer.js"), "utf8");
const quality = fs.readFileSync(path.join(root, "js/ari-nutrition-data-quality.js"), "utf8");
const validator = fs.readFileSync(path.join(root, "js/nutrition-validator.js"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820115500_nutrition_trust_layer_p0.sql"),
  "utf8"
);

test("Nutrition trust layer is valid JavaScript and loads only on Nutrition", () => {
  assert.doesNotThrow(() => new Function(trust));
  assert.match(auth, /ARI_NUTRITION_TRUST_SCRIPT_ID/);
  assert.match(auth, /js\/nutrition-trust-layer\.js\?v=1\.1\.0/);
  assert.match(auth, /currentAriSurface\(\) !== "nutrition"/);
});

test("planned meal consumption is intercepted before legacy multi-write handlers", () => {
  assert.match(trust, /document\.addEventListener\("click", onPlanClickCapture, true\)/);
  assert.match(trust, /action !== "eat-all" && action !== "log-selected"/);
  assert.match(trust, /event\.stopImmediatePropagation\(\)/);
  assert.match(trust, /ari_consume_nutrition_plan/);
  assert.match(trust, /p_mutation_id:\s*mutationId/);
});

test("partial consumption gives the remainder a truthful identity", () => {
  assert.match(trust, /function deriveRemainder/);
  assert.match(trust, /Remaining planned items/);
  assert.match(trust, /names\.length <= 3/);
  assert.match(trust, /remainingItems/);
  assert.match(migration, /serving_size = 'Remaining planned items'/);
  assert.match(migration, /Partially eaten/);
});

test("nutrition plan transaction is atomic and idempotent at the database boundary", () => {
  assert.match(migration, /create table if not exists public\.ari_nutrition_mutations/);
  assert.match(migration, /id uuid primary key/);
  assert.match(migration, /where id = p_mutation_id\s+and user_id = v_user/);
  assert.match(migration, /for update/);
  assert.match(migration, /insert into public\.meals/);
  assert.match(migration, /update public\.nutrition_plan_items/);
  assert.match(migration, /'idempotent', true/);
  assert.match(migration, /auth\.uid\(\)/);
});

test("successful plan transactions return verified totals and immediate undo", () => {
  assert.match(migration, /select coalesce\(sum\(calories\), 0\)/);
  assert.match(migration, /'todayCalories'/);
  assert.match(migration, /'undoAvailable', true/);
  assert.match(trust, /ari_undo_nutrition_mutation/);
  assert.match(trust, /undo\.textContent = "Undo"/);
  assert.match(migration, /delete from public\.meals/);
  assert.match(migration, /status = 'undone'/);
});

test("trust UI and Ari context use the same suspicious-entry rules", () => {
  assert.doesNotThrow(() => new Function(validator));
  assert.match(validator, /calories < 100/);
  assert.match(validator, /calories > 5000/);
  assert.match(validator, /macroCalories = protein \* 4 \+ carbs \* 4 \+ fat \* 9/);
  assert.match(trust, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(quality, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(trust, /AriNutritionValidator\.detect\(entry\)/);
  assert.match(quality, /AriNutritionValidator\.detect\(entry\)/);
  assert.match(trust, /window\.confirm/);
  assert.match(trust, /Log it anyway\?/);
  assert.match(trust, /Save it anyway\?/);
  assert.match(trust, /Check entry/);
});

test("trust DOM observation is scoped to meal lists", () => {
  assert.match(trust, /\["todayMealList", "recentMealList"\]/);
  assert.match(trust, /observer\.observe\(target, \{ childList: true, subtree: false \}\)/);
  assert.doesNotMatch(trust, /observe\(document\.body/);
});

test("legacy partially-eaten planned rows are repaired on demand instead of at page startup", () => {
  assert.match(trust, /function repairPartialRemainders/);
  assert.match(trust, /\.from\("nutrition_plan_items"\)/);
  assert.match(trust, /\.eq\("status", "planned"\)/);
  assert.match(trust, /\.ilike\("notes", "%Partially eaten%"\)/);
  assert.match(trust, /function runLegacyRepairOnce\(\)/);
  assert.match(trust, /nutritionTodayModeTabs/);
  assert.doesNotMatch(trust, /setTimeout\(\(\) => void repairPartialRemainders/);
  assert.doesNotMatch(trust, /\.from\("meals"\)\s*\.update/);
});
