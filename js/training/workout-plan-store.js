// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-store.js
// Version: 1.0.0
// Purpose:
//   Local state store for a user's editable seven-day
//   ARI Training workout plan.
//
// Design:
//   - Keeps Monday-Sunday plan state separate from templates.
//   - Supports workout, recovery, and off-day records.
//   - Stores exercise references by approved exercise ID.
//   - Persists a local fallback copy in localStorage.
//   - Future Supabase persistence can sit above this store.
// =====================================================

const VERSION = "1.0.0";
const SOURCE = "js/training/workout-plan-store";

const STORAGE_KEY =
  "ari_training_weekly_plan_v1";

const DAYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
]);

const DAY_LABELS = Object.freeze({
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday"
});

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

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function makeDay({
  day,
  type = "off",
  focusId = "off_day",
  title = null,
  exercises = []
} = {}) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    throw new TypeError(
      "AriTrainingWorkoutPlanStore.makeDay requires a valid weekday."
    );
  }

  const normalizedType =
    ["workout", "recovery", "off"]
      .includes(
        String(type)
          .trim()
          .toLowerCase()
      )
      ? String(type)
          .trim()
          .toLowerCase()
      : "off";

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
      normalizedType ===
        "off"
        ? "off_day"
        : normalizeId(
            focusId
          ) ||
          "custom",

    title:
      normalizeText(title) ||
      (
        normalizedType ===
          "off"
          ? "Off Day"
          : DAY_LABELS[
              normalizedDay
            ]
      ),

    exercises:
      Array.isArray(
        exercises
      )
        ? clone(
            exercises
          )
        : []
  };
}

function createEmptyWeek() {
  return DAYS.reduce(
    (week, day) => {
      week[day] =
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
        null
    }
  };
}

const state =
  createInitialState();

const listeners =
  new Set();

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
        "ARI Training workout-plan listener failed.",
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

function getDay(day) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return null;
  }

  return clone(
    state.week[
      normalizedDay
    ]
  );
}

function setPlanName(name) {
  const normalized =
    normalizeText(name);

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
  goalIds = []
) {
  state.secondaryGoalIds =
    Array.isArray(
      goalIds
    )
      ? [
          ...new Set(
            goalIds
              .map(
                normalizeId
              )
              .filter(Boolean)
          )
        ]
      : [];

  touch();
  emit();

  return true;
}

function setDay(
  day,
  dayState
) {
  const normalizedDay =
    normalizeDay(day);

  if (!normalizedDay) {
    return false;
  }

  state.week[
    normalizedDay
  ] =
    makeDay({
      day:
        normalizedDay,

      ...(dayState ||
        {})
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
    getDay(day);

  if (!current) {
    return false;
  }

  const normalizedType =
    String(type || "")
      .trim()
      .toLowerCase();

  if (
    ![
      "workout",
      "recovery",
      "off"
    ].includes(
      normalizedType
    )
  ) {
    return false;
  }

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
  title = null
) {
  const current =
    getDay(day);

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
    getDay(day);

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

function addExercise(
  day,
  exerciseEntry
) {
  const current =
    getDay(day);

  if (
    !current ||
    current.type ===
      "off" ||
    !exerciseEntry ||
    typeof exerciseEntry !==
      "object"
  ) {
    return false;
  }

  const exerciseId =
    normalizeId(
      exerciseEntry
        .exerciseId
    );

  if (!exerciseId) {
    return false;
  }

  current.exercises.push({
    ...clone(
      exerciseEntry
    ),

    exerciseId
  });

  return setDay(
    day,
    current
  );
}

function updateExercise(
  day,
  index,
  patch = {}
) {
  const current =
    getDay(day);

  const position =
    Number(index);

  if (
    !current ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises
        .length ||
    !patch ||
    typeof patch !==
      "object"
  ) {
    return false;
  }

  current.exercises[
    position
  ] = {
    ...current.exercises[
      position
    ],
    ...clone(
      patch
    )
  };

  return setDay(
    day,
    current
  );
}

function removeExercise(
  day,
  index
) {
  const current =
    getDay(day);

  const position =
    Number(index);

  if (
    !current ||
    !Number.isInteger(
      position
    ) ||
    position < 0 ||
    position >=
      current.exercises
        .length
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

function moveExercise(
  day,
  fromIndex,
  toIndex
) {
  const current =
    getDay(day);

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
      current.exercises
        .length ||
    to >=
      current.exercises
        .length ||
    from === to
  ) {
    return false;
  }

  const [
    exercise
  ] =
    current.exercises
      .splice(
        from,
        1
      );

  current.exercises
    .splice(
      to,
      0,
      exercise
    );

  return setDay(
    day,
    current
  );
}

function clearDay(day) {
  const normalizedDay =
    normalizeDay(day);

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

  for (const day of DAYS) {
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
        ...templateDay
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
      ? template
          .primaryGoals
          .slice(1)
          .map(
            normalizeId
          )
          .filter(Boolean)
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
        new Date()
          .toISOString();
  }

  touch();
  persist();
  emit();

  return true;
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

  const fresh =
    createInitialState();

  state.planId =
    normalizeId(
      nextState.planId
    );

  state.name =
    normalizeText(
      nextState.name
    ) ||
    fresh.name;

  state.primaryGoalId =
    normalizeId(
      nextState.primaryGoalId
    );

  state.secondaryGoalIds =
    Array.isArray(
      nextState.secondaryGoalIds
    )
      ? nextState
          .secondaryGoalIds
          .map(
            normalizeId
          )
          .filter(Boolean)
      : [];

  state.week =
    createEmptyWeek();

  for (const day of DAYS) {
    const incoming =
      nextState.week?.[
        day
      ];

    if (incoming) {
      state.week[
        day
      ] =
        makeDay({
          day,
          ...incoming
        });
    }
  }

  state.metadata = {
    ...fresh.metadata,
    ...(
      nextState.metadata &&
      typeof nextState.metadata ===
        "object"
        ? clone(
            nextState.metadata
          )
        : {}
    )
  };

  emit();

  return true;
}

function reset() {
  const fresh =
    createInitialState();

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

    if (!raw) {
      return false;
    }

    const parsed =
      JSON.parse(
        raw
      );

    return replaceState(
      parsed
    );
  } catch (error) {
    console.warn(
      "ARI Training workout plan could not hydrate from local storage.",
      error
    );

    return false;
  }
}

function save() {
  touch();

  const persisted =
    persist();

  emit();

  return persisted;
}

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

  return {
    name:
      state.name,

    primaryGoalId:
      state.primaryGoalId,

    trainingDayCount:
      trainingDays.length,

    offDayCount:
      offDays.length,

    exerciseCount,

    sourceTemplateId:
      state.metadata
        .sourceTemplateId,

    updatedAt:
      state.metadata
        .updatedAt
  };
}

const AriTrainingWorkoutPlanStore =
  Object.freeze({
    version:
      VERSION,

    source:
      SOURCE,

    storageKey:
      STORAGE_KEY,

    days:
      DAYS,

    dayLabels:
      DAY_LABELS,

    getState,

    getWeek,

    getDay,

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

    addExercise,

    updateExercise,

    removeExercise,

    moveExercise,

    clearDay,

    applyTemplate,

    replaceState,

    hydrate,

    save,

    reset,

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

  Ari.training.workoutPlan =
    AriTrainingWorkoutPlanStore;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  STORAGE_KEY,
  DAYS,
  DAY_LABELS,
  createEmptyWeek,
  makeDay,
  getState,
  getWeek,
  getDay,
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
  addExercise,
  updateExercise,
  removeExercise,
  moveExercise,
  clearDay,
  applyTemplate,
  replaceState,
  hydrate,
  save,
  reset,
  subscribe,
  AriTrainingWorkoutPlanStore
};

export default AriTrainingWorkoutPlanStore;
