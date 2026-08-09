// =====================================================
// ARI REBIRTH
// File: js/training/anatomy/joint-actions.js
// Version: 1.1.0
// Purpose:
//   Central registry for anatomical joint actions and
//   movement directions used throughout ARI Training.
//
// V1.1.0:
//   - Added shoulder_extension_assist.
//   - Added hip_abduction_assist.
//   - Added hip_adduction_assist.
//   - Added hip_external_rotation_assist.
//   - Added knee_extension_assist.
//   - Preserves existing stable joint-action IDs.
//
// Design:
//   - Stable IDs referenced by muscles.js and exercises.
//   - Human-friendly labels for exercise education.
//   - Includes movement plane, joint, direction, and
//     concise descriptions for later illustrations.
// =====================================================

const VERSION = "1.1.0";
const SOURCE = "js/training/anatomy/joint-actions";

const JOINT_ACTIONS = Object.freeze([
  // ===================================================
  // SHOULDER / GLENOHUMERAL
  // ===================================================
  {
    id: "shoulder_flexion",
    label: "Shoulder Flexion",
    joint: "shoulder",
    plane: "sagittal",
    direction: "forward_up",
    description:
      "Raises the arm forward and upward in front of the body.",
    aliases: [
      "arm flexion",
      "shoulder forward raise"
    ]
  },
  {
    id: "shoulder_extension",
    label: "Shoulder Extension",
    joint: "shoulder",
    plane: "sagittal",
    direction: "backward",
    description:
      "Moves the upper arm backward behind the body.",
    aliases: [
      "arm extension",
      "shoulder backward movement"
    ]
  },
  {
    id: "shoulder_abduction",
    label: "Shoulder Abduction",
    joint: "shoulder",
    plane: "frontal",
    direction: "away_from_midline",
    description:
      "Raises the arm out to the side away from the body's midline.",
    aliases: [
      "arm abduction",
      "lateral arm raise"
    ]
  },
  {
    id: "shoulder_adduction",
    label: "Shoulder Adduction",
    joint: "shoulder",
    plane: "frontal",
    direction: "toward_midline",
    description:
      "Brings the arm toward the body's midline from the side.",
    aliases: [
      "arm adduction"
    ]
  },
  {
    id: "shoulder_horizontal_adduction",
    label: "Shoulder Horizontal Adduction",
    joint: "shoulder",
    plane: "transverse",
    direction: "across_body",
    description:
      "Moves the upper arm horizontally across the front of the body.",
    aliases: [
      "horizontal adduction",
      "horizontal shoulder adduction"
    ]
  },
  {
    id: "shoulder_horizontal_abduction",
    label: "Shoulder Horizontal Abduction",
    joint: "shoulder",
    plane: "transverse",
    direction: "away_from_body",
    description:
      "Moves the upper arm horizontally away from the front of the body.",
    aliases: [
      "horizontal abduction",
      "horizontal shoulder abduction"
    ]
  },
  {
    id: "shoulder_internal_rotation",
    label: "Shoulder Internal Rotation",
    joint: "shoulder",
    plane: "transverse",
    direction: "rotate_inward",
    description:
      "Rotates the upper arm inward toward the body's midline.",
    aliases: [
      "internal shoulder rotation",
      "medial shoulder rotation"
    ]
  },
  {
    id: "shoulder_external_rotation",
    label: "Shoulder External Rotation",
    joint: "shoulder",
    plane: "transverse",
    direction: "rotate_outward",
    description:
      "Rotates the upper arm outward away from the body's midline.",
    aliases: [
      "external shoulder rotation",
      "lateral shoulder rotation"
    ]
  },
  {
    id: "glenohumeral_stabilization",
    label: "Shoulder Joint Stabilization",
    joint: "shoulder",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Maintains control and alignment of the upper-arm bone within the shoulder joint.",
    aliases: [
      "shoulder stabilization",
      "rotator cuff stabilization"
    ]
  },

  // ===================================================
  // SCAPULA
  // ===================================================
  {
    id: "scapular_protraction",
    label: "Scapular Protraction",
    joint: "scapulothoracic",
    plane: "transverse",
    direction: "forward",
    description:
      "Moves the shoulder blades forward and around the rib cage.",
    aliases: [
      "shoulder blade protraction"
    ]
  },
  {
    id: "scapular_retraction",
    label: "Scapular Retraction",
    joint: "scapulothoracic",
    plane: "transverse",
    direction: "backward",
    description:
      "Draws the shoulder blades toward the spine.",
    aliases: [
      "shoulder blade retraction"
    ]
  },
  {
    id: "scapular_elevation",
    label: "Scapular Elevation",
    joint: "scapulothoracic",
    plane: "frontal",
    direction: "up",
    description:
      "Raises the shoulder blades upward.",
    aliases: [
      "shoulder shrug",
      "scapula elevation"
    ]
  },
  {
    id: "scapular_depression",
    label: "Scapular Depression",
    joint: "scapulothoracic",
    plane: "frontal",
    direction: "down",
    description:
      "Draws the shoulder blades downward.",
    aliases: [
      "scapula depression"
    ]
  },
  {
    id: "scapular_upward_rotation",
    label: "Scapular Upward Rotation",
    joint: "scapulothoracic",
    plane: "frontal",
    direction: "rotate_upward",
    description:
      "Rotates the shoulder blade so the socket faces more upward during arm elevation.",
    aliases: [
      "upward scapular rotation"
    ]
  },
  {
    id: "scapular_downward_rotation",
    label: "Scapular Downward Rotation",
    joint: "scapulothoracic",
    plane: "frontal",
    direction: "rotate_downward",
    description:
      "Rotates the shoulder blade so the socket faces more downward.",
    aliases: [
      "downward scapular rotation"
    ]
  },
  {
    id: "scapular_stabilization",
    label: "Scapular Stabilization",
    joint: "scapulothoracic",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Controls the shoulder blade against the rib cage during movement.",
    aliases: [
      "shoulder blade stabilization"
    ]
  },

  // ===================================================
  // ELBOW / FOREARM / WRIST / HAND
  // ===================================================
  {
    id: "elbow_flexion",
    label: "Elbow Flexion",
    joint: "elbow",
    plane: "sagittal",
    direction: "bend",
    description:
      "Decreases the angle at the elbow by bringing the forearm toward the upper arm.",
    aliases: [
      "bend elbow"
    ]
  },
  {
    id: "elbow_extension",
    label: "Elbow Extension",
    joint: "elbow",
    plane: "sagittal",
    direction: "straighten",
    description:
      "Straightens the elbow by increasing the angle between the upper arm and forearm.",
    aliases: [
      "straighten elbow"
    ]
  },
  {
    id: "forearm_supination",
    label: "Forearm Supination",
    joint: "forearm",
    plane: "transverse",
    direction: "palm_up",
    description:
      "Rotates the forearm so the palm faces upward or forward.",
    aliases: [
      "supination",
      "palm up"
    ]
  },
  {
    id: "forearm_pronation",
    label: "Forearm Pronation",
    joint: "forearm",
    plane: "transverse",
    direction: "palm_down",
    description:
      "Rotates the forearm so the palm faces downward or backward.",
    aliases: [
      "pronation",
      "palm down"
    ]
  },
  {
    id: "forearm_neutral_position_assist",
    label: "Neutral-Grip Elbow Flexion Assistance",
    joint: "forearm",
    plane: "multi_planar",
    direction: "neutral",
    description:
      "Supports elbow flexion when the forearm is held in a neutral thumb-up position.",
    aliases: [
      "neutral grip flexion"
    ]
  },
  {
    id: "wrist_flexion",
    label: "Wrist Flexion",
    joint: "wrist",
    plane: "sagittal",
    direction: "palm_toward_forearm",
    description:
      "Bends the wrist so the palm moves toward the forearm.",
    aliases: [
      "flex wrist"
    ]
  },
  {
    id: "wrist_extension",
    label: "Wrist Extension",
    joint: "wrist",
    plane: "sagittal",
    direction: "back_of_hand_toward_forearm",
    description:
      "Bends the wrist so the back of the hand moves toward the forearm.",
    aliases: [
      "extend wrist"
    ]
  },
  {
    id: "finger_flexion",
    label: "Finger Flexion",
    joint: "hand",
    plane: "sagittal",
    direction: "close",
    description:
      "Bends the fingers toward the palm.",
    aliases: [
      "close fingers"
    ]
  },
  {
    id: "finger_extension",
    label: "Finger Extension",
    joint: "hand",
    plane: "sagittal",
    direction: "open",
    description:
      "Straightens the fingers away from the palm.",
    aliases: [
      "open fingers"
    ]
  },
  {
    id: "grip",
    label: "Grip",
    joint: "hand",
    plane: "multi_planar",
    direction: "close_and_hold",
    description:
      "Produces force by closing the fingers and thumb around an object.",
    aliases: [
      "gripping"
    ]
  },
  {
    id: "grip_stabilization",
    label: "Grip Stabilization",
    joint: "hand",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Maintains wrist and hand position while holding or controlling a load.",
    aliases: [
      "grip stability"
    ]
  },

  // ===================================================
  // SPINE / TRUNK
  // ===================================================
  {
    id: "trunk_flexion",
    label: "Trunk Flexion",
    joint: "spine",
    plane: "sagittal",
    direction: "forward",
    description:
      "Bends the trunk forward.",
    aliases: [
      "spinal flexion",
      "torso flexion"
    ]
  },
  {
    id: "spinal_extension",
    label: "Spinal Extension",
    joint: "spine",
    plane: "sagittal",
    direction: "backward",
    description:
      "Extends or straightens the spine from a flexed position.",
    aliases: [
      "back extension",
      "trunk extension"
    ]
  },
  {
    id: "trunk_rotation",
    label: "Trunk Rotation",
    joint: "spine",
    plane: "transverse",
    direction: "rotate",
    description:
      "Rotates the torso around the body's vertical axis.",
    aliases: [
      "spinal rotation",
      "torso rotation"
    ]
  },
  {
    id: "trunk_lateral_flexion",
    label: "Trunk Lateral Flexion",
    joint: "spine",
    plane: "frontal",
    direction: "side_bend",
    description:
      "Bends the trunk sideways.",
    aliases: [
      "side bend",
      "lateral spinal flexion"
    ]
  },
  {
    id: "spinal_lateral_flexion",
    label: "Spinal Lateral Flexion",
    joint: "spine",
    plane: "frontal",
    direction: "side_bend",
    description:
      "Bends the spine laterally to one side.",
    aliases: [
      "lateral spine flexion"
    ]
  },
  {
    id: "spinal_stabilization",
    label: "Spinal Stabilization",
    joint: "spine",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Maintains spinal position against external movement or load.",
    aliases: [
      "core stabilization",
      "spine stabilization"
    ]
  },
  {
    id: "abdominal_compression",
    label: "Abdominal Compression",
    joint: "trunk",
    plane: "multi_planar",
    direction: "compress",
    description:
      "Creates abdominal pressure and trunk stiffness to support the torso.",
    aliases: [
      "abdominal bracing"
    ]
  },
  {
    id: "anti_extension",
    label: "Anti-Extension",
    joint: "spine",
    plane: "sagittal",
    direction: "resist_extension",
    description:
      "Resists excessive spinal extension and helps maintain a neutral trunk position.",
    aliases: [
      "anti extension",
      "resist back arching"
    ]
  },
  {
    id: "anti_rotation",
    label: "Anti-Rotation",
    joint: "spine",
    plane: "transverse",
    direction: "resist_rotation",
    description:
      "Resists unwanted rotation of the trunk.",
    aliases: [
      "anti rotation"
    ]
  },
  {
    id: "pelvic_stabilization",
    label: "Pelvic Stabilization",
    joint: "pelvis",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Maintains pelvic control and alignment during movement.",
    aliases: [
      "pelvis stabilization",
      "hip stabilization"
    ]
  },

  // ===================================================
  // HIP
  // ===================================================
  {
    id: "hip_flexion",
    label: "Hip Flexion",
    joint: "hip",
    plane: "sagittal",
    direction: "forward_up",
    description:
      "Brings the thigh toward the torso.",
    aliases: [
      "flex hip",
      "raise thigh"
    ]
  },
  {
    id: "hip_extension",
    label: "Hip Extension",
    joint: "hip",
    plane: "sagittal",
    direction: "backward",
    description:
      "Moves the thigh backward or drives the hips forward from a flexed position.",
    aliases: [
      "extend hip"
    ]
  },
  {
    id: "hip_abduction",
    label: "Hip Abduction",
    joint: "hip",
    plane: "frontal",
    direction: "away_from_midline",
    description:
      "Moves the thigh away from the body's midline.",
    aliases: [
      "abduct hip",
      "leg out to side"
    ]
  },
  {
    id: "hip_adduction",
    label: "Hip Adduction",
    joint: "hip",
    plane: "frontal",
    direction: "toward_midline",
    description:
      "Moves the thigh toward the body's midline.",
    aliases: [
      "adduct hip",
      "inner thigh movement"
    ]
  },
  {
    id: "hip_internal_rotation",
    label: "Hip Internal Rotation",
    joint: "hip",
    plane: "transverse",
    direction: "rotate_inward",
    description:
      "Rotates the thigh inward toward the body's midline.",
    aliases: [
      "internal hip rotation"
    ]
  },
  {
    id: "hip_external_rotation",
    label: "Hip External Rotation",
    joint: "hip",
    plane: "transverse",
    direction: "rotate_outward",
    description:
      "Rotates the thigh outward away from the body's midline.",
    aliases: [
      "external hip rotation"
    ]
  },
  {
    id: "hip_flexion_assist",
    label: "Hip Flexion Assistance",
    joint: "hip",
    plane: "sagittal",
    direction: "forward_up",
    description:
      "Assists other muscles in bringing the thigh toward the torso.",
    aliases: [
      "assist hip flexion"
    ]
  },
  {
    id: "hip_extension_assist",
    label: "Hip Extension Assistance",
    joint: "hip",
    plane: "sagittal",
    direction: "backward",
    description:
      "Assists other muscles in extending the hip.",
    aliases: [
      "assist hip extension"
    ]
  },
  {
    id: "hip_internal_rotation_assist",
    label: "Hip Internal Rotation Assistance",
    joint: "hip",
    plane: "transverse",
    direction: "rotate_inward",
    description:
      "Assists other muscles in rotating the thigh inward.",
    aliases: [
      "assist hip internal rotation"
    ]
  },
  {
    id: "trunk_flexion_assist",
    label: "Trunk Flexion Assistance",
    joint: "spine",
    plane: "sagittal",
    direction: "forward",
    description:
      "Assists other muscles in flexing the trunk.",
    aliases: [
      "assist trunk flexion"
    ]
  },

  // ===================================================
  // KNEE
  // ===================================================
  {
    id: "knee_flexion",
    label: "Knee Flexion",
    joint: "knee",
    plane: "sagittal",
    direction: "bend",
    description:
      "Bends the knee by bringing the lower leg toward the back of the thigh.",
    aliases: [
      "bend knee"
    ]
  },
  {
    id: "knee_extension",
    label: "Knee Extension",
    joint: "knee",
    plane: "sagittal",
    direction: "straighten",
    description:
      "Straightens the knee.",
    aliases: [
      "straighten knee"
    ]
  },
  {
    id: "knee_flexion_assist",
    label: "Knee Flexion Assistance",
    joint: "knee",
    plane: "sagittal",
    direction: "bend",
    description:
      "Assists other muscles in bending the knee.",
    aliases: [
      "assist knee flexion"
    ]
  },
  {
    id: "patellar_stabilization",
    label: "Patellar Stabilization",
    joint: "knee",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Helps control the position and tracking of the kneecap during knee movement.",
    aliases: [
      "kneecap stabilization"
    ]
  },
  {
    id: "tibial_internal_rotation_assist",
    label: "Tibial Internal Rotation Assistance",
    joint: "knee",
    plane: "transverse",
    direction: "rotate_inward",
    description:
      "Assists inward rotation of the lower leg when the knee is flexed.",
    aliases: [
      "assist tibial internal rotation"
    ]
  },
  {
    id: "tibial_external_rotation_assist",
    label: "Tibial External Rotation Assistance",
    joint: "knee",
    plane: "transverse",
    direction: "rotate_outward",
    description:
      "Assists outward rotation of the lower leg when the knee is flexed.",
    aliases: [
      "assist tibial external rotation"
    ]
  },

  // ===================================================
  // ANKLE / FOOT
  // ===================================================
  {
    id: "ankle_plantarflexion",
    label: "Ankle Plantarflexion",
    joint: "ankle",
    plane: "sagittal",
    direction: "toes_down",
    description:
      "Points the foot downward, as when rising onto the toes.",
    aliases: [
      "plantar flexion",
      "point toes"
    ]
  },
  {
    id: "ankle_dorsiflexion",
    label: "Ankle Dorsiflexion",
    joint: "ankle",
    plane: "sagittal",
    direction: "toes_up",
    description:
      "Brings the top of the foot toward the shin.",
    aliases: [
      "dorsiflexion",
      "toes up"
    ]
  },
  {
    id: "ankle_inversion",
    label: "Ankle Inversion",
    joint: "ankle",
    plane: "frontal",
    direction: "sole_inward",
    description:
      "Turns the sole of the foot inward.",
    aliases: [
      "foot inversion"
    ]
  },
  {
    id: "ankle_eversion",
    label: "Ankle Eversion",
    joint: "ankle",
    plane: "frontal",
    direction: "sole_outward",
    description:
      "Turns the sole of the foot outward.",
    aliases: [
      "foot eversion"
    ]
  },
  {
    id: "ankle_plantarflexion_assist",
    label: "Ankle Plantarflexion Assistance",
    joint: "ankle",
    plane: "sagittal",
    direction: "toes_down",
    description:
      "Assists other muscles in pointing the foot downward.",
    aliases: [
      "assist plantarflexion"
    ]
  },
  {
    id: "ankle_stabilization",
    label: "Ankle Stabilization",
    joint: "ankle",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Controls ankle position during standing, walking, running, and loaded movement.",
    aliases: [
      "ankle stability"
    ]
  },
  {
    id: "postural_stabilization",
    label: "Postural Stabilization",
    joint: "whole_body",
    plane: "multi_planar",
    direction: "stabilize",
    description:
      "Helps maintain upright posture and balance against gravity.",
    aliases: [
      "postural stability"
    ]
  },

  // ===================================================
  // NECK
  // ===================================================
  {
    id: "neck_flexion",
    label: "Neck Flexion",
    joint: "cervical_spine",
    plane: "sagittal",
    direction: "forward",
    description:
      "Bends the neck forward.",
    aliases: [
      "cervical flexion"
    ]
  },
  {
    id: "neck_extension",
    label: "Neck Extension",
    joint: "cervical_spine",
    plane: "sagittal",
    direction: "backward",
    description:
      "Extends the neck backward.",
    aliases: [
      "cervical extension"
    ]
  },
  {
    id: "neck_rotation",
    label: "Neck Rotation",
    joint: "cervical_spine",
    plane: "transverse",
    direction: "rotate",
    description:
      "Turns the head and neck to one side.",
    aliases: [
      "cervical rotation"
    ]
  },
  {
    id: "neck_lateral_flexion",
    label: "Neck Lateral Flexion",
    joint: "cervical_spine",
    plane: "frontal",
    direction: "side_bend",
    description:
      "Tilts the head toward one shoulder.",
    aliases: [
      "cervical lateral flexion"
    ]
  },

  // ===================================================
  // GENERIC ASSISTANCE / STABILITY LABELS
  // ===================================================
  {
    id: "shoulder_flexion_assist",
    label: "Shoulder Flexion Assistance",
    joint: "shoulder",
    plane: "sagittal",
    direction: "forward_up",
    description:
      "Assists other muscles in raising the arm forward.",
    aliases: [
      "assist shoulder flexion",
      "shoulder flexion assistance"
    ]
  },
  {
    id: "shoulder_extension_assist",
    label: "Shoulder Extension Assistance",
    joint: "shoulder",
    plane: "sagittal",
    direction: "backward",
    description:
      "Assists other muscles in moving the upper arm backward.",
    aliases: [
      "assist shoulder extension",
      "shoulder extension assistance"
    ]
  },
  {
    id: "hip_abduction_assist",
    label: "Hip Abduction Assistance",
    joint: "hip",
    plane: "frontal",
    direction: "away_from_midline",
    description:
      "Assists other muscles in moving the thigh away from the body's midline.",
    aliases: [
      "assist hip abduction",
      "hip abduction assistance"
    ]
  },
  {
    id: "hip_adduction_assist",
    label: "Hip Adduction Assistance",
    joint: "hip",
    plane: "frontal",
    direction: "toward_midline",
    description:
      "Assists other muscles in moving the thigh toward the body's midline.",
    aliases: [
      "assist hip adduction",
      "hip adduction assistance"
    ]
  },
  {
    id: "hip_external_rotation_assist",
    label: "Hip External Rotation Assistance",
    joint: "hip",
    plane: "transverse",
    direction: "rotate_outward",
    description:
      "Assists other muscles in rotating the thigh outward.",
    aliases: [
      "assist hip external rotation",
      "hip external rotation assistance"
    ]
  },
  {
    id: "knee_extension_assist",
    label: "Knee Extension Assistance",
    joint: "knee",
    plane: "sagittal",
    direction: "straighten",
    description:
      "Assists other muscles in straightening the knee.",
    aliases: [
      "assist knee extension",
      "knee extension assistance"
    ]
  }
]);

const JOINT_ACTION_MAP = new Map(
  JOINT_ACTIONS.map(
    action => [action.id, action]
  )
);

const JOINT_ACTION_ALIAS_MAP = new Map();

for (const action of JOINT_ACTIONS) {
  const aliases = [
    action.id,
    action.label,
    ...(action.aliases || [])
  ];

  for (const alias of aliases) {
    JOINT_ACTION_ALIAS_MAP.set(
      String(alias).trim().toLowerCase(),
      action.id
    );
  }
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

function getJointAction(idOrAlias) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    JOINT_ACTION_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return JOINT_ACTION_MAP.get(
    resolvedId
  ) || null;
}

function hasJointAction(idOrAlias) {
  return Boolean(
    getJointAction(idOrAlias)
  );
}

function getJointActions({
  joint = null,
  plane = null,
  direction = null
} = {}) {
  const normalizedJoint =
    normalizeText(joint);

  const normalizedPlane =
    normalizeText(plane);

  const normalizedDirection =
    normalizeText(direction);

  return JOINT_ACTIONS.filter(
    action => {
      if (
        normalizedJoint &&
        normalizeText(action.joint) !== normalizedJoint
      ) {
        return false;
      }

      if (
        normalizedPlane &&
        normalizeText(action.plane) !== normalizedPlane
      ) {
        return false;
      }

      if (
        normalizedDirection &&
        normalizeText(action.direction) !== normalizedDirection
      ) {
        return false;
      }

      return true;
    }
  );
}

function searchJointActions(query) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [...JOINT_ACTIONS];
  }

  return JOINT_ACTIONS.filter(
    action => {
      const searchable = [
        action.id,
        action.label,
        action.joint,
        action.plane,
        action.direction,
        action.description,
        ...(action.aliases || [])
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

function getJointActionIds() {
  return JOINT_ACTIONS.map(
    action => action.id
  );
}

const AriTrainingJointActions = Object.freeze({
  version: VERSION,
  source: SOURCE,
  all: JOINT_ACTIONS,
  get: getJointAction,
  has: hasJointAction,
  list: getJointActions,
  search: searchJointActions,
  ids: getJointActionIds
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

  Ari.training.jointActions =
    AriTrainingJointActions;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  JOINT_ACTIONS,
  getJointAction,
  hasJointAction,
  getJointActions,
  searchJointActions,
  getJointActionIds,
  AriTrainingJointActions
};

export default AriTrainingJointActions;