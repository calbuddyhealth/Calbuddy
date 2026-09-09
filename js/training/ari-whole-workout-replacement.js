// ARI XP — whole-workout replacement adapter patch v1.0.0
(() => {
  "use strict";

  const PATCH_FLAG = "__ariWholeWorkoutReplacementV1";

  function clean(value, max = 180) {
    return String(value ?? "").trim().slice(0, max);
  }

  function hasWorkout(day) {
    return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0);
  }

  function formatDateLabel(value) {
    const text = clean(value, 20);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text || "that date";
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date);
  }

  function patchAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || adapter[PATCH_FLAG]) return Boolean(adapter?.[PATCH_FLAG]);
    if (typeof adapter.prepareCalBuddyAction !== "function" || typeof adapter.executeValidatedWorkout !== "function") return false;

    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);
    const originalExecuteValidatedWorkout = adapter.executeValidatedWorkout.bind(adapter);

    adapter.prepareCalBuddyAction = async function prepareWholeWorkoutReplacement(pendingAction = {}) {
      if (clean(pendingAction?.name, 120) !== "replace_workout") {
        return await originalPrepare(pendingAction);
      }

      const args = pendingAction?.arguments && typeof pendingAction.arguments === "object"
        ? pendingAction.arguments
        : {};

      const mapped = await this.mapWorkoutPlanValidated(pendingAction, args);
      if (!mapped?.success || !mapped?.action) return mapped;

      const scheduledDate = clean(mapped.action?.payload?.scheduled_date, 20);
      const controller = await this.getWorkoutController();
      const existing = controller.getDate(scheduledDate);

      if (!hasWorkout(existing)) {
        return {
          success: false,
          code: "workout_replace_target_missing",
          message: `There isn't a workout to replace on ${formatDateLabel(scheduledDate)}.`
        };
      }
      if (existing?.completed === true || existing?.progress?.completed === true) {
        return {
          success: false,
          code: "workout_replace_completed_session",
          message: "A completed workout cannot be replaced through Ari."
        };
      }

      const replacement = mapped.action.payload.vnext_prebuilt_workout;
      mapped.action = {
        ...mapped.action,
        payload: {
          ...mapped.action.payload,
          existing_workout_mode: "replace",
          replacement_of_workout_id: existing?.workoutId || existing?.id || null,
          replacement_of_title: clean(existing?.title, 160) || "Workout"
        },
        confirmation_text: `Replace ${clean(existing?.title, 160) || "the current workout"} with Ari's ${clean(replacement?.title, 160) || "new workout"} on ${formatDateLabel(scheduledDate)}?`
      };
      mapped.resolution = {
        ...(mapped.resolution || {}),
        replacement: true,
        existingWorkout: {
          title: clean(existing?.title, 160) || "Workout",
          exerciseCount: Array.isArray(existing?.exercises) ? existing.exercises.length : 0
        }
      };
      return mapped;
    };

    adapter.executeValidatedWorkout = async function executeWholeWorkoutReplacement({ action, pending, currentTurnId = null } = {}) {
      const payload = action?.payload && typeof action.payload === "object" ? action.payload : {};
      if (clean(payload.existing_workout_mode, 20).toLowerCase() !== "replace") {
        return await originalExecuteValidatedWorkout({ action, pending, currentTurnId });
      }

      let controller;
      try {
        controller = await this.getWorkoutController();
      } catch (error) {
        return { success: false, code: "training_controller_unavailable", message: error?.message || "The canonical Training controller is unavailable." };
      }

      const scheduledDate = clean(payload.scheduled_date, 20);
      const workout = payload.vnext_prebuilt_workout && typeof payload.vnext_prebuilt_workout === "object"
        ? payload.vnext_prebuilt_workout
        : null;
      if (!scheduledDate || !workout?.workoutId || !Array.isArray(workout?.blocks)) {
        return { success: false, code: "invalid_validated_workout_replacement", message: "The validated replacement workout is incomplete." };
      }

      const existing = controller.getDate(scheduledDate);
      if (!hasWorkout(existing)) {
        return { success: false, code: "workout_replace_target_missing", message: `There isn't a workout to replace on ${formatDateLabel(scheduledDate)}.` };
      }
      if (existing?.completed === true || existing?.progress?.completed === true) {
        return { success: false, code: "workout_replace_completed_session", message: "A completed workout cannot be replaced through Ari." };
      }

      const expectedTitle = clean(payload.replacement_of_title, 160);
      if (expectedTitle && clean(existing?.title, 160) !== expectedTitle) {
        return { success: false, code: "workout_replace_target_changed", message: "That workout changed after Ari prepared the replacement. Ask Ari to prepare it again." };
      }

      const entries = workout.blocks.flatMap((block) => Array.isArray(block?.exercises) ? block.exercises : []);
      for (const entry of entries) {
        if (!entry?.exerciseId || !controller.getExercise(entry.exerciseId)) {
          return { success: false, code: "workout_replace_registry_revalidation_failed", message: "One of Ari's replacement exercises is no longer available in the canonical exercise registry." };
        }
      }

      const saved = controller.setBuiltWorkoutForDate(scheduledDate, workout, {
        focusId: clean(payload.focus_id, 100) || "custom"
      });
      if (!saved) {
        return { success: false, code: "workout_replace_save_failed", message: "Training could not safely replace that workout." };
      }

      const remoteSaved = await controller.save({ remote: true });
      if (remoteSaved === false) {
        return { success: false, code: "workout_replace_remote_save_failed", message: "The replacement was prepared locally but ARI XP could not confirm the remote save." };
      }

      window.dispatchEvent(new CustomEvent("ari:workoutPlanUpdated", {
        detail: {
          scheduledDate,
          mode: "replace",
          operation: "replace_workout",
          source: "ari_vnext_action_adapter",
          vnextActionId: pending?.id || null,
          confirmationTurnId: clean(currentTurnId, 200) || null
        }
      }));

      return {
        success: true,
        result: {
          workout,
          scheduled_date: scheduledDate,
          operation: "replace_workout",
          reply: `${clean(workout.title, 160) || "The new workout"} replaced ${clean(existing?.title, 160) || "the previous workout"} for ${formatDateLabel(scheduledDate)}.`
        },
        action: {
          ...action,
          vnext_action_id: pending?.id || null,
          vnext_source_turn_id: pending?.sourceTurnId || null,
          vnext_confirmation_turn_id: clean(currentTurnId, 200) || null
        }
      };
    };

    try {
      Object.defineProperty(adapter, PATCH_FLAG, { value: true, enumerable: false });
    } catch {
      adapter[PATCH_FLAG] = true;
    }
    return true;
  }

  function ensurePatch() {
    if (patchAdapter()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (patchAdapter() || attempts >= 120) window.clearInterval(timer);
    }, 50);
  }

  window.addEventListener("ari:runtimeReady", ensurePatch);
  ensurePatch();
})();
