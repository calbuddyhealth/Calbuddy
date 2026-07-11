// ari/pipelines/ari-perception-pipeline.js
// Ari Perception Pipeline
// Purpose: Collect and structure evidence about the current user message.
// V1.1.0 — Existing Perception Chain Migrated

window.Ari = window.Ari || {};

window.AriPerceptionPipeline = {
  version: "1.1.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "perception"
    };

    // -------------------------------------------------
    // 1. Early Safety Context Gate
    // -------------------------------------------------

    mark("before safetyContextGate");

    const safetyContextGate = await runEngine(
      window.AriSafetyContextGate,
      ["evaluate"],
      {
        safetyContextGateRan: false,
        source: "not-loaded",
        override: null,
        riskLevel: "none",
        riskType: "none",
        followUpNeeded: false,
        followUpQuestion: null,
        shouldStopNormalResponse: false
      },
      state
    );

    state = {
      ...state,
      safetyContextGate,
      ...safetyContextGate
    };

    mark("after safetyContextGate");

    // -------------------------------------------------
    // 2. Observer Network
    // -------------------------------------------------

    mark("before observerEvidence");

    const observerResult = await runEngine(
      window.Ari?.observerNetwork,
      ["observe"],
      {
        observerEvidenceRan: false,
        observerEvidenceSource: "not-loaded",
        observations: [],
        observationLedger: [],
        observedTypes: [],
        observedValues: [],
        observationCount: 0
      },
      state
    );

    state = {
      ...state,

      observerEvidence: observerResult,
      observer: observerResult,

      ...observerResult,

      observations:
        observerResult.observations ||
        [],

      observationLedger:
        observerResult.observationLedger ||
        observerResult.observations ||
        [],

      observedTypes:
        observerResult.observedTypes ||
        [],

      observedValues:
        observerResult.observedValues ||
        [],

      observationCount:
        observerResult.observationCount ||
        0
    };

    mark("after observerEvidence");

    // -------------------------------------------------
    // 3. Conversation Function
    // -------------------------------------------------

    mark("before conversationFunction");

    const conversationFunctionResult = await runEngine(
      window.AriConversationFunctionEngine,
      ["analyze"],
      {
        conversationFunctionRan: false,
        conversationFunctionSource: "not-loaded",
        primaryFunction: "unknown",
        supportFunctions: [],
        blockedFunctions: [],
        candidates: [],
        responseBias: null,
        confidence: null
      },
      state
    );

    state = {
      ...state,

      conversationFunction:
        conversationFunctionResult,

      ...conversationFunctionResult
    };

    mark("after conversationFunction");

    // -------------------------------------------------
    // 4. Universal Conversation Classifier
    // -------------------------------------------------

    mark("before universalConversationClassifier");

    const conversationResult = await runEngine(
      window.AriUniversalConversationClassifier,
      ["classify"],
      {
        universalConversationClassifierRan: false,
        universalConversationClassifierSource: "not-loaded",
        conversationType: "unknown",
        conversationIntent: "unknown",
        conversationResponseHint: null,
        conversationCandidates: []
      },
      state
    );

    state = {
      ...state,

      ...conversationResult,

      universalConversationClassification:
        conversationResult
    };

    mark("after universalConversationClassifier");

    // -------------------------------------------------
    // 5. Observer Routing Evidence
    // -------------------------------------------------

    mark("before observerRoutingEvidence");

    const routingEvidence =
      window.Ari?.observerRoutingEvidence?.analyze
        ? await window.Ari.observerRoutingEvidence.analyze({
            summary: state,
            observer: state.observerEvidence
          })
        : {
            engine: "ari-observer-routing-evidence",
            source: "not-loaded",
            routingPressures: {},
            preservedObserverEvidence:
              state.observations ||
              []
          };

    state = {
      ...state,

      routingEvidence,
      observerRoutingEvidence:
        routingEvidence,

      routingEvidenceRan:
        routingEvidence.engine ===
        "ari-observer-routing-evidence",

      routingEvidenceSource:
        routingEvidence.source ||
        "not-loaded",

      routingPressures:
        routingEvidence.routingPressures ||
        {},

      preservedObserverEvidence:
        routingEvidence.preservedObserverEvidence ||
        [],

      preservedObservationCount:
        routingEvidence.preservedObservationCount ??
        0
    };

    mark("after observerRoutingEvidence");

    // -------------------------------------------------
    // 6. Semantic Frame Builder
    // -------------------------------------------------

    mark("before semanticFrameBuilder");

    const semanticFrameOutput = await runEngine(
      window.AriSemanticFrameBuilder ||
      window.Ari?.semanticFrameBuilder,
      ["build"],
      {
        semanticFrameBuilderRan: false,
        semanticFrameBuilderVersion: null,
        semanticFrameSource: "not-loaded",
        advisoryOnly: true,
        primaryFrame: null,
        normalizedFrame: null,
        secondaryFrames: [],
        allFrames: [],
        continuity: {},
        responseCharacteristics: {},
        emotionalOverlay: {},
        ambiguity: {},
        semanticSummary: null
      },
      state
    );

    state = {
      ...state,

      semanticFrameOutput,
      semanticFrame:
        semanticFrameOutput,

      activeSemanticFrame:
        semanticFrameOutput.primaryFrame ||
        null,

      primarySemanticFrame:
        semanticFrameOutput.primaryFrame ||
        null,

      semanticSummary:
        semanticFrameOutput.semanticSummary ||
        null,

      semanticContinuity:
        semanticFrameOutput.continuity ||
        {},

      semanticResponseCharacteristics:
        semanticFrameOutput.responseCharacteristics ||
        {},

      semanticEmotionalOverlay:
        semanticFrameOutput.emotionalOverlay ||
        {},

      semanticAmbiguity:
        semanticFrameOutput.ambiguity ||
        {}
    };

    mark("after semanticFrameBuilder");

    // -------------------------------------------------
    // Perception Packet
    // -------------------------------------------------

    state.perceptionPacket =
      this.buildPerceptionPacket(state);

    state.perceptionPipelineRan = true;
    state.perceptionPipelineSource =
      "ari-perception-pipeline";
    state.perceptionPipelineVersion =
      this.version;

    return state;
  },

  buildPerceptionPacket(summary = {}) {
    return {
      ready: true,
      source: "ari-perception-pipeline",
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
        role: "evidence_and_meaning_only"
      }
    };
  }
};

console.log(
  "ARI PERCEPTION PIPELINE LOADED:",
  window.AriPerceptionPipeline?.version
);