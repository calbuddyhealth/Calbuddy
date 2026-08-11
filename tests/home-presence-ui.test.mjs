import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, script, styles] = await Promise.all([
  readFile(new URL("../home.html", import.meta.url), "utf8"),
  readFile(new URL("../js/home.js", import.meta.url), "utf8"),
  readFile(new URL("../assets/css/home.css", import.meta.url), "utf8")
]);

test("home exposes cinematic thinking without segmented-thread controls", () => {
  assert.match(html, /id="ariThinkingStatus"/);
  assert.match(html, /id="ariPresenceHint"/);
  assert.match(html, /assets\/css\/home\.css\?v=2\.3\.0/);
  assert.match(html, /js\/home\.js\?v=3\.4\.0/);
  assert.doesNotMatch(html, /id="ariThreadToggle"/);
  assert.doesNotMatch(html, /CONTINUE READING/);
});

test("conversation remains one chronological scrollable thread", () => {
  assert.match(script, /function setupAriPresenceConversation\(/);
  assert.match(script, /function setAriPresenceFocus\(/);
  assert.match(script, /messages\.appendChild\(div\)/);
  assert.match(script, /div\.scrollIntoView/);
  assert.doesNotMatch(script, /function updateAriThreadPresentation\(/);
  assert.doesNotMatch(script, /function setAriThreadExpanded\(/);
  assert.doesNotMatch(script, /dataset\.ariArchived/);
  assert.doesNotMatch(script, /function enhanceAriResponseCard\(/);
  assert.doesNotMatch(script, /function addAriTypingMessage\(/);
  assert.doesNotMatch(script, /body\.innerHTML/);
});

test("thinking fades the thread while keeping Ari's presence visible", () => {
  assert.match(styles, /\.ari-thinking-status\.is-active/);
  assert.match(styles, /\.ari-thread\s*\{[\s\S]*?overflow-y: auto/);
  assert.match(styles, /\.ari-system-thinking \.ari-message/);
  assert.match(styles, /\.ari-system-thinking \.ari-message:last-child/);
  assert.match(styles, /\.ari-presence-focus \.ari-thread/);
  assert.match(styles, /@keyframes ariCognitiveOrbit/);
  assert.doesNotMatch(styles, /\.ari-message\.is-archived/);
  assert.doesNotMatch(styles, /\.ari-thread-toggle/);
  assert.doesNotMatch(styles, /\.ari-response-disclosure/);
});

test("the UI release keeps the current production app bridge", () => {
  assert.match(
    html,
    /ari\/ari-rebirth-app-bridge\.js\?v=1\.8\.0/
  );
});
