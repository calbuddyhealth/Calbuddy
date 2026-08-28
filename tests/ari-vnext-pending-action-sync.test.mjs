import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const initiativeSource = await readFile(
  new URL("../ari/vnext/ari-vnext-initiative.js", import.meta.url),
  "utf8"
);

function makeHarness({ executionSuccess = true, bridgePending = true, legacyPending = true } = {}) {
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

  const window = {
    Ari: {},
    AriVNextNutritionResolutionAdapter: { ready: true },
    AriVNextNutritionReferenceAdapter: { ready: true },
    AriVNextWeightAdapter: { ready: true },
    AriVNextReferenceCapabilityExtension: { ready: true },
    AriVNextStructuredReferenceCapabilities: { ready: true },
    AriVNextAuthoritativeReferenceRehydration: { version: "1.0.0", ready: true },
    AriVNextActionAdapter: {
      async executeConfirmed() {
        return { success: executionSuccess, result: { ok: executionSuccess } };
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
    document: {
      scripts: [],
      head: { appendChild() {} },
      createElement() {
        return {};
      }
    },
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
    Promise
  });

  vm.runInContext(initiativeSource, context, { filename: "ari-vnext-initiative.js" });

  return {
    window,
    pending,
    snapshot() {
      return {
        bridgeValue,
        legacyValue,
        bridgeClears,
        legacyClears
      };
    }
  };
}

async function settleBootstrap() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("successful trusted vNext execution consumes both pending-action copies", async () => {
  const harness = makeHarness();
  await settleBootstrap();

  assert.equal(harness.window.AriVNextInitiative?.version, "1.3.0");

  const execution = await harness.window.AriVNextActionAdapter.executeConfirmed({
    vnextPendingAction: harness.pending
  });
  assert.equal(execution.success, true);

  const state = harness.snapshot();
  assert.equal(state.bridgeValue, null);
  assert.equal(state.legacyValue, null);
  assert.equal(state.bridgeClears, 1);
  assert.equal(state.legacyClears, 1);
});

test("failed trusted execution does not consume a still-valid pending action", async () => {
  const harness = makeHarness({ executionSuccess: false });
  await settleBootstrap();

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

test("bootstrap clears an orphaned vNext-linked legacy pending action", async () => {
  const harness = makeHarness({ bridgePending: false, legacyPending: true });
  await settleBootstrap();

  const state = harness.snapshot();
  assert.equal(state.legacyValue, null);
  assert.equal(state.legacyClears, 1);
  assert.equal(state.bridgeClears, 0);
});