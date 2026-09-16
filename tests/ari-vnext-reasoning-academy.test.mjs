import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_REASONING_ACADEMY_VERSION,
  normalizeReasoningAcademyLesson,
  selectReasoningTeacherModel,
  shouldUseReasoningAcademy
} from "../api/_lib/ari-vnext/adaptive-strategy-reflection.js";

const ORIGINAL_ENV = {
  OPENAI_ARI_REASONING_TEACHER_MODEL: process.env.OPENAI_ARI_REASONING_TEACHER_MODEL,
  OPENAI_ARI_OWNER_MODEL: process.env.OPENAI_ARI_OWNER_MODEL,
  OPENAI_ARI_ADVANCED_MODEL: process.env.OPENAI_ARI_ADVANCED_MODEL,
  OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL: process.env.OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL
};

test.afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
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

  assert.equal(ARI_REASONING_ACADEMY_VERSION, "1.1.0");
  assert.equal(normalized.proposal.strategyKey, "competing_hypotheses_before_commitment");
  assert.equal(normalized.proposal.status, "testing");
  assert.equal(normalized.proposal.confidence, 0.88);
  assert.equal(normalized.lesson.transferConditions.length, 3);
  assert.match(normalized.lesson.disconfirmingCase, /simpler direct answer/i);
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
