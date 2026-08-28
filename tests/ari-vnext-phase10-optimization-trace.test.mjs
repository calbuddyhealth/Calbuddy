import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyOpenAIRequest,
  markCompoundFanout,
  OPTIMIZATION_TRACE_VERSION,
  recordOptimizationCall,
  summarizeOptimizationTrace,
  withOptimizationTrace
} from "../api/_lib/ari-vnext/optimization-trace.js";

test("Phase 10A classifies Ari model-call stages without inspecting prompt content", () => {
  assert.equal(classifyOpenAIRequest({ model: "fast" }), "primary");
  assert.equal(classifyOpenAIRequest({
    tools: [{ type: "function", name: "verify_action_intent" }]
  }), "semantic_verifier");
  assert.equal(classifyOpenAIRequest({ instructions: "TOOL ARGUMENT CORRECTION\nfix it" }), "tool_repair");
  assert.equal(classifyOpenAIRequest({
    input: [{ type: "function_call_output", call_id: "call_1", output: "{}" }]
  }), "confirmation_continuation");
  assert.equal(classifyOpenAIRequest({
    tool_choice: { type: "function", name: "propose_log_meal" }
  }), "forced_tool");
});

test("Phase 10A aggregates calls, latency, usage and compound fanout per turn", async () => {
  const result = await withOptimizationTrace({ turnId: "turn_phase10_a" }, async (trace) => {
    markCompoundFanout(trace, 3);
    recordOptimizationCall(trace, {
      stage: "primary",
      model: "model-a",
      latencyMs: 120,
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        total_tokens: 120,
        input_tokens_details: { cached_tokens: 40 }
      }
    });
    recordOptimizationCall(trace, {
      stage: "semantic_verifier",
      model: "model-b",
      latencyMs: 30,
      usage: { input_tokens: 30, output_tokens: 5, total_tokens: 35 }
    });
    return summarizeOptimizationTrace(trace);
  });

  assert.equal(result.version, OPTIMIZATION_TRACE_VERSION);
  assert.equal(result.callCount, 2);
  assert.equal(result.failedCallCount, 0);
  assert.equal(result.compoundClauseCount, 3);
  assert.equal(result.modelLatencyMs, 150);
  assert.equal(result.stageCounts.primary, 1);
  assert.equal(result.stageCounts.semantic_verifier, 1);
  assert.equal(result.modelCounts["model-a"], 1);
  assert.equal(result.modelCounts["model-b"], 1);
  assert.equal(result.usage.input_tokens, 130);
  assert.equal(result.usage.output_tokens, 25);
  assert.equal(result.usage.total_tokens, 155);
  assert.equal(result.usage.input_tokens_details.cached_tokens, 40);
  assert.equal(result.costEstimate.usd, null);
});

test("Phase 10A counts provider failures without losing successful usage", async () => {
  const result = await withOptimizationTrace({ turnId: "turn_phase10_failure" }, async (trace) => {
    recordOptimizationCall(trace, {
      stage: "primary",
      model: "model-a",
      status: "provider_error",
      httpStatus: 500,
      latencyMs: 10
    });
    recordOptimizationCall(trace, {
      stage: "forced_tool",
      model: "model-a",
      status: "completed",
      latencyMs: 20,
      usage: { input_tokens: 40, output_tokens: 10, total_tokens: 50 }
    });
    return summarizeOptimizationTrace(trace);
  });

  assert.equal(result.callCount, 2);
  assert.equal(result.failedCallCount, 1);
  assert.equal(result.usage.total_tokens, 50);
});

test("Phase 10A pricing remains configuration-driven rather than hard-coded", async () => {
  const previous = process.env.ARI_PHASE10_MODEL_PRICING_JSON;
  process.env.ARI_PHASE10_MODEL_PRICING_JSON = JSON.stringify({
    "model-priced": { inputPer1M: 2, cachedInputPer1M: 0.5, outputPer1M: 8 }
  });

  try {
    const result = await withOptimizationTrace({ turnId: "turn_phase10_cost" }, async (trace) => {
      recordOptimizationCall(trace, {
        stage: "primary",
        model: "model-priced",
        usage: {
          input_tokens: 1000,
          output_tokens: 100,
          input_tokens_details: { cached_tokens: 200 }
        }
      });
      return summarizeOptimizationTrace(trace);
    });

    assert.equal(result.costEstimate.source, "configured_model_rates");
    assert.equal(result.costEstimate.pricedCalls, 1);
    assert.equal(result.costEstimate.usd, 0.0025);
  } finally {
    if (previous === undefined) delete process.env.ARI_PHASE10_MODEL_PRICING_JSON;
    else process.env.ARI_PHASE10_MODEL_PRICING_JSON = previous;
  }
});
