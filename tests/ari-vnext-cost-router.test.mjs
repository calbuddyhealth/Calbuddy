import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_COST_ROUTER_VERSION,
  applyInteractiveCostGuard,
  compactInstructionText,
  compileConversationInput,
  deriveReasoningDemand,
  promptBudgetTelemetry,
  resolveBackgroundModel,
  resolveOwnerInteractiveModel
} from "../api/_lib/ari-vnext/cost-router.js";

const ORIGINAL_ENV = {
  ARI_ALLOW_BACKGROUND_SOL: process.env.ARI_ALLOW_BACKGROUND_SOL,
  ARI_OWNER_FORCE_SOL: process.env.ARI_OWNER_FORCE_SOL,
  ARI_OWNER_USE_LEGACY_MODEL_OVERRIDES: process.env.ARI_OWNER_USE_LEGACY_MODEL_OVERRIDES,
  OPENAI_ARI_OWNER_SOL_MODEL: process.env.OPENAI_ARI_OWNER_SOL_MODEL,
  OPENAI_ARI_OWNER_ASTRA_MODEL: process.env.OPENAI_ARI_OWNER_ASTRA_MODEL,
  OPENAI_ARI_OWNER_BUDGET_MODEL: process.env.OPENAI_ARI_OWNER_BUDGET_MODEL,
  ARI_CONTEXT_HISTORY_MESSAGES: process.env.ARI_CONTEXT_HISTORY_MESSAGES,
  ARI_CONTEXT_HISTORY_CHARS: process.env.ARI_CONTEXT_HISTORY_CHARS,
  ARI_CONTEXT_INSTRUCTION_CHARS: process.env.ARI_CONTEXT_INSTRUCTION_CHARS,
  ARI_OWNER_MAX_SOL_CALL_USD: process.env.ARI_OWNER_MAX_SOL_CALL_USD,
  ARI_OWNER_MAX_ASTRA_CALL_USD: process.env.ARI_OWNER_MAX_ASTRA_CALL_USD,
  ARI_OWNER_ALLOW_OVERSIZE_SOL: process.env.ARI_OWNER_ALLOW_OVERSIZE_SOL,
  ARI_OWNER_ALLOW_OVERSIZE_ASTRA: process.env.ARI_OWNER_ALLOW_OVERSIZE_ASTRA
};

test.afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("owner routing tries Sol first and reserves Astra for explicit or extreme work", () => {
  delete process.env.OPENAI_ARI_OWNER_SOL_MODEL;
  delete process.env.OPENAI_ARI_OWNER_ASTRA_MODEL;
  delete process.env.ARI_OWNER_FORCE_SOL;
  delete process.env.ARI_OWNER_ASTRA_ESCALATION_SCORE;

  const ordinary = resolveOwnerInteractiveModel({
    mode: "standard",
    route: { complexity: "standard", solEscalationEligible: false },
    reasoningProfile: "adaptive"
  });
  assert.equal(ordinary.model, "gpt-6.1-sol");
  assert.equal(ordinary.fallbackModel, "gpt-6.1-sol");
  assert.equal(ordinary.escalated, false);

  const hard = resolveOwnerInteractiveModel({
    mode: "deep",
    route: { complexity: "deep", developer: true, solEscalationEligible: true },
    reasoningProfile: "adaptive"
  });
  assert.equal(hard.reasoningDemand.score, 9);
  assert.equal(hard.reasoningDemand.band, "critical");
  assert.equal(hard.model, "gpt-6.1-sol");
  assert.equal(hard.escalated, false);
  assert.equal(hard.reason, "sol_pro_first");

  const extreme = resolveOwnerInteractiveModel({
    mode: "deep",
    route: {
      complexity: "deep",
      developer: true,
      solEscalationEligible: true,
      messageLength: 2200
    },
    reasoningProfile: "adaptive"
  });
  assert.equal(extreme.reasoningDemand.score, 11);
  assert.equal(extreme.model, "gpt-6-astra");
  assert.equal(extreme.escalated, true);
  assert.equal(extreme.reason, "extreme_hard_problem");

  const manual = resolveOwnerInteractiveModel({
    mode: "fast",
    route: { ownerModelRequest: "astra", solEscalationEligible: false },
    reasoningProfile: "adaptive"
  });
  assert.equal(manual.model, "gpt-6-astra");
  assert.equal(manual.reason, "explicit_astra_request");

  const forcedSol = resolveOwnerInteractiveModel({
    mode: "deep",
    route: { ownerModelRequest: "sol", solEscalationEligible: true },
    reasoningProfile: "adaptive"
  });
  assert.equal(forcedSol.model, "gpt-6.1-sol");
  assert.equal(forcedSol.escalated, false);
});

test("reasoning governor converts measurable turn signals into deterministic bands", () => {
  const simple = deriveReasoningDemand({ complexity: "fast" });
  assert.equal(simple.score, 0);
  assert.equal(simple.band, "low");

  const ordinary = deriveReasoningDemand({ complexity: "standard" });
  assert.equal(ordinary.score, 3);
  assert.equal(ordinary.band, "medium");

  const deep = deriveReasoningDemand({ complexity: "deep" });
  assert.equal(deep.score, 5);
  assert.equal(deep.band, "high");

  const critical = deriveReasoningDemand({
    complexity: "deep",
    developer: true,
    solEscalationEligible: true
  });
  assert.equal(critical.score, 9);
  assert.equal(critical.band, "critical");
  assert.deepEqual(
    critical.reasons,
    ["complexity_deep", "developer_context", "hard_problem_signal"]
  );

  const retry = deriveReasoningDemand({
    complexity: "standard",
    previousAttemptFailed: true
  });
  assert.equal(retry.score, 6);
  assert.equal(retry.band, "high");
});

test("background routing never permits Astra and gates Sol", () => {
  delete process.env.ARI_ALLOW_BACKGROUND_SOL;
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-6-astra", reasoning: true }), "gpt-6-luna");
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-6.1-sol", reasoning: false }), "gpt-6-luna");

  process.env.ARI_ALLOW_BACKGROUND_SOL = "true";
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-6.1-sol", reasoning: true }), "gpt-6.1-sol");
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-6-astra", reasoning: true }), "gpt-6-luna");
});

test("oversized owner Sol calls downgrade to Luna before the provider call", () => {
  process.env.ARI_OWNER_MAX_SOL_CALL_USD = "0.01";
  delete process.env.ARI_OWNER_ALLOW_OVERSIZE_SOL;

  const guarded = applyInteractiveCostGuard({
    policy: {
      model: "gpt-6.1-sol",
      accessClass: "owner",
      maxOutputTokens: 2800,
      supportsReasoning: true,
      costTier: "owner_sol_default",
      escalated: false
    },
    instructions: "I".repeat(18000),
    input: [{ role: "user", content: "U".repeat(8000) }]
  });

  assert.equal(guarded.model, "gpt-6-luna");
  assert.equal(guarded.costTier, "owner_luna_budget_guard");
  assert.equal(guarded.costGuard.downgraded, true);
  assert.equal(guarded.routingReason, "sol_per_call_budget_guard");
  assert.equal(guarded.reasoningMode, "standard");
  assert.equal(guarded.reasoningContext, "current_turn");
  assert.equal(guarded.persistReasoning, false);
});

test("oversized Astra calls downgrade to Sol before the provider call", () => {
  process.env.ARI_OWNER_MAX_ASTRA_CALL_USD = "0.02";
  delete process.env.ARI_OWNER_ALLOW_OVERSIZE_ASTRA;

  const guarded = applyInteractiveCostGuard({
    policy: {
      model: "gpt-6-astra",
      fallbackModel: "gpt-6.1-sol",
      accessClass: "owner",
      maxOutputTokens: 2800,
      supportsReasoning: true,
      costTier: "owner_astra_escalation",
      escalated: true
    },
    instructions: "I".repeat(18000),
    input: [{ role: "user", content: "U".repeat(8000) }]
  });

  assert.equal(guarded.model, "gpt-6.1-sol");
  assert.equal(guarded.costTier, "owner_sol_budget_guard");
  assert.equal(guarded.costGuard.downgraded, true);
  assert.equal(guarded.routingReason, "astra_per_call_budget_guard");
});

test("conversation compiler keeps only bounded recent history", () => {
  process.env.ARI_CONTEXT_HISTORY_MESSAGES = "4";
  process.env.ARI_CONTEXT_HISTORY_CHARS = "2400";

  const history = Array.from({ length: 12 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `turn-${index} ${"x".repeat(1200)}`
  }));

  const compiled = compileConversationInput({
    history,
    message: "current question"
  });

  assert.ok(compiled.length <= 5);
  assert.equal(compiled.at(-1).content, "current question");
  assert.equal(compiled.some((item) => item.content.includes("turn-0")), false);
  const historyChars = compiled.slice(0, -1).reduce((sum, item) => sum + item.content.length, 0);
  assert.ok(historyChars <= 2400);
});

test("instruction compiler preserves the beginning and action rules at the tail", () => {
  process.env.ARI_CONTEXT_INSTRUCTION_CHARS = "10000";
  const source =
    "ARI PERSONA\n" +
    "A".repeat(9000) +
    "\nOPTIONAL INTERNAL MATERIAL\n" +
    "B".repeat(9000) +
    "\nACTION RULE\nAlways preserve trusted execution boundaries.";

  const compacted = compactInstructionText(source);
  assert.ok(compacted.length <= 10000);
  assert.match(compacted, /^ARI PERSONA/);
  assert.match(compacted, /ACTION RULE/);
  assert.match(compacted, /COMPACTED FOR COST EFFICIENCY/);

  const telemetry = promptBudgetTelemetry({
    instructions: compacted,
    input: [{ role: "user", content: "hello" }]
  });
  assert.equal(telemetry.version, ARI_COST_ROUTER_VERSION);
  assert.ok(telemetry.estimatedInputTokens < 3000);
});
