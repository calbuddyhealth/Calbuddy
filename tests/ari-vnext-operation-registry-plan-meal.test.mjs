import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "ari/vnext/ari-vnext-operation-registry.js"), "utf8");

test("Meal Plan creation is no longer an Ari operation", () => {
  assert.doesNotMatch(source, /["']plan_meal["']/);
  assert.doesNotMatch(source, /preparePlanMeal/);
  assert.doesNotMatch(source, /meal_plan_preparer/);
});

test("workout planning remains an owned operation after Meal Plan removal", () => {
  assert.match(source, /"plan_workout"/);
  assert.match(source, /preparePlanWorkout/);
});
