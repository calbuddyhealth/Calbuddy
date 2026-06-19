// ari/context/ari-thread-question-generator.js
// Purpose: Resolve short follow-up questions using prior conversation meaning.
// V1.2.1 — Strong follow-up resolver / anti-self-poisoning / cleaner resolved questions

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.2.1",

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

    const followUpType = this.detectFollowUpType(text);

    if (!needsContext || followUpType === "none") {
      return this.noResolution(raw, "Current turn does not safely require prior context.");
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

    const resolvedQuestion = this.resolveQuestion({
      text,
      topic: inherited.text,
      followUpType
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

      resolutionType: "follow_up_question_resolved_from_prior_context",
      confidence: inherited.confidence,
      reason: "Short follow-up was resolved using prior non-current conversation meaning.",

      threadQuestionResolutionType: "follow_up_question_resolved_from_prior_context",
      threadQuestionConfidence: inherited.confidence,
      threadQuestionReason: "Short follow-up was resolved using prior non-current conversation meaning.",

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: resolvedQuestion,
        usedThreadContext: true,
        inheritedTopic: inherited.text,
        inheritedTopicSource: inherited.source,
        followUpType,
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

    // Strongest source: completed meaning from the previous turn.
    add(summary.priorMeaningForFollowUp?.resolvedUserQuestion, "prior_meaning_resolved_question", 1.0);
    add(summary.priorMeaningForFollowUp?.userText, "prior_meaning_user_text", 0.98);
    add(summary.priorMeaningForFollowUp?.activeIssue, "prior_meaning_active_issue", 0.94);
    add(summary.priorMeaningForFollowUp?.activeSubject, "prior_meaning_active_subject", 0.9);
    add(summary.priorMeaningForFollowUp?.situationFamily, "prior_meaning_situation_family", 0.84);

    // Good continuity facts, but weaker than prior meaning.
    (packet.usableFacts || []).forEach(fact => {
      add(
        fact.claim || fact.value || fact.label || fact.evidence || fact,
        "continuity_usable_fact",
        0.82
      );
    });

    // Prior messages are useful, but must never overpower prior meaning.
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

    add(summary.threadState?.previousAnswerSummary, "previous_answer_summary", 0.66);
    add(summary.threadState?.continuitySummary, "continuity_summary", 0.64);
    add(summary.workingContext, "working_context", 0.62);

    add(thread.activeIssue, "thread_active_issue", 0.58);
    add(thread.activeSubject, "thread_active_subject", 0.54);
    add(thread.currentTopic, "thread_current_topic", 0.48);

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0] || null;
  },

  detectFollowUpType(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);

    if (!clean) return "none";
    if (words.length > 14) return "none";
if (this.hasNewConcreteTopic(clean)) return "none";
    if (/^why\??$/.test(clean)) return "why";
    if (/^why\b/.test(clean)) return "why";

    if (/^how\??$/.test(clean)) return "how";
    if (/^how\b/.test(clean)) return "how";

    if (/^what else can i do\??$/.test(clean)) return "more_actions";
    if (/^what should i do\??$/.test(clean)) return "action_guidance";
    if (/^what can i do\??$/.test(clean)) return "action_guidance";

    if (/^what is the most likely cause\??$/.test(clean)) return "likely_cause";
    if (/^what is the most likely reason\??$/.test(clean)) return "likely_reason";

    if (/^what do you think\??$/.test(clean)) return "opinion";
    if (/^what about\b/.test(clean)) return "what_about";
    if (/^what if\b/.test(clean)) return "what_if";

    if (/^(can i|should i|do i)\b/.test(clean)) return "permission_or_decision";

    if (/\b(it|this|that|they|them)\b/.test(clean)) return "pronoun_reference";

    return "none";
  },

  resolveQuestion({ text = "", topic = "", followUpType = "none" }) {
    const clean = this.clean(text);
    const topicText = this.trimEndingPunctuation(topic);

    switch (followUpType) {
      case "why":
        return `Why might ${topicText}?`;

      case "how":
        return `How should the user think about ${topicText}?`;

      case "more_actions":
        return `What else can the user do about ${topicText}?`;

      case "action_guidance":
        return `What should the user do about ${topicText}?`;

      case "likely_cause":
        return `What is the most likely cause of ${topicText}?`;

      case "likely_reason":
        return `What is the most likely reason for ${topicText}?`;

      case "opinion":
        return `What do you think about ${topicText}?`;

      case "what_about":
        return `${clean} — regarding ${topicText}?`;

      case "what_if":
        return `${clean} — in the context of ${topicText}?`;

      case "permission_or_decision":
        return `${clean} — regarding ${topicText}?`;

      case "pronoun_reference":
        return this.replacePronouns(clean, topicText);

      default:
        return `${clean} — regarding ${topicText}?`;
    }
  },

  replacePronouns(text = "", topic = "") {
    const replaced = text.replace(/\b(it|this|that|they|them)\b/g, topic);
    return this.ensureQuestionMark(replaced);
  },

  isBadTopic(topic = "", currentText = "") {
    const cleanTopic = this.clean(topic);
    const cleanCurrent = this.clean(currentText);

    if (!cleanTopic) return true;
    if (cleanTopic === cleanCurrent) return true;
    if (cleanTopic.includes("[object object]")) return true;

    // Prevent current-turn self-poisoning.
    if (this.detectFollowUpType(cleanTopic) !== "none") return true;

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

    const badStarts = [
      "the user's current situation:",
      "current topic:",
      "current situation:"
    ];

    if (badStarts.some(prefix => cleanTopic.startsWith(prefix))) {
      const stripped = cleanTopic
        .replace(/^the user's current situation:\s*/i, "")
        .replace(/^current topic:\s*/i, "")
        .replace(/^current situation:\s*/i, "")
        .trim();

      if (!stripped || stripped === cleanCurrent || this.detectFollowUpType(stripped) !== "none") {
        return true;
      }
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
    let text = String(value || "")
      .replace(/^the user's current situation:\s*/i, "")
      .replace(/^current topic:\s*/i, "")
      .replace(/^current situation:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
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

hasNewConcreteTopic(text = "") {
  return /\b\d+\s?(lbs?|pounds?|kg)\b/.test(text) ||
    /\b(weight|calories|diet|fat|lose weight|gain weight|cut|bulk|workout|exercise|meal|protein)\b/.test(text) ||
    /\b(code|file|bug|error|github|engine|function)\b/.test(text) ||
    /\b(sunburn|pain|fever|diarrhea|cough|pregnant|symptom)\b/.test(text);
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