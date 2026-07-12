// ari/conversation/ari-conversation-function-engine.js
// Ari Conversation Function Engine
// Purpose:
//   Determine what functional purpose the current conversation serves
//   after upstream perception and semantic meaning have been constructed.
//
// Responsibilities:
//   - Read structured upstream meaning.
//   - Identify the primary conversational function.
//   - Preserve meaningful secondary functions.
//   - Describe the functional response contract.
//   - Report confidence, evidence, and unresolved uncertainty.
//
// Non-responsibilities:
//   - Does not reinterpret raw user language.
//   - Does not determine final safety severity.
//   - Does not choose a lane, route, planner, model, or capability.
//   - Does not compose or answer the user.
//   - Does not block downstream systems.
//   - Does not replace Semantic Frame Builder or Reconciliation.
//
// V3.0.0 — Structured Meaning Consumer / Single Responsibility / Reconciliation Ready

window.Ari = window.Ari || {};

window.AriConversationFunctionEngine = {
  version: "3.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  analyze(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const sources =
      this.readSources(summary);

    const candidates =
      this.buildCandidates(sources);

    const rankedFunctions =
      this.rankCandidates(
        candidates,
        sources
      );

    const primary =
      rankedFunctions[0] ||
      this.defaultFunction();

    const secondaryFunctions =
      rankedFunctions
        .slice(1)
        .filter(candidate =>
          candidate.score >= 42
        )
        .slice(0, 6);

    const functionAgreement =
      this.buildFunctionAgreement({
        primary,
        sources
      });

    const confidence =
      this.calculateConfidence({
        primary,
        secondaryFunctions,
        functionAgreement,
        sources
      });

    const responseContract =
      this.buildResponseContract({
        primary,
        secondaryFunctions,
        sources
      });

    const handoff =
      this.buildHandoff({
        primary,
        secondaryFunctions,
        rankedFunctions,
        responseContract,
        functionAgreement,
        confidence,
        sources
      });

    return {
      conversationFunctionRan: true,

      conversationFunctionVersion:
        this.version,

      conversationFunctionSource:
        "ari-conversation-function-engine",

      advisoryOnly: true,
      routingAuthority: false,
      planningAuthority: false,
      composerAuthority: false,
      finalAnswerAuthority: false,
      safetyAuthority: false,

      primaryFunction:
        primary.name,

      primaryFunctionFamily:
        primary.family,

      primaryFunctionReason:
        primary.reason,

      secondaryFunctions:
        secondaryFunctions.map(
          candidate => ({
            name:
              candidate.name,

            family:
              candidate.family,

            score:
              candidate.score,

            reason:
              candidate.reason,

            evidenceRefs:
              candidate.evidenceRefs ||
              []
          })
        ),

      rankedFunctions,

      functionAgreement,

      confidence:
        confidence.normalized,

      confidenceScore:
        confidence.score,

      confidenceLabel:
        confidence.label,

      confidenceBreakdown:
        confidence.breakdown,

      responseContract,

      handoff,

      sourceAvailability: {
        semanticFrameAvailable:
          sources.semanticFrameAvailable,

        canonicalMeaningAvailable:
          sources.canonicalMeaningAvailable,

        requestModelAvailable:
          sources.requestModelAvailable,

        classifierAvailable:
          sources.classifierAvailable,

        questionUnderstandingAvailable:
          sources.questionUnderstandingAvailable,

        continuityAvailable:
          sources.continuityAvailable,

        ambiguityAvailable:
          sources.ambiguityAvailable,

        safetyContextAvailable:
          sources.safetyContextAvailable
      },

      authority: {
        canIdentifyConversationFunction:
          true,

        canRankConversationFunctions:
          true,

        canDescribeFunctionalRequirements:
          true,

        canPreserveSecondaryFunctions:
          true,

        canReportFunctionalAmbiguity:
          true,

        canChooseLane:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseCapabilities:
          false,

        canDetermineSafetySeverity:
          false,

        canOverrideSafety:
          false,

        canBlockFunctions:
          false,

        canAnswerUser:
          false,

        role:
          "conversation_purpose_handoff_only"
      }
    };
  },

  /* =====================================================
     SOURCE READING
  ===================================================== */

  readSources(summary = {}) {
    const semanticResult =
  this.firstNonEmptyObject(
    summary.semanticFrameResult,
    summary.semanticFrameBuilderResult,
    summary.semanticFrame
  );

const canonicalMeaning =
  this.firstNonEmptyObject(
    semanticResult.canonicalMeaning,
    summary.canonicalMeaning
  );

const primaryFrame =
  this.firstNonEmptyObject(
    semanticResult.primaryFrame,
    semanticResult.currentTurnFrame,
    summary.primaryFrame,
    canonicalMeaning.primaryFrame
  );

const secondaryFrames =
  this.firstNonEmptyArray(
    semanticResult.secondaryFrames,
    summary.secondaryFrames
  );

const requestModel =
  this.firstNonEmptyObject(
    semanticResult.requestModel,
    summary.requestModel
  );

const responseRequirements =
  this.firstNonEmptyObject(
    semanticResult.responseRequirements,
    semanticResult.responseCharacteristics,
    summary.responseRequirements
  );

const continuity =
  this.firstNonEmptyObject(
    semanticResult.continuity,
    canonicalMeaning.continuity,
    summary.continuity
  );

const ambiguity =
  this.firstNonEmptyObject(
    semanticResult.ambiguity,
    canonicalMeaning.ambiguity,
    summary.ambiguity
  );

const framePriority =
  this.firstNonEmptyObject(
    semanticResult.framePriority,
    summary.framePriority
  );

const frameAgreement =
  this.firstNonEmptyObject(
    semanticResult.frameAgreement,
    summary.frameAgreement
  );

    const classification =
  this.firstNonEmptyObject(
    summary.universalConversationClassification,
    summary.conversationClassification
  );

const questionUnderstanding =
  this.firstNonEmptyObject(
    summary.questionUnderstanding,
    summary.questionUnderstandingResult
  );

const safetyContext =
  this.firstNonEmptyObject(
    summary.safetyContextGate,
    summary.safetyContext
  );

const emotionalOverlay =
  this.firstNonEmptyObject(
    semanticResult.emotionalOverlay,
    summary.emotionalOverlay
  );

    const contextModifiers =
  this.firstNonEmptyArray(
    canonicalMeaning.contextModifiers,
    semanticResult.contextModifiers,
    summary.contextModifiers
  );

const constraints =
  this.firstNonEmptyArray(
    canonicalMeaning.constraints,
    semanticResult.constraints,
    summary.constraints
  );

const stakes =
  this.firstNonEmptyArray(
    canonicalMeaning.stakes,
    semanticResult.stakes,
    summary.stakes
  );
    return {
      semanticResult,
      canonicalMeaning,
      primaryFrame,

      secondaryFrames:
        Array.isArray(secondaryFrames)
          ? secondaryFrames
          : [],

      requestModel,
      responseRequirements,
      continuity,
      ambiguity,
      framePriority,
      frameAgreement,
      classification,
      questionUnderstanding,
      safetyContext,
      emotionalOverlay,

      contextModifiers:
        Array.isArray(contextModifiers)
          ? contextModifiers
          : [],

      constraints:
        Array.isArray(constraints)
          ? constraints
          : [],

      stakes:
        Array.isArray(stakes)
          ? stakes
          : [],

      semanticFrameAvailable:
        Boolean(
          semanticResult
            .semanticFrameBuilderRan ||
          primaryFrame.frameType
        ),

      canonicalMeaningAvailable:
        canonicalMeaning.enabled === true ||
        Boolean(
          canonicalMeaning
            .requestedOperation
        ),

      requestModelAvailable:
        Boolean(
          requestModel.operation ||
          requestModel.requestType
        ),

      classifierAvailable:
        classification
          .universalConversationClassifierRan ===
        true,

      questionUnderstandingAvailable:
        questionUnderstanding
          .questionUnderstandingRan ===
        true,

      continuityAvailable:
        Boolean(
          continuity &&
          Object.keys(continuity).length
        ),

      ambiguityAvailable:
        Boolean(
          ambiguity &&
          Object.keys(ambiguity).length
        ),

      safetyContextAvailable:
        Boolean(
          safetyContext &&
          Object.keys(safetyContext).length
        )
    };
  },

  /* =====================================================
     CANDIDATE BUILDING
  ===================================================== */

  buildCandidates(sources = {}) {
    const candidates = [];

    const primaryFrame =
      sources.primaryFrame ||
      {};

    const canonicalMeaning =
      sources.canonicalMeaning ||
      {};

    const requestModel =
      sources.requestModel ||
      {};

    const operation =
      this.normalize(
        canonicalMeaning
          .requestedOperation ||
        primaryFrame.operation ||
        requestModel.operation ||
        ""
      );

    const requestedOutput =
      this.normalize(
        canonicalMeaning
          .requestedOutput ||
        primaryFrame.requestedOutput ||
        requestModel.requestedOutput ||
        ""
      );

    const interactionFamily =
      this.normalize(
        canonicalMeaning
          .interactionFamily ||
        primaryFrame.interactionFamily ||
        requestModel.interactionFamily ||
        ""
      );

    const intentFamily =
      this.normalize(
        canonicalMeaning
          .intentFamily ||
        primaryFrame.intentFamily ||
        requestModel.intentFamily ||
        ""
      );

    const frameType =
      this.normalize(
        primaryFrame.frameType ||
        ""
      );

    const targetDomain =
      this.normalize(
        canonicalMeaning
          .targetDomain ||
        primaryFrame.domain ||
        ""
      );

    const evidenceRefs =
      this.collectEvidenceRefs(
        primaryFrame,
        canonicalMeaning,
        requestModel
      );

    this.addOperationCandidates({
      candidates,
      operation,
      requestedOutput,
      interactionFamily,
      intentFamily,
      frameType,
      targetDomain,
      evidenceRefs
    });

    this.addContinuityCandidates({
      candidates,
      sources,
      evidenceRefs
    });

    this.addSupportCandidates({
      candidates,
      sources,
      operation,
      interactionFamily,
      evidenceRefs
    });

    this.addSafetyContextCandidate({
      candidates,
      sources,
      evidenceRefs
    });

    this.addSecondaryFrameCandidates({
      candidates,
      sources
    });

    if (!candidates.length) {
      candidates.push(
        this.defaultFunction()
      );
    }

    return this.mergeCandidates(
      candidates
    );
  },

  addOperationCandidates({
    candidates = [],
    operation = "",
    requestedOutput = "",
    interactionFamily = "",
    intentFamily = "",
    frameType = "",
    targetDomain = "",
    evidenceRefs = []
  } = {}) {
    const context = {
      operation,
      requestedOutput,
      interactionFamily,
      intentFamily,
      frameType,
      targetDomain
    };

    const add = (
      name,
      family,
      score,
      reason
    ) => {
      candidates.push({
        name,
        family,
        score,
        reason,
        origin:
          "semantic_operation",

        evidenceRefs:
          [...evidenceRefs],

        supportingContext:
          context
      });
    };

    if (
      this.includesAny(operation, [
        "provide information",
        "retrieve information"
      ]) ||
      intentFamily === "fact retrieval"
    ) {
      add(
        "information_retrieval",
        "information",
        88,
        "The user is seeking factual or directly retrievable information."
      );
    }

    if (
      this.includesAny(operation, [
        "explain",
        "teach"
      ]) ||
      this.includesAny(
        requestedOutput,
        ["explanation"]
      )
    ) {
      add(
        operation.includes("teach")
          ? "teaching"
          : "explanation",

        "information",
        operation.includes("teach")
          ? 90
          : 88,

        operation.includes("teach")
          ? "The conversation serves a teaching or guided-learning purpose."
          : "The user wants a concept, cause, process, or meaning explained."
      );
    }

    if (
      operation.includes("interpret")
    ) {
      add(
        "interpretation",
        "language_and_meaning",
        91,
        "The user is asking Ari to interpret meaning rather than merely retrieve a fact."
      );
    }

    if (
      operation.includes("translate")
    ) {
      add(
        "translation",
        "language_and_meaning",
        96,
        "The user is asking for language transformation between languages."
      );
    }

    if (
      operation.includes("calculate") ||
      operation.includes("convert")
    ) {
      add(
        "calculation",
        "calculation",
        96,
        "The conversation serves a calculation or conversion function."
      );
    }

    if (
      operation.includes("plan")
    ) {
      add(
        "planning",
        "planning",
        92,
        "The user wants a structured course of action, roadmap, or sequence."
      );
    }

    if (
      operation.includes("prioritize")
    ) {
      add(
        "prioritization",
        "decision",
        95,
        "The user wants competing tasks or concerns placed in priority order."
      );
    }

    if (
      operation.includes("compare")
    ) {
      add(
        "comparison",
        "decision",
        92,
        "The user wants alternatives compared against relevant criteria."
      );
    }

    if (
      this.includesAny(operation, [
        "decide",
        "choose",
        "recommend"
      ]) ||
      interactionFamily === "decision" ||
      intentFamily === "recommendation"
    ) {
      add(
        "decision_support",
        "decision",
        93,
        "The user wants help evaluating choices and reaching a decision."
      );
    }

    if (
  operation.includes("produce") ||
  operation.includes("revise text") ||
  interactionFamily === "writing"
) {
  add(
    operation.includes("revise")
      ? "writing_revision"
      : "writing_creation",

    "writing",
    93,

    operation.includes("revise")
      ? "The user wants existing written material revised."
      : "The user wants written material produced."
  );
}

    if (
      operation.includes("implement") ||
      operation.includes("modify")
    ) {
      add(
        "artifact_modification",
        "artifact",
        97,
        "The user wants Ari to implement or modify an existing artifact."
      );
    }

    if (
      operation.includes("create artifact") ||
      interactionFamily === "creation" ||
      intentFamily ===
        "artifact creation"
    ) {
      add(
        "artifact_creation",
        "artifact",
        96,
        "The user wants Ari to create a new artifact."
      );
    }

    if (
      this.includesAny(operation, [
        "verify",
        "review"
      ]) ||
      interactionFamily === "verification"
    ) {
      add(
        "verification",
        "investigation",
        94,
        "The user wants an existing claim, artifact, or result checked."
      );
    }

    if (
      this.includesAny(operation, [
        "diagnose",
        "inspect",
        "debug",
        "investigate"
      ])
    ) {
      add(
        "artifact_investigation",
        "investigation",
        95,
        "The user wants a problem inspected, diagnosed, or debugged."
      );
    }

    if (
      operation.includes("research")
    ) {
      add(
        "research",
        "research",
        94,
        "The user wants information gathered and synthesized from multiple sources."
      );
    }

    if (
      operation.includes("navigate") ||
      operation.includes("locate")
    ) {
      add(
        "navigation",
        "navigation",
        92,
        "The user wants Ari to locate a resource, destination, file, or next interface action."
      );
    }

    if (
      operation.includes("save") ||
      operation.includes("forget memory") ||
      intentFamily === "memory action"
    ) {
      add(
        "memory_management",
        "memory",
        96,
        "The user wants information remembered, updated, retrieved, or forgotten."
      );
    }

    if (
      operation.includes(
        "retrieve prior context"
      )
    ) {
      add(
        "context_recall",
        "memory",
        93,
        "The user wants Ari to recover relevant prior conversational context."
      );
    }

    if (
      operation.includes("identity") ||
      interactionFamily === "identity"
    ) {
      add(
        "identity_exploration",
        "identity",
        91,
        "The conversation concerns identity, personal meaning, values, or self-understanding."
      );
    }

    if (
      operation.includes("opinion") ||
      interactionFamily === "opinion"
    ) {
      add(
        "collaborative_reasoning",
        "reasoning",
        88,
        "The user wants Ari's considered judgment or perspective."
      );
    }

    if (
      operation.includes("brainstorm")
    ) {
      add(
        "brainstorming",
        "creative_reasoning",
        93,
        "The user wants possibilities generated without requiring an immediate final choice."
      );
    }

    if (
  operation.includes("generate") ||
  intentFamily === "creative generation"
) {
  add(
    "creative_generation",
    "creative_reasoning",
    86,
    "The user wants an original output generated."
  );
}

    if (
      operation.includes(
        "emotional support"
      ) ||
      interactionFamily ===
        "emotional support"
    ) {
      add(
        "emotional_support",
        "human_support",
        96,
        "The user is seeking emotional presence, comfort, validation, or supportive conversation."
      );
    }

    if (
      frameType === "general conversation" ||
      (
        operation === "respond" &&
        !interactionFamily
      )
    ) {
      add(
        "general_conversation",
        "conversation",
        52,
        "No more specialized conversational purpose was established."
      );
    }
  },

  addContinuityCandidates({
    candidates = [],
    sources = {},
    evidenceRefs = []
  } = {}) {
    const continuity =
      sources.continuity ||
      {};

    if (
      continuity.isContinuation !== true
    ) {
      return;
    }

    const priorArtifact =
      continuity
        .referencesPriorArtifact === true;

    candidates.push({
      name:
        priorArtifact
          ? "project_continuation"
          : "conversation_continuation",

      family:
        priorArtifact
          ? "project"
          : "continuity",

      score:
        priorArtifact
          ? 91
          : 82,

      reason:
        priorArtifact
          ? "The current turn continues work on an existing project or artifact."
          : "The current turn depends on and continues prior conversational context.",

      origin:
        "continuity",

      evidenceRefs: [
        ...evidenceRefs,
        ...(continuity.evidence || [])
      ],

      supportingContext: {
        anchor:
          continuity.anchor ||
          null,

        priorContextAvailable:
          continuity.threadAvailable ===
          true
      }
    });
  },

  addSupportCandidates({
    candidates = [],
    sources = {},
    operation = "",
    interactionFamily = "",
    evidenceRefs = []
  } = {}) {
    const emotionalOverlay =
      sources.emotionalOverlay ||
      {};

    if (
      emotionalOverlay
        .explicitSupportRequested ===
      true
    ) {
      candidates.push({
        name:
          "emotional_support",

        family:
          "human_support",

        score:
          97,

        reason:
          "Upstream meaning indicates that emotional support was explicitly requested.",

        origin:
          "emotional_overlay",

        evidenceRefs: [
          ...evidenceRefs,
          ...(emotionalOverlay.evidence ||
            [])
        ]
      });

      return;
    }

    if (
      emotionalOverlay.present === true &&
      !operation.includes(
        "emotional support"
      ) &&
      interactionFamily !==
        "emotional support"
    ) {
      candidates.push({
        name:
          "emotional_attunement",

        family:
          "supporting_context",

        score:
          54,

        reason:
          "Emotion is relevant to how Ari should engage, but it is not the primary purpose of the conversation.",

        origin:
          "emotional_overlay",

        evidenceRefs: [
          ...evidenceRefs,
          ...(emotionalOverlay.evidence ||
            [])
        ]
      });
    }
  },

  addSafetyContextCandidate({
    candidates = [],
    sources = {},
    evidenceRefs = []
  } = {}) {
    const safety =
      sources.safetyContext ||
      {};

    const urgentSupportRequired =
      safety.immediateSupportRequired ===
        true ||
      safety.immediateHumanSupportRequired ===
        true ||
      safety.requiresImmediateResponse ===
        true;

    if (!urgentSupportRequired) {
      return;
    }

    candidates.push({
      name:
        "immediate_human_support",

      family:
        "human_support",

      score:
        100,

      reason:
        "The upstream safety system indicates that immediate human support is functionally required.",

      origin:
        "upstream_safety_context",

      evidenceRefs: [
        ...evidenceRefs,
        ...(safety.evidenceRefs || [])
      ],

      authorityNote:
        "This engine inherits the safety requirement and does not independently determine risk severity."
    });
  },

  addSecondaryFrameCandidates({
    candidates = [],
    sources = {}
  } = {}) {
    sources.secondaryFrames
      .slice(0, 8)
      .forEach(frame => {
        const mapped =
          this.mapFrameToFunction(
            frame
          );

        if (!mapped) {
          return;
        }

        candidates.push({
          ...mapped,

          score:
            Math.min(
              78,
              mapped.score
            ),

          origin:
            "secondary_semantic_frame",

          evidenceRefs:
            frame.evidenceRefs ||
            []
        });
      });
  },

  mapFrameToFunction(frame = {}) {
    const operation =
      this.normalize(
        frame.operation
      );

    const family =
      this.normalize(
        frame.interactionFamily
      );

    const frameType =
      this.normalize(
        frame.frameType
      );

    const mappings = [
      {
        match:
          operation.includes(
            "prioritize"
          ),

        name:
          "prioritization",

        family:
          "decision",

        score:
          78,

        reason:
          "A secondary semantic frame represents a prioritization need."
      },

      {
        match:
          operation.includes("decide") ||
          family === "decision",

        name:
          "decision_support",

        family:
          "decision",

        score:
          76,

        reason:
          "A secondary semantic frame represents a decision-support need."
      },

      {
        match:
          operation.includes("plan"),

        name:
          "planning",

        family:
          "planning",

        score:
          76,

        reason:
          "A secondary semantic frame represents a planning need."
      },

      {
        match:
          operation.includes("explain"),

        name:
          "explanation",

        family:
          "information",

        score:
          72,

        reason:
          "A secondary semantic frame represents an explanation need."
      },

      {
        match:
          operation.includes("modify") ||
          operation.includes("implement"),

        name:
          "artifact_modification",

        family:
          "artifact",

        score:
          78,

        reason:
          "A secondary semantic frame represents an artifact modification need."
      },

      {
        match:
          operation.includes("create"),

        name:
          "artifact_creation",

        family:
          "artifact",

        score:
          76,

        reason:
          "A secondary semantic frame represents an artifact creation need."
      },

      {
        match:
          operation.includes("verify") ||
          operation.includes("review"),

        name:
          "verification",

        family:
          "investigation",

        score:
          76,

        reason:
          "A secondary semantic frame represents a verification need."
      },

      {
        match:
          frameType === "continuation",

        name:
          "conversation_continuation",

        family:
          "continuity",

        score:
          70,

        reason:
          "A secondary frame preserves relevant continuity."
      }
    ];

    return (
      mappings.find(item =>
        item.match
      ) ||
      null
    );
  },

  /* =====================================================
     CANDIDATE MERGING + RANKING
  ===================================================== */

  mergeCandidates(
    candidates = []
  ) {
    const merged =
      new Map();

    candidates.forEach(candidate => {
      if (!candidate?.name) {
        return;
      }

      const key =
        candidate.name;

      if (!merged.has(key)) {
        merged.set(key, {
          ...candidate,

          evidenceRefs: [
            ...new Set(
              candidate.evidenceRefs ||
              []
            )
          ],

          reasons:
            candidate.reason
              ? [candidate.reason]
              : []
        });

        return;
      }

      const existing =
        merged.get(key);

      existing.score =
        Math.min(
          100,
          Math.max(
            existing.score,
            candidate.score
          ) +
          Math.round(
            Math.min(
              existing.score,
              candidate.score
            ) * 0.08
          )
        );

      existing.evidenceRefs = [
        ...new Set([
          ...(existing.evidenceRefs ||
            []),
          ...(candidate.evidenceRefs ||
            [])
        ])
      ];

      if (
        candidate.reason &&
        !existing.reasons.includes(
          candidate.reason
        )
      ) {
        existing.reasons.push(
          candidate.reason
        );
      }

      existing.reason =
        existing.reasons[0] ||
        existing.reason;
    });

    return [
      ...merged.values()
    ];
  },

  rankCandidates(
    candidates = [],
    sources = {}
  ) {
    return candidates
      .map(candidate => {
        let score =
          Number(
            candidate.score ||
            0
          );

        const primaryFrame =
          sources.primaryFrame ||
          {};

        const primaryOperation =
          this.normalize(
            primaryFrame.operation
          );

        if (
          candidate.origin ===
          "semantic_operation"
        ) {
          score += 5;
        }

        if (
          candidate.name ===
            "immediate_human_support" &&
          candidate.origin ===
            "upstream_safety_context"
        ) {
          score = 100;
        }

        if (
          candidate.name ===
            "emotional_support" &&
          sources.emotionalOverlay
            ?.explicitSupportRequested ===
            true
        ) {
          score += 8;
        }

        if (
          candidate.name ===
            "emotional_attunement" &&
          sources.emotionalOverlay
            ?.explicitSupportRequested !==
            true
        ) {
          score = Math.min(
            score,
            58
          );
        }

        if (
          candidate.name ===
            "project_continuation" &&
          sources.continuity
            ?.referencesPriorArtifact ===
            true
        ) {
          score += 7;
        }

        if (
          candidate.name ===
            "conversation_continuation" &&
          primaryOperation &&
          primaryOperation !==
            "continue prior context"
        ) {
          score -= 15;
        }

        if (
          candidate.name ===
            "general_conversation" &&
          candidates.length > 1
        ) {
          score -= 20;
        }

        return {
          ...candidate,

          score:
            Math.max(
              0,
              Math.min(
                100,
                Math.round(score)
              )
            )
        };
      })
      .filter(candidate =>
        candidate.score > 0
      )
      .sort((a, b) => {
        if (
          b.score !== a.score
        ) {
          return (
            b.score - a.score
          );
        }

        return (
          this.functionPriority(
            a.name
          ) -
          this.functionPriority(
            b.name
          )
        );
      });
  },

  functionPriority(name = "") {
    const order = [
  "immediate_human_support",
  "emotional_support",

  "artifact_modification",
  "artifact_creation",
  "artifact_investigation",

  "writing_revision",
  "writing_creation",

  "verification",
  "prioritization",
  "decision_support",
  "comparison",
  "planning",
  "translation",
  "calculation",
  "research",
  "teaching",
  "explanation",
  "interpretation",
  "information_retrieval",
  "memory_management",
  "context_recall",
  "identity_exploration",
  "collaborative_reasoning",
  "brainstorming",
  "creative_generation",
  "project_continuation",
  "conversation_continuation",
  "emotional_attunement",
  "general_conversation"
];

    const index =
      order.indexOf(name);

    return index >= 0
      ? index
      : order.length;
  },

  /* =====================================================
     FUNCTION AGREEMENT
  ===================================================== */

  buildFunctionAgreement({
  primary = {},
  sources = {}
} = {}) {
  const canonicalMeaning =
    sources.canonicalMeaning ||
    {};

  const primaryFrame =
    sources.primaryFrame ||
    {};

  const requestModel =
    sources.requestModel ||
    {};

  const mappedFromCanonical =
    this.functionFromOperation(
      canonicalMeaning
        .requestedOperation
    );

  const mappedFromFrame =
    this.functionFromOperation(
      primaryFrame.operation
    );

  const mappedFromRequest =
    this.functionFromOperation(
      requestModel.operation
    );

  const checks = [
    {
      source:
        "canonical_meaning",

      available:
        Boolean(
          canonicalMeaning
            .requestedOperation
        ),

      mappedFunction:
        mappedFromCanonical,

      aligned:
        Boolean(
          mappedFromCanonical
        ) &&
        mappedFromCanonical ===
          primary.name
    },

    {
      source:
        "primary_frame",

      available:
        Boolean(
          primaryFrame.operation
        ),

      mappedFunction:
        mappedFromFrame,

      aligned:
        Boolean(
          mappedFromFrame
        ) &&
        mappedFromFrame ===
          primary.name
    },

    {
      source:
        "request_model",

      available:
        Boolean(
          requestModel.operation
        ),

      mappedFunction:
        mappedFromRequest,

      aligned:
        Boolean(
          mappedFromRequest
        ) &&
        mappedFromRequest ===
          primary.name
    }
  ];

  const availableChecks =
    checks.filter(check =>
      check.available
    );

  const mappedChecks =
    availableChecks.filter(check =>
      Boolean(
        check.mappedFunction
      )
    );

  const alignedCount =
    mappedChecks.filter(check =>
      check.aligned
    ).length;

  const score =
    mappedChecks.length
      ? alignedCount /
        mappedChecks.length
      : 0.5;

  return {
    checks,

    alignedCount,

    totalChecks:
      availableChecks.length,

    mappedChecks:
      mappedChecks.length,

    score:
      this.normalizeConfidence(
        score
      ),

    level:
      score >= 0.9
        ? "high"
        : score >= 0.65
          ? "medium"
          : score >= 0.4
            ? "low"
            : "none",

    disagreements:
      availableChecks
        .filter(check =>
          Boolean(
            check.mappedFunction
          ) &&
          !check.aligned
        )
        .map(check =>
          `${check.source}_function_mismatch`
        ),

    unmappedSources:
      availableChecks
        .filter(check =>
          !check.mappedFunction
        )
        .map(check =>
          check.source
        ),

    authority:
      "conversation_function_internal_agreement_only"
  };
},
  functionFromOperation(
  operation = ""
) {
  const normalized =
    this.normalize(operation);

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes(
      "emotional support"
    )
  ) {
    return "emotional_support";
  }

  if (
    normalized.includes("prioritize")
  ) {
    return "prioritization";
  }

  if (
    normalized.includes("compare")
  ) {
    return "comparison";
  }

  if (
    this.includesAny(normalized, [
      "decide",
      "choose",
      "recommend"
    ])
  ) {
    return "decision_support";
  }

  if (
    normalized.includes("plan")
  ) {
    return "planning";
  }

  if (
    normalized.includes("translate")
  ) {
    return "translation";
  }

  if (
    normalized.includes("calculate") ||
    normalized.includes("convert")
  ) {
    return "calculation";
  }

  if (
    normalized.includes("teach")
  ) {
    return "teaching";
  }

  if (
    normalized.includes("explain")
  ) {
    return "explanation";
  }

  if (
    normalized.includes("interpret")
  ) {
    return "interpretation";
  }

  if (
    normalized.includes("information")
  ) {
    return "information_retrieval";
  }

  if (
    normalized.includes(
      "retrieve prior context"
    )
  ) {
    return "context_recall";
  }

  if (
  normalized === "revise text" ||
  normalized === "revise written text" ||
  normalized === "writing revision"
) {
  return "writing_revision";
}

if (
  normalized === "produce text" ||
  normalized === "write text" ||
  normalized === "writing creation"
) {
  return "writing_creation";
}

if (
  normalized === "produce or revise text"
) {
  return "writing_creation";
}

if (
  normalized.includes("implement") ||
  normalized.includes("modify")
) {
  return "artifact_modification";
}

if (
  normalized.includes("create artifact")
) {
  return "artifact_creation";
}

  if (
    this.includesAny(normalized, [
      "diagnose",
      "inspect",
      "debug",
      "investigate"
    ])
  ) {
    return "artifact_investigation";
  }

  if (
    normalized.includes("verify") ||
    normalized.includes("review")
  ) {
    return "verification";
  }

  if (
    normalized.includes("research")
  ) {
    return "research";
  }

  if (
    normalized.includes("navigate") ||
    normalized.includes("locate")
  ) {
    return "navigation";
  }

  if (
    normalized.includes("save") ||
    normalized.includes("memory") ||
    normalized.includes("forget")
  ) {
    return "memory_management";
  }

  if (
    normalized.includes("identity")
  ) {
    return "identity_exploration";
  }

  if (
    normalized.includes("opinion")
  ) {
    return "collaborative_reasoning";
  }

  if (
    normalized.includes("brainstorm")
  ) {
    return "brainstorming";
  }

  if (
    normalized.includes("generate")
  ) {
    return "creative_generation";
  }

  if (
    normalized.includes(
      "continue prior context"
    )
  ) {
    return "conversation_continuation";
  }

  if (
    normalized.includes("respond")
  ) {
    return "general_conversation";
  }

  return null;
},

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  calculateConfidence({
    primary = {},
    secondaryFunctions = [],
    functionAgreement = {},
    sources = {}
  } = {}) {
    const primaryStrength =
      this.normalizeConfidence(
        Number(
          primary.score || 0
        ) / 100
      );

    const semanticConfidence =
      this.normalizeConfidence(
        sources.canonicalMeaning
          ?.confidence ??
        sources.primaryFrame
          ?.semanticConfidence ??
        0
      );

    const agreementScore =
      this.normalizeConfidence(
        functionAgreement.score
      );

    const sourceCompleteness =
      this.calculateSourceCompleteness(
        sources
      );

    const ambiguityPenalty =
      sources.ambiguity
        ?.present === true
        ? 0.1
        : 0;

    const competitionPenalty =
      secondaryFunctions[0] &&
      Math.abs(
        Number(primary.score || 0) -
        Number(
          secondaryFunctions[0]
            .score ||
          0
        )
      ) <= 6
        ? 0.08
        : 0;

    const normalized =
      this.normalizeConfidence(
        primaryStrength * 0.38 +
        semanticConfidence * 0.24 +
        agreementScore * 0.2 +
        sourceCompleteness * 0.18 -
        ambiguityPenalty -
        competitionPenalty
      );

    return {
      normalized,

      score:
        Math.round(
          normalized * 100
        ),

      label:
        this.confidenceLabel(
          normalized
        ),

      breakdown: {
        primaryStrength,
        semanticConfidence,
        agreementScore,
        sourceCompleteness,
        ambiguityPenalty,
        competitionPenalty
      }
    };
  },

  
    calculateSourceCompleteness(
  sources = {}
) {
  const weightedChecks = [
    {
      available:
        sources.semanticFrameAvailable,

      weight:
        0.35
    },

    {
      available:
        sources.canonicalMeaningAvailable,

      weight:
        0.35
    },

    {
      available:
        sources.requestModelAvailable,

      weight:
        0.15
    },

    {
      available:
        sources.continuityAvailable,

      weight:
        0.075
    },

    {
      available:
        sources.ambiguityAvailable,

      weight:
        0.075
    }
  ];

  const score =
    weightedChecks.reduce(
      (total, check) =>
        total +
        (
          check.available
            ? check.weight
            : 0
        ),
      0
    );

  return this.normalizeConfidence(
    score
  );
},

  /* =====================================================
     RESPONSE CONTRACT
  ===================================================== */

  buildResponseContract({
    primary = {},
    secondaryFunctions = [],
    sources = {}
  } = {}) {
    const name =
      primary.name ||
      "general_conversation";

    const contracts = {
      information_retrieval: {
        objective:
          "Provide the requested information.",

        must: [
          "answer_primary_request",
          "preserve_factual_precision"
        ],

        should: [
          "be_direct",
          "separate_fact_from_inference"
        ]
      },

      explanation: {
        objective:
          "Make the subject understandable.",

        must: [
          "answer_primary_request",
          "explain_relevant_cause_or_process"
        ],

        should: [
          "use_clear_structure",
          "match_user_depth"
        ]
      },

      teaching: {
        objective:
          "Help the user build understanding they can reuse.",

        must: [
          "explain_core_concept",
          "preserve_accuracy"
        ],

        should: [
          "sequence_learning",
          "use_examples_when_helpful"
        ]
      },

      interpretation: {
        objective:
          "Explain the likely meaning or significance of the material.",

        must: [
          "identify_meaning",
          "distinguish_text_from_inference"
        ],

        should: [
          "preserve_context",
          "acknowledge_ambiguity"
        ]
      },

writing_creation: {
  objective:
    "Produce the requested written material.",

  must: [
    "produce_requested_text",
    "preserve_user_intent"
  ],

  should: [
    "match_requested_tone",
    "make_output_immediately_usable"
  ]
},

writing_revision: {
  objective:
    "Revise the supplied written material.",

  must: [
    "preserve_intended_meaning",
    "apply_requested_revision"
  ],

  should: [
    "retain_unrelated_content",
    "match_requested_tone"
  ]
},

      planning: {
        objective:
          "Produce an actionable sequence toward the user's goal.",

        must: [
          "identify_goal",
          "provide_ordered_next_steps"
        ],

        should: [
          "respect_constraints",
          "identify_dependencies"
        ]
      },

      decision_support: {
        objective:
          "Help the user reach a defensible decision.",

        must: [
          "identify_tradeoffs",
          "evaluate_relevant_options"
        ],

        should: [
          "recommend_when_supported",
          "explain_reasoning"
        ]
      },

      prioritization: {
        objective:
          "Determine what should receive attention first.",

        must: [
          "rank_competing_priorities",
          "explain_priority_order"
        ],

        should: [
          "consider_dependencies",
          "identify_next_action"
        ]
      },

      comparison: {
        objective:
          "Compare alternatives using relevant criteria.",

        must: [
          "preserve_each_option",
          "compare_against_shared_criteria"
        ],

        should: [
          "identify_best_fit",
          "state_tradeoffs"
        ]
      },

      artifact_creation: {
        objective:
          "Create the requested artifact.",

        must: [
          "produce_requested_artifact",
          "respect_user_constraints"
        ],

        should: [
          "make_output_usable",
          "avoid_unrequested_scope"
        ]
      },

      artifact_modification: {
        objective:
          "Modify the intended existing artifact.",

        must: [
          "preserve_unrelated_behavior",
          "apply_requested_change"
        ],

        should: [
          "use_available_artifact_context",
          "avoid_patch_stacking"
        ]
      },

      artifact_investigation: {
        objective:
          "Determine why an artifact or system is not behaving as intended.",

        must: [
          "inspect_available_evidence",
          "identify_probable_cause"
        ],

        should: [
          "separate_observation_from_diagnosis",
          "propose_targeted_correction"
        ]
      },

      verification: {
        objective:
          "Determine whether the claim, artifact, or result is correct.",

        must: [
          "evaluate_available_evidence",
          "state_verified_and_unverified_parts"
        ],

        should: [
          "identify_remaining_uncertainty",
          "avoid_overclaiming"
        ]
      },

      project_continuation: {
        objective:
          "Continue the active project without losing established context.",

        must: [
          "preserve_active_project_state",
          "continue_current_work"
        ],

        should: [
          "respect_prior_architecture",
          "avoid_restarting_work"
        ]
      },

      conversation_continuation: {
        objective:
          "Continue the active conversational thread coherently.",

        must: [
          "use_relevant_prior_context",
          "answer_current_turn"
        ],

        should: [
          "avoid_repeating_resolved_context",
          "preserve_current_subject"
        ]
      },

context_recall: {
  objective:
    "Recover and use the relevant prior conversational context.",

  must: [
    "identify_relevant_prior_context",
    "answer_using_recalled_context"
  ],

  should: [
    "avoid_inventing_missing_context",
    "distinguish_recalled_context_from_inference"
  ]
},

      memory_management: {
        objective:
          "Perform the requested memory action.",

        must: [
          "identify_memory_action",
          "preserve_user_intent"
        ],

        should: [
          "distinguish_save_update_and_forget",
          "avoid_unrequested_memory"
        ]
      },

      emotional_support: {
        objective:
          "Provide emotionally responsive human support.",

        must: [
          "acknowledge_user_experience",
          "respect_stated_boundaries"
        ],

        should: [
          "lead_with_presence",
          "avoid_unrequested_problem_solving"
        ]
      },

      emotional_attunement: {
        objective:
          "Respond with appropriate emotional awareness while completing the real task.",

        must: [
          "preserve_primary_request"
        ],

        should: [
          "briefly_acknowledge_emotion",
          "avoid_emotion_overriding_task"
        ]
      },

      immediate_human_support: {
        objective:
          "Support the immediate human need identified by the upstream safety system.",

        must: [
          "honor_upstream_safety_requirements",
          "prioritize_immediate_support"
        ],

        should: [
          "remain_clear_and_grounded",
          "avoid_unrelated_tasks"
        ]
      },

      identity_exploration: {
        objective:
          "Help explore identity, values, meaning, or self-understanding.",

        must: [
          "respect_user_self_definition",
          "avoid_unearned_labels"
        ],

        should: [
          "support_reflection",
          "preserve_complexity"
        ]
      },

      collaborative_reasoning: {
        objective:
          "Think through the issue collaboratively with the user.",

        must: [
          "engage_the_actual_question",
          "distinguish_reasoning_from_fact"
        ],

        should: [
          "surface_tradeoffs",
          "offer_considered_judgment"
        ]
      },

      brainstorming: {
        objective:
          "Generate useful possibilities.",

        must: [
          "produce_multiple_relevant_options"
        ],

        should: [
          "avoid_premature_commitment",
          "organize_ideas"
        ]
      },

      creative_generation: {
        objective:
          "Generate the requested creative output.",

        must: [
          "produce_requested_output",
          "follow_user_constraints"
        ],

        should: [
          "maintain_coherence",
          "match_requested_style"
        ]
      },

      translation: {
        objective:
          "Translate the supplied material accurately.",

        must: [
          "preserve_meaning",
          "produce_target_language_output"
        ],

        should: [
          "preserve_tone",
          "note_untranslatable_ambiguity"
        ]
      },

      calculation: {
        objective:
          "Produce the correct calculation or conversion.",

        must: [
          "calculate_accurately",
          "return_result"
        ],

        should: [
          "show_method_when_helpful",
          "preserve_units"
        ]
      },

      research: {
        objective:
          "Gather and synthesize reliable information.",

        must: [
          "use_relevant_sources",
          "synthesize_findings"
        ],

        should: [
          "represent_uncertainty",
          "distinguish_source_claims"
        ]
      },

      navigation: {
        objective:
          "Help locate or reach the requested resource or destination.",

        must: [
          "identify_target",
          "provide_navigation_result"
        ],

        should: [
          "minimize_unnecessary_steps"
        ]
      },

      general_conversation: {
        objective:
          "Respond naturally to the current conversational move.",

        must: [
          "engage_current_turn"
        ],

        should: [
          "preserve_continuity",
          "match_user_tone"
        ]
      }
    };

    const base =
      contracts[name] ||
      contracts.general_conversation;

    return {
      function:
        name,

      family:
        primary.family ||
        "conversation",

      objective:
        base.objective,

      must:
        [...base.must],

      should:
        [...base.should],

      preserveSecondaryFunctions:
        secondaryFunctions.length > 0,

      secondaryRequirements:
        secondaryFunctions.map(
          candidate =>
            candidate.name
        ),

      clarificationMayBeRequired:
        sources.ambiguity
          ?.requiresClarification ===
        true,

      priorContextRequired:
        sources.continuity
          ?.requiresPriorContext ===
        true,

      advisoryOnly:
        true,

      authority:
        "functional_response_requirements_only"
    };
  },

  /* =====================================================
     HANDOFF
  ===================================================== */

  buildHandoff({
    primary = {},
    secondaryFunctions = [],
    rankedFunctions = [],
    responseContract = {},
    functionAgreement = {},
    confidence = {},
    sources = {}
  } = {}) {
    return {
      readyForReconciliation:
        Boolean(
          primary.name &&
          primary.family
        ),

      primaryFunction: {
        name:
          primary.name,

        family:
          primary.family,

        reason:
          primary.reason,

        score:
          primary.score,

        origin:
          primary.origin,

        evidenceRefs:
          primary.evidenceRefs ||
          []
      },

      secondaryFunctions:
        secondaryFunctions.map(
          candidate => ({
            name:
              candidate.name,

            family:
              candidate.family,

            score:
              candidate.score,

            reason:
              candidate.reason,

            evidenceRefs:
              candidate.evidenceRefs ||
              []
          })
        ),

      rankedFunctions,

      responseContract,

      functionAgreement,

      confidence,

      ambiguity: {
        present:
          sources.ambiguity
            ?.present === true,

        requiresClarification:
          sources.ambiguity
            ?.requiresClarification ===
          true,

        unresolvedSlots:
          sources.ambiguity
            ?.unresolvedSlots ||
          []
      },

      continuity: {
        isContinuation:
          sources.continuity
            ?.isContinuation === true,

        requiresPriorContext:
          sources.continuity
            ?.requiresPriorContext ===
          true,

        referencesPriorArtifact:
          sources.continuity
            ?.referencesPriorArtifact ===
          true,

        anchor:
          sources.continuity
            ?.anchor ||
          null
      },

      contextModifiers:
        sources.contextModifiers,

      constraints:
        sources.constraints,

      stakes:
        sources.stakes,

      authority: {
        canChooseLane:
          false,

        canChooseRoute:
          false,

        canChoosePlanner:
          false,

        canChooseCapabilities:
          false,

        canDetermineSafetySeverity:
          false,

        canOverrideSafety:
          false,

        canAnswerUser:
          false,

        role:
          "conversation_function_to_reconciliation_handoff"
      }
    };
  },

  /* =====================================================
     DEFAULT
  ===================================================== */

  defaultFunction() {
    return {
      name:
        "general_conversation",

      family:
        "conversation",

      score:
        45,

      reason:
        "No specialized conversational purpose was established from upstream meaning.",

      origin:
        "default",

      evidenceRefs: [],

      reasons: [
        "No specialized conversational purpose was established from upstream meaning."
      ]
    };
  },

  /* =====================================================
     HELPERS
  ===================================================== */
firstNonEmptyObject(
  ...values
) {
  return (
    values.find(value =>
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    ) ||
    {}
  );
},

firstNonEmptyArray(
  ...values
) {
  return (
    values.find(value =>
      Array.isArray(value) &&
      value.length > 0
    ) ||
    []
  );
},

  collectEvidenceRefs(
    ...sources
  ) {
    const refs = [];

    sources.forEach(source => {
      if (!source) {
        return;
      }

      if (
        Array.isArray(
          source.evidenceRefs
        )
      ) {
        refs.push(
          ...source.evidenceRefs
        );
      }

      if (
        Array.isArray(
          source.evidence
        )
      ) {
        refs.push(
          ...source.evidence
        );
      }
    });

    return [
      ...new Set(
        refs.filter(Boolean)
      )
    ];
  },

  includesAny(
    value = "",
    terms = []
  ) {
    const normalized =
      this.normalize(value);

    return terms.some(term =>
      normalized.includes(
        this.normalize(term)
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

  confidenceLabel(
    value = 0
  ) {
    const confidence =
      this.normalizeConfidence(
        value
      );

    if (
      confidence >= 0.88
    ) {
      return "high";
    }

    if (
      confidence >= 0.68
    ) {
      return "medium";
    }

    if (
      confidence >= 0.45
    ) {
      return "low";
    }

    return "very_low";
  },

  normalize(value = "") {
    return String(
      value || ""
    )
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.conversationFunctionEngine =
  window.AriConversationFunctionEngine;

console.log(
  "ARI CONVERSATION FUNCTION ENGINE LOADED:",
  window.AriConversationFunctionEngine?.version
);