import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const runtimePath = "ari/runtime/ari-runtime-controller.js";
const runtime = fs.readFileSync(runtimePath, "utf8");
const core = fs.readFileSync("calbuddy-core.js", "utf8");

test("canonical Ari runtime stays syntactically valid", () => {
  execFileSync(process.execPath, ["--check", runtimePath], { stdio: "pipe" });
});

test("vNext captures the pre-cutover owner-control confirmation handlers", () => {
  assert.match(runtime, /confirmPendingAction:\s*typeof CalBuddy\.confirmPendingAction/);
  assert.match(runtime, /cancelPendingAction:\s*typeof CalBuddy\.cancelPendingAction/);
  assert.match(runtime, /LOCAL_OWNER_CONTROL_ACTIONS/);
  assert.match(runtime, /enable_visual_live_owner_session/);
});

test("Live Owner enable, disable, and visual requests are intercepted before model routing", () => {
  assert.match(runtime, /runOwnerVisualPreflight/);
  assert.match(runtime, /CalBuddy\.isLiveOwnerEnableCommand/);
  assert.match(runtime, /CalBuddy\.isLiveOwnerDisableCommand/);
  assert.match(runtime, /CalBuddy\.isVisualInspectionCommand/);

  const preflightCall = runtime.indexOf("runOwnerVisualPreflight({");
  const bridgeCall = runtime.indexOf("window.AriVNextBridge.ask(message");
  assert.ok(preflightCall >= 0, "missing owner visual preflight call");
  assert.ok(bridgeCall > preflightCall, "owner visual preflight must execute before vNext model call");
});

test("typed Yes and Cancel stay on the same local owner-control action", () => {
  assert.match(runtime, /localPending && isAffirmative\(message\)/);
  assert.match(runtime, /legacy\.confirmPendingAction\(\)/);
  assert.match(runtime, /localPending && isNegative\(message\)/);
  assert.match(runtime, /legacy\.cancelPendingAction/);
  assert.match(runtime, /ari_vnext_local_owner_control_confirmation/);
  assert.match(runtime, /ari_vnext_local_owner_control_cancel/);
});

test("the deterministic core still owns Live Owner execution and server verification", () => {
  assert.match(core, /CalBuddy\.enableVisualLiveOwnerSession/);
  assert.match(core, /verifyOwnerSession\(\{ force: true \}\)/);
  assert.match(core, /action_type:\s*"enable_visual_live_owner_session"/);
  assert.match(core, /CalBuddy\.runVisualInspection/);
});

test("runtime 1.6.2 is the canonical cache-busted version", () => {
  assert.match(runtime, /const VERSION = "1\.6\.2"/);
});
