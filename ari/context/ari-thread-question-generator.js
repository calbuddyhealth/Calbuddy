// ari/context/ari-thread-question-generator.js
// Ari Thread Question Generator
// Purpose: Preserve the exact current turn and expose canonical reference-resolution results.
// V3.0.0 — Resolved Turn Handoff / No Text Rewriting / No Anchor Guessing / No Semantic Authority

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "3.0.0",
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

    const referenceResolution =
      this.readReferenceResolution(summary);

    const resolvedSemanticStructure =
      this.readResolvedSemanticStructure({
        summary,
        referenceResolution
      });

    const referenceStatus =
      this.analyzeReferenceStatus({
        referenceResolution,
        resolvedSemanticStructure
      });

    const semanticHandoff =
      this.buildSemanticHandoff({
        currentTurn,
        referenceResolution,
        resolvedSemanticStructure,
        referenceStatus
      });

    const resolvedTurn =
      this.buildResolvedTurn({
        currentTurn,
        referenceResolution,
        resolvedSemanticStructure,
        referenceStatus,
        semanticHandoff
      });

    const result =
      this.buildResult({
        currentTurn,
        referenceResolution,
        resolvedSemanticStructure,
        referenceStatus,
        semanticHandoff,
        resolvedTurn
      });

    window.Ari.resolvedCurrentTurn =
      resolvedTurn;

    window.Ari.threadQuestionResolution =
      result;

    return result;
  },

  /* =====================================================
     CURRENT TURN
  ===================================================== */

  readCurrentTurn(summary = {}) {
    const rawText =
      this.cleanOriginal(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
      );

    return {
      turnId:
        summary.turnId ||
        summary.semanticStructure
          ?.turnId ||
        summary.currentSemanticStructure
          ?.turnId ||
        summary.referenceResolution
          ?.turnId ||
        this.createStableId(
          "turn",
          rawText
        ),

      rawText,

      normalizedText:
        this.normalize(rawText),

      wordCount:
        this.normalize(rawText)
          .split(/\s+/)
          .filter(Boolean)
          .length,

      isQuestion:
        this.isQuestion(rawText),

      isEmpty:
        rawText.length === 0,

      preservedExactly:
        true
    };
  },

  isQuestion(text = "") {
    const normalized =
      this.normalize(text);

    return (
      String(text).includes("?") ||
      /^(what|why|how|when|where|who|which|is|are|am|do|does|did|can|could|should|would|will|was|were|has|have|had)\b/.test(
        normalized
      )
    );
  },

  /* =====================================================
     REFERENCE RESOLUTION READING
  ===================================================== */

  readReferenceResolution(summary = {}) {
    const candidates = [
      summary.referenceResolution,

      summary.entityReferenceState
        ?.referenceResolution,

      summary.entityReferenceState,

      summary.subjectGraphState
        ?.referenceResolution,

      summary.subjectGraphState,

      summary.entityReferenceResolution,

      summary.referenceResolutionResult,

      window.Ari.referenceResolution,

      window.Ari.entityReferenceState
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
          ) ||
          candidate.resolvedSemanticStructure
        )
      );

    if (!found) {
      return this.emptyReferenceResolution();
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
        ),

      quality:
        found.quality ||
        {}
    };
  },

  emptyReferenceResolution() {
    return {
      schema:
        "ari_reference_resolution",

      version:
        null,

      engineVersion:
        null,

      source:
        "not_available",

      ran:
        false,

      turnId:
        null,

      decisions: [],
      resolvedReferences: [],
      unresolvedReferences: [],

      resolvedSemanticStructure:
        null,

      confidence:
        0,

      quality: {
        referenceCount:
          0,

        resolvedCount:
          0,

        ambiguousCount:
          0,

        unresolvedCount:
          0,

        resolutionRate:
          1,

        warnings: []
      },

      authority: {
        canResolveReferences:
          false,

        role:
          "reference_resolution_unavailable"
      }
    };
  },

  readResolvedSemanticStructure({
    summary = {},
    referenceResolution = {}
  } = {}) {
    const candidates = [
      referenceResolution
        .resolvedSemanticStructure,

      summary
        .resolvedSemanticStructure,

      summary
        .currentSemanticStructure,

      summary
        .semanticStructure,

      window.Ari
        .resolvedSemanticStructure
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
            candidate.references
          )
        )
      );

    if (!found) {
      return null;
    }

    return {
      ...found,

      entities:
        this.asArray(
          found.entities
        ),

      events:
        this.asArray(
          found.events
        ),

      claims:
        this.asArray(
          found.claims
        ),

      attributes:
        this.asArray(
          found.attributes
        ),

      quantities:
        this.asArray(
          found.quantities
        ),

      relations:
        this.asArray(
          found.relations
        ),

      references:
        this.asArray(
          found.references
        ),

      options:
        this.asArray(
          found.options
        ),

      criteria:
        this.asArray(
          found.criteria
        ),

      constraints:
        this.asArray(
          found.constraints
        ),

      stakes:
        this.asArray(
          found.stakes
        ),

      inheritedNodes:
        this.asArray(
          found.inheritedNodes
        ),

      unresolved:
        this.asArray(
          found.unresolved
        )
    };
  },

  /* =====================================================
     REFERENCE STATUS
  ===================================================== */

  analyzeReferenceStatus({
    referenceResolution = {},
    resolvedSemanticStructure = null
  } = {}) {
    const decisions =
      this.asArray(
        referenceResolution.decisions
      );

    const resolved =
      decisions.filter(decision =>
        decision.status ===
        "resolved"
      );

    const ambiguous =
      decisions.filter(decision =>
        decision.status ===
        "ambiguous"
      );

    const unresolved =
      decisions.filter(decision =>
        decision.status ===
        "unresolved"
      );

    const referenceCount =
      decisions.length ||
      this.asArray(
        resolvedSemanticStructure
          ?.references
      ).length;

    const hasReferences =
      referenceCount > 0;

    const allResolved =
      hasReferences &&
      resolved.length ===
        referenceCount;

    const partiallyResolved =
      resolved.length > 0 &&
      resolved.length <
        referenceCount;

    const requiresClarification =
      ambiguous.length > 0 ||
      unresolved.length > 0;

    const status =
      !hasReferences
        ? "no_references"
        : allResolved
          ? "resolved"
          : partiallyResolved
            ? "partially_resolved"
            : ambiguous.length > 0
              ? "ambiguous"
              : "unresolved";

    return {
      status,

      referenceCount,

      resolvedCount:
        resolved.length,

      ambiguousCount:
        ambiguous.length,

      unresolvedCount:
        unresolved.length,

      hasReferences,

      allResolved,

      partiallyResolved,

      requiresClarification,

      resolvedReferenceIds:
        resolved
          .map(decision =>
            decision.referenceId
          )
          .filter(Boolean),

      ambiguousReferenceIds:
        ambiguous
          .map(decision =>
            decision.referenceId
          )
          .filter(Boolean),

      unresolvedReferenceIds:
        unresolved
          .map(decision =>
            decision.referenceId
          )
          .filter(Boolean),

      confidence:
        this.calculateResolutionConfidence({
          referenceResolution,
          decisions,
          resolved,
          ambiguous,
          unresolved,
          referenceCount
        })
    };
  },

  calculateResolutionConfidence({
    referenceResolution = {},
    resolved = [],
    ambiguous = [],
    unresolved = [],
    referenceCount = 0
  } = {}) {
    if (!referenceCount) {
      return 1;
    }

    const declaredConfidence =
      this.normalizeConfidence(
        referenceResolution.confidence
      );

    const resolutionScore =
      (
        resolved.length *
          1 +
        ambiguous.length *
          0.35
      ) /
      referenceCount;

    const unresolvedPenalty =
      unresolved.length /
      referenceCount *
      0.25;

    const combined =
      declaredConfidence > 0
        ? (
            declaredConfidence *
              0.55 +
            resolutionScore *
              0.45 -
            unresolvedPenalty
          )
        : (
            resolutionScore -
            unresolvedPenalty
          );

    return this.normalizeConfidence(
      combined
    );
  },

  /* =====================================================
     SEMANTIC HANDOFF
  ===================================================== */

  buildSemanticHandoff({
    currentTurn = {},
    referenceResolution = {},
    resolvedSemanticStructure = null,
    referenceStatus = {}
  } = {}) {
    return {
      schema:
        "ari_resolved_turn_semantic_handoff",

      version:
        this.schemaVersion,

      source:
        "ari-thread-question-generator",

      turnId:
        currentTurn.turnId,

      rawText:
        currentTurn.rawText,

      normalizedText:
        currentTurn.normalizedText,

      semanticStructure:
        resolvedSemanticStructure,

      referenceResolution: {
        ran:
          referenceResolution.ran ===
          true,

        source:
          referenceResolution.source ||
          null,

        version:
          referenceResolution.version ||
          referenceResolution.engineVersion ||
          null,

        status:
          referenceStatus.status,

        referenceCount:
          referenceStatus.referenceCount,

        resolvedCount:
          referenceStatus.resolvedCount,

        ambiguousCount:
          referenceStatus.ambiguousCount,

        unresolvedCount:
          referenceStatus.unresolvedCount,

        requiresClarification:
          referenceStatus.requiresClarification,

        confidence:
          referenceStatus.confidence,

        decisions:
          this.asArray(
            referenceResolution.decisions
          )
      },

      inheritedNodes:
        this.asArray(
          resolvedSemanticStructure
            ?.inheritedNodes
        ),

      unresolvedSemanticItems:
        this.asArray(
          resolvedSemanticStructure
            ?.unresolved
        ),

      readyForRequestInterpretation:
        Boolean(
          resolvedSemanticStructure
        ) &&
        !referenceStatus
          .requiresClarification,

      conditionallyReady:
        Boolean(
          resolvedSemanticStructure
        ) &&
        referenceStatus
          .requiresClarification,

      authority: {
        canPreserveCurrentTurn:
          true,

        canExposeResolvedReferences:
          true,

        canExposeUnresolvedReferences:
          true,

        canRewriteUserText:
          false,

        canChooseIntent:
          false,

        canChooseRequestedOperation:
          false,

        canChooseCanonicalMeaning:
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
          "resolved_turn_semantic_handoff_only"
      }
    };
  },

  /* =====================================================
     RESOLVED TURN
  ===================================================== */

  buildResolvedTurn({
    currentTurn = {},
    referenceResolution = {},
    resolvedSemanticStructure = null,
    referenceStatus = {},
    semanticHandoff = {}
  } = {}) {
    return {
      schema:
        "ari_resolved_current_turn",

      version:
        this.schemaVersion,

      source:
        "ari-thread-question-generator",

      turnId:
        currentTurn.turnId,

      rawText:
        currentTurn.rawText,

      preservedText:
        currentTurn.rawText,

      resolvedText:
        currentTurn.rawText,

      normalizedText:
        currentTurn.normalizedText,

      textWasRewritten:
        false,

      currentTurnWasResolved:
        referenceStatus
          .resolvedCount > 0,

      semanticReferencesResolved:
        referenceStatus
          .resolvedCount > 0,

      usedThreadContext:
        this.usedPriorContext(
          referenceResolution
        ),

      referenceStatus:
        referenceStatus.status,

      referenceCount:
        referenceStatus.referenceCount,

      resolvedReferenceCount:
        referenceStatus.resolvedCount,

      ambiguousReferenceCount:
        referenceStatus.ambiguousCount,

      unresolvedReferenceCount:
        referenceStatus.unresolvedCount,

      requiresClarification:
        referenceStatus
          .requiresClarification,

      confidence:
        referenceStatus.confidence,

      resolvedSemanticStructure,

      semanticHandoff,

      resolutionDecisions:
        this.asArray(
          referenceResolution.decisions
        ),

      reason:
        this.buildResolutionReason({
          referenceStatus,
          resolvedSemanticStructure
        }),

      authority: {
        canPreserveOriginalText:
          true,

        canAttachResolvedMeaning:
          true,

        canRewriteOriginalText:
          false,

        canInterpretIntent:
          false,

        canChooseOperation:
          false,

        canChooseFrame:
          false,

        canAnswerUser:
          false,

        role:
          "resolved_current_turn_handoff_only"
      }
    };
  },

  usedPriorContext(
    referenceResolution = {}
  ) {
    return this.asArray(
      referenceResolution.decisions
    ).some(decision =>
      this.asArray(
        decision.candidates
      ).some(candidate =>
        candidate.semanticRef ===
          decision.resolvedTo &&
        Number(
          candidate.turnDistance ||
          0
        ) > 0
      )
    );
  },

  buildResolutionReason({
    referenceStatus = {},
    resolvedSemanticStructure = null
  } = {}) {
    if (
      !resolvedSemanticStructure
    ) {
      return "No canonical semantic structure was available. The original user turn was preserved exactly.";
    }

    switch (
      referenceStatus.status
    ) {
      case "no_references":
        return "The current turn contained no canonical references requiring resolution. The original wording was preserved exactly.";

      case "resolved":
        return "All canonical references were resolved structurally. The original wording was preserved exactly.";

      case "partially_resolved":
        return "Some canonical references were resolved, while others remain unresolved or ambiguous. The original wording was preserved exactly.";

      case "ambiguous":
        return "One or more canonical references had competing candidates and were left ambiguous. The original wording was preserved exactly.";

      case "unresolved":
        return "One or more canonical references could not be safely resolved. The original wording was preserved exactly.";

      default:
        return "The current turn was preserved exactly and semantic reference status was attached separately.";
    }
  },

  /* =====================================================
     RESULT
  ===================================================== */

  buildResult({
    currentTurn = {},
    referenceResolution = {},
    resolvedSemanticStructure = null,
    referenceStatus = {},
    semanticHandoff = {},
    resolvedTurn = {}
  } = {}) {
    return {
      threadQuestionGeneratorRan:
        true,

      threadQuestionGeneratorVersion:
        this.version,

      threadQuestionGeneratorSource:
        "ari-thread-question-generator",

      source:
        "ari-thread-question-generator",

      rawUserMessage:
        currentTurn.rawText,

      /*
       * Compatibility field only.
       *
       * It deliberately remains identical to the user's
       * original message. Semantic resolution is carried
       * in resolvedCurrentTurn and semanticHandoff.
       */
      resolvedUserQuestion:
        currentTurn.rawText,

      preservedUserQuestion:
        currentTurn.rawText,

      textWasRewritten:
        false,

      currentTurnWasResolved:
        resolvedTurn
          .currentTurnWasResolved,

      usedThreadContext:
        resolvedTurn
          .usedThreadContext,

      resolvedSubject:
        this.readCompatibilityResolvedSubject({
          referenceResolution,
          resolvedSemanticStructure
        }),

      inheritedTopicSource:
        resolvedTurn
          .usedThreadContext
          ? "canonical_reference_resolution"
          : null,

      inheritedTopicScore:
        resolvedTurn
          .usedThreadContext
          ? referenceStatus.confidence
          : null,

      operation:
        referenceStatus.hasReferences
          ? "semantic_reference_handoff"
          : "preserve_current_turn",

      resolutionType:
        referenceStatus.hasReferences
          ? "structured_reference_resolution"
          : "none",

      confidence:
        referenceStatus.confidence,

      reason:
        resolvedTurn.reason,

      threadQuestionResolutionType:
        referenceStatus.hasReferences
          ? "structured_reference_resolution"
          : "none",

      threadQuestionConfidence:
        referenceStatus.confidence,

      threadQuestionReason:
        resolvedTurn.reason,

      referenceStatus:
        referenceStatus.status,

      referenceResolution,

      resolvedSemanticStructure,

      semanticHandoff,

      resolvedCurrentTurn:
        resolvedTurn,

      readyForRequestInterpretation:
        semanticHandoff
          .readyForRequestInterpretation,

      requiresReferenceClarification:
        referenceStatus
          .requiresClarification,

      warnings:
        this.buildWarnings({
          referenceResolution,
          referenceStatus,
          resolvedSemanticStructure
        }),

      authority: {
        canPreserveUserText:
          true,

        canExposeReferenceResolution:
          true,

        canRewriteUserQuestion:
          false,

        canSelectAnchor:
          false,

        canGuessInheritedTopic:
          false,

        canChooseLane:
          false,

        canAnswerUser:
          false,

        canOverrideSafety:
          false,

        canSetContract:
          false,

        canInterpretIntent:
          false,

        canChooseRequestedOperation:
          false,

        canChooseSemanticFrame:
          false,

        role:
          "resolved_turn_compatibility_handoff_only"
      }
    };
  },

  readCompatibilityResolvedSubject({
    referenceResolution = {},
    resolvedSemanticStructure = null
  } = {}) {
    const resolvedDecision =
      this.asArray(
        referenceResolution.decisions
      ).find(decision =>
        decision.status ===
        "resolved"
      );

    if (
      resolvedDecision
        ?.resolvedTo
    ) {
      return resolvedDecision
        .resolvedTo;
    }

    const firstInheritedNode =
      this.asArray(
        resolvedSemanticStructure
          ?.inheritedNodes
      )[0];

    return (
      firstInheritedNode
        ?.semanticRef ||
      null
    );
  },

  buildWarnings({
    referenceResolution = {},
    referenceStatus = {},
    resolvedSemanticStructure = null
  } = {}) {
    const warnings = [
      ...this.asArray(
        referenceResolution
          .quality
          ?.warnings
      )
    ];

    if (
      !resolvedSemanticStructure
    ) {
      warnings.push({
        type:
          "resolved_semantic_structure_missing",

        message:
          "No resolved semantic structure was available for the current turn."
      });
    }

    if (
      referenceStatus
        .ambiguousCount > 0
    ) {
      warnings.push({
        type:
          "reference_ambiguity",

        count:
          referenceStatus
            .ambiguousCount,

        referenceIds:
          referenceStatus
            .ambiguousReferenceIds,

        message:
          "One or more references have multiple defensible candidates."
      });
    }

    if (
      referenceStatus
        .unresolvedCount > 0
    ) {
      warnings.push({
        type:
          "unresolved_reference",

        count:
          referenceStatus
            .unresolvedCount,

        referenceIds:
          referenceStatus
            .unresolvedReferenceIds,

        message:
          "One or more references could not be safely resolved."
      });
    }

    return this.dedupeWarnings(
      warnings
    );
  },

  /* =====================================================
     HELPERS
  ===================================================== */

  dedupeWarnings(
    warnings = []
  ) {
    const seen =
      new Set();

    return this.asArray(
      warnings
    ).filter(warning => {
      if (!warning) {
        return false;
      }

      const key =
        [
          warning.type ||
            "warning",

          warning.message ||
            "",

          warning.count ??
            ""
        ].join("|");

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    });
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

window.AriThreadQuestionGenerator =
  window.Ari.threadQuestionGenerator;

console.log(
  "ARI THREAD QUESTION GENERATOR LOADED:",
  window.Ari.threadQuestionGenerator?.version
);