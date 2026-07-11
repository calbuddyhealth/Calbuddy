// ari/pipelines/ari-perception-pipeline.js
// Ari Perception Pipeline
// Purpose: Collect and structure evidence about the current user message.
// V1.1.1 — Existing Perception Chain Migrated

window.Ari = window.Ari || {};

window.AriPerceptionPipeline = {
  version: "1.1.1",

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
  const observer =
    summary.observerEvidence ||
    {};

  const conversationFunction =
    summary.conversationFunction ||
    {};

  const classification =
    summary.universalConversationClassification ||
    {};

  const routingEvidence =
    summary.routingEvidence ||
    {};

  const semanticFrame =
    summary.semanticFrameOutput ||
    {};

  const safetyScreen =
    summary.safetyContextGate ||
    null;

  const observations =
    observer.observations ||
    summary.observations ||
    [];

  const primaryFrame =
    semanticFrame.primaryFrame ||
    semanticFrame.normalizedFrame ||
    null;

  const message =
    summary.userMessage ||
    summary.message ||
    summary.input ||
    "";

  const normalizedMessage =
    summary.normalizedMessage ||
    String(message).toLowerCase().trim();

  return {
    ready: true,
    source: "ari-perception-pipeline",
    version: this.version,

    // =================================================
    // Original message
    // =================================================

    message: {
      raw: message,
      normalized: normalizedMessage,

      length:
        String(message).length,

      wordCount:
        String(normalizedMessage)
          .split(/\s+/)
          .filter(Boolean)
          .length
    },

    // =================================================
    // Early safety screening
    // =================================================

    safetyScreen: {
      available:
        Boolean(safetyScreen),

      ran:
        safetyScreen?.safetyContextGateRan === true,

      riskLevel:
        safetyScreen?.riskLevel ||
        "none",

      riskType:
        safetyScreen?.riskType ||
        "none",

      primaryRisk:
        safetyScreen?.primaryRisk ||
        null,

      risks:
        safetyScreen?.risks ||
        [],

      possibleOverride:
        safetyScreen?.override ||
        null,

      shouldStopNormalResponse:
        safetyScreen?.shouldStopNormalResponse === true,

      requiresClarification:
        safetyScreen?.shouldAskRiskClarification === true ||
        safetyScreen?.followUpNeeded === true,

      evidence:
        safetyScreen?.evidence ||
        [],

      reasons:
        safetyScreen?.reasons ||
        [],

      raw:
        safetyScreen
    },

    // =================================================
    // Raw observations
    // =================================================

    observer: {
      available:
        observer.observerEvidenceRan === true,

      source:
        observer.observerEvidenceSource ||
        observer.source ||
        "unknown",

      observations,

      observationCount:
        observer.observationCount ??
        observations.length,

      observedTypes:
        observer.observedTypes ||
        [...new Set(observations.map(item => item.type).filter(Boolean))],

      observedValues:
        observer.observedValues ||
        [...new Set(observations.map(item => item.value).filter(Boolean))],

      highestConfidenceObservation:
  observations.length
    ? [...observations].sort(
        (a, b) =>
          Number(b?.confidence || 0) -
          Number(a?.confidence || 0)
      )[0]
    : null
    },

    // =================================================
    // Communicative function evidence
    // =================================================

    conversationFunction: {
      available:
        conversationFunction.conversationFunctionRan === true,

      primary:
        conversationFunction.primaryFunction ||
        "unknown",

      support:
        conversationFunction.supportFunctions ||
        [],

      blocked:
        conversationFunction.blockedFunctions ||
        [],

      candidates:
        conversationFunction.candidates ||
        [],

      responseBias:
        conversationFunction.responseBias ||
        null,

      confidence:
        conversationFunction.confidence ??
        null,

      raw:
        conversationFunction
    },

    // =================================================
    // Broad classification evidence
    // =================================================

    classification: {
      available:
        classification.universalConversationClassifierRan === true,

      type:
        classification.conversationType ||
        "unknown",

      intent:
        classification.conversationIntent ||
        "unknown",

      responseHint:
        classification.conversationResponseHint ||
        null,

      candidates:
        classification.conversationCandidates ||
        [],

      confidence:
        classification.confidence ??
        classification.conversationConfidence ??
        null,

      raw:
        classification
    },

    // =================================================
    // Routing evidence only
    // =================================================

    routingEvidence: {
      available:
        summary.routingEvidenceRan === true,

      source:
        summary.routingEvidenceSource ||
        routingEvidence.source ||
        "unknown",

      pressures:
        routingEvidence.routingPressures ||
        summary.routingPressures ||
        {},

      preservedObservations:
        routingEvidence.preservedObserverEvidence ||
        summary.preservedObserverEvidence ||
        [],

      preservedObservationCount:
        routingEvidence.preservedObservationCount ??
        summary.preservedObservationCount ??
        0,

      raw:
        routingEvidence
    },

    // =================================================
    // Structured semantic meaning
    // =================================================

    semantic: {
      available:
        semanticFrame.semanticFrameBuilderRan === true,

      advisoryOnly:
        semanticFrame.advisoryOnly !== false,

      primaryFrame,

      normalizedFrame:
        semanticFrame.normalizedFrame ||
        null,

      secondaryFrames:
        semanticFrame.secondaryFrames ||
        [],

      allFrames:
        semanticFrame.allFrames ||
        [],

      summary:
        semanticFrame.semanticSummary ||
        summary.semanticSummary ||
        null,

      continuity:
        semanticFrame.continuity ||
        summary.semanticContinuity ||
        {},

      responseCharacteristics:
        semanticFrame.responseCharacteristics ||
        summary.semanticResponseCharacteristics ||
        {},

      emotionalOverlay:
        semanticFrame.emotionalOverlay ||
        summary.semanticEmotionalOverlay ||
        {},

      ambiguity:
        semanticFrame.ambiguity ||
        summary.semanticAmbiguity ||
        {},

      raw:
        semanticFrame
    },

    // =================================================
    // Signals for the Executive Routing layer
    // These are evidence, not final decisions.
    // =================================================

    routingHandoff: {
      conversationFunction:
        conversationFunction.primaryFunction ||
        "unknown",

      functionCandidates:
        conversationFunction.candidates ||
        [],

      classificationType:
        classification.conversationType ||
        "unknown",

      classificationIntent:
        classification.conversationIntent ||
        "unknown",

      classificationCandidates:
        classification.conversationCandidates ||
        [],

      semanticFrameType:
        primaryFrame?.frameType ||
        primaryFrame?.type ||
        null,

      semanticIntent:
        primaryFrame?.intent ||
        semanticFrame.normalizedFrame?.intent ||
        null,

      semanticAction:
        primaryFrame?.action ||
        semanticFrame.normalizedFrame?.action ||
        null,

      requestedOutput:
        primaryFrame?.requestedOutput ||
        primaryFrame?.object?.type ||
        semanticFrame.normalizedFrame?.requestedOutput ||
        null,

      semanticSummary:
        semanticFrame.semanticSummary ||
        null,

      routingPressures:
        routingEvidence.routingPressures ||
        {},

      safetyStatus: {
        riskLevel:
          safetyScreen?.riskLevel ||
          "none",

        shouldStopNormalResponse:
          safetyScreen?.shouldStopNormalResponse === true,

        clarificationNeeded:
          safetyScreen?.followUpNeeded === true
      }
    },

    // =================================================
    // Quality and completeness
    // =================================================

    quality: {
      hasMessage:
        Boolean(String(message).trim()),

      hasObservations:
        observations.length > 0,

      hasConversationFunction:
        conversationFunction.primaryFunction &&
        conversationFunction.primaryFunction !== "unknown",

      hasClassification:
        classification.conversationType &&
        classification.conversationType !== "unknown",

      hasSemanticFrame:
        Boolean(primaryFrame),

      hasSemanticSummary:
        Boolean(semanticFrame.semanticSummary),

      ambiguityPresent:
        semanticFrame.ambiguity?.ambiguous === true ||
        Boolean(
          semanticFrame.ambiguity?.unresolvedReferences?.length
        ),

      missingInputs: [
        !String(message).trim()
          ? "message"
          : null,

        !observations.length
          ? "observations"
          : null,

        !conversationFunction.primaryFunction ||
        conversationFunction.primaryFunction === "unknown"
          ? "conversation_function"
          : null,

        !classification.conversationType ||
        classification.conversationType === "unknown"
          ? "classification"
          : null,

        !primaryFrame
          ? "semantic_frame"
          : null
      ].filter(Boolean)
    },

    // =================================================
    // Authority boundary
    // =================================================

    authority: {
      canObserveEvidence: true,
      canRepresentMeaning: true,

      canChooseFinalRoute: false,
      canChooseMode: false,
      canChooseFinalIntent: false,
      canChooseCapabilities: false,
      canChoosePlanner: false,

      canDetermineFinalSafetySeverity: false,
      canPerformDeliberation: false,
      canAnswerUser: false,

      role:
        "evidence_and_structured_meaning_handoff"
    }
  };
}
};

console.log(
  "ARI PERCEPTION PIPELINE LOADED:",
  window.AriPerceptionPipeline?.version
);