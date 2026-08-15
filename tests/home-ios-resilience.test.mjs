import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("home.html", "utf8");
const resilience = fs.readFileSync("js/home-resilience.js", "utf8");

test("home loads the iOS request resilience layer after home.js", () => {
  const homeIndex = home.indexOf('js/home.js?v=3.4.0');
  const resilienceIndex = home.indexOf('js/home-resilience.js?v=1.0.0');

  assert.ok(homeIndex >= 0, "home.js should be loaded");
  assert.ok(resilienceIndex > homeIndex, "resilience layer should load after home.js");
});

test("pending Ari turns survive app backgrounding and reconcile on resume", () => {
  assert.match(resilience, /arixp_pending_ari_turn_v1/);
  assert.match(resilience, /visibilitychange/);
  assert.match(resilience, /pageshow/);
  assert.match(resilience, /findSavedCompletedTurn/);
  assert.match(resilience, /MAX_BACKGROUND_RETRIES\s*=\s*1/);
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
