import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const trust = fs.readFileSync(path.join(root, "js/nutrition-trust-layer.js"), "utf8");
const quality = fs.readFileSync(path.join(root, "js/ari-nutrition-data-quality.js"), "utf8");
const validator = fs.readFileSync(path.join(root, "js/nutrition-validator.js"), "utf8");

test("Nutrition trust layer remains valid and loads only on Nutrition", () => {
  assert.doesNotThrow(() => new Function(trust));
  assert.match(auth, /ARI_NUTRITION_TRUST_SCRIPT_ID/);
  assert.match(auth, /js\/nutrition-trust-layer\.js\?v=1\.2\.0/);
  assert.match(auth, /currentAriSurface\(\) !== "nutrition"/);
});

test("Meal Plan event and click hooks are decommissioned", () => {
  assert.doesNotMatch(trust, /addEventListener\("click", onPlanClickCapture/);
  assert.doesNotMatch(trust, /nutritionTodayModeTabs/);
  assert.doesNotMatch(trust, /addEventListener\("ari:nutritionMealPlanChanged"/);
});

test("normal meal validation still uses the shared suspicious-entry rules", () => {
  assert.doesNotThrow(() => new Function(validator));
  assert.match(validator, /calories < 100/);
  assert.match(validator, /calories > 5000/);
  assert.match(validator, /macroCalories = protein \* 4 \+ carbs \* 4 \+ fat \* 9/);
  assert.match(trust, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(quality, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(trust, /AriNutritionValidator\.detect\(entry\)/);
  assert.match(quality, /AriNutritionValidator\.detect\(entry\)/);
  assert.match(trust, /Save it anyway\?/);
  assert.match(trust, /Check entry/);
});

test("trust DOM observation stays scoped to meal lists", () => {
  assert.match(trust, /\["todayMealList", "recentMealList"\]/);
  assert.match(trust, /observer\.observe\(target, \{ childList: true, subtree: false \}\)/);
  assert.doesNotMatch(trust, /observe\(document\.body/);
});
