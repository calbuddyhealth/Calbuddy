import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contextSource = await readFile(new URL("../api/ari-vnext-circle-context.js", import.meta.url), "utf8");
const controller = await readFile(new URL("../js/ari-circle/v6/action-network-v6.js", import.meta.url), "utf8");

test("every V6-visible active intent participates in Match and Place hydration", () => {
  assert.match(contextSource, /const MAX_INTENTS = 3;/);
  assert.match(contextSource, /const MAX_MATCH_INTENTS = 3;/);
  assert.match(contextSource, /activeIntents\.slice\(0, MAX_MATCH_INTENTS\)/);
  assert.match(controller, /intents\.slice\(0, 3\)/);
});

test("raising V6 intent hydration does not broaden the data authority", () => {
  assert.match(contextSource, /ari_circle_match_opportunities/);
  assert.match(contextSource, /ari_circle_list_places_for_intent/);
  assert.match(contextSource, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.doesNotMatch(contextSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(contextSource, /\b(?:supabase|client)\.from\s*\(/i);
});