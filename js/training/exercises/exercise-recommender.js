// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-recommender.js
// Version: 1.0.0
// Purpose:
//   Exercise recommendation engine for ARI Training.
//
// Architecture:
//
//   exercise-registry.js
//          ↓
//   exercise-search.js
//          ↓
//   exercise-recommender.js
//          ↓
//   workout-builder.js
//          ↓
//   workout-plan-controller.js
//
// Responsibilities:
//   - Recommend exercises by goal.
//   - Respect workout focus/body-part constraints.
//   - Respect muscle, movement, type, module, and category filters.
//   - Respect available/preferred/excluded equipment.
//   - Respect preferred/excluded exercises.
//   - Support difficulty and sport-aware ranking.
//   - Support query-based recommendations.
//   - Return deterministic scored recommendations.
//   - Never mutate ExerciseRegistry records.
// =====================================================

import ExerciseRegistry
  from "./exercise-registry.js";

import ExerciseSearch
  from "./exercise-search.js";


const VERSION =
  "1.0.0";

const SOURCE =
  "js/training/exercises/exercise-recommender";


// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_LIMIT =
  12;


const DEFAULT_GOAL =
  "general_fitness";


const DIFFICULTY_ORDER =
  Object.freeze({
    beginner:
      1,

    easy:
      1,

    novice:
      1,

    intermediate:
      2,

    moderate:
      2,

    advanced:
      3,

    hard:
      3,

    expert:
      4
  });


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

  return String(
    value
  )
    .trim()
    .toLowerCase();
}


function normalizeId(
  value
) {
  const text =
    normalizeText(
      value
    );

  return text ||
    null;
}


function normalizeArray(
  value
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [
      normalizeText(
        value
      )
    ]
      .filter(Boolean);
  }

  return value
    .map(
      normalizeText
    )
    .filter(Boolean);
}


function normalizeUniqueArray(
  value
) {
  return [
    ...new Set(
      normalizeArray(
        value
      )
    )
  ];
}


function normalizeLimit(
  value,
  fallback =
    DEFAULT_LIMIT
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


function normalizeBoolean(
  value,
  fallback =
    false
) {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;
}


function normalizeDifficulty(
  value
) {
  const normalized =
    normalizeText(
      value
    );

  return normalized ||
    null;
}


function clone(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof structuredClone ===
      "function"
  ) {
    try {
      return structuredClone(
        value
      );
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


// =====================================================
// ARRAY HELPERS
// =====================================================

function intersects(
  left,
  right
) {
  const leftValues =
    normalizeUniqueArray(
      left
    );

  const rightValues =
    normalizeUniqueArray(
      right
    );

  if (
    leftValues.length ===
      0 ||
    rightValues.length ===
      0
  ) {
    return false;
  }

  const rightSet =
    new Set(
      rightValues
    );

  return leftValues.some(
    value =>
      rightSet.has(
        value
      )
  );
}


function includesAny(
  source,
  targets
) {
  return intersects(
    source,
    targets
  );
}


function includesAll(
  source,
  targets
) {
  const sourceSet =
    new Set(
      normalizeUniqueArray(
        source
      )
    );

  const targetValues =
    normalizeUniqueArray(
      targets
    );

  if (
    targetValues.length ===
      0
  ) {
    return true;
  }

  return targetValues.every(
    target =>
      sourceSet.has(
        target
      )
  );
}


// =====================================================
// EXERCISE FIELD HELPERS
// =====================================================

function getExerciseMuscles(
  exercise
) {
  return normalizeUniqueArray([
    ...(
      Array.isArray(
        exercise?.primaryMuscles
      )
        ? exercise.primaryMuscles
        : []
    ),

    ...(
      Array.isArray(
        exercise?.secondaryMuscles
      )
        ? exercise.secondaryMuscles
        : []
    )
  ]);
}


function getExerciseBodyParts(
  exercise
) {
  return normalizeUniqueArray(
    exercise?.bodyParts
  );
}


function getExerciseMovementPatterns(
  exercise
) {
  return normalizeUniqueArray(
    exercise?.movementPatterns
  );
}


function getExerciseTypes(
  exercise
) {
  return normalizeUniqueArray(
    exercise?.exerciseTypes
  );
}


function getExerciseEquipment(
  exercise
) {
  return normalizeUniqueArray(
    exercise?.equipment
  );
}


function getExerciseGoals(
  exercise
) {
  return (
    exercise?.goals &&
    typeof exercise.goals ===
      "object"
  )
    ? exercise.goals
    : {};
}


function getGoalScore(
  exercise,
  goal
) {
  const normalizedGoal =
    normalizeText(
      goal
    );

  if (!normalizedGoal) {
    return 0;
  }

  return Math.max(
    0,
    Number(
      getExerciseGoals(
        exercise
      )[
        normalizedGoal
      ]
    ) ||
    0
  );
}


function getDifficultyRank(
  value
) {
  return (
    DIFFICULTY_ORDER[
      normalizeText(
        value
      )
    ] ||
    null
  );
}


function isBodyweightExercise(
  exercise
) {
  const equipment =
    getExerciseEquipment(
      exercise
    );

  if (
    equipment.length ===
      0
  ) {
    return true;
  }

  return equipment.some(
    item =>
      [
        "bodyweight",
        "body_weight",
        "none",
        "no_equipment"
      ].includes(
        item
      )
  );
}


// =====================================================
// FILTER MATCHING
// =====================================================

function matchesSimpleFilters(
  exercise,
  options
) {
  const bodyParts =
    normalizeUniqueArray(
      options.bodyParts
    );

  const muscles =
    normalizeUniqueArray(
      options.muscles
    );

  const movementPatterns =
    normalizeUniqueArray(
      options.movementPatterns
    );

  const exerciseTypes =
    normalizeUniqueArray(
      options.exerciseTypes
    );

  const modules =
    normalizeUniqueArray(
      options.modules
    );

  const categories =
    normalizeUniqueArray(
      options.categories
    );

  if (
    bodyParts.length &&
    !includesAny(
      getExerciseBodyParts(
        exercise
      ),
      bodyParts
    )
  ) {
    return false;
  }


  if (
    muscles.length &&
    !includesAny(
      getExerciseMuscles(
        exercise
      ),
      muscles
    )
  ) {
    return false;
  }


  if (
    movementPatterns.length &&
    !includesAny(
      getExerciseMovementPatterns(
        exercise
      ),
      movementPatterns
    )
  ) {
    return false;
  }


  if (
    exerciseTypes.length &&
    !includesAny(
      getExerciseTypes(
        exercise
      ),
      exerciseTypes
    )
  ) {
    return false;
  }


  if (
    modules.length &&
    !modules.includes(
      normalizeText(
        exercise?.moduleId
      )
    )
  ) {
    return false;
  }


  if (
    categories.length &&
    !categories.includes(
      normalizeText(
        exercise?.category
      )
    )
  ) {
    return false;
  }


  return true;
}


function matchesDifficulty(
  exercise,
  {
    difficulty =
      null,

    allowHarder =
      false
  } = {}
) {
  const requested =
    normalizeDifficulty(
      difficulty
    );

  if (!requested) {
    return true;
  }

  const requestedRank =
    getDifficultyRank(
      requested
    );

  const exerciseRank =
    getDifficultyRank(
      exercise?.difficulty
    );

  if (
    !requestedRank ||
    !exerciseRank
  ) {
    return (
      normalizeText(
        exercise?.difficulty
      ) ===
      requested
    );
  }

  if (
    allowHarder
  ) {
    return true;
  }

  return (
    exerciseRank <=
    requestedRank
  );
}


function matchesEquipment(
  exercise,
  {
    availableEquipment =
      [],

    excludedEquipment =
      [],

    strictEquipment =
      false,

    includeBodyweight =
      true
  } = {}
) {
  const exerciseEquipment =
    getExerciseEquipment(
      exercise
    );

  const available =
    normalizeUniqueArray(
      availableEquipment
    );

  const excluded =
    normalizeUniqueArray(
      excludedEquipment
    );

  if (
    excluded.length &&
    includesAny(
      exerciseEquipment,
      excluded
    )
  ) {
    return false;
  }


  if (
    isBodyweightExercise(
      exercise
    )
  ) {
    return Boolean(
      includeBodyweight
    );
  }


  if (
    available.length ===
      0
  ) {
    return true;
  }


  if (
    strictEquipment
  ) {
    return includesAll(
      available,
      exerciseEquipment
    );
  }


  return includesAny(
    exerciseEquipment,
    available
  );
}


function matchesExcludedExercise(
  exercise,
  excludedExercises
) {
  const excluded =
    new Set(
      normalizeUniqueArray(
        excludedExercises
      )
    );

  if (
    excluded.size ===
      0
  ) {
    return false;
  }

  const values = [
    normalizeText(
      exercise?.id
    ),

    normalizeText(
      exercise?.name
    ),

    ...normalizeUniqueArray(
      exercise?.aliases
    )
  ];

  return values.some(
    value =>
      excluded.has(
        value
      )
  );
}


// =====================================================
// SPORT MATCHING
// =====================================================

function getSportScore(
  exercise,
  sport
) {
  const normalizedSport =
    normalizeText(
      sport
    );

  if (!normalizedSport) {
    return 0;
  }

  let score =
    0;

  const searchable =
    [
      exercise?.id,
      exercise?.name,
      exercise?.moduleId,
      exercise?.category,
      exercise?.summary,
      exercise?.sport,
      exercise?.specialization,
      ...(
        Array.isArray(
          exercise?.sports
        )
          ? exercise.sports
          : []
      ),
      ...(
        Array.isArray(
          exercise?.aliases
        )
          ? exercise.aliases
          : []
      )
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


  if (
    normalizeText(
      exercise?.sport
    ) ===
      normalizedSport
  ) {
    score +=
      250;
  }


  if (
    normalizeUniqueArray(
      exercise?.sports
    ).includes(
      normalizedSport
    )
  ) {
    score +=
      220;
  }


  if (
    normalizeText(
      exercise?.moduleId
    ) ===
      normalizedSport
  ) {
    score +=
      180;
  }


  if (
    searchable.includes(
      normalizedSport
    )
  ) {
    score +=
      90;
  }


  return score;
}


// =====================================================
// SPECIALIZATION MATCHING
// =====================================================

function getSpecializationScore(
  exercise,
  specialization
) {
  const normalized =
    normalizeText(
      specialization
    );

  if (!normalized) {
    return 0;
  }

  let score =
    0;

  const searchable =
    [
      exercise?.id,
      exercise?.name,
      exercise?.category,
      exercise?.specialization,
      exercise?.summary,
      ...(
        Array.isArray(
          exercise?.aliases
        )
          ? exercise.aliases
          : []
      ),
      ...(
        Array.isArray(
          exercise?.exerciseTypes
        )
          ? exercise.exerciseTypes
          : []
      )
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


  if (
    normalizeText(
      exercise?.specialization
    ) ===
      normalized
  ) {
    score +=
      200;
  }


  if (
    searchable.includes(
      normalized
    )
  ) {
    score +=
      80;
  }


  return score;
}


// =====================================================
// SCORING
// =====================================================

function scoreExercise(
  exercise,
  options
) {
  const goal =
    normalizeText(
      options.goal
    ) ||
    DEFAULT_GOAL;

  const secondaryGoals =
    normalizeUniqueArray(
      options.secondaryGoals
    );

  const preferredExercises =
    normalizeUniqueArray(
      options.preferredExercises
    );

  const preferredEquipment =
    normalizeUniqueArray(
      options.preferredEquipment
    );

  const bodyParts =
    normalizeUniqueArray(
      options.bodyParts
    );

  const muscles =
    normalizeUniqueArray(
      options.muscles
    );

  const movementPatterns =
    normalizeUniqueArray(
      options.movementPatterns
    );

  const exerciseTypes =
    normalizeUniqueArray(
      options.exerciseTypes
    );

  let score =
    0;

  const reasons =
    [];


  // ===================================================
  // PRIMARY GOAL
  // ===================================================

  const primaryGoalScore =
    getGoalScore(
      exercise,
      goal
    );

  if (
    primaryGoalScore >
      0
  ) {
    const points =
      primaryGoalScore *
      100;

    score +=
      points;

    reasons.push({
      type:
        "primary_goal",

      value:
        goal,

      points
    });
  }


  // ===================================================
  // SECONDARY GOALS
  // ===================================================

  for (
    const secondaryGoal
    of secondaryGoals
  ) {
    const goalScore =
      getGoalScore(
        exercise,
        secondaryGoal
      );

    if (
      goalScore >
        0
    ) {
      const points =
        goalScore *
        35;

      score +=
        points;

      reasons.push({
        type:
          "secondary_goal",

        value:
          secondaryGoal,

        points
      });
    }
  }


  // ===================================================
  // BODY PART
  // ===================================================

  if (
    bodyParts.length &&
    includesAny(
      getExerciseBodyParts(
        exercise
      ),
      bodyParts
    )
  ) {
    score +=
      150;

    reasons.push({
      type:
        "body_part",

      points:
        150
    });
  }


  // ===================================================
  // MUSCLE
  // ===================================================

  const primaryMuscles =
    normalizeUniqueArray(
      exercise?.primaryMuscles
    );

  const secondaryMuscles =
    normalizeUniqueArray(
      exercise?.secondaryMuscles
    );


  if (
    muscles.length &&
    includesAny(
      primaryMuscles,
      muscles
    )
  ) {
    score +=
      180;

    reasons.push({
      type:
        "primary_muscle",

      points:
        180
    });
  } else if (
    muscles.length &&
    includesAny(
      secondaryMuscles,
      muscles
    )
  ) {
    score +=
      90;

    reasons.push({
      type:
        "secondary_muscle",

      points:
        90
    });
  }


  // ===================================================
  // MOVEMENT
  // ===================================================

  if (
    movementPatterns.length &&
    includesAny(
      getExerciseMovementPatterns(
        exercise
      ),
      movementPatterns
    )
  ) {
    score +=
      120;

    reasons.push({
      type:
        "movement_pattern",

      points:
        120
    });
  }


  // ===================================================
  // EXERCISE TYPE
  // ===================================================

  if (
    exerciseTypes.length &&
    includesAny(
      getExerciseTypes(
        exercise
      ),
      exerciseTypes
    )
  ) {
    score +=
      120;

    reasons.push({
      type:
        "exercise_type",

      points:
        120
    });
  }


  // ===================================================
  // PREFERRED EXERCISE
  // ===================================================

  const exerciseIdentity = [
    normalizeText(
      exercise?.id
    ),

    normalizeText(
      exercise?.name
    ),

    ...normalizeUniqueArray(
      exercise?.aliases
    )
  ];


  if (
    preferredExercises.length &&
    exerciseIdentity.some(
      value =>
        preferredExercises.includes(
          value
        )
    )
  ) {
    score +=
      300;

    reasons.push({
      type:
        "preferred_exercise",

      points:
        300
    });
  }


  // ===================================================
  // PREFERRED EQUIPMENT
  // ===================================================

  if (
    preferredEquipment.length &&
    includesAny(
      getExerciseEquipment(
        exercise
      ),
      preferredEquipment
    )
  ) {
    score +=
      80;

    reasons.push({
      type:
        "preferred_equipment",

      points:
        80
    });
  }


  // ===================================================
  // SPORT
  // ===================================================

  const sportPoints =
    getSportScore(
      exercise,
      options.sport
    );

  if (
    sportPoints >
      0
  ) {
    score +=
      sportPoints;

    reasons.push({
      type:
        "sport",

      value:
        normalizeText(
          options.sport
        ),

      points:
        sportPoints
    });
  }


  // ===================================================
  // SPECIALIZATION
  // ===================================================

  const specializationPoints =
    getSpecializationScore(
      exercise,
      options.specialization
    );

  if (
    specializationPoints >
      0
  ) {
    score +=
      specializationPoints;

    reasons.push({
      type:
        "specialization",

      value:
        normalizeText(
          options.specialization
        ),

      points:
        specializationPoints
    });
  }


  // ===================================================
  // DIFFICULTY
  // ===================================================

  const requestedDifficulty =
    getDifficultyRank(
      options.difficulty
    );

  const exerciseDifficulty =
    getDifficultyRank(
      exercise?.difficulty
    );

  if (
    requestedDifficulty &&
    exerciseDifficulty
  ) {
    const difference =
      Math.abs(
        requestedDifficulty -
        exerciseDifficulty
      );

    const points =
      Math.max(
        0,
        50 -
        difference *
        20
      );

    score +=
      points;

    if (
      points >
        0
    ) {
      reasons.push({
        type:
          "difficulty",

        points
      });
    }
  }


  // ===================================================
  // BODYWEIGHT BONUS
  // ===================================================

  if (
    options.includeBodyweight !==
      false &&
    isBodyweightExercise(
      exercise
    )
  ) {
    score +=
      10;
  }


  return {
    exercise,
    score,
    reasons
  };
}


// =====================================================
// VARIETY
// =====================================================

function applyVariety(
  scored,
  variety
) {
  const normalized =
    normalizeText(
      variety
    );

  if (
    !normalized ||
    normalized ===
      "none"
  ) {
    return scored;
  }


  if (
    normalized ===
      "high"
  ) {
    const seenModules =
      new Map();

    return scored
      .map(
        item => {
          const moduleId =
            normalizeText(
              item.exercise
                ?.moduleId
            ) ||
            "unknown";

          const count =
            seenModules.get(
              moduleId
            ) ||
            0;

          seenModules.set(
            moduleId,
            count + 1
          );

          return {
            ...item,
            score:
              item.score -
              count *
              20
          };
        }
      )
      .sort(
        compareScoredExercises
      );
  }


  return scored;
}


// =====================================================
// SORT
// =====================================================

function compareScoredExercises(
  left,
  right
) {
  if (
    right.score !==
      left.score
  ) {
    return (
      right.score -
      left.score
    );
  }


  const leftGoal =
    getGoalScore(
      left.exercise,
      left.goal ||
      DEFAULT_GOAL
    );

  const rightGoal =
    getGoalScore(
      right.exercise,
      right.goal ||
      DEFAULT_GOAL
    );

  if (
    rightGoal !==
      leftGoal
  ) {
    return (
      rightGoal -
      leftGoal
    );
  }


  return String(
    left.exercise?.name ||
    left.exercise?.id ||
    ""
  )
    .localeCompare(
      String(
        right.exercise?.name ||
        right.exercise?.id ||
        ""
      )
    );
}


// =====================================================
// MAIN RECOMMENDATION ENGINE
// =====================================================

function recommend({
  goal =
    DEFAULT_GOAL,

  secondaryGoals =
    [],

  bodyParts =
    [],

  muscles =
    [],

  movementPatterns =
    [],

  exerciseTypes =
    [],

  modules =
    [],

  categories =
    [],

  availableEquipment =
    [],

  preferredEquipment =
    [],

  excludedEquipment =
    [],

  preferredExercises =
    [],

  excludedExercises =
    [],

  difficulty =
    null,

  sport =
    null,

  specialization =
    null,

  allowHarder =
    false,

  strictEquipment =
    false,

  includeBodyweight =
    true,

  variety =
    "normal",

  limit =
    DEFAULT_LIMIT
} = {}) {
  const options = {
    goal:
      normalizeText(
        goal
      ) ||
      DEFAULT_GOAL,

    secondaryGoals:
      normalizeUniqueArray(
        secondaryGoals
      ),

    bodyParts:
      normalizeUniqueArray(
        bodyParts
      ),

    muscles:
      normalizeUniqueArray(
        muscles
      ),

    movementPatterns:
      normalizeUniqueArray(
        movementPatterns
      ),

    exerciseTypes:
      normalizeUniqueArray(
        exerciseTypes
      ),

    modules:
      normalizeUniqueArray(
        modules
      ),

    categories:
      normalizeUniqueArray(
        categories
      ),

    availableEquipment:
      normalizeUniqueArray(
        availableEquipment
      ),

    preferredEquipment:
      normalizeUniqueArray(
        preferredEquipment
      ),

    excludedEquipment:
      normalizeUniqueArray(
        excludedEquipment
      ),

    preferredExercises:
      normalizeUniqueArray(
        preferredExercises
      ),

    excludedExercises:
      normalizeUniqueArray(
        excludedExercises
      ),

    difficulty:
      normalizeDifficulty(
        difficulty
      ),

    sport:
      normalizeText(
        sport
      ) ||
      null,

    specialization:
      normalizeText(
        specialization
      ) ||
      null,

    allowHarder:
      normalizeBoolean(
        allowHarder,
        false
      ),

    strictEquipment:
      normalizeBoolean(
        strictEquipment,
        false
      ),

    includeBodyweight:
      includeBodyweight !==
        false,

    variety:
      normalizeText(
        variety
      ) ||
      "normal",

    limit:
      normalizeLimit(
        limit
      )
  };


  const allExercises =
    Array.isArray(
      ExerciseRegistry.all
    )
      ? ExerciseRegistry.all
      : [];


  let candidates =
    allExercises.filter(
      exercise => {
        if (!exercise?.id) {
          return false;
        }


        if (
          matchesExcludedExercise(
            exercise,
            options
              .excludedExercises
          )
        ) {
          return false;
        }


        if (
          !matchesSimpleFilters(
            exercise,
            options
          )
        ) {
          return false;
        }


        if (
          !matchesDifficulty(
            exercise,
            options
          )
        ) {
          return false;
        }


        if (
          !matchesEquipment(
            exercise,
            options
          )
        ) {
          return false;
        }


        return true;
      }
    );


  /*
   * If the goal exists in the exercise database, favor exercises
   * explicitly mapped to it.
   *
   * If no exercise carries that goal key, do NOT return an empty
   * recommendation list. This keeps general/custom workouts usable
   * while the database continues expanding.
   */

  const candidatesWithGoal =
    candidates.filter(
      exercise =>
        getGoalScore(
          exercise,
          options.goal
        ) >
        0
    );


  if (
    candidatesWithGoal.length >
      0
  ) {
    candidates =
      candidatesWithGoal;
  }


  let scored =
    candidates
      .map(
        exercise => ({
          ...scoreExercise(
            exercise,
            options
          ),

          goal:
            options.goal
        })
      )
      .sort(
        compareScoredExercises
      );


  scored =
    applyVariety(
      scored,
      options.variety
    );


  const limited =
    scored.slice(
      0,
      options.limit
    );


  return {
    goal:
      options.goal,

    secondaryGoals:
      [
        ...options
          .secondaryGoals
      ],

    totalCandidates:
      candidates.length,

    resultCount:
      limited.length,

    results:
      limited.map(
        item =>
          item.exercise
      ),

    scoredResults:
      limited.map(
        item => ({
          exercise:
            item.exercise,

          score:
            item.score,

          reasons:
            clone(
              item.reasons
            )
        })
      ),

    filters: {
      bodyParts:
        [
          ...options.bodyParts
        ],

      muscles:
        [
          ...options.muscles
        ],

      movementPatterns:
        [
          ...options
            .movementPatterns
        ],

      exerciseTypes:
        [
          ...options
            .exerciseTypes
        ],

      modules:
        [
          ...options.modules
        ],

      categories:
        [
          ...options.categories
        ],

      availableEquipment:
        [
          ...options
            .availableEquipment
        ],

      preferredEquipment:
        [
          ...options
            .preferredEquipment
        ],

      excludedEquipment:
        [
          ...options
            .excludedEquipment
        ],

      difficulty:
        options.difficulty,

      sport:
        options.sport,

      specialization:
        options.specialization
    }
  };
}


// =====================================================
// QUERY RECOMMENDATIONS
// =====================================================

function recommendFromQuery(
  query,
  options =
    {}
) {
  const normalizedQuery =
    normalizeText(
      query
    );

  if (!normalizedQuery) {
    return recommend(
      options
    );
  }


  let searchResults =
    [];


  try {
    if (
      typeof ExerciseSearch
        ?.search ===
        "function"
    ) {
      searchResults =
        ExerciseSearch.search(
          normalizedQuery,
          {
            limit:
              Math.max(
                normalizeLimit(
                  options.limit
                ) *
                4,
                30
              )
          }
        ) ||
        [];
    }
  } catch (
    error
  ) {
    console.warn(
      "[ARI Training] ExerciseSearch failed during recommendation query.",
      error
    );
  }


  if (
    !Array.isArray(
      searchResults
    ) ||
    searchResults.length ===
      0
  ) {
    try {
      searchResults =
        ExerciseRegistry.search(
          normalizedQuery,
          {
            limit:
              Math.max(
                normalizeLimit(
                  options.limit
                ) *
                4,
                30
              )
          }
        ) ||
        [];
    } catch {
      searchResults =
        [];
    }
  }


  const searchIds =
    new Set(
      searchResults
        .map(
          exercise =>
            normalizeId(
              exercise?.id
            )
        )
        .filter(Boolean)
    );


  const recommendation =
    recommend({
      ...options,

      limit:
        Math.max(
          normalizeLimit(
            options.limit
          ) *
          4,
          30
        )
    });


  let scored =
    recommendation
      .scoredResults
      .filter(
        item =>
          searchIds.has(
            normalizeId(
              item.exercise?.id
            )
          )
      )
      .map(
        item => {
          const searchIndex =
            searchResults.findIndex(
              exercise =>
                normalizeId(
                  exercise?.id
                ) ===
                normalizeId(
                  item.exercise?.id
                )
            );

          const queryBonus =
            searchIndex >=
              0
              ? Math.max(
                  0,
                  250 -
                  searchIndex *
                  5
                )
              : 0;

          return {
            ...item,

            score:
              item.score +
              queryBonus,

            reasons: [
              ...(
                Array.isArray(
                  item.reasons
                )
                  ? item.reasons
                  : []
              ),

              {
                type:
                  "query_match",

                value:
                  normalizedQuery,

                points:
                  queryBonus
              }
            ]
          };
        }
      )
      .sort(
        compareScoredExercises
      );


  /*
   * A text query can be more restrictive than recommendation
   * metadata. If no intersection exists, return the exercise
   * search results themselves rather than making the UI appear
   * broken.
   */
  if (
    scored.length ===
      0
  ) {
    scored =
      searchResults
        .filter(
          exercise =>
            !matchesExcludedExercise(
              exercise,
              options
                .excludedExercises
            )
        )
        .slice(
          0,
          normalizeLimit(
            options.limit
          )
        )
        .map(
          (
            exercise,
            index
          ) => ({
            exercise,

            score:
              Math.max(
                1,
                250 -
                index *
                5
              ),

            reasons: [
              {
                type:
                  "query_match",

                value:
                  normalizedQuery,

                points:
                  Math.max(
                    1,
                    250 -
                    index *
                    5
                  )
              }
            ]
          })
        );
  }


  const limited =
    scored.slice(
      0,
      normalizeLimit(
        options.limit
      )
    );


  return {
    ...recommendation,

    query:
      normalizedQuery,

    resultCount:
      limited.length,

    results:
      limited.map(
        item =>
          item.exercise
      ),

    scoredResults:
      limited
  };
}


// =====================================================
// CONVENIENCE METHODS
// =====================================================

function recommendForGoal(
  goal,
  options =
    {}
) {
  return recommend({
    ...options,
    goal
  });
}


function recommendForBodyPart(
  bodyPart,
  options =
    {}
) {
  return recommend({
    ...options,

    bodyParts: [
      bodyPart
    ]
  });
}


function recommendForMuscle(
  muscle,
  options =
    {}
) {
  return recommend({
    ...options,

    muscles: [
      muscle
    ]
  });
}


function recommendForMovement(
  movementPattern,
  options =
    {}
) {
  return recommend({
    ...options,

    movementPatterns: [
      movementPattern
    ]
  });
}


function recommendForType(
  exerciseType,
  options =
    {}
) {
  return recommend({
    ...options,

    exerciseTypes: [
      exerciseType
    ]
  });
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function diagnostics() {
  let searchDiagnostics =
    null;


  try {
    searchDiagnostics =
      ExerciseSearch
        ?.diagnostics?.() ||
      null;
  } catch {
    searchDiagnostics =
      null;
  }


  return {
    source:
      SOURCE,

    version:
      VERSION,

    ready:
      Boolean(
        ExerciseRegistry &&
        Array.isArray(
          ExerciseRegistry.all
        )
      ),

    exerciseCount:
      ExerciseRegistry
        ?.all
        ?.length ||
      0,

    registryVersion:
      ExerciseRegistry
        ?.version ||
      null,

    searchVersion:
      ExerciseSearch
        ?.version ||
      null,

    search:
      searchDiagnostics,

    methods: {
      recommend:
        typeof recommend ===
          "function",

      recommendFromQuery:
        typeof recommendFromQuery ===
          "function",

      recommendForGoal:
        typeof recommendForGoal ===
          "function",

      recommendForBodyPart:
        typeof recommendForBodyPart ===
          "function",

      recommendForMuscle:
        typeof recommendForMuscle ===
          "function",

      recommendForMovement:
        typeof recommendForMovement ===
          "function",

      recommendForType:
        typeof recommendForType ===
          "function"
    }
  };
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingExerciseRecommender =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    recommend,

    recommendFromQuery,

    recommendForGoal,

    recommendForBodyPart,

    recommendForMuscle,

    recommendForMovement,

    recommendForType,

    diagnostics
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
    .exerciseRecommender =
      AriTrainingExerciseRecommender;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  recommend,
  recommendFromQuery,

  recommendForGoal,
  recommendForBodyPart,
  recommendForMuscle,
  recommendForMovement,
  recommendForType,

  diagnostics,

  AriTrainingExerciseRecommender
};


export default
  AriTrainingExerciseRecommender;