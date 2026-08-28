import assert from "node:assert/strict";
import test from "node:test";

import {
  MODEL_POLICY_VERSION,
  resolveModelPolicy,
  resolveRoutingClass
} from "../api/_lib/ari-vnext/model-policy.js";

function advancedEntitlement(reasoningProfile = "adaptive") {
  return {
    accountRole: "owner",
    accessClass: "owner",
    intelligenceTier: "owner_experimental",
    advancedEnabled: true,
    ownerEligible: true,
    premiumEligible: false,
    reasoningProfile
  };
}

test("Phase 10C routes simple single-domain app reads to fast model even for Advanced Ari", () => {
  const route = {
    nutrition: true,
    training: false,
    goals: false,
    social: false,
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  };
  const policy = resolveModelPolicy(route);

  assert.equal(MODEL_POLICY_VERSION, "2.4.0");
  assert.equal(policy.routingClass, "simple_app");
  assert.equal(policy.fastEligible, true);
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini");
  assert.equal(policy.costTier, "owner_fast");
  assert.equal(policy.escalationAllowed, true);
  assert.equal(policy.escalationModel, process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6");
});

test("Phase 10C keeps meaningful non-app conversation on Advanced Ari", () => {
  const policy = resolveModelPolicy({
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement()
  });

  assert.equal(policy.routingClass, "meaningful_conversation");
  assert.equal(policy.fastEligible, false);
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6");
});

test("Phase 10C routes casual conversation to fast model without changing entitlement", () => {
  const policy = resolveModelPolicy({
    complexity: "fast",
    casualConversation: true,
    intelligenceEntitlement: advancedEntitlement()
  });

  assert.equal(policy.routingClass, "casual");
  assert.equal(policy.intelligenceTier, "owner_experimental");
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini");
});

test("Phase 10C escalates cross-domain coaching before the model call", () => {
  const routing = resolveRoutingClass({
    nutrition: true,
    training: true,
    goals: false,
    complexity: "fast"
  });
  assert.equal(routing.routingClass, "cross_domain_coaching");
  assert.equal(routing.requiresStrongModel, true);
  assert.equal(routing.fastEligible, false);

  const advanced = resolveModelPolicy({
    nutrition: true,
    training: true,
    complexity: "fast",
    intelligenceEntitlement: advancedEntitlement()
  });
  assert.equal(advanced.model, process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6");
});

test("Phase 10C never downgrades health, developer, or current-information turns", () => {
  for (const route of [
    { health: true, complexity: "fast" },
    { developer: true, complexity: "fast" },
    { currentInfo: true, complexity: "fast" }
  ]) {
    const policy = resolveModelPolicy({
      ...route,
      intelligenceEntitlement: advancedEntitlement("balanced")
    });
    assert.equal(policy.fastEligible, false);
    assert.equal(policy.requiresStrongModel, true);
    assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6");
  }
});

test("Phase 10C preserves dedicated Nutrition logging interpreter", () => {
  const policy = resolveModelPolicy({
    nutrition: true,
    nutritionLogging: true,
    complexity: "fast",
    intelligenceEntitlement: advancedEntitlement()
  });

  assert.equal(policy.routingClass, "nutrition_logging");
  assert.equal(policy.model, process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna");
  assert.equal(policy.nutritionResolutionModel, true);
});

test("Phase 10C standard accounts remain economical on simple app work", () => {
  const policy = resolveModelPolicy({
    training: true,
    complexity: "fast",
    casualConversation: false
  });

  assert.equal(policy.routingClass, "simple_app");
  assert.equal(policy.model, process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini");
  assert.equal(policy.costTier, "economy");
});
