// =====================================================
// ARI REBIRTH
// File: js/training/energy/intensity-levels.js
// Version: 1.0.0
// Purpose:
//   Central registry for exercise intensity levels used
//   throughout ARI Training.
//
// Design:
//   - Gives ARI a shared vocabulary for perceived effort.
//   - Supports calorie-estimation lookups, workout planning,
//     logging, templates, and later wearable integration.
//   - Keeps overall lifestyle activity level separate from
//     exercise-session intensity.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/energy/intensity-levels";

const INTENSITY_LEVELS = Object.freeze([
  {
    id: "very_light",
    label: "Very Light",
    shortLabel: "Very Light",
    order: 1,
    description:
      "Minimal effort used for warm-up, cooldown, gentle mobility, or very easy recovery activity.",
    perceivedEffort: {
      min: 1,
      max: 2
    },
    talkTest:
      "Conversation is easy and breathing remains close to resting.",
    approximateHeartRatePercentMax: {
      min: 40,
      max: 50
    },
    commonUses: [
      "warmup",
      "cooldown",
      "recovery",
      "mobility"
    ],
    aliases: [
      "very easy",
      "recovery pace",
      "minimal effort"
    ]
  },

  {
    id: "light",
    label: "Light",
    shortLabel: "Light",
    order: 2,
    description:
      "Easy effort that can usually be sustained comfortably for an extended period.",
    perceivedEffort: {
      min: 2,
      max: 3
    },
    talkTest:
      "Full conversation is comfortable.",
    approximateHeartRatePercentMax: {
      min: 50,
      max: 60
    },
    commonUses: [
      "walking",
      "easy_cardio",
      "active_recovery",
      "light_strength",
      "mobility"
    ],
    aliases: [
      "easy",
      "low intensity",
      "easy effort"
    ]
  },

  {
    id: "moderate",
    label: "Moderate",
    shortLabel: "Moderate",
    order: 3,
    description:
      "Noticeable but controlled effort with increased breathing and heart rate.",
    perceivedEffort: {
      min: 4,
      max: 6
    },
    talkTest:
      "Conversation is possible, though longer sentences require more breathing.",
    approximateHeartRatePercentMax: {
      min: 60,
      max: 75
    },
    commonUses: [
      "cardio",
      "endurance",
      "general_fitness",
      "moderate_strength"
    ],
    aliases: [
      "medium",
      "moderate intensity",
      "steady effort"
    ]
  },

  {
    id: "vigorous",
    label: "Vigorous",
    shortLabel: "Vigorous",
    order: 4,
    description:
      "Hard effort with substantially increased breathing, heart rate, or muscular demand.",
    perceivedEffort: {
      min: 7,
      max: 8
    },
    talkTest:
      "Only short phrases are comfortable before another breath is needed.",
    approximateHeartRatePercentMax: {
      min: 75,
      max: 90
    },
    commonUses: [
      "hard_cardio",
      "intervals",
      "vigorous_strength",
      "conditioning",
      "tempo_running"
    ],
    aliases: [
      "hard",
      "high intensity",
      "vigorous effort"
    ]
  },

  {
    id: "near_maximal",
    label: "Near Maximal",
    shortLabel: "Near Max",
    order: 5,
    description:
      "Very hard effort generally sustainable only for short periods or limited repetitions.",
    perceivedEffort: {
      min: 9,
      max: 9
    },
    talkTest:
      "Speaking is difficult beyond one or two words.",
    approximateHeartRatePercentMax: {
      min: 90,
      max: 95
    },
    commonUses: [
      "sprints",
      "hard_intervals",
      "heavy_strength",
      "power"
    ],
    aliases: [
      "very hard",
      "near max",
      "near maximum"
    ]
  },

  {
    id: "maximal",
    label: "Maximal",
    shortLabel: "Max",
    order: 6,
    description:
      "All-out effort reserved for brief maximal attempts, sprints, or testing.",
    perceivedEffort: {
      min: 10,
      max: 10
    },
    talkTest:
      "Conversation is not practical during the effort.",
    approximateHeartRatePercentMax: {
      min: 95,
      max: 100
    },
    commonUses: [
      "max_sprint",
      "testing",
      "maximal_power",
      "maximal_strength"
    ],
    aliases: [
      "all out",
      "maximum",
      "max effort"
    ]
  }
]);

const INTENSITY_MAP = new Map(
  INTENSITY_LEVELS.map(
    level => [
      level.id,
      level
    ]
  )
);

const INTENSITY_ALIAS_MAP =
  new Map();

for (const level of INTENSITY_LEVELS) {
  const aliases = [
    level.id,
    level.label,
    level.shortLabel,
    ...(level.aliases || [])
  ];

  for (const alias of aliases) {
    INTENSITY_ALIAS_MAP.set(
      String(alias)
        .trim()
        .toLowerCase(),
      level.id
    );
  }
}

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

function normalizeNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getIntensityLevel(
  idOrAlias
) {
  const normalized =
    normalizeText(idOrAlias);

  if (!normalized) {
    return null;
  }

  const resolvedId =
    INTENSITY_ALIAS_MAP.get(
      normalized
    ) || normalized;

  return INTENSITY_MAP.get(
    resolvedId
  ) || null;
}

function hasIntensityLevel(
  idOrAlias
) {
  return Boolean(
    getIntensityLevel(
      idOrAlias
    )
  );
}

function getIntensityLevels({
  minOrder = null,
  maxOrder = null
} = {}) {
  const normalizedMin =
    normalizeNumber(
      minOrder
    );

  const normalizedMax =
    normalizeNumber(
      maxOrder
    );

  return INTENSITY_LEVELS.filter(
    level => {
      if (
        normalizedMin !== null &&
        level.order <
          normalizedMin
      ) {
        return false;
      }

      if (
        normalizedMax !== null &&
        level.order >
          normalizedMax
      ) {
        return false;
      }

      return true;
    }
  );
}

function getIntensityFromRpe(
  rpe
) {
  const value =
    normalizeNumber(rpe);

  if (
    value === null ||
    value < 1 ||
    value > 10
  ) {
    return null;
  }

  return (
    INTENSITY_LEVELS.find(
      level =>
        value >=
          level.perceivedEffort.min &&
        value <=
          level.perceivedEffort.max
    ) || null
  );
}

function getIntensityFromHeartRatePercent(
  percent
) {
  const value =
    normalizeNumber(
      percent
    );

  if (
    value === null ||
    value <= 0
  ) {
    return null;
  }

  const bounded =
    Math.min(
      100,
      Math.max(
        0,
        value
      )
    );

  return (
    INTENSITY_LEVELS.find(
      level =>
        bounded >=
          level
            .approximateHeartRatePercentMax
            .min &&
        bounded <=
          level
            .approximateHeartRatePercentMax
            .max
    ) ||
    null
  );
}

function searchIntensityLevels(
  query
) {
  const normalized =
    normalizeText(query);

  if (!normalized) {
    return [
      ...INTENSITY_LEVELS
    ];
  }

  return INTENSITY_LEVELS.filter(
    level => {
      const searchable = [
        level.id,
        level.label,
        level.shortLabel,
        level.description,
        level.talkTest,
        ...(level.commonUses || []),
        ...(level.aliases || [])
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

function getIntensityIds() {
  return INTENSITY_LEVELS.map(
    level => level.id
  );
}

const AriTrainingIntensityLevels =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      INTENSITY_LEVELS,

    get:
      getIntensityLevel,

    has:
      hasIntensityLevel,

    list:
      getIntensityLevels,

    fromRpe:
      getIntensityFromRpe,

    fromHeartRatePercent:
      getIntensityFromHeartRatePercent,

    search:
      searchIntensityLevels,

    ids:
      getIntensityIds
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

  Ari.training.energy =
    Ari.training.energy ||
    {};

  Ari.training.energy.intensityLevels =
    AriTrainingIntensityLevels;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  INTENSITY_LEVELS,
  getIntensityLevel,
  hasIntensityLevel,
  getIntensityLevels,
  getIntensityFromRpe,
  getIntensityFromHeartRatePercent,
  searchIntensityLevels,
  getIntensityIds,
  AriTrainingIntensityLevels
};

export default AriTrainingIntensityLevels;
