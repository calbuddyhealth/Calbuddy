// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.5.0 — Frame Slot Routing / universal semantic dependency detection

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.5.0",

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

    continuityBoost += Math.round(context.semanticDependencyScore * 50);
    directBoost += Math.round(context.standaloneMeaningScore * 45);

    if (context.frame.needsThread) continuityBoost += 35;
    if (context.frame.missingSlots.length) continuityBoost += 20;
    if (context.isTinyFollowUp) continuityBoost += 25;
    if (context.hasReferenceLanguage) continuityBoost += 18;

    if (context.frame.isComplete) directBoost += 30;
    if (context.hasStandaloneObject) directBoost += 25;
    if (context.hasNewConcreteTopic) directBoost += 20;
    if (context.hasEnoughConcreteContent) directBoost += 15;

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

    if (context.frame.needsThread && context.hasThread) {
      return "continuity_follow_up";
    }

    if (context.frame.isComplete && context.standaloneMeaningScore >= 0.6) {
      return "direct_current_turn";
    }

    if (context.hasThread && context.semanticDependencyScore >= 0.7) {
      return "continuity_follow_up";
    }

    if (!top || top.score < 35) {
      return "direct_current_turn";
    }

    if (
      p.standaloneCompleteness >= 0.7 &&
      p.directAnswerPressure >= 0.6 &&
      p.contextDependency < 0.5 &&
      context.semanticDependencyScore < 0.55
    ) {
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

    const frame = this.buildFrame(text, hasThread);

    const hasReferenceLanguage = this.hasReferenceLanguage(text);
    const hasStandaloneObject = Boolean(frame.slots.object || frame.slots.options || frame.slots.problem || frame.slots.goal);
    const hasNewConcreteTopic = this.hasNewConcreteTopic(text);
    const hasEnoughConcreteContent = wordCount >= 7 && hasStandaloneObject;

    const isTinyFollowUp =
      hasThread &&
      wordCount <= 6 &&
      (hasReferenceLanguage || frame.operation !== "unknown");

    const semanticDependencyScore = this.scoreSemanticDependency({
      hasThread,
      frame,
      hasReferenceLanguage,
      isTinyFollowUp,
      hasStandaloneObject,
      hasNewConcreteTopic,
      wordCount
    });

    const standaloneMeaningScore = this.scoreStandaloneMeaning({
      wordCount,
      frame,
      hasStandaloneObject,
      hasNewConcreteTopic,
      hasReferenceLanguage
    });

    return {
      text,
      wordCount,
      hasThread,
      frame,
      hasReferenceLanguage,
      hasStandaloneObject,
      hasNewConcreteTopic,
      hasEnoughConcreteContent,
      isTinyFollowUp,
      semanticDependencyScore,
      standaloneMeaningScore
    };
  },

  buildFrame(text = "", hasThread = false) {
    const operation = this.detectOperation(text);
    const slots = this.extractSlots(text);
    const requiredSlots = this.requiredSlotsFor(operation);

    const missingSlots = requiredSlots.filter(slot => !slots[slot]);

    const isComplete =
      operation === "unknown"
        ? this.hasNewConcreteTopic(text)
        : missingSlots.length === 0;

    const needsThread =
      hasThread &&
      operation !== "unknown" &&
      missingSlots.length > 0 &&
      this.hasReferenceLanguage(text);

    return {
      operation,
      slots,
      requiredSlots,
      missingSlots,
      isComplete,
      needsThread
    };
  },

  detectOperation(text = "") {
    if (this.matchesAny(text, [
      /\b(recommend|suggest|choose|pick|prefer)\b/,
      /\b(which should|which one|which option)\b/,
      /\b(best|better|safest|healthiest|cheapest|strongest|ideal)\b/
    ])) {
      return "recommendation";
    }

    if (this.matchesAny(text, [
      /\b(compare|difference|versus|vs|better|worse)\b/,
      /\b(which is more|which is less)\b/
    ])) {
      return "comparison";
    }

    if (this.matchesAny(text, [
      /\b(plan|strategy|roadmap|steps|schedule|routine)\b/,
      /\b(how do i|how can i|what should i do)\b/
    ])) {
      return "planning";
    }

    if (this.matchesAny(text, [
      /\b(why|how come|explain|break down|what does)\b/
    ])) {
      return "explanation";
    }

    if (this.matchesAny(text, [
      /\b(fix|debug|repair|solve|update|rewrite|replace|broken|error)\b/
    ])) {
      return "repair_or_revision";
    }

    if (this.matchesAny(text, [
      /\b(can i|should i|do i|is it okay|would it be okay)\b/
    ])) {
      return "permission_or_decision";
    }

    return "unknown";
  },

  requiredSlotsFor(operation = "unknown") {
    const map = {
      recommendation: ["object"],
      comparison: ["options"],
      planning: ["goal"],
      explanation: ["object"],
      repair_or_revision: ["problem"],
      permission_or_decision: ["object"],
      unknown: []
    };

    return map[operation] || [];
  },

  extractSlots(text = "") {
    return {
      object: this.extractObject(text),
      options: this.extractOptions(text),
      goal: this.extractGoal(text),
      problem: this.extractProblem(text),
      criteria: this.extractCriteria(text),
      audience: this.extractAudience(text)
    };
  },

  extractObject(text = "") {
    if (this.isOnlyReference(text)) return null;

    const cleaned = this.removeQuestionScaffold(text);
    const concrete = this.meaningfulTokens(cleaned);

    if (/\d/.test(text)) return text;
    if (concrete.length >= 2) return concrete.join(" ");

    return null;
  },

  extractOptions(text = "") {
    if (/\b(a or b|either|between|versus|vs)\b/.test(text)) return text;
    if (/\b(which one|which option|the best one|the healthiest one|the safer one)\b/.test(text)) return null;

    const optionLike = text.split(/\s+or\s+|\s+vs\s+|\s+versus\s+/).filter(x => x.trim());
    return optionLike.length >= 2 ? optionLike : null;
  },

  extractGoal(text = "") {
    if (this.matchesAny(text, [
      /\b(to|so i can|in order to)\b/,
      /\b(lose|gain|build|make|create|fix|improve|reduce|increase|get back)\b/
    ])) {
      return text;
    }

    return null;
  },

  extractProblem(text = "") {
    if (this.matchesAny(text, [
      /\b(error|bug|broken|not working|issue|problem|fail|failed|wrong)\b/
    ])) {
      return text;
    }

    return null;
  },

  extractCriteria(text = "") {
    const criteria = [];

    const patterns = [
      ["best", /\bbest|ideal|recommend\b/],
      ["health", /\bhealthy|healthiest|safer|safest\b/],
      ["cost", /\bcheap|cheapest|affordable|cost|budget\b/],
      ["speed", /\bfast|quick|soon|urgent\b/],
      ["quality", /\bbetter|stronger|reliable|effective\b/]
    ];

    patterns.forEach(([value, regex]) => {
      if (regex.test(text)) criteria.push(value);
    });

    return criteria;
  },

  extractAudience(text = "") {
    if (/\b(for me|my situation|my case|in my case|for us)\b/.test(text)) {
      return "user_specific";
    }

    return null;
  },

  hasReferenceLanguage(text = "") {
    return this.matchesAny(text, [
      /\b(it|this|that|they|them|those|these|same|same thing)\b/,
      /\b(which one|which option|the first one|the second one|the other one)\b/,
      /\b(for me|my situation|my case|in this case|based on that)\b/,
      /^(why|how|what about|what if|then what|really|okay but|so)\b/
    ]);
  },

  isOnlyReference(text = "") {
    const cleaned = text
      .replace(/[?!.]/g, "")
      .replace(/\b(what|which|is|the|do|you|recommend|should|i|can|me|for|best|better)\b/g, "")
      .trim();

    if (!cleaned) return true;

    return /^(it|this|that|they|them|one|same|option)$/.test(cleaned);
  },

  hasNewConcreteTopic(text = "") {
    const tokens = this.meaningfulTokens(text);
    const reference = this.hasReferenceLanguage(text);

    if (/\d/.test(text)) return true;
    if (tokens.length >= 3 && !reference) return true;
    if (tokens.length >= 4) return true;

    return false;
  },

  scoreSemanticDependency({
    hasThread = false,
    frame = {},
    hasReferenceLanguage = false,
    isTinyFollowUp = false,
    hasStandaloneObject = false,
    hasNewConcreteTopic = false,
    wordCount = 0
  } = {}) {
    if (!hasThread) return 0;

    let score = 0;

    if (frame.needsThread) score += 0.45;
    if (frame.missingSlots?.length) score += 0.25;
    if (hasReferenceLanguage) score += 0.2;
    if (isTinyFollowUp) score += 0.2;
    if (wordCount <= 8 && !hasStandaloneObject) score += 0.15;

    if (frame.isComplete) score -= 0.25;
    if (hasNewConcreteTopic && hasStandaloneObject) score -= 0.25;

    return this.clamp01(score);
  },

  scoreStandaloneMeaning({
    wordCount = 0,
    frame = {},
    hasStandaloneObject = false,
    hasNewConcreteTopic = false,
    hasReferenceLanguage = false
  } = {}) {
    let score = 0;

    if (wordCount >= 7) score += 0.2;
    if (wordCount >= 12) score += 0.15;
    if (hasStandaloneObject) score += 0.3;
    if (hasNewConcreteTopic) score += 0.25;
    if (frame.isComplete) score += 0.25;
    if (frame.operation !== "unknown") score += 0.1;

    if (hasReferenceLanguage && !frame.isComplete) score -= 0.25;

    return this.clamp01(score);
  },

  removeQuestionScaffold(text = "") {
    return text
      .replace(/\b(what|when|where|why|how|can|could|should|would|do|does|did|is|are|am)\b/g, " ")
      .replace(/\b(i|me|my|you|your|we|us|our)\b/g, " ")
      .replace(/\b(recommend|suggest|choose|pick|prefer|best|better|ideal|plan|explain|fix)\b/g, " ")
      .replace(/\b(it|this|that|they|them|one|same|thing|option)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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

  matchesAny(text = "", patterns = []) {
    return patterns.some(pattern => pattern.test(text));
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
    if (lane === "continuity_follow_up" && context.frame?.needsThread) {
      return "Current message has an operation but is missing required slots, so it needs active thread context.";
    }

    if (lane === "direct_current_turn" && context.frame?.isComplete) {
      return "Current message has enough filled frame slots to go directly to the Situation Map.";
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