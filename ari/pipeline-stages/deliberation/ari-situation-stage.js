// ari/pipeline-stages/deliberation/ari-situation-stage.js
// Ari Situation Deliberation Stage
// Purpose: Build the situation model, organize response lanes, and create the situation contract.
// V1.0.0 — Situation / Triage / Multi-Lane Orchestration Foundation

window.Ari = window.Ari || {};

window.AriSituationStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback,

      applyContractBridge =
        state => state
    } = runtime;

    let state = {
      ...summary,
      activeDeliberationStage: "situation"
    };

    const executivePacket =
      state.executivePacket ||
      {};

    const runInstructions =
      executivePacket.runInstructions ||
      state.routingContract?.run ||
      {};

    const safetyDisposition =
      state.safetyDisposition ||
      state.safetyStagePacket?.disposition ||
      null;

    const situationEligibility =
      this.resolveSituationEligibility({
        state,
        runInstructions,
        safetyDisposition
      });

    state = {
      ...state,

      situationEligibility,

      shouldRunSituationMap:
        situationEligibility.runSituationMap,

      shouldRunTriage:
        situationEligibility.runTriage,

      shouldRunMultiLanePlanner:
        situationEligibility.runMultiLanePlanner,

      shouldBuildSituationContract:
        situationEligibility.buildSituationContract
    };

    // =================================================
    // 1. Situation Map
    // =================================================

    mark("before situationMap");

    const situationMap =
      situationEligibility.runSituationMap
        ? await runEngine(
            window.AriSituationMapEngine,
            ["build", "create"],

            {
              situationMapRan: false,
              source: "not-loaded",

              situations: [],
              domains: [],
              needs: [],
              risks: [],
              questions: [],
              laneCandidates: [],

              responseRequirements: [],
              responseConstraints: [],

              reason:
                "situation_map_engine_not_loaded"
            },

            {
              ...state,

              situationStageInput:
                this.buildSituationStageInput(state)
            }
          )
        : {
            situationMapRan: false,

            source:
              "skipped-by-executive-routing",

            situations: [],
            domains: [],
            needs: [],
            risks: [],
            questions: [],
            laneCandidates: [],

            responseRequirements: [],
            responseConstraints: [],

            reason:
              "situation_map_not_required"
          };

    state = {
      ...state,

      situationMap,

      ...situationMap,

      situationMapRan:
        situationMap.situationMapRan === true,

      situationMapSource:
        situationMap.source ||
        situationMap.situationMapSource ||
        "unknown"
    };

    mark("after situationMap");

    // =================================================
    // 2. Triage
    // =================================================

    mark("before triageEngine");

    const triageOutput =
      situationEligibility.runTriage
        ? await runEngine(
            window.AriTriageEngine,
            ["run", "triage"],

            {
              ariTriage: {
                triageEngineRan: false,

                triageEngineSource:
                  "not-loaded",

                primaryLane: null,
                supportLanes: [],
                deferredLanes: [],
                blockedLanes: [],

                responseShape: null,
                responseConstraints: [],

                confidence: null,

                reason:
                  "triage_engine_not_loaded"
              }
            },

            {
              ...state,

              situationStageInput:
                this.buildSituationStageInput(state),

              situationMap:
                state.situationMap ||
                null,

              safetyDisposition:
                state.safetyDisposition ||
                null
            }
          )
        : {
            ariTriage: {
              triageEngineRan: false,

              triageEngineSource:
                "skipped-by-executive-routing",

              primaryLane:
                state.routingContract?.primaryLane ||
                null,

              supportLanes: [],
              deferredLanes: [],
              blockedLanes: [],

              responseShape:
                state.routingContract?.responseShape ||
                null,

              responseConstraints: [],

              confidence: null,

              reason:
                "triage_not_required"
            }
          };

    const triageResult =
      triageOutput.ariTriage ||
      triageOutput.triage ||
      {
        triageEngineRan: false,

        triageEngineSource:
          "not-loaded",

        primaryLane: null,
        supportLanes: [],
        deferredLanes: [],
        blockedLanes: [],

        responseShape: null,
        responseConstraints: [],

        confidence: null,

        reason:
          "triage_result_missing"
      };

    state = {
      ...state,

      ...triageOutput,

      triage:
        triageResult,

      ariTriage:
        triageResult,

      triageEngineRan:
        triageResult.triageEngineRan === true,

      triageEngineSource:
        triageResult.triageEngineSource ||
        triageResult.source ||
        "unknown",

      primaryLaneSuggestion:
        triageResult.primaryLane ||
        state.routingContract?.primaryLane ||
        state.primaryLane ||
        null,

      supportLaneSuggestions:
        triageResult.supportLanes ||
        [],

      deferredLaneSuggestions:
        triageResult.deferredLanes ||
        [],

      blockedLanes:
        triageResult.blockedLanes ||
        [],

      triageResponseShape:
        triageResult.responseShape ||
        null,

      triageConfidence:
        triageResult.confidence ??
        null,

      responseConstraints:
        this.mergeUnique(
          state.responseConstraints,

          triageResult.responseConstraints ||
          []
        )
    };

    mark("after triageEngine");

    // =================================================
    // 3. Resolve response-lane ownership
    // =================================================

    const responseLaneDecision =
      this.resolveResponseLaneDecision(state);

    state = {
      ...state,

      responseLaneDecision,

      primaryLane:
        responseLaneDecision.primaryLane,

      supportLaneSuggestions:
        responseLaneDecision.supportLanes,

      deferredLaneSuggestions:
        responseLaneDecision.deferredLanes,

      blockedLanes:
        responseLaneDecision.blockedLanes
    };

    // =================================================
    // 4. Multi-Lane Response Planner
    // =================================================

    mark("before multiLanePlanner");

    const multiLanePlan =
      situationEligibility.runMultiLanePlanner
        ? await runEngine(
            window.AriMultiLaneResponsePlanner,
            ["plan"],

            {
              multiLanePlannerRan: false,
              source: "not-loaded",

              primaryLane:
                responseLaneDecision.primaryLane,

              supportLanes:
                responseLaneDecision.supportLanes,

              deferredLanes:
                responseLaneDecision.deferredLanes,

              blockedLanes:
                responseLaneDecision.blockedLanes,

              responseShape:
                state.routingContract?.responseShape ||
                state.triage?.responseShape ||
                null,

              responseOrder: [],
              composerDirective: {},

              reason:
                "multi_lane_planner_not_loaded"
            },

            {
              ...state,

              situationStageInput:
                this.buildSituationStageInput(state),

              responseLaneDecision
            }
          )
        : {
            multiLanePlannerRan: false,

            source:
              "skipped-by-executive-routing",

            primaryLane:
              responseLaneDecision.primaryLane,

            supportLanes:
              responseLaneDecision.supportLanes,

            deferredLanes:
              responseLaneDecision.deferredLanes,

            blockedLanes:
              responseLaneDecision.blockedLanes,

            responseShape:
              state.routingContract?.responseShape ||
              state.triage?.responseShape ||
              null,

            responseOrder:
              responseLaneDecision.primaryLane
                ? [responseLaneDecision.primaryLane]
                : [],

            composerDirective: {},

            reason:
              "multi_lane_planning_not_required"
          };

    state = {
      ...state,

      multiLanePlan,

      multiLaneResponsePlan:
        multiLanePlan,

      responsePlan:
        multiLanePlan,

      multiLanePlannerRan:
        multiLanePlan.multiLanePlannerRan === true,

      multiLanePlannerSource:
        multiLanePlan.source ||
        "unknown"
    };

    mark("after multiLanePlanner");

    // =================================================
    // 5. Situation Contract
    // =================================================

    mark("before situationContract");

    const situationContractOutput =
      situationEligibility.buildSituationContract
        ? await runEngine(
            window.AriSituationContract,
            ["create", "build"],

            {
              situationContractRan: false,
              source: "not-loaded",
              situationContract: null,

              reason:
                "situation_contract_not_loaded"
            },

            {
              ...state,

              situationStageInput:
                this.buildSituationStageInput(state),

              responseLaneDecision,

              multiLanePlan:
                state.multiLanePlan ||
                null
            }
          )
        : {
            situationContractRan: false,

            source:
              "skipped-by-executive-routing",

            situationContract:
              this.buildFallbackSituationContract(state),

            reason:
              "full_situation_contract_not_required"
          };

    const situationContract =
      situationContractOutput.situationContract ||
      (
        situationContractOutput.primary ||
        situationContractOutput.responseShape ||
        situationContractOutput.responseRules
          ? situationContractOutput
          : null
      ) ||
      this.buildFallbackSituationContract(state);

    state = {
      ...state,

      ...situationContractOutput,

      situationContract,

      situationContractRan:
        situationContractOutput
          .situationContractRan === true,

      situationContractSource:
        situationContractOutput.source ||
        situationContract.source ||
        "unknown"
    };

    mark("after situationContract");

    // =================================================
    // 6. Contract Bridge
    // =================================================

    mark("before contractBridge");

    state =
      applyContractBridge(state);

    mark("after contractBridge");

    // =================================================
    // 7. Restore authoritative route boundaries
    // =================================================

    state =
      this.preserveRoutingAuthority(state);

    // =================================================
    // 8. Situation Stage Packet
    // =================================================

    state.situationStagePacket =
      this.buildSituationStagePacket(state);

    state.situationStageRan = true;

    state.situationStageSource =
      "ari-situation-stage";

    state.situationStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveSituationEligibility({
    state = {},
    runInstructions = {},
    safetyDisposition = null
  } = {}) {
    const safetyOverride =
      safetyDisposition?.shouldStopNormalResponse === true;

    const runSituationMap =
      runInstructions.situationMap !== false &&
      state.shouldRunSituationMap !== false;

    const runTriage =
      runInstructions.triage !== false &&
      state.shouldRunTriage !== false;

    const routeHasPrimaryLane =
      Boolean(
        state.routingContract?.primaryLane
      );

    const fastPath =
      runInstructions.fastPath === true ||
      state.routingApplicability
        ?.fastPathEligible === true;

    const runMultiLanePlanner =
      runTriage ||
      safetyOverride ||
      !fastPath ||
      !routeHasPrimaryLane;

    const buildSituationContract =
      runSituationMap ||
      runTriage ||
      runMultiLanePlanner ||
      safetyOverride;

    return {
      runSituationMap,
      runTriage,
      runMultiLanePlanner,
      buildSituationContract,

      safetyOverride,
      fastPath,
      routeHasPrimaryLane,

      source:
        "ari-situation-stage-eligibility",

      reason:
        safetyOverride
          ? "safety_response_requires_situation_contract"
          : fastPath &&
              routeHasPrimaryLane &&
              !runTriage
            ? "authoritative_fast_path_available"
            : "situation_deliberation_required"
    };
  },

  // ===================================================
  // Stage input
  // ===================================================

  buildSituationStageInput(summary = {}) {
    return {
      message: {
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
        summary.continuityPacket ||
        null,

      safety:
        summary.safetyStagePacket ||
        summary.safetyDisposition ||
        null,

      semantic: {
        frame:
          summary.primarySemanticFrame ||
          summary.perceptionPacket
            ?.semantic?.primaryFrame ||
          null,

        summary:
          summary.semanticSummary ||
          summary.perceptionPacket
            ?.semantic?.summary ||
          null
      },

      contextLane:
        summary.contextLane ||
        summary.routingContract?.contextLane ||
        summary.lane ||
        "direct_current_turn",

      proposedResponseLane:
        summary.routingContract?.primaryLane ||
        summary.primaryLane ||
        null
    };
  },

  // ===================================================
  // Response-lane resolution
  // ===================================================

  resolveResponseLaneDecision(summary = {}) {
    const authoritativeRouting =
      summary.routingContract
        ?.authority?.authoritative === true;

    const safetyDisposition =
      summary.safetyDisposition ||
      {};

    const safetyOverride =
      safetyDisposition
        .shouldStopNormalResponse === true;

    const safetyPlanner =
      safetyDisposition.requiredPlanner ||
      null;

    const routingPrimary =
      summary.routingContract?.primaryLane ||
      null;

    const triagePrimary =
      summary.triage?.primaryLane ||
      summary.primaryLaneSuggestion ||
      null;

    let primaryLane =
      routingPrimary ||
      triagePrimary ||
      null;

    let source =
      routingPrimary
        ? "routing_contract"
        : triagePrimary
          ? "triage"
          : "unresolved";

    if (safetyOverride) {
      primaryLane =
        safetyPlanner ||
        "immediate_safety_response";

      source =
        "safety_override";
    } else if (
      authoritativeRouting &&
      routingPrimary
    ) {
      primaryLane =
        routingPrimary;

      source =
        "authoritative_routing_contract";
    }

    const supportLanes =
      this.mergeUnique(
        summary.routingContract?.supportLanes,
        summary.triage?.supportLanes,
        summary.supportLaneSuggestions
      ).filter(
        lane =>
          lane !== primaryLane
      );

    const deferredLanes =
      this.mergeUnique(
        summary.routingContract?.deferredLanes,
        summary.triage?.deferredLanes,
        summary.deferredLaneSuggestions
      ).filter(
        lane =>
          lane !== primaryLane
      );

    const blockedLanes =
      this.mergeUnique(
        summary.routingContract?.blockedLanes,
        summary.triage?.blockedLanes,
        summary.blockedLanes
      );

    return {
      primaryLane,
      supportLanes,
      deferredLanes,
      blockedLanes,

      source,

      safetyOverride,
      authoritativeRouting,

      routingPrimary,
      triagePrimary,

      contextLane:
        summary.contextLane ||
        summary.routingContract?.contextLane ||
        summary.lane ||
        "direct_current_turn"
    };
  },

  // ===================================================
  // Fallback situation contract
  // ===================================================

  buildFallbackSituationContract(summary = {}) {
    const laneDecision =
      summary.responseLaneDecision ||
      this.resolveResponseLaneDecision(summary);

    const safetyDisposition =
      summary.safetyDisposition ||
      {};

    return {
      source:
        "ari-situation-stage-fallback",

      primary:
        laneDecision.primaryLane ||
        "general_understanding",

      support:
        laneDecision.supportLanes ||
        [],

      deferred:
        laneDecision.deferredLanes ||
        [],

      blocked:
        laneDecision.blockedLanes ||
        [],

      responseShape:
        summary.routingContract?.responseShape ||
        summary.triage?.responseShape ||
        (
          safetyDisposition
            .shouldStopNormalResponse === true
            ? "brief_direct_safety_response"
            : "clear_explanation"
        ),

      responseRules:
        this.mergeUnique(
          summary.responseConstraints,
          safetyDisposition.constraints,
          safetyDisposition.requiredBehaviors
        ),

      situationThesis: {
        thesis:
          summary.primarySituationThesis ||
          null,

        narrative:
          summary.situationNarrative ||
          null,

        recommendedUse:
          "do_not_use_as_authority"
      },

      risk: {
        level:
          safetyDisposition.riskLevel ||
          summary.safetyContextGate
            ?.riskLevel ||
          "none",

        type:
          safetyDisposition.riskType ||
          summary.safetyContextGate
            ?.riskType ||
          "none"
      },

      mouthDirective: null,

      fallback: true
    };
  },

  // ===================================================
  // Preserve route authority
  // ===================================================

  preserveRoutingAuthority(summary = {}) {
    const routing =
      summary.routingContract ||
      {};

    const authoritative =
      routing.authority
        ?.authoritative === true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    if (
      !authoritative ||
      safetyOverride
    ) {
      return summary;
    }

    return {
      ...summary,

      contextLane:
        routing.contextLane ||
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      primaryLane:
        routing.primaryLane ||
        summary.primaryLane ||
        null,

      situationContractPrimary:
        routing.primaryLane ||
        summary.situationContractPrimary ||
        null,

      responseShape:
        routing.responseShape ||
        summary.responseShape ||
        null
    };
  },

  // ===================================================
  // Situation Stage Packet
  // ===================================================

  buildSituationStagePacket(summary = {}) {
    return {
      ready: true,

      source:
        "ari-situation-stage",

      version:
        this.version,

      eligibility:
        summary.situationEligibility ||
        null,

      input: {
        routingContract:
          summary.routingContract ||
          null,

        contextLane:
          summary.contextLane ||
          summary.routingContract?.contextLane ||
          null,

        safetyDisposition:
          summary.safetyDisposition ||
          null,

        continuity:
          summary.continuityStagePacket ||
          null
      },

      situationMap: {
        ran:
          summary.situationMapRan === true,

        source:
          summary.situationMapSource ||
          null,

        value:
          summary.situationMap ||
          null
      },

      triage: {
        ran:
          summary.triageEngineRan === true,

        source:
          summary.triageEngineSource ||
          null,

        value:
          summary.triage ||
          null
      },

      laneDecision:
        summary.responseLaneDecision ||
        null,

      multiLanePlan: {
        ran:
          summary.multiLanePlannerRan === true,

        source:
          summary.multiLanePlannerSource ||
          null,

        value:
          summary.multiLanePlan ||
          null
      },

      situationContract: {
        ran:
          summary.situationContractRan === true,

        source:
          summary.situationContractSource ||
          null,

        value:
          summary.situationContract ||
          null
      },

      responseControl: {
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

        rules:
          summary.responseRules ||
          [],

        constraints:
          summary.responseConstraints ||
          []
      },

      authority: {
        canBuildSituationModel:
          true,

        canOrganizeResponseLanes:
          true,

        canCreateSituationContract:
          true,

        canOverrideAuthoritativeRouting:
          false,

        canRespectSafetyOverride:
          true,

        canPerformGeneralReasoning:
          false,

        canWriteFinalLanguage:
          false,

        role:
          "situation_modeling_lane_organization_and_contract"
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
        values.flatMap(
          value =>
            this.toArray(value)
        )
      )
    ];
  }
};

console.log(
  "ARI SITUATION STAGE LOADED:",
  window.AriSituationStage?.version
);