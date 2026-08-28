import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../ari/vnext/ari-vnext-phase9c-compound-actions.js", import.meta.url),
  "utf8"
);

function makeEnv() {
  let handler = null;
  let calls = 0;
  const lifecycle = {
    referenceId: "ref_action_old",
    state: "persisted",
    domain: "nutrition",
    entityType: "meal",
    canonical: { id: "meal-123" },
    verification: { verifiedByTrustedExecutor: true }
  };
  const live = {
    referenceId: "ref_live_meal_new",
    state: "persisted",
    domain: "nutrition",
    entityType: "meal",
    canonical: { id: "meal-123" },
    verification: { verifiedByTrustedContext: true, currentContextRead: true }
  };

  const registry = {
    ready: true,
    registerOperation(name, handlers) { handler = { name, ...handlers }; },
    snapshot() { return { operationNames: ["update_nutrition_meal", "update_activity_log", "compound_action_batch"] }; }
  };
  const window = {
    Ari: {},
    location: { pathname: "/nutrition.html" },
    AriVNextOperationRegistry: registry,
    AriVNextReferenceState: {
      resolveReference(id) { return id === lifecycle.referenceId ? lifecycle : null; },
      snapshot() { return { references: [lifecycle] }; }
    },
    AriVNextBridge: {
      async buildContext() { return { referenceState: { references: [live] } }; },
      getPendingAction() { return null; },
      clearPendingAction() {}
    },
    AriVNextActionAdapter: {
      async executeConfirmed() { calls += 1; return { success: true, result: { reply: "done" } }; }
    },
    CalBuddy: {
      async getUserContext() { return {}; },
      async createPendingAction(action) { return action; },
      setPendingAction() {},
      getPendingAction() { return null; },
      clearPendingAction() {}
    },
    dispatchEvent() {},
    setInterval() { return 1; },
    clearInterval() {}
  };
  class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } }
  const context = { window, CustomEvent, console, Date, Array, Object, String, Number, Boolean, Map, Set, JSON, Promise };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { getHandler: () => handler, getCalls: () => calls };
}

test("Phase 9C accepts an old trusted ref_action only when fresh ref_live context has the same unique canonical identity", async () => {
  const env = makeEnv();
  const pending = {
    id: "batch-1",
    sourceTurnId: "turn-1",
    name: "compound_action_batch",
    expiresAt: "2099-01-01T00:00:00.000Z",
    arguments: {
      actions: [
        {
          name: "update_nutrition_meal",
          clause: "change that meal",
          arguments: {
            referenceId: "ref_action_old",
            changes: [{ field: "calories", numberValue: 650, textValue: null }]
          }
        },
        {
          name: "update_activity_log",
          clause: "update this activity",
          arguments: {}
        }
      ]
    }
  };

  const result = await env.getHandler().executeConfirmed({ vnextPendingAction: pending });
  assert.equal(result.success, true);
  assert.equal(env.getCalls(), 2);
});

test("Phase 9C source requires canonical identity equality for lifecycle handoff", () => {
  assert.match(source, /canonicalIdentity\(lifecycle\)/);
  assert.match(source, /canonicalIdentity\(reference\) === identity/);
  assert.match(source, /verifiedByTrustedExecutor !== true/);
});
