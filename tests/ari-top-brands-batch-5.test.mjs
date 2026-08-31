import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch5.js', 'utf8');
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
  vm.runInNewContext(source, sandbox, { filename: 'AriFoodTopBrandsBatch5.js' });
  return { records: registered, api: sandbox.AriFoodTopBrandsBatch5 };
}

test('top brands batch 5 adds high-demand deli and frozen convenience foods', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 4);
  assert.equal(api.count(), 4);
  assert.equal(new Set(records.map(food => food.id)).size, records.length);

  const ids = new Set(records.map(food => food.id));
  for (const id of [
    'protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken',
    'protein-brand-hillshire-ultra-thin-honey-ham',
    'prepared-brand-hot-pockets-hickory-ham-cheddar',
    'prepared-brand-lean-cuisine-four-cheese-pizza'
  ]) assert.ok(ids.has(id), `${id} should be present`);

  assert.ok(records.filter(food => food.tags.includes('deli-meat')).length >= 2);
  assert.ok(records.some(food => food.tags.includes('frozen-sandwich')));
  assert.ok(records.some(food => food.tags.includes('frozen-pizza')));
});

test('top brands batch 5 preserves manufacturer label servings and normalization', () => {
  const { records } = loadRecords();
  for (const food of records) {
    assert.equal(food.verified, true, `${food.id} must be verified`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brand specific`);
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, 'manufacturer');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);

    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs exact serving grams`);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve the label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test('top brands batch 5 includes normal consumer aliases', () => {
  const { records } = loadRecords();
  const byId = new Map(records.map(food => [food.id, food]));
  assert.ok(byId.get('protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken')?.aliases.includes('Oscar Mayer deli chicken'));
  assert.ok(byId.get('protein-brand-hillshire-ultra-thin-honey-ham')?.aliases.includes('Hillshire honey ham'));
  assert.ok(byId.get('prepared-brand-hot-pockets-hickory-ham-cheddar')?.aliases.includes('Hot Pockets ham and cheese'));
  assert.ok(byId.get('prepared-brand-lean-cuisine-four-cheese-pizza')?.aliases.includes('Lean Cuisine cheese pizza'));
});

test('top brands batch 5 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch5\.js\?v=1\.0\.0/);
});
