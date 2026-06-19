// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.9.0 — Semantic-First Routing / Lexical Fallback Only

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.9.0",

  split(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      input.routingEvidence ||
      summary.routingEvidence ||
      summary.observer?.routingEvidence ||
      this.emptyEvidence();

    const pressures = evidence.routingPressures || evidence;
    const semantic = this.readSemantic(summary, input);
    const context = this.readContext(summary, semantic);

    const scores = this.scoreLanes(pressures, context, semantic);
    const ranked = this.rankScores(scores);
    const lane = this.chooseLane(ranked, pressures, context, semantic);

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
      confidence: this.confidence(ranked, context, semantic),
      explanation: this.explain(lane, context, semantic),

      semanticAware: semantic.available,
      semanticFirst: true,
      lexicalFallbackUsed: context.lexicalFallbackUsed,

      semanticFrameUsed: Boolean(semantic.primaryFrame?.frameType),
      semanticFrameType: semantic.primaryFrame?.frameType || null,
      semanticIntent: semantic.primaryFrame?.intent || null,
      semanticContinuity: semantic.continuity,
      semanticResponseCharacteristics: semantic.response,
      semanticAmbiguity: semantic.ambiguity,

      evidenceUsed: pressures,
      contextUsed: context,

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

    const continuity =
      summary.semanticContinuity ||
      semanticFrameOutput.continuity ||
      semanticSummary.continuity ||
      {};

    const response =
      summary.semanticResponseCharacteristics ||
      semanticFrameOutput.responseCharacteristics ||
      semanticSummary.responseCharacteristics ||
      {};

    const ambiguity =
      summary.semanticAmbiguity ||
      semanticFrameOutput.ambiguity ||
      semanticSummary.ambiguity ||
      {};

    const emotionalOverlay =
      summary.semanticEmotionalOverlay ||
      semanticFrameOutput.emotionalOverlay ||
      semanticSummary.emotionalOverlay ||
      {};

    return {
      semanticFrameOutput,
      primaryFrame,
      semanticSummary,
      continuity,
      response,
      ambiguity,
      emotionalOverlay,
      available: Boolean(
        semanticFrameOutput.semanticFrameBuilderRan ||
        primaryFrame.frameType ||
        semanticSummary.primaryMeaning
      )
    };
  },

  readContext(summary = {}, semantic = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase().trim();

    const threadState = summary.threadState || {};
    const recentMessages =
      summary.recentMessages ||
      threadState.lastMessages ||
      [];

    const hasThread =
      Boolean(summary.threadStateLoaded) &&
      (
        recentMessages.length > 0 ||
        Boolean(threadState.currentTopic) ||
        Boolean(threadState.continuitySummary) ||
        Boolean(summary.workingContext)
      );

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const frameType =
      semantic.primaryFrame?.frameType ||
      semantic.semanticSummary?.primaryMeaning ||
      "unknown";

    const intent =
      semantic.primaryFrame?.intent ||
      semantic.semanticSummary?.intent ||
      "unknown";

    const expectsDirectAnswer =
      semantic.response?.expectsDirectAnswer === true;

    const expectsExplanation =
      semantic.response?.expectsExplanation === true;

    const expectsCollaboration =
      semantic.response?.expectsCollaboration === true;

    const expectsCodeOrArtifact =
      semantic.response?.expectsCodeOrArtifact === true;

    const expectsFollowUpContext =
      semantic.response?.expectsFollowUpContext === true ||
      semantic.continuity?.isContinuation === true;

    const likelyWantsMinimalAnswer =
      semantic.response?.likelyWantsMinimalAnswer === true;

    const semanticContinuation =
      semantic.continuity?.isContinuation === true;

    const referencesPriorContext =
      semantic.continuity?.referencesPriorContext === true;

    const referencesPriorArtifact =
      semantic.continuity?.referencesPriorArtifact === true;

    const ambiguityPresent =
      semantic.ambiguity?.present === true;

    const semanticAvailable = semantic.available === true;

    const lexicalFallback = semanticAvailable
      ? this.emptyLexicalFallback()
      : this.lexicalFallback(text);

    const lexicalFallbackUsed = !semanticAvailable;

    const standaloneMeaningScore = this.scoreStandaloneMeaning({
      semanticAvailable,
      wordCount,
      frameType,
      intent,
      expectsDirectAnswer,
      expectsExplanation,
      expectsCollaboration,
      expectsCodeOrArtifact,
      semanticContinuation,
      ambiguityPresent,
      lexicalFallback
    });

    const semanticDependencyScore = this.scoreSemanticDependency({
      semanticAvailable,
      hasThread,
      wordCount,
      semanticContinuation,
      expectsFollowUpContext,
      referencesPriorContext,
      referencesPriorArtifact,
      ambiguityPresent,
      frameType,
      lexicalFallback
    });

    return {
      text,
      wordCount,
      hasThread,

      frameType,
      intent,

      expectsDirectAnswer,
      expectsExplanation,
      expectsCollaboration,
      expectsCodeOrArtifact,
      expectsFollowUpContext,
      likelyWantsMinimalAnswer,

      semanticContinuation,
      referencesPriorContext,
      referencesPriorArtifact,
      ambiguityPresent,

      semanticAvailable,
      lexicalFallbackUsed,
      lexicalFallback,

      standaloneMeaningScore,
      semanticDependencyScore
    };
  },

  scoreLanes(p = {}, context = {}, semantic = {}) {
    const directBase =
      (p.standaloneCompleteness || 0) * 30 +
      (p.directAnswerPressure || 0) * 25 +
      (1 - (p.contextDependency || 0)) * 15 +
      (1 - (p.ambiguityWithoutContext || 0)) * 10;

    const continuityBase =
      (p.contextDependency || 0) * 25 +
      (p.followUpPressure || 0) * 25 +
      (p.activeThreadMatch || 0) * 20 +
      (p.ambiguityWithoutContext || 0) * 15;

    const recall =
      (p.recallPressure || 0) * 70 +
      (p.contextDependency || 0) * 15 +
      (p.ambiguityWithoutContext || 0) * 15;

    const revision =
      (p.revisionPressure || 0) * 75 +
      (p.contextDependency || 0) * 15 +
      (p.activeThreadMatch || 0) * 10;

    const relationship =
      (p.relationshipContinuity || 0) * 70 +
      (p.contextDependency || 0) * 20 +
      (p.activeThreadMatch || 0) * 10;

    let directBoost = Math.round(context.standaloneMeaningScore * 60);
    let continuityBoost = Math.round(context.semanticDependencyScore * 65);

    if (context.expectsDirectAnswer) directBoost += 35;
    if (context.expectsExplanation) directBoost += 20;

    if (context.semanticContinuation) continuityBoost += 40;
    if (context.expectsFollowUpContext) continuityBoost += 35;
    if (context.referencesPriorContext) continuityBoost += 25;
    if (context.ambiguityPresent) continuityBoost += 25;

    if (context.expectsCodeOrArtifact) {
      directBoost += 12;
      continuityBoost += context.semanticContinuation ? 18 : 8;
    }

    if (context.expectsCollaboration) {
      directBoost += 8;
      continuityBoost += context.hasThread ? 15 : 8;
    }

    if (context.frameType === "continuation") continuityBoost += 35;
    if (context.frameType === "information_seeking") directBoost += 25;
    if (context.frameType === "explanation_request") directBoost += 22;
    if (context.frameType === "instruction_or_command") directBoost += 15;
    if (context.frameType === "collaborative_software_build") {
      directBoost += 10;
      continuityBoost += context.hasThread ? 15 : 0;
    }

    return {
      direct_current_turn: this.cap(directBase + directBoost),
      continuity_follow_up: this.cap(continuityBase + continuityBoost),
      recall_or_memory_request: this.cap(recall),
      correction_or_revision: this.cap(revision),
      relationship_continuity: this.cap(relationship)
    };
  },

  chooseLane(ranked = [], p = {}, context = {}, semantic = {}) {
    const top = ranked[0];
    const second = ranked[1];

    if (
      context.hasThread &&
      context.semanticAvailable &&
      (
        context.semanticContinuation ||
        context.expectsFollowUpContext ||
        context.referencesPriorContext ||
        context.ambiguityPresent
      ) &&
      !context.expectsDirectAnswer
    ) {
      return "continuity_follow_up";
    }

    if (
      context.hasThread &&
      context.expectsCodeOrArtifact &&
      context.semanticContinuation
    ) {
      return "continuity_follow_up";
    }

    if (
      context.expectsDirectAnswer &&
      context.standaloneMeaningScore >= context.semanticDependencyScore
    ) {
      return "direct_current_turn";
    }

    if (
      context.expectsExplanation &&
      !context.semanticContinuation &&
      !context.ambiguityPresent
    ) {
      return "direct_current_turn";
    }

    if (!context.semanticAvailable && context.lexicalFallback.needsThread) {
      return "continuity_follow_up";
    }

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    if (
      top.lane !== "direct_current_turn" &&
      second &&
      top.score - second.score < 8 &&
      context.standaloneMeaningScore >= context.semanticDependencyScore
    ) {
      return "direct_current_turn";
    }

    return top.lane;
  },

  scoreSemanticDependency({
    semanticAvailable = false,
    hasThread = false,
    wordCount = 0,
    semanticContinuation = false,
    expectsFollowUpContext = false,
    referencesPriorContext = false,
    referencesPriorArtifact = false,
    ambiguityPresent = false,
    frameType = "unknown",
    lexicalFallback = {}
  } = {}) {
    if (!hasThread) return 0;

    let score = 0;

    if (semanticAvailable) {
      if (semanticContinuation) score += 0.45;
      if (expectsFollowUpContext) score += 0.35;
      if (referencesPriorContext) score += 0.25;
      if (referencesPriorArtifact) score += 0.15;
      if (ambiguityPresent) score += 0.25;
      if (frameType === "continuation") score += 0.25;
      if (wordCount <= 5 && semanticContinuation) score += 0.15;
    } else {
      if (lexicalFallback.needsThread) score += 0.45;
      if (lexicalFallback.hasReferenceLanguage) score += 0.25;
      if (wordCount <= 5) score += 0.15;
    }

    return this.clamp01(score);
  },

  scoreStandaloneMeaning({
    semanticAvailable = false,
    wordCount = 0,
    frameType = "unknown",
    intent = "unknown",
    expectsDirectAnswer = false,
    expectsExplanation = false,
    expectsCollaboration = false,
    expectsCodeOrArtifact = false,
    semanticContinuation = false,
    ambiguityPresent = false,
    lexicalFallback = {}
  } = {}) {
    let score = 0;

    if (semanticAvailable) {
      if (expectsDirectAnswer) score += 0.45;
      if (expectsExplanation) score += 0.25;
      if (expectsCodeOrArtifact) score += 0.18;
      if (expectsCollaboration) score += 0.14;
      if (frameType && frameType !== "unknown") score += 0.16;
      if (intent && intent !== "unknown") score += 0.12;
      if (wordCount >= 7) score += 0.1;

      if (semanticContinuation) score -= 0.3;
      if (ambiguityPresent) score -= 0.25;
    } else {
      if (lexicalFallback.looksLikeQuestion) score += 0.35;
      if (lexicalFallback.hasEnoughContent) score += 0.25;
      if (wordCount >= 7) score += 0.15;
      if (lexicalFallback.needsThread) score -= 0.3;
    }

    return this.clamp01(score);
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

  lexicalFallback(text = "") {
    const wordCount = String(text || "").split(/\s+/).filter(Boolean).length;

    const hasReferenceLanguage =
      /\b(it|this|that|they|them|same|one|those|these)\b/.test(text) ||
      /^(so|but|also|still|okay|then|next)\b/.test(text);

    const looksLikeQuestion =
      text.includes("?") ||
      /^(what|why|how|when|where|who|which|is|are|do|does|can|should|would|will)\b/.test(text);

    return {
      used: true,
      needsThread: hasReferenceLanguage && wordCount <= 8,
      hasReferenceLanguage,
      looksLikeQuestion,
      hasEnoughContent: wordCount >= 6
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

  rankScores(scores = {}) {
    return Object.entries(scores)
      .map(([lane, score]) => ({ lane, score }))
      .sort((a, b) => b.score - a.score);
  },

  confidence(ranked = [], context = {}, semantic = {}) {
    const top = ranked[0]?.score || 0;
    const second = ranked[1]?.score || 0;
    const gap = top - second;

    if (context.semanticAvailable && gap >= 20) return "high";
    if (context.semanticContinuation || context.expectsDirectAnswer) return "high";
    if (!context.semanticAvailable && context.lexicalFallbackUsed) return "medium";
    if (gap >= 30) return "high";
    if (gap >= 15) return "medium";
    return "low";
  },

  explain(lane, context = {}, semantic = {}) {
    if (context.lexicalFallbackUsed) {
      return "Semantic frame unavailable; Lane Splitter used minimal lexical fallback.";
    }

    if (lane === "continuity_follow_up" && context.semanticContinuation) {
      return "Semantic Frame Builder identified this as a continuation requiring prior thread context.";
    }

    if (lane === "continuity_follow_up" && context.ambiguityPresent) {
      return "Semantic Frame Builder detected ambiguity that likely requires prior context.";
    }

    if (lane === "direct_current_turn" && context.expectsDirectAnswer) {
      return "Semantic Frame Builder indicates the user expects a direct answer.";
    }

    if (lane === "direct_current_turn" && context.expectsExplanation) {
      return "Semantic Frame Builder indicates the user expects an explanation.";
    }

    return {
      direct_current_turn:
        "Current message is semantically complete enough to go directly to Situation Map.",

      continuity_follow_up:
        "Current message semantically depends on active thread context.",

      recall_or_memory_request:
        "Current message asks for stored or prior context.",

      correction_or_revision:
        "Current message revises or corrects prior output.",

      relationship_continuity:
        "Current message depends on ongoing relationship context."
    }[lane] || "Lane selected from semantic frame and routing pressures.";
  },

  emptyEvidence() {
    return {
      standaloneCompleteness: 0.5,
      contextDependency: 0,
      followUpPressure: 0,
      recallPressure: 0,
      revisionPressure: 0,
      relationshipContinuity: 0,
      ambiguityWithoutContext: 0.2,
      activeThreadMatch: 0,
      directAnswerPressure: 0.5
    };
  },

  cap(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  },

  clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }
};

console.log(
  "ARI LANE SPLITTER ENGINE LOADED:",
  window.Ari.laneSplitterEngine?.version
);