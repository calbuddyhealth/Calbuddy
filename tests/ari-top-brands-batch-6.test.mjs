import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch6.js', 'utf8');
const loader = fs.readFileSync('js/nutrition-food-loader.js', 'utf8');

function loadRecords() {
  let registered = [];
  const sandbox = { console:{info(){},warn(){},error(){}}, AriFoodRegistry:{ registerMany(records){registered=records;return{registered:records.length,rejected:0};}, getBySource(){return[];}, remove(){return true;} } };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename:'AriFoodTopBrandsBatch6.js' });
  return { records:registered, api:sandbox.AriFoodTopBrandsBatch6 };
}

test('top brands batch 6 adds exactly 25 unique branded foods', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 25);
  assert.equal(api.count(), 25);
  assert.equal(new Set(records.map(x => x.id)).size, 25);
  assert.ok(records.filter(x => x.brand === 'DiGiorno').length >= 10);
  assert.ok(records.filter(x => x.brand === 'Jimmy Dean').length >= 7);
  assert.ok(records.filter(x => x.brand === 'Hot Pockets').length >= 3);
  assert.ok(records.filter(x => x.brand === 'Lean Cuisine').length >= 2);
  assert.ok(records.filter(x => x.brand === "Stouffer's").length >= 3);
});

test('batch 6 preserves label servings, provenance, and canonical normalization', () => {
  const { records } = loadRecords();
  for (const food of records) {
    assert.equal(food.verified, true);
    assert.equal(food.metadata?.brandSpecific, true);
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, 'manufacturer');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);
    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs serving grams`);
    assert.ok(food.servings.some(s => s.isDefault && s.grams === label.servingGrams));
    const scaled = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaled - label.calories) <= 0.15, `${food.id} calories must round-trip`);
  }
});

test('batch 6 covers breakfast, frozen sandwiches, entrees, and pizza', () => {
  const { records } = loadRecords();
  const tags = new Set(records.flatMap(x => x.tags));
  for (const tag of ['breakfast','frozen-sandwich','frozen-meal','frozen-pizza']) assert.ok(tags.has(tag), `${tag} coverage missing`);
  assert.ok(records.some(x => x.aliases.includes('Hot Pockets Philly steak')));
  assert.ok(records.some(x => x.aliases.includes('Lean Cuisine Korean BBQ')));
  assert.ok(records.some(x => x.aliases.includes('Jimmy Dean bacon bowl')));
  assert.ok(records.some(x => x.aliases.includes('DiGiorno supreme pizza')));
});

test('batch 6 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch6\.js\?v=1\.0\.0/);
});
