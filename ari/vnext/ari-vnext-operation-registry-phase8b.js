// ARI vNext — remaining Phase 8B compatibility registrations.
// Nutrition and workout reference mutations have moved to permanent domain services.

(() => {
  "use strict";

  const VERSION = "1.2.0";
  const SOURCE = "ari_vnext_operation_registry_phase8b";
  const INSTALL_FLAG = "__ariOperationRegistryPhase8B";
  const BRIDGE_CLEAR_FLAG = "__ariRegistryFailurePreserveV1";

  const CIRCLE_OPERATIONS = [
    "create_circle_meetup", "join_circle_meetup", "leave_circle_meetup", "cancel_circle_meetup",
    "create_circle_mission", "join_circle_mission", "submit_circle_mission_progress",
    "create_circle_crew", "accept_circle_crew_invite", "decline_circle_crew_invite",
    "leave_circle_crew", "archive_circle_crew"
  ];

  const CIRCLE_ACTION_TYPES = [
    "circle_create_meetup", "circle_join_meetup", "circle_leave_meetup", "circle_cancel_meetup",
    "circle_create_mission", "circle_join_mission", "circle_submit_mission_progress",
    "circle_create_crew", "circle_accept_circle_crew_invite", "circle_decline_circle_crew_invite",
    "circle_leave_crew", "circle_archive_crew"
  ];

  const LIVE_REFERENCE_ACTIONS = new Set([
    "update_weight_log", "delete_weight_log",
    "update_activity_log", "delete_activity_log"
  ]);

  let activityServicePromise = null;
  let protectedPendingId = null;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const clean = (value = "", max = 500) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const array = (value) => Array.isArray(value) ? value : [];
  const finite = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round1 = (value) => Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
  const failure = (code, message, extra = {}) => ({ success: false, code, message, ...extra });
  const pendingFrom = (input = {}) => input?.vnextPendingAction || input || {};

  function normalizeSlot(value = "") {
    const slot = clean(value, 40).toLowerCase();
    return ["breakfast", "lunch", "dinner", "snack"].includes(slot) ? slot : "";
  }

  function slotLabel(value = "") {
    const slot = normalizeSlot(value);
    return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
  }

  async function storePending(pending = {}, action = {}, resolution = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare that change safely.");
    }
    const stored = await window.CalBuddy.createPendingAction(action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution };
  }

  function referenceSnapshot() {
    return array(window.AriVNextReferenceState?.snapshot?.()?.references);
  }

  function persistedReference(referenceId = "") {
    const id = clean(referenceId, 180);
    return referenceSnapshot().find((reference) => clean(reference?.referenceId, 180) === id) || null;
  }

  function verifiedPersisted(reference = {}, domain = "", entityType = "") {
    return clean(reference?.state, 40) === "persisted" &&
      (!domain || clean(reference?.domain, 40) === domain) &&
      (!entityType || clean(reference?.entityType, 60) === entityType) &&
      reference?.verification?.verifiedByTrustedExecutor === true;
  }

  function liveTarget(pending = {}) {
    const name = clean(pending?.name, 120);
    if (!LIVE_REFERENCE_ACTIONS.has(name)) return null;
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    const reference = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    if (!reference) return null;
    const verification = object(reference?.verification);
    if (
      verification.verifiedByTrustedContext !== true ||
      verification.currentContextRead !== true ||
      verification.rehydratedFromAuthoritativeState !== true ||
      verification.staleCheckRequiredBeforeWrite !== true
    ) return null;

    if (["update_weight_log", "delete_weight_log"].includes(name) && clean(reference?.domain, 40) === "goals" && clean(reference?.entityType, 60) === "weight_log" && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    if (["update_activity_log", "delete_activity_log"].includes(name) && clean(reference?.domain, 40) === "training" && clean(reference?.entityType, 60) === "activity_log" && clean(reference?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    return null;
  }

  function summarizeChanges(changes = []) {
    return array(changes).slice(0, 4).map((change) => {
      const field = clean(change?.field, 80).replaceAll("_", " ");
      const value = Number.isFinite(Number(change?.numberValue)) ? Number(change.numberValue) : clean(change?.textValue, 100);
      return field && value !== "" ? `${field} to ${value}` : field;
    }).filter(Boolean).join(", ");
  }

  async function createLivePending(pending = {}, target = {}) {
    const name = clean(pending?.name, 120);
    const label = clean(target?.label, 160) || "that item";
    const args = object(pending?.arguments);

    if (name === "update_weight_log") {
      const value = finite(args?.value);
      const unit = clean(args?.unit, 12).toLowerCase() || "lb";
      if (value === null) return failure("weight_reference_value_required", "Tell Ari the corrected weight.");
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit },
        confirmation_text: `Change ${label} to ${value} ${unit}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "delete_weight_log") {
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    const deleting = name === "delete_activity_log";
    const changes = deleting ? [] : array(args?.changes).slice(0, 8);
    if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    return await storePending(pending, {
      action_type: name,
      payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
      confirmation_text: deleting ? `Delete ${label}?` : `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
    }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
  }

  function executionEnvelope(pending, target, currentTurnId, result, operation, reply = "") {
    return {
      success: true,
      result,
      ...(reply ? { reply } : {}),
      action: {
        action_type: clean(pending?.name, 120),
        payload: { reference_id: target.referenceId },
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
        vnext_source: SOURCE
      },
      authoritativeReference: {
        referenceId: target.referenceId,
        entityType: target.entityType,
        operation,
        staleCheckedByTrustedExecutor: true,
        target
      }
    };
  }

  async function executeLive(input = {}) {
    const pending = pendingFrom(input);
    const target = liveTarget(pending);
    if (!target) return failure("rehydrated_reference_missing", "That current app item could not be resolved safely.");
    const name = clean(pending?.name, 120);
    const args = object(pending?.arguments);
    const currentTurnId = input?.currentTurnId || null;

    if (["update_weight_log", "delete_weight_log"].includes(name)) {
      const deleting = name === "delete_weight_log";
      const adapter = window.AriVNextWeightAdapter;
      const result = deleting
        ? await adapter?.deleteReferencedWeight?.({ logDate: target.canonical.logDate })
        : await adapter?.updateReferencedWeight?.({ logDate: target.canonical.logDate, value: args?.value, unit: args?.unit });
      if (!result?.success) return result || failure("weight_reference_write_failed", "That weigh-in could not be changed.");
      return executionEnvelope(pending, target, currentTurnId, result, deleting ? "weight_delete" : "weight_update", deleting ? "Weigh-in deleted." : "Weigh-in updated.");
    }

    const deleting = name === "delete_activity_log";
    const adapter = window.AriVNextActivityAdapter;
    const result = deleting
      ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
      : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(args?.changes).slice(0, 8) });
    if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
    return executionEnvelope(pending, target, currentTurnId, result, deleting ? "activity_delete" : "activity_update", deleting ? "Activity deleted." : "Activity updated.");
  }

  function persistedActivityTarget(pending = {}) {
    const target = persistedReference(pending?.arguments?.referenceId);
    return verifiedPersisted(target, "training", "activity_log") && clean(target?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40)) ? target : null;
  }

  async function createPersistedActivityPending(pending = {}) {
    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const name = clean(pending?.name, 120);
    const deleting = name === "delete_activity_log";
    const changes = deleting ? [] : array(pending?.arguments?.changes).slice(0, 8);
    if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    return await storePending(pending, {
      action_type: name,
      payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
      confirmation_text: deleting ? `Delete ${clean(target.label, 160) || "that activity"}?` : `Update ${clean(target.label, 160) || "that activity"}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
    }, { referenceId: target.referenceId, operation: deleting ? "delete" : "update" });
  }

  async function executePersistedActivity(input = {}) {
    const pending = pendingFrom(input);
    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const deleting = clean(pending?.name, 120) === "delete_activity_log";
    const adapter = window.AriVNextActivityAdapter;
    const result = deleting
      ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
      : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(pending?.arguments?.changes).slice(0, 8) });
    if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
    const execution = {
      success: true,
      result,
      reply: deleting ? "Activity deleted." : "Activity updated.",
      referenceActivity: { referenceId: target.referenceId, activityId: target.canonical.id, operation: deleting ? "delete" : "update", target }
    };
    const lifecycle = window.AriVNextReferenceState?.commit?.({ pendingAction: pending, execution });
    return { ...execution, referenceLifecycle: lifecycle || null };
  }

  function normalizeMealComponent(item = {}, index = 0) {
    const name = clean(item?.name, 180);
    const calories = finite(item?.calories);
    const protein = finite(item?.proteinG ?? item?.protein_g);
    const carbs = finite(item?.carbsG ?? item?.carbs_g);
    const fat = finite(item?.fatG ?? item?.fat_g);
    if (!name || [calories, protein, carbs, fat].some((value) => value === null || value < 0)) return null;
    return { id: clean(item?.id, 160) || `component-${index}`, name, amount: clean(item?.amount || item?.servingSize || item?.serving_size, 180), calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat) };
  }

  function normalizePlannedMeal(meal = {}, index = 0) {
    const mealSlot = normalizeSlot(meal?.mealSlot ?? meal?.meal_slot);
    const name = clean(meal?.name, 180);
    const calories = finite(meal?.calories);
    const protein = finite(meal?.proteinG ?? meal?.protein_g);
    const carbs = finite(meal?.carbsG ?? meal?.carbs_g);
    const fat = finite(meal?.fatG ?? meal?.fat_g);
    if (!mealSlot || !name || [calories, protein, carbs, fat].some((value) => value === null || value < 0) || calories <= 0 || calories > 5000) return null;
    let items = array(meal?.items).map(normalizeMealComponent).filter(Boolean);
    if (!items.length) items = [{ id: `whole-meal-${index}`, name, amount: clean(meal?.servingSize ?? meal?.serving_size, 180) || "1 planned serving", calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat) }];
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return { plan_date: date, meal_slot: mealSlot, name, calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat), serving_size: clean(meal?.servingSize ?? meal?.serving_size, 180) || "Planned by Ari", items, notes: clean(meal?.notes, 500) };
  }

  async function prepareTodayPlan(pending = {}) {
    const args = object(pending?.arguments);
    const meals = array(args?.meals).slice(0, 4).map(normalizePlannedMeal).filter(Boolean);
    if (!meals.length) return failure("meal_plan_required", "Ari did not produce a complete meal for today’s Meal Plan.");
    const slots = meals.map((meal) => meal.meal_slot);
    if (new Set(slots).size !== slots.length) return failure("meal_plan_duplicate_slots", "Ari proposed more than one meal for the same Meal Plan slot.");
    const context = typeof window.CalBuddy?.getUserContext === "function" ? await window.CalBuddy.getUserContext() : {};
    const budgetBasis = clean(args?.budgetBasis, 40).toLowerCase() || "general";
    const targetCalories = finite(args?.targetCalories);
    if (budgetBasis === "daily_goal" && finite(context?.dailyGoal) === null) return failure("daily_calorie_goal_required", "Your Daily Calorie Goal is not set, so Ari will not invent a calorie budget. Set the goal first or give Ari an explicit calorie target.");
    if (budgetBasis === "explicit_user_target" && (targetCalories === null || targetCalories <= 0)) return failure("explicit_meal_plan_target_required", "The requested Meal Plan calorie target is missing.");
    const activeSlots = new Set(array(context?.plannedMeals).map((item) => normalizeSlot(item?.meal_slot ?? item?.mealSlot)).filter(Boolean));
    const collision = meals.find((meal) => activeSlots.has(meal.meal_slot));
    if (collision) return failure("meal_plan_slot_already_active", `Today’s ${slotLabel(collision.meal_slot).toLowerCase()} already has an active Meal Plan. Discard it before replacing it.`);
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const remaining = finite(context?.caloriesRemainingAfterPlan);
    if (budgetBasis === "daily_goal" && remaining !== null && totalCalories > remaining + Math.max(100, Math.round(remaining * 0.10))) return failure("meal_plan_exceeds_remaining_budget", "That plan is above the calories remaining in today’s saved budget, so Ari will not save it as-is.", { proposedCalories: totalCalories, remainingCalories: remaining });
    return {
      success: true,
      action: {
        action_type: "plan_meal",
        payload: { meals, plan_date: meals[0].plan_date, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
        confirmation_text: meals.length === 1 ? `Add ${meals[0].name} — about ${meals[0].calories} kcal — to today’s ${slotLabel(meals[0].meal_slot).toLowerCase()} Meal Plan?` : `Add this ${Math.round(totalCalories).toLocaleString()} kcal plan to today’s Meal Plan?`
      },
      resolution: { todayOnly: true, budgetBasis, targetCalories: targetCalories === null ? null : Math.round(targetCalories), totalCalories: Math.round(totalCalories), mealSlots: slots }
    };
  }

  async function prepareLogPlannedMeal(pending = {}) {
    const mealSlot = normalizeSlot(pending?.arguments?.mealSlot ?? pending?.arguments?.meal_slot);
    if (!mealSlot) return failure("planned_meal_slot_required", "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan.");
    return {
      success: true,
      action: {
        action_type: "log_planned_meal",
        payload: { meal_slot: mealSlot, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
        confirmation_text: `Log today’s planned ${slotLabel(mealSlot).toLowerCase()} as eaten?`
      },
      resolution: { todayOnly: true, mealSlot }
    };
  }

  async function activityService() {
    if (!activityServicePromise) {
      activityServicePromise = import("../../js/training/activity-log-service.js?v=1.1.0")
        .then((module) => module.default || module.ActivityLogService);
    }
    return await activityServicePromise;
  }

  function installFailurePreservation(registry) {
    const bridge = window.AriVNextBridge;
    if (!bridge?.getPendingAction || !bridge?.setPendingAction || !bridge?.clearPendingAction) return false;
    if (!bridge[BRIDGE_CLEAR_FLAG]) {
      const originalClear = bridge.clearPendingAction.bind(bridge);
      bridge.clearPendingAction = function registryAwarePendingClear() {
        const current = bridge.getPendingAction?.() || null;
        if (protectedPendingId && clean(current?.id, 220) === protectedPendingId) {
          protectedPendingId = null;
          return false;
        }
        return originalClear();
      };
      Object.defineProperty(bridge, BRIDGE_CLEAR_FLAG, { configurable: false, enumerable: false, value: VERSION });
    }

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== false) return execution;
      const pending = pendingFrom(input);
      if (!pending?.id) return execution;
      bridge.setPendingAction(pending);
      protectedPendingId = clean(pending.id, 220);
      const protectedId = protectedPendingId;
      window.setTimeout(() => {
        if (protectedPendingId === protectedId) protectedPendingId = null;
      }, 0);
      return execution;
    }, { source: `${SOURCE}:failure-preservation`, priority: 10000 });
    return true;
  }

  function registerCircle(registry) {
    const circle = window.AriVNextCircleActionAdapter;
    if (!circle?.ready || typeof circle.prepare !== "function" || typeof circle.execute !== "function") return false;
    for (const name of CIRCLE_OPERATIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:circle`,
        priority: 2000,
        async prepare(pending = {}) { return await circle.prepare(pending, object(pending?.arguments)); }
      });
    }
    for (const type of CIRCLE_ACTION_TYPES) {
      registry.registerApplicationExecutor(type, {
        source: `${SOURCE}:circle`,
        priority: 2000,
        async execute(action = {}) { return await circle.execute(action); }
      });
    }
    return true;
  }

  function registerManualActivityExecutor(registry) {
    registry.registerApplicationExecutor("log_activity", {
      source: `${SOURCE}:activity`,
      priority: 1500,
      async execute(action = {}) {
        const service = await activityService();
        const result = await service.logActivity(action?.payload || {}, { source: clean(action?.payload?.source || "ari_vnext", 80) });
        if (!result?.success) return failure(result?.code || "activity_log_failed", result?.message || "Activity could not be saved.");
        return result;
      }
    });
  }

  function registerReferenceOperations(registry) {
    for (const name of LIVE_REFERENCE_ACTIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:authoritative-reference`,
        priority: 4000,
        match(input = {}) { return Boolean(liveTarget(pendingFrom(input))); },
        async createPending(pending = {}) { return await createLivePending(pending, liveTarget(pending)); },
        async executeConfirmed(input = {}) { return await executeLive(input); }
      });
    }

    for (const name of ["update_activity_log", "delete_activity_log"]) {
      registry.registerOperation(name, {
        source: `${SOURCE}:persisted-reference`,
        priority: 3000,
        match(input = {}) { return Boolean(persistedActivityTarget(pendingFrom(input))); },
        async createPending(pending = {}) { return await createPersistedActivityPending(pending); },
        async executeConfirmed(input = {}) { return await executePersistedActivity(input); }
      });
    }
  }

  function registerMealPlan(registry) {
    registry.registerOperation("plan_meal", {
      source: `${SOURCE}:meal-plan`, priority: 2200,
      async prepare(pending = {}) { return await prepareTodayPlan(pending); }
    });
    registry.registerOperation("log_planned_meal", {
      source: `${SOURCE}:meal-plan`, priority: 2200,
      async prepare(pending = {}) { return await prepareLogPlannedMeal(pending); }
    });
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!window.AriVNextStructuredReferenceCapabilities?.ready || !window.AriVNextAuthoritativeReferenceRehydration?.ready) return false;
    if (!window.AriVNextActivityAdapter || !window.AriVNextWeightAdapter?.ready) return false;
    if (!window.AriVNextCircleActionAdapter?.ready) return false;

    installFailurePreservation(registry);
    registerCircle(registry);
    registerManualActivityExecutor(registry);
    registerReferenceOperations(registry);
    registerMealPlan(registry);

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    const migratedOperations = Array.from(new Set([
      ...CIRCLE_OPERATIONS,
      ...LIVE_REFERENCE_ACTIONS,
      "plan_meal",
      "log_planned_meal",
      "log_activity"
    ])).sort();

    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      migratedOperations,
      migratedApplicationActions: [...CIRCLE_ACTION_TYPES, "log_activity"].sort()
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8BReady", {
      detail: { version: VERSION, migratedOperations }
    }));
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[Ari Phase 8B] install retry:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();