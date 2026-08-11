// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-rebirth-action-planner.js
// Version: 2.1.0-experimental
// Purpose: validate OpenAI-proposed app operations and prepare executable
// user-owned actions before confirmation.
// =====================================================
window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "2.1.0-experimental",
  source: "ari-rebirth-action-planner-openai-proposed-actions",

  async plan(summary = {}) {
    const appControl = window.AriAppControlRuntime || window.Ari?.appControlRuntime || null;
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
      let normalized = appControl?.normalizeProposedAction?.(rawAction) || null;
      if (!normalized) {
        rejectedActions.push({ action: rawAction, reason: "unregistered_application_operation" });
        continue;
      }

      if (normalized.capability?.mode === "read") continue;

      try {
        if (typeof appControl?.prepareAction === "function") {
          normalized = await appControl.prepareAction(normalized, summary);
        }
      } catch (error) {
        rejectedActions.push({
          action: rawAction,
          normalizedAction: normalized,
          reason: error?.message || "application_action_preparation_failed"
        });
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
      schemaVersion: "2.1.0-experimental",
      source: this.source,
      ready: true,
      actionCount: actions.length,
      actions,
      rejectedActions,
      requiresApproval: actions.length > 0,
      authority: {
        semanticInterpretation: "openai",
        actionProposal: "openai",
        nutritionResolution: "ari-nutrition-runtime",
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
    for (const value of values) if (Array.isArray(value)) return value;
    return [];
  }
};