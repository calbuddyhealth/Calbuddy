// =====================================================
// ARI REBIRTH
// File: js/ari-training.js
// Version: 2.1.0
// Purpose:
//   Summary + execution controller for ari-training.html.
//
// V2.0.0 architecture:
//   - ari-training.html is no longer a manual workout logger.
//   - Loads the user's current weekly workout plan.
//   - Shows today's training overview.
//   - Shows Monday-Sunday weekly plan summary.
//   - Lets users check off individual prescribed sets.
//   - Automatically marks a training day COMPLETE when all
//     required work for that day is complete.
//   - Shows estimated calories for each completed set/activity.
//   - Tracks current-month training history.
//   - Monthly history view starts fresh on the 1st of each month.
//   - Training calories NEVER modify Nutrition calories left.
//
// Data:
//   workout-plan-controller.js      -> plan definition
//   workout-progress-store.js       -> completion state
//   exercise-registry.js            -> exercise metadata
//   calorie-calculator.js           -> calorie estimation
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

const VERSION = "2.1.0";
const SOURCE = "js/ari-training";

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

  averageWorkoutHeartRate: null,
  heartRateIntensity: null,

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

  setCurrentDateDisplay();

  state.currentDay =
    getCurrentWeekdayId();

  state.currentMonthKey =
    getMonthKey();

  await loadTrainingProfile();

  loadStoredAverageHeartRate();

  WorkoutProgressStore.hydrate();

  await WorkoutPlanController.init();

  state.plan =
    WorkoutPlanController.getPlan();

  syncProgressWithPlan();

  state.unsubscribePlan =
    WorkoutPlanController.subscribe(() => {
      state.plan =
        WorkoutPlanController.getPlan();

      syncProgressWithPlan();
      renderAll();
    });

  state.unsubscribeProgress =
    WorkoutProgressStore.subscribe(() => {
      renderAll();
    });

  renderAll();

  state.initialized =
    true;

  publishGlobal();

  console.info(
    `[ARI Training] Summary runtime initialized. Version ${VERSION}.`
  );
}

function cacheElements() {
  const ids = [
    "trainingMenuButton",
    "trainingMenu",
    "trainingCurrentDate",

    "trainingCaloriesBurned",
    "trainingWorkoutTime",
    "trainingWorkoutCount",
    "trainingSetsCompleted",

    "trainingProfilePanel",
    "trainingProfileSource",
    "trainingProfileWeight",
    "trainingProfileRestingHeartRate",
    "trainingProfileMaxHeartRate",
    "trainingProfileMaxHeartRateSource",
    "trainingAverageHeartRate",
    "trainingHeartRateIntensity",
    "trainingHeartRateIntensityLabel",
    "trainingHeartRateIntensityDetail",

    "todayPlannedWorkout",
    "todayPlannedWorkoutTitle",
    "todayPlannedWorkoutStatus",
    "todayPlannedWorkoutSummary",
    "todayPlannedWorkoutProgress",
    "todayCompletedSets",
    "todayRequiredSets",

    "weeklyCompletedDays",
    "weeklyScheduledDays",
    "weeklyCompletedSets",
    "weeklyRequiredSets",
    "weeklyTrainingCalories",
    "weeklyPlanList",
    "weeklyPlanEmpty",

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
        if (
          event.target.closest("a")
        ) {
          closeTrainingMenu();
        }
      }
    );

  elements.weeklyPlanList
    ?.addEventListener(
      "click",
      handleWeeklyPlanClick
    );

  elements.weeklyPlanList
    ?.addEventListener(
      "change",
      handleWeeklyPlanChange
    );

  elements.trainingAverageHeartRate
    ?.addEventListener(
      "input",
      handleAverageHeartRateChange
    );

  elements.trainingAverageHeartRate
    ?.addEventListener(
      "change",
      handleAverageHeartRateChange
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
   PLAN + PROGRESS
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

  const weekKey =
    getCurrentWeekKey();

  /*
   * Progress is week-specific.
   * Starting a new calendar week gives the new week's plan
   * a fresh execution state.
   */
  WorkoutProgressStore.setPlanContext({
    planKey:
      plan.planId ||
      plan.metadata
        ?.sourceTemplateId ||
      "local-plan",

    weekKey,

    resetIfChanged:
      true
  });

  WorkoutProgressStore
    .syncWeekWithPlan(
      plan.week
    );
}

async function refresh() {
  state.currentDay =
    getCurrentWeekdayId();

  state.currentMonthKey =
    getMonthKey();

  await loadTrainingProfile();

  loadStoredAverageHeartRate();

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

  setCurrentDateDisplay();
  renderAll();
}

/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {
  renderTrainingProfile();
  renderOverview();
  renderTodayPlan();
  renderWeeklyPlan();
  renderMonthlyHistory();
}

/* =====================================================
   OVERVIEW
===================================================== */

function renderOverview() {
  const todaySummary =
    WorkoutProgressStore
      .getDaySummary(
        state.currentDay
      );

  const todayDay =
    state.plan
      ?.week
      ?.[state.currentDay];

  const todayMinutes =
    estimateCompletedTrainingMinutes(
      todayDay,
      state.currentDay
    );

  const todayWorkoutCount =
    todaySummary?.status ===
      "complete"
      ? 1
      : 0;

  setText(
    elements.trainingCaloriesBurned,
    formatNumber(
      todaySummary
        ?.estimatedCalories ||
      0
    )
  );

  setText(
    elements.trainingWorkoutTime,
    formatDuration(
      todayMinutes
    )
  );

  setText(
    elements.trainingWorkoutCount,
    String(
      todayWorkoutCount
    )
  );

  setText(
    elements.trainingSetsCompleted,
    String(
      todaySummary
        ?.completedSets ||
      countCompletedSingleActivities(
        state.currentDay
      )
    )
  );
}

function renderTodayPlan() {
  const day =
    state.plan
      ?.week
      ?.[state.currentDay];

  const summary =
    WorkoutProgressStore
      .getDaySummary(
        state.currentDay
      );

  if (!day) {
    setText(
      elements.todayPlannedWorkoutTitle,
      "No workout scheduled"
    );

    setText(
      elements.todayPlannedWorkoutSummary,
      "Your scheduled training for today will appear here."
    );

    setDayStatusElement(
      elements.todayPlannedWorkoutStatus,
      "not_started"
    );

    setText(
      elements.todayCompletedSets,
      "0"
    );

    setText(
      elements.todayRequiredSets,
      "0"
    );

    return;
  }

  setText(
    elements.todayPlannedWorkoutTitle,
    day.title ||
    DAY_LABELS[
      state.currentDay
    ]
  );

  if (
    day.type ===
      "off"
  ) {
    setText(
      elements.todayPlannedWorkoutSummary,
      "Scheduled recovery day."
    );

    setDayStatusElement(
      elements.todayPlannedWorkoutStatus,
      "rest"
    );

    setText(
      elements.todayCompletedSets,
      "0"
    );

    setText(
      elements.todayRequiredSets,
      "0"
    );

    return;
  }

  const exerciseCount =
    day.exercises
      ?.length ||
    0;

  setText(
    elements.todayPlannedWorkoutSummary,
    `${exerciseCount} ${pluralize(exerciseCount, "exercise", "exercises")} scheduled.`
  );

  setDayStatusElement(
    elements.todayPlannedWorkoutStatus,
    summary?.status ||
    "not_started"
  );

  setText(
    elements.todayCompletedSets,
    String(
      summary?.completedSets ||
      0
    )
  );

  setText(
    elements.todayRequiredSets,
    String(
      summary?.requiredSets ||
      0
    )
  );
}

/* =====================================================
   WEEKLY PLAN
===================================================== */

function renderWeeklyPlan() {
  if (
    !elements.weeklyPlanList
  ) {
    return;
  }

  elements.weeklyPlanList
    .replaceChildren();

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

    elements.weeklyPlanList
      .appendChild(
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
}

function createWeeklyDayElement(
  day,
  dayState
) {
  const template =
    elements
      .weeklyPlanDayTemplate;

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
      .getDaySummary(day);

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
    ".ari-weekly-plan-day__calories",
    `${formatNumber(summary?.estimatedCalories || 0)} kcal`
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
    `${formatNumber(summary?.estimatedCalories || 0)} kcal burned`
  );

  /*
   * Today's day opens automatically.
   */
  if (
    day ===
      state.currentDay
  ) {
    body.hidden =
      false;

    button.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  return fragment;
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
      .getDaySummary(day);

  article.textContent =
    `${DAY_LABELS[day]} â ${dayState.title || "Workout"} â ${getStatusLabel(summary?.status)}`;

  return article;
}

/* =====================================================
   EXERCISES + SETS
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
    elements
      .plannedExerciseTemplate;

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

  const progress =
    WorkoutProgressStore
      .getExerciseProgress(
        day,
        exerciseEntry.exerciseId
      );

  const requiredSets =
    Number(
      exerciseEntry.sets
    );

  if (
    Number.isInteger(
      requiredSets
    ) &&
    requiredSets > 0
  ) {
    singleLabel.hidden =
      true;

    for (
      let setNumber = 1;
      setNumber <=
        requiredSets;
      setNumber += 1
    ) {
      setContainer
        .appendChild(
          createSetElement({
            day,
            exerciseEntry,
            exercise,
            setNumber,
            requiredSets,
            progress
          })
        );
    }
  } else {
    setContainer
      .replaceChildren();

    singleLabel.hidden =
      false;

    const checkbox =
      singleLabel.querySelector(
        ".ari-planned-exercise__complete-checkbox"
      );

    const singleCalories =
      singleLabel.querySelector(
        ".ari-planned-exercise__single-calories"
      );

    checkbox.dataset.day =
      day;

    checkbox.dataset.exerciseId =
      exerciseEntry.exerciseId;

    checkbox.dataset.action =
      "complete-activity";

    checkbox.checked =
      Boolean(
        progress?.completed
      );

    const estimatedCalories =
      progress?.completed
        ? progress
            .estimatedCalories ||
          0
        : estimateActivityCalories(
            exerciseEntry,
            exercise
          );

    singleCalories.textContent =
      `${formatNumber(estimatedCalories)} kcal`;
  }

  const exerciseSummary =
    WorkoutProgressStore
      .getExerciseSummary(
        day,
        exerciseEntry.exerciseId
      );

  setTextWithin(
    article,
    ".ari-planned-exercise__calories",
    `${formatNumber(exerciseSummary?.estimatedCalories || 0)} kcal`
  );

  return fragment;
}

function createSetElement({
  day,
  exerciseEntry,
  exercise,
  setNumber,
  requiredSets,
  progress
}) {
  const template =
    elements
      .plannedSetTemplate;

  const fragment =
    template.content
      .cloneNode(true);

  const label =
    fragment.querySelector(
      ".ari-planned-set"
    );

  const checkbox =
    fragment.querySelector(
      ".ari-planned-set__checkbox"
    );

  const setRecord =
    normalizeProgressSetRecord(
      progress
        ?.completedSets
        ?.[String(setNumber)]
    );

  const estimatedSetCalories =
    setRecord.completed
      ? setRecord
          .estimatedCalories
      : estimateSetCalories({
          exerciseEntry,
          exercise,
          requiredSets
        });

  label.dataset.day =
    day;

  label.dataset.exerciseId =
    exerciseEntry.exerciseId;

  label.dataset.setNumber =
    String(
      setNumber
    );

  checkbox.dataset.action =
    "complete-set";

  checkbox.dataset.day =
    day;

  checkbox.dataset.exerciseId =
    exerciseEntry.exerciseId;

  checkbox.dataset.setNumber =
    String(
      setNumber
    );

  checkbox.dataset.requiredSets =
    String(
      requiredSets
    );

  checkbox.dataset.estimatedCalories =
    String(
      estimatedSetCalories
    );

  checkbox.checked =
    Boolean(
      setRecord.completed
    );

  setTextWithin(
    label,
    ".ari-planned-set__label",
    `Set ${setNumber}`
  );

  setTextWithin(
    label,
    ".ari-planned-set__prescription",
    getSetPrescription(
      exerciseEntry
    )
  );

  setTextWithin(
    label,
    ".ari-planned-set__calories",
    `${formatNumber(estimatedSetCalories)} kcal`
  );

  return fragment;
}

/* =====================================================
   TRAINING PROFILE / HEART RATE
===================================================== */

async function loadTrainingProfile() {
  const local =
    readLocalTrainingProfile();

  let cloud =
    null;

  try {
    if (
      window.calbuddySupabase &&
      typeof window.calbuddySupabase
        .from === "function"
    ) {
      const authResult =
        await window.calbuddySupabase
          .auth
          ?.getUser?.();

      const user =
        authResult
          ?.data
          ?.user;

      if (user?.id) {
        const {
          data,
          error
        } =
          await window.calbuddySupabase
            .from("profiles")
            .select(
              "age, weight_lbs, resting_heart_rate, confirmed_max_heart_rate"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (!error && data) {
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

  recalculateHeartRateIntensity();

  return {
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
  };
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
      ? `${formatProfileNumber(state.profileWeightLb)} lb`
      : "\u2014"
  );

  setText(
    elements.trainingProfileRestingHeartRate,
    state.profileRestingHeartRate
      ? `${Math.round(state.profileRestingHeartRate)} bpm`
      : "\u2014"
  );

  setText(
    elements.trainingProfileMaxHeartRate,
    state.profileEffectiveMaxHeartRate
      ? `${Math.round(state.profileEffectiveMaxHeartRate)} bpm`
      : "\u2014"
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

  if (
    elements.trainingAverageHeartRate &&
    document.activeElement !==
      elements.trainingAverageHeartRate
  ) {
    elements.trainingAverageHeartRate.value =
      state.averageWorkoutHeartRate ??
      "";
  }

  renderHeartRateIntensity();
}

function handleAverageHeartRateChange() {
  const value =
    normalizeHeartRate(
      elements
        .trainingAverageHeartRate
        ?.value
    );

  state.averageWorkoutHeartRate =
    value;

  persistAverageHeartRate();

  recalculateHeartRateIntensity();

  renderAll();
}

function recalculateHeartRateIntensity() {
  if (
    !state.averageWorkoutHeartRate ||
    !state.profileAge ||
    !state.profileEffectiveMaxHeartRate
  ) {
    state.heartRateIntensity =
      null;

    return null;
  }

  state.heartRateIntensity =
    HeartRateIntensity.classify({
      age:
        state.profileAge,

      heartRate:
        state.averageWorkoutHeartRate,

      restingHeartRate:
        state.profileRestingHeartRate,

      maxHeartRate:
        state.profileEffectiveMaxHeartRate,

      preferHeartRateReserve:
        Boolean(
          state.profileRestingHeartRate
        )
    });

  return state.heartRateIntensity;
}

function renderHeartRateIntensity() {
  const result =
    state.heartRateIntensity;

  if (!result) {
    if (
      elements.trainingHeartRateIntensity
    ) {
      elements.trainingHeartRateIntensity
        .dataset
        .intensity =
          "unknown";
    }

    setText(
      elements.trainingHeartRateIntensityLabel,
      state.averageWorkoutHeartRate
        ? "More profile data needed"
        : "Waiting for workout heart rate"
    );

    setText(
      elements.trainingHeartRateIntensityDetail,
      state.averageWorkoutHeartRate
        ? "ARI needs age and a usable maximum heart rate to classify intensity."
        : "Enter today's average workout heart rate to classify training intensity."
    );

    return;
  }

  const summary =
    HeartRateIntensity
      .getZoneSummary(
        result
      );

  if (
    elements.trainingHeartRateIntensity
  ) {
    elements.trainingHeartRateIntensity
      .dataset
      .intensity =
        summary
          ?.intensityId ||
        "unknown";
  }

  setText(
    elements.trainingHeartRateIntensityLabel,
    summary?.label ||
    "Unknown"
  );

  const methodLabel =
    result.method ===
      HeartRateIntensity
        .methods
        .HEART_RATE_RESERVE
      ? "heart-rate reserve"
      : "percent of max heart rate";

  setText(
    elements.trainingHeartRateIntensityDetail,
    `${Math.round(result.heartRate)} bpm Â· ${result.percentDisplay}% by ${methodLabel}`
  );
}

function getResolvedCalorieIntensity(
  fallback =
    "moderate"
) {
  const fromHeartRate =
    HeartRateIntensity
      .toCalorieIntensity(
        state
          .heartRateIntensity
          ?.intensityId
      );

  return (
    fromHeartRate ||
    fallback ||
    "moderate"
  );
}

function getAverageHeartRateStorageKey() {
  return (
    "ari_training_average_hr_" +
    `${getCurrentWeekKey()}_` +
    `${state.currentDay || getCurrentWeekdayId()}`
  );
}

function loadStoredAverageHeartRate() {
  state.averageWorkoutHeartRate =
    normalizeHeartRate(
      localStorage.getItem(
        getAverageHeartRateStorageKey()
      )
    );

  recalculateHeartRateIntensity();
}

function persistAverageHeartRate() {
  const key =
    getAverageHeartRateStorageKey();

  if (
    state.averageWorkoutHeartRate
  ) {
    localStorage.setItem(
      key,
      String(
        state.averageWorkoutHeartRate
      )
    );
  } else {
    localStorage.removeItem(
      key
    );
  }
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
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
}

function normalizeAge(
  value
) {
  const number =
    Number(value);

  return (
    Number.isFinite(number) &&
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
    Number(value);

  return (
    Number.isFinite(number) &&
    number >= 30 &&
    number <= 240
  )
    ? Math.round(number)
    : null;
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
      Number(value)
    );
}

/* =====================================================
   CALORIE ESTIMATION
===================================================== */

function estimateSetCalories({
  exerciseEntry,
  exercise,
  requiredSets
}) {
  const weightLb =
    state.profileWeightLb;

  if (!weightLb) {
    return 0;
  }

  /*
   * Strength exercises usually do not have per-set duration.
   * For display purposes ARI assigns an estimated active block
   * duration to each set. This is an estimate, not measurement.
   *
   * Users can later replace this with wearable-derived energy.
   */
  const minutesPerSet =
    Number(
      exerciseEntry
        .minutesPerSet
    ) > 0
      ? Number(
          exerciseEntry
            .minutesPerSet
        )
      : 2.5;

  const intensity =
    getResolvedCalorieIntensity(
      exerciseEntry.intensity ||
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

  if (
    estimate
      ?.roundedCalories
  ) {
    return Math.max(
      1,
      estimate.roundedCalories
    );
  }

  /*
   * Fallback if the exercise has a duration-based energy activity.
   */
  const activityEstimate =
    WorkoutPlanController
      .estimateExerciseCalories({
        exerciseId:
          exercise?.id ||
          exerciseEntry
            .exerciseId,

        durationMinutes:
          minutesPerSet,

        weightLb,

        intensity
      });

  return Math.max(
    0,
    Math.round(
      activityEstimate
        ?.roundedCalories ||
      0
    )
  );
}

function estimateActivityCalories(
  exerciseEntry,
  exercise
) {
  const weightLb =
    state.profileWeightLb;

  if (!weightLb) {
    return 0;
  }

  const durationMinutes =
    Number(
      exerciseEntry
        .durationMinutes
    ) > 0
      ? Number(
          exerciseEntry
            .durationMinutes
        )
      : 30;

  const estimate =
    WorkoutPlanController
      .estimateExerciseCalories({
        exerciseId:
          exercise?.id ||
          exerciseEntry
            .exerciseId,

        durationMinutes,

        weightLb,

        intensity:
          getResolvedCalorieIntensity(
            exerciseEntry
              .intensity ||
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
   CHECKBOX / COMPLETION EVENTS
===================================================== */

function handleWeeklyPlanChange(
  event
) {
  const checkbox =
    event.target;

  if (
    !(checkbox instanceof HTMLInputElement) ||
    checkbox.type !==
      "checkbox"
  ) {
    return;
  }

  const action =
    checkbox.dataset
      .action;

  if (
    action ===
      "complete-set"
  ) {
    const day =
      checkbox.dataset.day;

    const exerciseId =
      checkbox.dataset
        .exerciseId;

    const setNumber =
      Number(
        checkbox.dataset
          .setNumber
      );

    const requiredSets =
      Number(
        checkbox.dataset
          .requiredSets
      );

    const estimatedCalories =
      Number(
        checkbox.dataset
          .estimatedCalories
      );

    WorkoutProgressStore
      .setSetCompleted({
        day,
        exerciseId,
        setNumber,
        requiredSets,

        completed:
          checkbox.checked,

        estimatedCalories:
          checkbox.checked
            ? estimatedCalories
            : 0
      });

    finalizeDayCompletion(
      day
    );

    return;
  }

  if (
    action ===
      "complete-activity"
  ) {
    const day =
      checkbox.dataset.day;

    const exerciseId =
      checkbox.dataset
        .exerciseId;

    const dayEntry =
      state.plan
        ?.week
        ?.[day];

    const exerciseEntry =
      dayEntry
        ?.exercises
        ?.find(
          item =>
            item.exerciseId ===
            exerciseId
        );

    const exercise =
      ExerciseRegistry.get(
        exerciseId
      );

    const estimatedCalories =
      estimateActivityCalories(
        exerciseEntry ||
        {
          exerciseId
        },
        exercise
      );

    WorkoutProgressStore
      .setExerciseCompleted({
        day,
        exerciseId,

        completed:
          checkbox.checked,

        estimatedCalories:
          checkbox.checked
            ? estimatedCalories
            : 0
      });

    finalizeDayCompletion(
      day
    );
  }
}

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
              Number.isInteger(sets) &&
              sets > 0
                ? sets
                : null,

            completionMode:
              Number.isInteger(sets) &&
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
    ).format(
      new Date()
    );

  setText(
    elements.trainingHistoryMonthLabel,
    monthLabel
  );

  const records =
    buildCurrentMonthHistory(
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
        record.calories,
      0
    );

  const sets =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        record.completedSets,
      0
    );

  const minutes =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        record.minutes,
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

  if (
    !elements.monthlyHistoryList
  ) {
    return;
  }

  elements.monthlyHistoryList
    .replaceChildren();

  const grouped =
    groupHistoryByDate(
      records
    );

  for (
    const group
    of grouped
  ) {
    elements.monthlyHistoryList
      .appendChild(
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

function buildCurrentMonthHistory(
  monthKey
) {
  const records =
    readMonthlyHistoryArchive()
      .filter(
        record =>
          record.monthKey ===
          monthKey
      );

  /*
   * Add current week's completed days. Existing archive records
   * win by date+day so repeated renders do not duplicate entries.
   */
  const currentWeek =
    getCurrentWeekDates();

  for (
    const day
    of DAYS
  ) {
    const summary =
      WorkoutProgressStore
        .getDaySummary(day);

    const planDay =
      state.plan
        ?.week
        ?.[day];

    if (
      !planDay ||
      planDay.type ===
        "off" ||
      summary?.status !==
        "complete"
    ) {
      continue;
    }

    const dateKey =
      currentWeek[day];

    if (
      !dateKey ||
      !dateKey.startsWith(
        monthKey
      )
    ) {
      continue;
    }

    const id =
      `${dateKey}:${day}`;

    const existing =
      records.find(
        item =>
          item.id === id
      );

    const record = {
      id,
      monthKey,
      localDate:
        dateKey,
      day,
      title:
        planDay.title ||
        DAY_LABELS[day],
      completedSets:
        summary
          .completedSets ||
        0,
      calories:
        summary
          .estimatedCalories ||
        0,
      minutes:
        estimateCompletedTrainingMinutes(
          planDay,
          day
        ),
      completedAt:
        summary
          .completedAt ||
        new Date()
          .toISOString()
    };

    if (existing) {
      Object.assign(
        existing,
        record
      );
    } else {
      records.push(
        record
      );
    }
  }

  writeMonthlyHistoryArchive(
    records
  );

  return records
    .sort(
      (a, b) =>
        b.localDate
          .localeCompare(
            a.localDate
          )
    );
}

function readMonthlyHistoryArchive() {
  try {
    const raw =
      localStorage.getItem(
        "ari_training_monthly_history_v1"
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

function writeMonthlyHistoryArchive(
  currentMonthRecords
) {
  try {
    const all =
      readMonthlyHistoryArchive();

    const otherMonths =
      all.filter(
        record =>
          record.monthKey !==
          state.currentMonthKey
      );

    localStorage.setItem(
      "ari_training_monthly_history_v1",
      JSON.stringify([
        ...otherMonths,
        ...currentMonthRecords
      ])
    );
  } catch (error) {
    console.warn(
      "[ARI Training] Monthly history could not persist.",
      error
    );
  }
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
    ).push(
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
    elements
      .monthlyHistoryDayTemplate;

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
        record.calories,
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
    `${group.entries.length} ${pluralize(group.entries.length, "workout", "workouts")}`
  );

  setTextWithin(
    details,
    ".ari-history-day__calories",
    `${formatNumber(totalCalories)} kcal`
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
    elements
      .monthlyHistoryWorkoutTemplate;

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
    record.title
  );

  setTextWithin(
    article,
    ".ari-history-workout__sets",
    `${record.completedSets} sets`
  );

  setTextWithin(
    article,
    ".ari-history-workout__duration",
    formatDuration(
      record.minutes
    )
  );

  setTextWithin(
    article,
    ".ari-history-workout__calories",
    `${formatNumber(record.calories)} kcal`
  );

  return fragment;
}

/* =====================================================
   TIME / MONTH / WEEK HELPERS
===================================================== */

function getCurrentWeekdayId() {
  const day =
    new Date().getDay();

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

      result[weekday] =
        getLocalDateKey(
          date
        );
    }
  );

  return result;
}

function getMonthKey(
  date = new Date()
) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}`
  );
}

function getLocalDateKey(
  date = new Date()
) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}

function setCurrentDateDisplay() {
  if (
    !elements.trainingCurrentDate
  ) {
    return;
  }

  const now =
    new Date();

  elements.trainingCurrentDate
    .dateTime =
      getLocalDateKey(
        now
      );

  elements.trainingCurrentDate
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
      ).format(
        now
      );
}

/* =====================================================
   TRAINING TIME ESTIMATION
===================================================== */

function estimateCompletedTrainingMinutes(
  dayState,
  day
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
    const progress =
      WorkoutProgressStore
        .getExerciseProgress(
          day,
          entry.exerciseId
        );

    const sets =
      Number(
        entry.sets
      );

    if (
      Number.isInteger(
        sets
      ) &&
      sets > 0
    ) {
      const minutesPerSet =
        Number(
          entry.minutesPerSet
        ) > 0
          ? Number(
              entry.minutesPerSet
            )
          : 2.5;

      let completedSets =
        0;

      for (
        let setNumber = 1;
        setNumber <=
          sets;
        setNumber += 1
      ) {
        const record =
          normalizeProgressSetRecord(
            progress
              ?.completedSets
              ?.[String(setNumber)]
          );

        if (
          record.completed
        ) {
          completedSets +=
            1;
        }
      }

      minutes +=
        completedSets *
        minutesPerSet;

      continue;
    }

    if (
      progress?.completed
    ) {
      minutes +=
        Number(
          entry.durationMinutes
        ) > 0
          ? Number(
              entry.durationMinutes
            )
          : 30;
    }
  }

  return Math.round(
    minutes
  );
}

function countCompletedSingleActivities(
  day
) {
  const dayState =
    state.plan
      ?.week
      ?.[day];

  if (!dayState) {
    return 0;
  }

  return (
    dayState.exercises ||
    []
  ).reduce(
    (
      total,
      entry
    ) => {
      const sets =
        Number(
          entry.sets
        );

      if (
        Number.isInteger(
          sets
        ) &&
        sets > 0
      ) {
        return total;
      }

      const progress =
        WorkoutProgressStore
          .getExerciseProgress(
            day,
            entry.exerciseId
          );

      return total +
        (
          progress?.completed
            ? 1
            : 0
        );
    },
    0
  );
}

/* =====================================================
   BODY WEIGHT
===================================================== */

function readStoredBodyWeight() {
  const directKeys = [
    "calbuddyCurrentWeight",
    "calbuddyProfileWeight",
    "calbuddyBodyWeight"
  ];

  for (
    const key
    of directKeys
  ) {
    const value =
      normalizeWeight(
        localStorage.getItem(
          key
        )
      );

    if (
      value !==
        null
    ) {
      return value;
    }
  }

  try {
    const profile =
      JSON.parse(
        localStorage.getItem(
          "calbuddyUserProfile"
        ) ||
        "null"
      );

    const candidates = [
      profile?.weight,
      profile?.weightLbs,
      profile?.weightPounds,
      profile?.currentWeight,
      profile?.bodyWeight
    ];

    for (
      const candidate
      of candidates
    ) {
      const value =
        normalizeWeight(
          candidate
        );

      if (
        value !==
          null
      ) {
        return value;
      }
    }
  } catch {
    // Ignore malformed legacy profile data.
  }

  return null;
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

  const direct =
    Number(
      value
    );

  if (
    Number.isFinite(
      direct
    ) &&
    direct >= 50 &&
    direct <= 1000
  ) {
    return Math.round(
      direct * 10
    ) / 10;
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      parsed &&
      typeof parsed ===
        "object"
    ) {
      const candidates = [
        parsed.value,
        parsed.weight,
        parsed.weightLbs,
        parsed.weightPounds,
        parsed.currentWeight,
        parsed.bodyWeight
      ];

      for (
        const candidate
        of candidates
      ) {
        const number =
          Number(
            candidate
          );

        if (
          Number.isFinite(
            number
          ) &&
          number >= 50 &&
          number <= 1000
        ) {
          return Math.round(
            number * 10
          ) / 10;
        }
      }
    }
  } catch {
    // Ignore.
  }

  return null;
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

function setDayStatusElement(
  element,
  status
) {
  if (!element) {
    return;
  }

  const normalized =
    status ||
    "not_started";

  element.dataset.status =
    normalized;

  element.textContent =
    getStatusLabel(
      normalized
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
      return "REST";

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
    Number(entry.sets) > 0
  ) {
    pieces.push(
      `${entry.sets} sets`
    );
  }

  if (
    Number(entry.reps) > 0
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

  return pieces.join(
    " Â· "
  ) ||
  "Complete activity";
}

function getSetPrescription(
  entry
) {
  const pieces = [];

  if (
    Number(entry.reps) > 0
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
    " Â· "
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
  root
    ?.querySelector(
      selector
    )
    ?.replaceChildren(
      document
        .createTextNode(
          value
        )
    );
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
        char.toUpperCase()
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
        Number(value) ||
        0
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
        ) ||
        0
      )
    );

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainder =
    minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (
    remainder === 0
  ) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
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
    dateKey
      .split("-")
      .map(Number);

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
  const today =
    getLocalDateKey();

  if (
    dateKey === today
  ) {
    return "Today";
  }

  const [
    year,
    month,
    day
  ] =
    dateKey
      .split("-")
      .map(Number);

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

    getPlan:
      () =>
        state.plan,

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
        buildCurrentMonthHistory(
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
          state.profileMaxHeartRateSource,

        averageWorkoutHeartRate:
          state.averageWorkoutHeartRate,

        heartRateIntensity:
          state.heartRateIntensity
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

export {
  VERSION,
  SOURCE,
  initialize,
  refresh
};
