// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-registry.js
// Version: 1.0.0
// Purpose:
//   Central selectable Exercise Library for ARI Training.
//
// Design:
//   - Every selectable exercise exists here exactly once.
//   - Workout templates and custom plans reference exercise IDs.
//   - Records connect body parts, muscles, movement patterns,
//     exercise types, goals, equipment, logging behavior,
//     instructions, and future illustration assets.
//   - Free-text exercises are intentionally outside this registry.
// =====================================================

import BodyParts from "../anatomy/body-parts.js";
import Muscles from "../anatomy/muscles.js";
import MovementPatterns from "../movements/movement-patterns.js";
import ExerciseTypes from "../movements/exercise-types.js";

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/exercise-registry";

const EXERCISES = Object.freeze([
  // ===================================================
  // CHEST / PUSH
  // ===================================================
  {
    id: "barbell_bench_press",
    name: "Barbell Bench Press",
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["barbell", "bench", "rack"],
    difficulty: "intermediate",
    goals: {
      muscle_building: 10,
      strength: 10,
      upper_body_strength: 10,
      general_fitness: 6
    },
    summary:
      "Lie on a bench, lower the bar toward the mid-chest under control, then press it upward while keeping the upper back stable.",
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
    id: "dumbbell_bench_press",
    name: "Dumbbell Bench Press",
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "bench"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["dumbbells", "incline_bench"],
    difficulty: "beginner",
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
    id: "push_up",
    name: "Push-Up",
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["chest", "shoulders", "triceps", "core", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii", "serratus_anterior", "rectus_abdominis"],
    movementPatterns: ["horizontal_push", "anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
    id: "cable_chest_fly",
    name: "Cable Chest Fly",
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["chest", "shoulders", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "serratus_anterior"],
    movementPatterns: ["horizontal_push"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    goals: {
      muscle_building: 10,
      strength: 5,
      upper_body_strength: 6
    },
    summary:
      "Bring the cable handles toward each other in front of the body while maintaining a slight bend in the elbows.",
    instructions: [
      "Set the pulleys and take a stable split stance.",
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
    id: "machine_chest_press",
    name: "Machine Chest Press",
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["chest", "shoulders", "triceps", "upper_body"],
    primaryMuscles: ["pectoralis_major"],
    secondaryMuscles: ["anterior_deltoid", "triceps_brachii"],
    movementPatterns: ["horizontal_push"],
    equipment: ["chest_press_machine"],
    difficulty: "beginner",
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

  // ===================================================
  // SHOULDERS
  // ===================================================
  {
    id: "dumbbell_overhead_press",
    name: "Dumbbell Overhead Press",
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["shoulders", "triceps", "upper_body"],
    primaryMuscles: ["anterior_deltoid", "lateral_deltoid"],
    secondaryMuscles: ["triceps_brachii", "trapezius_upper", "serratus_anterior"],
    movementPatterns: ["vertical_push"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["shoulders", "upper_body"],
    primaryMuscles: ["lateral_deltoid"],
    secondaryMuscles: ["supraspinatus", "trapezius_upper"],
    movementPatterns: ["shoulder_abduction"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "machine_strength"],
    bodyParts: ["shoulders", "back", "upper_body"],
    primaryMuscles: ["posterior_deltoid"],
    secondaryMuscles: ["rhomboid_major", "rhomboid_minor", "trapezius_middle"],
    movementPatterns: ["shoulder_horizontal_abduction"],
    equipment: ["dumbbells", "reverse_fly_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "teres_major", "trapezius_lower"],
    movementPatterns: ["vertical_pull"],
    equipment: ["lat_pulldown_machine", "cable_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "calisthenics"],
    bodyParts: ["back", "biceps", "forearms", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["biceps_brachii", "brachialis", "brachioradialis", "teres_major"],
    movementPatterns: ["vertical_pull"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "intermediate",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "cable"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["biceps_brachii", "posterior_deltoid", "brachialis"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "lower_back", "core", "upper_body"],
    primaryMuscles: ["latissimus_dorsi", "rhomboid_major", "trapezius_middle"],
    secondaryMuscles: ["posterior_deltoid", "biceps_brachii", "erector_spinae"],
    movementPatterns: ["horizontal_pull", "hip_hinge"],
    equipment: ["barbell"],
    difficulty: "intermediate",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["back", "biceps", "upper_body"],
    primaryMuscles: ["latissimus_dorsi"],
    secondaryMuscles: ["rhomboid_major", "trapezius_middle", "posterior_deltoid", "biceps_brachii"],
    movementPatterns: ["horizontal_pull"],
    equipment: ["dumbbell", "bench"],
    difficulty: "beginner",
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "face_pull",
    name: "Face Pull",
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable", "resistance_band"],
    bodyParts: ["back", "shoulders", "upper_body"],
    primaryMuscles: ["posterior_deltoid", "infraspinatus", "teres_minor"],
    secondaryMuscles: ["trapezius_middle", "rhomboid_major"],
    movementPatterns: ["horizontal_pull", "shoulder_horizontal_abduction"],
    equipment: ["cable_machine", "resistance_band", "rope_attachment"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "arms", "forearms", "upper_body"],
    primaryMuscles: ["biceps_brachii"],
    secondaryMuscles: ["brachialis", "brachioradialis"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight"],
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    primaryMuscles: ["brachialis", "brachioradialis"],
    secondaryMuscles: ["biceps_brachii"],
    movementPatterns: ["elbow_flexion"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "free_weight", "cable"],
    bodyParts: ["triceps", "arms", "upper_body"],
    primaryMuscles: ["triceps_brachii"],
    secondaryMuscles: [],
    movementPatterns: ["elbow_extension"],
    equipment: ["dumbbell", "cable_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "core"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "erector_spinae"],
    movementPatterns: ["squat"],
    equipment: ["barbell", "squat_rack"],
    difficulty: "intermediate",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "core"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "erector_spinae"],
    movementPatterns: ["squat"],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "machine_strength"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris"],
    movementPatterns: ["squat"],
    equipment: ["leg_press_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["lower_body", "hamstrings", "glutes", "lower_back", "core"],
    primaryMuscles: ["biceps_femoris", "semitendinosus", "semimembranosus", "gluteus_maximus"],
    secondaryMuscles: ["erector_spinae", "forearm_flexors"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "dumbbells"],
    difficulty: "intermediate",
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
    category: "strength",
    exerciseTypes: ["strength", "free_weight"],
    bodyParts: ["full_body", "lower_body", "glutes", "hamstrings", "back", "core", "forearms"],
    primaryMuscles: ["gluteus_maximus", "biceps_femoris", "semitendinosus", "semimembranosus", "erector_spinae"],
    secondaryMuscles: ["latissimus_dorsi", "forearm_flexors", "quadriceps"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell"],
    difficulty: "advanced",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "free_weight"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["biceps_femoris", "gluteus_medius"],
    movementPatterns: ["hip_hinge"],
    equipment: ["barbell", "bench"],
    difficulty: "intermediate",
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
    category: "strength",
    exerciseTypes: ["strength", "calisthenics"],
    bodyParts: ["glutes", "hips", "hamstrings", "lower_body"],
    primaryMuscles: ["gluteus_maximus"],
    secondaryMuscles: ["hamstrings"],
    movementPatterns: ["hip_hinge"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy", "functional"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "core"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["biceps_femoris", "gluteus_medius"],
    movementPatterns: ["lunge"],
    equipment: ["bodyweight", "dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "functional", "free_weight"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "calves"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["gluteus_medius", "gastrocnemius", "soleus"],
    movementPatterns: ["step"],
    equipment: ["box", "bench", "bodyweight", "dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["quadriceps", "lower_body"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "vastus_intermedius"],
    secondaryMuscles: [],
    movementPatterns: ["knee_extension"],
    equipment: ["leg_extension_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["hamstrings", "lower_body"],
    primaryMuscles: ["biceps_femoris", "semitendinosus", "semimembranosus"],
    secondaryMuscles: ["gastrocnemius"],
    movementPatterns: ["knee_flexion"],
    equipment: ["leg_curl_machine"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["strength", "hypertrophy"],
    bodyParts: ["calves", "lower_body"],
    primaryMuscles: ["gastrocnemius"],
    secondaryMuscles: ["soleus"],
    movementPatterns: ["calf_raise"],
    equipment: ["bodyweight", "machine", "dumbbells"],
    difficulty: "beginner",
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
    category: "strength",
    exerciseTypes: ["hypertrophy", "machine_strength"],
    bodyParts: ["glutes", "abductors", "hips", "lower_body"],
    primaryMuscles: ["gluteus_medius", "gluteus_minimus"],
    secondaryMuscles: ["tensor_fasciae_latae"],
    movementPatterns: ["hip_abduction"],
    equipment: ["hip_abduction_machine"],
    difficulty: "beginner",
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
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals", "lower_back"],
    primaryMuscles: ["rectus_abdominis", "transversus_abdominis"],
    secondaryMuscles: ["external_oblique", "internal_oblique", "gluteus_maximus"],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "obliques", "lower_back"],
    primaryMuscles: ["external_oblique", "internal_oblique", "quadratus_lumborum"],
    secondaryMuscles: ["gluteus_medius", "transversus_abdominis"],
    movementPatterns: ["anti_lateral_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
      fields: ["sets", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "pallof_press",
    name: "Pallof Press",
    category: "core",
    exerciseTypes: ["core", "cable", "resistance_band"],
    bodyParts: ["core", "obliques"],
    primaryMuscles: ["transversus_abdominis", "external_oblique", "internal_oblique"],
    secondaryMuscles: ["rectus_abdominis"],
    movementPatterns: ["anti_rotation"],
    equipment: ["cable_machine", "resistance_band"],
    difficulty: "beginner",
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
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "crunch",
    name: "Crunch",
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: ["external_oblique", "internal_oblique"],
    movementPatterns: ["trunk_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
    category: "functional",
    exerciseTypes: ["functional", "strength"],
    bodyParts: ["full_body", "forearms", "core", "shoulders"],
    primaryMuscles: ["forearm_flexors", "trapezius_upper", "transversus_abdominis"],
    secondaryMuscles: ["quadratus_lumborum", "gluteus_medius", "erector_spinae"],
    movementPatterns: ["loaded_carry", "walking"],
    equipment: ["dumbbells", "kettlebells"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["walking", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "glutes", "calves"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["walking"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "glutes", "calves", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["running", "cardio", "endurance"],
    bodyParts: ["full_body", "lower_body", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
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
    category: "cardio",
    exerciseTypes: ["running", "hiit", "speed"],
    bodyParts: ["full_body", "lower_body", "core"],
    primaryMuscles: ["gluteus_maximus", "gastrocnemius", "soleus"],
    secondaryMuscles: ["hamstrings", "rectus_femoris", "tibialis_anterior"],
    movementPatterns: ["running", "sprint"],
    equipment: ["none", "treadmill"],
    difficulty: "intermediate",
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
    category: "cardio",
    exerciseTypes: ["cycling", "cardio", "endurance"],
    bodyParts: ["lower_body", "quadriceps", "glutes", "hamstrings", "calves"],
    primaryMuscles: ["rectus_femoris", "vastus_lateralis", "vastus_medialis", "gluteus_maximus"],
    secondaryMuscles: ["hamstrings", "gastrocnemius", "soleus"],
    movementPatterns: ["cycling"],
    equipment: ["stationary_bike"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["rowing", "cardio", "endurance"],
    bodyParts: ["full_body", "back", "lower_body", "core"],
    primaryMuscles: ["rectus_femoris", "gluteus_maximus", "latissimus_dorsi"],
    secondaryMuscles: ["hamstrings", "biceps_brachii", "trapezius_middle", "erector_spinae"],
    movementPatterns: ["rowing_cardio"],
    equipment: ["rowing_machine"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: ["lower_body", "glutes", "quadriceps", "calves"],
    primaryMuscles: ["gluteus_maximus", "rectus_femoris", "vastus_lateralis", "vastus_medialis"],
    secondaryMuscles: ["gastrocnemius", "soleus", "hamstrings"],
    movementPatterns: ["stair_climbing"],
    equipment: ["stair_climber"],
    difficulty: "beginner",
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
    category: "cardio",
    exerciseTypes: ["cardio", "endurance"],
    bodyParts: ["full_body", "lower_body"],
    primaryMuscles: ["quadriceps", "gluteus_maximus"],
    secondaryMuscles: ["hamstrings", "gastrocnemius", "soleus"],
    movementPatterns: ["elliptical"],
    equipment: ["elliptical"],
    difficulty: "beginner",
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
    category: "mobility",
    exerciseTypes: ["flexibility", "mobility", "recovery"],
    bodyParts: ["hips", "lower_body"],
    primaryMuscles: ["iliopsoas"],
    secondaryMuscles: ["rectus_femoris"],
    movementPatterns: ["static_stretch"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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
    category: "mobility",
    exerciseTypes: ["mobility", "recovery"],
    bodyParts: ["calves", "shins", "lower_body"],
    primaryMuscles: ["tibialis_anterior"],
    secondaryMuscles: ["gastrocnemius", "soleus"],
    movementPatterns: ["mobility"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
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

const EXERCISE_MAP = new Map(
  EXERCISES.map(
    exercise => [
      exercise.id,
      exercise
    ]
  )
);

const EXERCISE_ALIAS_MAP = new Map();

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
    .replace(/['â]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

for (const exercise of EXERCISES) {
  const aliases = [
    exercise.id,
    exercise.name,
    slugify(exercise.name)
  ];

  for (const alias of aliases) {
    EXERCISE_ALIAS_MAP.set(
      normalizeText(alias),
      exercise.id
    );
  }
}

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

function getExercises({
  bodyPart = null,
  muscle = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
  goal = null,
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
        ) !== normalizedDifficulty
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
        ...(exercise.exerciseTypes || []),
        ...(exercise.bodyParts || []),
        ...(exercise.primaryMuscles || []),
        ...(exercise.secondaryMuscles || []),
        ...(exercise.movementPatterns || []),
        ...(exercise.equipment || []),
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

function recommendExercises({
  goal,
  bodyPart = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
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

function getExerciseIds() {
  return EXERCISES.map(
    exercise => exercise.id
  );
}

function validateReferences() {
  const invalid = [];

  for (const exercise of EXERCISES) {
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
  }

  return {
    valid:
      invalid.length === 0,
    invalid
  };
}

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

    ids:
      getExerciseIds,

    validate:
      validateReferences
  });

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

export {
  VERSION,
  SOURCE,
  EXERCISES,
  getExercise,
  hasExercise,
  getExercises,
  searchExercises,
  recommendExercises,
  getExerciseIds,
  validateReferences,
  AriTrainingExerciseRegistry
};

export default AriTrainingExerciseRegistry;
