// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-rebirth-action-planner.js
// Version: 2.2.0-experimental
// Purpose: validate OpenAI-proposed app operations and prepare executable
// user-owned actions before confirmation.
// =====================================================
window.Ari = window.Ari || {};

window.Ari.rebirthActionPlanner = {
  version: "2.2.0-experimental",
  source: "ari-rebirth-action-planner-openai-proposed-actions",
  _mealResolverPromise: null,

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
        normalized = await this.prepareAction(normalized, summary, appControl);
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
      schemaVersion: "2.2.0-experimental",
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

  async prepareAction(action = {}, summary = {}, appControl = null) {
    let prepared = { ...action, payload: { ...(action.payload || {}) } };

    if (typeof appControl?.prepareAction === "function") {
      prepared = await appControl.prepareAction(prepared, summary);
    }

    const operation = appControl?.normalizeOperation?.(
      prepared.operation || prepared.action_type || prepared.type
    ) || prepared.operation || prepared.action_type || prepared.type;

    if (operation !== "log_meal") return prepared;

    const resolver = await this.ensureMealResolver();
    const payload = await resolver.resolveMeal(prepared.payload || {});
    const calories = Number(payload.calories || 0);
    if (!Number.isFinite(calories) || calories <= 0) {
      throw new Error("meal_calories_unresolved");
    }

    const databaseOnly = payload.nutritionResolution?.allDatabaseMatched === true;
    const confirmation = databaseOnly
      ? `I estimate that meal at about ${Math.round(calories).toLocaleString()} calories from the ARI Nutrition database. Log it?`
      : `I estimate that meal at about ${Math.round(calories).toLocaleString()} calories. I matched what I could to the ARI Nutrition database and estimated the rest. Log it?`;

    return {
      ...prepared,
      operation: "log_meal",
      action_type: "log_meal",
      payload,
      confirmation_text: confirmation,
      confirmationText: confirmation,
      nutritionResolved: true,
      nutritionResolution: payload.nutritionResolution || null
    };
  },

  async ensureMealResolver() {
    const existing = window.AriMealResolutionRuntime || window.Ari?.mealResolutionRuntime;
    if (existing?.resolveMeal) return existing;

    if (!this._mealResolverPromise) {
      this._mealResolverPromise = new Promise((resolve, reject) => {
        const src = "ari/nutrition/ari-meal-resolution-runtime.js?v=1.0.0";
        const already = Array.from(document.scripts || []).find(script =>
          (script.getAttribute("src") || "").split("?")[0].endsWith("ari/nutrition/ari-meal-resolution-runtime.js")
        );

        const finish = () => {
          const runtime = window.AriMealResolutionRuntime || window.Ari?.mealResolutionRuntime;
          if (runtime?.resolveMeal) resolve(runtime);
          else reject(new Error("ari_meal_resolution_runtime_unavailable"));
        };

        if (already) {
          if (window.AriMealResolutionRuntime?.resolveMeal) finish();
          else {
            already.addEventListener("load", finish, { once: true });
            already.addEventListener("error", () => reject(new Error("ari_meal_resolution_runtime_load_failed")), { once: true });
          }
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = finish;
        script.onerror = () => reject(new Error("ari_meal_resolution_runtime_load_failed"));
        (document.head || document.documentElement).appendChild(script);
      }).catch(error => {
        this._mealResolverPromise = null;
        throw error;
      });
    }

    return this._mealResolverPromise;
  },

  firstArray(values = []) {
    for (const value of values) if (Array.isArray(value)) return value;
    return [];
  }
};