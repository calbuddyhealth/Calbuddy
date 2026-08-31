import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const batchFiles = [1,2,3,4,5,6,7,8].map(n => `ari/nutrition/data/branded/AriFoodTopBrandsBatch${n}.js`);
const loader = fs.readFileSync('js/nutrition-food-loader.js', 'utf8');

function loadAll() {
  const byId = new Map();
  const bySource = new Map();
  const sandbox = { console: { info(){}, warn(){}, error(){} }, AriFoodRegistry: {
    registerMany(records, { source } = {}) { for (const r of records) { byId.set(r.id, r); const s=source||r.source; if(!bySource.has(s)) bySource.set(s,[]); bySource.get(s).push(r); } return { registered: records.length, rejected: 0 }; },
    getBySource(source) { return bySource.get(source) || []; },
    remove(id) { byId.delete(id); for (const [s,items] of bySource) bySource.set(s, items.filter(x=>x.id!==id)); return true; }
  }};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  for (const file of batchFiles) vm.runInNewContext(fs.readFileSync(file,'utf8'), sandbox, { filename:file });
  return { records:[...byId.values()], batch8:sandbox.AriFoodTopBrandsBatch8.foods() };
}

test('batch 8 adds exactly 25 de-duplicated Nature Valley products', () => {
  const { records, batch8 } = loadAll();
  assert.equal(batch8.length, 25);
  assert.equal(new Set(batch8.map(x=>x.id)).size, 25);
  assert.ok(batch8.every(x=>x.brand === 'Nature Valley'));
  assert.ok(!batch8.some(x=>/oats-honey/.test(x.id)), 'existing Oats n Honey product must stay excluded');
  const allIds = records.map(x=>x.id);
  assert.equal(new Set(allIds).size, allIds.length, 'top-brand batches must not overlap IDs');
});

test('batch 8 spans crunchy, sweet-salty, wafer, and biscuit products', () => {
  const { batch8 } = loadAll();
  const tags = tag => batch8.filter(x=>x.tags.includes(tag)).length;
  assert.ok(tags('crunchy') >= 8);
  assert.ok(tags('sweet-salty') >= 7);
  assert.ok(tags('wafer-bar') >= 7);
  assert.ok(tags('biscuit-sandwich') >= 3);
});

test('batch 8 preserves manufacturer nutrition and serving normalization', () => {
  const { batch8 } = loadAll();
  for (const food of batch8) {
    assert.equal(food.verified, true);
    assert.equal(food.metadata?.brandSpecific, true);
    assert.equal(food.metadata?.sourceProvenance?.sourceTier, 'manufacturer');
    assert.match(food.metadata?.sourceProvenance?.sourceUrl || '', /^https:\/\/www\.naturevalley\.com\/products\//);
    const label = food.metadata?.labelNutrition;
    assert.ok(label?.servingGrams > 0);
    assert.ok(food.servings.some(s=>s.isDefault && s.grams === label.servingGrams));
    const kcal = food.nutrition.calories * label.servingGrams / 100;
    assert.ok(Math.abs(kcal - label.calories) <= 0.15, `${food.id} must round-trip calories`);
  }
});

test('batch 8 exposes normal consumer aliases and loader wiring', () => {
  const { batch8 } = loadAll();
  assert.ok(batch8.some(x=>x.aliases.includes('Nature Valley peanut butter bars')));
  assert.match(loader, /branded\/AriFoodTopBrandsBatch8\.js\?v=1\.0\.0/);
});
