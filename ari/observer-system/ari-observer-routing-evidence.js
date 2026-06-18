// ari/observer-system/ari-observer-routing-evidence.js
// Ari Observer Routing Evidence
// Purpose: Convert Observer evidence into routing pressures for the Lane Splitter.
// V1.1.0 — Lossless / Additive / No Lane Authority / No Composer Authority

window.Ari = window.Ari || {};

window.Ari.observerRoutingEvidence = {
  version: "1.1.0",

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

    const thread = summary.threadUnderstanding || {};
    const memory = summary.memoryContext || summary.memory || {};
    const relationship = summary.relationshipContext || {};

    const messageShape = this.measureMessageShape(text);
    const observerShape = this.measureObserverShape(observations);
    const contextShape = this.measureContextShape(text, recentMessages, thread);
   const followUpShape = this.measureFollowUpShape(text, recentMessages, summary);
     const memoryShape = this.measureMemoryShape(summary, memory, observerShape);
    const revisionShape = this.measureRevisionShape(summary, observerShape);
    const relationshipShape = this.measureRelationshipShape(summary, relationship, observerShape);
    const pressures = {
      standaloneCompleteness: this.scoreStandaloneCompleteness(messageShape, contextShape, observerShape),
      contextDependency: this.scoreContextDependency(messageShape, contextShape, observerShape),
      followUpPressure: this.scoreFollowUpPressure(
  followUpShape,
  contextShape
),
      recallPressure: this.scoreRecallPressure(memoryShape, contextShape, observerShape),
      revisionPressure: this.scoreRevisionPressure(revisionShape, contextShape, observerShape),
      relationshipContinuity: this.scoreRelationshipContinuity(relationshipShape, contextShape, observerShape),
      ambiguityWithoutContext: this.scoreAmbiguityWithoutContext(messageShape, contextShape, observerShape),
      activeThreadMatch: contextShape.activeThreadMatch,
      directAnswerPressure: this.scoreDirectAnswerPressure(messageShape, contextShape, observerShape)
    };

    return {
      engine: "ari-observer-routing-evidence",
      version: this.version,
      source: "ari-observer-routing-evidence",

      ...pressures,

      routingPressures: pressures,

      supportingObservationIds: this.buildSupportingObservationIds(observations),

      supportingEvidence: {
        messageShape,
        observerShape,
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
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "evidence_to_pressure_translation_only"
      }
    };
  },

  measureMessageShape(text) {
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
      hasSafetySignal:
        hasType("safety_language") ||
        hasDomain("safety"),
      hasMedicalSignal:
        hasType("body_context") ||
        hasType("body_symptom") ||
        hasDomain("body"),
      hasCurrentTimeSignal: hasType("current_time"),
      hasPastTimeSignal: hasType("past_time"),
      hasOwnershipSelf: hasValue("self"),
      hasOwnershipCloseOther: hasValue("close_other"),
      hasBuilderSignal: hasDomain("builder")
    };
  },

  measureContextShape(text, recentMessages, thread) {
    const activeThreadAvailable =
      recentMessages.length > 0 ||
      !!thread?.activeTopic ||
      !!thread?.workingContext;

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

measureFollowUpShape(text = "", recentMessages = [], summary = {}) {
  const normalized = this.normalize(text);
  const hasThread = recentMessages.length > 0 || !!summary.threadState;

  const startsAsFollowUp =
    /^(why|how|what if|then what|after that|what about|and if|but|so|ok|okay)\b/i.test(normalized);

  const hasReference =
    this.measureReferenceLoad(normalized) > 0.08;

  const shortQuestion =
    normalized.endsWith("?") && normalized.split(/\s+/).filter(Boolean).length <= 14;

  return {
    hasThread,
    startsAsFollowUp,
    hasReference,
    shortQuestion,
    followUpSignal:
      hasThread && (startsAsFollowUp || hasReference || shortQuestion)
        ? 1
        : 0
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

  scoreStandaloneCompleteness(messageShape, contextShape, observerShape) {
    let score = 0;

    score += messageShape.hasEnoughContent ? 0.30 : 0;
    score += messageShape.contentDensity * 0.30;
    score += observerShape.hasQuestion ? 0.15 : 0;
    score += observerShape.hasDirectAnswerExpectation ? 0.15 : 0;
    score += contextShape.referenceLoad < 0.15 ? 0.10 : 0;

    return this.clamp01(score);
  },

  scoreContextDependency(messageShape, contextShape, observerShape) {
    let score = 0;

    score += contextShape.activeThreadAvailable ? 0.12 : 0;
    score += contextShape.referenceLoad * 0.30;
    score += contextShape.continuationLoad * 0.25;
    score += messageShape.brevityPressure * 0.15;
    score += contextShape.activeThreadMatch * 0.10;
    score += observerShape.hasPastTimeSignal ? 0.08 : 0;

    return this.clamp01(score);
  },
scoreFollowUpPressure(followUpShape = {}, contextShape = {}) {
  let score = 0;

  score += followUpShape.followUpSignal ? 0.55 : 0;
  score += followUpShape.startsAsFollowUp ? 0.20 : 0;
  score += followUpShape.hasReference ? 0.15 : 0;
  score += followUpShape.shortQuestion ? 0.10 : 0;
  score += contextShape.activeThreadAvailable ? 0.10 : 0;

  return this.clamp01(score);
},
  scoreRecallPressure(memoryShape, contextShape, observerShape) {
    let score = 0;

    score += memoryShape.recallSignal * 0.65;
    score += memoryShape.memoryAvailable ? 0.15 : 0;
    score += observerShape.hasPastTimeSignal ? 0.10 : 0;
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

  scoreAmbiguityWithoutContext(messageShape, contextShape) {
    let score = 0;

    score += messageShape.contentDensity < 0.35 ? 0.30 : 0;
    score += messageShape.brevityPressure * 0.25;
    score += contextShape.referenceLoad * 0.25;
    score += contextShape.activeThreadAvailable ? 0.20 : 0;

    return this.clamp01(score);
  },

  scoreDirectAnswerPressure(messageShape, contextShape, observerShape) {
    let score = 0;

    score += observerShape.hasDirectAnswerExpectation ? 0.30 : 0;
    score += observerShape.hasQuestion ? 0.20 : 0;
    score += messageShape.hasEnoughContent ? 0.20 : 0;
    score += messageShape.contentDensity * 0.20;
    score += contextShape.referenceLoad < 0.15 ? 0.10 : 0;

    return this.clamp01(score);
  },

  buildSupportingObservationIds(observations = []) {
    const idsFor = predicate =>
      observations
        .map((observation, index) => ({ observation, index }))
        .filter(item => predicate(item.observation))
        .map(item => item.index);

    return {
      directAnswerPressure: idsFor(o =>
        o.type === "question_mark_count" ||
        o.type === "question_phrase" ||
        o.value === "direct_answer"
      ),

      contextDependency: idsFor(o =>
        o.type === "past_time" ||
        o.type === "current_time" ||
        o.type === "ownership_reference"
      ),

      recallPressure: idsFor(o =>
        o.type === "memory_request_phrase" ||
        o.type === "past_time"
      ),

      revisionPressure: idsFor(o =>
        o.type === "speech_act" && o.value === "feedback"
      ),

      relationshipContinuity: idsFor(o =>
        o.type === "relationship_reference" ||
        o.type === "family_reference" ||
        o.domain === "relationship"
      )
    };
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
        "last", "again"
      ].includes(cleaned);
    }).length;

    return this.clamp01(abstractRefs / words.length);
  },

  measureContinuationLoad(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    let score = 0;

    if (words.length <= 12) score += 0.30;
    if (text.length <= 80) score += 0.20;
    if (this.measureReferenceLoad(text) > 0.12) score += 0.35;
    if (text.trim().endsWith("?")) score += 0.15;

    return this.clamp01(score);
  },

  estimateThreadMatch(text, thread) {
    const activeTopic = String(thread?.activeTopic || thread?.workingContext || "");
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