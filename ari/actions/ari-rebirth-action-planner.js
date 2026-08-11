// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-rebirth-action-planner.js
// Version: 2.0.0-experimental
// Purpose:
//   Convert OpenAI-proposed application operations into a deterministic,
//   registered CalBuddy action handoff.
//
// IMPORTANT:
//   This planner does not interpret user language and does not use regex
//   intent detection. OpenAI owns semantic interpretation. Local code only
//   validates proposed operations against AriAppControlRuntime.
// =====================================================

window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "2.0.0-experimental",
  source: "ari-rebirth-action-planner-openai-proposed-actions",

  plan(summary = {}) {
    const appControl =
      window.AriAppControlRuntime ||
      window.Ari?.appControlRuntime ||
      null;

    const rawActions = this.firstArray([
      summary.cognitiveReasoningResult?.proposedActions,
      summary.reasoningResult?.proposedActions,
      summary.reasoningStagePacket?.proposedActions,
      summary.modelProposedActions,
      summary.proposedActions
    ]);

    const actions = [];
    const rejectedActions = [];

    for (const rawAction of rawActions) {
      const normalized =
        appControl?.normalizeProposedAction?.(rawAction) ||
        null;

      if (!normalized) {
        rejectedActions.push({
          action: rawAction,
          reason: "unregistered_application_operation"
        });
        continue;
      }

      // Read access is supplied to OpenAI in the application snapshot before
      // reasoning. It is not a post-response side effect, so it should not be
      // handed to CalBuddy as a pending action.
      if (normalized.capability?.mode === "read") {
        continue;
      }

      actions.push({
        ...normalized,
        blocked: false,
        requiresApproval: true,
        executionAuthority: "ari-app-control-runtime",
        semanticAuthority: "openai",
        source: this.source
      });
    }

    const plan = {
      schema: "ari_rebirth_action_plan",
      schemaVersion: "2.0.0-experimental",
      source: this.source,
      ready: true,
      actionCount: actions.length,
      actions,
      rejectedActions,
      requiresApproval: actions.length > 0,
      authority: {
        semanticInterpretation: "openai",
        actionProposal: "openai",
        operationValidation: "ari-app-control-runtime",
        execution: "calbuddy-application-boundary",
        arbitraryOperationsAllowed: false
      }
    };

    return {
      ...summary,
      actionPlannerRan: true,
      actionPlannerSource: this.source,
      actionPlannerVersion: this.version,
      rebirthActionPlan: plan,
      actionPlan: plan,
      actions,
      plannedActions: actions,
      proposedActions: rawActions,
      rejectedProposedActions: rejectedActions
    };
  },

  firstArray(values = []) {
    for (const value of values) {
      if (Array.isArray(value)) return value;
    }
    return [];
  }
};