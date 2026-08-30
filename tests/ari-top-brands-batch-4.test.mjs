import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch4.js', 'utf8');
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
  vm.runInNewContext(source, sandbox, { filename: 'AriFoodTopBrandsBatch4.js' });
  return { records: registered, api: sandbox.AriFoodTopBrandsBatch4 };
}

test('top brands batch 4 adds everyday deli, cheese, salad, and frozen convenience foods', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 7);
  assert.equal(api.count(), 7);
  assert.equal(new Set(records.map(food => food.id)).size, records.length);

  const ids = new Set(records.map(food => food.id));
  for (const id of [
    'protein-brand-oscar-mayer-deli-fresh-black-forest-ham',
    'dairy-brand-sargento-provolone-smoke-slices',
    'dairy-brand-sargento-swiss-slices',
    'prepared-brand-taylor-farms-southwest-chopped-salad-kit',
    'prepared-brand-hot-pockets-pepperoni-pizza',
    'prepared-brand-lean-cuisine-herb-roasted-chicken',
    'prepared-brand-stouffers-macaroni-cheese-for-one'
  ]) assert.ok(ids.has(id), `${id} should be present`);

  assert.ok(records.some(food => food.tags.includes('deli-meat')));
  assert.ok(records.some(food => food.tags.includes('provolone')));
  assert.ok(records.some(food => food.tags.includes('swiss')));
  assert.ok(records.some(food => food.tags.includes('salad-kit')));
  assert.ok(records.filter(food => food.tags.includes('frozen-meal')).length >= 3);
});

test('top brands batch 4 preserves exact manufacturer label servings and normalization', () => {
  const { records } = loadRecords();
  for (const food of records) {
    assert.equal(food.verified, true, `${food.id} must be verified`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brand specific`);
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, 'manufacturer');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);

    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs exact serving grams`);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve the exact label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test('top brands batch 4 keeps high-value consumer search aliases', () => {
  const { records } = loadRecords();
  const byId = new Map(records.map(food => [food.id, food]));
  assert.ok(byId.get('protein-brand-oscar-mayer-deli-fresh-black-forest-ham')?.aliases.includes('Oscar Mayer deli ham'));
  assert.ok(byId.get('dairy-brand-sargento-provolone-smoke-slices')?.aliases.includes('Sargento provolone'));
  assert.ok(byId.get('dairy-brand-sargento-swiss-slices')?.aliases.includes('Sargento Swiss'));
  assert.ok(byId.get('prepared-brand-taylor-farms-southwest-chopped-salad-kit')?.aliases.includes('Taylor Farms Southwest'));
  assert.ok(byId.get('prepared-brand-hot-pockets-pepperoni-pizza')?.aliases.includes('Hot Pockets pepperoni'));
  assert.ok(byId.get('prepared-brand-lean-cuisine-herb-roasted-chicken')?.aliases.includes('Lean Cuisine herb chicken'));
  assert.ok(byId.get('prepared-brand-stouffers-macaroni-cheese-for-one')?.aliases.includes("Stouffer's mac and cheese"));
});

test('top brands batch 4 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch4\.js\?v=1\.0\.0/);
});
