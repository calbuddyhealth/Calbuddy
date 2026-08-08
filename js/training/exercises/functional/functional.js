// =====================================================
// ARI REBIRTH
// File: js/training/exercises/functional/functional.js
// Version: 1.0.0
// Purpose:
//   Functional, carry, athletic, and mixed-pattern exercise
//   data for the ARI Training Exercise Registry.
//
// Design:
//   - Preserves existing functional exercise IDs where used.
//   - Covers loaded carries, sled work, battle ropes,
//     kettlebell movements, medicine-ball work, step-based
//     conditioning, and general athletic strength.
//   - Uses anatomy IDs from muscles.js and movement-pattern
//     IDs already available in movement-patterns.js.
//   - Avoids duplicating strength exercises already owned by
//     chest, back, shoulders, arms, legs, glutes, calves,
//     forearms, core, and cardio modules.
//   - Adds aliases, target emphasis, substitutions,
//     laterality, setup, logging, and energy metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/functional/functional";

const FUNCTIONAL_EXERCISES = Object.freeze([
  // ===================================================
  // LOADED CARRIES
  // ===================================================
  {
    id: "farmers_carry",
    name: "Farmer's Carry",
    aliases: [
      "farmer carry",
      "farmers walk",
      "farmer walk",
      "loaded carry"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: [
      "full_body",
      "forearms",
      "core",
      "shoulders"
    ],
    primaryMuscles: [
      "forearm_flexors",
      "trapezius_upper",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "quadratus_lumborum",
      "gluteus_medius",
      "erector_spinae"
    ],
    movementPatterns: ["loaded_carry", "walking"],
    equipment: [
      "dumbbells",
      "kettlebells",
      "farmer_handles"
    ],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "forearm_flexors",
      region: "full_body_carry",
      label: "Grip + Core + Full Body"
    },
    substitutionGroup: "loaded_carry",
    substitutions: [
      "suitcase_carry",
      "front_rack_carry",
      "overhead_carry"
    ],
    laterality: "bilateral",
    setup: "walking_loaded",
    goals: {
      strength: 8,
      general_fitness: 9,
      core_strength: 8,
      grip_strength: 10,
      athletic_performance: 9
    },
    summary:
      "Walk while carrying heavy weights at the sides and maintaining upright posture and grip.",
    instructions: [
      "Pick up the weights using a stable stance.",
      "Stand tall with the shoulders controlled.",
      "Walk for the planned distance or time.",
      "Set the weights down safely."
    ],
    cues: [
      "Avoid leaning side to side.",
      "Keep a strong, steady grip.",
      "Take controlled steps."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: [
        "sets",
        "weight",
        "distance",
        "duration_seconds",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "front_rack_carry",
    name: "Front Rack Carry",
    aliases: [
      "front rack walk",
      "kettlebell front rack carry",
      "double kettlebell front rack carry"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: [
      "full_body",
      "core",
      "shoulders",
      "forearms"
    ],
    primaryMuscles: [
      "transversus_abdominis",
      "anterior_deltoid",
      "forearm_flexors"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "trapezius_upper",
      "gluteus_medius"
    ],
    movementPatterns: ["loaded_carry", "walking"],
    equipment: ["kettlebells", "dumbbells"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "anterior_loaded_carry",
      label: "Core + Shoulders"
    },
    substitutionGroup: "loaded_carry",
    substitutions: [
      "farmers_carry",
      "suitcase_carry",
      "overhead_carry"
    ],
    laterality: "bilateral_or_unilateral",
    setup: "front_rack_walking",
    goals: {
      core_strength: 10,
      strength: 8,
      athletic_performance: 9,
      grip_strength: 8,
      general_fitness: 8
    },
    summary:
      "Walk while holding weights in a front-rack position and resisting trunk collapse.",
    instructions: [
      "Clean or position the weights securely at shoulder level.",
      "Brace the trunk.",
      "Walk for the planned distance or time.",
      "Lower the weights safely."
    ],
    cues: [
      "Keep the ribs stacked over the pelvis.",
      "Avoid leaning backward.",
      "Keep the elbows comfortably supported."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: [
        "sets",
        "weight",
        "distance",
        "duration_seconds",
        "side",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "overhead_carry",
    name: "Overhead Carry",
    aliases: [
      "waiter carry",
      "overhead walk",
      "dumbbell overhead carry",
      "kettlebell overhead carry"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: [
      "full_body",
      "shoulders",
      "core",
      "forearms"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "serratus_anterior",
      "trapezius_upper",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: [
      "loaded_carry",
      "walking",
      "anti_lateral_flexion"
    ],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "overhead_stability",
      label: "Shoulders + Core"
    },
    substitutionGroup: "loaded_carry",
    substitutions: [
      "front_rack_carry",
      "farmers_carry",
      "suitcase_carry"
    ],
    laterality: "unilateral_or_bilateral",
    setup: "overhead_walking",
    goals: {
      core_strength: 9,
      upper_body_strength: 8,
      athletic_performance: 9,
      general_fitness: 8
    },
    summary:
      "Walk while holding one or two weights overhead and maintaining shoulder and trunk stability.",
    instructions: [
      "Press the weight overhead.",
      "Stabilize the shoulder and brace the trunk.",
      "Walk for the planned distance or time.",
      "Lower the weight safely."
    ],
    cues: [
      "Keep the arm stacked over the shoulder.",
      "Avoid leaning away from the load.",
      "Use a weight you can control overhead."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: [
        "sets",
        "weight",
        "distance",
        "duration_seconds",
        "side",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // SLED WORK
  // ===================================================
  {
    id: "sled_push",
    name: "Sled Push",
    aliases: [
      "prowler push",
      "sled drive",
      "prowler sled push"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength", "conditioning"],
    bodyParts: [
      "full_body",
      "lower_body",
      "quadriceps",
      "glutes",
      "calves",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "gastrocnemius",
      "soleus",
      "transversus_abdominis"
    ],
    movementPatterns: ["walking", "conditioning_circuit"],
    equipment: ["sled"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "full_body_drive",
      label: "Leg Drive + Conditioning"
    },
    substitutionGroup: "sled_work",
    substitutions: [
      "sled_drag",
      "stair_climber",
      "incline_treadmill_walk"
    ],
    laterality: "alternating",
    setup: "sled_push",
    goals: {
      strength: 9,
      lower_body_strength: 9,
      athletic_performance: 10,
      cardio: 8,
      general_fitness: 9
    },
    summary:
      "Drive a weighted sled forward using repeated powerful steps.",
    instructions: [
      "Load the sled appropriately.",
      "Grip the handles and lean into a strong body angle.",
      "Drive through the floor with short powerful steps.",
      "Continue for the planned distance."
    ],
    cues: [
      "Keep pushing through the legs.",
      "Maintain a strong trunk position.",
      "Use shorter steps as the load gets heavier."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: [
        "sets",
        "weight",
        "distance",
        "duration_seconds",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "sled_drag",
    name: "Sled Drag",
    aliases: [
      "sled pull",
      "backward sled drag",
      "weighted sled drag"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength", "conditioning"],
    bodyParts: [
      "full_body",
      "lower_body",
      "quadriceps",
      "glutes",
      "calves"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["walking", "conditioning_circuit"],
    equipment: ["sled", "strap"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "sled_conditioning",
      label: "Quads + Conditioning"
    },
    substitutionGroup: "sled_work",
    substitutions: [
      "sled_push",
      "walking_general",
      "stair_climber"
    ],
    laterality: "alternating",
    setup: "sled_drag",
    goals: {
      lower_body_strength: 8,
      athletic_performance: 9,
      cardio: 7,
      general_fitness: 9
    },
    summary:
      "Drag a weighted sled using forward or backward walking while maintaining continuous leg drive.",
    instructions: [
      "Attach the strap or handles securely.",
      "Take up tension in the sled.",
      "Walk steadily while dragging the load.",
      "Continue for the planned distance."
    ],
    cues: [
      "Keep consistent tension on the sled.",
      "Use controlled steps.",
      "Stay upright during backward drags."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: [
        "sets",
        "weight",
        "distance",
        "duration_seconds",
        "direction",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // KETTLEBELL
  // ===================================================
  {
    id: "kettlebell_swing",
    name: "Kettlebell Swing",
    aliases: [
      "kb swing",
      "russian kettlebell swing",
      "two hand kettlebell swing"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength", "power", "conditioning"],
    bodyParts: [
      "full_body",
      "glutes",
      "hamstrings",
      "core",
      "shoulders"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "erector_spinae",
      "transversus_abdominis",
      "anterior_deltoid"
    ],
    movementPatterns: ["hip_hinge", "conditioning_circuit"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "explosive_hip_extension",
      label: "Glutes + Hamstrings + Power"
    },
    substitutionGroup: "kettlebell_power",
    substitutions: [
      "kettlebell_deadlift",
      "medicine_ball_slam",
      "sled_push"
    ],
    laterality: "bilateral",
    setup: "standing_kettlebell",
    goals: {
      athletic_performance: 10,
      strength: 8,
      lower_body_strength: 8,
      cardio: 8,
      general_fitness: 9
    },
    summary:
      "Use explosive hip extension to swing a kettlebell forward while keeping the arms relatively relaxed.",
    instructions: [
      "Begin with the kettlebell slightly in front of the feet.",
      "Hike it back between the legs.",
      "Drive the hips forward powerfully.",
      "Allow the kettlebell to float before guiding it back."
    ],
    cues: [
      "Think hip hinge, not squat.",
      "Do not lift the kettlebell with the shoulders.",
      "Keep the spine controlled."
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
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "kettlebell_deadlift",
    name: "Kettlebell Deadlift",
    aliases: [
      "kb deadlift",
      "kettlebell hinge",
      "two hand kettlebell deadlift"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: [
      "lower_body",
      "glutes",
      "hamstrings",
      "back",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "semitendinosus",
      "semimembranosus"
    ],
    secondaryMuscles: [
      "erector_spinae",
      "forearm_flexors"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["kettlebell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "posterior_chain",
      label: "Glutes + Hamstrings"
    },
    substitutionGroup: "functional_hinge",
    substitutions: [
      "kettlebell_swing",
      "dumbbell_romanian_deadlift",
      "romanian_deadlift"
    ],
    laterality: "bilateral",
    setup: "floor_kettlebell",
    goals: {
      strength: 8,
      lower_body_strength: 8,
      general_fitness: 9,
      athletic_performance: 7
    },
    summary:
      "Lift a kettlebell from the floor using a controlled hip hinge.",
    instructions: [
      "Stand with the kettlebell between the feet.",
      "Hinge at the hips and grip the handle.",
      "Drive through the floor and extend the hips.",
      "Lower the kettlebell under control."
    ],
    cues: [
      "Keep the kettlebell close.",
      "Maintain a stable spine.",
      "Finish by standing tall rather than leaning back."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "kettlebell_clean",
    name: "Kettlebell Clean",
    aliases: [
      "kb clean",
      "single arm kettlebell clean"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength", "power"],
    bodyParts: [
      "full_body",
      "glutes",
      "hamstrings",
      "shoulders",
      "forearms",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "forearm_flexors",
      "trapezius_upper",
      "transversus_abdominis"
    ],
    movementPatterns: ["hip_hinge"],
    equipment: ["kettlebell"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "full_body_power",
      label: "Full-Body Power"
    },
    substitutionGroup: "kettlebell_power",
    substitutions: [
      "kettlebell_swing",
      "kettlebell_clean_and_press"
    ],
    laterality: "unilateral",
    setup: "standing_kettlebell",
    goals: {
      athletic_performance: 10,
      strength: 8,
      upper_body_strength: 6,
      lower_body_strength: 8
    },
    summary:
      "Use hip power to guide a kettlebell from below the hips into the front-rack position.",
    instructions: [
      "Begin with the kettlebell in one hand.",
      "Hinge and load the hips.",
      "Drive through the hips and guide the kettlebell upward.",
      "Receive it softly in the rack position."
    ],
    cues: [
      "Keep the kettlebell close to the body.",
      "Avoid letting the bell crash onto the forearm.",
      "Use hip power rather than an arm curl."
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
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "kettlebell_clean_and_press",
    name: "Kettlebell Clean and Press",
    aliases: [
      "kb clean and press",
      "kettlebell clean press",
      "single arm kettlebell clean and press"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength", "power"],
    bodyParts: [
      "full_body",
      "glutes",
      "hamstrings",
      "shoulders",
      "triceps",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "anterior_deltoid",
      "triceps_brachii"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "transversus_abdominis",
      "trapezius_upper"
    ],
    movementPatterns: ["hip_hinge", "vertical_push"],
    equipment: ["kettlebell"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "full_body_strength_power",
      label: "Full-Body Strength"
    },
    substitutionGroup: "kettlebell_power",
    substitutions: [
      "kettlebell_clean",
      "single_arm_dumbbell_shoulder_press",
      "kettlebell_swing"
    ],
    laterality: "unilateral",
    setup: "standing_kettlebell",
    goals: {
      athletic_performance: 10,
      strength: 9,
      upper_body_strength: 9,
      lower_body_strength: 8,
      general_fitness: 8
    },
    summary:
      "Clean a kettlebell to the rack position, then press it overhead.",
    instructions: [
      "Clean the kettlebell smoothly to the shoulder.",
      "Brace the trunk.",
      "Press the kettlebell overhead.",
      "Lower to the rack and repeat."
    ],
    cues: [
      "Keep the wrist stacked.",
      "Do not overextend the lower back.",
      "Maintain control between the clean and press."
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
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BATTLE ROPES
  // ===================================================
  {
    id: "battle_rope_alternating_waves",
    name: "Battle Rope Alternating Waves",
    aliases: [
      "battle ropes",
      "alternating rope waves",
      "rope waves"
    ],
    category: "functional",
    exerciseTypes: ["functional", "conditioning", "cardio"],
    bodyParts: [
      "full_body",
      "shoulders",
      "arms",
      "core"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "lateral_deltoid",
      "triceps_brachii"
    ],
    secondaryMuscles: [
      "biceps_brachii",
      "transversus_abdominis",
      "forearm_flexors"
    ],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["battle_ropes"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "anterior_deltoid",
      region: "upper_body_conditioning",
      label: "Shoulders + Conditioning"
    },
    substitutionGroup: "battle_ropes",
    substitutions: [
      "battle_rope_double_slams",
      "jump_rope_intervals",
      "cardio_circuit"
    ],
    laterality: "alternating",
    setup: "standing_battle_rope",
    goals: {
      cardio: 9,
      endurance: 8,
      general_fitness: 9,
      athletic_performance: 8,
      upper_body_strength: 6
    },
    summary:
      "Create alternating waves with heavy ropes for upper-body and cardiovascular conditioning.",
    instructions: [
      "Stand in an athletic stance holding one rope end in each hand.",
      "Brace the trunk.",
      "Alternate the arms rapidly to create waves.",
      "Continue for the planned work interval."
    ],
    cues: [
      "Keep the knees softly bent.",
      "Maintain a steady rhythm.",
      "Use the whole body without excessive torso movement."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "battle_rope_double_slams",
    name: "Battle Rope Double Slams",
    aliases: [
      "rope slams",
      "battle rope slams",
      "double rope slam"
    ],
    category: "functional",
    exerciseTypes: ["functional", "conditioning", "power"],
    bodyParts: [
      "full_body",
      "shoulders",
      "arms",
      "core"
    ],
    primaryMuscles: [
      "anterior_deltoid",
      "latissimus_dorsi",
      "rectus_abdominis"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "gluteus_maximus",
      "forearm_flexors"
    ],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["battle_ropes"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "full_body_power_conditioning",
      label: "Full-Body Conditioning"
    },
    substitutionGroup: "battle_ropes",
    substitutions: [
      "battle_rope_alternating_waves",
      "medicine_ball_slam"
    ],
    laterality: "bilateral",
    setup: "standing_battle_rope",
    goals: {
      cardio: 9,
      athletic_performance: 9,
      general_fitness: 9,
      upper_body_strength: 7,
      core_strength: 7
    },
    summary:
      "Raise both rope ends and slam them forcefully toward the floor in repeated intervals.",
    instructions: [
      "Stand in an athletic position.",
      "Raise both rope ends.",
      "Drive the ropes forcefully toward the floor.",
      "Repeat for the planned interval."
    ],
    cues: [
      "Use the hips and trunk with the arms.",
      "Reset your posture between slams."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // MEDICINE BALL POWER
  // ===================================================
  {
    id: "medicine_ball_slam",
    name: "Medicine Ball Slam",
    aliases: [
      "med ball slam",
      "medicine ball slams",
      "overhead ball slam"
    ],
    category: "functional",
    exerciseTypes: ["functional", "power", "conditioning"],
    bodyParts: [
      "full_body",
      "core",
      "shoulders",
      "back"
    ],
    primaryMuscles: [
      "latissimus_dorsi",
      "rectus_abdominis",
      "anterior_deltoid"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "gluteus_maximus",
      "transversus_abdominis"
    ],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["medicine_ball"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "full_body_power",
      label: "Core + Full-Body Power"
    },
    substitutionGroup: "medicine_ball_power",
    substitutions: [
      "battle_rope_double_slams",
      "kettlebell_swing",
      "medicine_ball_rotation"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      athletic_performance: 10,
      core_strength: 8,
      cardio: 8,
      general_fitness: 9
    },
    summary:
      "Raise a medicine ball overhead and slam it forcefully into the floor.",
    instructions: [
      "Stand with the medicine ball held securely.",
      "Raise the ball overhead.",
      "Drive the ball down toward the floor.",
      "Recover it safely and repeat."
    ],
    cues: [
      "Use a ball designed for slamming.",
      "Keep the movement powerful but controlled."
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
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "medicine_ball_chest_pass",
    name: "Medicine Ball Chest Pass",
    aliases: [
      "med ball chest pass",
      "medicine ball wall pass",
      "explosive chest pass"
    ],
    category: "functional",
    exerciseTypes: ["functional", "power"],
    bodyParts: [
      "chest",
      "shoulders",
      "triceps",
      "core",
      "upper_body"
    ],
    primaryMuscles: [
      "pectoralis_major",
      "anterior_deltoid",
      "triceps_brachii"
    ],
    secondaryMuscles: [
      "serratus_anterior",
      "transversus_abdominis"
    ],
    movementPatterns: ["horizontal_push"],
    equipment: ["medicine_ball", "wall"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "upper_body_power",
      label: "Chest + Power"
    },
    substitutionGroup: "medicine_ball_power",
    substitutions: [
      "medicine_ball_rotation",
      "medicine_ball_slam"
    ],
    laterality: "bilateral",
    setup: "standing_wall",
    goals: {
      athletic_performance: 10,
      upper_body_strength: 7,
      strength: 6,
      speed: 8
    },
    summary:
      "Explosively throw a medicine ball forward from chest level.",
    instructions: [
      "Stand facing a sturdy wall.",
      "Hold the ball at the chest.",
      "Push explosively through the arms.",
      "Catch or recover the ball safely."
    ],
    cues: [
      "Use a stable stance.",
      "Throw with intent while maintaining control."
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
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // AGILITY / ATHLETIC FOOTWORK
  // ===================================================
  {
    id: "agility_ladder",
    name: "Agility Ladder",
    aliases: [
      "ladder drills",
      "agility ladder drills",
      "speed ladder"
    ],
    category: "functional",
    exerciseTypes: ["functional", "speed", "conditioning"],
    bodyParts: [
      "full_body",
      "lower_body",
      "calves",
      "hips"
    ],
    primaryMuscles: [
      "gastrocnemius",
      "soleus",
      "gluteus_medius"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: [
      "walking",
      "running",
      "balance"
    ],
    equipment: ["agility_ladder"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "footwork_coordination",
      label: "Agility + Coordination"
    },
    substitutionGroup: "agility",
    substitutions: [
      "cone_shuttle",
      "lateral_shuffle"
    ],
    laterality: "mixed",
    setup: "agility_ladder",
    goals: {
      athletic_performance: 10,
      speed: 9,
      general_fitness: 8,
      cardio: 7,
      balance: 8
    },
    summary:
      "Perform quick footwork patterns through an agility ladder.",
    instructions: [
      "Choose the planned ladder pattern.",
      "Move through the ladder with controlled foot placement.",
      "Walk back to recover if needed.",
      "Repeat for the assigned rounds."
    ],
    cues: [
      "Prioritize clean foot placement over speed.",
      "Stay light on the feet."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "cone_shuttle",
    name: "Cone Shuttle",
    aliases: [
      "shuttle run",
      "cone drill",
      "suicide drill",
      "shuttle sprint"
    ],
    category: "functional",
    exerciseTypes: ["functional", "speed", "conditioning"],
    bodyParts: [
      "full_body",
      "lower_body",
      "glutes",
      "hamstrings",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "gastrocnemius"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "gluteus_medius"
    ],
    movementPatterns: [
      "running",
      "sprint"
    ],
    equipment: ["cones"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "change_of_direction",
      label: "Speed + Change of Direction"
    },
    substitutionGroup: "agility",
    substitutions: [
      "agility_ladder",
      "lateral_shuffle",
      "sprint_intervals"
    ],
    laterality: "mixed",
    setup: "cone_course",
    goals: {
      athletic_performance: 10,
      speed: 10,
      cardio: 8,
      general_fitness: 8
    },
    summary:
      "Sprint between marked cones with repeated accelerations, decelerations, and direction changes.",
    instructions: [
      "Set cones at the planned distances.",
      "Accelerate toward the first cone.",
      "Decelerate under control and change direction.",
      "Repeat the shuttle pattern."
    ],
    cues: [
      "Lower the center of mass before changing direction.",
      "Use controlled deceleration."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "lateral_shuffle",
    name: "Lateral Shuffle",
    aliases: [
      "side shuffle",
      "defensive slide",
      "lateral movement drill"
    ],
    category: "functional",
    exerciseTypes: ["functional", "speed", "conditioning"],
    bodyParts: [
      "lower_body",
      "glutes",
      "hips",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_medius",
      "gluteus_minimus"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["walking", "balance"],
    equipment: ["none", "cones"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_movement",
      label: "Lateral Agility"
    },
    substitutionGroup: "agility",
    substitutions: [
      "agility_ladder",
      "cone_shuttle"
    ],
    laterality: "bilateral",
    setup: "lateral_movement",
    goals: {
      athletic_performance: 10,
      speed: 8,
      lower_body_strength: 6,
      general_fitness: 8
    },
    summary:
      "Move quickly side to side while maintaining an athletic stance.",
    instructions: [
      "Take a slight athletic stance.",
      "Push through the outside foot to move laterally.",
      "Keep the feet from crossing unless the drill requires it.",
      "Reverse direction under control."
    ],
    cues: [
      "Stay low enough to change direction quickly.",
      "Keep the knees tracking over the feet."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BOX / STEP POWER
  // ===================================================
  {
    id: "box_jump",
    name: "Box Jump",
    aliases: [
      "box jumps",
      "jump to box",
      "plyo box jump"
    ],
    category: "functional",
    exerciseTypes: ["functional", "power", "plyometric"],
    bodyParts: [
      "lower_body",
      "glutes",
      "quadriceps",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "gastrocnemius"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "soleus"
    ],
    movementPatterns: ["jump"],
    equipment: ["box"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "lower_body_power",
      label: "Explosive Leg Power"
    },
    substitutionGroup: "jump_power",
    substitutions: [
      "squat_jump",
      "broad_jump",
      "step_up"
    ],
    laterality: "bilateral",
    setup: "plyo_box",
    goals: {
      athletic_performance: 10,
      speed: 8,
      lower_body_strength: 8,
      strength: 7
    },
    summary:
      "Jump from the floor onto a stable box and land under control.",
    instructions: [
      "Stand facing a stable box.",
      "Dip slightly through the hips and knees.",
      "Jump onto the box.",
      "Land softly and stand tall."
    ],
    cues: [
      "Choose a box height you can land on safely.",
      "Step down instead of repeatedly jumping down when appropriate."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "box_height",
        "rest_seconds"
      ]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "squat_jump",
    name: "Squat Jump",
    aliases: [
      "jump squat",
      "bodyweight jump squat",
      "squat jumps"
    ],
    category: "functional",
    exerciseTypes: ["functional", "power", "plyometric"],
    bodyParts: [
      "lower_body",
      "glutes",
      "quadriceps",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "gastrocnemius"
    ],
    secondaryMuscles: [
      "vastus_lateralis",
      "vastus_medialis",
      "soleus"
    ],
    movementPatterns: ["jump", "squat"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "vertical_power",
      label: "Explosive Leg Power"
    },
    substitutionGroup: "jump_power",
    substitutions: [
      "box_jump",
      "broad_jump"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      athletic_performance: 10,
      lower_body_strength: 7,
      speed: 8,
      general_fitness: 8
    },
    summary:
      "Jump vertically from a squat position and land softly before the next repetition.",
    instructions: [
      "Stand with the feet in a comfortable squat stance.",
      "Dip through the hips and knees.",
      "Jump vertically.",
      "Land softly and reset."
    ],
    cues: [
      "Keep landings quiet and controlled.",
      "Do not chase height if landing quality drops."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "broad_jump",
    name: "Broad Jump",
    aliases: [
      "standing broad jump",
      "horizontal jump",
      "standing long jump"
    ],
    category: "functional",
    exerciseTypes: ["functional", "power", "plyometric"],
    bodyParts: [
      "lower_body",
      "glutes",
      "hamstrings",
      "quadriceps",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris",
      "gastrocnemius"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "soleus"
    ],
    movementPatterns: ["jump"],
    equipment: ["none"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "horizontal_power",
      label: "Horizontal Power"
    },
    substitutionGroup: "jump_power",
    substitutions: [
      "box_jump",
      "squat_jump"
    ],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      athletic_performance: 10,
      speed: 9,
      lower_body_strength: 8
    },
    summary:
      "Jump forward for distance using explosive hip, knee, and ankle extension.",
    instructions: [
      "Stand with the feet about hip-width apart.",
      "Load the hips and swing the arms.",
      "Jump forward powerfully.",
      "Land softly with the knees and hips bent."
    ],
    cues: [
      "Prioritize a stable landing.",
      "Use clear open space."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "distance",
        "rest_seconds"
      ]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BODYWEIGHT CONDITIONING
  // ===================================================
  {
    id: "burpee",
    name: "Burpee",
    aliases: [
      "burpees",
      "bodyweight burpee"
    ],
    category: "functional",
    exerciseTypes: ["functional", "conditioning", "cardio"],
    bodyParts: [
      "full_body",
      "chest",
      "shoulders",
      "triceps",
      "core",
      "lower_body"
    ],
    primaryMuscles: [
      "pectoralis_major",
      "anterior_deltoid",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "triceps_brachii",
      "rectus_abdominis",
      "rectus_femoris"
    ],
    movementPatterns: [
      "horizontal_push",
      "squat",
      "jump",
      "conditioning_circuit"
    ],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: null,
      region: "full_body_conditioning",
      label: "Full-Body Conditioning"
    },
    substitutionGroup: "bodyweight_conditioning",
    substitutions: [
      "mountain_climber",
      "cardio_circuit",
      "jump_rope_intervals"
    ],
    laterality: "bilateral",
    setup: "floor_standing",
    goals: {
      cardio: 10,
      general_fitness: 10,
      athletic_performance: 8,
      fat_loss_support: 9,
      core_strength: 6
    },
    summary:
      "Move from standing to the floor and back up in a repeated full-body conditioning sequence.",
    instructions: [
      "Squat down and place the hands on the floor.",
      "Step or jump the feet back into a plank.",
      "Return the feet beneath the body.",
      "Stand or jump to finish the repetition."
    ],
    cues: [
      "Scale the jump or push-up portion as needed.",
      "Maintain trunk control in the plank."
    ],
    logging: {
      type: "sets_reps",
      fields: [
        "sets",
        "reps",
        "rest_seconds"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "mountain_climber",
    name: "Mountain Climber",
    aliases: [
      "mountain climbers",
      "running plank",
      "plank knee drives"
    ],
    category: "functional",
    exerciseTypes: ["functional", "conditioning", "cardio", "core"],
    bodyParts: [
      "full_body",
      "core",
      "shoulders",
      "hips",
      "lower_body"
    ],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis",
      "iliopsoas"
    ],
    secondaryMuscles: [
      "anterior_deltoid",
      "rectus_femoris",
      "serratus_anterior"
    ],
    movementPatterns: [
      "anti_extension",
      "conditioning_circuit"
    ],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "core_conditioning",
      label: "Core + Cardio"
    },
    substitutionGroup: "bodyweight_conditioning",
    substitutions: [
      "burpee",
      "plank_shoulder_tap",
      "cardio_circuit"
    ],
    laterality: "alternating",
    setup: "high_plank",
    goals: {
      cardio: 8,
      core_strength: 8,
      general_fitness: 9,
      athletic_performance: 7
    },
    summary:
      "Alternate driving the knees toward the torso from a high plank position.",
    instructions: [
      "Begin in a high plank.",
      "Drive one knee toward the chest.",
      "Return it and alternate legs.",
      "Continue at the planned pace."
    ],
    cues: [
      "Keep the hips from bouncing excessively.",
      "Push the floor away with the hands."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "reps",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  FUNCTIONAL_EXERCISES
};

export default FUNCTIONAL_EXERCISES;
