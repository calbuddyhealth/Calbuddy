import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_COST_ROUTER_VERSION,
  compactInstructionText,
  compileConversationInput,
  promptBudgetTelemetry,
  resolveBackgroundModel,
  resolveOwnerInteractiveModel
} from "../api/_lib/ari-vnext/cost-router.js";

const ORIGINAL_ENV = {
  ARI_ALLOW_BACKGROUND_SOL: process.env.ARI_ALLOW_BACKGROUND_SOL,
  ARI_OWNER_FORCE_TERRA: process.env.ARI_OWNER_FORCE_TERRA,
  OPENAI_ARI_OWNER_DEFAULT_MODEL: process.env.OPENAI_ARI_OWNER_DEFAULT_MODEL,
  OPENAI_ARI_OWNER_DEEP_MODEL: process.env.OPENAI_ARI_OWNER_DEEP_MODEL,
  OPENAI_ARI_OWNER_MODEL: process.env.OPENAI_ARI_OWNER_MODEL,
  OPENAI_ARI_ADVANCED_MODEL: process.env.OPENAI_ARI_ADVANCED_MODEL,
  ARI_CONTEXT_HISTORY_MESSAGES: process.env.ARI_CONTEXT_HISTORY_MESSAGES,
  ARI_CONTEXT_HISTORY_CHARS: process.env.ARI_CONTEXT_HISTORY_CHARS,
  ARI_CONTEXT_INSTRUCTION_CHARS: process.env.ARI_CONTEXT_INSTRUCTION_CHARS
};

test.afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("owner routing defaults to Terra and only escalates deep work to Sol", () => {
  delete process.env.OPENAI_ARI_OWNER_DEFAULT_MODEL;
  delete process.env.OPENAI_ARI_OWNER_DEEP_MODEL;
  delete process.env.OPENAI_ARI_OWNER_MODEL;
  delete process.env.OPENAI_ARI_ADVANCED_MODEL;
  delete process.env.ARI_OWNER_FORCE_TERRA;

  const ordinary = resolveOwnerInteractiveModel({
    mode: "standard",
    route: { complexity: "standard" },
    reasoningProfile: "adaptive"
  });
  assert.equal(ordinary.model, "gpt-5.6-terra");
  assert.equal(ordinary.escalated, false);

  const deep = resolveOwnerInteractiveModel({
    mode: "deep",
    route: { complexity: "deep" },
    reasoningProfile: "adaptive"
  });
  assert.equal(deep.model, "gpt-5.6-sol");
  assert.equal(deep.escalated, true);
});

test("background Sol is downgraded unless explicitly enabled", () => {
  delete process.env.ARI_ALLOW_BACKGROUND_SOL;
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-5.6-sol", reasoning: false }), "gpt-5.6-luna");
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-5.6", reasoning: true }), "gpt-5.6-terra");

  process.env.ARI_ALLOW_BACKGROUND_SOL = "true";
  assert.equal(resolveBackgroundModel({ requestedModel: "gpt-5.6-sol", reasoning: true }), "gpt-5.6-sol");
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
