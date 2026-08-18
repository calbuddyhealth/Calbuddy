// ARI vNext — derived cross-feature coaching state.
// Turns raw ARI XP context into compact evidence signals for the model.
// Signals support judgment; they are not diagnoses and must not become rigid templates.

export const COACHING_STATE_VERSION = "1.1.0";

export function deriveCoachingState({ turn = {}, route = {}, context = {} } = {}) {
  if (!route?.training && !route?.nutrition && !route?.goals && !route?.coachingState) {
    return null;
  }

  const messageContext = [
    ...(Array.isArray(turn?.history) ? turn.history.slice(-4).map((item) => item?.content || "") : []),
    turn?.message || ""
  ].join("\n");

  const reported = detectReportedSignals(messageContext);
  const goal = normalizeGoal(context?.goals?.goalType ?? context?.goals?.goal ?? context?.user?.goalType);
  const weight = normalizeWeightSignal(context?.coachingSnapshot?.weight, context?.recentWeights);
  const nutrition = buildNutritionEvidence(context);
  const training = buildTrainingEvidence(context);
  const signals = [];

  if (training.objectiveDeclineCount >= 2) {
    signals.push(signal(
      "multi_exercise_performance_regression",
      reported.performanceDecline ? "moderate" : "low",
      "Multiple comparable exercises show lower recent performance metrics than their previous recorded session.",
      training.objectiveDeclines.slice(0, 4).map((item) => `performance_down:${item.name}`)
    ));
  } else if (training.objectiveDeclineCount === 1 && reported.performanceDecline) {
    signals.push(signal(
      "reported_performance_decline_with_data_support",
      "moderate",
      "The user's reported performance decline has at least one comparable exercise record trending down.",
      [`performance_down:${training.objectiveDeclines[0]?.name}`, "reported:performance_decline"]
    ));
  }

  if (goal === "lose" && weight.direction === "up" && weight.available) {
    signals.push(signal(
      "goal_weight_direction_mismatch",
      "moderate",
      "Recent scale direction is up while the stated goal is weight loss.",
      [weightEvidence(weight), `goal:${goal}`]
    ));
  }

  if (goal === "gain" && weight.direction === "down" && weight.available) {
    signals.push(signal(
      "goal_weight_direction_mismatch",
      "moderate",
      "Recent scale direction is down while the stated goal is weight gain.",
      [weightEvidence(weight), `goal:${goal}`]
    ));
  }

  const performancePressure = reported.performanceDecline || training.objectiveDeclineCount >= 2;

  if (
    goal === "lose" &&
    weight.direction === "down" &&
    performancePressure &&
    (reported.fatigue || reported.hunger || training.recentWorkoutCount >= 4)
  ) {
    signals.push(signal(
      "possible_recovery_or_deficit_pressure",
      "moderate",
      "Performance pressure is present while body weight is trending down and at least one recovery-demand signal is present.",
      compactEvidence([
        weightEvidence(weight),
        reported.performanceDecline ? "reported:performance_decline" : null,
        training.objectiveDeclineCount >= 2 ? `objective_declines:${training.objectiveDeclineCount}` : null,
        reported.fatigue ? "reported:fatigue" : null,
        reported.hunger ? "reported:hunger" : null,
        training.recentWorkoutCount ? `recent_workouts:${training.recentWorkoutCount}` : null
      ])
    ));
  }

  if (
    (reported.fatigue || reported.poorSleep || reported.persistentSoreness) &&
    training.recentWorkoutCount >= 4
  ) {
    signals.push(signal(
      "recovery_load_conflict",
      "moderate",
      "Recent training frequency and the user's reported recovery signals may be in tension.",
      compactEvidence([
        `recent_workouts:${training.recentWorkoutCount}`,
        reported.fatigue ? "reported:fatigue" : null,
        reported.poorSleep ? "reported:poor_sleep" : null,
        reported.persistentSoreness ? "reported:persistent_soreness" : null
      ])
    ));
  }

  if (training.maxConsecutivePlannedDays >= 4) {
    signals.push(signal(
      "dense_training_schedule",
      "low",
      "The current plan contains a dense run of consecutive planned training days.",
      [`max_consecutive_planned_days:${training.maxConsecutivePlannedDays}`]
    ));
  }

  if (reported.performanceDecline && reported.poorSleep) {
    signals.push(signal(
      "sleep_performance_link_worth_checking",
      "moderate",
      "The user reports both poorer sleep and declining performance, so sleep/recovery should be considered before changing the whole program.",
      ["reported:performance_decline", "reported:poor_sleep"]
    ));
  }

  if (nutrition.loggedDayCount >= 3 && nutrition.averageCaloriesPerLoggedDay !== null) {
    const target = finiteOrNull(context?.goals?.dailyGoal);
    if (target && nutrition.averageCaloriesPerLoggedDay < target * 0.8 && goal !== "gain") {
      signals.push(signal(
        "logged_calories_below_current_target",
        "low",
        "Across the available fully/partially logged days, recorded calories average well below the current target. Coverage may be incomplete.",
        [
          `avg_logged_calories:${nutrition.averageCaloriesPerLoggedDay}`,
          `current_target:${target}`,
          `logged_days:${nutrition.loggedDayCount}`,
          "caution:meal_log_coverage_may_be_incomplete"
        ]
      ));
    }
  }

  const priorities = rankPriorities({ signals, reported, goal, weight, training, nutrition });

  return {
    version: COACHING_STATE_VERSION,
    goal,
    evidence: {
      weight,
      training,
      nutrition,
      reported
    },
    signals,
    priorities,
    confidenceNote: "Derived from available ARI XP data and user-reported language. Training comparisons are like-for-like hints, not proof of physiological regression. Missing or partial logs reduce confidence."
  };
}

export function coachingStateToInstruction(state = null) {
  if (!state) return "";
  return [
    "DERIVED COACHING STATE",
    "Use these as evidence signals, not as conclusions you must repeat.",
    "Prefer the user's actual trend and current plan over generic fitness advice.",
    "A lower performance metric in one session can reflect rep range, technique, effort, exercise order, fatigue, or programming changes. Do not label it a true strength loss without enough evidence.",
    "If evidence is incomplete or contradictory, say what is missing instead of manufacturing precision.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 10000);
}

function buildNutritionEvidence(context = {}) {
  const meals = Array.isArray(context?.recentMeals) ? context.recentMeals : [];
  const today = context?.coachingSnapshot?.today || {};
  const days = new Map();

  for (const meal of meals) {
    const date = dateKey(meal?.date || meal?.nutrition_date || meal?.created_at);
    if (!date) continue;
    const row = days.get(date) || { calories: 0, proteinG: 0, mealCount: 0 };
    row.calories += numeric(meal?.calories);
    row.proteinG += numeric(meal?.proteinG ?? meal?.protein_g);
    row.mealCount += 1;
    days.set(date, row);
  }

  const rows = [...days.values()].filter((row) => row.mealCount > 0);
  const averageCaloriesPerLoggedDay = rows.length
    ? round(rows.reduce((sum, row) => sum + row.calories, 0) / rows.length)
    : null;
  const averageProteinPerLoggedDay = rows.length
    ? round(rows.reduce((sum, row) => sum + row.proteinG, 0) / rows.length, 1)
    : null;

  return {
    todayCalories: finiteOrNull(today?.caloriesConsumed),
    todayProteinG: finiteOrNull(today?.proteinG),
    todayMealCount: Number(today?.mealCount || 0),
    loggedDayCount: rows.length,
    averageCaloriesPerLoggedDay,
    averageProteinPerLoggedDay,
    coverageCaution: rows.length ? "Recent meal logs may represent partial days; use averages as weak evidence only." : "No recent meal-day coverage available."
  };
}

function buildTrainingEvidence(context = {}) {
  const recent = Array.isArray(context?.recentTraining) ? context.recentTraining : [];
  const weekDays = Array.isArray(context?.training?.currentWeek?.days)
    ? context.training.currentWeek.days
    : [];
  const performanceTrends = Array.isArray(context?.training?.performanceTrends)
    ? context.training.performanceTrends
    : [];

  const recentWorkouts = recent.filter((item) => item?.type === "workout");
  const completed = recentWorkouts.filter((item) => item?.completed === true).length;
  const plannedFlags = weekDays.map((day) => Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length));
  const objectiveDeclines = performanceTrends
    .filter((item) => item?.direction === "down")
    .slice(0, 6)
    .map((item) => ({
      exerciseId: item?.exerciseId || null,
      name: item?.name || "Exercise",
      latest: item?.latest || null,
      previous: item?.previous || null,
      topWeightChange: finiteOrNull(item?.topWeightChange),
      sessionCount: Number(item?.sessionCount || 0)
    }));

  return {
    recentWorkoutCount: recentWorkouts.length,
    recentCompletedCount: completed,
    recentCompletionRate: recentWorkouts.length ? round(completed / recentWorkouts.length, 2) : null,
    plannedWorkoutsThisWeek: plannedFlags.filter(Boolean).length,
    maxConsecutivePlannedDays: maxConsecutiveTrue(plannedFlags),
    comparablePerformanceCount: performanceTrends.length,
    objectiveDeclineCount: objectiveDeclines.length,
    objectiveDeclines,
    today: context?.trainingToday || null,
    todayProgress: context?.training?.todayProgress || null
  };
}

function normalizeWeightSignal(snapshot = {}, recentWeights = []) {
  if (snapshot?.available || snapshot?.latest !== undefined) {
    return {
      available: snapshot?.available === true,
      latest: finiteOrNull(snapshot?.latest),
      oldest: finiteOrNull(snapshot?.oldest),
      change: finiteOrNull(snapshot?.change),
      direction: ["up", "down", "stable"].includes(snapshot?.direction) ? snapshot.direction : "unknown",
      pointCount: Number(snapshot?.pointCount || 0)
    };
  }

  const points = (Array.isArray(recentWeights) ? recentWeights : [])
    .map((item) => ({ value: finiteOrNull(item?.value ?? item?.weight ?? item?.weight_lbs), date: item?.date || null }))
    .filter((item) => item.value !== null);

  if (points.length < 2) {
    return { available: false, latest: points[0]?.value ?? null, oldest: null, change: null, direction: "unknown", pointCount: points.length };
  }

  const latest = points[0].value;
  const oldest = points[points.length - 1].value;
  const change = round(latest - oldest, 1);
  return {
    available: true,
    latest,
    oldest,
    change,
    direction: change > 0.2 ? "up" : change < -0.2 ? "down" : "stable",
    pointCount: points.length
  };
}

function detectReportedSignals(text = "") {
  const value = String(text || "").toLowerCase();
  return {
    performanceDecline: /\b(strength (?:is )?(?:down|dropping|falling)|losing strength|getting weaker|weaker than|lifts? (?:are )?(?:down|dropping)|performance (?:is )?(?:down|worse|dropping))\b/i.test(value),
    fatigue: /\b(fatigued|fatigue|exhausted|wiped out|drained|always tired|more tired|low energy)\b/i.test(value),
    poorSleep: /\b(sleep(?:ing)? (?:bad|poorly|worse)|poor sleep|not sleeping|can't sleep|cant sleep|insomnia|waking up a lot)\b/i.test(value),
    hunger: /\b(starving|very hungry|always hungry|hungry all the time|crazy hungry|more hungry|hunger is high)\b/i.test(value),
    persistentSoreness: /\b(always sore|still sore|sore for days|persistent soreness|not recovering|recovery is bad|recovering poorly)\b/i.test(value),
    painOrInjury: /\b(injury|injured|sharp pain|joint pain|tendon pain|hurts? when|painful)\b/i.test(value)
  };
}

function normalizeGoal(value) {
  const text = String(value || "").toLowerCase();
  if (/lose|loss|cut|lean/.test(text)) return "lose";
  if (/gain|bulk|muscle/.test(text)) return "gain";
  if (/maintain|maintenance/.test(text)) return "maintain";
  return "unknown";
}

function rankPriorities({ signals = [], reported = {}, goal = "unknown", weight = {}, training = {}, nutrition = {} } = {}) {
  const priorities = [];
  const ids = new Set(signals.map((item) => item.id));

  if (reported.painOrInjury) priorities.push("Address pain/injury constraints before optimizing performance or volume.");
  if (ids.has("possible_recovery_or_deficit_pressure")) priorities.push("Check whether recovery and energy intake support the current training demand before adding more volume.");
  if (ids.has("multi_exercise_performance_regression") || ids.has("reported_performance_decline_with_data_support")) priorities.push("Compare like-for-like exercise records and recovery context before changing the whole program.");
  if (ids.has("recovery_load_conflict")) priorities.push("Review recovery quality and schedule density before assuming the program needs more work.");
  if (ids.has("goal_weight_direction_mismatch")) priorities.push("Verify adherence/coverage and the time span of the weight trend before changing the target.");
  if (reported.performanceDecline && !priorities.length) priorities.push("Compare recent performance decline against recovery, body-weight trend, and training load before changing exercises.");
  if (goal !== "unknown" && weight.available) priorities.push(`Keep recommendations aligned with the ${goal} goal and the observed ${weight.direction} weight trend.`);
  if (training.recentWorkoutCount && nutrition.todayProteinG !== null) priorities.push("Consider training demand and nutrition together rather than treating them as separate problems.");

  return priorities.slice(0, 4);
}

function signal(id, confidence, summary, evidence = []) {
  return { id, confidence, summary, evidence: compactEvidence(evidence) };
}

function weightEvidence(weight = {}) {
  return weight?.available
    ? `weight:${weight.oldest}->${weight.latest} (${weight.change >= 0 ? "+" : ""}${weight.change})`
    : null;
}

function compactEvidence(values = []) {
  return values.filter(Boolean).slice(0, 8);
}

function maxConsecutiveTrue(values = []) {
  let max = 0;
  let current = 0;
  for (const value of values) {
    current = value ? current + 1 : 0;
    max = Math.max(max, current);
  }
  return max;
}

function dateKey(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
