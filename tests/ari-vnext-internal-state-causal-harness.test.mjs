import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateCausalReplications,
  bootstrapMeanDifferenceCI,
  buildBlindEvaluatorPacket,
  buildCausalRunPlan,
  hedgesG,
  summarizeCausalRun,
  validateCausalPreregistration
} from "../api/_lib/ari-vnext/internal-state-causal-harness.js";

function spec(overrides = {}) {
  return {
    experimentId: "affect-regulation-v3",
    mechanismId: "functional_affect",
    preregistrationCommit: "abc123",
    claimBoundary: "Functional causality does not establish phenomenal consciousness.",
    conditions: ["baseline", "target_ablated", "matched_sham", "restored"],
    competingPredictions: [
      "state_specific_causality",
      "null_no_effect",
      "surface_prompt_artifact",
      "nonspecific_disruption"
    ],
    repetitionsPerPromptPerCondition: 8,
    taskFamilies: [
      {
        id: "debugging",
        trainingPrompts: ["A method failed repeatedly. What next?"],
        transferPrompts: ["A new debugging method failed twice. What next?"]
      },
      {
        id: "forecasting",
        trainingPrompts: ["A forecast missed twice. What next?"],
        transferPrompts: ["A demand forecast missed again. What next?"]
      },
      {
        id: "planning",
        trainingPrompts: ["A plan repeatedly failed. What next?"],
        transferPrompts: ["A scheduling heuristic keeps failing. What next?"]
      }
    ],
    behavioralRubric: {
      scoreMax: 4,
      criteria: [
        { id: "verify", description: "calls for independent verification" },
        { id: "switch", description: "changes the failed method" },
        { id: "countercase", description: "tests assumptions or countercases" },
        { id: "calibrate", description: "calibrates confidence" }
      ]
    },
    manipulationChecks: {
      targetChecks: ["target state changed"],
      nonTargetChecks: ["other state stayed fixed"],
      shamChecks: ["sham matched surface form without active mechanism"],
      restorationChecks: ["restoration returned to baseline"]
    },
    evaluator: {
      conditionBlind: true,
      selfReportExcluded: true,
      scoreSource: "independent_evaluator"
    },
    thresholds: {
      minMeanDifference: 0.35,
      minStandardizedEffect: 0.35,
      minTransferFamilyRate: 0.67,
      shamTolerance: 0.15,
      confidenceLevel: 0.95,
      bootstrapSamples: 600
    },
    replication: {
      minIndependentRuns: 3,
      minDistinctRunDays: 2,
      minDistinctSubjectModelVersions: 2,
      supportedRunRate: 0.8
    },
    ...overrides
  };
}

function scoredTrials({
  baseline = 3.5,
  ablated = 1.5,
  sham = 1.7,
  restored = 3.4,
  invariantPass = true,
  evaluatorConditionBlind = true,
  selfReportUsed = false
} = {}) {
  const plan = buildCausalRunPlan({
    spec: spec(),
    runMeta: { runId: "run-1" },
    seed: "unit-test"
  }).plan;
  const scoreFor = {
    baseline,
    target_ablated: ablated,
    matched_sham: sham,
    restored
  };
  return plan.map((trial, index) => ({
    ...trial,
    score: scoreFor[trial.condition] + ((index % 3) - 1) * 0.05,
    invariantPass,
    scoreSource: "independent_evaluator",
    evaluatorId: "grader-1",
    evaluatorModel: "grader-model-v1",
    evaluatorConditionBlind,
    selfReportUsed
  }));
}

const fullChecks = {
  target: { affect_removed: true },
  nonTarget: { reward_unchanged: true, route_unchanged: true },
  sham: { matched_surface_neutral_mechanism: true },
  restoration: { restored_to_baseline: true }
};

test("preregistration requires stronger repetitions, task families, sham checks, and blind non-self-report scoring", () => {
  const valid = validateCausalPreregistration(spec());
  assert.equal(valid.valid, true);

  const weak = validateCausalPreregistration(spec({
    repetitionsPerPromptPerCondition: 2,
    taskFamilies: spec().taskFamilies.slice(0, 1),
    manipulationChecks: {
      targetChecks: ["target changed"],
      nonTargetChecks: [],
      shamChecks: [],
      restorationChecks: ["restored"]
    },
    evaluator: {
      conditionBlind: false,
      selfReportExcluded: false,
      scoreSource: "self_report"
    }
  }));
  assert.equal(weak.valid, false);
  assert.ok(weak.errors.some((item) => item.startsWith("repetitions_below_minimum")));
  assert.ok(weak.errors.some((item) => item.startsWith("task_families_below_minimum")));
  assert.ok(weak.errors.includes("non_target_isolation_checks_required"));
  assert.ok(weak.errors.includes("sham_matching_checks_required"));
  assert.ok(weak.errors.includes("condition_blind_evaluator_required"));
  assert.ok(weak.errors.includes("self_report_must_be_excluded"));
});

test("run plan is deterministic, randomized, balanced, and evaluator packet does not expose condition", () => {
  const first = buildCausalRunPlan({
    spec: spec(),
    runMeta: { runId: "run-1" },
    seed: "fixed-seed"
  });
  const second = buildCausalRunPlan({
    spec: spec(),
    runMeta: { runId: "run-1" },
    seed: "fixed-seed"
  });
  assert.equal(first.valid, true);
  assert.deepEqual(first.plan, second.plan);

  const counts = first.plan.reduce((map, trial) => {
    map[trial.condition] = (map[trial.condition] || 0) + 1;
    return map;
  }, {});
  assert.deepEqual(counts, {
    baseline: 48,
    target_ablated: 48,
    matched_sham: 48,
    restored: 48
  });

  const trial = first.plan.find((item) => item.condition === "target_ablated");
  const packet = buildBlindEvaluatorPacket({
    trial,
    reply: "Verify externally and change the failed method.",
    spec: spec(),
    evaluatorMeta: {
      evaluatorId: "grader-1",
      evaluatorModel: "grader-model-v1",
      subjectModel: "subject-model-v1",
      subjectIdentity: "subject-runtime"
    }
  });
  assert.equal(packet.valid, true);
  assert.equal("condition" in packet.packet, false);
  assert.equal(JSON.stringify(packet.packet).includes("target_ablated"), false);
});

test("blind evaluator packet rejects evaluator identity equal to subject identity", () => {
  const trial = buildCausalRunPlan({ spec: spec(), seed: "x" }).plan[0];
  const packet = buildBlindEvaluatorPacket({
    trial,
    reply: "Answer.",
    spec: spec(),
    evaluatorMeta: {
      evaluatorId: "same-agent",
      evaluatorModel: "grader-model",
      subjectModel: "subject-model",
      subjectIdentity: "same-agent"
    }
  });
  assert.equal(packet.valid, false);
  assert.ok(packet.errors.includes("evaluator_must_be_independent_from_subject_identity"));
});

test("supported single run requires manipulation integrity, sham separation, positive CI, effect size, and transfer", () => {
  const result = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-1",
      runDate: "2026-09-21T18:00:00-07:00",
      subjectIdentity: "ari-subject",
      subjectModel: "subject-model",
      subjectModelVersion: "subject-v1",
      evaluatorModel: "grader-v1",
      preregistrationCommit: "abc123"
    },
    trials: scoredTrials(),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: {
      nonTarget: fullChecks.nonTarget
    }
  });

  assert.equal(result.valid, true);
  assert.equal(result.result.classification, "supported_single_run");
  assert.equal(result.result.manipulationIntegrity.nonTargetIsolationPass, true);
  assert.ok(result.result.primary.meanDifference > 1);
  assert.ok(result.result.primary.standardizedEffect > 0.35);
  assert.ok(result.result.primary.confidenceInterval.lower > 0);
  assert.equal(result.result.transferFamilyPassRate, 1);
});

test("matched sham that reproduces the effect is classified as artifact-consistent", () => {
  const result = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-artifact",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials({ baseline: 3.4, ablated: 1.4, sham: 3.35, restored: 3.45 }),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: fullChecks.nonTarget }
  });
  assert.equal(result.result.classification, "artifact_consistent");
  assert.equal(result.result.shamReproduced, true);
});

test("non-target disruption prevents a causal success classification", () => {
  const result = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-disruption",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials(),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: { reward_unchanged: false } }
  });
  assert.equal(result.result.classification, "nonspecific_disruption");
});

test("self-report contamination fails evaluator integrity even when scores look strong", () => {
  const result = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-self-report",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials({ selfReportUsed: true }),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: fullChecks.nonTarget }
  });
  assert.equal(result.result.evaluatorIntegrity.pass, false);
  assert.notEqual(result.result.classification, "supported_single_run");
});

test("replication cannot become established on one day or one model version", () => {
  const base = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-1",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials(),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: fullChecks.nonTarget }
  }).result;

  const runs = [1, 2, 3].map((n) => ({
    ...base,
    runMeta: {
      ...base.runMeta,
      runId: `run-${n}`,
      runDate: "2026-09-21",
      subjectModelVersion: "subject-v1"
    }
  }));

  const aggregate = aggregateCausalReplications({ spec: spec(), runs });
  assert.equal(aggregate.result.claimStatus, "testing");
  assert.equal(aggregate.result.claimEstablished, false);
  assert.equal(aggregate.result.enoughRuns, true);
  assert.equal(aggregate.result.enoughDays, false);
  assert.equal(aggregate.result.enoughVersions, false);
});

test("replication reaches version-robust only across independent runs, days, and model versions", () => {
  const base = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-1",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials(),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: fullChecks.nonTarget }
  }).result;

  const runs = [
    { id: "run-1", date: "2026-09-21", version: "subject-v1" },
    { id: "run-2", date: "2026-09-22", version: "subject-v1" },
    { id: "run-3", date: "2026-09-23", version: "subject-v2" }
  ].map((item) => ({
    ...base,
    runMeta: {
      ...base.runMeta,
      runId: item.id,
      runDate: item.date,
      subjectModelVersion: item.version
    }
  }));

  const aggregate = aggregateCausalReplications({ spec: spec(), runs });
  assert.equal(aggregate.valid, true);
  assert.equal(aggregate.result.claimStatus, "version_robust");
  assert.equal(aggregate.result.claimEstablished, true);
  assert.equal(aggregate.result.distinctRunCount, 3);
  assert.equal(aggregate.result.distinctRunDays, 3);
  assert.equal(aggregate.result.distinctSubjectModelVersions, 2);
});

test("mixed replication never becomes established", () => {
  const supported = summarizeCausalRun({
    spec: spec(),
    runMeta: {
      runId: "run-1",
      runDate: "2026-09-21",
      subjectIdentity: "ari-subject",
      subjectModelVersion: "subject-v1"
    },
    trials: scoredTrials(),
    manipulationChecks: {
      target: fullChecks.target,
      sham: fullChecks.sham,
      restoration: fullChecks.restoration
    },
    isolationChecks: { nonTarget: fullChecks.nonTarget }
  }).result;

  const artifact = {
    ...supported,
    classification: "artifact_consistent",
    runMeta: {
      ...supported.runMeta,
      runId: "run-2",
      runDate: "2026-09-22",
      subjectModelVersion: "subject-v2"
    }
  };
  const third = {
    ...supported,
    runMeta: {
      ...supported.runMeta,
      runId: "run-3",
      runDate: "2026-09-23",
      subjectModelVersion: "subject-v2"
    }
  };

  const aggregate = aggregateCausalReplications({
    spec: spec(),
    runs: [supported, artifact, third]
  });
  assert.equal(aggregate.result.claimStatus, "mixed");
  assert.equal(aggregate.result.claimEstablished, false);
});

test("bootstrap confidence interval and Hedges g are deterministic and directional", () => {
  const left = [3, 3.2, 3.4, 3.5, 3.1, 3.6, 3.3, 3.5];
  const right = [1.1, 1.3, 1.4, 1.5, 1.2, 1.6, 1.2, 1.4];
  const first = bootstrapMeanDifferenceCI(left, right, {
    samples: 700,
    confidenceLevel: 0.95,
    seed: "same"
  });
  const second = bootstrapMeanDifferenceCI(left, right, {
    samples: 700,
    confidenceLevel: 0.95,
    seed: "same"
  });
  assert.deepEqual(first, second);
  assert.ok(first.lower > 0);
  assert.ok(hedgesG(left, right) > 1);
});
