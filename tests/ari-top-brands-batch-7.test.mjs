import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const BATCH7_PATH = "ari/nutrition/data/branded/AriFoodTopBrandsBatch7.js";
const loader = fs.readFileSync("js/nutrition-food-loader.js", "utf8");

function loadRecords(path) {
  const source = fs.readFileSync(path, "utf8");
  let registered = [];
  const sandbox = {
    console: { info() {}, warn() {}, error() {} },
    AriFoodRegistry: {
      registerMany(records) { registered = records; return { registered: records.length, rejected: 0 }; },
      getBySource() { return []; },
      remove() { return true; }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: path });
  return registered;
}

test("top brands batch 7 adds exactly 25 unique foods", () => {
  const records = loadRecords(BATCH7_PATH);
  assert.equal(records.length, 25);
  assert.equal(new Set(records.map(food => food.id)).size, 25);
  assert.equal(records.filter(food => food.brand === "Eggo").length, 19);
  assert.equal(records.filter(food => food.brand === "MorningStar Farms").length, 6);
  assert.equal(records.some(food => /homestyle waffles/i.test(food.displayName)), false, "Eggo Homestyle already exists in batch 1 and must not be duplicated");
});

test("batch 7 food IDs do not duplicate top brands batches 1 through 6", () => {
  const priorIds = new Set();
  for (let batch = 1; batch <= 6; batch += 1) {
    for (const food of loadRecords(`ari/nutrition/data/branded/AriFoodTopBrandsBatch${batch}.js`)) priorIds.add(food.id);
  }

  for (const food of loadRecords(BATCH7_PATH)) {
    assert.equal(priorIds.has(food.id), false, `${food.id} already exists in an earlier Top Brands batch`);
  }
});

test("batch 7 preserves exact label servings and 100 g normalization", () => {
  for (const food of loadRecords(BATCH7_PATH)) {
    assert.equal(food.verified, true, `${food.id} must be verified`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brand specific`);
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, "manufacturer");
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || "", /^https:\/\/smartlabel\.kelloggs\.com\//);

    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs serving grams`);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve its label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test("batch 7 covers breakfast and plant-protein search gaps", () => {
  const records = loadRecords(BATCH7_PATH);
  assert.ok(records.filter(food => food.tags.includes("waffle")).length >= 10);
  assert.ok(records.filter(food => food.tags.includes("pancake")).length >= 4);
  assert.ok(records.filter(food => food.tags.includes("high-protein")).length >= 4);
  assert.ok(records.filter(food => food.tags.includes("plant-based")).length === 6);
  assert.ok(records.some(food => food.aliases.includes("Eggo blueberry waffles")));
  assert.ok(records.some(food => food.aliases.includes("MorningStar veggie burger")));
});

test("top brands batch 7 is wired through the lazy Nutrition loader", () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch7\.js\?v=1\.0\.0/);
});
