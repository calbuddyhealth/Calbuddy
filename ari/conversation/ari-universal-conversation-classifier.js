// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify conversation type only. No routing, no final lane authority.
// V3.1.0 — Semantic Signal Classification / Advisory Only

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "3.1.0",

  classify(input = {}) {
    const summary = input.summary || input || {};
    const rawText =
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      "";

    const text = this.normalize(rawText);

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const thread =
      summary.threadUnderstanding ||
      summary.continuityContext ||
      summary.continuityPacket?.activeThread?.workingContext ||
      summary.continuityPacket?.activeThread ||
      {};

    const semanticFrame =
      summary.semanticFrame ||
      summary.activeSemanticFrame ||
      summary.currentSemanticFrame ||
      thread.semanticFrame ||
      thread.activeSemanticFrame ||
      thread.semanticState?.semanticFrame ||
      null;

    const signals = this.buildSemanticSignals({
      text,
      rawText,
      observations,
      thread,
      semanticFrame,
      summary
    });

    const candidates = [];

    this.addSemanticCandidates(candidates, signals);
    this.addQuestionCandidates(candidates, text, observations, thread, signals);
    this.addTaskCandidates(candidates, text, signals);
    this.addDomainCandidates(candidates, text, observations, thread, signals);
    this.addIntentCandidates(candidates, text, observations, thread, signals);

    const ranked = this.rank(candidates);

    const top = ranked[0] || {
      type: "general_conversation",
      score: 50,
      confidence: "low",
      intent: "respond_normally",
      responseHint: "Respond normally.",
      reasons: ["No strong conversation type detected."]
    };

    return {
      classifierRan: true,
      universalConversationClassifierRan: true,
      classifierVersion: this.version,
      source: "ari-universal-conversation-classifier",

      conversationType: top.type,
      conversationIntent: top.intent,
      score: top.score,
      confidence: top.confidence,
      responseHint: top.responseHint || "Respond normally.",
      reasons: top.reasons || [],

      semanticSignals: signals,
      candidates: ranked.slice(0, 7),

      authority: "classification_only",
      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation",
        "mouthPattern"
      ]
    };
  },

  buildSemanticSignals({ text, rawText, observations, thread, semanticFrame, summary }) {
    const frame =
      semanticFrame?.currentTurnFrame ||
      semanticFrame?.primaryFrame ||
      semanticFrame?.currentTurnMeaning ||
      semanticFrame ||
      {};

    const handoff = semanticFrame?.handoff || {};

    const semanticMeaning = this.normalize(
      frame.frameType ||
      frame.primaryMeaning ||
      handoff.currentMeaning ||
      ""
    );

    const semanticDomain = this.normalize(
      frame.domain ||
      handoff.domain ||
      ""
    );

    const semanticIntent = this.normalize(
      frame.intent ||
      handoff.intent ||
      ""
    );

    const hasQuestion = this.hasQuestion(text, observations, thread);
    const isShort = text.split(" ").filter(Boolean).length <= 6;

    const speechAct = this.detectSpeechAct(text, observations, hasQuestion);
    const outputRequest = this.detectOutputRequest(text, observations, semanticIntent);
    const uncertaintyType = this.detectUncertaintyType(text, observations);
    const domain = this.detectDomain(text, observations, thread, semanticDomain);
    const userNeed = this.detectUserNeed(text, observations, semanticMeaning, semanticIntent, outputRequest);
    const relationshipStake = this.detectRelationshipStake(text, observations);
    const timePressure = this.detectTimePressure(text, observations);
    const referenceDependency = this.detectReferenceDependency(text, observations, isShort);
    const emotionalLoad = this.detectEmotionalLoad(text, observations);
    const decisionStructure = this.detectDecisionStructure(text, observations);

    return {
      rawText,
      normalizedText: text,

      speechAct,
      userNeed,
      domain,
      uncertaintyType,
      outputRequest,

      semanticFrame: {
        available: Boolean(semanticFrame),
        meaning: semanticMeaning || null,
        domain: semanticDomain || null,
        intent: semanticIntent || null,
        confidence: frame.confidence || semanticFrame?.confidence || null
      },

      relationshipStake,
      timePressure,
      referenceDependency,
      emotionalLoad,
      decisionStructure,

      hasQuestion,
      isShort,
      currentTurnCompleteEnough: !referenceDependency.needsPriorContext,

      authority: "semantic_signal_handoff_only"
    };
  },

  detectSpeechAct(text, observations, hasQuestion) {
    if (hasQuestion) return "question";
    if (this.hasAny(text, ["please", "can you", "send me", "give me", "make", "create", "update", "fix"])) {
      return "request_or_command";
    }
    if (this.hasAny(text, ["i feel", "i'm feeling", "i am feeling", "i'm upset", "i'm worried", "i don't know"])) {
      return "disclosure";
    }
    if (this.hasAny(text, ["remember", "don't forget", "save this", "from now on"])) {
      return "memory_instruction";
    }
    return "statement";
  },

  detectOutputRequest(text, observations, semanticIntent) {
    if (this.hasAny(text, ["send code", "full code", "paste", "replace", "update this file"])) return "code";
    if (this.hasAny(text, ["rewrite", "write", "draft", "make this sound", "email", "text message"])) return "written_text";
    if (this.hasAny(text, ["calculate", "how much", "convert", "percent"])) return "calculation";
    if (this.hasAny(text, ["what should", "should i", "best move", "next step", "what do i do"])) return "recommendation";
    if (semanticIntent.includes("calculate")) return "calculation";
    if (semanticIntent.includes("produce") || semanticIntent.includes("revise")) return "written_text";
    if (semanticIntent.includes("implement") || semanticIntent.includes("debug")) return "code";
    if (semanticIntent.includes("evaluate") || semanticIntent.includes("choose")) return "recommendation";
    return "answer";
  },

  detectUncertaintyType(text, observations) {
    if (this.hasAny(text, ["i don't know if", "i dont know if", "not sure if", "could it be", "was it because", "is it because"])) {
      return "cause_uncertainty";
    }

    if (this.hasAny(text, ["or", "either", "option", "choose between", "compare"])) {
      return "choice_uncertainty";
    }

    if (this.hasAny(text, ["what does that mean", "does that mean", "why", "how come"])) {
      return "meaning_or_explanation_uncertainty";
    }

    if (this.hasType(observations, "missing_anchor_signal") || this.hasType(observations, "reference_signal")) {
      return "reference_uncertainty";
    }

    return "none";
  },

  detectDomain(text, observations, thread, semanticDomain) {
    if (semanticDomain) {
      if (semanticDomain.includes("relationship") || semanticDomain.includes("family")) return "relationship_or_family";
      if (semanticDomain.includes("health") || semanticDomain.includes("medical") || semanticDomain.includes("body")) return "medical_or_body";
      if (semanticDomain.includes("animal")) return "animal_health_or_pet";
      if (semanticDomain.includes("builder") || semanticDomain.includes("code") || semanticDomain.includes("debug")) return "builder_or_system";
      if (semanticDomain.includes("writing")) return "writing";
      if (semanticDomain.includes("calculation") || semanticDomain.includes("math")) return "calculation";
      if (semanticDomain.includes("emotion")) return "emotion";
      if (semanticDomain.includes("memory")) return "memory";
      if (semanticDomain.includes("general") || semanticDomain.includes("knowledge")) return "general_understanding";
    }

    const threadDomains = thread.domainSignals || [];
    const strongestThreadDomain = threadDomains
      .slice()
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

    if (strongestThreadDomain?.value) return strongestThreadDomain.value;

    if (this.hasAny(text, ["cat", "dog", "pet", "kitten", "puppy", "vet", "flea", "tick"])) return "animal_health_or_pet";
    if (this.hasAny(text, ["pain", "fever", "bleeding", "pregnant", "chest", "breathing", "faint", "vomit", "diarrhea", "swallow", "symptom"])) return "medical_or_body";
    if (this.hasAny(text, ["code", "bug", "debug", "github", "function", "engine", "pipeline", "file", "javascript"])) return "builder_or_system";
    if (this.hasAny(text, ["wife", "husband", "spouse", "partner", "girlfriend", "boyfriend", "family", "kids", "children", "married"])) return "relationship_or_family";
    if (this.hasAny(text, ["money", "debt", "pay", "salary", "budget", "lease", "loan", "credit"])) return "financial";
    if (this.hasAny(text, ["work", "job", "boss", "manager", "coworker", "leadership", "policy", "report"])) return "work_or_accountability";
    if (this.hasAny(text, ["rewrite", "write", "draft", "email", "essay", "paper"])) return "writing";
    if (this.hasAny(text, ["calculate", "convert", "percent", "how much"])) return "calculation";

    if (this.hasType(observations, "relationship_reference")) return "relationship_or_family";
    if (this.hasType(observations, "body_symptom")) return "medical_or_body";
    if (this.hasType(observations, "building_reference")) return "builder_or_system";
    if (this.hasType(observations, "money_reference")) return "financial";
    if (this.hasType(observations, "work_reference")) return "work_or_accountability";

    return "general_understanding";
  },

  detectUserNeed(text, observations, semanticMeaning, semanticIntent, outputRequest) {
    if (outputRequest === "code") return "implementation_help";
    if (outputRequest === "written_text") return "produce_or_revise_text";
    if (outputRequest === "calculation") return "calculate";
    if (outputRequest === "recommendation") return "decision_or_action_guidance";

    if (
      semanticMeaning.includes("information") ||
      semanticIntent.includes("obtain") ||
      semanticIntent.includes("clarification") ||
      this.hasAny(text, ["why", "how", "what is", "what are", "explain"])
    ) {
      return "understanding";
    }

    if (this.hasAny(text, ["i'm upset", "i feel", "i'm worried", "sad", "angry", "hurt"])) {
      return "emotional_attunement";
    }

    if (this.hasAny(text, ["remember", "don't forget", "save this", "from now on"])) {
      return "memory_or_preference";
    }

    return "general_response";
  },

  detectRelationshipStake(text, observations) {
    const present =
      this.hasAny(text, ["wife", "husband", "spouse", "partner", "girlfriend", "boyfriend", "family", "kids", "children", "married"]) ||
      this.hasType(observations, "relationship_reference") ||
      this.hasType(observations, "family_reference");

    const tension =
      this.hasAny(text, ["upset", "hurt", "argument", "mad", "cold feet", "rushing", "pressure", "trust", "lied"]);

    return {
      present,
      tension,
      confidence: present ? (tension ? 0.86 : 0.74) : 0
    };
  },

  detectTimePressure(text, observations) {
    const present =
      this.hasAny(text, ["today", "tonight", "right now", "now", "urgent", "asap", "soon", "deadline"]) ||
      this.hasType(observations, "current_time");

    return {
      present,
      value: present ? "near_term_or_current" : "none",
      confidence: present ? 0.78 : 0
    };
  },

  detectReferenceDependency(text, observations, isShort) {
    const hasReference =
      this.hasAny(text, ["it", "that", "this", "her", "him", "they"]) ||
      this.hasType(observations, "reference_signal");

    const missingAnchor =
      this.hasType(observations, "missing_anchor_signal");

    return {
      hasReference,
      missingAnchor,
      needsPriorContext: Boolean(isShort && (hasReference || missingAnchor)),
      confidence: isShort && (hasReference || missingAnchor) ? 0.84 : 0.35
    };
  },

  detectEmotionalLoad(text, observations) {
    const present =
      this.hasAny(text, ["upset", "hurt", "sad", "mad", "angry", "worried", "scared", "stressed", "overwhelmed"]) ||
      this.hasType(observations, "emotion_word");

    return {
      present,
      intensity: present ? "low_to_moderate" : "none",
      confidence: present ? 0.72 : 0
    };
  },

  detectDecisionStructure(text, observations) {
    const hasOptions =
      this.hasAny(text, [" or ", "either", "option", "choose", "between"]) ||
      this.hasType(observations, "contrast_or_tradeoff_connector");

    const hasActionAsk =
      this.hasAny(text, ["what should", "should i", "what do i do", "next step", "best move"]);

    return {
      present: hasOptions || hasActionAsk,
      hasOptions,
      hasActionAsk,
      confidence: hasActionAsk ? 0.88 : hasOptions ? 0.76 : 0
    };
  },

  addSemanticCandidates(candidates, signals) {
    const s = signals;

    if (
      s.domain === "relationship_or_family" &&
      s.uncertaintyType === "cause_uncertainty" &&
      s.relationshipStake.present
    ) {
      this.add(candidates, {
        type: "relationship_causal_uncertainty",
        intent: "relationship_repair_or_clarity",
        score: 94,
        responseHint: "Help identify likely causes without pretending certainty; protect connection and give next step.",
        reasons: [
          "Relationship context is present.",
          "User is unsure why something happened.",
          "Best response should avoid fake certainty and recommend a calm repair step."
        ]
      });
    }

    if (
      s.domain === "relationship_or_family" &&
      s.decisionStructure.present
    ) {
      this.add(candidates, {
        type: "relationship_decision_or_repair",
        intent: "relationship_decision_support",
        score: 90,
        responseHint: "Name the relationship priority, separate possible causes, and recommend the next conversation step.",
        reasons: [
          "Relationship context includes decision or tradeoff structure."
        ]
      });
    }

    if (
      s.userNeed === "implementation_help" &&
      s.domain === "builder_or_system"
    ) {
      this.add(candidates, {
        type: "builder_task",
        intent: "implementation_help",
        score: 95,
        responseHint: "Help with code or system implementation.",
        reasons: [
          "Semantic signals indicate build/debug/implementation help."
        ]
      });
    }

    if (
      s.userNeed === "produce_or_revise_text" &&
      s.domain === "writing"
    ) {
      this.add(candidates, {
        type: "writing_task",
        intent: "produce_or_revise_text",
        score: 92,
        responseHint: "Produce or revise the requested text.",
        reasons: [
          "Semantic signals indicate writing output is requested."
        ]
      });
    }

    if (
      s.referenceDependency.needsPriorContext &&
      s.hasQuestion
    ) {
      this.add(candidates, {
        type: "contextual_follow_up_question",
        intent: "answer_using_prior_context",
        score: 88,
        responseHint: "Use prior context if available; do not ask again unless the anchor is missing.",
        reasons: [
          "Short question contains reference language and likely depends on prior context."
        ]
      });
    }

    if (
      s.userNeed === "understanding" &&
      s.domain === "general_understanding"
    ) {
      this.add(candidates, {
        type: "explanation_or_information_question",
        intent: "explain_or_answer",
        score: 82,
        responseHint: "Answer directly, then explain briefly.",
        reasons: [
          "User appears to want understanding or explanation."
        ]
      });
    }

    if (
      s.domain === "medical_or_body" &&
      s.userNeed !== "implementation_help"
    ) {
      this.add(candidates, {
        type: "medical_or_body_concern",
        intent: "health_context_support",
        score: 90,
        responseHint: "Give cautious practical guidance and name red flags when relevant.",
        reasons: [
          "Health/body context detected."
        ]
      });
    }

    if (
      s.domain === "animal_health_or_pet"
    ) {
      this.add(candidates, {
        type: "animal_health_or_pet_context",
        intent: "pet_health_support",
        score: 92,
        responseHint: "Treat as pet/animal health context, not human relationship context.",
        reasons: [
          "Animal or pet context detected."
        ]
      });
    }

    if (
      s.userNeed === "calculate" ||
      s.domain === "calculation"
    ) {
      this.add(candidates, {
        type: "calculation_task",
        intent: "calculate",
        score: 90,
        responseHint: "Calculate directly.",
        reasons: [
          "Calculation need detected."
        ]
      });
    }

    if (
      s.userNeed === "memory_or_preference"
    ) {
      this.add(candidates, {
        type: "memory_request",
        intent: "memory_or_preference",
        score: 94,
        responseHint: "Acknowledge and preserve the requested preference if allowed.",
        reasons: [
          "User is asking to remember or preserve a preference."
        ]
      });
    }
  },

  addQuestionCandidates(candidates, text, observations, thread, signals) {
    if (this.hasQuestion(text, observations, thread)) {
      this.add(candidates, {
        type: "question_or_follow_up",
        intent: "answer_question",
        score: 65,
        reasons: ["User is asking a question."]
      });
    }

    if (signals.userNeed === "decision_or_action_guidance") {
      this.add(candidates, {
        type: "decision_or_action_question",
        intent: "decision_or_action_guidance",
        score: 84,
        reasons: ["User is asking what action to take."]
      });
    }

    if (signals.uncertaintyType === "meaning_or_explanation_uncertainty") {
      this.add(candidates, {
        type: "explanation_or_possibility_question",
        intent: "explain_possibility",
        score: 78,
        reasons: ["User is asking for explanation or possibility testing."]
      });
    }
  },

  addTaskCandidates(candidates, text, signals) {
    if (signals.outputRequest === "code") {
      this.add(candidates, {
        type: "builder_task",
        intent: "implementation_help",
        score: 90,
        responseHint: "Help with code or system implementation.",
        reasons: ["User is working on code, files, or system behavior."]
      });
    }

    if (signals.outputRequest === "written_text") {
      this.add(candidates, {
        type: "writing_task",
        intent: "produce_or_revise_text",
        score: 86,
        reasons: ["User is asking for writing or rewriting help."]
      });
    }

    if (signals.outputRequest === "calculation") {
      this.add(candidates, {
        type: "calculation_task",
        intent: "calculate",
        score: 84,
        reasons: ["User is asking for calculation."]
      });
    }
  },

  addDomainCandidates(candidates, text, observations, thread, signals) {
    const domain = signals.domain;

    const domainMap = {
      animal_health_or_pet: {
        type: "animal_health_or_pet_context",
        intent: "pet_health_support",
        score: 92,
        responseHint: "Treat as pet/animal health context, not human relationship context.",
        reason: "Animal or pet context detected."
      },
      medical_or_body: {
        type: "medical_or_body_concern",
        intent: "health_context_support",
        score: 88,
        reason: "Health or body concern detected."
      },
      work_or_accountability: {
        type: "work_or_accountability_context",
        intent: "workplace_guidance",
        score: 86,
        reason: "Workplace or accountability context detected."
      },
      relationship_or_family: {
        type: "relationship_or_family_context",
        intent: "relationship_context_support",
        score: 84,
        reason: "Close relationship or family context detected."
      },
      financial: {
        type: "financial_or_resource_context",
        intent: "financial_resource_guidance",
        score: 82,
        reason: "Financial or resource context detected."
      }
    };

    const mapped = domainMap[domain];

    if (mapped) {
      this.add(candidates, {
        type: mapped.type,
        intent: mapped.intent,
        score: mapped.score,
        responseHint: mapped.responseHint,
        reasons: [mapped.reason]
      });
    }

    if (this.hasAny(text, ["trust", "honest", "honesty", "lied", "deny", "upset", "hurt", "argument", "cold feet"])) {
      this.add(candidates, {
        type: "interpersonal_trust_context",
        intent: "relationship_repair_or_clarity",
        score: 78,
        reasons: ["Trust, emotion, or interpersonal tension detected."]
      });
    }
  },

  addIntentCandidates(candidates, text, observations, thread, signals) {
    const intent =
      thread.resolvedMeaning?.intent ||
      thread.impliedQuestion?.type ||
      null;

    if (intent && intent !== "respond_normally") {
      this.add(candidates, {
        type: "thread_contextual_intent",
        intent,
        score: 82,
        reasons: [`Thread supplied intent: ${intent}.`]
      });
    }

    if (signals.timePressure.present && signals.domain === "relationship_or_family") {
      this.add(candidates, {
        type: "relationship_near_term_event",
        intent: "support_current_relationship_event",
        score: 82,
        reasons: ["Relationship issue is tied to a current or near-term event."]
      });
    }
  },

  hasQuestion(text, observations, thread) {
    return (
      text.includes("?") ||
      this.hasType(observations, "question_mark_count") ||
      this.hasType(observations, "question_phrase") ||
      Boolean(thread.impliedQuestion?.type)
    );
  },

  add(candidates, item) {
    if (!item?.type) return;

    const existing = candidates.find(c => c.type === item.type);

    if (existing) {
      existing.score = Math.min(100, existing.score + Math.round(item.score * 0.25));
      existing.reasons = [...new Set([...(existing.reasons || []), ...(item.reasons || [])])];

      if (!existing.responseHint && item.responseHint) {
        existing.responseHint = item.responseHint;
      }

      return;
    }

    candidates.push({
      ...item,
      confidence: this.confidenceLabel(item.score)
    });
  },

  rank(candidates = []) {
    return candidates
      .map(c => ({
        ...c,
        score: Math.max(0, Math.min(100, Number(c.score || 0))),
        confidence: this.confidenceLabel(c.score)
      }))
      .sort((a, b) => b.score - a.score);
  },

  confidenceLabel(score = 0) {
    if (score >= 85) return "high";
    if (score >= 65) return "medium";
    return "low";
  },

  hasType(observations = [], type = "") {
    return observations.some(o => o.type === type);
  },

  hasAny(text = "", terms = []) {
    const normalizedText = this.normalize(text);
    return terms.some(term => normalizedText.includes(this.normalize(term)));
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI UNIVERSAL CONVERSATION CLASSIFIER LOADED:",
  window.AriUniversalConversationClassifier?.version
);