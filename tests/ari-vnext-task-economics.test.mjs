import assert from "node:assert/strict";
import test from "node:test";

import { deriveTaskEconomics } from "../api/_lib/ari-vnext/task-economics.js";

test("task economics distinguishes verified actions from fluent unverified delivery", () => {
  const verified = deriveTaskEconomics({
    turn: { turnId: "turn-1", conversationId: "conversation-1" },
    result: {
      success: true,
      action: { type: "log_meal" },
      executionEvidence: { verification: { status: "passed" } },
      provider: { model: "gpt-6-luna", recovery: { attempts: 2, recovered: true } },
      modelPolicy: { costTier: "premium_luna" }
    }
  });
  assert.equal(verified.outcome, "verified_success");
  assert.equal(verified.verifiedSuccess, true);
  assert.equal(verified.providerAttempts, 2);

  const unverified = deriveTaskEconomics({
    turn: { turnId: "turn-2" },
    result: {
      success: true,
      reply: "Done.",
      action: { type: "log_meal" },
      provider: { model: "gpt-6-luna" }
    }
  });
  assert.equal(unverified.outcome, "delivered_unverified");
  assert.equal(unverified.verifiedSuccess, false);
});

test("ordinary conversation is measured separately from verifiable tool episodes", () => {
  const economics = deriveTaskEconomics({
    turn: { turnId: "turn-3" },
    result: {
      success: true,
      reply: "Here is the explanation.",
      provider: { id: "response-1", model: "gpt-6.1-sol" },
      modelPolicy: { costTier: "owner_sol_default" }
    }
  });

  assert.equal(economics.taskClass, "conversation");
  assert.equal(economics.verificationEligible, false);
  assert.equal(economics.outcome, "conversation_delivered");
});
