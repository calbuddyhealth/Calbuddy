import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const registrySource = await readFile(new URL("../ari/vnext/ari-vnext-operation-registry.js", import.meta.url), "utf8");
const reliabilitySource = await readFile(new URL("../ari/vnext/ari-vnext-pending-reliability.js", import.meta.url), "utf8");

async function makeHarness({ fail = true } = {}) {
  let bridgePending = null;
  let clearCount = 0;
  let setCount = 0;

  const window = {
    Ari: {},
    AriVNextBridge: {
      getPendingAction() { return bridgePending; },
      setPendingAction(value) { setCount += 1; bridgePending = value; },
      clearPendingAction() { clearCount += 1; bridgePending = null; }
    },
    CalBuddy: { getPendingAction() { return null; }, clearPendingAction() {} },
    addEventListener() {}, dispatchEvent() {}, setTimeout, clearTimeout, setInterval, clearInterval
  };
  window.window = window;

  const sandbox = {
    window,
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Promise, Object, Map, Set
  };
  vm.createContext(sandbox);
  vm.runInContext(registrySource, sandbox, { filename: "ari-vnext-operation-registry.js" });
  window.AriVNextOperationRegistry.registerOperation("update_goal", {
    source: "test_goal_handler",
    priority: 100,
    async executeConfirmed() {
      return fail ? { success: false, code: "retryable_failure", message: "Retry me." } : { success: true, result: { ok: true } };
    }
  });
  vm.runInContext(reliabilitySource, sandbox, { filename: "ari-vnext-pending-reliability.js" });
  await new Promise((resolve) => setTimeout(resolve, 5));

  return {
    window,
    getBridgePending: () => bridgePending,
    counts: () => ({ clearCount, setCount })
  };
}

test("failed trusted execution preserves the same pending action and suppresses only the immediate clear", async () => {
  const harness = await makeHarness({ fail: true });
  assert.equal(harness.window.AriVNextPendingReliability?.ready, true);
  const pending = { id: "retry-action", sourceTurnId: "turn-retry", name: "update_goal", arguments: {} };
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(execution.success, false);
  assert.equal(harness.getBridgePending()?.id, pending.id);
  assert.equal(harness.counts().setCount, 1);

  harness.window.AriVNextBridge.clearPendingAction();
  assert.equal(harness.getBridgePending()?.id, pending.id, "runtime immediate clear must be suppressed once");
  await new Promise((resolve) => setTimeout(resolve, 1));
  harness.window.AriVNextBridge.clearPendingAction();
  assert.equal(harness.getBridgePending(), null, "later explicit clear or cancel must still work");
});

test("successful trusted execution does not manufacture retry state", async () => {
  const harness = await makeHarness({ fail: false });
  const pending = { id: "success-action", sourceTurnId: "turn-success", name: "update_goal", arguments: {} };
  const execution = await harness.window.AriVNextOperationRegistry.executeConfirmed({ vnextPendingAction: pending });
  assert.equal(execution.success, true);
  assert.equal(harness.getBridgePending(), null);
  assert.equal(harness.counts().setCount, 0);
});
