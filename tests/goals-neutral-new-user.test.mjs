import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const neutralSource = await readFile(new URL("../js/goals-neutral-new-user.js", import.meta.url), "utf8");
const authSource = await readFile(new URL("../js/auth.js", import.meta.url), "utf8");
const migrationSource = await readFile(
  new URL("../supabase/migrations/20260817001000_neutralize_new_user_health_profile_defaults.sql", import.meta.url),
  "utf8"
);

test("Goals new-user guard requires a real health baseline", () => {
  for (const field of ["age", "sex", "weight_lbs", "height_in", "activity_level"]) {
    assert.match(neutralSource, new RegExp(`"${field}"`));
  }

  assert.match(neutralSource, /BASELINE_FIELDS\.every/);
  assert.doesNotMatch(neutralSource, /PROFILE_FIELDS\.some/);
});

test("Goals guard makes missing cloud health fields authoritative", () => {
  for (const field of [
    "age",
    "sex",
    "weight_lbs",
    "height_in",
    "activity_level",
    "goal",
    "target_weight_lbs",
    "daily_calorie_goal"
  ]) {
    assert.match(neutralSource, new RegExp(`${field}`));
  }

  assert.match(neutralSource, /clearMissingCloudFields/);
  assert.match(neutralSource, /clearCrossAccountHealthCaches/);
  assert.match(authSource, /goals-neutral-new-user\.js\?v=1\.2\.0/);
});

test("Profiles schema no longer assigns generic health goals to new rows", () => {
  assert.match(migrationSource, /alter column goal drop default/i);
  assert.match(migrationSource, /alter column daily_calorie_goal drop default/i);
  assert.match(migrationSource, /age is null/i);
  assert.match(migrationSource, /weight_lbs is null/i);
});
