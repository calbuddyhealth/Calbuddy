import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import { resolveAriIntelligenceEntitlement } from "../server/ari-intelligence-entitlement.js";

const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, "ari/runtime/ari-runtime-controller.js"), "utf8");
const router = fs.readFileSync(path.join(root, "ari/intent/ari-central-intent-router.js"), "utf8");
const api = fs.readFileSync(path.join(root, "api/ari-vnext.js"), "utf8");
const bridge = fs.readFileSync(path.join(root, "ari/vnext/ari-vnext-bridge.js"), "utf8");

function withEnv(values, fn) {
  const before = {};
  for (const [key, value] of Object.entries(values)) {
    before[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("greetings are narrow casual conversation but advice is not", () => {
  const greeting = routeContext({ message: "hey Ari", history: [], context: {} });
  assert.equal(greeting.casualConversation, true);
  assert.equal(greeting.complexity, "fast");
  assert.equal(greeting.nutrition, false);
  assert.equal(greeting.training, false);
  assert.equal(greeting.developer, false);

  const advice = routeContext({
    message: "I need your advice about whether I should leave my job",
    history: [],
    context: {}
  });
  assert.equal(advice.casualConversation, false);
  assert.equal(advice.complexity, "fast");
});

test("owner, premium, and casual entitlements remain separate dimensions", () => {
  withEnv({
    ARI_OWNER_USER_ID: "owner-1",
    ARI_PREMIUM_ADVANCED_ENABLED: "true"
  }, () => {
    const owner = resolveAriIntelligenceEntitlement({
      userId: "owner-1",
      controls: { enabled: true, reasoningProfile: "adaptive" },
      subscriptionTier: "free",
      subscriptionStatus: "active"
    });
    assert.equal(owner.accountRole, "owner");
    assert.equal(owner.accessClass, "owner");
    assert.equal(owner.intelligenceTier, "owner_experimental");
    assert.equal(owner.cognitiveLoopEnabled, true);

    const premium = resolveAriIntelligenceEntitlement({
      userId: "subscriber-1",
      controls: { enabled: false },
      subscriptionTier: "premium",
      subscriptionStatus: "active"
    });
    assert.equal(premium.accountRole, "user");
    assert.equal(premium.accessClass, "premium");
    assert.equal(premium.intelligenceTier, "premium_advanced");
    assert.equal(premium.advancedEnabled, true);
    assert.equal(premium.cognitiveLoopEnabled, false);

    const casual = resolveAriIntelligenceEntitlement({
      userId: "user-1",
      controls: { enabled: false },
      subscriptionTier: "free",
      subscriptionStatus: "active"
    });
    assert.equal(casual.accountRole, "user");
    assert.equal(casual.accessClass, "casual");
    assert.equal(casual.intelligenceTier, "standard");
    assert.equal(casual.advancedEnabled, false);
  });
});

test("owner greetings use a fast model while short meaningful advice stays Advanced Ari", () => {
  withEnv({
    OPENAI_ARI_OWNER_MODEL: "gpt-5.6",
    OPENAI_ARI_OWNER_FAST_MODEL: "gpt-4o-mini"
  }, () => {
    const entitlement = {
      advancedEnabled: true,
      ownerEligible: true,
      premiumEligible: false,
      accessClass: "owner",
      intelligenceTier: "owner_experimental",
      reasoningProfile: "adaptive"
    };

    const greetingRoute = routeContext({
      message: "hey Ari",
      context: { intelligenceEntitlement: entitlement }
    });
    const greetingPolicy = resolveModelPolicy(greetingRoute);
    assert.equal(greetingPolicy.model, "gpt-4o-mini");
    assert.equal(greetingPolicy.casualConversation, true);

    const adviceRoute = routeContext({
      message: "I need your advice about whether I should leave my job",
      context: { intelligenceEntitlement: entitlement }
    });
    const advicePolicy = resolveModelPolicy(adviceRoute);
    assert.equal(advicePolicy.model, "gpt-5.6");
    assert.equal(advicePolicy.casualConversation, false);
    assert.equal(advicePolicy.intelligenceTier, "owner_experimental");
  });
});

test("runtime restores canonical userContext into the vNext bridge", () => {
  assert.match(runtime, /const userContext =\s*\n\s*input\?\.userContext \|\|\s*\n\s*input\?\.context/);
  assert.match(runtime, /AriVNextBridge\.ask\(message, \{[\s\S]{0,180}userContext/);
  assert.match(runtime, /casualConversation \? \{\} : await getUserContext\(\)/);
  assert.doesNotMatch(runtime, /AriVNextBridge\.ask\(message, \{ \.\.\.input, context \}\)/);
});

test("normal conversation bypasses the legacy intent preflight", () => {
  assert.match(router, /const MUTATION_CUE_PATTERN/);
  assert.match(router, /return !isLikelyMutationMessage\(message\)/);
  assert.match(router, /ari-runtime-controller\.js\?v=1\.4\.0/);
});

test("server skips owner cognitive hydration for casual conversation only", () => {
  assert.match(api, /const casualConversation = preliminaryRoute\.casualConversation === true/);
  assert.match(api, /const cognitiveLoopEligible = isOwnerCognitiveLoopEnabled\(intelligenceEntitlement\)/);
  assert.match(api, /const cognitiveLoopEnabled = cognitiveLoopEligible && !casualConversation/);
  assert.match(api, /casualConversation\s*\? Promise\.resolve\(null\)\s*:\s*loadUserWorldModel/);
  assert.match(api, /casualConversation\s*\? Promise\.resolve\(null\)\s*:\s*loadAccountEntitlements/);
  assert.match(api, /serverHydrationMs/);
  assert.match(api, /modelMs/);
});

test("trust-layer protections remain in place during restoration", () => {
  assert.doesNotMatch(bridge, /memorySummary:\s*options\?\.coachMemorySummary/);
  assert.match(api, /claimAriRequest\(requestIdentity\)/);
  assert.match(api, /completeAriRequest/);
  assert.match(api, /ARI_TURN_IN_PROGRESS/);
});
