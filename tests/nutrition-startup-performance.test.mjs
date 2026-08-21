import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const nutritionHtml = await readFile(new URL("../nutrition.html", import.meta.url), "utf8");
const foodLoader = await readFile(new URL("../js/nutrition-food-loader.js", import.meta.url), "utf8");
const barcodeLazy = await readFile(new URL("../js/nutrition-barcode-lazy.js", import.meta.url), "utf8");

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
    "food registry must be loaded by the background loader"
  );

  assert.match(nutritionHtml, /js\/nutrition-food-loader\.js\?v=1\.0\.0/);
});

test("Nutrition binds its functional controllers before background food hydration", () => {
  const controller = indexOfRequired(nutritionHtml, "js/nutrition.js?v=4.2.2");
  const barcode = indexOfRequired(nutritionHtml, "js/nutrition-barcode-scan.js?v=1.0.0");
  const lazyBarcode = indexOfRequired(nutritionHtml, "js/nutrition-barcode-lazy.js?v=1.0.0");
  const food = indexOfRequired(nutritionHtml, "js/nutrition-food-loader.js?v=1.0.0");

  assert.ok(controller < food, "Nutrition controller must bind before food hydration starts");
  assert.ok(barcode < food, "barcode controls must bind before food hydration starts");
  assert.ok(lazyBarcode < food, "barcode lazy decoder must be ready before food hydration starts");
});

test("native disclosure controls remain available without JavaScript hydration", () => {
  assert.match(nutritionHtml, /<details class="ari-advanced-nutrition">/);
  assert.match(nutritionHtml, /<details id="todayMealsSection"/);
  assert.match(nutritionHtml, /<details class="ari-panel ari-data-console" id="recentMealsSection">/);
});

test("food loader waits for idle time but starts immediately when food search is touched", () => {
  const dataModules = foodLoader.match(/ari\/nutrition\/data\//g) || [];
  assert.ok(dataModules.length >= 70, "the complete local food dataset should remain represented in the lazy loader");
  assert.match(foodLoader, /requestIdleCallback/);
  assert.match(foodLoader, /#mealFoodSearchShell/);
  assert.match(foodLoader, /event\.target\?\.id === "mealName"/);
  assert.match(foodLoader, /script\.async = !ordered/);
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

test("Nutrition cache-bust references match current controllers", () => {
  assert.match(nutritionHtml, /js\/auth\.js\?v=1\.10\.16/);
  assert.match(nutritionHtml, /js\/nutrition-layout-v4\.js\?v=4\.4\.0/);
  assert.match(nutritionHtml, /assets\/css\/nutrition-scan\.css\?v=1\.0\.2/);
});