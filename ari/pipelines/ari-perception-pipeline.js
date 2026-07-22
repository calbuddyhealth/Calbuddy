// ari/pipelines/ari-perception-pipeline.js
// Ari Perception Pipeline
//
// Purpose:
// Collect and preserve deterministic evidence about the current turn, then
// produce one canonical Evidence Packet for downstream OpenAI cognition.
//
// V2.1.0 — Evidence Perception with Canonical Reference Handoff
//
// Responsibilities:
// - Preserve the original current-turn text.
// - Preserve a deterministically resolved effective turn when continuity can
//   resolve an explicit prior-turn reference.
// - Run the early safety context screen as evidence only.
// - Run the observer network.
// - Merge and normalize observations.
// - Invoke AriEvidenceBuilder exactly once.
// - Produce one evidence-centered Perception Packet.
// - Run canonical entity and reference resolution.
// - Preserve one canonical Reference Packet for downstream routing.
//
// Non-responsibilities:
// - Does not classify conversation meaning.
// - Does not select intent, operation, requested output, or user goal.
// - Does not construct a semantic frame.
// - Does not choose Conversation Function.
// - Does not reconcile a Conversation Intent Packet.
// - Does not choose routing, planning, response strategy, or final language.
// - Does not answer the user.

window.Ari = window.Ari || {};

window.AriPerceptionPipeline = {
  version: "2.1.0",
  schemaVersion: "2.1.0",
  source: "ari-perception-pipeline",
  authorityLevel: "deterministic_evidence_orchestration",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback
    } = runtime;

    const originalText =
      this.extractMessageText(summary);

    let state = {
      ...summary,

      activePipelineLayer:
        "perception",

      perceptionStageErrors:
        [],

      perceptionWarnings:
        [],

      originalUserMessage:
        originalText
    };

    /* =====================================================
       1. EARLY SAFETY CONTEXT EVIDENCE
    ===================================================== */

    mark("before safetyContextGate");

    const safetyContextGate =
      await runEngine(
        window.AriSafetyContextGate ||
        window.Ari?.safetyContextGate,
        ["evaluate"],
        {
          safetyContextGateRan:
            false,

          source:
            "not-loaded",

          override:
            null,

          riskLevel:
            "none",

          riskType:
            "none",

          primaryRisk:
            null,

          risks:
            [],

          evidence:
            [],

          reasons:
            [],

          followUpNeeded:
            false,

          followUpQuestion:
            null,

          shouldAskRiskClarification:
            false,

          shouldStopNormalResponse:
            false
        },
        state
      );

    state = {
      ...state,

      safetyContextGate,

      safetyContextEvidence:
        safetyContextGate
    };

    mark("after safetyContextGate");

    /* =====================================================
       2. GOVERNED CONTINUITY RESOLUTION
    ===================================================== */

    mark("before continuityResolution");

    const continuityInput = {
      ...state,

      runtime,

      originalUserMessage:
        originalText,

      userMessage:
        originalText,

      message:
        originalText,

      input:
        originalText,

      currentTurn: {
        originalText,

        effectiveText:
          originalText,

        normalizedText:
          this.normalizeMessageText(
            originalText
          ),

        wasResolved:
          false,

        resolutionSource:
          null
      }
    };

    const continuityFallback = {
      continuityResolverRan:
        false,

      continuityResolverVersion:
        null,

      continuityResolverSource:
        "not-loaded",

      status:
        "not_evaluated",

      isContinuation:
        null,

      requiresPriorContext:
        null,

      priorContextAvailable:
        null,

      referencesPriorContext:
        null,

      referenceSurface:
        null,

      referenceResolved:
        null,

      resolvedReferenceValue:
        null,

      resolvedReferenceSourceTurnId:
        null,

      originalText,

      resolvedText:
        null,

      currentTurnWasResolved:
        false,

      requiresClarification:
        false,

      confidence:
        0,

      confidenceLabel:
        "very_low",

      evidence:
        [],

      reasons:
        []
    };

    const continuityResult =
      await runEngine(
        window.AriEllipticalFollowUpResolver ||
        window.Ari?.ellipticalFollowUpResolver,
        ["resolve", "analyze"],
        continuityFallback,
        continuityInput
      );

    const continuityResolution =
      continuityResult &&
      typeof continuityResult ===
        "object" &&
      !Array.isArray(
        continuityResult
      )
        ? {
            ...continuityFallback,
            ...continuityResult
          }
        : continuityFallback;

    const resolvedText =
      this.extractResolvedText(
        continuityResolution
      );

    const effectiveText =
      resolvedText ||
      originalText;

    const currentTurnWasResolved =
      Boolean(
        resolvedText &&
        this.normalizeMessageText(
          resolvedText
        ) !==
          this.normalizeMessageText(
            originalText
          )
      );

    const unresolvedContextDependentTurn =
      continuityResolution
        .isContinuation === true &&
      continuityResolution
        .requiresPriorContext === true &&
      currentTurnWasResolved !== true;

    const rawAnchor =
      continuityResolution.anchor;

    const normalizedAnchor =
      rawAnchor &&
      typeof rawAnchor ===
        "object" &&
      !Array.isArray(rawAnchor)
        ? rawAnchor
        : {
            value:
              typeof rawAnchor ===
                "string"
                ? rawAnchor
                : null
          };

    const governedContinuityResolution = {
      ...continuityResolution,

      requiresClarification:
        continuityResolution
          .requiresClarification === true ||
        unresolvedContextDependentTurn,

      unresolvedContextDependentTurn,

      status:
        currentTurnWasResolved
          ? "resolved"
          : unresolvedContextDependentTurn
            ? "clarification_required"
            : continuityResolution.status,

      anchor: {
        ...normalizedAnchor,

        status:
          currentTurnWasResolved
            ? "resolved"
            : unresolvedContextDependentTurn
              ? "unresolved"
              : (
                  normalizedAnchor.status ||
                  "not_required"
                ),

        resolved:
          currentTurnWasResolved,

        referenceResolved:
          continuityResolution
            .referenceResolved === true,

        missing:
          unresolvedContextDependentTurn
      },

      authority: {
        canResolveExplicitReference:
          true,

        canPreservePriorTurnAnchor:
          true,

        canInterpretCurrentTurnMeaning:
          false,

        canSelectIntent:
          false,

        canConstructSemanticFrame:
          false
      }
    };

    const currentTurn = {
      originalText,

      effectiveText,

      normalizedText:
        this.normalizeMessageText(
          effectiveText
        ),

      wasResolved:
        currentTurnWasResolved,

      resolutionSource:
        currentTurnWasResolved
          ? (
              continuityResolution
                .continuityResolverSource ||
              continuityResolution.source ||
              "elliptical_follow_up_resolver"
            )
          : null,

      continuity:
        governedContinuityResolution
    };

    state = {
      ...state,

      continuityResolution:
        governedContinuityResolution,

      authoritativeContinuity:
        governedContinuityResolution,

      continuity:
        governedContinuityResolution,

      rawContinuityResolution:
        continuityResolution,

      currentTurn,

      originalUserMessage:
        originalText,

      effectiveUserMessage:
        effectiveText,

      resolvedUserQuestion:
        currentTurnWasResolved
          ? effectiveText
          : null,

      currentTurnWasResolved,

      unresolvedContextDependentTurn,

      continuityStatus:
        governedContinuityResolution
          .status ||
        "not_evaluated",

      continuityRequiresClarification:
        governedContinuityResolution
          .requiresClarification === true
    };

    mark("after continuityResolution");

    /* =====================================================
       2.5. CANONICAL REFERENCE RESOLUTION
    ===================================================== */

    mark("before referenceResolution");

    const referenceResolver =
      window.AriEntityReferenceResolver ||
      window.Ari
        ?.entityReferenceResolver ||
      null;

    const referenceResolutionFallback = {
      referenceResolverRan:
        false,

      referenceResolverReady:
        false,

      referenceResolverSource:
        "not-loaded",

      referenceResolverVersion:
        null,

      referencePacket:
        null,

      resolvedSemanticStructure:
        null,

      referenceDecisions:
        [],

      referencesDetected:
        false,

      referenceCount:
        0,

      resolvedReferenceCount:
        0,

      unresolvedReferenceCount:
        0,

      errors: [
        "reference_resolver_not_loaded"
      ],

      warnings: []
    };

    const referenceResolutionResult =
      await runEngine(
        referenceResolver,
        ["resolve"],
        referenceResolutionFallback,
        this.buildEffectiveTurnState(
          state
        )
      );

    const normalizedReferenceResolution =
      referenceResolutionResult &&
      typeof referenceResolutionResult ===
        "object" &&
      !Array.isArray(
        referenceResolutionResult
      )
        ? {
            ...referenceResolutionFallback,
            ...referenceResolutionResult
          }
        : referenceResolutionFallback;

    const referencePacket =
      normalizedReferenceResolution
        .referencePacket ||
      normalizedReferenceResolution
        .packet ||
      null;

    state = {
      ...state,

      referenceResolution:
        normalizedReferenceResolution,

      referenceResolverResult:
        normalizedReferenceResolution,

      referencePacket,

      resolvedSemanticStructure:
        normalizedReferenceResolution
          .resolvedSemanticStructure ||
        state.resolvedSemanticStructure ||
        null,

      referenceDecisions:
        normalizedReferenceResolution
          .referenceDecisions ||
        normalizedReferenceResolution
          .resolutions ||
        [],

            referenceResolverRan:
        normalizedReferenceResolution
          .referenceResolverRan ===
          true ||
        normalizedReferenceResolution
          .resolverRan ===
          true ||
        normalizedReferenceResolution
          .source ===
          "ari-entity-reference-resolver" ||
        normalizedReferenceResolution
          .referenceResolverSource ===
          "ari-entity-reference-resolver",

      referenceResolverReady:
        normalizedReferenceResolution
          .referenceResolverReady ===
          true ||
        Boolean(
          referencePacket
        )
    };

    mark("after referenceResolution");

    /* =====================================================
       3. GENERAL OBSERVER NETWORK
    ===================================================== */

    mark("before observerEvidence");

    const observerResult =
      await runEngine(
        window.Ari?.observerNetwork ||
        window.AriObserverNetwork,
        ["observe"],
        {
          observerEvidenceRan:
            false,

          observerEvidenceSource:
            "not-loaded",

          observations:
            [],

          observationLedger:
            [],

          canonicalObservationLedger:
            [],

          observedTypes:
            [],

          observedValues:
            [],

          observedCategories:
            [],

          observedDomains:
            [],

          observationCount:
            0
        },
        this.buildEffectiveTurnState(
          state
        )
      );

    state = {
      ...state,

      observerEvidence:
        observerResult,

      observer:
        observerResult,

      observations:
        observerResult.observations ||
        [],

      observationLedger:
        observerResult
          .observationLedger ||
        observerResult.observations ||
        [],

      canonicalObservationLedger:
        observerResult
          .canonicalObservationLedger ||
        observerResult
          .observationLedger ||
        observerResult.observations ||
        []
    };

    mark("after observerEvidence");

    /* =====================================================
       4. CANONICAL OBSERVATION LEDGER
    ===================================================== */

    mark("before perceptionLedgerMerge");

    const ledgerMerge =
      this.mergeObservationSources({
        observer:
          observerResult,

        safety:
          safetyContextGate,

        continuity:
          governedContinuityResolution
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

      perceptionObservationMergeRan:
        true
    };

    state.observerEvidence = {
      ...state.observerEvidence,

      observations:
        ledgerMerge.observations,

      observationLedger:
        ledgerMerge.observations,

      canonicalObservationLedger:
        ledgerMerge.observations,

      observationCount:
        ledgerMerge.observations.length,

      observedTypes:
        ledgerMerge.observedTypes,

      observedValues:
        ledgerMerge.observedValues,

      observedCategories:
        ledgerMerge.observedCategories,

      observedDomains:
        ledgerMerge.observedDomains
    };

    state.observer =
      state.observerEvidence;

    mark("after perceptionLedgerMerge");

    /* =====================================================
       5. CANONICAL EVIDENCE BUILDER
    ===================================================== */

    mark("before evidenceBuilder");

    const evidenceBuilder =
      window.AriEvidenceBuilder ||
      window.Ari?.evidenceBuilder ||
      null;

    const evidenceBuilderFallback = {
      evidenceBuilderRan:
        false,

      evidenceBuilderReady:
        false,

      evidenceBuilderSource:
        "not-loaded",

      evidenceBuilderVersion:
        null,

      evidencePacket:
        null,

      evidenceBuilderValidation: {
        valid:
          false,

        errors: [
          "evidence_builder_not_loaded"
        ],

        warnings:
          []
      }
    };

    const evidenceBuilderResult =
      await runEngine(
        evidenceBuilder,
        ["build", "create"],
        evidenceBuilderFallback,
        this.buildEffectiveTurnState(
          state
        )
      );

    const evidencePacket =
      evidenceBuilderResult
        ?.evidencePacket ||
      null;

    state = {
      ...state,

      evidenceBuilderResult,

      ...evidenceBuilderResult,

      evidencePacket,

      extractedFacts:
        evidencePacket
          ?.extractedFacts ||
        null,

      explicitSignals:
        evidencePacket
          ?.explicitSignals ||
        null,

      continuityEvidence:
        evidencePacket
          ?.continuityEvidence ||
        null,

      contextEvidence:
        evidencePacket
          ?.contextEvidence ||
        null,

      artifactEvidence:
        evidencePacket
          ?.artifactEvidence ||
        null,

      evidenceSourceIndex:
        evidencePacket
          ?.sourceIndex ||
        null,

      evidenceQuality:
        evidencePacket
          ?.quality ||
        null
    };

    mark("after evidenceBuilder");

    /* =====================================================
       6. PERCEPTION DIAGNOSTICS
    ===================================================== */

    mark("before perceptionDiagnostics");

    const perceptionDiagnostics =
      this.buildPerceptionDiagnostics(
        state
      );

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
       7. FINAL PERCEPTION PACKET
    ===================================================== */

    state.perceptionPacket =
      this.buildPerceptionPacket(
        state
      );

    state.perceptionPipelineRan =
      true;

    state.perceptionPipelineReady =
      state.perceptionPacket
        ?.ready === true;

    state.perceptionPipelineSource =
      this.source;

    state.perceptionPipelineVersion =
      this.version;

    state.perceptionPipelineComplete =
      perceptionDiagnostics.complete;

    return state;
  },

  /* =====================================================
     CURRENT TURN HELPERS
  ===================================================== */

  extractMessageText(
    summary = {}
  ) {
    const candidates = [
      summary.turn
        ?.originalText,

      summary.currentTurn
        ?.originalText,

      summary.originalUserMessage,

      summary.userMessage,

      summary.message,

      summary.input
    ];

    const selected =
      candidates.find(
        value =>
          typeof value ===
            "string" &&
          value.trim()
      );

    return selected
      ? selected.trim()
      : "";
  },

  extractResolvedText(
    continuityResolution = {}
  ) {
    const resolutionConfirmed =
      continuityResolution
        .currentTurnWasResolved === true ||
      continuityResolution
        .resolvedCurrentTurn
        ?.currentTurnWasResolved === true ||
      continuityResolution
        .resolvedCurrentTurn
        ?.resolved === true;

    if (!resolutionConfirmed) {
      return null;
    }

    const candidates = [
      continuityResolution
        .resolvedUserQuestion,

      continuityResolution
        .resolvedCurrentTurnText,

      continuityResolution
        .resolvedText,

      continuityResolution
        .resolvedCurrentTurn
        ?.resolvedText,

      continuityResolution
        .resolvedCurrentTurn
        ?.text,

      continuityResolution
        .effectiveText,

      continuityResolution
        .currentTurn
        ?.effectiveText
    ];

    const selected =
      candidates.find(
        value =>
          typeof value ===
            "string" &&
          value.trim()
      );

    return selected
      ? selected.trim()
      : null;
  },

  normalizeMessageText(
    message = ""
  ) {
    return String(
      message ||
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .toLowerCase();
  },

  buildEffectiveTurnState(
    state = {}
  ) {
    const originalText =
      state.currentTurn
        ?.originalText ||
      state.turn
        ?.originalText ||
      state.originalUserMessage ||
      this.extractMessageText(
        state
      );

    const effectiveText =
      state.currentTurn
        ?.effectiveText ||
      state.effectiveUserMessage ||
      originalText;

    const normalizedText =
      state.currentTurn
        ?.normalizedText ||
      this.normalizeMessageText(
        effectiveText
      );

    return {
      ...state,

      userMessage:
        effectiveText,

      message:
        effectiveText,

      input:
        effectiveText,

      normalizedMessage:
        normalizedText,

      originalUserMessage:
        originalText,

      effectiveUserMessage:
        effectiveText,

      resolvedUserQuestion:
        state.currentTurn
          ?.wasResolved === true
          ? effectiveText
          : null,

      currentTurnWasResolved:
        state.currentTurn
          ?.wasResolved === true,

      currentTurn: {
        ...(state.currentTurn || {}),

        originalText,

        effectiveText,

        normalizedText
      },

      turn: {
        ...(state.turn || {}),

        originalText:
          state.turn
            ?.originalText ||
          originalText,

        currentText:
          effectiveText,

        effectiveText,

        semanticInputText:
          effectiveText,

        normalizedText
      },

      authoritativeContinuity:
        state.continuityResolution ||
        state.authoritativeContinuity ||
        null
    };
  },

  /* =====================================================
     OBSERVATION LEDGER
  ===================================================== */

  mergeObservationSources({
    observer = {},
    safety = {},
    continuity = {}
  } = {}) {
    const sourceGroups = [
      {
        source:
          "observer_network",

        observations:
          observer
            .observationLedger ||
          observer.observations ||
          []
      },

      {
        source:
          "safety_context_gate",

        observations:
          this.buildSafetyObservations(
            safety
          )
      },

      {
        source:
          "continuity_resolver",

        observations:
          this.buildContinuityObservations(
            continuity
          )
      }
    ];

    const merged = [];
    const duplicateKeys = [];

    sourceGroups.forEach(
      group => {
        this.toArray(
          group.observations
        )
          .forEach(
            rawObservation => {
              const observation =
                this.normalizeObservation(
                  rawObservation,
                  group.source
                );

              const key =
                this.observationKey(
                  observation
                );

              const existing =
                merged.find(
                  item =>
                    this.observationKey(
                      item
                    ) ===
                    key
                );

              if (existing) {
                duplicateKeys.push(
                  key
                );

                existing.confidence =
                  Math.max(
                    Number(
                      existing
                        .confidence ||
                      0
                    ),

                    Number(
                      observation
                        .confidence ||
                      0
                    )
                  );

                existing.evidence =
                  this.mergeEvidence(
                    existing.evidence,
                    observation.evidence
                  );

                existing.supportingSources = [
                  ...new Set([
                    ...this.toArray(
                      existing
                        .supportingSources
                    ),

                    ...this.toArray(
                      observation
                        .supportingSources
                    )
                  ])
                ];

                return;
              }

              merged.push(
                observation
              );
            }
          );
      }
    );

    const ranked =
      [...merged]
        .sort(
          (a, b) =>
            this.observationScore(
              b
            ) -
            this.observationScore(
              a
            )
        );

    return {
      observations:
        ranked,

      ranked,

      summary:
        this.buildLedgerSummary(
          ranked
        ),

      duplicateCount:
        duplicateKeys.length,

      duplicateKeys:
        [...new Set(
          duplicateKeys
        )],

      observedTypes:
        this.unique(
          ranked.map(
            item =>
              item.type
          )
        ),

      observedValues:
        this.unique(
          ranked.map(
            item =>
              item.value ??
              item.signal
          )
        ),

      observedCategories:
        this.unique(
          ranked.map(
            item =>
              item.category
          )
        ),

      observedDomains:
        this.unique(
          ranked.map(
            item =>
              item.domain
          )
        ),

      sourceCounts:
        ranked.reduce(
          (
            counts,
            item
          ) => {
            this.toArray(
              item.supportingSources
                ?.length
                ? item
                    .supportingSources
                : item.source
            )
              .forEach(
                source => {
                  counts[source] =
                    Number(
                      counts[source] ||
                      0
                    ) +
                    1;
                }
              );

            return counts;
          },
          {}
        )
    };
  },

  buildSafetyObservations(
    safety = {}
  ) {
    const output = [];

    this.toArray(
      safety.evidence
    )
      .forEach(
        item => {
          output.push({
            type:
              "safety_evidence",

            value:
              typeof item ===
                "string"
                ? item
                : (
                    item?.value ||
                    item?.text ||
                    item?.type ||
                    "safety_evidence"
                  ),

            category:
              "safety",

            domain:
              safety.riskType ||
              "general",

            evidence:
              item,

            confidence:
              item?.confidence ??
              safety.confidence ??
              0.5,

            inferenceLevel:
              "observed"
          });
        }
      );

    return output;
  },

  buildContinuityObservations(
    continuity = {}
  ) {
    const output = [];

    if (
      continuity.referencesPriorContext ===
      true
    ) {
      output.push({
        type:
          "reference_signal",

        value:
          continuity.referenceSurface ||
          continuity.resolvedReferenceValue ||
          "prior_context_reference",

        category:
          "continuity",

        domain:
          "conversation",

        evidence:
          continuity.evidence ||
          [],

        confidence:
          continuity.confidence ??
          0.5,

        inferenceLevel:
          "observed",

        metadata: {
          referenceResolved:
            continuity
              .referenceResolved ===
            true,

          sourceTurnId:
            continuity
              .resolvedReferenceSourceTurnId ||
            null
        }
      });
    }

    if (
      continuity
        .unresolvedContextDependentTurn ===
      true
    ) {
      output.push({
        type:
          "missing_anchor_signal",

        value:
          continuity.referenceSurface ||
          "unresolved_prior_context",

        category:
          "continuity",

        domain:
          "conversation",

        evidence:
          continuity.evidence ||
          [],

        confidence:
          continuity.confidence ??
          0.5,

        inferenceLevel:
          "observed"
      });
    }

    return output;
  },

  normalizeObservation(
    observation = {},
    fallbackSource = "unknown"
  ) {
    const source =
      observation &&
      typeof observation ===
        "object"
        ? observation
        : {
            value:
              observation
          };

    const value =
      source.value ??
      source.signal ??
      source.name ??
      "unknown";

    return {
      ...source,

      type:
        source.type ||
        "observation",

      value,

      signal:
        source.signal ||
        value,

      category:
        source.category ||
        "observation",

      domain:
        source.domain ||
        "general",

      confidence:
        this.normalizeConfidence(
          source.confidence
        ),

      evidence:
        this.normalizeEvidence(
          source.evidence
        ),

      evidenceClass:
        source.evidenceClass ||
        source.observationType ||
        "direct_text",

      observationType:
        source.observationType ||
        source.evidenceClass ||
        "direct_text",

      inferenceLevel:
        source.inferenceLevel ||
        "observed",

      source:
        source.source ||
        fallbackSource,

      sourceStage:
        "perception",

      supportingSources:
        this.unique([
          ...this.toArray(
            source.supportingSources
          ),

          source.source ||
          fallbackSource
        ]),

      metadata:
        source.metadata ||
        {}
    };
  },

  observationKey(
    observation = {}
  ) {
    return [
      observation.type ||
        "unknown",

      observation.value ??
        observation.signal ??
        "unknown",

      observation.category ||
        "unknown",

      observation.domain ||
        "unknown",

      observation.subject ||
        "",

      observation.target ||
        ""
    ]
      .map(
        value =>
          String(value)
            .toLowerCase()
            .trim()
      )
      .join("|");
  },

  observationScore(
    observation = {}
  ) {
    return (
      this.normalizeConfidence(
        observation.confidence
      ) *
        100 +
      Number(
        observation.weight ||
        0
      ) *
        0.4 +
      Number(
        observation.metadata
          ?.priority ||
        observation.priority ||
        0
      ) *
        0.2
    );
  },

  buildLedgerSummary(
    observations = []
  ) {
    return {
      observationCount:
        observations.length,

      directEvidenceCount:
        observations.filter(
          item =>
            item.inferenceLevel ===
              "observed" ||
            item.evidenceClass ===
              "direct_text"
        ).length,

      inferenceCount:
        observations.filter(
          item =>
            item.inferenceLevel ===
              "inferred" ||
            String(
              item.evidenceClass ||
              ""
            ).includes(
              "inference"
            )
        ).length,

      strongestObservation:
        observations[0] ||
        null
    };
  },

  mergeEvidence(
    first = [],
    second = []
  ) {
    const output = [];
    const seen = new Set();

    [
      ...this.normalizeEvidence(
        first
      ),

      ...this.normalizeEvidence(
        second
      )
    ]
      .forEach(
        item => {
          const key =
            typeof item ===
              "string"
              ? item
              : this.safeJSONStringify(
                  item
                );

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          output.push(item);
        }
      );

    return output;
  },

  normalizeEvidence(
    evidence = []
  ) {
    if (
      evidence === null ||
      evidence === undefined
    ) {
      return [];
    }

    if (
      Array.isArray(evidence)
    ) {
      return evidence
        .flatMap(
          item =>
            this.normalizeEvidence(
              item
            )
        )
        .filter(Boolean);
    }

    if (
      typeof evidence ===
        "object"
    ) {
      return [evidence];
    }

    const text =
      String(evidence)
        .trim();

    return text
      ? [{ text }]
      : [];
  },

  normalizeConfidence(
    value = 0.5
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0.5;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(
          1,
          number / 100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

  /* =====================================================
     DIAGNOSTICS
  ===================================================== */

  buildPerceptionDiagnostics(
    summary = {}
  ) {
   
        const referenceResolverRan =
      summary.referenceResolverRan ===
        true ||
      summary.referenceResolution
        ?.referenceResolverRan ===
        true;

    const referencePacketAvailable =
      Boolean(
        summary.referencePacket
      );
      
      
     const errors = [];
    const warnings = [];

    const message =
      String(
        summary.currentTurn
          ?.effectiveText ||
        summary.effectiveUserMessage ||
        summary.originalUserMessage ||
        ""
      )
        .trim();

    const observations =
      this.toArray(
        summary
          .canonicalObservationLedger ||
        summary.observationLedger ||
        summary.observations
      );

    const observerLoaded =
      summary.observerEvidence
        ?.observerEvidenceRan ===
      true;

    const continuityLoaded =
      summary.continuityResolution
        ?.continuityResolverRan ===
      true;

    const evidenceBuilderRan =
      summary.evidenceBuilderRan ===
      true;

    const evidenceBuilderReady =
      summary.evidenceBuilderReady ===
      true;

    const evidencePacketAvailable =
      Boolean(
        summary.evidencePacket
      );

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

    if (!evidenceBuilderRan) {
      errors.push(
        "evidence_builder_did_not_run"
      );
    }

    if (!evidenceBuilderReady) {
      errors.push(
        "evidence_builder_not_ready"
      );
    }

    if (!evidencePacketAvailable) {
      errors.push(
        "evidence_packet_missing"
      );
    }

    if (
      observations.length ===
      0
    ) {
      warnings.push(
        "no_observations_detected"
      );
    }

    if (!continuityLoaded) {
      warnings.push(
        "continuity_resolver_not_available"
      );
    }

    if (
      summary
        .unresolvedContextDependentTurn ===
      true
    ) {
      warnings.push(
        "context_dependent_turn_unresolved"
      );
    }

    if (!referenceResolverRan) {
      errors.push(
        "reference_resolver_did_not_run"
      );
    }

    if (!referencePacketAvailable) {
      errors.push(
        "reference_packet_missing"
      );
    }

    return {
      perceptionDiagnosticsRan:
        true,

      perceptionDiagnosticsVersion:
        this.version,

      healthy:
        errors.length ===
        0,

      complete:
        errors.length ===
        0,

      errors,
      warnings,

      stages: {
        safety:
          summary.safetyContextGate
            ?.safetyContextGateRan ===
          true,

        continuity:
          continuityLoaded,

        referenceResolution:
          referenceResolverRan,

        referencePacket:
          referencePacketAvailable,

        observer:
          observerLoaded,

        ledgerMerge:
          summary
            .perceptionObservationMergeRan ===
          true,

        evidenceBuilder:
          evidenceBuilderRan,

        evidencePacket:
          evidencePacketAvailable
      },

      evidence: {
        totalObservations:
          observations.length,

        packetId:
          summary.evidencePacket
            ?.packetId ||
          null,

        quality:
          summary.evidencePacket
            ?.quality ||
          null
      },

        
      removedCognitiveStages: {
        questionUnderstanding:
          true,

        lifeSignalInterpretation:
          true,

        universalConversationClassification:
          true,

        observerRoutingInterpretation:
          true,

        semanticFrameBuilder:
          true,

        conversationFunction:
          true,

        perceptionReconciliation:
          true
      },

      authority: {
        canReportPerceptionHealth:
          true,

        canInterpretMeaning:
          false,

        canChooseIntent:
          false,

        canChooseOperation:
          false,

        canConstructSemanticFrame:
          false,

        canChooseRoute:
          false,

        canPlanResponse:
          false,

        canAnswerUser:
          false,

        role:
          "deterministic_perception_quality_assurance"
      }
    };
  },

  /* =====================================================
     FINAL PERCEPTION PACKET
  ===================================================== */

  buildPerceptionPacket(
    summary = {}
  ) {
    const originalMessage =
      summary.currentTurn
        ?.originalText ||
      summary.turn
        ?.originalText ||
      summary.originalUserMessage ||
      "";

    const effectiveMessage =
      summary.currentTurn
        ?.effectiveText ||
      summary.effectiveUserMessage ||
      originalMessage;

    const normalizedMessage =
      summary.currentTurn
        ?.normalizedText ||
      this.normalizeMessageText(
        effectiveMessage
      );

    const evidencePacket =
      summary.evidencePacket ||
      null;

    const referencePacket =
      summary.referencePacket ||
      summary.referenceResolution
        ?.referencePacket ||
      null;

    const observations =
      this.toArray(
        summary
          .canonicalObservationLedger ||
        summary.observationLedger ||
        summary.observations
      );

    const diagnostics =
      summary.perceptionDiagnostics ||
      null;

    return {
      schema:
        "ari_perception_packet",

      schemaVersion:
        this.schemaVersion,

            ready:
        diagnostics
          ?.complete === true &&
        summary.evidenceBuilderReady ===
          true &&
        Boolean(
          evidencePacket
        ) &&
        Boolean(
          referencePacket
        ),

      source:
        this.source,

      version:
        this.version,

      message: {
        original:
          originalMessage,

        effective:
          effectiveMessage,

        normalized:
          normalizedMessage,

        wasResolved:
          summary.currentTurn
            ?.wasResolved ===
          true,

        resolutionSource:
          summary.currentTurn
            ?.resolutionSource ||
          null,

        originalLength:
          String(
            originalMessage
          ).length,

        effectiveLength:
          String(
            effectiveMessage
          ).length,

        wordCount:
          normalizedMessage
            .split(/\s+/)
            .filter(Boolean)
            .length
      },

      continuity: {
        available:
          summary
            .continuityResolution
            ?.continuityResolverRan ===
          true,

        status:
          summary
            .continuityResolution
            ?.status ||
          "not_evaluated",

        currentTurnWasResolved:
          summary
            .currentTurnWasResolved ===
          true,

        unresolvedContextDependentTurn:
          summary
            .unresolvedContextDependentTurn ===
          true,

        requiresClarification:
          summary
            .continuityRequiresClarification ===
          true,

        raw:
          summary
            .continuityResolution ||
          null
      },

      referencePacket,

      referenceResolution: {
        available:
          Boolean(
            referencePacket
          ),

        ran:
          summary.referenceResolverRan ===
            true ||
          summary.referenceResolution
            ?.referenceResolverRan ===
            true,

        ready:
          summary.referenceResolverReady ===
            true ||
          summary.referenceResolution
            ?.referenceResolverReady ===
            true ||
          Boolean(
            referencePacket
          ),

        referenceCount:
          referencePacket
            ?.referenceCount ??
          summary.referenceResolution
            ?.referenceCount ??
          0,

        resolvedCount:
          referencePacket
            ?.resolvedCount ??
          summary.referenceResolution
            ?.resolvedReferenceCount ??
          0,

        unresolvedCount:
          referencePacket
            ?.unresolvedCount ??
          summary.referenceResolution
            ?.unresolvedReferenceCount ??
          0,

        raw:
          summary.referenceResolution ||
          null
      },

      safetyEvidence: {
        available:
          Boolean(
            summary
              .safetyContextGate
          ),

        ran:
          summary
            .safetyContextGate
            ?.safetyContextGateRan ===
          true,

        evidence:
          summary
            .safetyContextGate
            ?.evidence ||
          [],

        reasons:
          summary
            .safetyContextGate
            ?.reasons ||
          [],

        raw:
          summary
            .safetyContextGate ||
          null,

        authority:
          "early_safety_evidence_only"
      },

      observer: {
        available:
          summary
            .observerEvidence
            ?.observerEvidenceRan ===
          true,

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

      evidencePacket,

      evidence: {
        builderRan:
          summary.evidenceBuilderRan ===
          true,

        builderReady:
          summary.evidenceBuilderReady ===
          true,

        builderSource:
          summary.evidenceBuilderSource ||
          null,

        builderVersion:
          summary.evidenceBuilderVersion ||
          null,

        validation:
          summary
            .evidenceBuilderValidation ||
          null,

        extractedFacts:
          evidencePacket
            ?.extractedFacts ||
          null,

        explicitSignals:
          evidencePacket
            ?.explicitSignals ||
          null,

        continuityEvidence:
          evidencePacket
            ?.continuityEvidence ||
          null,

        contextEvidence:
          evidencePacket
            ?.contextEvidence ||
          null,

        artifactEvidence:
          evidencePacket
            ?.artifactEvidence ||
          null,

        sourceIndex:
          evidencePacket
            ?.sourceIndex ||
          null,

        quality:
          evidencePacket
            ?.quality ||
          null
      },

      downstreamHandoff: {
                readyForExecutiveRouting:
          Boolean(
            evidencePacket
          ) &&
          Boolean(
            referencePacket
          ) &&
          summary.evidenceBuilderReady ===
            true,

                readyForCognitiveReasoning:
          Boolean(
            evidencePacket
          ) &&
          Boolean(
            referencePacket
          ) &&
          summary.evidenceBuilderReady ===
            true,

        referencePacketAvailable:
          Boolean(
            referencePacket
          ),

        evidencePacketId:
          evidencePacket
            ?.packetId ||
          null,

        semanticFrame:
          null,

        conversationIntentPacket:
          null,

        responsePlan:
          null,

        authority:
          "evidence_handoff_only"
      },

      diagnostics,

            quality: {
        hasMessage:
          Boolean(
            String(
              effectiveMessage
            ).trim()
          ),

        hasObservations:
          observations.length >
          0,

        hasEvidencePacket:
          Boolean(
            evidencePacket
          ),

        hasReferencePacket:
          Boolean(
            referencePacket
          ),

        evidencePacketValid:
          summary
            .evidenceBuilderValidation
            ?.valid ===
          true,

        currentTurnWasResolved:
          summary
            .currentTurnWasResolved ===
          true,

        continuityRequiresClarification:
          summary
            .continuityRequiresClarification ===
          true,

        missingInputs: [
          !String(
            effectiveMessage
          ).trim()
            ? "message"
            : null,

          !observations.length
            ? "observations"
            : null,

          !evidencePacket
            ? "evidence_packet"
            : null,

          !referencePacket
            ? "reference_packet"
            : null
        ].filter(Boolean)
      },

      authority: {
        canPreserveCurrentTurn:
          true,

        canResolveExplicitContinuityReference:
          true,

        canObserveEvidence:
          true,

        canMergeEvidence:
          true,

        canBuildEvidencePacket:
          true,

        canInterpretMeaning:
          false,

        canClassifyConversation:
          false,

        canChooseFinalIntent:
          false,

        canChooseOperation:
          false,

        canChooseRequestedOutput:
          false,

        canDetermineUserGoal:
          false,

        canConstructSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canReconcileSemanticIntent:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canCreateResponsePlan:
          false,

        canGenerateResponseStrategy:
          false,

        canAnswerUser:
          false,

        role:
          "canonical_deterministic_evidence_handoff"
      }
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

      validate() {
    const validationPacket =
      this.buildPerceptionPacket({
        evidenceBuilderReady:
          true,

        evidenceBuilderValidation: {
          valid:
            true
        },

        evidencePacket: {
          packetId:
            "validation_evidence_packet"
        },

        referenceResolverRan:
          true,

        referenceResolverReady:
          true,

        referencePacket: {
          schema:
            "ari_reference_packet",

          schemaVersion:
            "1.0.0",

          ready:
            true,

          complete:
            true,

          referenceCount:
            0,

          resolvedCount:
            0,

          unresolvedCount:
            0,

          references: [],

          resolutions: [],

          unresolvedReferences: []
        },

        perceptionDiagnostics: {
          complete:
            true
        },

        currentTurn: {
          originalText:
            "validation",

          effectiveText:
            "validation",

          normalizedText:
            "validation"
        },

        canonicalObservationLedger: [
          {
            type:
              "validation",

            value:
              "validation"
          }
        ]
      });

    const authority =
      validationPacket.authority;

    const forbiddenTrue = [
      "canInterpretMeaning",
      "canClassifyConversation",
      "canChooseFinalIntent",
      "canChooseOperation",
      "canChooseRequestedOutput",
      "canDetermineUserGoal",
      "canConstructSemanticFrame",
      "canChooseConversationFunction",
      "canReconcileSemanticIntent",
      "canChooseRoute",
      "canChoosePlanner",
      "canCreateResponsePlan",
      "canGenerateResponseStrategy",
      "canAnswerUser"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            authority[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    if (
      validationPacket.ready !==
      true
    ) {
      errors.push(
        "validation_perception_packet_not_ready"
      );
    }

    const evidenceBuilder =
      window.AriEvidenceBuilder ||
      window.Ari
        ?.evidenceBuilder ||
      null;

    const referenceResolver =
      window.AriEntityReferenceResolver ||
      window.Ari
        ?.entityReferenceResolver ||
      null;

    const warnings = [];

    if (
      !evidenceBuilder ||
      typeof evidenceBuilder.build !==
        "function" ||
      typeof evidenceBuilder
        .validateEvidencePacket !==
        "function"
    ) {
      warnings.push(
        "AriEvidenceBuilder_not_loaded"
      );
    }

    if (
      !referenceResolver ||
      typeof referenceResolver.resolve !==
        "function"
    ) {
      warnings.push(
        "AriEntityReferenceResolver_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      ready:
        errors.length ===
          0 &&
        warnings.length ===
          0,

      source:
        "ari-perception-pipeline-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        evidenceBuilderRequired:
          true,

        referenceResolverRequired:
          true,

        referencePacketRequired:
          true,

        validationPacketReady:
          validationPacket.ready ===
          true,

        semanticFrameBuilderRemoved:
          true,

        conversationClassifierRemoved:
          true,

        conversationFunctionRemoved:
          true,

        reconciliationRemoved:
          true,

        deterministicEvidenceOnly:
          true,

        openAISemanticAuthorityPreserved:
          true
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  toArray(
    value
  ) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
      );
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

  unique(
    values = []
  ) {
    const output = [];
    const seen = new Set();

    this.toArray(values)
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? value
              : this.safeJSONStringify(
                  value
                );

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          output.push(value);
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,

        (
          _key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch {
      return "";
    }
  }
};

window.Ari.perceptionPipeline =
  window.AriPerceptionPipeline;

const ariPerceptionPipelineValidation =
  window.AriPerceptionPipeline
    ?.validate?.();

console.log(
  "ARI PERCEPTION PIPELINE LOADED:",
  window.AriPerceptionPipeline
    ?.version,

  ariPerceptionPipelineValidation
    ?.ready ===
    true
    ? "READY"
    : ariPerceptionPipelineValidation
        ?.valid ===
        true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",

  ariPerceptionPipelineValidation
);
