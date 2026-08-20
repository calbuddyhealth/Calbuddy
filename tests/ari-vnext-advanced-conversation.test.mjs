import assert from "node:assert/strict";
import test from "node:test";

import { buildRelevantContext, contextToText, routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import { deriveSelfModel, selfModelToInstruction } from "../api/_lib/ari-vnext/self-model.js";

const ORIGINAL_ADVANCED_MODEL = process.env.OPENAI_ARI_ADVANCED_MODEL;

function restoreEnv() {
  if (ORIGINAL_ADVANCED_MODEL === undefined) delete process.env.OPENAI_ARI_ADVANCED_MODEL;
  else process.env.OPENAI_ARI_ADVANCED_MODEL = ORIGINAL_ADVANCED_MODEL;
}

test.afterEach(restoreEnv);

function advancedEntitlement(reasoningProfile = "adaptive") {
  return {
    version: "1.3.0",
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

test("Advanced Ari uses GPT-5.6 Sol alias with low reasoning for short meaningful conversation", () => {
  delete process.env.OPENAI_ARI_ADVANCED_MODEL;
  const policy = resolveModelPolicy({
    complexity: "fast",
    casualConversation: false,
    intelligenceEntitlement: advancedEntitlement("adaptive")
  });

  assert.equal(policy.intelligenceTier, "owner_experimental");
  assert.equal(policy.accessClass, "owner");
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
        accessClass: "casual",
        intelligenceTier: "standard",
        advancedEnabled: false,
        reasoningProfile: "standard"
      }
    }
  };
  const standardRoute = routeContext(standardTurn);
  const standardInstruction = contextToText(buildRelevantContext(standardTurn, standardRoute));

  assert.doesNotMatch(standardInstruction, /ADVANCED CONVERSATIONAL INTELLIGENCE/);
});

test("owner cognitive-loop contract is isolated from ordinary and premium Advanced Ari", () => {
  const ownerTurn = {
    message: "What do you think I should do?",
    history: [],
    context: {
      intelligenceEntitlement: {
        ...advancedEntitlement("deep"),
        cognitiveLoopAllowed: true,
        cognitiveLoopEnabled: true,
        cognitiveLoopOwnerOnly: true
      },
      userWorldModel: {
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true,
          continuity: {
            currentTurnRelevantMemory: "Filtered evidence for this turn.",
            currentTurnRelevantMemoryEphemeral: true
          }
        }
      }
    }
  };
  const ownerRoute = routeContext(ownerTurn);
  const ownerInstruction = contextToText(buildRelevantContext(ownerTurn, ownerRoute));

  assert.match(ownerInstruction, /OWNER COGNITIVE LOOP/);
  assert.match(ownerInstruction, /currentTurnRelevantMemory/);
  assert.match(ownerInstruction, /not proof of subjective consciousness/i);

  const premiumTurn = {
    message: "What do you think I should do?",
    history: [],
    context: {
      intelligenceEntitlement: {
        ...advancedEntitlement("balanced"),
        accountRole: "user",
        accessClass: "premium",
        intelligenceTier: "premium_advanced",
        ownerEligible: false,
        premiumEligible: true,
        source: "premium",
        cognitiveLoopAllowed: false,
        cognitiveLoopEnabled: false,
        cognitiveLoopOwnerOnly: true
      }
    }
  };
  const premiumRoute = routeContext(premiumTurn);
  const premiumInstruction = contextToText(buildRelevantContext(premiumTurn, premiumRoute));

  assert.match(premiumInstruction, /ADVANCED CONVERSATIONAL INTELLIGENCE/);
  assert.doesNotMatch(premiumInstruction, /OWNER COGNITIVE LOOP/);
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

test("Ari stable identity attributes Ari and ARI XP to Jose Onofre Erostico", () => {
  const model = deriveSelfModel({
    turn: { message: "Who built you?", history: [] },
    route: {},
    safety: {}
  });
  const instruction = selfModelToInstruction(model);

  assert.equal(model.identity.creator, "Jose Onofre Erostico");
  assert.equal(model.identity.product, "ARI XP");
  assert.match(model.identity.creationAttribution, /Ari and ARI XP were created by Jose Onofre Erostico\./);
  assert.match(instruction, /Creator: Jose Onofre Erostico\./);
  assert.match(instruction, /Never answer OpenAI to a creator question\./);
});

test("Ari distinguishes creator questions from underlying model-provider questions", () => {
  const creatorModel = deriveSelfModel({
    turn: { message: "Who created ARI XP?", history: [] },
    route: {},
    safety: {}
  });
  const providerInstruction = selfModelToInstruction(creatorModel);

  assert.equal(creatorModel.current.mode, "identity_expression");
  assert.match(providerInstruction, /OpenAI provides underlying AI model technology used by Ari/);
  assert.match(providerInstruction, /does not make OpenAI Ari's creator or the creator of ARI XP/);

  const builtModel = deriveSelfModel({
    turn: { message: "Who built you?", history: [] },
    route: {},
    safety: {}
  });
  assert.equal(builtModel.current.mode, "identity_expression");
});
