// =====================================================
// ARI REBIRTH
// File: ari/training/anatomy/body-parts.js
// Version: 1.0.0
// Purpose:
//   Central registry for user-facing body-part and body-region
//   classifications used throughout ARI Training.
//
// Design:
//   - Human-friendly labels for workout browsing.
//   - Stable IDs for exercise records and filtering.
//   - Does NOT duplicate detailed muscle anatomy.
//   - Detailed muscles belong in muscles.js.
//   - Exercises should reference these IDs instead of
//     creating their own body-part labels.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "ari/training/anatomy/body-parts";

const BODY_PARTS = Object.freeze([
  {
    id: "full_body",
    label: "Full Body",
    shortLabel: "Full Body",
    region: "full_body",
    group: "global",
    description:
      "Exercises or workouts that substantially involve both upper- and lower-body muscle groups.",
    aliases: ["full body", "whole body", "total body"],
    selectable: true
  },
  {
    id: "upper_body",
    label: "Upper Body",
    shortLabel: "Upper Body",
    region: "upper_body",
    group: "global",
    description:
      "Exercises or workouts focused primarily on the torso, shoulders, arms, and upper back.",
    aliases: ["upper body"],
    selectable: true
  },
  {
    id: "lower_body",
    label: "Lower Body",
    shortLabel: "Lower Body",
    region: "lower_body",
    group: "global",
    description:
      "Exercises or workouts focused primarily on the hips, thighs, lower legs, and related musculature.",
    aliases: ["lower body", "legs"],
    selectable: true
  },

  {
    id: "chest",
    label: "Chest",
    shortLabel: "Chest",
    region: "upper_body",
    group: "torso",
    description:
      "Front-of-torso training centered on the pectoral musculature.",
    aliases: ["pecs", "pectorals", "chest"],
    selectable: true
  },
  {
    id: "back",
    label: "Back",
    shortLabel: "Back",
    region: "upper_body",
    group: "torso",
    description:
      "Posterior torso training including the lats, traps, rhomboids, and spinal support musculature.",
    aliases: ["back", "upper back", "mid back"],
    selectable: true
  },
  {
    id: "shoulders",
    label: "Shoulders",
    shortLabel: "Shoulders",
    region: "upper_body",
    group: "shoulder_girdle",
    description:
      "Training focused on the deltoids and supporting shoulder-girdle musculature.",
    aliases: ["shoulders", "delts", "deltoids"],
    selectable: true
  },
  {
    id: "arms",
    label: "Arms",
    shortLabel: "Arms",
    region: "upper_body",
    group: "upper_limb",
    description:
      "Combined arm training that may include the biceps, triceps, and forearms.",
    aliases: ["arms", "arm day"],
    selectable: true
  },
  {
    id: "biceps",
    label: "Biceps",
    shortLabel: "Biceps",
    region: "upper_body",
    group: "upper_limb",
    description:
      "Anterior upper-arm training centered on elbow flexion and related functions.",
    aliases: ["biceps", "bis", "biceps brachii"],
    selectable: true
  },
  {
    id: "triceps",
    label: "Triceps",
    shortLabel: "Triceps",
    region: "upper_body",
    group: "upper_limb",
    description:
      "Posterior upper-arm training centered on elbow extension.",
    aliases: ["triceps", "tris", "triceps brachii"],
    selectable: true
  },
  {
    id: "forearms",
    label: "Forearms",
    shortLabel: "Forearms",
    region: "upper_body",
    group: "upper_limb",
    description:
      "Training focused on the forearm flexors, extensors, grip, and wrist control.",
    aliases: ["forearms", "grip"],
    selectable: true
  },
  {
    id: "neck",
    label: "Neck",
    shortLabel: "Neck",
    region: "upper_body",
    group: "neck",
    description:
      "Training or mobility focused on cervical musculature and neck control.",
    aliases: ["neck", "cervical"],
    selectable: true
  },

  {
    id: "core",
    label: "Core",
    shortLabel: "Core",
    region: "core",
    group: "trunk",
    description:
      "Trunk training involving abdominal, oblique, deep-core, and spinal-stabilizing musculature.",
    aliases: ["core", "abs", "abdominals"],
    selectable: true
  },
  {
    id: "abdominals",
    label: "Abdominals",
    shortLabel: "Abs",
    region: "core",
    group: "trunk",
    description:
      "Anterior abdominal training, including trunk flexion and stabilization.",
    aliases: ["abs", "abdominals", "six pack"],
    selectable: true
  },
  {
    id: "obliques",
    label: "Obliques",
    shortLabel: "Obliques",
    region: "core",
    group: "trunk",
    description:
      "Lateral abdominal training associated with rotation, anti-rotation, and side-bending control.",
    aliases: ["obliques", "side abs"],
    selectable: true
  },
  {
    id: "lower_back",
    label: "Lower Back",
    shortLabel: "Lower Back",
    region: "core",
    group: "trunk",
    description:
      "Posterior trunk training focused on lumbar support and spinal extension/stabilization.",
    aliases: ["lower back", "lumbar", "erectors"],
    selectable: true
  },

  {
    id: "glutes",
    label: "Glutes",
    shortLabel: "Glutes",
    region: "lower_body",
    group: "hip",
    description:
      "Hip-focused training centered on the gluteal musculature.",
    aliases: ["glutes", "gluteals", "butt"],
    selectable: true
  },
  {
    id: "hips",
    label: "Hips",
    shortLabel: "Hips",
    region: "lower_body",
    group: "hip",
    description:
      "Training or mobility involving the hip joint and surrounding musculature.",
    aliases: ["hips", "hip"],
    selectable: true
  },
  {
    id: "quadriceps",
    label: "Quadriceps",
    shortLabel: "Quads",
    region: "lower_body",
    group: "thigh",
    description:
      "Anterior thigh training centered on knee extension.",
    aliases: ["quadriceps", "quads", "front thigh"],
    selectable: true
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    shortLabel: "Hamstrings",
    region: "lower_body",
    group: "thigh",
    description:
      "Posterior thigh training associated with knee flexion and hip extension.",
    aliases: ["hamstrings", "hams", "posterior thigh"],
    selectable: true
  },
  {
    id: "adductors",
    label: "Adductors",
    shortLabel: "Adductors",
    region: "lower_body",
    group: "thigh",
    description:
      "Inner-thigh musculature involved primarily in hip adduction and stabilization.",
    aliases: ["adductors", "inner thigh", "groin"],
    selectable: true
  },
  {
    id: "abductors",
    label: "Abductors",
    shortLabel: "Abductors",
    region: "lower_body",
    group: "hip",
    description:
      "Hip musculature involved in moving the leg away from the body's midline and stabilizing the pelvis.",
    aliases: ["abductors", "outer hip", "outer thigh"],
    selectable: true
  },
  {
    id: "calves",
    label: "Calves",
    shortLabel: "Calves",
    region: "lower_body",
    group: "lower_leg",
    description:
      "Posterior lower-leg training centered on plantarflexion and ankle control.",
    aliases: ["calves", "calf", "lower leg"],
    selectable: true
  },
  {
    id: "shins",
    label: "Shins",
    shortLabel: "Shins",
    region: "lower_body",
    group: "lower_leg",
    description:
      "Anterior lower-leg training associated primarily with dorsiflexion and ankle control.",
    aliases: ["shins", "tibialis", "front lower leg"],
    selectable: true
  }
]);

const BODY_PART_MAP = new Map(
  BODY_PARTS.map(bodyPart => [bodyPart.id, bodyPart])
);

const BODY_PART_ALIAS_MAP = new Map();

for (const bodyPart of BODY_PARTS) {
  BODY_PART_ALIAS_MAP.set(bodyPart.id.toLowerCase(), bodyPart.id);
  BODY_PART_ALIAS_MAP.set(bodyPart.label.toLowerCase(), bodyPart.id);
  BODY_PART_ALIAS_MAP.set(bodyPart.shortLabel.toLowerCase(), bodyPart.id);

  for (const alias of bodyPart.aliases || []) {
    BODY_PART_ALIAS_MAP.set(
      String(alias).trim().toLowerCase(),
      bodyPart.id
    );
  }
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

function getBodyPart(id) {
  const normalized = normalizeText(id);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    BODY_PART_ALIAS_MAP.get(normalized) || normalized;

  return BODY_PART_MAP.get(resolvedId) || null;
}

function hasBodyPart(id) {
  return Boolean(getBodyPart(id));
}

function getBodyParts({
  region = null,
  group = null,
  selectableOnly = false
} = {}) {
  const normalizedRegion = normalizeText(region);
  const normalizedGroup = normalizeText(group);

  return BODY_PARTS.filter(bodyPart => {
    if (
      selectableOnly &&
      bodyPart.selectable !== true
    ) {
      return false;
    }

    if (
      normalizedRegion &&
      normalizeText(bodyPart.region) !== normalizedRegion
    ) {
      return false;
    }

    if (
      normalizedGroup &&
      normalizeText(bodyPart.group) !== normalizedGroup
    ) {
      return false;
    }

    return true;
  });
}

function searchBodyParts(query) {
  const normalized = normalizeText(query);

  if (!normalized) {
    return [...BODY_PARTS];
  }

  return BODY_PARTS.filter(bodyPart => {
    const searchable = [
      bodyPart.id,
      bodyPart.label,
      bodyPart.shortLabel,
      bodyPart.region,
      bodyPart.group,
      bodyPart.description,
      ...(bodyPart.aliases || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalized);
  });
}

function getBodyPartIds() {
  return BODY_PARTS.map(bodyPart => bodyPart.id);
}

const AriTrainingBodyParts = Object.freeze({
  version: VERSION,
  source: SOURCE,
  all: BODY_PARTS,
  get: getBodyPart,
  has: hasBodyPart,
  list: getBodyParts,
  search: searchBodyParts,
  ids: getBodyPartIds
});

if (typeof globalThis !== "undefined") {
  const Ari = globalThis.Ari || {};

  Ari.training = Ari.training || {};
  Ari.training.bodyParts = AriTrainingBodyParts;

  globalThis.Ari = Ari;
}

export {
  VERSION,
  SOURCE,
  BODY_PARTS,
  getBodyPart,
  hasBodyPart,
  getBodyParts,
  searchBodyParts,
  getBodyPartIds,
  AriTrainingBodyParts
};

export default AriTrainingBodyParts;
