// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.0.0 — Pure Router / Uses Routing Pressures Only / No Observer Authority / No Composer Authority

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.0.0",

  split(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      input.routingEvidence ||
      summary.routingEvidence ||
      summary.observer?.routingEvidence ||
      this.emptyEvidence();

    const pressures = evidence.routingPressures || evidence;

    const scores = this.scoreLanes(pressures);
    const ranked = this.rankScores(scores);
    const lane = this.chooseLane(ranked, pressures);

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

      authority: {
        canObserve: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canChooseLane: true,
        role: "route_selection_only"
      }
    };
  },

  scoreLanes(p) {
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

    return {
      direct_current_turn: this.cap(direct),
      continuity_follow_up: this.cap(continuity),
      recall_or_memory_request: this.cap(recall),
      correction_or_revision: this.cap(revision),
      relationship_continuity: this.cap(relationship)
    };
  },

  chooseLane(ranked, p) {
    const top = ranked[0];
    const second = ranked[1];

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    // Strong standalone question override.
    if (
      p.standaloneCompleteness >= 0.70 &&
      p.directAnswerPressure >= 0.65 &&
      p.contextDependency < 0.55 &&
      p.recallPressure < 0.50 &&
      p.revisionPressure < 0.50
    ) {
      return "direct_current_turn";
    }

    // If context route barely wins but message is complete, prefer direct.
    if (
      top.lane !== "direct_current_turn" &&
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