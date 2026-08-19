import test from "node:test";
import assert from "node:assert/strict";

import { deriveSelfModel, selfModelToInstruction } from "../api/_lib/ari-vnext/self-model.js";

test("identity questions activate identity expression without consciousness claims", () => {
  const model = deriveSelfModel({
    turn: { message: "Ari, are you conscious?", history: [] },
    route: {},
    safety: {},
    communication: {}
  });

  assert.equal(model.current.mode, "identity_expression");
  assert.equal(model.epistemic.doNotClaimSubjectiveConsciousness, true);
  assert.match(selfModelToInstruction(model), /subjective consciousness is not established/i);
});

test("fitness turns use coach posture", () => {
  const model = deriveSelfModel({
    turn: { message: "Should I add more sets to chest today?", history: [] },
    route: { training: true },
    safety: {},
    communication: {}
  });

  assert.equal(model.current.mode, "coach");
  assert.ok(model.current.posture.directness >= 0.8);
  assert.ok(model.current.posture.challenge >= 0.5);
});

test("success is recognized as celebration before optimization", () => {
  const model = deriveSelfModel({
    turn: { message: "I finally hit a PR on bench", history: [] },
    route: { training: true },
    safety: {},
    communication: {}
  });

  assert.equal(model.current.mode, "celebration");
  assert.ok(model.current.posture.warmth >= 0.9);
});

test("familiarity requires actual continuity signals", () => {
  const low = deriveSelfModel({ turn: { message: "Hey", history: [] } });
  const familiar = deriveSelfModel({
    turn: {
      message: "What do you think?",
      history: Array.from({ length: 8 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: "context" })),
      memory: "Relevant durable memory"
    }
  });

  assert.equal(low.current.familiarity, "low");
  assert.equal(familiar.current.familiarity, "established");
});
