// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-store.js
// Version: 2.0.0
// Purpose:
//   Persistent local state store for a user's editable
//   Monday-Sunday ARI Training workout plan.
//
// V2.0.0:
//   - Keeps permanent weekly-plan definition separate from
//     live workout/session execution.
//   - Supports builder-generated workout metadata.
//   - Adds stable entryId values for planned exercises.
//   - Supports goal, sport, duration, workoutId, and day metadata.
//   - Preserves backward compatibility with V1 exercise records.
//   - Automatically migrates local V1 plan data to V2.
//   - Keeps localStorage as an immediate/offline fallback.
//   - Remains compatible with existing workout templates.
//
// Important separation:
//   workout-plan-store.js
//     = what the user plans to do.
//
//   workout-progress-store.js
//     = what the user is doing / completed in the session.
//
// The plan store should NOT persist:
//   - completed sets
//   - average workout heart rate
//   - active-session elapsed time
//   - live exercise reorder
//   - live substitutions
//   - temporary added exercises
//   - session completion
// =====================================================

const VERSION =
  "2.0.0";

const SCHEMA_VERSION =
  2;

const SOURCE =
  "js/training/workout-plan-store";

const STORAGE_KEY =
  "ari_training_weekly_plan_v2";

const LEGACY_STORAGE_KEYS =
  Object.freeze([
    "ari_training_weekly_plan_v1"
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


const DAY_LABELS =
  Object.freeze({
    monday:
      "Monday",

    tuesday:
      "Tuesday",

    wednesday:
      "Wednesday",

    thursday:
      "Thursday",

    friday:
      "Friday",

    saturday:
      "Saturday",

    sunday:
      "Sunday"
  });


const VALID_DAY_TYPES =
  Object.freeze([
    "workout",
    "recovery",
    "off"
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


function normalizeDayType(
  value
) {
  const type =
    normalizeText(
      value
    )
      .toLowerCase();

  return VALID_DAY_TYPES
    .includes(
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
    "plan_entry"
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
  return [
    ...new Set(
      Array.isArray(
        values
      )
        ? values
            .map(
              normalizeId
            )
            .filter(Boolean)
        : []
    )
  ];
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

  /*
   * Preserve extra plan-level prescription fields that the
   * builder or templates may introduce later without allowing
   * execution state to leak into the plan.
   */
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
      ] !== undefined
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
  exercises
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
        exercise
      );

    if (!entry) {
      continue;
    }

    if (
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
// INITIAL STATE
// =====================================================

function createEmptyWeek() {
  return DAYS.reduce(
    (
      week,
      day
    ) => {
      week[
        day
      ] =
        makeDay({
          day,
          type:
            "off",
          focusId:
            "off_day",
          title:
            "Off Day",
          exercises:
            []
        });

      return week;
    },
    {}
  );
}


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

    name:
      "My Weekly Plan",

    primaryGoalId:
      null,

    secondaryGoalIds:
      [],

    week:
      createEmptyWeek(),

    metadata: {
      createdAt:
        null,

      updatedAt:
        null,

      sourceTemplateId:
        null,

      migratedFrom:
        null,

      builderVersion:
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
// READ API
// =====================================================

function getState() {
  return clone(
    state
  );
}


function getWeek() {
  return clone(
    state.week
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
    state.week[
      normalizedDay
    ]
  );
}


function getExerciseByEntryId(
  day,
  entryId
) {
  const current =
    getDay(
      day
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
  entryId
) {
  const current =
    getDay(
      day
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
// PLAN METADATA MUTATIONS
// =====================================================

function setPlanName(
  name
) {
  const normalized =
    normalizeText(
      name
    );

  if (!normalized) {
    return false;
  }

  state.name =
    normalized;

  touch();
  emit();

  return true;
}


function setPrimaryGoal(
  goalId
) {
  state.primaryGoalId =
    normalizeId(
      goalId
    );

  touch();
  emit();

  return true;
}


function setSecondaryGoals(
  goalIds =
    []
) {
  state.secondaryGoalIds =
    uniqueStrings(
      goalIds
    );

  touch();
  emit();

  return true;
}


// =====================================================
// DAY MUTATIONS
// =====================================================

function setDay(
  day,
  dayState
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  const existing =
    state.week[
      normalizedDay
    ];

  state.week[
    normalizedDay
  ] =
    makeDay({
      ...existing,

      ...(
        dayState ||
        {}
      ),

      day:
        normalizedDay
    });

  touch();
  emit();

  return true;
}


function setDayType(
  day,
  type
) {
  const current =
    getDay(
      day
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
    }
  );
}


function setDayFocus(
  day,
  focusId,
  title =
    null
) {
  const current =
    getDay(
      day
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
    }
  );
}


function setDayTitle(
  day,
  title
) {
  const current =
    getDay(
      day
    );

  if (!current) {
    return false;
  }

  const normalized =
    normalizeText(
      title
    );

  if (!normalized) {
    return false;
  }

  return setDay(
    day,
    {
      ...current,

      title:
        normalized
    }
  );
}


function setDayGoal(
  day,
  goal
) {
  const current =
    getDay(
      day
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
    }
  );
}


function setDaySport(
  day,
  sport
) {
  const current =
    getDay(
      day
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
    }
  );
}


function setDayDuration(
  day,
  estimatedDurationMinutes
) {
  const current =
    getDay(
      day
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
    }
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
      null
  } = {}
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (
    !normalizedDay ||
    !workoutOrPlanDay ||
    typeof workoutOrPlanDay !==
      "object"
  ) {
    return false;
  }

  const planDay =
    workoutOrPlanDay
      .blocks
      ? convertBuilderWorkoutToDay(
          workoutOrPlanDay,
          normalizedDay
        )
      : {
          ...clone(
            workoutOrPlanDay
          ),
          day:
            normalizedDay
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
    }
  );
}


function convertBuilderWorkoutToDay(
  workout,
  day
) {
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
  exerciseEntry
) {
  const current =
    getDay(
      day
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

  /*
   * Ensure unique stable entryId even when the same exerciseId
   * appears more than once in the same planned workout.
   */
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
    current
  );
}


function updateExercise(
  day,
  index,
  patch =
    {}
) {
  const current =
    getDay(
      day
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
    current
  );
}


function updateExerciseById(
  day,
  entryId,
  patch =
    {}
) {
  const index =
    getExerciseIndexByEntryId(
      day,
      entryId
    );

  if (
    index < 0
  ) {
    return false;
  }

  return updateExercise(
    day,
    index,
    patch
  );
}


function removeExercise(
  day,
  index
) {
  const current =
    getDay(
      day
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
    current
  );
}


function removeExerciseById(
  day,
  entryId
) {
  const index =
    getExerciseIndexByEntryId(
      day,
      entryId
    );

  if (
    index < 0
  ) {
    return false;
  }

  return removeExercise(
    day,
    index
  );
}


function moveExercise(
  day,
  fromIndex,
  toIndex
) {
  const current =
    getDay(
      day
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
      current.exercises.length ||
    from ===
      to
  ) {
    return false;
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
    current
  );
}


function moveExerciseById(
  day,
  entryId,
  toIndex
) {
  const fromIndex =
    getExerciseIndexByEntryId(
      day,
      entryId
    );

  if (
    fromIndex < 0
  ) {
    return false;
  }

  return moveExercise(
    day,
    fromIndex,
    toIndex
  );
}


// =====================================================
// DAY CLEAR / RESET
// =====================================================

function clearDay(
  day
) {
  const normalizedDay =
    normalizeDay(
      day
    );

  if (!normalizedDay) {
    return false;
  }

  state.week[
    normalizedDay
  ] =
    makeDay({
      day:
        normalizedDay,

      type:
        "off",

      focusId:
        "off_day",

      title:
        "Off Day",

      exercises:
        []
    });

  touch();
  emit();

  return true;
}


// =====================================================
// TEMPLATE SUPPORT
// =====================================================

function applyTemplate(
  template
) {
  if (
    !template ||
    typeof template !==
      "object" ||
    !template.schedule
  ) {
    return false;
  }

  const nextWeek =
    createEmptyWeek();

  for (
    const day
    of DAYS
  ) {
    const templateDay =
      template.schedule[
        day
      ];

    if (!templateDay) {
      continue;
    }

    nextWeek[
      day
    ] =
      makeDay({
        day,

        ...templateDay,

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
            )
        }
      });
  }

  state.planId =
    null;

  state.name =
    normalizeText(
      template.name
    ) ||
    "My Weekly Plan";

  state.primaryGoalId =
    Array.isArray(
      template.primaryGoals
    )
      ? normalizeId(
          template
            .primaryGoals[0]
        )
      : null;

  state.secondaryGoalIds =
    Array.isArray(
      template.primaryGoals
    )
      ? uniqueStrings(
          template.primaryGoals
            .slice(1)
        )
      : [];

  state.week =
    nextWeek;

  state.metadata
    .sourceTemplateId =
      normalizeId(
        template.id
      );

  if (
    !state.metadata
      .createdAt
  ) {
    state.metadata
      .createdAt =
        nowIso();
  }

  touch();
  persist();
  emit();

  return true;
}


// =====================================================
// STATE REPLACEMENT / NORMALIZATION
// =====================================================

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

  state.name =
    normalized.name;

  state.primaryGoalId =
    normalized
      .primaryGoalId;

  state.secondaryGoalIds =
    normalized
      .secondaryGoalIds;

  state.week =
    normalized.week;

  state.metadata =
    normalized.metadata;

  emit();

  return true;
}


function normalizeIncomingState(
  incoming
) {
  const fresh =
    createInitialState();

  const week =
    createEmptyWeek();

  for (
    const day
    of DAYS
  ) {
    const dayState =
      incoming.week?.[
        day
      ];

    if (
      dayState &&
      typeof dayState ===
        "object"
    ) {
      week[
        day
      ] =
        makeDay({
          day,
          ...dayState
        });
    }
  }

  return {
    schemaVersion:
      SCHEMA_VERSION,

    version:
      VERSION,

    source:
      SOURCE,

    planId:
      normalizeId(
        incoming.planId
      ),

    name:
      normalizeText(
        incoming.name
      ) ||
      fresh.name,

    primaryGoalId:
      normalizeId(
        incoming
          .primaryGoalId
      ),

    secondaryGoalIds:
      uniqueStrings(
        incoming
          .secondaryGoalIds
      ),

    week,

    metadata: {
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
    }
  };
}


// =====================================================
// V1 MIGRATION
// =====================================================

function migrateV1State(
  legacyState
) {
  if (
    !legacyState ||
    typeof legacyState !==
      "object"
  ) {
    return null;
  }

  const migrated =
    normalizeIncomingState(
      legacyState
    );

  migrated.metadata = {
    ...migrated.metadata,

    migratedFrom:
      "ari_training_weekly_plan_v1",

    migratedAt:
      nowIso()
  };

  /*
   * V1 exercise entries did not have entryId.
   * normalizeIncomingState() creates one for each entry.
   */

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
        migrateV1State(
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

      const replaced =
        replaceState(
          parsed
        );

      if (
        replaced
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
  touch();

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

  state.name =
    fresh.name;

  state.primaryGoalId =
    fresh.primaryGoalId;

  state.secondaryGoalIds =
    fresh.secondaryGoalIds;

  state.week =
    fresh.week;

  state.metadata =
    fresh.metadata;

  persist();
  emit();

  return true;
}


// =====================================================
// SUMMARY / QUERY HELPERS
// =====================================================

function getTrainingDays() {
  return DAYS
    .map(
      day =>
        state.week[
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


function getOffDays() {
  return DAYS
    .map(
      day =>
        state.week[
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


function getSummary() {
  const trainingDays =
    getTrainingDays();

  const offDays =
    getOffDays();

  const exerciseCount =
    DAYS.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          state.week[
            day
          ]?.exercises
            ?.length ||
          0
        ),
      0
    );

  const plannedMinutes =
    DAYS.reduce(
      (
        total,
        day
      ) =>
        total +
        (
          normalizePositiveNumber(
            state.week[
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
      state.schemaVersion,

    name:
      state.name,

    primaryGoalId:
      state.primaryGoalId,

    secondaryGoalIds:
      [
        ...state
          .secondaryGoalIds
      ],

    trainingDayCount:
      trainingDays.length,

    offDayCount:
      offDays.length,

    exerciseCount,

    plannedMinutes,

    sourceTemplateId:
      state.metadata
        .sourceTemplateId,

    builderVersion:
      state.metadata
        .builderVersion,

    updatedAt:
      state.metadata
        .updatedAt
  };
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

  for (
    const day
    of DAYS
  ) {
    const dayState =
      state.week[
        day
      ];

    if (!dayState) {
      errors.push(
        `Missing day "${day}".`
      );

      continue;
    }

    if (
      dayState.day !==
        day
    ) {
      errors.push(
        `Day "${day}" contains mismatched day id "${dayState.day}".`
      );
    }

    if (
      !VALID_DAY_TYPES
        .includes(
          dayState.type
        )
    ) {
      errors.push(
        `Day "${day}" has invalid type "${dayState.type}".`
      );
    }

    const entryIds =
      new Set();

    for (
      const exercise
      of dayState
        .exercises ||
      []
    ) {
      if (
        !exercise
          ?.exerciseId
      ) {
        errors.push(
          `Day "${day}" contains an exercise without exerciseId.`
        );
      }

      if (
        !exercise
          ?.entryId
      ) {
        errors.push(
          `Day "${day}" contains exercise "${exercise?.exerciseId || "unknown"}" without entryId.`
        );
      } else if (
        entryIds.has(
          exercise.entryId
        )
      ) {
        errors.push(
          `Day "${day}" contains duplicate entryId "${exercise.entryId}".`
        );
      } else {
        entryIds.add(
          exercise.entryId
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

    legacyStorageKeys:
      [
        ...LEGACY_STORAGE_KEYS
      ],

    summary:
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
      DAYS,

    dayLabels:
      DAY_LABELS,

    getState,

    getWeek,

    getDay,

    getExerciseByEntryId,

    getExerciseIndexByEntryId,

    getSummary,

    getTrainingDays,

    getOffDays,

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

    applyTemplate,

    replaceState,

    migrateV1State,

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

  DAYS,
  DAY_LABELS,

  createEmptyWeek,
  makeDay,

  normalizePlanExercise,

  getState,
  getWeek,
  getDay,

  getExerciseByEntryId,
  getExerciseIndexByEntryId,

  getSummary,
  getTrainingDays,
  getOffDays,

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

  applyTemplate,

  replaceState,
  migrateV1State,

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
