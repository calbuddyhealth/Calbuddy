import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runtime = await readFile(new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url), "utf8");
const resilience = await readFile(new URL("../js/home-resilience.js", import.meta.url), "utf8");
const home = await readFile(new URL("../home.html", import.meta.url), "utf8");

test("successful vNext confirmations clear the legacy pending-action mirror", () => {
  assert.match(runtime, /const VERSION = "1\.6\.2"/);

  const buttonConfirm = runtime.match(
    /async function confirmPendingAction\(\)[\s\S]*?function cancelPendingAction\(\)/
  )?.[0] || "";
  assert.match(buttonConfirm, /if \(execution\?\.success\) \{[\s\S]*?clearMatchingPendingAction\(pending\)/);
  assert.doesNotMatch(buttonConfirm, /if \(execution\?\.success\)[\s\S]{0,120}CalBuddy\.clearPendingAction\?\.\(\)/);

  const typedConfirm = runtime.match(
    /async function executeTypedConfirmation\(result = \{\}\)[\s\S]*?async function executeExperimentAction/
  )?.[0] || "";
  assert.match(typedConfirm, /clearMatchingPendingAction\(originalPending\)/);
  assert.match(typedConfirm, /if \(!execution\?\.success\) \{[\s\S]*?setPendingAction\?\.\(originalPending\)/);
});

test("Home requires and cache-busts the quota-aware runtime path", () => {
  assert.match(resilience, /Version: 1\.6\.3/);
  assert.match(resilience, /REQUIRED_RUNTIME_VERSION = "1\.6\.2"/);
  assert.match(home, /js\/home-resilience\.js\?v=1\.6\.3/);
});