// ari/meaning/ari-canonical-meaning-resolver.js
// Ari Canonical Meaning Resolver
// Purpose: Select one evidence-supported canonical meaning from semantic hypotheses.
// V1.0.0 — Evidence Adjudication / Ambiguity Preservation / No Raw-Language Reinterpretation

window.Ari = window.Ari || {};

window.AriCanonicalMeaningResolver = {
  version: "1.0.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  resolve(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const hypothesisPacket =
      this.readHypothesisPacket(
        summary
      );

    const semanticStructure =
      this.readSemanticStructure(
        summary,
        hypothesisPacket
      );

    const requestInterpretation =
      this.readRequestInterpretation(
        summary,
        hypothesisPacket
      );

    const referenceResolution =
      this.readReferenceResolution(
        summary,
        hypothesisPacket
      );

    const threadContext =
      this.readThreadContext(
        summary,
        hypothesisPacket
      );

    const hypotheses =
      this.normalizeHypotheses(
        hypothesisPacket.hypotheses ||
        hypothesisPacket.meaningHypotheses ||
        []
      );

    const validation =
      this.validateInputs({
        hypothesisPacket,
        hypotheses,
        semanticStructure,
        requestInterpretation
      });

    const adjudicated =
      hypotheses.map(
        hypothesis =>
          this.adjudicateHypothesis({
            hypothesis,
            hypotheses,
            semanticStructure,
            requestInterpretation,
            referenceResolution,
            threadContext
          })
      );

    const ranked =
      this.rankHypotheses(
        adjudicated
      );

    const decision =
      this.selectCanonicalMeaning({
        ranked,
        hypothesisPacket,
        semanticStructure,
        requestInterpretation,
        referenceResolution,
        threadContext,
        validation
      });

    const rejectedHypotheses =
      this.buildRejectedHypotheses({
        ranked,
        selectedHypothesis:
          decision.selectedHypothesis,
        decision
      });

    const ambiguity =
      this.buildCanonicalAmbiguity({
        ranked,
        selectedHypothesis:
          decision.selectedHypothesis,
        hypothesisPacket,
        semanticStructure,
        requestInterpretation,
        referenceResolution,
        decision
      });

    const evidenceSummary =
      this.buildEvidenceSummary({
        selectedHypothesis:
          decision.selectedHypothesis,
        rejectedHypotheses,
        decision,
        ambiguity,
        semanticStructure,
        requestInterpretation,
        referenceResolution
      });

    const canonicalMeaning =
      this.buildCanonicalMeaning({
        selectedHypothesis:
          decision.selectedHypothesis,
        ranked,
        semanticStructure,
        requestInterpretation,
        referenceResolution,
        threadContext,
        ambiguity,
        evidenceSummary
      });

    const quality =
      this.buildQualityReport({
        canonicalMeaning,
        ranked,
        ambiguity,
        validation,
        decision,
        hypothesisPacket
      });

    const packet =
      this.buildCanonicalPacket({
        hypothesisPacket,
        semanticStructure,
        requestInterpretation,
        referenceResolution,
        threadContext,
        ranked,
        canonicalMeaning,
        rejectedHypotheses,
        ambiguity,
        evidenceSummary,
        validation,
        quality,
        decision
      });

    window.Ari.canonicalMeaning =
      canonicalMeaning;

    window.Ari.canonicalMeaningPacket =
      packet;

    window.Ari.canonicalMeaningResolution =
      packet;

    return this.buildReturnPayload(
      packet
    );
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readHypothesisPacket(summary = {}) {
    const candidates = [
      summary.semanticHypothesisPacket,

      summary.semanticHypotheses,

      summary.meaningHypothesesPacket,

      summary.semanticHypothesisResult
        ?.semanticHypothesisPacket,

      summary.semanticHypothesisResult
        ?.semanticHypotheses,

      window.Ari
        .semanticHypothesisPacket,

      window.Ari
        .semanticHypotheses
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
          (
            candidate.schema ===
              "ari_semantic_hypotheses" ||
            Array.isArray(
              candidate.hypotheses
            ) ||
            Array.isArray(
              candidate
                .primaryHypotheses
            )
          )
      );

    if (found) {
      return {
        ...found,

        hypotheses:
          this.asArray(
            found.hypotheses ||
            found.meaningHypotheses
          ),

        primaryHypotheses:
          this.asArray(
            found.primaryHypotheses
          ),

        overlayHypotheses:
          this.asArray(
            found.overlayHypotheses
          )
      };
    }

    const directHypotheses =
      this.asArray(
        summary.meaningHypotheses ||
        summary.primaryMeaningHypotheses
      );

    return {
      schema:
        "ari_semantic_hypotheses",

      version:
        null,

      source:
        "ari-canonical-meaning-resolver-fallback",

      ran:
        false,

      hypotheses:
        directHypotheses,

      primaryHypotheses:
        directHypotheses.filter(
          hypothesis =>
            hypothesis
              ?.overlayOnly !==
            true
        ),

      overlayHypotheses:
        directHypotheses.filter(
          hypothesis =>
            hypothesis
              ?.overlayOnly ===
            true
        ),

      ambiguity:
        summary.meaningAmbiguity ||
        {
          present:
            false,

          requiresClarification:
            false,

          reasons: []
        },

      quality:
        summary
          .semanticHypothesisQuality ||
        null,

      evidence:
        summary
          .meaningEvidenceCatalog ||
        null,

      readyForCanonicalResolution:
        directHypotheses.length >
        0
    };
  },

  readSemanticStructure(
    summary = {},
    hypothesisPacket = {}
  ) {
    const candidates = [
      summary
        .resolvedSemanticStructure,

      summary
        .semanticStructure,

      summary
        .currentSemanticStructure,

      hypothesisPacket
        .resolvedSemanticStructure,

      hypothesisPacket
        .semanticStructure,

      window.Ari
        .resolvedSemanticStructure,

      window.Ari
        .semanticStructure
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
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
    summary = {},
    hypothesisPacket = {}
  ) {
    const candidates = [
      summary.requestInterpretation,

      summary
        .currentRequestInterpretation,

      hypothesisPacket
        .requestInterpretation,

      window.Ari
        .requestInterpretation,

      window.Ari
        .currentRequestInterpretation
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
          (
            candidate.schema ===
              "ari_request_interpretation" ||
            candidate
              .requestedOperation ||
            candidate
              .primaryOperation
          )
      );

    if (!found) {
      return {
        schema:
          "ari_request_interpretation",

        ran:
          false,

        requestedOperation:
          null,

        proposedOperation:
          null,

        primaryOperation:
          null,

        secondaryOperations: [],

        requestedOutput:
          null,

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

        confidence:
          0
      };
    }

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
        ),

      actionPolicy:
        found.actionPolicy ||
        {
          executionAllowed:
            true,

          analysisOnly:
            false,

          prohibitedOperations:
            [],

          deferredOperations:
            []
        },

      ambiguity:
        found.ambiguity ||
        {
          present:
            false,

          requiresClarification:
            false,

          reasons: []
        }
    };
  },

  readReferenceResolution(
    summary = {},
    hypothesisPacket = {}
  ) {
    const candidates = [
      summary.referenceResolution,

      summary
        .entityReferenceState,

      summary
        .subjectGraphState,

      hypothesisPacket
        .referenceResolution,

      window.Ari
        .referenceResolution,

      window.Ari
        .entityReferenceState,

      window.Ari
        .subjectGraphState
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object" &&
          (
            candidate.schema ===
              "ari_reference_resolution" ||
            Array.isArray(
              candidate.decisions
            ) ||
            Array.isArray(
              candidate
                .resolvedReferences
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

  readThreadContext(
    summary = {},
    hypothesisPacket = {}
  ) {
    const candidates = [
      summary.threadContext,

      summary.threadUnderstanding
        ?.threadContext,

      summary.threadUnderstanding
        ?.workingContext,

      summary.threadWorkingContext,

      summary.continuityPacket
        ?.activeThread,

      summary.threadState,

      hypothesisPacket
        .threadContext,

      window.Ari
        .threadContext,

      window.Ari
        .workingContext
    ];

    const found =
      candidates.find(
        candidate =>
          candidate &&
          typeof candidate ===
            "object"
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
          speaker:
            null,

          addressee:
            null,

          mentionedParticipants:
            []
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
     VALIDATION
  ===================================================== */

  validateInputs({
    hypothesisPacket = {},
    hypotheses = [],
    semanticStructure = {},
    requestInterpretation = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    if (
      !hypothesisPacket ||
      typeof hypothesisPacket !==
        "object"
    ) {
      errors.push({
        type:
          "hypothesis_packet_missing",

        message:
          "The semantic hypothesis packet was not available."
      });
    }

    if (!hypotheses.length) {
      errors.push({
        type:
          "hypotheses_missing",

        message:
          "No semantic hypotheses were available for canonical selection."
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
          "Canonical selection is running without a canonical semantic structure."
      });
    }

    if (
      requestInterpretation.ran ===
      false
    ) {
      warnings.push({
        type:
          "request_interpretation_missing",

        message:
          "Canonical selection is running without the request interpreter's full output."
      });
    }

    const primaryCount =
      hypotheses.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      ).length;

    if (!primaryCount) {
      errors.push({
        type:
          "primary_hypothesis_missing",

        message:
          "No non-overlay semantic hypothesis is available."
      });
    }

    return {
      valid:
        errors.length === 0,

      errors,

      warnings,

      hypothesisCount:
        hypotheses.length,

      primaryHypothesisCount:
        primaryCount
    };
  },

  /* =====================================================
     HYPOTHESIS NORMALIZATION
  ===================================================== */

  normalizeHypotheses(
    hypotheses = []
  ) {
    return this.asArray(
      hypotheses
    )
      .filter(
        hypothesis =>
          hypothesis &&
          typeof hypothesis ===
            "object"
      )
      .map(
        (
          hypothesis,
          index
        ) => ({
          ...hypothesis,

          hypothesisId:
            hypothesis
              .hypothesisId ||
            this.createStableId(
              "meaning_hypothesis",
              [
                hypothesis.operation,
                this.nodeLabel(
                  hypothesis.object
                ),
                index
              ].join("|")
            ),

          operation:
            this.normalizeOperation(
              hypothesis.operation ||
              hypothesis
                .requestedOperation ||
              "respond"
            ),

          requestFamily:
            hypothesis.requestFamily ||
            this.requestFamilyFromOperation(
              hypothesis.operation
            ),

          supportingEvidence:
            this.asArray(
              hypothesis
                .supportingEvidence
            ),

          contradictingEvidence:
            this.asArray(
              hypothesis
                .contradictingEvidence
            ),

          assumptions:
            this.asArray(
              hypothesis.assumptions
            ),

          unresolved:
            this.asArray(
              hypothesis.unresolved
            ),

          evidenceRefs:
            this.asArray(
              hypothesis.evidenceRefs
            ),

          score:
            this.normalizeScore(
              hypothesis.score
            ),

          confidence:
            this.normalizeConfidence(
              hypothesis.confidence ??
              (
                Number(
                  hypothesis.score ||
                  0
                ) /
                100
              )
            ),

          overlayOnly:
            hypothesis.overlayOnly ===
            true,

          selected:
            false,

          canonical:
            false
        })
      );
  },

  /* =====================================================
     ADJUDICATION
  ===================================================== */

  adjudicateHypothesis({
    hypothesis = {},
    hypotheses = [],
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {},
    threadContext = {}
  } = {}) {
    const baseScore =
      this.normalizeScore(
        hypothesis.score
      );

    const operationAlignment =
      this.scoreOperationAlignment({
        hypothesis,
        requestInterpretation
      });

    const structureAlignment =
      this.scoreStructureAlignment({
        hypothesis,
        semanticStructure
      });

    const referenceAlignment =
      this.scoreReferenceAlignment({
        hypothesis,
        referenceResolution
      });

    const continuityAlignment =
      this.scoreContinuityAlignment({
        hypothesis,
        semanticStructure,
        referenceResolution,
        threadContext
      });

    const evidenceStrength =
      this.scoreEvidenceStrength(
        hypothesis
      );

    const completeness =
      this.scoreCompleteness(
        hypothesis
      );

    const contradictionPenalty =
      this.scoreContradictionPenalty(
        hypothesis
      );

    const assumptionPenalty =
      this.scoreAssumptionPenalty(
        hypothesis
      );

    const unresolvedPenalty =
      this.scoreUnresolvedPenalty(
        hypothesis
      );

    const policyPenalty =
      this.scoreActionPolicyPenalty({
        hypothesis,
        requestInterpretation
      });

    const overlayPenalty =
      hypothesis.overlayOnly ===
        true
        ? 35
        : 0;

    const adjustedScore =
      this.clampScore(
        baseScore * 0.32 +
        operationAlignment * 0.18 +
        structureAlignment * 0.14 +
        referenceAlignment * 0.1 +
        continuityAlignment * 0.08 +
        evidenceStrength * 0.1 +
        completeness * 0.08 -
        contradictionPenalty -
        assumptionPenalty -
        unresolvedPenalty -
        policyPenalty -
        overlayPenalty
      );

    const normalizedConfidence =
      this.normalizeConfidence(
        adjustedScore /
        100
      );

    return {
      ...hypothesis,

      adjudication: {
        baseScore,

        operationAlignment,

        structureAlignment,

        referenceAlignment,

        continuityAlignment,

        evidenceStrength,

        completeness,

        contradictionPenalty,

        assumptionPenalty,

        unresolvedPenalty,

        policyPenalty,

        overlayPenalty,

        adjustedScore,

        confidence:
          normalizedConfidence,

        reasons:
          this.buildAdjudicationReasons({
            hypothesis,
            operationAlignment,
            structureAlignment,
            referenceAlignment,
            continuityAlignment,
            evidenceStrength,
            completeness,
            contradictionPenalty,
            assumptionPenalty,
            unresolvedPenalty,
            policyPenalty,
            overlayPenalty
          })
      },

      canonicalScore:
        adjustedScore,

      canonicalConfidence:
        normalizedConfidence
    };
  },

  scoreOperationAlignment({
    hypothesis = {},
    requestInterpretation = {}
  } = {}) {
    const hypothesisOperation =
      this.normalizeOperation(
        hypothesis.operation
      );

    const requestedOperation =
      this.normalizeOperation(
        requestInterpretation
          .requestedOperation ||
        requestInterpretation
          .primaryOperation
          ?.operation
      );

    const proposedOperation =
      this.normalizeOperation(
        requestInterpretation
          .proposedOperation
      );

    const secondaryOperations =
      this.asArray(
        requestInterpretation
          .secondaryOperations
      )
        .map(operation =>
          this.normalizeOperation(
            operation.operation ||
            operation
          )
        )
        .filter(Boolean);

    if (
      hypothesisOperation &&
      requestedOperation &&
      hypothesisOperation ===
        requestedOperation
    ) {
      return 100;
    }

    if (
      secondaryOperations.includes(
        hypothesisOperation
      )
    ) {
      return 78;
    }

    if (
      hypothesisOperation &&
      proposedOperation &&
      hypothesisOperation ===
        proposedOperation
    ) {
      const blocked =
        requestInterpretation
          .actionPolicy
          ?.proposedOperationBlocked ===
        true;

      return blocked
        ? 25
        : 70;
    }

    if (
      this.operationsCompatible(
        hypothesisOperation,
        requestedOperation
      )
    ) {
      return 68;
    }

    if (!requestedOperation) {
      return 50;
    }

    return 18;
  },

  scoreStructureAlignment({
    hypothesis = {},
    semanticStructure = {}
  } = {}) {
    let score = 40;

    const operation =
      this.normalizeOperation(
        hypothesis.operation
      );

    const object =
      hypothesis.object ||
      {};

    const objectId =
      object.id ||
      object.semanticRef ||
      null;

    const allNodes = [
      ...this.asArray(
        semanticStructure.entities
      ),

      ...this.asArray(
        semanticStructure.events
      ),

      ...this.asArray(
        semanticStructure.claims
      ),

      ...this.asArray(
        semanticStructure.quantities
      ),

      ...this.asArray(
        semanticStructure.options
      ),

      ...this.asArray(
        semanticStructure.attributes
      )
    ];

    if (
      objectId &&
      allNodes.some(node =>
        [
          node?.id,
          node?.semanticRef,
          node?.entityRef
        ].includes(
          objectId
        )
      )
    ) {
      score += 28;
    } else if (
      this.nodeLabel(object) &&
      allNodes.some(node =>
        this.semanticTextMatch(
          this.nodeLabel(object),
          this.nodeLabel(node)
        )
      )
    ) {
      score += 20;
    }

    if (
      operation ===
        "compare" &&
      (
        semanticStructure
          .options.length >=
          2 ||
        semanticStructure
          .quantities.length >
          0
      )
    ) {
      score += 24;
    }

    if (
      [
        "recommend",
        "prioritize",
        "evaluate"
      ].includes(operation) &&
      semanticStructure
        .options.length >=
        2
    ) {
      score += 22;
    }

    if (
      [
        "calculate",
        "convert"
      ].includes(operation) &&
      semanticStructure
        .quantities.length >
        0
    ) {
      score += 25;
    }

    if (
      operation ===
        "provide_emotional_support" &&
      semanticStructure
        .emotionalSignals.length >
        0
    ) {
      score += 20;
    }

    if (
      [
        "provide_information",
        "explain"
      ].includes(operation) &&
      (
        semanticStructure
          .claims.length >
          0 ||
        semanticStructure
          .entities.length >
          0
      )
    ) {
      score += 15;
    }

    if (
      semanticStructure.ran ===
      false
    ) {
      score -= 15;
    }

    return this.clampScore(
      score
    );
  },

  scoreReferenceAlignment({
    hypothesis = {},
    referenceResolution = {}
  } = {}) {
    const decisions =
      this.asArray(
        referenceResolution.decisions
      );

    if (!decisions.length) {
      return 60;
    }

    const resolved =
      decisions.filter(
        decision =>
          decision.status ===
          "resolved"
      );

    const unresolved =
      decisions.filter(
        decision =>
          decision.status !==
          "resolved"
      );

    const objectLabel =
      this.normalize(
        this.nodeLabel(
          hypothesis.object
        )
      );

    const targetLabel =
      this.normalize(
        this.nodeLabel(
          hypothesis.target
        )
      );

    const hypothesisRefs =
      this.asArray(
        hypothesis.evidenceRefs
      );

    let score = 45;

    resolved.forEach(decision => {
      const resolvedLabel =
        this.normalize(
          this.nodeLabel(
            decision.resolvedTo ||
            decision.target ||
            decision.entity ||
            ""
          )
        );

      const referenceId =
        decision.referenceId ||
        decision.id ||
        null;

      if (
        resolvedLabel &&
        (
          this.semanticTextMatch(
            objectLabel,
            resolvedLabel
          ) ||
          this.semanticTextMatch(
            targetLabel,
            resolvedLabel
          )
        )
      ) {
        score += 22;
      } else if (
        referenceId &&
        hypothesisRefs.includes(
          referenceId
        )
      ) {
        score += 15;
      }
    });

    score -=
      unresolved.length *
      12;

    return this.clampScore(
      score
    );
  },

  scoreContinuityAlignment({
    hypothesis = {},
    semanticStructure = {},
    referenceResolution = {},
    threadContext = {}
  } = {}) {
    const continuity =
      hypothesis.continuity ||
      {};

    const inheritedCount =
      this.asArray(
        semanticStructure
          .inheritedNodes
      ).length;

    const resolvedPriorRefs =
      this.asArray(
        referenceResolution.decisions
      ).filter(
        decision =>
          decision.status ===
            "resolved" &&
          Number(
            decision.turnDistance ||
            decision
              .resolvedTurnDistance ||
            0
          ) >
            0
      );

    const priorContextExpected =
      inheritedCount > 0 ||
      resolvedPriorRefs.length >
        0;

    if (!priorContextExpected) {
      return continuity
        .usesPriorContext
        ? 45
        : 80;
    }

    if (
      priorContextExpected &&
      continuity
        .usesPriorContext ===
      true
    ) {
      return 95;
    }

    const objectLabel =
      this.normalize(
        this.nodeLabel(
          hypothesis.object
        )
      );

    const activeIssue =
      this.normalize(
        this.nodeLabel(
          threadContext.activeIssue
        )
      );

    const activeObject =
      this.normalize(
        this.nodeLabel(
          threadContext.activeObject
        )
      );

    if (
      (
        activeIssue &&
        this.semanticTextMatch(
          objectLabel,
          activeIssue
        )
      ) ||
      (
        activeObject &&
        this.semanticTextMatch(
          objectLabel,
          activeObject
        )
      )
    ) {
      return 72;
    }

    return 25;
  },

  scoreEvidenceStrength(
    hypothesis = {}
  ) {
    const supporting =
      this.asArray(
        hypothesis
          .supportingEvidence
      );

    if (!supporting.length) {
      return 20;
    }

    const weighted =
      supporting.reduce(
        (
          total,
          evidence
        ) =>
          total +
          this.normalizeConfidence(
            evidence.confidence ??
            0.5
          ),
        0
      );

    const average =
      weighted /
      supporting.length;

    const breadthBonus =
      Math.min(
        25,
        supporting.length *
        5
      );

    return this.clampScore(
      average *
        75 +
      breadthBonus
    );
  },

  scoreCompleteness(
    hypothesis = {}
  ) {
    const completeness =
      hypothesis.completeness ||
      {};

    if (
      typeof completeness.score ===
      "number"
    ) {
      return this.clampScore(
        this.normalizeConfidence(
          completeness.score
        ) *
        100
      );
    }

    const unresolved =
      this.asArray(
        hypothesis.unresolved
      );

    if (!unresolved.length) {
      return 85;
    }

    return this.clampScore(
      85 -
      unresolved.length *
        18
    );
  },

  scoreContradictionPenalty(
    hypothesis = {}
  ) {
    return Math.min(
      40,
      this.asArray(
        hypothesis
          .contradictingEvidence
      ).reduce(
        (
          total,
          evidence
        ) =>
          total +
          this.normalizeConfidence(
            evidence.confidence ??
            0.5
          ) *
          12,
        0
      )
    );
  },

  scoreAssumptionPenalty(
    hypothesis = {}
  ) {
    return Math.min(
      24,
      this.asArray(
        hypothesis.assumptions
      ).reduce(
        (
          total,
          assumption
        ) => {
          const confidence =
            this.normalizeConfidence(
              assumption.confidence ??
              0.5
            );

          return (
            total +
            (
              1 -
              confidence
            ) *
              8
          );
        },
        0
      )
    );
  },

  scoreUnresolvedPenalty(
    hypothesis = {}
  ) {
    return Math.min(
      35,
      this.asArray(
        hypothesis.unresolved
      ).reduce(
        (
          total,
          unresolved
        ) =>
          total +
          this.normalizeConfidence(
            unresolved.confidence ??
            0.6
          ) *
          10,
        0
      )
    );
  },

  scoreActionPolicyPenalty({
    hypothesis = {},
    requestInterpretation = {}
  } = {}) {
    const policy =
      requestInterpretation
        .actionPolicy ||
      {};

    const operation =
      this.normalizeOperation(
        hypothesis.operation
      );

    const prohibited =
      this.asArray(
        policy.prohibitedOperations
      )
        .map(value =>
          this.normalizeOperation(
            value
          )
        );

    if (
      prohibited.some(
        prohibitedOperation =>
          this.operationsCompatible(
            operation,
            prohibitedOperation
          )
      )
    ) {
      return 60;
    }

    if (
      policy.analysisOnly ===
        true &&
      this.isExecutionOperation(
        operation
      )
    ) {
      return 55;
    }

    if (
      policy.executionAllowed ===
        false &&
      this.isExecutionOperation(
        operation
      )
    ) {
      return 70;
    }

    return 0;
  },

  buildAdjudicationReasons({
    hypothesis = {},
    operationAlignment = 0,
    structureAlignment = 0,
    referenceAlignment = 0,
    continuityAlignment = 0,
    evidenceStrength = 0,
    completeness = 0,
    contradictionPenalty = 0,
    assumptionPenalty = 0,
    unresolvedPenalty = 0,
    policyPenalty = 0,
    overlayPenalty = 0
  } = {}) {
    const reasons = [];

    if (
      operationAlignment >=
      85
    ) {
      reasons.push(
        "operation_matches_request_interpretation"
      );
    } else if (
      operationAlignment <=
      30
    ) {
      reasons.push(
        "operation_conflicts_with_request_interpretation"
      );
    }

    if (
      structureAlignment >=
      80
    ) {
      reasons.push(
        "strong_semantic_structure_support"
      );
    } else if (
      structureAlignment <=
      35
    ) {
      reasons.push(
        "weak_semantic_structure_support"
      );
    }

    if (
      referenceAlignment >=
      80
    ) {
      reasons.push(
        "resolved_references_support_hypothesis"
      );
    } else if (
      referenceAlignment <=
      35
    ) {
      reasons.push(
        "reference_resolution_does_not_support_hypothesis"
      );
    }

    if (
      continuityAlignment >=
      80
    ) {
      reasons.push(
        "continuity_context_is_consistent"
      );
    } else if (
      continuityAlignment <=
      35
    ) {
      reasons.push(
        "continuity_context_is_inconsistent"
      );
    }

    if (
      evidenceStrength >=
      75
    ) {
      reasons.push(
        "strong_direct_evidence"
      );
    }

    if (
      completeness >=
      85
    ) {
      reasons.push(
        "required_semantic_slots_are_complete"
      );
    }

    if (
      contradictionPenalty >
      0
    ) {
      reasons.push(
        "contradicting_evidence_present"
      );
    }

    if (
      assumptionPenalty >
      8
    ) {
      reasons.push(
        "depends_on_weak_assumptions"
      );
    }

    if (
      unresolvedPenalty >
      8
    ) {
      reasons.push(
        "unresolved_semantic_items_present"
      );
    }

    if (
      policyPenalty >
      0
    ) {
      reasons.push(
        "operation_conflicts_with_action_policy"
      );
    }

    if (
      overlayPenalty >
      0
    ) {
      reasons.push(
        "overlay_hypothesis_cannot_become_primary_meaning"
      );
    }

    if (!reasons.length) {
      reasons.push(
        "moderate_overall_evidence_support"
      );
    }

    return reasons;
  },

  /* =====================================================
     RANKING + SELECTION
  ===================================================== */

  rankHypotheses(
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
            Number(
              right.canonicalScore ||
              0
            ) !==
            Number(
              left.canonicalScore ||
              0
            )
          ) {
            return (
              Number(
                right.canonicalScore ||
                0
              ) -
              Number(
                left.canonicalScore ||
                0
              )
            );
          }

          if (
            Number(
              right.canonicalConfidence ||
              0
            ) !==
            Number(
              left.canonicalConfidence ||
              0
            )
          ) {
            return (
              Number(
                right.canonicalConfidence ||
                0
              ) -
              Number(
                left.canonicalConfidence ||
                0
              )
            );
          }

          return (
            Number(
              right.score ||
              0
            ) -
            Number(
              left.score ||
              0
            )
          );
        }
      )
      .map(
        (
          hypothesis,
          index
        ) => ({
          ...hypothesis,

          canonicalRank:
            index + 1
        })
      );
  },

  selectCanonicalMeaning({
    ranked = [],
    hypothesisPacket = {},
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {},
    validation = {}
  } = {}) {
    if (!validation.valid) {
      return {
        selected:
          false,

        selectedHypothesis:
          null,

        decisionType:
          "selection_blocked",

        decisionReason:
          "Canonical meaning could not be selected because required hypothesis inputs were missing.",

        selectionConfidence:
          0,

        scoreGap:
          null,

        tied:
          false,

        blockedBy:
          validation.errors.map(
            error =>
              error.type
          )
      };
    }

    const eligible =
      ranked.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      );

    const first =
      eligible[0] ||
      null;

    const second =
      eligible[1] ||
      null;

    if (!first) {
      return {
        selected:
          false,

        selectedHypothesis:
          null,

        decisionType:
          "no_eligible_hypothesis",

        decisionReason:
          "No eligible primary semantic hypothesis was available.",

        selectionConfidence:
          0,

        scoreGap:
          null,

        tied:
          false,

        blockedBy: [
          "no_primary_hypothesis"
        ]
      };
    }

    const scoreGap =
      second
        ? Number(
            first.canonicalScore ||
            0
          ) -
          Number(
            second.canonicalScore ||
            0
          )
        : null;

    const exactTie =
      Boolean(
        second &&
        Math.abs(scoreGap) <
          0.001
      );

    const nearTie =
      Boolean(
        second &&
        scoreGap <=
          5
      );

    const unresolvedReferences =
      this.asArray(
        referenceResolution.decisions
      ).filter(
        decision =>
          decision.status !==
          "resolved"
      );

    const clarificationRequiredUpstream =
      hypothesisPacket
        .ambiguity
        ?.requiresClarification ===
        true ||
      requestInterpretation
        .ambiguity
        ?.requiresClarification ===
        true;

    if (
      exactTie &&
      unresolvedReferences.length
    ) {
      return {
        selected:
          false,

        selectedHypothesis:
          null,

        decisionType:
          "unresolved_tie",

        decisionReason:
          "The leading hypotheses were tied and the unresolved references prevent evidence-based selection.",

        selectionConfidence:
          0.25,

        scoreGap,

        tied:
          true,

        blockedBy: [
          "exact_hypothesis_tie",
          "unresolved_references"
        ],

        leadingHypothesisIds: [
          first.hypothesisId,
          second.hypothesisId
        ]
      };
    }

    if (
      nearTie &&
      clarificationRequiredUpstream &&
      first.canonicalConfidence <
        0.72
    ) {
      return {
        selected:
          false,

        selectedHypothesis:
          null,

        decisionType:
          "ambiguity_requires_clarification",

        decisionReason:
          "The evidence does not clearly separate the leading meanings and upstream ambiguity requires clarification.",

        selectionConfidence:
          first.canonicalConfidence,

        scoreGap,

        tied:
          exactTie,

        blockedBy: [
          "close_hypothesis_scores",
          "clarification_required"
        ],

        leadingHypothesisIds: [
          first.hypothesisId,
          second?.hypothesisId
        ].filter(Boolean)
      };
    }

    const selectedHypothesis = {
      ...first,

      selected:
        true,

      canonical:
        true
    };

    return {
      selected:
        true,

      selectedHypothesis,

      decisionType:
        nearTie
          ? "selected_with_residual_ambiguity"
          : "selected_by_evidence",

      decisionReason:
        this.buildSelectionReason({
          selected:
            selectedHypothesis,

          runnerUp:
            second,

          scoreGap,

          semanticStructure,
          requestInterpretation,
          referenceResolution
        }),

      selectionConfidence:
        this.calculateSelectionConfidence({
          selected:
            selectedHypothesis,

          runnerUp:
            second,

          scoreGap,

          unresolvedReferences,
          hypothesisPacket
        }),

      scoreGap,

      tied:
        exactTie,

      blockedBy: []
    };
  },

  buildSelectionReason({
    selected = {},
    runnerUp = null,
    scoreGap = null,
    requestInterpretation = {},
    referenceResolution = {}
  } = {}) {
    const reasons = [];

    const requestedOperation =
      this.normalizeOperation(
        requestInterpretation
          .requestedOperation
      );

    if (
      selected.operation ===
      requestedOperation
    ) {
      reasons.push(
        "it matches the interpreted requested operation"
      );
    }

    if (
      selected.adjudication
        ?.structureAlignment >=
      80
    ) {
      reasons.push(
        "it is strongly supported by the semantic structure"
      );
    }

    if (
      selected.adjudication
        ?.referenceAlignment >=
      80
    ) {
      reasons.push(
        "it is consistent with the resolved references"
      );
    }

    if (
      selected.adjudication
        ?.continuityAlignment >=
      80
    ) {
      reasons.push(
        "it preserves the correct prior context"
      );
    }

    if (
      selected.adjudication
        ?.evidenceStrength >=
      75
    ) {
      reasons.push(
        "it has the strongest direct evidence"
      );
    }

    if (
      selected.adjudication
        ?.policyPenalty ===
      0
    ) {
      reasons.push(
        "it does not violate the user's action authorization"
      );
    }

    const unresolvedReferences =
      this.asArray(
        referenceResolution.decisions
      ).filter(
        decision =>
          decision.status !==
          "resolved"
      ).length;

    if (
      unresolvedReferences ===
      0
    ) {
      reasons.push(
        "no unresolved reference contradicts it"
      );
    }

    const gapText =
      runnerUp &&
      scoreGap !==
        null
        ? ` It exceeded the next hypothesis by ${Number(
            scoreGap
          ).toFixed(2)} points.`
        : "";

    if (!reasons.length) {
      return (
        "It had the highest overall evidence-adjusted score." +
        gapText
      );
    }

    return (
      `It was selected because ${this.joinReasons(
        reasons
      )}.` +
      gapText
    );
  },

  calculateSelectionConfidence({
    selected = {},
    runnerUp = null,
    scoreGap = null,
    unresolvedReferences = [],
    hypothesisPacket = {}
  } = {}) {
    let confidence =
      this.normalizeConfidence(
        selected
          .canonicalConfidence
      );

    if (
      runnerUp &&
      scoreGap !==
        null
    ) {
      if (scoreGap >= 20) {
        confidence += 0.08;
      } else if (
        scoreGap >= 10
      ) {
        confidence += 0.04;
      } else if (
        scoreGap <= 5
      ) {
        confidence -= 0.1;
      }
    }

    if (
      unresolvedReferences.length
    ) {
      confidence -=
        Math.min(
          0.2,
          unresolvedReferences.length *
            0.06
        );
    }

    if (
      hypothesisPacket
        .ambiguity
        ?.present ===
      true
    ) {
      confidence -= 0.05;
    }

    return this.normalizeConfidence(
      confidence
    );
  },

  /* =====================================================
     REJECTED HYPOTHESES
  ===================================================== */

  buildRejectedHypotheses({
    ranked = [],
    selectedHypothesis = null,
    decision = {}
  } = {}) {
    return ranked
      .filter(
        hypothesis =>
          !selectedHypothesis ||
          hypothesis
            .hypothesisId !==
            selectedHypothesis
              .hypothesisId
      )
      .map(hypothesis => ({
        hypothesisId:
          hypothesis.hypothesisId,

        operation:
          hypothesis.operation,

        object:
          hypothesis.object ||
          null,

        domain:
          hypothesis.domain ||
          null,

        score:
          hypothesis.score,

        canonicalScore:
          hypothesis.canonicalScore,

        confidence:
          hypothesis.confidence,

        canonicalConfidence:
          hypothesis
            .canonicalConfidence,

        overlayOnly:
          hypothesis.overlayOnly ===
          true,

        rejectionReason:
          this.buildRejectionReason({
            hypothesis,
            selectedHypothesis,
            decision
          }),

        adjudication:
          hypothesis.adjudication,

        supportingEvidence:
          hypothesis
            .supportingEvidence,

        contradictingEvidence:
          hypothesis
            .contradictingEvidence,

        assumptions:
          hypothesis.assumptions,

        unresolved:
          hypothesis.unresolved,

        evidenceRefs:
          hypothesis.evidenceRefs,

        preserved:
          true
      }));
  },

  buildRejectionReason({
    hypothesis = {},
    selectedHypothesis = null,
    decision = {}
  } = {}) {
    if (
      hypothesis.overlayOnly ===
      true
    ) {
      return "This hypothesis is an overlay or contextual modifier and cannot become the primary canonical meaning.";
    }

    if (!selectedHypothesis) {
      return `No canonical meaning was selected because ${decision.decisionReason || "the evidence was insufficient"}.`;
    }

    const differences = [];

    if (
      hypothesis.adjudication
        ?.operationAlignment <
      selectedHypothesis
        .adjudication
        ?.operationAlignment
    ) {
      differences.push(
        "weaker operation alignment"
      );
    }

    if (
      hypothesis.adjudication
        ?.structureAlignment <
      selectedHypothesis
        .adjudication
        ?.structureAlignment
    ) {
      differences.push(
        "weaker semantic-structure support"
      );
    }

    if (
      hypothesis.adjudication
        ?.referenceAlignment <
      selectedHypothesis
        .adjudication
        ?.referenceAlignment
    ) {
      differences.push(
        "weaker reference-resolution support"
      );
    }

    if (
      hypothesis.adjudication
        ?.continuityAlignment <
      selectedHypothesis
        .adjudication
        ?.continuityAlignment
    ) {
      differences.push(
        "weaker continuity alignment"
      );
    }

    if (
      hypothesis.adjudication
        ?.contradictionPenalty >
      selectedHypothesis
        .adjudication
        ?.contradictionPenalty
    ) {
      differences.push(
        "more contradicting evidence"
      );
    }

    if (
      hypothesis.adjudication
        ?.unresolvedPenalty >
      selectedHypothesis
        .adjudication
        ?.unresolvedPenalty
    ) {
      differences.push(
        "more unresolved semantic items"
      );
    }

    if (
      hypothesis.adjudication
        ?.policyPenalty >
      selectedHypothesis
        .adjudication
        ?.policyPenalty
    ) {
      differences.push(
        "an action-policy conflict"
      );
    }

    if (!differences.length) {
      return "It had a lower total evidence-adjusted score than the selected canonical meaning.";
    }

    return (
      "It was not selected because it had " +
      this.joinReasons(
        differences
      ) +
      "."
    );
  },

  /* =====================================================
     AMBIGUITY
  ===================================================== */

  buildCanonicalAmbiguity({
    ranked = [],
    selectedHypothesis = null,
    hypothesisPacket = {},
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {},
    decision = {}
  } = {}) {
    const primary =
      ranked.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      );

    const first =
      primary[0] ||
      null;

    const second =
      primary[1] ||
      null;

    const scoreGap =
      first &&
      second
        ? Number(
            first.canonicalScore ||
            0
          ) -
          Number(
            second.canonicalScore ||
            0
          )
        : null;

    const closeCompetition =
      Boolean(
        first &&
        second &&
        scoreGap <=
          8
      );

    const unresolvedReferences =
      this.asArray(
        referenceResolution.decisions
      ).filter(
        decision =>
          decision.status !==
          "resolved"
      );

    const unresolvedSemanticItems =
      this.asArray(
        semanticStructure.unresolved
      );

    const upstreamReasons = [
      ...this.asArray(
        hypothesisPacket
          .ambiguity
          ?.reasons
      ),

      ...this.asArray(
        requestInterpretation
          .ambiguity
          ?.reasons
      )
    ];

    const remainingAmbiguity = [];

    if (closeCompetition) {
      remainingAmbiguity.push({
        type:
          "close_hypothesis_scores",

        leadingHypothesisId:
          first?.hypothesisId ||
          null,

        competingHypothesisId:
          second?.hypothesisId ||
          null,

        scoreGap,

        confidence:
          0.75
      });
    }

    unresolvedReferences.forEach(
      decisionItem => {
        remainingAmbiguity.push({
          type:
            decisionItem.status ===
              "ambiguous"
              ? "ambiguous_reference"
              : "unresolved_reference",

          referenceId:
            decisionItem
              .referenceId ||
            null,

          reference:
            decisionItem.reference ||
            decisionItem.surface ||
            null,

          candidates:
            this.asArray(
              decisionItem.candidates
            ),

          confidence:
            decisionItem.confidence ??
            0.5
        });
      }
    );

    unresolvedSemanticItems.forEach(
      item => {
        remainingAmbiguity.push({
          type:
            item.type ||
            "unresolved_semantic_item",

          value:
            this.nodeLabel(item),

          confidence:
            item.confidence ??
            0.5,

          raw:
            item
        });
      }
    );

    const selected =
      Boolean(
        selectedHypothesis
      );

    const resolved =
      selected &&
      remainingAmbiguity.length ===
        0;

    const requiresClarification =
      decision.decisionType ===
        "ambiguity_requires_clarification" ||
      decision.decisionType ===
        "unresolved_tie" ||
      requestInterpretation
        .ambiguity
        ?.requiresClarification ===
        true ||
      (
        !selected &&
        remainingAmbiguity.length >
          0
      );

    return {
      present:
        remainingAmbiguity.length >
        0 ||
        upstreamReasons.length >
        0,

      resolved,

      canonicalSelected:
        selected,

      requiresClarification,

      remainingAmbiguity,

      upstreamReasons: [
        ...new Set(
          upstreamReasons.filter(
            Boolean
          )
        )
      ],

      closeCompetition,

      scoreGap,

      leadingHypothesisId:
        first?.hypothesisId ||
        null,

      competingHypothesisId:
        second?.hypothesisId ||
        null,

      confidence:
        resolved
          ? 0.92
          : selected
            ? 0.72
            : 0.45
    };
  },

  /* =====================================================
     EVIDENCE SUMMARY
  ===================================================== */

  buildEvidenceSummary({
    selectedHypothesis = null,
    rejectedHypotheses = [],
    decision = {},
    ambiguity = {},
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {}
  } = {}) {
    if (!selectedHypothesis) {
      return {
        selectedHypothesisId:
          null,

        supportingEvidence: [],

        contradictingEvidence: [],

        decisionReason:
          decision.decisionReason ||
          "No canonical meaning was selected.",

        evidenceStrength:
          0,

        referenceConsistency:
          false,

        structureConsistency:
          false,

        operationConsistency:
          false,

        rejectedHypothesisCount:
          rejectedHypotheses.length,

        ambiguityResolved:
          ambiguity.resolved ===
          true
      };
    }

    return {
      selectedHypothesisId:
        selectedHypothesis
          .hypothesisId,

      supportingEvidence:
        selectedHypothesis
          .supportingEvidence,

      contradictingEvidence:
        selectedHypothesis
          .contradictingEvidence,

      decisionReason:
        decision.decisionReason,

      evidenceStrength:
        selectedHypothesis
          .adjudication
          ?.evidenceStrength ??
        0,

      referenceConsistency:
        selectedHypothesis
          .adjudication
          ?.referenceAlignment >=
        70,

      structureConsistency:
        selectedHypothesis
          .adjudication
          ?.structureAlignment >=
        70,

      operationConsistency:
        selectedHypothesis
          .adjudication
          ?.operationAlignment >=
        70,

      continuityConsistency:
        selectedHypothesis
          .adjudication
          ?.continuityAlignment >=
        70,

      actionPolicyConsistent:
        selectedHypothesis
          .adjudication
          ?.policyPenalty ===
        0,

      requestOperation:
        requestInterpretation
          .requestedOperation ||
        null,

      selectedOperation:
        selectedHypothesis
          .operation,

      semanticStructureSource:
        semanticStructure.source ||
        null,

      referenceResolutionSource:
        referenceResolution.source ||
        null,

      rejectedHypothesisCount:
        rejectedHypotheses.length,

      ambiguityResolved:
        ambiguity.resolved ===
        true
    };
  },

  /* =====================================================
     CANONICAL MEANING
  ===================================================== */

  buildCanonicalMeaning({
    selectedHypothesis = null,
    ranked = [],
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {},
    threadContext = {},
    ambiguity = {},
    evidenceSummary = {}
  } = {}) {
    if (!selectedHypothesis) {
      return null;
    }

    const overlayHypotheses =
      ranked.filter(
        hypothesis =>
          hypothesis.overlayOnly ===
          true
      );

    return {
      schema:
        "ari_canonical_meaning",

      version:
        this.schemaVersion,

      source:
        "ari-canonical-meaning-resolver",

      hypothesisId:
        selectedHypothesis
          .hypothesisId,

      selectedFromHypothesisCount:
        ranked.filter(
          hypothesis =>
            hypothesis.overlayOnly !==
            true
        ).length,

      operation:
        selectedHypothesis
          .operation,

      requestedOperation:
        selectedHypothesis
          .operation,

      requestFamily:
        selectedHypothesis
          .requestFamily ||
        this.requestFamilyFromOperation(
          selectedHypothesis
            .operation
        ),

      requestedOutput:
        selectedHypothesis
          .requestedOutput ||
        null,

      subject:
        selectedHypothesis
          .subject ||
        null,

      target:
        selectedHypothesis
          .target ||
        null,

      object:
        selectedHypothesis
          .object ||
        null,

      slots:
        selectedHypothesis
          .slots ||
        {},

      domain:
        selectedHypothesis
          .domain ||
        {
          primary:
            "general_understanding",

          secondary: [],

          scores: {},

          confidence:
            0.35
        },

      continuity:
        selectedHypothesis
          .continuity ||
        {
          usesPriorContext:
            false,

          inheritedNodeCount:
            0,

          resolvedReferenceCount:
            0,

          unresolvedReferenceCount:
            0,

          confidence:
            0
        },

      actionPolicy:
        selectedHypothesis
          .actionPolicy ||
        requestInterpretation
          .actionPolicy ||
        {
          executionAllowed:
            true,

          analysisOnly:
            false,

          prohibitedOperations:
            [],

          deferredOperations:
            []
        },

      executionAllowed:
        (
          selectedHypothesis
            .actionPolicy ||
          requestInterpretation
            .actionPolicy ||
          {}
        ).executionAllowed !==
        false,

      analysisOnly:
        (
          selectedHypothesis
            .actionPolicy ||
          requestInterpretation
            .actionPolicy ||
          {}
        ).analysisOnly ===
        true,

      prohibitedOperations:
        this.asArray(
          (
            selectedHypothesis
              .actionPolicy ||
            requestInterpretation
              .actionPolicy ||
            {}
          ).prohibitedOperations
        ),

      deferredOperations:
        this.asArray(
          (
            selectedHypothesis
              .actionPolicy ||
            requestInterpretation
              .actionPolicy ||
            {}
          ).deferredOperations
        ),

      emotionalOverlay:
        this.mergeOverlayHypotheses({
          selectedHypothesis,
          overlayHypotheses,
          semanticStructure
        }),

      contextModifiers:
        this.buildContextModifiers({
          selectedHypothesis,
          semanticStructure,
          threadContext
        }),

      constraints:
        this.asArray(
          selectedHypothesis
            .slots
            ?.constraints ||
          semanticStructure
            .constraints
        ),

      criteria:
        this.asArray(
          selectedHypothesis
            .slots
            ?.criteria ||
          semanticStructure
            .criteria
        ),

      stakes:
        this.asArray(
          selectedHypothesis
            .slots
            ?.stakes ||
          semanticStructure
            .stakes
        ),

      options:
        this.asArray(
          selectedHypothesis
            .slots
            ?.options ||
          semanticStructure
            .options
        ),

      quantities:
        this.asArray(
          selectedHypothesis
            .slots
            ?.quantities ||
          semanticStructure
            .quantities
        ),

      claims:
        this.asArray(
          selectedHypothesis
            .slots
            ?.claims ||
          semanticStructure
            .claims
        ),

      events:
        this.asArray(
          selectedHypothesis
            .slots
            ?.events ||
          semanticStructure
            .events
        ),

      relations:
        this.asArray(
          selectedHypothesis
            .slots
            ?.relations ||
          semanticStructure
            .relations
        ),

      negations:
        this.asArray(
          selectedHypothesis
            .slots
            ?.negations ||
          semanticStructure
            .negations
        ),

      references:
        this.asArray(
          semanticStructure.references
        ),

      referenceResolution: {
        decisions:
          this.asArray(
            referenceResolution
              .decisions
          ),

        resolvedReferences:
          this.asArray(
            referenceResolution
              .resolvedReferences
          ),

        unresolvedReferences:
          this.asArray(
            referenceResolution
              .unresolvedReferences
          ),

        confidence:
          referenceResolution
            .confidence ??
          0
      },

      assumptions:
        selectedHypothesis
          .assumptions,

      unresolved:
        selectedHypothesis
          .unresolved,

      evidenceRefs:
        selectedHypothesis
          .evidenceRefs,

      evidenceSummary,

      ambiguity,

      score:
        selectedHypothesis
          .canonicalScore,

      confidence:
        selectedHypothesis
          .canonicalConfidence,

      originalHypothesisScore:
        selectedHypothesis.score,

      originalHypothesisConfidence:
        selectedHypothesis
          .confidence,

      selectionRank:
        selectedHypothesis
          .canonicalRank,

      selected:
        true,

      canonical:
        true,

      semanticStructurePreserved:
        true,

      rawLanguageReinterpreted:
        false,

      authority: {
        canSelectCanonicalMeaning:
          true,

        canPreserveSemanticStructure:
          true,

        canPreserveAlternativeMeanings:
          true,

        canReportAmbiguity:
          true,

        canGenerateNewSemanticNodes:
          false,

        canReinterpretRawLanguage:
          false,

        canResolveReferences:
          false,

        canInterpretRequestedOperation:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseSafety:
          false,

        canWriteResponse:
          false,

        role:
          "canonical_semantic_meaning_selection_only"
      }
    };
  },

  mergeOverlayHypotheses({
    selectedHypothesis = {},
    overlayHypotheses = [],
    semanticStructure = {}
  } = {}) {
    const selectedOverlay =
      selectedHypothesis
        .emotionalOverlay ||
      {};

    const semanticSignals =
      this.asArray(
        semanticStructure
          .emotionalSignals
      );

    const overlaySignals =
      overlayHypotheses.flatMap(
        hypothesis =>
          this.asArray(
            hypothesis
              .emotionalOverlay
              ?.signals
          )
      );

    const states = [
      ...this.asArray(
        selectedOverlay.states
      ),

      ...overlayHypotheses.flatMap(
        hypothesis =>
          this.asArray(
            hypothesis
              .emotionalOverlay
              ?.states
          )
      ),

      ...semanticSignals.map(
        signal =>
          this.nodeLabel(
            signal
          )
      )
    ].filter(Boolean);

    const present =
      selectedOverlay.present ===
        true ||
      overlayHypotheses.length >
        0 ||
      semanticSignals.length >
        0;

    return {
      present,

      states: [
        ...new Set(states)
      ],

      primaryState:
        selectedOverlay
          .primaryState ||
        states[0] ||
        null,

      explicitSupportRequested:
        selectedHypothesis
          .operation ===
        "provide_emotional_support",

      role:
        selectedHypothesis
          .operation ===
        "provide_emotional_support"
          ? "primary_request"
          : "context_modifier",

      signals:
        this.dedupeNodes([
          ...this.asArray(
            selectedOverlay.signals
          ),

          ...overlaySignals,

          ...semanticSignals
        ]),

      confidence:
        Math.max(
          this.normalizeConfidence(
            selectedOverlay.confidence ??
            0
          ),

          ...overlayHypotheses.map(
            hypothesis =>
              this.normalizeConfidence(
                hypothesis
                  .canonicalConfidence ??
                hypothesis.confidence ??
                0
              )
          ),

          ...semanticSignals.map(
            signal =>
              this.normalizeConfidence(
                signal.confidence ??
                0
              )
          ),

          0
        )
    };
  },

  buildContextModifiers({
    selectedHypothesis = {},
    semanticStructure = {},
    threadContext = {}
  } = {}) {
    const modifiers = [];

    this.asArray(
      semanticStructure
        .discourseSignals
    ).forEach(signal => {
      modifiers.push({
        type:
          "discourse_signal",

        value:
          this.nodeLabel(signal),

        confidence:
          signal.confidence ??
          0.6,

        source:
          signal.source ||
          semanticStructure.source ||
          "semantic_structure",

        raw:
          signal
      });
    });

    this.asArray(
      semanticStructure
        .emotionalSignals
    ).forEach(signal => {
      modifiers.push({
        type:
          "emotional_context",

        value:
          this.nodeLabel(signal),

        confidence:
          signal.confidence ??
          0.65,

        source:
          signal.source ||
          semanticStructure.source ||
          "semantic_structure",

        raw:
          signal
      });
    });

    if (
      selectedHypothesis
        .continuity
        ?.usesPriorContext ===
      true
    ) {
      modifiers.push({
        type:
          "continuity_context",

        value:
          this.nodeLabel(
            threadContext.activeTopic ||
            threadContext.activeIssue ||
            "prior context"
          ),

        confidence:
          selectedHypothesis
            .continuity
            ?.confidence ??
          threadContext.confidence ??
          0.6,

        source:
          threadContext.source ||
          "thread_context"
      });
    }

    return this.dedupeNodes(
      modifiers
    );
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQualityReport({
    canonicalMeaning = null,
    ranked = [],
    ambiguity = {},
    validation = {},
    decision = {},
    hypothesisPacket = {}
  } = {}) {
    const warnings = [
      ...this.asArray(
        validation.warnings
      )
    ];

    if (!canonicalMeaning) {
      warnings.push({
        type:
          "canonical_meaning_not_selected",

        message:
          decision.decisionReason ||
          "No canonical meaning was selected."
      });
    }

    if (
      ambiguity.present ===
      true
    ) {
      warnings.push({
        type:
          "canonical_ambiguity_present",

        message:
          ambiguity
            .requiresClarification
            ? "Ambiguity remains and may require clarification."
            : "Residual ambiguity remains but a canonical meaning was selected.",

        reasons:
          ambiguity
            .remainingAmbiguity
      });
    }

    const primaryCount =
      ranked.filter(
        hypothesis =>
          hypothesis.overlayOnly !==
          true
      ).length;

    const selectedConfidence =
      canonicalMeaning
        ?.confidence ||
      0;

    const scoreGap =
      ambiguity.scoreGap;

    let score =
      selectedConfidence *
      0.62;

    if (
      primaryCount >= 2
    ) {
      score += 0.08;
    }

    if (
      canonicalMeaning
        ?.evidenceSummary
        ?.structureConsistency ===
      true
    ) {
      score += 0.08;
    }

    if (
      canonicalMeaning
        ?.evidenceSummary
        ?.referenceConsistency ===
      true
    ) {
      score += 0.07;
    }

    if (
      canonicalMeaning
        ?.evidenceSummary
        ?.operationConsistency ===
      true
    ) {
      score += 0.07;
    }

    if (
      canonicalMeaning
        ?.evidenceSummary
        ?.actionPolicyConsistent ===
      true
    ) {
      score += 0.04;
    }

    if (
      typeof scoreGap ===
        "number" &&
      scoreGap >= 10
    ) {
      score += 0.04;
    }

    if (
      ambiguity
        .requiresClarification ===
      true
    ) {
      score -= 0.18;
    }

    if (
      validation.valid !==
      true
    ) {
      score -= 0.3;
    }

    score =
      this.normalizeConfidence(
        score
      );

    return {
      healthy:
        Boolean(
          canonicalMeaning
        ) &&
        validation.valid ===
          true,

      score,

      confidence:
        score,

      canonicalSelected:
        Boolean(
          canonicalMeaning
        ),

      selectedHypothesisId:
        canonicalMeaning
          ?.hypothesisId ||
        null,

      selectedConfidence,

      primaryHypothesisCount:
        primaryCount,

      totalHypothesisCount:
        ranked.length,

      ambiguityPresent:
        ambiguity.present ===
        true,

      ambiguityResolved:
        ambiguity.resolved ===
        true,

      clarificationRequired:
        ambiguity
          .requiresClarification ===
        true,

      hypothesisPacketHealthy:
        hypothesisPacket
          .quality
          ?.healthy !==
        false,

      validation,

      warnings
    };
  },

  /* =====================================================
     PACKET
  ===================================================== */

  buildCanonicalPacket({
    hypothesisPacket = {},
    semanticStructure = {},
    requestInterpretation = {},
    referenceResolution = {},
    threadContext = {},
    ranked = [],
    canonicalMeaning = null,
    rejectedHypotheses = [],
    ambiguity = {},
    evidenceSummary = {},
    validation = {},
    quality = {},
    decision = {}
  } = {}) {
    return {
      schema:
        "ari_canonical_meaning_resolution",

      version:
        this.schemaVersion,

      engineVersion:
        this.version,

      source:
        "ari-canonical-meaning-resolver",

      ran:
        true,

      selected:
        Boolean(
          canonicalMeaning
        ),

      selectionStatus:
        canonicalMeaning
          ? "selected"
          : "not_selected",

      decisionType:
        decision.decisionType,

      decisionReason:
        decision.decisionReason,

      selectionConfidence:
        decision
          .selectionConfidence,

      scoreGap:
        decision.scoreGap,

      hypothesisInput: {
        schema:
          hypothesisPacket.schema ||
          null,

        version:
          hypothesisPacket.version ||
          null,

        source:
          hypothesisPacket.source ||
          null,

        hypothesisCount:
          ranked.length,

        primaryHypothesisCount:
          ranked.filter(
            hypothesis =>
              hypothesis.overlayOnly !==
              true
          ).length,

        overlayHypothesisCount:
          ranked.filter(
            hypothesis =>
              hypothesis.overlayOnly ===
              true
          ).length
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
            .entities.length,

        eventCount:
          semanticStructure
            .events.length,

        claimCount:
          semanticStructure
            .claims.length,

        relationCount:
          semanticStructure
            .relations.length,

        quantityCount:
          semanticStructure
            .quantities.length,

        optionCount:
          semanticStructure
            .options.length,

        unresolvedCount:
          semanticStructure
            .unresolved.length
      },

      requestInput: {
        requestedOperation:
          requestInterpretation
            .requestedOperation ||
          null,

        proposedOperation:
          requestInterpretation
            .proposedOperation ||
          null,

        requestedOutput:
          requestInterpretation
            .requestedOutput ||
          null,

        actionPolicy:
          requestInterpretation
            .actionPolicy ||
          null,

        ambiguity:
          requestInterpretation
            .ambiguity ||
          null
      },

      contextInput: {
        referenceResolutionAvailable:
          referenceResolution.ran !==
          false,

        referenceDecisionCount:
          this.asArray(
            referenceResolution
              .decisions
          ).length,

        threadContextAvailable:
          threadContext.ran !==
          false,

        activeTopic:
          threadContext.activeTopic ||
          threadContext.currentTopic ||
          null,

        activeIssue:
          threadContext.activeIssue ||
          null
      },

      rankedHypotheses:
        ranked,

      canonicalMeaning,

      rejectedHypotheses,

      ambiguity,

      evidenceSummary,

      validation,

      quality,

      readyForSemanticFrameBuilder:
        Boolean(
          canonicalMeaning
        ) &&
        ambiguity
          .requiresClarification !==
        true,

      semanticFrameBuilderMayProceed:
        Boolean(
          canonicalMeaning
        ),

      requiresClarification:
        ambiguity
          .requiresClarification ===
        true,

      selectedHypothesisId:
        canonicalMeaning
          ?.hypothesisId ||
        null,

      confidence:
        quality.confidence,

      authority: {
        canSelectCanonicalMeaning:
          true,

        canRejectUnsupportedHypotheses:
          true,

        canPreserveRejectedHypotheses:
          true,

        canReportAmbiguity:
          true,

        canReinterpretRawLanguage:
          false,

        canGenerateSemanticStructure:
          false,

        canResolveReferences:
          false,

        canInterpretRequestedOperation:
          false,

        canChooseSemanticFrame:
          false,

        canChooseConversationFunction:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseSafety:
          false,

        canWriteFinalResponse:
          false,

        role:
          "canonical_semantic_meaning_adjudication_only"
      }
    };
  },

  buildReturnPayload(
    packet = {}
  ) {
    return {
      canonicalMeaningResolverRan:
        true,

      canonicalMeaningResolverVersion:
        this.version,

      canonicalMeaningResolverSource:
        "ari-canonical-meaning-resolver",

      canonicalMeaningPacket:
        packet,

      canonicalMeaningResolution:
        packet,

      canonicalMeaning:
        packet.canonicalMeaning,

      selectedCanonicalMeaning:
        packet.canonicalMeaning,

      selectedHypothesisId:
        packet.selectedHypothesisId,

      canonicalMeaningSelected:
        packet.selected ===
        true,

      rejectedMeaningHypotheses:
        packet.rejectedHypotheses,

      canonicalMeaningAmbiguity:
        packet.ambiguity,

      canonicalMeaningEvidenceSummary:
        packet.evidenceSummary,

      canonicalMeaningQuality:
        packet.quality,

      readyForSemanticFrameBuilder:
        packet
          .readyForSemanticFrameBuilder,

      requiresMeaningClarification:
        packet
          .requiresClarification,

      confidence:
        packet.confidence,

      warnings:
        packet.quality
          ?.warnings ||
        [],

      authority:
        "canonical_semantic_meaning_adjudication_only"
    };
  },

  /* =====================================================
     OPERATION HELPERS
  ===================================================== */

  operationsCompatible(
    first = "",
    second = ""
  ) {
    const a =
      this.normalizeOperation(
        first
      );

    const b =
      this.normalizeOperation(
        second
      );

    if (!a || !b) {
      return false;
    }

    if (a === b) {
      return true;
    }

    const groups = [
      [
        "provide_information",
        "explain"
      ],

      [
        "compare",
        "evaluate",
        "recommend",
        "prioritize"
      ],

      [
        "modify_artifact",
        "implement",
        "debug"
      ],

      [
        "inspect",
        "verify",
        "review"
      ],

      [
        "calculate",
        "convert"
      ],

      [
        "provide_emotional_support",
        "respond_supportively"
      ],

      [
        "continue_context",
        "retrieve_prior_context"
      ],

      [
        "generate_text",
        "produce_or_revise_text"
      ]
    ];

    return groups.some(
      group =>
        group.includes(a) &&
        group.includes(b)
    );
  },

  isExecutionOperation(
    operation = ""
  ) {
    const normalized =
      this.normalizeOperation(
        operation
      );

    return [
      "modify_artifact",
      "implement",
      "create_artifact",
      "generate_artifact",
      "write_code",
      "rewrite_code",
      "apply_patch",
      "edit_file",
      "replace_code",
      "send_email",
      "create_event"
    ].some(
      item =>
        this.operationsCompatible(
          normalized,
          item
        ) ||
        normalized === item
    );
  },

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

      produce_or_revise_text:
        "writing",

      create_artifact:
        "creation",

      modify_artifact:
        "developer_task",

      implement:
        "developer_task",

      inspect:
        "verification",

      review:
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

      retrieve_prior_context:
        "continuity",

      interpret_or_correct:
        "correction",

      respond:
        "general"
    };

    return map[normalized] ||
      "general";
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

      direct_information:
        "provide_information",

      answer:
        "provide_information",

      provide_information:
        "provide_information",

      explanation:
        "explain",

      explain_or_teach:
        "explain",

      comparison:
        "compare",

      recommendation:
        "recommend",

      decide_or_prioritize:
        "recommend",

      prioritization:
        "prioritize",

      planning:
        "plan",

      create_plan:
        "plan",

      writing:
        "generate_text",

      produce_or_revise_text:
        "generate_text",

      creation:
        "create_artifact",

      modification:
        "modify_artifact",

      implement_or_modify:
        "modify_artifact",

      implementation:
        "implement",

      review:
        "inspect",

      verify_or_review:
        "verify",

      debugging:
        "debug",

      verification:
        "verify",

      calculation:
        "calculate",

      calculate_or_convert:
        "calculate",

      conversion:
        "convert",

      translation:
        "translate",

      summarization:
        "summarize",

      emotional_support:
        "provide_emotional_support",

      provide_emotional_support:
        "provide_emotional_support",

      opinion:
        "provide_opinion",

      identity:
        "answer_identity_question",

      continuation:
        "continue_context",

      continue_prior_context:
        "continue_context",

      correction:
        "interpret_or_correct"
    };

    return aliases[normalized] ||
      normalized;
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  semanticTextMatch(
    first = "",
    second = ""
  ) {
    const a =
      this.normalize(first);

    const b =
      this.normalize(second);

    if (!a || !b) {
      return false;
    }

    if (
      a === b ||
      a.includes(b) ||
      b.includes(a)
    ) {
      return true;
    }

    const aTokens =
      new Set(
        a
          .split(/\s+/)
          .filter(
            token =>
              token.length >= 3
          )
      );

    const bTokens =
      new Set(
        b
          .split(/\s+/)
          .filter(
            token =>
              token.length >= 3
          )
      );

    if (
      !aTokens.size ||
      !bTokens.size
    ) {
      return false;
    }

    let overlap = 0;

    aTokens.forEach(token => {
      if (bTokens.has(token)) {
        overlap += 1;
      }
    });

    return (
      overlap /
      Math.min(
        aTokens.size,
        bTokens.size
      )
    ) >= 0.6;
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
      value.text ||
      ""
    );
  },

  dedupeNodes(
    values = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      values
    ).filter(value => {
      const key =
        [
          value?.type ||
            value?.kind ||
            "unknown",

          this.nodeLabel(value),

          value?.source ||
            "unknown"
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

  joinReasons(
    reasons = []
  ) {
    const clean =
      this.asArray(
        reasons
      )
        .map(reason =>
          String(
            reason ||
            ""
          ).trim()
        )
        .filter(Boolean);

    if (!clean.length) {
      return "";
    }

    if (
      clean.length ===
      1
    ) {
      return clean[0];
    }

    if (
      clean.length ===
      2
    ) {
      return `${clean[0]} and ${clean[1]}`;
    }

    return (
      clean
        .slice(
          0,
          -1
        )
        .join(", ") +
      `, and ${clean[
        clean.length -
        1
      ]}`
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

  normalizeScore(
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
      number >= 0 &&
      number <= 1
    ) {
      return number * 100;
    }

    return this.clampScore(
      number
    );
  },

  clampScore(
    value = 0
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Number(
          number.toFixed(2)
        )
      )
    );
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
  }
};

window.Ari.canonicalMeaningResolver =
  window.AriCanonicalMeaningResolver;

console.log(
  "ARI CANONICAL MEANING RESOLVER LOADED:",
  window.AriCanonicalMeaningResolver?.version
);