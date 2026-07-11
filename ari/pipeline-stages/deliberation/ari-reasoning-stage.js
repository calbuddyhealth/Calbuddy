// ari/pipeline-stages/deliberation/ari-reasoning-stage.js
// Ari Reasoning Deliberation Stage
// Purpose: Coordinate cognitive planning, developer analysis, and general reasoning.
// V1.0.0 — Cognitive / Developer / General Reasoning Orchestration

window.Ari = window.Ari || {};

window.AriReasoningStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback,

      preserveDeveloperEvidence =
        state => state,

      runDeveloperLayer =
        async state => state,

      applyContractBridge =
        state => state
    } = runtime;

    let state = {
      ...summary,
      activeDeliberationStage: "reasoning"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const reasoningEligibility =
      this.resolveReasoningEligibility({
        state,
        runInstructions
      });

    state = {
      ...state,

      reasoningEligibility,

      shouldRunCognitiveExecutive:
        reasoningEligibility.runCognitiveExecutive,

      shouldRunDeveloperLayer:
        reasoningEligibility.runDeveloper,

      shouldRunHeavyReasoning:
        reasoningEligibility.runGeneralReasoning
    };

    // =================================================
    // 1. Cognitive Executive
    // =================================================

    mark("before cognitiveExecutive");

    const cognitiveExecutiveResult =
      reasoningEligibility.runCognitiveExecutive
        ? await runEngine(
            window.AriCognitiveExecutive,
            ["plan"],

            {
              ariExecutiveRan: false,
              ariExecutiveVersion: null,

              cognitiveExecutive: {
                source: "not-loaded",
                authority: "none",
                activate: [],
                requires: {},
                reason:
                  "cognitive_executive_not_loaded"
              }
            },

            {
              ...state,

              reasoningStageInput:
                this.buildReasoningStageInput(state)
            }
          )
        : {
            ariExecutiveRan: false,
            ariExecutiveVersion: null,

            cognitiveExecutive: {
              source:
                "skipped-by-executive-routing",

              authority:
                "none",

              activate: [],

              requires: {},

              reason:
                "cognitive_executive_not_required"
            }
          };

    state = {
      ...state,

      ...cognitiveExecutiveResult,

      cognitiveExecutive:
        cognitiveExecutiveResult.cognitiveExecutive ||
        state.cognitiveExecutive ||
        null,

      ariExecutiveRan:
        cognitiveExecutiveResult.ariExecutiveRan === true,

      ariExecutiveVersion:
        cognitiveExecutiveResult.ariExecutiveVersion ||
        state.ariExecutiveVersion ||
        null
    };

    mark("after cognitiveExecutive");

    // =================================================
    // 2. Developer Layer
    // =================================================

    const shouldRunDeveloper =
      reasoningEligibility.runDeveloper ||
      state.cognitiveExecutive
        ?.activate?.includes?.("developer") ||
      state.cognitiveExecutive
        ?.requires?.developer === true;

    state = {
      ...state,
      shouldRunDeveloperLayer:
        shouldRunDeveloper
    };

    mark("before runDeveloperLayer");

    state =
      shouldRunDeveloper
        ? await runDeveloperLayer(state)
        : {
            ...state,

            developerLayerRan:
              false,

            developerLayerSource:
              "skipped-by-executive-routing",

            developerLayerSkipReason:
              "developer_path_not_required"
          };

    mark("after runDeveloperLayer");

    state =
      preserveDeveloperEvidence(state);

    state =
      applyContractBridge(state);

    // =================================================
    // 3. Developer response-lock handling
    // =================================================

    const developerResponseLocked =
      Boolean(
        state.responseLocked === true ||
        state.developerResponseLocked === true ||
        state.developerHandoff
          ?.responseLocked === true ||
        state.developerHandoff
          ?.developerResponseLocked === true
      );

    if (
      !developerResponseLocked &&
      state.developerHandoff
    ) {
      state = {
        ...state,

        unlockedDeveloperHandoff:
          state.developerHandoff,

        developerIntent:
          state.developerIntent ||
          state.developerHandoff
            .developerIntent ||
          null,

        composerDeveloperPacket:
          state.developerHandoff
            .composerDeveloperPacket ||
          state.composerDeveloperPacket ||
          null,

        developerHandoff:
          null,

        developerResponse:
          null,

        finalResponse:
          null,

        responseLocked:
          false,

        developerResponseLocked:
          false
      };
    } else {
      state = {
        ...state,
        developerResponseLocked
      };
    }

    // =================================================
    // 4. General Reasoning Engine
    // =================================================

    const shouldRunGeneralReasoning =
      reasoningEligibility.runGeneralReasoning &&
      developerResponseLocked !== true;

    state = {
      ...state,

      shouldRunHeavyReasoning:
        shouldRunGeneralReasoning
    };

    mark("before AriReasoningEngine");

    const reasoningResult =
      shouldRunGeneralReasoning
        ? await runEngine(
            window.AriReasoningEngine,
            ["create", "reason"],

            {
              reasoningEngineRan: false,
              reasoningSource: "not-loaded",

              reasoning: {},

              reasoningAnswer: null,
              reasoningRecommendation: null,

              reason:
                "reasoning_engine_not_loaded"
            },

            {
              ...state,

              reasoningStageInput:
                this.buildReasoningStageInput(state)
            }
          )
        : {
            reasoningEngineRan: false,

            reasoningSource:
              developerResponseLocked
                ? "skipped-developer-response-locked"
                : "skipped-by-executive-routing",

            reasoning: {},

            reasoningAnswer: null,
            reasoningRecommendation: null,

            reason:
              developerResponseLocked
                ? "developer_response_already_locked"
                : "general_reasoning_not_required"
          };

    state = {
      ...state,

      ...reasoningResult,

      reasoning:
        reasoningResult.reasoning ||
        state.reasoning ||
        {},

      reasoningAnswer:
        null,

      reasoningRecommendation:
        null,

      reasoningEngineRan:
        reasoningResult
          .reasoningEngineRan === true,

      reasoningSource:
        reasoningResult.reasoningSource ||
        reasoningResult.source ||
        "unknown"
    };

    mark("after AriReasoningEngine");

    // =================================================
    // 5. Normalize reasoning requirements
    // =================================================

    const reasoningRequirements =
      this.resolveReasoningRequirements(state);

    state = {
      ...state,

      reasoningRequirements,

      requiredCapabilities:
        this.mergeUnique(
          state.requiredCapabilities,
          reasoningRequirements.capabilities
        ),

      responseRequired:
        this.mergeUnique(
          state.responseRequired,
          reasoningRequirements.requiredBehaviors
        ),

      responseAvoid:
        this.mergeUnique(
          state.responseAvoid,
          reasoningRequirements.forbiddenBehaviors
        ),

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,
          reasoningRequirements.constraints
        )
    };

    // =================================================
    // 6. Reasoning Stage Packet
    // =================================================

    state.reasoningStagePacket =
      this.buildReasoningStagePacket(state);

    state.reasoningStageRan =
      true;

    state.reasoningStageSource =
      "ari-reasoning-stage";

    state.reasoningStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveReasoningEligibility({
    state = {},
    runInstructions = {}
  } = {}) {
    const developerRequested =
      runInstructions.developer === true ||
      state.shouldRunDeveloperLayer === true ||
      state.routingContract
        ?.run?.developer === true ||
      state.routingContract
        ?.mode === "developer";

    const safetyOverride =
      state.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const fastPath =
      runInstructions.fastPath === true ||
      state.routingApplicability
        ?.fastPathEligible === true;

    const heavyReasoningRequested =
      runInstructions.heavyReasoning !== false &&
      state.shouldRunHeavyReasoning !== false;

    const routeNeedsReasoning =
      this.routeNeedsReasoning(state);

    const runCognitiveExecutive =
      developerRequested ||
      safetyOverride ||
      heavyReasoningRequested ||
      routeNeedsReasoning;

    const runGeneralReasoning =
      !safetyOverride &&
      (
        developerRequested === false ||
        state.developerResponseLocked !== true
      ) &&
      (
        heavyReasoningRequested ||
        routeNeedsReasoning ||
        !fastPath
      );

    return {
      runCognitiveExecutive,
      runDeveloper:
        developerRequested,

      runGeneralReasoning,

      developerRequested,
      safetyOverride,
      fastPath,
      heavyReasoningRequested,
      routeNeedsReasoning,

      source:
        "ari-reasoning-stage-eligibility",

      reason:
        safetyOverride
          ? "safety_override_limits_general_reasoning"
          : developerRequested
            ? "developer_reasoning_requested"
            : runGeneralReasoning
              ? "general_reasoning_required"
              : "reasoning_fast_path"
    };
  },

  routeNeedsReasoning(summary = {}) {
    const capabilities =
      summary.routingContract?.capabilities ||
      summary.requiredCapabilities ||
      [];

    const reasoningCapabilities = [
      "causal_reasoning",
      "comparison_reasoning",
      "decision_analysis",
      "risk_analysis",
      "multi_step_reasoning",
      "code_debugging",
      "architecture_design",
      "planning",
      "problem_solving"
    ];

    if (
      capabilities.some(capability =>
        reasoningCapabilities.includes(capability)
      )
    ) {
      return true;
    }

    const mode =
      summary.routingContract?.mode ||
      summary.conversationMode ||
      "";

    return [
      "decision_support",
      "planning",
      "developer",
      "medical",
      "emotional_support"
    ].includes(mode);
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildReasoningStageInput(summary = {}) {
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

      responseControl: {
        contextLane:
          summary.contextLane ||
          null,

        primaryLane:
          summary.primaryLane ||
          null,

        responseShape:
          summary.responseShape ||
          null,

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          []
      },

      developerEvidence: {
        github:
          summary.githubEvidence ||
          null,

        fileContext:
          summary.githubFileContext ||
          null,

        investigation:
          summary.developerInvestigation ||
          null
      }
    };
  },

  // ===================================================
  // Reasoning requirements
  // ===================================================

  resolveReasoningRequirements(summary = {}) {
    const executive =
      summary.cognitiveExecutive ||
      {};

    const reasoning =
      summary.reasoning ||
      {};

    return {
      capabilities:
        this.mergeUnique(
          executive.activate,
          reasoning.capabilities,
          reasoning.requiredCapabilities
        ),

      requiredBehaviors:
        this.mergeUnique(
          executive.requiredBehaviors,
          reasoning.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          executive.forbiddenBehaviors,
          reasoning.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          executive.constraints,
          reasoning.constraints
        ),

      requires:
        executive.requires ||
        {},

      authority:
        executive.authority ||
        "advisory"
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildReasoningStagePacket(summary = {}) {
    return {
      ready:
        true,

      source:
        "ari-reasoning-stage",

      version:
        this.version,

      eligibility:
        summary.reasoningEligibility ||
        null,

      cognitiveExecutive: {
        ran:
          summary.ariExecutiveRan === true,

        value:
          summary.cognitiveExecutive ||
          null
      },

      developer: {
        applicable:
          summary.shouldRunDeveloperLayer === true,

        ran:
          summary.developerLayerRan === true,

        responseLocked:
          summary.developerResponseLocked === true,

        intent:
          summary.developerIntent ||
          null,

        handoff:
          summary.developerHandoff ||
          summary.unlockedDeveloperHandoff ||
          null,

        composerPacket:
          summary.composerDeveloperPacket ||
          null,

        evidence: {
          github:
            summary.githubEvidence ||
            null,

          fileContext:
            summary.githubFileContext ||
            null,

          investigation:
            summary.developerInvestigation ||
            null
        }
      },

      generalReasoning: {
        ran:
          summary.reasoningEngineRan === true,

        source:
          summary.reasoningSource ||
          null,

        value:
          summary.reasoning ||
          {},

        requirements:
          summary.reasoningRequirements ||
          null
      },

      responseControl: {
        requiredCapabilities:
          summary.requiredCapabilities ||
          [],

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

      authority: {
        canCoordinateCognition:
          true,

        canRunDeveloperAnalysis:
          true,

        canPerformGeneralReasoning:
          true,

        canAddReasoningConstraints:
          true,

        canChooseFinalRoute:
          false,

        canOverrideSafety:
          false,

        canWriteFinalLanguage:
          false,

        canPersistState:
          false,

        role:
          "cognitive_developer_and_general_reasoning"
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
  "ARI REASONING STAGE LOADED:",
  window.AriReasoningStage?.version
);