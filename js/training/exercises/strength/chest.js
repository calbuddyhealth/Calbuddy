// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/chest.js
// Version: 1.1.0
// Purpose:
//   Chest-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// V1.1.0:
//   - Preserves all existing V1.0.0 exercise IDs.
//   - Adds additional common commercial-gym chest exercises.
//   - Adds single-arm and neutral-grip pressing variations.
//   - Adds dedicated cable pressing.
//   - Adds weighted chest dips.
//   - Adds dumbbell pullover.
//   - Adds low-to-high dumbbell upper-chest fly.
//   - Adds plate squeeze press.
//   - Adds decline machine chest press.
//   - Improves fly movement-pattern classification.
//   - Maintains stable anatomy IDs and substitution groups.
//
// Notes:
//   - targetEmphasis describes practical training emphasis,
//     not a separate anatomical muscle.
//   - substitutionGroup allows ARI to find sensible swaps.
//   - substitutions lists preferred direct alternatives.
// =====================================================

const VERSION = "1.1.0";
const SOURCE = "js/training/exercises/strength/chest";

const CHEST_EXERCISES = Object.freeze([

  // ===================================================
  // BARBELL PRESSING
  // ===================================================

  {
    id: "barbell_bench_press",
    name: "Barbell Bench Press",
    aliases: [
      "bench press",
      "flat bench",
      "flat barbell bench",
      "barbell chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "barbell",
      "bench",
      "rack"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "dumbbell_bench_press",
      "smith_machine_bench_press",
      "machine_chest_press",
      "weighted_push_up",
      "plate_loaded_chest_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 10,
      strength: 10,
      upper_body_strength: 10,
      general_fitness: 6
    },
    summary:
      "Lie on a flat bench, lower the bar toward the mid-chest under control, then press upward while keeping the upper back stable.",
    instructions: [
      "Plant both feet firmly on the floor.",
      "Set the shoulder blades back and down against the bench.",
      "Lower the bar toward the mid-chest under control.",
      "Press the bar upward until the arms are extended."
    ],
    cues: [
      "Keep wrists stacked over the forearms.",
      "Avoid excessive elbow flare.",
      "Keep the upper back stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_barbell_bench_press",
    name: "Incline Barbell Bench Press",
    aliases: [
      "incline bench press",
      "incline bench",
      "incline barbell press",
      "upper chest bench"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "barbell",
      "incline_bench",
      "rack"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "incline_chest_press",
    substitutions: [
      "incline_dumbbell_press",
      "incline_smith_machine_press",
      "incline_machine_chest_press",
      "decline_push_up"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 10,
      strength: 9,
      upper_body_strength: 9,
      general_fitness: 6
    },
    summary:
      "Press a barbell from an inclined bench to emphasize the upper chest while the shoulders and triceps assist.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Position the bar above the upper chest.",
      "Lower the bar under control toward the upper chest.",
      "Press upward while maintaining stable shoulder blades."
    ],
    cues: [
      "Use a moderate incline rather than turning it into a shoulder press.",
      "Keep the forearms close to vertical.",
      "Avoid bouncing the bar."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "decline_barbell_bench_press",
    name: "Decline Barbell Bench Press",
    aliases: [
      "decline bench press",
      "decline bench",
      "decline barbell press",
      "lower chest bench"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "barbell",
      "decline_bench",
      "rack"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "decline_dumbbell_press",
      "decline_machine_chest_press",
      "high_to_low_cable_fly",
      "chest_dip"
    ],
    laterality: "bilateral",
    setup: "decline_bench",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 8
    },
    summary:
      "Press a barbell from a declined bench to bias the lower chest while the triceps assist.",
    instructions: [
      "Secure the legs and upper body on the decline bench.",
      "Unrack the bar with control.",
      "Lower toward the lower chest.",
      "Press upward without losing torso position."
    ],
    cues: [
      "Use a controlled range.",
      "Keep the shoulder blades stable.",
      "Use appropriate safety equipment."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "guillotine_press",
    name: "Guillotine Press",
    aliases: [
      "guillotine bench press",
      "neck press",
      "barbell guillotine press"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "barbell",
      "bench",
      "rack"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular_sternal",
      label: "Upper + Mid Chest"
    },
    substitutionGroup: "chest_stretch_press",
    substitutions: [
      "incline_barbell_bench_press",
      "incline_dumbbell_press",
      "dumbbell_chest_fly"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "A wide-elbow bench-press variation that lowers the bar higher on the chest to increase pectoral stretch.",
    instructions: [
      "Use a lighter load than a standard bench press.",
      "Maintain stable shoulder blades.",
      "Lower the bar toward the upper chest under strict control.",
      "Press upward without forcing excessive shoulder range."
    ],
    cues: [
      "Use conservative loading.",
      "Do not force a painful shoulder position.",
      "Control the bottom range."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // DUMBBELL PRESSING
  // ===================================================

  {
    id: "dumbbell_bench_press",
    name: "Dumbbell Bench Press",
    aliases: [
      "flat dumbbell press",
      "dumbbell chest press",
      "db bench press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "barbell_bench_press",
      "neutral_grip_dumbbell_bench_press",
      "smith_machine_bench_press",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9,
      general_fitness: 7
    },
    summary:
      "Press two dumbbells from chest level upward while keeping the shoulder blades stable against the bench.",
    instructions: [
      "Sit with a dumbbell in each hand and position yourself on the bench.",
      "Set the shoulder blades back and down.",
      "Lower the dumbbells beside the chest under control.",
      "Press the dumbbells upward."
    ],
    cues: [
      "Control the lowering phase.",
      "Keep the forearms close to vertical.",
      "Do not bounce the dumbbells."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "neutral_grip_dumbbell_bench_press",
    name: "Neutral-Grip Dumbbell Bench Press",
    aliases: [
      "neutral grip dumbbell press",
      "palms in dumbbell bench",
      "neutral dumbbell chest press",
      "hammer grip chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "triceps",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "dumbbell_bench_press",
      "dumbbell_squeeze_press",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press dumbbells with the palms facing one another for a shoulder-friendly chest and triceps press.",
    instructions: [
      "Lie on the bench with palms facing each other.",
      "Lower the dumbbells beside the torso.",
      "Keep the elbows relatively close to the body.",
      "Press upward while maintaining the neutral grip."
    ],
    cues: [
      "Keep the wrists neutral.",
      "Do not force the elbows tightly against the torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "single_arm_dumbbell_bench_press",
    name: "Single-Arm Dumbbell Bench Press",
    aliases: [
      "one arm dumbbell bench",
      "single arm dumbbell press",
      "unilateral dumbbell bench press",
      "one arm chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_rotation"
    ],
    equipment: [
      "dumbbell",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Chest + Core"
    },
    substitutionGroup: "unilateral_chest_press",
    substitutions: [
      "dumbbell_bench_press",
      "single_arm_machine_chest_press",
      "single_arm_cable_press"
    ],
    laterality: "unilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8,
      core_strength: 7
    },
    summary:
      "Press one dumbbell at a time while resisting torso rotation.",
    instructions: [
      "Lie on the bench holding one dumbbell.",
      "Brace the trunk and keep both shoulders supported.",
      "Lower the dumbbell beside the working side of the chest.",
      "Press upward without allowing the torso to rotate."
    ],
    cues: [
      "Keep both sides of the upper back on the bench.",
      "Brace the abdomen before each repetition."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "side",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_dumbbell_press",
    name: "Incline Dumbbell Press",
    aliases: [
      "incline dumbbell bench press",
      "incline db press",
      "upper chest dumbbell press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "incline_bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "incline_chest_press",
    substitutions: [
      "incline_barbell_bench_press",
      "incline_smith_machine_press",
      "incline_machine_chest_press",
      "decline_push_up"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Press dumbbells upward from an inclined bench to emphasize the upper chest.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Hold the dumbbells near the upper chest.",
      "Lower under control.",
      "Press upward and slightly inward."
    ],
    cues: [
      "Avoid an excessively steep incline.",
      "Keep the shoulder blades stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "decline_dumbbell_press",
    name: "Decline Dumbbell Press",
    aliases: [
      "decline dumbbell bench press",
      "decline db press",
      "lower chest dumbbell press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "decline_bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "decline_barbell_bench_press",
      "decline_machine_chest_press",
      "high_to_low_cable_fly",
      "chest_dip"
    ],
    laterality: "bilateral",
    setup: "decline_bench",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press dumbbells from a declined bench to emphasize the lower chest.",
    instructions: [
      "Secure yourself on the decline bench.",
      "Position the dumbbells beside the lower chest.",
      "Press upward under control.",
      "Lower slowly."
    ],
    cues: [
      "Keep the shoulder blades stable.",
      "Control the bottom position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "dumbbell_squeeze_press",
    name: "Dumbbell Squeeze Press",
    aliases: [
      "hex press",
      "dumbbell hex press",
      "close dumbbell chest press",
      "dumbbell crush press"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "triceps",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "squeeze_chest_press",
    substitutions: [
      "plate_squeeze_press",
      "dumbbell_bench_press",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Press two dumbbells upward while squeezing them together to maintain continuous chest tension.",
    instructions: [
      "Lie on a flat bench with the dumbbells touching.",
      "Apply inward pressure between the dumbbells.",
      "Lower them toward the chest while maintaining the squeeze.",
      "Press upward without losing inward tension."
    ],
    cues: [
      "Use controlled loads.",
      "Keep constant inward pressure."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "close_grip_dumbbell_press",
    name: "Close-Grip Dumbbell Press",
    aliases: [
      "close grip dumbbell bench",
      "close dumbbell press",
      "narrow dumbbell bench press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "triceps",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major",
      "triceps_brachii"
    ],
    secondaryMuscles: [
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Chest + Triceps"
    },
    substitutionGroup: "close_chest_press",
    substitutions: [
      "neutral_grip_dumbbell_bench_press",
      "dumbbell_squeeze_press",
      "dumbbell_bench_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 8,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press dumbbells with a narrower arm path to train the chest while increasing triceps contribution.",
    instructions: [
      "Lie on the bench with the dumbbells close together.",
      "Lower with the elbows relatively close to the torso.",
      "Press the dumbbells upward.",
      "Maintain control throughout the range."
    ],
    cues: [
      "Keep the wrists stacked.",
      "Do not force an excessively narrow elbow position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // MACHINE PRESSING
  // ===================================================

  {
    id: "smith_machine_bench_press",
    name: "Smith Machine Bench Press",
    aliases: [
      "smith bench press",
      "smith chest press",
      "flat smith press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "smith_machine",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "barbell_bench_press",
      "dumbbell_bench_press",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press the Smith-machine bar from a flat bench using the guided bar path.",
    instructions: [
      "Position the bench so the bar tracks toward the mid-chest.",
      "Set the shoulder blades back and down.",
      "Lower the bar under control.",
      "Press upward."
    ],
    cues: [
      "Position the bench carefully relative to the fixed bar path.",
      "Keep the wrists stacked."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_smith_machine_press",
    name: "Incline Smith Machine Press",
    aliases: [
      "smith incline bench",
      "incline smith press",
      "smith upper chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "smith_machine",
      "incline_bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "incline_chest_press",
    substitutions: [
      "incline_barbell_bench_press",
      "incline_dumbbell_press",
      "incline_machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press the Smith-machine bar from an inclined bench to train the upper chest.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Align the bench so the bar lowers toward the upper chest.",
      "Lower under control.",
      "Press upward."
    ],
    cues: [
      "Keep the incline moderate.",
      "Do not shrug the shoulders."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "machine_chest_press",
    name: "Machine Chest Press",
    aliases: [
      "chest press machine",
      "seated chest press",
      "machine bench press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "chest_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "plate_loaded_chest_press",
      "barbell_bench_press",
      "dumbbell_bench_press",
      "smith_machine_bench_press"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 9,
      strength: 7,
      general_fitness: 8
    },
    summary:
      "Press the machine handles forward from chest level while keeping the torso supported.",
    instructions: [
      "Adjust the seat so the handles align near mid-chest.",
      "Grip the handles and brace the torso.",
      "Press forward.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging.",
      "Do not let the weight stack slam."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "single_arm_machine_chest_press",
    name: "Single-Arm Machine Chest Press",
    aliases: [
      "one arm chest press machine",
      "single arm chest press",
      "unilateral machine chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_rotation"
    ],
    equipment: [
      "chest_press_machine"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Chest + Core"
    },
    substitutionGroup: "unilateral_chest_press",
    substitutions: [
      "single_arm_dumbbell_bench_press",
      "single_arm_cable_press",
      "machine_chest_press"
    ],
    laterality: "unilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 9,
      strength: 7,
      upper_body_strength: 8,
      core_strength: 5
    },
    summary:
      "Press one machine handle at a time while maintaining torso position.",
    instructions: [
      "Adjust the seat to align the handle with the chest.",
      "Brace the trunk against the pad.",
      "Press with one arm.",
      "Return under control before switching sides."
    ],
    cues: [
      "Do not twist the torso.",
      "Keep the working shoulder controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "side",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_machine_chest_press",
    name: "Incline Machine Chest Press",
    aliases: [
      "incline chest press machine",
      "upper chest press machine",
      "incline machine press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "incline_chest_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "incline_chest_press",
    substitutions: [
      "incline_barbell_bench_press",
      "incline_dumbbell_press",
      "incline_smith_machine_press"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 7,
      upper_body_strength: 8
    },
    summary:
      "Press upward and forward on an incline chest-press machine.",
    instructions: [
      "Adjust the seat so the handles begin near the upper chest.",
      "Brace the torso against the pad.",
      "Press forward and upward.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders down.",
      "Avoid excessive shoulder shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "decline_machine_chest_press",
    name: "Decline Machine Chest Press",
    aliases: [
      "decline chest press machine",
      "lower chest press machine",
      "decline machine press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "triceps",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "decline_chest_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "decline_barbell_bench_press",
      "decline_dumbbell_press",
      "chest_dip",
      "high_to_low_cable_fly"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 7,
      upper_body_strength: 8
    },
    summary:
      "Press along a slightly downward machine path to emphasize the lower chest.",
    instructions: [
      "Adjust the machine for a comfortable starting position.",
      "Keep the torso firmly supported.",
      "Press the handles forward and slightly downward.",
      "Return under control."
    ],
    cues: [
      "Keep the chest elevated.",
      "Avoid shrugging at the bottom."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "plate_loaded_chest_press",
    name: "Plate-Loaded Chest Press",
    aliases: [
      "hammer strength chest press",
      "plate loaded bench press",
      "plate loaded press",
      "hammer chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "plate_loaded_chest_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "machine_chest_press",
      "smith_machine_bench_press",
      "dumbbell_bench_press"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Press a plate-loaded machine through a stable chest-press path.",
    instructions: [
      "Load the machine evenly.",
      "Adjust the seat so the handles align near chest height.",
      "Press through the handles.",
      "Return under control."
    ],
    cues: [
      "Keep the torso supported.",
      "Avoid slamming the machine stops."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // CABLE PRESSING
  // ===================================================

  {
    id: "standing_cable_chest_press",
    name: "Standing Cable Chest Press",
    aliases: [
      "cable chest press",
      "standing cable press",
      "dual cable chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "cable",
      "functional"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior",
      "rectus_abdominis"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_extension"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "cable_chest_press",
    substitutions: [
      "machine_chest_press",
      "dumbbell_bench_press",
      "single_arm_cable_press"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 8,
      strength: 7,
      upper_body_strength: 7,
      core_strength: 6
    },
    summary:
      "Press two cable handles forward from chest level while maintaining a stable standing position.",
    instructions: [
      "Set both pulleys near chest height.",
      "Take a stable split stance.",
      "Begin with the handles beside the chest.",
      "Press forward and return under control."
    ],
    cues: [
      "Keep the ribs controlled.",
      "Avoid leaning excessively into the cables."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "single_arm_cable_press",
    name: "Single-Arm Cable Chest Press",
    aliases: [
      "one arm cable chest press",
      "single arm cable press",
      "unilateral cable chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "cable",
      "functional"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_rotation"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Chest + Core"
    },
    substitutionGroup: "unilateral_chest_press",
    substitutions: [
      "single_arm_machine_chest_press",
      "single_arm_dumbbell_bench_press",
      "standing_cable_chest_press"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 8,
      strength: 7,
      upper_body_strength: 7,
      core_strength: 7
    },
    summary:
      "Press one cable handle forward while resisting unwanted torso rotation.",
    instructions: [
      "Stand with the cable behind the working arm.",
      "Brace the trunk.",
      "Press the handle forward.",
      "Return under control before switching sides."
    ],
    cues: [
      "Keep the hips and shoulders facing forward.",
      "Do not rotate to finish the repetition."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "side",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // FLY / HORIZONTAL ADDUCTION
  // ===================================================

  {
    id: "pec_deck_fly",
    name: "Pec Deck Fly",
    aliases: [
      "pec deck",
      "machine chest fly",
      "chest fly machine",
      "butterfly machine"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "pec_deck_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "chest_fly",
    substitutions: [
      "cable_chest_fly",
      "dumbbell_chest_fly",
      "single_arm_cable_fly"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Bring the machine arms together in front of the chest through horizontal shoulder adduction.",
    instructions: [
      "Adjust the seat to a comfortable chest height.",
      "Begin with the chest open.",
      "Bring the arms together through a controlled arc.",
      "Return slowly."
    ],
    cues: [
      "Avoid excessive shoulder extension.",
      "Keep the elbows softly bent."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "dumbbell_chest_fly",
    name: "Dumbbell Chest Fly",
    aliases: [
      "dumbbell fly",
      "flat dumbbell fly",
      "db chest fly"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "chest_fly",
    substitutions: [
      "pec_deck_fly",
      "cable_chest_fly",
      "single_arm_cable_fly"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Open and close the arms in a wide arc while lying on a bench.",
    instructions: [
      "Lie on a flat bench with dumbbells above the chest.",
      "Maintain a soft elbow bend.",
      "Open the arms until a controlled chest stretch is felt.",
      "Bring the dumbbells back together."
    ],
    cues: [
      "Do not turn the movement into a press.",
      "Use moderate loads."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_dumbbell_fly",
    name: "Incline Dumbbell Fly",
    aliases: [
      "incline dumbbell chest fly",
      "incline db fly",
      "upper chest dumbbell fly"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "dumbbells",
      "incline_bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "upper_chest_fly",
    substitutions: [
      "low_to_high_cable_fly",
      "low_to_high_dumbbell_fly",
      "incline_dumbbell_press"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Perform a dumbbell fly from an inclined bench to emphasize the upper chest.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Begin with the dumbbells over the upper chest.",
      "Open the arms with a soft elbow bend.",
      "Bring the dumbbells back together."
    ],
    cues: [
      "Avoid excessive depth.",
      "Keep the shoulder blades stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "low_to_high_dumbbell_fly",
    name: "Low-to-High Dumbbell Fly",
    aliases: [
      "dumbbell upper chest raise",
      "low to high dumbbell fly",
      "standing dumbbell chest fly",
      "standing dumbbell upper chest fly",
      "dumbbell low to high fly",
      "upper chest dumbbell raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid"
    ],
    movementPatterns: [
      "shoulder_flexion"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "upper_chest_fly",
    substitutions: [
      "low_to_high_cable_fly",
      "incline_dumbbell_fly",
      "incline_dumbbell_press"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 7,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise dumbbells from low beside the hips upward and inward to create an upper-chest-focused adduction path.",
    instructions: [
      "Stand tall with light dumbbells near the thighs.",
      "Keep a small bend in the elbows.",
      "Sweep the dumbbells upward and inward.",
      "Lower slowly along the same path."
    ],
    cues: [
      "Use light loads.",
      "Think about bringing the upper arms toward one another.",
      "Do not simply perform a straight front raise."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "cable_chest_fly",
    name: "Cable Chest Fly",
    aliases: [
      "cable fly",
      "standing cable fly",
      "cable crossover",
      "mid cable fly"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "chest_fly",
    substitutions: [
      "pec_deck_fly",
      "dumbbell_chest_fly",
      "single_arm_cable_fly"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Bring cable handles toward each other in front of the body.",
    instructions: [
      "Set the pulleys around chest height.",
      "Begin with the arms open and elbows softly bent.",
      "Sweep the arms forward.",
      "Return under control."
    ],
    cues: [
      "Move through the shoulders.",
      "Avoid overstretching."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "low_to_high_cable_fly",
    name: "Low-to-High Cable Fly",
    aliases: [
      "low cable fly",
      "low to high fly",
      "upper chest cable fly",
      "low cable crossover"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_flexion",
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "upper_chest_fly",
    substitutions: [
      "low_to_high_dumbbell_fly",
      "incline_dumbbell_fly",
      "incline_dumbbell_press"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Sweep cable handles upward and inward from low pulley positions.",
    instructions: [
      "Set the cable pulleys low.",
      "Take a stable stance.",
      "Sweep the handles upward and inward.",
      "Return slowly."
    ],
    cues: [
      "Keep the elbows softly bent.",
      "Do not turn it into a pure front raise."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "high_to_low_cable_fly",
    name: "High-to-Low Cable Fly",
    aliases: [
      "high cable fly",
      "high to low fly",
      "lower chest cable fly",
      "high cable crossover"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "lower_chest_fly",
    substitutions: [
      "decline_dumbbell_press",
      "decline_barbell_bench_press",
      "decline_machine_chest_press",
      "chest_dip"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Sweep cable handles downward and inward from high pulleys.",
    instructions: [
      "Set the pulleys above shoulder height.",
      "Take a stable split stance.",
      "Sweep the handles downward and inward.",
      "Return under control."
    ],
    cues: [
      "Keep the torso controlled.",
      "Move primarily through the shoulders."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "single_arm_cable_fly",
    name: "Single-Arm Cable Fly",
    aliases: [
      "one arm cable fly",
      "unilateral cable fly",
      "single arm cable crossover"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "serratus_anterior",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "shoulder_horizontal_adduction",
      "anti_rotation"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "chest_fly",
    substitutions: [
      "cable_chest_fly",
      "pec_deck_fly",
      "dumbbell_chest_fly"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 4,
      core_strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Bring one cable handle across the front of the body while resisting torso rotation.",
    instructions: [
      "Stand side-on to the cable.",
      "Brace the trunk.",
      "Sweep the arm inward across the chest.",
      "Return under control."
    ],
    cues: [
      "Keep the torso from rotating.",
      "Maintain a soft elbow bend."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "side",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // SQUEEZE / ADDUCTION
  // ===================================================

  {
    id: "plate_squeeze_press",
    name: "Plate Squeeze Press",
    aliases: [
      "plate press",
      "plate chest press",
      "svend press",
      "sven press",
      "plate squeeze chest press"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "weight_plate"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Chest"
    },
    substitutionGroup: "squeeze_chest_press",
    substitutions: [
      "dumbbell_squeeze_press",
      "cable_chest_fly",
      "pec_deck_fly"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 7,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Squeeze one or two weight plates between the palms while pressing them away from the chest.",
    instructions: [
      "Hold the plate securely between both palms.",
      "Apply constant inward pressure.",
      "Press the plate forward.",
      "Return it toward the chest while maintaining the squeeze."
    ],
    cues: [
      "Maintain inward pressure throughout.",
      "Use controlled loading."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // PULLOVER
  // ===================================================

  {
    id: "dumbbell_pullover",
    name: "Dumbbell Pullover",
    aliases: [
      "chest pullover",
      "dumbbell chest pullover",
      "db pullover",
      "straight arm dumbbell pullover"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "chest",
      "back",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major",
      "latissimus_dorsi"
    ],
    secondaryMuscles: [
      "serratus_anterior",
      "triceps_brachii"
    ],
    movementPatterns: [
      "shoulder_extension"
    ],
    equipment: [
      "dumbbell",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal_clavicular",
      label: "Chest + Lats"
    },
    substitutionGroup: "pullover",
    substitutions: [
      "cable_chest_fly",
      "straight_arm_pulldown"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 8,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Lower a dumbbell behind the head with relatively straight arms, then pull it back over the torso using the chest, lats, and shoulder extensors.",
    instructions: [
      "Lie securely on a bench holding one dumbbell above the chest.",
      "Maintain a soft bend in the elbows.",
      "Lower the dumbbell behind the head under control.",
      "Pull the weight back over the chest."
    ],
    cues: [
      "Keep the ribs controlled.",
      "Do not force excessive shoulder range.",
      "Use a controlled stretch."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },


  // ===================================================
  // BODYWEIGHT
  // ===================================================

  {
    id: "push_up",
    name: "Push-Up",
    aliases: [
      "pushup",
      "standard push up",
      "standard push-up"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior",
      "rectus_abdominis"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_extension"
    ],
    equipment: [
      "bodyweight"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "weighted_push_up",
      "dumbbell_bench_press",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      muscle_building: 8,
      strength: 7,
      general_fitness: 10,
      upper_body_strength: 8,
      core_strength: 5
    },
    summary:
      "From a rigid plank position, lower the chest toward the floor and press back up.",
    instructions: [
      "Place the hands slightly wider than shoulder width.",
      "Create a straight line from head to heels.",
      "Lower the chest toward the floor.",
      "Press back to the starting position."
    ],
    cues: [
      "Keep the hips from sagging.",
      "Keep the elbows controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "weighted_push_up",
    name: "Weighted Push-Up",
    aliases: [
      "loaded push up",
      "weighted pushup",
      "plate push up"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior",
      "rectus_abdominis"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_extension"
    ],
    equipment: [
      "bodyweight",
      "weight_plate",
      "weighted_vest"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "push_up",
      "barbell_bench_press",
      "dumbbell_bench_press"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 9,
      core_strength: 6
    },
    summary:
      "Perform a push-up with external load.",
    instructions: [
      "Secure the external load safely.",
      "Set a rigid plank position.",
      "Lower under control.",
      "Press back to the top."
    ],
    cues: [
      "Do not let the hips sag.",
      "Use securely positioned load."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "added_weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "incline_push_up",
    name: "Incline Push-Up",
    aliases: [
      "elevated push up",
      "bench push up",
      "incline pushup"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_extension"
    ],
    equipment: [
      "bodyweight",
      "bench",
      "box"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "push_up",
      "machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "hands_elevated",
    goals: {
      muscle_building: 6,
      strength: 5,
      general_fitness: 9,
      upper_body_strength: 6
    },
    summary:
      "Perform a push-up with the hands elevated to reduce resistance.",
    instructions: [
      "Place both hands on a stable elevated surface.",
      "Keep the body in a straight line.",
      "Lower the chest toward the support.",
      "Press back."
    ],
    cues: [
      "Keep the surface stable.",
      "Maintain full-body tension."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "decline_push_up",
    name: "Decline Push-Up",
    aliases: [
      "feet elevated push up",
      "feet elevated pushup",
      "decline pushup"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "triceps_brachii",
      "serratus_anterior",
      "rectus_abdominis"
    ],
    movementPatterns: [
      "horizontal_push",
      "anti_extension"
    ],
    equipment: [
      "bodyweight",
      "bench",
      "box"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "incline_chest_press",
    substitutions: [
      "incline_dumbbell_press",
      "incline_machine_chest_press",
      "incline_barbell_bench_press"
    ],
    laterality: "bilateral",
    setup: "feet_elevated",
    goals: {
      muscle_building: 8,
      strength: 8,
      general_fitness: 8,
      upper_body_strength: 8,
      core_strength: 6
    },
    summary:
      "Perform a push-up with the feet elevated to increase upper-body loading.",
    instructions: [
      "Place the feet securely on an elevated surface.",
      "Set the hands slightly wider than shoulder width.",
      "Lower the chest toward the floor.",
      "Press back up."
    ],
    cues: [
      "Avoid excessive hip sag.",
      "Use a stable elevation."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "chest_dip",
    name: "Chest Dip",
    aliases: [
      "dips",
      "chest dips",
      "forward lean dip",
      "parallel bar chest dip",
      "bodyweight chest dip"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dip_bars",
      "bodyweight"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "weighted_chest_dip",
      "decline_barbell_bench_press",
      "decline_dumbbell_press",
      "high_to_low_cable_fly"
    ],
    laterality: "bilateral",
    setup: "parallel_bars",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 9,
      general_fitness: 7
    },
    summary:
      "Lower and press the body between parallel bars with a slight forward torso angle.",
    instructions: [
      "Support the body on parallel bars.",
      "Lean slightly forward.",
      "Lower under control.",
      "Press back to the top."
    ],
    cues: [
      "Avoid excessive shoulder depth.",
      "Do not bounce."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "weighted_chest_dip",
    name: "Weighted Chest Dip",
    aliases: [
      "weighted dips",
      "weighted chest dips",
      "belt weighted dip",
      "weighted parallel bar dip"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "calisthenics"
    ],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "anterior_deltoid"
    ],
    movementPatterns: [
      "horizontal_push"
    ],
    equipment: [
      "dip_bars",
      "dip_belt",
      "weight_plate"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "chest_dip",
      "decline_barbell_bench_press",
      "decline_dumbbell_press",
      "decline_machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "parallel_bars",
    goals: {
      muscle_building: 10,
      strength: 10,
      upper_body_strength: 10
    },
    summary:
      "Perform chest-focused dips with additional external resistance.",
    instructions: [
      "Secure the added weight.",
      "Support yourself on the dip bars.",
      "Lean slightly forward.",
      "Lower under control and press back upward."
    ],
    cues: [
      "Keep the added load stable.",
      "Do not chase excessive depth.",
      "Maintain control throughout."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "added_weight",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  }

]);

export {
  VERSION,
  SOURCE,
  CHEST_EXERCISES
};

export default CHEST_EXERCISES;