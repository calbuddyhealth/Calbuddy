// ARI vNext — translate model proposals into existing trusted ARI XP actions.
// The model never writes app data directly. Training mutations are validated
// against the canonical exercise registry and exact date-specific plan first.

(() => {
  "use strict";

  const VERSION = "1.3.0";
  const SOURCE = "ari_vnext_action_adapter";
  const WORKOUT_CONTROLLER_URL = "js/training/workout-plan-controller.js";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  window.AriVNextActionAdapter = {
    version: VERSION,
    source: SOURCE,
    controllerPromise: null,

    toCalBuddyAction(pendingAction = {}) {
      const name = clean(pendingAction?.name, 120);
      const args = object(pendingAction?.arguments);

      if (!name || !pendingAction?.id || !pendingAction?.sourceTurnId) {
        return failure("invalid_pending_action", "The vNext action is missing its turn-bound identity.");
      }

      if (name === "log_meal") return this.mapMeal(pendingAction, args);
      if (name === "log_weight") return this.mapWeight(pendingAction, args);
      if (name === "update_goal") return this.mapGoal(pendingAction, args);
      if (name === "plan_workout") {
        return failure("workout_requires_registry_validation", "Workout plans must be prepared asynchronously against the canonical ARI XP exercise registry.");
      }
      if (name === "edit_workout") {
        return failure("workout_edit_requires_registry_validation", "Workout edits must be prepared asynchronously against the canonical date-specific workout and exercise registry.");
      }

      return failure("unsupported_vnext_action", `Unsupported vNext action: ${name}.`);
    },

    async prepareCalBuddyAction(pendingAction = {}) {
      const name = clean(pendingAction?.name, 120);
      const args = object(pendingAction?.arguments);
      if (name === "plan_workout") return await this.mapWorkoutPlanValidated(pendingAction, args);
      if (name === "edit_workout") return await this.mapWorkoutEditValidated(pendingAction, args);
      return this.toCalBuddyAction(pendingAction);
    },

    async createCalBuddyPendingAction(vnextPendingAction = {}) {
      const mapped = await this.prepareCalBuddyAction(vnextPendingAction);
      if (!mapped.success) return mapped;

      if (typeof CalBuddy.createPendingAction !== "function") {
        return failure("pending_action_service_unavailable", "CalBuddy pending action service is unavailable.");
      }

      const stored = await CalBuddy.createPendingAction(mapped.action);
      const wrapped = {
        ...stored,
        vnext_action_id: vnextPendingAction.id,
        vnext_source_turn_id: vnextPendingAction.sourceTurnId,
        vnext_expires_at: vnextPendingAction.expiresAt || null,
        vnext_source: SOURCE
      };

      CalBuddy.setPendingAction?.(wrapped);
      return { success: true, action: wrapped, resolution: mapped.resolution || null };
    },

    async executeConfirmed({ vnextPendingAction, currentTurnId = null } = {}) {
      const pending = vnextPendingAction;
      if (!pending?.id || !pending?.sourceTurnId) {
        return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
      }

      if (pending?.expiresAt && Date.parse(pending.expiresAt) < Date.now()) {
        return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
      }

      const mapped = await this.prepareCalBuddyAction(pending);
      if (!mapped.success) return mapped;

      if (mapped.action?.action_type === "plan_workout" && mapped.action?.payload?.vnext_prebuilt_workout) {
        return await this.executeValidatedWorkout({ action: mapped.action, pending, currentTurnId });
      }

      if (mapped.action?.action_type === "edit_workout" && mapped.action?.payload?.vnext_prepared_edit) {
        return await this.executeValidatedWorkoutEdit({ action: mapped.action, pending, currentTurnId });
      }

      if (typeof CalBuddy.executeAction !== "function") {
        return failure("action_executor_unavailable", "CalBuddy action executor is unavailable.");
      }

      const action = {
        ...mapped.action,
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
        vnext_source: SOURCE
      };

      const result = await CalBuddy.executeAction(action);
      return { success: result?.success !== false, result, action };
    },

    mapMeal(pending, args) {
      const calories = number(args.calories);
      if (!clean(args.name, 180)) return failure("meal_name_required", "A meal name is required.");
      if (!calories || calories <= 0) {
        return failure("meal_nutrition_required", "Nutrition must be resolved before the meal can be saved.");
      }

      return successAction(pending, {
        action_type: "log_meal",
        payload: {
          name: clean(args.name, 180),
          calories: Math.round(calories),
          category: clean(args.mealCategory, 80) || "Meal",
          protein_g: round1(args.proteinG),
          carbs_g: round1(args.carbsG),
          fat_g: round1(args.fatG),
          serving_size: clean(args.servingSize, 160) || buildServing(args),
          multiplier: 1
        },
        confirmation_text: `Log ${clean(args.name, 120)} (${Math.round(calories)} kcal)?`
      });
    },

    mapWeight(pending, args) {
      const value = number(args.value);
      const unit = clean(args.unit, 12).toLowerCase();
      if (!value || value <= 0) return failure("weight_required", "A valid weight is required.");

      const pounds = unit === "kg" ? value * 2.2046226218 : value;
      return successAction(pending, {
        action_type: "log_weight",
        payload: {
          weight: round1(pounds),
          notes: unit === "kg" ? `Entered as ${round1(value)} kg by Ari vNext.` : "Logged by Ari vNext."
        },
        confirmation_text: `Log your weight as ${round1(value)} ${unit === "kg" ? "kg" : "lb"}?`
      });
    },

    mapGoal(pending, args) {
      const goalType = normalizeGoalType(args.goalType);
      const value = args.value === null || args.value === undefined ? null : number(args.value);
      if (!goalType) return failure("unsupported_goal_type", "That goal change is not mapped to a trusted ARI XP profile field yet.");

      const payload = {};
      if (goalType === "daily_calorie_goal") {
        if (!value || value < 800 || value > 8000) return failure("calorie_goal_out_of_range", "The calorie goal is outside the supported range.");
        payload.daily_calorie_goal = Math.round(value);
      }
      if (goalType === "target_weight") {
        if (!value || value <= 0 || value > 1500) return failure("target_weight_out_of_range", "The target weight is outside the supported range.");
        payload.target_weight_lbs = clean(args.unit, 12).toLowerCase() === "kg" ? round1(value * 2.2046226218) : round1(value);
      }
      if (goalType === "weekly_weight_change") {
        if (value === null || Math.abs(value) > 10) return failure("weekly_change_out_of_range", "The weekly weight change is outside the supported range.");
        // ARI XP stores this as magnitude; goal mode supplies lose/gain direction.
        payload.weekly_weight_change_goal = Math.abs(value);
      }
      if (goalType === "goal_mode") {
        const instruction = clean(args.instruction, 200).toLowerCase();
        const mode = /\b(cut|lose|loss)\b/.test(instruction)
          ? "lose"
          : /\b(bulk|gain)\b/.test(instruction)
            ? "gain"
            : /\b(maintain|maintenance)\b/.test(instruction)
              ? "maintain"
              : null;
        if (!mode) return failure("goal_mode_required", "A clear goal mode is required.");
        payload.goal = mode;
      }

      return successAction(pending, {
        action_type: "update_goal_profile",
        payload,
        confirmation_text: `Update your ${goalType.replaceAll("_", " ")}?`
      });
    },

    async mapWorkoutPlanValidated(pending, args) {
      const scheduledDate = resolveDate(args.dateText);
      if (!scheduledDate) return failure("workout_date_required", "An exact workout date is required before ARI XP can save the plan.");

      const requestedExercises = Array.isArray(args.exercises) ? args.exercises.slice(0, 16) : [];
      if (!requestedExercises.length) return failure("workout_exercises_required", "Ari needs at least one exercise before this workout can be saved.");

      let controller;
      try {
        controller = await this.getWorkoutController();
      } catch (error) {
        return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
      }

      const focus = resolveFocus(args.focus);
      const duration = clampNumber(args.durationMinutes, 10, 180, 45);
      const difficulty = ["beginner", "intermediate", "advanced"].includes(clean(args.difficulty, 40).toLowerCase())
        ? clean(args.difficulty, 40).toLowerCase()
        : "intermediate";
      const resolved = [];
      const unresolved = [];
      const usedIds = new Set();

      for (const request of requestedExercises) {
        const match = resolveCanonicalExercise(controller, request?.name);
        if (!match.accepted || !match.exercise?.id) {
          unresolved.push({ requested: clean(request?.name, 160), candidates: match.candidates });
          continue;
        }
        if (usedIds.has(match.exercise.id)) continue;
        usedIds.add(match.exercise.id);
        resolved.push({ request, exercise: match.exercise, match: match.match });
      }

      if (unresolved.length) {
        return {
          success: false,
          code: "workout_exercise_resolution_required",
          message: `I couldn't safely match ${unresolved.length} exercise${unresolved.length === 1 ? "" : "s"} to the ARI XP exercise library.`,
          unresolved
        };
      }
      if (!resolved.length) return failure("workout_exercises_unresolved", "None of the proposed exercises could be validated against ARI XP's exercise library.");

      const mainCount = resolved.length <= 3 ? resolved.length : Math.ceil(resolved.length * 0.6);
      const blocks = [
        makeWorkoutBlock("main", "Main Work", resolved.slice(0, mainCount), 0),
        makeWorkoutBlock("accessory", "Accessory Work", resolved.slice(mainCount), mainCount)
      ].filter((block) => block.exercises.length);

      const workout = {
        workoutId: makeStableId("ari_vnext_workout"),
        title: focus.title,
        type: resolveWorkoutType(focus),
        goal: focus.goal,
        secondaryGoals: [],
        sport: null,
        difficulty,
        plannedDurationMinutes: duration,
        estimatedDurationMinutes: duration,
        bodyParts: [...focus.bodyParts],
        muscles: [],
        movementPatterns: [],
        equipment: [],
        blocks,
        notes: compactNotes(args),
        metadata: {
          version: VERSION,
          source: "ari-vnext-validated-workout",
          createdAt: new Date().toISOString(),
          requestedDurationMinutes: duration,
          selectedExerciseCount: resolved.length,
          registryValidated: true,
          vnextActionId: pending.id,
          vnextSourceTurnId: pending.sourceTurnId
        }
      };

      return {
        ...successAction(pending, {
          action_type: "plan_workout",
          source: SOURCE,
          payload: {
            scheduled_date: scheduledDate,
            focus_id: focus.id,
            existing_workout_mode: "create",
            requested_from_message: pending.sourceMessage || "",
            vnext_prebuilt_workout: workout
          },
          confirmation_text: `Create Ari's ${focus.title} with ${resolved.length} validated exercise${resolved.length === 1 ? "" : "s"} for ${formatDateLabel(scheduledDate)}?`
        }),
        resolution: {
          registryValidated: true,
          exercises: resolved.map(({ request, exercise, match }) => ({
            requested: clean(request?.name, 160),
            exerciseId: exercise.id,
            canonicalName: exercise.name,
            match
          }))
        }
      };
    },

    async mapWorkoutEditValidated(pending, args) {
      const scheduledDate = resolveDate(args.dateText);
      if (!scheduledDate) return failure("workout_edit_date_required", "An exact workout date is required before Ari can edit the plan.");

      let controller;
      try {
        controller = await this.getWorkoutController();
      } catch (error) {
        return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
      }

      const day = controller.getDate(scheduledDate);
      if (!hasWorkout(day)) {
        return failure("workout_edit_target_missing", `There isn't a workout to edit on ${formatDateLabel(scheduledDate)}.`);
      }
      if (day?.completed === true || day?.progress?.completed === true) {
        return failure("workout_edit_completed_session", "A completed workout cannot be rewritten through Ari vNext.");
      }

      const operation = clean(args.operation, 40).toLowerCase();
      const targetQuery = clean(args.exercise, 180);
      const target = targetQuery ? resolveDayExercise(controller, day, targetQuery) : null;
      const patch = prescriptionPatch(args);
      const prepared = {
        version: VERSION,
        scheduledDate,
        operation,
        targetExerciseId: target?.accepted ? target.exerciseId : null,
        targetIndex: target?.accepted ? target.index : null,
        targetName: target?.accepted ? target.name : null,
        replacementExerciseId: null,
        replacementName: null,
        patch,
        position: args.position === null || args.position === undefined ? null : clampInteger(args.position, 1, Math.max(1, day.exercises.length + 1), 1),
        durationMinutes: args.durationMinutes === null || args.durationMinutes === undefined ? null : clampNumber(args.durationMinutes, 10, 240, null),
        title: clean(args.title, 160) || null,
        originalExerciseCount: day.exercises.length
      };

      if (["remove", "replace", "move"].includes(operation) || (operation === "update" && targetQuery)) {
        if (!target?.accepted) {
          return {
            success: false,
            code: "workout_edit_target_resolution_required",
            message: `I couldn't safely match ${targetQuery || "that exercise"} to one exercise in ${formatDateLabel(scheduledDate)}'s workout.`,
            candidates: target?.candidates || dayExerciseCandidates(controller, day)
          };
        }
      }

      if (operation === "add") {
        const requested = clean(args.replacementExercise || args.exercise, 180);
        const match = resolveCanonicalExercise(controller, requested);
        if (!match.accepted || !match.exercise?.id) {
          return { success: false, code: "workout_edit_add_resolution_required", message: `I couldn't safely match ${requested || "that exercise"} to the ARI XP exercise library.`, candidates: match.candidates };
        }
        if (day.exercises.some((entry) => clean(entry?.exerciseId, 120) === match.exercise.id)) {
          return failure("workout_edit_duplicate_exercise", `${match.exercise.name} is already in that workout.`);
        }
        prepared.replacementExerciseId = match.exercise.id;
        prepared.replacementName = match.exercise.name;
      }

      if (operation === "replace") {
        const requested = clean(args.replacementExercise, 180);
        const match = resolveCanonicalExercise(controller, requested);
        if (!match.accepted || !match.exercise?.id) {
          return { success: false, code: "workout_edit_replacement_resolution_required", message: `I couldn't safely match ${requested || "that replacement"} to the ARI XP exercise library.`, candidates: match.candidates };
        }
        if (match.exercise.id !== prepared.targetExerciseId && day.exercises.some((entry) => clean(entry?.exerciseId, 120) === match.exercise.id)) {
          return failure("workout_edit_duplicate_replacement", `${match.exercise.name} is already in that workout.`);
        }
        prepared.replacementExerciseId = match.exercise.id;
        prepared.replacementName = match.exercise.name;
      }

      if (operation === "update" && !targetQuery && !prepared.title && prepared.durationMinutes === null) {
        return failure("workout_edit_update_fields_required", "Ari needs a specific workout detail to update.");
      }

      const confirmation = editConfirmation(prepared, day);
      return {
        ...successAction(pending, {
          action_type: "edit_workout",
          source: SOURCE,
          payload: {
            scheduled_date: scheduledDate,
            requested_from_message: pending.sourceMessage || "",
            vnext_prepared_edit: prepared
          },
          confirmation_text: confirmation
        }),
        resolution: {
          registryValidated: true,
          operation,
          scheduledDate,
          target: prepared.targetName ? { exerciseId: prepared.targetExerciseId, canonicalName: prepared.targetName, index: prepared.targetIndex } : null,
          replacement: prepared.replacementName ? { exerciseId: prepared.replacementExerciseId, canonicalName: prepared.replacementName } : null
        }
      };
    },

    async executeValidatedWorkout({ action, pending, currentTurnId = null } = {}) {
      let controller;
      try {
        controller = await this.getWorkoutController();
      } catch (error) {
        return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
      }

      const payload = object(action?.payload);
      const scheduledDate = clean(payload.scheduled_date, 20);
      const workout = object(payload.vnext_prebuilt_workout);
      if (!scheduledDate || !workout?.workoutId || !Array.isArray(workout.blocks)) return failure("invalid_validated_workout", "The validated workout payload is incomplete.");

      const existing = controller.getDate(scheduledDate);
      if (hasWorkout(existing)) {
        return {
          success: false,
          conflict: true,
          code: "workout_date_conflict",
          message: `${clean(existing.title, 160) || "A workout"} is already planned for ${formatDateLabel(scheduledDate)}. I didn't overwrite it.`,
          existingWorkout: { date: scheduledDate, title: clean(existing.title, 160) || "Workout", exerciseCount: existing.exercises.length }
        };
      }

      const exerciseEntries = workout.blocks.flatMap((block) => Array.isArray(block?.exercises) ? block.exercises : []);
      for (const entry of exerciseEntries) {
        if (!entry?.exerciseId || !controller.getExercise(entry.exerciseId)) return failure("workout_registry_revalidation_failed", "One of Ari's workout exercises is no longer available in the canonical exercise registry.");
      }

      const saved = controller.setBuiltWorkoutForDate(scheduledDate, workout, { focusId: clean(payload.focus_id, 100) || "custom" });
      if (!saved) return failure("workout_save_failed", "Training could not save the validated workout.");

      const remoteSaved = await controller.save({ remote: true });
      if (remoteSaved === false) return failure("workout_remote_save_failed", "The workout was prepared locally but ARI XP could not safely confirm the remote save.");

      dispatchWorkoutUpdate({ scheduledDate, mode: "create", pending, currentTurnId });
      return {
        success: true,
        result: { workout, scheduled_date: scheduledDate, reply: `${clean(workout.title, 160) || "Workout"} is set for ${formatDateLabel(scheduledDate)}.` },
        action: decorateExecutedAction(action, pending, currentTurnId)
      };
    },

    async executeValidatedWorkoutEdit({ action, pending, currentTurnId = null } = {}) {
      let controller;
      try {
        controller = await this.getWorkoutController();
      } catch (error) {
        return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
      }

      const payload = object(action?.payload);
      const prepared = object(payload.vnext_prepared_edit);
      const scheduledDate = clean(prepared.scheduledDate || payload.scheduled_date, 20);
      const operation = clean(prepared.operation, 40).toLowerCase();
      if (!scheduledDate || !operation) return failure("invalid_validated_workout_edit", "The validated workout edit is incomplete.");

      const day = controller.getDate(scheduledDate);
      if (!hasWorkout(day)) return failure("workout_edit_target_missing", `There isn't a workout to edit on ${formatDateLabel(scheduledDate)}.`);
      if (day?.completed === true || day?.progress?.completed === true) return failure("workout_edit_completed_session", "A completed workout cannot be rewritten through Ari vNext.");

      let changed = false;
      let targetIndex = null;
      if (prepared.targetExerciseId) {
        targetIndex = revalidateTargetIndex(day, prepared.targetExerciseId, prepared.targetIndex);
        if (targetIndex === null) return failure("workout_edit_target_changed", "That workout changed after Ari prepared the edit. Ask Ari to prepare the edit again.");
      }

      if (operation === "add") {
        if (!prepared.replacementExerciseId || !controller.getExercise(prepared.replacementExerciseId)) return failure("workout_edit_registry_revalidation_failed", "The exercise to add is no longer available in the canonical registry.");
        changed = controller.addExercise(scheduledDate, prepared.replacementExerciseId, prepared.patch || {});
        if (changed && prepared.position !== null) {
          const refreshed = controller.getDate(scheduledDate);
          const newIndex = refreshed.exercises.findIndex((entry) => clean(entry?.exerciseId, 120) === prepared.replacementExerciseId);
          if (newIndex >= 0 && prepared.position - 1 !== newIndex) changed = moveExercise(controller, scheduledDate, refreshed, newIndex, prepared.position - 1);
        }
      }

      if (operation === "remove") {
        changed = controller.removeExercise(scheduledDate, targetIndex);
      }

      if (operation === "replace") {
        if (!prepared.replacementExerciseId || !controller.getExercise(prepared.replacementExerciseId)) return failure("workout_edit_registry_revalidation_failed", "The replacement exercise is no longer available in the canonical registry.");
        changed = controller.updateExercise(scheduledDate, targetIndex, { exerciseId: prepared.replacementExerciseId, ...(prepared.patch || {}) });
      }

      if (operation === "move") {
        changed = moveExercise(controller, scheduledDate, day, targetIndex, Math.max(0, Math.min(day.exercises.length - 1, Number(prepared.position || 1) - 1)));
      }

      if (operation === "update") {
        const results = [];
        if (targetIndex !== null && prepared.patch && Object.keys(prepared.patch).length) results.push(controller.updateExercise(scheduledDate, targetIndex, prepared.patch));
        if (prepared.title) results.push(controller.setDateTitle(scheduledDate, prepared.title));
        if (prepared.durationMinutes !== null && prepared.durationMinutes !== undefined) results.push(controller.setDateDuration(scheduledDate, prepared.durationMinutes));
        changed = results.length > 0 && results.every(Boolean);
      }

      if (!changed) return failure("workout_edit_save_failed", "Training could not apply that workout edit safely.");

      const remoteSaved = await controller.save({ remote: true });
      if (remoteSaved === false) return failure("workout_edit_remote_save_failed", "The edit was prepared locally but ARI XP could not safely confirm the remote save.");

      const updated = controller.getDate(scheduledDate);
      dispatchWorkoutUpdate({ scheduledDate, mode: "edit", pending, currentTurnId, operation });

      return {
        success: true,
        result: {
          workout: updated,
          scheduled_date: scheduledDate,
          operation,
          reply: workoutEditSuccessText(prepared, updated)
        },
        action: decorateExecutedAction(action, pending, currentTurnId)
      };
    },

    async getWorkoutController() {
      if (!this.controllerPromise) {
        this.controllerPromise = import(new URL(WORKOUT_CONTROLLER_URL, document.baseURI).href)
          .then(async (module) => {
            const controller = module.default || module.AriTrainingWorkoutPlanController;
            if (
              !controller?.init || !controller?.getDate || !controller?.getExercise || !controller?.findExercises ||
              !controller?.setBuiltWorkoutForDate || !controller?.addExercise || !controller?.updateExercise ||
              !controller?.removeExercise || !controller?.setDate || !controller?.save
            ) {
              throw new Error("Canonical ARI Training controller is missing required capabilities.");
            }
            await controller.init();
            return controller;
          })
          .catch((error) => {
            this.controllerPromise = null;
            throw error;
          });
      }
      return await this.controllerPromise;
    }
  };

  window.Ari.vNextActionAdapter = window.AriVNextActionAdapter;

  function makeWorkoutBlock(id, label, entries, startingIndex) {
    return {
      id,
      label,
      type: id,
      exercises: entries.map(({ request, exercise }, localIndex) => ({
        entryId: makeStableId("vnext_entry"),
        exerciseId: exercise.id,
        role: startingIndex + localIndex === 0 ? "primary" : id === "main" ? "main" : "accessory",
        prescription: {
          mode: "sets_reps",
          sets: clampInteger(request?.sets, 1, 12, id === "main" ? 4 : 3),
          reps: clampInteger(request?.reps, 1, 100, id === "main" ? 8 : 12),
          restSeconds: clampNumber(request?.restSeconds, 0, 900, id === "main" ? 90 : 60),
          weight: null,
          intensity: null
        },
        metadata: { source: "ari-vnext", canonicalName: exercise.name, userVisibleNotes: clean(request?.notes, 300) || null }
      }))
    };
  }

  function resolveCanonicalExercise(controller, requestedName) {
    const query = clean(requestedName, 180);
    if (!query) return { accepted: false, exercise: null, match: "missing", candidates: [] };

    const exact = controller.getExercise(query);
    if (exact?.id) return { accepted: true, exercise: exact, match: "registry_exact", candidates: [exact.name] };

    const results = controller.findExercises(query, { limit: 4, fuzzy: true }) || [];
    const candidates = results.map((item) => item?.name).filter(Boolean).slice(0, 4);
    const top = results[0];
    if (!top?.id) return { accepted: false, exercise: null, match: "none", candidates };

    const reasons = Array.isArray(top.searchReasons) ? top.searchReasons : [];
    const score = Number(top.searchScore || 0);
    const accepted = reasons.some((reason) => ["exact_id", "exact_name", "exact_alias", "name_starts_with_query", "alias_starts_with_query"].includes(reason)) || score >= 6500;
    return { accepted, exercise: accepted ? top : null, match: accepted ? reasons[0] || `score_${score}` : "ambiguous", candidates };
  }

  function resolveDayExercise(controller, day, queryValue) {
    const query = normalize(queryValue);
    const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
    const candidates = dayExerciseCandidates(controller, day);
    if (!query) return { accepted: false, candidates };

    const directMatches = exercises
      .map((entry, index) => ({ entry, index, canonical: controller.getExercise(entry?.exerciseId) }))
      .filter(({ entry, canonical }) => {
        const id = normalize(entry?.exerciseId);
        const name = normalize(canonical?.name || entry?.name || entry?.title);
        return query === id || query === name;
      });
    if (directMatches.length === 1) return dayMatch(directMatches[0]);

    const registry = resolveCanonicalExercise(controller, queryValue);
    if (registry.accepted && registry.exercise?.id) {
      const byId = exercises
        .map((entry, index) => ({ entry, index, canonical: controller.getExercise(entry?.exerciseId) }))
        .filter(({ entry }) => clean(entry?.exerciseId, 120) === registry.exercise.id);
      if (byId.length === 1) return dayMatch(byId[0]);
    }

    const contains = exercises
      .map((entry, index) => ({ entry, index, canonical: controller.getExercise(entry?.exerciseId) }))
      .filter(({ entry, canonical }) => normalize(canonical?.name || entry?.name || entry?.title).includes(query));
    if (contains.length === 1) return dayMatch(contains[0]);

    return { accepted: false, candidates };
  }

  function dayMatch(item) {
    return {
      accepted: true,
      index: item.index,
      exerciseId: clean(item.entry?.exerciseId, 120),
      name: clean(item.canonical?.name || item.entry?.name || item.entry?.title || item.entry?.exerciseId, 180)
    };
  }

  function dayExerciseCandidates(controller, day) {
    return (Array.isArray(day?.exercises) ? day.exercises : [])
      .map((entry) => clean(controller.getExercise(entry?.exerciseId)?.name || entry?.name || entry?.title || entry?.exerciseId, 160))
      .filter(Boolean)
      .slice(0, 20);
  }

  function prescriptionPatch(args) {
    const patch = {};
    if (args?.sets !== null && args?.sets !== undefined) patch.sets = clampInteger(args.sets, 1, 12, 3);
    if (args?.reps !== null && args?.reps !== undefined) patch.reps = clampInteger(args.reps, 1, 100, 10);
    if (args?.restSeconds !== null && args?.restSeconds !== undefined) patch.restSeconds = clampNumber(args.restSeconds, 0, 900, 60);
    return patch;
  }

  function revalidateTargetIndex(day, exerciseId, preparedIndex) {
    const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
    const exactIndex = Number(preparedIndex);
    if (Number.isInteger(exactIndex) && exactIndex >= 0 && exactIndex < exercises.length && clean(exercises[exactIndex]?.exerciseId, 120) === exerciseId) return exactIndex;
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

  function editConfirmation(prepared, day) {
    const label = formatDateLabel(prepared.scheduledDate);
    if (prepared.operation === "add") return `Add ${prepared.replacementName} to ${label}'s workout?`;
    if (prepared.operation === "remove") return `Remove ${prepared.targetName} from ${label}'s workout?`;
    if (prepared.operation === "replace") return `Replace ${prepared.targetName} with ${prepared.replacementName} on ${label}?`;
    if (prepared.operation === "move") return `Move ${prepared.targetName} to position ${prepared.position} on ${label}?`;
    if (prepared.operation === "update" && prepared.targetName) {
      const details = describePrescriptionPatch(prepared.patch);
      return `Update ${prepared.targetName}${details ? ` to ${details}` : ""} on ${label}?`;
    }
    const details = [prepared.title ? `title to “${prepared.title}”` : "", prepared.durationMinutes ? `duration to ${prepared.durationMinutes} minutes` : ""].filter(Boolean).join(" and ");
    return `Update ${clean(day?.title, 140) || "the workout"}${details ? ` — ${details}` : ""} on ${label}?`;
  }

  function describePrescriptionPatch(patch = {}) {
    return [
      patch.sets ? `${patch.sets} sets` : "",
      patch.reps ? `${patch.reps} reps` : "",
      patch.restSeconds !== undefined ? `${patch.restSeconds}s rest` : ""
    ].filter(Boolean).join(", ");
  }

  function workoutEditSuccessText(prepared, updated) {
    const label = formatDateLabel(prepared.scheduledDate);
    if (prepared.operation === "add") return `${prepared.replacementName} is added to ${label}'s workout.`;
    if (prepared.operation === "remove") return `${prepared.targetName} is removed from ${label}'s workout.`;
    if (prepared.operation === "replace") return `${prepared.targetName} is replaced with ${prepared.replacementName} on ${label}.`;
    if (prepared.operation === "move") return `${prepared.targetName} is moved to position ${prepared.position} on ${label}.`;
    if (prepared.operation === "update" && prepared.targetName) return `${prepared.targetName} is updated on ${label}.`;
    return `${clean(updated?.title, 160) || "The workout"} is updated for ${label}.`;
  }

  function dispatchWorkoutUpdate({ scheduledDate, mode, pending, currentTurnId, operation = null }) {
    window.dispatchEvent(new CustomEvent("ari:workoutPlanUpdated", {
      detail: {
        scheduledDate,
        mode,
        operation,
        source: SOURCE,
        version: VERSION,
        vnextActionId: pending?.id || null,
        confirmationTurnId: clean(currentTurnId, 200) || null
      }
    }));
  }

  function decorateExecutedAction(action, pending, currentTurnId) {
    return {
      ...action,
      vnext_action_id: pending?.id || null,
      vnext_source_turn_id: pending?.sourceTurnId || null,
      vnext_confirmation_turn_id: clean(currentTurnId, 200) || null
    };
  }

  function successAction(pending, action) {
    return {
      success: true,
      action: {
        ...action,
        status: "pending",
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_expires_at: pending.expiresAt || null
      }
    };
  }

  function failure(code, message) {
    return { success: false, code, message };
  }

  function hasWorkout(day) {
    return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0);
  }

  function normalizeGoalType(value) {
    const text = clean(value, 80).toLowerCase().replace(/[\s-]+/g, "_");
    const aliases = {
      calorie_goal: "daily_calorie_goal",
      calories: "daily_calorie_goal",
      daily_calories: "daily_calorie_goal",
      daily_calorie_goal: "daily_calorie_goal",
      target_weight: "target_weight",
      goal_weight: "target_weight",
      weekly_weight_change: "weekly_weight_change",
      weekly_change: "weekly_weight_change",
      goal_mode: "goal_mode",
      goal: "goal_mode"
    };
    return aliases[text] || null;
  }

  function resolveFocus(value) {
    const text = clean(value, 160).toLowerCase();
    const rules = [
      { test: /chest|pec/, id: "chest", title: "Chest Workout", goal: "muscle_building", bodyParts: ["chest"] },
      { test: /back|lat/, id: "back", title: "Back Workout", goal: "muscle_building", bodyParts: ["back"] },
      { test: /shoulder|delt/, id: "shoulders", title: "Shoulder Workout", goal: "muscle_building", bodyParts: ["shoulders"] },
      { test: /bicep/, id: "biceps", title: "Biceps Workout", goal: "muscle_building", bodyParts: ["arms"] },
      { test: /tricep/, id: "triceps", title: "Triceps Workout", goal: "muscle_building", bodyParts: ["arms"] },
      { test: /leg|lower body|quad|hamstring|glute/, id: "legs", title: "Lower Body Workout", goal: "lower_body_strength", bodyParts: ["lower_body"] },
      { test: /core|abs/, id: "core", title: "Core Workout", goal: "core_strength", bodyParts: ["core"] },
      { test: /cardio|conditioning|run/, id: "cardio", title: "Cardio Workout", goal: "cardio", bodyParts: [] },
      { test: /mobility|stretch/, id: "mobility", title: "Mobility Workout", goal: "mobility", bodyParts: [] },
      { test: /full body|total body/, id: "full_body", title: "Full Body Workout", goal: "general_fitness", bodyParts: [] }
    ];
    return rules.find((rule) => rule.test.test(text)) || {
      id: "custom",
      title: text ? `${text.charAt(0).toUpperCase()}${text.slice(1)} Workout` : "Workout",
      goal: "general_fitness",
      bodyParts: []
    };
  }

  function resolveWorkoutType(focus) {
    if (focus?.goal === "cardio") return "cardio";
    if (focus?.goal === "mobility") return "mobility";
    return "strength";
  }

  function resolveDate(value) {
    const text = clean(value, 120).toLowerCase();
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

    const slash = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slash) {
      let year = slash[3] ? Number(slash[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      let result = validDate(year, Number(slash[1]), Number(slash[2]));
      if (result && !slash[3] && fromIso(result) < base) result = validDate(year + 1, Number(slash[1]), Number(slash[2]));
      return result;
    }

    if (/\btoday\b/.test(text)) return toIso(base);
    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return toIso(date);
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let target = 0; target < weekdays.length; target += 1) {
      const match = text.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;
      let delta = (target - base.getDay() + 7) % 7;
      if (clean(match[1], 20).toLowerCase() === "next" && delta === 0) delta = 7;
      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return toIso(date);
    }

    return null;
  }

  function validDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return toIso(date);
  }

  function toIso(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function fromIso(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDateLabel(value) {
    const date = fromIso(value);
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date);
  }

  function compactNotes(args) {
    return [clean(args?.warmup, 400), clean(args?.finisher, 400), clean(args?.notes, 600)].filter(Boolean).join(" · ").slice(0, 1000) || null;
  }

  function buildServing(args) {
    const quantity = number(args?.quantity);
    const unit = clean(args?.unit, 80);
    if (quantity && unit) return `${quantity} ${unit}`;
    return unit || "1 serving";
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function clean(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
  }

  function normalize(value) {
    return clean(value, 240).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    const parsed = number(value);
    return parsed === null ? 0 : Math.round(parsed * 10) / 10;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = number(value);
    if (parsed === null) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function clampInteger(value, min, max, fallback) {
    const parsed = number(value);
    if (parsed === null) return fallback;
    return Math.round(Math.min(max, Math.max(min, parsed)));
  }

  function makeStableId(prefix) {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
})();
