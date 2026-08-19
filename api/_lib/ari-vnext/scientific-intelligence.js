// ARI vNext — evidence graph, competing hypotheses, and N-of-1 experiment design.
// This layer is deterministic and read-only. It helps Ari reason like an
// investigator without pretending correlation proves causation.

export const ARI_SCIENTIFIC_INTELLIGENCE_VERSION = "1.0.0";

export function deriveScientificIntelligence({
  turn = {},
  route = {},
  context = {},
  coachingState = null,
  longitudinalState = null,
  metacognition = null
} = {}) {
  if (!route?.training && !route?.nutrition && !route?.goals && !route?.coachingState) return null;

  const evidenceGraph = buildEvidenceGraph({ context, coachingState, longitudinalState });
  const hypotheses = rankHypotheses({ evidenceGraph, coachingState, longitudinalState });
  const nextQuestion = chooseHighestValueQuestion({ hypotheses, coachingState, longitudinalState, metacognition });
  const experiment = designExperiment({
    turn,
    hypotheses,
    nextQuestion,
    coachingState,
    longitudinalState
  });

  return {
    version: ARI_SCIENTIFIC_INTELLIGENCE_VERSION,
    evidenceGraph,
    hypotheses,
    nextQuestion,
    experiment,
    rules: {
      correlationIsNotCausation: true,
      compareCompetingExplanations: true,
      preferOneVariableExperiments: true,
      preserveWorkingSystems: true,
      collectMoreDataWhenSignalIsWeak: true,
      stopOptimizationWhenPainOrSafetyDominates: true,
      outcomeMemoryIsSupportingEvidenceNotProof: true
    }
  };
}

export function scientificIntelligenceToInstruction(state = null) {
  if (!state) return "";

  return [
    "ARI INVESTIGATOR STATE",
    "Use the evidence graph and competing hypotheses to reason, not merely to decorate the answer.",
    "Never present the highest-ranked hypothesis as proven causation. Call it the leading explanation when appropriate and name a meaningful alternative when uncertainty remains.",
    "Prefer the smallest useful intervention. If an experiment is appropriate, change one important variable at a time where practical and keep other major variables stable.",
    "A prior user-reported outcome can increase or decrease confidence, but it does not prove the same intervention will work again.",
    "If the experiment state says collect_data, do not manufacture an intervention. Identify the highest-value observation or question first.",
    "If pain/injury or high-stakes safety is present, do not run a performance experiment around it.",
    "When enough evidence exists, explain what result would support the hypothesis and what result would weaken it. Ari should be willing to revise her recommendation after the outcome.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 12000);
}

export function buildEvidenceGraph({ context = {}, coachingState = null, longitudinalState = null } = {}) {
  const nodes = [];
  const edges = [];
  const goal = coachingState?.goal || normalizeGoal(context?.goals?.goalType ?? context?.goals?.goal);
  const weight = longitudinalState?.weight || {};
  const adherence = longitudinalState?.training?.adherence || {};
  const progression = longitudinalState?.training?.progression || {};
  const volume = longitudinalState?.training?.volumeChange || {};
  const nutrition = longitudinalState?.nutrition || coachingState?.evidence?.nutrition || {};
  const reported = coachingState?.evidence?.reported || {};

  if (goal && goal !== "unknown") addNode(nodes, {
    id: "goal",
    type: "goal",
    label: "Current body-composition goal",
    value: goal,
    confidence: 0.98,
    source: "profile"
  });

  if (weight?.available) addNode(nodes, {
    id: "weight_velocity",
    type: "observation",
    label: "Weight velocity",
    value: `${signed(weight.velocityPerWeek)} lb/week`,
    confidence: weight.spanDays >= 14 && weight.pointCount >= 5 ? 0.86 : 0.66,
    source: "weight_logs",
    meta: { spanDays: weight.spanDays, pointCount: weight.pointCount, targetPerWeek: weight.weeklyGoal }
  });

  if (Number(adherence?.plannedCount || 0) > 0) addNode(nodes, {
    id: "training_adherence",
    type: "observation",
    label: "Training adherence",
    value: adherence.rate,
    confidence: adherence.plannedCount >= 6 ? 0.9 : 0.72,
    source: "workout_progress",
    meta: { planned: adherence.plannedCount, completed: adherence.completedCount, missed: adherence.missedCount }
  });

  if (Number(progression?.comparableExerciseCount || 0) > 0) addNode(nodes, {
    id: "performance_trajectory",
    type: "observation",
    label: "Comparable exercise trajectory",
    value: {
      up: Number(progression.upCount || 0),
      stable: Number(progression.stableCount || 0),
      down: Number(progression.downCount || 0),
      recentWindowPrs: Number(progression.windowPrCount || 0),
      plateauCandidates: Number(progression.plateauCandidateCount || 0)
    },
    confidence: progression.comparableExerciseCount >= 3 ? 0.84 : 0.65,
    source: "completed_training_history"
  });

  if (volume?.available) addNode(nodes, {
    id: "weekly_volume_change",
    type: "observation",
    label: "Completed weekly set-volume change",
    value: volume.completedSetChangeRatio,
    confidence: 0.72,
    source: "completed_training_history"
  });

  if (Number(nutrition?.loggedDayCount || 0) > 0) addNode(nodes, {
    id: "nutrition_coverage",
    type: "observation",
    label: "Recent nutrition log coverage",
    value: {
      loggedDays: Number(nutrition.loggedDayCount || 0),
      averageCalories: finiteOrNull(nutrition.averageLoggedCalories ?? nutrition.averageCaloriesPerLoggedDay),
      averageProteinG: finiteOrNull(nutrition.averageLoggedProteinG ?? nutrition.averageProteinPerLoggedDay)
    },
    confidence: Number(nutrition.loggedDayCount || 0) >= 5 ? 0.58 : 0.42,
    source: "meal_logs",
    caution: "Logged days may be partial."
  });

  for (const [key, active] of Object.entries(reported)) {
    if (!active) continue;
    addNode(nodes, {
      id: `reported_${snake(key)}`,
      type: "user_report",
      label: humanize(key),
      value: true,
      confidence: 0.78,
      source: "user_language"
    });
  }

  const allSignals = [
    ...(Array.isArray(coachingState?.signals) ? coachingState.signals : []),
    ...(Array.isArray(longitudinalState?.signals) ? longitudinalState.signals : [])
  ];
  for (const item of allSignals.slice(0, 12)) {
    const id = `signal_${item.id}`;
    addNode(nodes, {
      id,
      type: "derived_signal",
      label: item.id,
      value: item.summary || true,
      confidence: confidenceNumber(item.confidence),
      source: "ari_derived_state",
      meta: { evidence: Array.isArray(item.evidence) ? item.evidence.slice(0, 6) : [] }
    });
    connectSignal(edges, item.id, id, nodes);
  }

  const outcomes = parseOutcomeMemories(context?.relevantMemory);
  outcomes.slice(0, 6).forEach((outcome, index) => {
    addNode(nodes, {
      id: `prior_outcome_${index + 1}`,
      type: "prior_outcome",
      label: `Prior ${outcome.direction} reported outcome`,
      value: outcome.text,
      confidence: 0.62,
      source: "durable_memory"
    });
  });

  if (goal !== "unknown" && weight?.available) {
    edges.push({ from: "goal", to: "weight_velocity", relation: "evaluated_by" });
  }
  if (nodes.some((item) => item.id === "training_adherence") && nodes.some((item) => item.id === "performance_trajectory")) {
    edges.push({ from: "training_adherence", to: "performance_trajectory", relation: "conditions_interpretation_of" });
  }
  if (nodes.some((item) => item.id === "nutrition_coverage") && nodes.some((item) => item.id === "weight_velocity")) {
    edges.push({ from: "nutrition_coverage", to: "weight_velocity", relation: "may_help_explain" });
  }

  return {
    nodes: nodes.slice(0, 26),
    edges: edges.slice(0, 32),
    outcomeMemoryCount: outcomes.length,
    nodeCount: nodes.length,
    edgeCount: edges.length
  };
}

export function rankHypotheses({ evidenceGraph = {}, coachingState = null, longitudinalState = null } = {}) {
  const signals = new Set([
    ...(coachingState?.signals || []).map((item) => item.id),
    ...(longitudinalState?.signals || []).map((item) => item.id)
  ]);
  const reported = coachingState?.evidence?.reported || {};
  const adherence = longitudinalState?.training?.adherence || {};
  const progression = longitudinalState?.training?.progression || {};
  const weight = longitudinalState?.weight || {};
  const goal = coachingState?.goal || "unknown";
  const outcomes = (evidenceGraph?.nodes || []).filter((node) => node.type === "prior_outcome");

  const candidates = [];

  candidates.push(hypothesis({
    id: "execution_gap",
    label: "Execution/adherence is limiting the signal",
    support: [
      support(adherence.rate !== null && adherence.rate < 0.6, 0.72, `adherence:${adherence.rate}`),
      support(signals.has("adherence_before_program_change"), 0.22, "signal:adherence_before_program_change")
    ],
    against: [support(adherence.rate !== null && adherence.rate >= 0.8, 0.42, `high_adherence:${adherence.rate}`)],
    unknowns: Number(adherence.plannedCount || 0) < 4 ? ["Need more planned/completed session exposure."] : []
  }));

  candidates.push(hypothesis({
    id: "recovery_pressure",
    label: "Recovery demand may be exceeding current recovery capacity",
    support: [
      support(signals.has("recovery_load_conflict"), 0.26, "signal:recovery_load_conflict"),
      support(signals.has("possible_recovery_or_deficit_pressure"), 0.22, "signal:possible_recovery_or_deficit_pressure"),
      support(Boolean(reported.fatigue), 0.14, "reported:fatigue"),
      support(Boolean(reported.poorSleep), 0.14, "reported:poor_sleep"),
      support(Boolean(reported.persistentSoreness), 0.12, "reported:persistent_soreness"),
      support(signals.has("broad_performance_pressure"), 0.12, "signal:broad_performance_pressure")
    ],
    against: [
      support(Number(progression.windowPrCount || 0) >= 2, 0.24, `recent_prs:${progression.windowPrCount}`)
    ],
    unknowns: !reported.fatigue && !reported.poorSleep && !reported.persistentSoreness
      ? ["Current sleep/recovery quality is not directly reported."]
      : []
  }));

  const target = finiteOrNull(weight.weeklyGoal);
  const losingFasterThanTarget = goal === "lose" && weight.available && target !== null && weight.velocityPerWeek < target - Math.max(0.35, Math.abs(target) * 0.35);
  candidates.push(hypothesis({
    id: "energy_availability_pressure",
    label: "Energy intake/deficit pressure may be contributing",
    support: [
      support(goal === "lose" && weight.direction === "down", 0.12, "goal:lose_weight_down"),
      support(losingFasterThanTarget, 0.28, `weight_velocity:${weight.velocityPerWeek}_target:${target}`),
      support(signals.has("logged_calories_below_current_target"), 0.18, "signal:logged_calories_below_target"),
      support(signals.has("possible_recovery_or_deficit_pressure"), 0.2, "signal:possible_recovery_or_deficit_pressure"),
      support(Number(progression.downCount || 0) >= 2, 0.14, `down_trends:${progression.downCount}`)
    ],
    against: [
      support(goal !== "lose" && !signals.has("logged_calories_below_current_target"), 0.18, "no_clear_deficit_context")
    ],
    unknowns: Number(longitudinalState?.nutrition?.loggedDayCount || 0) < 4
      ? ["Nutrition coverage is too incomplete to estimate intake pressure confidently."]
      : []
  }));

  candidates.push(hypothesis({
    id: "program_stimulus_mismatch",
    label: "Program stimulus/progression may need adjustment",
    support: [
      support(signals.has("multi_exercise_plateau_pattern"), 0.36, "signal:multi_exercise_plateau_pattern"),
      support(Number(progression.plateauCandidateCount || 0) >= 2, 0.22, `plateaus:${progression.plateauCandidateCount}`),
      support(adherence.rate !== null && adherence.rate >= 0.7, 0.14, `adherence:${adherence.rate}`),
      support(signals.has("meaningful_weekly_volume_change"), 0.1, "signal:meaningful_weekly_volume_change")
    ],
    against: [
      support(signals.has("adherence_before_program_change"), 0.34, "low_adherence_confounds_program_judgment"),
      support(signals.has("broad_progression_present"), 0.28, "signal:broad_progression_present")
    ],
    unknowns: Number(progression.comparableExerciseCount || 0) < 3
      ? ["Need more like-for-like exercise exposures before judging program design."]
      : []
  }));

  candidates.push(hypothesis({
    id: "normal_variability_or_measurement_noise",
    label: "Normal session variability or measurement noise",
    support: [
      support(Number(progression.comparableExerciseCount || 0) < 3, 0.32, "few_comparable_exercises"),
      support(Number(progression.downCount || 0) <= 1 && !signals.has("multi_exercise_performance_regression"), 0.3, "limited_decline_pattern"),
      support(!signals.has("broad_performance_pressure") && !signals.has("multi_exercise_plateau_pattern"), 0.18, "no_broad_longitudinal_signal")
    ],
    against: [
      support(signals.has("multi_exercise_performance_regression"), 0.32, "multiple_objective_declines"),
      support(signals.has("broad_performance_pressure"), 0.26, "broad_performance_pressure")
    ],
    unknowns: []
  }));

  // Prior outcome memories should influence confidence modestly, never decide it.
  const positiveOutcomeCount = outcomes.filter((item) => /positive/i.test(item.label)).length;
  const negativeOutcomeCount = outcomes.filter((item) => /negative/i.test(item.label)).length;
  if (positiveOutcomeCount || negativeOutcomeCount) {
    for (const item of candidates) {
      item.contextualOutcomeEvidence = { positiveOutcomeCount, negativeOutcomeCount };
    }
  }

  const ranked = candidates
    .map((item) => ({ ...item, score: round(clamp(item.score, 0, 0.98), 2) }))
    .sort((a, b) => b.score - a.score);

  ranked.forEach((item, index) => {
    item.rank = index + 1;
    item.status = index === 0
      ? (item.score >= 0.55 ? "leading" : "weak_leader")
      : index === 1 && item.score >= Math.max(0.25, ranked[0].score - 0.18)
        ? "credible_alternative"
        : "deprioritized";
  });

  return ranked.slice(0, 5);
}

export function chooseHighestValueQuestion({ hypotheses = [], coachingState = null, longitudinalState = null, metacognition = null } = {}) {
  const leading = hypotheses[0];
  const alternative = hypotheses[1];
  const reported = coachingState?.evidence?.reported || {};
  const nutritionDays = Number(longitudinalState?.nutrition?.loggedDayCount || 0);
  const candidates = [];

  if ([leading?.id, alternative?.id].includes("recovery_pressure") && !reported.fatigue && !reported.poorSleep && !reported.persistentSoreness) {
    candidates.push(question(
      "recovery_quality",
      "Has your sleep or recovery noticeably worsened during the same period as the performance change?",
      0.92,
      "This helps separate recovery pressure from program-design or normal-variability explanations."
    ));
  }

  if ([leading?.id, alternative?.id].includes("energy_availability_pressure") && nutritionDays < 4) {
    candidates.push(question(
      "nutrition_coverage",
      "Are your recent meal logs close to complete, or are a lot of calories/protein missing from the log?",
      0.9,
      "Incomplete logs can make an apparent energy-deficit explanation look stronger than the evidence supports."
    ));
  }

  if ([leading?.id, alternative?.id].includes("program_stimulus_mismatch") && Number(longitudinalState?.training?.progression?.comparableExerciseCount || 0) < 3) {
    candidates.push(question(
      "comparable_exposure",
      "Have the exercise order, rep targets, or effort level changed recently on the lifts that look stalled?",
      0.86,
      "Like-for-like exposure is needed before calling a repeated performance a true plateau."
    ));
  }

  if (metacognition?.confidence === "limited") {
    candidates.push(question(
      "missing_core_evidence",
      `Can we fill the missing ${Array.isArray(metacognition?.missingEvidence) ? metacognition.missingEvidence.join("/") : "training"} data before changing the plan?`,
      0.82,
      "The current decision is underdetermined by available app data."
    ));
  }

  candidates.sort((a, b) => b.decisionValue - a.decisionValue);
  return candidates[0] || null;
}

export function designExperiment({ turn = {}, hypotheses = [], nextQuestion = null, coachingState = null, longitudinalState = null } = {}) {
  const leading = hypotheses[0];
  const alternative = hypotheses[1];
  const reported = coachingState?.evidence?.reported || {};
  const pain = Boolean(reported.painOrInjury);

  if (pain) {
    return {
      readiness: "blocked_by_safety",
      reason: "Pain/injury language is present. Performance experimentation should not take priority over evaluating the constraint safely."
    };
  }

  if (!leading || leading.score < 0.32) {
    return {
      readiness: "collect_data",
      reason: "No explanation has enough evidence to justify changing a meaningful variable yet.",
      nextQuestion
    };
  }

  if (nextQuestion && alternative && Math.abs(leading.score - alternative.score) <= 0.16) {
    return {
      readiness: "collect_data",
      reason: "Two explanations remain close enough that one high-value answer could change the decision.",
      nextQuestion
    };
  }

  const common = {
    hypothesisId: leading.id,
    hypothesis: leading.label,
    baseline: baselineSummary({ coachingState, longitudinalState }),
    principle: "Change one important variable where practical; keep the rest of the plan stable enough to interpret the result.",
    userConfirmationRequiredBeforeMutation: true
  };

  if (leading.id === "execution_gap") {
    return {
      readiness: "ready",
      ...common,
      durationDays: 14,
      intervention: "Keep the current program design stable and prioritize completing the planned sessions before judging whether the program itself needs changing.",
      holdConstant: ["exercise selection", "planned progression method", "major calorie target changes"],
      measure: ["planned vs completed sessions", "comparable lift performance", "reported recovery"],
      supportsHypothesisIf: "Performance becomes easier to interpret as adherence rises, without needing a major program rewrite.",
      weakensHypothesisIf: "Adherence becomes high but multiple comparable lifts still stall or decline across repeated exposures."
    };
  }

  if (leading.id === "energy_availability_pressure") {
    return {
      readiness: "ready",
      ...common,
      durationDays: 12,
      intervention: "Keep training structure stable and consistently meet the user's configured nutrition target instead of intentionally undershooting it during the observation window.",
      holdConstant: ["exercise selection", "set/rep targets", "training schedule as practical"],
      measure: ["weight velocity", "performance on 2–4 comparable lifts", "hunger/energy/recovery", "nutrition logging coverage"],
      supportsHypothesisIf: "Performance/recovery improves while weight trajectory remains acceptably aligned with the goal.",
      weakensHypothesisIf: "Performance pressure persists despite consistent target intake and comparable training exposure."
    };
  }

  if (leading.id === "recovery_pressure") {
    return {
      readiness: nextQuestion ? "collect_data" : "ready",
      ...common,
      durationDays: 10,
      intervention: "Keep the program stable and deliberately improve one measurable recovery variable that is actually deficient, rather than changing training and nutrition simultaneously.",
      holdConstant: ["major exercise changes", "major calorie-target changes"],
      measure: ["sleep/recovery marker chosen by the user", "comparable lift performance", "persistent soreness/fatigue"],
      supportsHypothesisIf: "Recovery markers and performance improve together after the recovery variable improves.",
      weakensHypothesisIf: "Recovery improves but repeated comparable performance remains pressured."
    };
  }

  if (leading.id === "program_stimulus_mismatch") {
    return {
      readiness: "ready",
      ...common,
      durationDays: 14,
      intervention: "Change only one progression/stimulus variable on the affected exercise(s), not the entire weekly program, while preserving the rest of the plan.",
      holdConstant: ["unaffected exercise selection", "nutrition target", "weekly schedule as practical"],
      measure: ["exercise-specific reps/weight/estimated strength", "completed sets", "reported effort/recovery"],
      supportsHypothesisIf: "The affected exercise resumes progression across repeated comparable sessions after the narrow change.",
      weakensHypothesisIf: "The exercise remains stalled while broader recovery or performance signals worsen."
    };
  }

  return {
    readiness: "collect_data",
    ...common,
    durationDays: 2,
    intervention: "Do not change the plan yet. Collect two or three more comparable exposures before treating the pattern as actionable.",
    holdConstant: ["exercise order", "rep target", "major nutrition changes"],
    measure: ["like-for-like exercise performance", "recovery context"],
    supportsHypothesisIf: "The apparent change disappears or varies normally across comparable sessions.",
    weakensHypothesisIf: "The same direction repeats across several comparable exposures or spreads across multiple exercises."
  };
}

function baselineSummary({ coachingState = null, longitudinalState = null } = {}) {
  return {
    goal: coachingState?.goal || "unknown",
    weightVelocityPerWeek: longitudinalState?.weight?.available ? longitudinalState.weight.velocityPerWeek : null,
    adherenceRate: finiteOrNull(longitudinalState?.training?.adherence?.rate),
    progression: {
      up: Number(longitudinalState?.training?.progression?.upCount || 0),
      stable: Number(longitudinalState?.training?.progression?.stableCount || 0),
      down: Number(longitudinalState?.training?.progression?.downCount || 0),
      plateaus: Number(longitudinalState?.training?.progression?.plateauCandidateCount || 0),
      recentWindowPrs: Number(longitudinalState?.training?.progression?.windowPrCount || 0)
    }
  };
}

function hypothesis({ id, label, support = [], against = [], unknowns = [] }) {
  const supporting = support.filter(Boolean);
  const contradicting = against.filter(Boolean);
  const positive = supporting.reduce((sum, item) => sum + item.weight, 0);
  const negative = contradicting.reduce((sum, item) => sum + item.weight, 0);
  return {
    id,
    label,
    score: 0.12 + positive - negative,
    supportingEvidence: supporting.map((item) => item.evidence),
    contradictingEvidence: contradicting.map((item) => item.evidence),
    unknowns: unknowns.filter(Boolean).slice(0, 4)
  };
}

function support(condition, weight, evidence) {
  return condition ? { weight, evidence } : null;
}

function question(id, text, decisionValue, why) {
  return { id, text, decisionValue, why };
}

function parseOutcomeMemories(value = "") {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter((line) => /User reported a (positive|negative|mixed) outcome after recent/i.test(line))
    .map((line) => ({
      direction: line.match(/User reported a (positive|negative|mixed) outcome/i)?.[1] || "mixed",
      text: line.slice(0, 700)
    }));
}

function connectSignal(edges, signalId, nodeId, nodes) {
  const mappings = {
    adherence_before_program_change: ["training_adherence", "performance_trajectory"],
    broad_performance_pressure: ["performance_trajectory"],
    multi_exercise_plateau_pattern: ["performance_trajectory", "training_adherence"],
    broad_progression_present: ["performance_trajectory"],
    meaningful_weekly_volume_change: ["weekly_volume_change"],
    weight_velocity_against_goal: ["goal", "weight_velocity"],
    weight_velocity_differs_from_target: ["goal", "weight_velocity"],
    logged_calories_below_current_target: ["nutrition_coverage"],
    possible_recovery_or_deficit_pressure: ["weight_velocity", "performance_trajectory"],
    recovery_load_conflict: ["performance_trajectory"],
    sleep_performance_link_worth_checking: ["performance_trajectory", "reported_poor_sleep"]
  };
  for (const from of mappings[signalId] || []) {
    if (nodes.some((item) => item.id === from)) edges.push({ from, to: nodeId, relation: "supports" });
  }
}

function addNode(nodes, value) {
  if (!value?.id || nodes.some((item) => item.id === value.id)) return;
  nodes.push(value);
}

function confidenceNumber(value) {
  if (typeof value === "number") return clamp(value, 0, 1);
  const text = String(value || "").toLowerCase();
  if (text === "high") return 0.88;
  if (text === "moderate") return 0.7;
  if (text === "low") return 0.48;
  return 0.55;
}

function normalizeGoal(value) {
  const text = String(value || "").toLowerCase();
  if (/lose|loss|cut|lean/.test(text)) return "lose";
  if (/gain|bulk|muscle/.test(text)) return "gain";
  if (/maintain|maintenance/.test(text)) return "maintain";
  return "unknown";
}

function signed(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  return `${number >= 0 ? "+" : ""}${round(number, 2)}`;
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function snake(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase();
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}
