// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-controller.js
// Version: 3.0.1
// Purpose:
//   Main orchestration layer for ARI Training planning,
//   date-specific weekly plans, workout generation,
//   exercise discovery, live sessions, local persistence,
//   and Supabase synchronization.
//
// V3.0.1:
//   - FIX: Calendar reads/writes now always resolve the exact week.
//   - FIX: setSelectedWeek() also updates WorkoutPlanStore.selectedWeekKey.
//   - FIX: get/set/clear/add/update/remove no longer fall back to a
//     weekday without also passing its calendar week.
//   - FIX: workout-plans.js can safely edit a day, then immediately
//     open Add Exercise without the day reverting to Off Day.
//   - Adds controller aliases used by workout-plans.js:
//       getSelectedWeekKey()
//       getSelectedWeek()
//       repeatPreviousWeek()
//       copyWeek()
//       clearWeek()
//   - Keeps V3 calendar planning, progress, templates, builder,
//     exercise discovery, calorie estimation and diagnostics.
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

const VERSION = "3.0.1";
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
    const parsed = fromLocalIsoDate(value);
    return parsed ? value : null;
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
  const text = normalizeText(isoDate);

  if (!ISO_DATE_PATTERN.test(text)) {
    return null;
  }

  const [year, month, day] =
    text.split("-").map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addDays(isoDate, amount) {
  const date =
    fromLocalIsoDate(
      toLocalIsoDate(isoDate)
    );

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
  const iso =
    toLocalIsoDate(value);

  const date =
    iso
      ? fromLocalIsoDate(iso)
      : null;

  if (!date) return null;

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

function getWeekKeyForDate(isoDate) {
  return getSundayWeekStart(isoDate);
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

/*
 * IMPORTANT V3.0.1:
 * workout-plan-store.js exposes getDayByDate(), but its lower-level
 * weekday methods require a week key. Every fallback below therefore
 * passes the exact Sunday week key for the requested date.
 */

function getStoreDate(isoDate) {
  const date =
    normalizeDateOrToday(isoDate);

  if (!date) return null;

  if (
    typeof WorkoutPlanStore.getDate ===
    "function"
  ) {
    return WorkoutPlanStore.getDate(date);
  }

  if (
    typeof WorkoutPlanStore.getDayByDate ===
    "function"
  ) {
    return WorkoutPlanStore.getDayByDate(date);
  }

  const weekday =
    getWeekdayIdFromDate(date);

  const weekKey =
    getWeekKeyForDate(date);

  if (
    weekday &&
    weekKey &&
    typeof WorkoutPlanStore.getDay ===
      "function"
  ) {
    return WorkoutPlanStore.getDay(
      weekday,
      weekKey
    );
  }

  return null;
}

function setStoreDate(isoDate, dayState) {
  const date =
    normalizeDateOrToday(isoDate);

  if (!date) return false;

  if (
    typeof WorkoutPlanStore.setDate ===
    "function"
  ) {
    return WorkoutPlanStore.setDate(
      date,
      dayState
    );
  }

  if (
    typeof WorkoutPlanStore.setDayByDate ===
    "function"
  ) {
    return WorkoutPlanStore.setDayByDate(
      date,
      dayState
    );
  }

  const weekday =
    getWeekdayIdFromDate(date);

  const weekKey =
    getWeekKeyForDate(date);

  if (
    weekday &&
    weekKey &&
    typeof WorkoutPlanStore.setDay ===
      "function"
  ) {
    return WorkoutPlanStore.setDay(
      weekday,
      dayState,
      weekKey
    );
  }

  return false;
}

function clearStoreDate(isoDate) {
  const date =
    normalizeDateOrToday(isoDate);

  if (!date) return false;

  if (
    typeof WorkoutPlanStore.clearDate ===
    "function"
  ) {
    return WorkoutPlanStore.clearDate(date);
  }

  const weekday =
    getWeekdayIdFromDate(date);

  const weekKey =
    getWeekKeyForDate(date);

  if (
    weekday &&
    weekKey &&
    typeof WorkoutPlanStore.clearDay ===
      "function"
  ) {
    return WorkoutPlanStore.clearDay(
      weekday,
      weekKey
    );
  }

  return false;
}

function getProgressDate(isoDate) {
  const date =
    normalizeDateOrToday(isoDate);

  if (!date) return null;

  if (
    typeof WorkoutProgressStore.getDate ===
    "function"
  ) {
    return WorkoutProgressStore.getDate(date);
  }

  if (
    typeof WorkoutProgressStore.getDayByDate ===
    "function"
  ) {
    return WorkoutProgressStore.getDayByDate(date);
  }

  if (
    typeof WorkoutProgressStore.getDay ===
      "function"
  ) {
    return WorkoutProgressStore.getDay(date);
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

    /*
     * Keep the plan store and controller on the same week.
     */
    WorkoutPlanStore.setSelectedWeek?.(
      this.state.selectedWeekStart
    );

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

            const storedSelected =
              WorkoutPlanStore
                .getSelectedWeekKey?.();

            if (storedSelected) {
              this.state.selectedWeekStart =
                getSundayWeekStart(
                  storedSelected
                );
            }

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

      const storedSelected =
        WorkoutPlanStore
          .getSelectedWeekKey?.();

      if (storedSelected) {
        this.state.selectedWeekStart =
          getSundayWeekStart(
            storedSelected
          );

        this.state.selectedDate =
          this.state.selectedWeekStart;

        this.state.selectedMonth =
          getMonthKey(
            this.state.selectedWeekStart
          );
      }

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

            /*
             * A remote response must not silently move the user
             * away from the week currently being edited.
             */
            WorkoutPlanStore.setSelectedWeek?.(
              this.state.selectedWeekStart
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

    const weekStart =
      getSundayWeekStart(isoDate);

    this.state.selectedDate =
      isoDate;

    this.state.selectedWeekStart =
      weekStart;

    this.state.selectedMonth =
      getMonthKey(isoDate);

    /*
     * Critical V3.0.1 sync.
     */
    WorkoutPlanStore.setSelectedWeek?.(
      weekStart
    );

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(
            WorkoutPlanStore
              .getState?.() ||
            {}
          ),
        weekKey:
          weekStart,
        resetIfChanged:
          false
      });

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

    /*
     * This was the missing link between controller and store.
     */
    WorkoutPlanStore.setSelectedWeek?.(
      weekStart
    );

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(
            WorkoutPlanStore
              .getState?.() ||
            {}
          ),
        weekKey:
          weekStart,
        resetIfChanged:
          false
      });

    return this.getWeek(
      weekStart
    );
  },

  getSelectedDate() {
    return this.state.selectedDate;
  },

  getSelectedWeekStart() {
    return this.state.selectedWeekStart;
  },

  /*
   * Alias expected by workout-plans.js.
   */
  getSelectedWeekKey() {
    return this.state.selectedWeekStart;
  },

  /*
   * Alias expected by workout-plans.js.
   */
  getSelectedWeek() {
    return this.getWeek(
      this.state.selectedWeekStart
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

    if (
      typeof WorkoutPlanStore.getWeek ===
      "function"
    ) {
      const week =
        WorkoutPlanStore.getWeek(
          startDate
        );

      if (week) {
        return {
          ...week,
          weekStart:
            week.weekStart ||
            week.startDate ||
            week.weekKey ||
            startDate,
          weekEnd:
            week.weekEnd ||
            week.endDate ||
            addDays(
              startDate,
              6
            )
        };
      }
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
      weekStart:
        startDate,
      weekEnd:
        addDays(
          startDate,
          6
        ),
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

    return this.getWeekSummary(
      this.state.selectedWeekStart
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
        week?.startDate ||
        week?.weekKey ||
        getSundayWeekStart(anchor),

      weekEnd:
        week?.weekEnd ||
        week?.endDate ||
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
        name,
        this.state.selectedWeekStart
      ) ||
      false;
  },

  setPrimaryGoal(goalId) {
    const goal =
      FitnessGoals.get(goalId);

    if (!goal) return false;

    return WorkoutPlanStore
      .setPrimaryGoal?.(
        goal.id,
        this.state.selectedWeekStart
      ) ||
      false;
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
        validIds,
        this.state.selectedWeekStart
      ) ||
      false;
  },

  /* ===================================================
     DATE-SPECIFIC PLAN EDITING
  =================================================== */

  setDate(date, patch = {}) {
    const isoDate =
      normalizeDateOrToday(date);

    const current =
      this.getDate(isoDate);

    const result =
      setStoreDate(
        isoDate,
        {
          ...current,
          ...clone(patch),
          date:
            isoDate,
          day:
            getWeekdayIdFromDate(
              isoDate
            )
        }
      );

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },

  setDateType(date, type) {
    const isoDate =
      normalizeDateOrToday(date);

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
        isoDate
      );
    }

    const current =
      this.getDate(isoDate);

    return this.setDate(
      isoDate,
      {
        type:
          validType,

        focusId:
          validType === "recovery"
            ? (
                current?.focusId &&
                current.focusId !== "off_day"
                  ? current.focusId
                  : "active_recovery"
              )
            : (
                current?.focusId ===
                  "off_day"
                  ? "custom"
                  : current?.focusId ||
                    "custom"
              ),

        title:
          validType === "recovery"
            ? (
                current?.title &&
                current.title !== "Off Day"
                  ? current.title
                  : "Active Recovery"
              )
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
    const isoDate =
      normalizeDateOrToday(date);

    const focus =
      WorkoutFocuses.get(
        focusId
      );

    if (!focus) return false;

    if (focus.id === "off_day") {
      return this.clearDate(
        isoDate
      );
    }

    return this.setDate(
      isoDate,
      {
        type:
          focus.category ===
            "recovery"
            ? "recovery"
            : "workout",
        focusId:
          focus.id,
        title:
          focus.label
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
        title:
          normalized
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

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },

  clearWeekPlan(anchor = this.state.selectedWeekStart) {
    const startDate =
      getSundayWeekStart(anchor);

    if (!startDate) return false;

    let result =
      false;

    if (
      typeof WorkoutPlanStore.clearWeek ===
      "function"
    ) {
      result =
        WorkoutPlanStore.clearWeek(
          startDate
        );
    } else {
      for (
        const item
        of getWeekDates(startDate)
      ) {
        result =
          clearStoreDate(item.date) ||
          result;
      }
    }

    if (result) {
      this.syncProgressWithPlan();
    }

    return result;
  },

  /*
   * Alias used by workout-plans.js.
   */
  clearWeek(anchor = this.state.selectedWeekStart) {
    return this.clearWeekPlan(anchor);
  },

  clearMonthPlan(value = this.state.selectedMonth) {
    const range =
      getMonthDateRange(value);

    if (!range) return false;

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

    if (changed) {
      this.syncProgressWithPlan();
    }

    return changed;
  },

  /* ===================================================
     WEEK COPY / REPEAT
  =================================================== */

  copyWeek(
    sourceWeekValue,
    targetWeekValue,
    options = {}
  ) {
    if (
      typeof sourceWeekValue ===
        "object" &&
      sourceWeekValue
    ) {
      const config =
        sourceWeekValue;

      return this.copyWeek(
        config.fromWeekKey ||
        config.sourceWeekKey,
        config.toWeekKey ||
        config.targetWeekKey,
        config
      );
    }

    const source =
      getSundayWeekStart(
        sourceWeekValue
      );

    const target =
      getSundayWeekStart(
        targetWeekValue
      );

    if (!source || !target) {
      return false;
    }

    const result =
      WorkoutPlanStore.copyWeek?.(
        source,
        target,
        options
      ) ||
      false;

    if (result) {
      this.syncProgressWithPlan();
    }

    return result;
  },

  repeatPreviousWeek(
    targetWeekValue =
      this.state.selectedWeekStart,
    options = {}
  ) {
    const target =
      getSundayWeekStart(
        targetWeekValue
      );

    if (!target) return false;

    const result =
      WorkoutPlanStore
        .repeatPreviousWeek?.(
          target,
          options
        ) ||
      false;

    if (result) {
      this.syncProgressWithPlan();
    }

    return result;
  },

  repeatLastWeek(
    targetWeekValue =
      this.state.selectedWeekStart,
    options = {}
  ) {
    return this.repeatPreviousWeek(
      targetWeekValue,
      options
    );
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
      exerciseId:
        exercise.id,
      ...clone(options)
    };

    let result =
      false;

    if (
      typeof WorkoutPlanStore.addExerciseToDate ===
      "function"
    ) {
      result =
        WorkoutPlanStore.addExerciseToDate(
          isoDate,
          entry
        );
    } else if (
      typeof WorkoutPlanStore.addExercise ===
      "function"
    ) {
      result =
        WorkoutPlanStore.addExercise(
          getWeekdayIdFromDate(
            isoDate
          ),
          entry,
          getWeekKeyForDate(
            isoDate
          )
        );
    }

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result || false;
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

    let result =
      false;

    if (
      typeof WorkoutPlanStore.updateExerciseOnDate ===
      "function"
    ) {
      result =
        WorkoutPlanStore.updateExerciseOnDate(
          isoDate,
          index,
          patch
        );
    } else if (
      typeof WorkoutPlanStore.updateExercise ===
      "function"
    ) {
      result =
        WorkoutPlanStore.updateExercise(
          getWeekdayIdFromDate(
            isoDate
          ),
          index,
          patch,
          getWeekKeyForDate(
            isoDate
          )
        );
    }

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result || false;
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

    let result =
      false;

    if (
      typeof WorkoutPlanStore.removeExerciseFromDate ===
      "function"
    ) {
      result =
        WorkoutPlanStore.removeExerciseFromDate(
          isoDate,
          index
        );
    } else if (
      typeof WorkoutPlanStore.removeExercise ===
      "function"
    ) {
      result =
        WorkoutPlanStore.removeExercise(
          getWeekdayIdFromDate(
            isoDate
          ),
          index,
          getWeekKeyForDate(
            isoDate
          )
        );
    }

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result || false;
  },

  /* ===================================================
     TEMPLATES
  =================================================== */

  applyTemplate(
    templateId,
    options = {}
  ) {
    const template =
      WorkoutTemplates.get(
        templateId
      );

    if (!template) return false;

    /*
     * Support both:
     *   applyTemplate(id, "2026-08-09")
     * and
     *   applyTemplate(id, { weekStart: "2026-08-09" })
     */
    const requestedWeek =
      typeof options ===
        "string"
        ? options
        : (
            options.weekStart ||
            options.weekKey ||
            this.state.selectedWeekStart
          );

    const targetWeekStart =
      getSundayWeekStart(
        requestedWeek
      );

    if (!targetWeekStart) {
      return false;
    }

    const templateCopy =
      WorkoutTemplates.clone(
        template.id
      );

    let applied =
      false;

    if (
      typeof WorkoutPlanStore.applyTemplateToWeek ===
      "function"
    ) {
      applied =
        WorkoutPlanStore.applyTemplateToWeek(
          templateCopy,
          targetWeekStart
        );
    } else if (
      typeof WorkoutPlanStore.applyTemplate ===
      "function"
    ) {
      applied =
        WorkoutPlanStore.applyTemplate(
          templateCopy,
          {
            weekKey:
              targetWeekStart
          }
        );
    }

    if (applied) {
      this.setSelectedWeek(
        targetWeekStart
      );

      this.syncProgressWithPlan();
    }

    return applied || false;
  },

  applyTemplateToWeek(
    templateId,
    weekStart
  ) {
    return this.applyTemplate(
      templateId,
      {
        weekStart
      }
    );
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
    const selectedWeek =
      this.getWeek(
        this.state.selectedWeekStart
      ) ||
      {};

    const primaryGoalId =
      selectedWeek
        .primaryGoalId ||
      null;

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

    const selectedWeek =
      this.getWeek(
        getSundayWeekStart(date)
      ) ||
      {};

    return this.getRecommendedExercises({
      goal:
        dayState.goal ||
        selectedWeek
          .primaryGoalId,

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
    const selectedWeek =
      this.getWeek(
        this.state.selectedWeekStart
      ) ||
      {};

    const workout =
      WorkoutBuilder.build({
        goal:
          options.goal ||
          selectedWeek
            .primaryGoalId ||
          "general_fitness",

        secondaryGoals:
          options.secondaryGoals ||
          selectedWeek
            .secondaryGoalIds,

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

    const week =
      this.getWeek(
        getSundayWeekStart(
          isoDate
        )
      ) ||
      {};

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
        week.primaryGoalId ||
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

    let result =
      false;

    if (
      typeof WorkoutPlanStore.setBuiltWorkoutForDate ===
      "function"
    ) {
      result =
        WorkoutPlanStore
          .setBuiltWorkoutForDate(
            isoDate,
            workout,
            options
          );
    } else if (
      typeof WorkoutPlanStore.setBuiltWorkout ===
      "function"
    ) {
      result =
        WorkoutPlanStore.setBuiltWorkout(
          getWeekdayIdFromDate(
            isoDate
          ),
          workout,
          {
            ...options,
            weekKey:
              getWeekKeyForDate(
                isoDate
              )
          }
        );
    }

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result || false;
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
        date:
          isoDate,
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
        date:
          isoDate,
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

    const selectedWeekKey =
      this.state.selectedWeekStart ||
      this.getCurrentWeekKey();

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(plan),

        weekKey:
          selectedWeekKey,

        resetIfChanged:
          false
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
        selectedWeekKey
      );

    if (
      typeof WorkoutProgressStore.syncWeekWithPlan ===
      "function"
    ) {
      return WorkoutProgressStore.syncWeekWithPlan(
        selectedWeek?.days ||
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
          isoDate
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
    const weekKey =
      getSundayWeekStart(anchor);

    if (
      typeof WorkoutProgressStore.getWeekSummaryByDate ===
      "function"
    ) {
      return WorkoutProgressStore.getWeekSummaryByDate(
        weekKey
      );
    }

    return (
      WorkoutProgressStore
        .getWeekSummary?.(
          weekKey
        ) ||
      null
    );
  },

  /* ===================================================
     SESSION LIFECYCLE
  =================================================== */

  startWorkout(date = new Date()) {
    const isoDate =
      normalizeDateOrToday(date);

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
          isoDate
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
          isoDate
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
          isoDate
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
          isoDate,
          options
        ) ||
      false
    );
  },

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
        isoDate
      );
    }

    return (
      WorkoutProgressStore
        .resetDay?.(
          isoDate
        ) ||
      false
    );
  },

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

    if (
      sessionId &&
      typeof WorkoutProgressStore.deleteSessionRecord ===
        "function"
    ) {
      return WorkoutProgressStore
        .deleteSessionRecord(
          sessionId
        );
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
          isoDate
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
          isoDate,
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
          isoDate,
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
          isoDate,
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
          isoDate,
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
          isoDate,
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
          isoDate,
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
          isoDate
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

    this.state.selectedDate =
      toLocalIsoDate(
        new Date()
      );

    this.state.selectedWeekStart =
      getSundayWeekStart(
        new Date()
      );

    this.state.selectedMonth =
      getMonthKey(
        new Date()
      );

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

    this.state.selectedDate =
      toLocalIsoDate(
        new Date()
      );

    this.state.selectedWeekStart =
      getSundayWeekStart(
        new Date()
      );

    this.state.selectedMonth =
      getMonthKey(
        new Date()
      );

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
          isoDate
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
      source:
        SOURCE,
      version:
        VERSION,
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

      selectedWeekKey:
        this.getSelectedWeekKey(),

      storeSelectedWeekKey:
        WorkoutPlanStore
          .getSelectedWeekKey?.() ||
        null,

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
