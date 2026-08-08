// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/back.js
// Version: 1.0.0
// Purpose:
//   Back-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves existing exercise IDs already used by plans.
//   - Adds common vertical pulls, rows, machine/cable work,
//     rear-back isolation, and lower-back/posterior-chain work.
//   - Uses existing anatomy and movement IDs.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, and setup metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/back";

const BACK_EXERCISES = Object.freeze([
  // ===================================================
  // VERTICAL PULLS
  // ===================================================
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    aliases: [
      "pulldown",
      "lat pull down",
      "wide grip pulldown"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major", "trapezius_lower"],
    movementPatterns: ["vertical_pull"],
    equipment: ["lat_pulldown_machine", "cable_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "pull_up",
      "assisted_pull_up",
      "neutral_grip_lat_pulldown",
      "close_grip_lat_pulldown"
    ],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull the bar from overhead toward the upper chest while driving the elbows downward.",
    instructions: [
      "Secure the thighs under the pad.",
      "Grip the bar overhead.",
      "Pull the elbows down toward the sides of the torso.",
      "Return the bar overhead under control."
    ],
    cues: [
      "Avoid pulling behind the neck.",
      "Do not turn the movement into a large backward lean."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "neutral_grip_lat_pulldown",
    name: "Neutral-Grip Lat Pulldown",
    aliases: [
      "neutral grip pulldown",
      "parallel grip lat pulldown",
      "neutral pulldown"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["lat_pulldown_machine", "cable_machine", "neutral_grip_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "lat_pulldown",
      "close_grip_lat_pulldown",
      "pull_up"
    ],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull a neutral-grip attachment toward the upper chest while keeping the elbows close to the body.",
    instructions: [
      "Secure the thighs under the pad.",
      "Grip the handles with palms facing each other.",
      "Drive the elbows down toward the ribs.",
      "Return overhead under control."
    ],
    cues: [
      "Keep the chest tall.",
      "Avoid excessive torso rocking."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "close_grip_lat_pulldown",
    name: "Close-Grip Lat Pulldown",
    aliases: [
      "close grip pulldown",
      "close grip lat pull down",
      "v bar pulldown"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["lat_pulldown_machine", "cable_machine", "close_grip_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "lat_pulldown",
      "neutral_grip_lat_pulldown",
      "pull_up"
    ],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Pull a close-grip cable attachment toward the chest to train the lats and elbow flexors.",
    instructions: [
      "Sit securely under the thigh pad.",
      "Grip the close attachment.",
      "Pull the elbows downward and slightly back.",
      "Return under control."
    ],
    cues: [
      "Avoid overextending the lower back.",
      "Keep the shoulders down."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_lat_pulldown",
    name: "Single-Arm Lat Pulldown",
    aliases: [
      "one arm lat pulldown",
      "single arm pulldown",
      "unilateral lat pulldown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "lat_pulldown",
      "one_arm_dumbbell_row"
    ],
    laterality: "unilateral",
    setup: "seated_or_kneeling_cable",
    goals: {
      muscle_building: 9,
      strength: 7,
      upper_body_strength: 8
    },
    summary:
      "Pull one cable handle downward toward the side of the torso to train each lat independently.",
    instructions: [
      "Set the cable overhead.",
      "Brace the torso.",
      "Drive the working elbow down toward the hip.",
      "Return slowly before switching sides."
    ],
    cues: [
      "Avoid rotating the torso.",
      "Think elbow to hip."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "pull_up",
    name: "Pull-Up",
    aliases: [
      "pullup",
      "overhand pull up",
      "bodyweight pull up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["back", "biceps", "forearms", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "brachioradialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "lat_pulldown",
      "assisted_pull_up",
      "neutral_grip_pull_up"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      muscle_building: 9,
      strength: 10,
      upper_body_strength: 10,
      general_fitness: 8
    },
    summary:
      "Pull the body upward from a hanging position until the upper chest approaches the bar, then lower under control.",
    instructions: [
      "Begin from a controlled hang.",
      "Set the shoulder blades and pull the elbows downward.",
      "Raise the body toward the bar.",
      "Lower to the starting position under control."
    ],
    cues: [
      "Avoid excessive swinging.",
      "Keep the movement controlled through the full range available."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "neutral_grip_pull_up",
    name: "Neutral-Grip Pull-Up",
    aliases: [
      "neutral pull up",
      "parallel grip pull up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["back", "biceps", "forearms", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "brachioradialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "neutral_grip_handles", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "pull_up",
      "lat_pulldown",
      "assisted_pull_up"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 10
    },
    summary:
      "Perform a pull-up using a palms-facing neutral grip for a strong lat and elbow-flexor stimulus.",
    instructions: [
      "Grip parallel handles.",
      "Begin from a controlled hang.",
      "Drive the elbows downward.",
      "Lower slowly to the start."
    ],
    cues: [
      "Avoid swinging.",
      "Keep the shoulders controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "assisted_pull_up",
    name: "Assisted Pull-Up",
    aliases: [
      "assisted pullup",
      "machine assisted pull up",
      "band assisted pull up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics", "machine_strength"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["assisted_pull_up_machine", "resistance_band", "pull_up_bar"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "pull_up",
      "lat_pulldown"
    ],
    laterality: "bilateral",
    setup: "hanging_or_machine",
    goals: {
      muscle_building: 8,
      strength: 8,
      upper_body_strength: 9,
      general_fitness: 8
    },
    summary:
      "Perform a pull-up with machine or band assistance to reduce the effective bodyweight load.",
    instructions: [
      "Set the assistance level.",
      "Grip the handles securely.",
      "Pull the body upward under control.",
      "Lower slowly."
    ],
    cues: [
      "Use only enough assistance to maintain good form.",
      "Avoid bouncing from the bottom."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "chin_up",
    name: "Chin-Up",
    aliases: [
      "chinup",
      "underhand pull up",
      "supinated pull up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["back", "biceps", "forearms", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "brachioradialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats + Biceps"
    },
    substitutionGroup: "vertical_pull",
    substitutions: [
      "pull_up",
      "neutral_grip_pull_up",
      "close_grip_lat_pulldown"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      muscle_building: 9,
      strength: 10,
      upper_body_strength: 10
    },
    summary:
      "Pull the body upward using an underhand grip, emphasizing the lats while increasing biceps involvement.",
    instructions: [
      "Grip the bar with palms facing you.",
      "Start from a controlled hang.",
      "Pull the chest toward the bar.",
      "Lower under control."
    ],
    cues: [
      "Avoid swinging.",
      "Keep the elbows driving downward."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // HORIZONTAL ROWS
  // ===================================================
  {
    id: "seated_cable_row",
    name: "Seated Cable Row",
    aliases: [
      "cable row",
      "seated row",
      "low cable row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["biceps_brachii", "posterior_deltoid", "brachialis"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "mid_back",
      label: "Mid Back"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "barbell_bent_over_row",
      "one_arm_dumbbell_row",
      "chest_supported_row",
      "machine_row"
    ],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull the cable handle toward the torso while drawing the shoulder blades back, then return with control.",
    instructions: [
      "Sit tall with the feet supported.",
      "Begin with the arms extended.",
      "Pull the handle toward the torso.",
      "Return the arms forward without collapsing the posture."
    ],
    cues: [
      "Avoid excessive torso rocking.",
      "Keep the shoulders away from the ears."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "barbell_bent_over_row",
    name: "Barbell Bent-Over Row",
    aliases: [
      "barbell row",
      "bent over row",
      "bb row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "lower_back", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii", "erector_spinae"],
    movementPatterns: ["horizontal_pull", "hip_hinge"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "mid_back",
      label: "Mid Back"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "seated_cable_row",
      "one_arm_dumbbell_row",
      "chest_supported_row",
      "t_bar_row"
    ],
    laterality: "bilateral",
    setup: "standing_hinged",
    goals: {
      muscle_building: 10,
      strength: 9,
      upper_body_strength: 9
    },
    summary:
      "Hold a hip-hinged position and row the bar toward the torso while keeping the trunk stable.",
    instructions: [
      "Hinge at the hips with a neutral, controlled torso.",
      "Let the bar hang beneath the shoulders.",
      "Pull the bar toward the lower ribs or upper abdomen.",
      "Lower it under control."
    ],
    cues: [
      "Keep the trunk position consistent.",
      "Avoid jerking the bar upward."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "one_arm_dumbbell_row",
    name: "One-Arm Dumbbell Row",
    aliases: [
      "one arm row",
      "single arm dumbbell row",
      "dumbbell row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["rhomboid_major", "trapezius_middle", "posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "seated_cable_row",
      "barbell_bent_over_row",
      "single_arm_cable_row"
    ],
    laterality: "unilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Support the body with one arm and row a dumbbell toward the hip while keeping the torso controlled.",
    instructions: [
      "Support one hand on a bench or stable surface.",
      "Allow the working arm to hang below the shoulder.",
      "Pull the dumbbell toward the hip.",
      "Lower it slowly."
    ],
    cues: [
      "Avoid rotating the torso excessively.",
      "Drive the elbow back rather than shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "chest_supported_row",
    name: "Chest-Supported Row",
    aliases: [
      "chest supported dumbbell row",
      "incline bench row",
      "seal style row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["rhomboid_major", "trapezius_middle", "latissimus_dorsi"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["dumbbells", "incline_bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_middle",
      region: "mid_back",
      label: "Mid Back"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "machine_row",
      "seated_cable_row",
      "one_arm_dumbbell_row"
    ],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Row dumbbells while the chest is supported on an incline bench to reduce lower-back involvement.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Lie chest-down with the dumbbells hanging.",
      "Row the elbows back toward the torso.",
      "Lower slowly."
    ],
    cues: [
      "Keep the chest in contact with the pad.",
      "Avoid shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "t_bar_row",
    name: "T-Bar Row",
    aliases: [
      "t bar row",
      "landmine row",
      "plate loaded t bar row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight", "machine_strength"],
    bodyParts: ["back", "biceps", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii", "erector_spinae"],
    movementPatterns: ["horizontal_pull", "hip_hinge"],
    equipment: ["t_bar_row_machine", "landmine", "barbell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "mid_back",
      label: "Mid Back"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "barbell_bent_over_row",
      "machine_row",
      "chest_supported_row"
    ],
    laterality: "bilateral",
    setup: "standing_hinged_or_supported",
    goals: {
      muscle_building: 10,
      strength: 9,
      upper_body_strength: 9
    },
    summary:
      "Row a T-bar or landmine-loaded bar toward the torso from a stable hinged or supported position.",
    instructions: [
      "Set the feet and torso securely.",
      "Grip the handles.",
      "Pull the load toward the lower chest or upper abdomen.",
      "Lower under control."
    ],
    cues: [
      "Avoid excessive torso movement.",
      "Drive the elbows back."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_row",
    name: "Machine Row",
    aliases: [
      "seated machine row",
      "plate loaded row",
      "row machine"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["row_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_middle",
      region: "mid_back",
      label: "Mid Back"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "seated_cable_row",
      "chest_supported_row",
      "t_bar_row"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull machine handles toward the torso while keeping the chest and torso supported.",
    instructions: [
      "Adjust the seat and chest support if available.",
      "Grip the handles.",
      "Pull the elbows back.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders down.",
      "Avoid slamming the weight."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_cable_row",
    name: "Single-Arm Cable Row",
    aliases: [
      "one arm cable row",
      "unilateral cable row",
      "single handle row"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["rhomboid_major", "trapezius_middle", "posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull", "anti_rotation"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "horizontal_row",
    substitutions: [
      "one_arm_dumbbell_row",
      "seated_cable_row"
    ],
    laterality: "unilateral",
    setup: "seated_or_standing_cable",
    goals: {
      muscle_building: 9,
      strength: 7,
      upper_body_strength: 8,
      core_strength: 5
    },
    summary:
      "Row one cable handle toward the torso while resisting unwanted trunk rotation.",
    instructions: [
      "Set a stable seated or standing position.",
      "Begin with the working arm extended.",
      "Pull the elbow back toward the hip or lower ribs.",
      "Return slowly."
    ],
    cues: [
      "Keep the torso square.",
      "Avoid shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // LAT / SCAPULAR ISOLATION
  // ===================================================
  {
    id: "straight_arm_pulldown",
    name: "Straight-Arm Pulldown",
    aliases: [
      "straight arm cable pulldown",
      "lat prayer",
      "cable pullover"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["back", "shoulders", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["teres_major", "triceps_brachii"],
    movementPatterns: ["vertical_pull"],
    equipment: ["cable_machine", "straight_bar_attachment", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "lat_isolation",
    substitutions: [
      "dumbbell_pullover",
      "single_arm_lat_pulldown"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Pull a cable attachment downward with mostly straight arms to isolate shoulder extension and the lats.",
    instructions: [
      "Stand facing a high cable.",
      "Begin with the arms extended overhead.",
      "Pull the attachment down toward the thighs.",
      "Return slowly."
    ],
    cues: [
      "Keep only a soft elbow bend.",
      "Avoid turning it into a triceps pressdown."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_pullover",
    name: "Dumbbell Pullover",
    aliases: [
      "db pullover",
      "pullover",
      "bench pullover"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["back", "chest", "shoulders", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["pectoralis_major", "teres_major", "triceps_brachii"],
    movementPatterns: ["vertical_pull"],
    equipment: ["dumbbell", "bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "general",
      label: "Lats"
    },
    substitutionGroup: "lat_isolation",
    substitutions: [
      "straight_arm_pulldown"
    ],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 8,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Lower a dumbbell behind the head from a bench position, then pull it back over the torso using the lats and chest.",
    instructions: [
      "Lie securely on a bench.",
      "Hold one dumbbell above the chest.",
      "Lower it behind the head in a controlled arc.",
      "Pull it back over the torso."
    ],
    cues: [
      "Use a comfortable shoulder range.",
      "Keep the ribs controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "face_pull",
    name: "Face Pull",
    aliases: [
      "rope face pull",
      "cable face pull",
      "band face pull"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable", "resistance_band"],
    bodyParts: ["back", "shoulders", "upper_body"],
    primaryMuscles: ["posterior_deltoid", "infraspinatus", "teres_minor"],
    secondaryMuscles: ["trapezius_middle", "rhomboid_major"],
    movementPatterns: ["horizontal_pull", "shoulder_horizontal_abduction"],
    equipment: ["cable_machine", "resistance_band", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder_upper_back",
      label: "Rear Delts + Upper Back"
    },
    substitutionGroup: "rear_delt_pull",
    substitutions: [
      "reverse_fly",
      "reverse_pec_deck"
    ],
    laterality: "bilateral",
    setup: "standing_cable_or_band",
    goals: {
      muscle_building: 7,
      upper_body_strength: 6,
      general_fitness: 7
    },
    summary:
      "Pull a rope or band toward the face while opening the elbows and controlling the shoulder blades.",
    instructions: [
      "Set the cable or band near face height.",
      "Begin with the arms extended.",
      "Pull toward the face while opening the hands apart.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging.",
      "Use a controlled range rather than momentum."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_pec_deck",
    name: "Reverse Pec Deck",
    aliases: [
      "reverse fly machine",
      "rear delt machine",
      "reverse butterfly"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["shoulders", "back", "upper_body"],
    primaryMuscles: ["posterior_deltoid"],
    secondaryMuscles: ["rhomboid_major", "rhomboid_minor", "trapezius_middle"],
    movementPatterns: ["shoulder_horizontal_abduction"],
    equipment: ["reverse_fly_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder_upper_back",
      label: "Rear Delts + Upper Back"
    },
    substitutionGroup: "rear_delt_pull",
    substitutions: [
      "face_pull",
      "reverse_fly"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 9,
      upper_body_strength: 6,
      general_fitness: 6
    },
    summary:
      "Open the arms outward on a reverse pec-deck machine to train the rear delts and upper-back muscles.",
    instructions: [
      "Adjust the seat so the handles align near shoulder height.",
      "Keep the chest supported.",
      "Open the arms outward.",
      "Return slowly."
    ],
    cues: [
      "Avoid shrugging.",
      "Keep the movement smooth."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // LOWER BACK / POSTERIOR CHAIN
  // ===================================================
  {
    id: "back_extension",
    name: "Back Extension",
    aliases: [
      "hyperextension",
      "45 degree back extension",
      "roman chair extension"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy"],
    bodyParts: ["lower_back", "glutes", "hamstrings", "core"],
    primaryMuscles: ["erector_spinae"],
    secondaryMuscles: ["gluteus_maximus", "biceps_femoris", "semitendinosus", "semimembranosus"],
    movementPatterns: ["hip_hinge"],
    equipment: ["back_extension_bench", "bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "erector_spinae",
      region: "lower_back",
      label: "Lower Back"
    },
    substitutionGroup: "posterior_chain_accessory",
    substitutions: [
      "romanian_deadlift",
      "good_morning"
    ],
    laterality: "bilateral",
    setup: "back_extension_bench",
    goals: {
      muscle_building: 7,
      strength: 7,
      lower_body_strength: 6,
      core_strength: 7
    },
    summary:
      "Extend the hips and trunk from a supported back-extension bench while keeping the movement controlled.",
    instructions: [
      "Set the pad below the hips.",
      "Begin with the torso lowered under control.",
      "Extend the hips and trunk to a neutral position.",
      "Lower slowly."
    ],
    cues: [
      "Do not hyperextend the lower back.",
      "Use the hips and glutes as well as the spinal erectors."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "good_morning",
    name: "Good Morning",
    aliases: [
      "barbell good morning",
      "good mornings"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_back", "hamstrings", "glutes", "core", "lower_body"],
    primaryMuscles: ["erector_spinae", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "semitendinosus", "semimembranosus"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "rack"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "erector_spinae",
      region: "posterior_chain",
      label: "Posterior Chain"
    },
    substitutionGroup: "posterior_chain_accessory",
    substitutions: [
      "romanian_deadlift",
      "back_extension"
    ],
    laterality: "bilateral",
    setup: "standing_barbell",
    goals: {
      muscle_building: 8,
      strength: 8,
      lower_body_strength: 8,
      athletic_performance: 7
    },
    summary:
      "Hinge forward with a barbell supported on the upper back, then extend the hips to return to standing.",
    instructions: [
      "Set the bar securely across the upper back.",
      "Brace the torso.",
      "Push the hips backward while maintaining a controlled spine.",
      "Drive the hips forward to stand."
    ],
    cues: [
      "Use a conservative load.",
      "Keep the bar stable.",
      "Do not turn the movement into a squat."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rack_pull",
    name: "Rack Pull",
    aliases: [
      "block pull",
      "partial deadlift",
      "rack deadlift"
    ],
    category: "strength",
    exerciseTypes: ["strength", "free_weight"],
    bodyParts: ["back", "lower_back", "glutes", "hamstrings", "forearms", "upper_body", "lower_body"],
    primaryMuscles: ["erector_spinae", "gluteus_maximus"],
    secondaryMuscles: ["latissimus_dorsi", "trapezius_upper", "forearm_flexors", "biceps_femoris"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "rack", "blocks"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "erector_spinae",
      region: "posterior_chain",
      label: "Back + Posterior Chain"
    },
    substitutionGroup: "posterior_chain_heavy",
    substitutions: [
      "conventional_deadlift",
      "romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "rack_or_blocks",
    goals: {
      strength: 10,
      muscle_building: 7,
      upper_body_strength: 8,
      lower_body_strength: 8
    },
    summary:
      "Pull a barbell from an elevated starting position to overload the upper portion of a deadlift.",
    instructions: [
      "Set the bar securely on pins or blocks.",
      "Brace the trunk and grip the bar.",
      "Extend the hips and knees to stand.",
      "Return the bar to the supports under control."
    ],
    cues: [
      "Keep the bar close.",
      "Avoid jerking the bar from the supports."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  BACK_EXERCISES
};

export default BACK_EXERCISES;
