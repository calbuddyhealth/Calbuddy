// ARI vNext — canonical trusted operation registry.
//
// Permanent cutovers are migrated one operation at a time. Unmigrated
// operations continue through the existing trusted adapter until their callers
// and regression contracts are proven independently. This prevents another
// all-at-once adapter deletion while converging on one execution system.

(() => {
  "use strict";

  const VERSION = "1.7.0";
  const SOURCE = "ari_vnext_operation_registry";
  const INSTALL_FLAG = "__ariOperationRegistryV1";
  const OWNED_OPERATIONS = new Set(["log_meal", "log_weight", "log_activity", "update_goal", "log_planned_meal", "plan_meal", "plan_workout", "cancel_workout"]);

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 240) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    const parsed = finite(value);
    return parsed === null ? null : Math.round(parsed * 10) / 10;
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function validPendingIdentity(pending = {}) {
    return Boolean(pending?.id && pending?.sourceTurnId);
  }

  function pendingArguments(pending = {}) {
    return pending?.arguments && typeof pending.arguments === "object" && !Array.isArray(pending.arguments)
      ? pending.arguments
      : {};
  }

  function isIsoDate(value) {
    const text = clean(value, 20);
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(text)) return false;
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function hasWorkout(day = {}) {
    return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0);
  }

  function workoutFingerprint(day = {}) {
    const workoutId = clean(day?.workoutId || day?.id, 220);
    const title = clean(day?.title, 180);
    const exercises = (Array.isArray(day?.exercises) ? day.exercises : [])
      .map((entry) => clean(entry?.exerciseId || entry?.id, 160))
      .filter(Boolean);
    return `${workoutId}|${title}|${exercises.join(",")}`;
  }

  function formatDateLabel(value = "") {
    const [year, month, day] = clean(value, 20).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return clean(value, 20) || "that date";
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date);
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

  function isResolvedMeal(args = {}) {
    const calories = finite(args?.calories);
    const protein = finite(args?.proteinG);
    const carbs = finite(args?.carbsG);
    const fat = finite(args?.fatG);

    return Boolean(
      clean(args?.name, 180) &&
      calories !== null && calories > 0 && calories <= 10000 &&
      protein !== null && protein >= 0 && protein <= 1000 &&
      carbs !== null && carbs >= 0 && carbs <= 1500 &&
      fat !== null && fat >= 0 && fat <= 1000
    );
  }

  function servingLabel(args = {}) {
    const explicit = clean(args?.servingSize, 160);
    if (explicit) return explicit;
    const quantity = finite(args?.quantity);
    const unit = clean(args?.unit, 80);
    if (quantity !== null && quantity > 0 && unit) return `${quantity} ${unit}`;
    return "1 serving";
  }

  function prepareLogMeal(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The meal action is missing its turn-bound identity.");
    }

    const args = pendingArguments(pending);
    if (!isResolvedMeal(args)) {
      return failure(
        "meal_nutrition_required",
        "Nutrition must be resolved before the meal can be saved."
      );
    }

    const calories = Math.round(finite(args.calories));
    const name = clean(args.name, 180);

    return {
      success: true,
      action: {
        action_type: "log_meal",
        payload: {
          name,
          calories,
          category: clean(args.mealCategory, 80) || "Meal",
          protein_g: round1(args.proteinG),
          carbs_g: round1(args.carbsG),
          fat_g: round1(args.fatG),
          serving_size: servingLabel(args),
          multiplier: 1,
          notes: clean(args.notes, 500)
        },
        confirmation_text: `Log ${clean(name, 120)} (${calories} kcal)?`
      },
      resolution: {
        operation: "log_meal",
        resolvedNutrition: true,
        source: SOURCE
      }
    };
  }

  function prepareLogWeight(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The weight action is missing its turn-bound identity.");
    }

    const args = pendingArguments(pending);
    const value = finite(args?.value);
    const unit = clean(args?.unit, 12).toLowerCase();

    if (value === null || value <= 0 || value > 1500) {
      return failure("weight_out_of_range", "A valid weight is required.");
    }

    const normalizedUnit = unit === "kg" ? "kg" : "lb";
    const pounds = normalizedUnit === "kg" ? value * 2.2046226218 : value;

    return {
      success: true,
      action: {
        action_type: "log_weight",
        payload: {
          weight: round1(pounds),
          notes: normalizedUnit === "kg"
            ? `Entered as ${round1(value)} kg by Ari vNext.`
            : "Logged by Ari vNext."
        },
        confirmation_text: `Log your weight as ${round1(value)} ${normalizedUnit}?`
      },
      resolution: {
        operation: "log_weight",
        unit: normalizedUnit,
        normalizedWeightLb: round1(pounds),
        source: SOURCE
      }
    };
  }

  async function prepareLogActivity(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The activity action is missing its turn-bound identity.");
    }

    const preparer = window.AriVNextActivityAdapter?.prepare;
    if (typeof preparer !== "function") {
      return failure("activity_preparer_unavailable", "The canonical Training activity preparer is unavailable.");
    }

    const args = pendingArguments(pending);
    const prepared = await preparer(pending, args);

    if (!prepared?.success || prepared?.action?.action_type !== "log_activity") {
      return failure(
        prepared?.code || "activity_prepare_failed",
        prepared?.message || "That activity could not be prepared safely."
      );
    }

    return {
      ...prepared,
      resolution: {
        ...(prepared?.resolution || {}),
        operation: "log_activity",
        source: SOURCE
      }
    };
  }

  function prepareUpdateGoal(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The goal action is missing its turn-bound identity.");
    }

    const args = pendingArguments(pending);
    const goalType = normalizeGoalType(args?.goalType);
    const value = args?.value === null || args?.value === undefined ? null : finite(args.value);

    if (!goalType) {
      return failure("unsupported_goal_type", "That goal change is not mapped to a trusted ARI XP profile field yet.");
    }

    const payload = {};
    if (goalType === "daily_calorie_goal") {
      if (value === null || value < 800 || value > 8000) {
        return failure("calorie_goal_out_of_range", "The calorie goal is outside the supported range.");
      }
      payload.daily_calorie_goal = Math.round(value);
    }

    if (goalType === "target_weight") {
      if (value === null || value <= 0 || value > 1500) {
        return failure("target_weight_out_of_range", "The target weight is outside the supported range.");
      }
      payload.target_weight_lbs = clean(args?.unit, 12).toLowerCase() === "kg"
        ? round1(value * 2.2046226218)
        : round1(value);
    }

    if (goalType === "weekly_weight_change") {
      if (value === null || Math.abs(value) > 10) {
        return failure("weekly_change_out_of_range", "The weekly weight change is outside the supported range.");
      }
      payload.weekly_weight_change_goal = Math.abs(value);
    }

    if (goalType === "goal_mode") {
      const instruction = clean(args?.instruction, 200).toLowerCase();
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

    return {
      success: true,
      action: {
        action_type: "update_goal_profile",
        payload,
        confirmation_text: `Update your ${goalType.replaceAll("_", " ")}?`
      },
      resolution: {
        operation: "update_goal",
        goalType,
        source: SOURCE
      }
    };
  }

  async function prepareLogPlannedMeal(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The planned meal action is missing its turn-bound identity.");
    }

    const adapter = window.AriVNextActionAdapter;
    const preparer = adapter?.prepareCalBuddyAction;
    if (typeof preparer !== "function") {
      return failure("meal_plan_preparer_unavailable", "The canonical Meal Plan preparer is unavailable.");
    }

    const prepared = await preparer.call(adapter, pending);
    if (!prepared?.success || prepared?.action?.action_type !== "log_planned_meal") {
      return failure(
        prepared?.code || "planned_meal_prepare_failed",
        prepared?.message || "That planned meal could not be prepared safely."
      );
    }

    return {
      ...prepared,
      resolution: {
        ...(prepared?.resolution || {}),
        operation: "log_planned_meal",
        source: SOURCE
      }
    };
  }

  async function preparePlanMeal(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The Meal Plan action is missing its turn-bound identity.");
    }

    const adapter = window.AriVNextActionAdapter;
    const preparer = adapter?.prepareCalBuddyAction;
    if (typeof preparer !== "function") {
      return failure("meal_plan_preparer_unavailable", "The canonical Meal Plan preparer is unavailable.");
    }

    const prepared = await preparer.call(adapter, pending);
    if (!prepared?.success || prepared?.action?.action_type !== "plan_meal") {
      return failure(
        prepared?.code || "meal_plan_prepare_failed",
        prepared?.message || "That Meal Plan could not be prepared safely."
      );
    }

    return {
      ...prepared,
      resolution: {
        ...(prepared?.resolution || {}),
        operation: "plan_meal",
        source: SOURCE
      }
    };
  }

  async function preparePlanWorkout(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The workout plan is missing its turn-bound identity.");
    }

    const adapter = window.AriVNextActionAdapter;
    const preparer = adapter?.mapWorkoutPlanValidated;
    if (typeof preparer !== "function") {
      return failure("workout_preparer_unavailable", "The canonical Training workout preparer is unavailable.");
    }

    const prepared = await preparer.call(adapter, pending, pendingArguments(pending));
    if (
      !prepared?.success ||
      prepared?.action?.action_type !== "plan_workout" ||
      !prepared?.action?.payload?.vnext_prebuilt_workout
    ) {
      return failure(
        prepared?.code || "workout_prepare_failed",
        prepared?.message || "That workout could not be prepared safely."
      );
    }

    return {
      ...prepared,
      resolution: {
        ...(prepared?.resolution || {}),
        operation: "plan_workout",
        source: SOURCE
      }
    };
  }

  async function prepareCancelWorkout(pending = {}) {
    if (!validPendingIdentity(pending)) {
      return failure("invalid_pending_action", "The workout cancellation is missing its turn-bound identity.");
    }

    const args = pendingArguments(pending);
    const scheduledDate = clean(args?.scheduledDate, 20);
    if (!isIsoDate(scheduledDate)) {
      return failure("workout_cancel_exact_date_required", "An exact workout date is required before Ari can cancel the plan.");
    }

    const adapter = window.AriVNextActionAdapter;
    const getController = adapter?.getWorkoutController;
    if (typeof getController !== "function") {
      return failure("workout_controller_unavailable", "The canonical Training workout controller is unavailable.");
    }

    let controller;
    try {
      controller = await getController.call(adapter);
    } catch (error) {
      return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
    }

    if (typeof controller?.getDate !== "function" || typeof controller?.clearDate !== "function" || typeof controller?.save !== "function") {
      return failure("workout_cancel_executor_unavailable", "The canonical Training cancellation path is unavailable.");
    }

    const day = controller.getDate(scheduledDate);
    if (!hasWorkout(day)) {
      return failure("workout_cancel_target_missing", `There isn't a planned workout on ${formatDateLabel(scheduledDate)}.`);
    }
    if (day?.completed === true || day?.progress?.completed === true) {
      return failure("workout_cancel_completed_session", "A completed workout cannot be cancelled as a planned workout.");
    }

    const title = clean(day?.title, 180) || "Workout";
    const fingerprint = workoutFingerprint(day);

    return {
      success: true,
      action: {
        action_type: "cancel_workout",
        payload: {
          scheduled_date: scheduledDate,
          expected_workout_fingerprint: fingerprint,
          expected_workout_title: title
        },
        confirmation_text: `Remove ${title} from ${formatDateLabel(scheduledDate)}?`
      },
      resolution: {
        operation: "cancel_workout",
        scheduledDate,
        workoutTitle: title,
        source: SOURCE
      }
    };
  }

  function prepareOperation(pending = {}) {
    const name = clean(pending?.name, 120);
    if (name === "log_meal") return prepareLogMeal(pending);
    if (name === "log_weight") return prepareLogWeight(pending);
    if (name === "update_goal") return prepareUpdateGoal(pending);
    if (name === "log_activity") {
      return failure("activity_requires_async_preparation", "Activity logging requires the canonical Training activity preparer.");
    }
    if (name === "log_planned_meal") {
      return failure("planned_meal_requires_async_preparation", "Planned meal logging requires the canonical Meal Plan preparer.");
    }
    if (name === "plan_meal") {
      return failure("meal_plan_requires_async_preparation", "Meal Plan creation requires the canonical Meal Plan preparer.");
    }
    if (name === "plan_workout") {
      return failure("workout_requires_async_preparation", "Workout planning requires the canonical Training workout preparer.");
    }
    if (name === "cancel_workout") {
      return failure("workout_cancel_requires_async_preparation", "Workout cancellation requires canonical Training state.");
    }
    return failure("operation_handler_unavailable", "That operation has not been migrated to the registry yet.");
  }

  async function prepareOperationAsync(pending = {}) {
    const name = clean(pending?.name, 120);
    if (name === "log_activity") return await prepareLogActivity(pending);
    if (name === "log_planned_meal") return await prepareLogPlannedMeal(pending);
    if (name === "plan_meal") return await preparePlanMeal(pending);
    if (name === "plan_workout") return await preparePlanWorkout(pending);
    if (name === "cancel_workout") return await prepareCancelWorkout(pending);
    return prepareOperation(pending);
  }

  async function createOperationPending(pending = {}) {
    const prepared = await prepareOperationAsync(pending);
    if (!prepared.success) return prepared;

    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "CalBuddy pending action service is unavailable.");
    }

    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };

    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution: prepared.resolution };
  }

  function clearMatchingPendingCopies(pending = {}) {
    const pendingId = clean(pending?.id, 220);
    if (!pendingId) return false;

    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === pendingId) {
      window.AriVNextBridge?.clearPendingAction?.();
    }

    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === pendingId) {
      window.CalBuddy?.clearPendingAction?.();
    }
    return true;
  }

  function reconcileOrphanedLegacyPending() {
    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    const linkedId = clean(legacyPending?.vnext_action_id, 220);
    if (!linkedId) return false;

    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === linkedId) return false;

    window.CalBuddy?.clearPendingAction?.();
    return true;
  }

  async function executeCancelWorkout({ pending, prepared, currentTurnId = null } = {}) {
    const adapter = window.AriVNextActionAdapter;
    const getController = adapter?.getWorkoutController;
    if (typeof getController !== "function") {
      return failure("workout_controller_unavailable", "The canonical Training workout controller is unavailable.");
    }

    let controller;
    try {
      controller = await getController.call(adapter);
    } catch (error) {
      return failure("training_controller_unavailable", error?.message || "The canonical Training controller is unavailable.");
    }

    const payload = prepared?.action?.payload || {};
    const scheduledDate = clean(payload?.scheduled_date, 20);
    const expectedFingerprint = clean(payload?.expected_workout_fingerprint, 1000);
    const expectedTitle = clean(payload?.expected_workout_title, 180) || "Workout";

    const current = controller.getDate(scheduledDate);
    if (!hasWorkout(current)) {
      return failure("workout_cancel_target_missing", `There isn't a planned workout on ${formatDateLabel(scheduledDate)}.`);
    }
    if (current?.completed === true || current?.progress?.completed === true) {
      return failure("workout_cancel_completed_session", "A completed workout cannot be cancelled as a planned workout.");
    }
    if (!expectedFingerprint || workoutFingerprint(current) !== expectedFingerprint) {
      return failure("workout_cancel_target_changed", "That workout changed after Ari prepared the cancellation. Ask Ari to prepare it again.");
    }

    const cleared = controller.clearDate(scheduledDate);
    if (!cleared) {
      return failure("workout_cancel_save_failed", "Training could not remove that planned workout safely.");
    }

    const remoteSaved = await controller.save({ remote: true });
    if (remoteSaved === false) {
      return failure("workout_cancel_remote_save_failed", "The workout was removed locally but ARI XP could not safely confirm the remote save.");
    }

    window.dispatchEvent(new CustomEvent("ari:workoutPlanUpdated", {
      detail: {
        scheduledDate,
        mode: "cancel",
        operation: "cancel",
        source: SOURCE,
        version: VERSION,
        vnextActionId: pending?.id || null,
        confirmationTurnId: clean(currentTurnId, 220) || null
      }
    }));

    return {
      success: true,
      result: {
        scheduled_date: scheduledDate,
        removed_workout_title: expectedTitle,
        reply: `${expectedTitle} has been removed from ${formatDateLabel(scheduledDate)}.`
      },
      action: {
        ...prepared.action,
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 220) || null,
        vnext_source: SOURCE
      }
    };
  }

  async function executeOwnedOperation(input = {}) {
    const pending = input?.vnextPendingAction || null;
    const operationName = clean(pending?.name, 120);

    if (!validPendingIdentity(pending)) {
      return failure("missing_vnext_pending_action", "There is no turn-bound action to execute.");
    }

    if (!OWNED_OPERATIONS.has(operationName)) {
      return failure("operation_handler_unavailable", "That operation has not been migrated to the registry yet.");
    }

    if (pending?.expiresAt && Date.parse(pending.expiresAt) < Date.now()) {
      return failure("vnext_action_expired", `That pending ${operationName.replaceAll("_", " ")} expired. Ask Ari to prepare it again.`);
    }

    const prepared = await prepareOperationAsync(pending);
    if (!prepared.success) return prepared;

    if (operationName === "plan_workout") {
      const adapter = window.AriVNextActionAdapter;
      const executor = adapter?.executeValidatedWorkout;
      if (typeof executor !== "function") {
        return failure("workout_executor_unavailable", "The canonical Training workout executor is unavailable.");
      }

      const execution = await executor.call(adapter, {
        action: prepared.action,
        pending,
        currentTurnId: clean(input?.currentTurnId, 220) || null
      });
      if (execution?.success !== false) clearMatchingPendingCopies(pending);
      return execution;
    }

    if (operationName === "cancel_workout") {
      const execution = await executeCancelWorkout({
        pending,
        prepared,
        currentTurnId: clean(input?.currentTurnId, 220) || null
      });
      if (execution?.success !== false) clearMatchingPendingCopies(pending);
      return execution;
    }

    if (typeof window.CalBuddy?.executeAction !== "function") {
      return failure("action_executor_unavailable", "CalBuddy action executor is unavailable.");
    }

    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(input?.currentTurnId, 220) || null,
      vnext_source: SOURCE
    };

    const result = await window.CalBuddy.executeAction(action);
    const success = result?.success !== false;
    const execution = { success, result, action };

    if (success) clearMatchingPendingCopies(pending);
    return execution;
  }

  function install() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return false;
    if (adapter[INSTALL_FLAG]) return true;
    if (typeof adapter.createCalBuddyPendingAction !== "function" || typeof adapter.executeConfirmed !== "function") {
      return false;
    }

    const fallbackCreate = adapter.createCalBuddyPendingAction.bind(adapter);
    const fallbackExecute = adapter.executeConfirmed.bind(adapter);

    adapter.createCalBuddyPendingAction = async function registryCreatePending(pending = {}) {
      if (OWNED_OPERATIONS.has(clean(pending?.name, 120))) return await createOperationPending(pending);
      return await fallbackCreate(pending);
    };

    adapter.executeConfirmed = async function registryExecuteConfirmed(input = {}) {
      const pending = input?.vnextPendingAction || null;
      if (OWNED_OPERATIONS.has(clean(pending?.name, 120))) return await executeOwnedOperation(input);
      return await fallbackExecute(input);
    };

    Object.defineProperty(adapter, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    reconcileOrphanedLegacyPending();
    return true;
  }

  const registry = {
    version: VERSION,
    source: SOURCE,
    ready: false,
    hasOperation(name = "") {
      return OWNED_OPERATIONS.has(clean(name, 120));
    },
    prepare: prepareOperation,
    prepareAsync: prepareOperationAsync,
    createPending: createOperationPending,
    executeConfirmed: executeOwnedOperation,
    clearMatchingPendingCopies,
    reconcileOrphanedLegacyPending,
    snapshot() {
      return { version: VERSION, operations: Array.from(OWNED_OPERATIONS), source: SOURCE };
    }
  };

  window.AriVNextOperationRegistry = registry;

  if (install()) {
    registry.ready = true;
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", {
      detail: registry.snapshot()
    }));
  } else {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install()) {
        window.clearInterval(timer);
        registry.ready = true;
        window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", {
          detail: registry.snapshot()
        }));
      } else if (attempts >= 200) {
        window.clearInterval(timer);
        console.error("[Ari Operation Registry] trusted action adapter did not initialize.");
      }
    }, 25);
  }
})();