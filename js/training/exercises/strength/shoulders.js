// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/shoulders.js
// Version: 1.1.0
// Purpose:
//   Shoulder-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// V1.1.0:
//   - Preserves all existing shoulder exercise IDs.
//   - Corrects front raises to shoulder_flexion.
//   - Corrects shrugs to scapular_elevation.
//   - Adds Smith-machine and plate-loaded shoulder pressing.
//   - Adds upright-row variations.
//   - Adds Y-raise variations.
//   - Adds additional rear-delt isolation movements.
//   - Adds Lu raise.
//   - Expands aliases and substitution relationships.
//   - Uses stable anatomy and movement-pattern IDs.
//
// Design:
//   - Covers anterior, lateral, and posterior deltoids.
//   - Includes free-weight, cable, machine, landmine,
//     bodyweight-adjacent, and shoulder-girdle movements.
//   - Supports aliases, target emphasis, substitutions,
//     laterality, setup metadata, and structured logging.
// =====================================================

const VERSION = "1.1.0";
const SOURCE = "js/training/exercises/strength/shoulders";

const SHOULDER_EXERCISES = Object.freeze([

  // ===================================================
  // OVERHEAD PRESSING
  // ===================================================

  {
    id: "dumbbell_overhead_press",
    name: "Dumbbell Overhead Press",
    aliases: [
      "dumbbell shoulder press",
      "db shoulder press",
      "db overhead press",
      "standing dumbbell shoulder press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper",
      "serratus_anterior"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "barbell_overhead_press",
      "seated_dumbbell_shoulder_press",
      "machine_shoulder_press",
      "smith_machine_shoulder_press",
      "arnold_press"
    ],
    laterality: "bilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 10
    },
    summary:
      "Press dumbbells from shoulder level overhead while keeping the trunk controlled.",
    instructions: [
      "Begin with the dumbbells near shoulder height.",
      "Brace the torso.",
      "Press the dumbbells overhead.",
      "Lower them back to shoulder level under control."
    ],
    cues: [
      "Avoid excessive lower-back arching.",
      "Keep the ribs controlled."
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
    id: "barbell_overhead_press",
    name: "Barbell Overhead Press",
    aliases: [
      "overhead press",
      "barbell shoulder press",
      "military press",
      "strict press",
      "standing military press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body",
      "core"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper",
      "serratus_anterior"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "barbell",
      "rack"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_shoulder",
      label: "Front Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "dumbbell_overhead_press",
      "machine_shoulder_press",
      "smith_machine_shoulder_press",
      "seated_dumbbell_shoulder_press"
    ],
    laterality: "bilateral",
    setup: "standing_barbell",
    goals: {
      muscle_building: 8,
      strength: 10,
      upper_body_strength: 10
    },
    summary:
      "Press a barbell from the upper chest to overhead using a stable standing position.",
    instructions: [
      "Set the bar near upper-chest height.",
      "Brace the torso and grip slightly wider than shoulder width.",
      "Press the bar overhead.",
      "Lower it under control."
    ],
    cues: [
      "Keep the bar path close to the body.",
      "Avoid excessive back extension."
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
    id: "seated_dumbbell_shoulder_press",
    name: "Seated Dumbbell Shoulder Press",
    aliases: [
      "seated dumbbell press",
      "seated db shoulder press",
      "seated shoulder press",
      "seated dumbbell overhead press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "dumbbell_overhead_press",
      "machine_shoulder_press",
      "smith_machine_shoulder_press",
      "arnold_press"
    ],
    laterality: "bilateral",
    setup: "seated_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Press dumbbells overhead from a supported seated position.",
    instructions: [
      "Set the bench upright or slightly reclined.",
      "Position the dumbbells near shoulder height.",
      "Press overhead.",
      "Lower under control."
    ],
    cues: [
      "Keep the back supported.",
      "Do not force the dumbbells together overhead."
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
    id: "machine_shoulder_press",
    name: "Machine Shoulder Press",
    aliases: [
      "shoulder press machine",
      "machine overhead press",
      "seated shoulder press machine"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "shoulder_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "seated_dumbbell_shoulder_press",
      "dumbbell_overhead_press",
      "smith_machine_shoulder_press",
      "plate_loaded_shoulder_press",
      "barbell_overhead_press"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9,
      general_fitness: 8
    },
    summary:
      "Press machine handles overhead while the torso remains supported.",
    instructions: [
      "Adjust the seat so the handles begin near shoulder level.",
      "Keep the torso against the pad.",
      "Press the handles upward.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging excessively.",
      "Do not slam the weight stack."
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
    id: "smith_machine_shoulder_press",
    name: "Smith Machine Shoulder Press",
    aliases: [
      "smith shoulder press",
      "smith machine overhead press",
      "smith military press",
      "seated smith shoulder press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper",
      "serratus_anterior"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "smith_machine",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "machine_shoulder_press",
      "seated_dumbbell_shoulder_press",
      "barbell_overhead_press",
      "plate_loaded_shoulder_press"
    ],
    laterality: "bilateral",
    setup: "seated_smith_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Press a Smith-machine bar overhead from a supported seated position using the guided bar path.",
    instructions: [
      "Position an upright bench beneath the Smith machine.",
      "Set the bar slightly in front of the shoulders.",
      "Lower the bar under control.",
      "Press upward along the machine path."
    ],
    cues: [
      "Position the bench to match the fixed bar path.",
      "Keep the ribs controlled.",
      "Avoid excessively lowering the bar."
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
    id: "plate_loaded_shoulder_press",
    name: "Plate-Loaded Shoulder Press",
    aliases: [
      "hammer strength shoulder press",
      "plate loaded overhead press",
      "plate loaded delt press",
      "hammer shoulder press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "trapezius_upper"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "plate_loaded_shoulder_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "machine_shoulder_press",
      "smith_machine_shoulder_press",
      "seated_dumbbell_shoulder_press"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 9,
      upper_body_strength: 9
    },
    summary:
      "Press a plate-loaded shoulder machine overhead through its guided pressing path.",
    instructions: [
      "Load the machine evenly.",
      "Adjust the seat so the handles begin near shoulder level.",
      "Press upward.",
      "Return under control."
    ],
    cues: [
      "Keep the torso against the support.",
      "Avoid bouncing at the bottom."
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
    id: "arnold_press",
    name: "Arnold Press",
    aliases: [
      "arnold dumbbell press",
      "arnold shoulder press"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii"
    ],
    movementPatterns: [
      "vertical_push"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Front + Side Delts"
    },
    substitutionGroup: "overhead_press",
    substitutions: [
      "seated_dumbbell_shoulder_press",
      "dumbbell_overhead_press",
      "machine_shoulder_press"
    ],
    laterality: "bilateral",
    setup: "seated_or_standing",
    goals: {
      muscle_building: 9,
      strength: 7,
      upper_body_strength: 8
    },
    summary:
      "Rotate the dumbbells from a palms-in front position into an overhead press.",
    instructions: [
      "Begin with the dumbbells in front of the shoulders and palms facing you.",
      "Open the elbows while rotating the palms forward.",
      "Continue into an overhead press.",
      "Reverse the motion under control."
    ],
    cues: [
      "Use a smooth rotation.",
      "Keep the ribs controlled."
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
    id: "single_arm_dumbbell_shoulder_press",
    name: "Single-Arm Dumbbell Shoulder Press",
    aliases: [
      "one arm shoulder press",
      "single arm overhead press",
      "one arm dumbbell press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "vertical_push",
      "anti_lateral_flexion"
    ],
    equipment: [
      "dumbbell"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_side_shoulder",
      label: "Shoulders + Core"
    },
    substitutionGroup: "unilateral_overhead_press",
    substitutions: [
      "dumbbell_overhead_press",
      "single_arm_landmine_press"
    ],
    laterality: "unilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 8,
      strength: 8,
      upper_body_strength: 9,
      core_strength: 6
    },
    summary:
      "Press one dumbbell overhead while resisting side bending through the torso.",
    instructions: [
      "Hold one dumbbell at shoulder height.",
      "Brace the trunk.",
      "Press the dumbbell overhead.",
      "Lower under control and complete both sides."
    ],
    cues: [
      "Stay tall.",
      "Avoid leaning away from the working arm."
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
    id: "single_arm_landmine_press",
    name: "Single-Arm Landmine Press",
    aliases: [
      "landmine shoulder press",
      "one arm landmine press",
      "landmine press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight",
      "functional"
    ],
    bodyParts: [
      "shoulders",
      "triceps",
      "chest",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "pectoralis_major",
      "serratus_anterior"
    ],
    movementPatterns: [
      "angled_push",
      "anti_rotation"
    ],
    equipment: [
      "barbell",
      "landmine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_shoulder",
      label: "Front Delts"
    },
    substitutionGroup: "angled_press",
    substitutions: [
      "single_arm_dumbbell_shoulder_press",
      "dumbbell_overhead_press"
    ],
    laterality: "unilateral",
    setup: "standing_landmine",
    goals: {
      muscle_building: 8,
      strength: 8,
      upper_body_strength: 8,
      athletic_performance: 8
    },
    summary:
      "Press the end of a landmine bar upward and forward with one arm.",
    instructions: [
      "Hold the end of the bar near the shoulder.",
      "Brace the torso.",
      "Press upward and forward.",
      "Return under control."
    ],
    cues: [
      "Keep the torso stable.",
      "Allow natural scapular movement."
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
  // LATERAL DELTOID
  // ===================================================

  {
    id: "dumbbell_lateral_raise",
    name: "Dumbbell Lateral Raise",
    aliases: [
      "lateral raise",
      "side lateral raise",
      "dumbbell side raise",
      "side raise",
      "dumbbell side lateral"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "supraspinatus",
      "trapezius_upper"
    ],
    movementPatterns: [
      "shoulder_abduction"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder",
      label: "Side Delts"
    },
    substitutionGroup: "lateral_raise",
    substitutions: [
      "cable_lateral_raise",
      "machine_lateral_raise",
      "leaning_cable_lateral_raise",
      "lu_raise"
    ],
    laterality: "bilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise the dumbbells out to the sides with softly bent elbows, then lower them under control.",
    instructions: [
      "Stand tall with a dumbbell in each hand.",
      "Keep a slight bend in the elbows.",
      "Raise the arms out to the sides.",
      "Lower slowly."
    ],
    cues: [
      "Lead with the elbows rather than the hands.",
      "Avoid swinging the torso."
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
    id: "cable_lateral_raise",
    name: "Cable Lateral Raise",
    aliases: [
      "cable side raise",
      "single arm cable lateral raise",
      "cable delt raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "supraspinatus",
      "trapezius_upper"
    ],
    movementPatterns: [
      "shoulder_abduction"
    ],
    equipment: [
      "cable_machine",
      "single_handle"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder",
      label: "Side Delts"
    },
    substitutionGroup: "lateral_raise",
    substitutions: [
      "dumbbell_lateral_raise",
      "machine_lateral_raise",
      "leaning_cable_lateral_raise"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise one cable handle outward to train the lateral deltoid with continuous resistance.",
    instructions: [
      "Set the cable near the lowest position.",
      "Stand beside the stack.",
      "Raise the arm outward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the shoulder down.",
      "Avoid torso momentum."
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
    id: "leaning_cable_lateral_raise",
    name: "Leaning Cable Lateral Raise",
    aliases: [
      "lean away cable lateral raise",
      "leaning lateral raise",
      "lean away lateral raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "supraspinatus"
    ],
    movementPatterns: [
      "shoulder_abduction"
    ],
    equipment: [
      "cable_machine",
      "single_handle"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder",
      label: "Side Delts"
    },
    substitutionGroup: "lateral_raise",
    substitutions: [
      "cable_lateral_raise",
      "dumbbell_lateral_raise",
      "machine_lateral_raise"
    ],
    laterality: "unilateral",
    setup: "leaning_cable",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Lean slightly away from a low cable and raise the working arm outward through a controlled arc.",
    instructions: [
      "Hold the cable station with the nonworking hand.",
      "Lean slightly away while maintaining control.",
      "Raise the working arm outward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the movement at the shoulder.",
      "Do not swing the body."
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
    id: "machine_lateral_raise",
    name: "Machine Lateral Raise",
    aliases: [
      "lateral raise machine",
      "side delt machine",
      "machine side raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "supraspinatus",
      "trapezius_upper"
    ],
    movementPatterns: [
      "shoulder_abduction"
    ],
    equipment: [
      "lateral_raise_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder",
      label: "Side Delts"
    },
    substitutionGroup: "lateral_raise",
    substitutions: [
      "dumbbell_lateral_raise",
      "cable_lateral_raise",
      "leaning_cable_lateral_raise"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise the arms outward against machine resistance to isolate the lateral deltoids.",
    instructions: [
      "Adjust the seat and arm pads.",
      "Keep the torso against the pad.",
      "Raise the arms outward.",
      "Lower under control."
    ],
    cues: [
      "Avoid shrugging.",
      "Use a controlled range."
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
    id: "lu_raise",
    name: "Lu Raise",
    aliases: [
      "lu raises",
      "dumbbell lu raise",
      "full range lateral raise",
      "overhead lateral raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "supraspinatus",
      "trapezius_upper",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_abduction",
      "scapular_upward_rotation"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder_full_range",
      label: "Side Delts"
    },
    substitutionGroup: "lateral_raise",
    substitutions: [
      "dumbbell_lateral_raise",
      "cable_lateral_raise",
      "dumbbell_y_raise"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise light dumbbells from the sides through a large arc toward an overhead position.",
    instructions: [
      "Stand tall with light dumbbells.",
      "Raise the arms outward as in a lateral raise.",
      "Continue upward through a comfortable overhead arc.",
      "Lower under control."
    ],
    cues: [
      "Use light resistance.",
      "Allow natural shoulder-blade upward rotation.",
      "Avoid forcing painful overhead range."
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
  // FRONT DELTOID / SHOULDER FLEXION
  // ===================================================

  {
    id: "dumbbell_front_raise",
    name: "Dumbbell Front Raise",
    aliases: [
      "front raise",
      "db front raise",
      "dumbbell shoulder front raise",
      "front dumbbell raise",
      "straight arm dumbbell raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "pectoralis_major",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_flexion"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_shoulder",
      label: "Front Delts"
    },
    substitutionGroup: "front_raise",
    substitutions: [
      "cable_front_raise",
      "plate_front_raise"
    ],
    laterality: "bilateral_or_alternating",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise dumbbells forward to approximately shoulder height to isolate the anterior deltoids.",
    instructions: [
      "Stand tall with the dumbbells near the thighs.",
      "Raise one or both arms forward.",
      "Stop near shoulder height.",
      "Lower under control."
    ],
    cues: [
      "Avoid leaning backward.",
      "Use controlled loads.",
      "Keep the elbows softly extended rather than locked."
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
    id: "cable_front_raise",
    name: "Cable Front Raise",
    aliases: [
      "front cable raise",
      "single arm cable front raise",
      "cable shoulder front raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "pectoralis_major",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_flexion"
    ],
    equipment: [
      "cable_machine",
      "single_handle"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_shoulder",
      label: "Front Delts"
    },
    substitutionGroup: "front_raise",
    substitutions: [
      "dumbbell_front_raise",
      "plate_front_raise"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 8,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise a low cable forward to shoulder height while keeping the torso still.",
    instructions: [
      "Set the pulley low.",
      "Stand with the cable slightly behind or beside the working arm.",
      "Raise the handle forward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the ribs down.",
      "Avoid swinging."
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
    id: "plate_front_raise",
    name: "Plate Front Raise",
    aliases: [
      "plate raise",
      "weight plate front raise",
      "front plate raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "pectoralis_major",
      "serratus_anterior"
    ],
    movementPatterns: [
      "shoulder_flexion"
    ],
    equipment: [
      "weight_plate"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "front_shoulder",
      label: "Front Delts"
    },
    substitutionGroup: "front_raise",
    substitutions: [
      "dumbbell_front_raise",
      "cable_front_raise"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 7,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise a weight plate in front of the body to approximately shoulder height.",
    instructions: [
      "Hold the plate securely with both hands.",
      "Brace the torso.",
      "Raise the plate forward.",
      "Lower slowly."
    ],
    cues: [
      "Avoid using momentum.",
      "Keep the shoulders controlled."
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
  // Y-RAISE / SCAPULAR-PLANE ELEVATION
  // ===================================================

  {
    id: "dumbbell_y_raise",
    name: "Dumbbell Y-Raise",
    aliases: [
      "y raise",
      "dumbbell y raise",
      "incline y raise",
      "prone y raise",
      "shoulder y raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight",
      "corrective"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "trapezius_lower",
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "lateral_deltoid",
      "serratus_anterior",
      "supraspinatus"
    ],
    movementPatterns: [
      "scapular_plane_raise"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_lower",
      region: "shoulder_girdle",
      label: "Lower Traps + Delts"
    },
    substitutionGroup: "y_raise",
    substitutions: [
      "cable_y_raise",
      "lu_raise"
    ],
    laterality: "bilateral",
    setup: "incline_bench_or_standing",
    goals: {
      muscle_building: 6,
      upper_body_strength: 6,
      general_fitness: 7
    },
    summary:
      "Raise the arms diagonally into a Y shape to train shoulder elevation and scapular control.",
    instructions: [
      "Use light dumbbells.",
      "Begin with the arms down and slightly forward.",
      "Raise the arms diagonally into a Y shape.",
      "Lower slowly."
    ],
    cues: [
      "Keep the shoulders away from the ears.",
      "Use a controlled range.",
      "Avoid swinging."
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
    id: "cable_y_raise",
    name: "Cable Y-Raise",
    aliases: [
      "cable y raise",
      "cable y fly",
      "standing cable y raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable",
      "corrective"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "trapezius_lower",
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "lateral_deltoid",
      "serratus_anterior",
      "supraspinatus"
    ],
    movementPatterns: [
      "scapular_plane_raise"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_lower",
      region: "shoulder_girdle",
      label: "Lower Traps + Delts"
    },
    substitutionGroup: "y_raise",
    substitutions: [
      "dumbbell_y_raise",
      "lu_raise"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 6,
      upper_body_strength: 6,
      general_fitness: 7
    },
    summary:
      "Raise opposing cable handles diagonally upward into a Y-shaped arm position.",
    instructions: [
      "Set the cable pulleys low.",
      "Cross or position the cables comfortably.",
      "Raise both arms diagonally upward.",
      "Lower under control."
    ],
    cues: [
      "Use light resistance.",
      "Do not shrug aggressively.",
      "Keep the motion smooth."
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
  // UPRIGHT ROW
  // ===================================================

  {
    id: "upright_row",
    name: "Upright Row",
    aliases: [
      "barbell upright row",
      "upright barbell row",
      "shoulder upright row"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid",
      "trapezius_upper"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "biceps_brachii"
    ],
    movementPatterns: [
      "upright_pull"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder_upper_trap",
      label: "Side Delts + Traps"
    },
    substitutionGroup: "upright_row",
    substitutions: [
      "cable_upright_row",
      "dumbbell_lateral_raise",
      "dumbbell_shrug"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 6,
      upper_body_strength: 7
    },
    summary:
      "Pull a bar upward close to the torso using the lateral deltoids and upper trapezius.",
    instructions: [
      "Stand holding the bar in front of the thighs.",
      "Pull the elbows upward while keeping the bar close.",
      "Stop at a comfortable height.",
      "Lower under control."
    ],
    cues: [
      "Do not force the elbows excessively high.",
      "Use a comfortable grip width.",
      "Stop if the movement causes shoulder pain."
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
    id: "cable_upright_row",
    name: "Cable Upright Row",
    aliases: [
      "upright cable row",
      "cable shoulder upright row",
      "rope upright row"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "lateral_deltoid",
      "trapezius_upper"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "biceps_brachii"
    ],
    movementPatterns: [
      "upright_pull"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "lateral_deltoid",
      region: "side_shoulder_upper_trap",
      label: "Side Delts + Traps"
    },
    substitutionGroup: "upright_row",
    substitutions: [
      "upright_row",
      "dumbbell_lateral_raise",
      "machine_lateral_raise"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 8,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Pull a low cable attachment upward toward the upper torso to train the side delts and upper traps.",
    instructions: [
      "Set the pulley low.",
      "Stand tall holding the attachment.",
      "Pull upward by leading with the elbows.",
      "Lower slowly."
    ],
    cues: [
      "Stop at a comfortable shoulder height.",
      "Avoid excessive shrugging or momentum."
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
  // REAR DELTOID
  // ===================================================

  {
    id: "reverse_fly",
    name: "Reverse Fly",
    aliases: [
      "rear delt fly",
      "reverse dumbbell fly",
      "bent over reverse fly",
      "bent over rear delt fly"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "rhomboid_major",
      "rhomboid_minor",
      "trapezius_middle"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "dumbbells",
      "reverse_fly_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "incline_rear_delt_fly",
      "chest_supported_rear_delt_raise",
      "cable_reverse_fly",
      "reverse_pec_deck",
      "face_pull"
    ],
    laterality: "bilateral",
    setup: "hinged_or_supported",
    goals: {
      muscle_building: 9,
      upper_body_strength: 6,
      general_fitness: 6
    },
    summary:
      "Open the arms outward against resistance to train the rear shoulders and upper-back stabilizers.",
    instructions: [
      "Set the torso in a supported or hip-hinged position.",
      "Begin with the arms in front of the body.",
      "Open the arms outward.",
      "Return under control."
    ],
    cues: [
      "Avoid shrugging.",
      "Use the rear shoulders rather than momentum."
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
    id: "incline_rear_delt_fly",
    name: "Incline Rear-Delt Fly",
    aliases: [
      "incline reverse fly",
      "incline rear delt raise",
      "incline dumbbell reverse fly",
      "bench rear delt fly"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "rhomboid_major",
      "rhomboid_minor",
      "trapezius_middle"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "dumbbells",
      "incline_bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "reverse_fly",
      "chest_supported_rear_delt_raise",
      "cable_reverse_fly",
      "reverse_pec_deck"
    ],
    laterality: "bilateral",
    setup: "chest_supported_incline_bench",
    goals: {
      muscle_building: 10,
      upper_body_strength: 6
    },
    summary:
      "Perform a reverse fly while chest-supported on an incline bench to reduce torso momentum.",
    instructions: [
      "Lie chest-down on a moderately inclined bench.",
      "Let the dumbbells hang beneath the shoulders.",
      "Open the arms outward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the chest against the bench.",
      "Lead through the elbows.",
      "Avoid shrugging."
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
    id: "chest_supported_rear_delt_raise",
    name: "Chest-Supported Rear-Delt Raise",
    aliases: [
      "chest supported rear delt fly",
      "chest supported reverse fly",
      "supported rear delt raise"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "trapezius_middle",
      "rhomboid_major",
      "rhomboid_minor"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "dumbbells",
      "bench"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "incline_rear_delt_fly",
      "reverse_fly",
      "reverse_pec_deck",
      "cable_reverse_fly"
    ],
    laterality: "bilateral",
    setup: "chest_supported",
    goals: {
      muscle_building: 10,
      upper_body_strength: 6
    },
    summary:
      "Raise dumbbells outward while the chest is supported to isolate the rear deltoids.",
    instructions: [
      "Set the chest firmly against the support.",
      "Begin with the arms hanging down.",
      "Raise the arms outward.",
      "Lower slowly."
    ],
    cues: [
      "Do not use torso momentum.",
      "Keep the neck relaxed."
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
    id: "cable_reverse_fly",
    name: "Cable Reverse Fly",
    aliases: [
      "cable rear delt fly",
      "standing cable reverse fly",
      "cable rear delt",
      "cable rear delt crossover"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "rhomboid_major",
      "rhomboid_minor",
      "trapezius_middle"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "cable_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "reverse_fly",
      "reverse_pec_deck",
      "face_pull",
      "incline_rear_delt_fly"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      upper_body_strength: 6
    },
    summary:
      "Open opposing cable handles outward to train the posterior deltoids with continuous resistance.",
    instructions: [
      "Set the cables around shoulder height.",
      "Begin with the arms reaching toward opposite pulleys.",
      "Open the arms outward.",
      "Return slowly."
    ],
    cues: [
      "Keep the shoulders down.",
      "Avoid torso momentum."
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
    id: "reverse_pec_deck",
    name: "Reverse Pec Deck",
    aliases: [
      "reverse fly machine",
      "rear delt machine",
      "reverse butterfly",
      "rear delt pec deck"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "rhomboid_major",
      "rhomboid_minor",
      "trapezius_middle"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "reverse_fly_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "single_arm_reverse_pec_deck",
      "reverse_fly",
      "cable_reverse_fly",
      "face_pull"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      upper_body_strength: 6,
      general_fitness: 6
    },
    summary:
      "Open the arms outward on a reverse pec-deck machine to isolate the rear deltoids.",
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
    id: "single_arm_reverse_pec_deck",
    name: "Single-Arm Reverse Pec Deck",
    aliases: [
      "one arm reverse pec deck",
      "single arm rear delt machine",
      "unilateral reverse pec deck"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid"
    ],
    secondaryMuscles: [
      "rhomboid_major",
      "rhomboid_minor",
      "trapezius_middle"
    ],
    movementPatterns: [
      "shoulder_horizontal_abduction"
    ],
    equipment: [
      "reverse_fly_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder",
      label: "Rear Delts"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "reverse_pec_deck",
      "cable_reverse_fly",
      "incline_rear_delt_fly"
    ],
    laterality: "unilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      upper_body_strength: 6
    },
    summary:
      "Perform the reverse pec-deck movement one arm at a time for unilateral rear-delt training.",
    instructions: [
      "Adjust the machine for the working arm.",
      "Keep the chest supported.",
      "Open one arm outward.",
      "Return under control before switching sides."
    ],
    cues: [
      "Keep the torso from rotating.",
      "Match range and tempo between sides."
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
    id: "face_pull",
    name: "Face Pull",
    aliases: [
      "rope face pull",
      "cable face pull",
      "band face pull"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "cable",
      "resistance_band"
    ],
    bodyParts: [
      "back",
      "shoulders",
      "upper_body"
    ],
    primaryMuscles: [
      "posterior_deltoid",
      "infraspinatus",
      "teres_minor"
    ],
    secondaryMuscles: [
      "trapezius_middle",
      "rhomboid_major"
    ],
    movementPatterns: [
      "horizontal_pull",
      "shoulder_horizontal_abduction",
      "shoulder_external_rotation"
    ],
    equipment: [
      "cable_machine",
      "resistance_band",
      "rope_attachment"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "rear_shoulder_upper_back",
      label: "Rear Delts + Upper Back"
    },
    substitutionGroup: "rear_delt_fly",
    substitutions: [
      "reverse_fly",
      "cable_reverse_fly",
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
      "Pull a rope or band toward the face while opening the elbows and externally rotating the shoulders.",
    instructions: [
      "Set the cable or band near face height.",
      "Begin with the arms extended.",
      "Pull toward the face while opening the hands apart.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging.",
      "Use a controlled range."
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
  // UPPER TRAPS / SHOULDER GIRDLE
  // ===================================================

  {
    id: "dumbbell_shrug",
    name: "Dumbbell Shrug",
    aliases: [
      "db shrug",
      "shoulder shrug",
      "dumbbell shoulder shrug"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "trapezius_upper"
    ],
    secondaryMuscles: [
      "forearm_flexors"
    ],
    movementPatterns: [
      "scapular_elevation"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_upper",
      region: "upper_traps",
      label: "Upper Traps"
    },
    substitutionGroup: "shrug",
    substitutions: [
      "barbell_shrug",
      "machine_shrug"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 7,
      upper_body_strength: 7
    },
    summary:
      "Elevate the shoulders toward the ears against dumbbell resistance, then lower under control.",
    instructions: [
      "Stand tall holding dumbbells at the sides.",
      "Raise the shoulders upward.",
      "Pause briefly.",
      "Lower under control."
    ],
    cues: [
      "Move primarily upward rather than rolling the shoulders.",
      "Keep the arms long."
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
    id: "barbell_shrug",
    name: "Barbell Shrug",
    aliases: [
      "bb shrug",
      "barbell shoulder shrug"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body",
      "forearms"
    ],
    primaryMuscles: [
      "trapezius_upper"
    ],
    secondaryMuscles: [
      "forearm_flexors"
    ],
    movementPatterns: [
      "scapular_elevation"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_upper",
      region: "upper_traps",
      label: "Upper Traps"
    },
    substitutionGroup: "shrug",
    substitutions: [
      "dumbbell_shrug",
      "machine_shrug"
    ],
    laterality: "bilateral",
    setup: "standing_barbell",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Elevate the shoulders against a barbell load to train the upper trapezius.",
    instructions: [
      "Stand tall holding the bar in front of the thighs.",
      "Elevate the shoulders.",
      "Pause briefly at the top.",
      "Lower under control."
    ],
    cues: [
      "Avoid shoulder rolling.",
      "Keep the torso still."
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
    id: "machine_shrug",
    name: "Machine Shrug",
    aliases: [
      "shrug machine",
      "plate loaded shrug",
      "machine shoulder shrug"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "shoulders",
      "back",
      "upper_body"
    ],
    primaryMuscles: [
      "trapezius_upper"
    ],
    secondaryMuscles: [
      "forearm_flexors"
    ],
    movementPatterns: [
      "scapular_elevation"
    ],
    equipment: [
      "shrug_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "trapezius_upper",
      region: "upper_traps",
      label: "Upper Traps"
    },
    substitutionGroup: "shrug",
    substitutions: [
      "dumbbell_shrug",
      "barbell_shrug"
    ],
    laterality: "bilateral",
    setup: "standing_machine",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 8
    },
    summary:
      "Elevate the shoulders against machine resistance to train the upper trapezius.",
    instructions: [
      "Set the machine and grip the handles securely.",
      "Stand tall.",
      "Elevate the shoulders.",
      "Lower under control."
    ],
    cues: [
      "Avoid bouncing.",
      "Keep the neck relaxed."
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
  }

]);

export {
  VERSION,
  SOURCE,
  SHOULDER_EXERCISES
};

export default SHOULDER_EXERCISES;