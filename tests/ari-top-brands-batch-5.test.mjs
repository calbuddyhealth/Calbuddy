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

test('top brands batch 5 contains 25 unique high-demand branded foods', () => {
  const { records, api } = loadRecords();
  assert.equal(records.length, 25);
  assert.equal(api.count(), 25);
  assert.equal(new Set(records.map(food => food.id)).size, records.length);

  const ids = new Set(records.map(food => food.id));
  for (const id of [
    'protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken',
    'protein-brand-hillshire-ultra-thin-honey-ham',
    'prepared-brand-hot-pockets-hickory-ham-cheddar',
    'prepared-brand-lean-cuisine-four-cheese-pizza',
    'prepared-brand-uncrustables-peanut-butter-grape-jelly',
    'prepared-brand-jimmy-dean-sausage-egg-cheese-biscuit',
    'prepared-brand-el-monterey-chicken-cheese-taquitos',
    'protein-brand-tyson-crispy-chicken-strips',
    'dairy-brand-yoplait-original-strawberry-6oz',
    'prepared-brand-totinos-pepperoni-pizza-rolls'
  ]) assert.ok(ids.has(id), `${id} should be present`);

  assert.ok(records.filter(food => food.tags.includes('deli-meat')).length >= 2);
  assert.ok(records.filter(food => food.tags.includes('breakfast')).length >= 5);
  assert.ok(records.filter(food => food.tags.includes('taquitos')).length >= 4);
  assert.ok(records.filter(food => food.brand === 'Tyson').length >= 4);
  assert.ok(records.filter(food => food.brand === 'Yoplait').length >= 3);
  assert.ok(records.filter(food => food.brand === 'Uncrustables').length >= 3);
  assert.ok(records.filter(food => food.tags.includes('pizza-rolls')).length >= 2);
});

test('top brands batch 5 preserves exact label servings and mathematical normalization', () => {
  const { records } = loadRecords();
  for (const food of records) {
    assert.equal(food.verified, true, `${food.id} must be verified`);
    assert.equal(food.metadata?.brandSpecific, true, `${food.id} must be brand specific`);
    assert.ok(
      ['manufacturer', 'manufacturer-plus-current-retail-label'].includes(food.metadata?.sourceProvenance?.sourceTier),
      `${food.id} must have an approved source tier`
    );
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\//);

    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0, `${food.id} needs exact serving grams`);
    assert.ok(food.servings?.some(serving => serving.isDefault && serving.grams === label.servingGrams), `${food.id} must preserve the label serving`);

    const scaledCalories = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(scaledCalories - label.calories) <= 0.15, `${food.id} must scale back to label calories`);
  }
});

test('top brands batch 5 includes normal consumer aliases across the expanded families', () => {
  const { records } = loadRecords();
  const byId = new Map(records.map(food => [food.id, food]));
  assert.ok(byId.get('protein-brand-oscar-mayer-deli-fresh-rotisserie-chicken')?.aliases.includes('Oscar Mayer deli chicken'));
  assert.ok(byId.get('protein-brand-hillshire-ultra-thin-honey-ham')?.aliases.includes('Hillshire honey ham'));
  assert.ok(byId.get('prepared-brand-uncrustables-peanut-butter-grape-jelly')?.aliases.includes('Uncrustables grape'));
  assert.ok(byId.get('prepared-brand-jimmy-dean-bacon-egg-cheese-biscuit')?.aliases.includes('Jimmy Dean bacon egg cheese biscuit'));
  assert.ok(byId.get('prepared-brand-el-monterey-chicken-cheese-taquitos')?.aliases.includes('El Monterey chicken taquitos'));
  assert.ok(byId.get('protein-brand-tyson-crispy-chicken-strips')?.aliases.includes('Tyson chicken strips'));
  assert.ok(byId.get('dairy-brand-yoplait-original-french-vanilla-6oz')?.aliases.includes('Yoplait French vanilla'));
  assert.ok(byId.get('prepared-brand-totinos-pepperoni-pizza-rolls')?.aliases.includes("Totino's pepperoni rolls"));
});

test('top brands batch 5 is wired through the lazy Nutrition loader at v1.1.0', () => {
  assert.match(loader, /branded\/AriFoodTopBrandsBatch5\.js\?v=1\.1\.0/);
});
