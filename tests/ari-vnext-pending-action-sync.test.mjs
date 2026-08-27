import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(
  new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url),
  "utf8"
);

function makeHarness({ executionSuccess = true, bridgePending = true, legacyPending = true, executionReply = "" } = {}) {
  const pending = {
    id: "action_sync_test",
    sourceTurnId: "turn_sync_test",
    name: "log_meal"
  };

  let bridgeValue = bridgePending ? { ...pending } : null;
  let legacyValue = legacyPending
    ? {
        action_type: "log_meal",
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        confirmation_text: "Log test meal?"
      }
    : null;
  let bridgeClears = 0;
  let legacyClears = 0;
  let baseExecutions = 0;

  const window = {
    Ari: {},
    AriVNextActionAdapter: {
      async prepareCalBuddyAction(pendingAction) {
        return { success: true, action: { action_type: pendingAction?.name || "unknown" } };
      },
      async createCalBuddyPendingAction() {
        return { success: true, action: legacyValue };
      },
      async executeConfirmed() {
        baseExecutions += 1;
        return executionReply
          ? { success: executionSuccess, reply: executionReply, result: { ok: executionSuccess } }
          : { success: executionSuccess, result: { ok: executionSuccess } };
      }
    },
    AriVNextBridge: {
      getPendingAction() {
        return bridgeValue;
      },
      clearPendingAction() {
        bridgeClears += 1;
        bridgeValue = null;
      }
    },
    CalBuddy: {
      async executeAction(action) {
        return { success: true, action };
      },
      getPendingAction() {
        return legacyValue;
      },
      clearPendingAction() {
        legacyClears += 1;
        legacyValue = null;
      }
    },
    dispatchEvent() {},
    setInterval,
    clearInterval
  };
  window.window = window;

  const context = vm.createContext({
    window,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Promise,
    Object
  });

  vm.runInContext(registrySource, context, { filename: "ari-vnext-operation-registry.js" });

  return {
    window,
    pending,
    snapshot() {
      return {
        bridgeValue,
        legacyValue,
        bridgeClears,
        legacyClears,
        baseExecutions
      };
    }
  };
}

test("successful trusted vNext execution consumes both matching pending-action copies", async () => {
  const harness = makeHarness();
  assert.equal(harness.window.AriVNextOperationRegistry?.version, "1.0.0");

  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: harness.pending
  });
  assert.equal(execution.success, true);

  const state = harness.snapshot();
  assert.equal(state.bridgeValue, null);
  assert.equal(state.legacyValue, null);
  assert.equal(state.bridgeClears, 1);
  assert.equal(state.legacyClears, 1);
  assert.equal(state.baseExecutions, 1);
});

test("failed trusted execution preserves a still-valid pending action for retry", async () => {
  const harness = makeHarness({ executionSuccess: false });

  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: harness.pending
  });
  assert.equal(execution.success, false);

  const state = harness.snapshot();
  assert.equal(state.bridgeValue?.id, harness.pending.id);
  assert.equal(state.legacyValue?.vnext_action_id, harness.pending.id);
  assert.equal(state.bridgeClears, 0);
  assert.equal(state.legacyClears, 0);
});

test("registry bootstrap clears an orphaned vNext-linked legacy pending action", () => {
  const harness = makeHarness({ bridgePending: false, legacyPending: true });
  const state = harness.snapshot();
  assert.equal(state.legacyValue, null);
  assert.equal(state.legacyClears, 1);
  assert.equal(state.bridgeClears, 0);
});

test("execution reply is normalized into both top-level and typed-confirmation result shape", async () => {
  const harness = makeHarness({ executionReply: "Meal logged." });
  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: harness.pending
  });

  assert.equal(execution.reply, "Meal logged.");
  assert.equal(execution.result?.reply, "Meal logged.");
});

test("registered operation handlers run before the captured compatibility stack", async () => {
  const harness = makeHarness();
  let registeredExecutions = 0;

  harness.window.AriVNextOperationRegistry.registerOperation("log_meal", {
    source: "test_registered_operation",
    priority: 100,
    async executeConfirmed(input) {
      registeredExecutions += 1;
      return {
        success: true,
        reply: `Registered ${input?.vnextPendingAction?.name}.`,
        result: { via: "registry" }
      };
    }
  });

  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: harness.pending
  });

  assert.equal(registeredExecutions, 1);
  assert.equal(harness.snapshot().baseExecutions, 0);
  assert.equal(execution.result?.via, "registry");
  assert.equal(execution.result?.reply, "Registered log_meal.");
});

test("registry rejects expired pending actions before any trusted writer is reached", async () => {
  const harness = makeHarness();
  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: {
      ...harness.pending,
      expiresAt: "2000-01-01T00:00:00.000Z"
    }
  });

  assert.equal(execution.success, false);
  assert.equal(execution.code, "vnext_action_expired");
  assert.equal(harness.snapshot().baseExecutions, 0);
});
