// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/calves.js
// Version: 1.0.0
// Purpose:
//   Calf and lower-leg strength/hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Uses muscle IDs from anatomy/muscles.js.
//   - Uses movement-pattern IDs from movement-patterns.js.
//   - Separates straight-knee calf work, bent-knee soleus
//     work, unilateral work, and tibialis training.
//   - Includes gym, home, machine, free-weight, and
//     bodyweight substitutions.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/calves";

const CALF_EXERCISES = Object.freeze([
  // ===================================================
  // STANDING / STRAIGHT-KNEE CALF RAISES
  // ===================================================
  {
    id: "standing_calf_raise",
    name: "Standing Calf Raise",
    aliases: [
      "calf raise",
      "standing heel raise",
      "bodyweight calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "machine_standing_calf_raise",
      "smith_machine_calf_raise",
      "dumbbell_standing_calf_raise",
      "single_leg_calf_raise"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 7,
      strength: 6,
      lower_body_strength: 6,
      calf_development: 8,
      general_fitness: 8
    },
    summary:
      "Raise the heels by plantarflexing the ankles while keeping the knees relatively straight.",
    instructions: [
      "Stand tall with the feet around hip-width apart.",
      "Keep the knees straight without aggressively locking them.",
      "Rise onto the balls of the feet as high as comfortably possible.",
      "Lower the heels under control."
    ],
    cues: [
      "Move through the ankles rather than bouncing.",
      "Pause briefly near the top.",
      "Control the lowering phase."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_standing_calf_raise",
    name: "Machine Standing Calf Raise",
    aliases: [
      "standing calf raise machine",
      "standing calf machine",
      "machine calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["standing_calf_raise_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "standing_calf_raise",
      "smith_machine_calf_raise",
      "leg_press_calf_raise"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 7,
      calf_development: 10
    },
    summary:
      "Perform a loaded standing calf raise using a dedicated machine.",
    instructions: [
      "Adjust the machine so the shoulder pads or supports fit securely.",
      "Place the balls of the feet on the platform.",
      "Raise the heels as high as comfortably possible.",
      "Lower under control through a comfortable range."
    ],
    cues: [
      "Keep the knees relatively straight.",
      "Avoid bouncing out of the bottom.",
      "Control the full repetition."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "smith_machine_calf_raise",
    name: "Smith Machine Calf Raise",
    aliases: [
      "smith calf raise",
      "smith standing calf raise",
      "smith machine standing calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["smith_machine", "calf_block"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "machine_standing_calf_raise",
      "dumbbell_standing_calf_raise",
      "standing_calf_raise"
    ],
    laterality: "bilateral",
    setup: "smith_machine",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 7,
      calf_development: 10
    },
    summary:
      "Perform standing calf raises beneath a Smith-machine bar for guided loading.",
    instructions: [
      "Position the bar securely across the upper back.",
      "Place the balls of the feet on a stable platform if additional range is desired.",
      "Raise the heels by pressing through the forefoot.",
      "Lower slowly."
    ],
    cues: [
      "Keep the body aligned beneath the bar.",
      "Do not bounce.",
      "Use a controlled stretch at the bottom."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_standing_calf_raise",
    name: "Dumbbell Standing Calf Raise",
    aliases: [
      "dumbbell calf raise",
      "db calf raise",
      "weighted standing calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["dumbbell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "standing_calf_raise",
      "machine_standing_calf_raise",
      "single_leg_calf_raise"
    ],
    laterality: "bilateral",
    setup: "standing_free_weight",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 6,
      calf_development: 9
    },
    summary:
      "Perform standing calf raises while holding dumbbells for additional resistance.",
    instructions: [
      "Hold the dumbbells securely at the sides.",
      "Stand tall with the feet stable.",
      "Raise the heels as high as comfortably possible.",
      "Lower slowly."
    ],
    cues: [
      "Keep the torso upright.",
      "Avoid using momentum.",
      "Maintain even pressure through both feet."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "barbell_standing_calf_raise",
    name: "Barbell Standing Calf Raise",
    aliases: [
      "barbell calf raise",
      "barbell heel raise",
      "standing barbell calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["barbell", "rack"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "smith_machine_calf_raise",
      "machine_standing_calf_raise",
      "dumbbell_standing_calf_raise"
    ],
    laterality: "bilateral",
    setup: "standing_free_weight",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 7,
      calf_development: 9
    },
    summary:
      "Perform standing calf raises with a barbell supported across the upper back.",
    instructions: [
      "Unrack the bar securely as for a standing squat position.",
      "Establish a stable stance.",
      "Raise the heels while keeping the knees relatively straight.",
      "Lower under control."
    ],
    cues: [
      "Prioritize balance and control.",
      "Avoid excessive forward or backward sway.",
      "Use a rack and appropriate safety setup."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // SEATED / BENT-KNEE SOLEUS EMPHASIS
  // ===================================================
  {
    id: "seated_calf_raise",
    name: "Seated Calf Raise",
    aliases: [
      "seated heel raise",
      "seated calf machine",
      "seated calf raises"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["soleus"],
    secondaryMuscles: ["gastrocnemius"],
    movementPatterns: ["calf_raise"],
    equipment: ["seated_calf_raise_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "soleus",
      region: "deep_calf",
      label: "Soleus"
    },
    substitutionGroup: "seated_calf_raise",
    substitutions: [
      "dumbbell_seated_calf_raise",
      "smith_machine_seated_calf_raise"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 7,
      lower_body_strength: 7,
      calf_development: 10
    },
    summary:
      "Perform plantarflexion with the knees bent to emphasize the soleus.",
    instructions: [
      "Sit in the machine with the knees bent and pads secured over the thighs.",
      "Place the balls of the feet on the platform.",
      "Raise the heels.",
      "Lower under control."
    ],
    cues: [
      "Keep the knees in position beneath the pads.",
      "Use a controlled stretch at the bottom.",
      "Avoid bouncing."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_seated_calf_raise",
    name: "Dumbbell Seated Calf Raise",
    aliases: [
      "seated dumbbell calf raise",
      "db seated calf raise",
      "dumbbell soleus raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["soleus"],
    secondaryMuscles: ["gastrocnemius"],
    movementPatterns: ["calf_raise"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "soleus",
      region: "deep_calf",
      label: "Soleus"
    },
    substitutionGroup: "seated_calf_raise",
    substitutions: [
      "seated_calf_raise",
      "smith_machine_seated_calf_raise"
    ],
    laterality: "bilateral",
    setup: "seated_free_weight",
    goals: {
      muscle_building: 8,
      strength: 6,
      lower_body_strength: 6,
      calf_development: 9
    },
    summary:
      "Perform seated calf raises with dumbbells resting securely above the knees.",
    instructions: [
      "Sit on a bench with the knees bent.",
      "Place dumbbells securely on the lower thighs.",
      "Raise the heels.",
      "Lower under control."
    ],
    cues: [
      "Keep the feet stable.",
      "Do not bounce the dumbbells on the thighs.",
      "Use a controlled range."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "smith_machine_seated_calf_raise",
    name: "Smith Machine Seated Calf Raise",
    aliases: [
      "smith seated calf raise",
      "smith soleus raise",
      "seated smith calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["soleus"],
    secondaryMuscles: ["gastrocnemius"],
    movementPatterns: ["calf_raise"],
    equipment: ["smith_machine", "bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "soleus",
      region: "deep_calf",
      label: "Soleus"
    },
    substitutionGroup: "seated_calf_raise",
    substitutions: [
      "seated_calf_raise",
      "dumbbell_seated_calf_raise"
    ],
    laterality: "bilateral",
    setup: "seated_smith_machine",
    goals: {
      muscle_building: 9,
      strength: 7,
      lower_body_strength: 6,
      calf_development: 9
    },
    summary:
      "Use a Smith-machine bar across the thighs while seated to load bent-knee calf raises.",
    instructions: [
      "Position a bench beneath the Smith machine.",
      "Place padding between the bar and thighs.",
      "Set the feet securely beneath the knees.",
      "Raise and lower the heels under control."
    ],
    cues: [
      "Set the safety stops appropriately.",
      "Keep the load positioned securely.",
      "Use smooth repetitions."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // LEG PRESS CALF WORK
  // ===================================================
  {
    id: "leg_press_calf_raise",
    name: "Leg Press Calf Raise",
    aliases: [
      "calf press",
      "calf press on leg press",
      "leg press calf press",
      "leg press calf extension"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["leg_press_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "machine_standing_calf_raise",
      "smith_machine_calf_raise",
      "standing_calf_raise"
    ],
    laterality: "bilateral",
    setup: "leg_press_machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 7,
      calf_development: 10
    },
    summary:
      "Press the leg-press platform through ankle plantarflexion while the knees remain relatively fixed.",
    instructions: [
      "Set up securely in the leg press.",
      "Place the balls of the feet on the lower portion of the platform.",
      "Keep the knees relatively fixed.",
      "Press through the forefoot to raise the heels, then return under control."
    ],
    cues: [
      "Do not allow the feet to slip from the platform.",
      "Use a controlled range.",
      "Avoid locking or repeatedly flexing the knees."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // UNILATERAL CALF WORK
  // ===================================================
  {
    id: "single_leg_calf_raise",
    name: "Single-Leg Calf Raise",
    aliases: [
      "one leg calf raise",
      "single leg heel raise",
      "unilateral calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus", "peroneals"],
    movementPatterns: ["calf_raise", "balance"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "unilateral_calf",
      label: "Calves"
    },
    substitutionGroup: "single_leg_calf_raise",
    substitutions: [
      "dumbbell_single_leg_calf_raise",
      "standing_calf_raise"
    ],
    laterality: "unilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 7,
      calf_development: 9,
      balance: 7
    },
    summary:
      "Perform a calf raise using one leg at a time for unilateral calf strength and control.",
    instructions: [
      "Stand on one leg and use a stable support for balance if needed.",
      "Raise the heel as high as comfortably possible.",
      "Lower slowly.",
      "Complete the planned repetitions before switching sides."
    ],
    cues: [
      "Keep the ankle aligned.",
      "Avoid rolling excessively toward the inside or outside of the foot.",
      "Use support for balance rather than momentum."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_single_leg_calf_raise",
    name: "Dumbbell Single-Leg Calf Raise",
    aliases: [
      "single leg dumbbell calf raise",
      "db single leg calf raise",
      "weighted one leg calf raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus", "peroneals"],
    movementPatterns: ["calf_raise", "balance"],
    equipment: ["dumbbell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "unilateral_calf",
      label: "Calves"
    },
    substitutionGroup: "single_leg_calf_raise",
    substitutions: [
      "single_leg_calf_raise",
      "dumbbell_standing_calf_raise"
    ],
    laterality: "unilateral",
    setup: "standing_free_weight",
    goals: {
      muscle_building: 9,
      strength: 8,
      lower_body_strength: 7,
      calf_development: 10,
      balance: 6
    },
    summary:
      "Perform a single-leg calf raise while holding a dumbbell for additional resistance.",
    instructions: [
      "Hold a dumbbell securely.",
      "Stand on one leg with optional support from the free hand.",
      "Raise the heel.",
      "Lower slowly before repeating."
    ],
    cues: [
      "Use the support only for balance.",
      "Keep the ankle tracking smoothly."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // DONKEY CALF RAISE
  // ===================================================
  {
    id: "donkey_calf_raise",
    name: "Donkey Calf Raise",
    aliases: [
      "donkey calf raises",
      "bent over calf raise",
      "donkey heel raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["donkey_calf_machine", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "calves",
      label: "Calves"
    },
    substitutionGroup: "standing_calf_raise",
    substitutions: [
      "machine_standing_calf_raise",
      "smith_machine_calf_raise",
      "standing_calf_raise"
    ],
    laterality: "bilateral",
    setup: "hip_hinged",
    goals: {
      muscle_building: 9,
      strength: 7,
      calf_development: 9
    },
    summary:
      "Perform calf raises from a hip-hinged position while keeping the knees relatively straight.",
    instructions: [
      "Set up securely in a donkey calf machine or supported bent-over position.",
      "Keep the knees relatively straight.",
      "Raise the heels.",
      "Lower under control."
    ],
    cues: [
      "Keep the setup stable.",
      "Avoid bouncing.",
      "Focus movement at the ankles."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // TIBIALIS / ANTERIOR LOWER LEG
  // ===================================================
  {
    id: "tibialis_raise",
    name: "Tibialis Raise",
    aliases: [
      "tib raise",
      "tibialis anterior raise",
      "toe raise",
      "shin raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["shins", "lower_body"],
    primaryMuscles: ["tibialis_anterior"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["bodyweight", "wall"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "tibialis_anterior",
      region: "anterior_lower_leg",
      label: "Shins"
    },
    substitutionGroup: "tibialis_raise",
    substitutions: [
      "tibialis_machine_raise",
      "banded_dorsiflexion"
    ],
    laterality: "bilateral",
    setup: "standing_wall_supported",
    goals: {
      strength: 6,
      lower_body_strength: 6,
      general_fitness: 8,
      running: 8,
      calf_development: 5
    },
    summary:
      "Lift the forefoot toward the shins while the heels remain planted to train ankle dorsiflexion.",
    instructions: [
      "Stand with the back supported against a wall if desired.",
      "Keep the heels planted.",
      "Lift the toes and forefoot toward the shins.",
      "Lower under control."
    ],
    cues: [
      "Move through the ankles.",
      "Keep the heels down.",
      "Avoid rocking the whole body."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "tibialis_machine_raise",
    name: "Tibialis Machine Raise",
    aliases: [
      "tib machine",
      "tibialis raise machine",
      "tib bar raise",
      "weighted tibialis raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["shins", "lower_body"],
    primaryMuscles: ["tibialis_anterior"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["tibialis_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "tibialis_anterior",
      region: "anterior_lower_leg",
      label: "Shins"
    },
    substitutionGroup: "tibialis_raise",
    substitutions: [
      "tibialis_raise",
      "banded_dorsiflexion"
    ],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 7,
      strength: 7,
      lower_body_strength: 6,
      running: 8
    },
    summary:
      "Dorsiflex the ankles against external resistance to strengthen the tibialis anterior.",
    instructions: [
      "Set up securely in the tibialis machine.",
      "Position the feet according to the machine design.",
      "Pull the forefoot upward toward the shins.",
      "Return slowly."
    ],
    cues: [
      "Keep the movement controlled.",
      "Avoid jerking the resistance."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "banded_dorsiflexion",
    name: "Banded Ankle Dorsiflexion",
    aliases: [
      "band dorsiflexion",
      "resistance band dorsiflexion",
      "banded tibialis raise",
      "band toe raise"
    ],
    category: "strength",
    exerciseTypes: ["strength", "resistance_band"],
    bodyParts: ["shins", "lower_body"],
    primaryMuscles: ["tibialis_anterior"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "tibialis_anterior",
      region: "anterior_lower_leg",
      label: "Shins"
    },
    substitutionGroup: "tibialis_raise",
    substitutions: [
      "tibialis_raise",
      "tibialis_machine_raise"
    ],
    laterality: "unilateral",
    setup: "seated_band",
    goals: {
      strength: 5,
      lower_body_strength: 5,
      general_fitness: 7,
      running: 7,
      recovery: 7
    },
    summary:
      "Pull the forefoot toward the shin against band resistance to train ankle dorsiflexion.",
    instructions: [
      "Anchor a resistance band securely in front of the foot.",
      "Loop the band over the forefoot.",
      "Pull the toes toward the shin.",
      "Return slowly before repeating."
    ],
    cues: [
      "Keep the lower leg relatively still.",
      "Control both directions."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  CALF_EXERCISES
};

export default CALF_EXERCISES;
