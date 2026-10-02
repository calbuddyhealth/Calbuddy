import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sessions = fs.readFileSync("js/ari-conversation-sessions.js", "utf8");
const continuity = fs.readFileSync("api/_lib/ari-vnext/continuity-service.js", "utf8");
const home = fs.readFileSync("home.html", "utf8");

test("Ari conversations no longer auto-archive after inactivity", () => {
  assert.doesNotMatch(sessions, /INACTIVITY_MS/);
  assert.doesNotMatch(sessions, /scheduleArchive/);
  assert.doesNotMatch(sessions, /isStale/);
  assert.match(sessions, /autoArchive:\s*false/);
  assert.match(sessions, /inactivityMinutes:\s*null/);
});

test("active conversation identity persists in localStorage until explicit reset", () => {
  assert.match(sessions, /arixp_active_conversation_v2/);
  assert.match(sessions, /localStorage\.setItem\(ACTIVE_KEY/);
  assert.match(sessions, /async function startNewConversation/);
  assert.match(sessions, /archiveSession\(current\)/);
  assert.match(sessions, /clearActive\(\)/);
});

test("Home exposes an explicit new-conversation refresh control", () => {
  assert.match(sessions, /ariNewConversationBtn/);
  assert.match(sessions, /aria-label", "Start a new conversation"/);
  assert.match(sessions, /startNewConversation\(\)/);
  assert.match(home, /ari-conversation-sessions\.js\?v=1\.1\.0/);
});

test("named Ari conversation turns are durable instead of seven-day-only", () => {
  assert.match(continuity, /expires_at:\s*"9999-12-31T23:59:59\.999Z"/);
  assert.match(continuity, /CONTINUITY_SERVICE_VERSION\s*=\s*"1\.8\.0"/);
});

test("conversation session module is idempotent when loaded twice", () => {
  assert.match(sessions, /if \(window\.AriConversationSessions\?\.version\) return;/);
});
