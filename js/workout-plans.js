// =====================================================
// ARI REBIRTH
// File: js/workout-plans.js
// Version: 3.0.0
// Purpose:
//   Date-specific Workout Plans page controller.
//
// V3.0.0:
//   - Moves Workout Plans from a permanently repeating week
//     to a real Sunday-Saturday calendar week.
//   - Each day visibly displays its calendar date.
//   - Supports browsing previous / next weeks.
//   - Supports jumping to a date from the calendar control.
//   - Future weeks default to Off Days until explicitly planned.
//   - Adds "Repeat Last Week" support.
//   - Applying a template copies the template into the selected
//     calendar week only; it does NOT permanently lock future weeks.
//   - Template-derived days become normal editable plan days.
//   - Editing a template day detaches that day from template metadata.
//   - Adds Clear Week support.
//   - Keeps Workout Plans separate from live workout execution.
//   - Preserves large Exercise Library search and focus filtering.
//   - Preserves safe local + Supabase autosave behavior.
//   - Remains defensive when optional V3 HTML controls are absent.
//
// Expected V3 optional HTML IDs:
//   workoutWeekDateRange
//   workoutPreviousWeekButton
//   workoutCurrentWeekButton
//   workoutNextWeekButton
//   workoutCalendarButton
//   workoutCalendarInput
//   workoutRepeatLastWeekButton
//   workoutClearWeekButton
//
// Existing V2 HTML remains supported.
// =====================================================

import WorkoutPlanController from "./training/workout-plan-controller.js";
import ExerciseRegistry from "./training/exercises/exercise-registry.js";
import WorkoutFocuses from "./training/workouts/workout-focuses.js";
import FitnessGoals from "./training/goals/fitness-goals.js";
import BodyParts from "./training/anatomy/body-parts.js";
import Muscles from "./training/anatomy/muscles.js";
import MovementPatterns from "./training/movements/movement-patterns.js";
import ExerciseTypes from "./training/movements/exercise-types.js";

const VERSION = "3.0.0";
const SOURCE = "js/workout-plans";

const DAYS = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]);

const DAY_INDEX = Object.freeze({
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
});

const DAY_LABELS = Object.freeze({
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday"
});

const state = {
  activeTab: "week",

  activeWeekKey: null,
  activeDay: null,
  activeDate: null,

  activeExerciseId: null,
  detailAddMode: false,
  expandedExerciseIndex: null,

  pickerQuery: "",
  libraryQuery: "",

  autosaveTimer: null,
  autosaveGeneration: 0,
  saving: false,

  booted: false,
  unsubscribeStore: null
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

    "workoutPlanName",
    "workoutDaysCount",
    "workoutOffDaysCount",
    "workoutExerciseCount",
    "workoutPlanGoalSummary",

    "workoutWeekDateRange",
    "workoutPreviousWeekButton",
    "workoutCurrentWeekButton",
    "workoutNextWeekButton",
    "workoutCalendarButton",
    "workoutCalendarInput",
    "workoutRepeatLastWeekButton",
    "workoutClearWeekButton",

    "workoutWeekGrid",

    "workoutTemplateGoalFilter",
    "workoutTemplateDaysFilter",
    "workoutTemplateList",
    "workoutTemplateEmpty",

    "workoutPrimaryGoal",
    "workoutSecondaryGoals",
    "workoutCustomWeek",

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
    "workoutDayTitle",
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
    "exerciseCardTemplate",
    "workoutExerciseRowTemplate"
  ];

  for (const id of ids) {
    dom[id] = document.getElementById(id);
  }

  dom.tabs = Array.from(
    document.querySelectorAll("[data-workout-tab]")
  );

  dom.panels = Array.from(
    document.querySelectorAll("[data-workout-panel]")
  );
}


/* =====================================================
   BASIC HELPERS
===================================================== */

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function titleFromId(value) {
  return normalizeText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function arrayOfIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeText)
    .filter(Boolean);
}

function uniqueIds(value) {
  return [
    ...new Set(
      arrayOfIds(value)
    )
  ];
}

function intersects(left = [], right = []) {
  const rightSet =
    new Set(
      arrayOfIds(right)
    );

  return arrayOfIds(left)
    .some(
      value =>
        rightSet.has(value)
    );
}

function clone(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function extractExerciseResults(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray(value.results)
  ) {
    return value.results;
  }

  return [];
}


/* =====================================================
   DATE / WEEK HELPERS
===================================================== */

function toLocalDate(value = new Date()) {
  if (value instanceof Date) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  const text =
    normalizeText(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(text)
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
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const parsed =
    new Date(value);

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

function formatDateKey(value = new Date()) {
  const date =
    toLocalDate(value);

  if (!date) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}

function getWeekStartDate(value = new Date()) {
  const date =
    toLocalDate(value);

  if (!date) {
    return null;
  }

  const sunday =
    new Date(date);

  sunday.setDate(
    sunday.getDate() -
    sunday.getDay()
  );

  return sunday;
}

function getWeekKey(value = new Date()) {
  if (
    typeof WorkoutPlanController.getWeekKey === "function"
  ) {
    try {
      const key =
        WorkoutPlanController.getWeekKey(value);

      if (key) {
        return key;
      }
    } catch {
      // Use local fallback.
    }
  }

  return formatDateKey(
    getWeekStartDate(value)
  );
}

function getDateForDay(
  weekKey,
  day
) {
  if (
    typeof WorkoutPlanController.getDateForDay === "function"
  ) {
    try {
      const result =
        WorkoutPlanController.getDateForDay(
          day,
          weekKey
        );

      if (result) {
        return formatDateKey(result);
      }
    } catch {
      // Use fallback.
    }
  }

  if (
    typeof WorkoutPlanController.getDayDateForWeek === "function"
  ) {
    try {
      const result =
        WorkoutPlanController.getDayDateForWeek(
          weekKey,
          day
        );

      if (result) {
        return formatDateKey(result);
      }
    } catch {
      // Use fallback.
    }
  }

  const start =
    toLocalDate(weekKey);

  const index =
    DAY_INDEX[
      normalizeLower(day)
    ];

  if (
    !start ||
    index === undefined
  ) {
    return null;
  }

  const date =
    new Date(start);

  date.setDate(
    date.getDate() + index
  );

  return formatDateKey(date);
}

function shiftWeekKey(
  weekKey,
  amount
) {
  const date =
    toLocalDate(weekKey);

  if (!date) {
    return getWeekKey(new Date());
  }

  date.setDate(
    date.getDate() +
    Number(amount || 0) * 7
  );

  return getWeekKey(date);
}

function formatShortDate(dateKey) {
  const date =
    toLocalDate(dateKey);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}

function formatLongDate(dateKey) {
  const date =
    toLocalDate(dateKey);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function formatWeekRange(weekKey) {
  const start =
    toLocalDate(weekKey);

  if (!start) {
    return "";
  }

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 6
  );

  const sameYear =
    start.getFullYear() ===
    end.getFullYear();

  const sameMonth =
    sameYear &&
    start.getMonth() ===
    end.getMonth();

  if (sameMonth) {
    return (
      `${start.toLocaleDateString(
        undefined,
        {
          month: "long",
          day: "numeric"
        }
      )} - ` +
      `${end.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          year: "numeric"
        }
      )}`
    );
  }

  if (sameYear) {
    return (
      `${start.toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric"
        }
      )} - ` +
      `${end.toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      )}`
    );
  }

  return (
    `${start.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    )} - ` +
    `${end.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    )}`
  );
}

function isCurrentWeek(
  weekKey =
    state.activeWeekKey
) {
  return (
    getWeekKey(new Date()) ===
    weekKey
  );
}


/* =====================================================
   CONTROLLER COMPATIBILITY
===================================================== */

function setControllerWeek(
  weekKey
) {
  state.activeWeekKey =
    getWeekKey(
      weekKey ||
      new Date()
    );

  if (
    typeof WorkoutPlanController.setActiveWeek === "function"
  ) {
    return WorkoutPlanController
      .setActiveWeek(
        state.activeWeekKey
      );
  }

  if (
    typeof WorkoutPlanController.setWeek === "function"
  ) {
    return WorkoutPlanController
      .setWeek(
        state.activeWeekKey
      );
  }

  return true;
}

function getPlanForActiveWeek() {
  if (
    typeof WorkoutPlanController.getPlanForWeek === "function"
  ) {
    try {
      return WorkoutPlanController
        .getPlanForWeek(
          state.activeWeekKey
        );
    } catch {
      // Fall through.
    }
  }

  return WorkoutPlanController
    .getPlan();
}

function getWeekForActiveWeek() {
  if (
    typeof WorkoutPlanController.getWeek === "function"
  ) {
    try {
      const week =
        WorkoutPlanController
          .getWeek(
            state.activeWeekKey
          );

      if (
        week &&
        typeof week === "object"
      ) {
        return week;
      }
    } catch {
      // Fall through.
    }
  }

  return getPlanForActiveWeek()
    ?.week ||
    {};
}

function getDayState(
  day,
  date =
    null
) {
  const resolvedDate =
    date ||
    getDateForDay(
      state.activeWeekKey,
      day
    );

  if (
    typeof WorkoutPlanController.getDayByDate === "function"
  ) {
    try {
      const result =
        WorkoutPlanController
          .getDayByDate(
            resolvedDate
          );

      if (result) {
        return result;
      }
    } catch {
      // Fall through.
    }
  }

  if (
    typeof WorkoutPlanController.getDay === "function"
  ) {
    try {
      const byDate =
        WorkoutPlanController
          .getDay(
            resolvedDate
          );

      if (
        byDate &&
        (
          byDate.date ===
            resolvedDate ||
          !byDate.day
        )
      ) {
        return byDate;
      }
    } catch {
      // Try weekday.
    }

    try {
      return WorkoutPlanController
        .getDay(day);
    } catch {
      return null;
    }
  }

  return null;
}

function getWeekSummaryForActiveWeek() {
  if (
    typeof WorkoutPlanController.getSummaryForWeek === "function"
  ) {
    try {
      return WorkoutPlanController
        .getSummaryForWeek(
          state.activeWeekKey
        );
    } catch {
      // Fall through.
    }
  }

  if (
    typeof WorkoutPlanController.getSummary === "function"
  ) {
    try {
      return WorkoutPlanController
        .getSummary(
          state.activeWeekKey
        );
    } catch {
      try {
        return WorkoutPlanController
          .getSummary();
      } catch {
        return null;
      }
    }
  }

  return null;
}

function getControllerActiveWeekKey() {
  try {
    return (
      WorkoutPlanController
        .getActiveWeekKey?.() ||
      WorkoutPlanController
        .getCurrentWeekKey?.() ||
      getWeekKey(new Date())
    );
  } catch {
    return getWeekKey(new Date());
  }
}

function clearWeekController(
  weekKey
) {
  if (
    typeof WorkoutPlanController.clearWeek === "function"
  ) {
    return WorkoutPlanController
      .clearWeek(
        weekKey
      );
  }

  let changed =
    false;

  for (
    const day
    of DAYS
  ) {
    const result =
      WorkoutPlanController
        .clearDay?.(
          getDateForDay(
            weekKey,
            day
          )
        ) ??
      WorkoutPlanController
        .clearDay?.(
          day
        );

    changed =
      Boolean(result) ||
      changed;
  }

  return changed;
}

function repeatPreviousWeekController(
  targetWeekKey
) {
  if (
    typeof WorkoutPlanController.repeatPreviousWeek === "function"
  ) {
    return WorkoutPlanController
      .repeatPreviousWeek(
        targetWeekKey
      );
  }

  if (
    typeof WorkoutPlanController.repeatLastWeek === "function"
  ) {
    return WorkoutPlanController
      .repeatLastWeek(
        targetWeekKey
      );
  }

  if (
    typeof WorkoutPlanController.copyWeek === "function"
  ) {
    return WorkoutPlanController
      .copyWeek({
        fromWeekKey:
          shiftWeekKey(
            targetWeekKey,
            -1
          ),

        toWeekKey:
          targetWeekKey
      });
  }

  return false;
}


/* =====================================================
   EXERCISE SEARCH HELPERS
===================================================== */

function getAllRegistryExercises() {
  if (
    Array.isArray(
      ExerciseRegistry?.all
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
    normalizeLower(query);

  if (!normalizedQuery) {
    return [
      ...exercises
    ];
  }

  const queryTokens =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

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
            exercise.goals || {}
          )
        ];

        const searchable =
          searchablePieces
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        let score = 0;

        const normalizedName =
          normalizeLower(
            exercise.name
          );

        const normalizedId =
          normalizeLower(
            exercise.id
          );

        const aliases =
          (exercise.aliases || [])
            .map(
              normalizeLower
            );

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
          normalizedName.startsWith(
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
          normalizedName.includes(
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
            normalizedName.includes(
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
        item.score > 0
    )
    .sort(
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

        return a.exercise.name
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
    error = false,
    duration = 2200
  } = {}
) {
  if (
    !dom.workoutPlansToast
  ) {
    return;
  }

  dom.workoutPlansToast.textContent =
    message;

  dom.workoutPlansToast.dataset.state =
    error
      ? "error"
      : "success";

  dom.workoutPlansToast.hidden =
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
          dom.workoutPlansToast.hidden =
            true;
        }
      },
      duration
    );
}

function setStatus(
  message,
  {
    hide = false,
    error = false
  } = {}
) {
  if (
    !dom.workoutPlansStatus
  ) {
    return;
  }

  dom.workoutPlansStatus.textContent =
    message ||
    "";

  dom.workoutPlansStatus.hidden =
    Boolean(
      hide
    );

  dom.workoutPlansStatus.dataset.state =
    error
      ? "error"
      : "ready";
}

function openDialog(
  dialog
) {
  if (!dialog) {
    return;
  }

  if (
    typeof dialog.showModal ===
    "function"
  ) {
    if (!dialog.open) {
      dialog.showModal();
    }

    return;
  }

  dialog.setAttribute(
    "open",
    ""
  );
}

function closeDialog(
  dialog
) {
  if (!dialog) {
    return;
  }

  if (
    typeof dialog.close ===
    "function"
  ) {
    if (
      dialog.open
    ) {
      dialog.close();
    }

    return;
  }

  dialog.removeAttribute(
    "open"
  );
}

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

function getCurrentDayState() {
  if (
    !state.activeDay
  ) {
    return null;
  }

  return getDayState(
    state.activeDay,
    state.activeDate
  );
}

function hasExerciseOnActiveDay(
  exerciseId
) {
  const dayState =
    getCurrentDayState();

  if (!dayState) {
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
   WEEK NAVIGATION
===================================================== */

async function activateWeek(
  weekKey,
  {
    announce = false
  } = {}
) {
  const normalized =
    getWeekKey(
      weekKey
    );

  if (!normalized) {
    return false;
  }

  state.activeDay =
    null;

  state.activeDate =
    null;

  state.expandedExerciseIndex =
    null;

  state.activeWeekKey =
    normalized;

  try {
    const result =
      setControllerWeek(
        normalized
      );

    if (
      result &&
      typeof result.then ===
        "function"
    ) {
      await result;
    }

    if (
      typeof WorkoutPlanController.loadWeek === "function"
    ) {
      await WorkoutPlanController
        .loadWeek(
          normalized
        );
    }

    renderAll();

    if (
      announce
    ) {
      showToast(
        formatWeekRange(
          normalized
        )
      );
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans could not switch weeks.",
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
  }
}

function goToPreviousWeek() {
  void activateWeek(
    shiftWeekKey(
      state.activeWeekKey,
      -1
    )
  );
}

function goToNextWeek() {
  void activateWeek(
    shiftWeekKey(
      state.activeWeekKey,
      1
    )
  );
}

function goToCurrentWeek() {
  void activateWeek(
    getWeekKey(
      new Date()
    ),
    {
      announce:
        true
    }
  );
}

function jumpToCalendarDate(
  value
) {
  const date =
    formatDateKey(
      value
    );

  if (!date) {
    return false;
  }

  void activateWeek(
    getWeekKey(
      date
    )
  );

  return true;
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
    "custom",
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

    button.classList.toggle(
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

    panel.classList.toggle(
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
    "custom"
  ) {
    renderCustomBuilder();
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
    placeholder = null,
    valueKey = "id",
    labelKey = "label"
  } = {}
) {
  if (!select) {
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
      FitnessGoals?.all
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
    dom.workoutPrimaryGoal,
    goals,
    {
      placeholder:
        "Choose a goal"
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
        .filter(Boolean)
    )
  ]
    .sort(
      (a, b) =>
        a.localeCompare(b)
    )
    .map(
      id => ({
        id,
        label:
          titleFromId(id)
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
   OVERVIEW
===================================================== */

function renderWeekNavigation() {
  if (
    dom.workoutWeekDateRange
  ) {
    dom.workoutWeekDateRange.textContent =
      formatWeekRange(
        state.activeWeekKey
      );
  }

  if (
    dom.workoutCurrentWeekButton
  ) {
    dom.workoutCurrentWeekButton.disabled =
      isCurrentWeek();
  }

  if (
    dom.workoutCalendarInput
  ) {
    dom.workoutCalendarInput.value =
      state.activeWeekKey;
  }
}

function renderOverview() {
  const plan =
    getPlanForActiveWeek();

  const summary =
    getWeekSummaryForActiveWeek();

  if (
    dom.workoutPlanName &&
    document.activeElement !==
      dom.workoutPlanName
  ) {
    dom.workoutPlanName.value =
      plan?.name ||
      "My Weekly Plan";
  }

  if (
    dom.workoutDaysCount
  ) {
    dom.workoutDaysCount.textContent =
      String(
        summary
          ?.trainingDayCount ||
        0
      );
  }

  if (
    dom.workoutOffDaysCount
  ) {
    dom.workoutOffDaysCount.textContent =
      String(
        summary
          ?.offDayCount ||
        0
      );
  }

  if (
    dom.workoutExerciseCount
  ) {
    dom.workoutExerciseCount.textContent =
      String(
        summary
          ?.exerciseCount ||
        0
      );
  }

  if (
    dom.workoutPlanGoalSummary
  ) {
    if (
      plan?.primaryGoalId
    ) {
      const secondary =
        (
          plan.secondaryGoalIds ||
          []
        )
          .map(
            getGoalLabel
          )
          .filter(Boolean);

      dom.workoutPlanGoalSummary.textContent =
        secondary.length
          ? `${getGoalLabel(
              plan.primaryGoalId
            )} \u00B7 ${secondary.join(
              " \u00B7 "
            )}`
          : getGoalLabel(
              plan.primaryGoalId
            );
    } else {
      dom.workoutPlanGoalSummary.textContent =
        "Choose a fitness goal to personalize this week.";
    }
  }

  renderWeekNavigation();
}


/* =====================================================
   WEEK
===================================================== */

function getDaySummary(
  dayState
) {
  if (!dayState) {
    return "No workout planned";
  }

  if (
    dayState.type ===
    "off"
  ) {
    return "No workout planned";
  }

  if (
    dayState.type ===
    "recovery"
  ) {
    return (
      dayState.exercises
        ?.length
        ? `${dayState.exercises.length} recovery activit${
            dayState.exercises.length ===
            1
              ? "y"
              : "ies"
          }`
        : "Recovery day"
    );
  }

  const count =
    dayState.exercises
      ?.length ||
    0;

  if (
    count ===
    0
  ) {
    return "Workout needs exercises";
  }

  return `${count} exercise${
    count === 1
      ? ""
      : "s"
  }`;
}

function decorateDayCardDate(
  fragment,
  dateKey
) {
  const existingDate =
    fragment.querySelector(
      ".workout-day-card__date"
    );

  if (
    existingDate
  ) {
    existingDate.textContent =
      formatShortDate(
        dateKey
      );

    return;
  }

  const identity =
    fragment.querySelector(
      ".workout-day-card__identity"
    ) ||
    fragment.querySelector(
      ".workout-day-card__button"
    );

  if (!identity) {
    return;
  }

  const date =
    document.createElement(
      "span"
    );

  date.className =
    "workout-day-card__date";

  date.textContent =
    formatShortDate(
      dateKey
    );

  identity.appendChild(
    date
  );
}

function renderWeek() {
  if (
    !dom.workoutWeekGrid
  ) {
    return;
  }

  dom.workoutWeekGrid.innerHTML =
    "";

  const week =
    getWeekForActiveWeek();

  for (
    const day
    of DAYS
  ) {
    const dateKey =
      getDateForDay(
        state.activeWeekKey,
        day
      );

    const dayState =
      week?.[
        day
      ] ||
      getDayState(
        day,
        dateKey
      ) ||
      {
        day,
        date:
          dateKey,
        label:
          DAY_LABELS[
            day
          ],
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

    if (!fragment) {
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

    button.dataset.day =
      day;

    button.dataset.date =
      dateKey;

    if (
      dayLabel
    ) {
      dayLabel.textContent =
        dayState.label ||
        DAY_LABELS[
          day
        ];
    }

    decorateDayCardDate(
      fragment,
      dateKey
    );

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
      title.textContent =
        dayState.title ||
        (
          dayState.type ===
            "off"
            ? "Off Day"
            : "Planned Workout"
        );
    }

    if (
      summary
    ) {
      summary.textContent =
        getDaySummary(
          dayState
        );
    }

    card.dataset.type =
      dayState.type ||
      "off";

    dom.workoutWeekGrid
      .appendChild(
        fragment
      );
  }
}


/* =====================================================
   CUSTOM BUILDER
===================================================== */

function renderSecondaryGoals() {
  if (
    !dom.workoutSecondaryGoals
  ) {
    return;
  }

  const plan =
    getPlanForActiveWeek();

  const selected =
    new Set(
      plan?.secondaryGoalIds ||
      []
    );

  dom.workoutSecondaryGoals.innerHTML =
    "";

  for (
    const goal
    of FitnessGoals.all ||
    []
  ) {
    if (
      goal.id ===
      plan?.primaryGoalId
    ) {
      continue;
    }

    const label =
      document.createElement(
        "label"
      );

    label.className =
      "workout-choice";

    const input =
      document.createElement(
        "input"
      );

    input.type =
      "checkbox";

    input.value =
      goal.id;

    input.checked =
      selected.has(
        goal.id
      );

    input.dataset.workoutAction =
      "secondary-goal";

    const span =
      document.createElement(
        "span"
      );

    span.textContent =
      goal.label;

    label.append(
      input,
      span
    );

    dom.workoutSecondaryGoals
      .appendChild(
        label
      );
  }
}

function renderCustomBuilder() {
  const plan =
    getPlanForActiveWeek();

  if (
    dom.workoutPrimaryGoal
  ) {
    dom.workoutPrimaryGoal.value =
      plan?.primaryGoalId ||
      "";
  }

  renderSecondaryGoals();

  if (
    !dom.workoutCustomWeek
  ) {
    return;
  }

  dom.workoutCustomWeek.innerHTML =
    "";

  for (
    const day
    of DAYS
  ) {
    const dateKey =
      getDateForDay(
        state.activeWeekKey,
        day
      );

    const dayState =
      getDayState(
        day,
        dateKey
      );

    const row =
      document.createElement(
        "article"
      );

    row.className =
      "workout-custom-day";

    row.dataset.day =
      day;

    row.dataset.date =
      dateKey;

    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "workout-custom-day__identity";

    const dayName =
      document.createElement(
        "strong"
      );

    dayName.textContent =
      `${DAY_LABELS[day]} \u00B7 ${formatShortDate(dateKey)}`;

    const current =
      document.createElement(
        "span"
      );

    current.textContent =
      dayState?.title ||
      "Off Day";

    heading.append(
      dayName,
      current
    );

    const select =
      document.createElement(
        "select"
      );

    select.dataset.workoutAction =
      "custom-day-focus";

    select.dataset.day =
      day;

    select.dataset.date =
      dateKey;

    for (
      const focus
      of WorkoutFocuses.all ||
      []
    ) {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        focus.id;

      option.textContent =
        focus.label;

      select.appendChild(
        option
      );
    }

    select.value =
      dayState?.focusId ||
      "off_day";

    const edit =
      document.createElement(
        "button"
      );

    edit.type =
      "button";

    edit.dataset.workoutAction =
      "edit-day";

    edit.dataset.day =
      day;

    edit.dataset.date =
      dateKey;

    edit.textContent =
      dayState?.type ===
        "off"
        ? "Plan"
        : "Edit";

    row.append(
      heading,
      select,
      edit
    );

    dom.workoutCustomWeek
      .appendChild(
        row
      );
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

  dom.workoutTemplateList.innerHTML =
    "";

  if (
    dom.workoutTemplateEmpty
  ) {
    dom.workoutTemplateEmpty.hidden =
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

    if (!fragment) {
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
      card.dataset.templateId =
        template.id;
    }

    if (
      eyebrow
    ) {
      eyebrow.textContent =
        `${titleFromId(
          template.level
        )} \u00B7 ${template.trainingDaysPerWeek} DAYS/WEEK`;
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
      apply.dataset.templateId =
        template.id;

      apply.textContent =
        `Use for ${formatShortDate(
          state.activeWeekKey
        )} Week`;
    }

    dom.workoutTemplateList
      .appendChild(
        fragment
      );
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
      "ARI Workout Plans library search failed. Falling back to registry search.",
      error
    );
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
    addEnabled = false,
    container
  } = {}
) {
  const fragment =
    dom.exerciseCardTemplate
      ?.content
      ?.cloneNode(
        true
      );

  if (!fragment) {
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
    card.dataset.exerciseId =
      exercise.id;
  }

  if (
    open
  ) {
    open.dataset.exerciseId =
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
    exercise.illustration
      ?.anatomy ||
    exercise.illustration
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

    add.dataset.exerciseId =
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

  dom.exerciseLibraryList.innerHTML =
    "";

  if (
    dom.exerciseLibraryEmpty
  ) {
    dom.exerciseLibraryEmpty.hidden =
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
   TRAINING FOCUS FILTERING
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

  if (
    rules.length
  ) {
    return rules.some(
      Boolean
    );
  }

  return false;
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
    recommended =
      extractExerciseResults(
        WorkoutPlanController
          .getRecommendedExercisesForDay(
            state.activeDate ||
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
    focusedRecommendations.length
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
    const response =
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
        );

    searchResults =
      extractExerciseResults(
        response
      );
  } catch (
    error
  ) {
    console.warn(
      "ARI Workout Plans picker search failed. Using local search fallback.",
      error
    );
  }

  if (
    searchResults.length >
    0
  ) {
    const searchIds =
      new Set(
        searchResults.map(
          exercise =>
            exercise.id
        )
      );

    return exercises.filter(
      exercise =>
        searchIds.has(
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
  date =
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

  const resolvedDate =
    formatDateKey(
      date
    ) ||
    getDateForDay(
      state.activeWeekKey,
      normalizedDay
    );

  const dayState =
    getDayState(
      normalizedDay,
      resolvedDate
    );

  if (
    !dayState
  ) {
    return;
  }

  state.activeDay =
    normalizedDay;

  state.activeDate =
    resolvedDate;

  state.expandedExerciseIndex =
    null;

  if (
    dom.workoutDayEditorTitle
  ) {
    dom.workoutDayEditorTitle.textContent =
      `${DAY_LABELS[normalizedDay]} \u00B7 ${formatLongDate(resolvedDate)}`;
  }

  if (
    dom.workoutDayType
  ) {
    dom.workoutDayType.value =
      dayState.type ||
      "off";
  }

  if (
    dom.workoutDayFocus
  ) {
    dom.workoutDayFocus.value =
      dayState.focusId ||
      "off_day";
  }

  if (
    dom.workoutDayTitle
  ) {
    dom.workoutDayTitle.value =
      dayState.title ||
      "";
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
    dom.workoutDayTitle
  ) {
    dom.workoutDayTitle.disabled =
      false;
  }

  if (
    dom.workoutDayExerciseSection
  ) {
    dom.workoutDayExerciseSection.hidden =
      off;
  }
}

function makeMetricInput({
  label,
  field,
  value = "",
  min = 0,
  max = null,
  step = 1,
  inputMode = "decimal"
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
    String(min);

  if (
    max !== null
  ) {
    input.max =
      String(max);
  }

  input.step =
    String(step);

  input.value =
    value ??
    "";

  input.dataset.exerciseField =
    field;

  wrapper.append(
    span,
    input
  );

  return wrapper;
}

function getExercisePrescriptionSummary(
  exercise,
  entry
) {
  const parts =
    [];

  if (
    Number(
      entry.sets
    ) >
      0 &&
    Number(
      entry.reps
    ) >
      0
  ) {
    parts.push(
      `${entry.sets} sets \u00D7 ${entry.reps} reps`
    );
  } else if (
    Number(
      entry.sets
    ) >
      0
  ) {
    parts.push(
      `${entry.sets} sets`
    );
  } else if (
    Number(
      entry.reps
    ) >
      0
  ) {
    parts.push(
      `${entry.reps} reps`
    );
  }

  if (
    Number(
      entry.weight
    ) >
    0
  ) {
    parts.push(
      `${entry.weight} lb`
    );
  }

  if (
    Number(
      entry.addedWeight ??
      entry.added_weight
    ) >
    0
  ) {
    parts.push(
      `${entry.addedWeight ?? entry.added_weight} lb`
    );
  }

  if (
    Number(
      entry.durationMinutes
    ) >
    0
  ) {
    parts.push(
      `${entry.durationMinutes} min`
    );
  }

  if (
    Number(
      entry.durationSeconds
    ) >
    0
  ) {
    parts.push(
      `${entry.durationSeconds} sec`
    );
  }

  if (
    Number(
      entry.rounds
    ) >
    0
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
        "Tap to set workout details"
      );
}

function renderDayExercises() {
  if (
    !state.activeDay ||
    !state.activeDate ||
    !dom.workoutDayExerciseList
  ) {
    return;
  }

  const dayState =
    getCurrentDayState();

  const entries =
    dayState?.exercises ||
    [];

  dom.workoutDayExerciseList.innerHTML =
    "";

  if (
    dom.workoutDayExerciseEmpty
  ) {
    dom.workoutDayExerciseEmpty.hidden =
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

      row.dataset.exerciseIndex =
        String(index);

      row.dataset.exerciseId =
        exercise.id;

      row.dataset.expanded =
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

      summary.dataset.workoutAction =
        "toggle-exercise-row";

      summary.dataset.exerciseIndex =
        String(index);

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
        "\u25BC";

      summary.append(
        copy,
        chevron
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
        exercise.logging
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
        const useAddedWeight =
          !fields.includes(
            "weight"
          ) &&
          fields.includes(
            "added_weight"
          );

        metrics.appendChild(
          makeMetricInput({
            label:
              "Weight",

            field:
              useAddedWeight
                ? "addedWeight"
                : "weight",

            value:
              useAddedWeight
                ? (
                    entry.addedWeight ??
                    entry.added_weight ??
                    ""
                  )
                : (
                    entry.weight ??
                    ""
                  ),

            min:
              0,

            step:
              0.5
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

      if (
        fields.includes(
          "rest_seconds"
        )
      ) {
        metrics.appendChild(
          makeMetricInput({
            label:
              "Rest sec",

            field:
              "restSeconds",

            value:
              entry.restSeconds ??
              "",

            min:
              0,

            max:
              3600,

            step:
              1,

            inputMode:
              "numeric"
          })
        );
      }

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

      detail.dataset.workoutAction =
        "open-exercise-detail";

      detail.dataset.exerciseId =
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

      remove.dataset.workoutAction =
        "remove-exercise";

      remove.dataset.exerciseIndex =
        String(index);

      remove.textContent =
        "Remove";

      actions.append(
        detail,
        remove
      );

      body.append(
        metrics,
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
    !state.activeDay ||
    !state.activeDate
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
    return;
  }

  state.pickerQuery =
    "";

  if (
    dom.workoutExercisePickerSearch
  ) {
    dom.workoutExercisePickerSearch.value =
      "";
  }

  renderExercisePicker();

  openDialog(
    dom.workoutExercisePicker
  );
}

function renderExercisePicker() {
  if (
    !state.activeDay ||
    !state.activeDate ||
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
    dom.workoutExercisePickerList.innerHTML =
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
      dayState.title ||
      DAY_LABELS[
        state.activeDay
      ] ||
      "this workout";

    dom.workoutExercisePickerContext.textContent =
      focus?.id ===
        "custom"
        ? (
            `Custom focus \u00B7 ` +
            `${formatShortDate(state.activeDate)} \u00B7 ` +
            "Browse all approved exercises."
          )
        : (
            `Showing exercises for ${focusLabel} ` +
            `on ${formatShortDate(state.activeDate)}.`
          );
  }

  dom.workoutExercisePickerList.innerHTML =
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
        ? "No exercises in this training focus match your search."
        : "No approved exercises are currently mapped to this training focus.";

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
    addMode = false
  } = {}
) {
  const exercise =
    ExerciseRegistry.get(
      exerciseId
    );

  if (!exercise) {
    return;
  }

  state.activeExerciseId =
    exercise.id;

  state.detailAddMode =
    Boolean(
      addMode &&
      state.activeDay &&
      state.activeDate
    );

  if (
    dom.exerciseDetailType
  ) {
    dom.exerciseDetailType.textContent =
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
            titleFromId(id)
        )
        .join(
          " \u00B7 "
        ) ||
      "EXERCISE";
  }

  if (
    dom.exerciseDetailName
  ) {
    dom.exerciseDetailName.textContent =
      exercise.name;
  }

  const anatomyPath =
    exercise.illustration
      ?.anatomy ||
    null;

  const movementPath =
    exercise.illustration
      ?.movement ||
    null;

  if (
    dom.exerciseAnatomyFigure &&
    dom.exerciseAnatomyImage
  ) {
    dom.exerciseAnatomyFigure.hidden =
      !anatomyPath;

    if (
      anatomyPath
    ) {
      dom.exerciseAnatomyImage.src =
        anatomyPath;

      dom.exerciseAnatomyImage.alt =
        `${exercise.name} muscle illustration`;
    }
  }

  if (
    dom.exerciseMovementFigure &&
    dom.exerciseMovementImage
  ) {
    dom.exerciseMovementFigure.hidden =
      !movementPath;

    if (
      movementPath
    ) {
      dom.exerciseMovementImage.src =
        movementPath;

      dom.exerciseMovementImage.alt =
        `${exercise.name} movement illustration`;
    }
  }

  if (
    dom.exerciseVisualPlaceholder
  ) {
    dom.exerciseVisualPlaceholder.hidden =
      Boolean(
        anatomyPath ||
        movementPath
      );
  }

  if (
    dom.exerciseInstructionList
  ) {
    dom.exerciseInstructionList.innerHTML =
      "";

    const instructions =
      exercise.instructions?.length
        ? exercise.instructions
        : [
            exercise.summary
          ].filter(Boolean);

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
    dom.exerciseMuscleList.innerHTML =
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

    dom.exerciseMuscleList.append(
      primary,
      secondary
    );
  }

  if (
    dom.exerciseMovementSummary
  ) {
    dom.exerciseMovementSummary.textContent =
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
    dom.exerciseFormCueList.innerHTML =
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

    dom.exerciseCaloriesSection.hidden =
      !estimable;

    if (
      estimable &&
      dom.exerciseCaloriesEstimate
    ) {
      dom.exerciseCaloriesEstimate.textContent =
        (
          exercise.exerciseTypes
            ?.includes(
              "strength"
            ) ||
          exercise.exerciseTypes
            ?.includes(
              "hypertrophy"
            )
        )
          ? "Calories are estimated from the full strength-training session using duration, body weight, and intensity."
          : "Calories can be estimated from body weight, duration, activity, and intensity when this exercise is logged.";
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

    dom.exerciseDetailAddButton.hidden =
      !state.detailAddMode;

    dom.exerciseDetailAddButton.disabled =
      Boolean(
        alreadyAdded
      );

    if (
      state.detailAddMode
    ) {
      dom.exerciseDetailAddButton.textContent =
        alreadyAdded
          ? "Already Added"
          : "Add Exercise";
    }
  }

  openDialog(
    dom.exerciseDetailDialog
  );
}


/* =====================================================
   PLAN MUTATION HELPERS
===================================================== */

function getDayMutationKey() {
  return (
    state.activeDate ||
    state.activeDay
  );
}

function detachDayFromTemplateMetadata() {
  if (
    typeof WorkoutPlanController.detachDayFromTemplate === "function"
  ) {
    try {
      WorkoutPlanController
        .detachDayFromTemplate(
          getDayMutationKey()
        );

      return;
    } catch {
      // Non-critical.
    }
  }

  if (
    typeof WorkoutPlanController.markDayCustomized === "function"
  ) {
    try {
      WorkoutPlanController
        .markDayCustomized(
          getDayMutationKey()
        );
    } catch {
      // Non-critical.
    }
  }
}

function addExerciseToActiveDay(
  exerciseId
) {
  if (
    !state.activeDay ||
    !state.activeDate
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
      `${exercise.name} does not match the selected Training Focus.`,
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
    exercise.logging
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

  detachDayFromTemplateMetadata();

  const added =
    WorkoutPlanController
      .addExercise(
        getDayMutationKey(),
        exercise.id,
        defaults
      );

  if (
    !added
  ) {
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
      ) -
      1,
      0
    );

  closeDialog(
    dom.workoutExercisePicker
  );

  renderOverview();
  renderWeek();
  renderDayExercises();

  scheduleAutosave();

  showToast(
    `${exercise.name} added to ${formatShortDate(state.activeDate)}.`
  );

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

  return true;
}

function updateDayFromEditor() {
  if (
    !state.activeDay ||
    !state.activeDate
  ) {
    return;
  }

  detachDayFromTemplateMetadata();

  const key =
    getDayMutationKey();

  const type =
    dom.workoutDayType
      ?.value ||
    "off";

  if (
    type ===
    "off"
  ) {
    WorkoutPlanController
      .setDayFocus(
        key,
        "off_day"
      );
  } else {
    WorkoutPlanController
      .setDayType(
        key,
        type
      );

    const focusId =
      dom.workoutDayFocus
        ?.value;

    if (
      focusId
    ) {
      WorkoutPlanController
        .setDayFocus(
          key,
          focusId
        );

      if (
        type ===
        "recovery"
      ) {
        WorkoutPlanController
          .setDayType(
            key,
            "recovery"
          );
      }
    }
  }

  const title =
    dom.workoutDayTitle
      ?.value;

  if (
    normalizeText(
      title
    )
  ) {
    WorkoutPlanController
      .setDayTitle(
        key,
        title
      );
  }

  updateDayEditorVisibility();
  renderAll();
  renderDayExercises();
  scheduleAutosave();
}


/* =====================================================
   WEEK ACTIONS
===================================================== */

async function repeatLastWeek() {
  const previousWeekKey =
    shiftWeekKey(
      state.activeWeekKey,
      -1
    );

  const confirmed =
    window.confirm(
      `Copy ${formatWeekRange(previousWeekKey)} into ${formatWeekRange(state.activeWeekKey)}? This will replace the selected week.`
    );

  if (
    !confirmed
  ) {
    return false;
  }

  try {
    const result =
      repeatPreviousWeekController(
        state.activeWeekKey
      );

    const success =
      result &&
      typeof result.then ===
        "function"
        ? await result
        : result;

    if (
      !success
    ) {
      showToast(
        "Last week could not be copied.",
        {
          error:
            true
        }
      );

      return false;
    }

    await saveNow();

    renderAll();

    showToast(
      "Last week's schedule was copied into this week."
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans repeat-last-week failed.",
      error
    );

    showToast(
      "Last week could not be copied.",
      {
        error:
          true
      }
    );

    return false;
  }
}

async function clearActiveWeek() {
  const confirmed =
    window.confirm(
      `Clear every planned workout from ${formatWeekRange(state.activeWeekKey)}? The week will become Off Days.`
    );

  if (
    !confirmed
  ) {
    return false;
  }

  try {
    const result =
      clearWeekController(
        state.activeWeekKey
      );

    const success =
      result &&
      typeof result.then ===
        "function"
        ? await result
        : result;

    if (
      !success
    ) {
      showToast(
        "This week could not be cleared.",
        {
          error:
            true
        }
      );

      return false;
    }

    await saveNow();

    renderAll();

    showToast(
      "Workout week cleared."
    );

    return true;
  } catch (
    error
  ) {
    console.error(
      "ARI Workout Plans clear-week failed.",
      error
    );

    showToast(
      "This week could not be cleared.",
      {
        error:
          true
      }
    );

    return false;
  }
}


/* =====================================================
   SAVE / AUTOSAVE
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
                true,

              weekKey:
                state.activeWeekKey
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
  announce = true
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
    dom.workoutPlansSaveButton.disabled =
      true;

    dom.workoutPlansSaveButton.textContent =
      "Saving...";
  }

  try {
    const success =
      await WorkoutPlanController
        .save({
          remote:
            true,

          weekKey:
            state.activeWeekKey
        });

    if (
      announce
    ) {
      showToast(
        success
          ? "Workout week saved."
          : "Saved on this device. Cloud save is unavailable."
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
      "Workout week could not be saved.",
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
      dom.workoutPlansSaveButton.disabled =
        false;

      dom.workoutPlansSaveButton.textContent =
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
          true,

        weekKey:
          state.activeWeekKey
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
    dom.workoutDayDoneButton.disabled =
      true;

    dom.workoutDayDoneButton.textContent =
      "Saving...";
  }

  const success =
    await saveNow();

  if (
    dom.workoutDayDoneButton
  ) {
    dom.workoutDayDoneButton.disabled =
      false;

    dom.workoutDayDoneButton.textContent =
      "Save Exercises / Exit";
  }

  closeDialog(
    dom.workoutDayEditor
  );

  state.expandedExerciseIndex =
    null;

  state.activeDay =
    null;

  state.activeDate =
    null;

  setActiveTab(
    "week"
  );

  renderAll();

  showToast(
    success
      ? "Workout day saved."
      : "Saved on this device. Cloud sync is unavailable."
  );
}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {
  renderOverview();
  renderWeek();

  if (
    state.activeTab ===
    "templates"
  ) {
    renderTemplates();
  }

  if (
    state.activeTab ===
    "custom"
  ) {
    renderCustomBuilder();
  }

  if (
    state.activeTab ===
    "library"
  ) {
    renderExerciseLibrary();
  }
}


/* =====================================================
   EVENTS
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
      tab.dataset.workoutTab
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

    case "open-exercise-picker":
      openExercisePicker();
      break;

    case "close-exercise-picker":
      closeDialog(
        dom.workoutExercisePicker
      );
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
      closeDialog(
        dom.exerciseDetailDialog
      );
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

        closeDialog(
          dom.exerciseDetailDialog
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
        state.activeDate &&
        Number.isInteger(
          index
        )
      ) {
        detachDayFromTemplateMetadata();

        WorkoutPlanController
          .removeExercise(
            getDayMutationKey(),
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

        renderAll();
        renderDayExercises();
        scheduleAutosave();
      }

      break;
    }

    case "apply-template": {
      const templateId =
        actionNode.dataset
          .templateId;

      const template =
        WorkoutPlanController
          .getTemplates()
          .find(
            item =>
              item.id ===
              templateId
          );

      if (
        template &&
        window.confirm(
          `Use "${template.name}" for ${formatWeekRange(state.activeWeekKey)}? This replaces only that calendar week. You can edit every day afterward.`
        )
      ) {
        try {
          const result =
            WorkoutPlanController
              .applyTemplate(
                templateId,
                {
                  weekKey:
                    state.activeWeekKey,

                  detachAfterCopy:
                    true
                }
              );

          Promise
            .resolve(
              result
            )
            .then(
              async applied => {
                if (
                  !applied
                ) {
                  showToast(
                    "Template could not be applied.",
                    {
                      error:
                        true
                    }
                  );

                  return;
                }

                await saveNow();

                renderAll();

                showToast(
                  `${template.name} copied into this week. You can edit it freely.`
                );

                setActiveTab(
                  "week"
                );
              }
            )
            .catch(
              error => {
                console.error(
                  "ARI Workout Plans template application failed.",
                  error
                );

                showToast(
                  "Template could not be applied.",
                  {
                    error:
                      true
                  }
                );
              }
            );
        } catch (
          error
        ) {
          console.error(
            "ARI Workout Plans template application failed.",
            error
          );

          showToast(
            "Template could not be applied.",
            {
              error:
                true
            }
          );
        }
      }

      break;
    }

    case "repeat-last-week":
      void repeatLastWeek();
      break;

    case "clear-week":
      void clearActiveWeek();
      break;

    case "previous-week":
      goToPreviousWeek();
      break;

    case "current-week":
      goToCurrentWeek();
      break;

    case "next-week":
      goToNextWeek();
      break;

    default:
      break;
  }
}

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
    dom.workoutCalendarInput
  ) {
    if (
      target.value
    ) {
      jumpToCalendarDate(
        target.value
      );
    }

    return;
  }

  if (
    target ===
    dom.workoutPrimaryGoal
  ) {
    if (
      target.value
    ) {
      WorkoutPlanController
        .setPrimaryGoal(
          target.value,
          {
            weekKey:
              state.activeWeekKey
          }
        );
    }

    renderAll();
    scheduleAutosave();

    return;
  }

  if (
    target.dataset
      ?.workoutAction ===
    "secondary-goal"
  ) {
    const selected =
      Array.from(
        dom.workoutSecondaryGoals
          ?.querySelectorAll(
            'input[data-workout-action="secondary-goal"]:checked'
          ) ||
        []
      )
        .map(
          input =>
            input.value
        )
        .filter(Boolean);

    WorkoutPlanController
      .setSecondaryGoals(
        selected,
        {
          weekKey:
            state.activeWeekKey
        }
      );

    renderOverview();
    scheduleAutosave();

    return;
  }

  if (
    target.dataset
      ?.workoutAction ===
    "custom-day-focus"
  ) {
    const day =
      normalizeLower(
        target.dataset.day
      );

    const date =
      formatDateKey(
        target.dataset.date
      ) ||
      getDateForDay(
        state.activeWeekKey,
        day
      );

    const focusId =
      target.value;

    if (
      day &&
      date &&
      focusId
    ) {
      state.activeDay =
        day;

      state.activeDate =
        date;

      detachDayFromTemplateMetadata();

      WorkoutPlanController
        .setDayFocus(
          date,
          focusId
        );

      state.activeDay =
        null;

      state.activeDate =
        null;

      renderAll();
      scheduleAutosave();
    }

    return;
  }

  if (
    target ===
      dom.workoutDayType ||
    target ===
      dom.workoutDayFocus
  ) {
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
      state.activeDate &&
      Number.isInteger(
        index
      )
    ) {
      detachDayFromTemplateMetadata();

      WorkoutPlanController
        .updateExercise(
          getDayMutationKey(),
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

      renderOverview();
      renderWeek();
      scheduleAutosave();
    }
  }
}

function handleInput(
  event
) {
  const target =
    event.target;

  if (
    target ===
    dom.workoutPlanName
  ) {
    const value =
      normalizeText(
        target.value
      );

    if (
      value
    ) {
      WorkoutPlanController
        .setPlanName(
          value,
          {
            weekKey:
              state.activeWeekKey
          }
        );

      scheduleAutosave();
    }

    return;
  }

  if (
    target ===
    dom.workoutDayTitle
  ) {
    if (
      state.activeDay &&
      state.activeDate &&
      normalizeText(
        target.value
      )
    ) {
      detachDayFromTemplateMetadata();

      WorkoutPlanController
        .setDayTitle(
          getDayMutationKey(),
          target.value
        );

      renderOverview();
      renderWeek();
      scheduleAutosave();
    }

    return;
  }

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
   DIRECT V3 CONTROL BINDINGS
===================================================== */

function bindDirectControl(
  element,
  action
) {
  if (
    !element ||
    element.dataset
      .workoutAction
  ) {
    return;
  }

  element.dataset.workoutAction =
    action;
}

function bindEvents() {
  bindDirectControl(
    dom.workoutPreviousWeekButton,
    "previous-week"
  );

  bindDirectControl(
    dom.workoutCurrentWeekButton,
    "current-week"
  );

  bindDirectControl(
    dom.workoutNextWeekButton,
    "next-week"
  );

  bindDirectControl(
    dom.workoutRepeatLastWeekButton,
    "repeat-last-week"
  );

  bindDirectControl(
    dom.workoutClearWeekButton,
    "clear-week"
  );

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

  dom.workoutCalendarButton
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof dom.workoutCalendarInput
            ?.showPicker ===
          "function"
        ) {
          dom.workoutCalendarInput
            .showPicker();

          return;
        }

        dom.workoutCalendarInput
          ?.focus();
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
          event.target ===
          dialog
        ) {
          closeDialog(
            dialog
          );
        }
      }
    );
  }
}


/* =====================================================
   DIAGNOSTICS
===================================================== */

function getPageDiagnostics() {
  const requiredForCorePage = [
    "workoutWeekGrid",
    "workoutDayCardTemplate"
  ];

  const missingCoreDom =
    requiredForCorePage
      .filter(
        id =>
          !dom[id]
      );

  const recommendedV3Dom = [
    "workoutWeekDateRange",
    "workoutPreviousWeekButton",
    "workoutCurrentWeekButton",
    "workoutNextWeekButton",
    "workoutCalendarInput",
    "workoutRepeatLastWeekButton",
    "workoutClearWeekButton"
  ];

  const missingRecommendedV3Dom =
    recommendedV3Dom
      .filter(
        id =>
          !dom[id]
      );

  const controllerDiagnostics =
    WorkoutPlanController
      .getDiagnostics?.() ||
    null;

  return {
    source:
      SOURCE,

    version:
      VERSION,

    activeTab:
      state.activeTab,

    activeWeekKey:
      state.activeWeekKey,

    activeDay:
      state.activeDay,

    activeDate:
      state.activeDate,

    registryExerciseCount:
      getAllRegistryExercises()
        .length,

    missingCoreDom,

    missingRecommendedV3Dom,

    controller:
      controllerDiagnostics
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
    "Loading your training calendar..."
  );

  try {
    populateFilters();

    await WorkoutPlanController
      .init();

    state.activeWeekKey =
      getWeekKey(
        getControllerActiveWeekKey()
      );

    await activateWeek(
      state.activeWeekKey
    );

    state.unsubscribeStore =
      WorkoutPlanController
        .subscribe(
          () => {
            renderOverview();
            renderWeek();

            if (
              state.activeDay &&
              state.activeDate &&
              dom.workoutDayEditor
                ?.open
            ) {
              renderDayExercises();
            }

            if (
              state.activeTab ===
              "custom"
            ) {
              renderCustomBuilder();
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
      WorkoutPlanController
        .getDiagnostics?.();

    if (
      diagnostics
        ?.validation
        ?.exercises &&
      diagnostics
        .validation
        .exercises
        .valid ===
        false
    ) {
      console.warn(
        "ARI Training exercise registry contains unresolved references.",
        diagnostics
          .validation
          .exercises
      );
    }

    const pageDiagnostics =
      getPageDiagnostics();

    if (
      pageDiagnostics
        .missingCoreDom
        .length
    ) {
      console.warn(
        "ARI Workout Plans is missing core HTML elements:",
        pageDiagnostics
          .missingCoreDom
      );
    }

    if (
      pageDiagnostics
        .missingRecommendedV3Dom
        .length
    ) {
      console.info(
        "ARI Workout Plans V3 optional calendar controls not found:",
        pageDiagnostics
          .missingRecommendedV3Dom
      );
    }

    globalThis.AriWorkoutPlansPage = {
      version:
        VERSION,

      source:
        SOURCE,

      controller:
        WorkoutPlanController,

      getActiveWeekKey:
        () =>
          state.activeWeekKey,

      setWeek:
        activateWeek,

      previousWeek:
        goToPreviousWeek,

      currentWeek:
        goToCurrentWeek,

      nextWeek:
        goToNextWeek,

      repeatLastWeek,

      clearWeek:
        clearActiveWeek,

      refresh:
        renderAll,

      save:
        savePlan,

      diagnostics:
        getPageDiagnostics
    };

    console.info(
      `[ARI Workout Plans] Date-specific runtime initialized. Version ${VERSION}.`
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
