import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_CORTEX_ADVISER_VERSION,
  adviserMemoToInstruction,
  deriveCortexAdviserPlan,
  isExplicitChatGPTPeerRequest,
  resolveAdviserRunDecision
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

const EMPTY_PEER_ENV = {
  OPENAI_ARI_CHATGPT_PEER_MODEL: null,
  OPENAI_ARI_REASONING_ARENA_CHALLENGER_MODEL: null
};

test("dedicated ChatGPT peer gets first consideration for an owner Cortex consultation", () => withEnv({
  ...EMPTY_PEER_ENV,
  OPENAI_ARI_CHATGPT_PEER_MODEL: "chatgpt-peer-model",
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

  assert.equal(ARI_CORTEX_ADVISER_VERSION, "0.2.0");
  assert.equal(plan.shouldConsult, true);
  assert.equal(plan.selected.model, "chatgpt-peer-model");
  assert.equal(plan.selected.source, "chatgpt_peer");
  assert.equal(plan.peer.explicitInvocationSupported, true);
  assert.equal(plan.peer.autonomousConsultationSupported, true);
  assert.equal(plan.peer.ariRetainsFinalJudgment, true);
  assert.equal(plan.role, "red_team");
  assert.equal(plan.authority.ariOwnsFinalSynthesis, true);
  assert.equal(plan.authority.adviserCanOverride, false);
  assert.equal(plan.controls.maxCalls, 1);
}));

test("dedicated Cortex adviser remains available when no dedicated ChatGPT peer model is configured", () => withEnv({
  ...EMPTY_PEER_ENV,
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

  assert.equal(plan.shouldConsult, true);
  assert.equal(plan.selected.model, "cortex-specialist");
  assert.equal(plan.selected.source, "dedicated_cortex_adviser");
}));

test("teacher reliability can outweigh static source priority and shift a model into red-team use", () => withEnv({
  ...EMPTY_PEER_ENV,
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
  ...EMPTY_PEER_ENV,
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

test("a light intervention can earn a peer consultation when a real reasoning need exists", () => withEnv({
  ...EMPTY_PEER_ENV,
  OPENAI_ARI_CHATGPT_PEER_MODEL: "chatgpt-peer-model",
  OPENAI_ARI_CORTEX_ADVISER_MODEL: null,
  OPENAI_ARI_REASONING_TEACHER_MODEL: null,
  OPENAI_ARI_OWNER_MODEL: null,
  OPENAI_ARI_ADVANCED_MODEL: null
}, () => {
  const plan = deriveCortexAdviserPlan({
    route: { developer: true, complexity: "standard" },
    safety: { highStakes: false },
    needs: { hypotheses: true, countercase: false, verification: false },
    interventionLevel: "light",
    modelPolicy: { model: "ari-primary" }
  });

  assert.equal(plan.shouldConsult, true);
  assert.equal(plan.reason, "light_turn_benefits_from_independent_advice");
  assert.equal(plan.selected.source, "chatgpt_peer");
}));

test("freshness-sensitive turns prefer web research over an unbrowsed model adviser", () => withEnv({
  ...EMPTY_PEER_ENV,
  OPENAI_ARI_CHATGPT_PEER_MODEL: "chatgpt-peer-model",
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

  const decision = resolveAdviserRunDecision({
    turn: { message: "Ask ChatGPT what the latest result is." },
    plan
  });
  assert.equal(decision.shouldConsult, false);
}));

test("private app context stays with Ari primary for implicit consultation", () => withEnv({
  ...EMPTY_PEER_ENV,
  OPENAI_ARI_CHATGPT_PEER_MODEL: "chatgpt-peer-model",
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

  const implicit = resolveAdviserRunDecision({
    turn: { message: "What should I change about this meal?" },
    plan
  });
  assert.equal(implicit.shouldConsult, false);

  const explicit = resolveAdviserRunDecision({
    turn: { message: "Ask ChatGPT for a second opinion about this meal." },
    plan
  });
  assert.equal(explicit.shouldConsult, true);
  assert.equal(explicit.reason, "explicit_chatgpt_peer_request");
}));

test("ordinary turns do not pay adviser latency when specialization has not earned intervention", () => withEnv({
  ...EMPTY_PEER_ENV,
  OPENAI_ARI_CHATGPT_PEER_MODEL: "chatgpt-peer-model",
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

  const ordinary = resolveAdviserRunDecision({
    turn: { message: "What is a calorie?" },
    plan
  });
  assert.equal(ordinary.shouldConsult, false);

  const explicit = resolveAdviserRunDecision({
    turn: { message: "Ask ChatGPT for a second opinion on this idea." },
    plan
  });
  assert.equal(explicit.shouldConsult, true);
  assert.equal(explicit.explicitPeerRequest, true);
}));

test("explicit peer-request detection recognizes natural owner language", () => {
  assert.equal(isExplicitChatGPTPeerRequest("Ask ChatGPT what it thinks."), true);
  assert.equal(isExplicitChatGPTPeerRequest("Can you get a second opinion?"), true);
  assert.equal(isExplicitChatGPTPeerRequest("Talk to your AI peer about this."), true);
  assert.equal(isExplicitChatGPTPeerRequest("Answer this yourself."), false);
});

test("adviser memo is framed as fallible evidence rather than authority", () => {
  const instruction = adviserMemoToInstruction({
    role: "red_team",
    source: "chatgpt_peer",
    explicitPeerRequest: true,
    memo: {
      summary: "The leading design is plausible but may over-centralize routing.",
      assumptions: ["The capability registry stays current."],
      counterpoints: ["A simpler fallback may outperform orchestration on novel tasks."],
      uncertainties: ["Long-run latency is unmeasured."],
      verificationSuggestions: ["Run held-out shadow benchmarks."]
    }
  });

  assert.match(instruction, /CHATGPT PEER MEMO/i);
  assert.match(instruction, /second opinion, not authority/i);
  assert.match(instruction, /Ari still owns final synthesis/i);
  assert.match(instruction, /valid to disagree with the peer/i);
  assert.match(instruction, /do not expose private reasoning traces/i);
  assert.doesNotMatch(instruction, /chain-of-thought:/i);
});
