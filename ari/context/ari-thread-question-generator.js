// ari/context/ari-thread-question-generator.js
// Purpose: Resolve short follow-up questions using thread context.
// V1.1.0 — Better Subject Selection + Junk Filtering + Follow-Up Chains

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.1.0",

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
      packet.currentTurn?.needsPriorContext ||
      summary.lane === "continuity_follow_up" ||
      summary.laneSplit?.lane === "continuity_follow_up";

    const isShortFollowUp = this.isShortFollowUp(text);

    const topic = this.pickBestTopic({ summary, packet, thread });

    if (!needsContext || !isShortFollowUp || !topic) {
      return this.noResolution(raw, "not_contextual_or_no_valid_topic");
    }

    const resolvedQuestion = this.resolveQuestion(text, topic);

    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: resolvedQuestion,

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: resolvedQuestion,
        usedThreadContext: true,
        inheritedTopic: topic,
        confidence: 0.88
      },

      currentTurnWasResolved: true,
      usedThreadContext: true,
      resolvedSubject: topic,
      resolutionType: "follow_up_question_resolution",
      confidence: 0.88,
      reason: "Short follow-up question was resolved using valid prior thread context.",

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "resolve_current_question_only"
      }
    };
  },

  pickBestTopic({ summary = {}, packet = {}, thread = {} }) {
    const candidates = [
      thread.activeSituation?.value,
      thread.activeSituation?.label,
      thread.activeIssue?.label,
      thread.activeIssue?.evidence,
      thread.activeIssue,
      thread.activeGoal?.label,
      thread.activeGoal?.evidence,
      summary.threadState?.activeIssue,
      summary.threadState?.activeSubject?.surface,
      summary.threadState?.currentTopic,
      summary.activeTopic,
      summary.workingContext,
      packet.usableFacts?.[0]?.claim,
      packet.usableFacts?.[0]?.value,
      summary.recentMessages?.slice(-1)?.[0]
    ];

    for (const item of candidates) {
      const clean = this.cleanTopic(item);
      if (clean) return clean;
    }

    return null;
  },

  cleanTopic(value) {
    if (!value) return null;

    let text =
      typeof value === "string"
        ? value
        : value.value ||
          value.label ||
          value.surface ||
          value.evidence ||
          value.claim ||
          "";

    text = String(text || "").trim();

    if (!text) return null;

    const lower = text.toLowerCase().trim();

    const junk = [
      "it",
      "this",
      "that",
      "they",
      "them",
      "follow_up_context_available",
      "general_understanding",
      "decision_support",
      "unknown",
      "none",
      "null"
    ];

    if (junk.includes(lower)) return null;

    if (lower.startsWith("user said:")) {
      const match = text.match(/user said:\s*(.*?)\.?\s*ari answered:/i);
      if (match?.[1]) return match[1].trim();
    }

    return text;
  },

  isShortFollowUp(text = "") {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 12) return false;

    return (
      /^(why|how|what|what about|what if|then what|should i|do i|can i|is it|could it|would it)\b/.test(text) ||
      /\b(it|this|that|they|them)\b/.test(text)
    );
  },

  resolveQuestion(text, topic) {
    if (/^why\b/.test(text)) {
      return `Why might ${topic}?`;
    }

    if (/^how\b/.test(text)) {
      return `How should the user think about ${topic}?`;
    }

    if (/^what do you think it is\b/.test(text)) {
      return `What is likely causing ${topic}?`;
    }

    if (/^what do you think\b/.test(text)) {
      return `What do you think about ${topic}?`;
    }

    if (/^what is it\b|^what it is\b/.test(text)) {
      return `What is likely causing ${topic}?`;
    }

    if (/^what should i do\b/.test(text)) {
      return `What should the user do about ${topic}?`;
    }

    if (/^should i\b/.test(text)) {
      return `Should the user do something about ${topic}?`;
    }

    if (/^can i\b/.test(text)) {
      return `Can the user safely do that regarding ${topic}?`;
    }

    if (/^is it\b|^could it\b|^would it\b/.test(text)) {
      return `${text} — regarding ${topic}`;
    }

    if (/\bit\b|\bthis\b|\bthat\b|\bthey\b|\bthem\b/.test(text)) {
      return text.replace(/\bit\b|\bthis\b|\bthat\b|\bthey\b|\bthem\b/g, topic);
    }

    return `${text} — regarding ${topic}`;
  },

  noResolution(raw, reason = "no_resolution_needed") {
    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: raw,

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: raw,
        usedThreadContext: false,
        confidence: 1
      },

      currentTurnWasResolved: false,
      usedThreadContext: false,
      resolvedSubject: null,
      resolutionType: "none",
      confidence: 1,
      reason
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