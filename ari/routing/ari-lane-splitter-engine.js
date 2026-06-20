// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// V2.1.0 — Continuity Intent Lock / Action Follow-Up Fix

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "2.1.0",

  split(input = {}) {
    const summary = input.summary || input || {};
    const evidence = input.routingEvidence || summary.routingEvidence || {};
    const pressures = evidence.routingPressures || evidence;
    const semantic = this.readSemantic(summary, input);
    const context = this.readContext(summary, semantic);

    const scores = this.scoreLanes(pressures, context);
    const ranked = this.rankScores(scores);
    const lane = this.chooseLane(ranked, context);

    return {
      engine: "ari-lane-splitter-engine",
      version: this.version,
      source: "ari-lane-splitter-engine",
      lane,

      routing: {
        useCurrentTurn: true,
        useThread: this.shouldUseThread(lane),
        useMemory: this.shouldUseMemory(lane),
        useRelationship: this.shouldUseRelationship(lane),
        goStraightToSituationMap: lane === "direct_current_turn"
      },

      scores,
      ranked,
      confidence: this.confidence(ranked, context),
      explanation: this.explain(lane, context),

      semanticAware: semantic.available,
      semanticFirst: true,
      lexicalFallbackUsed: context.lexicalFallbackUsed,

      semanticFrameUsed: Boolean(semantic.primaryFrame?.frameType),
      semanticFrameType: semantic.primaryFrame?.frameType || null,
      semanticIntent: semantic.primaryFrame?.intent || semantic.semanticSummary?.intent || null,
      semanticContinuity: semantic.continuity,
      semanticResponseCharacteristics: semantic.response,
      semanticAmbiguity: semantic.ambiguity,

      contextUsed: context,
      evidenceUsed: pressures,

      authority: {
        canObserve: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canChooseLane: true,
        role: "route_selection_only"
      }
    };
  },

  readSemantic(summary = {}, input = {}) {
    const semanticFrameOutput =
      input.semanticFrame ||
      summary.semanticFrameOutput ||
      summary.semanticFrame ||
      {};

    const primaryFrame =
      input.primarySemanticFrame ||
      summary.primarySemanticFrame ||
      semanticFrameOutput.primaryFrame ||
      summary.activeSemanticFrame ||
      {};

    const semanticSummary =
      input.semanticSummary ||
      summary.semanticSummary ||
      semanticFrameOutput.semanticSummary ||
      {};

    return {
      semanticFrameOutput,
      primaryFrame,
      semanticSummary,
      continuity:
        summary.semanticContinuity ||
        semanticFrameOutput.continuity ||
        semanticSummary.continuity ||
        {},
      response:
        summary.semanticResponseCharacteristics ||
        semanticFrameOutput.responseCharacteristics ||
        semanticSummary.responseCharacteristics ||
        {},
      ambiguity:
        summary.semanticAmbiguity ||
        semanticFrameOutput.ambiguity ||
        semanticSummary.ambiguity ||
        {},
      available: Boolean(
        semanticFrameOutput.semanticFrameBuilderRan ||
        primaryFrame.frameType ||
        semanticSummary.primaryMeaning
      )
    };
  },

  readContext(summary = {}, semantic = {}) {
    const text = String(summary.userMessage || summary.message || summary.input || "")
      .toLowerCase()
      .trim();

    const threadState = summary.threadState || {};
    const recentMessages = summary.recentMessages || threadState.lastMessages || [];

    const hasThread = Boolean(
      summary.threadStateLoaded &&
      (
        recentMessages.length > 0 ||
        threadState.currentTopic ||
        threadState.activeSubject ||
        threadState.continuitySummary ||
        summary.workingContext
      )
    );

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const explicitReferenceLanguage = this.hasReferenceLanguage(text);
    const actionFollowUp = this.isActionFollowUp(text);
    const recommendationFollowUp = this.isRecommendationFollowUp(text);
    const critiqueFollowUp = this.isCritiqueFollowUp(text);

    const semanticContinuation =
      semantic.continuity?.isContinuation === true;

    const expectsFollowUpContext =
      semantic.response?.expectsFollowUpContext === true ||
      semanticContinuation;

    const referencesPriorContext =
      semantic.continuity?.referencesPriorContext === true;

    const expectsDirectAnswer =
      semantic.response?.expectsDirectAnswer === true;

    const ambiguityPresent =
      semantic.ambiguity?.present === true;

    const semanticAvailable = semantic.available === true;
    const lexicalFallback = semanticAvailable
      ? this.emptyLexicalFallback()
      : this.lexicalFallback(text);

    const mustUseThread =
      hasThread &&
      (
        explicitReferenceLanguage ||
        actionFollowUp ||
        recommendationFollowUp ||
        critiqueFollowUp ||
        semanticContinuation ||
        expectsFollowUpContext ||
        referencesPriorContext
      );

    return {
      text,
      wordCount,
      hasThread,

      semanticAvailable,
      lexicalFallbackUsed: !semanticAvailable,
      lexicalFallback,

      explicitReferenceLanguage,
      actionFollowUp,
      recommendationFollowUp,
      critiqueFollowUp,

      semanticContinuation,
      expectsFollowUpContext,
      referencesPriorContext,
      expectsDirectAnswer,
      ambiguityPresent,

      mustUseThread
    };
  },

  scoreLanes(p = {}, context = {}) {
    let direct =
      (p.standaloneCompleteness || 0) * 30 +
      (p.directAnswerPressure || 0) * 25 +
      (1 - (p.contextDependency || 0)) * 15;

    let continuity =
      (p.contextDependency || 0) * 25 +
      (p.followUpPressure || 0) * 25 +
      (p.activeThreadMatch || 0) * 20 +
      (p.ambiguityWithoutContext || 0) * 15;

    if (context.expectsDirectAnswer && !context.mustUseThread) direct += 35;

    if (context.hasThread && context.explicitReferenceLanguage) continuity += 45;
    if (context.hasThread && context.actionFollowUp) continuity += 45;
    if (context.hasThread && context.recommendationFollowUp) continuity += 45;
    if (context.hasThread && context.critiqueFollowUp) continuity += 45;
    if (context.semanticContinuation) continuity += 40;
    if (context.expectsFollowUpContext) continuity += 35;
    if (context.referencesPriorContext) continuity += 30;
    if (context.ambiguityPresent) continuity += 25;

    if (context.mustUseThread) {
      direct -= 35;
      continuity += 35;
    }

    return {
      direct_current_turn: this.cap(direct),
      continuity_follow_up: this.cap(continuity),
      recall_or_memory_request: this.cap((p.recallPressure || 0) * 90),
      correction_or_revision: this.cap((p.revisionPressure || 0) * 90),
      relationship_continuity: this.cap((p.relationshipContinuity || 0) * 90)
    };
  },

  chooseLane(ranked = [], context = {}) {
    if (context.mustUseThread) return "continuity_follow_up";

    if (!context.semanticAvailable && context.lexicalFallback.needsThread) {
      return "continuity_follow_up";
    }

    return ranked[0]?.lane || "direct_current_turn";
  },

  hasReferenceLanguage(text = "") {
    return /\b(it|this|that|they|them|their|those|these|same|one|ones|him|her|he|she|his|hers|there|that guy|that person)\b/.test(text);
  },

  isActionFollowUp(text = "") {
    return /\b(what should i do|what would you recommend|recommend me do|recommend i do|what can i do|what do i do|next step|what now|now what)\b/.test(text);
  },

  isRecommendationFollowUp(text = "") {
    return /\b(recommend|suggest|advice|what would you do)\b/.test(text);
  },

  isCritiqueFollowUp(text = "") {
    return /\b(criticize|critique|criticism|what would you say about him|what do you think about him)\b/.test(text);
  },

  lexicalFallback(text = "") {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasReferenceLanguage = this.hasReferenceLanguage(text);
    const actionFollowUp = this.isActionFollowUp(text);

    return {
      used: true,
      needsThread: (hasReferenceLanguage || actionFollowUp) && wordCount <= 14,
      hasReferenceLanguage,
      looksLikeQuestion: text.includes("?"),
      hasEnoughContent: wordCount >= 6
    };
  },

  emptyLexicalFallback() {
    return {
      used: false,
      needsThread: false,
      hasReferenceLanguage: false,
      looksLikeQuestion: false,
      hasEnoughContent: false
    };
  },

  shouldUseThread(lane) {
    return [
      "continuity_follow_up",
      "correction_or_revision",
      "relationship_continuity"
    ].includes(lane);
  },

  shouldUseMemory(lane) {
    return [
      "recall_or_memory_request",
      "relationship_continuity"
    ].includes(lane);
  },

  shouldUseRelationship(lane) {
    return lane === "relationship_continuity";
  },

  confidence(ranked = [], context = {}) {
    if (context.mustUseThread) return "high";

    const top = ranked[0]?.score || 0;
    const second = ranked[1]?.score || 0;
    const gap = top - second;

    if (gap >= 25) return "high";
    if (gap >= 10) return "medium";
    return "low";
  },

  explain(lane, context = {}) {
    if (lane === "continuity_follow_up" && context.actionFollowUp) {
      return "Action/recommendation follow-up requires the prior situation.";
    }

    if (lane === "continuity_follow_up" && context.explicitReferenceLanguage) {
      return "Reference language requires prior thread context.";
    }

    if (lane === "continuity_follow_up") {
      return "Current turn depends on active thread context.";
    }

    return "Current turn is complete enough to answer directly.";
  },

  rankScores(scores = {}) {
    return Object.entries(scores)
      .map(([lane, score]) => ({ lane, score }))
      .sort((a, b) => b.score - a.score);
  },

  cap(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }
};

console.log(
  "ARI LANE SPLITTER ENGINE LOADED:",
  window.Ari.laneSplitterEngine?.version
);