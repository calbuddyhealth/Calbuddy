// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-controller.js
// Version: 3.0.0
// Purpose:
//   Main orchestration layer for ARI Training planning,
//   date-specific weekly plans, workout generation,
//   exercise discovery, live sessions, local persistence,
//   and Supabase synchronization.
//
// V3.0.0:
//   - Moves planning from one endlessly repeating Monday-Sunday
//     definition to calendar-specific week plans.
//   - Uses real YYYY-MM-DD dates for each planned day.
//   - Supports browsing/planning future weeks and months.
//   - Unplanned dates resolve as Off Day instead of inheriting
//     workouts from another week.
//   - Templates are copy-on-apply starting points only.
//   - Adds calendar/month planning helpers.
//   - Prevents Start Workout on off/recovery/unplanned dates.
//   - Adds Plan Workout routing helpers.
//   - Adds cancelWorkout() for accidental starts.
//   - Adds deleteSession() for accidental sessions.
//   - Adds clearWeekPlan() and clearMonthPlan().
//   - Keeps permanent plan data separate from live progress.
// =====================================================

import WorkoutPlanStore from "./workout-plan-store.js";
import WorkoutPlanApi from "./workout-plan-api.js";
import WorkoutProgressStore from "./workout-progress-store.js";
import WorkoutTemplates from "./templates/workout-template-registry.js";
import ExerciseRegistry from "./exercises/exercise-registry.js";
import ExerciseSearch from "./exercises/exercise-search.js";
import ExerciseRecommender from "./exercises/exercise-recommender.js";
import WorkoutBuilder from "./workouts/workout-builder.js";
import WorkoutFocuses from "./workouts/workout-focuses.js";
import FitnessGoals from "./goals/fitness-goals.js";
import CalorieCalculator from "./energy/calorie-calculator.js";
import MetValues from "./energy/met-values.js";

const VERSION = "3.0.0";
const SOURCE = "js/training/workout-plan-controller";

const DAYS = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* =====================================================
   HELPERS
===================================================== */

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeId(value) {
  return normalizeText(value) || null;
}

function clone(value) {
  if (value === undefined) return undefined;

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toLocalIsoDate(value = new Date()) {
  if (
    typeof value === "string" &&
    ISO_DATE_PATTERN.test(value)
  ) {
    return value;
  }

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${pad2(date.getMonth() + 1)}-` +
    `${pad2(date.getDate())}`
  );
}

function fromLocalIsoDate(isoDate) {
  if (!ISO_DATE_PATTERN.test(normalizeText(isoDate))) {
    return null;
  }

  const [year, month, day] =
    isoDate.split("-").map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function addDays(isoDate, amount) {
  const date =
    fromLocalIsoDate(isoDate);

  if (!date) return null;

  date.setDate(
    date.getDate() +
    Number(amount || 0)
  );

  return toLocalIsoDate(date);
}

function getWeekdayIdFromDate(value = new Date()) {
  const date =
    typeof value === "string"
      ? fromLocalIsoDate(value)
      : new Date(value);

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return DAYS[date.getDay()];
}

function getSundayWeekStart(value = new Date()) {
  const date =
    typeof value === "string"
      ? fromLocalIsoDate(value)
      : new Date(value);

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  date.setDate(
    date.getDate() -
    date.getDay()
  );

  return toLocalIsoDate(date);
}

function getWeekDates(anchor = new Date()) {
  const startDate =
    getSundayWeekStart(anchor);

  if (!startDate) return [];

  return DAYS.map(
    (day, index) => ({
      day,
      date:
        addDays(
          startDate,
          index
        )
    })
  );
}

function getMonthKey(value = new Date()) {
  const iso =
    toLocalIsoDate(value);

  return iso
    ? iso.slice(0, 7)
    : null;
}

function getMonthDateRange(value = new Date()) {
  const date =
    typeof value === "string" &&
    /^\d{4}-\d{2}$/.test(value)
      ? new Date(
          Number(value.slice(0, 4)),
          Number(value.slice(5, 7)) - 1,
          1
        )
      : (
          typeof value === "string"
            ? fromLocalIsoDate(value)
            : new Date(value)
        );

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  const first =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );

  const last =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    );

  return {
    monthKey:
      `${first.getFullYear()}-${pad2(first.getMonth() + 1)}`,
    startDate:
      toLocalIsoDate(first),
    endDate:
      toLocalIsoDate(last)
  };
}

function normalizeDateOrToday(value = null) {
  return (
    toLocalIsoDate(
      value || new Date()
    ) ||
    toLocalIsoDate(new Date())
  );
}

function normalizePositiveNumber(value) {
  const number =
    Number(value);

  return (
    Number.isFinite(number) &&
    number > 0
  )
    ? number
    : null;
}

function getPlanContextKey(plan) {
  return (
    plan?.planId ||
    "calendar-plan"
  );
}

function hasPlannedExercises(dayState) {
  return Boolean(
    Array.isArray(
      dayState?.exercises
    ) &&
    dayState.exercises.length > 0
  );
}

function storeSupportsCalendar() {
  return Boolean(
    WorkoutPlanStore?.getDate ||
    WorkoutPlanStore?.getDayByDate
  );
}

function progressSupportsCalendar() {
  return Boolean(
    WorkoutProgressStore?.getDate ||
    WorkoutProgressStore?.getDayByDate
  );
}

function getStoreDate(isoDate) {
  if (
    typeof WorkoutPlanStore.getDate ===
    "function"
  ) {
    return WorkoutPlanStore.getDate(
      isoDate
    );
  }

  if (
    typeof WorkoutPlanStore.getDayByDate ===
    "function"
  ) {
    return WorkoutPlanStore.getDayByDate(
      isoDate
    );
  }

  const weekday =
    getWeekdayIdFromDate(isoDate);

  if (
    weekday &&
    typeof WorkoutPlanStore.getDay ===
      "function"
  ) {
    return WorkoutPlanStore.getDay(
      weekday
    );
  }

  return null;
}

function setStoreDate(isoDate, dayState) {
  if (
    typeof WorkoutPlanStore.setDate ===
    "function"
  ) {
    return WorkoutPlanStore.setDate(
      isoDate,
      dayState
    );
  }

  if (
    typeof WorkoutPlanStore.setDayByDate ===
    "function"
  ) {
    return WorkoutPlanStore.setDayByDate(
      isoDate,
      dayState
    );
  }

  const weekday =
    getWeekdayIdFromDate(isoDate);

  if (
    weekday &&
    typeof WorkoutPlanStore.setDay ===
      "function"
  ) {
    return WorkoutPlanStore.setDay(
      weekday,
      dayState
    );
  }

  return false;
}

function clearStoreDate(isoDate) {
  if (
    typeof WorkoutPlanStore.clearDate ===
    "function"
  ) {
    return WorkoutPlanStore.clearDate(
      isoDate
    );
  }

  const weekday =
    getWeekdayIdFromDate(isoDate);

  if (
    weekday &&
    typeof WorkoutPlanStore.clearDay ===
      "function"
  ) {
    return WorkoutPlanStore.clearDay(
      weekday
    );
  }

  return false;
}

function getProgressDate(isoDate) {
  if (
    typeof WorkoutProgressStore.getDate ===
    "function"
  ) {
    return WorkoutProgressStore.getDate(
      isoDate
    );
  }

  if (
    typeof WorkoutProgressStore.getDayByDate ===
    "function"
  ) {
    return WorkoutProgressStore.getDayByDate(
      isoDate
    );
  }

  const weekday =
    getWeekdayIdFromDate(isoDate);

  if (
    weekday &&
    typeof WorkoutProgressStore.getDay ===
      "function"
  ) {
    return WorkoutProgressStore.getDay(
      weekday
    );
  }

  return null;
}

/* =====================================================
   CONTROLLER
===================================================== */

const AriTrainingWorkoutPlanController = {
  version: VERSION,
  source: SOURCE,

  state: {
    initialized: false,
    loading: false,
    saving: false,
    remoteAvailable: false,
    lastLoadSource: null,
    lastSavedAt: null,
    lastBuiltWorkout: null,
    lastError: null,

    selectedDate:
      toLocalIsoDate(new Date()),

    selectedWeekStart:
      getSundayWeekStart(new Date()),

    selectedMonth:
      getMonthKey(new Date()),

    unsubscribePlan: null,
    unsubscribeProgress: null
  },

  /* ===================================================
     CONFIGURATION / INIT
  =================================================== */

  configure({
    client = null,
    tables = null
  } = {}) {
    if (client || tables) {
      WorkoutPlanApi.configure({
        client,
        tables
      });
    }

    this.state.remoteAvailable =
      Boolean(
        WorkoutPlanApi
          .findClient?.()
      );

    return this.getDiagnostics();
  },

  async init(options = {}) {
    if (
      this.state.initialized &&
      !options.force
    ) {
      return this.getDiagnostics();
    }

    if (
      options.client ||
      options.tables
    ) {
      this.configure(options);
    } else {
      this.state.remoteAvailable =
        Boolean(
          WorkoutPlanApi
            .findClient?.()
        );
    }

    WorkoutProgressStore.hydrate?.();

    await this.load();

    this.syncProgressWithPlan();
    this.bindInternalSubscriptions();

    this.state.initialized = true;

    return this.getDiagnostics();
  },

  bindInternalSubscriptions() {
    if (
      !this.state.unsubscribePlan &&
      typeof WorkoutPlanStore.subscribe ===
        "function"
    ) {
      this.state.unsubscribePlan =
        WorkoutPlanStore.subscribe(
          () => {
            this.syncProgressWithPlan();
          }
        );
    }
  },

  destroy() {
    if (
      typeof this.state.unsubscribePlan ===
      "function"
    ) {
      this.state.unsubscribePlan();
    }

    if (
      typeof this.state.unsubscribeProgress ===
      "function"
    ) {
      this.state.unsubscribeProgress();
    }

    this.state.unsubscribePlan = null;
    this.state.unsubscribeProgress = null;
    this.state.initialized = false;

    return true;
  },

  /* ===================================================
     LOAD / SAVE
  =================================================== */

  async load() {
    if (this.state.loading) {
      return WorkoutPlanStore.getState?.();
    }

    this.state.loading = true;
    this.state.lastError = null;

    try {
      if (this.state.remoteAvailable) {
        try {
          const remotePlan =
            await WorkoutPlanApi.loadPlan();

          if (remotePlan) {
            WorkoutPlanStore.replaceState?.(
              remotePlan
            );

            WorkoutPlanStore.save?.();

            this.state.lastLoadSource =
              "supabase";

            this.syncProgressWithPlan();

            return WorkoutPlanStore
              .getState?.();
          }
        } catch (error) {
          console.warn(
            "[ARI Training] Remote workout plan did not load. Falling back locally.",
            error
          );

          this.state.lastError =
            error;
        }
      }

      const hydrated =
        WorkoutPlanStore.hydrate?.();

      this.state.lastLoadSource =
        hydrated
          ? "local"
          : "default";

      this.syncProgressWithPlan();

      return WorkoutPlanStore.getState?.();
    } finally {
      this.state.loading = false;
    }
  },

  async save({
    remote = true
  } = {}) {
    if (this.state.saving) {
      return false;
    }

    this.state.saving = true;
    this.state.lastError = null;

    try {
      WorkoutPlanStore.save?.();

      if (
        remote &&
        this.state.remoteAvailable
      ) {
        try {
          const saved =
            await WorkoutPlanApi.savePlan({
              plan:
                WorkoutPlanStore
                  .getState?.()
            });

          if (saved) {
            WorkoutPlanStore.replaceState?.(
              saved
            );

            WorkoutPlanStore.save?.();
          }
        } catch (error) {
          console.warn(
            "[ARI Training] Workout plan saved locally but remote save failed.",
            error
          );

          this.state.lastError =
            error;

          return false;
        }
      }

      this.state.lastSavedAt =
        new Date().toISOString();

      this.syncProgressWithPlan();

      return true;
    } finally {
      this.state.saving = false;
    }
  },

  /* ===================================================
     CALENDAR SELECTION
  =================================================== */

  setSelectedDate(date) {
    const isoDate =
      normalizeDateOrToday(date);

    this.state.selectedDate =
      isoDate;

    this.state.selectedWeekStart =
      getSundayWeekStart(isoDate);

    this.state.selectedMonth =
      getMonthKey(isoDate);

    return isoDate;
  },

  setSelectedWeek(date) {
    const weekStart =
      getSundayWeekStart(date);

    if (!weekStart) return null;

    this.state.selectedWeekStart =
      weekStart;

    this.state.selectedDate =
      weekStart;

    this.state.selectedMonth =
      getMonthKey(weekStart);

    return this.getWeek(
      weekStart
    );
  },

  setSelectedMonth(value) {
    const range =
      getMonthDateRange(value);

    if (!range) return null;

    this.state.selectedMonth =
      range.monthKey;

    return this.getMonth(
      range.monthKey
    );
  },

  getSelectedDate() {
    return this.state.selectedDate;
  },

  getSelectedWeekStart() {
    return this.state.selectedWeekStart;
  },

  getSelectedMonth() {
    return this.state.selectedMonth;
  },

  /* ===================================================
     PLAN READS
  =================================================== */

  getPlan() {
    return WorkoutPlanStore.getState?.();
  },

  getDate(date = this.state.selectedDate) {
    const isoDate =
      normalizeDateOrToday(date);

    const stored =
      getStoreDate(isoDate);

    if (stored) {
      return {
        ...stored,
        date:
          stored.date ||
          isoDate,
        day:
          stored.day ||
          getWeekdayIdFromDate(
            isoDate
          )
      };
    }

    return {
      date: isoDate,
      day:
        getWeekdayIdFromDate(
          isoDate
        ),
      type: "off",
      focusId: "off_day",
      title: "Off Day",
      exercises: [],
      metadata: {
        implicitOffDay: true
      }
    };
  },

  getToday() {
    return this.getDate(
      new Date()
    );
  },

  getWeek(anchor = this.state.selectedWeekStart) {
    const startDate =
      getSundayWeekStart(anchor);

    if (!startDate) return null;

    if (
      typeof WorkoutPlanStore.getWeekByDate ===
      "function"
    ) {
      return WorkoutPlanStore.getWeekByDate(
        startDate
      );
    }

    const days = {};

    for (
      const item
      of getWeekDates(startDate)
    ) {
      days[item.day] =
        this.getDate(item.date);
    }

    return {
      weekStart: startDate,
      weekEnd:
        addDays(startDate, 6),
      days
    };
  },

  getMonth(value = this.state.selectedMonth) {
    const range =
      getMonthDateRange(value);

    if (!range) return null;

    if (
      typeof WorkoutPlanStore.getMonth ===
      "function"
    ) {
      return WorkoutPlanStore.getMonth(
        range.monthKey
      );
    }

    const dates = [];
    let cursor =
      range.startDate;

    while (
      cursor &&
      cursor <= range.endDate
    ) {
      dates.push(
        this.getDate(cursor)
      );

      cursor =
        addDays(cursor, 1);
    }

    return {
      ...range,
      dates
    };
  },

  getSummary(options = {}) {
    if (
      options.month ||
      options.monthKey
    ) {
      return this.getMonthSummary(
        options.month ||
        options.monthKey
      );
    }

    if (
      options.week ||
      options.weekStart
    ) {
      return this.getWeekSummary(
        options.week ||
        options.weekStart
      );
    }

    return (
      WorkoutPlanStore.getSummary?.() ||
      this.getWeekSummary(
        this.state.selectedWeekStart
      )
    );
  },

  getWeekSummary(anchor = this.state.selectedWeekStart) {
    const week =
      this.getWeek(anchor);

    const dayStates =
      Object.values(
        week?.days || {}
      );

    return {
      weekStart:
        week?.weekStart ||
        getSundayWeekStart(anchor),

      weekEnd:
        week?.weekEnd ||
        addDays(
          getSundayWeekStart(anchor),
          6
        ),

      trainingDayCount:
        dayStates.filter(
          day =>
            day.type === "workout"
        ).length,

      recoveryDayCount:
        dayStates.filter(
          day =>
            day.type === "recovery"
        ).length,

      offDayCount:
        dayStates.filter(
          day =>
            day.type === "off"
        ).length,

      exerciseCount:
        dayStates.reduce(
          (total, day) =>
            total +
            (
              day.exercises?.length ||
              0
            ),
          0
        )
    };
  },

  getMonthSummary(value = this.state.selectedMonth) {
    const month =
      this.getMonth(value);

    const dates =
      month?.dates ||
      Object.values(
        month?.days || {}
      );

    return {
      monthKey:
        month?.monthKey ||
        getMonthKey(value),

      trainingDayCount:
        dates.filter(
          day =>
            day.type === "workout"
        ).length,

      recoveryDayCount:
        dates.filter(
          day =>
            day.type === "recovery"
        ).length,

      offDayCount:
        dates.filter(
          day =>
            day.type === "off"
        ).length,

      plannedExerciseCount:
        dates.reduce(
          (total, day) =>
            total +
            (
              day.exercises?.length ||
              0
            ),
          0
        )
    };
  },

  getCurrentWeekKey() {
    return getSundayWeekStart(
      new Date()
    );
  },

  /* ===================================================
     START / PLAN ROUTING RULES
  =================================================== */

  canStartWorkout(date = new Date()) {
    const dayState =
      this.getDate(date);

    return Boolean(
      dayState &&
      dayState.type === "workout" &&
      hasPlannedExercises(dayState)
    );
  },

  needsWorkoutPlan(date = new Date()) {
    return !this.canStartWorkout(
      date
    );
  },

  getPrimaryDayAction(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    const dayState =
      this.getDate(isoDate);

    if (
      this.canStartWorkout(isoDate)
    ) {
      return {
        action: "start_workout",
        label: "Start Workout",
        date: isoDate,
        dayState
      };
    }

    return {
      action: "plan_workout",
      label: "Plan Workout",
      date: isoDate,
      href:
        `workout-plans.html?date=${encodeURIComponent(
          isoDate
        )}`,
      dayState
    };
  },

  /* ===================================================
     PLAN METADATA
  =================================================== */

  setPlanName(name) {
    return WorkoutPlanStore
      .setPlanName?.(
        name
      );
  },

  setPrimaryGoal(goalId) {
    const goal =
      FitnessGoals.get(goalId);

    if (!goal) return false;

    return WorkoutPlanStore
      .setPrimaryGoal?.(
        goal.id
      );
  },

  setSecondaryGoals(goalIds = []) {
    const validIds =
      Array.isArray(goalIds)
        ? goalIds
            .map(
              goalId =>
                FitnessGoals
                  .get(goalId)
                  ?.id ||
                null
            )
            .filter(Boolean)
        : [];

    return WorkoutPlanStore
      .setSecondaryGoals?.(
        validIds
      );
  },

  /* ===================================================
     DATE-SPECIFIC PLAN EDITING
  =================================================== */

  setDate(date, patch = {}) {
    const isoDate =
      normalizeDateOrToday(date);

    const current =
      this.getDate(isoDate);

    return setStoreDate(
      isoDate,
      {
        ...current,
        ...clone(patch),
        date: isoDate,
        day:
          getWeekdayIdFromDate(
            isoDate
          )
      }
    );
  },

  setDateType(date, type) {
    const normalized =
      normalizeText(type)
        .toLowerCase();

    const validType =
      [
        "workout",
        "recovery",
        "off"
      ].includes(normalized)
        ? normalized
        : "off";

    if (validType === "off") {
      return this.clearDate(
        date
      );
    }

    const current =
      this.getDate(date);

    return this.setDate(
      date,
      {
        type: validType,

        focusId:
          validType === "recovery"
            ? "active_recovery"
            : (
                current?.focusId ===
                  "off_day"
                  ? "custom"
                  : current?.focusId ||
                    "custom"
              ),

        title:
          validType === "recovery"
            ? "Active Recovery"
            : (
                current?.title ===
                  "Off Day"
                  ? "Workout"
                  : current?.title ||
                    "Workout"
              )
      }
    );
  },

  setDateFocus(date, focusId) {
    const focus =
      WorkoutFocuses.get(
        focusId
      );

    if (!focus) return false;

    if (focus.id === "off_day") {
      return this.clearDate(
        date
      );
    }

    return this.setDate(
      date,
      {
        type:
          focus.category ===
            "recovery"
            ? "recovery"
            : "workout",
        focusId: focus.id,
        title: focus.label
      }
    );
  },

  setDateTitle(date, title) {
    const normalized =
      normalizeText(title);

    if (!normalized) return false;

    return this.setDate(
      date,
      {
        title: normalized
      }
    );
  },

  setDateGoal(date, goalId) {
    return this.setDate(
      date,
      {
        goal:
          normalizeId(goalId)
      }
    );
  },

  setDateSport(date, sportId) {
    return this.setDate(
      date,
      {
        sport:
          normalizeId(sportId)
      }
    );
  },

  setDateDuration(date, minutes) {
    return this.setDate(
      date,
      {
        estimatedDurationMinutes:
          normalizePositiveNumber(
            minutes
          )
      }
    );
  },

  clearDate(date) {
    const isoDate =
      normalizeDateOrToday(date);

    const result =
      clearStoreDate(isoDate);

    this.syncProgressDateWithPlan(
      isoDate
    );

    return result;
  },

  clearWeekPlan(anchor = this.state.selectedWeekStart) {
    const startDate =
      getSundayWeekStart(anchor);

    if (!startDate) return false;

    if (
      typeof WorkoutPlanStore.clearWeek ===
      "function"
    ) {
      const result =
        WorkoutPlanStore.clearWeek(
          startDate
        );

      this.syncProgressWithPlan();

      return result;
    }

    let changed = false;

    for (
      const item
      of getWeekDates(startDate)
    ) {
      changed =
        clearStoreDate(item.date) ||
        changed;
    }

    this.syncProgressWithPlan();

    return changed;
  },

  clearMonthPlan(value = this.state.selectedMonth) {
    const range =
      getMonthDateRange(value);

    if (!range) return false;

    if (
      typeof WorkoutPlanStore.clearMonth ===
      "function"
    ) {
      const result =
        WorkoutPlanStore.clearMonth(
          range.monthKey
        );

      this.syncProgressWithPlan();

      return result;
    }

    let changed = false;
    let cursor =
      range.startDate;

    while (
      cursor &&
      cursor <= range.endDate
    ) {
      changed =
        clearStoreDate(cursor) ||
        changed;

      cursor =
        addDays(cursor, 1);
    }

    this.syncProgressWithPlan();

    return changed;
  },

  /* ===================================================
     WEEKDAY COMPATIBILITY
  =================================================== */

  getDateForWeekday(
    day,
    anchor =
      this.state.selectedWeekStart
  ) {
    const normalized =
      normalizeText(day)
        .toLowerCase();

    const index =
      DAYS.indexOf(normalized);

    if (index < 0) {
      return null;
    }

    const startDate =
      getSundayWeekStart(anchor);

    return startDate
      ? addDays(startDate, index)
      : null;
  },

  getDay(dayOrDate) {
    if (
      ISO_DATE_PATTERN.test(
        normalizeText(dayOrDate)
      )
    ) {
      return this.getDate(
        dayOrDate
      );
    }

    const targetDate =
      this.getDateForWeekday(
        dayOrDate,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.getDate(targetDate)
      : null;
  },

  setDayType(day, type) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateType(
          targetDate,
          type
        )
      : false;
  },

  setDayFocus(day, focusId) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateFocus(
          targetDate,
          focusId
        )
      : false;
  },

  setDayTitle(day, title) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateTitle(
          targetDate,
          title
        )
      : false;
  },

  setDayGoal(day, goalId) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateGoal(
          targetDate,
          goalId
        )
      : false;
  },

  setDaySport(day, sportId) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateSport(
          targetDate,
          sportId
        )
      : false;
  },

  setDayDuration(day, minutes) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.setDateDuration(
          targetDate,
          minutes
        )
      : false;
  },

  clearDay(day) {
    const targetDate =
      this.getDateForWeekday(
        day,
        this.state.selectedWeekStart
      );

    return targetDate
      ? this.clearDate(targetDate)
      : false;
  },

  /* ===================================================
     EXERCISE PLAN EDITING
  =================================================== */

  addExercise(dateOrDay, exerciseId, options = {}) {
    const exercise =
      ExerciseRegistry.get(
        exerciseId
      );

    if (!exercise) return false;

    const isoDate =
      ISO_DATE_PATTERN.test(
        normalizeText(dateOrDay)
      )
        ? normalizeText(dateOrDay)
        : this.getDateForWeekday(
            dateOrDay,
            this.state.selectedWeekStart
          );

    if (!isoDate) return false;

    const current =
      this.getDate(isoDate);

    if (
      !current ||
      current.type !== "workout"
    ) {
      return false;
    }

    const entry = {
      exerciseId: exercise.id,
      ...clone(options)
    };

    if (
      typeof WorkoutPlanStore.addExerciseToDate ===
      "function"
    ) {
      return WorkoutPlanStore.addExerciseToDate(
        isoDate,
        entry
      );
    }

    return WorkoutPlanStore
      .addExercise?.(
        getWeekdayIdFromDate(
          isoDate
        ),
        entry
      ) ||
      false;
  },

  updateExercise(dateOrDay, index, patch = {}) {
    const isoDate =
      ISO_DATE_PATTERN.test(
        normalizeText(dateOrDay)
      )
        ? normalizeText(dateOrDay)
        : this.getDateForWeekday(
            dateOrDay,
            this.state.selectedWeekStart
          );

    if (!isoDate) return false;

    if (
      typeof WorkoutPlanStore.updateExerciseOnDate ===
      "function"
    ) {
      return WorkoutPlanStore.updateExerciseOnDate(
        isoDate,
        index,
        patch
      );
    }

    return WorkoutPlanStore
      .updateExercise?.(
        getWeekdayIdFromDate(
          isoDate
        ),
        index,
        patch
      ) ||
      false;
  },

  removeExercise(dateOrDay, index) {
    const isoDate =
      ISO_DATE_PATTERN.test(
        normalizeText(dateOrDay)
      )
        ? normalizeText(dateOrDay)
        : this.getDateForWeekday(
            dateOrDay,
            this.state.selectedWeekStart
          );

    if (!isoDate) return false;

    if (
      typeof WorkoutPlanStore.removeExerciseFromDate ===
      "function"
    ) {
      return WorkoutPlanStore.removeExerciseFromDate(
        isoDate,
        index
      );
    }

    return WorkoutPlanStore
      .removeExercise?.(
        getWeekdayIdFromDate(
          isoDate
        ),
        index
      ) ||
      false;
  },

  /* ===================================================
     TEMPLATES
  =================================================== */

  applyTemplate(
    templateId,
    {
      weekStart =
        this.state.selectedWeekStart
    } = {}
  ) {
    const template =
      WorkoutTemplates.get(
        templateId
      );

    if (!template) return false;

    const targetWeekStart =
      getSundayWeekStart(
        weekStart
      );

    if (!targetWeekStart) {
      return false;
    }

    if (
      typeof WorkoutPlanStore.applyTemplateToWeek ===
      "function"
    ) {
      const applied =
        WorkoutPlanStore.applyTemplateToWeek(
          WorkoutTemplates.clone(
            template.id
          ),
          targetWeekStart
        );

      if (applied) {
        this.syncProgressWithPlan();
      }

      return applied;
    }

    const applied =
      WorkoutPlanStore
        .applyTemplate?.(
          WorkoutTemplates.clone(
            template.id
          )
        ) ||
      false;

    if (applied) {
      this.syncProgressWithPlan();
    }

    return applied;
  },

  getTemplates(filters = {}) {
    return WorkoutTemplates.list(
      filters
    );
  },

  searchTemplates(query) {
    return WorkoutTemplates.search(
      query
    );
  },

  /* ===================================================
     FOCUSES / GOALS
  =================================================== */

  getWorkoutFocuses(filters = {}) {
    return WorkoutFocuses.list(
      filters
    );
  },

  searchWorkoutFocuses(query) {
    return WorkoutFocuses.search(
      query
    );
  },

  getFitnessGoals(filters = {}) {
    return FitnessGoals.list(
      filters
    );
  },

  searchFitnessGoals(query) {
    return FitnessGoals.search(
      query
    );
  },

  /* ===================================================
     EXERCISE LIBRARY
  =================================================== */

  getExercise(exerciseId) {
    return ExerciseRegistry.get(
      exerciseId
    );
  },

  getExercises(filters = {}) {
    return ExerciseRegistry.list(
      filters
    );
  },

  searchExercises(query, options = {}) {
    return ExerciseSearch.search(
      query,
      options
    );
  },

  findExercises(query, options = {}) {
    return ExerciseSearch.find(
      query,
      options
    );
  },

  suggestExercises(query, options = {}) {
    return ExerciseSearch.suggest(
      query,
      options
    );
  },

  browseExercises(options = {}) {
    return ExerciseSearch.browse(
      options
    );
  },

  getExerciseSubstitutions(
    exerciseId,
    options = {}
  ) {
    return ExerciseSearch.substitutions(
      exerciseId,
      options
    );
  },

  /* ===================================================
     RECOMMENDATIONS
  =================================================== */

  getRecommendedExercises(options = {}) {
    const primaryGoalId =
      WorkoutPlanStore
        .getState?.()
        ?.primaryGoalId;

    const focus =
      options.workoutFocus
        ? WorkoutFocuses.get(
            options.workoutFocus
          )
        : null;

    const bodyParts = [
      ...(
        Array.isArray(
          options.bodyParts
        )
          ? options.bodyParts
          : options.bodyPart
            ? [options.bodyPart]
            : []
      )
    ];

    const movementPatterns = [
      ...(
        Array.isArray(
          options.movementPatterns
        )
          ? options.movementPatterns
          : options.movementPattern
            ? [options.movementPattern]
            : []
      )
    ];

    const exerciseTypes = [
      ...(
        Array.isArray(
          options.exerciseTypes
        )
          ? options.exerciseTypes
          : options.exerciseType
            ? [options.exerciseType]
            : []
      )
    ];

    if (focus) {
      if (bodyParts.length === 0) {
        bodyParts.push(
          ...(
            focus.primaryBodyParts ||
            focus.bodyParts ||
            []
          )
        );
      }

      if (movementPatterns.length === 0) {
        movementPatterns.push(
          ...(focus.movementPatterns || [])
        );
      }

      if (exerciseTypes.length === 0) {
        exerciseTypes.push(
          ...(focus.exerciseTypes || [])
        );
      }
    }

    const recommendation =
      ExerciseRecommender.recommend({
        goal:
          options.goal ||
          primaryGoalId ||
          "general_fitness",

        secondaryGoals:
          options.secondaryGoals,

        bodyParts,
        muscles:
          options.muscles,
        movementPatterns,
        exerciseTypes,
        modules:
          options.modules,
        categories:
          options.categories,

        availableEquipment:
          options.availableEquipment ||
          (
            options.equipment
              ? [options.equipment]
              : []
          ),

        preferredEquipment:
          options.preferredEquipment,

        excludedEquipment:
          options.excludedEquipment,

        preferredExercises:
          options.preferredExercises,

        excludedExercises:
          options.excludedExercises,

        difficulty:
          options.difficulty,

        sport:
          options.sport,

        specialization:
          options.specialization,

        allowHarder:
          options.allowHarder,

        strictEquipment:
          options.strictEquipment,

        includeBodyweight:
          options.includeBodyweight,

        variety:
          options.variety,

        limit:
          options.limit ||
          12
      });

    return recommendation.results;
  },

  getRecommendedExercisesForDate(
    date,
    options = {}
  ) {
    const dayState =
      this.getDate(date);

    if (
      !dayState ||
      dayState.type !== "workout"
    ) {
      return [];
    }

    return this.getRecommendedExercises({
      goal:
        dayState.goal ||
        WorkoutPlanStore
          .getState?.()
          ?.primaryGoalId,

      workoutFocus:
        dayState.focusId,

      sport:
        dayState.sport,

      ...options
    });
  },

  getRecommendedExercisesForDay(
    day,
    options = {}
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.getRecommendedExercisesForDate(
          targetDate,
          options
        )
      : [];
  },

  recommendFromQuery(query, options = {}) {
    return ExerciseRecommender
      .recommendFromQuery(
        query,
        options
      );
  },

  /* ===================================================
     WORKOUT BUILDER
  =================================================== */

  buildWorkout(options = {}) {
    const plan =
      WorkoutPlanStore
        .getState?.() ||
      {};

    const workout =
      WorkoutBuilder.build({
        goal:
          options.goal ||
          plan.primaryGoalId ||
          "general_fitness",

        secondaryGoals:
          options.secondaryGoals ||
          plan.secondaryGoalIds,

        ...options
      });

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildQuickWorkout(options = {}) {
    const workout =
      WorkoutBuilder.quick(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildStrengthWorkout(options = {}) {
    const workout =
      WorkoutBuilder.strength(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildHypertrophyWorkout(options = {}) {
    const workout =
      WorkoutBuilder.hypertrophy(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildCardioWorkout(options = {}) {
    const workout =
      WorkoutBuilder.cardio(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildMobilityWorkout(options = {}) {
    const workout =
      WorkoutBuilder.mobility(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildSurfWorkout(options = {}) {
    const workout =
      WorkoutBuilder.surfing(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },

  buildWorkoutForDate(
    date,
    options = {}
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    const currentDay =
      this.getDate(isoDate);

    const focus =
      currentDay?.focusId
        ? WorkoutFocuses.get(
            currentDay.focusId
          )
        : null;

    const inferredBodyParts =
      focus?.primaryBodyParts ||
      focus?.bodyParts ||
      [];

    return this.buildWorkout({
      goal:
        options.goal ||
        currentDay?.goal ||
        WorkoutPlanStore
          .getState?.()
          ?.primaryGoalId ||
        "general_fitness",

      sport:
        options.sport ||
        currentDay?.sport ||
        null,

      bodyParts:
        options.bodyParts ||
        (
          options.bodyPart
            ? [options.bodyPart]
            : inferredBodyParts
        ),

      durationMinutes:
        options.durationMinutes ||
        currentDay
          ?.estimatedDurationMinutes ||
        45,

      ...options
    });
  },

  buildWorkoutForDay(
    day,
    options = {}
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.buildWorkoutForDate(
          targetDate,
          options
        )
      : null;
  },

  setBuiltWorkoutForDate(
    date,
    workout,
    options = {}
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (!workout) return false;

    if (
      typeof WorkoutPlanStore.setBuiltWorkoutForDate ===
      "function"
    ) {
      const result =
        WorkoutPlanStore
          .setBuiltWorkoutForDate(
            isoDate,
            workout,
            options
          );

      if (result) {
        this.syncProgressDateWithPlan(
          isoDate
        );
      }

      return result;
    }

    if (
      typeof WorkoutPlanStore.setBuiltWorkout ===
      "function"
    ) {
      const result =
        WorkoutPlanStore.setBuiltWorkout(
          getWeekdayIdFromDate(
            isoDate
          ),
          workout,
          options
        );

      if (result) {
        this.syncProgressWithPlan();
      }

      return result;
    }

    return false;
  },

  setBuiltWorkoutForDay(
    day,
    workout,
    options = {}
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.setBuiltWorkoutForDate(
          targetDate,
          workout,
          options
        )
      : false;
  },

  buildAndSetWorkoutForDate(
    date,
    options = {}
  ) {
    const workout =
      this.buildWorkoutForDate(
        date,
        options
      );

    if (!workout) return null;

    return this.setBuiltWorkoutForDate(
      date,
      workout,
      {
        focusId:
          options.focusId ||
          null
      }
    )
      ? workout
      : null;
  },

  buildAndSetWorkoutForDay(
    day,
    options = {}
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.buildAndSetWorkoutForDate(
          targetDate,
          options
        )
      : null;
  },

  regenerateDate(
    date,
    options = {}
  ) {
    return this.buildAndSetWorkoutForDate(
      date,
      options
    );
  },

  regenerateDay(
    day,
    options = {}
  ) {
    return this.buildAndSetWorkoutForDay(
      day,
      options
    );
  },

  /* ===================================================
     BUILT WORKOUT EDITING
  =================================================== */

  replaceBuiltWorkoutExercise(
    workout,
    entryId,
    replacementExerciseId
  ) {
    return WorkoutBuilder.replaceExercise(
      workout,
      entryId,
      replacementExerciseId
    );
  },

  moveBuiltWorkoutExercise(
    workout,
    entryId,
    options = {}
  ) {
    return WorkoutBuilder.moveExercise(
      workout,
      entryId,
      options
    );
  },

  removeBuiltWorkoutExercise(
    workout,
    entryId
  ) {
    return WorkoutBuilder.removeExercise(
      workout,
      entryId
    );
  },

  addExerciseToBuiltWorkout(
    workout,
    exerciseId,
    options = {}
  ) {
    return WorkoutBuilder.addExercise(
      workout,
      exerciseId,
      options
    );
  },

  /* ===================================================
     PLAN -> PROGRESS SYNC
  =================================================== */

  syncProgressDateWithPlan(date) {
    const isoDate =
      normalizeDateOrToday(date);

    const dayState =
      this.getDate(isoDate);

    if (
      typeof WorkoutProgressStore.syncDateWithPlan ===
      "function"
    ) {
      return WorkoutProgressStore.syncDateWithPlan({
        date: isoDate,
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

    if (
      typeof WorkoutProgressStore.syncDayWithPlan ===
      "function"
    ) {
      return WorkoutProgressStore.syncDayWithPlan({
        day:
          getWeekdayIdFromDate(
            isoDate
          ),
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

    return false;
  },

  syncProgressWithPlan() {
    const plan =
      WorkoutPlanStore
        .getState?.() ||
      {};

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(plan),

        weekKey:
          this.state.selectedWeekStart ||
          this.getCurrentWeekKey(),

        resetIfChanged: false
      });

    if (
      typeof WorkoutProgressStore.syncCalendarWithPlan ===
      "function"
    ) {
      return WorkoutProgressStore
        .syncCalendarWithPlan(
          plan
        );
    }

    const selectedWeek =
      this.getWeek(
        this.state.selectedWeekStart
      );

    if (
      typeof WorkoutProgressStore.syncWeekWithPlan ===
      "function"
    ) {
      return WorkoutProgressStore.syncWeekWithPlan(
        selectedWeek?.days ||
        plan.week ||
        {}
      );
    }

    return null;
  },

  /* ===================================================
     LIVE SESSION READS
  =================================================== */

  getProgress() {
    return WorkoutProgressStore
      .getState?.();
  },

  getDateProgress(date = new Date()) {
    return getProgressDate(
      normalizeDateOrToday(date)
    );
  },

  getDayProgress(day) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.getDateProgress(targetDate)
      : null;
  },

  getTodayProgress() {
    return this.getDateProgress(
      new Date()
    );
  },

  getDateProgressSummary(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.getDateSummary ===
      "function"
    ) {
      return WorkoutProgressStore.getDateSummary(
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .getDaySummary?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      null
    );
  },

  getTodayProgressSummary() {
    return this.getDateProgressSummary(
      new Date()
    );
  },

  getWeekProgressSummary(
    anchor =
      this.state.selectedWeekStart
  ) {
    if (
      typeof WorkoutProgressStore.getWeekSummaryByDate ===
      "function"
    ) {
      return WorkoutProgressStore.getWeekSummaryByDate(
        getSundayWeekStart(anchor)
      );
    }

    return (
      WorkoutProgressStore
        .getWeekSummary?.() ||
      null
    );
  },

  /* ===================================================
     SESSION LIFECYCLE
  =================================================== */

  startWorkout(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    /*
     * Critical V3 rule:
     * only a real planned workout with at least one exercise
     * can be started.
     */
    if (
      !this.canStartWorkout(
        isoDate
      )
    ) {
      return false;
    }

    if (
      typeof WorkoutProgressStore.startDate ===
      "function"
    ) {
      return WorkoutProgressStore.startDate(
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .startDay?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      false
    );
  },

  pauseWorkout(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.pauseDate ===
      "function"
    ) {
      return WorkoutProgressStore.pauseDate(
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .pauseDay?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      false
    );
  },

  resumeWorkout(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.resumeDate ===
      "function"
    ) {
      return WorkoutProgressStore.resumeDate(
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .resumeDay?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      false
    );
  },

  completeWorkout(
    date = new Date(),
    options = {}
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.completeDate ===
      "function"
    ) {
      return WorkoutProgressStore.completeDate(
        isoDate,
        options
      );
    }

    return (
      WorkoutProgressStore
        .completeDay?.(
          getWeekdayIdFromDate(
            isoDate
          ),
          options
        ) ||
      false
    );
  },

  /*
   * Cancel an accidental workout start.
   *
   * Permanent plan remains untouched.
   * Active timer/session execution state is removed.
   * No completed workout history should be created.
   */
  cancelWorkout(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.cancelDate ===
      "function"
    ) {
      return WorkoutProgressStore.cancelDate(
        isoDate
      );
    }

    if (
      typeof WorkoutProgressStore.cancelDay ===
      "function"
    ) {
      return WorkoutProgressStore.cancelDay(
        getWeekdayIdFromDate(
          isoDate
        )
      );
    }

    /*
     * Safe V2 fallback.
     */
    return (
      WorkoutProgressStore
        .resetDay?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      false
    );
  },

  /*
   * Delete an accidental/unwanted historical session.
   */
  deleteSession({
    sessionId = null,
    date = null
  } = {}) {
    if (
      typeof WorkoutProgressStore.deleteSession ===
      "function"
    ) {
      return WorkoutProgressStore.deleteSession({
        sessionId,
        date:
          date
            ? normalizeDateOrToday(
                date
              )
            : null
      });
    }

    if (date) {
      return this.cancelWorkout(
        date
      );
    }

    return false;
  },

  getWorkoutElapsedSeconds(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.getElapsedSecondsForDate ===
      "function"
    ) {
      return WorkoutProgressStore
        .getElapsedSecondsForDate(
          isoDate
        );
    }

    return (
      WorkoutProgressStore
        .getElapsedSeconds?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      0
    );
  },

  setAverageHeartRate(
    date,
    heartRate
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.setAverageHeartRateForDate ===
      "function"
    ) {
      return WorkoutProgressStore
        .setAverageHeartRateForDate(
          isoDate,
          heartRate
        );
    }

    return (
      WorkoutProgressStore
        .setAverageHeartRate?.(
          getWeekdayIdFromDate(
            isoDate
          ),
          heartRate
        ) ||
      false
    );
  },

  setWorkoutNotes(date, notes) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.setDateNotes ===
      "function"
    ) {
      return WorkoutProgressStore.setDateNotes(
        isoDate,
        notes
      );
    }

    return (
      WorkoutProgressStore
        .setDayNotes?.(
          getWeekdayIdFromDate(
            isoDate
          ),
          notes
        ) ||
      false
    );
  },

  /* ===================================================
     SESSION EXERCISE ACTIONS
  =================================================== */

  moveSessionExercise(
    date,
    entryId,
    toIndex
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.moveDateEntry ===
      "function"
    ) {
      return WorkoutProgressStore.moveDateEntry(
        isoDate,
        entryId,
        toIndex
      );
    }

    return (
      WorkoutProgressStore
        .moveEntry?.(
          getWeekdayIdFromDate(
            isoDate
          ),
          entryId,
          toIndex
        ) ||
      false
    );
  },

  addSessionExercise(options = {}) {
    return WorkoutProgressStore
      .addSessionExercise?.(
        options
      );
  },

  substituteSessionExercise(options = {}) {
    return WorkoutProgressStore
      .substituteEntry?.(
        options
      );
  },

  skipSessionExercise(
    date,
    entryId,
    skipped = true
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    return (
      WorkoutProgressStore
        .skipEntry?.(
          progressSupportsCalendar()
            ? isoDate
            : getWeekdayIdFromDate(
                isoDate
              ),
          entryId,
          skipped
        ) ||
      false
    );
  },

  removeSessionExercise(
    date,
    entryId
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    return (
      WorkoutProgressStore
        .removeSessionEntry?.(
          progressSupportsCalendar()
            ? isoDate
            : getWeekdayIdFromDate(
                isoDate
              ),
          entryId
        ) ||
      false
    );
  },

  getSessionExercise(
    date,
    entryIdOrExerciseId
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    return (
      WorkoutProgressStore
        .getExerciseProgress?.(
          progressSupportsCalendar()
            ? isoDate
            : getWeekdayIdFromDate(
                isoDate
              ),
          entryIdOrExerciseId
        ) ||
      null
    );
  },

  /* ===================================================
     SET / ACTIVITY COMPLETION
  =================================================== */

  setSetCompleted(options = {}) {
    return WorkoutProgressStore
      .setSetCompleted?.(
        options
      );
  },

  toggleSetCompleted(options = {}) {
    return WorkoutProgressStore
      .toggleSetCompleted?.(
        options
      );
  },

  setSetCalories(options = {}) {
    return WorkoutProgressStore
      .setSetCalories?.(
        options
      );
  },

  setExerciseCompleted(options = {}) {
    return WorkoutProgressStore
      .setExerciseCompleted?.(
        options
      );
  },

  toggleExerciseCompleted(options = {}) {
    return WorkoutProgressStore
      .toggleExerciseCompleted?.(
        options
      );
  },

  createSessionSnapshot(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.createSessionSnapshotForDate ===
      "function"
    ) {
      return WorkoutProgressStore
        .createSessionSnapshotForDate(
          isoDate
        );
    }

    return (
      WorkoutProgressStore
        .createSessionSnapshot?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      null
    );
  },

  /* ===================================================
     CALORIE ESTIMATION
  =================================================== */

  estimateExerciseCalories({
    exerciseId,
    durationMinutes,
    weightKg = null,
    weightLb = null,
    intensity = null,
    activityId = null
  } = {}) {
    const exercise =
      ExerciseRegistry.get(
        exerciseId
      );

    if (!exercise) {
      return null;
    }

    const energyProfile =
      exercise.energyProfile;

    if (
      !energyProfile &&
      (
        exercise.exerciseTypes
          ?.includes("strength") ||
        exercise.exerciseTypes
          ?.includes("hypertrophy")
      )
    ) {
      return CalorieCalculator
        .estimateStrengthSession({
          intensity:
            intensity ||
            "moderate",
          weightKg,
          weightLb,
          durationMinutes
        });
    }

    const resolvedActivityId =
      activityId ||
      this.resolveEnergyActivityId(
        exercise,
        intensity
      );

    if (!resolvedActivityId) {
      return null;
    }

    return CalorieCalculator
      .estimateActivity({
        activityId:
          resolvedActivityId,
        weightKg,
        weightLb,
        durationMinutes,
        intensity
      });
  },

  resolveEnergyActivityId(
    exercise,
    intensity = null
  ) {
    if (
      !exercise ||
      typeof exercise !== "object"
    ) {
      return null;
    }

    const normalizedIntensity =
      normalizeText(intensity)
        .toLowerCase();

    switch (exercise.id) {
      case "walking_general":
        if (
          normalizedIntensity ===
          "vigorous"
        ) {
          return "walking_brisk";
        }

        if (
          normalizedIntensity ===
          "light"
        ) {
          return "walking_easy";
        }

        return "walking_moderate";

      case "easy_run":
        return "running_easy";

      case "tempo_run":
        return "running_6_mph";

      case "running_intervals":
        return "hiit";

      case "stationary_bike":
        if (
          normalizedIntensity ===
          "vigorous"
        ) {
          return "stationary_bike_vigorous";
        }

        if (
          normalizedIntensity ===
          "light"
        ) {
          return "stationary_bike_light";
        }

        return "stationary_bike_moderate";

      case "rowing_machine":
        if (
          normalizedIntensity ===
          "vigorous"
        ) {
          return "rowing_vigorous";
        }

        if (
          normalizedIntensity ===
          "light"
        ) {
          return "rowing_light";
        }

        return "rowing_moderate";

      case "stair_climber":
        return "stair_climber";

      case "elliptical_trainer":
        return normalizedIntensity ===
          "vigorous"
          ? "elliptical_vigorous"
          : "elliptical_moderate";

      default:
        return null;
    }
  },

  getCalorieActivityOptions({
    category = null,
    exerciseType = null,
    intensity = null
  } = {}) {
    return MetValues.list({
      category,
      exerciseType,
      intensity
    });
  },

  /* ===================================================
     SUBSCRIPTIONS
  =================================================== */

  subscribe(listener) {
    return WorkoutPlanStore
      .subscribe?.(
        listener
      );
  },

  subscribeProgress(listener) {
    return WorkoutProgressStore
      .subscribe?.(
        listener
      );
  },

  /* ===================================================
     DELETE / RESET
  =================================================== */

  async deleteRemotePlan() {
    if (
      !this.state.remoteAvailable
    ) {
      return false;
    }

    const plan =
      WorkoutPlanStore
        .getState?.() ||
      {};

    await WorkoutPlanApi.deletePlan({
      planId:
        plan.planId
    });

    WorkoutPlanStore.reset?.();
    WorkoutProgressStore.resetAll?.();

    this.state.lastLoadSource =
      "default";

    return true;
  },

  resetPlan() {
    const result =
      WorkoutPlanStore
        .reset?.() ||
      false;

    WorkoutProgressStore
      .resetAll?.();

    return result;
  },

  resetProgress() {
    return WorkoutProgressStore
      .resetAll?.() ||
      false;
  },

  resetDateProgress(date) {
    const isoDate =
      normalizeDateOrToday(date);

    if (
      typeof WorkoutProgressStore.resetDate ===
      "function"
    ) {
      return WorkoutProgressStore.resetDate(
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .resetDay?.(
          getWeekdayIdFromDate(
            isoDate
          )
        ) ||
      false
    );
  },

  resetDayProgress(day) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(day)
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.state.selectedWeekStart
          );

    return targetDate
      ? this.resetDateProgress(
          targetDate
        )
      : false;
  },

  reset() {
    return this.resetPlan();
  },

  /* ===================================================
     VALIDATION / DIAGNOSTICS
  =================================================== */

  validatePlan() {
    return WorkoutPlanStore
      .validate?.() ||
      null;
  },

  validateProgress() {
    return WorkoutProgressStore
      .validate?.() ||
      null;
  },

  validateBuiltWorkout(workout) {
    return WorkoutBuilder.validate(
      workout
    );
  },

  getDiagnostics() {
    return {
      source: SOURCE,
      version: VERSION,
      initialized:
        this.state.initialized,
      loading:
        this.state.loading,
      saving:
        this.state.saving,
      remoteAvailable:
        this.state.remoteAvailable,
      lastLoadSource:
        this.state.lastLoadSource,
      lastSavedAt:
        this.state.lastSavedAt,

      selectedDate:
        this.state.selectedDate,

      selectedWeekStart:
        this.state.selectedWeekStart,

      selectedMonth:
        this.state.selectedMonth,

      calendarPlanningSupported:
        storeSupportsCalendar(),

      calendarProgressSupported:
        progressSupportsCalendar(),

      todayAction:
        this.getPrimaryDayAction(
          new Date()
        ),

      lastBuiltWorkout:
        this.state.lastBuiltWorkout
          ? {
              workoutId:
                this.state
                  .lastBuiltWorkout
                  .workoutId,
              title:
                this.state
                  .lastBuiltWorkout
                  .title,
              type:
                this.state
                  .lastBuiltWorkout
                  .type,
              goal:
                this.state
                  .lastBuiltWorkout
                  .goal
            }
          : null,

      lastError:
        this.state.lastError
          ? {
              message:
                this.state
                  .lastError
                  ?.message ||
                String(
                  this.state.lastError
                )
            }
          : null,

      selectedWeek:
        this.getWeekSummary(
          this.state.selectedWeekStart
        ),

      selectedMonthSummary:
        this.getMonthSummary(
          this.state.selectedMonth
        ),

      progress:
        this.getWeekProgressSummary(
          this.state.selectedWeekStart
        ),

      registries: {
        templates:
          WorkoutTemplates
            .all
            ?.length ||
          0,

        exercises:
          ExerciseRegistry
            .all
            ?.length ||
          0,

        workoutFocuses:
          WorkoutFocuses
            .all
            ?.length ||
          0,

        fitnessGoals:
          FitnessGoals
            .all
            ?.length ||
          0,

        metActivities:
          MetValues
            .all
            ?.length ||
          0
      },

      validation: {
        plan:
          WorkoutPlanStore
            .validate?.() ||
          null,

        progress:
          WorkoutProgressStore
            .validate?.() ||
          null,

        exercises:
          ExerciseRegistry
            .validate?.() ||
          null
      },

      search:
        ExerciseSearch
          .diagnostics?.() ||
        null,

      recommender:
        ExerciseRecommender
          .diagnostics?.() ||
        null,

      builder:
        WorkoutBuilder
          .diagnostics?.() ||
        null,

      api:
        WorkoutPlanApi
          .getDiagnostics?.() ||
        null
    };
  }
};

/* =====================================================
   GLOBAL API
===================================================== */

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

  Ari.training
    .workoutPlanController =
      AriTrainingWorkoutPlanController;

  globalThis.Ari =
    Ari;
}

/* =====================================================
   EXPORTS
===================================================== */

export {
  VERSION,
  SOURCE,
  DAYS,
  toLocalIsoDate,
  fromLocalIsoDate,
  addDays,
  getSundayWeekStart,
  getWeekDates,
  getMonthKey,
  getMonthDateRange,
  AriTrainingWorkoutPlanController
};

export default
  AriTrainingWorkoutPlanController;