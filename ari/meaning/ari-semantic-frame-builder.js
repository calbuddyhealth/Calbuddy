// ari/meaning/ari-semantic-frame-builder-v4.js
// Ari Semantic Frame Builder
// Purpose: Convert canonical perception evidence into structured conceptual meaning.
// V4.0.0 — Centralized Operation Registry / Referential Continuity / Compatibility-Preserving Refactor

window.Ari = window.Ari || {};

window.AriSemanticFrameBuilder = {
  version: "4.0.0",

  SOURCE: "ari-semantic-frame-builder",

  OPERATION_REGISTRY: {
    respond: {
      requestType: "general",
      frameType: "general_request",
      interactionFamily: "general",
      intentFamily: "general_response",
      domain: "general_understanding",
      requestedOutput: "response",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    provide_information: {
      requestType: "information",
      frameType: "information_request",
      interactionFamily: "information",
      intentFamily: "fact_retrieval",
      domain: "general_understanding",
      requestedOutput: "direct_information",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    },

    interpret_meaning: {
      requestType: "explanation",
      frameType: "meaning_interpretation_request",
      interactionFamily: "information",
      intentFamily: "interpretation",
      domain: "general_understanding",
      requestedOutput: "interpretation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "meaning_request",
      executionKind: null
    },

    explain_or_teach: {
      requestType: "explanation",
      frameType: "explanation_request",
      interactionFamily: "information",
      intentFamily: "explanation",
      domain: "general_understanding",
      requestedOutput: "explanation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    },

compare_options: {
  requestType: "decision",
  frameType: "comparison_request",
  interactionFamily: "decision",
  intentFamily: "comparison",
  domain: "decision",
  requestedOutput: "comparison",
  requiredSlots: ["object"],
  responseMode: "recommendation",
  conversationStyle: "comparison_request",
  executionKind: null
},

    decide_or_prioritize: {
      requestType: "decision",
      frameType: "decision_request",
      interactionFamily: "decision",
      intentFamily: "recommendation",
      domain: "decision",
      requestedOutput: "recommendation_or_priority",
      requiredSlots: ["object"],
      responseMode: "recommendation",
      conversationStyle: "recommendation_request",
      executionKind: null
    },

    evaluate_and_recommend: {
  requestType: "decision",
  frameType: "decision_request",
  interactionFamily: "decision",
  intentFamily: "recommendation",
  domain: "decision",
  requestedOutput: "recommendation",
  requiredSlots: ["object"],
  responseMode: "recommendation",
  conversationStyle: "recommendation_request",
  executionKind: null
},

    create_plan: {
      requestType: "planning",
      frameType: "planning_request",
      interactionFamily: "planning",
      intentFamily: "planning",
      domain: "general_understanding",
      requestedOutput: "plan_or_roadmap",
      requiredSlots: ["object"],
      responseMode: "plan",
      conversationStyle: "planning_request",
      executionKind: null
    },

    produce_or_revise_text: {
      requestType: "writing",
      frameType: "writing_request",
      interactionFamily: "writing",
      intentFamily: "text_generation",
      domain: "writing",
      requestedOutput: "written_text",
      requiredSlots: ["object"],
      responseMode: "written_output",
      conversationStyle: "writing_request",
      executionKind: "creation"
    },

    translate: {
      requestType: "translation",
      frameType: "translation_request",
      interactionFamily: "translation",
      intentFamily: "language_transformation",
      domain: "language",
      requestedOutput: "translated_text",
      requiredSlots: ["object"],
      responseMode: "translated_output",
      conversationStyle: "translation_request",
      executionKind: null
    },

    calculate_or_convert: {
      requestType: "calculation",
      frameType: "calculation_request",
      interactionFamily: "calculation",
      intentFamily: "calculation",
      domain: "calculation",
      requestedOutput: "calculated_result",
      requiredSlots: ["object"],
      responseMode: "calculated_output",
      conversationStyle: "calculation_request",
      executionKind: null
    },

    verify_or_review: {
      requestType: "verification",
      frameType: "verification_request",
      interactionFamily: "verification",
      intentFamily: "verification",
      domain: "general_understanding",
      requestedOutput: "verification_result",
      requiredSlots: ["object"],
      responseMode: "verification_result",
      conversationStyle: "verification_request",
      executionKind: null
    },

    inspect_and_explain: {
      requestType: "verification",
      frameType: "verification_request",
      interactionFamily: "verification",
      intentFamily: "analysis",
      domain: "project",
      requestedOutput: "architectural_analysis",
      requiredSlots: ["object"],
      responseMode: "verification_result",
      conversationStyle: "verification_request",
      executionKind: null
    },

    retrieve_prior_context: {
      requestType: "memory",
      frameType: "memory_request",
      interactionFamily: "memory",
      intentFamily: "memory_action",
      domain: "memory",
      requestedOutput: "recalled_context",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    save_or_forget_memory: {
      requestType: "memory",
      frameType: "memory_request",
      interactionFamily: "memory",
      intentFamily: "memory_action",
      domain: "memory",
      requestedOutput: "memory_action",
      requiredSlots: ["object"],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    answer_identity_question: {
      requestType: "identity",
      frameType: "identity_question",
      interactionFamily: "identity",
      intentFamily: "identity",
      domain: "identity",
      requestedOutput: "identity_answer",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "identity_question",
      executionKind: null
    },

    provide_opinion: {
      requestType: "opinion",
      frameType: "opinion_request",
      interactionFamily: "opinion",
      intentFamily: "judgment",
      domain: "general_understanding",
      requestedOutput: "opinion",
      requiredSlots: ["object"],
      responseMode: "normal_response",
      conversationStyle: "opinion_request",
      executionKind: null
    },

    create_artifact: {
      requestType: "creation",
      frameType: "creation_request",
      interactionFamily: "creation",
      intentFamily: "artifact_creation",
      domain: "project",
      requestedOutput: "created_artifact",
      requiredSlots: ["object"],
      responseMode: "created_artifact",
      conversationStyle: "creation_request",
      executionKind: "creation"
    },

    implement_or_modify: {
      requestType: "implementation",
      frameType: "developer_artifact_request",
      interactionFamily: "developer_task",
      intentFamily: "artifact_execution",
      domain: "project",
      requestedOutput: "implementation_or_code",
      requiredSlots: ["object"],
      responseMode: "code_or_artifact",
      conversationStyle: "artifact_operation",
      executionKind: "modification"
    },

    provide_emotional_support: {
      requestType: "emotional_support",
      frameType: "emotional_support_request",
      interactionFamily: "emotional_support",
      intentFamily: "emotional_support",
      domain: "emotion",
      requestedOutput: "supportive_response",
      requiredSlots: [],
      responseMode: "supportive_response",
      conversationStyle: "support_request",
      executionKind: null
    },

    explain_without_execution: {
      requestType: "explanation",
      frameType: "explanation_request",
      interactionFamily: "information",
      intentFamily: "explanation",
      domain: "project",
      requestedOutput: "explanation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    }
  },

  OPERATION_ALIASES: {
    respond: "respond",
    general: "respond",
    information: "provide_information",
    provide_information: "provide_information",
    provide_information_directly: "provide_information",
    direct_information: "provide_information",
    factual: "provide_information",
    understanding: "provide_information",
    meaning: "interpret_meaning",
    interpret_meaning: "interpret_meaning",
    explanation: "explain_or_teach",
    explain: "explain_or_teach",
    explain_or_teach: "explain_or_teach",
    teaching: "explain_or_teach",
    decision: "decide_or_prioritize",
decide: "decide_or_prioritize",
choose: "decide_or_prioritize",
prioritize: "decide_or_prioritize",
decide_or_prioritize: "decide_or_prioritize",

compare: "compare_options",
comparison: "compare_options",
compare_options: "compare_options",

recommend: "evaluate_and_recommend",
recommendation: "evaluate_and_recommend",
decide_or_recommend: "evaluate_and_recommend",
recommend_or_decide: "evaluate_and_recommend",
evaluate_and_recommend: "evaluate_and_recommend",
    planning: "create_plan",
    plan: "create_plan",
    create_plan: "create_plan",
    writing: "produce_or_revise_text",
    produce_or_revise_text: "produce_or_revise_text",
    translation: "translate",
    translate: "translate",
    calculation: "calculate_or_convert",
    calculate: "calculate_or_convert",
    calculate_or_convert: "calculate_or_convert",
    verification: "verify_or_review",
    verify: "verify_or_review",
    review: "verify_or_review",
    verify_or_review: "verify_or_review",
    inspect_and_explain: "inspect_and_explain",
    recall: "retrieve_prior_context",
    retrieve_prior_context: "retrieve_prior_context",
    memory: "save_or_forget_memory",
    save_or_forget_memory: "save_or_forget_memory",
    identity: "answer_identity_question",
    answer_identity_question: "answer_identity_question",
    opinion: "provide_opinion",
    provide_opinion: "provide_opinion",
    creation: "create_artifact",
    create_artifact: "create_artifact",
    implementation: "implement_or_modify",
    implement: "implement_or_modify",
    modify: "implement_or_modify",
    implement_or_modify: "implement_or_modify",
    emotional: "provide_emotional_support",
    emotional_support: "provide_emotional_support",
    provide_emotional_support: "provide_emotional_support",
    explain_without_execution: "explain_without_execution"
  },

  PROHIBITED_EXECUTION_OPERATIONS: [
    "implement_or_modify",
    "create_artifact",
    "produce_or_revise_text"
  ],

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  build(input = {}) {
    const summary = input.summary || input || {};
    const originalText = this.readOriginalText(summary);
    const normalized = this.normalizeUserText(originalText);
    const sources = this.readUpstreamSources(summary);
    const evidenceIndex = this.buildEvidenceIndex({ normalized, sources });
    const requestModel = this.buildRequestModel({ normalized, sources, evidenceIndex });
    const semanticSlots = this.buildSemanticSlots({ normalized, sources, evidenceIndex, requestModel });
    const contextModel = this.buildContextModel({ normalized, sources, evidenceIndex, requestModel });
    const continuity = this.buildContinuityModel({ normalized, sources, evidenceIndex });

    const primaryFrame = this.buildPrimaryFrame({
      requestModel,
      semanticSlots,
      contextModel,
      continuity
    });

    const secondaryFrames = this.buildSecondaryFrames({
      requestModel,
      semanticSlots,
      contextModel,
      continuity
    });

    const rankedFrames = [primaryFrame, ...secondaryFrames];
    const ambiguity = this.buildAmbiguityModel({
      requestModel,
      semanticSlots,
      primaryFrame,
      secondaryFrames,
      continuity
    });

    const frameAgreement = this.buildFrameAgreement({
      sources,
      requestModel,
      primaryFrame
    });

    const confidence = this.calculateMeaningConfidence({
      sources,
      requestModel,
      semanticSlots,
      primaryFrame,
      ambiguity,
      frameAgreement,
      continuity
    });

    primaryFrame.semanticConfidence = confidence.normalized;
    primaryFrame.semanticConfidenceScore = confidence.score;
    primaryFrame.semanticConfidenceLabel = confidence.label;

    const framePriority = this.buildFramePriority({
      primaryFrame,
      secondaryFrames,
      requestModel,
      semanticSlots
    });

    const responseRequirements = this.buildResponseRequirements({
      normalized,
      requestModel,
      primaryFrame,
      secondaryFrames,
      continuity,
      ambiguity
    });

    const emotionalOverlay = this.buildEmotionalOverlay({
      sources,
      contextModel,
      evidenceIndex
    });

    const canonicalMeaning = this.buildCanonicalMeaning({
      sources,
      requestModel,
      semanticSlots,
      contextModel,
      continuity,
      primaryFrame,
      secondaryFrames,
      ambiguity,
      confidence
    });

    const handoff = this.buildHandoff({
      canonicalMeaning,
      primaryFrame,
      secondaryFrames,
      contextModel,
      continuity,
      ambiguity,
      responseRequirements,
      frameAgreement,
      confidence
    });

    const semanticSummary = this.buildSemanticSummary({
      normalized,
      requestModel,
      semanticSlots,
      contextModel,
      continuity,
      primaryFrame,
      secondaryFrames,
      ambiguity,
      canonicalMeaning,
      responseRequirements,
      emotionalOverlay,
      framePriority,
      frameAgreement,
      confidence
    });

    return this.buildPayload({
      originalText,
      normalized,
      sources,
      evidenceIndex,
      requestModel,
      semanticSlots,
      contextModel,
      continuity,
      primaryFrame,
      secondaryFrames,
      rankedFrames,
      framePriority,
      frameAgreement,
      responseRequirements,
      emotionalOverlay,
      ambiguity,
      canonicalMeaning,
      handoff,
      semanticSummary
    });
  },

  readOriginalText(summary = {}) {
    return this.clean(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );
  },

  /* =====================================================
     UPSTREAM INPUTS
  ===================================================== */

  readUpstreamSources(summary = {}) {
    const observations =
      summary.canonicalObservationLedger ||
      summary.observationLedger ||
      summary.observations ||
      summary.observerEvidence?.observations ||
      [];

    return {
      observations: Array.isArray(observations) ? observations : [],
      questionUnderstanding:
        summary.questionUnderstanding ||
        summary.questionUnderstandingResult ||
        {},
      classification:
        summary.universalConversationClassification ||
        summary.conversationClassification ||
        {},
      lifeSignals: summary.lifeSignalResult || {},
      routingEvidence:
        summary.routingEvidence ||
        summary.observerRoutingEvidence ||
        {},
      safety: summary.safetyContextGate || {},
      thread: this.readInheritedContext(summary),
      githubFileContext:
        summary.githubFileContext ||
        summary.appContext?.githubFileContext ||
        null,
      referenceResolution:
        summary.referenceResolution ||
        summary.entityReferenceState?.referenceResolution ||
        summary.entityReferenceState ||
        null
    };
  },

  readInheritedContext(summary = {}) {
    const threadState = summary.threadState || {};
    const recentMessages =
      summary.recentMessages ||
      threadState.lastMessages ||
      [];

    return {
      threadAvailable: Boolean(
        summary.threadStateLoaded ||
        recentMessages.length ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.continuitySummary ||
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse
      ),
      currentTopic: this.stringifyTopic(
        summary.activeTopic ||
        threadState.currentTopic ||
        null
      ),
      activeSubject: this.stringifyTopic(
        summary.resolvedPrimarySubject ||
        threadState.activeSubject ||
        null
      ),
      previousAnswerSummary:
        threadState.previousAnswerSummary ||
        threadState.lastFinalResponse ||
        summary.previousAnswerSummary ||
        null,
      recentMessages: Array.isArray(recentMessages)
        ? recentMessages.slice(-8)
        : [],
      authority: "context_only_not_current_meaning"
    };
  },

  /* =====================================================
     EVIDENCE INDEX
  ===================================================== */

  buildEvidenceIndex({ normalized = {}, sources = {} } = {}) {
    const items = (sources.observations || []).map((observation, index) => {
      const id = observation.id || observation.observationId || `obs_${index + 1}`;

      return {
        id,
        type: this.normalizeKey(observation.type),
        value: this.normalizeHumanText(
          observation.value ?? observation.signal ?? observation.name
        ),
        category: this.normalizeKey(observation.category),
        domain: this.normalizeDomain(observation.domain),
        subject: observation.subject || null,
        target: observation.target || null,
        relation: observation.relation || null,
        operation: observation.operation || null,
        requestedOutput: observation.requestedOutput || null,
        confidence: this.normalizeConfidence(observation.confidence),
        weight: Number(observation.weight || 0),
        evidenceClass:
          observation.evidenceClass ||
          observation.observationType ||
          "unknown",
        inferenceLevel: observation.inferenceLevel || "observed",
        source: observation.source || "unknown",
        supportingSources: this.asArray(observation.supportingSources),
        evidence: this.asArray(observation.evidence),
        raw: observation
      };
    });

    const byType = this.groupBy(items, "type");
    const byCategory = this.groupBy(items, "category");
    const byDomain = this.groupBy(items, "domain");

    return {
      count: items.length,
      items,
      byType,
      byCategory,
      byDomain,
      directEvidence: items.filter(item =>
        item.inferenceLevel === "observed" ||
        ["direct_text", "user_confirmed"].includes(item.evidenceClass)
      ),
      inferredEvidence: items.filter(item =>
        item.inferenceLevel === "inferred" ||
        String(item.evidenceClass || "").includes("inference")
      ),
      operationEvidence: items.filter(item =>
        item.operation ||
        ["operation_signal", "question_purpose", "requested_operation"].includes(item.type)
      ),
      outputEvidence: items.filter(item =>
        item.requestedOutput ||
        ["requested_output", "answer_expectation"].includes(item.type)
      ),
      referenceEvidence: items.filter(item =>
        ["reference_signal", "missing_anchor_signal", "continuity_signal"].includes(item.type) ||
        item.category === "continuity"
      ),
      domainEvidence: items.filter(item =>
        item.domain &&
        !["general", "general_understanding"].includes(item.domain)
      ),
      normalizedText: normalized.text || "",
      authority: "evidence_index_only"
    };
  },

  /* =====================================================
     REQUEST MODEL
  ===================================================== */

  buildRequestModel({ normalized = {}, sources = {}, evidenceIndex = {} } = {}) {
    const question = sources.questionUnderstanding || {};
    const classification = sources.classification || {};

    const requestedOperations = this.normalizeOperationList(question.requestedOperations);
    const requestedOutputs = this.normalizeList(question.requestedOutputs);
    const primaryPurpose = this.normalizeKey(
      question.primaryPurpose ||
      question.questionPurpose ||
      ""
    );
    const classifierOperation = this.normalizeOperation(
      classification.explicitRequestedOperation
    );
    const classifierOutput = this.normalizeKey(
      classification.explicitRequestedOutput
    );
    const classifierRequestType = this.normalizeKey(
      classification.explicitRequestType
    );

    const explicitMeaningRequest = this.detectMeaningRequest(normalized.text);

    let proposedOperation =
      explicitMeaningRequest.present
        ? "interpret_meaning"
        : requestedOperations[0] ||
          classifierOperation ||
          this.operationFromPurpose(primaryPurpose, classifierRequestType) ||
          "respond";

    proposedOperation = this.normalizeOperation(proposedOperation);

const compositeDecisionRequest =
  this.detectCompositeDecisionRequest({
    text:
      normalized.text ||
      "",

    requestedOperations,

    classifierOperation,

    proposedOperation
  });

if (
  compositeDecisionRequest.present
) {
  proposedOperation =
    compositeDecisionRequest
      .primaryOperation;
}

    let proposedOutput =
      explicitMeaningRequest.present
        ? "interpretation"
        : requestedOutputs[0] ||
          classifierOutput ||
          this.operationDefinition(proposedOperation).requestedOutput ||
          "response";

    const explicitRequestPresent = Boolean(
      classification.explicitRequestPresent === true ||
      requestedOperations.length ||
      requestedOutputs.length ||
      explicitMeaningRequest.present ||
      (
        primaryPurpose &&
        !["unknown", "general"].includes(primaryPurpose)
      )
    );

    const actionPolicy = this.buildActionPolicy({
      text: normalized.text,
      proposedOperation,
      proposedOutput,
      requestedOperations,
      requestedOutputs,
      classifierOperation,
      classifierOutput,
      primaryPurpose,
      classifierRequestType
    });

    const operation = this.normalizeOperation(
      actionPolicy.resolvedOperation || proposedOperation || "respond"
    );
    const operationDefinition = this.operationDefinition(operation);
    const requestedOutput =
      actionPolicy.resolvedOutput ||
      proposedOutput ||
      operationDefinition.requestedOutput ||
      "response";

    const compositeSupportingOperations =
  compositeDecisionRequest.present
    ? compositeDecisionRequest
        .requiredSupportingOperations
    : [];

const secondaryOperations =
  this.uniqueNormalizedValues([
    ...compositeSupportingOperations,

    ...requestedOperations.slice(1),

    classifierOperation &&
    classifierOperation !== operation
      ? classifierOperation
      : null
  ])
    .map(value =>
      this.normalizeOperation(
        value
      )
    )
    .filter(value =>
      value &&
      value !== operation
    )
    .filter(value =>
      !this.operationMatchesAny(
        value,
        actionPolicy
          .prohibitedOperations
      )
    );
    const secondaryOutputs = this.uniqueNormalizedValues([
      ...requestedOutputs.slice(1),
      classifierOutput && classifierOutput !== requestedOutput
        ? classifierOutput
        : null
    ]).filter(value => value !== requestedOutput);

    const requestEvidencePresent = Boolean(
      explicitRequestPresent ||
      requestedOperations.length ||
      requestedOutputs.length ||
      classifierOperation ||
      classifierOutput ||
      evidenceIndex.operationEvidence?.length ||
      evidenceIndex.outputEvidence?.length
    );

    const speechAct = this.resolveSpeechAct(normalized, operation);

    return {
      explicitRequestPresent,
      requestEvidencePresent,
      primaryPurpose: primaryPurpose || "understanding",
      purposeConfidence: this.normalizeConfidence(
        question.primaryPurposeConfidence ??
        question.confidence ??
        0
      ),
      purposeCandidates: this.asArray(question.purposeCandidates),
      supportPurposes: this.asArray(question.supportPurposes),
      multiPurpose: Boolean(
        question.multiPurpose === true ||
        secondaryOperations.length ||
        secondaryOutputs.length
      ),
      competingPurposes: this.asArray(question.competingPurposes),
      requestType: actionPolicy.resolvedRequestType || operationDefinition.requestType,
      operation,
      secondaryOperations,
      requestedOutput,
      secondaryOutputs,
      interactionFamily:
        actionPolicy.resolvedInteractionFamily ||
        operationDefinition.interactionFamily,
      intentFamily:
        actionPolicy.resolvedIntentFamily ||
        operationDefinition.intentFamily,
      classificationType: classification.conversationType || null,
      classificationIntent: classification.conversationIntent || null,
      speechAct,
      explicitRequestOverridesContext:
        classification.explicitRequestOverridesContext === true,
      actionPolicy,
      executionAllowed: actionPolicy.executionAllowed,
      analysisOnly: actionPolicy.analysisOnly,
      prohibitedOperations: actionPolicy.prohibitedOperations,
      deferredOperations: actionPolicy.deferredOperations,
      proposedOperation,
      proposedOutput,
      explicitMeaningRequest,
      compositeDecisionRequest,
      evidenceRefs: [
        ...(evidenceIndex.operationEvidence || []).map(item => item.id),
        ...(evidenceIndex.outputEvidence || []).map(item => item.id)
      ],
      sourceAgreement: {
        questionUnderstanding: Boolean(
          requestedOperations.length ||
          requestedOutputs.length ||
          (
            primaryPurpose &&
            !["understanding", "general", "unknown"].includes(primaryPurpose)
          )
        ),
        classifier: Boolean(
          classifierOperation ||
          classifierOutput ||
          classifierRequestType
        ),
        ledger: Boolean(
          evidenceIndex.operationEvidence?.length ||
          evidenceIndex.outputEvidence?.length
        )
      },
      sourceTrace: {
        questionOperation: requestedOperations[0] || null,
        classifierOperation: classifierOperation || null,
        explicitMeaningOverride: explicitMeaningRequest.present,
        proposedOperation,
        resolvedOperation: operation,
        resolutionChangedOperation: proposedOperation !== operation,
        questionOutput: requestedOutputs[0] || null,
        classifierOutput: classifierOutput || null,
        proposedOutput,
        resolvedOutput: requestedOutput,
        resolutionChangedOutput: proposedOutput !== requestedOutput
      }
    };
  },

  buildActionPolicy({
    text = "",
    proposedOperation = "respond",
    proposedOutput = "response",
    requestedOperations = [],
    requestedOutputs = [],
    classifierOperation = "",
    classifierOutput = "",
    primaryPurpose = "",
    classifierRequestType = ""
  } = {}) {
    const normalizedText = this.normalizeHumanText(text);
    const executionProhibited = this.hasExplicitArtifactProhibition(normalizedText);
    const deferredLanguagePresent = /\b(?:yet|for now|right now|at this point|not until|later)\b/.test(normalizedText);
    const analysisRequestPresent = this.hasExplicitAnalysisRequest(normalizedText);
    const recommendationRequested = /\b(?:recommend|recommendation|what do you honestly recommend|what would you recommend|which option should|what should we|what should i)\b/.test(normalizedText);
    const explanationRequested = /\b(?:explain|meaning|what does .+ mean|risks?|tradeoffs?|advantages?|disadvantages?|pros and cons|why)\b/.test(normalizedText);
    const comparisonRequested = /\b(?:whether|compare|versus|vs\.?|each choice|each option|options?)\b/.test(normalizedText);
    const inspectionRequested = /\b(?:inspect|review|look at|look through|which file|what file|next file)\b/.test(normalizedText);

    const prohibitedOperations = executionProhibited
      ? [...this.PROHIBITED_EXECUTION_OPERATIONS]
      : [];

    const deferredOperations = executionProhibited && deferredLanguagePresent
      ? [...prohibitedOperations]
      : [];

    let resolvedOperation = this.normalizeOperation(proposedOperation || "respond");
    let resolvedOutput = proposedOutput || this.operationDefinition(resolvedOperation).requestedOutput;
    let resolvedInteractionFamily = null;
    let resolvedIntentFamily = null;
    let resolvedRequestType = null;

    if (executionProhibited && this.isExecutionOperation(resolvedOperation)) {
      if (recommendationRequested || comparisonRequested) {
        resolvedOperation = "evaluate_and_recommend";
        resolvedOutput = explanationRequested
          ? "architectural_recommendation_with_risks"
          : "architectural_recommendation";
      } else if (inspectionRequested) {
        resolvedOperation = "inspect_and_explain";
        resolvedOutput = "architectural_analysis";
      } else {
        resolvedOperation = "explain_without_execution";
        resolvedOutput = "explanation";
      }

      const definition = this.operationDefinition(resolvedOperation);
      resolvedInteractionFamily = definition.interactionFamily;
      resolvedIntentFamily = definition.intentFamily;
      resolvedRequestType = definition.requestType;
    }

    const proposedOperationBlocked = this.operationMatchesAny(
      proposedOperation,
      prohibitedOperations
    );

    return {
      executionAllowed: !executionProhibited,
      analysisOnly: executionProhibited,
      explicitExecutionProhibition: executionProhibited,
      deferredExecution: executionProhibited && deferredLanguagePresent,
      analysisRequestPresent,
      recommendationRequested,
      explanationRequested,
      comparisonRequested,
      inspectionRequested,
      proposedOperation: proposedOperation || null,
      proposedOutput: proposedOutput || null,
      proposedOperationBlocked,
      resolvedOperation,
      resolvedOutput,
      resolvedInteractionFamily,
      resolvedIntentFamily,
      resolvedRequestType,
      prohibitedOperations,
      deferredOperations,
      sourceOperations: this.uniqueNormalizedValues([
        ...requestedOperations,
        classifierOperation,
        this.operationFromPurpose(primaryPurpose, classifierRequestType)
      ]).map(value => this.normalizeOperation(value)),
      sourceOutputs: this.uniqueNormalizedValues([
        ...requestedOutputs,
        classifierOutput,
        this.operationDefinition(
          this.operationFromPurpose(primaryPurpose, classifierRequestType)
        ).requestedOutput
      ]),
      reason: executionProhibited
        ? analysisRequestPresent
          ? "The user explicitly prohibited artifact execution while requesting analysis or recommendation."
          : "The user explicitly prohibited artifact execution."
        : "No explicit artifact-execution prohibition was detected.",
      authority: "explicit_user_action_authorization"
    };
  },

  hasExplicitArtifactProhibition(text = "") {
    const normalized = this.normalizeHumanText(text);
    const negativeLead = String.raw`(?:do not|don't|dont|did not|didn't|didnt|no need to|without|not asking (?:you )?to|i do not want (?:you )?to|i don't want (?:you )?to|i dont want (?:you )?to)`;
    const executionVerb = String.raw`(?:write|rewrite|modify|change|edit|patch|implement|code|generate|create|replace|remove|delete|add|wire|update|send)`;
    const artifactObject = String.raw`(?:any\s+)?(?:code|files?|artifacts?|implementation|patch(?:es)?|functions?|engines?|scripts?|architecture)`;
    const directPattern = new RegExp(
      String.raw`\b${negativeLead}\s+${executionVerb}(?:\s+${artifactObject})?\b`,
      "i"
    );
    const wantPattern = new RegExp(
      String.raw`\b(?:i\s+)?(?:do not|don't|dont)\s+want\s+(?:you\s+to\s+)?${executionVerb}(?:\s+${artifactObject})?\b`,
      "i"
    );
    const noCodePattern = /\b(?:no code|without code|analysis only|discussion only|do not make changes|don't make changes|dont make changes|do not change anything|don't change anything|dont change anything)\b/i;

    return directPattern.test(normalized) ||
      wantPattern.test(normalized) ||
      noCodePattern.test(normalized);
  },

  hasExplicitAnalysisRequest(text = "") {
    return /\b(?:tell me whether|explain|evaluate|assess|analyze|compare|recommend|recommendation|what do you recommend|what would you recommend|architectural risks?|tradeoffs?|which option|what should|which file|next file|inspect|review)\b/.test(
      this.normalizeHumanText(text)
    );
  },

  /* =====================================================
     SEMANTIC SLOTS
  ===================================================== */

  buildSemanticSlots({ normalized = {}, sources = {}, evidenceIndex = {}, requestModel = {} } = {}) {
    const text = normalized.text || "";
    const reference = this.detectPriorContextReference(text);
    const participants = this.resolveParticipants({ text, evidenceIndex });
    const subject = this.resolveSubject({ text, evidenceIndex });
    const object = this.resolveObject({
      text,
      sources,
      evidenceIndex,
      requestModel,
      reference
    });
    const target = this.resolveTarget({
      text,
      sources,
      evidenceIndex,
      requestModel,
      object,
      reference
    });
    const artifactTarget = this.resolveArtifactTarget({
      text,
      sources,
      requestModel
    });
    const options = this.extractOptions({ text, evidenceIndex, requestModel });
    const criteria = this.extractCriteria({ text, evidenceIndex });
    const timeframe = this.extractTimeframe({ text, evidenceIndex });
    const audience = this.extractAudience({ text, evidenceIndex });
    const location = this.extractLocation({ evidenceIndex });

    const requiredSlots = this.operationDefinition(requestModel.operation).requiredSlots || [];
    const slotMap = {
      subject,
      target,
      object,
      artifactTarget,
      options,
      criteria,
      timeframe,
      audience,
      location
    };
    const presentSlots = requiredSlots.filter(slot => this.slotPresent(slotMap[slot]));
    const missingSlots = requiredSlots.filter(slot => !this.slotPresent(slotMap[slot]));

    return {
      operation: requestModel.operation,
      requestedOutput: requestModel.requestedOutput,
      participants,
      subject,
      target,
      object,
      artifactTarget,
      referent: reference.present
        ? {
            type: reference.type,
            surface: reference.surface,
            origin: "explicit_reference",
            confidence: reference.confidence
          }
        : null,
      options,
      criteria,
      timeframe,
      audience,
      location,
      requiredSlots,
      presentSlots,
      missingSlots,
      slotCompleteness: {
        required: requiredSlots.length,
        present: presentSlots.length,
        missing: missingSlots,
        score: requiredSlots.length
          ? this.normalizeConfidence(presentSlots.length / requiredSlots.length)
          : 1
      }
    };
  },

  resolveParticipants({ text = "", evidenceIndex = {} } = {}) {
    const addresseeEvidence = (evidenceIndex.items || []).find(item =>
      item.target &&
      ["assistant", "ari"].includes(this.normalizeKey(item.target))
    );

    return {
      speaker: {
        type: "participant",
        value: "user",
        origin: "implicit_speaker",
        confidence: 0.95,
        evidenceRefs: []
      },
      addressee: {
        type: "participant",
        value: addresseeEvidence?.target || "assistant",
        origin: addresseeEvidence ? "observed" : "implicit_addressee",
        confidence: addresseeEvidence?.confidence || 0.9,
        evidenceRefs: addresseeEvidence ? [addresseeEvidence.id] : []
      },
      mentioned: this.extractMentionedParticipants(text)
    };
  },

  resolveSubject({ text = "", evidenceIndex = {} } = {}) {
    const subjectEvidence = (evidenceIndex.items || []).find(item => item.subject);
    if (subjectEvidence?.subject) {
      return {
        type: "explicit_subject",
        value: subjectEvidence.subject,
        origin: "explicit",
        confidence: subjectEvidence.confidence,
        evidenceRefs: [subjectEvidence.id]
      };
    }

    const closeOtherMatch = text.match(
      /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter)\b/
    );

    if (closeOtherMatch) {
      return {
        type: "close_other",
        value: closeOtherMatch[0],
        origin: "explicit",
        confidence: 0.9,
        evidenceRefs: []
      };
    }

    if (/\b(i|me|myself)\b/.test(text)) {
      return {
        type: "user",
        value: "self",
        origin: "explicit",
        confidence: 0.9,
        evidenceRefs: []
      };
    }

    return {
      type: "unspecified",
      value: null,
      origin: "unknown",
      confidence: 0,
      evidenceRefs: []
    };
  },

  resolveObject({
    text = "",
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    reference = {}
  } = {}) {
    if (reference.present) {
     const resolved =
  this.resolveReferenceBinding({
    sources,
    directReference:
      reference
  });
      return {
        type: resolved.resolved ? "resolved_referential_content" : "referential_content",
        name: resolved.value || reference.surface,
        surface: reference.surface,
        referenceType: reference.type,
        resolutionStatus: resolved.resolved ? "resolved" : "pending",
        resolvedValue: resolved.value,
        sourceTurnId: resolved.sourceTurnId,
        resolutionSource:
  resolved.resolutionSource ||
  null,
        entity: null,
        attribute: null,
        filePath: null,
        origin: resolved.resolved ? "resolved_reference" : "explicit_reference",
        confidence: resolved.resolved
          ? Math.max(reference.confidence, resolved.confidence)
          : reference.confidence,
        evidenceRefs: resolved.evidenceRefs
      };
    }

    const quoted = this.extractQuotedText(text);
    if (quoted) {
      return {
        type: "quoted_content",
        name: quoted,
        surface: quoted,
        referenceType: null,
        resolutionStatus: "explicit",
        resolvedValue: quoted,
        sourceTurnId: null,
        entity: null,
        attribute: null,
        filePath: null,
        origin: "explicit",
        confidence: 0.94,
        evidenceRefs: []
      };
    }

    const objectEvidence = (evidenceIndex.items || []).find(item =>
      item.type === "slot_signal" &&
      item.raw?.slotCandidate === "object"
    );

    if (objectEvidence) {
      return {
        type: "semantic_object",
        name:
          objectEvidence.raw?.evidence?.text ||
          objectEvidence.raw?.evidence ||
          objectEvidence.value ||
          null,
        entity: null,
        attribute: null,
        filePath: sources.githubFileContext?.filePath || null,
        origin: "explicit",
        confidence: objectEvidence.confidence,
        evidenceRefs: [objectEvidence.id]
      };
    }

    const developerTarget = this.extractDeveloperTarget(text);
    if (developerTarget) {
      return {
        type: developerTarget.type,
        name: developerTarget.value,
        entity: null,
        attribute: null,
        filePath: developerTarget.type === "file"
          ? developerTarget.value
          : sources.githubFileContext?.filePath || null,
        origin: "explicit",
        confidence: developerTarget.confidence,
        evidenceRefs: []
      };
    }

    const factualObject = this.extractFactualObject(text, requestModel);
    if (factualObject) {
      return {
        ...factualObject,
        filePath: null,
        origin: "explicit",
        confidence: factualObject.confidence || 0.84,
        evidenceRefs: []
      };
    }

    const decisionObject = this.extractDecisionObject(text, requestModel);
    if (decisionObject) {
      return decisionObject;
    }

    const writingObject = this.extractWritingObject(text, requestModel);
    if (writingObject) {
      return writingObject;
    }

    const remaining = this.extractFallbackObject(text, requestModel.operation);
    return {
      type: remaining ? "concept" : "unknown",
      name: remaining || null,
      entity: null,
      attribute: null,
      filePath: sources.githubFileContext?.filePath || null,
      origin: remaining ? "inferred" : "unknown",
      confidence: remaining ? 0.52 : 0,
      evidenceRefs: []
    };
  },

  resolveTarget({ object = {}, reference = {} } = {}) {
    if (reference.present) {
      return {
        type: object.type || "referential_content",
        value: object.name || reference.surface,
        origin: object.origin || "explicit_reference",
        confidence: object.confidence || reference.confidence,
        evidenceRefs: object.evidenceRefs || []
      };
    }

    if (object?.name) {
      return {
        type: object.type || "concept",
        value: object.name,
        origin: object.origin || "inferred",
        confidence: object.confidence || 0.5,
        evidenceRefs: object.evidenceRefs || []
      };
    }

    return {
      type: "unknown",
      value: null,
      origin: "unknown",
      confidence: 0,
      evidenceRefs: []
    };
  },

  resolveArtifactTarget({ text = "", sources = {}, requestModel = {} } = {}) {
    const definition = this.operationDefinition(requestModel.operation);
    const filePath =
      this.extractDeveloperTarget(text)?.type === "file"
        ? this.extractDeveloperTarget(text).value
        : sources.githubFileContext?.filePath || null;

    if (!definition.executionKind && !filePath) {
      return null;
    }

    return {
      type: filePath ? "file" : "artifact",
      value: filePath,
      origin: filePath ? "explicit_or_inherited" : "inferred",
      confidence: filePath ? 0.95 : 0.55,
      evidenceRefs: []
    };
  },

  /* =====================================================
     CONTEXT
  ===================================================== */

  buildContextModel({ normalized = {}, sources = {}, evidenceIndex = {}, requestModel = {} } = {}) {
    const modifiers = [];
    const constraints = [];
    const stakes = [];

    const addUnique = (collection, item) => this.addUniqueSemanticItem(collection, item);
    const addModifier = item => addUnique(modifiers, item);
    const addConstraint = item => addUnique(constraints, item);
    const addStake = item => addUnique(stakes, item);

    this.addEmotionalContext({ sources, evidenceIndex, addModifier });
    this.addLifeContext({ sources, addModifier, addConstraint, addStake });
    this.addDomainContext({
      normalized,
      evidenceIndex,
      addModifier,
      addConstraint,
      addStake
    });
    this.addTimeAndResourceConstraints({ normalized, evidenceIndex, addConstraint });

    const domains = this.resolveSemanticDomains({
      sources,
      evidenceIndex,
      requestModel,
      modifiers,
      stakes
    });

    return {
      modifiers,
      constraints,
      stakes,
      primaryDomain: domains[0] || "general_understanding",
      secondaryDomains: domains.slice(1),
      domains,
      explicitRequestDominant: requestModel.explicitRequestPresent === true,
      contextMayModifyResponse: Boolean(
        modifiers.length ||
        constraints.length ||
        stakes.length
      ),
      contextMayReplaceRequest: false
    };
  },

  addEmotionalContext({ sources = {}, evidenceIndex = {}, addModifier = () => {} } = {}) {
    const classification = sources.classification || {};
    const evidence = this.mergeEvidenceGroups(
      evidenceIndex.byDomain?.emotion,
      evidenceIndex.byCategory?.emotion,
      evidenceIndex.byType?.emotion_word
    );

    if (
      classification.emotionalContextPresent !== true &&
      !evidence.length
    ) {
      return;
    }

    const explicitSupport =
      classification.emotionalSupportExplicitlyRequested === true;

    addModifier({
      type: explicitSupport
        ? "emotional_support_request"
        : "emotional_context",
      value: explicitSupport
        ? "support_explicitly_requested"
        : "expressed_emotional_state",
      role: explicitSupport ? "request_relevant" : "context_modifier",
      explicit: explicitSupport,
      confidence: this.averageConfidence(evidence, explicitSupport ? 0.9 : 0.68),
      evidenceRefs: evidence.map(item => item.id)
    });
  },

  addLifeContext({ sources = {}, addModifier = () => {}, addConstraint = () => {}, addStake = () => {} } = {}) {
    const lifeSignals = sources.lifeSignals || {};
    const signals = this.asArray(lifeSignals.signals);

    signals.forEach(signal => {
      const name = this.normalizeHumanText(signal?.name || signal);
      if (!name) return;

      const confidence = this.normalizeConfidence(
        signal?.confidence ??
        lifeSignals.primarySignalConfidence ??
        0.65
      );

      if (/family|fatherhood|parenthood/.test(name)) {
        addStake({
          type: "family_stake",
          value: name,
          role: "stake",
          confidence,
          evidenceRefs: []
        });
      }

      if (/military|career|identity/.test(name)) {
        addModifier({
          type: "life_transition",
          value: name,
          role: "context_modifier",
          confidence,
          evidenceRefs: []
        });
      }

      if (/capacity|achievement pressure/.test(name)) {
        addConstraint({
          type: "capacity_pressure",
          value: name,
          role: "constraint",
          confidence,
          evidenceRefs: []
        });
      }

      if (/creative|mission/.test(name)) {
        addStake({
          type: "project_mission",
          value: name,
          role: "stake",
          confidence,
          evidenceRefs: []
        });
      }
    });
  },

  addDomainContext({
    normalized = {},
    evidenceIndex = {},
    addModifier = () => {},
    addConstraint = () => {},
    addStake = () => {}
  } = {}) {
    const medicalEvidence = this.mergeEvidenceGroups(
      evidenceIndex.byDomain?.medical,
      evidenceIndex.byDomain?.body,
      evidenceIndex.byType?.body_symptom,
      evidenceIndex.byType?.body_context
    );

    if (medicalEvidence.length) {
      addModifier({
        type: "medical_context",
        value: "body_or_health_context",
        role: "context_modifier",
        confidence: this.averageConfidence(medicalEvidence, 0.72),
        evidenceRefs: medicalEvidence.map(item => item.id)
      });
    }

    const relationshipEvidence = this.mergeEvidenceGroups(
      evidenceIndex.byDomain?.relationship,
      evidenceIndex.byDomain?.family,
      evidenceIndex.byType?.relationship_reference,
      evidenceIndex.byType?.family_reference
    );

    if (relationshipEvidence.length) {
      addStake({
        type: "relationship_or_family_stake",
        value: "close_relationship_context",
        role: "stake",
        confidence: this.averageConfidence(relationshipEvidence, 0.7),
        evidenceRefs: relationshipEvidence.map(item => item.id)
      });
    }

    const financeEvidence = this.mergeEvidenceGroups(
      evidenceIndex.byDomain?.finance,
      evidenceIndex.byDomain?.financial,
      evidenceIndex.byType?.money_reference
    );

    if (financeEvidence.length) {
      addConstraint({
        type: "financial_constraint",
        value: "financial_resources",
        role: "constraint",
        confidence: this.averageConfidence(financeEvidence, 0.7),
        evidenceRefs: financeEvidence.map(item => item.id)
      });
    }

    if (/\b(before my baby is born|before the baby is born)\b/.test(normalized.text || "")) {
      addConstraint({
        type: "deadline",
        value: "before_baby_arrival",
        role: "constraint",
        confidence: 0.92,
        evidenceRefs: []
      });

      addStake({
        type: "family_readiness",
        value: "baby_arrival",
        role: "stake",
        confidence: 0.9,
        evidenceRefs: []
      });
    }
  },

  addTimeAndResourceConstraints({ normalized = {}, evidenceIndex = {}, addConstraint = () => {} } = {}) {
    const text = normalized.text || "";

    if (/\b(no time|running out of time|limited time|before|deadline|soon|tonight|tomorrow|this week)\b/.test(text)) {
      addConstraint({
        type: "time_constraint",
        value: this.extractTimePhrase(text) || "limited_time",
        role: "constraint",
        confidence: 0.76,
        evidenceRefs: []
      });
    }

    if (/\b(exhausted|burned out|burnt out|overwhelmed|low energy|tired|capacity)\b/.test(text)) {
      const evidence = this.mergeEvidenceGroups(
        evidenceIndex.byDomain?.emotion,
        (evidenceIndex.items || []).filter(item => item.value.includes("exhaust"))
      );

      addConstraint({
        type: "energy_constraint",
        value: "limited_energy",
        role: "constraint",
        confidence: 0.84,
        evidenceRefs: evidence.map(item => item.id)
      });
    }
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  buildContinuityModel({ normalized = {}, sources = {}, evidenceIndex = {} } = {}) {
    const routingEvidence = sources.routingEvidence || {};
    const pressures = routingEvidence.routingPressures || {};
    const semanticClues = routingEvidence.semanticClues || {};
    const guards = routingEvidence.routingGuards || {};
    const thread = sources.thread || {};
    const referenceEvidence = evidenceIndex.referenceEvidence || [];
    const directReference = this.detectPriorContextReference(normalized.text || "");
const resolvedReference =
  this.resolveReferenceBinding({
    sources,
    directReference
  });

    const contextDependency = Number(pressures.contextDependency || 0);
    const followUpPressure = Number(pressures.followUpPressure || 0);
    const activeThreadMatch = Number(pressures.activeThreadMatch || 0);
    const likelyNeedsPriorContext = Boolean(
      semanticClues.likelyNeedsPriorContext === true ||
      guards.likelyNeedsPriorContext === true ||
      directReference.requiresPriorContext === true
    );
    const likelyStandalone = Boolean(
      !directReference.present &&
      (
        semanticClues.likelyStandalone === true ||
        guards.likelyStandalone === true
      )
    );
    const upstreamMissingAnchorSignal = Boolean(
      semanticClues.hasMissingAnchorSignal === true ||
      guards.hasMissingAnchorSignal === true
    );

    const requiresPriorContext = Boolean(
      directReference.present ||
      likelyNeedsPriorContext ||
      upstreamMissingAnchorSignal ||
      followUpPressure >= 0.6 ||
      contextDependency >= 0.65
    );

    const threadAvailable = thread.threadAvailable === true;
    const isContinuation = requiresPriorContext;

    const fallbackAnchor =
      thread.activeSubject ||
      thread.currentTopic ||
      thread.previousAnswerSummary ||
      null;

    const anchor = resolvedReference.resolved
      ? resolvedReference.value
      : directReference.present
        ? null
        : fallbackAnchor;

    const anchorResolved = Boolean(anchor);
    const missingAnchor = requiresPriorContext && !anchorResolved;

    const confidence = this.normalizeConfidence(
      contextDependency * 0.28 +
      followUpPressure * 0.28 +
      activeThreadMatch * 0.12 +
      (likelyNeedsPriorContext ? 0.16 : 0) +
      (directReference.present ? 0.16 : 0)
    );

    return {
      isContinuation,
      requiresPriorContext,
      referencesPriorContext: requiresPriorContext,
      referenceType: directReference.type,
      referenceSurface: directReference.surface,
      referenceResolved: resolvedReference.resolved,
      resolvedReferenceValue: resolvedReference.value,
      resolvedReferenceSourceTurnId: resolvedReference.sourceTurnId,
      referenceResolutionSource:
  resolvedReference.resolutionSource || null,
      referencesPriorArtifact: referenceEvidence.some(item =>
        item.domain === "project" ||
        /file|code|artifact/.test(item.value)
      ) || ["artifact_reference", "file_reference"].includes(directReference.type),
      referencesPriorQuestion: referenceEvidence.some(item =>
        item.value.includes("question")
      ) || directReference.type === "question_reference",
      threadAvailable,
      priorContextAvailable: threadAvailable,
      activeThreadMatch,
      contextDependency,
      followUpPressure,
      likelyNeedsPriorContext,
      likelyStandalone,
      upstreamMissingAnchorSignal,
      missingAnchor,
      anchor,
      anchorResolved,
      inheritedSubject: requiresPriorContext ? thread.activeSubject : null,
      previousAnswerSummary: requiresPriorContext ? thread.previousAnswerSummary : null,
      recentMessages: thread.recentMessages || [],
      confidence,
      evidence: referenceEvidence.map(item => item.id),
      authority: "semantic_continuity_description_only"
    };
  },

  detectPriorContextReference(text = "") {
    const normalized = this.normalizeHumanText(text);
    const patterns = [
      ["quote_reference", /\b(?:that|this|the)\s+(?:quote|quotation)\b/],
      ["statement_reference", /\b(?:that|this|the)\s+(?:statement|sentence|phrase|line|message|answer|response|part|section)\b/],
      ["artifact_reference", /\b(?:that|this|the|previous|last)\s+(?:file|code|script|function|engine|component|artifact|page)\b/],
      ["question_reference", /\b(?:that|this|the previous|the last)\s+question\b/],
      ["generic_reference", /\bwhat does that mean\b/],
      ["assistant_prior_meaning", /\bwhat did you mean(?: by that)?\b/],
      ["prior_item_reference", /\b(?:the one|that one|this one|what you said|what you mentioned|the previous one|the last one)\b/]
    ];

    for (const [type, pattern] of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return {
          present: true,
          type,
          surface: match[0],
          requiresPriorContext: true,
          confidence: 0.96
        };
      }
    }

    return {
      present: false,
      type: null,
      surface: null,
      requiresPriorContext: false,
      confidence: 0
    };
  },

  detectMeaningRequest(text = "") {
    const normalized = this.normalizeHumanText(text);
    const patterns = [
      /\bwhat does .+ mean\b/,
      /\bwhat is the meaning of\b/,
      /\bwhat is meant by\b/,
      /\bwhat did you mean\b/,
      /\binterpret (?:this|that|the)\b/,
      /\bexplain the meaning of\b/
    ];
    const match = patterns.map(pattern => normalized.match(pattern)).find(Boolean);

    return {
      present: Boolean(match),
      evidence: match?.[0] || null,
      operation: match ? "interpret_meaning" : null,
      requestedOutput: match ? "interpretation" : null,
      confidence: match ? 0.97 : 0
    };
  },

detectCompositeDecisionRequest({
  text = "",
  requestedOperations = [],
  classifierOperation = "",
  proposedOperation = ""
} = {}) {
  const normalizedText =
    this.normalizeHumanText(text);

  const sourceOperations =
    this.asArray([
      ...this.asArray(
        requestedOperations
      ),

      classifierOperation,

      proposedOperation
    ])
      .map(operation =>
        this.normalizeOperation(
          operation
        )
      )
      .filter(Boolean);

  const comparisonPresent =
    sourceOperations.includes(
      "compare_options"
    ) ||
    /\b(?:compare|comparison|versus|vs\.?)\b/.test(
      normalizedText
    );

  const recommendationPresent =
    sourceOperations.includes(
      "evaluate_and_recommend"
    ) ||
    sourceOperations.includes(
      "decide_or_prioritize"
    ) ||
    /\b(?:recommend|recommendation|which one should|which should|what should i choose|what should we choose)\b/.test(
      normalizedText
    );

  const explanationPresent =
    sourceOperations.includes(
      "explain_or_teach"
    ) ||
    /\b(?:explain|reasoning|why|reasons?|rationale|tradeoffs?|trade offs?)\b/.test(
      normalizedText
    );

  const present =
    comparisonPresent &&
    recommendationPresent;

  return {
    present,

    comparisonPresent,

    recommendationPresent,

    explanationPresent,

    primaryOperation:
      present
        ? "evaluate_and_recommend"
        : null,

    requiredSupportingOperations:
      [
        comparisonPresent
          ? "compare_options"
          : null,

        explanationPresent
          ? "explain_or_teach"
          : null
      ].filter(Boolean),

    confidence:
      present
        ? 0.97
        : 0,

    authority:
      "explicit_composite_request_detection"
  };
},

resolveReferenceBinding({
  sources = {},
  directReference = {}
} = {}) {
  if (
    !directReference.present
  ) {
    return {
      resolved:
        false,

      value:
        null,

      sourceTurnId:
        null,

      confidence:
        0,

      evidenceRefs:
        [],

      resolutionSource:
        "none"
    };
  }

  const authoritative =
    this.readResolvedReference(
      sources.referenceResolution,
      directReference
    );

  if (
    authoritative.resolved
  ) {
    return {
      ...authoritative,

      resolutionSource:
        "upstream_reference_resolution"
    };
  }

  const threadFallback =
    this.resolveReferenceFromThread({
      thread:
        sources.thread ||
        {},

      directReference
    });

  if (
    threadFallback.resolved
  ) {
    return threadFallback;
  }

  return {
    resolved:
      false,

    value:
      null,

    sourceTurnId:
      null,

    confidence:
      directReference.confidence ||
      0,

    evidenceRefs:
      [],

    resolutionSource:
      "unresolved"
  };
},

resolveReferenceFromThread({
  thread = {},
  directReference = {}
} = {}) {
  const recentMessages =
    this.asArray(
      thread.recentMessages
    );

  const newestFirst =
    [...recentMessages]
      .reverse();

  if (
    directReference.type ===
      "quote_reference"
  ) {
    for (
      const message
      of newestFirst
    ) {
      const text =
        this.readMessageText(
          message
        );

      if (!text) {
        continue;
      }

      const quotes =
        this.extractAllQuotedText(
          text
        );

      if (quotes.length) {
        return {
          resolved:
            true,

          value:
            quotes[
              quotes.length - 1
            ],

          sourceTurnId:
            message.turnId ||
            message.id ||
            null,

          confidence:
            0.82,

          evidenceRefs:
            this.asArray(
              message.evidenceRefs
            ),

          resolutionSource:
            "thread_quote_fallback"
        };
      }
    }
  }

  if (
    [
  "statement_reference",
  "assistant_prior_meaning",
  "prior_item_reference",
  "generic_reference"
].includes(
  directReference.type
)
  ) {
    const priorAssistantMessage =
      newestFirst.find(message => {
        const role =
          this.normalizeKey(
            message.role ||
            message.author ||
            message.sender ||
            ""
          );

        return [
          "assistant",
          "ari"
        ].includes(role) &&
        Boolean(
          this.readMessageText(
            message
          )
        );
      });

    if (
      priorAssistantMessage
    ) {
      return {
        resolved:
          true,

        value:
          this.readMessageText(
            priorAssistantMessage
          ),

        sourceTurnId:
          priorAssistantMessage
            .turnId ||
          priorAssistantMessage
            .id ||
          null,

        confidence:
          0.72,

        evidenceRefs:
          this.asArray(
            priorAssistantMessage
              .evidenceRefs
          ),

        resolutionSource:
          "thread_message_fallback"
      };
    }

    if (
      thread.previousAnswerSummary
    ) {
      return {
        resolved:
          true,

        value:
          thread.previousAnswerSummary,

        sourceTurnId:
          null,

        confidence:
          0.64,

        evidenceRefs:
          [],

        resolutionSource:
          "previous_answer_summary_fallback"
      };
    }
  }

  if (
    directReference.type ===
      "question_reference"
  ) {
    const priorUserMessage =
      newestFirst.find(message => {
        const role =
          this.normalizeKey(
            message.role ||
            message.author ||
            message.sender ||
            ""
          );

        return role === "user" &&
          Boolean(
            this.readMessageText(
              message
            )
          );
      });

    if (
      priorUserMessage
    ) {
      return {
        resolved:
          true,

        value:
          this.readMessageText(
            priorUserMessage
          ),

        sourceTurnId:
          priorUserMessage.turnId ||
          priorUserMessage.id ||
          null,

        confidence:
          0.76,

        evidenceRefs:
          this.asArray(
            priorUserMessage
              .evidenceRefs
          ),

        resolutionSource:
          "thread_question_fallback"
      };
    }
  }

  return {
    resolved:
      false,

    value:
      null,

    sourceTurnId:
      null,

    confidence:
      0,

    evidenceRefs:
      [],

    resolutionSource:
      "thread_reference_not_found"
  };
},

  readResolvedReference(referenceResolution = null, directReference = {}) {
    if (!referenceResolution || !directReference?.present) {
      return {
        resolved: false,
        value: null,
        sourceTurnId: null,
        confidence: 0,
        evidenceRefs: []
      };
    }

    const candidates = [
      ...this.asArray(referenceResolution.decisions),
      ...this.asArray(referenceResolution.resolvedReferences),
      referenceResolution
    ].filter(Boolean);

    const decision = candidates.find(item => {
      if (item.status && item.status !== "resolved") return false;
      const surface = this.normalizeHumanText(
        item.surface ||
        item.reference ||
        item.referenceSurface ||
        item.referenceText ||
        ""
      );
      return !surface ||
        surface === this.normalizeHumanText(directReference.surface) ||
        surface.includes(this.normalizeHumanText(directReference.surface)) ||
        this.normalizeHumanText(directReference.surface).includes(surface);
    });

    const value =
      decision?.resolvedValue ||
      decision?.resolvedTo?.value ||
      decision?.resolvedTo?.text ||
      decision?.resolvedTo ||
      decision?.value ||
      null;

    return {
      resolved: Boolean(value),
      value: typeof value === "string" ? value : this.stringifyTopic(value),
      sourceTurnId:
        decision?.sourceTurnId ||
        decision?.resolvedTurnId ||
        decision?.turnId ||
        null,
      confidence: this.normalizeConfidence(decision?.confidence || 0.85),
      evidenceRefs: this.asArray(
        decision?.evidenceRefs ||
        decision?.referenceId ||
        decision?.id
      )
    };
  },

  /* =====================================================
     FRAMES
  ===================================================== */

  buildPrimaryFrame({ requestModel = {}, semanticSlots = {}, contextModel = {}, continuity = {} } = {}) {
    const definition = this.operationDefinition(requestModel.operation);

    return {
      frameId: this.makeFrameId(
        definition.frameType,
        semanticSlots.object?.name ||
        semanticSlots.target?.value ||
        requestModel.operation,
        0
      ),
      frameType: definition.frameType,
      speechAct: requestModel.speechAct,
      operation: requestModel.operation,
      intent: requestModel.operation,
      userGoal: requestModel.operation,
      requestedOutput: requestModel.requestedOutput,
      interactionFamily: requestModel.interactionFamily,
      intentFamily: requestModel.intentFamily,
      participants: semanticSlots.participants,
      subject: semanticSlots.subject,
      target: semanticSlots.target,
      object: semanticSlots.object,
      artifactTarget: semanticSlots.artifactTarget,
      referent: semanticSlots.referent,
      options: semanticSlots.options,
      criteria: semanticSlots.criteria,
      timeframe: semanticSlots.timeframe,
      audience: semanticSlots.audience,
      location: semanticSlots.location,
      domain: contextModel.primaryDomain || definition.domain,
      secondaryDomains: contextModel.secondaryDomains,
      contextModifiers: contextModel.modifiers,
      constraints: contextModel.constraints,
      stakes: contextModel.stakes,
      continuity,
      slotCompleteness: semanticSlots.slotCompleteness,
      origin: requestModel.explicitRequestPresent ? "explicit" : "inferred",
      confidence: 50,
      confidenceLabel: "low",
      evidenceRefs: [...new Set(requestModel.evidenceRefs || [])],
      advisoryOnly: true
    };
  },

  buildSecondaryFrames({ requestModel = {}, semanticSlots = {}, contextModel = {}, continuity = {} } = {}) {
    return requestModel.secondaryOperations.slice(0, 8).map((operation, index) => {
      const definition = this.operationDefinition(operation);
      return {
        frameId: this.makeFrameId(
          definition.frameType,
          semanticSlots.object?.name || operation,
          index + 1
        ),
        frameType: definition.frameType,
        speechAct: requestModel.speechAct,
        operation,
        intent: operation,
        userGoal: operation,
        requestedOutput:
          requestModel.secondaryOutputs[index] ||
          definition.requestedOutput,
        interactionFamily: definition.interactionFamily,
        intentFamily: definition.intentFamily,
        participants: semanticSlots.participants,
        subject: semanticSlots.subject,
        target: semanticSlots.target,
        object: semanticSlots.object,
        artifactTarget: semanticSlots.artifactTarget,
        referent: semanticSlots.referent,
        options: semanticSlots.options,
        criteria: semanticSlots.criteria,
        timeframe: semanticSlots.timeframe,
        audience: semanticSlots.audience,
        location: semanticSlots.location,
        domain: contextModel.primaryDomain || definition.domain,
        secondaryDomains: contextModel.secondaryDomains,
        contextModifiers: contextModel.modifiers,
        constraints: contextModel.constraints,
        stakes: contextModel.stakes,
        continuity,
        slotCompleteness: semanticSlots.slotCompleteness,
        origin: "secondary_explicit_request",
        confidence: 45,
        confidenceLabel: "low",
        rankingScore: 45,
        evidenceRefs: [...new Set(requestModel.evidenceRefs || [])],
        advisoryOnly: true
      };
    });
  },

  buildFramePriority({ primaryFrame = {}, secondaryFrames = [], requestModel = {}, semanticSlots = {} } = {}) {
    const ordered = [
      {
        frameId: primaryFrame.frameId,
        frameType: primaryFrame.frameType,
        operation: primaryFrame.operation,
        target: primaryFrame.target,
        requestedOutput: primaryFrame.requestedOutput,
        domain: primaryFrame.domain,
        role: "primary",
        candidateConfidence: primaryFrame.confidence,
        semanticConfidence: primaryFrame.semanticConfidence,
        semanticConfidenceScore: primaryFrame.semanticConfidenceScore,
        semanticConfidenceLabel: primaryFrame.semanticConfidenceLabel,
        evidenceRefs: primaryFrame.evidenceRefs || []
      },
      ...secondaryFrames.map(frame => ({
        frameId: frame.frameId,
        frameType: frame.frameType,
        operation: frame.operation,
        target: frame.target,
        requestedOutput: frame.requestedOutput,
        domain: frame.domain,
        role: "secondary",
        candidateConfidence: frame.confidence,
        rankingScore: frame.rankingScore,
        evidenceRefs: frame.evidenceRefs || []
      }))
    ];

    return {
      primary: primaryFrame.frameId || null,
      primaryFrameType: primaryFrame.frameType || null,
      secondary: ordered.slice(1),
      ordered,
      hasMultipleFrames: ordered.length > 1,
      hasMultipleQuestions: requestModel.multiPurpose === true,
      hasMultipleOperations: requestModel.multiPurpose === true,
      shouldPreserveSecondaryFrames: ordered.length > 1,
      slotCompleteness: semanticSlots.slotCompleteness,
      authority: "semantic_priority_description_only"
    };
  },

  /* =====================================================
     AMBIGUITY / CONFIDENCE
  ===================================================== */

  buildAmbiguityModel({
    requestModel = {},
    semanticSlots = {},
    primaryFrame = {},
    secondaryFrames = [],
    continuity = {}
  } = {}) {
    const unresolvedSlots = semanticSlots.missingSlots || [];
    const conflictingExplicitRequests = Boolean(
  requestModel.compositeDecisionRequest?.present !== true &&
  requestModel.multiPurpose === true &&
  requestModel.secondaryOperations.length > 1
);
    const missingRequiredAnchor = Boolean(
      continuity.requiresPriorContext === true &&
      continuity.anchorResolved !== true
    );
    const complementaryComposite =
  requestModel.compositeDecisionRequest?.present === true;

const closeCompetition = Boolean(
  !complementaryComposite &&
  secondaryFrames[0] &&
  primaryFrame.frameType !== secondaryFrames[0].frameType &&
  Math.abs(
    Number(primaryFrame.confidence || 0) -
    Number(secondaryFrames[0].confidence || 0)
  ) <= 6
);

    const present = Boolean(
      unresolvedSlots.length ||
      conflictingExplicitRequests ||
      missingRequiredAnchor ||
      closeCompetition
    );

    const requiresClarification = Boolean(
      missingRequiredAnchor ||
      (
        unresolvedSlots.includes("object") &&
        !["respond", "provide_emotional_support"].includes(requestModel.operation)
      ) ||
      (
        unresolvedSlots.includes("options") &&
        this.isDecisionOperation(requestModel.operation)
      )
    );

    return {
      present,
      ambiguous: present,
      reason: missingRequiredAnchor
        ? "The current request depends on prior context, but the required referent was not resolved."
        : unresolvedSlots.length
          ? "One or more required semantic slots remain unresolved."
          : closeCompetition
            ? "Two semantic interpretations remain close in strength."
            : conflictingExplicitRequests
              ? "The message contains several competing explicit requests."
              : "No major ambiguity detected.",
      unresolvedSlots,
      competingFrames: closeCompetition
        ? [primaryFrame.frameType, secondaryFrames[0]?.frameType].filter(Boolean)
        : [],
      missingAnchor: missingRequiredAnchor,
      requiresClarification,
      confidence: present ? 0.72 : 0.88,
      evidence: [
        ...unresolvedSlots.map(slot => `missing_slot:${slot}`),
        closeCompetition ? "close_frame_scores" : null,
        missingRequiredAnchor ? "missing_context_anchor" : null
      ].filter(Boolean)
    };
  },

  buildFrameAgreement({ sources = {}, requestModel = {}, primaryFrame = {} } = {}) {
    const questionPurpose = this.normalizeKey(
      sources.questionUnderstanding?.primaryPurpose
    );
    const classifierFamily = this.normalizeKey(
      sources.classification?.interactionFamily
    );
    const classifierOperation = this.normalizeOperation(
      sources.classification?.explicitRequestedOperation
    );
    const frameOperation = this.normalizeOperation(primaryFrame.operation);
    const expectedQuestionOperation = this.operationFromPurpose(questionPurpose) || "";

    const questionAligned = Boolean(
      !questionPurpose ||
      this.operationsCompatible(frameOperation, expectedQuestionOperation) ||
      requestModel.primaryPurpose === questionPurpose
    );

    const authorizedOperationOverride = Boolean(
      requestModel.actionPolicy?.proposedOperationBlocked === true &&
      requestModel.sourceTrace?.resolutionChangedOperation === true
    );

    const classifierAligned = Boolean(
      authorizedOperationOverride ||
      !classifierOperation ||
      this.operationsCompatible(frameOperation, classifierOperation)
    );

    const familyAligned = Boolean(
      !classifierFamily ||
      this.normalizeKey(primaryFrame.interactionFamily) === classifierFamily
    );

    const values = [questionAligned, classifierAligned, familyAligned];
    const alignedCount = values.filter(Boolean).length;

    return {
      authorizedOperationOverride,
      questionUnderstandingAligned: questionAligned,
      classifierOperationAligned: classifierAligned,
      classifierFamilyAligned: familyAligned,
      alignedCount,
      totalChecks: values.length,
      score: alignedCount / values.length,
      level: alignedCount === values.length
        ? "high"
        : alignedCount >= 2
          ? "medium"
          : alignedCount === 1
            ? "low"
            : "none",
      disagreements: [
        !questionAligned ? "question_purpose_mismatch" : null,
        !classifierAligned ? "classifier_operation_mismatch" : null,
        !familyAligned ? "classifier_family_mismatch" : null
      ].filter(Boolean),
      authority: "semantic_internal_agreement_only"
    };
  },

  calculateMeaningConfidence({
    sources = {},
    requestModel = {},
    semanticSlots = {},
    primaryFrame = {},
    ambiguity = {},
    frameAgreement = {},
    continuity = {}
  } = {}) {
    const explicitEvidence = requestModel.explicitRequestPresent ? 1 : 0.45;
    const purposeConfidence = this.normalizeConfidence(requestModel.purposeConfidence);
    const classifierConfidence = this.normalizeConfidence(sources.classification?.confidence);
    const agreementScore = this.normalizeConfidence(frameAgreement.score);
    const slotCompleteness = this.normalizeConfidence(semanticSlots.slotCompleteness?.score);
    const evidenceSupport = primaryFrame.evidenceRefs?.length
      ? Math.min(1, primaryFrame.evidenceRefs.length / 4)
      : 0.35;
    const continuitySupport = continuity.requiresPriorContext
      ? continuity.anchorResolved
        ? 0.9
        : 0.2
      : 0.7;
    const ambiguityPenalty = ambiguity.present ? 0.12 : 0;
    const unresolvedPenalty = Math.min(
      0.2,
      (ambiguity.unresolvedSlots?.length || 0) * 0.05
    );

    const normalizedScore = this.normalizeConfidence(
      explicitEvidence * 0.24 +
      purposeConfidence * 0.14 +
      classifierConfidence * 0.12 +
      agreementScore * 0.17 +
      slotCompleteness * 0.15 +
      evidenceSupport * 0.08 +
      continuitySupport * 0.10 -
      ambiguityPenalty -
      unresolvedPenalty
    );

    return {
      normalized: normalizedScore,
      score: Math.round(normalizedScore * 100),
      label: this.confidenceLabel(normalizedScore),
      breakdown: {
        explicitEvidence,
        purposeConfidence,
        classifierConfidence,
        agreementScore,
        slotCompleteness,
        evidenceSupport,
        continuitySupport,
        ambiguityPenalty,
        unresolvedPenalty
      }
    };
  },

  /* =====================================================
     CANONICAL MEANING / RESPONSE REQUIREMENTS
  ===================================================== */

  buildCanonicalMeaning({
    sources = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {},
    primaryFrame = {},
    secondaryFrames = [],
    ambiguity = {},
    confidence = {}
  } = {}) {
    const artifactAction = this.buildArtifactAction({
      primaryFrame,
      requestModel,
      semanticSlots,
      sources
    });

    return {
      enabled: true,
      source: this.SOURCE,
      version: this.version,
      speechAct: requestModel.speechAct,
      interactionFamily: primaryFrame.interactionFamily || "general",
      intentFamily: primaryFrame.intentFamily || "general_response",
      userGoal: primaryFrame.userGoal || requestModel.operation || "respond",
      requestedOperation: primaryFrame.operation || requestModel.operation || "respond",
      requestedOutput: primaryFrame.requestedOutput || requestModel.requestedOutput || "response",
      participants: semanticSlots.participants,
      subject: semanticSlots.subject,
      target: semanticSlots.target,
      targetObject: semanticSlots.object,
      object: semanticSlots.object,
      artifactTarget: semanticSlots.artifactTarget,
      referent: semanticSlots.referent,
      options: semanticSlots.options || [],
      criteria: semanticSlots.criteria || [],
      timeframe: semanticSlots.timeframe || null,
      audience: semanticSlots.audience || null,
      location: semanticSlots.location || null,
      domain: {
        primary: contextModel.primaryDomain || primaryFrame.domain || "general_understanding",
        secondary: contextModel.secondaryDomains || []
      },
      targetDomain: contextModel.primaryDomain || primaryFrame.domain || "general_understanding",
      contextModifiers: contextModel.modifiers || [],
      constraints: contextModel.constraints || [],
      stakes: contextModel.stakes || [],
      continuity: {
        requiresPriorContext: continuity.requiresPriorContext,
        isContinuation: continuity.isContinuation,
        referencesPriorContext: continuity.referencesPriorContext,
        referenceType: continuity.referenceType,
        referenceSurface: continuity.referenceSurface,
        referenceResolved: continuity.referenceResolved,
        resolvedReferenceValue: continuity.resolvedReferenceValue,
        resolvedReferenceSourceTurnId:
  continuity.resolvedReferenceSourceTurnId || null,

referenceResolutionSource:
  continuity.referenceResolutionSource || null,
        anchor: continuity.anchor,
        anchorResolved: continuity.anchorResolved,
        missingAnchor: continuity.missingAnchor,
        priorContextAvailable: continuity.threadAvailable,
        referencesPriorArtifact: continuity.referencesPriorArtifact,
        referencesPriorQuestion: continuity.referencesPriorQuestion
      },
      ambiguity: {
        present: ambiguity.present,
        unresolvedSlots: ambiguity.unresolvedSlots || [],
        competingFrames: ambiguity.competingFrames || [],
        requiresClarification: ambiguity.requiresClarification === true
      },
      slotCompleteness: semanticSlots.slotCompleteness,
      artifactAction,
      actionPolicy: requestModel.actionPolicy,
      executionAllowed: requestModel.executionAllowed !== false,
      analysisOnly: requestModel.analysisOnly === true,
      prohibitedOperations: requestModel.prohibitedOperations || [],
      deferredOperations: requestModel.deferredOperations || [],
      multiDomain: {
        present: contextModel.domains.length > 1,
        primary: contextModel.primaryDomain,
        secondary: contextModel.secondaryDomains,
        hasMultipleRequests: requestModel.multiPurpose === true,
        secondaryRequests: secondaryFrames.map(frame => ({
          operation: frame.operation,
          target: frame.target,
          requestedOutput: frame.requestedOutput
        }))
      },
      responseMode: this.operationDefinition(primaryFrame.operation).responseMode,
      evidenceRefs: [
        ...new Set([
          ...(primaryFrame.evidenceRefs || []),
          ...(requestModel.evidenceRefs || []),
          ...(semanticSlots.target?.evidenceRefs || []),
          ...(semanticSlots.object?.evidenceRefs || [])
        ])
      ],
      origin: primaryFrame.origin || "inferred",
      confidence: confidence.normalized || 0,
      confidenceLabel: confidence.label || "unknown",
      confidenceBreakdown: confidence.breakdown || {},
      authority: "semantic_description_only"
    };
  },

  buildArtifactAction({ primaryFrame = {}, requestModel = {}, semanticSlots = {}, sources = {} } = {}) {
    const operation = this.normalizeOperation(primaryFrame.operation || requestModel.operation);
    const definition = this.operationDefinition(operation);
    const actionPolicy = requestModel.actionPolicy || {};
    const executionAllowed = actionPolicy.executionAllowed !== false;
    const analysisOnly = actionPolicy.analysisOnly === true;
    const artifactTopicPresent = Boolean(
      ["developer_task", "creation", "writing"].includes(primaryFrame.interactionFamily) ||
      ["project", "technology", "architecture"].includes(
        this.normalizeDomain(primaryFrame.domain)
      ) ||
      semanticSlots.artifactTarget ||
      semanticSlots.object?.filePath ||
      sources.githubFileContext?.filePath
    );
    const modificationOperation = definition.executionKind === "modification";
    const creationOperation = definition.executionKind === "creation";
    const investigationOperation = ["verify_or_review", "inspect_and_explain", "evaluate_and_recommend"].includes(operation);
    const executionRequested = Boolean(
      definition.executionKind &&
      executionAllowed &&
      !analysisOnly
    );
    const filePath =
      semanticSlots.artifactTarget?.value ||
      semanticSlots.object?.filePath ||
      sources.githubFileContext?.filePath ||
      null;
    const fileContextAvailable = Boolean(
      sources.githubFileContext &&
      String(sources.githubFileContext.content || "").trim()
    );
    const requiresExistingArtifact = executionRequested && modificationOperation;
    const requiresFileContent = requiresExistingArtifact ||
      (investigationOperation && Boolean(filePath));

    return {
      artifactTopicPresent,
      isArtifactRequest: executionRequested,
      executionRequested,
      executionAllowed,
      analysisOnly,
      isModification: executionRequested && modificationOperation,
      isCreation: executionRequested && creationOperation,
      isInvestigation: investigationOperation,
      isMetaQuestion: artifactTopicPresent && !executionRequested,
      requiresExistingArtifact,
      requiresFileContent,
      fileContextAvailable,
      missingRequiredFileContext: requiresFileContent && !fileContextAvailable,
      filePath,
      prohibitedOperations: actionPolicy.prohibitedOperations || [],
      deferredOperations: actionPolicy.deferredOperations || [],
      authority: "artifact_action_authorization_description"
    };
  },

  buildResponseRequirements({
    normalized = {},
    requestModel = {},
    primaryFrame = {},
    secondaryFrames = [],
    continuity = {},
    ambiguity = {}
  } = {}) {
    const definition = this.operationDefinition(primaryFrame.operation || requestModel.operation);
    const actionPolicy = requestModel.actionPolicy || {};
    const executionAllowed = actionPolicy.executionAllowed !== false;
    const analysisOnly = actionPolicy.analysisOnly === true;
    const directAnswerRequested = Boolean(
      requestModel.speechAct === "question" ||
      [
        "information",
        "explanation",
        "calculation",
        "translation",
        "verification",
        "opinion",
        "decision"
      ].includes(definition.requestType)
    );
    const explanationRequested = [
      "interpret_meaning",
      "explain_or_teach",
      "explain_without_execution",
      "inspect_and_explain",
      "evaluate_and_recommend"
    ].includes(requestModel.operation);
    const artifactOutputRequested = Boolean(
      executionAllowed &&
      !analysisOnly &&
      definition.executionKind
    );
    const multipleOperationsPresent = Boolean(
      requestModel.multiPurpose ||
      secondaryFrames.length
    );

    const must = ["preserve_explicit_user_action_authorization"];
    const should = [];
    const mustNot = [];

    if (directAnswerRequested) must.push("answer_the_requested_question");
    if (explanationRequested) must.push("provide_requested_explanation");
    if (actionPolicy.recommendationRequested) must.push("provide_clear_recommendation");
    if (actionPolicy.comparisonRequested) must.push("compare_the_presented_options");
    if (actionPolicy.analysisRequestPresent) {
      must.push("perform_analysis_without_converting_discussion_into_execution");
    }
    if (continuity.requiresPriorContext) should.push("use_available_prior_context");
    if (secondaryFrames.length) should.push("preserve_secondary_requests");
    if (ambiguity.requiresClarification) {
      must.push("resolve_required_missing_context_before_answering");
    }
    if (!executionAllowed) {
      mustNot.push(
        "execute_artifact_changes",
        "write_or_rewrite_code",
        "apply_patch",
        "treat_discussed_change_as_authorized_change"
      );
    }

    (actionPolicy.prohibitedOperations || []).forEach(operation => {
      mustNot.push(`perform_operation:${this.normalizeKey(operation)}`);
    });

    return {
      expectsDirectAnswer: directAnswerRequested,
      expectsExplanation: explanationRequested,
      expectsCollaboration: [
        "developer_task",
        "planning",
        "decision",
        "verification",
        "information"
      ].includes(primaryFrame.interactionFamily),
      expectsCodeOrArtifact: artifactOutputRequested,
      expectsReflection: ["emotional_support", "identity"].includes(
        primaryFrame.interactionFamily
      ),
      expectsFollowUpContext: continuity.requiresPriorContext,
      likelyWantsMinimalAnswer: normalized.isShortTurn && !multipleOperationsPresent,
      directAnswerRequested,
      explanationRequested,
      artifactOutputRequested,
      executionAllowed,
      analysisOnly,
      prohibitedOperations: actionPolicy.prohibitedOperations || [],
      deferredOperations: actionPolicy.deferredOperations || [],
      multipleOperationsPresent,
      preserveSecondaryRequests: multipleOperationsPresent,
      priorContextRequired: continuity.requiresPriorContext,
      clarificationRequired: ambiguity.requiresClarification === true,
      requestCount: 1 + requestModel.secondaryOperations.length,
      objective: actionPolicy.recommendationRequested
        ? "evaluate_the_options_and_provide_an_honest_recommendation"
        : explanationRequested
          ? "explain_the_requested_subject_without_unauthorized_execution"
          : "fulfill_the_authorized_user_request",
      must: this.uniqueNormalizedValues(must),
      should: this.uniqueNormalizedValues(should),
      mustNot: this.uniqueNormalizedValues(mustNot),
      semanticFactsOnly: true,
      confidence: this.normalizeConfidence(
        0.55 +
        (directAnswerRequested ? 0.1 : 0) +
        (explanationRequested ? 0.08 : 0) +
        (actionPolicy.recommendationRequested ? 0.08 : 0) +
        (multipleOperationsPresent ? 0.05 : 0) +
        (continuity.requiresPriorContext ? 0.04 : 0) +
        (actionPolicy.explicitExecutionProhibition ? 0.08 : 0)
      ),
      authority: "semantic_response_requirements_only"
    };
  },

  buildEmotionalOverlay({ sources = {}, contextModel = {}, evidenceIndex = {} } = {}) {
    const emotionalModifiers = (contextModel.modifiers || []).filter(item =>
      item.type.includes("emotion")
    );
    const evidence = this.mergeEvidenceGroups(
      evidenceIndex.byDomain?.emotion,
      evidenceIndex.byCategory?.emotion,
      evidenceIndex.byType?.emotion_word
    );
    const present = Boolean(emotionalModifiers.length || evidence.length);
    const explicitSupportRequested =
      sources.classification?.emotionalSupportExplicitlyRequested === true;

    return {
      present,
      tone: present ? "emotion_present" : "neutral",
      intensity: present ? this.resolveEmotionalIntensity(evidence) : "low",
      states: evidence.map(item => item.value).filter(Boolean),
      role: explicitSupportRequested
        ? "primary_request_relevant"
        : "context_modifier",
      explicitSupportRequested,
      shouldNotReplacePrimaryRequest: !explicitSupportRequested,
      semanticMeaningSeparated: true,
      evidence: evidence.map(item => item.id)
    };
  },


  /* =====================================================
     HANDOFF / SUMMARY / PAYLOAD
  ===================================================== */

  buildHandoff({
    canonicalMeaning = {},
    primaryFrame = {},
    secondaryFrames = [],
    contextModel = {},
    continuity = {},
    ambiguity = {},
    responseRequirements = {},
    frameAgreement = {},
    confidence = {}
  } = {}) {
    return {
      readyForConversationFunction: Boolean(
        primaryFrame.frameType &&
        canonicalMeaning.requestedOperation
      ),
      readyForReconciliation: Boolean(
        primaryFrame.frameType &&
        canonicalMeaning.interactionFamily &&
        canonicalMeaning.targetDomain
      ),
      primaryFrame,
      secondaryFrames,
      canonicalMeaning,
      contextModifiers: contextModel.modifiers || [],
      constraints: contextModel.constraints || [],
      stakes: contextModel.stakes || [],
      continuity,
      ambiguity,
      responseRequirements,
      actionPolicy: canonicalMeaning.actionPolicy || null,
      executionAllowed: canonicalMeaning.executionAllowed !== false,
      analysisOnly: canonicalMeaning.analysisOnly === true,
      prohibitedOperations: canonicalMeaning.prohibitedOperations || [],
      deferredOperations: canonicalMeaning.deferredOperations || [],
      frameAgreement,
      confidence,
      currentMeaning: primaryFrame.frameType,
      domain: canonicalMeaning.targetDomain,
      intent: canonicalMeaning.requestedOperation,
      requestedOperation: canonicalMeaning.requestedOperation,
      requestedOutput: canonicalMeaning.requestedOutput,
      target: canonicalMeaning.target,
      targetObject: canonicalMeaning.targetObject,
      requiresPriorContext: continuity.requiresPriorContext,
      inheritedSubject: continuity.inheritedSubject,
      priorContextAvailable: continuity.threadAvailable,
      previousAnswerSummary: continuity.previousAnswerSummary,
      ambiguityPresent: ambiguity.present,
      clarificationRequired: ambiguity.requiresClarification === true,
      authority: {
        canChooseConversationFunction: false,
        canChooseLane: false,
        canChooseRoute: false,
        canChoosePlanner: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,
        role: "semantic_meaning_handoff_only"
      }
    };
  },

  buildSemanticSummary({
    normalized = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {},
    primaryFrame = {},
    secondaryFrames = [],
    ambiguity = {},
    canonicalMeaning = {},
    responseRequirements = {},
    emotionalOverlay = {},
    framePriority = {},
    frameAgreement = {},
    confidence = {}
  } = {}) {
    return {
      primaryMeaning: primaryFrame.frameType,
      operation: primaryFrame.operation,
      requestedOutput: primaryFrame.requestedOutput,
      domain: contextModel.primaryDomain || primaryFrame.domain,
      secondaryDomains: contextModel.secondaryDomains || [],
      intent: primaryFrame.operation,
      interactionFamily: primaryFrame.interactionFamily,
      intentFamily: primaryFrame.intentFamily,
      conversationStyle: this.operationDefinition(primaryFrame.operation).conversationStyle,
      confidence: confidence.label || "low",
      confidenceScore: confidence.normalized || 0,
      secondaryMeanings: secondaryFrames.map(frame => frame.frameType),
      participants: semanticSlots.participants,
      subject: semanticSlots.subject,
      target: semanticSlots.target,
      targetObject: semanticSlots.object,
      artifactTarget: semanticSlots.artifactTarget,
      referent: semanticSlots.referent,
      options: semanticSlots.options,
      criteria: semanticSlots.criteria,
      constraints: contextModel.constraints,
      stakes: contextModel.stakes,
      contextModifiers: contextModel.modifiers,
      continuity,
      responseCharacteristics: responseRequirements,
      emotionalOverlay,
      ambiguity,
      framePriority,
      frameAgreement,
      canonicalMeaning,
      competingMeanings: secondaryFrames.map(frame => frame.frameType),
      languageNotes: {
        slangResolved: normalized.detectedSlang.length > 0,
        typosResolved: normalized.detectedTypos.length > 0,
        profanityAsSignal: normalized.hasProfanity,
        shortTurn: normalized.isShortTurn
      }
    };
  },

  buildPayload({
    originalText = "",
    normalized = {},
    sources = {},
    evidenceIndex = {},
    requestModel = {},
    semanticSlots = {},
    contextModel = {},
    continuity = {},
    primaryFrame = {},
    secondaryFrames = [],
    rankedFrames = [],
    framePriority = {},
    frameAgreement = {},
    responseRequirements = {},
    emotionalOverlay = {},
    ambiguity = {},
    canonicalMeaning = {},
    handoff = {},
    semanticSummary = {}
  } = {}) {
    return {
      semanticFrameBuilderRan: true,
      semanticFrameBuilderVersion: this.version,
      semanticFrameSource: this.SOURCE,
      advisoryOnly: true,
      routingAuthority: false,
      composerAuthority: false,
      finalAnswerAuthority: false,
      originalText,
      normalizedText: normalized.text,
      normalization: normalized,
      upstreamSources: {
        observerAvailable: sources.observations.length > 0,
        questionUnderstandingAvailable:
          sources.questionUnderstanding.questionUnderstandingRan === true,
        classifierAvailable:
          sources.classification.universalConversationClassifierRan === true,
        lifeSignalsAvailable:
          sources.lifeSignals.lifeSignalExtractorRan === true,
        routingEvidenceAvailable:
          sources.routingEvidence.routingEvidenceRan === true ||
          Boolean(sources.routingEvidence.routingPressures),
        safetyAvailable: sources.safety.safetyContextGateRan === true,
        referenceResolutionAvailable: Boolean(sources.referenceResolution)
      },
      evidenceIndex,
      requestModel,
      semanticSlots,
      contextModifiers: contextModel.modifiers,
      constraints: contextModel.constraints,
      stakes: contextModel.stakes,

      // Canonical fields.
      primaryFrame,
      secondaryFrames,
      rankedFrames,
      framePriority,
      frameAgreement,
      continuity,
      responseRequirements,
      emotionalOverlay,
      ambiguity,
      canonicalMeaning,
      handoff,
      semanticSummary,

      // Temporary compatibility aliases retained for old-pipeline consumers.
      currentTurnFrame: primaryFrame,
      currentTurnFrames: rankedFrames,
      normalizedFrame: primaryFrame,
      allFrames: rankedFrames,
      responseCharacteristics: responseRequirements,

      authority: {
        canRepresentMeaning: true,
        canBuildSemanticSlots: true,
        canIdentifyPrimaryRequest: true,
        canPreserveContextModifiers: true,
        canReportAmbiguity: true,
        canChooseConversationFunction: false,
        canChooseFinalRoute: false,
        canChooseMode: false,
        canChooseCapabilities: false,
        canChoosePlanner: false,
        canDetermineFinalSafetySeverity: false,
        canAnswerUser: false,
        role: "structured_semantic_meaning_handoff_only"
      }
    };
  },

  /* =====================================================
     EXTRACTION HELPERS
  ===================================================== */

  extractDeveloperTarget(text = "") {
    const fileMatch = text.match(
      /\b[\w/-]+\.(?:js|html|css|json|md|sql|ts|tsx|jsx)\b/i
    );

    if (fileMatch) {
      return {
        type: "file",
        value: fileMatch[0],
        confidence: 0.95
      };
    }

    const systemTargets = [
      ["semantic_frame_builder", /\bsemantic frame builder\b/],
      ["conversation_function", /\bconversation function\b/],
      ["perception_reconciliation_engine", /\bperception reconciliation(?: engine)?\b/],
      ["universal_conversation_classifier", /\buniversal conversation classifier\b/],
      ["observer_network", /\bobserver network\b/],
      ["observation_ledger", /\bobservation ledger\b/],
      ["perception_pipeline", /\bperception pipeline\b/],
      ["executive_routing", /\bexecutive routing\b/],
      ["blueprint_writer", /\bblueprint writer\b/],
      ["ai_writer", /\bai writer\b/],
      ["language_composer", /\blanguage composer\b/],
      ["medical_os", /\bmedical os\b/]
    ];

    for (const [value, pattern] of systemTargets) {
      if (pattern.test(text)) {
        return {
          type: "system_component",
          value,
          confidence: 0.9
        };
      }
    }

    return null;
  },

  extractFactualObject(text = "", requestModel = {}) {
    const capitalMatch = text.match(
      /\b(?:what is|what's|whats)\s+the\s+capital\s+of\s+(.+?)(?:\?|$)/i
    );

    if (capitalMatch) {
      const entity = this.clean(capitalMatch[1]);
      return {
        type: "location_fact",
        name: `capital of ${entity}`,
        entity,
        attribute: "capital",
        confidence: 0.96
      };
    }

    const definitionMatch = text.match(
      /\b(?:what is|what's|whats|define)\s+(.+?)(?:\?|$)/i
    );

    if (
      definitionMatch &&
      requestModel.operation === "provide_information"
    ) {
      return {
        type: "concept",
        name: this.clean(definitionMatch[1]),
        entity: null,
        attribute: "definition",
        confidence: 0.84
      };
    }

    return null;
  },

  extractDecisionObject(text = "", requestModel = {}) {
    if (!this.isDecisionOperation(requestModel.operation)) return null;

    const focusMatch = text.match(
      /\bwhat should (?:i|we) focus on(?: first)?\??\s*$/i
    );

    if (focusMatch) {
      const prefix = text.replace(focusMatch[0], "").trim();
      return {
        type: "priority_decision",
        name: prefix || "current priorities",
        entity: null,
        attribute: null,
        filePath: null,
        origin: prefix ? "explicit" : "inferred",
        confidence: prefix ? 0.84 : 0.55,
        evidenceRefs: []
      };
    }

    if (/\bwhich should (?:i|we) choose\b/.test(text)) {
      return {
        type: "option_choice",
        name: "stated options",
        entity: null,
        attribute: null,
        filePath: null,
        origin: "explicit",
        confidence: 0.8,
        evidenceRefs: []
      };
    }

    return null;
  },

  extractWritingObject(text = "", requestModel = {}) {
    if (requestModel.operation !== "produce_or_revise_text") return null;

    const types = [
      "email",
      "text message",
      "caption",
      "invitation",
      "essay",
      "paragraph",
      "response",
      "reply"
    ];
    const found = types.find(type => text.includes(type));

    return {
      type: "written_artifact",
      name: found || "written_text",
      entity: null,
      attribute: null,
      filePath: null,
      origin: found ? "explicit" : "inferred",
      confidence: found ? 0.9 : 0.6,
      evidenceRefs: []
    };
  },

  extractFallbackObject(text = "", operation = "") {
    const removable = [
      "what", "why", "how", "when", "where", "who", "which",
      "is", "are", "do", "does", "did", "can", "could", "should",
      "would", "will", "i", "me", "my", "you", "your", "we", "our",
      "please", "tell", "explain", "recommend", "suggest", "choose",
      "decide", "create", "write", "make", "fix", "update", "review",
      "mean", "meaning"
    ];

    let cleaned = ` ${text} `;
    removable.forEach(word => {
      cleaned = cleaned.replace(
        new RegExp(`\\b${this.escapeRegExp(word)}\\b`, "gi"),
        " "
      );
    });

    cleaned = cleaned
      .replace(/\s+/g, " ")
      .replace(/[?!.]+$/g, "")
      .trim();

    const tokens = cleaned.split(/\s+/).filter(token => token.length >= 3);
    if (!tokens.length) return null;

    if (tokens.length === 1 && operation === "respond") return null;
    return tokens.slice(0, 12).join(" ");
  },

  extractOptions({
  text = "",
  evidenceIndex = {},
  requestModel = {}
} = {}) {
  const options = [];

  const optionEvidence =
    (evidenceIndex.items || [])
      .filter(item =>
        item.raw?.slotCandidate ===
          "options" ||
        item.type ===
          "option_signal"
      );

  optionEvidence.forEach(item => {
    const value =
      item.raw?.option ||
      item.raw?.value ||
      item.value;

    if (!value) {
      return;
    }

    options.push({
      value,
      origin:
        "explicit",

      confidence:
        item.confidence,

      evidenceRefs: [
        item.id
      ]
    });
  });

  if (
    this.isDecisionOperation(
      requestModel.operation
    )
  ) {
    const compareAndMatch =
      text.match(
        /\bcompare\s+(.+?)\s+and\s+(.+?)(?=,\s*(?:recommend|choose|decide|tell|explain|evaluate)|[?.]|$)/i
      );

    if (compareAndMatch) {
      [
        compareAndMatch[1],
        compareAndMatch[2]
      ].forEach(value => {
        const clean =
          this.clean(value);

        if (!clean) {
          return;
        }

        options.push({
          value:
            clean,

          origin:
            "explicit",

          confidence:
            0.94,

          evidenceRefs:
            []
        });
      });
    }

    const versusMatch =
      text.match(
        /(.+?)\s+(?:versus|vs\.?|or)\s+(.+?)(?=,\s*(?:recommend|choose|decide|tell|explain|evaluate)|[?.]|$)/i
      );

    if (versusMatch) {
      [
        versusMatch[1],
        versusMatch[2]
      ].forEach(value => {
        const clean =
          this.clean(value);

        if (!clean) {
          return;
        }

        options.push({
          value:
            clean,

          origin:
            "explicit",

          confidence:
            0.82,

          evidenceRefs:
            []
        });
      });
    }
  }

  return this.dedupeSemanticValues(
    options
  );
},

  extractCriteria({ text = "", evidenceIndex = {} } = {}) {
    const criteria = [];
    const evidence = (evidenceIndex.items || []).filter(item =>
      item.raw?.slotCandidate === "criteria" ||
      item.type === "criteria_signal"
    );

    evidence.forEach(item => {
      criteria.push({
        value: item.raw?.criterion || item.raw?.value || item.value,
        origin: "explicit",
        confidence: item.confidence,
        evidenceRefs: [item.id]
      });
    });

    const knownCriteria = [
      ["safety", /\bsafe|safest|safety\b/],
      ["cost", /\bcheap|cheaper|cost|afford|budget\b/],
      ["speed", /\bfast|faster|quick|quickest\b/],
      ["ease", /\beasy|easier|simple|simpler\b/],
      ["quality", /\bquality|better|best|reliable\b/],
      ["priority", /\bimportant|priority|focus first\b/],
      ["dependency_order", /\bcomes first|before|after|dependency\b/],
      ["efficiency", /\befficient|efficiency|performance\b/]
    ];

    knownCriteria.forEach(([value, pattern]) => {
      if (pattern.test(text)) {
        criteria.push({
          value,
          origin: "explicit",
          confidence: 0.74,
          evidenceRefs: []
        });
      }
    });

    return this.dedupeSemanticValues(criteria);
  },

  extractTimeframe({ text = "", evidenceIndex = {} } = {}) {
    const timeEvidence = (evidenceIndex.items || []).find(item =>
      ["past_time", "current_time", "future_time", "time_reference"].includes(item.type)
    );
    const phrase = this.extractTimePhrase(text);

    if (!timeEvidence && !phrase) return null;

    return {
      value: phrase || timeEvidence?.value,
      origin: phrase ? "explicit" : "observed",
      confidence: phrase ? 0.85 : timeEvidence.confidence,
      evidenceRefs: timeEvidence ? [timeEvidence.id] : []
    };
  },

  extractAudience({ text = "", evidenceIndex = {} } = {}) {
    const audienceEvidence = (evidenceIndex.items || []).find(item =>
      item.raw?.slotCandidate === "audience"
    );

    if (audienceEvidence) {
      return {
        value: audienceEvidence.raw?.evidence || audienceEvidence.value,
        origin: "explicit",
        confidence: audienceEvidence.confidence,
        evidenceRefs: [audienceEvidence.id]
      };
    }

    const match = text.match(
      /\bfor\s+(my wife|my husband|my spouse|my boss|my coworker|my family|my team|me|us)\b/i
    );

    return match
      ? {
          value: match[1],
          origin: "explicit",
          confidence: 0.84,
          evidenceRefs: []
        }
      : null;
  },

  extractLocation({ evidenceIndex = {} } = {}) {
    const locationEvidence = (evidenceIndex.items || []).find(item =>
      item.type === "location_reference"
    );

    return locationEvidence
      ? {
          value: locationEvidence.value,
          origin: "observed",
          confidence: locationEvidence.confidence,
          evidenceRefs: [locationEvidence.id]
        }
      : null;
  },

  extractMentionedParticipants(text = "") {
    const matches = text.match(
      /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my child|my baby|my son|my daughter)\b/g
    );

    return [...new Set(matches || [])].map(value => ({
      type: "mentioned_participant",
      value,
      origin: "explicit",
      confidence: 0.9,
      evidenceRefs: []
    }));
  },

  /* =====================================================
     DOMAIN / OPERATION HELPERS
  ===================================================== */

  resolveSemanticDomains({ sources = {}, evidenceIndex = {}, requestModel = {}, modifiers = [], stakes = [] } = {}) {
    const scores = new Map();
    const add = (domain, score) => {
      const normalized = this.normalizeDomain(domain);
      if (!normalized) return;
      scores.set(normalized, Number(scores.get(normalized) || 0) + Number(score || 0));
    };

    this.asArray(sources.classification?.domains).forEach((domain, index) => {
      add(domain, index === 0 ? 50 : 30);
    });

    if (sources.classification?.primaryDomain) {
      add(sources.classification.primaryDomain, 55);
    }

    (evidenceIndex.domainEvidence || []).forEach(item => {
      add(item.domain, 20 + item.confidence * 20);
    });

    modifiers.forEach(item => {
      if (item.type.includes("medical")) add("medical", 25);
      if (item.type.includes("emotion")) add("emotion", 18);
      if (item.type.includes("life")) add("life_context", 15);
    });

    stakes.forEach(item => {
      if (item.type.includes("family")) add("family", 25);
      if (item.type.includes("relationship")) add("relationship", 22);
      if (item.type.includes("project")) add("project", 22);
    });

    add(this.operationDefinition(requestModel.operation).domain, 18);

    const ranked = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);

    return ranked.length ? ranked : ["general_understanding"];
  },

operationFromPurpose(
  purpose = "",
  requestType = ""
) {
  const purposeKey =
    this.normalizeKey(purpose);

  const requestTypeKey =
    this.normalizeKey(requestType);

  const map = {
    decision:
      "decide_or_prioritize",

    recommendation:
      "evaluate_and_recommend",

    comparison:
      "compare_options",

    planning:
      "create_plan",

    writing:
      "produce_or_revise_text",

    translation:
      "translate",

    calculation:
      "calculate_or_convert",

    verification:
      "verify_or_review",

    memory:
      "save_or_forget_memory",

    recall:
      "retrieve_prior_context",

    identity:
      "answer_identity_question",

    opinion:
      "provide_opinion",

    creation:
      "create_artifact",

    emotional:
      "provide_emotional_support",

    emotional_support:
      "provide_emotional_support",

    teaching:
      "explain_or_teach",

    explanation:
      "explain_or_teach",

    meaning:
      "interpret_meaning",

    factual:
      "provide_information",

    information:
      "provide_information",

    understanding:
      "provide_information",

    implementation:
      "implement_or_modify"
  };

  return (
    map[purposeKey] ||
    map[requestTypeKey] ||
    null
  );
},

  operationDefinition(operation = "respond") {
    const normalized = this.normalizeOperation(operation);
    return this.OPERATION_REGISTRY[normalized] || this.OPERATION_REGISTRY.respond;
  },

  normalizeOperation(value = "") {
    const key = this.normalizeKey(value);
    return this.OPERATION_ALIASES[key] ||
      (this.OPERATION_REGISTRY[key] ? key : key || "respond");
  },

  normalizeOperationList(value = []) {
    return this.normalizeList(value)
      .map(item => this.normalizeOperation(item))
      .filter(Boolean);
  },

  isExecutionOperation(operation = "") {
    return Boolean(this.operationDefinition(operation).executionKind);
  },

  isDecisionOperation(operation = "") {
    return ["decision"].includes(this.operationDefinition(operation).requestType);
  },

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
      "interpret_meaning",
      "explain_or_teach",
      "explain_without_execution"
    ],

    [
      "compare_options",
      "decide_or_prioritize",
      "evaluate_and_recommend"
    ],

    [
      "verify_or_review",
      "inspect_and_explain"
    ],

    [
      "create_artifact",
      "produce_or_revise_text"
    ],

    [
      "implement_or_modify"
    ]
  ];

  return groups.some(group =>
    group.includes(a) &&
    group.includes(b)
  );
},
  operationMatchesAny(operation = "", prohibitedOperations = []) {
    const normalized = this.normalizeOperation(operation);
    return this.asArray(prohibitedOperations)
      .map(item => this.normalizeOperation(item))
      .some(item => item === normalized);
  },

  resolveSpeechAct(normalized = {}, operation = "respond") {
    if (
      normalized.hasQuestionMark ||
      /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(normalized.text)
    ) {
      return "question";
    }

    if (/^(remove|delete|hide|change|update|replace|rename|move|add|insert|fix|implement|wire|connect|disable|enable|patch|upgrade|write|create|make|send)\b/.test(normalized.text)) {
      return "instruction";
    }

    return operation && operation !== "respond"
      ? "request"
      : "statement";
  },

  /* =====================================================
     NORMALIZATION / GENERAL HELPERS
  ===================================================== */

  normalizeUserText(text = "") {
    const original = this.clean(text);
    let normalized = original.toLowerCase();
    const replacements = {
      wtf: "what the fuck",
      idk: "i do not know",
      rn: "right now",
      u: "you",
      ur: "your",
      pls: "please",
      plz: "please",
      gonna: "going to",
      wanna: "want to",
      kinda: "kind of",
      bc: "because",
      cuz: "because"
    };
    const detectedSlang = [];

    Object.keys(replacements)
      .sort((a, b) => b.length - a.length)
      .forEach(key => {
        const pattern = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, "gi");
        if (pattern.test(normalized)) {
          detectedSlang.push({ from: key, to: replacements[key] });
          normalized = normalized.replace(pattern, replacements[key]);
        }
      });

    normalized = normalized
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;

    return {
      original,
      text: normalized,
      wordCount,
      detectedSlang,
      detectedTypos: [],
      hasQuestionMark: original.includes("?"),
      hasExclamation: original.includes("!"),
      hasProfanity: /\b(fuck|fucking|fucken|shit|wtf|damn|bullshit)\b/i.test(original),
      isShortTurn: wordCount <= 5,
      isVeryShortTurn: wordCount <= 2
    };
  },

  normalizeHumanText(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeKey(value = "") {
    return this.normalizeHumanText(value)
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeDomain(value = "") {
    const domain = this.normalizeKey(value);
    const map = {
      body: "medical",
      health: "medical",
      medical_body: "medical",
      medical_context: "medical",
      builder: "project",
      builder_or_system: "project",
      coding: "project",
      developer: "project",
      ari_architecture: "project",
      financial: "finance",
      money: "finance",
      relationships: "relationship",
      parenthood: "family",
      emotional: "emotion",
      resource_pressure: "capacity",
      money_time_energy: "capacity",
      choice_or_priority: "decision",
      general: "general_understanding"
    };
    return map[domain] || domain;
  },

  normalizeConfidence(value = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    if (number > 1) return Math.max(0, Math.min(1, number / 100));
    return Math.max(0, Math.min(1, number));
  },

  confidenceLabel(value = 0) {
    const confidence = this.normalizeConfidence(value);
    if (confidence >= 0.88) return "high";
    if (confidence >= 0.68) return "medium";
    if (confidence >= 0.45) return "low";
    return "very_low";
  },

  slotPresent(value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") {
      const hasValue = value.value !== null &&
        value.value !== undefined &&
        String(value.value).trim() !== "";
      const hasName = value.name !== null &&
        value.name !== undefined &&
        String(value.name).trim() !== "";
      const hasKnownType = typeof value.type === "string" &&
        value.type !== "" &&
        !["unknown", "unspecified"].includes(value.type);
      return hasValue || hasName || hasKnownType;
    }
    return String(value).trim() !== "";
  },

  addUniqueSemanticItem(collection = [], item = null) {
    if (!item?.type) return;
    const exists = collection.some(existing =>
      existing.type === item.type &&
      existing.value === item.value
    );
    if (!exists) collection.push(item);
  },

  mergeEvidenceGroups(...groups) {
    const items = groups.flatMap(group => this.asArray(group));
    const seen = new Set();
    return items.filter(item => {
      const key = item?.id || `${item?.type}|${item?.value}|${item?.source}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  dedupeSemanticValues(values = []) {
    const seen = new Set();
    return values.filter(item => {
      const value = this.normalizeHumanText(item?.value);
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  uniqueNormalizedValues(values = []) {
    const seen = new Set();
    const result = [];
    values.forEach(value => {
      const normalized = this.normalizeKey(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      result.push(normalized);
    });
    return result;
  },

  normalizeList(value = []) {
    return this.asArray(value)
      .map(item => {
        if (typeof item === "string") return this.normalizeKey(item);
        return this.normalizeKey(
          item?.operation ||
          item?.value ||
          item?.name ||
          item?.type ||
          ""
        );
      })
      .filter(Boolean);
  },

  averageConfidence(items = [], fallback = 0.5) {
    if (!Array.isArray(items) || !items.length) return fallback;
    const total = items.reduce(
      (sum, item) => sum + this.normalizeConfidence(item.confidence),
      0
    );
    return this.normalizeConfidence(total / items.length);
  },

  extractQuotedText(text = "") {
    const match = String(text).match(/["“](.+?)["”]/);
    return match?.[1] ? this.clean(match[1]) : null;
  },

extractAllQuotedText(
  text = ""
) {
  const normalized =
    String(
      text ||
      ""
    );

  const results = [];

  const pattern =
    /["“]([^"”]+)["”]/g;

  let match;

  while (
    (
      match =
        pattern.exec(
          normalized
        )
    ) !== null
  ) {
    const value =
      this.clean(
        match[1]
      );

    if (value) {
      results.push(
        value
      );
    }
  }

  return results;
},

readMessageText(
  message = null
) {
  if (!message) {
    return "";
  }

  if (
    typeof message ===
      "string"
  ) {
    return this.clean(
      message
    );
  }

  return this.clean(
    message.text ||
    message.content ||
    message.message ||
    message.body ||
    message.response ||
    message.answer ||
    ""
  );
},

  extractTimePhrase(text = "") {
    const match = String(text).match(
      /\b(today|tonight|tomorrow|this week|next week|this month|next month|before [^,.!?]+|after [^,.!?]+|in \d+ (?:minutes?|hours?|days?|weeks?|months?|years?))\b/i
    );
    return match?.[0] ? this.clean(match[0]) : null;
  },

  resolveEmotionalIntensity(evidence = []) {
    const maximum = evidence.length
      ? Math.max(...evidence.map(item => Number(item.confidence || 0)))
      : 0;
    if (maximum >= 0.85) return "high";
    if (maximum >= 0.6) return "medium";
    return "low";
  },

  groupBy(items = [], field = "type") {
    return items.reduce((groups, item) => {
      const key = item?.[field] || "unknown";
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  makeFrameId(frameType = "frame", target = "unknown", index = 0) {
    const cleanType = this.normalizeKey(frameType) || "frame";
    const cleanTarget = this.normalizeKey(target).slice(0, 48) || "unknown";
    return `${cleanType}_${cleanTarget}_${Number(index || 0)}`;
  },

  stringifyTopic(topic) {
    if (!topic) return null;
    if (typeof topic === "string") return topic;
    return topic.surface ||
      topic.label ||
      topic.value ||
      topic.claim ||
      topic.evidence ||
      topic.text ||
      null;
  },

  asArray(value = []) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
  },

  clean(value = "") {
    return String(value || "").trim();
  },

  escapeRegExp(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
};

window.Ari.semanticFrameBuilder = window.AriSemanticFrameBuilder;

console.log(
  "ARI SEMANTIC FRAME BUILDER LOADED:",
  window.AriSemanticFrameBuilder?.version
);
