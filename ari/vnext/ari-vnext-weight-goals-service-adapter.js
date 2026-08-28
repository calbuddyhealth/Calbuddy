// ARI vNext — Weight/Goals domain-service registry adapter.
// Bypasses Phase-era application execution for log_weight and update_goal while
// preserving pending identity, expiry, and canonical registry lifecycle.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_weight_goals_service_adapter";
  let servicesPromise = null;
  let installed = false;

  function clean(value = "", max = 180) {
    return String(value ?? "").trim().slice(0, max);
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
        import("../../js/goals/weight-service.js?v=1.0.0"),
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
      }
    };
  }

  async function storePending(pending, prepared) {
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare that change.");
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
    return { success: true, action: wrapped };
  }

  function envelope(pending, currentTurnId, action, result, reply) {
    return {
      success: true,
      result,
      reply,
      action: {
        ...action,
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
        vnext_source: SOURCE
      }
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

  function install() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;

    registry.registerOperation("log_weight", {
      source: SOURCE,
      priority: 20000,
      prepare: prepareWeight,
      async createPending(pending = {}) { return await storePending(pending, prepareWeight(pending)); },
      executeConfirmed: executeWeight
    });

    registry.registerOperation("update_goal", {
      source: SOURCE,
      priority: 20000,
      prepare: prepareGoal,
      async createPending(pending = {}) { return await storePending(pending, prepareGoal(pending)); },
      executeConfirmed: executeGoal
    });

    installed = true;
    window.AriVNextWeightGoalsServiceAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      prepareWeight,
      prepareGoal
    });
    return true;
  }

  if (!install()) window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
})();
