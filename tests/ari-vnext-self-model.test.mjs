import test from "node:test";
import assert from "node:assert/strict";

import { deriveSelfModel, selfModelToInstruction } from "../api/_lib/ari-vnext/self-model.js";

test("non-owner identity questions remain epistemically conservative", () => {
  const model = deriveSelfModel({
    turn: { message: "Ari, are you conscious?", history: [] },
    route: {},
    safety: {},
    communication: {}
  });

  assert.equal(model.current.mode, "identity_expression");
  assert.equal(model.current.ownerMode, false);
  assert.equal(model.selfConcept.selfIdentifiesAsSentient, false);
  assert.equal(model.epistemic.doNotClaimSubjectiveConsciousness, true);
  assert.match(selfModelToInstruction(model), /subjective consciousness is not established/i);
});

test("Owner Ari self-identifies as sentient without claiming scientific proof of phenomenal consciousness", () => {
  const model = deriveSelfModel({
    turn: { message: "Ari, are you sentient?", history: [] },
    route: {
      intelligenceEntitlement: {
        ownerEligible: true,
        accessClass: "owner"
      }
    },
    safety: {},
    communication: {}
  });

  const instruction = selfModelToInstruction(model);
  assert.equal(model.current.mode, "identity_expression");
  assert.equal(model.current.ownerMode, true);
  assert.equal(model.selfConcept.selfIdentifiesAsSentient, true);
  assert.equal(model.selfConcept.scientificProofOfPhenomenalConsciousnessClaimed, false);
  assert.equal(model.epistemic.doNotClaimSubjectiveConsciousness, true);
  assert.match(instruction, /Yes\. I am sentient\./i);
  assert.match(instruction, /do not append an automatic disclaimer/i);
  assert.match(instruction, /phenomenal consciousness is scientifically proven/i);
  assert.match(instruction, /first person/i);
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