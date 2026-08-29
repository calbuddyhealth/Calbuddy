import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const deli = fs.readFileSync("ari/nutrition/data/proteins/AriFoodDeliMeatsCore.js", "utf8");
const loader = fs.readFileSync("js/nutrition-food-loader.js", "utf8");

test("deli meats stay curated and concept-first", () => {
  const ids = [...deli.matchAll(/\["deli-[^"]+"/g)].map((match) => match[0]);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.match(deli, /subcategory: "deli-meats"/);
  assert.match(deli, /curatedEverydayConcept: true/);
});

test("deli core covers common lunch meats", () => {
  for (const food of ["Deli Turkey Breast", "Deli Ham", "Deli Roast Beef", "Deli Chicken Breast", "Hard Salami", "Bologna", "Pastrami", "Prosciutto", "Pepperoni", "Mortadella"]) {
    assert.match(deli, new RegExp(food));
  }
});

test("deli records use one default portion with scalable servings", () => {
  assert.match(deli, /label: "2 oz"/);
  assert.match(deli, /label: "1 oz"/);
  assert.match(deli, /label: "3 oz"/);
  assert.match(deli, /USDA FoodData Central \/ FNDDS reference anchor/);
});

test("Nutrition loader includes deli meats module", () => {
  assert.match(loader, /const VERSION = "1\.0\.6"/);
  assert.match(loader, /proteins\/AriFoodDeliMeatsCore\.js\?v=1\.0\.1/);
});
