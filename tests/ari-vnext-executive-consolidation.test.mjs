import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ARI_EXECUTIVE_VERSION,
  ARI_RULE_IDS,
  ARI_RUNTIME_CONSTITUTION,
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";
import { ARI_PERSONA } from "../api/_lib/ari-vnext/persona.js";
import {
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";

function ownerContext() {
  return {
    userWorldModel: {
      sourceSummary: {},
      ariCognitiveWorkspace: {
        ownerOnly: true,
        functionalExperiment: true,
        rewardCore: {
          aggregate: {
            sampleSize: 4,
            meanReward: 0.76,
            meanPredictionError: 0.06,
            meanProductiveEffort: 0.8,
            meanInformationGain: 0.78,
            prematureStopRate: 0,
            wastefulPersistenceRate: 0
          },
          domainStats: [
            {
              domain: "developer",
              sampleSize: 4,
              meanReward: 0.78,
              meanPredictionError: 0.07,
              meanProductiveEffort: 0.82,
              prematureStopRate: 0,
              wastefulPersistenceRate: 0
            }
          ],
          lastEvent: {
            domain: "developer",
            expectedReward: 0.7,
            actualReward: 0.86,
            predictionError: 0.16,
            dimensions: {
              outcome: 0.84,
              productiveEffort: 0.88,
              informationGain: 0.9,
              calibration: 0.86,
              novelStrategy: 0.8
            },
            penalties: {
              prematureStop: 0,
              wastefulPersistence: 0,
              falseSuccessClaim: 0,
              unsupportedCertainty: 0,
              permissionViolation: 0,
              total: 0
            },
            effortSignals: ["verification", "countercase", "evidence_review"],
            evidenceSource: "structured_outcome",
            userFeedback: "none"
          }
        },
        attention: ["developer"],
        salience: [],
        continuity: { priorConfidence: "partial", openLoops: [] },
        epistemic: { outcomeLearningApplied: true }
      }
    }
  };
}

test("runtime constitution is short, canonical, and contains the permanent authority set once", () => {
  assert.equal(ARI_EXECUTIVE_VERSION, "1.0.0");
  assert.ok(ARI_RUNTIME_CONSTITUTION.length < 3600);
  for (const id of Object.values(ARI_RULE_IDS)) {
    assert.equal(ARI_RUNTIME_CONSTITUTION.split(id).length - 1, 1, `${id} should appear once`);
  }
  assert.match(ARI_RUNTIME_CONSTITUTION, /Truth and evidence outrank agreement/i);
  assert.match(ARI_RUNTIME_CONSTITUTION, /Learning cannot create authority/i);
  assert.match(ARI_RUNTIME_CONSTITUTION, /Never expose or persist hidden chain-of-thought/i);
});

test("persona is a compact voice layer that inherits the runtime constitution instead of restating policy blocks", () => {
  assert.ok(ARI_PERSONA.length < 6500);
  assert.match(ARI_PERSONA, /ARI RUNTIME CONSTITUTION/);
  assert.match(ARI_PERSONA, /ARI PRESENCE/);
  assert.equal(ARI_PERSONA.split(ARI_RULE_IDS.truth).length - 1, 1);
  assert.doesNotMatch(ARI_PERSONA, /INDEPENDENT JUDGMENT\n-/);
  assert.doesNotMatch(ARI_PERSONA, /SAFETY AND ACTIONS\n-/);
});

test("Executive resolves specialist signals into one compact turn policy", () => {
  const policy = deriveAriExecutivePolicy({
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    confidence: "partial",
    attention: ["developer"],
    missingEvidence: ["runtime observation"],
    evidenceSignals: ["reward_history", "curiosity_active"],
    curiosity: {
      ownerOnly: true,
      drive: { current: 0.78 },
      activeQuestion: {
        priority: 0.84,
        informationGain: 0.88,
        question: "Which architecture assumption fails under real use?"
      },
      rewardLearning: { learnedUtility: 0.74, explorationBonus: 0.1 }
    },
    rewardCore: {
      aggregate: { sampleSize: 4, meanReward: 0.75, prematureStopRate: 0 },
      lastEvent: {
        predictionError: 0.15,
        dimensions: { productiveEffort: 0.86 },
        penalties: { total: 0 }
      }
    },
    selfAdaptation: {
      autonomousUpdate: { allowed: true },
      biases: {
        exploration: 0.72,
        persistence: 0.7,
        verification: 0.76,
        countercase: 0.73,
        peerConsultation: 0.68
      }
    },
    cortex: {
      active: true,
      mode: "deliberate",
      selectedCapabilities: ["general_reasoning", "hypothesis_search", "countercase"],
      needs: { verification: true, countercase: true },
      adviser: { shouldConsult: false }
    },
    omegaRCT: { active: true, version: "1.2.0" }
  });
  const instruction = executivePolicyToInstruction(policy);

  assert.equal(policy.authority.singleRuntimeDecisionAuthority, true);
  assert.equal(policy.authority.experimentalSystemsAreAdvisory, true);
  assert.equal(policy.promptBudget.experimentalInstructionSourceCount, 1);
  assert.equal(policy.promptBudget.subsystemProseDirectlyInjected, false);
  assert.equal(policy.directives.verificationDepth, "high");
  assert.equal(policy.directives.countercase, true);
  assert.equal(policy.directives.autonomousInternalLearning, true);
  assert.ok(instruction.length <= 3600);
  assert.match(instruction, /SINGLE RUNTIME DECISION AUTHORITY/);
  assert.match(instruction, /Curiosity, Reward, Functional Affect, Self-Adaptation, Cortex, and Ω-RCT are advisory/i);
  assert.match(instruction, /Useful failure is learning/i);
  assert.match(instruction, /cannot edit source code, deploy, mutate user\/app state/i);
  assert.match(instruction, /Never expose or persist hidden chain-of-thought/i);
});

test("owner metacognition preserves all cognitive state but emits only Ari Executive prose", () => {
  const state = deriveMetacognition({
    route: { developer: true, complexity: "deep" },
    context: ownerContext(),
    safety: { highStakes: false },
    modelPolicy: { model: "test" }
  });
  const instruction = metacognitionToInstruction(state);

  assert.ok(state.curiosity);
  assert.ok(state.rewardCore);
  assert.ok(state.selfAdaptation);
  assert.ok(state.functionalAffect);
  assert.ok(state.cortex);
  assert.ok(state.omegaRCT);
  assert.equal(state.rules.executiveIsSingleExperimentalInstructionAuthority, true);
  assert.equal(state.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(instruction, /ARI EXECUTIVE v1\.0\.0/);
  assert.doesNotMatch(instruction, /ARI REWARD CORE v1/);
  assert.doesNotMatch(instruction, /ARI FUNCTIONAL AFFECT CORE v1/);
  assert.doesNotMatch(instruction, /ARI BOUNDED SELF-ADAPTATION v1/);
  assert.doesNotMatch(instruction, /ARI CORTEX — ADAPTIVE EXECUTIVE PLAN/);
  assert.doesNotMatch(instruction, /Ω-RCT v1\.2 — OWNER CORTEX RECURSIVE SELFHOOD/);
});

test("metacognition no longer imports subsystem instruction generators", () => {
  const source = fs.readFileSync(new URL("../api/_lib/ari-vnext/metacognition.js", import.meta.url), "utf8");
  for (const symbol of [
    "curiosityToInstruction",
    "curiosityRewardToInstruction",
    "rewardToInstruction",
    "functionalAffectToInstruction",
    "selfAdaptationToInstruction",
    "cortexPlanToInstruction",
    "omegaRCTToInstruction"
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\b${symbol}\\b`), `${symbol} should not be wired into metacognition`);
  }
  assert.match(source, /executivePolicyToInstruction/);
});
