// ari/meaning/ari-semantic-hypothesis-engine.js
// Ari Semantic Hypothesis Engine
// Purpose: Generate defensible candidate meanings from canonical semantic structure,
// resolved references, and request interpretation.
// V1.0.0 — Multi-Hypothesis Meaning Generation / No Winner Selection / No Route Authority

window.Ari = window.Ari || {};

window.AriSemanticHypothesisEngine = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  generate(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const currentTurn =
      this.readCurrentTurn(summary);

    const semanticStructure =
      this.readSemanticStructure(summary);

    const requestInterpretation =
      this.readRequestInterpretation(summary);

    const threadContext =
      this.readThreadContext(summary);

    const referenceResolution =
      this.readReferenceResolution(summary);

    const evidence =
      this.buildEvidenceCatalog({
        currentTurn,
        semanticStructure,
        requestInterpretation,
        threadContext,
        referenceResolution
      });

    const hypothesisSeeds =
      this.buildHypothesisSeeds({
        currentTurn,
        semanticStructure,
        requestInterpretation,
        threadContext,
        referenceResolution,
        evidence
      });

    const expandedHypotheses =
      hypothesisSeeds.map(
        (seed, index) =>
          this.expandHypothesis({
            seed,
            index,
            currentTurn,
            semanticStructure,
            requestInterpretation,
            threadContext,
            referenceResolution,
            evidence
          })
      );

    const deduplicatedHypotheses =
      this.dedupeHypotheses(
        expandedHypotheses
      );

    const rankedForInspection =
      this.rankForInspection(
        deduplicatedHypotheses
      );

    const ambiguity =
      this.buildHypothesisAmbiguity({
        hypotheses:
          rankedForInspection,

        semanticStructure,
        requestInterpretation,
        referenceResolution
      });

    const quality =
      this.buildQualityReport({
        hypotheses:
          rankedForInspection,

        currentTurn,
        semanticStructure,
        requestInterpretation,
        ambiguity
      });

    const packet =
      this.buildHypothesisPacket({
        currentTurn,
        semanticStructure,
        requestInterpretation,
        threadContext,
        referenceResolution,
        evidence,
        hypotheses:
          rankedForInspection,
        ambiguity,
        quality
      });

    window.Ari.semanticHypotheses =
      packet;

    window.Ari.semanticHypothesisPacket =
      packet;

    return this.buildReturnPayload(
      packet
    );
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readCurrentTurn(summary = {}) {
    const resolvedTurn =
      summary.resolvedCurrentTurn ||
      summary.threadQuestionResolution
        ?.resolvedCurrentTurn ||
      window.Ari.resolvedCurrentTurn ||
      {};

    const rawText =
      this.cleanOriginal(
        resolvedTurn.rawText ||
        resolvedTurn.preservedText ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    return {
      turnId:
        resolvedTurn.turnId ||
        summary.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      rawText,

      normalizedText:
        this.normalize(
          resolvedTurn.normalizedText ||
          rawText
        ),

      preservedExactly:
        resolvedTurn.textWasRewritten !==
        true,

      isQuestion:
        this.isQuestion(rawText),

      wordCount:
        this.normalize(rawText)
          .split(/\s+/)
          .filter(Boolean)
          .length
    };
  },

  readSemanticStructure(summary = {}) {
    const candidates = [
      summary.resolvedSemanticStructure,

      summary.resolvedCurrentTurn
        ?.resolvedSemanticStructure,

      summary.semanticHandoff
        ?.semanticStructure,

      summary.referenceResolution
        ?.resolvedSemanticStructure,

      summary.currentSemanticStructure,

      summary.semanticStructure,

      window.Ari
        .resolvedSemanticStructure,

      window.Ari
        .semanticStructure
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_resolved_semantic_structure" ||
          candidate.schema ===
            "ari_semantic_structure" ||
          Array.isArray(
            candidate.entities
          ) ||
          Array.isArray(
            candidate.claims
          )
        )
      );

    if (!found) {
      return this.emptySemanticStructure();
    }

    return this.normalizeSemanticStructure(
      found
    );
  },

  readRequestInterpretation(
    summary = {}
  ) {
    const candidates = [
      summary.requestInterpretation,

      summary.currentRequestInterpretation,

      summary.requestInterpreterResult
        ?.requestInterpretation,

      window.Ari
        .requestInterpretation,

      window.Ari
        .currentRequestInterpretation
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_request_interpretation" ||
          candidate.requestedOperation ||
          candidate.primaryOperation
        )
      );

    if (found) {
      return {
        ...found,

        secondaryOperations:
          this.asArray(
            found.secondaryOperations
          ),

        operationCandidates:
          this.asArray(
            found.operationCandidates
          ),

        evidenceRefs:
          this.asArray(
            found.evidenceRefs
          )
      };
    }

    const operation =
      summary.requestedOperation ||
      summary.primaryRequestedOperation ||
      summary.primaryIntent ||
      "respond";

    return {
      schema:
        "ari_request_interpretation",

      version:
        null,

      source:
        "ari-semantic-hypothesis-engine-fallback",

      ran:
        false,

      requestedOperation:
        operation,

      proposedOperation:
        operation,

      primaryOperation: {
        operation,
        requestFamily:
          this.requestFamilyFromOperation(
            operation
          ),
        confidence:
          0.35,
        score:
          30,
        evidenceRefs: []
      },

      secondaryOperations: [],

      requestedOutput: {
        type:
          this.defaultOutputForOperation(
            operation
          ),
        confidence:
          0.35,
        evidence: [],
        alternatives: [],
        formatHints: {}
      },

      actionPolicy: {
        executionAllowed:
          true,
        analysisOnly:
          false,
        prohibitedOperations: [],
        deferredOperations: []
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

      evidenceRefs: []
    };
  },

  readThreadContext(summary = {}) {
    const candidates = [
      summary.threadContext,

      summary.threadUnderstanding
        ?.threadContext,

      summary.threadUnderstanding
        ?.workingContext,

      summary.threadWorkingContext,

      summary.continuityPacket
        ?.threadContext,

      summary.continuityPacket
        ?.activeThread,

      summary.threadState,

      window.Ari
        .threadContext,

      window.Ari
        .workingContext
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object"
      );

    if (!found) {
      return {
        schema:
          "ari_thread_context",

        source:
          "not_available",

        ran:
          false,

        activeTopic:
          null,

        activeSubject:
          null,

        activeObject:
          null,

        activeIssue:
          null,

        activeGoal:
          null,

        activeClaims: [],

        activeEntities: [],

        unresolvedItems: [],

        recentTurns: [],

        confidence:
          0
      };
    }

    return {
      ...found,

      activeClaims:
        this.asArray(
          found.activeClaims ||
          found.claims ||
          found.keyFacts
        ),

      activeEntities:
        this.asArray(
          found.activeEntities ||
          found.entities
        ),

      unresolvedItems:
        this.asArray(
          found.unresolvedItems ||
          found.unresolved
        ),

      recentTurns:
        this.asArray(
          found.recentTurns ||
          found.lastMessages ||
          found.timeline
        )
    };
  },

  readReferenceResolution(
    summary = {}
  ) {
    const candidates = [
      summary.referenceResolution,

      summary.entityReferenceState
        ?.referenceResolution,

      summary.entityReferenceState,

      summary.subjectGraphState,

      window.Ari
        .referenceResolution,

      window.Ari
        .entityReferenceState
    ];

    const found =
      candidates.find(candidate =>
        candidate &&
        typeof candidate === "object" &&
        (
          candidate.schema ===
            "ari_reference_resolution" ||
          Array.isArray(
            candidate.decisions
          ) ||
          Array.isArray(
            candidate.resolvedReferences
          )
        )
      );

    if (!found) {
      return {
        schema:
          "ari_reference_resolution",

        source:
          "not_available",

        ran:
          false,

        decisions: [],

        resolvedReferences: [],

        unresolvedReferences: [],

        confidence:
          0
      };
    }

    return {
      ...found,

      decisions:
        this.asArray(
          found.decisions
        ),

      resolvedReferences:
        this.asArray(
          found.resolvedReferences
        ),

      unresolvedReferences:
        this.asArray(
          found.unresolvedReferences
        )
    };
  },

  normalizeSemanticStructure(
    structure = {}
  ) {
    return {
      ...structure,

      entities:
        this.asArray(
          structure.entities
        ),

      participants:
        structure.participants ||
        {
          speaker: null,
          addressee: null,
          mentionedParticipants: []
        },

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
          structure.discourseSignals
        ),

      emotionalSignals:
        this.asArray(
          structure.emotionalSignals
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
        )
    };
  },

  emptySemanticStructure() {
    return this.normalizeSemanticStructure({
      schema:
        "ari_semantic_structure",

      version:
        null,

      source:
        "not_available",

      ran:
        false,

      entities: [],

      participants: {
        speaker: {
          entityRef:
            "user"
        },

        addressee: {
          entityRef:
            "assistant"
        },

        mentionedParticipants: []
      },

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
      evidenceRefs: []
    });
  },

  /* =====================================================
     EVIDENCE CATALOG
  ===================================================== */

  buildEvidenceCatalog({
    currentTurn = {},
    semanticStructure = {},
    requestInterpretation = {},
    threadContext = {},
    referenceResolution = {}
  } = {}) {
    const items = [];

    const add = ({
      type,
      value,
      source,
      confidence = 0.5,
      semanticRef = null,
      evidenceText = null,
      role = null
    }) => {
      const normalizedType =
        this.normalizeType(type);

      if (!normalizedType) {
        return;
      }

      items.push({
        id:
          this.createStableId(
            "meaning_evidence",
            [
              normalizedType,
              value,
              source,
              semanticRef,
              evidenceText
            ].join("|")
          ),

        type:
          normalizedType,

        value:
          value ?? null,

        source:
          source ||
          "unknown",

        confidence:
          this.normalizeConfidence(
            confidence
          ),

        semanticRef:
          semanticRef ||
          null,

        evidenceText:
          evidenceText ||
          null,

        role:
          role ||
          null
      });
    };

    add({
      type:
        "current_turn",

      value:
        currentTurn.rawText,

      source:
        "current_turn",

      confidence:
        currentTurn.rawText
          ? 1
          : 0,

      evidenceText:
        currentTurn.rawText
    });

    add({
      type:
        "requested_operation",

      value:
        requestInterpretation
          .requestedOperation,

      source:
        "ari-request-interpreter",

      confidence:
        requestInterpretation
          .primaryOperation
          ?.confidence ??
        requestInterpretation
          .confidence ??
        0.5,

      role:
        "operation"
    });

    this.asArray(
      requestInterpretation
        .secondaryOperations
    ).forEach(operation => {
      add({
        type:
          "secondary_operation",

        value:
          operation.operation ||
          operation,

        source:
          "ari-request-interpreter",

        confidence:
          operation.confidence ??
          0.45,

        semanticRef:
          operation.operation ||
          null,

        role:
          "operation"
      });
    });

    this.asArray(
      semanticStructure.entities
    ).forEach(entity => {
      add({
        type:
          "entity",

        value:
          this.nodeLabel(entity),

        source:
          entity.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          entity.confidence ??
          0.7,

        semanticRef:
          entity.id ||
          null,

        evidenceText:
          entity.surface ||
          entity.evidence ||
          null,

        role:
          entity.role ||
          entity.entityRole ||
          null
      });
    });

    this.asArray(
      semanticStructure.events
    ).forEach(event => {
      add({
        type:
          "event",

        value:
          this.nodeLabel(event),

        source:
          event.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          event.confidence ??
          0.7,

        semanticRef:
          event.id ||
          null,

        evidenceText:
          event.evidence ||
          event.surface ||
          null,

        role:
          event.role ||
          null
      });
    });

    this.asArray(
      semanticStructure.claims
    ).forEach(claim => {
      add({
        type:
          "claim",

        value:
          this.nodeLabel(claim),

        source:
          claim.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          claim.confidence ??
          0.72,

        semanticRef:
          claim.id ||
          null,

        evidenceText:
          claim.evidence ||
          claim.surface ||
          null,

        role:
          claim.claimType ||
          claim.role ||
          null
      });
    });

    this.asArray(
      semanticStructure.relations
    ).forEach(relation => {
      add({
        type:
          "relation",

        value:
          this.nodeLabel(relation),

        source:
          relation.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          relation.confidence ??
          0.7,

        semanticRef:
          relation.id ||
          null,

        evidenceText:
          relation.evidence ||
          null,

        role:
          relation.relationType ||
          relation.predicate ||
          null
      });
    });

    this.asArray(
      semanticStructure.quantities
    ).forEach(quantity => {
      add({
        type:
          "quantity",

        value:
          this.nodeLabel(quantity),

        source:
          quantity.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          quantity.confidence ??
          0.78,

        semanticRef:
          quantity.id ||
          null,

        evidenceText:
          quantity.evidence ||
          quantity.surface ||
          null,

        role:
          quantity.role ||
          null
      });
    });

    this.asArray(
      semanticStructure.options
    ).forEach(option => {
      add({
        type:
          "option",

        value:
          this.nodeLabel(option),

        source:
          option.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          option.confidence ??
          0.75,

        semanticRef:
          option.id ||
          null,

        evidenceText:
          option.evidence ||
          option.surface ||
          null,

        role:
          "option"
      });
    });

    this.asArray(
      semanticStructure.criteria
    ).forEach(criterion => {
      add({
        type:
          "criterion",

        value:
          this.nodeLabel(criterion),

        source:
          criterion.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          criterion.confidence ??
          0.7,

        semanticRef:
          criterion.id ||
          null,

        evidenceText:
          criterion.evidence ||
          null,

        role:
          "criterion"
      });
    });

    this.asArray(
      semanticStructure.constraints
    ).forEach(constraint => {
      add({
        type:
          "constraint",

        value:
          this.nodeLabel(constraint),

        source:
          constraint.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          constraint.confidence ??
          0.7,

        semanticRef:
          constraint.id ||
          null,

        evidenceText:
          constraint.evidence ||
          null,

        role:
          "constraint"
      });
    });

    this.asArray(
      semanticStructure.stakes
    ).forEach(stake => {
      add({
        type:
          "stake",

        value:
          this.nodeLabel(stake),

        source:
          stake.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          stake.confidence ??
          0.7,

        semanticRef:
          stake.id ||
          null,

        evidenceText:
          stake.evidence ||
          null,

        role:
          "stake"
      });
    });

    this.asArray(
      semanticStructure
        .emotionalSignals
    ).forEach(signal => {
      add({
        type:
          "emotion",

        value:
          this.nodeLabel(signal),

        source:
          signal.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          signal.confidence ??
          0.68,

        semanticRef:
          signal.id ||
          null,

        evidenceText:
          signal.evidence ||
          signal.surface ||
          null,

        role:
          signal.role ||
          "emotional_overlay"
      });
    });

    this.asArray(
      semanticStructure
        .discourseSignals
    ).forEach(signal => {
      add({
        type:
          "discourse_signal",

        value:
          this.nodeLabel(signal),

        source:
          signal.source ||
          semanticStructure.source ||
          "semantic_structure",

        confidence:
          signal.confidence ??
          0.68,

        semanticRef:
          signal.id ||
          null,

        evidenceText:
          signal.evidence ||
          signal.surface ||
          null,

        role:
          signal.role ||
          null
      });
    });

    this.asArray(
      referenceResolution
        .decisions
    ).forEach(decision => {
      add({
        type:
          decision.status ===
            "resolved"
            ? "resolved_reference"
            : decision.status ===
                "ambiguous"
              ? "ambiguous_reference"
              : "unresolved_reference",

        value:
          decision.resolvedTo ||
          decision.referenceId ||
          decision.reference ||
          null,

        source:
          "ari-entity-reference-resolver",

        confidence:
          decision.confidence ??
          0.5,

        semanticRef:
          decision.referenceId ||
          null,

        evidenceText:
          decision.surface ||
          decision.reference ||
          null,

        role:
          "reference_resolution"
      });
    });

    if (
      threadContext.activeTopic
    ) {
      add({
        type:
          "thread_topic",

        value:
          this.nodeLabel(
            threadContext.activeTopic
          ),

        source:
          threadContext.source ||
          "thread_context",

        confidence:
          threadContext.confidence ??
          0.6,

        role:
          "context"
      });
    }

    if (
      threadContext.activeIssue
    ) {
      add({
        type:
          "thread_issue",

        value:
          this.nodeLabel(
            threadContext.activeIssue
          ),

        source:
          threadContext.source ||
          "thread_context",

        confidence:
          threadContext.confidence ??
          0.6,

        role:
          "context"
      });
    }

    return {
      schema:
        "ari_meaning_evidence_catalog",

      version:
        this.schemaVersion,

      source:
        "ari-semantic-hypothesis-engine",

      count:
        items.length,

      items:
        this.dedupeEvidence(
          items
        ),

      byType:
        this.groupBy(
          items,
          "type"
        )
    };
  },

  /* =====================================================
     HYPOTHESIS SEEDS
  ===================================================== */

  buildHypothesisSeeds({
    currentTurn = {},
    semanticStructure = {},
    requestInterpretation = {},
    threadContext = {},
    referenceResolution = {},
    evidence = {}
  } = {}) {
    const seeds = [];

    const primaryOperation =
      requestInterpretation
        .requestedOperation ||
      requestInterpretation
        .primaryOperation
        ?.operation ||
      "respond";

    seeds.push({
      seedType:
        "primary_request",

      operation:
        primaryOperation,

      origin:
        "request_interpretation",

      confidence:
        requestInterpretation
          .primaryOperation
          ?.confidence ??
        requestInterpretation
          .confidence ??
        0.5,

      evidenceRefs:
        this.asArray(
          requestInterpretation
            .primaryOperation
            ?.evidenceRefs
        )
    });

    this.asArray(
      requestInterpretation
        .secondaryOperations
    ).forEach(operation => {
      const operationName =
        operation.operation ||
        operation;

      if (!operationName) {
        return;
      }

      seeds.push({
        seedType:
          "secondary_request",

        operation:
          operationName,

        origin:
          "request_interpretation",

        confidence:
          operation.confidence ??
          0.45,

        evidenceRefs:
          this.asArray(
            operation.evidenceRefs
          )
      });
    });

    this.operationHypothesesFromStructure({
      semanticStructure,
      currentTurn
    }).forEach(seed =>
      seeds.push(seed)
    );

    this.contextualHypotheses({
      currentTurn,
      semanticStructure,
      threadContext,
      referenceResolution
    }).forEach(seed =>
      seeds.push(seed)
    );

    this.emotionalHypotheses({
      semanticStructure,
      primaryOperation
    }).forEach(seed =>
      seeds.push(seed)
    );

    if (!seeds.length) {
      seeds.push({
        seedType:
          "fallback",

        operation:
          currentTurn.isQuestion
            ? "provide_information"
            : "respond",

        origin:
          "fallback",

        confidence:
          0.35,

        evidenceRefs: []
      });
    }

    return this.dedupeSeeds(
      seeds
    );
  },

  operationHypothesesFromStructure({
    semanticStructure = {},
    currentTurn = {}
  } = {}) {
    const seeds = [];
    const text =
      currentTurn.normalizedText ||
      "";

    if (
      this.asArray(
        semanticStructure.options
      ).length >= 2
    ) {
      seeds.push({
        seedType:
          "structure_supported",

        operation:
          /\b(?:which|choose|should|recommend|best)\b/.test(
            text
          )
            ? "recommend"
            : "compare",

        origin:
          "semantic_structure",

        confidence:
          0.72,

        evidenceRefs:
          this.nodeIds(
            semanticStructure.options
          )
      });
    }

    if (
      this.asArray(
        semanticStructure.quantities
      ).length > 0
    ) {
      if (
        /\b(?:how big|how large|compare|equivalent|like what)\b/.test(
          text
        )
      ) {
        seeds.push({
          seedType:
            "structure_supported",

          operation:
            "compare",

          origin:
            "semantic_structure",

          confidence:
            0.8,

          evidenceRefs:
            this.nodeIds(
              semanticStructure
                .quantities
            )
        });
      } else if (
        /\b(?:calculate|convert|how many|how much)\b/.test(
          text
        )
      ) {
        seeds.push({
          seedType:
            "structure_supported",

          operation:
            /\bconvert\b/.test(
              text
            )
              ? "convert"
              : "calculate",

          origin:
            "semantic_structure",

          confidence:
            0.75,

          evidenceRefs:
            this.nodeIds(
              semanticStructure
                .quantities
            )
        });
      }
    }

    if (
      this.asArray(
        semanticStructure.negations
      ).length > 0
    ) {
      seeds.push({
        seedType:
          "negation_sensitive",

        operation:
          "interpret_or_correct",

        origin:
          "semantic_structure",

        confidence:
          0.58,

        evidenceRefs:
          this.nodeIds(
            semanticStructure.negations
          )
      });
    }

    return seeds;
  },

  contextualHypotheses({
    currentTurn = {},
    semanticStructure = {},
    threadContext = {},
    referenceResolution = {}
  } = {}) {
    const seeds = [];

    const inheritedCount =
      this.asArray(
        semanticStructure.inheritedNodes
      ).length;

    const resolvedReferenceCount =
      this.asArray(
        referenceResolution.decisions
      ).filter(decision =>
        decision.status ===
        "resolved"
      ).length;

    const unresolvedReferenceCount =
      this.asArray(
        referenceResolution.decisions
      ).filter(decision =>
        decision.status !==
        "resolved"
      ).length;

    if (
      inheritedCount > 0 ||
      resolvedReferenceCount > 0
    ) {
      seeds.push({
        seedType:
          "contextual_follow_up",

        operation:
          "continue_context",

        origin:
          "reference_resolution",

        confidence:
          unresolvedReferenceCount
            ? 0.55
            : 0.72,

        evidenceRefs: [
          ...this.nodeIds(
            semanticStructure
              .inheritedNodes
          ),

          ...this.asArray(
            referenceResolution.decisions
          )
            .map(decision =>
              decision.referenceId
            )
            .filter(Boolean)
        ]
      });
    }

    if (
      currentTurn.wordCount <= 8 &&
      threadContext.activeIssue &&
      !currentTurn.isQuestion
    ) {
      seeds.push({
        seedType:
          "contextual_statement",

        operation:
          "continue_context",

        origin:
          "thread_context",

        confidence:
          0.5,

        evidenceRefs: []
      });
    }

    return seeds;
  },

  emotionalHypotheses({
    semanticStructure = {},
    primaryOperation = ""
  } = {}) {
    const emotions =
      this.asArray(
        semanticStructure
          .emotionalSignals
      );

    if (!emotions.length) {
      return [];
    }

    const explicitSupport =
      primaryOperation ===
      "provide_emotional_support";

    return [
      {
        seedType:
          explicitSupport
            ? "primary_emotional_request"
            : "emotional_overlay",

        operation:
          "provide_emotional_support",

        origin:
          "emotional_structure",

        confidence:
          explicitSupport
            ? 0.82
            : 0.48,

        evidenceRefs:
          this.nodeIds(
            emotions
          ),

        overlayOnly:
          !explicitSupport
      }
    ];
  },

  /* =====================================================
     HYPOTHESIS EXPANSION
  ===================================================== */

  expandHypothesis({
    seed = {},
    index = 0,
    currentTurn = {},
    semanticStructure = {},
    requestInterpretation = {},
    threadContext = {},
    referenceResolution = {},
    evidence = {}
  } = {}) {
    const operation =
      this.normalizeOperation(
        seed.operation
      ) ||
      "respond";

    const subject =
      this.resolveSubject({
        semanticStructure,
        currentTurn
      });

    const target =
      this.resolveTarget({
        operation,
        semanticStructure,
        requestInterpretation,
        threadContext
      });

    const object =
      this.resolveObject({
        operation,
        semanticStructure,
        target,
        threadContext
      });

    const domain =
      this.resolveDomain({
        operation,
        semanticStructure,
        object,
        threadContext
      });

    const supportingEvidence =
      this.collectSupportingEvidence({
        seed,
        operation,
        subject,
        target,
        object,
        domain,
        evidence
      });

    const contradictingEvidence =
      this.collectContradictingEvidence({
        operation,
        requestInterpretation,
        referenceResolution,
        semanticStructure
      });

    const continuity =
      this.buildContinuityMeaning({
        semanticStructure,
        threadContext,
        referenceResolution
      });

    const emotionalOverlay =
      this.buildEmotionalOverlay(
        semanticStructure
      );

    const slots =
      this.buildHypothesisSlots({
        subject,
        target,
        object,
        semanticStructure
      });

    const completeness =
      this.calculateCompleteness({
        operation,
        slots
      });

    const score =
      this.calculateHypothesisScore({
        seed,
        operation,
        supportingEvidence,
        contradictingEvidence,
        completeness,
        continuity,
        requestInterpretation
      });

    return {
      hypothesisId:
        this.createStableId(
          "meaning_hypothesis",
          [
            currentTurn.turnId,
            operation,
            this.nodeLabel(object),
            index
          ].join("|")
        ),

      schema:
        "ari_semantic_hypothesis",

      version:
        this.schemaVersion,

      source:
        "ari-semantic-hypothesis-engine",

      seedType:
        seed.seedType ||
        "unknown",

      origin:
        seed.origin ||
        "inferred",

      operation,

      requestFamily:
        this.requestFamilyFromOperation(
          operation
        ),

      requestedOutput:
        this.resolveHypothesisOutput({
          operation,
          requestInterpretation
        }),

      subject,

      target,

      object,

      slots,

      domain,

      continuity,

      emotionalOverlay,

      actionPolicy:
        requestInterpretation
          .actionPolicy ||
        {
          executionAllowed:
            true,

          analysisOnly:
            false,

          prohibitedOperations: [],

          deferredOperations: []
        },

      overlayOnly:
        seed.overlayOnly ===
        true,

      completeness,

      supportingEvidence,

      contradictingEvidence,

      score,

      confidence:
        this.normalizeConfidence(
          score /
          100
        ),

      assumptions:
        this.buildAssumptions({
          subject,
          target,
          object,
          continuity,
          semanticStructure
        }),

      unresolved:
        this.buildUnresolvedItems({
          operation,
          slots,
          semanticStructure,
          referenceResolution
        }),

      evidenceRefs: [
        ...new Set([
          ...this.asArray(
            seed.evidenceRefs
          ),

          ...supportingEvidence
            .map(item =>
              item.id
            )
            .filter(Boolean),

          ...this.nodeIds([
            subject,
            target,
            object
          ])
        ])
      ],

      authority: {
        canRepresentCandidateMeaning:
          true,

        canScoreCandidateMeaning:
          true,

        canSelectCanonicalMeaning:
          false,

        canChooseSemanticFrame:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canAnswerUser:
          false,

        role:
          "candidate_semantic_meaning_only"
      }
    };
  },

  resolveSubject({
    semanticStructure = {},
    currentTurn = {}
  } = {}) {
    const participants =
      semanticStructure.participants ||
      {};

    const speaker =
      participants.speaker ||
      null;

    if (speaker) {
      return this.normalizeNode(
        speaker,
        {
          fallbackType:
            "participant",

          fallbackValue:
            "user",

          confidence:
            0.9
        }
      );
    }

    const subjectRelation =
      this.asArray(
        semanticStructure.relations
      ).find(relation =>
        [
          "subject",
          "agent",
          "speaker"
        ].includes(
          this.normalize(
            relation.relationType ||
            relation.predicate ||
            relation.role ||
            ""
          )
        )
      );

    if (subjectRelation) {
      return this.normalizeNode(
        subjectRelation.sourceEntity ||
        subjectRelation.subject ||
        subjectRelation.from ||
        {
          value:
            "user"
        },
        {
          fallbackType:
            "participant",

          fallbackValue:
            "user",

          confidence:
            subjectRelation.confidence ??
            0.75
        }
      );
    }

    return {
      id:
        "entity_user",

      type:
        "participant",

      value:
        "user",

      label:
        "user",

      origin:
        currentTurn.rawText
          ? "implicit_speaker"
          : "fallback",

      confidence:
        0.82,

      evidenceRefs: []
    };
  },

  resolveTarget({
    operation = "",
    semanticStructure = {},
    requestInterpretation = {},
    threadContext = {}
  } = {}) {
    const mentionedParticipants =
      this.asArray(
        semanticStructure
          .participants
          ?.mentionedParticipants
      );

    if (
      operation ===
        "provide_opinion" ||
      operation ===
        "answer_identity_question"
    ) {
      return {
        id:
          "entity_assistant",

        type:
          "participant",

        value:
          "assistant",

        label:
          "Ari",

        origin:
          "operation_target",

        confidence:
          0.88,

        evidenceRefs: []
      };
    }

    const explicitTarget =
      this.asArray(
        semanticStructure.relations
      ).find(relation =>
        [
          "target",
          "patient",
          "recipient",
          "about"
        ].includes(
          this.normalize(
            relation.relationType ||
            relation.predicate ||
            relation.role ||
            ""
          )
        )
      );

    if (explicitTarget) {
      return this.normalizeNode(
        explicitTarget.targetEntity ||
        explicitTarget.object ||
        explicitTarget.to ||
        explicitTarget,
        {
          fallbackType:
            "target",

          confidence:
            explicitTarget.confidence ??
            0.75
        }
      );
    }

    const salientEntity =
      this.selectSalientEntity(
        semanticStructure.entities
      );

    if (salientEntity) {
      return this.normalizeNode(
        salientEntity,
        {
          fallbackType:
            "entity",

          confidence:
            salientEntity.confidence ??
            0.7
        }
      );
    }

    if (
      threadContext.activeObject
    ) {
      return this.normalizeNode(
        threadContext.activeObject,
        {
          fallbackType:
            "thread_object",

          confidence:
            threadContext.confidence ??
            0.55,

          origin:
            "inherited"
        }
      );
    }

    if (
      mentionedParticipants.length
    ) {
      return this.normalizeNode(
        mentionedParticipants[0],
        {
          fallbackType:
            "participant",

          confidence:
            0.6
        }
      );
    }

    return {
      id:
        null,

      type:
        "unknown",

      value:
        null,

      label:
        null,

      origin:
        "unknown",

      confidence:
        0,

      evidenceRefs: []
    };
  },

  resolveObject({
    operation = "",
    semanticStructure = {},
    target = {},
    threadContext = {}
  } = {}) {
    const quantity =
      this.asArray(
        semanticStructure.quantities
      )[0];

    if (
      [
        "calculate",
        "convert",
        "compare"
      ].includes(operation) &&
      quantity
    ) {
      return this.normalizeNode(
        quantity,
        {
          fallbackType:
            "quantity",

          confidence:
            quantity.confidence ??
            0.82
        }
      );
    }

    const primaryClaim =
      this.selectPrimaryClaim(
        semanticStructure.claims
      );

    if (primaryClaim) {
      return this.normalizeNode(
        primaryClaim,
        {
          fallbackType:
            "claim",

          confidence:
            primaryClaim.confidence ??
            0.74
        }
      );
    }

    const primaryEvent =
      this.selectPrimaryEvent(
        semanticStructure.events
      );

    if (primaryEvent) {
      return this.normalizeNode(
        primaryEvent,
        {
          fallbackType:
            "event",

          confidence:
            primaryEvent.confidence ??
            0.72
        }
      );
    }

    if (
      target?.value
    ) {
      return {
        ...target,

        type:
          target.type ||
          "entity"
      };
    }

    if (
      threadContext.activeIssue
    ) {
      return this.normalizeNode(
        threadContext.activeIssue,
        {
          fallbackType:
            "thread_issue",

          confidence:
            threadContext.confidence ??
            0.55,

          origin:
            "inherited"
        }
      );
    }

    return {
      id:
        null,

      type:
        "unknown",

      value:
        null,

      label:
        null,

      origin:
        "unknown",

      confidence:
        0,

      evidenceRefs: []
    };
  },

  buildHypothesisSlots({
    subject = {},
    target = {},
    object = {},
    semanticStructure = {}
  } = {}) {
    return {
      subject,

      target,

      object,

      entities:
        this.asArray(
          semanticStructure.entities
        ),

      events:
        this.asArray(
          semanticStructure.events
        ),

      claims:
        this.asArray(
          semanticStructure.claims
        ),

      attributes:
        this.asArray(
          semanticStructure.attributes
        ),

      quantities:
        this.asArray(
          semanticStructure.quantities
        ),

      relations:
        this.asArray(
          semanticStructure.relations
        ),

      options:
        this.asArray(
          semanticStructure.options
        ),

      criteria:
        this.asArray(
          semanticStructure.criteria
        ),

      constraints:
        this.asArray(
          semanticStructure.constraints
        ),

      stakes:
        this.asArray(
          semanticStructure.stakes
        ),

      negations:
        this.asArray(
          semanticStructure.negations
        )
    };
  },

  resolveDomain({
    operation = "",
    semanticStructure = {},
    object = {},
    threadContext = {}
  } = {}) {
    const scores =
      new Map();

    const add = (
      domain,
      score
    ) => {
      const normalized =
        this.normalizeDomain(
          domain
        );

      if (!normalized) {
        return;
      }

      scores.set(
        normalized,
        Number(
          scores.get(normalized) ||
          0
        ) +
        Number(score || 0)
      );
    };

    this.asArray(
      semanticStructure.entities
    ).forEach(entity => {
      if (entity.domain) {
        add(
          entity.domain,
          18
        );
      }

      this.inferDomainsFromText(
        this.nodeLabel(entity)
      ).forEach(domain =>
        add(domain, 12)
      );
    });

    this.asArray(
      semanticStructure.claims
    ).forEach(claim => {
      if (claim.domain) {
        add(
          claim.domain,
          20
        );
      }

      this.inferDomainsFromText(
        this.nodeLabel(claim)
      ).forEach(domain =>
        add(domain, 10)
      );
    });

    this.asArray(
      semanticStructure.events
    ).forEach(event => {
      if (event.domain) {
        add(
          event.domain,
          18
        );
      }

      this.inferDomainsFromText(
        this.nodeLabel(event)
      ).forEach(domain =>
        add(domain, 9)
      );
    });

    if (
      threadContext.activeTopic
    ) {
      this.inferDomainsFromText(
        this.nodeLabel(
          threadContext.activeTopic
        )
      ).forEach(domain =>
        add(domain, 8)
      );
    }

    this.inferDomainsFromText(
      this.nodeLabel(object)
    ).forEach(domain =>
      add(domain, 14)
    );

    const operationDomain =
      this.domainFromOperation(
        operation
      );

    if (operationDomain) {
      add(
        operationDomain,
        7
      );
    }

    const ranked =
      [...scores.entries()]
        .sort(
          (
            left,
            right
          ) =>
            right[1] -
            left[1]
        );

    return {
      primary:
        ranked[0]?.[0] ||
        "general_understanding",

      secondary:
        ranked
          .slice(1, 5)
          .map(
            ([domain]) =>
              domain
          ),

      scores:
        Object.fromEntries(
          ranked
        ),

      confidence:
        ranked.length
          ? this.normalizeConfidence(
              Math.min(
                1,
                ranked[0][1] /
                60
              )
            )
          : 0.35
    };
  },

  inferDomainsFromText(
    value = ""
  ) {
    const text =
      this.normalize(value);

    const domains = [];

    const rules = [
      [
        "medical",
        /\b(?:pain|symptom|pregnant|pregnancy|fever|bleeding|medication|health|doctor|hospital|nurse|body|diagnosis)\b/
      ],

      [
        "project",
        /\b(?:code|file|javascript|html|css|engine|pipeline|architecture|function|supabase|github|vercel|software|app)\b/
      ],

      [
        "finance",
        /\b(?:money|payment|loan|credit|debt|rent|budget|price|cost|salary|finance)\b/
      ],

      [
        "relationship",
        /\b(?:wife|husband|partner|friend|relationship|marriage|spouse)\b/
      ],

      [
        "family",
        /\b(?:child|baby|father|mother|dad|mom|family|daughter|son)\b/
      ],

      [
        "vehicle",
        /\b(?:car|vehicle|truck|suv|oil leak|engine)\b/
      ],

      [
        "identity",
        /\b(?:belief|believe|identity|values|opinion|who are you)\b/
      ],

      [
        "emotion",
        /\b(?:sad|angry|upset|scared|frustrated|overwhelmed|happy|emotion)\b/
      ],

      [
        "calculation",
        /\b(?:percent|gallon|liter|mile|kilometer|quantity|number|total)\b/
      ]
    ];

    rules.forEach(
      ([
        domain,
        pattern
      ]) => {
        if (
          pattern.test(text)
        ) {
          domains.push(domain);
        }
      }
    );

    return domains;
  },

  buildContinuityMeaning({
    semanticStructure = {},
    threadContext = {},
    referenceResolution = {}
  } = {}) {
    const inheritedNodes =
      this.asArray(
        semanticStructure.inheritedNodes
      );

    const referenceDecisions =
      this.asArray(
        referenceResolution.decisions
      );

    const resolvedReferences =
      referenceDecisions.filter(
        decision =>
          decision.status ===
          "resolved"
      );

    const unresolvedReferences =
      referenceDecisions.filter(
        decision =>
          decision.status !==
          "resolved"
      );

    const usesPriorContext =
      inheritedNodes.length > 0 ||
      resolvedReferences.some(
        decision =>
          Number(
            decision.turnDistance ||
            decision.resolvedTurnDistance ||
            0
          ) > 0
      );

    return {
      usesPriorContext,

      inheritedNodeCount:
        inheritedNodes.length,

      resolvedReferenceCount:
        resolvedReferences.length,

      unresolvedReferenceCount:
        unresolvedReferences.length,

      activeTopic:
        threadContext.activeTopic ||
        threadContext.currentTopic ||
        null,

      activeIssue:
        threadContext.activeIssue ||
        null,

      priorContextConfidence:
        threadContext.confidence ??
        referenceResolution.confidence ??
        0,

      inheritedNodes,

      referenceDecisions,

      confidence:
        this.normalizeConfidence(
          (
            inheritedNodes.length
              ? 0.45
              : 0
          ) +
          (
            resolvedReferences.length
              ? 0.4
              : 0
          ) +
          (
            unresolvedReferences.length
              ? -0.18
              : 0.1
          )
        )
    };
  },

  buildEmotionalOverlay(
    semanticStructure = {}
  ) {
    const signals =
      this.asArray(
        semanticStructure
          .emotionalSignals
      );

    return {
      present:
        signals.length > 0,

      signals,

      states:
        signals
          .map(signal =>
            this.nodeLabel(signal)
          )
          .filter(Boolean),

      primaryState:
        signals.length
          ? this.nodeLabel(
              signals
                .slice()
                .sort(
                  (
                    left,
                    right
                  ) =>
                    Number(
                      right.confidence ||
                      0
                    ) -
                    Number(
                      left.confidence ||
                      0
                    )
                )[0]
            )
          : null,

      explicitSupportRequested:
        false,

      role:
        "context_modifier",

      confidence:
        signals.length
          ? this.averageConfidence(
              signals,
              0.65
            )
          : 0
    };
  },

  /* =====================================================
     EVIDENCE SUPPORT
  ===================================================== */

  collectSupportingEvidence({
    seed = {},
    operation = "",
    subject = {},
    target = {},
    object = {},
    domain = {},
    evidence = {}
  } = {}) {
    const items =
      this.asArray(
        evidence.items
      );

    return items.filter(item => {
      if (
        this.asArray(
          seed.evidenceRefs
        ).includes(
          item.semanticRef
        ) ||
        this.asArray(
          seed.evidenceRefs
        ).includes(
          item.id
        )
      ) {
        return true;
      }

      if (
        item.type ===
          "requested_operation" &&
        this.normalizeOperation(
          item.value
        ) ===
          operation
      ) {
        return true;
      }

      if (
        item.type ===
          "secondary_operation" &&
        this.normalizeOperation(
          item.value
        ) ===
          operation
      ) {
        return true;
      }

      if (
        item.semanticRef &&
        [
          subject.id,
          target.id,
          object.id
        ].includes(
          item.semanticRef
        )
      ) {
        return true;
      }

      if (
        item.type ===
          "quantity" &&
        [
          "calculate",
          "convert",
          "compare"
        ].includes(operation)
      ) {
        return true;
      }

      if (
        item.type ===
          "option" &&
        [
          "compare",
          "recommend",
          "prioritize",
          "evaluate"
        ].includes(operation)
      ) {
        return true;
      }

      if (
        item.type ===
          "emotion" &&
        operation ===
          "provide_emotional_support"
      ) {
        return true;
      }

      if (
        item.type ===
          "thread_topic" &&
        domain.primary &&
        this.inferDomainsFromText(
          item.value
        ).includes(
          domain.primary
        )
      ) {
        return true;
      }

      return false;
    });
  },

  collectContradictingEvidence({
    operation = "",
    requestInterpretation = {},
    referenceResolution = {},
    semanticStructure = {}
  } = {}) {
    const contradictions = [];

    const proposedOperation =
      this.normalizeOperation(
        requestInterpretation
          .proposedOperation
      );

    const resolvedOperation =
      this.normalizeOperation(
        requestInterpretation
          .requestedOperation
      );

    if (
      proposedOperation &&
      resolvedOperation &&
      proposedOperation !==
        resolvedOperation &&
      operation ===
        proposedOperation
    ) {
      contradictions.push({
        type:
          "action_policy_conflict",

        value:
          `Operation ${proposedOperation} was replaced by ${resolvedOperation}.`,

        confidence:
          0.9,

        source:
          "ari-request-interpreter"
      });
    }

    if (
      requestInterpretation
        .actionPolicy
        ?.prohibitedOperations
        ?.includes(operation)
    ) {
      contradictions.push({
        type:
          "prohibited_operation",

        value:
          operation,

        confidence:
          1,

        source:
          "ari-request-interpreter"
      });
    }

    const unresolvedReferences =
      this.asArray(
        referenceResolution.decisions
      ).filter(decision =>
        decision.status !==
        "resolved"
      );

    if (
      unresolvedReferences.length
    ) {
      contradictions.push({
        type:
          "unresolved_reference",

        value:
          unresolvedReferences.map(
            decision =>
              decision.referenceId ||
              decision.reference
          ),

        confidence:
          0.75,

        source:
          "ari-entity-reference-resolver"
      });
    }

    if (
      this.asArray(
        semanticStructure.unresolved
      ).length
    ) {
      contradictions.push({
        type:
          "unresolved_semantic_items",

        value:
          this.asArray(
            semanticStructure.unresolved
          ),

        confidence:
          0.65,

        source:
          semanticStructure.source ||
          "semantic_structure"
      });
    }

    return contradictions;
  },

  /* =====================================================
     SCORING
  ===================================================== */

  calculateHypothesisScore({
    seed = {},
    operation = "",
    supportingEvidence = [],
    contradictingEvidence = [],
    completeness = {},
    continuity = {},
    requestInterpretation = {}
  } = {}) {
    let score =
      this.normalizeConfidence(
        seed.confidence
      ) *
      42;

    const requestOperation =
      this.normalizeOperation(
        requestInterpretation
          .requestedOperation
      );

    if (
      operation ===
      requestOperation
    ) {
      score += 25;
    }

    const supportScore =
      supportingEvidence.reduce(
        (
          total,
          item
        ) =>
          total +
          this.normalizeConfidence(
            item.confidence
          ) *
          4,
        0
      );

    score += Math.min(
      18,
      supportScore
    );

    score +=
      this.normalizeConfidence(
        completeness.score
      ) *
      10;

    if (
      continuity.usesPriorContext &&
      continuity.unresolvedReferenceCount ===
      0
    ) {
      score += 4;
    }

    const contradictionPenalty =
      contradictingEvidence.reduce(
        (
          total,
          item
        ) =>
          total +
          this.normalizeConfidence(
            item.confidence
          ) *
          10,
        0
      );

    score -= Math.min(
      35,
      contradictionPenalty
    );

    if (
      seed.overlayOnly ===
      true
    ) {
      score -= 12;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Number(
          score.toFixed(2)
        )
      )
    );
  },

  calculateCompleteness({
    operation = "",
    slots = {}
  } = {}) {
    const required =
      this.requiredSlotsForOperation(
        operation
      );

    const present =
      required.filter(slot =>
        this.slotPresent(
          slots[slot]
        )
      );

    const missing =
      required.filter(slot =>
        !this.slotPresent(
          slots[slot]
        )
      );

    return {
      required,

      present,

      missing,

      score:
        required.length
          ? this.normalizeConfidence(
              present.length /
              required.length
            )
          : 1
    };
  },

  requiredSlotsForOperation(
    operation = ""
  ) {
    const normalized =
      this.normalizeOperation(
        operation
      );

    if (
      [
        "compare",
        "recommend",
        "prioritize",
        "evaluate"
      ].includes(normalized)
    ) {
      return [
        "object"
      ];
    }

    if (
      [
        "calculate",
        "convert"
      ].includes(normalized)
    ) {
      return [
        "quantities"
      ];
    }

    if (
      [
        "modify_artifact",
        "implement",
        "inspect",
        "debug"
      ].includes(normalized)
    ) {
      return [
        "object"
      ];
    }

    if (
      [
        "provide_information",
        "explain",
        "verify",
        "summarize",
        "translate"
      ].includes(normalized)
    ) {
      return [
        "object"
      ];
    }

    return [];
  },

  /* =====================================================
     HYPOTHESIS OUTPUTS
  ===================================================== */

  resolveHypothesisOutput({
    operation = "",
    requestInterpretation = {}
  } = {}) {
    const requestedOutput =
      requestInterpretation
        .requestedOutput ||
      {};

    const requestedType =
      typeof requestedOutput ===
        "string"
        ? requestedOutput
        : requestedOutput.type;

    const primaryOperation =
      this.normalizeOperation(
        requestInterpretation
          .requestedOperation
      );

    if (
      operation ===
        primaryOperation &&
      requestedType
    ) {
      return {
        type:
          requestedType,

        confidence:
          requestedOutput.confidence ??
          0.75,

        origin:
          "request_interpretation"
      };
    }

    return {
      type:
        this.defaultOutputForOperation(
          operation
        ),

      confidence:
        0.55,

      origin:
        "operation_default"
    };
  },

  buildAssumptions({
    subject = {},
    target = {},
    object = {},
    continuity = {},
    semanticStructure = {}
  } = {}) {
    const assumptions = [];

    if (
      subject.origin ===
      "implicit_speaker"
    ) {
      assumptions.push({
        type:
          "implicit_subject",

        value:
          "The user is the grammatical or conversational subject.",

        confidence:
          subject.confidence
      });
    }

    if (
      target.origin ===
      "inherited"
    ) {
      assumptions.push({
        type:
          "inherited_target",

        value:
          this.nodeLabel(target),

        confidence:
          target.confidence
      });
    }

    if (
      object.origin ===
      "inherited"
    ) {
      assumptions.push({
        type:
          "inherited_object",

        value:
          this.nodeLabel(object),

        confidence:
          object.confidence
      });
    }

    if (
      continuity.usesPriorContext
    ) {
      assumptions.push({
        type:
          "context_reuse",

        value:
          "The current turn depends on resolved prior conversational context.",

        confidence:
          continuity.confidence
      });
    }

    if (
      semanticStructure.ran ===
      false
    ) {
      assumptions.push({
        type:
          "missing_semantic_structure",

        value:
          "Meaning was generated without a canonical semantic structure.",

        confidence:
          0.3
      });
    }

    return assumptions;
  },

  buildUnresolvedItems({
    operation = "",
    slots = {},
    semanticStructure = {},
    referenceResolution = {}
  } = {}) {
    const unresolved = [];

    const completeness =
      this.calculateCompleteness({
        operation,
        slots
      });

    completeness.missing.forEach(
      slot => {
        unresolved.push({
          type:
            "missing_slot",

          slot,

          value:
            slot,

          confidence:
            0.8
        });
      }
    );

    this.asArray(
      semanticStructure.unresolved
    ).forEach(item => {
      unresolved.push({
        type:
          item.type ||
          "semantic_unresolved",

        value:
          this.nodeLabel(item),

        confidence:
          item.confidence ??
          0.6,

        raw:
          item
      });
    });

    this.asArray(
      referenceResolution.decisions
    )
      .filter(decision =>
        decision.status !==
        "resolved"
      )
      .forEach(decision => {
        unresolved.push({
          type:
            decision.status ===
            "ambiguous"
            ? "ambiguous_reference"
            : "unresolved_reference",

          value:
            decision.referenceId ||
            decision.reference ||
            null,

          confidence:
            decision.confidence ??
            0.5,

          raw:
            decision
        });
      });

    return unresolved;
  },

  /* =====================================================
     DEDUPLICATION + INSPECTION ORDER
  ===================================================== */

  dedupeSeeds(
    seeds = []
  ) {
    const seen =
      new Map();

    this.asArray(
      seeds
    ).forEach(seed => {
      const key =
        [
          this.normalizeOperation(
            seed.operation
          ),
          seed.seedType,
          seed.overlayOnly ===
          true
            ? "overlay"
            : "primary"
        ].join("|");

      if (
        !seen.has(key)
      ) {
        seen.set(
          key,
          {
            ...seed,
            evidenceRefs:
              this.asArray(
                seed.evidenceRefs
              )
          }
        );

        return;
      }

      const existing =
        seen.get(key);

      existing.confidence =
        Math.max(
          Number(
            existing.confidence ||
            0
          ),
          Number(
            seed.confidence ||
            0
          )
        );

      existing.evidenceRefs = [
        ...new Set([
          ...this.asArray(
            existing.evidenceRefs
          ),
          ...this.asArray(
            seed.evidenceRefs
          )
        ])
      ];
    });

    return [...seen.values()];
  },

  dedupeHypotheses(
    hypotheses = []
  ) {
    const seen =
      new Map();

    this.asArray(
      hypotheses
    ).forEach(hypothesis => {
      const key =
        [
          hypothesis.operation,
          this.nodeLabel(
            hypothesis.object
          ),
          hypothesis.domain?.primary,
          hypothesis.overlayOnly ===
          true
            ? "overlay"
            : "primary"
        ]
          .map(value =>
            this.normalize(value)
          )
          .join("|");

      if (
        !seen.has(key)
      ) {
        seen.set(
          key,
          hypothesis
        );

        return;
      }

      const existing =
        seen.get(key);

      if (
        hypothesis.score >
        existing.score
      ) {
        hypothesis.evidenceRefs = [
          ...new Set([
            ...this.asArray(
              hypothesis.evidenceRefs
            ),
            ...this.asArray(
              existing.evidenceRefs
            )
          ])
        ];

        seen.set(
          key,
          hypothesis
        );
      } else {
        existing.evidenceRefs = [
          ...new Set([
            ...this.asArray(
              existing.evidenceRefs
            ),
            ...this.asArray(
              hypothesis.evidenceRefs
            )
          ])
        ];
      }
    });

    return [...seen.values()];
  },

  rankForInspection(
    hypotheses = []
  ) {
    return this.asArray(
      hypotheses
    )
      .sort(
        (
          left,
          right
        ) => {
          if (
            left.overlayOnly !==
            right.overlayOnly
          ) {
            return left.overlayOnly
              ? 1
              : -1;
          }

          if (
            right.score !==
            left.score
          ) {
            return (
              right.score -
              left.score
            );
          }

          return (
            right.confidence -
            left.confidence
          );
        }
      )
      .map(
        (
          hypothesis,
          index
        ) => ({
          ...hypothesis,

          inspectionRank:
            index + 1,

          selected:
            false,

          canonical:
            false
        })
      );
  },

  /* =====================================================
     AMBIGUITY + QUALITY
  ===================================================== */

  buildHypothesisAmbiguity({
    hypotheses = [],
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {}
  } = {}) {
    const primaryHypotheses =
      hypotheses.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      );

    const first =
      primaryHypotheses[0] ||
      null;

    const second =
      primaryHypotheses[1] ||
      null;

    const scoreGap =
      first &&
      second
        ? Number(
            first.score ||
            0
          ) -
          Number(
            second.score ||
            0
          )
        : null;

    const closeCompetition =
      Boolean(
        first &&
        second &&
        scoreGap <= 10
      );

    const unresolvedReferences =
      this.asArray(
        referenceResolution.decisions
      ).filter(decision =>
        decision.status !==
        "resolved"
      );

    const unresolvedSemanticItems =
      this.asArray(
        semanticStructure.unresolved
      );

    const requestAmbiguity =
      requestInterpretation
        .ambiguity ||
      {};

    const present =
      closeCompetition ||
      unresolvedReferences.length >
        0 ||
      unresolvedSemanticItems.length >
        0 ||
      requestAmbiguity.present ===
        true;

    const requiresClarification =
      unresolvedReferences.length >
        0 ||
      requestAmbiguity
        .requiresClarification ===
        true ||
      (
        closeCompetition &&
        (
          first?.confidence <
            0.72 ||
          second?.confidence <
            0.72
        )
      );

    return {
      present,

      requiresClarification,

      closeCompetition,

      scoreGap,

      leadingHypothesisId:
        first?.hypothesisId ||
        null,

      competingHypothesisId:
        second?.hypothesisId ||
        null,

      unresolvedReferenceCount:
        unresolvedReferences.length,

      unresolvedSemanticItemCount:
        unresolvedSemanticItems.length,

      reasons: [
        closeCompetition
          ? "close_hypothesis_scores"
          : null,

        unresolvedReferences.length
          ? "unresolved_references"
          : null,

        unresolvedSemanticItems.length
          ? "unresolved_semantic_items"
          : null,

        requestAmbiguity.present
          ? "request_interpretation_ambiguity"
          : null
      ].filter(Boolean),

      confidence:
        present
          ? 0.68
          : 0.9
    };
  },

  buildQualityReport({
    hypotheses = [],
    currentTurn = {},
    semanticStructure = {},
    requestInterpretation = {},
    ambiguity = {}
  } = {}) {
    const warnings = [];

    if (
      !currentTurn.rawText
    ) {
      warnings.push({
        type:
          "current_turn_missing",

        message:
          "No current user turn was available."
      });
    }

    if (
      semanticStructure.ran ===
      false
    ) {
      warnings.push({
        type:
          "semantic_structure_missing",

        message:
          "No canonical semantic structure was available."
      });
    }

    if (
      requestInterpretation.ran ===
      false
    ) {
      warnings.push({
        type:
          "request_interpretation_fallback",

        message:
          "Request interpretation was reconstructed from compatibility fields."
      });
    }

    if (
      !hypotheses.length
    ) {
      warnings.push({
        type:
          "no_hypotheses",

        message:
          "No semantic hypotheses were generated."
      });
    }

    const primaryHypotheses =
      hypotheses.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      );

    if (
      primaryHypotheses.length ===
      1
    ) {
      warnings.push({
        type:
          "single_hypothesis_only",

        message:
          "Only one primary meaning hypothesis was generated."
      });
    }

    if (
      ambiguity.present
    ) {
      warnings.push({
        type:
          "meaning_ambiguity",

        reasons:
          ambiguity.reasons,

        message:
          "Multiple meanings remain plausible or unresolved."
      });
    }

    const highestConfidence =
      primaryHypotheses[0]
        ?.confidence ||
      0;

    const evidenceCoverage =
      hypotheses.length
        ? hypotheses.reduce(
            (
              total,
              hypothesis
            ) =>
              total +
              Math.min(
                1,
                hypothesis
                  .supportingEvidence
                  .length /
                4
              ),
            0
          ) /
          hypotheses.length
        : 0;

    const score =
      this.normalizeConfidence(
        highestConfidence *
          0.5 +
        evidenceCoverage *
          0.2 +
        (
          semanticStructure.ran !==
          false
            ? 0.12
            : 0
        ) +
        (
          requestInterpretation.ran !==
          false
            ? 0.1
            : 0
        ) +
        (
          ambiguity.present
            ? 0
            : 0.08
        )
      );

    return {
      healthy:
        Boolean(
          hypotheses.length
        ) &&
        Boolean(
          currentTurn.rawText
        ),

      score,

      confidence:
        score,

      hypothesisCount:
        hypotheses.length,

      primaryHypothesisCount:
        primaryHypotheses.length,

      overlayHypothesisCount:
        hypotheses.filter(
          hypothesis =>
            hypothesis.overlayOnly ===
            true
        ).length,

      highestConfidence,

      ambiguityPresent:
        ambiguity.present,

      clarificationRequired:
        ambiguity
          .requiresClarification,

      warnings
    };
  },

  /* =====================================================
     PACKET
  ===================================================== */

  buildHypothesisPacket({
    currentTurn = {},
    semanticStructure = {},
    requestInterpretation = {},
    threadContext = {},
    referenceResolution = {},
    evidence = {},
    hypotheses = [],
    ambiguity = {},
    quality = {}
  } = {}) {
    return {
      schema:
        "ari_semantic_hypotheses",

      version:
        this.schemaVersion,

      engineVersion:
        this.version,

      source:
        "ari-semantic-hypothesis-engine",

      ran:
        true,

      turnId:
        currentTurn.turnId,

      currentTurn: {
        rawText:
          currentTurn.rawText,

        normalizedText:
          currentTurn.normalizedText,

        preservedExactly:
          currentTurn
            .preservedExactly
      },

      requestInterpretation: {
        requestedOperation:
          requestInterpretation
            .requestedOperation,

        proposedOperation:
          requestInterpretation
            .proposedOperation,

        requestedOutput:
          requestInterpretation
            .requestedOutput,

        actionPolicy:
          requestInterpretation
            .actionPolicy,

        ambiguity:
          requestInterpretation
            .ambiguity,

        confidence:
          requestInterpretation
            .confidence
      },

      semanticInput: {
        schema:
          semanticStructure.schema ||
          null,

        version:
          semanticStructure.version ||
          null,

        source:
          semanticStructure.source ||
          null,

        entityCount:
          semanticStructure
            .entities
            .length,

        eventCount:
          semanticStructure
            .events
            .length,

        claimCount:
          semanticStructure
            .claims
            .length,

        relationCount:
          semanticStructure
            .relations
            .length,

        referenceCount:
          semanticStructure
            .references
            .length,

        unresolvedCount:
          semanticStructure
            .unresolved
            .length
      },

      contextInput: {
        threadAvailable:
          threadContext.ran !==
          false,

        activeTopic:
          threadContext.activeTopic ||
          threadContext.currentTopic ||
          null,

        activeIssue:
          threadContext.activeIssue ||
          null,

        referenceResolutionAvailable:
          referenceResolution.ran !==
          false
      },

      evidence,

      hypotheses,

      hypothesisCount:
        hypotheses.length,

      primaryHypotheses:
        hypotheses.filter(
          hypothesis =>
            hypothesis.overlayOnly !==
            true
        ),

      overlayHypotheses:
        hypotheses.filter(
          hypothesis =>
            hypothesis.overlayOnly ===
            true
        ),

      ambiguity,

      quality,

      readyForCanonicalResolution:
        hypotheses.some(
          hypothesis =>
            hypothesis.overlayOnly !==
            true
        ),

      requiresClarification:
        ambiguity
          .requiresClarification,

      selectedHypothesisId:
        null,

      canonicalMeaning:
        null,

      confidence:
        quality.confidence,

      authority: {
        canGenerateMeaningHypotheses:
          true,

        canPreserveAlternativeMeanings:
          true,

        canScoreEvidenceSupport:
          true,

        canReportMeaningAmbiguity:
          true,

        canSelectCanonicalMeaning:
          false,

        canRejectAllHypotheses:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canAnswerUser:
          false,

        role:
          "multi_hypothesis_semantic_generation_only"
      }
    };
  },

  buildReturnPayload(
    packet = {}
  ) {
    return {
      semanticHypothesisEngineRan:
        true,

      semanticHypothesisEngineVersion:
        this.version,

      semanticHypothesisEngineSource:
        "ari-semantic-hypothesis-engine",

      semanticHypothesisPacket:
        packet,

      semanticHypotheses:
        packet,

      meaningHypotheses:
        packet.hypotheses,

      primaryMeaningHypotheses:
        packet.primaryHypotheses,

      overlayMeaningHypotheses:
        packet.overlayHypotheses,

      meaningHypothesisCount:
        packet.hypothesisCount,

      meaningAmbiguity:
        packet.ambiguity,

      semanticHypothesisQuality:
        packet.quality,

      readyForCanonicalResolution:
        packet.readyForCanonicalResolution,

      requiresMeaningClarification:
        packet.requiresClarification,

      confidence:
        packet.confidence,

      warnings:
        packet.quality
          ?.warnings ||
        [],

      authority:
        "multi_hypothesis_semantic_generation_only"
    };
  },

  /* =====================================================
     SELECTION HELPERS
  ===================================================== */

  selectSalientEntity(
    entities = []
  ) {
    return this.asArray(
      entities
    )
      .filter(Boolean)
      .sort(
        (
          left,
          right
        ) => {
          const leftScore =
            Number(
              left.salience ??
              left.score ??
              left.confidence ??
              0
            );

          const rightScore =
            Number(
              right.salience ??
              right.score ??
              right.confidence ??
              0
            );

          return (
            rightScore -
            leftScore
          );
        }
      )[0] ||
      null;
  },

  selectPrimaryClaim(
    claims = []
  ) {
    return this.asArray(
      claims
    )
      .filter(Boolean)
      .sort(
        (
          left,
          right
        ) => {
          const leftScore =
            Number(
              left.salience ??
              left.importance ??
              left.confidence ??
              0
            );

          const rightScore =
            Number(
              right.salience ??
              right.importance ??
              right.confidence ??
              0
            );

          return (
            rightScore -
            leftScore
          );
        }
      )[0] ||
      null;
  },

  selectPrimaryEvent(
    events = []
  ) {
    return this.asArray(
      events
    )
      .filter(Boolean)
      .sort(
        (
          left,
          right
        ) => {
          const leftScore =
            Number(
              left.salience ??
              left.importance ??
              left.confidence ??
              0
            );

          const rightScore =
            Number(
              right.salience ??
              right.importance ??
              right.confidence ??
              0
            );

          return (
            rightScore -
            leftScore
          );
        }
      )[0] ||
      null;
  },

  normalizeNode(
    value,
    defaults = {}
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return {
        id:
          null,

        type:
          defaults.fallbackType ||
          "unknown",

        value:
          defaults.fallbackValue ||
          null,

        label:
          defaults.fallbackValue ||
          null,

        origin:
          defaults.origin ||
          "unknown",

        confidence:
          defaults.confidence ||
          0,

        evidenceRefs: []
      };
    }

    if (
      typeof value ===
      "string"
    ) {
      return {
        id:
          this.createStableId(
            "semantic_node",
            value
          ),

        type:
          defaults.fallbackType ||
          "concept",

        value,

        label:
          value,

        origin:
          defaults.origin ||
          "explicit",

        confidence:
          defaults.confidence ??
          0.65,

        evidenceRefs: []
      };
    }

    return {
      id:
        value.id ||
        value.entityRef ||
        value.semanticRef ||
        this.createStableId(
          "semantic_node",
          this.nodeLabel(value)
        ),

      type:
        value.type ||
        value.kind ||
        value.nodeType ||
        defaults.fallbackType ||
        "semantic_node",

      value:
        value.value ??
        value.surface ??
        value.label ??
        value.claim ??
        value.name ??
        null,

      label:
        value.label ||
        value.surface ||
        value.claim ||
        value.value ||
        value.name ||
        null,

      origin:
        value.origin ||
        defaults.origin ||
        value.source ||
        "explicit",

      confidence:
        this.normalizeConfidence(
          value.confidence ??
          defaults.confidence ??
          0.65
        ),

      evidenceRefs:
        this.asArray(
          value.evidenceRefs ||
          value.evidenceRef ||
          value.id
        )
    };
  },

  /* =====================================================
     OPERATION + DOMAIN MAPPING
  ===================================================== */

  requestFamilyFromOperation(
    operation = ""
  ) {
    const normalized =
      this.normalizeOperation(
        operation
      );

    const map = {
      provide_information:
        "information",

      explain:
        "information",

      compare:
        "comparison",

      evaluate:
        "evaluation",

      recommend:
        "decision",

      prioritize:
        "decision",

      plan:
        "planning",

      generate_text:
        "writing",

      create_artifact:
        "creation",

      modify_artifact:
        "developer_task",

      implement:
        "developer_task",

      inspect:
        "verification",

      debug:
        "developer_task",

      verify:
        "verification",

      calculate:
        "calculation",

      convert:
        "calculation",

      translate:
        "translation",

      summarize:
        "summarization",

      classify:
        "classification",

      retrieve_memory:
        "memory",

      store_memory:
        "memory",

      forget_memory:
        "memory",

      provide_emotional_support:
        "emotional_support",

      provide_opinion:
        "opinion",

      answer_identity_question:
        "identity",

      continue_context:
        "continuity",

      interpret_or_correct:
        "correction",

      respond:
        "general"
    };

    return map[normalized] ||
      "general";
  },

  defaultOutputForOperation(
    operation = ""
  ) {
    const map = {
      provide_information:
        "direct_answer",

      explain:
        "explanation",

      compare:
        "comparison",

      evaluate:
        "evaluation",

      recommend:
        "recommendation",

      prioritize:
        "priority_order",

      plan:
        "plan",

      generate_text:
        "written_text",

      create_artifact:
        "created_artifact",

      modify_artifact:
        "modified_artifact",

      implement:
        "code",

      inspect:
        "inspection_result",

      debug:
        "diagnosis_and_fix",

      verify:
        "verification_result",

      calculate:
        "calculated_result",

      convert:
        "converted_result",

      translate:
        "translated_text",

      summarize:
        "summary",

      classify:
        "classification_result",

      retrieve_memory:
        "recalled_context",

      store_memory:
        "memory_action",

      forget_memory:
        "memory_action",

      provide_emotional_support:
        "supportive_response",

      provide_opinion:
        "opinion",

      answer_identity_question:
        "identity_answer",

      continue_context:
        "continuation_response",

      interpret_or_correct:
        "corrected_interpretation",

      respond:
        "response"
    };

    return (
      map[
        this.normalizeOperation(
          operation
        )
      ] ||
      "response"
    );
  },

  domainFromOperation(
    operation = ""
  ) {
    const normalized =
      this.normalizeOperation(
        operation
      );

    if (
      [
        "modify_artifact",
        "implement",
        "inspect",
        "debug"
      ].includes(normalized)
    ) {
      return "project";
    }

    if (
      [
        "calculate",
        "convert"
      ].includes(normalized)
    ) {
      return "calculation";
    }

    if (
      normalized ===
      "generate_text"
    ) {
      return "writing";
    }

    if (
      [
        "retrieve_memory",
        "store_memory",
        "forget_memory"
      ].includes(normalized)
    ) {
      return "memory";
    }

    if (
      normalized ===
      "answer_identity_question"
    ) {
      return "identity";
    }

    if (
      normalized ===
      "provide_emotional_support"
    ) {
      return "emotion";
    }

    return "general_understanding";
  },

  normalizeOperation(
    value = ""
  ) {
    const normalized =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const aliases = {
      information:
        "provide_information",

      answer:
        "provide_information",

      explanation:
        "explain",

      comparison:
        "compare",

      recommendation:
        "recommend",

      prioritization:
        "prioritize",

      planning:
        "plan",

      writing:
        "generate_text",

      creation:
        "create_artifact",

      modification:
        "modify_artifact",

      implementation:
        "implement",

      review:
        "inspect",

      debugging:
        "debug",

      verification:
        "verify",

      calculation:
        "calculate",

      conversion:
        "convert",

      translation:
        "translate",

      summarization:
        "summarize",

      emotional_support:
        "provide_emotional_support",

      opinion:
        "provide_opinion",

      identity:
        "answer_identity_question",

      continuation:
        "continue_context",

      correction:
        "interpret_or_correct"
    };

    return aliases[normalized] ||
      normalized;
  },

  normalizeDomain(
    value = ""
  ) {
    const normalized =
      this.normalize(value)
        .replace(/\s+/g, "_");

    const aliases = {
      health:
        "medical",

      body:
        "medical",

      coding:
        "project",

      software:
        "project",

      developer:
        "project",

      architecture:
        "project",

      money:
        "finance",

      financial:
        "finance",

      relationships:
        "relationship",

      emotional:
        "emotion",

      general:
        "general_understanding"
    };

    return aliases[normalized] ||
      normalized;
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  slotPresent(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (
      Array.isArray(value)
    ) {
      return value.length > 0;
    }

    if (
      typeof value ===
      "object"
    ) {
      return Boolean(
        value.value ??
        value.label ??
        value.name ??
        value.claim ??
        (
          value.type &&
          ![
            "unknown",
            "unspecified"
          ].includes(
            value.type
          )
        )
      );
    }

    return (
      String(value).trim()
        .length > 0
    );
  },

  nodeLabel(value) {
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
      value.predicate ||
      value.action ||
      value.entityRef ||
      value.semanticRef ||
      ""
    );
  },

  nodeIds(values = []) {
    return this.asArray(
      values
    )
      .map(value =>
        value?.id ||
        value?.semanticRef ||
        value?.entityRef ||
        null
      )
      .filter(Boolean);
  },

  averageConfidence(
    values = [],
    fallback = 0.5
  ) {
    const usable =
      this.asArray(
        values
      );

    if (!usable.length) {
      return fallback;
    }

    return this.normalizeConfidence(
      usable.reduce(
        (
          total,
          item
        ) =>
          total +
          this.normalizeConfidence(
            item?.confidence ??
            fallback
          ),
        0
      ) /
      usable.length
    );
  },

  dedupeEvidence(
    evidence = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      evidence
    ).filter(item => {
      const key =
        [
          item.type,
          item.value,
          item.source,
          item.semanticRef
        ]
          .map(value =>
            this.normalize(value)
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

  groupBy(
    values = [],
    field = "type"
  ) {
    return this.asArray(
      values
    ).reduce(
      (
        result,
        item
      ) => {
        const key =
          item?.[field] ||
          "unknown";

        result[key] =
          result[key] ||
          [];

        result[key].push(item);

        return result;
      },
      {}
    );
  },

  normalizeType(
    value = ""
  ) {
    return this.normalize(value)
      .replace(/\s+/g, "_");
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

  normalizeConfidence(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (
      number > 1
    ) {
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

  isQuestion(value = "") {
    const text =
      this.normalize(value);

    return (
      String(value).includes("?") ||
      /^(what|why|how|when|where|who|which|is|are|am|do|does|did|can|could|should|would|will|was|were|has|have|had)\b/.test(
        text
      )
    );
  },

  createStableId(
    prefix = "id",
    value = ""
  ) {
    return [
      prefix,
      this.hashString(
        String(value || "")
      )
    ].join("_");
  },

  hashString(value = "") {
    let hash =
      2166136261;

    const text =
      String(value || "");

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );

      hash +=
        (
          hash << 1
        ) +
        (
          hash << 4
        ) +
        (
          hash << 7
        ) +
        (
          hash << 8
        ) +
        (
          hash << 24
        );
    }

    return (
      hash >>> 0
    ).toString(36);
  },

  cleanOriginal(value = "") {
    return String(
      value ??
      ""
    )
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(
      value
    )
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.semanticHypothesisEngine =
  window.AriSemanticHypothesisEngine;

console.log(
  "ARI SEMANTIC HYPOTHESIS ENGINE LOADED:",
  window.AriSemanticHypothesisEngine?.version
);