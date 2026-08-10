// =====================================================
// ARI REBIRTH
// File: js/ari-training.js
// Version: 4.5.0
// Purpose:
//   Fault-isolated calendar-first ARI Training controller.
//
// V4.5.0:
//   - Cancel Workout now returns to the selected-day card immediately.
//   - Removes calls to nonexistent timer-stop functions that interrupted cancel.
//   - Resets cancelled progress by exact YYYY-MM-DD date, never weekday alone.
//   - Current Off Day / Recovery Day plans take priority over stale history.
//   - Replaces the completed-card Train Again action with Undo Completion.
//   - Undo removes the cloud session, local cache, and local progress snapshot.
//   - Completed-history deletion now calls deleteSessionRecord(), the real store API.
//   - Selected day, calendar, history, and performance rerender after cleanup.
//
// V4.4.0:
 //   - Uses calendar-specific plan dates from Workout Plan Controller V3.
 //   - Stops weekly plans from repeating indefinitely across future weeks.
 //   - Unplanned dates render Plan Workout instead of Start Workout Anyway.
 //   - Recovery days no longer offer Start Workout / Train Anyway.
 //   - Plan Workout opens workout-plans.html for the selected calendar date.
 //   - Adds Cancel Workout for accidental session starts.
 //   - Cancel Workout removes the accidental live Supabase session when possible.
 //   - Adds per-session Delete controls in Monthly History.
 //   - Adds Clear Month support for workout-history cleanup.
 //   - Keeps completed-history deletion separate from workout-plan deletion.
 //   - Preserves the fault-isolated V4.3.0 boot architecture.
 //
 // V4.3.0:
//   - Boots visible Training controls before loading child modules.
//   - Weekdays, calendar, hamburger, and buttons bind immediately.
//   - Dynamically loads Training dependencies.
//   - One broken child module can no longer freeze the entire page.
//   - Workout plan/progress/exercise registry are critical dependencies.
//   - Calorie + heart-rate intelligence are optional dependencies.
//   - Preserves direct Supabase workout-session behavior from V4.1.1.
//   - Keeps local/offline workout fallback.
//   - Prevents duplicate event binding.
//   - Prevents overlapping refreshes.
//   - Adds runtime/dependency diagnostics.
//   - Fixes malformed symbols.
// =====================================================

const VERSION = "4.5.0";
const SOURCE = "js/ari-training";


// =====================================================
// DYNAMIC DEPENDENCIES
// =====================================================

let WorkoutPlanController = null;
let WorkoutProgressStore = null;
let ExerciseRegistry = null;
let CalorieCalculator = null;
let HeartRateIntensity = null;


const dependencyState = {
  loading: false,
  loaded: false,

  workoutPlanController: false,
  workoutProgressStore: false,
  exerciseRegistry: false,
  calorieCalculator: false,
  heartRateIntensity: false,

  errors: {}
};


// =====================================================
// CONSTANTS
// =====================================================

const DAYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
]);


const DAY_SHORT_LABELS = Object.freeze([
  "S",
  "M",
  "T",
  "W",
  "T",
  "F",
  "S"
]);


const OPEN_SESSION_STATUSES = Object.freeze([
  "active",
  "paused",
  "finishing"
]);


const DEFAULT_REST_SECONDS = 90;


const LOCAL_SESSION_CACHE_KEY =
  "ari_training_active_session_cache_v3";


const LOCAL_SELECTED_DATE_KEY =
  "ari_training_selected_date_v1";


const LOCAL_COMPLETED_CACHE_KEY =
  "ari_training_completed_sessions_v2";


// =====================================================
// STATE
// =====================================================

const state = {
  initialized: false,
  eventsBound: false,
  refreshInFlight: false,

  user: null,
  plan: null,

  todayDateKey: null,
  selectedDateKey: null,
  calendarMonthDate: null,
  calendarOpen: false,

  profileAge: null,
  profileWeightLb: null,
  profileRestingHeartRate: null,
  profileEstimatedMaxHeartRate: null,
  profileConfirmedMaxHeartRate: null,
  profileEffectiveMaxHeartRate: null,
  profileMaxHeartRateSource: null,

  activeSession: null,
  currentExerciseId: null,
  rest: null,

  saving: false,
  currentDrawer: null,

  selectedDayRenderToken: 0,

  sessionTimerId: null,
  restTimerId: null,
  dateWatcherId: null,

  unsubscribePlan: null,
  unsubscribeProgress: null
};


const elements = {};


// =====================================================
// DEPENDENCY LOADING
// =====================================================

async function importDefaultModule(
  key,
  path,
  assign
) {
  try {
    const module =
      await import(path);

    const value =
      module?.default ||
      null;

    if (!value) {
      throw new Error(
        `${path} did not provide a default export.`
      );
    }

    assign(value);

    dependencyState[key] = true;

    delete dependencyState
      .errors[key];

    console.info(
      `[ARI Training] Loaded ${key}.`
    );

    return true;
  } catch (error) {
    dependencyState[key] = false;

    dependencyState.errors[key] = {
      path,

      message:
        error?.message ||
        String(error)
    };

    console.error(
      `[ARI Training] FAILED TO LOAD ${key}:`,
      path,
      error
    );

    return false;
  }
}


async function loadTrainingDependencies() {
  if (dependencyState.loaded) {
    return true;
  }

  if (dependencyState.loading) {
    while (
      dependencyState.loading
    ) {
      await delay(25);
    }

    return dependencyState.loaded;
  }

  dependencyState.loading = true;

  try {
    await importDefaultModule(
      "workoutPlanController",
      "./training/workout-plan-controller.js",
      value => {
        WorkoutPlanController = value;
      }
    );


    await importDefaultModule(
      "workoutProgressStore",
      "./training/workout-progress-store.js",
      value => {
        WorkoutProgressStore = value;
      }
    );


    await importDefaultModule(
      "exerciseRegistry",
      "./training/exercises/exercise-registry.js",
      value => {
        ExerciseRegistry = value;
      }
    );


    /*
     * Optional:
     * Training should still work if either energy helper fails.
     */
    await importDefaultModule(
      "calorieCalculator",
      "./training/energy/calorie-calculator.js",
      value => {
        CalorieCalculator = value;
      }
    );


    await importDefaultModule(
      "heartRateIntensity",
      "./training/energy/heart-rate-intensity.js",
      value => {
        HeartRateIntensity = value;
      }
    );


    dependencyState.loaded =
      dependencyState.workoutPlanController &&
      dependencyState.workoutProgressStore &&
      dependencyState.exerciseRegistry;


    return dependencyState.loaded;
  } finally {
    dependencyState.loading = false;
  }
}


function getCriticalDependencyFailure() {
  const criticalKeys = [
    "workoutPlanController",
    "workoutProgressStore",
    "exerciseRegistry"
  ];


  for (
    const key
    of criticalKeys
  ) {
    if (
      dependencyState[key] === false &&
      dependencyState.errors[key]
    ) {
      return {
        key,
        ...dependencyState.errors[key]
      };
    }
  }


  return null;
}


// =====================================================
// INITIALIZATION
// =====================================================

async function initialize() {
  if (state.initialized) {
    void refresh();
    return;
  }


  /*
   * PHASE 1
   *
   * Native page UI only.
   * No Training module dependency is used here.
   *
   * Therefore:
   * - weekdays appear
   * - calendar works
   * - hamburger works
   * - buttons receive click handlers
   *
   * even if a child JS file is broken.
   */
  try {
    cacheElements();
    bindEvents();


    state.todayDateKey =
      getLocalDateKey();


    state.selectedDateKey =
      restoreSelectedDate() ||
      state.todayDateKey;


    state.calendarMonthDate =
      dateFromKey(
        state.selectedDateKey
      ) ||
      new Date();


    state.initialized = true;


    renderCalendarShell();

    publishGlobal();


    console.info(
      `[ARI Training] UI shell initialized. Version ${VERSION}.`
    );
  } catch (error) {
    console.error(
      "[ARI Training] FATAL UI SHELL ERROR:",
      error
    );

    showBootFailure(error);

    return;
  }


  /*
   * PHASE 2
   *
   * Load Training engine.
   */
  const dependenciesReady =
    await loadTrainingDependencies();


  if (!dependenciesReady) {
    const failure =
      getCriticalDependencyFailure();


    console.error(
      "[ARI Training] Dependency diagnostics:",
      cloneSafe(
        dependencyState
      )
    );


    showTrainingMessage(
      failure
        ? `Training engine failed to load: ${failure.key}.`
        : "Training engine could not load.",
      "error",
      10000
    );


    renderCalendarShell();

    publishGlobal();

    return;
  }


  /*
   * PHASE 3
   *
   * Hydrate application data.
   */
  try {
    WorkoutProgressStore
      .hydrate();
  } catch (error) {
    console.warn(
      "[ARI Training] Progress hydration failed.",
      error
    );
  }


  try {
    await resolveCurrentUser();
  } catch (error) {
    console.warn(
      "[ARI Training] User resolution failed.",
      error
    );
  }


  try {
    await loadTrainingProfile();
  } catch (error) {
    console.warn(
      "[ARI Training] Profile initialization failed.",
      error
    );
  }


  try {
    await WorkoutPlanController
      .init();
  } catch (error) {
    console.error(
      "[ARI Training] Plan initialization failed.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Your workout plan could not be loaded."
      ),
      "error"
    );
  }


  try {
    state.plan =
      WorkoutPlanController
        .getPlan() ||
      null;
  } catch (error) {
    state.plan = null;


    console.error(
      "[ARI Training] Could not read workout plan.",
      error
    );
  }


  try {
    syncProgressWithPlan();
  } catch (error) {
    console.warn(
      "[ARI Training] Progress-plan synchronization failed.",
      error
    );
  }


  subscribeRuntimeStores();


  startRuntimeTimers();


  /*
   * Show actual Training plan BEFORE waiting for session restoration.
   */
  renderAll();


  /*
   * Session restoration happens last.
   *
   * Supabase must never block the visible Training page.
   */
  try {
    await restoreOpenSession();


    if (state.activeSession) {
      renderAll();
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Open-session restoration failed.",
      error
    );


    showTrainingMessage(
      "Training loaded, but your previous workout could not be restored.",
      "warning"
    );
  }


  publishGlobal();


  console.info(
    `[ARI Training] Runtime fully initialized. Version ${VERSION}.`
  );
}


// =====================================================
// SUBSCRIPTIONS
// =====================================================

function subscribeRuntimeStores() {
  try {
    if (
      typeof state.unsubscribePlan ===
      "function"
    ) {
      state.unsubscribePlan();
    }
  } catch {
    // Ignore old unsubscribe failure.
  }


  try {
    if (
      typeof state.unsubscribeProgress ===
      "function"
    ) {
      state.unsubscribeProgress();
    }
  } catch {
    // Ignore old unsubscribe failure.
  }


  state.unsubscribePlan = null;
  state.unsubscribeProgress = null;


  try {
    if (
      typeof WorkoutPlanController?.subscribe ===
      "function"
    ) {
      state.unsubscribePlan =
        WorkoutPlanController
          .subscribe(
            () => {
              try {
                state.plan =
                  WorkoutPlanController
                    .getPlan();


                syncProgressWithPlan();

                renderCalendar();

                void renderSelectedDay();
              } catch (error) {
                console.error(
                  "[ARI Training] Plan subscription render failed.",
                  error
                );
              }
            }
          );
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Plan subscription failed.",
      error
    );
  }


  try {
    if (
      typeof WorkoutProgressStore?.subscribe ===
      "function"
    ) {
      state.unsubscribeProgress =
        WorkoutProgressStore
          .subscribe(
            () => {
              renderCalendar();

              void renderSelectedDay();
            }
          );
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Progress subscription failed.",
      error
    );
  }
}


// =====================================================
// DOM CACHE
// =====================================================

function cacheElements() {
  const ids = [
    "trainingMenuButton",
    "trainingMenu",

    "trainingDateTrigger",
    "trainingDateTriggerLabel",
    "trainingTodayShortcut",
    "trainingWeekStrip",
    "trainingCalendarPanel",
    "trainingPreviousMonthButton",
    "trainingNextMonthButton",
    "trainingCalendarTitle",
    "trainingCalendarGrid",

    "todaysTraining",
    "todaysTrainingDayView",
    "todaysTrainingEyebrow",
    "todaysTrainingDate",
    "todaysTrainingStatus",
    "todaysTrainingPlan",
    "todaysTrainingType",
    "todaysTrainingTitle",
    "todaysTrainingMeta",
    "todaysTrainingExercisePreview",
    "todaysTrainingActions",
    "startTodayWorkoutButton",

    "todaysTrainingEmpty",
    "startUnplannedWorkoutButton",

    "todaysTrainingRestDay",
    "restDayTitle",
    "restDayMessage",
    "trainOnRestDayButton",

    "todaysTrainingCompletedDay",
    "completedDayWorkoutName",
    "completedDayDuration",
    "completedDaySets",
    "completedDayCalories",
    "undoCompletedWorkoutButton",

    "todaysTrainingSession",
    "liveSessionWorkoutName",
    "pauseTodayWorkoutButton",
    "cancelTodayWorkoutButton",
    "todaySessionElapsed",
    "todaySessionSets",
    "todaySessionProgressFill",
    "todayCurrentExercise",
    "todayCurrentExerciseName",
    "todayCurrentExercisePrescription",
    "todayCurrentExercisePosition",
    "todayCurrentExerciseSets",
    "doCurrentExerciseLaterButton",
    "skipCurrentExerciseButton",

    "todayWorkoutRestPanel",
    "todayWorkoutRestTimer",
    "logWorkoutHeartRateButton",
    "skipRestButton",

    "workoutHeartRateEntry",
    "closeHeartRateEntryButton",
    "workoutHeartRateInput",
    "saveWorkoutHeartRateButton",

    "addExerciseToSessionButton",
    "todayExerciseList",
    "finishTodayWorkoutButton",

    "sessionExercisePicker",
    "closeSessionExercisePickerButton",
    "sessionExerciseSearchInput",
    "sessionExerciseSearchResults",

    "workoutCompletePanel",
    "workoutCompleteName",
    "workoutCompleteDuration",
    "workoutCompleteSets",
    "workoutCompleteAverageHeartRate",
    "finalAverageHeartRateInput",
    "finalPeakHeartRateInput",
    "workoutCompleteCalories",
    "workoutCalorieCalculationNote",
    "workoutAddedExercisesSummary",
    "workoutAddedExercisesList",
    "returnToWorkoutButton",
    "saveCompletedWorkoutButton",

    "trainingOverlay",
    "trainingPerformanceDrawer",
    "trainingHistoryDrawer",
    "trainingProfileDrawer",

    "trainingCaloriesBurned",
    "trainingWorkoutTime",
    "trainingWorkoutCount",
    "trainingSetsCompleted",
    "trainingHeartRatePerformance",
    "trainingAverageHeartRate",
    "trainingPeakHeartRate",
    "trainingIntensityLabel",

    "trainingHistoryMonthLabel",
    "monthlyWorkoutCount",
    "monthlyCaloriesBurned",
    "monthlyCompletedWorkouts",
    "monthlyTrainingTime",
    "monthlyCaloriesTotal",
    "monthlySetsCompleted",
    "monthlyHistoryList",
    "monthlyHistoryEmptyState",
    "clearMonthlyHistoryButton",

    "trainingProfileWeight",
    "trainingProfileRestingHeartRate",
    "trainingProfileMaxHeartRate",
    "trainingProfileMaxHeartRateSource",
    "trainingProfileSource",

    "trainingWeekDayTemplate",
    "trainingCalendarDayTemplate",
    "trainingDayExercisePreviewTemplate",
    "todayWorkoutSetTemplate",
    "todayWorkoutExerciseTemplate",
    "sessionExerciseSearchResultTemplate",
    "monthlyHistoryDayTemplate",
    "monthlyHistoryWorkoutTemplate"
  ];


  for (
    const id
    of ids
  ) {
    elements[id] =
      document.getElementById(id);
  }
}


// =====================================================
// EVENTS
// =====================================================

function bindEvents() {
  if (state.eventsBound) {
    return;
  }


  state.eventsBound = true;


  elements.trainingMenuButton
    ?.addEventListener(
      "click",
      toggleTrainingMenu
    );


  elements.trainingMenu
    ?.addEventListener(
      "click",
      handleTrainingMenuClick
    );


  elements.trainingDateTrigger
    ?.addEventListener(
      "click",
      toggleCalendar
    );


  elements.trainingTodayShortcut
    ?.addEventListener(
      "click",
      selectToday
    );


  elements.trainingPreviousMonthButton
    ?.addEventListener(
      "click",
      () => moveCalendarMonth(-1)
    );


  elements.trainingNextMonthButton
    ?.addEventListener(
      "click",
      () => moveCalendarMonth(1)
    );


  elements.trainingWeekStrip
    ?.addEventListener(
      "click",
      handleCalendarDateClick
    );


  elements.trainingCalendarGrid
    ?.addEventListener(
      "click",
      handleCalendarDateClick
    );


  elements.startTodayWorkoutButton
    ?.addEventListener(
      "click",
      () => void startSelectedPlannedWorkout()
    );


  elements.startUnplannedWorkoutButton
    ?.addEventListener(
      "click",
      openWorkoutPlannerForSelectedDate
    );


  elements.trainOnRestDayButton
    ?.addEventListener(
      "click",
      openWorkoutPlannerForSelectedDate
    );


  elements.cancelTodayWorkoutButton
    ?.addEventListener(
      "click",
      () => void cancelActiveWorkout()
    );


  elements.clearMonthlyHistoryButton
    ?.addEventListener(
      "click",
      () => void clearCurrentMonthHistory()
    );



  elements.monthlyHistoryList
    ?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            '[data-training-action="delete-history-session"]'
          );

        if (!button) {
          return;
        }

        void deleteHistorySession(
          button.dataset.sessionId
        );
      }
    );


  elements.undoCompletedWorkoutButton
    ?.addEventListener(
      "click",
      () => void undoCompletedWorkout()
    );


  elements.pauseTodayWorkoutButton
    ?.addEventListener(
      "click",
      () => void togglePauseResume()
    );


  elements.todayCurrentExerciseSets
    ?.addEventListener(
      "click",
      event => void handleLiveSetClick(event)
    );


  elements.todayExerciseList
    ?.addEventListener(
      "click",
      event =>
        void handleSessionExerciseQueueClick(
          event
        )
    );


  elements.doCurrentExerciseLaterButton
    ?.addEventListener(
      "click",
      () => void doCurrentExerciseLater()
    );


  elements.skipCurrentExerciseButton
    ?.addEventListener(
      "click",
      () => void skipCurrentExercise()
    );


  elements.logWorkoutHeartRateButton
    ?.addEventListener(
      "click",
      openHeartRateEntry
    );


  elements.closeHeartRateEntryButton
    ?.addEventListener(
      "click",
      closeHeartRateEntry
    );


  elements.saveWorkoutHeartRateButton
    ?.addEventListener(
      "click",
      () => void saveHeartRateReading()
    );


  elements.workoutHeartRateInput
    ?.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          void saveHeartRateReading();
        }
      }
    );


  elements.skipRestButton
    ?.addEventListener(
      "click",
      skipRest
    );


  elements.addExerciseToSessionButton
    ?.addEventListener(
      "click",
      openExercisePicker
    );


  elements.closeSessionExercisePickerButton
    ?.addEventListener(
      "click",
      closeExercisePicker
    );


  elements.sessionExerciseSearchInput
    ?.addEventListener(
      "input",
      handleExerciseSearch
    );


  elements.sessionExerciseSearchResults
    ?.addEventListener(
      "click",
      event =>
        void handleExerciseSearchResultClick(
          event
        )
    );


  elements.finishTodayWorkoutButton
    ?.addEventListener(
      "click",
      () => void openFinishWorkoutPanel()
    );


  elements.returnToWorkoutButton
    ?.addEventListener(
      "click",
      () => void returnToLiveWorkout()
    );


  elements.saveCompletedWorkoutButton
    ?.addEventListener(
      "click",
      () => void saveCompletedWorkout()
    );


  elements.finalAverageHeartRateInput
    ?.addEventListener(
      "input",
      renderFinalCalorieEstimate
    );


  elements.finalPeakHeartRateInput
    ?.addEventListener(
      "input",
      renderFinalCalorieEstimate
    );


  document
    .querySelectorAll(
      'input[name="workoutIntensity"]'
    )
    .forEach(
      input => {
        input.addEventListener(
          "change",
          renderFinalCalorieEstimate
        );
      }
    );


  document
    .querySelectorAll(
      "[data-close-training-drawer]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          closeTrainingDrawer
        );
      }
    );


  elements.trainingOverlay
    ?.addEventListener(
      "click",
      closeTrainingDrawer
    );


  window.addEventListener(
    "focus",
    () => void refresh()
  );


  window.addEventListener(
    "online",
    () => void refresh()
  );


  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        void refresh();
      }
    }
  );
}


// =====================================================
// SUPABASE / USER
// =====================================================

function getSupabase() {
  if (
    window.calbuddySupabase &&
    typeof window.calbuddySupabase.from ===
      "function"
  ) {
    return window.calbuddySupabase;
  }


  return null;
}


async function resolveCurrentUser() {
  state.user = null;


  const client =
    getSupabase();


  if (
    !client?.auth?.getUser
  ) {
    return null;
  }


  try {
    const {
      data,
      error
    } =
      await client.auth
        .getUser();


    if (error) {
      throw error;
    }


    state.user =
      data?.user ||
      null;


    return state.user;
  } catch (error) {
    console.warn(
      "[ARI Training] Could not resolve current user.",
      error
    );


    return null;
  }
}


function isLocalSession() {
  return Boolean(
    state.activeSession &&
    String(
      state.activeSession.id
    ).startsWith(
      "local_"
    )
  );
}


// =====================================================
// REFRESH
// =====================================================

async function refresh() {
  if (state.refreshInFlight) {
    return;
  }


  state.refreshInFlight = true;


  try {
    const previousToday =
      state.todayDateKey;


    const newToday =
      getLocalDateKey();


    state.todayDateKey =
      newToday;


    if (
      previousToday &&
      previousToday !== newToday &&
      state.selectedDateKey === previousToday &&
      !state.activeSession
    ) {
      state.selectedDateKey =
        newToday;


      persistSelectedDate();
    }


    if (!dependencyState.loaded) {
      renderCalendarShell();


      const ready =
        await loadTrainingDependencies();


      if (!ready) {
        return;
      }
    }


    await resolveCurrentUser();


    await loadTrainingProfile();


    try {
      await WorkoutPlanController
        .load();
    } catch (error) {
      console.warn(
        "[ARI Training] Workout plan refresh failed.",
        error
      );
    }


    state.plan =
      WorkoutPlanController
        .getPlan();


    try {
      WorkoutProgressStore
        .hydrate();


      syncProgressWithPlan();
    } catch (error) {
      console.warn(
        "[ARI Training] Progress refresh failed.",
        error
      );
    }


    try {
      await restoreOpenSession({
        preserveCurrent: true
      });
    } catch (error) {
      console.warn(
        "[ARI Training] Session refresh failed.",
        error
      );
    }


    renderAll();
  } finally {
    state.refreshInFlight = false;
  }
}


// =====================================================
// RENDER
// =====================================================

function renderAll() {
  renderCalendar();

  void renderSelectedDay();

  renderTrainingProfile();

  void renderPerformance();

  void renderHistory();
}


function renderCalendarShell() {
  try {
    renderDateTrigger();

    renderWeekStrip();

    renderMonthCalendar();
  } catch (error) {
    console.error(
      "[ARI Training] Calendar shell render failed.",
      error
    );
  }
}


function syncProgressWithPlan() {
  if (
    !WorkoutProgressStore ||
    !WorkoutPlanController
  ) {
    return;
  }

  try {
    const selectedWeekStart =
      typeof WorkoutPlanController.getSelectedWeekStart ===
        "function"
        ? WorkoutPlanController.getSelectedWeekStart()
        : getSundayWeekStartKey(
            state.selectedDateKey ||
            state.todayDateKey
          );

    const plan =
      typeof WorkoutPlanController.getPlan ===
        "function"
        ? WorkoutPlanController.getPlan()
        : state.plan;

    WorkoutProgressStore
      .setPlanContext?.({
        planKey:
          plan?.planId ||
          plan?.metadata?.sourceTemplateId ||
          "calendar-plan",

        weekKey:
          selectedWeekStart,

        /*
         * V3 progress is calendar-aware. Selecting another week
         * must not erase workout history or create a repeating plan.
         */
        resetIfChanged:
          true,

        archiveCompletedBeforeReset:
          true
      });

    if (
      typeof WorkoutPlanController.getWeek ===
        "function"
    ) {
      const week =
        WorkoutPlanController.getWeek(
          selectedWeekStart
        );

      WorkoutProgressStore
        .syncWeekWithPlan?.(
          week?.days ||
          {}
        );

      return;
    }

    if (
      plan?.week
    ) {
      WorkoutProgressStore
        .syncWeekWithPlan?.(
          plan.week
        );
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Calendar progress synchronization failed.",
      error
    );
  }
}


// =====================================================
// CALENDAR
// =====================================================

function renderCalendar() {
  renderDateTrigger();

  renderWeekStrip();

  renderMonthCalendar();
}


function renderDateTrigger() {
  const isToday =
    state.selectedDateKey ===
    state.todayDateKey;


  setText(
    elements.trainingDateTriggerLabel,

    isToday
      ? "Today"
      : formatCompactSelectedDate(
          state.selectedDateKey
        )
  );


  setHidden(
    elements.trainingTodayShortcut,
    isToday
  );


  setHidden(
    elements.trainingCalendarPanel,
    !state.calendarOpen
  );


  elements.trainingDateTrigger
    ?.setAttribute(
      "aria-expanded",

      state.calendarOpen
        ? "true"
        : "false"
    );
}


function toggleCalendar() {
  state.calendarOpen =
    !state.calendarOpen;


  if (state.calendarOpen) {
    state.calendarMonthDate =
      dateFromKey(
        state.selectedDateKey
      ) ||
      new Date();
  }


  renderCalendar();
}


function selectToday() {
  selectDate(
    state.todayDateKey
  );
}


function moveCalendarMonth(
  offset
) {
  const base =
    state.calendarMonthDate ||
    new Date();


  state.calendarMonthDate =
    new Date(
      base.getFullYear(),
      base.getMonth() +
        offset,
      1
    );


  renderMonthCalendar();
}


function renderWeekStrip() {
  const container =
    elements.trainingWeekStrip;


  if (!container) {
    return;
  }


  container.replaceChildren();


  const selectedDate =
    dateFromKey(
      state.selectedDateKey
    ) ||
    new Date();


  const weekStart =
    getSundayStart(
      selectedDate
    );


  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const date =
      addDays(
        weekStart,
        index
      );


    const dateKey =
      getLocalDateKey(
        date
      );


    container.appendChild(
      createWeekStripDay(
        date,
        dateKey,
        index
      )
    );
  }
}


function createWeekStripDay(
  date,
  dateKey,
  index
) {
  const template =
    elements.trainingWeekDayTemplate;


  let button;


  if (template?.content) {
    const fragment =
      template.content
        .cloneNode(true);


    button =
      fragment.querySelector(
        ".ari-training-week-day"
      );


    if (!button) {
      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "ari-training-week-day";
    }


    setTextWithin(
      button,

      ".ari-training-week-day__weekday",

      DAY_SHORT_LABELS[
        index
      ]
    );


    setTextWithin(
      button,

      ".ari-training-week-day__date",

      String(
        date.getDate()
      )
    );
  } else {
    button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "ari-training-week-day";


    button.textContent =
      `${DAY_SHORT_LABELS[index]} ${date.getDate()}`;
  }


  button.dataset.date =
    dateKey;


  button.dataset.status =
    getCalendarDateStatus(
      dateKey
    );


  button.classList.toggle(
    "is-selected",

    dateKey ===
      state.selectedDateKey
  );


  button.classList.toggle(
    "is-today",

    dateKey ===
      state.todayDateKey
  );


  button.setAttribute(
    "aria-label",

    buildCalendarDateAriaLabel(
      dateKey
    )
  );


  return button;
}


function renderMonthCalendar() {
  const container =
    elements.trainingCalendarGrid;


  if (!container) {
    return;
  }


  container.replaceChildren();


  const monthDate =
    state.calendarMonthDate ||
    new Date();


  const year =
    monthDate.getFullYear();


  const month =
    monthDate.getMonth();


  setText(
    elements.trainingCalendarTitle,

    new Intl.DateTimeFormat(
      "en-US",

      {
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date(
        year,
        month,
        1
      )
    )
  );


  const first =
    new Date(
      year,
      month,
      1
    );


  const gridStart =
    addDays(
      first,
      -first.getDay()
    );


  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const date =
      addDays(
        gridStart,
        index
      );


    container.appendChild(
      createMonthCalendarDay(
        date,
        month
      )
    );
  }
}


function createMonthCalendarDay(
  date,
  visibleMonth
) {
  const dateKey =
    getLocalDateKey(
      date
    );


  const template =
    elements.trainingCalendarDayTemplate;


  let button;


  if (template?.content) {
    const fragment =
      template.content
        .cloneNode(true);


    button =
      fragment.querySelector(
        ".ari-training-calendar-day"
      );


    if (!button) {
      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "ari-training-calendar-day";
    }


    setTextWithin(
      button,

      ".ari-training-calendar-day__number",

      String(
        date.getDate()
      )
    );
  } else {
    button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "ari-training-calendar-day";


    button.textContent =
      String(
        date.getDate()
      );
  }


  button.dataset.date =
    dateKey;


  button.dataset.status =
    getCalendarDateStatus(
      dateKey
    );


  button.classList.toggle(
    "is-selected",

    dateKey ===
      state.selectedDateKey
  );


  button.classList.toggle(
    "is-today",

    dateKey ===
      state.todayDateKey
  );


  button.classList.toggle(
    "is-outside-month",

    date.getMonth() !==
      visibleMonth
  );


  button.setAttribute(
    "aria-label",

    buildCalendarDateAriaLabel(
      dateKey
    )
  );


  return button;
}


function handleCalendarDateClick(
  event
) {
  const button =
    event.target.closest(
      "[data-date]"
    );


  if (
    !button?.dataset.date
  ) {
    return;
  }


  selectDate(
    button.dataset.date
  );
}


function selectDate(
  dateKey
) {
  if (
    !isDateKey(
      dateKey
    )
  ) {
    return;
  }


  if (
    state.activeSession &&
    OPEN_SESSION_STATUSES
      .includes(
        state.activeSession.status
      )
  ) {
    state.selectedDateKey =
      state.activeSession
        .local_date ||
      state.selectedDateKey;


    renderAll();

    return;
  }


  state.selectedDateKey =
    dateKey;


  state.calendarMonthDate =
    dateFromKey(
      dateKey
    ) ||
    new Date();


  state.calendarOpen =
    false;


  persistSelectedDate();


  renderCalendar();


  void renderSelectedDay();
}


function getCalendarDateStatus(
  dateKey
) {
  try {
    const dayState =
      getPlanDayForDate(
        dateKey
      );


    /*
     * The current calendar plan owns the day badge.
     * Old history must never turn a current Off Day or
     * Recovery Day into a completed workout day.
     */
    if (
      !dayState ||
      dayState.type ===
        "off" ||
      dayState.type ===
        "recovery" ||
      dayState.metadata
        ?.implicitOffDay
    ) {
      return "rest";
    }


    if (
      getCachedCompletedSessionForDate(
        dateKey
      )
    ) {
      return "complete";
    }


    return dayState.type ===
      "workout"
      ? "planned"
      : "empty";
  } catch (error) {
    console.warn(
      "[ARI Training] Could not resolve calendar status.",
      error
    );


    return "empty";
  }
}


function getSundayWeekStartKey(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    );

  if (!date) {
    return dateKey;
  }

  date.setDate(
    date.getDate() -
    date.getDay()
  );

  return getLocalDateKey(
    date
  );
}


function getPlanDayForDate(
  dateKey
) {
  if (!dateKey) {
    return null;
  }

  try {
    if (
      typeof WorkoutPlanController?.getDate ===
        "function"
    ) {
      return WorkoutPlanController
        .getDate(
          dateKey
        );
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Could not read calendar plan date.",
      error
    );
  }

  /*
   * Backward compatibility only.
   * Old controllers exposed one repeating Monday-Sunday week.
   */
  const weekday =
    weekdayIdFromDateKey(
      dateKey
    );

  return state.plan?.week?.[
    weekday
  ] ||
    null;
}


function getSelectedPlanDay() {
  return getPlanDayForDate(
    state.selectedDateKey
  );
}


function openWorkoutPlannerForSelectedDate() {
  const dateKey =
    state.selectedDateKey ||
    state.todayDateKey ||
    getLocalDateKey();

  window.location.href =
    `workout-plans.html?date=${encodeURIComponent(
      dateKey
    )}`;
}


// =====================================================
// SELECTED DAY
// =====================================================

async function renderSelectedDay() {
  const token =
    ++state.selectedDayRenderToken;


  if (
    state.activeSession &&
    OPEN_SESSION_STATUSES
      .includes(
        state.activeSession.status
      )
  ) {
    renderLiveSession();

    return;
  }


  hidePrimaryDayStates();


  const dateKey =
    state.selectedDateKey;


  const dayState =
    getPlanDayForDate(
      dateKey
    );


  /*
   * Plan state is checked before history. A completed session
   * remains in Monthly History, but it cannot visually override
   * a current Off Day or Recovery Day.
   */
  if (
    !dayState ||
    dayState.type ===
      "off" ||
    dayState.metadata
      ?.implicitOffDay
  ) {
    renderEmptyDay();

    return;
  }


  if (
    dayState.type ===
      "recovery"
  ) {
    renderRestDay(
      dayState
    );

    return;
  }


  if (
    dayState.type !==
      "workout" ||
    !Array.isArray(
      dayState.exercises
    ) ||
    dayState.exercises.length ===
      0
  ) {
    renderEmptyDay();

    return;
  }


  let completed =
    null;


  try {
    completed =
      await getCompletedSessionForDate(
        dateKey
      );
  } catch (error) {
    console.warn(
      "[ARI Training] Selected-day completion lookup failed.",
      error
    );
  }


  if (
    token !==
      state.selectedDayRenderToken ||
    dateKey !==
      state.selectedDateKey
  ) {
    return;
  }


  if (completed) {
    renderCompletedDay(
      completed
    );

    return;
  }


  renderPlannedDay(
    dayState
  );
}


function hidePrimaryDayStates() {
  setHidden(
    elements.todaysTrainingDayView,
    true
  );


  setHidden(
    elements.todaysTrainingEmpty,
    true
  );


  setHidden(
    elements.todaysTrainingRestDay,
    true
  );


  setHidden(
    elements.todaysTrainingCompletedDay,
    true
  );


  setHidden(
    elements.todaysTrainingSession,
    true
  );


  setHidden(
    elements.workoutCompletePanel,
    true
  );


  setHidden(
    elements.sessionExercisePicker,
    true
  );
}


function renderPlannedDay(
  dayState
) {
  setHidden(
    elements.todaysTrainingDayView,
    false
  );


  setText(
    elements.todaysTrainingEyebrow,

    state.selectedDateKey ===
      state.todayDateKey
      ? "Today's Training"
      : "Scheduled Training"
  );


  setSelectedDayDateText();


  setText(
    elements.todaysTrainingType,
    "Scheduled Workout"
  );


  setText(
    elements.todaysTrainingTitle,

    dayState.title ||
      "Workout"
  );


  setText(
    elements.todaysTrainingMeta,

    buildWorkoutMeta(
      dayState
    )
  );


  setDayStatus(
    "not_started"
  );


  renderSelectedDayExercisePreview(
    dayState.exercises ||
      []
  );


  if (
    elements.startTodayWorkoutButton
  ) {
    elements
      .startTodayWorkoutButton
      .disabled =
        false;


    elements
      .startTodayWorkoutButton
      .textContent =
        "Start Workout";
  }
}


function renderEmptyDay() {
  setHidden(
    elements.todaysTrainingEmpty,
    false
  );

  if (
    elements.startUnplannedWorkoutButton
  ) {
    elements
      .startUnplannedWorkoutButton
      .textContent =
        "Plan Workout";

    elements
      .startUnplannedWorkoutButton
      .disabled =
        false;
  }
}


function renderRestDay(
  dayState
) {
  setHidden(
    elements.todaysTrainingRestDay,
    false
  );


  setText(
    elements.restDayTitle,

    dayState.title ||
      "Rest & Recover"
  );


  setText(
    elements.restDayMessage,

    "Recovery is part of the program."
  );


  if (
    elements.trainOnRestDayButton
  ) {
    elements
      .trainOnRestDayButton
      .textContent =
        "Plan Workout";

    elements
      .trainOnRestDayButton
      .disabled =
        false;
  }
}


function renderCompletedDay(
  session
) {
  setHidden(
    elements.todaysTrainingCompletedDay,
    false
  );


  setText(
    elements.completedDayWorkoutName,

    session.title ||
      "Workout"
  );


  setText(
    elements.completedDayDuration,

    formatDurationSeconds(
      session.duration_seconds ||
        0
    )
  );


  setText(
    elements.completedDaySets,

    String(
      session.completed_sets ||
        0
    )
  );


  setText(
    elements.completedDayCalories,

    `${formatNumber(
      session.estimated_calories ||
        0
    )} kcal`
  );


  if (
    elements.undoCompletedWorkoutButton
  ) {
    const sessionId =
      session.id ||
      session.sessionId ||
      "";


    elements
      .undoCompletedWorkoutButton
      .dataset.sessionId =
        sessionId;


    elements
      .undoCompletedWorkoutButton
      .disabled =
        !sessionId;
  }
}


function setSelectedDayDateText() {
  if (
    !elements.todaysTrainingDate
  ) {
    return;
  }


  elements
    .todaysTrainingDate
    .dateTime =
      state.selectedDateKey;


  elements
    .todaysTrainingDate
    .textContent =
      formatLongDate(
        state.selectedDateKey
      );
}


function setDayStatus(
  status
) {
  if (
    !elements.todaysTrainingStatus
  ) {
    return;
  }


  elements
    .todaysTrainingStatus
    .dataset.status =
      status;


  elements
    .todaysTrainingStatus
    .textContent =
      getStatusLabel(
        status
      );
}


function renderSelectedDayExercisePreview(
  exerciseEntries
) {
  const container =
    elements.todaysTrainingExercisePreview;


  if (!container) {
    return;
  }


  container.replaceChildren();


  for (
    const entry
    of exerciseEntries
  ) {
    let exercise =
      null;


    try {
      exercise =
        ExerciseRegistry?.get?.(
          entry.exerciseId
        ) ||
        null;
    } catch {
      exercise = null;
    }


    const template =
      elements.trainingDayExercisePreviewTemplate;


    if (!template?.content) {
      continue;
    }


    const fragment =
      template.content
        .cloneNode(true);


    const root =
      fragment.querySelector(
        ".ari-training-day-exercise-preview"
      );


    if (!root) {
      continue;
    }


    setTextWithin(
      root,

      ".ari-training-day-exercise-preview__name",

      exercise?.name ||
        titleFromId(
          entry.exerciseId
        )
    );


    setTextWithin(
      root,

      ".ari-training-day-exercise-preview__prescription",

      getShortPrescription(
        entry
      )
    );


    container.appendChild(
      fragment
    );
  }
}


// =====================================================
// START WORKOUT
// =====================================================

async function startSelectedPlannedWorkout() {
  const button =
    elements.startTodayWorkoutButton;


  console.info(
    "[ARI Training] Start Workout button received click."
  );


  if (state.saving) {
    return;
  }


  /*
   * If the button is clicked before dependencies finish,
   * attempt to finish loading them now.
   */
  if (
    !dependencyState.loaded ||
    !WorkoutPlanController ||
    !ExerciseRegistry
  ) {
    const ready =
      await loadTrainingDependencies();


    if (!ready) {
      const failure =
        getCriticalDependencyFailure();


      console.error(
        "[ARI Training] Start blocked because a critical dependency is unavailable.",
        cloneSafe(
          dependencyState
        )
      );


      showTrainingMessage(
        failure
          ? `Training engine problem: ${failure.key}.`
          : "Training engine did not load.",
        "error",
        8000
      );


      return;
    }
  }


  if (!state.plan?.week) {
    try {
      state.plan =
        WorkoutPlanController
          .getPlan();
    } catch (error) {
      console.error(
        "[ARI Training] Could not recover workout plan.",
        error
      );
    }
  }


  const weekday =
    weekdayIdFromDateKey(
      state.selectedDateKey
    );


  const dayState =
    getSelectedPlanDay();


  if (
    !dayState ||
    dayState.type !==
      "workout" ||
    !Array.isArray(
      dayState.exercises
    ) ||
    dayState.exercises.length ===
      0
  ) {
    console.warn(
      "[ARI Training] No planned workout found for selected date.",

      {
        selectedDate:
          state.selectedDateKey,

        weekday,

        dayState,

        plan:
          state.plan
      }
    );


    showTrainingMessage(
      "Plan a workout for this date first.",
      "warning"
    );


    openWorkoutPlannerForSelectedDate();

    return;
  }


  state.saving =
    true;


  setButtonBusy(
    button,
    true,
    "Starting..."
  );


  try {
    if (!state.user?.id) {
      await resolveCurrentUser();
    }


    const existing =
      await fetchOpenSession();


    if (existing?.id) {
      await hydrateFullSession(
        existing.id
      );


      state.selectedDateKey =
        existing.local_date ||
        state.selectedDateKey;


      persistSelectedDate();


      renderAll();


      showTrainingMessage(
        "Workout resumed.",
        "success"
      );


      return;
    }


    const session =
      await createWorkoutSession({
        source:
          "planned",

        title:
          dayState.title ||
          "Workout",

        localDate:
          state.selectedDateKey,

        weekday,

        planId:
          getPlanReference()
      });


    if (!session?.id) {
      throw new Error(
        "Workout session creation returned no session ID."
      );
    }


    state.activeSession = {
      ...session,

      exercises:
        session.exercises ||
        [],

      heartRateReadings:
        session.heartRateReadings ||
        []
    };


    state.currentExerciseId =
      null;


    persistLocalSessionCache();


    /*
     * Immediate visible transition.
     */
    renderLiveSession();


    await seedPlannedSessionExercises(
      session,
      dayState.exercises ||
        []
    );


    if (
      !String(
        session.id
      ).startsWith(
        "local_"
      )
    ) {
      await hydrateFullSession(
        session.id
      );
    }


    const firstExercise =
      getOrderedSessionExercises()
        .find(
          exercise =>
            exercise.status ===
            "pending"
        );


    if (firstExercise) {
      await setCurrentExercise(
        firstExercise
      );
    } else {
      state.currentExerciseId =
        resolveCurrentExerciseId(
          state.activeSession
            ?.exercises ||
            []
        );
    }


    persistLocalSessionCache();


    renderAll();


    console.info(
      "[ARI Training] Workout started successfully.",

      {
        sessionId:
          state.activeSession?.id,

        currentExerciseId:
          state.currentExerciseId
      }
    );
  } catch (error) {
    console.error(
      "[ARI Training] START FAILED:",
      error
    );


    if (
      state.activeSession &&
      OPEN_SESSION_STATUSES
        .includes(
          state.activeSession.status
        )
    ) {
      persistLocalSessionCache();


      renderLiveSession();


      showTrainingMessage(
        "Workout opened, but cloud sync had a problem. Your session is still on this device.",
        "warning"
      );
    } else {
      showTrainingMessage(
        readableError(
          error,
          "Workout couldn't start. Tap Start Workout to try again."
        ),
        "error"
      );
    }
  } finally {
    state.saving =
      false;


    setButtonBusy(
      button,
      false,
      "Start Workout"
    );
  }
}


async function startAdHocWorkout() {
  if (state.saving) {
    return;
  }


  if (!dependencyState.loaded) {
    const ready =
      await loadTrainingDependencies();


    if (!ready) {
      showTrainingMessage(
        "Training engine did not load.",
        "error"
      );


      return;
    }
  }


  state.saving =
    true;


  try {
    if (!state.user?.id) {
      await resolveCurrentUser();
    }


    const existing =
      await fetchOpenSession();


    if (existing?.id) {
      await hydrateFullSession(
        existing.id
      );


      renderAll();


      openExercisePicker();


      return;
    }


    const session =
      await createWorkoutSession({
        source:
          "ad_hoc",

        title:
          "Quick Workout",

        localDate:
          state.selectedDateKey,

        weekday:
          weekdayIdFromDateKey(
            state.selectedDateKey
          ),

        planId:
          null
      });


    if (!session?.id) {
      throw new Error(
        "Quick workout session could not be created."
      );
    }


    state.activeSession = {
      ...session,

      exercises:
        session.exercises ||
        [],

      heartRateReadings:
        session.heartRateReadings ||
        []
    };


    persistLocalSessionCache();


    if (
      !String(
        session.id
      ).startsWith(
        "local_"
      )
    ) {
      await hydrateFullSession(
        session.id
      );
    }


    renderAll();


    openExercisePicker();
  } catch (error) {
    console.error(
      "[ARI Training] Could not start quick workout.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Quick workout couldn't start."
      ),
      "error"
    );
  } finally {
    state.saving =
      false;
  }
}


async function undoCompletedWorkout(
  sessionId =
    elements
      .undoCompletedWorkoutButton
      ?.dataset.sessionId
) {


  if (!sessionId) {
    return false;
  }


  return deleteHistorySession(
    sessionId,
    {
      confirmationMessage:
        "Undo this completed workout? Its saved sets, time, calories, and heart-rate data will be removed. Your workout plan will stay unchanged.",

      successMessage:
        "Workout completion undone."
    }
  );
}


async function startTrainAgainWorkout() {
  if (state.saving) {
    return;
  }


  const weekday =
    weekdayIdFromDateKey(
      state.selectedDateKey
    );


  const dayState =
    getSelectedPlanDay();


  if (
    dayState &&
    dayState.type !==
      "off"
  ) {
    await startRepeatFromPlan(
      dayState,
      weekday
    );


    return;
  }


  const completed =
    await getCompletedSessionForDate(
      state.selectedDateKey
    );


  if (completed) {
    await startRepeatFromCompletedSession(
      completed
    );
  }
}


async function startRepeatFromPlan(
  dayState,
  weekday
) {
  state.saving =
    true;


  try {
    const existing =
      await fetchOpenSession();


    if (existing?.id) {
      await hydrateFullSession(
        existing.id
      );


      renderAll();


      return;
    }


    const session =
      await createWorkoutSession({
        source:
          "repeat",

        title:
          dayState.title ||
          "Workout",

        localDate:
          state.selectedDateKey,

        weekday,

        planId:
          getPlanReference()
      });


    state.activeSession = {
      ...session,

      exercises: [],

      heartRateReadings: []
    };


    persistLocalSessionCache();


    renderLiveSession();


    await seedPlannedSessionExercises(
      session,
      dayState.exercises ||
        []
    );


    if (
      !String(
        session.id
      ).startsWith(
        "local_"
      )
    ) {
      await hydrateFullSession(
        session.id
      );
    }


    const first =
      getOrderedSessionExercises()
        .find(
          item =>
            item.status ===
            "pending"
        );


    if (first) {
      await setCurrentExercise(
        first
      );
    }


    renderAll();
  } catch (error) {
    console.error(
      "[ARI Training] Train Again failed.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Train Again couldn't start."
      ),
      "error"
    );
  } finally {
    state.saving =
      false;
  }
}


async function startRepeatFromCompletedSession(
  completed
) {
  const client =
    getSupabase();


  if (!completed?.id) {
    return;
  }


  state.saving =
    true;


  try {
    const session =
      await createWorkoutSession({
        source:
          "repeat",

        title:
          completed.title ||
          "Workout",

        localDate:
          state.selectedDateKey,

        weekday:
          weekdayIdFromDateKey(
            state.selectedDateKey
          ),

        planId:
          completed.plan_id ||
          null
      });


    state.activeSession = {
      ...session,

      exercises: [],

      heartRateReadings: []
    };


    if (
      !client ||
      String(
        completed.id
      ).startsWith(
        "local_"
      )
    ) {
      renderAll();


      openExercisePicker();


      return;
    }


    const {
      data:
        previousExercises,

      error
    } =
      await client
        .from(
          "ari_workout_session_exercises"
        )
        .select("*")
        .eq(
          "session_id",
          completed.id
        )
        .eq(
          "user_id",
          state.user.id
        )
        .order(
          "sort_order",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    for (
      const previous
      of previousExercises ||
      []
    ) {
      await createSessionExercise({
        sessionId:
          session.id,

        exerciseId:
          previous.exercise_id,

        exerciseName:
          previous.exercise_name,

        exerciseType:
          previous.exercise_type,

        source:
          "ad_hoc",

        sortOrder:
          previous.sort_order,

        completionMode:
          previous.completion_mode,

        plannedSets:
          previous.planned_sets,

        plannedReps:
          previous.planned_reps,

        plannedWeight:
          previous.planned_weight,

        plannedDurationSeconds:
          previous.planned_duration_seconds
      });
    }


    await hydrateFullSession(
      session.id
    );


    const first =
      getOrderedSessionExercises()
        .find(
          item =>
            item.status ===
            "pending"
        );


    if (first) {
      await setCurrentExercise(
        first
      );
    }


    renderAll();
  } catch (error) {
    console.error(
      "[ARI Training] Could not repeat completed workout.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Repeat workout couldn't start."
      ),
      "error"
    );
  } finally {
    state.saving =
      false;
  }
}


async function cancelActiveWorkout() {
  const session =
    state.activeSession;

  if (
    !session ||
    !OPEN_SESSION_STATUSES
      .includes(
        session.status
      )
  ) {
    return false;
  }

  if (
    !window.confirm(
      "Cancel this workout? Any progress from this session will be discarded."
    )
  ) {
    return false;
  }

  state.saving =
    true;

  try {
    await deleteWorkoutSessionRecord(
      session.id
    );

    const dateKey =
      session.local_date ||
      state.selectedDateKey;


    /*
     * Clear controller state before the progress store emits.
     * That prevents its subscription from remounting the live card.
     */
    state.activeSession =
      null;

    state.currentExerciseId =
      null;

    state.rest =
      null;

    clearLocalSessionCache();

    clearRestInterval();

    try {
      WorkoutProgressStore
        ?.cancelDay?.(
          dateKey,
          {
            preservePlannedEntries:
              true
          }
        );
    } catch (error) {
      console.warn(
        "[ARI Training] Local progress cancellation failed.",
        error
      );
    }

    /*
     * Await the selected-day render so Cancel visibly finishes
     * without requiring a browser refresh.
     */
    await Promise.all([
      renderSelectedDay(),
      renderHistory(),
      renderPerformance()
    ]);

    renderCalendar();

    showTrainingMessage(
      "Workout cancelled.",
      "success"
    );

    return true;
  } catch (error) {
    console.error(
      "[ARI Training] Could not cancel workout.",
      error
    );

    showTrainingMessage(
      readableError(
        error,
        "Workout could not be cancelled."
      ),
      "error"
    );

    return false;
  } finally {
    state.saving =
      false;
  }
}


async function deleteWorkoutSessionRecord(
  sessionId
) {
  if (
    !sessionId
  ) {
    return false;
  }

  if (
    String(
      sessionId
    ).startsWith(
      "local_"
    )
  ) {
    removeCompletedSessionFromLocalCache(
      sessionId
    );

    return true;
  }

  const client =
    getSupabase();

  if (
    !client ||
    !state.user?.id
  ) {
    removeCompletedSessionFromLocalCache(
      sessionId
    );

    return true;
  }

  /*
   * Delete children explicitly so this also works when the
   * database does not have cascading foreign keys enabled.
   */
  for (
    const table
    of [
      "ari_workout_session_sets",
      "ari_workout_heart_rate_readings",
      "ari_workout_session_exercises"
    ]
  ) {
    const {
      error
    } =
      await client
        .from(
          table
        )
        .delete()
        .eq(
          "session_id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        );

    if (
      error
    ) {
      throw error;
    }
  }

  const {
    error
  } =
    await client
      .from(
        "ari_workout_sessions"
      )
      .delete()
      .eq(
        "id",
        sessionId
      )
      .eq(
        "user_id",
        state.user.id
      );

  if (
    error
  ) {
    throw error;
  }

  removeCompletedSessionFromLocalCache(
    sessionId
  );

  return true;
}


function removeCompletedSessionFromLocalCache(
  sessionId
) {
  try {
    const records =
      getCachedCompletedSessions()
        .filter(
          record =>
            String(
              record.id
            ) !==
            String(
              sessionId
            )
        );

    localStorage.setItem(
      LOCAL_COMPLETED_CACHE_KEY,
      JSON.stringify(
        records
      )
    );
  } catch (error) {
    console.warn(
      "[ARI Training] Completed-session cache cleanup failed.",
      error
    );
  }
}


// =====================================================
// SESSION CREATION
// =====================================================

async function createWorkoutSession({
  source,
  title,
  localDate,
  weekday,
  planId
}) {
  const client =
    getSupabase();


  /*
   * Offline/local fallback.
   */
  if (
    !client ||
    !state.user?.id
  ) {
    const localSession = {
      id:
        `local_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      user_id:
        state.user?.id ||
        "local",

      plan_id:
        planId,

      local_date:
        localDate,

      timezone:
        getUserTimeZone(),

      planned_weekday:
        weekday,

      title,

      source,

      status:
        "active",

      started_at:
        new Date()
          .toISOString(),

      paused_at:
        null,

      paused_duration_seconds:
        0,

      completed_at:
        null,

      duration_seconds:
        null,

      selected_intensity:
        null,

      resolved_intensity:
        null,

      average_heart_rate:
        null,

      peak_heart_rate:
        null,

      estimated_calories:
        0,

      exercises:
        [],

      heartRateReadings:
        []
    };


    state.activeSession =
      localSession;


    persistLocalSessionCache();


    return localSession;
  }


  const {
    data,
    error
  } =
    await client
      .from(
        "ari_workout_sessions"
      )
      .insert({
        user_id:
          state.user.id,

        plan_id:
          planId,

        local_date:
          localDate,

        timezone:
          getUserTimeZone(),

        planned_weekday:
          weekday,

        title,

        source,

        status:
          "active"
      })
      .select()
      .single();


  if (error) {
    /*
     * If duplicate/open-session restriction fired,
     * recover the existing session.
     */
    const existing =
      await fetchOpenSession();


    if (existing?.id) {
      return existing;
    }


    throw error;
  }


  return data;
}


async function seedPlannedSessionExercises(
  session,
  exerciseEntries
) {
  if (!session) {
    return;
  }


  for (
    let index = 0;
    index < exerciseEntries.length;
    index += 1
  ) {
    const entry =
      exerciseEntries[
        index
      ];


    let exercise =
      null;


    try {
      exercise =
        ExerciseRegistry?.get?.(
          entry.exerciseId
        ) ||
        null;
    } catch {
      exercise = null;
    }


    const plannedSets =
      normalizeRequiredSets(
        entry
      );


    await createSessionExercise({
      sessionId:
        session.id,

      exerciseId:
        entry.exerciseId,

      exerciseName:
        exercise?.name ||
        titleFromId(
          entry.exerciseId
        ),

      exerciseType:
        getExerciseTypeLabel(
          exercise
        ),

      source:
        "planned",

      sortOrder:
        index,

      completionMode:
        plannedSets > 0
          ? "sets"
          : "single",

      plannedSets:
        plannedSets > 0
          ? plannedSets
          : null,

      plannedReps:
        normalizePositiveInteger(
          entry.reps
        ),

      plannedWeight:
        resolvePlannedWeight(
          entry
        ),

      plannedDurationSeconds:
        getPlannedDurationSeconds(
          entry
        )
    });
  }
}


async function createSessionExercise({
  sessionId,
  exerciseId,
  exerciseName,
  exerciseType,
  source,
  sortOrder,
  completionMode,
  plannedSets,
  plannedReps,
  plannedWeight,
  plannedDurationSeconds
}) {
  const client =
    getSupabase();


  /*
   * Local workout.
   */
  if (
    !client ||
    String(
      sessionId
    ).startsWith(
      "local_"
    )
  ) {
    const exercise = {
      id:
        `local_ex_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      session_id:
        sessionId,

      exercise_id:
        exerciseId,

      exercise_name:
        exerciseName,

      exercise_type:
        exerciseType,

      sort_order:
        sortOrder,

      source,

      status:
        "pending",

      completion_mode:
        completionMode,

      planned_sets:
        plannedSets,

      planned_reps:
        plannedReps,

      planned_weight:
        plannedWeight,

      planned_duration_seconds:
        plannedDurationSeconds,

      actual_duration_seconds:
        null,

      estimated_calories:
        0,

      completed_at:
        null,

      sets:
        []
    };


    if (
      completionMode ===
        "sets" &&
      plannedSets
    ) {
      for (
        let setNumber = 1;
        setNumber <= plannedSets;
        setNumber += 1
      ) {
        exercise.sets.push({
          id:
            `local_set_${Date.now()}_${setNumber}_${Math.random()
              .toString(36)
              .slice(2, 6)}`,

          session_id:
            sessionId,

          session_exercise_id:
            exercise.id,

          set_number:
            setNumber,

          planned_reps:
            plannedReps,

          planned_weight:
            plannedWeight,

          actual_reps:
            null,

          actual_weight:
            plannedWeight,

          completed:
            false,

          completed_at:
            null,

          estimated_calories:
            0
        });
      }
    }


    state.activeSession
      ?.exercises
      ?.push(
        exercise
      );


    persistLocalSessionCache();


    return exercise;
  }


  const {
    data:
      exerciseRow,

    error
  } =
    await client
      .from(
        "ari_workout_session_exercises"
      )
      .insert({
        session_id:
          sessionId,

        user_id:
          state.user.id,

        exercise_id:
          exerciseId,

        exercise_name:
          exerciseName,

        exercise_type:
          exerciseType,

        sort_order:
          sortOrder,

        source,

        status:
          "pending",

        completion_mode:
          completionMode,

        planned_sets:
          plannedSets,

        planned_reps:
          plannedReps,

        planned_weight:
          plannedWeight,

        planned_duration_seconds:
          plannedDurationSeconds
      })
      .select()
      .single();


  if (error) {
    throw error;
  }


  if (
    completionMode ===
      "sets" &&
    plannedSets
  ) {
    const rows = [];


    for (
      let setNumber = 1;
      setNumber <= plannedSets;
      setNumber += 1
    ) {
      rows.push({
        session_id:
          sessionId,

        session_exercise_id:
          exerciseRow.id,

        user_id:
          state.user.id,

        set_number:
          setNumber,

        planned_reps:
          plannedReps,

        planned_weight:
          plannedWeight,

        actual_reps:
          null,

        actual_weight:
          plannedWeight,

        completed:
          false,

        estimated_calories:
          0
      });
    }


    const {
      error:
        setError
    } =
      await client
        .from(
          "ari_workout_session_sets"
        )
        .insert(
          rows
        );


    if (setError) {
      throw setError;
    }
  }


  return exerciseRow;
}


// =====================================================
// SESSION RESTORATION
// =====================================================

async function restoreOpenSession({
  preserveCurrent =
    false
} = {}) {
  if (
    preserveCurrent &&
    state.activeSession &&
    OPEN_SESSION_STATUSES
      .includes(
        state.activeSession.status
      )
  ) {
    return state.activeSession;
  }


  const open =
    await fetchOpenSession();


  if (open?.id) {
    await hydrateFullSession(
      open.id
    );


    state.selectedDateKey =
      open.local_date ||
      state.selectedDateKey;


    persistSelectedDate();


    return state.activeSession;
  }


  return restoreLocalSessionCache();
}


async function fetchOpenSession() {
  const client =
    getSupabase();


  if (
    !client ||
    !state.user?.id
  ) {
    return null;
  }


  try {
    const {
      data,
      error
    } =
      await client
        .from(
          "ari_workout_sessions"
        )
        .select("*")
        .eq(
          "user_id",
          state.user.id
        )
        .in(
          "status",
          OPEN_SESSION_STATUSES
        )
        .order(
          "started_at",
          {
            ascending:
              false
          }
        )
        .limit(1)
        .maybeSingle();


    if (error) {
      throw error;
    }


    return data ||
      null;
  } catch (error) {
    console.warn(
      "[ARI Training] Open session query failed.",
      error
    );


    return null;
  }
}


async function hydrateFullSession(
  sessionId
) {
  const client =
    getSupabase();


  if (
    !client ||
    String(
      sessionId
    ).startsWith(
      "local_"
    )
  ) {
    restoreLocalSessionCache();


    return state.activeSession;
  }


  const [
    sessionResult,
    exercisesResult,
    setsResult,
    hrResult
  ] =
    await Promise.all([
      client
        .from(
          "ari_workout_sessions"
        )
        .select("*")
        .eq(
          "id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .single(),

      client
        .from(
          "ari_workout_session_exercises"
        )
        .select("*")
        .eq(
          "session_id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .order(
          "sort_order",
          {
            ascending:
              true
          }
        ),

      client
        .from(
          "ari_workout_session_sets"
        )
        .select("*")
        .eq(
          "session_id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .order(
          "set_number",
          {
            ascending:
              true
          }
        ),

      client
        .from(
          "ari_workout_heart_rate_readings"
        )
        .select("*")
        .eq(
          "session_id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .order(
          "recorded_at",
          {
            ascending:
              true
          }
        )
    ]);


  if (
    sessionResult.error
  ) {
    throw sessionResult.error;
  }


  if (
    exercisesResult.error
  ) {
    throw exercisesResult.error;
  }


  if (
    setsResult.error
  ) {
    throw setsResult.error;
  }


  if (
    hrResult.error
  ) {
    throw hrResult.error;
  }


  const exercises =
    exercisesResult.data ||
    [];


  const sets =
    setsResult.data ||
    [];


  for (
    const exercise
    of exercises
  ) {
    exercise.sets =
      sets.filter(
        set =>
          String(
            set.session_exercise_id
          ) ===
          String(
            exercise.id
          )
      );
  }


  state.activeSession = {
    ...sessionResult.data,

    exercises,

    heartRateReadings:
      hrResult.data ||
      []
  };


  state.currentExerciseId =
    resolveCurrentExerciseId(
      exercises
    );


  restoreRestState();


  persistLocalSessionCache();


  return state.activeSession;
}


function resolveCurrentExerciseId(
  exercises
) {
  return (
    exercises.find(
      item =>
        item.status ===
        "current"
    )?.id ||

    exercises.find(
      item =>
        item.status ===
        "pending"
    )?.id ||

    exercises.find(
      item =>
        item.status !==
          "completed" &&
        item.status !==
          "skipped"
    )?.id ||

    null
  );
}


// =====================================================
// LIVE SESSION
// =====================================================

function renderLiveSession() {
  const session =
    state.activeSession;


  if (!session) {
    return;
  }


  hidePrimaryDayStates();


  setHidden(
    elements.todaysTrainingSession,
    false
  );


  setText(
    elements.liveSessionWorkoutName,

    session.title ||
      "Workout"
  );


  setHidden(
    elements.cancelTodayWorkoutButton,
    false
  );


  if (
    elements.pauseTodayWorkoutButton
  ) {
    elements
      .pauseTodayWorkoutButton
      .textContent =
        session.status ===
          "paused"
          ? "Resume"
          : "Pause";
  }


  renderLiveProgress();

  renderCurrentExercise();

  renderSessionExerciseQueue();

  renderRestTimer();
}


function renderLiveProgress() {
  const stats =
    getLiveSessionSetStats();


  setText(
    elements.todaySessionElapsed,

    formatElapsedClock(
      getElapsedSessionSeconds()
    )
  );


  setText(
    elements.todaySessionSets,

    `${stats.completed} / ${stats.required} sets`
  );


  if (
    elements.todaySessionProgressFill
  ) {
    const percent =
      stats.required > 0
        ? Math.min(
            100,

            (
              stats.completed /
              stats.required
            ) *
              100
          )
        : 0;


    elements
      .todaySessionProgressFill
      .style.width =
        `${percent}%`;
  }
}


function renderCurrentExercise() {
  const exercise =
    getCurrentSessionExercise();


  if (!exercise) {
    setText(
      elements.todayCurrentExerciseName,

      "Workout Ready to Finish"
    );


    setText(
      elements.todayCurrentExercisePrescription,

      "All remaining exercises are complete or skipped."
    );


    setText(
      elements.todayCurrentExercisePosition,

      "â"
    );


    elements.todayCurrentExerciseSets
      ?.replaceChildren();


    return;
  }


  setText(
    elements.todayCurrentExerciseName,

    exercise.exercise_name ||
      "Exercise"
  );


  setText(
    elements.todayCurrentExercisePrescription,

    getSessionExercisePrescription(
      exercise
    )
  );


  const activeExercises =
    getOrderedSessionExercises()
      .filter(
        item =>
          item.status !==
          "skipped"
      );


  const position =
    activeExercises
      .findIndex(
        item =>
          item.id ===
          exercise.id
      );


  setText(
    elements.todayCurrentExercisePosition,

    `${Math.max(
      1,
      position + 1
    )} / ${activeExercises.length || 1}`
  );


  renderCurrentExerciseSets(
    exercise
  );
}


function renderCurrentExerciseSets(
  exercise
) {
  const container =
    elements.todayCurrentExerciseSets;


  if (!container) {
    return;
  }


  container.replaceChildren();


  if (
    exercise.completion_mode ===
    "single"
  ) {
    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "ari-primary-button";


    button.dataset.action =
      "complete-single-activity";


    button.dataset.exerciseId =
      exercise.id;


    button.textContent =
      exercise.status ===
        "completed"
        ? "Activity Complete"
        : "Complete Activity";


    button.disabled =
      exercise.status ===
      "completed";


    container.appendChild(
      button
    );


    return;
  }


  for (
    const set
    of exercise.sets ||
    []
  ) {
    container.appendChild(
      createLiveSetElement(
        exercise,
        set
      )
    );
  }
}


function createLiveSetElement(
  exercise,
  set
) {
  const template =
    elements.todayWorkoutSetTemplate;


  if (!template?.content) {
    const fallback =
      document.createElement(
        "button"
      );


    fallback.type =
      "button";


    fallback.dataset.action =
      "complete-live-set";


    fallback.dataset.setId =
      set.id;


    fallback.dataset.exerciseId =
      exercise.id;


    fallback.textContent =
      `Complete Set ${set.set_number}`;


    return fallback;
  }


  const fragment =
    template.content
      .cloneNode(true);


  const root =
    fragment.querySelector(
      ".ari-live-set"
    );


  if (!root) {
    const fallback =
      document.createElement(
        "button"
      );


    fallback.type =
      "button";


    fallback.dataset.action =
      "complete-live-set";


    fallback.dataset.setId =
      set.id;


    fallback.dataset.exerciseId =
      exercise.id;


    fallback.textContent =
      `Complete Set ${set.set_number}`;


    return fallback;
  }


  const weightInput =
    root.querySelector(
      ".ari-live-set__weight"
    );


  const repsInput =
    root.querySelector(
      ".ari-live-set__reps"
    );


  const completeButton =
    root.querySelector(
      ".ari-live-set__complete"
    );


  root.dataset.setId =
    set.id;


  root.dataset.status =
    set.completed
      ? "complete"
      : "not_started";


  setTextWithin(
    root,

    ".ari-live-set__label",

    `Set ${set.set_number}`
  );


  setTextWithin(
    root,

    ".ari-live-set__target",

    buildSetTarget(
      set
    )
  );


  if (weightInput) {
    weightInput.value =
      set.actual_weight ??
      set.planned_weight ??
      "";


    weightInput.disabled =
      Boolean(
        set.completed
      );
  }


  if (repsInput) {
    repsInput.value =
      set.actual_reps ??
      set.planned_reps ??
      "";


    repsInput.disabled =
      Boolean(
        set.completed
      );
  }


  if (completeButton) {
    completeButton.dataset.action =
      "complete-live-set";


    completeButton.dataset.setId =
      set.id;


    completeButton.dataset.exerciseId =
      exercise.id;


    completeButton.textContent =
      set.completed
        ? "Set Complete"
        : "Complete Set";


    completeButton.disabled =
      Boolean(
        set.completed
      );
  }


  if (set.completed) {
    root.classList.add(
      "is-complete"
    );
  }


  return fragment;
}


async function handleLiveSetClick(
  event
) {
  const button =
    event.target.closest(
      "[data-action]"
    );


  if (!button) {
    return;
  }


  if (
    button.dataset.action ===
    "complete-live-set"
  ) {
    await completeLiveSet(
      button
    );


    return;
  }


  if (
    button.dataset.action ===
    "complete-single-activity"
  ) {
    await completeSingleActivity(
      button.dataset.exerciseId
    );
  }
}


async function completeLiveSet(
  button
) {
  const session =
    state.activeSession;


  if (
    !session ||
    session.status !==
      "active"
  ) {
    return;
  }


  const exercise =
    getSessionExerciseById(
      button.dataset.exerciseId
    );


  const set =
    exercise?.sets?.find(
      item =>
        String(
          item.id
        ) ===
        String(
          button.dataset.setId
        )
    );


  if (
    !exercise ||
    !set ||
    set.completed
  ) {
    return;
  }


  const root =
    button.closest(
      ".ari-live-set"
    );


  const actualWeight =
    normalizeNonNegativeNumber(
      root
        ?.querySelector(
          ".ari-live-set__weight"
        )
        ?.value
    );


  const actualReps =
    normalizeNonNegativeInteger(
      root
        ?.querySelector(
          ".ari-live-set__reps"
        )
        ?.value
    );


  const estimatedCalories =
    estimateSetCalories(
      exercise
    );


  const completedAt =
    new Date()
      .toISOString();


  if (isLocalSession()) {
    Object.assign(
      set,

      {
        actual_weight:
          actualWeight,

        actual_reps:
          actualReps,

        completed:
          true,

        completed_at:
          completedAt,

        estimated_calories:
          estimatedCalories
      }
    );
  } else {
    const client =
      getSupabase();


    if (!client) {
      showTrainingMessage(
        "Cloud connection is unavailable.",
        "warning"
      );


      return;
    }


    const {
      error
    } =
      await client
        .from(
          "ari_workout_session_sets"
        )
        .update({
          actual_weight:
            actualWeight,

          actual_reps:
            actualReps,

          completed:
            true,

          completed_at:
            completedAt,

          estimated_calories:
            estimatedCalories
        })
        .eq(
          "id",
          set.id
        )
        .eq(
          "user_id",
          state.user.id
        );


    if (error) {
      console.error(
        "[ARI Training] Set completion failed.",
        error
      );


      showTrainingMessage(
        readableError(
          error,
          "Set couldn't be saved."
        ),
        "error"
      );


      return;
    }


    Object.assign(
      set,

      {
        actual_weight:
          actualWeight,

        actual_reps:
          actualReps,

        completed:
          true,

        completed_at:
          completedAt,

        estimated_calories:
          estimatedCalories
      }
    );
  }


  await updateExerciseCompletionState(
    exercise
  );


  await syncWeeklyProgressFromSessionExercise(
    exercise
  );


  if (
    hasRemainingIncompleteWork()
  ) {
    startRestTimer(
      DEFAULT_REST_SECONDS
    );
  } else {
    skipRest();


    showTrainingMessage(
      "All planned work is complete. Finish when you're ready.",
      "success"
    );
  }


  persistLocalSessionCache();


  renderLiveSession();
}


async function completeSingleActivity(
  exerciseId
) {
  const exercise =
    getSessionExerciseById(
      exerciseId
    );


  if (
    !exercise ||
    exercise.status ===
      "completed"
  ) {
    return;
  }


  const calories =
    estimateSingleActivityCalories(
      exercise
    );


  await updateSessionExercise({
    exercise,

    patch: {
      status:
        "completed",

      estimated_calories:
        calories,

      completed_at:
        new Date()
          .toISOString()
    }
  });


  await syncWeeklyProgressFromSessionExercise(
    exercise
  );


  await chooseNextExercise();


  if (
    !hasRemainingIncompleteWork()
  ) {
    showTrainingMessage(
      "Workout work complete. Finish when you're ready.",
      "success"
    );
  }


  renderLiveSession();
}


async function updateExerciseCompletionState(
  exercise
) {
  if (
    exercise.completion_mode !==
    "sets"
  ) {
    return;
  }


  const sets =
    exercise.sets ||
    [];


  const complete =
    sets.length > 0 &&
    sets.every(
      set =>
        set.completed
    );


  if (!complete) {
    return;
  }


  const calories =
    sets.reduce(
      (
        total,
        set
      ) =>
        total +
        (
          Number(
            set.estimated_calories
          ) ||
          0
        ),
      0
    );


  await updateSessionExercise({
    exercise,

    patch: {
      status:
        "completed",

      completed_at:
        new Date()
          .toISOString(),

      estimated_calories:
        calories
    }
  });


  await chooseNextExercise();
}


function hasRemainingIncompleteWork() {
  return getOrderedSessionExercises()
    .some(
      exercise =>
        exercise.status ===
          "pending" ||
        exercise.status ===
          "current"
    );
}


// =====================================================
// EXERCISE ORDER
// =====================================================

async function doCurrentExerciseLater() {
  const current =
    getCurrentSessionExercise();


  if (!current) {
    return;
  }


  if (
    current.status ===
    "current"
  ) {
    await updateSessionExercise({
      exercise:
        current,

      patch: {
        status:
          "pending"
      }
    });
  }


  await chooseNextExercise({
    excludeId:
      current.id
  });


  renderLiveSession();
}


async function skipCurrentExercise() {
  const current =
    getCurrentSessionExercise();


  if (!current) {
    return;
  }


  await updateSessionExercise({
    exercise:
      current,

    patch: {
      status:
        "skipped"
    }
  });


  await chooseNextExercise({
    excludeId:
      current.id
  });


  renderLiveSession();
}


async function chooseNextExercise({
  excludeId =
    null
} = {}) {
  const next =
    getOrderedSessionExercises()
      .find(
        exercise =>
          exercise.id !==
            excludeId &&
          exercise.status ===
            "pending"
      );


  if (!next) {
    state.currentExerciseId =
      null;


    persistLocalSessionCache();


    return;
  }


  await setCurrentExercise(
    next
  );
}


async function setCurrentExercise(
  exercise
) {
  if (!exercise) {
    return;
  }


  const current =
    getCurrentSessionExercise();


  if (
    current &&
    current.id !==
      exercise.id &&
    current.status ===
      "current"
  ) {
    await updateSessionExercise({
      exercise:
        current,

      patch: {
        status:
          "pending"
      }
    });
  }


  if (
    exercise.status ===
    "pending"
  ) {
    await updateSessionExercise({
      exercise,

      patch: {
        status:
          "current"
      }
    });
  }


  state.currentExerciseId =
    exercise.id;


  persistLocalSessionCache();
}


function renderSessionExerciseQueue() {
  const container =
    elements.todayExerciseList;


  if (
    !container ||
    !state.activeSession
  ) {
    return;
  }


  container.replaceChildren();


  for (
    const exercise
    of getOrderedSessionExercises()
  ) {
    container.appendChild(
      createSessionExerciseQueueRow(
        exercise
      )
    );
  }
}


function createSessionExerciseQueueRow(
  exercise
) {
  const template =
    elements.todayWorkoutExerciseTemplate;


  let button;


  if (template?.content) {
    const fragment =
      template.content
        .cloneNode(true);


    button =
      fragment.querySelector(
        ".ari-session-exercise-row"
      );


    if (!button) {
      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "ari-session-exercise-row";
    }


    setTextWithin(
      button,

      ".ari-session-exercise-row__name",

      exercise.exercise_name
    );


    setTextWithin(
      button,

      ".ari-session-exercise-row__prescription",

      getSessionExercisePrescription(
        exercise
      )
    );


    setTextWithin(
      button,

      ".ari-session-exercise-row__status",

      getExerciseStateIcon(
        exercise.status
      )
    );


    setTextWithin(
      button,

      ".ari-session-exercise-row__meta",

      getExerciseStateLabel(
        exercise.status
      )
    );
  } else {
    button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "ari-session-exercise-row";


    button.textContent =
      `${exercise.exercise_name} Â· ${getExerciseStateLabel(
        exercise.status
      )}`;
  }


  button.dataset.exerciseId =
    exercise.id;


  button.dataset.status =
    exercise.status;


  button.dataset.action =
    "select-session-exercise";


  return button;
}


async function handleSessionExerciseQueueClick(
  event
) {
  const button =
    event.target.closest(
      '[data-action="select-session-exercise"]'
    );


  if (!button) {
    return;
  }


  const exercise =
    getSessionExerciseById(
      button.dataset.exerciseId
    );


  if (
    !exercise ||
    exercise.status ===
      "completed" ||
    exercise.status ===
      "skipped"
  ) {
    return;
  }


  await setCurrentExercise(
    exercise
  );


  renderLiveSession();
}


async function updateSessionExercise({
  exercise,
  patch
}) {
  if (!exercise) {
    return false;
  }


  const previous = {
    ...exercise
  };


  Object.assign(
    exercise,
    patch
  );


  if (isLocalSession()) {
    persistLocalSessionCache();


    return true;
  }


  const client =
    getSupabase();


  if (!client) {
    Object.assign(
      exercise,
      previous
    );


    return false;
  }


  const {
    error
  } =
    await client
      .from(
        "ari_workout_session_exercises"
      )
      .update(
        patch
      )
      .eq(
        "id",
        exercise.id
      )
      .eq(
        "user_id",
        state.user.id
      );


  if (error) {
    Object.assign(
      exercise,
      previous
    );


    console.error(
      "[ARI Training] Exercise update failed.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Exercise update couldn't be saved."
      ),
      "error"
    );


    return false;
  }


  persistLocalSessionCache();


  return true;
}


// =====================================================
// EXERCISE PICKER
// =====================================================

function openExercisePicker() {
  if (!ExerciseRegistry) {
    showTrainingMessage(
      "Exercise Library is still loading.",
      "warning"
    );


    return;
  }


  setHidden(
    elements.sessionExercisePicker,
    false
  );


  if (
    elements.sessionExerciseSearchInput
  ) {
    elements
      .sessionExerciseSearchInput
      .value =
        "";
  }


  renderExerciseSearchResults(
    ""
  );


  window.setTimeout(
    () => {
      elements
        .sessionExerciseSearchInput
        ?.focus();
    },
    30
  );
}


function closeExercisePicker() {
  setHidden(
    elements.sessionExercisePicker,
    true
  );
}


function handleExerciseSearch(
  event
) {
  renderExerciseSearchResults(
    event.target.value
  );
}


function renderExerciseSearchResults(
  query
) {
  const container =
    elements.sessionExerciseSearchResults;


  if (!container) {
    return;
  }


  container.replaceChildren();


  for (
    const exercise
    of searchExercises(
      query
    ).slice(
      0,
      30
    )
  ) {
    container.appendChild(
      createExerciseSearchResult(
        exercise
      )
    );
  }
}


function searchExercises(
  query
) {
  if (!ExerciseRegistry) {
    return [];
  }


  const normalized =
    String(
      query ||
      ""
    )
      .trim()
      .toLowerCase();


  try {
    if (
      typeof ExerciseRegistry.search ===
      "function"
    ) {
      const result =
        ExerciseRegistry.search(
          normalized
        );


      if (
        Array.isArray(
          result
        )
      ) {
        return result;
      }
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Exercise search failed.",
      error
    );
  }


  let collection =
    [];


  try {
    if (
      Array.isArray(
        ExerciseRegistry.all
      )
    ) {
      collection =
        ExerciseRegistry.all;
    } else if (
      typeof ExerciseRegistry.list ===
      "function"
    ) {
      collection =
        ExerciseRegistry.list() ||
        [];
    }
  } catch {
    collection =
      [];
  }


  if (
    !Array.isArray(
      collection
    )
  ) {
    return [];
  }


  if (!normalized) {
    return [
      ...collection
    ];
  }


  return collection.filter(
    exercise => {
      const haystack = [
        exercise?.name,
        exercise?.id,
        exercise?.category,

        ...(
          exercise?.exerciseTypes ||
          []
        ),

        ...(
          exercise?.primaryMuscles ||
          []
        ),

        ...(
          exercise?.secondaryMuscles ||
          []
        ),

        ...(
          exercise?.equipment ||
          []
        )
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      return haystack.includes(
        normalized
      );
    }
  );
}


function createExerciseSearchResult(
  exercise
) {
  const template =
    elements.sessionExerciseSearchResultTemplate;


  let button;


  if (template?.content) {
    const fragment =
      template.content
        .cloneNode(true);


    button =
      fragment.querySelector(
        ".ari-session-exercise-search-result"
      );


    if (!button) {
      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";
    }


    setTextWithin(
      button,

      ".ari-session-exercise-search-result__name",

      exercise.name ||
        titleFromId(
          exercise.id
        )
    );


    setTextWithin(
      button,

      ".ari-session-exercise-search-result__type",

      getExerciseTypeLabel(
        exercise
      )
    );
  } else {
    button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.textContent =
      exercise.name ||
      exercise.id;
  }


  button.dataset.exerciseId =
    exercise.id;


  button.dataset.action =
    "add-session-exercise";


  return button;
}


async function handleExerciseSearchResultClick(
  event
) {
  const button =
    event.target.closest(
      '[data-action="add-session-exercise"]'
    );


  if (!button) {
    return;
  }


  const exercise =
    ExerciseRegistry?.get?.(
      button.dataset.exerciseId
    );


  if (!exercise) {
    return;
  }


  await addExerciseToActiveSession(
    exercise
  );


  closeExercisePicker();


  renderLiveSession();
}


async function addExerciseToActiveSession(
  exercise
) {
  const session =
    state.activeSession;


  if (!session) {
    return;
  }


  const defaultPrescription =
    getDefaultAdHocPrescription(
      exercise
    );


  await createSessionExercise({
    sessionId:
      session.id,

    exerciseId:
      exercise.id,

    exerciseName:
      exercise.name ||
      titleFromId(
        exercise.id
      ),

    exerciseType:
      getExerciseTypeLabel(
        exercise
      ),

    source:
      "ad_hoc",

    sortOrder:
      session.exercises?.length ||
      0,

    completionMode:
      defaultPrescription
        .completionMode,

    plannedSets:
      defaultPrescription
        .plannedSets,

    plannedReps:
      defaultPrescription
        .plannedReps,

    plannedWeight:
      null,

    plannedDurationSeconds:
      defaultPrescription
        .plannedDurationSeconds
  });


  if (!isLocalSession()) {
    await hydrateFullSession(
      session.id
    );
  }


  const ordered =
    getOrderedSessionExercises();


  const newest =
    ordered[
      ordered.length -
      1
    ];


  if (
    !state.currentExerciseId &&
    newest
  ) {
    await setCurrentExercise(
      newest
    );
  }


  showTrainingMessage(
    `${exercise.name || "Exercise"} added to today's workout.`,
    "success"
  );
}


function getDefaultAdHocPrescription(
  exercise
) {
  const text =
    `${getExerciseTypeLabel(
      exercise
    )} ${exercise?.category || ""} ${exercise?.name || ""}`
      .toLowerCase();


  const likelyCardio =
    /cardio|run|walk|treadmill|bike|cycling|rowing|elliptical|swim/.test(
      text
    );


  if (likelyCardio) {
    return {
      completionMode:
        "single",

      plannedSets:
        null,

      plannedReps:
        null,

      plannedDurationSeconds:
        600
    };
  }


  return {
    completionMode:
      "sets",

    plannedSets:
      3,

    plannedReps:
      10,

    plannedDurationSeconds:
      null
  };
}


// =====================================================
// REST TIMER
// =====================================================

function startRestTimer(
  seconds =
    DEFAULT_REST_SECONDS
) {
  state.rest = {
    endsAt:
      Date.now() +
      Math.max(
        0,
        Number(
          seconds
        ) ||
        DEFAULT_REST_SECONDS
      ) *
        1000
  };


  persistLocalSessionCache();


  renderRestTimer();


  clearRestInterval();


  state.restTimerId =
    window.setInterval(
      renderRestTimer,
      250
    );
}


function renderRestTimer() {
  if (
    !state.rest?.endsAt
  ) {
    setHidden(
      elements.todayWorkoutRestPanel,
      true
    );


    return;
  }


  const remaining =
    state.rest.endsAt -
    Date.now();


  if (remaining <= 0) {
    skipRest();


    return;
  }


  setHidden(
    elements.todayWorkoutRestPanel,
    false
  );


  setText(
    elements.todayWorkoutRestTimer,

    formatCountdown(
      remaining
    )
  );
}


function skipRest() {
  state.rest =
    null;


  clearRestInterval();


  persistLocalSessionCache();


  setHidden(
    elements.todayWorkoutRestPanel,
    true
  );
}


function clearRestInterval() {
  if (
    state.restTimerId
  ) {
    clearInterval(
      state.restTimerId
    );


    state.restTimerId =
      null;
  }
}


function restoreRestState() {
  const cached =
    readStoredJson(
      LOCAL_SESSION_CACHE_KEY
    );


  const rest =
    cached?.rest;


  if (
    rest?.endsAt &&
    rest.endsAt >
      Date.now()
  ) {
    state.rest =
      rest;


    clearRestInterval();


    state.restTimerId =
      window.setInterval(
        renderRestTimer,
        250
      );
  } else {
    state.rest =
      null;
  }
}


// =====================================================
// HEART RATE
// =====================================================

function openHeartRateEntry() {
  setHidden(
    elements.workoutHeartRateEntry,
    false
  );


  window.setTimeout(
    () => {
      elements
        .workoutHeartRateInput
        ?.focus();
    },
    30
  );
}


function closeHeartRateEntry() {
  setHidden(
    elements.workoutHeartRateEntry,
    true
  );


  if (
    elements.workoutHeartRateInput
  ) {
    elements
      .workoutHeartRateInput
      .value =
        "";
  }
}


async function saveHeartRateReading() {
  const session =
    state.activeSession;


  const bpm =
    normalizeHeartRate(
      elements
        .workoutHeartRateInput
        ?.value
    );


  if (
    !session ||
    !bpm
  ) {
    return;
  }


  const reading = {
    id:
      `local_hr_${Date.now()}`,

    session_id:
      session.id,

    bpm,

    elapsed_seconds:
      Math.round(
        getElapsedSessionSeconds()
      ),

    source:
      "manual",

    recorded_at:
      new Date()
        .toISOString()
  };


  if (isLocalSession()) {
    session.heartRateReadings =
      session.heartRateReadings ||
      [];


    session
      .heartRateReadings
      .push(
        reading
      );
  } else {
    const client =
      getSupabase();


    if (!client) {
      showTrainingMessage(
        "Cloud connection is unavailable.",
        "warning"
      );


      return;
    }


    const {
      data,
      error
    } =
      await client
        .from(
          "ari_workout_heart_rate_readings"
        )
        .insert({
          session_id:
            session.id,

          user_id:
            state.user.id,

          bpm,

          elapsed_seconds:
            Math.round(
              getElapsedSessionSeconds()
            ),

          source:
            "manual"
        })
        .select()
        .single();


    if (error) {
      console.error(
        "[ARI Training] Heart-rate save failed.",
        error
      );


      showTrainingMessage(
        readableError(
          error,
          "Heart rate couldn't be saved."
        ),
        "error"
      );


      return;
    }


    session.heartRateReadings =
      session.heartRateReadings ||
      [];


    session
      .heartRateReadings
      .push(
        data
      );
  }


  closeHeartRateEntry();


  persistLocalSessionCache();


  showTrainingMessage(
    `â¥ ${bpm} BPM saved`,
    "success"
  );
}


// =====================================================
// PAUSE / RESUME
// =====================================================

async function togglePauseResume() {
  if (
    state.activeSession?.status ===
    "paused"
  ) {
    await resumeWorkout();
  } else {
    await pauseWorkout();
  }
}


async function pauseWorkout() {
  if (
    state.activeSession?.status !==
    "active"
  ) {
    return;
  }


  await updateSession({
    status:
      "paused",

    paused_at:
      new Date()
        .toISOString()
  });


  renderLiveSession();
}


async function resumeWorkout() {
  const session =
    state.activeSession;


  if (
    !session ||
    session.status !==
      "paused"
  ) {
    return;
  }


  const pausedAtMs =
    Date.parse(
      session.paused_at
    );


  const previousSeconds =
    Number(
      session.paused_duration_seconds
    ) ||
    0;


  const addedSeconds =
    Number.isFinite(
      pausedAtMs
    )
      ? Math.max(
          0,

          Math.round(
            (
              Date.now() -
              pausedAtMs
            ) /
              1000
          )
        )
      : 0;


  await updateSession({
    status:
      "active",

    paused_at:
      null,

    paused_duration_seconds:
      previousSeconds +
      addedSeconds
  });


  renderLiveSession();
}


async function updateSession(
  patch
) {
  const session =
    state.activeSession;


  if (!session) {
    return false;
  }


  const previous = {
    ...session
  };


  Object.assign(
    session,
    patch
  );


  if (isLocalSession()) {
    persistLocalSessionCache();


    return true;
  }


  const client =
    getSupabase();


  if (!client) {
    Object.assign(
      session,
      previous
    );


    throw new Error(
      "Supabase is unavailable."
    );
  }


  const {
    data,
    error
  } =
    await client
      .from(
        "ari_workout_sessions"
      )
      .update(
        patch
      )
      .eq(
        "id",
        session.id
      )
      .eq(
        "user_id",
        state.user.id
      )
      .select()
      .maybeSingle();


  if (error) {
    Object.assign(
      session,
      previous
    );


    throw error;
  }


  if (data) {
    Object.assign(
      session,
      data
    );
  }


  persistLocalSessionCache();


  return true;
}


// =====================================================
// FINISH WORKOUT
// =====================================================

async function openFinishWorkoutPanel() {
  if (
    !state.activeSession
  ) {
    return;
  }


  try {
    if (
      state.activeSession.status ===
      "paused"
    ) {
      await resumeWorkout();
    }


    await updateSession({
      status:
        "finishing"
    });
  } catch (error) {
    showTrainingMessage(
      readableError(
        error,
        "Workout review couldn't open."
      ),
      "error"
    );


    return;
  }


  setHidden(
    elements.todaysTrainingSession,
    true
  );


  setHidden(
    elements.workoutCompletePanel,
    false
  );


  const stats =
    getLiveSessionSetStats();


  const hrStats =
    getHeartRateStats();


  setText(
    elements.workoutCompleteName,

    state.activeSession.title ||
      "Workout"
  );


  setText(
    elements.workoutCompleteDuration,

    formatDurationSeconds(
      getElapsedSessionSeconds()
    )
  );


  setText(
    elements.workoutCompleteSets,

    String(
      stats.completed
    )
  );


  setText(
    elements.workoutCompleteAverageHeartRate,

    hrStats.average
      ? `${hrStats.average} bpm`
      : "â"
  );


  if (
    elements.finalAverageHeartRateInput
  ) {
    elements
      .finalAverageHeartRateInput
      .value =
        state.activeSession
          .average_heart_rate ??
        hrStats.average ??
        "";
  }


  if (
    elements.finalPeakHeartRateInput
  ) {
    elements
      .finalPeakHeartRateInput
      .value =
        state.activeSession
          .peak_heart_rate ??
        hrStats.peak ??
        "";
  }


  renderAddedExerciseSummary();


  renderFinalCalorieEstimate();
}


async function returnToLiveWorkout() {
  if (
    state.activeSession?.status ===
    "finishing"
  ) {
    try {
      await updateSession({
        status:
          "active"
      });
    } catch (error) {
      showTrainingMessage(
        readableError(
          error,
          "Workout couldn't resume."
        ),
        "error"
      );


      return;
    }
  }


  setHidden(
    elements.workoutCompletePanel,
    true
  );


  renderLiveSession();
}


function renderFinalCalorieEstimate() {
  if (
    !state.activeSession
  ) {
    return;
  }


  const result =
    calculateFinalWorkoutEstimate();


  setText(
    elements.workoutCompleteCalories,

    formatNumber(
      result.calories
    )
  );


  setText(
    elements.workoutCalorieCalculationNote,

    result.note
  );
}


function calculateFinalWorkoutEstimate() {
  const selectedIntensity =
    document.querySelector(
      'input[name="workoutIntensity"]:checked'
    )?.value ||
    "moderate";


  const enteredAverageHr =
    normalizeHeartRate(
      elements
        .finalAverageHeartRateInput
        ?.value
    );


  const recorded =
    getHeartRateStats();


  const averageHr =
    enteredAverageHr ||
    recorded.average ||
    null;


  let resolvedIntensity =
    normalizeCalorieIntensity(
      selectedIntensity
    );


  let hrClassification =
    null;


  if (
    HeartRateIntensity &&
    averageHr &&
    state.profileEffectiveMaxHeartRate
  ) {
    try {
      hrClassification =
        HeartRateIntensity
          .classify({
            age:
              state.profileAge,

            heartRate:
              averageHr,

            restingHeartRate:
              state.profileRestingHeartRate,

            maxHeartRate:
              state.profileEffectiveMaxHeartRate,

            preferHeartRateReserve:
              Boolean(
                state.profileRestingHeartRate
              )
          });


      const mapped =
        HeartRateIntensity
          .toCalorieIntensity?.(
            hrClassification
              ?.intensityId
          );


      if (mapped) {
        resolvedIntensity =
          mapped;
      }
    } catch (error) {
      console.warn(
        "[ARI Training] HR intensity classification failed.",
        error
      );
    }
  }


  const durationMinutes =
    Math.max(
      1,

      getElapsedSessionSeconds() /
        60
    );


  const weightLb =
    state.profileWeightLb;


  if (
    !weightLb ||
    !CalorieCalculator
  ) {
    return {
      calories:
        estimateCompletedExerciseCalories(
          resolvedIntensity
        ),

      selectedIntensity,

      resolvedIntensity,

      averageHr,

      hrClassification,

      note:
        !weightLb
          ? "Body weight is unavailable, so ARI is using completed exercise estimates."
          : "Calorie intelligence is unavailable, so ARI is using completed exercise estimates."
    };
  }


  let strengthEstimate =
    null;


  try {
    strengthEstimate =
      CalorieCalculator
        .estimateStrengthSession({
          intensity:
            resolvedIntensity,

          weightLb,

          durationMinutes
        });
  } catch (error) {
    console.warn(
      "[ARI Training] Strength calorie calculation failed.",
      error
    );
  }


  const sessionCalories =
    Number(
      strengthEstimate
        ?.roundedCalories
    ) ||
    0;


  const exerciseCalories =
    estimateCompletedExerciseCalories(
      resolvedIntensity
    );


  return {
    calories:
      Math.round(
        Math.max(
          sessionCalories,
          exerciseCalories,
          0
        )
      ),

    selectedIntensity,

    resolvedIntensity,

    averageHr,

    hrClassification,

    note:
      averageHr &&
      hrClassification
        ? "Based on workout duration, body weight, workout type, and recorded heart-rate intensity."
        : "Based on workout duration, body weight, workout type, and selected intensity."
  };
}


async function saveCompletedWorkout() {
  const session =
    state.activeSession;


  if (
    !session ||
    state.saving
  ) {
    return;
  }


  state.saving =
    true;


  setButtonBusy(
    elements.saveCompletedWorkoutButton,
    true,
    "Saving..."
  );


  try {
    const estimate =
      calculateFinalWorkoutEstimate();


    const hrStats =
      getHeartRateStats();


    const finalAverageHr =
      normalizeHeartRate(
        elements
          .finalAverageHeartRateInput
          ?.value
      ) ||
      hrStats.average ||
      null;


    const finalPeakHr =
      normalizeHeartRate(
        elements
          .finalPeakHeartRateInput
          ?.value
      ) ||
      hrStats.peak ||
      null;


    const durationSeconds =
      Math.max(
        1,

        Math.round(
          getElapsedSessionSeconds()
        )
      );


    const stats =
      getLiveSessionSetStats();


    await updateSession({
      status:
        "completed",

      completed_at:
        new Date()
          .toISOString(),

      duration_seconds:
        durationSeconds,

      selected_intensity:
        estimate.selectedIntensity,

      resolved_intensity:
        estimate.resolvedIntensity,

      average_heart_rate:
        finalAverageHr,

      peak_heart_rate:
        finalPeakHr,

      estimated_calories:
        estimate.calories
    });


    cacheCompletedSessionLocally({
      ...session,

      completed_sets:
        stats.completed
    });


    await syncCompletedSessionToWeeklyProgress();


    clearRestInterval();


    state.rest =
      null;


    clearLocalSessionCache();


    const completedDate =
      session.local_date;


    state.activeSession =
      null;


    state.currentExerciseId =
      null;


    state.selectedDateKey =
      completedDate ||
      state.selectedDateKey;


    persistSelectedDate();


    renderCalendar();


    await renderSelectedDay();


    await renderPerformance();


    await renderHistory();


    showTrainingMessage(
      "Workout saved.",
      "success"
    );
  } catch (error) {
    console.error(
      "[ARI Training] Workout completion failed.",
      error
    );


    showTrainingMessage(
      readableError(
        error,
        "Workout couldn't be saved."
      ),
      "error"
    );
  } finally {
    state.saving =
      false;


    setButtonBusy(
      elements.saveCompletedWorkoutButton,
      false,
      "Finish & Save"
    );
  }
}


// =====================================================
// WEEKLY PROGRESS
// =====================================================

async function syncWeeklyProgressFromSessionExercise(
  exercise
) {
  const session =
    state.activeSession;


  if (
    !session ||
    !WorkoutProgressStore ||
    session.source ===
      "ad_hoc" ||
    exercise.source !==
      "planned"
  ) {
    return;
  }


  const weekday =
    session.planned_weekday;


  if (
    !DAYS.includes(
      weekday
    )
  ) {
    return;
  }


  if (
    exercise.completion_mode ===
    "single"
  ) {
    WorkoutProgressStore
      .setExerciseCompleted({
        day:
          weekday,

        exerciseId:
          exercise.exercise_id,

        completed:
          exercise.status ===
          "completed",

        estimatedCalories:
          Number(
            exercise.estimated_calories
          ) ||
          0
      });


    finalizeWeeklyDayCompletion(
      weekday
    );


    return;
  }


  for (
    const set
    of exercise.sets ||
    []
  ) {
    WorkoutProgressStore
      .setSetCompleted({
        day:
          weekday,

        exerciseId:
          exercise.exercise_id,

        setNumber:
          set.set_number,

        requiredSets:
          exercise.planned_sets,

        completed:
          Boolean(
            set.completed
          ),

        estimatedCalories:
          Number(
            set.estimated_calories
          ) ||
          0
      });
  }


  finalizeWeeklyDayCompletion(
    weekday
  );
}


async function syncCompletedSessionToWeeklyProgress() {
  const session =
    state.activeSession;


  if (!session) {
    return;
  }


  for (
    const exercise
    of session.exercises ||
    []
  ) {
    await syncWeeklyProgressFromSessionExercise(
      exercise
    );
  }
}


function finalizeWeeklyDayCompletion(
  day
) {
  if (!WorkoutProgressStore) {
    return;
  }


  const dayState =
    state.plan?.week?.[
      day
    ];


  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    return;
  }


  const definitions =
    (
      dayState.exercises ||
      []
    ).map(
      entry => {
        const sets =
          Number(
            entry.sets
          );


        const hasSets =
          Number.isInteger(
            sets
          ) &&
          sets > 0;


        return {
          exerciseId:
            entry.exerciseId,

          requiredSets:
            hasSets
              ? sets
              : null,

          completionMode:
            hasSets
              ? "sets"
              : "single"
        };
      }
    );


  WorkoutProgressStore
    .recalculateDayCompletion(
      day,
      definitions
    );
}


// =====================================================
// PERFORMANCE
// =====================================================

async function renderPerformance() {
  const records =
    await fetchCompletedSessionsForDate(
      state.todayDateKey
    );


  const calories =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.estimated_calories
          ) ||
          0
        ),
      0
    );


  const durationSeconds =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.duration_seconds
          ) ||
          0
        ),
      0
    );


  const completedSets =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.completed_sets
          ) ||
          0
        ),
      0
    );


  setText(
    elements.trainingCaloriesBurned,
    formatNumber(
      calories
    )
  );


  setText(
    elements.trainingWorkoutTime,
    formatDurationSeconds(
      durationSeconds
    )
  );


  setText(
    elements.trainingWorkoutCount,
    String(
      records.length
    )
  );


  setText(
    elements.trainingSetsCompleted,
    String(
      completedSets
    )
  );


  const hrRecords =
    records.filter(
      record =>
        normalizeHeartRate(
          record.average_heart_rate
        )
    );


  if (
    hrRecords.length ===
    0
  ) {
    setHidden(
      elements.trainingHeartRatePerformance,
      true
    );


    return;
  }


  const average =
    Math.round(
      hrRecords.reduce(
        (
          total,
          record
        ) =>
          total +
          Number(
            record.average_heart_rate
          ),
        0
      ) /
        hrRecords.length
    );


  const peak =
    Math.max(
      ...hrRecords.map(
        record =>
          Number(
            record.peak_heart_rate ||
            record.average_heart_rate
          )
      )
    );


  const latest =
    hrRecords[0];


  setHidden(
    elements.trainingHeartRatePerformance,
    false
  );


  setText(
    elements.trainingAverageHeartRate,
    `${average} bpm`
  );


  setText(
    elements.trainingPeakHeartRate,
    `${peak} bpm`
  );


  setText(
    elements.trainingIntensityLabel,

    titleFromId(
      latest.resolved_intensity ||
      latest.selected_intensity ||
      "moderate"
    )
  );
}


// =====================================================
// HISTORY
// =====================================================

async function renderHistory() {
  const records =
    await fetchCurrentMonthCompletedSessions();


  setText(
    elements.trainingHistoryMonthLabel,

    new Intl.DateTimeFormat(
      "en-US",

      {
        month:
          "long",

        year:
          "numeric"
      }
    ).format(
      dateFromKey(
        state.todayDateKey
      ) ||
      new Date()
    )
  );


  const calories =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.estimated_calories
          ) ||
          0
        ),
      0
    );


  const durationSeconds =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.duration_seconds
          ) ||
          0
        ),
      0
    );


  const sets =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.completed_sets
          ) ||
          0
        ),
      0
    );


  setText(
    elements.monthlyWorkoutCount,
    String(
      records.length
    )
  );


  setText(
    elements.monthlyCaloriesBurned,
    formatNumber(
      calories
    )
  );


  setText(
    elements.monthlyCompletedWorkouts,
    String(
      records.length
    )
  );


  setText(
    elements.monthlyTrainingTime,
    formatDurationSeconds(
      durationSeconds
    )
  );


  setText(
    elements.monthlyCaloriesTotal,
    formatNumber(
      calories
    )
  );


  setText(
    elements.monthlySetsCompleted,
    String(
      sets
    )
  );


  const container =
    elements.monthlyHistoryList;


  if (!container) {
    return;
  }


  container.replaceChildren();


  const grouped =
    groupSessionsByDate(
      records
    );


  for (
    const group
    of grouped
  ) {
    container.appendChild(
      createHistoryDayElement(
        group
      )
    );
  }


  setHidden(
    elements.monthlyHistoryEmptyState,

    grouped.length > 0
  );
}


async function getCompletedSessionForDate(
  dateKey
) {
  const cached =
    getCachedCompletedSessionForDate(
      dateKey
    );


  const client =
    getSupabase();


  if (
    !client ||
    !state.user?.id
  ) {
    return cached;
  }


  try {
    const {
      data,
      error
    } =
      await client
        .from(
          "ari_workout_sessions"
        )
        .select("*")
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "local_date",
          dateKey
        )
        .eq(
          "status",
          "completed"
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        )
        .limit(1)
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {
      return cached;
    }


    const result = {
      ...data,

      completed_sets:
        await countCompletedSetsForSession(
          data.id
        )
    };


    cacheCompletedSessionLocally(
      result
    );


    return result;
  } catch (error) {
    console.warn(
      "[ARI Training] Completed session query failed.",
      error
    );


    return cached;
  }
}


async function fetchCompletedSessionsForDate(
  dateKey
) {
  const client =
    getSupabase();


  if (
    !client ||
    !state.user?.id
  ) {
    return getCachedCompletedSessions()
      .filter(
        record =>
          record.local_date ===
          dateKey
      );
  }


  try {
    const {
      data,
      error
    } =
      await client
        .from(
          "ari_workout_sessions"
        )
        .select("*")
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "local_date",
          dateKey
        )
        .eq(
          "status",
          "completed"
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        );


    if (error) {
      throw error;
    }


    const records =
      await enrichSessionsWithCompletedSets(
        data ||
        []
      );


    for (
      const record
      of records
    ) {
      cacheCompletedSessionLocally(
        record
      );
    }


    return records;
  } catch (error) {
    console.warn(
      "[ARI Training] Daily completed session query failed.",
      error
    );


    return getCachedCompletedSessions()
      .filter(
        record =>
          record.local_date ===
          dateKey
      );
  }
}


async function fetchCurrentMonthCompletedSessions() {
  const start =
    getMonthStartKey(
      state.todayDateKey
    );


  const end =
    getMonthEndKey(
      state.todayDateKey
    );


  const client =
    getSupabase();


  if (
    !client ||
    !state.user?.id
  ) {
    return getCachedCompletedSessions()
      .filter(
        record =>
          record.local_date >=
            start &&
          record.local_date <=
            end
      );
  }


  try {
    const {
      data,
      error
    } =
      await client
        .from(
          "ari_workout_sessions"
        )
        .select("*")
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "status",
          "completed"
        )
        .gte(
          "local_date",
          start
        )
        .lte(
          "local_date",
          end
        )
        .order(
          "completed_at",
          {
            ascending:
              false
          }
        );


    if (error) {
      throw error;
    }


    const records =
      await enrichSessionsWithCompletedSets(
        data ||
        []
      );


    for (
      const record
      of records
    ) {
      cacheCompletedSessionLocally(
        record
      );
    }


    return records;
  } catch (error) {
    console.warn(
      "[ARI Training] History query failed.",
      error
    );


    return getCachedCompletedSessions()
      .filter(
        record =>
          record.local_date >=
            start &&
          record.local_date <=
            end
      );
  }
}


async function enrichSessionsWithCompletedSets(
  sessions
) {
  const output = [];


  for (
    const session
    of sessions
  ) {
    output.push({
      ...session,

      completed_sets:
        await countCompletedSetsForSession(
          session.id
        )
    });
  }


  return output;
}


async function countCompletedSetsForSession(
  sessionId
) {
  const client =
    getSupabase();


  if (
    !client ||
    String(
      sessionId
    ).startsWith(
      "local_"
    )
  ) {
    return 0;
  }


  try {
    const {
      count,
      error
    } =
      await client
        .from(
          "ari_workout_session_sets"
        )
        .select(
          "id",

          {
            count:
              "exact",

            head:
              true
          }
        )
        .eq(
          "session_id",
          sessionId
        )
        .eq(
          "user_id",
          state.user.id
        )
        .eq(
          "completed",
          true
        );


    if (error) {
      throw error;
    }


    return count ||
      0;
  } catch (error) {
    console.warn(
      "[ARI Training] Completed-set count failed.",
      error
    );


    return 0;
  }
}


function groupSessionsByDate(
  records
) {
  const map =
    new Map();


  for (
    const record
    of records
  ) {
    if (
      !map.has(
        record.local_date
      )
    ) {
      map.set(
        record.local_date,
        []
      );
    }


    map
      .get(
        record.local_date
      )
      .push(
        record
      );
  }


  return Array.from(
    map.entries()
  )
    .map(
      (
        [
          localDate,
          entries
        ]
      ) => ({
        localDate,
        entries
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.localDate
          .localeCompare(
            a.localDate
          )
    );
}


function createHistoryDayElement(
  group
) {
  const template =
    elements.monthlyHistoryDayTemplate;


  if (!template?.content) {
    return document.createTextNode(
      group.localDate
    );
  }


  const fragment =
    template.content
      .cloneNode(true);


  const details =
    fragment.querySelector(
      ".ari-history-day"
    );


  if (!details) {
    return document.createTextNode(
      group.localDate
    );
  }


  const calories =
    group.entries.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.estimated_calories
          ) ||
          0
        ),
      0
    );


  setTextWithin(
    details,

    ".ari-history-day__label",

    getRelativeDateLabel(
      group.localDate
    )
  );


  setTextWithin(
    details,

    ".ari-history-day__date",

    formatLongDate(
      group.localDate
    )
  );


  setTextWithin(
    details,

    ".ari-history-day__sessions",

    `${group.entries.length} ${pluralize(
      group.entries.length,
      "workout",
      "workouts"
    )}`
  );


  setTextWithin(
    details,

    ".ari-history-day__calories",

    `${formatNumber(
      calories
    )} kcal`
  );


  const container =
    details.querySelector(
      ".ari-history-day__entries"
    );


  for (
    const record
    of group.entries
  ) {
    container?.appendChild(
      createHistoryWorkoutElement(
        record
      )
    );
  }


  return fragment;
}


function createHistoryWorkoutElement(
  record
) {
  const template =
    elements.monthlyHistoryWorkoutTemplate;


  if (!template?.content) {
    return document.createTextNode(
      record.title ||
      "Workout"
    );
  }


  const fragment =
    template.content
      .cloneNode(true);


  const article =
    fragment.querySelector(
      ".ari-history-workout"
    );


  if (!article) {
    return document.createTextNode(
      record.title ||
      "Workout"
    );
  }


  setTextWithin(
    article,

    ".ari-history-workout__type",

    "COMPLETED"
  );


  setTextWithin(
    article,

    ".ari-history-workout__name",

    record.title ||
      "Workout"
  );


  setTextWithin(
    article,

    ".ari-history-workout__sets",

    `${record.completed_sets || 0} sets`
  );


  setTextWithin(
    article,

    ".ari-history-workout__duration",

    formatDurationSeconds(
      record.duration_seconds ||
        0
    )
  );


  setTextWithin(
    article,

    ".ari-history-workout__calories",

    `${formatNumber(
      record.estimated_calories ||
        0
    )} kcal`
  );


  article.dataset.sessionId =
    record.id ||
    record.sessionId ||
    "";


  let deleteButton =
    article.querySelector(
      "[data-training-action=\"delete-history-session\"]"
    );


  if (
    !deleteButton
  ) {
    deleteButton =
      document.createElement(
        "button"
      );

    deleteButton.type =
      "button";

    deleteButton.className =
      "ari-history-workout__delete";

    deleteButton.dataset.trainingAction =
      "delete-history-session";

    deleteButton.textContent =
      "Delete";

    article.appendChild(
      deleteButton
    );
  }


  deleteButton.dataset.sessionId =
    record.id ||
    record.sessionId ||
    "";


  return fragment;
}


async function deleteHistorySession(
  sessionId,
  {
    confirmationMessage =
      "Delete this workout from your history? This cannot be undone.",

    successMessage =
      "Workout deleted from history."
  } = {}
) {
  if (
    !sessionId
  ) {
    return false;
  }

  if (
    !window.confirm(
      confirmationMessage
    )
  ) {
    return false;
  }

  try {
    await deleteWorkoutSessionRecord(
      sessionId
    );

    try {
      WorkoutProgressStore
        ?.deleteSessionRecord?.(
          sessionId
        );
    } catch {
      // Cloud history remains authoritative for this page.
    }

    await Promise.all([
      renderSelectedDay(),
      renderHistory(),
      renderPerformance()
    ]);

    renderCalendar();

    showTrainingMessage(
      successMessage,
      "success"
    );

    return true;
  } catch (error) {
    console.error(
      "[ARI Training] History deletion failed.",
      error
    );

    showTrainingMessage(
      readableError(
        error,
        "Workout history could not be deleted."
      ),
      "error"
    );

    return false;
  }
}


async function clearCurrentMonthHistory() {
  const monthStart =
    getMonthStartKey(
      state.todayDateKey
    );

  const monthEnd =
    getMonthEndKey(
      state.todayDateKey
    );

  if (
    !window.confirm(
      "Clear all completed workouts from this month? This cannot be undone."
    )
  ) {
    return false;
  }

  try {
    const records =
      await fetchCurrentMonthCompletedSessions();

    for (
      const record
      of records
    ) {
      const sessionId =
        record.id ||
        record.sessionId;


      if (!sessionId) {
        continue;
      }


      await deleteWorkoutSessionRecord(
        sessionId
      );


      WorkoutProgressStore
        ?.deleteSessionRecord?.(
          sessionId
        );
    }

    try {
      WorkoutProgressStore
        ?.clearSessionHistory?.({
          startDate:
            monthStart,

          endDate:
            monthEnd,

          completedOnly:
            true
        });
    } catch {
      // Non-fatal.
    }

    await Promise.all([
      renderSelectedDay(),
      renderHistory(),
      renderPerformance()
    ]);

    renderCalendar();

    showTrainingMessage(
      "Monthly workout history cleared.",
      "success"
    );

    return true;
  } catch (error) {
    console.error(
      "[ARI Training] Monthly history clear failed.",
      error
    );

    showTrainingMessage(
      readableError(
        error,
        "Monthly workout history could not be cleared."
      ),
      "error"
    );

    return false;
  }
}


// =====================================================
// PROFILE
// =====================================================

async function loadTrainingProfile() {
  const local =
    readLocalTrainingProfile();


  let cloud =
    null;


  try {
    const client =
      getSupabase();


    if (
      client &&
      state.user?.id
    ) {
      const {
        data,
        error
      } =
        await client
          .from(
            "profiles"
          )
          .select(
            "age, weight_lbs, resting_heart_rate, confirmed_max_heart_rate"
          )
          .eq(
            "id",
            state.user.id
          )
          .maybeSingle();


      if (
        !error &&
        data
      ) {
        cloud =
          data;
      }
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Training profile cloud load failed.",
      error
    );
  }


  state.profileAge =
    normalizeAge(
      cloud?.age ??
      local.age
    );


  state.profileWeightLb =
    normalizeWeight(
      cloud?.weight_lbs ??
      local.weightLb
    );


  state.profileRestingHeartRate =
    normalizeHeartRate(
      cloud?.resting_heart_rate ??
      local.restingHeartRate
    );


  state.profileConfirmedMaxHeartRate =
    normalizeHeartRate(
      cloud?.confirmed_max_heart_rate ??
      local.confirmedMaxHeartRate
    );


  /*
   * Native fallback first.
   */
  state.profileEstimatedMaxHeartRate =
    estimateFallbackMaxHeartRate(
      state.profileAge
    );


  /*
   * Upgrade with HeartRateIntensity module if available.
   */
  if (
    HeartRateIntensity &&
    typeof HeartRateIntensity
      .estimateMaxHeartRate ===
      "function"
  ) {
    try {
      state.profileEstimatedMaxHeartRate =
        normalizeHeartRate(
          HeartRateIntensity
            .estimateMaxHeartRate({
              age:
                state.profileAge
            })
        ) ??
        state.profileEstimatedMaxHeartRate;
    } catch (error) {
      console.warn(
        "[ARI Training] Max HR helper failed.",
        error
      );
    }
  }


  state.profileEffectiveMaxHeartRate =
    state.profileConfirmedMaxHeartRate ??
    state.profileEstimatedMaxHeartRate;


  state.profileMaxHeartRateSource =
    state.profileConfirmedMaxHeartRate
      ? "confirmed"
      : state.profileEstimatedMaxHeartRate
        ? "estimated"
        : null;
}


function estimateFallbackMaxHeartRate(
  age
) {
  const normalizedAge =
    normalizeAge(
      age
    );


  if (!normalizedAge) {
    return null;
  }


  return Math.round(
    220 -
    normalizedAge
  );
}


function renderTrainingProfile() {
  setText(
    elements.trainingProfileWeight,

    state.profileWeightLb
      ? `${formatProfileNumber(
          state.profileWeightLb
        )} lb`
      : "â"
  );


  setText(
    elements.trainingProfileRestingHeartRate,

    state.profileRestingHeartRate
      ? `${Math.round(
          state.profileRestingHeartRate
        )} bpm`
      : "â"
  );


  setText(
    elements.trainingProfileMaxHeartRate,

    state.profileEffectiveMaxHeartRate
      ? `${Math.round(
          state.profileEffectiveMaxHeartRate
        )} bpm`
      : "â"
  );


  setText(
    elements.trainingProfileMaxHeartRateSource,

    state.profileMaxHeartRateSource ===
      "confirmed"
      ? "Confirmed max"
      : state.profileMaxHeartRateSource ===
          "estimated"
        ? "Estimated from age"
        : "No max HR available"
  );
}


function readLocalTrainingProfile() {
  const goals =
    readStoredJson(
      "calbuddyGoals"
    ) ||
    {};


  return {
    age:
      localStorage.getItem(
        "calbuddyAge"
      ) ??
      goals.age,

    weightLb:
      localStorage.getItem(
        "calbuddyCurrentWeight"
      ) ??
      goals.weight,

    restingHeartRate:
      localStorage.getItem(
        "calbuddyRestingHeartRate"
      ) ??
      goals.restingHeartRate,

    confirmedMaxHeartRate:
      localStorage.getItem(
        "calbuddyConfirmedMaxHeartRate"
      ) ??
      goals.confirmedMaxHeartRate
  };
}


// =====================================================
// MENU / DRAWERS
// =====================================================

function handleTrainingMenuClick(
  event
) {
  const link =
    event.target.closest(
      "a"
    );


  if (link) {
    closeTrainingMenu();


    return;
  }


  const button =
    event.target.closest(
      "[data-training-panel]"
    );


  if (!button) {
    return;
  }


  closeTrainingMenu();


  openTrainingDrawer(
    button.dataset.trainingPanel
  );
}


function openTrainingDrawer(
  type
) {
  closeTrainingDrawer();


  const map = {
    performance:
      elements.trainingPerformanceDrawer,

    history:
      elements.trainingHistoryDrawer,

    profile:
      elements.trainingProfileDrawer
  };


  const drawer =
    map[type];


  if (!drawer) {
    return;
  }


  state.currentDrawer =
    type;


  setHidden(
    elements.trainingOverlay,
    false
  );


  setHidden(
    drawer,
    false
  );


  document.body
    .classList
    .add(
      "ari-training-drawer-open"
    );


  if (
    type ===
    "performance"
  ) {
    void renderPerformance();
  }


  if (
    type ===
    "history"
  ) {
    void renderHistory();
  }


  if (
    type ===
    "profile"
  ) {
    renderTrainingProfile();
  }
}


function closeTrainingDrawer() {
  setHidden(
    elements.trainingOverlay,
    true
  );


  setHidden(
    elements.trainingPerformanceDrawer,
    true
  );


  setHidden(
    elements.trainingHistoryDrawer,
    true
  );


  setHidden(
    elements.trainingProfileDrawer,
    true
  );


  document.body
    .classList
    .remove(
      "ari-training-drawer-open"
    );


  state.currentDrawer =
    null;
}


function toggleTrainingMenu() {
  if (
    !elements.trainingMenu ||
    !elements.trainingMenuButton
  ) {
    return;
  }


  const open =
    elements
      .trainingMenuButton
      .getAttribute(
        "aria-expanded"
      ) ===
      "true";


  if (open) {
    closeTrainingMenu();


    return;
  }


  elements.trainingMenu.hidden =
    false;


  elements
    .trainingMenuButton
    .setAttribute(
      "aria-expanded",
      "true"
    );
}


function closeTrainingMenu() {
  if (
    !elements.trainingMenu ||
    !elements.trainingMenuButton
  ) {
    return;
  }


  elements.trainingMenu.hidden =
    true;


  elements
    .trainingMenuButton
    .setAttribute(
      "aria-expanded",
      "false"
    );
}


// =====================================================
// LIVE STATS
// =====================================================

function getLiveSessionSetStats() {
  const session =
    state.activeSession;


  if (!session) {
    return {
      completed: 0,
      required: 0
    };
  }


  let completed =
    0;


  let required =
    0;


  for (
    const exercise
    of session.exercises ||
    []
  ) {
    if (
      exercise.status ===
      "skipped"
    ) {
      continue;
    }


    if (
      exercise.completion_mode ===
      "sets"
    ) {
      required +=
        Number(
          exercise.planned_sets
        ) ||
        exercise.sets?.length ||
        0;


      completed +=
        exercise.sets
          ?.filter(
            set =>
              set.completed
          )
          .length ||
        0;
    } else {
      required += 1;


      if (
        exercise.status ===
        "completed"
      ) {
        completed += 1;
      }
    }
  }


  return {
    completed,
    required
  };
}


function getHeartRateStats() {
  const values =
    (
      state.activeSession
        ?.heartRateReadings ||
      []
    )
      .map(
        item =>
          normalizeHeartRate(
            item.bpm
          )
      )
      .filter(Boolean);


  if (
    values.length ===
    0
  ) {
    return {
      count: 0,
      average: null,
      peak: null
    };
  }


  return {
    count:
      values.length,

    average:
      Math.round(
        values.reduce(
          (
            total,
            value
          ) =>
            total +
            value,
          0
        ) /
          values.length
      ),

    peak:
      Math.max(
        ...values
      )
  };
}


// =====================================================
// CALORIES
// =====================================================

function estimateSetCalories(
  exercise,
  intensity =
    "moderate"
) {
  const weightLb =
    state.profileWeightLb;


  if (
    !weightLb ||
    !CalorieCalculator ||
    typeof CalorieCalculator
      .estimateStrengthSession !==
      "function"
  ) {
    return 0;
  }


  try {
    const estimate =
      CalorieCalculator
        .estimateStrengthSession({
          intensity:
            normalizeCalorieIntensity(
              intensity
            ),

          weightLb,

          durationMinutes:
            2.5
        });


    return Math.max(
      0,

      Math.round(
        Number(
          estimate?.roundedCalories
        ) ||
        0
      )
    );
  } catch (error) {
    console.warn(
      "[ARI Training] Set calorie estimate failed.",
      error
    );


    return 0;
  }
}


function estimateSingleActivityCalories(
  exercise,
  intensity =
    "moderate"
) {
  const weightLb =
    state.profileWeightLb;


  if (!weightLb) {
    return 0;
  }


  const durationMinutes =
    Math.max(
      1,

      (
        Number(
          exercise.actual_duration_seconds
        ) ||

        Number(
          exercise.planned_duration_seconds
        ) ||

        1800
      ) /
        60
    );


  if (
    WorkoutPlanController &&
    typeof WorkoutPlanController
      .estimateExerciseCalories ===
      "function"
  ) {
    try {
      const estimate =
        WorkoutPlanController
          .estimateExerciseCalories({
            exerciseId:
              exercise.exercise_id,

            durationMinutes,

            weightLb,

            intensity:
              normalizeCalorieIntensity(
                intensity
              )
          });


      return Math.max(
        0,

        Math.round(
          Number(
            estimate?.roundedCalories
          ) ||
          0
        )
      );
    } catch (error) {
      console.warn(
        "[ARI Training] Activity calorie estimate failed.",
        error
      );
    }
  }


  return 0;
}


function estimateCompletedExerciseCalories(
  intensity =
    "moderate"
) {
  const session =
    state.activeSession;


  if (!session) {
    return 0;
  }


  let total =
    0;


  for (
    const exercise
    of session.exercises ||
    []
  ) {
    if (
      exercise.status ===
      "skipped"
    ) {
      continue;
    }


    if (
      exercise.completion_mode ===
      "sets"
    ) {
      total +=
        (
          exercise.sets ||
          []
        )
          .filter(
            set =>
              set.completed
          )
          .reduce(
            (
              sum,
              set
            ) =>
              sum +
              (
                Number(
                  set.estimated_calories
                ) ||

                estimateSetCalories(
                  exercise,
                  intensity
                )
              ),
            0
          );
    } else if (
      exercise.status ===
      "completed"
    ) {
      total +=
        Number(
          exercise.estimated_calories
        ) ||

        estimateSingleActivityCalories(
          exercise,
          intensity
        );
    }
  }


  return Math.round(
    total
  );
}


// =====================================================
// TIMING
// =====================================================

function startRuntimeTimers() {
  clearRuntimeTimers();


  state.sessionTimerId =
    window.setInterval(
      () => {
        if (
          state.activeSession &&
          OPEN_SESSION_STATUSES
            .includes(
              state.activeSession.status
            )
        ) {
          renderLiveProgress();
        }
      },
      1000
    );


  state.dateWatcherId =
    window.setInterval(
      handleDateRollover,
      30000
    );
}


function clearRuntimeTimers() {
  if (
    state.sessionTimerId
  ) {
    clearInterval(
      state.sessionTimerId
    );


    state.sessionTimerId =
      null;
  }


  if (
    state.dateWatcherId
  ) {
    clearInterval(
      state.dateWatcherId
    );


    state.dateWatcherId =
      null;
  }
}


function handleDateRollover() {
  const newToday =
    getLocalDateKey();


  if (
    newToday ===
    state.todayDateKey
  ) {
    return;
  }


  const oldToday =
    state.todayDateKey;


  state.todayDateKey =
    newToday;


  if (
    !state.activeSession &&
    state.selectedDateKey ===
      oldToday
  ) {
    state.selectedDateKey =
      newToday;


    persistSelectedDate();
  }


  renderCalendar();


  void renderSelectedDay();
}


function getElapsedSessionSeconds() {
  const session =
    state.activeSession;


  if (
    !session?.started_at
  ) {
    return 0;
  }


  const startMs =
    Date.parse(
      session.started_at
    );


  if (
    !Number.isFinite(
      startMs
    )
  ) {
    return 0;
  }


  let endMs =
    Date.now();


  if (
    session.status ===
      "completed" &&
    session.completed_at
  ) {
    const completedMs =
      Date.parse(
        session.completed_at
      );


    if (
      Number.isFinite(
        completedMs
      )
    ) {
      endMs =
        completedMs;
    }
  }


  let pausedSeconds =
    Number(
      session.paused_duration_seconds
    ) ||
    0;


  if (
    session.status ===
      "paused" &&
    session.paused_at
  ) {
    const pausedAtMs =
      Date.parse(
        session.paused_at
      );


    if (
      Number.isFinite(
        pausedAtMs
      )
    ) {
      pausedSeconds +=
        Math.max(
          0,

          (
            endMs -
            pausedAtMs
          ) /
            1000
        );
    }
  }


  return Math.max(
    0,

    (
      endMs -
      startMs
    ) /
      1000 -
    pausedSeconds
  );
}


// =====================================================
// SESSION HELPERS
// =====================================================

function getOrderedSessionExercises() {
  return [
    ...(
      state.activeSession
        ?.exercises ||
      []
    )
  ].sort(
    (
      a,
      b
    ) =>
      Number(
        a.sort_order
      ) -
      Number(
        b.sort_order
      )
  );
}


function getCurrentSessionExercise() {
  if (
    !state.currentExerciseId
  ) {
    return null;
  }


  return getSessionExerciseById(
    state.currentExerciseId
  );
}


function getSessionExerciseById(
  id
) {
  return (
    state.activeSession
      ?.exercises
      ?.find(
        exercise =>
          String(
            exercise.id
          ) ===
          String(
            id
          )
      ) ||
    null
  );
}


function renderAddedExerciseSummary() {
  const container =
    elements.workoutAddedExercisesList;


  if (!container) {
    return;
  }


  const added =
    (
      state.activeSession
        ?.exercises ||
      []
    ).filter(
      exercise =>
        exercise.source ===
        "ad_hoc"
    );


  setHidden(
    elements.workoutAddedExercisesSummary,

    added.length ===
      0
  );


  container.replaceChildren();


  for (
    const exercise
    of added
  ) {
    const row =
      document.createElement(
        "div"
      );


    row.textContent =
      exercise.exercise_name;


    container.appendChild(
      row
    );
  }
}


// =====================================================
// LOCAL CACHE
// =====================================================

function persistLocalSessionCache() {
  if (
    !state.activeSession
  ) {
    clearLocalSessionCache();


    return;
  }


  try {
    localStorage.setItem(
      LOCAL_SESSION_CACHE_KEY,

      JSON.stringify({
        session:
          state.activeSession,

        currentExerciseId:
          state.currentExerciseId,

        rest:
          state.rest
      })
    );
  } catch {
    // Best effort.
  }
}


function restoreLocalSessionCache() {
  const parsed =
    readStoredJson(
      LOCAL_SESSION_CACHE_KEY
    );


  if (
    !parsed?.session ||
    parsed.session.status ===
      "completed" ||
    parsed.session.status ===
      "abandoned"
  ) {
    return null;
  }


  state.activeSession =
    parsed.session;


  state.currentExerciseId =
    parsed.currentExerciseId ||

    resolveCurrentExerciseId(
      parsed.session.exercises ||
      []
    );


  state.rest =
    parsed.rest ||
    null;


  restoreRestState();


  return state.activeSession;
}


function clearLocalSessionCache() {
  try {
    localStorage.removeItem(
      LOCAL_SESSION_CACHE_KEY
    );
  } catch {
    // Ignore.
  }
}


function cacheCompletedSessionLocally(
  session
) {
  const records =
    getCachedCompletedSessions();


  const index =
    records.findIndex(
      item =>
        item.id ===
        session.id
    );


  if (index >= 0) {
    records[index] =
      session;
  } else {
    records.push(
      session
    );
  }


  try {
    localStorage.setItem(
      LOCAL_COMPLETED_CACHE_KEY,

      JSON.stringify(
        records
      )
    );
  } catch {
    // Best effort.
  }
}


function getCachedCompletedSessions() {
  const records =
    readStoredJson(
      LOCAL_COMPLETED_CACHE_KEY
    );


  return Array.isArray(
    records
  )
    ? records
    : [];
}


function getCachedCompletedSessionForDate(
  dateKey
) {
  return (
    getCachedCompletedSessions()
      .filter(
        item =>
          item.local_date ===
            dateKey &&
          item.status ===
            "completed"
      )
      .sort(
        (
          a,
          b
        ) =>
          String(
            b.completed_at ||
            ""
          ).localeCompare(
            String(
              a.completed_at ||
              ""
            )
          )
      )[0] ||
    null
  );
}


function restoreSelectedDate() {
  try {
    const value =
      localStorage.getItem(
        LOCAL_SELECTED_DATE_KEY
      );


    return isDateKey(
      value
    )
      ? value
      : null;
  } catch {
    return null;
  }
}


function persistSelectedDate() {
  if (
    !isDateKey(
      state.selectedDateKey
    )
  ) {
    return;
  }


  try {
    localStorage.setItem(
      LOCAL_SELECTED_DATE_KEY,
      state.selectedDateKey
    );
  } catch {
    // Ignore.
  }
}


// =====================================================
// PLAN HELPERS
// =====================================================

function getPlanReference() {
  return (
    state.plan?.planId ||

    state.plan?.metadata
      ?.sourceTemplateId ||

    "local-plan"
  );
}


function buildWorkoutMeta(
  dayState
) {
  const exercises =
    dayState.exercises ||
    [];


  const exerciseCount =
    exercises.length;


  const sets =
    countRequiredWorkUnits(
      exercises
    );


  const minutes =
    estimatePlannedMinutes(
      dayState
    );


  const pieces = [
    `${exerciseCount} ${pluralize(
      exerciseCount,
      "exercise",
      "exercises"
    )}`
  ];


  if (sets > 0) {
    pieces.push(
      `${sets} sets`
    );
  }


  if (minutes > 0) {
    pieces.push(
      `about ${formatDurationMinutes(
        minutes
      )}`
    );
  }


  return pieces.join(
    " Â· "
  );
}


function countRequiredWorkUnits(
  exercises
) {
  return (
    exercises ||
    []
  ).reduce(
    (
      total,
      entry
    ) => {
      const sets =
        normalizeRequiredSets(
          entry
        );


      return total +
        (
          sets > 0
            ? sets
            : 1
        );
    },
    0
  );
}


function estimatePlannedMinutes(
  dayState
) {
  let total =
    0;


  for (
    const entry
    of dayState?.exercises ||
    []
  ) {
    const sets =
      normalizeRequiredSets(
        entry
      );


    if (sets > 0) {
      total +=
        sets *
        (
          normalizePositiveNumber(
            entry.minutesPerSet
          ) ||
          2.5
        );
    } else {
      total +=
        normalizePositiveNumber(
          entry.durationMinutes
        ) ||
        30;
    }
  }


  return Math.round(
    total
  );
}


function getShortPrescription(
  entry
) {
  const sets =
    normalizeRequiredSets(
      entry
    );


  const reps =
    normalizePositiveInteger(
      entry.reps
    );


  if (
    sets &&
    reps
  ) {
    return `${sets} Ã ${reps}`;
  }


  if (sets) {
    return `${sets} sets`;
  }


  if (
    Number(
      entry.durationMinutes
    ) > 0
  ) {
    return `${entry.durationMinutes} min`;
  }


  if (
    Number(
      entry.durationSeconds
    ) > 0
  ) {
    return `${entry.durationSeconds} sec`;
  }


  return "Activity";
}


function getSessionExercisePrescription(
  exercise
) {
  if (
    exercise.completion_mode ===
    "sets"
  ) {
    const pieces =
      [];


    if (
      Number(
        exercise.planned_sets
      ) > 0
    ) {
      pieces.push(
        `${exercise.planned_sets} sets`
      );
    }


    if (
      Number(
        exercise.planned_reps
      ) > 0
    ) {
      pieces.push(
        `${exercise.planned_reps} reps`
      );
    }


    return pieces.join(
      " Ã "
    ) ||
      "Strength exercise";
  }


  if (
    Number(
      exercise.planned_duration_seconds
    ) > 0
  ) {
    return formatDurationSeconds(
      exercise.planned_duration_seconds
    );
  }


  return "Complete activity";
}


function buildSetTarget(
  set
) {
  const pieces =
    [];


  if (
    set.planned_weight !==
      null &&
    set.planned_weight !==
      undefined
  ) {
    pieces.push(
      `${set.planned_weight} lb`
    );
  }


  if (
    set.planned_reps !==
      null &&
    set.planned_reps !==
      undefined
  ) {
    pieces.push(
      `${set.planned_reps} reps`
    );
  }


  return pieces.join(
    " Ã "
  ) ||
    "Planned set";
}


function resolvePlannedWeight(
  entry
) {
  return (
    normalizePositiveNumber(
      entry.weight
    ) ??

    normalizePositiveNumber(
      entry.added_weight
    ) ??

    null
  );
}


function getPlannedDurationSeconds(
  entry
) {
  const seconds =
    normalizePositiveInteger(
      entry.durationSeconds
    );


  if (seconds) {
    return seconds;
  }


  const minutes =
    normalizePositiveNumber(
      entry.durationMinutes
    );


  return minutes
    ? Math.round(
        minutes *
        60
      )
    : null;
}


function getExerciseTypeLabel(
  exercise
) {
  const type =
    exercise?.exerciseTypes?.[0] ||
    exercise?.category;


  return type
    ? titleFromId(
        type
      )
    : "Exercise";
}


function getExerciseStateIcon(
  status
) {
  switch (status) {
    case "current":
      return "â";

    case "completed":
      return "â";

    case "skipped":
      return "â";

    default:
      return "â";
  }
}


function getExerciseStateLabel(
  status
) {
  switch (status) {
    case "current":
      return "Current";

    case "completed":
      return "Complete";

    case "skipped":
      return "Skipped";

    default:
      return "Ready";
  }
}


// =====================================================
// DATE HELPERS
// =====================================================

function buildCalendarDateAriaLabel(
  dateKey
) {
  return `${formatLongDate(
    dateKey
  )}, ${titleFromId(
    getCalendarDateStatus(
      dateKey
    )
  )}`;
}


function weekdayIdFromDateKey(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    );


  if (!date) {
    return null;
  }


  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ][
    date.getDay()
  ];
}


function getCurrentWeekMondayKey() {
  const now =
    new Date();


  const day =
    now.getDay();


  const offset =
    day === 0
      ? 6
      : day - 1;


  const monday =
    addDays(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ),

      -offset
    );


  return getLocalDateKey(
    monday
  );
}


function getSundayStart(
  date
) {
  return addDays(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ),

    -date.getDay()
  );
}


function addDays(
  date,
  amount
) {
  const result =
    new Date(
      date
    );


  result.setDate(
    result.getDate() +
    amount
  );


  return result;
}


function dateFromKey(
  dateKey
) {
  if (
    !isDateKey(
      dateKey
    )
  ) {
    return null;
  }


  const [
    year,
    month,
    day
  ] =
    dateKey
      .split("-")
      .map(
        Number
      );


  return new Date(
    year,
    month - 1,
    day
  );
}


function isDateKey(
  value
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    String(
      value ||
      ""
    )
  );
}


function getLocalDateKey(
  date =
    new Date()
) {
  return (
    `${date.getFullYear()}-` +

    `${String(
      date.getMonth() +
      1
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


function getMonthStartKey(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    ) ||
    new Date();


  return getLocalDateKey(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    )
  );
}


function getMonthEndKey(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    ) ||
    new Date();


  return getLocalDateKey(
    new Date(
      date.getFullYear(),
      date.getMonth() +
        1,
      0
    )
  );
}


function formatLongDate(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    );


  if (!date) {
    return "";
  }


  return new Intl.DateTimeFormat(
    "en-US",

    {
      weekday:
        "long",

      month:
        "short",

      day:
        "numeric"
    }
  ).format(
    date
  );
}


function formatCompactSelectedDate(
  dateKey
) {
  const date =
    dateFromKey(
      dateKey
    );


  if (!date) {
    return "Today";
  }


  return new Intl.DateTimeFormat(
    "en-US",

    {
      weekday:
        "short",

      month:
        "short",

      day:
        "numeric"
    }
  ).format(
    date
  );
}


function getRelativeDateLabel(
  dateKey
) {
  if (
    dateKey ===
    state.todayDateKey
  ) {
    return "Today";
  }


  const date =
    dateFromKey(
      dateKey
    );


  return date
    ? new Intl.DateTimeFormat(
        "en-US",

        {
          weekday:
            "long"
        }
      ).format(
        date
      )
    : dateKey;
}


function getUserTimeZone() {
  try {
    return (
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone ||
      null
    );
  } catch {
    return null;
  }
}


// =====================================================
// NORMALIZATION
// =====================================================

function normalizeAge(
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
    number >= 10 &&
    number <= 120
  )
    ? number
    : null;
}


function normalizeWeight(
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
    number >= 50 &&
    number <= 1000
  )
    ? Math.round(
        number *
        10
      ) /
      10
    : null;
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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


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


function normalizeNonNegativeInteger(
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
          number
        );
}


function normalizeRequiredSets(
  entry
) {
  const number =
    Number(
      entry?.sets
    );


  return (
    Number.isInteger(
      number
    ) &&
    number > 0
  )
    ? number
    : 0;
}


function normalizeCalorieIntensity(
  value
) {
  const normalized =
    String(
      value ||
      "moderate"
    )
      .trim()
      .toLowerCase();


  switch (normalized) {
    case "easy":
    case "light":
    case "low":
      return "light";


    case "hard":
    case "vigorous":
    case "high":
    case "very_hard":
    case "very-hard":
    case "very hard":
    case "max":
      return "vigorous";


    default:
      return "moderate";
  }
}


// =====================================================
// UI HELPERS
// =====================================================

function showTrainingMessage(
  text,
  tone =
    "neutral",
  duration =
    3800
) {
  let message =
    document.getElementById(
      "ariTrainingRuntimeMessage"
    );


  if (!message) {
    message =
      document.createElement(
        "div"
      );


    message.id =
      "ariTrainingRuntimeMessage";


    message.className =
      "ari-training-runtime-message";


    message.setAttribute(
      "role",
      "status"
    );


    message.setAttribute(
      "aria-live",
      "polite"
    );


    elements.todaysTraining
      ?.appendChild(
        message
      );
  }


  message.dataset.tone =
    tone;


  message.textContent =
    text;


  message.hidden =
    false;


  window.clearTimeout(
    showTrainingMessage.timeout
  );


  showTrainingMessage.timeout =
    window.setTimeout(
      () => {
        if (message) {
          message.hidden =
            true;
        }
      },

      duration
    );
}


function showBootFailure(
  error
) {
  console.error(
    "[ARI Training] BOOT FAILURE:",
    error
  );


  document
    .getElementById(
      "ariTrainingBootFailure"
    )
    ?.remove();


  const message =
    document.createElement(
      "div"
    );


  message.id =
    "ariTrainingBootFailure";


  message.setAttribute(
    "role",
    "alert"
  );


  message.style.cssText = `
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(24px + env(safe-area-inset-bottom));
    z-index: 999999;
    padding: 14px 16px;
    border: 1px solid rgba(255, 100, 120, 0.45);
    border-radius: 14px;
    background: rgba(20, 5, 10, 0.96);
    color: #ffffff;
    font-family: Inter, sans-serif;
    font-size: 13px;
    line-height: 1.45;
  `;


  message.textContent =
    `ARI Training could not start: ${
      error?.message ||
      String(
        error
      )
    }`;


  document.body.appendChild(
    message
  );
}


function setButtonBusy(
  button,
  busy,
  label
) {
  if (!button) {
    return;
  }


  button.disabled =
    Boolean(
      busy
    );


  button.setAttribute(
    "aria-busy",

    busy
      ? "true"
      : "false"
  );


  if (label) {
    button.textContent =
      label;
  }
}


function readableError(
  error,
  fallback
) {
  const parts = [
    error?.message,
    error?.details,
    error?.hint
  ].filter(Boolean);


  return parts.length
    ? parts.join(
        " Â· "
      )
    : fallback;
}


function setText(
  element,
  value
) {
  if (element) {
    element.textContent =
      value;
  }
}


function setTextWithin(
  root,
  selector,
  value
) {
  const element =
    root?.querySelector(
      selector
    );


  if (element) {
    element.textContent =
      value;
  }
}


function setHidden(
  element,
  hidden
) {
  if (element) {
    element.hidden =
      Boolean(
        hidden
      );
  }
}


function titleFromId(
  value
) {
  return String(
    value ||
    ""
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


function getStatusLabel(
  status
) {
  switch (status) {
    case "complete":
      return "COMPLETE";

    case "in_progress":
      return "IN PROGRESS";

    case "rest":
      return "REST DAY";

    default:
      return "NOT STARTED";
  }
}


function pluralize(
  count,
  singular,
  plural
) {
  return count ===
    1
      ? singular
      : plural;
}


function formatNumber(
  value
) {
  return new Intl.NumberFormat(
    "en-US",

    {
      maximumFractionDigits:
        0
    }
  ).format(
    Math.round(
      Number(
        value
      ) ||
      0
    )
  );
}


function formatProfileNumber(
  value
) {
  return new Intl.NumberFormat(
    "en-US",

    {
      maximumFractionDigits:
        1
    }
  ).format(
    Number(
      value
    )
  );
}


function formatDurationMinutes(
  minutes
) {
  const rounded =
    Math.max(
      0,

      Math.round(
        Number(
          minutes
        ) ||
        0
      )
    );


  if (rounded < 60) {
    return `${rounded}m`;
  }


  const hours =
    Math.floor(
      rounded /
      60
    );


  const remaining =
    rounded %
    60;


  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}


function formatDurationSeconds(
  seconds
) {
  return formatDurationMinutes(
    Number(
      seconds
    ) /
      60
  );
}


function formatElapsedClock(
  totalSeconds
) {
  const seconds =
    Math.max(
      0,

      Math.floor(
        Number(
          totalSeconds
        ) ||
        0
      )
    );


  const hours =
    Math.floor(
      seconds /
      3600
    );


  const minutes =
    Math.floor(
      (
        seconds %
        3600
      ) /
        60
    );


  const remaining =
    seconds %
    60;


  if (hours > 0) {
    return (
      `${String(
        hours
      ).padStart(
        2,
        "0"
      )}:` +

      `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:` +

      `${String(
        remaining
      ).padStart(
        2,
        "0"
      )}`
    );
  }


  return (
    `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:` +

    `${String(
      remaining
    ).padStart(
      2,
      "0"
    )}`
  );
}


function formatCountdown(
  milliseconds
) {
  const seconds =
    Math.max(
      0,

      Math.ceil(
        milliseconds /
        1000
      )
    );


  const minutes =
    Math.floor(
      seconds /
      60
    );


  const remaining =
    seconds %
    60;


  return (
    `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:` +

    `${String(
      remaining
    ).padStart(
      2,
      "0"
    )}`
  );
}


function readStoredJson(
  key
) {
  try {
    const raw =
      localStorage.getItem(
        key
      );


    return raw
      ? JSON.parse(
          raw
        )
      : null;
  } catch {
    return null;
  }
}


function delay(
  milliseconds
) {
  return new Promise(
    resolve =>
      window.setTimeout(
        resolve,
        milliseconds
      )
  );
}


// =====================================================
// GLOBAL API
// =====================================================

function publishGlobal() {
  const runtime = {
    version:
      VERSION,

    source:
      SOURCE,

    initialize,

    refresh,

    selectDate,

    selectToday,


    openCalendar:
      () => {
        state.calendarOpen =
          true;


        renderCalendar();
      },


    closeCalendar:
      () => {
        state.calendarOpen =
          false;


        renderCalendar();
      },


    startPlannedWorkout:
      startSelectedPlannedWorkout,


    startAdHocWorkout,


    cancelWorkout:
      cancelActiveWorkout,


    undoCompletion:
      undoCompletedWorkout,


    trainAgain:
      startTrainAgainWorkout,


    pauseWorkout,


    resumeWorkout,


    finishWorkout:
      openFinishWorkoutPanel,


    saveWorkout:
      saveCompletedWorkout,


    openExercisePicker,


    getSelectedDate:
      () =>
        state.selectedDateKey,


    getToday:
      () =>
        state.todayDateKey,


    getPlan:
      () =>
        cloneSafe(
          state.plan
        ),


    getActiveSession:
      () =>
        cloneSafe(
          state.activeSession
        ),


    getDependencyDiagnostics:
      () =>
        cloneSafe(
          dependencyState
        ),


    getDiagnostics:
      () => ({
        version:
          VERSION,

        source:
          SOURCE,

        initialized:
          state.initialized,

        eventsBound:
          state.eventsBound,

        refreshInFlight:
          state.refreshInFlight,

        selectedDate:
          state.selectedDateKey,

        today:
          state.todayDateKey,

        hasPlan:
          Boolean(
            state.plan
          ),

        hasActiveSession:
          Boolean(
            state.activeSession
          ),

        userResolved:
          Boolean(
            state.user?.id
          ),

        dependencies:
          cloneSafe(
            dependencyState
          )
      }),


    getTrainingProfile:
      () => ({
        age:
          state.profileAge,

        weightLb:
          state.profileWeightLb,

        restingHeartRate:
          state.profileRestingHeartRate,

        estimatedMaxHeartRate:
          state.profileEstimatedMaxHeartRate,

        confirmedMaxHeartRate:
          state.profileConfirmedMaxHeartRate,

        effectiveMaxHeartRate:
          state.profileEffectiveMaxHeartRate,

        maxHeartRateSource:
          state.profileMaxHeartRateSource
      })
  };


  window.Ari =
    window.Ari ||
    {};


  window.Ari.Training =
    runtime;


  window.AriTrainingRuntime =
    runtime;
}


function cloneSafe(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }


  try {
    if (
      typeof structuredClone ===
      "function"
    ) {
      return structuredClone(
        value
      );
    }
  } catch {
    // Fall through.
  }


  try {
    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  } catch {
    return value;
  }
}


// =====================================================
// STARTUP
// =====================================================

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",

    () =>
      void initialize(),

    {
      once:
        true
    }
  );
} else {
  void initialize();
}


// =====================================================
// EXPORTS
// =====================================================

export {
  VERSION,
  SOURCE,
  initialize,
  refresh
};
