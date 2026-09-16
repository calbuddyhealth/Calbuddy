import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_CORTEX_ADVISER_VERSION,
  adviserMemoToInstruction,
  deriveCortexAdviserPlan
} from "../api/_lib/ari-vnext/cortex-adviser.js";

function withEnv(patch, fn) {
  const prior = {};
  for (const [key, value] of Object.entries(patch)) {
    prior[key] = process.env[key];
    if (value === null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function reliabilityFor(model, role = "critic_only", domain = "developer", weightedSamples = 10) {
  const ariScore = role === "critic_only" ? 0.8 : role === "mentor" ? 0.2 : 0.5;
  return {
    ownerOnly: true,
    models: [
      {
        model,
        domains: [
          {
            domain,
            role,
            weightedSamples,
            ariScore,
            teacherScore: 1 - ariScore,
            arenaBenchmarks: 4
          }
        ]
      }
    ]
  };
}

test("dedicated Cortex adviser can be selected for a deep public reasoning turn", () => withEnv({
  OPENAI_ARI_CORTEX_ADVISER_MODEL: "cortex-specialist",
  OPENAI_ARI_REASONING_TEACHER_MODEL: null,
  OPENAI_ARI_OWNER_MODEL: null,
  OPENAI_ARI_ADVANCED_MODEL: null,
  ARI_CORTEX_ADVISER_ENABLED: "true"
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: true, verification: false },
    interventionLevel: "deep",
    modelPolicy: { model: "ari-primary" },
    teacherReliability: null
  });

  assert.equal(ARI_CORTEX_ADVISER_VERSION, "0.1.0");
  assert.equal(plan.shouldConsult, true);
  assert.equal(plan.selected.model, "cortex-specialist");
  assert.equal(plan.selected.source, "dedicated_cortex_adviser");
  assert.equal(plan.role, "red_team");
  assert.equal(plan.authority.ariOwnsFinalSynthesis, true);
  assert.equal(plan.authority.adviserCanOverride, false);
  assert.equal(plan.controls.maxCalls, 1);
}));

test("teacher reliability can outweigh static source priority and shift a model into red-team use", () => withEnv({
  OPENAI_ARI_CORTEX_ADVISER_MODEL: "generic-adviser",
  OPENAI_ARI_REASONING_TEACHER_MODEL: "proven-teacher",
  OPENAI_ARI_OWNER_MODEL: null,
  OPENAI_ARI_ADVANCED_MODEL: null,
  ARI_CORTEX_ADVISER_ENABLED: "true"
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: true, verification: true },
    interventionLevel: "deep",
    modelPolicy: { model: "ari-primary" },
    teacherReliability: reliabilityFor("proven-teacher", "critic_only")
  });

  assert.equal(plan.shouldConsult, true);
  assert.equal(plan.selected.model, "proven-teacher");
  assert.equal(plan.selected.authority.role, "critic_only");
  assert.equal(plan.role, "red_team");
  assert.ok(plan.selected.score > plan.alternatives[0].score);
}));

test("a mentor teacher gains weight without gaining executive authority", () => withEnv({
  OPENAI_ARI_REASONING_TEACHER_MODEL: "mentor-model",
  OPENAI_ARI_CORTEX_ADVISER_MODEL: null,
  OPENAI_ARI_OWNER_MODEL: null,
  OPENAI_ARI_ADVANCED_MODEL: null
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { developer: true, complexity: "deep" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: false, verification: false },
    interventionLevel: "deep",
    modelPolicy: { model: "ari-primary" },
    teacherReliability: reliabilityFor("mentor-model", "mentor")
  });

  assert.equal(plan.selected.model, "mentor-model");
  assert.equal(plan.selected.authority.role, "mentor");
  assert.equal(plan.selected.authority.teacherCanOverride, false);
  assert.equal(plan.authority.adviserCanChangePermissions, false);
}));

test("freshness-sensitive turns prefer web research over an unbrowsed model adviser", () => withEnv({
  OPENAI_ARI_CORTEX_ADVISER_MODEL: "cortex-specialist"
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { currentInfo: true, complexity: "deep" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: true, verification: true, externalEvidence: true },
    interventionLevel: "deep",
    modelPolicy: { model: "ari-primary" }
  });

  assert.equal(plan.shouldConsult, false);
  assert.equal(plan.reason, "freshness_tool_preferred_over_unbrowsed_adviser");
  assert.equal(plan.toolPriority, "web_search_first");
}));

test("private app context stays with Ari primary instead of being copied to an independent adviser", () => withEnv({
  OPENAI_ARI_CORTEX_ADVISER_MODEL: "cortex-specialist"
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { nutrition: true, complexity: "deep" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: true },
    interventionLevel: "deep",
    modelPolicy: { model: "ari-primary" }
  });

  assert.equal(plan.shouldConsult, false);
  assert.equal(plan.reason, "private_or_app_context_kept_with_primary");
}));

test("ordinary turns do not pay adviser latency when specialization has not earned intervention", () => withEnv({
  OPENAI_ARI_CORTEX_ADVISER_MODEL: "cortex-specialist"
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { complexity: "standard" },
    safety: { highStakes: false },
    needs: { hypotheses: false, countercase: false, verification: false },
    interventionLevel: "none",
    modelPolicy: { model: "ari-primary" }
  });

  assert.equal(plan.shouldConsult, false);
  assert.equal(plan.reason, "specialization_not_strong_enough");
}));

test("adviser memo is framed as fallible evidence rather than authority", () => {
  const instruction = adviserMemoToInstruction({
    role: "red_team",
    memo: {
      summary: "The leading design is plausible but may over-centralize routing.",
      assumptions: ["The capability registry stays current."],
      counterpoints: ["A simpler fallback may outperform orchestration on novel tasks."],
      uncertainties: ["Long-run latency is unmeasured."],
      verificationSuggestions: ["Run held-out shadow benchmarks."]
    }
  });

  assert.match(instruction, /advisory evidence, not authority/i);
  assert.match(instruction, /Ari still owns final synthesis/i);
  assert.match(instruction, /do not expose private reasoning traces/i);
  assert.doesNotMatch(instruction, /chain-of-thought:/i);
});
