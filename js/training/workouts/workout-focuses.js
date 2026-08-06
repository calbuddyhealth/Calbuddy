// =====================================================
// ARI REBIRTH
// File: js/training/workouts/workout-focuses.js
// Version: 1.0.0
// Purpose:
//   Central registry for user-facing workout-day focuses
//   used by the ARI Training weekly planner and templates.
//
// Design:
//   - Uses familiar gym language such as Chest Day,
//     Leg Day, Push Day, Upper Body, and Full Body.
//   - Maps each workout focus to body parts, movement
//     families, exercise types, and common goals.
//   - Includes cardio, running, mobility, recovery,
//     conditioning, and Off Day options.
//   - Exercise selection should still come from the
//     approved Exercise Library.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/workouts/workout-focuses";

const WORKOUT_FOCUSES = Object.freeze([
  // ===================================================
  // REST / RECOVERY
  // ===================================================
  {
    id: "off_day",
    label: "Off Day",
    shortLabel: "Off",
    category: "recovery",
    isTrainingDay: false,
    description:
      "A scheduled day without a formal workout.",
    bodyParts: [],
    movementFamilies: [],
    exerciseTypes: [],
    goals: [
      "recovery"
    ],
    aliases: [
      "rest day",
      "day off",
      "off"
    ]
  },

  {
    id: "active_recovery",
    label: "Active Recovery",
    shortLabel: "Recovery",
    category: "recovery",
    isTrainingDay: true,
    description:
      "Low-intensity movement intended to support recovery between harder sessions.",
    bodyParts: [
      "full_body"
    ],
    movementFamilies: [
      "locomotion",
      "mobility",
      "flexibility"
    ],
    exerciseTypes: [
      "recovery",
      "walking",
      "mobility",
      "flexibility"
    ],
    goals: [
      "recovery",
      "general_fitness",
      "mobility"
    ],
    aliases: [
      "recovery day",
      "active rest"
    ]
  },

  // ===================================================
  // BODY-PART DAYS
  // ===================================================
  {
    id: "chest_day",
    label: "Chest Day",
    shortLabel: "Chest",
    category: "strength",
    isTrainingDay: true,
    description:
      "A resistance-training session focused primarily on the chest, with supporting shoulder and triceps work.",
    bodyParts: [
      "chest",
      "shoulders",
      "triceps"
    ],
    primaryBodyParts: [
      "chest"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    movementFamilies: [
      "push"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "chest",
      "pec day"
    ]
  },

  {
    id: "back_day",
    label: "Back Day",
    shortLabel: "Back",
    category: "strength",
    isTrainingDay: true,
    description:
      "A resistance-training session focused primarily on the back, with supporting biceps and rear-shoulder work.",
    bodyParts: [
      "back",
      "biceps",
      "shoulders"
    ],
    primaryBodyParts: [
      "back"
    ],
    movementPatterns: [
      "horizontal_pull",
      "vertical_pull"
    ],
    movementFamilies: [
      "pull"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "back",
      "lat day"
    ]
  },

  {
    id: "shoulder_day",
    label: "Shoulder Day",
    shortLabel: "Shoulders",
    category: "strength",
    isTrainingDay: true,
    description:
      "A resistance-training session focused primarily on the deltoids and shoulder girdle.",
    bodyParts: [
      "shoulders"
    ],
    primaryBodyParts: [
      "shoulders"
    ],
    movementPatterns: [
      "vertical_push",
      "shoulder_abduction",
      "shoulder_horizontal_abduction"
    ],
    movementFamilies: [
      "push",
      "shoulder_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "shoulders",
      "delt day"
    ]
  },

  {
    id: "arm_day",
    label: "Arm Day",
    shortLabel: "Arms",
    category: "strength",
    isTrainingDay: true,
    description:
      "A resistance-training session focused on the biceps, triceps, and forearms.",
    bodyParts: [
      "arms",
      "biceps",
      "triceps",
      "forearms"
    ],
    primaryBodyParts: [
      "biceps",
      "triceps"
    ],
    movementPatterns: [
      "elbow_flexion",
      "elbow_extension"
    ],
    movementFamilies: [
      "arm_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "arms",
      "biceps and triceps"
    ]
  },

  {
    id: "leg_day",
    label: "Leg Day",
    shortLabel: "Legs",
    category: "strength",
    isTrainingDay: true,
    description:
      "A lower-body resistance session that can include the quadriceps, hamstrings, glutes, calves, and hip musculature.",
    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "adductors",
      "abductors"
    ],
    primaryBodyParts: [
      "quadriceps",
      "hamstrings",
      "glutes"
    ],
    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "step",
      "calf_raise",
      "knee_flexion",
      "knee_extension"
    ],
    movementFamilies: [
      "lower_body"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "lower_body_strength",
      "athletic_performance"
    ],
    aliases: [
      "legs",
      "lower body day"
    ]
  },

  {
    id: "glute_day",
    label: "Glute Day",
    shortLabel: "Glutes",
    category: "strength",
    isTrainingDay: true,
    description:
      "A lower-body session focused on the gluteal muscles and supporting posterior-chain or hip movements.",
    bodyParts: [
      "glutes",
      "hips",
      "hamstrings",
      "abductors"
    ],
    primaryBodyParts: [
      "glutes"
    ],
    movementPatterns: [
      "hip_hinge",
      "lunge",
      "step",
      "hip_abduction",
      "squat"
    ],
    movementFamilies: [
      "lower_body",
      "hip_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band"
    ],
    goals: [
      "muscle_building",
      "lower_body_strength",
      "glute_development"
    ],
    aliases: [
      "glutes",
      "glute workout"
    ]
  },

  {
    id: "core_day",
    label: "Core Day",
    shortLabel: "Core",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session focused on trunk strength, abdominal training, rotation control, and core stability.",
    bodyParts: [
      "core",
      "abdominals",
      "obliques",
      "lower_back"
    ],
    primaryBodyParts: [
      "core"
    ],
    movementPatterns: [
      "trunk_flexion",
      "trunk_rotation",
      "anti_rotation",
      "anti_extension",
      "anti_lateral_flexion"
    ],
    movementFamilies: [
      "core",
      "core_stability"
    ],
    exerciseTypes: [
      "core",
      "strength",
      "calisthenics"
    ],
    goals: [
      "core_strength",
      "general_fitness",
      "athletic_performance"
    ],
    aliases: [
      "abs day",
      "ab day",
      "core"
    ]
  },

  // ===================================================
  // SPLIT DAYS
  // ===================================================
  {
    id: "upper_body",
    label: "Upper Body",
    shortLabel: "Upper",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session that combines major upper-body pushing and pulling movements.",
    bodyParts: [
      "upper_body",
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps"
    ],
    primaryBodyParts: [
      "upper_body"
    ],
    movementPatterns: [
      "horizontal_push",
      "vertical_push",
      "horizontal_pull",
      "vertical_pull",
      "elbow_flexion",
      "elbow_extension"
    ],
    movementFamilies: [
      "push",
      "pull",
      "arm_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "upper",
      "upper body day"
    ]
  },

  {
    id: "lower_body",
    label: "Lower Body",
    shortLabel: "Lower",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session that combines the major lower-body movement patterns and muscle groups.",
    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips"
    ],
    primaryBodyParts: [
      "lower_body"
    ],
    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "step",
      "calf_raise"
    ],
    movementFamilies: [
      "lower_body"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "lower_body_strength"
    ],
    aliases: [
      "lower",
      "lower body day"
    ]
  },

  {
    id: "full_body",
    label: "Full Body",
    shortLabel: "Full Body",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session that trains major upper-body, lower-body, and core movement patterns in one workout.",
    bodyParts: [
      "full_body",
      "upper_body",
      "lower_body",
      "core"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "horizontal_push",
      "horizontal_pull",
      "vertical_push",
      "vertical_pull",
      "squat",
      "hip_hinge",
      "lunge",
      "anti_extension",
      "loaded_carry"
    ],
    movementFamilies: [
      "push",
      "pull",
      "lower_body",
      "core_stability",
      "carry"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "calisthenics"
    ],
    goals: [
      "general_fitness",
      "strength",
      "muscle_building"
    ],
    aliases: [
      "total body",
      "whole body"
    ]
  },

  {
    id: "push_day",
    label: "Push Day",
    shortLabel: "Push",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session focused on pressing movements involving the chest, shoulders, and triceps.",
    bodyParts: [
      "chest",
      "shoulders",
      "triceps"
    ],
    primaryBodyParts: [
      "chest",
      "shoulders",
      "triceps"
    ],
    movementPatterns: [
      "horizontal_push",
      "vertical_push",
      "shoulder_abduction",
      "elbow_extension"
    ],
    movementFamilies: [
      "push"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "push",
      "press day"
    ]
  },

  {
    id: "pull_day",
    label: "Pull Day",
    shortLabel: "Pull",
    category: "strength",
    isTrainingDay: true,
    description:
      "A session focused on pulling movements involving the back, biceps, rear shoulders, and grip.",
    bodyParts: [
      "back",
      "biceps",
      "shoulders",
      "forearms"
    ],
    primaryBodyParts: [
      "back",
      "biceps"
    ],
    movementPatterns: [
      "horizontal_pull",
      "vertical_pull",
      "elbow_flexion",
      "shoulder_horizontal_abduction"
    ],
    movementFamilies: [
      "pull"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    goals: [
      "muscle_building",
      "strength",
      "upper_body_strength"
    ],
    aliases: [
      "pull",
      "back and biceps"
    ]
  },

  {
    id: "chest_triceps",
    label: "Chest + Triceps",
    shortLabel: "Chest + Triceps",
    category: "strength",
    isTrainingDay: true,
    description:
      "A combined session pairing chest pressing with direct triceps work.",
    bodyParts: [
      "chest",
      "triceps",
      "shoulders"
    ],
    primaryBodyParts: [
      "chest",
      "triceps"
    ],
    movementPatterns: [
      "horizontal_push",
      "elbow_extension"
    ],
    movementFamilies: [
      "push",
      "arm_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy"
    ],
    goals: [
      "muscle_building",
      "upper_body_strength"
    ],
    aliases: [
      "chest and triceps"
    ]
  },

  {
    id: "back_biceps",
    label: "Back + Biceps",
    shortLabel: "Back + Biceps",
    category: "strength",
    isTrainingDay: true,
    description:
      "A combined session pairing back pulling movements with direct biceps work.",
    bodyParts: [
      "back",
      "biceps",
      "forearms"
    ],
    primaryBodyParts: [
      "back",
      "biceps"
    ],
    movementPatterns: [
      "horizontal_pull",
      "vertical_pull",
      "elbow_flexion"
    ],
    movementFamilies: [
      "pull",
      "arm_isolation"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy"
    ],
    goals: [
      "muscle_building",
      "upper_body_strength"
    ],
    aliases: [
      "back and biceps"
    ]
  },

  {
    id: "legs_core",
    label: "Legs + Core",
    shortLabel: "Legs + Core",
    category: "strength",
    isTrainingDay: true,
    description:
      "A combined lower-body and core training session.",
    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "core"
    ],
    primaryBodyParts: [
      "lower_body",
      "core"
    ],
    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "anti_extension",
      "anti_rotation"
    ],
    movementFamilies: [
      "lower_body",
      "core_stability"
    ],
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "core"
    ],
    goals: [
      "strength",
      "muscle_building",
      "core_strength"
    ],
    aliases: [
      "legs and core"
    ]
  },

  // ===================================================
  // CARDIO / ENDURANCE
  // ===================================================
  {
    id: "cardio",
    label: "Cardio",
    shortLabel: "Cardio",
    category: "cardio",
    isTrainingDay: true,
    description:
      "A cardiovascular training session using steady-state or interval-based aerobic activity.",
    bodyParts: [
      "full_body"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "walking",
      "running",
      "cycling",
      "rowing_cardio",
      "stair_climbing",
      "elliptical"
    ],
    movementFamilies: [
      "locomotion"
    ],
    exerciseTypes: [
      "cardio",
      "running",
      "walking",
      "cycling",
      "rowing",
      "endurance"
    ],
    goals: [
      "cardio",
      "endurance",
      "general_fitness",
      "fat_loss_support"
    ],
    aliases: [
      "cardio day",
      "aerobic day"
    ]
  },

  {
    id: "running",
    label: "Running",
    shortLabel: "Run",
    category: "cardio",
    isTrainingDay: true,
    description:
      "A running-focused session for aerobic fitness, endurance, pace, speed, or running performance.",
    bodyParts: [
      "lower_body",
      "core",
      "full_body"
    ],
    primaryBodyParts: [
      "lower_body"
    ],
    movementPatterns: [
      "running"
    ],
    movementFamilies: [
      "locomotion"
    ],
    exerciseTypes: [
      "running",
      "cardio",
      "endurance"
    ],
    goals: [
      "running",
      "cardio",
      "endurance",
      "general_fitness"
    ],
    aliases: [
      "run day",
      "running day"
    ]
  },

  {
    id: "endurance",
    label: "Endurance",
    shortLabel: "Endurance",
    category: "cardio",
    isTrainingDay: true,
    description:
      "A session focused on sustaining activity for longer periods and improving fatigue resistance.",
    bodyParts: [
      "full_body"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "walking",
      "running",
      "cycling",
      "rowing_cardio",
      "stair_climbing",
      "elliptical"
    ],
    movementFamilies: [
      "locomotion"
    ],
    exerciseTypes: [
      "endurance",
      "cardio",
      "running",
      "cycling",
      "rowing"
    ],
    goals: [
      "endurance",
      "cardio",
      "running",
      "general_fitness"
    ],
    aliases: [
      "endurance day",
      "aerobic endurance"
    ]
  },

  {
    id: "conditioning",
    label: "Conditioning",
    shortLabel: "Conditioning",
    category: "conditioning",
    isTrainingDay: true,
    description:
      "A session that combines muscular and cardiovascular work using circuits, intervals, or mixed-modal training.",
    bodyParts: [
      "full_body"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "conditioning_circuit",
      "loaded_carry",
      "jump",
      "sprint"
    ],
    movementFamilies: [
      "conditioning",
      "carry",
      "plyometric",
      "locomotion"
    ],
    exerciseTypes: [
      "conditioning",
      "hiit",
      "functional",
      "sports_conditioning"
    ],
    goals: [
      "general_fitness",
      "cardio",
      "endurance",
      "athletic_performance",
      "fat_loss_support"
    ],
    aliases: [
      "conditioning day",
      "metcon"
    ]
  },

  {
    id: "speed_agility",
    label: "Speed + Agility",
    shortLabel: "Speed + Agility",
    category: "performance",
    isTrainingDay: true,
    description:
      "A performance session focused on acceleration, sprinting, footwork, and change of direction.",
    bodyParts: [
      "full_body",
      "lower_body"
    ],
    primaryBodyParts: [
      "lower_body"
    ],
    movementPatterns: [
      "sprint",
      "jump",
      "hop",
      "bound"
    ],
    movementFamilies: [
      "locomotion",
      "plyometric"
    ],
    exerciseTypes: [
      "speed",
      "agility",
      "plyometric",
      "sports_conditioning"
    ],
    goals: [
      "athletic_performance",
      "speed",
      "power"
    ],
    aliases: [
      "speed day",
      "agility day"
    ]
  },

  // ===================================================
  // MOBILITY / FLEXIBILITY
  // ===================================================
  {
    id: "mobility",
    label: "Mobility",
    shortLabel: "Mobility",
    category: "mobility",
    isTrainingDay: true,
    description:
      "A session focused on controlled joint motion and usable range of movement.",
    bodyParts: [
      "full_body"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "mobility",
      "dynamic_stretch"
    ],
    movementFamilies: [
      "mobility",
      "flexibility"
    ],
    exerciseTypes: [
      "mobility",
      "flexibility"
    ],
    goals: [
      "mobility",
      "general_fitness",
      "recovery"
    ],
    aliases: [
      "mobility day"
    ]
  },

  {
    id: "stretching",
    label: "Stretching",
    shortLabel: "Stretching",
    category: "mobility",
    isTrainingDay: true,
    description:
      "A flexibility-focused session using static or dynamic stretching.",
    bodyParts: [
      "full_body"
    ],
    primaryBodyParts: [
      "full_body"
    ],
    movementPatterns: [
      "dynamic_stretch",
      "static_stretch"
    ],
    movementFamilies: [
      "flexibility"
    ],
    exerciseTypes: [
      "flexibility"
    ],
    goals: [
      "flexibility",
      "mobility",
      "recovery"
    ],
    aliases: [
      "stretch day",
      "flexibility day"
    ]
  },

  // ===================================================
  // USER-DEFINED
  // ===================================================
  {
    id: "custom",
    label: "Custom Workout",
    shortLabel: "Custom",
    category: "custom",
    isTrainingDay: true,
    description:
      "A user-built workout assembled from approved exercises in the ARI Exercise Library.",
    bodyParts: [],
    primaryBodyParts: [],
    movementPatterns: [],
    movementFamilies: [],
    exerciseTypes: [],
    goals: [],
    aliases: [
      "custom",
      "custom day"
    ]
  }
]);

const WORKOUT_FOCUS_MAP =
  new Map(
    WORKOUT_FOCUSES.map(
      focus => [
        focus.id,
        focus
      ]
    )
  );

const WORKOUT_FOCUS_ALIAS_MAP =
  new Map();

for (const focus of WORKOUT_FOCUSES) {
  const aliases = [
    focus.id,
    focus.label,
    focus.shortLabel,
    ...(focus.aliases || [])
  ];

  for (const alias of aliases) {
    WORKOUT_FOCUS_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      focus.id
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

function getWorkoutFocus(
  idOrAlias
) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    WORKOUT_FOCUS_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return WORKOUT_FOCUS_MAP.get(
    resolvedId
  ) || null;
}

function hasWorkoutFocus(
  idOrAlias
) {
  return Boolean(
    getWorkoutFocus(idOrAlias)
  );
}

function getWorkoutFocuses({
  category = null,
  trainingDaysOnly = false,
  goal = null,
  bodyPart = null,
  exerciseType = null
} = {}) {
  const normalizedCategory =
    normalizeText(category);

  const normalizedGoal =
    normalizeText(goal);

  const normalizedBodyPart =
    normalizeText(bodyPart);

  const normalizedExerciseType =
    normalizeText(exerciseType);

  return WORKOUT_FOCUSES.filter(
    focus => {
      if (
        normalizedCategory &&
        normalizeText(focus.category) !==
          normalizedCategory
      ) {
        return false;
      }

      if (
        trainingDaysOnly &&
        focus.isTrainingDay !== true
      ) {
        return false;
      }

      if (
        normalizedGoal &&
        !(focus.goals || []).some(
          item =>
            normalizeText(item) ===
            normalizedGoal
        )
      ) {
        return false;
      }

      if (
        normalizedBodyPart &&
        !(focus.bodyParts || []).some(
          item =>
            normalizeText(item) ===
            normalizedBodyPart
        )
      ) {
        return false;
      }

      if (
        normalizedExerciseType &&
        !(focus.exerciseTypes || []).some(
          item =>
            normalizeText(item) ===
            normalizedExerciseType
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchWorkoutFocuses(
  query
) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [
      ...WORKOUT_FOCUSES
    ];
  }

  return WORKOUT_FOCUSES.filter(
    focus => {
      const searchable = [
        focus.id,
        focus.label,
        focus.shortLabel,
        focus.category,
        focus.description,
        ...(focus.bodyParts || []),
        ...(focus.primaryBodyParts || []),
        ...(focus.movementPatterns || []),
        ...(focus.movementFamilies || []),
        ...(focus.exerciseTypes || []),
        ...(focus.goals || []),
        ...(focus.aliases || [])
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

function getWorkoutFocusIds() {
  return WORKOUT_FOCUSES.map(
    focus => focus.id
  );
}

const AriTrainingWorkoutFocuses =
  Object.freeze({
    version: VERSION,
    source: SOURCE,
    all: WORKOUT_FOCUSES,
    get: getWorkoutFocus,
    has: hasWorkoutFocus,
    list: getWorkoutFocuses,
    search: searchWorkoutFocuses,
    ids: getWorkoutFocusIds
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

  Ari.training.workoutFocuses =
    AriTrainingWorkoutFocuses;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  WORKOUT_FOCUSES,
  getWorkoutFocus,
  hasWorkoutFocus,
  getWorkoutFocuses,
  searchWorkoutFocuses,
  getWorkoutFocusIds,
  AriTrainingWorkoutFocuses
};

export default AriTrainingWorkoutFocuses;
