import assert from "node:assert/strict";
import test from "node:test";

import { buildRelevantContext, contextToText, routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";

const ORIGINAL_ADVANCED_MODEL = process.env.OPENAI_ARI_ADVANCED_MODEL;

function restoreEnv() {
  if (ORIGINAL_ADVANCED_MODEL === undefined) delete process.env.OPENAI_ARI_ADVANCED_MODEL;
  else process.env.OPENAI_ARI_ADVANCED_MODEL = ORIGINAL_ADVANCED_MODEL;
}

test.afterEach(restoreEnv);

function advancedEntitlement(reasoningProfile = "adaptive") {
  return {
    version: "1.0.0",
    tier: "advanced",
    advancedAllowed: true,
    advancedEnabled: true,
    ownerEligible: true,
    premiumEligible: false,
    reasoningProfile,
    conversationBeta: true,
    source: "owner_beta"
  };
}

test("Advanced Ari uses GPT-5.6 Sol alias with low reasoning for quick conversation", () => {
  delete process.env.OPENAI_ARI_ADVANCED_MODEL;
  const policy = resolveModelPolicy({
    complexity: "fast",
    intelligenceEntitlement: advancedEntitlement("adaptive")
  });

  assert.equal(policy.intelligenceTier, "advanced");
  assert.equal(policy.model, "gpt-5.6");
  assert.equal(policy.reasoningEffort, "low");
  assert.equal(policy.conversationBeta, true);
});

test("Advanced Ari deep owner profile escalates reasoning without changing model identity", () => {
  const policy = resolveModelPolicy({
    complexity: "standard",
    intelligenceEntitlement: advancedEntitlement("deep")
  });

  assert.equal(policy.model, "gpt-5.6");
  assert.equal(policy.reasoningEffort, "xhigh");
  assert.equal(policy.costTier, "owner_advanced_sol");
});

test("Standard Ari stays on the existing economical model policy", () => {
  const policy = resolveModelPolicy({ complexity: "fast" });
  assert.equal(policy.intelligenceTier, "standard");
  assert.equal(policy.model, process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini");
});

test("Advanced conversation contract is present only for an entitled turn", () => {
  const advancedTurn = {
    message: "Work was rough today.",
    history: [],
    context: { intelligenceEntitlement: advancedEntitlement("adaptive") }
  };
  const advancedRoute = routeContext(advancedTurn);
  const advancedContext = buildRelevantContext(advancedTurn, advancedRoute);
  const advancedInstruction = contextToText(advancedContext);

  assert.equal(advancedRoute.intelligenceEntitlement?.advancedEnabled, true);
  assert.match(advancedInstruction, /ADVANCED CONVERSATIONAL INTELLIGENCE/);
  assert.match(advancedInstruction, /A statement is not automatically a problem to solve/);

  const standardTurn = {
    message: "Work was rough today.",
    history: [],
    context: {
      intelligenceEntitlement: {
        tier: "standard",
        advancedEnabled: false,
        reasoningProfile: "standard"
      }
    }
  };
  const standardRoute = routeContext(standardTurn);
  const standardInstruction = contextToText(buildRelevantContext(standardTurn, standardRoute));

  assert.doesNotMatch(standardInstruction, /ADVANCED CONVERSATIONAL INTELLIGENCE/);
});

test("current-information Advanced Ari keeps the flagship model and enables live-search policy", () => {
  const policy = resolveModelPolicy({
    complexity: "fast",
    currentInfo: true,
    intelligenceEntitlement: advancedEntitlement("balanced")
  });

  assert.equal(policy.model, "gpt-5.6");
  assert.equal(policy.mode, "current");
  assert.equal(policy.liveSearchRequired, true);
  assert.equal(policy.reasoningEffort, "medium");
});
