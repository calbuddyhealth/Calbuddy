import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../ari-circle-v6.html", import.meta.url), "utf8");
const assist = await readFile(new URL("../js/ari-circle/v6/ari-next-assist-v1.js", import.meta.url), "utf8");
const bundles = await readFile(new URL("../js/ari-circle/v6/intent-bundles-v1.js", import.meta.url), "utf8");
const ownerBeta = await readFile(new URL("../js/ari-circle/v6/ari-next-owner-beta-v1.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/css/ari-next-assist-v1.css", import.meta.url), "utf8");
const bridge = await readFile(new URL("../api/ari-vnext-circle-context-bridge.js", import.meta.url), "utf8");
const dedupeMigration = await readFile(new URL("../supabase/migrations/20260828070000_ari_circle_action_intent_dedupe_v2.sql", import.meta.url), "utf8");
const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

test("ARI Next stays intent-first while clearly identifying the owner beta", () => {
  assert.match(html, /<title>ARI Next Beta \| ARI Circle<\/title>/);
  assert.match(html, />ARI NEXT · OWNER BETA<\/span>/);
  assert.match(html, /id="v6IntentPrompt"/);
  assert.match(html, /placeholder="Tell Ari what you feel like doing…"/);
  assert.match(html, />Ask Ari<\/button>/);
  assert.match(html, /data-v6-quick-intent="anything"/);
  assert.match(html, /data-v6-quick-intent="workout"/);
  assert.match(html, /data-v6-quick-intent="outside"/);
  assert.match(html, /data-v6-quick-intent="social"/);
  assert.match(html, /<details class="v6-intent-refine"/);
  assert.match(html, /Refine preferences/);
  assert.match(html, /Optional/);
  assert.doesNotMatch(html, /Loading your Action Network/i);
  assert.match(html, /id="v6NetworkSummary" hidden/);
});

test("owner beta bootstrap verifies the signed-in owner before loading ARI Next behavior", () => {
  assert.doesNotThrow(() => new Function(ownerBeta));
  assert.match(ownerBeta, /\/api\/ari-github-read/);
  assert.match(ownerBeta, /Authorization: `Bearer \$\{token\}`/);
  assert.match(ownerBeta, /body\?\.isOwner === true/);
  assert.match(ownerBeta, /window\.location\.replace\("ari-circle-feed\.html"\)/);
  assert.match(ownerBeta, /action-network-v6\.js\?v=0\.3\.0/);
  assert.match(ownerBeta, /ari-next-assist-v1\.js\?v=1\.1\.0/);
  assert.match(ownerBeta, /intent-bundles-v1\.js\?v=1\.3\.0/);
  assert.doesNotMatch(html, /<script src="js\/ari-circle\/v6\/action-network-v6\.js/);
});

test("structured intent controls remain optional refinements and location stays shared", () => {
  assert.match(html, /id="v6IntentActivity"/);
  assert.match(html, /id="v6IntentWhen"/);
  assert.match(html, /id="v6IntentGroup"/);
  assert.match(html, /value="1-1">Solo/);
  assert.match(html, /type="hidden" id="v6IntentRadius"/);
  assert.match(html, /type="hidden" id="v6IntentArea"/);
  assert.match(html, /Search controls live in Connect → Meetups/);
  assert.doesNotMatch(html, /<label><span>Distance<\/span>/);
});

test("Ari interprets common natural-language intent without using device location", () => {
  assert.doesNotThrow(() => new Function(assist));
  for (const helper of ["inferActivity", "inferWhen", "inferGroup", "applyPromptInference"]) {
    assert.match(assist, new RegExp(helper));
  }
  assert.match(assist, /\bworkout\b/);
  assert.match(assist, /\bweekend\b/);
  assert.match(assist, /\bsocial\b/);
  assert.match(assist, /form\.requestSubmit\(\)/);
  assert.doesNotMatch(assist, /navigator\.geolocation|getCurrentPosition|watchPosition/i);
});

test("duplicate Ask Ari submissions are intercepted and explained instead of silently creating another card", () => {
  assert.match(assist, /guardDuplicateSubmission/);
  assert.match(assist, /duplicateIntent/);
  assert.match(assist, /ari_next_duplicate_preflight/);
  assert.match(assist, /ALREADY IN ARI NEXT/);
  assert.match(assist, /kept the existing suggestion instead of creating a duplicate/i);
  assert.match(assist, /NEW PRIVATE SUGGESTION/);
  assert.match(assist, /View suggestion/);
  assert.match(assist, /Dismiss/);
});

test("suggestion cards can be dismissed and immediately restored", () => {
  assert.doesNotThrow(() => new Function(bundles));
  assert.match(bundles, /Dismiss suggestion/);
  assert.match(bundles, /ari_circle_cancel_action_intent/);
  assert.match(bundles, /renderUndoStatus/);
  assert.match(bundles, /restoreSuggestion/);
  assert.match(bundles, /ari_circle_create_action_intent/);
  assert.match(bundles, /suggestion dismissed\. /i);
});

test("server-side intent creation is idempotent for near-identical accidental repeats", () => {
  assert.match(dedupeMigration, /create or replace function public\.ari_circle_create_action_intent/);
  assert.match(dedupeMigration, /i\.status = 'active'/);
  assert.match(dedupeMigration, /i\.activity = clean_activity/);
  assert.match(dedupeMigration, /i\.area is not distinct from clean_area/);
  assert.match(dedupeMigration, /abs\(extract\(epoch from \(i\.time_window_start - requested_time_window_start\)\)\) <= 900/);
  assert.match(dedupeMigration, /if result_id is not null then\s+return result_id;/);
});

test("ARI Next can surface current options before a user creates an intent without calling them matched", () => {
  assert.match(assist, /showCurrentOptionsWhenNoIntent/);
  assert.match(assist, /waitForInitialRender/);
  assert.match(assist, /list\.childElementCount > 0/);
  assert.match(assist, /activeIntent && !activeIntent\.hidden/);
  assert.match(assist, /context\?\.activeIntents/);
  assert.match(assist, /context\?\.bestMatches/);
  assert.match(assist, /context\?\.opportunities/);
  assert.match(assist, /AVAILABLE/);
  assert.doesNotMatch(assist, /BEST FIT/);
});

test("production context bridge supplies only public Supabase project configuration", () => {
  assert.match(bridge, /import handler from "\.\/ari-vnext-circle-context\.js"/);
  assert.match(bridge, /PUBLIC_SUPABASE_URL/);
  assert.match(bridge, /PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(bridge, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(bridge, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(bridge, /signed-in user's Bearer JWT/i);
});

test("Vercel routes the existing ARI Next context URL through the configuration bridge", () => {
  const rewrite = vercel.rewrites.find((item) => item.source === "/api/ari-vnext-circle-context");
  assert.ok(rewrite);
  assert.equal(rewrite.destination, "/api/ari-vnext-circle-context-bridge");
});

test("intent-first styling makes new suggestion state obvious and prevents header bleed-through", () => {
  assert.match(css, /\.v6-intent-prompt/);
  assert.match(css, /\.v6-quick-intents/);
  assert.match(css, /\.v6-intent-refine/);
  assert.match(css, /\.v6-suggestion-notice/);
  assert.match(css, /\.v6-action-network-body \.circle-v5-header/);
  assert.match(css, /background:rgba\(255,255,255,\.96\)!important/);
  assert.match(css, /@media\(max-width:430px\)/);
  assert.match(css, /min-height:48px/);
});
