// =====================================================
// ARI REBIRTH
// File: js/training/exercises/sports/sports.js
// Version: 1.0.0
// Purpose:
//   Sport-specific conditioning, agility, power, coordination,
//   and skill-support exercise data for the ARI Training
//   Exercise Registry.
//
// Design:
//   - Covers common athletic training used across field,
//     court, combat, racquet, and recreational sports.
//   - Focuses on trainable drills rather than game-specific
//     skill instruction.
//   - Uses existing anatomy and movement-pattern IDs.
//   - Includes logging and energy metadata for ARI Training.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/sports/sports";

const SPORTS_EXERCISES = Object.freeze([
  {
    id: "soccer_dribbling_drill",
    name: "Soccer Dribbling Drill",
    aliases: ["soccer dribbling", "cone dribbling", "football dribbling"],
    category: "sports",
    exerciseTypes: ["functional", "speed", "conditioning"],
    bodyParts: ["full_body", "lower_body", "calves", "hips"],
    primaryMuscles: ["gastrocnemius", "soleus", "gluteus_medius"],
    secondaryMuscles: ["rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running", "balance"],
    equipment: ["soccer_ball", "cones"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "agility_coordination",
      label: "Agility + Ball Control"
    },
    substitutionGroup: "field_sport_agility",
    substitutions: ["cone_shuttle", "agility_ladder", "lateral_shuffle"],
    laterality: "mixed",
    setup: "cone_course",
    goals: {
      athletic_performance: 10,
      speed: 8,
      cardio: 7,
      balance: 8,
      general_fitness: 8
    },
    summary:
      "Dribble a soccer ball through cones or changing directions to train footwork, coordination, and conditioning.",
    instructions: [
      "Set up a short cone course.",
      "Dribble the ball through the course using controlled touches.",
      "Change direction around each cone.",
      "Repeat at gradually faster speeds."
    ],
    cues: [
      "Keep the ball close.",
      "Stay light on the feet.",
      "Prioritize control before speed."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "basketball_shuttle_drill",
    name: "Basketball Shuttle Drill",
    aliases: ["basketball suicides", "court shuttle", "line drill"],
    category: "sports",
    exerciseTypes: ["speed", "conditioning", "functional"],
    bodyParts: ["full_body", "lower_body", "glutes", "calves"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "rectus_femoris"],
    secondaryMuscles: ["gluteus_medius", "biceps_femoris"],
    movementPatterns: ["running", "sprint"],
    equipment: ["basketball_court"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "change_of_direction",
      label: "Speed + Conditioning"
    },
    substitutionGroup: "court_sport_conditioning",
    substitutions: ["cone_shuttle", "lateral_shuffle", "sprint_intervals"],
    laterality: "mixed",
    setup: "court",
    goals: {
      athletic_performance: 10,
      speed: 10,
      cardio: 9,
      endurance: 8
    },
    summary:
      "Sprint between court lines with repeated acceleration, stopping, and direction changes.",
    instructions: [
      "Start at the baseline.",
      "Sprint to the assigned line and touch it.",
      "Return to the baseline.",
      "Continue through the programmed court distances."
    ],
    cues: [
      "Decelerate under control.",
      "Keep the chest balanced during direction changes."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "tennis_lateral_shuffle_drill",
    name: "Tennis Lateral Shuffle Drill",
    aliases: ["tennis footwork", "court shuffle", "tennis side shuffle"],
    category: "sports",
    exerciseTypes: ["speed", "functional", "conditioning"],
    bodyParts: ["lower_body", "hips", "glutes", "calves"],
    primaryMuscles: ["gluteus_medius", "gluteus_minimus"],
    secondaryMuscles: ["gastrocnemius", "rectus_femoris"],
    movementPatterns: ["balance", "walking"],
    equipment: ["cones", "tennis_court"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_medius",
      region: "lateral_agility",
      label: "Lateral Speed"
    },
    substitutionGroup: "court_sport_conditioning",
    substitutions: ["lateral_shuffle", "agility_ladder", "cone_shuttle"],
    laterality: "bilateral",
    setup: "court",
    goals: {
      athletic_performance: 10,
      speed: 9,
      balance: 8,
      cardio: 7
    },
    summary:
      "Shuffle laterally between markers to train court movement and quick recovery steps.",
    instructions: [
      "Set two or more markers laterally.",
      "Shuffle quickly from side to side.",
      "Stay low enough to change direction efficiently.",
      "Repeat for the programmed interval."
    ],
    cues: [
      "Keep the feet from crossing unless intentionally programmed.",
      "Stay light on the toes."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "boxing_heavy_bag",
    name: "Heavy Bag Boxing",
    aliases: ["boxing bag", "heavy bag", "boxing rounds"],
    category: "sports",
    exerciseTypes: ["conditioning", "cardio", "functional"],
    bodyParts: ["full_body", "shoulders", "arms", "core"],
    primaryMuscles: ["anterior_deltoid", "triceps_brachii", "external_oblique"],
    secondaryMuscles: ["pectoralis_major", "internal_oblique", "gastrocnemius"],
    movementPatterns: ["trunk_rotation", "conditioning_circuit"],
    equipment: ["heavy_bag", "boxing_gloves"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "combat_conditioning",
      label: "Cardio + Rotational Power"
    },
    substitutionGroup: "combat_cardio",
    substitutions: ["shadow_boxing", "battle_rope_alternating_waves", "cardio_circuit"],
    laterality: "mixed",
    setup: "heavy_bag",
    goals: {
      cardio: 10,
      athletic_performance: 9,
      endurance: 9,
      speed: 8,
      general_fitness: 9
    },
    summary:
      "Perform timed boxing rounds on a heavy bag using controlled punches, footwork, and trunk rotation.",
    instructions: [
      "Use wraps and gloves as appropriate.",
      "Work in programmed rounds.",
      "Combine punches with footwork.",
      "Recover between rounds."
    ],
    cues: [
      "Keep wrists aligned on impact.",
      "Rotate through the hips and trunk.",
      "Do not sacrifice technique for speed."
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
  },

  {
    id: "shadow_boxing",
    name: "Shadow Boxing",
    aliases: ["shadowbox", "boxing footwork", "air boxing"],
    category: "sports",
    exerciseTypes: ["conditioning", "cardio", "functional"],
    bodyParts: ["full_body", "shoulders", "arms", "core"],
    primaryMuscles: ["anterior_deltoid", "triceps_brachii", "external_oblique"],
    secondaryMuscles: ["pectoralis_major", "gastrocnemius", "gluteus_medius"],
    movementPatterns: ["trunk_rotation", "conditioning_circuit"],
    equipment: ["none"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "combat_conditioning",
      label: "Footwork + Conditioning"
    },
    substitutionGroup: "combat_cardio",
    substitutions: ["boxing_heavy_bag", "jump_rope_intervals"],
    laterality: "mixed",
    setup: "open_space",
    goals: {
      cardio: 8,
      athletic_performance: 8,
      speed: 8,
      general_fitness: 9
    },
    summary:
      "Practice boxing combinations and footwork without external resistance.",
    instructions: [
      "Take a balanced fighting stance.",
      "Move around the training space.",
      "Throw controlled combinations.",
      "Work for the programmed round duration."
    ],
    cues: [
      "Keep the hands returning to guard.",
      "Stay relaxed and mobile."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "volleyball_approach_jump",
    name: "Volleyball Approach Jump",
    aliases: ["volleyball jump", "approach jump", "spike approach jump"],
    category: "sports",
    exerciseTypes: ["power", "plyometric", "functional"],
    bodyParts: ["lower_body", "glutes", "quadriceps", "calves"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "gastrocnemius"],
    secondaryMuscles: ["soleus", "biceps_femoris"],
    movementPatterns: ["jump"],
    equipment: ["none"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "vertical_power",
      label: "Jump Power"
    },
    substitutionGroup: "jump_sport_power",
    substitutions: ["box_jump", "squat_jump", "broad_jump"],
    laterality: "mixed",
    setup: "open_space",
    goals: {
      athletic_performance: 10,
      speed: 8,
      lower_body_strength: 8
    },
    summary:
      "Use a short approach into a controlled vertical jump to train sport-specific explosive power.",
    instructions: [
      "Take a short controlled approach.",
      "Plant through the final steps.",
      "Drive upward explosively.",
      "Land softly and reset."
    ],
    cues: [
      "Prioritize landing control.",
      "Use quality repetitions rather than fatigue."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "baseball_sprint_drill",
    name: "Baseball Base Sprint Drill",
    aliases: ["base running drill", "base sprint", "baseball acceleration drill"],
    category: "sports",
    exerciseTypes: ["speed", "functional", "conditioning"],
    bodyParts: ["full_body", "lower_body", "glutes", "hamstrings", "calves"],
    primaryMuscles: ["gluteus_maximus", "biceps_femoris", "gastrocnemius"],
    secondaryMuscles: ["rectus_femoris", "soleus"],
    movementPatterns: ["sprint", "running"],
    equipment: ["cones", "field"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "acceleration",
      label: "Acceleration + Speed"
    },
    substitutionGroup: "field_sport_agility",
    substitutions: ["sprint_intervals", "cone_shuttle"],
    laterality: "mixed",
    setup: "field",
    goals: {
      athletic_performance: 10,
      speed: 10,
      cardio: 6
    },
    summary:
      "Practice short accelerations and controlled turns similar to running between bases.",
    instructions: [
      "Mark the sprint distance.",
      "Accelerate aggressively from the start.",
      "Run through or around the marker.",
      "Walk back and recover."
    ],
    cues: [
      "Drive through the first several steps.",
      "Keep turns controlled."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "football_route_sprint",
    name: "Football Route Sprint",
    aliases: ["route running drill", "football sprint drill", "receiver route drill"],
    category: "sports",
    exerciseTypes: ["speed", "functional", "conditioning"],
    bodyParts: ["full_body", "lower_body", "glutes", "hamstrings", "calves"],
    primaryMuscles: ["gluteus_maximus", "biceps_femoris", "gastrocnemius"],
    secondaryMuscles: ["gluteus_medius", "rectus_femoris"],
    movementPatterns: ["sprint", "running"],
    equipment: ["cones", "field"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "gluteus_maximus",
      region: "acceleration_change_direction",
      label: "Speed + Route Agility"
    },
    substitutionGroup: "field_sport_agility",
    substitutions: ["cone_shuttle", "sprint_intervals", "agility_ladder"],
    laterality: "mixed",
    setup: "field",
    goals: {
      athletic_performance: 10,
      speed: 10,
      cardio: 7
    },
    summary:
      "Sprint through a planned route with acceleration, cuts, and re-acceleration.",
    instructions: [
      "Set route markers.",
      "Sprint into the planned cut.",
      "Decelerate and change direction under control.",
      "Accelerate out of the cut."
    ],
    cues: [
      "Plant under the body.",
      "Keep the torso balanced through direction changes."
    ],
    logging: {
      type: "intervals",
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "golf_rotational_drill",
    name: "Golf Rotational Drill",
    aliases: ["golf rotation drill", "golf mobility power drill", "golf trunk rotation"],
    category: "sports",
    exerciseTypes: ["functional", "power", "mobility"],
    bodyParts: ["core", "hips", "back", "shoulders"],
    primaryMuscles: ["external_oblique", "internal_oblique", "gluteus_maximus"],
    secondaryMuscles: ["transversus_abdominis", "posterior_deltoid"],
    movementPatterns: ["trunk_rotation"],
    equipment: ["resistance_band", "cable_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "rotational_power",
      label: "Rotational Power"
    },
    substitutionGroup: "rotational_sport_power",
    substitutions: ["cable_wood_chop", "medicine_ball_rotation"],
    laterality: "bilateral_sides",
    setup: "standing_rotation",
    goals: {
      athletic_performance: 10,
      core_strength: 9,
      mobility: 8
    },
    summary:
      "Train controlled hip and trunk rotation against light resistance for rotational sports.",
    instructions: [
      "Stand in an athletic stance.",
      "Hold the resistance across the body.",
      "Rotate through the hips and torso.",
      "Return under control."
    ],
    cues: [
      "Keep the motion smooth.",
      "Rotate through the hips and trunk together."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "swimming_dryland_pull",
    name: "Swimming Dryland Pull",
    aliases: ["swim dryland", "swimmer band pull", "freestyle band pull"],
    category: "sports",
    exerciseTypes: ["functional", "endurance", "resistance_band"],
    bodyParts: ["back", "shoulders", "arms", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "posterior_deltoid", "triceps_brachii"],
    secondaryMuscles: ["serratus_anterior", "transversus_abdominis"],
    movementPatterns: ["vertical_pull"],
    equipment: ["resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "latissimus_dorsi",
      region: "swim_pull_pattern",
      label: "Lats + Shoulder Endurance"
    },
    substitutionGroup: "swim_dryland",
    substitutions: ["lat_pulldown", "straight_arm_pulldown"],
    laterality: "bilateral_or_alternating",
    setup: "band_anchor",
    goals: {
      athletic_performance: 9,
      endurance: 8,
      upper_body_strength: 7,
      general_fitness: 7
    },
    summary:
      "Use band resistance to rehearse the pulling phase of a swimming stroke.",
    instructions: [
      "Anchor the band securely.",
      "Hinge slightly at the hips.",
      "Pull the arms through a controlled swim-like path.",
      "Return slowly."
    ],
    cues: [
      "Keep the shoulders controlled.",
      "Do not rush the return."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  SPORTS_EXERCISES
};

export default SPORTS_EXERCISES;
