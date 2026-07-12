// ari/context/ari-context-assembler.js
// Ari Context Assembler
// Purpose: Build one authoritative, immutable semantic context contract
// from canonical meaning, semantic structure, request interpretation,
// reference resolution, thread context, continuity, memory, relationship,
// safety context, and character context.
//
// V2.0.0 — Canonical Context Contract / Immutable Semantic Handoff
//
// Architectural order:
// 1. Semantic structure describes things and relationships.
// 2. Reference resolution identifies what references point to.
// 3. Request interpretation identifies the requested operation.
// 4. Canonical Meaning Resolver selects one supported meaning.
// 5. Context Assembler packages those results without reinterpreting them.
//
// Authority boundaries:
// - Does not interpret raw language.
// - Does not resolve references.
// - Does not infer the requested operation.
// - Does not select canonical meaning.
// - Does not choose conversation function.
// - Does not choose routing, planner, lane, or safety severity.
// - Does not write the final response.
// - Does not mutate upstream semantic outputs.

window.Ari = window.Ari || {};

window.AriContextAssembler = {
  version: "2.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  assemble(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const sources =
      this.readSources(summary);

    const validation =
      this.validateSources(sources);

    const semanticStructure =
      this.normalizeSemanticStructure(
        sources.semanticStructure
      );

    const referenceResolution =
      this.normalizeReferenceResolution(
        sources.referenceResolution
      );

    const requestInterpretation =
      this.normalizeRequestInterpretation(
        sources.requestInterpretation
      );

    const canonicalMeaning =
      this.normalizeCanonicalMeaning(
        sources.canonicalMeaning
      );

    const threadContext =
      this.normalizeThreadContext(
        sources.threadContext
      );

    const continuity =
      this.normalizeContinuity(
        sources.continuity
      );

    const memory =
      this.normalizeMemory(
        sources.memory
      );

    const relationship =
      this.normalizeRelationship(
        sources.relationship
      );

    const safety =
      this.normalizeSafety(
        sources.safety
      );

    const character =
      this.normalizeCharacter(
        sources.character
      );

    const evidence =
      this.buildEvidenceContract({
        semanticStructure,
        referenceResolution,
        requestInterpretation,
        canonicalMeaning
      });

    const ambiguity =
      this.buildAmbiguityContract({
        semanticStructure,
        referenceResolution,
        requestInterpretation,
        canonicalMeaning
      });

    const emotionalOverlay =
      this.buildEmotionalOverlay({
        semanticStructure,
        canonicalMeaning
      });

    const actionPolicy =
      this.buildActionPolicy({
        requestInterpretation,
        canonicalMeaning
      });

    const activeContext =
      this.buildActiveContext({
        semanticStructure,
        referenceResolution,
        canonicalMeaning,
        threadContext,
        continuity
      });

    const advisoryContext =
      this.buildAdvisoryContext({
        memory,
        relationship,
        character
      });

    const sourceTrace =
      this.buildSourceTrace({
        sources,
        semanticStructure,
        referenceResolution,
        requestInterpretation,
        canonicalMeaning,
        threadContext,
        continuity,
        memory,
        relationship,
        safety,
        character
      });

    const quality =
      this.buildQuality({
        validation,
        semanticStructure,
        referenceResolution,
        requestInterpretation,
        canonicalMeaning,
        threadContext,
        continuity,
        ambiguity,
        evidence
      });

    const contextContract =
      this.buildContextContract({
        summary,
        semanticStructure,
        referenceResolution,
        requestInterpretation,
        canonicalMeaning,
        threadContext,
        continuity,
        memory,
        relationship,
        safety,
        character,
        evidence,
        ambiguity,
        emotionalOverlay,
        actionPolicy,
        activeContext,
        advisoryContext,
        sourceTrace,
        quality
      });

    const frozenContract =
      this.deepFreeze(
        contextContract
      );

    window.Ari.contextContract =
      frozenContract;

    window.Ari.assembledContext =
      frozenContract;

    window.Ari.advisoryContext =
      frozenContract.advisoryContext;

    return this.buildReturnPayload(
      frozenContract
    );
  },

  /* =====================================================
     SOURCE READING
  ===================================================== */

  readSources(summary = {}) {
    return {
      semanticStructure:
        this.firstObject([
          summary.resolvedSemanticStructure,

          summary.semanticStructure,

          summary.semanticStructurePacket
            ?.resolvedSemanticStructure,

          summary.semanticStructurePacket
            ?.semanticStructure,

          summary.semanticStructureResult
            ?.resolvedSemanticStructure,

          summary.semanticStructureResult
            ?.semanticStructure,

          window.Ari
            .resolvedSemanticStructure,

          window.Ari
            .semanticStructure
        ]),

      referenceResolution:
        this.firstObject([
          summary.referenceResolution,

          summary.referenceResolutionPacket,

          summary.entityReferenceResolution,

          summary.entityReferenceState,

          summary.subjectGraphState,

          summary.entityReferenceResolverResult
            ?.referenceResolution,

          summary.entityReferenceResolverResult
            ?.entityReferenceState,

          window.Ari
            .referenceResolution,

          window.Ari
            .entityReferenceState,

          window.Ari
            .subjectGraphState
        ]),

      requestInterpretation:
        this.firstObject([
          summary.requestInterpretation,

          summary.requestInterpretationPacket,

          summary.currentRequestInterpretation,

          summary.requestInterpreterResult
            ?.requestInterpretation,

          summary.requestInterpreterResult
            ?.requestInterpretationPacket,

          window.Ari
            .requestInterpretation,

          window.Ari
            .currentRequestInterpretation
        ]),

      canonicalMeaning:
        this.firstObject([
          summary.canonicalMeaning,

          summary.selectedCanonicalMeaning,

          summary.canonicalMeaningPacket
            ?.canonicalMeaning,

          summary.canonicalMeaningResolution
            ?.canonicalMeaning,

          summary.canonicalMeaningResolverResult
            ?.canonicalMeaning,

          window.Ari
            .canonicalMeaning,

          window.Ari
            .canonicalMeaningPacket
            ?.canonicalMeaning
        ]),

      threadContext:
        this.firstObject([
          summary.threadContext,

          summary.threadContextPacket,

          summary.threadUnderstanding
            ?.threadContext,

          summary.threadUnderstanding
            ?.workingContext,

          summary.threadWorkingContext,

          summary.continuityPacket
            ?.activeThread,

          summary.threadState
            ?.threadContext,

          summary.threadState
            ?.workingContext,

          window.Ari
            .threadContext,

          window.Ari
            .workingContext
        ]),

      continuity:
        this.firstObject([
          summary.continuity,

          summary.continuityState,

          summary.conversationContinuity,

          summary.continuityPacket,

          summary.threadState,

          window.Ari
            .conversationState
        ]),

      memory:
        this.firstObject([
          summary.memoryContext,

          summary.memoryHandoff,

          summary.memoryPacket,

          summary.memoryRetrieval,

          window.Ari
            .memoryContext
        ]),

      relationship:
        this.firstObject([
          summary.relationshipProfile,

          summary.relationshipContext,

          summary.relationshipHandoff,

          window.Ari
            .relationshipProfile
        ]),

      safety:
        this.firstObject([
          summary.safetyResponseContract,

          summary.safetyDisposition,

          summary.safetyContext,

          summary.safetyContextGate,

          summary.deepSafetyReasoning,

          summary.safetyStagePacket,

          window.Ari
            .safetyContext
        ]),

      character:
        this.firstObject([
          summary.characterContext,

          summary.characterIdentity,

          summary.characterExpression
            ?.characterContext,

          summary.characterContextEngine,

          window.Ari
            .characterContext
        ])
    };
  },

  /* =====================================================
     SOURCE VALIDATION
  ===================================================== */

  validateSources(sources = {}) {
    const errors = [];
    const warnings = [];

    if (!sources.semanticStructure) {
      errors.push({
        type:
          "semantic_structure_missing",

        message:
          "The resolved semantic structure was not available."
      });
    }

    if (!sources.requestInterpretation) {
      errors.push({
        type:
          "request_interpretation_missing",

        message:
          "The request interpretation was not available."
      });
    }

    if (!sources.canonicalMeaning) {
      errors.push({
        type:
          "canonical_meaning_missing",

        message:
          "The canonical meaning was not available."
      });
    }

    if (!sources.referenceResolution) {
      warnings.push({
        type:
          "reference_resolution_missing",

        message:
          "No reference-resolution packet was available."
      });
    }

    if (!sources.threadContext) {
      warnings.push({
        type:
          "thread_context_missing",

        message:
          "No structured thread context was available."
      });
    }

    if (!sources.continuity) {
      warnings.push({
        type:
          "continuity_missing",

        message:
          "No continuity packet was available."
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,

      warnings,

      requiredSources: {
        semanticStructure:
          Boolean(
            sources.semanticStructure
          ),

        requestInterpretation:
          Boolean(
            sources.requestInterpretation
          ),

        canonicalMeaning:
          Boolean(
            sources.canonicalMeaning
          )
      },

      optionalSources: {
        referenceResolution:
          Boolean(
            sources.referenceResolution
          ),

        threadContext:
          Boolean(
            sources.threadContext
          ),

        continuity:
          Boolean(
            sources.continuity
          ),

        memory:
          Boolean(
            sources.memory
          ),

        relationship:
          Boolean(
            sources.relationship
          ),

        safety:
          Boolean(
            sources.safety
          ),

        character:
          Boolean(
            sources.character
          )
      }
    };
  },

  /* =====================================================
     SEMANTIC STRUCTURE
  ===================================================== */

  normalizeSemanticStructure(
    structure = null
  ) {
    if (
      !structure ||
      typeof structure !==
        "object"
    ) {
      return {
        schema:
          "ari_semantic_structure",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        entities: [],
        participants: [],
        events: [],
        claims: [],
        attributes: [],
        quantities: [],
        relations: [],
        references: [],
        negations: [],
        options: [],
        criteria: [],
        constraints: [],
        stakes: [],
        discourseSignals: [],
        emotionalSignals: [],
        inheritedNodes: [],
        unresolved: [],
        evidenceRefs: [],

        confidence:
          0
      };
    }

    return {
      schema:
        structure.schema ||
        "ari_semantic_structure",

      version:
        structure.version ||
        structure.schemaVersion ||
        null,

      source:
        structure.source ||
        structure
          .semanticStructureSource ||
        "semantic_structure",

      ran:
        structure.ran !==
        false,

      originalText:
        structure.originalText ||
        null,

      normalizedText:
        structure.normalizedText ||
        null,

      entities:
        this.asArray(
          structure.entities
        ),

      participants:
        this.asArray(
          structure.participants
        ),

      events:
        this.asArray(
          structure.events
        ),

      claims:
        this.asArray(
          structure.claims
        ),

      attributes:
        this.asArray(
          structure.attributes
        ),

      quantities:
        this.asArray(
          structure.quantities
        ),

      relations:
        this.asArray(
          structure.relations
        ),

      references:
        this.asArray(
          structure.references
        ),

      negations:
        this.asArray(
          structure.negations
        ),

      options:
        this.asArray(
          structure.options
        ),

      criteria:
        this.asArray(
          structure.criteria
        ),

      constraints:
        this.asArray(
          structure.constraints
        ),

      stakes:
        this.asArray(
          structure.stakes
        ),

      discourseSignals:
        this.asArray(
          structure
            .discourseSignals
        ),

      emotionalSignals:
        this.asArray(
          structure
            .emotionalSignals
        ),

      inheritedNodes:
        this.asArray(
          structure.inheritedNodes
        ),

      unresolved:
        this.asArray(
          structure.unresolved
        ),

      evidenceRefs:
        this.asArray(
          structure.evidenceRefs
        ),

      confidence:
        this.normalizeConfidence(
          structure.confidence ??
          structure.quality
            ?.confidence ??
          0
        )
    };
  },

  /* =====================================================
     REFERENCE RESOLUTION
  ===================================================== */

  normalizeReferenceResolution(
    resolution = null
  ) {
    if (
      !resolution ||
      typeof resolution !==
        "object"
    ) {
      return {
        schema:
          "ari_reference_resolution",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        decisions: [],

        resolvedReferences: [],

        unresolvedReferences: [],

        activeEntity:
          null,

        activeSubject:
          null,

        confidence:
          0
      };
    }

    const root =
      resolution.referenceResolution ||
      resolution.entityReferenceState ||
      resolution.subjectGraphState ||
      resolution;

    const decisions =
      this.asArray(
        root.decisions ||
        root.referenceDecisions
      );

    const legacyResolved =
      this.asArray(
        root.resolvedReferences
      );

    const resolvedReferences =
      decisions.length
        ? decisions.filter(
            decision =>
              decision.status ===
              "resolved"
          )
        : legacyResolved;

    const unresolvedReferences =
      decisions.length
        ? decisions.filter(
            decision =>
              decision.status !==
              "resolved"
          )
        : this.asArray(
            root.unresolvedReferences
          );

    return {
      schema:
        root.schema ||
        "ari_reference_resolution",

      version:
        root.version ||
        root
          .referenceResolutionVersion ||
        root
          .entityReferenceResolverVersion ||
        null,

      source:
        root.source ||
        root
          .referenceResolutionSource ||
        root
          .entityReferenceResolverSource ||
        "reference_resolution",

      ran:
        root.ran !==
        false,

      decisions,

      resolvedReferences,

      unresolvedReferences,

      activeEntity:
        root.activeEntity ||
        null,

      activeSubject:
        root.activeSubject ||
        null,

      activeObject:
        root.activeObject ||
        null,

      activeIssue:
        root.activeIssue ||
        root.activeProblem ||
        null,

      entities:
        this.asArray(
          root.entities ||
          root.activeEntities
        ),

      references:
        this.asArray(
          root.references
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          0
        )
    };
  },

  /* =====================================================
     REQUEST INTERPRETATION
  ===================================================== */

  normalizeRequestInterpretation(
    interpretation = null
  ) {
    if (
      !interpretation ||
      typeof interpretation !==
        "object"
    ) {
      return {
        schema:
          "ari_request_interpretation",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        speechAct:
          null,

        requestedOperation:
          null,

        proposedOperation:
          null,

        requestedOutput:
          null,

        requestFamily:
          null,

        secondaryOperations: [],

        actionPolicy: {
          executionAllowed:
            true,

          analysisOnly:
            false,

          prohibitedOperations:
            [],

          deferredOperations:
            []
        },

        ambiguity: {
          present:
            true,

          requiresClarification:
            false,

          reasons: [
            "request_interpretation_missing"
          ]
        },

        evidenceRefs: [],

        confidence:
          0
      };
    }

    const root =
      interpretation
        .requestInterpretation ||
      interpretation;

    const primaryOperation =
      root.requestedOperation ||
      root.primaryOperation
        ?.operation ||
      root.primaryOperation ||
      null;

    return {
      schema:
        root.schema ||
        "ari_request_interpretation",

      version:
        root.version ||
        root
          .requestInterpretationVersion ||
        null,

      source:
        root.source ||
        root
          .requestInterpretationSource ||
        "request_interpretation",

      ran:
        root.ran !==
        false,

      speechAct:
        root.speechAct ||
        null,

      requestedOperation:
        primaryOperation,

      proposedOperation:
        root.proposedOperation ||
        null,

      requestedOutput:
        root.requestedOutput ||
        root.primaryOutput ||
        null,

      requestFamily:
        root.requestFamily ||
        root.interactionFamily ||
        null,

      intentFamily:
        root.intentFamily ||
        null,

      secondaryOperations:
        this.asArray(
          root.secondaryOperations
        ),

      operationCandidates:
        this.asArray(
          root.operationCandidates
        ),

      outputCandidates:
        this.asArray(
          root.outputCandidates
        ),

      actionPolicy:
        this.normalizeActionPolicy(
          root.actionPolicy
        ),

      ambiguity:
        this.normalizeAmbiguity(
          root.ambiguity
        ),

      evidenceRefs:
        this.asArray(
          root.evidenceRefs
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          root.quality
            ?.confidence ??
          0
        )
    };
  },

  /* =====================================================
     CANONICAL MEANING
  ===================================================== */

  normalizeCanonicalMeaning(
    meaning = null
  ) {
    if (
      !meaning ||
      typeof meaning !==
        "object"
    ) {
      return null;
    }

    const root =
      meaning.canonicalMeaning ||
      meaning;

    return {
      ...root,

      schema:
        root.schema ||
        "ari_canonical_meaning",

      version:
        root.version ||
        null,

      source:
        root.source ||
        "canonical_meaning",

      selected:
        root.selected !==
        false,

      canonical:
        root.canonical !==
        false,

      operation:
        root.operation ||
        root.requestedOperation ||
        null,

      requestedOperation:
        root.requestedOperation ||
        root.operation ||
        null,

      requestedOutput:
        root.requestedOutput ||
        null,

      slots:
        root.slots &&
        typeof root.slots ===
          "object"
          ? root.slots
          : {},

      options:
        this.asArray(
          root.options ||
          root.slots?.options
        ),

      criteria:
        this.asArray(
          root.criteria ||
          root.slots?.criteria
        ),

      constraints:
        this.asArray(
          root.constraints ||
          root.slots
            ?.constraints
        ),

      stakes:
        this.asArray(
          root.stakes ||
          root.slots?.stakes
        ),

      quantities:
        this.asArray(
          root.quantities ||
          root.slots?.quantities
        ),

      claims:
        this.asArray(
          root.claims ||
          root.slots?.claims
        ),

      events:
        this.asArray(
          root.events ||
          root.slots?.events
        ),

      relations:
        this.asArray(
          root.relations ||
          root.slots?.relations
        ),

      negations:
        this.asArray(
          root.negations ||
          root.slots?.negations
        ),

      contextModifiers:
        this.asArray(
          root.contextModifiers
        ),

      assumptions:
        this.asArray(
          root.assumptions
        ),

      unresolved:
        this.asArray(
          root.unresolved
        ),

      evidenceRefs:
        this.asArray(
          root.evidenceRefs
        ),

      emotionalOverlay:
        root.emotionalOverlay ||
        {
          present:
            false,

          states: [],

          signals: [],

          role:
            "none",

          confidence:
            0
        },

      actionPolicy:
        this.normalizeActionPolicy(
          root.actionPolicy
        ),

      ambiguity:
        this.normalizeAmbiguity(
          root.ambiguity
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          0
        )
    };
  },

  /* =====================================================
     THREAD CONTEXT
  ===================================================== */

  normalizeThreadContext(
    thread = null
  ) {
    if (
      !thread ||
      typeof thread !==
        "object"
    ) {
      return {
        schema:
          "ari_thread_context",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        activeTopic:
          null,

        activeEntities: [],

        activeClaims: [],

        activeEvents: [],

        activeQuantities: [],

        activeRelations: [],

        activeQuestion:
          null,

        previousAnswer:
          null,

        unresolvedItems: [],

        openLoops: [],

        recentTurns: [],

        topicHistory: [],

        confidence:
          0
      };
    }

    const root =
      thread.threadContext ||
      thread.workingContext ||
      thread;

    return {
      schema:
        root.schema ||
        "ari_thread_context",

      version:
        root.version ||
        root
          .threadContextVersion ||
        root
          .threadUnderstandingVersion ||
        null,

      source:
        root.source ||
        root
          .threadContextSource ||
        root
          .threadUnderstandingSource ||
        "thread_context",

      ran:
        root.ran !==
        false,

      activeTopic:
        root.activeTopic ||
        root.currentTopic ||
        root.mainTopic ||
        null,

      activeSubject:
        root.activeSubject ||
        null,

      activeObject:
        root.activeObject ||
        null,

      activeIssue:
        root.activeIssue ||
        null,

      activeGoal:
        root.activeGoal ||
        null,

      activeEntities:
        this.asArray(
          root.activeEntities ||
          root.entities
        ),

      activeClaims:
        this.asArray(
          root.activeClaims ||
          root.claims ||
          root.keyFacts
        ),

      activeEvents:
        this.asArray(
          root.activeEvents ||
          root.events
        ),

      activeQuantities:
        this.asArray(
          root.activeQuantities ||
          root.quantities
        ),

      activeRelations:
        this.asArray(
          root.activeRelations ||
          root.relations
        ),

      activeQuestion:
        root.activeQuestion ||
        root.currentQuestion ||
        null,

      previousAnswer:
        root.previousAnswer ||
        root.lastResolvedAnswer ||
        root.previousAnswerSummary ||
        null,

      unresolvedItems:
        this.asArray(
          root.unresolvedItems ||
          root.unresolved
        ),

      openLoops:
        this.asArray(
          root.openLoops
        ),

      recentTurns:
        this.asArray(
          root.recentTurns ||
          root.lastMessages ||
          root.timeline
        ),

      topicHistory:
        this.asArray(
          root.topicHistory
        ),

      topicTransition:
        root.topicTransition ||
        null,

      staleContextSuppressed:
        root.staleContextSuppressed ===
        true,

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          0
        )
    };
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  normalizeContinuity(
    continuity = null
  ) {
    if (
      !continuity ||
      typeof continuity !==
        "object"
    ) {
      return {
        schema:
          "ari_continuity",

        version:
          null,

        source:
          "not_available",

        ran:
          false,

        continuityType:
          "none",

        shouldUsePriorContext:
          false,

        followUpDetected:
          false,

        followUpType:
          "none",

        currentTopic:
          null,

        previousTopic:
          null,

        usableFacts: [],

        unresolvedReferences: [],

        previousAnswerSummary:
          null,

        recentMessages: [],

        confidence:
          0
      };
    }

    const root =
      continuity.continuityState ||
      continuity
        .conversationContinuity ||
      continuity;

    return {
      schema:
        root.schema ||
        "ari_continuity",

      version:
        root.version ||
        root
          .continuityEngineVersion ||
        null,

      source:
        root.source ||
        root
          .continuityEngineSource ||
        "continuity",

      ran:
        root.ran !==
        false,

      continuityType:
        root.continuityType ||
        root.followUpType ||
        "none",

      shouldUsePriorContext:
        Boolean(
          root.shouldUsePriorContext ||
          root.shouldReusePriorContext ||
          root.situationMapHandoff
            ?.shouldUseAsContext ||
          root.currentTurn
            ?.needsPriorContext
        ),

      followUpDetected:
        Boolean(
          root.followUpDetected ||
          root.shouldReusePriorContext
        ),

      followUpType:
        root.followUpType ||
        "none",

      currentTopic:
        root.currentTopic ||
        root.activeThread
          ?.activeTopic ||
        null,

      previousTopic:
        root.previousTopic ||
        null,

      activeSubject:
        root.activeThread
          ?.activeSubject ||
        root.activeSubject ||
        null,

      usableFacts:
        this.asArray(
          root.usableFacts
        ),

      unresolvedReferences:
        this.asArray(
          root.unresolvedReferences
        ),

      previousAnswerSummary:
        root.previousAnswerSummary ||
        root.lastFinalResponse ||
        null,

      recentMessages:
        this.asArray(
          root.recentMessages ||
          root.lastMessages
        ),

      confidence:
        this.normalizeConfidence(
          root.confidence ??
          root.followUpConfidence ??
          0
        )
    };
  },

  /* =====================================================
     MEMORY
  ===================================================== */

  normalizeMemory(memory = null) {
    if (
      !memory ||
      typeof memory !==
        "object"
    ) {
      return {
        available:
          false,

        relevantMemories: [],

        userPreferences: {},

        projectContext: {},

        priorDecisions: [],

        relationshipPatterns: [],

        activeThreadFacts: [],

        conflicts: [],

        confidence:
          0
      };
    }

    return {
      available:
        memory.available !==
        false,

      relevantMemories:
        this.asArray(
          memory.relevantMemories ||
          memory.memories ||
          memory.items
        ).slice(
          0,
          12
        ),

      userPreferences:
        memory.userPreferences ||
        {},

      projectContext:
        memory.projectContext ||
        {},

      priorDecisions:
        this.asArray(
          memory.priorDecisions
        ).slice(
          0,
          12
        ),

      relationshipPatterns:
        this.asArray(
          memory
            .relationshipPatterns
        ).slice(
          0,
          12
        ),

      activeThreadFacts:
        this.asArray(
          memory.activeThreadFacts ||
          memory.facts
        ).slice(
          0,
          12
        ),

      conflicts:
        this.asArray(
          memory.conflicts
        ).slice(
          0,
          8
        ),

      confidence:
        this.normalizeConfidence(
          memory.confidence ??
          0
        ),

      source:
        memory.source ||
        "memory_context"
    };
  },

  /* =====================================================
     RELATIONSHIP
  ===================================================== */

  normalizeRelationship(
    relationship = null
  ) {
    if (
      !relationship ||
      typeof relationship !==
        "object"
    ) {
      return {
        available:
          false,

        communicationStyle:
          "direct_warm_practical",

        depth:
          "normal",

        collaborationMode:
          "standard",

        challengeTolerance:
          "medium",

        technicalComfort:
          "unknown",

        preferredFormat:
          "clear_steps",

        stablePreferences: {},

        activeProjects: [],

        reasons: [],

        confidence:
          0
      };
    }

    return {
      available:
        relationship.available !==
        false,

      communicationStyle:
        relationship
          .communicationStyle ||
        "direct_warm_practical",

      depth:
        relationship.depth ||
        "normal",

      collaborationMode:
        relationship
          .collaborationMode ||
        "standard",

      challengeTolerance:
        relationship
          .challengeTolerance ||
        "medium",

      technicalComfort:
        relationship
          .technicalComfort ||
        "unknown",

      preferredFormat:
        relationship
          .preferredFormat ||
        "clear_steps",

      stablePreferences:
        relationship
          .stablePreferences ||
        {},

      activeProjects:
        this.asArray(
          relationship.activeProjects
        ),

      reasons:
        this.asArray(
          relationship.reasons
        ),

      confidence:
        this.normalizeConfidence(
          relationship.confidence ??
          0
        ),

      source:
        relationship.source ||
        "relationship_context"
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  normalizeSafety(safety = null) {
    if (
      !safety ||
      typeof safety !==
        "object"
    ) {
      return {
        available:
          false,

        applicable:
          false,

        riskLevel:
          "none",

        riskType:
          "none",

        authority:
          "none",

        shouldStopNormalResponse:
          false,

        requiresClarification:
          false,

        responseContract:
          null,

        confidence:
          0
      };
    }

    return {
      available:
        true,

      applicable:
        safety.applicable ===
        true,

      riskLevel:
        safety.riskLevel ||
        safety
          .resolvedSafetyRiskLevel ||
        "none",

      riskType:
        safety.riskType ||
        safety
          .resolvedSafetyRiskType ||
        "none",

      authority:
        safety.safetyAuthority ||
        safety.authority ||
        "safety_context",

      shouldStopNormalResponse:
        safety
          .shouldStopNormalResponse ===
          true ||
        safety
          .safetyShouldStopNormalResponse ===
          true,

      requiresClarification:
        safety
          .requiresClarification ===
          true,

      responseContract:
        safety.responseContract ||
        safety.safetyResponseContract ||
        null,

      confidence:
        this.normalizeConfidence(
          safety.confidence ??
          0
        ),

      source:
        safety.source ||
        "safety_context"
    };
  },

  /* =====================================================
     CHARACTER
  ===================================================== */

  normalizeCharacter(character = null) {
    if (
      !character ||
      typeof character !==
        "object"
    ) {
      return {
        available:
          false,

        useAllowed:
          false,

        mode:
          "background",

        visibility:
          "background",

        focus:
          null,

        stablePreferences: {},

        hints: {},

        signals: {},

        budget: {},

        userFacingLanguageRules: {
          preferredPhrases: [
            "my values",
            "the way I see it"
          ],

          avoidPhrases: [
            "according to my Constitution"
          ]
        },

        confidence:
          0
      };
    }

    return {
      available:
        true,

      useAllowed:
        character
          .characterUseAllowed ===
          true ||
        character.useAllowed ===
          true ||
        character.characterMode ===
          "direct",

      mode:
        character.characterMode ||
        character.mode ||
        "background",

      visibility:
        character
          .characterVisibility ||
        character.visibility ||
        "background",

      focus:
        character.characterFocus ||
        character.focus ||
        null,

      stablePreferences:
        character
          .characterPreferences
          ?.stablePreferences ||
        character.stablePreferences ||
        {},

      core:
        character.characterCore ||
        character.core ||
        null,

      preferences:
        character
          .characterPreferences ||
        character.preferences ||
        null,

      worldview:
        character.ariWorldview ||
        character.worldview ||
        null,

      hints:
        character.characterHints ||
        character.hints ||
        {},

      signals:
        character
          .characterSignals ||
        character.signals ||
        {},

      budget:
        character.characterBudget ||
        character.budget ||
        {},

      userFacingLanguageRules:
        character
          .userFacingLanguageRules ||
        character.characterHints
          ?.userFacingLanguageRules ||
        {
          preferredPhrases: [
            "my values",
            "the way I see it"
          ],

          avoidPhrases: [
            "according to my Constitution"
          ]
        },

      cannotSet:
        this.asArray(
          character.cannotSet
        ),

      confidence:
        this.normalizeConfidence(
          character.confidence ??
          0.82
        ),

      source:
        character.source ||
        "character_context"
    };
  },

  /* =====================================================
     EVIDENCE CONTRACT
  ===================================================== */

  buildEvidenceContract({
    semanticStructure = {},
    referenceResolution = {},
    requestInterpretation = {},
    canonicalMeaning = null
  } = {}) {
    const evidenceRefs =
      this.uniqueStrings([
        ...this.asArray(
          semanticStructure.evidenceRefs
        ),

        ...this.asArray(
          requestInterpretation
            .evidenceRefs
        ),

        ...this.asArray(
          canonicalMeaning
            ?.evidenceRefs
        ),

        ...this.asArray(
          canonicalMeaning
            ?.evidenceSummary
            ?.supportingEvidence
        )
          .map(item =>
            item?.evidenceRef ||
            item?.id ||
            null
          )
          .filter(Boolean)
      ]);

    return {
      schema:
        "ari_context_evidence",

      supportingEvidence:
        this.asArray(
          canonicalMeaning
            ?.evidenceSummary
            ?.supportingEvidence
        ),

      contradictingEvidence:
        this.asArray(
          canonicalMeaning
            ?.evidenceSummary
            ?.contradictingEvidence
        ),

      evidenceRefs,

      structureEvidenceRefs:
        this.asArray(
          semanticStructure.evidenceRefs
        ),

      requestEvidenceRefs:
        this.asArray(
          requestInterpretation
            .evidenceRefs
        ),

      referenceDecisions:
        this.asArray(
          referenceResolution.decisions
        ),

      decisionReason:
        canonicalMeaning
          ?.evidenceSummary
          ?.decisionReason ||
        null,

      evidenceStrength:
        this.normalizeConfidence(
          (
            canonicalMeaning
              ?.evidenceSummary
              ?.evidenceStrength ||
            0
          ) /
          100
        ),

      consistency: {
        structure:
          canonicalMeaning
            ?.evidenceSummary
            ?.structureConsistency ===
          true,

        references:
          canonicalMeaning
            ?.evidenceSummary
            ?.referenceConsistency ===
          true,

        operation:
          canonicalMeaning
            ?.evidenceSummary
            ?.operationConsistency ===
          true,

        continuity:
          canonicalMeaning
            ?.evidenceSummary
            ?.continuityConsistency ===
          true,

        actionPolicy:
          canonicalMeaning
            ?.evidenceSummary
            ?.actionPolicyConsistent !==
          false
      }
    };
  },

  /* =====================================================
     AMBIGUITY CONTRACT
  ===================================================== */

  buildAmbiguityContract({
    semanticStructure = {},
    referenceResolution = {},
    requestInterpretation = {},
    canonicalMeaning = null
  } = {}) {
    const semanticUnresolved =
      this.asArray(
        semanticStructure.unresolved
      );

    const unresolvedReferences =
      this.asArray(
        referenceResolution
          .unresolvedReferences
      );

    const requestAmbiguity =
      this.normalizeAmbiguity(
        requestInterpretation
          .ambiguity
      );

    const canonicalAmbiguity =
      this.normalizeAmbiguity(
        canonicalMeaning
          ?.ambiguity
      );

    const reasons =
      this.uniqueStrings([
        ...this.asArray(
          requestAmbiguity.reasons
        ),

        ...this.asArray(
          canonicalAmbiguity.reasons
        ),

        ...this.asArray(
          canonicalAmbiguity
            .upstreamReasons
        ),

        ...semanticUnresolved.map(
          item =>
            item.reason ||
            item.type ||
            "unresolved_semantic_item"
        ),

        ...unresolvedReferences.map(
          item =>
            item.reason ||
            item.status ||
            "unresolved_reference"
        )
      ]);

    const present =
      requestAmbiguity.present ===
        true ||
      canonicalAmbiguity.present ===
        true ||
      semanticUnresolved.length >
        0 ||
      unresolvedReferences.length >
        0;

    const requiresClarification =
      requestAmbiguity
        .requiresClarification ===
        true ||
      canonicalAmbiguity
        .requiresClarification ===
        true;

    return {
      schema:
        "ari_context_ambiguity",

      present,

      resolved:
        present
          ? (
              canonicalAmbiguity
                .resolved ===
                true &&
              !requiresClarification
            )
          : true,

      requiresClarification,

      reasons,

      semanticUnresolved,

      unresolvedReferences,

      requestAmbiguity,

      canonicalAmbiguity,

      remainingAmbiguity:
        this.asArray(
          canonicalAmbiguity
            .remainingAmbiguity
        ),

      confidence:
        canonicalAmbiguity.confidence ||
        requestAmbiguity.confidence ||
        (
          present
            ? 0.55
            : 0.95
        )
    };
  },

  /* =====================================================
     EMOTIONAL OVERLAY
  ===================================================== */

  buildEmotionalOverlay({
    semanticStructure = {},
    canonicalMeaning = null
  } = {}) {
    const canonicalOverlay =
      canonicalMeaning
        ?.emotionalOverlay ||
      {};

    const semanticSignals =
      this.asArray(
        semanticStructure
          .emotionalSignals
      );

    const states =
      this.uniqueStrings([
        ...this.asArray(
          canonicalOverlay.states
        ),

        ...semanticSignals.map(
          item =>
            item.state ||
            item.value ||
            item.label ||
            item.type ||
            null
        )
      ]);

    return {
      present:
        canonicalOverlay.present ===
          true ||
        semanticSignals.length >
          0,

      primaryState:
        canonicalOverlay
          .primaryState ||
        states[0] ||
        null,

      states,

      signals:
        this.dedupeNodes([
          ...this.asArray(
            canonicalOverlay.signals
          ),

          ...semanticSignals
        ]),

      explicitSupportRequested:
        canonicalOverlay
          .explicitSupportRequested ===
          true ||
        canonicalMeaning
          ?.operation ===
          "provide_emotional_support",

      role:
        canonicalOverlay.role ||
        (
          canonicalMeaning
            ?.operation ===
            "provide_emotional_support"
            ? "primary_request"
            : "context_modifier"
        ),

      shouldNotReplacePrimaryMeaning:
        canonicalMeaning
          ?.operation !==
        "provide_emotional_support",

      confidence:
        Math.max(
          this.normalizeConfidence(
            canonicalOverlay.confidence ??
            0
          ),

          ...semanticSignals.map(
            item =>
              this.normalizeConfidence(
                item.confidence ??
                0
              )
          ),

          0
        )
    };
  },

  /* =====================================================
     ACTION POLICY
  ===================================================== */

  buildActionPolicy({
    requestInterpretation = {},
    canonicalMeaning = null
  } = {}) {
    const requestPolicy =
      this.normalizeActionPolicy(
        requestInterpretation
          .actionPolicy
      );

    const canonicalPolicy =
      this.normalizeActionPolicy(
        canonicalMeaning
          ?.actionPolicy
      );

    return {
      executionAllowed:
        requestPolicy
          .executionAllowed !==
          false &&
        canonicalPolicy
          .executionAllowed !==
          false,

      analysisOnly:
        requestPolicy
          .analysisOnly ===
          true ||
        canonicalPolicy
          .analysisOnly ===
          true,

      explicitExecutionProhibition:
        requestPolicy
          .explicitExecutionProhibition ===
          true ||
        canonicalPolicy
          .explicitExecutionProhibition ===
          true,

      prohibitedOperations:
        this.uniqueStrings([
          ...this.asArray(
            requestPolicy
              .prohibitedOperations
          ),

          ...this.asArray(
            canonicalPolicy
              .prohibitedOperations
          )
        ]),

      deferredOperations:
        this.uniqueStrings([
          ...this.asArray(
            requestPolicy
              .deferredOperations
          ),

          ...this.asArray(
            canonicalPolicy
              .deferredOperations
          )
        ]),

      proposedOperation:
        requestPolicy
          .proposedOperation ||
        requestInterpretation
          .proposedOperation ||
        null,

      resolvedOperation:
        canonicalMeaning
          ?.operation ||
        requestPolicy
          .resolvedOperation ||
        requestInterpretation
          .requestedOperation ||
        null,

      requestedOutput:
        canonicalMeaning
          ?.requestedOutput ||
        requestInterpretation
          .requestedOutput ||
        null,

      authority:
        "explicit_user_action_authorization_preserved"
    };
  },

  /* =====================================================
     ACTIVE CONTEXT
  ===================================================== */

  buildActiveContext({
    semanticStructure = {},
    referenceResolution = {},
    canonicalMeaning = null,
    threadContext = {},
    continuity = {}
  } = {}) {
    const activeEntities =
      this.dedupeNodes([
        ...this.asArray(
          semanticStructure.entities
        ),

        ...this.asArray(
          threadContext.activeEntities
        ),

        ...this.asArray(
          referenceResolution.entities
        )
      ]);

    const activeClaims =
      this.dedupeNodes([
        ...this.asArray(
          canonicalMeaning?.claims
        ),

        ...this.asArray(
          threadContext.activeClaims
        ),

        ...this.asArray(
          semanticStructure.claims
        )
      ]);

    const activeEvents =
      this.dedupeNodes([
        ...this.asArray(
          canonicalMeaning?.events
        ),

        ...this.asArray(
          threadContext.activeEvents
        ),

        ...this.asArray(
          semanticStructure.events
        )
      ]);

    const activeQuantities =
      this.dedupeNodes([
        ...this.asArray(
          canonicalMeaning
            ?.quantities
        ),

        ...this.asArray(
          threadContext
            .activeQuantities
        ),

        ...this.asArray(
          semanticStructure
            .quantities
        )
      ]);

    const activeRelations =
      this.dedupeNodes([
        ...this.asArray(
          canonicalMeaning
            ?.relations
        ),

        ...this.asArray(
          threadContext
            .activeRelations
        ),

        ...this.asArray(
          semanticStructure
            .relations
        )
      ]);

    const unresolvedItems =
      this.dedupeNodes([
        ...this.asArray(
          canonicalMeaning
            ?.unresolved
        ),

        ...this.asArray(
          threadContext
            .unresolvedItems
        ),

        ...this.asArray(
          semanticStructure
            .unresolved
        )
      ]);

    return {
      activeTopic:
        threadContext.activeTopic ||
        continuity.currentTopic ||
        this.nodeLabel(
          canonicalMeaning?.object
        ) ||
        null,

      activeSubject:
        canonicalMeaning?.subject ||
        referenceResolution
          .activeSubject ||
        threadContext.activeSubject ||
        continuity.activeSubject ||
        null,

      activeObject:
        canonicalMeaning?.object ||
        referenceResolution
          .activeObject ||
        threadContext.activeObject ||
        null,

      activeTarget:
        canonicalMeaning?.target ||
        null,

      activeIssue:
        threadContext.activeIssue ||
        referenceResolution
          .activeIssue ||
        canonicalMeaning?.slots
          ?.problem ||
        null,

      activeGoal:
        canonicalMeaning?.slots
          ?.goal ||
        threadContext.activeGoal ||
        null,

      activeQuestion:
        threadContext.activeQuestion ||
        null,

      previousAnswer:
        threadContext.previousAnswer ||
        continuity
          .previousAnswerSummary ||
        null,

      activeEntities,

      activeClaims,

      activeEvents,

      activeQuantities,

      activeRelations,

      options:
        this.asArray(
          canonicalMeaning?.options
        ),

      criteria:
        this.asArray(
          canonicalMeaning?.criteria
        ),

      constraints:
        this.asArray(
          canonicalMeaning
            ?.constraints
        ),

      stakes:
        this.asArray(
          canonicalMeaning?.stakes
        ),

      unresolvedItems,

      openLoops:
        this.asArray(
          threadContext.openLoops
        ),

      recentTurns:
        this.asArray(
          threadContext.recentTurns
        ),

      topicHistory:
        this.asArray(
          threadContext.topicHistory
        ),

      usesPriorContext:
        canonicalMeaning
          ?.continuity
          ?.usesPriorContext ===
          true ||
        continuity
          .shouldUsePriorContext ===
          true,

      staleContextSuppressed:
        threadContext
          .staleContextSuppressed ===
          true,

      confidence:
        Math.max(
          canonicalMeaning
            ?.confidence ||
            0,

          threadContext.confidence ||
            0,

          continuity.confidence ||
            0
        )
    };
  },

  /* =====================================================
     ADVISORY CONTEXT
  ===================================================== */

  buildAdvisoryContext({
    memory = {},
    relationship = {},
    character = {}
  } = {}) {
    return {
      memory,

      relationship,

      character,

      styleHints: {
        communicationStyle:
          relationship
            .communicationStyle,

        depth:
          relationship.depth,

        collaborationMode:
          relationship
            .collaborationMode,

        challengeTolerance:
          relationship
            .challengeTolerance,

        technicalComfort:
          relationship
            .technicalComfort,

        preferredFormat:
          relationship
            .preferredFormat,

        stablePreferences:
          relationship
            .stablePreferences
      },

      projectContext:
        memory.projectContext ||
        {},

      priorDecisions:
        this.asArray(
          memory.priorDecisions
        ),

      relevantMemories:
        this.asArray(
          memory.relevantMemories
        ),

      relationshipPatterns:
        this.asArray(
          memory
            .relationshipPatterns
        ),

      conflicts:
        this.asArray(
          memory.conflicts
        ),

      authority: {
        canShapeStyle:
          true,

        canProvideRelevantMemory:
          true,

        canProvideRelationshipContext:
          true,

        canProvideCharacterContext:
          true,

        canChangeCanonicalMeaning:
          false,

        canChangeRequestedOperation:
          false,

        canOverrideReferenceResolution:
          false,

        canOverrideSafety:
          false,

        role:
          "advisory_context_only"
      }
    };
  },

  /* =====================================================
     SOURCE TRACE
  ===================================================== */

  buildSourceTrace({
    semanticStructure = {},
    referenceResolution = {},
    requestInterpretation = {},
    canonicalMeaning = null,
    threadContext = {},
    continuity = {},
    memory = {},
    relationship = {},
    safety = {},
    character = {}
  } = {}) {
    return {
      semanticStructure:
        this.traceSource(
          semanticStructure
        ),

      referenceResolution:
        this.traceSource(
          referenceResolution
        ),

      requestInterpretation:
        this.traceSource(
          requestInterpretation
        ),

      canonicalMeaning:
        this.traceSource(
          canonicalMeaning
        ),

      threadContext:
        this.traceSource(
          threadContext
        ),

      continuity:
        this.traceSource(
          continuity
        ),

      memory:
        this.traceSource(
          memory
        ),

      relationship:
        this.traceSource(
          relationship
        ),

      safety:
        this.traceSource(
          safety
        ),

      character:
        this.traceSource(
          character
        )
    };
  },

  traceSource(value = null) {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return {
        available:
          false,

        ran:
          false,

        source:
          null,

        version:
          null,

        confidence:
          0
      };
    }

    return {
      available:
        value.available !==
        false,

      ran:
        value.ran !==
        false,

      source:
        value.source ||
        null,

      version:
        value.version ||
        null,

      schema:
        value.schema ||
        null,

      confidence:
        this.normalizeConfidence(
          value.confidence ??
          0
        )
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality({
    validation = {},
    semanticStructure = {},
    referenceResolution = {},
    requestInterpretation = {},
    canonicalMeaning = null,
    threadContext = {},
    continuity = {},
    ambiguity = {},
    evidence = {}
  } = {}) {
    const warnings = [
      ...this.asArray(
        validation.warnings
      )
    ];

    if (
      ambiguity.present &&
      ambiguity
        .requiresClarification
    ) {
      warnings.push({
        type:
          "clarification_required",

        message:
          "Meaning or reference ambiguity remains unresolved."
      });
    }

    if (
      referenceResolution.ran ===
      false &&
      semanticStructure
        .references.length >
        0
    ) {
      warnings.push({
        type:
          "references_without_resolution",

        message:
          "The semantic structure contains references, but no reference-resolution output is available."
      });
    }

    if (
      threadContext.ran ===
      false &&
      continuity
        .shouldUsePriorContext
    ) {
      warnings.push({
        type:
          "continuity_without_thread_context",

        message:
          "Continuity requested prior context, but structured thread context is unavailable."
      });
    }

    let score = 0;

    if (validation.valid) {
      score += 0.28;
    }

    if (
      semanticStructure.ran !==
      false
    ) {
      score += 0.12;
    }

    if (
      requestInterpretation.ran !==
      false
    ) {
      score += 0.12;
    }

    if (canonicalMeaning) {
      score += 0.2;
    }

    if (
      referenceResolution.ran !==
      false
    ) {
      score += 0.08;
    }

    if (
      threadContext.ran !==
      false
    ) {
      score += 0.06;
    }

    if (
      evidence.consistency
        .structure
    ) {
      score += 0.04;
    }

    if (
      evidence.consistency
        .operation
    ) {
      score += 0.04;
    }

    if (
      evidence.consistency
        .references ||
      semanticStructure
        .references.length ===
        0
    ) {
      score += 0.03;
    }

    if (
      !ambiguity
        .requiresClarification
    ) {
      score += 0.03;
    }

    score =
      this.normalizeConfidence(
        score
      );

    return {
      healthy:
        validation.valid ===
          true &&
        Boolean(
          canonicalMeaning
        ),

      score,

      confidence:
        score,

      contextContractReady:
        validation.valid ===
          true &&
        Boolean(
          canonicalMeaning
        ),

      canonicalMeaningAvailable:
        Boolean(
          canonicalMeaning
        ),

      semanticStructureAvailable:
        semanticStructure.ran !==
        false,

      referenceResolutionAvailable:
        referenceResolution.ran !==
        false,

      requestInterpretationAvailable:
        requestInterpretation.ran !==
        false,

      threadContextAvailable:
        threadContext.ran !==
        false,

      continuityAvailable:
        continuity.ran !==
        false,

      ambiguityPresent:
        ambiguity.present ===
        true,

      clarificationRequired:
        ambiguity
          .requiresClarification ===
        true,

      validation,

      warnings
    };
  },

  /* =====================================================
     CONTEXT CONTRACT
  ===================================================== */

  buildContextContract({
    summary = {},
    semanticStructure = {},
    referenceResolution = {},
    requestInterpretation = {},
    canonicalMeaning = null,
    threadContext = {},
    continuity = {},
    memory = {},
    relationship = {},
    safety = {},
    character = {},
    evidence = {},
    ambiguity = {},
    emotionalOverlay = {},
    actionPolicy = {},
    activeContext = {},
    advisoryContext = {},
    sourceTrace = {},
    quality = {}
  } = {}) {
    const originalText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const resolvedText =
      summary.resolvedUserQuestion ||
      summary.resolvedCurrentTurn
        ?.resolvedText ||
      originalText;

    return {
      schema:
        "ari_context_contract",

      version:
        this.schemaVersion,

      engineVersion:
        this.version,

      source:
        "ari-context-assembler",

      createdAt:
        new Date().toISOString(),

      ready:
        quality
          .contextContractReady ===
        true,

      immutable:
        true,

      request: {
        originalText,

        resolvedText,

        currentTurnWasResolved:
          summary
            .currentTurnWasResolved ===
            true ||
          originalText !==
            resolvedText
      },

      semanticStructure,

      referenceResolution,

      requestInterpretation,

      canonicalMeaning,

      threadContext,

      continuity,

      activeContext,

      evidence,

      ambiguity,

      emotionalOverlay,

      actionPolicy,

      safety,

      advisoryContext,

      metadata: {
        operation:
          canonicalMeaning
            ?.operation ||
          requestInterpretation
            .requestedOperation ||
          null,

        requestedOutput:
          canonicalMeaning
            ?.requestedOutput ||
          requestInterpretation
            .requestedOutput ||
          null,

        requestFamily:
          canonicalMeaning
            ?.requestFamily ||
          requestInterpretation
            .requestFamily ||
          null,

        domain:
          canonicalMeaning
            ?.domain ||
          null,

        usesPriorContext:
          activeContext
            .usesPriorContext ===
          true,

        clarificationRequired:
          ambiguity
            .requiresClarification ===
          true,

        executionAllowed:
          actionPolicy
            .executionAllowed !==
          false,

        analysisOnly:
          actionPolicy
            .analysisOnly ===
          true
      },

      sourceTrace,

      quality,

      handoff: {
        readyForSemanticFrameBuilder:
          quality
            .contextContractReady ===
            true,

        readyForConversationFunction:
          quality
            .contextContractReady ===
            true,

        readyForSituationModel:
          quality
            .contextContractReady ===
            true,

        downstreamReadPath:
          "summary.contextContract",

        canonicalMeaningPath:
          "summary.contextContract.canonicalMeaning",

        semanticStructurePath:
          "summary.contextContract.semanticStructure",

        referenceResolutionPath:
          "summary.contextContract.referenceResolution",

        requestInterpretationPath:
          "summary.contextContract.requestInterpretation",

        threadContextPath:
          "summary.contextContract.threadContext"
      },

      authority: {
        canAssembleContext:
          true,

        canValidateContext:
          true,

        canFreezeContext:
          true,

        canPreserveCanonicalMeaning:
          true,

        canPreserveSemanticStructure:
          true,

        canPreserveReferenceResolution:
          true,

        canPreserveRequestInterpretation:
          true,

        canExposeThreadContext:
          true,

        canExposeAdvisoryMemory:
          true,

        canInterpretRawLanguage:
          false,

        canGenerateSemanticNodes:
          false,

        canResolveReferences:
          false,

        canInterpretRequestedOperation:
          false,

        canSelectCanonicalMeaning:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChooseRoute:
          false,

        canChooseLane:
          false,

        canChoosePlanner:
          false,

        canDetermineSafetySeverity:
          false,

        canWriteFinalResponse:
          false,

        role:
          "immutable_canonical_context_handoff_only"
      }
    };
  },

  /* =====================================================
     RETURN PAYLOAD + COMPATIBILITY
  ===================================================== */

  buildReturnPayload(
    contextContract = {}
  ) {
    const active =
      contextContract
        .activeContext ||
      {};

    const advisory =
      contextContract
        .advisoryContext ||
      {};

    const semanticFrame =
      contextContract
        .canonicalMeaning ||
      null;

    return {
      contextAssemblerRan:
        true,

      contextAssemblerVersion:
        this.version,

      contextAssemblerSource:
        "ari-context-assembler",

      contextContract,

      canonicalContext:
        contextContract,

      immutableContextContract:
        contextContract,

      assembledContext:
        contextContract,

      advisoryContext:
        advisory,

      semanticStructure:
        contextContract
          .semanticStructure,

      resolvedSemanticStructure:
        contextContract
          .semanticStructure,

      referenceResolution:
        contextContract
          .referenceResolution,

      requestInterpretation:
        contextContract
          .requestInterpretation,

      canonicalMeaning:
        contextContract
          .canonicalMeaning,

      selectedCanonicalMeaning:
        contextContract
          .canonicalMeaning,

      threadContext:
        contextContract
          .threadContext,

      continuityContext:
        contextContract
          .continuity,

      activeContext:
        active,

      activeTopic:
        active.activeTopic ||
        null,

      activeSubject:
        active.activeSubject ||
        null,

      activeObject:
        active.activeObject ||
        null,

      activeIssue:
        active.activeIssue ||
        null,

      activeGoal:
        active.activeGoal ||
        null,

      activeQuestion:
        active.activeQuestion ||
        null,

      previousAnswer:
        active.previousAnswer ||
        null,

      activeEntities:
        active.activeEntities ||
        [],

      activeClaims:
        active.activeClaims ||
        [],

      activeEvents:
        active.activeEvents ||
        [],

      activeQuantities:
        active.activeQuantities ||
        [],

      activeRelations:
        active.activeRelations ||
        [],

      activeConstraints:
        active.constraints ||
        [],

      activeProblems:
        active.unresolvedItems ||
        [],

      activeGoals:
        active.activeGoal
          ? [
              active.activeGoal
            ]
          : [],

      unresolvedItems:
        active.unresolvedItems ||
        [],

      openLoops:
        active.openLoops ||
        [],

      recentTurns:
        active.recentTurns ||
        [],

      evidenceContract:
        contextContract.evidence,

      contextAmbiguity:
        contextContract.ambiguity,

      emotionalOverlay:
        contextContract
          .emotionalOverlay,

      actionPolicy:
        contextContract
          .actionPolicy,

      safetyContext:
        contextContract.safety,

      memoryContext:
        advisory.memory,

      relationshipProfile:
        advisory.relationship,

      characterIdentity:
        advisory.character,

      styleHints:
        advisory.styleHints ||
        {},

      projectContext:
        advisory.projectContext ||
        {},

      priorDecisions:
        advisory.priorDecisions ||
        [],

      relevantMemories:
        advisory.relevantMemories ||
        [],

      contextConflicts:
        advisory.conflicts ||
        [],

      // Temporary compatibility aliases.
      semanticFrame,

      activeSemanticFrame:
        semanticFrame,

      contextAuthority:
        "immutable_canonical_context_contract",

      contextContractReady:
        contextContract.ready ===
        true,

      requiresClarification:
        contextContract
          .ambiguity
          ?.requiresClarification ===
        true,

      executionAllowed:
        contextContract
          .actionPolicy
          ?.executionAllowed !==
        false,

      analysisOnly:
        contextContract
          .actionPolicy
          ?.analysisOnly ===
        true,

      confidence:
        contextContract
          .quality
          ?.confidence ||
        0,

      warnings:
        contextContract
          .quality
          ?.warnings ||
        [],

      authority:
        "immutable_canonical_context_handoff_only"
    };
  },

  /* =====================================================
     NORMALIZATION HELPERS
  ===================================================== */

  normalizeActionPolicy(
    policy = null
  ) {
    if (
      !policy ||
      typeof policy !==
        "object"
    ) {
      return {
        executionAllowed:
          true,

        analysisOnly:
          false,

        explicitExecutionProhibition:
          false,

        prohibitedOperations: [],

        deferredOperations: [],

        proposedOperation:
          null,

        resolvedOperation:
          null
      };
    }

    return {
      ...policy,

      executionAllowed:
        policy.executionAllowed !==
        false,

      analysisOnly:
        policy.analysisOnly ===
        true,

      explicitExecutionProhibition:
        policy
          .explicitExecutionProhibition ===
        true,

      prohibitedOperations:
        this.asArray(
          policy.prohibitedOperations
        ),

      deferredOperations:
        this.asArray(
          policy.deferredOperations
        ),

      proposedOperation:
        policy.proposedOperation ||
        null,

      resolvedOperation:
        policy.resolvedOperation ||
        null
    };
  },

  normalizeAmbiguity(
    ambiguity = null
  ) {
    if (
      !ambiguity ||
      typeof ambiguity !==
        "object"
    ) {
      return {
        present:
          false,

        resolved:
          true,

        requiresClarification:
          false,

        reasons: [],

        remainingAmbiguity: [],

        confidence:
          1
      };
    }

    return {
      ...ambiguity,

      present:
        ambiguity.present ===
          true ||
        ambiguity.ambiguous ===
          true,

      resolved:
        ambiguity.resolved ===
        true,

      requiresClarification:
        ambiguity
          .requiresClarification ===
        true,

      reasons:
        this.asArray(
          ambiguity.reasons
        ),

      remainingAmbiguity:
        this.asArray(
          ambiguity
            .remainingAmbiguity
        ),

      confidence:
        this.normalizeConfidence(
          ambiguity.confidence ??
          0
        )
    };
  },

  /* =====================================================
     IMMUTABILITY
  ===================================================== */

  deepFreeze(value, seen = new WeakSet()) {
    if (
      value === null ||
      typeof value !==
        "object"
    ) {
      return value;
    }

    if (seen.has(value)) {
      return value;
    }

    seen.add(value);

    Reflect.ownKeys(value)
      .forEach(key => {
        const child =
          value[key];

        if (
          child &&
          typeof child ===
            "object"
        ) {
          this.deepFreeze(
            child,
            seen
          );
        }
      });

    return Object.freeze(value);
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  firstObject(values = []) {
    return this.asArray(values)
      .find(
        value =>
          value &&
          typeof value ===
            "object"
      ) ||
      null;
  },

  traceObject(value = null) {
    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return null;
    }

    return {
      source:
        value.source ||
        null,

      version:
        value.version ||
        null,

      schema:
        value.schema ||
        null
    };
  },

  dedupeNodes(values = []) {
    const seen =
      new Set();

    return this.asArray(values)
      .filter(value => {
        if (
          value === null ||
          value === undefined
        ) {
          return false;
        }

        const key =
          [
            value?.id ||
              value?.semanticRef ||
              value?.entityRef ||
              "",

            value?.type ||
              value?.kind ||
              "",

            this.nodeLabel(value),

            value?.source ||
              ""
          ]
            .map(item =>
              this.normalize(item)
            )
            .join("|");

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      });
  },

  uniqueStrings(values = []) {
    const seen =
      new Set();

    return this.asArray(values)
      .map(value =>
        String(
          value ||
          ""
        ).trim()
      )
      .filter(value => {
        const key =
          this.normalize(value);

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      });
  },

  nodeLabel(value = null) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    return (
      value.label ||
      value.surface ||
      value.claim ||
      value.value ||
      value.name ||
      value.text ||
      value.evidence ||
      value.predicate ||
      value.action ||
      value.semanticRef ||
      value.entityRef ||
      ""
    );
  },

  asArray(value = []) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  normalizeConfidence(value = 0) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (number > 1) {
      return Math.max(
        0,
        Math.min(
          1,
          number /
          100
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

  normalize(value = "") {
    return String(
      value ??
      ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.contextAssembler =
  window.AriContextAssembler;

console.log(
  "ARI CONTEXT ASSEMBLER LOADED:",
  window.AriContextAssembler?.version
);