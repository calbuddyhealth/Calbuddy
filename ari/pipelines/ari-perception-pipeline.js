// ari/pipelines/ari-perception-pipeline.js
// Ari Perception Pipeline
// Purpose: Collect, preserve, merge, and structure evidence about the current user message.
// V1.3.0 — Locked Perception Architecture / Reconciliation Ready

window.Ari = window.Ari || {};

window.AriPerceptionPipeline = {
  version: "1.3.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "perception",
      perceptionStageErrors: []
    };

    /* =====================================================
       1. EARLY SAFETY CONTEXT SCREEN
    ===================================================== */

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
        primaryRisk: null,
        risks: [],
        evidence: [],
        reasons: [],
        followUpNeeded: false,
        followUpQuestion: null,
        shouldAskRiskClarification: false,
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

    /* =====================================================
       2. GENERAL OBSERVER NETWORK
    ===================================================== */

    mark("before observerEvidence");

    const observerResult = await runEngine(
      window.Ari?.observerNetwork,
      ["observe"],
      {
        observerEvidenceRan: false,
        observerEvidenceSource: "not-loaded",
        observations: [],
        observationLedger: [],
        canonicalObservationLedger: [],
        observedTypes: [],
        observedValues: [],
        observedCategories: [],
        observedDomains: [],
        observationCount: 0
      },
      state
    );

    state = {
      ...state,

      observerEvidence: observerResult,
      observer: observerResult,

      observations:
        observerResult.observations ||
        [],

      observationLedger:
        observerResult.observationLedger ||
        observerResult.observations ||
        [],

      canonicalObservationLedger:
        observerResult.canonicalObservationLedger ||
        observerResult.observationLedger ||
        observerResult.observations ||
        [],

      observedTypes:
        observerResult.observedTypes ||
        [],

      observedValues:
        observerResult.observedValues ||
        [],

      observedCategories:
        observerResult.observedCategories ||
        [],

      observedDomains:
        observerResult.observedDomains ||
        [],

      observationCount:
        observerResult.observationCount ||
        0
    };

    mark("after observerEvidence");

    /* =====================================================
       3. QUESTION UNDERSTANDING SPECIALIST
    ===================================================== */

    mark("before questionUnderstanding");

    const questionUnderstanding = await runEngine(
      window.Ari?.questionUnderstanding,
      ["analyze", "observe"],
      {
        questionUnderstandingRan: false,
        questionUnderstandingSource: "not-loaded",
        primaryPurpose: "understanding",
        primaryPurposeConfidence: 0,
        supportPurposes: [],
        purposeCandidates: [],
        requestedOperations: [],
        requestedOutputs: [],
        observations: [],
        observationCount: 0,
        responseHints: {}
      },
      state
    );

    state = {
      ...state,

      questionUnderstanding,
      questionUnderstandingResult:
        questionUnderstanding,

      questionPurpose:
        questionUnderstanding.primaryPurpose ||
        "understanding",

      questionPurposeConfidence:
        questionUnderstanding.primaryPurposeConfidence ??
        0,

      questionPurposeCandidates:
        questionUnderstanding.purposeCandidates ||
        [],

      requestedOperations:
        questionUnderstanding.requestedOperations ||
        [],

      requestedOutputs:
        questionUnderstanding.requestedOutputs ||
        [],

      questionResponseHints:
        questionUnderstanding.responseHints ||
        {}
    };

    mark("after questionUnderstanding");

    /* =====================================================
       4. LIFE-SIGNAL SPECIALIST
    ===================================================== */

    mark("before lifeSignalExtractor");

    const lifeSignalResult = await runEngine(
      window.Ari?.lifeSignalExtractor,
      ["analyze", "observe", "extract"],
      {
        lifeSignalExtractorRan: false,
        lifeSignalExtractorSource: "not-loaded",
        signals: [],
        directSignals: [],
        inferredSignals: [],
        observations: [],
        observationCount: 0,
        signalNames: [],
        primarySignal: null,
        primarySignalName: null,
        primarySignalConfidence: 0,
        hasLifeContextSignal: false,
        hasTransitionEvidence: false,
        hasMajorLifeSignal: false,
        domains: [],
        pressures: [],
        transitions: []
      },
      state
    );

    state = {
      ...state,

      lifeSignalResult,
      lifeSignals:
        lifeSignalResult.signals ||
        [],

      lifeSignalNames:
        lifeSignalResult.signalNames ||
        [],

      primaryLifeSignal:
        lifeSignalResult.primarySignal ||
        null,

      primaryLifeSignalName:
        lifeSignalResult.primarySignalName ||
        lifeSignalResult.primarySignal?.name ||
        null,

      primaryLifeSignalConfidence:
        lifeSignalResult.primarySignalConfidence ??
        lifeSignalResult.primarySignal?.confidence ??
        0,

      hasLifeContextSignal:
        lifeSignalResult.hasLifeContextSignal === true,

      hasTransitionEvidence:
        lifeSignalResult.hasTransitionEvidence === true,

      hasMajorLifeSignal:
        lifeSignalResult.hasMajorLifeSignal === true
    };

    mark("after lifeSignalExtractor");

    /* =====================================================
       5. CANONICAL OBSERVATION LEDGER MERGE
    ===================================================== */

    mark("before perceptionLedgerMerge");

    const ledgerMerge = this.mergeObservationSources({
      observer: observerResult,
      questionUnderstanding,
      lifeSignals: lifeSignalResult
    });

    state = {
      ...state,

      observations:
        ledgerMerge.observations,

      observationLedger:
        ledgerMerge.observations,

      canonicalObservationLedger:
        ledgerMerge.observations,

      rankedLedgerObservations:
        ledgerMerge.ranked,

      observationLedgerSummary:
        ledgerMerge.summary,

      observationCount:
        ledgerMerge.observations.length,

      observedTypes:
        ledgerMerge.observedTypes,

      observedValues:
        ledgerMerge.observedValues,

      observedCategories:
        ledgerMerge.observedCategories,

      observedDomains:
        ledgerMerge.observedDomains,

      perceptionObservationSources:
        ledgerMerge.sourceCounts,

      perceptionDuplicateObservationCount:
        ledgerMerge.duplicateCount,

      perceptionObservationMergeRan: true
    };

    state.observerEvidence = {
      ...state.observerEvidence,

      observations:
        ledgerMerge.observations,

      observationLedger:
        ledgerMerge.observations,

      canonicalObservationLedger:
        ledgerMerge.observations,

      rankedLedgerObservations:
        ledgerMerge.ranked,

      observationLedgerSummary:
        ledgerMerge.summary,

      observationCount:
        ledgerMerge.observations.length,

      observedTypes:
        ledgerMerge.observedTypes,

      observedValues:
        ledgerMerge.observedValues,

      observedCategories:
        ledgerMerge.observedCategories,

      observedDomains:
        ledgerMerge.observedDomains,

      specialistEvidence: {
        questionUnderstanding,
        lifeSignals: lifeSignalResult
      }
    };

    state.observer = state.observerEvidence;

    mark("after perceptionLedgerMerge");

        /* =====================================================
       6. UNIVERSAL CONVERSATION CLASSIFIER
       Broad interaction family, intent family, and domains.
       Uses only upstream evidence.
    ===================================================== */

    mark("before universalConversationClassifier");

    const conversationClassification = await runEngine(
      window.AriUniversalConversationClassifier ||
      window.Ari?.universalConversationClassifier,
      ["classify"],
      {
        universalConversationClassifierRan: false,
        universalConversationClassifierSource: "not-loaded",

        conversationType: "unknown",
        conversationIntent: "unknown",

        interactionFamily: "general",
        intentFamily: "general_response",

        primaryDomain: "general_understanding",
        domains: ["general_understanding"],
        contextualSignals: [],

        explicitRequestPresent: false,
        explicitRequestType: null,
        explicitRequestedOperation: null,
        explicitRequestedOutput: null,
        explicitRequestOverridesContext: false,

        conversationResponseHint: null,
        conversationCandidates: [],

        confidence: 0,
        confidenceLabel: "very_low"
      },
      state
    );

    state = {
      ...state,
      ...conversationClassification,

      universalConversationClassification:
        conversationClassification,

      conversationClassification:
        conversationClassification,

      interactionFamily:
        conversationClassification.interactionFamily ||
        "general",

      intentFamily:
        conversationClassification.intentFamily ||
        "general_response",

      conversationDomains:
        conversationClassification.domains ||
        [],

      conversationPrimaryDomain:
        conversationClassification.primaryDomain ||
        "general_understanding",

      conversationContextualSignals:
        conversationClassification.contextualSignals ||
        [],

      explicitRequestPresent:
        conversationClassification.explicitRequestPresent === true,

      explicitRequestType:
        conversationClassification.explicitRequestType ||
        null,

      explicitRequestedOperation:
        conversationClassification.explicitRequestedOperation ||
        null,

      explicitRequestedOutput:
        conversationClassification.explicitRequestedOutput ||
        null
    };

    mark("after universalConversationClassifier");

    /* =====================================================
       7. OBSERVER ROUTING EVIDENCE
       Converts observer evidence into pressures only.
       It cannot choose the route.
    ===================================================== */

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
            semanticClues: {},
            routingGuards: {},

            preservedObserverEvidence:
              state.observations ||
              [],

            preservedObservationCount:
              state.observationCount ||
              0
          };

    state = {
      ...state,

      routingEvidence,

      observerRoutingEvidence:
        routingEvidence,

      routingEvidenceRan:
        routingEvidence.engine ===
          "ari-observer-routing-evidence" ||
        routingEvidence.routingEvidenceRan === true,

      routingEvidenceSource:
        routingEvidence.source ||
        "not-loaded",

      routingPressures:
        routingEvidence.routingPressures ||
        {},

      routingSemanticClues:
        routingEvidence.semanticClues ||
        {},

      routingGuards:
        routingEvidence.routingGuards ||
        {},

      preservedObserverEvidence:
        routingEvidence.preservedObserverEvidence ||
        state.observations ||
        [],

      preservedObservationCount:
        routingEvidence.preservedObservationCount ??
        state.observationCount ??
        0
    };

    mark("after observerRoutingEvidence");

    /* =====================================================
       8. SEMANTIC FRAME BUILDER
       Builds structured meaning using the classifier as broad
       evidence, not as final authority.
    ===================================================== */

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

  semanticFrameResult:
    semanticFrameOutput,

  semanticFrameBuilderResult:
    semanticFrameOutput,

  semanticFrame:
    semanticFrameOutput,

      activeSemanticFrame:
        semanticFrameOutput.primaryFrame ||
        semanticFrameOutput.normalizedFrame ||
        null,

      primarySemanticFrame:
        semanticFrameOutput.primaryFrame ||
        semanticFrameOutput.normalizedFrame ||
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

    /* =====================================================
       9. CONVERSATION FUNCTION
       Determines what Ari must do after full meaning exists.
    ===================================================== */

    mark("before conversationFunction");

    const conversationFunctionResult = await runEngine(
      window.AriConversationFunctionEngine ||
      window.Ari?.conversationFunctionEngine,
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

      conversationFunctionResult,

      ...conversationFunctionResult
    };

    mark("after conversationFunction");

    /* =====================================================
       10. PERCEPTION RECONCILIATION
       Reconciles structured semantic meaning, conversation
       purpose, safety, continuity, ambiguity, and response
       requirements into one downstream intent packet.

       It cannot reinterpret raw text, route, plan, or answer.
    ===================================================== */

    mark("before perceptionReconciliation");

    const perceptionReconciliation =
      await runEngine(
        window.AriPerceptionReconciliationEngine ||
        window.Ari?.perceptionReconciliationEngine,
        ["reconcile", "analyze"],
        {
          perceptionReconciliationRan:
            false,

          perceptionReconciliationVersion:
            null,

          perceptionReconciliationSource:
            "not-loaded",

          reconciled:
            false,

          validation: {
            requiredSourcesPresent:
              false,

            missingRequiredSources: [
              "semantic_structure",
              "semantic_meaning",
              "conversation_function"
            ],

            structurallyUsable:
              false
          },

          semanticIntent: {
            available:
              false,

            requestedOperation:
              null,

            requestedOutput:
              null,

            userGoal:
              null
          },

          conversationPurpose: {
            available:
              false,

            name:
              null,

            family:
              null
          },

          supportingPurposes:
            [],

          safety: {
            sourceAvailable:
              false,

            present:
              false,

            immediateResponseRequired:
              false,

            requirements:
              [],

            restrictions:
              []
          },

          continuity: {
            sourceAvailable:
              false,

            isContinuation:
              false,

            requiresPriorContext:
              false,

            priorContextAvailable:
              false
          },

          ambiguity: {
            sourceAvailable:
              false,

            present:
              false,

            requiresClarification:
              false
          },

          context: {
            modifiers:
              [],

            constraints:
              [],

            stakes:
              [],

            emotional: {
              sourceAvailable:
                false,

              present:
                false,

              explicitSupportRequested:
                false
            }
          },

          agreement: {
            conflictPresent:
              false,

            unresolvedConflictPresent:
              false,

            conflicts:
              []
          },

          governance: {
            responseOrder:
              "normal",

            safetyGoverning:
              false,

            clarificationRequired:
              false,

            missingPriorContext:
              false
          },

          responseRequirements: {
            objective:
              null,

            semanticTask:
              null,

            conversationalPurpose:
              null,

            supportingPurposes:
              [],

            must:
              [],

            should:
              [],

            mustNot:
              [],

            requirementConflicts: {
              present:
                false,

              count:
                0,

              items:
                [],

              unresolved:
                []
            },

            responseOrder:
              "normal"
          },

          confidence:
            0,

          confidenceScore:
            0,

          confidenceLabel:
            "very_low",

          readiness: {
            status:
              "not_ready",

            packetUsable:
              false,

            readyForRouting:
              false,

            readyForPlanning:
              false,

            readyForResponsePreparation:
              false,

            immediateSafetyResponseRequired:
              false,

            clarificationRequired:
              false,

            unresolvedConflict:
              false,

            unresolvedRequirementConflict:
              false
          },

          conversationIntentPacket:
            null,

          unifiedIntentPacket:
            null,

          handoff: {
            ready:
              false,

            packetUsable:
              false,

            readyForRouting:
              false,

            readyForPlanning:
              false,

            readyForResponsePreparation:
              false
          }
        },
        state
      );

    const conversationIntentPacket =
      perceptionReconciliation
        .conversationIntentPacket ||
      perceptionReconciliation
        .unifiedIntentPacket ||
      null;

    const reconciliationReadiness =
      perceptionReconciliation
        .readiness ||
      {};

    const reconciliationAgreement =
      perceptionReconciliation
        .agreement ||
      {};

    const reconciliationGovernance =
      perceptionReconciliation
        .governance ||
      {};

    state = {
      ...state,

      perceptionReconciliation,

      perceptionReconciliationResult:
        perceptionReconciliation,

      conversationIntentPacket,

      unifiedIntentPacket:
        conversationIntentPacket,

      reconciledIntentPacket:
        conversationIntentPacket,

      perceptionReconciliationRan:
        perceptionReconciliation
          .perceptionReconciliationRan ===
        true,

      perceptionReconciliationVersion:
        perceptionReconciliation
          .perceptionReconciliationVersion ||
        null,

      perceptionReconciliationSource:
        perceptionReconciliation
          .perceptionReconciliationSource ||
        "not-loaded",

      perceptionReconciled:
        perceptionReconciliation
          .reconciled === true,

      reconciledSemanticIntent:
        perceptionReconciliation
          .semanticIntent ||
        null,

      reconciledConversationPurpose:
        perceptionReconciliation
          .conversationPurpose ||
        null,

      reconciledSupportingPurposes:
        perceptionReconciliation
          .supportingPurposes ||
        [],

      reconciledSafety:
        perceptionReconciliation
          .safety ||
        null,

      reconciledContinuity:
        perceptionReconciliation
          .continuity ||
        null,

      reconciledAmbiguity:
        perceptionReconciliation
          .ambiguity ||
        null,

      reconciledContext:
        perceptionReconciliation
          .context ||
        null,

      reconciledAgreement:
        reconciliationAgreement,

      reconciledGovernance:
        reconciliationGovernance,

      reconciledResponseRequirements:
        perceptionReconciliation
          .responseRequirements ||
        null,

      reconciliationReadiness,

      reconciliationStatus:
        reconciliationReadiness.status ||
        "not_ready",

      perceptionRoutingHandoffReady:
        reconciliationReadiness
          .readyForRouting === true,

      perceptionPlanningHandoffReady:
        reconciliationReadiness
          .readyForPlanning === true,

      perceptionResponsePreparationReady:
        reconciliationReadiness
          .readyForResponsePreparation ===
        true,

      perceptionClarificationRequired:
        reconciliationReadiness
          .clarificationRequired ===
        true,

      perceptionImmediateSafetyRequired:
        reconciliationReadiness
          .immediateSafetyResponseRequired ===
        true,

      perceptionAgreementConflictPresent:
        reconciliationAgreement
          .conflictPresent === true,

      perceptionUnresolvedConflictPresent:
        reconciliationAgreement
          .unresolvedConflictPresent ===
        true,

      perceptionResponseOrder:
        reconciliationGovernance
          .responseOrder ||
        "normal",

      perceptionReconciliationConfidence:
        perceptionReconciliation
          .confidence ??
        0,

      perceptionReconciliationConfidenceScore:
        perceptionReconciliation
          .confidenceScore ??
        0,

      perceptionReconciliationConfidenceLabel:
        perceptionReconciliation
          .confidenceLabel ||
        "very_low"
    };

    mark("after perceptionReconciliation");
    /* =====================================================
       11. PERCEPTION DIAGNOSTICS
    ===================================================== */

    mark("before perceptionDiagnostics");

    const perceptionDiagnostics =
      this.buildPerceptionDiagnostics(state);

    state = {
      ...state,

      perceptionDiagnostics,

      perceptionHealthy:
        perceptionDiagnostics.healthy,

      perceptionWarnings:
        perceptionDiagnostics.warnings,

      perceptionStageErrors:
        perceptionDiagnostics.errors
    };

    mark("after perceptionDiagnostics");

    /* =====================================================
       12. FINAL PERCEPTION PACKET
    ===================================================== */

    state.perceptionPacket =
      this.buildPerceptionPacket(state);

    state.perceptionPipelineRan = true;
    state.perceptionPipelineSource =
      "ari-perception-pipeline";
    state.perceptionPipelineVersion =
      this.version;

    state.perceptionPipelineComplete =
      perceptionDiagnostics.complete;

    return state;
  },

  /* =====================================================
     CANONICAL LEDGER MERGE
  ===================================================== */

  mergeObservationSources({
    observer = {},
    questionUnderstanding = {},
    lifeSignals = {}
  } = {}) {
    const ledgerEngine =
      window.Ari?.observationLedger ||
      null;

    const sourceGroups = [
      {
        source: "observer_network",
        observations:
          observer.observationLedger ||
          observer.observations ||
          []
      },

      {
        source: "question_understanding",
        observations:
          questionUnderstanding.observations ||
          []
      },

      {
        source: "life_signal_extractor",
        observations:
          lifeSignals.observations ||
          []
      }
    ];

    const merged = [];
    const duplicateKeys = [];

    sourceGroups.forEach(group => {
      const observations = Array.isArray(group.observations)
        ? group.observations
        : [];

      observations.forEach(rawObservation => {
        const observation =
          this.normalizeObservation(
            rawObservation,
            group.source
          );

        const key =
          this.observationKey(observation);

        const existing =
          merged.find(item =>
            this.observationKey(item) === key
          );

        if (existing) {
          duplicateKeys.push(key);

          existing.confidence = Math.max(
            Number(existing.confidence || 0),
            Number(observation.confidence || 0)
          );

          existing.weight = Math.max(
            Number(existing.weight || 0),
            Number(observation.weight || 0)
          );

          existing.evidence =
            this.mergeEvidence(
              existing.evidence,
              observation.evidence
            );

          existing.supportingSources = [
            ...new Set([
              ...(existing.supportingSources || [
                existing.source
              ]),
              observation.source
            ].filter(Boolean))
          ];

          existing.metadata = {
            ...(existing.metadata || {}),
            ...(observation.metadata || {})
          };

          return;
        }

        if (ledgerEngine?.add) {
          const before =
            merged.length;

          ledgerEngine.add(
            merged,
            observation
          );

          if (merged.length === before) {
            return;
          }
        } else {
          merged.push(observation);
        }
      });
    });

    const ranked =
      ledgerEngine?.rank
        ? ledgerEngine.rank(merged)
        : [...merged].sort((a, b) => {
            const scoreDifference =
              this.observationScore(b) -
              this.observationScore(a);

            if (scoreDifference !== 0) {
              return scoreDifference;
            }

            return (
              Number(b.confidence || 0) -
              Number(a.confidence || 0)
            );
          });

    const summary =
      ledgerEngine?.summarize
        ? ledgerEngine.summarize(ranked)
        : this.buildFallbackLedgerSummary(ranked);

    return {
      observations: ranked,
      ranked,
      summary,

      duplicateCount:
        duplicateKeys.length,

      duplicateKeys:
        [...new Set(duplicateKeys)],

      observedTypes:
        [...new Set(
          ranked
            .map(item => item.type)
            .filter(Boolean)
        )],

      observedValues:
        [...new Set(
          ranked
            .map(item =>
              item.value ??
              item.signal
            )
            .filter(value =>
              value !== null &&
              value !== undefined
            )
        )],

      observedCategories:
        [...new Set(
          ranked
            .map(item => item.category)
            .filter(Boolean)
        )],

      observedDomains:
        [...new Set(
          ranked
            .map(item => item.domain)
            .filter(Boolean)
        )],

      sourceCounts:
        ranked.reduce((counts, item) => {
          const sources =
            item.supportingSources?.length
              ? item.supportingSources
              : [item.source || "unknown"];

          sources.forEach(source => {
            counts[source] =
              Number(counts[source] || 0) + 1;
          });

          return counts;
        }, {})
    };
  },

  normalizeObservation(
    observation = {},
    fallbackSource = "unknown"
  ) {
    const value =
      observation.value ??
      observation.signal ??
      observation.name ??
      "unknown";

    const confidence =
      this.normalizeConfidence(
        observation.confidence
      );

    const evidence =
      this.normalizeEvidence(
        observation.evidence
      );

    return {
      ...observation,

      type:
        observation.type ||
        "observation",

      value,
      signal:
        observation.signal ||
        value,

      category:
        observation.category ||
        "observation",

      domain:
        observation.domain ||
        "general",

      subject:
        observation.subject ||
        null,

      target:
        observation.target ||
        null,

      relation:
        observation.relation ||
        null,

      operation:
        observation.operation ||
        null,

      requestedOutput:
        observation.requestedOutput ||
        null,

      confidence,
      evidence,

      evidenceClass:
        observation.evidenceClass ||
        observation.observationType ||
        "direct_text",

      observationType:
        observation.observationType ||
        observation.evidenceClass ||
        "direct_text",

      inferenceLevel:
        observation.inferenceLevel ||
        "observed",

      source:
        observation.source ||
        fallbackSource,

      sourceStage:
        observation.sourceStage ||
        "perception",

      supportingSources:
        observation.supportingSources ||
        [
          observation.source ||
          fallbackSource
        ],

      metadata:
        observation.metadata ||
        {}
    };
  },

  observationKey(observation = {}) {
    return [
      observation.type || "unknown",
      observation.value ??
        observation.signal ??
        "unknown",
      observation.category || "unknown",
      observation.domain || "unknown",
      observation.subject || "",
      observation.target || "",
      observation.operation || "",
      observation.requestedOutput || ""
    ]
      .map(value =>
        String(value)
          .toLowerCase()
          .trim()
      )
      .join("|");
  },

  observationScore(observation = {}) {
    const confidence =
      this.normalizeConfidence(
        observation.confidence
      );

    const weight =
      Number(observation.weight || 0);

    const priority =
      Number(
        observation.metadata?.priority ||
        observation.priority ||
        0
      );

    return Math.round(
      confidence * 100 +
      weight * 0.4 +
      priority * 0.2
    );
  },

  mergeEvidence(first = [], second = []) {
    const combined = [
      ...this.normalizeEvidence(first),
      ...this.normalizeEvidence(second)
    ];

    const seen = new Set();

    return combined.filter(item => {
      const key =
        typeof item === "string"
          ? item
          : JSON.stringify({
              text: item?.text || "",
              sourceField:
                item?.sourceField || "",
              start:
                item?.start ?? null,
              end:
                item?.end ?? null
            });

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  },

  normalizeEvidence(evidence = []) {
    if (
      evidence === null ||
      evidence === undefined
    ) {
      return [];
    }

    if (Array.isArray(evidence)) {
      return evidence
        .flatMap(item =>
          this.normalizeEvidence(item)
        )
        .filter(Boolean);
    }

    if (typeof evidence === "object") {
      return [evidence];
    }

    const text =
      String(evidence).trim();

    return text
      ? [{ text }]
      : [];
  },

  normalizeConfidence(value = 0.5) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return 0.5;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(1, number / 100)
      );
    }

    return Math.max(
      0,
      Math.min(1, number)
    );
  },

  buildFallbackLedgerSummary(observations = []) {
    const directEvidenceCount =
      observations.filter(item =>
        item.inferenceLevel === "observed" ||
        [
          "direct_text",
          "user_confirmed"
        ].includes(item.evidenceClass)
      ).length;

    const inferenceCount =
      observations.filter(item =>
        item.inferenceLevel === "inferred" ||
        String(item.evidenceClass || "")
          .includes("inference")
      ).length;

    return {
      observationLedgerRan: false,
      observationLedgerVersion: null,

      observationCount:
        observations.length,

      activeObservationCount:
        observations.length,

      directEvidenceCount,
      inferenceCount,

      contradictionCount: 0,
      unresolvedCount: 0,

      strongestObservation:
        observations[0]?.value ||
        observations[0]?.signal ||
        null,

      strongestObservationCategory:
        observations[0]?.category ||
        null,

      strongestObservationConfidence:
        observations[0]?.confidence ||
        0,

      rankedObservations:
        observations,

      groupedByType:
        this.groupBy(
          observations,
          "type"
        ),

      groupedByCategory:
        this.groupBy(
          observations,
          "category"
        ),

      groupedByDomain:
        this.groupBy(
          observations,
          "domain"
        )
    };
  },

  groupBy(observations = [], field = "type") {
    return observations.reduce(
      (groups, observation) => {
        const key =
          observation?.[field] ||
          "unknown";

        groups[key] =
          groups[key] ||
          [];

        groups[key].push(
          observation
        );

        return groups;
      },
      {}
    );
  },

  /* =====================================================
     PERCEPTION DIAGNOSTICS
  ===================================================== */

  buildPerceptionDiagnostics(summary = {}) {
    const errors = [];
    const warnings = [];

    const message =
      String(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      ).trim();

    const observations =
      summary.canonicalObservationLedger ||
      summary.observationLedger ||
      summary.observations ||
      [];

    const observerLoaded =
      summary.observerEvidence
        ?.observerEvidenceRan === true;

    const questionUnderstandingLoaded =
      summary.questionUnderstanding
        ?.questionUnderstandingRan === true;

    const lifeSignalsLoaded =
      summary.lifeSignalResult
        ?.lifeSignalExtractorRan === true;

    const conversationFunctionLoaded =
      summary.conversationFunction
        ?.conversationFunctionRan === true;

    const classifierLoaded =
      summary
        .universalConversationClassification
        ?.universalConversationClassifierRan === true;

    const semanticFrameLoaded =
      summary.semanticFrameOutput
        ?.semanticFrameBuilderRan === true;

const reconciliationLoaded =
  summary.perceptionReconciliation
    ?.perceptionReconciliationRan === true;

if (!reconciliationLoaded) {
  warnings.push(
    "perception_reconciliation_not_available"
  );
}

    if (!message) {
      errors.push(
        "missing_user_message"
      );
    }

    if (!observerLoaded) {
      errors.push(
        "observer_network_not_available"
      );
    }

    if (!Array.isArray(observations)) {
      errors.push(
        "canonical_observation_ledger_invalid"
      );
    } else if (
      message &&
      observations.length === 0
    ) {
      warnings.push(
        "no_observations_detected"
      );
    }

    if (!questionUnderstandingLoaded) {
      warnings.push(
        "question_understanding_not_available"
      );
    }

    if (!lifeSignalsLoaded) {
      warnings.push(
        "life_signal_extractor_not_available"
      );
    }

    if (!conversationFunctionLoaded) {
      warnings.push(
        "conversation_function_not_available"
      );
    }

    if (!classifierLoaded) {
      warnings.push(
        "universal_classifier_not_available"
      );
    }

    if (!semanticFrameLoaded) {
      warnings.push(
        "semantic_frame_builder_not_available"
      );
    }

    const operationObservations =
      observations.filter(item =>
        item.operation ||
        item.type === "operation_signal" ||
        item.type === "question_purpose"
      );

    const referenceObservations =
      observations.filter(item =>
        item.type === "reference_signal" ||
        item.type === "missing_anchor_signal" ||
        item.category === "continuity"
      );

    const directEvidence =
      observations.filter(item =>
        item.inferenceLevel === "observed" ||
        item.evidenceClass === "direct_text"
      );

    const inferredEvidence =
      observations.filter(item =>
        item.inferenceLevel === "inferred" ||
        String(item.evidenceClass || "")
          .includes("inference")
      );

    return {
      perceptionDiagnosticsRan: true,
      perceptionDiagnosticsVersion:
        this.version,

      healthy:
        errors.length === 0,

      complete:
  errors.length === 0 &&
  observerLoaded &&
  questionUnderstandingLoaded &&
  lifeSignalsLoaded &&
  classifierLoaded &&
  semanticFrameLoaded &&
  conversationFunctionLoaded &&
  reconciliationLoaded,

      errors,
      warnings,

      stages: {
  safety:
    summary.safetyContextGate
      ?.safetyContextGateRan === true,

  observer:
    observerLoaded,

  questionUnderstanding:
    questionUnderstandingLoaded,

  lifeSignalExtractor:
    lifeSignalsLoaded,

  ledgerMerge:
    summary
      .perceptionObservationMergeRan === true,

  universalClassifier:
    classifierLoaded,

  routingEvidence:
    summary.routingEvidenceRan === true,

  semanticFrame:
    semanticFrameLoaded,

  conversationFunction:
    conversationFunctionLoaded,

  reconciliation:
    reconciliationLoaded
},

      evidence: {
        total:
          observations.length,

        direct:
          directEvidence.length,

        inferred:
          inferredEvidence.length,

        operations:
          operationObservations.length,

        references:
          referenceObservations.length,

        domains:
          summary.observedDomains ||
          [],

        categories:
          summary.observedCategories ||
          [],

        sources:
          summary.perceptionObservationSources ||
          {}
      },

      authority: {
        canReportPerceptionHealth: true,
        canChooseRoute: false,
        canAnswerUser: false,
        role: "perception_quality_assurance_only"
      }
    };
  },

  /* =====================================================
     FINAL PERCEPTION PACKET
  ===================================================== */

  buildPerceptionPacket(summary = {}) {
    const observer =
      summary.observerEvidence ||
      {};

    const questionUnderstanding =
      summary.questionUnderstanding ||
      {};

    const lifeSignals =
      summary.lifeSignalResult ||
      {};

    const conversationFunction =
      summary.conversationFunction ||
      {};

    const classification =
      summary
        .universalConversationClassification ||
      {};

    const routingEvidence =
      summary.routingEvidence ||
      {};

    const semanticFrame =
      summary.semanticFrameOutput ||
      {};

const reconciliation =
  summary.perceptionReconciliation ||
  {};

    const safetyScreen =
      summary.safetyContextGate ||
      null;

    const observations =
      summary.canonicalObservationLedger ||
      summary.observationLedger ||
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
      String(message)
        .toLowerCase()
        .trim();

    return {
      ready:
        Boolean(
          String(message).trim()
        ),

      source:
        "ari-perception-pipeline",

      version:
        this.version,

      message: {
        raw:
          message,

        normalized:
          normalizedMessage,

        length:
          String(message).length,

        wordCount:
          String(normalizedMessage)
            .split(/\s+/)
            .filter(Boolean)
            .length
      },

      safetyScreen: {
        available:
          Boolean(safetyScreen),

        ran:
          safetyScreen
            ?.safetyContextGateRan === true,

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
          safetyScreen
            ?.shouldStopNormalResponse === true,

        requiresClarification:
          safetyScreen
            ?.shouldAskRiskClarification === true ||
          safetyScreen
            ?.followUpNeeded === true,

        evidence:
          safetyScreen?.evidence ||
          [],

        reasons:
          safetyScreen?.reasons ||
          [],

        raw:
          safetyScreen
      },

      observer: {
        available:
          observer
            .observerEvidenceRan === true,

        source:
          observer
            .observerEvidenceSource ||
          observer.source ||
          "unknown",

        observations,

        observationCount:
          observations.length,

        observedTypes:
          summary.observedTypes ||
          [],

        observedValues:
          summary.observedValues ||
          [],

        observedCategories:
          summary.observedCategories ||
          [],

        observedDomains:
          summary.observedDomains ||
          [],

        highestConfidenceObservation:
          observations[0] ||
          null,

        sourceCounts:
          summary
            .perceptionObservationSources ||
          {},

        duplicateObservationCount:
          summary
            .perceptionDuplicateObservationCount ||
          0,

        ledgerSummary:
          summary
            .observationLedgerSummary ||
          null
      },

      questionUnderstanding: {
        available:
          questionUnderstanding
            .questionUnderstandingRan === true,

        primaryPurpose:
          questionUnderstanding
            .primaryPurpose ||
          "understanding",

        primaryPurposeConfidence:
          questionUnderstanding
            .primaryPurposeConfidence ??
          0,

        supportPurposes:
          questionUnderstanding
            .supportPurposes ||
          [],

        candidates:
          questionUnderstanding
            .purposeCandidates ||
          [],

        requestedOperations:
          questionUnderstanding
            .requestedOperations ||
          [],

        requestedOutputs:
          questionUnderstanding
            .requestedOutputs ||
          [],

        responseHints:
          questionUnderstanding
            .responseHints ||
          {},

        multiPurpose:
          questionUnderstanding
            .multiPurpose === true,

        competingPurposes:
          questionUnderstanding
            .competingPurposes ||
          [],

        raw:
          questionUnderstanding
      },

      lifeContext: {
        available:
          lifeSignals
            .lifeSignalExtractorRan === true,

        hasLifeContextSignal:
          lifeSignals
            .hasLifeContextSignal === true,

        hasTransitionEvidence:
          lifeSignals
            .hasTransitionEvidence === true,

        hasMajorLifeSignal:
          lifeSignals
            .hasMajorLifeSignal === true,

        primarySignal:
          lifeSignals
            .primarySignal ||
          null,

        signals:
          lifeSignals
            .signals ||
          [],

        domains:
          lifeSignals
            .domains ||
          [],

        pressures:
          lifeSignals
            .pressures ||
          [],

        transitions:
          lifeSignals
            .transitions ||
          [],

        raw:
          lifeSignals
      },

      conversationFunction: {
        available:
          conversationFunction
            .conversationFunctionRan === true,

        primary:
          conversationFunction
            .primaryFunction ||
          "unknown",

        support:
          conversationFunction
            .supportFunctions ||
          [],

        blocked:
          conversationFunction
            .blockedFunctions ||
          [],

        candidates:
          conversationFunction
            .candidates ||
          [],

        responseBias:
          conversationFunction
            .responseBias ||
          null,

        confidence:
          conversationFunction
            .confidence ??
          null,

        raw:
          conversationFunction
      },

            classification: {
        available:
          classification
            .universalConversationClassifierRan === true,

        type:
          classification.conversationType ||
          "unknown",

        intent:
          classification.conversationIntent ||
          "unknown",

        interactionFamily:
          classification.interactionFamily ||
          "general",

        intentFamily:
          classification.intentFamily ||
          "general_response",

        primaryDomain:
          classification.primaryDomain ||
          "general_understanding",

        domains:
          classification.domains ||
          [],

        contextualSignals:
          classification.contextualSignals ||
          [],

        explicitRequestPresent:
          classification.explicitRequestPresent === true,

        explicitRequestType:
          classification.explicitRequestType ||
          null,

        explicitRequestedOperation:
          classification.explicitRequestedOperation ||
          null,

        explicitRequestedOutput:
          classification.explicitRequestedOutput ||
          null,

        explicitRequestOverridesContext:
          classification.explicitRequestOverridesContext === true,

        responseHint:
          classification.conversationResponseHint ||
          classification.responseHint ||
          null,

        candidates:
          classification.conversationCandidates ||
          classification.candidates ||
          [],

        confidence:
          classification.confidence ??
          null,

        confidenceLabel:
          classification.confidenceLabel ||
          null,

        raw:
          classification
      },

      routingEvidence: {
        available:
          summary
            .routingEvidenceRan === true,

        source:
          summary
            .routingEvidenceSource ||
          routingEvidence.source ||
          "unknown",

        pressures:
          routingEvidence
            .routingPressures ||
          summary.routingPressures ||
          {},

        semanticClues:
          routingEvidence
            .semanticClues ||
          {},

        guards:
          routingEvidence
            .routingGuards ||
          {},

        preservedObservations:
          routingEvidence
            .preservedObserverEvidence ||
          observations,

        preservedObservationCount:
          routingEvidence
            .preservedObservationCount ??
          observations.length,

        raw:
          routingEvidence
      },

      semantic: {
        available:
          semanticFrame
            .semanticFrameBuilderRan === true,

        advisoryOnly:
          semanticFrame
            .advisoryOnly !== false,

        primaryFrame,

        normalizedFrame:
          semanticFrame
            .normalizedFrame ||
          null,

        secondaryFrames:
          semanticFrame
            .secondaryFrames ||
          [],

        allFrames:
          semanticFrame
            .allFrames ||
          [],

        summary:
          semanticFrame
            .semanticSummary ||
          summary.semanticSummary ||
          null,

        continuity:
          semanticFrame
            .continuity ||
          summary
            .semanticContinuity ||
          {},

        responseCharacteristics:
          semanticFrame
            .responseCharacteristics ||
          summary
            .semanticResponseCharacteristics ||
          {},

        emotionalOverlay:
          semanticFrame
            .emotionalOverlay ||
          summary
            .semanticEmotionalOverlay ||
          {},

        ambiguity:
          semanticFrame
            .ambiguity ||
          summary
            .semanticAmbiguity ||
          {},

        raw:
          semanticFrame
      },

            reconciliation: {
        available:
          reconciliation
            .perceptionReconciliationRan ===
          true,

        source:
          reconciliation
            .perceptionReconciliationSource ||
          "unknown",

        version:
          reconciliation
            .perceptionReconciliationVersion ||
          null,

        reconciled:
          reconciliation.reconciled ===
          true,

        semanticIntent:
          reconciliation.semanticIntent ||
          null,

        conversationPurpose:
          reconciliation
            .conversationPurpose ||
          null,

        supportingPurposes:
          reconciliation
            .supportingPurposes ||
          [],

        safety:
          reconciliation.safety ||
          null,

        continuity:
          reconciliation.continuity ||
          null,

        ambiguity:
          reconciliation.ambiguity ||
          null,

        context:
          reconciliation.context ||
          null,

        agreement:
          reconciliation.agreement ||
          null,

        governance:
          reconciliation.governance ||
          null,

        responseRequirements:
          reconciliation
            .responseRequirements ||
          null,

        validation:
          reconciliation.validation ||
          null,

        confidence:
          reconciliation.confidence ??
          0,

        confidenceScore:
          reconciliation.confidenceScore ??
          0,

        confidenceLabel:
          reconciliation.confidenceLabel ||
          "very_low",

        readiness:
          reconciliation.readiness ||
          null,

        packet:
          reconciliation
            .conversationIntentPacket ||
          reconciliation
            .unifiedIntentPacket ||
          null,

        handoff:
          reconciliation.handoff ||
          null,

        packetUsable:
          reconciliation
            .readiness
            ?.packetUsable === true,

        readyForRouting:
          reconciliation
            .readiness
            ?.readyForRouting === true,

        readyForPlanning:
          reconciliation
            .readiness
            ?.readyForPlanning === true,

        readyForResponsePreparation:
          reconciliation
            .readiness
            ?.readyForResponsePreparation ===
          true,

        clarificationRequired:
          reconciliation
            .readiness
            ?.clarificationRequired ===
          true,

        immediateSafetyResponseRequired:
          reconciliation
            .readiness
            ?.immediateSafetyResponseRequired ===
          true,

        responseOrder:
          reconciliation
            .governance
            ?.responseOrder ||
          "normal",

        raw:
          reconciliation
      },

            perceptionSummary: {
        userPrimaryNeed:
          reconciliation
            .conversationPurpose
            ?.name ||
          conversationFunction
            .primaryFunction ||
          classification
            .conversationIntent ||
          "unknown",

        semanticOperation:
          reconciliation
            .semanticIntent
            ?.requestedOperation ||
          primaryFrame?.operation ||
          null,

        requestedOutput:
          reconciliation
            .semanticIntent
            ?.requestedOutput ||
          primaryFrame?.requestedOutput ||
          null,

        userGoal:
          reconciliation
            .semanticIntent
            ?.userGoal ||
          null,

        primaryQuestionPurpose:
          questionUnderstanding
            .primaryPurpose ||
          "understanding",

        primaryLifeSignal:
          lifeSignals.primarySignalName ||
          lifeSignals.primarySignal?.name ||
          lifeSignals.primarySignal ||
          null,

        conversationFunction:
          reconciliation
            .conversationPurpose
            ?.name ||
          conversationFunction
            .primaryFunction ||
          "unknown",

        interactionFamily:
          reconciliation
            .semanticIntent
            ?.interactionFamily ||
          classification
            .interactionFamily ||
          "general",

        intentFamily:
          reconciliation
            .semanticIntent
            ?.intentFamily ||
          classification
            .intentFamily ||
          "general_response",

        primaryDomain:
          reconciliation
            .semanticIntent
            ?.domain ||
          classification
            .primaryDomain ||
          "general_understanding",

        responseOrder:
          reconciliation
            .governance
            ?.responseOrder ||
          "normal",

        confidence:
          reconciliation
            .confidence ??
          classification.confidence ??
          semanticFrame
            .semanticSummary
            ?.confidence ??
          0,

        confidenceLabel:
          reconciliation
            .confidenceLabel ||
          null,

        readinessStatus:
          reconciliation
            .readiness
            ?.status ||
          "not_ready",

        packetUsable:
          reconciliation
            .readiness
            ?.packetUsable === true
      },

            routingHandoff: {
        reconciliationReady:
          reconciliation
            .readiness
            ?.readyForRouting === true,

        packetUsable:
          reconciliation
            .readiness
            ?.packetUsable === true,

        readyForRouting:
          reconciliation
            .readiness
            ?.readyForRouting === true,

        readyForPlanning:
          reconciliation
            .readiness
            ?.readyForPlanning === true,

        readyForResponsePreparation:
          reconciliation
            .readiness
            ?.readyForResponsePreparation ===
          true,

        clarificationRequired:
          reconciliation
            .readiness
            ?.clarificationRequired ===
          true,

        immediateSafetyResponseRequired:
          reconciliation
            .readiness
            ?.immediateSafetyResponseRequired ===
          true,

        conversationIntentPacket:
          reconciliation
            .conversationIntentPacket ||
          reconciliation
            .unifiedIntentPacket ||
          null,

        semanticIntent:
          reconciliation
            .semanticIntent ||
          null,

        conversationPurpose:
          reconciliation
            .conversationPurpose ||
          null,

        supportingPurposes:
          reconciliation
            .supportingPurposes ||
          [],

        governance:
          reconciliation
            .governance ||
          null,

        responseRequirements:
          reconciliation
            .responseRequirements ||
          null,

        safety:
          reconciliation.safety ||
          null,

        continuity:
          reconciliation.continuity ||
          null,

        ambiguity:
          reconciliation.ambiguity ||
          null,

        context:
          reconciliation.context ||
          null,

        agreement:
          reconciliation.agreement ||
          null,

        confidence:
          reconciliation.confidence ??
          0,

        confidenceScore:
          reconciliation
            .confidenceScore ??
          0,

        readiness:
          reconciliation.readiness ||
          null,

        conversationFunction:
          conversationFunction
            .primaryFunction ||
          "unknown",

        classificationType:
          classification
            .conversationType ||
          "unknown",

        classificationIntent:
          classification
            .conversationIntent ||
          "unknown",

        questionPurpose:
          questionUnderstanding
            .primaryPurpose ||
          "understanding",

        requestedOperations:
          questionUnderstanding
            .requestedOperations ||
          [],

        requestedOutputs:
          questionUnderstanding
            .requestedOutputs ||
          [],

        routingPressures:
          routingEvidence
            .routingPressures ||
          {},

        routingGuards:
          routingEvidence
            .routingGuards ||
          {},

        safetyStatus: {
          riskLevel:
            safetyScreen?.riskLevel ||
            "none",

          shouldStopNormalResponse:
            safetyScreen
              ?.shouldStopNormalResponse ===
            true,

          clarificationNeeded:
            safetyScreen
              ?.followUpNeeded === true ||
            safetyScreen
              ?.shouldAskRiskClarification ===
            true
        }
      },

      diagnostics:
        summary.perceptionDiagnostics ||
        null,

      quality: {
        hasMessage:
          Boolean(
            String(message).trim()
          ),

        hasObservations:
          observations.length > 0,

        hasQuestionUnderstanding:
          questionUnderstanding
            .questionUnderstandingRan === true,

        hasLifeSignalAnalysis:
          lifeSignals
            .lifeSignalExtractorRan === true,

        hasConversationFunction:
          Boolean(
            conversationFunction
              .primaryFunction &&
            conversationFunction
              .primaryFunction !== "unknown"
          ),

        hasClassification:
          Boolean(
            classification
              .conversationType &&
            classification
              .conversationType !== "unknown"
          ),

        hasSemanticFrame:
          Boolean(primaryFrame),

        hasSemanticSummary:
          Boolean(
            semanticFrame
              .semanticSummary
          ),

        ambiguityPresent:
          semanticFrame
            .ambiguity
            ?.ambiguous === true ||
          Boolean(
            semanticFrame
              .ambiguity
              ?.unresolvedReferences
              ?.length
          ),

        missingInputs: [
          !String(message).trim()
            ? "message"
            : null,

          !observations.length
            ? "observations"
            : null,

          questionUnderstanding
            .questionUnderstandingRan !== true
            ? "question_understanding"
            : null,

          lifeSignals
            .lifeSignalExtractorRan !== true
            ? "life_signal_analysis"
            : null,

          !conversationFunction
            .primaryFunction ||
          conversationFunction
            .primaryFunction === "unknown"
            ? "conversation_function"
            : null,

          !classification
            .conversationType ||
          classification
            .conversationType === "unknown"
            ? "classification"
            : null,

          !primaryFrame
            ? "semantic_frame"
            : null
        ].filter(Boolean)
      },

      authority: {
        canObserveEvidence: true,
        canMergeSpecialistEvidence: true,
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
          "canonical_perception_evidence_and_structured_meaning_handoff"
      }
    };
  }
};

console.log(
  "ARI PERCEPTION PIPELINE LOADED:",
  window.AriPerceptionPipeline?.version
);