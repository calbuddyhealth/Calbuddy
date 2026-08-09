// =====================================================
// ARI REBIRTH
// File: js/training/anatomy/muscles.js
// Version: 1.1.0
// Purpose:
//   Central skeletal-muscle registry for ARI Training.
//
// V1.1.0:
//   - Added regional pectoralis-major records for
//     upper, middle, and lower-chest exercise targeting.
//   - Preserved the existing pectoralis_major ID for
//     backward compatibility with current exercises.
//   - Added pectineus to complete primary hip-adductor
//     coverage.
//   - Expanded useful adductor/abductor aliases.
//   - Preserves all existing IDs and registry behavior.
//
// Design:
//   - References stable body-part IDs from body-parts.js.
//   - Provides user-friendly names plus anatomical names.
//   - Stores primary functions used later by joint-actions,
//     movement-patterns, exercise filtering, illustrations,
//     and ARI workout recommendations.
//   - Exercise records should reference muscle IDs from
//     this registry instead of duplicating anatomy.
// =====================================================

import BodyParts from "./body-parts.js";

const VERSION = "1.1.0";
const SOURCE = "js/training/anatomy/muscles";

const MUSCLES = Object.freeze([
  // ===================================================
  // CHEST
  // ===================================================
  {
    id: "pectoralis_major",
    name: "Pectoralis Major",
    commonName: "Chest",
    bodyParts: ["chest", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_horizontal_adduction",
      "shoulder_flexion",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "anterior_chest",
    aliases: [
      "pec major",
      "pecs",
      "chest muscle",
      "chest",
      "pectoralis major"
    ]
  },

  {
    id: "pectoralis_major_clavicular",
    name: "Pectoralis Major — Clavicular Head",
    commonName: "Upper Chest",
    bodyParts: ["chest", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_horizontal_adduction",
      "shoulder_flexion",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "upper_anterior_chest",
    aliases: [
      "upper chest",
      "upper pec",
      "upper pecs",
      "clavicular pec",
      "clavicular head",
      "clavicular head of pectoralis major",
      "upper pectoralis major"
    ]
  },

  {
    id: "pectoralis_major_sternal",
    name: "Pectoralis Major — Sternal Head",
    commonName: "Mid Chest",
    bodyParts: ["chest", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_horizontal_adduction",
      "shoulder_adduction",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "mid_anterior_chest",
    aliases: [
      "mid chest",
      "middle chest",
      "middle pec",
      "sternal pec",
      "sternal head",
      "sternal head of pectoralis major",
      "mid pectoralis major"
    ]
  },

  {
    id: "pectoralis_major_costal",
    name: "Pectoralis Major — Costal Fibers",
    commonName: "Lower Chest",
    bodyParts: ["chest", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_horizontal_adduction",
      "shoulder_adduction",
      "shoulder_extension_from_flexion",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "lower_anterior_chest",
    aliases: [
      "lower chest",
      "lower pec",
      "lower pecs",
      "costal pec",
      "costal fibers",
      "lower fibers of pectoralis major",
      "lower pectoralis major"
    ]
  },

  {
    id: "pectoralis_minor",
    name: "Pectoralis Minor",
    commonName: "Upper Chest Support",
    bodyParts: ["chest", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_protraction",
      "scapular_depression",
      "scapular_downward_rotation"
    ],
    illustrationRegion: "deep_anterior_chest",
    aliases: ["pec minor"]
  },

  // ===================================================
  // BACK
  // ===================================================
  {
    id: "latissimus_dorsi",
    name: "Latissimus Dorsi",
    commonName: "Lats",
    bodyParts: ["back", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_extension",
      "shoulder_adduction",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "posterior_lateral_back",
    aliases: ["lats", "lat"]
  },

  {
    id: "trapezius_upper",
    name: "Upper Trapezius",
    commonName: "Upper Traps",
    bodyParts: ["back", "shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_elevation",
      "scapular_upward_rotation",
      "neck_extension"
    ],
    illustrationRegion: "upper_posterior_neck_back",
    aliases: ["upper traps", "traps"]
  },

  {
    id: "trapezius_middle",
    name: "Middle Trapezius",
    commonName: "Mid Traps",
    bodyParts: ["back", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_retraction"
    ],
    illustrationRegion: "mid_upper_back",
    aliases: ["middle traps", "mid traps"]
  },

  {
    id: "trapezius_lower",
    name: "Lower Trapezius",
    commonName: "Lower Traps",
    bodyParts: ["back", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_depression",
      "scapular_upward_rotation",
      "scapular_retraction"
    ],
    illustrationRegion: "lower_upper_back",
    aliases: ["lower traps"]
  },

  {
    id: "rhomboid_major",
    name: "Rhomboid Major",
    commonName: "Rhomboids",
    bodyParts: ["back", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_retraction",
      "scapular_downward_rotation",
      "scapular_stabilization"
    ],
    illustrationRegion: "medial_upper_back",
    aliases: ["rhomboid", "rhomboids"]
  },

  {
    id: "rhomboid_minor",
    name: "Rhomboid Minor",
    commonName: "Rhomboids",
    bodyParts: ["back", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_retraction",
      "scapular_downward_rotation",
      "scapular_stabilization"
    ],
    illustrationRegion: "medial_upper_back",
    aliases: ["rhomboid minor"]
  },

  {
    id: "teres_major",
    name: "Teres Major",
    commonName: "Teres Major",
    bodyParts: ["back", "shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_extension",
      "shoulder_adduction",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "posterior_axillary",
    aliases: ["teres major"]
  },

  {
    id: "erector_spinae",
    name: "Erector Spinae",
    commonName: "Spinal Erectors",
    bodyParts: ["back", "lower_back", "core"],
    region: "core",
    functions: [
      "spinal_extension",
      "spinal_lateral_flexion",
      "spinal_stabilization"
    ],
    illustrationRegion: "posterior_spine",
    aliases: [
      "spinal erectors",
      "erectors",
      "lower back muscles"
    ]
  },

  // ===================================================
  // SHOULDERS / ROTATOR CUFF
  // ===================================================
  {
    id: "anterior_deltoid",
    name: "Anterior Deltoid",
    commonName: "Front Deltoid",
    bodyParts: ["shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_flexion",
      "shoulder_horizontal_adduction",
      "shoulder_internal_rotation"
    ],
    illustrationRegion: "anterior_shoulder",
    aliases: [
      "front delt",
      "front deltoid",
      "anterior delt"
    ]
  },

  {
    id: "lateral_deltoid",
    name: "Lateral Deltoid",
    commonName: "Side Deltoid",
    bodyParts: ["shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_abduction"
    ],
    illustrationRegion: "lateral_shoulder",
    aliases: [
      "side delt",
      "middle delt",
      "medial delt"
    ]
  },

  {
    id: "posterior_deltoid",
    name: "Posterior Deltoid",
    commonName: "Rear Deltoid",
    bodyParts: ["shoulders", "back", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_extension",
      "shoulder_horizontal_abduction",
      "shoulder_external_rotation"
    ],
    illustrationRegion: "posterior_shoulder",
    aliases: [
      "rear delt",
      "rear deltoid",
      "posterior delt"
    ]
  },

  {
    id: "supraspinatus",
    name: "Supraspinatus",
    commonName: "Rotator Cuff",
    bodyParts: ["shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_abduction",
      "glenohumeral_stabilization"
    ],
    illustrationRegion: "posterior_superior_scapula",
    aliases: ["supraspinatus"]
  },

  {
    id: "infraspinatus",
    name: "Infraspinatus",
    commonName: "Rotator Cuff",
    bodyParts: ["shoulders", "back", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_external_rotation",
      "glenohumeral_stabilization"
    ],
    illustrationRegion: "posterior_scapula",
    aliases: ["infraspinatus"]
  },

  {
    id: "teres_minor",
    name: "Teres Minor",
    commonName: "Rotator Cuff",
    bodyParts: ["shoulders", "back", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_external_rotation",
      "shoulder_adduction",
      "glenohumeral_stabilization"
    ],
    illustrationRegion: "posterior_scapula",
    aliases: ["teres minor"]
  },

  {
    id: "subscapularis",
    name: "Subscapularis",
    commonName: "Rotator Cuff",
    bodyParts: ["shoulders", "upper_body"],
    region: "upper_body",
    functions: [
      "shoulder_internal_rotation",
      "glenohumeral_stabilization"
    ],
    illustrationRegion: "anterior_scapula",
    aliases: ["subscapularis"]
  },

  {
    id: "serratus_anterior",
    name: "Serratus Anterior",
    commonName: "Serratus",
    bodyParts: ["chest", "shoulders", "core", "upper_body"],
    region: "upper_body",
    functions: [
      "scapular_protraction",
      "scapular_upward_rotation",
      "scapular_stabilization"
    ],
    illustrationRegion: "lateral_rib_cage",
    aliases: [
      "serratus",
      "serratus anterior"
    ]
  },

  // ===================================================
  // ARMS
  // ===================================================
  {
    id: "biceps_brachii",
    name: "Biceps Brachii",
    commonName: "Biceps",
    bodyParts: ["biceps", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "elbow_flexion",
      "forearm_supination",
      "shoulder_flexion_assist"
    ],
    illustrationRegion: "anterior_upper_arm",
    aliases: [
      "biceps",
      "bicep",
      "bis"
    ]
  },

  {
    id: "brachialis",
    name: "Brachialis",
    commonName: "Brachialis",
    bodyParts: ["biceps", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "elbow_flexion"
    ],
    illustrationRegion: "deep_anterior_upper_arm",
    aliases: ["brachialis"]
  },

  {
    id: "brachioradialis",
    name: "Brachioradialis",
    commonName: "Brachioradialis",
    bodyParts: ["biceps", "forearms", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "elbow_flexion",
      "forearm_neutral_position_assist"
    ],
    illustrationRegion: "lateral_forearm",
    aliases: ["brachioradialis"]
  },

  {
    id: "triceps_brachii",
    name: "Triceps Brachii",
    commonName: "Triceps",
    bodyParts: ["triceps", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "elbow_extension",
      "shoulder_extension_assist"
    ],
    illustrationRegion: "posterior_upper_arm",
    aliases: [
      "triceps",
      "tricep",
      "tris"
    ]
  },

  {
    id: "forearm_flexors",
    name: "Forearm Flexor Group",
    commonName: "Forearm Flexors",
    bodyParts: ["forearms", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "wrist_flexion",
      "finger_flexion",
      "grip"
    ],
    illustrationRegion: "anterior_forearm",
    aliases: [
      "forearm flexors",
      "wrist flexors",
      "grip muscles"
    ]
  },

  {
    id: "forearm_extensors",
    name: "Forearm Extensor Group",
    commonName: "Forearm Extensors",
    bodyParts: ["forearms", "arms", "upper_body"],
    region: "upper_body",
    functions: [
      "wrist_extension",
      "finger_extension",
      "grip_stabilization"
    ],
    illustrationRegion: "posterior_forearm",
    aliases: [
      "forearm extensors",
      "wrist extensors"
    ]
  },

  // ===================================================
  // CORE / TRUNK
  // ===================================================
  {
    id: "rectus_abdominis",
    name: "Rectus Abdominis",
    commonName: "Abs",
    bodyParts: ["abdominals", "core"],
    region: "core",
    functions: [
      "trunk_flexion",
      "pelvic_stabilization",
      "anti_extension"
    ],
    illustrationRegion: "anterior_abdomen",
    aliases: [
      "abs",
      "six pack",
      "rectus abdominis"
    ]
  },

  {
    id: "external_oblique",
    name: "External Oblique",
    commonName: "External Obliques",
    bodyParts: ["obliques", "core"],
    region: "core",
    functions: [
      "trunk_rotation",
      "trunk_lateral_flexion",
      "abdominal_compression",
      "anti_rotation"
    ],
    illustrationRegion: "lateral_abdomen",
    aliases: [
      "external obliques",
      "obliques"
    ]
  },

  {
    id: "internal_oblique",
    name: "Internal Oblique",
    commonName: "Internal Obliques",
    bodyParts: ["obliques", "core"],
    region: "core",
    functions: [
      "trunk_rotation",
      "trunk_lateral_flexion",
      "abdominal_compression",
      "anti_rotation"
    ],
    illustrationRegion: "deep_lateral_abdomen",
    aliases: ["internal obliques"]
  },

  {
    id: "transversus_abdominis",
    name: "Transversus Abdominis",
    commonName: "Deep Core",
    bodyParts: ["core", "abdominals"],
    region: "core",
    functions: [
      "abdominal_compression",
      "spinal_stabilization",
      "anti_extension"
    ],
    illustrationRegion: "deep_abdomen",
    aliases: [
      "transverse abdominis",
      "tva",
      "deep core"
    ]
  },

  {
    id: "quadratus_lumborum",
    name: "Quadratus Lumborum",
    commonName: "QL",
    bodyParts: ["lower_back", "core"],
    region: "core",
    functions: [
      "trunk_lateral_flexion",
      "pelvic_stabilization",
      "spinal_stabilization"
    ],
    illustrationRegion: "posterior_lateral_lumbar",
    aliases: [
      "ql",
      "quadratus lumborum"
    ]
  },

  // ===================================================
  // GLUTES / HIPS / ABDUCTORS
  // ===================================================
  {
    id: "gluteus_maximus",
    name: "Gluteus Maximus",
    commonName: "Glute Max",
    bodyParts: ["glutes", "hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_extension",
      "hip_external_rotation",
      "pelvic_stabilization"
    ],
    illustrationRegion: "posterior_hip",
    aliases: [
      "glute max",
      "glutes",
      "gluteus maximus"
    ]
  },

  {
    id: "gluteus_medius",
    name: "Gluteus Medius",
    commonName: "Glute Med",
    bodyParts: ["glutes", "hips", "abductors", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_abduction",
      "pelvic_stabilization",
      "hip_internal_rotation_assist"
    ],
    illustrationRegion: "lateral_hip",
    aliases: [
      "glute med",
      "gluteus medius",
      "hip abductor",
      "hip abductors",
      "abductor muscle"
    ]
  },

  {
    id: "gluteus_minimus",
    name: "Gluteus Minimus",
    commonName: "Glute Min",
    bodyParts: ["glutes", "hips", "abductors", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_abduction",
      "pelvic_stabilization",
      "hip_internal_rotation_assist"
    ],
    illustrationRegion: "deep_lateral_hip",
    aliases: [
      "glute min",
      "gluteus minimus",
      "deep hip abductor"
    ]
  },

  {
    id: "tensor_fasciae_latae",
    name: "Tensor Fasciae Latae",
    commonName: "TFL",
    bodyParts: ["hips", "abductors", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_flexion",
      "hip_abduction",
      "hip_internal_rotation"
    ],
    illustrationRegion: "anterolateral_hip",
    aliases: [
      "tfl",
      "tensor fascia lata",
      "tensor fasciae latae",
      "hip abductor"
    ]
  },

  {
    id: "iliopsoas",
    name: "Iliopsoas",
    commonName: "Hip Flexors",
    bodyParts: ["hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_flexion",
      "trunk_flexion_assist"
    ],
    illustrationRegion: "deep_anterior_hip",
    aliases: [
      "hip flexors",
      "iliopsoas",
      "psoas"
    ]
  },

  // ===================================================
  // QUADRICEPS
  // ===================================================
  {
    id: "rectus_femoris",
    name: "Rectus Femoris",
    commonName: "Rectus Femoris",
    bodyParts: ["quadriceps", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_extension",
      "hip_flexion"
    ],
    illustrationRegion: "anterior_thigh_center",
    aliases: [
      "rectus femoris",
      "quad"
    ]
  },

  {
    id: "vastus_lateralis",
    name: "Vastus Lateralis",
    commonName: "Outer Quad",
    bodyParts: ["quadriceps", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_extension"
    ],
    illustrationRegion: "anterior_lateral_thigh",
    aliases: [
      "vastus lateralis",
      "outer quad"
    ]
  },

  {
    id: "vastus_medialis",
    name: "Vastus Medialis",
    commonName: "Inner Quad",
    bodyParts: ["quadriceps", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_extension",
      "patellar_stabilization"
    ],
    illustrationRegion: "anterior_medial_thigh",
    aliases: [
      "vastus medialis",
      "vmo",
      "inner quad"
    ]
  },

  {
    id: "vastus_intermedius",
    name: "Vastus Intermedius",
    commonName: "Deep Quad",
    bodyParts: ["quadriceps", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_extension"
    ],
    illustrationRegion: "deep_anterior_thigh",
    aliases: ["vastus intermedius"]
  },

  // ===================================================
  // HAMSTRINGS
  // ===================================================
  {
    id: "biceps_femoris",
    name: "Biceps Femoris",
    commonName: "Lateral Hamstring",
    bodyParts: ["hamstrings", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_flexion",
      "hip_extension",
      "tibial_external_rotation_assist"
    ],
    illustrationRegion: "posterior_lateral_thigh",
    aliases: [
      "biceps femoris",
      "outer hamstring"
    ]
  },

  {
    id: "semitendinosus",
    name: "Semitendinosus",
    commonName: "Medial Hamstring",
    bodyParts: ["hamstrings", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_flexion",
      "hip_extension",
      "tibial_internal_rotation_assist"
    ],
    illustrationRegion: "posterior_medial_thigh",
    aliases: ["semitendinosus"]
  },

  {
    id: "semimembranosus",
    name: "Semimembranosus",
    commonName: "Medial Hamstring",
    bodyParts: ["hamstrings", "lower_body"],
    region: "lower_body",
    functions: [
      "knee_flexion",
      "hip_extension",
      "tibial_internal_rotation_assist"
    ],
    illustrationRegion: "deep_posterior_medial_thigh",
    aliases: ["semimembranosus"]
  },

  // ===================================================
  // ADDUCTORS
  // ===================================================
  {
    id: "adductor_magnus",
    name: "Adductor Magnus",
    commonName: "Adductor Magnus",
    bodyParts: ["adductors", "hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_adduction",
      "hip_extension_assist"
    ],
    illustrationRegion: "medial_thigh",
    aliases: [
      "adductor magnus",
      "inner thigh",
      "hip adductor",
      "hip adductors"
    ]
  },

  {
    id: "adductor_longus",
    name: "Adductor Longus",
    commonName: "Adductor Longus",
    bodyParts: ["adductors", "hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_adduction",
      "hip_flexion_assist"
    ],
    illustrationRegion: "medial_thigh",
    aliases: [
      "adductor longus",
      "inner thigh adductor"
    ]
  },

  {
    id: "adductor_brevis",
    name: "Adductor Brevis",
    commonName: "Adductor Brevis",
    bodyParts: ["adductors", "hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_adduction",
      "hip_flexion_assist"
    ],
    illustrationRegion: "deep_medial_thigh",
    aliases: [
      "adductor brevis",
      "deep adductor"
    ]
  },

  {
    id: "gracilis",
    name: "Gracilis",
    commonName: "Gracilis",
    bodyParts: ["adductors", "hamstrings", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_adduction",
      "knee_flexion",
      "tibial_internal_rotation_assist"
    ],
    illustrationRegion: "medial_thigh",
    aliases: [
      "gracilis",
      "inner thigh muscle"
    ]
  },

  {
    id: "pectineus",
    name: "Pectineus",
    commonName: "Pectineus",
    bodyParts: ["adductors", "hips", "lower_body"],
    region: "lower_body",
    functions: [
      "hip_adduction",
      "hip_flexion_assist"
    ],
    illustrationRegion: "proximal_medial_thigh",
    aliases: [
      "pectineus",
      "upper inner thigh",
      "proximal adductor"
    ]
  },

  // ===================================================
  // CALVES / LOWER LEG
  // ===================================================
  {
    id: "gastrocnemius",
    name: "Gastrocnemius",
    commonName: "Calf",
    bodyParts: ["calves", "lower_body"],
    region: "lower_body",
    functions: [
      "ankle_plantarflexion",
      "knee_flexion_assist"
    ],
    illustrationRegion: "posterior_upper_calf",
    aliases: [
      "gastroc",
      "gastrocnemius",
      "calf"
    ]
  },

  {
    id: "soleus",
    name: "Soleus",
    commonName: "Soleus",
    bodyParts: ["calves", "lower_body"],
    region: "lower_body",
    functions: [
      "ankle_plantarflexion",
      "postural_stabilization"
    ],
    illustrationRegion: "deep_posterior_calf",
    aliases: ["soleus"]
  },

  {
    id: "tibialis_anterior",
    name: "Tibialis Anterior",
    commonName: "Shin Muscle",
    bodyParts: ["shins", "lower_body"],
    region: "lower_body",
    functions: [
      "ankle_dorsiflexion",
      "ankle_inversion"
    ],
    illustrationRegion: "anterior_lower_leg",
    aliases: [
      "tibialis anterior",
      "tibialis",
      "shin muscle"
    ]
  },

  {
    id: "peroneals",
    name: "Fibularis Muscle Group",
    commonName: "Peroneals",
    bodyParts: ["calves", "shins", "lower_body"],
    region: "lower_body",
    functions: [
      "ankle_eversion",
      "ankle_plantarflexion_assist",
      "ankle_stabilization"
    ],
    illustrationRegion: "lateral_lower_leg",
    aliases: [
      "peroneals",
      "fibularis",
      "fibular muscles"
    ]
  },

  // ===================================================
  // NECK
  // ===================================================
  {
    id: "sternocleidomastoid",
    name: "Sternocleidomastoid",
    commonName: "SCM",
    bodyParts: ["neck", "upper_body"],
    region: "upper_body",
    functions: [
      "neck_flexion",
      "neck_rotation",
      "neck_lateral_flexion"
    ],
    illustrationRegion: "anterolateral_neck",
    aliases: [
      "scm",
      "sternocleidomastoid"
    ]
  }
]);

// =====================================================
// INDEXES
// =====================================================

const MUSCLE_MAP = new Map(
  MUSCLES.map(
    muscle => [
      muscle.id,
      muscle
    ]
  )
);

const MUSCLE_ALIAS_MAP = new Map();

for (const muscle of MUSCLES) {
  const aliases = [
    muscle.id,
    muscle.name,
    muscle.commonName,
    ...(muscle.aliases || [])
  ];

  for (const alias of aliases) {
    MUSCLE_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      muscle.id
    );
  }
}

// =====================================================
// NORMALIZATION
// =====================================================

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

// =====================================================
// LOOKUPS
// =====================================================

function getMuscle(idOrAlias) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    MUSCLE_ALIAS_MAP.get(normalized) ||
    normalized;

  return MUSCLE_MAP.get(resolvedId) || null;
}

function hasMuscle(idOrAlias) {
  return Boolean(
    getMuscle(idOrAlias)
  );
}

// =====================================================
// FILTERING
// =====================================================

function getMuscles({
  bodyPart = null,
  region = null,
  functionId = null
} = {}) {
  const normalizedBodyPart =
    normalizeText(bodyPart);

  const normalizedRegion =
    normalizeText(region);

  const normalizedFunction =
    normalizeText(functionId);

  return MUSCLES.filter(muscle => {
    if (
      normalizedBodyPart &&
      !muscle.bodyParts.some(
        item =>
          normalizeText(item) ===
          normalizedBodyPart
      )
    ) {
      return false;
    }

    if (
      normalizedRegion &&
      normalizeText(muscle.region) !==
        normalizedRegion
    ) {
      return false;
    }

    if (
      normalizedFunction &&
      !muscle.functions.some(
        item =>
          normalizeText(item) ===
          normalizedFunction
      )
    ) {
      return false;
    }

    return true;
  });
}

function getMusclesByBodyPart(bodyPartId) {
  const bodyPart =
    BodyParts.get(bodyPartId);

  if (!bodyPart) {
    return [];
  }

  return getMuscles({
    bodyPart: bodyPart.id
  });
}

function getMusclesByFunction(functionId) {
  return getMuscles({
    functionId
  });
}

// =====================================================
// SEARCH
// =====================================================

function searchMuscles(query) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [...MUSCLES];
  }

  return MUSCLES.filter(muscle => {
    const searchable = [
      muscle.id,
      muscle.name,
      muscle.commonName,
      muscle.region,
      muscle.illustrationRegion,
      ...(muscle.bodyParts || []),
      ...(muscle.functions || []),
      ...(muscle.aliases || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(
      normalized
    );
  });
}

function getMuscleIds() {
  return MUSCLES.map(
    muscle => muscle.id
  );
}

// =====================================================
// VALIDATION
// =====================================================

function validateBodyPartReferences() {
  const invalid = [];

  for (const muscle of MUSCLES) {
    for (
      const bodyPartId
      of muscle.bodyParts || []
    ) {
      if (!BodyParts.has(bodyPartId)) {
        invalid.push({
          muscleId:
            muscle.id,
          bodyPartId
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

// =====================================================
// PUBLIC REGISTRY
// =====================================================

const AriTrainingMuscles =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      MUSCLES,

    get:
      getMuscle,

    has:
      hasMuscle,

    list:
      getMuscles,

    byBodyPart:
      getMusclesByBodyPart,

    byFunction:
      getMusclesByFunction,

    search:
      searchMuscles,

    ids:
      getMuscleIds,

    validateBodyParts:
      validateBodyPartReferences
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

  Ari.training.muscles =
    AriTrainingMuscles;

  globalThis.Ari =
    Ari;
}

// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,
  MUSCLES,
  getMuscle,
  hasMuscle,
  getMuscles,
  getMusclesByBodyPart,
  getMusclesByFunction,
  searchMuscles,
  getMuscleIds,
  validateBodyPartReferences,
  AriTrainingMuscles
};

export default AriTrainingMuscles;