import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAriIntelligenceEntitlement } from "../server/ari-intelligence-entitlement.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function withEnv(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("Ari Unlimited gets advanced chat without owner privileges", () => {
  withEnv({
    ARI_OWNER_USER_ID: "11111111-1111-4111-8111-111111111111",
    ARI_PREMIUM_ADVANCED_ENABLED: "false"
  }, () => {
    const entitlement = resolveAriIntelligenceEntitlement({
      userId: "22222222-2222-4222-8222-222222222222",
      controls: { enabled: false, reasoningProfile: "adaptive" },
      subscriptionTier: "ari_unlimited",
      subscriptionStatus: "active"
    });

    assert.equal(entitlement.ownerEligible, false);
    assert.equal(entitlement.accountRole, "user");
    assert.equal(entitlement.ariUnlimitedEligible, true);
    assert.equal(entitlement.accessClass, "ari_unlimited");
    assert.equal(entitlement.intelligenceTier, "ari_unlimited");
    assert.equal(entitlement.advancedAllowed, true);
    assert.equal(entitlement.advancedEnabled, true);
    assert.equal(entitlement.cognitiveLoopAllowed, false);
    assert.equal(entitlement.cognitiveLoopEnabled, false);
  });
});

test("Ari Unlimited uses the owner-grade Sol chat model without becoming owner", () => {
  withEnv({
    ARI_OWNER_USER_ID: "11111111-1111-4111-8111-111111111111",
    ARI_PREMIUM_ADVANCED_ENABLED: "false",
    OPENAI_ARI_OWNER_MODEL: "gpt-5.6-sol-test",
    OPENAI_ARI_PREMIUM_MODEL: "gpt-premium-test"
  }, () => {
    const intelligenceEntitlement = resolveAriIntelligenceEntitlement({
      userId: "22222222-2222-4222-8222-222222222222",
      subscriptionTier: "ari_unlimited",
      subscriptionStatus: "active"
    });
    const policy = resolveModelPolicy({
      intelligenceEntitlement,
      complexity: "standard",
      casualConversation: false
    });

    assert.equal(policy.model, "gpt-5.6-sol-test");
    assert.equal(policy.accessClass, "ari_unlimited");
    assert.equal(policy.intelligenceTier, "ari_unlimited");
    assert.equal(policy.costTier, "ari_unlimited_advanced_sol");
  });
});

test("Ari Unlimited is server-backed and bypasses only chat quota", () => {
  const store = fs.readFileSync(path.join(root, "server/ari-intelligence-control-store.js"), "utf8");
  const quota = fs.readFileSync(path.join(root, "api/_lib/ari-vnext/daily-chat-quota.js"), "utf8");

  assert.match(store, /ari_chat_access_entitlements/);
  assert.match(store, /loadAriUnlimitedEntitlement/);
  assert.match(store, /subscriptionTier:\s*ARI_UNLIMITED_PLAN/);
  assert.match(quota, /loadAriUnlimitedEntitlement/);
  assert.match(quota, /source:\s*"ari_unlimited"/);
  assert.match(quota, /unlimited:\s*true/);
});
