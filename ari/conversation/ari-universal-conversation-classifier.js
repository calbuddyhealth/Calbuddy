// ari/conversation/ari-universal-conversation-classifier.js
// Ari Universal Conversation Classifier
// Purpose: Classify conversation type only. No routing, no final lane authority.
// V3.0.0 — Advisory Classification Only

window.Ari = window.Ari || {};

window.AriUniversalConversationClassifier = {
  version: "3.0.0",

  classify(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    );

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const thread = summary.threadUnderstanding || {};
    const candidates = [];

    this.addQuestionCandidates(candidates, text, observations, thread);
    this.addTaskCandidates(candidates, text, observations, thread);
    this.addDomainCandidates(candidates, text, observations, thread);
    this.addIntentCandidates(candidates, text, observations, thread);

    const ranked = this.rank(candidates);
    const top = ranked[0] || {
      type: "general_conversation",
      score: 50,
      confidence: "low",
      intent: "respond_normally",
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

      candidates: ranked.slice(0, 5),

      authority: "classification_only",
      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation"
      ]
    };
  },

  addQuestionCandidates(candidates, text, observations, thread) {
    if (this.hasQuestion(text, observations, thread)) {
      this.add(candidates, {
        type: "question_or_follow_up",
        intent: "answer_question",
        score: 65,
        reasons: ["User is asking a question."]
      });
    }

    if (this.hasAny(text, ["what should", "should i", "what do i do", "best move", "next step"])) {
      this.add(candidates, {
        type: "decision_or_action_question",
        intent: "decision_or_action_guidance",
        score: 82,
        reasons: ["User is asking what action to take."]
      });
    }

    if (this.hasAny(text, ["why", "how come", "what if", "could it be", "does that mean"])) {
      this.add(candidates, {
        type: "explanation_or_possibility_question",
        intent: "explain_possibility",
        score: 76,
        reasons: ["User is asking for explanation or possibility testing."]
      });
    }
  },

  addTaskCandidates(candidates, text) {
    if (this.hasAny(text, ["send code", "replace", "update this", "debug", "fix this", "github", "function", "engine", "pipeline"])) {
      this.add(candidates, {
        type: "builder_task",
        intent: "implementation_help",
        score: 90,
        responseHint: "Help with code or system implementation.",
        reasons: ["User is working on code, files, or system behavior."]
      });
    }

    if (this.hasAny(text, ["rewrite", "write", "draft", "make this sound", "format", "essay", "paper", "email"])) {
      this.add(candidates, {
        type: "writing_task",
        intent: "produce_or_revise_text",
        score: 86,
        reasons: ["User is asking for writing or rewriting help."]
      });
    }

    if (this.hasAny(text, ["calculate", "how many", "convert", "percent", "+", "-", "*", "/"])) {
      this.add(candidates, {
        type: "calculation_task",
        intent: "calculate",
        score: 78,
        reasons: ["User may be asking for calculation."]
      });
    }
  },

  addDomainCandidates(candidates, text, observations, thread) {
    const threadDomains = thread.domainSignals || [];
    threadDomains.forEach(signal => {
      this.add(candidates, {
        type: signal.value,
        intent: "domain_context",
        score: Math.round((signal.confidence || 0.7) * 90),
        reasons: [`Thread supplied domain signal: ${signal.value}.`]
      });
    });

    if (this.hasAny(text, ["cat", "dog", "pet", "kitten", "puppy", "vet"])) {
      this.add(candidates, {
        type: "animal_health_or_pet_context",
        intent: "pet_health_support",
        score: 92,
        responseHint: "Treat as pet/animal health context, not human relationship context.",
        reasons: ["Animal or pet context detected."]
      });
    }

    if (this.hasAny(text, ["pain", "fever", "bleeding", "pregnant", "chest", "breathing", "faint", "vomit", "diarrhea", "swallow"])) {
      this.add(candidates, {
        type: "medical_or_body_concern",
        intent: "health_context_support",
        score: 88,
        reasons: ["Health or body concern detected."]
      });
    }

    if (this.hasAny(text, ["coworker", "boss", "manager", "leadership", "team", "work", "job", "report", "policy", "cutting corners"])) {
      this.add(candidates, {
        type: "work_or_accountability_context",
        intent: "workplace_guidance",
        score: 86,
        reasons: ["Workplace or accountability context detected."]
      });
    }

    if (this.hasAny(text, ["wife", "husband", "spouse", "partner", "girlfriend", "boyfriend", "family", "kids", "children"])) {
      this.add(candidates, {
        type: "relationship_or_family_context",
        intent: "relationship_context_support",
        score: 84,
        reasons: ["Close relationship or family context detected."]
      });
    }

    if (this.hasAny(text, ["trust", "honest", "honesty", "lied", "deny", "upset", "hurt", "argument"])) {
      this.add(candidates, {
        type: "interpersonal_trust_context",
        intent: "relationship_repair_or_clarity",
        score: 76,
        reasons: ["Trust or interpersonal tension detected."]
      });
    }
  },

  addIntentCandidates(candidates, text, observations, thread) {
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

    if (this.hasAny(text, ["remember", "don't forget", "save this", "from now on"])) {
      this.add(candidates, {
        type: "memory_request",
        intent: "memory_or_preference",
        score: 90,
        reasons: ["User is asking to remember or preserve a preference."]
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
    return terms.some(term => text.includes(String(term).toLowerCase()));
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