// ari/context/ari-thread-question-generator.js
// Purpose: Resolve only true incomplete follow-up references.
// V2.0.0 — Strict Reference Resolver / No Semantic Interpretation

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "2.0.0",

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

    const current = this.analyzeCurrentTurn(text);

    if (!current.needsReferenceResolution) {
      return this.noResolution(raw, current.reason);
    }

    const anchor = this.findBestAnchor({
      summary,
      packet,
      thread,
      currentText: text
    });

    if (!anchor?.text) {
      return this.noResolution(raw, "Current turn looked referential, but no safe prior anchor was found.");
    }

    const resolvedText = this.resolveReference({
      text,
      anchor: anchor.text,
      current
    });

    return {
      threadQuestionGeneratorRan: true,
      threadQuestionGeneratorVersion: this.version,
      threadQuestionGeneratorSource: "ari-thread-question-generator",
      source: "ari-thread-question-generator",

      rawUserMessage: raw,
      resolvedUserQuestion: resolvedText,

      currentTurnWasResolved: true,
      usedThreadContext: true,
      resolvedSubject: anchor.text,
      inheritedTopicSource: anchor.source,
      inheritedTopicScore: anchor.score,

      operation: "reference_resolution",
      resolutionType: "reference_resolution_only",
      confidence: anchor.confidence,
      reason: "Resolved only because the current turn contained an incomplete reference.",

      threadQuestionResolutionType: "reference_resolution_only",
      threadQuestionConfidence: anchor.confidence,
      threadQuestionReason: "Resolved only because the current turn contained an incomplete reference.",

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText,
        usedThreadContext: true,
        inheritedTopic: anchor.text,
        inheritedTopicSource: anchor.source,
        operation: "reference_resolution",
        confidence: anchor.confidence
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,
        canInterpretIntent: false,
        role: "strict_reference_resolution_only"
      }
    };
  },

  analyzeCurrentTurn(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (!clean) {
      return {
        needsReferenceResolution: false,
        reason: "Empty text."
      };
    }

    const startsLikeFragment =
      /^(why|how|what about|and|also|then|more|next|continue|same one|other one|that one|this one)\b/.test(clean);

    const hasReference =
      this.hasReferenceWord(clean);

    const shortReference =
      wordCount <= 10 && hasReference;

    const bareFragment =
      wordCount <= 7 && startsLikeFragment;

    const correctionFragment =
      /\b(i mean|i meant|i ment|rather|instead|not that|no,? i mean)\b/.test(clean);

    const completeNewSituation =
      wordCount >= 12 && this.hasConcreteNewSituation(clean);

    const completeEnough =
      wordCount >= 10 &&
      !bareFragment &&
      !correctionFragment &&
      !shortReference;

    if (completeNewSituation) {
      return {
        needsReferenceResolution: false,
        reason: "Current turn contains a concrete new situation; preserve it exactly."
      };
    }

    if (completeEnough) {
      return {
        needsReferenceResolution: false,
        reason: "Current turn is complete enough; do not rewrite with prior context."
      };
    }

    if (bareFragment || shortReference || correctionFragment) {
      return {
        needsReferenceResolution: true,
        reason: "Current turn is incomplete or referential.",
        bareFragment,
        shortReference,
        correctionFragment,
        hasReference,
        wordCount
      };
    }

    return {
      needsReferenceResolution: false,
      reason: "No safe reference resolution needed."
    };
  },

  resolveReference({ text = "", anchor = "", current = {} } = {}) {
    const cleanText = this.clean(text);
    const cleanAnchor = this.cleanTopic(anchor);

    if (!cleanText || !cleanAnchor) return text;

    if (current.correctionFragment) {
      return `${this.cleanCorrection(cleanText)} — regarding ${cleanAnchor}?`;
    }

    if (/^why\b/.test(cleanText)) {
      return `${this.ensureQuestionMark(cleanText)} In the context of ${cleanAnchor}.`;
    }

    if (/^how\b/.test(cleanText)) {
      return `${this.ensureQuestionMark(cleanText)} In the context of ${cleanAnchor}.`;
    }

    if (/^what about\b/.test(cleanText)) {
      return `${this.ensureQuestionMark(cleanText)} In the context of ${cleanAnchor}.`;
    }

    if (/^(and|also|then|more|next|continue)\b/.test(cleanText)) {
      return `${cleanText} — continuing from ${cleanAnchor}.`;
    }

    if (this.hasReferenceWord(cleanText)) {
      return this.replaceReferenceWords(cleanText, cleanAnchor);
    }

    return `${cleanText} — regarding ${cleanAnchor}?`;
  },

  findBestAnchor({ summary = {}, packet = {}, thread = {}, currentText = "" } = {}) {
    const candidates = [];

    const add = (value, source, score = 0.5) => {
      const extracted = this.extractText(value);
      const text = this.cleanTopic(extracted);

      if (!text) return;
      if (this.isBadAnchor(text, currentText)) return;

      candidates.push({
        text,
        source,
        score,
        confidence: this.scoreToConfidence(score)
      });
    };

    add(summary.priorMeaningForFollowUp?.resolvedUserQuestion, "prior_meaning_resolved_question", 1.0);
    add(summary.priorMeaningForFollowUp?.userText, "prior_meaning_user_text", 0.98);
    add(summary.priorMeaningForFollowUp?.activeSubject, "prior_meaning_active_subject", 0.92);
    add(summary.priorMeaningForFollowUp?.activeIssue, "prior_meaning_active_issue", 0.9);

    add(summary.latestConversationMeaning?.resolvedUserQuestion, "latest_meaning_resolved_question", 0.96);
    add(summary.latestConversationMeaning?.userText, "latest_meaning_user_text", 0.94);
    add(summary.latestConversationMeaning?.activeSubject, "latest_meaning_active_subject", 0.9);
    add(summary.latestConversationMeaning?.activeIssue, "latest_meaning_active_issue", 0.88);

    add(thread.semanticState?.activeQuestion, "thread_semantic_active_question", 0.9);
    add(thread.activeQuestion, "thread_active_question", 0.88);
    add(thread.semanticState?.followUpAnchor, "thread_semantic_follow_up_anchor", 0.84);
    add(thread.followUpAnchor, "thread_follow_up_anchor", 0.82);
    add(thread.semanticState?.activeClaim, "thread_semantic_active_claim", 0.76);
    add(thread.activeClaim, "thread_active_claim", 0.74);

    const recentMessages = this.collectRecentMessages({ summary, packet, thread });

    recentMessages
      .filter(msg => this.clean(msg) !== this.clean(currentText))
      .slice(-6)
      .forEach((msg, index) => {
        add(msg, `recent_message_${index}`, 0.82 + index * 0.02);
      });

    add(summary.threadState?.previousAnswerSummary, "thread_state_previous_answer", 0.64);
    add(summary.previousAnswerSummary, "summary_previous_answer", 0.62);
    add(thread.previousAnswerSummary, "thread_previous_answer", 0.6);

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0] || null;
  },

  collectRecentMessages({ summary = {}, packet = {}, thread = {} } = {}) {
    const possible = [
      summary.threadState?.lastMessages,
      summary.recentMessages,
      summary.lastMessages,
      thread.lastMessages,
      thread.recentMessages,
      thread.semanticState?.semanticFrame?.inheritedContext?.recentMessages,
      thread.semanticFrame?.inheritedContext?.recentMessages,
      packet.activeThread?.semanticFrame?.inheritedContext?.recentMessages,
      packet.activeThread?.workingContext?.semanticFrame?.inheritedContext?.recentMessages,
      packet.activeThread?.workingContext?.semanticState?.semanticFrame?.inheritedContext?.recentMessages
    ];

    const messages = [];

    possible.forEach(list => {
      if (!Array.isArray(list)) return;

      list.forEach(item => {
        const text = this.extractText(item);
        if (text) messages.push(text);
      });
    });

    return [...new Set(messages.map(m => String(m).trim()).filter(Boolean))];
  },

  hasReferenceWord(text = "") {
    return /\b(it|this|that|they|them|those|these|same|one|ones|there|here|that plan|that idea|that option|her|him|she|he)\b/.test(
      this.clean(text)
    );
  },

  hasConcreteNewSituation(text = "") {
    const clean = this.clean(text);

    return (
      /\b(i got|i am|i was|i feel|i felt|my wife|my husband|my partner|my cat|my dog|my dad|my father|my mom|my mother)\b/.test(clean) ||
      /\b(today|yesterday|tomorrow|courthouse|married|pregnant|work|job|school|car|money|rent|pain|fever|diarrhea|cough|code|github|file|bug|error)\b/.test(clean)
    );
  },

  replaceReferenceWords(text = "", anchor = "") {
    const topic = this.cleanTopic(anchor);

    const replaced = this.clean(text).replace(
      /\b(it|this|that|they|them|those|these|same|one|ones)\b/g,
      topic
    );

    return this.ensureQuestionMark(replaced);
  },

  cleanCorrection(text = "") {
    return this.clean(text)
      .replace(/\bi ment\b/g, "i meant")
      .replace(/^no,?\s*/g, "")
      .replace(/^i mean,?\s*/g, "")
      .replace(/^i meant,?\s*/g, "")
      .replace(/^meant,?\s*/g, "")
      .replace(/^rather,?\s*/g, "")
      .replace(/^instead,?\s*/g, "")
      .trim();
  },

  isBadAnchor(anchor = "", currentText = "") {
    const cleanAnchor = this.clean(anchor);
    const cleanCurrent = this.clean(currentText);

    if (!cleanAnchor) return true;
    if (cleanAnchor === cleanCurrent) return true;
    if (cleanAnchor.includes("[object object]")) return true;

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
      "follow up context available",
      "follow_up_context_available",
      "active situation",
      "current situation",
      "unknown",
      "none",
      "null",
      "continue_prior_context",
      "request_action_or_output",
      "collaborative_software_build",
      "continuation",
      "conversation_flow"
    ];

    if (badExact.includes(cleanAnchor)) return true;

    if (/^active subject:\s*(the user|user|self)\b/.test(cleanAnchor)) return true;

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
        value.subject ||
        value.issue ||
        value.topic ||
        value.goal ||
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

  noResolution(raw, reason = "Current turn preserved exactly.") {
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
      },

      authority: {
        canChooseLane: false,
        canAnswerUser: false,
        canOverrideSafety: false,
        canSetContract: false,
        canInterpretIntent: false,
        role: "strict_reference_resolution_only"
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