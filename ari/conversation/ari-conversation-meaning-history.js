// ari/continuity/ari-conversation-meaning-history.js
// Purpose: Preserve conversation meaning across turns without poisoning new topics.
// V2.1.1 — Clean Meaning Ledger / Safe Inheritance / Topic Shift Protection

window.Ari = window.Ari || {};

window.Ari.conversationMeaningHistory = {
  version: "2.1.1",
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

    const currentNeedsPriorContext = this.currentTurnNeedsPriorContext(summary, raw);
    const topicShiftDetected = this.detectTopicShift(summary, raw, previousLatest);

    const entry = this.createEntry({
      summary,
      raw,
      resolvedUserQuestion,
      previousLatest,
      currentNeedsPriorContext,
      topicShiftDetected
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
      previousLatest,
      currentNeedsPriorContext,
      topicShiftDetected
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

      currentNeedsPriorContext,
      topicShiftDetected,

      handoff: {
        readyForThreadQuestionGenerator: Boolean(priorMeaningForFollowUp),
        readyForEntityResolver: true,
        readyForContextAssembler: true,
        shouldUseForFollowUp:
          Boolean(priorMeaningForFollowUp) &&
          currentNeedsPriorContext &&
          !topicShiftDetected,
        topicShiftDetected,
        currentNeedsPriorContext
      }
    };
  },

  createEntry({
    summary,
    raw,
    resolvedUserQuestion,
    previousLatest,
    currentNeedsPriorContext,
    topicShiftDetected
  }) {
    const situationMap = summary.situationMap || {};
    const triage = summary.triage || summary.ariTriage || {};
    const contract = summary.situationContract || {};
    const reasoning = summary.reasoning || {};

    const mayInherit =
      currentNeedsPriorContext === true &&
      topicShiftDetected !== true;

    const directSubject = this.cleanMeaningValue(
      summary.resolvedPrimarySubject ||
      summary.activeSubject ||
      summary.threadActiveSubject ||
      summary.continuityActiveThread?.workingContext?.activeSubject ||
      null
    );

    const directIssue = this.cleanMeaningValue(
      summary.activeIssue ||
      summary.threadActiveIssue ||
      situationMap.situations?.[0] ||
      summary.continuityActiveThread?.workingContext?.activeIssue ||
      null
    );

    const directGoal = this.cleanMeaningValue(
      summary.activeGoal ||
      summary.threadActiveGoal ||
      summary.continuityActiveThread?.workingContext?.activeGoal ||
      null
    );

    const activeSubject =
      directSubject ||
      (mayInherit ? this.cleanMeaningValue(previousLatest?.activeSubject) : null);

    const activeIssue =
      directIssue ||
      (mayInherit ? this.cleanMeaningValue(previousLatest?.activeIssue) : null);

    const activeGoal =
      directGoal ||
      (mayInherit ? this.cleanMeaningValue(previousLatest?.activeGoal) : null);

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

      currentNeedsPriorContext,
      topicShiftDetected,
      inheritedPreviousMeaning: mayInherit,

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

      finalResponse: this.getSafeFinalResponse(summary),
      createdAt: new Date().toISOString()
    };

    entry.activeSemanticFrame = {
      subject: entry.activeSubject,
      issue: entry.activeIssue,
      goal: entry.activeGoal,
      need: entry.primaryNeed,
      lane: entry.primaryLane,
      label: entry.semanticLabel,
      inheritedPreviousMeaning: entry.inheritedPreviousMeaning,
      topicShiftDetected: entry.topicShiftDetected
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
      topicShiftDetected: item.topicShiftDetected,
      inheritedPreviousMeaning: item.inheritedPreviousMeaning,
      createdAt: item.createdAt
    }));
  },

  buildActiveSemanticFrame(history = [], latest = null) {
    const usable = [...history].reverse();

    const findLast = key =>
      usable.find(item => this.cleanMeaningValue(item?.[key]))?.[key] || null;

    return {
      subject: latest?.activeSubject || findLast("activeSubject"),
      issue: latest?.activeIssue || findLast("activeIssue"),
      goal: latest?.activeGoal || findLast("activeGoal"),
      need: latest?.primaryNeed || findLast("primaryNeed"),
      lane: latest?.primaryLane || findLast("primaryLane"),
      label: latest?.semanticLabel || findLast("semanticLabel"),
      latestTurnId: latest?.turnId || null,
      topicShiftDetected: latest?.topicShiftDetected === true,
      inheritedPreviousMeaning: latest?.inheritedPreviousMeaning === true,
      confidence: this.scoreFrameConfidence(latest)
    };
  },

  inferFocus(frame = {}, latest = {}) {
    return (
      this.cleanMeaningValue(frame.goal) ||
      this.cleanMeaningValue(frame.issue) ||
      this.cleanMeaningValue(frame.subject) ||
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

  selectPriorMeaningForFollowUp({
    summary,
    history,
    entry,
    previousLatest,
    currentNeedsPriorContext,
    topicShiftDetected
  }) {
    if (!currentNeedsPriorContext) return null;
    if (topicShiftDetected) return null;

    const candidates = [...history]
      .filter(item => item.turnId !== entry.turnId)
      .reverse();

    return (
      candidates.find(item =>
        this.cleanMeaningValue(item.activeSubject) ||
        this.cleanMeaningValue(item.activeIssue) ||
        this.cleanMeaningValue(item.activeGoal) ||
        item.ariRecommendation
      ) ||
      previousLatest ||
      null
    );
  },

  currentTurnNeedsPriorContext(summary = {}, raw = "") {
    const text = this.clean(raw);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (this.isConcreteNewSituation(text)) return false;

    if (summary.lane === "continuity_follow_up") return true;
    if (summary.laneSplit?.lane === "continuity_follow_up") return true;
    if (summary.continuityCurrentTurn?.needsPriorContext) return true;

    const semantic =
      summary.semanticSummary ||
      summary.semanticFrame?.semanticSummary ||
      summary.activeSemanticFrame?.semanticSummary ||
      {};

    if (
      semantic.continuity?.isContinuation === true &&
      semantic.responseCharacteristics?.expectsFollowUpContext === true &&
      !this.isConcreteNewSituation(text)
    ) {
      return true;
    }

    return (
      wordCount <= 10 &&
      /^(why|how|what|what about|what if|then what|should i|do i|can i|same one|other one|continue|next)\b/.test(text)
    );
  },

  detectTopicShift(summary = {}, raw = "", previousLatest = null) {
    const text = this.clean(raw);
    if (!previousLatest) return false;

    if (this.isConcreteNewSituation(text)) return true;

    const previousText = this.clean(
      previousLatest.resolvedUserQuestion ||
      previousLatest.userText ||
      previousLatest.semanticLabel ||
      ""
    );

    if (!previousText) return false;

    const newDomain = this.detectDomain(text);
    const oldDomain = this.detectDomain(previousText);

    if (newDomain && oldDomain && newDomain !== oldDomain) return true;

    return false;
  },

  isConcreteNewSituation(text = "") {
    const clean = this.clean(text);
    const wordCount = clean.split(/\s+/).filter(Boolean).length;

    if (wordCount >= 14 && /\b(today|yesterday|tomorrow|right now|just|currently|this morning|tonight)\b/.test(clean)) {
      return true;
    }

    if (
      wordCount >= 12 &&
      /\b(my wife|my husband|my spouse|my partner|my dad|my father|my mom|my mother|my cat|my dog|my boss|my job|my car|my app|my code)\b/.test(clean)
    ) {
      return true;
    }

    if (
      wordCount >= 12 &&
      /\b(got married|courthouse|pregnant|pain|fever|diarrhea|cough|car|work|job|github|code|file|bug|error|app|supabase|vercel)\b/.test(clean)
    ) {
      return true;
    }

    return false;
  },

  detectDomain(text = "") {
    const clean = this.clean(text);

    if (/\b(wife|husband|spouse|partner|married|courthouse|relationship|family|kids|children)\b/.test(clean)) {
      return "relationship_family";
    }

    if (/\b(code|file|bug|error|github|engine|function|pipeline|app|supabase|vercel|javascript|html|css)\b/.test(clean)) {
      return "builder";
    }

    if (/\b(pain|fever|bleeding|pregnant|chest|breathing|faint|vomit|diarrhea|swallow|cough|symptom)\b/.test(clean)) {
      return "medical_body";
    }

    if (/\b(cat|dog|pet|kitten|puppy|vet)\b/.test(clean)) {
      return "pet";
    }

    if (/\b(money|budget|rent|credit|loan|car|vehicle|lease|payment)\b/.test(clean)) {
      return "finance_or_vehicle";
    }

    if (/\b(meaning of life|purpose|values|wisdom|truth|important)\b/.test(clean)) {
      return "meaning_wisdom";
    }

    return null;
  },

  makeSemanticLabel({ activeSubject, activeIssue, activeGoal, primaryNeed, primaryLane }) {
    const parts = [
      this.cleanMeaningValue(activeSubject),
      this.cleanMeaningValue(activeIssue),
      this.cleanMeaningValue(activeGoal),
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

    if (latest?.topicShiftDetected) score += 0.05;
    if (latest?.inheritedPreviousMeaning) score -= 0.08;

    return Math.min(0.95, Math.max(0.35, Number(score.toFixed(2))));
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

  cleanMeaningValue(value) {
    const raw = this.valueOf(value);
    const clean = this.clean(raw);

    if (!clean) return null;

    const badExact = [
      "the user",
      "user",
      "self",
      "me",
      "i",
      "my",
      "general",
      "general understanding",
      "general_understanding",
      "information_seeking",
      "follow_up_context_available",
      "active situation",
      "current situation",
      "unknown",
      "none",
      "null",
      "continuation",
      "continue_prior_context"
    ];

    if (badExact.includes(clean)) return null;
    if (/^active subject:\s*(the user|user|self)\b/.test(clean)) return null;

    return raw;
  },

  valueOf(value) {
    if (!value) return null;
    if (typeof value === "string") return value;

    return (
      value.label ||
      value.value ||
      value.surface ||
      value.claim ||
      value.text ||
      value.type ||
      null
    );
  },

getSafeFinalResponse(summary = {}) {
  const candidates = [
    summary.languageBody,
    summary.languageSections?.[0],
    summary.composerResult?.finalResponse,
    summary.composerResult?.languageBody,
    summary.blueprintWriterDraft,
    summary.aiWriterDraft,
    summary.finalResponse
  ];

  for (const candidate of candidates) {
    const text = String(candidate || "").trim();
    if (!text) continue;
    if (this.isDiagnosticPreview(text)) continue;
    return text;
  }

  return null;
},

isDiagnosticPreview(text = "") {
  const t = String(text || "").toLowerCase();

  return (
    /^mode:\s*\w+/i.test(t) &&
    t.includes("domain:") &&
    t.includes("intent:") &&
    t.includes("direct answer:")
  );
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