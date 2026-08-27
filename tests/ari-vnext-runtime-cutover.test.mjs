import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimeSource = await readFile(
  new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url),
  "utf8"
);
const resilienceSource = await readFile(
  new URL("../js/home-resilience.js", import.meta.url),
  "utf8"
);
const homeSource = await readFile(
  new URL("../home.html", import.meta.url),
  "utf8"
);
const initiativeSource = await readFile(
  new URL("../ari/vnext/ari-vnext-initiative.js", import.meta.url),
  "utf8"
);

test("Home cutover defaults to Ari vNext but preserves Rebirth as fallback", () => {
  assert.match(runtimeSource, /const DEFAULT_MODE = "vnext"/);
  assert.match(runtimeSource, /legacy\.askAri/);
  assert.match(runtimeSource, /Ari vNext runtime failed; using Rebirth fallback/);
  assert.match(runtimeSource, /ALLOWED_MODES = new Set\(\["vnext", "rebirth"\]\)/);
});

test("Home resilience waits for the runtime controller before asking Ari", () => {
  assert.match(resilienceSource, /ari-runtime-controller\.js/);
  assert.match(resilienceSource, /await loadRuntimeController\(\)/);
  assert.match(resilienceSource, /const response = await CalBuddy\.askAri/);
});

test("vNext dependencies include canonical Training, trusted action adapters, bridge, reference lifecycle, and initiative client", () => {
  for (const dependency of [
    "ari-vnext-training-context.js",
    "ari-vnext-action-adapter.js",
    "ari-vnext-activity-adapter.js",
    "ari-vnext-bridge.js",
    "ari-vnext-reference-state.js",
    "ari-vnext-initiative.js"
  ]) {
    assert.match(runtimeSource, new RegExp(dependency.replaceAll(".", "\\.")));
  }
});

test("Mission-capable runtime cache chain reaches Home and iOS WebViews", () => {
  assert.match(runtimeSource, /const VERSION = "1\.4\.4"/);
  assert.match(runtimeSource, /ari-vnext-context-guard\.js\?v=1\.2\.2/);
  assert.match(runtimeSource, /ari-vnext-reference-state\.js\?v=1\.2\.0/);
  assert.match(runtimeSource, /ari-vnext-initiative\.js\?v=1\.3\.0/);
  assert.match(runtimeSource, /versionAtLeast\(window\.AriVNextInitiative\?\.version, "1\.3\.0"\)/);
  assert.match(initiativeSource, /ari-vnext-nutrition-resolution-adapter\.js\?v=1\.1\.0/);
  assert.match(initiativeSource, /AriVNextNutritionResolutionAdapter\?\.ready === true/);
  assert.match(resilienceSource, /Version: 1\.3\.4/);
  assert.match(resilienceSource, /const REQUIRED_RUNTIME_VERSION = "1\.4\.1"/);
  assert.match(homeSource, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.4\.4/);
  assert.match(homeSource, /js\/home-resilience\.js\?v=1\.3\.4/);
});

test("trusted app actions remain outside direct model execution", () => {
  assert.match(runtimeSource, /createCalBuddyPendingAction/);
  assert.match(runtimeSource, /legacy\.confirmPendingAction/);
  assert.match(runtimeSource, /executeConfirmed/);
  assert.match(runtimeSource, /Typed and button confirmations share the same trusted action boundary/);
});

test("typed yes and no cannot leave stale mapped pending actions", () => {
  assert.match(runtimeSource, /actionType === "cancel_pending_action"/);
  assert.match(runtimeSource, /actionType !== "execute_pending_action"/);
  assert.match(runtimeSource, /window\.AriVNextBridge\?\.clearPendingAction/);
});

test("initiative is wired into the normal Home thread without replacing ordinary chat", () => {
  assert.match(resilienceSource, /ari:vnextInitiative/);
  assert.match(resilienceSource, /scheduleInitiativeCheck/);
  assert.match(resilienceSource, /addAriMessage\(opener, "ari"\)/);
  assert.match(runtimeSource, /AriVNextInitiative\.engage/);
});

test("legacy Rebirth scripts remain in Home for rollback safety during cutover", () => {
  assert.match(homeSource, /ari-rebirth-app-bridge\.js/);
  assert.match(homeSource, /ari-conversation-router\.js/);
  assert.match(homeSource, /ari-fast-conversation\.js/);
});