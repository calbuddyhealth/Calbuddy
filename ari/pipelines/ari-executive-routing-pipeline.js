// ari/pipelines/ari-executive-routing-pipeline.js
// Ari Executive Routing Pipeline
// Purpose: Decide which processing path Ari should use.
// V1.1.0 — Existing Routing Decisions Migrated / Compatibility Mode

window.Ari = window.Ari || {};

window.AriExecutiveRoutingPipeline = {
  version: "1.1.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "executive_routing"
    };

    /*
      Current responsibility:

      1. Consume the Perception Packet
      2. Run the existing Lane Splitter
      3. Decide whether continuity sources are applicable
      4. Build a temporary compatibility routing contract
      5. Build the Executive Packet

      Future responsibility:

      1. New Conversation Routing Pipeline
      2. Official mode selection
      3. Official intent selection
      4. Domain selection
      5. Capability selection
      6. Planner selection
      7. Fast-path selection
      8. Applicability validation

      This layer does not:
      - retrieve continuity,
      - retrieve memory,
      - perform triage,
      - perform reasoning,
      - generate a response.
    */

    // =================================================
    // 1. Validate Perception Input
    // =================================================

    const perceptionPacket =
      state.perceptionPacket ||
      this.buildFallbackPerceptionPacket(state);

    state = {
      ...state,
      perceptionPacket
    };

    // =================================================
    // 2. Existing Lane Splitter
    // =================================================

    mark("before laneSplitter");

    const laneSplit =
      window.Ari?.laneSplitterEngine?.split
        ? await window.Ari.laneSplitterEngine.split({
            summary: state,

            perceptionPacket,

            routingEvidence:
              state.routingEvidence ||
              perceptionPacket.routingEvidence ||
              null,

            semanticFrame:
              state.semanticFrameOutput ||
              perceptionPacket.semanticFrame ||
              null,

            primarySemanticFrame:
              state.primarySemanticFrame ||
              perceptionPacket.semanticFrame?.primaryFrame ||
              null,

            semanticSummary:
              state.semanticSummary ||
              perceptionPacket.semanticFrame?.semanticSummary ||
              null
          })
        : {
            engine: "ari-lane-splitter-engine",
            source: "not-loaded",

            lane: "direct_current_turn",

            routing: {
              useCurrentTurn: true,
              useThread: false,
              useMemory: false,
              useRelationship: false,
              goStraightToSituationMap: true
            },

            confidence: null,
            scores: {},
            explanation:
              "Lane Splitter was not loaded. Direct-current-turn fallback used."
          };

    state = {
      ...state,

      laneSplit,

      lane:
        laneSplit.lane ||
        "direct_current_turn",

      routingDecision:
        laneSplit.routing ||
        {},

      laneSplitterRan:
        laneSplit.engine ===
        "ari-lane-splitter-engine",

      laneSplitterSource:
        laneSplit.source ||
        "not-loaded",

      laneSplitterConfidence:
        laneSplit.confidence ||
        null,

      laneSplitterScores:
        laneSplit.scores ||
        {},

      laneSplitterSemanticAware:
        Boolean(
          state.semanticFrameOutput?.semanticFrameBuilderRan ||
          state.semanticSummary ||
          state.semanticFrameOutput?.primaryFrame ||
          state.semanticFrameOutput?.normalizedFrame
        ),

      laneSplitterSemanticFirst:
        laneSplit.semanticFirst ??
        false,

      laneSplitterLexicalFallbackUsed:
        laneSplit.lexicalFallbackUsed ??
        false,

      laneSplitterSemanticFrameType:
        laneSplit.semanticFrameType ||
        null,

      laneSplitterSemanticIntent:
        laneSplit.semanticIntent ||
        null,

      laneSplitterExplanation:
        laneSplit.explanation ||
        null
    };

    mark("after laneSplitter");

    // =================================================
    // 3. Applicability Decisions
    // =================================================

    const applicability =
      this.resolveApplicability(state);

    state = {
      ...state,

      routingApplicability:
        applicability,

      shouldUseContinuity:
        applicability.continuity,

      shouldUseThread:
        applicability.thread,

      shouldUseMemory:
        applicability.memory,

      shouldUseRelationship:
        applicability.relationship,

      shouldUseCurrentTurn:
        applicability.currentTurn,

      shouldRunSituationMap:
        applicability.situationMap,

      shouldRunTriage:
        applicability.triage,

      shouldRunDeveloperLayer:
        applicability.developer,

      shouldRunHeavyReasoning:
        applicability.heavyReasoning
    };

    // =================================================
    // 4. Compatibility Routing Contract
    // =================================================

    const routingContract =
      state.routingContract?.authority?.authoritative === true
        ? state.routingContract
        : this.buildCompatibilityRoutingContract(
            state,
            applicability
          );

    state = {
      ...state,

      routingContract,

      conversationMode:
        routingContract.mode ||
        "unknown",

      primaryIntent:
        routingContract.primaryIntent ||
        "unknown",

      secondaryIntents:
        routingContract.secondaryIntents ||
        [],

      conversationDomain:
        routingContract.domain ||
        "general",

      primaryLane:
        routingContract.primaryLane ||
        state.lane ||
        "direct_current_turn",

      requiredCapabilities:
        routingContract.capabilities ||
        [],

      selectedPlanner:
        routingContract.planner ||
        null,

      routingConfidence:
        routingContract.confidence ||
        {},

      routingAuthority:
        routingContract.authority ||
        {}
    };

    // =================================================
    // 5. Executive Packet
    // =================================================

    state.executivePacket =
      this.buildExecutivePacket(state);

    state.executiveRoutingPipelineRan = true;
    state.executiveRoutingPipelineSource =
      "ari-executive-routing-pipeline";
    state.executiveRoutingPipelineVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Applicability
  // ===================================================

  resolveApplicability(summary = {}) {
    const laneRouting =
      summary.laneSplit?.routing ||
      summary.routingDecision ||
      {};

    const userText = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

    const possibleDeveloperRequest =
      summary.conversationFunction?.developerArtifactRequest === true ||
      summary.artifactModificationRequest === true ||
      summary.artifactCreationRequest === true ||
      summary.artifactInvestigationRequest === true ||
      summary.developerArtifactRequest === true ||
      summary.primaryFunction ===
        "developer_artifact_request" ||
      summary.primaryFunction ===
        "build_or_debug_request" ||
      /\b(code|file|github|repo|commit|patch|function|html|css|javascript|api|engine|bug|fix|update|edit|build|implement|developer|composer|pipeline|latency|slow|bottleneck|performance|diagnose)\b/i.test(
        userText
      );

    const continuity =
      laneRouting.useThread === true ||
      laneRouting.useMemory === true ||
      laneRouting.useRelationship === true;

    const likelySimpleTurn =
      continuity === false &&
      possibleDeveloperRequest === false &&
      summary.safetyContextGate?.shouldStopNormalResponse !== true &&
      String(userText).trim().length <= 120;

    return {
      currentTurn:
        laneRouting.useCurrentTurn !== false,

      continuity,

      thread:
        laneRouting.useThread === true,

      memory:
        laneRouting.useMemory === true,

      relationship:
        laneRouting.useRelationship === true,

      deepSafety:
        false,

      situationMap:
        laneRouting.goStraightToSituationMap !== false,

      triage:
        true,

      developer:
        possibleDeveloperRequest,

      heavyReasoning:
        !likelySimpleTurn,

      fastPathEligible:
        likelySimpleTurn,

      source:
        "legacy_lane_splitter_compatibility",

      authoritative:
        false
    };
  },

  // ===================================================
  // Temporary routing contract
  // ===================================================

  buildCompatibilityRoutingContract(
    summary = {},
    applicability = {}
  ) {
    const conversationFunction =
      summary.conversationFunction ||
      {};

    const classification =
      summary.universalConversationClassification ||
      {};

    const semanticFrame =
      summary.semanticFrameOutput ||
      {};

    return {
      ready: true,
      source:
        "ari-executive-routing-pipeline-compatibility",
      version: this.version,

      speechAct: {
        primary:
          conversationFunction.primaryFunction ||
          "unknown",

        secondary:
          conversationFunction.supportFunctions ||
          [],

        confidence:
          conversationFunction.confidence ||
          null,

        authoritative:
          false
      },

      mode:
        classification.conversationType ||
        "unknown",

      primaryIntent:
        classification.conversationIntent ||
        "unknown",

      secondaryIntents: [],

      domain:
        semanticFrame.domain ||
        semanticFrame.normalizedFrame?.domain ||
        "general",

      primaryLane:
        summary.laneSplit?.lane ||
        "direct_current_turn",

      capabilities: [],

      planner: null,

      responseShape:
        summary.semanticResponseCharacteristics?.responseShape ||
        null,

      run: {
        currentTurn:
          applicability.currentTurn !== false,

        continuity:
          applicability.continuity === true,

        thread:
          applicability.thread === true,

        memory:
          applicability.memory === true,

        relationship:
          applicability.relationship === true,

        deepSafety:
          applicability.deepSafety === true,

        situationMap:
          applicability.situationMap !== false,

        triage:
          applicability.triage !== false,

        developer:
          applicability.developer === true,

        heavyReasoning:
          applicability.heavyReasoning !== false,

        fastPath:
          applicability.fastPathEligible === true
      },

      confidence: {
        speechAct:
          conversationFunction.confidence ||
          null,

        mode:
          classification.confidence ||
          classification.conversationConfidence ||
          null,

        intent:
          classification.intentConfidence ||
          null,

        lane:
          summary.laneSplitterConfidence ||
          null
      },

      evidence: {
        perceptionPacketAvailable:
          Boolean(summary.perceptionPacket),

        conversationFunction:
          conversationFunction.primaryFunction ||
          null,

        universalClassification: {
          type:
            classification.conversationType ||
            null,

          intent:
            classification.conversationIntent ||
            null
        },

        semanticFrame:
          semanticFrame.primaryFrame ||
          null,

        laneSplit:
          summary.laneSplit ||
          null
      },

      authority: {
        authoritative: false,
        compatibilityMode: true,

        ownsFinalMode: false,
        ownsFinalIntent: false,
        ownsFinalPlanner: false,

        reason:
          "The new authoritative Conversation Routing Pipeline has not been installed yet."
      }
    };
  },

  // ===================================================
  // Executive Packet
  // ===================================================

  buildExecutivePacket(summary = {}) {
    return {
      ready: true,
      source:
        "ari-executive-routing-pipeline",
      version: this.version,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      routingContract:
        summary.routingContract ||
        null,

      laneSplit:
        summary.laneSplit ||
        null,

      applicability:
        summary.routingApplicability ||
        {},

      selectedRoute: {
        speechAct:
          summary.routingContract?.speechAct ||
          null,

        mode:
          summary.conversationMode ||
          "unknown",

        primaryIntent:
          summary.primaryIntent ||
          "unknown",

        secondaryIntents:
          summary.secondaryIntents ||
          [],

        domain:
          summary.conversationDomain ||
          "general",

        primaryLane:
          summary.primaryLane ||
          summary.lane ||
          "direct_current_turn",

        capabilities:
          summary.requiredCapabilities ||
          [],

        planner:
          summary.selectedPlanner ||
          null
      },

      runInstructions: {
        continuity:
          summary.shouldUseContinuity === true,

        thread:
          summary.shouldUseThread === true,

        memory:
          summary.shouldUseMemory === true,

        relationship:
          summary.shouldUseRelationship === true,

        deepSafety:
          summary.routingApplicability?.deepSafety === true,

        situationMap:
          summary.shouldRunSituationMap !== false,

        triage:
          summary.shouldRunTriage !== false,

        developer:
          summary.shouldRunDeveloperLayer === true,

        heavyReasoning:
          summary.shouldRunHeavyReasoning !== false,

        fastPath:
          summary.routingApplicability?.fastPathEligible === true
      },

      authority: {
        canCollectEvidence: false,
        canBuildSemanticMeaning: false,

        canChooseRoute: true,
        canChooseApplicability: true,

        canPerformReasoning: false,
        canWriteFinalLanguage: false,

        role:
          "routing_and_execution_eligibility"
      }
    };
  },

  // ===================================================
  // Compatibility fallback
  // ===================================================

  buildFallbackPerceptionPacket(summary = {}) {
    return {
      ready: false,
      source:
        "ari-executive-routing-pipeline-fallback",
      version: this.version,

      message: {
        raw:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        normalized:
          summary.normalizedMessage ||
          ""
      },

      safetyScreen:
        summary.safetyContextGate ||
        null,

      observerEvidence:
        summary.observerEvidence ||
        null,

      conversationFunction:
        summary.conversationFunction ||
        null,

      universalClassification:
        summary.universalConversationClassification ||
        null,

      routingEvidence:
        summary.routingEvidence ||
        null,

      semanticFrame:
        summary.semanticFrameOutput ||
        null,

      authority: {
        canChooseFinalRoute: false,
        canChoosePlanner: false,
        canAnswerUser: false,
        role:
          "compatibility_perception_fallback"
      }
    };
  }
};

console.log(
  "ARI EXECUTIVE ROUTING PIPELINE LOADED:",
  window.AriExecutiveRoutingPipeline?.version
);