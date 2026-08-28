import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../ari/vnext/ari-vnext-registry-coverage.js", import.meta.url), "utf8");

test("permanent registry coverage is observation-only", () => {
  assert.doesNotMatch(source, /registerOperation\(/);
  assert.doesNotMatch(source, /registerApplicationExecutor\(/);
  assert.doesNotMatch(source, /executeAction\s*=/);
  assert.doesNotMatch(source, /calbuddySupabase|\.rpc\(/);
  assert.doesNotMatch(source, /AriVNextOperationRegistryPhase8[BC]/);
});

test("permanent registry coverage requires every model-visible mutation", async () => {
  const required = [
    "log_meal", "log_activity", "log_weight", "update_goal", "plan_meal", "log_planned_meal",
    "plan_workout", "edit_workout", "update_nutrition_meal", "undo_nutrition_mutation",
    "update_weight_log", "delete_weight_log", "update_activity_log", "delete_activity_log",
    "edit_referenced_workout", "delete_workout", "log_referenced_planned_meal",
    "log_referenced_plan_components", "discard_referenced_meal_plan", "replace_referenced_meal_plan",
    "create_circle_meetup", "join_circle_meetup", "leave_circle_meetup", "cancel_circle_meetup",
    "create_circle_mission", "join_circle_mission", "submit_circle_mission_progress",
    "create_circle_crew", "accept_circle_crew_invite", "decline_circle_crew_invite", "leave_circle_crew", "archive_circle_crew"
  ];
  const window = {
    AriVNextOperationRegistry: { ready: true, snapshot() { return { operationNames: required }; } },
    dispatchEvent() {}, setInterval, clearInterval
  };
  window.window = window;
  const sandbox = { window, CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }, setInterval, clearInterval, console, Object, Set, Array };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "ari-vnext-registry-coverage.js" });
  assert.equal(window.AriVNextRegistryCoverage?.ready, true);
  assert.equal(window.AriVNextRegistryCoverage?.fallbackPolicy, "no_model_visible_mutation_requires_captured_fallback");
  for (const name of required) assert.ok(window.AriVNextRegistryCoverage.modelMutationOperations.includes(name));
});
