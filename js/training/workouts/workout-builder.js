// =====================================================
// ARI REBIRTH
// File: js/training/workouts/workout-builder.js
// Version: 1.0.0
// Purpose:
//   Build complete workout sessions from ARI Training's
//   exercise registry and recommendation engine.
//
// Architecture:
//   exercise-registry.js
//          ↓
//   exercise-search.js
//          ↓
//   exercise-recommender.js
//          ↓
//   workout-builder.js
//          ↓
//   workout-plan-controller.js / quick workout / training UI
//
// Responsibilities:
//   - Build strength, hypertrophy, cardio, mobility,
//     functional, sport, surfing, and mixed workouts.
//   - Select appropriate exercises.
//   - Decide exercise order.
//   - Assign sets, reps, duration, rest, and intensity.
//   - Respect user experience level and equipment.
//   - Respect workout duration.
//   - Avoid excessive duplicate movement patterns.
//   - Create warm-up / main / accessory / finisher blocks.
//   - Support quick workouts.
//   - Support substitutions.
//   - Produce stable workout records suitable for saving.
//
// Important:
//   - This file does not persist workouts.
//   - This file does not write to Supabase.
//   - This file does not mark exercises complete.
//   - Persistence belongs to plan/session stores.
// =====================================================

import ExerciseRegistry
  from "../exercises/exercise-registry.js";

import ExerciseSearch
  from "../exercises/exercise-search.js";

import ExerciseRecommender
  from "../exercises/exercise-recommender.js";


const VERSION =
  "1.0.0";

const SOURCE =
  "js/training/workouts/workout-builder";


// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_DURATION_MINUTES =
  45;

const MIN_DURATION_MINUTES =
  5;

const MAX_DURATION_MINUTES =
  180;


const DEFAULT_EXERCISE_COUNTS =
  Object.freeze({
    10: 3,
    15: 4,
    20: 4,
    30: 5,
    45: 6,
    60: 7,
    75: 8,
    90: 9
  });


const DIFFICULTY_RANK =
  Object.freeze({
    beginner: 1,
    intermediate: 2,
    advanced: 3
  });


const GOAL_DEFAULTS =
  Object.freeze({
    strength: {
      mainSets:
        4,
      mainReps:
        5,
      accessorySets:
        3,
      accessoryReps:
        8,
      restSecondsMain:
        150,
      restSecondsAccessory:
        90
    },

    muscle_building: {
      mainSets:
        4,
      mainReps:
        8,
      accessorySets:
        3,
      accessoryReps:
        12,
      restSecondsMain:
        90,
      restSecondsAccessory:
        60
    },

    upper_body_strength: {
      mainSets:
        4,
      mainReps:
        6,
      accessorySets:
        3,
      accessoryReps:
        10,
      restSecondsMain:
        120,
      restSecondsAccessory:
        75
    },

    lower_body_strength: {
      mainSets:
        4,
      mainReps:
        6,
      accessorySets:
        3,
      accessoryReps:
        10,
      restSecondsMain:
        120,
      restSecondsAccessory:
        75
    },

    core_strength: {
      mainSets:
        3,
      mainReps:
        10,
      accessorySets:
        3,
      accessoryReps:
        12,
      restSecondsMain:
        60,
      restSecondsAccessory:
        45
    },

    cardio: {
      durationMinutes:
        30,
      intensity:
        "moderate"
    },

    endurance: {
      durationMinutes:
        40,
      intensity:
        "moderate"
    },

    running: {
      durationMinutes:
        35,
      intensity:
        "moderate"
    },

    mobility: {
      durationMinutes:
        20
    },

    flexibility: {
      durationMinutes:
        20
    },

    recovery: {
      durationMinutes:
        15
    },

    athletic_performance: {
      mainSets:
        3,
      mainReps:
        6,
      accessorySets:
        3,
      accessoryReps:
        8,
      restSecondsMain:
        90,
      restSecondsAccessory:
        60
    },

    general_fitness: {
      mainSets:
        3,
      mainReps:
        10,
      accessorySets:
        3,
      accessoryReps:
        12,
      restSecondsMain:
        75,
      restSecondsAccessory:
        60
    }
  });


const GOAL_ALIASES =
  Object.freeze({
    hypertrophy:
      "muscle_building",

    bodybuilding:
      "muscle_building",

    muscle:
      "muscle_building",

    build_muscle:
      "muscle_building",

    upper_body:
      "upper_body_strength",

    lower_body:
      "lower_body_strength",

    abs:
      "core_strength",

    core:
      "core_strength",

    cardio_fitness:
      "cardio",

    stamina:
      "endurance",

    athletic:
      "athletic_performance",

    sports:
      "athletic_performance",

    surf:
      "athletic_performance",

    surfing:
      "athletic_performance",

    run:
      "running",

    weight_loss:
      "general_fitness",

    fat_loss:
      "general_fitness"
  });


// =====================================================
// HELPERS
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
      asArray(
        values
      )
        .map(
          normalizeKey
        )
        .filter(Boolean)
    )
  ];
}


function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


function clampDuration(
  value
) {
  const duration =
    Number(
      value
    );

  if (
    !Number.isFinite(
      duration
    )
  ) {
    return DEFAULT_DURATION_MINUTES;
  }

  return clamp(
    Math.round(
      duration
    ),
    MIN_DURATION_MINUTES,
    MAX_DURATION_MINUTES
  );
}


function normalizeGoal(
  value
) {
  const key =
    normalizeKey(
      value
    );

  return (
    GOAL_ALIASES[
      key
    ] ||
    key ||
    "general_fitness"
  );
}


function titleFromId(
  value
) {
  return String(
    value ||
    ""
  )
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character
          .toUpperCase()
    );
}


function nowIso() {
  return new Date()
    .toISOString();
}


function createId(
  prefix =
    "workout"
) {
  const random =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `${prefix}_` +
    `${Date.now()}_` +
    `${random}`
  );
}


function getDifficultyRank(
  value
) {
  return (
    DIFFICULTY_RANK[
      normalizeText(
        value
      )
    ] ||
    0
  );
}


// =====================================================
// REQUEST NORMALIZATION
// =====================================================

function normalizeBuildRequest(
  request =
    {}
) {
  const goal =
    normalizeGoal(
      request.goal
    );

  const durationMinutes =
    clampDuration(
      request.durationMinutes
    );

  const difficulty =
    normalizeText(
      request.difficulty ||
      "beginner"
    );

  const sport =
    normalizeKey(
      request.sport
    );

  return {
    goal,

    secondaryGoals:
      unique(
        request.secondaryGoals
      ),

    durationMinutes,

    difficulty,

    sport,

    specialization:
      normalizeKey(
        request.specialization
      ),

    bodyParts:
      unique(
        request.bodyParts
      ),

    muscles:
      unique(
        request.muscles
      ),

    movementPatterns:
      unique(
        request.movementPatterns
      ),

    exerciseTypes:
      unique(
        request.exerciseTypes
      ),

    modules:
      unique(
        request.modules
      ),

    categories:
      unique(
        request.categories
      ),

    availableEquipment:
      unique(
        request.availableEquipment
      ),

    preferredEquipment:
      unique(
        request.preferredEquipment
      ),

    excludedEquipment:
      unique(
        request.excludedEquipment
      ),

    preferredExercises:
      unique(
        request.preferredExercises
      ),

    excludedExercises:
      unique(
        request.excludedExercises
      ),

    allowHarder:
      Boolean(
        request.allowHarder
      ),

    strictEquipment:
      request.strictEquipment !==
        false,

    includeBodyweight:
      request.includeBodyweight !==
        false,

    includeWarmup:
      request.includeWarmup !==
        false,

    includeCooldown:
      request.includeCooldown !==
        false,

    includeFinisher:
      Boolean(
        request.includeFinisher
      ),

    exerciseCount:
      Number.isFinite(
        Number(
          request.exerciseCount
        )
      )
        ? clamp(
            Math.round(
              Number(
                request.exerciseCount
              )
            ),
            1,
            12
          )
        : null,

    title:
      String(
        request.title ||
        ""
      ).trim() ||
      null,

    notes:
      String(
        request.notes ||
        ""
      ).trim() ||
      null
  };
}


// =====================================================
// WORKOUT TYPE RESOLUTION
// =====================================================

function resolveWorkoutType(
  request
) {
  if (
    request.sport ===
      "surfing"
  ) {
    return "surfing";
  }

  if (
    request.sport
  ) {
    return "sports";
  }

  if (
    [
      "cardio",
      "endurance",
      "running"
    ].includes(
      request.goal
    )
  ) {
    return "cardio";
  }

  if (
    [
      "mobility",
      "flexibility",
      "recovery"
    ].includes(
      request.goal
    )
  ) {
    return "mobility";
  }

  if (
    request.goal ===
      "athletic_performance"
  ) {
    return "functional";
  }

  return "strength";
}


// =====================================================
// EXERCISE COUNT
// =====================================================

function estimateExerciseCount(
  durationMinutes,
  workoutType
) {
  if (
    workoutType ===
      "cardio"
  ) {
    return durationMinutes <= 20
      ? 1
      : durationMinutes <= 45
        ? 2
        : 3;
  }

  if (
    workoutType ===
      "mobility"
  ) {
    return clamp(
      Math.round(
        durationMinutes / 4
      ),
      3,
      8
    );
  }

  const entries =
    Object.entries(
      DEFAULT_EXERCISE_COUNTS
    )
      .map(
        (
          [
            duration,
            count
          ]
        ) => ({
          duration:
            Number(
              duration
            ),
          count
        })
      )
      .sort(
        (a, b) =>
          a.duration -
          b.duration
      );

  let result =
    3;

  for (
    const entry
    of entries
  ) {
    if (
      durationMinutes >=
        entry.duration
    ) {
      result =
        entry.count;
    }
  }

  return result;
}


// =====================================================
// RECOMMENDATION REQUEST
// =====================================================

function buildRecommendationRequest(
  request,
  limit
) {
  const modules =
    request.modules.length
      ? request.modules
      : resolveDefaultModules(
          request
        );

  return {
    goal:
      request.goal,

    secondaryGoals:
      request.secondaryGoals,

    bodyParts:
      request.bodyParts,

    muscles:
      request.muscles,

    movementPatterns:
      request.movementPatterns,

    exerciseTypes:
      request.exerciseTypes,

    modules,

    categories:
      request.categories,

    availableEquipment:
      request.availableEquipment,

    preferredEquipment:
      request.preferredEquipment,

    excludedEquipment:
      request.excludedEquipment,

    preferredExercises:
      request.preferredExercises,

    excludedExercises:
      request.excludedExercises,

    difficulty:
      request.difficulty,

    sport:
      request.sport,

    specialization:
      request.specialization,

    allowHarder:
      request.allowHarder,

    strictEquipment:
      request.strictEquipment,

    includeBodyweight:
      request.includeBodyweight,

    variety:
      true,

    limit
  };
}


function resolveDefaultModules(
  request
) {
  const workoutType =
    resolveWorkoutType(
      request
    );

  switch (
    workoutType
  ) {
    case "surfing":
      return [
        "surfing",
        "sports",
        "functional",
        "core",
        "cardio",
        "mobility",
        "shoulders",
        "back"
      ];

    case "sports":
      return [
        "sports",
        "functional",
        "core",
        "cardio",
        "mobility"
      ];

    case "cardio":
      return [
        "cardio",
        "functional",
        "sports",
        "surfing"
      ];

    case "mobility":
      return [
        "mobility",
        "core"
      ];

    case "functional":
      return [
        "functional",
        "sports",
        "core",
        "cardio",
        "mobility"
      ];

    case "strength":
    default:
      return [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "legs",
        "glutes",
        "calves",
        "forearms",
        "core",
        "functional"
      ];
  }
}


// =====================================================
// WORKOUT BUILDING
// =====================================================

function buildWorkout(
  request =
    {}
) {
  const normalized =
    normalizeBuildRequest(
      request
    );

  const workoutType =
    resolveWorkoutType(
      normalized
    );

  const exerciseCount =
    normalized.exerciseCount ||
    estimateExerciseCount(
      normalized.durationMinutes,
      workoutType
    );

  const recommendationLimit =
    Math.max(
      exerciseCount * 3,
      12
    );

  const recommendation =
    ExerciseRecommender.recommend(
      buildRecommendationRequest(
        normalized,
        recommendationLimit
      )
    );

  const mainCandidates =
    asArray(
      recommendation.results
    );

  const selected =
    selectMainExercises({
      candidates:
        mainCandidates,

      request:
        normalized,

      workoutType,

      count:
        exerciseCount
    });

  const blocks = [];

  if (
    normalized.includeWarmup
  ) {
    const warmup =
      buildWarmupBlock(
        normalized,
        selected
      );

    if (
      warmup.exercises.length
    ) {
      blocks.push(
        warmup
      );
    }
  }

  const mainBlock =
    buildMainBlock(
      normalized,
      selected,
      workoutType
    );

  if (
    mainBlock.exercises.length
  ) {
    blocks.push(
      mainBlock
    );
  }

  const accessoryBlock =
    buildAccessoryBlock(
      normalized,
      selected,
      workoutType
    );

  if (
    accessoryBlock.exercises.length
  ) {
    blocks.push(
      accessoryBlock
    );
  }

  if (
    normalized.includeFinisher
  ) {
    const finisher =
      buildFinisherBlock(
        normalized,
        selected
      );

    if (
      finisher.exercises.length
    ) {
      blocks.push(
        finisher
      );
    }
  }

  if (
    normalized.includeCooldown
  ) {
    const cooldown =
      buildCooldownBlock(
        normalized,
        selected
      );

    if (
      cooldown.exercises.length
    ) {
      blocks.push(
        cooldown
      );
    }
  }

  const workout = {
    workoutId:
      createId(
        "workout"
      ),

    title:
      normalized.title ||
      buildWorkoutTitle(
        normalized,
        workoutType
      ),

    type:
      workoutType,

    goal:
      normalized.goal,

    secondaryGoals:
      normalized.secondaryGoals,

    sport:
      normalized.sport ||
      null,

    difficulty:
      normalized.difficulty,

    plannedDurationMinutes:
      normalized.durationMinutes,

    estimatedDurationMinutes:
      estimateWorkoutDuration(
        blocks
      ),

    bodyParts:
      collectUniqueField(
        blocks,
        "bodyParts"
      ),

    muscles:
      collectWorkoutMuscles(
        blocks
      ),

    movementPatterns:
      collectUniqueField(
        blocks,
        "movementPatterns"
      ),

    equipment:
      collectUniqueField(
        blocks,
        "equipment"
      ),

    blocks,

    notes:
      normalized.notes,

    metadata: {
      version:
        VERSION,

      source:
        SOURCE,

      createdAt:
        nowIso(),

      recommendationSource:
        "exercise-recommender",

      requestedDurationMinutes:
        normalized.durationMinutes,

      requestedExerciseCount:
        normalized.exerciseCount,

      selectedExerciseCount:
        countWorkoutExercises(
          blocks
        )
    }
  };

  return workout;
}


// =====================================================
// MAIN EXERCISE SELECTION
// =====================================================

function selectMainExercises({
  candidates,
  request,
  workoutType,
  count
}) {
  if (
    workoutType ===
      "cardio"
  ) {
    return candidates
      .slice(
        0,
        Math.max(
          1,
          count
        )
      );
  }

  if (
    workoutType ===
      "mobility"
  ) {
    return candidates
      .slice(
        0,
        count
      );
  }

  const selected = [];
  const usedIds =
    new Set();

  const usedGroups =
    new Set();

  const usedPatterns =
    new Map();

  for (
    const candidate
    of candidates
  ) {
    if (
      selected.length >=
        count
    ) {
      break;
    }

    if (
      usedIds.has(
        candidate.id
      )
    ) {
      continue;
    }

    const group =
      normalizeKey(
        candidate
          .substitutionGroup
      );

    const patterns =
      unique(
        candidate
          .movementPatterns
      );

    if (
      group &&
      usedGroups.has(
        group
      ) &&
      request.goal !==
        "muscle_building"
    ) {
      continue;
    }

    const excessivePattern =
      patterns.some(
        pattern =>
          (
            usedPatterns.get(
              pattern
            ) ||
            0
          ) >=
            (
              request.goal ===
                "muscle_building"
                ? 2
                : 1
            )
      );

    if (
      excessivePattern &&
      selected.length <
        count - 1
    ) {
      continue;
    }

    selected.push(
      candidate
    );

    usedIds.add(
      candidate.id
    );

    if (group) {
      usedGroups.add(
        group
      );
    }

    for (
      const pattern
      of patterns
    ) {
      usedPatterns.set(
        pattern,
        (
          usedPatterns.get(
            pattern
          ) ||
          0
        ) +
        1
      );
    }
  }

  if (
    selected.length <
      count
  ) {
    for (
      const candidate
      of candidates
    ) {
      if (
        selected.length >=
          count
      ) {
        break;
      }

      if (
        usedIds.has(
          candidate.id
        )
      ) {
        continue;
      }

      selected.push(
        candidate
      );

      usedIds.add(
        candidate.id
      );
    }
  }

  return selected;
}


// =====================================================
// BLOCK BUILDERS
// =====================================================

function buildWarmupBlock(
  request,
  selected
) {
  const targetBodyParts =
    unique(
      selected.flatMap(
        exercise =>
          asArray(
            exercise.bodyParts
          )
      )
    );

  const targetMuscles =
    unique(
      selected.flatMap(
        exercise =>
          asArray(
            exercise.primaryMuscles
          )
      )
    );

  const mobilityResults =
    ExerciseRecommender.recommend({
      goal:
        "mobility",

      bodyParts:
        targetBodyParts,

      muscles:
        targetMuscles,

      modules: [
        "mobility"
      ],

      availableEquipment:
        request.availableEquipment,

      strictEquipment:
        false,

      difficulty:
        request.difficulty,

      variety:
        true,

      limit:
        request.durationMinutes <= 20
          ? 2
          : 3
    }).results;

  const exercises =
    mobilityResults.map(
      exercise =>
        createWorkoutExercise(
          exercise,
          {
            role:
              "warmup",

            prescription:
              createMobilityPrescription(
                exercise,
                1
              )
          }
        )
    );

  return {
    id:
      "warmup",

    label:
      "Warm-Up",

    type:
      "warmup",

    exercises
  };
}


function buildMainBlock(
  request,
  selected,
  workoutType
) {
  if (
    workoutType ===
      "cardio"
  ) {
    return buildCardioMainBlock(
      request,
      selected
    );
  }

  if (
    workoutType ===
      "mobility"
  ) {
    return buildMobilityMainBlock(
      request,
      selected
    );
  }

  const mainCount =
    selected.length <= 3
      ? selected.length
      : Math.ceil(
          selected.length *
          0.6
        );

  const mainExercises =
    selected.slice(
      0,
      mainCount
    );

  return {
    id:
      "main",

    label:
      request.sport
        ? "Performance Work"
        : "Main Work",

    type:
      "main",

    exercises:
      mainExercises.map(
        (
          exercise,
          index
        ) =>
          createWorkoutExercise(
            exercise,
            {
              role:
                index === 0
                  ? "primary"
                  : "main",

              prescription:
                createStrengthPrescription(
                  exercise,
                  request,
                  {
                    primary:
                      index === 0
                  }
                )
            }
          )
      )
  };
}


function buildAccessoryBlock(
  request,
  selected,
  workoutType
) {
  if (
    [
      "cardio",
      "mobility"
    ].includes(
      workoutType
    )
  ) {
    return {
      id:
        "accessory",

      label:
        "Accessory",

      type:
        "accessory",

      exercises:
        []
    };
  }

  const mainCount =
    selected.length <= 3
      ? selected.length
      : Math.ceil(
          selected.length *
          0.6
        );

  const accessory =
    selected.slice(
      mainCount
    );

  return {
    id:
      "accessory",

    label:
      request.sport
        ? "Support Work"
        : "Accessory Work",

    type:
      "accessory",

    exercises:
      accessory.map(
        exercise =>
          createWorkoutExercise(
            exercise,
            {
              role:
                "accessory",

              prescription:
                createStrengthPrescription(
                  exercise,
                  request,
                  {
                    primary:
                      false
                  }
                )
            }
          )
      )
  };
}


function buildFinisherBlock(
  request,
  selected
) {
  const excludedExercises =
    selected.map(
      exercise =>
        exercise.id
    );

  const results =
    ExerciseRecommender.recommend({
      goal:
        request.sport
          ? "athletic_performance"
          : "cardio",

      modules:
        request.sport ===
          "surfing"
          ? [
              "surfing",
              "functional",
              "cardio"
            ]
          : [
              "functional",
              "cardio",
              "sports"
            ],

      availableEquipment:
        request.availableEquipment,

      excludedEquipment:
        request.excludedEquipment,

      excludedExercises,

      difficulty:
        request.difficulty,

      strictEquipment:
        request.strictEquipment,

      allowHarder:
        request.allowHarder,

      limit:
        1
    }).results;

  const exercise =
    results[0];

  if (!exercise) {
    return {
      id:
        "finisher",

      label:
        "Finisher",

      type:
        "finisher",

      exercises:
        []
    };
  }

  return {
    id:
      "finisher",

    label:
      "Finisher",

    type:
      "finisher",

    exercises: [
      createWorkoutExercise(
        exercise,
        {
          role:
            "finisher",

          prescription:
            createConditioningPrescription(
              exercise,
              request,
              6
            )
        }
      )
    ]
  };
}


function buildCooldownBlock(
  request,
  selected
) {
  const bodyParts =
    unique(
      selected.flatMap(
        exercise =>
          asArray(
            exercise.bodyParts
          )
      )
    );

  const results =
    ExerciseRecommender.recommend({
      goal:
        "recovery",

      bodyParts,

      modules: [
        "mobility"
      ],

      availableEquipment:
        request.availableEquipment,

      strictEquipment:
        false,

      difficulty:
        "beginner",

      variety:
        true,

      limit:
        request.durationMinutes <= 20
          ? 1
          : 2
    }).results;

  return {
    id:
      "cooldown",

    label:
      "Cool Down",

    type:
      "cooldown",

    exercises:
      results.map(
        exercise =>
          createWorkoutExercise(
            exercise,
            {
              role:
                "cooldown",

              prescription:
                createMobilityPrescription(
                  exercise,
                  2
                )
            }
          )
      )
  };
}


// =====================================================
// CARDIO BLOCK
// =====================================================

function buildCardioMainBlock(
  request,
  selected
) {
  const exercises =
    selected.length
      ? selected
      : ExerciseSearch
          .byModule(
            "cardio",
            {
              limit:
                1
            }
          );

  const durationPerExercise =
    Math.max(
      5,
      Math.round(
        request.durationMinutes /
        Math.max(
          1,
          exercises.length
        )
      )
    );

  return {
    id:
      "main",

    label:
      "Cardio",

    type:
      "main",

    exercises:
      exercises.map(
        exercise =>
          createWorkoutExercise(
            exercise,
            {
              role:
                "main",

              prescription:
                createCardioPrescription(
                  exercise,
                  request,
                  durationPerExercise
                )
            }
          )
      )
  };
}


// =====================================================
// MOBILITY BLOCK
// =====================================================

function buildMobilityMainBlock(
  request,
  selected
) {
  const durationPerExercise =
    Math.max(
      2,
      Math.round(
        request.durationMinutes /
        Math.max(
          1,
          selected.length
        )
      )
    );

  return {
    id:
      "main",

    label:
      request.goal ===
        "recovery"
        ? "Recovery"
        : "Mobility",

    type:
      "main",

    exercises:
      selected.map(
        exercise =>
          createWorkoutExercise(
            exercise,
            {
              role:
                "main",

              prescription:
                createMobilityPrescription(
                  exercise,
                  durationPerExercise
                )
            }
          )
      )
  };
}


// =====================================================
// PRESCRIPTIONS
// =====================================================

function createStrengthPrescription(
  exercise,
  request,
  {
    primary =
      false
  } = {}
) {
  const defaults =
    GOAL_DEFAULTS[
      request.goal
    ] ||
    GOAL_DEFAULTS
      .general_fitness;

  const loggingType =
    normalizeKey(
      exercise.logging
        ?.type
    );

  if (
    loggingType ===
      "sets_duration"
  ) {
    return {
      mode:
        "sets_duration",

      sets:
        primary
          ? 3
          : 2,

      durationSeconds:
        request.goal ===
          "core_strength"
          ? 45
          : 30,

      restSeconds:
        45
    };
  }

  if (
    loggingType ===
      "duration"
  ) {
    return {
      mode:
        "duration",

      durationMinutes:
        primary
          ? 10
          : 6,

      intensity:
        "moderate"
    };
  }

  if (
    loggingType ===
      "intervals"
  ) {
    return createConditioningPrescription(
      exercise,
      request,
      primary
        ? 8
        : 5
    );
  }

  const sets =
    primary
      ? defaults.mainSets ||
        4
      : defaults.accessorySets ||
        3;

  const reps =
    primary
      ? defaults.mainReps ||
        8
      : defaults.accessoryReps ||
        10;

  const restSeconds =
    primary
      ? defaults.restSecondsMain ||
        90
      : defaults.restSecondsAccessory ||
        60;

  return {
    mode:
      loggingType ||
      "sets_reps",

    sets,

    reps,

    restSeconds,

    weight:
      null,

    intensity:
      resolveStrengthIntensity(
        request,
        primary
      )
  };
}


function createCardioPrescription(
  exercise,
  request,
  durationMinutes
) {
  const loggingType =
    normalizeKey(
      exercise.logging
        ?.type
    );

  const intensity =
    request.goal ===
      "endurance"
      ? "moderate"
      : request.difficulty ===
          "advanced"
        ? "vigorous"
        : "moderate";

  if (
    loggingType ===
      "intervals"
  ) {
    const rounds =
      clamp(
        Math.round(
          durationMinutes /
          3
        ),
        4,
        12
      );

    return {
      mode:
        "intervals",

      rounds,

      workSeconds:
        request.difficulty ===
          "advanced"
          ? 60
          : 45,

      restSeconds:
        request.difficulty ===
          "beginner"
          ? 60
          : 45,

      intensity
    };
  }

  return {
    mode:
      loggingType ||
      "duration",

    durationMinutes,

    intensity,

    distance:
      null,

    pace:
      null
  };
}


function createMobilityPrescription(
  exercise,
  approximateMinutes =
    2
) {
  const loggingType =
    normalizeKey(
      exercise.logging
        ?.type
    );

  if (
    loggingType ===
      "sets_reps"
  ) {
    return {
      mode:
        "sets_reps",

      sets:
        1,

      reps:
        clamp(
          approximateMinutes * 5,
          6,
          15
        ),

      restSeconds:
        15
    };
  }

  return {
    mode:
      "sets_duration",

    sets:
      1,

    durationSeconds:
      clamp(
        approximateMinutes *
          30,
        30,
        90
      ),

    side:
      null,

    restSeconds:
      15
  };
}


function createConditioningPrescription(
  exercise,
  request,
  approximateMinutes =
    6
) {
  const rounds =
    clamp(
      Math.round(
        approximateMinutes /
        1.5
      ),
      3,
      8
    );

  return {
    mode:
      "intervals",

    rounds,

    workSeconds:
      request.difficulty ===
        "beginner"
        ? 30
        : request.difficulty ===
            "advanced"
          ? 60
          : 45,

    restSeconds:
      request.difficulty ===
        "beginner"
        ? 45
        : 30,

    intensity:
      request.difficulty ===
        "advanced"
        ? "vigorous"
        : "moderate"
  };
}


function resolveStrengthIntensity(
  request,
  primary
) {
  if (
    request.goal ===
      "strength"
  ) {
    return primary
      ? "heavy"
      : "moderate_heavy";
  }

  if (
    request.goal ===
      "muscle_building"
  ) {
    return "moderate_heavy";
  }

  if (
    request.goal ===
      "athletic_performance"
  ) {
    return primary
      ? "explosive_controlled"
      : "moderate";
  }

  return "moderate";
}


// =====================================================
// WORKOUT EXERCISE RECORD
// =====================================================

function createWorkoutExercise(
  exercise,
  {
    role,
    prescription
  }
) {
  return {
    entryId:
      createId(
        "exercise"
      ),

    exerciseId:
      exercise.id,

    name:
      exercise.name,

    moduleId:
      exercise.moduleId,

    category:
      exercise.category,

    role,

    prescription,

    bodyParts:
      [
        ...asArray(
          exercise.bodyParts
        )
      ],

    primaryMuscles:
      [
        ...asArray(
          exercise.primaryMuscles
        )
      ],

    secondaryMuscles:
      [
        ...asArray(
          exercise.secondaryMuscles
        )
      ],

    movementPatterns:
      [
        ...asArray(
          exercise.movementPatterns
        )
      ],

    equipment:
      [
        ...asArray(
          exercise.equipment
        )
      ],

    substitutions:
      resolveSubstitutions(
        exercise
      ),

    status:
      "not_started",

    completedSets:
      0,

    estimatedCalories:
      0,

    userNotes:
      null
  };
}


// =====================================================
// SUBSTITUTIONS
// =====================================================

function resolveSubstitutions(
  exercise
) {
  return ExerciseRegistry
    .substitutions?.(
      exercise.id,
      {
        limit:
          5
      }
    )
    ?.map(
      substitution => ({
        exerciseId:
          substitution.id,

        name:
          substitution.name,

        equipment:
          [
            ...asArray(
              substitution
                .equipment
            )
          ]
      })
    ) ||
    [];
}


// =====================================================
// WORKOUT TITLE
// =====================================================

function buildWorkoutTitle(
  request,
  workoutType
) {
  if (
    request.sport ===
      "surfing"
  ) {
    return "Surf Performance Session";
  }

  if (
    request.sport
  ) {
    return (
      `${titleFromId(request.sport)} ` +
      "Performance Session"
    );
  }

  if (
    request.bodyParts.length ===
      1
  ) {
    return (
      `${titleFromId(request.bodyParts[0])} ` +
      "Workout"
    );
  }

  switch (
    workoutType
  ) {
    case "cardio":
      return request.goal ===
        "running"
        ? "Running Session"
        : "Cardio Session";

    case "mobility":
      return request.goal ===
        "recovery"
        ? "Recovery Session"
        : "Mobility Session";

    case "functional":
      return "Performance Session";

    case "strength":
    default:
      return (
        `${titleFromId(request.goal)} ` +
        "Workout"
      );
  }
}


// =====================================================
// DURATION ESTIMATION
// =====================================================

function estimateWorkoutDuration(
  blocks
) {
  let totalSeconds =
    0;

  for (
    const block
    of asArray(
      blocks
    )
  ) {
    for (
      const exercise
      of asArray(
        block.exercises
      )
    ) {
      totalSeconds +=
        estimateExerciseSeconds(
          exercise
        );
    }
  }

  return Math.max(
    1,
    Math.round(
      totalSeconds /
      60
    )
  );
}


function estimateExerciseSeconds(
  workoutExercise
) {
  const prescription =
    workoutExercise
      .prescription ||
    {};

  const mode =
    normalizeKey(
      prescription.mode
    );

  if (
    mode ===
      "duration" ||
    mode ===
      "duration_distance" ||
    mode ===
      "duration_distance_pace"
  ) {
    return (
      Number(
        prescription
          .durationMinutes
      ) ||
      0
    ) *
    60;
  }

  if (
    mode ===
      "intervals"
  ) {
    const rounds =
      Number(
        prescription.rounds
      ) ||
      1;

    const work =
      Number(
        prescription
          .workSeconds
      ) ||
      30;

    const rest =
      Number(
        prescription
          .restSeconds
      ) ||
      30;

    return (
      rounds *
      (
        work +
        rest
      )
    );
  }

  if (
    mode ===
      "sets_duration"
  ) {
    const sets =
      Number(
        prescription.sets
      ) ||
      1;

    const duration =
      Number(
        prescription
          .durationSeconds
      ) ||
      30;

    const rest =
      Number(
        prescription
          .restSeconds
      ) ||
      15;

    return (
      sets *
      (
        duration +
        rest
      )
    );
  }

  const sets =
    Number(
      prescription.sets
    ) ||
    1;

  const reps =
    Number(
      prescription.reps
    ) ||
    10;

  const rest =
    Number(
      prescription
        .restSeconds
    ) ||
    60;

  const activeSecondsPerRep =
    3;

  return (
    sets *
    (
      reps *
        activeSecondsPerRep +
      rest
    )
  );
}


// =====================================================
// COVERAGE HELPERS
// =====================================================

function collectUniqueField(
  blocks,
  field
) {
  return unique(
    asArray(
      blocks
    )
      .flatMap(
        block =>
          asArray(
            block.exercises
          )
      )
      .flatMap(
        exercise =>
          asArray(
            exercise[
              field
            ]
          )
      )
  );
}


function collectWorkoutMuscles(
  blocks
) {
  return unique(
    asArray(
      blocks
    )
      .flatMap(
        block =>
          asArray(
            block.exercises
          )
      )
      .flatMap(
        exercise => [
          ...asArray(
            exercise.primaryMuscles
          ),
          ...asArray(
            exercise.secondaryMuscles
          )
        ]
      )
  );
}


function countWorkoutExercises(
  blocks
) {
  return asArray(
    blocks
  )
    .reduce(
      (
        total,
        block
      ) =>
        total +
        asArray(
          block.exercises
        ).length,
      0
    );
}


// =====================================================
// QUICK WORKOUT
// =====================================================

function buildQuickWorkout({
  minutes =
    15,

  goal =
    "general_fitness",

  bodyPart =
    null,

  availableEquipment =
    [],

  difficulty =
    "beginner",

  sport =
    null
} = {}) {
  return buildWorkout({
    goal,

    durationMinutes:
      minutes,

    bodyParts:
      bodyPart
        ? [
            bodyPart
          ]
        : [],

    availableEquipment,

    difficulty,

    sport,

    includeWarmup:
      minutes >= 15,

    includeCooldown:
      minutes >= 20,

    includeFinisher:
      false
  });
}


// =====================================================
// SURFING WORKOUT
// =====================================================

function buildSurfWorkout(
  options =
    {}
) {
  return buildWorkout({
    goal:
      "athletic_performance",

    sport:
      "surfing",

    durationMinutes:
      45,

    modules: [
      "surfing",
      "functional",
      "core",
      "mobility",
      "shoulders",
      "back",
      "cardio"
    ],

    includeFinisher:
      true,

    ...options
  });
}


// =====================================================
// CARDIO WORKOUT
// =====================================================

function buildCardioWorkout(
  options =
    {}
) {
  return buildWorkout({
    goal:
      "cardio",

    durationMinutes:
      30,

    includeWarmup:
      true,

    includeCooldown:
      true,

    ...options
  });
}


// =====================================================
// MOBILITY WORKOUT
// =====================================================

function buildMobilityWorkout(
  options =
    {}
) {
  return buildWorkout({
    goal:
      "mobility",

    durationMinutes:
      20,

    includeWarmup:
      false,

    includeCooldown:
      false,

    ...options
  });
}


// =====================================================
// STRENGTH WORKOUT
// =====================================================

function buildStrengthWorkout(
  options =
    {}
) {
  return buildWorkout({
    goal:
      "strength",

    durationMinutes:
      45,

    ...options
  });
}


// =====================================================
// HYPERTROPHY WORKOUT
// =====================================================

function buildHypertrophyWorkout(
  options =
    {}
) {
  return buildWorkout({
    goal:
      "muscle_building",

    durationMinutes:
      60,

    ...options
  });
}


// =====================================================
// SUBSTITUTE AN EXERCISE IN A BUILT WORKOUT
// =====================================================

function replaceExercise(
  workout,
  entryId,
  replacementExerciseId
) {
  if (
    !workout ||
    !entryId ||
    !replacementExerciseId
  ) {
    return workout;
  }

  const replacement =
    ExerciseRegistry.get(
      replacementExerciseId
    );

  if (!replacement) {
    return workout;
  }

  const cloned =
    structuredCloneSafe(
      workout
    );

  for (
    const block
    of asArray(
      cloned.blocks
    )
  ) {
    const index =
      asArray(
        block.exercises
      )
        .findIndex(
          exercise =>
            exercise.entryId ===
              entryId
        );

    if (
      index < 0
    ) {
      continue;
    }

    const existing =
      block.exercises[
        index
      ];

    block.exercises[
      index
    ] =
      createWorkoutExercise(
        replacement,
        {
          role:
            existing.role,

          prescription:
            {
              ...existing
                .prescription
            }
        }
      );

    block.exercises[
      index
    ].entryId =
      existing.entryId;

    return cloned;
  }

  return cloned;
}


// =====================================================
// REORDER EXERCISE
// =====================================================

function moveExercise(
  workout,
  entryId,
  {
    blockId =
      null,

    toIndex =
      0
  } = {}
) {
  const cloned =
    structuredCloneSafe(
      workout
    );

  let found =
    null;

  let sourceBlock =
    null;

  for (
    const block
    of asArray(
      cloned.blocks
    )
  ) {
    const index =
      asArray(
        block.exercises
      )
        .findIndex(
          exercise =>
            exercise.entryId ===
              entryId
        );

    if (
      index >= 0
    ) {
      found =
        block.exercises
          .splice(
            index,
            1
          )[0];

      sourceBlock =
        block;

      break;
    }
  }

  if (!found) {
    return cloned;
  }

  const targetBlock =
    blockId
      ? asArray(
          cloned.blocks
        )
          .find(
            block =>
              block.id ===
                blockId
          )
      : sourceBlock;

  if (!targetBlock) {
    sourceBlock
      .exercises
      .push(
        found
      );

    return cloned;
  }

  const safeIndex =
    clamp(
      Number(
        toIndex
      ) ||
      0,
      0,
      targetBlock
        .exercises
        .length
    );

  targetBlock
    .exercises
    .splice(
      safeIndex,
      0,
      found
    );

  cloned
    .estimatedDurationMinutes =
      estimateWorkoutDuration(
        cloned.blocks
      );

  return cloned;
}


// =====================================================
// REMOVE EXERCISE
// =====================================================

function removeExercise(
  workout,
  entryId
) {
  const cloned =
    structuredCloneSafe(
      workout
    );

  for (
    const block
    of asArray(
      cloned.blocks
    )
  ) {
    block.exercises =
      asArray(
        block.exercises
      )
        .filter(
          exercise =>
            exercise.entryId !==
              entryId
        );
  }

  cloned
    .estimatedDurationMinutes =
      estimateWorkoutDuration(
        cloned.blocks
      );

  return cloned;
}


// =====================================================
// ADD EXERCISE
// =====================================================

function addExercise(
  workout,
  exerciseId,
  {
    blockId =
      "accessory",

    role =
      "accessory",

    prescription =
      null
  } = {}
) {
  const exercise =
    ExerciseRegistry.get(
      exerciseId
    );

  if (!exercise) {
    return workout;
  }

  const cloned =
    structuredCloneSafe(
      workout
    );

  let block =
    asArray(
      cloned.blocks
    )
      .find(
        item =>
          item.id ===
            blockId
      );

  if (!block) {
    block = {
      id:
        blockId,

      label:
        titleFromId(
          blockId
        ),

      type:
        blockId,

      exercises:
        []
    };

    cloned.blocks.push(
      block
    );
  }

  block.exercises.push(
    createWorkoutExercise(
      exercise,
      {
        role,

        prescription:
          prescription ||
          createStrengthPrescription(
            exercise,
            normalizeBuildRequest({
              goal:
                cloned.goal,

              difficulty:
                cloned.difficulty
            }),
            {
              primary:
                role ===
                  "primary"
            }
          )
      }
    )
  );

  cloned
    .estimatedDurationMinutes =
      estimateWorkoutDuration(
        cloned.blocks
      );

  return cloned;
}


// =====================================================
// SERIALIZATION
// =====================================================

function toPlanDay(
  workout,
  {
    day =
      null
  } = {}
) {
  if (!workout) {
    return null;
  }

  const exercises =
    asArray(
      workout.blocks
    )
      .flatMap(
        block =>
          asArray(
            block.exercises
          )
      )
      .filter(
        entry =>
          ![
            "warmup",
            "cooldown"
          ].includes(
            entry.role
          )
      )
      .map(
        entry =>
          workoutEntryToPlanExercise(
            entry
          )
      );

  return {
    day,

    type:
      workout.type ===
        "cardio"
        ? "cardio"
        : "workout",

    title:
      workout.title,

    goal:
      workout.goal,

    sport:
      workout.sport,

    estimatedDurationMinutes:
      workout
        .estimatedDurationMinutes,

    exercises,

    metadata: {
      source:
        SOURCE,

      builderVersion:
        VERSION,

      workoutId:
        workout.workoutId
    }
  };
}


function workoutEntryToPlanExercise(
  entry
) {
  const prescription =
    entry.prescription ||
    {};

  const result = {
    exerciseId:
      entry.exerciseId,

    intensity:
      prescription
        .intensity ||
      null
  };

  if (
    Number(
      prescription.sets
    ) > 0
  ) {
    result.sets =
      Number(
        prescription.sets
      );
  }

  if (
    Number(
      prescription.reps
    ) > 0
  ) {
    result.reps =
      Number(
        prescription.reps
      );
  }

  if (
    Number(
      prescription
        .restSeconds
    ) >= 0
  ) {
    result.restSeconds =
      Number(
        prescription
          .restSeconds
      );
  }

  if (
    Number(
      prescription
        .durationSeconds
    ) > 0
  ) {
    result.durationSeconds =
      Number(
        prescription
          .durationSeconds
      );
  }

  if (
    Number(
      prescription
        .durationMinutes
    ) > 0
  ) {
    result.durationMinutes =
      Number(
        prescription
          .durationMinutes
      );
  }

  if (
    Number(
      prescription.rounds
    ) > 0
  ) {
    result.rounds =
      Number(
        prescription.rounds
      );
  }

  if (
    Number(
      prescription
        .workSeconds
    ) > 0
  ) {
    result.workSeconds =
      Number(
        prescription
          .workSeconds
      );
  }

  return result;
}


// =====================================================
// VALIDATION
// =====================================================

function validateWorkout(
  workout
) {
  const errors = [];
  const warnings = [];

  if (
    !workout ||
    typeof workout !==
      "object"
  ) {
    return {
      valid:
        false,

      errors: [
        "Workout is missing or invalid."
      ],

      warnings
    };
  }

  if (
    !workout.workoutId
  ) {
    errors.push(
      "Workout is missing workoutId."
    );
  }

  if (
    !workout.title
  ) {
    errors.push(
      "Workout is missing title."
    );
  }

  if (
    !Array.isArray(
      workout.blocks
    )
  ) {
    errors.push(
      "Workout blocks must be an array."
    );
  }

  for (
    const block
    of asArray(
      workout.blocks
    )
  ) {
    if (
      !Array.isArray(
        block.exercises
      )
    ) {
      errors.push(
        `Block "${block.id || "unknown"}" exercises must be an array.`
      );

      continue;
    }

    for (
      const entry
      of block.exercises
    ) {
      if (
        !entry.exerciseId
      ) {
        errors.push(
          "Workout exercise entry is missing exerciseId."
        );

        continue;
      }

      if (
        !ExerciseRegistry.has(
          entry.exerciseId
        )
      ) {
        errors.push(
          `Unknown exercise "${entry.exerciseId}".`
        );
      }

      if (
        !entry.prescription
      ) {
        warnings.push(
          `Exercise "${entry.exerciseId}" has no prescription.`
        );
      }
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
    warnings
  };
}


// =====================================================
// CLONE
// =====================================================

function structuredCloneSafe(
  value
) {
  if (
    typeof structuredClone ===
      "function"
  ) {
    return structuredClone(
      value
    );
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
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
      asArray(
        ExerciseRegistry.all
      ).length,

    supportedGoals:
      Object.keys(
        GOAL_DEFAULTS
      ),

    defaultDurationMinutes:
      DEFAULT_DURATION_MINUTES,

    minimumDurationMinutes:
      MIN_DURATION_MINUTES,

    maximumDurationMinutes:
      MAX_DURATION_MINUTES
  };
}


// =====================================================
// PUBLIC API
// =====================================================

const AriTrainingWorkoutBuilder =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    build:
      buildWorkout,

    quick:
      buildQuickWorkout,

    strength:
      buildStrengthWorkout,

    hypertrophy:
      buildHypertrophyWorkout,

    cardio:
      buildCardioWorkout,

    mobility:
      buildMobilityWorkout,

    surfing:
      buildSurfWorkout,

    replaceExercise,

    moveExercise,

    removeExercise,

    addExercise,

    toPlanDay,

    validate:
      validateWorkout,

    estimateDuration:
      estimateWorkoutDuration,

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

  Ari.training.workoutBuilder =
    AriTrainingWorkoutBuilder;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,

  buildWorkout,
  buildQuickWorkout,
  buildStrengthWorkout,
  buildHypertrophyWorkout,
  buildCardioWorkout,
  buildMobilityWorkout,
  buildSurfWorkout,

  replaceExercise,
  moveExercise,
  removeExercise,
  addExercise,

  toPlanDay,
  validateWorkout,
  estimateWorkoutDuration,

  getDiagnostics,

  AriTrainingWorkoutBuilder
};

export default
  AriTrainingWorkoutBuilder;
