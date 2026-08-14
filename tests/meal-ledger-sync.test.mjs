import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const auth = fs.readFileSync(path.join(repoRoot, "js/auth.js"), "utf8");
const sync = fs.readFileSync(path.join(repoRoot, "js/meal-ledger-sync.js"), "utf8");
const migration = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260814113000_align_daily_reset_to_midnight.sql"),
  "utf8"
);

function collectRuntimeFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if ([".git", "node_modules", "supabase", "tests"].includes(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRuntimeFiles(full));
      continue;
    }

    if (/\.(?:js|html)$/i.test(entry.name)) files.push(full);
  }

  return files;
}

test("new ARI XP profiles default to the calendar day", () => {
  assert.match(auth, /reset_hour:\s*12/);
  assert.match(auth, /reset_minute:\s*0/);
  assert.match(auth, /reset_ampm:\s*"AM"/);
  assert.match(auth, /js\/meal-ledger-sync\.js\?v=1\.0\.1/);
});

test("meal ledger uses midnight-to-midnight windows", () => {
  assert.match(sync, /start\.setHours\(0, 0, 0, 0\)/);
  assert.match(sync, /dateKey:\s*`\$\{nutritionDate\}_0000`/);
  assert.match(sync, /hour:\s*12/);
  assert.match(sync, /ampm:\s*"AM"/);
});

test("Ari, Nutrition, and Goals share one meal ledger", () => {
  assert.match(sync, /\.from\("meals"\)/);
  assert.doesNotMatch(sync, /\.from\("meal_logs"\)/);
  assert.doesNotMatch(sync, /\.from\("food_entries"\)/);
  assert.match(sync, /CalBuddy\.logMeal\s*=\s*logMeal/);
  assert.match(sync, /CalBuddy\.getMealsInWindow\s*=\s*getMealsInWindow/);
  assert.match(sync, /CalBuddy\.getConsumedCalories\s*=\s*syncConsumedCalories/);
  assert.match(sync, /CalBuddy\.getRecentMeals\s*=\s*getRecentMeals/);
  assert.match(sync, /window\.CalBuddy\.logMeal\(record\)/);
  assert.match(sync, /window\.getActiveNutritionDateKey\s*=\s*\(\)\s*=>/);
});

test("Goals cache date and core active date are synchronized together", () => {
  assert.match(sync, /calbuddyCaloriesConsumedDate/);
  assert.match(sync, /calbuddyActiveNutritionDate/);
  assert.match(sync, /calbuddyCaloriesConsumed_\$\{windowInfo\.dateKey\}/);
});

test("cloud and local fallback meals are merged instead of choosing one source", () => {
  assert.match(sync, /Promise\.all\(\[/);
  assert.match(sync, /fetchCloudMeals\(windowInfo\)/);
  assert.match(sync, /localMealsInWindow\(windowInfo\)/);
  assert.match(sync, /mergeMeals\(cloudMeals, localMeals\)/);
});

test("runtime patching is idempotent instead of refetching meals in a retry loop", () => {
  assert.match(sync, /let nutritionPatched = false/);
  assert.match(sync, /let goalsPatched = false/);
  assert.match(sync, /if \(nutritionPatched\) return true/);
  assert.match(sync, /if \(goalsPatched\) return true/);
});

test("legacy meal tables are not used by browser runtime files", () => {
  const offenders = [];

  for (const file of collectRuntimeFiles(repoRoot)) {
    const source = fs.readFileSync(file, "utf8");
    if (/\.from\(["'](?:meal_logs|food_entries)["']\)/.test(source)) {
      offenders.push(path.relative(repoRoot, file));
    }
  }

  assert.deepEqual(offenders, []);
});

test("database migration makes midnight the stored default", () => {
  assert.match(migration, /reset_hour set default 12/);
  assert.match(migration, /reset_minute set default 0/);
  assert.match(migration, /reset_ampm set default 'AM'/);
  assert.match(migration, /reset_hour = 12/);
});
