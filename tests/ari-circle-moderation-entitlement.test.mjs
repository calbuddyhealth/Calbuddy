import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../api/ari-circle-moderation.js", import.meta.url),
  "utf8"
);

test("Circle moderation uses the canonical authenticated age entitlement", () => {
  assert.match(source, /\/rest\/v1\/rpc\/ari_circle_my_age_state/);
  assert.match(source, /Authorization:\s*authorization/);
  assert.match(source, /circleAllowed === true/);
  assert.match(source, /ageBand === "adult"/);
  assert.doesNotMatch(source, /\/rest\/v1\/ari_account_state\?/);
});

test("Circle moderation still blocks age entitlement before AI work", () => {
  const authIndex = source.indexOf("const access = await getCircleAccessState(authorization)");
  const consentIndex = source.indexOf("if (!hasCurrentAiConsent(user))");
  const rateIndex = source.indexOf("const rateLimit = await enforceAiRateLimit");
  const openAiIndex = source.indexOf("const apiKey = clean(process.env.OPENAI_API_KEY");

  assert.ok(authIndex > 0);
  assert.ok(consentIndex > authIndex);
  assert.ok(rateIndex > consentIndex);
  assert.ok(openAiIndex > rateIndex);
  assert.match(source, /ARI_CIRCLE_ADULTS_ONLY/);
});


test("transient moderation provider failures retry and degrade only for adult text-only feed posts", () => {
  assert.match(source, /MODERATION_RETRYABLE_STATUS = new Set\(\[429, 500, 502, 503, 504\]\)/);
  assert.match(source, /MODERATION_MAX_ATTEMPTS = 3/);
  assert.match(source, /retryDelayMs\(response, attempt\)/);
  assert.match(source, /scope === "feed_post"/);
  assert.match(source, /Boolean\(text\)/);
  assert.match(source, /images\.length === 0/);
  assert.match(source, /decision: "allow_degraded_text_only"/);
  assert.match(source, /moderation_degraded: true/);
  assert.match(source, /transientProviderFailure/);
});

test("degraded moderation does not bypass adult entitlement, AI consent, internal rate limits, or media screening", () => {
  const entitlementIndex = source.indexOf("const access = await getCircleAccessState(authorization)");
  const consentIndex = source.indexOf("if (!hasCurrentAiConsent(user))");
  const rateIndex = source.indexOf("const rateLimit = await enforceAiRateLimit");
  const degradedIndex = source.indexOf('decision: "allow_degraded_text_only"');

  assert.ok(entitlementIndex > 0);
  assert.ok(consentIndex > entitlementIndex);
  assert.ok(rateIndex > consentIndex);
  assert.ok(degradedIndex > rateIndex);
  assert.match(source, /images\.length === 0/);
  assert.match(source, /code: "ARI_CIRCLE_MODERATION_PROVIDER_UNAVAILABLE"/);
});

test("moderation telemetry cannot become a posting outage", () => {
  assert.match(source, /usage logging skipped/);
  assert.match(source, /try \{[\s\S]*await recordRequest\([\s\S]*catch \(usageError\)/);
});


test("client moderation exposes provider outage metadata to retry-capable surfaces", () => {
  const client = fs.readFileSync(
    new URL("../js/ari-circle/content-moderation.js", import.meta.url),
    "utf8"
  );
  assert.match(client, /const VERSION = "1\.5\.2"/);
  assert.match(client, /moderationError\.code = clean\(data\?\.code\)/);
  assert.match(client, /ARI_CIRCLE_MODERATION_PROVIDER_UNAVAILABLE/);
  assert.match(client, /moderationError\.status = response\.status/);
  assert.match(client, /moderationError\.retryAfterSeconds/);
});


test("provider 429s are returned as cooldowns instead of immediate retry storms", () => {
  assert.match(source, /if \(response\.status === 429 \|\| !error\.retryable/);
  assert.match(source, /error\.retryAfterSeconds/);
  assert.match(source, /res\.setHeader\("Retry-After"/);
  assert.match(source, /retry_after_seconds: retryAfterSeconds/);
  assert.match(source, /provider_code:/);
  assert.match(source, /provider_type:/);
});
