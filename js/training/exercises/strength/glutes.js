// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/glutes.js
// Version: 1.0.0
// Purpose:
//   Glute-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves existing glute exercise IDs used by plans.
//   - Focuses on glute-max extension work plus glute med/min
//     abduction and stabilization work.
//   - Avoids duplicating compound leg exercises already housed
//     in strength/legs.js.
//   - Uses only movement-pattern IDs currently available in
//     movement-patterns.js.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, setup, and logging metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/glutes";

const GLUTE_EXERCISES = Object.freeze([
  // ===================================================
  // HIP THRUST / GLUTE BRIDGE
  // ===================================================
  {
    id: "barbell_hip_thrust",
    name: "Barbell Hip Thrust",
    aliases: [
      "hip thrust",
      "barbell glute thrust",
      "barbell hip thrusts"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "machine_hip_thrust",
      "smith_machine_hip_thrust",
      "dumbbell_hip_thrust",
      "glute_bridge"
    ],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      glute_development: 10
    },
    summary:
      "Drive the hips upward against a barbell from a supported upper-back position, then lower under control.",
    instructions: [
      "Support the upper back on a stable bench.",
      "Position the bar securely across the hips with padding as needed.",
      "Drive through the feet and extend the hips.",
      "Lower the hips under control."
    ],
    cues: [
      "Finish with the glutes rather than overextending the lower back.",
      "Keep the feet planted.",
      "Keep the chin and ribs controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_hip_thrust",
    name: "Machine Hip Thrust",
    aliases: [
      "hip thrust machine",
      "glute drive machine",
      "machine glute thrust"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["hip_thrust_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "barbell_hip_thrust",
      "smith_machine_hip_thrust",
      "glute_bridge"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      glute_development: 10
    },
    summary:
      "Extend the hips against a dedicated hip-thrust machine while the torso remains supported.",
    instructions: [
      "Adjust the seat, belt, or pad to fit securely across the hips.",
      "Plant the feet firmly.",
      "Drive the hips upward.",
      "Lower under control."
    ],
    cues: [
      "Keep the pelvis controlled.",
      "Avoid excessive lower-back extension.",
      "Pause briefly at full hip extension."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "smith_machine_hip_thrust",
    name: "Smith Machine Hip Thrust",
    aliases: [
      "smith hip thrust",
      "smith machine glute thrust",
      "smith thrust"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["smith_machine", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "barbell_hip_thrust",
      "machine_hip_thrust",
      "dumbbell_hip_thrust"
    ],
    laterality: "bilateral",
    setup: "bench_supported_smith_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      glute_development: 10
    },
    summary:
      "Perform a hip thrust beneath a Smith-machine bar for a guided and stable loading path.",
    instructions: [
      "Position a bench securely behind the Smith bar.",
      "Place the bar across the hips with padding.",
      "Drive the hips upward.",
      "Lower under control and re-rack securely."
    ],
    cues: [
      "Align the bench and bar carefully.",
      "Keep the ribs down.",
      "Squeeze the glutes at the top."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_hip_thrust",
    name: "Dumbbell Hip Thrust",
    aliases: [
      "db hip thrust",
      "dumbbell glute thrust"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "barbell_hip_thrust",
      "glute_bridge",
      "machine_hip_thrust"
    ],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 9,
      strength: 7,
      lower_body_strength: 8,
      glute_development: 10
    },
    summary:
      "Perform a hip thrust with a dumbbell positioned securely across the hips.",
    instructions: [
      "Support the upper back on a bench.",
      "Place a dumbbell securely across the hips.",
      "Drive the hips upward.",
      "Lower under control."
    ],
    cues: [
      "Keep the dumbbell stable.",
      "Avoid overextending the lower back."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "glute_bridge",
    name: "Glute Bridge",
    aliases: [
      "bodyweight glute bridge",
      "floor glute bridge",
      "hip bridge"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "weighted_glute_bridge",
      "dumbbell_hip_thrust",
      "barbell_hip_thrust"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      muscle_building: 6,
      lower_body_strength: 6,
      glute_development: 8,
      general_fitness: 8
    },
    summary:
      "From the floor, drive the hips upward by squeezing the glutes, then lower with control.",
    instructions: [
      "Lie on the back with the knees bent and feet planted.",
      "Brace the trunk lightly.",
      "Drive the hips upward.",
      "Lower to the floor under control."
    ],
    cues: [
      "Avoid pushing primarily through the lower back.",
      "Keep the knees aligned with the feet."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "weighted_glute_bridge",
    name: "Weighted Glute Bridge",
    aliases: [
      "barbell glute bridge",
      "loaded glute bridge",
      "weighted hip bridge"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "dumbbell", "weight_plate", "floor"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "hip_thrust",
    substitutions: [
      "glute_bridge",
      "dumbbell_hip_thrust",
      "barbell_hip_thrust"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      muscle_building: 9,
      strength: 7,
      lower_body_strength: 8,
      glute_development: 10
    },
    summary:
      "Perform a floor glute bridge with external resistance positioned securely across the hips.",
    instructions: [
      "Lie on the floor with the knees bent.",
      "Position the load securely across the hips.",
      "Drive the hips upward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the feet planted.",
      "Finish with glute contraction instead of lumbar extension."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_leg_glute_bridge",
    name: "Single-Leg Glute Bridge",
    aliases: [
      "one leg glute bridge",
      "single leg hip bridge",
      "unilateral glute bridge"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["glutes", "hips", "hamstrings", "core", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "gluteus_medius",
      "transversus_abdominis"
    ],
    movementPatterns: ["hip_hinge", "anti_rotation"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "unilateral_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "unilateral_glute_extension",
    substitutions: [
      "single_leg_hip_thrust",
      "cable_glute_kickback"
    ],
    laterality: "unilateral",
    setup: "floor",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      glute_development: 9,
      core_strength: 6
    },
    summary:
      "Drive the hips upward using one planted leg while keeping the pelvis level.",
    instructions: [
      "Lie on the back with one foot planted.",
      "Extend or lift the opposite leg.",
      "Drive the hips upward through the planted foot.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis level.",
      "Avoid rotating toward the working side."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_leg_hip_thrust",
    name: "Single-Leg Hip Thrust",
    aliases: [
      "one leg hip thrust",
      "single leg glute thrust",
      "unilateral hip thrust"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["glutes", "hips", "hamstrings", "core", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "gluteus_medius",
      "biceps_femoris",
      "transversus_abdominis"
    ],
    movementPatterns: ["hip_hinge", "anti_rotation"],
    equipment: ["bench", "bodyweight", "dumbbell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "unilateral_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "unilateral_glute_extension",
    substitutions: [
      "single_leg_glute_bridge",
      "cable_glute_kickback"
    ],
    laterality: "unilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 8,
      glute_development: 10,
      core_strength: 6
    },
    summary:
      "Perform a hip thrust using one working leg while keeping the pelvis controlled.",
    instructions: [
      "Support the upper back on a bench.",
      "Plant one foot and lift the opposite leg.",
      "Drive the hips upward through the working side.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis level.",
      "Avoid twisting at the top."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // GLUTE KICKBACK / HIP EXTENSION ACCESSORIES
  // ===================================================
  {
    id: "cable_glute_kickback",
    name: "Cable Glute Kickback",
    aliases: [
      "cable kickback",
      "glute kickback",
      "cable hip extension",
      "cable donkey kick"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["glutes", "hips", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["cable_machine", "ankle_strap"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "hip_extension_isolation",
      label: "Glute Max"
    },
    substitutionGroup: "glute_kickback",
    substitutions: [
      "machine_glute_kickback",
      "banded_glute_kickback",
      "single_leg_hip_thrust"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 5,
      lower_body_strength: 6,
      glute_development: 10
    },
    summary:
      "Extend one leg backward against cable resistance to isolate the gluteus maximus.",
    instructions: [
      "Attach an ankle strap to a low cable.",
      "Brace against the machine for balance.",
      "Drive the working leg backward from the hip.",
      "Return slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis square.",
      "Avoid excessive lower-back arching.",
      "Move through the hip rather than swinging the leg."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_glute_kickback",
    name: "Machine Glute Kickback",
    aliases: [
      "glute kickback machine",
      "glute extension machine",
      "donkey kick machine"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "hips", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris"],
    movementPatterns: ["hip_hinge"],
    equipment: ["glute_kickback_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "hip_extension_isolation",
      label: "Glute Max"
    },
    substitutionGroup: "glute_kickback",
    substitutions: [
      "cable_glute_kickback",
      "banded_glute_kickback"
    ],
    laterality: "unilateral",
    setup: "machine",
    goals: {
      muscle_building: 9,
      strength: 6,
      lower_body_strength: 6,
      glute_development: 10
    },
    summary:
      "Drive one leg backward against a glute-kickback machine to isolate hip extension.",
    instructions: [
      "Adjust the machine to fit the working leg.",
      "Brace the torso against the supports.",
      "Drive the leg backward.",
      "Return under control before switching sides."
    ],
    cues: [
      "Keep the pelvis stable.",
      "Avoid rotating the torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "banded_glute_kickback",
    name: "Banded Glute Kickback",
    aliases: [
      "band kickback",
      "resistance band glute kickback",
      "banded hip extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "resistance_band"],
    bodyParts: ["glutes", "hips", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris"],
    movementPatterns: ["hip_hinge"],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "hip_extension_isolation",
      label: "Glute Max"
    },
    substitutionGroup: "glute_kickback",
    substitutions: [
      "cable_glute_kickback",
      "machine_glute_kickback"
    ],
    laterality: "unilateral",
    setup: "standing_band",
    goals: {
      muscle_building: 7,
      strength: 4,
      lower_body_strength: 5,
      glute_development: 8,
      general_fitness: 7
    },
    summary:
      "Extend one leg backward against band resistance to train the gluteus maximus.",
    instructions: [
      "Secure the band around the working ankle or foot.",
      "Hold a stable support if needed.",
      "Drive the leg backward.",
      "Return under control."
    ],
    cues: [
      "Do not arch the lower back.",
      "Keep the pelvis facing forward."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "quadruped_hip_extension",
    name: "Quadruped Hip Extension",
    aliases: [
      "donkey kick",
      "bodyweight donkey kick",
      "quadruped glute kickback"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["glutes", "hips", "core", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: [
      "biceps_femoris",
      "transversus_abdominis"
    ],
    movementPatterns: ["hip_hinge", "anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "hip_extension_isolation",
      label: "Glute Max"
    },
    substitutionGroup: "glute_kickback",
    substitutions: [
      "banded_glute_kickback",
      "cable_glute_kickback"
    ],
    laterality: "unilateral",
    setup: "quadruped_floor",
    goals: {
      muscle_building: 6,
      strength: 5,
      glute_development: 8,
      general_fitness: 8
    },
    summary:
      "Extend one hip from a hands-and-knees position while keeping the trunk stable.",
    instructions: [
      "Begin on hands and knees.",
      "Brace the trunk.",
      "Drive one leg backward and upward from the hip.",
      "Return under control before switching sides."
    ],
    cues: [
      "Keep the pelvis level.",
      "Avoid arching the lower back."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // HIP ABDUCTION / GLUTE MED-MIN
  // ===================================================
  {
    id: "hip_abduction_machine",
    name: "Hip Abduction Machine",
    aliases: [
      "abductor machine",
      "hip abductor machine",
      "outer thigh machine",
      "seated hip abduction"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction"],
    equipment: ["hip_abduction_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_glute",
      label: "Side Glutes"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "cable_hip_abduction",
      "banded_lateral_walk",
      "side_lying_hip_abduction"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 8,
      glute_development: 9,
      lower_body_strength: 5
    },
    summary:
      "Press the legs outward against machine resistance, then return them inward under control.",
    instructions: [
      "Sit securely in the machine.",
      "Place the legs against the pads.",
      "Press the knees outward.",
      "Return slowly."
    ],
    cues: [
      "Avoid bouncing the weight.",
      "Keep the movement controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cable_hip_abduction",
    name: "Cable Hip Abduction",
    aliases: [
      "standing cable hip abduction",
      "cable leg abduction",
      "cable side leg raise"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction"],
    equipment: ["cable_machine", "ankle_strap"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_glute",
      label: "Side Glutes"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "hip_abduction_machine",
      "side_lying_hip_abduction",
      "banded_lateral_walk"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      glute_development: 10,
      lower_body_strength: 6
    },
    summary:
      "Move one leg outward against cable resistance to isolate the hip abductors.",
    instructions: [
      "Attach an ankle strap to a low cable.",
      "Stand side-on to the machine.",
      "Move the outside leg away from the body.",
      "Return slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis level.",
      "Avoid leaning excessively away from the cable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "side_lying_hip_abduction",
    name: "Side-Lying Hip Abduction",
    aliases: [
      "side lying leg raise",
      "side leg raise",
      "lying hip abduction"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction"],
    equipment: ["bodyweight", "resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_glute",
      label: "Side Glutes"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "cable_hip_abduction",
      "hip_abduction_machine",
      "banded_lateral_walk"
    ],
    laterality: "unilateral",
    setup: "side_lying_floor",
    goals: {
      muscle_building: 6,
      glute_development: 8,
      lower_body_strength: 5,
      general_fitness: 8
    },
    summary:
      "Raise the upper leg away from the body while lying on the side to train the hip abductors.",
    instructions: [
      "Lie on one side with the body aligned.",
      "Keep the upper leg relatively straight.",
      "Raise the upper leg away from the lower leg.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the pelvis stacked.",
      "Avoid rolling backward."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "banded_lateral_walk",
    name: "Banded Lateral Walk",
    aliases: [
      "lateral band walk",
      "monster walk",
      "side band walk",
      "banded side steps"
    ],
    category: "strength",
    exerciseTypes: ["strength", "functional", "resistance_band"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction", "walking"],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_glute",
      label: "Side Glutes"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "hip_abduction_machine",
      "cable_hip_abduction",
      "side_lying_hip_abduction"
    ],
    laterality: "bilateral_alternating",
    setup: "standing_band",
    goals: {
      glute_development: 9,
      lower_body_strength: 6,
      athletic_performance: 8,
      general_fitness: 8,
      running: 7
    },
    summary:
      "Step sideways against band resistance while maintaining hip and knee control.",
    instructions: [
      "Place a resistance band around the thighs, knees, or ankles.",
      "Take a slight athletic stance.",
      "Step laterally while maintaining band tension.",
      "Continue for the planned reps or distance in both directions."
    ],
    cues: [
      "Keep the knees from collapsing inward.",
      "Keep tension on the band throughout the set."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "distance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "banded_clamshell",
    name: "Banded Clamshell",
    aliases: [
      "clamshell",
      "band clamshell",
      "clam shell exercise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "resistance_band"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: ["gluteus_medius"],
    secondaryMuscles: [
      "gluteus_minimus",
      "tensor_fasciae_latae"
    ],
    movementPatterns: ["hip_abduction"],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_glute",
      label: "Side Glutes"
    },
    substitutionGroup: "hip_abduction",
    substitutions: [
      "side_lying_hip_abduction",
      "banded_lateral_walk",
      "cable_hip_abduction"
    ],
    laterality: "unilateral",
    setup: "side_lying_floor",
    goals: {
      glute_development: 8,
      lower_body_strength: 5,
      general_fitness: 8,
      recovery: 7
    },
    summary:
      "Open the top knee against band resistance while keeping the feet together and pelvis stacked.",
    instructions: [
      "Lie on one side with the hips and knees bent.",
      "Place the band above the knees.",
      "Keep the feet together.",
      "Open the top knee, then return slowly."
    ],
    cues: [
      "Do not roll the pelvis backward.",
      "Use a controlled range."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BODYWEIGHT GLUTE FINISHERS
  // ===================================================
  {
    id: "frog_pump",
    name: "Frog Pump",
    aliases: [
      "frog pumps",
      "frog glute bridge"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "calisthenics"],
    bodyParts: ["glutes", "hips", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["gluteus_medius"],
    movementPatterns: ["hip_hinge"],
    equipment: ["bodyweight", "dumbbell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "shortened_hip_extension",
      label: "Glute Max"
    },
    substitutionGroup: "glute_bridge_finisher",
    substitutions: [
      "glute_bridge",
      "weighted_glute_bridge"
    ],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      muscle_building: 7,
      glute_development: 9,
      general_fitness: 7
    },
    summary:
      "Perform repeated hip extensions from the floor with the soles of the feet together and knees opened outward.",
    instructions: [
      "Lie on the back and bring the soles of the feet together.",
      "Let the knees open outward comfortably.",
      "Drive the hips upward.",
      "Lower under control and repeat."
    ],
    cues: [
      "Focus on glute contraction.",
      "Avoid excessive lower-back arching."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  GLUTE_EXERCISES
};

export default GLUTE_EXERCISES;
