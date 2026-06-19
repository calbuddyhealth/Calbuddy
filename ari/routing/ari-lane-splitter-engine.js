// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.3.0 — Respects routing guards / prevents false follow-up hijack

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
    const guards = evidence.routingGuards || {};
    const context = this.readContext(summary, guards);

    const scores = this.scoreLanes(pressures, context, guards);
    const ranked = this.rankScores(scores);
    const lane = this.chooseLane(ranked, pressures, context, guards);

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
      routingGuardsUsed: guards,
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

  scoreLanes(p, context = {}, guards = {}) {
    const direct =
      p.standaloneCompleteness * 35 +
      p.directAnswerPressure * 35 +
      (1 - p.contextDependency) * 15 +
      (1 - p.ambiguityWithoutContext) * 15;

    const continuity =
      p.contextDependency * 25 +
      (p.followUpPressure || 0) * 35 +
      p.activeThreadMatch * 20 +
      p.ambiguityWithoutContext * 10 +
      p.directAnswerPressure * 5;

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

    let directBoost = 0;
    let continuityBoost = 0;

    if (guards.shouldNotForceFollowUp || context.hasConcreteNewTopic) {
      directBoost += 30;
      continuityBoost -= 30;
    }

    if (context.hasThread && context.isTrueShortFollowUp) {
      continuityBoost += 35;
    }

    if (context.hasThread && context.startsWithContinuation && !context.hasConcreteNewTopic) {
      continuityBoost += 20;
    }

    if (context.hasThread && context.hasQuestionFollowUp && !context.hasConcreteNewTopic) {
      continuityBoost += 20;
    }

    return {
      direct_current_turn: this.cap(direct + directBoost),
      continuity_follow_up: this.cap(continuity + continuityBoost),
      recall_or_memory_request: this.cap(recall),
      correction_or_revision: this.cap(revision),
      relationship_continuity: this.cap(relationship)
    };
  },

  chooseLane(ranked, p, context = {}, guards = {}) {
    const top = ranked[0];
    const second = ranked[1];

    if (guards.shouldNotForceFollowUp || context.hasConcreteNewTopic) {
      if (
        p.recallPressure < 0.55 &&
        p.revisionPressure < 0.55 &&
        p.relationshipContinuity < 0.65
      ) {
        return "direct_current_turn";
      }
    }

    if (
      context.hasThread &&
      !context.hasConcreteNewTopic &&
      (
        context.isTrueShortFollowUp ||
        (p.followUpPressure || 0) >= 0.65
      )
    ) {
      return "continuity_follow_up";
    }

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    if (
      p.standaloneCompleteness >= 0.60 &&
      p.directAnswerPressure >= 0.55 &&
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
      p.standaloneCompleteness >= 0.55 &&
      p.directAnswerPressure >= 0.50
    ) {
      return "direct_current_turn";
    }

    return top.lane;
  },

  readContext(summary = {}, guards = {}) {
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
      /^(but|so|then|also|and|what about|what if|after that|why|okay|ok|yeah but|really)\b/.test(text);

    const hasQuestionFollowUp =
      /^(why|what about|what do you mean|can you explain|explain)\b/.test(text);

    const hasConcreteNewTopic =
      Boolean(guards.hasConcreteNewTopic) ||
      /\b\d+\s?(lbs?|pounds?|kg)\b/.test(text) ||
      /\b(weight|calories|diet|fat|lose weight|gain weight|cut|bulk|protein|meal|workout|exercise)\b/.test(text) ||
      /\b(code|file|bug|error|github|engine|function|pipeline|javascript)\b/.test(text) ||
      /\b(sunburn|pain|fever|diarrhea|cough|pregnant|symptom|blister|bleeding)\b/.test(text);

    const isBareFollowUp =
      /^(why|how|really|then what|what else|what about that|what about this)\??$/.test(text);

    const hasPronounReference =
      /\b(it|this|that|they|them|same)\b/.test(text);

    const isTrueShortFollowUp =
      hasThread &&
      wordCount <= 8 &&
      !hasConcreteNewTopic &&
      (isBareFollowUp || hasPronounReference || startsWithContinuation);

    return {
      text,
      wordCount,
      hasThread,
      startsWithContinuation,
      hasQuestionFollowUp,
      hasConcreteNewTopic,
      isBareFollowUp,
      hasPronounReference,
      isTrueShortFollowUp
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
        "Current message can go directly to the Situation Map without thread reconstruction.",

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
      directAnswerPressure: 0.5,
      routingGuards: {}
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