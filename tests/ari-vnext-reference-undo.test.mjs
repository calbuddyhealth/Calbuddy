import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  getAriTools,
  toolToApplicationAction,
  validateToolCall
} from "../api/_lib/ari-vnext/tools.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const MEAL_MUTATION_ID = "11111111-1111-4111-8111-111111111111";

function makeSessionStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("Nutrition exposes a reference-only Undo capability", () => {
  const tools = getAriTools({ nutrition: true });
  const undo = tools.find((tool) => tool?.name === "propose_undo_nutrition_mutation");

  assert.ok(undo);
  assert.deepEqual(Object.keys(undo.parameters.properties), ["referenceId"]);
  assert.deepEqual(undo.parameters.required, ["referenceId"]);
  assert.equal(toolToApplicationAction(undo.name), "undo_nutrition_mutation");

  const valid = validateToolCall({
    name: undo.name,
    arguments: JSON.stringify({ referenceId: "ref_action_meal123" })
  }, { nutrition: true });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.arguments, { referenceId: "ref_action_meal123" });

  const wrongRoute = validateToolCall({
    name: undo.name,
    arguments: JSON.stringify({ referenceId: "ref_action_meal123" })
  }, { training: true });
  assert.equal(wrongRoute.valid, false);
});

test("explicit current-turn Undo is verified without history granting permission", () => {
  const route = { nutrition: true };
  const tool = "propose_undo_nutrition_mutation";

  const direct = reviewDeterministicRoutineLogIntent({
    turn: { message: "Can you undo that?" },
    route,
    functionCall: { name: tool },
    availableTools: [tool]
  });
  assert.equal(direct?.decision, tool);
  assert.equal(direct?.confidence, 1);
  assert.equal(direct?.source, "deterministic_reference_undo");

  const statement = reviewDeterministicRoutineLogIntent({
    turn: { message: "That meal was good." },
    route,
    functionCall: { name: tool },
    availableTools: [tool]
  });
  assert.equal(statement, null);
});

test("browser reference lifecycle resolves canonical mutation id, executes journal Undo, and tombstones the target", async () => {
  const source = read("ari/vnext/ari-vnext-reference-state.js");
  new vm.Script(source, { filename: "ari-vnext-reference-state.js" });

  let legacyPending = null;
  let bridgePending = null;
  let undoneMutationId = null;
  const sessionStorage = makeSessionStorage();

  const CalBuddy = {
    getConversationId: () => "conversation-reference-undo-test",
    createPendingAction: async (action) => ({ ...action, id: "legacy-pending-1" }),
    setPendingAction: (action) => { legacyPending = action; },
    getPendingAction: () => legacyPending,
    cancelPendingAction: () => { legacyPending = null; return true; },
    undoNutritionMutation: async (mutationId) => {
      undoneMutationId = mutationId;
      return { success: true, mutationId, todayCalories: 1234 };
    }
  };

  const AriVNextActionAdapter = {
    createCalBuddyPendingAction: async () => ({ success: false, code: "unexpected_original_create" }),
    executeConfirmed: async () => ({ success: false, code: "unexpected_original_execute" })
  };

  const AriVNextBridge = {
    ask: async () => ({ success: true }),
    buildContext: async () => ({}),
    getPendingAction: () => bridgePending
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter,
    AriVNextBridge,
    setInterval,
    clearInterval,
    setTimeout,
    dispatchEvent: () => true
  };
  window.window = window;

  const context = vm.createContext({
    window,
    sessionStorage,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    },
    console,
    setInterval,
    clearInterval,
    setTimeout,
    Date,
    Math,
    JSON,
    Object,
    String,
    Number,
    RegExp
  });
  vm.runInContext(source, context, { filename: "ari-vnext-reference-state.js" });

  const mealPending = {
    id: "vnext-log-meal-1",
    name: "log_meal",
    sourceTurnId: "turn-log-meal",
    arguments: {
      name: "5 small red potatoes",
      calories: 300,
      quantity: 5,
      unit: "small potatoes",
      mealCategory: "Meal"
    }
  };
  window.AriVNextReferenceState.rememberPending({ pendingAction: mealPending });
  const persisted = window.AriVNextReferenceState.commit({
    pendingAction: mealPending,
    execution: {
      success: true,
      result: {
        saved: {
          id: "22222222-2222-4222-8222-222222222222",
          ari_mutation_id: MEAL_MUTATION_ID,
          nutrition_date: "2026-08-27"
        }
      }
    }
  });

  assert.equal(persisted?.state, "persisted");
  assert.equal(persisted?.canonical?.mutationId, MEAL_MUTATION_ID);

  const undoPending = {
    id: "vnext-undo-meal-1",
    name: "undo_nutrition_mutation",
    sourceTurnId: "turn-undo-meal",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: { referenceId: persisted.referenceId }
  };
  bridgePending = undoPending;

  const prepared = await window.AriVNextActionAdapter.createCalBuddyPendingAction(undoPending);
  assert.equal(prepared.success, true);
  assert.equal(prepared.action.action_type, "undo_nutrition_mutation");
  assert.equal(prepared.action.payload.mutation_id, MEAL_MUTATION_ID);
  assert.match(prepared.action.confirmation_text, /5 small red potatoes/i);

  const execution = await window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: undoPending,
    currentTurnId: "turn-confirm-undo"
  });

  assert.equal(execution.success, true);
  assert.equal(undoneMutationId, MEAL_MUTATION_ID);
  assert.equal(execution.referenceLifecycle?.state, "deleted");
  assert.equal(execution.referenceLifecycle?.referenceId, persisted.referenceId);
  assert.equal(window.AriVNextReferenceState.snapshot(), null);
  assert.equal(legacyPending, null);
});

test("reference lifecycle never trusts a model-supplied mutation id", () => {
  const tools = read("api/_lib/ari-vnext/tools.js");
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");

  assert.match(tools, /properties:\s*\{\s*referenceId:/);
  assert.doesNotMatch(tools, /properties:\s*\{\s*mutationId:/);
  assert.match(lifecycle, /target\?\.canonical\?\.mutationId/);
  assert.match(lifecycle, /verifiedByTrustedExecutor !== true/);
  assert.match(lifecycle, /undoNutritionMutation\(mutationId\)/);
  assert.match(lifecycle, /state: "deleted"/);
});
