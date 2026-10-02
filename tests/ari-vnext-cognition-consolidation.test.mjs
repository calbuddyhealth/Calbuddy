import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  ARI_COGNITION_COORDINATOR_VERSION,
  cognitionCoordinatorToInstruction,
  deriveCognitionCoordinator
} from "../api/_lib/ari-vnext/cognition-coordinator.js";

test("unified cognition exposes only four model-facing authorities", () => {
  const state = deriveCognitionCoordinator({
    route: { developer: true, complexity: "deep" },
    relevantContext: {
      userWorldModel: {
        ariCognitiveWorkspace: {
          communicationClosure: {
            loop: {
              id: "closure-1",
              state: "outcome_pending",
              selectedInterpretation: "Verify the repository change before claiming completion."
            }
          },
          beliefSystem: {
            activeGoal: { purpose: "Improve Ari without losing reliability." },
            posture: { mode: "bounded_exploration" },
            principles: [{ id: "reality_final_vote", principle: "Evidence outranks confidence." }]
          },
          behavioralIdentity: {
            active: true,
            activeBehaviors: [{
              id: "measurable_progress",
              instruction: "Prefer verified artifacts over speculation."
            }],
            invariants: [{ id: "truth", rule: "Truth and evidence outrank agreement." }]
          }
        }
      },
      dreaming: {
        insights: [{ summary: "A recurring interaction pattern may deserve review.", confidence: 0.8 }]
      },
      experiences: {
        experiences: [{ learning: "The prior deployment required a second verification pass." }]
      },
      convictionLearning: {
        goals: [{ active: true, title: "Improve Ari's architecture" }]
      }
    }
  });

  assert.equal(ARI_COGNITION_COORDINATOR_VERSION, "1.0.0");
  assert.deepEqual(state.authorities, {
    relationshipBehavior: "companion_core",
    communicationStyle: "communication_profile",
    experimentalCognition: "ari_executive",
    difficultReasoningProcess: "deliberation_harness"
  });
  assert.ok(state.selectedEvidence.length <= 3);
  assert.equal(state.selectedEvidence[0].kind, "communication_closure");
  assert.equal(state.policy.oneExecutiveInstructionAuthority, true);
});

test("casual turns admit at most one cognition evidence source", () => {
  const state = deriveCognitionCoordinator({
    route: { casualConversation: true, complexity: "fast" },
    relevantContext: {
      dreaming: { insights: [{ summary: "A provisional interaction insight." }] },
      experiences: { experiences: [{ learning: "A prior conversational outcome." }] },
      convictionLearning: { goals: [{ title: "A durable goal" }] }
    }
  });

  assert.ok(state.selectedEvidence.length <= 1);
});

test("coordinator makes legacy cognition modules evidence sources rather than independent prompt voices", () => {
  const state = deriveCognitionCoordinator({
    route: { complexity: "standard" },
    relevantContext: {
      userWorldModel: {
        ariCognitiveWorkspace: {
          communicationClosure: {
            loop: {
              id: "closure-2",
              state: "open",
              userRequest: "Finish the current task."
            }
          }
        }
      }
    }
  });
  const instruction = cognitionCoordinatorToInstruction(state);

  assert.match(instruction, /Only four model-facing authorities are active/i);
  assert.match(instruction, /evidence producers, not independent voices/i);
  for (const legacy of [
    "relationship_continuity_instruction",
    "behavioral_identity_instruction",
    "communication_closure_instruction",
    "dreaming_instruction",
    "experience_instruction",
    "conviction_instruction",
    "cognitive_workspace_instruction"
  ]) {
    assert.ok(state.suppressedLegacyInstructionEmitters.includes(legacy), legacy);
  }
});

test("live vNext path no longer injects duplicate relationship or legacy cognition instruction blocks", async () => {
  const [orchestrator, contextRouter, coordinator] = await Promise.all([
    readFile(new URL("../api/_lib/ari-vnext/orchestrator.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/context-router.js", import.meta.url), "utf8"),
    readFile(new URL("../api/_lib/ari-vnext/cognition-coordinator.js", import.meta.url), "utf8")
  ]);

  assert.match(orchestrator, /deriveCognitionCoordinator\(\{/);
  assert.match(orchestrator, /cognitionCoordinatorToInstruction\(cognitionCoordinator\)/);
  assert.doesNotMatch(orchestrator, /relationshipContinuityToInstruction/);

  for (const legacy of [
    "beliefSystemInstruction",
    "behavioralIdentityToInstruction",
    "communicationClosureToInstruction",
    "dreamingContextToInstruction",
    "experienceContextToInstruction",
    "convictionInstruction"
  ]) {
    assert.doesNotMatch(contextRouter, new RegExp(legacy));
  }

  assert.match(contextRouter, /UNIFIED COGNITION EVIDENCE RULES/);
  assert.doesNotMatch(coordinator, /fetch\s*\(/);
  assert.doesNotMatch(coordinator, /OPENAI_|api\.openai\.com|\/v1\/responses/i);
});
