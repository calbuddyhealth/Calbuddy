import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch1.js', 'utf8');
const loader = fs.readFileSync('js/nutrition-food-loader.js', 'utf8');
const nutritionHtml = fs.readFileSync('nutrition.html', 'utf8');

function loadRecords() {
  let registered = [];
  const sandbox = {
    console: { info() {}, warn() {}, error() {} },
    AriFoodRegistry: {
      registerMany(records) { registered = records; return { registered: records.length, rejected: 0 }; },
      getBySource() { return []; },
      remove() { return true; }
    }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'AriFoodTopBrandsBatch1.js' });
  return { records: registered, api: sandbox.AriFoodTopBrandsBatch1 };
}

test('top brands batch 1 registers a small high-trust gap set', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 14);
  assert.equal(api.count(), 14);
  assert.equal(new Set(records.map(food => food.id)).size, 14);

  const brands = new Set(records.map(food => food.brand));
  assert.deepEqual([...brands].sort(), [
    "Campbell's", "Dave's Killer Bread", 'Eggo', 'Jimmy Dean', 'Just Bare',
    'KIND', 'Mission', 'Nature Valley', 'Quest', 'Tyson'
  ].sort());

  for (const food of records) {
    assert.equal(food.verified, true, `${food.id} must be a verified branded record`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brandSpecific`);
    assert.equal(food.metadata?.dataVerifiedAt, '2026-08-29');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);
    assert.ok(food.servings?.some(serving => serving.isDefault), `${food.id} needs a default label serving`);
    assert.ok(food.nutritionBasis?.amount === 100, `${food.id} must normalize to a 100-unit canonical basis`);
    assert.ok(food.nutrition?.calories > 0, `${food.id} calories must be positive`);
    assert.ok(food.nutrition?.protein >= 0 && food.nutrition?.carbs >= 0 && food.nutrition?.fat >= 0);
  }
});

test('top brands batch 1 normalization preserves label energy within rounding tolerance', () => {
  const { records } = loadRecords();
  for (const food of records) {
    const label = food.metadata.labelNutrition;
    const amount = label.servingGrams || label.servingMilliliters;
    const scaledCalories = food.nutrition.calories * amount / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} canonical calories must scale back to the label`);
  }
});

test('top brands batch 1 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /Version: 1\.0\.6/);
  assert.match(loader, /const VERSION = "1\.0\.6"/);
  assert.match(loader, /branded\/AriFoodTopBrandsBatch1\.js\?v=1\.0\.0/);
  assert.match(nutritionHtml, /js\/nutrition-food-loader\.js\?v=1\.0\.6/);
});
