import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  ARI_REASONING_CONTINUITY_VERSION,
  openReasoningContinuityToken,
  publicReasoningContinuity,
  sealReasoningContinuityToken
} from "../api/_lib/ari-vnext/reasoning-continuity.js";

const originalSecret = process.env.ARI_REASONING_CONTINUITY_SECRET;
const originalTtl = process.env.ARI_REASONING_CONTINUITY_TTL_MINUTES;

test.afterEach(() => {
  if (originalSecret === undefined) delete process.env.ARI_REASONING_CONTINUITY_SECRET;
  else process.env.ARI_REASONING_CONTINUITY_SECRET = originalSecret;
  if (originalTtl === undefined) delete process.env.ARI_REASONING_CONTINUITY_TTL_MINUTES;
  else process.env.ARI_REASONING_CONTINUITY_TTL_MINUTES = originalTtl;
});

test("reasoning continuity tokens are encrypted and bound to user plus conversation", () => {
  process.env.ARI_REASONING_CONTINUITY_SECRET = "test-secret-for-reasoning-continuity";
  const token = sealReasoningContinuityToken({
    userId: "user-1",
    conversationId: "conversation-1",
    responseId: "resp_sensitive_123",
    model: "gpt-6.1-sol",
    baselineEffort: "medium",
    effectiveEffort: "high",
    reasoningMode: "standard",
    reasoningContext: "all_turns",
    chainDepth: 4,
    billedInputTokens: 42000
  });

  assert.ok(token?.startsWith("arc1."));
  assert.doesNotMatch(token, /resp_sensitive_123/);

  const opened = openReasoningContinuityToken({
    token,
    userId: "user-1",
    conversationId: "conversation-1"
  });

  assert.equal(opened.valid, true);
  assert.equal(opened.state.version, ARI_REASONING_CONTINUITY_VERSION);
  assert.equal(opened.state.previousResponseId, "resp_sensitive_123");
  assert.equal(opened.state.model, "gpt-6.1-sol");
  assert.equal(opened.state.baselineEffort, "medium");
  assert.equal(opened.state.effectiveEffort, "high");
  assert.equal(opened.state.chainDepth, 4);
  assert.equal(opened.state.billedInputTokens, 42000);

  assert.equal(openReasoningContinuityToken({
    token,
    userId: "user-2",
    conversationId: "conversation-1"
  }).valid, false);

  assert.equal(openReasoningContinuityToken({
    token,
    userId: "user-1",
    conversationId: "conversation-2"
  }).valid, false);
});

test("reasoning continuity tokens expire fail-closed", () => {
  process.env.ARI_REASONING_CONTINUITY_SECRET = "test-secret-for-reasoning-continuity";
  process.env.ARI_REASONING_CONTINUITY_TTL_MINUTES = "10";
  const createdAt = Date.now();
  const token = sealReasoningContinuityToken({
    userId: "user-1",
    conversationId: "conversation-1",
    responseId: "resp_1",
    model: "gpt-6.1-sol",
    baselineEffort: "low",
    effectiveEffort: "low"
  });

  const opened = openReasoningContinuityToken({
    token,
    userId: "user-1",
    conversationId: "conversation-1",
    now: createdAt + 11 * 60_000
  });
  assert.equal(opened.valid, false);
  assert.equal(opened.reason, "expired");
});

test("public continuity state never exposes hidden reasoning", () => {
  const state = publicReasoningContinuity({
    token: "arc1.test",
    resumed: true,
    policy: {
      model: "gpt-6.1-sol",
      reasoningMode: "standard",
      reasoningContext: "all_turns",
      reasoningEffort: "high"
    },
    provider: { model: "gpt-6.1-sol" }
  });

  assert.equal(state.active, true);
  assert.equal(state.resumed, true);
  assert.equal(state.hiddenReasoningExposed, false);
});

test("live provider path uses stored response chaining and effort configuration updates", async () => {
  const orchestrator = await readFile(
    new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
    "utf8"
  );
  const api = await readFile(
    new URL("../api/ari-vnext.js", import.meta.url),
    "utf8"
  );
  const bridge = await readFile(
    new URL("../ari/vnext/ari-vnext-bridge.js", import.meta.url),
    "utf8"
  );

  assert.match(orchestrator, /previous_response_id/);
  assert.match(orchestrator, /type:\s*"configuration_update"/);
  assert.match(orchestrator, /store:\s*policy\?\.persistReasoning === true/);
  assert.match(orchestrator, /context:\s*policy\.reasoningContext/);
  assert.match(orchestrator, /ARI_REASONING_CONTINUITY_MAX_CHAIN_DEPTH/);
  assert.match(orchestrator, /ARI_REASONING_CONTINUITY_MAX_BILLED_INPUT_TOKENS/);
  assert.match(orchestrator, /provider_rejected_continuation/);
  assert.match(api, /openReasoningContinuityToken/);
  assert.match(api, /sealReasoningContinuityToken/);
  const continuity = await readFile(
    new URL("../api/_lib/ari-vnext/reasoning-continuity.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(continuity, /ARI_PROVIDER_API_KEY|OPENAI_API_KEY/);
  assert.match(bridge, /sessionStorage\.setItem/);
  assert.match(bridge, /reasoningContinuityToken/);
});


test("step-limit developer responses fail closed for provider reasoning continuity", async () => {
  const orchestrator = await readFile(
    new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
    "utf8"
  );
  const api = await readFile(
    new URL("../api/ari-vnext.js", import.meta.url),
    "utf8"
  );

  assert.match(orchestrator, /continuitySafe:\s*false/);
  assert.match(orchestrator, /unresolved_tool_call_at_step_limit/);
  assert.match(api, /result\?\.provider\?\.continuitySafe !== false/);
});

test("provider continuation resets fresh when a prior response is missing tool output", async () => {
  const orchestrator = await readFile(
    new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
    "utf8"
  );

  assert.match(orchestrator, /no tool output found for function call/);
  assert.match(orchestrator, /provider_rejected_continuation/);
  assert.match(orchestrator, /forceFreshReasoning:\s*true/);
});
