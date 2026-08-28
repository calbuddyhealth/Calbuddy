import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url), "utf8");

function makeHarness({ executionSuccess = true, bridgePending = true, legacyPending = true, executionReply = "" } = {}) {
  const pending = { id: "action_sync_test", sourceTurnId: "turn_sync_test", name: "log_meal" };
  let bridgeValue = bridgePending ? { ...pending } : null;
  let legacyValue = legacyPending ? { action_type: "log_meal", vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, confirmation_text: "Log test meal?" } : null;
  let bridgeClears = 0;
  let legacyClears = 0;
  let registeredExecutions = 0;

  const window = {
    Ari: {},
    AriVNextBridge: {
      getPendingAction() { return bridgeValue; },
      clearPendingAction() { bridgeClears += 1; bridgeValue = null; }
    },
    CalBuddy: {
      getPendingAction() { return legacyValue; },
      clearPendingAction() { legacyClears += 1; legacyValue = null; }
    },
    dispatchEvent() {}, setInterval, clearInterval
  };
  window.window = window;

  const context = vm.createContext({
    window,
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Promise, Object, Map, Set
  });
  vm.runInContext(registrySource, context, { filename: "ari-vnext-operation-registry.js" });

  function registerPermanentHandler() {
    window.AriVNextOperationRegistry.registerOperation("log_meal", {
      source: "test_permanent_nutrition_handler",
      priority: 100,
      async executeConfirmed() {
        registeredExecutions += 1;
        return executionReply
          ? { success: executionSuccess, reply: executionReply, result: { ok: executionSuccess } }
          : { success: executionSuccess, result: { ok: executionSuccess } };
      }
    });
  }

  return {
    window,
    pending,
    registerPermanentHandler,
    snapshot() { return { bridgeValue, legacyValue, bridgeClears, legacyClears, registeredExecutions }; }
  };
}

test("successful trusted vNext execution consumes both matching pending-action copies", async () => {
  const harness = makeHarness();
  assert.equal(harness.window.AriVNextOperationRegistry?.ready, true);
  assert.match(harness.window.AriVNextOperationRegistry?.version || "", /^2\./);
  harness.registerPermanentHandler();

  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: harness.pending });
  assert.equal(execution.success, true);

  const state = harness.snapshot();
  assert.equal(state.bridgeValue, null);
  assert.equal(state.legacyValue, null);
  assert.equal(state.bridgeClears, 1);
  assert.equal(state.legacyClears, 1);
  assert.equal(state.registeredExecutions, 1);
});

test("failed trusted execution preserves a still-valid pending action for retry", async () => {
  const harness = makeHarness({ executionSuccess: false });
  harness.registerPermanentHandler();
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: harness.pending });
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
  harness.registerPermanentHandler();
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: harness.pending });
  assert.equal(execution.reply, "Meal logged.");
  assert.equal(execution.result?.reply, "Meal logged.");
});

test("unregistered mutations fail closed instead of invoking a captured fallback", async () => {
  const harness = makeHarness();
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: harness.pending });
  assert.equal(execution.success, false);
  assert.equal(execution.code, "operation_handler_unavailable");
  assert.equal(harness.snapshot().registeredExecutions, 0);
});

test("registry rejects expired pending actions before any trusted writer is reached", async () => {
  const harness = makeHarness();
  harness.registerPermanentHandler();
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: { ...harness.pending, expiresAt: "2000-01-01T00:00:00.000Z" } });
  assert.equal(execution.success, false);
  assert.equal(execution.code, "vnext_action_expired");
  assert.equal(harness.snapshot().registeredExecutions, 0);
});
