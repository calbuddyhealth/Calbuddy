// =====================================================
// ARI REBIRTH
// File: js/training/exercises/sports/surfing.js
// Version: 1.0.0
// Purpose:
//   Surf-specific strength, paddling endurance, balance,
//   mobility, pop-up, and conditioning exercise data
//   for the ARI Training Exercise Registry.
//
// Design:
//   - Built specifically for surfing performance.
//   - Covers paddling, pop-up speed, shoulder endurance,
//     trunk rotation, hip mobility, balance, and conditioning.
//   - Uses existing anatomy and movement-pattern IDs.
//   - Includes logging and energy metadata where useful.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/sports/surfing";

const SURFING_EXERCISES = Object.freeze([
  {
    id: "surf_pop_up",
    name: "Surf Pop-Up",
    aliases: [
      "surfboard pop up",
      "surf pop up drill",
      "surfing get up drill"
    ],
    category: "sports",
    exerciseTypes: ["functional", "speed", "conditioning"],
    bodyParts: ["full_body", "chest", "shoulders", "core", "hips", "lower_body"],
    primaryMuscles: ["pectoralis_major", "triceps_brachii", "rectus_abdominis"],
    secondaryMuscles: ["gluteus_maximus", "rectus_femoris", "anterior_deltoid"],
    movementPatterns: ["horizontal_push", "squat", "conditioning_circuit"],
    equipment: ["bodyweight", "surfboard"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "surf_transition",
      label: "Pop-Up Speed"
    },
    substitutionGroup: "surf_pop_up",
    substitutions: ["burpee", "push_up", "mountain_climber"],
    laterality: "mixed",
    setup: "prone_floor_or_board",
    goals: {
      athletic_performance: 10,
      speed: 9,
      core_strength: 8,
      upper_body_strength: 7,
      general_fitness: 8
    },
    summary:
      "Move quickly from a prone paddling position into a stable surf stance.",
    instructions: [
      "Begin lying prone with hands near the ribs.",
      "Press the upper body away from the board or floor.",
      "Bring the feet underneath the body in one controlled motion.",
      "Land in a balanced surf stance."
    ],
    cues: [
      "Keep the hips low when landing.",
      "Aim for a smooth transition rather than jumping high.",
      "Practice both stance stability and speed."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_paddle_band",
    name: "Surf Paddle Band Pull",
    aliases: [
      "surf paddle exercise",
      "paddle resistance band",
      "surfing dryland paddle"
    ],
    category: "sports",
    exerciseTypes: ["functional", "endurance", "resistance_band"],
    bodyParts: ["back", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "posterior_deltoid", "triceps_brachii"],
    secondaryMuscles: ["serratus_anterior", "transversus_abdominis"],
    movementPatterns: ["vertical_pull"],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "surf_paddling",
      label: "Paddling Strength"
    },
    substitutionGroup: "surf_paddling",
    substitutions: ["swimming_dryland_pull", "straight_arm_pulldown", "lat_pulldown"],
    laterality: "alternating",
    setup: "prone_or_standing_band",
    goals: {
      athletic_performance: 10,
      endurance: 9,
      upper_body_strength: 8,
      general_fitness: 8
    },
    summary:
      "Use resistance bands to simulate repeated surf paddling strokes.",
    instructions: [
      "Anchor the bands securely.",
      "Set the torso in a stable position.",
      "Pull one arm at a time through a paddle-like path.",
      "Continue for repetitions or timed intervals."
    ],
    cues: [
      "Keep the shoulder from shrugging.",
      "Drive through the lats rather than only the arms."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_prone_paddle",
    name: "Prone Surf Paddle",
    aliases: [
      "dryland prone paddle",
      "surf paddle floor drill",
      "swimmer paddle drill"
    ],
    category: "sports",
    exerciseTypes: ["functional", "endurance"],
    bodyParts: ["back", "shoulders", "arms", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "posterior_deltoid", "triceps_brachii"],
    secondaryMuscles: ["erector_spinae", "serratus_anterior"],
    movementPatterns: ["vertical_pull"],
    equipment: ["bodyweight", "surfboard", "bench"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "surf_paddling_endurance",
      label: "Paddling Endurance"
    },
    substitutionGroup: "surf_paddling",
    substitutions: ["surf_paddle_band", "swimming_dryland_pull"],
    laterality: "alternating",
    setup: "prone",
    goals: {
      athletic_performance: 10,
      endurance: 10,
      upper_body_strength: 7,
      recovery: 5
    },
    summary:
      "Perform repeated paddle-like arm strokes from a prone position to train surf-specific endurance.",
    instructions: [
      "Lie prone on a bench, mat, or board.",
      "Lift the chest slightly into a comfortable paddling posture.",
      "Alternate controlled arm strokes.",
      "Continue for the programmed duration."
    ],
    cues: [
      "Keep the neck relaxed.",
      "Avoid excessive lower-back extension."
    ],
    logging: {
      type: "duration",
      fields: ["duration_minutes", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_balance_board",
    name: "Surf Balance Board",
    aliases: [
      "balance board surfing",
      "surf balance trainer",
      "indo board"
    ],
    category: "sports",
    exerciseTypes: ["functional", "balance"],
    bodyParts: ["full_body", "core", "hips", "lower_body"],
    primaryMuscles: ["gluteus_medius", "transversus_abdominis"],
    secondaryMuscles: ["quadratus_lumborum", "gastrocnemius", "soleus"],
    movementPatterns: ["balance"],
    equipment: ["balance_board"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "surf_balance",
      label: "Balance + Board Control"
    },
    substitutionGroup: "surf_balance",
    substitutions: ["single_leg_balance", "bosu_squat", "surf_stance_hold"],
    laterality: "bilateral",
    setup: "balance_board",
    goals: {
      athletic_performance: 10,
      balance: 10,
      core_strength: 8,
      lower_body_strength: 6
    },
    summary:
      "Maintain a stable surf-like stance on a balance board.",
    instructions: [
      "Step onto the board carefully.",
      "Take a comfortable surf stance.",
      "Keep the knees soft.",
      "Maintain balance for the programmed duration."
    ],
    cues: [
      "Use support nearby when learning.",
      "Keep the hips relaxed and responsive."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "stance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_stance_hold",
    name: "Surf Stance Hold",
    aliases: [
      "surf squat hold",
      "surf stance",
      "board stance hold"
    ],
    category: "sports",
    exerciseTypes: ["functional", "balance", "strength"],
    bodyParts: ["lower_body", "glutes", "quadriceps", "core", "hips"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "gluteus_medius"],
    secondaryMuscles: ["transversus_abdominis", "gastrocnemius"],
    movementPatterns: ["squat", "balance"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "surf_stance_endurance",
      label: "Surf Stance Endurance"
    },
    substitutionGroup: "surf_balance",
    substitutions: ["surf_balance_board", "lateral_lunge_mobility"],
    laterality: "stance_specific",
    setup: "surf_stance",
    goals: {
      athletic_performance: 10,
      balance: 9,
      lower_body_strength: 7,
      core_strength: 7
    },
    summary:
      "Hold a low, balanced surf stance to train lower-body and core endurance.",
    instructions: [
      "Take your normal surf stance.",
      "Bend the knees and lower the hips slightly.",
      "Keep the chest balanced over the board line.",
      "Hold for the programmed duration."
    ],
    cues: [
      "Stay relaxed through the hips.",
      "Keep pressure balanced between both feet."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "stance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_rotational_squat",
    name: "Surf Rotational Squat",
    aliases: [
      "surf turn squat",
      "rotational surf squat",
      "board turn drill"
    ],
    category: "sports",
    exerciseTypes: ["functional", "strength", "balance"],
    bodyParts: ["lower_body", "glutes", "core", "hips"],
    primaryMuscles: ["gluteus_maximus", "external_oblique", "gluteus_medius"],
    secondaryMuscles: ["rectus_femoris", "internal_oblique"],
    movementPatterns: ["squat", "trunk_rotation", "balance"],
    equipment: ["bodyweight", "balance_board"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "surf_turning",
      label: "Rotation + Board Control"
    },
    substitutionGroup: "surf_rotation",
    substitutions: ["cable_wood_chop", "medicine_ball_rotation", "surf_stance_hold"],
    laterality: "bilateral_sides",
    setup: "surf_stance",
    goals: {
      athletic_performance: 10,
      balance: 9,
      core_strength: 9,
      lower_body_strength: 8
    },
    summary:
      "Rotate the trunk and hips from a low surf stance to rehearse turning mechanics and board control.",
    instructions: [
      "Begin in a stable surf stance.",
      "Lower slightly through the hips and knees.",
      "Rotate the torso and hips toward one side.",
      "Return to center and repeat."
    ],
    cues: [
      "Keep the knees soft.",
      "Rotate through the hips and trunk together."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_duck_dive_push",
    name: "Surf Duck-Dive Push",
    aliases: [
      "duck dive drill",
      "surf duck dive",
      "duck dive strength drill"
    ],
    category: "sports",
    exerciseTypes: ["functional", "strength"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major", "triceps_brachii", "anterior_deltoid"],
    secondaryMuscles: ["serratus_anterior", "rectus_abdominis"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight", "surfboard"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "pectoralis_major",
      region: "duck_dive_strength",
      label: "Chest + Triceps"
    },
    substitutionGroup: "surf_push",
    substitutions: ["push_up", "close_grip_push_up"],
    laterality: "bilateral",
    setup: "prone_board_or_floor",
    goals: {
      athletic_performance: 9,
      upper_body_strength: 9,
      core_strength: 8
    },
    summary:
      "Practice the pressing and trunk-control portion of a surf duck dive on land.",
    instructions: [
      "Begin prone with hands near the chest.",
      "Press the upper body away from the surface.",
      "Brace the trunk.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders stable.",
      "Avoid excessive lower-back sag."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_shoulders_endurance",
    name: "Surf Shoulder Endurance Circuit",
    aliases: [
      "surf shoulder circuit",
      "paddling shoulder endurance",
      "surf upper body endurance"
    ],
    category: "sports",
    exerciseTypes: ["conditioning", "endurance", "functional"],
    bodyParts: ["shoulders", "back", "arms", "core", "upper_body"],
    primaryMuscles: ["posterior_deltoid", "latissimus_dorsi", "serratus_anterior"],
    secondaryMuscles: ["triceps_brachii", "trapezius_lower", "transversus_abdominis"],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["resistance_band", "light_dumbbells"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "posterior_deltoid",
      region: "paddling_endurance",
      label: "Shoulder Endurance"
    },
    substitutionGroup: "surf_paddling",
    substitutions: ["surf_paddle_band", "surf_prone_paddle"],
    laterality: "mixed",
    setup: "circuit",
    goals: {
      athletic_performance: 10,
      endurance: 10,
      upper_body_strength: 7,
      general_fitness: 8
    },
    summary:
      "Combine light pulling and shoulder-endurance movements to build paddling capacity.",
    instructions: [
      "Choose the planned shoulder and pulling exercises.",
      "Use light resistance.",
      "Move through the circuit with short transitions.",
      "Repeat for the programmed rounds."
    ],
    cues: [
      "Avoid shrugging under fatigue.",
      "Stop before shoulder mechanics deteriorate."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_hip_mobility_flow",
    name: "Surf Hip Mobility Flow",
    aliases: [
      "surf mobility flow",
      "surf hip opener",
      "surfer hip mobility"
    ],
    category: "sports",
    exerciseTypes: ["mobility", "dynamic_stretch"],
    bodyParts: ["hips", "glutes", "adductors", "lower_body"],
    primaryMuscles: ["gluteus_medius", "adductor_magnus", "iliopsoas"],
    secondaryMuscles: ["gluteus_maximus", "tensor_fasciae_latae"],
    movementPatterns: ["mobility", "dynamic_stretch"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "surf_hip_mobility",
      label: "Hip Mobility"
    },
    substitutionGroup: "surf_mobility",
    substitutions: ["hip_90_90", "worlds_greatest_stretch", "lateral_lunge_mobility"],
    laterality: "bilateral_sides",
    setup: "floor_flow",
    goals: {
      mobility: 10,
      flexibility: 9,
      athletic_performance: 9,
      recovery: 8
    },
    summary:
      "Combine hip-rotation and lateral-mobility drills to prepare for a low surf stance.",
    instructions: [
      "Move through controlled hip rotations.",
      "Include a lateral hip-opening position.",
      "Transition slowly between sides.",
      "Repeat for the planned flow duration."
    ],
    cues: [
      "Use a pain-free range.",
      "Keep movements smooth."
    ],
    logging: {
      type: "duration",
      fields: ["duration_minutes"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "surf_paddle_intervals",
    name: "Surf Paddle Intervals",
    aliases: [
      "paddling intervals",
      "surf paddle conditioning",
      "surf paddle hiit"
    ],
    category: "sports",
    exerciseTypes: ["conditioning", "endurance", "cardio"],
    bodyParts: ["back", "shoulders", "arms", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "posterior_deltoid", "triceps_brachii"],
    secondaryMuscles: ["serratus_anterior", "erector_spinae"],
    movementPatterns: ["conditioning_circuit"],
    equipment: ["resistance_band", "surfboard", "paddle_ergometer"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "surf_paddling_conditioning",
      label: "Paddling Conditioning"
    },
    substitutionGroup: "surf_paddling",
    substitutions: ["surf_paddle_band", "surf_prone_paddle", "rowing_intervals"],
    laterality: "alternating",
    setup: "interval_paddling",
    goals: {
      athletic_performance: 10,
      endurance: 10,
      cardio: 9,
      upper_body_strength: 8
    },
    summary:
      "Alternate hard paddling efforts with recovery periods to simulate repeated surf paddling demands.",
    instructions: [
      "Warm up with easy paddle strokes.",
      "Complete the programmed hard interval.",
      "Recover at an easy pace or rest.",
      "Repeat for the planned rounds."
    ],
    cues: [
      "Keep the shoulders depressed and controlled.",
      "Maintain stroke quality as fatigue increases."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "intensity"]
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
  SURFING_EXERCISES
};

export default SURFING_EXERCISES;
