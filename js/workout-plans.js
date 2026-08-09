// =====================================================
// ARI REBIRTH
// File: js/workout-plans.js
// Version: 3.2.0
// Purpose:
//   Page controller for workout-plans.html.
//
// V3.2.0:
//   - Preserves the full V3.1.0 Workout Plans feature set.
//   - Fixes iPhone/mobile dialog stacking for + Add Exercise.
//   - Uses the active calendar date for V3 controller mutations.
//   - Keeps weekday compatibility fallbacks where needed.
//   - Reopens the Training Day editor after the picker closes.
//   - Prevents nested modal showModal() conflicts.
//   - Keeps Sunday-Saturday calendar weeks.
//   - Keeps Templates, Exercise Library, focus filtering,
//     exercise details, autosave, Repeat Last Week, Clear Week,
//     optional weight, 120-second set rest, and Done collapse.
// =====================================================

import WorkoutPlanController
  from "./training/workout-plan-controller.js";

import ExerciseRegistry
  from "./training/exercises/exercise-registry.js";

import WorkoutFocuses
  from "./training/workouts/workout-focuses.js";

import FitnessGoals
  from "./training/goals/fitness-goals.js";

import BodyParts
  from "./training/anatomy/body-parts.js";

import Muscles
  from "./training/anatomy/muscles.js";

import MovementPatterns
  from "./training/movements/movement-patterns.js";

import ExerciseTypes
  from "./training/movements/exercise-types.js";


const VERSION =
  "3.2.0";

const SOURCE =
  "js/workout-plans";

const DEFAULT_STRENGTH_REST_SECONDS =
  120;


/* =====================================================
   WEEK MODEL
===================================================== */

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

const DAY_SHORT_LABELS =
  Object.freeze({
    sunday: "SUN",
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT"
  });


/* =====================================================
   PAGE STATE
===================================================== */

const state = {
  activeTab:
    "week",

  activeDay:
    null,

  activeDayDate:
    null,

  activeExerciseId:
    null,

  detailAddMode:
    false,

  expandedExerciseIndex:
    null,

  pickerQuery:
    "",

  libraryQuery:
    "",

  selectedWeekStart:
    null,

  autosaveTimer:
    null,

  autosaveGeneration:
    0,

  saving:
    false,

  changingWeek:
    false,

  booted:
    false,

  reopenDayEditorAfterPicker:
    false,

  reopenPickerAfterDetail:
    false,

  unsubscribeStore:
    null
};


const dom = {};


/* =====================================================
   DOM
===================================================== */

function cacheDom() {
  const ids = [
    "workoutPlansApp",
    "workoutPlansBackButton",
    "workoutPlansStatus",
    "workoutPlansToast",
    "workoutPlansSaveButton",

    "workoutPreviousWeekButton",
    "workoutNextWeekButton",
    "workoutWeekRelativeLabel",
    "workoutWeekDateRange",

    "workoutRepeatLastWeekButton",
    "workoutClearWeekButton",

    "workoutWeekGrid",

    "workoutTemplateWeekRange",
    "workoutTemplateGoalFilter",
    "workoutTemplateDaysFilter",
    "workoutTemplateList",
    "workoutTemplateEmpty",

    "exerciseLibrarySearchForm",
    "exerciseLibrarySearch",
    "exerciseBodyPartFilter",
    "exerciseMovementFilter",
    "exerciseTypeFilter",
    "exerciseEquipmentFilter",
    "exerciseLibraryList",
    "exerciseLibraryEmpty",

    "workoutDayEditor",
    "workoutDayEditorTitle",
    "workoutDayType",
    "workoutDayFocus",
    "workoutDayExerciseSection",
    "workoutAddExerciseButton",
    "workoutDayExerciseList",
    "workoutDayExerciseEmpty",
    "workoutDayDoneButton",

    "workoutExercisePicker",
    "workoutExercisePickerContext",
    "workoutExercisePickerSearch",
    "workoutExercisePickerList",

    "exerciseDetailDialog",
    "exerciseDetailType",
    "exerciseDetailName",
    "exerciseAnatomyFigure",
    "exerciseAnatomyImage",
    "exerciseMovementFigure",
    "exerciseMovementImage",
    "exerciseVisualPlaceholder",
    "exerciseInstructionList",
    "exerciseMuscleList",
    "exerciseMovementSummary",
    "exerciseFormCueList",
    "exerciseCaloriesSection",
    "exerciseCaloriesEstimate",
    "exerciseDetailAddButton",

    "workoutDayCardTemplate",
    "workoutTemplateCardTemplate",
    "exerciseCardTemplate"
  ];

  for (const id of ids) {
    dom[id] =
      document.getElementById(
        id
      );
  }

  dom.tabs =
    Array.from(
      document.querySelectorAll(
        "[data-workout-tab]"
      )
    );

  dom.panels =
    Array.from(
      document.querySelectorAll(
        "[data-workout-panel]"
      )
    );
}


/* =====================================================
   BASIC HELPERS
===================================================== */

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


function normalizeLower(
  value
) {
  return normalizeText(
    value
  ).toLowerCase();
}


function titleFromId(
  value
) {
  return normalizeText(
    value
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


function arrayOfIds(
  value
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .map(
      normalizeText
    )
    .filter(
      Boolean
    );
}


function uniqueIds(
  value
) {
  return [
    ...new Set(
      arrayOfIds(
        value
      )
    )
  ];
}


function intersects(
  left =
    [],
  right =
    []
) {
  const rightSet =
    new Set(
      arrayOfIds(
        right
      )
    );

  return arrayOfIds(
    left
  ).some(
    value =>
      rightSet.has(
        value
      )
  );
}


function cloneDate(
  date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}


function isDialogOpen(
  dialog
) {
  return Boolean(
    dialog &&
    (
      dialog.open ||
      dialog.hasAttribute?.(
        "open"
      )
    )
  );
}


/* =====================================================
   DATE / WEEK HELPERS
===================================================== */

function getSundayStart(
  value =
    new Date()
) {
  const date =
    cloneDate(
      value
    );

  date.setDate(
    date.getDate() -
    date.getDay()
  );

  return date;
}


function addDays(
  date,
  amount
) {
  const result =
    cloneDate(
      date
    );

  result.setDate(
    result.getDate() +
    Number(
      amount || 0
    )
  );

  return result;
}


function addWeeks(
  date,
  amount
) {
  return addDays(
    date,
    Number(
      amount || 0
    ) * 7
  );
}


function getWeekEnd(
  weekStart
) {
  return addDays(
    weekStart,
    6
  );
}


function toLocalDateKey(
  date
) {
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


function parseLocalDateKey(
  value
) {
  const match =
    normalizeText(
      value
    ).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const date =
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) - 1,
      Number(
        match[3]
      )
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


function getSelectedWeekKey() {
  return toLocalDateKey(
    state.selectedWeekStart
  );
}


function getActiveDateKey() {
  if (
    state.activeDayDate
  ) {
    return state.activeDayDate;
  }

  if (
    state.activeDay
  ) {
    const date =
      getDateForDay(
        state.activeDay
      );

    return date
      ? toLocalDateKey(
          date
        )
      : null;
  }

  return null;
}


function getWeekOffsetFromCurrent(
  weekStart
) {
  const current =
    getSundayStart(
      new Date()
    );

  const target =
    getSundayStart(
      weekStart
    );

  const milliseconds =
    target.getTime() -
    current.getTime();

  return Math.round(
    milliseconds /
    (
      7 *
      24 *
      60 *
      60 *
      1000
    )
  );
}


function getRelativeWeekLabel(
  weekStart
) {
  const offset =
    getWeekOffsetFromCurrent(
      weekStart
    );

  if (offset === 0) {
    return "THIS WEEK";
  }

  if (offset === 1) {
    return "NEXT WEEK";
  }

  if (offset === -1) {
    return "PREVIOUS WEEK";
  }

  if (offset > 1) {
    return `${offset} WEEKS AHEAD`;
  }

  return `${Math.abs(
    offset
  )} WEEKS AGO`;
}


function formatMonthDay(
  date
) {
  return date
    .toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric"
      }
    )
    .toUpperCase();
}


function formatDayCardDate(
  day,
  date
) {
  return (
    `${DAY_SHORT_LABELS[
      day
    ]} ` +
    `${formatMonthDay(
      date
    )}`
  );
}


function formatWeekRange(
  weekStart
) {
  const weekEnd =
    getWeekEnd(
      weekStart
    );

  const sameYear =
    weekStart.getFullYear() ===
    weekEnd.getFullYear();

  const sameMonth =
    sameYear &&
    weekStart.getMonth() ===
    weekEnd.getMonth();

  if (
    sameMonth
  ) {
    return (
      `${weekStart
        .toLocaleDateString(
          "en-US",
          {
            month: "short"
          }
        )
        .toUpperCase()} ` +
      `${weekStart.getDate()} - ` +
      `${weekEnd.getDate()}`
    );
  }

  return (
    `${formatMonthDay(
      weekStart
    )} - ` +
    `${formatMonthDay(
      weekEnd
    )}`
  );
}


function getDateForDay(
  day
) {
  const index =
    DAYS.indexOf(
      day
    );

  if (
    index < 0
  ) {
    return null;
  }

  return addDays(
    state.selectedWeekStart,
    index
  );
}


/* =====================================================
   CONTROLLER COMPATIBILITY HELPERS
===================================================== */

function getSelectedWeekPlan() {
  if (
    typeof WorkoutPlanController
      .getSelectedWeek ===
    "function"
  ) {
    return WorkoutPlanController
      .getSelectedWeek();
  }

  if (
    typeof WorkoutPlanController
      .getWeekByKey ===
    "function"
  ) {
    return WorkoutPlanController
      .getWeekByKey(
        getSelectedWeekKey()
      );
  }

  if (
    typeof WorkoutPlanController
      .getWeek ===
    "function"
  ) {
    return WorkoutPlanController
      .getWeek(
        getSelectedWeekKey()
      );
  }

  return WorkoutPlanController
    .getPlan?.()
    ?.week ||
    null;
}


function getSelectedDay(
  day
) {
  const date =
    state.activeDay ===
      day
      ? getActiveDateKey()
      : (
          getDateForDay(
            day
          )
            ? toLocalDateKey(
                getDateForDay(
                  day
                )
              )
            : null
        );

  if (
    date &&
    typeof WorkoutPlanController
      .getDate ===
    "function"
  ) {
    return WorkoutPlanController
      .getDate(
        date
      );
  }

  if (
    typeof WorkoutPlanController
      .getSelectedDay ===
    "function"
  ) {
    return WorkoutPlanController
      .getSelectedDay(
        day
      );
  }

  if (
    typeof WorkoutPlanController
      .getDayForWeek ===
    "function"
  ) {
    return WorkoutPlanController
      .getDayForWeek(
        getSelectedWeekKey(),
        day
      );
  }

  return WorkoutPlanController
    .getDay(
      day,
      getSelectedWeekKey()
    );
}


async function selectControllerWeek(
  weekStart
) {
  const key =
    toLocalDateKey(
      weekStart
    );

  if (
    typeof WorkoutPlanController
      .selectWeek ===
    "function"
  ) {
    return await WorkoutPlanController
      .selectWeek(
        key
      );
  }

  if (
    typeof WorkoutPlanController
      .setSelectedWeek ===
    "function"
  ) {
    return await WorkoutPlanController
      .setSelectedWeek(
        key
      );
  }

  if (
    typeof WorkoutPlanController
      .loadWeek ===
    "function"
  ) {
    return await WorkoutPlanController
      .loadWeek(
        key
      );
  }

  return true;
}


function controllerSetDayType(
  day,
  type
) {
  const date =
    getActiveDateKey();

  if (
    date &&
    typeof WorkoutPlanController
      .setDateType ===
    "function"
  ) {
    return WorkoutPlanController
      .setDateType(
        date,
        type
      );
  }

  return WorkoutPlanController
    .setDayType(
      day,
      type
    );
}


function controllerSetDayFocus(
  day,
  focusId
) {
  const date =
    getActiveDateKey();

  if (
    date &&
    typeof WorkoutPlanController
      .setDateFocus ===
    "function"
  ) {
    return WorkoutPlanController
      .setDateFocus(
        date,
        focusId
      );
  }

  return WorkoutPlanController
    .setDayFocus(
      day,
      focusId
    );
}


function controllerAddExercise(
  day,
  exerciseId,
  options
) {
  const date =
    getActiveDateKey();

  if (
    date
  ) {
    return WorkoutPlanController
      .addExercise(
        date,
        exerciseId,
        options
      );
  }

  return WorkoutPlanController
    .addExercise(
      day,
      exerciseId,
      options
    );
}


function controllerUpdateExercise(
  day,
  index,
  patch
) {
  const date =
    getActiveDateKey();

  if (
    date
  ) {
    return WorkoutPlanController
      .updateExercise(
        date,
        index,
        patch
      );
  }

  return WorkoutPlanController
    .updateExercise(
      day,
      index,
      patch
    );
}


function controllerRemoveExercise(
  day,
  index
) {
  const date =
    getActiveDateKey();

  if (
    date
  ) {
    return WorkoutPlanController
      .removeExercise(
        date,
        index
      );
  }

  return WorkoutPlanController
    .removeExercise(
      day,
      index
    );
}


/* =====================================================
   SEARCH COMPATIBILITY
===================================================== */

function extractExerciseResults(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    value &&
    typeof value ===
      "object" &&
    Array.isArray(
      value.results
    )
  ) {
    return value.results;
  }

  return [];
}


function getAllRegistryExercises() {
  if (
    Array.isArray(
      ExerciseRegistry
        ?.all
    )
  ) {
    return [
      ...ExerciseRegistry.all
    ];
  }

  try {
    return extractExerciseResults(
      WorkoutPlanController
        .getExercises()
    );
  } catch {
    return [];
  }
}


function locallySearchExercises(
  exercises,
  query
) {
  const normalizedQuery =
    normalizeLower(
      query
    );

  if (
    !normalizedQuery
  ) {
    return [
      ...exercises
    ];
  }

  const queryTokens =
    normalizedQuery
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  return exercises
    .map(
      exercise => {
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
          exercise.targetEmphasis?.muscle,
          exercise.targetEmphasis?.region,
          exercise.targetEmphasis?.label,
          ...(exercise.aliases || []),
          ...(exercise.exerciseTypes || []),
          ...(exercise.bodyParts || []),
          ...(exercise.primaryMuscles || []),
          ...(exercise.secondaryMuscles || []),
          ...(exercise.movementPatterns || []),
          ...(exercise.equipment || []),
          ...(exercise.substitutions || []),
          ...Object.keys(
            exercise.goals ||
            {}
          )
        ];

        const searchable =
          searchablePieces
            .filter(
              Boolean
            )
            .join(
              " "
            )
            .toLowerCase();

        const normalizedName =
          normalizeLower(
            exercise.name
          );

        const normalizedId =
          normalizeLower(
            exercise.id
          );

        const aliases =
          (
            exercise.aliases ||
            []
          ).map(
            normalizeLower
          );

        let score =
          0;

        if (
          normalizedName ===
          normalizedQuery
        ) {
          score += 5000;
        }

        if (
          normalizedId ===
          normalizedQuery
        ) {
          score += 5000;
        }

        if (
          aliases.includes(
            normalizedQuery
          )
        ) {
          score += 4500;
        }

        if (
          normalizedName
            .startsWith(
              normalizedQuery
            )
        ) {
          score += 3000;
        }

        if (
          aliases.some(
            alias =>
              alias.startsWith(
                normalizedQuery
              )
          )
        ) {
          score += 2500;
        }

        if (
          normalizedName
            .includes(
              normalizedQuery
            )
        ) {
          score += 1800;
        }

        if (
          aliases.some(
            alias =>
              alias.includes(
                normalizedQuery
              )
          )
        ) {
          score += 1600;
        }

        if (
          searchable.includes(
            normalizedQuery
          )
        ) {
          score += 1000;
        }

        for (
          const token
          of queryTokens
        ) {
          if (
            normalizedName
              .includes(
                token
              )
          ) {
            score += 150;
          }

          if (
            aliases.some(
              alias =>
                alias.includes(
                  token
                )
            )
          ) {
            score += 125;
          }

          if (
            searchable.includes(
              token
            )
          ) {
            score += 75;
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
        item.score >
        0
    )
    .sort(
      (
        a,
        b
      ) => {
        if (
          b.score !==
          a.score
        ) {
          return (
            b.score -
            a.score
          );
        }

        return a.exercise
          .name
          .localeCompare(
            b.exercise.name
          );
      }
    )
    .map(
      item =>
        item.exercise
    );
}


/* =====================================================
   UI HELPERS
===================================================== */

function showToast(
  message,
  {
    error =
      false,

    duration =
      2200
  } = {}
) {
  if (
    !dom.workoutPlansToast
  ) {
    return;
  }

  dom.workoutPlansToast
    .textContent =
      message;

  dom.workoutPlansToast
    .dataset
    .state =
      error
        ? "error"
        : "success";

  dom.workoutPlansToast
    .hidden =
      false;

  window.clearTimeout(
    showToast.timer
  );

  showToast.timer =
    window.setTimeout(
      () => {
        if (
          dom.workoutPlansToast
        ) {
          dom.workoutPlansToast
            .hidden =
              true;
        }
      },
      duration
    );
}


function setStatus(
  message,
  {
    hide =
      false,

    error =
      false
  } = {}
) {
  if (
    !dom.workoutPlansStatus
  ) {
    return;
  }

  dom.workoutPlansStatus
    .textContent =
      message ||
      "";

  dom.workoutPlansStatus
    .hidden =
      Boolean(
        hide
      );

  dom.workoutPlansStatus
    .dataset
    .state =
      error
        ? "error"
        : "ready";
}


function openDialog(
  dialog
) {
  if (!dialog) {
    return false;
  }

  try {
    if (
      typeof dialog
        .showModal ===
      "function"
    ) {
      if (
        !dialog.open
      ) {
        dialog.showModal();
      }

      return true;
    }

    dialog.setAttribute(
      "open",
      ""
    );

    return true;
  } catch (
    error
  ) {
    console.warn(
      "ARI Workout Plans dialog could not open.",
      error
    );

    dialog.setAttribute(
      "open",
      ""
    );

    return false;
  }
}


function closeDialog(
  dialog
) {
  if (!dialog) {
    return false;
  }

  try {
    if (
      typeof dialog
        .close ===
      "function"
    ) {
      if (
        dialog.open
      ) {
        dialog.close();
      }

      return true;
    }

    dialog.removeAttribute(
      "open"
    );

    return true;
  } catch (
    error
  ) {
    console.warn(
      "ARI Workout Plans dialog could not close cleanly.",
      error
    );

    dialog.removeAttribute(
      "open"
    );

    return false;
  }
}


function reopenDayEditor() {
  if (
    !state.activeDay ||
    !dom.workoutDayEditor
  ) {
    return false;
  }

  if (
    isDialogOpen(
      dom.workoutDayEditor
    )
  ) {
    return true;
  }

  renderDayExercises();

  return openDialog(
    dom.workoutDayEditor
  );
}


function closePickerAndReturnToDayEditor() {
  closeDialog(
    dom.workoutExercisePicker
  );

  if (
    state.reopenDayEditorAfterPicker
  ) {
    state.reopenDayEditorAfterPicker =
      false;

    requestAnimationFrame(
      () => {
        reopenDayEditor();
      }
    );
  }
}


function closeDetailAndReturn() {
  closeDialog(
    dom.exerciseDetailDialog
  );

  if (
    state.reopenPickerAfterDetail
  ) {
    state.reopenPickerAfterDetail =
      false;

    requestAnimationFrame(
      () => {
        openDialog(
          dom.workoutExercisePicker
        );
      }
    );

    return;
  }

  if (
    state.reopenDayEditorAfterPicker
  ) {
    requestAnimationFrame(
      () => {
        reopenDayEditor();
      }
    );
  }
}


/* =====================================================
   LABEL HELPERS
===================================================== */

function getMuscleLabel(
  muscleId
) {
  return (
    Muscles.get(
      muscleId
    )?.commonName ||
    Muscles.get(
      muscleId
    )?.name ||
    titleFromId(
      muscleId
    )
  );
}


function getMovementLabel(
  movementId
) {
  return (
    MovementPatterns.get(
      movementId
    )?.label ||
    titleFromId(
      movementId
    )
  );
}


function getGoalLabel(
  goalId
) {
  return (
    FitnessGoals.get(
      goalId
    )?.label ||
    titleFromId(
      goalId
    )
  );
}


function getFocusBodyParts(
  focus
) {
  return uniqueIds([
    ...(focus?.bodyParts || []),
    ...(focus?.primaryBodyParts || []),
    ...(focus?.secondaryBodyParts || [])
  ]);
}


function getFocusMuscles(
  focus
) {
  return uniqueIds([
    ...(focus?.muscles || []),
    ...(focus?.primaryMuscles || []),
    ...(focus?.secondaryMuscles || [])
  ]);
}


function getFocusMovements(
  focus
) {
  return uniqueIds(
    focus?.movementPatterns ||
    []
  );
}


function getFocusExerciseTypes(
  focus
) {
  return uniqueIds(
    focus?.exerciseTypes ||
    []
  );
}


/* =====================================================
   CURRENT DAY HELPERS
===================================================== */

function getCurrentDayState() {
  if (
    !state.activeDay
  ) {
    return null;
  }

  const date =
    getActiveDateKey();

  if (
    date &&
    typeof WorkoutPlanController
      .getDate ===
    "function"
  ) {
    return WorkoutPlanController
      .getDate(
        date
      );
  }

  return getSelectedDay(
    state.activeDay
  );
}


function hasExerciseOnActiveDay(
  exerciseId
) {
  const dayState =
    getCurrentDayState();

  if (
    !dayState
  ) {
    return false;
  }

  return (
    dayState.exercises ||
    []
  ).some(
    entry =>
      entry.exerciseId ===
      exerciseId
  );
}


/* =====================================================
   EXERCISE DEFAULT HELPERS
===================================================== */

function isSetBasedExercise(
  exercise
) {
  const fields =
    exercise
      ?.logging
      ?.fields ||
    [];

  return (
    fields.includes(
      "sets"
    ) ||
    normalizeLower(
      exercise
        ?.logging
        ?.type
    ).startsWith(
      "sets_"
    )
  );
}


function isWeightField(
  field
) {
  return (
    field ===
      "weight" ||
    field ===
      "added_weight" ||
    field ===
      "addedWeight"
  );
}


function displayMetricValue(
  field,
  value
) {
  if (
    isWeightField(
      field
    ) &&
    (
      value === null ||
      value === undefined ||
      value === "" ||
      Number(
        value
      ) === 0
    )
  ) {
    return "";
  }

  return value ??
    "";
}


function getRestSecondsValue(
  exercise,
  entry
) {
  const stored =
    Number(
      entry
        ?.restSeconds ??
      entry
        ?.rest_seconds
    );

  if (
    Number.isFinite(
      stored
    ) &&
    stored >= 0
  ) {
    return stored;
  }

  return isSetBasedExercise(
    exercise
  )
    ? DEFAULT_STRENGTH_REST_SECONDS
    : "";
}


/* =====================================================
   TABS
===================================================== */

function setActiveTab(
  tab
) {
  const allowed = [
    "week",
    "templates",
    "library"
  ];

  if (
    !allowed.includes(
      tab
    )
  ) {
    return false;
  }

  state.activeTab =
    tab;

  for (
    const button
    of dom.tabs ||
      []
  ) {
    const active =
      button.dataset
        .workoutTab ===
      tab;

    button.classList
      .toggle(
        "active",
        active
      );

    button.setAttribute(
      "aria-selected",
      active
        ? "true"
        : "false"
    );
  }

  for (
    const panel
    of dom.panels ||
      []
  ) {
    const active =
      panel.dataset
        .workoutPanel ===
      tab;

    panel.classList
      .toggle(
        "active",
        active
      );

    panel.hidden =
      !active;
  }

  if (
    tab ===
    "templates"
  ) {
    renderTemplates();
  }

  if (
    tab ===
    "library"
  ) {
    renderExerciseLibrary();
  }

  if (
    tab ===
    "week"
  ) {
    renderWeek();
  }

  return true;
}


/* =====================================================
   SELECT POPULATION
===================================================== */

function populateSelect(
  select,
  items,
  {
    placeholder =
      null,

    valueKey =
      "id",

    labelKey =
      "label"
  } = {}
) {
  if (
    !select
  ) {
    return;
  }

  const current =
    select.value;

  select.innerHTML =
    "";

  if (
    placeholder !==
    null
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      "";

    option.textContent =
      placeholder;

    select.appendChild(
      option
    );
  }

  for (
    const item
    of items ||
      []
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      item?.[
        valueKey
      ] ??
      "";

    option.textContent =
      item?.[
        labelKey
      ] ??
      item?.name ??
      item?.id ??
      "";

    select.appendChild(
      option
    );
  }

  if (
    current &&
    Array.from(
      select.options
    ).some(
      option =>
        option.value ===
        current
    )
  ) {
    select.value =
      current;
  }
}


function populateFilters() {
  const goals =
    Array.isArray(
      FitnessGoals
        ?.all
    )
      ? FitnessGoals.all
      : [];

  populateSelect(
    dom.workoutTemplateGoalFilter,
    goals,
    {
      placeholder:
        "All Goals"
    }
  );

  populateSelect(
    dom.exerciseBodyPartFilter,
    BodyParts.list?.({
      selectableOnly:
        true
    }) ||
    [],
    {
      placeholder:
        "All Body Parts"
    }
  );

  populateSelect(
    dom.exerciseMovementFilter,
    MovementPatterns.all ||
      [],
    {
      placeholder:
        "All Movements"
    }
  );

  populateSelect(
    dom.exerciseTypeFilter,
    ExerciseTypes.all ||
      [],
    {
      placeholder:
        "All Types"
    }
  );

  const equipment = [
    ...new Set(
      getAllRegistryExercises()
        .flatMap(
          exercise =>
            exercise.equipment ||
            []
        )
        .filter(
          Boolean
        )
    )
  ]
    .sort(
      (
        a,
        b
      ) =>
        a.localeCompare(
          b
        )
    )
    .map(
      id => ({
        id,

        label:
          titleFromId(
            id
          )
      })
    );

  populateSelect(
    dom.exerciseEquipmentFilter,
    equipment,
    {
      placeholder:
        "All Equipment"
    }
  );

  populateDayFocusSelect();
}


function populateDayFocusSelect() {
  if (
    !dom.workoutDayFocus
  ) {
    return;
  }

  populateSelect(
    dom.workoutDayFocus,
    WorkoutFocuses.all ||
      [],
    {
      placeholder:
        "Choose focus"
    }
  );
}


/* =====================================================
   WEEK HEADER
===================================================== */

function renderWeekHeader() {
  if (
    !state.selectedWeekStart
  ) {
    return;
  }

  const relativeLabel =
    getRelativeWeekLabel(
      state.selectedWeekStart
    );

  const range =
    formatWeekRange(
      state.selectedWeekStart
    );

  if (
    dom.workoutWeekRelativeLabel
  ) {
    dom.workoutWeekRelativeLabel
      .textContent =
        relativeLabel;
  }

  if (
    dom.workoutWeekDateRange
  ) {
    dom.workoutWeekDateRange
      .textContent =
        range;
  }

  if (
    dom.workoutTemplateWeekRange
  ) {
    dom.workoutTemplateWeekRange
      .textContent =
        `${relativeLabel} \u00B7 ${range}`;
  }
}


/* =====================================================
   WEEK CARDS
===================================================== */

function getDaySummary(
  dayState
) {
  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    return "";
  }

  const count =
    dayState.exercises
      ?.length ||
    0;

  if (
    count === 0
  ) {
    return "";
  }

  return (
    `${count} exercise` +
    `${count === 1
      ? ""
      : "s"}`
  );
}


function getDayActionLabel(
  dayState
) {
  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    return "Plan Workout \u2192";
  }

  return "Edit Workout \u2192";
}


function renderWeek() {
  if (
    !dom.workoutWeekGrid ||
    !state.selectedWeekStart
  ) {
    return;
  }

  renderWeekHeader();

  dom.workoutWeekGrid
    .innerHTML =
      "";

  for (
    let index = 0;
    index <
      DAYS.length;
    index += 1
  ) {
    const day =
      DAYS[
        index
      ];

    const date =
      addDays(
        state.selectedWeekStart,
        index
      );

    const dateKey =
      toLocalDateKey(
        date
      );

    let dayState =
      null;

    if (
      typeof WorkoutPlanController
        .getDate ===
      "function"
    ) {
      dayState =
        WorkoutPlanController
          .getDate(
            dateKey
          );
    }

    if (
      !dayState
    ) {
      dayState =
        getSelectedDay(
          day
        );
    }

    dayState =
      dayState || {
        day,
        date:
          dateKey,
        type:
          "off",
        focusId:
          "off_day",
        title:
          "Off Day",
        exercises:
          []
      };

    const fragment =
      dom.workoutDayCardTemplate
        ?.content
        ?.cloneNode(
          true
        );

    if (
      !fragment
    ) {
      continue;
    }

    const card =
      fragment.querySelector(
        ".workout-day-card"
      );

    const button =
      fragment.querySelector(
        ".workout-day-card__button"
      );

    const dayLabel =
      fragment.querySelector(
        ".workout-day-card__day"
      );

    const dateLabel =
      fragment.querySelector(
        ".workout-day-card__date"
      );

    const type =
      fragment.querySelector(
        ".workout-day-card__type"
      );

    const title =
      fragment.querySelector(
        ".workout-day-card__title"
      );

    const summary =
      fragment.querySelector(
        ".workout-day-card__summary"
      );

    const open =
      fragment.querySelector(
        ".workout-day-card__open"
      );

    if (
      !card ||
      !button
    ) {
      continue;
    }

    card.dataset.day =
      day;

    card.dataset.date =
      dateKey;

    card.dataset.type =
      dayState.type ||
      "off";

    button.dataset.day =
      day;

    button.dataset.date =
      dateKey;

    if (
      dayLabel
    ) {
      dayLabel.textContent =
        formatDayCardDate(
          day,
          date
        );
    }

    if (
      dateLabel
    ) {
      dateLabel.textContent =
        "";

      dateLabel.hidden =
        true;
    }

    if (
      type
    ) {
      type.textContent =
        dayState.type ===
          "off"
          ? "OFF"
          : dayState.type ===
              "recovery"
            ? "RECOVERY"
            : "WORKOUT";
    }

    if (
      title
    ) {
      if (
        dayState.type ===
        "off"
      ) {
        title.textContent =
          "Off Day";
      } else {
        const focus =
          WorkoutFocuses.get(
            dayState.focusId
          );

        title.textContent =
          focus?.label ||
          dayState.title ||
          "Workout";
      }
    }

    if (
      summary
    ) {
      const value =
        getDaySummary(
          dayState
        );

      summary.textContent =
        value;

      summary.hidden =
        !value;
    }

    if (
      open
    ) {
      open.textContent =
        getDayActionLabel(
          dayState
        );
    }

    dom.workoutWeekGrid
      .appendChild(
        fragment
      );
  }
}


/* =====================================================
   WEEK NAVIGATION
===================================================== */

async function changeSelectedWeek(
  nextStart
) {
  if (
    state.changingWeek
  ) {
    return false;
  }

  state.changingWeek =
    true;

  try {
    const normalized =
      getSundayStart(
        nextStart
      );

    state.selectedWeekStart =
      normalized;

    state.activeDay =
      null;

    state.activeDayDate =
      null;

    state.expandedExerciseIndex =
      null;

    await selectControllerWeek(
      normalized
    );

    renderWeek();
    renderTemplates();

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans could not change weeks.",
      error
    );

    showToast(
      "That week could not be loaded.",
      {
        error:
          true
      }
    );

    return false;
  } finally {
    state.changingWeek =
      false;
  }
}


async function goPreviousWeek() {
  return changeSelectedWeek(
    addWeeks(
      state.selectedWeekStart,
      -1
    )
  );
}


async function goNextWeek() {
  return changeSelectedWeek(
    addWeeks(
      state.selectedWeekStart,
      1
    )
  );
}


/* =====================================================
   REPEAT / CLEAR WEEK
===================================================== */

async function repeatLastWeek() {
  const previousWeekStart =
    addWeeks(
      state.selectedWeekStart,
      -1
    );

  const previousLabel =
    formatWeekRange(
      previousWeekStart
    );

  const currentLabel =
    formatWeekRange(
      state.selectedWeekStart
    );

  const confirmed =
    window.confirm(
      `Repeat ${previousLabel} into ${currentLabel}? This will replace anything already planned for this week.`
    );

  if (
    !confirmed
  ) {
    return false;
  }

  try {
    let result =
      false;

    if (
      typeof WorkoutPlanController
        .repeatPreviousWeek ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .repeatPreviousWeek(
            getSelectedWeekKey()
          );
    } else if (
      typeof WorkoutPlanController
        .repeatLastWeek ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .repeatLastWeek(
            getSelectedWeekKey()
          );
    } else if (
      typeof WorkoutPlanController
        .copyWeek ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .copyWeek({
            fromWeekKey:
              toLocalDateKey(
                previousWeekStart
              ),

            toWeekKey:
              getSelectedWeekKey()
          });
    }

    if (
      !result
    ) {
      throw new Error(
        "Repeat-last-week controller method is unavailable."
      );
    }

    renderWeek();

    await saveNow();

    showToast(
      "Last week repeated."
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans could not repeat last week.",
      error
    );

    showToast(
      "Last week could not be repeated.",
      {
        error:
          true
      }
    );

    return false;
  }
}


async function clearSelectedWeek() {
  const confirmed =
    window.confirm(
      `Clear ${formatWeekRange(
        state.selectedWeekStart
      )}? Every day in this week will become an Off Day.`
    );

  if (
    !confirmed
  ) {
    return false;
  }

  try {
    let result =
      false;

    if (
      typeof WorkoutPlanController
        .clearSelectedWeek ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .clearSelectedWeek();
    } else if (
      typeof WorkoutPlanController
        .clearWeekPlan ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .clearWeekPlan(
            getSelectedWeekKey()
          );
    } else if (
      typeof WorkoutPlanController
        .clearWeek ===
      "function"
    ) {
      result =
        await WorkoutPlanController
          .clearWeek(
            getSelectedWeekKey()
          );
    } else {
      const results =
        DAYS.map(
          day => {
            const date =
              getDateForDay(
                day
              );

            const dateKey =
              date
                ? toLocalDateKey(
                    date
                  )
                : null;

            if (
              dateKey &&
              typeof WorkoutPlanController
                .clearDate ===
              "function"
            ) {
              return WorkoutPlanController
                .clearDate(
                  dateKey
                );
            }

            return WorkoutPlanController
              .clearDay(
                day
              );
          }
        );

      result =
        results.every(
          value =>
            value !== false
        );
    }

    if (
      !result
    ) {
      throw new Error(
        "Selected week could not be cleared."
      );
    }

    renderWeek();

    await saveNow();

    showToast(
      "Week cleared."
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans could not clear the week.",
      error
    );

    showToast(
      "Week could not be cleared.",
      {
        error:
          true
      }
    );

    return false;
  }
}


/* =====================================================
   TEMPLATES
===================================================== */

function renderTemplates() {
  if (
    !dom.workoutTemplateList
  ) {
    return;
  }

  renderWeekHeader();

  const filters = {
    goal:
      dom.workoutTemplateGoalFilter
        ?.value ||
      null,

    trainingDaysPerWeek:
      dom.workoutTemplateDaysFilter
        ?.value ||
      null
  };

  const templates =
    WorkoutPlanController
      .getTemplates(
        filters
      ) ||
    [];

  dom.workoutTemplateList
    .innerHTML =
      "";

  if (
    dom.workoutTemplateEmpty
  ) {
    dom.workoutTemplateEmpty
      .hidden =
        templates.length >
        0;
  }

  for (
    const template
    of templates
  ) {
    const fragment =
      dom.workoutTemplateCardTemplate
        ?.content
        ?.cloneNode(
          true
        );

    if (
      !fragment
    ) {
      continue;
    }

    const card =
      fragment.querySelector(
        ".workout-template-card"
      );

    const eyebrow =
      fragment.querySelector(
        ".workout-template-card__eyebrow"
      );

    const name =
      fragment.querySelector(
        ".workout-template-card__name"
      );

    const description =
      fragment.querySelector(
        ".workout-template-card__description"
      );

    const meta =
      fragment.querySelector(
        ".workout-template-card__meta"
      );

    const apply =
      fragment.querySelector(
        ".workout-template-card__apply"
      );

    if (
      card
    ) {
      card.dataset
        .templateId =
          template.id;
    }

    if (
      eyebrow
    ) {
      eyebrow.textContent =
        `${titleFromId(
          template.level
        )} \u00B7 ` +
        `${template.trainingDaysPerWeek} DAYS/WEEK`;
    }

    if (
      name
    ) {
      name.textContent =
        template.name;
    }

    if (
      description
    ) {
      description.textContent =
        template.description;
    }

    if (
      meta
    ) {
      meta.textContent =
        (
          template.primaryGoals ||
          []
        )
          .map(
            getGoalLabel
          )
          .join(
            " \u00B7 "
          );
    }

    if (
      apply
    ) {
      apply.dataset
        .templateId =
          template.id;

      const offset =
        getWeekOffsetFromCurrent(
          state.selectedWeekStart
        );

      apply.textContent =
        offset === 0
          ? "Use for This Week"
          : offset === 1
            ? "Use for Next Week"
            : offset === -1
              ? "Use for Previous Week"
              : "Use for Selected Week";
    }

    dom.workoutTemplateList
      .appendChild(
        fragment
      );
  }
}


async function applyTemplate(
  templateId
) {
  const template =
    WorkoutPlanController
      .getTemplates()
      .find(
        item =>
          item.id ===
          templateId
      );

  if (
    !template
  ) {
    return false;
  }

  const confirmed =
    window.confirm(
      `Use "${template.name}" for ${formatWeekRange(
        state.selectedWeekStart
      )}? This replaces only the selected week.`
    );

  if (
    !confirmed
  ) {
    return false;
  }

  try {
    let applied =
      false;

    if (
      typeof WorkoutPlanController
        .applyTemplateToWeek ===
      "function"
    ) {
      applied =
        WorkoutPlanController
          .applyTemplateToWeek(
            templateId,
            getSelectedWeekKey()
          );
    } else if (
      typeof WorkoutPlanController
        .applyTemplate ===
      "function"
    ) {
      try {
        applied =
          WorkoutPlanController
            .applyTemplate(
              templateId,
              {
                weekStart:
                  getSelectedWeekKey()
              }
            );
      } catch {
        applied =
          WorkoutPlanController
            .applyTemplate(
              templateId,
              getSelectedWeekKey()
            );
      }
    }

    if (
      !applied
    ) {
      throw new Error(
        "Template was not applied."
      );
    }

    renderWeek();

    scheduleAutosave();

    showToast(
      `${template.name} applied.`
    );

    setActiveTab(
      "week"
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans template apply failed.",
      error
    );

    showToast(
      "Template could not be applied.",
      {
        error:
          true
      }
    );

    return false;
  }
}


/* =====================================================
   EXERCISE LIBRARY
===================================================== */

function getLibraryResults() {
  const query =
    normalizeText(
      state.libraryQuery
    );

  let results =
    [];

  try {
    const response =
      query
        ? WorkoutPlanController
            .searchExercises(
              query,
              {
                limit:
                  Math.max(
                    1000,
                    getAllRegistryExercises()
                      .length +
                      50
                  )
              }
            )
        : WorkoutPlanController
            .getExercises();

    results =
      extractExerciseResults(
        response
      );
  } catch (
    error
  ) {
    console.warn(
      "ARI Workout Plans library search failed. Falling back locally.",
      error
    );

    results =
      [];
  }

  if (
    query &&
    results.length ===
      0
  ) {
    results =
      locallySearchExercises(
        getAllRegistryExercises(),
        query
      );
  }

  if (
    !query &&
    results.length ===
      0
  ) {
    results =
      getAllRegistryExercises();
  }

  const bodyPart =
    dom.exerciseBodyPartFilter
      ?.value ||
    "";

  const movement =
    dom.exerciseMovementFilter
      ?.value ||
    "";

  const type =
    dom.exerciseTypeFilter
      ?.value ||
    "";

  const equipment =
    dom.exerciseEquipmentFilter
      ?.value ||
    "";

  return results.filter(
    exercise => {
      if (
        bodyPart &&
        !(
          exercise.bodyParts ||
          []
        ).includes(
          bodyPart
        )
      ) {
        return false;
      }

      if (
        movement &&
        !(
          exercise.movementPatterns ||
          []
        ).includes(
          movement
        )
      ) {
        return false;
      }

      if (
        type &&
        !(
          exercise.exerciseTypes ||
          []
        ).includes(
          type
        )
      ) {
        return false;
      }

      if (
        equipment &&
        !(
          exercise.equipment ||
          []
        ).includes(
          equipment
        )
      ) {
        return false;
      }

      return true;
    }
  );
}


function renderExerciseCard(
  exercise,
  {
    addEnabled =
      false,

    container
  } = {}
) {
  const fragment =
    dom.exerciseCardTemplate
      ?.content
      ?.cloneNode(
        true
      );

  if (
    !fragment
  ) {
    return;
  }

  const card =
    fragment.querySelector(
      ".exercise-library-card"
    );

  const open =
    fragment.querySelector(
      ".exercise-library-card__open"
    );

  const image =
    fragment.querySelector(
      ".exercise-library-card__image"
    );

  const placeholder =
    fragment.querySelector(
      ".exercise-library-card__placeholder"
    );

  const type =
    fragment.querySelector(
      ".exercise-library-card__type"
    );

  const name =
    fragment.querySelector(
      ".exercise-library-card__name"
    );

  const muscles =
    fragment.querySelector(
      ".exercise-library-card__muscles"
    );

  const add =
    fragment.querySelector(
      ".exercise-library-card__add"
    );

  if (
    card
  ) {
    card.dataset
      .exerciseId =
        exercise.id;
  }

  if (
    open
  ) {
    open.dataset
      .exerciseId =
        exercise.id;
  }

  if (
    type
  ) {
    type.textContent =
      titleFromId(
        exercise.category
      );
  }

  if (
    name
  ) {
    name.textContent =
      exercise.name;
  }

  if (
    muscles
  ) {
    muscles.textContent =
      (
        exercise.primaryMuscles ||
        []
      )
        .map(
          getMuscleLabel
        )
        .join(
          " \u00B7 "
        );
  }

  const imagePath =
    exercise
      .illustration
      ?.anatomy ||
    exercise
      .illustration
      ?.movement ||
    null;

  if (
    image
  ) {
    if (
      imagePath
    ) {
      image.src =
        imagePath;

      image.alt =
        `${exercise.name} illustration`;

      image.hidden =
        false;

      if (
        placeholder
      ) {
        placeholder.hidden =
          true;
      }
    } else {
      image.hidden =
        true;

      if (
        placeholder
      ) {
        placeholder.hidden =
          false;
      }
    }
  }

  if (
    add
  ) {
    add.hidden =
      !addEnabled;

    add.dataset
      .exerciseId =
        exercise.id;

    if (
      addEnabled
    ) {
      const alreadyAdded =
        hasExerciseOnActiveDay(
          exercise.id
        );

      add.disabled =
        alreadyAdded;

      add.textContent =
        alreadyAdded
          ? "Added"
          : "Add";
    }
  }

  container?.appendChild(
    fragment
  );
}


function renderExerciseLibrary() {
  if (
    !dom.exerciseLibraryList
  ) {
    return;
  }

  const results =
    getLibraryResults();

  dom.exerciseLibraryList
    .innerHTML =
      "";

  if (
    dom.exerciseLibraryEmpty
  ) {
    dom.exerciseLibraryEmpty
      .hidden =
        results.length >
        0;
  }

  for (
    const exercise
    of results
  ) {
    renderExerciseCard(
      exercise,
      {
        addEnabled:
          false,

        container:
          dom.exerciseLibraryList
      }
    );
  }
}


/* =====================================================
   FOCUS FILTERING
===================================================== */

function exerciseMatchesFocus(
  exercise,
  focus
) {
  if (
    !exercise ||
    !focus
  ) {
    return false;
  }

  if (
    focus.id ===
    "custom"
  ) {
    return true;
  }

  if (
    focus.id ===
    "off_day"
  ) {
    return false;
  }

  const focusBodyParts =
    getFocusBodyParts(
      focus
    );

  const focusMovements =
    getFocusMovements(
      focus
    );

  const focusTypes =
    getFocusExerciseTypes(
      focus
    );

  const focusMuscles =
    getFocusMuscles(
      focus
    );

  const exerciseMuscles = [
    ...arrayOfIds(
      exercise.primaryMuscles
    ),
    ...arrayOfIds(
      exercise.secondaryMuscles
    )
  ];

  const rules =
    [];

  if (
    focusBodyParts.length
  ) {
    rules.push(
      intersects(
        exercise.bodyParts,
        focusBodyParts
      )
    );
  }

  if (
    focusMuscles.length
  ) {
    rules.push(
      intersects(
        exerciseMuscles,
        focusMuscles
      )
    );
  }

  if (
    focusMovements.length
  ) {
    rules.push(
      intersects(
        exercise.movementPatterns,
        focusMovements
      )
    );
  }

  if (
    focusTypes.length
  ) {
    rules.push(
      intersects(
        exercise.exerciseTypes,
        focusTypes
      )
    );
  }

  return rules.length
    ? rules.some(
        Boolean
      )
    : false;
}


function getFocusedExercisePool(
  dayState
) {
  if (
    !dayState
  ) {
    return [];
  }

  const focus =
    WorkoutFocuses.get(
      dayState.focusId
    );

  if (
    !focus
  ) {
    return [];
  }

  if (
    focus.id ===
    "off_day"
  ) {
    return [];
  }

  if (
    focus.id ===
    "custom"
  ) {
    return getAllRegistryExercises();
  }

  let recommended =
    [];

  try {
    const date =
      getActiveDateKey();

    if (
      date &&
      typeof WorkoutPlanController
        .getRecommendedExercisesForDate ===
      "function"
    ) {
      recommended =
        extractExerciseResults(
          WorkoutPlanController
            .getRecommendedExercisesForDate(
              date,
              {
                limit:
                  Math.max(
                    1000,
                    getAllRegistryExercises()
                      .length +
                      50
                  )
              }
            )
        );
    } else {
      recommended =
        extractExerciseResults(
          WorkoutPlanController
            .getRecommendedExercisesForDay(
              state.activeDay,
              {
                limit:
                  Math.max(
                    1000,
                    getAllRegistryExercises()
                      .length +
                      50
                  )
              }
            )
        );
    }
  } catch {
    recommended =
      [];
  }

  const focusedRecommendations =
    recommended.filter(
      exercise =>
        exerciseMatchesFocus(
          exercise,
          focus
        )
    );

  if (
    focusedRecommendations
      .length
  ) {
    return focusedRecommendations;
  }

  return getAllRegistryExercises()
    .filter(
      exercise =>
        exerciseMatchesFocus(
          exercise,
          focus
        )
    );
}


function filterFocusedPoolBySearch(
  exercises,
  query
) {
  const normalizedQuery =
    normalizeLower(
      query
    );

  if (
    !normalizedQuery
  ) {
    return exercises;
  }

  let searchResults =
    [];

  try {
    searchResults =
      extractExerciseResults(
        WorkoutPlanController
          .searchExercises(
            normalizedQuery,
            {
              limit:
                Math.max(
                  1000,
                  getAllRegistryExercises()
                    .length +
                    50
                )
            }
          )
      );
  } catch (
    error
  ) {
    console.warn(
      "ARI Workout Plans picker search failed. Using local search fallback.",
      error
    );

    searchResults =
      [];
  }

  if (
    searchResults.length >
    0
  ) {
    const ids =
      new Set(
        searchResults.map(
          exercise =>
            exercise.id
        )
      );

    return exercises.filter(
      exercise =>
        ids.has(
          exercise.id
        )
    );
  }

  return locallySearchExercises(
    exercises,
    normalizedQuery
  );
}


/* =====================================================
   DAY EDITOR
===================================================== */

function openDayEditor(
  day,
  dateKey =
    null
) {
  const normalizedDay =
    normalizeLower(
      day
    );

  if (
    !DAYS.includes(
      normalizedDay
    )
  ) {
    return;
  }

  state.activeDay =
    normalizedDay;

  const resolvedDate =
    parseLocalDateKey(
      dateKey
    ) ||
    getDateForDay(
      normalizedDay
    );

  state.activeDayDate =
    resolvedDate
      ? toLocalDateKey(
          resolvedDate
        )
      : null;

  let dayState =
    null;

  if (
    state.activeDayDate &&
    typeof WorkoutPlanController
      .getDate ===
    "function"
  ) {
    dayState =
      WorkoutPlanController
        .getDate(
          state.activeDayDate
        );
  }

  if (
    !dayState
  ) {
    dayState =
      getSelectedDay(
        normalizedDay
      );
  }

  state.expandedExerciseIndex =
    null;

  if (
    dom.workoutDayEditorTitle
  ) {
    dom.workoutDayEditorTitle
      .textContent =
        resolvedDate
          ? formatDayCardDate(
              normalizedDay,
              resolvedDate
            )
          : DAY_SHORT_LABELS[
              normalizedDay
            ];
  }

  if (
    dom.workoutDayType
  ) {
    dom.workoutDayType.value =
      dayState?.type ||
      "off";
  }

  if (
    dom.workoutDayFocus
  ) {
    dom.workoutDayFocus.value =
      dayState?.focusId ||
      "off_day";
  }

  updateDayEditorVisibility();

  renderDayExercises();

  openDialog(
    dom.workoutDayEditor
  );
}


function updateDayEditorVisibility() {
  const type =
    dom.workoutDayType
      ?.value ||
    "off";

  const off =
    type ===
    "off";

  if (
    dom.workoutDayFocus
  ) {
    dom.workoutDayFocus.disabled =
      off;
  }

  if (
    dom.workoutDayExerciseSection
  ) {
    dom.workoutDayExerciseSection.hidden =
      off;
  }
}


/* =====================================================
   METRIC INPUT
===================================================== */

function makeMetricInput({
  label,
  field,
  value =
    "",
  min =
    0,
  max =
    null,
  step =
    1,
  inputMode =
    "decimal",
  placeholder =
    ""
}) {
  const wrapper =
    document.createElement(
      "label"
    );

  wrapper.className =
    "workout-exercise-metric";

  const span =
    document.createElement(
      "span"
    );

  span.textContent =
    label;

  const input =
    document.createElement(
      "input"
    );

  input.type =
    "number";

  input.inputMode =
    inputMode;

  input.min =
    String(
      min
    );

  if (
    max !==
    null
  ) {
    input.max =
      String(
        max
      );
  }

  input.step =
    String(
      step
    );

  input.value =
    displayMetricValue(
      field,
      value
    );

  if (
    placeholder
  ) {
    input.placeholder =
      placeholder;
  }

  input.dataset
    .exerciseField =
      field;

  wrapper.append(
    span,
    input
  );

  return wrapper;
}


/* =====================================================
   EXERCISE PRESCRIPTION SUMMARY
===================================================== */

function getExercisePrescriptionSummary(
  exercise,
  entry
) {
  const parts =
    [];

  if (
    Number(
      entry.sets
    ) > 0 &&
    Number(
      entry.reps
    ) > 0
  ) {
    parts.push(
      `${entry.sets} sets \u00D7 ${entry.reps} reps`
    );
  } else if (
    Number(
      entry.sets
    ) > 0
  ) {
    parts.push(
      `${entry.sets} sets`
    );
  } else if (
    Number(
      entry.reps
    ) > 0
  ) {
    parts.push(
      `${entry.reps} reps`
    );
  }

  if (
    Number(
      entry.weight
    ) > 0
  ) {
    parts.push(
      `${entry.weight} lb`
    );
  }

  const addedWeight =
    entry.addedWeight ??
    entry.added_weight;

  if (
    Number(
      addedWeight
    ) > 0
  ) {
    parts.push(
      `${addedWeight} lb`
    );
  }

  if (
    Number(
      entry.durationMinutes
    ) > 0
  ) {
    parts.push(
      `${entry.durationMinutes} min`
    );
  }

  if (
    Number(
      entry.durationSeconds
    ) > 0
  ) {
    parts.push(
      `${entry.durationSeconds} sec`
    );
  }

  if (
    Number(
      entry.rounds
    ) > 0
  ) {
    parts.push(
      `${entry.rounds} rounds`
    );
  }

  return parts.length
    ? parts.join(
        " \u00B7 "
      )
    : (
        (
          exercise.primaryMuscles ||
          []
        )
          .map(
            getMuscleLabel
          )
          .slice(
            0,
            2
          )
          .join(
            " \u00B7 "
          ) ||
        "Set workout details"
      );
}


/* =====================================================
   DAY EXERCISES
===================================================== */

function renderDayExercises() {
  if (
    !state.activeDay ||
    !dom.workoutDayExerciseList
  ) {
    return;
  }

  const dayState =
    getCurrentDayState();

  const entries =
    dayState
      ?.exercises ||
    [];

  dom.workoutDayExerciseList
    .innerHTML =
      "";

  if (
    dom.workoutDayExerciseEmpty
  ) {
    dom.workoutDayExerciseEmpty
      .hidden =
        entries.length >
        0;
  }

  entries.forEach(
    (
      entry,
      index
    ) => {
      const exercise =
        ExerciseRegistry.get(
          entry.exerciseId
        );

      if (
        !exercise
      ) {
        return;
      }

      const expanded =
        state.expandedExerciseIndex ===
        index;

      const row =
        document.createElement(
          "article"
        );

      row.className =
        "workout-exercise-row";

      row.dataset
        .exerciseIndex =
          String(
            index
          );

      row.dataset
        .exerciseId =
          exercise.id;

      row.dataset
        .expanded =
          expanded
            ? "true"
            : "false";

      const summary =
        document.createElement(
          "button"
        );

      summary.type =
        "button";

      summary.className =
        "workout-exercise-row__summary";

      summary.dataset
        .workoutAction =
          "toggle-exercise-row";

      summary.dataset
        .exerciseIndex =
          String(
            index
          );

      summary.setAttribute(
        "aria-expanded",
        expanded
          ? "true"
          : "false"
      );

      const copy =
        document.createElement(
          "span"
        );

      copy.className =
        "workout-exercise-row__summary-copy";

      const strong =
        document.createElement(
          "strong"
        );

      strong.textContent =
        exercise.name;

      const sub =
        document.createElement(
          "span"
        );

      sub.textContent =
        getExercisePrescriptionSummary(
          exercise,
          entry
        );

      copy.append(
        strong,
        sub
      );

      const summaryEnd =
        document.createElement(
          "span"
        );

      summaryEnd.className =
        "workout-exercise-row__summary-end";

      if (
        !expanded
      ) {
        const doneBadge =
          document.createElement(
            "span"
          );

        doneBadge.className =
          "workout-exercise-row__done-badge";

        doneBadge.textContent =
          "DONE \u2713";

        doneBadge.setAttribute(
          "aria-hidden",
          "true"
        );

        summaryEnd.appendChild(
          doneBadge
        );
      }

      const chevron =
        document.createElement(
          "span"
        );

      chevron.className =
        "workout-exercise-row__chevron";

      chevron.setAttribute(
        "aria-hidden",
        "true"
      );

      chevron.textContent =
        expanded
          ? "\u25B2"
          : "\u25BC";

      summaryEnd.appendChild(
        chevron
      );

      summary.append(
        copy,
        summaryEnd
      );

      const body =
        document.createElement(
          "div"
        );

      body.className =
        "workout-exercise-row__body";

      body.hidden =
        !expanded;

      const metrics =
        document.createElement(
          "div"
        );

      metrics.className =
        "workout-exercise-row__prescription";

      const fields =
        exercise
          .logging
          ?.fields ||
        [];

      if (
        fields.includes(
          "sets"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Sets",

            field:
              "sets",

            value:
              entry.sets ??
              "",

            min:
              1,

            max:
              20,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "reps"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Reps",

            field:
              "reps",

            value:
              entry.reps ??
              "",

            min:
              1,

            max:
              200,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "weight"
        ) ||
        fields.includes(
          "added_weight"
        )
      ) {
        const weightField =
          fields.includes(
            "weight"
          )
            ? "weight"
            : "added_weight";

        metrics.appendChild(
          makeMetricInput({
            label:
              "Weight",

            field:
              weightField,

            value:
              entry.weight ??
              entry.addedWeight ??
              entry.added_weight ??
              "",

            min:
              0,

            step:
              0.5,

            placeholder:
              "Optional"
          })
        );
      }

      if (
        fields.includes(
          "rest_seconds"
        ) ||
        isSetBasedExercise(
          exercise
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Rest sec",

            field:
              "restSeconds",

            value:
              getRestSecondsValue(
                exercise,
                entry
              ),

            min:
              0,

            max:
              3600,

            step:
              5,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "duration_minutes"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Minutes",

            field:
              "durationMinutes",

            value:
              entry.durationMinutes ??
              "",

            min:
              1,

            max:
              600,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "duration_seconds"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Seconds",

            field:
              "durationSeconds",

            value:
              entry.durationSeconds ??
              "",

            min:
              1,

            max:
              3600,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "distance"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Distance",

            field:
              "distance",

            value:
              entry.distance ??
              "",

            min:
              0,

            step:
              0.1
          })
        );
      }

      if (
        fields.includes(
          "rounds"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Rounds",

            field:
              "rounds",

            value:
              entry.rounds ??
              "",

            min:
              1,

            max:
              100,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      if (
        fields.includes(
          "work_seconds"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Work sec",

            field:
              "workSeconds",

            value:
              entry.workSeconds ??
              "",

            min:
              1,

            max:
              3600,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

      const done =
        document.createElement(
          "button"
        );

      done.type =
        "button";

      done.className =
        "workout-exercise-row__done";

      done.dataset
        .workoutAction =
          "done-exercise-row";

      done.dataset
        .exerciseIndex =
          String(
            index
          );

      done.textContent =
        "Done";

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "workout-exercise-row__actions";

      const detail =
        document.createElement(
          "button"
        );

      detail.type =
        "button";

      detail.className =
        "workout-exercise-row__detail";

      detail.dataset
        .workoutAction =
          "open-exercise-detail";

      detail.dataset
        .exerciseId =
          exercise.id;

      detail.textContent =
        "View Exercise";

      const remove =
        document.createElement(
          "button"
        );

      remove.type =
        "button";

      remove.className =
        "workout-exercise-row__remove";

      remove.dataset
        .workoutAction =
          "remove-exercise";

      remove.dataset
        .exerciseIndex =
          String(
            index
          );

      remove.textContent =
        "Remove";

      actions.append(
        detail,
        remove
      );

      body.append(
        metrics,
        done,
        actions
      );

      row.append(
        summary,
        body
      );

      dom.workoutDayExerciseList
        .appendChild(
          row
        );
    }
  );
}


/* =====================================================
   EXERCISE PICKER
===================================================== */

function openExercisePicker() {
  if (
    !state.activeDay
  ) {
    return;
  }

  const dayState =
    getCurrentDayState();

  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    showToast(
      "Choose Workout or Recovery before adding exercises.",
      {
        error:
          true
      }
    );

    return;
  }

  state.pickerQuery =
    "";

  if (
    dom.workoutExercisePickerSearch
  ) {
    dom.workoutExercisePickerSearch
      .value =
        "";
  }

  renderExercisePicker();

  /*
   * IMPORTANT:
   * iOS/Safari can fail when showModal() is called while another
   * modal dialog is already open. Close the day editor first,
   * open the picker, then restore the day editor when picker closes.
   */
  state.reopenDayEditorAfterPicker =
    isDialogOpen(
      dom.workoutDayEditor
    );

  if (
    state.reopenDayEditorAfterPicker
  ) {
    closeDialog(
      dom.workoutDayEditor
    );
  }

  requestAnimationFrame(
    () => {
      openDialog(
        dom.workoutExercisePicker
      );
    }
  );
}


function renderExercisePicker() {
  if (
    !state.activeDay ||
    !dom.workoutExercisePickerList
  ) {
    return;
  }

  const dayState =
    getCurrentDayState();

  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    dom.workoutExercisePickerList
      .innerHTML =
        "";

    return;
  }

  const focus =
    WorkoutFocuses.get(
      dayState.focusId
    );

  let exercises =
    getFocusedExercisePool(
      dayState
    );

  exercises =
    filterFocusedPoolBySearch(
      exercises,
      state.pickerQuery
    );

  if (
    dom.workoutExercisePickerContext
  ) {
    const focusLabel =
      focus?.label ||
      "this workout";

    dom.workoutExercisePickerContext
      .textContent =
        focus?.id ===
          "custom"
          ? "Browse all exercises."
          : `Exercises for ${focusLabel}.`;
  }

  dom.workoutExercisePickerList
    .innerHTML =
      "";

  if (
    exercises.length ===
    0
  ) {
    const empty =
      document.createElement(
        "p"
      );

    empty.className =
      "workout-exercise-picker__empty";

    empty.textContent =
      state.pickerQuery
        ? "No matching exercises."
        : "No exercises are mapped to this focus.";

    dom.workoutExercisePickerList
      .appendChild(
        empty
      );

    return;
  }

  for (
    const exercise
    of exercises
  ) {
    renderExerciseCard(
      exercise,
      {
        addEnabled:
          true,

        container:
          dom.workoutExercisePickerList
      }
    );
  }
}


/* =====================================================
   EXERCISE DETAIL
===================================================== */

function openExerciseDetail(
  exerciseId,
  {
    addMode =
      false
  } = {}
) {
  const exercise =
    ExerciseRegistry.get(
      exerciseId
    );

  if (
    !exercise
  ) {
    return;
  }

  state.activeExerciseId =
    exercise.id;

  state.detailAddMode =
    Boolean(
      addMode &&
      state.activeDay
    );

  if (
    dom.exerciseDetailType
  ) {
    dom.exerciseDetailType
      .textContent =
        (
          exercise.exerciseTypes ||
          []
        )
          .slice(
            0,
            2
          )
          .map(
            id =>
              ExerciseTypes.get(
                id
              )?.shortLabel ||
              titleFromId(
                id
              )
          )
          .join(
            " \u00B7 "
          ) ||
        "EXERCISE";
  }

  if (
    dom.exerciseDetailName
  ) {
    dom.exerciseDetailName
      .textContent =
        exercise.name;
  }

  const anatomyPath =
    exercise
      .illustration
      ?.anatomy ||
    null;

  const movementPath =
    exercise
      .illustration
      ?.movement ||
    null;

  if (
    dom.exerciseAnatomyFigure &&
    dom.exerciseAnatomyImage
  ) {
    dom.exerciseAnatomyFigure
      .hidden =
        !anatomyPath;

    if (
      anatomyPath
    ) {
      dom.exerciseAnatomyImage
        .src =
          anatomyPath;

      dom.exerciseAnatomyImage
        .alt =
          `${exercise.name} muscle illustration`;
    }
  }

  if (
    dom.exerciseMovementFigure &&
    dom.exerciseMovementImage
  ) {
    dom.exerciseMovementFigure
      .hidden =
        !movementPath;

    if (
      movementPath
    ) {
      dom.exerciseMovementImage
        .src =
          movementPath;

      dom.exerciseMovementImage
        .alt =
          `${exercise.name} movement illustration`;
    }
  }

  if (
    dom.exerciseVisualPlaceholder
  ) {
    dom.exerciseVisualPlaceholder
      .hidden =
        Boolean(
          anatomyPath ||
          movementPath
        );
  }

  if (
    dom.exerciseInstructionList
  ) {
    dom.exerciseInstructionList
      .innerHTML =
        "";

    const instructions =
      exercise.instructions
        ?.length
        ? exercise.instructions
        : [
            exercise.summary
          ].filter(
            Boolean
          );

    for (
      const instruction
      of instructions
    ) {
      const li =
        document.createElement(
          "li"
        );

      li.textContent =
        instruction;

      dom.exerciseInstructionList
        .appendChild(
          li
        );
    }
  }

  if (
    dom.exerciseMuscleList
  ) {
    dom.exerciseMuscleList
      .innerHTML =
        "";

    const primary =
      document.createElement(
        "p"
      );

    primary.textContent =
      `Primary: ${
        (
          exercise.primaryMuscles ||
          []
        )
          .map(
            getMuscleLabel
          )
          .join(
            ", "
          ) ||
        "Not specified"
      }`;

    const secondary =
      document.createElement(
        "p"
      );

    secondary.textContent =
      `Secondary: ${
        (
          exercise.secondaryMuscles ||
          []
        )
          .map(
            getMuscleLabel
          )
          .join(
            ", "
          ) ||
        "None listed"
      }`;

    dom.exerciseMuscleList
      .append(
        primary,
        secondary
      );
  }

  if (
    dom.exerciseMovementSummary
  ) {
    dom.exerciseMovementSummary
      .textContent =
        (
          exercise.movementPatterns ||
          []
        )
          .map(
            getMovementLabel
          )
          .join(
            " \u00B7 "
          ) ||
        "Movement classification pending.";
  }

  if (
    dom.exerciseFormCueList
  ) {
    dom.exerciseFormCueList
      .innerHTML =
        "";

    for (
      const cue
      of exercise.cues ||
        []
    ) {
      const li =
        document.createElement(
          "li"
        );

      li.textContent =
        cue;

      dom.exerciseFormCueList
        .appendChild(
          li
        );
    }
  }

  if (
    dom.exerciseCaloriesSection
  ) {
    const estimable =
      Boolean(
        exercise.energyProfile ||
        exercise.exerciseTypes
          ?.includes(
            "strength"
          ) ||
        exercise.exerciseTypes
          ?.includes(
            "hypertrophy"
          )
      );

    dom.exerciseCaloriesSection
      .hidden =
        !estimable;

    if (
      estimable &&
      dom.exerciseCaloriesEstimate
    ) {
      dom.exerciseCaloriesEstimate
        .textContent =
          "Calories are estimated when the workout is performed.";
    }
  }

  if (
    dom.exerciseDetailAddButton
  ) {
    const alreadyAdded =
      state.activeDay &&
      hasExerciseOnActiveDay(
        exercise.id
      );

    dom.exerciseDetailAddButton
      .hidden =
        !state.detailAddMode;

    dom.exerciseDetailAddButton
      .disabled =
        Boolean(
          alreadyAdded
        );

    if (
      state.detailAddMode
    ) {
      dom.exerciseDetailAddButton
        .textContent =
          alreadyAdded
            ? "Already Added"
            : "Add Exercise";
    }
  }

  state.reopenPickerAfterDetail =
    isDialogOpen(
      dom.workoutExercisePicker
    );

  if (
    state.reopenPickerAfterDetail
  ) {
    closeDialog(
      dom.workoutExercisePicker
    );
  }

  requestAnimationFrame(
    () => {
      openDialog(
        dom.exerciseDetailDialog
      );
    }
  );
}


/* =====================================================
   ADD EXERCISE
===================================================== */

function addExerciseToActiveDay(
  exerciseId
) {
  if (
    !state.activeDay
  ) {
    return false;
  }

  const exercise =
    ExerciseRegistry.get(
      exerciseId
    );

  if (
    !exercise
  ) {
    showToast(
      "That exercise could not be found.",
      {
        error:
          true
      }
    );

    return false;
  }

  if (
    hasExerciseOnActiveDay(
      exercise.id
    )
  ) {
    showToast(
      `${exercise.name} is already in this workout.`,
      {
        error:
          true
      }
    );

    return false;
  }

  const dayState =
    getCurrentDayState();

  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    showToast(
      "Choose Workout before adding exercises.",
      {
        error:
          true
      }
    );

    return false;
  }

  const focus =
    WorkoutFocuses.get(
      dayState?.focusId
    );

  if (
    focus &&
    focus.id !==
      "custom" &&
    !exerciseMatchesFocus(
      exercise,
      focus
    )
  ) {
    showToast(
      `${exercise.name} does not match this Training Focus.`,
      {
        error:
          true
      }
    );

    return false;
  }

  const defaults =
    {};

  const fields =
    exercise
      .logging
      ?.fields ||
    [];

  if (
    fields.includes(
      "sets"
    )
  ) {
    defaults.sets =
      3;
  }

  if (
    fields.includes(
      "reps"
    )
  ) {
    defaults.reps =
      10;
  }

  if (
    isSetBasedExercise(
      exercise
    )
  ) {
    defaults.restSeconds =
      DEFAULT_STRENGTH_REST_SECONDS;
  }

  if (
    fields.includes(
      "duration_minutes"
    )
  ) {
    defaults.durationMinutes =
      30;
  }

  if (
    fields.includes(
      "duration_seconds"
    )
  ) {
    defaults.durationSeconds =
      30;
  }

  if (
    exercise.energyProfile
      ?.intensityOptions
      ?.includes(
        "moderate"
      )
  ) {
    defaults.intensity =
      "moderate";
  }

  const added =
    controllerAddExercise(
      state.activeDay,
      exercise.id,
      defaults
    );

  if (
    !added
  ) {
    showToast(
      "Exercise could not be added.",
      {
        error:
          true
      }
    );

    return false;
  }

  const updatedDay =
    getCurrentDayState();

  state.expandedExerciseIndex =
    Math.max(
      (
        updatedDay
          ?.exercises
          ?.length ||
        1
      ) - 1,
      0
    );

  closeDialog(
    dom.exerciseDetailDialog
  );

  state.reopenPickerAfterDetail =
    false;

  closeDialog(
    dom.workoutExercisePicker
  );

  renderWeek();
  renderDayExercises();

  scheduleAutosave();

  showToast(
    `${exercise.name} added.`
  );

  requestAnimationFrame(
    () => {
      if (
        state.reopenDayEditorAfterPicker
      ) {
        state.reopenDayEditorAfterPicker =
          false;

        reopenDayEditor();
      }

      requestAnimationFrame(
        () => {
          const row =
            dom.workoutDayExerciseList
              ?.querySelector(
                `[data-exercise-index="${state.expandedExerciseIndex}"]`
              );

          row?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "nearest"
          });

          row
            ?.querySelector(
              "input"
            )
            ?.focus({
              preventScroll:
                true
            });
        }
      );
    }
  );

  return true;
}


function collapseExerciseRow(
  index
) {
  if (
    !Number.isInteger(
      index
    )
  ) {
    return false;
  }

  if (
    state.expandedExerciseIndex !==
      index
  ) {
    return false;
  }

  state.expandedExerciseIndex =
    null;

  renderDayExercises();

  return true;
}


/* =====================================================
   DAY EDITOR UPDATE
===================================================== */

function updateDayFromEditor() {
  if (
    !state.activeDay
  ) {
    return;
  }

  const type =
    dom.workoutDayType
      ?.value ||
    "off";

  if (
    type ===
    "off"
  ) {
    controllerSetDayFocus(
      state.activeDay,
      "off_day"
    );

    controllerSetDayType(
      state.activeDay,
      "off"
    );
  } else {
    controllerSetDayType(
      state.activeDay,
      type
    );

    const focusId =
      dom.workoutDayFocus
        ?.value;

    if (
      focusId
    ) {
      controllerSetDayFocus(
        state.activeDay,
        focusId
      );
    }

    if (
      type ===
      "recovery"
    ) {
      controllerSetDayType(
        state.activeDay,
        "recovery"
      );
    }
  }

  updateDayEditorVisibility();

  renderWeek();
  renderDayExercises();

  scheduleAutosave();
}


/* =====================================================
   SAVE
===================================================== */

function scheduleAutosave() {
  window.clearTimeout(
    state.autosaveTimer
  );

  const generation =
    ++state.autosaveGeneration;

  state.autosaveTimer =
    window.setTimeout(
      async () => {
        if (
          generation !==
          state.autosaveGeneration
        ) {
          return;
        }

        try {
          await WorkoutPlanController
            .save({
              remote:
                true
            });
        } catch (
          error
        ) {
          console.warn(
            "ARI Training autosave failed.",
            error
          );
        }
      },
      700
    );
}


async function savePlan({
  announce =
    true
} = {}) {
  if (
    state.saving
  ) {
    return false;
  }

  state.saving =
    true;

  if (
    dom.workoutPlansSaveButton
  ) {
    dom.workoutPlansSaveButton
      .disabled =
        true;

    dom.workoutPlansSaveButton
      .textContent =
        "Saving...";
  }

  try {
    const success =
      await WorkoutPlanController
        .save({
          remote:
            true
        });

    if (
      announce
    ) {
      showToast(
        success
          ? "Workout plan saved."
          : "Saved on this device."
      );
    }

    return success;
  } catch (
    error
  ) {
    console.error(
      "Workout plan save failed.",
      error
    );

    showToast(
      "Workout plan could not be saved.",
      {
        error:
          true
      }
    );

    return false;
  } finally {
    state.saving =
      false;

    if (
      dom.workoutPlansSaveButton
    ) {
      dom.workoutPlansSaveButton
        .disabled =
          false;

      dom.workoutPlansSaveButton
        .textContent =
          "Save";
    }
  }
}


async function saveNow() {
  window.clearTimeout(
    state.autosaveTimer
  );

  ++state.autosaveGeneration;

  try {
    return await WorkoutPlanController
      .save({
        remote:
          true
      });
  } catch (
    error
  ) {
    console.error(
      "Workout plan save failed.",
      error
    );

    return false;
  }
}


async function finishDayEditor() {
  updateDayFromEditor();

  if (
    dom.workoutDayDoneButton
  ) {
    dom.workoutDayDoneButton
      .disabled =
        true;

    dom.workoutDayDoneButton
      .textContent =
        "Saving...";
  }

  const success =
    await saveNow();

  if (
    dom.workoutDayDoneButton
  ) {
    dom.workoutDayDoneButton
      .disabled =
        false;

    dom.workoutDayDoneButton
      .textContent =
        "Save Workout";
  }

  closeDialog(
    dom.workoutDayEditor
  );

  state.expandedExerciseIndex =
    null;

  renderWeek();

  showToast(
    success
      ? "Workout saved."
      : "Saved on this device."
  );
}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {
  renderWeekHeader();
  renderWeek();

  if (
    state.activeTab ===
      "templates"
  ) {
    renderTemplates();
  }

  if (
    state.activeTab ===
      "library"
  ) {
    renderExerciseLibrary();
  }
}


/* =====================================================
   CLICK EVENTS
===================================================== */

function handleClick(
  event
) {
  const tab =
    event.target.closest(
      "[data-workout-tab]"
    );

  if (
    tab
  ) {
    setActiveTab(
      tab.dataset
        .workoutTab
    );

    return;
  }

  const actionNode =
    event.target.closest(
      "[data-workout-action]"
    );

  if (
    !actionNode
  ) {
    return;
  }

  const action =
    actionNode.dataset
      .workoutAction;

  switch (
    action
  ) {
    case "previous-week":
      void goPreviousWeek();
      break;


    case "next-week":
      void goNextWeek();
      break;


    case "repeat-last-week":
      void repeatLastWeek();
      break;


    case "clear-week":
      void clearSelectedWeek();
      break;


    case "edit-day":
      openDayEditor(
        actionNode.dataset.day ||
        actionNode
          .closest(
            "[data-day]"
          )
          ?.dataset
          ?.day,

        actionNode.dataset.date ||
        actionNode
          .closest(
            "[data-date]"
          )
          ?.dataset
          ?.date
      );
      break;


    case "close-day-editor":
      closeDialog(
        dom.workoutDayEditor
      );
      break;


    case "done-day":
      void finishDayEditor();
      break;


    case "toggle-exercise-row": {
      const index =
        Number(
          actionNode.dataset
            .exerciseIndex ??
          actionNode
            .closest(
              "[data-exercise-index]"
            )
            ?.dataset
            ?.exerciseIndex
        );

      if (
        Number.isInteger(
          index
        )
      ) {
        state.expandedExerciseIndex =
          state.expandedExerciseIndex ===
            index
            ? null
            : index;

        renderDayExercises();
      }

      break;
    }


    case "done-exercise-row": {
      const index =
        Number(
          actionNode.dataset
            .exerciseIndex ??
          actionNode
            .closest(
              "[data-exercise-index]"
            )
            ?.dataset
            ?.exerciseIndex
        );

      collapseExerciseRow(
        index
      );

      break;
    }


    case "open-exercise-picker":
      openExercisePicker();
      break;


    case "close-exercise-picker":
      closePickerAndReturnToDayEditor();
      break;


    case "open-exercise-detail":
      openExerciseDetail(
        actionNode.dataset
          .exerciseId ||
        actionNode
          .closest(
            "[data-exercise-id]"
          )
          ?.dataset
          ?.exerciseId,

        {
          addMode:
            Boolean(
              actionNode.closest(
                "#workoutExercisePicker"
              )
            )
        }
      );
      break;


    case "close-exercise-detail":
      closeDetailAndReturn();
      break;


    case "add-exercise":
      addExerciseToActiveDay(
        actionNode.dataset
          .exerciseId
      );
      break;


    case "add-detail-exercise":
      if (
        state.activeExerciseId
      ) {
        addExerciseToActiveDay(
          state.activeExerciseId
        );
      }

      break;


    case "remove-exercise": {
      const row =
        actionNode.closest(
          "[data-exercise-index]"
        );

      const index =
        Number(
          actionNode.dataset
            .exerciseIndex ??
          row?.dataset
            ?.exerciseIndex
        );

      if (
        state.activeDay &&
        Number.isInteger(
          index
        )
      ) {
        controllerRemoveExercise(
          state.activeDay,
          index
        );

        if (
          state.expandedExerciseIndex ===
          index
        ) {
          state.expandedExerciseIndex =
            null;
        } else if (
          Number.isInteger(
            state.expandedExerciseIndex
          ) &&
          state.expandedExerciseIndex >
            index
        ) {
          state.expandedExerciseIndex -=
            1;
        }

        renderWeek();
        renderDayExercises();

        scheduleAutosave();
      }

      break;
    }


    case "apply-template":
      void applyTemplate(
        actionNode.dataset
          .templateId
      );
      break;


    default:
      break;
  }
}


/* =====================================================
   CHANGE EVENTS
===================================================== */

function handleChange(
  event
) {
  const target =
    event.target;

  if (
    target ===
      dom.workoutTemplateGoalFilter ||
    target ===
      dom.workoutTemplateDaysFilter
  ) {
    renderTemplates();

    return;
  }

  if (
    target ===
      dom.exerciseBodyPartFilter ||
    target ===
      dom.exerciseMovementFilter ||
    target ===
      dom.exerciseTypeFilter ||
    target ===
      dom.exerciseEquipmentFilter
  ) {
    renderExerciseLibrary();

    return;
  }

  if (
    target ===
      dom.workoutDayType
  ) {
    if (
      target.value ===
        "workout" &&
      dom.workoutDayFocus
        ?.value ===
        "off_day"
    ) {
      dom.workoutDayFocus.value =
        "custom";
    }

    updateDayFromEditor();

    return;
  }

  if (
    target ===
      dom.workoutDayFocus
  ) {
    if (
      target.value ===
        "off_day"
    ) {
      if (
        dom.workoutDayType
      ) {
        dom.workoutDayType.value =
          "off";
      }
    } else if (
      dom.workoutDayType
        ?.value ===
      "off"
    ) {
      dom.workoutDayType.value =
        "workout";
    }

    updateDayFromEditor();

    return;
  }

  if (
    target.dataset
      ?.exerciseField
  ) {
    const row =
      target.closest(
        "[data-exercise-index]"
      );

    const index =
      Number(
        row?.dataset
          ?.exerciseIndex
      );

    const field =
      target.dataset
        .exerciseField;

    const number =
      target.value ===
        ""
        ? null
        : Number(
            target.value
          );

    if (
      state.activeDay &&
      Number.isInteger(
        index
      )
    ) {
      controllerUpdateExercise(
        state.activeDay,
        index,
        {
          [field]:
            Number.isFinite(
              number
            )
              ? number
              : null
        }
      );

      renderWeek();

      scheduleAutosave();
    }

    return;
  }
}


/* =====================================================
   INPUT EVENTS
===================================================== */

function handleInput(
  event
) {
  const target =
    event.target;

  if (
    target ===
      dom.workoutExercisePickerSearch
  ) {
    state.pickerQuery =
      normalizeText(
        target.value
      );

    renderExercisePicker();

    return;
  }

  if (
    target ===
      dom.exerciseLibrarySearch
  ) {
    state.libraryQuery =
      normalizeText(
        target.value
      );

    renderExerciseLibrary();
  }
}


/* =====================================================
   EVENT BINDING
===================================================== */

function bindEvents() {
  document.addEventListener(
    "click",
    handleClick
  );

  document.addEventListener(
    "change",
    handleChange
  );

  document.addEventListener(
    "input",
    handleInput
  );

  dom.workoutPlansBackButton
    ?.addEventListener(
      "click",
      () => {
        window.location.href =
          "ari-training.html";
      }
    );

  dom.workoutPlansSaveButton
    ?.addEventListener(
      "click",
      () => {
        void savePlan();
      }
    );

  dom.exerciseLibrarySearchForm
    ?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        state.libraryQuery =
          normalizeText(
            dom.exerciseLibrarySearch
              ?.value
          );

        renderExerciseLibrary();
      }
    );

  dom.workoutExercisePicker
    ?.addEventListener(
      "close",
      () => {
        if (
          state.reopenDayEditorAfterPicker &&
          !isDialogOpen(
            dom.exerciseDetailDialog
          )
        ) {
          state.reopenDayEditorAfterPicker =
            false;

          requestAnimationFrame(
            () => {
              reopenDayEditor();
            }
          );
        }
      }
    );

  dom.exerciseDetailDialog
    ?.addEventListener(
      "close",
      () => {
        if (
          state.reopenPickerAfterDetail
        ) {
          state.reopenPickerAfterDetail =
            false;

          requestAnimationFrame(
            () => {
              openDialog(
                dom.workoutExercisePicker
              );
            }
          );
        }
      }
    );

  for (
    const dialog
    of [
      dom.workoutDayEditor,
      dom.workoutExercisePicker,
      dom.exerciseDetailDialog
    ]
  ) {
    dialog?.addEventListener(
      "click",
      event => {
        if (
          event.target !==
          dialog
        ) {
          return;
        }

        if (
          dialog ===
          dom.workoutExercisePicker
        ) {
          closePickerAndReturnToDayEditor();

          return;
        }

        if (
          dialog ===
          dom.exerciseDetailDialog
        ) {
          closeDetailAndReturn();

          return;
        }

        closeDialog(
          dialog
        );
      }
    );
  }
}


/* =====================================================
   INITIAL WEEK
===================================================== */

async function initializeSelectedWeek() {
  let weekStart =
    null;

  if (
    typeof WorkoutPlanController
      .getSelectedWeekStart ===
    "function"
  ) {
    weekStart =
      parseLocalDateKey(
        WorkoutPlanController
          .getSelectedWeekStart()
      );
  }

  if (
    !weekStart &&
    typeof WorkoutPlanController
      .getSelectedWeekKey ===
    "function"
  ) {
    weekStart =
      parseLocalDateKey(
        WorkoutPlanController
          .getSelectedWeekKey()
      );
  }

  if (
    !weekStart
  ) {
    weekStart =
      getSundayStart(
        new Date()
      );
  }

  state.selectedWeekStart =
    getSundayStart(
      weekStart
    );

  await selectControllerWeek(
    state.selectedWeekStart
  );
}


/* =====================================================
   DIAGNOSTICS
===================================================== */

function getPageDiagnostics() {
  const requiredForCorePage = [
    "workoutWeekGrid",
    "workoutDayCardTemplate",
    "workoutPreviousWeekButton",
    "workoutNextWeekButton",
    "workoutWeekRelativeLabel",
    "workoutWeekDateRange"
  ];

  const missingCoreDom =
    requiredForCorePage
      .filter(
        id =>
          !dom[
            id
          ]
      );

  return {
    source:
      SOURCE,

    version:
      VERSION,

    activeTab:
      state.activeTab,

    activeDay:
      state.activeDay,

    activeDayDate:
      state.activeDayDate,

    selectedWeekKey:
      state.selectedWeekStart
        ? getSelectedWeekKey()
        : null,

    selectedWeekLabel:
      state.selectedWeekStart
        ? getRelativeWeekLabel(
            state.selectedWeekStart
          )
        : null,

    selectedWeekRange:
      state.selectedWeekStart
        ? formatWeekRange(
            state.selectedWeekStart
          )
        : null,

    defaultStrengthRestSeconds:
      DEFAULT_STRENGTH_REST_SECONDS,

    registryExerciseCount:
      getAllRegistryExercises()
        .length,

    missingCoreDom,

    dialogs: {
      dayEditorOpen:
        isDialogOpen(
          dom.workoutDayEditor
        ),

      pickerOpen:
        isDialogOpen(
          dom.workoutExercisePicker
        ),

      detailOpen:
        isDialogOpen(
          dom.exerciseDetailDialog
        )
    },

    controller:
      WorkoutPlanController
        .getDiagnostics?.() ||
      null
  };
}


/* =====================================================
   BOOT
===================================================== */

async function boot() {
  if (
    state.booted
  ) {
    return;
  }

  state.booted =
    true;

  cacheDom();

  setStatus(
    "Loading your training schedule..."
  );

  try {
    await WorkoutPlanController
      .init();

    populateFilters();

    await initializeSelectedWeek();

    state.unsubscribeStore =
      WorkoutPlanController
        .subscribe(
          () => {
            renderWeek();

            if (
              state.activeDay &&
              isDialogOpen(
                dom.workoutDayEditor
              )
            ) {
              renderDayExercises();
            }

            if (
              state.activeDay &&
              isDialogOpen(
                dom.workoutExercisePicker
              )
            ) {
              renderExercisePicker();
            }

            if (
              state.activeTab ===
                "templates"
            ) {
              renderTemplates();
            }
          }
        );

    bindEvents();

    renderAll();

    setStatus(
      "",
      {
        hide:
          true
      }
    );

    const diagnostics =
      getPageDiagnostics();

    if (
      diagnostics
        .missingCoreDom
        .length
    ) {
      console.warn(
        "ARI Workout Plans is missing core HTML elements:",
        diagnostics
          .missingCoreDom
      );
    }

    globalThis.AriWorkoutPlansPage = {
      version:
        VERSION,

      source:
        SOURCE,

      controller:
        WorkoutPlanController,

      getSelectedWeekKey,

      getActiveDateKey,

      previousWeek:
        goPreviousWeek,

      nextWeek:
        goNextWeek,

      repeatLastWeek,

      clearWeek:
        clearSelectedWeek,

      refresh:
        renderAll,

      save:
        savePlan,

      diagnostics:
        getPageDiagnostics
    };

    console.info(
      `[ARI Workout Plans] Runtime initialized. Version ${VERSION}.`
    );
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans failed to start.",
      error
    );

    setStatus(
      "Workout Plans could not load.",
      {
        error:
          true
      }
    );

    showToast(
      error?.message ||
      "Workout Plans could not load.",
      {
        error:
          true,

        duration:
          5000
      }
    );
  }
}


/* =====================================================
   START
===================================================== */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    boot,
    {
      once:
        true
    }
  );
} else {
  boot();
}


/* =====================================================
   EXPORTS
===================================================== */

export {
  VERSION,
  SOURCE
};
