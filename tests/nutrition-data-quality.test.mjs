import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auth = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
const quality = fs.readFileSync(path.join(root, "js/ari-nutrition-data-quality.js"), "utf8");
const validator = fs.readFileSync(path.join(root, "js/nutrition-validator.js"), "utf8");

test("nutrition data-quality context is valid JavaScript and loads on Ari chat surfaces", () => {
  assert.doesNotThrow(() => new Function(quality));
  assert.doesNotThrow(() => new Function(validator));
  assert.match(auth, /ARI_NUTRITION_QUALITY_SCRIPT_ID/);
  assert.match(auth, /js\/ari-nutrition-data-quality\.js\?v=1\.1\.0/);
  assert.match(auth, /surface !== "home" && surface !== "nutrition"/);
  assert.match(quality, /nutrition-validator\.js\?v=1\.0\.0/);
});

test("Ari receives canonical ledger provenance and suspicious-record warnings", () => {
  assert.match(quality, /sourceOfTruth:\s*"public\.meals"/);
  assert.match(quality, /ledgerEvidence/);
  assert.match(quality, /dataQuality:\s*quality/);
  assert.match(quality, /warningCount/);
  assert.match(quality, /Treat those records as uncertain evidence/);
  assert.match(quality, /AriNutritionValidator\.detect\(entry\)/);
});

test("shared anomaly checks catch implausible meal-scale calories and macro mismatches", () => {
  assert.match(validator, /calories < 100/);
  assert.match(validator, /burrito\|bowl\|burger/);
  assert.match(validator, /protein \* 4 \+ carbs \* 4 \+ fat \* 9/);
  assert.match(validator, /Calories and macronutrients do not appear to describe the same portion/);
});
