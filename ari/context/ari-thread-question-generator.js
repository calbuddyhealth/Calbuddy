// ari/context/ari-thread-question-generator.js
// Purpose: Resolve true follow-up questions using prior conversation meaning.
// V1.5.0 — Recent Message Fallback + Weak Topic Recovery

window.Ari = window.Ari || {};

window.Ari.threadQuestionGenerator = {
  version: "1.5.0",

  generate(input = {}) {
    const summary = input.summary || input || {};

    const raw =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const text = this.clean(raw);

    const semantic = this.readSemantic(summary);
    const packet = summary.continuityPacket || {};
    const thread =
      packet.activeThread?.workingContext ||
      packet.activeThread ||
      summary.threadState ||
      {};

    const semanticOperation = this.detectSemanticOperation(semantic);
    const fallbackOperation = semantic.available
      ? "none"
      : this.detectRequestedOperationFallback(text);

    let operation = semanticOperation || fallbackOperation;

    const standalone = this.detectStandaloneTurn({
      text,
      semantic,
      operation
    });

    const fragment = this.detectFragment(text);

    const needsContext = this.needsContext({
      summary,
      packet,
      semantic,
      operation,
      standalone,
      fragment
    });

    if (!needsContext || standalone.isStandalone) {
      return this.noResolution(
        raw,
        standalone.reason || "Current turn does not safely require prior context.",
        { semantic, operation }
      );
    }

    if (operation === "none" && fragment.isFragment) {
      operation = "reference_resolution";
    }

    const inherited = this.findBestInheritedTopic({
      summary,
      packet,
      thread,
      currentText: text
    });

    if (!inherited?.text) {
      return this.noResolution(raw, "No safe prior topic found.", {
        semantic,
        operation
      });
    }

    const resolvedQuestion = this.composeResolvedQuestion({
      text,
      operation,
      anchor: inherited.text,
      semantic,
      fragment
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
      semanticAware: semantic.available,
      semanticFrameType: semantic.frameType,
      semanticIntent: semantic.intent,
      semanticResolutionUsed: semantic.available,

      resolutionType: "follow_up_question_resolved_from_prior_context",
      confidence: inherited.confidence,
      reason: "Follow-up was resolved using prior topic, recent messages, and semantic frame signals.",

      threadQuestionResolutionType: "follow_up_question_resolved_from_prior_context",
      threadQuestionConfidence: inherited.confidence,
      threadQuestionReason: "Follow-up was resolved using prior topic, recent messages, and semantic frame signals.",

      resolvedCurrentTurn: {
        rawText: raw,
        resolvedText: resolvedQuestion,
        usedThreadContext: true,
        inheritedTopic: inherited.text,
        inheritedTopicSource: inherited.source,
        operation,
        semanticFrameType: semantic.frameType,
        semanticIntent: semantic.intent,
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

  readSemantic(summary = {}) {
    const semanticFrameOutput =
      summary.semanticFrameOutput ||
      summary.semanticFrame ||
      summary.activeSemanticFrame ||
      {};

    const primaryFrame =
      summary.primarySemanticFrame ||
      semanticFrameOutput.primaryFrame ||
      semanticFrameOutput.currentTurnFrame ||
      summary.activeSemanticFrame?.primaryFrame ||
      summary.activeSemanticFrame?.currentTurnFrame ||
      {};

    const semanticSummary =
      summary.semanticSummary ||
      semanticFrameOutput.semanticSummary ||
      {};

    const continuity =
      summary.semanticContinuity ||
      semanticFrameOutput.continuity ||
      semanticSummary.continuity ||
      {};

    const response =
      summary.semanticResponseCharacteristics ||
      semanticFrameOutput.responseCharacteristics ||
      semanticSummary.responseCharacteristics ||
      {};

    const ambiguity =
      summary.semanticAmbiguity ||
      semanticFrameOutput.ambiguity ||
      semanticSummary.ambiguity ||
      {};

    return {
      available: Boolean(
        semanticFrameOutput.semanticFrameBuilderRan ||
        primaryFrame.frameType ||
        semanticSummary.primaryMeaning
      ),

      frameType:
        primaryFrame.frameType ||
        semanticSummary.primaryMeaning ||
        null,

      intent:
        primaryFrame.intent ||
        semanticSummary.intent ||
        null,

      domain:
        primaryFrame.domain ||
        semanticSummary.domain ||
        null,

      conversationStyle:
        primaryFrame.conversationStyle ||
        semanticSummary.conversationStyle ||
        null,

      continuity,
      response,
      ambiguity,

      isContinuation:
        continuity.isContinuation === true,

      referencesPriorContext:
        continuity.referencesPriorContext === true,

      referencesPriorArtifact:
        continuity.referencesPriorArtifact === true,

      expectsDirectAnswer:
        response.expectsDirectAnswer === true,

      expectsExplanation:
        response.expectsExplanation === true,

      expectsCollaboration:
        response.expectsCollaboration === true,

      expectsCodeOrArtifact:
        response.expectsCodeOrArtifact === true,

      expectsFollowUpContext:
        response.expectsFollowUpContext === true,

      ambiguityPresent:
        ambiguity.present === true
    };
  },

  detectSemanticOperation(semantic = {}) {
    if (!semantic.available) return null;

    const frame = semantic.frameType;
    const intent = semantic.intent;

    if (semantic.expectsDirectAnswer && !semantic.isContinuation) {
      return "none";
    }

    if (frame === "continuation") return "continue";

    if (semantic.expectsCodeOrArtifact && semantic.isContinuation) {
      return "continue_code_or_artifact";
    }

    if (semantic.ambiguityPresent || semantic.referencesPriorContext) {
      return "reference_resolution";
    }

    if (frame === "debugging_or_root_cause") return "debug_fix";
    if (frame === "decision_support") return "permission_or_decision";
    if (frame === "comparison") return "compare";
    if (frame === "planning_or_roadmap") return "action_plan";
    if (frame === "instruction_or_command" && semantic.expectsFollowUpContext) return "continue";
    if (frame === "collaborative_software_build" && semantic.isContinuation) return "continue_code_or_artifact";

    if (intent === "diagnose_failure_or_mismatch") return "debug_fix";
    if (intent === "evaluate_options") return "compare";
    if (intent === "organize_next_actions") return "action_plan";
    if (intent === "continue_prior_context") return "continue";
    if (intent === "request_action_or_output" && semantic.expectsFollowUpContext) return "continue";

    return null;
  },

  detectStandaloneTurn({ text = "", semantic = {}, operation = "none" } = {}) {
    const words = this.clean(text).split(/\s+/).filter(Boolean);

    if (!text) {
      return { isStandalone: true, reason: "Empty text." };
    }

    const fragment = this.detectFragment(text);

    if (fragment.isFragment) {
      return { isStandalone: false, reason: "Current turn is a fragment needing context." };
    }

    if (
      semantic.available &&
      semantic.expectsDirectAnswer &&
      !semantic.isContinuation &&
      !semantic.ambiguityPresent
    ) {
      return {
        isStandalone: true,
        reason: "Semantic frame says this expects a direct standalone answer."
      };
    }

    if (
      semantic.available &&
      !semantic.expectsFollowUpContext &&
      !semantic.referencesPriorContext &&
      !semantic.ambiguityPresent &&
      !semantic.isContinuation &&
      words.length >= 7
    ) {
      return {
        isStandalone: true,
        reason: "Semantic frame does not require prior context."
      };
    }

    if (!semantic.available) {
      if (this.hasNewConcreteTopicFallback(text) && !fragment.isFragment) {
        return { isStandalone: true, reason: "Current turn contains a new concrete topic." };
      }

      if (words.length >= 12 && !this.hasReferenceWordFallback(text)) {
        return { isStandalone: true, reason: "Current turn is detailed enough to stand alone." };
      }
    }

    return { isStandalone: false, reason: null };
  },

  needsContext({ summary = {}, packet = {}, semantic = {}, operation = "none", standalone = {}, fragment = {} } = {}) {
    if (standalone.isStandalone) return false;
    if (fragment.isFragment) return true;

    if (semantic.available) {
      return Boolean(
        semantic.isContinuation ||
        semantic.expectsFollowUpContext ||
        semantic.referencesPriorContext ||
        semantic.referencesPriorArtifact ||
        semantic.ambiguityPresent ||
        operation !== "none"
      );
    }

    return Boolean(
      packet.currentTurn?.needsPriorContext === true ||
      summary.lane === "continuity_follow_up" ||
      summary.laneSplit?.lane === "continuity_follow_up"
    );
  },

  composeResolvedQuestion({ text = "", operation = "none", anchor = "", semantic = {}, fragment = {} }) {
    const clean = this.clean(text);
    const topic = this.trimEndingPunctuation(anchor);

    const fragmentQuestion = this.composeFragmentQuestion({
      text: clean,
      anchor: topic,
      fragment
    });

    if (fragmentQuestion) return fragmentQuestion;

    switch (operation) {
      case "continue_code_or_artifact":
        return `Continue the requested code or artifact work for ${topic}.`;

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
        return this.replaceReferenceWordsFallback(clean, topic);

      default:
        return `${clean} — regarding ${topic}?`;
    }
  },

  composeFragmentQuestion({ text = "", anchor = "", fragment = {} } = {}) {
    const cleanedFragment = this.cleanFragment(text);
    const topic = this.extractTopicFromAnchor(anchor);

    if (!cleanedFragment || !topic) return null;

    if (/\beconomic causes?\b/.test(cleanedFragment)) {
      return `Explain the economic causes of ${topic}.`;
    }

    if (/\bpolitical causes?\b/.test(cleanedFragment)) {
      return `Explain the political causes of ${topic}.`;
    }

    if (/\bsocial causes?\b/.test(cleanedFragment)) {
      return `Explain the social causes of ${topic}.`;
    }

    if (/\bmain causes?\b/.test(cleanedFragment)) {
      return `Explain the main causes of ${topic}.`;
    }

    if (/\bcause\b|\bcauses\b/.test(cleanedFragment)) {
      return `Explain the causes of ${topic}.`;
    }

    if (/^why\b|how come|what caused|what causes/.test(cleanedFragment)) {
      return `${this.ensureQuestionMark(cleanedFragment)} In the context of ${topic}.`;
    }

    if (cleanedFragment.length <= 80) {
      return `Explain ${cleanedFragment} in the context of ${topic}.`;
    }

    return null;
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

    add(summary.latestConversationMeaning?.resolvedUserQuestion, "latest_meaning_resolved_question", 0.96);
    add(summary.latestConversationMeaning?.userText, "latest_meaning_user_text", 0.94);
    add(summary.latestConversationMeaning?.activeIssue, "latest_meaning_active_issue", 0.9);
    add(summary.latestConversationMeaning?.activeSubject, "latest_meaning_active_subject", 0.88);

    add(thread.semanticState?.activeQuestion, "thread_semantic_active_question", 0.9);
    add(thread.activeQuestion, "thread_active_question", 0.88);
    add(thread.semanticState?.followUpAnchor, "thread_semantic_follow_up_anchor", 0.78);
    add(thread.followUpAnchor, "thread_follow_up_anchor", 0.76);
    add(thread.semanticState?.activeClaim, "thread_semantic_active_claim", 0.72);
    add(thread.activeClaim, "thread_active_claim", 0.7);

    const recentMessages = this.collectRecentMessages({ summary, packet, thread });

    recentMessages
      .filter(msg => this.clean(msg) !== this.clean(currentText))
      .slice(-8)
      .forEach((msg, index) => {
        add(msg, `recent_message_${index}`, 0.86 + index * 0.01);
      });

    const previousAnswerSummary =
      summary.threadState?.previousAnswerSummary ||
      summary.previousAnswerSummary ||
      thread.previousAnswerSummary ||
      thread.semanticState?.semanticFrame?.inheritedContext?.previousAnswerSummary ||
      thread.semanticFrame?.inheritedContext?.previousAnswerSummary ||
      packet.activeThread?.semanticFrame?.inheritedContext?.previousAnswerSummary ||
      "";

    add(previousAnswerSummary, "previous_answer_summary", 0.74);

    (packet.usableFacts || []).forEach(fact => {
      add(
        fact.claim || fact.value || fact.label || fact.evidence || fact,
        "continuity_usable_fact",
        0.62
      );
    });

    add(summary.workingContext, "working_context", 0.58);
    add(summary.threadState?.continuitySummary, "continuity_summary", 0.56);

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

  detectFragment(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);

    const correction =
      /\b(i mean|i meant|i ment|meant|rather|instead|not that|no,? i mean)\b/.test(clean);

    const shortClarifier =
      words.length <= 7 &&
      (
        /\b(cause|causes|reason|reasons|economic|political|social|second|first|third|other one|same one)\b/.test(clean) ||
        /^(why|how|what about|and|also|then|more|explain more)\b/.test(clean)
      );

    const hasReference = this.hasReferenceWordFallback(clean);

    return {
      isFragment: correction || shortClarifier || hasReference,
      correction,
      shortClarifier,
      hasReference,
      wordCount: words.length
    };
  },

  cleanFragment(text = "") {
    return this.clean(text)
      .replace(/\bi ment\b/g, "i meant")
      .replace(/^no,?\s*/g, "")
      .replace(/^i mean,?\s*/g, "")
      .replace(/^i meant,?\s*/g, "")
      .replace(/^meant,?\s*/g, "")
      .replace(/^rather,?\s*/g, "")
      .replace(/^instead,?\s*/g, "")
      .replace(/^the\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  extractTopicFromAnchor(anchor = "") {
    let topic = this.clean(anchor);

    topic = topic
      .replace(/[?.!]+$/g, "")
      .replace(/^(explain|teach me about|tell me about|what is|what are|why is|why are|how does|how do)\s+/i, "")
      .replace(/^the user's current situation:\s*/i, "")
      .replace(/^current topic:\s*/i, "")
      .replace(/^current situation:\s*/i, "")
      .trim();

    if (!topic) return "";

    if (!/^the\b/.test(topic) && /\bcivil war\b/.test(topic)) {
      return "the Civil War";
    }

    return topic;
  },

  detectRequestedOperationFallback(text = "") {
    const clean = this.clean(text);
    const words = clean.split(/\s+/).filter(Boolean);

    if (!clean) return "none";
    if (words.length > 22 && !this.hasReferenceWordFallback(clean)) return "none";

    if (/^why\b|how come|what caused|what causes/.test(clean)) return "explain_reason";
    if (/recommend|suggest|what would you do|what do you recommend|ideally/.test(clean)) return "recommend";
    if (/plan|steps|how do i|what should i do|what can i do|what else can i do/.test(clean)) return "action_plan";
    if (/compare|better|difference|versus| vs |which one|which is/.test(clean)) return "compare";
    if (/fix|debug|error|not working|broken|bug/.test(clean)) return "debug_fix";
    if (/continue|next|go on|keep going|then what|what next/.test(clean)) return "continue";
    if (/can i|should i|do i|is it okay|would it be okay/.test(clean)) return "permission_or_decision";
    if (/what about|what if/.test(clean)) return "scenario_check";
    if (this.hasReferenceWordFallback(clean)) return "reference_resolution";

    return "none";
  },

  hasReferenceWordFallback(text = "") {
    return /\b(it|this|that|they|them|those|these|same|one|ones|there|here|that plan|that idea|that option)\b/.test(this.clean(text));
  },

  replaceReferenceWordsFallback(text = "", topic = "") {
    const replaced = text.replace(
      /\b(it|this|that|they|them|those|these|same|one|ones)\b/g,
      topic
    );

    return this.ensureQuestionMark(replaced);
  },

  hasNewConcreteTopicFallback(text = "") {
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
      "the user",
      "user",
      "self",
      "me",
      "i",
      "my",
      "explain",
      "general",
      "general understanding",
      "general_understanding",
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
      "continuation"
    ];

    if (badExact.includes(cleanTopic)) return true;

    if (/^the user's current situation\b/.test(cleanTopic)) return true;
    if (/^active subject:\s*(the user|user|self)\b/.test(cleanTopic)) return true;

    if (this.detectRequestedOperationFallback(cleanTopic) !== "none" && cleanTopic.split(/\s+/).length <= 8) {
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

  noResolution(raw, reason = "No safe prior context found.", extra = {}) {
    const semantic = extra.semantic || {};
    const operation = extra.operation || "none";

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
      operation,

      semanticAware: semantic.available || false,
      semanticFrameType: semantic.frameType || null,
      semanticIntent: semantic.intent || null,
      semanticResolutionUsed: false,

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
        operation,
        semanticFrameType: semantic.frameType || null,
        semanticIntent: semantic.intent || null,
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