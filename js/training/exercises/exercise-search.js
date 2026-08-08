// =====================================================
// ARI REBIRTH
// File: js/training/exercises/exercise-search.js
// Version: 1.0.0
// Purpose:
//   Fast, user-friendly search and discovery layer for the
//   ARI Training exercise library.
//
// Architecture:
//   individual exercise modules
//            ↓
//   exercise-registry.js
//            ↓
//   exercise-search.js
//            ↓
//   workout builder / plan editor / quick workout / Ari UI
//
// Search capabilities:
//   - Exact ID / name / alias matching
//   - Partial text matching
//   - Token matching
//   - Typo-tolerant fuzzy matching
//   - Muscle / body-part search
//   - Equipment search
//   - Goal search
//   - Exercise-type search
//   - Movement-pattern search
//   - Module/category filtering
//   - Difficulty filtering
//   - Sports / surfing discovery
//   - Substitution discovery
//   - Search suggestions
//   - Grouped browse results
//
// Design goals:
//   - Keep exercise data inside exercise-registry.js.
//   - This file does not duplicate exercise records.
//   - Search results include scoring metadata without
//     mutating registry exercises.
// =====================================================

import ExerciseRegistry
  from "./exercise-registry.js";

import BodyParts
  from "../anatomy/body-parts.js";

import Muscles
  from "../anatomy/muscles.js";

import MovementPatterns
  from "../movements/movement-patterns.js";

import ExerciseTypes
  from "../movements/exercise-types.js";


const VERSION =
  "1.0.0";

const SOURCE =
  "js/training/exercises/exercise-search";


// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_LIMIT =
  24;

const MAX_LIMIT =
  100;

const MIN_FUZZY_QUERY_LENGTH =
  3;

const DEFAULT_FUZZY_THRESHOLD =
  0.62;


const SEARCH_WEIGHTS =
  Object.freeze({
    exactId:
      12000,

    exactName:
      11000,

    exactAlias:
      10000,

    startsWithName:
      7000,

    startsWithAlias:
      6500,

    containsName:
      5000,

    containsAlias:
      4500,

    exactModule:
      3000,

    exactCategory:
      3000,

    exactBodyPart:
      3500,

    exactPrimaryMuscle:
      4000,

    exactSecondaryMuscle:
      3000,

    exactMovement:
      3200,

    exactType:
      3000,

    exactEquipment:
      2800,

    exactGoal:
      3000,

    tokenName:
      900,

    tokenAlias:
      800,

    tokenMetadata:
      450,

    fuzzyName:
      2200,

    fuzzyAlias:
      1900,

    goalScoreMultiplier:
      80
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
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[’']/g,
      ""
    )
    .trim()
    .toLowerCase();
}


function normalizeKey(
  value
) {
  return normalizeText(
    value
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


function unique(
  values
) {
  return [
    ...new Set(
      values
        .filter(
          value =>
            value !==
              null &&
            value !==
              undefined &&
            value !==
              ""
        )
    )
  ];
}


function clampLimit(
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
    )
  ) {
    return fallback;
  }

  return Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      Math.floor(
        number
      )
    )
  );
}


function tokenize(
  value
) {
  return unique(
    normalizeText(
      value
    )
      .split(
        /[^a-z0-9]+/
      )
      .filter(
        token =>
          token.length > 0
      )
  );
}


// =====================================================
// INDEX BUILDING
// =====================================================

function buildExerciseSearchRecord(
  exercise
) {
  const aliases =
    unique([
      exercise.name,
      exercise.id,
      ...asArray(
        exercise.aliases
      )
    ]);


  const goalIds =
    Object.keys(
      exercise.goals ||
      {}
    );


  const normalizedAliases =
    aliases.map(
      alias =>
        normalizeText(
          alias
        )
    );


  const bodyParts =
    asArray(
      exercise.bodyParts
    );

  const primaryMuscles =
    asArray(
      exercise.primaryMuscles
    );

  const secondaryMuscles =
    asArray(
      exercise.secondaryMuscles
    );

  const movementPatterns =
    asArray(
      exercise.movementPatterns
    );

  const exerciseTypes =
    asArray(
      exercise.exerciseTypes
    );

  const equipment =
    asArray(
      exercise.equipment
    );


  const searchablePieces = [
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

    ...aliases,
    ...bodyParts,
    ...primaryMuscles,
    ...secondaryMuscles,
    ...movementPatterns,
    ...exerciseTypes,
    ...equipment,
    ...goalIds
  ];


  const searchableText =
    normalizeText(
      searchablePieces
        .filter(Boolean)
        .join(" ")
    );


  return Object.freeze({
    exercise,

    id:
      exercise.id,

    normalizedId:
      normalizeText(
        exercise.id
      ),

    normalizedName:
      normalizeText(
        exercise.name
      ),

    aliases,

    normalizedAliases,

    moduleId:
      normalizeText(
        exercise.moduleId
      ),

    category:
      normalizeText(
        exercise.category
      ),

    difficulty:
      normalizeText(
        exercise.difficulty
      ),

    bodyParts:
      bodyParts.map(
        normalizeText
      ),

    primaryMuscles:
      primaryMuscles.map(
        normalizeText
      ),

    secondaryMuscles:
      secondaryMuscles.map(
        normalizeText
      ),

    movementPatterns:
      movementPatterns.map(
        normalizeText
      ),

    exerciseTypes:
      exerciseTypes.map(
        normalizeText
      ),

    equipment:
      equipment.map(
        normalizeText
      ),

    goalIds:
      goalIds.map(
        normalizeText
      ),

    tokens:
      tokenize(
        searchableText
      ),

    searchableText
  });
}


const SEARCH_RECORDS =
  Object.freeze(
    asArray(
      ExerciseRegistry.all
    ).map(
      buildExerciseSearchRecord
    )
  );


const SEARCH_RECORD_MAP =
  new Map(
    SEARCH_RECORDS.map(
      record => [
        record.id,
        record
      ]
    )
  );


// =====================================================
// TERM RESOLUTION
// =====================================================

function resolveBodyPart(
  value
) {
  const normalized =
    normalizeText(
      value
    );

  if (!normalized) {
    return null;
  }

  const bodyPart =
    BodyParts.get?.(
      normalized
    );

  return bodyPart?.id ||
    normalizeKey(
      normalized
    );
}


function resolveMuscle(
  value
) {
  const normalized =
    normalizeText(
      value
    );

  if (!normalized) {
    return null;
  }

  const muscle =
    Muscles.get?.(
      normalized
    );

  return muscle?.id ||
    normalizeKey(
      normalized
    );
}


function resolveMovementPattern(
  value
) {
  const normalized =
    normalizeText(
      value
    );

  if (!normalized) {
    return null;
  }

  const movement =
    MovementPatterns.get?.(
      normalized
    );

  return movement?.id ||
    normalizeKey(
      normalized
    );
}


function resolveExerciseType(
  value
) {
  const normalized =
    normalizeText(
      value
    );

  if (!normalized) {
    return null;
  }

  const type =
    ExerciseTypes.get?.(
      normalized
    );

  return type?.id ||
    normalizeKey(
      normalized
    );
}


// =====================================================
// FILTER NORMALIZATION
// =====================================================

function normalizeFilters(
  filters =
    {}
) {
  return {
    module:
      normalizeText(
        filters.module
      ),

    category:
      normalizeText(
        filters.category
      ),

    bodyPart:
      resolveBodyPart(
        filters.bodyPart
      ),

    muscle:
      resolveMuscle(
        filters.muscle
      ),

    primaryMuscle:
      resolveMuscle(
        filters.primaryMuscle
      ),

    secondaryMuscle:
      resolveMuscle(
        filters.secondaryMuscle
      ),

    movementPattern:
      resolveMovementPattern(
        filters.movementPattern
      ),

    exerciseType:
      resolveExerciseType(
        filters.exerciseType
      ),

    equipment:
      normalizeKey(
        filters.equipment
      ),

    difficulty:
      normalizeText(
        filters.difficulty
      ),

    goal:
      normalizeKey(
        filters.goal
      ),

    minimumGoalScore:
      Number(
        filters.minimumGoalScore
      ) || 0,

    substitutionGroup:
      normalizeKey(
        filters.substitutionGroup
      ),

    laterality:
      normalizeText(
        filters.laterality
      ),

    includeModules:
      asArray(
        filters.includeModules
      )
        .map(
          normalizeText
        )
        .filter(Boolean),

    excludeModules:
      asArray(
        filters.excludeModules
      )
        .map(
          normalizeText
        )
        .filter(Boolean),

    includeEquipment:
      asArray(
        filters.includeEquipment
      )
        .map(
          normalizeKey
        )
        .filter(Boolean),

    excludeEquipment:
      asArray(
        filters.excludeEquipment
      )
        .map(
          normalizeKey
        )
        .filter(Boolean)
  };
}


// =====================================================
// FILTER MATCHING
// =====================================================

function recordMatchesFilters(
  record,
  filters
) {
  if (
    filters.module &&
    record.moduleId !==
      filters.module
  ) {
    return false;
  }


  if (
    filters.category &&
    record.category !==
      filters.category
  ) {
    return false;
  }


  if (
    filters.bodyPart &&
    !record.bodyParts.includes(
      filters.bodyPart
    )
  ) {
    return false;
  }


  if (
    filters.muscle &&
    ![
      ...record.primaryMuscles,
      ...record.secondaryMuscles
    ].includes(
      filters.muscle
    )
  ) {
    return false;
  }


  if (
    filters.primaryMuscle &&
    !record.primaryMuscles.includes(
      filters.primaryMuscle
    )
  ) {
    return false;
  }


  if (
    filters.secondaryMuscle &&
    !record.secondaryMuscles.includes(
      filters.secondaryMuscle
    )
  ) {
    return false;
  }


  if (
    filters.movementPattern &&
    !record.movementPatterns.includes(
      filters.movementPattern
    )
  ) {
    return false;
  }


  if (
    filters.exerciseType &&
    !record.exerciseTypes.includes(
      filters.exerciseType
    )
  ) {
    return false;
  }


  if (
    filters.equipment &&
    !record.equipment.includes(
      filters.equipment
    )
  ) {
    return false;
  }


  if (
    filters.difficulty &&
    record.difficulty !==
      filters.difficulty
  ) {
    return false;
  }


  if (
    filters.goal
  ) {
    const goalScore =
      Number(
        record.exercise
          .goals?.[
            filters.goal
          ]
      ) || 0;

    if (
      goalScore <
        filters.minimumGoalScore
    ) {
      return false;
    }
  }


  if (
    filters.substitutionGroup &&
    normalizeKey(
      record.exercise
        .substitutionGroup
    ) !==
      filters.substitutionGroup
  ) {
    return false;
  }


  if (
    filters.laterality &&
    normalizeText(
      record.exercise
        .laterality
    ) !==
      filters.laterality
  ) {
    return false;
  }


  if (
    filters.includeModules
      .length &&
    !filters.includeModules
      .includes(
        record.moduleId
      )
  ) {
    return false;
  }


  if (
    filters.excludeModules
      .includes(
        record.moduleId
      )
  ) {
    return false;
  }


  if (
    filters.includeEquipment
      .length &&
    !filters.includeEquipment
      .some(
        equipment =>
          record.equipment
            .includes(
              equipment
            )
      )
  ) {
    return false;
  }


  if (
    filters.excludeEquipment
      .some(
        equipment =>
          record.equipment
            .includes(
              equipment
            )
      )
  ) {
    return false;
  }


  return true;
}


// =====================================================
// STRING SIMILARITY
// =====================================================

function levenshteinDistance(
  a,
  b
) {
  const first =
    normalizeText(
      a
    );

  const second =
    normalizeText(
      b
    );


  if (
    first === second
  ) {
    return 0;
  }


  if (!first) {
    return second.length;
  }


  if (!second) {
    return first.length;
  }


  const previous =
    new Array(
      second.length + 1
    );

  const current =
    new Array(
      second.length + 1
    );


  for (
    let column = 0;
    column <=
      second.length;
    column += 1
  ) {
    previous[
      column
    ] =
      column;
  }


  for (
    let row = 1;
    row <=
      first.length;
    row += 1
  ) {
    current[0] =
      row;


    for (
      let column = 1;
      column <=
        second.length;
      column += 1
    ) {
      const substitutionCost =
        first[
          row - 1
        ] ===
          second[
            column - 1
          ]
          ? 0
          : 1;


      current[
        column
      ] =
        Math.min(
          current[
            column - 1
          ] + 1,

          previous[
            column
          ] + 1,

          previous[
            column - 1
          ] +
            substitutionCost
        );
    }


    for (
      let column = 0;
      column <=
        second.length;
      column += 1
    ) {
      previous[
        column
      ] =
        current[
          column
        ];
    }
  }


  return previous[
    second.length
  ];
}


function similarityScore(
  a,
  b
) {
  const first =
    normalizeText(
      a
    );

  const second =
    normalizeText(
      b
    );


  if (
    !first ||
    !second
  ) {
    return 0;
  }


  if (
    first ===
      second
  ) {
    return 1;
  }


  const maxLength =
    Math.max(
      first.length,
      second.length
    );


  if (
    maxLength === 0
  ) {
    return 1;
  }


  const distance =
    levenshteinDistance(
      first,
      second
    );


  return Math.max(
    0,
    1 -
      distance /
        maxLength
  );
}


// =====================================================
// SEARCH SCORING
// =====================================================

function scoreRecord(
  record,
  query,
  options
) {
  const normalizedQuery =
    normalizeText(
      query
    );

  const queryKey =
    normalizeKey(
      query
    );

  const queryTokens =
    tokenize(
      query
    );

  let score =
    0;

  const reasons = [];


  if (
    record.normalizedId ===
      normalizedQuery ||
    record.normalizedId ===
      queryKey
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactId;

    reasons.push(
      "exact_id"
    );
  }


  if (
    record.normalizedName ===
      normalizedQuery
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactName;

    reasons.push(
      "exact_name"
    );
  }


  if (
    record.normalizedAliases
      .includes(
        normalizedQuery
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactAlias;

    reasons.push(
      "exact_alias"
    );
  }


  if (
    record.normalizedName
      .startsWith(
        normalizedQuery
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .startsWithName;

    reasons.push(
      "name_starts_with_query"
    );
  }


  if (
    record.normalizedAliases
      .some(
        alias =>
          alias.startsWith(
            normalizedQuery
          )
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .startsWithAlias;

    reasons.push(
      "alias_starts_with_query"
    );
  }


  if (
    record.normalizedName
      .includes(
        normalizedQuery
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .containsName;

    reasons.push(
      "name_contains_query"
    );
  }


  if (
    record.normalizedAliases
      .some(
        alias =>
          alias.includes(
            normalizedQuery
          )
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .containsAlias;

    reasons.push(
      "alias_contains_query"
    );
  }


  if (
    record.moduleId ===
      normalizedQuery
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactModule;

    reasons.push(
      "module_match"
    );
  }


  if (
    record.category ===
      normalizedQuery
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactCategory;

    reasons.push(
      "category_match"
    );
  }


  if (
    record.bodyParts
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactBodyPart;

    reasons.push(
      "body_part_match"
    );
  }


  if (
    record.primaryMuscles
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactPrimaryMuscle;

    reasons.push(
      "primary_muscle_match"
    );
  }


  if (
    record.secondaryMuscles
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactSecondaryMuscle;

    reasons.push(
      "secondary_muscle_match"
    );
  }


  if (
    record.movementPatterns
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactMovement;

    reasons.push(
      "movement_match"
    );
  }


  if (
    record.exerciseTypes
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactType;

    reasons.push(
      "exercise_type_match"
    );
  }


  if (
    record.equipment
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactEquipment;

    reasons.push(
      "equipment_match"
    );
  }


  if (
    record.goalIds
      .includes(
        queryKey
      )
  ) {
    score +=
      SEARCH_WEIGHTS
        .exactGoal;

    score +=
      (
        Number(
          record.exercise
            .goals?.[
              queryKey
            ]
        ) ||
        0
      ) *
      SEARCH_WEIGHTS
        .goalScoreMultiplier;

    reasons.push(
      "goal_match"
    );
  }


  for (
    const token
    of queryTokens
  ) {
    if (
      record.normalizedName
        .includes(
          token
        )
    ) {
      score +=
        SEARCH_WEIGHTS
          .tokenName;
    }


    if (
      record.normalizedAliases
        .some(
          alias =>
            alias.includes(
              token
            )
        )
    ) {
      score +=
        SEARCH_WEIGHTS
          .tokenAlias;
    }


    if (
      record.searchableText
        .includes(
          token
        )
    ) {
      score +=
        SEARCH_WEIGHTS
          .tokenMetadata;
    }
  }


  const useFuzzy =
    options.fuzzy !==
      false &&
    normalizedQuery.length >=
      MIN_FUZZY_QUERY_LENGTH;


  if (
    useFuzzy
  ) {
    const nameSimilarity =
      similarityScore(
        normalizedQuery,
        record.normalizedName
      );


    if (
      nameSimilarity >=
        options
          .fuzzyThreshold
    ) {
      score +=
        Math.round(
          SEARCH_WEIGHTS
            .fuzzyName *
          nameSimilarity
        );

      reasons.push(
        "fuzzy_name"
      );
    }


    let bestAliasSimilarity =
      0;


    for (
      const alias
      of record
        .normalizedAliases
    ) {
      bestAliasSimilarity =
        Math.max(
          bestAliasSimilarity,
          similarityScore(
            normalizedQuery,
            alias
          )
        );
    }


    if (
      bestAliasSimilarity >=
        options
          .fuzzyThreshold
    ) {
      score +=
        Math.round(
          SEARCH_WEIGHTS
            .fuzzyAlias *
          bestAliasSimilarity
        );

      reasons.push(
        "fuzzy_alias"
      );
    }
  }


  return {
    score,
    reasons:
      unique(
        reasons
      )
  };
}


// =====================================================
// SEARCH
// =====================================================

function search(
  query,
  {
    limit =
      DEFAULT_LIMIT,

    fuzzy =
      true,

    fuzzyThreshold =
      DEFAULT_FUZZY_THRESHOLD,

    includeScore =
      true,

    includeReasons =
      true,

    filters =
      {}
  } = {}
) {
  const normalizedQuery =
    normalizeText(
      query
    );

  const normalizedFilters =
    normalizeFilters(
      filters
    );

  const resolvedLimit =
    clampLimit(
      limit
    );


  const filteredRecords =
    SEARCH_RECORDS.filter(
      record =>
        recordMatchesFilters(
          record,
          normalizedFilters
        )
    );


  if (!normalizedQuery) {
    const results =
      filteredRecords
        .slice(
          0,
          resolvedLimit
        )
        .map(
          record =>
            formatSearchResult(
              record,
              {
                score:
                  0,

                reasons:
                  ["filter_match"],

                includeScore,
                includeReasons
              }
            )
        );


    return {
      query:
        "",

      count:
        results.length,

      totalMatches:
        filteredRecords.length,

      filters:
        normalizedFilters,

      results
    };
  }


  const scored =
    [];


  for (
    const record
    of filteredRecords
  ) {
    const scoreResult =
      scoreRecord(
        record,
        normalizedQuery,
        {
          fuzzy,
          fuzzyThreshold:
            Number(
              fuzzyThreshold
            ) ||
            DEFAULT_FUZZY_THRESHOLD
        }
      );


    if (
      scoreResult.score <=
        0
    ) {
      continue;
    }


    scored.push({
      record,
      score:
        scoreResult.score,

      reasons:
        scoreResult.reasons
    });
  }


  scored.sort(
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


      return a.record
        .exercise
        .name
        .localeCompare(
          b.record
            .exercise
            .name
        );
    }
  );


  const results =
    scored
      .slice(
        0,
        resolvedLimit
      )
      .map(
        item =>
          formatSearchResult(
            item.record,
            {
              score:
                item.score,

              reasons:
                item.reasons,

              includeScore,
              includeReasons
            }
          )
      );


  return {
    query:
      query || "",

    normalizedQuery,

    count:
      results.length,

    totalMatches:
      scored.length,

    filters:
      normalizedFilters,

    results
  };
}


// =====================================================
// RESULT FORMATTING
// =====================================================

function formatSearchResult(
  record,
  {
    score,
    reasons,
    includeScore,
    includeReasons
  }
) {
  const result = {
    ...record.exercise
  };


  if (
    includeScore
  ) {
    result.searchScore =
      score;
  }


  if (
    includeReasons
  ) {
    result.searchReasons =
      reasons;
  }


  return result;
}


// =====================================================
// QUICK SEARCH HELPERS
// =====================================================

function find(
  query,
  options =
    {}
) {
  return search(
    query,
    options
  ).results;
}


function first(
  query,
  options =
    {}
) {
  return find(
    query,
    {
      ...options,
      limit:
        1
    }
  )[0] ||
    null;
}


function exact(
  idOrName
) {
  return ExerciseRegistry.get(
    idOrName
  );
}


// =====================================================
// BROWSE
// =====================================================

function browse(
  {
    groupBy =
      "module",

    filters =
      {},

    sort =
      "name"
  } = {}
) {
  const normalizedFilters =
    normalizeFilters(
      filters
    );


  const records =
    SEARCH_RECORDS
      .filter(
        record =>
          recordMatchesFilters(
            record,
            normalizedFilters
          )
      );


  const groups =
    new Map();


  for (
    const record
    of records
  ) {
    const key =
      getBrowseGroupKey(
        record,
        groupBy
      );


    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      );
    }


    groups.get(
      key
    ).push(
      record.exercise
    );
  }


  const result =
    [];


  for (
    const [
      key,
      exercises
    ]
    of groups
  ) {
    const sorted =
      sortExercises(
        exercises,
        sort
      );


    result.push({
      id:
        key,

      label:
        formatBrowseLabel(
          key
        ),

      count:
        sorted.length,

      exercises:
        sorted
    });
  }


  result.sort(
    (a, b) =>
      a.label
        .localeCompare(
          b.label
        )
  );


  return result;
}


function getBrowseGroupKey(
  record,
  groupBy
) {
  switch (
    normalizeText(
      groupBy
    )
  ) {
    case "category":
      return record.category ||
        "other";

    case "difficulty":
      return record.difficulty ||
        "other";

    case "body_part":
    case "bodypart":
      return record.bodyParts[0] ||
        "other";

    case "exercise_type":
    case "type":
      return record.exerciseTypes[0] ||
        "other";

    case "module":
    default:
      return record.moduleId ||
        "other";
  }
}


function formatBrowseLabel(
  value
) {
  return String(
    value ||
    "Other"
  )
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );
}


function sortExercises(
  exercises,
  sort
) {
  const copy = [
    ...exercises
  ];


  switch (
    normalizeText(
      sort
    )
  ) {
    case "difficulty":
      return copy.sort(
        (a, b) =>
          difficultyRank(
            a.difficulty
          ) -
          difficultyRank(
            b.difficulty
          ) ||
          a.name
            .localeCompare(
              b.name
            )
      );


    case "name":
    default:
      return copy.sort(
        (a, b) =>
          a.name
            .localeCompare(
              b.name
            )
      );
  }
}


function difficultyRank(
  value
) {
  switch (
    normalizeText(
      value
    )
  ) {
    case "beginner":
      return 1;

    case "intermediate":
      return 2;

    case "advanced":
      return 3;

    default:
      return 99;
  }
}


// =====================================================
// DISCOVERY HELPERS
// =====================================================

function byBodyPart(
  bodyPart,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        bodyPart
      }
    }
  ).results;
}


function byMuscle(
  muscle,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        muscle
      }
    }
  ).results;
}


function byEquipment(
  equipment,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        equipment
      }
    }
  ).results;
}


function byGoal(
  goal,
  {
    minimumGoalScore =
      1,

    limit =
      DEFAULT_LIMIT,

    ...options
  } = {}
) {
  const goalKey =
    normalizeKey(
      goal
    );


  const results =
    SEARCH_RECORDS
      .filter(
        record =>
          recordMatchesFilters(
            record,
            normalizeFilters({
              ...options.filters,

              goal:
                goalKey,

              minimumGoalScore
            })
          )
      )
      .map(
        record => ({
          exercise:
            record.exercise,

          score:
            Number(
              record.exercise
                .goals?.[
                  goalKey
                ]
            ) ||
            0
        })
      )
      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.exercise.name
            .localeCompare(
              b.exercise.name
            )
      )
      .slice(
        0,
        clampLimit(
          limit
        )
      );


  return results.map(
    item => ({
      ...item.exercise,
      goalScore:
        item.score
    })
  );
}


function byMovementPattern(
  movementPattern,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        movementPattern
      }
    }
  ).results;
}


function byExerciseType(
  exerciseType,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        exerciseType
      }
    }
  ).results;
}


function byModule(
  module,
  options =
    {}
) {
  return search(
    "",
    {
      ...options,

      filters: {
        ...options.filters,

        module
      }
    }
  ).results;
}


function sports(
  options =
    {}
) {
  return byModule(
    "sports",
    options
  );
}


function surfing(
  options =
    {}
) {
  return byModule(
    "surfing",
    options
  );
}


// =====================================================
// SUBSTITUTION SEARCH
// =====================================================

function substitutions(
  exerciseId,
  {
    query =
      "",

    limit =
      12,

    filters =
      {}
  } = {}
) {
  const candidates =
    ExerciseRegistry
      .substitutions?.(
        exerciseId,
        {
          limit:
            MAX_LIMIT
        }
      ) ||
    [];


  if (!query) {
    return candidates
      .filter(
        exercise =>
          recordMatchesFilters(
            SEARCH_RECORD_MAP.get(
              exercise.id
            ),
            normalizeFilters(
              filters
            )
          )
      )
      .slice(
        0,
        clampLimit(
          limit
        )
      );
  }


  const candidateIds =
    new Set(
      candidates.map(
        exercise =>
          exercise.id
      )
    );


  return search(
    query,
    {
      limit:
        MAX_LIMIT,

      filters
    }
  )
    .results
    .filter(
      exercise =>
        candidateIds.has(
          exercise.id
        )
    )
    .slice(
      0,
      clampLimit(
        limit
      )
    );
}


// =====================================================
// SEARCH SUGGESTIONS
// =====================================================

function suggest(
  query,
  {
    limit =
      8
  } = {}
) {
  const normalized =
    normalizeText(
      query
    );

  const resolvedLimit =
    clampLimit(
      limit,
      8
    );


  if (!normalized) {
    return [];
  }


  const suggestions =
    [];


  const pushSuggestion = (
    type,
    id,
    label,
    score
  ) => {
    if (
      !id ||
      !label
    ) {
      return;
    }


    suggestions.push({
      type,
      id,
      label,
      score
    });
  };


  for (
    const record
    of SEARCH_RECORDS
  ) {
    const name =
      record.exercise.name;


    if (
      record.normalizedName
        .startsWith(
          normalized
        )
    ) {
      pushSuggestion(
        "exercise",
        record.id,
        name,
        1000
      );
    } else if (
      record.normalizedName
        .includes(
          normalized
        )
    ) {
      pushSuggestion(
        "exercise",
        record.id,
        name,
        700
      );
    }


    for (
      const alias
      of record.aliases
    ) {
      const normalizedAlias =
        normalizeText(
          alias
        );


      if (
        normalizedAlias ===
          normalized
      ) {
        pushSuggestion(
          "exercise_alias",
          record.id,
          name,
          950
        );
      } else if (
        normalizedAlias
          .startsWith(
            normalized
          )
      ) {
        pushSuggestion(
          "exercise_alias",
          record.id,
          name,
          800
        );
      }
    }
  }


  const metadataPools = [
    {
      type:
        "body_part",

      values:
        unique(
          SEARCH_RECORDS
            .flatMap(
              record =>
                record.bodyParts
            )
        )
    },

    {
      type:
        "muscle",

      values:
        unique(
          SEARCH_RECORDS
            .flatMap(
              record => [
                ...record.primaryMuscles,
                ...record.secondaryMuscles
              ]
            )
        )
    },

    {
      type:
        "equipment",

      values:
        unique(
          SEARCH_RECORDS
            .flatMap(
              record =>
                record.equipment
            )
        )
    },

    {
      type:
        "movement",

      values:
        unique(
          SEARCH_RECORDS
            .flatMap(
              record =>
                record.movementPatterns
            )
        )
    },

    {
      type:
        "goal",

      values:
        unique(
          SEARCH_RECORDS
            .flatMap(
              record =>
                record.goalIds
            )
        )
    },

    {
      type:
        "module",

      values:
        unique(
          SEARCH_RECORDS
            .map(
              record =>
                record.moduleId
            )
        )
    }
  ];


  for (
    const pool
    of metadataPools
  ) {
    for (
      const value
      of pool.values
    ) {
      const normalizedValue =
        normalizeText(
          value
        );


      if (
        normalizedValue
          .startsWith(
            normalized
          )
      ) {
        pushSuggestion(
          pool.type,
          value,
          formatBrowseLabel(
            value
          ),
          500
        );
      }
    }
  }


  const deduped =
    new Map();


  for (
    const suggestion
    of suggestions
  ) {
    const key =
      `${suggestion.type}:${suggestion.id}`;


    const existing =
      deduped.get(
        key
      );


    if (
      !existing ||
      suggestion.score >
        existing.score
    ) {
      deduped.set(
        key,
        suggestion
      );
    }
  }


  return Array.from(
    deduped.values()
  )
    .sort(
      (a, b) =>
        b.score -
          a.score ||
        a.label
          .localeCompare(
            b.label
          )
    )
    .slice(
      0,
      resolvedLimit
    );
}


// =====================================================
// SMART QUERY HELPERS
// =====================================================

function interpretQuery(
  query
) {
  const normalized =
    normalizeText(
      query
    );

  const tokens =
    tokenize(
      normalized
    );


  const interpretation = {
    raw:
      query || "",

    normalized,

    tokens,

    detected: {
      bodyParts: [],
      muscles: [],
      equipment: [],
      goals: [],
      modules: [],
      difficulties: [],
      movementPatterns: [],
      exerciseTypes: []
    }
  };


  const bodyPartIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record =>
          record.bodyParts
      )
    );


  const muscleIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record => [
          ...record.primaryMuscles,
          ...record.secondaryMuscles
        ]
      )
    );


  const equipmentIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record =>
          record.equipment
      )
    );


  const goalIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record =>
          record.goalIds
      )
    );


  const moduleIds =
    new Set(
      SEARCH_RECORDS.map(
        record =>
          record.moduleId
      )
    );


  const movementIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record =>
          record.movementPatterns
      )
    );


  const typeIds =
    new Set(
      SEARCH_RECORDS.flatMap(
        record =>
          record.exerciseTypes
      )
    );


  const normalizedKey =
    normalizeKey(
      normalized
    );


  for (
    const value
    of bodyPartIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .bodyParts
        .push(
          value
        );
    }
  }


  for (
    const value
    of muscleIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .muscles
        .push(
          value
        );
    }
  }


  for (
    const value
    of equipmentIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .equipment
        .push(
          value
        );
    }
  }


  for (
    const value
    of goalIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .goals
        .push(
          value
        );
    }
  }


  for (
    const value
    of moduleIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .modules
        .push(
          value
        );
    }
  }


  for (
    const value
    of movementIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .movementPatterns
        .push(
          value
        );
    }
  }


  for (
    const value
    of typeIds
  ) {
    if (
      normalized.includes(
        value.replace(
          /_/g,
          " "
        )
      ) ||
      normalizedKey.includes(
        value
      )
    ) {
      interpretation
        .detected
        .exerciseTypes
        .push(
          value
        );
    }
  }


  for (
    const difficulty
    of [
      "beginner",
      "intermediate",
      "advanced"
    ]
  ) {
    if (
      normalized.includes(
        difficulty
      )
    ) {
      interpretation
        .detected
        .difficulties
        .push(
          difficulty
        );
    }
  }


  for (
    const key
    of Object.keys(
      interpretation.detected
    )
  ) {
    interpretation
      .detected[
        key
      ] =
        unique(
          interpretation
            .detected[
              key
            ]
        );
  }


  return interpretation;
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function getDiagnostics() {
  return {
    version:
      VERSION,

    source:
      SOURCE,

    exerciseCount:
      SEARCH_RECORDS.length,

    moduleCount:
      ExerciseRegistry
        .getModules?.()
        ?.length ||
      0,

    indexedAliases:
      SEARCH_RECORDS.reduce(
        (
          total,
          record
        ) =>
          total +
          record.aliases.length,
        0
      ),

    indexedBodyParts:
      unique(
        SEARCH_RECORDS.flatMap(
          record =>
            record.bodyParts
        )
      ).length,

    indexedMuscles:
      unique(
        SEARCH_RECORDS.flatMap(
          record => [
            ...record.primaryMuscles,
            ...record.secondaryMuscles
          ]
        )
      ).length,

    indexedEquipment:
      unique(
        SEARCH_RECORDS.flatMap(
          record =>
            record.equipment
        )
      ).length,

    indexedGoals:
      unique(
        SEARCH_RECORDS.flatMap(
          record =>
            record.goalIds
        )
      ).length
  };
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingExerciseSearch =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    search,

    find,

    first,

    exact,

    browse,

    suggest,

    interpret:
      interpretQuery,

    byBodyPart,

    byMuscle,

    byEquipment,

    byGoal,

    byMovementPattern,

    byExerciseType,

    byModule,

    sports,

    surfing,

    substitutions,

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

  Ari.training.exerciseSearch =
    AriTrainingExerciseSearch;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  search,
  find,
  first,
  exact,

  browse,
  suggest,
  interpretQuery,

  byBodyPart,
  byMuscle,
  byEquipment,
  byGoal,
  byMovementPattern,
  byExerciseType,
  byModule,

  sports,
  surfing,

  substitutions,

  getDiagnostics,

  AriTrainingExerciseSearch
};

export default
  AriTrainingExerciseSearch;
