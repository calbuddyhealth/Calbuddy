// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/triceps.js
// Version: 1.0.0
// Purpose:
//   Triceps-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves the existing triceps exercise IDs.
//   - Covers cable, free-weight, machine, bodyweight,
//     compound pressing, and overhead long-head variations.
//   - Uses existing anatomy and movement-pattern IDs.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, setup, and logging metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/triceps";

const TRICEPS_EXERCISES = Object.freeze([
  // ===================================================
  // CABLE PUSHDOWNS
  // ===================================================
  {
    id: "cable_triceps_pushdown",
    name: "Cable Triceps Pushdown",
    aliases: [
      "triceps pushdown",
      "tricep pushdown",
      "cable pushdown",
      "straight bar pushdown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "straight_bar_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "general",
      label: "Triceps"
    },
    substitutionGroup: "triceps_pushdown",
    substitutions: [
      "rope_triceps_pushdown",
      "reverse_grip_triceps_pushdown",
      "single_arm_cable_pushdown"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Extend the elbows to push the cable attachment downward while keeping the upper arms close to the torso.",
    instructions: [
      "Stand facing the cable with the elbows near the sides.",
      "Begin with the elbows flexed.",
      "Push the attachment downward by extending the elbows.",
      "Return under control."
    ],
    cues: [
      "Keep the upper arms mostly stationary.",
      "Avoid leaning heavily into the movement."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rope_triceps_pushdown",
    name: "Rope Triceps Pushdown",
    aliases: [
      "rope pushdown",
      "rope tricep pushdown",
      "rope pressdown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "general",
      label: "Triceps"
    },
    substitutionGroup: "triceps_pushdown",
    substitutions: [
      "cable_triceps_pushdown",
      "single_arm_cable_pushdown",
      "reverse_grip_triceps_pushdown"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Push a rope attachment downward and separate the rope ends slightly near lockout.",
    instructions: [
      "Attach a rope to a high cable.",
      "Keep the elbows near the torso.",
      "Extend the elbows and press the rope downward.",
      "Allow the rope ends to separate slightly at the bottom."
    ],
    cues: [
      "Keep the shoulders relaxed.",
      "Do not swing the torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_grip_triceps_pushdown",
    name: "Reverse-Grip Triceps Pushdown",
    aliases: [
      "underhand pushdown",
      "reverse grip pushdown",
      "supinated triceps pushdown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["forearm_flexors"],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "straight_bar_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "general",
      label: "Triceps"
    },
    substitutionGroup: "triceps_pushdown",
    substitutions: [
      "cable_triceps_pushdown",
      "rope_triceps_pushdown",
      "single_arm_cable_pushdown"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 8,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Perform a cable pushdown using an underhand grip while keeping the elbows close to the torso.",
    instructions: [
      "Grip the bar with palms facing upward.",
      "Keep the elbows near the sides.",
      "Extend the elbows downward.",
      "Return slowly."
    ],
    cues: [
      "Use a lighter load if wrist position becomes uncomfortable.",
      "Keep the elbows fixed."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_cable_pushdown",
    name: "Single-Arm Cable Pushdown",
    aliases: [
      "one arm triceps pushdown",
      "single arm tricep pushdown",
      "single handle pressdown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "general",
      label: "Triceps"
    },
    substitutionGroup: "triceps_pushdown",
    substitutions: [
      "rope_triceps_pushdown",
      "cable_triceps_pushdown"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Extend one elbow against cable resistance to train each triceps independently.",
    instructions: [
      "Attach a single handle to a high cable.",
      "Keep the working elbow near the side.",
      "Extend the arm downward.",
      "Return slowly before switching sides."
    ],
    cues: [
      "Keep the shoulder quiet.",
      "Avoid torso rotation."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // OVERHEAD / LONG-HEAD EMPHASIS
  // ===================================================
  {
    id: "overhead_triceps_extension",
    name: "Overhead Triceps Extension",
    aliases: [
      "overhead tricep extension",
      "dumbbell overhead triceps extension",
      "overhead cable triceps extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbell", "cable_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened_overhead",
      label: "Triceps - Long Head"
    },
    substitutionGroup: "overhead_triceps_extension",
    substitutions: [
      "rope_overhead_triceps_extension",
      "single_arm_overhead_cable_extension",
      "seated_dumbbell_overhead_triceps_extension",
      "lying_triceps_extension"
    ],
    laterality: "bilateral_or_unilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Extend the elbows from an overhead position while keeping the upper arms controlled.",
    instructions: [
      "Position the resistance overhead.",
      "Begin with the elbows flexed.",
      "Extend the elbows until the arms are nearly straight.",
      "Return under control."
    ],
    cues: [
      "Keep the ribs controlled.",
      "Avoid letting the elbows flare excessively."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rope_overhead_triceps_extension",
    name: "Rope Overhead Triceps Extension",
    aliases: [
      "overhead rope extension",
      "rope triceps extension",
      "cable overhead tricep extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened_overhead",
      label: "Triceps - Long Head"
    },
    substitutionGroup: "overhead_triceps_extension",
    substitutions: [
      "overhead_triceps_extension",
      "single_arm_overhead_cable_extension",
      "seated_dumbbell_overhead_triceps_extension"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Extend the elbows overhead using a rope attachment to train the triceps in a lengthened position.",
    instructions: [
      "Attach a rope to a cable.",
      "Face away from the stack and bring the rope overhead.",
      "Keep the upper arms controlled.",
      "Extend the elbows forward or upward."
    ],
    cues: [
      "Keep the ribs down.",
      "Avoid excessive elbow flare."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_overhead_cable_extension",
    name: "Single-Arm Overhead Cable Extension",
    aliases: [
      "one arm overhead triceps extension",
      "single arm overhead tricep cable",
      "unilateral overhead cable extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened_overhead",
      label: "Triceps - Long Head"
    },
    substitutionGroup: "overhead_triceps_extension",
    substitutions: [
      "rope_overhead_triceps_extension",
      "overhead_triceps_extension"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Extend one elbow overhead against cable resistance to train each triceps independently.",
    instructions: [
      "Set the cable so the working arm can move overhead comfortably.",
      "Keep the upper arm near the head.",
      "Extend the elbow.",
      "Return slowly before switching sides."
    ],
    cues: [
      "Avoid rotating the torso.",
      "Keep the shoulder stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "seated_dumbbell_overhead_triceps_extension",
    name: "Seated Dumbbell Overhead Triceps Extension",
    aliases: [
      "seated overhead triceps extension",
      "two hand dumbbell triceps extension",
      "seated dumbbell tricep extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened_overhead",
      label: "Triceps - Long Head"
    },
    substitutionGroup: "overhead_triceps_extension",
    substitutions: [
      "overhead_triceps_extension",
      "rope_overhead_triceps_extension",
      "single_arm_overhead_cable_extension"
    ],
    laterality: "bilateral",
    setup: "seated_bench",
    goals: {
      muscle_building: 9,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Lower a dumbbell behind the head from a seated overhead position, then extend the elbows.",
    instructions: [
      "Sit securely on a bench.",
      "Hold one dumbbell overhead with both hands.",
      "Bend the elbows to lower the dumbbell behind the head.",
      "Extend the elbows to return overhead."
    ],
    cues: [
      "Keep the upper arms controlled.",
      "Avoid excessive lower-back arching."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // LYING EXTENSIONS / SKULL CRUSHERS
  // ===================================================
  {
    id: "lying_triceps_extension",
    name: "Lying Triceps Extension",
    aliases: [
      "skull crusher",
      "skull crushers",
      "lying tricep extension",
      "ez bar skull crusher"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["ez_bar", "barbell", "bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened",
      label: "Triceps"
    },
    substitutionGroup: "lying_triceps_extension",
    substitutions: [
      "dumbbell_skull_crusher",
      "cable_skull_crusher",
      "overhead_triceps_extension"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 10,
      strength: 7,
      upper_body_strength: 7
    },
    summary:
      "Lower a bar toward the forehead or slightly behind the head by bending the elbows, then extend the arms.",
    instructions: [
      "Lie on a bench with the bar above the chest.",
      "Keep the upper arms relatively still.",
      "Bend the elbows to lower the bar toward or slightly behind the forehead.",
      "Extend the elbows to return."
    ],
    cues: [
      "Use a controlled load.",
      "Avoid letting the elbows flare excessively."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_skull_crusher",
    name: "Dumbbell Skull Crusher",
    aliases: [
      "dumbbell lying triceps extension",
      "db skull crusher",
      "dumbbell tricep extension lying"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbells", "bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened",
      label: "Triceps"
    },
    substitutionGroup: "lying_triceps_extension",
    substitutions: [
      "lying_triceps_extension",
      "cable_skull_crusher"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Lower dumbbells beside or behind the head by bending the elbows, then extend them back upward.",
    instructions: [
      "Lie on a flat bench holding dumbbells above the chest.",
      "Keep the upper arms controlled.",
      "Bend the elbows to lower the dumbbells.",
      "Extend the elbows to return."
    ],
    cues: [
      "Keep the wrists stable.",
      "Use a comfortable elbow path."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cable_skull_crusher",
    name: "Cable Skull Crusher",
    aliases: [
      "cable lying triceps extension",
      "cable skull crushers",
      "lying cable triceps extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "bench", "straight_bar_attachment", "rope_attachment"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "lengthened_continuous_tension",
      label: "Triceps"
    },
    substitutionGroup: "lying_triceps_extension",
    substitutions: [
      "lying_triceps_extension",
      "dumbbell_skull_crusher"
    ],
    laterality: "bilateral",
    setup: "bench_cable",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Perform a lying elbow extension against cable resistance for continuous triceps tension.",
    instructions: [
      "Position the bench near the cable.",
      "Bring the attachment above or behind the head.",
      "Bend the elbows under control.",
      "Extend the elbows to finish."
    ],
    cues: [
      "Keep cable tension throughout the movement.",
      "Keep the shoulders stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // COMPOUND PRESSING
  // ===================================================
  {
    id: "close_grip_bench_press",
    name: "Close-Grip Bench Press",
    aliases: [
      "close grip bench",
      "triceps bench press",
      "narrow grip bench press"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["triceps", "chest", "shoulders", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["pectoralis_major", "anterior_deltoid"],
    movementPatterns: ["horizontal_push", "elbow_extension"],
    equipment: ["barbell", "bench", "rack"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "compound",
      label: "Triceps + Chest"
    },
    substitutionGroup: "compound_triceps_press",
    substitutions: [
      "smith_machine_close_grip_bench_press",
      "dip",
      "bench_dip"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 10,
      upper_body_strength: 10
    },
    summary:
      "Press a barbell from a flat bench using a narrower grip to increase triceps involvement.",
    instructions: [
      "Lie on a flat bench and grip the bar slightly narrower than a standard bench press.",
      "Lower the bar toward the lower chest.",
      "Keep the elbows controlled.",
      "Press the bar upward."
    ],
    cues: [
      "Do not use an excessively narrow grip.",
      "Keep the wrists stacked over the forearms."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "smith_machine_close_grip_bench_press",
    name: "Smith Machine Close-Grip Bench Press",
    aliases: [
      "smith close grip bench",
      "smith triceps press",
      "close grip smith press"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["triceps", "chest", "shoulders", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["pectoralis_major", "anterior_deltoid"],
    movementPatterns: ["horizontal_push", "elbow_extension"],
    equipment: ["smith_machine", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "compound",
      label: "Triceps + Chest"
    },
    substitutionGroup: "compound_triceps_press",
    substitutions: [
      "close_grip_bench_press",
      "dip",
      "bench_dip"
    ],
    laterality: "bilateral",
    setup: "flat_bench",
    goals: {
      muscle_building: 9,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Perform a close-grip press on a Smith machine to emphasize the triceps with a guided bar path.",
    instructions: [
      "Position the bench under the Smith bar.",
      "Use a moderately narrow grip.",
      "Lower toward the lower chest.",
      "Press upward and re-rack securely."
    ],
    cues: [
      "Align the bench carefully with the fixed bar path.",
      "Avoid excessive wrist bend."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // DIPS / BODYWEIGHT
  // ===================================================
  {
    id: "dip",
    name: "Triceps Dip",
    aliases: [
      "dip",
      "parallel bar dip",
      "tricep dip",
      "triceps dips"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["triceps", "chest", "shoulders", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["pectoralis_major", "anterior_deltoid"],
    movementPatterns: ["vertical_push", "elbow_extension"],
    equipment: ["dip_bars", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "compound",
      label: "Triceps"
    },
    substitutionGroup: "compound_triceps_press",
    substitutions: [
      "close_grip_bench_press",
      "assisted_triceps_dip",
      "bench_dip"
    ],
    laterality: "bilateral",
    setup: "parallel_bars",
    goals: {
      muscle_building: 9,
      strength: 10,
      upper_body_strength: 10,
      general_fitness: 8
    },
    summary:
      "Lower and press the body between parallel bars while maintaining a relatively upright torso to emphasize the triceps.",
    instructions: [
      "Support the body on parallel bars.",
      "Keep the torso relatively upright.",
      "Lower under control by bending the elbows.",
      "Press back to the top."
    ],
    cues: [
      "Avoid excessive shoulder depth.",
      "Keep the elbows controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "assisted_triceps_dip",
    name: "Assisted Triceps Dip",
    aliases: [
      "assisted dip",
      "machine assisted dip",
      "assisted tricep dip"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength", "calisthenics"],
    bodyParts: ["triceps", "chest", "shoulders", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["pectoralis_major", "anterior_deltoid"],
    movementPatterns: ["vertical_push", "elbow_extension"],
    equipment: ["assisted_dip_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "compound",
      label: "Triceps"
    },
    substitutionGroup: "compound_triceps_press",
    substitutions: [
      "dip",
      "bench_dip",
      "close_grip_bench_press"
    ],
    laterality: "bilateral",
    setup: "assisted_machine",
    goals: {
      muscle_building: 8,
      strength: 8,
      upper_body_strength: 9,
      general_fitness: 8
    },
    summary:
      "Perform a dip with machine assistance to reduce the effective bodyweight load.",
    instructions: [
      "Set the assistance level.",
      "Take a stable position on the machine.",
      "Lower under control.",
      "Press back to the top."
    ],
    cues: [
      "Use only enough assistance to maintain good form.",
      "Keep the shoulders controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "bench_dip",
    name: "Bench Dip",
    aliases: [
      "bench tricep dip",
      "bench triceps dip",
      "chair dip"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["triceps", "shoulders", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: ["anterior_deltoid", "pectoralis_major"],
    movementPatterns: ["elbow_extension"],
    equipment: ["bench", "bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "compound",
      label: "Triceps"
    },
    substitutionGroup: "compound_triceps_press",
    substitutions: [
      "assisted_triceps_dip",
      "dip",
      "close_grip_bench_press"
    ],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 7,
      strength: 6,
      upper_body_strength: 7,
      general_fitness: 7
    },
    summary:
      "Lower and press the body using the arms while the hands remain supported on a bench.",
    instructions: [
      "Place the hands securely on the bench.",
      "Keep the hips close to the bench.",
      "Lower by bending the elbows.",
      "Press back up."
    ],
    cues: [
      "Use a comfortable shoulder range.",
      "Avoid dropping excessively low."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // KICKBACK / ISOLATION
  // ===================================================
  {
    id: "dumbbell_triceps_kickback",
    name: "Dumbbell Triceps Kickback",
    aliases: [
      "tricep kickback",
      "dumbbell kickback",
      "db triceps kickback"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "shortened_position",
      label: "Triceps - Shortened"
    },
    substitutionGroup: "triceps_kickback",
    substitutions: [
      "cable_triceps_kickback",
      "single_arm_cable_pushdown"
    ],
    laterality: "unilateral",
    setup: "bench_supported_or_hinged",
    goals: {
      muscle_building: 7,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Extend one elbow behind the body while holding the upper arm stable.",
    instructions: [
      "Support the torso on a bench or hinge forward.",
      "Position the upper arm near the torso.",
      "Extend the elbow until the arm is straight.",
      "Return slowly."
    ],
    cues: [
      "Keep the upper arm fixed.",
      "Avoid swinging the dumbbell."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cable_triceps_kickback",
    name: "Cable Triceps Kickback",
    aliases: [
      "cable kickback",
      "single arm cable triceps kickback",
      "cable tricep kickback"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "triceps_brachii",
      region: "shortened_position",
      label: "Triceps - Shortened"
    },
    substitutionGroup: "triceps_kickback",
    substitutions: [
      "dumbbell_triceps_kickback",
      "single_arm_cable_pushdown"
    ],
    laterality: "unilateral",
    setup: "standing_or_hinged_cable",
    goals: {
      muscle_building: 8,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Extend one elbow behind the torso against cable resistance for continuous tension.",
    instructions: [
      "Set a low or mid cable with a single handle.",
      "Hinge or stand in a stable position.",
      "Keep the upper arm still.",
      "Extend the elbow backward."
    ],
    cues: [
      "Maintain cable tension.",
      "Avoid shoulder movement."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  TRICEPS_EXERCISES
};

export default TRICEPS_EXERCISES;