// ARI vNext — Weight/Goals domain-service registry adapter.
// All Weight and Goals mutations execute through permanent domain services.

(() => {
  "use strict";

  const VERSION = "1.2.0";
  const SOURCE = "ari_vnext_weight_goals_service_adapter";
  let servicesPromise = null;
  let installed = false;

  function clean(value = "", max = 180) {
    return String(value ?? "").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function failure(code, message) {
    return { success: false, code, message };
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  async function services() {
    if (!servicesPromise) {
      servicesPromise = Promise.all([
        import("../../js/goals/weight-service.js?v=1.1.0"),
        import("../../js/goals/profile-service.js?v=1.0.0")
      ]).then(([weight, profile]) => ({
        weight: weight.default || weight.WeightService,
        profile: profile.default || profile.GoalsProfileService
      }));
    }
    return servicesPromise;
  }

  function normalizeGoalType(value = "") {
    const raw = clean(value, 80).toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
    if (["daily_calorie_goal", "calorie_goal", "calories"].includes(raw)) return "daily_calorie_goal";
    if (["target_weight", "goal_weight", "weight_goal"].includes(raw)) return "target_weight";
    if (["weekly_weight_change", "weekly_change", "weekly_weight_change_goal"].includes(raw)) return "weekly_weight_change";
    if (["goal_mode", "goal", "mode"].includes(raw)) return "goal_mode";
    return "";
  }

  function resolveWeightTarget(pending = {}) {
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    if (!referenceId) return null;
    const target = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    const verification = object(target?.verification);
    if (
      clean(target?.domain, 40) !== "goals" ||
      clean(target?.entityType, 60) !== "weight_log" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40)) ||
      verification.verifiedByTrustedContext !== true ||
      verification.currentContextRead !== true ||
      verification.rehydratedFromAuthoritativeState !== true ||
      verification.staleCheckRequiredBeforeWrite !== true
    ) return null;
    return target;
  }

  function prepareWeight(pending = {}) {
    const args = pending?.arguments || {};
    const value = number(args.value);
    const unit = clean(args.unit, 12).toLowerCase();
    if (!value || value <= 0) return failure("weight_required", "A valid weight is required.");
    const pounds = unit === "kg" ? value * 2.2046226218 : value;
    return {
      success: true,
      action: {
        action_type: "log_weight",
        payload: {
          weight: round1(pounds),
          notes: unit === "kg" ? `Entered as ${round1(value)} kg by Ari vNext.` : "Logged by Ari vNext."
        },
        confirmation_text: `Log your weight as ${round1(value)} ${unit === "kg" ? "kg" : "lb"}?`
      }
    };
  }

  function prepareGoal(pending = {}) {
    const args = pending?.arguments || {};
    const goalType = normalizeGoalType(args.goalType);
    const value = args.value === null || args.value === undefined ? null : number(args.value);
    if (!goalType) return failure("unsupported_goal_type", "That goal change is not supported yet.");

    const payload = {};
    if (goalType === "daily_calorie_goal") {
      if (!value || value < 800 || value > 8000) return failure("calorie_goal_out_of_range", "The calorie goal is outside the supported range.");
      payload.daily_calorie_goal = Math.round(value);
    } else if (goalType === "target_weight") {
      if (!value || value <= 0 || value > 1500) return failure("target_weight_out_of_range", "The target weight is outside the supported range.");
      payload.target_weight_lbs = clean(args.unit, 12).toLowerCase() === "kg" ? round1(value * 2.2046226218) : round1(value);
    } else if (goalType === "weekly_weight_change") {
      if (value === null || Math.abs(value) > 10) return failure("weekly_change_out_of_range", "The weekly weight change is outside the supported range.");
      payload.weekly_weight_change_goal = Math.abs(value);
    } else if (goalType === "goal_mode") {
      const instruction = clean(args.instruction, 200).toLowerCase();
      const mode = /\b(cut|lose|loss)\b/.test(instruction) ? "lose" : /\b(bulk|gain)\b/.test(instruction) ? "gain" : /\b(maintain|maintenance)\b/.test(instruction) ? "maintain" : null;
      if (!mode) return failure("goal_mode_required", "A clear goal mode is required.");
      payload.goal = mode;
    }

    return { success: true, action: { action_type: "update_goal_profile", payload, confirmation_text: `Update your ${goalType.replaceAll("_", " ")}?` } };
  }

  function prepareReferencedWeight(pending = {}) {
    const target = resolveWeightTarget(pending);
    if (!target) return failure("rehydrated_reference_missing", "That current weigh-in could not be resolved safely.");
    const deleting = clean(pending?.name, 120) === "delete_weight_log";
    const args = pending?.arguments || {};
    if (deleting) {
      return { success: true, action: { action_type: "delete_weight_log", payload: { log_date: target.canonical.logDate, reference_id: target.referenceId }, confirmation_text: `Delete ${clean(target?.label, 160) || "that weigh-in"}?` }, resolution: { referenceId: target.referenceId } };
    }
    const value = number(args.value);
    const unit = clean(args.unit, 12).toLowerCase() || "lb";
    if (value === null) return failure("weight_reference_value_required", "Tell Ari the corrected weight.");
    return { success: true, action: { action_type: "update_weight_log", payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit }, confirmation_text: `Change ${clean(target?.label, 160) || "that weigh-in"} to ${value} ${unit}?` }, resolution: { referenceId: target.referenceId } };
  }

  async function storePending(pending, prepared) {
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") return failure("pending_action_service_unavailable", "Ari could not prepare that change.");
    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = { ...stored, vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_expires_at: pending.expiresAt || null, vnext_source: SOURCE };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution: prepared.resolution || null };
  }

  function envelope(pending, currentTurnId, action, result, reply, target = null, operation = "") {
    return {
      success: true,
      result,
      reply,
      action: { ...action, vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_confirmation_turn_id: clean(currentTurnId, 200) || null, vnext_source: SOURCE },
      ...(target ? { authoritativeReference: { referenceId: target.referenceId, entityType: target.entityType, operation, staleCheckedByTrustedExecutor: true, target } } : {})
    };
  }

  async function executeWeight(input = {}) {
    const pending = pendingFrom(input);
    const prepared = prepareWeight(pending);
    if (!prepared.success) return prepared;
    const domain = await services();
    try {
      const result = await domain.weight.logWeight(prepared.action.payload);
      return envelope(pending, input?.currentTurnId, prepared.action, result, "Weight logged.");
    } catch (error) {
      return failure("weight_log_failed", error?.message || "Weight could not be logged.");
    }
  }

  async function executeGoal(input = {}) {
    const pending = pendingFrom(input);
    const prepared = prepareGoal(pending);
    if (!prepared.success) return prepared;
    const domain = await services();
    try {
      const result = await domain.profile.updateProfile(prepared.action.payload);
      return envelope(pending, input?.currentTurnId, prepared.action, result, "Goal updated.");
    } catch (error) {
      return failure("goal_update_failed", error?.message || "Goal could not be updated.");
    }
  }

  async function executeReferencedWeight(input = {}) {
    const pending = pendingFrom(input);
    const target = resolveWeightTarget(pending);
    const prepared = prepareReferencedWeight(pending);
    if (!prepared.success || !target) return prepared;
    const deleting = clean(pending?.name, 120) === "delete_weight_log";
    const domain = await services();
    try {
      const result = deleting
        ? await domain.weight.deleteWeight({ logDate: target.canonical.logDate })
        : await domain.weight.updateWeight({ logDate: target.canonical.logDate, value: pending?.arguments?.value, unit: pending?.arguments?.unit });
      return envelope(pending, input?.currentTurnId, prepared.action, result, deleting ? "Weigh-in deleted." : "Weigh-in updated.", target, deleting ? "weight_delete" : "weight_update");
    } catch (error) {
      return failure(deleting ? "weight_reference_delete_failed" : "weight_reference_update_failed", error?.message || "That weigh-in could not be changed.");
    }
  }

  function install() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;

    registry.registerOperation("log_weight", { source: SOURCE, priority: 20000, prepare: prepareWeight, async createPending(pending = {}) { return await storePending(pending, prepareWeight(pending)); }, executeConfirmed: executeWeight });
    registry.registerOperation("update_goal", { source: SOURCE, priority: 20000, prepare: prepareGoal, async createPending(pending = {}) { return await storePending(pending, prepareGoal(pending)); }, executeConfirmed: executeGoal });

    for (const name of ["update_weight_log", "delete_weight_log"]) {
      registry.registerOperation(name, {
        source: `${SOURCE}:reference`,
        priority: 20500,
        match(input = {}) { return Boolean(resolveWeightTarget(pendingFrom(input))); },
        prepare: prepareReferencedWeight,
        async createPending(pending = {}) { return await storePending(pending, prepareReferencedWeight(pending)); },
        executeConfirmed: executeReferencedWeight
      });
    }

    installed = true;
    window.AriVNextWeightGoalsServiceAdapter = Object.freeze({ version: VERSION, source: SOURCE, ready: true, prepareWeight, prepareGoal, prepareReferencedWeight, resolveWeightTarget });
    return true;
  }

  if (!install()) window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
})();
