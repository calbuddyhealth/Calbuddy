import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = fs.readFileSync(path.join(root, "ari/vnext/ari-vnext-phase9b-correction-continuity.js"), "utf8");

function createHarness() {
  const storage = new Map();
  let bridgePending = null;
  let legacyPending = null;
  let pendingSeenByOriginalAsk = null;
  let referenceCancelCount = 0;
  let orphanReconcileCount = 0;
  let afterExecutionHook = null;

  const sessionStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };

  const window = {
    Ari: {},
    CalBuddy: {
      getConversationId() { return "conversation-phase9b"; },
      getPendingAction() { return legacyPending; },
      clearPendingAction() { legacyPending = null; }
    },
    AriVNextReferenceState: {
      cancel() { referenceCancelCount += 1; return true; }
    },
    AriVNextOperationRegistry: {
      ready: true,
      registerAfterExecution(handler) { afterExecutionHook = handler; return () => {}; },
      reconcileOrphanedLegacyPending() { orphanReconcileCount += 1; return true; }
    },
    AriVNextBridge: {
      getPendingAction() { return bridgePending; },
      clearPendingAction() { bridgePending = null; },
      async ask(message) {
        pendingSeenByOriginalAsk = bridgePending;
        return { success: true, message };
      },
      async buildContext() {
        return {
          referenceState: {
            references: [{
              referenceId: "ref_live_activity_survivor",
              domain: "training",
              entityType: "activity_log",
              state: "persisted"
            }]
          }
        };
      }
    },
    dispatchEvent() {},
    setInterval,
    clearInterval
  };

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const context = vm.createContext({
    window,
    sessionStorage,
    CustomEvent,
    Date,
    Math,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Map,
    Set,
    Object,
    RegExp,
    console,
    setInterval,
    clearInterval
  });
  new vm.Script(source, { filename: "ari-vnext-phase9b-correction-continuity.js" }).runInContext(context);

  return {
    window,
    setBridgePending(value) { bridgePending = value; },
    setLegacyPending(value) { legacyPending = value; },
    getBridgePending() { return bridgePending; },
    getLegacyPending() { return legacyPending; },
    getPendingSeenByOriginalAsk() { return pendingSeenByOriginalAsk; },
    getReferenceCancelCount() { return referenceCancelCount; },
    getOrphanReconcileCount() { return orphanReconcileCount; },
    getAfterExecutionHook() { return afterExecutionHook; }
  };
}

test("Phase 9B browser layer installs only on top of the trusted bridge and registry", () => {
  const harness = createHarness();
  assert.equal(harness.window.AriVNextPhase9BCorrectionContinuity?.ready, true);
  assert.equal(harness.window.AriVNextPhase9BCorrectionContinuity?.version, "1.0.0");
  assert.equal(typeof harness.getAfterExecutionHook(), "function");
});

test("Phase 9B correction supersedes the old vNext and linked legacy pending action before send", async () => {
  const harness = createHarness();
  const pending = {
    id: "action-old-dinner",
    name: "update_nutrition_meal",
    sourceTurnId: "turn-old",
    arguments: { referenceId: "ref_live_dinner" }
  };
  harness.setBridgePending(pending);
  harness.setLegacyPending({ vnext_action_id: pending.id, action_type: "update_nutrition_meal" });

  await harness.window.AriVNextBridge.ask("No, I meant the lunch.");

  assert.equal(harness.getPendingSeenByOriginalAsk(), null);
  assert.equal(harness.getBridgePending(), null);
  assert.equal(harness.getLegacyPending(), null);
  assert.equal(harness.getReferenceCancelCount(), 1);
  assert.ok(harness.getOrphanReconcileCount() >= 1);
});

test("Phase 9B ordinary confirmation wording is not silently superseded", async () => {
  const harness = createHarness();
  const pending = {
    id: "action-current",
    name: "update_nutrition_meal",
    sourceTurnId: "turn-current",
    arguments: { referenceId: "ref_live_lunch" }
  };
  harness.setBridgePending(pending);

  await harness.window.AriVNextBridge.ask("yes");

  assert.equal(harness.getPendingSeenByOriginalAsk()?.id, pending.id);
  assert.equal(harness.getReferenceCancelCount(), 0);
});

test("Phase 9B confirmed delete records only a short-lived non-writable invalidation pointer", async () => {
  const harness = createHarness();
  const hook = harness.getAfterExecutionHook();
  const execution = { success: true, result: { deleted: true, id: "canonical-id-must-not-be-copied" } };

  const returned = await hook({
    vnextPendingAction: {
      id: "action-delete-activity",
      name: "delete_activity_log",
      sourceTurnId: "turn-delete",
      arguments: { referenceId: "ref_live_activity_deleted" }
    }
  }, execution);

  assert.equal(returned, execution);
  const context = await harness.window.AriVNextBridge.buildContext({ conversationId: "conversation-phase9b" });
  const invalidation = context?.referenceState?.recentInvalidations?.[0];
  assert.equal(invalidation?.referenceId, "ref_live_activity_deleted");
  assert.equal(invalidation?.operation, "delete_activity_log");
  assert.equal(invalidation?.domain, "training");
  assert.equal(invalidation?.entityType, "activity_log");
  assert.equal(invalidation?.state, "invalidated");
  assert.ok(Date.parse(invalidation?.expiresAt) > Date.now());
  assert.equal(JSON.stringify(invalidation).includes("canonical-id-must-not-be-copied"), false);
});

test("Phase 9B a later successful mutation clears the older delete invalidation anchor", async () => {
  const harness = createHarness();
  const hook = harness.getAfterExecutionHook();

  await hook({
    vnextPendingAction: {
      id: "action-delete-weight",
      name: "delete_weight_log",
      sourceTurnId: "turn-delete",
      arguments: { referenceId: "ref_live_weight_deleted" }
    }
  }, { success: true });

  let context = await harness.window.AriVNextBridge.buildContext({ conversationId: "conversation-phase9b" });
  assert.equal(context?.referenceState?.recentInvalidations?.length, 1);

  await hook({
    vnextPendingAction: {
      id: "action-new-update",
      name: "update_activity_log",
      sourceTurnId: "turn-update",
      arguments: { referenceId: "ref_live_activity_survivor" }
    }
  }, { success: true });

  context = await harness.window.AriVNextBridge.buildContext({ conversationId: "conversation-phase9b" });
  assert.equal(context?.referenceState?.recentInvalidations, undefined);
});
