// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.1.0 — Adds thread-aware short follow-up routing

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.1.0",

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
      explanation: this.explain(lane),
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

  scoreLanes(p, context = {}) {
    const direct =
      p.standaloneCompleteness * 35 +
      p.directAnswerPressure * 35 +
      (1 - p.contextDependency) * 15 +
      (1 - p.ambiguityWithoutContext) * 15;

    const continuity =
      p.contextDependency * 45 +
      p.activeThreadMatch * 25 +
      p.ambiguityWithoutContext * 20 +
      p.directAnswerPressure * 10;

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

    if (context.hasThread && context.isShortContextualFollowUp) {
      continuityBoost += 35;
    }

    if (context.hasThread && context.startsWithContinuation) {
      continuityBoost += 25;
    }

    if (context.hasThread && context.hasQuestionFollowUp) {
      continuityBoost += 20;
    }

    return {
      direct_current_turn: this.cap(direct),
      continuity_follow_up: this.cap(continuity + continuityBoost),
      recall_or_memory_request: this.cap(recall),
      correction_or_revision: this.cap(revision),
      relationship_continuity: this.cap(relationship)
    };
  },

  chooseLane(ranked, p, context = {}) {
    const top = ranked[0];
    const second = ranked[1];

    if (context.hasThread && context.isShortContextualFollowUp) {
      return "continuity_follow_up";
    }

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    if (
      p.standaloneCompleteness >= 0.70 &&
      p.directAnswerPressure >= 0.65 &&
      p.contextDependency < 0.55 &&
      p.recallPressure < 0.50 &&
      p.revisionPressure < 0.50
    ) {
      return "direct_current_turn";
    }

    if (
      top.lane !== "direct_current_turn" &&
      second &&
      top.score - second.score < 8 &&
      p.standaloneCompleteness >= 0.65 &&
      p.directAnswerPressure >= 0.55
    ) {
      return "direct_current_turn";
    }

    return top.lane;
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
        Boolean(threadState.continuitySummary)
      );

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const startsWithContinuation =
      /^(but|so|then|also|and|what about|why|how about|okay but|yeah but)\b/.test(text);

    const hasQuestionFollowUp =
      /^(why|how|what about|what do you mean|explain|can you explain)\b/.test(text);

    const isShortContextualFollowUp =
      hasThread &&
      wordCount <= 6 &&
      startsWithContinuation;

    return {
      text,
      wordCount,
      hasThread,
      startsWithContinuation,
      hasQuestionFollowUp,
      isShortContextualFollowUp
    };
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

  explain(lane) {
    const explanations = {
      direct_current_turn:
        "Current message can go directly to the Situation Map with Observer evidence, without thread/memory reconstruction.",

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