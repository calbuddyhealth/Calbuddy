import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCommunicationExposure,
  summarizeCommunicationLearning
} from "../api/_lib/ari-vnext/communication-outcomes.js";
import {
  durableMemoryCandidate,
  memoryCategoryForCandidate
} from "../api/_lib/ari-vnext/continuity-service.js";
import {
  fingerprintFor,
  overlayGrowthFixState,
  shouldReopenVerifiedFix,
  validateGrowthVerification
} from "../api/_lib/ari-vnext/growth-fixes.js";
import { deriveGoalHierarchy } from "../api/_lib/ari-vnext/goal-hierarchy.js";
import { filterMemoryResultForPrivacy } from "../api/_lib/ari-vnext/memory-service.js";
import { deriveUserWorldModel } from "../api/_lib/ari-vnext/user-world-model.js";

function trainingState(adherence = 0.8) {
  return {
    weight: { available: false },
    training: {
      adherence: { rate: adherence, plannedCount: 10, completedCount: Math.round(adherence * 10) },
      progression: { upCount: 1, stableCount: 2, downCount: 1, plateauCandidateCount: 0 }
    },
    nutrition: { loggedDayCount: 5 }
  };
}

test("explicit goal priority wins even when another goal appears later in the sentence", () => {
  const hierarchy = deriveGoalHierarchy({
    turn: { message: "My main priority is strength, but I also want to lose weight." },
    userWorldModel: { goals: { stated: [], current: {} }, constraints: { items: [] }, behavior: {} },
    coachingState: { goal: "lose" },
    longitudinalState: trainingState(0.9)
  });

  assert.equal(hierarchy.primary.id, "strength");
  assert.equal(hierarchy.explicitPriority, true);
  assert.ok(hierarchy.tradeoffs.some((item) => item.id === "fat_loss_speed_vs_strength_preservation"));
});

test("low adherence creates a plan ambition tradeoff when consistency matters", () => {
  const hierarchy = deriveGoalHierarchy({
    turn: { message: "My main goal is consistency, but I still want to get stronger." },
    userWorldModel: { goals: { stated: [], current: {} }, constraints: { items: [] }, behavior: { trainingAdherence: 0.5 } },
    coachingState: { goal: "maintain" },
    longitudinalState: trainingState(0.5)
  });

  assert.equal(hierarchy.primary.id, "consistency");
  assert.ok(hierarchy.tradeoffs.some((item) => item.id === "plan_ambition_vs_realistic_adherence"));
});

test("communication learning requires enough repeated outcome evidence before adapting", () => {
  const sparse = summarizeCommunicationLearning([
    { status: "resolved", strategyKey: "direct", strategy: { directness: "direct", detail: "concise", realizedReplyLength: "brief" }, outcomeDirection: "positive", associationConfidence: 0.6 },
    { status: "resolved", strategyKey: "direct", strategy: { directness: "direct", detail: "concise", realizedReplyLength: "brief" }, outcomeDirection: "positive", associationConfidence: 0.6 }
  ]);
  assert.equal(sparse.preferredAssociation, null);

  const enough = summarizeCommunicationLearning([
    ...Array.from({ length: 3 }, () => ({ status: "resolved", strategyKey: "direct", strategy: { directness: "direct", detail: "concise", realizedReplyLength: "brief" }, outcomeDirection: "positive", associationConfidence: 0.6 })),
    ...Array.from({ length: 3 }, () => ({ status: "resolved", strategyKey: "long", strategy: { directness: "balanced", detail: "thorough", realizedReplyLength: "detailed" }, outcomeDirection: "negative", associationConfidence: 0.6 }))
  ]);
  assert.equal(enough.preferredAssociation.strategyKey, "direct");
  assert.equal(enough.avoidAssociation.strategyKey, "long");
  assert.equal(enough.causalClaimAllowed, false);
  assert.equal(enough.explicitUserPreferenceAlwaysWins, true);
});

test("communication exposure journals meaningful fitness guidance but not empty chatter", () => {
  const exposure = buildCommunicationExposure({
    turnId: "turn-1",
    route: { training: true },
    result: {
      reply: "Your adherence is the main issue. Keep the program stable this week and complete the planned sessions.",
      communication: { tone: "warm", directness: "direct", detail: "concise", complexity: "plain" },
      selfModel: { current: { mode: "honest_accountability" } },
      scientificIntelligence: { hypotheses: [{ id: "execution_gap", score: 0.72 }] },
      longitudinalState: trainingState(0.5)
    }
  });
  assert.ok(exposure);
  assert.match(exposure.strategyKey, /direct=direct/);
  assert.equal(exposure.baseline.trainingAdherence, 0.5);

  const casual = buildCommunicationExposure({
    turnId: "turn-2",
    route: {},
    result: { reply: "Hey.", scientificIntelligence: { hypotheses: [] } }
  });
  assert.equal(casual, null);
});

test("privacy filtering removes blocked durable-memory categories before model use", () => {
  const result = {
    memories: [
      { id: "1", memoryType: "preference", topic: "preference", content: "User likes short replies." },
      { id: "2", memoryType: "goal", topic: "goal", content: "User wants to lose weight." },
      { id: "3", memoryType: "peer_reflection", topic: "ari_reflection_training", content: "Ari should verify adherence first." }
    ],
    summary: "old"
  };
  const filtered = filterMemoryResultForPrivacy(result, { blockedCategories: ["preferences", "goals"] });
  assert.deepEqual(filtered.memories.map((item) => item.id), ["3"]);
  assert.doesNotMatch(filtered.summary, /short replies|lose weight/i);
});

test("blocked world-model categories cannot be reconstructed from current context or memory", () => {
  const model = deriveUserWorldModel({
    persisted: {
      privacyControls: { blockedCategories: ["goals"] },
      goals: { stated: ["Old goal"], current: { goalType: "lose" } },
      preferences: { items: ["User likes concise replies"] },
      behavior: { trainingAdherence: 0.7 }
    },
    turn: { message: "My goal is to lose 20 pounds." },
    context: {
      goals: { goalType: "lose", target: 170 },
      relevantMemory: "User's stated goal is to lose 20 pounds.\nUser likes concise replies."
    },
    communication: { detail: "concise", directness: "direct", tone: "warm" },
    selfModel: { relationship: { familiarity: "established" }, current: { mode: "collaborative_partner" } },
    coachingState: { goal: "lose" },
    longitudinalState: trainingState(0.7)
  });

  assert.deepEqual(model.goals, { stated: [], current: {} });
  assert.deepEqual(model.privacyControls.blockedCategories, ["goals"]);
  assert.ok(model.preferences.items.some((item) => /concise/i.test(item)));
});

test("durable memory candidates map to the same privacy categories used by storage", () => {
  const preference = durableMemoryCandidate("I prefer Ari to keep answers concise.");
  const goal = durableMemoryCandidate("My main goal is lose 15 pounds.");
  const outcome = durableMemoryCandidate("That worked. I'm getting stronger.", {
    route: { training: true },
    history: [{ role: "assistant", content: "Keep the program stable and improve adherence." }]
  });

  assert.equal(memoryCategoryForCandidate(preference), "preferences");
  assert.equal(memoryCategoryForCandidate(goal), "goals");
  assert.equal(memoryCategoryForCandidate(outcome), "fitness_outcomes");
});

test("Verified Fixed requires reproducible regression evidence rather than a status click", () => {
  const weak = validateGrowthVerification({
    regressionTestId: "ari-vnext-growth-context",
    fixCommitSha: "abc123",
    verification: { deterministicPasses: 1, scenarioReproduced: true, noRegressionObserved: true }
  });
  assert.equal(weak.valid, false);

  const strong = validateGrowthVerification({
    regressionTestId: "ari-vnext-growth-context",
    fixCommitSha: "abc123",
    verification: { deterministicPasses: 2, scenarioReproduced: true, noRegressionObserved: true }
  });
  assert.equal(strong.valid, true);
});

test("a new matching peer reflection reopens a previously verified fix", () => {
  const previous = { status: "verified_fixed", verifiedAt: "2026-08-10T12:00:00.000Z" };
  assert.equal(shouldReopenVerifiedFix({ previous, newestReflectionAt: Date.parse("2026-08-11T12:00:00.000Z") }), true);
  assert.equal(shouldReopenVerifiedFix({ previous, newestReflectionAt: Date.parse("2026-08-09T12:00:00.000Z") }), false);
});

test("Growth Inbox overlay keeps one issue fingerprint and surfaces verified state", () => {
  const item = { id: "r1", level: "help_ari", area: "context_memory", issueKey: "stale_context", takeaway: "Ari used stale context." };
  const fingerprint = fingerprintFor(item);
  const overlaid = overlayGrowthFixState({ version: "1", summary: { total: 1 }, items: [item] }, [{
    fingerprint,
    area: item.area,
    issueKey: item.issueKey,
    status: "verified_fixed",
    regressionTestId: "ari-vnext-growth-context-memory-stale-context",
    fixCommitSha: "abc123",
    verification: { deterministicPasses: 2 },
    verifiedAt: "2026-08-10T12:00:00.000Z"
  }]);

  assert.equal(overlaid.items[0].verifiedFixed, true);
  assert.equal(overlaid.summary.verifiedFixed, 1);
  assert.equal(overlaid.summary.fixCandidates, 0);
});
