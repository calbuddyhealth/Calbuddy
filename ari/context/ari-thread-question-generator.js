// ari/context/ari-thread-question-generator.js
// Purpose: Resolve short follow-up questions using prior conversation meaning.
// V1.1.2 — Adds debug aliases + avoids current-turn self-poisoning

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.1.2",

  generate(input = {}) {
    const summary = input.summary || input || {};
    const raw = summary.userMessage || summary.message || summary.input || "";
    const text = this.clean(raw);

    const packet = summary.continuityPacket || {};
    const thread =
      packet.activeThread?.workingContext ||
      packet.activeThread ||
      summary.threadState ||
      {};

    const needsContext =
      packet.currentTurn?.needsPriorContext ||
      summary.lane === "continuity_follow_up" ||
      summary.laneSplit?.lane === "continuity_follow_up";

    const isShortFollowUp = this.isShortFollowUp(text);

    const inheritedTopic = this.findBestInheritedTopic({
      summary,
      packet,
      thread,
      currentText: text
    });

    if (!needsContext || !isShortFollowUp || !inheritedTopic) {
      return this.noResolution(raw);
    }

    const resolvedQuestion = this.resolveQuestion(text, inheritedTopic);

    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      threadQuestionGeneratorSource: "ari-thread-question-generator",
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: resolvedQuestion,

      currentTurnWasResolved: true,
      usedThreadContext: true,
      resolvedSubject: inheritedTopic,

      resolutionType: "follow_up_question_resolved_from_prior_context",
      confidence: 0.88,
      reason: "Short follow-up question was resolved using prior non-current conversation meaning.",

      // Lab/debug aliases
      threadQuestionResolutionType: "follow_up_question_resolved_from_prior_context",
      threadQuestionConfidence: 0.88,
      threadQuestionReason: "Short follow-up question was resolved using prior non-current conversation meaning.",

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: resolvedQuestion,
        usedThreadContext: true,
        inheritedTopic,
        confidence: 0.88
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
      const text = this.extractText(value);
      if (!text) return;
      if (this.isBadTopic(text, currentText)) return;
      candidates.push({ text, source, score });
    };

    // Best source: last completed turn, loaded before current question.
    add(summary.priorMeaningForFollowUp?.userText, "prior_meaning_user_text", 1.0);
    add(summary.priorMeaningForFollowUp?.resolvedUserQuestion, "prior_meaning_resolved_question", 0.98);
    add(summary.priorMeaningForFollowUp?.activeIssue, "prior_meaning_active_issue", 0.94);
    add(summary.priorMeaningForFollowUp?.activeSubject, "prior_meaning_active_subject", 0.92);
    add(summary.priorMeaningForFollowUp?.situationFamily, "prior_meaning_situation_family", 0.88);

    (packet.usableFacts || []).forEach(fact => {
      add(
        fact.claim || fact.value || fact.label || fact.evidence || fact,
        "continuity_usable_fact",
        0.86
      );
    });

    const previousMessages =
      summary.threadState?.lastMessages ||
      summary.recentMessages ||
      thread.lastMessages ||
      [];

    previousMessages.slice(-5).forEach(msg => {
      add(msg, "previous_message", 0.78);
    });

    add(summary.workingContext, "working_context", 0.72);
    add(summary.threadState?.previousAnswerSummary, "previous_answer_summary", 0.68);
    add(summary.threadState?.continuitySummary, "continuity_summary", 0.65);

    add(thread.activeSubject, "thread_active_subject", 0.62);
    add(thread.activeIssue, "thread_active_issue", 0.6);
    add(thread.currentTopic, "thread_current_topic", 0.55);

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.text || null;
  },

  isBadTopic(topic = "", currentText = "") {
    const cleanTopic = this.clean(topic);
    const cleanCurrent = this.clean(currentText);

    if (!cleanTopic) return true;
    if (cleanTopic === cleanCurrent) return true;
    if (cleanTopic.includes("[object object]")) return true;
    if (this.isShortFollowUp(cleanTopic)) return true;

    const badLabels = [
      "general understanding",
      "general_understanding",
      "follow up context available",
      "follow_up_context_available",
      "active situation",
      "current situation"
    ];

    return badLabels.includes(cleanTopic);
  },

  isShortFollowUp(text = "") {
    const words = this.clean(text).split(/\s+/).filter(Boolean);
    if (words.length > 12) return false;

    return (
      /^(why|how|what|what about|what if|then what|should i|do i|can i)\b/.test(text) ||
      /\b(it|this|that|they|them)\b/.test(text)
    );
  },

  resolveQuestion(text, topic) {
    if (/^why\b/.test(text)) return `Why might ${topic}?`;
    if (/^how\b/.test(text)) return `How should the user think about ${topic}?`;
    if (/^what is the most likely cause/.test(text)) return `What is the most likely cause of ${topic}?`;
    if (/^what do you think is the most likely reason/.test(text)) return `What is the most likely reason for ${topic}?`;
    if (/^what do you think/.test(text)) return `What do you think about ${topic}?`;
    if (/^what should i do/.test(text)) return `What should the user do about ${topic}?`;

    if (/\bit\b|\bthis\b|\bthat\b/.test(text)) {
      return text.replace(/\bit\b|\bthis\b|\bthat\b/g, topic);
    }

    return `${text} — regarding ${topic}`;
  },

  extractText(value) {
    if (!value) return "";
    if (typeof value === "string") return value;

    if (typeof value === "object") {
      return value.text || value.claim || value.value || value.label || value.evidence || value.surface || value.summary || "";
    }

    return String(value || "");
  },

  noResolution(raw) {
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
      reason: "No safe prior context found or current turn did not need resolution.",

      threadQuestionResolutionType: "none",
      threadQuestionConfidence: 1,
      threadQuestionReason: "No safe prior context found or current turn did not need resolution.",

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