import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('ari/nutrition/data/branded/AriFoodTopBrandsBatch3.js', 'utf8');
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
  vm.runInNewContext(source, sandbox, { filename: 'AriFoodTopBrandsBatch3.js' });
  return { records: registered, api: sandbox.AriFoodTopBrandsBatch3 };
}

test('top brands batch 3 adds high-demand deli, cheese, and frozen staples', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 5);
  assert.equal(api.count(), 5);
  assert.equal(new Set(records.map(food => food.id)).size, 5);

  const brands = new Set(records.map(food => food.brand));
  for (const brand of ['Hormel Natural Choice', 'Tillamook', 'El Monterey', 'Tyson', 'Red Baron']) {
    assert.ok(brands.has(brand), `${brand} should be represented`);
  }

  assert.ok(records.some(food => food.tags.includes('deli-meat')), 'batch needs deli meat');
  assert.ok(records.some(food => food.tags.includes('sliced-cheese')), 'batch needs sliced cheese');
  assert.ok(records.some(food => food.tags.includes('burrito')), 'batch needs a frozen burrito');
  assert.ok(records.some(food => food.tags.includes('nuggets')), 'batch needs frozen chicken nuggets');
  assert.ok(records.some(food => food.tags.includes('frozen-pizza')), 'batch needs frozen pizza');
});

test('top brands batch 3 preserves exact manufacturer label servings', () => {
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
    assert.equal(food.nutritionBasis?.amount, 100);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve the label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test('top brands batch 3 supports normal consumer search wording', () => {
  const { records } = loadRecords();
  const byId = new Map(records.map(food => [food.id, food]));
  assert.ok(byId.get('protein-brand-hormel-natural-choice-honey-deli-ham')?.aliases.includes('Hormel honey ham'));
  assert.ok(byId.get('dairy-brand-tillamook-medium-cheddar-slices')?.aliases.includes('Tillamook cheddar slices'));
  assert.ok(byId.get('prepared-brand-el-monterey-beef-bean-burrito')?.aliases.includes('El Monterey beef bean burrito'));
  assert.ok(byId.get('protein-brand-tyson-chicken-nuggets')?.aliases.includes('Tyson chicken nuggets'));
  assert.ok(byId.get('prepared-brand-red-baron-thin-crispy-pepperoni')?.aliases.includes('Red Baron pepperoni pizza'));
});

test('top brands batch 3 is wired through the lazy Nutrition loader', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch3\.js\?v=1\.0\.0/);
});
