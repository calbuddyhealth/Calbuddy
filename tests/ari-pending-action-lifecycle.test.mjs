import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runtime = await readFile(new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url), "utf8");
const resilience = await readFile(new URL("../js/home-resilience.js", import.meta.url), "utf8");
const home = await readFile(new URL("../home.html", import.meta.url), "utf8");

test("successful vNext confirmations clear the legacy pending-action mirror", () => {
  assert.match(runtime, /const VERSION = "1\.3\.7"/);

  const buttonConfirm = runtime.match(
    /async function confirmPendingAction\(\)[\s\S]*?function cancelPendingAction\(\)/
  )?.[0] || "";
  assert.match(buttonConfirm, /if \(execution\?\.success\) \{[\s\S]*?AriVNextBridge\?\.clearPendingAction\?\.\(\);[\s\S]*?CalBuddy\.clearPendingAction\?\.\(\);/);

  const typedConfirm = runtime.match(
    /async function executeTypedConfirmation\(result = \{\}\)[\s\S]*?async function executeExperimentAction/
  )?.[0] || "";
  assert.match(typedConfirm, /AriVNextBridge\?\.clearPendingAction\?\.\(\);[\s\S]*?if \(execution\?\.success\) CalBuddy\.clearPendingAction\?\.\(\);/);
});

test("Home requires and cache-busts the fixed runtime path", () => {
  assert.match(resilience, /Version: 1\.3\.3/);
  assert.match(resilience, /REQUIRED_RUNTIME_VERSION = "1\.3\.7"/);
  assert.match(home, /js\/home-resilience\.js\?v=1\.3\.3/);
});
