// =====================================================
// ARI REBIRTH
// File: js/training/movements/exercise-types.js
// Version: 1.0.0
// Purpose:
//   Central registry for high-level exercise classifications
//   used by ARI Training.
//
// Design:
//   - Separates "what kind of exercise is this?" from
//     body part and movement pattern.
//   - Supports filtering, templates, workout goals,
//     calorie-estimation rules, and logging behavior.
//   - Exercise records should reference these stable IDs.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/movements/exercise-types";

const EXERCISE_TYPES = Object.freeze([
  {
    id: "strength",
    label: "Strength Training",
    shortLabel: "Strength",
    family: "resistance",
    description:
      "Exercises that use resistance to develop muscular strength, force production, or general resistance-training capacity.",
    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "weight lifting",
      "weightlifting",
      "resistance training",
      "lifting"
    ]
  },

  {
    id: "hypertrophy",
    label: "Hypertrophy Training",
    shortLabel: "Muscle Building",
    family: "resistance",
    description:
      "Resistance training primarily organized to increase muscle size and training volume.",
    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "muscle building",
      "bodybuilding",
      "hypertrophy"
    ]
  },

  {
    id: "power",
    label: "Power Training",
    shortLabel: "Power",
    family: "performance",
    description:
      "Exercises emphasizing rapid force production, explosiveness, acceleration, or high-velocity movement.",
    defaultLogging: [
      "sets",
      "reps",
      "weight",
      "distance",
      "duration"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "explosive training",
      "power"
    ]
  },

  {
    id: "plyometric",
    label: "Plyometric Training",
    shortLabel: "Plyometrics",
    family: "performance",
    description:
      "Explosive jumping, hopping, bounding, and reactive movements that use rapid stretch-shortening actions.",
    defaultLogging: [
      "sets",
      "reps"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "plyometrics",
      "jump training"
    ]
  },

  {
    id: "cardio",
    label: "Cardiovascular Exercise",
    shortLabel: "Cardio",
    family: "aerobic",
    description:
      "Sustained or interval-based activities intended to improve cardiovascular conditioning and aerobic fitness.",
    defaultLogging: [
      "duration",
      "distance"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "cardiovascular",
      "aerobic",
      "aerobic exercise"
    ]
  },

  {
    id: "running",
    label: "Running",
    shortLabel: "Running",
    family: "aerobic",
    description:
      "Running-based training for cardiovascular fitness, endurance, pace, speed, or race performance.",
    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "run",
      "jogging"
    ]
  },

  {
    id: "walking",
    label: "Walking",
    shortLabel: "Walking",
    family: "aerobic",
    description:
      "Walking-based activity for general fitness, recovery, endurance, or low-impact conditioning.",
    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "walk",
      "brisk walking"
    ]
  },

  {
    id: "cycling",
    label: "Cycling",
    shortLabel: "Cycling",
    family: "aerobic",
    description:
      "Outdoor or stationary cycling used for cardiovascular conditioning, endurance, or performance.",
    defaultLogging: [
      "duration",
      "distance",
      "speed",
      "resistance"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "bike",
      "biking",
      "stationary bike"
    ]
  },

  {
    id: "rowing",
    label: "Rowing",
    shortLabel: "Rowing",
    family: "aerobic",
    description:
      "Rowing-machine or rowing-based exercise for cardiovascular conditioning and full-body endurance.",
    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "rower",
      "rowing machine",
      "erg"
    ]
  },

  {
    id: "conditioning",
    label: "Conditioning",
    shortLabel: "Conditioning",
    family: "mixed",
    description:
      "Higher-density training that combines muscular and cardiovascular demands, often using circuits or intervals.",
    defaultLogging: [
      "duration",
      "rounds",
      "reps"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "metabolic conditioning",
      "metcon",
      "circuit training"
    ]
  },

  {
    id: "hiit",
    label: "High-Intensity Interval Training",
    shortLabel: "HIIT",
    family: "mixed",
    description:
      "Repeated high-intensity work intervals separated by planned recovery periods.",
    defaultLogging: [
      "duration",
      "rounds",
      "work_interval",
      "rest_interval"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "hiit",
      "high intensity intervals"
    ]
  },

  {
    id: "core",
    label: "Core Training",
    shortLabel: "Core",
    family: "resistance",
    description:
      "Training focused on trunk strength, stability, rotation control, and force transfer.",
    defaultLogging: [
      "sets",
      "reps",
      "duration"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "abs",
      "ab training",
      "core work"
    ]
  },

  {
    id: "mobility",
    label: "Mobility",
    shortLabel: "Mobility",
    family: "movement_quality",
    description:
      "Controlled movement intended to improve usable joint range of motion and movement quality.",
    defaultLogging: [
      "duration"
    ],
    supportsIntensity: false,
    calorieProfile: "activity_met",
    aliases: [
      "joint mobility",
      "mobility work"
    ]
  },

  {
    id: "flexibility",
    label: "Flexibility",
    shortLabel: "Stretching",
    family: "movement_quality",
    description:
      "Stretching-focused activity intended to improve or maintain tissue length and range of motion.",
    defaultLogging: [
      "duration",
      "hold_time"
    ],
    supportsIntensity: false,
    calorieProfile: "activity_met",
    aliases: [
      "stretching",
      "stretch",
      "flexibility training"
    ]
  },

  {
    id: "balance",
    label: "Balance Training",
    shortLabel: "Balance",
    family: "movement_quality",
    description:
      "Exercises that challenge postural control, stability, and control of the body's center of mass.",
    defaultLogging: [
      "sets",
      "duration"
    ],
    supportsIntensity: false,
    calorieProfile: "activity_met",
    aliases: [
      "stability",
      "balance work"
    ]
  },

  {
    id: "functional",
    label: "Functional Training",
    shortLabel: "Functional",
    family: "mixed",
    description:
      "Integrated movements that train multiple joints, muscles, balance, coordination, or real-world movement capacity.",
    defaultLogging: [
      "sets",
      "reps",
      "weight",
      "duration",
      "distance"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "functional fitness",
      "functional exercise"
    ]
  },

  {
    id: "calisthenics",
    label: "Calisthenics",
    shortLabel: "Calisthenics",
    family: "resistance",
    description:
      "Bodyweight-focused resistance training using the body as the primary source of resistance.",
    defaultLogging: [
      "sets",
      "reps",
      "duration"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "bodyweight training",
      "bodyweight exercise"
    ]
  },

  {
    id: "machine_strength",
    label: "Machine Strength Training",
    shortLabel: "Machines",
    family: "resistance",
    description:
      "Resistance training performed primarily with selectorized, plate-loaded, or guided-path machines.",
    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "machine workout",
      "machines"
    ]
  },

  {
    id: "free_weight",
    label: "Free-Weight Training",
    shortLabel: "Free Weights",
    family: "resistance",
    description:
      "Resistance training using dumbbells, barbells, kettlebells, or other freely moving external loads.",
    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "free weights",
      "dumbbells",
      "barbells"
    ]
  },

  {
    id: "cable",
    label: "Cable Training",
    shortLabel: "Cable",
    family: "resistance",
    description:
      "Resistance exercises performed using cable or pulley systems.",
    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "cables",
      "cable machine"
    ]
  },

  {
    id: "resistance_band",
    label: "Resistance Band Training",
    shortLabel: "Bands",
    family: "resistance",
    description:
      "Exercises using elastic bands or tubing as the primary resistance.",
    defaultLogging: [
      "sets",
      "reps",
      "band_resistance"
    ],
    supportsIntensity: true,
    calorieProfile: "session_met",
    aliases: [
      "bands",
      "band workout"
    ]
  },

  {
    id: "sports_conditioning",
    label: "Sports Conditioning",
    shortLabel: "Sports",
    family: "performance",
    description:
      "Training designed to support sport-specific endurance, speed, agility, power, and work capacity.",
    defaultLogging: [
      "duration",
      "distance",
      "reps",
      "rounds"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "athletic conditioning",
      "sports training"
    ]
  },

  {
    id: "agility",
    label: "Agility Training",
    shortLabel: "Agility",
    family: "performance",
    description:
      "Rapid direction-change and footwork exercises intended to improve movement control and athletic responsiveness.",
    defaultLogging: [
      "sets",
      "reps",
      "duration",
      "distance"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "footwork",
      "change of direction"
    ]
  },

  {
    id: "speed",
    label: "Speed Training",
    shortLabel: "Speed",
    family: "performance",
    description:
      "Training focused on acceleration, sprint mechanics, and maximal or near-maximal movement velocity.",
    defaultLogging: [
      "sets",
      "distance",
      "duration",
      "pace"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "sprint training",
      "speed work"
    ]
  },

  {
    id: "endurance",
    label: "Endurance Training",
    shortLabel: "Endurance",
    family: "aerobic",
    description:
      "Training focused on sustaining physical activity for longer durations and improving fatigue resistance.",
    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],
    supportsIntensity: true,
    calorieProfile: "activity_met",
    aliases: [
      "endurance",
      "aerobic endurance"
    ]
  },

  {
    id: "recovery",
    label: "Recovery Activity",
    shortLabel: "Recovery",
    family: "recovery",
    description:
      "Low-intensity activity used to support recovery between harder training sessions.",
    defaultLogging: [
      "duration"
    ],
    supportsIntensity: false,
    calorieProfile: "activity_met",
    aliases: [
      "active recovery",
      "recovery session"
    ]
  }
]);

const EXERCISE_TYPE_MAP = new Map(
  EXERCISE_TYPES.map(
    type => [type.id, type]
  )
);

const EXERCISE_TYPE_ALIAS_MAP =
  new Map();

for (const type of EXERCISE_TYPES) {
  const aliases = [
    type.id,
    type.label,
    type.shortLabel,
    ...(type.aliases || [])
  ];

  for (const alias of aliases) {
    EXERCISE_TYPE_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      type.id
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

function getExerciseType(
  idOrAlias
) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    EXERCISE_TYPE_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return EXERCISE_TYPE_MAP.get(
    resolvedId
  ) || null;
}

function hasExerciseType(
  idOrAlias
) {
  return Boolean(
    getExerciseType(idOrAlias)
  );
}

function getExerciseTypes({
  family = null,
  calorieProfile = null,
  supportsIntensity = null
} = {}) {
  const normalizedFamily =
    normalizeText(family);

  const normalizedCalorieProfile =
    normalizeText(
      calorieProfile
    );

  return EXERCISE_TYPES.filter(
    type => {
      if (
        normalizedFamily &&
        normalizeText(type.family) !==
          normalizedFamily
      ) {
        return false;
      }

      if (
        normalizedCalorieProfile &&
        normalizeText(
          type.calorieProfile
        ) !==
          normalizedCalorieProfile
      ) {
        return false;
      }

      if (
        supportsIntensity !==
          null &&
        supportsIntensity !==
          undefined &&
        type.supportsIntensity !==
          Boolean(
            supportsIntensity
          )
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchExerciseTypes(
  query
) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [
      ...EXERCISE_TYPES
    ];
  }

  return EXERCISE_TYPES.filter(
    type => {
      const searchable = [
        type.id,
        type.label,
        type.shortLabel,
        type.family,
        type.description,
        type.calorieProfile,
        ...(type.defaultLogging ||
          []),
        ...(type.aliases || [])
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

function getExerciseTypeIds() {
  return EXERCISE_TYPES.map(
    type => type.id
  );
}

const AriTrainingExerciseTypes =
  Object.freeze({
    version: VERSION,
    source: SOURCE,
    all: EXERCISE_TYPES,
    get: getExerciseType,
    has: hasExerciseType,
    list: getExerciseTypes,
    search: searchExerciseTypes,
    ids: getExerciseTypeIds
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

  Ari.training.exerciseTypes =
    AriTrainingExerciseTypes;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  EXERCISE_TYPES,
  getExerciseType,
  hasExerciseType,
  getExerciseTypes,
  searchExerciseTypes,
  getExerciseTypeIds,
  AriTrainingExerciseTypes
};

export default AriTrainingExerciseTypes;
