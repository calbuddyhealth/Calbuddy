// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/chest.js
// Version: 1.0.0
// Purpose:
//   Chest-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves existing exercise IDs already used by plans.
//   - Adds common flat, incline, decline, machine, cable,
//     bodyweight, and unilateral chest variations.
//   - Uses the existing anatomy and movement IDs.
//   - Adds richer metadata for search, swaps, and future
//     ARI exercise-recommendation logic.
//
// Notes:
//   - targetEmphasis describes practical training emphasis,
//     not a separate anatomical muscle.
//   - substitutionGroup allows ARI to find sensible swaps.
//   - substitutions lists preferred direct alternatives.
// =====================================================

const VERSION = "1.0.0";
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["barbell", "bench", "rack"],
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
      "weighted_push_up"
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
      "Press the bar upward until the arms are extended without aggressively locking the elbows."
    ],
    cues: [
      "Keep wrists stacked over the forearms.",
      "Avoid excessive elbow flare.",
      "Keep the upper back stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["barbell", "incline_bench", "rack"],
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
      "low_to_high_cable_fly"
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["barbell", "decline_bench", "rack"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "decline_dumbbell_press",
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
      "Press a barbell from a declined bench to bias the lower fibers of the chest while the triceps assist.",
    instructions: [
      "Secure the legs and upper body on the decline bench.",
      "Unrack the bar with control.",
      "Lower toward the lower chest.",
      "Press upward without losing torso position."
    ],
    cues: [
      "Use a controlled range.",
      "Keep the shoulder blades stable.",
      "Use a spotter or safety setup when appropriate."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "barbell_bench_press",
      "smith_machine_bench_press",
      "machine_chest_press",
      "weighted_push_up"
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
      "Press the dumbbells upward until the arms are extended."
    ],
    cues: [
      "Control the lowering phase.",
      "Keep the forearms close to vertical.",
      "Do not bounce the dumbbells at the bottom."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "incline_bench"],
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
      "low_to_high_cable_fly"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Press dumbbells upward from an inclined bench to emphasize the upper chest while the shoulders and triceps assist.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Hold the dumbbells near the upper chest.",
      "Lower under control with the elbows slightly below shoulder level.",
      "Press upward and slightly inward."
    ],
    cues: [
      "Avoid turning the movement into a steep shoulder press.",
      "Keep the shoulder blades stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "decline_bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
      "decline_barbell_bench_press",
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
      "Press dumbbells from a declined bench to emphasize the lower chest while allowing independent arm movement.",
    instructions: [
      "Secure yourself on the decline bench.",
      "Position the dumbbells beside the lower chest.",
      "Press upward under control.",
      "Lower slowly to the starting position."
    ],
    cues: [
      "Keep the shoulder blades stable.",
      "Do not let the dumbbells drift excessively toward the shoulders."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_squeeze_press",
    name: "Dumbbell Squeeze Press",
    aliases: [
      "hex press",
      "dumbbell hex press",
      "close dumbbell chest press"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["chest", "triceps", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["triceps_brachii", "anterior_deltoid"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternal",
      label: "Mid Chest"
    },
    substitutionGroup: "flat_chest_press",
    substitutions: [
      "dumbbell_bench_press",
      "machine_chest_press",
      "push_up"
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // SMITH MACHINE / MACHINE PRESSING
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
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["smith_machine", "bench"],
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
      "Press the Smith-machine bar from a flat bench using the guided bar path for stable chest training.",
    instructions: [
      "Position the bench so the bar tracks toward the mid-chest.",
      "Set the shoulder blades back and down.",
      "Lower the bar under control.",
      "Press upward and re-rack securely when finished."
    ],
    cues: [
      "Position the bench carefully relative to the fixed bar path.",
      "Keep the wrists stacked."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["smith_machine", "incline_bench"],
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
      "Press the Smith-machine bar from an inclined bench to train the upper chest with a guided bar path.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Align the bench so the bar lowers toward the upper chest.",
      "Lower under control.",
      "Press upward while maintaining stable shoulder blades."
    ],
    cues: [
      "Keep the incline moderate.",
      "Do not shrug the shoulders."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["chest_press_machine"],
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
      "Press the machine handles forward from chest level while keeping the torso and shoulder blades supported.",
    instructions: [
      "Adjust the seat so the handles align near mid-chest.",
      "Grip the handles and brace the torso.",
      "Press forward until the arms are nearly straight.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging.",
      "Do not let the weight stack slam."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["incline_chest_press_machine"],
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
      "Press upward and forward on an incline chest-press machine to emphasize the upper chest.",
    instructions: [
      "Adjust the seat so the handles begin near the upper chest.",
      "Brace the torso against the pad.",
      "Press the handles forward and upward.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders down.",
      "Use the chest rather than excessive shoulder shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "plate_loaded_chest_press",
    name: "Plate-Loaded Chest Press",
    aliases: [
      "hammer strength chest press",
      "plate loaded bench press",
      "plate loaded press"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["plate_loaded_chest_press_machine"],
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
      "Press a plate-loaded machine through a stable chest-press path for heavy chest-focused training.",
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // FLY / ADDUCTION VARIATIONS
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
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid"],
    movementPatterns: ["horizontal_push"],
    equipment: ["pec_deck_machine"],
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
      "Bring the machine arms together in front of the chest while maintaining a controlled shoulder position.",
    instructions: [
      "Adjust the seat so the upper arms align comfortably with the chest.",
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "bench"],
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
      "Open and close the arms in a wide arc while lying on a bench to train the chest through horizontal adduction.",
    instructions: [
      "Lie on a flat bench with dumbbells above the chest.",
      "Maintain a soft elbow bend.",
      "Open the arms until a controlled chest stretch is felt.",
      "Bring the dumbbells back together over the chest."
    ],
    cues: [
      "Do not turn the movement into a press.",
      "Use moderate loads and control the bottom position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "incline_bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "upper_chest_fly",
    substitutions: [
      "low_to_high_cable_fly",
      "incline_dumbbell_press",
      "incline_machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "incline_bench",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Perform a dumbbell fly from an inclined bench to emphasize the upper chest through a controlled arc.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Begin with the dumbbells over the upper chest.",
      "Open the arms with a soft elbow bend.",
      "Bring the dumbbells back together under control."
    ],
    cues: [
      "Avoid excessive depth.",
      "Keep the shoulder blades stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "serratus_anterior"],
    movementPatterns: ["horizontal_push"],
    equipment: ["cable_machine"],
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
      "Bring the cable handles toward each other in front of the body while maintaining a slight bend in the elbows.",
    instructions: [
      "Set the pulleys around chest height and take a stable split stance.",
      "Begin with the arms open and elbows softly bent.",
      "Sweep the arms forward until the hands approach each other.",
      "Return under control."
    ],
    cues: [
      "Move through the shoulders rather than repeatedly bending the elbows.",
      "Avoid overstretching at the back."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "serratus_anterior"],
    movementPatterns: ["horizontal_push"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "clavicular",
      label: "Upper Chest"
    },
    substitutionGroup: "upper_chest_fly",
    substitutions: [
      "incline_dumbbell_fly",
      "incline_dumbbell_press",
      "incline_machine_chest_press"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Sweep cable handles upward and inward from a low pulley position to bias the upper chest.",
    instructions: [
      "Set the cable pulleys low.",
      "Take a stable stance with the arms slightly behind the torso.",
      "Sweep the handles upward and inward toward upper-chest height.",
      "Return slowly."
    ],
    cues: [
      "Keep the elbows softly bent.",
      "Avoid turning the movement into a front raise."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "serratus_anterior"],
    movementPatterns: ["horizontal_push"],
    equipment: ["cable_machine"],
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
      "Sweep cable handles downward and inward from high pulleys to bias the lower chest.",
    instructions: [
      "Set the pulleys above shoulder height.",
      "Take a stable split stance.",
      "Sweep the handles downward and inward.",
      "Return under control."
    ],
    cues: [
      "Keep the torso controlled.",
      "Move through the shoulders rather than over-bending the elbows."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["chest", "shoulders", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "serratus_anterior", "external_oblique", "internal_oblique"],
    movementPatterns: ["horizontal_push", "anti_rotation"],
    equipment: ["cable_machine"],
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
      "Bring one cable handle across the front of the body while resisting unwanted torso rotation.",
    instructions: [
      "Stand side-on to the cable with the working arm open.",
      "Brace the trunk.",
      "Sweep the arm inward across the chest.",
      "Return under control before switching sides."
    ],
    cues: [
      "Keep the torso from rotating.",
      "Maintain a soft elbow bend."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii", "serratus_anterior", "rectus_abdominis"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight"],
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
      "From a rigid plank position, lower the chest toward the floor and press back up while keeping the trunk controlled.",
    instructions: [
      "Place the hands slightly wider than shoulder width.",
      "Create a straight line from head to heels.",
      "Lower the chest toward the floor.",
      "Press the body back to the starting position."
    ],
    cues: [
      "Keep the hips from sagging.",
      "Keep the elbows controlled rather than fully flared."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii", "serratus_anterior", "rectus_abdominis"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight", "weight_plate", "weighted_vest"],
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
      "Perform a push-up with external load to increase chest, triceps, and shoulder demand.",
    instructions: [
      "Secure the external load safely.",
      "Set a rigid plank position.",
      "Lower under control.",
      "Press back to the top while maintaining trunk position."
    ],
    cues: [
      "Do not let the hips sag.",
      "Use only securely positioned load."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii", "serratus_anterior"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight", "bench", "box"],
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
      "Perform a push-up with the hands elevated to reduce resistance and make the movement more accessible.",
    instructions: [
      "Place both hands on a stable elevated surface.",
      "Keep the body in a straight line.",
      "Lower the chest toward the support.",
      "Press back to the start."
    ],
    cues: [
      "Keep the surface stable.",
      "Maintain full-body tension."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
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
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii", "serratus_anterior", "rectus_abdominis"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight", "bench", "box"],
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
      "Perform a push-up with the feet elevated to increase upper-body loading and emphasize the upper chest and shoulders.",
    instructions: [
      "Place the feet securely on an elevated surface.",
      "Set the hands slightly wider than shoulder width.",
      "Lower the chest toward the floor.",
      "Press back up while keeping the body rigid."
    ],
    cues: [
      "Avoid excessive hip sag.",
      "Use a stable elevation."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "chest_dip",
    name: "Chest Dip",
    aliases: [
      "dips",
      "chest dips",
      "forward lean dip",
      "parallel bar chest dip"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["triceps_brachii", "anterior_deltoid"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dip_bars", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "sternocostal_lower",
      label: "Lower Chest"
    },
    substitutionGroup: "decline_chest_press",
    substitutions: [
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
      "Lower and press the body between parallel bars with a slight forward torso angle to emphasize the chest.",
    instructions: [
      "Support the body on parallel bars.",
      "Lean slightly forward.",
      "Lower until a controlled chest and shoulder stretch is reached.",
      "Press back to the top."
    ],
    cues: [
      "Avoid excessive shoulder depth.",
      "Keep the movement controlled rather than bouncing."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  CHEST_EXERCISES
};

export default CHEST_EXERCISES;
