// ari/pipeline-stages/delivery/ari-action-delivery-stage.js
// Ari Action Delivery Stage
// Purpose: Convert the completed response into approved post-response actions.
// V1.2.0 — log_meal is accepted only from the canonical current-turn planner.

window.Ari = window.Ari || {};

window.AriActionDeliveryStage = {
  version: "1.2.0",

  async run(summary = {}, runtime = {}) {
    const { mark = () => {} } = runtime;

    let state = {
      ...summary,
      activeDeliveryStage: "action_delivery"
    };

    const actionEligibility = this.resolveActionEligibility(state);

    state = {
      ...state,
      actionEligibility,
      shouldRunActionPlanner: actionEligibility.runActionPlanner
    };

    mark("before rebirthActionPlanner");

    let actionPlannerResult;

    if (
      actionEligibility.runActionPlanner &&
      window.Ari?.rebirthActionPlanner?.plan
    ) {
      const result = await window.Ari.rebirthActionPlanner.plan(state);

      actionPlannerResult =
        result && typeof result === "object"
          ? result
          : {
              actionPlannerRan: false,
              source: "invalid-result",
              actions: [],
              reason: "action_planner_returned_invalid_result"
            };
    } else {
      actionPlannerResult = {
        actionPlannerRan: false,
        source:
          actionEligibility.runActionPlanner
            ? "not-loaded"
            : "skipped-by-delivery-eligibility",
        actions: [],
        reason:
          actionEligibility.runActionPlanner
            ? "rebirth_action_planner_not_loaded"
            : "action_planning_not_required"
      };
    }

    const rawActions =
      actionPlannerResult.actions ||
      actionPlannerResult.plannedActions ||
      actionPlannerResult.proposedActions ||
      [];

    const guardedActions = this.guardActions(rawActions, state);

    actionPlannerResult = {
      ...actionPlannerResult,
      actions: guardedActions,
      plannedActions: guardedActions,
      proposedActions: guardedActions
    };

    state = {
      ...state,
      ...actionPlannerResult,
      actionPlannerResult,
      actionPlannerRan:
        actionPlannerResult.actionPlannerRan === true ||
        Boolean(
          actionPlannerResult.rebirthActionPlan ||
          actionPlannerResult.actionPlan ||
          rawActions.length
        ),
      actionPlannerSource: actionPlannerResult.source || "unknown",
      rebirthActionPlan:
        actionPlannerResult.rebirthActionPlan ||
        actionPlannerResult.actionPlan ||
        state.rebirthActionPlan ||
        null,
      plannedActions: guardedActions
    };

    mark("after rebirthActionPlanner");

    const actionHandoff = this.buildActionHandoff(state);

    state = {
      ...state,
      actionHandoff
    };

    state.actionDeliveryStagePacket = this.buildActionDeliveryStagePacket(state);
    state.actionDeliveryStageRan = true;
    state.actionDeliveryStageSource = "ari-action-delivery-stage";
    state.actionDeliveryStageVersion = this.version;

    return state;
  },

  guardActions(actions = [], summary = {}) {
    return (Array.isArray(actions) ? actions : [])
      .filter(action => this.isActionAllowed(action, summary));
  },

  isActionAllowed(action = {}, summary = {}) {
    const type = String(action.action_type || action.type || "").toLowerCase();

    if (type !== "log_meal") return true;

    return this.isMealActionAllowed(summary, action);
  },

  isMealActionAllowed(summary = {}, action = {}) {
    // SINGLE AUTHORITY RULE:
    // No legacy contract, lastMealEstimate, thread history, follow-up resolver,
    // API reconstruction, or other source may hand off a meal write.
    if (action.source !== "ari_rebirth_action_planner_v2_current_turn") {
      return false;
    }

    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();

    const hasWriteVerb = /\b(log|add|track|save|record)\b/.test(text);
    if (!hasWriteVerb) return false;

    const hasEatingContext =
      /\b(i ate|i had|i drank|i just ate|i just had|i just drank|i've had|i’ve had)\b/.test(text);
    if (!hasEatingContext) return false;

    const hasNonMealTarget =
      /\b(workout|exercise|training|sets?|reps?|body weight|my weight|blood pressure|heart rate|steps?|sleep|medication|medicine|dose|symptom|mood|journal|note|error|bug|console|github|code|account|sign[- ]?in|login)\b/.test(text);
    if (hasNonMealTarget) return false;

    const payload = action.payload || {};

    const hasCompleteNutrition =
      Boolean(String(payload.name || "").trim()) &&
      Number(payload.calories || 0) > 0 &&
      Number.isFinite(Number(payload.protein_g)) &&
      Number.isFinite(Number(payload.carbs_g)) &&
      Number.isFinite(Number(payload.fat_g));

    return hasCompleteNutrition;
  },

  resolveActionEligibility(summary = {}) {
    const hasFinalResponse = Boolean(
      String(summary.finalResponse || "").trim()
    );

    const developerLocked = summary.developerResponseLocked === true;

    const safetyOverride =
      summary.safetyDisposition?.shouldStopNormalResponse === true;

    const explicitActionRequest =
      summary.routingContract?.capabilities?.includes?.("action_execution") ||
      summary.routingContract?.primaryIntent === "perform_action" ||
      summary.routingContract?.primaryIntent === "schedule_action" ||
      summary.routingContract?.primaryIntent === "save_memory" ||
      summary.routingContract?.primaryIntent === "log_data";

    const existingActionSignals = Boolean(
      summary.actionRequest ||
      summary.pendingAction ||
      summary.mealEstimate ||
      summary.structuredAction
    );

    const runActionPlanner =
      hasFinalResponse &&
      (
        explicitActionRequest ||
        existingActionSignals ||
        developerLocked ||
        safetyOverride ||
        true
      );

    return {
      runActionPlanner,
      hasFinalResponse,
      developerLocked,
      safetyOverride,
      explicitActionRequest,
      existingActionSignals,
      source: "ari-action-delivery-stage-eligibility",
      reason:
        !hasFinalResponse
          ? "final_response_missing"
          : explicitActionRequest
            ? "explicit_action_request"
            : existingActionSignals
              ? "action_signals_present"
              : "post_response_action_review"
    };
  },

  buildActionHandoff(summary = {}) {
    const plan =
      summary.rebirthActionPlan ||
      summary.actionPlan ||
      null;

    const actions =
      summary.plannedActions ||
      plan?.actions ||
      [];

    return {
      ready: true,
      plannerRan: summary.actionPlannerRan === true,
      source: summary.actionPlannerSource || null,
      plan,
      actions,
      actionCount: actions.length,
      requiresApproval:
        plan?.requiresApproval === true ||
        actions.some(action => action?.requiresApproval === true),
      executableActions: actions.filter(action => action?.blocked !== true),
      blockedActions: actions.filter(action => action?.blocked === true),
      responseLinked: Boolean(String(summary.finalResponse || "").trim()),
      authority: {
        canPlanActions: true,
        canExecuteActions: false,
        canPersistActions: false,
        canChangeFinalResponse: false,
        canChangeRouting: false,
        role: "post_response_action_planning_and_handoff"
      }
    };
  },

  buildActionDeliveryStagePacket(summary = {}) {
    return {
      ready: true,
      source: "ari-action-delivery-stage",
      version: this.version,
      eligibility: summary.actionEligibility || null,
      planner: {
        ran: summary.actionPlannerRan === true,
        source: summary.actionPlannerSource || null,
        result: summary.actionPlannerResult || null
      },
      handoff: summary.actionHandoff || null,
      result: {
        plan: summary.rebirthActionPlan || null,
        actions: summary.plannedActions || [],
        actionCount: summary.plannedActions?.length || 0
      },
      authority: {
        canPlanActions: true,
        canExecuteActions: false,
        canPersistState: false,
        canChangeFinalResponse: false,
        role: "action_delivery_orchestration"
      }
    };
  }
};

console.log(
  "ARI ACTION DELIVERY STAGE LOADED:",
  window.AriActionDeliveryStage?.version
);