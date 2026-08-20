import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260820122500_restore_nutrition_plan_privileges.sql"),
  "utf8"
);
const planner = fs.readFileSync(path.join(root, "js/nutrition-meal-plan-today.js"), "utf8");

test("browser Meal Plan operations have authenticated table privileges", () => {
  assert.match(migration, /grant select, insert, update, delete\s+on table public\.nutrition_plan_items\s+to authenticated/is);
  assert.match(migration, /revoke all\s+on table public\.nutrition_plan_items\s+from anon/is);
});

test("server-side Meal Plan context retains service-role access", () => {
  assert.match(migration, /grant select, insert, update, delete\s+on table public\.nutrition_plan_items\s+to service_role/is);
});

test("Meal Plan browser code still scopes cloud operations to the current user", () => {
  assert.match(planner, /\.eq\("user_id", user\.id\)/);
  assert.match(planner, /query = query\.eq\("user_id", state\.user\.id\)/);
});
