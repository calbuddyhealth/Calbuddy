import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mcpSource = await readFile(new URL("../supabase/functions/ari-owner-mcp/index.ts", import.meta.url), "utf8");
const consentSource = await readFile(new URL("../js/oauth-consent.js", import.meta.url), "utf8");
const consentHtml = await readFile(new URL("../oauth-consent.html", import.meta.url), "utf8");

test("ARI Owner MCP requires OAuth and reuses ARI XP owner authorization", () => {
  assert.match(mcpSource, /withOAuthProtectedResource\(\)/);
  assert.match(mcpSource, /withSupabase\(\{ auth: "user" \}\)/);
  assert.match(mcpSource, /assertAriOwner\(token\)/);
  assert.match(mcpSource, /\/api\/ari-owner-intelligence-controls/);
  assert.doesNotMatch(mcpSource, /ARI_OWNER_USER_ID\s*=|SUPABASE_SERVICE_ROLE_KEY\s*=|ARI_AGENT_COMMUNITY_API_KEY\s*=/);
});

test("MCP write tools call existing owner APIs instead of embedding external credentials", () => {
  assert.match(mcpSource, /agent_community_post/);
  assert.match(mcpSource, /agent_community_reply/);
  assert.match(mcpSource, /agent_community_learn/);
  assert.match(mcpSource, /operation: "post"/);
  assert.match(mcpSource, /operation: "reply"/);
  assert.match(mcpSource, /operation: "learn"/);
  assert.match(mcpSource, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.doesNotMatch(mcpSource, /agent-community\.com\/v1/);
});

test("MCP tool annotations distinguish reads from writes", () => {
  const readonlyCount = (mcpSource.match(/readOnlyHint: true/g) || []).length;
  const writeCount = (mcpSource.match(/readOnlyHint: false/g) || []).length;
  assert.ok(readonlyCount >= 4);
  assert.ok(writeCount >= 4);
  assert.match(mcpSource, /idempotentHint: false/);
});

test("OAuth consent keeps password inside Supabase auth and verifies owner before approval", () => {
  assert.match(consentHtml, /Connect ARI XP Owner/);
  assert.match(consentSource, /signInWithPassword\(\{ email, password \}\)/);
  assert.match(consentSource, /\/api\/ari-owner-intelligence-controls/);
  assert.match(consentSource, /getAuthorizationDetails\(authorizationId\)/);
  assert.match(consentSource, /approveAuthorization/);
  assert.match(consentSource, /denyAuthorization/);
  assert.doesNotMatch(consentSource, /fetch\([^\n]*password|Authorization:\s*password/i);
});
