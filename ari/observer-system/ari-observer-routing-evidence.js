// ari/observer-system/ari-observer-routing-evidence.js
// Ari Observer Routing Evidence
// Purpose: Translate canonical Observer evidence into non-authoritative routing pressures.
// V2.0.0 — Reference-Grounded Pressure Translation / No Raw Reference Guessing / No Routing Authority

window.Ari = window.Ari || {};

window.Ari.observerRoutingEvidence = {
  version: "2.0.0",

  /* =====================================================
     MAIN ENTRY
  ===================================================== */

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const observer = input.observer || summary.observer || summary.observerEvidence || {};

    const rawText =
      observer.rawUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = observer.normalizedObservedText || this.normalize(rawText);

    const observations = Array.isArray(observer.observations)
      ? observer.observations
      : Array.isArray(observer.observationLedger)
        ? observer.observationLedger
        : Array.isArray(summary.canonicalObservationLedger)
          ? summary.canonicalObservationLedger
          : Array.isArray(summary.observationLedger)
            ? summary.observationLedger
            : [];

    const recentMessages = Array.isArray(summary.recentMessages)
      ? summary.recentMessages
      : Array.isArray(summary.threadState?.lastMessages)
        ? summary.threadState.lastMessages
        : [];

    const thread = summary.threadUnderstanding || summary.threadState || summary.threadContext || {};
    const memory = summary.memoryContext || summary.memory || {};
    const relationship = summary.relationshipContext || {};

    const messageShape = this.measureMessageShape(text);
    const observerShape = this.measureObserverShape(observations);
    const semanticClues = this.measureSemanticClues(observations, text);
    const contextShape = this.measureContextShape(text, recentMessages, thread, semanticClues);
    const followUpShape = this.measureFollowUpShape(text, recentMessages, summary, semanticClues, contextShape);
    const memoryShape = this.measureMemoryShape(summary, memory, observerShape);
    const revisionShape = this.measureRevisionShape(summary, observerShape);
    const relationshipShape = this.measureRelationshipShape(summary, relationship, observerShape);

    const pressures = {
      standaloneCompleteness: this.scoreStandaloneCompleteness(
        messageShape,
        contextShape,
        observerShape,
        semanticClues
      ),

      contextDependency: this.scoreContextDependency(
        messageShape,
        contextShape,
        semanticClues,
        followUpShape
      ),

      followUpPressure: this.scoreFollowUpPressure(
        followUpShape,
        contextShape,
        semanticClues
      ),

      recallPressure: this.scoreRecallPressure(
        memoryShape,
        semanticClues,
        observerShape
      ),

      revisionPressure: this.scoreRevisionPressure(
        revisionShape,
        contextShape,
        observerShape,
        semanticClues
      ),

      relationshipContinuity: this.scoreRelationshipContinuity(
        relationshipShape,
        contextShape,
        observerShape,
        semanticClues
      ),

      ambiguityWithoutContext: this.scoreAmbiguityWithoutContext(
        messageShape,
        contextShape,
        semanticClues,
        followUpShape
      ),

      activeThreadMatch: contextShape.activeThreadMatch,

      directAnswerPressure: this.scoreDirectAnswerPressure(
        messageShape,
        observerShape,
        semanticClues
      )
    };

    const routingGuards = {
      hasOperationSignal: semanticClues.hasOperationSignal,
      hasObjectSignal: semanticClues.hasObjectSignal,
      hasReferenceSignal: semanticClues.hasReferenceSignal,
      hasLocallyGroundedReference: semanticClues.hasLocallyGroundedReference,
      hasUnresolvedReference: semanticClues.hasUnresolvedReference,
      hasBlockingReference: semanticClues.hasBlockingReference,
      hasPriorContextReference: semanticClues.hasPriorContextReference,
      hasMissingAnchorSignal: semanticClues.hasMissingAnchorSignal,
      likelyNeedsPriorContext: semanticClues.likelyNeedsPriorContext,
      likelyStandalone: semanticClues.likelyStandalone,

      shouldNotForceFollowUp:
        semanticClues.likelyStandalone &&
        !semanticClues.hasBlockingReference &&
        !semanticClues.hasExplicitPriorContextRequirement,

      shouldNotTreatReferenceAsUnresolved:
        semanticClues.hasLocallyGroundedReference &&
        !semanticClues.hasUnresolvedReference &&
        !semanticClues.hasBlockingReference,

      priorContextPressureAuthorized:
        semanticClues.hasExplicitPriorContextRequirement ||
        semanticClues.hasBlockingReference ||
        semanticClues.hasMissingAnchorSignal,

      rawReferenceWordsAreNonAuthoritative: true
    };

    return {
      routingEvidenceRan: true,
      routingEvidenceVersion: this.version,

      engine: "ari-observer-routing-evidence",
      version: this.version,
      source: "ari-observer-routing-evidence",

      ...pressures,
      routingPressures: pressures,

      semanticClues,
      routingGuards,

      supportingEvidence: {
        messageShape,
        observerShape,
        semanticClues,
        contextShape,
        followUpShape,
        memoryShape,
        revisionShape,
        relationshipShape
      },

      preservedObserverEvidence: observations,
      preservedObservationCount: observations.length,

      authority: {
        canTranslateEvidenceToPressure: true,
        canDescribeContinuityPressure: true,
        canDescribeAmbiguityPressure: true,

        canDeclareReferenceUnresolved: false,
        canResolveReferences: false,
        canChooseLane: false,
        canChooseRoute: false,
        canChooseIntent: false,
        canBuildSemanticFrame: false,
        canOverrideObserverEvidence: false,
        canOverrideSafety: false,
        canAnswerUser: false,

        role: "canonical_evidence_to_non_authoritative_routing_pressure_translation"
      }
    };
  },

  /* =====================================================
     MESSAGE SHAPE
  ===================================================== */

  measureMessageShape(text = "") {
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const length = normalized.length;

    const concreteUnits = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");

      if (!cleaned) return false;
      if (/\d/.test(cleaned)) return true;
      if (cleaned.length >= 5 && !this.nonConcreteWords.has(cleaned)) return true;

      return false;
    }).length;

    const contentDensity = wordCount
      ? this.clamp01(concreteUnits / wordCount)
      : 0;

    return {
      length,
      wordCount,

      hasQuestionForm:
        normalized.endsWith("?") ||
        /^(what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will)\b/.test(normalized),

      hasEnoughContent:
        wordCount >= 7 &&
        length >= 30,

      hasSubstantialContent:
        wordCount >= 12 ||
        length >= 70,

      contentDensity,

      brevityPressure:
        wordCount <= 4
          ? 1
          : wordCount <= 8
            ? 0.75
            : wordCount <= 14
              ? 0.4
              : 0,

      fragmentPressure:
        this.measureFragmentPressure(normalized, words),

      lexicalReferenceLoad:
        this.measureReferenceLoad(normalized),

      lexicalContinuationLoad:
        this.measureLexicalContinuationLoad(normalized)
    };
  },

  measureFragmentPressure(text = "", words = []) {
    if (!text) return 1;

    if (/^(why|how|what|really|then what|and then)\??$/.test(text)) {
      return 1;
    }

    if (words.length <= 3 && !/[.!?]$/.test(text)) {
      return 0.75;
    }

    if (words.length <= 6 && /^(and|but|so|then|because|what about|what if)\b/.test(text)) {
      return 0.65;
    }

    return 0;
  },

  /* =====================================================
     OBSERVER SHAPE
  ===================================================== */

  measureObserverShape(observations = []) {
    const hasType = type => observations.some(observation => this.normalizeToken(observation?.type) === type);
    const hasValue = value => observations.some(observation => this.normalizeToken(observation?.value) === value);
    const hasDomain = domain => observations.some(observation => this.normalizeToken(observation?.domain) === domain);

    const questionObservations = observations.filter(observation =>
      [
        "question_mark_count",
        "question_phrase",
        "question_shape",
        "question_form"
      ].includes(this.normalizeToken(observation?.type))
    );

    const outputObservations = observations.filter(observation =>
      [
        "answer_expectation",
        "response_preference",
        "requested_output"
      ].includes(this.normalizeToken(observation?.type)) ||
      Boolean(observation?.requestedOutput)
    );

    return {
      hasQuestion:
        questionObservations.length > 0,

      questionConfidence:
        this.maxConfidence(questionObservations),

      hasDirectAnswerExpectation:
        hasValue("direct_answer") ||
        outputObservations.some(observation =>
          this.normalizeToken(observation?.requestedOutput) === "direct_answer"
        ),

      hasStepByStepExpectation:
        hasValue("step_by_step") ||
        outputObservations.some(observation =>
          this.normalizeToken(observation?.requestedOutput) === "step_by_step"
        ),

      hasCodeOutputExpectation:
        hasValue("code_output") ||
        outputObservations.some(observation =>
          ["code", "artifact_or_code", "implementation_or_code"].includes(
            this.normalizeToken(observation?.requestedOutput)
          )
        ),

      hasMemorySignal:
        hasType("memory_request_phrase") ||
        hasValue("recall"),

      hasRevisionSignal:
        observations.some(observation =>
          this.normalizeToken(observation?.type) === "speech_act" &&
          ["feedback", "correction"].includes(this.normalizeToken(observation?.value))
        ) ||
        hasValue("correction"),

      hasRelationshipSignal:
        hasType("relationship_reference") ||
        hasType("family_reference") ||
        hasDomain("relationship") ||
        hasDomain("family"),

      hasMedicalSignal:
        hasType("body_context") ||
        hasType("body_symptom") ||
        hasDomain("body") ||
        hasDomain("medical"),

      hasOwnershipSelf:
        hasValue("self"),

      hasOwnershipCloseOther:
        hasValue("close_other"),

      hasBuilderSignal:
        hasDomain("builder") ||
        hasDomain("project"),

      observationCount:
        observations.length
    };
  },

  /* =====================================================
     SEMANTIC CLUES
  ===================================================== */

  measureSemanticClues(observations = [], text = "") {
    const byType = type =>
      observations.filter(observation =>
        this.normalizeToken(observation?.type) === type
      );

    const operationSignals = byType("operation_signal");
    const referenceSignals = byType("reference_signal");
    const slotSignals = byType("slot_signal");
    const questionShapes = byType("question_shape");
    const missingAnchors = byType("missing_anchor_signal");
    const messyLanguageSignals = byType("messy_language_signal");

    const operationConfidence = this.maxConfidence(operationSignals);
    const referenceConfidence = this.maxConfidence(referenceSignals);
    const slotConfidence = this.maxConfidence(slotSignals);
    const missingAnchorConfidence = this.maxConfidence(missingAnchors);

    const objectSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "object"
    );

    const goalSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "goal"
    );

    const problemSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "problem"
    );

    const optionSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "options"
    );

    const criteriaSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "criteria"
    );

    const audienceSlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "audience"
    );

    const quantitySlots = slotSignals.filter(signal =>
      this.readMeta(signal, "slotCandidate") === "quantity"
    );

    const referenceAnalysis = this.analyzeReferenceSignals(referenceSignals);
    const missingAnchorAnalysis = this.analyzeMissingAnchors(missingAnchors);
    const questionShapeAnalysis = this.analyzeQuestionShapes(questionShapes);

    const hasOperationSignal = operationSignals.length > 0;
    const hasReferenceSignal = referenceSignals.length > 0;
    const hasSlotSignal = slotSignals.length > 0;
    const hasObjectSignal = objectSlots.length > 0;
    const hasMissingAnchorSignal = missingAnchorAnalysis.blockingCount > 0;

    const hasExplicitPriorContextRequirement =
      referenceAnalysis.priorContextRequiredCount > 0 ||
      missingAnchorAnalysis.priorContextRequiredCount > 0 ||
      questionShapeAnalysis.explicitContextDependentCount > 0;

    const hasBlockingReference =
      referenceAnalysis.blockingCount > 0;

    const hasUnresolvedReference =
      referenceAnalysis.unresolvedCount > 0;

    const hasLocallyGroundedReference =
      referenceAnalysis.locallyGroundedCount > 0;

    const hasPriorContextReference =
      referenceAnalysis.priorContextRequiredCount > 0;

    const standaloneSemanticSupport =
      objectSlots.length +
      goalSlots.length +
      problemSlots.length +
      optionSlots.length +
      criteriaSlots.length +
      audienceSlots.length +
      quantitySlots.length;

    const likelyNeedsPriorContext =
      hasExplicitPriorContextRequirement ||
      hasBlockingReference ||
      hasMissingAnchorSignal;

    const locallyGroundedOnly =
      hasReferenceSignal &&
      hasLocallyGroundedReference &&
      !hasUnresolvedReference &&
      !hasBlockingReference &&
      !hasExplicitPriorContextRequirement;

    const likelyStandalone =
      standaloneSemanticSupport > 0 ||
      locallyGroundedOnly ||
      (
        hasOperationSignal &&
        !hasExplicitPriorContextRequirement &&
        !hasBlockingReference &&
        !hasMissingAnchorSignal &&
        this.hasExplicitLocalTargetEvidence(observations)
      );

    const referenceResolutionQuality =
      referenceAnalysis.totalCount
        ? this.clamp01(
            (
              referenceAnalysis.locallyGroundedCount +
              referenceAnalysis.resolvedCount
            ) /
            referenceAnalysis.totalCount
          )
        : 1;

    const unresolvedReferenceRatio =
      referenceAnalysis.totalCount
        ? this.clamp01(
            referenceAnalysis.unresolvedCount /
            referenceAnalysis.totalCount
          )
        : 0;

    const blockingReferenceRatio =
      referenceAnalysis.totalCount
        ? this.clamp01(
            referenceAnalysis.blockingCount /
            referenceAnalysis.totalCount
          )
        : 0;

    const semanticDensity = this.clamp01(
      operationConfidence * 0.2 +
      slotConfidence * 0.35 +
      referenceResolutionQuality * 0.15 +
      missingAnchorConfidence * 0.2 +
      Math.min(1, standaloneSemanticSupport / 3) * 0.1
    );

    return {
      operationSignals,
      referenceSignals,
      slotSignals,
      questionShapes,
      missingAnchors,
      messyLanguageSignals,

      hasOperationSignal,
      hasReferenceSignal,
      hasSlotSignal,
      hasObjectSignal,
      hasMissingAnchorSignal,

      hasExplicitPriorContextRequirement,
      hasPriorContextReference,
      hasLocallyGroundedReference,
      hasUnresolvedReference,
      hasBlockingReference,

      locallyGroundedOnly,

      objectSlotCount: objectSlots.length,
      goalSlotCount: goalSlots.length,
      problemSlotCount: problemSlots.length,
      optionSlotCount: optionSlots.length,
      criteriaSlotCount: criteriaSlots.length,
      audienceSlotCount: audienceSlots.length,
      quantitySlotCount: quantitySlots.length,

      standaloneSemanticSupport,

      operationConfidence,
      referenceConfidence,
      slotConfidence,
      missingAnchorConfidence,

      referenceResolutionQuality,
      unresolvedReferenceRatio,
      blockingReferenceRatio,

      likelyNeedsPriorContext,
      likelyStandalone,
      semanticDensity,

      referenceAnalysis,
      missingAnchorAnalysis,
      questionShapeAnalysis,

      source: "ari-observer-routing-evidence"
    };
  },

  analyzeReferenceSignals(referenceSignals = []) {
    const classifications = referenceSignals.map(signal => {
      const metadata = signal?.metadata || {};

      const referenceKind =
        this.normalizeToken(
          signal.referenceKind ||
          metadata.referenceKind ||
          signal.referenceType ||
          metadata.referenceType ||
          signal.value ||
          "reference"
        );

      const locallyGrounded =
        this.readBooleanMeta(signal, [
          "locallyGrounded",
          "localGrounding",
          "resolvedLocally",
          "hasLocalAntecedent"
        ]) ||
        Boolean(
          signal.localAntecedent ||
          metadata.localAntecedent
        );

      const explicitlyResolved =
        this.readBooleanMeta(signal, [
          "resolved",
          "referenceResolved"
        ]) ||
        Boolean(
          signal.resolvedTo ||
          metadata.resolvedTo
        );

      const requiresResolution =
        this.readBooleanMeta(signal, [
          "requiresResolution",
          "unresolved",
          "needsResolution"
        ]);

      const requiresPriorContext =
        this.readBooleanMeta(signal, [
          "requiresPriorContext",
          "priorContextRequired",
          "needsPriorContext"
        ]);

      const blockingPotential =
        this.readBooleanMeta(signal, [
          "blockingPotential",
          "meaningBlocking",
          "blocksMeaning",
          "blocking"
        ]);

      const mentionRole =
        this.normalizeToken(
          signal.mentionRole ||
          metadata.mentionRole ||
          "unknown"
        );

      const unresolved =
        requiresResolution &&
        !locallyGrounded &&
        !explicitlyResolved;

      const blocking =
        blockingPotential &&
        (
          unresolved ||
          requiresPriorContext
        );

      return {
        signal,
        referenceKind,
        mentionRole,
        locallyGrounded,
        resolved: explicitlyResolved,
        requiresResolution,
        requiresPriorContext,
        blockingPotential,
        unresolved,
        blocking,
        confidence: this.normalizeConfidence(signal?.confidence)
      };
    });

    const totalCount = classifications.length;
    const locallyGroundedCount = classifications.filter(item => item.locallyGrounded).length;
    const resolvedCount = classifications.filter(item => item.resolved).length;
    const unresolvedCount = classifications.filter(item => item.unresolved).length;
    const blockingCount = classifications.filter(item => item.blocking).length;
    const priorContextRequiredCount = classifications.filter(item => item.requiresPriorContext).length;

    return {
      totalCount,
      locallyGroundedCount,
      resolvedCount,
      unresolvedCount,
      blockingCount,
      priorContextRequiredCount,

      locallyGroundedConfidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.locallyGrounded)
        ),

      unresolvedConfidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.unresolved)
        ),

      blockingConfidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.blocking)
        ),

      priorContextConfidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.requiresPriorContext)
        ),

      classifications
    };
  },

  analyzeMissingAnchors(missingAnchors = []) {
    const classifications = missingAnchors.map(signal => {
      const requiresPriorContext =
        this.readBooleanMeta(signal, [
          "requiresPriorContext",
          "priorContextRequired",
          "needsPriorContext"
        ]) ||
        [
          "short_follow_up_needs_prior_context",
          "option_reference_needs_options",
          "operation_without_standalone_object"
        ].includes(this.normalizeToken(signal?.value));

      const blockingPotential =
        this.readBooleanMeta(signal, [
          "blockingPotential",
          "meaningBlocking",
          "blocksMeaning",
          "blocking"
        ]);

      const locallyGrounded =
        this.readBooleanMeta(signal, [
          "locallyGrounded",
          "resolvedLocally",
          "hasLocalAntecedent"
        ]);

      const blocking =
        !locallyGrounded &&
        (
          blockingPotential ||
          requiresPriorContext
        );

      return {
        signal,
        requiresPriorContext,
        blockingPotential,
        locallyGrounded,
        blocking,
        confidence: this.normalizeConfidence(signal?.confidence)
      };
    });

    return {
      totalCount: classifications.length,

      blockingCount:
        classifications.filter(item => item.blocking).length,

      priorContextRequiredCount:
        classifications.filter(item => item.requiresPriorContext).length,

      locallyGroundedCount:
        classifications.filter(item => item.locallyGrounded).length,

      blockingConfidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.blocking)
        ),

      classifications
    };
  },

  analyzeQuestionShapes(questionShapes = []) {
    const explicitContextDependentValues = new Set([
      "bare_why",
      "bare_how",
      "short_follow_up",
      "context_dependent_follow_up"
    ]);

    const classifications = questionShapes.map(signal => {
      const value = this.normalizeToken(signal?.value);

      const explicitlyContextDependent =
        explicitContextDependentValues.has(value) &&
        this.readBooleanMeta(signal, [
          "locallyGrounded",
          "resolvedLocally"
        ]) !== true;

      return {
        signal,
        value,
        explicitlyContextDependent,
        confidence: this.normalizeConfidence(signal?.confidence)
      };
    });

    return {
      totalCount: classifications.length,

      explicitContextDependentCount:
        classifications.filter(item => item.explicitlyContextDependent).length,

      confidence:
        this.maxClassificationConfidence(
          classifications.filter(item => item.explicitlyContextDependent)
        ),

      classifications
    };
  },

  hasExplicitLocalTargetEvidence(observations = []) {
    return observations.some(observation => {
      const type = this.normalizeToken(observation?.type);
      const target = observation?.target;
      const operation = observation?.operation;
      const slotCandidate = this.readMeta(observation, "slotCandidate");

      return (
        Boolean(target) ||
        Boolean(operation) ||
        slotCandidate === "object" ||
        [
          "building_reference",
          "body_context",
          "body_symptom",
          "relationship_reference",
          "family_reference",
          "money_reference",
          "work_reference",
          "knowledge_request_phrase"
        ].includes(type)
      );
    });
  },

  /* =====================================================
     CONTEXT SHAPE
  ===================================================== */

  measureContextShape(text = "", recentMessages = [], thread = {}, semanticClues = {}) {
    const activeThreadAvailable =
      recentMessages.length > 0 ||
      Boolean(thread?.activeTopic) ||
      Boolean(thread?.workingContext) ||
      Boolean(thread?.semanticState) ||
      Boolean(thread?.activeSemanticFrame) ||
      Boolean(thread?.semanticStructure) ||
      Boolean(thread?.currentTopic) ||
      Boolean(thread?.activeSubject);

    const activeThreadMatch = activeThreadAvailable
      ? this.estimateThreadMatch(text, thread)
      : 0;

    const unresolvedReferenceLoad =
      semanticClues.hasReferenceSignal
        ? semanticClues.unresolvedReferenceRatio
        : 0;

    const blockingReferenceLoad =
      semanticClues.hasReferenceSignal
        ? semanticClues.blockingReferenceRatio
        : 0;

    const locallyGroundedReferenceLoad =
      semanticClues.referenceAnalysis?.totalCount
        ? this.clamp01(
            semanticClues.referenceAnalysis.locallyGroundedCount /
            semanticClues.referenceAnalysis.totalCount
          )
        : 0;

    return {
      activeThreadAvailable,
      recentMessageCount: recentMessages.length,
      activeThreadMatch,

      lexicalReferenceLoad:
        this.measureReferenceLoad(text),

      lexicalContinuationLoad:
        this.measureLexicalContinuationLoad(text),

      unresolvedReferenceLoad,
      blockingReferenceLoad,
      locallyGroundedReferenceLoad,

      priorContextEvidencePresent:
        semanticClues.hasExplicitPriorContextRequirement === true,

      contextAvailabilityIsNotDependency: true
    };
  },

  /* =====================================================
     FOLLOW-UP SHAPE
  ===================================================== */

  measureFollowUpShape(text = "", recentMessages = [], summary = {}, semanticClues = {}, contextShape = {}) {
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/).filter(Boolean);

    const hasThread =
      recentMessages.length > 0 ||
      Boolean(summary.threadState) ||
      Boolean(summary.threadUnderstanding) ||
      Boolean(summary.threadContext);

    const shortQuestion =
      (
        normalized.endsWith("?") ||
        /^(why|how|what|really|then what|what about|what if)\b/.test(normalized)
      ) &&
      words.length <= 8;

    const explicitFollowUpShape =
      semanticClues.questionShapeAnalysis
        ?.explicitContextDependentCount > 0;

    const unresolvedBlockingReference =
      semanticClues.hasBlockingReference ||
      (
        semanticClues.hasUnresolvedReference &&
        semanticClues.hasExplicitPriorContextRequirement
      );

    const hasStrongFollowUpSignal =
      semanticClues.hasMissingAnchorSignal ||
      semanticClues.hasExplicitPriorContextRequirement ||
      unresolvedBlockingReference ||
      explicitFollowUpShape;

    const locallyGroundedBlock =
      semanticClues.hasLocallyGroundedReference &&
      !semanticClues.hasUnresolvedReference &&
      !semanticClues.hasBlockingReference &&
      !semanticClues.hasExplicitPriorContextRequirement;

    const followUpSignal =
      hasThread &&
      hasStrongFollowUpSignal &&
      !locallyGroundedBlock
        ? 1
        : 0;

    let followUpStrength = "weak";
    let reason = "No authoritative evidence says the current turn requires prior context.";

    if (followUpSignal) {
      followUpStrength = "strong";
      reason = "Canonical evidence identifies a blocking, unresolved, or prior-context-dependent reference.";
    } else if (locallyGroundedBlock) {
      followUpStrength = "blocked_by_local_grounding";
      reason = "Reference language is locally grounded and must not create follow-up pressure.";
    } else if (semanticClues.likelyStandalone) {
      followUpStrength = "blocked_by_standalone_evidence";
      reason = "The current turn contains enough locally grounded semantic evidence to stand alone.";
    } else if (!hasThread && hasStrongFollowUpSignal) {
      followUpStrength = "context_unavailable";
      reason = "The turn may require prior context, but no usable thread is currently available.";
    }

    return {
      hasThread,
      shortQuestion,
      explicitFollowUpShape,
      unresolvedBlockingReference,
      locallyGroundedBlock,
      hasStrongFollowUpSignal,
      followUpSignal,
      followUpStrength,
      reason,

      priorContextEvidence:
        semanticClues.hasExplicitPriorContextRequirement,

      blockingReferenceEvidence:
        semanticClues.hasBlockingReference,

      unresolvedReferenceEvidence:
        semanticClues.hasUnresolvedReference,

      activeThreadMatch:
        contextShape.activeThreadMatch || 0
    };
  },

  /* =====================================================
     MEMORY / REVISION / RELATIONSHIP
  ===================================================== */

  measureMemoryShape(summary = {}, memory = {}, observerShape = {}) {
    const memoryAvailable =
      Boolean(memory?.available) ||
      (
        Array.isArray(memory?.items) &&
        memory.items.length > 0
      );

    const explicitRecall =
      summary.currentTurn?.intent === "recall" ||
      summary.intent === "recall" ||
      summary.explicitRequestedOperation === "retrieve_prior_context" ||
      observerShape.hasMemorySignal;

    return {
      memoryAvailable,
      recallSignal: explicitRecall ? 1 : 0,
      explicitRecall
    };
  },

  measureRevisionShape(summary = {}, observerShape = {}) {
    const explicitRevision =
      summary.currentTurn?.mode === "correction" ||
      summary.intent === "revision" ||
      summary.explicitRequestedOperation === "verify_or_review" ||
      observerShape.hasRevisionSignal;

    return {
      revisionSignal: explicitRevision ? 1 : 0,
      explicitRevision
    };
  },

  measureRelationshipShape(summary = {}, relationship = {}, observerShape = {}) {
    const relationshipAvailable =
      Boolean(relationship?.active) ||
      Boolean(relationship?.mode) ||
      Boolean(summary.relationshipContext);

    const relationshipSignal =
      Boolean(relationship?.active) ||
      Boolean(relationship?.mode) ||
      observerShape.hasRelationshipSignal;

    return {
      relationshipAvailable,
      relationshipSignal: relationshipSignal ? 1 : 0
    };
  },

  /* =====================================================
     PRESSURE SCORING
  ===================================================== */

  scoreStandaloneCompleteness(messageShape = {}, contextShape = {}, observerShape = {}, semanticClues = {}) {
    let score = 0;

    score += messageShape.hasEnoughContent ? 0.18 : 0;
    score += messageShape.hasSubstantialContent ? 0.1 : 0;
    score += messageShape.contentDensity * 0.15;
    score += observerShape.hasQuestion ? 0.08 : 0;
    score += observerShape.hasDirectAnswerExpectation ? 0.08 : 0;
    score += semanticClues.likelyStandalone ? 0.28 : 0;
    score += semanticClues.semanticDensity * 0.13;
    score += semanticClues.referenceResolutionQuality * 0.08;

    if (semanticClues.hasLocallyGroundedReference) score += 0.12;
    if (semanticClues.hasObjectSignal) score += 0.12;
    if (semanticClues.hasExplicitPriorContextRequirement) score -= 0.28;
    if (semanticClues.hasBlockingReference) score -= 0.3;
    if (semanticClues.hasMissingAnchorSignal) score -= 0.22;

    return this.clamp01(score);
  },

  scoreContextDependency(messageShape = {}, contextShape = {}, semanticClues = {}, followUpShape = {}) {
    let score = 0;

    score += semanticClues.hasExplicitPriorContextRequirement ? 0.36 : 0;
    score += semanticClues.hasBlockingReference ? 0.3 : 0;
    score += semanticClues.hasMissingAnchorSignal ? 0.24 : 0;
    score += followUpShape.followUpSignal ? 0.24 : 0;
    score += contextShape.unresolvedReferenceLoad * 0.18;
    score += contextShape.blockingReferenceLoad * 0.2;
    score += contextShape.activeThreadMatch * 0.08;
    score += messageShape.fragmentPressure * 0.08;

    if (semanticClues.likelyStandalone) score -= 0.3;
    if (semanticClues.hasLocallyGroundedReference) score -= 0.25;
    if (followUpShape.locallyGroundedBlock) score -= 0.25;

    return this.clamp01(score);
  },

  scoreFollowUpPressure(followUpShape = {}, contextShape = {}, semanticClues = {}) {
    let score = 0;

    score += followUpShape.followUpSignal ? 0.5 : 0;
    score += semanticClues.hasExplicitPriorContextRequirement ? 0.25 : 0;
    score += semanticClues.hasBlockingReference ? 0.25 : 0;
    score += semanticClues.hasMissingAnchorSignal ? 0.2 : 0;
    score += contextShape.blockingReferenceLoad * 0.15;
    score += contextShape.unresolvedReferenceLoad * 0.1;

    if (semanticClues.likelyStandalone) score -= 0.35;
    if (semanticClues.hasLocallyGroundedReference) score -= 0.35;
    if (followUpShape.locallyGroundedBlock) score -= 0.3;

    return this.clamp01(score);
  },

  scoreRecallPressure(memoryShape = {}, semanticClues = {}, observerShape = {}) {
    let score = 0;

    score += memoryShape.recallSignal * 0.72;
    score += memoryShape.memoryAvailable && memoryShape.explicitRecall ? 0.18 : 0;
    score += semanticClues.hasPriorContextReference ? 0.08 : 0;

    return this.clamp01(score);
  },

  scoreRevisionPressure(revisionShape = {}, contextShape = {}, observerShape = {}, semanticClues = {}) {
    let score = 0;

    score += revisionShape.revisionSignal * 0.72;
    score += revisionShape.explicitRevision && contextShape.activeThreadAvailable ? 0.14 : 0;
    score += observerShape.hasCodeOutputExpectation && revisionShape.explicitRevision ? 0.06 : 0;
    score += semanticClues.hasPriorContextReference && revisionShape.explicitRevision ? 0.08 : 0;

    return this.clamp01(score);
  },

  scoreRelationshipContinuity(relationshipShape = {}, contextShape = {}, observerShape = {}, semanticClues = {}) {
    let score = 0;

    score += relationshipShape.relationshipSignal * 0.4;
    score += relationshipShape.relationshipAvailable ? 0.16 : 0;
    score += observerShape.hasOwnershipCloseOther ? 0.12 : 0;
    score += contextShape.activeThreadMatch * 0.12;

    if (semanticClues.hasPriorContextReference) score += 0.12;
    if (semanticClues.hasLocallyGroundedReference) score += 0.04;

    return this.clamp01(score);
  },

  scoreAmbiguityWithoutContext(messageShape = {}, contextShape = {}, semanticClues = {}, followUpShape = {}) {
    let score = 0;

    score += semanticClues.hasBlockingReference ? 0.32 : 0;
    score += semanticClues.hasExplicitPriorContextRequirement ? 0.28 : 0;
    score += semanticClues.hasMissingAnchorSignal ? 0.22 : 0;
    score += contextShape.unresolvedReferenceLoad * 0.18;
    score += messageShape.fragmentPressure * 0.08;
    score += followUpShape.hasStrongFollowUpSignal && !followUpShape.hasThread ? 0.12 : 0;

    if (semanticClues.likelyStandalone) score -= 0.35;
    if (semanticClues.hasLocallyGroundedReference) score -= 0.3;
    if (semanticClues.referenceResolutionQuality >= 0.75) score -= 0.12;

    return this.clamp01(score);
  },

  scoreDirectAnswerPressure(messageShape = {}, observerShape = {}, semanticClues = {}) {
    let score = 0;

    score += observerShape.hasDirectAnswerExpectation ? 0.22 : 0;
    score += observerShape.hasStepByStepExpectation ? 0.16 : 0;
    score += observerShape.hasQuestion ? 0.14 : 0;
    score += messageShape.hasEnoughContent ? 0.1 : 0;
    score += messageShape.contentDensity * 0.1;
    score += semanticClues.likelyStandalone ? 0.22 : 0;
    score += semanticClues.semanticDensity * 0.12;
    score += semanticClues.hasLocallyGroundedReference ? 0.08 : 0;

    if (semanticClues.hasBlockingReference) score -= 0.3;
    if (semanticClues.hasExplicitPriorContextRequirement) score -= 0.24;
    if (semanticClues.hasMissingAnchorSignal) score -= 0.2;

    return this.clamp01(score);
  },

  /* =====================================================
     REFERENCE AND CONTINUATION MEASUREMENT
  ===================================================== */

  measureReferenceLoad(text = "") {
    const words = this.normalize(text).split(/\s+/).filter(Boolean);

    if (!words.length) return 0;

    const referenceWords = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");

      return [
        "it",
        "its",
        "this",
        "that",
        "these",
        "those",
        "they",
        "them",
        "their",
        "he",
        "him",
        "his",
        "she",
        "her",
        "hers",
        "same",
        "former",
        "latter",
        "one",
        "ones",
        "there",
        "then"
      ].includes(cleaned);
    }).length;

    return this.clamp01(referenceWords / words.length);
  },

  measureLexicalContinuationLoad(text = "") {
    const normalized = this.normalize(text);

    let score = 0;

    if (/^(and|but|so|then|also|what about|what if|based on that|given that)\b/.test(normalized)) {
      score += 0.3;
    }

    if (/\b(earlier|previously|last time|before|again|continue|go on)\b/.test(normalized)) {
      score += 0.35;
    }

    if (/^(why|how|really|then what|and then)\??$/.test(normalized)) {
      score += 0.45;
    }

    return this.clamp01(score);
  },

  estimateThreadMatch(text = "", thread = {}) {
    const activeTopic = this.stringifyThreadTopic(
      thread?.activeTopic ||
      thread?.currentTopic ||
      thread?.activeSubject ||
      thread?.workingContext?.followUpAnchor ||
      thread?.workingContext?.activeClaim ||
      thread?.semanticState?.followUpAnchor ||
      thread?.activeSemanticFrame?.slots?.object ||
      thread?.activeSemanticFrame?.target ||
      thread?.semanticStructure?.claims?.[0]?.proposition ||
      thread?.workingContext ||
      ""
    );

    if (!activeTopic) return 0;

    const messageTokens = this.tokenSet(text);
    const threadTokens = this.tokenSet(activeTopic);

    if (!messageTokens.size || !threadTokens.size) return 0;

    let overlap = 0;

    messageTokens.forEach(token => {
      if (threadTokens.has(token)) overlap += 1;
    });

    return this.clamp01(
      overlap /
      Math.max(
        1,
        Math.min(messageTokens.size, threadTokens.size)
      )
    );
  },

  stringifyThreadTopic(value = "") {
    if (!value) return "";

    if (typeof value === "string") return value;

    if (Array.isArray(value)) {
      return value
        .map(item => this.stringifyThreadTopic(item))
        .filter(Boolean)
        .join(" ");
    }

    if (typeof value === "object") {
      return String(
        value.surface ||
        value.value ||
        value.label ||
        value.name ||
        value.claim ||
        value.proposition ||
        value.summary ||
        value.text ||
        ""
      );
    }

    return String(value);
  },

  /* =====================================================
     METADATA HELPERS
  ===================================================== */

  readMeta(observation = {}, key = "") {
    if (!observation || !key) return undefined;

    if (observation[key] !== undefined) {
      return observation[key];
    }

    if (
      observation.metadata &&
      observation.metadata[key] !== undefined
    ) {
      return observation.metadata[key];
    }

    return undefined;
  },

  readBooleanMeta(observation = {}, keys = []) {
    return keys.some(key => this.readMeta(observation, key) === true);
  },

  maxClassificationConfidence(items = []) {
    if (!Array.isArray(items) || !items.length) return 0;

    return Math.max(
      ...items.map(item =>
        this.normalizeConfidence(
          item?.confidence ??
          item?.signal?.confidence ??
          0
        )
      )
    );
  },

  maxConfidence(items = []) {
    if (!Array.isArray(items) || !items.length) return 0;

    return Math.max(
      ...items.map(item =>
        this.normalizeConfidence(item?.confidence)
      )
    );
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  nonConcreteWords: new Set([
    "about",
    "above",
    "after",
    "again",
    "because",
    "before",
    "could",
    "earlier",
    "given",
    "might",
    "other",
    "previous",
    "really",
    "should",
    "their",
    "there",
    "these",
    "thing",
    "those",
    "would"
  ]),

  tokenSet(text = "") {
    const stopWords = new Set([
      "about",
      "after",
      "again",
      "before",
      "could",
      "does",
      "from",
      "have",
      "into",
      "just",
      "should",
      "that",
      "their",
      "there",
      "these",
      "this",
      "those",
      "what",
      "when",
      "where",
      "which",
      "with",
      "would",
      "your"
    ]);

    return new Set(
      this.normalize(text)
        .split(/\W+/)
        .filter(token =>
          token.length >= 4 &&
          !stopWords.has(token)
        )
    );
  },

  normalizeConfidence(value = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) return 0;

    if (number > 1) {
      return this.clamp01(number / 100);
    }

    return this.clamp01(number);
  },

  normalizeToken(value = "") {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_")
      .replace(/[^\w]/g, "")
      .replace(/_+/g, "_");
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s'?.,!:%-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  clamp01(value = 0) {
    return Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );
  }
};

console.log(
  "ARI OBSERVER ROUTING EVIDENCE LOADED:",
  window.Ari.observerRoutingEvidence?.version
);