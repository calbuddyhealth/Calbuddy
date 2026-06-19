// ari/context/ari-thread-question-generator.js
// Purpose: Resolve true follow-up questions using prior conversation meaning.
// V1.3.0 — Universal operation-based follow-up resolver / anti-self-poisoning

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.3.0",

  generate(input = {}) {
    const summary = input.summary || input || {};

    const raw =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = this.clean(raw);

    const packet = summary.continuityPacket || {};
    const thread =
      packet.activeThread?.workingContext ||
      packet.activeThread ||
      summary.threadState ||
      {};

    const needsContext =
      packet.currentTurn?.needsPriorContext === true ||
      summary.lane === "continuity_follow_up" ||
      summary.laneSplit?.lane === "continuity_follow_up";

    const operation = this.detectRequestedOperation(text);
    const standalone = this.detectStandaloneQuestion(text);

    if (!needsContext || standalone.isStandalone || operation === "none") {
      return this.noResolution(raw, standalone.reason || "Current turn does not safely require prior context.");
    }

    const inherited = this.findBestInheritedTopic({
      summary,
      packet,
      thread,
      currentText: text
    });

    if (!inherited?.text) {
      return this.noResolution(raw, "No safe prior topic found.");
    }

    const resolvedQuestion = this.composeResolvedQuestion({
      text,
      operation,
      anchor: inherited.text
    });

    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      threadQuestionGeneratorSource: "ari-thread-question-generator",
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: resolvedQuestion,

      currentTurnWasResolved: true,
      usedThreadContext: true,
      resolvedSubject: inherited.text,
      inheritedTopicSource: inherited.source,
      inheritedTopicScore: inherited.score,

      operation,

      resolutionType: "follow_up_question_resolved_from_prior_context",
      confidence: inherited.confidence,
      reason: "Follow-up was resolved using prior non-current conversation meaning.",

      threadQuestionResolutionType: "follow_up_question_resolved_from_prior_context",
      threadQuestionConfidence: inherited.confidence,
      threadQuestionReason: "Follow-up was resolved using prior non-current conversation meaning.",

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: resolvedQuestion,
        usedThreadContext: true,
        inheritedTopic: inherited.text,
        inheritedTopicSource: inherited.source,
        operation,
        confidence: inherited.confidence
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "resolve_current_question_only"
      }
    };
  },

  detectStandaloneQuestion(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);

    if (!clean) {
      return { isStandalone: true, reason: "Empty text." };
    }

    if (this.hasNewConcreteTopic(clean)) {
      return { isStandalone: true, reason: "Current turn contains a new concrete topic." };
    }

    if (words.length >= 12 && !this.hasReferenceWord(clean)) {
      return { isStandalone: true, reason: "Current turn is detailed enough to stand alone." };
    }

    return { isStandalone: false, reason: null };
  },

  detectRequestedOperation(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);

    if (!clean) return "none";
    if (words.length > 22 && !this.hasReferenceWord(clean)) return "none";

    if (/^why\b|how come|what caused|what causes/.test(clean)) return "explain_reason";
    if (/recommend|suggest|what would you do|what do you recommend|ideally/.test(clean)) return "recommend";
    if (/plan|steps|how do i|what should i do|what can i do|what else can i do/.test(clean)) return "action_plan";
    if (/compare|better|difference|versus| vs |which one|which is/.test(clean)) return "compare";
    if (/fix|debug|error|not working|broken|bug/.test(clean)) return "debug_fix";
    if (/continue|next|go on|keep going|then what|what next/.test(clean)) return "continue";
    if (/can i|should i|do i|is it okay|would it be okay/.test(clean)) return "permission_or_decision";
    if (/what about|what if/.test(clean)) return "scenario_check";
    if (this.hasReferenceWord(clean)) return "reference_resolution";

    return "none";
  },

  composeResolvedQuestion({ text = "", operation = "none", anchor = "" }) {
    const clean = this.clean(text);
    const topic = this.trimEndingPunctuation(anchor);

    switch (operation) {
      case "explain_reason":
        return `Why might ${topic}?`;

      case "recommend":
        return `What do you recommend for the user regarding ${topic}?`;

      case "action_plan":
        return `What plan should the user follow regarding ${topic}?`;

      case "compare":
        return `Compare the options or ideas in relation to ${topic}.`;

      case "debug_fix":
        return `How should the user fix or debug ${topic}?`;

      case "continue":
        return `Continue helping the user with ${topic}.`;

      case "permission_or_decision":
        return `${clean} — regarding ${topic}?`;

      case "scenario_check":
        return `${clean} — in the context of ${topic}?`;

      case "reference_resolution":
        return this.replaceReferenceWords(clean, topic);

      default:
        return `${clean} — regarding ${topic}?`;
    }
  },

  findBestInheritedTopic({ summary = {}, packet = {}, thread = {}, currentText = "" }) {
    const candidates = [];

    const add = (value, source, score = 0.5) => {
      const extracted = this.extractText(value);
      const text = this.cleanTopic(extracted);

      if (!text) return;
      if (this.isBadTopic(text, currentText)) return;

      candidates.push({
        text,
        source,
        score,
        confidence: this.scoreToConfidence(score)
      });
    };

    add(summary.priorMeaningForFollowUp?.resolvedUserQuestion, "prior_meaning_resolved_question", 1.0);
    add(summary.priorMeaningForFollowUp?.userText, "prior_meaning_user_text", 0.98);
    add(summary.priorMeaningForFollowUp?.activeIssue, "prior_meaning_active_issue", 0.94);
    add(summary.priorMeaningForFollowUp?.activeSubject, "prior_meaning_active_subject", 0.9);
    add(summary.priorMeaningForFollowUp?.situationFamily, "prior_meaning_situation_family", 0.84);

    add(thread.semanticState?.followUpAnchor, "thread_semantic_follow_up_anchor", 0.93);
    add(thread.semanticState?.activeClaim, "thread_semantic_active_claim", 0.9);
    add(thread.semanticState?.activeQuestion, "thread_semantic_active_question", 0.88);
    add(thread.followUpAnchor, "thread_follow_up_anchor", 0.86);
    add(thread.activeClaim, "thread_active_claim", 0.84);
    add(thread.activeQuestion, "thread_active_question", 0.82);

    (packet.usableFacts || []).forEach(fact => {
      add(
        fact.claim || fact.value || fact.label || fact.evidence || fact,
        "continuity_usable_fact",
        0.78
      );
    });

    const previousMessages =
      summary.threadState?.lastMessages ||
      summary.recentMessages ||
      thread.lastMessages ||
      [];

    previousMessages
      .slice(-6)
      .filter(msg => this.clean(msg) !== this.clean(currentText))
      .forEach((msg, index) => {
        add(msg, `previous_message_${index}`, 0.72);
      });

    add(summary.workingContext, "working_context", 0.62);
    add(summary.threadState?.continuitySummary, "continuity_summary", 0.58);
    add(summary.threadState?.previousAnswerSummary, "previous_answer_summary", 0.55);

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  },

  hasReferenceWord(text = "") {
    return /\b(it|this|that|they|them|those|these|same|one|ones|there|here|that plan|that idea|that option)\b/.test(this.clean(text));
  },

  replaceReferenceWords(text = "", topic = "") {
    const replaced = text.replace(
      /\b(it|this|that|they|them|those|these|same|one|ones)\b/g,
      topic
    );

    return this.ensureQuestionMark(replaced);
  },

  hasNewConcreteTopic(text = "") {
    const clean = this.clean(text);

    return (
      /\b\d+\s?(lbs?|pounds?|kg|calories|cals?|weeks?|days?|months?|years?)\b/.test(clean) ||
      /\b(weight|calories|diet|fat|lose weight|gain weight|cut|bulk|workout|exercise|meal|protein)\b/.test(clean) ||
      /\b(code|file|bug|error|github|engine|function|javascript|html|css|supabase|vercel)\b/.test(clean) ||
      /\b(sunburn|pain|fever|diarrhea|cough|pregnant|symptom|bleeding|chest pain|shortness of breath)\b/.test(clean) ||
      /\b(car|vehicle|rent|money|budget|job|school|boss|work|relationship|girlfriend|wife|father|mother|cat|dog)\b/.test(clean)
    );
  },

  isBadTopic(topic = "", currentText = "") {
    const cleanTopic = this.clean(topic);
    const cleanCurrent = this.clean(currentText);

    if (!cleanTopic) return true;
    if (cleanTopic === cleanCurrent) return true;
    if (cleanTopic.includes("[object object]")) return true;

    const badExact = [
      "general understanding",
      "general_understanding",
      "follow up context available",
      "follow_up_context_available",
      "active situation",
      "current situation",
      "unknown",
      "none",
      "null"
    ];

    if (badExact.includes(cleanTopic)) return true;

    if (this.detectRequestedOperation(cleanTopic) !== "none" && cleanTopic.split(/\s+/).length <= 8) {
      return true;
    }

    return false;
  },

  extractText(value) {
    if (!value) return "";

    if (typeof value === "string") return value;

    if (typeof value === "object") {
      return (
        value.resolvedUserQuestion ||
        value.userText ||
        value.followUpAnchor ||
        value.activeClaim ||
        value.activeQuestion ||
        value.text ||
        value.claim ||
        value.value ||
        value.label ||
        value.evidence ||
        value.surface ||
        value.summary ||
        value.activeIssue ||
        value.activeSubject ||
        ""
      );
    }

    return String(value || "");
  },

  cleanTopic(value = "") {
    return String(value || "")
      .replace(/^the user's current situation:\s*/i, "")
      .replace(/^current topic:\s*/i, "")
      .replace(/^current situation:\s*/i, "")
      .replace(/^user said:\s*/i, "")
      .replace(/^ari answered:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  trimEndingPunctuation(value = "") {
    return String(value || "")
      .replace(/[?.!]+$/g, "")
      .trim();
  },

  ensureQuestionMark(value = "") {
    const text = String(value || "").trim();
    if (!text) return "";
    return /[?]$/.test(text) ? text : `${text}?`;
  },

  scoreToConfidence(score = 0.5) {
    if (score >= 0.95) return 0.92;
    if (score >= 0.85) return 0.88;
    if (score >= 0.7) return 0.82;
    if (score >= 0.6) return 0.74;
    return 0.66;
  },

  noResolution(raw, reason = "No safe prior context found.") {
    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      threadQuestionGeneratorSource: "ari-thread-question-generator",
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: raw,

      currentTurnWasResolved: false,
      usedThreadContext: false,
      resolvedSubject: null,
      operation: "none",

      resolutionType: "none",
      confidence: 1,
      reason,

      threadQuestionResolutionType: "none",
      threadQuestionConfidence: 1,
      threadQuestionReason: reason,

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: raw,
        usedThreadContext: false,
        operation: "none",
        confidence: 1
      }
    };
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
  "ARI THREAD QUESTION GENERATOR LOADED:",
  window.Ari.threadQuestionGenerator?.version
);