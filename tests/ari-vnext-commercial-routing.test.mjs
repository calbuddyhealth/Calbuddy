import assert from "node:assert/strict";
import test from "node:test";

import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import { recommendationQualityInstruction } from "../api/_lib/ari-vnext/recommendation-quality.js";

function premiumEntitlement(reasoningProfile = "adaptive") {
  return {
    tier: "advanced",
    accountRole: "user",
    accessClass: "premium",
    intelligenceTier: "premium_advanced",
    advancedAllowed: true,
    advancedEnabled: true,
    ownerEligible: false,
    ariUnlimitedEligible: false,
    premiumEligible: true,
    reasoningProfile,
    conversationBeta: true,
    source: "premium"
  };
}

test("free Ari remains GPT-4o mini even for deep developer work", () => {
  const route = routeContext({
    message: "Deeply analyze the root cause of this distributed API race condition and compare fixes.",
    context: {}
  });
  assert.equal(route.solEscalationEligible, true);

  const policy = resolveModelPolicy(route);
  assert.equal(policy.accessClass, "casual");
  assert.equal(policy.model, process.env.OPENAI_ARI_FREE_MODEL || "gpt-4o-mini");
  assert.equal(policy.escalated, false);
  assert.equal(policy.costTier, "economy");
});

test("premium Ari defaults to Luna", () => {
  const route = routeContext({
    message: "Help me plan my week.",
    context: { intelligenceEntitlement: premiumEntitlement() }
  });
  const policy = resolveModelPolicy(route);

  assert.equal(policy.accessClass, "premium");
  assert.equal(policy.model, process.env.OPENAI_ARI_PREMIUM_LUNA_MODEL || "gpt-6-luna");
  assert.equal(policy.escalated, false);
  assert.equal(policy.costTier, "premium_luna");
  assert.equal(policy.routingReason, "luna_default");
});

test("premium Ari escalates hard non-recommendation work to Sol", () => {
  const route = routeContext({
    message: "Deeply analyze the root cause of this distributed API race condition and propose a migration strategy.",
    context: { intelligenceEntitlement: premiumEntitlement() }
  });
  assert.equal(route.developer, true);
  assert.equal(route.solEscalationEligible, true);

  const policy = resolveModelPolicy(route);
  assert.equal(policy.model, process.env.OPENAI_ARI_PREMIUM_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(policy.escalated, true);
  assert.equal(policy.costTier, "premium_sol_escalation");
  assert.equal(policy.routingReason, "hard_problem");
});

test("premium recommendations stay on Luna even when comparison language is deep", () => {
  const route = routeContext({
    message: "Compare the best family SUVs and tell me which SUV should I buy.",
    context: { intelligenceEntitlement: premiumEntitlement() }
  });
  assert.equal(route.recommendationIntent, true);
  assert.equal(route.currentInfo, true);
  assert.equal(route.complexity, "deep");
  assert.equal(route.solEscalationEligible, false);

  const policy = resolveModelPolicy(route);
  assert.equal(policy.model, process.env.OPENAI_ARI_PREMIUM_LUNA_MODEL || "gpt-6-luna");
  assert.equal(policy.escalated, false);
  assert.equal(policy.costTier, "premium_luna");
  assert.equal(policy.routingReason, "luna_recommendation_quality");

  const instruction = recommendationQualityInstruction({
    route,
    relevantContext: { relevantMemory: "Prefers reliable family vehicles." }
  });
  assert.match(instruction, /PREMIUM RECOMMENDATION QUALITY CONTRACT/);
  assert.match(instruction, /personal fit 30%/);
  assert.match(instruction, /Never fabricate ratings, review counts, prices, inventory, hours, or availability/);
  assert.match(instruction, /Relevant durable preferences\/context are available/);
});

test("free recommendations use the direct decision contract", () => {
  const route = routeContext({
    message: "Which laptop should I buy?",
    context: {}
  });
  assert.equal(route.recommendationIntent, true);
  assert.equal(route.currentInfo, true);

  const instruction = recommendationQualityInstruction({ route, relevantContext: {} });
  assert.match(instruction, /FREE DIRECT RECOMMENDATION/);
  assert.match(instruction, /one practical recommendation/);
  assert.doesNotMatch(instruction, /personal fit 30%/);
});
