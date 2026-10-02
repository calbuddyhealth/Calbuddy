import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ARI_COMPANION_STATE_VERSION,
  companionStateToInstruction,
  deriveCompanionState
} from "../api/_lib/ari-vnext/companion-state.js";
import { deriveRelationshipContinuity } from "../api/_lib/ari-vnext/relationship-continuity.js";
import { resolvePersonalizedCommunicationProfile } from "../api/_lib/ari-vnext/communication-profile.js";

const companionSource = await readFile(
  new URL("../api/_lib/ari-vnext/companion-state.js", import.meta.url),
  "utf8"
);
const orchestratorSource = await readFile(
  new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url),
  "utf8"
);

function establishedRelationship(overrides = {}) {
  return {
    recognizedUser: true,
    familiarity: "established",
    unfinishedThreads: [],
    recentSharedEvents: [],
    ...overrides
  };
}

test("Companion Core is deterministic and introduces no provider call", () => {
  assert.equal(ARI_COMPANION_STATE_VERSION, "2.1.0");
  assert.doesNotMatch(companionSource, /fetch\s*\(/);
  assert.doesNotMatch(companionSource, /OPENAI_|api\.openai\.com|\/v1\/responses/i);
});

test("repair mode suppresses initiative and tells Ari to replace the mistaken interpretation", () => {
  const state = deriveCompanionState({
    turn: { message: "No, that's not what I meant. I meant the owner chat." },
    route: { casualConversation: false },
    safety: { highStakes: false },
    communication: resolvePersonalizedCommunicationProfile({
      preferences: { humor: "frequent", directness: "direct" },
      message: "No, that's not what I meant. I meant the owner chat.",
      safety: { highStakes: false }
    }),
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [{
        id: "thread-1",
        type: "decision",
        priority: "high",
        state: "review_due",
        summary: "Review the owner model routing decision."
      }]
    })
  });

  assert.equal(state.conversationalMode, "repair");
  assert.equal(state.repair.active, true);
  assert.equal(state.repair.replaceInterpretationBeforeAdvancing, true);
  assert.equal(state.repair.invalidateDependentAssumptions, true);
  assert.equal(state.repair.preserveUnaffectedProgress, true);
  assert.equal(state.repair.source, "conversation_repair_friction");
  assert.equal(state.initiative.allowed, false);
  assert.equal(state.responseStyle.humor, "off");
  assert.match(companionStateToInstruction(state), /do not defend the previous answer/i);
});

test("high-stakes turns suppress social initiative even when relationship continuity is strong", () => {
  const state = deriveCompanionState({
    turn: { message: "Help me understand this medication issue." },
    route: { health: true },
    safety: { highStakes: true },
    communication: { humor: "occasional" },
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [{
        id: "thread-1",
        type: "experiment",
        priority: "high",
        state: "review_due",
        summary: "A prior experiment is due for review."
      }]
    })
  });

  assert.equal(state.conversationalMode, "high_stakes_support");
  assert.equal(state.responsePosture, "steady");
  assert.equal(state.initiative.allowed, false);
  assert.equal(state.initiative.reason, "high_stakes");
  assert.equal(state.responseStyle.humor, "off");
});

test("established greetings may surface one genuinely high-priority unfinished thread", () => {
  const state = deriveCompanionState({
    turn: { message: "Hey" },
    route: { casualConversation: true },
    safety: { highStakes: false },
    communication: { humor: "adaptive" },
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [
        {
          id: "low",
          type: "goal_tension",
          priority: "low",
          state: "open",
          summary: "A minor planning tension remains."
        },
        {
          id: "due",
          type: "decision",
          priority: "high",
          state: "prediction_due",
          summary: "The routing change has reached its review point."
        }
      ]
    })
  });

  assert.equal(state.conversationalMode, "casual");
  assert.equal(state.continuity.relevantThread.id, "due");
  assert.equal(state.initiative.allowed, true);
  assert.equal(state.initiative.strength, "light");
  assert.equal(state.continuity.oneNaturalCallbackMaximum, true);
  assert.equal(state.continuity.strength, "established");
  assert.equal(state.initiative.askFollowUpSolelyForEngagement, false);
});

test("explicit Ari Signal engagement is treated as user-invoked, not proactive initiative", () => {
  const state = deriveCompanionState({
    turn: { message: "Tell me about this signal." },
    route: { casualConversation: false },
    safety: { highStakes: false },
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [{
        id: "signal-thread",
        type: "decision",
        priority: "high",
        state: "review_due",
        summary: "A prediction is ready to review."
      }]
    }),
    relevantContext: {
      initiativeContext: { source: "explicit_ari_signal_engagement" }
    }
  });

  assert.equal(state.interaction.userInvokedSignal, true);
  assert.equal(state.initiative.allowed, false);
  assert.equal(state.initiative.userInvoked, true);
  assert.equal(state.initiative.reason, "user_invoked_signal_not_proactive_initiative");
});

test("pending actions are never surfaced as casual companion initiative", () => {
  const state = deriveCompanionState({
    turn: { message: "Hey" },
    route: { casualConversation: true },
    safety: { highStakes: false },
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [{
        id: "pending",
        type: "pending_action",
        priority: "high",
        state: "open",
        summary: "A prior mutation is waiting for confirmation."
      }]
    })
  });

  assert.equal(state.initiative.allowed, false);
  assert.equal(state.continuity.relevantThread, null);
});

test("current topic can activate a relevant unfinished relationship thread without generic engagement behavior", () => {
  const state = deriveCompanionState({
    turn: { message: "What happened with the routing change we were testing?" },
    route: { developer: true, complexity: "standard" },
    safety: { highStakes: false },
    relationshipContinuity: establishedRelationship({
      unfinishedThreads: [{
        id: "routing",
        type: "decision",
        domain: "developer",
        priority: "medium",
        state: "watching",
        summary: "Review the model routing change after observing production behavior."
      }]
    })
  });

  assert.equal(state.continuity.relevantThread.id, "routing");
  assert.equal(state.continuity.shouldReferencePast, true);
  assert.equal(state.initiative.allowed, true);
  assert.equal(state.initiative.reason, "current_turn_relevant_unfinished_thread");
});

test("relationship continuity incorporates cognitive open loops and active communication closure", () => {
  const continuity = deriveRelationshipContinuity({
    userWorldModel: {
      ariCognitiveWorkspace: {
        recurrence: { previousStateLoaded: true },
        continuity: {
          openLoops: [{
            id: "goal_tradeoff:cost-quality",
            type: "goal_tradeoff",
            label: "Balance Ari response quality against provider cost.",
            priority: 0.82
          }]
        },
        communicationClosure: {
          active: true,
          level: 2,
          loop: {
            id: "closure-1",
            level: 2,
            state: "outcome_pending",
            selectedInterpretation: "Confirm whether the new reasoning governor actually reduces cost."
          }
        }
      }
    }
  });

  const cognitive = continuity.unfinishedThreads.find((item) => item.referenceId === "goal_tradeoff:cost-quality");
  const closure = continuity.unfinishedThreads.find((item) => item.referenceId === "closure-1");

  assert.ok(cognitive);
  assert.equal(cognitive.priority, "high");
  assert.equal(cognitive.type, "goal_tradeoff");
  assert.ok(closure);
  assert.equal(closure.type, "communication_closure");
  assert.equal(closure.state, "outcome_pending");
  assert.equal(continuity.recognizedUser, true);
});

test("live orchestrator derives Companion Core and injects its instruction before the model call", () => {
  assert.match(orchestratorSource, /deriveCompanionState\(\{/);
  assert.match(orchestratorSource, /companionStateToInstruction\(companionState\)/);
  assert.match(orchestratorSource, /relationshipContinuity,\\s*instinctKernel,\\s*companionState,\\s*cognitionCoordinator,\\s*deliberationHarness,\\s*goalHierarchy/);
});
