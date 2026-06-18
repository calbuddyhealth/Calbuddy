// ari/context/ari-thread-question-generator.js
// Purpose: Resolve short follow-up questions using thread context.
// V1.0.0

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.0.0",

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

    const previousTopic =
      thread.activeIssue ||
      thread.activeSituation?.value ||
      thread.currentTopic ||
      summary.activeTopic ||
      summary.workingContext ||
      null;

    const needsContext =
      packet.currentTurn?.needsPriorContext ||
      summary.lane === "continuity_follow_up" ||
      summary.laneSplit?.lane === "continuity_follow_up";

    const isShortFollowUp = this.isShortFollowUp(text);

    if (!needsContext || !isShortFollowUp || !previousTopic) {
      return this.noResolution(raw);
    }

    const resolvedQuestion = this.resolveQuestion(text, previousTopic);

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
        inheritedTopic: previousTopic,
        confidence: 0.86
      },

      currentTurnWasResolved: true,
      usedThreadContext: true,
      resolvedSubject: previousTopic,
      confidence: 0.86,

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        role: "resolve_current_question_only"
      }
    };
  },

  isShortFollowUp(text = "") {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 9) return false;

    return (
      /^(why|how|what|what about|what if|then what|should i|do i|can i)\b/.test(text) ||
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

    if (/^what do you think/.test(text)) {
      return `What do you think about ${topic}?`;
    }

    if (/^what is it|what it is|what do you think it is/.test(text)) {
      return `What is likely causing ${topic}?`;
    }

    if (/^what should i do/.test(text)) {
      return `What should the user do about ${topic}?`;
    }

    if (/\bit\b|\bthis\b|\bthat\b/.test(text)) {
      return text.replace(/\bit\b|\bthis\b|\bthat\b/g, topic);
    }

    return `${text} — regarding ${topic}`;
  },

  noResolution(raw) {
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
      confidence: 1
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