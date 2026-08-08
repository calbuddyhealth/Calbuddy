// =====================================================
// ARI REBIRTH
// File: js/ari-training.js
// Version: 3.0.0
// Purpose:
//   Today's Training execution controller for ARI Training.
//
// Architecture:
//
//   WEEKLY PLAN
//      ↓
//   TODAY'S TRAINING
//      ↓
//   LIVE WORKOUT SESSION
//      ↓
//   COMPLETED WORKOUT
//      ↓
//   PERFORMANCE + HISTORY
//
// Core behavior:
//   - Loads the user's existing weekly workout plan.
//   - Resolves today's scheduled workout automatically.
//   - Gives the user one obvious Start Workout action.
//   - Creates a live workout session without modifying the
//     underlying weekly-plan template.
//   - Tracks real session start/end time.
//   - Tracks actual weight + reps completed per set.
//   - Automatically starts a rest timer after completed sets.
//   - Lets users optionally log heart rate during rest periods.
//   - Calculates average + peak from manually logged HR readings.
//   - Allows a final average/peak HR override at workout completion.
//   - Uses HR when available to resolve workout intensity.
//   - Falls back to user-selected perceived intensity.
//   - Estimates training calories.
//   - Saves completed sets into WorkoutProgressStore so the weekly
//     plan automatically reflects actual completion.
//   - Stores completed workout sessions for monthly history.
//   - Preserves current weekly-plan rendering.
//   - Training calories NEVER modify Nutrition calories left.
//
// Existing modules:
//   workout-plan-controller.js
//   workout-progress-store.js
//   exercise-registry.js
//   calorie-calculator.js
//   heart-rate-intensity.js
// =====================================================

import WorkoutPlanController
  from "./training/workout-plan-controller.js";

import WorkoutProgressStore
  from "./training/workout-progress-store.js";

import ExerciseRegistry
  from "./training/exercises/exercise-registry.js";

import CalorieCalculator
  from "./training/energy/calorie-calculator.js";

import HeartRateIntensity
  from "./training/energy/heart-rate-intensity.js";


const VERSION = "3.0.0";
const SOURCE = "js/ari-training";


/* =====================================================
   CONSTANTS
===================================================== */

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


const SESSION_STORAGE_KEY =
  "ari_training_active_session_v1";

const SESSION_HISTORY_KEY =
  "ari_training_session_history_v1";

const LEGACY_HISTORY_KEY =
  "ari_training_monthly_history_v1";

const LAST_PERFORMANCE_KEY =
  "ari_training_last_performance_v1";


const DEFAULT_REST_SECONDS = 90;


/* =====================================================
   STATE
===================================================== */

const state = {
  initialized: false,

  currentDay: null,
  currentMonthKey: null,

  plan: null,

  profileAge: null,
  profileWeightLb: null,
  profileRestingHeartRate: null,
  profileEstimatedMaxHeartRate: null,
  profileConfirmedMaxHeartRate: null,
  profileEffectiveMaxHeartRate: null,
  profileMaxHeartRateSource: null,

  session: null,

  sessionTimerId: null,
  restTimerId: null,

  expandedDays: new Set(),

  unsubscribePlan: null,
  unsubscribeProgress: null
};


const elements = {};


/* =====================================================
   INITIALIZATION
===================================================== */

async function initialize() {
  if (state.initialized) {
    await refresh();
    return;
  }

  cacheElements();
  bindEvents();

  state.currentDay =
    getCurrentWeekdayId();

  state.currentMonthKey =
    getMonthKey();

  setCurrentDateDisplay();

  await loadTrainingProfile();

  WorkoutProgressStore.hydrate();

  await WorkoutPlanController.init();

  state.plan =
    WorkoutPlanController.getPlan();

  syncProgressWithPlan();

  restoreActiveSession();

  state.unsubscribePlan =
    WorkoutPlanController.subscribe(() => {
      state.plan =
        WorkoutPlanController.getPlan();

      syncProgressWithPlan();

      renderAll();
    });


  state.unsubscribeProgress =
    WorkoutProgressStore.subscribe(() => {
      renderWeeklyPlan();
      renderOverview();
      renderMonthlyHistory();
    });


  startRuntimeTimers();

  renderAll();

  state.initialized =
    true;

  publishGlobal();

  console.info(
    `[ARI Training] Runtime initialized. Version ${VERSION}.`
  );
}


/* =====================================================
   DOM CACHE
===================================================== */

function cacheElements() {
  const ids = [

    // Header
    "trainingMenuButton",
    "trainingMenu",

    // Today's Training
    "todaysTraining",
    "todaysTrainingTitle",
    "todaysTrainingDate",
    "todaysTrainingStatus",
    "todaysTrainingPlan",
    "todaysTrainingType",
    "todaysTrainingName",
    "todaysTrainingMeta",
    "todaysTrainingPreview",
    "todaysTrainingExerciseCount",
    "todaysTrainingPlannedSets",
    "todaysTrainingEstimatedTime",
    "startTodayWorkoutButton",
    "editTodayPlanButton",
    "todaysTrainingEmpty",
    "startUnplannedWorkoutButton",

    // Active session
    "todaysTrainingSession",
    "todaySessionElapsed",
    "todaySessionSets",
    "todaySessionCalories",

    "todayCurrentExercise",
    "todayCurrentExerciseName",
    "todayCurrentExercisePrescription",
    "todayCurrentExercisePosition",
    "todayCurrentExerciseSets",

    "todayWorkoutRestPanel",
    "todayWorkoutRestTimer",
    "skipRestButton",

    "logWorkoutHeartRateButton",
    "workoutHeartRateEntry",
    "closeHeartRateEntryButton",
    "workoutHeartRateInput",
    "saveWorkoutHeartRateButton",

    "workoutHeartRateSummary",
    "workoutAverageRecordedHeartRate",
    "workoutPeakRecordedHeartRate",
    "workoutHeartRateReadingCount",

    "todayExerciseList",
    "pauseTodayWorkoutButton",
    "finishTodayWorkoutButton",

    // Completion panel
    "workoutCompletePanel",
    "workoutCompleteName",
    "workoutCompleteMessage",
    "workoutCompleteDuration",
    "workoutCompleteSets",
    "workoutCompleteAverageHeartRate",
    "finalAverageHeartRateInput",
    "finalPeakHeartRateInput",
    "workoutCompleteCalories",
    "workoutCalorieCalculationNote",
    "returnToWorkoutButton",
    "saveCompletedWorkoutButton",

    // Performance
    "trainingCurrentDate",
    "trainingCaloriesBurned",
    "trainingWorkoutTime",
    "trainingWorkoutCount",
    "trainingSetsCompleted",
    "trainingPerformanceSummaryStat",
    "trainingHeartRatePerformance",
    "trainingAverageHeartRate",
    "trainingPeakHeartRate",
    "trainingIntensityLabel",

    // Profile
    "trainingProfilePanel",
    "trainingProfileSource",
    "trainingProfileWeight",
    "trainingProfileRestingHeartRate",
    "trainingProfileMaxHeartRate",
    "trainingProfileMaxHeartRateSource",

    // Weekly plan
    "weeklyPlanPanel",
    "weeklyPlanSummaryStat",
    "weeklyCompletedDays",
    "weeklyScheduledDays",
    "weeklyCompletedSets",
    "weeklyRequiredSets",
    "weeklyTrainingCalories",
    "weeklyPlanList",
    "weeklyPlanEmpty",

    // History
    "monthlyHistoryPanel",
    "trainingHistoryMonthLabel",
    "monthlyWorkoutCount",
    "monthlyCaloriesBurned",
    "monthlyCompletedWorkouts",
    "monthlyTrainingTime",
    "monthlyCaloriesTotal",
    "monthlySetsCompleted",
    "monthlyHistoryList",
    "monthlyHistoryEmptyState",

    // Templates
    "todayWorkoutExerciseTemplate",
    "todayWorkoutSetTemplate",
    "workoutHeartRateReadingTemplate",
    "weeklyPlanDayTemplate",
    "plannedExerciseTemplate",
    "plannedSetTemplate",
    "monthlyHistoryDayTemplate",
    "monthlyHistoryWorkoutTemplate"
  ];


  for (const id of ids) {
    elements[id] =
      document.getElementById(id);
  }
}


/* =====================================================
   EVENTS
===================================================== */

function bindEvents() {

  elements.trainingMenuButton
    ?.addEventListener(
      "click",
      toggleTrainingMenu
    );


  elements.trainingMenu
    ?.addEventListener(
      "click",
      event => {
        if (event.target.closest("a")) {
          closeTrainingMenu();
        }
      }
    );


  elements.startTodayWorkoutButton
    ?.addEventListener(
      "click",
      startTodayWorkout
    );


  elements.startUnplannedWorkoutButton
    ?.addEventListener(
      "click",
      startUnplannedWorkout
    );


  elements.todayCurrentExerciseSets
    ?.addEventListener(
      "click",
      handleLiveSetClick
    );


  elements.todayExerciseList
    ?.addEventListener(
      "click",
      handleTodayExerciseListClick
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
      saveHeartRateReading
    );


  elements.workoutHeartRateInput
    ?.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          saveHeartRateReading();
        }
      }
    );


  elements.skipRestButton
    ?.addEventListener(
      "click",
      skipRest
    );


  elements.pauseTodayWorkoutButton
    ?.addEventListener(
      "click",
      toggleWorkoutPause
    );


  elements.finishTodayWorkoutButton
    ?.addEventListener(
      "click",
      openWorkoutCompletion
    );


  elements.returnToWorkoutButton
    ?.addEventListener(
      "click",
      returnToWorkout
    );


  elements.saveCompletedWorkoutButton
    ?.addEventListener(
      "click",
      completeAndSaveWorkout
    );


  document
    .querySelectorAll(
      'input[name="workoutIntensity"]'
    )
    .forEach(
      input => {
        input.addEventListener(
          "change",
          updateCompletionCalories
        );
      }
    );


  elements.finalAverageHeartRateInput
    ?.addEventListener(
      "input",
      updateCompletionCalories
    );


  elements.finalPeakHeartRateInput
    ?.addEventListener(
      "input",
      updateCompletionCalories
    );


  elements.weeklyPlanList
    ?.addEventListener(
      "click",
      handleWeeklyPlanClick
    );


  window.addEventListener(
    "focus",
    refresh
  );


  window.addEventListener(
    "storage",
    () => {
      refresh();
    }
  );


  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        refresh();
      }
    }
  );
}


/* =====================================================
   REFRESH
===================================================== */

async function refresh() {
  state.currentDay =
    getCurrentWeekdayId();

  state.currentMonthKey =
    getMonthKey();

  await loadTrainingProfile();

  try {
    await WorkoutPlanController.load();
  } catch (error) {
    console.warn(
      "[ARI Training] Workout plan refresh failed.",
      error
    );
  }

  state.plan =
    WorkoutPlanController.getPlan();

  WorkoutProgressStore.hydrate();

  syncProgressWithPlan();

  restoreActiveSession({
    preserveExisting:
      true
  });

  setCurrentDateDisplay();

  renderAll();
}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {
  renderTrainingProfile();
  renderTodaysTraining();
  renderWeeklyPlan();
  renderOverview();
  renderMonthlyHistory();
}


/* =====================================================
   PLAN + PROGRESS CONTEXT
===================================================== */

function syncProgressWithPlan() {
  const plan =
    state.plan;

  if (
    !plan ||
    !plan.week
  ) {
    return;
  }

  WorkoutProgressStore.setPlanContext({
    planKey:
      plan.planId ||
      plan.metadata?.sourceTemplateId ||
      "local-plan",

    weekKey:
      getCurrentWeekKey(),

    resetIfChanged:
      true
  });


  WorkoutProgressStore
    .syncWeekWithPlan(
      plan.week
    );
}


/* =====================================================
   TODAY'S TRAINING
===================================================== */

function renderTodaysTraining() {
  const today =
    state.plan
      ?.week
      ?.[state.currentDay];

  const session =
    state.session;


  setTodayDate();


  /*
   * Active workout always wins over plan state.
   */
  if (
    session &&
    session.status !== "completed"
  ) {
    renderActiveSession();
    return;
  }


  setHidden(
    elements.todaysTrainingSession,
    true
  );

  setHidden(
    elements.workoutCompletePanel,
    true
  );


  /*
   * Off day / no scheduled workout.
   */
  if (
    !today ||
    today.type === "off"
  ) {
    renderNoWorkoutToday(
      today
    );

    return;
  }


  /*
   * Planned workout.
   */
  const summary =
    WorkoutProgressStore
      .getDaySummary(
        state.currentDay
      );


  setHidden(
    elements.todaysTrainingEmpty,
    true
  );


  setHidden(
    elements.todaysTrainingPlan,
    false
  );


  setHidden(
    elements.todaysTrainingPreview,
    false
  );


  setText(
    elements.todaysTrainingType,
    "Scheduled Workout"
  );


  setText(
    elements.todaysTrainingName,
    today.title ||
    "Today's Workout"
  );


  const exercises =
    today.exercises ||
    [];


  const plannedSets =
    countRequiredSets(
      exercises
    );


  const estimatedMinutes =
    estimatePlannedTrainingMinutes(
      today
    );


  setText(
    elements.todaysTrainingMeta,
    buildTodayMeta(
      exercises.length,
      plannedSets,
      estimatedMinutes
    )
  );


  setText(
    elements.todaysTrainingExerciseCount,
    String(
      exercises.length
    )
  );


  setText(
    elements.todaysTrainingPlannedSets,
    String(
      plannedSets
    )
  );


  setText(
    elements.todaysTrainingEstimatedTime,
    estimatedMinutes > 0
      ? formatDuration(
          estimatedMinutes
        )
      : "—"
  );


  const complete =
    summary?.status ===
    "complete";


  setTodayStatus(
    complete
      ? "complete"
      : "not_started"
  );


  if (
    elements.startTodayWorkoutButton
  ) {
    elements
      .startTodayWorkoutButton
      .textContent =
        complete
          ? "Train Again"
          : "Start Workout";
  }
}


function renderNoWorkoutToday(
  today
) {
  const isOffDay =
    today?.type ===
    "off";


  setTodayStatus(
    isOffDay
      ? "rest"
      : "not_started"
  );


  setText(
    elements.todaysTrainingType,
    isOffDay
      ? "Recovery Day"
      : "No Workout Scheduled"
  );


  setText(
    elements.todaysTrainingName,
    isOffDay
      ? today.title ||
        "Rest Day"
      : "Nothing planned today"
  );


  setText(
    elements.todaysTrainingMeta,
    isOffDay
      ? "Take the day off or start an optional workout."
      : "Start a workout now or create a weekly plan."
  );


  setHidden(
    elements.todaysTrainingPreview,
    true
  );


  setHidden(
    elements.todaysTrainingEmpty,
    false
  );


  setHidden(
    elements.startTodayWorkoutButton,
    true
  );
}


function setTodayDate() {
  const now =
    new Date();

  if (
    elements.todaysTrainingDate
  ) {
    elements
      .todaysTrainingDate
      .dateTime =
        getLocalDateKey(now);

    elements
      .todaysTrainingDate
      .textContent =
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday:
              "long",
            month:
              "short",
            day:
              "numeric"
          }
        )
        .format(now);
  }
}


function setTodayStatus(
  status
) {
  const element =
    elements.todaysTrainingStatus;

  if (!element) {
    return;
  }

  element.dataset.status =
    status;

  element.textContent =
    getStatusLabel(
      status
    );
}


/* =====================================================
   START WORKOUT
===================================================== */

function startTodayWorkout() {
  const dayState =
    state.plan
      ?.week
      ?.[state.currentDay];

  if (
    !dayState ||
    dayState.type === "off"
  ) {
    startUnplannedWorkout();
    return;
  }


  const exercises =
    buildSessionExercises(
      dayState.exercises ||
      []
    );


  const now =
    new Date();


  state.session = {
    id:
      createSessionId(),

    source:
      "weekly_plan",

    day:
      state.currentDay,

    localDate:
      getLocalDateKey(
        now
      ),

    title:
      dayState.title ||
      "Workout",

    status:
      "active",

    startedAt:
      now.toISOString(),

    completedAt:
      null,

    pausedAt:
      null,

    pausedDurationMs:
      0,

    currentExerciseIndex:
      0,

    exercises,

    heartRateReadings:
      [],

    finalAverageHeartRate:
      null,

    finalPeakHeartRate:
      null,

    selectedIntensity:
      "moderate",

    estimatedCalories:
      0
  };


  persistSession();

  renderTodaysTraining();

  startRuntimeTimers();
}


function startUnplannedWorkout() {
  /*
   * For V3.0.0, an unplanned workout opens Workout Plans / library
   * rather than creating an empty workout editor here.
   *
   * This keeps Today's Training extremely simple.
   *
   * We can later add a quick exercise picker without changing
   * the session architecture.
   */
  window.location.href =
    "workout-plans.html";
}


/* =====================================================
   BUILD LIVE SESSION FROM WEEKLY PLAN
===================================================== */

function buildSessionExercises(
  exerciseEntries
) {
  return exerciseEntries.map(
    entry => {
      const exercise =
        ExerciseRegistry.get(
          entry.exerciseId
        );


      const requiredSets =
        normalizeRequiredSets(
          entry
        );


      const sets = [];


      if (
        requiredSets > 0
      ) {
        for (
          let index = 1;
          index <= requiredSets;
          index += 1
        ) {
          sets.push({
            setNumber:
              index,

            targetReps:
              normalizePositiveNumber(
                entry.reps
              ),

            targetWeight:
              resolvePlannedWeight(
                entry
              ),

            actualReps:
              null,

            actualWeight:
              resolvePlannedWeight(
                entry
              ),

            completed:
              false,

            completedAt:
              null,

            estimatedCalories:
              0
          });
        }
      }


      return {
        exerciseId:
          entry.exerciseId,

        name:
          exercise?.name ||
          titleFromId(
            entry.exerciseId
          ),

        type:
          getExerciseTypeLabel(
            exercise
          ),

        prescription:
          getExercisePrescription(
            entry
          ),

        durationMinutes:
          normalizePositiveNumber(
            entry.durationMinutes
          ),

        durationSeconds:
          normalizePositiveNumber(
            entry.durationSeconds
          ),

        plannedIntensity:
          entry.intensity ||
          "moderate",

        requiredSets,

        completionMode:
          requiredSets > 0
            ? "sets"
            : "single",

        completed:
          false,

        completedAt:
          null,

        sets,

        originalEntry: {
          ...entry
        }
      };
    }
  );
}


function resolvePlannedWeight(
  entry
) {
  const direct =
    normalizePositiveNumber(
      entry.weight
    );

  if (
    direct !== null
  ) {
    return direct;
  }


  const added =
    normalizePositiveNumber(
      entry.added_weight
    );

  if (
    added !== null
  ) {
    return added;
  }


  return null;
}


/* =====================================================
   RENDER ACTIVE SESSION
===================================================== */

function renderActiveSession() {
  const session =
    state.session;

  if (!session) {
    return;
  }


  setHidden(
    elements.todaysTrainingPlan,
    true
  );


  setHidden(
    elements.todaysTrainingEmpty,
    true
  );


  setHidden(
    elements.startTodayWorkoutButton,
    true
  );


  setHidden(
    elements.editTodayPlanButton,
    true
  );


  setHidden(
    elements.workoutCompletePanel,
    true
  );


  setHidden(
    elements.todaysTrainingSession,
    false
  );


  setText(
    elements.todaysTrainingTitle,
    session.status ===
      "paused"
      ? "Workout Paused"
      : "Workout In Progress"
  );


  setTodayStatus(
    session.status ===
      "paused"
      ? "in_progress"
      : "in_progress"
  );


  renderSessionMetrics();
  renderCurrentExercise();
  renderSessionExerciseList();
  renderHeartRateSummary();


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
}


/* =====================================================
   SESSION METRICS
===================================================== */

function renderSessionMetrics() {
  const session =
    state.session;

  if (!session) {
    return;
  }


  setText(
    elements.todaySessionElapsed,
    formatElapsedTime(
      getSessionElapsedMs()
    )
  );


  const setStats =
    getSessionSetStats();


  setText(
    elements.todaySessionSets,
    `${setStats.completed} / ${setStats.required}`
  );


  const calories =
    estimateLiveSessionCalories();


  session.estimatedCalories =
    calories;


  setText(
    elements.todaySessionCalories,
    `${formatNumber(calories)} kcal`
  );
}


/* =====================================================
   CURRENT EXERCISE
===================================================== */

function renderCurrentExercise() {
  const session =
    state.session;

  if (!session) {
    return;
  }


  const exercises =
    session.exercises ||
    [];


  if (
    exercises.length === 0
  ) {
    setText(
      elements.todayCurrentExerciseName,
      "No exercises"
    );

    setText(
      elements.todayCurrentExercisePrescription,
      ""
    );

    setText(
      elements.todayCurrentExercisePosition,
      "0 / 0"
    );

    elements
      .todayCurrentExerciseSets
      ?.replaceChildren();

    return;
  }


  clampCurrentExerciseIndex();


  const index =
    session.currentExerciseIndex;


  const exercise =
    exercises[index];


  setText(
    elements.todayCurrentExerciseName,
    exercise.name
  );


  setText(
    elements.todayCurrentExercisePrescription,
    exercise.prescription ||
    "Complete activity"
  );


  setText(
    elements.todayCurrentExercisePosition,
    `${index + 1} / ${exercises.length}`
  );


  const container =
    elements.todayCurrentExerciseSets;


  if (!container) {
    return;
  }


  container.replaceChildren();


  if (
    exercise.completionMode ===
    "sets"
  ) {
    exercise.sets.forEach(
      set => {
        container.appendChild(
          createLiveSetElement(
            exercise,
            set
          )
        );
      }
    );

    return;
  }


  container.appendChild(
    createSingleActivityElement(
      exercise
    )
  );
}


/* =====================================================
   LIVE SET TEMPLATE
===================================================== */

function createLiveSetElement(
  exercise,
  set
) {
  const template =
    elements.todayWorkoutSetTemplate;


  if (
    !template?.content
  ) {
    const fallback =
      document.createElement(
        "button"
      );

    fallback.type =
      "button";

    fallback.textContent =
      `Complete Set ${set.setNumber}`;

    fallback.dataset.action =
      "complete-live-set";

    fallback.dataset.exerciseId =
      exercise.exerciseId;

    fallback.dataset.setNumber =
      String(
        set.setNumber
      );

    return fallback;
  }


  const fragment =
    template.content
      .cloneNode(true);


  const root =
    fragment.querySelector(
      ".ari-live-set"
    );


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


  root.dataset.exerciseId =
    exercise.exerciseId;

  root.dataset.setNumber =
    String(
      set.setNumber
    );

  root.dataset.status =
    set.completed
      ? "complete"
      : "not_started";


  setTextWithin(
    root,
    ".ari-live-set__label",
    `Set ${set.setNumber}`
  );


  setTextWithin(
    root,
    ".ari-live-set__target",
    buildSetTargetLabel(
      set
    )
  );


  if (weightInput) {
    weightInput.dataset.exerciseId =
      exercise.exerciseId;

    weightInput.dataset.setNumber =
      String(
        set.setNumber
      );

    weightInput.value =
      set.actualWeight ??
      set.targetWeight ??
      "";

    weightInput.disabled =
      set.completed;
  }


  if (repsInput) {
    repsInput.dataset.exerciseId =
      exercise.exerciseId;

    repsInput.dataset.setNumber =
      String(
        set.setNumber
      );

    repsInput.value =
      set.actualReps ??
      set.targetReps ??
      "";

    repsInput.disabled =
      set.completed;
  }


  if (completeButton) {
    completeButton.dataset.action =
      "complete-live-set";

    completeButton.dataset.exerciseId =
      exercise.exerciseId;

    completeButton.dataset.setNumber =
      String(
        set.setNumber
      );

    completeButton.disabled =
      set.completed;

    completeButton.textContent =
      set.completed
        ? "Set Complete"
        : "Complete Set";
  }


  if (
    set.completed
  ) {
    root.classList.add(
      "is-complete"
    );
  }


  return fragment;
}


function createSingleActivityElement(
  exercise
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "ari-live-set ari-live-activity";


  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "ari-primary-button";

  button.dataset.action =
    "complete-live-activity";

  button.dataset.exerciseId =
    exercise.exerciseId;


  button.textContent =
    exercise.completed
      ? "Activity Complete"
      : "Complete Activity";


  button.disabled =
    exercise.completed;


  wrapper.appendChild(
    button
  );


  return wrapper;
}


/* =====================================================
   LIVE SET EVENTS
===================================================== */

function handleLiveSetClick(
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
    completeLiveSet(
      button
    );

    return;
  }


  if (
    button.dataset.action ===
    "complete-live-activity"
  ) {
    completeLiveActivity(
      button.dataset.exerciseId
    );
  }
}


function completeLiveSet(
  button
) {
  const session =
    state.session;

  if (
    !session ||
    session.status !== "active"
  ) {
    return;
  }


  const exerciseId =
    button.dataset.exerciseId;


  const setNumber =
    Number(
      button.dataset.setNumber
    );


  const exercise =
    session.exercises.find(
      item =>
        item.exerciseId ===
        exerciseId
    );


  if (!exercise) {
    return;
  }


  const set =
    exercise.sets.find(
      item =>
        item.setNumber ===
        setNumber
    );


  if (
    !set ||
    set.completed
  ) {
    return;
  }


  const root =
    button.closest(
      ".ari-live-set"
    );


  const weightInput =
    root?.querySelector(
      ".ari-live-set__weight"
    );


  const repsInput =
    root?.querySelector(
      ".ari-live-set__reps"
    );


  set.actualWeight =
    normalizeNonNegativeNumber(
      weightInput?.value
    );


  set.actualReps =
    normalizeNonNegativeInteger(
      repsInput?.value
    );


  set.completed =
    true;


  set.completedAt =
    new Date()
      .toISOString();


  set.estimatedCalories =
    estimateLiveSetCalories(
      exercise
    );


  syncLiveSetToProgressStore(
    exercise,
    set
  );


  updateExerciseCompletion(
    exercise
  );


  moveToRelevantExercise();


  persistSession();

  startRestTimer(
    getExerciseRestSeconds(
      exercise
    )
  );

  renderActiveSession();
}


function completeLiveActivity(
  exerciseId
) {
  const session =
    state.session;

  if (
    !session ||
    session.status !== "active"
  ) {
    return;
  }


  const exercise =
    session.exercises.find(
      item =>
        item.exerciseId ===
        exerciseId
    );


  if (
    !exercise ||
    exercise.completed
  ) {
    return;
  }


  exercise.completed =
    true;


  exercise.completedAt =
    new Date()
      .toISOString();


  const calories =
    estimateLiveActivityCalories(
      exercise
    );


  WorkoutProgressStore
    .setExerciseCompleted({
      day:
        session.day,

      exerciseId:
        exercise.exerciseId,

      completed:
        true,

      estimatedCalories:
        calories
    });


  finalizeDayCompletion(
    session.day
  );


  moveToRelevantExercise();

  persistSession();

  renderActiveSession();
}


function syncLiveSetToProgressStore(
  exercise,
  set
) {
  WorkoutProgressStore
    .setSetCompleted({
      day:
        state.session.day,

      exerciseId:
        exercise.exerciseId,

      setNumber:
        set.setNumber,

      requiredSets:
        exercise.requiredSets,

      completed:
        true,

      estimatedCalories:
        set.estimatedCalories
    });


  finalizeDayCompletion(
    state.session.day
  );
}


/* =====================================================
   EXERCISE NAVIGATION
===================================================== */

function moveToRelevantExercise() {
  const session =
    state.session;

  if (!session) {
    return;
  }


  const exercises =
    session.exercises;


  const current =
    exercises[
      session.currentExerciseIndex
    ];


  if (
    current &&
    !current.completed
  ) {
    return;
  }


  const nextIndex =
    exercises.findIndex(
      exercise =>
        !exercise.completed
    );


  if (
    nextIndex >= 0
  ) {
    session.currentExerciseIndex =
      nextIndex;
  }
}


function clampCurrentExerciseIndex() {
  const session =
    state.session;

  if (!session) {
    return;
  }


  const max =
    Math.max(
      0,
      session.exercises.length -
      1
    );


  session.currentExerciseIndex =
    Math.min(
      Math.max(
        0,
        Number(
          session.currentExerciseIndex
        ) || 0
      ),
      max
    );
}


/* =====================================================
   TODAY EXERCISE LIST
===================================================== */

function renderSessionExerciseList() {
  const container =
    elements.todayExerciseList;


  if (
    !container ||
    !state.session
  ) {
    return;
  }


  container.replaceChildren();


  state.session.exercises
    .forEach(
      (
        exercise,
        index
      ) => {
        container.appendChild(
          createTodayExerciseSummary(
            exercise,
            index
          )
        );
      }
    );
}


function createTodayExerciseSummary(
  exercise,
  index
) {
  const template =
    elements.todayWorkoutExerciseTemplate;


  if (
    !template?.content
  ) {
    const fallback =
      document.createElement(
        "button"
      );

    fallback.type =
      "button";

    fallback.dataset.action =
      "select-session-exercise";

    fallback.dataset.exerciseIndex =
      String(index);

    fallback.textContent =
      exercise.name;

    return fallback;
  }


  const fragment =
    template.content
      .cloneNode(true);


  const article =
    fragment.querySelector(
      ".ari-today-exercise"
    );


  const button =
    article.querySelector(
      ".ari-today-exercise__header"
    );


  const body =
    article.querySelector(
      ".ari-today-exercise__body"
    );


  const setContainer =
    article.querySelector(
      ".ari-today-exercise__sets"
    );


  article.dataset.exerciseId =
    exercise.exerciseId;


  article.dataset.status =
    exercise.completed
      ? "complete"
      : "not_started";


  button.dataset.action =
    "select-session-exercise";


  button.dataset.exerciseIndex =
    String(index);


  setTextWithin(
    article,
    ".ari-today-exercise__type",
    exercise.type
  );


  setTextWithin(
    article,
    ".ari-today-exercise__name",
    exercise.name
  );


  setTextWithin(
    article,
    ".ari-today-exercise__prescription",
    exercise.prescription
  );


  if (
    exercise.completionMode ===
    "sets"
  ) {
    const completed =
      exercise.sets.filter(
        set =>
          set.completed
      ).length;


    setTextWithin(
      article,
      ".ari-today-exercise__progress",
      `${completed}/${exercise.requiredSets} sets`
    );


    exercise.sets.forEach(
      set => {
        const row =
          document.createElement(
            "div"
          );

        row.className =
          "ari-today-exercise__set-summary";


        row.textContent =
          set.completed
            ? buildCompletedSetSummary(
                set
              )
            : buildSetTargetSummary(
                set
              );


        setContainer
          ?.appendChild(
            row
          );
      }
    );

  } else {

    setTextWithin(
      article,
      ".ari-today-exercise__progress",
      exercise.completed
        ? "Complete"
        : "Not Started"
    );
  }


  body.hidden =
    true;


  button.setAttribute(
    "aria-expanded",
    "false"
  );


  return fragment;
}


function handleTodayExerciseListClick(
  event
) {
  const button =
    event.target.closest(
      '[data-action="select-session-exercise"]'
    );


  if (!button) {
    return;
  }


  const index =
    Number(
      button.dataset.exerciseIndex
    );


  if (
    !Number.isInteger(index) ||
    !state.session
  ) {
    return;
  }


  state.session.currentExerciseIndex =
    index;


  persistSession();

  renderCurrentExercise();
  renderSessionExerciseList();
}


/* =====================================================
   REST TIMER
===================================================== */

function startRestTimer(
  seconds =
    DEFAULT_REST_SECONDS
) {
  if (!state.session) {
    return;
  }


  clearRestTimer();


  state.session.rest = {
    startedAt:
      Date.now(),

    durationSeconds:
      Math.max(
        0,
        Math.round(
          Number(seconds) ||
          DEFAULT_REST_SECONDS
        )
      ),

    endsAt:
      Date.now() +
      (
        Math.max(
          0,
          Number(seconds) ||
          DEFAULT_REST_SECONDS
        ) *
        1000
      )
  };


  persistSession();

  renderRestTimer();


  state.restTimerId =
    window.setInterval(
      renderRestTimer,
      250
    );
}


function renderRestTimer() {
  const rest =
    state.session?.rest;


  if (!rest) {
    setHidden(
      elements.todayWorkoutRestPanel,
      true
    );

    return;
  }


  const remainingMs =
    rest.endsAt -
    Date.now();


  if (
    remainingMs <= 0
  ) {
    clearRestTimer();

    if (state.session) {
      state.session.rest =
        null;

      persistSession();
    }

    setHidden(
      elements.todayWorkoutRestPanel,
      true
    );

    return;
  }


  setHidden(
    elements.todayWorkoutRestPanel,
    false
  );


  setText(
    elements.todayWorkoutRestTimer,
    formatCountdown(
      remainingMs
    )
  );
}


function skipRest() {
  if (!state.session) {
    return;
  }


  state.session.rest =
    null;


  clearRestTimer();

  persistSession();

  setHidden(
    elements.todayWorkoutRestPanel,
    true
  );
}


function clearRestTimer() {
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


/* =====================================================
   HEART RATE
===================================================== */

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
    20
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


function saveHeartRateReading() {
  const session =
    state.session;


  if (!session) {
    return;
  }


  const heartRate =
    normalizeHeartRate(
      elements
        .workoutHeartRateInput
        ?.value
    );


  if (!heartRate) {
    return;
  }


  session.heartRateReadings =
    Array.isArray(
      session.heartRateReadings
    )
      ? session.heartRateReadings
      : [];


  session.heartRateReadings.push({
    id:
      `hr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,

    bpm:
      heartRate,

    recordedAt:
      new Date()
        .toISOString(),

    elapsedMs:
      getSessionElapsedMs()
  });


  persistSession();

  closeHeartRateEntry();

  renderHeartRateSummary();

  renderSessionMetrics();
}


function renderHeartRateSummary() {
  const stats =
    getRecordedHeartRateStats();


  setHidden(
    elements.workoutHeartRateSummary,
    stats.count === 0
  );


  if (
    stats.count === 0
  ) {
    return;
  }


  setText(
    elements.workoutAverageRecordedHeartRate,
    `${stats.average} bpm`
  );


  setText(
    elements.workoutPeakRecordedHeartRate,
    `${stats.peak} bpm`
  );


  setText(
    elements.workoutHeartRateReadingCount,
    String(
      stats.count
    )
  );
}


function getRecordedHeartRateStats() {
  const readings =
    state.session
      ?.heartRateReadings ||
    [];


  const valid =
    readings
      .map(
        item =>
          normalizeHeartRate(
            item.bpm
          )
      )
      .filter(Boolean);


  if (
    valid.length === 0
  ) {
    return {
      count:
        0,

      average:
        null,

      peak:
        null
    };
  }


  const total =
    valid.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );


  return {
    count:
      valid.length,

    average:
      Math.round(
        total /
        valid.length
      ),

    peak:
      Math.max(
        ...valid
      )
  };
}


/* =====================================================
   PAUSE / RESUME
===================================================== */

function toggleWorkoutPause() {
  const session =
    state.session;


  if (!session) {
    return;
  }


  if (
    session.status ===
    "paused"
  ) {
    resumeWorkout();
    return;
  }


  pauseWorkout();
}


function pauseWorkout() {
  const session =
    state.session;


  if (
    !session ||
    session.status !== "active"
  ) {
    return;
  }


  session.status =
    "paused";


  session.pausedAt =
    new Date()
      .toISOString();


  persistSession();

  renderActiveSession();
}


function resumeWorkout() {
  const session =
    state.session;


  if (
    !session ||
    session.status !== "paused"
  ) {
    return;
  }


  const pausedAt =
    Date.parse(
      session.pausedAt
    );


  if (
    Number.isFinite(
      pausedAt
    )
  ) {
    session.pausedDurationMs +=
      Math.max(
        0,
        Date.now() -
        pausedAt
      );
  }


  session.pausedAt =
    null;


  session.status =
    "active";


  persistSession();

  renderActiveSession();
}


/* =====================================================
   WORKOUT COMPLETION SCREEN
===================================================== */

function openWorkoutCompletion() {
  const session =
    state.session;


  if (!session) {
    return;
  }


  if (
    session.status ===
    "paused"
  ) {
    resumeWorkout();
  }


  const stats =
    getRecordedHeartRateStats();


  setHidden(
    elements.todaysTrainingSession,
    true
  );


  setHidden(
    elements.workoutCompletePanel,
    false
  );


  setText(
    elements.todaysTrainingTitle,
    "Workout Complete"
  );


  setText(
    elements.workoutCompleteName,
    session.title ||
    "Workout Complete"
  );


  setText(
    elements.workoutCompleteDuration,
    formatDurationFromMs(
      getSessionElapsedMs()
    )
  );


  const setStats =
    getSessionSetStats();


  setText(
    elements.workoutCompleteSets,
    String(
      setStats.completed
    )
  );


  setText(
    elements.workoutCompleteAverageHeartRate,
    stats.average
      ? `${stats.average} bpm`
      : "—"
  );


  if (
    elements.finalAverageHeartRateInput
  ) {
    elements
      .finalAverageHeartRateInput
      .value =
        session.finalAverageHeartRate ??
        stats.average ??
        "";
  }


  if (
    elements.finalPeakHeartRateInput
  ) {
    elements
      .finalPeakHeartRateInput
      .value =
        session.finalPeakHeartRate ??
        stats.peak ??
        "";
  }


  updateCompletionCalories();
}


function returnToWorkout() {
  setHidden(
    elements.workoutCompletePanel,
    true
  );


  setHidden(
    elements.todaysTrainingSession,
    false
  );


  renderActiveSession();
}


/* =====================================================
   COMPLETION CALORIE RESOLUTION
===================================================== */

function updateCompletionCalories() {
  const session =
    state.session;


  if (!session) {
    return;
  }


  const averageHeartRate =
    normalizeHeartRate(
      elements
        .finalAverageHeartRateInput
        ?.value
    );


  const peakHeartRate =
    normalizeHeartRate(
      elements
        .finalPeakHeartRateInput
        ?.value
    );


  const selectedIntensity =
    document
      .querySelector(
        'input[name="workoutIntensity"]:checked'
      )
      ?.value ||
    "moderate";


  session.finalAverageHeartRate =
    averageHeartRate;


  session.finalPeakHeartRate =
    peakHeartRate;


  session.selectedIntensity =
    selectedIntensity;


  const result =
    calculateFinalSessionCalories({
      averageHeartRate,
      selectedIntensity
    });


  session.estimatedCalories =
    result.calories;


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


  persistSession();
}


/* =====================================================
   FINAL CALORIE ESTIMATE
===================================================== */

function calculateFinalSessionCalories({
  averageHeartRate,
  selectedIntensity
}) {
  const session =
    state.session;


  if (!session) {
    return {
      calories:
        0,

      intensity:
        selectedIntensity ||
        "moderate",

      note:
        "Workout data unavailable."
    };
  }


  const durationMinutes =
    Math.max(
      1,
      getSessionElapsedMs() /
      60000
    );


  let resolvedIntensity =
    selectedIntensity ||
    "moderate";


  let hrResult =
    null;


  if (
    averageHeartRate &&
    state.profileEffectiveMaxHeartRate
  ) {
    hrResult =
      HeartRateIntensity.classify({
        age:
          state.profileAge,

        heartRate:
          averageHeartRate,

        restingHeartRate:
          state.profileRestingHeartRate,

        maxHeartRate:
          state.profileEffectiveMaxHeartRate,

        preferHeartRateReserve:
          Boolean(
            state.profileRestingHeartRate
          )
      });


    const heartRateIntensity =
      HeartRateIntensity
        .toCalorieIntensity(
          hrResult?.intensityId
        );


    if (
      heartRateIntensity
    ) {
      resolvedIntensity =
        heartRateIntensity;
    }
  }


  const calories =
    estimateSessionCaloriesByExercise({
      durationMinutes,
      intensity:
        resolvedIntensity
    });


  let note;


  if (
    averageHeartRate &&
    hrResult
  ) {
    note =
      `Based on ${formatDuration(durationMinutes)}, body weight, ` +
      `recorded average heart rate, workout type, and heart-rate intensity.`;
  } else {
    note =
      `Based on ${formatDuration(durationMinutes)}, body weight, ` +
      `workout type, and selected intensity.`;
  }


  return {
    calories,
    intensity:
      resolvedIntensity,
    heartRateResult:
      hrResult,
    note
  };
}


function estimateSessionCaloriesByExercise({
  durationMinutes,
  intensity
}) {
  const weightLb =
    state.profileWeightLb;


  if (
    !weightLb ||
    !state.session
  ) {
    return 0;
  }


  /*
   * First attempt:
   * use completed exercise/set calorie values because they are
   * exercise-specific and already use the ARI calorie engine.
   */
  let completedCalories =
    0;


  for (
    const exercise
    of state.session.exercises
  ) {

    if (
      exercise.completionMode ===
      "sets"
    ) {
      completedCalories +=
        exercise.sets.reduce(
          (
            sum,
            set
          ) =>
            sum +
            (
              set.completed
                ? Number(
                    set.estimatedCalories
                  ) || 0
                : 0
            ),
          0
        );

      continue;
    }


    if (
      exercise.completed
    ) {
      completedCalories +=
        estimateLiveActivityCalories(
          exercise,
          intensity
        );
    }
  }


  /*
   * Session-level estimate gives us a more sensible calorie
   * result when the per-set estimates are sparse.
   */
  const sessionEstimate =
    CalorieCalculator
      .estimateStrengthSession({
        intensity:
          normalizeCalorieIntensity(
            intensity
          ),

        weightLb,

        durationMinutes
      });


  const sessionCalories =
    Math.max(
      0,
      Number(
        sessionEstimate
          ?.roundedCalories
      ) || 0
    );


  /*
   * Prefer the session estimate for strength training because
   * elapsed duration captures work + short recovery periods better.
   *
   * If unavailable, use accumulated exercise calories.
   */
  return Math.round(
    sessionCalories > 0
      ? sessionCalories
      : completedCalories
  );
}


/* =====================================================
   SAVE COMPLETED WORKOUT
===================================================== */

function completeAndSaveWorkout() {
  const session =
    state.session;


  if (!session) {
    return;
  }


  updateCompletionCalories();


  const now =
    new Date();


  session.status =
    "completed";


  session.completedAt =
    now.toISOString();


  session.localDate =
    session.localDate ||
    getLocalDateKey(now);


  /*
   * Make sure the weekly day receives its final status.
   */
  if (
    session.source ===
    "weekly_plan"
  ) {
    finalizeDayCompletion(
      session.day
    );
  }


  const completedRecord =
    buildCompletedSessionRecord(
      session
    );


  saveSessionHistoryRecord(
    completedRecord
  );


  saveLastPerformance(
    completedRecord
  );


  localStorage.removeItem(
    SESSION_STORAGE_KEY
  );


  clearRestTimer();


  state.session =
    null;


  setHidden(
    elements.workoutCompletePanel,
    true
  );


  renderAll();
}


/* =====================================================
   BUILD COMPLETED SESSION
===================================================== */

function buildCompletedSessionRecord(
  session
) {
  const setStats =
    getSessionSetStats(
      session
    );


  const hrStats =
    getSessionHeartRateStats(
      session
    );


  const effectiveAverageHeartRate =
    session.finalAverageHeartRate ||
    hrStats.average ||
    null;


  const effectivePeakHeartRate =
    session.finalPeakHeartRate ||
    hrStats.peak ||
    null;


  const finalCalories =
    calculateFinalSessionCalories({
      averageHeartRate:
        effectiveAverageHeartRate,

      selectedIntensity:
        session.selectedIntensity ||
        "moderate"
    });


  return {
    id:
      session.id,

    source:
      session.source,

    day:
      session.day,

    title:
      session.title,

    localDate:
      session.localDate,

    monthKey:
      session.localDate
        ?.slice(0, 7) ||
      state.currentMonthKey,

    startedAt:
      session.startedAt,

    completedAt:
      session.completedAt,

    durationMs:
      getSessionElapsedMs(
        session,
        true
      ),

    minutes:
      Math.max(
        1,
        Math.round(
          getSessionElapsedMs(
            session,
            true
          ) /
          60000
        )
      ),

    completedSets:
      setStats.completed,

    requiredSets:
      setStats.required,

    calories:
      finalCalories.calories,

    intensity:
      finalCalories.intensity,

    selectedIntensity:
      session.selectedIntensity ||
      "moderate",

    averageHeartRate:
      effectiveAverageHeartRate,

    peakHeartRate:
      effectivePeakHeartRate,

    heartRateReadings:
      Array.isArray(
        session.heartRateReadings
      )
        ? session.heartRateReadings
        : [],

    exercises:
      session.exercises
        .map(
          exercise => ({
            exerciseId:
              exercise.exerciseId,

            name:
              exercise.name,

            completed:
              exercise.completed,

            completionMode:
              exercise.completionMode,

            requiredSets:
              exercise.requiredSets,

            sets:
              exercise.sets
                ?.map(
                  set => ({
                    ...set
                  })
                ) || []
          })
        )
  };
}


/* =====================================================
   SESSION STORAGE
===================================================== */

function persistSession() {
  if (!state.session) {
    localStorage.removeItem(
      SESSION_STORAGE_KEY
    );

    return;
  }


  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(
        state.session
      )
    );
  } catch (error) {
    console.warn(
      "[ARI Training] Active session could not persist.",
      error
    );
  }
}


function restoreActiveSession({
  preserveExisting =
    false
} = {}) {
  if (
    preserveExisting &&
    state.session
  ) {
    return;
  }


  try {
    const raw =
      localStorage.getItem(
        SESSION_STORAGE_KEY
      );


    if (!raw) {
      return;
    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !parsed ||
      parsed.status ===
        "completed"
    ) {
      return;
    }


    /*
     * Do not resurrect a workout from a previous date.
     */
    if (
      parsed.localDate &&
      parsed.localDate !==
        getLocalDateKey()
    ) {
      localStorage.removeItem(
        SESSION_STORAGE_KEY
      );

      return;
    }


    state.session =
      normalizeRestoredSession(
        parsed
      );


    if (
      state.session?.rest
    ) {
      renderRestTimer();

      state.restTimerId =
        window.setInterval(
          renderRestTimer,
          250
        );
    }

  } catch (error) {
    console.warn(
      "[ARI Training] Active workout could not restore.",
      error
    );
  }
}


function normalizeRestoredSession(
  session
) {
  return {
    ...session,

    pausedDurationMs:
      Number(
        session.pausedDurationMs
      ) || 0,

    currentExerciseIndex:
      Number(
        session.currentExerciseIndex
      ) || 0,

    heartRateReadings:
      Array.isArray(
        session.heartRateReadings
      )
        ? session.heartRateReadings
        : [],

    exercises:
      Array.isArray(
        session.exercises
      )
        ? session.exercises
        : []
  };
}


/* =====================================================
   SESSION HISTORY STORAGE
===================================================== */

function readSessionHistory() {
  try {
    const raw =
      localStorage.getItem(
        SESSION_HISTORY_KEY
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(
        raw
      );


    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {
    return [];
  }
}


function saveSessionHistoryRecord(
  record
) {
  try {
    const records =
      readSessionHistory();


    const existingIndex =
      records.findIndex(
        item =>
          item.id ===
          record.id
      );


    if (
      existingIndex >= 0
    ) {
      records[
        existingIndex
      ] =
        record;
    } else {
      records.push(
        record
      );
    }


    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(
        records
      )
    );

  } catch (error) {
    console.warn(
      "[ARI Training] Session history could not persist.",
      error
    );
  }
}


function saveLastPerformance(
  record
) {
  try {
    localStorage.setItem(
      LAST_PERFORMANCE_KEY,
      JSON.stringify(
        record
      )
    );
  } catch {
    // Non-critical.
  }
}


/* =====================================================
   LIVE CALORIE ESTIMATION
===================================================== */

function estimateLiveSessionCalories() {
  if (!state.session) {
    return 0;
  }


  let calories =
    0;


  for (
    const exercise
    of state.session.exercises
  ) {

    if (
      exercise.completionMode ===
      "sets"
    ) {
      calories +=
        exercise.sets.reduce(
          (
            sum,
            set
          ) =>
            sum +
            (
              set.completed
                ? Number(
                    set.estimatedCalories
                  ) || 0
                : 0
            ),
          0
        );

      continue;
    }


    if (
      exercise.completed
    ) {
      calories +=
        estimateLiveActivityCalories(
          exercise
        );
    }
  }


  return Math.max(
    0,
    Math.round(
      calories
    )
  );
}


function estimateLiveSetCalories(
  exercise,
  intensityOverride =
    null
) {
  const weightLb =
    state.profileWeightLb;


  if (!weightLb) {
    return 0;
  }


  const entry =
    exercise.originalEntry ||
    {};


  const minutesPerSet =
    normalizePositiveNumber(
      entry.minutesPerSet
    ) ||
    2.5;


  const intensity =
    normalizeCalorieIntensity(
      intensityOverride ||
      entry.intensity ||
      "moderate"
    );


  const estimate =
    CalorieCalculator
      .estimateStrengthSession({
        intensity,
        weightLb,
        durationMinutes:
          minutesPerSet
      });


  return Math.max(
    0,
    Math.round(
      estimate
        ?.roundedCalories ||
      0
    )
  );
}


function estimateLiveActivityCalories(
  exercise,
  intensityOverride =
    null
) {
  const weightLb =
    state.profileWeightLb;


  if (!weightLb) {
    return 0;
  }


  const entry =
    exercise.originalEntry ||
    {};


  const durationMinutes =
    normalizePositiveNumber(
      exercise.durationMinutes
    ) ||
    30;


  const estimate =
    WorkoutPlanController
      .estimateExerciseCalories({
        exerciseId:
          exercise.exerciseId,

        durationMinutes,

        weightLb,

        intensity:
          normalizeCalorieIntensity(
            intensityOverride ||
            entry.intensity ||
            "moderate"
          )
      });


  return Math.max(
    0,
    Math.round(
      estimate
        ?.roundedCalories ||
      0
    )
  );
}


/* =====================================================
   PROGRESS STORE FINALIZATION
===================================================== */

function finalizeDayCompletion(
  day
) {
  const dayState =
    state.plan
      ?.week
      ?.[day];


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
    )
      .map(
        entry => {
          const sets =
            Number(
              entry.sets
            );


          return {
            exerciseId:
              entry.exerciseId,

            requiredSets:
              Number.isInteger(
                sets
              ) &&
              sets > 0
                ? sets
                : null,

            completionMode:
              Number.isInteger(
                sets
              ) &&
              sets > 0
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


/* =====================================================
   WEEKLY PLAN
===================================================== */

function renderWeeklyPlan() {
  const container =
    elements.weeklyPlanList;


  if (!container) {
    return;
  }


  container.replaceChildren();


  const week =
    state.plan?.week;


  if (!week) {
    setHidden(
      elements.weeklyPlanEmpty,
      false
    );

    renderWeeklyTotals();

    return;
  }


  const hasAnyPlan =
    DAYS.some(
      day =>
        week[day]
    );


  setHidden(
    elements.weeklyPlanEmpty,
    hasAnyPlan
  );


  for (
    const day
    of DAYS
  ) {
    const dayState =
      week[day];


    if (!dayState) {
      continue;
    }


    container.appendChild(
      createWeeklyDayElement(
        day,
        dayState
      )
    );
  }


  renderWeeklyTotals();
}


function renderWeeklyTotals() {
  const weekSummary =
    WorkoutProgressStore
      .getWeekSummary();


  const scheduledDays =
    DAYS.filter(
      day =>
        state.plan
          ?.week
          ?.[day]
          ?.type !==
            "off"
    ).length;


  setText(
    elements.weeklyCompletedDays,
    String(
      weekSummary
        ?.completeDays ||
      0
    )
  );


  setText(
    elements.weeklyScheduledDays,
    String(
      scheduledDays
    )
  );


  setText(
    elements.weeklyCompletedSets,
    String(
      weekSummary
        ?.completedSets ||
      0
    )
  );


  setText(
    elements.weeklyRequiredSets,
    String(
      weekSummary
        ?.requiredSets ||
      0
    )
  );


  setText(
    elements.weeklyTrainingCalories,
    formatNumber(
      weekSummary
        ?.estimatedCalories ||
      0
    )
  );


  setText(
    elements.weeklyPlanSummaryStat,
    `${scheduledDays} ${pluralize(
      scheduledDays,
      "day",
      "days"
    )}`
  );
}


function createWeeklyDayElement(
  day,
  dayState
) {
  const template =
    elements.weeklyPlanDayTemplate;


  if (
    !template?.content
  ) {
    return createFallbackDay(
      day,
      dayState
    );
  }


  const fragment =
    template.content
      .cloneNode(true);


  const article =
    fragment.querySelector(
      ".ari-weekly-plan-day"
    );


  const button =
    fragment.querySelector(
      ".ari-weekly-plan-day__header"
    );


  const body =
    fragment.querySelector(
      ".ari-weekly-plan-day__body"
    );


  const exerciseList =
    fragment.querySelector(
      ".ari-weekly-plan-day__exercise-list"
    );


  const summary =
    WorkoutProgressStore
      .getDaySummary(
        day
      );


  article.dataset.day =
    day;


  article.dataset.status =
    dayState.type ===
      "off"
      ? "rest"
      : summary?.status ||
        "not_started";


  button.dataset.action =
    "toggle-day";


  button.dataset.day =
    day;


  setTextWithin(
    article,
    ".ari-weekly-plan-day__weekday",
    DAY_LABELS[day]
  );


  setTextWithin(
    article,
    ".ari-weekly-plan-day__title",
    dayState.title ||
    (
      dayState.type ===
        "off"
        ? "Off Day"
        : "Workout"
    )
  );


  setTextWithin(
    article,
    ".ari-weekly-plan-day__summary",
    dayState.type ===
      "off"
      ? "Recovery"
      : buildWeeklyDaySummary(
          dayState
        )
  );


  setTextWithin(
    article,
    ".ari-weekly-plan-day__calories",
    `${formatNumber(
      summary
        ?.estimatedCalories ||
      0
    )} kcal`
  );


  setTextWithin(
    article,
    ".ari-weekly-plan-day__status",
    getStatusLabel(
      dayState.type ===
        "off"
        ? "rest"
        : summary?.status
    )
  );


  if (
    dayState.type ===
    "off"
  ) {
    body.hidden =
      true;


    button.disabled =
      true;


    setTextWithin(
      article,
      ".ari-weekly-plan-day__set-progress",
      "Recovery day"
    );


    setTextWithin(
      article,
      ".ari-weekly-plan-day__calorie-total",
      "0 kcal"
    );


    return fragment;
  }


  for (
    const exerciseEntry
    of dayState.exercises ||
    []
  ) {
    exerciseList
      ?.appendChild(
        createPlannedExerciseElement(
          day,
          exerciseEntry
        )
      );
  }


  setTextWithin(
    article,
    ".ari-weekly-plan-day__set-progress",
    `${summary?.completedSets || 0}/${summary?.requiredSets || 0} sets`
  );


  setTextWithin(
    article,
    ".ari-weekly-plan-day__calorie-total",
    `${formatNumber(
      summary
        ?.estimatedCalories ||
      0
    )} kcal burned`
  );


  const isExpanded =
    state.expandedDays
      .has(day);


  body.hidden =
    !isExpanded;


  button.setAttribute(
    "aria-expanded",
    isExpanded
      ? "true"
      : "false"
  );


  return fragment;
}


function buildWeeklyDaySummary(
  dayState
) {
  const exercises =
    dayState.exercises ||
    [];


  const sets =
    countRequiredSets(
      exercises
    );


  const pieces = [
    `${exercises.length} ${pluralize(
      exercises.length,
      "exercise",
      "exercises"
    )}`
  ];


  if (
    sets > 0
  ) {
    pieces.push(
      `${sets} sets`
    );
  }


  return pieces.join(
    " · "
  );
}


function createFallbackDay(
  day,
  dayState
) {
  const article =
    document.createElement(
      "article"
    );


  article.className =
    "ari-weekly-plan-day";


  const summary =
    WorkoutProgressStore
      .getDaySummary(
        day
      );


  article.textContent =
    `${DAY_LABELS[day]} — ` +
    `${dayState.title || "Workout"} — ` +
    `${getStatusLabel(summary?.status)}`;


  return article;
}


/* =====================================================
   WEEKLY EXERCISE DISPLAY
===================================================== */

function createPlannedExerciseElement(
  day,
  exerciseEntry
) {
  const exercise =
    ExerciseRegistry.get(
      exerciseEntry.exerciseId
    );


  const template =
    elements.plannedExerciseTemplate;


  if (
    !template?.content
  ) {
    return document.createTextNode(
      exercise?.name ||
      exerciseEntry.exerciseId ||
      "Exercise"
    );
  }


  const fragment =
    template.content
      .cloneNode(true);


  const article =
    fragment.querySelector(
      ".ari-planned-exercise"
    );


  const setContainer =
    fragment.querySelector(
      ".ari-planned-exercise__sets"
    );


  const singleLabel =
    fragment.querySelector(
      ".ari-planned-exercise__single-complete"
    );


  const progress =
    WorkoutProgressStore
      .getExerciseProgress(
        day,
        exerciseEntry.exerciseId
      );


  article.dataset.day =
    day;


  article.dataset.exerciseId =
    exerciseEntry.exerciseId;


  setTextWithin(
    article,
    ".ari-planned-exercise__type",
    getExerciseTypeLabel(
      exercise
    )
  );


  setTextWithin(
    article,
    ".ari-planned-exercise__name",
    exercise?.name ||
    titleFromId(
      exerciseEntry.exerciseId
    )
  );


  setTextWithin(
    article,
    ".ari-planned-exercise__prescription",
    getExercisePrescription(
      exerciseEntry
    )
  );


  const requiredSets =
    normalizeRequiredSets(
      exerciseEntry
    );


  /*
   * Weekly summary is now read-only.
   * No checkboxes are rendered here.
   *
   * Actual completion happens in Today's Training.
   */
  if (
    requiredSets > 0
  ) {
    singleLabel?.remove();


    for (
      let setNumber = 1;
      setNumber <=
        requiredSets;
      setNumber += 1
    ) {
      const record =
        normalizeProgressSetRecord(
          progress
            ?.completedSets
            ?.[String(setNumber)]
        );


      const row =
        document.createElement(
          "div"
        );


      row.className =
        "ari-planned-set ari-planned-set--summary";


      if (
        record.completed
      ) {
        row.classList.add(
          "is-complete"
        );
      }


      row.textContent =
        `Set ${setNumber} · ` +
        `${getSetPrescription(
          exerciseEntry
        ) || "Planned"}`;


      setContainer
        ?.appendChild(
          row
        );
    }

  } else {

    setContainer
      ?.replaceChildren();


    if (singleLabel) {
      const checkbox =
        singleLabel.querySelector(
          "input"
        );


      if (checkbox) {
        checkbox.disabled =
          true;


        checkbox.checked =
          Boolean(
            progress?.completed
          );
      }
    }
  }


  const summary =
    WorkoutProgressStore
      .getExerciseSummary(
        day,
        exerciseEntry.exerciseId
      );


  setTextWithin(
    article,
    ".ari-planned-exercise__calories",
    `${formatNumber(
      summary
        ?.estimatedCalories ||
      0
    )} kcal`
  );


  return fragment;
}


/* =====================================================
   WEEKLY CLICK
===================================================== */

function handleWeeklyPlanClick(
  event
) {
  const button =
    event.target.closest(
      '[data-action="toggle-day"]'
    );


  if (!button) {
    return;
  }


  const article =
    button.closest(
      ".ari-weekly-plan-day"
    );


  const body =
    article
      ?.querySelector(
        ".ari-weekly-plan-day__body"
      );


  if (!body) {
    return;
  }


  const day =
    button.dataset.day;


  const expanding =
    body.hidden;


  body.hidden =
    !expanding;


  button.setAttribute(
    "aria-expanded",
    expanding
      ? "true"
      : "false"
  );


  if (day) {
    if (expanding) {
      state.expandedDays
        .add(day);
    } else {
      state.expandedDays
        .delete(day);
    }
  }
}


/* =====================================================
   TRAINING PROFILE
===================================================== */

async function loadTrainingProfile() {
  const local =
    readLocalTrainingProfile();


  let cloud =
    null;


  try {
    if (
      window.calbuddySupabase &&
      typeof window
        .calbuddySupabase
        .from === "function"
    ) {
      const authResult =
        await window
          .calbuddySupabase
          .auth
          ?.getUser?.();


      const user =
        authResult
          ?.data
          ?.user;


      if (
        user?.id
      ) {
        const {
          data,
          error
        } =
          await window
            .calbuddySupabase
            .from(
              "profiles"
            )
            .select(
              "age, weight_lbs, resting_heart_rate, confirmed_max_heart_rate"
            )
            .eq(
              "id",
              user.id
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
    }
  } catch (error) {
    console.warn(
      "[ARI Training] Could not load training profile from Supabase.",
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
      cloud
        ?.resting_heart_rate ??
      local
        .restingHeartRate
    );


  state.profileConfirmedMaxHeartRate =
    normalizeHeartRate(
      cloud
        ?.confirmed_max_heart_rate ??
      local
        .confirmedMaxHeartRate
    );


  state.profileEstimatedMaxHeartRate =
    HeartRateIntensity
      .estimateMaxHeartRate({
        age:
          state.profileAge
      });


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


function renderTrainingProfile() {
  setText(
    elements.trainingProfileWeight,
    state.profileWeightLb
      ? `${formatProfileNumber(
          state.profileWeightLb
        )} lb`
      : "—"
  );


  setText(
    elements.trainingProfileRestingHeartRate,
    state.profileRestingHeartRate
      ? `${Math.round(
          state.profileRestingHeartRate
        )} bpm`
      : "—"
  );


  setText(
    elements.trainingProfileMaxHeartRate,
    state.profileEffectiveMaxHeartRate
      ? `${Math.round(
          state.profileEffectiveMaxHeartRate
        )} bpm`
      : "—"
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


/* =====================================================
   TODAY'S PERFORMANCE
===================================================== */

function renderOverview() {
  const today =
    getLocalDateKey();


  const sessions =
    readSessionHistory()
      .filter(
        record =>
          record.localDate ===
          today
      );


  const calories =
    sessions.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.calories
          ) || 0
        ),
      0
    );


  const minutes =
    sessions.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.minutes
          ) || 0
        ),
      0
    );


  const sets =
    sessions.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.completedSets
          ) || 0
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
    formatDuration(
      minutes
    )
  );


  setText(
    elements.trainingWorkoutCount,
    String(
      sessions.length
    )
  );


  setText(
    elements.trainingSetsCompleted,
    String(
      sets
    )
  );


  setText(
    elements.trainingPerformanceSummaryStat,
    `${formatNumber(
      calories
    )} kcal`
  );


  const hrSessions =
    sessions.filter(
      record =>
        normalizeHeartRate(
          record.averageHeartRate
        )
    );


  if (
    hrSessions.length ===
    0
  ) {
    setHidden(
      elements.trainingHeartRatePerformance,
      true
    );

    return;
  }


  const averageHr =
    Math.round(
      hrSessions.reduce(
        (
          total,
          record
        ) =>
          total +
          Number(
            record.averageHeartRate
          ),
        0
      ) /
      hrSessions.length
    );


  const peakHr =
    Math.max(
      ...hrSessions.map(
        record =>
          Number(
            record.peakHeartRate ||
            record.averageHeartRate
          )
      )
    );


  const latest =
    hrSessions[
      hrSessions.length -
      1
    ];


  setHidden(
    elements.trainingHeartRatePerformance,
    false
  );


  setText(
    elements.trainingAverageHeartRate,
    `${averageHr} bpm`
  );


  setText(
    elements.trainingPeakHeartRate,
    `${peakHr} bpm`
  );


  setText(
    elements.trainingIntensityLabel,
    titleFromId(
      latest.intensity ||
      latest.selectedIntensity ||
      "moderate"
    )
  );
}


/* =====================================================
   MONTHLY HISTORY
===================================================== */

function renderMonthlyHistory() {
  const monthKey =
    getMonthKey();


  const monthLabel =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month:
          "long",

        year:
          "numeric"
      }
    )
    .format(
      new Date()
    );


  setText(
    elements.trainingHistoryMonthLabel,
    monthLabel
  );


  const records =
    getCurrentMonthSessions(
      monthKey
    );


  const workoutCount =
    records.length;


  const calories =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.calories
          ) || 0
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
            record.completedSets
          ) || 0
        ),
      0
    );


  const minutes =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.minutes
          ) || 0
        ),
      0
    );


  setText(
    elements.monthlyWorkoutCount,
    String(
      workoutCount
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
      workoutCount
    )
  );


  setText(
    elements.monthlyTrainingTime,
    formatDuration(
      minutes
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


  const list =
    elements.monthlyHistoryList;


  if (!list) {
    return;
  }


  list.replaceChildren();


  const grouped =
    groupHistoryByDate(
      records
    );


  for (
    const group
    of grouped
  ) {
    list.appendChild(
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


function getCurrentMonthSessions(
  monthKey
) {
  return readSessionHistory()
    .filter(
      record =>
        record.monthKey ===
        monthKey
    )
    .sort(
      (a, b) =>
        String(
          b.completedAt ||
          b.localDate
        )
        .localeCompare(
          String(
            a.completedAt ||
            a.localDate
          )
        )
    );
}


function groupHistoryByDate(
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
        record.localDate
      )
    ) {
      map.set(
        record.localDate,
        []
      );
    }


    map.get(
      record.localDate
    )
    .push(
      record
    );
  }


  return Array
    .from(
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
      (a, b) =>
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


  if (
    !template?.content
  ) {
    return document
      .createTextNode(
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


  const totalCalories =
    group.entries.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          Number(
            record.calories
          ) || 0
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
    formatDateKey(
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
      totalCalories
    )} kcal`
  );


  const entriesContainer =
    details.querySelector(
      ".ari-history-day__entries"
    );


  for (
    const record
    of group.entries
  ) {
    entriesContainer
      ?.appendChild(
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


  if (
    !template?.content
  ) {
    return document
      .createTextNode(
        record.title
      );
  }


  const fragment =
    template.content
      .cloneNode(true);


  const article =
    fragment.querySelector(
      ".ari-history-workout"
    );


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
    `${record.completedSets || 0} sets`
  );


  setTextWithin(
    article,
    ".ari-history-workout__duration",
    formatDuration(
      record.minutes ||
      0
    )
  );


  setTextWithin(
    article,
    ".ari-history-workout__calories",
    `${formatNumber(
      record.calories ||
      0
    )} kcal`
  );


  return fragment;
}


/* =====================================================
   SESSION TIMER
===================================================== */

function startRuntimeTimers() {
  if (
    state.sessionTimerId
  ) {
    clearInterval(
      state.sessionTimerId
    );
  }


  state.sessionTimerId =
    window.setInterval(
      () => {
        if (
          state.session &&
          state.session.status !==
            "completed"
        ) {
          renderSessionMetrics();
        }
      },
      1000
    );
}


function getSessionElapsedMs(
  session =
    state.session,
  forceComplete =
    false
) {
  if (
    !session?.startedAt
  ) {
    return 0;
  }


  const started =
    Date.parse(
      session.startedAt
    );


  if (
    !Number.isFinite(
      started
    )
  ) {
    return 0;
  }


  let end =
    Date.now();


  if (
    forceComplete &&
    session.completedAt
  ) {
    const completed =
      Date.parse(
        session.completedAt
      );


    if (
      Number.isFinite(
        completed
      )
    ) {
      end =
        completed;
    }
  }


  let pausedDuration =
    Number(
      session.pausedDurationMs
    ) || 0;


  if (
    session.status ===
      "paused" &&
    session.pausedAt
  ) {
    const pausedAt =
      Date.parse(
        session.pausedAt
      );


    if (
      Number.isFinite(
        pausedAt
      )
    ) {
      pausedDuration +=
        Math.max(
          0,
          end -
          pausedAt
        );
    }
  }


  return Math.max(
    0,
    end -
    started -
    pausedDuration
  );
}


/* =====================================================
   SESSION STATS
===================================================== */

function getSessionSetStats(
  session =
    state.session
) {
  if (!session) {
    return {
      completed:
        0,

      required:
        0
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
      exercise.completionMode ===
      "sets"
    ) {
      required +=
        exercise.requiredSets ||
        0;


      completed +=
        exercise.sets
          ?.filter(
            set =>
              set.completed
          )
          .length ||
        0;

      continue;
    }


    required +=
      1;


    if (
      exercise.completed
    ) {
      completed +=
        1;
    }
  }


  return {
    completed,
    required
  };
}


function getSessionHeartRateStats(
  session
) {
  const readings =
    session
      ?.heartRateReadings ||
    [];


  const values =
    readings
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
      average:
        null,

      peak:
        null,

      count:
        0
    };
  }


  return {
    average:
      Math.round(
        values.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        ) /
        values.length
      ),

    peak:
      Math.max(
        ...values
      ),

    count:
      values.length
  };
}


function updateExerciseCompletion(
  exercise
) {
  if (
    exercise.completionMode !==
    "sets"
  ) {
    return;
  }


  exercise.completed =
    exercise.sets
      .every(
        set =>
          set.completed
      );


  if (
    exercise.completed &&
    !exercise.completedAt
  ) {
    exercise.completedAt =
      new Date()
        .toISOString();
  }
}


/* =====================================================
   PLAN ESTIMATION
===================================================== */

function countRequiredSets(
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


function estimatePlannedTrainingMinutes(
  dayState
) {
  if (
    !dayState ||
    dayState.type ===
      "off"
  ) {
    return 0;
  }


  let minutes =
    0;


  for (
    const entry
    of dayState.exercises ||
    []
  ) {
    const sets =
      normalizeRequiredSets(
        entry
      );


    if (
      sets > 0
    ) {
      const minutesPerSet =
        normalizePositiveNumber(
          entry.minutesPerSet
        ) ||
        2.5;


      minutes +=
        sets *
        minutesPerSet;

      continue;
    }


    minutes +=
      normalizePositiveNumber(
        entry.durationMinutes
      ) ||
      30;
  }


  return Math.round(
    minutes
  );
}


function buildTodayMeta(
  exerciseCount,
  setCount,
  estimatedMinutes
) {
  const pieces = [];


  pieces.push(
    `${exerciseCount} ${pluralize(
      exerciseCount,
      "exercise",
      "exercises"
    )}`
  );


  if (
    setCount > 0
  ) {
    pieces.push(
      `${setCount} planned sets`
    );
  }


  if (
    estimatedMinutes > 0
  ) {
    pieces.push(
      `about ${formatDuration(
        estimatedMinutes
      )}`
    );
  }


  return pieces.join(
    " · "
  );
}


/* =====================================================
   REST TIME HELPERS
===================================================== */

function getExerciseRestSeconds(
  exercise
) {
  const entry =
    exercise.originalEntry ||
    {};


  const direct =
    Number(
      entry.restSeconds ??
      entry.rest_seconds ??
      entry.rest
    );


  if (
    Number.isFinite(
      direct
    ) &&
    direct >= 0
  ) {
    return Math.round(
      direct
    );
  }


  return DEFAULT_REST_SECONDS;
}


/* =====================================================
   PROFILE NORMALIZATION
===================================================== */

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


function normalizeWeight(
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
    number >= 50 &&
    number <= 1000
  )
    ? Math.round(
        number * 10
      ) /
      10
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


function normalizeNonNegativeNumber(
  value
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
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


  return number === null
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


  switch (
    normalized
  ) {
    case "easy":
    case "light":
    case "low":
      return "light";

    case "hard":
    case "vigorous":
    case "high":
      return "vigorous";

    case "very_hard":
    case "very-hard":
    case "very hard":
    case "max":
      return "vigorous";

    default:
      return "moderate";
  }
}


/* =====================================================
   DATE HELPERS
===================================================== */

function getCurrentWeekdayId() {
  const day =
    new Date()
      .getDay();


  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ][day];
}


function getCurrentWeekKey() {
  const dates =
    getCurrentWeekDates();


  return dates.monday;
}


function getCurrentWeekDates() {
  const now =
    new Date();


  const start =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


  const day =
    start.getDay();


  const offset =
    day === 0
      ? 6
      : day - 1;


  start.setDate(
    start.getDate() -
    offset
  );


  const result = {};


  DAYS.forEach(
    (
      weekday,
      index
    ) => {
      const date =
        new Date(
          start
        );


      date.setDate(
        start.getDate() +
        index
      );


      result[
        weekday
      ] =
        getLocalDateKey(
          date
        );
    }
  );


  return result;
}


function getMonthKey(
  date =
    new Date()
) {
  return (
    `${date.getFullYear()}-` +
    `${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`
  );
}


function getLocalDateKey(
  date =
    new Date()
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


function setCurrentDateDisplay() {
  const now =
    new Date();


  if (
    elements.trainingCurrentDate
  ) {
    elements
      .trainingCurrentDate
      .dateTime =
        getLocalDateKey(
          now
        );


    elements
      .trainingCurrentDate
      .textContent =
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday:
              "long",

            month:
              "short",

            day:
              "numeric"
          }
        )
        .format(
          now
        );
  }


  setTodayDate();
}


/* =====================================================
   UI HELPERS
===================================================== */

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


  elements.trainingMenuButton
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


  elements.trainingMenuButton
    .setAttribute(
      "aria-expanded",
      "false"
    );
}


function getStatusLabel(
  status
) {
  switch (
    status
  ) {
    case "complete":
      return "COMPLETE";

    case "in_progress":
      return "IN PROGRESS";

    case "rest":
      return "REST DAY";

    case "paused":
      return "PAUSED";

    default:
      return "NOT STARTED";
  }
}


function getExerciseTypeLabel(
  exercise
) {
  const type =
    exercise
      ?.exerciseTypes
      ?.[0] ||
    exercise
      ?.category;


  return type
    ? titleFromId(
        type
      )
    : "Exercise";
}


function getExercisePrescription(
  entry
) {
  const pieces = [];


  if (
    Number(
      entry.sets
    ) > 0
  ) {
    pieces.push(
      `${entry.sets} sets`
    );
  }


  if (
    Number(
      entry.reps
    ) > 0
  ) {
    pieces.push(
      `${entry.reps} reps`
    );
  }


  if (
    Number(
      entry.durationMinutes
    ) > 0
  ) {
    pieces.push(
      `${entry.durationMinutes} min`
    );
  }


  if (
    Number(
      entry.durationSeconds
    ) > 0
  ) {
    pieces.push(
      `${entry.durationSeconds} sec`
    );
  }


  if (
    Number(
      entry.distance
    ) > 0
  ) {
    pieces.push(
      `${entry.distance} distance`
    );
  }


  return (
    pieces.join(
      " · "
    ) ||
    "Complete activity"
  );
}


function getSetPrescription(
  entry
) {
  const pieces = [];


  if (
    Number(
      entry.reps
    ) > 0
  ) {
    pieces.push(
      `${entry.reps} reps`
    );
  }


  if (
    Number(
      entry.weight
    ) > 0
  ) {
    pieces.push(
      `${entry.weight} lb`
    );
  }


  if (
    Number(
      entry.added_weight
    ) > 0
  ) {
    pieces.push(
      `+${entry.added_weight} lb`
    );
  }


  if (
    Number(
      entry.durationSeconds
    ) > 0
  ) {
    pieces.push(
      `${entry.durationSeconds} sec`
    );
  }


  return pieces.join(
    " · "
  );
}


function buildSetTargetLabel(
  set
) {
  const pieces = [];


  if (
    set.targetWeight !==
    null &&
    set.targetWeight !==
    undefined
  ) {
    pieces.push(
      `${set.targetWeight} lb`
    );
  }


  if (
    set.targetReps !==
    null &&
    set.targetReps !==
    undefined
  ) {
    pieces.push(
      `${set.targetReps} reps`
    );
  }


  return (
    pieces.join(
      " × "
    ) ||
    "Planned set"
  );
}


function buildCompletedSetSummary(
  set
) {
  const pieces = [
    `Set ${set.setNumber}`
  ];


  if (
    set.actualWeight !==
    null &&
    set.actualWeight !==
    undefined
  ) {
    pieces.push(
      `${set.actualWeight} lb`
    );
  }


  if (
    set.actualReps !==
    null &&
    set.actualReps !==
    undefined
  ) {
    pieces.push(
      `${set.actualReps} reps`
    );
  }


  pieces.push(
    "✓"
  );


  return pieces.join(
    " · "
  );
}


function buildSetTargetSummary(
  set
) {
  return (
    `Set ${set.setNumber} · ` +
    buildSetTargetLabel(
      set
    )
  );
}


function normalizeProgressSetRecord(
  value
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return {
      completed:
        value,

      estimatedCalories:
        0
    };
  }


  if (
    value &&
    typeof value ===
      "object"
  ) {
    return {
      completed:
        Boolean(
          value.completed
        ),

      estimatedCalories:
        Number(
          value.estimatedCalories
        ) || 0
    };
  }


  return {
    completed:
      false,

    estimatedCalories:
      0
  };
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
    root
      ?.querySelector(
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
      hidden;
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
        char
          .toUpperCase()
    );
}


function formatNumber(
  value
) {
  return new Intl
    .NumberFormat(
      "en-US",
      {
        maximumFractionDigits:
          0
      }
    )
    .format(
      Math.round(
        Number(
          value
        ) || 0
      )
    );
}


function formatProfileNumber(
  value
) {
  return new Intl
    .NumberFormat(
      "en-US",
      {
        maximumFractionDigits:
          1
      }
    )
    .format(
      Number(
        value
      )
    );
}


function formatDuration(
  totalMinutes
) {
  const minutes =
    Math.max(
      0,
      Math.round(
        Number(
          totalMinutes
        ) || 0
      )
    );


  const hours =
    Math.floor(
      minutes /
      60
    );


  const remainder =
    minutes %
    60;


  if (
    hours === 0
  ) {
    return `${remainder}m`;
  }


  if (
    remainder === 0
  ) {
    return `${hours}h`;
  }


  return `${hours}h ${remainder}m`;
}


function formatDurationFromMs(
  milliseconds
) {
  return formatDuration(
    Math.max(
      0,
      milliseconds /
      60000
    )
  );
}


function formatElapsedTime(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        milliseconds /
        1000
      )
    );


  const hours =
    Math.floor(
      totalSeconds /
      3600
    );


  const minutes =
    Math.floor(
      (
        totalSeconds %
        3600
      ) /
      60
    );


  const seconds =
    totalSeconds %
    60;


  if (
    hours > 0
  ) {
    return (
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );
  }


  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}


function formatCountdown(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.ceil(
        milliseconds /
        1000
      )
    );


  const minutes =
    Math.floor(
      totalSeconds /
      60
    );


  const seconds =
    totalSeconds %
    60;


  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}


function pluralize(
  count,
  singular,
  plural
) {
  return count === 1
    ? singular
    : plural;
}


function formatDateKey(
  dateKey
) {
  const [
    year,
    month,
    day
  ] =
    String(
      dateKey
    )
      .split("-")
      .map(
        Number
      );


  return new Intl
    .DateTimeFormat(
      "en-US",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric"
      }
    )
    .format(
      new Date(
        year,
        month - 1,
        day
      )
    );
}


function getRelativeDateLabel(
  dateKey
) {
  if (
    dateKey ===
    getLocalDateKey()
  ) {
    return "Today";
  }


  const [
    year,
    month,
    day
  ] =
    String(
      dateKey
    )
      .split("-")
      .map(
        Number
      );


  return new Intl
    .DateTimeFormat(
      "en-US",
      {
        weekday:
          "long"
      }
    )
    .format(
      new Date(
        year,
        month - 1,
        day
      )
    );
}


/* =====================================================
   STORAGE HELPERS
===================================================== */

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


/* =====================================================
   SESSION HELPERS
===================================================== */

function createSessionId() {
  return (
    `ari_session_` +
    `${Date.now()}_` +
    `${Math.random()
      .toString(36)
      .slice(2, 9)}`
  );
}


/* =====================================================
   GLOBAL API
===================================================== */

function publishGlobal() {
  const runtime = {
    version:
      VERSION,

    source:
      SOURCE,

    initialize,

    refresh,

    startWorkout:
      startTodayWorkout,

    pauseWorkout,

    resumeWorkout,

    finishWorkout:
      openWorkoutCompletion,

    saveWorkout:
      completeAndSaveWorkout,

    getPlan:
      () =>
        state.plan,

    getActiveSession:
      () =>
        state.session
          ? structuredCloneSafe(
              state.session
            )
          : null,

    getProgress:
      () =>
        WorkoutProgressStore
          .getState(),

    getTodaySummary:
      () =>
        WorkoutProgressStore
          .getDaySummary(
            state.currentDay
          ),

    getWeekSummary:
      () =>
        WorkoutProgressStore
          .getWeekSummary(),

    getCurrentMonthHistory:
      () =>
        getCurrentMonthSessions(
          state.currentMonthKey
        ),

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


function structuredCloneSafe(
  value
) {
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
    // Fallback below.
  }


  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


/* =====================================================
   STARTUP
===================================================== */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    {
      once:
        true
    }
  );

} else {

  initialize();
}


/* =====================================================
   EXPORTS
===================================================== */

export {
  VERSION,
  SOURCE,
  initialize,
  refresh
};