// =====================================================
// ARI REBIRTH
// File: js/training/energy/calorie-calculator.js
// Version: 2.0.0
// Purpose:
//   Unified calorie-burn estimation for ARI Training.
//
// V2.0.0:
//   - Preserves the standard MET calorie estimator.
//   - Adds a hybrid session model using workout composition,
//     body weight, duration, and personalized HR intensity.
//   - Uses average HR + resting HR + max HR when available.
//   - Uses peak HR only as a small interval-effort modifier.
//   - Automatically infers activity type from the live session.
//   - Requires no additional mandatory user inputs.
//   - Falls back safely to the existing MET/strength model.
// =====================================================

import MetValues from "./met-values.js";
import IntensityLevels from "./intensity-levels.js";

const VERSION = "2.0.0";
const SOURCE = "js/training/energy/calorie-calculator";

const INTENSITY_FACTORS = Object.freeze({
  very_light: 0.86,
  light: 0.92,
  moderate: 1.0,
  vigorous: 1.08,
  near_maximal: 1.13,
  maximal: 1.16
});

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function normalizePositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function poundsToKilograms(lb) {
  const pounds = normalizePositiveNumber(lb);
  return pounds ? pounds * 0.45359237 : null;
}

function kilogramsToPounds(kg) {
  const kilograms = normalizePositiveNumber(kg);
  return kilograms ? kilograms / 0.45359237 : null;
}

function resolveWeightKg({ weightKg = null, weightLb = null } = {}) {
  return normalizePositiveNumber(weightKg) || poundsToKilograms(weightLb);
}

function calculateCaloriesFromMet({ met, weightKg, durationMinutes } = {}) {
  const resolvedMet = normalizePositiveNumber(met);
  const resolvedWeightKg = normalizePositiveNumber(weightKg);
  const resolvedDuration = normalizePositiveNumber(durationMinutes);

  if (!resolvedMet || !resolvedWeightKg || !resolvedDuration) return null;

  const caloriesPerMinute =
    (resolvedMet * 3.5 * resolvedWeightKg) / 200;

  const calories = caloriesPerMinute * resolvedDuration;

  return {
    calories,
    roundedCalories: Math.round(calories),
    caloriesPerMinute,
    met: resolvedMet,
    weightKg: resolvedWeightKg,
    durationMinutes: resolvedDuration
  };
}

function resolveActivity({ activityId = null, activity = null } = {}) {
  if (activity && typeof activity === "object") return activity;
  const candidate = activityId || activity;
  return candidate ? MetValues.get(candidate) : null;
}

function resolveIntensity(intensity) {
  if (!intensity) return null;
  if (typeof intensity === "object") return intensity;
  return IntensityLevels.get(intensity);
}

function estimateActivityCalories({
  activityId = null,
  activity = null,
  weightKg = null,
  weightLb = null,
  durationMinutes = null,
  intensity = null,
  customMet = null
} = {}) {
  const resolvedWeightKg = resolveWeightKg({ weightKg, weightLb });
  const resolvedDuration = normalizePositiveNumber(durationMinutes);

  if (!resolvedWeightKg || !resolvedDuration) return null;

  const resolvedActivity = resolveActivity({ activityId, activity });
  const resolvedIntensity = resolveIntensity(intensity);
  const resolvedMet =
    normalizePositiveNumber(customMet) ||
    normalizePositiveNumber(resolvedActivity?.met);

  if (!resolvedMet) return null;

  const estimate = calculateCaloriesFromMet({
    met: resolvedMet,
    weightKg: resolvedWeightKg,
    durationMinutes: resolvedDuration
  });

  if (!estimate) return null;

  return {
    source: SOURCE,
    method: "met_estimate",
    estimated: true,
    activityId:
      resolvedActivity?.id || normalizeText(activityId) || null,
    activityLabel: resolvedActivity?.label || null,
    category: resolvedActivity?.category || null,
    exerciseType: resolvedActivity?.exerciseType || null,
    intensityId:
      resolvedIntensity?.id ||
      resolvedActivity?.intensity ||
      normalizeText(intensity) ||
      null,
    met: resolvedMet,
    calories: estimate.calories,
    roundedCalories: estimate.roundedCalories,
    caloriesPerMinute: estimate.caloriesPerMinute,
    durationMinutes: estimate.durationMinutes,
    weightKg: estimate.weightKg,
    weightLb: kilogramsToPounds(estimate.weightKg),
    note: "Estimated calorie burn. Actual energy expenditure can vary."
  };
}

function getRuntimeContext() {
  if (typeof globalThis === "undefined") return null;

  const runtime =
    globalThis.AriTrainingRuntime ||
    globalThis.Ari?.Training ||
    null;

  if (!runtime) return null;

  let profile = null;
  let session = null;

  try {
    profile = runtime.getTrainingProfile?.() || null;
  } catch {}

  try {
    session = runtime.getActiveSession?.() || null;
  } catch {}

  const averageHr = normalizePositiveNumber(
    globalThis.document?.getElementById("finalAverageHeartRateInput")?.value
  );
  const peakHr = normalizePositiveNumber(
    globalThis.document?.getElementById("finalPeakHeartRateInput")?.value
  );

  return { runtime, profile, session, averageHr, peakHr };
}

function flattenSessionExercises(session) {
  const candidates = [
    session?.exercises,
    session?.exercise_queue,
    session?.exerciseQueue,
    session?.workout?.exercises,
    session?.plan?.exercises
  ];

  for (const value of candidates) {
    if (Array.isArray(value) && value.length) return value;
  }

  return [];
}

function exerciseSearchText(exercise) {
  if (!exercise) return "";
  if (typeof exercise === "string") return normalizeText(exercise);

  return normalizeText([
    exercise.id,
    exercise.exerciseId,
    exercise.exercise_id,
    exercise.name,
    exercise.label,
    exercise.title,
    exercise.category,
    exercise.exerciseType,
    exercise.exercise_type,
    exercise.modality
  ].filter(Boolean).join(" "));
}

function pickMetIdByText(text, intensity = "moderate") {
  const value = normalizeText(text);
  const hard = ["vigorous", "near_maximal", "maximal"].includes(
    normalizeText(intensity)
  );
  const light = ["very_light", "light"].includes(normalizeText(intensity));

  if (/run|jog|sprint/.test(value)) {
    return hard ? "running_7_mph" : light ? "running_easy" : "running_6_mph";
  }
  if (/walk/.test(value)) {
    return hard ? "walking_very_brisk" : light ? "walking_easy" : "walking_brisk";
  }
  if (/bike|cycling|cycle/.test(value)) {
    return hard ? "cycling_vigorous" : light ? "cycling_easy" : "cycling_moderate";
  }
  if (/row/.test(value)) {
    return hard ? "rowing_vigorous" : light ? "rowing_light" : "rowing_moderate";
  }
  if (/elliptical/.test(value)) {
    return hard ? "elliptical_vigorous" : "elliptical_moderate";
  }
  if (/stair|stairmaster|stepmill/.test(value)) return "stair_climber";
  if (/swim/.test(value)) {
    return hard ? "swimming_laps_vigorous" : "swimming_laps_moderate";
  }
  if (/hike|hiking/.test(value)) return hard ? "hiking_hills" : "hiking";
  if (/hiit|interval/.test(value)) return "hiit";
  if (/circuit|bootcamp/.test(value)) return "circuit_training";
  if (/jump rope|skipping/.test(value)) {
    return hard ? "jump_rope_fast" : "jump_rope_moderate";
  }
  if (/basketball/.test(value)) return "basketball_general";
  if (/soccer|football/.test(value)) return "soccer_general";
  if (/tennis/.test(value)) return "tennis_general";
  if (/yoga/.test(value)) return hard ? "power_yoga" : "yoga_general";
  if (/stretch|mobility/.test(value)) return "mobility_session";
  if (/bodyweight|calisthenic|push.?up|pull.?up|burpee/.test(value)) {
    return hard ? "calisthenics_vigorous" : "calisthenics_moderate";
  }

  return hard
    ? "strength_vigorous"
    : light
      ? "strength_light"
      : "strength_moderate";
}

function resolveSessionActivityProfile({ session, intensity = "moderate" } = {}) {
  const exercises = flattenSessionExercises(session);

  if (!exercises.length) {
    const text = exerciseSearchText(session);
    const activityId = pickMetIdByText(text, intensity);
    const activity = MetValues.get(activityId);
    return activity
      ? [{ activity, share: 1, sourceText: text }]
      : [];
  }

  const resolved = exercises
    .map(exercise => {
      const text = exerciseSearchText(exercise);
      const explicitId =
        exercise?.activityId ||
        exercise?.activity_id ||
        exercise?.metActivityId ||
        exercise?.met_activity_id ||
        null;

      const activity =
        (explicitId && MetValues.get(explicitId)) ||
        MetValues.get(text) ||
        MetValues.get(pickMetIdByText(text, intensity));

      return activity ? { activity, sourceText: text } : null;
    })
    .filter(Boolean);

  if (!resolved.length) return [];

  const share = 1 / resolved.length;
  return resolved.map(item => ({ ...item, share }));
}

function classifyHeartRateContext({
  averageHeartRate,
  restingHeartRate,
  maxHeartRate
} = {}) {
  const avg = normalizePositiveNumber(averageHeartRate);
  const resting = normalizePositiveNumber(restingHeartRate);
  const max = normalizePositiveNumber(maxHeartRate);

  if (!avg || !max || max <= 0) return null;

  let percent;
  let method;

  if (resting && max > resting) {
    percent = (avg - resting) / (max - resting);
    method = "heart_rate_reserve";
  } else {
    percent = avg / max;
    method = "max_hr_percent";
  }

  percent = clamp(percent, 0, 1.3);

  let intensityId;
  if (percent < 0.4) intensityId = "very_light";
  else if (percent < 0.5) intensityId = "light";
  else if (percent < 0.7) intensityId = "moderate";
  else if (percent < 0.85) intensityId = "vigorous";
  else if (percent < 0.95) intensityId = "near_maximal";
  else intensityId = "maximal";

  return { method, percent, intensityId };
}

function estimateHybridSession({
  session = null,
  weightKg = null,
  weightLb = null,
  durationMinutes = null,
  intensity = "moderate",
  averageHeartRate = null,
  peakHeartRate = null,
  restingHeartRate = null,
  maxHeartRate = null
} = {}) {
  const resolvedWeightKg = resolveWeightKg({ weightKg, weightLb });
  const duration = normalizePositiveNumber(durationMinutes);

  if (!resolvedWeightKg || !duration) return null;

  const hr = classifyHeartRateContext({
    averageHeartRate,
    restingHeartRate,
    maxHeartRate
  });

  const resolvedIntensity = hr?.intensityId || normalizeText(intensity) || "moderate";
  const activityProfile = resolveSessionActivityProfile({
    session,
    intensity: resolvedIntensity
  });

  if (!activityProfile.length) return null;

  const baselineMet = activityProfile.reduce(
    (sum, item) => sum + (Number(item.activity.met) || 0) * item.share,
    0
  );

  if (!baselineMet) return null;

  const intensityFactor = INTENSITY_FACTORS[resolvedIntensity] || 1;

  let peakFactor = 1;
  const peak = normalizePositiveNumber(peakHeartRate);
  const max = normalizePositiveNumber(maxHeartRate);
  if (peak && max) {
    const peakPercent = peak / max;
    if (peakPercent >= 0.95) peakFactor = 1.035;
    else if (peakPercent >= 0.9) peakFactor = 1.02;
  }

  // Keep personalization bounded. MET remains the primary activity anchor.
  const adjustedMet = clamp(baselineMet * intensityFactor * peakFactor, 1.5, 18);

  const estimate = calculateCaloriesFromMet({
    met: adjustedMet,
    weightKg: resolvedWeightKg,
    durationMinutes: duration
  });

  if (!estimate) return null;

  const activityLabels = [...new Set(
    activityProfile.map(item => item.activity.label).filter(Boolean)
  )];

  return {
    source: SOURCE,
    method: "hybrid_activity_hr_estimate",
    estimated: true,
    calories: estimate.calories,
    roundedCalories: estimate.roundedCalories,
    caloriesPerMinute: estimate.caloriesPerMinute,
    durationMinutes: duration,
    weightKg: resolvedWeightKg,
    weightLb: kilogramsToPounds(resolvedWeightKg),
    baselineMet,
    adjustedMet,
    met: adjustedMet,
    intensityId: resolvedIntensity,
    heartRateMethod: hr?.method || null,
    heartRateIntensityPercent: hr?.percent || null,
    averageHeartRate: normalizePositiveNumber(averageHeartRate),
    peakHeartRate: peak,
    restingHeartRate: normalizePositiveNumber(restingHeartRate),
    maxHeartRate: max,
    activityIds: activityProfile.map(item => item.activity.id),
    activityLabels,
    note:
      "Estimated from workout type, duration, body weight, and available heart-rate intensity."
  };
}

function estimateStrengthSession({
  intensity = "moderate",
  weightKg = null,
  weightLb = null,
  durationMinutes = null,
  session = null,
  averageHeartRate = null,
  peakHeartRate = null,
  restingHeartRate = null,
  maxHeartRate = null
} = {}) {
  const context = getRuntimeContext();
  const activeSession = session || context?.session || null;
  const profile = context?.profile || {};

  const hybrid = estimateHybridSession({
    session: activeSession,
    weightKg,
    weightLb: weightLb || profile?.weightLb,
    durationMinutes,
    intensity,
    averageHeartRate: averageHeartRate || context?.averageHr,
    peakHeartRate: peakHeartRate || context?.peakHr,
    restingHeartRate: restingHeartRate || profile?.restingHeartRate,
    maxHeartRate:
      maxHeartRate ||
      profile?.effectiveMaxHeartRate ||
      profile?.confirmedMaxHeartRate ||
      profile?.estimatedMaxHeartRate
  });

  if (hybrid) return hybrid;

  const normalizedIntensity = normalizeText(intensity);
  const activityId =
    normalizedIntensity === "light"
      ? "strength_light"
      : normalizedIntensity === "vigorous"
        ? "strength_vigorous"
        : "strength_moderate";

  return estimateActivityCalories({
    activityId,
    weightKg,
    weightLb,
    durationMinutes,
    intensity: normalizedIntensity
  });
}

function estimateCardioSession({
  activityId,
  intensity = null,
  weightKg = null,
  weightLb = null,
  durationMinutes = null
} = {}) {
  return estimateActivityCalories({
    activityId,
    weightKg,
    weightLb,
    durationMinutes,
    intensity
  });
}

function estimateIntervalSession({
  activityId = "hiit",
  rounds = null,
  workSeconds = null,
  restSeconds = null,
  weightKg = null,
  weightLb = null,
  customMet = null
} = {}) {
  const resolvedRounds = normalizePositiveNumber(rounds);
  const resolvedWork = normalizePositiveNumber(workSeconds);
  const resolvedRest = normalizePositiveNumber(restSeconds) || 0;
  if (!resolvedRounds || !resolvedWork) return null;

  const totalSeconds = resolvedRounds * (resolvedWork + resolvedRest);
  const durationMinutes = totalSeconds / 60;

  const result = estimateActivityCalories({
    activityId,
    weightKg,
    weightLb,
    durationMinutes,
    intensity: "vigorous",
    customMet
  });

  return result
    ? {
        ...result,
        intervalDetails: {
          rounds: resolvedRounds,
          workSeconds: resolvedWork,
          restSeconds: resolvedRest,
          totalSeconds
        }
      }
    : null;
}

function compareIntensities({
  activityCategory = null,
  exerciseType = null,
  weightKg = null,
  weightLb = null,
  durationMinutes = null
} = {}) {
  const activities = MetValues.list({
    category: activityCategory,
    exerciseType
  });
  const resolvedWeightKg = resolveWeightKg({ weightKg, weightLb });
  const resolvedDuration = normalizePositiveNumber(durationMinutes);
  if (!resolvedWeightKg || !resolvedDuration) return [];

  return activities
    .map(activity =>
      estimateActivityCalories({
        activity,
        weightKg: resolvedWeightKg,
        durationMinutes: resolvedDuration,
        intensity: activity.intensity
      })
    )
    .filter(Boolean)
    .sort((a, b) => a.met - b.met);
}

function createWorkoutEnergyRecord({
  exerciseId = null,
  workoutId = null,
  activityId = null,
  intensity = null,
  durationMinutes = null,
  weightKg = null,
  weightLb = null,
  calories = null,
  method = "met_estimate",
  wearableSource = null,
  completedAt = null
} = {}) {
  const resolvedWeightKg = resolveWeightKg({ weightKg, weightLb });
  const resolvedCalories = normalizePositiveNumber(calories);

  return {
    exerciseId: exerciseId || null,
    workoutId: workoutId || null,
    activityId: activityId || null,
    intensity: intensity || null,
    durationMinutes: normalizePositiveNumber(durationMinutes),
    weightKg: resolvedWeightKg,
    weightLb: resolvedWeightKg ? kilogramsToPounds(resolvedWeightKg) : null,
    calories: resolvedCalories,
    roundedCalories: resolvedCalories ? Math.round(resolvedCalories) : null,
    method: method || "met_estimate",
    wearableSource: wearableSource || null,
    completedAt: completedAt || null,
    estimated: method !== "wearable_measured"
  };
}

const AriTrainingCalorieCalculator = Object.freeze({
  version: VERSION,
  source: SOURCE,
  poundsToKilograms,
  kilogramsToPounds,
  calculateFromMet: calculateCaloriesFromMet,
  estimateActivity: estimateActivityCalories,
  estimateHybridSession,
  resolveSessionActivityProfile,
  classifyHeartRateContext,
  estimateStrengthSession,
  estimateCardioSession,
  estimateIntervalSession,
  compareIntensities,
  createWorkoutEnergyRecord
});

if (typeof globalThis !== "undefined") {
  const Ari = globalThis.Ari || {};
  Ari.training = Ari.training || {};
  Ari.training.energy = Ari.training.energy || {};
  Ari.training.energy.calorieCalculator = AriTrainingCalorieCalculator;
  globalThis.Ari = Ari;
}

export {
  VERSION,
  SOURCE,
  poundsToKilograms,
  kilogramsToPounds,
  calculateCaloriesFromMet,
  estimateActivityCalories,
  estimateHybridSession,
  resolveSessionActivityProfile,
  classifyHeartRateContext,
  estimateStrengthSession,
  estimateCardioSession,
  estimateIntervalSession,
  compareIntensities,
  createWorkoutEnergyRecord,
  AriTrainingCalorieCalculator
};

export default AriTrainingCalorieCalculator;
