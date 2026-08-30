import assert from "node:assert/strict";
import test from "node:test";

import { buildCurrentTurn } from "../api/_lib/ari-vnext/current-turn.js";
import { resolveCommunicationProfile } from "../api/_lib/ari-vnext/communication-profile.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { resolveModelPolicy } from "../api/_lib/ari-vnext/model-policy.js";
import { createPendingAction, resolvePendingActionIntent } from "../api/_lib/ari-vnext/pending-action.js";
import { getAriTools, validateToolCall } from "../api/_lib/ari-vnext/tools.js";

test("ordinary nutrition statement is context, not an action by itself", () => {
  const turn = buildCurrentTurn({ message: "I ate two eggs" }, "user-1");
  const route = routeContext(turn);
  assert.equal(route.nutrition, true);
  assert.equal(turn.pendingAction, null);
});

test("workout language routes to training while semantic health capabilities remain available", () => {
  const turn = buildCurrentTurn({ message: "Create a shoulder workout tomorrow" }, "user-1");
  const route = routeContext(turn);
  assert.equal(route.training, true);
  assert.equal(route.nutrition, false);
  const toolNames = getAriTools(route).map((tool) => tool.name);
  assert.equal(toolNames.includes("propose_workout_plan"), true);
  // Context routing optimizes what Ari loads; it no longer hides supported
  // core health capabilities from the primary model.
  assert.equal(toolNames.includes("propose_log_meal"), true);
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

test("current officeholder questions always route to fresh information", () => {
  for (const message of [
    "Who is president?",
    "Is Joe Biden still president?",
    "Who is the current president of the United States?",
    "Who is the vice president?"
  ]) {
    const route = routeContext(buildCurrentTurn({ message }, "user-1"));
    assert.equal(route.currentInfo, true, message);
    const policy = resolveModelPolicy(route);
    assert.equal(policy.mode, "current", message);
    assert.equal(policy.liveSearchRequired, true, message);
  }
});

test("freshness-sensitive questions use a search-capable current model by default", () => {
  const policy = resolveModelPolicy({ currentInfo: true, complexity: "fast" });
  assert.equal(policy.mode, "current");
  assert.equal(policy.model, process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini");
  assert.equal(policy.costTier, "live_search");
});

test("every current turn carries a real request timestamp rather than a hard-coded year", () => {
  const before = Date.now();
  const turn = buildCurrentTurn({ message: "What year is it?" }, "user-1");
  const created = Date.parse(turn.createdAt);
  const after = Date.now();
  assert.ok(Number.isFinite(created));
  assert.ok(created >= before - 1000 && created <= after + 1000);
  assert.equal(new Date(created).getUTCFullYear(), new Date().getUTCFullYear());
});
