// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-store.js
// Version: 3.0.0
// Purpose:
//   Persistent, date-specific ARI Training workout-plan store.
//
// V3.0.0:
//   - Replaces one permanently repeating Monday-Sunday plan
//     with date-bound Sunday-Saturday calendar weeks.
//   - Each week is stored under a stable Sunday date key.
//   - Every plan day stores its real YYYY-MM-DD calendar date.
//   - Empty / unplanned future weeks resolve to Off Days.
//   - Supports previous / next / current week navigation.
//   - Supports Repeat Last Week.
//   - Supports copying one week into another.
//   - Supports clearing a selected week.
//   - Templates apply only to the selected calendar week.
//   - Keeps live workout execution completely separate.
//   - Migrates V2 repeating-plan data into the current week.
//   - Preserves localStorage as immediate/offline fallback.
//
// Important separation:
//
//   workout-plan-store.js
//     = what the user PLANS to do on specific dates.
//
//   workout-progress-store.js
//     = what the user is ACTUALLY doing / completed.
//
//   workout-history-store.js
//     = archived completed/cancelled historical sessions.
//
// Calendar model:
//
//   weeks: {
//     "2026-08-09": {
//       weekKey: "2026-08-09",
//       startDate: "2026-08-09",
//       endDate: "2026-08-15",
//       days: {
//         sunday: {
//           date: "2026-08-09",
//           ...
//         },
//         monday: {
//           date: "2026-08-10",
//           ...
//         }
//       }
//     }
//   }
//
// Rules:
//   - Weeks are Sunday -> Saturday.
//   - Templates are reusable patterns, not permanent repeating plans.
//   - No future week automatically inherits another week's workouts.
//   - An absent week behaves as a clean Off-Day week.
// =====================================================

const VERSION =
  "3.0.0";

const SCHEMA_VERSION =
  3;

const SOURCE =
  "js/training/workout-plan-store";

const STORAGE_KEY =
  "ari_training_workout_plan_v3";

const LEGACY_STORAGE_KEYS =
  Object.freeze([
    "ari_training_weekly_plan_v2",
    "ari_training_weekly_plan_v1"
  ]);

const DAY_IDS =
  Object.freeze([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ]);

const DAY_LABELS =
  Object.freeze({
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday"
  });

const VALID_DAY_TYPES =
  Object.freeze([
    "workout",
    "recovery",
    "off"
  ]);


// =====================================================
// BASIC HELPERS
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
    ).toLowerCase();

  return DAY_IDS.includes(
    day
  )
    ? day
    : null;
}


function normalizeDayType(
  value
) {
  const type =
    normalizeText(
      value
    ).toLowerCase();

  return VALID_DAY_TYPES.includes(
    type
  )
    ? type
    : "off";
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
    "plan"
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


function uniqueStrings(
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
// DATE HELPERS
// =====================================================

function pad2(
  value
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


function toLocalDateOnly(
  value =
    new Date()
) {
  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

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

  if (!text) {
    return null;
  }

  const dateOnlyMatch =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (
    dateOnlyMatch
  ) {
    const year =
      Number(
        dateOnlyMatch[1]
      );

    const month =
      Number(
        dateOnlyMatch[2]
      ) - 1;

    const day =
      Number(
        dateOnlyMatch[3]
      );

    const date =
      new Date(
        year,
        month,
        day
      );

    if (
      date.getFullYear() !==
        year ||
      date.getMonth() !==
        month ||
      date.getDate() !==
        day
    ) {
      return null;
    }

    return date;
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
  value
) {
  const date =
    toLocalDateOnly(
      value
    );

  if (!date) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${pad2(
      date.getMonth() + 1
    )}-` +
    `${pad2(
      date.getDate()
    )}`
  );
}


function addDays(
  value,
  amount
) {
  const date =
    toLocalDateOnly(
      value
    );

  if (!date) {
    return null;
  }

  const next =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  next.setDate(
    next.getDate() +
    Number(
      amount || 0
    )
  );

  return next;
}


function getWeekStartDate(
  value =
    new Date()
) {
  const date =
    toLocalDateOnly(
      value
    );

  if (!date) {
    return null;
  }

  const dayIndex =
    date.getDay();

  return addDays(
    date,
    -dayIndex
  );
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


function getWeekEndDate(
  weekKey
) {
  const start =
    toLocalDateOnly(
      weekKey
    );

  if (!start) {
    return null;
  }

  return addDays(
    start,
    6
  );
}


function getDayDateForWeek(
  weekKey,
  dayId
) {
  const normalizedDay =
    normalizeDay(
      dayId
    );

  const start =
    toLocalDateOnly(
      weekKey
    );

  if (
    !normalizedDay ||
    !start
  ) {
    return null;
  }

  const index =
    DAY_IDS.indexOf(
      normalizedDay
    );

  return formatDateKey(
    addDays(
      start,
      index
    )
  );
}


function getDayIdFromDate(
  value
) {
  const date =
    toLocalDateOnly(
      value
    );

  if (!date) {
    return null;
  }

  return DAY_IDS[
    date.getDay()
  ] || null;
}


function normalizeWeekKey(
  value
) {
  const key =
    getWeekKey(
      value
    );

  return key ||
    null;
}


function getWeekRange(
  value =
    new Date()
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    return null;
  }

  return {
    weekKey,
    startDate:
      weekKey,
    endDate:
      formatDateKey(
        getWeekEndDate(
          weekKey
        )
      )
  };
}


// =====================================================
// EXERCISE ENTRY NORMALIZATION
// =====================================================

function normalizePlanExercise(
  exerciseEntry,
  {
    preserveEntryId =
      true
  } = {}
) {
  if (
    !exerciseEntry ||
    typeof exerciseEntry !==
      "object"
  ) {
    return null;
  }

  const exerciseId =
    normalizeId(
      exerciseEntry
        .exerciseId
    );

  if (!exerciseId) {
    return null;
  }

  const entryId =
    preserveEntryId
      ? normalizeId(
          exerciseEntry
            .entryId
        )
      : null;

  const sets =
    normalizePositiveInteger(
      exerciseEntry.sets ??
      exerciseEntry
        .prescription
        ?.sets
    );

  const reps =
    normalizePositiveInteger(
      exerciseEntry.reps ??
      exerciseEntry
        .prescription
        ?.reps
    );

  const restSeconds =
    normalizeNonNegativeNumber(
      exerciseEntry
        .restSeconds ??
      exerciseEntry
        .rest_seconds ??
      exerciseEntry
        .prescription
        ?.restSeconds
    );

  const durationMinutes =
    normalizePositiveNumber(
      exerciseEntry
        .durationMinutes ??
      exerciseEntry
        .duration_minutes ??
      exerciseEntry
        .prescription
        ?.durationMinutes
    );

  const durationSeconds =
    normalizePositiveNumber(
      exerciseEntry
        .durationSeconds ??
      exerciseEntry
        .duration_seconds ??
      exerciseEntry
        .prescription
        ?.durationSeconds
    );

  const rounds =
    normalizePositiveInteger(
      exerciseEntry.rounds ??
      exerciseEntry
        .prescription
        ?.rounds
    );

  const workSeconds =
    normalizePositiveNumber(
      exerciseEntry
        .workSeconds ??
      exerciseEntry
        .work_seconds ??
      exerciseEntry
        .prescription
        ?.workSeconds
    );

  const weight =
    normalizeNonNegativeNumber(
      exerciseEntry.weight
    );

  const addedWeight =
    normalizeNonNegativeNumber(
      exerciseEntry
        .addedWeight ??
      exerciseEntry
        .added_weight
    );

  const distance =
    normalizePositiveNumber(
      exerciseEntry.distance
    );

  const intensity =
    normalizeId(
      exerciseEntry.intensity ??
      exerciseEntry
        .prescription
        ?.intensity
    );

  const role =
    normalizeId(
      exerciseEntry.role
    );

  const notes =
    normalizeText(
      exerciseEntry.notes ??
      exerciseEntry.userNotes
    ) ||
    null;

  const normalized = {
    entryId:
      entryId ||
      createStableId(
        "plan_exercise"
      ),

    exerciseId,

    role,

    sets,

    reps,

    restSeconds,

    durationMinutes,

    durationSeconds,

    rounds,

    workSeconds,

    weight,

    addedWeight,

    distance,

    intensity,

    notes,

    metadata: {
      ...(
        exerciseEntry
          .metadata &&
        typeof exerciseEntry
          .metadata ===
            "object"
          ? clone(
              exerciseEntry
                .metadata
            )
          : {}
      )
    }
  };

  const passthroughFields = [
    "pace",
    "incline",
    "resistance",
    "assistance",
    "boxHeight",
    "box_height",
    "side",
    "stance",
    "speed",
    "level",
    "steps",
    "strokeRate",
    "stroke_rate"
  ];

  for (
    const field
    of passthroughFields
  ) {
    if (
      exerciseEntry[
        field
      ] !==
        undefined
    ) {
      normalized[
        field
      ] =
        clone(
          exerciseEntry[
            field
          ]
        );
    }
  }

  return normalized;
}


function normalizeExerciseList(
  exercises,
  {
    regenerateEntryIds =
      false
  } = {}
) {
  if (
    !Array.isArray(
      exercises
    )
  ) {
    return [];
  }

  const normalized = [];

  const usedEntryIds =
    new Set();

  for (
    const exercise
    of exercises
  ) {
    const entry =
      normalizePlanExercise(
        exercise,
        {
          preserveEntryId:
            !regenerateEntryIds
        }
      );

    if (!entry) {
      continue;
    }

    if (
      regenerateEntryIds ||
      usedEntryIds.has(
        entry.entryId
      )
    ) {
      entry.entryId =
        createStableId(
          "plan_exercise"
        );
    }

    usedEntryIds.add(
      entry.entryId
    );

    normalized.push(
      entry
    );
  }

  return normalized;
}


// =====================================================
// DAY CREATION
// =====================================================

function makeDay({
  day,
  date =
    null,

  type =
    "off",

  focusId =
    "off_day",

  title =
    null,

  goal =
    null,

  sport =
    null,

  workoutId =
    null,

  estimatedDurationMinutes =
    null,

  exercises =
    [],

  metadata =
    null
} = {}) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.makeDay requires a valid weekday."
    );
  }

  const normalizedDate =
    formatDateKey(
      date
    );

  if (!normalizedDate) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.makeDay requires a valid calendar date."
    );
  }

  const normalizedType =
    normalizeDayType(
      type
    );

  const isOff =
    normalizedType ===
      "off";

  return {
    day:
      normalizedDay,

    label:
      DAY_LABELS[
        normalizedDay
      ],

    date:
      normalizedDate,

    type:
      normalizedType,

    focusId:
      isOff
        ? "off_day"
        : normalizeId(
            focusId
          ) ||
          "custom",

    title:
      normalizeText(
        title
      ) ||
      (
        isOff
          ? "Off Day"
          : DAY_LABELS[
              normalizedDay
            ]
      ),

    goal:
      isOff
        ? null
        : normalizeId(
            goal
          ),

    sport:
      isOff
        ? null
        : normalizeId(
            sport
          ),

    workoutId:
      isOff
        ? null
        : normalizeId(
            workoutId
          ),

    estimatedDurationMinutes:
      isOff
        ? null
        : normalizePositiveNumber(
            estimatedDurationMinutes
          ),

    exercises:
      isOff
        ? []
        : normalizeExerciseList(
            exercises
          ),

    metadata: {
      ...(
        metadata &&
        typeof metadata ===
          "object"
          ? clone(
              metadata
            )
          : {}
      )
    }
  };
}


// =====================================================
// WEEK CREATION
// =====================================================

function createEmptyWeek(
  value =
    new Date()
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.createEmptyWeek requires a valid date/week key."
    );
  }

  const range =
    getWeekRange(
      weekKey
    );

  const days = {};

  for (
    const day
    of DAY_IDS
  ) {
    days[
      day
    ] =
      makeDay({
        day,

        date:
          getDayDateForWeek(
            weekKey,
            day
          ),

        type:
          "off",

        focusId:
          "off_day",

        title:
          "Off Day",

        exercises:
          []
      });
  }

  return {
    weekKey,

    startDate:
      range.startDate,

    endDate:
      range.endDate,

    primaryGoalId:
      null,

    secondaryGoalIds:
      [],

    name:
      "My Weekly Plan",

    days,

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      sourceTemplateId:
        null,

      repeatedFromWeekKey:
        null,

      copiedFromWeekKey:
        null,

      builderVersion:
        null
    }
  };
}


// =====================================================
// ROOT STATE
// =====================================================

function createInitialState() {
  return {
    schemaVersion:
      SCHEMA_VERSION,

    version:
      VERSION,

    source:
      SOURCE,

    planId:
      null,

    selectedWeekKey:
      getWeekKey(
        new Date()
      ),

    weeks:
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

function touchRoot() {
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


function touchWeek(
  week
) {
  if (
    !week.metadata
  ) {
    week.metadata = {};
  }

  const now =
    nowIso();

  if (
    !week.metadata
      .createdAt
  ) {
    week.metadata
      .createdAt =
        now;
  }

  week.metadata
    .updatedAt =
      now;

  touchRoot();
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
        "ARI Training workout-plan listener failed.",
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
      "AriTrainingWorkoutPlanStore.subscribe requires a function."
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
// INTERNAL WEEK ACCESS
// =====================================================

function ensureWeek(
  value =
    state.selectedWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    return null;
  }

  if (
    !state.weeks[
      weekKey
    ]
  ) {
    state.weeks[
      weekKey
    ] =
      createEmptyWeek(
        weekKey
      );
  }

  return state.weeks[
    weekKey
  ];
}


function getStoredWeek(
  value =
    state.selectedWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    return null;
  }

  return state.weeks[
    weekKey
  ] ||
    null;
}


function getResolvedWeek(
  value =
    state.selectedWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    return null;
  }

  return clone(
    state.weeks[
      weekKey
    ] ||
    createEmptyWeek(
      weekKey
    )
  );
}


// =====================================================
// READ API
// =====================================================

function getState() {
  return clone(
    state
  );
}


function getSelectedWeekKey() {
  return state
    .selectedWeekKey;
}


function getSelectedWeek() {
  return getResolvedWeek(
    state.selectedWeekKey
  );
}


function getWeek(
  value =
    state.selectedWeekKey
) {
  return getResolvedWeek(
    value
  );
}


function hasStoredWeek(
  value =
    state.selectedWeekKey
) {
  return Boolean(
    getStoredWeek(
      value
    )
  );
}


function getWeekKeys() {
  return Object.keys(
    state.weeks
  ).sort();
}


function getDay(
  day,
  weekValue =
    state.selectedWeekKey
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return null;
  }

  const week =
    getResolvedWeek(
      weekValue
    );

  return week?.days?.[
    normalizedDay
  ]
    ? clone(
        week.days[
          normalizedDay
        ]
      )
    : null;
}


function getDayByDate(
  date
) {
  const dateKey =
    formatDateKey(
      date
    );

  if (!dateKey) {
    return null;
  }

  const weekKey =
    getWeekKey(
      dateKey
    );

  const dayId =
    getDayIdFromDate(
      dateKey
    );

  return getDay(
    dayId,
    weekKey
  );
}


function getToday() {
  return getDayByDate(
    new Date()
  );
}


function getExerciseByEntryId(
  day,
  entryId,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !current ||
    !normalizedEntryId
  ) {
    return null;
  }

  return (
    current.exercises
      .find(
        exercise =>
          exercise.entryId ===
            normalizedEntryId
      ) ||
    null
  );
}


function getExerciseIndexByEntryId(
  day,
  entryId,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const normalizedEntryId =
    normalizeId(
      entryId
    );

  if (
    !current ||
    !normalizedEntryId
  ) {
    return -1;
  }

  return current.exercises
    .findIndex(
      exercise =>
        exercise.entryId ===
          normalizedEntryId
    );
}


// =====================================================
// WEEK NAVIGATION
// =====================================================

function setSelectedWeek(
  value
) {
  const weekKey =
    normalizeWeekKey(
      value
    );

  if (!weekKey) {
    return false;
  }

  state.selectedWeekKey =
    weekKey;

  touchRoot();
  persist();
  emit();

  return true;
}


function goToCurrentWeek() {
  return setSelectedWeek(
    new Date()
  );
}


function goToPreviousWeek() {
  const current =
    toLocalDateOnly(
      state.selectedWeekKey
    );

  if (!current) {
    return false;
  }

  return setSelectedWeek(
    addDays(
      current,
      -7
    )
  );
}


function goToNextWeek() {
  const current =
    toLocalDateOnly(
      state.selectedWeekKey
    );

  if (!current) {
    return false;
  }

  return setSelectedWeek(
    addDays(
      current,
      7
    )
  );
}


// =====================================================
// WEEK METADATA
// =====================================================

function setPlanName(
  name,
  weekValue =
    state.selectedWeekKey
) {
  const normalized =
    normalizeText(
      name
    );

  if (!normalized) {
    return false;
  }

  const week =
    ensureWeek(
      weekValue
    );

  if (!week) {
    return false;
  }

  week.name =
    normalized;

  touchWeek(
    week
  );

  persist();
  emit();

  return true;
}


function setPrimaryGoal(
  goalId,
  weekValue =
    state.selectedWeekKey
) {
  const week =
    ensureWeek(
      weekValue
    );

  if (!week) {
    return false;
  }

  week.primaryGoalId =
    normalizeId(
      goalId
    );

  touchWeek(
    week
  );

  persist();
  emit();

  return true;
}


function setSecondaryGoals(
  goalIds =
    [],
  weekValue =
    state.selectedWeekKey
) {
  const week =
    ensureWeek(
      weekValue
    );

  if (!week) {
    return false;
  }

  week.secondaryGoalIds =
    uniqueStrings(
      goalIds
    );

  touchWeek(
    week
  );

  persist();
  emit();

  return true;
}


// =====================================================
// DAY MUTATIONS
// =====================================================

function setDay(
  day,
  dayState,
  weekValue =
    state.selectedWeekKey
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const week =
    ensureWeek(
      weekValue
    );

  if (
    !normalizedDay ||
    !week
  ) {
    return false;
  }

  const existing =
    week.days[
      normalizedDay
    ];

  week.days[
    normalizedDay
  ] =
    makeDay({
      ...existing,

      ...(
        dayState ||
        {}
      ),

      day:
        normalizedDay,

      date:
        getDayDateForWeek(
          week.weekKey,
          normalizedDay
        )
    });

  touchWeek(
    week
  );

  persist();
  emit();

  return true;
}


function setDayType(
  day,
  type,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (!current) {
    return false;
  }

  const normalizedType =
    normalizeDayType(
      type
    );

  return setDay(
    day,
    {
      ...current,

      type:
        normalizedType,

      focusId:
        normalizedType ===
          "off"
          ? "off_day"
          : current.focusId ||
            "custom",

      title:
        normalizedType ===
          "off"
          ? "Off Day"
          : current.title,

      goal:
        normalizedType ===
          "off"
          ? null
          : current.goal,

      sport:
        normalizedType ===
          "off"
          ? null
          : current.sport,

      workoutId:
        normalizedType ===
          "off"
          ? null
          : current.workoutId,

      estimatedDurationMinutes:
        normalizedType ===
          "off"
          ? null
          : current
              .estimatedDurationMinutes,

      exercises:
        normalizedType ===
          "off"
          ? []
          : current.exercises
    },
    weekValue
  );
}


function setDayFocus(
  day,
  focusId,
  title =
    null,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (!current) {
    return false;
  }

  const normalizedFocusId =
    normalizeId(
      focusId
    );

  if (!normalizedFocusId) {
    return false;
  }

  if (
    normalizedFocusId ===
      "off_day"
  ) {
    return setDay(
      day,
      {
        ...current,

        type:
          "off",

        focusId:
          "off_day",

        title:
          "Off Day",

        goal:
          null,

        sport:
          null,

        workoutId:
          null,

        estimatedDurationMinutes:
          null,

        exercises:
          []
      },
      weekValue
    );
  }

  return setDay(
    day,
    {
      ...current,

      type:
        current.type ===
          "off"
          ? "workout"
          : current.type,

      focusId:
        normalizedFocusId,

      title:
        normalizeText(
          title
        ) ||
        current.title
    },
    weekValue
  );
}


function setDayTitle(
  day,
  title,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const normalized =
    normalizeText(
      title
    );

  if (
    !current ||
    !normalized
  ) {
    return false;
  }

  return setDay(
    day,
    {
      ...current,

      title:
        normalized
    },
    weekValue
  );
}


function setDayGoal(
  day,
  goal,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (
    !current ||
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDay(
    day,
    {
      ...current,

      goal:
        normalizeId(
          goal
        )
    },
    weekValue
  );
}


function setDaySport(
  day,
  sport,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (
    !current ||
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDay(
    day,
    {
      ...current,

      sport:
        normalizeId(
          sport
        )
    },
    weekValue
  );
}


function setDayDuration(
  day,
  estimatedDurationMinutes,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (
    !current ||
    current.type ===
      "off"
  ) {
    return false;
  }

  return setDay(
    day,
    {
      ...current,

      estimatedDurationMinutes:
        normalizePositiveNumber(
          estimatedDurationMinutes
        )
    },
    weekValue
  );
}


// =====================================================
// BUILDER / WORKOUT IMPORT
// =====================================================

function setBuiltWorkout(
  day,
  workoutOrPlanDay,
  {
    focusId =
      null,

    weekKey =
      state.selectedWeekKey
  } = {}
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const resolvedWeekKey =
    normalizeWeekKey(
      weekKey
    );

  if (
    !normalizedDay ||
    !resolvedWeekKey ||
    !workoutOrPlanDay ||
    typeof workoutOrPlanDay !==
      "object"
  ) {
    return false;
  }

  const planDay =
    workoutOrPlanDay.blocks
      ? convertBuilderWorkoutToDay(
          workoutOrPlanDay,
          normalizedDay,
          resolvedWeekKey
        )
      : {
          ...clone(
            workoutOrPlanDay
          ),

          day:
            normalizedDay,

          date:
            getDayDateForWeek(
              resolvedWeekKey,
              normalizedDay
            )
        };

  return setDay(
    normalizedDay,
    {
      ...planDay,

      type:
        planDay.type ===
          "off"
          ? "off"
          : planDay.type ===
              "recovery"
            ? "recovery"
            : "workout",

      focusId:
        normalizeId(
          focusId
        ) ||
        normalizeId(
          planDay.focusId
        ) ||
        "custom",

      metadata: {
        ...(
          planDay.metadata &&
          typeof planDay.metadata ===
            "object"
            ? clone(
                planDay.metadata
              )
            : {}
        ),

        importedAt:
          nowIso()
      }
    },
    resolvedWeekKey
  );
}


function convertBuilderWorkoutToDay(
  workout,
  day,
  weekValue =
    state.selectedWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      weekValue
    );

  if (!weekKey) {
    return null;
  }

  const mainExercises =
    Array.isArray(
      workout.blocks
    )
      ? workout.blocks
          .flatMap(
            block =>
              Array.isArray(
                block.exercises
              )
                ? block.exercises
                : []
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
      : [];

  return {
    day,

    date:
      getDayDateForWeek(
        weekKey,
        day
      ),

    type:
      workout.type ===
        "mobility" &&
      workout.goal ===
        "recovery"
        ? "recovery"
        : "workout",

    title:
      normalizeText(
        workout.title
      ) ||
      DAY_LABELS[
        day
      ],

    goal:
      normalizeId(
        workout.goal
      ),

    sport:
      normalizeId(
        workout.sport
      ),

    workoutId:
      normalizeId(
        workout.workoutId
      ),

    estimatedDurationMinutes:
      normalizePositiveNumber(
        workout
          .estimatedDurationMinutes ??
        workout
          .plannedDurationMinutes
      ),

    exercises:
      mainExercises.map(
        entry => ({
          entryId:
            entry.entryId,

          exerciseId:
            entry.exerciseId,

          role:
            entry.role,

          ...(
            entry.prescription &&
            typeof entry.prescription ===
              "object"
              ? clone(
                  entry.prescription
                )
              : {}
          ),

          metadata: {
            builderEntry:
              true,

            sourceBlock:
              null
          }
        })
      ),

    metadata: {
      source:
        workout.metadata
          ?.source ||
        "workout-builder",

      builderVersion:
        workout.metadata
          ?.version ||
        workout.metadata
          ?.builderVersion ||
        null,

      originalWorkoutMetadata:
        workout.metadata
          ? clone(
              workout.metadata
            )
          : {}
    }
  };
}


// =====================================================
// EXERCISE MUTATIONS
// =====================================================

function addExercise(
  day,
  exerciseEntry,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  if (
    !current ||
    current.type ===
      "off"
  ) {
    return false;
  }

  const normalized =
    normalizePlanExercise(
      exerciseEntry
    );

  if (!normalized) {
    return false;
  }

  if (
    current.exercises
      .some(
        exercise =>
          exercise.entryId ===
            normalized.entryId
      )
  ) {
    normalized.entryId =
      createStableId(
        "plan_exercise"
      );
  }

  current.exercises.push(
    normalized
  );

  return setDay(
    day,
    current,
    weekValue
  );
}


function updateExercise(
  day,
  index,
  patch =
    {},
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const position =
    Number(
      index
    );

  if (
    !current ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises.length ||
    !patch ||
    typeof patch !==
      "object"
  ) {
    return false;
  }

  const merged = {
    ...current.exercises[
      position
    ],

    ...clone(
      patch
    ),

    entryId:
      current.exercises[
        position
      ].entryId
  };

  const normalized =
    normalizePlanExercise(
      merged
    );

  if (!normalized) {
    return false;
  }

  current.exercises[
    position
  ] =
    normalized;

  return setDay(
    day,
    current,
    weekValue
  );
}


function updateExerciseById(
  day,
  entryId,
  patch =
    {},
  weekValue =
    state.selectedWeekKey
) {
  const index =
    getExerciseIndexByEntryId(
      day,
      entryId,
      weekValue
    );

  if (
    index < 0
  ) {
    return false;
  }

  return updateExercise(
    day,
    index,
    patch,
    weekValue
  );
}


function removeExercise(
  day,
  index,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const position =
    Number(
      index
    );

  if (
    !current ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises.length
  ) {
    return false;
  }

  current.exercises.splice(
    position,
    1
  );

  return setDay(
    day,
    current,
    weekValue
  );
}


function removeExerciseById(
  day,
  entryId,
  weekValue =
    state.selectedWeekKey
) {
  const index =
    getExerciseIndexByEntryId(
      day,
      entryId,
      weekValue
    );

  if (
    index < 0
  ) {
    return false;
  }

  return removeExercise(
    day,
    index,
    weekValue
  );
}


function moveExercise(
  day,
  fromIndex,
  toIndex,
  weekValue =
    state.selectedWeekKey
) {
  const current =
    getDay(
      day,
      weekValue
    );

  const from =
    Number(
      fromIndex
    );

  const to =
    Number(
      toIndex
    );

  if (
    !current ||
    !Number.isInteger(
      from
    ) ||
    !Number.isInteger(
      to
    ) ||
    from < 0 ||
    to < 0 ||
    from >=
      current.exercises.length ||
    to >=
      current.exercises.length
  ) {
    return false;
  }

  if (
    from ===
      to
  ) {
    return true;
  }

  const [
    exercise
  ] =
    current.exercises.splice(
      from,
      1
    );

  current.exercises.splice(
    to,
    0,
    exercise
  );

  return setDay(
    day,
    current,
    weekValue
  );
}


function moveExerciseById(
  day,
  entryId,
  toIndex,
  weekValue =
    state.selectedWeekKey
) {
  const fromIndex =
    getExerciseIndexByEntryId(
      day,
      entryId,
      weekValue
    );

  if (
    fromIndex < 0
  ) {
    return false;
  }

  return moveExercise(
    day,
    fromIndex,
    toIndex,
    weekValue
  );
}


// =====================================================
// DAY CLEAR
// =====================================================

function clearDay(
  day,
  weekValue =
    state.selectedWeekKey
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  const week =
    ensureWeek(
      weekValue
    );

  if (
    !normalizedDay ||
    !week
  ) {
    return false;
  }

  week.days[
    normalizedDay
  ] =
    makeDay({
      day:
        normalizedDay,

      date:
        getDayDateForWeek(
          week.weekKey,
          normalizedDay
        ),

      type:
        "off",

      focusId:
        "off_day",

      title:
        "Off Day",

      exercises:
        []
    });

  touchWeek(
    week
  );

  persist();
  emit();

  return true;
}


// =====================================================
// WEEK COPY / REPEAT / CLEAR
// =====================================================

function copyWeek(
  sourceWeekValue,
  targetWeekValue,
  {
    overwrite =
      true,

    markAsRepeat =
      false
  } = {}
) {
  const sourceWeekKey =
    normalizeWeekKey(
      sourceWeekValue
    );

  const targetWeekKey =
    normalizeWeekKey(
      targetWeekValue
    );

  if (
    !sourceWeekKey ||
    !targetWeekKey ||
    sourceWeekKey ===
      targetWeekKey
  ) {
    return false;
  }

  const source =
    getResolvedWeek(
      sourceWeekKey
    );

  if (!source) {
    return false;
  }

  if (
    !overwrite &&
    hasStoredWeek(
      targetWeekKey
    )
  ) {
    return false;
  }

  const target =
    createEmptyWeek(
      targetWeekKey
    );

  target.name =
    source.name;

  target.primaryGoalId =
    source.primaryGoalId;

  target.secondaryGoalIds =
    [
      ...source.secondaryGoalIds
    ];

  for (
    const day
    of DAY_IDS
  ) {
    const sourceDay =
      source.days[
        day
      ];

    target.days[
      day
    ] =
      makeDay({
        ...clone(
          sourceDay
        ),

        day,

        date:
          getDayDateForWeek(
            targetWeekKey,
            day
          ),

        workoutId:
          null,

        exercises:
          normalizeExerciseList(
            sourceDay.exercises,
            {
              regenerateEntryIds:
                true
            }
          ),

        metadata: {
          ...(
            sourceDay.metadata &&
            typeof sourceDay.metadata ===
              "object"
              ? clone(
                  sourceDay.metadata
                )
              : {}
          ),

          copiedFromDate:
            sourceDay.date,

          copiedFromWeekKey:
            sourceWeekKey,

          copiedAt:
            nowIso()
        }
      });
  }

  target.metadata = {
    ...target.metadata,

    createdAt:
      nowIso(),

    updatedAt:
      nowIso(),

    sourceTemplateId:
      null,

    copiedFromWeekKey:
      sourceWeekKey,

    repeatedFromWeekKey:
      markAsRepeat
        ? sourceWeekKey
        : null
  };

  state.weeks[
    targetWeekKey
  ] =
    target;

  touchRoot();
  persist();
  emit();

  return true;
}


function repeatPreviousWeek(
  targetWeekValue =
    state.selectedWeekKey,
  options =
    {}
) {
  const targetWeekKey =
    normalizeWeekKey(
      targetWeekValue
    );

  if (!targetWeekKey) {
    return false;
  }

  const previousWeekKey =
    formatDateKey(
      addDays(
        targetWeekKey,
        -7
      )
    );

  return copyWeek(
    previousWeekKey,
    targetWeekKey,
    {
      ...options,

      markAsRepeat:
        true
    }
  );
}


function clearWeek(
  weekValue =
    state.selectedWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      weekValue
    );

  if (!weekKey) {
    return false;
  }

  state.weeks[
    weekKey
  ] =
    createEmptyWeek(
      weekKey
    );

  touchWeek(
    state.weeks[
      weekKey
    ]
  );

  persist();
  emit();

  return true;
}


function deleteWeek(
  weekValue
) {
  const weekKey =
    normalizeWeekKey(
      weekValue
    );

  if (!weekKey) {
    return false;
  }

  if (
    !state.weeks[
      weekKey
    ]
  ) {
    return true;
  }

  delete state.weeks[
    weekKey
  ];

  touchRoot();
  persist();
  emit();

  return true;
}


// =====================================================
// TEMPLATE SUPPORT
// =====================================================

function applyTemplate(
  template,
  {
    weekKey =
      state.selectedWeekKey
  } = {}
) {
  if (
    !template ||
    typeof template !==
      "object" ||
    !template.schedule
  ) {
    return false;
  }

  const resolvedWeekKey =
    normalizeWeekKey(
      weekKey
    );

  if (!resolvedWeekKey) {
    return false;
  }

  const nextWeek =
    createEmptyWeek(
      resolvedWeekKey
    );

  nextWeek.name =
    normalizeText(
      template.name
    ) ||
    "My Weekly Plan";

  nextWeek.primaryGoalId =
    Array.isArray(
      template.primaryGoals
    )
      ? normalizeId(
          template
            .primaryGoals[0]
        )
      : null;

  nextWeek.secondaryGoalIds =
    Array.isArray(
      template.primaryGoals
    )
      ? uniqueStrings(
          template.primaryGoals
            .slice(1)
        )
      : [];

  for (
    const day
    of DAY_IDS
  ) {
    const templateDay =
      template.schedule[
        day
      ];

    if (!templateDay) {
      continue;
    }

    nextWeek.days[
      day
    ] =
      makeDay({
        day,

        date:
          getDayDateForWeek(
            resolvedWeekKey,
            day
          ),

        ...templateDay,

        workoutId:
          null,

        exercises:
          normalizeExerciseList(
            templateDay.exercises,
            {
              regenerateEntryIds:
                true
            }
          ),

        metadata: {
          ...(
            templateDay
              .metadata &&
            typeof templateDay
              .metadata ===
                "object"
              ? clone(
                  templateDay
                    .metadata
                )
              : {}
          ),

          sourceTemplateId:
            normalizeId(
              template.id
            ),

          appliedAt:
            nowIso()
        }
      });
  }

  nextWeek.metadata = {
    ...nextWeek.metadata,

    createdAt:
      nowIso(),

    updatedAt:
      nowIso(),

    sourceTemplateId:
      normalizeId(
        template.id
      ),

    repeatedFromWeekKey:
      null,

    copiedFromWeekKey:
      null
  };

  state.weeks[
    resolvedWeekKey
  ] =
    nextWeek;

  state.selectedWeekKey =
    resolvedWeekKey;

  touchRoot();
  persist();
  emit();

  return true;
}


// =====================================================
// SUMMARY / QUERY HELPERS
// =====================================================

function getTrainingDays(
  weekValue =
    state.selectedWeekKey
) {
  const week =
    getResolvedWeek(
      weekValue
    );

  return DAY_IDS
    .map(
      day =>
        week.days[
          day
        ]
    )
    .filter(
      dayState =>
        dayState.type !==
          "off"
    )
    .map(
      clone
    );
}


function getOffDays(
  weekValue =
    state.selectedWeekKey
) {
  const week =
    getResolvedWeek(
      weekValue
    );

  return DAY_IDS
    .map(
      day =>
        week.days[
          day
        ]
    )
    .filter(
      dayState =>
        dayState.type ===
          "off"
    )
    .map(
      clone
    );
}


function getSummary(
  weekValue =
    state.selectedWeekKey
) {
  const week =
    getResolvedWeek(
      weekValue
    );

  const trainingDays =
    getTrainingDays(
      week.weekKey
    );

  const offDays =
    getOffDays(
      week.weekKey
    );

  const exerciseCount =
    DAY_IDS.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          week.days[
            day
          ]?.exercises
            ?.length ||
          0
        ),
      0
    );

  const plannedMinutes =
    DAY_IDS.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          normalizePositiveNumber(
            week.days[
              day
            ]
              ?.estimatedDurationMinutes
          ) ||
          0
        ),
      0
    );

  return {
    schemaVersion:
      SCHEMA_VERSION,

    weekKey:
      week.weekKey,

    startDate:
      week.startDate,

    endDate:
      week.endDate,

    name:
      week.name,

    primaryGoalId:
      week.primaryGoalId,

    secondaryGoalIds:
      [
        ...week.secondaryGoalIds
      ],

    trainingDayCount:
      trainingDays.length,

    offDayCount:
      offDays.length,

    exerciseCount,

    plannedMinutes,

    hasStoredWeek:
      hasStoredWeek(
        week.weekKey
      ),

    sourceTemplateId:
      week.metadata
        .sourceTemplateId,

    repeatedFromWeekKey:
      week.metadata
        .repeatedFromWeekKey,

    copiedFromWeekKey:
      week.metadata
        .copiedFromWeekKey,

    builderVersion:
      week.metadata
        .builderVersion,

    updatedAt:
      week.metadata
        .updatedAt
  };
}


// =====================================================
// STATE NORMALIZATION
// =====================================================

function normalizeIncomingWeek(
  sourceWeek,
  fallbackWeekKey
) {
  const weekKey =
    normalizeWeekKey(
      sourceWeek?.weekKey ||
      sourceWeek?.startDate ||
      fallbackWeekKey
    );

  if (!weekKey) {
    return null;
  }

  const fresh =
    createEmptyWeek(
      weekKey
    );

  const sourceDays =
    sourceWeek?.days ||
    sourceWeek?.week ||
    {};

  for (
    const day
    of DAY_IDS
  ) {
    const incomingDay =
      sourceDays[
        day
      ];

    if (
      incomingDay &&
      typeof incomingDay ===
        "object"
    ) {
      fresh.days[
        day
      ] =
        makeDay({
          day,

          date:
            getDayDateForWeek(
              weekKey,
              day
            ),

          ...incomingDay
        });
    }
  }

  fresh.name =
    normalizeText(
      sourceWeek?.name
    ) ||
    fresh.name;

  fresh.primaryGoalId =
    normalizeId(
      sourceWeek
        ?.primaryGoalId
    );

  fresh.secondaryGoalIds =
    uniqueStrings(
      sourceWeek
        ?.secondaryGoalIds
    );

  fresh.metadata = {
    ...fresh.metadata,

    ...(
      sourceWeek?.metadata &&
      typeof sourceWeek
        .metadata ===
          "object"
        ? clone(
            sourceWeek
              .metadata
          )
        : {}
    )
  };

  return fresh;
}


function normalizeIncomingState(
  incoming
) {
  const fresh =
    createInitialState();

  const normalized = {
    ...fresh,

    planId:
      normalizeId(
        incoming?.planId
      ),

    selectedWeekKey:
      normalizeWeekKey(
        incoming?.selectedWeekKey ||
        new Date()
      ) ||
      fresh.selectedWeekKey,

    weeks:
      {},

    metadata: {
      ...fresh.metadata,

      ...(
        incoming?.metadata &&
        typeof incoming
          .metadata ===
            "object"
          ? clone(
              incoming
                .metadata
            )
          : {}
      )
    }
  };

  const sourceWeeks =
    incoming?.weeks &&
    typeof incoming.weeks ===
      "object"
      ? incoming.weeks
      : {};

  for (
    const [
      weekKey,
      sourceWeek
    ]
    of Object.entries(
      sourceWeeks
    )
  ) {
    const week =
      normalizeIncomingWeek(
        sourceWeek,
        weekKey
      );

    if (!week) {
      continue;
    }

    normalized.weeks[
      week.weekKey
    ] =
      week;
  }

  return normalized;
}


function replaceState(
  nextState
) {
  if (
    !nextState ||
    typeof nextState !==
      "object"
  ) {
    return false;
  }

  const normalized =
    normalizeIncomingState(
      nextState
    );

  state.schemaVersion =
    SCHEMA_VERSION;

  state.version =
    VERSION;

  state.source =
    SOURCE;

  state.planId =
    normalized.planId;

  state.selectedWeekKey =
    normalized
      .selectedWeekKey;

  state.weeks =
    normalized.weeks;

  state.metadata =
    normalized.metadata;

  emit();

  return true;
}


// =====================================================
// V2 / V1 MIGRATION
// =====================================================

function migrateLegacyRepeatingPlan(
  legacyState,
  {
    targetWeekKey =
      getWeekKey(
        new Date()
      )
  } = {}
) {
  if (
    !legacyState ||
    typeof legacyState !==
      "object"
  ) {
    return null;
  }

  const resolvedTargetWeekKey =
    normalizeWeekKey(
      targetWeekKey
    );

  if (!resolvedTargetWeekKey) {
    return null;
  }

  const migrated =
    createInitialState();

  const week =
    createEmptyWeek(
      resolvedTargetWeekKey
    );

  week.name =
    normalizeText(
      legacyState.name
    ) ||
    "My Weekly Plan";

  week.primaryGoalId =
    normalizeId(
      legacyState
        .primaryGoalId
    );

  week.secondaryGoalIds =
    uniqueStrings(
      legacyState
        .secondaryGoalIds
    );

  const legacyWeek =
    legacyState.week &&
    typeof legacyState.week ===
      "object"
      ? legacyState.week
      : {};

  for (
    const day
    of DAY_IDS
  ) {
    const legacyDay =
      legacyWeek[
        day
      ];

    if (
      !legacyDay ||
      typeof legacyDay !==
        "object"
    ) {
      continue;
    }

    week.days[
      day
    ] =
      makeDay({
        day,

        date:
          getDayDateForWeek(
            resolvedTargetWeekKey,
            day
          ),

        ...legacyDay,

        workoutId:
          null,

        exercises:
          normalizeExerciseList(
            legacyDay.exercises,
            {
              regenerateEntryIds:
                true
            }
          ),

        metadata: {
          ...(
            legacyDay.metadata &&
            typeof legacyDay
              .metadata ===
                "object"
              ? clone(
                  legacyDay.metadata
                )
              : {}
          ),

          migratedFromLegacyPlan:
            true
        }
      });
  }

  week.metadata = {
    ...week.metadata,

    createdAt:
      nowIso(),

    updatedAt:
      nowIso(),

    sourceTemplateId:
      normalizeId(
        legacyState
          .metadata
          ?.sourceTemplateId
      ),

    builderVersion:
      normalizeId(
        legacyState
          .metadata
          ?.builderVersion
      )
  };

  migrated.planId =
    normalizeId(
      legacyState.planId
    );

  migrated.selectedWeekKey =
    resolvedTargetWeekKey;

  migrated.weeks[
    resolvedTargetWeekKey
  ] =
    week;

  migrated.metadata = {
    ...migrated.metadata,

    migratedFrom:
      legacyState.schemaVersion ===
        2
        ? "ari_training_weekly_plan_v2"
        : "ari_training_weekly_plan_v1",

    migratedAt:
      nowIso()
  };

  return migrated;
}


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
        migrateLegacyRepeatingPlan(
          parsed
        );

      if (!migrated) {
        continue;
      }

      replaceState(
        migrated
      );

      persist();

      return true;
    } catch (
      error
    ) {
      console.warn(
        `ARI Training workout plan could not migrate legacy key "${legacyKey}".`,
        error
      );
    }
  }

  return false;
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
      "ARI Training workout plan could not persist locally.",
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

      if (
        replaceState(
          parsed
        )
      ) {
        return true;
      }
    }

    return hydrateLegacy();
  } catch (
    error
  ) {
    console.warn(
      "ARI Training workout plan could not hydrate from local storage.",
      error
    );

    return hydrateLegacy();
  }
}


function save() {
  touchRoot();

  const persisted =
    persist();

  emit();

  return persisted;
}


// =====================================================
// RESET
// =====================================================

function reset() {
  const fresh =
    createInitialState();

  state.schemaVersion =
    fresh.schemaVersion;

  state.version =
    fresh.version;

  state.source =
    fresh.source;

  state.planId =
    fresh.planId;

  state.selectedWeekKey =
    fresh.selectedWeekKey;

  state.weeks =
    fresh.weeks;

  state.metadata =
    fresh.metadata;

  persist();
  emit();

  return true;
}


// =====================================================
// VALIDATION
// =====================================================

function validate() {
  const errors = [];
  const warnings = [];

  if (
    state.schemaVersion !==
      SCHEMA_VERSION
  ) {
    warnings.push(
      `Plan schema version is ${state.schemaVersion}; expected ${SCHEMA_VERSION}.`
    );
  }

  if (
    !normalizeWeekKey(
      state.selectedWeekKey
    )
  ) {
    errors.push(
      "selectedWeekKey is invalid."
    );
  }

  for (
    const [
      weekKey,
      week
    ]
    of Object.entries(
      state.weeks
    )
  ) {
    if (
      normalizeWeekKey(
        weekKey
      ) !==
        weekKey
    ) {
      errors.push(
        `Stored week key "${weekKey}" is not a valid Sunday week key.`
      );
    }

    if (
      week.weekKey !==
        weekKey
    ) {
      errors.push(
        `Stored week "${weekKey}" reports mismatched weekKey "${week.weekKey}".`
      );
    }

    if (
      !week.days ||
      typeof week.days !==
        "object"
    ) {
      errors.push(
        `Week "${weekKey}" has no days object.`
      );

      continue;
    }

    for (
      const day
      of DAY_IDS
    ) {
      const dayState =
        week.days[
          day
        ];

      if (!dayState) {
        errors.push(
          `Week "${weekKey}" is missing "${day}".`
        );

        continue;
      }

      const expectedDate =
        getDayDateForWeek(
          weekKey,
          day
        );

      if (
        dayState.day !==
          day
      ) {
        errors.push(
          `Week "${weekKey}" day "${day}" contains mismatched day id "${dayState.day}".`
        );
      }

      if (
        dayState.date !==
          expectedDate
      ) {
        errors.push(
          `Week "${weekKey}" day "${day}" has date "${dayState.date}", expected "${expectedDate}".`
        );
      }

      if (
        !VALID_DAY_TYPES.includes(
          dayState.type
        )
      ) {
        errors.push(
          `Week "${weekKey}" day "${day}" has invalid type "${dayState.type}".`
        );
      }

      const entryIds =
        new Set();

      for (
        const exercise
        of dayState.exercises ||
        []
      ) {
        if (
          !exercise?.exerciseId
        ) {
          errors.push(
            `Week "${weekKey}" day "${day}" contains an exercise without exerciseId.`
          );
        }

        if (
          !exercise?.entryId
        ) {
          errors.push(
            `Week "${weekKey}" day "${day}" contains exercise "${exercise?.exerciseId || "unknown"}" without entryId.`
          );
        } else if (
          entryIds.has(
            exercise.entryId
          )
        ) {
          errors.push(
            `Week "${weekKey}" day "${day}" contains duplicate entryId "${exercise.entryId}".`
          );
        } else {
          entryIds.add(
            exercise.entryId
          );
        }
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

    legacyStorageKeys:
      [
        ...LEGACY_STORAGE_KEYS
      ],

    selectedWeekKey:
      state.selectedWeekKey,

    storedWeekCount:
      Object.keys(
        state.weeks
      ).length,

    storedWeekKeys:
      getWeekKeys(),

    selectedWeekSummary:
      getSummary(),

    validation:
      validate()
  };
}


// =====================================================
// PUBLIC STORE
// =====================================================

const AriTrainingWorkoutPlanStore =
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
      DAY_IDS,

    dayLabels:
      DAY_LABELS,

    formatDateKey,

    getWeekKey,

    getWeekRange,

    getDayIdFromDate,

    getDayDateForWeek,

    getState,

    getSelectedWeekKey,

    getSelectedWeek,

    getWeek,

    getWeekKeys,

    hasStoredWeek,

    getDay,

    getDayByDate,

    getToday,

    getExerciseByEntryId,

    getExerciseIndexByEntryId,

    getSummary,

    getTrainingDays,

    getOffDays,

    setSelectedWeek,

    goToCurrentWeek,

    goToPreviousWeek,

    goToNextWeek,

    setPlanName,

    setPrimaryGoal,

    setSecondaryGoals,

    setDay,

    setDayType,

    setDayFocus,

    setDayTitle,

    setDayGoal,

    setDaySport,

    setDayDuration,

    setBuiltWorkout,

    addExercise,

    updateExercise,

    updateExerciseById,

    removeExercise,

    removeExerciseById,

    moveExercise,

    moveExerciseById,

    clearDay,

    copyWeek,

    repeatPreviousWeek,

    clearWeek,

    deleteWeek,

    applyTemplate,

    replaceState,

    migrateLegacyRepeatingPlan,

    hydrate,

    save,

    reset,

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

  Ari.training.workoutPlan =
    AriTrainingWorkoutPlanStore;

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

  DAY_IDS as DAYS,
  DAY_LABELS,

  formatDateKey,
  getWeekKey,
  getWeekRange,
  getDayIdFromDate,
  getDayDateForWeek,

  createEmptyWeek,
  makeDay,

  normalizePlanExercise,

  getState,

  getSelectedWeekKey,
  getSelectedWeek,

  getWeek,
  getWeekKeys,
  hasStoredWeek,

  getDay,
  getDayByDate,
  getToday,

  getExerciseByEntryId,
  getExerciseIndexByEntryId,

  getSummary,
  getTrainingDays,
  getOffDays,

  setSelectedWeek,
  goToCurrentWeek,
  goToPreviousWeek,
  goToNextWeek,

  setPlanName,
  setPrimaryGoal,
  setSecondaryGoals,

  setDay,
  setDayType,
  setDayFocus,
  setDayTitle,
  setDayGoal,
  setDaySport,
  setDayDuration,

  setBuiltWorkout,

  addExercise,
  updateExercise,
  updateExerciseById,
  removeExercise,
  removeExerciseById,
  moveExercise,
  moveExerciseById,

  clearDay,

  copyWeek,
  repeatPreviousWeek,
  clearWeek,
  deleteWeek,

  applyTemplate,

  replaceState,
  migrateLegacyRepeatingPlan,

  hydrate,
  save,
  reset,

  subscribe,

  validate,
  getDiagnostics,

  AriTrainingWorkoutPlanStore
};

export default
  AriTrainingWorkoutPlanStore;
