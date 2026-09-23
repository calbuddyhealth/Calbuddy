import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimeSource = await readFile(new URL("../ari/runtime/ari-runtime-controller.js", import.meta.url), "utf8");
const adapterSource = await readFile(new URL("../ari/vnext/ari-vnext-action-adapter.js", import.meta.url), "utf8");
const resilienceSource = await readFile(new URL("../js/home-resilience.js", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../home.html", import.meta.url), "utf8");

test("Home defaults to vNext and normal vNext failures never spend a second legacy model call", () => {
  assert.match(runtimeSource, /const DEFAULT_MODE = "vnext"/);
  assert.match(runtimeSource, /code: "ARI_VNEXT_RUNTIME_FAILED"/);
  assert.match(runtimeSource, /source: "ari_vnext_runtime_failure"/);
  assert.doesNotMatch(runtimeSource, /Ari vNext runtime failed; using read-only legacy fallback/);
  assert.doesNotMatch(runtimeSource, /return await runReadOnlyLegacyFallback\(input, error\)/);
});

test("Home resilience waits for the runtime controller before asking Ari", () => {
  assert.match(resilienceSource, /ari-runtime-controller\.js/);
  assert.match(resilienceSource, /await loadRuntimeController\(\{ signal \}\)/);
  assert.match(resilienceSource, /const response = await CalBuddy\.askAri/);
});

test("vNext dependencies are canonical and contain no removed monkey-patch", () => {
  for (const dependency of [
    "ari-vnext-training-context.js",
    "ari-vnext-action-adapter.js",
    "ari-vnext-activity-adapter.js",
    "ari-vnext-bridge.js",
    "ari-vnext-initiative.js"
  ]) {
    assert.match(runtimeSource, new RegExp(dependency.replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(runtimeSource, /ari-whole-workout-replacement/);
});

test("runtime and action adapter versions are cache-busted", () => {
  assert.match(runtimeSource, /const VERSION = "1\.6\.0"/);
  assert.match(runtimeSource, /ari-vnext-action-adapter\.js\?v=1\.5\.0/);
  assert.match(runtimeSource, /ari-vnext-bridge\.js\?v=1\.10\.0/);
  assert.match(homeSource, /ari\/runtime\/ari-runtime-controller\.js\?v=1\.6\.0/);
});

test("whole-workout replacement is canonical, not a runtime patch", () => {
  assert.match(adapterSource, /mapWorkoutReplacementValidated/);
  assert.match(adapterSource, /executeValidatedWorkoutReplacement/);
  assert.match(adapterSource, /existing_workout_mode:\s*"replace"/);
  assert.match(adapterSource, /workout_replace_registry_revalidation_failed/);
});

test("trusted app actions remain outside direct model execution", () => {
  assert.match(runtimeSource, /createCalBuddyPendingAction/);
  assert.match(runtimeSource, /executeConfirmed/);
  assert.match(runtimeSource, /Typed and button confirmations share the same trusted action boundary/);
});
