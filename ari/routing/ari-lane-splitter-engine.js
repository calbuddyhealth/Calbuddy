// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.4.0 — Generalized semantic dependency routing / scalable direct-vs-follow-up separation

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.4.0",

  split(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      input.routingEvidence ||
      summary.routingEvidence ||
      summary.observer?.routingEvidence ||
      this.emptyEvidence();

    const pressures = evidence.routingPressures || evidence;
    const context = this.readContext(summary);

    const scores = this.scoreLanes(pressures, context);
    const ranked = this.rankScores(scores);
    const lane = this.chooseLane(ranked, pressures, context);

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
      confidence: this.confidence(ranked),
      explanation: this.explain(lane, context),
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

  scoreLanes(p = {}, context = {}) {
    const direct =
      p.standaloneCompleteness * 35 +
      p.directAnswerPressure * 35 +
      (1 - p.contextDependency) * 15 +
      (1 - p.ambiguityWithoutContext) * 15;

    const continuity =
      p.contextDependency * 28 +
      (p.followUpPressure || 0) * 28 +
      p.activeThreadMatch * 18 +
      p.ambiguityWithoutContext * 12 +
      p.directAnswerPressure * 4;

    const recall =
      p.recallPressure * 70 +
      p.contextDependency * 15 +
      p.ambiguityWithoutContext * 15;

    const revision =
      p.revisionPressure * 75 +
      p.contextDependency * 15 +
      p.activeThreadMatch * 10;

    const relationship =
      p.relationshipContinuity * 70 +
      p.contextDependency * 20 +
      p.activeThreadMatch * 10;

    let continuityBoost = 0;
    let directBoost = 0;

    continuityBoost += Math.round(context.semanticDependencyScore * 45);

    if (context.hasThread && context.isTinyFollowUp) continuityBoost += 30;
    if (context.hasThread && context.startsWithContinuation) continuityBoost += 18;
    if (context.hasThread && context.hasPronounReference) continuityBoost += 20;
    if (context.hasThread && context.missingObjectForRequestedOperation) continuityBoost += 35;

    directBoost += Math.round(context.standaloneMeaningScore * 40);

    if (context.hasNewConcreteTopic) directBoost += 25;
    if (context.hasExplicitObject) directBoost += 20;
    if (context.isStandaloneActionQuestion) directBoost += 25;
    if (context.hasEnoughConcreteContent) directBoost += 18;

    return {
      direct_current_turn: this.cap(direct + directBoost),
      continuity_follow_up: this.cap(continuity + continuityBoost),
      recall_or_memory_request: this.cap(recall),
      correction_or_revision: this.cap(revision),
      relationship_continuity: this.cap(relationship)
    };
  },

  chooseLane(ranked = [], p = {}, context = {}) {
    const top = ranked[0];
    const second = ranked[1];

    if (context.hasThread && context.semanticDependencyScore >= 0.75) {
      return "continuity_follow_up";
    }

    if (context.hasNewConcreteTopic && context.standaloneMeaningScore >= 0.65) {
      return "direct_current_turn";
    }

    if (
      context.hasThread &&
      context.semanticDependencyScore >= 0.6 &&
      !context.hasExplicitObject
    ) {
      return "continuity_follow_up";
    }

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    if (
      p.standaloneCompleteness >= 0.70 &&
      p.directAnswerPressure >= 0.60 &&
      p.contextDependency < 0.50 &&
      p.recallPressure < 0.50 &&
      p.revisionPressure < 0.50 &&
      context.semanticDependencyScore < 0.55
    ) {
      return "direct_current_turn";
    }

    if (
      top.lane !== "direct_current_turn" &&
      second &&
      top.score - second.score < 8 &&
      p.standaloneCompleteness >= 0.65 &&
      p.directAnswerPressure >= 0.55 &&
      context.semanticDependencyScore < 0.55
    ) {
      return "direct_current_turn";
    }

    return top.lane;
  },

  readContext(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase().trim();

    const threadState = summary.threadState || {};
    const recentMessages = summary.recentMessages || threadState.lastMessages || [];

    const hasThread =
      Boolean(summary.threadStateLoaded) &&
      (
        recentMessages.length > 0 ||
        Boolean(threadState.currentTopic) ||
        Boolean(threadState.continuitySummary) ||
        Boolean(summary.workingContext)
      );

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const startsWithContinuation =
      /^(but|so|then|also|and|what about|what if|after that|why|how|how about|okay|ok|yeah but|ideally|still)\b/.test(text);

    const hasPronounReference =
  /\b(it|this|that|they|them|those|these|same|same thing|one|which one|for me|my situation|my case|in this case)\b/.test(text);

    const requestedOperation = this.detectRequestedOperation(text);

    const hasExplicitObject = this.hasExplicitObject(text);
    const hasNewConcreteTopic = this.hasNewConcreteTopic(text);
    const hasEnoughConcreteContent = wordCount >= 7 && hasExplicitObject;

    const isStandaloneActionQuestion =
      /^(how do i|what should i do|what do i do|how can i|can you help me|make me|create|build|fix)\b/.test(text) &&
      hasExplicitObject;

    const isTinyFollowUp =
      hasThread &&
      wordCount <= 6 &&
      (
        startsWithContinuation ||
        /^(why|how|what|what else|really|then what|can i|should i|do i)\??$/.test(text)
      );

    const missingObjectForRequestedOperation =
      hasThread &&
      requestedOperation !== "none" &&
      !hasExplicitObject &&
      (
        hasPronounReference ||
        wordCount <= 10 ||
        startsWithContinuation
      );

    const semanticDependencyScore = this.scoreSemanticDependency({
      hasThread,
      startsWithContinuation,
      hasPronounReference,
      isTinyFollowUp,
      missingObjectForRequestedOperation,
      requestedOperation,
      hasExplicitObject,
      hasNewConcreteTopic,
      wordCount
    });

    const standaloneMeaningScore = this.scoreStandaloneMeaning({
      wordCount,
      hasExplicitObject,
      hasNewConcreteTopic,
      hasPronounReference,
      startsWithContinuation,
      requestedOperation
    });

    return {
      text,
      wordCount,
      hasThread,
      startsWithContinuation,
      hasPronounReference,
      requestedOperation,
      hasExplicitObject,
      hasNewConcreteTopic,
      hasEnoughConcreteContent,
      isStandaloneActionQuestion,
      isTinyFollowUp,
      missingObjectForRequestedOperation,
      semanticDependencyScore,
      standaloneMeaningScore
    };
  },

  detectRequestedOperation(text = "") {
    if (/\b(recommend|suggest|best|healthiest|safest|choose|pick|prefer|which one|what would you do)\b/.test(text)) {
  return "recommendation";
}

    if (/\b(plan|strategy|approach|roadmap|steps)\b/.test(text)) {
      return "planning";
    }

    if (/\b(explain|why|how come|what does it mean|break down)\b/.test(text)) {
      return "explanation";
    }

    if (/\b(fix|debug|repair|solve|update|rewrite|replace)\b/.test(text)) {
      return "repair_or_revision";
    }

    if (/\b(compare|difference|better|worse|versus|vs)\b/.test(text)) {
      return "comparison";
    }

    if (/\b(can i|should i|do i|is it okay|would it be okay)\b/.test(text)) {
      return "permission_or_decision";
    }

    return "none";
  },

  hasExplicitObject(text = "") {
    const words = text.split(/\s+/).filter(Boolean);

    const hasNumberOrUnit = /\d/.test(text);
    const hasQuotedOrNamedThing = /["“”']/.test(text);
    const concreteWords = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");
      if (!cleaned) return false;

      const weakWords = [
        "what", "when", "where", "why", "how", "should", "could", "would",
        "recommend", "suggest", "best", "plan", "strategy", "approach",
        "ideally", "really", "thing", "stuff", "something", "anything",
        "me", "my", "you", "your", "for", "about", "this", "that"
      ];

      return cleaned.length >= 6 && !weakWords.includes(cleaned);
    }).length;

    return hasNumberOrUnit || hasQuotedOrNamedThing || concreteWords >= 2;
  },

  hasNewConcreteTopic(text = "") {
    const words = text.split(/\s+/).filter(Boolean);

    const hasNumbers = /\d/.test(text);
    const longConcreteWords = words.filter(word => {
      const cleaned = word.replace(/[^\w]/g, "");
      return cleaned.length >= 6;
    }).length;

    const references =
      (text.match(/\b(it|this|that|they|them|those|these|same)\b/g) || []).length;

    return (
      hasNumbers ||
      longConcreteWords >= 3 ||
      (words.length >= 8 && references === 0 && this.hasExplicitObject(text))
    );
  },

  scoreSemanticDependency({
    hasThread = false,
    startsWithContinuation = false,
    hasPronounReference = false,
    isTinyFollowUp = false,
    missingObjectForRequestedOperation = false,
    requestedOperation = "none",
    hasExplicitObject = false,
    hasNewConcreteTopic = false,
    wordCount = 0
  } = {}) {
    if (!hasThread) return 0;

    let score = 0;

    if (isTinyFollowUp) score += 0.35;
    if (startsWithContinuation) score += 0.20;
    if (hasPronounReference) score += 0.20;
    if (missingObjectForRequestedOperation) score += 0.35;
    if (requestedOperation !== "none" && !hasExplicitObject) score += 0.20;
    if (wordCount <= 8 && !hasExplicitObject) score += 0.15;

    if (hasNewConcreteTopic) score -= 0.35;
    if (hasExplicitObject && wordCount >= 7) score -= 0.20;

    return this.clamp01(score);
  },

  scoreStandaloneMeaning({
    wordCount = 0,
    hasExplicitObject = false,
    hasNewConcreteTopic = false,
    hasPronounReference = false,
    startsWithContinuation = false,
    requestedOperation = "none"
  } = {}) {
    let score = 0;

    if (wordCount >= 7) score += 0.20;
    if (wordCount >= 12) score += 0.15;
    if (hasExplicitObject) score += 0.30;
    if (hasNewConcreteTopic) score += 0.25;
    if (requestedOperation !== "none") score += 0.10;

    if (hasPronounReference) score -= 0.15;
    if (startsWithContinuation) score -= 0.10;

    return this.clamp01(score);
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

  rankScores(scores) {
    return Object.entries(scores)
      .map(([lane, score]) => ({ lane, score }))
      .sort((a, b) => b.score - a.score);
  },

  confidence(ranked) {
    const top = ranked[0]?.score || 0;
    const second = ranked[1]?.score || 0;
    const gap = top - second;

    if (gap >= 30) return "high";
    if (gap >= 15) return "medium";
    return "low";
  },

  explain(lane, context = {}) {
    if (lane === "continuity_follow_up" && context.semanticDependencyScore >= 0.6) {
      return "Current message lacks enough standalone object/context and depends on the active thread.";
    }

    if (lane === "direct_current_turn" && context.standaloneMeaningScore >= 0.65) {
      return "Current message has enough standalone meaning and should go directly to the Situation Map.";
    }

    const explanations = {
      direct_current_turn:
        "Current message can go directly to the Situation Map.",

      continuity_follow_up:
        "Current message depends on active thread context, so Thread Understanding should run first.",

      recall_or_memory_request:
        "Current message asks for stored or prior context, so Memory should run first.",

      correction_or_revision:
        "Current message revises or corrects prior output, so Thread Understanding should run first.",

      relationship_continuity:
        "Current message depends on ongoing relationship context."
    };

    return explanations[lane] || "Lane selected from routing pressures.";
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