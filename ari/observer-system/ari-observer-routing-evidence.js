// ari/observer-system/ari-observer-routing-evidence.js
// Ari Observer Routing Evidence
// Purpose: Convert Observer evidence into routing pressures for the Lane Splitter.
// V1.3.0 — Universal semantic frame evidence / follow-up discrimination / no lane authority

window.Ari = window.Ari || {};

window.Ari.observerRoutingEvidence = {
  version: "1.3.0",

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
    const semanticFrame = this.measureSemanticFrame(text, observerShape);
    const followUpShape = this.measureFollowUpShape(
      text,
      recentMessages,
      summary,
      semanticFrame
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
        semanticFrame
      ),

      contextDependency: this.scoreContextDependency(
        messageShape,
        contextShape,
        observerShape,
        semanticFrame,
        followUpShape
      ),

      followUpPressure: this.scoreFollowUpPressure(
        followUpShape,
        contextShape,
        semanticFrame
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
        semanticFrame,
        followUpShape
      ),

      activeThreadMatch: contextShape.activeThreadMatch,

      directAnswerPressure: this.scoreDirectAnswerPressure(
        messageShape,
        contextShape,
        observerShape,
        semanticFrame
      )
    };

    return {
      engine: "ari-observer-routing-evidence",
      version: this.version,
      source: "ari-observer-routing-evidence",

      ...pressures,
      routingPressures: pressures,

      routingGuards: {
        hasStandaloneFrame: semanticFrame.hasStandaloneFrame,
        hasNewFrame: semanticFrame.hasNewFrame,
        needsPriorFrame: semanticFrame.needsPriorFrame,
        missingFrameParts: semanticFrame.missingFrameParts,
        shouldNotForceFollowUp:
          semanticFrame.hasStandaloneFrame && !followUpShape.hasStrongFollowUpSignal,
        followUpStrength: followUpShape.followUpStrength,
        followUpReason: followUpShape.reason
      },

      supportingEvidence: {
        messageShape,
        observerShape,
        contextShape,
        semanticFrame,
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

  measureSemanticFrame(text = "", observerShape = {}) {
    const words = text.split(/\s+/).filter(Boolean);

    const operation = this.detectOperation(text, observerShape);
    const objectSignal = this.detectObjectSignal(text);
    const criteriaSignal = this.detectCriteriaSignal(text);
    const targetSignal = this.detectTargetSignal(text);
    const contextSignal = this.detectContextSignal(text);

    const hasOperation = operation !== "none";
    const hasObject = objectSignal.score >= 0.45;
    const hasCriteria = criteriaSignal.score >= 0.35;
    const hasTarget = targetSignal.score >= 0.35;
    const hasContext = contextSignal.score >= 0.35;

    const hasDeicticReference = this.hasDeicticReference(text);
    const hasComparativeReference = this.hasComparativeReference(text);
    const hasPersonalizedReference = this.hasPersonalizedReference(text);

    const missingFrameParts = [];

    if (hasOperation && !hasObject) {
      missingFrameParts.push("object");
    }

    if (
      ["recommendation", "comparison", "decision"].includes(operation) &&
      !hasCriteria &&
      !hasObject
    ) {
      missingFrameParts.push("criteria_or_options");
    }

    if (hasPersonalizedReference && !hasContext && !hasObject) {
      missingFrameParts.push("personal_context");
    }

    const frameCompleteness =
      (hasOperation ? 0.25 : 0) +
      (hasObject ? 0.35 : 0) +
      (hasCriteria ? 0.15 : 0) +
      (hasTarget ? 0.10 : 0) +
      (hasContext ? 0.15 : 0);

    const hasStandaloneFrame =
      frameCompleteness >= 0.55 &&
      hasObject &&
      !(
        hasDeicticReference &&
        !hasObject
      );

    const needsPriorFrame =
      (
        hasDeicticReference ||
        hasComparativeReference ||
        hasPersonalizedReference ||
        missingFrameParts.length > 0
      ) &&
      !hasStandaloneFrame;

    const hasNewFrame =
      hasStandaloneFrame ||
      (
        objectSignal.score >= 0.65 &&
        words.length >= 6 &&
        !needsPriorFrame
      );

    return {
      operation,
      hasOperation,
      hasObject,
      hasCriteria,
      hasTarget,
      hasContext,

      objectSignal,
      criteriaSignal,
      targetSignal,
      contextSignal,

      hasDeicticReference,
      hasComparativeReference,
      hasPersonalizedReference,

      missingFrameParts,
      frameCompleteness: this.clamp01(frameCompleteness),

      hasStandaloneFrame,
      hasNewFrame,
      needsPriorFrame,

      source: "ari-observer-routing-evidence"
    };
  },

  detectOperation(text = "", observerShape = {}) {
    if (observerShape.hasStepByStepExpectation) return "planning";
    if (observerShape.hasCodeOutputExpectation) return "repair_or_build";

    if (/\b(recommend|suggest|pick|choose|prefer|best option|what would you do)\b/.test(text)) {
      return "recommendation";
    }

    if (/\b(plan|steps|strategy|approach|roadmap|schedule|routine)\b/.test(text)) {
      return "planning";
    }

    if (/\b(compare|difference|better|worse|versus|vs|which)\b/.test(text)) {
      return "comparison";
    }

    if (/\b(fix|debug|repair|solve|update|rewrite|replace|build|create|make)\b/.test(text)) {
      return "repair_or_build";
    }

    if (/\b(why|explain|how come|what does|break down|teach)\b/.test(text)) {
      return "explanation";
    }

    if (/\b(should i|can i|do i|is it okay|would it be okay)\b/.test(text)) {
      return "decision";
    }

    if (observerShape.hasQuestion) return "question";

    return "none";
  },

  detectObjectSignal(text = "") {
    const words = text.split(/\s+/).filter(Boolean);

    const hasNumber = /\d/.test(text);
    const hasQuotedText = /["“”']/.test(text);
    const hasSpecificNounPhrase =
      /\b(my|the|this|that|these|those|a|an)\s+\w{4,}/.test(text);

    const concreteWords = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");
      if (!cleaned) return false;

      const weak = [
        "what", "when", "where", "why", "how", "should", "could", "would",
        "recommend", "suggest", "choose", "which", "best", "better",
        "plan", "strategy", "thing", "stuff", "something", "anything",
        "me", "my", "you", "your", "for", "about", "this", "that",
        "these", "those", "same", "one"
      ];

      return cleaned.length >= 6 && !weak.includes(cleaned);
    }).length;

    const score =
      (hasNumber ? 0.35 : 0) +
      (hasQuotedText ? 0.30 : 0) +
      (hasSpecificNounPhrase ? 0.25 : 0) +
      Math.min(0.45, concreteWords * 0.15);

    return {
      score: this.clamp01(score),
      hasNumber,
      hasQuotedText,
      hasSpecificNounPhrase,
      concreteWords
    };
  },

  detectCriteriaSignal(text = "") {
    const comparative =
      /\b(best|better|worse|healthiest|safest|cheapest|fastest|easiest|most|least|ideal|worth|important)\b/.test(text);

    const constraint =
      /\b(budget|time|deadline|cost|risk|safe|healthy|easy|hard|urgent|long term|short term)\b/.test(text);

    const preference =
      /\b(i want|i need|i prefer|my goal|goal is|trying to|looking for)\b/.test(text);

    const score =
      (comparative ? 0.35 : 0) +
      (constraint ? 0.30 : 0) +
      (preference ? 0.35 : 0);

    return {
      score: this.clamp01(score),
      comparative,
      constraint,
      preference
    };
  },

  detectTargetSignal(text = "") {
    const selfTarget = /\b(i|me|my|mine|myself|for me)\b/.test(text);
    const otherTarget = /\b(he|she|they|my dad|my father|my mom|my wife|my fiance|my girlfriend|my kid|my child)\b/.test(text);
    const objectTarget = /\b(for this|for that|about this|about that|in this case)\b/.test(text);

    const score =
      (selfTarget ? 0.25 : 0) +
      (otherTarget ? 0.30 : 0) +
      (objectTarget ? 0.35 : 0);

    return {
      score: this.clamp01(score),
      selfTarget,
      otherTarget,
      objectTarget
    };
  },

  detectContextSignal(text = "") {
    const timeContext =
      /\b(today|tomorrow|tonight|yesterday|now|later|recently|currently|before|after|again)\b/.test(text);

    const situationContext =
      /\b(because|since|while|during|after|before|when|if|unless|with|without)\b/.test(text);

    const personalContext =
      /\b(my situation|my case|for me|given that|based on)\b/.test(text);

    const score =
      (timeContext ? 0.25 : 0) +
      (situationContext ? 0.30 : 0) +
      (personalContext ? 0.35 : 0);

    return {
      score: this.clamp01(score),
      timeContext,
      situationContext,
      personalContext
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

  measureFollowUpShape(text = "", recentMessages = [], summary = {}, semanticFrame = {}) {
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/).filter(Boolean);
    const hasThread = recentMessages.length > 0 || !!summary.threadState;

    const strongBareFollowUp =
      /^(why|how|really|then what|what else|what about that|what about this|and then)\??$/.test(normalized);

    const startsAsFollowUp =
      /^(why|what if|then what|after that|what about|and if|but|so|ok|okay|also|still)\b/.test(normalized);

    const hasReference =
      this.hasDeicticReference(normalized) ||
      this.hasComparativeReference(normalized) ||
      this.hasPersonalizedReference(normalized);

    const shortQuestion =
      normalized.endsWith("?") && words.length <= 8;

    const hasStrongFollowUpSignal =
      strongBareFollowUp ||
      semanticFrame.needsPriorFrame ||
      (startsAsFollowUp && !semanticFrame.hasStandaloneFrame) ||
      (hasReference && !semanticFrame.hasStandaloneFrame);

    const followUpSignal =
      hasThread && hasStrongFollowUpSignal ? 1 : 0;

    return {
      hasThread,
      strongBareFollowUp,
      startsAsFollowUp,
      hasReference,
      shortQuestion,

      hasStrongFollowUpSignal,
      followUpSignal,

      followUpStrength: followUpSignal
        ? "strong"
        : semanticFrame.hasStandaloneFrame
          ? "blocked_by_standalone_frame"
          : "weak",

      reason: followUpSignal
        ? "Current message depends on a missing prior frame."
        : semanticFrame.hasStandaloneFrame
          ? "Current message has enough standalone frame information."
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

  scoreStandaloneCompleteness(messageShape, contextShape, observerShape, semanticFrame) {
    let score = 0;

    score += messageShape.hasEnoughContent ? 0.25 : 0;
    score += messageShape.contentDensity * 0.25;
    score += observerShape.hasQuestion ? 0.10 : 0;
    score += observerShape.hasDirectAnswerExpectation ? 0.10 : 0;
    score += semanticFrame.frameCompleteness * 0.35;
    score += semanticFrame.hasStandaloneFrame ? 0.20 : 0;

    return this.clamp01(score);
  },

  scoreContextDependency(messageShape, contextShape, observerShape, semanticFrame, followUpShape) {
    let score = 0;

    score += contextShape.activeThreadAvailable ? 0.10 : 0;
    score += contextShape.referenceLoad * 0.25;
    score += contextShape.continuationLoad * 0.20;
    score += messageShape.brevityPressure * 0.10;
    score += contextShape.activeThreadMatch * 0.10;
    score += semanticFrame.needsPriorFrame ? 0.35 : 0;
    score += followUpShape.hasStrongFollowUpSignal ? 0.20 : 0;

    if (semanticFrame.hasStandaloneFrame) score -= 0.35;
    if (semanticFrame.hasNewFrame) score -= 0.20;

    return this.clamp01(score);
  },

  scoreFollowUpPressure(followUpShape = {}, contextShape = {}, semanticFrame = {}) {
    let score = 0;

    score += followUpShape.followUpSignal ? 0.65 : 0;
    score += followUpShape.strongBareFollowUp ? 0.15 : 0;
    score += followUpShape.hasReference ? 0.15 : 0;
    score += semanticFrame.needsPriorFrame ? 0.30 : 0;
    score += contextShape.activeThreadAvailable ? 0.10 : 0;

    if (semanticFrame.hasStandaloneFrame && !followUpShape.strongBareFollowUp) {
      score -= 0.50;
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

  scoreAmbiguityWithoutContext(messageShape, contextShape, semanticFrame, followUpShape) {
    let score = 0;

    score += messageShape.contentDensity < 0.35 ? 0.20 : 0;
    score += messageShape.brevityPressure * 0.15;
    score += contextShape.referenceLoad * 0.20;
    score += contextShape.activeThreadAvailable ? 0.10 : 0;
    score += semanticFrame.needsPriorFrame ? 0.35 : 0;
    score += followUpShape.hasStrongFollowUpSignal ? 0.15 : 0;

    if (semanticFrame.hasStandaloneFrame) score -= 0.35;

    return this.clamp01(score);
  },

  scoreDirectAnswerPressure(messageShape, contextShape, observerShape, semanticFrame) {
    let score = 0;

    score += observerShape.hasDirectAnswerExpectation ? 0.20 : 0;
    score += observerShape.hasStepByStepExpectation ? 0.20 : 0;
    score += observerShape.hasQuestion ? 0.15 : 0;
    score += messageShape.hasEnoughContent ? 0.15 : 0;
    score += messageShape.contentDensity * 0.15;
    score += semanticFrame.hasStandaloneFrame ? 0.25 : 0;
    score += semanticFrame.hasNewFrame ? 0.15 : 0;

    if (semanticFrame.needsPriorFrame) score -= 0.30;

    return this.clamp01(score);
  },

  hasDeicticReference(text = "") {
    return /\b(it|this|that|these|those|they|them|same|same thing|one|ones|there|here)\b/.test(text);
  },

  hasComparativeReference(text = "") {
    return /\b(which|which one|better|best|worse|most|least|healthiest|safest|cheapest|strongest|weakest)\b/.test(text);
  },

  hasPersonalizedReference(text = "") {
    return /\b(for me|my situation|my case|in my case|given my|based on my|what do you recommend)\b/.test(text);
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
    if (/^(why|what about|then what|what if|really|but|so|also|still)\b/.test(text)) {
      score += 0.25;
    }

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