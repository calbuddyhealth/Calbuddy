// ARI vNext — longitudinal progress and program-adjustment evidence.
// Converts multi-week ARI XP history into compact trend signals for the model.
// This layer never diagnoses, never mutates state, and never treats one session as a trend.

export const LONGITUDINAL_STATE_VERSION = "1.0.0";

export function deriveLongitudinalState({ route = {}, context = {} } = {}) {
  if (!route?.training && !route?.nutrition && !route?.goals && !route?.coachingState) {
    return null;
  }

  const weight = deriveWeightVelocity(context?.recentWeights, context?.goals);
  const training = deriveTrainingTrajectory(context?.training, context?.recentTraining);
  const nutrition = deriveNutritionTrajectory(context?.recentMeals);
  const signals = [];

  if (weight.available && weight.goalDirection !== "unknown") {
    const movingAgainstGoal =
      (weight.goalDirection === "down" && weight.velocityPerWeek > 0.2) ||
      (weight.goalDirection === "up" && weight.velocityPerWeek < -0.2);

    if (movingAgainstGoal) {
      signals.push(signal(
        "weight_velocity_against_goal",
        "moderate",
        "The available multi-day weight trend is moving opposite the stated goal direction.",
        [
          `velocity_per_week:${signed(weight.velocityPerWeek)}`,
          `span_days:${weight.spanDays}`,
          `points:${weight.pointCount}`,
          `goal_direction:${weight.goalDirection}`
        ]
      ));
    }

    if (
      weight.weeklyGoal !== null &&
      Math.abs(weight.weeklyGoal) >= 0.1 &&
      Math.abs(weight.velocityPerWeek - weight.weeklyGoal) >= Math.max(0.5, Math.abs(weight.weeklyGoal) * 0.75)
    ) {
      signals.push(signal(
        "weight_velocity_differs_from_target",
        "moderate",
        "Observed weight velocity differs materially from the user's configured weekly weight-change target.",
        [
          `observed_per_week:${signed(weight.velocityPerWeek)}`,
          `target_per_week:${signed(weight.weeklyGoal)}`,
          `span_days:${weight.spanDays}`
        ]
      ));
    }
  }

  if (training.adherence.plannedCount >= 4 && training.adherence.rate !== null && training.adherence.rate < 0.6) {
    signals.push(signal(
      "adherence_before_program_change",
      "moderate",
      "A substantial share of recently planned workouts were not completed, so program effectiveness is difficult to judge from progression alone.",
      [
        `planned:${training.adherence.plannedCount}`,
        `completed:${training.adherence.completedCount}`,
        `missed:${training.adherence.missedCount}`,
        `adherence_rate:${training.adherence.rate}`
      ]
    ));
  }

  if (
    training.progression.plateauCandidateCount >= 2 &&
    training.adherence.completedCount >= 6 &&
    (training.adherence.rate === null || training.adherence.rate >= 0.7)
  ) {
    signals.push(signal(
      "multi_exercise_plateau_pattern",
      "moderate",
      "Multiple exercises show repeated recent performances without meaningful improvement despite reasonably consistent training exposure.",
      training.progression.plateauCandidates.slice(0, 4).map((item) => `plateau_candidate:${item.name}`)
    ));
  }

  if (training.progression.windowPrCount >= 2) {
    signals.push(signal(
      "broad_progression_present",
      "moderate",
      "Multiple exercises reached their best performance within the available recent history window.",
      training.progression.windowPrs.slice(0, 4).map((item) => `recent_window_pr:${item.name}`)
    ));
  }

  if (training.progression.downCount >= 2 && training.progression.upCount === 0) {
    signals.push(signal(
      "broad_performance_pressure",
      "low",
      "Several comparable exercise trends are down while none of the available comparable trends are up.",
      [
        `down_trends:${training.progression.downCount}`,
        `stable_trends:${training.progression.stableCount}`,
        `up_trends:${training.progression.upCount}`
      ]
    ));
  }

  if (training.volumeChange.available && Math.abs(training.volumeChange.completedSetChangeRatio) >= 0.35) {
    signals.push(signal(
      "meaningful_weekly_volume_change",
      "low",
      "Completed training-set volume changed substantially between the two most recent comparable completed weeks.",
      [
        `completed_set_change_ratio:${training.volumeChange.completedSetChangeRatio}`,
        `latest_completed_sets:${training.volumeChange.latestCompletedSets}`,
        `previous_completed_sets:${training.volumeChange.previousCompletedSets}`
      ]
    ));
  }

  const programDecision = decideProgramAdjustment({ training, weight, signals });

  return {
    version: LONGITUDINAL_STATE_VERSION,
    weight,
    training,
    nutrition,
    signals,
    programDecision,
    confidenceNote: "Longitudinal signals are limited to the ARI XP history currently available. Recent-window PRs are not lifetime PR claims, and plateau candidates are not proof that adaptation has stopped."
  };
}

export function longitudinalStateToInstruction(state = null) {
  if (!state) return "";

  return [
    "LONGITUDINAL COACHING STATE",
    "Use this to reason across weeks instead of reacting to one workout, weigh-in, or meal.",
    "Distinguish an adherence problem from a program-design problem. Do not recommend a major program rewrite merely because several planned sessions were missed.",
    "Treat recent-window PRs as evidence of progression, not lifetime records.",
    "Treat plateau candidates as prompts to inspect progression, effort, recovery, exercise order, rep targets, and training exposure before changing the program.",
    "Weight velocity is a trend estimate from dated measurements and can still be distorted by hydration and short windows.",
    "When evidence conflicts, explain the conflict and identify the next highest-value data point or action.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 11000);
}

export function deriveWeightVelocity(rows = [], goals = {}) {
  const points = (Array.isArray(rows) ? rows : [])
    .map((item) => ({
      value: finiteOrNull(item?.value ?? item?.weight ?? item?.weight_lbs),
      date: parseDate(item?.date ?? item?.logged_at ?? item?.created_at)
    }))
    .filter((item) => item.value !== null && item.date !== null)
    .sort((a, b) => a.date - b.date);

  const uniqueByDay = [];
  const seen = new Set();
  for (const point of points) {
    const key = isoDay(point.date);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueByDay.push(point);
  }

  const goalText = String(goals?.goalType ?? goals?.goal ?? "").toLowerCase();
  const goalDirection = /lose|loss|cut|lean/.test(goalText)
    ? "down"
    : /gain|bulk|muscle/.test(goalText)
      ? "up"
      : /maintain|maintenance/.test(goalText)
        ? "stable"
        : "unknown";

  const weeklyGoal = firstFinite([
    goals?.weeklyWeightChangeGoal,
    goals?.weekly_weight_change_goal,
    goals?.weeklyWeightChange,
    goals?.weekly_weight_change
  ]);

  if (uniqueByDay.length < 3) {
    return {
      available: false,
      pointCount: uniqueByDay.length,
      spanDays: uniqueByDay.length > 1 ? dayDiff(uniqueByDay[0].date, uniqueByDay[uniqueByDay.length - 1].date) : 0,
      velocityPerWeek: null,
      direction: "unknown",
      latest: uniqueByDay.at(-1)?.value ?? null,
      oldest: uniqueByDay[0]?.value ?? null,
      goalDirection,
      weeklyGoal
    };
  }

  const spanDays = dayDiff(uniqueByDay[0].date, uniqueByDay[uniqueByDay.length - 1].date);
  if (spanDays < 5) {
    return {
      available: false,
      pointCount: uniqueByDay.length,
      spanDays,
      velocityPerWeek: null,
      direction: "unknown",
      latest: uniqueByDay.at(-1).value,
      oldest: uniqueByDay[0].value,
      goalDirection,
      weeklyGoal
    };
  }

  const startMs = uniqueByDay[0].date;
  const xs = uniqueByDay.map((point) => (point.date - startMs) / 86400000);
  const ys = uniqueByDay.map((point) => point.value);
  const xMean = average(xs);
  const yMean = average(ys);
  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < xs.length; index += 1) {
    numerator += (xs[index] - xMean) * (ys[index] - yMean);
    denominator += (xs[index] - xMean) ** 2;
  }

  const slopePerDay = denominator > 0 ? numerator / denominator : 0;
  const velocityPerWeek = round(slopePerDay * 7, 2);

  return {
    available: true,
    pointCount: uniqueByDay.length,
    spanDays,
    velocityPerWeek,
    direction: velocityPerWeek > 0.15 ? "up" : velocityPerWeek < -0.15 ? "down" : "stable",
    latest: uniqueByDay.at(-1).value,
    oldest: uniqueByDay[0].value,
    netChange: round(uniqueByDay.at(-1).value - uniqueByDay[0].value, 1),
    goalDirection,
    weeklyGoal
  };
}

function deriveTrainingTrajectory(training = {}, recentTraining = []) {
  const supplied = training?.longitudinal && typeof training.longitudinal === "object"
    ? training.longitudinal
    : {};
  const performance = Array.isArray(training?.performanceTrends) ? training.performanceTrends : [];
  const recent = Array.isArray(recentTraining) ? recentTraining : [];
  const recentWorkouts = recent.filter((item) => item?.type === "workout");
  const plannedCount = finiteOrNull(supplied?.adherence?.plannedCount) ?? recentWorkouts.length;
  const completedCount = finiteOrNull(supplied?.adherence?.completedCount) ?? recentWorkouts.filter((item) => item?.completed === true).length;
  const missedCount = finiteOrNull(supplied?.adherence?.missedCount) ?? Math.max(0, plannedCount - completedCount);
  const adherenceRate = plannedCount > 0 ? round(completedCount / plannedCount, 2) : null;

  const windowPrs = arrayOfObjects(supplied?.progression?.windowPrs).slice(0, 8);
  const plateauCandidates = arrayOfObjects(supplied?.progression?.plateauCandidates).slice(0, 8);
  const upCount = finiteOrNull(supplied?.progression?.upCount) ?? performance.filter((item) => item?.direction === "up").length;
  const stableCount = finiteOrNull(supplied?.progression?.stableCount) ?? performance.filter((item) => item?.direction === "stable").length;
  const downCount = finiteOrNull(supplied?.progression?.downCount) ?? performance.filter((item) => item?.direction === "down").length;
  const weeklySummaries = arrayOfObjects(supplied?.weeklySummaries).slice(0, 8);
  const volumeChange = normalizeVolumeChange(supplied?.volumeChange, weeklySummaries);

  return {
    adherence: {
      windowDays: finiteOrNull(supplied?.adherence?.windowDays) ?? null,
      plannedCount,
      completedCount,
      missedCount,
      rate: finiteOrNull(supplied?.adherence?.rate) ?? adherenceRate
    },
    progression: {
      comparableExerciseCount: finiteOrNull(supplied?.progression?.comparableExerciseCount) ?? performance.length,
      upCount,
      stableCount,
      downCount,
      windowPrCount: finiteOrNull(supplied?.progression?.windowPrCount) ?? windowPrs.length,
      windowPrs,
      plateauCandidateCount: finiteOrNull(supplied?.progression?.plateauCandidateCount) ?? plateauCandidates.length,
      plateauCandidates
    },
    weeklySummaries,
    volumeChange,
    muscleFrequency: arrayOfObjects(supplied?.muscleFrequency).slice(0, 16),
    bodyPartSetVolume: arrayOfObjects(supplied?.bodyPartSetVolume).slice(0, 16)
  };
}

function deriveNutritionTrajectory(recentMeals = []) {
  const days = new Map();
  for (const meal of Array.isArray(recentMeals) ? recentMeals : []) {
    const date = String(meal?.date || meal?.nutrition_date || meal?.created_at || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const row = days.get(date) || { calories: 0, proteinG: 0, mealCount: 0 };
    row.calories += Number(meal?.calories || 0);
    row.proteinG += Number(meal?.proteinG ?? meal?.protein_g ?? 0);
    row.mealCount += 1;
    days.set(date, row);
  }

  const values = [...days.values()].filter((row) => row.mealCount > 0);
  return {
    loggedDayCount: values.length,
    averageLoggedCalories: values.length ? round(average(values.map((row) => row.calories)), 0) : null,
    averageLoggedProteinG: values.length ? round(average(values.map((row) => row.proteinG)), 1) : null,
    coverageCaution: "Meal-history coverage may contain partial days; use this as supporting evidence rather than a precise intake average."
  };
}

function normalizeVolumeChange(value = {}, weeklySummaries = []) {
  if (value && typeof value === "object" && value.available === true) {
    return {
      available: true,
      latestWeek: value.latestWeek || null,
      previousWeek: value.previousWeek || null,
      latestCompletedSets: finiteOrNull(value.latestCompletedSets) ?? 0,
      previousCompletedSets: finiteOrNull(value.previousCompletedSets) ?? 0,
      completedSetChangeRatio: finiteOrNull(value.completedSetChangeRatio) ?? 0,
      latestVolumeLoad: finiteOrNull(value.latestVolumeLoad),
      previousVolumeLoad: finiteOrNull(value.previousVolumeLoad),
      volumeLoadChangeRatio: finiteOrNull(value.volumeLoadChangeRatio)
    };
  }

  const comparable = weeklySummaries.filter((week) => Number(week?.completedSessions || 0) >= 2);
  if (comparable.length < 2) return { available: false };

  const latest = comparable[0];
  const previous = comparable[1];
  const latestSets = Number(latest?.completedSets || 0);
  const previousSets = Number(previous?.completedSets || 0);

  return {
    available: previousSets > 0,
    latestWeek: latest?.weekKey || null,
    previousWeek: previous?.weekKey || null,
    latestCompletedSets: latestSets,
    previousCompletedSets: previousSets,
    completedSetChangeRatio: previousSets > 0 ? round((latestSets - previousSets) / previousSets, 2) : 0,
    latestVolumeLoad: finiteOrNull(latest?.volumeLoad),
    previousVolumeLoad: finiteOrNull(previous?.volumeLoad),
    volumeLoadChangeRatio: ratioChange(latest?.volumeLoad, previous?.volumeLoad)
  };
}

function decideProgramAdjustment({ training, weight, signals } = {}) {
  const ids = new Set((signals || []).map((item) => item.id));

  if (ids.has("adherence_before_program_change")) {
    return {
      stance: "hold_major_changes",
      reason: "Recent adherence is too incomplete to separate a program problem from an execution problem.",
      nextCheck: "Improve or explain missed-session coverage before judging the program."
    };
  }

  if (ids.has("multi_exercise_plateau_pattern")) {
    return {
      stance: "inspect_then_adjust",
      reason: "Repeated plateau candidates are present despite enough completed exposure to justify a closer program review.",
      nextCheck: "Inspect exercise-level effort, rep targets, recovery, weekly volume, and progression method before changing multiple exercises."
    };
  }

  if (ids.has("broad_progression_present")) {
    return {
      stance: "preserve_working_plan",
      reason: "Multiple recent-window performance bests suggest the current plan is still producing progression.",
      nextCheck: "Preserve productive work unless recovery, pain, schedule, or goal constraints require a change."
    };
  }

  if (training?.progression?.downCount >= 2) {
    return {
      stance: "investigate_before_adding_load",
      reason: "Several comparable performance trends are down without enough evidence yet to blame the program itself.",
      nextCheck: weight?.available
        ? "Compare recovery, weight velocity, nutrition coverage, and recent volume before adding more training stress."
        : "Compare recovery, nutrition coverage, recent volume, and exercise context before adding more training stress."
    };
  }

  return {
    stance: "insufficient_longitudinal_evidence",
    reason: "The available multi-week evidence does not justify a major program change by itself.",
    nextCheck: "Continue collecting consistent comparable training and body-weight data."
  };
}

function signal(id, confidence, summary, evidence = []) {
  return { id, confidence, summary, evidence: evidence.filter(Boolean).slice(0, 8) };
}

function arrayOfObjects(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function firstFinite(values = []) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number !== null) return number;
  }
  return null;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseDate(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isoDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function dayDiff(start, end) {
  return Math.max(0, Math.round((end - start) / 86400000));
}

function average(values = []) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
}

function ratioChange(latest, previous) {
  const left = finiteOrNull(latest);
  const right = finiteOrNull(previous);
  if (left === null || right === null || right === 0) return null;
  return round((left - right) / right, 2);
}

function signed(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${round(number, 2)}`;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
