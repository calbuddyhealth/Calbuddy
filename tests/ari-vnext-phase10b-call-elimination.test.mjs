import assert from "node:assert/strict";
import test from "node:test";

import {
  reviewDeterministicDirectMutation,
  reviewDeterministicRoutineLogIntent
} from "../api/_lib/ari-vnext/action-intent-verifier.js";
import {
  extractConfirmationToolResult,
  maybeOptimizeModelCall,
  MODEL_CALL_OPTIMIZER_VERSION
} from "../api/_lib/ari-vnext/model-call-optimizer.js";

test("Phase 10B deterministically authorizes bounded direct create/plan/set commands", () => {
  const result = reviewDeterministicDirectMutation({
    turn: { message: "Please plan a chest workout for me." },
    tools: [{ type: "function", name: "propose_plan_workout" }],
    functionCall: { name: "propose_plan_workout" }
  });

  assert.equal(result?.decision, "propose_plan_workout");
  assert.equal(result?.confidence, 1);
  assert.equal(result?.model, null);
  assert.equal(result?.source, "deterministic_direct_mutation");
});

test("Phase 10B direct authorization refuses advice phrasing and reference-dependent language", () => {
  const tools = [{ type: "function", name: "propose_plan_workout" }];

  assert.equal(reviewDeterministicDirectMutation({
    turn: { message: "How do I plan a workout?" },
    tools,
    functionCall: { name: "propose_plan_workout" }
  }), null);

  assert.equal(reviewDeterministicDirectMutation({
    turn: { message: "Plan that workout for me." },
    tools,
    functionCall: { name: "propose_plan_workout" }
  }), null);
});

test("Phase 10B does not bypass verifier for Meal Plan future-date boundaries", () => {
  const result = reviewDeterministicDirectMutation({
    turn: { message: "Plan tomorrow's meals for me." },
    tools: [{ type: "function", name: "propose_today_meal_plan" }],
    functionCall: { name: "propose_today_meal_plan" }
  });
  assert.equal(result, null);
});

test("Phase 10B preserves the mature deterministic routine/reference verifier export", () => {
  const result = reviewDeterministicRoutineLogIntent({
    turn: { message: "Log 185 pounds." },
    route: { goals: true },
    availableTools: ["propose_log_weight"],
    functionCall: { name: "propose_log_weight" }
  });
  assert.equal(result?.decision, "propose_log_weight");
  assert.equal(result?.source, "deterministic_routine_log");
});

test("Phase 10B replaces only a trusted deterministic confirmation paraphrase", async () => {
  const body = {
    model: "model-a",
    input: [
      {
        type: "function_call_output",
        call_id: "call_1",
        output: JSON.stringify({
          status: "confirmation_required",
          pendingActionId: "pending_1",
          applicationAction: "update_nutrition_meal",
          arguments: { referenceId: "ref_live_meal_a" }
        })
      }
    ]
  };
  const trace = {
    calls: [
      {
        stage: "primary",
        status: "completed",
        model: "model-a",
        providerRequestId: "resp_primary",
        usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 }
      }
    ]
  };

  const optimized = maybeOptimizeModelCall({
    stage: "confirmation_continuation",
    body,
    trace
  });

  assert.equal(optimized?.optimized, true);
  assert.equal(optimized?.version, MODEL_CALL_OPTIMIZER_VERSION);
  assert.equal(optimized?.applicationAction, "update_nutrition_meal");

  const payload = await optimized.response.json();
  assert.equal(payload.id, "resp_primary");
  assert.equal(payload.model, "model-a");
  assert.equal(payload.usage.total_tokens, 120);
  assert.match(payload.output_text, /meal correction ready/i);
});

test("Phase 10B preserves model continuation when semantic verifier was required", () => {
  const optimized = maybeOptimizeModelCall({
    stage: "confirmation_continuation",
    body: {
      model: "model-a",
      input: [{
        type: "function_call_output",
        call_id: "call_1",
        output: JSON.stringify({
          status: "confirmation_required",
          pendingActionId: "pending_1",
          applicationAction: "create_circle_meetup"
        })
      }]
    },
    trace: {
      calls: [
        { stage: "primary", status: "completed", model: "model-a" },
        { stage: "semantic_verifier", status: "completed", model: "gpt-4o-mini" }
      ]
    }
  });

  assert.equal(optimized, null);
});

test("Phase 10B refuses to synthesize confirmation without a real pending-action output", () => {
  assert.equal(extractConfirmationToolResult([]), null);
  assert.equal(extractConfirmationToolResult([{ type: "function_call_output", output: "{}" }]), null);
  assert.equal(extractConfirmationToolResult([{
    type: "function_call_output",
    output: JSON.stringify({ status: "done", pendingActionId: "p", applicationAction: "update_goal" })
  }]), null);
});
