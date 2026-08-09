// =====================================================
// ARI REBIRTH
// File: js/training/workout-progress-store.js
// Version: 3.0.0
// Purpose:
//   Persistent date-specific workout execution/session state
//   for ARI Training.
//
// V3.0.0:
//   - Replaces repeating weekday-only progress with real dates.
//   - Sessions are stored by YYYY-MM-DD.
//   - Keeps compatibility with older weekday calls such as
//     getDay("monday") by resolving them inside activeWeekKey.
//   - Supports Sunday-Saturday planning weeks.
//   - Prevents an Off Day / Recovery Day from becoming a formal
//     workout session when the controller blocks it.
//   - Adds cancelDay() so accidental "Start Workout" taps can be
//     completely undone without modifying the workout plan.
//   - Cancel restores the original planned exercise list,
//     order, prescriptions, completion state, HR, timer, and notes.
//   - Adds completed-session history snapshots.
//   - Adds deleteSessionRecord() for accidentally recorded history.
//   - Adds clearSessionHistory() with optional month/date filters.
//   - Adds monthly-history helpers.
//   - Keeps live session edits separate from permanent plan edits.
//   - Supports duplicate exercises through stable entryId values.
//   - Supports live reordering, substitutions, added exercises,
//     skipping, set completion, calories, actual reps/weight/time.
//   - Migrates V2 and V1 local progress forward when possible.
//
// Important separation:
//
//   workout-plan-store.js
//     = what the user PLANS on a specific date.
//
//   workout-progress-store.js
//     = what the user is CURRENTLY doing.
//
//   history records in this file
//     = completed execution snapshots only.
//
// Future:
//   History can later be moved into workout-history-store.js
//   without changing the public controller contract.
// =====================================================

const VERSION =
  "3.0.0";

const SCHEMA_VERSION =
  3;

const SOURCE =
  "js/training/workout-progress-store";

const STORAGE_KEY =
  "ari_training_workout_progress_v3";

const LEGACY_STORAGE_KEYS =
  Object.freeze([
    "ari_training_workout_progress_v2",
    "ari_training_workout_progress_v1"
  ]);

const DAYS =
  Object.freeze([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ]);

const DAY_INDEX =
  Object.freeze({
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  });

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
// BASIC NORMALIZATION
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
          number * 10
        ) / 10;
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


// =====================================================
// DATE / WEEK HELPERS
// =====================================================

function toLocalDate(
  value =
    new Date()
) {
  if (
    value instanceof Date
  ) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  const text =
    normalizeText(
      value
    );

  if (
    /^\d{4}-\d{2}-\d{2}$/
      .test(
        text
      )
  ) {
    const [
      year,
      month,
      day
    ] =
      text
        .split("-")
        .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    ) {
      return date;
    }
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
}


function formatDateKey(
  value =
    new Date()
) {
  const date =
    toLocalDate(
      value
    );

  if (!date) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}-` +
    `${String(
      date.getDate()
    ).padStart(
      2,
      "0"
    )}`
  );
}


function getWeekStartDate(
  value =
    new Date()
) {
  const date =
    toLocalDate(
      value
    );

  if (!date) {
    return null;
  }

  const sunday =
    new Date(
      date
    );

  sunday.setDate(
    sunday.getDate() -
    sunday.getDay()
  );

  return sunday;
}


function getWeekKey(
  value =
    new Date()
) {
  return formatDateKey(
    getWeekStartDate(
      value
    )
  );
}


function getDayDateForWeek(
  weekKey,
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const weekStart =
    toLocalDate(
      weekKey
    );

  if (
    !normalizedDay ||
    !weekStart
  ) {
    return null;
  }

  const date =
    new Date(
      weekStart
    );

  date.setDate(
    date.getDate() +
    DAY_INDEX[
      normalizedDay
    ]
  );

  return formatDateKey(
    date
  );
}


function getDayIdFromDate(
  value
) {
  const date =
    toLocalDate(
      value
    );

  if (!date) {
    return null;
  }

  return DAYS[
    date.getDay()
  ];
}


function resolveDateKey(
  dayOrDate,
  weekKey =
    state.activeWeekKey
) {
  const text =
    normalizeText(
      dayOrDate
    );

  if (
    /^\d{4}-\d{2}-\d{2}$/
      .test(
        text
      )
  ) {
    return formatDateKey(
      text
    );
  }

  const day =
    normalizeDay(
      dayOrDate
    );

  if (
    day
  ) {
    const resolvedWeek =
      normalizeId(
        weekKey
      ) ||
      getWeekKey(
        new Date()
      );

    return getDayDateForWeek(
      resolvedWeek,
      day
    );
  }

  return null;
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

  const completedSets =
    {};

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
// SESSION / DAY CREATION
// =====================================================

function createEmptyDayState({
  date =
    null,

  day =
    null,

  dayType =
    "workout"
} = {}) {
  const resolvedDate =
    formatDateKey(
      date
    );

  const resolvedDay =
    normalizeDay(
      day
    ) ||
    getDayIdFromDate(
      resolvedDate
    );

  const rest =
    dayType ===
      "off" ||
    dayType ===
      "recovery";

  return {
    date:
      resolvedDate,

    day:
      resolvedDay,

    dayType:
      rest
        ? dayType
        : "workout",

    sessionId:
      null,

    plannedWorkoutId:
      null,

    status:
      rest
        ? "rest"
        : "not_started",

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
        null,

      planSyncedAt:
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

    activeWeekKey:
      getWeekKey(
        new Date()
      ),

    sessionsByDate:
      {},

    history:
      {},

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      migratedFrom:
        null,

      migratedAt:
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
        null,

      planSyncedAt:
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
// STATE / READ API
// =====================================================

function getDaysProjection(
  weekKey =
    state.activeWeekKey
) {
  const result = {};

  for (
    const day
    of DAYS
  ) {
    const date =
      getDayDateForWeek(
        weekKey,
        day
      );

    result[
      day
    ] =
      clone(
        state.sessionsByDate[
          date
        ] ||
        createEmptyDayState({
          date,
          day,
          dayType:
            "workout"
        })
      );
  }

  return result;
}


function getState() {
  return {
    ...clone(
      state
    ),

    /*
     * Compatibility projection for V2 callers that expect
     * state.days.monday / state.days.tuesday ...
     */
    days:
      getDaysProjection(
        state.activeWeekKey
      ),

    weekKey:
      state.activeWeekKey
  };
}


function getDay(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return null;
  }

  const existing =
    state.sessionsByDate[
      date
    ];

  if (existing) {
    return clone(
      existing
    );
  }

  return createEmptyDayState({
    date,
    day:
      getDayIdFromDate(
        date
      ),
    dayType:
      "workout"
  });
}


function getDayByDate(
  date
) {
  return getDay(
    date
  );
}


function getEntry(
  dayOrDate,
  entryId
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !date ||
    !normalizedEntryId
  ) {
    return null;
  }

  const entry =
    state.sessionsByDate[
      date
    ]
      ?.exercises?.[
        normalizedEntryId
      ];

  return entry
    ? clone(
        entry
      )
    : null;
}


function getEntryByExerciseId(
  dayOrDate,
  exerciseId
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (
    !date ||
    !normalizedExerciseId
  ) {
    return null;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return null;
  }

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
    date,
    entryId
  );
}


function getExerciseProgress(
  dayOrDate,
  entryIdOrExerciseId
) {
  const byEntry =
    getEntry(
      dayOrDate,
      entryIdOrExerciseId
    );

  if (byEntry) {
    return byEntry;
  }

  return getEntryByExerciseId(
    dayOrDate,
    entryIdOrExerciseId
  );
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
    false
} = {}) {
  const normalizedPlanKey =
    normalizeId(
      planKey
    );

  const normalizedWeekKey =
    normalizeId(
      weekKey
    ) ||
    getWeekKey(
      new Date()
    );

  const planChanged =
    state.planKey !==
      normalizedPlanKey;

  const weekChanged =
    state.activeWeekKey !==
      normalizedWeekKey;

  /*
   * V3 intentionally does NOT erase every other week when
   * navigating the calendar. Progress is date-specific.
   *
   * resetIfChanged is only honored when the plan identity itself
   * changes, not when the user browses another week.
   */
  if (
    planChanged &&
    resetIfChanged
  ) {
    state.sessionsByDate =
      {};
  }

  state.planKey =
    normalizedPlanKey;

  state.activeWeekKey =
    normalizedWeekKey;

  touch();
  persist();
  emit();

  return (
    planChanged ||
    weekChanged
  );
}


// =====================================================
// PLAN -> SESSION SYNC
// =====================================================

function syncDayWithPlan({
  day =
    null,

  date =
    null,

  exercises =
    [],

  dayType =
    "workout",

  workoutId =
    null,

  preserveSessionChanges =
    true
} = {}) {
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
      day
    );

  if (!resolvedDate) {
    return false;
  }

  const resolvedDay =
    normalizeDay(
      day
    ) ||
    getDayIdFromDate(
      resolvedDate
    );

  const existingDay =
    state.sessionsByDate[
      resolvedDate
    ] ||
    createEmptyDayState({
      date:
        resolvedDate,

      day:
        resolvedDay,

      dayType
    });

  /*
   * Off and Recovery dates exist in progress as REST entries only.
   * They cannot accidentally inherit an old workout session.
   */
  if (
    dayType ===
      "off" ||
    dayType ===
      "recovery"
  ) {
    state.sessionsByDate[
      resolvedDate
    ] =
      createEmptyDayState({
        date:
          resolvedDate,

        day:
          resolvedDay,

        dayType
      });

    touch();
    persist();
    emit();

    return true;
  }

  const existingEntries =
    existingDay.exercises ||
    {};

  const nextEntries =
    {};

  const nextOriginalOrder =
    [];

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

    nextEntries[
      preferredEntryId
    ] =
      existing
        ? mergeExistingEntryWithPlan(
            existing,
            fresh
          )
        : fresh;
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

  existingDay.date =
    resolvedDate;

  existingDay.day =
    resolvedDay;

  existingDay.dayType =
    "workout";

  existingDay.exercises =
    nextEntries;

  existingDay.originalOrder =
    nextOriginalOrder;

  const validExistingOrder =
    (
      preserveSessionChanges
        ? existingDay.sessionOrder
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

  existingDay.sessionOrder = [
    ...validExistingOrder,
    ...missingOrderEntries
  ];

  existingDay.plannedWorkoutId =
    normalizeId(
      workoutId
    );

  if (
    existingDay.status ===
      "rest"
  ) {
    existingDay.status =
      "not_started";
  }

  existingDay.metadata
    .planSyncedAt =
      nowIso();

  recalculateDayCompletion(
    resolvedDate
  );

  touchDay(
    existingDay
  );

  state.sessionsByDate[
    resolvedDate
  ] =
    existingDay;

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
    const planDay =
      week[
        day
      ];

    const date =
      formatDateKey(
        planDay?.date
      ) ||
      getDayDateForWeek(
        state.activeWeekKey,
        day
      );

    syncDayWithPlan({
      day,

      date,

      dayType:
        planDay?.type ||
        "off",

      workoutId:
        planDay?.workoutId ||
        null,

      exercises:
        Array.isArray(
          planDay?.exercises
        )
          ? planDay.exercises
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
// SESSION START / PAUSE / RESUME
// =====================================================

function startDay(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
    dayState.status ===
      "rest" ||
    dayState.dayType !==
      "workout" ||
    dayState.sessionOrder
      .length ===
      0
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
  dayOrDate
) {
  return startDay(
    dayOrDate
  );
}


function pauseDay(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
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
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
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


// =====================================================
// COMPLETE / CANCEL
// =====================================================

function completeDay(
  dayOrDate,
  {
    force =
      false,

    archive =
      true
  } = {}
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
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
        date
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
    date
  );

  touchDay(
    dayState
  );

  if (
    archive
  ) {
    archiveCompletedSession(
      date
    );
  }

  touch();
  persist();
  emit();

  return true;
}


/*
 * Completely undo an accidental workout start.
 *
 * This:
 *   - removes the sessionId
 *   - clears timer / HR / notes
 *   - removes temporary added exercises
 *   - removes substitutions
 *   - restores planned exercises
 *   - restores original order
 *   - clears all completion data
 *   - returns the date to not_started
 *   - does NOT alter workout-plan-store.js
 *   - does NOT create history
 */
function cancelDay(
  dayOrDate,
  {
    preservePlannedEntries =
      true
  } = {}
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const current =
    state.sessionsByDate[
      date
    ];

  if (!current) {
    return false;
  }

  if (
    current.status ===
      "rest"
  ) {
    return false;
  }

  const fresh =
    createEmptyDayState({
      date:
        current.date,

      day:
        current.day,

      dayType:
        "workout"
    });

  fresh.plannedWorkoutId =
    current.plannedWorkoutId;

  if (
    preservePlannedEntries
  ) {
    const plannedIds =
      current.originalOrder
        .filter(
          entryId =>
            current.exercises[
              entryId
            ]?.source ===
              "planned"
        );

    for (
      let index = 0;
      index <
        plannedIds.length;
      index += 1
    ) {
      const entryId =
        plannedIds[
          index
        ];

      const old =
        current.exercises[
          entryId
        ];

      if (!old) {
        continue;
      }

      const rebuilt =
        createEntryFromPlanExercise(
          {
            entryId:
              old.entryId,

            exerciseId:
              old.exerciseId,

            role:
              old.role,

            sets:
              old.prescription
                ?.sets,

            reps:
              old.prescription
                ?.reps,

            restSeconds:
              old.prescription
                ?.restSeconds,

            durationMinutes:
              old.prescription
                ?.durationMinutes,

            durationSeconds:
              old.prescription
                ?.durationSeconds,

            rounds:
              old.prescription
                ?.rounds,

            workSeconds:
              old.prescription
                ?.workSeconds,

            weight:
              old.prescription
                ?.weight,

            addedWeight:
              old.prescription
                ?.addedWeight,

            distance:
              old.prescription
                ?.distance,

            intensity:
              old.prescription
                ?.intensity,

            metadata:
              old.metadata
          },
          {
            source:
              "planned",

            originalIndex:
              index
          }
        );

      if (!rebuilt) {
        continue;
      }

      fresh.exercises[
        rebuilt.entryId
      ] =
        rebuilt;

      fresh.originalOrder
        .push(
          rebuilt.entryId
        );

      fresh.sessionOrder
        .push(
          rebuilt.entryId
        );
    }
  }

  fresh.metadata
    .planSyncedAt =
      current.metadata
        ?.planSyncedAt ||
      null;

  state.sessionsByDate[
    date
  ] =
    fresh;

  /*
   * If a malformed/incomplete history snapshot exists for the
   * canceled session, remove it as part of the cleanup.
   */
  if (
    current.sessionId &&
    state.history[
      current.sessionId
    ] &&
    state.history[
      current.sessionId
    ].status !==
      "complete"
  ) {
    delete state.history[
      current.sessionId
    ];
  }

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// ELAPSED TIME
// =====================================================

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
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return 0;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return 0;
  }

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
  dayOrDate,
  value
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
    dayState.status ===
      "rest"
  ) {
    return false;
  }

  dayState.averageHeartRate =
    normalizeHeartRate(
      value
    );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function setDayNotes(
  dayOrDate,
  notes
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
    dayState.status ===
      "rest"
  ) {
    return false;
  }

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
  dayOrDate,
  entryId,
  toIndex
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !date ||
    !normalizedEntryId
  ) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return false;
  }

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
  day =
    null,

  date =
    null,

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
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
      day
    );

  const normalizedExerciseId =
    normalizeId(
      exerciseId
    );

  if (
    !resolvedDate ||
    !normalizedExerciseId
  ) {
    return null;
  }

  const dayState =
    state.sessionsByDate[
      resolvedDate
    ];

  if (
    !dayState ||
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
    resolvedDate
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
  dayOrDate,
  entryId,
  skipped =
    true
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !date ||
    !normalizedEntryId
  ) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  const entry =
    dayState
      ?.exercises?.[
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
    date
  );

  touchDay(
    dayState
  );

  touch();
  persist();
  emit();

  return true;
}


function removeSessionEntry(
  dayOrDate,
  entryId
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !date ||
    !normalizedEntryId
  ) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  const entry =
    dayState
      ?.exercises?.[
        normalizedEntryId
      ];

  if (!entry) {
    return false;
  }

  if (
    entry.source ===
      "planned"
  ) {
    return skipEntry(
      date,
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
    date
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
  day =
    null,

  date =
    null,

  entryId,

  replacementExerciseId,

  prescription =
    null,

  replacementEntryId =
    null
} = {}) {
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
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
    !resolvedDate ||
    !normalizedEntryId ||
    !normalizedReplacementId
  ) {
    return null;
  }

  const dayState =
    state.sessionsByDate[
      resolvedDate
    ];

  const original =
    dayState
      ?.exercises?.[
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
    resolvedDate
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
// ENTRY RESOLUTION
// =====================================================

function resolveEntryReference(
  date,
  entryId,
  exerciseId
) {
  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return null;
  }

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
// SET COMPLETION
// =====================================================

function setSetCompleted({
  day =
    null,

  date =
    null,

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
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
      day
    );

  const normalizedSet =
    normalizePositiveInteger(
      setNumber
    );

  if (
    !resolvedDate ||
    !normalizedSet
  ) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      resolvedDate,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  if (
    !startDay(
      resolvedDate
    )
  ) {
    return false;
  }

  const entry =
    state.sessionsByDate[
      resolvedDate
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
    resolvedDate
  );

  touchDay(
    state.sessionsByDate[
      resolvedDate
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
  const resolvedDate =
    formatDateKey(
      options.date
    ) ||
    resolveDateKey(
      options.day
    );

  if (!resolvedDate) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      resolvedDate,
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
    state.sessionsByDate[
      resolvedDate
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

    date:
      resolvedDate,

    entryId:
      resolvedEntry,

    completed:
      !current.completed
  });
}


function setSetCalories({
  day =
    null,

  date =
    null,

  entryId =
    null,

  exerciseId =
    null,

  setNumber,

  estimatedCalories
} = {}) {
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
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
    !resolvedDate ||
    !normalizedSet ||
    calories ===
      null
  ) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      resolvedDate,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  const entry =
    state.sessionsByDate[
      resolvedDate
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
    resolvedDate
  );

  touchDay(
    state.sessionsByDate[
      resolvedDate
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
  day =
    null,

  date =
    null,

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
  const resolvedDate =
    formatDateKey(
      date
    ) ||
    resolveDateKey(
      day
    );

  if (!resolvedDate) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      resolvedDate,
      entryId,
      exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  if (
    !startDay(
      resolvedDate
    )
  ) {
    return false;
  }

  const entry =
    state.sessionsByDate[
      resolvedDate
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
    resolvedDate
  );

  touchDay(
    state.sessionsByDate[
      resolvedDate
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
  const resolvedDate =
    formatDateKey(
      options.date
    ) ||
    resolveDateKey(
      options.day
    );

  if (!resolvedDate) {
    return false;
  }

  const resolvedEntry =
    resolveEntryReference(
      resolvedDate,
      options.entryId,
      options.exerciseId
    );

  if (!resolvedEntry) {
    return false;
  }

  const entry =
    state.sessionsByDate[
      resolvedDate
    ]
      .exercises[
        resolvedEntry
      ];

  return setExerciseCompleted({
    ...options,

    date:
      resolvedDate,

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
  ) / 10;
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
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return 0;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return 0;
  }

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
      total * 10
    ) / 10;

  return dayState
    .estimatedCalories;
}


function recalculateDayCompletion(
  dayOrDate,
  exerciseDefinitions =
    null
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
    dayState.status ===
      "rest"
  ) {
    return false;
  }

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
          date,
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
    dayState.status =
      dayState.startedAt
        ? "in_progress"
        : "not_started";

    dayState.completedAt =
      null;

    recalculateDayCalories(
      date
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
    date
  );

  return complete;
}


// =====================================================
// SUMMARIES
// =====================================================

function getExerciseSummary(
  dayOrDate,
  entryIdOrExerciseId
) {
  const progress =
    getExerciseProgress(
      dayOrDate,
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
  dayOrDate
) {
  return recalculateDayCalories(
    dayOrDate
  );
}


function getDaySummary(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return null;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (!dayState) {
    return {
      date,
      day:
        getDayIdFromDate(
          date
        ),
      status:
        "not_started",
      completed:
        false,
      exerciseCount:
        0,
      activeExerciseCount:
        0,
      completedExercises:
        0,
      skippedExercises:
        0,
      addedExercises:
        0,
      substitutions:
        0,
      requiredSets:
        0,
      completedSets:
        0,
      estimatedCalories:
        0,
      elapsedSeconds:
        0,
      averageHeartRate:
        null,
      startedAt:
        null,
      pausedAt:
        null,
      completedAt:
        null,
      notes:
        null
    };
  }

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
    date,

    day:
      dayState.day,

    dayType:
      dayState.dayType,

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
        date
      ),

    elapsedSeconds:
      getElapsedSeconds(
        date
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


function getWeekSummary(
  weekKey =
    state.activeWeekKey
) {
  const summaries =
    DAYS.map(
      day =>
        getDaySummary(
          getDayDateForWeek(
            weekKey,
            day
          )
        )
    );

  return {
    weekKey,

    completeDays:
      summaries.filter(
        summary =>
          summary?.status ===
            "complete"
      ).length,

    inProgressDays:
      summaries.filter(
        summary =>
          summary?.status ===
            "in_progress"
      ).length,

    pausedDays:
      summaries.filter(
        summary =>
          summary?.status ===
            "paused"
      ).length,

    restDays:
      summaries.filter(
        summary =>
          summary?.status ===
            "rest"
      ).length,

    completedSets:
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
      ),

    requiredSets:
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
      ),

    estimatedCalories:
      Math.round(
        summaries.reduce(
          (
            total,
            summary
          ) =>
            total +
            (
              summary
                ?.estimatedCalories ||
              0
            ),
          0
        ) * 10
      ) / 10,

    elapsedSeconds:
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
      ),

    days:
      summaries
  };
}


function getWeekCalories(
  weekKey =
    state.activeWeekKey
) {
  return getWeekSummary(
    weekKey
  ).estimatedCalories;
}


// =====================================================
// SESSION SNAPSHOT / HISTORY
// =====================================================

function createSessionSnapshot(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return null;
  }

  const dayState =
    state.sessionsByDate[
      date
    ];

  if (
    !dayState ||
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
      getWeekKey(
        date
      ),

    date,

    day:
      dayState.day,

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
        date
      ),

    averageHeartRate:
      dayState.averageHeartRate,

    estimatedCalories:
      recalculateDayCalories(
        date
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
        null,

      archivedAt:
        nowIso()
    }
  };
}


function archiveCompletedSession(
  dayOrDate
) {
  const snapshot =
    createSessionSnapshot(
      dayOrDate
    );

  if (
    !snapshot ||
    snapshot.status !==
      "complete"
  ) {
    return false;
  }

  state.history[
    snapshot.sessionId
  ] =
    clone(
      snapshot
    );

  const date =
    snapshot.date;

  if (
    state.sessionsByDate[
      date
    ]
  ) {
    state.sessionsByDate[
      date
    ]
      .metadata
      .historyArchivedAt =
        nowIso();
  }

  return true;
}


function getSessionRecord(
  sessionId
) {
  const id =
    normalizeId(
      sessionId
    );

  if (!id) {
    return null;
  }

  const record =
    state.history[
      id
    ];

  return record
    ? clone(
        record
      )
    : null;
}


function getSessionHistory({
  startDate =
    null,

  endDate =
    null,

  year =
    null,

  month =
    null,

  status =
    null,

  newestFirst =
    true
} = {}) {
  const start =
    formatDateKey(
      startDate
    );

  const end =
    formatDateKey(
      endDate
    );

  const resolvedYear =
    Number(
      year
    );

  const resolvedMonth =
    Number(
      month
    );

  const normalizedStatus =
    normalizeText(
      status
    )
      .toLowerCase();

  const records =
    Object.values(
      state.history
    )
      .filter(
        record => {
          if (
            start &&
            record.date <
              start
          ) {
            return false;
          }

          if (
            end &&
            record.date >
              end
          ) {
            return false;
          }

          if (
            Number.isInteger(
              resolvedYear
            ) &&
            resolvedYear > 0
          ) {
            const date =
              toLocalDate(
                record.date
              );

            if (
              !date ||
              date.getFullYear() !==
                resolvedYear
            ) {
              return false;
            }

            if (
              Number.isInteger(
                resolvedMonth
              ) &&
              resolvedMonth >= 1 &&
              resolvedMonth <= 12 &&
              date.getMonth() + 1 !==
                resolvedMonth
            ) {
              return false;
            }
          }

          if (
            normalizedStatus &&
            normalizeText(
              record.status
            ).toLowerCase() !==
              normalizedStatus
          ) {
            return false;
          }

          return true;
        }
      )
      .sort(
        (a, b) => {
          const left =
            new Date(
              a.completedAt ||
              a.startedAt ||
              a.date
            )
              .getTime();

          const right =
            new Date(
              b.completedAt ||
              b.startedAt ||
              b.date
            )
              .getTime();

          return newestFirst
            ? right - left
            : left - right;
        }
      );

  return clone(
    records
  );
}


function getMonthHistory(
  year,
  month
) {
  return getSessionHistory({
    year,
    month,
    status:
      "complete"
  });
}


/*
 * Delete a saved session record.
 *
 * If the session is also the currently loaded date session,
 * reset that date back to the planned/not-started state.
 */
function deleteSessionRecord(
  sessionId
) {
  const id =
    normalizeId(
      sessionId
    );

  if (!id) {
    return false;
  }

  let changed =
    false;

  if (
    state.history[
      id
    ]
  ) {
    delete state.history[
      id
    ];

    changed =
      true;
  }

  for (
    const [
      date,
      dayState
    ]
    of Object.entries(
      state.sessionsByDate
    )
  ) {
    if (
      dayState
        ?.sessionId ===
        id
    ) {
      cancelDay(
        date,
        {
          preservePlannedEntries:
            true
        }
      );

      changed =
        true;
    }
  }

  if (
    changed
  ) {
    touch();
    persist();
    emit();
  }

  return changed;
}


function clearSessionHistory({
  startDate =
    null,

  endDate =
    null,

  year =
    null,

  month =
    null,

  completedOnly =
    false
} = {}) {
  const matches =
    getSessionHistory({
      startDate,
      endDate,
      year,
      month,
      status:
        completedOnly
          ? "complete"
          : null
    });

  if (
    matches.length ===
      0
  ) {
    return 0;
  }

  let removed =
    0;

  for (
    const record
    of matches
  ) {
    if (
      state.history[
        record.sessionId
      ]
    ) {
      delete state.history[
        record.sessionId
      ];

      removed +=
        1;
    }
  }

  touch();
  persist();
  emit();

  return removed;
}


// =====================================================
// RESET
// =====================================================

function resetDay(
  dayOrDate
) {
  const date =
    resolveDateKey(
      dayOrDate
    );

  if (!date) {
    return false;
  }

  const current =
    state.sessionsByDate[
      date
    ];

  if (!current) {
    return false;
  }

  /*
   * V3 resetDay is intentionally equivalent to safe cancellation:
   * retain the plan, erase execution.
   */
  return cancelDay(
    date,
    {
      preservePlannedEntries:
        true
    }
  );
}


function resetAll({
  clearHistory =
    false
} = {}) {
  state.sessionsByDate =
    {};

  state.planKey =
    null;

  state.activeWeekKey =
    getWeekKey(
      new Date()
    );

  if (
    clearHistory
  ) {
    state.history =
      {};
  }

  state.metadata = {
    createdAt:
      null,

    updatedAt:
      null,

    migratedFrom:
      state.metadata
        ?.migratedFrom ||
      null,

    migratedAt:
      state.metadata
        ?.migratedAt ||
      null
  };

  touch();
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

  state.activeWeekKey =
    normalizeId(
      incoming.activeWeekKey ??
      incoming.weekKey
    ) ||
    fresh.activeWeekKey;

  state.sessionsByDate =
    {};

  const incomingSessions =
    incoming.sessionsByDate &&
    typeof incoming.sessionsByDate ===
      "object"
      ? incoming.sessionsByDate
      : {};

  for (
    const [
      date,
      rawDay
    ]
    of Object.entries(
      incomingSessions
    )
  ) {
    const normalizedDate =
      formatDateKey(
        date
      );

    if (
      !normalizedDate ||
      !rawDay ||
      typeof rawDay !==
        "object"
    ) {
      continue;
    }

    state.sessionsByDate[
      normalizedDate
    ] =
      normalizeIncomingDay(
        rawDay,
        normalizedDate
      );
  }

  state.history =
    {};

  const incomingHistory =
    incoming.history &&
    typeof incoming.history ===
      "object"
      ? incoming.history
      : {};

  for (
    const [
      sessionId,
      record
    ]
    of Object.entries(
      incomingHistory
    )
  ) {
    if (
      !record ||
      typeof record !==
        "object"
    ) {
      continue;
    }

    const id =
      normalizeId(
        record.sessionId ??
        sessionId
      );

    const date =
      formatDateKey(
        record.date
      );

    if (
      !id ||
      !date
    ) {
      continue;
    }

    state.history[
      id
    ] = {
      ...clone(
        record
      ),

      sessionId:
        id,

      date
    };
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
  sourceDay,
  fallbackDate
) {
  const date =
    formatDateKey(
      sourceDay.date ??
      fallbackDate
    );

  const fresh =
    createEmptyDayState({
      date,

      day:
        sourceDay.day,

      dayType:
        sourceDay.dayType ||
        (
          sourceDay.status ===
            "rest"
            ? "off"
            : "workout"
        )
    });

  const dayState = {
    ...fresh,

    ...clone(
      sourceDay
    ),

    date,

    day:
      normalizeDay(
        sourceDay.day
      ) ||
      getDayIdFromDate(
        date
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
    Array.isArray(
      sourceDay.originalOrder
    )
      ? [
          ...new Set(
            sourceDay.originalOrder
              .map(
                normalizeId
              )
              .filter(Boolean)
          )
        ]
      : [];

  dayState.sessionOrder =
    Array.isArray(
      sourceDay.sessionOrder
    )
      ? [
          ...new Set(
            sourceDay.sessionOrder
              .map(
                normalizeId
              )
              .filter(Boolean)
          )
        ]
      : [];

  dayState.exercises =
    {};

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

  const base =
    createEntryFromPlanExercise(
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
    );

  if (!base) {
    return null;
  }

  const entry = {
    ...base,

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

  entry.completedSets =
    {};

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
      total * 10
    ) / 10;
}


// =====================================================
// V2 / V1 MIGRATION
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
        legacyKey.endsWith(
          "_v2"
        )
          ? migrateV2State(
              parsed
            )
          : migrateV1State(
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

      state.metadata
        .migratedAt =
          nowIso();

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


function migrateV2State(
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

  migrated.activeWeekKey =
    normalizeId(
      legacy.weekKey
    ) ||
    getWeekKey(
      new Date()
    );

  const legacyDays =
    legacy.days &&
    typeof legacy.days ===
      "object"
      ? legacy.days
      : {};

  for (
    const day
    of DAYS
  ) {
    const legacyDay =
      legacyDays[
        day
      ];

    if (
      !legacyDay ||
      typeof legacyDay !==
        "object"
    ) {
      continue;
    }

    const date =
      getDayDateForWeek(
        migrated.activeWeekKey,
        day
      );

    migrated.sessionsByDate[
      date
    ] =
      normalizeIncomingDay(
        {
          ...legacyDay,

          date,

          day
        },
        date
      );
  }

  migrated.metadata = {
    ...migrated.metadata,

    migratedFrom:
      "ari_training_workout_progress_v2",

    migratedAt:
      nowIso()
  };

  return migrated;
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

  migrated.activeWeekKey =
    normalizeId(
      legacy.weekKey
    ) ||
    getWeekKey(
      new Date()
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

    const date =
      getDayDateForWeek(
        migrated.activeWeekKey,
        day
      );

    const nextDay =
      createEmptyDayState({
        date,
        day,
        dayType:
          legacyDay.status ===
            "rest"
            ? "off"
            : "workout"
      });

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

    migrated.sessionsByDate[
      date
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
    const [
      date,
      dayState
    ]
    of Object.entries(
      state.sessionsByDate
    )
  ) {
    if (
      formatDateKey(
        date
      ) !==
        date
    ) {
      errors.push(
        `Progress session key "${date}" is not a valid YYYY-MM-DD date.`
      );
    }

    if (
      dayState.date !==
        date
    ) {
      warnings.push(
        `Progress date key "${date}" differs from session.date "${dayState.date}".`
      );
    }

    if (
      !VALID_SESSION_STATUSES
        .includes(
          dayState.status
        )
    ) {
      errors.push(
        `Date "${date}" has invalid session status "${dayState.status}".`
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
          `Date "${date}" sessionOrder references missing entry "${entryId}".`
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
          `Date "${date}" contains an entry without entryId.`
        );
      }

      if (
        entry.entryId !==
          entryId
      ) {
        warnings.push(
          `Date "${date}" entry key "${entryId}" differs from entry.entryId "${entry.entryId}".`
        );
      }

      if (
        !entry.exerciseId
      ) {
        errors.push(
          `Date "${date}" entry "${entryId}" has no exerciseId.`
        );
      }

      if (
        !VALID_ENTRY_STATUSES
          .includes(
            entry.status
          )
      ) {
        errors.push(
          `Date "${date}" entry "${entryId}" has invalid status "${entry.status}".`
        );
      }

      if (
        !VALID_SOURCES
          .includes(
            entry.source
          )
      ) {
        errors.push(
          `Date "${date}" entry "${entryId}" has invalid source "${entry.source}".`
        );
      }

      if (
        !orderIds.has(
          entryId
        )
      ) {
        warnings.push(
          `Date "${date}" entry "${entryId}" is not present in sessionOrder.`
        );
      }
    }
  }

  for (
    const [
      sessionId,
      record
    ]
    of Object.entries(
      state.history
    )
  ) {
    if (
      record.sessionId !==
        sessionId
    ) {
      warnings.push(
        `History key "${sessionId}" differs from record.sessionId "${record.sessionId}".`
      );
    }

    if (
      !formatDateKey(
        record.date
      )
    ) {
      errors.push(
        `History session "${sessionId}" has invalid date "${record.date}".`
      );
    }
  }

  return {
    valid:
      errors.length ===
        0,

    schemaVersion:
      SCHEMA_VERSION,

    sessionDateCount:
      Object.keys(
        state.sessionsByDate
      ).length,

    historyCount:
      Object.keys(
        state.history
      ).length,

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

    activeWeekKey:
      state.activeWeekKey,

    sessionDateCount:
      Object.keys(
        state.sessionsByDate
      ).length,

    historyCount:
      Object.keys(
        state.history
      ).length,

    weekSummary:
      getWeekSummary(
        state.activeWeekKey
      ),

    capabilities: {
      dateSpecificSessions:
        true,

      cancelWorkout:
        true,

      completedHistory:
        true,

      deleteSessionRecord:
        true,

      clearSessionHistory:
        true,

      monthHistory:
        true
    },

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

    formatDateKey,
    getWeekKey,
    getDayDateForWeek,
    getDayIdFromDate,

    getState,

    getDay,

    getDayByDate,

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

    archiveCompletedSession,

    getSessionRecord,

    getSessionHistory,

    getMonthHistory,

    deleteSessionRecord,

    clearSessionHistory,

    setPlanContext,

    syncDayWithPlan,

    syncWeekWithPlan,

    startDay,

    markDayStarted,

    pauseDay,

    resumeDay,

    completeDay,

    cancelDay,

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

  formatDateKey,
  getWeekKey,
  getDayDateForWeek,
  getDayIdFromDate,

  getState,

  getDay,
  getDayByDate,

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
  archiveCompletedSession,

  getSessionRecord,
  getSessionHistory,
  getMonthHistory,

  deleteSessionRecord,
  clearSessionHistory,

  setPlanContext,

  syncDayWithPlan,
  syncWeekWithPlan,

  startDay,
  markDayStarted,

  pauseDay,
  resumeDay,
  completeDay,
  cancelDay,

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
