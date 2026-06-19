// ari/observer-system/ari-observer-routing-evidence.js
// Ari Observer Routing Evidence
// Purpose: Convert Observer evidence into routing pressures for the Lane Splitter.
// V1.2.0 — Better follow-up discrimination / new-topic protection / no lane authority

window.Ari = window.Ari || {};

window.Ari.observerRoutingEvidence = {
  version: "1.2.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const observer = input.observer || summary.observer || summary.observerEvidence || {};

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
    const contextShape = this.measureContextShape(text, recentMessages, thread);
    const topicShape = this.measureTopicShape(text);
    const followUpShape = this.measureFollowUpShape(text, recentMessages, summary, topicShape);
    const memoryShape = this.measureMemoryShape(summary, memory, observerShape);
    const revisionShape = this.measureRevisionShape(summary, observerShape);
    const relationshipShape = this.measureRelationshipShape(summary, relationship, observerShape);

    const pressures = {
      standaloneCompleteness: this.scoreStandaloneCompleteness(messageShape, contextShape, observerShape, topicShape),
      contextDependency: this.scoreContextDependency(messageShape, contextShape, observerShape, topicShape),
      followUpPressure: this.scoreFollowUpPressure(followUpShape, contextShape, topicShape),
      recallPressure: this.scoreRecallPressure(memoryShape, contextShape, observerShape),
      revisionPressure: this.scoreRevisionPressure(revisionShape, contextShape, observerShape),
      relationshipContinuity: this.scoreRelationshipContinuity(relationshipShape, contextShape, observerShape),
      ambiguityWithoutContext: this.scoreAmbiguityWithoutContext(messageShape, contextShape, topicShape),
      activeThreadMatch: contextShape.activeThreadMatch,
      directAnswerPressure: this.scoreDirectAnswerPressure(messageShape, contextShape, observerShape, topicShape)
    };

    return {
      engine: "ari-observer-routing-evidence",
      version: this.version,
      source: "ari-observer-routing-evidence",

      ...pressures,
      routingPressures: pressures,

      routingGuards: {
        hasConcreteNewTopic: topicShape.hasConcreteNewTopic,
        shouldNotForceFollowUp: topicShape.hasConcreteNewTopic && !followUpShape.hasStrongFollowUpSignal,
        followUpStrength: followUpShape.followUpStrength,
        followUpReason: followUpShape.reason
      },

      supportingEvidence: {
        messageShape,
        observerShape,
        contextShape,
        topicShape,
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

  measureTopicShape(text = "") {
    const hasWeightTopic =
      /\b\d+\s?(lbs?|pounds?|kg)\b/.test(text) ||
      /\b(weight|calories|diet|fat|lose weight|gain weight|cut|bulk|protein|meal|workout|exercise)\b/.test(text);

    const hasBuilderTopic =
      /\b(code|file|bug|error|github|engine|function|pipeline|javascript)\b/.test(text);

    const hasMedicalTopic =
      /\b(sunburn|pain|fever|diarrhea|cough|pregnant|symptom|blister|bleeding)\b/.test(text);

    const hasLifeTopic =
      /\b(job|career|money|school|boss|relationship|father|mother|baby|wife|fiance|girlfriend)\b/.test(text);

    return {
      hasWeightTopic,
      hasBuilderTopic,
      hasMedicalTopic,
      hasLifeTopic,
      hasConcreteNewTopic: hasWeightTopic || hasBuilderTopic || hasMedicalTopic || hasLifeTopic
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

  measureContextShape(text = "", recentMessages = [], thread = {}) {
    const activeThreadAvailable =
      recentMessages.length > 0 ||
      !!thread?.activeTopic ||
      !!thread?.workingContext ||
      !!thread?.semanticState;

    return {
      activeThreadAvailable,
      recentMessageCount: recentMessages.length,
      referenceLoad: this.measureReferenceLoad(text),
      continuationLoad: this.measureContinuationLoad(text),
      activeThreadMatch: activeThreadAvailable ? this.estimateThreadMatch(text, thread) : 0
    };
  },

  measureFollowUpShape(text = "", recentMessages = [], summary = {}, topicShape = {}) {
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/).filter(Boolean);
    const hasThread = recentMessages.length > 0 || !!summary.threadState;

    const strongBareFollowUp =
      /^(why|how|really|then what|what else|what about that|what about this)\??$/.test(normalized);

    const pronounReference =
      /\b(it|this|that|they|them|same)\b/.test(normalized);

    const startsAsFollowUp =
      /^(why|what if|then what|after that|what about|and if|but|so|ok|okay)\b/.test(normalized);

    const shortQuestion =
      normalized.endsWith("?") && words.length <= 8;

    const concreteQuestion =
      topicShape.hasConcreteNewTopic && words.length >= 5;

    const hasStrongFollowUpSignal =
      strongBareFollowUp ||
      pronounReference ||
      (startsAsFollowUp && !concreteQuestion);

    const followUpSignal =
      hasThread && hasStrongFollowUpSignal ? 1 : 0;

    return {
      hasThread,
      strongBareFollowUp,
      pronounReference,
      startsAsFollowUp,
      shortQuestion,
      concreteQuestion,
      hasStrongFollowUpSignal,
      followUpSignal,
      followUpStrength: followUpSignal ? "strong" : concreteQuestion ? "blocked_by_new_topic" : "weak",
      reason: followUpSignal
        ? "Strong follow-up wording with available thread."
        : concreteQuestion
          ? "Concrete new topic present; do not force continuity."
          : "Weak or no follow-up signal."
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

  scoreStandaloneCompleteness(messageShape, contextShape, observerShape, topicShape) {
    let score = 0;

    score += messageShape.hasEnoughContent ? 0.30 : 0;
    score += messageShape.contentDensity * 0.30;
    score += observerShape.hasQuestion ? 0.15 : 0;
    score += observerShape.hasDirectAnswerExpectation ? 0.15 : 0;
    score += contextShape.referenceLoad < 0.15 ? 0.10 : 0;
    score += topicShape.hasConcreteNewTopic ? 0.20 : 0;

    return this.clamp01(score);
  },

  scoreContextDependency(messageShape, contextShape, observerShape, topicShape) {
    let score = 0;

    score += contextShape.activeThreadAvailable ? 0.10 : 0;
    score += contextShape.referenceLoad * 0.35;
    score += contextShape.continuationLoad * 0.20;
    score += messageShape.brevityPressure * 0.10;
    score += contextShape.activeThreadMatch * 0.10;

    if (topicShape.hasConcreteNewTopic) score -= 0.25;

    return this.clamp01(score);
  },

  scoreFollowUpPressure(followUpShape = {}, contextShape = {}, topicShape = {}) {
    let score = 0;

    score += followUpShape.followUpSignal ? 0.65 : 0;
    score += followUpShape.strongBareFollowUp ? 0.20 : 0;
    score += followUpShape.pronounReference ? 0.15 : 0;
    score += contextShape.activeThreadAvailable ? 0.10 : 0;

    if (topicShape.hasConcreteNewTopic && !followUpShape.hasStrongFollowUpSignal) {
      score -= 0.55;
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

  scoreAmbiguityWithoutContext(messageShape, contextShape, topicShape) {
    let score = 0;

    score += messageShape.contentDensity < 0.35 ? 0.25 : 0;
    score += messageShape.brevityPressure * 0.20;
    score += contextShape.referenceLoad * 0.25;
    score += contextShape.activeThreadAvailable ? 0.15 : 0;

    if (topicShape.hasConcreteNewTopic) score -= 0.35;

    return this.clamp01(score);
  },

  scoreDirectAnswerPressure(messageShape, contextShape, observerShape, topicShape) {
    let score = 0;

    score += observerShape.hasDirectAnswerExpectation ? 0.25 : 0;
    score += observerShape.hasStepByStepExpectation ? 0.25 : 0;
    score += observerShape.hasQuestion ? 0.20 : 0;
    score += messageShape.hasEnoughContent ? 0.15 : 0;
    score += messageShape.contentDensity * 0.15;
    score += topicShape.hasConcreteNewTopic ? 0.20 : 0;

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
        "last", "again"
      ].includes(cleaned);
    }).length;

    return this.clamp01(abstractRefs / words.length);
  },

  measureContinuationLoad(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;

    let score = 0;

    if (words.length <= 8) score += 0.25;
    if (text.length <= 60) score += 0.15;
    if (this.measureReferenceLoad(text) > 0.12) score += 0.35;
    if (/^(why|what about|then what|what if|really)\b/.test(text)) score += 0.25;

    return this.clamp01(score);
  },

  estimateThreadMatch(text, thread) {
    const activeTopic = String(
      thread?.activeTopic ||
      thread?.workingContext?.followUpAnchor ||
      thread?.workingContext?.activeClaim ||
      thread?.semanticState?.followUpAnchor ||
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