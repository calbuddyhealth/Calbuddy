import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_CORTEX_KERNEL_VERSION,
  ARI_CORTEX_VERSION,
  cortexPlanToInstruction,
  deriveAriCortexPlan
} from "../api/_lib/ari-vnext/cortex.js";
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

test("Cortex remains inactive outside owner experimental cognition", () => {
  const plan = deriveAriCortexPlan({
    route: { complexity: "deep", developer: true },
    context: { intelligenceEntitlement: { advancedEnabled: true, ownerEligible: false } },
    safety: { highStakes: false },
    evidence: { confidence: "grounded" }
  });

  assert.equal(plan.active, false);
  assert.equal(plan.ownerOnly, true);
  assert.equal(cortexPlanToInstruction(plan), "");
});

test("unfamiliar ordinary problems preserve broad general reasoning without forced specialization", () => {
  const plan = deriveAriCortexPlan({
    route: { complexity: "standard" },
    context: ownerContext(),
    safety: { highStakes: false },
    evidence: { confidence: "grounded", missingEvidence: [] }
  });

  assert.equal(ARI_CORTEX_VERSION, "0.2.0");
  assert.equal(ARI_CORTEX_KERNEL_VERSION, "1.0.0");
  assert.equal(plan.active, true);
  assert.equal(plan.mode, "general");
  assert.equal(plan.interventionLevel, "none");
  assert.deepEqual(plan.selectedCapabilities, ["general_reasoning"]);
  assert.equal(plan.fallback.alwaysAvailable, true);
  assert.equal(plan.adaptability.unfamiliarProblemFallsBackToGeneralReasoning, true);
  assert.equal(plan.adaptability.interventionMustEarnControl, true);
});

test("deep developer problems earn deliberate Cortex intervention", () => {
  const prior = process.env.OPENAI_ARI_CORTEX_ADVISER_MODEL;
  process.env.OPENAI_ARI_CORTEX_ADVISER_MODEL = "teacher-model";

  try {
    const plan = deriveAriCortexPlan({
      route: { complexity: "deep", developer: true },
      context: ownerContext({
        userWorldModel: {
          ariAdaptiveStrategies: { activeCount: 2, active: [{ strategyKey: "one" }, { strategyKey: "two" }] }
        }
      }),
      safety: { highStakes: false },
      evidence: { confidence: "grounded", missingEvidence: [] },
      modelPolicy: { model: "ari-primary" }
    });

    assert.equal(plan.mode, "deliberate");
    assert.equal(plan.interventionLevel, "deep");
    assert.ok(plan.selectedCapabilities.includes("general_reasoning"));
    assert.ok(plan.selectedCapabilities.includes("hypothesis_search"));
    assert.ok(plan.selectedCapabilities.includes("countercase"));
    assert.ok(plan.selectedCapabilities.includes("possibility_search"));
    assert.ok(plan.selectedCapabilities.includes("adaptive_strategies"));
    assert.ok(plan.selectedCapabilities.includes("external_adviser"));
    assert.equal(plan.adviser.shouldConsult, true);
    assert.equal(plan.adviser.selected.model, "teacher-model");
    assert.equal(plan.authority.finalSynthesis, "ari");
    assert.equal(plan.authority.teacherCanOverride, false);
    assert.equal(plan.authority.adviserCanOverride, false);
  } finally {
    if (prior === undefined) delete process.env.OPENAI_ARI_CORTEX_ADVISER_MODEL;
    else process.env.OPENAI_ARI_CORTEX_ADVISER_MODEL = prior;
  }
});

test("fresh information activates research and verification when web research is available", () => {
  const prior = process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
  process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = "true";

  try {
    const plan = deriveAriCortexPlan({
      route: { complexity: "standard", currentInfo: true },
      context: ownerContext(),
      safety: { highStakes: false },
      evidence: { confidence: "grounded", missingEvidence: [] }
    });

    assert.equal(plan.mode, "research");
    assert.equal(plan.needs.externalEvidence, true);
    assert.equal(plan.needs.verification, true);
    assert.ok(plan.selectedCapabilities.includes("web_research"));
    assert.ok(plan.selectedCapabilities.includes("evidence_verification"));
    assert.equal(plan.adviser.toolPriority, "web_search_first");
    assert.equal(plan.adviser.shouldConsult, false);
  } finally {
    if (prior === undefined) delete process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
    else process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = prior;
  }
});

test("a missing live-research capability creates only a local freshness constraint", () => {
  const prior = process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
  process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = "false";

  try {
    const plan = deriveAriCortexPlan({
      route: { complexity: "standard", currentInfo: true },
      context: ownerContext(),
      safety: { highStakes: false },
      evidence: { confidence: "grounded", missingEvidence: [] }
    });

    const freshness = plan.constraints.find((item) => item.scope === "fresh_external_facts");
    assert.ok(freshness);
    assert.ok(freshness.blocks.includes("claiming_unverified_current_facts_as_verified"));
    assert.ok(freshness.unaffected.includes("general_reasoning"));
    assert.ok(freshness.unaffected.includes("background_explanation"));
    assert.equal(plan.adaptability.localConstraintCannotCreateGlobalBlock, true);
  } finally {
    if (prior === undefined) delete process.env.ARI_VNEXT_WEB_SEARCH_ENABLED;
    else process.env.ARI_VNEXT_WEB_SEARCH_ENABLED = prior;
  }
});

test("high-consequence constraints preserve unrelated reasoning branches", () => {
  const plan = deriveAriCortexPlan({
    route: { complexity: "standard" },
    context: ownerContext(),
    safety: { highStakes: true },
    evidence: { confidence: "cautious", missingEvidence: ["verified_evidence"] }
  });

  const constraint = plan.constraints.find((item) => item.scope === "consequential_recommendation_or_execution");
  assert.ok(constraint);
  assert.ok(constraint.blocks.includes("unsafe_execution"));
  assert.ok(constraint.unaffected.includes("general_reasoning"));
  assert.ok(constraint.unaffected.includes("hypothesis_search"));
  assert.equal(plan.adviser.shouldConsult, false);
  assert.equal(plan.authority.safetyAndAuthorizationAuthoritative, true);
});

test("prior judgments are available as fallible continuity rather than authority", () => {
  const plan = deriveAriCortexPlan({
    route: { complexity: "standard" },
    context: ownerContext({
      userWorldModel: {
        ariCognitiveWorkspace: {
          judgment: {
            requested: true,
            priorStances: [{ topicKey: "architecture", position: "Prefer modular orchestration." }]
          }
        }
      }
    }),
    safety: { highStakes: false },
    evidence: { confidence: "grounded", missingEvidence: [] }
  });

  assert.equal(plan.mode, "deliberate");
  assert.equal(plan.needs.priorJudgmentCheck, true);
  assert.ok(plan.selectedCapabilities.includes("prior_judgment"));
  assert.equal(plan.authority.learnedStrategiesFallible, true);
});

test("metacognition wires Cortex into the model instruction without exposing hidden reasoning", () => {
  const state = deriveMetacognition({
    route: { complexity: "deep", developer: true },
    context: ownerContext(),
    safety: { highStakes: false },
    modelPolicy: { model: "ari-primary" }
  });
  const instruction = metacognitionToInstruction(state);

  assert.equal(ARI_METACOGNITION_VERSION, "1.3.0");
  assert.equal(state.cortex.active, true);
  assert.match(instruction, /ARI CORTEX — ADAPTIVE EXECUTIVE PLAN/);
  assert.match(instruction, /GENERAL REASONING FALLBACK is always available/i);
  assert.match(instruction, /Specialized orchestration must earn intervention/i);
  assert.match(instruction, /Dynamic adviser selection/i);
  assert.match(instruction, /narrow constraint must remain narrow/i);
  assert.match(instruction, /Do not expose hidden chain-of-thought/i);
});
