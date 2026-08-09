// =====================================================
// ARI REBIRTH
// File: js/workout-plans.js
// Version: 2.2.0
// Purpose:
//   Page controller for workout-plans.html.
//
// V2.2.0:
//   - Fixes structured exercise-search response handling.
//   - Supports both exercise arrays and { results: [] } responses.
//   - Restores Exercise Library search results.
//   - Restores focused Exercise Picker search results.
//   - Adds aliases to local search fallback.
//   - Improves abductor/adductor and equipment-name discovery.
//   - Preserves focus-aware exercise filtering.
//
// V2.1.0:
//   - Completes DOM caching for all elements referenced by this file.
//   - Restores Custom Builder tab support.
//   - Adds safer rendering when optional HTML sections are absent.
//   - Normalizes Workout Focus schemas (bodyParts + primaryBodyParts).
//   - Removes the practical 500-exercise recommendation ceiling.
//   - Prevents accidental duplicate exercises within the same workout day.
//   - Improves focused exercise pool fallback behavior.
//   - Improves large-library search/filter behavior.
//   - Adds safer autosave sequencing.
//   - Adds initialization diagnostics.
//   - Uses ASCII / Unicode escapes for UI separators to avoid mojibake.
//   - Keeps Workout Plans separate from live workout execution.
//
// Responsibilities:
//   - My Week rendering and day editing.
//   - Suggested workout templates.
//   - Optional custom goal + weekly-focus builder.
//   - Exercise Library search/filtering.
//   - Training-focus-aware exercise picker.
//   - Exercise detail/instruction/illustration view.
//   - Local + Supabase workout-plan persistence.
// =====================================================

import WorkoutPlanController from "./training/workout-plan-controller.js";
import ExerciseRegistry from "./training/exercises/exercise-registry.js";
import WorkoutFocuses from "./training/workouts/workout-focuses.js";
import FitnessGoals from "./training/goals/fitness-goals.js";
import BodyParts from "./training/anatomy/body-parts.js";
import Muscles from "./training/anatomy/muscles.js";
import MovementPatterns from "./training/movements/movement-patterns.js";
import ExerciseTypes from "./training/movements/exercise-types.js";

const VERSION = "2.2.0";
const SOURCE = "js/workout-plans";

const DAYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
]);

const state = {
  activeTab: "week",
  activeDay: null,
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
   HELPERS
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
  return [...new Set(arrayOfIds(value))];
}

function intersects(left = [], right = []) {
  const rightSet = new Set(arrayOfIds(right));

  return arrayOfIds(left)
    .some(value => rightSet.has(value));
}

/*
 * Exercise-search compatibility helper.
 *
 * Supports both:
 *   [exercise, exercise]
 *
 * and:
 *   {
 *     results: [exercise, exercise]
 *   }
 */
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

function getAllRegistryExercises() {
  if (Array.isArray(ExerciseRegistry?.all)) {
    return [...ExerciseRegistry.all];
  }

  try {
    return extractExerciseResults(
      WorkoutPlanController.getExercises()
    );
  } catch {
    return [];
  }
}

/*
 * Shared local search fallback.
 *
 * This intentionally indexes aliases and metadata so
 * terms such as:
 *
 *   abductor
 *   hip abductor machine
 *   outer thigh machine
 *   adductor
 *   inner thigh machine
 *
 * remain discoverable even if the controller search
 * response is unavailable.
 */
function locallySearchExercises(
  exercises,
  query
) {
  const normalizedQuery =
    normalizeLower(query);

  if (!normalizedQuery) {
    return [...exercises];
  }

  const queryTokens =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

  return exercises
    .map(exercise => {
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
        ...Object.keys(exercise.goals || {})
      ];

      const searchable =
        searchablePieces
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      let score = 0;

      const normalizedName =
        normalizeLower(exercise.name);

      const normalizedId =
        normalizeLower(exercise.id);

      const aliases =
        (exercise.aliases || [])
          .map(normalizeLower);

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

      for (const token of queryTokens) {
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
    })
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

function showToast(
  message,
  {
    error = false,
    duration = 2200
  } = {}
) {
  if (!dom.workoutPlansToast) {
    return;
  }

  dom.workoutPlansToast.textContent = message;
  dom.workoutPlansToast.dataset.state =
    error ? "error" : "success";
  dom.workoutPlansToast.hidden = false;

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(
    () => {
      if (dom.workoutPlansToast) {
        dom.workoutPlansToast.hidden = true;
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
  if (!dom.workoutPlansStatus) {
    return;
  }

  dom.workoutPlansStatus.textContent = message || "";
  dom.workoutPlansStatus.hidden = Boolean(hide);
  dom.workoutPlansStatus.dataset.state =
    error ? "error" : "ready";
}

function openDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) {
      dialog.showModal();
    }
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    if (dialog.open) {
      dialog.close();
    }
    return;
  }

  dialog.removeAttribute("open");
}

function getMuscleLabel(muscleId) {
  return (
    Muscles.get(muscleId)?.commonName ||
    Muscles.get(muscleId)?.name ||
    titleFromId(muscleId)
  );
}

function getMovementLabel(movementId) {
  return (
    MovementPatterns.get(movementId)?.label ||
    titleFromId(movementId)
  );
}

function getGoalLabel(goalId) {
  return (
    FitnessGoals.get(goalId)?.label ||
    titleFromId(goalId)
  );
}

function getFocusBodyParts(focus) {
  return uniqueIds([
    ...(focus?.bodyParts || []),
    ...(focus?.primaryBodyParts || []),
    ...(focus?.secondaryBodyParts || [])
  ]);
}

function getFocusMuscles(focus) {
  return uniqueIds([
    ...(focus?.muscles || []),
    ...(focus?.primaryMuscles || []),
    ...(focus?.secondaryMuscles || [])
  ]);
}

function getFocusMovements(focus) {
  return uniqueIds(
    focus?.movementPatterns || []
  );
}

function getFocusExerciseTypes(focus) {
  return uniqueIds(
    focus?.exerciseTypes || []
  );
}

function getCurrentDayState() {
  if (!state.activeDay) {
    return null;
  }

  return WorkoutPlanController.getDay(
    state.activeDay
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
    dayState.exercises || []
  ).some(
    entry =>
      entry.exerciseId ===
      exerciseId
  );
}

/* =====================================================
   TABS
===================================================== */

function setActiveTab(tab) {
  const allowed = [
    "week",
    "templates",
    "custom",
    "library"
  ];

  if (!allowed.includes(tab)) {
    return false;
  }

  state.activeTab = tab;

  for (const button of dom.tabs || []) {
    const active =
      button.dataset.workoutTab ===
      tab;

    button.classList.toggle(
      "active",
      active
    );

    button.setAttribute(
      "aria-selected",
      active ? "true" : "false"
    );
  }

  for (const panel of dom.panels || []) {
    const active =
      panel.dataset.workoutPanel ===
      tab;

    panel.classList.toggle(
      "active",
      active
    );

    panel.hidden = !active;
  }

  if (tab === "templates") {
    renderTemplates();
  }

  if (tab === "custom") {
    renderCustomBuilder();
  }

  if (tab === "library") {
    renderExerciseLibrary();
  }

  if (tab === "week") {
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
  if (!select) return;

  const current =
    select.value;

  select.innerHTML = "";

  if (placeholder !== null) {
    const option =
      document.createElement(
        "option"
      );

    option.value = "";
    option.textContent =
      placeholder;

    select.appendChild(
      option
    );
  }

  for (const item of items || []) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      item?.[valueKey] ?? "";

    option.textContent =
      item?.[labelKey] ??
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
      selectableOnly: true
    }) || [],
    {
      placeholder:
        "All Body Parts"
    }
  );

  populateSelect(
    dom.exerciseMovementFilter,
    MovementPatterns.all || [],
    {
      placeholder:
        "All Movements"
    }
  );

  populateSelect(
    dom.exerciseTypeFilter,
    ExerciseTypes.all || [],
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
            exercise.equipment || []
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
  if (!dom.workoutDayFocus) {
    return;
  }

  populateSelect(
    dom.workoutDayFocus,
    WorkoutFocuses.all || [],
    {
      placeholder:
        "Choose focus"
    }
  );
}

/* =====================================================
   OVERVIEW
===================================================== */

function renderOverview() {
  const plan =
    WorkoutPlanController
      .getPlan();

  const summary =
    WorkoutPlanController
      .getSummary();

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
        summary?.trainingDayCount ||
        0
      );
  }

  if (
    dom.workoutOffDaysCount
  ) {
    dom.workoutOffDaysCount.textContent =
      String(
        summary?.offDayCount ||
        0
      );
  }

  if (
    dom.workoutExerciseCount
  ) {
    dom.workoutExerciseCount.textContent =
      String(
        summary?.exerciseCount ||
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
        "Choose a fitness goal to personalize your training.";
    }
  }
}

/* =====================================================
   WEEK
===================================================== */

function getDaySummary(
  dayState
) {
  if (!dayState) {
    return "";
  }

  if (
    dayState.type ===
    "off"
  ) {
    return "Recovery scheduled";
  }

  const count =
    dayState.exercises
      ?.length ||
    0;

  if (
    count === 0
  ) {
    return "No exercises selected";
  }

  return `${count} exercise${
    count === 1
      ? ""
      : "s"
  }`;
}

function renderWeek() {
  if (
    !dom.workoutWeekGrid
  ) {
    return;
  }

  dom.workoutWeekGrid.innerHTML =
    "";

  const plan =
    WorkoutPlanController
      .getPlan();

  if (!plan?.week) {
    return;
  }

  for (
    const day
    of DAYS
  ) {
    const dayState =
      WorkoutPlanController
        .getDay(day);

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

    button.dataset.day =
      day;

    if (dayLabel) {
      dayLabel.textContent =
        plan.week?.[day]?.label ||
        titleFromId(day);
    }

    if (type) {
      type.textContent =
        dayState?.type ===
        "off"
          ? "OFF"
          : dayState?.type ===
              "recovery"
            ? "RECOVERY"
            : "WORKOUT";
    }

    if (title) {
      title.textContent =
        dayState?.title ||
        "Off Day";
    }

    if (summary) {
      summary.textContent =
        getDaySummary(
          dayState
        );
    }

    card.dataset.type =
      dayState?.type ||
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
    WorkoutPlanController
      .getPlan();

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
    WorkoutPlanController
      .getPlan();

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
    const dayState =
      WorkoutPlanController
        .getDay(day);

    const row =
      document.createElement(
        "article"
      );

    row.className =
      "workout-custom-day";

    row.dataset.day =
      day;

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
      dayState?.label ||
      titleFromId(day);

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

    edit.textContent =
      "Edit";

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
      ) || [];

  dom.workoutTemplateList.innerHTML =
    "";

  if (
    dom.workoutTemplateEmpty
  ) {
    dom.workoutTemplateEmpty.hidden =
      templates.length > 0;
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

    if (card) {
      card.dataset.templateId =
        template.id;
    }

    if (eyebrow) {
      eyebrow.textContent =
        `${titleFromId(
          template.level
        )} \u00B7 ${template.trainingDaysPerWeek} DAYS/WEEK`;
    }

    if (name) {
      name.textContent =
        template.name;
    }

    if (description) {
      description.textContent =
        template.description;
    }

    if (meta) {
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

    if (apply) {
      apply.dataset.templateId =
        template.id;
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

  let results = [];

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
  } catch (error) {
    console.warn(
      "ARI Workout Plans library search failed. Falling back to registry search.",
      error
    );

    results = [];
  }

  /*
   * If controller search did not return usable data,
   * perform a complete local registry search.
   */
  if (
    query &&
    results.length === 0
  ) {
    results =
      locallySearchExercises(
        getAllRegistryExercises(),
        query
      );
  }

  /*
   * If there is no query and controller listing failed,
   * always fall back to the registry.
   */
  if (
    !query &&
    results.length === 0
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

  if (card) {
    card.dataset.exerciseId =
      exercise.id;
  }

  if (open) {
    open.dataset.exerciseId =
      exercise.id;
  }

  if (type) {
    type.textContent =
      titleFromId(
        exercise.category
      );
  }

  if (name) {
    name.textContent =
      exercise.name;
  }

  if (muscles) {
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

  if (image) {
    if (imagePath) {
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

  if (add) {
    add.hidden =
      !addEnabled;

    add.dataset.exerciseId =
      exercise.id;

    if (addEnabled) {
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
      results.length > 0;
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

  const rules = [];

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
  if (!dayState) {
    return [];
  }

  const focus =
    WorkoutFocuses.get(
      dayState.focusId
    );

  if (!focus) {
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

  let recommended = [];

  try {
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

  if (!normalizedQuery) {
    return exercises;
  }

  let searchResults = [];

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
  } catch (error) {
    console.warn(
      "ARI Workout Plans picker search failed. Using local search fallback.",
      error
    );

    searchResults =
      [];
  }

  if (
    searchResults.length > 0
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

  /*
   * Search only inside the focus-approved pool.
   */
  return locallySearchExercises(
    exercises,
    normalizedQuery
  );
}

/* =====================================================
   DAY EDITOR
===================================================== */

function openDayEditor(day) {
  const normalizedDay =
    normalizeLower(day);

  const dayState =
    WorkoutPlanController
      .getDay(
        normalizedDay
      );

  if (!dayState) {
    return;
  }

  state.activeDay =
    normalizedDay;

  state.expandedExerciseIndex =
    null;

  if (
    dom.workoutDayEditorTitle
  ) {
    dom.workoutDayEditorTitle.textContent =
      dayState.label ||
      titleFromId(
        normalizedDay
      );
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
    value ?? "";

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
  const parts = [];

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

  if (
    Number(
      entry.added_weight
    ) > 0
  ) {
    parts.push(
      `${entry.added_weight} lb`
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
        "Tap to set workout details"
      );
}

function renderDayExercises() {
  if (
    !state.activeDay ||
    !dom.workoutDayExerciseList
  ) {
    return;
  }

  const dayState =
    WorkoutPlanController
      .getDay(
        state.activeDay
      );

  const entries =
    dayState?.exercises ||
    [];

  dom.workoutDayExerciseList.innerHTML =
    "";

  if (
    dom.workoutDayExerciseEmpty
  ) {
    dom.workoutDayExerciseEmpty.hidden =
      entries.length > 0;
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

      if (!exercise) {
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
        metrics.appendChild(
          makeMetricInput({
            label:
              "Weight",
            field:
              fields.includes(
                "weight"
              )
                ? "weight"
                : "added_weight",
            value:
              entry.weight ??
              entry.added_weight ??
              "",
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
    !state.activeDay
  ) {
    return;
  }

  const dayState =
    WorkoutPlanController
      .getDay(
        state.activeDay
      );

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
    !dom.workoutExercisePickerList
  ) {
    return;
  }

  const dayState =
    WorkoutPlanController
      .getDay(
        state.activeDay
      );

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
      dayState.label ||
      "this workout";

    dom.workoutExercisePickerContext.textContent =
      focus?.id ===
      "custom"
        ? "Custom focus \u00B7 Browse all approved exercises."
        : `Showing exercises for ${focusLabel}.`;
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
      state.activeDay
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

    dom.exerciseMuscleList
      .append(
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
        exercise.exerciseTypes
          ?.includes(
            "strength"
          ) ||
        exercise.exerciseTypes
          ?.includes(
            "hypertrophy"
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
   ADD / UPDATE EXERCISES
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

  if (!exercise) {
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
    WorkoutPlanController
      .getDay(
        state.activeDay
      );

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

  const added =
    WorkoutPlanController
      .addExercise(
        state.activeDay,
        exercise.id,
        defaults
      );

  if (!added) {
    return false;
  }

  const updatedDay =
    WorkoutPlanController
      .getDay(
        state.activeDay
      );

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
    `${exercise.name} added.`
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
    WorkoutPlanController
      .setDayFocus(
        state.activeDay,
        "off_day"
      );
  } else {
    WorkoutPlanController
      .setDayType(
        state.activeDay,
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
          state.activeDay,
          focusId
        );

      if (
        type ===
        "recovery"
      ) {
        WorkoutPlanController
          .setDayType(
            state.activeDay,
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
        state.activeDay,
        title
      );
  }

  updateDayEditorVisibility();
  renderAll();
  renderDayExercises();
  scheduleAutosave();
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
            true
        });

    if (
      announce
    ) {
      showToast(
        success
          ? "Workout plan saved."
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

  if (tab) {
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
          ?.day
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
        Number.isInteger(
          index
        )
      ) {
        WorkoutPlanController
          .removeExercise(
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
          `Use "${template.name}"? This will replace your current weekly plan.`
        )
      ) {
        WorkoutPlanController
          .applyTemplate(
            templateId
          );

        renderAll();
        scheduleAutosave();

        showToast(
          `${template.name} applied.`
        );

        setActiveTab(
          "week"
        );
      }

      break;
    }

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
    dom.workoutPrimaryGoal
  ) {
    if (
      target.value
    ) {
      WorkoutPlanController
        .setPrimaryGoal(
          target.value
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
        .filter(
          Boolean
        );

    WorkoutPlanController
      .setSecondaryGoals(
        selected
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

    const focusId =
      target.value;

    if (
      day &&
      focusId
    ) {
      WorkoutPlanController
        .setDayFocus(
          day,
          focusId
        );

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
      Number.isInteger(
        index
      )
    ) {
      WorkoutPlanController
        .updateExercise(
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
          value
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
      normalizeText(
        target.value
      )
    ) {
      WorkoutPlanController
        .setDayTitle(
          state.activeDay,
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

    activeDay:
      state.activeDay,

    registryExerciseCount:
      getAllRegistryExercises()
        .length,

    missingCoreDom,

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
    "Loading your training system..."
  );

  try {
    populateFilters();

    await WorkoutPlanController
      .init();

    state.unsubscribeStore =
      WorkoutPlanController
        .subscribe(
          () => {
            renderOverview();
            renderWeek();

            if (
              state.activeDay &&
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
        .getDiagnostics();

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

    globalThis.AriWorkoutPlansPage = {
      version:
        VERSION,

      source:
        SOURCE,

      controller:
        WorkoutPlanController,

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

export {
  VERSION,
  SOURCE
};.