// ari/observer-system/ari-observer-routing-evidence.js
// Ari Observer Routing Evidence
// Purpose: Convert Observer evidence into routing pressures for the Lane Splitter.
// V1.4.0 — Evidence Translator Only / Semantic Clues / No Frame Building

window.Ari = window.Ari || {};

window.Ari.observerRoutingEvidence = {
  version: "1.4.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const observer =
      input.observer ||
      summary.observer ||
      summary.observerEvidence ||
      {};

    const rawText =
      observer.rawUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text =
      observer.normalizedObservedText ||
      this.normalize(rawText);

    const observations = Array.isArray(observer.observations)
      ? observer.observations
      : Array.isArray(observer.observationLedger)
        ? observer.observationLedger
        : [];

    const recentMessages = Array.isArray(summary.recentMessages)
      ? summary.recentMessages
      : [];

    const thread = summary.threadUnderstanding || summary.threadState || {};
    const memory = summary.memoryContext || summary.memory || {};
    const relationship = summary.relationshipContext || {};

    const messageShape = this.measureMessageShape(text);
    const observerShape = this.measureObserverShape(observations);
    const semanticClues = this.measureSemanticClues(observations, text);
    const contextShape = this.measureContextShape(text, recentMessages, thread);
    const followUpShape = this.measureFollowUpShape(
      text,
      recentMessages,
      summary,
      semanticClues
    );
    const memoryShape = this.measureMemoryShape(summary, memory, observerShape);
    const revisionShape = this.measureRevisionShape(summary, observerShape);
    const relationshipShape = this.measureRelationshipShape(
      summary,
      relationship,
      observerShape
    );

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
        contextShape,
        observerShape
      ),

      revisionPressure: this.scoreRevisionPressure(
        revisionShape,
        contextShape,
        observerShape
      ),

      relationshipContinuity: this.scoreRelationshipContinuity(
        relationshipShape,
        contextShape,
        observerShape
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

    return {
      engine: "ari-observer-routing-evidence",
      version: this.version,
      source: "ari-observer-routing-evidence",

      ...pressures,
      routingPressures: pressures,

      semanticClues,

      routingGuards: {
        hasOperationSignal: semanticClues.hasOperationSignal,
        hasObjectSignal: semanticClues.hasObjectSignal,
        hasReferenceSignal: semanticClues.hasReferenceSignal,
        hasMissingAnchorSignal: semanticClues.hasMissingAnchorSignal,
        likelyNeedsPriorContext: semanticClues.likelyNeedsPriorContext,
        likelyStandalone: semanticClues.likelyStandalone,
        shouldNotForceFollowUp:
          semanticClues.likelyStandalone &&
          !semanticClues.hasMissingAnchorSignal
      },

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
        canChooseLane: false,
        canBuildSemanticFrame: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "evidence_to_pressure_translation_only"
      }
    };
  },

  measureMessageShape(text = "") {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const length = text.length;

    const concreteUnits = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");
      return cleaned.length >= 5 || /\d/.test(cleaned);
    }).length;

    return {
      length,
      wordCount,
      hasQuestionForm: text.trim().endsWith("?"),
      hasEnoughContent: wordCount >= 7 && length >= 35,
      contentDensity: wordCount ? this.clamp01(concreteUnits / wordCount) : 0,
      brevityPressure: wordCount <= 12 ? 1 : wordCount <= 25 ? 0.5 : 0
    };
  },

  measureObserverShape(observations = []) {
    const hasType = type => observations.some(o => o.type === type);
    const hasValue = value => observations.some(o => o.value === value);
    const hasDomain = domain => observations.some(o => o.domain === domain);

    return {
      hasQuestion: hasType("question_mark_count") || hasType("question_phrase"),
      hasDirectAnswerExpectation: hasValue("direct_answer"),
      hasStepByStepExpectation: hasValue("step_by_step"),
      hasCodeOutputExpectation: hasValue("code_output"),
      hasMemorySignal: hasType("memory_request_phrase"),
      hasRevisionSignal:
        observations.some(o => o.type === "speech_act" && o.value === "feedback") ||
        hasValue("correction"),

      hasRelationshipSignal:
        hasType("relationship_reference") ||
        hasType("family_reference") ||
        hasDomain("relationship"),

      hasMedicalSignal:
        hasType("body_context") ||
        hasType("body_symptom") ||
        hasDomain("body"),

      hasOwnershipSelf: hasValue("self"),
      hasOwnershipCloseOther: hasValue("close_other"),
      hasBuilderSignal: hasDomain("builder")
    };
  },

  measureSemanticClues(observations = [], text = "") {
    const byType = type => observations.filter(o => o.type === type);

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

    const objectSlots = slotSignals.filter(s => s.slotCandidate === "object");
    const goalSlots = slotSignals.filter(s => s.slotCandidate === "goal");
    const problemSlots = slotSignals.filter(s => s.slotCandidate === "problem");
    const optionSlots = slotSignals.filter(s => s.slotCandidate === "options");
    const criteriaSlots = slotSignals.filter(s => s.slotCandidate === "criteria");
    const audienceSlots = slotSignals.filter(s => s.slotCandidate === "audience");

    const hasOperationSignal = operationSignals.length > 0;
    const hasReferenceSignal = referenceSignals.length > 0;
    const hasSlotSignal = slotSignals.length > 0;
    const hasObjectSignal = objectSlots.length > 0;
    const hasMissingAnchorSignal = missingAnchors.length > 0;

    const likelyNeedsPriorContext =
      hasMissingAnchorSignal ||
      (
        hasOperationSignal &&
        hasReferenceSignal &&
        !hasObjectSignal
      ) ||
      questionShapes.some(q =>
        ["bare_why", "bare_how", "short_follow_up"].includes(q.value)
      );

    const likelyStandalone =
      hasObjectSignal ||
      goalSlots.length > 0 ||
      problemSlots.length > 0 ||
      (
        hasSlotSignal &&
        !hasReferenceSignal &&
        !hasMissingAnchorSignal
      );

    const semanticDensity = this.clamp01(
      operationConfidence * 0.25 +
      slotConfidence * 0.35 +
      referenceConfidence * 0.15 +
      missingAnchorConfidence * 0.25
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

      objectSlotCount: objectSlots.length,
      goalSlotCount: goalSlots.length,
      problemSlotCount: problemSlots.length,
      optionSlotCount: optionSlots.length,
      criteriaSlotCount: criteriaSlots.length,
      audienceSlotCount: audienceSlots.length,

      operationConfidence,
      referenceConfidence,
      slotConfidence,
      missingAnchorConfidence,

      likelyNeedsPriorContext,
      likelyStandalone,
      semanticDensity,

      source: "ari-observer-routing-evidence"
    };
  },

  measureContextShape(text = "", recentMessages = [], thread = {}) {
    const activeThreadAvailable =
      recentMessages.length > 0 ||
      !!thread?.activeTopic ||
      !!thread?.workingContext ||
      !!thread?.semanticState ||
      !!thread?.activeSemanticFrame;

    return {
      activeThreadAvailable,
      recentMessageCount: recentMessages.length,
      referenceLoad: this.measureReferenceLoad(text),
      continuationLoad: this.measureContinuationLoad(text),
      activeThreadMatch: activeThreadAvailable
        ? this.estimateThreadMatch(text, thread)
        : 0
    };
  },

  measureFollowUpShape(text = "", recentMessages = [], summary = {}, semanticClues = {}) {
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/).filter(Boolean);
    const hasThread = recentMessages.length > 0 || !!summary.threadState;

    const shortQuestion =
      normalized.endsWith("?") && words.length <= 8;

    const hasStrongFollowUpSignal =
      semanticClues.likelyNeedsPriorContext ||
      semanticClues.hasMissingAnchorSignal ||
      (
        semanticClues.hasReferenceSignal &&
        !semanticClues.hasObjectSignal
      );

    const followUpSignal =
      hasThread && hasStrongFollowUpSignal ? 1 : 0;

    return {
      hasThread,
      shortQuestion,
      hasStrongFollowUpSignal,
      followUpSignal,

      followUpStrength: followUpSignal
        ? "strong"
        : semanticClues.likelyStandalone
          ? "blocked_by_standalone_evidence"
          : "weak",

      reason: followUpSignal
        ? "Observer evidence suggests the current turn is missing an anchor and needs prior context."
        : semanticClues.likelyStandalone
          ? "Observer evidence suggests the current turn has standalone semantic content."
          : "Weak or no follow-up evidence."
    };
  },

  measureMemoryShape(summary, memory, observerShape) {
    return {
      memoryAvailable:
        !!memory?.available ||
        (Array.isArray(memory?.items) && memory.items.length > 0),

      recallSignal:
        summary.currentTurn?.intent === "recall" ||
        summary.intent === "recall" ||
        observerShape.hasMemorySignal
          ? 1
          : 0
    };
  },

  measureRevisionShape(summary, observerShape) {
    return {
      revisionSignal:
        summary.currentTurn?.mode === "correction" ||
        summary.intent === "revision" ||
        observerShape.hasRevisionSignal
          ? 1
          : 0
    };
  },

  measureRelationshipShape(summary, relationship, observerShape) {
    return {
      relationshipAvailable:
        !!relationship?.active ||
        !!relationship?.mode ||
        !!summary.relationshipContext,

      relationshipSignal:
        relationship?.active ||
        relationship?.mode ||
        observerShape.hasRelationshipSignal
          ? 1
          : 0
    };
  },

  scoreStandaloneCompleteness(messageShape, contextShape, observerShape, semanticClues) {
    let score = 0;

    score += messageShape.hasEnoughContent ? 0.25 : 0;
    score += messageShape.contentDensity * 0.20;
    score += observerShape.hasQuestion ? 0.10 : 0;
    score += observerShape.hasDirectAnswerExpectation ? 0.10 : 0;
    score += semanticClues.likelyStandalone ? 0.30 : 0;
    score += semanticClues.semanticDensity * 0.20;

    if (semanticClues.likelyNeedsPriorContext) score -= 0.25;

    return this.clamp01(score);
  },

  scoreContextDependency(messageShape, contextShape, semanticClues, followUpShape) {
    let score = 0;

    score += contextShape.activeThreadAvailable ? 0.10 : 0;
    score += contextShape.referenceLoad * 0.25;
    score += contextShape.continuationLoad * 0.20;
    score += messageShape.brevityPressure * 0.10;
    score += contextShape.activeThreadMatch * 0.10;
    score += semanticClues.likelyNeedsPriorContext ? 0.35 : 0;
    score += followUpShape.hasStrongFollowUpSignal ? 0.20 : 0;

    if (semanticClues.likelyStandalone) score -= 0.30;

    return this.clamp01(score);
  },

  scoreFollowUpPressure(followUpShape = {}, contextShape = {}, semanticClues = {}) {
    let score = 0;

    score += followUpShape.followUpSignal ? 0.65 : 0;
    score += semanticClues.hasMissingAnchorSignal ? 0.30 : 0;
    score += semanticClues.hasReferenceSignal ? 0.15 : 0;
    score += semanticClues.likelyNeedsPriorContext ? 0.30 : 0;
    score += contextShape.activeThreadAvailable ? 0.10 : 0;

    if (semanticClues.likelyStandalone && !semanticClues.hasMissingAnchorSignal) {
      score -= 0.45;
    }

    return this.clamp01(score);
  },

  scoreRecallPressure(memoryShape, contextShape, observerShape) {
    let score = 0;

    score += memoryShape.recallSignal * 0.65;
    score += memoryShape.memoryAvailable ? 0.15 : 0;
    score += contextShape.referenceLoad * 0.10;

    return this.clamp01(score);
  },

  scoreRevisionPressure(revisionShape, contextShape, observerShape) {
    let score = 0;

    score += revisionShape.revisionSignal * 0.70;
    score += contextShape.activeThreadAvailable ? 0.15 : 0;
    score += contextShape.referenceLoad * 0.10;
    score += observerShape.hasCodeOutputExpectation ? 0.05 : 0;

    return this.clamp01(score);
  },

  scoreRelationshipContinuity(relationshipShape, contextShape, observerShape) {
    let score = 0;

    score += relationshipShape.relationshipSignal * 0.45;
    score += relationshipShape.relationshipAvailable ? 0.20 : 0;
    score += observerShape.hasOwnershipCloseOther ? 0.10 : 0;
    score += contextShape.activeThreadMatch * 0.15;
    score += contextShape.referenceLoad * 0.10;

    return this.clamp01(score);
  },

  scoreAmbiguityWithoutContext(messageShape, contextShape, semanticClues, followUpShape) {
    let score = 0;

    score += messageShape.contentDensity < 0.35 ? 0.20 : 0;
    score += messageShape.brevityPressure * 0.15;
    score += contextShape.referenceLoad * 0.20;
    score += contextShape.activeThreadAvailable ? 0.10 : 0;
    score += semanticClues.likelyNeedsPriorContext ? 0.35 : 0;
    score += followUpShape.hasStrongFollowUpSignal ? 0.15 : 0;

    if (semanticClues.likelyStandalone) score -= 0.30;

    return this.clamp01(score);
  },

  scoreDirectAnswerPressure(messageShape, observerShape, semanticClues) {
    let score = 0;

    score += observerShape.hasDirectAnswerExpectation ? 0.20 : 0;
    score += observerShape.hasStepByStepExpectation ? 0.20 : 0;
    score += observerShape.hasQuestion ? 0.15 : 0;
    score += messageShape.hasEnoughContent ? 0.15 : 0;
    score += messageShape.contentDensity * 0.15;
    score += semanticClues.likelyStandalone ? 0.25 : 0;
    score += semanticClues.semanticDensity * 0.15;

    if (semanticClues.likelyNeedsPriorContext) score -= 0.30;

    return this.clamp01(score);
  },

  measureReferenceLoad(text) {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    const abstractRefs = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");
      return [
        "it", "this", "that", "these", "those",
        "they", "them", "same", "before",
        "earlier", "previous", "above", "current",
        "last", "again", "one", "ones"
      ].includes(cleaned);
    }).length;

    return this.clamp01(abstractRefs / words.length);
  },

  measureContinuationLoad(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    let score = 0;

    if (words.length <= 8) score += 0.20;
    if (text.length <= 60) score += 0.15;
    if (this.measureReferenceLoad(text) > 0.12) score += 0.30;

    return this.clamp01(score);
  },

  estimateThreadMatch(text, thread) {
    const activeTopic = String(
      thread?.activeTopic ||
      thread?.workingContext?.followUpAnchor ||
      thread?.workingContext?.activeClaim ||
      thread?.semanticState?.followUpAnchor ||
      thread?.activeSemanticFrame?.slots?.object ||
      thread?.workingContext ||
      ""
    );

    if (!activeTopic) return 0;

    const messageTokens = this.tokenSet(text);
    const threadTokens = this.tokenSet(activeTopic);

    if (!messageTokens.size || !threadTokens.size) return 0;

    let overlap = 0;

    messageTokens.forEach(token => {
      if (threadTokens.has(token)) overlap++;
    });

    return this.clamp01(overlap / Math.max(1, messageTokens.size));
  },

  maxConfidence(items = []) {
    if (!Array.isArray(items) || !items.length) return 0;

    return Math.max(
      ...items.map(item => Number(item.confidence || 0))
    );
  },

  tokenSet(text) {
    return new Set(
      String(text || "")
        .toLowerCase()
        .split(/\W+/)
        .filter(token => token.length >= 4)
    );
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

  clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }
};

console.log(
  "ARI OBSERVER ROUTING EVIDENCE LOADED:",
  window.Ari.observerRoutingEvidence?.version
);