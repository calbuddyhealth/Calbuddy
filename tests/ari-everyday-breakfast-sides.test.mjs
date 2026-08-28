import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const expansion = fs.readFileSync("ari/nutrition/data/prepared-meals/AriFoodEverydayBreakfastSides.js", "utf8");
const loader = fs.readFileSync("js/nutrition-food-loader.js", "utf8");

test("breakfast and sides expansion stays concept-first", () => {
  const ids = [...expansion.matchAll(/"prepared-[^"]+"/g)].map((match) => match[0]);
  assert.ok(ids.length >= 13);
  assert.match(expansion, /USDA FoodData Central \/ FNDDS/);
  assert.match(expansion, /estimate:\s*true/);
});

test("breakfast coverage includes high-frequency everyday foods", () => {
  for (const concept of [
    "Pancakes",
    "Waffle",
    "French Toast",
    "Breakfast Burrito",
    "Breakfast Sandwich",
    "Cheese Omelet"
  ]) {
    assert.match(expansion, new RegExp(concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("common sides coverage includes high-frequency everyday foods", () => {
  for (const concept of [
    "Mashed Potatoes",
    "French Fries",
    "Roasted Potatoes",
    "Coleslaw",
    "Stuffing",
    "Baked Beans",
    "Potato Salad"
  ]) {
    assert.match(expansion, new RegExp(concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Nutrition lazy loader includes both curated prepared-meal modules", () => {
  assert.match(loader, /prepared-meals\/AriFoodPreparedMealsCore\.js\?v=1\.0\.0/);
  assert.match(loader, /prepared-meals\/AriFoodEverydayBreakfastSides\.js\?v=1\.0\.0/);
});
