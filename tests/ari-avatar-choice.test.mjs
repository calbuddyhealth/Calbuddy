import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile, access } from "node:fs/promises";

const source = await readFile(new URL("../js/ari-avatar-choice.js", import.meta.url), "utf8");
const home = await readFile(new URL("../js/home.js", import.meta.url), "utf8");
function harness(storage = new Map()) {
  const events = new Map();
  const elements = new Map();
  const timers = new Map();
  let timerId = 0;
  const controls = ["female", "male"].map(value => ({ value, disabled: true }));
  const context = vm.createContext({
    document: { documentElement: { dataset: {} }, querySelectorAll: () => controls,
      querySelector: () => null, addEventListener() {}, getElementById: id => elements.get(id) || null },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id), Image: class {}, console
  });
  context.window = { addEventListener(type, handler) { events.set(type, handler); },
    dispatchEvent(event) { events.get(event.type)?.(event); } };
  vm.runInContext(source, context);
  return { context, api: context.window.AriAvatar, controls, storage, elements, events, timers };
}

test("choice persists across reload and stays isolated between accounts", () => {
  const h = harness();
  assert.equal(h.api.select("male"), false);
  h.api.activateUser("account-a");
  assert.equal(h.api.select("male"), true);
  assert.equal(h.controls[1].checked, true);
  const reload = harness(h.storage);
  reload.api.activateUser("account-a");
  assert.equal(reload.api.getVariant(), "male");
  reload.api.activateUser("account-b");
  assert.equal(reload.api.getVariant(), "female");
  assert.equal(reload.api.select("invalid"), false);
  reload.api.activateUser(null);
  assert.equal(reload.api.select("male"), false);
  assert.ok(reload.controls.every(input => input.disabled));
});

test("all numbered PNG paths and idle assets exist for both variants", async () => {
  const h = harness();
  h.api.activateUser("a");
  for (const variant of ["female", "male"]) {
    h.api.select(variant);
    const preset = h.api.getPreset();
    for (const file of [...Object.values(preset.assets), ...Object.values(preset.sequence.frameSources)]) {
      await access(new URL(`../${file}`, import.meta.url));
    }
  }
});

test("male thinking visits every pose, cycles while waiting, and can reverse", () => {
  const h = harness();
  h.elements.set("ariThinkingSequence", { getAttribute: () => "present", dataset: {} });
  h.api.activateUser("a");
  h.api.select("male");
  vm.runInContext(home, h.context);
  vm.runInContext('ariThinkingSequencePhase = "entering"', h.context);
  const visited = [1];
  for (let i = 0; i < 7; i++) {
    vm.runInContext("advanceAriThinkingSequence()", h.context);
    visited.push(vm.runInContext("ariThinkingSequenceFrame", h.context));
  }
  assert.deepEqual(visited, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(vm.runInContext("ariThinkingSequencePhase", h.context), "holding");
  const cycle = [];
  for (let i = 0; i < 8; i++) {
    const [id, callback] = h.timers.entries().next().value;
    h.timers.delete(id);
    callback();
    cycle.push(vm.runInContext("ariThinkingSequenceFrame", h.context));
  }
  assert.deepEqual(cycle, [1, 2, 3, 4, 5, 6, 7, 8]);
  const before = vm.runInContext("ariThinkingSequenceFrame", h.context);
  h.api.select("female");
  assert.equal(vm.runInContext("ariThinkingSequenceFrame", h.context), before);
  assert.equal(vm.runInContext("ariThinkingSequencePhase", h.context), "holding");
  h.api.select("male");
  vm.runInContext('ariThinkingSequencePhase = "exiting"', h.context);
  for (let i = 0; i < 7; i++) vm.runInContext("reverseAriThinkingSequence()", h.context);
  assert.equal(vm.runInContext("ariThinkingSequencePhase", h.context), "idle");
  assert.equal(vm.runInContext("ariThinkingSequenceFrame", h.context), 1);
});
