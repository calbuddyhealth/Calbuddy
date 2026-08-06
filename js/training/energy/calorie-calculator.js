// =====================================================
// ARI REBIRTH
// File: js/training/energy/calorie-calculator.js
// Version: 1.0.0
// Purpose:
//   Unified calorie-burn estimation for ARI Training.
//
// Design:
//   - Uses MET data from met-values.js.
//   - Uses intensity metadata from intensity-levels.js.
//   - Supports body weight in lb or kg.
//   - Supports direct activity IDs and custom MET values.
//   - Preserves enough metadata to show users that the
//     calorie value is an estimate rather than a measurement.
//   - Leaves room for future wearable-derived energy data.
// =====================================================

import MetValues from "./met-values.js";
import IntensityLevels from "./intensity-levels.js";

const VERSION = "1.0.0";
const SOURCE = "js/training/energy/calorie-calculator";

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}

function normalizePositiveNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number) &&
    number > 0
      ? number
      : null;
}

function poundsToKilograms(lb) {
  const pounds =
    normalizePositiveNumber(lb);

  if (!pounds) {
    return null;
  }

  return pounds * 0.45359237;
}

function kilogramsToPounds(kg) {
  const kilograms =
    normalizePositiveNumber(kg);

  if (!kilograms) {
    return null;
  }

  return kilograms / 0.45359237;
}

function resolveWeightKg({
  weightKg = null,
  weightLb = null
} = {}) {
  const kg =
    normalizePositiveNumber(weightKg);

  if (kg) {
    return kg;
  }

  const lb =
    normalizePositiveNumber(weightLb);

  if (!lb) {
    return null;
  }

  return poundsToKilograms(lb);
}

function calculateCaloriesFromMet({
  met,
  weightKg,
  durationMinutes
} = {}) {
  const resolvedMet =
    normalizePositiveNumber(met);

  const resolvedWeightKg =
    normalizePositiveNumber(weightKg);

  const resolvedDuration =
    normalizePositiveNumber(
      durationMinutes
    );

  if (
    !resolvedMet ||
    !resolvedWeightKg ||
    !resolvedDuration
  ) {
    return null;
  }

  const caloriesPerMinute =
    (
      resolvedMet *
      3.5 *
      resolvedWeightKg
    ) / 200;

  const calories =
    caloriesPerMinute *
    resolvedDuration;

  return {
    calories,
    roundedCalories:
      Math.round(calories),
    caloriesPerMinute,
    met:
      resolvedMet,
    weightKg:
      resolvedWeightKg,
    durationMinutes:
      resolvedDuration
  };
}

function resolveActivity({
  activityId = null,
  activity = null
} = {}) {
  if (
    activity &&
    typeof activity === "object"
  ) {
    return activity;
  }

  const candidate =
    activityId ||
    activity;

  if (!candidate) {
    return null;
  }

  return MetValues.get(
    candidate
  );
}

function resolveIntensity(
  intensity
) {
  if (!intensity) {
    return null;
  }

  if (
    typeof intensity === "object"
  ) {
    return intensity;
  }

  return IntensityLevels.get(
    intensity
  );
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
  const resolvedWeightKg =
    resolveWeightKg({
      weightKg,
      weightLb
    });

  const resolvedDuration =
    normalizePositiveNumber(
      durationMinutes
    );

  if (
    !resolvedWeightKg ||
    !resolvedDuration
  ) {
    return null;
  }

  const resolvedActivity =
    resolveActivity({
      activityId,
      activity
    });

  const resolvedIntensity =
    resolveIntensity(
      intensity
    );

  const resolvedMet =
    normalizePositiveNumber(
      customMet
    ) ||
    normalizePositiveNumber(
      resolvedActivity?.met
    );

  if (!resolvedMet) {
    return null;
  }

  const estimate =
    calculateCaloriesFromMet({
      met:
        resolvedMet,
      weightKg:
        resolvedWeightKg,
      durationMinutes:
        resolvedDuration
    });

  if (!estimate) {
    return null;
  }

  return {
    source:
      SOURCE,

    method:
      "met_estimate",

    estimated:
      true,

    activityId:
      resolvedActivity?.id ||
      normalizeText(
        activityId
      ) ||
      null,

    activityLabel:
      resolvedActivity?.label ||
      null,

    category:
      resolvedActivity?.category ||
      null,

    exerciseType:
      resolvedActivity?.exerciseType ||
      null,

    intensityId:
      resolvedIntensity?.id ||
      resolvedActivity?.intensity ||
      normalizeText(
        intensity
      ) ||
      null,

    met:
      resolvedMet,

    calories:
      estimate.calories,

    roundedCalories:
      estimate.roundedCalories,

    caloriesPerMinute:
      estimate.caloriesPerMinute,

    durationMinutes:
      estimate.durationMinutes,

    weightKg:
      estimate.weightKg,

    weightLb:
      kilogramsToPounds(
        estimate.weightKg
      ),

    note:
      "Estimated calorie burn. Actual energy expenditure can vary."
  };
}

function estimateStrengthSession({
  intensity = "moderate",
  weightKg = null,
  weightLb = null,
  durationMinutes = null
} = {}) {
  const normalizedIntensity =
    normalizeText(intensity);

  const activityId =
    normalizedIntensity ===
      "light"
      ? "strength_light"
      : normalizedIntensity ===
          "vigorous"
        ? "strength_vigorous"
        : "strength_moderate";

  return estimateActivityCalories({
    activityId,
    weightKg,
    weightLb,
    durationMinutes,
    intensity:
      normalizedIntensity
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
  const resolvedRounds =
    normalizePositiveNumber(
      rounds
    );

  const resolvedWork =
    normalizePositiveNumber(
      workSeconds
    );

  const resolvedRest =
    normalizePositiveNumber(
      restSeconds
    ) || 0;

  if (
    !resolvedRounds ||
    !resolvedWork
  ) {
    return null;
  }

  const totalSeconds =
    resolvedRounds *
    (
      resolvedWork +
      resolvedRest
    );

  const durationMinutes =
    totalSeconds / 60;

  const result =
    estimateActivityCalories({
      activityId,
      weightKg,
      weightLb,
      durationMinutes,
      intensity:
        "vigorous",
      customMet
    });

  if (!result) {
    return null;
  }

  return {
    ...result,

    intervalDetails: {
      rounds:
        resolvedRounds,
      workSeconds:
        resolvedWork,
      restSeconds:
        resolvedRest,
      totalSeconds
    }
  };
}

function compareIntensities({
  activityCategory = null,
  exerciseType = null,
  weightKg = null,
  weightLb = null,
  durationMinutes = null
} = {}) {
  const activities =
    MetValues.list({
      category:
        activityCategory,
      exerciseType
    });

  const resolvedWeightKg =
    resolveWeightKg({
      weightKg,
      weightLb
    });

  const resolvedDuration =
    normalizePositiveNumber(
      durationMinutes
    );

  if (
    !resolvedWeightKg ||
    !resolvedDuration
  ) {
    return [];
  }

  return activities
    .map(
      activity =>
        estimateActivityCalories({
          activity,
          weightKg:
            resolvedWeightKg,
          durationMinutes:
            resolvedDuration,
          intensity:
            activity.intensity
        })
    )
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.met - b.met
    );
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
  const resolvedWeightKg =
    resolveWeightKg({
      weightKg,
      weightLb
    });

  const resolvedCalories =
    normalizePositiveNumber(
      calories
    );

  return {
    exerciseId:
      exerciseId || null,

    workoutId:
      workoutId || null,

    activityId:
      activityId || null,

    intensity:
      intensity || null,

    durationMinutes:
      normalizePositiveNumber(
        durationMinutes
      ),

    weightKg:
      resolvedWeightKg,

    weightLb:
      resolvedWeightKg
        ? kilogramsToPounds(
            resolvedWeightKg
          )
        : null,

    calories:
      resolvedCalories,

    roundedCalories:
      resolvedCalories
        ? Math.round(
            resolvedCalories
          )
        : null,

    method:
      method || "met_estimate",

    wearableSource:
      wearableSource || null,

    completedAt:
      completedAt || null,

    estimated:
      method !==
        "wearable_measured"
  };
}

const AriTrainingCalorieCalculator =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    poundsToKilograms,

    kilogramsToPounds,

    calculateFromMet:
      calculateCaloriesFromMet,

    estimateActivity:
      estimateActivityCalories,

    estimateStrengthSession,

    estimateCardioSession,

    estimateIntervalSession,

    compareIntensities,

    createWorkoutEnergyRecord
  });

if (
  typeof globalThis !==
  "undefined"
) {
  const Ari =
    globalThis.Ari ||
    {};

  Ari.training =
    Ari.training ||
    {};

  Ari.training.energy =
    Ari.training.energy ||
    {};

  Ari.training.energy.calorieCalculator =
    AriTrainingCalorieCalculator;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  poundsToKilograms,
  kilogramsToPounds,
  calculateCaloriesFromMet,
  estimateActivityCalories,
  estimateStrengthSession,
  estimateCardioSession,
  estimateIntervalSession,
  compareIntensities,
  createWorkoutEnergyRecord,
  AriTrainingCalorieCalculator
};

export default AriTrainingCalorieCalculator;
