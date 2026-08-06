// =====================================================
// ARI REBIRTH
// File: js/training/workout-progress-store.js
// Version: 1.1.0
// Purpose:
//   Persistent execution-progress state for ARI Training.
//
// V1.1.0:
//   - Stores calorie estimates for each completed set.
//   - Stores calorie estimates for single-completion activities.
//   - Preserves completion timestamps per set/activity.
//   - Calculates exercise, day, and weekly calorie totals.
//   - Accepts externally calculated calorie estimates from the
//     ARI Training execution/calorie layer.
//   - Keeps training calories separate from nutrition calories.
//
// Responsibilities:
//   - Track completed sets for strength/core exercises.
//   - Track one-step completion for cardio/recovery activities.
//   - Calculate exercise progress.
//   - Calculate workout-day completion automatically.
//   - Track estimated calories burned from completed work.
//   - Persist progress locally.
//   - Keep execution state separate from workout-plan definition.
// =====================================================

const VERSION = "1.1.0";
const SOURCE = "js/training/workout-progress-store";

const STORAGE_KEY =
  "ari_training_workout_progress_v1";

const DAYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
]);

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}

function normalizeId(value) {
  const text =
    normalizeText(value);

  return text || null;
}

function normalizeDay(value) {
  const day =
    normalizeText(value)
      .toLowerCase();

  return DAYS.includes(day)
    ? day
    : null;
}

function normalizePositiveInteger(
  value
) {
  const number =
    Number(value);

  return Number.isInteger(number) &&
    number > 0
      ? number
      : null;
}

function normalizeCalories(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(number) &&
    number >= 0
      ? number
      : null;
}

function roundCalories(
  value
) {
  const number =
    normalizeCalories(
      value
    );

  if (number === null) {
    return 0;
  }

  return Math.round(
    number * 10
  ) / 10;
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

function createEmptyDayState() {
  return {
    status:
      "not_started",

    completed:
      false,

    startedAt:
      null,

    completedAt:
      null,

    exercises:
      {}
  };
}

function createInitialState() {
  return {
    version:
      VERSION,

    source:
      SOURCE,

    planKey:
      null,

    weekKey:
      null,

    days:
      DAYS.reduce(
        (result, day) => {
          result[day] =
            createEmptyDayState();

          return result;
        },
        {}
      ),

    metadata: {
      createdAt:
        null,

      updatedAt:
        null
    }
  };
}

const state =
  createInitialState();

const listeners =
  new Set();

function touch() {
  const now =
    new Date()
      .toISOString();

  if (
    !state.metadata
      .createdAt
  ) {
    state.metadata
      .createdAt =
        now;
  }

  state.metadata
    .updatedAt =
      now;
}

function emit() {
  const snapshot =
    getState();

  for (
    const listener
    of listeners
  ) {
    try {
      listener(
        snapshot
      );
    } catch (error) {
      console.warn(
        "ARI Training workout-progress listener failed.",
        error
      );
    }
  }
}

function subscribe(listener) {
  if (
    typeof listener !==
      "function"
  ) {
    throw new TypeError(
      "WorkoutProgressStore.subscribe requires a function."
    );
  }

  listeners.add(
    listener
  );

  return () => {
    listeners.delete(
      listener
    );
  };
}

function getState() {
  return clone(
    state
  );
}

function getDay(day) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return null;
  }

  return clone(
    state.days[
      normalizedDay
    ]
  );
}

function normalizeSetRecord(
  value
) {
  /*
   * Backward compatibility with V1.0.0:
   *
   * completedSets["1"] = true
   *
   * becomes:
   *
   * completedSets["1"] = {
   *   completed: true,
   *   completedAt: null,
   *   estimatedCalories: 0
   * }
   */
  if (
    typeof value ===
      "boolean"
  ) {
    return {
      completed:
        value,

      completedAt:
        null,

      estimatedCalories:
        0
    };
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return {
      completed:
        Boolean(
          value.completed
        ),

      completedAt:
        value.completedAt ||
        null,

      estimatedCalories:
        roundCalories(
          value.estimatedCalories
        )
    };
  }

  return {
    completed:
      false,

    completedAt:
      null,

    estimatedCalories:
      0
  };
}

function getExerciseProgress(
  day,
  exerciseId
) {
  const normalizedDay =
    normalizeDay(day);

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (
    !normalizedDay ||
    !normalizedExerciseId
  ) {
    return null;
  }

  const progress =
    state.days[
      normalizedDay
    ]
      .exercises[
        normalizedExerciseId
      ];

  return progress
    ? clone(progress)
    : null;
}

function ensureExerciseProgress({
  day,
  exerciseId,
  requiredSets = null,
  completionMode = null
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (
    !normalizedDay ||
    !normalizedExerciseId
  ) {
    return null;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  let progress =
    dayState.exercises[
      normalizedExerciseId
    ];

  const resolvedRequiredSets =
    normalizePositiveInteger(
      requiredSets
    );

  const resolvedMode =
    completionMode ||
    (
      resolvedRequiredSets
        ? "sets"
        : "single"
    );

  if (!progress) {
    progress = {
      exerciseId:
        normalizedExerciseId,

      completionMode:
        resolvedMode,

      requiredSets:
        resolvedRequiredSets,

      completedSets:
        {},

      completed:
        false,

      startedAt:
        null,

      completedAt:
        null,

      estimatedCalories:
        0
    };

    dayState.exercises[
      normalizedExerciseId
    ] =
      progress;
  } else {
    progress.completionMode =
      resolvedMode;

    if (
      resolvedRequiredSets !==
        null
    ) {
      progress.requiredSets =
        resolvedRequiredSets;
    }

    progress.estimatedCalories =
      roundCalories(
        progress.estimatedCalories
      );

    if (
      !progress.completedSets ||
      typeof progress.completedSets !==
        "object"
    ) {
      progress.completedSets =
        {};
    }

    for (
      const [
        setNumber,
        setValue
      ]
      of Object.entries(
        progress.completedSets
      )
    ) {
      progress.completedSets[
        setNumber
      ] =
        normalizeSetRecord(
          setValue
        );
    }
  }

  return progress;
}

function markDayStarted(
  day
) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    !dayState.startedAt
  ) {
    dayState.startedAt =
      new Date()
        .toISOString();
  }

  if (
    dayState.status ===
      "not_started"
  ) {
    dayState.status =
      "in_progress";
  }

  touch();
  persist();
  emit();

  return true;
}

function setSetCompleted({
  day,
  exerciseId,
  setNumber,
  completed = true,
  requiredSets = null,
  estimatedCalories = null
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  const normalizedSet =
    normalizePositiveInteger(
      setNumber
    );

  if (
    !normalizedDay ||
    !normalizedExerciseId ||
    !normalizedSet
  ) {
    return false;
  }

  const progress =
    ensureExerciseProgress({
      day:
        normalizedDay,

      exerciseId:
        normalizedExerciseId,

      requiredSets,

      completionMode:
        "sets"
    });

  if (!progress) {
    return false;
  }

  markDayStarted(
    normalizedDay
  );

  const setKey =
    String(
      normalizedSet
    );

  const previous =
    normalizeSetRecord(
      progress.completedSets[
        setKey
      ]
    );

  const isCompleted =
    Boolean(
      completed
    );

  const resolvedCalories =
    normalizeCalories(
      estimatedCalories
    );

  progress.completedSets[
    setKey
  ] = {
    completed:
      isCompleted,

    completedAt:
      isCompleted
        ? previous.completedAt ||
          new Date()
            .toISOString()
        : null,

    estimatedCalories:
      isCompleted
        ? roundCalories(
            resolvedCalories !==
              null
              ? resolvedCalories
              : previous
                  .estimatedCalories
          )
        : 0
  };

  progress.startedAt =
    progress.startedAt ||
    new Date()
      .toISOString();

  recalculateExerciseCompletion(
    progress
  );

  recalculateDayCompletion(
    normalizedDay
  );

  touch();
  persist();
  emit();

  return true;
}

function toggleSetCompleted({
  day,
  exerciseId,
  setNumber,
  requiredSets = null,
  estimatedCalories = null
} = {}) {
  const progress =
    ensureExerciseProgress({
      day,
      exerciseId,
      requiredSets,
      completionMode:
        "sets"
    });

  const normalizedSet =
    normalizePositiveInteger(
      setNumber
    );

  if (
    !progress ||
    !normalizedSet
  ) {
    return false;
  }

  const current =
    normalizeSetRecord(
      progress.completedSets[
        String(
          normalizedSet
        )
      ]
    );

  return setSetCompleted({
    day,
    exerciseId,

    setNumber:
      normalizedSet,

    completed:
      !current.completed,

    requiredSets,

    estimatedCalories
  });
}

function setSetCalories({
  day,
  exerciseId,
  setNumber,
  estimatedCalories
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  const normalizedSet =
    normalizePositiveInteger(
      setNumber
    );

  const calories =
    normalizeCalories(
      estimatedCalories
    );

  if (
    !normalizedDay ||
    !normalizedExerciseId ||
    !normalizedSet ||
    calories === null
  ) {
    return false;
  }

  const progress =
    ensureExerciseProgress({
      day:
        normalizedDay,

      exerciseId:
        normalizedExerciseId,

      completionMode:
        "sets"
    });

  if (!progress) {
    return false;
  }

  const setKey =
    String(
      normalizedSet
    );

  const current =
    normalizeSetRecord(
      progress.completedSets[
        setKey
      ]
    );

  progress.completedSets[
    setKey
  ] = {
    ...current,

    estimatedCalories:
      current.completed
        ? roundCalories(
            calories
          )
        : 0
  };

  recalculateExerciseCompletion(
    progress
  );

  touch();
  persist();
  emit();

  return true;
}

function setExerciseCompleted({
  day,
  exerciseId,
  completed = true,
  estimatedCalories = null
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (
    !normalizedDay ||
    !normalizedExerciseId
  ) {
    return false;
  }

  const progress =
    ensureExerciseProgress({
      day:
        normalizedDay,

      exerciseId:
        normalizedExerciseId,

      completionMode:
        "single"
    });

  if (!progress) {
    return false;
  }

  markDayStarted(
    normalizedDay
  );

  const isCompleted =
    Boolean(
      completed
    );

  const calories =
    normalizeCalories(
      estimatedCalories
    );

  progress.completed =
    isCompleted;

  progress.startedAt =
    progress.startedAt ||
    new Date()
      .toISOString();

  progress.completedAt =
    isCompleted
      ? progress.completedAt ||
        new Date()
          .toISOString()
      : null;

  progress.estimatedCalories =
    isCompleted
      ? roundCalories(
          calories !==
            null
            ? calories
            : progress
                .estimatedCalories
        )
      : 0;

  recalculateDayCompletion(
    normalizedDay
  );

  touch();
  persist();
  emit();

  return true;
}

function toggleExerciseCompleted({
  day,
  exerciseId,
  estimatedCalories = null
} = {}) {
  const progress =
    ensureExerciseProgress({
      day,
      exerciseId,
      completionMode:
        "single"
    });

  if (!progress) {
    return false;
  }

  return setExerciseCompleted({
    day,
    exerciseId,

    completed:
      !progress.completed,

    estimatedCalories
  });
}

function getSetCalories(
  progress
) {
  if (
    !progress ||
    !progress.completedSets
  ) {
    return 0;
  }

  return roundCalories(
    Object.values(
      progress.completedSets
    )
      .map(
        normalizeSetRecord
      )
      .reduce(
        (
          total,
          setRecord
        ) =>
          total +
          (
            setRecord.completed
              ? setRecord
                  .estimatedCalories
              : 0
          ),
        0
      )
  );
}

function recalculateExerciseCompletion(
  progress
) {
  if (
    !progress ||
    typeof progress !==
      "object"
  ) {
    return false;
  }

  if (
    progress.completionMode ===
      "single"
  ) {
    progress.completed =
      Boolean(
        progress.completed
      );

    progress.estimatedCalories =
      progress.completed
        ? roundCalories(
            progress
              .estimatedCalories
          )
        : 0;

    return progress.completed;
  }

  const requiredSets =
    normalizePositiveInteger(
      progress.requiredSets
    );

  if (!requiredSets) {
    progress.completed =
      false;

    progress.completedAt =
      null;

    progress.estimatedCalories =
      getSetCalories(
        progress
      );

    return false;
  }

  let completedCount =
    0;

  for (
    let setNumber = 1;
    setNumber <=
      requiredSets;
    setNumber += 1
  ) {
    const setKey =
      String(
        setNumber
      );

    const setRecord =
      normalizeSetRecord(
        progress.completedSets[
          setKey
        ]
      );

    progress.completedSets[
      setKey
    ] =
      setRecord;

    if (
      setRecord.completed
    ) {
      completedCount +=
        1;
    }
  }

  progress.completed =
    completedCount ===
      requiredSets;

  progress.completedAt =
    progress.completed
      ? progress.completedAt ||
        new Date()
          .toISOString()
      : null;

  /*
   * For set-based exercises, exercise calories are always
   * the sum of the completed-set calorie estimates.
   */
  progress.estimatedCalories =
    getSetCalories(
      progress
    );

  return progress.completed;
}

function recalculateDayCompletion(
  day,
  exerciseDefinitions = null
) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    Array.isArray(
      exerciseDefinitions
    )
  ) {
    if (
      exerciseDefinitions.length ===
        0
    ) {
      dayState.completed =
        false;

      dayState.status =
        "not_started";

      dayState.completedAt =
        null;

      return false;
    }

    const complete =
      exerciseDefinitions.every(
        definition => {
          const exerciseId =
            normalizeId(
              definition
                ?.exerciseId
            );

          if (!exerciseId) {
            return false;
          }

          const progress =
            ensureExerciseProgress({
              day:
                normalizedDay,

              exerciseId,

              requiredSets:
                definition
                  ?.requiredSets,

              completionMode:
                definition
                  ?.completionMode
            });

          if (!progress) {
            return false;
          }

          recalculateExerciseCompletion(
            progress
          );

          return progress.completed ===
            true;
        }
      );

    dayState.completed =
      complete;

    dayState.status =
      complete
        ? "complete"
        : dayState.startedAt
          ? "in_progress"
          : "not_started";

    dayState.completedAt =
      complete
        ? dayState.completedAt ||
          new Date()
            .toISOString()
        : null;

    return complete;
  }

  const exercises =
    Object.values(
      dayState.exercises
    );

  if (
    exercises.length ===
      0
  ) {
    dayState.completed =
      false;

    dayState.status =
      dayState.startedAt
        ? "in_progress"
        : "not_started";

    dayState.completedAt =
      null;

    return false;
  }

  const complete =
    exercises.every(
      progress => {
        recalculateExerciseCompletion(
          progress
        );

        return progress.completed ===
          true;
      }
    );

  dayState.completed =
    complete;

  dayState.status =
    complete
      ? "complete"
      : dayState.startedAt
        ? "in_progress"
        : "not_started";

  dayState.completedAt =
    complete
      ? dayState.completedAt ||
        new Date()
          .toISOString()
      : null;

  return complete;
}

function syncDayWithPlan({
  day,
  exercises = [],
  dayType = "workout"
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayType ===
      "off"
  ) {
    dayState.status =
      "rest";

    dayState.completed =
      false;

    dayState.completedAt =
      null;

    dayState.exercises =
      {};

    touch();
    persist();
    emit();

    return true;
  }

  const allowedIds =
    new Set();

  const definitions =
    [];

  for (
    const exercise
    of exercises
  ) {
    const exerciseId =
      normalizeId(
        exercise
          ?.exerciseId
      );

    if (!exerciseId) {
      continue;
    }

    allowedIds.add(
      exerciseId
    );

    const requiredSets =
      normalizePositiveInteger(
        exercise.sets
      );

    const completionMode =
      requiredSets
        ? "sets"
        : "single";

    ensureExerciseProgress({
      day:
        normalizedDay,

      exerciseId,

      requiredSets,

      completionMode
    });

    definitions.push({
      exerciseId,
      requiredSets,
      completionMode
    });
  }

  for (
    const exerciseId
    of Object.keys(
      dayState.exercises
    )
  ) {
    if (
      !allowedIds.has(
        exerciseId
      )
    ) {
      delete dayState.exercises[
        exerciseId
      ];
    }
  }

  recalculateDayCompletion(
    normalizedDay,
    definitions
  );

  touch();
  persist();
  emit();

  return true;
}

function syncWeekWithPlan(
  week
) {
  if (
    !week ||
    typeof week !==
      "object"
  ) {
    return false;
  }

  for (
    const day
    of DAYS
  ) {
    const dayState =
      week[
        day
      ];

    syncDayWithPlan({
      day,

      dayType:
        dayState?.type ||
        "off",

      exercises:
        Array.isArray(
          dayState?.exercises
        )
          ? dayState.exercises
          : []
    });
  }

  return true;
}

function getExerciseSummary(
  day,
  exerciseId
) {
  const progress =
    getExerciseProgress(
      day,
      exerciseId
    );

  if (!progress) {
    return null;
  }

  const requiredSets =
    normalizePositiveInteger(
      progress.requiredSets
    ) || 0;

  let completedSets =
    0;

  if (
    progress.completionMode ===
      "sets"
  ) {
    for (
      let setNumber = 1;
      setNumber <=
        requiredSets;
      setNumber += 1
    ) {
      const setRecord =
        normalizeSetRecord(
          progress.completedSets[
            String(
              setNumber
            )
          ]
        );

      if (
        setRecord.completed
      ) {
        completedSets +=
          1;
      }
    }
  }

  return {
    exerciseId:
      progress.exerciseId,

    completionMode:
      progress.completionMode,

    completed:
      Boolean(
        progress.completed
      ),

    requiredSets,

    completedSets,

    estimatedCalories:
      roundCalories(
        progress.estimatedCalories
      ),

    startedAt:
      progress.startedAt,

    completedAt:
      progress.completedAt
  };
}

function getDayCalories(
  day
) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return 0;
  }

  return roundCalories(
    Object.values(
      state.days[
        normalizedDay
      ].exercises
    ).reduce(
      (
        total,
        progress
      ) => {
        recalculateExerciseCompletion(
          progress
        );

        return total +
          (
            normalizeCalories(
              progress
                .estimatedCalories
            ) || 0
          );
      },
      0
    )
  );
}

function getDaySummary(
  day
) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return null;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  const exercises =
    Object.values(
      dayState.exercises
    );

  let requiredSets =
    0;

  let completedSets =
    0;

  let completedExercises =
    0;

  for (
    const progress
    of exercises
  ) {
    recalculateExerciseCompletion(
      progress
    );

    if (
      progress.completionMode ===
        "sets"
    ) {
      const required =
        normalizePositiveInteger(
          progress.requiredSets
        ) || 0;

      requiredSets +=
        required;

      for (
        let setNumber = 1;
        setNumber <=
          required;
        setNumber += 1
      ) {
        const setRecord =
          normalizeSetRecord(
            progress.completedSets[
              String(
                setNumber
              )
            ]
          );

        if (
          setRecord.completed
        ) {
          completedSets +=
            1;
        }
      }
    }

    if (
      progress.completed
    ) {
      completedExercises +=
        1;
    }
  }

  return {
    day:
      normalizedDay,

    status:
      dayState.status,

    completed:
      dayState.completed,

    exerciseCount:
      exercises.length,

    completedExercises,

    requiredSets,

    completedSets,

    estimatedCalories:
      getDayCalories(
        normalizedDay
      ),

    startedAt:
      dayState.startedAt,

    completedAt:
      dayState.completedAt
  };
}

function getWeekCalories() {
  return roundCalories(
    DAYS.reduce(
      (
        total,
        day
      ) =>
        total +
        getDayCalories(
          day
        ),
      0
    )
  );
}

function getWeekSummary() {
  const summaries =
    DAYS.map(
      day =>
        getDaySummary(
          day
        )
    );

  const completeDays =
    summaries.filter(
      summary =>
        summary?.status ===
          "complete"
    ).length;

  const inProgressDays =
    summaries.filter(
      summary =>
        summary?.status ===
          "in_progress"
    ).length;

  const restDays =
    summaries.filter(
      summary =>
        summary?.status ===
          "rest"
    ).length;

  const completedSets =
    summaries.reduce(
      (
        total,
        summary
      ) =>
        total +
        (
          summary
            ?.completedSets ||
          0
        ),
      0
    );

  const requiredSets =
    summaries.reduce(
      (
        total,
        summary
      ) =>
        total +
        (
          summary
            ?.requiredSets ||
          0
        ),
      0
    );

  return {
    completeDays,

    inProgressDays,

    restDays,

    completedSets,

    requiredSets,

    estimatedCalories:
      getWeekCalories(),

    days:
      summaries
  };
}

function setPlanContext({
  planKey = null,
  weekKey = null,
  resetIfChanged = true
} = {}) {
  const normalizedPlanKey =
    normalizeId(
      planKey
    );

  const normalizedWeekKey =
    normalizeId(
      weekKey
    );

  const changed =
    state.planKey !==
      normalizedPlanKey ||
    state.weekKey !==
      normalizedWeekKey;

  if (
    changed &&
    resetIfChanged
  ) {
    const fresh =
      createInitialState();

    state.days =
      fresh.days;

    state.metadata =
      fresh.metadata;
  }

  state.planKey =
    normalizedPlanKey;

  state.weekKey =
    normalizedWeekKey;

  touch();
  persist();
  emit();

  return changed;
}

function resetDay(day) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return false;
  }

  state.days[
    normalizedDay
  ] =
    createEmptyDayState();

  touch();
  persist();
  emit();

  return true;
}

function resetAll() {
  const fresh =
    createInitialState();

  state.planKey =
    fresh.planKey;

  state.weekKey =
    fresh.weekKey;

  state.days =
    fresh.days;

  state.metadata =
    fresh.metadata;

  persist();
  emit();

  return true;
}

function persist() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

    return true;
  } catch (error) {
    console.warn(
      "ARI Training workout progress could not persist locally.",
      error
    );

    return false;
  }
}

function hydrate() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return false;
    }

    const parsed =
      JSON.parse(
        raw
      );

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return false;
    }

    state.planKey =
      normalizeId(
        parsed.planKey
      );

    state.weekKey =
      normalizeId(
        parsed.weekKey
      );

    state.days =
      createInitialState()
        .days;

    for (
      const day
      of DAYS
    ) {
      const incoming =
        parsed.days?.[
          day
        ];

      if (
        incoming &&
        typeof incoming ===
          "object"
      ) {
        state.days[
          day
        ] = {
          ...createEmptyDayState(),
          ...clone(
            incoming
          ),

          exercises:
            incoming.exercises &&
            typeof incoming.exercises ===
              "object"
              ? clone(
                  incoming.exercises
                )
              : {}
        };

        for (
          const progress
          of Object.values(
            state.days[
              day
            ].exercises
          )
        ) {
          if (
            !progress ||
            typeof progress !==
              "object"
          ) {
            continue;
          }

          progress.estimatedCalories =
            roundCalories(
              progress
                .estimatedCalories
            );

          if (
            progress.completedSets &&
            typeof progress.completedSets ===
              "object"
          ) {
            for (
              const [
                setNumber,
                setValue
              ]
              of Object.entries(
                progress.completedSets
              )
            ) {
              progress.completedSets[
                setNumber
              ] =
                normalizeSetRecord(
                  setValue
                );
            }
          }

          recalculateExerciseCompletion(
            progress
          );
        }
      }
    }

    state.metadata = {
      ...createInitialState()
        .metadata,

      ...(
        parsed.metadata &&
        typeof parsed.metadata ===
          "object"
          ? clone(
              parsed.metadata
            )
          : {}
      )
    };

    emit();

    return true;
  } catch (error) {
    console.warn(
      "ARI Training workout progress could not hydrate.",
      error
    );

    return false;
  }
}

const AriTrainingWorkoutProgressStore =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    days:
      DAYS,

    getState,

    getDay,

    getExerciseProgress,

    getExerciseSummary,

    getDaySummary,

    getWeekSummary,

    getDayCalories,

    getWeekCalories,

    setPlanContext,

    markDayStarted,

    setSetCompleted,

    toggleSetCompleted,

    setSetCalories,

    setExerciseCompleted,

    toggleExerciseCompleted,

    recalculateDayCompletion,

    syncDayWithPlan,

    syncWeekWithPlan,

    resetDay,

    resetAll,

    persist,

    hydrate,

    subscribe
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

  Ari.training.workoutProgress =
    AriTrainingWorkoutProgressStore;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  STORAGE_KEY,
  DAYS,
  getState,
  getDay,
  getExerciseProgress,
  getExerciseSummary,
  getDaySummary,
  getWeekSummary,
  getDayCalories,
  getWeekCalories,
  setPlanContext,
  markDayStarted,
  setSetCompleted,
  toggleSetCompleted,
  setSetCalories,
  setExerciseCompleted,
  toggleExerciseCompleted,
  recalculateDayCompletion,
  syncDayWithPlan,
  syncWeekWithPlan,
  resetDay,
  resetAll,
  persist,
  hydrate,
  subscribe,
  AriTrainingWorkoutProgressStore
};

export default AriTrainingWorkoutProgressStore;
