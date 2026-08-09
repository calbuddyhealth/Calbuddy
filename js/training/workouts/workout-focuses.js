// =====================================================
// ARI REBIRTH
// File: js/training/workouts/workout-focuses.js
// Version: 1.1.0
// Purpose:
//   Central registry for user-facing workout-day focuses
//   used by the ARI Training weekly planner and templates.
//
// V1.1.0:
//   - Preserves all existing workout-focus IDs.
//   - Adds new V1.1 movement-pattern coverage.
//   - Adds hip abduction and hip adduction to Leg Day.
//   - Adds hip abduction, hip adduction, and hip external
//     rotation to Lower Body.
//   - Expands Glute Day with hip extension and external
//     rotation patterns.
//   - Expands Legs + Core lower-body isolation coverage.
//   - Expands Full Body lower-body movement coverage.
//   - Adds chest fly / horizontal-adduction support.
//   - Adds shoulder flexion, external rotation, and
//     scapular elevation support.
//   - Adds forearm and wrist movement coverage to Arm Day.
//   - Improves focus-aware exercise recommendations and
//     exercise-picker visibility for isolation exercises.
//
// Design:
//   - Uses familiar gym language such as Chest Day,
//     Leg Day, Push Day, Upper Body, and Full Body.
//   - Maps each workout focus to body parts, movement
//     patterns, movement families, exercise types, and goals.
//   - Includes cardio, running, mobility, recovery,
//     conditioning, and Off Day options.
//   - Exercise selection still comes from the approved
//     ARI Exercise Library.
// =====================================================

const VERSION = "1.1.0";

const SOURCE =
  "js/training/workouts/workout-focuses";


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

    movementPatterns: [],

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

    primaryBodyParts: [
      "full_body"
    ],

    movementPatterns: [
      "walking",
      "mobility",
      "dynamic_stretch",
      "static_stretch"
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
      "horizontal_push",
      "shoulder_horizontal_adduction"
    ],

    movementFamilies: [
      "push",
      "chest_isolation"
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
      "vertical_pull",
      "shoulder_horizontal_abduction",
      "scapular_elevation"
    ],

    movementFamilies: [
      "pull",
      "shoulder_isolation",
      "shoulder_girdle"
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
      "A resistance-training session focused primarily on the deltoids, rotator cuff, and shoulder girdle.",

    bodyParts: [
      "shoulders",
      "back"
    ],

    primaryBodyParts: [
      "shoulders"
    ],

    movementPatterns: [
      "vertical_push",
      "shoulder_flexion",
      "shoulder_abduction",
      "shoulder_horizontal_abduction",
      "shoulder_external_rotation",
      "scapular_elevation"
    ],

    movementFamilies: [
      "push",
      "shoulder_isolation",
      "shoulder_stability",
      "shoulder_girdle"
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
      "delt day",
      "shoulder workout"
    ]
  },


  {
    id: "arm_day",

    label: "Arm Day",

    shortLabel: "Arms",

    category: "strength",

    isTrainingDay: true,

    description:
      "A resistance-training session focused on the biceps, triceps, forearms, and grip musculature.",

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
      "elbow_extension",
      "wrist_flexion",
      "wrist_extension",
      "forearm_supination",
      "forearm_pronation"
    ],

    movementFamilies: [
      "arm_isolation",
      "forearm_isolation"
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
      "biceps and triceps",
      "arm workout"
    ]
  },


  {
    id: "leg_day",

    label: "Leg Day",

    shortLabel: "Legs",

    category: "strength",

    isTrainingDay: true,

    description:
      "A complete lower-body resistance session including the quadriceps, hamstrings, glutes, calves, hip abductors, hip adductors, and supporting hip musculature.",

    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "adductors",
      "abductors",
      "shins"
    ],

    primaryBodyParts: [
      "quadriceps",
      "hamstrings",
      "glutes"
    ],

    secondaryBodyParts: [
      "calves",
      "hips",
      "adductors",
      "abductors",
      "shins"
    ],

    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "step",

      "knee_flexion",
      "knee_extension",

      "hip_extension",
      "hip_abduction",
      "hip_adduction",
      "hip_external_rotation",

      "calf_raise",
      "ankle_dorsiflexion"
    ],

    movementFamilies: [
      "lower_body",
      "lower_body_isolation",
      "hip_isolation"
    ],

    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band",
      "functional",
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
      "lower body day",
      "leg workout"
    ]
  },


  {
    id: "glute_day",

    label: "Glute Day",

    shortLabel: "Glutes",

    category: "strength",

    isTrainingDay: true,

    description:
      "A lower-body session focused on the gluteal muscles, hip extension, hip abduction, external rotation, and supporting posterior-chain movements.",

    bodyParts: [
      "glutes",
      "hips",
      "hamstrings",
      "abductors",
      "lower_body"
    ],

    primaryBodyParts: [
      "glutes"
    ],

    secondaryBodyParts: [
      "hips",
      "hamstrings",
      "abductors"
    ],

    movementPatterns: [
      "hip_extension",
      "hip_hinge",
      "hip_abduction",
      "hip_external_rotation",
      "lunge",
      "step",
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
      "resistance_band",
      "functional"
    ],

    goals: [
      "muscle_building",
      "lower_body_strength",
      "glute_development"
    ],

    aliases: [
      "glutes",
      "glute workout",
      "glute day"
    ]
  },


  {
    id: "core_day",

    label: "Core Day",

    shortLabel: "Core",

    category: "strength",

    isTrainingDay: true,

    description:
      "A session focused on trunk strength, abdominal training, spinal control, rotation, and core stability.",

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
      "spinal_extension",
      "trunk_rotation",
      "trunk_lateral_flexion",
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
      "A session that combines major upper-body pushing, pulling, shoulder, and arm movements.",

    bodyParts: [
      "upper_body",
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "forearms"
    ],

    primaryBodyParts: [
      "upper_body"
    ],

    movementPatterns: [
      "horizontal_push",
      "vertical_push",

      "horizontal_pull",
      "vertical_pull",

      "shoulder_horizontal_adduction",
      "shoulder_flexion",
      "shoulder_abduction",
      "shoulder_horizontal_abduction",

      "elbow_flexion",
      "elbow_extension"
    ],

    movementFamilies: [
      "push",
      "pull",
      "chest_isolation",
      "shoulder_isolation",
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
      "A complete lower-body session combining major compound movements with quadriceps, hamstring, calf, and hip isolation work.",

    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "adductors",
      "abductors",
      "shins"
    ],

    primaryBodyParts: [
      "lower_body"
    ],

    secondaryBodyParts: [
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "adductors",
      "abductors",
      "shins"
    ],

    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "step",

      "hip_extension",
      "hip_abduction",
      "hip_adduction",
      "hip_external_rotation",

      "knee_flexion",
      "knee_extension",

      "calf_raise",
      "ankle_dorsiflexion"
    ],

    movementFamilies: [
      "lower_body",
      "lower_body_isolation",
      "hip_isolation"
    ],

    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "machine_strength",
      "cable",
      "resistance_band",
      "functional",
      "calisthenics"
    ],

    goals: [
      "muscle_building",
      "strength",
      "lower_body_strength"
    ],

    aliases: [
      "lower",
      "lower body day",
      "lower body workout"
    ]
  },


  {
    id: "full_body",

    label: "Full Body",

    shortLabel: "Full Body",

    category: "strength",

    isTrainingDay: true,

    description:
      "A session that trains major upper-body, lower-body, hip, and core movement patterns in one workout.",

    bodyParts: [
      "full_body",
      "upper_body",
      "lower_body",
      "core",
      "chest",
      "back",
      "shoulders",
      "quadriceps",
      "hamstrings",
      "glutes",
      "hips"
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
      "step",

      "hip_extension",
      "hip_abduction",
      "hip_adduction",

      "anti_extension",
      "anti_rotation",

      "loaded_carry"
    ],

    movementFamilies: [
      "push",
      "pull",
      "lower_body",
      "hip_isolation",
      "core_stability",
      "carry"
    ],

    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight",
      "machine_strength",
      "cable",
      "calisthenics"
    ],

    goals: [
      "general_fitness",
      "strength",
      "muscle_building"
    ],

    aliases: [
      "total body",
      "whole body",
      "full body workout"
    ]
  },


  {
    id: "push_day",

    label: "Push Day",

    shortLabel: "Push",

    category: "strength",

    isTrainingDay: true,

    description:
      "A session focused on pressing and chest-adduction movements involving the chest, shoulders, and triceps.",

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
      "shoulder_horizontal_adduction",
      "shoulder_flexion",
      "shoulder_abduction",
      "elbow_extension"
    ],

    movementFamilies: [
      "push",
      "chest_isolation",
      "shoulder_isolation",
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
      "A session focused on pulling movements involving the back, biceps, rear shoulders, upper traps, and grip.",

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
      "shoulder_horizontal_abduction",
      "scapular_elevation"
    ],

    movementFamilies: [
      "pull",
      "arm_isolation",
      "shoulder_isolation",
      "shoulder_girdle"
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
      "A combined session pairing chest pressing and fly movements with direct triceps work.",

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
      "shoulder_horizontal_adduction",
      "elbow_extension"
    ],

    movementFamilies: [
      "push",
      "chest_isolation",
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
      "forearms",
      "shoulders"
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
      "pull",
      "arm_isolation",
      "shoulder_isolation"
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
      "A combined lower-body and core session including compound leg movements, hip isolation, and trunk training.",

    bodyParts: [
      "lower_body",
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "adductors",
      "abductors",
      "core",
      "abdominals",
      "obliques",
      "lower_back"
    ],

    primaryBodyParts: [
      "lower_body",
      "core"
    ],

    secondaryBodyParts: [
      "quadriceps",
      "hamstrings",
      "glutes",
      "hips",
      "adductors",
      "abductors"
    ],

    movementPatterns: [
      "squat",
      "hip_hinge",
      "lunge",
      "step",

      "hip_extension",
      "hip_abduction",
      "hip_adduction",

      "knee_flexion",
      "knee_extension",
      "calf_raise",

      "trunk_flexion",
      "spinal_extension",
      "trunk_rotation",
      "anti_extension",
      "anti_rotation",
      "anti_lateral_flexion"
    ],

    movementFamilies: [
      "lower_body",
      "lower_body_isolation",
      "hip_isolation",
      "core",
      "core_stability"
    ],

    exerciseTypes: [
      "strength",
      "hypertrophy",
      "core",
      "free_weight",
      "machine_strength",
      "cable",
      "functional",
      "calisthenics"
    ],

    goals: [
      "strength",
      "muscle_building",
      "lower_body_strength",
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
      "A performance session focused on acceleration, sprinting, footwork, jumping, and change of direction.",

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
      "sports_conditioning",
      "power"
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

    secondaryBodyParts: [],

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


// =====================================================
// MAPS
// =====================================================

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


for (
  const focus
  of WORKOUT_FOCUSES
) {
  const aliases = [
    focus.id,
    focus.label,
    focus.shortLabel,
    ...(focus.aliases || [])
  ];

  for (
    const alias
    of aliases
  ) {
    const normalized =
      String(
        alias ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !WORKOUT_FOCUS_ALIAS_MAP
        .has(
          normalized
        )
    ) {
      WORKOUT_FOCUS_ALIAS_MAP
        .set(
          normalized,
          focus.id
        );
    }
  }
}


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
// LOOKUPS
// =====================================================

function getWorkoutFocus(
  idOrAlias
) {
  const normalized =
    normalizeText(
      idOrAlias
    );

  if (!normalized) {
    return null;
  }

  const resolvedId =
    WORKOUT_FOCUS_ALIAS_MAP
      .get(
        normalized
      ) ||
    normalized;

  return (
    WORKOUT_FOCUS_MAP
      .get(
        resolvedId
      ) ||
    null
  );
}


function hasWorkoutFocus(
  idOrAlias
) {
  return Boolean(
    getWorkoutFocus(
      idOrAlias
    )
  );
}


// =====================================================
// FILTERING
// =====================================================

function getWorkoutFocuses({
  category = null,
  trainingDaysOnly = false,
  goal = null,
  bodyPart = null,
  movementPattern = null,
  movementFamily = null,
  exerciseType = null
} = {}) {
  const normalizedCategory =
    normalizeText(
      category
    );

  const normalizedGoal =
    normalizeText(
      goal
    );

  const normalizedBodyPart =
    normalizeText(
      bodyPart
    );

  const normalizedMovementPattern =
    normalizeText(
      movementPattern
    );

  const normalizedMovementFamily =
    normalizeText(
      movementFamily
    );

  const normalizedExerciseType =
    normalizeText(
      exerciseType
    );


  return WORKOUT_FOCUSES.filter(
    focus => {

      if (
        normalizedCategory &&
        normalizeText(
          focus.category
        ) !==
          normalizedCategory
      ) {
        return false;
      }


      if (
        trainingDaysOnly &&
        focus.isTrainingDay !==
          true
      ) {
        return false;
      }


      if (
        normalizedGoal &&
        !(
          focus.goals ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedGoal
        )
      ) {
        return false;
      }


      if (
        normalizedBodyPart &&
        ![
          ...(focus.bodyParts || []),
          ...(focus.primaryBodyParts || []),
          ...(focus.secondaryBodyParts || [])
        ].some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedBodyPart
        )
      ) {
        return false;
      }


      if (
        normalizedMovementPattern &&
        !(
          focus.movementPatterns ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedMovementPattern
        )
      ) {
        return false;
      }


      if (
        normalizedMovementFamily &&
        !(
          focus.movementFamilies ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedMovementFamily
        )
      ) {
        return false;
      }


      if (
        normalizedExerciseType &&
        !(
          focus.exerciseTypes ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedExerciseType
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

function searchWorkoutFocuses(
  query
) {
  const normalized =
    normalizeText(
      query
    );

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

        ...(focus.secondaryBodyParts || []),

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


// =====================================================
// IDS
// =====================================================

function getWorkoutFocusIds() {
  return WORKOUT_FOCUSES.map(
    focus =>
      focus.id
  );
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingWorkoutFocuses =
  Object.freeze({

    version:
      VERSION,

    source:
      SOURCE,

    all:
      WORKOUT_FOCUSES,

    get:
      getWorkoutFocus,

    has:
      hasWorkoutFocus,

    list:
      getWorkoutFocuses,

    search:
      searchWorkoutFocuses,

    ids:
      getWorkoutFocusIds
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

  Ari.training
    .workoutFocuses =
      AriTrainingWorkoutFocuses;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

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


export default
  AriTrainingWorkoutFocuses;