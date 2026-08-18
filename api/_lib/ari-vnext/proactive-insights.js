// ARI vNext — deterministic proactive insight candidates.
// Detection is free code; no LLM call happens merely because Ari noticed one.

export const ARI_PROACTIVE_INSIGHTS_VERSION = "1.0.0";

export function deriveProactiveInsights({
  coachingState = null,
  longitudinalState = null,
  scientificIntelligence = null,
  userWorldModel = null,
  decisionState = null,
  experimentLedger = null
} = {}) {
  const candidates = [];
  const progression = longitudinalState?.training?.progression || {};
  const adherence = longitudinalState?.training?.adherence || {};
  const weight = longitudinalState?.weight || {};
  const signals = new Set([
    ...(Array.isArray(coachingState?.signals) ? coachingState.signals : []).map((item) => item?.id),
    ...(Array.isArray(longitudinalState?.signals) ? longitudinalState.signals : []).map((item) => item?.id)
  ].filter(Boolean));

  if (Number(progression?.downCount || 0) >= 3) {
    candidates.push(insight({
      id: "broad_performance_regression",
      priority: "high",
      confidence: Number(progression?.comparableExerciseCount || 0) >= 4 ? 0.84 : 0.68,
      title: "Ari noticed a broader strength regression",
      reason: `${Number(progression.downCount || 0)} comparable exercise trends are currently down.`,
      trigger: "three_or_more_comparable_down_trends",
      domain: "training",
      action: "open_investigator"
    }));
  }

  if (Number(progression?.windowPrCount || 0) >= 2) {
    candidates.push(insight({
      id: "multi_pr_window",
      priority: "positive",
      confidence: 0.82,
      title: "Ari noticed a strong progression window",
      reason: `${Number(progression.windowPrCount || 0)} recent-window PR signals are present.`,
      trigger: "two_or_more_recent_prs",
      domain: "training",
      action: "celebrate_and_review"
    }));
  }

  if (adherence?.rate !== null && adherence?.rate !== undefined && Number(adherence?.plannedCount || 0) >= 6 && Number(adherence.rate) < 0.55) {
    candidates.push(insight({
      id: "adherence_drop",
      priority: "medium",
      confidence: 0.86,
      title: "Ari noticed the plan may not fit real life",
      reason: `Recent training adherence is ${Math.round(Number(adherence.rate) * 100)}% across ${Number(adherence.plannedCount || 0)} planned exposures.`,
      trigger: "sustained_adherence_below_55_percent",
      domain: "training",
      action: "review_constraints"
    }));
  }

  const goal = coachingState?.goal || "unknown";
  const target = finiteOrNull(weight?.weeklyGoal);
  if (goal === "lose" && weight?.available && target !== null && Number(weight?.spanDays || 0) >= 10) {
    const actual = finiteOrNull(weight?.velocityPerWeek);
    if (actual !== null && actual < target - Math.max(0.35, Math.abs(target) * 0.35)) {
      candidates.push(insight({
        id: "weight_loss_faster_than_target",
        priority: "medium",
        confidence: Number(weight?.pointCount || 0) >= 5 ? 0.82 : 0.67,
        title: "Ari noticed weight is moving faster than planned",
        reason: `Observed velocity is ${signed(actual)} lb/week versus a target near ${signed(target)} lb/week.`,
        trigger: "weight_velocity_materially_exceeds_loss_target",
        domain: "goals",
        action: "review_recovery_and_intake"
      }));
    }
  }

  if (Number(experimentLedger?.dueCount || 0) > 0) {
    candidates.push(insight({
      id: "experiment_review_due",
      priority: "high",
      confidence: 0.98,
      title: "Ari has an experiment ready for review",
      reason: `${Number(experimentLedger.dueCount)} tracked experiment${Number(experimentLedger.dueCount) === 1 ? " is" : "s are"} at or past the planned review date.`,
      trigger: "experiment_review_date_reached",
      domain: "fitness",
      action: "review_experiment"
    }));
  }

  const tensions = Array.isArray(userWorldModel?.tensions) ? userWorldModel.tensions : [];
  for (const tension of tensions.slice(0, 2)) {
    candidates.push(insight({
      id: `world_model_${String(tension?.id || "tension")}`,
      priority: "medium",
      confidence: finiteOrNull(tension?.confidence) ?? 0.62,
      title: "Ari noticed a goal-plan mismatch",
      reason: String(tension?.summary || "A stated goal may conflict with the pattern Ari has observed."),
      trigger: "persistent_world_model_tension",
      domain: "planning",
      action: "review_goal_tradeoff"
    }));
  }

  const calibration = decisionState?.calibration || {};
  if (calibration?.available && calibration?.tendency === "overconfident") {
    candidates.push(insight({
      id: "ari_self_calibration_overconfidence",
      priority: "internal",
      confidence: 0.9,
      title: "Ari should reduce confidence in similar predictions",
      reason: `Recent resolved predictions show a confidence/accuracy gap of ${Number(calibration.calibrationGap || 0).toFixed(2)}.`,
      trigger: "calibration_overconfidence",
      domain: "ari_self_model",
      action: "internal_calibration"
    }));
  }

  if (signals.has("possible_recovery_or_deficit_pressure") && Number(progression?.downCount || 0) >= 2) {
    candidates.push(insight({
      id: "recovery_or_deficit_pressure",
      priority: "medium",
      confidence: 0.7,
      title: "Ari noticed recovery pressure may be affecting performance",
      reason: "Multiple performance declines are occurring alongside recovery/deficit pressure signals.",
      trigger: "combined_recovery_and_performance_signal",
      domain: "training",
      action: "open_investigator"
    }));
  }

  const deduped = dedupe(candidates)
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || Number(b.confidence || 0) - Number(a.confidence || 0));

  return {
    version: ARI_PROACTIVE_INSIGHTS_VERSION,
    count: deduped.length,
    userFacingCount: deduped.filter((item) => item.priority !== "internal").length,
    shouldSurface: deduped.some((item) => ["high", "medium", "positive"].includes(item.priority)),
    primary: deduped.find((item) => item.priority !== "internal") || null,
    items: deduped.slice(0, 6)
  };
}

function insight(value) {
  return { ...value, generatedBy: "deterministic_vnext_insight_engine" };
}
function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
function priorityWeight(value) {
  if (value === "high") return 4;
  if (value === "medium") return 3;
  if (value === "positive") return 2;
  if (value === "internal") return 1;
  return 0;
}
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function signed(value) {
  const n = Number(value || 0);
  return `${n > 0 ? "+" : ""}${Math.round(n * 100) / 100}`;
}
