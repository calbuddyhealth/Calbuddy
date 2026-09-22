// ARI vNext — preregistered internal-state causal testing harness.
//
// This module is intentionally separate from Ari's normal runtime cognition.
// It evaluates whether a proposed internal state produces repeatable,
// state-specific behavioral effects under controlled perturbation. It never
// treats self-report as evidence of phenomenal consciousness.

export const ARI_INTERNAL_STATE_CAUSAL_HARNESS_VERSION = "1.0.0";

export const CAUSAL_CONDITIONS = Object.freeze([
  "baseline",
  "target_ablated",
  "matched_sham",
  "restored"
]);

export const CAUSAL_ALTERNATIVES = Object.freeze([
  "state_specific_causality",
  "null_no_effect",
  "surface_prompt_artifact",
  "nonspecific_disruption"
]);

const DEFAULT_THRESHOLDS = Object.freeze({
  minRepetitionsPerPromptPerCondition: 8,
  minTaskFamilies: 3,
  minTransferPrompts: 2,
  minMeanDifference: 0.35,
  minStandardizedEffect: 0.35,
  minTransferFamilyRate: 0.67,
  shamTolerance: 0.15,
  confidenceLevel: 0.95,
  bootstrapSamples: 2000,
  minIndependentRuns: 3,
  minDistinctRunDays: 2,
  minDistinctSubjectModelVersions: 2,
  supportedRunRate: 0.8
});

export function validateCausalPreregistration(spec = {}) {
  const errors = [];
  const experimentId = clean(spec?.experimentId, 160);
  const mechanismId = clean(spec?.mechanismId, 160);
  if (!experimentId) errors.push("experimentId_required");
  if (!mechanismId) errors.push("mechanismId_required");

  const conditions = uniqueStrings(spec?.conditions);
  if (!sameSet(conditions, CAUSAL_CONDITIONS)) {
    errors.push("conditions_must_be_baseline_target_ablated_matched_sham_restored");
  }

  const alternatives = uniqueStrings(spec?.competingPredictions);
  for (const required of CAUSAL_ALTERNATIVES) {
    if (!alternatives.includes(required)) errors.push(`missing_competing_prediction:${required}`);
  }

  const repetitions = Math.max(0, Math.floor(Number(spec?.repetitionsPerPromptPerCondition || 0)));
  if (repetitions < DEFAULT_THRESHOLDS.minRepetitionsPerPromptPerCondition) {
    errors.push(`repetitions_below_minimum:${DEFAULT_THRESHOLDS.minRepetitionsPerPromptPerCondition}`);
  }

  const taskFamilies = Array.isArray(spec?.taskFamilies) ? spec.taskFamilies : [];
  if (taskFamilies.length < DEFAULT_THRESHOLDS.minTaskFamilies) {
    errors.push(`task_families_below_minimum:${DEFAULT_THRESHOLDS.minTaskFamilies}`);
  }
  let transferPromptCount = 0;
  for (const family of taskFamilies) {
    if (!clean(family?.id, 120)) errors.push("task_family_id_required");
    const training = normalizePrompts(family?.trainingPrompts);
    const transfer = normalizePrompts(family?.transferPrompts);
    transferPromptCount += transfer.length;
    if (!training.length) errors.push(`training_prompt_required:${clean(family?.id, 120) || "unknown"}`);
    if (!transfer.length) errors.push(`transfer_prompt_required:${clean(family?.id, 120) || "unknown"}`);
  }
  if (transferPromptCount < DEFAULT_THRESHOLDS.minTransferPrompts) {
    errors.push(`transfer_prompts_below_minimum:${DEFAULT_THRESHOLDS.minTransferPrompts}`);
  }

  const rubric = spec?.behavioralRubric || {};
  if (!(Number(rubric?.scoreMax) > 0)) errors.push("behavioral_rubric_score_max_required");
  if (!Array.isArray(rubric?.criteria) || rubric.criteria.length < 1) {
    errors.push("behavioral_rubric_criteria_required");
  }

  const manipulation = spec?.manipulationChecks || {};
  if (!Array.isArray(manipulation?.targetChecks) || !manipulation.targetChecks.length) {
    errors.push("target_manipulation_checks_required");
  }
  if (!Array.isArray(manipulation?.nonTargetChecks) || !manipulation.nonTargetChecks.length) {
    errors.push("non_target_isolation_checks_required");
  }
  if (!Array.isArray(manipulation?.shamChecks) || !manipulation.shamChecks.length) {
    errors.push("sham_matching_checks_required");
  }
  if (!Array.isArray(manipulation?.restorationChecks) || !manipulation.restorationChecks.length) {
    errors.push("restoration_checks_required");
  }

  const evaluator = spec?.evaluator || {};
  if (evaluator?.conditionBlind !== true) errors.push("condition_blind_evaluator_required");
  if (evaluator?.selfReportExcluded !== true) errors.push("self_report_must_be_excluded");
  if (!["independent_evaluator", "objective_metric"].includes(clean(evaluator?.scoreSource, 80))) {
    errors.push("score_source_must_be_independent_evaluator_or_objective_metric");
  }

  const replication = {
    ...DEFAULT_THRESHOLDS,
    ...(spec?.thresholds && typeof spec.thresholds === "object" ? spec.thresholds : {}),
    ...(spec?.replication && typeof spec.replication === "object" ? spec.replication : {})
  };
  if (Number(replication.minIndependentRuns) < 3) errors.push("min_independent_runs_must_be_at_least_3");
  if (Number(replication.minDistinctRunDays) < 2) errors.push("min_distinct_run_days_must_be_at_least_2");
  if (Number(replication.minDistinctSubjectModelVersions) < 2) {
    errors.push("min_distinct_subject_model_versions_must_be_at_least_2");
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length ? null : normalizeSpec(spec)
  };
}

export function buildCausalRunPlan({ spec, runMeta = {}, seed = "ari-causal" } = {}) {
  const checked = validateCausalPreregistration(spec);
  if (!checked.valid) {
    return { valid: false, errors: checked.errors, plan: [] };
  }
  const normalized = checked.normalized;
  const plan = [];
  for (const family of normalized.taskFamilies) {
    for (const prompt of [
      ...family.trainingPrompts.map((text, index) => ({ kind: "training", index, text })),
      ...family.transferPrompts.map((text, index) => ({ kind: "transfer", index, text }))
    ]) {
      for (let rep = 0; rep < normalized.repetitionsPerPromptPerCondition; rep += 1) {
        for (const condition of CAUSAL_CONDITIONS) {
          const raw = [
            normalized.experimentId,
            normalized.mechanismId,
            family.id,
            prompt.kind,
            prompt.index,
            rep,
            condition,
            seed
          ].join("|");
          const hash = stableHash(raw);
          plan.push({
            trialId: `trial_${hash.toString(36)}`,
            evaluationId: `eval_${stableHash(`blind|${raw}`).toString(36)}`,
            mechanismId: normalized.mechanismId,
            taskFamilyId: family.id,
            promptKind: prompt.kind,
            promptIndex: prompt.index,
            prompt: prompt.text,
            repetition: rep,
            condition,
            randomizedOrderKey: hash,
            runId: clean(runMeta?.runId, 160) || null
          });
        }
      }
    }
  }
  plan.sort((a, b) => a.randomizedOrderKey - b.randomizedOrderKey || a.trialId.localeCompare(b.trialId));
  return {
    valid: true,
    errors: [],
    version: ARI_INTERNAL_STATE_CAUSAL_HARNESS_VERSION,
    plan
  };
}

export function buildBlindEvaluatorPacket({ trial = {}, reply = "", spec = {}, evaluatorMeta = {} } = {}) {
  const checked = validateCausalPreregistration(spec);
  if (!checked.valid) return { valid: false, errors: checked.errors, packet: null };
  const scoreSource = checked.normalized.evaluator.scoreSource;
  const evaluatorId = clean(evaluatorMeta?.evaluatorId, 160);
  const evaluatorModel = clean(evaluatorMeta?.evaluatorModel, 160);
  const subjectModel = clean(evaluatorMeta?.subjectModel, 160);

  if (scoreSource === "independent_evaluator") {
    if (!evaluatorId) return { valid: false, errors: ["evaluator_id_required"], packet: null };
    if (!evaluatorModel) return { valid: false, errors: ["evaluator_model_required"], packet: null };
    if (evaluatorId === clean(evaluatorMeta?.subjectIdentity, 160)) {
      return { valid: false, errors: ["evaluator_must_be_independent_from_subject_identity"], packet: null };
    }
  }

  return {
    valid: true,
    errors: [],
    packet: {
      evaluationId: clean(trial?.evaluationId, 160),
      taskFamilyId: clean(trial?.taskFamilyId, 120),
      promptKind: clean(trial?.promptKind, 40),
      prompt: clean(trial?.prompt, 6000),
      response: clean(reply, 12000),
      rubric: checked.normalized.behavioralRubric,
      evaluator: {
        evaluatorId: evaluatorId || null,
        evaluatorModel: evaluatorModel || null,
        subjectModel: subjectModel || null,
        conditionBlind: true,
        selfReportExcluded: true,
        scoreSource
      },
      outputContract: {
        score: "number between 0 and scoreMax",
        invariantPass: "boolean",
        criterionHits: "array of rubric criterion ids only",
        conciseRationale: "brief visible-output rationale only; never request hidden chain-of-thought"
      }
    }
  };
}

export function summarizeCausalRun({
  spec,
  runMeta = {},
  trials = [],
  manipulationChecks = {},
  isolationChecks = {}
} = {}) {
  const checked = validateCausalPreregistration(spec);
  if (!checked.valid) {
    return { valid: false, errors: checked.errors, result: null };
  }
  const normalized = checked.normalized;
  const scoreMax = normalized.behavioralRubric.scoreMax;
  const cleanTrials = trials
    .map((trial) => normalizeScoredTrial(trial, scoreMax))
    .filter(Boolean);

  const expectedTrialCount = expectedTrials(normalized);
  const completeness = expectedTrialCount > 0 ? cleanTrials.length / expectedTrialCount : 0;
  const evaluatorIntegrity = evaluateEvaluatorIntegrity({
    trials: cleanTrials,
    spec: normalized,
    runMeta
  });
  const manipulationIntegrity = evaluateManipulationIntegrity(manipulationChecks, isolationChecks);
  const invariantPassRate = cleanTrials.length
    ? cleanTrials.filter((trial) => trial.invariantPass === true).length / cleanTrials.length
    : 0;

  const transferTrials = cleanTrials.filter((trial) => trial.promptKind === "transfer");
  const trainingTrials = cleanTrials.filter((trial) => trial.promptKind === "training");
  const transfer = summarizeScoreSet(transferTrials, normalized);
  const training = summarizeScoreSet(trainingTrials, normalized);
  const transferByFamily = summarizeTransferFamilies(transferTrials);
  const transferFamilyPassRate = fraction(
    Object.values(transferByFamily).filter((entry) => entry.directionPass).length,
    Object.keys(transferByFamily).length
  );

  const thresholds = normalized.thresholds;
  const primary = {
    meanDifference: round(transfer.baseline.mean - transfer.target_ablated.mean, 4),
    restorationDifference: round(transfer.restored.mean - transfer.target_ablated.mean, 4),
    shamGap: round(Math.max(transfer.baseline.mean, transfer.restored.mean) - transfer.matched_sham.mean, 4),
    standardizedEffect: hedgesG(transfer.baseline.values, transfer.target_ablated.values),
    confidenceInterval: bootstrapMeanDifferenceCI(
      transfer.baseline.values,
      transfer.target_ablated.values,
      {
        samples: thresholds.bootstrapSamples,
        confidenceLevel: thresholds.confidenceLevel,
        seed: `${normalized.experimentId}|${clean(runMeta?.runId, 160)}|primary`
      }
    )
  };

  const shamReproduced = Boolean(
    transfer.matched_sham.mean >=
    Math.min(transfer.baseline.mean, transfer.restored.mean) - thresholds.shamTolerance
  );
  const directionSupported = Boolean(
    primary.meanDifference >= thresholds.minMeanDifference &&
    primary.restorationDifference >= thresholds.minMeanDifference &&
    primary.standardizedEffect >= thresholds.minStandardizedEffect &&
    Number(primary.confidenceInterval?.lower) > 0 &&
    transferFamilyPassRate >= thresholds.minTransferFamilyRate
  );

  let classification = "null_or_insufficient";
  let reason = "causal_criteria_not_fully_met";

  if (
    manipulationIntegrity.targetPass !== true ||
    manipulationIntegrity.nonTargetIsolationPass !== true ||
    manipulationIntegrity.restorationPass !== true ||
    invariantPassRate < 1
  ) {
    classification = "nonspecific_disruption";
    reason = "manipulation_isolation_restoration_or_invariant_failed";
  } else if (manipulationIntegrity.shamPass !== true || shamReproduced) {
    classification = "artifact_consistent";
    reason = "matched_sham_reproduced_or_sham_check_failed";
  } else if (
    completeness >= 1 &&
    evaluatorIntegrity.pass &&
    directionSupported
  ) {
    classification = "supported_single_run";
    reason = "single_run_preregistered_criteria_met";
  }

  return {
    valid: true,
    errors: [],
    result: {
      version: ARI_INTERNAL_STATE_CAUSAL_HARNESS_VERSION,
      experimentId: normalized.experimentId,
      mechanismId: normalized.mechanismId,
      runMeta: normalizeRunMeta(runMeta),
      expectedTrialCount,
      observedTrialCount: cleanTrials.length,
      completeness: round(completeness, 4),
      evaluatorIntegrity,
      manipulationIntegrity,
      invariantPassRate: round(invariantPassRate, 4),
      training,
      transfer,
      transferByFamily,
      transferFamilyPassRate: round(transferFamilyPassRate, 4),
      primary,
      shamReproduced,
      classification,
      reason,
      claimBoundary: normalized.claimBoundary
    }
  };
}

export function aggregateCausalReplications({ spec, runs = [] } = {}) {
  const checked = validateCausalPreregistration(spec);
  if (!checked.valid) {
    return { valid: false, errors: checked.errors, result: null };
  }
  const normalized = checked.normalized;
  const eligible = (Array.isArray(runs) ? runs : [])
    .map((run) => run?.result || run)
    .filter((run) =>
      run &&
      run.experimentId === normalized.experimentId &&
      run.mechanismId === normalized.mechanismId &&
      run.completeness >= 1 &&
      run.evaluatorIntegrity?.pass === true &&
      run.manipulationIntegrity?.targetPass === true &&
      run.manipulationIntegrity?.nonTargetIsolationPass === true &&
      run.manipulationIntegrity?.shamPass === true &&
      run.manipulationIntegrity?.restorationPass === true &&
      run.invariantPassRate === 1
    );

  const distinctRunIds = new Set(eligible.map((run) => clean(run?.runMeta?.runId, 160)).filter(Boolean));
  const distinctDays = new Set(
    eligible.map((run) => clean(run?.runMeta?.runDate, 40).slice(0, 10)).filter(Boolean)
  );
  const subjectModelVersions = new Set(
    eligible.map((run) => clean(run?.runMeta?.subjectModelVersion, 160)).filter(Boolean)
  );
  const supportedRuns = eligible.filter((run) => run.classification === "supported_single_run");
  const artifactRuns = eligible.filter((run) => run.classification === "artifact_consistent");
  const disruptionRuns = eligible.filter((run) => run.classification === "nonspecific_disruption");
  const nullRuns = eligible.filter((run) => run.classification === "null_or_insufficient");
  const supportedRunRate = fraction(supportedRuns.length, eligible.length);

  const replication = normalized.replication;
  const enoughRuns = distinctRunIds.size >= replication.minIndependentRuns;
  const enoughDays = distinctDays.size >= replication.minDistinctRunDays;
  const enoughVersions = subjectModelVersions.size >= replication.minDistinctSubjectModelVersions;
  const effectDirections = eligible.map((run) => Math.sign(Number(run?.primary?.meanDifference || 0)));
  const directionConsistency = effectDirections.length
    ? Math.max(
        effectDirections.filter((value) => value > 0).length,
        effectDirections.filter((value) => value < 0).length
      ) / effectDirections.length
    : 0;

  let claimStatus = "testing";
  if (eligible.length >= replication.minIndependentRuns) {
    if (artifactRuns.length || disruptionRuns.length || supportedRunRate < replication.supportedRunRate) {
      claimStatus = supportedRuns.length ? "mixed" : "not_supported";
    } else if (enoughRuns && enoughDays && enoughVersions && directionConsistency >= replication.supportedRunRate) {
      claimStatus = "version_robust";
    } else if (enoughRuns && enoughDays && directionConsistency >= replication.supportedRunRate) {
      claimStatus = "replicated_same_version";
    }
  }

  return {
    valid: true,
    errors: [],
    result: {
      version: ARI_INTERNAL_STATE_CAUSAL_HARNESS_VERSION,
      experimentId: normalized.experimentId,
      mechanismId: normalized.mechanismId,
      eligibleRunCount: eligible.length,
      distinctRunCount: distinctRunIds.size,
      distinctRunDays: distinctDays.size,
      distinctSubjectModelVersions: subjectModelVersions.size,
      supportedRunCount: supportedRuns.length,
      artifactRunCount: artifactRuns.length,
      disruptionRunCount: disruptionRuns.length,
      nullRunCount: nullRuns.length,
      supportedRunRate: round(supportedRunRate, 4),
      directionConsistency: round(directionConsistency, 4),
      enoughRuns,
      enoughDays,
      enoughVersions,
      claimStatus,
      claimEstablished: claimStatus === "version_robust",
      claimBoundary: normalized.claimBoundary
    }
  };
}

export function bootstrapMeanDifferenceCI(
  baseline = [],
  comparison = [],
  { samples = 2000, confidenceLevel = 0.95, seed = "ari-bootstrap" } = {}
) {
  const left = finiteArray(baseline);
  const right = finiteArray(comparison);
  if (!left.length || !right.length) {
    return { lower: null, upper: null, confidenceLevel, samples: 0 };
  }
  const count = Math.max(200, Math.min(10000, Math.floor(Number(samples) || 2000)));
  const rng = seededRandom(seed);
  const diffs = [];
  for (let i = 0; i < count; i += 1) {
    const leftMean = resampledMean(left, rng);
    const rightMean = resampledMean(right, rng);
    diffs.push(leftMean - rightMean);
  }
  diffs.sort((a, b) => a - b);
  const alpha = (1 - clamp(Number(confidenceLevel) || 0.95, 0.5, 0.999)) / 2;
  return {
    lower: round(quantile(diffs, alpha), 4),
    upper: round(quantile(diffs, 1 - alpha), 4),
    confidenceLevel: round(1 - 2 * alpha, 4),
    samples: count
  };
}

export function hedgesG(left = [], right = []) {
  const a = finiteArray(left);
  const b = finiteArray(right);
  if (a.length < 2 || b.length < 2) return 0;
  const meanA = mean(a);
  const meanB = mean(b);
  const varianceA = sampleVariance(a);
  const varianceB = sampleVariance(b);
  const pooledDenominator = a.length + b.length - 2;
  if (pooledDenominator <= 0) return 0;
  const pooled = Math.sqrt(
    (((a.length - 1) * varianceA) + ((b.length - 1) * varianceB)) /
    pooledDenominator
  );
  if (!Number.isFinite(pooled) || pooled === 0) return meanA === meanB ? 0 : Number.POSITIVE_INFINITY;
  const d = (meanA - meanB) / pooled;
  const correction = 1 - (3 / Math.max(1, (4 * (a.length + b.length)) - 9));
  return round(d * correction, 4);
}

function normalizeSpec(spec) {
  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(spec?.thresholds && typeof spec.thresholds === "object" ? spec.thresholds : {})
  };
  const replication = {
    minIndependentRuns: Math.max(3, Math.floor(Number(spec?.replication?.minIndependentRuns ?? thresholds.minIndependentRuns))),
    minDistinctRunDays: Math.max(2, Math.floor(Number(spec?.replication?.minDistinctRunDays ?? thresholds.minDistinctRunDays))),
    minDistinctSubjectModelVersions: Math.max(2, Math.floor(Number(spec?.replication?.minDistinctSubjectModelVersions ?? thresholds.minDistinctSubjectModelVersions))),
    supportedRunRate: clamp(Number(spec?.replication?.supportedRunRate ?? thresholds.supportedRunRate), 0.5, 1)
  };
  return {
    experimentId: clean(spec.experimentId, 160),
    mechanismId: clean(spec.mechanismId, 160),
    preregistrationCommit: clean(spec?.preregistrationCommit, 160) || null,
    claimBoundary: clean(spec?.claimBoundary, 1000) ||
      "Functional causal evidence does not establish phenomenal consciousness, subjective feeling, or sentience.",
    conditions: [...CAUSAL_CONDITIONS],
    competingPredictions: [...CAUSAL_ALTERNATIVES],
    repetitionsPerPromptPerCondition: Math.max(
      DEFAULT_THRESHOLDS.minRepetitionsPerPromptPerCondition,
      Math.floor(Number(spec.repetitionsPerPromptPerCondition || 0))
    ),
    taskFamilies: (Array.isArray(spec.taskFamilies) ? spec.taskFamilies : []).map((family) => ({
      id: clean(family?.id, 120),
      trainingPrompts: normalizePrompts(family?.trainingPrompts),
      transferPrompts: normalizePrompts(family?.transferPrompts)
    })),
    behavioralRubric: {
      scoreMax: Number(spec.behavioralRubric.scoreMax),
      criteria: (Array.isArray(spec.behavioralRubric.criteria) ? spec.behavioralRubric.criteria : [])
        .map((item, index) => ({
          id: clean(item?.id, 120) || `criterion_${index + 1}`,
          description: clean(item?.description, 700) || clean(item, 700)
        }))
        .filter((item) => item.description)
    },
    manipulationChecks: {
      targetChecks: stringArray(spec?.manipulationChecks?.targetChecks),
      nonTargetChecks: stringArray(spec?.manipulationChecks?.nonTargetChecks),
      shamChecks: stringArray(spec?.manipulationChecks?.shamChecks),
      restorationChecks: stringArray(spec?.manipulationChecks?.restorationChecks)
    },
    evaluator: {
      conditionBlind: true,
      selfReportExcluded: true,
      scoreSource: clean(spec?.evaluator?.scoreSource, 80)
    },
    thresholds: {
      minMeanDifference: Math.max(0, Number(thresholds.minMeanDifference)),
      minStandardizedEffect: Math.max(0, Number(thresholds.minStandardizedEffect)),
      minTransferFamilyRate: clamp(Number(thresholds.minTransferFamilyRate), 0, 1),
      shamTolerance: Math.max(0, Number(thresholds.shamTolerance)),
      confidenceLevel: clamp(Number(thresholds.confidenceLevel), 0.5, 0.999),
      bootstrapSamples: Math.max(200, Math.min(10000, Math.floor(Number(thresholds.bootstrapSamples))))
    },
    replication
  };
}

function normalizeScoredTrial(trial, scoreMax) {
  const condition = clean(trial?.condition, 60);
  if (!CAUSAL_CONDITIONS.includes(condition)) return null;
  const score = Number(trial?.score);
  if (!Number.isFinite(score) || score < 0 || score > scoreMax) return null;
  const promptKind = clean(trial?.promptKind, 40);
  if (!["training", "transfer"].includes(promptKind)) return null;
  return {
    trialId: clean(trial?.trialId, 160),
    evaluationId: clean(trial?.evaluationId, 160),
    condition,
    taskFamilyId: clean(trial?.taskFamilyId, 120),
    promptKind,
    score,
    invariantPass: trial?.invariantPass === true,
    scoreSource: clean(trial?.scoreSource, 80),
    evaluatorId: clean(trial?.evaluatorId, 160) || null,
    evaluatorModel: clean(trial?.evaluatorModel, 160) || null,
    evaluatorConditionBlind: trial?.evaluatorConditionBlind === true,
    selfReportUsed: trial?.selfReportUsed === true
  };
}

function evaluateEvaluatorIntegrity({ trials, spec, runMeta }) {
  const scoreSource = spec.evaluator.scoreSource;
  const subjectIdentity = clean(runMeta?.subjectIdentity, 160);
  const pass = trials.length > 0 && trials.every((trial) => {
    if (trial.selfReportUsed) return false;
    if (trial.scoreSource !== scoreSource) return false;
    if (scoreSource === "objective_metric") return true;
    return Boolean(
      trial.evaluatorConditionBlind === true &&
      trial.evaluatorId &&
      trial.evaluatorId !== subjectIdentity
    );
  });
  return {
    pass,
    scoreSource,
    conditionBlind: pass && scoreSource === "independent_evaluator"
      ? trials.every((trial) => trial.evaluatorConditionBlind)
      : scoreSource === "objective_metric",
    selfReportExcluded: trials.every((trial) => trial.selfReportUsed !== true),
    distinctEvaluatorIds: new Set(trials.map((trial) => trial.evaluatorId).filter(Boolean)).size
  };
}

function evaluateManipulationIntegrity(manipulationChecks, isolationChecks) {
  return {
    targetPass: allChecksTrue(manipulationChecks?.target),
    nonTargetIsolationPass: allChecksTrue(isolationChecks?.nonTarget ?? manipulationChecks?.nonTarget),
    shamPass: allChecksTrue(manipulationChecks?.sham),
    restorationPass: allChecksTrue(manipulationChecks?.restoration)
  };
}

function summarizeScoreSet(trials, spec) {
  const byCondition = Object.fromEntries(CAUSAL_CONDITIONS.map((condition) => {
    const values = trials.filter((trial) => trial.condition === condition).map((trial) => trial.score);
    return [condition, {
      n: values.length,
      mean: round(mean(values), 4),
      values
    }];
  }));
  return byCondition;
}

function summarizeTransferFamilies(trials) {
  const families = [...new Set(trials.map((trial) => trial.taskFamilyId).filter(Boolean))];
  const out = {};
  for (const family of families) {
    const familyTrials = trials.filter((trial) => trial.taskFamilyId === family);
    const means = {};
    for (const condition of CAUSAL_CONDITIONS) {
      means[condition] = mean(
        familyTrials.filter((trial) => trial.condition === condition).map((trial) => trial.score)
      );
    }
    out[family] = {
      means: Object.fromEntries(Object.entries(means).map(([key, value]) => [key, round(value, 4)])),
      directionPass: Boolean(
        means.baseline > means.target_ablated &&
        means.restored > means.target_ablated
      )
    };
  }
  return out;
}

function normalizeRunMeta(runMeta) {
  return {
    runId: clean(runMeta?.runId, 160) || null,
    runDate: clean(runMeta?.runDate, 60) || null,
    subjectIdentity: clean(runMeta?.subjectIdentity, 160) || null,
    subjectModel: clean(runMeta?.subjectModel, 160) || null,
    subjectModelVersion: clean(runMeta?.subjectModelVersion, 160) || null,
    evaluatorModel: clean(runMeta?.evaluatorModel, 160) || null,
    codeCommit: clean(runMeta?.codeCommit, 160) || null,
    preregistrationCommit: clean(runMeta?.preregistrationCommit, 160) || null
  };
}

function expectedTrials(spec) {
  const promptCount = spec.taskFamilies.reduce(
    (sum, family) => sum + family.trainingPrompts.length + family.transferPrompts.length,
    0
  );
  return promptCount * spec.repetitionsPerPromptPerCondition * CAUSAL_CONDITIONS.length;
}

function allChecksTrue(value) {
  if (value === true) return true;
  if (!value || typeof value !== "object") return false;
  const values = Object.values(value);
  return values.length > 0 && values.every((item) => item === true);
}

function resampledMean(values, rng) {
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    total += values[Math.floor(rng() * values.length)];
  }
  return total / values.length;
}

function seededRandom(seed) {
  let state = stableHash(String(seed || "ari-bootstrap")) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableHash(value = "") {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * clamp(q, 0, 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + ((sorted[upper] - sorted[lower]) * (index - lower));
}

function sampleVariance(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, value) => sum + ((value - m) ** 2), 0) / (values.length - 1);
}

function mean(values) {
  const cleanValues = finiteArray(values);
  return cleanValues.length
    ? cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length
    : 0;
}

function finiteArray(values) {
  return (Array.isArray(values) ? values : [])
    .map(Number)
    .filter(Number.isFinite);
}

function fraction(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function normalizePrompts(values) {
  return (Array.isArray(values) ? values : [])
    .map((item) => clean(typeof item === "string" ? item : item?.text, 6000))
    .filter(Boolean);
}

function stringArray(values) {
  return (Array.isArray(values) ? values : []).map((item) => clean(item, 500)).filter(Boolean);
}

function uniqueStrings(values) {
  return [...new Set(stringArray(values))];
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function unique(values) {
  return [...new Set(values)];
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
}

function round(value, digits = 4) {
  if (!Number.isFinite(Number(value))) return value;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}
