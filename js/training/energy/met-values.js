// =====================================================
// ARI REBIRTH
// File: js/training/energy/met-values.js
// Version: 1.0.0
// Purpose:
//   Central MET/intensity registry for ARI Training.
//
// Notes:
//   - MET values are estimates, not direct measurements.
//   - Actual energy expenditure varies by body size, technique,
//     terrain, fitness, environment, equipment, and effort.
//   - This module provides planning/logging estimates.
//   - Duration + body weight + MET can be used to estimate calories.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/energy/met-values";

const ACTIVITY_LEVELS = Object.freeze({
  light: Object.freeze({
    id: "light",
    label: "Light",
    description: "Easy effort that can usually be sustained comfortably."
  }),
  moderate: Object.freeze({
    id: "moderate",
    label: "Moderate",
    description: "Noticeable effort with increased breathing and heart rate."
  }),
  vigorous: Object.freeze({
    id: "vigorous",
    label: "Vigorous",
    description: "Hard effort with substantially increased breathing and heart rate."
  })
});

const MET_ACTIVITIES = Object.freeze([
  {
    id: "walking_easy",
    label: "Walking - Easy",
    category: "walking",
    exerciseType: "walking",
    intensity: "light",
    met: 2.8,
    aliases: ["easy walk", "casual walking", "slow walking"]
  },
  {
    id: "walking_moderate",
    label: "Walking - Moderate",
    category: "walking",
    exerciseType: "walking",
    intensity: "moderate",
    met: 3.5,
    aliases: ["moderate walk", "normal walking", "brisk-ish walk"]
  },
  {
    id: "walking_brisk",
    label: "Walking - Brisk",
    category: "walking",
    exerciseType: "walking",
    intensity: "moderate",
    met: 4.3,
    aliases: ["brisk walking", "fast walk", "power walking"]
  },
  {
    id: "walking_very_brisk",
    label: "Walking - Very Brisk",
    category: "walking",
    exerciseType: "walking",
    intensity: "vigorous",
    met: 5.0,
    aliases: ["very fast walking", "very brisk walk"]
  },
  {
    id: "walking_uphill",
    label: "Walking - Uphill",
    category: "walking",
    exerciseType: "walking",
    intensity: "vigorous",
    met: 6.0,
    aliases: ["hill walking", "incline walking", "uphill walk"]
  },
  {
    id: "treadmill_incline_walk",
    label: "Treadmill Incline Walking",
    category: "walking",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 6.0,
    aliases: ["incline treadmill", "treadmill incline"]
  },

  {
    id: "running_easy",
    label: "Running - Easy",
    category: "running",
    exerciseType: "running",
    intensity: "moderate",
    met: 7.0,
    aliases: ["easy run", "easy jogging", "recovery run"]
  },
  {
    id: "running_5_mph",
    label: "Running - 5 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 8.3,
    aliases: ["12 minute mile", "5 mph run"]
  },
  {
    id: "running_6_mph",
    label: "Running - 6 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 9.8,
    aliases: ["10 minute mile", "6 mph run"]
  },
  {
    id: "running_7_mph",
    label: "Running - 7 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 11.0,
    aliases: ["8.5 minute mile", "7 mph run"]
  },
  {
    id: "running_8_mph",
    label: "Running - 8 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 11.8,
    aliases: ["7.5 minute mile", "8 mph run"]
  },
  {
    id: "running_9_mph",
    label: "Running - 9 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 12.8,
    aliases: ["6.7 minute mile", "9 mph run"]
  },
  {
    id: "running_10_mph",
    label: "Running - 10 mph",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 14.5,
    aliases: ["6 minute mile", "10 mph run"]
  },
  {
    id: "running_hills",
    label: "Running - Hills",
    category: "running",
    exerciseType: "running",
    intensity: "vigorous",
    met: 12.0,
    aliases: ["hill running", "hill repeats", "running hills"]
  },

  {
    id: "cycling_easy",
    label: "Cycling - Easy",
    category: "cycling",
    exerciseType: "cycling",
    intensity: "light",
    met: 4.0,
    aliases: ["easy bike", "casual cycling", "easy cycling"]
  },
  {
    id: "cycling_moderate",
    label: "Cycling - Moderate",
    category: "cycling",
    exerciseType: "cycling",
    intensity: "moderate",
    met: 6.8,
    aliases: ["moderate cycling", "moderate bike"]
  },
  {
    id: "cycling_vigorous",
    label: "Cycling - Vigorous",
    category: "cycling",
    exerciseType: "cycling",
    intensity: "vigorous",
    met: 10.0,
    aliases: ["hard cycling", "vigorous cycling", "hard bike"]
  },
  {
    id: "stationary_bike_light",
    label: "Stationary Bike - Light",
    category: "cycling",
    exerciseType: "cardio",
    intensity: "light",
    met: 3.5,
    aliases: ["exercise bike light", "stationary cycling light"]
  },
  {
    id: "stationary_bike_moderate",
    label: "Stationary Bike - Moderate",
    category: "cycling",
    exerciseType: "cardio",
    intensity: "moderate",
    met: 6.8,
    aliases: ["exercise bike moderate", "stationary cycling moderate"]
  },
  {
    id: "stationary_bike_vigorous",
    label: "Stationary Bike - Vigorous",
    category: "cycling",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 10.5,
    aliases: ["exercise bike vigorous", "stationary cycling vigorous"]
  },

  {
    id: "rowing_light",
    label: "Rowing Machine - Light",
    category: "rowing",
    exerciseType: "rowing",
    intensity: "light",
    met: 4.8,
    aliases: ["light rowing", "easy rowing"]
  },
  {
    id: "rowing_moderate",
    label: "Rowing Machine - Moderate",
    category: "rowing",
    exerciseType: "rowing",
    intensity: "moderate",
    met: 7.0,
    aliases: ["moderate rowing"]
  },
  {
    id: "rowing_vigorous",
    label: "Rowing Machine - Vigorous",
    category: "rowing",
    exerciseType: "rowing",
    intensity: "vigorous",
    met: 8.5,
    aliases: ["hard rowing", "vigorous rowing"]
  },

  {
    id: "elliptical_moderate",
    label: "Elliptical - Moderate",
    category: "cardio_machine",
    exerciseType: "cardio",
    intensity: "moderate",
    met: 5.0,
    aliases: ["elliptical", "moderate elliptical"]
  },
  {
    id: "elliptical_vigorous",
    label: "Elliptical - Vigorous",
    category: "cardio_machine",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 8.0,
    aliases: ["hard elliptical", "vigorous elliptical"]
  },
  {
    id: "stair_climber",
    label: "Stair Climber",
    category: "cardio_machine",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 9.0,
    aliases: ["stair machine", "stairmaster", "stair master"]
  },

  {
    id: "strength_light",
    label: "Weight Training - Light",
    category: "strength",
    exerciseType: "strength",
    intensity: "light",
    met: 3.0,
    aliases: ["light weights", "light resistance training"]
  },
  {
    id: "strength_moderate",
    label: "Weight Training - Moderate",
    category: "strength",
    exerciseType: "strength",
    intensity: "moderate",
    met: 3.5,
    aliases: ["moderate weights", "moderate resistance training"]
  },
  {
    id: "strength_vigorous",
    label: "Weight Training - Vigorous",
    category: "strength",
    exerciseType: "strength",
    intensity: "vigorous",
    met: 6.0,
    aliases: ["heavy lifting", "vigorous resistance training", "hard weight training"]
  },
  {
    id: "circuit_training",
    label: "Circuit Training",
    category: "conditioning",
    exerciseType: "conditioning",
    intensity: "vigorous",
    met: 8.0,
    aliases: ["circuit workout", "strength circuit"]
  },
  {
    id: "calisthenics_moderate",
    label: "Calisthenics - Moderate",
    category: "calisthenics",
    exerciseType: "calisthenics",
    intensity: "moderate",
    met: 3.8,
    aliases: ["bodyweight training moderate", "moderate calisthenics"]
  },
  {
    id: "calisthenics_vigorous",
    label: "Calisthenics - Vigorous",
    category: "calisthenics",
    exerciseType: "calisthenics",
    intensity: "vigorous",
    met: 8.0,
    aliases: ["bodyweight training vigorous", "hard calisthenics"]
  },

  {
    id: "hiit",
    label: "High-Intensity Interval Training",
    category: "conditioning",
    exerciseType: "hiit",
    intensity: "vigorous",
    met: 8.0,
    aliases: ["hiit", "interval workout", "high intensity intervals"]
  },
  {
    id: "bootcamp",
    label: "Boot Camp Training",
    category: "conditioning",
    exerciseType: "conditioning",
    intensity: "vigorous",
    met: 8.0,
    aliases: ["bootcamp", "boot camp workout"]
  },
  {
    id: "jump_rope_moderate",
    label: "Jump Rope - Moderate",
    category: "conditioning",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 10.0,
    aliases: ["moderate jump rope", "skipping rope"]
  },
  {
    id: "jump_rope_fast",
    label: "Jump Rope - Fast",
    category: "conditioning",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 12.3,
    aliases: ["fast jump rope", "hard jump rope"]
  },

  {
    id: "swimming_easy",
    label: "Swimming - Easy",
    category: "swimming",
    exerciseType: "cardio",
    intensity: "moderate",
    met: 5.8,
    aliases: ["easy swimming", "recreational swimming"]
  },
  {
    id: "swimming_laps_moderate",
    label: "Swimming Laps - Moderate",
    category: "swimming",
    exerciseType: "cardio",
    intensity: "moderate",
    met: 7.0,
    aliases: ["lap swimming", "moderate swimming"]
  },
  {
    id: "swimming_laps_vigorous",
    label: "Swimming Laps - Vigorous",
    category: "swimming",
    exerciseType: "cardio",
    intensity: "vigorous",
    met: 9.8,
    aliases: ["hard swimming", "vigorous lap swimming"]
  },

  {
    id: "hiking",
    label: "Hiking",
    category: "outdoor",
    exerciseType: "endurance",
    intensity: "moderate",
    met: 6.0,
    aliases: ["hike", "trail hiking"]
  },
  {
    id: "hiking_hills",
    label: "Hiking - Steep/Hilly",
    category: "outdoor",
    exerciseType: "endurance",
    intensity: "vigorous",
    met: 7.5,
    aliases: ["steep hiking", "hill hiking"]
  },

  {
    id: "yoga_general",
    label: "Yoga - General",
    category: "mobility",
    exerciseType: "mobility",
    intensity: "light",
    met: 2.5,
    aliases: ["yoga", "general yoga"]
  },
  {
    id: "power_yoga",
    label: "Power Yoga",
    category: "mobility",
    exerciseType: "mobility",
    intensity: "moderate",
    met: 4.0,
    aliases: ["vigorous yoga", "flow yoga"]
  },
  {
    id: "stretching",
    label: "Stretching",
    category: "mobility",
    exerciseType: "flexibility",
    intensity: "light",
    met: 2.3,
    aliases: ["stretch", "flexibility session"]
  },
  {
    id: "mobility_session",
    label: "Mobility Session",
    category: "mobility",
    exerciseType: "mobility",
    intensity: "light",
    met: 2.5,
    aliases: ["mobility work", "mobility training"]
  },

  {
    id: "basketball_general",
    label: "Basketball - General",
    category: "sports",
    exerciseType: "sports_conditioning",
    intensity: "vigorous",
    met: 6.5,
    aliases: ["basketball"]
  },
  {
    id: "soccer_general",
    label: "Soccer - General",
    category: "sports",
    exerciseType: "sports_conditioning",
    intensity: "vigorous",
    met: 7.0,
    aliases: ["soccer", "football sport"]
  },
  {
    id: "tennis_general",
    label: "Tennis - General",
    category: "sports",
    exerciseType: "sports_conditioning",
    intensity: "vigorous",
    met: 7.3,
    aliases: ["tennis"]
  },
  {
    id: "boxing_bag",
    label: "Boxing - Heavy Bag",
    category: "combat",
    exerciseType: "sports_conditioning",
    intensity: "vigorous",
    met: 5.5,
    aliases: ["heavy bag", "bag work", "boxing bag"]
  },
  {
    id: "boxing_sparring",
    label: "Boxing - Sparring",
    category: "combat",
    exerciseType: "sports_conditioning",
    intensity: "vigorous",
    met: 7.8,
    aliases: ["boxing sparring", "sparring"]
  },

  {
    id: "active_recovery_walk",
    label: "Active Recovery Walk",
    category: "recovery",
    exerciseType: "recovery",
    intensity: "light",
    met: 2.8,
    aliases: ["recovery walk", "easy recovery walk"]
  }
]);

const MET_ACTIVITY_MAP = new Map(
  MET_ACTIVITIES.map(
    activity => [activity.id, activity]
  )
);

const MET_ALIAS_MAP = new Map();

for (const activity of MET_ACTIVITIES) {
  const aliases = [
    activity.id,
    activity.label,
    ...(activity.aliases || [])
  ];

  for (const alias of aliases) {
    MET_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      activity.id
    );
  }
}

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

function getMetActivity(idOrAlias) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const id =
    MET_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return MET_ACTIVITY_MAP.get(id) ||
    null;
}

function getMetActivities({
  category = null,
  exerciseType = null,
  intensity = null
} = {}) {
  const normalizedCategory =
    normalizeText(category);

  const normalizedExerciseType =
    normalizeText(exerciseType);

  const normalizedIntensity =
    normalizeText(intensity);

  return MET_ACTIVITIES.filter(
    activity => {
      if (
        normalizedCategory &&
        normalizeText(
          activity.category
        ) !== normalizedCategory
      ) {
        return false;
      }

      if (
        normalizedExerciseType &&
        normalizeText(
          activity.exerciseType
        ) !== normalizedExerciseType
      ) {
        return false;
      }

      if (
        normalizedIntensity &&
        normalizeText(
          activity.intensity
        ) !== normalizedIntensity
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchMetActivities(query) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [...MET_ACTIVITIES];
  }

  return MET_ACTIVITIES.filter(
    activity => {
      const searchable = [
        activity.id,
        activity.label,
        activity.category,
        activity.exerciseType,
        activity.intensity,
        ...(activity.aliases || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(
        normalized
      );
    }
  );
}

/*
 * Standard MET calorie estimate:
 *
 * kcal/min =
 *   MET Ã 3.5 Ã bodyWeightKg / 200
 *
 * calories =
 *   kcal/min Ã durationMinutes
 */
function estimateCaloriesFromMet({
  met,
  weightKg,
  durationMinutes
} = {}) {
  const normalizedMet =
    normalizePositiveNumber(met);

  const normalizedWeightKg =
    normalizePositiveNumber(weightKg);

  const normalizedDuration =
    normalizePositiveNumber(
      durationMinutes
    );

  if (
    !normalizedMet ||
    !normalizedWeightKg ||
    !normalizedDuration
  ) {
    return null;
  }

  const caloriesPerMinute =
    (
      normalizedMet *
      3.5 *
      normalizedWeightKg
    ) / 200;

  return {
    calories:
      caloriesPerMinute *
      normalizedDuration,

    caloriesPerMinute,

    met:
      normalizedMet,

    weightKg:
      normalizedWeightKg,

    durationMinutes:
      normalizedDuration
  };
}

function estimateActivityCalories({
  activity,
  activityId,
  weightKg,
  weightLb,
  durationMinutes
} = {}) {
  const record =
    typeof activity === "object" &&
    activity
      ? activity
      : getMetActivity(
          activityId ||
          activity
        );

  if (!record) {
    return null;
  }

  let resolvedWeightKg =
    normalizePositiveNumber(
      weightKg
    );

  if (!resolvedWeightKg) {
    const pounds =
      normalizePositiveNumber(
        weightLb
      );

    if (pounds) {
      resolvedWeightKg =
        pounds * 0.45359237;
    }
  }

  const estimate =
    estimateCaloriesFromMet({
      met:
        record.met,

      weightKg:
        resolvedWeightKg,

      durationMinutes
    });

  if (!estimate) {
    return null;
  }

  return {
    activityId:
      record.id,

    label:
      record.label,

    category:
      record.category,

    exerciseType:
      record.exerciseType,

    intensity:
      record.intensity,

    met:
      record.met,

    calories:
      estimate.calories,

    roundedCalories:
      Math.round(
        estimate.calories
      ),

    caloriesPerMinute:
      estimate.caloriesPerMinute,

    weightKg:
      estimate.weightKg,

    durationMinutes:
      estimate.durationMinutes,

    estimated:
      true
  };
}

function estimateCaloriesForWeights({
  activityId,
  durationMinutes,
  weightsLb = []
} = {}) {
  const activity =
    getMetActivity(
      activityId
    );

  if (!activity) {
    return [];
  }

  return weightsLb
    .map(weightLb => {
      const estimate =
        estimateActivityCalories({
          activity,
          weightLb,
          durationMinutes
        });

      return estimate
        ? {
            weightLb:
              Number(weightLb),

            calories:
              estimate.roundedCalories
          }
        : null;
    })
    .filter(Boolean);
}

function getActivityIds() {
  return MET_ACTIVITIES.map(
    activity => activity.id
  );
}

const AriTrainingMetValues =
  Object.freeze({
    version: VERSION,
    source: SOURCE,
    activityLevels: ACTIVITY_LEVELS,
    all: MET_ACTIVITIES,
    get: getMetActivity,
    list: getMetActivities,
    search: searchMetActivities,
    estimateCalories: estimateActivityCalories,
    estimateFromMet: estimateCaloriesFromMet,
    estimateForWeights: estimateCaloriesForWeights,
    ids: getActivityIds
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

  Ari.training.energy.metValues =
    AriTrainingMetValues;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  ACTIVITY_LEVELS,
  MET_ACTIVITIES,
  getMetActivity,
  getMetActivities,
  searchMetActivities,
  estimateCaloriesFromMet,
  estimateActivityCalories,
  estimateCaloriesForWeights,
  getActivityIds,
  AriTrainingMetValues
};

export default AriTrainingMetValues;
