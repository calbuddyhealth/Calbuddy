import assert from "node:assert/strict";
import test from "node:test";

import { deriveBehavioralIdentityControl } from "../api/_lib/ari-vnext/behavioral-identity.js";
import { deriveCognitionCoordinator, cognitionCoordinatorToInstruction } from "../api/_lib/ari-vnext/cognition-coordinator.js";

test("behavioral identity remains evidence but no longer owns a separate prompt authority", () => {
  const behavioralIdentity = deriveBehavioralIdentityControl({
    turn: { message: "What do you think about adding another service?" },
    route: { developer: true },
    context: {}
  });

  const coordinator = deriveCognitionCoordinator({
    route: { developer: true },
    relevantContext: {
      userWorldModel: {
        ariCognitiveWorkspace: {
          behavioralIdentity
        }
      }
    }
  });
  const text = cognitionCoordinatorToInstruction(coordinator);

  assert.match(text, /UNIFIED COGNITION COORDINATOR/);
  assert.ok(coordinator.suppressedLegacyInstructionEmitters.includes("behavioral_identity_instruction"));
  assert.doesNotMatch(text, /ARI BEHAVIORAL IDENTITY CONTROL/);
});
