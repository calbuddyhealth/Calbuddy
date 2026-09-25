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

test("owner casual chat keeps the advanced owner model", () => {
  const standard = resolveModelPolicy({ intelligenceEntitlement: owner() });
  const casual = resolveModelPolicy({
    intelligenceEntitlement: owner(),
    casualConversation: true
  });

  assert.equal(casual.model, standard.model);
  assert.equal(casual.reasoningEffort, "low");
  assert.equal(casual.ownerModelContinuity, true);
  assert.equal(casual.costTier, "owner_advanced_sol_low");
  assert.ok(casual.maxOutputTokens >= 900);
});

test("owner current-information turns keep their complexity while enabling live retrieval", () => {
  const policy = resolveModelPolicy({
    intelligenceEntitlement: owner(),
    currentInfo: true
  });

  assert.equal(policy.mode, "standard");
  assert.equal(policy.freshness, "live");
  assert.equal(policy.liveSearchRequired, true);
  assert.equal(policy.reasoningEffort, "medium");
  assert.equal(policy.ownerModelContinuity, true);
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
