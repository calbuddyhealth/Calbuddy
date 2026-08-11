import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, script, styles] = await Promise.all([
  readFile(new URL("../home.html", import.meta.url), "utf8"),
  readFile(new URL("../js/home.js", import.meta.url), "utf8"),
  readFile(new URL("../assets/css/home.css", import.meta.url), "utf8")
]);

test("home exposes the ARI Presence conversation controls", () => {
  assert.match(html, /id="ariThreadToggle"/);
  assert.match(html, /id="ariThinkingStatus"/);
  assert.match(html, /id="ariPresenceHint"/);
  assert.match(html, /assets\/css\/home\.css\?v=2\.2\.0/);
  assert.match(html, /js\/home\.js\?v=3\.3\.0/);
});

test("presence mode preserves history and removes the generic typing card", () => {
  assert.match(script, /function setupAriPresenceConversation\(/);
  assert.match(script, /function updateAriThreadPresentation\(/);
  assert.match(script, /function setAriPresenceFocus\(/);
  assert.match(script, /function setAriThreadExpanded\(/);
  assert.match(script, /dataset\.ariArchived/);
  assert.doesNotMatch(script, /function addAriTypingMessage\(/);
  assert.doesNotMatch(script, /body\.innerHTML/);
});

test("presence styling includes thinking, focus, recall, and long responses", () => {
  assert.match(styles, /\.ari-thinking-status\.is-active/);
  assert.match(styles, /\.ari-presence-focus \.ari-thread/);
  assert.match(styles, /\.ari-message\.is-archived/);
  assert.match(styles, /\.ari-thread-toggle/);
  assert.match(styles, /\.ari-response-disclosure/);
  assert.match(styles, /@keyframes ariCognitiveOrbit/);
});

test("the UI release keeps the current production app bridge", () => {
  assert.match(
    html,
    /ari\/ari-rebirth-app-bridge\.js\?v=1\.8\.0/
  );
});
