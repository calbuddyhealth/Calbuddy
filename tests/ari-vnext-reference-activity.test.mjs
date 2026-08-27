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
const ACTIVITY_ID = "33333333-3333-4333-8333-333333333333";

function makeSessionStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("Training exposes reference-only activity edit and delete capabilities", () => {
  const tools = getAriTools({ training: true });
  const update = tools.find((tool) => tool?.name === "propose_update_activity_log");
  const remove = tools.find((tool) => tool?.name === "propose_delete_activity_log");

  assert.ok(update);
  assert.ok(remove);
  assert.deepEqual(Object.keys(update.parameters.properties), ["referenceId", "changes"]);
  assert.deepEqual(Object.keys(remove.parameters.properties), ["referenceId"]);
  assert.equal(toolToApplicationAction(update.name), "update_activity_log");
  assert.equal(toolToApplicationAction(remove.name), "delete_activity_log");
  assert.equal(getAriTools({ nutrition: true }).some((tool) => tool.name === update.name), false);
  assert.equal(getAriTools({ nutrition: true }).some((tool) => tool.name === remove.name), false);
});

test("activity reference tools accept only a trusted reference id plus bounded changes", () => {
  const update = validateToolCall({
    name: "propose_update_activity_log",
    arguments: JSON.stringify({
      referenceId: "ref_action_run123",
      activityId: "model-must-not-control-this",
      changes: [
        { field: "duration_minutes", numberValue: 45, textValue: null },
        { field: "calories_burned", numberValue: 400, textValue: null }
      ]
    })
  }, { training: true });

  assert.equal(update.valid, true, update.error);
  assert.deepEqual(update.arguments, {
    referenceId: "ref_action_run123",
    changes: [
      { field: "duration_minutes", numberValue: 45, textValue: null },
      { field: "calories_burned", numberValue: 400, textValue: null }
    ]
  });
  assert.equal("activityId" in update.arguments, false);

  const duplicate = validateToolCall({
    name: "propose_update_activity_log",
    arguments: JSON.stringify({
      referenceId: "ref_action_run123",
      changes: [
        { field: "duration_minutes", numberValue: 30, textValue: null },
        { field: "duration_minutes", numberValue: 45, textValue: null }
      ]
    })
  }, { training: true });
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.error, "activity_reference_change_duplicate");

  const wrongRoute = validateToolCall({
    name: "propose_delete_activity_log",
    arguments: JSON.stringify({ referenceId: "ref_action_run123" })
  }, { nutrition: true });
  assert.equal(wrongRoute.valid, false);
});

test("explicit current-turn activity corrections and deletes are verified deterministically", () => {
  const route = { training: true };

  const update = reviewDeterministicRoutineLogIntent({
    turn: { message: "Actually make that 45 minutes." },
    route,
    functionCall: { name: "propose_update_activity_log" },
    availableTools: ["propose_update_activity_log"]
  });
  assert.equal(update?.decision, "propose_update_activity_log");
  assert.equal(update?.source, "deterministic_reference_activity_update");

  const remove = reviewDeterministicRoutineLogIntent({
    turn: { message: "Can you delete that run?" },
    route,
    functionCall: { name: "propose_delete_activity_log" },
    availableTools: ["propose_delete_activity_log"]
  });
  assert.equal(remove?.decision, "propose_delete_activity_log");
  assert.equal(remove?.source, "deterministic_reference_activity_delete");

  const bareFact = reviewDeterministicRoutineLogIntent({
    turn: { message: "I ran 45 minutes." },
    route,
    functionCall: { name: "propose_update_activity_log" },
    availableTools: ["propose_update_activity_log"]
  });
  assert.equal(bareFact, null);
});

test("browser lifecycle re-resolves canonical activity, updates the same reference, then tombstones it on delete", async () => {
  const source = read("ari/vnext/ari-vnext-reference-state.js");
  new vm.Script(source, { filename: "ari-vnext-reference-state.js" });

  let legacyPending = null;
  let updateInput = null;
  let deleteInput = null;
  const sessionStorage = makeSessionStorage();

  const CalBuddy = {
    getConversationId: () => "conversation-reference-activity-test",
    createPendingAction: async (action) => ({ ...action, id: `legacy-${action.action_type}` }),
    setPendingAction: (action) => { legacyPending = action; },
    getPendingAction: () => legacyPending,
    cancelPendingAction: () => { legacyPending = null; return true; }
  };

  const AriVNextActionAdapter = {
    createCalBuddyPendingAction: async () => ({ success: false, code: "unexpected_original_create" }),
    executeConfirmed: async () => ({ success: false, code: "unexpected_original_execute" })
  };

  const AriVNextActivityAdapter = {
    updateReferencedActivity: async (input) => {
      updateInput = input;
      return {
        success: true,
        activity: {
          id: ACTIVITY_ID,
          activity_name: "Outdoor run",
          duration_minutes: 45,
          calories_burned: 400,
          intensity: "vigorous",
          log_date: "2026-08-27",
          notes: "corrected"
        },
        reply: "Updated Outdoor run."
      };
    },
    deleteReferencedActivity: async (input) => {
      deleteInput = input;
      return {
        success: true,
        activity: {
          id: ACTIVITY_ID,
          activity_name: "Outdoor run",
          log_date: "2026-08-27"
        }
      };
    }
  };

  const AriVNextBridge = {
    ask: async () => ({ success: true }),
    buildContext: async () => ({}),
    getPendingAction: () => null
  };

  const window = {
    Ari: {},
    CalBuddy,
    AriVNextActionAdapter,
    AriVNextActivityAdapter,
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
    RegExp,
    Set
  });
  vm.runInContext(source, context, { filename: "ari-vnext-reference-state.js" });

  const logged = {
    id: "vnext-log-activity-1",
    name: "log_activity",
    sourceTurnId: "turn-log-activity",
    arguments: {
      activityName: "Outdoor run",
      durationMinutes: 30,
      caloriesBurned: 300,
      intensity: "moderate",
      dateText: "2026-08-27",
      notes: ""
    }
  };
  window.AriVNextReferenceState.rememberPending({ pendingAction: logged });
  const persisted = window.AriVNextReferenceState.commit({
    pendingAction: logged,
    execution: {
      success: true,
      result: {
        activity: {
          id: ACTIVITY_ID,
          activity_name: "Outdoor run",
          duration_minutes: 30,
          calories_burned: 300,
          intensity: "moderate",
          log_date: "2026-08-27"
        }
      }
    }
  });

  assert.equal(persisted?.state, "persisted");
  assert.equal(persisted?.canonical?.id, ACTIVITY_ID);
  assert.equal(persisted?.canonical?.logDate, "2026-08-27");

  const updatePending = {
    id: "vnext-update-activity-1",
    name: "update_activity_log",
    sourceTurnId: "turn-update-activity",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: {
      referenceId: persisted.referenceId,
      changes: [
        { field: "duration_minutes", numberValue: 45, textValue: null },
        { field: "calories_burned", numberValue: 400, textValue: null }
      ]
    }
  };

  const preparedUpdate = await window.AriVNextActionAdapter.createCalBuddyPendingAction(updatePending);
  assert.equal(preparedUpdate.success, true);
  assert.equal(preparedUpdate.action.action_type, "update_activity_log");
  assert.equal(preparedUpdate.action.payload.activity_id, ACTIVITY_ID);
  assert.match(preparedUpdate.action.confirmation_text, /45 min/i);
  assert.match(preparedUpdate.action.confirmation_text, /400 kcal/i);

  const updated = await window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: updatePending,
    currentTurnId: "turn-confirm-update"
  });
  assert.equal(updated.success, true);
  assert.deepEqual(updateInput, {
    activityId: ACTIVITY_ID,
    logDate: "2026-08-27",
    changes: updatePending.arguments.changes
  });
  assert.equal(updated.referenceLifecycle?.referenceId, persisted.referenceId);
  assert.equal(updated.referenceLifecycle?.state, "persisted");
  assert.equal(updated.referenceLifecycle?.details?.durationMinutes, 45);
  assert.equal(updated.referenceLifecycle?.details?.caloriesBurned, 400);

  const deletePending = {
    id: "vnext-delete-activity-1",
    name: "delete_activity_log",
    sourceTurnId: "turn-delete-activity",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    arguments: { referenceId: persisted.referenceId }
  };

  const preparedDelete = await window.AriVNextActionAdapter.createCalBuddyPendingAction(deletePending);
  assert.equal(preparedDelete.success, true);
  assert.equal(preparedDelete.action.action_type, "delete_activity_log");
  assert.equal(preparedDelete.action.payload.activity_id, ACTIVITY_ID);

  const deleted = await window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: deletePending,
    currentTurnId: "turn-confirm-delete"
  });
  assert.equal(deleted.success, true);
  assert.deepEqual(deleteInput, {
    activityId: ACTIVITY_ID,
    logDate: "2026-08-27",
    changes: []
  });
  assert.equal(deleted.referenceLifecycle?.state, "deleted");
  assert.equal(deleted.referenceLifecycle?.referenceId, persisted.referenceId);
  assert.equal(window.AriVNextReferenceState.snapshot(), null);
});

test("Training reference execution re-reads and writes through the existing user-scoped activity service", () => {
  const tools = read("api/_lib/ari-vnext/tools.js");
  const lifecycle = read("ari/vnext/ari-vnext-reference-state.js");
  const adapter = read("ari/vnext/ari-vnext-activity-adapter.js");

  assert.doesNotMatch(tools, /properties:\s*\{\s*activityId:/);
  assert.match(tools, /referenceId:/);
  assert.match(lifecycle, /target\?\.canonical\?\.id|target\.canonical\.id/);
  assert.match(lifecycle, /verifiedByTrustedExecutor !== true/);
  assert.match(adapter, /service\.listActivities\(date\)/);
  assert.match(adapter, /service\.updateActivity\(activityId/);
  assert.match(adapter, /service\.deleteActivity\(activityId\)/);
});
