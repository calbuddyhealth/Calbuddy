// =====================================================
// ARI REBIRTH
// File: js/training/movements/movement-patterns.js
// Version: 1.1.0
// Purpose:
//   Central registry for training movement patterns used by
//   the ARI Training exercise library, workout builder,
//   templates, filtering, and goal-based recommendations.
//
// V1.1.0:
//   - Added Shoulder Flexion / Front Raise pattern.
//   - Added Shoulder Horizontal Adduction / Fly pattern.
//   - Added Shoulder External Rotation pattern.
//   - Added Scapular Elevation / Shrug pattern.
//   - Added Hip Extension isolation pattern.
//   - Preserved Hip Abduction and Hip Adduction patterns.
//   - Added Hip External Rotation pattern.
//   - Added Spinal Extension pattern.
//   - Added Trunk Lateral Flexion pattern.
//   - Added Ankle Dorsiflexion / Tibialis pattern.
//   - Added Wrist Flexion and Wrist Extension patterns.
//   - Added Forearm Pronation / Supination patterns.
//   - Added registry validation against body-parts.js
//     and joint-actions.js.
//   - Preserves all existing stable movement IDs.
//
// Design:
//   - Human-friendly movement categories.
//   - Stable IDs referenced by exercise records.
//   - Connects movement patterns to anatomical joint actions.
//   - Supports strength, cardio, locomotion, mobility,
//     plyometrics, carries, stabilization, and isolation.
// =====================================================

import BodyParts
  from "../anatomy/body-parts.js";

import JointActions
  from "../anatomy/joint-actions.js";


const VERSION = "1.1.0";

const SOURCE =
  "js/training/movements/movement-patterns";


const MOVEMENT_PATTERNS = Object.freeze([

  // ===================================================
  // UPPER BODY PUSH
  // ===================================================

  {
    id: "horizontal_push",
    label: "Horizontal Push",
    family: "push",
    category: "strength",
    region: "upper_body",

    description:
      "Presses resistance away from the torso in a generally horizontal direction.",

    primaryJointActions: [
      "shoulder_horizontal_adduction",
      "elbow_extension"
    ],

    commonBodyParts: [
      "chest",
      "shoulders",
      "triceps"
    ],

    aliases: [
      "chest press",
      "horizontal press",
      "bench press pattern",
      "bench press"
    ]
  },

  {
    id: "vertical_push",
    label: "Vertical Push",
    family: "push",
    category: "strength",
    region: "upper_body",

    description:
      "Presses resistance upward away from the body.",

    primaryJointActions: [
      "shoulder_flexion",
      "shoulder_abduction",
      "elbow_extension",
      "scapular_upward_rotation"
    ],

    commonBodyParts: [
      "shoulders",
      "triceps",
      "upper_body"
    ],

    aliases: [
      "overhead press",
      "vertical press",
      "shoulder press pattern",
      "overhead pressing"
    ]
  },


  // ===================================================
  // UPPER BODY PULL
  // ===================================================

  {
    id: "horizontal_pull",
    label: "Horizontal Pull",
    family: "pull",
    category: "strength",
    region: "upper_body",

    description:
      "Pulls resistance toward the torso in a generally horizontal direction.",

    primaryJointActions: [
      "shoulder_extension",
      "shoulder_horizontal_abduction",
      "elbow_flexion",
      "scapular_retraction"
    ],

    commonBodyParts: [
      "back",
      "biceps",
      "shoulders"
    ],

    aliases: [
      "row",
      "rowing pattern",
      "horizontal row",
      "row pattern"
    ]
  },

  {
    id: "vertical_pull",
    label: "Vertical Pull",
    family: "pull",
    category: "strength",
    region: "upper_body",

    description:
      "Pulls resistance downward toward the body from an overhead position.",

    primaryJointActions: [
      "shoulder_adduction",
      "shoulder_extension",
      "elbow_flexion",
      "scapular_depression"
    ],

    commonBodyParts: [
      "back",
      "biceps",
      "upper_body"
    ],

    aliases: [
      "pulldown",
      "pull-up pattern",
      "vertical row",
      "lat pulldown",
      "pull up",
      "chin up"
    ]
  },


  // ===================================================
  // CHEST / SHOULDER ISOLATION
  // ===================================================

  {
    id: "shoulder_horizontal_adduction",
    label: "Shoulder Horizontal Adduction",
    family: "chest_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Brings the upper arms across the front of the torso, commonly emphasizing the pectoral muscles.",

    primaryJointActions: [
      "shoulder_horizontal_adduction"
    ],

    commonBodyParts: [
      "chest",
      "shoulders"
    ],

    aliases: [
      "chest fly",
      "fly",
      "flye",
      "pec fly",
      "dumbbell fly",
      "cable fly",
      "cable crossover",
      "pec deck",
      "chest adduction"
    ]
  },

  {
    id: "shoulder_flexion",
    label: "Shoulder Flexion",
    family: "shoulder_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Raises the arm forward in front of the body, commonly emphasizing the anterior deltoid with assistance from the upper chest.",

    primaryJointActions: [
      "shoulder_flexion"
    ],

    commonBodyParts: [
      "shoulders",
      "chest"
    ],

    aliases: [
      "front raise",
      "front dumbbell raise",
      "dumbbell front raise",
      "cable front raise",
      "plate front raise",
      "forward raise"
    ]
  },

  {
    id: "shoulder_abduction",
    label: "Shoulder Abduction",
    family: "shoulder_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Raises the arm away from the body's midline, commonly emphasizing the lateral deltoid.",

    primaryJointActions: [
      "shoulder_abduction"
    ],

    commonBodyParts: [
      "shoulders"
    ],

    aliases: [
      "lateral raise",
      "side raise",
      "dumbbell lateral raise",
      "cable lateral raise"
    ]
  },

  {
    id: "shoulder_horizontal_abduction",
    label: "Shoulder Horizontal Abduction",
    family: "shoulder_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Moves the upper arm horizontally away from the front of the body.",

    primaryJointActions: [
      "shoulder_horizontal_abduction",
      "scapular_retraction"
    ],

    commonBodyParts: [
      "shoulders",
      "back"
    ],

    aliases: [
      "reverse fly",
      "rear delt fly",
      "reverse pec deck",
      "rear delt machine",
      "rear delt raise"
    ]
  },

  {
    id: "shoulder_external_rotation",
    label: "Shoulder External Rotation",
    family: "shoulder_stability",
    category: "strength",
    region: "upper_body",

    description:
      "Rotates the upper arm outward and is commonly used to train the external rotators of the shoulder and rotator cuff.",

    primaryJointActions: [
      "shoulder_external_rotation",
      "glenohumeral_stabilization"
    ],

    commonBodyParts: [
      "shoulders",
      "upper_body"
    ],

    aliases: [
      "external rotation",
      "rotator cuff external rotation",
      "cable external rotation",
      "band external rotation",
      "shoulder rotation"
    ]
  },

  {
    id: "scapular_elevation",
    label: "Scapular Elevation",
    family: "shoulder_girdle",
    category: "strength",
    region: "upper_body",

    description:
      "Elevates the shoulder blades against resistance, commonly emphasizing the upper trapezius.",

    primaryJointActions: [
      "scapular_elevation"
    ],

    commonBodyParts: [
      "back",
      "shoulders"
    ],

    aliases: [
      "shrug",
      "shrugs",
      "barbell shrug",
      "dumbbell shrug",
      "trap shrug"
    ]
  },


  // ===================================================
  // ARMS / ISOLATION
  // ===================================================

  {
    id: "elbow_flexion",
    label: "Elbow Flexion",
    family: "arm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Bends the elbow against resistance, commonly emphasizing the biceps and related elbow flexors.",

    primaryJointActions: [
      "elbow_flexion"
    ],

    commonBodyParts: [
      "biceps",
      "forearms"
    ],

    aliases: [
      "curl",
      "biceps curl",
      "curl pattern",
      "arm curl"
    ]
  },

  {
    id: "elbow_extension",
    label: "Elbow Extension",
    family: "arm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Straightens the elbow against resistance, commonly emphasizing the triceps.",

    primaryJointActions: [
      "elbow_extension"
    ],

    commonBodyParts: [
      "triceps"
    ],

    aliases: [
      "triceps extension",
      "pushdown pattern",
      "tricep extension",
      "triceps pushdown"
    ]
  },


  // ===================================================
  // FOREARM / WRIST
  // ===================================================

  {
    id: "wrist_flexion",
    label: "Wrist Flexion",
    family: "forearm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Flexes the wrist against resistance to train the anterior forearm musculature.",

    primaryJointActions: [
      "wrist_flexion"
    ],

    commonBodyParts: [
      "forearms"
    ],

    aliases: [
      "wrist curl",
      "forearm curl",
      "wrist flexor curl"
    ]
  },

  {
    id: "wrist_extension",
    label: "Wrist Extension",
    family: "forearm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Extends the wrist against resistance to train the posterior forearm musculature.",

    primaryJointActions: [
      "wrist_extension"
    ],

    commonBodyParts: [
      "forearms"
    ],

    aliases: [
      "reverse wrist curl",
      "wrist extension curl",
      "forearm extension"
    ]
  },

  {
    id: "forearm_supination",
    label: "Forearm Supination",
    family: "forearm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Rotates the forearm so the palm turns upward against resistance.",

    primaryJointActions: [
      "forearm_supination"
    ],

    commonBodyParts: [
      "forearms",
      "biceps"
    ],

    aliases: [
      "supination",
      "forearm supination",
      "wrist supination"
    ]
  },

  {
    id: "forearm_pronation",
    label: "Forearm Pronation",
    family: "forearm_isolation",
    category: "strength",
    region: "upper_body",

    description:
      "Rotates the forearm so the palm turns downward against resistance.",

    primaryJointActions: [
      "forearm_pronation"
    ],

    commonBodyParts: [
      "forearms"
    ],

    aliases: [
      "pronation",
      "forearm pronation",
      "wrist pronation"
    ]
  },


  // ===================================================
  // LOWER BODY COMPOUND
  // ===================================================

  {
    id: "squat",
    label: "Squat",
    family: "lower_body",
    category: "strength",
    region: "lower_body",

    description:
      "Uses coordinated hip and knee flexion and extension while maintaining whole-body control.",

    primaryJointActions: [
      "hip_flexion",
      "knee_flexion",
      "hip_extension",
      "knee_extension"
    ],

    commonBodyParts: [
      "quadriceps",
      "glutes",
      "hamstrings"
    ],

    aliases: [
      "squat pattern",
      "knee dominant",
      "squatting"
    ]
  },

  {
    id: "hip_hinge",
    label: "Hip Hinge",
    family: "lower_body",
    category: "strength",
    region: "lower_body",

    description:
      "Moves primarily through the hips while the trunk remains controlled, emphasizing posterior-chain loading.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "spinal_stabilization"
    ],

    commonBodyParts: [
      "glutes",
      "hamstrings",
      "lower_back"
    ],

    aliases: [
      "hinge",
      "deadlift pattern",
      "hip dominant",
      "deadlift"
    ]
  },

  {
    id: "lunge",
    label: "Lunge",
    family: "lower_body",
    category: "strength",
    region: "lower_body",

    description:
      "Uses split-stance or stepping lower-body motion with coordinated hip and knee movement.",

    primaryJointActions: [
      "hip_flexion",
      "knee_flexion",
      "hip_extension",
      "knee_extension",
      "pelvic_stabilization"
    ],

    commonBodyParts: [
      "quadriceps",
      "glutes",
      "hamstrings"
    ],

    aliases: [
      "lunge pattern",
      "split squat pattern",
      "weighted lunge",
      "weighted lunges",
      "dumbbell lunge",
      "barbell lunge"
    ]
  },

  {
    id: "step",
    label: "Step / Step-Up",
    family: "lower_body",
    category: "strength",
    region: "lower_body",

    description:
      "Raises the body onto an elevated surface using one or both legs.",

    primaryJointActions: [
      "hip_extension",
      "knee_extension",
      "pelvic_stabilization"
    ],

    commonBodyParts: [
      "quadriceps",
      "glutes",
      "calves"
    ],

    aliases: [
      "step up",
      "step-up pattern",
      "stairs"
    ]
  },


  // ===================================================
  // HIP / GLUTE ISOLATION
  // ===================================================

  {
    id: "hip_extension",
    label: "Hip Extension",
    family: "hip_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Extends the hip against resistance without requiring a full squat or hinge pattern.",

    primaryJointActions: [
      "hip_extension"
    ],

    commonBodyParts: [
      "glutes",
      "hamstrings",
      "hips"
    ],

    aliases: [
      "glute extension",
      "hip thrust pattern",
      "hip thrust",
      "glute bridge pattern",
      "glute kickback",
      "hip extension machine"
    ]
  },

  {
    id: "hip_abduction",
    label: "Hip Abduction",
    family: "hip_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Moves the leg away from the body's midline, commonly training the gluteus medius, gluteus minimus, and related hip abductors.",

    primaryJointActions: [
      "hip_abduction"
    ],

    commonBodyParts: [
      "glutes",
      "abductors",
      "hips"
    ],

    aliases: [
      "leg abduction",
      "outer hip",
      "hip abductor",
      "hip abductor machine",
      "abductor machine",
      "seated hip abduction",
      "outer thigh machine"
    ]
  },

  {
    id: "hip_adduction",
    label: "Hip Adduction",
    family: "hip_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Moves the leg toward the body's midline, commonly training the inner-thigh adductor muscles.",

    primaryJointActions: [
      "hip_adduction"
    ],

    commonBodyParts: [
      "adductors",
      "hips"
    ],

    aliases: [
      "leg adduction",
      "inner thigh",
      "hip adductor",
      "hip adductor machine",
      "adductor machine",
      "seated hip adduction",
      "inner thigh machine"
    ]
  },

  {
    id: "hip_external_rotation",
    label: "Hip External Rotation",
    family: "hip_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Rotates the thigh outward and trains the hip external rotators and lateral gluteal musculature.",

    primaryJointActions: [
      "hip_external_rotation"
    ],

    commonBodyParts: [
      "glutes",
      "hips",
      "abductors"
    ],

    aliases: [
      "external hip rotation",
      "clamshell",
      "clam shell",
      "banded clamshell",
      "hip rotation"
    ]
  },


  // ===================================================
  // LOWER BODY ISOLATION
  // ===================================================

  {
    id: "knee_flexion",
    label: "Knee Flexion",
    family: "lower_body_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Bends the knee against resistance, commonly emphasizing the hamstrings.",

    primaryJointActions: [
      "knee_flexion"
    ],

    commonBodyParts: [
      "hamstrings"
    ],

    aliases: [
      "leg curl",
      "hamstring curl",
      "knee curl"
    ]
  },

  {
    id: "knee_extension",
    label: "Knee Extension",
    family: "lower_body_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Straightens the knee against resistance, commonly emphasizing the quadriceps.",

    primaryJointActions: [
      "knee_extension"
    ],

    commonBodyParts: [
      "quadriceps"
    ],

    aliases: [
      "leg extension",
      "quad extension"
    ]
  },

  {
    id: "calf_raise",
    label: "Calf Raise",
    family: "lower_body_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Raises the heel by plantarflexing the ankle.",

    primaryJointActions: [
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "calves"
    ],

    aliases: [
      "heel raise",
      "plantarflexion",
      "calf extension"
    ]
  },

  {
    id: "ankle_dorsiflexion",
    label: "Ankle Dorsiflexion",
    family: "lower_body_isolation",
    category: "strength",
    region: "lower_body",

    description:
      "Pulls the toes and forefoot upward toward the shin against resistance.",

    primaryJointActions: [
      "ankle_dorsiflexion"
    ],

    commonBodyParts: [
      "shins"
    ],

    aliases: [
      "tibialis raise",
      "tib raise",
      "toe raise",
      "shin raise",
      "dorsiflexion"
    ]
  },


  // ===================================================
  // CORE / TRUNK
  // ===================================================

  {
    id: "trunk_flexion",
    label: "Trunk Flexion",
    family: "core",
    category: "strength",
    region: "core",

    description:
      "Bends the trunk forward under control.",

    primaryJointActions: [
      "trunk_flexion"
    ],

    commonBodyParts: [
      "abdominals",
      "core"
    ],

    aliases: [
      "ab crunch",
      "crunch pattern",
      "spinal flexion"
    ]
  },

  {
    id: "spinal_extension",
    label: "Spinal Extension",
    family: "core",
    category: "strength",
    region: "core",

    description:
      "Extends the trunk from a flexed position or against resistance, emphasizing the spinal extensor musculature.",

    primaryJointActions: [
      "spinal_extension"
    ],

    commonBodyParts: [
      "lower_back",
      "core",
      "glutes",
      "hamstrings"
    ],

    aliases: [
      "back extension",
      "hyperextension",
      "45 degree back extension",
      "roman chair extension"
    ]
  },

  {
    id: "trunk_rotation",
    label: "Trunk Rotation",
    family: "core",
    category: "strength",
    region: "core",

    description:
      "Rotates the torso through the transverse plane.",

    primaryJointActions: [
      "trunk_rotation"
    ],

    commonBodyParts: [
      "obliques",
      "core"
    ],

    aliases: [
      "rotation",
      "rotational core",
      "torso rotation"
    ]
  },

  {
    id: "trunk_lateral_flexion",
    label: "Trunk Lateral Flexion",
    family: "core",
    category: "strength",
    region: "core",

    description:
      "Bends the trunk toward one side against resistance.",

    primaryJointActions: [
      "trunk_lateral_flexion"
    ],

    commonBodyParts: [
      "obliques",
      "core",
      "lower_back"
    ],

    aliases: [
      "side bend",
      "dumbbell side bend",
      "lateral flexion",
      "oblique side bend"
    ]
  },

  {
    id: "anti_rotation",
    label: "Anti-Rotation",
    family: "core_stability",
    category: "stability",
    region: "core",

    description:
      "Resists unwanted torso rotation while maintaining trunk control.",

    primaryJointActions: [
      "anti_rotation",
      "spinal_stabilization"
    ],

    commonBodyParts: [
      "core",
      "obliques"
    ],

    aliases: [
      "anti rotation",
      "pallof pattern",
      "pallof press"
    ]
  },

  {
    id: "anti_extension",
    label: "Anti-Extension",
    family: "core_stability",
    category: "stability",
    region: "core",

    description:
      "Resists excessive spinal extension or arching.",

    primaryJointActions: [
      "anti_extension",
      "spinal_stabilization"
    ],

    commonBodyParts: [
      "core",
      "abdominals"
    ],

    aliases: [
      "anti extension",
      "plank pattern"
    ]
  },

  {
    id: "anti_lateral_flexion",
    label: "Anti-Lateral Flexion",
    family: "core_stability",
    category: "stability",
    region: "core",

    description:
      "Resists unwanted side bending of the trunk.",

    primaryJointActions: [
      "spinal_stabilization",
      "pelvic_stabilization"
    ],

    commonBodyParts: [
      "core",
      "obliques",
      "lower_back"
    ],

    aliases: [
      "anti side bend",
      "side stabilization",
      "anti lateral flexion"
    ]
  },


  // ===================================================
  // CARRIES / FUNCTIONAL
  // ===================================================

  {
    id: "loaded_carry",
    label: "Loaded Carry",
    family: "carry",
    category: "functional",
    region: "full_body",

    description:
      "Carries external load while maintaining posture, grip, and whole-body stability.",

    primaryJointActions: [
      "grip",
      "grip_stabilization",
      "spinal_stabilization",
      "pelvic_stabilization"
    ],

    commonBodyParts: [
      "full_body",
      "forearms",
      "core"
    ],

    aliases: [
      "carry",
      "farmer carry",
      "farmers carry",
      "loaded walk"
    ]
  },


  // ===================================================
  // LOCOMOTION / CARDIO
  // ===================================================

  {
    id: "walking",
    label: "Walking",
    family: "locomotion",
    category: "cardio",
    region: "full_body",

    description:
      "Rhythmic gait at walking speed used for general activity, recovery, and aerobic conditioning.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "knee_flexion",
      "knee_extension",
      "ankle_plantarflexion",
      "ankle_dorsiflexion"
    ],

    commonBodyParts: [
      "lower_body",
      "calves",
      "glutes"
    ],

    aliases: [
      "walk",
      "brisk walking",
      "walking cardio"
    ]
  },

  {
    id: "running",
    label: "Running",
    family: "locomotion",
    category: "cardio",
    region: "full_body",

    description:
      "Faster cyclical gait used for aerobic conditioning, endurance, speed, and running performance.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "knee_flexion",
      "knee_extension",
      "ankle_plantarflexion",
      "ankle_dorsiflexion"
    ],

    commonBodyParts: [
      "lower_body",
      "calves",
      "glutes",
      "core"
    ],

    aliases: [
      "run",
      "jogging",
      "jog"
    ]
  },

  {
    id: "cycling",
    label: "Cycling",
    family: "locomotion",
    category: "cardio",
    region: "lower_body",

    description:
      "Cyclical pedaling movement used for cardiovascular conditioning and lower-body endurance.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "knee_flexion",
      "knee_extension",
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "quadriceps",
      "glutes",
      "hamstrings",
      "calves"
    ],

    aliases: [
      "bike",
      "biking",
      "stationary bike",
      "cycling cardio"
    ]
  },

  {
    id: "rowing_cardio",
    label: "Rowing",
    family: "locomotion",
    category: "cardio",
    region: "full_body",

    description:
      "Repeated leg drive, hip extension, and pulling motion used for full-body cardiovascular conditioning.",

    primaryJointActions: [
      "knee_extension",
      "hip_extension",
      "shoulder_extension",
      "elbow_flexion",
      "scapular_retraction"
    ],

    commonBodyParts: [
      "full_body",
      "back",
      "lower_body"
    ],

    aliases: [
      "rowing machine",
      "erg rowing",
      "rower",
      "indoor rowing"
    ]
  },

  {
    id: "stair_climbing",
    label: "Stair Climbing",
    family: "locomotion",
    category: "cardio",
    region: "lower_body",

    description:
      "Repeated stepping movement used for lower-body conditioning and aerobic work.",

    primaryJointActions: [
      "hip_extension",
      "knee_extension",
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "glutes",
      "quadriceps",
      "calves"
    ],

    aliases: [
      "stairs",
      "stair stepper",
      "stair climber"
    ]
  },

  {
    id: "elliptical",
    label: "Elliptical",
    family: "locomotion",
    category: "cardio",
    region: "full_body",

    description:
      "Low-impact cyclical cardio movement using coordinated lower-body motion and optional arm drive.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "knee_flexion",
      "knee_extension"
    ],

    commonBodyParts: [
      "lower_body",
      "full_body"
    ],

    aliases: [
      "elliptical trainer",
      "cross trainer"
    ]
  },


  // ===================================================
  // PLYOMETRICS / POWER
  // ===================================================

  {
    id: "jump",
    label: "Jump",
    family: "plyometric",
    category: "power",
    region: "lower_body",

    description:
      "Produces rapid lower-body force to propel the body vertically or horizontally.",

    primaryJointActions: [
      "hip_extension",
      "knee_extension",
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "glutes",
      "quadriceps",
      "calves"
    ],

    aliases: [
      "jumping",
      "plyometric jump"
    ]
  },

  {
    id: "hop",
    label: "Hop",
    family: "plyometric",
    category: "power",
    region: "lower_body",

    description:
      "Produces and absorbs force primarily through one leg during repeated or single-leg jumping.",

    primaryJointActions: [
      "hip_extension",
      "knee_extension",
      "ankle_plantarflexion",
      "pelvic_stabilization"
    ],

    commonBodyParts: [
      "lower_body",
      "calves",
      "glutes"
    ],

    aliases: [
      "hopping",
      "single leg jump"
    ]
  },

  {
    id: "bound",
    label: "Bound",
    family: "plyometric",
    category: "power",
    region: "lower_body",

    description:
      "Uses exaggerated running-like strides to develop horizontal force and elastic power.",

    primaryJointActions: [
      "hip_extension",
      "knee_extension",
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "glutes",
      "hamstrings",
      "calves"
    ],

    aliases: [
      "bounding"
    ]
  },

  {
    id: "sprint",
    label: "Sprint",
    family: "locomotion",
    category: "power",
    region: "full_body",

    description:
      "High-speed running used to develop acceleration, speed, power, and anaerobic conditioning.",

    primaryJointActions: [
      "hip_flexion",
      "hip_extension",
      "knee_flexion",
      "knee_extension",
      "ankle_plantarflexion"
    ],

    commonBodyParts: [
      "lower_body",
      "glutes",
      "hamstrings",
      "calves"
    ],

    aliases: [
      "sprinting",
      "speed run",
      "max speed running"
    ]
  },


  // ===================================================
  // MOBILITY / FLEXIBILITY
  // ===================================================

  {
    id: "mobility",
    label: "Mobility",
    family: "mobility",
    category: "mobility",
    region: "full_body",

    description:
      "Actively moves one or more joints through controlled ranges of motion.",

    primaryJointActions: [],

    commonBodyParts: [
      "full_body"
    ],

    aliases: [
      "joint mobility",
      "mobility drill"
    ]
  },

  {
    id: "dynamic_stretch",
    label: "Dynamic Stretch",
    family: "flexibility",
    category: "mobility",
    region: "full_body",

    description:
      "Uses controlled movement through range to prepare tissues and joints for activity.",

    primaryJointActions: [],

    commonBodyParts: [
      "full_body"
    ],

    aliases: [
      "dynamic stretching"
    ]
  },

  {
    id: "static_stretch",
    label: "Static Stretch",
    family: "flexibility",
    category: "flexibility",
    region: "full_body",

    description:
      "Holds a muscle or joint near the end of a comfortable range for a period of time.",

    primaryJointActions: [],

    commonBodyParts: [
      "full_body"
    ],

    aliases: [
      "static stretching",
      "stretch hold"
    ]
  },


  // ===================================================
  // BALANCE / STABILITY
  // ===================================================

  {
    id: "balance",
    label: "Balance",
    family: "stability",
    category: "balance",
    region: "full_body",

    description:
      "Maintains control of the body's center of mass over its base of support.",

    primaryJointActions: [
      "ankle_stabilization",
      "pelvic_stabilization",
      "spinal_stabilization"
    ],

    commonBodyParts: [
      "full_body",
      "core",
      "lower_body"
    ],

    aliases: [
      "balance training",
      "stability training"
    ]
  },


  // ===================================================
  // CONDITIONING
  // ===================================================

  {
    id: "conditioning_circuit",
    label: "Conditioning Circuit",
    family: "conditioning",
    category: "conditioning",
    region: "full_body",

    description:
      "Combines multiple exercises with limited rest to train cardiovascular and muscular conditioning.",

    primaryJointActions: [],

    commonBodyParts: [
      "full_body"
    ],

    aliases: [
      "circuit",
      "conditioning",
      "metabolic circuit"
    ]
  }
]);


// =====================================================
// MAPS
// =====================================================

const MOVEMENT_PATTERN_MAP =
  new Map(
    MOVEMENT_PATTERNS.map(
      pattern => [
        pattern.id,
        pattern
      ]
    )
  );


const MOVEMENT_ALIAS_MAP =
  new Map();


for (
  const pattern
  of MOVEMENT_PATTERNS
) {
  const aliases = [
    pattern.id,
    pattern.label,
    ...(pattern.aliases || [])
  ];

  for (
    const alias
    of aliases
  ) {
    const normalized =
      String(alias || "")
        .trim()
        .toLowerCase();

    if (
      normalized &&
      !MOVEMENT_ALIAS_MAP.has(
        normalized
      )
    ) {
      MOVEMENT_ALIAS_MAP.set(
        normalized,
        pattern.id
      );
    }
  }
}


// =====================================================
// NORMALIZATION
// =====================================================

function normalizeText(
  value
) {
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


// =====================================================
// LOOKUPS
// =====================================================

function getMovementPattern(
  idOrAlias
) {
  const normalized =
    normalizeText(
      idOrAlias
    );

  if (!normalized) {
    return null;
  }

  const resolvedId =
    MOVEMENT_ALIAS_MAP.get(
      normalized
    ) ||
    normalized;

  return (
    MOVEMENT_PATTERN_MAP.get(
      resolvedId
    ) ||
    null
  );
}


function hasMovementPattern(
  idOrAlias
) {
  return Boolean(
    getMovementPattern(
      idOrAlias
    )
  );
}


// =====================================================
// FILTERING
// =====================================================

function getMovementPatterns({
  family = null,
  category = null,
  region = null,
  bodyPart = null,
  jointAction = null
} = {}) {
  const normalizedFamily =
    normalizeText(
      family
    );

  const normalizedCategory =
    normalizeText(
      category
    );

  const normalizedRegion =
    normalizeText(
      region
    );

  const normalizedBodyPart =
    normalizeText(
      bodyPart
    );

  const normalizedJointAction =
    normalizeText(
      jointAction
    );

  return MOVEMENT_PATTERNS.filter(
    pattern => {
      if (
        normalizedFamily &&
        normalizeText(
          pattern.family
        ) !==
          normalizedFamily
      ) {
        return false;
      }

      if (
        normalizedCategory &&
        normalizeText(
          pattern.category
        ) !==
          normalizedCategory
      ) {
        return false;
      }

      if (
        normalizedRegion &&
        normalizeText(
          pattern.region
        ) !==
          normalizedRegion
      ) {
        return false;
      }

      if (
        normalizedBodyPart &&
        !(
          pattern.commonBodyParts ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedBodyPart
        )
      ) {
        return false;
      }

      if (
        normalizedJointAction &&
        !(
          pattern.primaryJointActions ||
          []
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedJointAction
        )
      ) {
        return false;
      }

      return true;
    }
  );
}


// =====================================================
// SEARCH
// =====================================================

function searchMovementPatterns(
  query
) {
  const normalized =
    normalizeText(
      query
    );

  if (!normalized) {
    return [
      ...MOVEMENT_PATTERNS
    ];
  }

  return MOVEMENT_PATTERNS.filter(
    pattern => {
      const searchable = [
        pattern.id,
        pattern.label,
        pattern.family,
        pattern.category,
        pattern.region,
        pattern.description,
        ...(
          pattern.primaryJointActions ||
          []
        ),
        ...(
          pattern.commonBodyParts ||
          []
        ),
        ...(
          pattern.aliases ||
          []
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


// =====================================================
// IDS
// =====================================================

function getMovementPatternIds() {
  return MOVEMENT_PATTERNS.map(
    pattern =>
      pattern.id
  );
}


// =====================================================
// VALIDATION
// =====================================================

function validateReferences() {
  const invalid = [];
  const warnings = [];

  const seenIds =
    new Set();


  for (
    const pattern
    of MOVEMENT_PATTERNS
  ) {
    if (!pattern.id) {
      invalid.push({
        patternId: null,
        type: "missingId",
        value: null
      });

      continue;
    }


    if (
      seenIds.has(
        pattern.id
      )
    ) {
      invalid.push({
        patternId: pattern.id,
        type: "duplicateId",
        value: pattern.id
      });
    }

    seenIds.add(
      pattern.id
    );


    if (!pattern.label) {
      invalid.push({
        patternId: pattern.id,
        type: "missingLabel",
        value: null
      });
    }


    for (
      const actionId
      of (
        pattern.primaryJointActions ||
        []
      )
    ) {
      if (
        !JointActions.has(
          actionId
        )
      ) {
        invalid.push({
          patternId:
            pattern.id,

          type:
            "jointAction",

          value:
            actionId
        });
      }
    }


    for (
      const bodyPartId
      of (
        pattern.commonBodyParts ||
        []
      )
    ) {
      if (
        !BodyParts.has(
          bodyPartId
        )
      ) {
        invalid.push({
          patternId:
            pattern.id,

          type:
            "bodyPart",

          value:
            bodyPartId
        });
      }
    }


    if (
      !pattern.family
    ) {
      warnings.push({
        patternId:
          pattern.id,

        type:
          "missingFamily",

        value:
          null
      });
    }


    if (
      !pattern.category
    ) {
      warnings.push({
        patternId:
          pattern.id,

        type:
          "missingCategory",

        value:
          null
      });
    }


    if (
      !pattern.region
    ) {
      warnings.push({
        patternId:
          pattern.id,

        type:
          "missingRegion",

        value:
          null
      });
    }
  }


  return {
    valid:
      invalid.length ===
      0,

    patternCount:
      MOVEMENT_PATTERNS.length,

    invalidCount:
      invalid.length,

    warningCount:
      warnings.length,

    invalid,
    warnings
  };
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function getDiagnostics() {
  const familyCounts = {};
  const categoryCounts = {};
  const regionCounts = {};

  for (
    const pattern
    of MOVEMENT_PATTERNS
  ) {
    familyCounts[
      pattern.family
    ] =
      (
        familyCounts[
          pattern.family
        ] ||
        0
      ) +
      1;

    categoryCounts[
      pattern.category
    ] =
      (
        categoryCounts[
          pattern.category
        ] ||
        0
      ) +
      1;

    regionCounts[
      pattern.region
    ] =
      (
        regionCounts[
          pattern.region
        ] ||
        0
      ) +
      1;
  }

  return {
    version:
      VERSION,

    source:
      SOURCE,

    patternCount:
      MOVEMENT_PATTERNS.length,

    familyCounts,

    categoryCounts,

    regionCounts,

    validation:
      validateReferences()
  };
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingMovementPatterns =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      MOVEMENT_PATTERNS,

    get:
      getMovementPattern,

    has:
      hasMovementPattern,

    list:
      getMovementPatterns,

    search:
      searchMovementPatterns,

    ids:
      getMovementPatternIds,

    validate:
      validateReferences,

    diagnostics:
      getDiagnostics
  });


// =====================================================
// GLOBAL API
// =====================================================

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

  Ari.training
    .movementPatterns =
      AriTrainingMovementPatterns;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,
  MOVEMENT_PATTERNS,

  getMovementPattern,
  hasMovementPattern,
  getMovementPatterns,
  searchMovementPatterns,
  getMovementPatternIds,

  validateReferences,
  getDiagnostics,

  AriTrainingMovementPatterns
};

export default
  AriTrainingMovementPatterns;