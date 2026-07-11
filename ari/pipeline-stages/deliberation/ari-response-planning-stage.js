// ari/pipeline-stages/deliberation/ari-response-planning-stage.js
// Ari Response Planning Deliberation Stage
// Purpose: Convert routing, reasoning, context, and understanding into one response strategy.
// V1.0.0 — Response Strategy Orchestration Foundation

window.Ari = window.Ari || {};

window.AriResponsePlanningStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback
    } = runtime;

    let state = {
      ...summary,
      activeDeliberationStage: "response_planning"
    };

    const planningEligibility =
      this.resolvePlanningEligibility(state);

    state = {
      ...state,

      planningEligibility,

      shouldRunResponsePlanner:
        planningEligibility.runResponsePlanner
    };

    // =================================================
    // 1. Response Planner
    // =================================================

    mark("before responsePlanner");

    const responsePlannerResult =
      planningEligibility.runResponsePlanner
        ? await runEngine(
            window.AriResponsePlanner ||
            window.Ari?.responsePlanner,

            ["plan", "create"],

            {
              responsePlannerRan: false,
              usable: false,
              source: "not-loaded",

              responseShape: null,
              responseGoal: null,
              responseOrder: [],

              requiredBehaviors: [],
              forbiddenBehaviors: [],
              constraints: [],

              composerDirective: null,

              reason:
                "response_planner_not_loaded"
            },

            {
              ...state,

              responsePlanningInput:
                this.buildResponsePlanningInput(state)
            }
          )
        : this.buildFallbackResponsePlan(
            state,
            planningEligibility.reason
          );

    state = {
      ...state,

      ...responsePlannerResult,

      ariResponsePlan:
        responsePlannerResult,

      understandingResponsePlan:
        responsePlannerResult,

      responsePlannerRan:
        responsePlannerResult
          .responsePlannerRan === true,

      responsePlannerUsable:
        responsePlannerResult.usable === true,

      responsePlannerSource:
        responsePlannerResult.source ||
        "unknown"
    };

    mark("after responsePlanner");

    // =================================================
    // 2. Normalize final response strategy
    // =================================================

    const responseStrategy =
      this.buildResponseStrategy(
        state,
        responsePlannerResult
      );

    state = {
      ...state,

      responseStrategy,

      responseShape:
        responseStrategy.responseShape ||
        state.responseShape ||
        "clear_explanation",

      responseGoal:
        responseStrategy.responseGoal ||
        null,

      responseOrder:
        responseStrategy.responseOrder ||
        [],

      responseRules:
        this.mergeUnique(
          state.responseRules,
          responseStrategy.rules
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          responseStrategy.constraints
        ),

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          responseStrategy.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          responseStrategy.forbiddenBehaviors
        ),

      communicationPlan:
        responseStrategy.communicationPlan ||
        state.communicationPlan ||
        null,

      composerDirective:
        responseStrategy.composerDirective ||
        state.composerDirective ||
        null
    };

    // =================================================
    // 3. Deliberation completion packet
    // =================================================

    state.responsePlanningStagePacket =
      this.buildResponsePlanningStagePacket(state);

    state.responsePlanningStageRan =
      true;

    state.responsePlanningStageSource =
      "ari-response-planning-stage";

    state.responsePlanningStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolvePlanningEligibility(summary = {}) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const hasExistingPlan =
      Boolean(
        summary.ariResponsePlan ||
        summary.understandingResponsePlan
      );

    const hasSituationPlan =
      Boolean(
        summary.multiLanePlan ||
        summary.situationContract
      );

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    return {
      runResponsePlanner:
        !developerLocked,

      developerLocked,
      hasExistingPlan,
      hasSituationPlan,
      safetyOverride,

      source:
        "ari-response-planning-stage-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : safetyOverride
            ? "safety_response_strategy_required"
            : "response_strategy_required"
    };
  },

  // ===================================================
  // Planner input
  // ===================================================

  buildResponsePlanningInput(summary = {}) {
    return {
      request: {
        original:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        resolved:
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          ""
      },

      perception:
        summary.perceptionPacket ||
        null,

      routing:
        summary.routingContract ||
        null,

      executive:
        summary.executivePacket ||
        null,

      continuity:
        summary.continuityStagePacket ||
        null,

      safety:
        summary.safetyStagePacket ||
        null,

      situation:
        summary.situationStagePacket ||
        null,

      reasoning:
        summary.reasoningStagePacket ||
        null,

      memory:
        summary.memoryStagePacket ||
        null,

      understanding:
        summary.understandingStagePacket ||
        null,

      controls: {
        contextLane:
          summary.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          null,

        supportLanes:
          summary.supportLaneSuggestions ||
          [],

        deferredLanes:
          summary.deferredLaneSuggestions ||
          [],

        blockedLanes:
          summary.blockedLanes ||
          [],

        responseShape:
          summary.responseShape ||
          null,

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        constraints:
          summary.responseConstraints ||
          []
      },

      existingPlans: {
        multiLane:
          summary.multiLanePlan ||
          null,

        situationContract:
          summary.situationContract ||
          null,

        cognitiveExecutive:
          summary.cognitiveExecutive ||
          null,

        reasoning:
          summary.reasoning ||
          null
      }
    };
  },

  // ===================================================
  // Fallback response plan
  // ===================================================

  buildFallbackResponsePlan(
    summary = {},
    reason = "response_planner_not_required"
  ) {
    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const primaryLane =
      summary.primaryLane ||
      summary.routingContract?.primaryLane ||
      summary.triage?.primaryLane ||
      "general_understanding";

    return {
      responsePlannerRan: false,

      usable: true,

      source:
        "ari-response-planning-stage-fallback",

      responseGoal:
        safetyOverride
          ? "address_immediate_safety"
          : primaryLane,

      responseShape:
        summary.responseShape ||
        summary.routingContract?.responseShape ||
        (
          safetyOverride
            ? "brief_direct_safety_response"
            : "clear_explanation"
        ),

      responseOrder:
        this.mergeUnique(
          primaryLane,
          summary.supportLaneSuggestions
        ),

      requiredBehaviors:
        this.mergeUnique(
          summary.responseRequired,
          summary.safetyDisposition
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          summary.responseAvoid,
          summary.safetyDisposition
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          summary.responseConstraints,
          summary.safetyDisposition
            ?.constraints
        ),

      communicationPlan:
        null,

      composerDirective:
        null,

      reason
    };
  },

  // ===================================================
  // Final response strategy
  // ===================================================

  buildResponseStrategy(
    summary = {},
    plannerResult = {}
  ) {
    const safetyDisposition =
      summary.safetyDisposition ||
      {};

    const understanding =
      summary.understandingHandoff ||
      {};

    const memory =
      summary.memoryHandoff ||
      {};

    const situationContract =
      summary.situationContract ||
      {};

    const multiLanePlan =
      summary.multiLanePlan ||
      {};

    const routing =
      summary.routingContract ||
      {};

    const responseShape =
      plannerResult.responseShape ||
      plannerResult.plan?.responseShape ||
      situationContract.responseShape ||
      multiLanePlan.responseShape ||
      routing.responseShape ||
      summary.responseShape ||
      "clear_explanation";

    const responseGoal =
      plannerResult.responseGoal ||
      plannerResult.plan?.responseGoal ||
      multiLanePlan.responseGoal ||
      summary.primaryLane ||
      routing.primaryLane ||
      "answer_user";

    const responseOrder =
      this.mergeUnique(
        plannerResult.responseOrder,
        plannerResult.plan?.responseOrder,
        multiLanePlan.responseOrder,
        summary.primaryLane,
        summary.supportLaneSuggestions
      );

    const requiredBehaviors =
      this.mergeUnique(
        summary.responseRequired,
        plannerResult.requiredBehaviors,
        plannerResult.plan
          ?.requiredBehaviors,
        safetyDisposition.requiredBehaviors,
        understanding.requiredBehaviors,
        memory.requiredBehaviors,
        situationContract.responseRequired
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        summary.responseAvoid,
        plannerResult.forbiddenBehaviors,
        plannerResult.plan
          ?.forbiddenBehaviors,
        safetyDisposition.forbiddenBehaviors,
        understanding.forbiddenBehaviors,
        memory.forbiddenBehaviors
      );

    const constraints =
      this.mergeUnique(
        summary.responseConstraints,
        plannerResult.constraints,
        plannerResult.plan?.constraints,
        safetyDisposition.constraints,
        understanding.constraints,
        situationContract.responseRules
      );

    const rules =
      this.mergeUnique(
        summary.responseRules,
        plannerResult.responseRules,
        plannerResult.plan?.responseRules,
        situationContract.responseRules
      );

    return {
      ready: true,

      source:
        plannerResult.responsePlannerRan === true
          ? "ari-response-planner"
          : "ari-response-planning-stage-fallback",

      responseGoal,

      responseShape,

      responseOrder,

      primaryLane:
        summary.primaryLane ||
        routing.primaryLane ||
        null,

      contextLane:
        summary.contextLane ||
        routing.contextLane ||
        null,

      planner:
        routing.planner ||
        summary.selectedPlanner ||
        null,

      mode:
        routing.mode ||
        summary.conversationMode ||
        "unknown",

      intent:
        routing.primaryIntent ||
        summary.primaryIntent ||
        "unknown",

      domain:
        routing.domain ||
        summary.conversationDomain ||
        "general",

      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      rules,

      communicationNeeds:
        understanding.communicationNeeds ||
        [],

      communicationPlan:
        plannerResult.communicationPlan ||
        plannerResult.plan
          ?.communicationPlan ||
        summary.communicationPlan ||
        null,

      composerDirective:
        plannerResult.composerDirective ||
        plannerResult.plan
          ?.composerDirective ||
        multiLanePlan.composerDirective ||
        null,

      personalization: {
        allowed:
          memory.personalizationAllowed !== false,

        shouldMentionMemory:
          memory.shouldMentionMemory === true,

        facts:
          memory.facts ||
          []
      },

      safety: {
        applicable:
          summary.safetyApplicable === true,

        shouldStopNormalResponse:
          summary
            .safetyShouldStopNormalResponse === true,

        requiresClarification:
          summary
            .safetyRequiresClarification === true,

        requiredPlanner:
          summary.safetyRequiredPlanner ||
          null,

        communicationStyle:
          summary.safetyCommunicationStyle ||
          null
      },

      developer: {
        applicable:
          summary.shouldRunDeveloperLayer === true,

        responseLocked:
          summary.developerResponseLocked === true,

        composerPacket:
          summary.composerDeveloperPacket ||
          null
      },

      confidence:
        plannerResult.confidence ||
        summary.routingConfidence ||
        null
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildResponsePlanningStagePacket(summary = {}) {
    return {
      ready:
        true,

      source:
        "ari-response-planning-stage",

      version:
        this.version,

      eligibility:
        summary.planningEligibility ||
        null,

      planner: {
        ran:
          summary.responsePlannerRan === true,

        usable:
          summary.responsePlannerUsable === true,

        source:
          summary.responsePlannerSource ||
          null,

        value:
          summary.ariResponsePlan ||
          null
      },

      strategy:
        summary.responseStrategy ||
        null,

      responseControl: {
        goal:
          summary.responseGoal ||
          null,

        shape:
          summary.responseShape ||
          null,

        order:
          summary.responseOrder ||
          [],

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          [],

        requiredBehaviors:
          summary.responseRequired ||
          [],

        forbiddenBehaviors:
          summary.responseAvoid ||
          [],

        communicationPlan:
          summary.communicationPlan ||
          null,

        composerDirective:
          summary.composerDirective ||
          null
      },

      authority: {
        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canOrderResponseContent:
          true,

        canMergeDeliberationConstraints:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "final_deliberation_response_strategy"
      }
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  mergeUnique(...values) {
    return [
      ...new Set(
        values.flatMap(value =>
          this.toArray(value)
        )
      )
    ];
  }
};

console.log(
  "ARI RESPONSE PLANNING STAGE LOADED:",
  window.AriResponsePlanningStage?.version
);