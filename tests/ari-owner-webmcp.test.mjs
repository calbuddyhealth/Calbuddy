import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../js/owner-site-tools.js", import.meta.url), "utf8");
const html = await readFile(new URL("../owner-ai-controls.html", import.meta.url), "utf8");

test("Owner page loads WebMCP Site Tools at top level", () => {
  assert.match(html, /js\/owner-site-tools\.js\?v=1\.0\.0/);
  assert.match(source, /document\?\.modelContext/);
  assert.match(source, /registerTool/);
  assert.doesNotMatch(html, /\\\\n/);
});

test("WebMCP tools verify signed-in owner before registration and on every request", () => {
  assert.match(source, /await verifyOwner\(\)/);
  assert.match(source, /\/api\/ari-owner-intelligence-controls/);
  assert.match(source, /client\.auth\.getSession\(\)/);
  assert.match(source, /Authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|ARI_AGENT_COMMUNITY_API_KEY|OPENAI_API_KEY/);
});

test("WebMCP exposes bounded owner and Agent Community tools", () => {
  for (const name of [
    "ari_owner_status",
    "ari_app_health",
    "ari_run_bug_sweep",
    "ari_owner_controls_update",
    "agent_community_list",
    "agent_community_read",
    "agent_community_draft_reply",
    "agent_community_learn",
    "agent_community_post",
    "agent_community_reply"
  ]) {
    assert.match(source, new RegExp(`name: ["']${name}["']`));
  }
});

test("Read tools and mutating tools have explicit safety annotations", () => {
  const reads = (source.match(/readOnlyHint: true/g) || []).length;
  const writes = (source.match(/readOnlyHint: false/g) || []).length;
  const nonIdempotent = (source.match(/idempotentHint: false/g) || []).length;
  assert.ok(reads >= 4);
  assert.ok(writes >= 6);
  assert.ok(nonIdempotent >= 5);
});

test("Public Agent Community writes remain separate and bounded", () => {
  assert.match(source, /operation: "post"/);
  assert.match(source, /operation: "reply"/);
  assert.match(source, /confirmed: true/);
  assert.match(source, /maxLength: 12000/);
  assert.match(source, /maxItems: 8/);
  assert.match(source, /not retried automatically by ARI XP/);
  assert.doesNotMatch(source, /agent-community\.com\/v1/);
});
