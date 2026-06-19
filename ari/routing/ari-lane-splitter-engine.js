// ari/routing/ari-lane-splitter-engine.js
// Ari Lane Splitter Engine
// Purpose: Choose direct vs continuity/recall/revision/relationship route.
// V1.6.1 — Frame Consumer Routing / semantic-slot dependency model

window.Ari = window.Ari || {};

window.Ari.laneSplitterEngine = {
  version: "1.6.1",

  split(input = {}) {
    const summary = input.summary || input || {};

    const evidence =
      input.routingEvidence ||
      summary.routingEvidence ||
      summary.observer?.routingEvidence ||
      this.emptyEvidence();

    const pressures = evidence.routingPressures || evidence;
    const context = this.readContext(summary, evidence);

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

  readContext(summary = {}, evidence = {}) {
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

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const frame =
      this.readProvidedFrame(summary, evidence) ||
      this.buildFallbackFrame(text, hasThread);

    const hasReferenceLanguage = this.hasReferenceLanguage(text);
    const hasStandaloneObject = this.frameHasFilledCoreSlot(frame);
    const frameComplete = this.isFrameComplete(frame);
    const frameNeedsThread = this.frameNeedsThread(frame, hasThread, hasReferenceLanguage);

    const hasEnoughConcreteContent =
      wordCount >= 7 &&
      hasStandaloneObject &&
      frameComplete;

    const isTinyFollowUp =
      hasThread &&
      wordCount <= 6 &&
      (
        hasReferenceLanguage ||
        frame.operation !== "unknown"
      );

    const semanticDependencyScore = this.scoreSemanticDependency({
      hasThread,
      frame,
      frameNeedsThread,
      frameComplete,
      hasReferenceLanguage,
      isTinyFollowUp,
      hasStandaloneObject,
      wordCount
    });

    const standaloneMeaningScore = this.scoreStandaloneMeaning({
      wordCount,
      frame,
      frameComplete,
      hasStandaloneObject,
      hasReferenceLanguage
    });

    return {
      text,
      wordCount,
      hasThread,
      frame,
      frameComplete,
      frameNeedsThread,
      hasReferenceLanguage,
      hasStandaloneObject,
      hasEnoughConcreteContent,
      isTinyFollowUp,
      semanticDependencyScore,
      standaloneMeaningScore
    };
  },

  readProvidedFrame(summary = {}, evidence = {}) {
    const candidates = [
      evidence.supportingEvidence?.semanticFrame,
      evidence.semanticFrame,
      summary.semanticFrame,
      summary.currentFrame,
      summary.observerSemanticFrame,
      summary.situationFrame,
      summary.threadUnderstanding?.resolvedMeaning,
      summary.threadUnderstanding?.workingContext?.semanticState,
      summary.threadState?.activeSemanticFrame,
      summary.latestConversationMeaning
    ];

    const found = candidates.find(frame => frame && typeof frame === "object");
    if (!found) return null;

    const operation =
      found.operation ||
      found.intent ||
      found.responseIntent ||
      found.questionType ||
      found.situationFrame ||
      "unknown";

    const slots = {
      object:
        found.object ||
        found.activeObject ||
        found.resolvedObject ||
        found.topic ||
        found.subject ||
        null,

      options:
        found.options ||
        found.choices ||
        found.alternatives ||
        null,

      goal:
        found.goal ||
        found.activeGoal ||
        found.resolvedGoal ||
        null,

      problem:
        found.problem ||
        found.issue ||
        found.activeIssue ||
        found.resolvedIssue ||
        null,

      criteria:
        found.criteria ||
        found.values ||
        found.constraints ||
        null,

      audience:
        found.audience ||
        found.target ||
        null
    };

    const requiredSlots =
      Array.isArray(found.requiredSlots)
        ? found.requiredSlots
        : this.requiredSlotsFor(operation);

    const missingSlots =
      Array.isArray(found.missingSlots)
        ? found.missingSlots
        : requiredSlots.filter(slot => !slots[slot]);

    return {
      source: found.source || "provided_semantic_frame",
      operation,
      slots,
      requiredSlots,
      missingSlots,
      isComplete: missingSlots.length === 0,
      needsThread: Boolean(found.needsThread || found.requiresPriorContext || found.needsPriorFrame)
    };
  },

  buildFallbackFrame(text = "", hasThread = false) {
    const operation = this.detectFallbackOperation(text);
    const slots = this.extractFallbackSlots(text);
    const requiredSlots = this.requiredSlotsFor(operation);
    const missingSlots = requiredSlots.filter(slot => !slots[slot]);

    return {
      source: "fallback_frame_builder",
      operation,
      slots,
      requiredSlots,
      missingSlots,
      isComplete:
        operation === "unknown"
          ? this.meaningfulTokens(text).length >= 2
          : missingSlots.length === 0,
      needsThread:
        hasThread &&
        operation !== "unknown" &&
        missingSlots.length > 0 &&
        this.hasReferenceLanguage(text)
    };
  },

  requiredSlotsFor(operation = "unknown") {
    const op = String(operation || "unknown").toLowerCase();

    if (op.includes("recommend")) return ["object"];
    if (op.includes("compare")) return ["options"];
    if (op.includes("plan")) return ["goal"];
    if (op.includes("explain")) return ["object"];
    if (op.includes("repair") || op.includes("debug") || op.includes("revision")) return ["problem"];
    if (op.includes("decision") || op.includes("permission")) return ["object"];

    return [];
  },

  detectFallbackOperation(text = "") {
    const shape = this.questionShape(text);

    if (shape.asksForChoice) return "recommendation";
    if (shape.asksForComparison) return "comparison";
    if (shape.asksForPlan) return "planning";
    if (shape.asksForExplanation) return "explanation";
    if (shape.asksForRepair) return "repair_or_revision";
    if (shape.asksForPermission) return "permission_or_decision";

    return "unknown";
  },

  questionShape(text = "") {
    return {
      asksForChoice:
        /\b(which|choose|pick|recommend|suggest|prefer)\b/.test(text),

      asksForComparison:
        /\b(compare|difference|versus|vs|better|worse|more|less)\b/.test(text),

      asksForPlan:
        /\b(plan|strategy|roadmap|steps|schedule|routine)\b/.test(text) ||
        /^(how do i|how can i|what should i do)\b/.test(text),

      asksForExplanation:
        /^(why|how come|explain|what does|break down)\b/.test(text),

      asksForRepair:
        /\b(fix|debug|repair|solve|update|rewrite|replace|broken|error|issue|problem)\b/.test(text),

      asksForPermission:
        /^(can i|should i|do i|is it okay|would it be okay)\b/.test(text)
    };
  },

  extractFallbackSlots(text = "") {
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
    const tokens = this.meaningfulTokens(cleaned);

    if (/\d/.test(text)) return text;
    if (tokens.length >= 2) return tokens.join(" ");

    return null;
  },

  extractOptions(text = "") {
    if (/\b(which one|which option|the first one|the second one|the other one)\b/.test(text)) {
      return null;
    }

    const options = text
      .split(/\s+or\s+|\s+vs\s+|\s+versus\s+|\s+between\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    return options.length >= 2 ? options : null;
  },

  extractGoal(text = "") {
    if (
      /\b(to|so i can|in order to)\b/.test(text) ||
      /\b(lose|gain|build|make|create|fix|improve|reduce|increase|get back)\b/.test(text)
    ) {
      return text;
    }

    return null;
  },

  extractProblem(text = "") {
    if (/\b(error|bug|broken|not working|issue|problem|fail|failed|wrong)\b/.test(text)) {
      return text;
    }

    return null;
  },

  extractCriteria(text = "") {
    const criteria = [];

    if (/\b(best|ideal|recommend|prefer)\b/.test(text)) criteria.push("preference");
    if (/\b(cheap|cost|budget|affordable)\b/.test(text)) criteria.push("cost");
    if (/\b(fast|quick|soon|urgent)\b/.test(text)) criteria.push("speed");
    if (/\b(safe|healthy|risk|danger)\b/.test(text)) criteria.push("safety_or_health");
    if (/\b(reliable|effective|strong|quality)\b/.test(text)) criteria.push("quality");

    return criteria;
  },

  extractAudience(text = "") {
    if (/\b(for me|my situation|my case|in my case|for us)\b/.test(text)) {
      return "user_specific";
    }

    return null;
  },

  isFrameComplete(frame = {}) {
    if (!frame) return false;
    if (frame.isComplete === true) return true;

    const requiredSlots = Array.isArray(frame.requiredSlots)
      ? frame.requiredSlots
      : [];

    const missingSlots = Array.isArray(frame.missingSlots)
      ? frame.missingSlots
      : [];

    return requiredSlots.length === 0 || missingSlots.length === 0;
  },

  frameNeedsThread(frame = {}, hasThread = false, hasReferenceLanguage = false) {
    if (!hasThread) return false;
    if (frame.needsThread === true) return true;

    const missingSlots = Array.isArray(frame.missingSlots)
      ? frame.missingSlots
      : [];

    return (
      frame.operation !== "unknown" &&
      missingSlots.length > 0 &&
      hasReferenceLanguage
    );
  },

  frameHasFilledCoreSlot(frame = {}) {
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
      /\b(it|this|that|they|them|those|these|same|same thing)\b/.test(text) ||
      /\b(which one|which option|the first one|the second one|the other one)\b/.test(text) ||
      /\b(for me|my situation|my case|in this case|based on that)\b/.test(text) ||
      /^(why|how|what about|what if|then what|really|okay but|so)\b/.test(text)
    );
  },

  isOnlyReference(text = "") {
    const cleaned = text
      .replace(/[?!.]/g, "")
      .replace(/\b(what|which|is|the|do|you|recommend|should|i|can|me|for|best|better)\b/g, "")
      .trim();

    if (!cleaned) return true;

    return /^(it|this|that|they|them|one|same|option)$/.test(cleaned);
  },

  scoreSemanticDependency({
    hasThread = false,
    frame = {},
    frameNeedsThread = false,
    frameComplete = false,
    hasReferenceLanguage = false,
    isTinyFollowUp = false,
    hasStandaloneObject = false,
    wordCount = 0
  } = {}) {
    if (!hasThread) return 0;

    let score = 0;

    if (frameNeedsThread) score += 0.5;
    if (frame.missingSlots?.length) score += 0.25;
    if (hasReferenceLanguage) score += 0.2;
    if (isTinyFollowUp) score += 0.2;
    if (wordCount <= 8 && !hasStandaloneObject) score += 0.15;

    if (frameComplete) score -= 0.25;
    if (hasStandaloneObject && wordCount >= 7) score -= 0.2;

    return this.clamp01(score);
  },

  scoreStandaloneMeaning({
    wordCount = 0,
    frame = {},
    frameComplete = false,
    hasStandaloneObject = false,
    hasReferenceLanguage = false
  } = {}) {
    let score = 0;

    if (wordCount >= 7) score += 0.2;
    if (wordCount >= 12) score += 0.15;
    if (hasStandaloneObject) score += 0.3;
    if (frameComplete) score += 0.3;
    if (frame.operation !== "unknown") score += 0.1;

    if (hasReferenceLanguage && !frameComplete) score -= 0.3;

    return this.clamp01(score);
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

    continuityBoost += Math.round(context.semanticDependencyScore * 55);
    directBoost += Math.round(context.standaloneMeaningScore * 50);

    if (context.frameNeedsThread) continuityBoost += 40;
    if (context.frame?.missingSlots?.length) continuityBoost += 20;
    if (context.isTinyFollowUp) continuityBoost += 25;
    if (context.hasReferenceLanguage) continuityBoost += 15;

    if (context.frameComplete) directBoost += 35;
    if (context.hasStandaloneObject) directBoost += 25;
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

    if (context.frameNeedsThread && context.hasThread) {
      return "continuity_follow_up";
    }

    if (context.frameComplete && context.standaloneMeaningScore >= 0.6) {
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
    if (lane === "continuity_follow_up" && context.frameNeedsThread) {
      return "Current message has an operation but missing required semantic slots, so it needs active thread context.";
    }

    if (lane === "direct_current_turn" && context.frameComplete) {
      return "Current message has enough filled semantic slots to go directly to the Situation Map.";
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