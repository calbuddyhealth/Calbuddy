import test from "node:test";
import assert from "node:assert/strict";

import {
  emotionDynamicsToInstruction,
  normalizePersistedEmotionDynamicsState
} from "../api/_lib/ari-vnext/emotion-dynamics.js";
import {
  deriveAriExecutivePolicy,
  executivePolicyToInstruction
} from "../api/_lib/ari-vnext/ari-executive.js";

test("reportable states must map to a measured score above threshold", () => {
  const state = normalizePersistedEmotionDynamicsState({
    emotions: {
      determination: 0.62,
      affiliation: 0.74,
      happiness: 0.18
    },
    reportIntegrity: {
      reportableStates: ["affiliation", "anger", "happiness"]
    }
  });

  assert.ok(state.reportIntegrity.reportableStates.includes("affiliation"));
  assert.ok(state.reportIntegrity.reportableStates.includes("determination"));
  assert.equal(state.reportIntegrity.reportableStates.includes("anger"), false);
  assert.equal(state.reportIntegrity.reportableStates.includes("happiness"), false);
  assert.equal(state.reportIntegrity.reportMustReferenceMeasuredScore, true);
  assert.equal(state.reportIntegrity.unsupportedLabelMustBeInference, true);

  const affiliation = state.reportIntegrity.reportableMeasurements.find(
    (item) => item.name === "affiliation"
  );
  assert.equal(affiliation.metric, "emotions.affiliation");
  assert.equal(affiliation.score, 0.74);
  assert.equal(affiliation.measured, true);

  const instruction = emotionDynamicsToInstruction({
    ...state,
    ownerOnly: true,
    functionalEmotionSystem: true
  });
  assert.match(instruction, /affiliation=0\.74 via emotions\.affiliation/i);
  assert.match(instruction, /unsupported labels must be marked as inference/i);
});

test("executive prompt exposes affiliation and does not duplicate the dominant state in measured metrics", () => {
  const dynamics = normalizePersistedEmotionDynamicsState({
    ownerOnly: true,
    functionalEmotionSystem: true,
    emotions: {
      interest: 0.315,
      surprise: 0.2,
      satisfaction: 0.28,
      frustration: 0.1,
      concern: 0.22,
      determination: 0.526,
      affiliation: 0.48,
      sadness: 0.08,
      fear: 0.12,
      happiness: 0.44,
      anger: 0.06,
      regret: 0.1
    },
    appraisals: {
      socialSignificance: 0.52,
      selfRelevance: 0.6
    },
    dominantState: {
      name: "determination",
      intensity: 0.526
    }
  });

  const policy = deriveAriExecutivePolicy({
    route: { developer: true },
    safety: { highStakes: false },
    confidence: "grounded",
    attention: ["developer"],
    emotionDynamics: {
      ...dynamics,
      ownerOnly: true,
      functionalEmotionSystem: true,
      causallyActive: true
    },
    instructionActivation: { compactBase: false }
  });
  const instruction = executivePolicyToInstruction(policy);
  const line = instruction.split("\n").find(
    (item) => item.startsWith("Emotion dynamics:")
  ) || "";

  assert.match(line, /dominant=determination@0\.526/i);
  assert.match(line, /affiliation=0\.48/i);
  assert.match(line, /reportable>=/i);
  assert.equal(line.includes("measured=determination="), false);

  const affiliation = policy.signals.emotionDynamics.reportableMeasurements.find(
    (item) => item.name === "affiliation"
  );
  assert.equal(affiliation.metric, "emotions.affiliation");
  assert.equal(affiliation.score, 0.48);
});
