import assert from "node:assert/strict";
import test from "node:test";

import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import {
  ARI_INSTRUCTION_ACTIVATION_VERSION,
  deriveInstructionActivation
} from "../api/_lib/ari-vnext/metacognition.js";

const owner = () => ({
  advancedEnabled: true,
  ownerEligible: true,
  accessClass: "owner",
  reasoningProfile: "adaptive"
});

test("owner casual chat stays on the Sol default instead of spending Astra", () => {
  const standard = resolveModelPolicy({ intelligenceEntitlement: owner() });
  const casual = resolveModelPolicy({
    intelligenceEntitlement: owner(),
    casualConversation: true
  });

  assert.equal(casual.model, standard.model);
  assert.equal(casual.reasoningEffort, "high");
  assert.equal(casual.reasoningMode, "standard");
  assert.equal(casual.persistReasoning, true);
  assert.equal(casual.ownerModelContinuity, true);
  assert.equal(casual.escalated, false);
  assert.equal(casual.costTier, "owner_sol_default");
  assert.ok(casual.maxOutputTokens >= 700);
});

test("owner current-information turns keep their complexity while enabling live retrieval", () => {
  const policy = resolveModelPolicy({
    intelligenceEntitlement: owner(),
    currentInfo: true
  });

  assert.equal(policy.mode, "standard");
  assert.equal(policy.freshness, "live");
  assert.equal(policy.liveSearchRequired, true);
  assert.equal(policy.reasoningEffort, "high");
  assert.equal(policy.reasoningMode, "standard");
  assert.equal(policy.reasoningContext, "all_turns");
  assert.equal(policy.persistReasoning, true);
  assert.equal(policy.ownerModelContinuity, true);
});

test("critical owner work uses Sol pro before automatic Astra escalation", () => {
  const policy = resolveModelPolicy({
    intelligenceEntitlement: owner(),
    developer: true,
    complexity: "deep",
    solEscalationEligible: true
  });

  assert.equal(policy.reasoningDemand.band, "critical");
  assert.equal(policy.reasoningDemand.score, 9);
  assert.equal(policy.model, process.env.OPENAI_ARI_OWNER_SOL_MODEL || "gpt-6.1-sol");
  assert.equal(policy.routingReason, "sol_pro_first");
  assert.equal(policy.reasoningMode, "pro");
  assert.equal(policy.reasoningContext, "all_turns");
  assert.equal(policy.persistReasoning, true);
  assert.equal(policy.escalated, false);
});

test("simple turns suppress inactive cognitive instruction blocks", () => {
  const activation = deriveInstructionActivation({
    route: { casualConversation: true },
    missing: [],
    curiosity: {
      drive: { current: 0.3 },
      activeQuestion: { priority: 0.4 },
      rewardLearning: { sampleSize: 0 }
    },
    rewardCore: { aggregate: { sampleSize: 0 }, lastEvent: null },
    functionalAffect: { dominantState: { intensity: 0.2 }, regulation: {} },
    selfAdaptation: { autonomousUpdate: { allowed: false } },
    cortex: { active: false },
    omegaRCT: { active: false }
  });

  assert.equal(ARI_INSTRUCTION_ACTIVATION_VERSION, "1.0.0");
  assert.equal(activation.compactBase, true);
  assert.equal(activation.curiosity, false);
  assert.equal(activation.reward, false);
  assert.equal(activation.functionalAffect, false);
  assert.equal(activation.selfAdaptation, false);
});

test("developer turns retain the full learning architecture", () => {
  const activation = deriveInstructionActivation({
    route: { developer: true },
    missing: [],
    curiosity: {
      drive: { current: 0.4 },
      activeQuestion: { priority: 0.5 },
      rewardLearning: { sampleSize: 0 }
    },
    rewardCore: { aggregate: { sampleSize: 0 }, lastEvent: null },
    functionalAffect: { dominantState: { intensity: 0.2 }, regulation: {} },
    selfAdaptation: { autonomousUpdate: { allowed: false } },
    cortex: { active: true },
    omegaRCT: { active: true }
  });

  assert.equal(activation.compactBase, false);
  assert.equal(activation.curiosity, true);
  assert.equal(activation.curiosityReward, true);
  assert.equal(activation.reward, true);
  assert.equal(activation.functionalAffect, true);
  assert.equal(activation.selfAdaptation, true);
  assert.equal(activation.cortex, true);
  assert.equal(activation.omegaRCT, true);
});
