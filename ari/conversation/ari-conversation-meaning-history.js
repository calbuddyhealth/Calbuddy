// ari/continuity/ari-conversation-meaning-history.js
// Purpose: Preserve conversation meaning across turns.
// V2.0.0 — Active Semantic Timeline / Follow-up Ready / Living State Layer

window.Ari = window.Ari || {};

window.Ari.conversationMeaningHistory = {
  version: "2.0.0",
  maxHistory: 16,

  build(summary = {}) {
    const raw = this.getRawText(summary);
    const resolvedUserQuestion = summary.resolvedUserQuestion || raw;

    const previous =
      summary.conversationMeaningHistory ||
      summary.threadState?.conversationMeaningHistory ||
      [];

    const previousLatest =
      summary.latestConversationMeaning ||
      previous[previous.length - 1] ||
      null;

    const entry = this.createEntry({
      summary,
      raw,
      resolvedUserQuestion,
      previousLatest
    });

    const history = [...previous, entry]
      .filter(Boolean)
      .slice(-this.maxHistory);

    const activeSemanticTimeline = this.buildSemanticTimeline(history);
    const activeSemanticFrame = this.buildActiveSemanticFrame(history, entry);
    const conversationMeaningFocus = this.inferFocus(activeSemanticFrame, entry);
    const conversationMeaningOpenLoops = this.detectOpenLoops(history);
    const priorMeaningForFollowUp = this.selectPriorMeaningForFollowUp({
      summary,
      history,
      entry,
      previousLatest
    });

    return {
      conversationMeaningHistoryRan: true,
      conversationMeaningHistoryVersion: this.version,
      source: "ari-conversation-meaning-history",
      conversationMeaningHistorySource: "ari-conversation-meaning-history",

      latestConversationMeaning: entry,
      conversationMeaningHistory: history,

      activeSemanticTimeline,
      activeSemanticFrame,
      conversationMeaningFocus,
      conversationMeaningOpenLoops,
      priorMeaningForFollowUp,

      handoff: {
        readyForThreadQuestionGenerator: Boolean(priorMeaningForFollowUp),
        readyForEntityResolver: true,
        readyForContextAssembler: true,
        shouldUseForFollowUp:
          Boolean(priorMeaningForFollowUp) &&
          this.currentTurnNeedsPriorContext(summary, raw)
      }
    };
  },

  createEntry({ summary, raw, resolvedUserQuestion, previousLatest }) {
    const situationMap = summary.situationMap || {};
    const triage = summary.triage || {};
    const contract = summary.situationContract || {};
    const reasoning = summary.reasoning || {};

    const activeSubject =
      summary.resolvedPrimarySubject ||
      summary.activeSubject ||
      summary.threadActiveSubject ||
      summary.continuityActiveThread?.workingContext?.activeSubject ||
      previousLatest?.activeSubject ||
      null;

    const activeIssue =
      summary.activeIssue ||
      summary.threadActiveIssue ||
      situationMap.situations?.[0] ||
      summary.continuityActiveThread?.workingContext?.activeIssue ||
      previousLatest?.activeIssue ||
      null;

    const activeGoal =
      summary.activeGoal ||
      summary.threadActiveGoal ||
      summary.continuityActiveThread?.workingContext?.activeGoal ||
      previousLatest?.activeGoal ||
      null;

    const primaryLane =
      contract.primary ||
      triage.primaryLane ||
      summary.triagePrimaryLane ||
      null;

    const primaryNeed =
      summary.primaryHumanNeed ||
      situationMap.primaryNeed ||
      situationMap.needs?.[0] ||
      null;

    const ariRecommendation =
      summary.reasoningRecommendation ||
      reasoning.recommendation?.summary ||
      reasoning.executiveConclusion?.recommendation ||
      null;

    const ariReason =
      summary.reasoningAnswer ||
      reasoning.executiveConclusion?.reason ||
      contract.reasons?.[0] ||
      null;

    const resolved =
      Boolean(
        summary.finalResponse ||
        ariRecommendation ||
        contract.clarity?.needed === false
      );

    const entry = {
      turnId: this.makeTurnId(),
      userText: raw,
      resolvedUserQuestion,

      activeSubject,
      activeIssue,
      activeGoal,

      situationFamily:
        situationMap.situationFamily ||
        summary.situationFamily ||
        null,

      primaryNeed,
      primaryLane,

      semanticLabel: this.makeSemanticLabel({
        activeSubject,
        activeIssue,
        activeGoal,
        primaryNeed,
        primaryLane
      }),

      userIntent:
        summary.conversationIntent ||
        summary.conversationType ||
        null,

      ariRecommendation,
      ariReason,

      resolved,
      openLoop: !resolved,

      finalResponse: summary.finalResponse || null,
      createdAt: new Date().toISOString()
    };

    entry.activeSemanticFrame = {
      subject: entry.activeSubject,
      issue: entry.activeIssue,
      goal: entry.activeGoal,
      need: entry.primaryNeed,
      lane: entry.primaryLane,
      label: entry.semanticLabel
    };

    return entry;
  },

  buildSemanticTimeline(history = []) {
    return history.map(item => ({
      turnId: item.turnId,
      userText: item.userText,
      resolvedUserQuestion: item.resolvedUserQuestion,
      subject: item.activeSubject,
      issue: item.activeIssue,
      goal: item.activeGoal,
      need: item.primaryNeed,
      lane: item.primaryLane,
      label: item.semanticLabel,
      resolved: item.resolved,
      createdAt: item.createdAt
    }));
  },

  buildActiveSemanticFrame(history = [], latest = null) {
    const usable = [...history].reverse();

    const findLast = key =>
      usable.find(item => item?.[key])?.[key] || null;

    return {
      subject: latest?.activeSubject || findLast("activeSubject"),
      issue: latest?.activeIssue || findLast("activeIssue"),
      goal: latest?.activeGoal || findLast("activeGoal"),
      need: latest?.primaryNeed || findLast("primaryNeed"),
      lane: latest?.primaryLane || findLast("primaryLane"),
      label: latest?.semanticLabel || findLast("semanticLabel"),
      latestTurnId: latest?.turnId || null,
      confidence: this.scoreFrameConfidence(latest)
    };
  },

  inferFocus(frame = {}, latest = {}) {
    return (
      frame.goal ||
      frame.issue ||
      frame.subject ||
      latest.resolvedUserQuestion ||
      latest.userText ||
      null
    );
  },

  detectOpenLoops(history = []) {
    return history
      .filter(item => item.openLoop || item.resolved === false)
      .slice(-6)
      .map(item => ({
        turnId: item.turnId,
        unresolvedQuestion: item.resolvedUserQuestion || item.userText,
        subject: item.activeSubject,
        issue: item.activeIssue,
        goal: item.activeGoal,
        lane: item.primaryLane,
        createdAt: item.createdAt
      }));
  },

  selectPriorMeaningForFollowUp({ summary, history, entry, previousLatest }) {
    if (!this.currentTurnNeedsPriorContext(summary, entry.userText)) {
      return null;
    }

    const candidates = [...history]
      .filter(item => item.turnId !== entry.turnId)
      .reverse();

    return (
      candidates.find(item => item.activeIssue || item.activeGoal || item.ariRecommendation) ||
      previousLatest ||
      null
    );
  },

  currentTurnNeedsPriorContext(summary = {}, raw = "") {
    const text = this.clean(raw);

    if (summary.lane === "continuity_follow_up") return true;
    if (summary.laneSplit?.lane === "continuity_follow_up") return true;
    if (summary.continuityCurrentTurn?.needsPriorContext) return true;

    return (
      text.split(/\s+/).filter(Boolean).length <= 10 &&
      /^(why|how|what|what about|what if|then what|should i|do i|can i)\b/.test(text)
    );
  },

  makeSemanticLabel({ activeSubject, activeIssue, activeGoal, primaryNeed, primaryLane }) {
    const parts = [
      this.valueOf(activeSubject),
      this.valueOf(activeIssue),
      this.valueOf(activeGoal),
      primaryNeed,
      primaryLane
    ].filter(Boolean);

    return parts.length ? parts.join(" | ") : "general_conversation";
  },

  scoreFrameConfidence(latest = {}) {
    let score = 0.45;
    if (latest?.activeSubject) score += 0.15;
    if (latest?.activeIssue) score += 0.15;
    if (latest?.activeGoal) score += 0.1;
    if (latest?.primaryNeed) score += 0.1;
    if (latest?.primaryLane) score += 0.05;
    return Math.min(0.95, Number(score.toFixed(2)));
  },

  getLastMeaning(summary = {}) {
    const history =
      summary.conversationMeaningHistory ||
      summary.threadState?.conversationMeaningHistory ||
      [];

    return history[history.length - 1] || null;
  },

  getRawText(summary = {}) {
    return summary.userMessage || summary.message || summary.input || "";
  },

  valueOf(value) {
    if (!value) return null;
    if (typeof value === "string") return value;
    return value.label || value.value || value.type || null;
  },

  makeTurnId() {
    return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  clean(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI CONVERSATION MEANING HISTORY LOADED:",
  window.Ari.conversationMeaningHistory?.version
);