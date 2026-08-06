// =====================================================
// ARI REBIRTH
// File: js/training/goals/fitness-goals.js
// Version: 1.0.0
// Purpose:
//   Central registry for fitness goals used throughout
//   ARI Training.
//
// Design:
//   - Defines the user-facing goals ARI Training supports.
//   - Gives each goal stable IDs and recommendation rules.
//   - Connects goals to workout focuses, exercise types,
//     movement families, and planning priorities.
//   - Exercise records can score their relevance to these
//     goal IDs without duplicating goal definitions.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/goals/fitness-goals";

const FITNESS_GOALS = Object.freeze([
  {
    id: "muscle_building",
    label: "Build Muscle",
    shortLabel: "Muscle",
    category: "resistance",
    description:
      "Increase muscle size through progressive resistance training and sufficient training volume.",
    recommendedWorkoutFocuses: [
      "chest_day",
      "back_day",
      "shoulder_day",
      "arm_day",
      "leg_day",
      "glute_day",
      "upper_body",
      "lower_body",
      "full_body",
      "push_day",
      "pull_day",
      "chest_triceps",
      "back_biceps",
      "legs_core"
    ],
    preferredExerciseTypes: [
      "hypertrophy",
      "strength",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "lower_body",
      "arm_isolation",
      "shoulder_isolation",
      "hip_isolation",
      "core"
    ],
    planningPriorities: [
      "progressive_overload",
      "training_volume",
      "muscle_group_balance",
      "recovery",
      "exercise_variety"
    ],
    aliases: [
      "gain muscle",
      "hypertrophy",
      "bodybuilding",
      "muscle growth"
    ]
  },

  {
    id: "strength",
    label: "Increase Strength",
    shortLabel: "Strength",
    category: "resistance",
    description:
      "Improve force production and the ability to move progressively heavier resistance.",
    recommendedWorkoutFocuses: [
      "upper_body",
      "lower_body",
      "full_body",
      "push_day",
      "pull_day",
      "leg_day",
      "chest_day",
      "back_day"
    ],
    preferredExerciseTypes: [
      "strength",
      "free_weight",
      "machine_strength",
      "calisthenics"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "lower_body",
      "carry"
    ],
    planningPriorities: [
      "progressive_overload",
      "compound_movements",
      "adequate_recovery",
      "movement_quality",
      "load_progression"
    ],
    aliases: [
      "get stronger",
      "strength training",
      "increase strength"
    ]
  },

  {
    id: "upper_body_strength",
    label: "Build Upper-Body Strength",
    shortLabel: "Upper Strength",
    category: "resistance",
    description:
      "Improve strength across the chest, back, shoulders, arms, and upper-body pushing and pulling patterns.",
    recommendedWorkoutFocuses: [
      "upper_body",
      "push_day",
      "pull_day",
      "chest_day",
      "back_day",
      "shoulder_day",
      "arm_day",
      "chest_triceps",
      "back_biceps"
    ],
    preferredExerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "arm_isolation",
      "shoulder_isolation"
    ],
    planningPriorities: [
      "push_pull_balance",
      "progressive_overload",
      "shoulder_stability",
      "muscle_group_balance"
    ],
    aliases: [
      "upper body strength",
      "stronger upper body"
    ]
  },

  {
    id: "lower_body_strength",
    label: "Build Lower-Body Strength",
    shortLabel: "Lower Strength",
    category: "resistance",
    description:
      "Improve strength across the glutes, quadriceps, hamstrings, calves, and major lower-body movement patterns.",
    recommendedWorkoutFocuses: [
      "leg_day",
      "glute_day",
      "lower_body",
      "full_body",
      "legs_core"
    ],
    preferredExerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "functional"
    ],
    preferredMovementFamilies: [
      "lower_body",
      "hip_isolation",
      "carry"
    ],
    planningPriorities: [
      "squat_hinge_balance",
      "unilateral_training",
      "progressive_overload",
      "posterior_chain",
      "recovery"
    ],
    aliases: [
      "lower body strength",
      "leg strength",
      "stronger legs"
    ]
  },

  {
    id: "glute_development",
    label: "Build Glutes",
    shortLabel: "Glutes",
    category: "resistance",
    description:
      "Increase glute strength and muscle development through hip extension, abduction, and lower-body training.",
    recommendedWorkoutFocuses: [
      "glute_day",
      "leg_day",
      "lower_body",
      "legs_core"
    ],
    preferredExerciseTypes: [
      "hypertrophy",
      "strength",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band"
    ],
    preferredMovementFamilies: [
      "lower_body",
      "hip_isolation"
    ],
    planningPriorities: [
      "hip_extension",
      "hip_abduction",
      "progressive_overload",
      "training_volume",
      "recovery"
    ],
    aliases: [
      "grow glutes",
      "glute growth",
      "glute strength"
    ]
  },

  {
    id: "core_strength",
    label: "Improve Core Strength",
    shortLabel: "Core",
    category: "resistance",
    description:
      "Improve trunk strength, stabilization, rotation control, and force transfer.",
    recommendedWorkoutFocuses: [
      "core_day",
      "legs_core",
      "full_body"
    ],
    preferredExerciseTypes: [
      "core",
      "strength",
      "calisthenics",
      "functional"
    ],
    preferredMovementFamilies: [
      "core",
      "core_stability",
      "carry"
    ],
    planningPriorities: [
      "anti_extension",
      "anti_rotation",
      "anti_lateral_flexion",
      "trunk_control",
      "progressive_difficulty"
    ],
    aliases: [
      "core strength",
      "stronger core",
      "abs strength"
    ]
  },

  {
    id: "cardio",
    label: "Improve Cardio",
    shortLabel: "Cardio",
    category: "cardio",
    description:
      "Improve cardiovascular fitness and the ability to sustain aerobic exercise.",
    recommendedWorkoutFocuses: [
      "cardio",
      "running",
      "endurance",
      "conditioning"
    ],
    preferredExerciseTypes: [
      "cardio",
      "running",
      "walking",
      "cycling",
      "rowing",
      "endurance"
    ],
    preferredMovementFamilies: [
      "locomotion",
      "conditioning"
    ],
    planningPriorities: [
      "aerobic_volume",
      "intensity_control",
      "progressive_duration",
      "recovery",
      "consistency"
    ],
    aliases: [
      "better cardio",
      "cardiovascular fitness",
      "aerobic fitness"
    ]
  },

  {
    id: "running",
    label: "Improve Running",
    shortLabel: "Running",
    category: "cardio",
    description:
      "Improve running consistency, pace, efficiency, and overall running performance.",
    recommendedWorkoutFocuses: [
      "running",
      "endurance",
      "speed_agility",
      "leg_day",
      "core_day",
      "mobility"
    ],
    preferredExerciseTypes: [
      "running",
      "endurance",
      "speed",
      "strength",
      "core",
      "mobility"
    ],
    preferredMovementFamilies: [
      "locomotion",
      "lower_body",
      "core_stability",
      "mobility"
    ],
    planningPriorities: [
      "easy_running",
      "quality_running",
      "long_run",
      "lower_body_strength",
      "core_stability",
      "mobility",
      "recovery"
    ],
    aliases: [
      "run better",
      "running performance",
      "improve run time",
      "faster running"
    ]
  },

  {
    id: "endurance",
    label: "Build Endurance",
    shortLabel: "Endurance",
    category: "cardio",
    description:
      "Improve the ability to sustain physical activity for longer periods with less fatigue.",
    recommendedWorkoutFocuses: [
      "endurance",
      "cardio",
      "running",
      "conditioning"
    ],
    preferredExerciseTypes: [
      "endurance",
      "cardio",
      "running",
      "cycling",
      "rowing",
      "walking"
    ],
    preferredMovementFamilies: [
      "locomotion",
      "conditioning"
    ],
    planningPriorities: [
      "progressive_duration",
      "aerobic_base",
      "pace_control",
      "recovery",
      "weekly_consistency"
    ],
    aliases: [
      "improve endurance",
      "stamina",
      "aerobic endurance"
    ]
  },

  {
    id: "speed",
    label: "Improve Speed",
    shortLabel: "Speed",
    category: "performance",
    description:
      "Improve acceleration, sprinting ability, and high-speed movement performance.",
    recommendedWorkoutFocuses: [
      "speed_agility",
      "running",
      "conditioning",
      "leg_day"
    ],
    preferredExerciseTypes: [
      "speed",
      "agility",
      "plyometric",
      "power",
      "sports_conditioning"
    ],
    preferredMovementFamilies: [
      "locomotion",
      "plyometric",
      "lower_body"
    ],
    planningPriorities: [
      "sprint_quality",
      "acceleration",
      "power",
      "full_recovery_between_efforts",
      "lower_body_strength"
    ],
    aliases: [
      "run faster",
      "sprint speed",
      "get faster"
    ]
  },

  {
    id: "power",
    label: "Build Power",
    shortLabel: "Power",
    category: "performance",
    description:
      "Improve explosive force production and the ability to generate force quickly.",
    recommendedWorkoutFocuses: [
      "speed_agility",
      "conditioning",
      "full_body",
      "lower_body"
    ],
    preferredExerciseTypes: [
      "power",
      "plyometric",
      "strength",
      "sports_conditioning"
    ],
    preferredMovementFamilies: [
      "plyometric",
      "lower_body",
      "push",
      "carry"
    ],
    planningPriorities: [
      "movement_speed",
      "explosive_quality",
      "strength_base",
      "full_recovery_between_efforts"
    ],
    aliases: [
      "explosiveness",
      "explosive power",
      "power training"
    ]
  },

  {
    id: "athletic_performance",
    label: "Improve Athletic Performance",
    shortLabel: "Athletic",
    category: "performance",
    description:
      "Develop a balanced combination of strength, power, speed, conditioning, stability, and movement quality.",
    recommendedWorkoutFocuses: [
      "full_body",
      "lower_body",
      "upper_body",
      "speed_agility",
      "conditioning",
      "core_day",
      "mobility"
    ],
    preferredExerciseTypes: [
      "strength",
      "power",
      "plyometric",
      "speed",
      "agility",
      "sports_conditioning",
      "functional",
      "core"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "lower_body",
      "plyometric",
      "locomotion",
      "carry",
      "core_stability"
    ],
    planningPriorities: [
      "strength",
      "power",
      "speed",
      "movement_quality",
      "conditioning",
      "recovery"
    ],
    aliases: [
      "sports performance",
      "athleticism",
      "perform better"
    ]
  },

  {
    id: "mobility",
    label: "Improve Mobility",
    shortLabel: "Mobility",
    category: "movement_quality",
    description:
      "Improve controlled and usable range of motion around joints.",
    recommendedWorkoutFocuses: [
      "mobility",
      "active_recovery",
      "stretching"
    ],
    preferredExerciseTypes: [
      "mobility",
      "flexibility",
      "recovery"
    ],
    preferredMovementFamilies: [
      "mobility",
      "flexibility"
    ],
    planningPriorities: [
      "controlled_range_of_motion",
      "joint_specific_work",
      "consistency",
      "movement_quality"
    ],
    aliases: [
      "move better",
      "joint mobility",
      "range of motion"
    ]
  },

  {
    id: "flexibility",
    label: "Improve Flexibility",
    shortLabel: "Flexibility",
    category: "movement_quality",
    description:
      "Improve comfortable range of motion through stretching and flexibility-focused training.",
    recommendedWorkoutFocuses: [
      "stretching",
      "mobility",
      "active_recovery"
    ],
    preferredExerciseTypes: [
      "flexibility",
      "mobility",
      "recovery"
    ],
    preferredMovementFamilies: [
      "flexibility",
      "mobility"
    ],
    planningPriorities: [
      "consistent_stretching",
      "comfortable_range",
      "major_muscle_groups",
      "recovery"
    ],
    aliases: [
      "stretch more",
      "become flexible"
    ]
  },

  {
    id: "general_fitness",
    label: "Improve General Fitness",
    shortLabel: "General Fitness",
    category: "general",
    description:
      "Improve overall physical fitness with a balanced combination of strength, cardio, core, mobility, and recovery.",
    recommendedWorkoutFocuses: [
      "full_body",
      "upper_body",
      "lower_body",
      "cardio",
      "core_day",
      "mobility",
      "active_recovery"
    ],
    preferredExerciseTypes: [
      "strength",
      "cardio",
      "functional",
      "core",
      "mobility",
      "walking"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "lower_body",
      "locomotion",
      "core_stability",
      "mobility"
    ],
    planningPriorities: [
      "balance",
      "consistency",
      "strength",
      "cardio",
      "mobility",
      "recovery"
    ],
    aliases: [
      "get fit",
      "overall fitness",
      "general health"
    ]
  },

  {
    id: "fat_loss_support",
    label: "Support Fat Loss",
    shortLabel: "Fat Loss",
    category: "general",
    description:
      "Support a fat-loss goal with a sustainable combination of resistance training, cardiovascular activity, and overall movement.",
    recommendedWorkoutFocuses: [
      "full_body",
      "upper_body",
      "lower_body",
      "cardio",
      "conditioning",
      "walking",
      "active_recovery"
    ],
    preferredExerciseTypes: [
      "strength",
      "cardio",
      "walking",
      "conditioning",
      "endurance",
      "functional"
    ],
    preferredMovementFamilies: [
      "push",
      "pull",
      "lower_body",
      "locomotion",
      "conditioning"
    ],
    planningPriorities: [
      "resistance_training",
      "cardio",
      "daily_movement",
      "consistency",
      "recovery"
    ],
    aliases: [
      "lose fat",
      "fat loss",
      "weight loss exercise"
    ]
  },

  {
    id: "recovery",
    label: "Improve Recovery",
    shortLabel: "Recovery",
    category: "recovery",
    description:
      "Use low-intensity movement, mobility, and rest scheduling to support recovery between harder sessions.",
    recommendedWorkoutFocuses: [
      "off_day",
      "active_recovery",
      "mobility",
      "stretching"
    ],
    preferredExerciseTypes: [
      "recovery",
      "walking",
      "mobility",
      "flexibility"
    ],
    preferredMovementFamilies: [
      "locomotion",
      "mobility",
      "flexibility"
    ],
    planningPriorities: [
      "low_intensity",
      "rest",
      "mobility",
      "sleep_support",
      "training_balance"
    ],
    aliases: [
      "recover better",
      "recovery day",
      "active recovery"
    ]
  }
]);

const FITNESS_GOAL_MAP = new Map(
  FITNESS_GOALS.map(
    goal => [goal.id, goal]
  )
);

const FITNESS_GOAL_ALIAS_MAP = new Map();

for (const goal of FITNESS_GOALS) {
  const aliases = [
    goal.id,
    goal.label,
    goal.shortLabel,
    ...(goal.aliases || [])
  ];

  for (const alias of aliases) {
    FITNESS_GOAL_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      goal.id
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

function getFitnessGoal(idOrAlias) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    FITNESS_GOAL_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return FITNESS_GOAL_MAP.get(
    resolvedId
  ) || null;
}

function hasFitnessGoal(idOrAlias) {
  return Boolean(
    getFitnessGoal(idOrAlias)
  );
}

function getFitnessGoals({
  category = null,
  workoutFocus = null,
  exerciseType = null,
  movementFamily = null
} = {}) {
  const normalizedCategory =
    normalizeText(category);

  const normalizedWorkoutFocus =
    normalizeText(workoutFocus);

  const normalizedExerciseType =
    normalizeText(exerciseType);

  const normalizedMovementFamily =
    normalizeText(movementFamily);

  return FITNESS_GOALS.filter(
    goal => {
      if (
        normalizedCategory &&
        normalizeText(goal.category) !==
          normalizedCategory
      ) {
        return false;
      }

      if (
        normalizedWorkoutFocus &&
        !(goal.recommendedWorkoutFocuses || []).some(
          item =>
            normalizeText(item) ===
            normalizedWorkoutFocus
        )
      ) {
        return false;
      }

      if (
        normalizedExerciseType &&
        !(goal.preferredExerciseTypes || []).some(
          item =>
            normalizeText(item) ===
            normalizedExerciseType
        )
      ) {
        return false;
      }

      if (
        normalizedMovementFamily &&
        !(goal.preferredMovementFamilies || []).some(
          item =>
            normalizeText(item) ===
            normalizedMovementFamily
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchFitnessGoals(query) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [...FITNESS_GOALS];
  }

  return FITNESS_GOALS.filter(
    goal => {
      const searchable = [
        goal.id,
        goal.label,
        goal.shortLabel,
        goal.category,
        goal.description,
        ...(goal.recommendedWorkoutFocuses || []),
        ...(goal.preferredExerciseTypes || []),
        ...(goal.preferredMovementFamilies || []),
        ...(goal.planningPriorities || []),
        ...(goal.aliases || [])
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

function getFitnessGoalIds() {
  return FITNESS_GOALS.map(
    goal => goal.id
  );
}

const AriTrainingFitnessGoals =
  Object.freeze({
    version: VERSION,
    source: SOURCE,
    all: FITNESS_GOALS,
    get: getFitnessGoal,
    has: hasFitnessGoal,
    list: getFitnessGoals,
    search: searchFitnessGoals,
    ids: getFitnessGoalIds
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

  Ari.training.fitnessGoals =
    AriTrainingFitnessGoals;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  FITNESS_GOALS,
  getFitnessGoal,
  hasFitnessGoal,
  getFitnessGoals,
  searchFitnessGoals,
  getFitnessGoalIds,
  AriTrainingFitnessGoals
};

export default AriTrainingFitnessGoals;
