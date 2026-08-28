import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const prepared = fs.readFileSync("ari/nutrition/data/prepared-meals/AriFoodPreparedMealsCore.js", "utf8");
const loader = fs.readFileSync("js/nutrition-food-loader.js", "utf8");

test("prepared meals core stays deliberately small and concept-first", () => {
  const ids = [...prepared.matchAll(/id:\s*"prepared-[^"]+"/g)].map((match) => match[0]);
  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, 12);
  assert.match(prepared, /category:\s*"prepared-meals"/);
  assert.match(prepared, /curatedEverydayConcept:\s*true/);
  assert.match(prepared, /One generic record per everyday food concept/);
});

test("first prepared meal batch covers high-frequency everyday concepts", () => {
  for (const concept of [
    "Cheeseburger",
    "Turkey Sandwich",
    "Grilled Cheese",
    "Chicken Burrito",
    "Bean & Cheese Burrito",
    "Beef Taco",
    "Chicken Quesadilla",
    "Spaghetti with Meat Sauce",
    "Mac & Cheese",
    "Chicken Noodle Soup",
    "Beef Chili",
    "Pepperoni Pizza"
  ]) {
    assert.match(prepared, new RegExp(concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Nutrition lazy loader includes the curated prepared meals module", () => {
  assert.match(loader, /Version:\s*1\.0\.4/);
  assert.match(loader, /const VERSION = "1\.0\.4"/);
  assert.match(loader, /prepared-meals\/AriFoodPreparedMealsCore\.js\?v=1\.0\.1/);
});
