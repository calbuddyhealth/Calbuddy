import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("browser bridge only builds canonical Training history when the turn needs it", () => {
  const source = fs.readFileSync(new URL("../ari/vnext/ari-vnext-bridge.js", import.meta.url), "utf8");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /needsCanonicalTrainingContext/);
  assert.match(source, /if \(trainingNeeded && window\.AriVNextTrainingContext\?\.build\)/);
  assert.match(source, /canonicalTrainingLoaded/);
});

test("server keeps fast-path hydration selective but explicit recall bypasses the short-history stop", () => {
  const source = fs.readFileSync(new URL("../api/ari-vnext.js", import.meta.url), "utf8");
  assert.match(source, /function shouldRecoverRecentConversation/);
  assert.match(source, /isConversationRecallRequest\(text, history\)/);
  assert.match(source, /if \(history\.length >= 2\) return false/);
  assert.match(source, /force: recallRequested/);
  assert.match(source, /searchUserConversationHistory/);
  assert.match(source, /last time\|earlier\|before\|remember when\|we talked\|we discussed\|we decided/);
  assert.match(source, /continue from\|pick up where/);
  assert.doesNotMatch(source, /\^\(hey\|hello\|what'?s up/);
});
