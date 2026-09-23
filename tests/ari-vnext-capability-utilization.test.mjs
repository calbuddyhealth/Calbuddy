import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  getAriTools,
  toolToApplicationAction
} from "../api/_lib/ari-vnext/tools.js";

const runtime = fs.readFileSync("ari/runtime/ari-runtime-controller.js", "utf8");
const initiative = fs.readFileSync("ari/vnext/ari-vnext-initiative.js", "utf8");
const contextGuard = fs.readFileSync("ari/vnext/ari-vnext-context-guard.js", "utf8");
const actionAdapter = fs.readFileSync("ari/vnext/ari-vnext-action-adapter.js", "utf8");
const operationRegistry = fs.readFileSync("ari/vnext/ari-vnext-operation-registry.js", "utf8");
const circleAdapter = fs.readFileSync("ari/vnext/ari-vnext-circle-action-adapter.js", "utf8");
const bridge = fs.readFileSync("ari/vnext/ari-vnext-bridge.js", "utf8");

function capabilityNames() {
  const routes = [
    {},
    { training: true, nutrition: true, goals: true },
    { social: true, circleAllowed: true, teenMode: false }
  ];
  return [...new Set(routes.flatMap((route) => getAriTools(route).map((tool) => tool.name)))].sort();
}

test("every advertised Ari application tool maps to a concrete application action", () => {
  const names = capabilityNames();
  assert.equal(names.length, 23);

  for (const name of names) {
    const action = toolToApplicationAction(name);
    assert.notEqual(action, "none", `${name} must map to an application action`);
    assert.ok(action, `${name} must map to a non-empty application action`);
  }
});

test("every mapped application action has a trusted executor implementation", () => {
  const executorSources = [
    actionAdapter,
    operationRegistry,
    circleAdapter,
    bridge
  ].join("\n");

  for (const name of capabilityNames()) {
    const action = toolToApplicationAction(name);
    assert.match(
      executorSources,
      new RegExp(`["']${action.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, "\\\\$&")}["']`),
      `${name} -> ${action} must exist in a trusted executor`
    );
  }
});

test("runtime readiness guarantees optional executor layers instead of merely advertising them", () => {
  assert.match(runtime, /ari-vnext-action-adapter\.js\?v=1\.5\.0/);
  assert.match(actionAdapter, /mapWorkoutReplacementValidated/);
  assert.match(actionAdapter, /executeValidatedWorkoutReplacement/);
  assert.doesNotMatch(runtime, /ari-whole-workout-replacement/);

  assert.match(runtime, /ari-vnext-context-guard\.js\?v=1\.2\.3/);
  assert.match(contextGuard, /AriVNextCircleActionAdapter\?\.ready === true/);
  assert.match(contextGuard, /ari-vnext-circle-action-adapter\.js\?v=1\.1\.1/);

  assert.match(runtime, /ari-vnext-initiative\.js\?v=1\.2\.1/);
  assert.match(initiative, /ari-vnext-operation-registry\.js\?v=1\.9\.0/);
  assert.match(initiative, /window\.AriVNextInitiative = createClient\(\)/);
  assert.match(initiative, /ensureRegistry\(\)/);
});
