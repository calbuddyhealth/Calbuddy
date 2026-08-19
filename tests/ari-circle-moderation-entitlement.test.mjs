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
