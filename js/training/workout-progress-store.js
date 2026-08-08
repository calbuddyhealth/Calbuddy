// =====================================================
// ARI REBIRTH
// File: js/training/workout-progress-store.js
// Version: 2.0.0
// Purpose:
//   Persistent execution/session state for ARI Training.
//
// V2.0.0:
//   - Keeps live workout execution separate from plan definition.
//   - Uses stable entryId values instead of exerciseId as the
//     primary progress key.
//   - Supports duplicate exercises in the same workout.
//   - Supports session-specific exercise reordering.
//   - Supports temporary exercise substitutions.
//   - Supports adding unplanned exercises during a session.
//   - Supports skipping/removing an exercise for this session only.
//   - Stores started / paused / resumed / completed timestamps.
//   - Stores elapsed workout time.
//   - Stores average workout heart rate.
//   - Stores per-set and per-activity calorie estimates.
//   - Stores actual user-entered weight/reps/duration where useful.
//   - Preserves completion after refresh through localStorage.
//   - Migrates V1 progress data forward when possible.
//   - Produces completed-session snapshots suitable for history.
//   - Keeps training calories separate from Nutrition calories.
//
// Important separation:
//   workout-plan-store.js
//     = what the user planned.
//
//   workout-progress-store.js
//     = what happened during the workout.
//
// This store does NOT permanently modify the weekly plan when:
//   - exercises are reordered during a session
//   - a substitution is used
//   - an extra exercise is added
//   - an exercise is skipped
//
// A controller/UI can later explicitly copy session changes back
// into the plan if the user chooses "Update Plan".
// =====================================================

const VERSION =
  "2.0.0";

const SCHEMA_VERSION =
  2;

const SOURCE =
  "js/training/workout-progress-store";

const STORAGE_KEY =
  "ari_training_workout_progress_v2";

const LEGACY_STORAGE_KEYS =
  Object.freeze([
    "ari_training_workout_progress_v1"
  ]);


const DAYS =
  Object.freeze([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]);


const VALID_SESSION_STATUSES =
  Object.freeze([
    "not_started",
    "in_progress",
    "paused",
    "complete",
    "rest"
  ]);


const VALID_ENTRY_STATUSES =
  Object.freeze([
    "not_started",
    "in_progress",
    "complete",
    "skipped"
  ]);


const VALID_SOURCES =
  Object.freeze([
    "planned",
    "added",
    "substitution"
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
  ).trim();
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


function normalizeDay(
  value
) {
  const day =
    normalizeText(
      value
    )
      .toLowerCase();

  return DAYS.includes(
    day
  )
    ? day
    : null;
}


function normalizePositiveInteger(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number > 0
  )
    ? number
    : null;
}


function normalizeNonNegativeInteger(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number >= 0
  )
    ? number
    : null;
}


function normalizePositiveNumber(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isFinite(
      number
    ) &&
    number > 0
  )
    ? number
    : null;
}


function normalizeNonNegativeNumber(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isFinite(
      number
    ) &&
    number >= 0
  )
    ? number
    : null;
}


function normalizeCalories(
  value
) {
  const number =
    normalizeNonNegativeNumber(
      value
    );

  return number ===
    null
      ? null
      : Math.round(
          number *
          10
        ) /
        10;
}


function normalizeHeartRate(
  value
) {
  const number =
    Number(
      value
    );

  return (
    Number.isFinite(
      number
    ) &&
    number >= 30 &&
    number <= 240
  )
    ? Math.round(
        number
      )
    : null;
}


function normalizeSessionStatus(
  value,
  fallback =
    "not_started"
) {
  const status =
    normalizeText(
      value
    )
      .toLowerCase();

  return VALID_SESSION_STATUSES
    .includes(
      status
    )
      ? status
      : fallback;
}


function normalizeEntryStatus(
  value,
  fallback =
    "not_started"
) {
  const status =
    normalizeText(
      value
    )
      .toLowerCase();

  return VALID_ENTRY_STATUSES
    .includes(
      status
    )
      ? status
      : fallback;
}


function normalizeEntrySource(
  value,
  fallback =
    "planned"
) {
  const source =
    normalizeText(
      value
    )
      .toLowerCase();

  return VALID_SOURCES
    .includes(
      source
    )
      ? source
      : fallback;
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


function nowIso() {
  return new Date()
    .toISOString();
}


function createStableId(
  prefix =
    "session"
) {
  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        10
      );

  return (
    `${prefix}_` +
    `${Date.now()}_` +
    `${random}`
  );
}


function uniqueIds(
  values
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(
          normalizeId
        )
        .filter(Boolean)
    )
  ];
}


// =====================================================
// SET RECORDS
// =====================================================

function createEmptySetRecord(
  setNumber
) {
  return {
    setNumber:
      normalizePositiveInteger(
        setNumber
      ),

    completed:
      false,

    completedAt:
      null,

    reps:
      null,

    weight:
      null,

    durationSeconds:
      null,

    estimatedCalories:
      0,

    notes:
      null
  };
}


function normalizeSetRecord(
  value,
  setNumber =
    null
) {
  /*
   * V1 compatibility:
   * completedSets["1"] = true
   */
  if (
    typeof value ===
      "boolean"
  ) {
    return {
      ...createEmptySetRecord(
        setNumber
      ),

      completed:
        value
    };
  }

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return createEmptySetRecord(
      setNumber
    );
  }

  const resolvedSetNumber =
    normalizePositiveInteger(
      value.setNumber ??
      setNumber
    );

  return {
    setNumber:
      resolvedSetNumber,

    completed:
      Boolean(
        value.completed
      ),

    completedAt:
      value.completedAt ||
      null,

    reps:
      normalizeNonNegativeInteger(
        value.reps
      ),

    weight:
      normalizeNonNegativeNumber(
        value.weight
      ),

    durationSeconds:
      normalizeNonNegativeNumber(
        value.durationSeconds
      ),

    estimatedCalories:
      normalizeCalories(
        value.estimatedCalories
      ) ||
      0,

    notes:
      normalizeText(
        value.notes
      ) ||
      null
  };
}


// =====================================================
// ENTRY CREATION
// =====================================================

function createEntryFromPlanExercise(
  exercise,
  {
    source =
      "planned",

    originalIndex =
      null
  } = {}
) {
  if (
    !exercise ||
    typeof exercise !==
      "object"
  ) {
    return null;
  }

  const exerciseId =
    normalizeId(
      exercise.exerciseId
    );

  if (!exerciseId) {
    return null;
  }

  const entryId =
    normalizeId(
      exercise.entryId
    ) ||
    createStableId(
      "session_entry"
    );

  const requiredSets =
    normalizePositiveInteger(
      exercise.sets
    );

  const completionMode =
    requiredSets
      ? "sets"
      : "single";

  const completedSets = {};

  if (
    requiredSets
  ) {
    for (
      let setNumber = 1;
      setNumber <=
        requiredSets;
      setNumber += 1
    ) {
      completedSets[
        String(
          setNumber
        )
      ] =
        createEmptySetRecord(
          setNumber
        );
    }
  }

  return {
    entryId,

    exerciseId,

    source:
      normalizeEntrySource(
        source
      ),

    substitutedFromEntryId:
      null,

    substitutedFromExerciseId:
      null,

    originalIndex:
      Number.isInteger(
        Number(
          originalIndex
        )
      )
        ? Number(
            originalIndex
          )
        : null,

    role:
      normalizeId(
        exercise.role
      ),

    completionMode,

    requiredSets,

    prescription: {
      sets:
        requiredSets,

      reps:
        normalizePositiveInteger(
          exercise.reps
        ),

      restSeconds:
        normalizeNonNegativeNumber(
          exercise.restSeconds ??
          exercise.rest_seconds
        ),

      durationMinutes:
        normalizePositiveNumber(
          exercise.durationMinutes ??
          exercise.duration_minutes
        ),

      durationSeconds:
        normalizePositiveNumber(
          exercise.durationSeconds ??
          exercise.duration_seconds
        ),

      rounds:
        normalizePositiveInteger(
          exercise.rounds
        ),

      workSeconds:
        normalizePositiveNumber(
          exercise.workSeconds ??
          exercise.work_seconds
        ),

      weight:
        normalizeNonNegativeNumber(
          exercise.weight
        ),

      addedWeight:
        normalizeNonNegativeNumber(
          exercise.addedWeight ??
          exercise.added_weight
        ),

      distance:
        normalizePositiveNumber(
          exercise.distance
        ),

      intensity:
        normalizeId(
          exercise.intensity
        )
    },

    status:
      "not_started",

    completed:
      false,

    startedAt:
      null,

    completedAt:
      null,

    skippedAt:
      null,

    completedSets,

    actual: {
      reps:
        null,

      weight:
        null,

      durationMinutes:
        null,

      durationSeconds:
        null,

      distance:
        null,

      notes:
        null
    },

    estimatedCalories:
      0,

    metadata: {
      ...(
        exercise.metadata &&
        typeof exercise.metadata ===
          "object"
          ? clone(
              exercise.metadata
            )
          : {}
      )
    }
  };
}


// =====================================================
// DAY / SESSION CREATION
// =====================================================

function createEmptyDayState() {
  return {
    sessionId:
      null,

    plannedWorkoutId:
      null,

    status:
      "not_started",

    startedAt:
      null,

    pausedAt:
      null,

    completedAt:
      null,

    lastResumedAt:
      null,

    elapsedSeconds:
      0,

    averageHeartRate:
      null,

    exercises:
      {},

    originalOrder:
      [],

    sessionOrder:
      [],

    notes:
      null,

    estimatedCalories:
      0,

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      historyArchivedAt:
        null
    }
  };
}


function createInitialState() {
  return {
    schemaVersion:
      SCHEMA_VERSION,

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
        (
          result,
          day
        ) => {
          result[
            day
          ] =
            createEmptyDayState();

          return result;
        },
        {}
      ),

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      migratedFrom:
        null
    }
  };
}


const state =
  createInitialState();

const listeners =
  new Set();


// =====================================================
// EVENTS
// =====================================================

function touch() {
  const now =
    nowIso();

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


function touchDay(
  dayState
) {
  if (
    !dayState.metadata
  ) {
    dayState.metadata = {
      createdAt:
        null,

      updatedAt:
        null,

      historyArchivedAt:
        null
    };
  }

  const now =
    nowIso();

  if (
    !dayState.metadata
      .createdAt
  ) {
    dayState.metadata
      .createdAt =
        now;
  }

  dayState.metadata
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
    } catch (
      error
    ) {
      console.warn(
        "ARI Training workout-progress listener failed.",
        error
      );
    }
  }
}


function subscribe(
  listener
) {
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


// =====================================================
// READ API
// =====================================================

function getState() {
  return clone(
    state
  );
}


function getDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return null;
  }

  return clone(
    state.days[
      normalizedDay
    ]
  );
}


function getEntry(
  day,
  entryId
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !normalizedDay ||
    !normalizedEntryId
  ) {
    return null;
  }

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        normalizedEntryId
      ];

  return entry
    ? clone(
        entry
      )
    : null;
}


function getEntryByExerciseId(
  day,
  exerciseId
) {
  const normalizedDay =
    normalizeDay(
      day
    );

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

  const entryId =
    dayState.sessionOrder
      .find(
        id =>
          dayState
            .exercises[
              id
            ]
            ?.exerciseId ===
            normalizedExerciseId
      );

  if (!entryId) {
    return null;
  }

  return getEntry(
    normalizedDay,
    entryId
  );
}


function getExerciseProgress(
  day,
  entryIdOrExerciseId
) {
  /*
   * V2 prefers entryId.
   * For backward compatibility, if an entryId is not found,
   * this falls back to the first matching exerciseId.
   */
  const byEntry =
    getEntry(
      day,
      entryIdOrExerciseId
    );

  if (byEntry) {
    return byEntry;
  }

  return getEntryByExerciseId(
    day,
    entryIdOrExerciseId
  );
}


// =====================================================
// SESSION INITIALIZATION
// =====================================================

function syncDayWithPlan({
  day,
  exercises =
    [],

  dayType =
    "workout",

  workoutId =
    null,

  preserveSessionChanges =
    true
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

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
    state.days[
      normalizedDay
    ] = {
      ...createEmptyDayState(),

      status:
        "rest"
    };

    touch();
    persist();
    emit();

    return true;
  }

  const existingEntries =
    dayState.exercises ||
    {};

  const nextEntries = {};

  const nextOriginalOrder = [];

  const plannedExercises =
    Array.isArray(
      exercises
    )
      ? exercises
      : [];

  for (
    let index = 0;
    index <
      plannedExercises.length;
    index += 1
  ) {
    const planExercise =
      plannedExercises[
        index
      ];

    const preferredEntryId =
      normalizeId(
        planExercise
          ?.entryId
      ) ||
      createStableId(
        "session_entry"
      );

    const existing =
      existingEntries[
        preferredEntryId
      ];

    const fresh =
      createEntryFromPlanExercise(
        {
          ...planExercise,

          entryId:
            preferredEntryId
        },
        {
          source:
            "planned",

          originalIndex:
            index
        }
      );

    if (!fresh) {
      continue;
    }

    nextOriginalOrder.push(
      preferredEntryId
    );

    if (
      existing
    ) {
      nextEntries[
        preferredEntryId
      ] =
        mergeExistingEntryWithPlan(
          existing,
          fresh
        );
    } else {
      nextEntries[
        preferredEntryId
      ] =
        fresh;
    }
  }

  if (
    preserveSessionChanges
  ) {
    for (
      const [
        entryId,
        entry
      ]
      of Object.entries(
        existingEntries
      )
    ) {
      if (
        nextEntries[
          entryId
        ]
      ) {
        continue;
      }

      if (
        [
          "added",
          "substitution"
        ].includes(
          entry.source
        )
      ) {
        nextEntries[
          entryId
        ] =
          clone(
            entry
          );
      }
    }
  }

  dayState.exercises =
    nextEntries;

  dayState.originalOrder =
    nextOriginalOrder;

  const validExistingOrder =
    (
      preserveSessionChanges
        ? dayState.sessionOrder
        : []
    )
      .filter(
        entryId =>
          Boolean(
            nextEntries[
              entryId
            ]
          )
      );

  const missingOrderEntries =
    Object.keys(
      nextEntries
    )
      .filter(
        entryId =>
          !validExistingOrder
            .includes(
              entryId
            )
      );

  dayState.sessionOrder = [
    ...validExistingOrder,
    ...missingOrderEntries
  ];

  dayState.plannedWorkoutId =
    normalizeId(
      workoutId
    );

  if (
    dayState.status ===
      "rest"
  ) {
    dayState.status =
      "not_started";
  }

  recalculateDayCompletion(
    normalizedDay
  );

  touchDay(
    dayState
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

      workoutId:
        dayState?.workoutId ||
        null,

      exercises:
        Array.isArray(
          dayState?.exercises
        )
          ? dayState.exercises
          : [],

      preserveSessionChanges:
        true
    });
  }

  return true;
}


function mergeExistingEntryWithPlan(
  existing,
  fresh
) {
  const merged =
    clone(
      existing
    );

  merged.exerciseId =
    fresh.exerciseId;

  merged.role =
    fresh.role;

  merged.originalIndex =
    fresh.originalIndex;

  merged.prescription =
    fresh.prescription;

  merged.requiredSets =
    fresh.requiredSets;

  merged.completionMode =
    fresh.completionMode;

  if (
    merged.completionMode ===
      "sets"
  ) {
    merged.completedSets =
      merged.completedSets &&
      typeof merged.completedSets ===
        "object"
        ? merged.completedSets
        : {};

    for (
      let setNumber = 1;
      setNumber <=
        merged.requiredSets;
      setNumber += 1
    ) {
      const key =
        String(
          setNumber
        );

      merged.completedSets[
        key
      ] =
        normalizeSetRecord(
          merged.completedSets[
            key
          ],
          setNumber
        );
    }

    for (
      const key
      of Object.keys(
        merged.completedSets
      )
    ) {
      if (
        Number(
          key
        ) >
          merged.requiredSets
      ) {
        delete merged
          .completedSets[
            key
          ];
      }
    }
  } else {
    merged.completedSets =
      {};
  }

  recalculateEntryCompletion(
    merged
  );

  return merged;
}


// =====================================================
// SESSION LIFECYCLE
// =====================================================

function startDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayState.status ===
      "rest"
  ) {
    return false;
  }

  if (
    !dayState.sessionId
  ) {
    dayState.sessionId =
      createStableId(
        "workout_session"
      );
  }

  if (
    !dayState.startedAt
  ) {
    dayState.startedAt =
      nowIso();
  }

  if (
    dayState.status ===
      "paused"
  ) {
    dayState.lastResumedAt =
      nowIso();

    dayState.pausedAt =
      null;
  } else if (
    !dayState.lastResumedAt
  ) {
    dayState.lastResumedAt =
      dayState.startedAt;
  }

  dayState.status =
    "in_progress";

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function markDayStarted(
  day
) {
  return startDay(
    day
  );
}


function pauseDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayState.status !==
      "in_progress"
  ) {
    return false;
  }

  accumulateElapsedTime(
    dayState
  );

  dayState.status =
    "paused";

  dayState.pausedAt =
    nowIso();

  dayState.lastResumedAt =
    null;

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function resumeDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayState.status !==
      "paused"
  ) {
    return false;
  }

  dayState.status =
    "in_progress";

  dayState.pausedAt =
    null;

  dayState.lastResumedAt =
    nowIso();

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function completeDay(
  day,
  {
    force =
      false
  } = {}
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayState.status ===
      "rest"
  ) {
    return false;
  }

  if (
    !force
  ) {
    const complete =
      recalculateDayCompletion(
        normalizedDay
      );

    if (!complete) {
      return false;
    }
  }

  if (
    dayState.status ===
      "in_progress"
  ) {
    accumulateElapsedTime(
      dayState
    );
  }

  dayState.status =
    "complete";

  dayState.completedAt =
    dayState.completedAt ||
    nowIso();

  dayState.pausedAt =
    null;

  dayState.lastResumedAt =
    null;

  recalculateDayCalories(
    normalizedDay
  );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function accumulateElapsedTime(
  dayState
) {
  if (
    !dayState ||
    !dayState.lastResumedAt
  ) {
    return;
  }

  const started =
    new Date(
      dayState.lastResumedAt
    )
      .getTime();

  const ended =
    Date.now();

  if (
    !Number.isFinite(
      started
    ) ||
    ended <=
      started
  ) {
    dayState.lastResumedAt =
      null;

    return;
  }

  const deltaSeconds =
    Math.max(
      0,
      Math.floor(
        (
          ended -
          started
        ) /
        1000
      )
    );

  dayState.elapsedSeconds =
    (
      normalizeNonNegativeInteger(
        dayState.elapsedSeconds
      ) ||
      0
    ) +
    deltaSeconds;

  dayState.lastResumedAt =
    null;
}


function getElapsedSeconds(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return 0;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  let total =
    normalizeNonNegativeInteger(
      dayState.elapsedSeconds
    ) ||
    0;

  if (
    dayState.status ===
      "in_progress" &&
    dayState.lastResumedAt
  ) {
    const started =
      new Date(
        dayState.lastResumedAt
      )
        .getTime();

    const now =
      Date.now();

    if (
      Number.isFinite(
        started
      ) &&
      now >
        started
    ) {
      total +=
        Math.floor(
          (
            now -
            started
          ) /
          1000
        );
    }
  }

  return total;
}


// =====================================================
// HEART RATE / NOTES
// =====================================================

function setAverageHeartRate(
  day,
  value
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const heartRate =
    normalizeHeartRate(
      value
    );

  const dayState =
    state.days[
      normalizedDay
    ];

  dayState.averageHeartRate =
    heartRate;

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function setDayNotes(
  day,
  notes
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  dayState.notes =
    normalizeText(
      notes
    ) ||
    null;

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// ENTRY ORDER
// =====================================================

function moveEntry(
  day,
  entryId,
  toIndex
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !normalizedDay ||
    !normalizedEntryId
  ) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  const fromIndex =
    dayState.sessionOrder
      .indexOf(
        normalizedEntryId
      );

  if (
    fromIndex <
      0
  ) {
    return false;
  }

  const target =
    Math.max(
      0,
      Math.min(
        dayState
          .sessionOrder
          .length -
          1,
        Number(
          toIndex
        ) ||
        0
      )
    );

  if (
    fromIndex ===
      target
  ) {
    return true;
  }

  const [
    moved
  ] =
    dayState
      .sessionOrder
      .splice(
        fromIndex,
        1
      );

  dayState
    .sessionOrder
    .splice(
      target,
      0,
      moved
    );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// ADD / REMOVE / SKIP / SUBSTITUTE
// =====================================================

function addSessionExercise({
  day,
  exerciseId,
  entryId =
    null,

  role =
    "extra",

  prescription =
    {},

  metadata =
    {}
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

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

  if (
    dayState.status ===
      "rest"
  ) {
    return null;
  }

  const resolvedEntryId =
    normalizeId(
      entryId
    ) ||
    createStableId(
      "session_entry"
    );

  if (
    dayState.exercises[
      resolvedEntryId
    ]
  ) {
    return null;
  }

  const entry =
    createEntryFromPlanExercise(
      {
        entryId:
          resolvedEntryId,

        exerciseId:
          normalizedExerciseId,

        role,

        ...clone(
          prescription
        ),

        metadata
      },
      {
        source:
          "added",

        originalIndex:
          null
      }
    );

  if (!entry) {
    return null;
  }

  entry.source =
    "added";

  dayState.exercises[
    resolvedEntryId
  ] =
    entry;

  dayState.sessionOrder
    .push(
      resolvedEntryId
    );

  startDay(
    normalizedDay
  );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return clone(
    entry
  );
}


function skipEntry(
  day,
  entryId,
  skipped =
    true
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !normalizedDay ||
    !normalizedEntryId
  ) {
    return false;
  }

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        normalizedEntryId
      ];

  if (!entry) {
    return false;
  }

  if (
    skipped
  ) {
    entry.status =
      "skipped";

    entry.completed =
      false;

    entry.skippedAt =
      nowIso();

    entry.completedAt =
      null;
  } else {
    entry.status =
      "not_started";

    entry.skippedAt =
      null;
  }

  recalculateDayCompletion(
    normalizedDay
  );

  touchDay(
    state.days[
      normalizedDay
    ]
  );

  touch();
  persist();
  emit();

  return true;
}


function removeSessionEntry(
  day,
  entryId
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !normalizedDay ||
    !normalizedEntryId
  ) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  const entry =
    dayState.exercises[
      normalizedEntryId
    ];

  if (!entry) {
    return false;
  }

  /*
   * Planned entries should usually be skipped rather than
   * deleted so we still know the plan originally contained them.
   */
  if (
    entry.source ===
      "planned"
  ) {
    return skipEntry(
      normalizedDay,
      normalizedEntryId,
      true
    );
  }

  delete dayState
    .exercises[
      normalizedEntryId
    ];

  dayState.sessionOrder =
    dayState.sessionOrder
      .filter(
        id =>
          id !==
            normalizedEntryId
      );

  recalculateDayCompletion(
    normalizedDay
  );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function substituteEntry({
  day,
  entryId,
  replacementExerciseId,
  prescription =
    null,
  replacementEntryId =
    null
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  const normalizedReplacementId =
    normalizeId(
      replacementExerciseId
    );

  if (
    !normalizedDay ||
    !normalizedEntryId ||
    !normalizedReplacementId
  ) {
    return null;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  const original =
    dayState.exercises[
      normalizedEntryId
    ];

  if (!original) {
    return null;
  }

  const targetIndex =
    dayState.sessionOrder
      .indexOf(
        normalizedEntryId
      );

  const nextEntryId =
    normalizeId(
      replacementEntryId
    ) ||
    createStableId(
      "session_entry"
    );

  const replacement =
    createEntryFromPlanExercise(
      {
        entryId:
          nextEntryId,

        exerciseId:
          normalizedReplacementId,

        role:
          original.role,

        ...clone(
          prescription ||
          original.prescription
        )
      },
      {
        source:
          "substitution",

        originalIndex:
          original.originalIndex
      }
    );

  if (!replacement) {
    return null;
  }

  replacement.source =
    "substitution";

  replacement
    .substitutedFromEntryId =
      original.entryId;

  replacement
    .substitutedFromExerciseId =
      original.exerciseId;

  original.status =
    "skipped";

  original.skippedAt =
    nowIso();

  dayState.exercises[
    nextEntryId
  ] =
    replacement;

  if (
    targetIndex >=
      0
  ) {
    dayState.sessionOrder
      .splice(
        targetIndex,
        1,
        nextEntryId
      );
  } else {
    dayState.sessionOrder
      .push(
        nextEntryId
      );
  }

  startDay(
    normalizedDay
  );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return clone(
    replacement
  );
}


// =====================================================
// SET COMPLETION
// =====================================================

function setSetCompleted({
  day,
  entryId =
    null,
  exerciseId =
    null,
  setNumber,
  completed =
    true,
  requiredSets =
    null,
  estimatedCalories =
    null,
  reps =
    null,
  weight =
    null,
  durationSeconds =
    null,
  notes =
    null
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const normalizedSet =
    normalizePositiveInteger(
      setNumber
    );

  if (
    !normalizedDay ||
    !normalizedSet
  ) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      normalizedDay,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  startDay(
    normalizedDay
  );

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        resolvedEntry
      ];

  if (
    entry.status ===
      "skipped"
  ) {
    return false;
  }

  if (
    normalizePositiveInteger(
      requiredSets
    )
  ) {
    entry.requiredSets =
      normalizePositiveInteger(
        requiredSets
      );

    entry.completionMode =
      "sets";
  }

  const key =
    String(
      normalizedSet
    );

  const previous =
    normalizeSetRecord(
      entry.completedSets[
        key
      ],
      normalizedSet
    );

  const isCompleted =
    Boolean(
      completed
    );

  entry.completedSets[
    key
  ] = {
    setNumber:
      normalizedSet,

    completed:
      isCompleted,

    completedAt:
      isCompleted
        ? previous.completedAt ||
          nowIso()
        : null,

    reps:
      normalizeNonNegativeInteger(
        reps
      ) ??
      previous.reps,

    weight:
      normalizeNonNegativeNumber(
        weight
      ) ??
      previous.weight,

    durationSeconds:
      normalizeNonNegativeNumber(
        durationSeconds
      ) ??
      previous.durationSeconds,

    estimatedCalories:
      isCompleted
        ? (
            normalizeCalories(
              estimatedCalories
            ) ??
            previous
              .estimatedCalories ??
            0
          )
        : 0,

    notes:
      normalizeText(
        notes
      ) ||
      previous.notes ||
      null
  };

  entry.startedAt =
    entry.startedAt ||
    nowIso();

  entry.status =
    "in_progress";

  recalculateEntryCompletion(
    entry
  );

  recalculateDayCompletion(
    normalizedDay
  );

  touchDay(
    state.days[
      normalizedDay
    ]
  );

  touch();
  persist();
  emit();

  return true;
}


function toggleSetCompleted(
  options =
    {}
) {
  const normalizedDay =
    normalizeDay(
      options.day
    );

  if (!normalizedDay) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      normalizedDay,
      options.entryId,
      options.exerciseId
    );

  const normalizedSet =
    normalizePositiveInteger(
      options.setNumber
    );

  if (
    !resolvedEntry ||
    !normalizedSet
  ) {
    return false;
  }

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        resolvedEntry
      ];

  const current =
    normalizeSetRecord(
      entry.completedSets[
        String(
          normalizedSet
        )
      ],
      normalizedSet
    );

  return setSetCompleted({
    ...options,

    day:
      normalizedDay,

    entryId:
      resolvedEntry,

    completed:
      !current.completed
  });
}


function setSetCalories({
  day,
  entryId =
    null,
  exerciseId =
    null,
  setNumber,
  estimatedCalories
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
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
    !normalizedSet ||
    calories ===
      null
  ) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      normalizedDay,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        resolvedEntry
      ];

  const key =
    String(
      normalizedSet
    );

  const current =
    normalizeSetRecord(
      entry.completedSets[
        key
      ],
      normalizedSet
    );

  entry.completedSets[
    key
  ] = {
    ...current,

    estimatedCalories:
      current.completed
        ? calories
        : 0
  };

  recalculateEntryCompletion(
    entry
  );

  recalculateDayCalories(
    normalizedDay
  );

  touchDay(
    state.days[
      normalizedDay
    ]
  );

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// SINGLE ACTIVITY COMPLETION
// =====================================================

function setExerciseCompleted({
  day,
  entryId =
    null,
  exerciseId =
    null,
  completed =
    true,
  estimatedCalories =
    null,
  actual =
    null
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      normalizedDay,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  startDay(
    normalizedDay
  );

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        resolvedEntry
      ];

  if (
    entry.status ===
      "skipped"
  ) {
    return false;
  }

  const isCompleted =
    Boolean(
      completed
    );

  entry.completed =
    isCompleted;

  entry.startedAt =
    entry.startedAt ||
    nowIso();

  entry.completedAt =
    isCompleted
      ? entry.completedAt ||
        nowIso()
      : null;

  entry.status =
    isCompleted
      ? "complete"
      : "in_progress";

  entry.estimatedCalories =
    isCompleted
      ? (
          normalizeCalories(
            estimatedCalories
          ) ??
          entry.estimatedCalories ??
          0
        )
      : 0;

  if (
    actual &&
    typeof actual ===
      "object"
  ) {
    entry.actual = {
      ...entry.actual,

      ...clone(
        actual
      )
    };
  }

  recalculateDayCompletion(
    normalizedDay
  );

  touchDay(
    state.days[
      normalizedDay
    ]
  );

  touch();
  persist();
  emit();

  return true;
}


function toggleExerciseCompleted(
  options =
    {}
) {
  const normalizedDay =
    normalizeDay(
      options.day
    );

  if (!normalizedDay) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      normalizedDay,
      options.entryId,
      options.exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  const entry =
    state.days[
      normalizedDay
    ]
      .exercises[
        resolvedEntry
      ];

  return setExerciseCompleted({
    ...options,

    day:
      normalizedDay,

    entryId:
      resolvedEntry,

    completed:
      !entry.completed
  });
}


// =====================================================
// ENTRY COMPLETION / CALORIES
// =====================================================

function getSetCalories(
  entry
) {
  if (
    !entry ||
    !entry.completedSets
  ) {
    return 0;
  }

  return Math.round(
    Object.values(
      entry.completedSets
    )
      .map(
        value =>
          normalizeSetRecord(
            value
          )
      )
      .reduce(
        (
          total,
          setRecord
        ) =>
          total +
          (
            setRecord.completed
              ? (
                  normalizeCalories(
                    setRecord
                      .estimatedCalories
                  ) ||
                  0
                )
              : 0
          ),
        0
      ) *
    10
  ) /
  10;
}


function recalculateEntryCompletion(
  entry
) {
  if (
    !entry ||
    typeof entry !==
      "object"
  ) {
    return false;
  }

  if (
    entry.status ===
      "skipped"
  ) {
    entry.completed =
      false;

    entry.completedAt =
      null;

    return false;
  }

  if (
    entry.completionMode ===
      "single"
  ) {
    entry.completed =
      Boolean(
        entry.completed
      );

    entry.status =
      entry.completed
        ? "complete"
        : entry.startedAt
          ? "in_progress"
          : "not_started";

    entry.estimatedCalories =
      entry.completed
        ? (
            normalizeCalories(
              entry.estimatedCalories
            ) ||
            0
          )
        : 0;

    return entry.completed;
  }

  const requiredSets =
    normalizePositiveInteger(
      entry.requiredSets
    );

  if (!requiredSets) {
    entry.completed =
      false;

    entry.completedAt =
      null;

    entry.estimatedCalories =
      getSetCalories(
        entry
      );

    entry.status =
      entry.startedAt
        ? "in_progress"
        : "not_started";

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
    const key =
      String(
        setNumber
      );

    const normalized =
      normalizeSetRecord(
        entry.completedSets[
          key
        ],
        setNumber
      );

    entry.completedSets[
      key
    ] =
      normalized;

    if (
      normalized.completed
    ) {
      completedCount +=
        1;
    }
  }

  entry.completed =
    completedCount ===
      requiredSets;

  entry.completedAt =
    entry.completed
      ? entry.completedAt ||
        nowIso()
      : null;

  entry.status =
    entry.completed
      ? "complete"
      : completedCount >
          0 ||
        entry.startedAt
          ? "in_progress"
          : "not_started";

  entry.estimatedCalories =
    getSetCalories(
      entry
    );

  return entry.completed;
}


function recalculateDayCalories(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return 0;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  const total =
    dayState.sessionOrder
      .reduce(
        (
          sum,
          entryId
        ) => {
          const entry =
            dayState
              .exercises[
                entryId
              ];

          if (
            !entry ||
            entry.status ===
              "skipped"
          ) {
            return sum;
          }

          recalculateEntryCompletion(
            entry
          );

          return (
            sum +
            (
              normalizeCalories(
                entry.estimatedCalories
              ) ||
              0
            )
          );
        },
        0
      );

  dayState.estimatedCalories =
    Math.round(
      total *
      10
    ) /
    10;

  return dayState
    .estimatedCalories;
}


function recalculateDayCompletion(
  day,
  exerciseDefinitions =
    null
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    dayState.status ===
      "rest"
  ) {
    return false;
  }

  /*
   * V1 compatibility: callers may still pass exercise definitions.
   * In V2 we use them only to update required sets/modes where a
   * matching exercise can be resolved.
   */
  if (
    Array.isArray(
      exerciseDefinitions
    )
  ) {
    for (
      const definition
      of exerciseDefinitions
    ) {
      const entryId =
        resolveEntryReference(
          normalizedDay,
          definition
            ?.entryId,
          definition
            ?.exerciseId
        );

      if (!entryId) {
        continue;
      }

      const entry =
        dayState.exercises[
          entryId
        ];

      const requiredSets =
        normalizePositiveInteger(
          definition
            ?.requiredSets
        );

      if (requiredSets) {
        entry.requiredSets =
          requiredSets;

        entry.completionMode =
          "sets";
      } else if (
        definition
          ?.completionMode
      ) {
        entry.completionMode =
          definition
            .completionMode;
      }
    }
  }

  const activeEntries =
    dayState.sessionOrder
      .map(
        entryId =>
          dayState
            .exercises[
              entryId
            ]
      )
      .filter(
        entry =>
          entry &&
          entry.status !==
            "skipped"
      );

  if (
    activeEntries.length ===
      0
  ) {
    if (
      dayState.startedAt
    ) {
      dayState.status =
        "in_progress";
    } else {
      dayState.status =
        "not_started";
    }

    dayState.completedAt =
      null;

    recalculateDayCalories(
      normalizedDay
    );

    return false;
  }

  const complete =
    activeEntries.every(
      entry =>
        recalculateEntryCompletion(
          entry
        )
    );

  if (
    complete
  ) {
    if (
      dayState.status ===
        "in_progress"
    ) {
      accumulateElapsedTime(
        dayState
      );
    }

    dayState.status =
      "complete";

    dayState.completedAt =
      dayState.completedAt ||
      nowIso();

    dayState.pausedAt =
      null;

    dayState.lastResumedAt =
      null;
  } else if (
    dayState.status !==
      "paused"
  ) {
    dayState.status =
      dayState.startedAt
        ? "in_progress"
        : "not_started";

    dayState.completedAt =
      null;
  }

  recalculateDayCalories(
    normalizedDay
  );

  return complete;
}


// =====================================================
// ENTRY RESOLUTION
// =====================================================

function resolveEntryReference(
  day,
  entryId,
  exerciseId
) {
  const dayState =
    state.days[
      day
    ];

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    normalizedEntryId &&
    dayState.exercises[
      normalizedEntryId
    ]
  ) {
    return normalizedEntryId;
  }

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (!normalizedExerciseId) {
    return null;
  }

  return (
    dayState.sessionOrder
      .find(
        id =>
          dayState
            .exercises[
              id
            ]
            ?.exerciseId ===
            normalizedExerciseId
      ) ||
    null
  );
}


// =====================================================
// SUMMARIES
// =====================================================

function getExerciseSummary(
  day,
  entryIdOrExerciseId
) {
  const progress =
    getExerciseProgress(
      day,
      entryIdOrExerciseId
    );

  if (!progress) {
    return null;
  }

  const requiredSets =
    normalizePositiveInteger(
      progress.requiredSets
    ) ||
    0;

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
          ],
          setNumber
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
    entryId:
      progress.entryId,

    exerciseId:
      progress.exerciseId,

    source:
      progress.source,

    status:
      progress.status,

    completionMode:
      progress.completionMode,

    completed:
      Boolean(
        progress.completed
      ),

    requiredSets,

    completedSets,

    estimatedCalories:
      normalizeCalories(
        progress.estimatedCalories
      ) ||
      0,

    startedAt:
      progress.startedAt,

    completedAt:
      progress.completedAt,

    skippedAt:
      progress.skippedAt,

    substitutedFromEntryId:
      progress
        .substitutedFromEntryId,

    substitutedFromExerciseId:
      progress
        .substitutedFromExerciseId
  };
}


function getDayCalories(
  day
) {
  return recalculateDayCalories(
    day
  );
}


function getDaySummary(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return null;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  let requiredSets =
    0;

  let completedSets =
    0;

  let completedExercises =
    0;

  let skippedExercises =
    0;

  let addedExercises =
    0;

  let substitutions =
    0;

  for (
    const entryId
    of dayState.sessionOrder
  ) {
    const entry =
      dayState.exercises[
        entryId
      ];

    if (!entry) {
      continue;
    }

    recalculateEntryCompletion(
      entry
    );

    if (
      entry.status ===
        "skipped"
    ) {
      skippedExercises +=
        1;

      continue;
    }

    if (
      entry.source ===
        "added"
    ) {
      addedExercises +=
        1;
    }

    if (
      entry.source ===
        "substitution"
    ) {
      substitutions +=
        1;
    }

    if (
      entry.completionMode ===
        "sets"
    ) {
      const required =
        normalizePositiveInteger(
          entry.requiredSets
        ) ||
        0;

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
            entry.completedSets[
              String(
                setNumber
              )
            ],
            setNumber
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
      entry.completed
    ) {
      completedExercises +=
        1;
    }
  }

  return {
    day:
      normalizedDay,

    sessionId:
      dayState.sessionId,

    plannedWorkoutId:
      dayState.plannedWorkoutId,

    status:
      dayState.status,

    completed:
      dayState.status ===
        "complete",

    exerciseCount:
      dayState.sessionOrder
        .length,

    activeExerciseCount:
      dayState.sessionOrder
        .filter(
          entryId =>
            dayState
              .exercises[
                entryId
              ]
              ?.status !==
              "skipped"
        )
        .length,

    completedExercises,

    skippedExercises,

    addedExercises,

    substitutions,

    requiredSets,

    completedSets,

    estimatedCalories:
      recalculateDayCalories(
        normalizedDay
      ),

    elapsedSeconds:
      getElapsedSeconds(
        normalizedDay
      ),

    averageHeartRate:
      dayState
        .averageHeartRate,

    startedAt:
      dayState.startedAt,

    pausedAt:
      dayState.pausedAt,

    completedAt:
      dayState.completedAt,

    notes:
      dayState.notes
  };
}


function getWeekCalories() {
  return Math.round(
    DAYS.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          getDayCalories(
            day
          ) ||
          0
        ),
      0
    ) *
    10
  ) /
  10;
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

  const pausedDays =
    summaries.filter(
      summary =>
        summary?.status ===
          "paused"
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

  const elapsedSeconds =
    summaries.reduce(
      (
        total,
        summary
      ) =>
        total +
        (
          summary
            ?.elapsedSeconds ||
          0
        ),
      0
    );

  return {
    completeDays,

    inProgressDays,

    pausedDays,

    restDays,

    completedSets,

    requiredSets,

    estimatedCalories:
      getWeekCalories(),

    elapsedSeconds,

    days:
      summaries
  };
}


// =====================================================
// SESSION SNAPSHOT / HISTORY
// =====================================================

function createSessionSnapshot(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return null;
  }

  const dayState =
    state.days[
      normalizedDay
    ];

  if (
    !dayState.sessionId
  ) {
    return null;
  }

  return {
    schemaVersion:
      SCHEMA_VERSION,

    sessionId:
      dayState.sessionId,

    planKey:
      state.planKey,

    weekKey:
      state.weekKey,

    day:
      normalizedDay,

    plannedWorkoutId:
      dayState.plannedWorkoutId,

    status:
      dayState.status,

    startedAt:
      dayState.startedAt,

    completedAt:
      dayState.completedAt,

    elapsedSeconds:
      getElapsedSeconds(
        normalizedDay
      ),

    averageHeartRate:
      dayState.averageHeartRate,

    estimatedCalories:
      recalculateDayCalories(
        normalizedDay
      ),

    originalOrder: [
      ...dayState
        .originalOrder
    ],

    sessionOrder: [
      ...dayState
        .sessionOrder
    ],

    exercises:
      dayState.sessionOrder
        .map(
          entryId =>
            dayState
              .exercises[
                entryId
              ]
        )
        .filter(Boolean)
        .map(
          entry =>
            clone(
              entry
            )
        ),

    notes:
      dayState.notes,

    metadata: {
      source:
        SOURCE,

      version:
        VERSION,

      createdAt:
        dayState
          .metadata
          ?.createdAt ||
        null,

      updatedAt:
        dayState
          .metadata
          ?.updatedAt ||
        null
    }
  };
}


// =====================================================
// PLAN CONTEXT
// =====================================================

function setPlanContext({
  planKey =
    null,

  weekKey =
    null,

  resetIfChanged =
    true
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


// =====================================================
// RESET
// =====================================================

function resetDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

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

  state.schemaVersion =
    fresh.schemaVersion;

  state.version =
    fresh.version;

  state.source =
    fresh.source;

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


// =====================================================
// PERSISTENCE
// =====================================================

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
  } catch (
    error
  ) {
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

    if (raw) {
      const parsed =
        JSON.parse(
          raw
        );

      return replaceState(
        parsed
      );
    }

    return hydrateLegacy();
  } catch (
    error
  ) {
    console.warn(
      "ARI Training workout progress could not hydrate.",
      error
    );

    return hydrateLegacy();
  }
}


// =====================================================
// STATE REPLACEMENT
// =====================================================

function replaceState(
  incoming
) {
  if (
    !incoming ||
    typeof incoming !==
      "object"
  ) {
    return false;
  }

  const fresh =
    createInitialState();

  state.schemaVersion =
    SCHEMA_VERSION;

  state.version =
    VERSION;

  state.source =
    SOURCE;

  state.planKey =
    normalizeId(
      incoming.planKey
    );

  state.weekKey =
    normalizeId(
      incoming.weekKey
    );

  state.days =
    fresh.days;

  for (
    const day
    of DAYS
  ) {
    const sourceDay =
      incoming.days?.[
        day
      ];

    if (
      sourceDay &&
      typeof sourceDay ===
        "object"
    ) {
      state.days[
        day
      ] =
        normalizeIncomingDay(
          sourceDay
        );
    }
  }

  state.metadata = {
    ...fresh.metadata,

    ...(
      incoming.metadata &&
      typeof incoming.metadata ===
        "object"
        ? clone(
            incoming.metadata
          )
        : {}
    )
  };

  emit();

  return true;
}


function normalizeIncomingDay(
  sourceDay
) {
  const fresh =
    createEmptyDayState();

  const dayState = {
    ...fresh,

    ...clone(
      sourceDay
    )
  };

  dayState.sessionId =
    normalizeId(
      sourceDay.sessionId
    );

  dayState.plannedWorkoutId =
    normalizeId(
      sourceDay.plannedWorkoutId
    );

  dayState.status =
    normalizeSessionStatus(
      sourceDay.status
    );

  dayState.elapsedSeconds =
    normalizeNonNegativeInteger(
      sourceDay.elapsedSeconds
    ) ||
    0;

  dayState.averageHeartRate =
    normalizeHeartRate(
      sourceDay.averageHeartRate
    );

  dayState.originalOrder =
    uniqueIds(
      sourceDay.originalOrder
    );

  dayState.sessionOrder =
    uniqueIds(
      sourceDay.sessionOrder
    );

  dayState.exercises = {};

  const incomingExercises =
    sourceDay.exercises &&
    typeof sourceDay.exercises ===
      "object"
      ? sourceDay.exercises
      : {};

  for (
    const [
      entryId,
      rawEntry
    ]
    of Object.entries(
      incomingExercises
    )
  ) {
    if (
      !rawEntry ||
      typeof rawEntry !==
        "object"
    ) {
      continue;
    }

    const normalizedEntry =
      normalizeIncomingEntry(
        rawEntry,
        entryId
      );

    if (!normalizedEntry) {
      continue;
    }

    dayState.exercises[
      normalizedEntry.entryId
    ] =
      normalizedEntry;
  }

  if (
    dayState.sessionOrder
      .length ===
      0
  ) {
    dayState.sessionOrder =
      Object.keys(
        dayState.exercises
      );
  }

  if (
    dayState.originalOrder
      .length ===
      0
  ) {
    dayState.originalOrder =
      dayState.sessionOrder
        .filter(
          entryId =>
            dayState
              .exercises[
                entryId
              ]
              ?.source ===
              "planned"
        );
  }

  dayState.sessionOrder =
    dayState.sessionOrder
      .filter(
        entryId =>
          Boolean(
            dayState.exercises[
              entryId
            ]
          )
      );

  for (
    const entryId
    of Object.keys(
      dayState.exercises
    )
  ) {
    if (
      !dayState.sessionOrder
        .includes(
          entryId
        )
    ) {
      dayState.sessionOrder
        .push(
          entryId
        );
    }
  }

  recalculateDayCaloriesForState(
    dayState
  );

  return dayState;
}


function normalizeIncomingEntry(
  rawEntry,
  fallbackEntryId
) {
  const exerciseId =
    normalizeId(
      rawEntry.exerciseId
    );

  if (!exerciseId) {
    return null;
  }

  const entryId =
    normalizeId(
      rawEntry.entryId ??
      fallbackEntryId
    ) ||
    createStableId(
      "session_entry"
    );

  const entry = {
    ...createEntryFromPlanExercise(
      {
        entryId,

        exerciseId,

        role:
          rawEntry.role,

        sets:
          rawEntry.requiredSets ??
          rawEntry.prescription
            ?.sets,

        reps:
          rawEntry.prescription
            ?.reps,

        restSeconds:
          rawEntry.prescription
            ?.restSeconds,

        durationMinutes:
          rawEntry.prescription
            ?.durationMinutes,

        durationSeconds:
          rawEntry.prescription
            ?.durationSeconds,

        rounds:
          rawEntry.prescription
            ?.rounds,

        workSeconds:
          rawEntry.prescription
            ?.workSeconds,

        weight:
          rawEntry.prescription
            ?.weight,

        addedWeight:
          rawEntry.prescription
            ?.addedWeight,

        distance:
          rawEntry.prescription
            ?.distance,

        intensity:
          rawEntry.prescription
            ?.intensity,

        metadata:
          rawEntry.metadata
      },
      {
        source:
          rawEntry.source,

        originalIndex:
          rawEntry.originalIndex
      }
    ),

    ...clone(
      rawEntry
    ),

    entryId,

    exerciseId,

    source:
      normalizeEntrySource(
        rawEntry.source
      ),

    status:
      normalizeEntryStatus(
        rawEntry.status
      ),

    requiredSets:
      normalizePositiveInteger(
        rawEntry.requiredSets
      ),

    completed:
      Boolean(
        rawEntry.completed
      ),

    estimatedCalories:
      normalizeCalories(
        rawEntry.estimatedCalories
      ) ||
      0
  };

  entry.completedSets = {};

  const incomingSets =
    rawEntry.completedSets &&
    typeof rawEntry.completedSets ===
      "object"
      ? rawEntry.completedSets
      : {};

  for (
    const [
      key,
      value
    ]
    of Object.entries(
      incomingSets
    )
  ) {
    const setNumber =
      normalizePositiveInteger(
        key
      );

    if (!setNumber) {
      continue;
    }

    entry.completedSets[
      String(
        setNumber
      )
    ] =
      normalizeSetRecord(
        value,
        setNumber
      );
  }

  recalculateEntryCompletion(
    entry
  );

  return entry;
}


function recalculateDayCaloriesForState(
  dayState
) {
  const total =
    dayState.sessionOrder
      .reduce(
        (
          sum,
          entryId
        ) => {
          const entry =
            dayState.exercises[
              entryId
            ];

          if (
            !entry ||
            entry.status ===
              "skipped"
          ) {
            return sum;
          }

          recalculateEntryCompletion(
            entry
          );

          return (
            sum +
            (
              normalizeCalories(
                entry.estimatedCalories
              ) ||
              0
            )
          );
        },
        0
      );

  dayState.estimatedCalories =
    Math.round(
      total *
      10
    ) /
    10;
}


// =====================================================
// V1 MIGRATION
// =====================================================

function hydrateLegacy() {
  if (
    typeof localStorage ===
      "undefined"
  ) {
    return false;
  }

  for (
    const legacyKey
    of LEGACY_STORAGE_KEYS
  ) {
    try {
      const raw =
        localStorage.getItem(
          legacyKey
        );

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(
          raw
        );

      const migrated =
        migrateV1State(
          parsed
        );

      if (!migrated) {
        continue;
      }

      replaceState(
        migrated
      );

      state.metadata
        .migratedFrom =
          legacyKey;

      persist();

      return true;
    } catch (
      error
    ) {
      console.warn(
        `ARI Training progress could not migrate legacy key "${legacyKey}".`,
        error
      );
    }
  }

  return false;
}


function migrateV1State(
  legacy
) {
  if (
    !legacy ||
    typeof legacy !==
      "object"
  ) {
    return null;
  }

  const migrated =
    createInitialState();

  migrated.planKey =
    normalizeId(
      legacy.planKey
    );

  migrated.weekKey =
    normalizeId(
      legacy.weekKey
    );

  for (
    const day
    of DAYS
  ) {
    const legacyDay =
      legacy.days?.[
        day
      ];

    if (
      !legacyDay ||
      typeof legacyDay !==
        "object"
    ) {
      continue;
    }

    const nextDay =
      createEmptyDayState();

    nextDay.status =
      normalizeSessionStatus(
        legacyDay.status
      );

    nextDay.startedAt =
      legacyDay.startedAt ||
      null;

    nextDay.completedAt =
      legacyDay.completedAt ||
      null;

    nextDay.sessionId =
      legacyDay.startedAt
        ? createStableId(
            "migrated_session"
          )
        : null;

    const legacyExercises =
      legacyDay.exercises &&
      typeof legacyDay.exercises ===
        "object"
        ? legacyDay.exercises
        : {};

    let index =
      0;

    for (
      const [
        exerciseId,
        legacyProgress
      ]
      of Object.entries(
        legacyExercises
      )
    ) {
      const entryId =
        createStableId(
          "migrated_entry"
        );

      const requiredSets =
        normalizePositiveInteger(
          legacyProgress
            ?.requiredSets
        );

      const entry =
        createEntryFromPlanExercise(
          {
            entryId,
            exerciseId,
            sets:
              requiredSets
          },
          {
            source:
              "planned",

            originalIndex:
              index
          }
        );

      if (!entry) {
        continue;
      }

      entry.status =
        legacyProgress
          ?.completed
          ? "complete"
          : legacyProgress
              ?.startedAt
            ? "in_progress"
            : "not_started";

      entry.completed =
        Boolean(
          legacyProgress
            ?.completed
        );

      entry.startedAt =
        legacyProgress
          ?.startedAt ||
        null;

      entry.completedAt =
        legacyProgress
          ?.completedAt ||
        null;

      entry.estimatedCalories =
        normalizeCalories(
          legacyProgress
            ?.estimatedCalories
        ) ||
        0;

      if (
        legacyProgress
          ?.completedSets &&
        typeof legacyProgress
          .completedSets ===
          "object"
      ) {
        entry.completedSets =
          {};

        for (
          const [
            setKey,
            setValue
          ]
          of Object.entries(
            legacyProgress
              .completedSets
          )
        ) {
          const setNumber =
            normalizePositiveInteger(
              setKey
            );

          if (!setNumber) {
            continue;
          }

          entry.completedSets[
            String(
              setNumber
            )
          ] =
            normalizeSetRecord(
              setValue,
              setNumber
            );
        }
      }

      recalculateEntryCompletion(
        entry
      );

      nextDay.exercises[
        entryId
      ] =
        entry;

      nextDay.originalOrder
        .push(
          entryId
        );

      nextDay.sessionOrder
        .push(
          entryId
        );

      index +=
        1;
    }

    recalculateDayCaloriesForState(
      nextDay
    );

    migrated.days[
      day
    ] =
      nextDay;
  }

  migrated.metadata = {
    ...migrated.metadata,

    migratedFrom:
      "ari_training_workout_progress_v1",

    migratedAt:
      nowIso()
  };

  return migrated;
}


// =====================================================
// VALIDATION
// =====================================================

function validate() {
  const errors = [];
  const warnings = [];

  for (
    const day
    of DAYS
  ) {
    const dayState =
      state.days[
        day
      ];

    if (!dayState) {
      errors.push(
        `Missing progress state for "${day}".`
      );

      continue;
    }

    if (
      !VALID_SESSION_STATUSES
        .includes(
          dayState.status
        )
    ) {
      errors.push(
        `Day "${day}" has invalid session status "${dayState.status}".`
      );
    }

    const orderIds =
      new Set(
        dayState.sessionOrder
      );

    for (
      const entryId
      of dayState.sessionOrder
    ) {
      if (
        !dayState.exercises[
          entryId
        ]
      ) {
        errors.push(
          `Day "${day}" sessionOrder references missing entry "${entryId}".`
        );
      }
    }

    for (
      const [
        entryId,
        entry
      ]
      of Object.entries(
        dayState.exercises
      )
    ) {
      if (
        !entry.entryId
      ) {
        errors.push(
          `Day "${day}" contains an entry without entryId.`
        );
      }

      if (
        entry.entryId !==
          entryId
      ) {
        warnings.push(
          `Day "${day}" entry key "${entryId}" differs from entry.entryId "${entry.entryId}".`
        );
      }

      if (
        !entry.exerciseId
      ) {
        errors.push(
          `Day "${day}" entry "${entryId}" has no exerciseId.`
        );
      }

      if (
        !VALID_ENTRY_STATUSES
          .includes(
            entry.status
          )
      ) {
        errors.push(
          `Day "${day}" entry "${entryId}" has invalid status "${entry.status}".`
        );
      }

      if (
        !VALID_SOURCES
          .includes(
            entry.source
          )
      ) {
        errors.push(
          `Day "${day}" entry "${entryId}" has invalid source "${entry.source}".`
        );
      }

      if (
        !orderIds.has(
          entryId
        )
      ) {
        warnings.push(
          `Day "${day}" entry "${entryId}" is not present in sessionOrder.`
        );
      }
    }
  }

  return {
    valid:
      errors.length ===
        0,

    schemaVersion:
      SCHEMA_VERSION,

    errorCount:
      errors.length,

    warningCount:
      warnings.length,

    errors,

    warnings
  };
}


// =====================================================
// DIAGNOSTICS
// =====================================================

function getDiagnostics() {
  return {
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    legacyStorageKeys: [
      ...LEGACY_STORAGE_KEYS
    ],

    planKey:
      state.planKey,

    weekKey:
      state.weekKey,

    weekSummary:
      getWeekSummary(),

    validation:
      validate()
  };
}


// =====================================================
// PUBLIC STORE
// =====================================================

const AriTrainingWorkoutProgressStore =
  Object.freeze({
    version:
      VERSION,

    schemaVersion:
      SCHEMA_VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    legacyStorageKeys:
      LEGACY_STORAGE_KEYS,

    days:
      DAYS,

    getState,

    getDay,

    getEntry,

    getEntryByExerciseId,

    getExerciseProgress,

    getExerciseSummary,

    getDaySummary,

    getWeekSummary,

    getDayCalories,

    getWeekCalories,

    getElapsedSeconds,

    createSessionSnapshot,

    setPlanContext,

    syncDayWithPlan,

    syncWeekWithPlan,

    startDay,

    markDayStarted,

    pauseDay,

    resumeDay,

    completeDay,

    setAverageHeartRate,

    setDayNotes,

    moveEntry,

    addSessionExercise,

    substituteEntry,

    skipEntry,

    removeSessionEntry,

    setSetCompleted,

    toggleSetCompleted,

    setSetCalories,

    setExerciseCompleted,

    toggleExerciseCompleted,

    recalculateDayCompletion,

    replaceState,

    hydrate,

    persist,

    resetDay,

    resetAll,

    subscribe,

    validate,

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

  Ari.training.workoutProgress =
    AriTrainingWorkoutProgressStore;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SCHEMA_VERSION,
  SOURCE,

  STORAGE_KEY,
  LEGACY_STORAGE_KEYS,

  DAYS,

  getState,
  getDay,

  getEntry,
  getEntryByExerciseId,

  getExerciseProgress,
  getExerciseSummary,

  getDaySummary,
  getWeekSummary,

  getDayCalories,
  getWeekCalories,

  getElapsedSeconds,

  createSessionSnapshot,

  setPlanContext,

  syncDayWithPlan,
  syncWeekWithPlan,

  startDay,
  markDayStarted,

  pauseDay,
  resumeDay,
  completeDay,

  setAverageHeartRate,
  setDayNotes,

  moveEntry,

  addSessionExercise,
  substituteEntry,
  skipEntry,
  removeSessionEntry,

  setSetCompleted,
  toggleSetCompleted,
  setSetCalories,

  setExerciseCompleted,
  toggleExerciseCompleted,

  recalculateDayCompletion,

  replaceState,

  hydrate,
  persist,

  resetDay,
  resetAll,

  subscribe,

  validate,
  getDiagnostics,

  AriTrainingWorkoutProgressStore
};

export default
  AriTrainingWorkoutProgressStore;
