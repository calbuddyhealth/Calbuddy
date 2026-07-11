// ari/pipeline-stages/delivery/ari-action-delivery-stage.js
// Ari Action Delivery Stage
// Purpose: Convert the completed response into approved post-response actions.
// V1.0.0 — Action Planning / Delivery Handoff Foundation

window.Ari = window.Ari || {};

window.AriActionDeliveryStage = {
  version: "1.0.0",

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

    state = {
      ...state,

      ...actionPlannerResult,

      actionPlannerResult,

      actionPlannerRan:
        actionPlannerResult
          .actionPlannerRan === true ||
        Boolean(
          actionPlannerResult.rebirthActionPlan ||
          actionPlannerResult.actionPlan
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
        actionPlannerResult.actions ||
        actionPlannerResult.plannedActions ||
        state.plannedActions ||
        []
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