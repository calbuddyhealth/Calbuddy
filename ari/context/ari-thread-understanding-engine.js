// ari/context/ari-thread-understanding-engine.js
// Ari Thread Understanding Engine
// Purpose: Preserve active working context across turns.
// V4.0.0 — Context Memory Only / No Routing / No Intent Authority / No Fake Placeholders

window.Ari = window.Ari || {};

window.AriThreadUnderstandingEngine = {
  version: "4.0.0",

  understand(input = {}) {
    const summary = input.summary || input || {};

    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const previousWorkingContext =
      summary.workingContext ||
      summary.threadUnderstanding?.workingContext ||
      window.Ari.workingContext ||
      this.emptyWorkingContext();

    const recentMessages = this.getRecentMessages(summary, currentText);
    const currentTurn = this.readTurn(currentText);
    const reconstructedContext = this.rebuildContextFromMessages(recentMessages);

    const topicTransition = this.detectTopicTransition({
      previousWorkingContext,
      reconstructedContext,
      currentTurn
    });

    const workingContext = this.mergeWorkingContext({
      previousWorkingContext,
      reconstructedContext,
      currentTurn,
      currentText,
      topicTransition
    });

    const stateChange = this.detectStateChange(currentTurn);

    this.updateUnresolvedItems(workingContext, currentTurn, stateChange);

    const resolvedMeaning = this.resolveMeaning({
      currentText,
      currentTurn,
      workingContext,
      stateChange
    });

    const threadUnderstanding = {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      source: "ari-thread-understanding-engine",

      currentText,
      recentMessages,

      currentTurn,
      workingContext,
      resolvedMeaning,

      stateChange,
      topicTransition,

      activeSubject: workingContext.activeSubject,
      activeObject: workingContext.activeObject,
      activeIssue: workingContext.activeIssue,
      activeGoal: workingContext.activeGoal,

      activeConstraints: workingContext.activeConstraints,
      activeAttempts: workingContext.activeAttempts,
      unresolvedItems: workingContext.unresolvedItems,

      domainSignals: workingContext.domainSignals,

      impliedQuestion: null,

      confidence: this.scoreConfidence({
        recentMessages,
        workingContext,
        resolvedMeaning,
        stateChange,
        topicTransition
      }),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "recommendation",
        "medicalEscalation",
        "responseShape",
        "intent",
        "conversationIntent"
      ]
    };

    window.Ari.workingContext = workingContext;
    window.Ari.threadUnderstanding = threadUnderstanding;

    return {
      threadUnderstandingRan: true,
      threadUnderstandingVersion: this.version,
      threadUnderstandingSource: "ari-thread-understanding-engine",

      threadUnderstanding,
      workingContext,
      threadWorkingContext: workingContext,

      threadActiveSubject: workingContext.activeSubject,
      threadActiveObject: workingContext.activeObject,
      threadActiveIssue: workingContext.activeIssue,
      threadActiveGoal: workingContext.activeGoal,

      threadStateChange: stateChange,
      threadTopicTransition: topicTransition,
      threadResolvedMeaning: resolvedMeaning,
      threadImpliedQuestion: null,
      threadRecentMessages: recentMessages,

      authority: "advisory_context_only"
    };
  },

  emptyWorkingContext() {
    return {
      activeSubject: null,
      activeObject: null,
      activeIssue: null,
      activeGoal: null,

      activeConstraints: [],
      activeAttempts: [],
      unresolvedItems: [],

      domainSignals: [],
      timeline: [],

      lastUserText: null,
      updatedAt: null
    };
  },

  getRecentMessages(summary = {}, currentText = "") {
    const continuityMessages =
      summary.continuityState?.lastMessages ||
      summary.threadState?.lastMessages ||
      [];

    const fromContinuity = continuityMessages
      .map(m => this.clean(m.text || m.claim || ""))
      .filter(Boolean);

    const facts = Array.isArray(summary.activeThreadFacts)
      ? summary.activeThreadFacts
      : [];

    const fromFacts = facts
      .filter(f => f?.type === "recent_message" && f.claim)
      .map(f => this.clean(f.claim))
      .filter(Boolean);

    return [...fromContinuity, ...fromFacts, currentText]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(-10);
  },

  readTurn(text = "") {
    const clean = this.clean(text);
    const lower = clean.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);

    return {
      raw: text,
      clean,
      lower,
      wordCount: words.length,

      isQuestion:
        lower.includes("?") ||
        /^(what|why|how|when|where|should|can|could|do|does|is|are|will|would|who)\b/.test(lower),

      isShortFollowUp: words.length <= 12,

      hasExplicitReset:
        /\b(nevermind|never mind|forget it|different topic|new question|unrelated|switch topics|start over)\b/.test(lower),

      hasContinuationCue:
        /\b(and|also|what if|but what if|still|then|so|okay but|what about|next|continue)\b/.test(lower),

      signals: this.extractSignals(lower, clean)
    };
  },

  extractSignals(lowerText = "", cleanText = "") {
    const signals = [];

    const add = (category, type, value, evidence, confidence = 0.7, data = {}) => {
      if (!value) return;

      signals.push({
        category,
        type,
        value,
        evidence,
        confidence,
        source: "ari-thread-understanding-engine",
        ...data
      });
    };

    this.detectConcreteSubjects(lowerText, cleanText, add);
    this.detectConcreteObjects(lowerText, cleanText, add);
    this.detectConcreteIssues(lowerText, cleanText, add);
    this.detectConcreteGoals(lowerText, cleanText, add);
    this.detectConcreteConstraints(lowerText, cleanText, add);
    this.detectConcreteAttempts(lowerText, cleanText, add);
    this.detectDomainSignals(lowerText, cleanText, add);

    return signals;
  },
    detectConcreteSubjects(lowerText = "", cleanText = "", add) {
    const patterns = [
      { regex: /\bmy father\b|\bmy dad\b/, label: "my father" },
      { regex: /\bmy mother\b|\bmy mom\b/, label: "my mother" },
      { regex: /\bmy wife\b/, label: "my wife" },
      { regex: /\bmy husband\b/, label: "my husband" },
      { regex: /\bmy fianc[eé]\b/, label: "my fiancé" },
      { regex: /\bmy girlfriend\b/, label: "my girlfriend" },
      { regex: /\bmy boyfriend\b/, label: "my boyfriend" },
      { regex: /\bmy cat\b/, label: "my cat" },
      { regex: /\bmy dog\b/, label: "my dog" }
    ];

    patterns.forEach(p => {
      if (p.regex.test(lowerText)) {
        add(
          "subject",
          "named_subject",
          p.label,
          p.label,
          0.9,
          { label: p.label }
        );
      }
    });

    if (/\b(i|me|my)\b/.test(lowerText)) {
      add(
        "subject",
        "self_reference",
        "self",
        "first person",
        0.8,
        { label: "the user" }
      );
    }
  },

  detectConcreteObjects(lowerText = "", cleanText = "", add) {
    const objectWords = [
      "car",
      "engine",
      "phone",
      "computer",
      "website",
      "app",
      "homepage",
      "button",
      "code",
      "file",
      "pipeline",
      "github",
      "supabase",
      "vercel"
    ];

    objectWords.forEach(word => {
      if (lowerText.includes(word)) {
        add(
          "object",
          "named_object",
          word,
          word,
          0.82,
          { label: word }
        );
      }
    });
  },

  detectConcreteIssues(lowerText = "", cleanText = "", add) {
    const issuePatterns = [
      "pain",
      "error",
      "bug",
      "broken",
      "not working",
      "crash",
      "bleeding",
      "fever",
      "diarrhea",
      "cough",
      "itch",
      "swallow",
      "problem"
    ];

    issuePatterns.forEach(issue => {
      if (lowerText.includes(issue)) {
        add(
          "issue",
          "mentioned_issue",
          issue,
          issue,
          0.82,
          { label: issue }
        );
      }
    });
  },

  detectConcreteGoals(lowerText = "", cleanText = "", add) {
    const match =
      cleanText.match(
        /\b(want to|need to|have to|must|plan to|trying to)\s+([^.!?]{1,80})/i
      );

    if (match) {
      add(
        "goal",
        "stated_goal",
        match[0],
        match[0],
        0.82,
        { label: match[0] }
      );
    }
  },

  detectConcreteConstraints(lowerText = "", cleanText = "", add) {
    const words = [
      "deadline",
      "budget",
      "money",
      "debt",
      "payment",
      "cost",
      "time",
      "understaffed"
    ];

    words.forEach(word => {
      if (lowerText.includes(word)) {
        add(
          "constraint",
          "constraint",
          word,
          word,
          0.75,
          { label: word }
        );
      }
    });
  },

  detectConcreteAttempts(lowerText = "", cleanText = "", add) {
    const match =
      cleanText.match(
        /\b(tried|already|tested|replaced|checked|reported|called)\b/i
      );

    if (match) {
      add(
        "attempt",
        "prior_attempt",
        match[0],
        match[0],
        0.75,
        { label: match[0] }
      );
    }
  },

  detectDomainSignals(lowerText = "", cleanText = "", add) {
    if (/\b(cat|dog|pet)\b/.test(lowerText)) {
      add("domain", "domain", "pet", "pet", 0.8);
    }

    if (/\b(code|javascript|html|css|github|supabase|pipeline|engine)\b/.test(lowerText)) {
      add("domain", "domain", "software", "software", 0.8);
    }

    if (/\b(pain|fever|bleeding|symptom|cough|diarrhea)\b/.test(lowerText)) {
      add("domain", "domain", "health", "health", 0.8);
    }
  },
    rebuildContextFromMessages(messages = []) {
    const context = this.emptyWorkingContext();

    for (const message of messages || []) {
      const turn = this.readTurn(message);
      this.applyTurnToContext(context, turn);
    }

    return context;
  },

  mergeWorkingContext({
    previousWorkingContext = {},
    reconstructedContext = {},
    currentTurn = {},
    currentText = "",
    topicTransition = {}
  }) {
    const merged = this.emptyWorkingContext();

    if (!topicTransition.switched) {
      this.copyContextInto(merged, previousWorkingContext);
    }

    this.copyContextInto(merged, reconstructedContext);
    this.applyTurnToContext(merged, currentTurn);

    merged.lastUserText = currentText;
    merged.updatedAt = new Date().toISOString();

    return merged;
  },

  copyContextInto(target = {}, source = {}) {
    if (!source || typeof source !== "object") return;

    target.activeSubject = this.chooseBest(target.activeSubject, source.activeSubject);
    target.activeObject = this.chooseBest(target.activeObject, source.activeObject);
    target.activeIssue = this.chooseBest(target.activeIssue, source.activeIssue);
    target.activeGoal = this.chooseBest(target.activeGoal, source.activeGoal);

    target.activeConstraints = this.mergeArrays(target.activeConstraints, source.activeConstraints);
    target.activeAttempts = this.mergeArrays(target.activeAttempts, source.activeAttempts);
    target.unresolvedItems = this.mergeArrays(target.unresolvedItems, source.unresolvedItems);
    target.domainSignals = this.mergeArrays(target.domainSignals, source.domainSignals);
    target.timeline = this.mergeArrays(target.timeline, source.timeline).slice(-12);
  },

  applyTurnToContext(context = {}, turn = {}) {
    for (const signal of turn.signals || []) {
      const node = this.makeNode(
        signal.category,
        signal.value,
        signal.label || signal.value,
        signal.evidence,
        signal.confidence
      );

    if (signal.category === "subject") {
  context.activeSubject = this.chooseBest(context.activeSubject, node);
}

if (signal.category === "object") {
  context.activeObject = this.chooseBest(context.activeObject, node);
}

if (signal.category === "issue") {
  context.activeIssue = this.chooseBest(context.activeIssue, node);
}

if (signal.category === "goal") {
  context.activeGoal = this.chooseBest(context.activeGoal, node);
}
      if (signal.category === "constraint") context.activeConstraints.push(node);
      if (signal.category === "attempt") context.activeAttempts.push(node);
      if (signal.category === "domain") context.domainSignals.push(signal);
    }

    if (turn.clean) {
      context.timeline.push({
        text: turn.clean,
        createdAt: new Date().toISOString()
      });
    }
  },

  detectStateChange(turn = {}) {
    if (turn.hasExplicitReset) {
      return { type: "topic_reset", confidence: 0.88 };
    }

    if (turn.hasContinuationCue || turn.isShortFollowUp) {
      return { type: "context_continued", confidence: 0.72 };
    }

    return { type: "none", confidence: 0.4 };
  },

  detectTopicTransition({
    previousWorkingContext = {},
    reconstructedContext = {},
    currentTurn = {}
  }) {
    if (currentTurn.hasExplicitReset) {
      return {
        switched: true,
        from: this.primaryDomain(previousWorkingContext),
        to: this.primaryDomain(reconstructedContext),
        reason: "User explicitly reset topic.",
        confidence: 0.88
      };
    }

    const previousDomain = this.primaryDomain(previousWorkingContext);
    const currentDomain = this.primaryDomain(reconstructedContext);

    if (
      previousDomain &&
      currentDomain &&
      previousDomain !== currentDomain &&
      !currentTurn.isShortFollowUp
    ) {
      return {
        switched: true,
        from: previousDomain,
        to: currentDomain,
        reason: "New dominant domain appeared.",
        confidence: 0.74
      };
    }

    return {
      switched: false,
      from: previousDomain || null,
      to: currentDomain || previousDomain || null,
      reason: "No clear topic switch.",
      confidence: 0.65
    };
  },

  updateUnresolvedItems(context = {}, turn = {}, stateChange = {}) {
    if (!Array.isArray(context.unresolvedItems)) {
      context.unresolvedItems = [];
    }

    if (!context.activeIssue) return;

    const existing = context.unresolvedItems.find(
      item => item.value === context.activeIssue.value
    );

    if (existing) {
      existing.lastMention = turn.clean || existing.lastMention;
      existing.updatedAt = new Date().toISOString();
      existing.status = stateChange.type === "topic_reset" ? "abandoned" : "active";
      return;
    }

    context.unresolvedItems.push({
      ...context.activeIssue,
      status: stateChange.type === "topic_reset" ? "abandoned" : "active",
      lastMention: turn.clean || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    context.unresolvedItems = context.unresolvedItems.slice(-8);
  },

  resolveMeaning({
    currentText = "",
    currentTurn = {},
    workingContext = {},
    stateChange = {}
  }) {
    return {
      isContextual: Boolean(
        currentTurn.isShortFollowUp ||
        currentTurn.hasContinuationCue ||
        stateChange.type === "context_continued"
      ),

      currentText,

      resolvedSubject: workingContext.activeSubject || null,
      resolvedObject: workingContext.activeObject || null,
      resolvedIssue: workingContext.activeIssue || null,
      resolvedGoal: workingContext.activeGoal || null,
      resolvedConstraints: workingContext.activeConstraints || [],
      resolvedAttempts: workingContext.activeAttempts || [],

      stateChange,

      confidence: this.meaningConfidence({
        workingContext,
        stateChange
      }),

      authority: "advisory_context_only"
    };
  },

  primaryDomain(context = {}) {
    const signals = Array.isArray(context.domainSignals)
      ? context.domainSignals
      : [];

    if (!signals.length) return null;

    return [...signals].sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    )[0]?.value || null;
  },

  makeNode(type, value, label, evidence, confidence = 0.6) {
    return {
      type,
      value,
      label: label || value,
      evidence,
      confidence,
      updatedAt: new Date().toISOString(),
      source: "ari-thread-understanding-engine"
    };
  },

  chooseBest(...nodes) {
    const valid = nodes.filter(Boolean);
    if (!valid.length) return null;

    return valid.sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    )[0];
  },

  mergeArrays(a = [], b = []) {
    const combined = [
      ...(Array.isArray(a) ? a : []),
      ...(Array.isArray(b) ? b : [])
    ];

    const seen = new Set();

    return combined.filter(item => {
      const key = JSON.stringify({
        type: item?.type,
        value: item?.value,
        label: item?.label,
        evidence: item?.evidence
      });

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  scoreConfidence({
    recentMessages = [],
    workingContext = {},
    resolvedMeaning = {},
    stateChange = {},
    topicTransition = {}
  }) {
    let score = 35;

    if (recentMessages.length >= 2) score += 10;
    if (workingContext.activeSubject) score += 10;
    if (workingContext.activeObject) score += 10;
    if (workingContext.activeIssue) score += 12;
    if (workingContext.activeGoal) score += 8;
    if ((workingContext.activeConstraints || []).length) score += 6;
    if ((workingContext.activeAttempts || []).length) score += 6;
    if (resolvedMeaning.isContextual) score += 6;
    if (stateChange.type && stateChange.type !== "none") score += 4;
    if (topicTransition.switched) score -= 8;

    return Math.max(25, Math.min(95, score));
  },

  meaningConfidence({ workingContext = {}, stateChange = {} }) {
    let score = 40;

    if (workingContext.activeSubject) score += 10;
    if (workingContext.activeObject) score += 10;
    if (workingContext.activeIssue) score += 12;
    if (workingContext.activeGoal) score += 8;
    if ((workingContext.activeConstraints || []).length) score += 6;
    if ((workingContext.activeAttempts || []).length) score += 6;
    if (stateChange?.type && stateChange.type !== "none") score += 4;

    return Math.max(25, Math.min(95, score));
  },

  clean(value = "") {
    return String(value || "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI THREAD UNDERSTANDING ENGINE LOADED:",
  window.AriThreadUnderstandingEngine?.version
);