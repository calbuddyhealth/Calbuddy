import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("js/ari-pending-action-recovery.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

async function loadPendingRecovery({ vnext = null, legacy = null, bridgeAvailable = true } = {}) {
  const reads = [];
  const reconciled = [];
  const classes = new Set();
  const bar = {
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    setAttribute() {},
    removeAttribute() {}
  };
  const label = { textContent: "" };
  const window = {
    AriVNextBridge: bridgeAvailable ? {
      getPendingAction() { reads.push("vnext"); return vnext; }
    } : undefined,
    CalBuddy: {
      getPendingAction() { reads.push("legacy"); return legacy; },
      async reconcilePendingActionWithLedger(action) { reconciled.push(action); return action; }
    },
    addEventListener() {},
    setTimeout() {}
  };
  const document = {
    getElementById: id => ({ pendingActionBar: bar, pendingActionText: label })[id] || null,
    addEventListener() {}
  };
  vm.runInNewContext(source, { window, document }, { filename: "js/ari-pending-action-recovery.js" });
  // Let the real startup reconciliation finish before checking the rendered state.
  await new Promise(resolve => setImmediate(resolve));
  return { reads, reconciled, classes, label };
}

test("pending-action recovery patch is syntactically valid", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("Home loads pending-action recovery after home behavior and before quota UI", () => {
  const homeIndex = home.indexOf('js/home.js?v=3.4.2');
  const recoveryIndex = home.indexOf('js/ari-pending-action-recovery.js?v=1.2.0');
  const quotaIndex = home.indexOf('js/ari-quota-ui.js?v=1.0.2');
  assert.ok(homeIndex >= 0);
  assert.ok(recoveryIndex > homeIndex);
  assert.ok(quotaIndex > recoveryIndex);
});

test("standalone Yes and Cancel are intercepted before another Ari request when pending exists", () => {
  assert.match(source, /const candidate = currentPendingAction\(\)/);
  assert.match(source, /const pending = await firstReconciledPendingAction\(\)/);
  assert.match(source, /if \(CONFIRM_RE\.test\(text\)\)/);
  assert.match(source, /await window\.confirmAriAction\?\.\(\)/);
  assert.match(source, /!CONFIRM_RE\.test\(text\) && !CANCEL_RE\.test\(text\)/);
  assert.match(source, /await window\.cancelAriAction\?\.\(\)/);
  assert.match(source, /if \(message && await interceptPendingConfirmation\(message\)\)/);
  assert.match(source, /const result = await original\.apply\(this, args\)/);
  assert.ok(
    source.indexOf("interceptPendingConfirmation(message)") < source.indexOf("original.apply(this, args)"),
    "pending confirmation must be handled before the original AI send path"
  );
});

test("pending-action UI recovers from both legacy and vNext stores", () => {
  assert.match(source, /window\.CalBuddy\?\.getPendingAction\?\.\(\)/);
  assert.match(source, /window\.AriVNextBridge\?\.getPendingAction\?\.\(\)/);
  assert.match(source, /bar\.classList\.add\("show"\)/);
  assert.match(source, /calbuddy:pendingAction/);
  assert.match(source, /ari:vnextPendingAction/);
  assert.match(source, /ari:runtimeReady/);
});

test("canonical vNext pending state takes precedence over the legacy CalBuddy mirror", async () => {
  const vnext = { id: "canonical", confirmation_text: "Save the current workout?" };
  const legacy = { id: "stale-mirror", confirmation_text: "Log the old meal?" };
  const { reads, reconciled, classes, label } = await loadPendingRecovery({ vnext, legacy });
  assert.ok(reads.includes("vnext"));
  assert.equal(reads.includes("legacy"), false, "the legacy mirror must not be read when vNext has a proposal");
  assert.ok(reconciled.length > 0);
  for (const action of reconciled) assert.equal(action, vnext);
  assert.equal(classes.has("show"), true);
  assert.equal(label.textContent, vnext.confirmation_text);
});

for (const bridgeAvailable of [true, false]) {
  test(`pending-action recovery falls back to CalBuddy when vNext is ${bridgeAvailable ? "empty" : "unavailable"}`, async () => {
    const legacy = { id: "legacy-only", confirmation_text: "Log this meal?" };
    const { reads, reconciled, classes, label } = await loadPendingRecovery({ legacy, bridgeAvailable });
    assert.equal(reads.includes("vnext"), bridgeAvailable);
    assert.ok(reads.includes("legacy"));
    assert.ok(reconciled.length > 0);
    for (const action of reconciled) assert.equal(action, legacy);
    assert.equal(classes.has("show"), true);
    assert.equal(label.textContent, legacy.confirmation_text);
  });
}

test("pending-action recovery keeps confirmation hidden when both stores are empty", async () => {
  const { reconciled, classes, label } = await loadPendingRecovery();
  assert.equal(reconciled.length, 0);
  assert.equal(classes.has("show"), false);
  assert.equal(label.textContent, "");
});

test("recovered pending actions get a usable confirmation label", () => {
  assert.match(source, /edit_workout/);
  assert.match(source, /Apply this workout change\?/);
  assert.match(source, /plan_workout/);
  assert.match(source, /Save this workout plan\?/);
  assert.match(source, /confirmation_text/);
});

test("pending-action recovery can rebuild state from the durable action ledger", () => {
  assert.match(source, /restoreDurablePendingAction/);
  assert.match(source, /restorePendingActionFromLedger/);
  assert.match(source, /if \(!pending\) pending = await restoreDurablePendingAction\(\)/);
});

test("recovery verifies browser pending state against the durable ledger before showing buttons", () => {
  assert.match(source, /reconcilePendingActionWithLedger/);
  assert.match(source, /firstReconciledPendingAction/);
  const sync = source.match(/async function syncPendingActionBar\(\)[\s\S]*?window\.addEventListener\("calbuddy:pendingAction"/)?.[0] || "";
  assert.ok(sync.indexOf("firstReconciledPendingAction") < sync.indexOf("showRecoveredPending"));
});

test("a yes or cancel aimed at a stale terminal card is consumed locally instead of becoming a new model turn", () => {
  const intercept = source.match(/async function interceptPendingConfirmation\(message = ""\)[\s\S]*?function installSendGuard/)?.[0] || "";
  assert.match(intercept, /await firstReconciledPendingAction\(\)/);
  assert.match(intercept, /if \(!pending\)/);
  assert.match(intercept, /hideRecoveredPendingIfEmpty\(\)/);
  assert.match(intercept, /return true/);
});

test("quota exhaustion cannot strand a real pending confirmation", () => {
  const quotaUi = fs.readFileSync("js/ari-quota-ui.js", "utf8");
  assert.match(quotaUi, /currentPendingAction\(\)/);
  assert.match(quotaUi, /isPendingResolutionText/);
  assert.match(quotaUi, /CONFIRM_RE/);
  assert.match(quotaUi, /CANCEL_RE/);
  assert.match(quotaUi, /allowPendingResolution/);
  assert.match(quotaUi, /calbuddy:pendingActionCleared/);
  assert.match(quotaUi, /ari:vnextPendingActionCleared/);
});
