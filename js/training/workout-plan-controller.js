// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-controller.js
// Version: 2.0.0
// Purpose:
//   Main orchestration layer for ARI Training planning,
//   workout generation, exercise discovery, session setup,
//   local persistence, and Supabase plan synchronization.
//
// V2.0.0 architecture:
//
//   Exercise Data
//      ↓
//   exercise-registry.js
//      ↓
//   exercise-search.js
//      ↓
//   exercise-recommender.js
//      ↓
//   workout-builder.js
//      ↓
//   workout-plan-controller.js
//      ├── workout-plan-store.js
//      ├── workout-plan-api.js
//      └── workout-progress-store.js
//
// Responsibilities:
//   - Load/save the user's permanent weekly plan.
//   - Keep Supabase and local plan state synchronized.
//   - Search and browse exercises.
//   - Recommend exercises.
//   - Build complete workouts.
//   - Insert builder-generated workouts into plan days.
//   - Build quick workouts.
//   - Build surf/sport workouts.
//   - Start and manage live workout sessions.
//   - Reorder/substitute/add/skip exercises during a session.
//   - Keep session edits separate from permanent plan edits.
//   - Expose calorie estimation helpers.
//   - Preserve compatibility with existing Training UI calls.
//
// Important separation:
//
//   workout-plan-store.js
//     = what the user PLANS to do.
//
//   workout-progress-store.js
//     = what the user is ACTUALLY doing.
//
//   workout-plan-api.js
//     = permanent plan Supabase persistence.
//
// This controller intentionally does not permanently mutate a
// weekly plan when users rearrange a live workout session.
// =====================================================

import WorkoutPlanStore
  from "./workout-plan-store.js";

import WorkoutPlanApi
  from "./workout-plan-api.js";

import WorkoutProgressStore
  from "./workout-progress-store.js";

import WorkoutTemplates
  from "./templates/workout-template-registry.js";

import ExerciseRegistry
  from "./exercises/exercise-registry.js";

import ExerciseSearch
  from "./exercises/exercise-search.js";

import ExerciseRecommender
  from "./exercises/exercise-recommender.js";

import WorkoutBuilder
  from "./workouts/workout-builder.js";

import WorkoutFocuses
  from "./workouts/workout-focuses.js";

import FitnessGoals
  from "./goals/fitness-goals.js";

import CalorieCalculator
  from "./energy/calorie-calculator.js";

import MetValues
  from "./energy/met-values.js";


const VERSION =
  "2.0.0";

const SOURCE =
  "js/training/workout-plan-controller";


const DAYS =
  Object.freeze([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ]);


// =====================================================
// HELPERS
// =====================================================

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


function normalizeId(
  value
) {
  const text =
    normalizeText(
      value
    );

  return text ||
    null;
}


function normalizeDay(
  value
) {
  const day =
    normalizeText(
      value
    )
      .toLowerCase();

  return DAYS.includes(
    day
  )
    ? day
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


function clone(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof structuredClone ===
      "function"
  ) {
    try {
      return structuredClone(
        value
      );
    } catch {
      // Fall through.
    }
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


function getCurrentWeekKey(
  date =
    new Date()
) {
  const current =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const day =
    current.getDay();

  const mondayOffset =
    day === 0
      ? 6
      : day - 1;

  current.setDate(
    current.getDate() -
    mondayOffset
  );

  return (
    `${current.getFullYear()}-` +
    `${String(current.getMonth() + 1).padStart(2, "0")}-` +
    `${String(current.getDate()).padStart(2, "0")}`
  );
}


function getCurrentWeekdayId(
  date =
    new Date()
) {
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


function getPlanContextKey(
  plan
) {
  return (
    plan?.planId ||
    plan?.metadata
      ?.sourceTemplateId ||
    "local-plan"
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

    unsubscribePlan:
      null,

    unsubscribeProgress:
      null
  },


  // ===================================================
  // CONFIGURATION
  // ===================================================

  configure({
    client =
      null,

    tables =
      null
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

    return this
      .getDiagnostics();
  },


  // ===================================================
  // INITIALIZATION
  // ===================================================

  async init(
    options =
      {}
  ) {
    if (
      this.state.initialized &&
      !options.force
    ) {
      return this
        .getDiagnostics();
    }

    if (
      options.client ||
      options.tables
    ) {
      this.configure(
        options
      );
    } else {
      this.state.remoteAvailable =
        Boolean(
          WorkoutPlanApi
            .findClient?.()
        );
    }

    WorkoutProgressStore
      .hydrate();

    await this.load();

    this.syncProgressWithPlan();

    this.bindInternalSubscriptions();

    this.state.initialized =
      true;

    return this
      .getDiagnostics();
  },


  bindInternalSubscriptions() {
    if (
      !this.state
        .unsubscribePlan
    ) {
      this.state
        .unsubscribePlan =
          WorkoutPlanStore
            .subscribe(
              () => {
                this
                  .syncProgressWithPlan();
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

    this.state
      .unsubscribePlan =
        null;

    this.state
      .unsubscribeProgress =
        null;

    this.state.initialized =
      false;

    return true;
  },


  // ===================================================
  // LOAD
  // ===================================================

  async load() {
    if (
      this.state.loading
    ) {
      return WorkoutPlanStore
        .getState();
    }

    this.state.loading =
      true;

    this.state.lastError =
      null;

    try {
      /*
       * Remote remains authoritative when available.
       * Local is the immediate/offline fallback.
       */
      if (
        this.state
          .remoteAvailable
      ) {
        try {
          const remotePlan =
            await WorkoutPlanApi
              .loadPlan();

          if (
            remotePlan
          ) {
            WorkoutPlanStore
              .replaceState(
                remotePlan
              );

            WorkoutPlanStore
              .save();

            this.state
              .lastLoadSource =
                "supabase";

            this
              .syncProgressWithPlan();

            return WorkoutPlanStore
              .getState();
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
          .hydrate();

      this.state
        .lastLoadSource =
          hydrated
            ? "local"
            : "default";

      this
        .syncProgressWithPlan();

      return WorkoutPlanStore
        .getState();
    } finally {
      this.state.loading =
        false;
    }
  },


  // ===================================================
  // SAVE
  // ===================================================

  async save({
    remote =
      true
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
      WorkoutPlanStore
        .save();

      if (
        remote &&
        this.state
          .remoteAvailable
      ) {
        try {
          const saved =
            await WorkoutPlanApi
              .savePlan({
                plan:
                  WorkoutPlanStore
                    .getState()
              });

          if (
            saved
          ) {
            WorkoutPlanStore
              .replaceState(
                saved
              );

            WorkoutPlanStore
              .save();
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

      this
        .syncProgressWithPlan();

      return true;
    } finally {
      this.state.saving =
        false;
    }
  },


  // ===================================================
  // PLAN READS
  // ===================================================

  getPlan() {
    return WorkoutPlanStore
      .getState();
  },


  getWeek() {
    return WorkoutPlanStore
      .getWeek();
  },


  getDay(
    day
  ) {
    return WorkoutPlanStore
      .getDay(
        day
      );
  },


  getToday() {
    return this.getDay(
      getCurrentWeekdayId()
    );
  },


  getSummary() {
    return WorkoutPlanStore
      .getSummary();
  },


  getCurrentWeekKey() {
    return getCurrentWeekKey();
  },


  // ===================================================
  // PLAN METADATA
  // ===================================================

  setPlanName(
    name
  ) {
    return WorkoutPlanStore
      .setPlanName(
        name
      );
  },


  setPrimaryGoal(
    goalId
  ) {
    const goal =
      FitnessGoals.get(
        goalId
      );

    if (!goal) {
      return false;
    }

    return WorkoutPlanStore
      .setPrimaryGoal(
        goal.id
      );
  },


  setSecondaryGoals(
    goalIds =
      []
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
      .setSecondaryGoals(
        validIds
      );
  },


  // ===================================================
  // DAY EDITING
  // ===================================================

  setDayType(
    day,
    type
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    if (!normalizedDay) {
      return false;
    }

    return WorkoutPlanStore
      .setDayType(
        normalizedDay,
        type
      );
  },


  setDayFocus(
    day,
    focusId
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    const focus =
      WorkoutFocuses.get(
        focusId
      );

    if (
      !normalizedDay ||
      !focus
    ) {
      return false;
    }

    if (
      focus.id ===
        "off_day"
    ) {
      return WorkoutPlanStore
        .setDay(
          normalizedDay,
          {
            type:
              "off",

            focusId:
              focus.id,

            title:
              focus.label,

            exercises:
              []
          }
        );
    }

    const type =
      focus.category ===
        "recovery"
        ? "recovery"
        : "workout";

    return WorkoutPlanStore
      .setDay(
        normalizedDay,
        {
          ...(
            WorkoutPlanStore
              .getDay(
                normalizedDay
              ) ||
            {}
          ),

          type,

          focusId:
            focus.id,

          title:
            focus.label
        }
      );
  },


  setDayTitle(
    day,
    title
  ) {
    return WorkoutPlanStore
      .setDayTitle(
        day,
        title
      );
  },


  setDayGoal(
    day,
    goalId
  ) {
    return WorkoutPlanStore
      .setDayGoal(
        day,
        goalId
      );
  },


  setDaySport(
    day,
    sportId
  ) {
    return WorkoutPlanStore
      .setDaySport(
        day,
        sportId
      );
  },


  setDayDuration(
    day,
    minutes
  ) {
    return WorkoutPlanStore
      .setDayDuration(
        day,
        minutes
      );
  },


  clearDay(
    day
  ) {
    return WorkoutPlanStore
      .clearDay(
        day
      );
  },


  // ===================================================
  // PLAN EXERCISE EDITING
  // ===================================================

  addExercise(
    day,
    exerciseId,
    options =
      {}
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    const exercise =
      ExerciseRegistry.get(
        exerciseId
      );

    if (
      !normalizedDay ||
      !exercise
    ) {
      return false;
    }

    const currentDay =
      WorkoutPlanStore
        .getDay(
          normalizedDay
        );

    if (
      !currentDay ||
      currentDay.type ===
        "off"
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

    return WorkoutPlanStore
      .addExercise(
        normalizedDay,
        entry
      );
  },


  updateExercise(
    day,
    index,
    patch =
      {}
  ) {
    return WorkoutPlanStore
      .updateExercise(
        day,
        index,
        patch
      );
  },


  updateExerciseById(
    day,
    entryId,
    patch =
      {}
  ) {
    return WorkoutPlanStore
      .updateExerciseById(
        day,
        entryId,
        patch
      );
  },


  removeExercise(
    day,
    index
  ) {
    return WorkoutPlanStore
      .removeExercise(
        day,
        index
      );
  },


  removeExerciseById(
    day,
    entryId
  ) {
    return WorkoutPlanStore
      .removeExerciseById(
        day,
        entryId
      );
  },


  moveExercise(
    day,
    fromIndex,
    toIndex
  ) {
    return WorkoutPlanStore
      .moveExercise(
        day,
        fromIndex,
        toIndex
      );
  },


  moveExerciseById(
    day,
    entryId,
    toIndex
  ) {
    return WorkoutPlanStore
      .moveExerciseById(
        day,
        entryId,
        toIndex
      );
  },


  // ===================================================
  // TEMPLATES
  // ===================================================

  applyTemplate(
    templateId
  ) {
    const template =
      WorkoutTemplates.get(
        templateId
      );

    if (!template) {
      return false;
    }

    const applied =
      WorkoutPlanStore
        .applyTemplate(
          WorkoutTemplates.clone(
            template.id
          )
        );

    if (
      applied
    ) {
      this
        .syncProgressWithPlan();
    }

    return applied;
  },


  getTemplates(
    filters =
      {}
  ) {
    return WorkoutTemplates
      .list(
        filters
      );
  },


  searchTemplates(
    query
  ) {
    return WorkoutTemplates
      .search(
        query
      );
  },


  // ===================================================
  // WORKOUT FOCUSES / GOALS
  // ===================================================

  getWorkoutFocuses(
    filters =
      {}
  ) {
    return WorkoutFocuses
      .list(
        filters
      );
  },


  searchWorkoutFocuses(
    query
  ) {
    return WorkoutFocuses
      .search(
        query
      );
  },


  getFitnessGoals(
    filters =
      {}
  ) {
    return FitnessGoals
      .list(
        filters
      );
  },


  searchFitnessGoals(
    query
  ) {
    return FitnessGoals
      .search(
        query
      );
  },


  // ===================================================
  // EXERCISE LIBRARY
  // ===================================================

  getExercise(
    exerciseId
  ) {
    return ExerciseRegistry
      .get(
        exerciseId
      );
  },


  getExercises(
    filters =
      {}
  ) {
    return ExerciseRegistry
      .list(
        filters
      );
  },


  searchExercises(
    query,
    options =
      {}
  ) {
    return ExerciseSearch
      .search(
        query,
        options
      );
  },


  findExercises(
    query,
    options =
      {}
  ) {
    return ExerciseSearch
      .find(
        query,
        options
      );
  },


  suggestExercises(
    query,
    options =
      {}
  ) {
    return ExerciseSearch
      .suggest(
        query,
        options
      );
  },


  browseExercises(
    options =
      {}
  ) {
    return ExerciseSearch
      .browse(
        options
      );
  },


  getExerciseSubstitutions(
    exerciseId,
    options =
      {}
  ) {
    return ExerciseSearch
      .substitutions(
        exerciseId,
        options
      );
  },


  // ===================================================
  // RECOMMENDATIONS
  // ===================================================

  getRecommendedExercises(
    options =
      {}
  ) {
    const primaryGoalId =
      WorkoutPlanStore
        .getState()
        .primaryGoalId;

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
          ? options
              .movementPatterns
          : options
              .movementPattern
            ? [
                options
                  .movementPattern
              ]
            : []
      )
    ];

    const exerciseTypes = [
      ...(
        Array.isArray(
          options.exerciseTypes
        )
          ? options
              .exerciseTypes
          : options.exerciseType
            ? [
                options.exerciseType
              ]
            : []
      )
    ];

    if (
      focus
    ) {
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
        movementPatterns
          .length ===
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
            options
              .availableEquipment ||
            (
              options.equipment
                ? [
                    options.equipment
                  ]
                : []
            ),

          preferredEquipment:
            options
              .preferredEquipment,

          excludedEquipment:
            options
              .excludedEquipment,

          preferredExercises:
            options
              .preferredExercises,

          excludedExercises:
            options
              .excludedExercises,

          difficulty:
            options.difficulty,

          sport:
            options.sport,

          specialization:
            options
              .specialization,

          allowHarder:
            options.allowHarder,

          strictEquipment:
            options
              .strictEquipment,

          includeBodyweight:
            options
              .includeBodyweight,

          variety:
            options.variety,

          limit:
            options.limit ||
            12
        });

    return recommendation
      .results;
  },


  getRecommendedExercisesForDay(
    day,
    options =
      {}
  ) {
    const dayState =
      WorkoutPlanStore
        .getDay(
          day
        );

    if (
      !dayState ||
      dayState.type ===
        "off"
    ) {
      return [];
    }

    return this
      .getRecommendedExercises({
        goal:
          dayState.goal ||
          WorkoutPlanStore
            .getState()
            .primaryGoalId,

        workoutFocus:
          dayState.focusId,

        sport:
          dayState.sport,

        ...options
      });
  },


  recommendFromQuery(
    query,
    options =
      {}
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
    options =
      {}
  ) {
    const plan =
      WorkoutPlanStore
        .getState();

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

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildQuickWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.quick(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildStrengthWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.strength(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildHypertrophyWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.hypertrophy(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildCardioWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.cardio(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildMobilityWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.mobility(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildSurfWorkout(
    options =
      {}
  ) {
    const workout =
      WorkoutBuilder.surfing(
        options
      );

    this.state
      .lastBuiltWorkout =
        clone(
          workout
        );

    return workout;
  },


  buildWorkoutForDay(
    day,
    options =
      {}
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    if (!normalizedDay) {
      return null;
    }

    const currentDay =
      WorkoutPlanStore
        .getDay(
          normalizedDay
        );

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

    const workout =
      this.buildWorkout({
        goal:
          options.goal ||
          currentDay?.goal ||
          WorkoutPlanStore
            .getState()
            .primaryGoalId ||
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
          options
            .durationMinutes ||
          currentDay
            ?.estimatedDurationMinutes ||
          45,

        ...options
      });

    return workout;
  },


  setBuiltWorkoutForDay(
    day,
    workout,
    options =
      {}
  ) {
    const normalizedDay =
      normalizeDay(
        day
      );

    if (
      !normalizedDay ||
      !workout
    ) {
      return false;
    }

    const result =
      WorkoutPlanStore
        .setBuiltWorkout(
          normalizedDay,
          workout,
          options
        );

    if (
      result
    ) {
      this
        .syncProgressWithPlan();
    }

    return result;
  },


  buildAndSetWorkoutForDay(
    day,
    options =
      {}
  ) {
    const workout =
      this.buildWorkoutForDay(
        day,
        options
      );

    if (!workout) {
      return null;
    }

    const stored =
      this.setBuiltWorkoutForDay(
        day,
        workout,
        {
          focusId:
            options.focusId ||
            null
        }
      );

    return stored
      ? workout
      : null;
  },


  regenerateDay(
    day,
    options =
      {}
  ) {
    return this
      .buildAndSetWorkoutForDay(
        day,
        options
      );
  },


  addBuiltWorkoutToDay(
    day,
    workout,
    options =
      {}
  ) {
    return this
      .setBuiltWorkoutForDay(
        day,
        workout,
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
    options =
      {}
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
    options =
      {}
  ) {
    return WorkoutBuilder
      .addExercise(
        workout,
        exerciseId,
        options
      );
  },


  // ===================================================
  // PLAN → PROGRESS SYNC
  // ===================================================

  syncProgressWithPlan() {
    const plan =
      WorkoutPlanStore
        .getState();

    WorkoutProgressStore
      .setPlanContext({
        planKey:
          getPlanContextKey(
            plan
          ),

        weekKey:
          getCurrentWeekKey(),

        resetIfChanged:
          true
      });

    WorkoutProgressStore
      .syncWeekWithPlan(
        plan.week
      );

    return WorkoutProgressStore
      .getWeekSummary();
  },


  // ===================================================
  // LIVE SESSION READS
  // ===================================================

  getProgress() {
    return WorkoutProgressStore
      .getState();
  },


  getDayProgress(
    day
  ) {
    return WorkoutProgressStore
      .getDay(
        day
      );
  },


  getDayProgressSummary(
    day
  ) {
    return WorkoutProgressStore
      .getDaySummary(
        day
      );
  },


  getTodayProgress() {
    return this
      .getDayProgress(
        getCurrentWeekdayId()
      );
  },


  getTodayProgressSummary() {
    return this
      .getDayProgressSummary(
        getCurrentWeekdayId()
      );
  },


  getWeekProgressSummary() {
    return WorkoutProgressStore
      .getWeekSummary();
  },


  // ===================================================
  // SESSION LIFECYCLE
  // ===================================================

  startWorkout(
    day =
      getCurrentWeekdayId()
  ) {
    return WorkoutProgressStore
      .startDay(
        day
      );
  },


  pauseWorkout(
    day =
      getCurrentWeekdayId()
  ) {
    return WorkoutProgressStore
      .pauseDay(
        day
      );
  },


  resumeWorkout(
    day =
      getCurrentWeekdayId()
  ) {
    return WorkoutProgressStore
      .resumeDay(
        day
      );
  },


  completeWorkout(
    day =
      getCurrentWeekdayId(),
    options =
      {}
  ) {
    return WorkoutProgressStore
      .completeDay(
        day,
        options
      );
  },


  getWorkoutElapsedSeconds(
    day =
      getCurrentWeekdayId()
  ) {
    return WorkoutProgressStore
      .getElapsedSeconds(
        day
      );
  },


  setAverageHeartRate(
    day,
    heartRate
  ) {
    return WorkoutProgressStore
      .setAverageHeartRate(
        day,
        heartRate
      );
  },


  setWorkoutNotes(
    day,
    notes
  ) {
    return WorkoutProgressStore
      .setDayNotes(
        day,
        notes
      );
  },


  // ===================================================
  // SESSION EXERCISE ACTIONS
  // ===================================================

  moveSessionExercise(
    day,
    entryId,
    toIndex
  ) {
    return WorkoutProgressStore
      .moveEntry(
        day,
        entryId,
        toIndex
      );
  },


  addSessionExercise(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .addSessionExercise(
        options
      );
  },


  substituteSessionExercise(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .substituteEntry(
        options
      );
  },


  skipSessionExercise(
    day,
    entryId,
    skipped =
      true
  ) {
    return WorkoutProgressStore
      .skipEntry(
        day,
        entryId,
        skipped
      );
  },


  removeSessionExercise(
    day,
    entryId
  ) {
    return WorkoutProgressStore
      .removeSessionEntry(
        day,
        entryId
      );
  },


  getSessionExercise(
    day,
    entryIdOrExerciseId
  ) {
    return WorkoutProgressStore
      .getExerciseProgress(
        day,
        entryIdOrExerciseId
      );
  },


  // ===================================================
  // SET / ACTIVITY COMPLETION
  // ===================================================

  setSetCompleted(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .setSetCompleted(
        options
      );
  },


  toggleSetCompleted(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .toggleSetCompleted(
        options
      );
  },


  setSetCalories(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .setSetCalories(
        options
      );
  },


  setExerciseCompleted(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .setExerciseCompleted(
        options
      );
  },


  toggleExerciseCompleted(
    options =
      {}
  ) {
    return WorkoutProgressStore
      .toggleExerciseCompleted(
        options
      );
  },


  // ===================================================
  // SESSION SNAPSHOT
  // ===================================================

  createSessionSnapshot(
    day =
      getCurrentWeekdayId()
  ) {
    return WorkoutProgressStore
      .createSessionSnapshot(
        day
      );
  },


  // ===================================================
  // CALORIE ESTIMATION
  // ===================================================

  estimateExerciseCalories({
    exerciseId,
    durationMinutes,
    weightKg =
      null,
    weightLb =
      null,
    intensity =
      null,
    activityId =
      null
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
    intensity =
      null
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
    category =
      null,
    exerciseType =
      null,
    intensity =
      null
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
      .subscribe(
        listener
      );
  },


  subscribeProgress(
    listener
  ) {
    return WorkoutProgressStore
      .subscribe(
        listener
      );
  },


  // ===================================================
  // DELETE / RESET
  // ===================================================

  async deleteRemotePlan() {
    if (
      !this.state
        .remoteAvailable
    ) {
      return false;
    }

    const plan =
      WorkoutPlanStore
        .getState();

    await WorkoutPlanApi
      .deletePlan({
        planId:
          plan.planId
      });

    WorkoutPlanStore
      .reset();

    WorkoutProgressStore
      .resetAll();

    this.state
      .lastLoadSource =
        "default";

    return true;
  },


  resetPlan() {
    const result =
      WorkoutPlanStore
        .reset();

    WorkoutProgressStore
      .resetAll();

    return result;
  },


  resetProgress() {
    return WorkoutProgressStore
      .resetAll();
  },


  resetDayProgress(
    day
  ) {
    return WorkoutProgressStore
      .resetDay(
        day
      );
  },


  reset() {
    return this
      .resetPlan();
  },


  // ===================================================
  // VALIDATION
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


  // ===================================================
  // DIAGNOSTICS
  // ===================================================

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

      lastBuiltWorkout:
        this.state
          .lastBuiltWorkout
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
                  this.state
                    .lastError
                )
            }
          : null,

      plan:
        WorkoutPlanStore
          .getSummary(),

      progress:
        WorkoutProgressStore
          .getWeekSummary(),

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
  AriTrainingWorkoutPlanController
};

export default
  AriTrainingWorkoutPlanController;
