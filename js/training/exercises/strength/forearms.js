// =====================================================
// ARI REBIRTH
// File: js/training/exercises/strength/forearms.js
// Version: 1.0.0
// Purpose:
//   Forearm, wrist, and grip strength/hypertrophy exercise
//   data for the ARI Training Exercise Registry.
//
// Design:
//   - Uses muscle IDs from anatomy/muscles.js.
//   - Uses only movement-pattern IDs currently available in
//     movement-patterns.js.
//   - Covers wrist flexion/extension, brachioradialis,
//     grip endurance, pinch grip, hangs, and wrist rollers.
//   - Avoids duplicate curl records already owned by
//     strength/biceps.js.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, setup, and logging metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/strength/forearms";

const FOREARM_EXERCISES = Object.freeze([
  // ===================================================
  // WRIST FLEXION
  // ===================================================
  {
    id: "barbell_wrist_curl",
    name: "Barbell Wrist Curl",
    aliases: [
      "wrist curl",
      "barbell forearm curl",
      "palms up wrist curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["barbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "anterior_forearm",
      label: "Forearm Flexors"
    },
    substitutionGroup: "wrist_flexion",
    substitutions: [
      "dumbbell_wrist_curl",
      "cable_wrist_curl",
      "behind_back_wrist_curl"
    ],
    laterality: "bilateral",
    setup: "seated_forearms_supported",
    goals: {
      muscle_building: 9,
      strength: 7,
      grip_strength: 7,
      upper_body_strength: 5
    },
    summary:
      "Flex the wrists upward against a barbell while the forearms remain supported.",
    instructions: [
      "Sit with the forearms supported on the thighs or a bench.",
      "Hold the bar with palms facing upward.",
      "Allow the wrists to extend slightly under control.",
      "Curl the wrists upward without moving the elbows."
    ],
    cues: [
      "Move only through the wrists.",
      "Use a controlled range.",
      "Avoid bouncing the bar."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_wrist_curl",
    name: "Dumbbell Wrist Curl",
    aliases: [
      "dumbbell forearm curl",
      "db wrist curl",
      "single dumbbell wrist curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "anterior_forearm",
      label: "Forearm Flexors"
    },
    substitutionGroup: "wrist_flexion",
    substitutions: [
      "barbell_wrist_curl",
      "cable_wrist_curl",
      "behind_back_wrist_curl"
    ],
    laterality: "unilateral_or_bilateral",
    setup: "seated_forearms_supported",
    goals: {
      muscle_building: 9,
      strength: 7,
      grip_strength: 7,
      upper_body_strength: 5
    },
    summary:
      "Flex one or both wrists upward with dumbbells while keeping the forearms supported.",
    instructions: [
      "Support the forearm on the thigh or bench.",
      "Hold the dumbbell with the palm facing upward.",
      "Lower the hand through a comfortable wrist range.",
      "Curl the wrist upward."
    ],
    cues: [
      "Keep the forearm still.",
      "Avoid using elbow movement."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cable_wrist_curl",
    name: "Cable Wrist Curl",
    aliases: [
      "cable forearm curl",
      "cable wrist flexion",
      "low cable wrist curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["cable_machine", "straight_bar_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "anterior_forearm",
      label: "Forearm Flexors"
    },
    substitutionGroup: "wrist_flexion",
    substitutions: [
      "barbell_wrist_curl",
      "dumbbell_wrist_curl"
    ],
    laterality: "bilateral",
    setup: "standing_or_seated_cable",
    goals: {
      muscle_building: 9,
      strength: 6,
      grip_strength: 7
    },
    summary:
      "Flex the wrists against low cable resistance for continuous tension on the forearm flexors.",
    instructions: [
      "Set the cable low and grip the attachment with palms facing upward.",
      "Keep the elbows and forearms stable.",
      "Extend the wrists slightly.",
      "Curl the wrists upward."
    ],
    cues: [
      "Keep cable tension throughout the set.",
      "Do not turn the movement into a biceps curl."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "behind_back_wrist_curl",
    name: "Behind-the-Back Wrist Curl",
    aliases: [
      "behind back wrist curl",
      "behind the back forearm curl",
      "standing wrist curl behind back"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["barbell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "anterior_forearm",
      label: "Forearm Flexors"
    },
    substitutionGroup: "wrist_flexion",
    substitutions: [
      "barbell_wrist_curl",
      "dumbbell_wrist_curl"
    ],
    laterality: "bilateral",
    setup: "standing_barbell_behind_body",
    goals: {
      muscle_building: 8,
      strength: 6,
      grip_strength: 7
    },
    summary:
      "Flex the wrists upward while holding a barbell behind the body.",
    instructions: [
      "Stand tall holding the bar behind the hips.",
      "Keep the arms long.",
      "Allow the wrists to extend slightly.",
      "Curl the wrists upward."
    ],
    cues: [
      "Keep the shoulders relaxed.",
      "Use only wrist motion."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // WRIST EXTENSION
  // ===================================================
  {
    id: "reverse_barbell_wrist_curl",
    name: "Reverse Barbell Wrist Curl",
    aliases: [
      "reverse wrist curl",
      "barbell wrist extension",
      "palms down wrist curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_extensors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["barbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_extensors",
      region: "posterior_forearm",
      label: "Forearm Extensors"
    },
    substitutionGroup: "wrist_extension",
    substitutions: [
      "reverse_dumbbell_wrist_curl",
      "cable_wrist_extension"
    ],
    laterality: "bilateral",
    setup: "seated_forearms_supported",
    goals: {
      muscle_building: 9,
      strength: 7,
      grip_strength: 6,
      upper_body_strength: 5
    },
    summary:
      "Extend the wrists upward against a barbell while the forearms remain supported.",
    instructions: [
      "Support the forearms on the thighs or a bench.",
      "Hold the bar with palms facing downward.",
      "Lower the hands slightly.",
      "Extend the wrists upward."
    ],
    cues: [
      "Use a light, controlled load.",
      "Keep the forearms still."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_dumbbell_wrist_curl",
    name: "Reverse Dumbbell Wrist Curl",
    aliases: [
      "dumbbell reverse wrist curl",
      "db wrist extension",
      "dumbbell forearm extension"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_extensors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_extensors",
      region: "posterior_forearm",
      label: "Forearm Extensors"
    },
    substitutionGroup: "wrist_extension",
    substitutions: [
      "reverse_barbell_wrist_curl",
      "cable_wrist_extension"
    ],
    laterality: "unilateral_or_bilateral",
    setup: "seated_forearms_supported",
    goals: {
      muscle_building: 9,
      strength: 7,
      grip_strength: 6
    },
    summary:
      "Extend one or both wrists upward with dumbbells while the forearms remain supported.",
    instructions: [
      "Support the forearm with the palm facing downward.",
      "Allow the hand to lower slightly.",
      "Lift the back of the hand upward.",
      "Lower slowly."
    ],
    cues: [
      "Keep the elbow still.",
      "Use a controlled wrist range."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cable_wrist_extension",
    name: "Cable Wrist Extension",
    aliases: [
      "cable reverse wrist curl",
      "cable forearm extension",
      "cable wrist extensor curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_extensors"],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["cable_machine", "straight_bar_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_extensors",
      region: "posterior_forearm",
      label: "Forearm Extensors"
    },
    substitutionGroup: "wrist_extension",
    substitutions: [
      "reverse_barbell_wrist_curl",
      "reverse_dumbbell_wrist_curl"
    ],
    laterality: "bilateral",
    setup: "standing_or_seated_cable",
    goals: {
      muscle_building: 9,
      strength: 6,
      grip_strength: 6
    },
    summary:
      "Extend the wrists against cable resistance to train the posterior forearm.",
    instructions: [
      "Set the cable low.",
      "Grip the bar with palms facing downward.",
      "Keep the forearms stable.",
      "Extend the wrists upward and return slowly."
    ],
    cues: [
      "Use continuous tension.",
      "Avoid elbow movement."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // GRIP / CARRY / HOLDS
  // ===================================================
  {
    id: "farmers_hold",
    name: "Farmer's Hold",
    aliases: [
      "farmer hold",
      "static farmers hold",
      "heavy dumbbell hold"
    ],
    category: "strength",
    exerciseTypes: ["strength", "functional"],
    bodyParts: ["forearms", "arms", "shoulders", "core", "full_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [
      "trapezius_upper",
      "transversus_abdominis"
    ],
    movementPatterns: ["loaded_carry"],
    equipment: ["dumbbells", "kettlebells", "farmer_handles"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "grip",
      label: "Grip Strength"
    },
    substitutionGroup: "grip_hold",
    substitutions: [
      "plate_pinch_hold",
      "barbell_static_hold",
      "dead_hang"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      grip_strength: 10,
      strength: 8,
      upper_body_strength: 7,
      core_strength: 7,
      general_fitness: 8
    },
    summary:
      "Hold heavy weights at the sides without walking while maintaining posture and grip.",
    instructions: [
      "Pick up the weights using a stable stance.",
      "Stand tall with the arms long.",
      "Hold the weights for the planned duration.",
      "Set them down safely."
    ],
    cues: [
      "Keep the shoulders controlled.",
      "Do not let the weights pull the torso sideways.",
      "Maintain a strong grip."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "barbell_static_hold",
    name: "Barbell Static Hold",
    aliases: [
      "barbell hold",
      "static barbell grip hold",
      "deadlift hold"
    ],
    category: "strength",
    exerciseTypes: ["strength", "functional", "free_weight"],
    bodyParts: ["forearms", "arms", "back", "core", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [
      "trapezius_upper",
      "latissimus_dorsi",
      "erector_spinae"
    ],
    movementPatterns: ["loaded_carry"],
    equipment: ["barbell", "rack"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "grip",
      label: "Grip Strength"
    },
    substitutionGroup: "grip_hold",
    substitutions: [
      "farmers_hold",
      "dead_hang",
      "plate_pinch_hold"
    ],
    laterality: "bilateral",
    setup: "standing_barbell",
    goals: {
      grip_strength: 10,
      strength: 9,
      upper_body_strength: 7
    },
    summary:
      "Hold a loaded barbell in the hands for time to develop crushing grip and support strength.",
    instructions: [
      "Set the bar at a safe height in a rack or lift it from the floor.",
      "Stand tall with the arms extended.",
      "Hold the bar securely for the planned duration.",
      "Return the bar safely."
    ],
    cues: [
      "Keep the bar close to the body.",
      "Maintain a neutral wrist.",
      "Use appropriate safety pins or rack height."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "plate_pinch_hold",
    name: "Plate Pinch Hold",
    aliases: [
      "plate pinch",
      "pinch grip hold",
      "weight plate pinch"
    ],
    category: "strength",
    exerciseTypes: ["strength", "functional"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: ["forearm_extensors"],
    movementPatterns: ["loaded_carry"],
    equipment: ["weight_plates"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "pinch_grip",
      label: "Pinch Grip"
    },
    substitutionGroup: "pinch_grip",
    substitutions: [
      "farmers_hold",
      "barbell_static_hold"
    ],
    laterality: "bilateral_or_unilateral",
    setup: "standing",
    goals: {
      grip_strength: 10,
      strength: 7,
      upper_body_strength: 6
    },
    summary:
      "Pinch one or more plates between the fingers and thumb and hold them for time.",
    instructions: [
      "Select plates that can be held safely.",
      "Pinch the plates between the thumb and fingers.",
      "Stand tall and hold for the planned duration.",
      "Set the plates down carefully."
    ],
    cues: [
      "Keep the plates away from the feet.",
      "Use a controlled load.",
      "Maintain full finger and thumb pressure."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "duration_seconds", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "plate_pinch_carry",
    name: "Plate Pinch Carry",
    aliases: [
      "plate pinch walk",
      "pinch grip carry",
      "plate carry"
    ],
    category: "functional",
    exerciseTypes: ["strength", "functional"],
    bodyParts: ["forearms", "arms", "core", "full_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [
      "forearm_extensors",
      "transversus_abdominis"
    ],
    movementPatterns: ["loaded_carry", "walking"],
    equipment: ["weight_plates"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "pinch_grip",
      label: "Pinch Grip"
    },
    substitutionGroup: "pinch_grip",
    substitutions: [
      "plate_pinch_hold",
      "farmers_carry"
    ],
    laterality: "bilateral_or_unilateral",
    setup: "walking",
    goals: {
      grip_strength: 10,
      strength: 7,
      general_fitness: 7,
      core_strength: 6
    },
    summary:
      "Walk while pinching weight plates between the fingers and thumb.",
    instructions: [
      "Securely pinch the plates.",
      "Stand tall.",
      "Walk for the planned distance or duration.",
      "Set the plates down safely."
    ],
    cues: [
      "Use short controlled steps.",
      "Do not carry plates over the feet unnecessarily."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "distance", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // HANGING GRIP
  // ===================================================
  {
    id: "dead_hang",
    name: "Dead Hang",
    aliases: [
      "bar hang",
      "passive hang",
      "pull up bar hang"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["forearms", "arms", "shoulders", "back", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [
      "latissimus_dorsi",
      "trapezius_upper"
    ],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "support_grip",
      label: "Grip Endurance"
    },
    substitutionGroup: "hanging_grip",
    substitutions: [
      "towel_dead_hang",
      "farmers_hold",
      "barbell_static_hold"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      grip_strength: 10,
      upper_body_strength: 6,
      general_fitness: 8
    },
    summary:
      "Hang from a pull-up bar for time to develop support-grip endurance.",
    instructions: [
      "Grip the bar securely.",
      "Lift the feet from the floor.",
      "Maintain a controlled hanging position.",
      "Step down safely when the set ends."
    ],
    cues: [
      "Do not hang longer than you can maintain a secure grip.",
      "Keep the shoulders in a comfortable position."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "towel_dead_hang",
    name: "Towel Dead Hang",
    aliases: [
      "towel hang",
      "towel grip hang",
      "towel pull up hang"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics", "functional"],
    bodyParts: ["forearms", "arms", "shoulders", "back", "upper_body"],
    primaryMuscles: ["forearm_flexors"],
    secondaryMuscles: [
      "brachioradialis",
      "latissimus_dorsi"
    ],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "towel", "bodyweight"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "crushing_support_grip",
      label: "Grip Strength"
    },
    substitutionGroup: "hanging_grip",
    substitutions: [
      "dead_hang",
      "farmers_hold"
    ],
    laterality: "bilateral",
    setup: "hanging_towels",
    goals: {
      grip_strength: 10,
      strength: 8,
      upper_body_strength: 7
    },
    summary:
      "Hang from towels draped over a pull-up bar to increase grip demand.",
    instructions: [
      "Drape sturdy towels securely over the bar.",
      "Grip one towel in each hand.",
      "Lift the feet from the floor.",
      "Hold for the planned duration."
    ],
    cues: [
      "Verify the towels and bar are secure.",
      "End the set before the grip unexpectedly fails."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // WRIST ROLLER
  // ===================================================
  {
    id: "wrist_roller",
    name: "Wrist Roller",
    aliases: [
      "forearm wrist roller",
      "wrist roller exercise",
      "forearm roller"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy"],
    bodyParts: ["forearms", "arms", "upper_body"],
    primaryMuscles: [
      "forearm_flexors",
      "forearm_extensors"
    ],
    secondaryMuscles: [],
    movementPatterns: [],
    equipment: ["wrist_roller"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "full_forearm",
      label: "Forearms"
    },
    substitutionGroup: "wrist_roller",
    substitutions: [
      "barbell_wrist_curl",
      "reverse_barbell_wrist_curl"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      grip_strength: 9,
      strength: 7,
      upper_body_strength: 6
    },
    summary:
      "Rotate a wrist roller to raise and lower a suspended weight using repeated wrist flexion and extension.",
    instructions: [
      "Hold the roller securely in front of the body.",
      "Rotate the wrists to wind the weight upward.",
      "Reverse direction to lower it under control.",
      "Complete the planned number of cycles."
    ],
    cues: [
      "Keep the shoulders relaxed.",
      "Do not let the weight drop freely.",
      "Use smooth alternating wrist motion."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BRACHIORADIALIS / FOREARM-DOMINANT ELBOW FLEXION
  // ===================================================
  {
    id: "zottman_curl",
    name: "Zottman Curl",
    aliases: [
      "zottman curls",
      "supinated up pronated down curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "biceps", "arms", "upper_body"],
    primaryMuscles: [
      "brachioradialis",
      "biceps_brachii"
    ],
    secondaryMuscles: [
      "brachialis",
      "forearm_extensors"
    ],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "brachioradialis",
      region: "forearm_elbow_flexors",
      label: "Biceps + Forearms"
    },
    substitutionGroup: "forearm_dominant_curl",
    substitutions: [
      "reverse_dumbbell_curl",
      "hammer_curl"
    ],
    laterality: "bilateral_or_alternating",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 8,
      grip_strength: 7,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl dumbbells with a supinated grip, rotate to palms-down near the top, and lower under control.",
    instructions: [
      "Begin with palms facing forward or upward.",
      "Curl the dumbbells toward the shoulders.",
      "Rotate the forearms so the palms face downward.",
      "Lower slowly, then reset the grip."
    ],
    cues: [
      "Use a controlled load.",
      "Keep the elbows near the torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_dumbbell_curl",
    name: "Reverse Dumbbell Curl",
    aliases: [
      "dumbbell reverse curl",
      "pronated dumbbell curl",
      "overhand dumbbell curl"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["forearms", "biceps", "arms", "upper_body"],
    primaryMuscles: [
      "brachioradialis",
      "brachialis"
    ],
    secondaryMuscles: [
      "biceps_brachii",
      "forearm_extensors"
    ],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "brachioradialis",
      region: "forearm_elbow_flexors",
      label: "Brachioradialis"
    },
    substitutionGroup: "forearm_dominant_curl",
    substitutions: [
      "zottman_curl",
      "hammer_curl"
    ],
    laterality: "bilateral_or_alternating",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 8,
      grip_strength: 7,
      strength: 6,
      upper_body_strength: 6
    },
    summary:
      "Curl dumbbells with palms facing downward to emphasize the brachioradialis and forearm extensors.",
    instructions: [
      "Hold the dumbbells with an overhand grip.",
      "Keep the elbows near the torso.",
      "Curl the weights upward.",
      "Lower under control."
    ],
    cues: [
      "Keep the wrists neutral.",
      "Avoid swinging the torso."
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
  FOREARM_EXERCISES
};

export default FOREARM_EXERCISES;
