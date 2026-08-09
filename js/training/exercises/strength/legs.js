// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/legs.js
// Version: 1.2.0
// Purpose:
//   Lower-body strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// V1.2.0:
//   - Preserves all existing V1.0.0 and V1.1.0 exercise IDs.
//   - Preserves legacy equipment compatibility for generic
//     lunge, split-squat, step-up, and RDL records.
//   - Keeps explicit dumbbell/barbell variants for better
//     search, logging, and recommendation accuracy.
//   - Adds dedicated hip-abductor and hip-adductor exercises.
//   - Adds seated hip abduction / adduction machines.
//   - Adds cable and band hip abduction / adduction.
//   - Adds explicit weighted lunge variants.
//   - Adds dumbbell and barbell walking/reverse lunges.
//   - Adds weighted forward lunges.
//   - Adds dumbbell lateral lunges.
//   - Adds weighted step-ups.
//   - Adds belt squat.
//   - Adds Smith-machine split squat.
//   - Adds Smith-machine Bulgarian split squat.
//   - Adds stiff-leg deadlift.
//   - Adds barbell good morning.
//   - Adds clamshell hip external-rotation work.
//   - Adds Copenhagen plank adductor work.
//   - Uses registered anatomy and movement-pattern IDs.
// =====================================================

const VERSION = "1.2.0";
const SOURCE = "js/training/exercises/strength/legs";

const LEG_EXERCISES = Object.freeze([

  // ===================================================
  // SQUATS
  // ===================================================

  {
    id: "barbell_back_squat",
    name: "Barbell Back Squat",
    aliases: [
      "back squat",
      "barbell squat",
      "high bar squat",
      "low bar squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "erector_spinae",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "barbell",
      "squat_rack"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "compound_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "barbell_front_squat",
      "hack_squat",
      "leg_press",
      "smith_machine_squat",
      "goblet_squat",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "squat_rack",
    goals: {
      muscle_building: 10,
      strength: 10,
      lower_body_strength: 10,
      athletic_performance: 8,
      general_fitness: 7
    },
    summary:
      "Squat down with a bar supported across the upper back, then stand by extending the hips and knees.",
    instructions: [
      "Set the bar securely across the upper back.",
      "Brace the torso and begin the descent through the hips and knees.",
      "Lower to a controlled depth that preserves stable positioning.",
      "Drive through the feet to stand."
    ],
    cues: [
      "Keep the knees tracking in line with the feet.",
      "Maintain a controlled trunk position."
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
    id: "barbell_front_squat",
    name: "Barbell Front Squat",
    aliases: [
      "front squat",
      "barbell front squat",
      "front rack squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "vastus_intermedius"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "erector_spinae",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "barbell",
      "squat_rack"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "quadriceps",
      label: "Quads"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "barbell_back_squat",
      "hack_squat",
      "goblet_squat",
      "leg_press",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "front_rack",
    goals: {
      muscle_building: 9,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Squat with the bar supported across the front of the shoulders to emphasize the quadriceps and upright torso control.",
    instructions: [
      "Set the bar in a stable front-rack position.",
      "Brace the torso and keep the elbows elevated.",
      "Descend through the hips and knees.",
      "Drive through the feet to stand."
    ],
    cues: [
      "Keep the chest tall.",
      "Do not allow the elbows to collapse downward."
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
    id: "goblet_squat",
    name: "Goblet Squat",
    aliases: [
      "dumbbell goblet squat",
      "kettlebell goblet squat",
      "goblet squats"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "erector_spinae"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "dumbbell",
      "kettlebell"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "compound_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "barbell_back_squat",
      "barbell_front_squat",
      "hack_squat",
      "leg_press",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      general_fitness: 9
    },
    summary:
      "Hold a weight at the chest, squat down under control, and stand by extending the hips and knees.",
    instructions: [
      "Hold a dumbbell or kettlebell close to the chest.",
      "Sit down between the hips while bending the knees.",
      "Maintain a stable torso.",
      "Stand back up through the feet."
    ],
    cues: [
      "Keep the weight close to the body.",
      "Let the knees track with the toes."
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
    id: "hack_squat",
    name: "Hack Squat",
    aliases: [
      "hack squat machine",
      "machine hack squat",
      "sled hack squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "vastus_intermedius"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "hack_squat_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "quadriceps",
      label: "Quads"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "leg_press",
      "barbell_front_squat",
      "smith_machine_squat",
      "pendulum_squat",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Squat on a guided hack-squat machine to train the quadriceps and glutes with strong torso support.",
    instructions: [
      "Place the shoulders and back securely against the pads.",
      "Set the feet on the platform.",
      "Lower the sled under control.",
      "Press through the feet to return."
    ],
    cues: [
      "Keep the knees tracking with the toes.",
      "Use a depth that maintains stable hip and back contact."
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
    id: "pendulum_squat",
    name: "Pendulum Squat",
    aliases: [
      "pendulum squat machine",
      "pendulum machine squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "vastus_intermedius"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "pendulum_squat_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "quadriceps",
      label: "Quads"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "hack_squat",
      "leg_press",
      "smith_machine_squat",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Squat through the arc of a pendulum machine to load the quadriceps and glutes through a supported range.",
    instructions: [
      "Position the shoulders securely beneath the pads.",
      "Place the feet firmly on the platform.",
      "Descend under control.",
      "Drive through the platform to return."
    ],
    cues: [
      "Keep the knees aligned with the feet.",
      "Do not bounce from the bottom."
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
    id: "smith_machine_squat",
    name: "Smith Machine Squat",
    aliases: [
      "smith squat",
      "smith machine back squat",
      "smith squats"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "smith_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "compound_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "barbell_back_squat",
      "hack_squat",
      "leg_press",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "smith_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Squat under a Smith-machine bar using the fixed bar path for a stable lower-body strength movement.",
    instructions: [
      "Set the bar across the upper back.",
      "Position the feet to match the machine path.",
      "Lower through the hips and knees.",
      "Stand and rotate the bar into the hooks when finished."
    ],
    cues: [
      "Choose foot placement that allows stable knee and hip tracking.",
      "Do not force an unnatural bar path."
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
    id: "belt_squat",
    name: "Belt Squat",
    aliases: [
      "belt squat machine",
      "hip belt squat",
      "machine belt squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "adductor_magnus",
      "biceps_femoris"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "belt_squat_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "compound_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "hack_squat",
      "leg_press",
      "barbell_back_squat",
      "smith_machine_squat"
    ],
    laterality: "bilateral",
    setup: "belt_squat_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      general_fitness: 7
    },
    summary:
      "Squat with resistance attached around the hips, loading the legs without placing a bar across the shoulders.",
    instructions: [
      "Secure the belt or machine attachment around the hips.",
      "Set the feet in a stable squat stance.",
      "Descend through the hips and knees.",
      "Drive through the feet to stand."
    ],
    cues: [
      "Keep the torso controlled.",
      "Allow the knees to track naturally over the feet."
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
  // LEG PRESS
  // ===================================================

  {
    id: "leg_press",
    name: "Leg Press",
    aliases: [
      "leg press machine",
      "sled leg press",
      "45 degree leg press",
      "45 degree sled press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "adductor_magnus"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "leg_press_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "compound_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "bilateral_squat",
    substitutions: [
      "hack_squat",
      "barbell_back_squat",
      "smith_machine_squat",
      "pendulum_squat",
      "belt_squat"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Lower the sled by bending the hips and knees, then press it away by extending the legs.",
    instructions: [
      "Place the feet securely on the platform.",
      "Release the safety mechanism as appropriate for the machine.",
      "Lower the platform under control.",
      "Press through the feet to extend the hips and knees."
    ],
    cues: [
      "Keep the hips supported against the pad.",
      "Do not force excessive depth."
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
    id: "single_leg_press",
    name: "Single-Leg Press",
    aliases: [
      "one leg press",
      "unilateral leg press",
      "single leg leg press"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "squat"
    ],
    equipment: [
      "leg_press_machine"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "unilateral_leg_press",
    substitutions: [
      "bulgarian_split_squat",
      "reverse_lunge",
      "dumbbell_reverse_lunge",
      "step_up"
    ],
    laterality: "unilateral",
    setup: "machine",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Press the leg-press sled using one leg at a time to train unilateral lower-body strength.",
    instructions: [
      "Place one foot securely on the platform.",
      "Keep the hips level and supported.",
      "Lower the sled under control.",
      "Press through the working foot."
    ],
    cues: [
      "Do not let the pelvis rotate.",
      "Use a load appropriate for one leg."
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
  // SPLIT SQUATS
  // ===================================================

  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    aliases: [
      "bulgarian squat",
      "rear foot elevated split squat",
      "rfess",
      "bulgarian lunges",
      "dumbbell bulgarian split squat",
      "weighted bulgarian split squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells",
      "barbell",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "reverse_lunge",
      "dumbbell_reverse_lunge",
      "walking_lunge",
      "dumbbell_walking_lunge",
      "split_squat",
      "single_leg_press",
      "smith_machine_split_squat",
      "smith_machine_bulgarian_split_squat"
    ],
    laterality: "unilateral",
    setup: "rear_foot_elevated",
    goals: {
      muscle_building: 10,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 9,
      general_fitness: 8
    },
    summary:
      "Perform a split squat with the rear foot elevated to strongly train the working leg.",
    instructions: [
      "Place the rear foot on a stable bench or platform.",
      "Set the front foot far enough forward for stable balance.",
      "Lower the back knee toward the floor.",
      "Drive through the front foot to stand."
    ],
    cues: [
      "Keep most of the load on the front leg.",
      "Keep the front knee tracking with the foot."
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
    id: "split_squat",
    name: "Split Squat",
    aliases: [
      "stationary lunge",
      "static lunge",
      "split stance squat",
      "bodyweight split squat",
      "weighted split squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells",
      "barbell"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "bulgarian_split_squat",
      "reverse_lunge",
      "walking_lunge",
      "smith_machine_split_squat"
    ],
    laterality: "unilateral",
    setup: "split_stance",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 9,
      general_fitness: 8
    },
    summary:
      "Lower and raise the body from a stationary split stance to train one leg at a time.",
    instructions: [
      "Take a stable split stance.",
      "Lower the back knee toward the floor.",
      "Keep the front foot planted.",
      "Drive through the front leg to return."
    ],
    cues: [
      "Maintain balance.",
      "Keep the front knee aligned with the toes."
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
    id: "smith_machine_split_squat",
    name: "Smith Machine Split Squat",
    aliases: [
      "smith split squat",
      "smith machine lunge",
      "smith stationary lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "smith_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "split_squat",
      "bulgarian_split_squat",
      "dumbbell_reverse_lunge",
      "single_leg_press"
    ],
    laterality: "unilateral",
    setup: "smith_machine_split_stance",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Perform a stationary split squat under a Smith-machine bar for guided unilateral leg training.",
    instructions: [
      "Position the bar securely across the upper back.",
      "Take a stable split stance.",
      "Lower the rear knee toward the floor.",
      "Drive through the front foot to return."
    ],
    cues: [
      "Keep the front foot firmly planted.",
      "Use the machine path for stability rather than leaning into the bar."
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
    id: "smith_machine_bulgarian_split_squat",
    name: "Smith Machine Bulgarian Split Squat",
    aliases: [
      "smith bulgarian split squat",
      "smith machine bulgarian squat",
      "smith bulgarian",
      "smith rfess"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "smith_machine",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "rear_foot_elevated_unilateral",
      label: "Glutes + Quads"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "bulgarian_split_squat",
      "smith_machine_split_squat",
      "single_leg_press",
      "dumbbell_reverse_lunge"
    ],
    laterality: "unilateral",
    setup: "smith_machine_rear_foot_elevated",
    goals: {
      muscle_building: 10,
      strength: 9,
      lower_body_strength: 10
    },
    summary:
      "Perform a rear-foot-elevated split squat beneath a Smith-machine bar for stable unilateral loading.",
    instructions: [
      "Position the rear foot on a stable bench.",
      "Set the Smith bar securely across the upper back.",
      "Lower through the front hip and knee.",
      "Drive through the front foot to stand."
    ],
    cues: [
      "Keep most of the load on the front leg.",
      "Keep the pelvis controlled.",
      "Position the front foot to match the machine path."
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
  // LUNGES
  // ===================================================

  {
    id: "walking_lunge",
    name: "Walking Lunge",
    aliases: [
      "walking lunges",
      "bodyweight walking lunge",
      "walking bodyweight lunge",
      "weighted walking lunge",
      "weighted walking lunges",
      "walking lunge with weights"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "dynamic_unilateral",
      label: "Quads + Glutes"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "dumbbell_walking_lunge",
      "reverse_lunge",
      "split_squat",
      "bulgarian_split_squat"
    ],
    laterality: "alternating",
    setup: "walking",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step forward into alternating lunges while maintaining balance and control through each repetition.",
    instructions: [
      "Stand tall with space in front of you.",
      "Step forward and lower into a lunge.",
      "Push through the front foot to move into the next step.",
      "Alternate legs."
    ],
    cues: [
      "Keep the front knee tracking with the foot.",
      "Maintain a controlled torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "distance",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "dumbbell_walking_lunge",
    name: "Dumbbell Walking Lunge",
    aliases: [
      "dumbbell walking lunge",
      "dumbbell walking lunges",
      "walking dumbbell lunge",
      "walking lunges with dumbbells",
      "db walking lunge",
      "db walking lunges"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "loaded_dynamic_unilateral",
      label: "Glutes + Quads"
    },
    substitutionGroup: "weighted_lunge",
    substitutions: [
      "walking_lunge",
      "dumbbell_reverse_lunge",
      "barbell_walking_lunge",
      "bulgarian_split_squat"
    ],
    laterality: "alternating",
    setup: "walking",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      athletic_performance: 9,
      general_fitness: 8
    },
    summary:
      "Walk forward through alternating lunges while holding dumbbells for additional resistance.",
    instructions: [
      "Hold a dumbbell securely in each hand.",
      "Step forward and lower both knees under control.",
      "Drive through the front foot to advance.",
      "Continue by alternating legs."
    ],
    cues: [
      "Keep the dumbbells controlled at your sides.",
      "Avoid allowing the front knee to collapse inward.",
      "Keep the torso stable as you step."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "distance",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "barbell_walking_lunge",
    name: "Barbell Walking Lunge",
    aliases: [
      "barbell walking lunges",
      "walking barbell lunge",
      "weighted barbell lunges"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus",
      "erector_spinae"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "loaded_dynamic_unilateral",
      label: "Glutes + Quads"
    },
    substitutionGroup: "weighted_lunge",
    substitutions: [
      "dumbbell_walking_lunge",
      "barbell_reverse_lunge",
      "bulgarian_split_squat"
    ],
    laterality: "alternating",
    setup: "walking_barbell",
    goals: {
      muscle_building: 9,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 9
    },
    summary:
      "Perform alternating walking lunges with a barbell supported across the upper back.",
    instructions: [
      "Secure the bar across the upper back.",
      "Step forward into a controlled lunge.",
      "Drive through the front leg to advance.",
      "Continue alternating sides."
    ],
    cues: [
      "Maintain trunk stability beneath the bar.",
      "Use deliberate steps rather than rushing.",
      "Keep each knee aligned with the corresponding foot."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "distance",
        "rest_seconds"
      ]
    },
    illustration: {
      anatomy: null,
      movement: null
    }
  },

  {
    id: "reverse_lunge",
    name: "Reverse Lunge",
    aliases: [
      "backward lunge",
      "rear lunge",
      "bodyweight reverse lunge",
      "reverse dumbbell lunge",
      "weighted reverse lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells",
      "barbell"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "unilateral_lower_body",
      label: "Glutes + Quads"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "dumbbell_reverse_lunge",
      "walking_lunge",
      "split_squat",
      "bulgarian_split_squat"
    ],
    laterality: "alternating_or_unilateral",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 9,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step backward into a lunge, then drive through the front leg to return to standing.",
    instructions: [
      "Stand tall.",
      "Step one leg backward.",
      "Lower the back knee toward the floor.",
      "Push through the front foot to return."
    ],
    cues: [
      "Keep the front foot planted.",
      "Maintain a controlled torso."
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
    id: "dumbbell_reverse_lunge",
    name: "Dumbbell Reverse Lunge",
    aliases: [
      "weighted reverse lunge",
      "weighted reverse lunges",
      "reverse dumbbell lunge",
      "reverse dumbbell lunges",
      "dumbbell backward lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "loaded_unilateral_lower_body",
      label: "Glutes + Quads"
    },
    substitutionGroup: "weighted_lunge",
    substitutions: [
      "reverse_lunge",
      "dumbbell_walking_lunge",
      "barbell_reverse_lunge",
      "bulgarian_split_squat"
    ],
    laterality: "alternating_or_unilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 9,
      lower_body_strength: 9,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step backward into alternating or unilateral lunges while holding dumbbells for added resistance.",
    instructions: [
      "Hold the dumbbells securely at your sides.",
      "Step one foot backward.",
      "Lower the rear knee under control.",
      "Drive through the front foot to return to standing."
    ],
    cues: [
      "Keep most of the working pressure through the front leg.",
      "Keep the pelvis level.",
      "Control the backward step."
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
    id: "barbell_reverse_lunge",
    name: "Barbell Reverse Lunge",
    aliases: [
      "barbell reverse lunges",
      "weighted barbell reverse lunge",
      "barbell backward lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus",
      "erector_spinae"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "barbell",
      "squat_rack"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "loaded_unilateral_lower_body",
      label: "Glutes + Quads"
    },
    substitutionGroup: "weighted_lunge",
    substitutions: [
      "dumbbell_reverse_lunge",
      "barbell_walking_lunge",
      "bulgarian_split_squat"
    ],
    laterality: "alternating_or_unilateral",
    setup: "barbell_back_rack",
    goals: {
      muscle_building: 9,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Perform reverse lunges with a barbell supported across the upper back.",
    instructions: [
      "Secure the bar across the upper back.",
      "Step one leg backward.",
      "Lower into the lunge under control.",
      "Drive through the front foot to return."
    ],
    cues: [
      "Keep the torso stable beneath the bar.",
      "Keep the working knee aligned over the foot."
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
    id: "forward_lunge",
    name: "Forward Lunge",
    aliases: [
      "front lunge",
      "bodyweight forward lunge",
      "forward dumbbell lunge",
      "weighted forward lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "split_squat_lunge",
    substitutions: [
      "dumbbell_forward_lunge",
      "reverse_lunge",
      "walking_lunge",
      "split_squat"
    ],
    laterality: "alternating_or_unilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      general_fitness: 8
    },
    summary:
      "Step forward into a lunge and push back to the starting position.",
    instructions: [
      "Stand tall.",
      "Step forward with one leg.",
      "Lower both knees under control.",
      "Push through the front foot to return."
    ],
    cues: [
      "Use a controlled step length.",
      "Keep the front knee aligned with the foot."
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
    id: "dumbbell_forward_lunge",
    name: "Dumbbell Forward Lunge",
    aliases: [
      "weighted forward lunge",
      "weighted forward lunges",
      "forward dumbbell lunge",
      "forward dumbbell lunges",
      "dumbbell front lunge"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "adductor_magnus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "loaded_unilateral_lower_body",
      label: "Quads + Glutes"
    },
    substitutionGroup: "weighted_lunge",
    substitutions: [
      "forward_lunge",
      "dumbbell_reverse_lunge",
      "dumbbell_walking_lunge"
    ],
    laterality: "alternating_or_unilateral",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 9,
      general_fitness: 8
    },
    summary:
      "Step forward into lunges while holding dumbbells for additional resistance.",
    instructions: [
      "Hold a dumbbell in each hand.",
      "Step forward into a stable lunge.",
      "Lower both knees under control.",
      "Drive backward through the front foot to return."
    ],
    cues: [
      "Control the landing of each step.",
      "Keep the front knee aligned with the foot."
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
    id: "lateral_lunge",
    name: "Lateral Lunge",
    aliases: [
      "side lunge",
      "lateral dumbbell lunge",
      "side lunge with dumbbell"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "functional",
      "mobility"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "adductors",
      "hips"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "adductor_magnus",
      "rectus_femoris"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "frontal_plane_lower_body",
      label: "Adductors + Glutes"
    },
    substitutionGroup: "lateral_lower_body",
    substitutions: [
      "dumbbell_lateral_lunge",
      "cossack_squat",
      "split_squat",
      "seated_hip_adduction"
    ],
    laterality: "unilateral",
    setup: "standing",
    goals: {
      muscle_building: 7,
      strength: 7,
      lower_body_strength: 8,
      mobility: 7,
      athletic_performance: 9
    },
    summary:
      "Step to the side and sit into one hip while keeping the opposite leg more extended.",
    instructions: [
      "Stand with room to move laterally.",
      "Step to one side.",
      "Bend the working knee and sit the hips back.",
      "Push through the working foot to return."
    ],
    cues: [
      "Keep the working foot planted.",
      "Keep the knee tracking with the toes."
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
    id: "dumbbell_lateral_lunge",
    name: "Dumbbell Lateral Lunge",
    aliases: [
      "weighted lateral lunge",
      "weighted side lunge",
      "dumbbell side lunge",
      "db lateral lunge",
      "dumbbell lateral lunges"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "adductors",
      "hips"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "gluteus_maximus",
      "rectus_femoris"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "loaded_frontal_plane",
      label: "Adductors + Glutes"
    },
    substitutionGroup: "lateral_lower_body",
    substitutions: [
      "lateral_lunge",
      "cossack_squat",
      "seated_hip_adduction"
    ],
    laterality: "unilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 8,
      lower_body_strength: 8,
      athletic_performance: 9
    },
    summary:
      "Step laterally while holding dumbbells and load the working hip, quadriceps, glutes, and adductors.",
    instructions: [
      "Hold the dumbbells securely.",
      "Step laterally with one leg.",
      "Sit the hips backward over the working leg.",
      "Drive through the working foot to return."
    ],
    cues: [
      "Keep the working foot planted.",
      "Keep the knee aligned with the toes.",
      "Control the dumbbells throughout the movement."
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
    id: "cossack_squat",
    name: "Cossack Squat",
    aliases: [
      "cossack",
      "side to side squat",
      "deep lateral squat"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "mobility",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "adductors",
      "hips"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "gluteus_maximus",
      "rectus_femoris"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    movementPatterns: [
      "lunge"
    ],
    equipment: [
      "bodyweight",
      "dumbbell",
      "kettlebell"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "frontal_plane_lower_body",
      label: "Adductors + Mobility"
    },
    substitutionGroup: "lateral_lower_body",
    substitutions: [
      "lateral_lunge",
      "dumbbell_lateral_lunge"
    ],
    laterality: "alternating",
    setup: "wide_stance",
    goals: {
      mobility: 10,
      flexibility: 8,
      lower_body_strength: 7,
      athletic_performance: 8
    },
    summary:
      "Shift deeply from side to side in a wide stance to train lateral lower-body strength and mobility.",
    instructions: [
      "Take a wide stance.",
      "Shift the hips toward one leg.",
      "Bend that knee while the opposite leg remains more extended.",
      "Return through the center and repeat on the other side."
    ],
    cues: [
      "Use only a range you can control.",
      "Keep the working heel planted."
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
  // STEP-UPS
  // ===================================================

  {
    id: "step_up",
    name: "Step-Up",
    aliases: [
      "step up",
      "box step up",
      "bench step up",
      "bodyweight step up",
      "weighted step up"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "functional"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: [
      "step"
    ],
    equipment: [
      "box",
      "bench",
      "bodyweight",
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "unilateral_lower_body",
      label: "Glutes + Quads"
    },
    substitutionGroup: "step",
    substitutions: [
      "dumbbell_step_up",
      "bulgarian_split_squat",
      "reverse_lunge",
      "single_leg_press"
    ],
    laterality: "unilateral",
    setup: "elevated_surface",
    goals: {
      strength: 7,
      muscle_building: 7,
      lower_body_strength: 8,
      running: 7,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step onto an elevated surface and drive through the working leg to bring the body upward.",
    instructions: [
      "Place one foot fully on a stable box or bench.",
      "Drive through that foot to step up.",
      "Stand tall on the platform.",
      "Lower under control."
    ],
    cues: [
      "Avoid pushing excessively from the trailing leg.",
      "Keep the knee aligned over the foot."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "box_height",
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
    id: "dumbbell_step_up",
    name: "Dumbbell Step-Up",
    aliases: [
      "weighted step up",
      "weighted step-up",
      "weighted step ups",
      "dumbbell step up",
      "dumbbell step ups",
      "weighted box step up"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: [
      "step"
    ],
    equipment: [
      "dumbbells",
      "box",
      "bench"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "loaded_unilateral_lower_body",
      label: "Glutes + Quads"
    },
    substitutionGroup: "step",
    substitutions: [
      "step_up",
      "bulgarian_split_squat",
      "dumbbell_reverse_lunge",
      "single_leg_press"
    ],
    laterality: "unilateral",
    setup: "elevated_surface",
    goals: {
      strength: 8,
      muscle_building: 9,
      lower_body_strength: 9,
      running: 7,
      athletic_performance: 9
    },
    summary:
      "Step onto an elevated surface while holding dumbbells to increase resistance through the working leg.",
    instructions: [
      "Hold a dumbbell in each hand.",
      "Place the entire working foot on the platform.",
      "Drive through the elevated leg to stand.",
      "Lower back down under control."
    ],
    cues: [
      "Minimize assistance from the trailing leg.",
      "Keep the working knee aligned over the foot."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "weight",
        "box_height",
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
  // QUADRICEPS ISOLATION
  // ===================================================

  {
    id: "leg_extension",
    name: "Leg Extension",
    aliases: [
      "leg extension machine",
      "quad extension",
      "knee extension machine",
      "seated leg extension"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "quadriceps",
      "lower_body"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "vastus_intermedius"
    ],
    secondaryMuscles: [],
    movementPatterns: [
      "knee_extension"
    ],
    equipment: [
      "leg_extension_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "quadriceps_isolation",
      label: "Quads"
    },
    substitutionGroup: "knee_extension",
    substitutions: [
      "single_leg_extension"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 6
    },
    summary:
      "Extend the knees against machine resistance, then return to the bent-knee position under control.",
    instructions: [
      "Adjust the machine so the knee aligns with the pivot.",
      "Place the lower legs behind the pad.",
      "Extend the knees.",
      "Lower the weight under control."
    ],
    cues: [
      "Avoid using momentum.",
      "Keep the hips against the seat."
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
    id: "single_leg_extension",
    name: "Single-Leg Extension",
    aliases: [
      "one leg extension",
      "unilateral leg extension",
      "single leg quad extension"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "quadriceps",
      "lower_body"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "vastus_intermedius"
    ],
    secondaryMuscles: [],
    movementPatterns: [
      "knee_extension"
    ],
    equipment: [
      "leg_extension_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "quadriceps_isolation",
      label: "Quads"
    },
    substitutionGroup: "knee_extension",
    substitutions: [
      "leg_extension"
    ],
    laterality: "unilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 6
    },
    summary:
      "Perform the leg-extension movement with one leg at a time.",
    instructions: [
      "Adjust the machine correctly.",
      "Use one leg against the pad.",
      "Extend the knee under control.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the hips supported.",
      "Match the range between sides."
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
  // HAMSTRING CURLS
  // ===================================================

  {
    id: "seated_leg_curl",
    name: "Seated Leg Curl",
    aliases: [
      "seated hamstring curl",
      "seated leg curl machine",
      "hamstring curl machine"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "hamstrings",
      "lower_body"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gastrocnemius"
    ],
    movementPatterns: [
      "knee_flexion"
    ],
    equipment: [
      "leg_curl_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "hamstrings_isolation",
      label: "Hamstrings"
    },
    substitutionGroup: "hamstring_curl",
    substitutions: [
      "lying_leg_curl",
      "standing_leg_curl",
      "single_leg_seated_leg_curl"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Bend the knees against machine resistance to bring the lower legs downward and back.",
    instructions: [
      "Adjust the machine to align the knees with the pivot.",
      "Secure the thigh pad if present.",
      "Flex the knees against resistance.",
      "Return under control."
    ],
    cues: [
      "Keep the hips in contact with the seat.",
      "Avoid bouncing the weight."
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
    id: "lying_leg_curl",
    name: "Lying Leg Curl",
    aliases: [
      "lying hamstring curl",
      "prone leg curl",
      "lying leg curl machine"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "hamstrings",
      "lower_body"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gastrocnemius"
    ],
    movementPatterns: [
      "knee_flexion"
    ],
    equipment: [
      "lying_leg_curl_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "hamstrings_isolation",
      label: "Hamstrings"
    },
    substitutionGroup: "hamstring_curl",
    substitutions: [
      "seated_leg_curl",
      "standing_leg_curl",
      "single_leg_lying_leg_curl"
    ],
    laterality: "bilateral",
    setup: "prone_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Flex the knees while lying prone against machine resistance to isolate the hamstrings.",
    instructions: [
      "Lie face-down and align the knees with the machine pivot.",
      "Place the pad above the heels.",
      "Curl the lower legs upward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the hips against the pad.",
      "Avoid lifting the pelvis."
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
    id: "standing_leg_curl",
    name: "Standing Leg Curl",
    aliases: [
      "standing hamstring curl",
      "single leg standing curl",
      "standing leg curl machine"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "hamstrings",
      "lower_body"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gastrocnemius"
    ],
    movementPatterns: [
      "knee_flexion"
    ],
    equipment: [
      "standing_leg_curl_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "hamstrings_isolation",
      label: "Hamstrings"
    },
    substitutionGroup: "hamstring_curl",
    substitutions: [
      "seated_leg_curl",
      "lying_leg_curl"
    ],
    laterality: "unilateral",
    setup: "standing_machine",
    goals: {
      muscle_building: 9,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Curl one leg against machine resistance from a standing position.",
    instructions: [
      "Set the machine for the working leg.",
      "Hold the supports for balance.",
      "Flex the knee to curl the pad upward.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the hips square.",
      "Avoid swinging the working thigh."
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
    id: "single_leg_seated_leg_curl",
    name: "Single-Leg Seated Leg Curl",
    aliases: [
      "one leg seated curl",
      "single leg hamstring curl",
      "unilateral seated leg curl"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "hamstrings",
      "lower_body"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gastrocnemius"
    ],
    movementPatterns: [
      "knee_flexion"
    ],
    equipment: [
      "leg_curl_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "hamstrings_isolation",
      label: "Hamstrings"
    },
    substitutionGroup: "hamstring_curl",
    substitutions: [
      "seated_leg_curl",
      "standing_leg_curl"
    ],
    laterality: "unilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Perform the seated hamstring curl with one leg at a time.",
    instructions: [
      "Set the machine and thigh pad.",
      "Use one leg against the lower pad.",
      "Flex the knee.",
      "Return slowly and switch sides."
    ],
    cues: [
      "Keep the hips supported.",
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
    id: "single_leg_lying_leg_curl",
    name: "Single-Leg Lying Leg Curl",
    aliases: [
      "one leg lying curl",
      "single leg prone curl",
      "unilateral lying leg curl"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "hamstrings",
      "lower_body"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gastrocnemius"
    ],
    movementPatterns: [
      "knee_flexion"
    ],
    equipment: [
      "lying_leg_curl_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "hamstrings_isolation",
      label: "Hamstrings"
    },
    substitutionGroup: "hamstring_curl",
    substitutions: [
      "lying_leg_curl",
      "standing_leg_curl"
    ],
    laterality: "unilateral",
    setup: "prone_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Perform a prone hamstring curl one leg at a time.",
    instructions: [
      "Lie securely on the machine.",
      "Use one leg against the pad.",
      "Curl the heel toward the glutes.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis down.",
      "Do not twist the hips."
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
  // HIP ABDUCTORS
  // ===================================================

  {
    id: "seated_hip_abduction",
    name: "Seated Hip Abduction",
    aliases: [
      "hip abductor machine",
      "abductor machine",
      "seated abductor",
      "seated hip abductor",
      "outer thigh machine",
      "outer hip machine",
      "hip abduction machine",
      "machine hip abduction"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "glutes",
      "abductors"
    ],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: [
      "tensor_fasciae_latae"
    ],
    movementPatterns: [
      "hip_abduction"
    ],
    equipment: [
      "hip_abduction_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_hip",
      label: "Hip Abductors"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "cable_hip_abduction",
      "band_hip_abduction"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7,
      athletic_performance: 7,
      general_fitness: 7
    },
    summary:
      "Press the thighs outward against machine resistance to train the lateral hip and gluteal abductors.",
    instructions: [
      "Sit securely against the back pad.",
      "Position the outer thighs against the machine pads.",
      "Press the knees outward under control.",
      "Return slowly without allowing the weight stack to slam."
    ],
    cues: [
      "Keep the pelvis stable.",
      "Control both the outward and inward phases.",
      "Avoid bouncing through the range."
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
    id: "cable_hip_abduction",
    name: "Cable Hip Abduction",
    aliases: [
      "standing cable hip abduction",
      "cable leg abduction",
      "cable abductor",
      "standing hip abduction",
      "cable outer thigh"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "functional",
      "cable"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "glutes",
      "abductors"
    ],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: [
      "tensor_fasciae_latae"
    ],
    movementPatterns: [
      "hip_abduction"
    ],
    equipment: [
      "cable_machine",
      "ankle_strap"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_hip",
      label: "Hip Abductors"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "seated_hip_abduction",
      "band_hip_abduction"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 6,
      lower_body_strength: 7,
      athletic_performance: 8
    },
    summary:
      "Move one leg outward against cable resistance to train the hip abductors.",
    instructions: [
      "Attach an ankle strap to the working leg.",
      "Stand beside the cable machine and stabilize the torso.",
      "Move the working leg outward from the body.",
      "Return under control."
    ],
    cues: [
      "Keep the pelvis level.",
      "Do not lean excessively away from the cable.",
      "Lead the movement from the hip."
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
    id: "band_hip_abduction",
    name: "Band Hip Abduction",
    aliases: [
      "banded hip abduction",
      "standing band hip abduction",
      "resistance band hip abduction",
      "band leg abduction",
      "banded leg abduction"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "resistance_band"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "glutes",
      "abductors"
    ],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: [
      "tensor_fasciae_latae"
    ],
    movementPatterns: [
      "hip_abduction"
    ],
    equipment: [
      "resistance_band"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_hip",
      label: "Hip Abductors"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "seated_hip_abduction",
      "cable_hip_abduction"
    ],
    laterality: "unilateral",
    setup: "standing_band",
    goals: {
      muscle_building: 7,
      strength: 5,
      lower_body_strength: 6,
      athletic_performance: 7,
      general_fitness: 8
    },
    summary:
      "Move one leg outward against elastic resistance to train the lateral hip musculature.",
    instructions: [
      "Secure the resistance band appropriately.",
      "Stand tall and stabilize the pelvis.",
      "Move one leg outward against the band.",
      "Return slowly."
    ],
    cues: [
      "Keep the pelvis level.",
      "Avoid leaning to create momentum.",
      "Control the return."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "band_resistance",
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
    id: "clamshell",
    name: "Clamshell",
    aliases: [
      "clam shell",
      "hip clamshell",
      "banded clamshell",
      "resistance band clamshell",
      "side lying clamshell"
    ],
    category: "strength",
    exerciseTypes: [
      "resistance_band",
      "functional"
    ],
    bodyParts: [
      "hips",
      "glutes",
      "abductors",
      "lower_body"
    ],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: [
      "tensor_fasciae_latae"
    ],
    movementPatterns: [
      "hip_external_rotation"
    ],
    equipment: [
      "bodyweight",
      "resistance_band"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_posterior_hip",
      label: "Glutes + Hip Rotators"
    },
    substitutionGroup: "hip_external_rotation",
    substitutions: [
      "seated_hip_abduction",
      "band_hip_abduction"
    ],
    laterality: "unilateral",
    setup: "side_lying",
    goals: {
      strength: 5,
      lower_body_strength: 5,
      athletic_performance: 7,
      general_fitness: 8
    },
    summary:
      "Externally rotate the upper hip from a side-lying bent-knee position while keeping the pelvis controlled.",
    instructions: [
      "Lie on one side with the knees bent.",
      "Keep the feet together.",
      "Rotate the upper knee away from the lower knee.",
      "Return slowly."
    ],
    cues: [
      "Do not roll the pelvis backward.",
      "Move from the hip.",
      "Use a controlled range."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "band_resistance",
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
  // HIP ADDUCTORS
  // ===================================================

  {
    id: "seated_hip_adduction",
    name: "Seated Hip Adduction",
    aliases: [
      "hip adductor machine",
      "adductor machine",
      "seated adductor",
      "seated hip adductor",
      "inner thigh machine",
      "hip adduction machine",
      "machine hip adduction"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "machine_strength"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "adductors"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "adductor_longus",
      "adductor_brevis"
    ],
    secondaryMuscles: [
      "gracilis"
    ],
    movementPatterns: [
      "hip_adduction"
    ],
    equipment: [
      "hip_adduction_machine"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "inner_thigh",
      label: "Hip Adductors"
    },
    substitutionGroup: "hip_adduction",
    substitutions: [
      "cable_hip_adduction",
      "band_hip_adduction",
      "lateral_lunge",
      "cossack_squat"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7,
      athletic_performance: 7,
      general_fitness: 7
    },
    summary:
      "Bring the thighs inward against machine resistance to train the inner-thigh adductor muscles.",
    instructions: [
      "Sit securely against the back pad.",
      "Position the inner thighs against the machine pads.",
      "Bring the knees toward one another under control.",
      "Return slowly to the starting position."
    ],
    cues: [
      "Keep the pelvis against the seat.",
      "Control the opening phase.",
      "Avoid bouncing the weight."
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
    id: "cable_hip_adduction",
    name: "Cable Hip Adduction",
    aliases: [
      "standing cable hip adduction",
      "cable leg adduction",
      "cable adductor",
      "standing hip adduction",
      "cable inner thigh"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "functional",
      "cable"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "adductors"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "adductor_longus",
      "adductor_brevis"
    ],
    secondaryMuscles: [
      "gracilis"
    ],
    movementPatterns: [
      "hip_adduction"
    ],
    equipment: [
      "cable_machine",
      "ankle_strap"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "adductor_longus",
      region: "inner_thigh",
      label: "Hip Adductors"
    },
    substitutionGroup: "hip_adduction",
    substitutions: [
      "seated_hip_adduction",
      "band_hip_adduction",
      "lateral_lunge"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 6,
      lower_body_strength: 7,
      athletic_performance: 8
    },
    summary:
      "Pull one leg inward across the body against cable resistance to train the hip adductors.",
    instructions: [
      "Attach an ankle strap to the working leg.",
      "Stand beside the cable machine with the working leg nearest the pulley.",
      "Draw the working leg inward across the body's midline.",
      "Return slowly under control."
    ],
    cues: [
      "Keep the pelvis stable.",
      "Avoid rotating the torso.",
      "Control the return into the stretched position."
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
    id: "band_hip_adduction",
    name: "Band Hip Adduction",
    aliases: [
      "banded hip adduction",
      "standing band hip adduction",
      "resistance band hip adduction",
      "band inner thigh",
      "banded leg adduction"
    ],
    category: "strength",
    exerciseTypes: [
      "hypertrophy",
      "resistance_band"
    ],
    bodyParts: [
      "lower_body",
      "hips",
      "adductors"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "adductor_longus",
      "adductor_brevis"
    ],
    secondaryMuscles: [
      "gracilis"
    ],
    movementPatterns: [
      "hip_adduction"
    ],
    equipment: [
      "resistance_band"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "adductor_longus",
      region: "inner_thigh",
      label: "Hip Adductors"
    },
    substitutionGroup: "hip_adduction",
    substitutions: [
      "seated_hip_adduction",
      "cable_hip_adduction"
    ],
    laterality: "unilateral",
    setup: "standing_band",
    goals: {
      muscle_building: 7,
      strength: 5,
      lower_body_strength: 6,
      athletic_performance: 7
    },
    summary:
      "Move one leg inward against elastic resistance to train the inner-thigh adductor muscles.",
    instructions: [
      "Secure the band to the working leg.",
      "Stand with the working leg nearest the band anchor.",
      "Draw the leg inward across the body's midline.",
      "Return under control."
    ],
    cues: [
      "Keep the pelvis stable.",
      "Avoid rotating the torso.",
      "Control both directions."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: [
        "sets",
        "reps",
        "band_resistance",
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
    id: "copenhagen_plank",
    name: "Copenhagen Plank",
    aliases: [
      "copenhagen side plank",
      "copenhagen adductor plank",
      "adductor plank",
      "copenhagen hold"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "core",
      "calisthenics"
    ],
    bodyParts: [
      "adductors",
      "hips",
      "core",
      "obliques",
      "lower_body"
    ],
    primaryMuscles: [
      "adductor_magnus",
      "adductor_longus",
      "adductor_brevis",
      "gracilis"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "transversus_abdominis"
    ],
    movementPatterns: [
      "hip_adduction",
      "anti_lateral_flexion"
    ],
    equipment: [
      "bodyweight",
      "bench"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "adductors_and_lateral_core",
      label: "Adductors + Core"
    },
    substitutionGroup: "hip_adduction",
    substitutions: [
      "seated_hip_adduction",
      "cable_hip_adduction",
      "band_hip_adduction"
    ],
    laterality: "unilateral",
    setup: "side_plank_elevated_leg",
    goals: {
      strength: 8,
      lower_body_strength: 8,
      core_strength: 8,
      athletic_performance: 9
    },
    summary:
      "Support the body in a side-plank position using the upper leg to strongly challenge the adductors and lateral core.",
    instructions: [
      "Place the upper leg on a stable bench.",
      "Set the elbow beneath the shoulder.",
      "Lift the hips into a side-plank position.",
      "Hold the body in a controlled straight line."
    ],
    cues: [
      "Keep the hips elevated.",
      "Do not rotate the torso.",
      "Progress the lever length gradually."
    ],
    logging: {
      type: "sets_duration",
      fields: [
        "sets",
        "duration",
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
  // HIP HINGE / POSTERIOR CHAIN
  // ===================================================

  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    aliases: [
      "rdl",
      "romanian dl",
      "barbell rdl",
      "dumbbell rdl",
      "romanian dead lift"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "hamstrings",
      "glutes",
      "lower_back",
      "core"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "erector_spinae",
      "forearm_flexors"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "barbell",
      "dumbbells"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "lengthened_hamstrings",
      label: "Hamstrings + Glutes"
    },
    substitutionGroup: "hip_hinge",
    substitutions: [
      "dumbbell_romanian_deadlift",
      "stiff_leg_deadlift",
      "single_leg_romanian_deadlift",
      "barbell_good_morning",
      "conventional_deadlift"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Push the hips backward while lowering the weight close to the legs, then extend the hips to return to standing.",
    instructions: [
      "Stand tall holding the weight.",
      "Soften the knees and push the hips backward.",
      "Lower until you feel a controlled hamstring stretch.",
      "Drive the hips forward to stand."
    ],
    cues: [
      "Keep the weight close to the body.",
      "Maintain a stable spine.",
      "Think hips back rather than squatting down."
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
    id: "dumbbell_romanian_deadlift",
    name: "Dumbbell Romanian Deadlift",
    aliases: [
      "dumbbell rdl",
      "db rdl",
      "dumbbell stiff leg deadlift",
      "dumbbell romanian deadlift"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "hamstrings",
      "glutes",
      "lower_back"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "erector_spinae",
      "forearm_flexors"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "dumbbells"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "lengthened_hamstrings",
      label: "Hamstrings + Glutes"
    },
    substitutionGroup: "hip_hinge",
    substitutions: [
      "romanian_deadlift",
      "stiff_leg_deadlift",
      "single_leg_romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Perform a Romanian deadlift with dumbbells held beside or in front of the legs.",
    instructions: [
      "Stand tall holding the dumbbells.",
      "Push the hips backward with soft knees.",
      "Lower the weights along the legs.",
      "Extend the hips to stand."
    ],
    cues: [
      "Keep the dumbbells close.",
      "Maintain tension in the hamstrings."
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
    id: "stiff_leg_deadlift",
    name: "Stiff-Leg Deadlift",
    aliases: [
      "stiff leg deadlift",
      "stiff-legged deadlift",
      "straight leg deadlift",
      "barbell stiff leg deadlift",
      "sldl"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "hamstrings",
      "glutes",
      "lower_back"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "erector_spinae",
      "forearm_flexors"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "lengthened_hamstrings",
      label: "Hamstrings"
    },
    substitutionGroup: "hip_hinge",
    substitutions: [
      "romanian_deadlift",
      "dumbbell_romanian_deadlift",
      "barbell_good_morning"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Hinge at the hips with relatively little knee bend to emphasize the hamstrings through a lengthened position.",
    instructions: [
      "Stand tall holding the bar.",
      "Maintain a small, relatively fixed knee bend.",
      "Push the hips backward as the bar lowers.",
      "Extend the hips to return to standing."
    ],
    cues: [
      "Do not lock the knees aggressively.",
      "Keep the bar close to the legs.",
      "Use a range that maintains spinal control."
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
    id: "single_leg_romanian_deadlift",
    name: "Single-Leg Romanian Deadlift",
    aliases: [
      "single leg rdl",
      "one leg rdl",
      "single leg dumbbell deadlift",
      "one leg romanian deadlift"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "functional",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "hamstrings",
      "glutes",
      "core"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "erector_spinae"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "bodyweight",
      "dumbbell",
      "dumbbells",
      "kettlebell"
    ],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "unilateral_posterior_chain",
      label: "Hamstrings + Glutes"
    },
    substitutionGroup: "unilateral_hip_hinge",
    substitutions: [
      "dumbbell_romanian_deadlift",
      "romanian_deadlift"
    ],
    laterality: "unilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 8,
      lower_body_strength: 9,
      athletic_performance: 9
    },
    summary:
      "Hinge on one leg while the opposite leg extends behind the body, then return to standing.",
    instructions: [
      "Stand on one leg with a slight knee bend.",
      "Push the hips backward as the free leg extends behind you.",
      "Keep the pelvis controlled.",
      "Drive through the standing hip to return."
    ],
    cues: [
      "Keep the hips square.",
      "Use support if balance limits the hamstring stimulus."
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
    id: "barbell_good_morning",
    name: "Barbell Good Morning",
    aliases: [
      "good morning",
      "good mornings",
      "barbell good mornings",
      "weighted good morning"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "hypertrophy",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "hamstrings",
      "glutes",
      "lower_back",
      "core"
    ],
    primaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "erector_spinae"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "barbell",
      "squat_rack"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "biceps_femoris",
      region: "posterior_chain",
      label: "Hamstrings + Glutes"
    },
    substitutionGroup: "hip_hinge",
    substitutions: [
      "romanian_deadlift",
      "stiff_leg_deadlift",
      "dumbbell_romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "barbell_back_rack",
    goals: {
      muscle_building: 8,
      strength: 8,
      lower_body_strength: 9,
      athletic_performance: 7
    },
    summary:
      "Hinge forward at the hips with a barbell across the upper back, then extend the hips to return upright.",
    instructions: [
      "Secure the bar across the upper back.",
      "Brace the torso and soften the knees.",
      "Push the hips backward while maintaining trunk control.",
      "Drive the hips forward to stand."
    ],
    cues: [
      "Keep the spine controlled.",
      "Do not turn the movement into a squat.",
      "Use conservative loading."
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
  // DEADLIFTS
  // ===================================================

  {
    id: "conventional_deadlift",
    name: "Conventional Deadlift",
    aliases: [
      "deadlift",
      "barbell deadlift",
      "conventional dl"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "free_weight"
    ],
    bodyParts: [
      "full_body",
      "lower_body",
      "glutes",
      "hamstrings",
      "back",
      "core",
      "forearms"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus",
      "erector_spinae"
    ],
    secondaryMuscles: [
      "latissimus_dorsi",
      "forearm_flexors",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "posterior_chain",
      label: "Posterior Chain"
    },
    substitutionGroup: "deadlift",
    substitutions: [
      "sumo_deadlift",
      "romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      strength: 10,
      muscle_building: 8,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Lift a bar from the floor by extending the hips and knees while maintaining a controlled trunk position.",
    instructions: [
      "Set the feet beneath the bar.",
      "Grip the bar and brace the trunk.",
      "Drive through the floor while extending the hips and knees.",
      "Stand tall, then return the bar to the floor under control."
    ],
    cues: [
      "Keep the bar close to the body.",
      "Avoid jerking the bar from the floor."
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
    id: "sumo_deadlift",
    name: "Sumo Deadlift",
    aliases: [
      "sumo barbell deadlift",
      "wide stance deadlift",
      "sumo dl"
    ],
    category: "strength",
    exerciseTypes: [
      "strength",
      "free_weight"
    ],
    bodyParts: [
      "lower_body",
      "glutes",
      "hamstrings",
      "quadriceps",
      "adductors",
      "back",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "adductor_magnus",
      "rectus_femoris"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "erector_spinae",
      "forearm_flexors"
    ],
    movementPatterns: [
      "hip_hinge"
    ],
    equipment: [
      "barbell"
    ],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "adductor_magnus",
      region: "wide_stance_posterior_chain",
      label: "Glutes + Adductors"
    },
    substitutionGroup: "deadlift",
    substitutions: [
      "conventional_deadlift",
      "romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "wide_stance_floor",
    goals: {
      strength: 10,
      muscle_building: 8,
      lower_body_strength: 10
    },
    summary:
      "Deadlift from a wide stance with the hands inside the legs, emphasizing the hips, adductors, and lower body.",
    instructions: [
      "Take a wide stance with the toes turned out comfortably.",
      "Grip the bar inside the legs.",
      "Brace the torso and drive through the floor.",
      "Stand tall and lower the bar under control."
    ],
    cues: [
      "Keep the knees tracking with the toes.",
      "Keep the bar close to the body."
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
  LEG_EXERCISES
};

export default LEG_EXERCISES;