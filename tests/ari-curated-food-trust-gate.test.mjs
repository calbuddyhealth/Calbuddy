import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const MODULES = [
  "ari/nutrition/data/prepared-meals/AriFoodPreparedMealsCore.js",
  "ari/nutrition/data/prepared-meals/AriFoodEverydayBreakfastSides.js",
  "ari/nutrition/data/proteins/AriFoodDeliMeatsCore.js"
];

const provenance = JSON.parse(
  fs.readFileSync("ari/nutrition/data/curated-food-provenance.json", "utf8")
);

function loadCuratedFoods() {
  const foods = [];

  for (const path of MODULES) {
    const source = fs.readFileSync(path, "utf8");
    const registry = {
      registerMany(records) {
        foods.push(...records.map((record) => JSON.parse(JSON.stringify(record))));
        return { accepted: records.length, rejected: 0 };
      }
    };

    vm.runInNewContext(source, {
      window: { AriFoodRegistry: registry },
      console
    }, { filename: path });
  }

  return foods;
}

const foods = loadCuratedFoods();

function macroCalories(food) {
  const n = food.nutrition;
  return (Number(n.protein) * 4) + (Number(n.carbs) * 4) + (Number(n.fat) * 9);
}

function caloriesPer100g(food) {
  return (Number(food.nutrition.calories) / Number(food.nutritionBasis.grams)) * 100;
}

function sodiumPer100g(food) {
  return (Number(food.nutrition.sodiumMg) / Number(food.nutritionBasis.grams)) * 100;
}

test("curated trust gate covers exactly the 35-food expansion", () => {
  assert.equal(foods.length, 35);
  const ids = foods.map((food) => food.id);
  assert.equal(new Set(ids).size, 35);

  const provenanceIds = Object.keys(provenance.records);
  assert.equal(provenanceIds.length, 35);
  assert.deepEqual([...provenanceIds].sort(), [...ids].sort());
});

test("generic curated records cannot masquerade as exact verified nutrition", () => {
  for (const food of foods) {
    assert.equal(food.verified, false, `${food.id} must remain unverified while generic`);
    assert.equal(food.metadata?.estimate, true, `${food.id} must identify itself as an estimate`);
    assert.equal(food.metadata?.genericFood, true, `${food.id} must identify itself as generic`);
    assert.equal(food.metadata?.confidence, "medium", `${food.id} must expose bounded confidence`);
  }
});

test("every curated record has honest, reproducible USDA provenance", () => {
  assert.match(provenance.policy.provider, /U\.S\. Department of Agriculture/);
  assert.equal(provenance.policy.license, "CC0 1.0");
  assert.match(provenance.policy.sourceUrl, /^https:\/\/fdc\.nal\.usda\.gov\//);

  for (const food of foods) {
    const source = provenance.records[food.id];
    assert.ok(source, `${food.id} is missing provenance`);
    assert.ok(String(source.dataset || "").length >= 5, `${food.id} needs a dataset`);
    assert.ok(String(source.release || "").length >= 4, `${food.id} needs a dataset release`);
    assert.match(String(source.releasePublished || ""), /^20\d{2}-\d{2}$/,
      `${food.id} needs a release month`);
    assert.ok(String(source.referenceSearchTerm || "").length >= 5,
      `${food.id} needs a reproducible USDA search concept`);
    assert.equal(source.matchType, "generic-concept-anchor",
      `${food.id} must not imply an exact record match`);

    if (source.specificMatchVerified) {
      assert.ok(Number.isInteger(source.fdcId) && source.fdcId > 0,
        `${food.id} claims a specific match without a valid FDC ID`);
    } else {
      assert.equal(source.fdcId, null,
        `${food.id} must not publish an unverified FDC ID`);
    }
  }
});

test("serving weights and energy density stay inside broad human-food bounds", () => {
  for (const food of foods) {
    const grams = Number(food.nutritionBasis?.grams);
    assert.ok(Number.isFinite(grams) && grams >= 20 && grams <= 600,
      `${food.id} has an implausible default serving mass: ${grams} g`);

    const kcalDensity = caloriesPer100g(food);
    assert.ok(kcalDensity >= 30 && kcalDensity <= 650,
      `${food.id} has suspicious energy density: ${kcalDensity.toFixed(1)} kcal/100g`);

    const sodiumDensity = sodiumPer100g(food);
    assert.ok(sodiumDensity >= 0 && sodiumDensity <= 2500,
      `${food.id} has suspicious sodium density: ${sodiumDensity.toFixed(1)} mg/100g`);
  }
});

test("stored calories remain coherent with protein carbohydrate and fat", () => {
  for (const food of foods) {
    const calories = Number(food.nutrition.calories);
    const fromMacros = macroCalories(food);
    const tolerance = Math.max(30, calories * 0.12);

    assert.ok(Math.abs(calories - fromMacros) <= tolerance,
      `${food.id}: ${calories} kcal disagrees with ${fromMacros} macro kcal beyond ${tolerance.toFixed(1)} kcal tolerance`);
  }
});

test("default serving labels describe the same mass used for nutrition scaling", () => {
  for (const food of foods) {
    const defaultServing = food.servings?.find((serving) => serving.isDefault);
    assert.ok(defaultServing, `${food.id} needs exactly one default serving`);
    assert.equal(food.servings.filter((serving) => serving.isDefault).length, 1,
      `${food.id} must have one default serving`);
    assert.equal(Number(defaultServing.grams), Number(food.nutritionBasis.grams),
      `${food.id} default serving mass must equal nutrition basis mass`);
    assert.ok(String(defaultServing.label || "").trim().length >= 3,
      `${food.id} needs a human-readable default serving label`);
  }
});
