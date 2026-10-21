import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

process.env.TZ = 'America/Los_Angeles';
const source = fs.readFileSync(new URL('../js/workout-plans.js', import.meta.url), 'utf8')
  .replace(/import\s+[\s\S]*?from\s+"[^"]+";/g, '')
  .split('/* =====================================================\n   START')[0];

class Element {
  constructor() { this.children = []; this.dataset = {}; this.attributes = {}; this.textContent = ''; }
  appendChild(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  set innerHTML(value) { this.children = []; }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelector(selector) { return this.children.find(node => node.attributes['aria-pressed'] === 'true'); }
  closest(selector) { return selector === '[data-workout-action]' ? this : null; }
  focus() { this.focused = true; }
}
function setup(search = '') {
  const nodes = Object.fromEntries(['workoutWeekGrid', 'workoutDaySelector', 'workoutWeekRelativeLabel', 'workoutWeekDateRange'].map(id => [id, new Element()]));
  nodes.workoutDayCardTemplate = { content: { cloneNode() {
    const card = Object.fromEntries(['', '__button', '__day', '__date', '__type', '__title', '__summary', '__open'].map(suffix => ['.workout-day-card' + suffix, new Element()]));
    card['.workout-day-card__button'].dataset.workoutAction = 'edit-day';
    return { querySelector: selector => card[selector] };
  } } };
  const context = vm.createContext({
    console, URLSearchParams,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-22T02:00:00Z'])); } },
    document: { querySelectorAll: () => [], getElementById: id => nodes[id] || null, createElement: () => new Element() },
    window: { location: { search } },
    WorkoutFocuses: { get: () => ({ label: 'Cardio' }) },
    WorkoutPlanController: { getDate: date => date === '2026-10-18'
      ? { type: 'workout', title: 'Cardio', focusId: 'cardio', exercises: [{}, {}, {}] }
      : { type: 'off', exercises: [] } }
  });
  vm.runInContext(source + `\ncacheDom(); renderTemplates = () => {}; openDayEditor = (day, date) => { globalThis.opened = { day, date }; };`, context);
  return { context, nodes, run: code => vm.runInContext(code, context) };
}
const selected = nodes => nodes.workoutDaySelector.children.find(button => button.attributes['aria-pressed'] === 'true');
const cardText = (nodes, suffix) => nodes.workoutWeekGrid.children[0].querySelector('.workout-day-card__' + suffix).textContent;

test('selects local today with seven dates and one empty card', async () => {
  const { run, nodes, context } = setup();
  await run('initializeSelectedWeek()'); run('renderWeek()');
  assert.equal(nodes.workoutDaySelector.children.length, 7);
  assert.equal(nodes.workoutWeekGrid.children.length, 1);
  assert.equal(selected(nodes).dataset.date, '2026-10-21');
  assert.equal(selected(nodes).attributes['aria-current'], 'date');
  assert.equal(cardText(nodes, 'title'), 'No workout planned');
  assert.match(cardText(nodes, 'open'), /Plan Workout/);
  const button = nodes.workoutWeekGrid.children[0].querySelector('.workout-day-card__button');
  context.handleClick({ target: button });
  assert.equal(context.opened.date, '2026-10-21');
});

test('selecting a planned day shows its summary and edits its exact date', async () => {
  const { run, nodes, context } = setup();
  await run('initializeSelectedWeek()'); run('renderWeek()');
  context.handleClick({ target: nodes.workoutDaySelector.children[0] });
  assert.equal(selected(nodes).dataset.date, '2026-10-18');
  assert.equal(cardText(nodes, 'title'), 'Cardio');
  assert.equal(cardText(nodes, 'summary'), '3 exercises');
  assert.match(cardText(nodes, 'open'), /Edit Workout/);
  assert.equal(selected(nodes).focused, true);
  context.handleClick({ target: nodes.workoutWeekGrid.children[0].querySelector('.workout-day-card__button') });
  assert.equal(context.opened.date, '2026-10-18');
  run('renderWeek()');
  assert.equal(selected(nodes).dataset.date, '2026-10-18');
  assert.equal(nodes.workoutWeekGrid.children.length, 1);
});

test('week navigation resets selection in the new week and returns to today', async () => {
  const { run, nodes } = setup();
  await run('initializeSelectedWeek()'); run('renderWeek()');
  await run('changeSelectedWeek(addDays(state.selectedWeekStart, 7))');
  assert.equal(selected(nodes).dataset.date, '2026-10-25');
  assert.equal(nodes.workoutDaySelector.children.some(node => node.attributes['aria-current']), false);
  await run('changeSelectedWeek(addDays(state.selectedWeekStart, -7))');
  assert.equal(selected(nodes).dataset.date, '2026-10-21');
});

test('explicit Training date link selects the requested day across a year boundary', async () => {
  const { run, nodes } = setup('?date=2027-01-01');
  await run('initializeSelectedWeek()'); run('renderWeek()');
  assert.equal(selected(nodes).dataset.date, '2027-01-01');
  assert.deepEqual(nodes.workoutDaySelector.children.map(node => node.dataset.date), ['2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
});
