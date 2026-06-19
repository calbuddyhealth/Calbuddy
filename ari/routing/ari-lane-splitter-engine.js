// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.3.0 — Semantic dependency routing / direct-vs-follow-up separation

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.3.0",

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
      (p.followUpPressure || 0) * 30 +
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

    if (context.hasThread && context.isTinyFollowUp) continuityBoost += 40;
    if (context.hasThread && context.startsWithContinuation) continuityBoost += 25;
    if (context.hasThread && context.hasPronounReference) continuityBoost += 25;
    if (context.hasThread && context.personalizedButMissingTopic) continuityBoost += 38;
    if (context.hasThread && context.recommendationNeedsPriorContext) continuityBoost += 42;
    if (context.hasThread && context.semanticDependency) continuityBoost += 35;

    if (context.hasNewConcreteTopic) directBoost += 35;
    if (context.isStandaloneActionQuestion) directBoost += 30;
    if (context.hasConcreteGoal) directBoost += 25;
    if (context.hasEnoughConcreteContent) directBoost += 20;

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

    if (context.hasThread && context.mustUseThread) {
      return "continuity_follow_up";
    }

    if (context.hasNewConcreteTopic && context.hasConcreteGoal) {
      return "direct_current_turn";
    }

    if (
      context.hasThread &&
      (
        context.isTinyFollowUp ||
        context.hasPronounReference ||
        context.recommendationNeedsPriorContext ||
        context.personalizedButMissingTopic ||
        context.semanticDependency ||
        (p.followUpPressure || 0) >= 0.65
      )
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
      !context.semanticDependency
    ) {
      return "direct_current_turn";
    }

    if (
      top.lane !== "direct_current_turn" &&
      second &&
      top.score - second.score < 8 &&
      p.standaloneCompleteness >= 0.65 &&
      p.directAnswerPressure >= 0.55 &&
      !context.semanticDependency
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
      /^(but|so|then|also|and|what about|what if|after that|why|how|how about|okay|ok|yeah but|ideally)\b/.test(text);

    const hasPronounReference =
      /\b(it|this|that|they|them|those|these|same thing|for me)\b/.test(text);

    const hasConcreteGoal =
      /\b\d+\s?(lbs?|pounds?|kg)\b/.test(text) ||
      /\blose weight|gain weight|calories|diet|protein|workout|exercise|budget|code|bug|error|sunburn|pain|pregnant\b/.test(text);

    const hasNewConcreteTopic =
      this.hasNewConcreteTopic(text);

    const isStandaloneActionQuestion =
      /^(how do i|what should i do|what do i do|how can i|can you help me)\b/.test(text) &&
      hasConcreteGoal;

    const isTinyFollowUp =
      hasThread &&
      wordCount <= 6 &&
      (
        startsWithContinuation ||
        /^(why|how|what|what else|really|then what)\??$/.test(text)
      );

    const recommendationNeedsPriorContext =
      hasThread &&
      /\b(recommend|suggest|ideally|best option|what would you do)\b/.test(text) &&
      /\b(for me|for this|about this|in this case|ideally)\b/.test(text) &&
      !hasNewConcreteTopic;

    const personalizedButMissingTopic =
      hasThread &&
      /\b(for me|my situation|my case|what do you recommend|recommend for me)\b/.test(text) &&
      !hasNewConcreteTopic;

    const hasEnoughConcreteContent =
      wordCount >= 7 && hasConcreteGoal;

    const semanticDependency =
      hasThread &&
      !hasNewConcreteTopic &&
      (
        recommendationNeedsPriorContext ||
        personalizedButMissingTopic ||
        hasPronounReference ||
        isTinyFollowUp
      );

    const mustUseThread =
      semanticDependency &&
      !hasNewConcreteTopic;

    return {
      text,
      wordCount,
      hasThread,
      startsWithContinuation,
      hasPronounReference,
      hasConcreteGoal,
      hasNewConcreteTopic,
      isStandaloneActionQuestion,
      isTinyFollowUp,
      recommendationNeedsPriorContext,
      personalizedButMissingTopic,
      hasEnoughConcreteContent,
      semanticDependency,
      mustUseThread
    };
  },

  hasNewConcreteTopic(text = "") {
    return (
      /\b\d+\s?(lbs?|pounds?|kg)\b/.test(text) ||
      /\b(weight|calories|diet|fat|lose weight|gain weight|cut|bulk|workout|exercise|meal|protein)\b/.test(text) ||
      /\b(code|file|bug|error|github|engine|function|javascript|html|css)\b/.test(text) ||
      /\b(sunburn|pain|fever|diarrhea|cough|pregnant|symptom|bleeding|swallow)\b/.test(text) ||
      /\b(car|vehicle|money|budget|rent|debt|job|work|boss|school)\b/.test(text)
    );
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
    if (lane === "continuity_follow_up" && context.semanticDependency) {
      return "Current message is semantically dependent on prior context, so Thread Understanding should run before the Situation Map.";
    }

    const explanations = {
      direct_current_turn:
        "Current message has enough standalone meaning and can go directly to the Situation Map.",

      continuity_follow_up:
        "Current message depends on active thread context, so Thread Understanding should run before the Situation Map.",

      recall_or_memory_request:
        "Current message asks for stored or prior context, so Memory should run before the Situation Map.",

      correction_or_revision:
        "Current message revises or corrects prior output, so Thread Understanding should run before the Situation Map.",

      relationship_continuity:
        "Current message depends on ongoing relationship context, so Relationship and Thread context should run before the Situation Map."
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
  }
};

console.log(
  "ARI LANE SPLITTER ENGINE LOADED:",
  window.Ari.laneSplitterEngine?.version
);