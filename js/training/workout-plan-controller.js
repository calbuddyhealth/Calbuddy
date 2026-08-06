// =====================================================
// ARI REBIRTH
// File: js/training/workout-plan-controller.js
// Version: 1.0.0
// Purpose:
//   Orchestrates ARI Training workout-plan behavior across
//   the local store, Supabase API, templates, exercise
//   library, workout focuses, fitness goals, and energy data.
//
// Design:
//   - UI-facing controller for workout-plans.html.
//   - Loads remote plans first, with local fallback.
//   - Applies templates into the editable weekly plan.
//   - Restricts added exercises to the approved registry.
//   - Provides goal/body-part/focus-based recommendations.
//   - Saves locally immediately and remotely when available.
// =====================================================

import WorkoutPlanStore from "./workout-plan-store.js";
import WorkoutPlanApi from "./workout-plan-api.js";

import WorkoutTemplates from "./templates/workout-template-registry.js";
import ExerciseRegistry from "./exercises/exercise-registry.js";
import WorkoutFocuses from "./workouts/workout-focuses.js";
import FitnessGoals from "./goals/fitness-goals.js";

import CalorieCalculator from "./energy/calorie-calculator.js";
import MetValues from "./energy/met-values.js";

const VERSION = "1.0.0";
const SOURCE = "js/training/workout-plan-controller";

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}

function normalizeId(value) {
  const text =
    normalizeText(value);

  return text || null;
}

function normalizeDay(value) {
  const day =
    normalizeText(value)
      .toLowerCase();

  return WorkoutPlanStore.days
    .includes(day)
      ? day
      : null;
}

function normalizePositiveNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number) &&
    number > 0
      ? number
      : null;
}

function clone(value) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

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

    lastError:
      null
  },

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
        WorkoutPlanApi.findClient?.()
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
          WorkoutPlanApi.findClient?.()
        );
    }

    await this.load();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  async load() {
    if (this.state.loading) {
      return WorkoutPlanStore.getState();
    }

    this.state.loading =
      true;

    this.state.lastError =
      null;

    try {
      /*
       * Remote data is authoritative when available.
       */
      if (
        this.state.remoteAvailable
      ) {
        try {
          const remotePlan =
            await WorkoutPlanApi
              .loadPlan();

          if (remotePlan) {
            WorkoutPlanStore
              .replaceState(
                remotePlan
              );

            WorkoutPlanStore.save();

            this.state.lastLoadSource =
              "supabase";

            return WorkoutPlanStore
              .getState();
          }
        } catch (error) {
          console.warn(
            "ARI Training remote workout plan did not load. Falling back locally.",
            error
          );

          this.state.lastError =
            error;
        }
      }

      const hydrated =
        WorkoutPlanStore
          .hydrate();

      this.state.lastLoadSource =
        hydrated
          ? "local"
          : "default";

      return WorkoutPlanStore
        .getState();
    } finally {
      this.state.loading =
        false;
    }
  },

  async save({
    remote = true
  } = {}) {
    if (this.state.saving) {
      return false;
    }

    this.state.saving =
      true;

    this.state.lastError =
      null;

    try {
      WorkoutPlanStore.save();

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
                    .getState()
              });

          if (saved) {
            WorkoutPlanStore
              .replaceState(
                saved
              );

            WorkoutPlanStore.save();
          }
        } catch (error) {
          /*
           * Local save has already succeeded. Do not discard user
           * edits merely because the remote save failed.
           */
          console.warn(
            "ARI Training workout plan saved locally but remote save failed.",
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

      return true;
    } finally {
      this.state.saving =
        false;
    }
  },

  getPlan() {
    return WorkoutPlanStore
      .getState();
  },

  getWeek() {
    return WorkoutPlanStore
      .getWeek();
  },

  getDay(day) {
    return WorkoutPlanStore
      .getDay(day);
  },

  getSummary() {
    return WorkoutPlanStore
      .getSummary();
  },

  setPlanName(name) {
    return WorkoutPlanStore
      .setPlanName(
        name
      );
  },

  setPrimaryGoal(goalId) {
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
    goalIds = []
  ) {
    const validIds =
      Array.isArray(goalIds)
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

  setDayType(
    day,
    type
  ) {
    const normalizedDay =
      normalizeDay(day);

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
      normalizeDay(day);

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
              ) || {}
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

  clearDay(day) {
    return WorkoutPlanStore
      .clearDay(
        day
      );
  },

  addExercise(
    day,
    exerciseId,
    options = {}
  ) {
    const normalizedDay =
      normalizeDay(day);

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
    patch = {}
  ) {
    return WorkoutPlanStore
      .updateExercise(
        day,
        index,
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

    return WorkoutPlanStore
      .applyTemplate(
        WorkoutTemplates.clone(
          template.id
        )
      );
  },

  getTemplates(filters = {}) {
    return WorkoutTemplates
      .list(
        filters
      );
  },

  searchTemplates(query) {
    return WorkoutTemplates
      .search(
        query
      );
  },

  getWorkoutFocuses(filters = {}) {
    return WorkoutFocuses
      .list(
        filters
      );
  },

  searchWorkoutFocuses(query) {
    return WorkoutFocuses
      .search(
        query
      );
  },

  getFitnessGoals(filters = {}) {
    return FitnessGoals
      .list(
        filters
      );
  },

  searchFitnessGoals(query) {
    return FitnessGoals
      .search(
        query
      );
  },

  getExercise(exerciseId) {
    return ExerciseRegistry
      .get(
        exerciseId
      );
  },

  searchExercises(query) {
    return ExerciseRegistry
      .search(
        query
      );
  },

  getExercises(filters = {}) {
    return ExerciseRegistry
      .list(
        filters
      );
  },

  getRecommendedExercises({
    goal = null,
    bodyPart = null,
    workoutFocus = null,
    movementPattern = null,
    exerciseType = null,
    equipment = null,
    difficulty = null,
    limit = 12
  } = {}) {
    const resolvedGoal =
      FitnessGoals.get(
        goal ||
        WorkoutPlanStore
          .getState()
          .primaryGoalId
      );

    let resolvedBodyPart =
      normalizeId(
        bodyPart
      );

    let resolvedMovement =
      normalizeId(
        movementPattern
      );

    let resolvedType =
      normalizeId(
        exerciseType
      );

    const focus =
      WorkoutFocuses.get(
        workoutFocus
      );

    /*
     * If the UI supplies only a familiar workout focus like
     * "Chest Day", use that focus to narrow the recommendation
     * pool before ranking by goal.
     */
    if (
      focus &&
      !resolvedBodyPart &&
      Array.isArray(
        focus.primaryBodyParts
      ) &&
      focus.primaryBodyParts
        .length === 1
    ) {
      resolvedBodyPart =
        focus.primaryBodyParts[0];
    }

    if (
      focus &&
      !resolvedMovement &&
      Array.isArray(
        focus.movementPatterns
      ) &&
      focus.movementPatterns
        .length === 1
    ) {
      resolvedMovement =
        focus.movementPatterns[0];
    }

    if (
      focus &&
      !resolvedType &&
      Array.isArray(
        focus.exerciseTypes
      ) &&
      focus.exerciseTypes
        .length === 1
    ) {
      resolvedType =
        focus.exerciseTypes[0];
    }

    const baseRecommendations =
      resolvedGoal
        ? ExerciseRegistry
            .recommend({
              goal:
                resolvedGoal.id,

              bodyPart:
                resolvedBodyPart,

              movementPattern:
                resolvedMovement,

              exerciseType:
                resolvedType,

              equipment,

              difficulty,

              limit:
                Math.max(
                  24,
                  Number(limit) ||
                  12
                )
            })
        : ExerciseRegistry
            .list({
              bodyPart:
                resolvedBodyPart,

              movementPattern:
                resolvedMovement,

              exerciseType:
                resolvedType,

              equipment,

              difficulty
            });

    let recommendations =
      baseRecommendations;

    if (focus) {
      recommendations =
        recommendations.filter(
          exercise => {
            const exerciseBodyParts =
              exercise.bodyParts ||
              [];

            const exerciseMovements =
              exercise.movementPatterns ||
              [];

            const exerciseTypes =
              exercise.exerciseTypes ||
              [];

            const bodyPartMatch =
              (
                focus.bodyParts ||
                []
              ).length === 0 ||
              (
                focus.bodyParts ||
                []
              ).some(
                id =>
                  exerciseBodyParts
                    .includes(id)
              );

            const movementMatch =
              (
                focus.movementPatterns ||
                []
              ).length === 0 ||
              (
                focus.movementPatterns ||
                []
              ).some(
                id =>
                  exerciseMovements
                    .includes(id)
              );

            const typeMatch =
              (
                focus.exerciseTypes ||
                []
              ).length === 0 ||
              (
                focus.exerciseTypes ||
                []
              ).some(
                id =>
                  exerciseTypes
                    .includes(id)
              );

            return (
              bodyPartMatch ||
              movementMatch ||
              typeMatch
            );
          }
        );
    }

    return recommendations
      .slice(
        0,
        Math.max(
          1,
          Number(limit) ||
          12
        )
      );
  },

  getRecommendedExercisesForDay(
    day,
    {
      limit = 12,
      equipment = null,
      difficulty = null
    } = {}
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
          WorkoutPlanStore
            .getState()
            .primaryGoalId,

        workoutFocus:
          dayState.focusId,

        equipment,

        difficulty,

        limit
      });
  },

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

    /*
     * Strength movements are better estimated as a full
     * training session, not by summing individual lift METs.
     */
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
      ).toLowerCase();

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

  subscribe(listener) {
    return WorkoutPlanStore
      .subscribe(
        listener
      );
  },

  async deleteRemotePlan() {
    if (
      !this.state.remoteAvailable
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

    WorkoutPlanStore.reset();

    this.state.lastLoadSource =
      "default";

    return true;
  },

  reset() {
    return WorkoutPlanStore
      .reset();
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

      registries: {
        templates:
          WorkoutTemplates
            .all
            .length,

        exercises:
          ExerciseRegistry
            .all
            .length,

        workoutFocuses:
          WorkoutFocuses
            .all
            .length,

        fitnessGoals:
          FitnessGoals
            .all
            .length,

        metActivities:
          MetValues
            .all
            .length
      },

      validation: {
        exercises:
          ExerciseRegistry
            .validate?.() ||
          null
      },

      api:
        WorkoutPlanApi
          .getDiagnostics?.() ||
        null
    };
  }
};

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

  Ari.training.workoutPlanController =
    AriTrainingWorkoutPlanController;

  globalThis.Ari =
    Ari;
}

export {
  VERSION,
  SOURCE,
  AriTrainingWorkoutPlanController
};

export default AriTrainingWorkoutPlanController;
