import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("js/ari-pending-action-recovery.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

test("pending-action recovery patch is syntactically valid", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("Home loads pending-action recovery after home behavior and before quota UI", () => {
  const homeIndex = home.indexOf('js/home.js?v=3.4.2');
  const recoveryIndex = home.indexOf('js/ari-pending-action-recovery.js?v=1.2.0');
  const quotaIndex = home.indexOf('js/ari-quota-ui.js?v=1.0.0');
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
