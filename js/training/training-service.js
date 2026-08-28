// Canonical Training mutation service.
// Owns validated workout persistence so Ari adapters and legacy phase files do not.

const CONTROLLER_URL = "./workout-plan-controller.js";
let controllerPromise = null;

function clean(value = "", max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hasWorkout(day) {
  return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0);
}

function failure(code, message) {
  return { success: false, code, message };
}

async function getController() {
  if (!controllerPromise) {
    controllerPromise = import(CONTROLLER_URL)
      .then(async (module) => {
        const controller = module.default || module.AriTrainingWorkoutPlanController;
        if (!controller?.init) throw new Error("Canonical Training controller is unavailable.");
        await controller.init();
        return controller;
      })
      .catch((error) => {
        controllerPromise = null;
        throw error;
      });
  }
  return controllerPromise;
}

function revalidateTargetIndex(day, exerciseId, preparedIndex) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  const exact = Number(preparedIndex);
  if (Number.isInteger(exact) && exact >= 0 && exact < exercises.length && clean(exercises[exact]?.exerciseId, 120) === exerciseId) return exact;
  const matches = exercises.map((entry, index) => ({ entry, index })).filter(({ entry }) => clean(entry?.exerciseId, 120) === exerciseId);
  return matches.length === 1 ? matches[0].index : null;
}

function moveExercise(controller, scheduledDate, day, fromIndex, toIndex) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises.map((entry) => ({ ...entry })) : [];
  if (fromIndex < 0 || fromIndex >= exercises.length) return false;
  const bounded = Math.max(0, Math.min(exercises.length - 1, Number(toIndex) || 0));
  if (fromIndex === bounded) return true;
  const [moved] = exercises.splice(fromIndex, 1);
  exercises.splice(bounded, 0, moved);
  return Boolean(controller.setDate(scheduledDate, { exercises }));
}

function successText(prepared, updated) {
  const label = prepared.scheduledDate;
  if (prepared.operation === "add") return `${prepared.replacementName} is added to ${label}'s workout.`;
  if (prepared.operation === "remove") return `${prepared.targetName} is removed from ${label}'s workout.`;
  if (prepared.operation === "replace") return `${prepared.targetName} is replaced with ${prepared.replacementName} on ${label}.`;
  if (prepared.operation === "move") return `${prepared.targetName} is moved to position ${prepared.position} on ${label}.`;
  if (prepared.operation === "update" && prepared.targetName) return `${prepared.targetName} is updated on ${label}.`;
  return `${clean(updated?.title, 160) || "The workout"} is updated for ${label}.`;
}

export async function createValidatedWorkout(action = {}) {
  const controller = await getController();
  const payload = object(action?.payload);
  const scheduledDate = clean(payload.scheduled_date, 20);
  const workout = object(payload.vnext_prebuilt_workout);
  if (!scheduledDate || !workout?.workoutId || !Array.isArray(workout.blocks)) {
    return failure("invalid_validated_workout", "The validated workout payload is incomplete.");
  }

  const existing = controller.getDate(scheduledDate);
  if (hasWorkout(existing)) {
    return {
      success: false,
      conflict: true,
      code: "workout_date_conflict",
      message: `${clean(existing.title, 160) || "A workout"} is already planned for ${scheduledDate}. I didn't overwrite it.`
    };
  }

  const entries = workout.blocks.flatMap((block) => Array.isArray(block?.exercises) ? block.exercises : []);
  for (const entry of entries) {
    if (!entry?.exerciseId || !controller.getExercise(entry.exerciseId)) {
      return failure("workout_registry_revalidation_failed", "One of Ari's workout exercises is no longer available in the canonical exercise registry.");
    }
  }

  const saved = controller.setBuiltWorkoutForDate(scheduledDate, workout, {
    focusId: clean(payload.focus_id, 100) || "custom"
  });
  if (!saved) return failure("workout_save_failed", "Training could not save the validated workout.");

  const remoteSaved = await controller.save({ remote: true });
  if (remoteSaved === false) return failure("workout_remote_save_failed", "Training could not confirm the remote workout save.");

  return {
    success: true,
    workout,
    scheduled_date: scheduledDate,
    reply: `${clean(workout.title, 160) || "Workout"} is set for ${scheduledDate}.`
  };
}

export async function applyValidatedWorkoutEdit(action = {}) {
  const controller = await getController();
  const payload = object(action?.payload);
  const prepared = object(payload.vnext_prepared_edit);
  const scheduledDate = clean(prepared.scheduledDate || payload.scheduled_date, 20);
  const operation = clean(prepared.operation, 40).toLowerCase();
  if (!scheduledDate || !operation) return failure("invalid_validated_workout_edit", "The validated workout edit is incomplete.");

  const day = controller.getDate(scheduledDate);
  if (!hasWorkout(day)) return failure("workout_edit_target_missing", `There isn't a workout to edit on ${scheduledDate}.`);
  if (day?.completed === true || day?.progress?.completed === true) return failure("workout_edit_completed_session", "A completed workout cannot be rewritten through Ari.");

  let targetIndex = null;
  if (prepared.targetExerciseId) {
    targetIndex = revalidateTargetIndex(day, prepared.targetExerciseId, prepared.targetIndex);
    if (targetIndex === null) return failure("workout_edit_target_changed", "That workout changed after Ari prepared the edit. Ask Ari to prepare it again.");
  }

  let changed = false;
  if (operation === "add") {
    if (!prepared.replacementExerciseId || !controller.getExercise(prepared.replacementExerciseId)) return failure("workout_edit_registry_revalidation_failed", "The exercise to add is no longer available in the canonical registry.");
    changed = controller.addExercise(scheduledDate, prepared.replacementExerciseId, prepared.patch || {});
    if (changed && prepared.position !== null && prepared.position !== undefined) {
      const refreshed = controller.getDate(scheduledDate);
      const newIndex = refreshed.exercises.findIndex((entry) => clean(entry?.exerciseId, 120) === prepared.replacementExerciseId);
      if (newIndex >= 0 && prepared.position - 1 !== newIndex) changed = moveExercise(controller, scheduledDate, refreshed, newIndex, prepared.position - 1);
    }
  } else if (operation === "remove") {
    changed = controller.removeExercise(scheduledDate, targetIndex);
  } else if (operation === "replace") {
    if (!prepared.replacementExerciseId || !controller.getExercise(prepared.replacementExerciseId)) return failure("workout_edit_registry_revalidation_failed", "The replacement exercise is no longer available in the canonical registry.");
    changed = controller.updateExercise(scheduledDate, targetIndex, { exerciseId: prepared.replacementExerciseId, ...(prepared.patch || {}) });
  } else if (operation === "move") {
    changed = moveExercise(controller, scheduledDate, day, targetIndex, Math.max(0, Math.min(day.exercises.length - 1, Number(prepared.position || 1) - 1)));
  } else if (operation === "update") {
    const results = [];
    if (targetIndex !== null && prepared.patch && Object.keys(prepared.patch).length) results.push(controller.updateExercise(scheduledDate, targetIndex, prepared.patch));
    if (prepared.title) results.push(controller.setDateTitle(scheduledDate, prepared.title));
    if (prepared.durationMinutes !== null && prepared.durationMinutes !== undefined) results.push(controller.setDateDuration(scheduledDate, prepared.durationMinutes));
    changed = results.length > 0 && results.every(Boolean);
  }

  if (!changed) return failure("workout_edit_save_failed", "Training could not apply that workout edit safely.");
  const remoteSaved = await controller.save({ remote: true });
  if (remoteSaved === false) return failure("workout_edit_remote_save_failed", "Training could not confirm the remote workout edit.");

  const updated = controller.getDate(scheduledDate);
  return {
    success: true,
    workout: updated,
    scheduled_date: scheduledDate,
    operation,
    reply: successText(prepared, updated)
  };
}

export const TrainingService = Object.freeze({
  getController,
  createValidatedWorkout,
  applyValidatedWorkoutEdit
});

export default TrainingService;
