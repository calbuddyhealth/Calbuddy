import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_REASONING_ACADEMY_VERSION,
  normalizeAdaptiveReflectionProposal,
  normalizeReasoningAcademyLesson,
  reflectOnAdaptiveStrategy,
  selectReasoningTeacherModel,
  shouldUseReasoningAcademy
} from "../api/_lib/ari-vnext/adaptive-strategy-reflection.js";

const ORIGINAL_ENV = {
  OPENAI_ARI_REASONING_TEACHER_MODEL: process.env.OPENAI_ARI_REASONING_TEACHER_MODEL,
  OPENAI_ARI_OWNER_MODEL: process.env.OPENAI_ARI_OWNER_MODEL,
  OPENAI_ARI_ADVANCED_MODEL: process.env.OPENAI_ARI_ADVANCED_MODEL,
  OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL: process.env.OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};
const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = ORIGINAL_FETCH;
});

test("reasoning academy activates for difficult reasoning turns but not high-stakes turns", () => {
  const baseResult = {
    success: true,
    reply: "I would compare both architectures before committing.",
    safety: { highStakes: false },
    route: { developer: true, complexity: "deep" },
    modelPolicy: { mode: "deep" },
    metacognition: { confidence: "grounded", missingEvidence: [] }
  };

  assert.equal(
    shouldUseReasoningAcademy({
      turn: { message: "Which architecture is better and why?" },
      result: baseResult
    }),
    true
  );

  assert.equal(
    shouldUseReasoningAcademy({
      turn: { message: "Which architecture is better and why?" },
      result: { ...baseResult, safety: { highStakes: true } }
    }),
    false
  );
});

test("reasoning academy activates for explicit judgment even on a non-deep route", () => {
  assert.equal(
    shouldUseReasoningAcademy({
      turn: { message: "What is your opinion on this approach? Give me the reasoning." },
      result: {
        success: true,
        reply: "My view is that option B is stronger.",
        safety: { highStakes: false },
        route: { complexity: "standard" },
        modelPolicy: { mode: "standard" },
        metacognition: { confidence: "grounded", missingEvidence: [] }
      }
    }),
    true
  );
});

test("teacher model preference uses dedicated teacher then owner model before current provider", () => {
  process.env.OPENAI_ARI_REASONING_TEACHER_MODEL = "teacher-model";
  process.env.OPENAI_ARI_OWNER_MODEL = "owner-model";

  assert.equal(
    selectReasoningTeacherModel({
      academyMode: true,
      result: { provider: { model: "current-model" } }
    }),
    "teacher-model"
  );

  delete process.env.OPENAI_ARI_REASONING_TEACHER_MODEL;
  assert.equal(
    selectReasoningTeacherModel({
      academyMode: true,
      result: { provider: { model: "current-model" } }
    }),
    "owner-model"
  );
});

test("teacher lesson becomes only a testing strategy and retains transferable method metadata", () => {
  const normalized = normalizeReasoningAcademyLesson({
    academyDecision: "propose",
    reasoningPattern: "When several explanations fit, generate competing hypotheses and look for evidence that distinguishes between them before committing.",
    failureMode: "Prematurely selecting the most familiar explanation.",
    transferConditions: [
      "Several plausible causes explain the same observation.",
      "The recommendation changes materially depending on which cause is true.",
      "Evidence exists that can distinguish the competing explanations."
    ],
    disconfirmingCase: "Use a simpler direct answer when the relevant fact is already verified and alternatives are not genuinely plausible.",
    teacherConfidence: 0.91,
    shouldPropose: true,
    strategyKey: "competing_hypotheses_before_commitment",
    title: "Competing hypotheses before commitment",
    instruction: "When multiple plausible explanations could change the decision, compare them and seek discriminating evidence before committing to one.",
    rationale: "This reduces framing lock and premature certainty while preserving decisive conclusions when evidence separates the options.",
    lessonSummary: "Compare plausible explanations and seek evidence that distinguishes them before commitment.",
    domains: ["decision", "evidence", "developer"],
    confidence: 0.88,
    replacesStrategyKey: "",
    userVisibleSummary: "I am testing a stronger way to compare competing explanations before committing."
  });

  assert.equal(ARI_REASONING_ACADEMY_VERSION, "1.1.1");
  assert.equal(normalized.proposal.strategyKey, "competing_hypotheses_before_commitment");
  assert.equal(normalized.proposal.status, "testing");
  assert.equal(normalized.proposal.confidence, 0.88);
  assert.equal(normalized.lesson.transferConditions.length, 3);
  assert.match(normalized.lesson.disconfirmingCase, /simpler direct answer/i);
});

test("lightweight adaptive reflection can persist a valid strategy without Reasoning Academy-only fields", () => {
  const proposal = normalizeAdaptiveReflectionProposal({
    shouldPropose: true,
    strategyKey: "verify_action_state_before_claiming_completion",
    title: "Verify action state before claiming completion",
    instruction: "Before saying an external action or code change happened, require current machine-verifiable evidence for that state.",
    rationale: "This prevents language from outrunning actual runtime state while preserving concise recommendations and proposals.",
    lessonSummary: "Implementation claims should follow verifiable implementation evidence.",
    domains: ["developer", "evidence"],
    confidence: 0.81,
    replacesStrategyKey: "",
    userVisibleSummary: "I am testing a stricter evidence check for claims that an action was completed."
  });

  assert.ok(proposal);
  assert.equal(proposal.strategyKey, "verify_action_state_before_claiming_completion");
  assert.equal(proposal.status, "testing");
  assert.equal(proposal.confidence, 0.81);
});

test("lightweight adaptive reflection still skips when it found no reusable improvement", () => {
  assert.equal(normalizeAdaptiveReflectionProposal({
    shouldPropose: false,
    strategyKey: "",
    title: "",
    instruction: "",
    rationale: "",
    lessonSummary: "",
    domains: [],
    confidence: 0,
    replacesStrategyKey: "",
    userVisibleSummary: ""
  }), null);
});

test("lightweight reflection uses its own schema and returns a persistable proposal", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL = "test-model";

  globalThis.fetch = async (_url, options = {}) => {
    const body = JSON.parse(options.body);
    assert.equal(body.text.format.name, "ari_adaptive_strategy_reflection");
    assert.equal(body.text.format.schema.required.includes("academyDecision"), false);
    assert.equal(body.text.format.schema.required.includes("transferConditions"), false);

    return {
      ok: true,
      async json() {
        return {
          id: "resp_test",
          model: "test-model",
          output: [{
            content: [{
              type: "output_text",
              text: JSON.stringify({
                shouldPropose: true,
                strategyKey: "verify_before_status_claim",
                title: "Verify before status claims",
                instruction: "Require current verifiable state before claiming an external action or implementation is complete.",
                rationale: "This prevents status language from outrunning the underlying system state.",
                lessonSummary: "Completion claims should follow current evidence.",
                domains: ["developer", "evidence"],
                confidence: 0.8,
                replacesStrategyKey: "",
                userVisibleSummary: "I am testing a stronger verification step before status claims."
              })
            }]
          }]
        };
      }
    };
  };

  const result = await reflectOnAdaptiveStrategy({
    turn: { message: "Continue." },
    result: {
      success: true,
      reply: "Here is the completed response.",
      safety: { highStakes: false },
      route: { complexity: "standard" },
      modelPolicy: { mode: "standard", model: "test-model" },
      provider: { model: "test-model" },
      metacognition: { confidence: "grounded", missingEvidence: [], evidenceSignals: [] }
    },
    adaptiveStrategyState: { active: [] }
  });

  assert.equal(result.reason, "proposal_created");
  assert.equal(result.academy.active, false);
  assert.equal(result.proposal.strategyKey, "verify_before_status_claim");
  assert.equal(result.proposal.sourceKind, "adaptive_reflection");
});

test("reasoning academy rejects lessons that do not demonstrate transfer", () => {
  const normalized = normalizeReasoningAcademyLesson({
    academyDecision: "propose",
    reasoningPattern: "Use this exact answer again next time.",
    failureMode: "",
    transferConditions: ["The same question appears again."],
    disconfirmingCase: "",
    teacherConfidence: 0.95,
    shouldPropose: true,
    strategyKey: "repeat_answer",
    title: "Repeat answer",
    instruction: "Repeat the same answer whenever this exact question appears again.",
    rationale: "It worked once.",
    lessonSummary: "Repeat the answer.",
    domains: ["conversation"],
    confidence: 0.95,
    replacesStrategyKey: "",
    userVisibleSummary: "I will repeat the same answer."
  });

  assert.equal(normalized.proposal, null);
  assert.equal(normalized.lesson, null);
});
