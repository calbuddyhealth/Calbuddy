import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const resilience = fs.readFileSync("js/home-resilience.js", "utf8");
const latencyHotfix = fs.readFileSync("js/ari-latency-hotfix.js", "utf8");

test("home loads the repaired iOS request resilience layer and latency guard after home.js", () => {
  const homeIndex = home.indexOf('js/home.js?v=3.4.0');
  const resilienceIndex = home.indexOf('js/home-resilience.js?v=1.3.3');
  const latencyIndex = home.indexOf('js/ari-latency-hotfix.js?v=1.1.0');

  assert.ok(homeIndex >= 0, "home.js should be loaded");
  assert.ok(resilienceIndex > homeIndex, "repaired resilience layer should load after home.js");
  assert.ok(latencyIndex > resilienceIndex, "latency guard should load after resilience so it can neutralize stale cross-document recovery");
});

test("Home runtime loader accepts both runtime namespaces and cannot wait forever", () => {
  assert.match(resilience, /window\.AriRuntime/);
  assert.match(resilience, /window\.Ari\?\.Runtime/);
  assert.match(resilience, /REQUIRED_RUNTIME_VERSION\s*=\s*"1\.4\.0"/);
  assert.match(resilience, /RUNTIME_LOAD_TIMEOUT_MS\s*=\s*5000/);
  assert.match(resilience, /window\.setInterval\(finishIfReady, 25\)/);
  assert.match(resilience, /did not initialize/);
});

test("Home passes the same AbortSignal through runtime loading and Ari ask", () => {
  assert.match(resilience, /const signal = ariAbortController\.signal/);
  assert.match(resilience, /loadRuntimeController\(\{ signal \}\)/);
  assert.match(resilience, /debugTiming: true,\s*signal/);
  assert.match(resilience, /ARI_REQUEST_ABORTED/);
});

test("pending Ari turns survive same-document backgrounding and can reconcile on resume", () => {
  assert.match(resilience, /arixp_pending_ari_turn_v1/);
  assert.match(resilience, /visibilitychange/);
  assert.match(resilience, /pageshow/);
  assert.match(resilience, /findSavedCompletedTurn/);
  assert.match(resilience, /MAX_BACKGROUND_RETRIES\s*=\s*1/);
});

test("in-progress duplicate turns are rechecked without starting a second model turn", () => {
  assert.match(resilience, /ARI_TURN_IN_PROGRESS/);
  assert.match(resilience, /MAX_PROCESSING_RECHECKS\s*=\s*8/);
  assert.match(resilience, /PROCESSING_RECHECK_MS\s*=\s*800/);
  assert.match(resilience, /processingChecks/);
});

test("fresh document loads clear stale pending turns before recovery can auto-resend", () => {
  assert.match(latencyHotfix, /localStorage\.removeItem\(PENDING_KEY\)/);
  assert.match(latencyHotfix, /setAriComposerThinking\?\.\(false\)/);
  assert.match(latencyHotfix, /finishAriThinkingSequence\?\.\(\)/);
});

test("raw WebView and deliberation failures are never treated as user replies", () => {
  assert.match(resilience, /inside_deliberation/);
  assert.match(resilience, /load failed/i);
  assert.match(resilience, /isInternalFailureText/);
  assert.match(resilience, /I couldn't finish that request\. Tap Send to try it again\./);
});

test("internal failure turns are filtered from persisted and restored continuity", () => {
  assert.match(resilience, /CalBuddy\.saveConversationTurn/);
  assert.match(resilience, /CalBuddy\.loadRecentConversationHistory/);
  assert.match(resilience, /isInternalFailureText\(turn\?\.reply\)/);
});
