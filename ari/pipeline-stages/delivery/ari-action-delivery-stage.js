// ari/pipeline-stages/delivery/ari-action-delivery-stage.js
// Ari Action Delivery Stage
// Purpose: Convert the completed response into approved post-response actions.
// V1.1.0 — Adds a strict meal-action guard so generic conversation cannot become a food log.

window.Ari = window.Ari || {};

window.AriActionDeliveryStage = {
  version: "1.1.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    let state = {
      ...summary,
      activeDeliveryStage: "action_delivery"
    };

    const actionEligibility =
      this.resolveActionEligibility(state);

    state = {
      ...state,

      actionEligibility,

      shouldRunActionPlanner:
        actionEligibility.runActionPlanner
    };

    // =================================================
    // 1. Rebirth Action Planner
    // =================================================

    mark("before rebirthActionPlanner");

    let actionPlannerResult;

    if (
      actionEligibility.runActionPlanner &&
      window.Ari?.rebirthActionPlanner?.plan
    ) {
      const result =
        await window.Ari.rebirthActionPlanner.plan(
          state
        );

      actionPlannerResult =
        result && typeof result === "object"
          ? result
          : {
              actionPlannerRan: false,
              source: "invalid-result",
              actions: [],
              reason:
                "action_planner_returned_invalid_result"
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

    const guardedActions =
      this.guardActions(rawActions, state);

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
        actionPlannerResult
          .actionPlannerRan === true ||
        Boolean(
          actionPlannerResult.rebirthActionPlan ||
          actionPlannerResult.actionPlan ||
          rawActions.length
        ),

      actionPlannerSource:
        actionPlannerResult.source ||
        "unknown",

      rebirthActionPlan:
        actionPlannerResult.rebirthActionPlan ||
        actionPlannerResult.actionPlan ||
        state.rebirthActionPlan ||
        null,

      plannedActions:
        guardedActions
    };

    mark("after rebirthActionPlanner");

    // =================================================
    // 2. Normalize action handoff
    // =================================================

    const actionHandoff =
      this.buildActionHandoff(state);

    state = {
      ...state,
      actionHandoff
    };

    // =================================================
    // 3. Stage packet
    // =================================================

    state.actionDeliveryStagePacket =
      this.buildActionDeliveryStagePacket(
        state
      );

    state.actionDeliveryStageRan =
      true;

    state.actionDeliveryStageSource =
      "ari-action-delivery-stage";

    state.actionDeliveryStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Action guard
  // ===================================================

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
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();

    // A meal write always requires an explicit write verb from the user.
    const hasWriteVerb =
      /\b(log|add|track|save|record)\b/.test(text);

    if (!hasWriteVerb) return false;

    // Hard reject known non-food logging targets. These should never be
    // interpreted as a meal even when words such as "log" or "track" appear.
    const hasNonMealTarget =
      /\b(workout|exercise|training|sets?|reps?|body weight|my weight|blood pressure|heart rate|steps?|sleep|water|medication|medicine|dose|symptom|mood|journal|note|error|bug|console|github|code|account|sign[- ]?in|login)\b/.test(text);

    if (hasNonMealTarget) return false;

    const hasExplicitMealContext =
      /\b(meal|food|breakfast|lunch|dinner|snack|intake|calories|calorie|kcal|macros?|protein|carbs?|carbohydrates?|fat)\b/.test(text);

    const hasEatingContext =
      /\b(i ate|i had|i drank|just ate|just had|just drank|ate a|ate an|had a|had an)\b/.test(text);

    const isFollowUpReference =
      /\b(log|add|track|save|record)\b.{0,30}\b(that|it|this)\b/.test(text) ||
      /\b(that|it|this)\b.{0,20}\b(log|add|track|save|record)\b/.test(text);

    const mealEstimate =
      summary.mealEstimate ||
      summary.lastMealEstimate ||
      summary.foodAnalysis ||
      summary.nutritionEstimate ||
      summary.calorieEstimate ||
      summary.appContext?.mealEstimate ||
      summary.appContext?.lastMealEstimate ||
      summary.threadState?.lastMealEstimate ||
      null;

    const payload = action.payload || {};
    const hasUsableNutrition =
      Number(payload.calories || 0) > 0 &&
      Boolean(String(payload.name || "").trim());

    if (!hasUsableNutrition) return false;

    // Direct requests need food/eating context. Pronoun follow-ups such as
    // "log that" are only valid if the current Rebirth state carries a meal estimate.
    if (hasExplicitMealContext || hasEatingContext) return true;
    if (isFollowUpReference && mealEstimate) return true;

    return false;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveActionEligibility(summary = {}) {
    const hasFinalResponse =
      Boolean(
        String(
          summary.finalResponse ||
          ""
        ).trim()
      );

    const developerLocked =
      summary.developerResponseLocked === true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const explicitActionRequest =
      summary.routingContract
        ?.capabilities?.includes?.("action_execution") ||
      summary.routingContract
        ?.primaryIntent === "perform_action" ||
      summary.routingContract
        ?.primaryIntent === "schedule_action" ||
      summary.routingContract
        ?.primaryIntent === "save_memory" ||
      summary.routingContract
        ?.primaryIntent === "log_data";

    const existingActionSignals =
      Boolean(
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

      source:
        "ari-action-delivery-stage-eligibility",

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

  // ===================================================
  // Action handoff
  // ===================================================

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

      plannerRan:
        summary.actionPlannerRan === true,

      source:
        summary.actionPlannerSource ||
        null,

      plan,

      actions,

      actionCount:
        actions.length,

      requiresApproval:
        plan?.requiresApproval === true ||
        actions.some(
          action =>
            action?.requiresApproval === true
        ),

      executableActions:
        actions.filter(
          action =>
            action?.blocked !== true
        ),

      blockedActions:
        actions.filter(
          action =>
            action?.blocked === true
        ),

      responseLinked:
        Boolean(
          String(
            summary.finalResponse ||
            ""
          ).trim()
        ),

      authority: {
        canPlanActions:
          true,

        canExecuteActions:
          false,

        canPersistActions:
          false,

        canChangeFinalResponse:
          false,

        canChangeRouting:
          false,

        role:
          "post_response_action_planning_and_handoff"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildActionDeliveryStagePacket(
    summary = {}
  ) {
    return {
      ready: true,

      source:
        "ari-action-delivery-stage",

      version:
        this.version,

      eligibility:
        summary.actionEligibility ||
        null,

      planner: {
        ran:
          summary.actionPlannerRan === true,

        source:
          summary.actionPlannerSource ||
          null,

        result:
          summary.actionPlannerResult ||
          null
      },

      handoff:
        summary.actionHandoff ||
        null,

      result: {
        plan:
          summary.rebirthActionPlan ||
          null,

        actions:
          summary.plannedActions ||
          [],

        actionCount:
          summary.plannedActions?.length ||
          0
      },

      authority: {
        canPlanActions:
          true,

        canExecuteActions:
          false,

        canPersistState:
          false,

        canChangeFinalResponse:
          false,

        role:
          "action_delivery_orchestration"
      }
    };
  }
};

console.log(
  "ARI ACTION DELIVERY STAGE LOADED:",
  window.AriActionDeliveryStage?.version
);