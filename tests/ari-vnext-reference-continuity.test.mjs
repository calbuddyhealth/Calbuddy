import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferencePacket,
  isReferenceFollowUp,
  REFERENCE_CONTEXT_VERSION
} from "../api/_lib/ari-vnext/reference-context.js";
import {
  buildRelevantContext,
  contextToText,
  routeContext
} from "../api/_lib/ari-vnext/context-router.js";
import { reviewDeterministicRoutineLogIntent } from "../api/_lib/ari-vnext/action-intent-verifier.js";

function potatoTurn(message = "Can you log them for me?") {
  return {
    message,
    surface: "home",
    history: [
      { role: "user", content: "How many calories are in five small red potatoes?" },
      {
        role: "assistant",
        content: "Five small red potatoes are roughly 300 calories total, depending on size."
      }
    ],
    context: {}
  };
}

test("referential meal log inherits Nutrition route without granting permission from history", () => {
  const turn = potatoTurn();
  const route = routeContext(turn);

  assert.equal(route.followUp, true);
  assert.equal(route.nutrition, true);
  assert.equal(route.training, false);

  const relevant = buildRelevantContext(turn, route);
  assert.equal(relevant.referencePacket?.version, REFERENCE_CONTEXT_VERSION);
  assert.equal(relevant.referencePacket?.active, true);
  assert.equal(relevant.referencePacket?.policy?.currentTurnAuthorizesMutation, true);
  assert.equal(relevant.referencePacket?.policy?.historyNeverGrantsWritePermission, true);
  assert.match(relevant.referencePacket?.candidates?.[0]?.text || "", /red potatoes/i);
  assert.ok(relevant.referencePacket?.candidates?.[0]?.referenceId?.startsWith("ref_turn_"));

  const promptContext = contextToText(relevant);
  assert.match(promptContext, /REFERENCE RESOLUTION RULES/);
  assert.match(promptContext, /CURRENT user message alone determines whether a mutation is authorized/);
  assert.match(promptContext, /it, them, that, those, this/);
});

test("direct referential log remains on the deterministic no-extra-model verifier path", () => {
  const turn = potatoTurn();
  const route = routeContext(turn);
  const review = reviewDeterministicRoutineLogIntent({
    turn,
    route,
    functionCall: { name: "propose_log_meal" },
    availableTools: ["propose_log_meal"]
  });

  assert.equal(review?.decision, "propose_log_meal");
  assert.equal(review?.confidence, 1);
  assert.equal(review?.source, "deterministic_routine_log");
});

test("a food statement with a pronoun still does not authorize logging", () => {
  const turn = potatoTurn("I ate them.");
  const route = routeContext(turn);
  const review = reviewDeterministicRoutineLogIntent({
    turn,
    route,
    functionCall: { name: "propose_log_meal" },
    availableTools: ["propose_log_meal"]
  });

  assert.equal(route.followUp, true);
  assert.equal(route.nutrition, true);
  assert.equal(review, null);
});

test("reference routing works across Training and Goals, not only Nutrition", () => {
  const trainingTurn = {
    message: "Make it harder.",
    history: [
      { role: "user", content: "Build me a chest workout for Tuesday." },
      { role: "assistant", content: "Tuesday chest workout: bench press, incline dumbbell press, and cable flyes." }
    ],
    context: {}
  };
  const trainingRoute = routeContext(trainingTurn);
  const trainingPacket = buildReferencePacket(trainingTurn, trainingRoute);

  assert.equal(trainingRoute.followUp, true);
  assert.equal(trainingRoute.training, true);
  assert.ok(trainingPacket?.candidates?.some((candidate) => candidate.domains.includes("training")));

  const goalTurn = {
    message: "Actually make that 180.",
    history: [
      { role: "user", content: "Set my target weight to 185 pounds." },
      { role: "assistant", content: "I can prepare your target weight change to 185 lb for confirmation." }
    ],
    context: {}
  };
  const goalRoute = routeContext(goalTurn);

  assert.equal(goalRoute.followUp, true);
  assert.equal(goalRoute.goals, true);
});

test("standalone turns do not pay the reference-packet prompt cost", () => {
  const turn = {
    message: "How many calories are in an egg?",
    history: [
      { role: "user", content: "Tell me about running shoes." },
      { role: "assistant", content: "What kind of running do you do?" }
    ],
    context: {}
  };
  const route = routeContext(turn);

  assert.equal(isReferenceFollowUp(turn.message), false);
  assert.equal(buildReferencePacket(turn, route), null);
  assert.equal(buildRelevantContext(turn, route).referencePacket, undefined);
});

test("reference packet stays bounded even with long recent conversation", () => {
  const history = [];
  for (let index = 0; index < 16; index += 1) {
    history.push({
      role: index % 2 ? "assistant" : "user",
      content: `${index} ${"training meal goal context ".repeat(120)}`
    });
  }

  const turn = { message: "Use that.", history, context: {} };
  const route = routeContext(turn);
  const packet = buildReferencePacket(turn, route);

  assert.equal(packet?.active, true);
  assert.ok((packet?.candidates?.length || 0) <= 8);
  assert.ok(JSON.stringify(packet).length <= 6200);
});
