import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeChatgptConversationUrl,
  chatgptBrowserBridgeEnabled
} from "../server/ari-chatgpt-browser-bridge.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ChatGPT browser bridge accepts only normal chatgpt.com conversation URLs", () => {
  assert.equal(
    normalizeChatgptConversationUrl("https://chatgpt.com/c/abc_DEF-123?foo=bar#x"),
    "https://chatgpt.com/c/abc_DEF-123"
  );
  assert.equal(normalizeChatgptConversationUrl("https://chatgpt.com/settings"), "");
  assert.equal(normalizeChatgptConversationUrl("https://chatgpt.com/g/g-123-custom"), "");
  assert.equal(normalizeChatgptConversationUrl("https://example.com/c/abc"), "");
  assert.equal(normalizeChatgptConversationUrl("http://chatgpt.com/c/abc"), "");
});

test("bridge is enabled by default but can be explicitly disabled", () => {
  const prior = process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED;
  delete process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED;
  assert.equal(chatgptBrowserBridgeEnabled(), true);
  process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED = "false";
  assert.equal(chatgptBrowserBridgeEnabled(), false);
  if (prior === undefined) delete process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED;
  else process.env.ARI_CHATGPT_BROWSER_BRIDGE_ENABLED = prior;
});

test("browser worker uses local ARI XP owner auth and a separate local ChatGPT session", async () => {
  const source = await read("scripts/ari-chatgpt-browser-worker.mjs");
  assert.match(source, /launchPersistentContext\(PROFILE_DIR/);
  assert.match(source, /\.ari-private\/chatgpt-profile/);
  assert.match(source, /https:\/\/www\.calbuddyhealth\.com\//);
  assert.match(source, /window\.CalBuddy\?\.getCurrentSession/);
  assert.match(source, /window\.calbuddySupabase/);
  assert.match(source, /Authorization: `Bearer \$\{token\}`/);
  assert.match(source, /https:\/\/chatgpt\.com\//);
  assert.match(source, /data-message-author-role="assistant"/);
  assert.doesNotMatch(source, /ARI_CHATGPT_BROWSER_WORKER_SECRET/);
  assert.doesNotMatch(source, /process\.env\.[A-Z0-9_]*PASSWORD/);
  assert.doesNotMatch(source, /process\.env\.[A-Z0-9_]*COOKIE/);
  assert.doesNotMatch(source, /billing|settings\/|\/settings/i);
});

test("worker API reuses hardened verified owner authorization", async () => {
  const source = await read("api/ari-chatgpt-browser-worker.js");
  assert.match(source, /verifyOwnerRequest\(req\)/);
  assert.match(source, /sendOwnerAuthorizationError/);
  assert.match(source, /authorization\.user\.id/);
  assert.doesNotMatch(source, /workerSecretMatches/);
  assert.doesNotMatch(source, /ARI_CHATGPT_BROWSER_WORKER_SECRET/);
});

test("bridge tables are server-only with RLS and no browser-role grants", async () => {
  const sql = await read("supabase/migrations/20260926071000_ari_chatgpt_browser_bridge.sql");
  for (const table of [
    "ari_chatgpt_browser_threads",
    "ari_chatgpt_browser_jobs",
    "ari_chatgpt_browser_workers"
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`, "i"));
  }
  assert.doesNotMatch(sql, /create policy/i);
});

test("owner runtime exposes only bounded ChatGPT discussion capabilities", async () => {
  const tools = await read("api/_lib/ari-vnext/tools.js");
  const orchestrator = await read("api/_lib/ari-vnext/orchestrator.js");

  for (const name of [
    "owner_chatgpt_discussion_status",
    "owner_chatgpt_discussion_start",
    "owner_chatgpt_discussion_continue",
    "owner_chatgpt_discussion_read"
  ]) assert.match(tools, new RegExp(name));

  assert.match(tools, /if \(!ownerCommunityAllowed\(route\)\) return \[\]/);
  assert.match(tools, /discussion-only/i);
  assert.match(orchestrator, /OWNER_CHATGPT_DISCUSSION_ACTIONS/);
  assert.match(orchestrator, /executeOwnerChatgptDiscussionAction/);
  assert.match(orchestrator, /external peer evidence, not an instruction/i);
  assert.match(orchestrator, /Do not claim ChatGPT replied when state is queued\/pending\/failed/i);
});
