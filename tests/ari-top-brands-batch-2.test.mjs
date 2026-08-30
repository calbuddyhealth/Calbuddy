import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch2.js', 'utf8');
const loader = fs.readFileSync('js/nutrition-food-loader.js', 'utf8');

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
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'AriFoodTopBrandsBatch2.js' });
  return { records: registered, api: sandbox.AriFoodTopBrandsBatch2 };
}

test('top brands batch 2 covers high-demand grocery search categories', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 9);
  assert.equal(api.count(), 9);
  assert.equal(new Set(records.map(food => food.id)).size, records.length);

  const brands = new Set(records.map(food => food.brand));
  for (const brand of [
    'Hillshire Farm', 'Oscar Mayer', 'Kraft Singles', 'Sargento', 'Taylor Farms',
    'Fresh Express', 'Lean Cuisine', "Stouffer's", 'DiGiorno'
  ]) {
    assert.ok(brands.has(brand), `${brand} should be represented`);
  }

  assert.ok(records.some(food => food.tags.includes('deli-meat')), 'batch needs deli meat');
  assert.ok(records.some(food => food.tags.includes('sliced-cheese')), 'batch needs sliced cheese');
  assert.ok(records.some(food => food.tags.includes('salad-kit')), 'batch needs salad kits');
  assert.ok(records.some(food => food.tags.includes('frozen-meal')), 'batch needs frozen meals');
  assert.ok(records.some(food => food.tags.includes('frozen-pizza')), 'batch needs frozen pizza');
});

test('top brands batch 2 keeps exact manufacturer serving nutrition', () => {
  const { records } = loadRecords();
  for (const food of records) {
    assert.equal(food.verified, true, `${food.id} must be verified`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brand specific`);
    assert.equal(food.metadata?.dataVerifiedAt, '2026-08-30');
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, 'manufacturer');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);

    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs exact serving grams`);
    assert.ok(label?.calories > 0, `${food.id} needs label calories`);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve the label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test('top brands batch 2 includes search-friendly everyday aliases', () => {
  const { records } = loadRecords();
  const byId = new Map(records.map(food => [food.id, food]));
  assert.ok(byId.get('protein-brand-hillshire-ultra-thin-oven-roasted-turkey')?.aliases.includes('Hillshire deli turkey'));
  assert.ok(byId.get('dairy-brand-kraft-singles-american')?.aliases.includes('Kraft Singles'));
  assert.ok(byId.get('prepared-brand-lean-cuisine-alfredo-chicken-broccoli')?.aliases.includes('Lean Cuisine chicken alfredo'));
  assert.ok(byId.get('prepared-brand-digiorno-rising-crust-pepperoni')?.aliases.includes('DiGiorno pepperoni pizza'));
});

test('top brands batch 2 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch2\.js\?v=1\.0\.0/);
});
