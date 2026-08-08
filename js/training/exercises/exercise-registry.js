// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-registry.js
// Version: 2.0.0
// Purpose:
//   Central selectable Exercise Library for ARI Training.
//
// V2 architecture:
//   - Exercise data can live in modular category files.
//   - Chest exercises now come from:
//       ./strength/chest.js
//   - Existing non-chest records remain here temporarily
//     so current workout plans continue working.
//   - As new category modules are created, their inline
//     records can be removed from this file and replaced
//     with imports without changing the public registry API.
//
// Design:
//   - Every selectable exercise exists exactly once.
//   - Workout templates and custom plans reference stable IDs.
//   - Search includes aliases and richer metadata.
//   - Validation checks anatomy/movement/type references,
//     duplicate IDs, substitution references, and basic record
//     integrity.
// =====================================================

import BodyParts from "../anatomy/body-parts.js";
import Muscles from "../anatomy/muscles.js";
import MovementPatterns from "../movements/movement-patterns.js";
import ExerciseTypes from "../movements/exercise-types.js";

import ChestExercises
  from "./strength/chest.js";

const VERSION = "2.0.0";
const SOURCE = "js/training/exercises/exercise-registry";

/* =====================================================
   NON-CHEST EXERCISES
   These remain inline until their modular files are built.
===================================================== */

const NON_CHEST_EXERCISES = Object.freeze([
  // ===================================================
  // SHOULDERS
  // ===================================================
  {
    id: "dumbbell_overhead_press",
    name: "Dumbbell Overhead Press",
    aliases: [
      "dumbbell shoulder press",
      "db shoulder press",
      "seated dumbbell press",
      "standing dumbbell press"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["shoulders", "triceps", "upper_body"],
    primaryMuscles: ["anterior_deltoid", "lateral_deltoid"],
    secondaryMuscles: ["triceps_brachii", "trapezius_upper", "serratus_anterior"],
    movementPatterns: ["vertical_push"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "overhead_press",
    substitutions: [],
    laterality: "bilateral",
    setup: "seated_or_standing",
    goals: {
      muscle_building: 9,
      strength: 9,
      upper_body_strength: 10
    },
    summary:
      "Press dumbbells from shoulder level overhead while keeping the trunk controlled.",
    instructions: [
      "Begin with the dumbbells near shoulder height.",
      "Brace the torso.",
      "Press the dumbbells overhead.",
      "Lower them back to shoulder level under control."
    ],
    cues: [
      "Avoid excessive lower-back arching.",
      "Keep the ribs controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dumbbell_lateral_raise",
    name: "Dumbbell Lateral Raise",
    aliases: [
      "lateral raise",
      "side raise",
      "side delt raise"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["shoulders", "upper_body"],
    primaryMuscles: ["lateral_deltoid"],
    secondaryMuscles: ["supraspinatus", "trapezius_upper"],
    movementPatterns: ["shoulder_abduction"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "lateral_raise",
    substitutions: [],
    laterality: "bilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 10,
      strength: 4,
      upper_body_strength: 5
    },
    summary:
      "Raise the dumbbells out to the sides with softly bent elbows, then lower them under control.",
    instructions: [
      "Stand tall with a dumbbell in each hand.",
      "Keep a slight bend in the elbows.",
      "Raise the arms out to the sides.",
      "Lower slowly to the starting position."
    ],
    cues: [
      "Lead with the elbows rather than the hands.",
      "Avoid swinging the torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "reverse_fly",
    name: "Reverse Fly",
    aliases: [
      "rear delt fly",
      "reverse dumbbell fly",
      "rear shoulder fly"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "machine_strength"],
    bodyParts: ["shoulders", "back", "upper_body"],
    primaryMuscles: ["posterior_deltoid"],
    secondaryMuscles: ["rhomboid_major", "rhomboid_minor", "trapezius_middle"],
    movementPatterns: ["shoulder_horizontal_abduction"],
    equipment: ["dumbbells", "reverse_fly_machine"],
    difficulty: "beginner",
    substitutionGroup: "rear_delt_fly",
    substitutions: ["face_pull"],
    laterality: "bilateral",
    setup: "supported_or_hinged",
    goals: {
      muscle_building: 9,
      upper_body_strength: 6,
      general_fitness: 6
    },
    summary:
      "Open the arms outward against resistance to train the rear shoulders and upper-back stabilizers.",
    instructions: [
      "Set the torso in a supported or hip-hinged position.",
      "Begin with the arms in front of the body.",
      "Open the arms outward while keeping the elbows softly bent.",
      "Return under control."
    ],
    cues: [
      "Avoid shrugging.",
      "Use the rear shoulders rather than momentum."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // BACK / PULL
  // ===================================================
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    aliases: [
      "pulldown",
      "lat pull down",
      "wide grip pulldown"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major", "trapezius_lower"],
    movementPatterns: ["vertical_pull"],
    equipment: ["lat_pulldown_machine", "cable_machine"],
    difficulty: "beginner",
    substitutionGroup: "vertical_pull",
    substitutions: ["pull_up"],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull the bar from overhead toward the upper chest while driving the elbows downward.",
    instructions: [
      "Secure the thighs under the pad.",
      "Grip the bar overhead.",
      "Pull the elbows down toward the sides of the torso.",
      "Return the bar overhead under control."
    ],
    cues: [
      "Avoid pulling behind the neck.",
      "Do not turn the movement into a large backward lean."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "pull_up",
    name: "Pull-Up",
    aliases: [
      "pullup",
      "bodyweight pull up",
      "overhand pull up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["back", "biceps", "forearms", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "brachioradialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "intermediate",
    substitutionGroup: "vertical_pull",
    substitutions: ["lat_pulldown"],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      muscle_building: 9,
      strength: 10,
      upper_body_strength: 10,
      general_fitness: 8
    },
    summary:
      "Pull the body upward from a hanging position until the upper chest approaches the bar, then lower under control.",
    instructions: [
      "Begin from a controlled hang.",
      "Set the shoulder blades and pull the elbows downward.",
      "Raise the body toward the bar.",
      "Lower to the starting position under control."
    ],
    cues: [
      "Avoid excessive swinging.",
      "Keep the movement controlled through the full range available."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "assistance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "seated_cable_row",
    name: "Seated Cable Row",
    aliases: [
      "cable row",
      "seated row",
      "low cable row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["biceps_brachii", "posterior_deltoid", "brachialis"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    substitutionGroup: "horizontal_row",
    substitutions: [
      "barbell_bent_over_row",
      "one_arm_dumbbell_row"
    ],
    laterality: "bilateral",
    setup: "seated_cable",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Pull the cable handle toward the torso while drawing the shoulder blades back, then return with control.",
    instructions: [
      "Sit tall with the feet supported.",
      "Begin with the arms extended.",
      "Pull the handle toward the torso.",
      "Return the arms forward without collapsing the posture."
    ],
    cues: [
      "Avoid excessive torso rocking.",
      "Keep the shoulders away from the ears."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "barbell_bent_over_row",
    name: "Barbell Bent-Over Row",
    aliases: [
      "barbell row",
      "bent over row",
      "bb row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "lower_back", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii", "erector_spinae"],
    movementPatterns: ["horizontal_pull", "hip_hinge"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    substitutionGroup: "horizontal_row",
    substitutions: [
      "seated_cable_row",
      "one_arm_dumbbell_row"
    ],
    laterality: "bilateral",
    setup: "standing_hinged",
    goals: {
      muscle_building: 10,
      strength: 9,
      upper_body_strength: 9
    },
    summary:
      "Hold a hip-hinged position and row the bar toward the torso while keeping the trunk stable.",
    instructions: [
      "Hinge at the hips with a neutral, controlled torso.",
      "Let the bar hang beneath the shoulders.",
      "Pull the bar toward the lower ribs or upper abdomen.",
      "Lower it under control."
    ],
    cues: [
      "Keep the trunk position consistent.",
      "Avoid jerking the bar upward."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "one_arm_dumbbell_row",
    name: "One-Arm Dumbbell Row",
    aliases: [
      "one arm row",
      "single arm dumbbell row",
      "dumbbell row"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["rhomboid_major", "trapezius_middle", "posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
    substitutionGroup: "horizontal_row",
    substitutions: [
      "seated_cable_row",
      "barbell_bent_over_row"
    ],
    laterality: "unilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 10,
      strength: 8,
      upper_body_strength: 9
    },
    summary:
      "Support the body with one arm and row a dumbbell toward the hip while keeping the torso controlled.",
    instructions: [
      "Support one hand on a bench or stable surface.",
      "Allow the working arm to hang below the shoulder.",
      "Pull the dumbbell toward the hip.",
      "Lower it slowly."
    ],
    cues: [
      "Avoid rotating the torso excessively.",
      "Drive the elbow back rather than shrugging."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "face_pull",
    name: "Face Pull",
    aliases: [
      "rope face pull",
      "cable face pull",
      "band face pull"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable", "resistance_band"],
    bodyParts: ["back", "shoulders", "upper_body"],
    primaryMuscles: ["posterior_deltoid", "infraspinatus", "teres_minor"],
    secondaryMuscles: ["trapezius_middle", "rhomboid_major"],
    movementPatterns: ["horizontal_pull", "shoulder_horizontal_abduction"],
    equipment: ["cable_machine", "resistance_band", "rope_attachment"],
    difficulty: "beginner",
    substitutionGroup: "rear_delt_pull",
    substitutions: ["reverse_fly"],
    laterality: "bilateral",
    setup: "standing_cable_or_band",
    goals: {
      muscle_building: 7,
      upper_body_strength: 6,
      general_fitness: 7
    },
    summary:
      "Pull a rope or band toward the face while opening the elbows and controlling the shoulder blades.",
    instructions: [
      "Set the cable or band near face height.",
      "Begin with the arms extended.",
      "Pull toward the face while opening the hands apart.",
      "Return under control."
    ],
    cues: [
      "Keep the shoulders from shrugging.",
      "Use a controlled range rather than momentum."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // ARMS
  // ===================================================
  {
    id: "dumbbell_biceps_curl",
    name: "Dumbbell Biceps Curl",
    aliases: [
      "dumbbell curl",
      "db curl",
      "biceps curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "biceps_curl",
    substitutions: ["hammer_curl"],
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
    id: "hammer_curl",
    name: "Hammer Curl",
    aliases: [
      "dumbbell hammer curl",
      "neutral grip curl"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachialis", "brachioradialis"],
    secondaryMuscles: ["biceps_brachii"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "biceps_curl",
    substitutions: ["dumbbell_biceps_curl"],
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
    id: "cable_triceps_pushdown",
    name: "Cable Triceps Pushdown",
    aliases: [
      "triceps pushdown",
      "cable pushdown",
      "tricep pushdown"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    substitutionGroup: "triceps_extension",
    substitutions: ["overhead_triceps_extension"],
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
    id: "overhead_triceps_extension",
    name: "Overhead Triceps Extension",
    aliases: [
      "overhead tricep extension",
      "dumbbell triceps extension",
      "cable overhead triceps extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbell", "cable_machine"],
    difficulty: "beginner",
    substitutionGroup: "triceps_extension",
    substitutions: ["cable_triceps_pushdown"],
    laterality: "bilateral_or_unilateral",
    setup: "standing_or_seated",
    goals: {
      muscle_building: 9,
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

  // ===================================================
  // LOWER BODY
  // ===================================================
  {
    id: "barbell_back_squat",
    name: "Barbell Back Squat",
    aliases: [
      "back squat",
      "barbell squat",
      "squat"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "core"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "erector_spinae"],
    movementPatterns: ["squat"],
    equipment: ["barbell", "squat_rack"],
    difficulty: "intermediate",
    substitutionGroup: "squat",
    substitutions: ["goblet_squat", "leg_press"],
    laterality: "bilateral",
    setup: "squat_rack",
    goals: {
      muscle_building: 10,
      strength: 10,
      lower_body_strength: 10,
      athletic_performance: 8,
      general_fitness: 7
    },
    summary:
      "Squat down with a bar supported across the upper back, then stand by extending the hips and knees.",
    instructions: [
      "Set the bar securely across the upper back.",
      "Brace the torso and begin the descent through the hips and knees.",
      "Lower to a controlled depth that preserves stable positioning.",
      "Drive through the feet to stand."
    ],
    cues: [
      "Keep the knees tracking in line with the feet.",
      "Maintain a controlled trunk position."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "goblet_squat",
    name: "Goblet Squat",
    aliases: [
      "dumbbell goblet squat",
      "kettlebell goblet squat"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "core"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "erector_spinae"],
    movementPatterns: ["squat"],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "beginner",
    substitutionGroup: "squat",
    substitutions: ["barbell_back_squat", "leg_press"],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      general_fitness: 9
    },
    summary:
      "Hold a weight at the chest, squat down under control, and stand by extending the hips and knees.",
    instructions: [
      "Hold a dumbbell or kettlebell close to the chest.",
      "Sit down between the hips while bending the knees.",
      "Maintain a stable torso.",
      "Stand back up through the feet."
    ],
    cues: [
      "Keep the weight close to the body.",
      "Let the knees track with the toes."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "leg_press",
    name: "Leg Press",
    aliases: [
      "leg press machine",
      "sled leg press"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris"],
    movementPatterns: ["squat"],
    equipment: ["leg_press_machine"],
    difficulty: "beginner",
    substitutionGroup: "squat",
    substitutions: ["barbell_back_squat", "goblet_squat"],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9
    },
    summary:
      "Lower the sled by bending the hips and knees, then press it away by extending the legs.",
    instructions: [
      "Place the feet securely on the platform.",
      "Release the safety mechanism as appropriate for the machine.",
      "Lower the platform under control.",
      "Press through the feet to extend the hips and knees."
    ],
    cues: [
      "Keep the hips supported against the pad.",
      "Do not force excessive depth."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    aliases: [
      "rdl",
      "romanian dl",
      "stiff leg deadlift"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "hamstrings", "glutes", "lower_back", "core"],
    primaryMuscles: ["biceps_femoris", "semitendinosus", "semimembranosus", "gluteus_maximus"],
    secondaryMuscles: ["erector_spinae", "forearm_flexors"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "dumbbells"],
    difficulty: "intermediate",
    substitutionGroup: "hip_hinge",
    substitutions: ["conventional_deadlift"],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      muscle_building: 10,
      strength: 9,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Push the hips backward while lowering the weight close to the legs, then extend the hips to return to standing.",
    instructions: [
      "Stand tall holding the weight.",
      "Soften the knees and push the hips backward.",
      "Lower until you feel a strong but controlled hamstring stretch.",
      "Drive the hips forward to stand."
    ],
    cues: [
      "Keep the weight close to the body.",
      "Maintain a stable spine.",
      "Think hips back rather than squatting down."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "conventional_deadlift",
    name: "Conventional Deadlift",
    aliases: [
      "deadlift",
      "conventional dl",
      "barbell deadlift"
    ],
    category: "strength",
    exerciseTypes: ["strength", "free_weight"],
    bodyParts: ["full_body", "lower_body", "glutes", "hamstrings", "back", "core", "forearms"],
    primaryMuscles: ["gluteus_maximus", "biceps_femoris", "semitendinosus", "semimembranosus", "erector_spinae"],
    secondaryMuscles: ["latissimus_dorsi", "forearm_flexors", "quadriceps"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell"],
    difficulty: "advanced",
    substitutionGroup: "hip_hinge",
    substitutions: ["romanian_deadlift"],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      strength: 10,
      muscle_building: 8,
      lower_body_strength: 10,
      athletic_performance: 8
    },
    summary:
      "Lift a bar from the floor by extending the hips and knees while maintaining a controlled trunk position.",
    instructions: [
      "Set the feet beneath the bar.",
      "Grip the bar and brace the trunk.",
      "Drive through the floor while extending the hips and knees.",
      "Stand tall, then return the bar to the floor under control."
    ],
    cues: [
      "Keep the bar close to the body.",
      "Avoid jerking the bar from the floor."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "barbell_hip_thrust",
    name: "Barbell Hip Thrust",
    aliases: [
      "hip thrust",
      "barbell glute thrust"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "gluteus_medius"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    substitutionGroup: "hip_extension",
    substitutions: ["glute_bridge"],
    laterality: "bilateral",
    setup: "bench_supported",
    goals: {
      muscle_building: 10,
      strength: 8,
      lower_body_strength: 9,
      glute_development: 10
    },
    summary:
      "Drive the hips upward against resistance from a supported upper-back position, then lower under control.",
    instructions: [
      "Support the upper back on a stable bench.",
      "Position the load securely across the hips.",
      "Drive the hips upward by contracting the glutes.",
      "Lower the hips under control."
    ],
    cues: [
      "Finish with the hips rather than overextending the lower back.",
      "Keep the feet planted."
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
      "floor glute bridge"
    ],
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["hamstrings"],
    movementPatterns: ["hip_hinge"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "hip_extension",
    substitutions: ["barbell_hip_thrust"],
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
    id: "walking_lunge",
    name: "Walking Lunge",
    aliases: [
      "walking lunges",
      "dumbbell walking lunge"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "functional"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "core"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["biceps_femoris", "gluteus_medius"],
    movementPatterns: ["lunge"],
    equipment: ["bodyweight", "dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "lunge",
    substitutions: [],
    laterality: "alternating",
    setup: "standing",
    goals: {
      muscle_building: 8,
      strength: 7,
      lower_body_strength: 8,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step forward into alternating lunges while maintaining balance and control through each repetition.",
    instructions: [
      "Stand tall with space in front of you.",
      "Step forward and lower into a lunge.",
      "Push through the front foot to move into the next step.",
      "Alternate legs."
    ],
    cues: [
      "Keep the front knee tracking with the foot.",
      "Maintain a controlled torso."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "distance", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "step_up",
    name: "Step-Up",
    aliases: [
      "step up",
      "box step up",
      "bench step up"
    ],
    category: "strength",
    exerciseTypes: ["strength", "functional", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "calves"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["gluteus_medius", "gastrocnemius", "soleus"],
    movementPatterns: ["step"],
    equipment: ["box", "bench", "bodyweight", "dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "step",
    substitutions: [],
    laterality: "unilateral",
    setup: "elevated_surface",
    goals: {
      strength: 7,
      muscle_building: 7,
      lower_body_strength: 8,
      running: 7,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Step onto an elevated surface and drive through the working leg to bring the body upward.",
    instructions: [
      "Place one foot fully on a stable box or bench.",
      "Drive through that foot to step up.",
      "Stand tall on the platform.",
      "Lower under control."
    ],
    cues: [
      "Avoid pushing excessively from the trailing leg.",
      "Keep the knee aligned over the foot."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "box_height", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "leg_extension",
    name: "Leg Extension",
    aliases: [
      "leg extension machine",
      "quad extension"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["quadriceps", "lower_body"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "vastus_intermedius"],
    secondaryMuscles: [],
    movementPatterns: ["knee_extension"],
    equipment: ["leg_extension_machine"],
    difficulty: "beginner",
    substitutionGroup: "knee_extension",
    substitutions: [],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 6
    },
    summary:
      "Extend the knees against the machine resistance, then return to the bent-knee position under control.",
    instructions: [
      "Adjust the machine so the knee aligns with the pivot.",
      "Place the lower legs behind the pad.",
      "Extend the knees.",
      "Lower the weight under control."
    ],
    cues: [
      "Avoid using momentum.",
      "Keep the hips against the seat."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "seated_leg_curl",
    name: "Seated Leg Curl",
    aliases: [
      "seated hamstring curl",
      "leg curl machine"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["hamstrings", "lower_body"],
    primaryMuscles: ["biceps_femoris", "semitendinosus", "semimembranosus"],
    secondaryMuscles: ["gastrocnemius"],
    movementPatterns: ["knee_flexion"],
    equipment: ["leg_curl_machine"],
    difficulty: "beginner",
    substitutionGroup: "knee_flexion",
    substitutions: [],
    laterality: "bilateral",
    setup: "machine",
    goals: {
      muscle_building: 10,
      strength: 6,
      lower_body_strength: 7
    },
    summary:
      "Bend the knees against machine resistance to bring the lower legs downward and back.",
    instructions: [
      "Adjust the machine to align the knees with the pivot.",
      "Secure the thigh pad if present.",
      "Flex the knees against resistance.",
      "Return under control."
    ],
    cues: [
      "Keep the hips in contact with the seat.",
      "Avoid bouncing the weight."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "standing_calf_raise",
    name: "Standing Calf Raise",
    aliases: [
      "calf raise",
      "standing calf raises"
    ],
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["bodyweight", "machine", "dumbbells"],
    difficulty: "beginner",
    substitutionGroup: "calf_raise",
    substitutions: [],
    laterality: "bilateral_or_unilateral",
    setup: "standing",
    goals: {
      muscle_building: 9,
      strength: 6,
      running: 7,
      lower_body_strength: 6
    },
    summary:
      "Rise onto the balls of the feet by lifting the heels, then lower slowly.",
    instructions: [
      "Stand with the feet stable.",
      "Raise the heels as high as comfortable.",
      "Pause briefly at the top.",
      "Lower under control."
    ],
    cues: [
      "Avoid bouncing.",
      "Keep the ankles moving in a controlled path."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "hip_abduction_machine",
    name: "Hip Abduction Machine",
    aliases: [
      "abductor machine",
      "hip abductor machine",
      "outer thigh machine"
    ],
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: ["gluteus_medius", "gluteus_minimus"],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction"],
    equipment: ["hip_abduction_machine"],
    difficulty: "beginner",
    substitutionGroup: "hip_abduction",
    substitutions: [],
    laterality: "bilateral",
    setup: "machine",
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

  // ===================================================
  // CORE
  // ===================================================
  {
    id: "front_plank",
    name: "Front Plank",
    aliases: [
      "plank",
      "forearm plank"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals", "lower_back"],
    primaryMuscles: ["rectus_abdominis", "transversus_abdominis"],
    secondaryMuscles: ["external_oblique", "internal_oblique", "gluteus_maximus"],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "anti_extension_core",
    substitutions: [],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      core_strength: 10,
      general_fitness: 8,
      athletic_performance: 7,
      running: 6
    },
    summary:
      "Hold a rigid forearm-supported position while resisting lower-back arching.",
    instructions: [
      "Place the forearms on the floor beneath the shoulders.",
      "Extend the legs behind you.",
      "Brace the trunk and glutes.",
      "Hold a straight body position for the planned time."
    ],
    cues: [
      "Do not let the hips sag.",
      "Keep breathing while bracing."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "side_plank",
    name: "Side Plank",
    aliases: [
      "side forearm plank"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "obliques", "lower_back"],
    primaryMuscles: ["external_oblique", "internal_oblique", "quadratus_lumborum"],
    secondaryMuscles: ["gluteus_medius", "transversus_abdominis"],
    movementPatterns: ["anti_lateral_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "anti_lateral_flexion_core",
    substitutions: [],
    laterality: "unilateral",
    setup: "floor",
    goals: {
      core_strength: 10,
      general_fitness: 8,
      athletic_performance: 8,
      running: 7
    },
    summary:
      "Support the body on one forearm and the side of the feet while keeping the hips lifted and trunk aligned.",
    instructions: [
      "Lie on one side with the forearm beneath the shoulder.",
      "Stack or stagger the feet.",
      "Lift the hips from the floor.",
      "Hold the body in a straight line."
    ],
    cues: [
      "Keep the hips from dropping.",
      "Avoid collapsing into the shoulder."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "pallof_press",
    name: "Pallof Press",
    aliases: [
      "pallof",
      "anti rotation press"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "resistance_band"],
    bodyParts: ["core", "obliques"],
    primaryMuscles: ["transversus_abdominis", "external_oblique", "internal_oblique"],
    secondaryMuscles: ["rectus_abdominis"],
    movementPatterns: ["anti_rotation"],
    equipment: ["cable_machine", "resistance_band"],
    difficulty: "beginner",
    substitutionGroup: "anti_rotation_core",
    substitutions: [],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      core_strength: 10,
      athletic_performance: 9,
      general_fitness: 8,
      running: 7
    },
    summary:
      "Press a cable or band away from the chest while resisting the rotational pull of the resistance.",
    instructions: [
      "Stand sideways to the cable or band anchor.",
      "Hold the handle at the chest.",
      "Press the hands straight forward.",
      "Return to the chest without allowing the torso to rotate."
    ],
    cues: [
      "Keep the hips and shoulders square.",
      "Use the core to resist rotation."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "crunch",
    name: "Crunch",
    aliases: [
      "ab crunch",
      "floor crunch"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: ["external_oblique", "internal_oblique"],
    movementPatterns: ["trunk_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "trunk_flexion_core",
    substitutions: [],
    laterality: "bilateral",
    setup: "floor",
    goals: {
      core_strength: 8,
      muscle_building: 5,
      general_fitness: 7
    },
    summary:
      "Curl the upper trunk toward the pelvis using controlled abdominal flexion, then lower slowly.",
    instructions: [
      "Lie on the back with the knees bent.",
      "Brace the abdomen.",
      "Lift the shoulder blades from the floor by flexing the trunk.",
      "Lower slowly."
    ],
    cues: [
      "Avoid pulling on the neck.",
      "Keep the movement controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // FUNCTIONAL / CARRY
  // ===================================================
  {
    id: "farmers_carry",
    name: "Farmer's Carry",
    aliases: [
      "farmers walk",
      "farmer carry",
      "loaded carry"
    ],
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: ["full_body", "forearms", "core", "shoulders"],
    primaryMuscles: ["forearm_flexors", "trapezius_upper", "transversus_abdominis"],
    secondaryMuscles: ["quadratus_lumborum", "gluteus_medius", "erector_spinae"],
    movementPatterns: ["loaded_carry", "walking"],
    equipment: ["dumbbells", "kettlebells"],
    difficulty: "beginner",
    substitutionGroup: "loaded_carry",
    substitutions: [],
    laterality: "bilateral",
    setup: "standing",
    goals: {
      strength: 8,
      general_fitness: 9,
      core_strength: 8,
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
      "Keep a strong, steady grip."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "distance", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // CARDIO / RUNNING
  // ===================================================
  {
    id: "walking_general",
    name: "Walking",
    aliases: [
      "walk",
      "brisk walk",
      "treadmill walking"
    ],
    category: "cardio",
    exerciseTypes: ["walking", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "glutes", "calves"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["walking"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
    substitutionGroup: "steady_cardio",
    substitutions: ["elliptical_trainer", "stationary_bike"],
    laterality: "alternating",
    setup: "ground_or_treadmill",
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
      "Choose a sustainable pace.",
      "Maintain an upright posture.",
      "Use a natural arm swing.",
      "Progress duration or pace gradually."
    ],
    cues: [
      "Use comfortable footwear.",
      "Keep the effort appropriate for the session."
    ],
    logging: {
      type: "duration_distance",
      fields: ["duration_minutes", "distance", "pace", "incline", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "easy_run",
    name: "Easy Run",
    aliases: [
      "easy running",
      "easy jog",
      "aerobic run"
    ],
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "glutes", "calves", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
    substitutionGroup: "running",
    substitutions: ["walking_general", "elliptical_trainer"],
    laterality: "alternating",
    setup: "ground_or_treadmill",
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
      "Keep the pace easy enough to maintain relaxed breathing.",
      "Increase volume gradually."
    ],
    logging: {
      type: "duration_distance_pace",
      fields: ["duration_minutes", "distance", "pace", "incline", "intensity"]
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
      "tempo running"
    ],
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
    substitutionGroup: "running",
    substitutions: ["easy_run", "running_intervals"],
    laterality: "alternating",
    setup: "ground_or_treadmill",
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
      fields: ["duration_minutes", "distance", "pace", "incline", "intensity"]
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
      "sprint intervals"
    ],
    category: "cardio",
    exerciseTypes: ["running", "hiit", "speed"],
    bodyParts: ["full_body", "lower_body", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running", "sprint"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
    substitutionGroup: "running_intervals",
    substitutions: ["tempo_run"],
    laterality: "alternating",
    setup: "ground_or_treadmill",
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
      fields: ["rounds", "work_seconds", "rest_seconds", "distance", "pace", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

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
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "calves"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["hamstrings", "gastrocnemius", "soleus"],
    movementPatterns: ["cycling"],
    equipment: ["stationary_bike"],
    difficulty: "beginner",
    substitutionGroup: "steady_cardio",
    substitutions: ["elliptical_trainer", "walking_general"],
    laterality: "alternating",
    setup: "machine",
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
      fields: ["duration_minutes", "distance", "speed", "resistance", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "rowing_machine",
    name: "Rowing Machine",
    aliases: [
      "rower",
      "rowing erg",
      "erg row"
    ],
    category: "cardio",
    exerciseTypes: ["rowing", "cardio", "endurance"],
    bodyParts: ["full_body", "back", "lower_body", "core"],
    primaryMuscles: ["rectus_femoris", "gluteus_maximus", "latissimus_dorsi"],
    secondaryMuscles: ["hamstrings", "biceps_brachii", "trapezius_middle", "erector_spinae"],
    movementPatterns: ["rowing_cardio"],
    equipment: ["rowing_machine"],
    difficulty: "beginner",
    substitutionGroup: "steady_cardio",
    substitutions: ["stationary_bike", "elliptical_trainer"],
    laterality: "bilateral",
    setup: "machine",
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
      fields: ["duration_minutes", "distance", "pace", "stroke_rate", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "stair_climber",
    name: "Stair Climber",
    aliases: [
      "stair stepper",
      "stairs machine",
      "stairmaster"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: ["lower_body", "glutes", "quadriceps", "calves"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["gastrocnemius", "soleus", "hamstrings"],
    movementPatterns: ["stair_climbing"],
    equipment: ["stair_climber"],
    difficulty: "beginner",
    substitutionGroup: "steady_cardio",
    substitutions: ["walking_general", "elliptical_trainer"],
    laterality: "alternating",
    setup: "machine",
    goals: {
      cardio: 9,
      endurance: 9,
      general_fitness: 8,
      fat_loss_support: 8
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
      fields: ["duration_minutes", "level", "steps", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "elliptical_trainer",
    name: "Elliptical Trainer",
    aliases: [
      "elliptical",
      "cross trainer"
    ],
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: ["full_body", "lower_body"],
    primaryMuscles: ["quadriceps", "gluteus_maximus"],
    secondaryMuscles: ["hamstrings", "gastrocnemius", "soleus"],
    movementPatterns: ["elliptical"],
    equipment: ["elliptical"],
    difficulty: "beginner",
    substitutionGroup: "steady_cardio",
    substitutions: ["stationary_bike", "walking_general"],
    laterality: "alternating",
    setup: "machine",
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
      fields: ["duration_minutes", "distance", "resistance", "incline", "intensity"]
    },
    energyProfile: {
      method: "met",
      intensityOptions: ["light", "moderate", "vigorous"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // MOBILITY / FLEXIBILITY
  // ===================================================
  {
    id: "hip_flexor_stretch",
    name: "Hip Flexor Stretch",
    aliases: [
      "kneeling hip flexor stretch",
      "psoas stretch"
    ],
    category: "mobility",
    exerciseTypes: ["flexibility", "mobility", "recovery"],
    bodyParts: ["hips", "lower_body"],
    primaryMuscles: ["iliopsoas"],
    secondaryMuscles: ["rectus_femoris"],
    movementPatterns: ["static_stretch"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "hip_flexor_mobility",
    substitutions: [],
    laterality: "unilateral",
    setup: "half_kneeling_or_split_stance",
    goals: {
      mobility: 10,
      flexibility: 10,
      recovery: 8,
      running: 6
    },
    summary:
      "Use a split or half-kneeling position to gently lengthen the front of the hip.",
    instructions: [
      "Begin in a half-kneeling or split stance.",
      "Keep the pelvis controlled.",
      "Shift gently forward until a stretch is felt at the front of the hip.",
      "Hold without bouncing."
    ],
    cues: [
      "Avoid excessive lower-back arching.",
      "Use a gentle, comfortable range."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "side"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "ankle_dorsiflexion_mobility",
    name: "Ankle Dorsiflexion Mobility",
    aliases: [
      "ankle mobility",
      "knee to wall",
      "ankle dorsiflexion drill"
    ],
    category: "mobility",
    exerciseTypes: ["mobility", "recovery"],
    bodyParts: ["calves", "shins", "lower_body"],
    primaryMuscles: ["tibialis_anterior"],
    secondaryMuscles: ["gastrocnemius", "soleus"],
    movementPatterns: ["mobility"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    substitutionGroup: "ankle_mobility",
    substitutions: [],
    laterality: "unilateral",
    setup: "standing_or_half_kneeling",
    goals: {
      mobility: 10,
      recovery: 7,
      running: 7,
      athletic_performance: 7
    },
    summary:
      "Move the knee forward over the foot while keeping the heel down to train controlled ankle dorsiflexion.",
    instructions: [
      "Place the foot flat on the floor.",
      "Keep the heel in contact with the ground.",
      "Drive the knee forward over the toes in a comfortable range.",
      "Return and repeat."
    ],
    cues: [
      "Keep the foot from collapsing inward.",
      "Use a pain-free range."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "side"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

/* =====================================================
   MASTER EXERCISE COLLECTION

   New category files only need to be imported and spread here.
   Existing runtime callers continue using ExerciseRegistry.
===================================================== */

const EXERCISES = Object.freeze([
  ...ChestExercises,
  ...NON_CHEST_EXERCISES
]);

/* =====================================================
   MAPS
===================================================== */

const EXERCISE_MAP = new Map();

for (const exercise of EXERCISES) {
  if (!EXERCISE_MAP.has(exercise.id)) {
    EXERCISE_MAP.set(
      exercise.id,
      exercise
    );
  }
}

const EXERCISE_ALIAS_MAP = new Map();

/* =====================================================
   NORMALIZATION
===================================================== */

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* =====================================================
   ALIAS INDEX
===================================================== */

for (const exercise of EXERCISES) {
  const aliases = [
    exercise.id,
    exercise.name,
    slugify(exercise.name),
    ...(exercise.aliases || [])
  ];

  for (const alias of aliases) {
    const normalized =
      normalizeText(alias);

    if (!normalized) {
      continue;
    }

    /*
     * Preserve first ownership of an alias.
     * Duplicate aliases are reported by validate().
     */
    if (
      !EXERCISE_ALIAS_MAP.has(
        normalized
      )
    ) {
      EXERCISE_ALIAS_MAP.set(
        normalized,
        exercise.id
      );
    }

    const slug =
      slugify(alias);

    if (
      slug &&
      !EXERCISE_ALIAS_MAP.has(
        slug
      )
    ) {
      EXERCISE_ALIAS_MAP.set(
        slug,
        exercise.id
      );
    }
  }
}

/* =====================================================
   BASIC LOOKUP
===================================================== */

function getExercise(idOrName) {
  const normalized =
    normalizeText(idOrName);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    EXERCISE_ALIAS_MAP.get(
      normalized
    ) ||
    EXERCISE_ALIAS_MAP.get(
      slugify(normalized)
    ) ||
    normalized;

  return EXERCISE_MAP.get(
    resolvedId
  ) || null;
}

function hasExercise(idOrName) {
  return Boolean(
    getExercise(idOrName)
  );
}

/* =====================================================
   FILTERING
===================================================== */

function getExercises({
  bodyPart = null,
  muscle = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
  goal = null,
  targetRegion = null,
  substitutionGroup = null,
  laterality = null,
  minimumGoalScore = 1
} = {}) {
  const normalizedBodyPart =
    normalizeText(bodyPart);

  const normalizedMuscle =
    normalizeText(muscle);

  const normalizedMovement =
    normalizeText(movementPattern);

  const normalizedType =
    normalizeText(exerciseType);

  const normalizedEquipment =
    normalizeText(equipment);

  const normalizedDifficulty =
    normalizeText(difficulty);

  const normalizedGoal =
    normalizeText(goal);

  const normalizedTargetRegion =
    normalizeText(targetRegion);

  const normalizedSubstitutionGroup =
    normalizeText(substitutionGroup);

  const normalizedLaterality =
    normalizeText(laterality);

  return EXERCISES.filter(
    exercise => {
      if (
        normalizedBodyPart &&
        !(exercise.bodyParts || []).some(
          item =>
            normalizeText(item) ===
            normalizedBodyPart
        )
      ) {
        return false;
      }

      if (
        normalizedMuscle &&
        ![
          ...(exercise.primaryMuscles || []),
          ...(exercise.secondaryMuscles || [])
        ].some(
          item =>
            normalizeText(item) ===
            normalizedMuscle
        )
      ) {
        return false;
      }

      if (
        normalizedMovement &&
        !(exercise.movementPatterns || []).some(
          item =>
            normalizeText(item) ===
            normalizedMovement
        )
      ) {
        return false;
      }

      if (
        normalizedType &&
        !(exercise.exerciseTypes || []).some(
          item =>
            normalizeText(item) ===
            normalizedType
        )
      ) {
        return false;
      }

      if (
        normalizedEquipment &&
        !(exercise.equipment || []).some(
          item =>
            normalizeText(item) ===
            normalizedEquipment
        )
      ) {
        return false;
      }

      if (
        normalizedDifficulty &&
        normalizeText(
          exercise.difficulty
        ) !==
          normalizedDifficulty
      ) {
        return false;
      }

      if (
        normalizedTargetRegion &&
        normalizeText(
          exercise.targetEmphasis
            ?.region
        ) !==
          normalizedTargetRegion
      ) {
        return false;
      }

      if (
        normalizedSubstitutionGroup &&
        normalizeText(
          exercise.substitutionGroup
        ) !==
          normalizedSubstitutionGroup
      ) {
        return false;
      }

      if (
        normalizedLaterality &&
        normalizeText(
          exercise.laterality
        ) !==
          normalizedLaterality
      ) {
        return false;
      }

      if (normalizedGoal) {
        const score =
          Number(
            exercise.goals?.[
              normalizedGoal
            ]
          ) || 0;

        if (
          score <
          Number(
            minimumGoalScore
          )
        ) {
          return false;
        }
      }

      return true;
    }
  );
}

/* =====================================================
   SEARCH
===================================================== */

function searchExercises(query) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [...EXERCISES];
  }

  return EXERCISES.filter(
    exercise => {
      const searchable = [
        exercise.id,
        exercise.name,
        exercise.category,
        exercise.difficulty,
        exercise.summary,
        exercise.substitutionGroup,
        exercise.laterality,
        exercise.setup,
        exercise.targetEmphasis?.muscle,
        exercise.targetEmphasis?.region,
        exercise.targetEmphasis?.label,
        ...(exercise.aliases || []),
        ...(exercise.exerciseTypes || []),
        ...(exercise.bodyParts || []),
        ...(exercise.primaryMuscles || []),
        ...(exercise.secondaryMuscles || []),
        ...(exercise.movementPatterns || []),
        ...(exercise.equipment || []),
        ...(exercise.substitutions || []),
        ...Object.keys(
          exercise.goals || {}
        )
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(
        normalized
      );
    }
  );
}

/* =====================================================
   RECOMMENDATIONS
===================================================== */

function recommendExercises({
  goal,
  bodyPart = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
  targetRegion = null,
  substitutionGroup = null,
  limit = 12
} = {}) {
  const normalizedGoal =
    normalizeText(goal);

  if (!normalizedGoal) {
    return [];
  }

  return getExercises({
    bodyPart,
    movementPattern,
    exerciseType,
    equipment,
    difficulty,
    targetRegion,
    substitutionGroup,
    goal: normalizedGoal,
    minimumGoalScore: 1
  })
    .sort(
      (a, b) =>
        (
          Number(
            b.goals?.[
              normalizedGoal
            ]
          ) || 0
        ) -
        (
          Number(
            a.goals?.[
              normalizedGoal
            ]
          ) || 0
        )
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 12
      )
    );
}

/* =====================================================
   SUBSTITUTIONS / SWAPS
===================================================== */

function getSubstitutions(
  idOrName,
  {
    equipment = null,
    limit = 8
  } = {}
) {
  const exercise =
    getExercise(idOrName);

  if (!exercise) {
    return [];
  }

  const results = [];
  const seen = new Set([
    exercise.id
  ]);

  /*
   * Preferred explicit substitutions first.
   */
  for (
    const substitutionId
    of exercise.substitutions || []
  ) {
    const candidate =
      getExercise(
        substitutionId
      );

    if (
      !candidate ||
      seen.has(
        candidate.id
      )
    ) {
      continue;
    }

    if (
      equipment &&
      !(candidate.equipment || []).some(
        item =>
          normalizeText(item) ===
          normalizeText(equipment)
      )
    ) {
      continue;
    }

    results.push(candidate);
    seen.add(candidate.id);
  }

  /*
   * Then fill from the same substitution group.
   */
  if (
    exercise.substitutionGroup
  ) {
    const grouped =
      getExercises({
        substitutionGroup:
          exercise.substitutionGroup
      });

    grouped
      .sort(
        (a, b) => {
          const sameRegionA =
            normalizeText(
              a.targetEmphasis?.region
            ) ===
            normalizeText(
              exercise.targetEmphasis
                ?.region
            )
              ? 1
              : 0;

          const sameRegionB =
            normalizeText(
              b.targetEmphasis?.region
            ) ===
            normalizeText(
              exercise.targetEmphasis
                ?.region
            )
              ? 1
              : 0;

          return (
            sameRegionB -
            sameRegionA
          );
        }
      );

    for (const candidate of grouped) {
      if (
        seen.has(
          candidate.id
        )
      ) {
        continue;
      }

      if (
        equipment &&
        !(candidate.equipment || []).some(
          item =>
            normalizeText(item) ===
            normalizeText(equipment)
        )
      ) {
        continue;
      }

      results.push(candidate);
      seen.add(candidate.id);

      if (
        results.length >=
        Math.max(
          1,
          Number(limit) || 8
        )
      ) {
        break;
      }
    }
  }

  return results.slice(
    0,
    Math.max(
      1,
      Number(limit) || 8
    )
  );
}

/* =====================================================
   GROUP HELPERS
===================================================== */

function getBySubstitutionGroup(
  group
) {
  return getExercises({
    substitutionGroup:
      group
  });
}

function getByTargetRegion(
  region
) {
  return getExercises({
    targetRegion:
      region
  });
}

function getExerciseIds() {
  return EXERCISES.map(
    exercise =>
      exercise.id
  );
}

/* =====================================================
   VALIDATION
===================================================== */

function validateDuplicateIds() {
  const seen =
    new Set();

  const duplicates =
    [];

  for (const exercise of EXERCISES) {
    if (
      seen.has(
        exercise.id
      )
    ) {
      duplicates.push(
        exercise.id
      );
    }

    seen.add(
      exercise.id
    );
  }

  return duplicates;
}

function validateDuplicateAliases() {
  const ownerByAlias =
    new Map();

  const duplicates =
    [];

  for (const exercise of EXERCISES) {
    const aliases = [
      exercise.id,
      exercise.name,
      slugify(
        exercise.name
      ),
      ...(exercise.aliases || [])
    ];

    for (const alias of aliases) {
      const normalized =
        normalizeText(alias);

      if (!normalized) {
        continue;
      }

      const existingOwner =
        ownerByAlias.get(
          normalized
        );

      if (
        existingOwner &&
        existingOwner !==
          exercise.id
      ) {
        duplicates.push({
          alias:
            normalized,

          exerciseIds: [
            existingOwner,
            exercise.id
          ]
        });
      } else {
        ownerByAlias.set(
          normalized,
          exercise.id
        );
      }
    }
  }

  return duplicates;
}

function validateReferences() {
  const invalid = [];

  for (const exercise of EXERCISES) {
    if (
      !exercise?.id ||
      !exercise?.name
    ) {
      invalid.push({
        exerciseId:
          exercise?.id || null,

        type:
          "record",

        value:
          "missing_id_or_name"
      });

      continue;
    }

    for (
      const bodyPartId
      of exercise.bodyParts || []
    ) {
      if (
        !BodyParts.has(
          bodyPartId
        )
      ) {
        invalid.push({
          exerciseId:
            exercise.id,

          type:
            "bodyPart",

          value:
            bodyPartId
        });
      }
    }

    for (
      const muscleId
      of [
        ...(exercise.primaryMuscles || []),
        ...(exercise.secondaryMuscles || [])
      ]
    ) {
      if (
        !Muscles.has(
          muscleId
        )
      ) {
        invalid.push({
          exerciseId:
            exercise.id,

          type:
            "muscle",

          value:
            muscleId
        });
      }
    }

    for (
      const movementId
      of exercise.movementPatterns || []
    ) {
      if (
        !MovementPatterns.has(
          movementId
        )
      ) {
        invalid.push({
          exerciseId:
            exercise.id,

          type:
            "movementPattern",

          value:
            movementId
        });
      }
    }

    for (
      const typeId
      of exercise.exerciseTypes || []
    ) {
      if (
        !ExerciseTypes.has(
          typeId
        )
      ) {
        invalid.push({
          exerciseId:
            exercise.id,

          type:
            "exerciseType",

          value:
            typeId
        });
      }
    }

    if (
      exercise.targetEmphasis?.muscle &&
      !Muscles.has(
        exercise
          .targetEmphasis
          .muscle
      )
    ) {
      invalid.push({
        exerciseId:
          exercise.id,

        type:
          "targetEmphasisMuscle",

        value:
          exercise
            .targetEmphasis
            .muscle
      });
    }
  }

  /*
   * Validate substitutions after all IDs are indexed.
   */
  for (const exercise of EXERCISES) {
    for (
      const substitutionId
      of exercise.substitutions || []
    ) {
      if (
        !EXERCISE_MAP.has(
          substitutionId
        )
      ) {
        invalid.push({
          exerciseId:
            exercise.id,

          type:
            "substitution",

          value:
            substitutionId
        });
      }
    }
  }

  const duplicateIds =
    validateDuplicateIds();

  for (
    const duplicateId
    of duplicateIds
  ) {
    invalid.push({
      exerciseId:
        duplicateId,

      type:
        "duplicateId",

      value:
        duplicateId
    });
  }

  const duplicateAliases =
    validateDuplicateAliases();

  for (
    const duplicate
    of duplicateAliases
  ) {
    invalid.push({
      exerciseId:
        duplicate.exerciseIds
          .join(","),

      type:
        "duplicateAlias",

      value:
        duplicate.alias
    });
  }

  return {
    valid:
      invalid.length === 0,

    totalExercises:
      EXERCISES.length,

    invalid
  };
}

/* =====================================================
   REGISTRY
===================================================== */

const AriTrainingExerciseRegistry =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      EXERCISES,

    get:
      getExercise,

    has:
      hasExercise,

    list:
      getExercises,

    search:
      searchExercises,

    recommend:
      recommendExercises,

    substitutions:
      getSubstitutions,

    bySubstitutionGroup:
      getBySubstitutionGroup,

    byTargetRegion:
      getByTargetRegion,

    ids:
      getExerciseIds,

    validate:
      validateReferences
  });

/* =====================================================
   GLOBAL API
===================================================== */

if (
  typeof globalThis !==
  "undefined"
) {
  const Ari =
    globalThis.Ari ||
    {};

  Ari.training =
    Ari.training ||
    {};

  Ari.training.exercises =
    AriTrainingExerciseRegistry;

  globalThis.Ari =
    Ari;
}

/* =====================================================
   EXPORTS
===================================================== */

export {
  VERSION,
  SOURCE,
  EXERCISES,
  getExercise,
  hasExercise,
  getExercises,
  searchExercises,
  recommendExercises,
  getSubstitutions,
  getBySubstitutionGroup,
  getByTargetRegion,
  getExerciseIds,
  validateDuplicateIds,
  validateDuplicateAliases,
  validateReferences,
  AriTrainingExerciseRegistry
};

export default AriTrainingExerciseRegistry;
