import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeReasoningProfile,
  resolveAriIntelligenceEntitlement
} from "../server/ari-intelligence-entitlement.js";

const ORIGINAL_OWNER = process.env.ARI_OWNER_USER_ID;
const ORIGINAL_PREMIUM = process.env.ARI_PREMIUM_ADVANCED_ENABLED;

function restoreEnv() {
  if (ORIGINAL_OWNER === undefined) delete process.env.ARI_OWNER_USER_ID;
  else process.env.ARI_OWNER_USER_ID = ORIGINAL_OWNER;

  if (ORIGINAL_PREMIUM === undefined) delete process.env.ARI_PREMIUM_ADVANCED_ENABLED;
  else process.env.ARI_PREMIUM_ADVANCED_ENABLED = ORIGINAL_PREMIUM;
}

test.afterEach(restoreEnv);

test("owner can enable Advanced Ari with a verified user id", () => {
  process.env.ARI_OWNER_USER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "false";

  const result = resolveAriIntelligenceEntitlement({
    userId: "11111111-1111-4111-8111-111111111111",
    controls: { enabled: true, reasoningProfile: "deep" }
  });

  assert.equal(result.tier, "advanced");
  assert.equal(result.ownerEligible, true);
  assert.equal(result.advancedEnabled, true);
  assert.equal(result.reasoningProfile, "deep");
  assert.equal(result.cognitiveLoopAllowed, true);
  assert.equal(result.cognitiveLoopEnabled, true);
  assert.equal(result.cognitiveLoopOwnerOnly, true);
  assert.equal(result.source, "owner_beta");
});

test("a non-owner cannot unlock Advanced Ari by supplying advanced controls", () => {
  process.env.ARI_OWNER_USER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "false";

  const result = resolveAriIntelligenceEntitlement({
    userId: "22222222-2222-4222-8222-222222222222",
    controls: { enabled: true, reasoningProfile: "deep" }
  });

  assert.equal(result.tier, "standard");
  assert.equal(result.advancedAllowed, false);
  assert.equal(result.advancedEnabled, false);
  assert.equal(result.cognitiveLoopAllowed, false);
  assert.equal(result.cognitiveLoopEnabled, false);
  assert.equal(result.reasoningProfile, "standard");
});

test("owner remains Standard Ari until the owner control is explicitly enabled", () => {
  process.env.ARI_OWNER_USER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "false";

  const result = resolveAriIntelligenceEntitlement({
    userId: "11111111-1111-4111-8111-111111111111",
    controls: { enabled: false, reasoningProfile: "deep" }
  });

  assert.equal(result.advancedAllowed, true);
  assert.equal(result.advancedEnabled, false);
  assert.equal(result.cognitiveLoopAllowed, true);
  assert.equal(result.cognitiveLoopEnabled, false);
  assert.equal(result.tier, "standard");
  assert.equal(result.source, "eligible_not_enabled");
});

test("premium Advanced Ari remains outside the owner cognitive-loop experiment", () => {
  process.env.ARI_OWNER_USER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "true";

  const result = resolveAriIntelligenceEntitlement({
    userId: "22222222-2222-4222-8222-222222222222",
    controls: { enabled: true, reasoningProfile: "balanced" },
    subscriptionTier: "premium",
    subscriptionStatus: "active"
  });

  assert.equal(result.tier, "advanced");
  assert.equal(result.premiumEligible, true);
  assert.equal(result.cognitiveLoopAllowed, false);
  assert.equal(result.cognitiveLoopEnabled, false);
  assert.equal(result.source, "premium");
});

test("premium access stays locked until the server rollout flag is enabled", () => {
  process.env.ARI_OWNER_USER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "false";

  const locked = resolveAriIntelligenceEntitlement({
    userId: "22222222-2222-4222-8222-222222222222",
    controls: { enabled: true },
    subscriptionTier: "premium",
    subscriptionStatus: "active"
  });
  assert.equal(locked.tier, "standard");

  process.env.ARI_PREMIUM_ADVANCED_ENABLED = "true";
  const enabled = resolveAriIntelligenceEntitlement({
    userId: "22222222-2222-4222-8222-222222222222",
    controls: { enabled: true, reasoningProfile: "balanced" },
    subscriptionTier: "premium",
    subscriptionStatus: "active"
  });
  assert.equal(enabled.tier, "advanced");
  assert.equal(enabled.premiumEligible, true);
  assert.equal(enabled.cognitiveLoopEnabled, false);
  assert.equal(enabled.source, "premium");
});

test("unknown reasoning profiles fail closed to adaptive", () => {
  assert.equal(normalizeReasoningProfile("turbo"), "adaptive");
});
