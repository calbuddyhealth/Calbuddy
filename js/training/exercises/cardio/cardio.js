// =====================================================
// ARI REBIRTH
// File: js/training/exercises/cardio/cardio.js
// Version: 1.0.0
// Purpose:
//   Cardio, endurance, running, cycling, rowing, and
//   conditioning exercise data for the ARI Training
//   Exercise Registry.
//
// Design:
//   - Preserves existing cardio exercise IDs already used
//     by ARI Training and workout plans.
//   - Supports duration, distance, pace, incline, resistance,
//     intervals, and intensity-based logging.
//   - Uses movement-pattern IDs already available in
//     movement-patterns.js.
//   - Includes energyProfile metadata for calorie estimation.
//   - Adds aliases, substitutions, setup, and goal metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/cardio/cardio";

const CARDIO_EXERCISES = Object.freeze([
  // ===================================================
  // WALKING
  // ===================================================
  {
    id: "walking_general",
    name: "Walking",
    aliases: [
      "walk",
      "general walking",
      "casual walk",
      "brisk walk"
    ],
    category: "cardio",
    exerciseTypes: ["walking", "cardio", "endurance"],
    bodyParts: [
      "full_body",
      "lower_body",
      "glutes",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["walking"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "aerobic_base",
      label: "Low-Impact Cardio"
    },
    substitutionGroup: "walking_cardio",
    substitutions: [
      "treadmill_walk",
      "incline_treadmill_walk",
      "elliptical_trainer"
    ],
    laterality: "alternating",
    setup: "walking",
    goals: {
      general_fitness: 10,
      cardio: 7,
      endurance: 7,
      fat_loss_support: 8,
      recovery: 8
    },
    summary:
      "Walk at a comfortable to brisk pace for time or distance.",
    instructions: [
      "Choose a sustainable walking pace.",
      "Maintain an upright posture.",
      "Use a natural arm swing.",
      "Progress duration or pace gradually."
    ],
    cues: [
      "Keep the effort appropriate for the session.",
      "Use comfortable footwear."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "treadmill_walk",
    name: "Treadmill Walk",
    aliases: [
      "walking treadmill",
      "treadmill walking",
      "indoor walk"
    ],
    category: "cardio",
    exerciseTypes: ["walking", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "glutes",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "biceps_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["walking"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "aerobic_base",
      label: "Walking Cardio"
    },
    substitutionGroup: "walking_cardio",
    substitutions: [
      "walking_general",
      "incline_treadmill_walk",
      "elliptical_trainer"
    ],
    laterality: "alternating",
    setup: "treadmill",
    goals: {
      general_fitness: 10,
      cardio: 7,
      endurance: 7,
      fat_loss_support: 8,
      recovery: 8
    },
    summary:
      "Walk on a treadmill at a selected speed and incline.",
    instructions: [
      "Step onto the treadmill safely.",
      "Begin at a comfortable speed.",
      "Adjust incline and speed for the planned effort.",
      "Reduce speed gradually before finishing."
    ],
    cues: [
      "Avoid holding the rails unless needed for safety.",
      "Keep a natural walking stride."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "incline_treadmill_walk",
    name: "Incline Treadmill Walk",
    aliases: [
      "incline walk",
      "incline treadmill",
      "hill treadmill walk",
      "12 3 30"
    ],
    category: "cardio",
    exerciseTypes: ["walking", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "glutes",
      "calves",
      "hamstrings"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris"
    ],
    movementPatterns: ["walking"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "incline_cardio",
      label: "Glutes + Cardio"
    },
    substitutionGroup: "walking_cardio",
    substitutions: [
      "treadmill_walk",
      "stair_climber",
      "elliptical_trainer"
    ],
    laterality: "alternating",
    setup: "incline_treadmill",
    goals: {
      cardio: 9,
      endurance: 9,
      general_fitness: 9,
      fat_loss_support: 9,
      glute_development: 6
    },
    summary:
      "Walk on an incline treadmill to increase cardiovascular and lower-body demand without running.",
    instructions: [
      "Begin at a manageable incline and speed.",
      "Maintain a steady walking rhythm.",
      "Adjust incline or pace to match the planned effort.",
      "Cool down on a lower incline."
    ],
    cues: [
      "Avoid hanging on the handrails.",
      "Shorten the stride if the incline becomes steep."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // RUNNING
  // ===================================================
  {
    id: "easy_run",
    name: "Easy Run",
    aliases: [
      "easy running",
      "easy jog",
      "aerobic run",
      "conversational run"
    ],
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: [
      "full_body",
      "lower_body",
      "glutes",
      "calves",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "aerobic_running",
      label: "Aerobic Running"
    },
    substitutionGroup: "steady_run",
    substitutions: [
      "treadmill_run",
      "tempo_run",
      "walking_general"
    ],
    laterality: "alternating",
    setup: "running",
    goals: {
      running: 10,
      cardio: 9,
      endurance: 9,
      general_fitness: 8,
      fat_loss_support: 7
    },
    summary:
      "Run at a comfortable conversational effort intended to build aerobic capacity and easy mileage.",
    instructions: [
      "Begin with an easy warm-up.",
      "Settle into a pace you can sustain comfortably.",
      "Keep the effort controlled rather than racing.",
      "Cool down gradually."
    ],
    cues: [
      "Keep the pace easy enough for relaxed breathing.",
      "Increase volume gradually."
    ],
    logging: {
      type: "duration_distance_pace",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "treadmill_run",
    name: "Treadmill Run",
    aliases: [
      "treadmill running",
      "indoor run",
      "treadmill jog"
    ],
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: [
      "full_body",
      "lower_body",
      "glutes",
      "calves",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["running"],
    equipment: ["treadmill"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "steady_running",
      label: "Running"
    },
    substitutionGroup: "steady_run",
    substitutions: [
      "easy_run",
      "tempo_run",
      "running_intervals"
    ],
    laterality: "alternating",
    setup: "treadmill",
    goals: {
      running: 10,
      cardio: 9,
      endurance: 9,
      general_fitness: 8
    },
    summary:
      "Run on a treadmill at a selected pace and incline.",
    instructions: [
      "Start the treadmill at an easy speed.",
      "Build gradually to the planned running pace.",
      "Maintain the planned duration or distance.",
      "Reduce speed gradually before stepping off."
    ],
    cues: [
      "Run near the center of the belt.",
      "Avoid holding the rails while running."
    ],
    logging: {
      type: "duration_distance_pace",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "tempo_run",
    name: "Tempo Run",
    aliases: [
      "threshold run",
      "tempo running",
      "comfortably hard run"
    ],
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: [
      "full_body",
      "lower_body",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "threshold_running",
      label: "Threshold Cardio"
    },
    substitutionGroup: "steady_run",
    substitutions: [
      "easy_run",
      "running_intervals",
      "treadmill_run"
    ],
    laterality: "alternating",
    setup: "running",
    goals: {
      running: 10,
      endurance: 10,
      cardio: 10,
      speed: 7,
      athletic_performance: 8
    },
    summary:
      "Run at a sustained, comfortably hard pace that is faster than an easy run but slower than an all-out effort.",
    instructions: [
      "Warm up at an easy pace.",
      "Run the planned tempo segment at a controlled hard effort.",
      "Keep the pace steady.",
      "Cool down afterward."
    ],
    cues: [
      "Avoid starting too fast.",
      "The effort should feel challenging but repeatable."
    ],
    logging: {
      type: "duration_distance_pace",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "speed",
        "incline",
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
    id: "running_intervals",
    name: "Running Intervals",
    aliases: [
      "run intervals",
      "interval running",
      "track intervals",
      "treadmill intervals"
    ],
    category: "cardio",
    exerciseTypes: ["running", "hiit", "speed"],
    bodyParts: [
      "full_body",
      "lower_body",
      "core"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "rectus_femoris",
      "tibialis_anterior"
    ],
    movementPatterns: ["running", "sprint"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "interval_running",
      label: "Speed + Cardio"
    },
    substitutionGroup: "interval_cardio",
    substitutions: [
      "sprint_intervals",
      "bike_intervals",
      "rowing_intervals"
    ],
    laterality: "alternating",
    setup: "running_intervals",
    goals: {
      running: 10,
      speed: 10,
      cardio: 10,
      endurance: 8,
      athletic_performance: 9
    },
    summary:
      "Alternate faster running intervals with planned recovery periods to train speed and cardiovascular capacity.",
    instructions: [
      "Warm up thoroughly.",
      "Complete the planned faster interval.",
      "Recover at an easy jog or walk.",
      "Repeat for the programmed number of rounds."
    ],
    cues: [
      "Keep interval pace consistent.",
      "Use enough recovery to preserve running quality."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "pace",
        "speed",
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
    id: "sprint_intervals",
    name: "Sprint Intervals",
    aliases: [
      "sprints",
      "sprint workout",
      "running sprints",
      "sprint repeats"
    ],
    category: "cardio",
    exerciseTypes: ["running", "hiit", "speed"],
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
      "soleus",
      "tibialis_anterior"
    ],
    movementPatterns: ["sprint", "running"],
    equipment: ["none", "treadmill"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "sprint_power",
      label: "Speed + Power"
    },
    substitutionGroup: "interval_cardio",
    substitutions: [
      "running_intervals",
      "bike_intervals",
      "rowing_intervals"
    ],
    laterality: "alternating",
    setup: "sprint",
    goals: {
      speed: 10,
      cardio: 9,
      athletic_performance: 10,
      running: 10,
      endurance: 7
    },
    summary:
      "Perform repeated high-speed running efforts separated by recovery periods.",
    instructions: [
      "Warm up thoroughly before sprinting.",
      "Accelerate into the planned sprint effort.",
      "Recover fully enough to maintain quality.",
      "Repeat only while mechanics remain controlled."
    ],
    cues: [
      "Do not begin maximal sprinting without a warm-up.",
      "Stop the session if sprint quality deteriorates."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "pace",
        "speed",
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
  // CYCLING
  // ===================================================
  {
    id: "stationary_bike",
    name: "Stationary Bike",
    aliases: [
      "exercise bike",
      "indoor bike",
      "stationary cycling"
    ],
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["cycling"],
    equipment: ["stationary_bike"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "cycling_cardio",
      label: "Cycling"
    },
    substitutionGroup: "cycling_cardio",
    substitutions: [
      "spin_bike",
      "recumbent_bike",
      "outdoor_cycling"
    ],
    laterality: "alternating",
    setup: "stationary_bike",
    goals: {
      cardio: 10,
      endurance: 9,
      general_fitness: 9,
      fat_loss_support: 8,
      recovery: 5
    },
    summary:
      "Pedal a stationary bike at a selected resistance and pace for time, distance, or intervals.",
    instructions: [
      "Adjust the seat to a comfortable pedaling position.",
      "Choose an appropriate resistance.",
      "Maintain the planned cadence and effort.",
      "Cool down gradually."
    ],
    cues: [
      "Avoid excessive rocking at the hips.",
      "Keep the resistance appropriate for the goal."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "speed",
        "resistance",
        "cadence",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "spin_bike",
    name: "Spin Bike",
    aliases: [
      "indoor cycling bike",
      "spin cycling",
      "indoor cycle"
    ],
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["cycling"],
    equipment: ["spin_bike"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "cycling_cardio",
      label: "Indoor Cycling"
    },
    substitutionGroup: "cycling_cardio",
    substitutions: [
      "stationary_bike",
      "outdoor_cycling",
      "bike_intervals"
    ],
    laterality: "alternating",
    setup: "spin_bike",
    goals: {
      cardio: 10,
      endurance: 9,
      general_fitness: 9,
      fat_loss_support: 8
    },
    summary:
      "Cycle on a spin bike using adjustable resistance and cadence.",
    instructions: [
      "Adjust the seat and handlebars.",
      "Begin with manageable resistance.",
      "Maintain the planned cadence.",
      "Adjust resistance according to the session."
    ],
    cues: [
      "Keep the hips stable.",
      "Avoid excessive upper-body tension."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "speed",
        "resistance",
        "cadence",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "recumbent_bike",
    name: "Recumbent Bike",
    aliases: [
      "seated recumbent bike",
      "recumbent cycling"
    ],
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "biceps_femoris"
    ],
    movementPatterns: ["cycling"],
    equipment: ["recumbent_bike"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "low_impact_cardio",
      label: "Low-Impact Cycling"
    },
    substitutionGroup: "cycling_cardio",
    substitutions: [
      "stationary_bike",
      "elliptical_trainer"
    ],
    laterality: "alternating",
    setup: "recumbent_bike",
    goals: {
      cardio: 8,
      endurance: 8,
      general_fitness: 9,
      recovery: 8
    },
    summary:
      "Pedal from a supported recumbent position for lower-impact cardiovascular exercise.",
    instructions: [
      "Adjust the seat so the knees remain slightly bent at full extension.",
      "Select a manageable resistance.",
      "Pedal at the planned effort.",
      "Cool down gradually."
    ],
    cues: [
      "Keep the back supported.",
      "Use a smooth pedal stroke."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "speed",
        "resistance",
        "cadence",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "outdoor_cycling",
    name: "Outdoor Cycling",
    aliases: [
      "bike ride",
      "road cycling",
      "outdoor bike",
      "cycling outdoors"
    ],
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["cycling"],
    equipment: ["bicycle"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "cycling_cardio",
      label: "Cycling"
    },
    substitutionGroup: "cycling_cardio",
    substitutions: [
      "stationary_bike",
      "spin_bike"
    ],
    laterality: "alternating",
    setup: "outdoor_bicycle",
    goals: {
      cardio: 10,
      endurance: 10,
      general_fitness: 9,
      fat_loss_support: 8
    },
    summary:
      "Ride a bicycle outdoors for cardiovascular conditioning, endurance, or recreation.",
    instructions: [
      "Use a properly fitted bicycle and helmet.",
      "Begin at a sustainable pace.",
      "Follow the planned distance or duration.",
      "Adjust effort for terrain and conditions."
    ],
    cues: [
      "Follow local traffic and trail rules.",
      "Maintain awareness of surroundings."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "speed",
        "pace",
        "elevation_gain",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "bike_intervals",
    name: "Bike Intervals",
    aliases: [
      "cycling intervals",
      "stationary bike intervals",
      "spin intervals",
      "bike hiit"
    ],
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "hiit"],
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
      "gastrocnemius"
    ],
    movementPatterns: ["cycling"],
    equipment: ["stationary_bike", "spin_bike"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_femoris",
      region: "cycling_intervals",
      label: "Bike HIIT"
    },
    substitutionGroup: "interval_cardio",
    substitutions: [
      "running_intervals",
      "rowing_intervals",
      "sprint_intervals"
    ],
    laterality: "alternating",
    setup: "stationary_bike_intervals",
    goals: {
      cardio: 10,
      endurance: 9,
      speed: 8,
      athletic_performance: 8,
      fat_loss_support: 9
    },
    summary:
      "Alternate hard cycling efforts with easier recovery intervals.",
    instructions: [
      "Warm up at an easy cadence.",
      "Complete the planned hard interval.",
      "Recover at low resistance.",
      "Repeat for the programmed rounds."
    ],
    cues: [
      "Keep the bike stable during hard efforts.",
      "Use resistance that allows controlled cadence."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "resistance",
        "cadence",
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
  // ROWING
  // ===================================================
  {
    id: "rowing_machine",
    name: "Rowing Machine",
    aliases: [
      "rower",
      "indoor row",
      "erg",
      "rowing ergometer"
    ],
    category: "cardio",
    exerciseTypes: ["rowing", "cardio", "endurance"],
    bodyParts: [
      "full_body",
      "back",
      "lower_body",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "gluteus_maximus",
      "latissimus_dorsi"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "biceps_brachii",
      "trapezius_middle",
      "erector_spinae"
    ],
    movementPatterns: ["rowing_cardio"],
    equipment: ["rowing_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "full_body_cardio",
      label: "Full-Body Cardio"
    },
    substitutionGroup: "rowing_cardio",
    substitutions: [
      "rowing_intervals",
      "stationary_bike",
      "elliptical_trainer"
    ],
    laterality: "bilateral",
    setup: "rowing_machine",
    goals: {
      cardio: 10,
      endurance: 10,
      general_fitness: 9,
      athletic_performance: 7
    },
    summary:
      "Use coordinated leg drive, hip movement, and arm pull to produce repeated rowing strokes.",
    instructions: [
      "Begin at the catch with the knees bent and arms extended.",
      "Drive through the legs first.",
      "Open the hips and finish by pulling the handle toward the torso.",
      "Reverse the sequence smoothly to return."
    ],
    cues: [
      "Do not pull hard with the arms before the leg drive.",
      "Keep the stroke smooth and rhythmic."
    ],
    logging: {
      type: "duration_distance_pace",
      fields: [
        "duration_minutes",
        "distance",
        "pace",
        "stroke_rate",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rowing_intervals",
    name: "Rowing Intervals",
    aliases: [
      "row intervals",
      "rowing hiit",
      "erg intervals",
      "rower intervals"
    ],
    category: "cardio",
    exerciseTypes: ["rowing", "cardio", "hiit"],
    bodyParts: [
      "full_body",
      "back",
      "lower_body",
      "core"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "gluteus_maximus",
      "latissimus_dorsi"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "biceps_brachii",
      "trapezius_middle"
    ],
    movementPatterns: ["rowing_cardio"],
    equipment: ["rowing_machine"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "full_body_intervals",
      label: "Rowing HIIT"
    },
    substitutionGroup: "interval_cardio",
    substitutions: [
      "bike_intervals",
      "running_intervals",
      "sprint_intervals"
    ],
    laterality: "bilateral",
    setup: "rowing_intervals",
    goals: {
      cardio: 10,
      endurance: 9,
      athletic_performance: 9,
      fat_loss_support: 9
    },
    summary:
      "Alternate high-effort rowing bouts with easy rowing or rest periods.",
    instructions: [
      "Warm up with easy rowing.",
      "Complete the planned hard rowing interval.",
      "Recover with easy strokes or rest.",
      "Repeat for the programmed rounds."
    ],
    cues: [
      "Maintain stroke quality as intensity rises.",
      "Drive with the legs before pulling with the arms."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "distance",
        "pace",
        "stroke_rate",
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
  // STAIR CLIMBER / STEPPER
  // ===================================================
  {
    id: "stair_climber",
    name: "Stair Climber",
    aliases: [
      "stairmaster",
      "stair machine",
      "stair stepper",
      "steps machine"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: [
      "lower_body",
      "glutes",
      "quadriceps",
      "calves"
    ],
    primaryMuscles: [
      "gluteus_maximus",
      "rectus_femoris",
      "vastus_lateralis",
      "vastus_medialis"
    ],
    secondaryMuscles: [
      "gastrocnemius",
      "soleus",
      "biceps_femoris"
    ],
    movementPatterns: ["stair_climbing"],
    equipment: ["stair_climber"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "stair_cardio",
      label: "Glutes + Cardio"
    },
    substitutionGroup: "step_cardio",
    substitutions: [
      "incline_treadmill_walk",
      "elliptical_trainer",
      "stationary_bike"
    ],
    laterality: "alternating",
    setup: "stair_climber",
    goals: {
      cardio: 9,
      endurance: 9,
      general_fitness: 8,
      fat_loss_support: 8,
      glute_development: 6
    },
    summary:
      "Climb continuously on a stair machine at a controlled pace and resistance level.",
    instructions: [
      "Begin at a manageable speed.",
      "Step fully onto each stair.",
      "Maintain upright posture.",
      "Adjust the level to match the planned intensity."
    ],
    cues: [
      "Avoid hanging heavily on the handrails.",
      "Keep a controlled cadence."
    ],
    logging: {
      type: "duration",
      fields: [
        "duration_minutes",
        "level",
        "steps",
        "floors",
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
  // ELLIPTICAL
  // ===================================================
  {
    id: "elliptical_trainer",
    name: "Elliptical Trainer",
    aliases: [
      "elliptical",
      "cross trainer",
      "elliptical machine"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: [
      "full_body",
      "lower_body"
    ],
    primaryMuscles: [
      "rectus_femoris",
      "gluteus_maximus"
    ],
    secondaryMuscles: [
      "biceps_femoris",
      "gastrocnemius",
      "soleus"
    ],
    movementPatterns: ["elliptical"],
    equipment: ["elliptical"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "low_impact_cardio",
      label: "Low-Impact Cardio"
    },
    substitutionGroup: "low_impact_cardio",
    substitutions: [
      "stationary_bike",
      "walking_general",
      "stair_climber"
    ],
    laterality: "alternating",
    setup: "elliptical",
    goals: {
      cardio: 9,
      endurance: 8,
      general_fitness: 9,
      fat_loss_support: 8,
      recovery: 5
    },
    summary:
      "Use a smooth elliptical stride at a selected resistance and pace for low-impact cardiovascular training.",
    instructions: [
      "Step securely onto the pedals.",
      "Begin at a comfortable resistance.",
      "Use a smooth continuous stride.",
      "Adjust resistance or pace to match the planned effort."
    ],
    cues: [
      "Maintain upright posture.",
      "Avoid relying excessively on the handles for support."
    ],
    logging: {
      type: "duration_distance",
      fields: [
        "duration_minutes",
        "distance",
        "resistance",
        "incline",
        "speed",
        "intensity"
      ]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // JUMP ROPE
  // ===================================================
  {
    id: "jump_rope",
    name: "Jump Rope",
    aliases: [
      "jumping rope",
      "skipping rope",
      "rope skipping"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: [
      "full_body",
      "calves",
      "lower_body",
      "shoulders"
    ],
    primaryMuscles: [
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "gluteus_maximus",
      "anterior_deltoid",
      "forearm_flexors"
    ],
    movementPatterns: ["jump"],
    equipment: ["jump_rope"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "conditioning",
      label: "Cardio + Coordination"
    },
    substitutionGroup: "conditioning_cardio",
    substitutions: [
      "jump_rope_intervals",
      "running_intervals",
      "stair_climber"
    ],
    laterality: "bilateral",
    setup: "standing_jump_rope",
    goals: {
      cardio: 9,
      endurance: 8,
      general_fitness: 9,
      athletic_performance: 8,
      fat_loss_support: 8
    },
    summary:
      "Perform repeated rope jumps at a sustainable rhythm for cardiovascular conditioning.",
    instructions: [
      "Hold the rope handles lightly.",
      "Turn the rope primarily with the wrists.",
      "Use small controlled jumps.",
      "Maintain the planned duration or repetitions."
    ],
    cues: [
      "Land softly.",
      "Keep the jumps low and efficient."
    ],
    logging: {
      type: "duration",
      fields: [
        "duration_minutes",
        "reps",
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
    id: "jump_rope_intervals",
    name: "Jump Rope Intervals",
    aliases: [
      "jump rope hiit",
      "skipping intervals",
      "rope intervals"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "hiit", "endurance"],
    bodyParts: [
      "full_body",
      "calves",
      "lower_body",
      "shoulders"
    ],
    primaryMuscles: [
      "gastrocnemius",
      "soleus"
    ],
    secondaryMuscles: [
      "rectus_femoris",
      "gluteus_maximus",
      "anterior_deltoid"
    ],
    movementPatterns: ["jump", "conditioning_circuit"],
    equipment: ["jump_rope"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gastrocnemius",
      region: "conditioning_intervals",
      label: "Jump Rope HIIT"
    },
    substitutionGroup: "interval_cardio",
    substitutions: [
      "running_intervals",
      "bike_intervals",
      "rowing_intervals"
    ],
    laterality: "bilateral",
    setup: "jump_rope_intervals",
    goals: {
      cardio: 10,
      endurance: 9,
      athletic_performance: 9,
      fat_loss_support: 9
    },
    summary:
      "Alternate faster jump-rope bouts with planned recovery periods.",
    instructions: [
      "Warm up with easy rope skipping.",
      "Complete the planned hard interval.",
      "Recover by resting or jumping slowly.",
      "Repeat for the programmed rounds."
    ],
    cues: [
      "Keep landings soft.",
      "Stop if coordination breaks down."
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
  },

  // ===================================================
  // GENERAL CONDITIONING
  // ===================================================
  {
    id: "cardio_circuit",
    name: "Cardio Circuit",
    aliases: [
      "conditioning circuit",
      "cardio conditioning circuit",
      "mixed cardio circuit"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "hiit", "endurance"],
    bodyParts: ["full_body"],
    primaryMuscles: [],
    secondaryMuscles: [],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["none"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: null,
      region: "full_body_conditioning",
      label: "Full-Body Conditioning"
    },
    substitutionGroup: "conditioning_cardio",
    substitutions: [
      "jump_rope_intervals",
      "running_intervals",
      "bike_intervals",
      "rowing_intervals"
    ],
    laterality: "mixed",
    setup: "circuit",
    goals: {
      cardio: 10,
      endurance: 9,
      general_fitness: 10,
      fat_loss_support: 9,
      athletic_performance: 8
    },
    summary:
      "Combine multiple cardiovascular or bodyweight activities with limited rest for general conditioning.",
    instructions: [
      "Choose the planned circuit activities.",
      "Complete each activity for the assigned time or repetitions.",
      "Use the programmed transition or rest period.",
      "Repeat for the planned rounds."
    ],
    cues: [
      "Maintain movement quality as fatigue increases.",
      "Scale exercises when needed."
    ],
    logging: {
      type: "intervals",
      fields: [
        "rounds",
        "work_seconds",
        "rest_seconds",
        "duration_minutes",
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
  CARDIO_EXERCISES
};

export default CARDIO_EXERCISES;
