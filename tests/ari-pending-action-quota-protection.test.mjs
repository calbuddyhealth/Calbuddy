import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("js/ari-pending-action-recovery.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

test("pending-action recovery patch is syntactically valid", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("Home loads pending-action recovery after home behavior and before quota UI", () => {
  const homeIndex = home.indexOf('js/home.js?v=3.4.1');
  const recoveryIndex = home.indexOf('js/ari-pending-action-recovery.js?v=1.0.0');
  const quotaIndex = home.indexOf('js/ari-quota-ui.js?v=1.0.0');
  assert.ok(homeIndex >= 0);
  assert.ok(recoveryIndex > homeIndex);
  assert.ok(quotaIndex > recoveryIndex);
});

test("standalone Yes and Cancel are intercepted before another Ari request when pending exists", () => {
  assert.match(source, /const pending = currentPendingAction\(\)/);
  assert.match(source, /if \(CONFIRM_RE\.test\(text\)\)/);
  assert.match(source, /await window\.confirmAriAction\?\.\(\)/);
  assert.match(source, /if \(CANCEL_RE\.test\(text\)\)/);
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
