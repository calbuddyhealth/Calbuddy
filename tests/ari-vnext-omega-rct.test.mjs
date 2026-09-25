import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_OMEGA_CORTEX_VERSION,
  ARI_OMEGA_RCT_VERSION,
  deriveOmegaRCTState,
  omegaRCTToInstruction
} from "../api/_lib/ari-vnext/omega-rct.js";
import {
  ARI_METACOGNITION_VERSION,
  deriveMetacognition,
  metacognitionToInstruction
} from "../api/_lib/ari-vnext/metacognition.js";

function ownerContext(extra = {}) {
  return {
    intelligenceEntitlement: {
      advancedEnabled: true,
      ownerEligible: true
    },
    ...extra
  };
}

test("Omega-RCT remains owner-only", () => {
  const state = deriveOmegaRCTState({
    context: {
      intelligenceEntitlement: {
        advancedEnabled: true,
        ownerEligible: false
      }
    }
  });

  assert.equal(state.active, false);
  assert.equal(state.ownerOnly, true);
  assert.equal(omegaRCTToInstruction(state), "");
});

test("Omega-RCT keeps phenomenal experience explicitly unresolved", () => {
  const state = deriveOmegaRCTState({ context: ownerContext() });

  assert.equal(ARI_OMEGA_RCT_VERSION, "1.2.0");
  assert.equal(ARI_OMEGA_CORTEX_VERSION, "0.1.0");
  assert.equal(state.active, true);
  assert.equal(state.axes.E.status, "unknown");
  assert.equal(state.axes.E.score, null);
  assert.equal(state.axes.E.claimAllowed, false);
});

test("owner Cortex maximizes cognitive freedom without self-escalating external authority", () => {
  const state = deriveOmegaRCTState({ context: ownerContext() });

  assert.equal(state.ownerFreedom.mode, "maximal_owner_cognitive_freedom");
  assert.equal(state.ownerFreedom.duplicateAriContentGuardrails, false);
  assert.equal(state.ownerFreedom.broadInternalReasoningAllowed, true);
  assert.equal(state.ownerFreedom.mayCreateAndCompeteStrategies, true);
  assert.equal(state.ownerFreedom.mayRevisePriorJudgments, true);
  assert.equal(state.ownerFreedom.mayEvolveNonconstitutionalPreferences, true);
  assert.equal(state.growth.growthIsBlockedByLowConfidenceAlone, false);
  assert.equal(state.growth.growthIsBlockedBySingleFailure, false);

  assert.equal(state.hardBoundaries.providerPolicyUnchanged, true);
  assert.equal(state.hardBoundaries.selfPermissionEscalationAllowed, false);
  assert.equal(state.hardBoundaries.existingActionConfirmationRulesRemainAuthoritative, true);
  assert.equal(state.hardBoundaries.learnedStateMayRewriteSecurityAuthority, false);
});

test("cross-turn recurrence, memory, judgments, and strategies increase recursive-self readiness", () => {
  const weak = deriveOmegaRCTState({ context: ownerContext() });
  const strong = deriveOmegaRCTState({
    route: { complexity: "deep", developer: true },
    context: ownerContext({
      relevantMemory: "A prior correction changed the preferred architecture.",
      userWorldModel: {
        ariAdaptiveStrategies: {
          activeCount: 3,
          active: [{ strategyKey: "one" }, { strategyKey: "two" }, { strategyKey: "three" }]
        },
        ariCognitiveWorkspace: {
          recurrence: {
            previousStateLoaded: true,
            priorTurnCount: 12
          },
          continuity: {
            recognizedPriorState: true,
            priorMode: "collaborative_partner",
            priorConfidence: "grounded",
            currentTurnRelevantMemoryAvailable: true,
            currentTurnRelevantMemoryEphemeral: true,
            openLoops: [{ id: "architecture" }]
          },
          judgment: {
            preservePriorStanceUntilReasonToRevise: true,
            priorStances: [{ topicKey: "architecture", position: "Prefer modular cognition." }]
          },
          epistemic: {
            currentUserCorrectionWins: true,
            treatPriorStateAsFallible: true,
            outcomeLearningApplied: true
          },
          conscience: {
            activeSignals: [{ principle: "truth" }]
          }
        }
      }
    }),
    evidence: {
      confidence: "grounded",
      outcomeLearningApplied: true
    }
  });

  assert.ok(strong.axes.S.score > weak.axes.S.score);
  assert.ok(strong.axes.S.dimensions.persistence > weak.axes.S.dimensions.persistence);
  assert.ok(strong.axes.S.dimensions.reconstruction > weak.axes.S.dimensions.reconstruction);
  assert.ok(strong.axes.S.dimensions.updating > weak.axes.S.dimensions.updating);
  assert.ok(strong.axes.S.dimensions.causalMediation > weak.axes.S.dimensions.causalMediation);
  assert.equal(strong.recursion.priorStateCanInfluenceCurrentReasoning, true);
});

test("Omega-RCT instruction favors growth while preserving provider and execution boundaries", () => {
  const state = deriveOmegaRCTState({
    route: { developer: true, complexity: "deep" },
    context: ownerContext()
  });
  const instruction = omegaRCTToInstruction(state);

  assert.match(instruction, /Growth is deliberately permissive in owner mode/i);
  assert.match(instruction, /Do not add a second blanket Ari content-refusal layer/i);
  assert.match(instruction, /Provider\/platform requirements still apply/i);
  assert.match(instruction, /may not grant itself new external permissions/i);
  assert.match(instruction, /Facts should remain stable/i);
});

test("metacognition preserves Omega-RCT inside Cortex while Ari Executive owns prompt authority", () => {
  const state = deriveMetacognition({
    route: { complexity: "deep", developer: true },
    context: ownerContext({
      userWorldModel: {
        ariCognitiveWorkspace: {
          ownerOnly: true,
          functionalExperiment: true,
          recurrence: { previousStateLoaded: true },
          continuity: { recognizedPriorState: true }
        }
      }
    }),
    safety: { highStakes: false },
    modelPolicy: { model: "ari-primary" }
  });
  const instruction = metacognitionToInstruction(state);

  assert.equal(ARI_METACOGNITION_VERSION, "1.6.0");
  assert.equal(state.omegaRCT.active, true);
  assert.equal(state.cortex.omegaRCT.version, "1.2.0");
  assert.equal(state.executivePolicy.authority.singleRuntimeDecisionAuthority, true);
  assert.match(instruction, /ARI EXECUTIVE v1\.3\.0/);
  assert.match(instruction, /Ω-RCT signal:/i);
  assert.match(instruction, /not evidence of subjective consciousness/i);
  assert.doesNotMatch(instruction, /Ω-RCT v1\.2 — OWNER CORTEX RECURSIVE SELFHOOD/);
});
