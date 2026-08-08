// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/biceps.js
// Version: 1.0.0
// Purpose:
//   Biceps-focused strength and hypertrophy exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves existing biceps exercise IDs.
//   - Covers barbell, EZ-bar, dumbbell, cable, preacher,
//     incline, neutral-grip, and unilateral curl variations.
//   - Uses existing anatomy and movement-pattern IDs.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, setup, and logging metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/biceps";

const BICEPS_EXERCISES = Object.freeze([
  // ===================================================
  // BARBELL / EZ-BAR
  // ===================================================
  {
    id: "barbell_curl",
    name: "Barbell Curl",
    aliases: [
      "barbell biceps curl",
      "straight bar curl",
      "bb curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis", "forearm_flexors"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["barbell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "general",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "ez_bar_curl",
      "dumbbell_biceps_curl",
      "cable_curl",
      "preacher_curl"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 7
    },
    summary:
      "Curl a barbell toward the shoulders while keeping the upper arms controlled.",
    instructions: [
      "Stand tall holding the bar with an underhand grip.",
      "Keep the elbows near the sides.",
      "Curl the bar upward.",
      "Lower under control."
    ],
    cues: [
      "Avoid excessive torso swing.",
      "Keep the wrists neutral and controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "ez_bar_curl",
    name: "EZ-Bar Curl",
    aliases: [
      "ez curl",
      "ez bar biceps curl",
      "curl bar curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis", "forearm_flexors"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["ez_bar"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "general",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "barbell_curl",
      "dumbbell_biceps_curl",
      "preacher_curl"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 7
    },
    summary:
      "Curl an EZ-bar toward the shoulders using a semi-supinated grip that may feel more comfortable for the wrists.",
    instructions: [
      "Grip the angled portions of the EZ-bar.",
      "Keep the elbows near the torso.",
      "Curl the bar upward.",
      "Lower under control."
    ],
    cues: [
      "Avoid leaning backward.",
      "Keep the elbows from drifting far forward."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_barbell_curl",
    name: "Reverse Barbell Curl",
    aliases: [
      "reverse curl",
      "pronated barbell curl",
      "overhand barbell curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachioradialis", "brachialis"],
    secondaryMuscles: ["biceps_brachii", "forearm_extensors"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["barbell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachioradialis",
      region: "forearm_elbow_flexors",
      label: "Brachioradialis + Biceps"
    },
    substitutionGroup: "neutral_pronated_curl",
    substitutions: [
      "hammer_curl",
      "reverse_ez_bar_curl",
      "cross_body_hammer_curl"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl a barbell using an overhand grip to emphasize the brachioradialis and brachialis.",
    instructions: [
      "Hold the bar with palms facing down.",
      "Keep the elbows close to the torso.",
      "Curl the bar upward.",
      "Lower slowly."
    ],
    cues: [
      "Use a lighter load than a standard curl.",
      "Keep the wrists stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_ez_bar_curl",
    name: "Reverse EZ-Bar Curl",
    aliases: [
      "reverse ez curl",
      "overhand ez bar curl",
      "pronated ez curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachioradialis", "brachialis"],
    secondaryMuscles: ["biceps_brachii", "forearm_extensors"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["ez_bar"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachioradialis",
      region: "forearm_elbow_flexors",
      label: "Brachioradialis + Biceps"
    },
    substitutionGroup: "neutral_pronated_curl",
    substitutions: [
      "reverse_barbell_curl",
      "hammer_curl",
      "cross_body_hammer_curl"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl an EZ-bar with an overhand grip to train the brachioradialis, brachialis, and forearms.",
    instructions: [
      "Grip the EZ-bar with palms generally facing down.",
      "Keep the elbows near the sides.",
      "Curl upward.",
      "Lower under control."
    ],
    cues: [
      "Avoid wrist collapse.",
      "Use controlled loads."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // DUMBBELL CURLS
  // ===================================================
  {
    id: "dumbbell_biceps_curl",
    name: "Dumbbell Biceps Curl",
    aliases: [
      "dumbbell curl",
      "db curl",
      "biceps curl",
      "standing dumbbell curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "general",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "barbell_curl",
      "ez_bar_curl",
      "alternating_dumbbell_curl",
      "cable_curl"
    ],
    laterality: "bilateral_or_alternating",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl the dumbbells toward the shoulders by bending the elbows while keeping the upper arms controlled.",
    instructions: [
      "Stand or sit with the arms by the sides.",
      "Keep the upper arms relatively still.",
      "Bend the elbows to raise the dumbbells.",
      "Lower under control."
    ],
    cues: [
      "Avoid swinging the torso.",
      "Do not let the elbows drift far forward."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "alternating_dumbbell_curl",
    name: "Alternating Dumbbell Curl",
    aliases: [
      "alternating curl",
      "alternating biceps curl",
      "alternate dumbbell curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "general",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "dumbbell_biceps_curl",
      "single_arm_cable_curl",
      "incline_dumbbell_curl"
    ],
    laterality: "alternating",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl one dumbbell at a time while the opposite arm remains controlled.",
    instructions: [
      "Stand or sit with both dumbbells at the sides.",
      "Curl one arm toward the shoulder.",
      "Lower it under control.",
      "Alternate sides."
    ],
    cues: [
      "Keep the torso still.",
      "Fully control each arm."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "incline_dumbbell_curl",
    name: "Incline Dumbbell Curl",
    aliases: [
      "incline curl",
      "incline bench curl",
      "incline biceps curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells", "incline_bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "lengthened_position",
      label: "Biceps - Lengthened"
    },
    substitutionGroup: "lengthened_biceps_curl",
    substitutions: [
      "bayesian_cable_curl",
      "dumbbell_biceps_curl",
      "preacher_curl"
    ],
    laterality: "bilateral_or_alternating",
    setup: "incline_bench",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Curl dumbbells from an inclined bench with the upper arms positioned slightly behind the torso.",
    instructions: [
      "Set the bench to a moderate incline.",
      "Let the arms hang naturally beside the torso.",
      "Curl the dumbbells upward without moving the upper arms forward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the shoulders relaxed.",
      "Use a controlled stretch at the bottom."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "concentration_curl",
    name: "Concentration Curl",
    aliases: [
      "seated concentration curl",
      "single arm concentration curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "shortened_position",
      label: "Biceps - Peak Contraction"
    },
    substitutionGroup: "supported_biceps_curl",
    substitutions: [
      "preacher_curl",
      "single_arm_preacher_curl",
      "single_arm_cable_curl"
    ],
    laterality: "unilateral",
    setup: "seated_supported",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Curl one dumbbell with the upper arm braced against the inner thigh for strict isolation.",
    instructions: [
      "Sit with the feet apart.",
      "Brace the working upper arm against the inner thigh.",
      "Curl the dumbbell upward.",
      "Lower under control before switching sides."
    ],
    cues: [
      "Keep the upper arm fixed.",
      "Avoid shoulder movement."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "spider_curl",
    name: "Spider Curl",
    aliases: [
      "incline spider curl",
      "chest supported curl",
      "spider biceps curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells", "ez_bar", "incline_bench"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "shortened_position",
      label: "Biceps - Shortened"
    },
    substitutionGroup: "supported_biceps_curl",
    substitutions: [
      "preacher_curl",
      "concentration_curl",
      "cable_curl"
    ],
    laterality: "bilateral_or_unilateral",
    setup: "chest_supported_incline_bench",
    goals: {
      muscle_building: 9,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Curl weights while lying chest-down on an incline bench to minimize body momentum.",
    instructions: [
      "Lie chest-down on an incline bench.",
      "Let the arms hang toward the floor.",
      "Curl the weight upward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the chest supported.",
      "Do not swing the arms."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // HAMMER / BRACHIALIS / BRACHIORADIALIS
  // ===================================================
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    aliases: [
      "dumbbell hammer curl",
      "neutral grip curl",
      "hammer curls"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachialis", "brachioradialis"],
    secondaryMuscles: ["biceps_brachii"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachialis",
      region: "neutral_grip",
      label: "Brachialis + Forearms"
    },
    substitutionGroup: "neutral_pronated_curl",
    substitutions: [
      "cross_body_hammer_curl",
      "rope_hammer_curl",
      "reverse_barbell_curl"
    ],
    laterality: "bilateral_or_alternating",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 9,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl dumbbells with the palms facing each other to emphasize the brachialis and forearm elbow flexors.",
    instructions: [
      "Hold the dumbbells with a neutral thumb-up grip.",
      "Keep the upper arms near the sides.",
      "Curl the weights upward.",
      "Lower under control."
    ],
    cues: [
      "Maintain the neutral grip.",
      "Avoid using momentum."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cross_body_hammer_curl",
    name: "Cross-Body Hammer Curl",
    aliases: [
      "cross body curl",
      "cross body hammer",
      "pinwheel curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachialis", "brachioradialis"],
    secondaryMuscles: ["biceps_brachii"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachioradialis",
      region: "neutral_grip",
      label: "Brachialis + Brachioradialis"
    },
    substitutionGroup: "neutral_pronated_curl",
    substitutions: [
      "hammer_curl",
      "rope_hammer_curl",
      "reverse_ez_bar_curl"
    ],
    laterality: "alternating",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl a dumbbell diagonally across the torso using a neutral grip.",
    instructions: [
      "Hold the dumbbells with palms facing inward.",
      "Curl one dumbbell toward the opposite upper chest.",
      "Lower under control.",
      "Alternate sides."
    ],
    cues: [
      "Keep the elbow near the body.",
      "Do not twist the wrist into a supinated curl."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // PREACHER / SUPPORTED CURLS
  // ===================================================
  {
    id: "preacher_curl",
    name: "Preacher Curl",
    aliases: [
      "ez bar preacher curl",
      "preacher biceps curl",
      "preacher bench curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "machine_strength"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["preacher_bench", "ez_bar", "barbell", "preacher_curl_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "supported_lengthened",
      label: "Biceps"
    },
    substitutionGroup: "supported_biceps_curl",
    substitutions: [
      "machine_preacher_curl",
      "single_arm_preacher_curl",
      "spider_curl",
      "concentration_curl"
    ],
    laterality: "bilateral",
    setup: "preacher_bench",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl a bar or machine handle while the upper arms are supported on a preacher pad.",
    instructions: [
      "Set the upper arms securely on the pad.",
      "Begin with the elbows nearly extended.",
      "Curl the resistance upward.",
      "Lower slowly without aggressively locking the elbows."
    ],
    cues: [
      "Keep the upper arms on the pad.",
      "Control the stretched bottom position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_preacher_curl",
    name: "Machine Preacher Curl",
    aliases: [
      "preacher curl machine",
      "machine biceps curl",
      "seated preacher curl machine"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["preacher_curl_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "supported_lengthened",
      label: "Biceps"
    },
    substitutionGroup: "supported_biceps_curl",
    substitutions: [
      "preacher_curl",
      "single_arm_preacher_curl",
      "cable_curl"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl the machine handles while the upper arms remain supported on the pad.",
    instructions: [
      "Adjust the seat and pad.",
      "Position the upper arms securely.",
      "Curl the handles upward.",
      "Lower under control."
    ],
    cues: [
      "Do not lift the arms off the pad.",
      "Avoid slamming the weight stack."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_preacher_curl",
    name: "Single-Arm Preacher Curl",
    aliases: [
      "one arm preacher curl",
      "single arm dumbbell preacher curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbell", "preacher_bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "supported_lengthened",
      label: "Biceps"
    },
    substitutionGroup: "supported_biceps_curl",
    substitutions: [
      "preacher_curl",
      "machine_preacher_curl",
      "concentration_curl"
    ],
    laterality: "unilateral",
    setup: "preacher_bench",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Curl one dumbbell while the working upper arm is supported on a preacher pad.",
    instructions: [
      "Position one upper arm securely on the pad.",
      "Begin with the elbow nearly extended.",
      "Curl the dumbbell upward.",
      "Lower slowly before switching sides."
    ],
    cues: [
      "Keep the shoulder still.",
      "Control the bottom range."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // CABLE CURLS
  // ===================================================
  {
    id: "cable_curl",
    name: "Cable Curl",
    aliases: [
      "cable biceps curl",
      "standing cable curl",
      "straight bar cable curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["cable_machine", "straight_bar_attachment", "ez_bar_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "continuous_tension",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "barbell_curl",
      "dumbbell_biceps_curl",
      "single_arm_cable_curl",
      "preacher_curl"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl a low cable attachment toward the shoulders while maintaining continuous resistance.",
    instructions: [
      "Set the pulley low.",
      "Grip the attachment with an underhand grip.",
      "Curl upward while keeping the upper arms controlled.",
      "Lower slowly."
    ],
    cues: [
      "Keep the elbows near the torso.",
      "Do not lean backward."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "single_arm_cable_curl",
    name: "Single-Arm Cable Curl",
    aliases: [
      "one arm cable curl",
      "single handle cable curl",
      "unilateral cable curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "continuous_tension",
      label: "Biceps"
    },
    substitutionGroup: "biceps_curl",
    substitutions: [
      "cable_curl",
      "alternating_dumbbell_curl",
      "concentration_curl"
    ],
    laterality: "unilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Curl one cable handle toward the shoulder to train each arm independently.",
    instructions: [
      "Set the pulley low.",
      "Hold one handle with the working arm.",
      "Curl toward the shoulder.",
      "Lower under control before switching sides."
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

  {
    id: "bayesian_cable_curl",
    name: "Bayesian Cable Curl",
    aliases: [
      "bayesian curl",
      "behind body cable curl",
      "behind the body cable curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "lengthened_position",
      label: "Biceps - Lengthened"
    },
    substitutionGroup: "lengthened_biceps_curl",
    substitutions: [
      "incline_dumbbell_curl",
      "single_arm_cable_curl"
    ],
    laterality: "unilateral",
    setup: "standing_cable_arm_behind_torso",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 5
    },
    summary:
      "Curl a low cable with the working arm positioned slightly behind the torso to load the biceps in a lengthened position.",
    instructions: [
      "Stand one step in front of a low cable.",
      "Allow the working arm to extend slightly behind the torso.",
      "Curl the handle toward the shoulder.",
      "Lower slowly into the stretched position."
    ],
    cues: [
      "Keep the upper arm from drifting forward too early.",
      "Use a comfortable shoulder position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "high_cable_biceps_curl",
    name: "High Cable Biceps Curl",
    aliases: [
      "double biceps cable curl",
      "high pulley curl",
      "overhead cable biceps curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["biceps", "arms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["cable_machine", "single_handles"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "biceps_brachii",
      region: "shortened_position",
      label: "Biceps - Shortened"
    },
    substitutionGroup: "shortened_biceps_curl",
    substitutions: [
      "spider_curl",
      "concentration_curl",
      "cable_curl"
    ],
    laterality: "bilateral",
    setup: "standing_high_cables",
    goals: {
      muscle_building: 9,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Curl high cable handles toward the head while keeping the upper arms elevated.",
    instructions: [
      "Set both pulleys around shoulder height or slightly higher.",
      "Stand centered between them.",
      "Curl the handles toward the head.",
      "Return under control."
    ],
    cues: [
      "Keep the upper arms steady.",
      "Avoid shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rope_hammer_curl",
    name: "Rope Hammer Curl",
    aliases: [
      "cable hammer curl",
      "rope biceps curl",
      "neutral grip cable curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachialis", "brachioradialis"],
    secondaryMuscles: ["biceps_brachii"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["cable_machine", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachialis",
      region: "neutral_grip",
      label: "Brachialis + Forearms"
    },
    substitutionGroup: "neutral_pronated_curl",
    substitutions: [
      "hammer_curl",
      "cross_body_hammer_curl",
      "reverse_barbell_curl"
    ],
    laterality: "bilateral",
    setup: "standing_cable",
    goals: {
      muscle_building: 9,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl a rope attachment with a neutral grip to emphasize the brachialis and brachioradialis.",
    instructions: [
      "Set the pulley low and attach a rope.",
      "Hold the rope with palms facing each other.",
      "Curl upward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the elbows close to the torso.",
      "Maintain the neutral grip."
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
  BICEPS_EXERCISES
};

export default BICEPS_EXERCISES;