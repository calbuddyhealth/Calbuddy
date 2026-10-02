import assert from "node:assert/strict";
import test from "node:test";

import { estimateOpenAICost } from "../api/_lib/ai-provider-usage.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import {
  publicRuntimeModel,
  runtimeModelIdentityRequested,
  withRuntimeModelIdentity
} from "../api/_lib/ari-vnext/runtime-model-awareness.js";

function ownerEntitlement(reasoningProfile = "adaptive") {
  return {
    tier: "advanced",
    accountRole: "owner",
    accessClass: "owner",
    intelligenceTier: "owner_experimental",
    advancedAllowed: true,
    advancedEnabled: true,
    ownerEligible: true,
    premiumEligible: false,
    reasoningProfile,
    conversationBeta: true,
    source: "owner_beta"
  };
}

test("owner can ask which exact model is active without a separate model call", () => {
  const route = routeContext({
    message: "What model are you using right now?",
    context: { intelligenceEntitlement: ownerEntitlement() }
  });

  assert.equal(route.modelIdentityRequested, true);
  const policy = resolveModelPolicy(route);
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(policy.modelIdentityRequested, true);
  assert.equal(runtimeModelIdentityRequested(route, policy), true);

  const instructions = withRuntimeModelIdentity({
    instructions: "Base instructions.",
    route,
    policy,
    activeModel: policy.model
  });
  assert.match(instructions, /TRUSTED ACTIVE MODEL ROUTING/);
  assert.match(instructions, /gpt-6\.1-sol/);
  assert.match(instructions, /Do not claim that you cannot see the active model/);
});

test("ordinary non-owner chat does not receive internal model identity instructions", () => {
  const route = routeContext({
    message: "What model are you using right now?",
    context: {}
  });
  assert.equal(route.modelIdentityRequested, false);

  const policy = resolveModelPolicy(route);
  const instructions = withRuntimeModelIdentity({
    instructions: "Base instructions.",
    route,
    policy,
    activeModel: policy.model
  });
  assert.equal(instructions, "Base instructions.");
});

test("explicit Astra mode is owner-only and routes the current turn to Astra", () => {
  const ownerRoute = routeContext({
    message: "Use Astra for this: deeply analyze the architecture failure.",
    context: { intelligenceEntitlement: ownerEntitlement() }
  });
  assert.equal(ownerRoute.ownerModelRequest, "astra");

  const ownerPolicy = resolveModelPolicy(ownerRoute);
  assert.equal(ownerPolicy.model, process.env.OPENAI_ARI_OWNER_ASTRA_MODEL || "gpt-6-astra");
  assert.equal(ownerPolicy.fallbackModel, process.env.OPENAI_ARI_OWNER_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(ownerPolicy.routingReason, "explicit_astra_request");
  assert.equal(ownerPolicy.escalated, true);

  const ordinaryRoute = routeContext({
    message: "Use Astra for this: deeply analyze the architecture failure.",
    context: {}
  });
  assert.equal(ordinaryRoute.ownerModelRequest, null);
  const ordinaryPolicy = resolveModelPolicy(ordinaryRoute);
  assert.equal(ordinaryPolicy.model, process.env.OPENAI_ARI_FREE_MODEL || "gpt-4o-mini");
});

test("explicit Sol mode suppresses Astra escalation for an owner turn", () => {
  const route = routeContext({
    message: "Use Sol for this: deeply analyze the root cause of this distributed race condition.",
    context: { intelligenceEntitlement: ownerEntitlement() }
  });
  assert.equal(route.ownerModelRequest, "sol");
  assert.equal(route.solEscalationEligible, true);

  const policy = resolveModelPolicy(route);
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(policy.escalated, false);
  assert.equal(policy.routingReason, "explicit_sol_request");
});

test("runtime metadata reports provider fallback truthfully", () => {
  const runtime = publicRuntimeModel({
    policy: {
      model: "gpt-6-astra",
      reasoningEffort: "high",
      routingReason: "hard_problem",
      costTier: "owner_astra_escalation",
      escalated: true
    },
    provider: {
      model: "gpt-6.1-sol",
      routingFallback: {
        from: "gpt-6-astra",
        to: "gpt-6.1-sol",
        reason: "provider_model_unavailable"
      }
    }
  });

  assert.equal(runtime.verified, true);
  assert.equal(runtime.selectedModel, "gpt-6-astra");
  assert.equal(runtime.activeModel, "gpt-6.1-sol");
  assert.equal(runtime.fallbackApplied, true);
  assert.equal(runtime.fallbackFrom, "gpt-6-astra");
});

test("GPT-6 pricing is tracked instead of silently recording zero cost", () => {
  const usage = {
    inputTokens: 1_000_000,
    cachedInputTokens: 200_000,
    outputTokens: 100_000
  };

  const astra = estimateOpenAICost({ model: "gpt-6-astra", usage });
  const sol = estimateOpenAICost({ model: "gpt-6.1-sol", usage });
  const luna = estimateOpenAICost({ model: "gpt-6-luna", usage });

  assert.equal(astra.estimatedCostUsd, 13.2);
  assert.equal(sol.estimatedCostUsd, 2.62);
  assert.equal(luna.estimatedCostUsd, 0.132);
  assert.match(astra.pricingSource, /gpt-6-astra$/);
  assert.match(sol.pricingSource, /gpt-6\.1-sol$/);
  assert.match(luna.pricingSource, /gpt-6-luna$/);
});
