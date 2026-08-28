import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const paths = [
  "ari/nutrition/data/prepared-meals/AriFoodPreparedMealsCore.js",
  "ari/nutrition/data/prepared-meals/AriFoodEverydayBreakfastSides.js",
  "ari/nutrition/data/proteins/AriFoodDeliMeatsCore.js"
];

const sources = paths.map((path) => ({ path, source: fs.readFileSync(path, "utf8") }));

function macroRows(source) {
  const objectRows = [...source.matchAll(/\{ calories:\s*(\d+(?:\.\d+)?), protein:\s*(\d+(?:\.\d+)?), carbs:\s*(\d+(?:\.\d+)?), fat:\s*(\d+(?:\.\d+)?)/g)]
    .map((match) => ({
      calories: Number(match[1]),
      protein: Number(match[2]),
      carbs: Number(match[3]),
      fat: Number(match[4])
    }));

  const deliRows = [...source.matchAll(/\["deli-[^"]+",\s*"[^"]+",\s*\[[^\]]*\],\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*\d+(?:\.\d+)?\]/g)]
    .map((match) => ({
      calories: Number(match[1]),
      protein: Number(match[2]),
      carbs: Number(match[3]),
      fat: Number(match[4])
    }));

  return [...objectRows, ...deliRows];
}

test("generic curated foods are estimates, never falsely marked verified", () => {
  for (const { path, source } of sources) {
    assert.doesNotMatch(source, /verified:\s*true/, `${path} must not call generic estimates verified`);
    assert.match(source, /estimate:\s*true/, `${path} must identify generic nutrition as estimated`);
    assert.match(source, /confidence:\s*"medium"/, `${path} must expose bounded confidence`);
  }
});

test("curated calorie values remain coherent with protein, carbs, and fat", () => {
  for (const { path, source } of sources) {
    const rows = macroRows(source);
    assert.ok(rows.length > 0, `${path} should expose auditable macro rows`);

    for (const row of rows) {
      const macroCalories = (row.protein * 4) + (row.carbs * 4) + (row.fat * 9);
      const tolerance = Math.max(20, row.calories * 0.08);
      assert.ok(
        Math.abs(row.calories - macroCalories) <= tolerance,
        `${path}: ${row.calories} kcal is not coherent with ${row.protein}P/${row.carbs}C/${row.fat}F (${macroCalories} macro kcal)`
      );
    }
  }
});

test("pancake default is an everyday two-medium-pancake portion", () => {
  const breakfast = sources.find((entry) => entry.path.includes("BreakfastSides"))?.source || "";
  assert.match(breakfast, /label:\s*"2 medium pancakes", unit:\s*"serving", grams:\s*86/);
  assert.match(breakfast, /calories:\s*190, protein:\s*5, carbs:\s*34, fat:\s*4/);
});

test("fatty deli meats are not modeled like lean lunch meat", () => {
  const deli = sources.find((entry) => entry.path.includes("DeliMeats"))?.source || "";
  for (const expected of [
    /"Hard Salami"[^\n]*220, 12, 2, 18/,
    /"Bologna"[^\n]*170, 7, 4, 14/,
    /"Prosciutto"[^\n]*140, 16, 0, 8/,
    /"Pepperoni"[^\n]*280, 12, 2, 25/,
    /"Mortadella"[^\n]*180, 9, 2, 15/
  ]) {
    assert.match(deli, expected);
  }
});
