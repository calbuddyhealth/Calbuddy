// =====================================================
// ARI REBIRTH
// File: js/training/movements/exercise-types.js
// Version: 1.1.0
// Purpose:
//   Central registry for high-level exercise classifications
//   used by ARI Training.
//
// V1.1.0:
//   - Added Isometric Training.
//   - Added Stability Training.
//   - Added Assisted Exercise.
//   - Added Rehab / Prehab.
//   - Added safer alias registration.
//   - Added duplicate-ID and alias-collision diagnostics.
//   - Added exercise-type validation.
//   - Added count(), validate(), and diagnostics() APIs.
//   - Preserves all existing stable exercise type IDs.
//
// Design:
//   - Separates "what kind of exercise is this?" from
//     body part and movement pattern.
//   - Supports filtering, templates, workout goals,
//     calorie-estimation rules, and logging behavior.
//   - Exercise records should reference these stable IDs.
// =====================================================


const VERSION = "1.1.0";

const SOURCE =
  "js/training/movements/exercise-types";


// =====================================================
// EXERCISE TYPES
// =====================================================

const EXERCISE_TYPES = Object.freeze([

  // ===================================================
  // RESISTANCE TRAINING
  // ===================================================

  {
    id: "strength",

    label:
      "Strength Training",

    shortLabel:
      "Strength",

    family:
      "resistance",

    description:
      "Exercises that use resistance to develop muscular strength, force production, or general resistance-training capacity.",

    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "weight lifting",
      "weightlifting",
      "resistance training",
      "lifting",
      "strength exercise",
      "strength workout"
    ]
  },


  {
    id: "hypertrophy",

    label:
      "Hypertrophy Training",

    shortLabel:
      "Muscle Building",

    family:
      "resistance",

    description:
      "Resistance training primarily organized to increase muscle size and training volume.",

    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "muscle building",
      "bodybuilding",
      "hypertrophy",
      "muscle growth"
    ]
  },


  {
    id: "calisthenics",

    label:
      "Calisthenics",

    shortLabel:
      "Calisthenics",

    family:
      "resistance",

    description:
      "Bodyweight-focused resistance training using the body as the primary source of resistance.",

    defaultLogging: [
      "sets",
      "reps",
      "duration"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "bodyweight training",
      "bodyweight exercise",
      "body weight exercise",
      "body weight training"
    ]
  },


  {
    id: "machine_strength",

    label:
      "Machine Strength Training",

    shortLabel:
      "Machines",

    family:
      "resistance",

    description:
      "Resistance training performed primarily with selectorized, plate-loaded, or guided-path machines.",

    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "machine workout",
      "machines",
      "machine strength",
      "selectorized machine",
      "plate loaded machine"
    ]
  },


  {
    id: "free_weight",

    label:
      "Free-Weight Training",

    shortLabel:
      "Free Weights",

    family:
      "resistance",

    description:
      "Resistance training using dumbbells, barbells, kettlebells, or other freely moving external loads.",

    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "free weights",
      "free weight",
      "dumbbells",
      "barbells",
      "kettlebells"
    ]
  },


  {
    id: "cable",

    label:
      "Cable Training",

    shortLabel:
      "Cable",

    family:
      "resistance",

    description:
      "Resistance exercises performed using cable or pulley systems.",

    defaultLogging: [
      "sets",
      "reps",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "cables",
      "cable machine",
      "pulley",
      "pulley machine"
    ]
  },


  {
    id: "resistance_band",

    label:
      "Resistance Band Training",

    shortLabel:
      "Bands",

    family:
      "resistance",

    description:
      "Exercises using elastic bands or tubing as the primary resistance.",

    defaultLogging: [
      "sets",
      "reps",
      "band_resistance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "bands",
      "band workout",
      "resistance bands",
      "elastic band",
      "exercise band"
    ]
  },


  // ===================================================
  // ISOMETRIC / STABILITY / ASSISTED
  // ===================================================

  {
    id: "isometric",

    label:
      "Isometric Training",

    shortLabel:
      "Isometric",

    family:
      "resistance",

    description:
      "Exercises that generate muscular force while maintaining a relatively fixed joint position.",

    defaultLogging: [
      "sets",
      "duration",
      "weight"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "isometric",
      "isometrics",
      "static hold",
      "static contraction",
      "hold exercise",
      "isometric hold"
    ]
  },


  {
    id: "stability",

    label:
      "Stability Training",

    shortLabel:
      "Stability",

    family:
      "movement_quality",

    description:
      "Exercises focused on maintaining joint, trunk, or whole-body control against internal or external forces.",

    defaultLogging: [
      "sets",
      "reps",
      "duration"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "stability training",
      "stabilization",
      "stabilisation",
      "joint stability",
      "core stability",
      "stability exercise"
    ]
  },


  {
    id: "assisted",

    label:
      "Assisted Exercise",

    shortLabel:
      "Assisted",

    family:
      "resistance",

    description:
      "Exercises performed with external assistance that reduces the effective resistance or helps complete the movement.",

    defaultLogging: [
      "sets",
      "reps",
      "assistance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "assisted",
      "assisted exercise",
      "assistance",
      "machine assisted",
      "band assisted",
      "assisted movement"
    ]
  },


  {
    id: "rehab_prehab",

    label:
      "Rehab / Prehab",

    shortLabel:
      "Rehab / Prehab",

    family:
      "movement_quality",

    description:
      "Low-load exercise commonly used to improve movement control, tissue capacity, joint function, or resilience within an appropriate training or rehabilitation program.",

    defaultLogging: [
      "sets",
      "reps",
      "duration",
      "band_resistance"
    ],

    supportsIntensity:
      false,

    calorieProfile:
      "activity_met",

    aliases: [
      "rehab",
      "prehab",
      "rehabilitation",
      "prehabilitation",
      "corrective exercise",
      "corrective",
      "rotator cuff rehab",
      "injury prevention exercise"
    ]
  },


  // ===================================================
  // CORE
  // ===================================================

  {
    id: "core",

    label:
      "Core Training",

    shortLabel:
      "Core",

    family:
      "resistance",

    description:
      "Training focused on trunk strength, stability, rotation control, and force transfer.",

    defaultLogging: [
      "sets",
      "reps",
      "duration"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "session_met",

    aliases: [
      "abs",
      "ab training",
      "core work",
      "core exercise",
      "abdominal training"
    ]
  },


  // ===================================================
  // PERFORMANCE / POWER
  // ===================================================

  {
    id: "power",

    label:
      "Power Training",

    shortLabel:
      "Power",

    family:
      "performance",

    description:
      "Exercises emphasizing rapid force production, explosiveness, acceleration, or high-velocity movement.",

    defaultLogging: [
      "sets",
      "reps",
      "weight",
      "distance",
      "duration"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "explosive training",
      "power",
      "explosive exercise",
      "power exercise"
    ]
  },


  {
    id: "plyometric",

    label:
      "Plyometric Training",

    shortLabel:
      "Plyometrics",

    family:
      "performance",

    description:
      "Explosive jumping, hopping, bounding, and reactive movements that use rapid stretch-shortening actions.",

    defaultLogging: [
      "sets",
      "reps"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "plyometrics",
      "jump training",
      "plyo",
      "plyometric exercise"
    ]
  },


  {
    id: "sports_conditioning",

    label:
      "Sports Conditioning",

    shortLabel:
      "Sports",

    family:
      "performance",

    description:
      "Training designed to support sport-specific endurance, speed, agility, power, and work capacity.",

    defaultLogging: [
      "duration",
      "distance",
      "reps",
      "rounds"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "athletic conditioning",
      "sports training",
      "sport conditioning",
      "sport training"
    ]
  },


  {
    id: "agility",

    label:
      "Agility Training",

    shortLabel:
      "Agility",

    family:
      "performance",

    description:
      "Rapid direction-change and footwork exercises intended to improve movement control and athletic responsiveness.",

    defaultLogging: [
      "sets",
      "reps",
      "duration",
      "distance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "footwork",
      "change of direction",
      "cod training",
      "agility drill"
    ]
  },


  {
    id: "speed",

    label:
      "Speed Training",

    shortLabel:
      "Speed",

    family:
      "performance",

    description:
      "Training focused on acceleration, sprint mechanics, and maximal or near-maximal movement velocity.",

    defaultLogging: [
      "sets",
      "distance",
      "duration",
      "pace"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "sprint training",
      "speed work",
      "acceleration training"
    ]
  },


  // ===================================================
  // CARDIO / AEROBIC
  // ===================================================

  {
    id: "cardio",

    label:
      "Cardiovascular Exercise",

    shortLabel:
      "Cardio",

    family:
      "aerobic",

    description:
      "Sustained or interval-based activities intended to improve cardiovascular conditioning and aerobic fitness.",

    defaultLogging: [
      "duration",
      "distance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "cardiovascular",
      "aerobic",
      "aerobic exercise",
      "cardio exercise",
      "cardio training"
    ]
  },


  {
    id: "running",

    label:
      "Running",

    shortLabel:
      "Running",

    family:
      "aerobic",

    description:
      "Running-based training for cardiovascular fitness, endurance, pace, speed, or race performance.",

    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "run",
      "jogging",
      "jog",
      "running exercise"
    ]
  },


  {
    id: "walking",

    label:
      "Walking",

    shortLabel:
      "Walking",

    family:
      "aerobic",

    description:
      "Walking-based activity for general fitness, recovery, endurance, or low-impact conditioning.",

    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "walk",
      "brisk walking",
      "walking exercise"
    ]
  },


  {
    id: "cycling",

    label:
      "Cycling",

    shortLabel:
      "Cycling",

    family:
      "aerobic",

    description:
      "Outdoor or stationary cycling used for cardiovascular conditioning, endurance, or performance.",

    defaultLogging: [
      "duration",
      "distance",
      "speed",
      "resistance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "bike",
      "biking",
      "stationary bike",
      "indoor cycling",
      "spin bike"
    ]
  },


  {
    id: "rowing",

    label:
      "Rowing",

    shortLabel:
      "Rowing",

    family:
      "aerobic",

    description:
      "Rowing-machine or rowing-based exercise for cardiovascular conditioning and full-body endurance.",

    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "rower",
      "rowing machine",
      "erg",
      "ergometer",
      "indoor rowing"
    ]
  },


  {
    id: "endurance",

    label:
      "Endurance Training",

    shortLabel:
      "Endurance",

    family:
      "aerobic",

    description:
      "Training focused on sustaining physical activity for longer durations and improving fatigue resistance.",

    defaultLogging: [
      "duration",
      "distance",
      "pace"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "endurance",
      "aerobic endurance",
      "endurance workout",
      "long duration training"
    ]
  },


  // ===================================================
  // CONDITIONING
  // ===================================================

  {
    id: "conditioning",

    label:
      "Conditioning",

    shortLabel:
      "Conditioning",

    family:
      "mixed",

    description:
      "Higher-density training that combines muscular and cardiovascular demands, often using circuits or intervals.",

    defaultLogging: [
      "duration",
      "rounds",
      "reps"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "metabolic conditioning",
      "metcon",
      "circuit training",
      "conditioning workout"
    ]
  },


  {
    id: "hiit",

    label:
      "High-Intensity Interval Training",

    shortLabel:
      "HIIT",

    family:
      "mixed",

    description:
      "Repeated high-intensity work intervals separated by planned recovery periods.",

    defaultLogging: [
      "duration",
      "rounds",
      "work_interval",
      "rest_interval"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "hiit",
      "high intensity intervals",
      "high intensity interval training",
      "interval workout"
    ]
  },


  {
    id: "functional",

    label:
      "Functional Training",

    shortLabel:
      "Functional",

    family:
      "mixed",

    description:
      "Integrated movements that train multiple joints, muscles, balance, coordination, or real-world movement capacity.",

    defaultLogging: [
      "sets",
      "reps",
      "weight",
      "duration",
      "distance"
    ],

    supportsIntensity:
      true,

    calorieProfile:
      "activity_met",

    aliases: [
      "functional fitness",
      "functional exercise",
      "functional training"
    ]
  },


  // ===================================================
  // MOVEMENT QUALITY
  // ===================================================

  {
    id: "mobility",

    label:
      "Mobility",

    shortLabel:
      "Mobility",

    family:
      "movement_quality",

    description:
      "Controlled movement intended to improve usable joint range of motion and movement quality.",

    defaultLogging: [
      "duration"
    ],

    supportsIntensity:
      false,

    calorieProfile:
      "activity_met",

    aliases: [
      "joint mobility",
      "mobility work",
      "mobility exercise",
      "mobility drill"
    ]
  },


  {
    id: "flexibility",

    label:
      "Flexibility",

    shortLabel:
      "Stretching",

    family:
      "movement_quality",

    description:
      "Stretching-focused activity intended to improve or maintain tissue length and range of motion.",

    defaultLogging: [
      "duration",
      "hold_time"
    ],

    supportsIntensity:
      false,

    calorieProfile:
      "activity_met",

    aliases: [
      "stretching",
      "stretch",
      "flexibility training",
      "static stretching"
    ]
  },


  {
    id: "balance",

    label:
      "Balance Training",

    shortLabel:
      "Balance",

    family:
      "movement_quality",

    description:
      "Exercises that challenge postural control, stability, and control of the body's center of mass.",

    defaultLogging: [
      "sets",
      "duration"
    ],

    supportsIntensity:
      false,

    calorieProfile:
      "activity_met",

    aliases: [
      "balance work",
      "balance exercise",
      "balance training"
    ]
  },


  // ===================================================
  // RECOVERY
  // ===================================================

  {
    id: "recovery",

    label:
      "Recovery Activity",

    shortLabel:
      "Recovery",

    family:
      "recovery",

    description:
      "Low-intensity activity used to support recovery between harder training sessions.",

    defaultLogging: [
      "duration"
    ],

    supportsIntensity:
      false,

    calorieProfile:
      "activity_met",

    aliases: [
      "active recovery",
      "recovery session",
      "recovery activity",
      "easy recovery"
    ]
  }

]);


// =====================================================
// MAPS / REGISTRY INDEXES
// =====================================================

const EXERCISE_TYPE_MAP =
  new Map();


const EXERCISE_TYPE_ALIAS_MAP =
  new Map();


const DUPLICATE_TYPE_IDS = [];

const ALIAS_COLLISIONS = [];


// =====================================================
// NORMALIZATION
// =====================================================

function normalizeText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  )
    .trim()
    .toLowerCase();
}


// =====================================================
// BUILD TYPE MAP
// =====================================================

for (
  const type
  of EXERCISE_TYPES
) {
  const id =
    normalizeText(
      type?.id
    );


  if (!id) {
    continue;
  }


  if (
    EXERCISE_TYPE_MAP
      .has(
        id
      )
  ) {
    DUPLICATE_TYPE_IDS.push({
      typeId:
        id
    });

    continue;
  }


  EXERCISE_TYPE_MAP
    .set(
      id,
      type
    );
}


// =====================================================
// ALIAS REGISTRATION
// =====================================================

function registerAlias(
  alias,
  typeId
) {
  const normalized =
    normalizeText(
      alias
    );


  if (
    !normalized ||
    !typeId
  ) {
    return;
  }


  const existing =
    EXERCISE_TYPE_ALIAS_MAP
      .get(
        normalized
      );


  if (
    existing &&
    existing !== typeId
  ) {
    ALIAS_COLLISIONS.push({
      alias:
        normalized,

      existingTypeId:
        existing,

      incomingTypeId:
        typeId
    });

    return;
  }


  EXERCISE_TYPE_ALIAS_MAP
    .set(
      normalized,
      typeId
    );
}


for (
  const type
  of EXERCISE_TYPES
) {
  const aliases = [
    type.id,
    type.label,
    type.shortLabel,
    ...(
      type.aliases ||
      []
    )
  ];


  for (
    const alias
    of aliases
  ) {
    registerAlias(
      alias,
      type.id
    );
  }
}


// =====================================================
// BASIC LOOKUPS
// =====================================================

function getExerciseType(
  idOrAlias
) {
  const normalized =
    normalizeText(
      idOrAlias
    );


  if (!normalized) {
    return null;
  }


  if (
    EXERCISE_TYPE_MAP
      .has(
        normalized
      )
  ) {
    return EXERCISE_TYPE_MAP
      .get(
        normalized
      );
  }


  const resolvedId =
    EXERCISE_TYPE_ALIAS_MAP
      .get(
        normalized
      );


  if (!resolvedId) {
    return null;
  }


  return (
    EXERCISE_TYPE_MAP
      .get(
        resolvedId
      ) ||
    null
  );
}


function hasExerciseType(
  idOrAlias
) {
  return Boolean(
    getExerciseType(
      idOrAlias
    )
  );
}


function getExerciseTypeIds() {
  return EXERCISE_TYPES.map(
    type =>
      type.id
  );
}


function getExerciseTypeCount() {
  return EXERCISE_TYPES.length;
}


// =====================================================
// FILTERING
// =====================================================

function getExerciseTypes({
  family = null,
  calorieProfile = null,
  supportsIntensity = null,
  loggingField = null
} = {}) {
  const normalizedFamily =
    normalizeText(
      family
    );


  const normalizedCalorieProfile =
    normalizeText(
      calorieProfile
    );


  const normalizedLoggingField =
    normalizeText(
      loggingField
    );


  return EXERCISE_TYPES.filter(
    type => {

      if (
        normalizedFamily &&
        normalizeText(
          type.family
        ) !==
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


      if (
        normalizedLoggingField &&
        !(
          type.defaultLogging ||
          []
        ).some(
          field =>
            normalizeText(
              field
            ) ===
              normalizedLoggingField
        )
      ) {
        return false;
      }


      return true;
    }
  );
}


// =====================================================
// SEARCH
// =====================================================

function searchExerciseTypes(
  query
) {
  const normalized =
    normalizeText(
      query
    );


  if (!normalized) {
    return [
      ...EXERCISE_TYPES
    ];
  }


  const tokens =
    normalized
      .split(/\s+/)
      .filter(Boolean);


  return EXERCISE_TYPES
    .map(
      type => {
        const searchable = [
          type.id,
          type.label,
          type.shortLabel,
          type.family,
          type.description,
          type.calorieProfile,
          ...(
            type.defaultLogging ||
            []
          ),
          ...(
            type.aliases ||
            []
          )
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        let score =
          0;


        if (
          normalizeText(
            type.id
          ) ===
            normalized
        ) {
          score +=
            1000;
        }


        if (
          normalizeText(
            type.label
          ) ===
            normalized
        ) {
          score +=
            900;
        }


        if (
          normalizeText(
            type.shortLabel
          ) ===
            normalized
        ) {
          score +=
            850;
        }


        if (
          searchable.includes(
            normalized
          )
        ) {
          score +=
            300;
        }


        for (
          const token
          of tokens
        ) {
          if (
            searchable.includes(
              token
            )
          ) {
            score +=
              25;
          }
        }


        return {
          type,
          score
        };
      }
    )
    .filter(
      item =>
        item.score > 0
    )
    .sort(
      (a, b) => {
        if (
          b.score !==
            a.score
        ) {
          return (
            b.score -
            a.score
          );
        }


        return a.type.label
          .localeCompare(
            b.type.label
          );
      }
    )
    .map(
      item =>
        item.type
    );
}


// =====================================================
// VALIDATION
// =====================================================

function validateReferences() {
  const invalid = [];
  const warnings = [];

  const validCalorieProfiles =
    new Set([
      "session_met",
      "activity_met"
    ]);


  for (
    const duplicate
    of DUPLICATE_TYPE_IDS
  ) {
    invalid.push({
      typeId:
        duplicate.typeId,

      type:
        "duplicateId",

      value:
        duplicate.typeId
    });
  }


  for (
    const collision
    of ALIAS_COLLISIONS
  ) {
    warnings.push({
      typeId:
        collision.incomingTypeId,

      type:
        "aliasCollision",

      value:
        collision.alias,

      existingTypeId:
        collision.existingTypeId
    });
  }


  for (
    const type
    of EXERCISE_TYPES
  ) {

    if (!type.id) {
      invalid.push({
        typeId:
          null,

        type:
          "missingId",

        value:
          null
      });
    }


    if (!type.label) {
      invalid.push({
        typeId:
          type.id,

        type:
          "missingLabel",

        value:
          null
      });
    }


    if (!type.shortLabel) {
      warnings.push({
        typeId:
          type.id,

        type:
          "missingShortLabel",

        value:
          null
      });
    }


    if (!type.family) {
      invalid.push({
        typeId:
          type.id,

        type:
          "missingFamily",

        value:
          null
      });
    }


    if (!type.description) {
      warnings.push({
        typeId:
          type.id,

        type:
          "missingDescription",

        value:
          null
      });
    }


    if (
      typeof type.supportsIntensity !==
        "boolean"
    ) {
      invalid.push({
        typeId:
          type.id,

        type:
          "invalidSupportsIntensity",

        value:
          type.supportsIntensity
      });
    }


    if (
      !validCalorieProfiles
        .has(
          type.calorieProfile
        )
    ) {
      invalid.push({
        typeId:
          type.id,

        type:
          "invalidCalorieProfile",

        value:
          type.calorieProfile
      });
    }


    if (
      !Array.isArray(
        type.defaultLogging
      )
    ) {
      invalid.push({
        typeId:
          type.id,

        type:
          "invalidDefaultLogging",

        value:
          type.defaultLogging
      });
    } else if (
      type.defaultLogging
        .length ===
        0
    ) {
      warnings.push({
        typeId:
          type.id,

        type:
          "emptyDefaultLogging",

        value:
          null
      });
    }
  }


  return {
    valid:
      invalid.length ===
      0,

    exerciseTypeCount:
      EXERCISE_TYPES.length,

    duplicateIdCount:
      DUPLICATE_TYPE_IDS.length,

    aliasCollisionCount:
      ALIAS_COLLISIONS.length,

    invalidCount:
      invalid.length,

    warningCount:
      warnings.length,

    invalid,

    warnings
  };
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function getDiagnostics() {
  const familyCounts = {};
  const calorieProfileCounts = {};

  let intensitySupportedCount =
    0;

  let intensityUnsupportedCount =
    0;


  for (
    const type
    of EXERCISE_TYPES
  ) {
    familyCounts[
      type.family
    ] =
      (
        familyCounts[
          type.family
        ] ||
        0
      ) +
      1;


    calorieProfileCounts[
      type.calorieProfile
    ] =
      (
        calorieProfileCounts[
          type.calorieProfile
        ] ||
        0
      ) +
      1;


    if (
      type.supportsIntensity
    ) {
      intensitySupportedCount +=
        1;
    } else {
      intensityUnsupportedCount +=
        1;
    }
  }


  return {
    version:
      VERSION,

    source:
      SOURCE,

    exerciseTypeCount:
      EXERCISE_TYPES.length,

    familyCounts,

    calorieProfileCounts,

    intensitySupportedCount,

    intensityUnsupportedCount,

    duplicateTypeIds: [
      ...DUPLICATE_TYPE_IDS
    ],

    aliasCollisions: [
      ...ALIAS_COLLISIONS
    ],

    validation:
      validateReferences()
  };
}


// =====================================================
// PUBLIC REGISTRY
// =====================================================

const AriTrainingExerciseTypes =
  Object.freeze({

    version:
      VERSION,

    source:
      SOURCE,

    all:
      EXERCISE_TYPES,

    count:
      getExerciseTypeCount,

    get:
      getExerciseType,

    has:
      hasExerciseType,

    list:
      getExerciseTypes,

    search:
      searchExerciseTypes,

    ids:
      getExerciseTypeIds,

    validate:
      validateReferences,

    diagnostics:
      getDiagnostics
  });


// =====================================================
// GLOBAL API
// =====================================================

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


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  EXERCISE_TYPES,

  getExerciseType,
  hasExerciseType,
  getExerciseTypes,
  searchExerciseTypes,
  getExerciseTypeIds,
  getExerciseTypeCount,

  validateReferences,
  getDiagnostics,

  AriTrainingExerciseTypes
};


export default
  AriTrainingExerciseTypes;