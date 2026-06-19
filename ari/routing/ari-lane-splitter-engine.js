// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.7.0 — Semantic Frame Consumer / minimal fallback / no primary keyword authority

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.7.0",

  split(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      input.routingEvidence ||
      summary.routingEvidence ||
      summary.observer?.routingEvidence ||
      this.emptyEvidence();

    const pressures = evidence.routingPressures || evidence;
    const frame = this.readSemanticFrame(summary, evidence);
    const context = this.readContext(summary, frame);

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
      confidence: this.confidence(ranked, context),
      explanation: this.explain(lane, context),

      semanticFrameUsed: frame,
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

  readSemanticFrame(summary = {}, evidence = {}) {
    const candidates = [
      evidence.supportingEvidence?.semanticFrame,
      evidence.semanticFrame,
      summary.semanticFrame,
      summary.observerSemanticFrame,
      summary.currentFrame,
      summary.latestConversationMeaning?.semanticFrame,
      summary.threadState?.activeSemanticFrame,
      summary.threadUnderstanding?.resolvedMeaning?.semanticFrame,
      summary.threadUnderstanding?.workingContext?.semanticState
    ];

    const found = candidates.find(x => x && typeof x === "object");

    if (found) {
      return this.normalizeFrame(found, "provided_semantic_frame");
    }

    return this.fallbackFrame(summary);
  },

  normalizeFrame(frame = {}, source = "semantic_frame") {
    const operation =
      frame.operation ||
      frame.intent ||
      frame.responseIntent ||
      frame.questionType ||
      frame.situationFrame ||
      "unknown";

    const slots = frame.slots || {
      object:
        frame.object ||
        frame.topic ||
        frame.subject ||
        frame.activeObject ||
        frame.resolvedObject ||
        null,

      options:
        frame.options ||
        frame.choices ||
        frame.alternatives ||
        null,

      goal:
        frame.goal ||
        frame.activeGoal ||
        frame.resolvedGoal ||
        null,

      problem:
        frame.problem ||
        frame.issue ||
        frame.activeIssue ||
        frame.resolvedIssue ||
        null,

      criteria:
        frame.criteria ||
        frame.constraints ||
        frame.values ||
        null,

      audience:
        frame.audience ||
        frame.target ||
        null
    };

    const requiredSlots = Array.isArray(frame.requiredSlots)
      ? frame.requiredSlots
      : this.requiredSlotsFor(operation);

    const missingSlots = Array.isArray(frame.missingSlots)
      ? frame.missingSlots
      : requiredSlots.filter(slot => !slots[slot]);

    const frameComplete =
      frame.frameComplete === true ||
      frame.isComplete === true ||
      missingSlots.length === 0;

    const needsPriorFrame =
      frame.needsPriorFrame === true ||
      frame.needsThread === true ||
      frame.requiresPriorContext === true ||
      frame.requiresThread === true;

    const confidence =
      Number(frame.confidence ?? frame.frameConfidence ?? 0.5) || 0.5;

    return {
      source,
      operation,
      slots,
      requiredSlots,
      missingSlots,
      frameComplete,
      needsPriorFrame,
      confidence,
      raw: frame
    };
  },

  fallbackFrame(summary = {}) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase().trim();

    const tokens = this.meaningfulTokens(text);
    const hasReference = this.hasReferenceLanguage(text);

    return {
      source: "minimal_fallback_frame",
      operation: "unknown",
      slots: {
        object: tokens.length >= 2 && !hasReference ? tokens.join(" ") : null,
        options: null,
        goal: null,
        problem: null,
        criteria: null,
        audience: null
      },
      requiredSlots: [],
      missingSlots: [],
      frameComplete: tokens.length >= 2 && !hasReference,
      needsPriorFrame: hasReference && tokens.length < 3,
      confidence: 0.45,
      raw: { text }
    };
  },

  readContext(summary = {}, frame = {}) {
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

    const hasReferenceLanguage = this.hasReferenceLanguage(text);
    const hasCoreSlot = this.frameHasCoreSlot(frame);

    const frameNeedsThread =
      hasThread &&
      (
        frame.needsPriorFrame === true ||
        (
          !frame.frameComplete &&
          hasReferenceLanguage &&
          frame.missingSlots?.length > 0
        )
      );

    const semanticDependencyScore = this.scoreSemanticDependency({
      hasThread,
      frame,
      frameNeedsThread,
      hasReferenceLanguage,
      hasCoreSlot,
      wordCount
    });

    const standaloneMeaningScore = this.scoreStandaloneMeaning({
      frame,
      hasReferenceLanguage,
      hasCoreSlot,
      wordCount
    });

    return {
      text,
      wordCount,
      hasThread,
      frame,
      frameNeedsThread,
      hasReferenceLanguage,
      hasCoreSlot,
      semanticDependencyScore,
      standaloneMeaningScore
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

    let directBoost = Math.round(context.standaloneMeaningScore * 55);
    let continuityBoost = Math.round(context.semanticDependencyScore * 60);

    if (context.frame.frameComplete) directBoost += 35;
    if (context.hasCoreSlot) directBoost += 20;

    if (context.frameNeedsThread) continuityBoost += 45;
    if (context.frame.needsPriorFrame) continuityBoost += 35;
    if (context.frame.missingSlots?.length) continuityBoost += 20;

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

    if (context.frameNeedsThread) {
      return "continuity_follow_up";
    }

    if (
      context.hasThread &&
      context.semanticDependencyScore >= 0.7
    ) {
      return "continuity_follow_up";
    }

    if (
      context.frame.frameComplete &&
      context.standaloneMeaningScore >= 0.6
    ) {
      return "direct_current_turn";
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
    hasThread = false,
    frame = {},
    frameNeedsThread = false,
    hasReferenceLanguage = false,
    hasCoreSlot = false,
    wordCount = 0
  } = {}) {
    if (!hasThread) return 0;

    let score = 0;

    if (frameNeedsThread) score += 0.5;
    if (frame.needsPriorFrame) score += 0.35;
    if (frame.missingSlots?.length) score += 0.25;
    if (hasReferenceLanguage) score += 0.2;
    if (wordCount <= 8 && !hasCoreSlot) score += 0.15;

    if (frame.frameComplete) score -= 0.3;
    if (hasCoreSlot && wordCount >= 7) score -= 0.2;

    return this.clamp01(score);
  },

  scoreStandaloneMeaning({
    frame = {},
    hasReferenceLanguage = false,
    hasCoreSlot = false,
    wordCount = 0
  } = {}) {
    let score = 0;

    if (frame.frameComplete) score += 0.4;
    if (hasCoreSlot) score += 0.25;
    if (frame.operation && frame.operation !== "unknown") score += 0.15;
    if (wordCount >= 7) score += 0.15;
    if (frame.confidence >= 0.7) score += 0.1;

    if (hasReferenceLanguage && !frame.frameComplete) score -= 0.25;
    if (frame.needsPriorFrame) score -= 0.35;

    return this.clamp01(score);
  },

  requiredSlotsFor(operation = "unknown") {
    const op = String(operation || "unknown").toLowerCase();

    if (op.includes("recommend")) return ["object"];
    if (op.includes("compare")) return ["options"];
    if (op.includes("plan")) return ["goal"];
    if (op.includes("explain")) return ["object"];
    if (op.includes("repair")) return ["problem"];
    if (op.includes("debug")) return ["problem"];
    if (op.includes("revision")) return ["problem"];
    if (op.includes("decision")) return ["object"];
    if (op.includes("permission")) return ["object"];

    return [];
  },

  frameHasCoreSlot(frame = {}) {
    const slots = frame.slots || {};

    return Boolean(
      slots.object ||
      slots.options ||
      slots.goal ||
      slots.problem
    );
  },

  hasReferenceLanguage(text = "") {
    return (
      /\b(it|this|that|they|them|those|these|same|same thing|one|ones)\b/.test(text) ||
      /\b(which one|which option|the first one|the second one|the other one)\b/.test(text) ||
      /\b(for me|my situation|my case|in this case|based on that|given that)\b/.test(text) ||
      /^(why|how|what about|what if|then what|really|okay but|so|but|also|still)\b/.test(text)
    );
  },

  meaningfulTokens(text = "") {
    const weak = new Set([
      "what", "when", "where", "why", "how", "should", "could", "would",
      "recommend", "suggest", "best", "better", "plan", "strategy",
      "approach", "ideally", "really", "thing", "stuff", "something",
      "anything", "me", "my", "you", "your", "for", "about", "this",
      "that", "they", "them", "one", "same", "option", "the", "and",
      "or", "but", "with", "from", "into", "onto", "have", "has", "had",
      "do", "does", "did", "can", "will", "would", "there", "their"
    ]);

    return String(text || "")
      .toLowerCase()
      .split(/\W+/)
      .map(t => t.trim())
      .filter(t => t.length >= 4 && !weak.has(t));
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

  confidence(ranked = [], context = {}) {
    const top = ranked[0]?.score || 0;
    const second = ranked[1]?.score || 0;
    const gap = top - second;

    if (context.frameNeedsThread || context.frame.frameComplete) return "high";
    if (gap >= 30) return "high";
    if (gap >= 15) return "medium";
    return "low";
  },

  explain(lane, context = {}) {
    if (lane === "continuity_follow_up" && context.frameNeedsThread) {
      return "Semantic frame is incomplete and depends on prior thread context.";
    }

    if (lane === "direct_current_turn" && context.frame.frameComplete) {
      return "Semantic frame is complete enough to route directly to the Situation Map.";
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