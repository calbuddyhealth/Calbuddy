// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-registry.js
// Version: 2.0.1
// Purpose:
//   Central Exercise Library registry for ARI Training.
//
// V2.0.1:
//   - Removed nonexistent mobility/mobility.js import.
//   - Removed mobility module registration.
//   - Prevents the entire ES-module dependency tree from
//     failing when ARI Training boots.
//
// Architecture:
//   anatomy/body-parts.js
//   anatomy/muscles.js
//   movements/movement-patterns.js
//   movements/exercise-types.js
//            ↓
//   Individual exercise data modules
//            ↓
//   exercise-registry.js
//            ↓
//   Search / recommendations / workout builder / training UI
//
// Design:
//   - Every selectable exercise is registered exactly once.
//   - Individual category files own exercise records.
//   - Workout plans reference stable exercise IDs.
//   - Supports aliases, search, filtering, recommendations,
//     substitutions, and reference validation.
//   - Detects duplicate IDs across modules.
//   - Validates body parts, muscles, movement patterns,
//     exercise types, and substitution references.
// =====================================================

import BodyParts
  from "../anatomy/body-parts.js";

import Muscles
  from "../anatomy/muscles.js";

import MovementPatterns
  from "../movements/movement-patterns.js";

import ExerciseTypes
  from "../movements/exercise-types.js";


// =====================================================
// STRENGTH MODULES
// =====================================================

import CHEST_EXERCISES
  from "./strength/chest.js";

import BACK_EXERCISES
  from "./strength/back.js";

import SHOULDER_EXERCISES
  from "./strength/shoulders.js";

import BICEPS_EXERCISES
  from "./strength/biceps.js";

import TRICEPS_EXERCISES
  from "./strength/triceps.js";

import LEG_EXERCISES
  from "./strength/legs.js";

import GLUTE_EXERCISES
  from "./strength/glutes.js";

import CALF_EXERCISES
  from "./strength/calves.js";

import FOREARM_EXERCISES
  from "./strength/forearms.js";


// =====================================================
// CORE
// =====================================================

import CORE_EXERCISES
  from "./core/core.js";


// =====================================================
// CARDIO
// =====================================================

import CARDIO_EXERCISES
  from "./cardio/cardio.js";


// =====================================================
// FUNCTIONAL
// =====================================================

import FUNCTIONAL_EXERCISES
  from "./functional/functional.js";


// =====================================================
// SPORTS
// =====================================================

import SPORTS_EXERCISES
  from "./sports/sports.js";

import SURFING_EXERCISES
  from "./sports/surfing.js";


const VERSION =
  "2.0.1";

const SOURCE =
  "js/training/exercises/exercise-registry";


// =====================================================
// MODULE DEFINITIONS
// =====================================================

const EXERCISE_MODULES =
  Object.freeze([
    {
      id: "chest",
      label: "Chest",
      path: "./strength/chest.js",
      exercises:
        CHEST_EXERCISES
    },

    {
      id: "back",
      label: "Back",
      path: "./strength/back.js",
      exercises:
        BACK_EXERCISES
    },

    {
      id: "shoulders",
      label: "Shoulders",
      path: "./strength/shoulders.js",
      exercises:
        SHOULDER_EXERCISES
    },

    {
      id: "biceps",
      label: "Biceps",
      path: "./strength/biceps.js",
      exercises:
        BICEPS_EXERCISES
    },

    {
      id: "triceps",
      label: "Triceps",
      path: "./strength/triceps.js",
      exercises:
        TRICEPS_EXERCISES
    },

    {
      id: "legs",
      label: "Legs",
      path: "./strength/legs.js",
      exercises:
        LEG_EXERCISES
    },

    {
      id: "glutes",
      label: "Glutes",
      path: "./strength/glutes.js",
      exercises:
        GLUTE_EXERCISES
    },

    {
      id: "calves",
      label: "Calves",
      path: "./strength/calves.js",
      exercises:
        CALF_EXERCISES
    },

    {
      id: "forearms",
      label: "Forearms",
      path: "./strength/forearms.js",
      exercises:
        FOREARM_EXERCISES
    },

    {
      id: "core",
      label: "Core",
      path: "./core/core.js",
      exercises:
        CORE_EXERCISES
    },

    {
      id: "cardio",
      label: "Cardio",
      path: "./cardio/cardio.js",
      exercises:
        CARDIO_EXERCISES
    },

    {
      id: "functional",
      label: "Functional",
      path: "./functional/functional.js",
      exercises:
        FUNCTIONAL_EXERCISES
    },

    {
      id: "sports",
      label: "Sports",
      path: "./sports/sports.js",
      exercises:
        SPORTS_EXERCISES
    },

    {
      id: "surfing",
      label: "Surfing",
      path: "./sports/surfing.js",
      exercises:
        SURFING_EXERCISES
    }
  ]);


// =====================================================
// NORMALIZATION HELPERS
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

  return String(
    value
  )
    .trim()
    .toLowerCase();
}


function slugify(
  value
) {
  return normalizeText(
    value
  )
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /['’]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}


function asArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


function normalizeLimit(
  value,
  fallback = 12
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number <= 0
  ) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor(
      number
    )
  );
}


// =====================================================
// FLATTEN MODULES
// =====================================================

const EXERCISE_RECORDS = [];

const EXERCISE_MODULE_BY_ID =
  new Map();

const EXERCISE_MODULE_BY_EXERCISE_ID =
  new Map();

const DUPLICATE_EXERCISE_IDS = [];

const seenExerciseIds =
  new Set();


for (
  const moduleRecord
  of EXERCISE_MODULES
) {
  EXERCISE_MODULE_BY_ID.set(
    moduleRecord.id,
    moduleRecord
  );

  for (
    const exercise
    of asArray(
      moduleRecord.exercises
    )
  ) {
    const id =
      normalizeText(
        exercise?.id
      );

    if (!id) {
      continue;
    }

    if (
      seenExerciseIds.has(
        id
      )
    ) {
      DUPLICATE_EXERCISE_IDS.push({
        exerciseId:
          id,

        moduleId:
          moduleRecord.id,

        existingModuleId:
          EXERCISE_MODULE_BY_EXERCISE_ID
            .get(id)
            ?.id ||
          null
      });

      continue;
    }

    seenExerciseIds.add(
      id
    );

    EXERCISE_MODULE_BY_EXERCISE_ID
      .set(
        id,
        moduleRecord
      );

    EXERCISE_RECORDS.push({
      ...exercise,

      moduleId:
        moduleRecord.id,

      moduleLabel:
        moduleRecord.label
    });
  }
}


const EXERCISES =
  Object.freeze(
    EXERCISE_RECORDS
  );


// =====================================================
// INDEXES
// =====================================================

const EXERCISE_MAP =
  new Map(
    EXERCISES.map(
      exercise => [
        exercise.id,
        exercise
      ]
    )
  );


const EXERCISE_ALIAS_MAP =
  new Map();


function registerAlias(
  alias,
  exerciseId
) {
  const normalized =
    normalizeText(
      alias
    );

  if (!normalized) {
    return;
  }

  if (
    !EXERCISE_ALIAS_MAP
      .has(
        normalized
      )
  ) {
    EXERCISE_ALIAS_MAP
      .set(
        normalized,
        exerciseId
      );
  }

  const slug =
    slugify(
      normalized
    );

  if (
    slug &&
    !EXERCISE_ALIAS_MAP
      .has(
        slug
      )
  ) {
    EXERCISE_ALIAS_MAP
      .set(
        slug,
        exerciseId
      );
  }
}


for (
  const exercise
  of EXERCISES
) {
  const aliases = [
    exercise.id,
    exercise.name,
    slugify(
      exercise.name
    ),
    ...asArray(
      exercise.aliases
    )
  ];

  for (
    const alias
    of aliases
  ) {
    registerAlias(
      alias,
      exercise.id
    );
  }
}


// =====================================================
// BASIC LOOKUPS
// =====================================================

function getExercise(
  idOrName
) {
  const normalized =
    normalizeText(
      idOrName
    );

  if (!normalized) {
    return null;
  }

  if (
    EXERCISE_MAP.has(
      normalized
    )
  ) {
    return EXERCISE_MAP.get(
      normalized
    );
  }

  const resolvedId =
    EXERCISE_ALIAS_MAP.get(
      normalized
    ) ||
    EXERCISE_ALIAS_MAP.get(
      slugify(
        normalized
      )
    );

  if (!resolvedId) {
    return null;
  }

  return EXERCISE_MAP.get(
    resolvedId
  ) || null;
}


function hasExercise(
  idOrName
) {
  return Boolean(
    getExercise(
      idOrName
    )
  );
}


function getExerciseIds() {
  return EXERCISES.map(
    exercise =>
      exercise.id
  );
}


function getExerciseCount() {
  return EXERCISES.length;
}


function getModule(
  moduleId
) {
  return EXERCISE_MODULE_BY_ID
    .get(
      normalizeText(
        moduleId
      )
    ) || null;
}


function getModules() {
  return EXERCISE_MODULES.map(
    moduleRecord => ({
      id:
        moduleRecord.id,

      label:
        moduleRecord.label,

      path:
        moduleRecord.path,

      count:
        asArray(
          moduleRecord.exercises
        ).length
    })
  );
}


function getExerciseModule(
  exerciseId
) {
  const exercise =
    getExercise(
      exerciseId
    );

  if (!exercise) {
    return null;
  }

  const moduleRecord =
    EXERCISE_MODULE_BY_EXERCISE_ID
      .get(
        exercise.id
      );

  if (!moduleRecord) {
    return null;
  }

  return {
    id:
      moduleRecord.id,

    label:
      moduleRecord.label,

    path:
      moduleRecord.path
  };
}


// =====================================================
// FILTERING
// =====================================================

function getExercises({
  module = null,
  category = null,
  bodyPart = null,
  muscle = null,
  primaryMuscle = null,
  secondaryMuscle = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
  goal = null,
  minimumGoalScore = 1,
  substitutionGroup = null,
  laterality = null
} = {}) {
  const normalizedModule =
    normalizeText(
      module
    );

  const normalizedCategory =
    normalizeText(
      category
    );

  const normalizedBodyPart =
    normalizeText(
      bodyPart
    );

  const normalizedMuscle =
    normalizeText(
      muscle
    );

  const normalizedPrimaryMuscle =
    normalizeText(
      primaryMuscle
    );

  const normalizedSecondaryMuscle =
    normalizeText(
      secondaryMuscle
    );

  const normalizedMovement =
    normalizeText(
      movementPattern
    );

  const normalizedType =
    normalizeText(
      exerciseType
    );

  const normalizedEquipment =
    normalizeText(
      equipment
    );

  const normalizedDifficulty =
    normalizeText(
      difficulty
    );

  const normalizedGoal =
    normalizeText(
      goal
    );

  const normalizedSubstitutionGroup =
    normalizeText(
      substitutionGroup
    );

  const normalizedLaterality =
    normalizeText(
      laterality
    );

  const minimumScore =
    Number(
      minimumGoalScore
    ) || 1;


  return EXERCISES.filter(
    exercise => {
      if (
        normalizedModule &&
        normalizeText(
          exercise.moduleId
        ) !==
          normalizedModule
      ) {
        return false;
      }


      if (
        normalizedCategory &&
        normalizeText(
          exercise.category
        ) !==
          normalizedCategory
      ) {
        return false;
      }


      if (
        normalizedBodyPart &&
        !asArray(
          exercise.bodyParts
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


      const primaryMuscles =
        asArray(
          exercise.primaryMuscles
        );

      const secondaryMuscles =
        asArray(
          exercise.secondaryMuscles
        );


      if (
        normalizedMuscle &&
        ![
          ...primaryMuscles,
          ...secondaryMuscles
        ].some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedMuscle
        )
      ) {
        return false;
      }


      if (
        normalizedPrimaryMuscle &&
        !primaryMuscles.some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedPrimaryMuscle
        )
      ) {
        return false;
      }


      if (
        normalizedSecondaryMuscle &&
        !secondaryMuscles.some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedSecondaryMuscle
        )
      ) {
        return false;
      }


      if (
        normalizedMovement &&
        !asArray(
          exercise.movementPatterns
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedMovement
        )
      ) {
        return false;
      }


      if (
        normalizedType &&
        !asArray(
          exercise.exerciseTypes
        ).some(
          item =>
            normalizeText(
              item
            ) ===
              normalizedType
        )
      ) {
        return false;
      }


      if (
        normalizedEquipment &&
        !asArray(
          exercise.equipment
        ).some(
          item =>
            normalizeText(
              item
            ) ===
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
        normalizedGoal
      ) {
        const score =
          Number(
            exercise.goals?.[
              normalizedGoal
            ]
          ) || 0;

        if (
          score <
            minimumScore
        ) {
          return false;
        }
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


      return true;
    }
  );
}


// =====================================================
// SEARCH
// =====================================================

function getSearchableText(
  exercise
) {
  return [
    exercise.id,
    exercise.name,
    exercise.moduleId,
    exercise.moduleLabel,
    exercise.category,
    exercise.difficulty,
    exercise.summary,
    exercise.substitutionGroup,
    exercise.laterality,
    exercise.setup,

    exercise.targetEmphasis
      ?.muscle,

    exercise.targetEmphasis
      ?.region,

    exercise.targetEmphasis
      ?.label,

    ...asArray(
      exercise.aliases
    ),

    ...asArray(
      exercise.exerciseTypes
    ),

    ...asArray(
      exercise.bodyParts
    ),

    ...asArray(
      exercise.primaryMuscles
    ),

    ...asArray(
      exercise.secondaryMuscles
    ),

    ...asArray(
      exercise.movementPatterns
    ),

    ...asArray(
      exercise.equipment
    ),

    ...asArray(
      exercise.substitutions
    ),

    ...Object.keys(
      exercise.goals ||
      {}
    )
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


function searchExercises(
  query,
  {
    limit = null,
    module = null
  } = {}
) {
  const normalized =
    normalizeText(
      query
    );

  const moduleFilter =
    normalizeText(
      module
    );

  let pool =
    moduleFilter
      ? EXERCISES.filter(
          exercise =>
            normalizeText(
              exercise.moduleId
            ) ===
              moduleFilter
        )
      : EXERCISES;


  if (!normalized) {
    return limit
      ? pool.slice(
          0,
          normalizeLimit(
            limit,
            pool.length
          )
        )
      : [
          ...pool
        ];
  }


  const exact =
    getExercise(
      normalized
    );

  const tokens =
    normalized
      .split(/\s+/)
      .filter(Boolean);


  const scored =
    pool
      .map(
        exercise => {
          const searchable =
            getSearchableText(
              exercise
            );

          let score =
            0;

          if (
            exact?.id ===
              exercise.id
          ) {
            score +=
              10000;
          }

          if (
            normalizeText(
              exercise.name
            ) ===
              normalized
          ) {
            score +=
              5000;
          }

          if (
            normalizeText(
              exercise.id
            ) ===
              normalized
          ) {
            score +=
              5000;
          }

          if (
            normalizeText(
              exercise.name
            ).includes(
              normalized
            )
          ) {
            score +=
              1000;
          }

          if (
            searchable.includes(
              normalized
            )
          ) {
            score +=
              500;
          }

          for (
            const token
            of tokens
          ) {
            if (
              searchable.includes(
                token
              )
            ) {
              score +=
                50;
            }

            if (
              normalizeText(
                exercise.name
              ).includes(
                token
              )
            ) {
              score +=
                75;
            }
          }

          return {
            exercise,
            score
          };
        }
      )
      .filter(
        item =>
          item.score > 0
      )
      .sort(
        (a, b) => {
          if (
            b.score !==
              a.score
          ) {
            return (
              b.score -
              a.score
            );
          }

          return a.exercise.name
            .localeCompare(
              b.exercise.name
            );
        }
      )
      .map(
        item =>
          item.exercise
      );


  if (!limit) {
    return scored;
  }

  return scored.slice(
    0,
    normalizeLimit(
      limit,
      scored.length
    )
  );
}


// =====================================================
// RECOMMENDATIONS
// =====================================================

function recommendExercises({
  goal,
  bodyPart = null,
  muscle = null,
  movementPattern = null,
  exerciseType = null,
  equipment = null,
  difficulty = null,
  module = null,
  limit = 12
} = {}) {
  const normalizedGoal =
    normalizeText(
      goal
    );

  if (!normalizedGoal) {
    return [];
  }


  const candidates =
    getExercises({
      module,
      bodyPart,
      muscle,
      movementPattern,
      exerciseType,
      equipment,
      difficulty,
      goal:
        normalizedGoal,
      minimumGoalScore:
        1
    });


  return candidates
    .map(
      exercise => ({
        exercise,

        score:
          Number(
            exercise.goals?.[
              normalizedGoal
            ]
          ) || 0
      })
    )
    .sort(
      (a, b) => {
        if (
          b.score !==
            a.score
        ) {
          return (
            b.score -
              a.score
          );
        }

        return a.exercise.name
          .localeCompare(
            b.exercise.name
          );
      }
    )
    .slice(
      0,
      normalizeLimit(
        limit
      )
    )
    .map(
      item =>
        item.exercise
    );
}


// =====================================================
// SUBSTITUTIONS
// =====================================================

function getSubstitutions(
  exerciseId,
  {
    includeGroupMatches = true,
    limit = 12
  } = {}
) {
  const exercise =
    getExercise(
      exerciseId
    );

  if (!exercise) {
    return [];
  }


  const result =
    new Map();


  for (
    const substitutionId
    of asArray(
      exercise.substitutions
    )
  ) {
    const substitute =
      getExercise(
        substitutionId
      );

    if (
      substitute &&
      substitute.id !==
        exercise.id
    ) {
      result.set(
        substitute.id,
        substitute
      );
    }
  }


  if (
    includeGroupMatches &&
    exercise
      .substitutionGroup
  ) {
    for (
      const groupMatch
      of getExercises({
        substitutionGroup:
          exercise
            .substitutionGroup
      })
    ) {
      if (
        groupMatch.id !==
          exercise.id
      ) {
        result.set(
          groupMatch.id,
          groupMatch
        );
      }
    }
  }


  return Array.from(
    result.values()
  ).slice(
    0,
    normalizeLimit(
      limit
    )
  );
}


// =====================================================
// VALIDATION
// =====================================================

function validateReferences() {
  const invalid = [];
  const warnings = [];


  for (
    const duplicate
    of DUPLICATE_EXERCISE_IDS
  ) {
    invalid.push({
      exerciseId:
        duplicate.exerciseId,

      type:
        "duplicateExerciseId",

      value:
        duplicate.exerciseId,

      moduleId:
        duplicate.moduleId,

      existingModuleId:
        duplicate.existingModuleId
    });
  }


  for (
    const exercise
    of EXERCISES
  ) {
    if (
      !exercise.id
    ) {
      invalid.push({
        exerciseId:
          null,

        type:
          "missingId",

        value:
          null
      });
    }


    if (
      !exercise.name
    ) {
      invalid.push({
        exerciseId:
          exercise.id,

        type:
          "missingName",

        value:
          null
      });
    }


    for (
      const bodyPartId
      of asArray(
        exercise.bodyParts
      )
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
        ...asArray(
          exercise.primaryMuscles
        ),

        ...asArray(
          exercise.secondaryMuscles
        )
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
      of asArray(
        exercise.movementPatterns
      )
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
      of asArray(
        exercise.exerciseTypes
      )
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


    for (
      const substitutionId
      of asArray(
        exercise.substitutions
      )
    ) {
      if (
        !hasExercise(
          substitutionId
        )
      ) {
        warnings.push({
          exerciseId:
            exercise.id,

          type:
            "substitution",

          value:
            substitutionId
        });
      }
    }


    if (
      !exercise.logging ||
      !exercise.logging.type
    ) {
      warnings.push({
        exerciseId:
          exercise.id,

        type:
          "missingLogging",

        value:
          null
      });
    }


    if (
      !asArray(
        exercise.bodyParts
      ).length
    ) {
      warnings.push({
        exerciseId:
          exercise.id,

        type:
          "missingBodyParts",

        value:
          null
      });
    }


    if (
      !asArray(
        exercise.primaryMuscles
      ).length &&
      exercise.category !==
        "cardio"
    ) {
      warnings.push({
        exerciseId:
          exercise.id,

        type:
          "missingPrimaryMuscles",

        value:
          null
      });
    }
  }


  return {
    valid:
      invalid.length === 0,

    exerciseCount:
      EXERCISES.length,

    moduleCount:
      EXERCISE_MODULES.length,

    duplicateCount:
      DUPLICATE_EXERCISE_IDS.length,

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
  const moduleCounts =
    {};

  for (
    const moduleRecord
    of EXERCISE_MODULES
  ) {
    moduleCounts[
      moduleRecord.id
    ] =
      asArray(
        moduleRecord.exercises
      ).length;
  }


  return {
    version:
      VERSION,

    source:
      SOURCE,

    exerciseCount:
      EXERCISES.length,

    moduleCount:
      EXERCISE_MODULES.length,

    moduleCounts,

    duplicateExerciseIds:
      [
        ...DUPLICATE_EXERCISE_IDS
      ],

    validation:
      validateReferences()
  };
}


// =====================================================
// PUBLIC REGISTRY
// =====================================================

const AriTrainingExerciseRegistry =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    all:
      EXERCISES,

    modules:
      EXERCISE_MODULES,

    count:
      getExerciseCount,

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

    ids:
      getExerciseIds,

    getModule,

    getModules,

    getExerciseModule,

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

  Ari.training.exercises =
    AriTrainingExerciseRegistry;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  EXERCISE_MODULES,
  EXERCISES,

  getExercise,
  hasExercise,
  getExercises,
  searchExercises,
  recommendExercises,
  getSubstitutions,

  getExerciseIds,
  getExerciseCount,

  getModule,
  getModules,
  getExerciseModule,

  validateReferences,
  getDiagnostics,

  AriTrainingExerciseRegistry
};

export default
  AriTrainingExerciseRegistry;