// =====================================================
// ARI REBIRTH
// File: js/training/exercises/core/core.js
// Version: 1.0.0
// Purpose:
//   Core and trunk exercise data for the ARI Training
//   Exercise Registry.
//
// Design:
//   - Preserves existing core exercise IDs.
//   - Covers anti-extension, anti-rotation,
//     anti-lateral-flexion, trunk flexion, and rotation.
//   - Includes bodyweight, cable, machine, and loaded work.
//   - Uses anatomy IDs from muscles.js and movement IDs
//     already available in movement-patterns.js.
//   - Adds aliases, target emphasis, substitution groups,
//     substitutions, laterality, setup, and logging metadata.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/exercises/core/core";

const CORE_EXERCISES = Object.freeze([
  // ===================================================
  // ANTI-EXTENSION / PLANKS
  // ===================================================
  {
    id: "front_plank",
    name: "Front Plank",
    aliases: [
      "plank",
      "forearm plank",
      "standard plank"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals", "lower_back"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "gluteus_maximus"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "anterior_core",
      label: "Core Stability"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "high_plank",
      "dead_bug",
      "body_saw",
      "ab_wheel_rollout"
    ],
    laterality: "bilateral",
    setup: "forearm_floor",
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
    id: "high_plank",
    name: "High Plank",
    aliases: [
      "straight arm plank",
      "push up plank",
      "top of push up hold"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals", "shoulders", "upper_body"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "serratus_anterior",
      "anterior_deltoid"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "anterior_core",
      label: "Core Stability"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "front_plank",
      "dead_bug",
      "plank_shoulder_tap"
    ],
    laterality: "bilateral",
    setup: "hands_floor",
    goals: {
      core_strength: 9,
      general_fitness: 8,
      upper_body_strength: 5
    },
    summary:
      "Hold the top of a push-up position while resisting trunk and hip movement.",
    instructions: [
      "Place the hands beneath the shoulders.",
      "Extend the legs behind you.",
      "Brace the abdomen and glutes.",
      "Maintain a straight line from head to heels."
    ],
    cues: [
      "Push the floor away.",
      "Keep the ribs and pelvis controlled."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "dead_bug",
    name: "Dead Bug",
    aliases: [
      "deadbug",
      "dead bug exercise",
      "alternating dead bug"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals"],
    primaryMuscles: [
      "transversus_abdominis",
      "rectus_abdominis"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "deep_core",
      label: "Deep Core"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "front_plank",
      "bird_dog",
      "hollow_body_hold"
    ],
    laterality: "alternating",
    setup: "supine_floor",
    goals: {
      core_strength: 10,
      general_fitness: 9,
      recovery: 7,
      athletic_performance: 7
    },
    summary:
      "Lower opposite arm and leg away from the body while resisting lower-back arching.",
    instructions: [
      "Lie on the back with the hips and knees bent.",
      "Raise the arms toward the ceiling.",
      "Lower one arm and the opposite leg while keeping the trunk stable.",
      "Return and alternate sides."
    ],
    cues: [
      "Keep the lower back controlled.",
      "Move slowly."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "hollow_body_hold",
    name: "Hollow Body Hold",
    aliases: [
      "hollow hold",
      "gymnastics hollow hold",
      "hollow body"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "anterior_core",
      label: "Abs"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "front_plank",
      "dead_bug",
      "body_saw"
    ],
    laterality: "bilateral",
    setup: "supine_floor",
    goals: {
      core_strength: 10,
      athletic_performance: 8,
      general_fitness: 7
    },
    summary:
      "Hold a curved-body position while keeping the lower back pressed toward the floor.",
    instructions: [
      "Lie on the back.",
      "Lift the shoulders and legs from the floor.",
      "Reach the arms overhead or forward.",
      "Hold while maintaining trunk tension."
    ],
    cues: [
      "Keep the lower back from arching.",
      "Shorten the lever if needed."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "body_saw",
    name: "Body Saw",
    aliases: [
      "plank body saw",
      "slider body saw",
      "forearm body saw"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "abdominals", "shoulders"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "serratus_anterior",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight", "sliders"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "anterior_core",
      label: "Abs + Deep Core"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "front_plank",
      "ab_wheel_rollout",
      "hollow_body_hold"
    ],
    laterality: "bilateral",
    setup: "forearm_plank_sliders",
    goals: {
      core_strength: 10,
      athletic_performance: 8,
      general_fitness: 7
    },
    summary:
      "Shift the body backward and forward from a forearm plank while resisting spinal extension.",
    instructions: [
      "Begin in a forearm plank.",
      "Place the feet on sliders if available.",
      "Shift the body backward under control.",
      "Pull back to the starting position."
    ],
    cues: [
      "Keep the hips from sagging.",
      "Use a small controlled range at first."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "ab_wheel_rollout",
    name: "Ab Wheel Rollout",
    aliases: [
      "ab roller",
      "ab wheel",
      "kneeling ab rollout"
    ],
    category: "core",
    exerciseTypes: ["core", "strength"],
    bodyParts: ["core", "abdominals", "shoulders", "upper_body"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: [
      "latissimus_dorsi",
      "serratus_anterior"
    ],
    movementPatterns: ["anti_extension"],
    equipment: ["ab_wheel"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "anterior_core",
      label: "Abs"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "body_saw",
      "front_plank",
      "stability_ball_rollout"
    ],
    laterality: "bilateral",
    setup: "kneeling",
    goals: {
      core_strength: 10,
      strength: 8,
      athletic_performance: 8
    },
    summary:
      "Roll the body forward from a kneeling position while resisting lower-back extension, then return.",
    instructions: [
      "Kneel while holding the wheel beneath the shoulders.",
      "Brace the trunk.",
      "Roll forward only as far as you can maintain control.",
      "Pull back to the starting position."
    ],
    cues: [
      "Do not let the lower back sag.",
      "Progress range gradually."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "stability_ball_rollout",
    name: "Stability Ball Rollout",
    aliases: [
      "swiss ball rollout",
      "exercise ball rollout",
      "ball ab rollout"
    ],
    category: "core",
    exerciseTypes: ["core", "stability"],
    bodyParts: ["core", "abdominals", "shoulders"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: ["serratus_anterior"],
    movementPatterns: ["anti_extension"],
    equipment: ["stability_ball"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "deep_core",
      label: "Core Stability"
    },
    substitutionGroup: "anti_extension",
    substitutions: [
      "ab_wheel_rollout",
      "front_plank",
      "body_saw"
    ],
    laterality: "bilateral",
    setup: "kneeling_ball",
    goals: {
      core_strength: 9,
      general_fitness: 8,
      athletic_performance: 7
    },
    summary:
      "Roll the forearms forward over a stability ball while resisting spinal extension.",
    instructions: [
      "Kneel with the forearms on the ball.",
      "Brace the trunk.",
      "Roll the ball forward.",
      "Return without allowing the lower back to arch."
    ],
    cues: [
      "Keep the hips and ribs controlled.",
      "Use a short range at first."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // ANTI-ROTATION
  // ===================================================
  {
    id: "pallof_press",
    name: "Pallof Press",
    aliases: [
      "pallof",
      "cable pallof press",
      "band pallof press"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "resistance_band"],
    bodyParts: ["core", "obliques"],
    primaryMuscles: [
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: ["rectus_abdominis"],
    movementPatterns: ["anti_rotation"],
    equipment: ["cable_machine", "resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "anti_rotation",
      label: "Obliques + Deep Core"
    },
    substitutionGroup: "anti_rotation",
    substitutions: [
      "half_kneeling_pallof_press",
      "pallof_press_hold",
      "plank_shoulder_tap"
    ],
    laterality: "bilateral_sides",
    setup: "standing_cable_or_band",
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
    id: "half_kneeling_pallof_press",
    name: "Half-Kneeling Pallof Press",
    aliases: [
      "kneeling pallof press",
      "half kneeling anti rotation press"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "resistance_band"],
    bodyParts: ["core", "obliques", "hips"],
    primaryMuscles: [
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: ["gluteus_medius"],
    movementPatterns: ["anti_rotation"],
    equipment: ["cable_machine", "resistance_band"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "anti_rotation",
      label: "Obliques + Core"
    },
    substitutionGroup: "anti_rotation",
    substitutions: [
      "pallof_press",
      "pallof_press_hold"
    ],
    laterality: "bilateral_sides",
    setup: "half_kneeling",
    goals: {
      core_strength: 10,
      athletic_performance: 9,
      general_fitness: 8
    },
    summary:
      "Perform a Pallof press from a half-kneeling position to increase trunk and pelvic stability demands.",
    instructions: [
      "Kneel sideways to the anchor with one knee down.",
      "Hold the handle at the chest.",
      "Press forward while resisting rotation.",
      "Return slowly."
    ],
    cues: [
      "Keep the pelvis square.",
      "Do not lean toward or away from the cable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "pallof_press_hold",
    name: "Pallof Press Hold",
    aliases: [
      "pallof hold",
      "anti rotation hold",
      "cable pallof hold"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "resistance_band"],
    bodyParts: ["core", "obliques"],
    primaryMuscles: [
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: ["rectus_abdominis"],
    movementPatterns: ["anti_rotation"],
    equipment: ["cable_machine", "resistance_band"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "anti_rotation",
      label: "Anti-Rotation"
    },
    substitutionGroup: "anti_rotation",
    substitutions: [
      "pallof_press",
      "half_kneeling_pallof_press"
    ],
    laterality: "bilateral_sides",
    setup: "standing_cable_or_band",
    goals: {
      core_strength: 10,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Hold the arms extended against a sideways cable or band pull without allowing the torso to rotate.",
    instructions: [
      "Stand sideways to the resistance.",
      "Press the hands away from the chest.",
      "Hold the extended position.",
      "Return and repeat on the other side."
    ],
    cues: [
      "Keep the ribs and pelvis stacked.",
      "Do not rotate toward the anchor."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "side", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "plank_shoulder_tap",
    name: "Plank Shoulder Tap",
    aliases: [
      "shoulder tap plank",
      "high plank shoulder tap",
      "plank taps"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "obliques", "shoulders", "upper_body"],
    primaryMuscles: [
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "rectus_abdominis",
      "serratus_anterior",
      "anterior_deltoid"
    ],
    movementPatterns: ["anti_rotation", "anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "anti_rotation",
      label: "Core Stability"
    },
    substitutionGroup: "anti_rotation",
    substitutions: [
      "pallof_press",
      "high_plank",
      "bird_dog"
    ],
    laterality: "alternating",
    setup: "high_plank",
    goals: {
      core_strength: 10,
      upper_body_strength: 6,
      athletic_performance: 8,
      general_fitness: 8
    },
    summary:
      "Tap the opposite shoulder from a high plank while resisting hip and trunk rotation.",
    instructions: [
      "Begin in a high plank.",
      "Shift weight slightly into one hand.",
      "Tap the opposite shoulder.",
      "Return and alternate sides."
    ],
    cues: [
      "Keep the hips as still as possible.",
      "Use a wider foot stance if needed."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "bird_dog",
    name: "Bird Dog",
    aliases: [
      "bird-dog",
      "quadruped opposite arm leg",
      "quadruped bird dog"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "lower_back", "glutes"],
    primaryMuscles: [
      "transversus_abdominis",
      "erector_spinae"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["anti_rotation", "anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "transversus_abdominis",
      region: "spinal_stability",
      label: "Core + Back Stability"
    },
    substitutionGroup: "anti_rotation",
    substitutions: [
      "dead_bug",
      "plank_shoulder_tap",
      "pallof_press"
    ],
    laterality: "alternating",
    setup: "quadruped_floor",
    goals: {
      core_strength: 9,
      general_fitness: 9,
      recovery: 8,
      athletic_performance: 7
    },
    summary:
      "Extend opposite arm and leg from a hands-and-knees position while keeping the trunk stable.",
    instructions: [
      "Begin on hands and knees.",
      "Brace the trunk.",
      "Extend one arm and the opposite leg.",
      "Return and alternate sides."
    ],
    cues: [
      "Keep the pelvis level.",
      "Reach long rather than lifting excessively high."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // ANTI-LATERAL FLEXION / SIDE STABILITY
  // ===================================================
  {
    id: "side_plank",
    name: "Side Plank",
    aliases: [
      "side plank hold",
      "forearm side plank"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "obliques", "lower_back"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "quadratus_lumborum"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "transversus_abdominis"
    ],
    movementPatterns: ["anti_lateral_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "quadratus_lumborum",
      region: "lateral_core",
      label: "Obliques + QL"
    },
    substitutionGroup: "anti_lateral_flexion",
    substitutions: [
      "weighted_side_plank",
      "suitcase_carry",
      "suitcase_hold"
    ],
    laterality: "unilateral",
    setup: "side_forearm_floor",
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
    id: "weighted_side_plank",
    name: "Weighted Side Plank",
    aliases: [
      "loaded side plank",
      "weighted lateral plank"
    ],
    category: "core",
    exerciseTypes: ["core", "strength"],
    bodyParts: ["core", "obliques", "lower_back"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique",
      "quadratus_lumborum"
    ],
    secondaryMuscles: [
      "gluteus_medius",
      "transversus_abdominis"
    ],
    movementPatterns: ["anti_lateral_flexion"],
    equipment: ["weight_plate", "bodyweight"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "quadratus_lumborum",
      region: "lateral_core",
      label: "Lateral Core"
    },
    substitutionGroup: "anti_lateral_flexion",
    substitutions: [
      "side_plank",
      "suitcase_hold",
      "suitcase_carry"
    ],
    laterality: "unilateral",
    setup: "side_forearm_floor",
    goals: {
      core_strength: 10,
      strength: 8,
      athletic_performance: 8
    },
    summary:
      "Hold a side plank with external resistance added over the upper hip.",
    instructions: [
      "Set up in a stable side plank.",
      "Position the load securely over the upper hip.",
      "Lift and hold the hips.",
      "Lower safely before switching sides."
    ],
    cues: [
      "Do not sacrifice alignment for load.",
      "Keep the shoulder stacked."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "suitcase_hold",
    name: "Suitcase Hold",
    aliases: [
      "single arm static hold",
      "one sided farmers hold",
      "suitcase static hold"
    ],
    category: "core",
    exerciseTypes: ["core", "strength", "functional"],
    bodyParts: ["core", "obliques", "forearms", "full_body"],
    primaryMuscles: [
      "quadratus_lumborum",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "forearm_flexors",
      "transversus_abdominis"
    ],
    movementPatterns: ["anti_lateral_flexion", "loaded_carry"],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "quadratus_lumborum",
      region: "lateral_core",
      label: "Lateral Core"
    },
    substitutionGroup: "anti_lateral_flexion",
    substitutions: [
      "side_plank",
      "suitcase_carry"
    ],
    laterality: "unilateral",
    setup: "standing",
    goals: {
      core_strength: 10,
      grip_strength: 8,
      strength: 7,
      athletic_performance: 8
    },
    summary:
      "Hold a heavy weight on one side while resisting side bending.",
    instructions: [
      "Pick up one dumbbell or kettlebell.",
      "Stand tall with the load beside one hip.",
      "Hold without leaning.",
      "Switch sides after the planned duration."
    ],
    cues: [
      "Keep the shoulders level.",
      "Do not let the weight pull the torso sideways."
    ],
    logging: {
      type: "sets_duration",
      fields: ["sets", "duration_seconds", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "suitcase_carry",
    name: "Suitcase Carry",
    aliases: [
      "single arm farmers carry",
      "one arm carry",
      "offset carry"
    ],
    category: "functional",
    exerciseTypes: ["core", "strength", "functional"],
    bodyParts: ["core", "obliques", "forearms", "full_body"],
    primaryMuscles: [
      "quadratus_lumborum",
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "forearm_flexors",
      "gluteus_medius",
      "transversus_abdominis"
    ],
    movementPatterns: ["anti_lateral_flexion", "loaded_carry", "walking"],
    equipment: ["dumbbell", "kettlebell"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "quadratus_lumborum",
      region: "lateral_core",
      label: "Lateral Core"
    },
    substitutionGroup: "anti_lateral_flexion",
    substitutions: [
      "suitcase_hold",
      "side_plank"
    ],
    laterality: "unilateral",
    setup: "walking",
    goals: {
      core_strength: 10,
      grip_strength: 8,
      athletic_performance: 9,
      general_fitness: 8
    },
    summary:
      "Walk while carrying a weight on one side and resisting lateral trunk flexion.",
    instructions: [
      "Hold one weight at the side.",
      "Stand tall.",
      "Walk for the planned distance or time.",
      "Switch sides."
    ],
    cues: [
      "Keep the shoulders level.",
      "Take controlled steps."
    ],
    logging: {
      type: "sets_weight_distance",
      fields: ["sets", "weight", "distance", "duration_seconds", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // TRUNK FLEXION / ABDOMINAL HYPERTROPHY
  // ===================================================
  {
    id: "crunch",
    name: "Crunch",
    aliases: [
      "ab crunch",
      "floor crunch",
      "basic crunch"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "abdominals",
      label: "Abs"
    },
    substitutionGroup: "trunk_flexion",
    substitutions: [
      "cable_crunch",
      "machine_crunch",
      "stability_ball_crunch"
    ],
    laterality: "bilateral",
    setup: "supine_floor",
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

  {
    id: "cable_crunch",
    name: "Cable Crunch",
    aliases: [
      "kneeling cable crunch",
      "rope cable crunch",
      "cable ab crunch"
    ],
    category: "core",
    exerciseTypes: ["core", "hypertrophy", "cable"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["cable_machine", "rope_attachment"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "abdominals",
      label: "Abs"
    },
    substitutionGroup: "trunk_flexion",
    substitutions: [
      "crunch",
      "machine_crunch",
      "stability_ball_crunch"
    ],
    laterality: "bilateral",
    setup: "kneeling_cable",
    goals: {
      muscle_building: 10,
      core_strength: 9,
      strength: 6
    },
    summary:
      "Flex the trunk against cable resistance from a kneeling position.",
    instructions: [
      "Kneel beneath a high cable with a rope attachment.",
      "Hold the rope near the sides of the head.",
      "Curl the rib cage toward the pelvis.",
      "Return under control."
    ],
    cues: [
      "Move through the trunk rather than pulling with the arms.",
      "Keep the hips relatively stable."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "machine_crunch",
    name: "Machine Crunch",
    aliases: [
      "ab crunch machine",
      "machine abdominal crunch",
      "seated ab machine"
    ],
    category: "core",
    exerciseTypes: ["core", "hypertrophy", "machine_strength"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["ab_crunch_machine"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "abdominals",
      label: "Abs"
    },
    substitutionGroup: "trunk_flexion",
    substitutions: [
      "cable_crunch",
      "crunch",
      "stability_ball_crunch"
    ],
    laterality: "bilateral",
    setup: "seated_machine",
    goals: {
      muscle_building: 10,
      core_strength: 8,
      strength: 6
    },
    summary:
      "Flex the trunk against machine resistance to train the abdominal muscles.",
    instructions: [
      "Adjust the machine to fit the torso.",
      "Brace the abdomen.",
      "Curl the torso forward.",
      "Return slowly."
    ],
    cues: [
      "Avoid pulling primarily with the arms.",
      "Do not let the weight stack slam."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "stability_ball_crunch",
    name: "Stability Ball Crunch",
    aliases: [
      "swiss ball crunch",
      "exercise ball crunch",
      "ball ab crunch"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["stability_ball"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "abdominals",
      label: "Abs"
    },
    substitutionGroup: "trunk_flexion",
    substitutions: [
      "crunch",
      "cable_crunch",
      "machine_crunch"
    ],
    laterality: "bilateral",
    setup: "supine_ball",
    goals: {
      core_strength: 8,
      muscle_building: 7,
      general_fitness: 8
    },
    summary:
      "Perform a crunch over a stability ball to allow a controlled extended starting position.",
    instructions: [
      "Position the lower and mid-back over the ball.",
      "Plant the feet securely.",
      "Curl the torso upward.",
      "Lower under control."
    ],
    cues: [
      "Keep the ball stable.",
      "Avoid pulling the head forward."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // LEG RAISE / PELVIC CONTROL
  // ===================================================
  {
    id: "reverse_crunch",
    name: "Reverse Crunch",
    aliases: [
      "reverse ab crunch",
      "hip lift crunch",
      "pelvic curl"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "transversus_abdominis",
      "external_oblique",
      "internal_oblique"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "lying_leg_raise",
      "hanging_knee_raise",
      "captains_chair_knee_raise"
    ],
    laterality: "bilateral",
    setup: "supine_floor",
    goals: {
      core_strength: 9,
      muscle_building: 7,
      general_fitness: 8
    },
    summary:
      "Curl the pelvis toward the rib cage by drawing the knees inward and lifting the hips slightly.",
    instructions: [
      "Lie on the back with the knees bent.",
      "Draw the knees toward the torso.",
      "Curl the pelvis slightly from the floor.",
      "Lower slowly."
    ],
    cues: [
      "Avoid swinging the legs.",
      "Use abdominal control rather than momentum."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "lying_leg_raise",
    name: "Lying Leg Raise",
    aliases: [
      "floor leg raise",
      "lying straight leg raise",
      "leg raises"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core", "hips"],
    primaryMuscles: [
      "rectus_abdominis",
      "transversus_abdominis"
    ],
    secondaryMuscles: ["iliopsoas"],
    movementPatterns: ["anti_extension"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "reverse_crunch",
      "hanging_knee_raise",
      "captains_chair_knee_raise"
    ],
    laterality: "bilateral",
    setup: "supine_floor",
    goals: {
      core_strength: 9,
      muscle_building: 7,
      general_fitness: 8
    },
    summary:
      "Raise and lower the legs while resisting excessive lower-back arching.",
    instructions: [
      "Lie on the back with the legs extended.",
      "Brace the abdomen.",
      "Raise the legs under control.",
      "Lower only as far as you can maintain trunk position."
    ],
    cues: [
      "Keep the lower back controlled.",
      "Bend the knees if needed."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "hanging_knee_raise",
    name: "Hanging Knee Raise",
    aliases: [
      "hanging knee raises",
      "knee raise from pull up bar",
      "hanging ab knee raise"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core", "hips", "forearms"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "iliopsoas",
      "transversus_abdominis",
      "forearm_flexors"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "captains_chair_knee_raise",
      "reverse_crunch",
      "hanging_leg_raise"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      core_strength: 10,
      grip_strength: 6,
      upper_body_strength: 5,
      general_fitness: 8
    },
    summary:
      "Raise the knees toward the torso from a hanging position while minimizing swinging.",
    instructions: [
      "Hang securely from the bar.",
      "Brace the trunk.",
      "Raise the knees toward the torso.",
      "Lower under control."
    ],
    cues: [
      "Avoid swinging.",
      "Curl the pelvis slightly at the top."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    aliases: [
      "straight leg hanging raise",
      "hanging straight leg raise",
      "toes up leg raise"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core", "hips", "forearms"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "iliopsoas",
      "transversus_abdominis",
      "forearm_flexors"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["pull_up_bar", "bodyweight"],
    difficulty: "advanced",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "hanging_knee_raise",
      "captains_chair_leg_raise",
      "lying_leg_raise"
    ],
    laterality: "bilateral",
    setup: "hanging",
    goals: {
      core_strength: 10,
      grip_strength: 7,
      athletic_performance: 8
    },
    summary:
      "Raise relatively straight legs from a hanging position while controlling the pelvis and trunk.",
    instructions: [
      "Hang securely from a bar.",
      "Brace the trunk.",
      "Raise the legs in front of the body.",
      "Lower under control."
    ],
    cues: [
      "Avoid swinging.",
      "Use bent knees if straight legs are not yet controlled."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "added_weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "captains_chair_knee_raise",
    name: "Captain's Chair Knee Raise",
    aliases: [
      "vertical knee raise",
      "roman chair knee raise",
      "captain chair knee raise"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core", "hips"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "iliopsoas",
      "transversus_abdominis"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["captains_chair"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "hanging_knee_raise",
      "reverse_crunch",
      "captains_chair_leg_raise"
    ],
    laterality: "bilateral",
    setup: "captains_chair",
    goals: {
      core_strength: 9,
      muscle_building: 7,
      general_fitness: 8
    },
    summary:
      "Raise the knees toward the torso while supported on a captain's chair.",
    instructions: [
      "Support the forearms and back securely.",
      "Let the legs hang.",
      "Raise the knees toward the torso.",
      "Lower slowly."
    ],
    cues: [
      "Avoid swinging.",
      "Keep the lower back supported."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "captains_chair_leg_raise",
    name: "Captain's Chair Leg Raise",
    aliases: [
      "vertical leg raise",
      "roman chair leg raise",
      "captain chair straight leg raise"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["abdominals", "core", "hips"],
    primaryMuscles: ["rectus_abdominis"],
    secondaryMuscles: [
      "iliopsoas",
      "transversus_abdominis"
    ],
    movementPatterns: ["trunk_flexion"],
    equipment: ["captains_chair"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "rectus_abdominis",
      region: "lower_abdominal_control",
      label: "Abs"
    },
    substitutionGroup: "leg_raise_core",
    substitutions: [
      "captains_chair_knee_raise",
      "hanging_leg_raise",
      "lying_leg_raise"
    ],
    laterality: "bilateral",
    setup: "captains_chair",
    goals: {
      core_strength: 10,
      muscle_building: 8,
      general_fitness: 8
    },
    summary:
      "Raise relatively straight legs while supported on a captain's chair.",
    instructions: [
      "Set the arms and back securely against the station.",
      "Let the legs hang.",
      "Raise the legs in front of the body.",
      "Lower slowly."
    ],
    cues: [
      "Avoid swinging.",
      "Bend the knees if needed to preserve control."
    ],
    logging: {
      type: "sets_reps",
      fields: ["sets", "reps", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  // ===================================================
  // ROTATION / OBLIQUES
  // ===================================================
  {
    id: "cable_wood_chop",
    name: "Cable Wood Chop",
    aliases: [
      "cable chop",
      "woodchopper",
      "standing cable rotation"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "functional"],
    bodyParts: ["core", "obliques", "hips"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "transversus_abdominis",
      "rectus_abdominis"
    ],
    movementPatterns: ["trunk_rotation"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "rotational_core",
      label: "Obliques"
    },
    substitutionGroup: "trunk_rotation",
    substitutions: [
      "low_to_high_cable_chop",
      "medicine_ball_rotation",
      "russian_twist"
    ],
    laterality: "bilateral_sides",
    setup: "standing_cable",
    goals: {
      core_strength: 9,
      athletic_performance: 10,
      muscle_building: 6,
      general_fitness: 8
    },
    summary:
      "Rotate the torso diagonally against cable resistance while coordinating the trunk and hips.",
    instructions: [
      "Stand sideways to a high cable.",
      "Grip the handle with both hands.",
      "Pull diagonally across the body.",
      "Return under control and repeat on the other side."
    ],
    cues: [
      "Rotate under control.",
      "Keep the knees and hips stable enough for the intended variation."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "low_to_high_cable_chop",
    name: "Low-to-High Cable Chop",
    aliases: [
      "low high cable chop",
      "upward cable wood chop",
      "low to high woodchop"
    ],
    category: "core",
    exerciseTypes: ["core", "cable", "functional"],
    bodyParts: ["core", "obliques", "hips"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "transversus_abdominis",
      "rectus_abdominis"
    ],
    movementPatterns: ["trunk_rotation"],
    equipment: ["cable_machine", "single_handle"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "rotational_core",
      label: "Obliques"
    },
    substitutionGroup: "trunk_rotation",
    substitutions: [
      "cable_wood_chop",
      "medicine_ball_rotation"
    ],
    laterality: "bilateral_sides",
    setup: "standing_low_cable",
    goals: {
      core_strength: 9,
      athletic_performance: 10,
      general_fitness: 8
    },
    summary:
      "Rotate a low cable diagonally upward across the body.",
    instructions: [
      "Stand sideways to a low cable.",
      "Grip the handle with both hands.",
      "Rotate and lift diagonally upward.",
      "Return slowly."
    ],
    cues: [
      "Keep the movement smooth.",
      "Avoid pulling only with the arms."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "russian_twist",
    name: "Russian Twist",
    aliases: [
      "seated russian twist",
      "weighted russian twist",
      "russian twists"
    ],
    category: "core",
    exerciseTypes: ["core", "calisthenics"],
    bodyParts: ["core", "obliques"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: ["rectus_abdominis"],
    movementPatterns: ["trunk_rotation"],
    equipment: ["bodyweight", "medicine_ball", "dumbbell", "weight_plate"],
    difficulty: "beginner",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "rotational_core",
      label: "Obliques"
    },
    substitutionGroup: "trunk_rotation",
    substitutions: [
      "cable_wood_chop",
      "medicine_ball_rotation"
    ],
    laterality: "alternating",
    setup: "seated_floor",
    goals: {
      core_strength: 8,
      muscle_building: 6,
      general_fitness: 8
    },
    summary:
      "Rotate the torso side to side from a seated position while maintaining trunk control.",
    instructions: [
      "Sit with the torso leaned back slightly.",
      "Brace the abdomen.",
      "Rotate from side to side.",
      "Use external weight only if control is maintained."
    ],
    cues: [
      "Move through the trunk, not only the arms.",
      "Keep the movement controlled."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  },

  {
    id: "medicine_ball_rotation",
    name: "Medicine Ball Rotational Throw",
    aliases: [
      "med ball rotational throw",
      "medicine ball side throw",
      "rotational wall throw"
    ],
    category: "core",
    exerciseTypes: ["core", "functional", "power"],
    bodyParts: ["core", "obliques", "hips", "full_body"],
    primaryMuscles: [
      "external_oblique",
      "internal_oblique"
    ],
    secondaryMuscles: [
      "gluteus_maximus",
      "transversus_abdominis"
    ],
    movementPatterns: ["trunk_rotation"],
    equipment: ["medicine_ball", "wall"],
    difficulty: "intermediate",
    targetEmphasis: {
      muscle: "external_oblique",
      region: "rotational_power",
      label: "Rotational Core"
    },
    substitutionGroup: "trunk_rotation",
    substitutions: [
      "cable_wood_chop",
      "low_to_high_cable_chop"
    ],
    laterality: "bilateral_sides",
    setup: "standing_wall",
    goals: {
      core_strength: 8,
      athletic_performance: 10,
      strength: 7,
      speed: 7
    },
    summary:
      "Rotate through the trunk and hips to throw a medicine ball forcefully into a wall.",
    instructions: [
      "Stand sideways to a sturdy wall.",
      "Hold the medicine ball near the torso.",
      "Rotate and throw the ball into the wall.",
      "Recover safely and repeat."
    ],
    cues: [
      "Use a wall and ball designed for throws.",
      "Generate power from the hips and trunk together."
    ],
    logging: {
      type: "sets_reps_weight",
      fields: ["sets", "reps", "weight", "side", "rest_seconds"]
    },
    illustration: { anatomy: null, movement: null }
  }
]);

export {
  VERSION,
  SOURCE,
  CORE_EXERCISES
};

export default CORE_EXERCISES;
