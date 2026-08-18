import test from "node:test";
import assert from "node:assert/strict";

import { applyOutcomeLearning } from "../api/_lib/ari-vnext/outcome-learning.js";

function state() {
  return {
    hypotheses: [
      { id: "energy_availability_pressure", label: "Energy pressure", score: 0.5, rank: 1, status: "weak_leader" },
      { id: "recovery_pressure", label: "Recovery pressure", score: 0.46, rank: 2, status: "credible_alternative" },
      { id: "program_stimulus_mismatch", label: "Program mismatch", score: 0.32, rank: 3, status: "deprioritized" }
    ],
    evidenceGraph: { nodes: [], edges: [] }
  };
}

test("positive nutrition outcome modestly increases energy hypothesis confidence", () => {
  const learned = applyOutcomeLearning(
    state(),
    "- User reported a positive outcome after recent nutrition guidance: strength improved. Recent Ari guidance context: meet calorie intake target consistently."
  );

  const energy = learned.hypotheses.find((item) => item.id === "energy_availability_pressure");
  assert.equal(energy.preOutcomeScore, 0.5);
  assert.equal(energy.score, 0.56);
  assert.equal(energy.outcomeAdjustment, 0.06);
  assert.equal(learned.outcomeLearning.applied, true);
});

test("negative program outcome lowers program hypothesis confidence", () => {
  const learned = applyOutcomeLearning(
    state(),
    "- User reported a negative outcome after recent training guidance: performance got worse. Recent Ari guidance context: increase weekly volume and sets."
  );

  const program = learned.hypotheses.find((item) => item.id === "program_stimulus_mismatch");
  assert.equal(program.score, 0.27);
  assert.equal(program.outcomeAdjustment, -0.05);
});

test("repeated autobiographical outcomes cannot overpower current evidence beyond the cap", () => {
  const memories = Array.from({ length: 6 }, (_, index) =>
    `- User reported a positive outcome after recent nutrition guidance: result ${index}. Recent Ari guidance context: calorie intake target.`
  ).join("\n");

  const learned = applyOutcomeLearning(state(), memories);
  const energy = learned.hypotheses.find((item) => item.id === "energy_availability_pressure");
  assert.equal(energy.outcomeAdjustment, 0.12);
  assert.equal(energy.score, 0.62);
});

test("unrelated prior outcomes do not alter hypothesis ranking", () => {
  const learned = applyOutcomeLearning(
    state(),
    "- User reported a positive outcome after recent coaching guidance: the new app color looked better."
  );

  assert.equal(learned.outcomeLearning.applied, false);
  assert.deepEqual(learned.hypotheses.map((item) => item.score), [0.5, 0.46, 0.32]);
});
