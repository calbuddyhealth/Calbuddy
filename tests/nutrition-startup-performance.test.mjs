import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const nutritionHtml = await readFile(new URL("../nutrition.html", import.meta.url), "utf8");
const foodLoader = await readFile(new URL("../js/nutrition-food-loader.js", import.meta.url), "utf8");
const barcodeLazy = await readFile(new URL("../js/nutrition-barcode-lazy.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../js/nutrition-layout-v4.js", import.meta.url), "utf8");
const mealPlan = await readFile(new URL("../js/nutrition-meal-plan-today.js", import.meta.url), "utf8");
const ledger = await readFile(new URL("../js/meal-ledger-sync.js", import.meta.url), "utf8");
const trust = await readFile(new URL("../js/nutrition-trust-layer.js", import.meta.url), "utf8");
const quality = await readFile(new URL("../js/ari-nutrition-data-quality.js", import.meta.url), "utf8");
const validator = await readFile(new URL("../js/nutrition-validator.js", import.meta.url), "utf8");

function indexOfRequired(source, needle) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `Expected to find ${needle}`);
  return index;
}

test("Nutrition no longer parser-loads the food database", () => {
  assert.equal(
    (nutritionHtml.match(/<script[^>]+ari\/nutrition\/data\//g) || []).length,
    0,
    "food data modules must not be parser-blocking script tags"
  );

  assert.equal(
    nutritionHtml.includes("<script src=\"ari/nutrition/AriFoodRegistry.js"),
    false,
    "food registry must be loaded by the interaction-driven loader"
  );

  assert.match(nutritionHtml, /js\/nutrition-food-loader\.js\?v=1\.0\.6/);
});

test("Nutrition binds its functional controllers before food hydration", () => {
  const controller = indexOfRequired(nutritionHtml, "js/nutrition.js?v=4.2.2");
  const barcode = indexOfRequired(nutritionHtml, "js/nutrition-barcode-scan.js?v=1.0.0");
  const lazyBarcode = indexOfRequired(nutritionHtml, "js/nutrition-barcode-lazy.js?v=1.0.0");
  const food = indexOfRequired(nutritionHtml, "js/nutrition-food-loader.js?v=1.0.6");

  assert.ok(controller < food, "Nutrition controller must bind before food hydration can start");
  assert.ok(barcode < food, "barcode controls must bind before food hydration can start");
  assert.ok(lazyBarcode < food, "barcode lazy decoder must be ready before food hydration can start");
});

test("native disclosure controls remain available without JavaScript hydration", () => {
  assert.match(nutritionHtml, /<details class="ari-advanced-nutrition">/);
  assert.match(nutritionHtml, /<details id="todayMealsSection"/);
  assert.match(nutritionHtml, /<details class="ari-panel ari-data-console" id="recentMealsSection">/);
});

test("food loader never auto-warms and yields between small batches", () => {
  const dataModules = foodLoader.match(/ari\/nutrition\/data\//g) || [];
  assert.ok(dataModules.length >= 70, "the complete local food dataset should remain represented in the loader");

  assert.match(foodLoader, /const FOOD_BATCH_SIZE = 3/);
  assert.match(foodLoader, /function yieldToBrowser\(\)/);
  assert.match(foodLoader, /await yieldToBrowser\(\)/);
  assert.match(foodLoader, /FOOD_DATA_SCRIPTS\.slice\(index, index \+ FOOD_BATCH_SIZE\)/);
  assert.match(foodLoader, /Promise\.all\(batch\.map\(\(src\) => loadScript\(src\)\)\)/);
  assert.doesNotMatch(foodLoader, /Promise\.all\(FOOD_DATA_SCRIPTS\.map/);
  assert.doesNotMatch(foodLoader, /(?:window\.)?requestIdleCallback\s*\(/);
  assert.doesNotMatch(foodLoader, /scheduleWarmStart/);

  assert.match(foodLoader, /#mealFoodSearchShell/);
  assert.match(foodLoader, /event\.target\?\.id === "mealName"/);
  assert.match(foodLoader, /TAP FOOD NAME TO SEARCH/);
  assert.match(foodLoader, /window\.initializeNutritionFoodSystem\?\.\(\)/);
});

test("ZXing is absent from initial HTML and loaded only for web scanning", () => {
  assert.equal(
    nutritionHtml.includes("unpkg.com/@zxing/browser"),
    false,
    "external ZXing must not delay Nutrition startup"
  );
  assert.match(barcodeLazy, /unpkg\.com\/@zxing\/browser@0\.2\.1/);
  assert.match(barcodeLazy, /hasNativeScanner\(\)/);
  assert.match(barcodeLazy, /document\.addEventListener\("click", interceptWebScan, true\)/);
});

test("Nutrition cache-bust references match consolidated controllers", () => {
  assert.match(nutritionHtml, /js\/auth\.js\?v=1\.10\.17/);
  assert.match(nutritionHtml, /js\/nutrition-layout-v4\.js\?v=4\.6\.0/);
  assert.match(nutritionHtml, /assets\/css\/nutrition-scan\.css\?v=1\.0\.2/);
  assert.match(nutritionHtml, /js\/nutrition-scan-save-bridge\.js\?v=1\.0\.1/);
  assert.match(nutritionHtml, /js\/nutrition-food-loader\.js\?v=1\.0\.6/);
});

test("Meal Plan has one controller instead of a compact post-render patch", () => {
  assert.match(layout, /nutrition-meal-plan-today\.js\?v=2\.1\.0/);
  assert.doesNotMatch(layout, /nutrition-meal-plan-compact/);
  assert.doesNotMatch(mealPlan, /nutritionRecentPlanShelf/);
  assert.match(mealPlan, /function decorateRecentMeals\(\)/);
  assert.match(mealPlan, /AriNutritionPage\?\.getState\?\.\(\)\?\.recentMeals/);
  assert.match(mealPlan, /await refresh\(\{ includeFavorites: true \}\)/);
  assert.doesNotMatch(mealPlan, /\.from\("meals"\)[\s\S]*?\.limit\(20\)[\s\S]*?\.from\("meals"\)[\s\S]*?\.limit\(20\)/);
});

test("Nutrition owns core startup instead of running generic dashboard hydration", () => {
  assert.match(layout, /function installNutritionCoreInitBoundary\(\)/);
  assert.match(layout, /CalBuddy\.init = nutritionInit/);
  assert.doesNotMatch(
    layout.slice(
      layout.indexOf("const nutritionInit = async function nutritionOwnedCoreInit"),
      layout.indexOf("function updateTodayMealLabel")
    ),
    /refreshDashboard\(/,
    "Nutrition-specific core init must not start generic dashboard hydration"
  );

  const loadingBranch = layout.slice(layout.indexOf('if (document.readyState === "loading")'));
  assert.ok(
    loadingBranch.indexOf("installNutritionCoreInitBoundary()") < loadingBranch.indexOf('document.addEventListener("DOMContentLoaded", boot'),
    "Nutrition core init ownership must install before DOMContentLoaded"
  );
});

test("initial Nutrition hydration starts Today and Recent together", () => {
  assert.match(layout, /function installNutritionLoadCoordinator\(\)/);
  assert.match(layout, /const recent = startRecent\(\)/);
  assert.match(layout, /const today = Promise\.resolve\(\)\.then\(\(\) => originalToday\(\)\)/);
  assert.match(layout, /Promise\.allSettled\(\[today, recent\]\)/);
  assert.match(layout, /window\.loadTodayMeals = function coordinatedTodayMealsLoad/);
  assert.match(layout, /window\.loadRecentMeals = function coordinatedRecentMealsLoad/);

  const loadingBranch = layout.slice(layout.indexOf('if (document.readyState === "loading")'));
  assert.match(loadingBranch, /installNutritionLoadCoordinator\(\)/);
  assert.ok(
    loadingBranch.indexOf("installNutritionLoadCoordinator()") < loadingBranch.indexOf('document.addEventListener("DOMContentLoaded", boot'),
    "the coordinator must install before the page DOMContentLoaded handler executes"
  );
});

test("canonical Nutrition refresh is single-flight and loads Today/Recent concurrently", () => {
  assert.match(ledger, /let nutritionRefreshPromise = null/);
  assert.match(ledger, /if \(nutritionRefreshPromise\) return nutritionRefreshPromise/);
  assert.match(ledger, /Promise\.allSettled\(\[/);
  assert.match(ledger, /window\.loadTodayMeals\(\)/);
  assert.match(ledger, /window\.loadRecentMeals\(\)/);

  const patchStart = ledger.indexOf("function patchNutritionPage()");
  const patchEnd = ledger.indexOf("async function refreshGoalsFromLedger", patchStart);
  const patchSource = ledger.slice(patchStart, patchEnd);
  assert.doesNotMatch(
    patchSource,
    /Promise\.resolve\(window\.refreshNutritionPage\(\)\)/,
    "installing the ledger must not trigger a second startup Nutrition refresh"
  );
});

test("trust observer is scoped to meal lists rather than the entire document", () => {
  assert.match(trust, /\["todayMealList", "recentMealList"\]/);
  assert.match(trust, /observer\.observe\(target, \{ childList: true, subtree: false \}\)/);
  assert.doesNotMatch(trust, /observe\(document\.body/);
});

test("trust UI and Ari context share one Nutrition validator", () => {
  assert.doesNotThrow(() => new Function(validator));
  assert.match(validator, /window\.AriNutritionValidator = Object\.freeze/);
  assert.match(trust, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(quality, /nutrition-validator\.js\?v=1\.0\.0/);
  assert.match(trust, /AriNutritionValidator\?\.detect/);
  assert.match(quality, /AriNutritionValidator\?\.detect/);
});
