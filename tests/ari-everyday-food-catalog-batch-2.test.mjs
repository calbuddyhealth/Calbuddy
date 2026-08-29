import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");

function loadFoods() {
  const records = new Map();
  const registry = {
    registerMany(foods) { for (const food of foods) records.set(food.id, food); return { accepted: foods.length, rejected: 0 }; },
    getBySource() { return []; },
    remove() { return true; }
  };
  const context = { window: { AriFoodRegistry: registry }, console };
  vm.createContext(context);
  vm.runInContext(read("ari/nutrition/data/prepared-meals/AriFoodEverydaySoupsMeals2.js"), context);
  return [...records.values()];
}

const foods = loadFoods();

test("batch 2 contains 16 unique everyday concepts", () => {
  assert.equal(foods.length, 16);
  assert.equal(new Set(foods.map((food) => food.id)).size, 16);
});

test("batch 2 generic foods are honest estimates with traceable dataset provenance", () => {
  for (const food of foods) {
    assert.equal(food.verified, false, `${food.id} must not claim exact verification`);
    assert.equal(food.metadata?.estimate, true, `${food.id} must be marked estimate`);
    assert.equal(food.metadata?.sourceProvenance?.dataset, "FNDDS 2021-2023", `${food.id} dataset`);
    assert.equal(food.metadata?.sourceProvenance?.specificMatchVerified, false, `${food.id} specific-match state`);
    assert.equal(food.metadata?.sourceProvenance?.fdcId, null, `${food.id} must not invent an FDC ID`);
  }
});

test("batch 2 portions and nutrition stay within defensible generic-food bounds", () => {
  for (const food of foods) {
    const grams = Number(food.nutritionBasis?.grams);
    const n = food.nutrition || {};
    assert.ok(grams >= 80 && grams <= 500, `${food.id} serving mass ${grams}g`);
    assert.ok(n.calories >= 80 && n.calories <= 900, `${food.id} calories`);
    const kcalFromMacros = Number(n.protein || 0) * 4 + Number(n.carbs || 0) * 4 + Number(n.fat || 0) * 9;
    const tolerance = Math.max(25, Number(n.calories) * 0.12);
    assert.ok(Math.abs(kcalFromMacros - Number(n.calories)) <= tolerance, `${food.id}: ${n.calories} kcal vs ${kcalFromMacros} macro kcal`);
    const kcalPer100 = Number(n.calories) / grams * 100;
    assert.ok(kcalPer100 >= 25 && kcalPer100 <= 450, `${food.id} kcal/100g ${kcalPer100}`);
    const sodiumPer100 = Number(n.sodiumMg || 0) / grams * 100;
    assert.ok(sodiumPer100 <= 1500, `${food.id} sodium/100g ${sodiumPer100}`);
    const defaultServing = food.servings?.find((serving) => serving.isDefault);
    assert.ok(defaultServing?.label && !/^1 serving$/i.test(defaultServing.label), `${food.id} needs a human-readable serving`);
    assert.equal(Number(defaultServing?.grams), grams, `${food.id} default serving must match nutrition basis`);
  }
});

test("loader includes batch 2 module", () => {
  const loader = read("js/nutrition-food-loader.js");
  assert.match(loader, /Version: 1\.0\.6/);
  assert.match(loader, /AriFoodEverydaySoupsMeals2\.js\?v=1\.0\.0/);
});
