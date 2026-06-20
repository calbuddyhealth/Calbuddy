// Ari Conversation Function Engine
// Purpose: Detect what the user is doing conversationally before lane/triage.
// V1.0.0 — Advisory Only

window.Ari = window.Ari || {};

window.AriConversationFunctionEngine = {
  version: "1.0.0",

  analyze(input = {}) {
    const summary = input.summary || input || {};
    const raw = summary.userMessage || summary.message || summary.input || "";
    const text = this.clean(raw);

    const observations =
      summary.observations ||
      summary.observationLedger ||
      summary.observerEvidence?.observations ||
      [];

    const functions = [];

    const add = (name, score, reason) => {
      if (!name || score <= 0) return;
      const existing = functions.find(f => f.name === name);
      if (existing) {
        existing.score = Math.min(100, existing.score + score);
        if (reason) existing.reasons.push(reason);
        return;
      }
      functions.push({ name, score: Math.min(100, score), reasons: reason ? [reason] : [] });
    };

    // Emotional disclosure
    if (/\b(i'?m|i am|feeling|feel|felt)\s+(sad|down|depressed|worried|scared|anxious|overwhelmed|lonely|angry|stressed|hurt)\b/.test(text)) {
      add("emotional_disclosure", 95, "User directly disclosed an emotional state.");
    }

    if (this.hasType(observations, "emotion_word")) {
      add("emotional_disclosure", 45, "Observer detected emotion language.");
    }

    // Boundary / preference
    if (/\b(not trying to fix|don'?t fix|just listen|just venting|that'?s all|i only want|i don'?t want advice|no advice)\b/.test(text)) {
      add("boundary_or_preference_statement", 95, "User stated a response preference or boundary.");
      add("emotional_disclosure", 35, "Boundary suggests presence may matter more than solving.");
    }

    // Correction / clarification
    if (/\b(i mean|i meant|i ment|no,?|not that|rather|instead)\b/.test(text)) {
      add("correction_or_clarification", 85, "User appears to be correcting or clarifying prior meaning.");
    }

    // Direct question
    if (/[?]$/.test(text) || /^(what|why|how|when|where|who|is|are|do|does|can|should|would|could)\b/.test(text)) {
      add("direct_question", 75, "User asked a direct question.");
    }

    // Instruction / action
    if (/\b(how do i|what should i do|steps|walk me through|show me how|what can i do)\b/.test(text)) {
      add("instruction_request", 85, "User requested guidance or steps.");
    }

    // Build/debug
    if (/\b(code|file|bug|error|debug|fix this|not working|function|engine|pipeline|github|vercel|supabase)\b/.test(text)) {
      add("build_or_debug_request", 80, "User used build/debug language.");
    }

    // Decision support
    if (/\b(should i|which one|better|choose|decide|worth it|pros and cons|compare)\b/.test(text)) {
      add("decision_support", 80, "User is asking for evaluation or choice support.");
    }

    // Continuation / follow-up
    if (/\b(this|that|it|they|them|same|one|what about|why|then what|next)\b/.test(text) && text.split(/\s+/).length <= 12) {
      add("continuation_or_follow_up", 75, "Short turn appears dependent on prior context.");
    }

    // Memory / identity
    if (/\b(remember|forget|save this|who are you|what are you|ari)\b/.test(text)) {
      add("memory_or_identity_request", 75, "User referenced memory or Ari identity.");
    }

    // Creative
    if (/\b(generate|create|draw|design|image|picture|logo|name ideas|write a story)\b/.test(text)) {
      add("creative_generation", 75, "User requested creative generation.");
    }

    // Safety / risk
    if (/\b(suicide|kill myself|hurt myself|chest pain|shortness of breath|bleeding|stroke|fainting|seizure|emergency)\b/.test(text)) {
      add("safety_or_risk_disclosure", 100, "Safety or urgent risk language detected.");
    }

    if (!functions.length) {
      add("general_conversation", 50, "No stronger conversation function detected.");
    }

    functions.sort((a, b) => b.score - a.score);

    const primaryFunction = functions[0]?.name || "general_conversation";
    const supportFunctions = functions.slice(1, 5).map(f => f.name);

    const blockedFunctions = this.getBlockedFunctions(primaryFunction, functions);

    return {
      conversationFunctionRan: true,
      conversationFunctionVersion: this.version,
      source: "ari-conversation-function-engine",

      rawUserMessage: raw,
      normalizedText: text,

      primaryFunction,
      supportFunctions,
      blockedFunctions,
      candidates: functions,

      responseBias: this.getResponseBias(primaryFunction),
      confidence: functions[0]?.score || 50,

      authority: "advisory_conversation_function_only",
      cannotSet: [
        "primaryLane",
        "triagePrimaryLane",
        "situationContractPrimary",
        "finalResponse",
        "riskLevel",
        "override"
      ]
    };
  },

  getBlockedFunctions(primary, functions = []) {
    const names = functions.map(f => f.name);

    if (primary === "emotional_disclosure" || names.includes("boundary_or_preference_statement")) {
      return ["build_or_debug_request", "instruction_request"];
    }

    if (primary === "build_or_debug_request") {
      return ["deep_emotional_processing"];
    }

    return [];
  },

  getResponseBias(primary) {
    const map = {
      emotional_disclosure: {
        preferredLaneBias: "emotion",
        responseShape: "presence_first",
        instruction: "Acknowledge emotion first. Do not immediately fix unless user asks."
      },
      boundary_or_preference_statement: {
        preferredLaneBias: "respect_boundary",
        responseShape: "respect_user_preference",
        instruction: "Respect the user's stated preference before offering solutions."
      },
      correction_or_clarification: {
        preferredLaneBias: "clarification",
        responseShape: "update_understanding",
        instruction: "Use corrected meaning and avoid defending the prior interpretation."
      },
      direct_question: {
        preferredLaneBias: "teacher",
        responseShape: "answer_directly",
        instruction: "Answer the question directly."
      },
      instruction_request: {
        preferredLaneBias: "action",
        responseShape: "steps",
        instruction: "Give practical steps."
      },
      build_or_debug_request: {
        preferredLaneBias: "builder",
        responseShape: "build_steps",
        instruction: "Help build or debug directly."
      },
      decision_support: {
        preferredLaneBias: "executive_decision",
        responseShape: "decision_framework",
        instruction: "Compare options and recommend clearly."
      }
    };

    return map[primary] || {
      preferredLaneBias: "general",
      responseShape: "normal",
      instruction: "Respond normally."
    };
  },

  hasType(observations = [], type) {
    return observations.some(o => o.type === type);
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
  "ARI CONVERSATION FUNCTION ENGINE LOADED:",
  window.AriConversationFunctionEngine?.version
);