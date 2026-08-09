// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-controller.js
// Version: 3.1.0
// Purpose:
//   Main orchestration layer for ARI Training planning,
//   date-specific weekly plans, workout generation,
//   exercise discovery, live sessions, local persistence,
//   and Supabase synchronization.
//
// V3.1.0:
//   - Aligns controller exactly with workout-plan-store.js V3.
//   - Aligns controller exactly with workout-progress-store.js V3.
//   - Keeps controller + store selectedWeekKey synchronized.
//   - Passes the selected week into ALL weekday plan mutations.
//   - Uses real YYYY-MM-DD dates for progress/session actions.
//   - Fixes Add Exercise incorrectly seeing the day as Off Day.
//   - Fixes week navigation / editing targeting the wrong week.
//   - Adds page compatibility methods used by workout-plans.js.
//   - Fixes template apply / repeat / clear week signatures.
//   - Keeps permanent plans separate from live workout progress.
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

const VERSION = "3.1.0";
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

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;


// =====================================================
// BASIC HELPERS
// =====================================================

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}


function normalizeId(value) {
  return normalizeText(value) || null;
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
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof structuredClone ===
    "function"
  ) {
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


function pad2(value) {
  return String(value)
    .padStart(2, "0");
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


function toLocalIsoDate(
  value = new Date()
) {
  if (
    typeof value === "string" &&
    ISO_DATE_PATTERN.test(value)
  ) {
    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);

    const candidate =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    ) {
      return value;
    }

    return null;
  }

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return (
    `${date.getFullYear()}-` +
    `${pad2(date.getMonth() + 1)}-` +
    `${pad2(date.getDate())}`
  );
}


function fromLocalIsoDate(
  isoDate
) {
  const text =
    normalizeText(isoDate);

  if (
    !ISO_DATE_PATTERN.test(text)
  ) {
    return null;
  }

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
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}


function addDays(
  isoDate,
  amount
) {
  const date =
    fromLocalIsoDate(
      toLocalIsoDate(isoDate)
    );

  if (!date) {
    return null;
  }

  date.setDate(
    date.getDate() +
    Number(amount || 0)
  );

  return toLocalIsoDate(date);
}


function getWeekdayIdFromDate(
  value = new Date()
) {
  const isoDate =
    toLocalIsoDate(value);

  const date =
    fromLocalIsoDate(isoDate);

  if (!date) {
    return null;
  }

  return DAYS[
    date.getDay()
  ] || null;
}


function getSundayWeekStart(
  value = new Date()
) {
  const isoDate =
    toLocalIsoDate(value);

  const date =
    fromLocalIsoDate(isoDate);

  if (!date) {
    return null;
  }

  date.setDate(
    date.getDate() -
    date.getDay()
  );

  return toLocalIsoDate(date);
}


function getWeekDates(
  anchor = new Date()
) {
  const startDate =
    getSundayWeekStart(anchor);

  if (!startDate) {
    return [];
  }

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


function getMonthKey(
  value = new Date()
) {
  const iso =
    toLocalIsoDate(value);

  return iso
    ? iso.slice(0, 7)
    : null;
}


function getMonthDateRange(
  value = new Date()
) {
  let date =
    null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}$/.test(value)
  ) {
    date =
      new Date(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        1
      );
  } else {
    const iso =
      toLocalIsoDate(value);

    date =
      fromLocalIsoDate(iso);
  }

  if (!date) {
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
      `${first.getFullYear()}-${pad2(
        first.getMonth() + 1
      )}`,

    startDate:
      toLocalIsoDate(first),

    endDate:
      toLocalIsoDate(last)
  };
}


function normalizeDateOrToday(
  value = null
) {
  return (
    toLocalIsoDate(
      value || new Date()
    ) ||
    toLocalIsoDate(new Date())
  );
}


function normalizeWeekKey(
  value = null
) {
  return (
    getSundayWeekStart(
      value ||
      new Date()
    ) ||
    getSundayWeekStart(new Date())
  );
}


function getPlanContextKey(
  plan
) {
  return (
    plan?.planId ||
    "calendar-plan"
  );
}


function hasPlannedExercises(
  dayState
) {
  return Boolean(
    Array.isArray(
      dayState?.exercises
    ) &&
    dayState.exercises.length > 0
  );
}


// =====================================================
// CONTROLLER
// =====================================================

const AriTrainingWorkoutPlanController = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    loading:
      false,

    saving:
      false,

    remoteAvailable:
      false,

    lastLoadSource:
      null,

    lastSavedAt:
      null,

    lastBuiltWorkout:
      null,

    lastError:
      null,

    selectedDate:
      toLocalIsoDate(new Date()),

    selectedWeekStart:
      getSundayWeekStart(new Date()),

    selectedMonth:
      getMonthKey(new Date()),

    unsubscribePlan:
      null,

    unsubscribeProgress:
      null
  },


  // ===================================================
  // CONFIGURATION / INIT
  // ===================================================

  configure({
    client = null,
    tables = null
  } = {}) {
    if (
      client ||
      tables
    ) {
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


  async init(
    options = {}
  ) {
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

    WorkoutProgressStore
      .hydrate?.();

    await this.load();

    /*
     * IMPORTANT:
     * Controller and V3 plan store must agree on selected week.
     */
    const storeWeekKey =
      WorkoutPlanStore
        .getSelectedWeekKey?.();

    const selectedWeek =
      normalizeWeekKey(
        storeWeekKey ||
        this.state.selectedWeekStart ||
        new Date()
      );

    this.state.selectedWeekStart =
      selectedWeek;

    this.state.selectedDate =
      this.state.selectedDate &&
      getSundayWeekStart(
        this.state.selectedDate
      ) === selectedWeek
        ? this.state.selectedDate
        : selectedWeek;

    this.state.selectedMonth =
      getMonthKey(selectedWeek);

    WorkoutPlanStore
      .setSelectedWeek?.(
        selectedWeek
      );

    this.syncProgressWithPlan();
    this.bindInternalSubscriptions();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },


  bindInternalSubscriptions() {
    if (
      !this.state.unsubscribePlan &&
      typeof WorkoutPlanStore
        .subscribe ===
        "function"
    ) {
      this.state.unsubscribePlan =
        WorkoutPlanStore.subscribe(
          () => {
            const storeWeekKey =
              WorkoutPlanStore
                .getSelectedWeekKey?.();

            if (storeWeekKey) {
              this.state
                .selectedWeekStart =
                  storeWeekKey;

              this.state
                .selectedMonth =
                  getMonthKey(
                    storeWeekKey
                  );
            }

            this.syncProgressWithPlan();
          }
        );
    }
  },


  destroy() {
    if (
      typeof this.state
        .unsubscribePlan ===
        "function"
    ) {
      this.state
        .unsubscribePlan();
    }

    if (
      typeof this.state
        .unsubscribeProgress ===
        "function"
    ) {
      this.state
        .unsubscribeProgress();
    }

    this.state.unsubscribePlan =
      null;

    this.state.unsubscribeProgress =
      null;

    this.state.initialized =
      false;

    return true;
  },


  // ===================================================
  // LOAD / SAVE
  // ===================================================

  async load() {
    if (
      this.state.loading
    ) {
      return WorkoutPlanStore
        .getState?.();
    }

    this.state.loading =
      true;

    this.state.lastError =
      null;

    try {
      if (
        this.state.remoteAvailable
      ) {
        try {
          const remotePlan =
            await WorkoutPlanApi
              .loadPlan();

          if (remotePlan) {
            WorkoutPlanStore
              .replaceState?.(
                remotePlan
              );

            WorkoutPlanStore
              .save?.();

            const remoteSelectedWeek =
              WorkoutPlanStore
                .getSelectedWeekKey?.();

            if (remoteSelectedWeek) {
              this.state
                .selectedWeekStart =
                  remoteSelectedWeek;

              this.state
                .selectedMonth =
                  getMonthKey(
                    remoteSelectedWeek
                  );
            }

            this.state.lastLoadSource =
              "supabase";

            this.syncProgressWithPlan();

            return WorkoutPlanStore
              .getState?.();
          }
        } catch (
          error
        ) {
          console.warn(
            "[ARI Training] Remote workout plan did not load. Falling back locally.",
            error
          );

          this.state.lastError =
            error;
        }
      }

      const hydrated =
        WorkoutPlanStore
          .hydrate?.();

      const localSelectedWeek =
        WorkoutPlanStore
          .getSelectedWeekKey?.();

      if (localSelectedWeek) {
        this.state
          .selectedWeekStart =
            localSelectedWeek;

        this.state
          .selectedMonth =
            getMonthKey(
              localSelectedWeek
            );
      }

      this.state.lastLoadSource =
        hydrated
          ? "local"
          : "default";

      this.syncProgressWithPlan();

      return WorkoutPlanStore
        .getState?.();
    } finally {
      this.state.loading =
        false;
    }
  },


  async save({
    remote = true,
    weekKey = null
  } = {}) {
    if (
      this.state.saving
    ) {
      return false;
    }

    this.state.saving =
      true;

    this.state.lastError =
      null;

    try {
      if (weekKey) {
        this.setSelectedWeek(
          weekKey
        );
      }

      WorkoutPlanStore
        .save?.();

      if (
        remote &&
        this.state.remoteAvailable
      ) {
        try {
          const saved =
            await WorkoutPlanApi
              .savePlan({
                plan:
                  WorkoutPlanStore
                    .getState?.()
              });

          /*
           * Only replace when API actually returns
           * a complete plan-shaped object.
           */
          if (
            saved &&
            typeof saved === "object" &&
            (
              saved.weeks ||
              saved.schemaVersion ||
              saved.selectedWeekKey
            )
          ) {
            WorkoutPlanStore
              .replaceState?.(
                saved
              );

            WorkoutPlanStore
              .save?.();
          }
        } catch (
          error
        ) {
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
        new Date()
          .toISOString();

      this.syncProgressWithPlan();

      return true;
    } finally {
      this.state.saving =
        false;
    }
  },


  // ===================================================
  // CALENDAR SELECTION
  // ===================================================

  setSelectedDate(
    date
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    this.state.selectedDate =
      isoDate;

    this.state.selectedWeekStart =
      weekKey;

    this.state.selectedMonth =
      getMonthKey(
        isoDate
      );

    WorkoutPlanStore
      .setSelectedWeek?.(
        weekKey
      );

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(
            WorkoutPlanStore
              .getState?.()
          ),

        weekKey,

        resetIfChanged:
          false
      });

    return isoDate;
  },


  setSelectedWeek(
    value
  ) {
    const weekKey =
      normalizeWeekKey(
        value
      );

    if (!weekKey) {
      return null;
    }

    this.state.selectedWeekStart =
      weekKey;

    this.state.selectedDate =
      weekKey;

    this.state.selectedMonth =
      getMonthKey(
        weekKey
      );

    /*
     * CRITICAL FIX:
     * Keep V3 plan store's selectedWeekKey synchronized.
     */
    WorkoutPlanStore
      .setSelectedWeek?.(
        weekKey
      );

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(
            WorkoutPlanStore
              .getState?.()
          ),

        weekKey,

        resetIfChanged:
          false
      });

    return this.getWeek(
      weekKey
    );
  },


  selectWeek(
    value
  ) {
    return this.setSelectedWeek(
      value
    );
  },


  loadWeek(
    value
  ) {
    return this.setSelectedWeek(
      value
    );
  },


  setSelectedMonth(
    value
  ) {
    const range =
      getMonthDateRange(
        value
      );

    if (!range) {
      return null;
    }

    this.state.selectedMonth =
      range.monthKey;

    return this.getMonth(
      range.monthKey
    );
  },


  getSelectedDate() {
    return this.state
      .selectedDate;
  },


  getSelectedWeekStart() {
    return this.state
      .selectedWeekStart;
  },


  getSelectedWeekKey() {
    return (
      WorkoutPlanStore
        .getSelectedWeekKey?.() ||
      this.state.selectedWeekStart
    );
  },


  getSelectedMonth() {
    return this.state
      .selectedMonth;
  },


  // ===================================================
  // PLAN READS
  // ===================================================

  getPlan() {
    return WorkoutPlanStore
      .getState?.();
  },


  getDate(
    date =
      this.state.selectedDate
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const stored =
      WorkoutPlanStore
        .getDayByDate?.(
          isoDate
        );

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
      date:
        isoDate,

      day:
        getWeekdayIdFromDate(
          isoDate
        ),

      type:
        "off",

      focusId:
        "off_day",

      title:
        "Off Day",

      exercises:
        [],

      metadata: {
        implicitOffDay:
          true
      }
    };
  },


  getToday() {
    return this.getDate(
      new Date()
    );
  },


  getWeek(
    anchor =
      this.state.selectedWeekStart
  ) {
    const weekKey =
      normalizeWeekKey(
        anchor
      );

    if (!weekKey) {
      return null;
    }

    const week =
      WorkoutPlanStore
        .getWeek?.(
          weekKey
        );

    if (week) {
      return week;
    }

    const days = {};

    for (
      const item
      of getWeekDates(
        weekKey
      )
    ) {
      days[
        item.day
      ] =
        this.getDate(
          item.date
        );
    }

    return {
      weekKey,

      startDate:
        weekKey,

      endDate:
        addDays(
          weekKey,
          6
        ),

      days
    };
  },


  getSelectedWeek() {
    return this.getWeek(
      this.getSelectedWeekKey()
    );
  },


  getWeekByKey(
    weekKey
  ) {
    return this.getWeek(
      weekKey
    );
  },


  getMonth(
    value =
      this.state.selectedMonth
  ) {
    const range =
      getMonthDateRange(
        value
      );

    if (!range) {
      return null;
    }

    const dates = [];

    let cursor =
      range.startDate;

    while (
      cursor &&
      cursor <=
        range.endDate
    ) {
      dates.push(
        this.getDate(
          cursor
        )
      );

      cursor =
        addDays(
          cursor,
          1
        );
    }

    return {
      ...range,
      dates
    };
  },


  getDay(
    dayOrDate,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    if (
      ISO_DATE_PATTERN.test(
        normalizeText(
          dayOrDate
        )
      )
    ) {
      return this.getDate(
        dayOrDate
      );
    }

    const day =
      normalizeDay(
        dayOrDate
      );

    if (!day) {
      return null;
    }

    return WorkoutPlanStore
      .getDay?.(
        day,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      null;
  },


  getSelectedDay(
    day
  ) {
    return this.getDay(
      day,
      this.getSelectedWeekKey()
    );
  },


  getDayForWeek(
    weekKey,
    day
  ) {
    return this.getDay(
      day,
      weekKey
    );
  },


  getSummary(
    options = {}
  ) {
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
      options.weekStart ||
      options.weekKey
    ) {
      return this.getWeekSummary(
        options.week ||
        options.weekStart ||
        options.weekKey
      );
    }

    return this.getWeekSummary(
      this.getSelectedWeekKey()
    );
  },


  getWeekSummary(
    anchor =
      this.getSelectedWeekKey()
  ) {
    const week =
      this.getWeek(
        anchor
      );

    const dayStates =
      DAYS
        .map(
          day =>
            week
              ?.days?.[
                day
              ]
        )
        .filter(Boolean);

    return {
      weekKey:
        week?.weekKey ||
        normalizeWeekKey(
          anchor
        ),

      weekStart:
        week?.startDate ||
        normalizeWeekKey(
          anchor
        ),

      weekEnd:
        week?.endDate ||
        addDays(
          normalizeWeekKey(
            anchor
          ),
          6
        ),

      trainingDayCount:
        dayStates.filter(
          day =>
            day.type ===
            "workout"
        ).length,

      recoveryDayCount:
        dayStates.filter(
          day =>
            day.type ===
            "recovery"
        ).length,

      offDayCount:
        dayStates.filter(
          day =>
            day.type ===
            "off"
        ).length,

      exerciseCount:
        dayStates.reduce(
          (
            total,
            day
          ) =>
            total +
            (
              day.exercises
                ?.length ||
              0
            ),
          0
        )
    };
  },


  getMonthSummary(
    value =
      this.state.selectedMonth
  ) {
    const month =
      this.getMonth(
        value
      );

    const dates =
      month?.dates ||
      [];

    return {
      monthKey:
        month?.monthKey ||
        getMonthKey(
          value
        ),

      trainingDayCount:
        dates.filter(
          day =>
            day.type ===
            "workout"
        ).length,

      recoveryDayCount:
        dates.filter(
          day =>
            day.type ===
            "recovery"
        ).length,

      offDayCount:
        dates.filter(
          day =>
            day.type ===
            "off"
        ).length,

      plannedExerciseCount:
        dates.reduce(
          (
            total,
            day
          ) =>
            total +
            (
              day.exercises
                ?.length ||
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


  // ===================================================
  // START / PLAN ROUTING
  // ===================================================

  canStartWorkout(
    date = new Date()
  ) {
    const dayState =
      this.getDate(
        date
      );

    return Boolean(
      dayState &&
      dayState.type ===
        "workout" &&
      hasPlannedExercises(
        dayState
      )
    );
  },


  needsWorkoutPlan(
    date = new Date()
  ) {
    return !this.canStartWorkout(
      date
    );
  },


  getPrimaryDayAction(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const dayState =
      this.getDate(
        isoDate
      );

    if (
      this.canStartWorkout(
        isoDate
      )
    ) {
      return {
        action:
          "start_workout",

        label:
          "Start Workout",

        date:
          isoDate,

        dayState
      };
    }

    return {
      action:
        "plan_workout",

      label:
        "Plan Workout",

      date:
        isoDate,

      href:
        `workout-plans.html?date=${encodeURIComponent(
          isoDate
        )}`,

      dayState
    };
  },


  // ===================================================
  // PLAN METADATA
  // ===================================================

  setPlanName(
    name,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return WorkoutPlanStore
      .setPlanName?.(
        name,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  setPrimaryGoal(
    goalId,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const goal =
      FitnessGoals.get(
        goalId
      );

    if (!goal) {
      return false;
    }

    return WorkoutPlanStore
      .setPrimaryGoal?.(
        goal.id,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  setSecondaryGoals(
    goalIds = [],
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const validIds =
      Array.isArray(
        goalIds
      )
        ? goalIds
            .map(
              goalId =>
                FitnessGoals
                  .get(
                    goalId
                  )
                  ?.id ||
                null
            )
            .filter(Boolean)
        : [];

    return WorkoutPlanStore
      .setSecondaryGoals?.(
        validIds,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  // ===================================================
  // DATE-SPECIFIC PLAN EDITING
  // ===================================================

  setDate(
    date,
    patch = {}
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    const current =
      WorkoutPlanStore
        .getDay?.(
          day,
          weekKey
        ) ||
      this.getDate(
        isoDate
      );

    const result =
      WorkoutPlanStore
        .setDay?.(
          day,
          {
            ...current,
            ...clone(
              patch
            ),

            day,
            date:
              isoDate
          },
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  setDateType(
    date,
    type
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    const normalizedType =
      normalizeText(
        type
      )
        .toLowerCase();

    const validType =
      [
        "workout",
        "recovery",
        "off"
      ].includes(
        normalizedType
      )
        ? normalizedType
        : "off";

    const result =
      WorkoutPlanStore
        .setDayType?.(
          day,
          validType,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  setDateFocus(
    date,
    focusId
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    const focus =
      WorkoutFocuses.get(
        focusId
      );

    if (
      !weekKey ||
      !day ||
      !focus
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .setDayFocus?.(
          day,
          focus.id,
          focus.label,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  setDateTitle(
    date,
    title
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    const normalized =
      normalizeText(
        title
      );

    if (
      !weekKey ||
      !day ||
      !normalized
    ) {
      return false;
    }

    return WorkoutPlanStore
      .setDayTitle?.(
        day,
        normalized,
        weekKey
      ) ||
      false;
  },


  setDateGoal(
    date,
    goalId
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    return WorkoutPlanStore
      .setDayGoal?.(
        day,
        goalId,
        weekKey
      ) ||
      false;
  },


  setDateSport(
    date,
    sportId
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    return WorkoutPlanStore
      .setDaySport?.(
        day,
        sportId,
        weekKey
      ) ||
      false;
  },


  setDateDuration(
    date,
    minutes
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    return WorkoutPlanStore
      .setDayDuration?.(
        day,
        minutes,
        weekKey
      ) ||
      false;
  },


  clearDate(
    date
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    if (
      !weekKey ||
      !day
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .clearDay?.(
          day,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  clearWeekPlan(
    anchor =
      this.getSelectedWeekKey()
  ) {
    const weekKey =
      normalizeWeekKey(
        anchor
      );

    if (!weekKey) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .clearWeek?.(
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressWithPlan();
    }

    return result;
  },


  clearWeek(
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return this.clearWeekPlan(
      weekValue
    );
  },


  clearSelectedWeek() {
    return this.clearWeekPlan(
      this.getSelectedWeekKey()
    );
  },


  clearMonthPlan(
    value =
      this.state.selectedMonth
  ) {
    const range =
      getMonthDateRange(
        value
      );

    if (!range) {
      return false;
    }

    let changed =
      false;

    let cursor =
      range.startDate;

    while (
      cursor &&
      cursor <=
        range.endDate
    ) {
      changed =
        this.clearDate(
          cursor
        ) ||
        changed;

      cursor =
        addDays(
          cursor,
          1
        );
    }

    this.syncProgressWithPlan();

    return changed;
  },


  // ===================================================
  // WEEKDAY COMPATIBILITY
  // ===================================================

  getDateForWeekday(
    day,
    anchor =
      this.getSelectedWeekKey()
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    if (!normalizedDay) {
      return null;
    }

    const weekKey =
      normalizeWeekKey(
        anchor
      );

    if (!weekKey) {
      return null;
    }

    return WorkoutPlanStore
      .getDayDateForWeek?.(
        weekKey,
        normalizedDay
      ) ||
      addDays(
        weekKey,
        DAYS.indexOf(
          normalizedDay
        )
      );
  },


  setDayType(
    day,
    type,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    const weekKey =
      normalizeWeekKey(
        weekValue
      );

    if (
      !normalizedDay ||
      !weekKey
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .setDayType?.(
          normalizedDay,
          type,
          weekKey
        ) ||
      false;

    if (result) {
      const date =
        this.getDateForWeekday(
          normalizedDay,
          weekKey
        );

      this.syncProgressDateWithPlan(
        date
      );
    }

    return result;
  },


  setDayFocus(
    day,
    focusId,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    const weekKey =
      normalizeWeekKey(
        weekValue
      );

    const focus =
      WorkoutFocuses.get(
        focusId
      );

    if (
      !normalizedDay ||
      !weekKey ||
      !focus
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .setDayFocus?.(
          normalizedDay,
          focus.id,
          focus.label,
          weekKey
        ) ||
      false;

    if (result) {
      const date =
        this.getDateForWeekday(
          normalizedDay,
          weekKey
        );

      this.syncProgressDateWithPlan(
        date
      );
    }

    return result;
  },


  setDayTitle(
    day,
    title,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return WorkoutPlanStore
      .setDayTitle?.(
        normalizeDay(day),
        title,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  setDayGoal(
    day,
    goalId,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return WorkoutPlanStore
      .setDayGoal?.(
        normalizeDay(day),
        goalId,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  setDaySport(
    day,
    sportId,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return WorkoutPlanStore
      .setDaySport?.(
        normalizeDay(day),
        sportId,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  setDayDuration(
    day,
    minutes,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    return WorkoutPlanStore
      .setDayDuration?.(
        normalizeDay(day),
        minutes,
        normalizeWeekKey(
          weekValue
        )
      ) ||
      false;
  },


  clearDay(
    day,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    const weekKey =
      normalizeWeekKey(
        weekValue
      );

    if (
      !normalizedDay ||
      !weekKey
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .clearDay?.(
          normalizedDay,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        this.getDateForWeekday(
          normalizedDay,
          weekKey
        )
      );
    }

    return result;
  },


  // ===================================================
  // EXERCISE PLAN EDITING
  // ===================================================

  addExercise(
    dateOrDay,
    exerciseId,
    options = {},
    weekValue =
      this.getSelectedWeekKey()
  ) {
    const exercise =
      ExerciseRegistry.get(
        exerciseId
      );

    if (!exercise) {
      return false;
    }

    let isoDate =
      null;

    let day =
      null;

    let weekKey =
      null;

    if (
      ISO_DATE_PATTERN.test(
        normalizeText(
          dateOrDay
        )
      )
    ) {
      isoDate =
        normalizeDateOrToday(
          dateOrDay
        );

      day =
        getWeekdayIdFromDate(
          isoDate
        );

      weekKey =
        getSundayWeekStart(
          isoDate
        );
    } else {
      day =
        normalizeDay(
          dateOrDay
        );

      weekKey =
        normalizeWeekKey(
          weekValue
        );

      isoDate =
        this.getDateForWeekday(
          day,
          weekKey
        );
    }

    if (
      !day ||
      !weekKey ||
      !isoDate
    ) {
      return false;
    }

    const current =
      WorkoutPlanStore
        .getDay?.(
          day,
          weekKey
        );

    /*
     * The add button may only operate on a real workout day.
     */
    if (
      !current ||
      current.type !==
        "workout"
    ) {
      return false;
    }

    const entry = {
      exerciseId:
        exercise.id,

      ...clone(
        options
      )
    };

    /*
     * CRITICAL FIX:
     * Pass weekKey into V3 store addExercise().
     */
    const result =
      WorkoutPlanStore
        .addExercise?.(
          day,
          entry,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  updateExercise(
    dateOrDay,
    index,
    patch = {},
    weekValue =
      this.getSelectedWeekKey()
  ) {
    let isoDate =
      null;

    let day =
      null;

    let weekKey =
      null;

    if (
      ISO_DATE_PATTERN.test(
        normalizeText(
          dateOrDay
        )
      )
    ) {
      isoDate =
        normalizeDateOrToday(
          dateOrDay
        );

      day =
        getWeekdayIdFromDate(
          isoDate
        );

      weekKey =
        getSundayWeekStart(
          isoDate
        );
    } else {
      day =
        normalizeDay(
          dateOrDay
        );

      weekKey =
        normalizeWeekKey(
          weekValue
        );

      isoDate =
        this.getDateForWeekday(
          day,
          weekKey
        );
    }

    if (
      !day ||
      !weekKey ||
      !isoDate
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .updateExercise?.(
          day,
          index,
          patch,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  removeExercise(
    dateOrDay,
    index,
    weekValue =
      this.getSelectedWeekKey()
  ) {
    let isoDate =
      null;

    let day =
      null;

    let weekKey =
      null;

    if (
      ISO_DATE_PATTERN.test(
        normalizeText(
          dateOrDay
        )
      )
    ) {
      isoDate =
        normalizeDateOrToday(
          dateOrDay
        );

      day =
        getWeekdayIdFromDate(
          isoDate
        );

      weekKey =
        getSundayWeekStart(
          isoDate
        );
    } else {
      day =
        normalizeDay(
          dateOrDay
        );

      weekKey =
        normalizeWeekKey(
          weekValue
        );

      isoDate =
        this.getDateForWeekday(
          day,
          weekKey
        );
    }

    if (
      !day ||
      !weekKey ||
      !isoDate
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .removeExercise?.(
          day,
          index,
          weekKey
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  // ===================================================
  // WEEK COPY / REPEAT
  // ===================================================

  copyWeek(
    sourceOrOptions,
    targetWeekValue =
      null,
    options = {}
  ) {
    let sourceWeekKey =
      null;

    let targetWeekKey =
      null;

    let copyOptions =
      options;

    if (
      sourceOrOptions &&
      typeof sourceOrOptions ===
        "object"
    ) {
      sourceWeekKey =
        normalizeWeekKey(
          sourceOrOptions
            .fromWeekKey ||
          sourceOrOptions
            .sourceWeekKey
        );

      targetWeekKey =
        normalizeWeekKey(
          sourceOrOptions
            .toWeekKey ||
          sourceOrOptions
            .targetWeekKey ||
          this.getSelectedWeekKey()
        );

      copyOptions = {
        overwrite:
          sourceOrOptions
            .overwrite ??
          true,

        markAsRepeat:
          sourceOrOptions
            .markAsRepeat ??
          false
      };
    } else {
      sourceWeekKey =
        normalizeWeekKey(
          sourceOrOptions
        );

      targetWeekKey =
        normalizeWeekKey(
          targetWeekValue ||
          this.getSelectedWeekKey()
        );
    }

    if (
      !sourceWeekKey ||
      !targetWeekKey
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .copyWeek?.(
          sourceWeekKey,
          targetWeekKey,
          copyOptions
        ) ||
      false;

    if (result) {
      this.setSelectedWeek(
        targetWeekKey
      );

      this.syncProgressWithPlan();
    }

    return result;
  },


  repeatPreviousWeek(
    targetWeekValue =
      this.getSelectedWeekKey(),
    options = {}
  ) {
    const targetWeekKey =
      normalizeWeekKey(
        targetWeekValue
      );

    if (!targetWeekKey) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .repeatPreviousWeek?.(
          targetWeekKey,
          options
        ) ||
      false;

    if (result) {
      this.setSelectedWeek(
        targetWeekKey
      );

      this.syncProgressWithPlan();
    }

    return result;
  },


  repeatLastWeek(
    targetWeekValue =
      this.getSelectedWeekKey(),
    options = {}
  ) {
    return this.repeatPreviousWeek(
      targetWeekValue,
      options
    );
  },


  // ===================================================
  // TEMPLATES
  // ===================================================

  applyTemplate(
    templateId,
    weekOrOptions =
      this.getSelectedWeekKey()
  ) {
    const template =
      WorkoutTemplates.get(
        templateId
      );

    if (!template) {
      return false;
    }

    let weekKey =
      null;

    if (
      weekOrOptions &&
      typeof weekOrOptions ===
        "object"
    ) {
      weekKey =
        normalizeWeekKey(
          weekOrOptions
            .weekKey ||
          weekOrOptions
            .weekStart ||
          this.getSelectedWeekKey()
        );
    } else {
      weekKey =
        normalizeWeekKey(
          weekOrOptions ||
          this.getSelectedWeekKey()
        );
    }

    if (!weekKey) {
      return false;
    }

    const templateCopy =
      typeof WorkoutTemplates
        .clone ===
        "function"
        ? WorkoutTemplates.clone(
            template.id
          )
        : clone(
            template
          );

    const result =
      WorkoutPlanStore
        .applyTemplate?.(
          templateCopy,
          {
            weekKey
          }
        ) ||
      false;

    if (result) {
      this.setSelectedWeek(
        weekKey
      );

      this.syncProgressWithPlan();
    }

    return result;
  },


  applyTemplateToWeek(
    templateId,
    weekKey
  ) {
    return this.applyTemplate(
      templateId,
      weekKey
    );
  },


  getTemplates(
    filters = {}
  ) {
    return WorkoutTemplates.list(
      filters
    );
  },


  searchTemplates(
    query
  ) {
    return WorkoutTemplates.search(
      query
    );
  },


  // ===================================================
  // FOCUSES / GOALS
  // ===================================================

  getWorkoutFocuses(
    filters = {}
  ) {
    return WorkoutFocuses.list(
      filters
    );
  },


  searchWorkoutFocuses(
    query
  ) {
    return WorkoutFocuses.search(
      query
    );
  },


  getFitnessGoals(
    filters = {}
  ) {
    return FitnessGoals.list(
      filters
    );
  },


  searchFitnessGoals(
    query
  ) {
    return FitnessGoals.search(
      query
    );
  },


  // ===================================================
  // EXERCISE LIBRARY
  // ===================================================

  getExercise(
    exerciseId
  ) {
    return ExerciseRegistry.get(
      exerciseId
    );
  },


  getExercises(
    filters = {}
  ) {
    return ExerciseRegistry.list(
      filters
    );
  },


  searchExercises(
    query,
    options = {}
  ) {
    return ExerciseSearch.search(
      query,
      options
    );
  },


  findExercises(
    query,
    options = {}
  ) {
    return ExerciseSearch.find(
      query,
      options
    );
  },


  suggestExercises(
    query,
    options = {}
  ) {
    return ExerciseSearch.suggest(
      query,
      options
    );
  },


  browseExercises(
    options = {}
  ) {
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


  // ===================================================
  // RECOMMENDATIONS
  // ===================================================

  getRecommendedExercises(
    options = {}
  ) {
    const selectedWeek =
      WorkoutPlanStore
        .getWeek?.(
          this.getSelectedWeekKey()
        );

    const primaryGoalId =
      selectedWeek
        ?.primaryGoalId ||
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
            ? [
                options.bodyPart
              ]
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
            ? [
                options.movementPattern
              ]
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
            ? [
                options.exerciseType
              ]
            : []
      )
    ];

    if (focus) {
      if (
        bodyParts.length ===
        0
      ) {
        bodyParts.push(
          ...(
            focus.primaryBodyParts ||
            focus.bodyParts ||
            []
          )
        );
      }

      if (
        movementPatterns.length ===
        0
      ) {
        movementPatterns.push(
          ...(
            focus.movementPatterns ||
            []
          )
        );
      }

      if (
        exerciseTypes.length ===
        0
      ) {
        exerciseTypes.push(
          ...(
            focus.exerciseTypes ||
            []
          )
        );
      }
    }

    const recommendation =
      ExerciseRecommender
        .recommend({
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
                ? [
                    options.equipment
                  ]
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

    return (
      recommendation
        ?.results ||
      []
    );
  },


  getRecommendedExercisesForDate(
    date,
    options = {}
  ) {
    const dayState =
      this.getDate(
        date
      );

    if (
      !dayState ||
      dayState.type !==
        "workout"
    ) {
      return [];
    }

    const weekKey =
      getSundayWeekStart(
        dayState.date
      );

    const week =
      WorkoutPlanStore
        .getWeek?.(
          weekKey
        );

    return this.getRecommendedExercises({
      goal:
        dayState.goal ||
        week?.primaryGoalId ||
        null,

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
    const weekKey =
      normalizeWeekKey(
        options.weekKey ||
        this.getSelectedWeekKey()
      );

    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            weekKey
          );

    return targetDate
      ? this.getRecommendedExercisesForDate(
          targetDate,
          options
        )
      : [];
  },


  recommendFromQuery(
    query,
    options = {}
  ) {
    return ExerciseRecommender
      .recommendFromQuery(
        query,
        options
      );
  },


  // ===================================================
  // WORKOUT BUILDER
  // ===================================================

  buildWorkout(
    options = {}
  ) {
    const week =
      WorkoutPlanStore
        .getWeek?.(
          this.getSelectedWeekKey()
        ) ||
      {};

    const workout =
      WorkoutBuilder.build({
        goal:
          options.goal ||
          week.primaryGoalId ||
          "general_fitness",

        secondaryGoals:
          options.secondaryGoals ||
          week.secondaryGoalIds,

        ...options
      });

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildQuickWorkout(
    options = {}
  ) {
    const workout =
      WorkoutBuilder.quick(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildStrengthWorkout(
    options = {}
  ) {
    const workout =
      WorkoutBuilder.strength(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildHypertrophyWorkout(
    options = {}
  ) {
    const workout =
      WorkoutBuilder.hypertrophy(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildCardioWorkout(
    options = {}
  ) {
    const workout =
      WorkoutBuilder.cardio(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildMobilityWorkout(
    options = {}
  ) {
    const workout =
      WorkoutBuilder.mobility(
        options
      );

    this.state.lastBuiltWorkout =
      clone(workout);

    return workout;
  },


  buildSurfWorkout(
    options = {}
  ) {
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
      normalizeDateOrToday(
        date
      );

    const currentDay =
      this.getDate(
        isoDate
      );

    const focus =
      currentDay?.focusId
        ? WorkoutFocuses.get(
            currentDay.focusId
          )
        : null;

    const week =
      WorkoutPlanStore
        .getWeek?.(
          getSundayWeekStart(
            isoDate
          )
        ) ||
      {};

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
            ? [
                options.bodyPart
              ]
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
    const weekKey =
      normalizeWeekKey(
        options.weekKey ||
        this.getSelectedWeekKey()
      );

    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            weekKey
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
      normalizeDateOrToday(
        date
      );

    if (!workout) {
      return false;
    }

    const day =
      getWeekdayIdFromDate(
        isoDate
      );

    const weekKey =
      getSundayWeekStart(
        isoDate
      );

    const result =
      WorkoutPlanStore
        .setBuiltWorkout?.(
          day,
          workout,
          {
            ...options,
            weekKey
          }
        ) ||
      false;

    if (result) {
      this.syncProgressDateWithPlan(
        isoDate
      );
    }

    return result;
  },


  setBuiltWorkoutForDay(
    day,
    workout,
    options = {}
  ) {
    const weekKey =
      normalizeWeekKey(
        options.weekKey ||
        this.getSelectedWeekKey()
      );

    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            weekKey
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

    if (!workout) {
      return null;
    }

    return this
      .setBuiltWorkoutForDate(
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
    const weekKey =
      normalizeWeekKey(
        options.weekKey ||
        this.getSelectedWeekKey()
      );

    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            weekKey
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
    return this
      .buildAndSetWorkoutForDate(
        date,
        options
      );
  },


  regenerateDay(
    day,
    options = {}
  ) {
    return this
      .buildAndSetWorkoutForDay(
        day,
        options
      );
  },


  // ===================================================
  // BUILT WORKOUT EDITING
  // ===================================================

  replaceBuiltWorkoutExercise(
    workout,
    entryId,
    replacementExerciseId
  ) {
    return WorkoutBuilder
      .replaceExercise(
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
    return WorkoutBuilder
      .moveExercise(
        workout,
        entryId,
        options
      );
  },


  removeBuiltWorkoutExercise(
    workout,
    entryId
  ) {
    return WorkoutBuilder
      .removeExercise(
        workout,
        entryId
      );
  },


  addExerciseToBuiltWorkout(
    workout,
    exerciseId,
    options = {}
  ) {
    return WorkoutBuilder
      .addExercise(
        workout,
        exerciseId,
        options
      );
  },


  // ===================================================
  // PLAN -> PROGRESS SYNC
  // ===================================================

  syncProgressDateWithPlan(
    date
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    const dayState =
      this.getDate(
        isoDate
      );

    return WorkoutProgressStore
      .syncDayWithPlan?.({
        day:
          getWeekdayIdFromDate(
            isoDate
          ),

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
      }) ||
      false;
  },


  syncProgressWithPlan() {
    const plan =
      WorkoutPlanStore
        .getState?.() ||
      {};

    const weekKey =
      this.getSelectedWeekKey() ||
      this.getCurrentWeekKey();

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          getPlanContextKey(
            plan
          ),

        weekKey,

        resetIfChanged:
          false
      });

    const selectedWeek =
      WorkoutPlanStore
        .getWeek?.(
          weekKey
        );

    if (
      !selectedWeek ||
      !selectedWeek.days
    ) {
      return false;
    }

    /*
     * Pass the V3 store's actual days object.
     * Each day already contains its real date.
     */
    return WorkoutProgressStore
      .syncWeekWithPlan?.(
        selectedWeek.days
      ) ??
      null;
  },


  // ===================================================
  // LIVE SESSION READS
  // ===================================================

  getProgress() {
    return WorkoutProgressStore
      .getState?.();
  },


  getDateProgress(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    return WorkoutProgressStore
      .getDayByDate?.(
        isoDate
      ) ||
      WorkoutProgressStore
        .getDay?.(
          isoDate
        ) ||
      null;
  },


  getDayProgress(
    day
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.getSelectedWeekKey()
          );

    return targetDate
      ? this.getDateProgress(
          targetDate
        )
      : null;
  },


  getTodayProgress() {
    return this.getDateProgress(
      new Date()
    );
  },


  getDateProgressSummary(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    return WorkoutProgressStore
      .getDaySummary?.(
        isoDate
      ) ||
      null;
  },


  getTodayProgressSummary() {
    return this
      .getDateProgressSummary(
        new Date()
      );
  },


  getWeekProgressSummary(
    anchor =
      this.getSelectedWeekKey()
  ) {
    const weekKey =
      normalizeWeekKey(
        anchor
      );

    return WorkoutProgressStore
      .getWeekSummary?.(
        weekKey
      ) ||
      null;
  },


  // ===================================================
  // SESSION LIFECYCLE
  // ===================================================

  startWorkout(
    date = new Date()
  ) {
    const isoDate =
      normalizeDateOrToday(
        date
      );

    if (
      !this.canStartWorkout(
        isoDate
      )
    ) {
      return false;
    }

    this.syncProgressDateWithPlan(
      isoDate
    );

    return WorkoutProgressStore
      .startDay?.(
        isoDate
      ) ||
      false;
  },


  pauseWorkout(
    date = new Date()
  ) {
    return WorkoutProgressStore
      .pauseDay?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      false;
  },


  resumeWorkout(
    date = new Date()
  ) {
    return WorkoutProgressStore
      .resumeDay?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      false;
  },


  completeWorkout(
    date = new Date(),
    options = {}
  ) {
    return WorkoutProgressStore
      .completeDay?.(
        normalizeDateOrToday(
          date
        ),
        options
      ) ||
      false;
  },


  cancelWorkout(
    date = new Date()
  ) {
    return WorkoutProgressStore
      .cancelDay?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      false;
  },


  deleteSession({
    sessionId = null,
    date = null
  } = {}) {
    if (
      sessionId &&
      typeof WorkoutProgressStore
        .deleteSessionRecord ===
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
    return WorkoutProgressStore
      .getElapsedSeconds?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      0;
  },


  setAverageHeartRate(
    date,
    heartRate
  ) {
    return WorkoutProgressStore
      .setAverageHeartRate?.(
        normalizeDateOrToday(
          date
        ),
        heartRate
      ) ||
      false;
  },


  setWorkoutNotes(
    date,
    notes
  ) {
    return WorkoutProgressStore
      .setDayNotes?.(
        normalizeDateOrToday(
          date
        ),
        notes
      ) ||
      false;
  },


  // ===================================================
  // SESSION EXERCISE ACTIONS
  // ===================================================

  moveSessionExercise(
    date,
    entryId,
    toIndex
  ) {
    return WorkoutProgressStore
      .moveEntry?.(
        normalizeDateOrToday(
          date
        ),
        entryId,
        toIndex
      ) ||
      false;
  },


  addSessionExercise(
    options = {}
  ) {
    return WorkoutProgressStore
      .addSessionExercise?.(
        options
      );
  },


  substituteSessionExercise(
    options = {}
  ) {
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
    return WorkoutProgressStore
      .skipEntry?.(
        normalizeDateOrToday(
          date
        ),
        entryId,
        skipped
      ) ||
      false;
  },


  removeSessionExercise(
    date,
    entryId
  ) {
    return WorkoutProgressStore
      .removeSessionEntry?.(
        normalizeDateOrToday(
          date
        ),
        entryId
      ) ||
      false;
  },


  getSessionExercise(
    date,
    entryIdOrExerciseId
  ) {
    return WorkoutProgressStore
      .getExerciseProgress?.(
        normalizeDateOrToday(
          date
        ),
        entryIdOrExerciseId
      ) ||
      null;
  },


  // ===================================================
  // SET / ACTIVITY COMPLETION
  // ===================================================

  setSetCompleted(
    options = {}
  ) {
    return WorkoutProgressStore
      .setSetCompleted?.(
        options
      );
  },


  toggleSetCompleted(
    options = {}
  ) {
    return WorkoutProgressStore
      .toggleSetCompleted?.(
        options
      );
  },


  setSetCalories(
    options = {}
  ) {
    return WorkoutProgressStore
      .setSetCalories?.(
        options
      );
  },


  setExerciseCompleted(
    options = {}
  ) {
    return WorkoutProgressStore
      .setExerciseCompleted?.(
        options
      );
  },


  toggleExerciseCompleted(
    options = {}
  ) {
    return WorkoutProgressStore
      .toggleExerciseCompleted?.(
        options
      );
  },


  createSessionSnapshot(
    date = new Date()
  ) {
    return WorkoutProgressStore
      .createSessionSnapshot?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      null;
  },


  getSessionRecord(
    sessionId
  ) {
    return WorkoutProgressStore
      .getSessionRecord?.(
        sessionId
      ) ||
      null;
  },


  getSessionHistory(
    options = {}
  ) {
    return WorkoutProgressStore
      .getSessionHistory?.(
        options
      ) ||
      [];
  },


  getMonthHistory(
    year,
    month
  ) {
    return WorkoutProgressStore
      .getMonthHistory?.(
        year,
        month
      ) ||
      [];
  },


  // ===================================================
  // CALORIE ESTIMATION
  // ===================================================

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
          ?.includes(
            "strength"
          ) ||
        exercise.exerciseTypes
          ?.includes(
            "hypertrophy"
          )
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
      typeof exercise !==
        "object"
    ) {
      return null;
    }

    const normalizedIntensity =
      normalizeText(
        intensity
      )
        .toLowerCase();

    switch (
      exercise.id
    ) {
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


  // ===================================================
  // SUBSCRIPTIONS
  // ===================================================

  subscribe(
    listener
  ) {
    return WorkoutPlanStore
      .subscribe?.(
        listener
      );
  },


  subscribeProgress(
    listener
  ) {
    return WorkoutProgressStore
      .subscribe?.(
        listener
      );
  },


  // ===================================================
  // DELETE / RESET
  // ===================================================

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

    await WorkoutPlanApi
      .deletePlan({
        planId:
          plan.planId
      });

    WorkoutPlanStore
      .reset?.();

    WorkoutProgressStore
      .resetAll?.();

    this.state.lastLoadSource =
      "default";

    this.state.selectedWeekStart =
      getSundayWeekStart(
        new Date()
      );

    this.state.selectedDate =
      toLocalIsoDate(
        new Date()
      );

    this.state.selectedMonth =
      getMonthKey(
        new Date()
      );

    return true;
  },


  resetPlan() {
    const result =
      WorkoutPlanStore
        .reset?.() ||
      false;

    WorkoutProgressStore
      .resetAll?.();

    this.state.selectedWeekStart =
      WorkoutPlanStore
        .getSelectedWeekKey?.() ||
      getSundayWeekStart(
        new Date()
      );

    return result;
  },


  resetProgress() {
    return WorkoutProgressStore
      .resetAll?.() ||
      false;
  },


  resetDateProgress(
    date
  ) {
    return WorkoutProgressStore
      .resetDay?.(
        normalizeDateOrToday(
          date
        )
      ) ||
      false;
  },


  resetDayProgress(
    day
  ) {
    const targetDate =
      ISO_DATE_PATTERN.test(
        normalizeText(
          day
        )
      )
        ? normalizeText(day)
        : this.getDateForWeekday(
            day,
            this.getSelectedWeekKey()
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


  // ===================================================
  // VALIDATION / DIAGNOSTICS
  // ===================================================

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


  validateBuiltWorkout(
    workout
  ) {
    return WorkoutBuilder
      .validate(
        workout
      );
  },


  getDiagnostics() {
    const selectedWeekKey =
      this.getSelectedWeekKey();

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

      selectedWeekKey,

      storeSelectedWeekKey:
        WorkoutPlanStore
          .getSelectedWeekKey?.() ||
        null,

      selectedMonth:
        this.state.selectedMonth,

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
          selectedWeekKey
        ),

      selectedMonthSummary:
        this.getMonthSummary(
          this.state.selectedMonth
        ),

      progress:
        this.getWeekProgressSummary(
          selectedWeekKey
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

  Ari.training
    .workoutPlanController =
      AriTrainingWorkoutPlanController;

  globalThis.Ari =
    Ari;
}


// =====================================================
// EXPORTS
// =====================================================

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