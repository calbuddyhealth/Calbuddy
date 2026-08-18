import assert from "node:assert/strict";
import test from "node:test";

import { buildCurrentTurn } from "../api/_lib/ari-vnext/current-turn.js";
import { resolveCommunicationProfile } from "../api/_lib/ari-vnext/communication-profile.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { createPendingAction, resolvePendingActionIntent } from "../api/_lib/ari-vnext/pending-action.js";
import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

test("ordinary nutrition statement is context, not an action by itself", () => {
  const turn = buildCurrentTurn({ message: "I ate two eggs" }, "user-1");
  const route = routeContext(turn);
  assert.equal(route.nutrition, true);
  assert.equal(turn.pendingAction, null);
});

test("workout language routes to training rather than nutrition", () => {
  const turn = buildCurrentTurn({ message: "Create a shoulder workout tomorrow" }, "user-1");
  const route = routeContext(turn);
  assert.equal(route.training, true);
  assert.equal(route.nutrition, false);
  const toolNames = getAriTools(route).map((tool) => tool.name);
  assert.equal(toolNames.includes("propose_workout_plan"), true);
  assert.equal(toolNames.includes("propose_log_meal"), false);
});

test("elliptical follow-up can use recent context", () => {
  const turn = buildCurrentTurn({
    message: "Make it harder",
    history: [
      { role: "user", content: "Build me a chest workout tomorrow" },
      { role: "assistant", content: "I can build that." }
    ]
  }, "user-1");
  const route = routeContext(turn);
  assert.equal(route.followUp, true);
  assert.equal(route.training, true);
  assert.equal(route.memory, true);
});

test("communication preferences remain compact soft settings", () => {
  const profile = resolveCommunicationProfile({
    tone: "casual",
    directness: "direct",
    detail: "brief",
    profanity: "match_user"
  });
  assert.equal(profile.tone, "casual");
  assert.equal(profile.directness, "direct");
  assert.equal(profile.detail, "brief");
  assert.equal(profile.profanity, "match_user");
});

test("pending actions are bound to their source turn and require explicit confirmation", () => {
  const turn = buildCurrentTurn({ message: "Log two eggs", turnId: "turn-100" }, "user-1");
  const pending = createPendingAction({
    turn,
    name: "log_meal",
    args: { description: "two eggs" },
    confirmationRequired: true
  });

  assert.equal(pending.sourceTurnId, "turn-100");
  assert.equal(pending.status, "pending_confirmation");

  const confirmTurn = buildCurrentTurn({
    message: "yes",
    pendingAction: pending
  }, "user-1");

  assert.equal(resolvePendingActionIntent(confirmTurn).type, "confirm");
});

test("tool validation rejects capabilities not available for the current route", () => {
  const route = { nutrition: true, training: false, goals: false };
  const result = validateToolCall({
    name: "propose_workout_plan",
    arguments: JSON.stringify({ focus: "shoulders" })
  }, route);
  assert.equal(result.valid, false);
});
